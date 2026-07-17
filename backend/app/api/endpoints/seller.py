"""
MOD-SEL-01 — Panel SELLER (Stock, Pedidos, Guías)
RF-SEL-001 a RF-SEL-007

Endpoints:
  GET   /seller/stock                        → RF-SEL-001: listar productos con stock real
  PATCH /seller/stock/{product_id}           → RF-SEL-002: actualizar stock
  PATCH /seller/stock/{product_id}/umbral    → RF-SEL-003: configurar umbral mínimo
  GET   /seller/pedidos                      → RF-SEL-004: cola de pedidos
  POST  /seller/pedidos/{order_id}/guia      → RF-SEL-005: generar guía de envío
"""

import uuid
import dataclasses
from typing import List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime

from app.api.deps import get_db
from app.core.security import oauth2_scheme
from app.services.auth_service import AuthService
from app.models.order import Order, OrderStatus
from app.models.product import ProductModel
from app.models.system_config import SystemConfigModel

router = APIRouter()


# ─── Role guard ─────────────────────────────────────────────────────────────

def get_current_user_with_role(token: str = Depends(oauth2_scheme)) -> Tuple[str, str]:
    """
    Validates a JWT and returns (user_id, role).
    Raises HTTP 401 on invalid/missing tokens.
    """
    import jwt as pyjwt

    try:
        payload = AuthService.decodificar_token(token)
        user_id: str = payload.get("sub")
        role: str = payload.get("role", "CUSTOMER")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
            )
        return user_id, role
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
        )
    except pyjwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )


def require_seller(
    token: str = Depends(oauth2_scheme),
) -> str:
    """
    Dependency: requires role == SELLER (or ADMIN).
    Calls get_current_user_with_role via module reference so that
    unit tests can patch it with unittest.mock.patch.
    Returns the user_id on success; raises HTTP 403 otherwise.
    """
    import sys
    # Resolve the function through the module so patches applied by tests take effect
    _this_module = sys.modules[__name__]
    user_id, role = _this_module.get_current_user_with_role(token)
    if role not in ("SELLER", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido a SELLER",
        )
    return user_id


# ─── Schemas ────────────────────────────────────────────────────────────────

class ProductStockSchema(BaseModel):
    product_id: str
    name: str
    sku: Optional[str] = None
    stock_total: int
    reserved_stock: int
    stock_real: int
    stock_min_threshold: int
    stock_alert: bool  # True when stock_real <= stock_min_threshold


class UpdateStockSchema(BaseModel):
    stock: int = Field(..., ge=0, description="Stock total. No puede ser negativo (RN-SEL-001)")


class UpdateUmbralSchema(BaseModel):
    stock_min_threshold: int = Field(..., ge=0, description="Umbral mínimo de alerta de stock")


class OrderQueueSchema(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    status: str
    formato_unico_id: str
    total_amount: float
    shipping_address: Optional[str] = None
    created_at: Optional[datetime] = None


class GenerarGuiaSchema(BaseModel):
    weight_kg: float = Field(..., gt=0, description="Peso en kg. Debe ser > 0")
    packages_count: int = Field(..., ge=1, description="Número de bultos. Mínimo 1")
    notes: Optional[str] = None


class ShippingGuideResponseSchema(BaseModel):
    order_id: str
    tracking_code: str
    weight_kg: float
    packages_count: int
    notes: Optional[str] = None
    generated_at: datetime
    message: str


# ─── RF-SEL-001: Listar productos con stock real ─────────────────────────────

@router.get("/stock", response_model=List[ProductStockSchema])
def listar_stock(
    seller_id: str = Depends(require_seller),
    db: Session = Depends(get_db),
):
    """
    RF-SEL-001: Lista todos los productos con stock real desde la base de datos.
    RN-SEL-002: stock_real = stock_total - reserved_stock.
    Solo accesible por SELLER o ADMIN.
    
    @sdd-endpoint GET /seller/stock
    @sdd-rf RF-SEL-001
    """
    threshold_cfg = db.query(SystemConfigModel).filter(SystemConfigModel.key == "default_stock_min_threshold").first()
    default_threshold = int(threshold_cfg.value) if threshold_cfg else 5

    products = db.query(ProductModel).all()
    result = []
    for p in products:
        stock_real = p.stock - p.reserved_stock
        min_threshold = (p.specs or {}).get("stock_min_threshold", default_threshold) if p.specs else default_threshold
        result.append(
            ProductStockSchema(
                product_id=str(p.id),
                name=p.name,
                sku=p.sku or "",
                stock_total=p.stock,
                reserved_stock=p.reserved_stock,
                stock_real=stock_real,
                stock_min_threshold=min_threshold,
                stock_alert=stock_real <= min_threshold,
            )
        )
    return result


# ─── RF-SEL-002: Actualizar stock ───────────────────────────────────────────

@router.patch("/stock/{product_id}", response_model=dict)
def actualizar_stock(
    product_id: str,
    body: UpdateStockSchema,
    seller_id: str = Depends(require_seller),
    db: Session = Depends(get_db),
):
    """
    RF-SEL-002: Actualiza el stock de un producto en la base de datos.
    RN-SEL-001: stock >= 0 (enforced by Pydantic Field ge=0).
    SELLER puede editar stock únicamente — no precio, nombre ni descripción.
    
    @sdd-endpoint PATCH /seller/stock/{product_id}
    @sdd-rf RF-SEL-002
    """
    try:
        pid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Producto '{product_id}' no encontrado")

    product = db.query(ProductModel).filter(ProductModel.id == pid).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Producto '{product_id}' no encontrado")

    product.stock = body.stock
    db.add(product)
    db.commit()
    db.refresh(product)

    return {
        "message": "Stock actualizado correctamente",
        "product_id": product_id,
        "new_stock": product.stock,
        "stock_real": product.stock - product.reserved_stock,
    }


# ─── RF-SEL-003: Configurar umbral mínimo ────────────────────────────────────

@router.patch("/stock/{product_id}/umbral", response_model=dict)
def actualizar_umbral(
    product_id: str,
    body: UpdateUmbralSchema,
    seller_id: str = Depends(require_seller),
    db: Session = Depends(get_db),
):
    """
    RF-SEL-003: Configura el umbral mínimo de alerta de stock para un producto en la base de datos (guardado en specs).
    RN-CALC-03: alerta cuando stock_real <= stock_min_threshold.
    
    @sdd-endpoint PATCH /seller/stock/{product_id}/umbral
    @sdd-rf RF-SEL-003
    """
    try:
        pid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Producto '{product_id}' no encontrado")

    product = db.query(ProductModel).filter(ProductModel.id == pid).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Producto '{product_id}' no encontrado")

    # Guardar en specs JSON para no alterar el esquema SQL
    product.specs = {**(product.specs or {}), "stock_min_threshold": body.stock_min_threshold}
    db.add(product)
    db.commit()

    return {
        "message": "Umbral mínimo actualizado",
        "product_id": product_id,
        "stock_min_threshold": body.stock_min_threshold,
    }


# ─── RF-SEL-004: Cola de pedidos ─────────────────────────────────────────────

@router.get("/pedidos", response_model=List[OrderQueueSchema])
def listar_pedidos(
    estado: Optional[str] = Query(None, description="Filtro por estado: READY_TO_SHIP | SHIPPED | PAID"),
    seller_id: str = Depends(require_seller),
    db: Session = Depends(get_db),
):
    """
    RF-SEL-004 / RF-SEL-006: Lista pedidos según estado.
    Default: READY_TO_SHIP (cola de despacho pendiente).
    Con estado=SHIPPED muestra historial de despachados.
    
    @sdd-endpoint GET /seller/pedidos
    @sdd-rf RF-SEL-004 RF-SEL-006
    """
    target_status = estado or "READY_TO_SHIP"

    valid_statuses = [s.value for s in OrderStatus]
    if target_status not in valid_statuses:
        raise HTTPException(
            status_code=422,
            detail=f"Estado inválido. Válidos: {valid_statuses}",
        )

    orders = (
        db.query(Order)
        .filter(Order.status == target_status)
        .order_by(Order.created_at.asc())  # Oldest first (urgency)
        .all()
    )
    return orders


# ─── RF-SEL-005: Generar guía de envío ───────────────────────────────────────

@router.post("/pedidos/{order_id}/guia", response_model=ShippingGuideResponseSchema, status_code=201)
def generar_guia(
    order_id: str,
    body: GenerarGuiaSchema,
    seller_id: str = Depends(require_seller),
    db: Session = Depends(get_db),
):
    """
    RF-SEL-005: Genera guía de envío mock (Shalom, sin API real en MVP §3.2).
    Transición: READY_TO_SHIP → SHIPPED (ORD-T-06).
    RN-SHP-01: Si el pedido ya fue despachado → HTTP 409.
    Precondiciones (Pydantic): weight_kg > 0, packages_count >= 1.
    
    @sdd-endpoint POST /seller/pedidos/{order_id}/guia
    @sdd-rf RF-SEL-005
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail=f"Pedido '{order_id}' no encontrado")

    if order.status == OrderStatus.SHIPPED:
        raise HTTPException(
            status_code=409,
            detail="Este pedido ya tiene guía generada (RN-SHP-01)",
        )

    if order.status != OrderStatus.READY_TO_SHIP:
        raise HTTPException(
            status_code=409,
            detail=(
                f"El pedido debe estar en READY_TO_SHIP para generar guía. "
                f"Estado actual: {order.status}"
            ),
        )

    # Mock tracking code — Shalom integration is out of scope for MVP (§3.2)
    tracking_code = f"SHL-{uuid.uuid4().hex[:8].upper()}"
    generated_at = datetime.utcnow()

    # FSM transition: READY_TO_SHIP → SHIPPED (ORD-T-06)
    order.status = OrderStatus.SHIPPED
    order.updated_at = generated_at
    db.commit()
    db.refresh(order)

    return ShippingGuideResponseSchema(
        order_id=order_id,
        tracking_code=tracking_code,
        weight_kg=body.weight_kg,
        packages_count=body.packages_count,
        notes=body.notes,
        generated_at=generated_at,
        message=f"Guía generada exitosamente. Código de seguimiento: {tracking_code}",
    )
