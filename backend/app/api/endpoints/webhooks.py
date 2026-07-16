from fastapi import APIRouter, Header, Depends, Request
from sqlalchemy.orm import Session
from sqlmodel import Session as SQLModelSession
import hmac
import hashlib
import json
from uuid import UUID
from pydantic import BaseModel
from app.core.config import settings
from app.services.payment_service import PaymentService
from app.domain.exceptions import DomainException
from app.api.endpoints.checkout import mock_fu_repo
from app.api.deps import get_db
from app.db.database import get_session

router = APIRouter()
# Antes: os.getenv("WEBHOOK_SECRET", "") — os.getenv() nunca lee
# backend/.env (solo variables de entorno reales del proceso), así que
# quedaba vacío sin importar lo que hubiera en .env. `settings` sí parsea
# .env correctamente (mismo mecanismo que DATABASE_URL).
WEBHOOK_SECRET = settings.WEBHOOK_SECRET

class WebhookPayloadSchema(BaseModel):
    id: str
    status: str
    external_reference: str

from app.services.notification_service import NotificationService
from app.services.inventory_service import InventoryService
from app.domain.repositories.idempotency_repository import MockIdempotencyRepository

mock_idempotency_repo = MockIdempotencyRepository()

def get_payment_service(session: SQLModelSession = Depends(get_session)) -> PaymentService:
    """
    RNF-REL-006: antes usaba mock_fu_repo (memoria) y un
    InMemoryProductRepository() huérfano SIN IMPORTAR settings.USE_MOCK_DB.
    Con la persistencia real activada, checkout.py crea el pedido en
    Postgres pero el webhook de confirmación de pago buscaba el Formato
    Único en un diccionario vacío — fallaba siempre con 404 "no
    encontrado" y ningún pago real de Mercado Pago llegaba a confirmarse.
    El repo de productos usa siempre ProductRepositoryImpl (mismo criterio
    que get_product_query_service: el catálogo real no depende de
    USE_MOCK_DB, solo el Formato Único lo hace).
    """
    from app.infra.repositories.product_repository_impl import ProductRepositoryImpl

    if settings.USE_MOCK_DB:
        fu_repo = mock_fu_repo
    else:
        from app.infra.repositories.supabase_formato_repository import SupabaseFormatoRepository
        fu_repo = SupabaseFormatoRepository(session)

    product_repo = ProductRepositoryImpl(session=session)
    inventory_service = InventoryService(fu_repo=fu_repo, product_repo=product_repo)
    return PaymentService(
        fu_repo=fu_repo,
        inventory_service=inventory_service,
        notification_service=NotificationService(),
        idempotency_repo=mock_idempotency_repo
    )

def verificar_firma_hmac(payload_bytes: bytes, header_signature: str) -> bool:
    if not header_signature:
        return False
    expected_signature = hmac.new(WEBHOOK_SECRET.encode(), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected_signature, header_signature)

@router.post("/mercadopago/")
async def webhook_mercadopago(
    request: Request,
    x_signature: str = Header(None, alias="X-Signature"),
    service: PaymentService = Depends(get_payment_service),
    db: Session = Depends(get_db),
):
    """
    Procesa webhooks de Mercado Pago.
    
    @sdd-endpoint POST /webhooks/mercadopago/
    @sdd-rf RF-CHK-006 RF-CHK-014
    """
    body_bytes = await request.body()
    
    if not verificar_firma_hmac(body_bytes, x_signature):
        raise DomainException(message="Firma inválida", status_code=401)
        
    try:
        data = json.loads(body_bytes.decode('utf-8'))
        payload = WebhookPayloadSchema(**data)
    except Exception:
        raise DomainException(message="Payload mal formado", status_code=400)
        
    try:
        fu_id = UUID(payload.external_reference)
    except ValueError:
        raise DomainException(message="external_reference inválido", status_code=400)
        
    service.procesar_webhook(payload.id, fu_id, db)
    return {"status": "ok"}
