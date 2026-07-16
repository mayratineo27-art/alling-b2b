"""
MOD-COT-01 — Cotizaciones Vista SELLER (Read-Only)
RF-COT-001 a RF-COT-003

Endpoints:
  GET /cotizaciones              → RF-COT-001: listar cotizaciones con filtro por estado
  GET /cotizaciones/{id}         → RF-COT-002: detalle de cotización
  GET /cotizaciones/{id}/pdf     → RF-COT-003: redirect/link al PDF

NOTE: This module is intentionally read-only. SELLER cannot mutate cotizaciones
(no extend, no cancel). See MOD-COT-01 § "Vacío detectado".
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlmodel import Session

from app.core.config import settings
from app.core.security import oauth2_scheme
from app.services.auth_service import AuthService
from app.domain.formato_unico import FormatoUnicoState
from app.infra.repositories.in_memory_formato_repository import InMemoryFormatoRepository
from app.db.database import get_session

router = APIRouter()

_mock_repo = InMemoryFormatoRepository()

# Valid cotización states (OPS-COT-001)
_VALID_STATES = {"COTIZACION", "EXPIRADA", "PEDIDO", "CONFIRMADO"}


def _build_supabase_repo(session: Session = None):
    from app.infra.repositories.supabase_formato_repository import SupabaseFormatoRepository

    return SupabaseFormatoRepository(session)


def _get_formato_repository(session: Session = None):
    if settings.USE_MOCK_DB:
        return _mock_repo
    return _build_supabase_repo(session)


# ─── Role guard (same pattern as consultas.py) ───────────────────────────────

def get_current_user_with_role(token: str = Depends(oauth2_scheme)):
    """Validates JWT and returns (user_id, role)."""
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")


def require_seller(token: str = Depends(oauth2_scheme)) -> str:
    """Requires SELLER or ADMIN role. Returns user_id."""
    user_id, role = get_current_user_with_role(token)
    if role not in ("SELLER", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido a SELLER",
        )
    return user_id


# ─── Schemas ─────────────────────────────────────────────────────────────────

class CotizacionListSchema(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    state: str
    customer_id: Optional[str] = None
    subtotal: Optional[float] = None
    discount_percent: Optional[float] = 0.0
    has_pdf: bool
    updated_at: Optional[datetime] = None


class CotizacionDetailSchema(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    state: str
    customer_id: Optional[str] = None
    subtotal: Optional[float] = None
    discount_percent: Optional[float] = 0.0
    pdf_url: Optional[str] = None
    updated_at: Optional[datetime] = None


# ─── RF-COT-001: Listar cotizaciones ─────────────────────────────────────────

@router.get("", response_model=List[CotizacionListSchema])
def listar_cotizaciones(
    estado: Optional[str] = Query(
        None,
        description="Filtro por estado: COTIZACION | EXPIRADA | PEDIDO | CONFIRMADO"
    ),
    seller_id: str = Depends(require_seller),
    session: Session = Depends(get_session),
):
    """
    RF-COT-001: Lista FormatosUnicos en estados de cotización.
    OPS-COT-001: visibilidad compartida — todos los SELLERs ven todas las cotizaciones.
    
    @sdd-endpoint GET /cotizaciones
    @sdd-rf RF-COT-001
    """
    if estado is not None and estado not in _VALID_STATES:
        raise HTTPException(
            status_code=422,
            detail=f"Estado inválido '{estado}'. Válidos: {sorted(_VALID_STATES)}",
        )

    target_states = {estado} if estado else _VALID_STATES

    repo = _get_formato_repository(session)
    fus = repo.list_by_states([FormatoUnicoState(state) for state in target_states], skip=0, limit=1000)

    return [
        CotizacionListSchema(
            id=str(fu.id),
            state=fu.state.value,
            customer_id=str(fu.customer_id) if fu.customer_id else None,
            subtotal=float(fu.subtotal) if fu.subtotal is not None else None,
            discount_percent=float(fu.discount_percent) if fu.discount_percent is not None else 0.0,
            has_pdf=bool(fu.pdf_url),
            updated_at=fu.updated_at,
        )
        for fu in fus
    ]


# ─── RF-COT-002: Detalle de cotización ───────────────────────────────────────

@router.get("/{fu_id}", response_model=CotizacionDetailSchema)
def detalle_cotizacion(
    fu_id: str,
    seller_id: str = Depends(require_seller),
    session: Session = Depends(get_session),
):
    """
    RF-COT-002: Devuelve el detalle completo de una cotización.
    OPS-COT-002: sin restricción de asignación (a diferencia de consultas).
    
    @sdd-endpoint GET /cotizaciones/{fu_id}
    @sdd-rf RF-COT-002
    """
    repo = _get_formato_repository(session)
    fu = repo.get_by_id(fu_id)
    if not fu:
        raise HTTPException(status_code=404, detail=f"Cotización '{fu_id}' no encontrada")

    if fu.state.value not in _VALID_STATES:
        raise HTTPException(
            status_code=404,
            detail=f"El Formato Único no es una cotización. Estado: {fu.state.value}",
        )

    return CotizacionDetailSchema(
        id=str(fu.id),
        state=fu.state.value,
        customer_id=str(fu.customer_id) if fu.customer_id else None,
        subtotal=float(fu.subtotal) if fu.subtotal is not None else None,
        discount_percent=float(fu.discount_percent) if fu.discount_percent is not None else 0.0,
        pdf_url=fu.pdf_url,
        updated_at=fu.updated_at,
    )


# ─── RF-COT-003: Descargar PDF ────────────────────────────────────────────────

@router.get("/{fu_id}/pdf")
def descargar_pdf(
    fu_id: str,
    seller_id: str = Depends(require_seller),
    session: Session = Depends(get_session),
):
    """
    RF-COT-003: Redirige al PDF de la cotización.
    BTN-COT-001: solo si pdf_url no es None.
    HTTP 404 si el PDF no existe.
    
    @sdd-endpoint GET /cotizaciones/{fu_id}/pdf
    @sdd-rf RF-COT-003
    """
    repo = _get_formato_repository(session)
    fu = repo.get_by_id(fu_id)
    pdf_url = fu.pdf_url if fu else None
    if not pdf_url:
        raise HTTPException(
            status_code=404,
            detail=f"PDF no disponible para la cotización '{fu_id}'",
        )
    return RedirectResponse(url=pdf_url, status_code=307)
