"""
Modelo SQLAlchemy: RefreshToken (RF-AUT-009)

Token opaco de larga duración (30 días) que permite renovar el access_token
(JWT, 60 min) sin forzar al usuario a volver a iniciar sesión. Se persiste
solo el hash SHA-256 del valor — nunca el plaintext — para poder revocarlo
(logout, rotación) sin que una fuga de la base de datos exponga un secreto
reutilizable directamente.
"""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Uuid
from sqlalchemy.sql import func
from app.db.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # user_id es `uuid` nativo en Postgres (FK a users.id, uuid)
    user_id = Column(Uuid(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<RefreshToken id={self.id} user_id={self.user_id} revoked={self.revoked_at is not None}>"
