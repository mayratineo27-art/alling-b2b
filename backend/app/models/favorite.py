from sqlalchemy import Column, String, ForeignKey, DateTime, Uuid
from sqlalchemy.sql import func
from app.db.database import Base
import uuid

class FavoriteModel(Base):
    __tablename__ = "favorites"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # user_id es `uuid` nativo en Postgres (FK a users.id, uuid)
    user_id = Column(Uuid(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String, nullable=False, index=True)  # ID del producto
    created_at = Column(DateTime(timezone=True), server_default=func.now())
