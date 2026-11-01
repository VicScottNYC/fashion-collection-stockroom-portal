import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

from uuid import uuid4
import re

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BACKEND_DIR / ".env")


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Initialize and reuse the backend Supabase client."""
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SECRET_KEY"]

    return create_client(url, key)


def get_storage_bucket() -> str:
    """Return the configured product image bucket."""
    return os.environ["SUPABASE_STORAGE_BUCKET"]


def list_product_images(path: str = "") -> list:
    """List objects in the product image bucket."""
    client = get_supabase_client()
    bucket = get_storage_bucket()

    return client.storage.from_(bucket).list(path)

def upload_product_image(
    product_id: int,
    contents: bytes,
    media_type: str,
    extension: str,
) -> str:
    """Upload a validated product image using a unique storage path."""

    if product_id <= 0:
        raise ValueError("Product ID must be positive.")

    allowed_types = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }

    if allowed_types.get(media_type) != extension:
        raise ValueError("Invalid image media type or extension.")

    if not contents or len(contents) > 5 * 1024 * 1024:
        raise ValueError("Invalid image size.")

    client = get_supabase_client()
    bucket = get_storage_bucket()

    image_path = f"products/{product_id}/{uuid4().hex}.{extension}"

    client.storage.from_(bucket).upload(
        path=image_path,
        file=contents,
        file_options={
            "content-type": media_type,
            "upsert": "false",
        },
    )

    return image_path

def validate_managed_image_path(
    image_path: str,
    product_id: int,
) -> None:
    """Validate that an image path belongs to the specified product."""

    if product_id <= 0:
        raise ValueError("Product ID must be positive.")

    pattern = (
        rf"^products/{product_id}/"
        r"[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}\."
        r"(jpg|jpeg|png|webp)$"
    )

    if not isinstance(image_path, str) or not re.fullmatch(
        pattern, image_path
    ):
        raise ValueError(
            "Invalid image path or image does not belong to this product."
        )

def is_product_image_referenced(image_path: str) -> bool:
    """Check whether any product currently references this image."""

    from sqlalchemy import text
    from app.database import engine

    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT EXISTS (
                    SELECT 1
                    FROM public.products
                    WHERE image_path = :image_path
                )
            """),
            {"image_path": image_path},
        ).scalar_one()

    return bool(result)

def delete_product_image(
    image_path: str,
    product_id: int,
) -> None:
    """Delete a product image only when no database record references it."""

    validate_managed_image_path(
        image_path=image_path,
        product_id=product_id,
    )

    if is_product_image_referenced(image_path):
        raise ValueError(
            "Cannot delete image: it is still referenced by a product."
        )

    client = get_supabase_client()
    bucket = get_storage_bucket()

    client.storage.from_(bucket).remove([image_path])
