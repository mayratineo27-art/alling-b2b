import hmac
import hashlib
import json
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.domain.formato_unico import FormatoUnico, FormatoUnicoState
from app.api.endpoints.checkout import mock_fu_repo
from app.api.endpoints.webhooks import WEBHOOK_SECRET

client = TestClient(app)


def _firmar(payload: dict) -> dict:
    body_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    firma = hmac.new(WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256).hexdigest()
    return {"X-Signature": firma}

def test_webhook_firma_invalida():
    """
    Verifica que un webhook con firma HMAC incorrecta sea rechazado con 401.
    """
    payload = {"id": "123", "status": "approved", "external_reference": str(uuid4())}
    headers = {"X-Signature": "firma_falsa_123"}
    
    response = client.post("/webhooks/mercadopago/", json=payload, headers=headers)
    assert response.status_code == 401
    assert "Firma inválida" in response.json()["detail"]

def test_webhook_approved_transicion_estado():
    """
    Verifica que un webhook válido con status 'approved' cambie el FU a CONFIRMADO
    y sea idempotente.
    """
    fu_id = uuid4()
    fu = FormatoUnico(id=fu_id, customer_id=uuid4(), state=FormatoUnicoState.PEDIDO)
    mock_fu_repo.save(fu)
    
    payload = {"id": "evt_1", "status": "approved", "external_reference": str(fu_id)}
    
    # Calcular firma válida
    body_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    firma_valida = hmac.new(WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256).hexdigest()
    
    headers = {"X-Signature": firma_valida}
    
    # Enviar primer webhook
    from unittest.mock import patch, MagicMock
    with patch("app.services.notification_service.NotificationService.enviar_email_confirmacion") as mock_email:
        with patch("app.services.payment_service.mercadopago.SDK") as mock_sdk_class:
            mock_sdk_instance = MagicMock()
            mock_sdk_instance.payment().get.return_value = {"response": {"status": "approved"}}
            mock_sdk_class.return_value = mock_sdk_instance
            
            response = client.post("/webhooks/mercadopago/", json=payload, headers=headers)
            assert response.status_code == 200
            mock_email.assert_called_once_with(fu_id, "cliente@example.com")
    
    # Verificar estado
    fu_actualizado = mock_fu_repo.get_by_id(fu_id)
    assert fu_actualizado.state == FormatoUnicoState.CONFIRMADO
    
    # Enviar segundo webhook (idempotencia)
    response2 = client.post("/webhooks/mercadopago/", json=payload, headers=headers)
    assert response2.status_code == 200 # Ya fue procesado, no debe dar error, solo 200 OK


def test_webhook_approved_actualiza_order_real(setup_test_db):
    """
    OPS-CHK-004: el webhook 'approved' debe transicionar también la fila Order
    real (no solo el FU en memoria) a PAID (ORD-T-02). Antes de este fix, el
    webhook solo tocaba el FormatoUnico y la tabla Order nunca se actualizaba.
    """
    from unittest.mock import patch, MagicMock
    from app.models.order import Order, OrderStatus

    fu_id = uuid4()
    fu = FormatoUnico(id=fu_id, customer_id=uuid4(), state=FormatoUnicoState.PEDIDO)
    mock_fu_repo.save(fu)

    order = Order(formato_unico_id=str(fu_id), status=OrderStatus.PENDING_PAYMENT, total_amount=100.0)
    setup_test_db.add(order)
    setup_test_db.commit()

    payload = {"id": "evt_order_paid", "status": "approved", "external_reference": str(fu_id)}
    body_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    firma_valida = hmac.new(WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256).hexdigest()
    headers = {"X-Signature": firma_valida}

    with patch("app.services.notification_service.NotificationService.enviar_email_confirmacion"):
        with patch("app.services.payment_service.mercadopago.SDK") as mock_sdk_class:
            mock_sdk_instance = MagicMock()
            mock_sdk_instance.payment().get.return_value = {"response": {"status": "approved"}}
            mock_sdk_class.return_value = mock_sdk_instance
            response = client.post("/webhooks/mercadopago/", json=payload, headers=headers)
            assert response.status_code == 200

    setup_test_db.refresh(order)
    assert order.status == OrderStatus.PAID


def test_webhook_rejected_cancela_order_real(setup_test_db):
    """
    OPS-CHK-005: el webhook 'rejected' debe cancelar la fila Order real
    (ORD-T-03), registrando cancellation_reason (RN-CHK-006).
    """
    from unittest.mock import patch, MagicMock
    from app.models.order import Order, OrderStatus

    fu_id = uuid4()
    fu = FormatoUnico(id=fu_id, customer_id=uuid4(), state=FormatoUnicoState.PEDIDO)
    mock_fu_repo.save(fu)

    order = Order(formato_unico_id=str(fu_id), status=OrderStatus.PENDING_PAYMENT, total_amount=100.0)
    setup_test_db.add(order)
    setup_test_db.commit()

    payload = {"id": "evt_order_rejected", "status": "rejected", "external_reference": str(fu_id)}
    body_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    firma_valida = hmac.new(WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256).hexdigest()
    headers = {"X-Signature": firma_valida}

    with patch("app.services.payment_service.mercadopago.SDK") as mock_sdk_class:
        mock_sdk_instance = MagicMock()
        mock_sdk_instance.payment().get.return_value = {"response": {"status": "rejected"}}
        mock_sdk_class.return_value = mock_sdk_instance
        response = client.post("/webhooks/mercadopago/", json=payload, headers=headers)
        assert response.status_code == 200

    setup_test_db.refresh(order)
    assert order.status == OrderStatus.CANCELLED
    assert order.cancellation_reason


def test_webhook_approved_confirma_fu_persistido_en_bd_real(setup_test_db):
    """
    RNF-REL-006: antes, get_payment_service() usaba mock_fu_repo
    hardcodeado sin importar USE_MOCK_DB — con la persistencia real
    activada, checkout.py crea el pedido en Postgres/SupabaseFormatoRepository
    pero el webhook seguía buscando el FU en el diccionario en memoria
    (vacío), fallando siempre con 404. Fuerza USE_MOCK_DB=False para
    reproducir ese camino contra la BD real (SQLite de pruebas, vía la
    sesión inyectada) y confirma que el webhook sí encuentra y confirma el FU.
    """
    from unittest.mock import patch, MagicMock
    from app.core.config import settings
    from app.infra.repositories.supabase_formato_repository import SupabaseFormatoRepository

    valor_original = settings.USE_MOCK_DB
    settings.USE_MOCK_DB = False
    try:
        repo = SupabaseFormatoRepository(setup_test_db)
        fu_id = uuid4()
        fu = FormatoUnico(id=fu_id, state=FormatoUnicoState.PEDIDO)
        repo.save(fu)

        payload = {"id": "evt_real_db", "status": "approved", "external_reference": str(fu_id)}
        headers = _firmar(payload)

        with patch("app.services.notification_service.NotificationService.enviar_email_confirmacion"):
            with patch("app.services.payment_service.mercadopago.SDK") as mock_sdk_class:
                mock_sdk_instance = MagicMock()
                mock_sdk_instance.payment().get.return_value = {"response": {"status": "approved"}}
                mock_sdk_class.return_value = mock_sdk_instance
                response = client.post("/webhooks/mercadopago/", json=payload, headers=headers)

        assert response.status_code == 200
        fu_actualizado = repo.get_by_id(fu_id)
        assert fu_actualizado.state == FormatoUnicoState.CONFIRMADO
    finally:
        settings.USE_MOCK_DB = valor_original
