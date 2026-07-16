from sqlmodel import SQLModel, Field
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime

class KitComponentLink(SQLModel, table=True):
    __tablename__ = "kit_components"
    kit_id: UUID = Field(foreign_key="kits.id", primary_key=True)
    product_id: UUID = Field(foreign_key="products.id", primary_key=True)
    quantity: int = Field(default=1)

class KitModel(SQLModel, table=True):
    __tablename__ = "kits"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
