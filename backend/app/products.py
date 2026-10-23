import logging
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine


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
