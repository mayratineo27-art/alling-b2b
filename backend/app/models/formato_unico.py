"""
Modelo SQLAlchemy: FormatoUnico (Formato Único)

Puente entre el agregado de dominio (dataclass) y la capa de persistencia.
Relaciones:
  User (1) → FormatoUnico (N)   [via customer_id]
  FormatoUnico (1) → FormatoUnicoItem (N)
  FormatoUnico (1) → Order (N)  [back_populates="orders"]
"""

import uuid
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Index, Text, Uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class FormatoUnico(Base):
    """
    Tabla de persistencia para el agregado FormatoUnico (MOD-FU-01).
    Estados FSM: BORRADOR → APROBADO → COTIZACION → PEDIDO → CONFIRMADO
                          ↘ CANCELADO | EXPIRADA | RECHAZADO
                          
    @sdd-module MOD-FU-01
    @sdd-schema FormatoUnico
    """
    __tablename__ = "formato_unico"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # FK al usuario propietario (puede ser None si es GUEST). customer_id es
    # `uuid` nativo en Postgres porque la FK a users.id (uuid) obliga a que
    # coincida el tipo; assigned_seller_id/current_order_id de abajo NO
    # tienen FK real, así que siguen en varchar y no se tocan.
    customer_id = Column(Uuid(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Estado FSM (MOD-FU-01 / FSM-01)
    state = Column(String, nullable=False, default="BORRADOR")

    # Referencia al Order activo actualmente (1:N histórico, 1 activo)
    # Permite múltiples Orders en historial; solo uno simultáneo activo
    current_order_id = Column(String, nullable=True)

    # Token de acceso para GUEST (sin sesión)
    order_token = Column(String, unique=True, nullable=True, index=True)

    # Datos de workflow SELLER / cotización persistidos en BD
    assigned_seller_id = Column(String, nullable=True, index=True)
    consultant_note = Column(Text, nullable=True)
    pdf_url = Column(Text, nullable=True)
    discount_percent = Column(Numeric(5, 2), nullable=False, default=0)

    # Subtotal calculado (AutoService recalcula en cada mutación)
    subtotal = Column(Numeric(10, 2), nullable=False, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # --- Relaciones ORM ---
    customer = relationship("User", backref="formatos_unicos")
    items = relationship("FormatoUnicoItem", back_populates="formato_unico", cascade="all, delete-orphan")
    orders   = relationship("Order", back_populates="formato_unico", cascade="all, delete-orphan")

    # Índice compuesto: garantiza que la búsqueda por customer_id + state sea eficiente
    __table_args__ = (
        Index("ix_fu_customer_state", "customer_id", "state"),
    )

    def __repr__(self) -> str:
        return f"<FormatoUnico id={self.id} state={self.state} customer={self.customer_id}>"
