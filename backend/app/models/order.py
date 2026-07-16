"""
Modelo SQLAlchemy: Order (Pedido)

Relación diseñada en MOD-CHK-01 y MOD-FU-01:
  User (1) → FormatoUnico (N) → Order (N)

Un FormatoUnico puede tener múltiples Orders históricos (cardinalidad 1:N),
pero solo uno activo simultáneamente (invariante: FormatoUnico.current_order_id).
"""

import enum
import uuid
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class OrderStatus(str, enum.Enum):
    """
    Estados del FSM de Order (FSM-02).
    Transiciones válidas (MOD-CHK-01):
      PENDING_PAYMENT → PAID        (ORD-T-02: webhook pago confirmado)
      PENDING_PAYMENT → CANCELLED   (ORD-T-03: pago fallido / cancelación manual)
      PAID            → READY_TO_SHIP (ORD-T-04: SELLER confirma despacho)
      READY_TO_SHIP   → SHIPPED     (ORD-T-05: guía de envío generada)
    """
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID            = "PAID"
    READY_TO_SHIP   = "READY_TO_SHIP"
    SHIPPED         = "SHIPPED"
    CANCELLED       = "CANCELLED"


class Order(Base):
    """
    Agregado Order — representa un pedido generado desde un FormatoUnico.

    Campos definidos en:
      - OPS-CHK-001: shipping_address, dni_or_ruc, document_type
      - OPS-CHK-002: shipping_cost, total_amount
      - OPS-CHK-003: payment_preference_id
      - OPS-CHK-004: payment_method
      - OPS-CHK-005: cancellation_reason, cancelled_by
    """
    __tablename__ = "orders"

    # PK
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # FK principal: Order pertenece a un FormatoUnico (MOD-FU-01 cardinalidad 1:N)
    # Índice explícito según pendiente documentado en MOD-CHK-01 § "Impacto en BD"
    formato_unico_id = Column(
        String,
        ForeignKey("formato_unico.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # --- FSM ---
    status = Column(
        SAEnum(OrderStatus, name="order_status_enum"),
        nullable=False,
        default=OrderStatus.PENDING_PAYMENT,
    )

    # --- OPS-CHK-001: Datos de envío y facturación ---
    shipping_address = Column(String,   nullable=True)
    dni_or_ruc       = Column(String,   nullable=True)
    document_type    = Column(String,   nullable=True)   # "DNI" | "RUC"

    # --- OPS-CHK-002: Costos ---
    shipping_cost = Column(Float, nullable=True,  default=0.0)
    total_amount  = Column(Float, nullable=False, default=0.0)

    # --- OPS-CHK-003: Referencia de pago (preferencia MercadoPago) ---
    payment_preference_id = Column(String, nullable=True)

    # --- OPS-CHK-004: Método de pago (fijado por webhook PAID) ---
    payment_method = Column(String, nullable=True)

    # --- OPS-CHK-005: Cancelación ---
    cancellation_reason = Column(Text,   nullable=True)
    cancelled_by        = Column(String, nullable=True)   # "CUSTOMER" | "SYSTEM"

    # --- order_token: para acceso de GUEST sin sesión (OPS-CHK-006) ---
    order_token = Column(String, unique=True, nullable=True, index=True)

    # --- Timestamps ---
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # --- Relación ORM (lectura) ---
    formato_unico = relationship("FormatoUnico", back_populates="orders")

    def __repr__(self) -> str:
        return f"<Order id={self.id} status={self.status} fu={self.formato_unico_id}>"
