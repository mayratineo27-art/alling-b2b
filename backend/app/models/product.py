from sqlmodel import SQLModel, Field, Column, JSON
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime
from decimal import Decimal

class ProductModel(SQLModel, table=True):
    __tablename__ = "products"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    slug: Optional[str] = None
    category: Optional[str] = None
    category_id: Optional[UUID] = Field(default=None, foreign_key="categories.id")
    brand: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    price_public: Decimal = Field(default=0, max_digits=10, decimal_places=2)
    stock: int = Field(default=0)
    reserved_stock: int = Field(default=0)
    is_active: bool = Field(default=True)
    is_featured: bool = Field(default=False)
    specs: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    image_gallery: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    sku: Optional[str] = None
    stock_visible_mode: str = Field(default="EXACT")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @classmethod
    def from_domain(cls, product):
        return cls(
            id=product.id,
            name=product.name,
            slug=product.slug,
            category=product.category,
            brand=product.brand,
            description=product.description,
            image_url=product.image_url,
            price_public=product.price_public,
            stock=product.stock,
            reserved_stock=product.reserved_stock,
            is_active=product.is_active,
            is_featured=product.is_featured,
            specs=product.specs,
            image_gallery=product.image_gallery,
            sku=product.sku,
            stock_visible_mode=getattr(product, 'stock_visible_mode', 'EXACT')
        )
