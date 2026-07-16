from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import List
from decimal import Decimal

class KitComponentSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: UUID
    name: str
    quantity: int

class KitResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    description: str | None = None
    image_url: str | None = None
    components: List[KitComponentSchema]
    precio_total: Decimal
    stock_disponible: int
