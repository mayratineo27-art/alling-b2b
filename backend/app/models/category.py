from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime

class CategoryModel(SQLModel, table=True):
    __tablename__ = "categories"

    id: UUID = Field(sa_column_kwargs={"primary_key": True}, default_factory=uuid4)
    name: str = Field(index=True, unique=True)
    slug: str = Field(index=True, unique=True)
    description: Optional[str] = None
    icon: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
