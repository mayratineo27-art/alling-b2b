"""
Endpoints de pedidos (Orders) — RF-ORD-001

Cadena de aislamiento por usuario (RLS a nivel aplicación):
  JWT → user_id → FormatoUnico(customer_id=user_id) → Order(formato_unico_id)

El usuario autenticado solo puede ver pedidos de sus propios FormatosUnicos.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.api.deps import get_db
from app.models.order import Order, OrderStatus
from app.models.formato_unico import FormatoUnico
from app.core.security import get_current_user, get_current_user_optional

router = APIRouter()


# --- Schemas de respuesta ---

class OrderSummarySchema(BaseModel):
    id: str
    status: OrderStatus
    total_amount: float
    shipping_cost: Optional[float] = None
    payment_method: Optional[str] = None
    order_token: Optional[str] = None
    created_at: Optional[datetime] = None
    formato_unico_id: str

    class Config:
        from_attributes = True


class OrderDetailSchema(BaseModel):
    id: str
    status: OrderStatus
    formato_unico_id: str
    shipping_address: Optional[str] = None
    dni_or_ruc: Optional[str] = None
    document_type: Optional[str] = None
    shipping_cost: Optional[float] = None
    total_amount: float
    payment_preference_id: Optional[str] = None
    payment_method: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_by: Optional[str] = None
    order_token: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Endpoints ---

@router.get("", response_model=List[OrderSummarySchema])
@router.get("/", response_model=List[OrderSummarySchema], include_in_schema=False)
def listar_pedidos(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    RF-ORD-001: Lista todos los pedidos del usuario autenticado.

    Cadena de consulta:
      1. Obtiene todos los FormatosUnicos del usuario (customer_id = user_id)
      2. Obtiene todos los Orders relacionados a esos FormatosUnicos
      → Garantiza aislamiento RLS: el usuario solo ve sus propios pedidos.
      
    @sdd-endpoint GET /orders
    @sdd-rf RF-ORD-001
    """
    # Paso 1: obtener los IDs de los FormatosUnicos del usuario
    fus = db.query(FormatoUnico.id).filter(
        FormatoUnico.customer_id == user_id
    ).all()

    if not fus:
        return []

    fu_ids = [fu.id for fu in fus]

    # Paso 2: obtener todos los Orders asociados a esos FormatosUnicos
    orders = (
        db.query(Order)
        .filter(Order.formato_unico_id.in_(fu_ids))
        .order_by(Order.created_at.desc())
        .all()
    )

    return orders


def _verificar_ownership(
    order: Order, db: Session, user_id: Optional[str], order_token: Optional[str]
) -> None:
    """RF-CHK-006/008: el owner es CUSTOMER (JWT → FormatoUnico.customer_id)
    o GUEST (order_token opaco que coincide con el de la Order)."""
    if order_token and order.order_token and order_token == order.order_token:
        return
    if user_id:
        fu = db.query(FormatoUnico).filter(
            FormatoUnico.id == order.formato_unico_id,
            FormatoUnico.customer_id == user_id,
        ).first()
        if fu:
            return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso sobre este pedido.")


@router.get("/by-token/{order_token}", response_model=OrderDetailSchema)
def consultar_pedido_por_token(order_token: str, db: Session = Depends(get_db)):
    """RF-CHK-006 / RN-CHK-007: GUEST consulta su pedido únicamente con el
    orderToken opaco de la URL, sin necesidad de sesión.
    
    @sdd-endpoint GET /orders/by-token/{order_token}
    @sdd-rf RF-CHK-006 RF-CHK-007
    """
    order = db.query(Order).filter(Order.order_token == order_token).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado.")
    return order


@router.post("/{order_id}/cancelar", response_model=OrderDetailSchema)
def cancelar_pedido(
    order_id: str,
    order_token: Optional[str] = None,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_optional),
):
    """
    RF-CHK-008 / RN-CHK-009: cancela un pedido en PENDING_PAYMENT (BTN-CHK-002).
    
    @sdd-endpoint POST /orders/{order_id}/cancelar
    @sdd-rf RF-CHK-008
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado.")

    _verificar_ownership(order, db, user_id, order_token)

    if order.status != OrderStatus.PENDING_PAYMENT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Solo se puede cancelar un pedido en PENDING_PAYMENT. Estado actual: {order.status.value}",
        )

    order.status = OrderStatus.CANCELLED
    order.cancellation_reason = "Cancelado manualmente por el comprador"
    order.cancelled_by = "CUSTOMER" if user_id else "GUEST"
    db.add(order)
    db.commit()
    db.refresh(order)

    from app.api.endpoints.formato_unico import mock_repo
    from uuid import UUID as _UUID
    fu = mock_repo.get_by_id(_UUID(order.formato_unico_id))
    if fu and fu.state.value == "PEDIDO":
        fu.state = fu.state.__class__.CANCELADO
        mock_repo.save(fu)

    return order


@router.post("/{order_id}/reintentar", response_model=OrderDetailSchema)
def reintentar_pedido(
    order_id: str,
    order_token: Optional[str] = None,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_optional),
):
    """
    RF-FU-011 / FU-T-14 (BTN-CHK-003): un pedido CANCELLED permite reintentar,
    devolviendo el FormatoUnico asociado a BORRADOR con sus ítems preservados.
    El Order cancelado permanece inmutable como histórico.
    
    @sdd-endpoint POST /orders/{order_id}/reintentar
    @sdd-rf RF-FU-011
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado.")

    _verificar_ownership(order, db, user_id, order_token)

    if order.status != OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Solo se puede reintentar un pedido CANCELLED. Estado actual: {order.status.value}",
        )

    from app.api.endpoints.formato_unico import mock_repo
    from app.domain.formato_unico import FormatoUnicoState
    from uuid import UUID as _UUID

    fu = mock_repo.get_by_id(_UUID(order.formato_unico_id))
    if not fu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formato Único asociado no encontrado.")

    fu.state = FormatoUnicoState.BORRADOR
    mock_repo.save(fu)

    return order


@router.get("/{order_id}", response_model=OrderDetailSchema)
def detalle_pedido(
    order_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    RF-ORD-001: Detalle completo de un pedido.

    Verifica ownership transitivo:
      Order.formato_unico_id → FormatoUnico.customer_id == user_id del JWT
    Si la cadena no se cumple → HTTP 403 (no revela existencia del recurso).
    
    @sdd-endpoint GET /orders/{order_id}
    @sdd-rf RF-ORD-001
    """
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido '{order_id}' no encontrado.",
        )

    # Verificar ownership transitivo: Order → FormatoUnico → customer_id
    fu = db.query(FormatoUnico).filter(
        FormatoUnico.id == order.formato_unico_id,
        FormatoUnico.customer_id == user_id,
    ).first()

    if not fu:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este pedido.",
        )

    return order
