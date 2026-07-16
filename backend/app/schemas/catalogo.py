from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import Field, computed_field

class ProductResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    price_public: Decimal
    slug: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    
    # Exclude from serialization to prevent raw data exposure
    stock: int = Field(exclude=True, default=0)
    reserved_stock: int = Field(exclude=True, default=0)
    stock_visible_mode: str = Field(exclude=True, default="EXACT")

    @computed_field
    @property
    def stock_display(self) -> str:
        avail = self.stock - self.reserved_stock
        if avail <= 0:
            return "Agotado"
        if self.stock_visible_mode == "BOOLEAN":
            return "En Stock"
        if self.stock_visible_mode == "RANGE":
            return ">10 unidades" if avail > 10 else "Pocas unidades"
        return f"{avail} unidades"

class LandingProductSchema(ProductResponseSchema):
    """Variante para Landing Page (RF-CAT-004): destacados/novedades se muestran
    sin precio a GUEST (CA-CAT-004), a diferencia del listado de catálogo."""
    price_public: Decimal = Field(exclude=True, default=Decimal(0))

class ProductDetailSchema(ProductResponseSchema):
    specs: Optional[dict] = None
    image_gallery: Optional[list[str]] = None

    @computed_field
    @property
    def telegram_query_url(self) -> str:
        # Pre-arma el enlace a Telegram
        import urllib.parse
        text = f"Hola, tengo una consulta sobre el producto {self.name} (SKU: {self.id})"
        encoded_text = urllib.parse.quote(text)
        return f"https://t.me/TuBot?text={encoded_text}"

class CategoryResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    nombre: str
    count: int

class LandingResponseSchema(BaseModel):
    destacados: list[LandingProductSchema]
    novedades: list[LandingProductSchema]
    categorias_conteo: list[CategoryResponseSchema]
