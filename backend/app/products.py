import logging
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.database import engine
from app.rbac import AppRole, require_roles

from app.image_validation import validate_product_image
from app.storage import upload_product_image, delete_product_image

class ProductCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=150)
    category: str = Field(min_length=1, max_length=100)
    collection: str = Field(min_length=1, max_length=50)
    quantity: int = Field(ge=0)
    status: Literal["In Stock", "Low Stock", "Out of Stock"]


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/products",
    tags=["Products"],
)


class Product(BaseModel):
    id: int
    sku: str
    name: str
    category: str
    collection: str
    quantity: int = Field(ge=0)
    status: Literal["In Stock", "Low Stock", "Out of Stock"]
    image_path: str | None = None

class ProductUpdate(BaseModel):
    sku: str | None = Field(default=None, min_length=1, max_length=50)
    name: str | None = Field(default=None, min_length=1, max_length=150)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    collection: str | None = Field(default=None, min_length=1, max_length=50)
    quantity: int | None = Field(default=None, ge=0)
    status: Literal["In Stock", "Low Stock", "Out of Stock"] | None = None


@router.get(
    "",
    response_model=list[Product],
    dependencies=[
        Depends(
            require_roles(
                AppRole.ADMINISTRATOR,
                AppRole.INVENTORY_MANAGER,
                AppRole.VIEWER,
            )
        )
    ],
)
def get_products():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        id,
                        sku,
                        name,
                        category,
                        collection,
                        quantity,
                        status,
                        image_path
                    FROM public.products
                    ORDER BY id
                """)
            )

            return [
                Product.model_validate(row)
                for row in result.mappings().all()
            ]

    except SQLAlchemyError:
        logger.exception("Failed to retrieve products from PostgreSQL")
        raise HTTPException(
            status_code=503,
            detail="Inventory database is temporarily unavailable.",
        )

@router.post(
    "",
    response_model=Product,
    status_code=status.HTTP_201_CREATED,
    dependencies=[
        Depends(
            require_roles(
                AppRole.ADMINISTRATOR,
                AppRole.INVENTORY_MANAGER,
            )
        )
    ],
)
def create_product(product: ProductCreate):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    INSERT INTO public.products (
                        sku,
                        name,
                        category,
                        collection,
                        quantity,
                        status
                    )
                    VALUES (
                        :sku,
                        :name,
                        :category,
                        :collection,
                        :quantity,
                        :status
                    )
                    RETURNING
                        id,
                        sku,
                        name,
                        category,
                        collection,
                        quantity,
                        status,
                        image_path
                """),
                product.model_dump(),
            )

            created_product = Product.model_validate(
                result.mappings().one()
            )

        return created_product

    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="A product with this SKU already exists.",
        )

    except SQLAlchemyError:
        logger.exception("Failed to create product")
        raise HTTPException(
            status_code=503,
            detail="Unable to create product at this time.",
        )

@router.patch(
    "/{product_id}",
    response_model=Product,
    dependencies=[
        Depends(
            require_roles(
                AppRole.ADMINISTRATOR,
                AppRole.INVENTORY_MANAGER,
            )
        )
    ],
)
def update_product(product_id: int, updates: ProductUpdate):
    # Only include fields supplied in the request.
    changes = updates.model_dump(exclude_unset=True)

    # Reject explicitly supplied null values.
    if any(value is None for value in changes.values()):
        raise HTTPException(
            status_code=422,
            detail="Product fields cannot be null.",
        )

    try:
        with engine.begin() as connection:
            # Confirm the product exists.
            existing = connection.execute(
                text("""
                    SELECT id, sku, name, category,
                        collection, quantity, status, image_path
                    FROM public.products
                    WHERE id = :product_id
                """),
                {"product_id": product_id},
            ).first()

            if existing is None:
                raise HTTPException(
                    status_code=404,
                    detail="Product not found.",
                )

            if not changes:
                result = connection.execute(
                    text("""
                        SELECT id, sku, name, category,
                               collection, quantity, status, image_path
                        FROM public.products
                        WHERE id = :product_id
                    """),
                    {"product_id": product_id},
                )
            else:
                # Column names come only from validated model fields.
                assignments = ", ".join(
                    f"{field} = :{field}" for field in changes
                )

                result = connection.execute(
                    text(f"""
                        UPDATE public.products
                        SET {assignments}
                        WHERE id = :product_id
                        RETURNING id, sku, name, category,
                                  collection, quantity, status, image_path
                    """),
                    {**changes, "product_id": product_id},
                )

            return Product.model_validate(result.mappings().one())

    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="A product with this SKU already exists.",
        )
    except SQLAlchemyError:
        logger.exception("Failed to update product %s", product_id)
        raise HTTPException(
            status_code=503,
            detail="Unable to update product at this time.",
        )
@router.post(
    "/{product_id}/image",
    response_model=Product,
    dependencies=[
        Depends(
            require_roles(
                AppRole.ADMINISTRATOR,
                AppRole.INVENTORY_MANAGER,
            )
        )
    ],
)
async def upload_product_image_endpoint(
    product_id: int,
    file: UploadFile = File(...),
):
    """Validate, upload, and associate an image with a product."""

    if product_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="Product ID must be positive.",
        )

    # Verify the product exists before uploading.
    # Verify the product exists and capture its current image path.
    try:
        with engine.connect() as connection:
            existing = connection.execute(
                text("""
                    SELECT id, image_path
                    FROM public.products
                    WHERE id = :product_id
                """),
                {"product_id": product_id},
            ).mappings().first()

        if existing is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found.",
            )

    except SQLAlchemyError:
        logger.exception("Failed to verify product %s", product_id)
        raise HTTPException(
            status_code=503,
            detail="Inventory database is temporarily unavailable.",
        ) from None

    # Capture the current image path for concurrency protection.
    previous_image_path = existing["image_path"]

    # Validate and normalize the uploaded image.
    contents, media_type, extension = await validate_product_image(file)

    image_path = None

    try:
        # Store the validated image under a unique path.
        image_path = upload_product_image(
            product_id=product_id,
            contents=contents,
            media_type=media_type,
            extension=extension,
        )

        # Associate the uploaded image with the product.
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    UPDATE public.products
                    SET image_path = :image_path
                    WHERE id = :product_id
                    AND image_path IS NOT DISTINCT FROM :previous_image_path
                    RETURNING
                        id, sku, name, category,
                        collection, quantity, status, image_path
                """),
               {
                    "image_path": image_path,
                    "product_id": product_id,
                    "previous_image_path": previous_image_path,
                },
            ).mappings().first()

            if result is None:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Product image changed during upload. "
                        "Refresh the product and try again."
                    ),
                )

            updated_product = Product.model_validate(result)

        # The database transaction has committed successfully.
        # Retain the previous image for deferred orphan review.
        # No Storage deletion occurs after a successful replacement.
        if previous_image_path and previous_image_path != image_path:
            logger.info(
                "Previous image retained for deferred cleanup review "
                "for product %s",
                product_id,
            )

        return updated_product

        return updated_product

    except Exception as exc:
        # If a new file was uploaded, attempt to remove it.
        if image_path is not None:
            try:
                delete_product_image(
                    image_path=image_path,
                    product_id=product_id,
                )
            except Exception:
                logger.exception(
                    "Failed to clean up uploaded image for product %s",
                    product_id,
                )

        if isinstance(exc, HTTPException):
            raise

        logger.exception(
            "Image upload failed for product %s",
            product_id,
        )

        raise HTTPException(
            status_code=503,
            detail="Unable to save product image at this time.",
        ) from None


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[
        Depends(require_roles(AppRole.ADMINISTRATOR))
    ],
)
def delete_product(product_id: int):
    with engine.begin() as connection:
        result = connection.execute(
            text("""
                DELETE FROM public.products
                WHERE id = :product_id
                RETURNING id
            """),
            {"product_id": product_id},
        )

        deleted_product = result.fetchone()

        if deleted_product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

    return None