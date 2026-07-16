"""
Modelo SQLAlchemy: FormatoUnicoItem

Ítems persistidos del agregado Formato Único.
"""

import uuid
from sqlalchemy import Column, String, DateTime, Numeric, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class FormatoUnicoItem(Base):
    __tablename__ = "formato_unico_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    formato_unico_id = Column(
        String,
        ForeignKey("formato_unico.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(String, nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    price_at_time = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    formato_unico = relationship("FormatoUnico", back_populates="items")

    __table_args__ = (
        Index("ix_fui_fu_id", "formato_unico_id"),
        Index("ix_fui_product_id", "product_id"),
    )