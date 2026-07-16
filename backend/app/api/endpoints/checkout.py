from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlmodel import Session as SQLModelSession
from uuid import UUID
from pydantic import BaseModel
from app.schemas.checkout import CheckoutRequestSchema, CheckoutResponseSchema
from app.services.checkout_service import CheckoutService
from app.services.shipping_service import ShippingService
from app.services.payment_service import PaymentService
from app.core.config import settings
from app.domain.exceptions import DomainException
from app.api.deps import get_db
from app.db.database import get_session

router = APIRouter()

# IMPORTANTE: reutiliza el MISMO repositorio en memoria que /formatos/*
# (app.api.endpoints.formato_unico.mock_repo). Antes, checkout.py creaba su
# propia instancia de InMemoryFormatoRepository(), completamente aislada:
# cualquier FU creado/editado vía /formatos/session, /formatos/{id}/items o
# /formatos/{id}/aprobar era invisible para /checkout ("Formato Único no
# encontrado" siempre, salvo en tests que sembraban datos directo en esta
# instancia separada).
from app.api.endpoints.formato_unico import mock_repo as mock_fu_repo


def _build_supabase_repo(session: SQLModelSession = None):
    from app.infra.repositories.supabase_formato_repository import SupabaseFormatoRepository

    return SupabaseFormatoRepository(session)


def _get_formato_repository(session: SQLModelSession = None):
    if settings.USE_MOCK_DB:
        return mock_fu_repo
    return _build_supabase_repo(session)

def get_checkout_service(
    fu_session: SQLModelSession = Depends(get_session),
) -> CheckoutService:
    """
    Antes memoizaba una única instancia de CheckoutService en un singleton a
    nivel de módulo (`_checkout_service_instance`). Con USE_MOCK_DB=True no
    importaba (el repo en memoria también es un singleton), pero al usar el
    repositorio real, el singleton habría atado una Session de un único
    request a la vida entera del proceso — quedaba obsoleta/cerrada para
    cualquier request posterior. Se construye una instancia por request.

    `fu_session` (get_session, estilo SQLModel/.exec()) es deliberadamente
    distinta de `db` (get_db, estilo SQLAlchemy clásico/.query()) que ya
    usa el resto de checkout_service.py para Order/User — mismo patrón de
    dos sesiones que ya usa el resto del backend (p. ej. product_query_service
    vs. db en otros endpoints), no una sesión compartida entre ambos estilos.
    """
    shipping_service = ShippingService()
    fu_repo = _get_formato_repository(fu_session)
    payment_service = PaymentService(fu_repo)
    return CheckoutService(fu_repo, shipping_service, payment_service)

from app.core.security import get_current_user_optional

@router.post("", response_model=CheckoutResponseSchema)
@router.post("/", response_model=CheckoutResponseSchema, include_in_schema=False)
def procesar_checkout(
    request: CheckoutRequestSchema,
    service: CheckoutService = Depends(get_checkout_service),
    user_id: str | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Procesa un Formato Único en estado COTIZACION, calculando envío
    y generando una preferencia de pago.
    
    @sdd-endpoint POST /checkout
    @sdd-rf RF-CHK-001 RF-CHK-003
    """
    # Si tenemos usuario, validarlo aquí para garantizar RLS
    return service.process_checkout(request, user_id, db)

class CheckoutStatusSchema(BaseModel):
    state: str
    order_id: str | None = None
    message: str | None = None

@router.get("/{fu_id}/status", response_model=CheckoutStatusSchema)
def get_checkout_status(
    fu_id: UUID,
    service: CheckoutService = Depends(get_checkout_service),
):
    """
    Retorna el estado de un FSM de manera ligera.
    
    @sdd-endpoint GET /checkout/{fu_id}/status
    @sdd-rf RF-CHK-014
    """
    fu = service.fu_repo.get_by_id(fu_id)
    if not fu:
        raise DomainException(message="Formato Único no encontrado", status_code=404)
        
    return CheckoutStatusSchema(
        state=fu.state.value,
        order_id=str(fu.id),
        message=f"El pedido se encuentra en estado {fu.state.value}"
    )
