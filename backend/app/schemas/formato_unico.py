from pydantic import BaseModel
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class FormatoUnicoItemSchema(BaseModel):
    model_config = {"from_attributes": True}
    
    product_id: UUID
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    product_name: Optional[str] = None
    sku: Optional[str] = None
    stock_disponible: Optional[int] = None
    kit_id: Optional[UUID] = None
    kit_name: Optional[str] = None

class FormatoResponseSchema(BaseModel):
    model_config = {"from_attributes": True}
    
    id: UUID
    customer_id: Optional[UUID] = None
    state: str
    items: List[FormatoUnicoItemSchema]
    subtotal: Decimal
    updated_at: Optional[datetime] = None
    consultant_note: Optional[str] = None
    pdf_url: Optional[str] = None
