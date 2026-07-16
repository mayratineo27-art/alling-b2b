"""Entidades de dominio — Catálogo (MOD-CAT-01)."""

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID


@dataclass(frozen=True, slots=True)
class Product:
    """Producto comercializable del catálogo."""

    id: UUID
    stock: int
    price_public: Decimal
    name: str = "Unnamed Product"
    slug: str | None = None
    category: str | None = None
    description: str | None = None
    reserved_stock: int = 0
    brand: str | None = None
    is_active: bool = True
    is_featured: bool = False
    specs: dict | None = None
    image_url: str | None = None
    image_gallery: list[str] | None = None
    sku: str | None = None
    stock_visible_mode: str = "EXACT"
