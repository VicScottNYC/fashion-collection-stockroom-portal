from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel, Field


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


products = [
    Product(
        id=1,
        sku="FW26-JKT-001",
        name="Wool Tailored Jacket",
        category="Outerwear",
        collection="FW26",
        quantity=48,
        status="In Stock",
    ),
    Product(
        id=2,
        sku="FW26-KNT-002",
        name="Cashmere Knit Sweater",
        category="Knitwear",
        collection="FW26",
        quantity=8,
        status="Low Stock",
    ),
    Product(
        id=3,
        sku="SS27-DRS-003",
        name="Silk Midi Dress",
        category="Dresses",
        collection="SS27",
        quantity=0,
        status="Out of Stock",
    ),
    Product(
        id=4,
        sku="SS27-TRS-004",
        name="Wide-Leg Trousers",
        category="Trousers",
        collection="SS27",
        quantity=120,
        status="In Stock",
    ),

]

@router.get("", response_model=list[Product])
def get_products():
    return products