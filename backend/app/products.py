import logging
from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.database import engine

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

class ProductUpdate(BaseModel):
    sku: str | None = Field(default=None, min_length=1, max_length=50)
    name: str | None = Field(default=None, min_length=1, max_length=150)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    collection: str | None = Field(default=None, min_length=1, max_length=50)
    quantity: int | None = Field(default=None, ge=0)
    status: Literal["In Stock", "Low Stock", "Out of Stock"] | None = None


@router.get("", response_model=list[Product])
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
                        status
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
                        status
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

@router.patch("/{product_id}", response_model=Product)
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
                    SELECT id
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
                               collection, quantity, status
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
                                  collection, quantity, status
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
    
@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
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