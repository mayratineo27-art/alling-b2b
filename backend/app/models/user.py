from sqlalchemy import Column, String, DateTime, Boolean, Index, Uuid
from sqlalchemy.sql import func
from app.db.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    # users.id es tipo `uuid` nativo en Postgres (migrado manualmente, fuera
    # de Alembic). Uuid(as_uuid=False) refleja ese tipo real en la BD sin
    # cambiar el valor Python: sigue siendo str, como antes.
    id = Column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    google_id = Column(String, unique=True, nullable=True, index=True)
    role = Column(String, nullable=False, default="CUSTOMER", index=True)
    auth_provider = Column(String, nullable=False, default="LOCAL")
    password_hash = Column(String, nullable=True)
    mfa_enabled = Column(Boolean, nullable=False, default=False)
    mfa_secret = Column(String, nullable=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"
