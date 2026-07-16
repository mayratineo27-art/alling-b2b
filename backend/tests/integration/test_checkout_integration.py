import pytest
import hmac
import hashlib
import json
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.models.order import Order, OrderStatus
from app.models.product import ProductModel
from app.models.user import User
from app.models.formato_unico import FormatoUnico
from app.models.formato_unico_item import FormatoUnicoItem
from app.core.config import settings

client = TestClient(app)

def test_checkout_idempotency(override_db, postgres_session):
    """
    T7-INT1: Validar idempotencia real del proceso de checkout.
    """
    settings.USE_MOCK_DB = False
    try:
        # 1. Setup Data in Postgres
        user_id = str(uuid4())
        fu_id = str(uuid4())
        
        user = User(id=user_id, email=f"{user_id}@test.com", role="CUSTOMER", name="Test User", auth_provider="LOCAL")
        postgres_session.add(user)
        
        fu = FormatoUnico(id=fu_id, customer_id=user_id, state="COTIZACION")
        postgres_session.add(fu)
        postgres_session.commit()

        # 2. Authenticate
        from app.services.auth_service import AuthService
        token = AuthService.crear_token({"sub": user_id, "role": "CUSTOMER"})
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "fu_id": str(fu_id),
            "address": "Av. Test 123",
            "billing_id": "12345678"
        }

        # Verify data directly using the repository
        from app.infra.repositories.supabase_formato_repository import SupabaseFormatoRepository
        repo = SupabaseFormatoRepository(postgres_session)
        fu_check = repo.get_by_id(fu_id)
        print(f"DEBUG: repo.get_by_id({fu_id}) -> {fu_check}")
        
        # 3. Simulate Concurrent/Sequential requests
        response1 = client.post("/checkout", json=payload, headers=headers)
        if response1.status_code != 200:
            print(f"DEBUG: checkout response status={response1.status_code}, body={response1.json()}")
        assert response1.status_code == 200

        response2 = client.post("/checkout", json=payload, headers=headers)
        # We assert that only ONE order is in the database for this FU.
        orders_count = postgres_session.query(Order).filter(Order.formato_unico_id == str(fu_id)).count()
        assert orders_count == 1
    finally:
        settings.USE_MOCK_DB = True

def test_webhook_mercadopago_integration(override_db, postgres_session, monkeypatch):
    """
    T7-INT3: Recepción de Webhooks - Simular payload de Mercado Pago,
    validar firma HMAC y comprobar que Order cambia a PAID.
    """
    settings.USE_MOCK_DB = False
    
    from app.services.payment_service import PaymentService
    monkeypatch.setattr(PaymentService, "consultar_estado_pago", lambda self, payment_id: "approved")
    
    try:
        # 1. Setup Data
        user_id = str(uuid4())
        fu_id = str(uuid4())
        prod_id = str(uuid4())
        
        user = User(id=user_id, email=f"{user_id}@test.com", role="CUSTOMER", name="Test User", auth_provider="LOCAL")
        postgres_session.add(user)
        
        fu = FormatoUnico(id=fu_id, customer_id=user_id, state="PEDIDO")
        postgres_session.add(fu)
        
        order = Order(
            id=str(uuid4()),
            formato_unico_id=str(fu_id),
            status=OrderStatus.PENDING_PAYMENT,
            total_amount=100.0
        )
        postgres_session.add(order)
        
        prod = ProductModel(
            id=prod_id,
            sku="TEST-SKU",
            name="Test",
            price_public=10.0,
            stock=10,
            slug="test-sku",
            is_active=True
        )
        postgres_session.add(prod)
        postgres_session.commit()

        # We need to simulate that the FU has items pointing to the product
        item = FormatoUnicoItem(
            id=str(uuid4()),
            formato_unico_id=fu_id,
            product_id=prod_id,
            quantity=2,
            price_at_time=10.0
        )
        postgres_session.add(item)
        postgres_session.commit()

        # 2. Prepare Webhook Payload
        webhook_payload = {
            "id": "pay_123456",
            "status": "approved",
            "external_reference": str(fu_id)
        }
        body_str = json.dumps(webhook_payload)
        
        # Sign it
        secret = settings.WEBHOOK_SECRET
        signature = hmac.new(secret.encode(), body_str.encode(), hashlib.sha256).hexdigest()
        
        headers = {
            "X-Signature": signature,
            "Content-Type": "application/json"
        }

        # 3. Call endpoint
        response = client.post("/webhooks/mercadopago/", content=body_str, headers=headers)
        if response.status_code != 200:
            print(f"DEBUG: webhook response status={response.status_code}, body={response.json()}")
        assert response.status_code == 200

        # 4. Assert Changes
        postgres_session.refresh(order)
        assert order.status == OrderStatus.PAID
        
        postgres_session.refresh(fu)
        assert fu.state == "CONFIRMADO"
        
        postgres_session.refresh(prod)
        assert prod.stock == 8  # 10 - 2
    finally:
        settings.USE_MOCK_DB = True
