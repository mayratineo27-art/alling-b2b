"""
MOD-CON-01 — Consultas Pre-Venta (vista SELLER)
RF-CON-001 a RF-CON-004

Endpoints:
  GET  /consultas                    → RF-CON-001/004: cola de consultas + filtros
  POST /consultas/{fu_id}/tomar      → RF-CON-002: asignarse una consulta
  POST /consultas/{fu_id}/responder  → RF-CON-003: responder y resolver consulta
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.core.config import settings
from app.core.security import oauth2_scheme
from app.services.auth_service import AuthService
from app.domain.formato_unico import FormatoUnicoState
from app.infra.repositories.in_memory_formato_repository import InMemoryFormatoRepository
from app.db.database import get_session

router = APIRouter()

_mock_repo = InMemoryFormatoRepository()

# FSM state values
_STATE_CONSULTA = "CONSULTA"
_STATE_RESUELTA = "RESUELTA"


def _build_supabase_repo(session: Session = None):
    from app.infra.repositories.supabase_formato_repository import SupabaseFormatoRepository

    return SupabaseFormatoRepository(session)


def _get_formato_repository(session: Session = None):
    if settings.USE_MOCK_DB:
        return _mock_repo
    return _build_supabase_repo(session)


# ─── Role guard (same pattern as seller.py) ──────────────────────────────────

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

class ConsultaListSchema(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    state: str
    customer_id: Optional[str] = None
    assigned_seller_id: Optional[str] = None
    consultant_note: Optional[str] = None
    updated_at: Optional[datetime] = None


class ResponderConsultaSchema(BaseModel):
    consultant_note: str = Field(
        ..., min_length=1,
        description="Nota de asesoría. No puede estar vacía (RN-CON-002)"
    )


class TomarConsultaResponseSchema(BaseModel):
    message: str
    fu_id: str
    assigned_seller_id: str


class ResponderConsultaResponseSchema(BaseModel):
    message: str
    fu_id: str
    state: str
    consultant_note: str


# ─── RF-CON-001 / RF-CON-004: Listar y filtrar consultas ────────────────────

@router.get("", response_model=List[ConsultaListSchema])
def listar_consultas(
    assigned_to_me: Optional[bool] = Query(
        None,
        description="True: mis consultas. False: sin asignar. None: todas"
    ),
    seller_id: str = Depends(require_seller),
    session: Session = Depends(get_session),
):
    """
    RF-CON-001: Lista FormatosUnicos en estado CONSULTA.
    RF-CON-004: Filtra por asignación (OPS-CON-004).
    OPS-CON-001: SELLER ve todas las consultas (asignadas y sin asignar).
    
    @sdd-endpoint GET /consultas
    @sdd-rf RF-CON-001 RF-CON-004
    """
    repo = _get_formato_repository(session)
    all_fus = repo.list_by_states([FormatoUnicoState.CONSULTA], skip=0, limit=1000)
    all_fus.sort(key=lambda fu: fu.updated_at)

    result = []
    for fu in all_fus:
        fu_id = str(fu.id)
        assigned = fu.assigned_seller_id

        # Apply filter
        if assigned_to_me is True and assigned != seller_id:
            continue
        if assigned_to_me is False and assigned is not None:
            continue

        result.append(ConsultaListSchema(
            id=fu_id,
            state=fu.state.value,
            customer_id=str(fu.customer_id) if fu.customer_id else None,
            assigned_seller_id=assigned,
            consultant_note=fu.consultant_note,
            updated_at=fu.updated_at,
        ))

    return result


# ─── RF-CON-002: Tomar (asignarse) una consulta ──────────────────────────────

@router.post("/{fu_id}/tomar", response_model=TomarConsultaResponseSchema)
def tomar_consulta(
    fu_id: str,
    seller_id: str = Depends(require_seller),
    session: Session = Depends(get_session),
):
    """
    RF-CON-002: Asigna la consulta al SELLER actual.
    RN-CON-001: solo un SELLER puede estar asignado a la vez.
    HTTP 409 si ya está asignada a otro SELLER (optimistic lock).
    EVT-CON-001: ConsultaAsignada.
    
    @sdd-endpoint POST /consultas/{fu_id}/tomar
    @sdd-rf RF-CON-002
    """
    repo = _get_formato_repository(session)
    fu = repo.get_by_id(fu_id)
    if not fu:
        raise HTTPException(status_code=404, detail=f"Consulta '{fu_id}' no encontrada")

    if fu.state != FormatoUnicoState.CONSULTA:
        raise HTTPException(
            status_code=409,
            detail=f"El Formato Único no está en estado CONSULTA. Estado actual: {fu.state.value}",
        )

    if fu.assigned_seller_id and fu.assigned_seller_id != seller_id:
        raise HTTPException(
            status_code=409,
            detail="Esta consulta ya fue tomada por otro SELLER (RN-CON-001)",
        )

    fu.assigned_seller_id = seller_id
    repo.save(fu)

    return TomarConsultaResponseSchema(
        message="Consulta asignada exitosamente",
        fu_id=fu_id,
        assigned_seller_id=seller_id,
    )


# ─── RF-CON-003: Responder consulta ──────────────────────────────────────────

@router.post("/{fu_id}/responder", response_model=ResponderConsultaResponseSchema)
def responder_consulta(
    fu_id: str,
    body: ResponderConsultaSchema,
    seller_id: str = Depends(require_seller),
    session: Session = Depends(get_session),
):
    """
    RF-CON-003: Responde la consulta y transiciona FU a RESUELTA (FU-T-05).
    RN-CON-002: Solo el SELLER asignado puede responder.
    consultant_note no puede estar vacía (validado por Pydantic min_length=1).
    EVT-FU-012: ConsultaResuelta.
    
    @sdd-endpoint POST /consultas/{fu_id}/responder
    @sdd-rf RF-CON-003
    """
    repo = _get_formato_repository(session)
    fu = repo.get_by_id(fu_id)
    if not fu:
        raise HTTPException(status_code=404, detail=f"Consulta '{fu_id}' no encontrada")

    if fu.state != FormatoUnicoState.CONSULTA:
        raise HTTPException(
            status_code=409,
            detail=f"El Formato Único no está en estado CONSULTA. Estado actual: {fu.state.value}",
        )

    assigned_seller = fu.assigned_seller_id
    if assigned_seller != seller_id:
        raise HTTPException(
            status_code=403,
            detail="Solo el SELLER asignado puede responder esta consulta (RN-CON-002)",
        )

    # Persist note and transition state in the aggregate (FSM FU-T-05)
    fu.consultant_note = body.consultant_note
    fu.state = FormatoUnicoState.RESUELTA
    repo.save(fu)

    return ResponderConsultaResponseSchema(
        message="Consulta resuelta exitosamente",
        fu_id=fu_id,
        state=FormatoUnicoState.RESUELTA.value,
        consultant_note=body.consultant_note,
    )
