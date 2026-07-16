"""Entidades de dominio — Formato Único (MOD-FU-01)."""

from dataclasses import dataclass, field
from decimal import Decimal
from enum import StrEnum
from uuid import UUID, uuid4
from datetime import datetime


class FormatoUnicoState(StrEnum):
    """Estados válidos del agregado FormatoUnico (FSM-01)."""

    BORRADOR = "BORRADOR"
    APROBADO = "APROBADO"
    COTIZACION = "COTIZACION"
    CONSULTA = "CONSULTA"
    PEDIDO = "PEDIDO"
    CONFIRMADO = "CONFIRMADO"
    RESUELTA = "RESUELTA"
    EXPIRADA = "EXPIRADA"
    CANCELADO = "CANCELADO"
    RECHAZADO = "RECHAZADO"


@dataclass(frozen=True, slots=True)
class FormatoUnicoItem:
    """Ítem dentro de un Formato Único."""

    product_id: UUID
    quantity: int
    unit_price: Decimal
    # Trazabilidad: si el ítem provino de un Kit pre-armado (agregar_kit),
    # se preserva de dónde salió — antes se descomponía en productos sueltos
    # sin ningún rastro de "esto vino del Kit X" (RF-CAT-006, OPS-CAT-004).
    kit_id: UUID | None = None
    kit_name: str | None = None

    @property
    def subtotal(self) -> Decimal:
        """Subtotal del ítem según precio vigente del catálogo (AUTO-FU-001)."""
        return self.unit_price * self.quantity


@dataclass(slots=True)
class FormatoUnico:
    """Agregado raíz del Formato Único."""

    state: FormatoUnicoState
    id: UUID = field(default_factory=uuid4)
    customer_id: UUID | None = None
    order_token: str | None = None
    assigned_seller_id: str | None = None
    consultant_note: str | None = None
    pdf_url: str | None = None
    items: list[FormatoUnicoItem] = field(default_factory=list)
    subtotal: Decimal = field(default_factory=lambda: Decimal("0.00"))
    discount_percent: Decimal = field(default_factory=lambda: Decimal("0.00"))
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def recalcular_subtotal(self) -> None:
        """Recalcula el subtotal del FU a partir de sus ítems, aplicando descuento."""
        total = sum((item.subtotal for item in self.items), Decimal("0.00"))
        self.subtotal = total * (1 - self.discount_percent / 100)
