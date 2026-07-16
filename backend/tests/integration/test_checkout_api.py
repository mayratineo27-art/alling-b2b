from fastapi.testclient import TestClient
from app.main import app
from uuid import uuid4
from decimal import Decimal
from app.domain.formato_unico import FormatoUnico, FormatoUnicoState
from app.api.endpoints.checkout import mock_fu_repo

client = TestClient(app)

def test_flujo_completo_checkout():
    """
    Simula el flujo completo de un pedido y verifica la idempotencia.
    """
    fu_id_valido = uuid4()
    
    # 1. Crear FU en estado COTIZACION
    fu_cotizacion = FormatoUnico(id=fu_id_valido, customer_id=uuid4(), state=FormatoUnicoState.COTIZACION)
    from app.domain.formato_unico import FormatoUnicoItem
    fu_cotizacion.items.append(FormatoUnicoItem(product_id=uuid4(), quantity=1, unit_price=Decimal("100.00")))
    fu_cotizacion.recalcular_subtotal()
    
    mock_fu_repo.save(fu_cotizacion)
    
    # Payload válido
    payload = {
        "fu_id": str(fu_id_valido),
        "billing_id": "123456789",
        "address": "Calle Falsa 123"
    }
    
    # 2. Iniciar pago
    response = client.post("/checkout/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "payment_url" in data
    assert "idempotency_key" in data
    assert data["shipping_cost"] == "15.00"
    
    # 3. Verificar idempotencia (repetir request)
    response_repeat = client.post("/checkout/", json=payload)
    assert response_repeat.status_code == 200
    data_repeat = response_repeat.json()
    
    # Debe retornar exactamente lo mismo sin procesar doble
    assert data["idempotency_key"] == data_repeat["idempotency_key"]
    assert data["payment_url"] == data_repeat["payment_url"]
    
def test_checkout_estado_invalido():
    """
    RF-FU-006 / FU-T-04 y FU-T-09: el checkout acepta BORRADOR (compra directa)
    o COTIZACION, pero rechaza un FU ya CONFIRMADO (pago previamente cerrado).
    """
    fu_id_invalido = uuid4()
    fu_confirmado = FormatoUnico(id=fu_id_invalido, customer_id=uuid4(), state=FormatoUnicoState.CONFIRMADO)
    mock_fu_repo.save(fu_confirmado)

    payload = {
        "fu_id": str(fu_id_invalido),
        "billing_id": "123456789",
        "address": "Calle Falsa 123"
    }
    response = client.post("/checkout/", json=payload)
    assert response.status_code == 409


def test_checkout_desde_borrador_permite_compra_directa(setup_test_db):
    """
    RF-FU-006 / FU-T-04: GUEST puede iniciar checkout directo desde BORRADOR,
    sin pasar por COTIZACION (esa transición es exclusiva de CUSTOMER, RF-FU-005).
    """
    fu_id = uuid4()
    fu_borrador = FormatoUnico(id=fu_id, customer_id=None, state=FormatoUnicoState.BORRADOR)
    from app.domain.formato_unico import FormatoUnicoItem
    fu_borrador.items.append(FormatoUnicoItem(product_id=uuid4(), quantity=1, unit_price=Decimal("30.00")))
    fu_borrador.recalcular_subtotal()
    mock_fu_repo.save(fu_borrador)

    payload = {"fu_id": str(fu_id), "billing_id": "12345678", "address": "Jr. Test 100"}
    response = client.post("/checkout/", json=payload)
    assert response.status_code == 200
    assert "payment_url" in response.json()
def test_crear_pedido_guest():
    """
    Verifica que al crear un pedido sin estar logueado (GUEST), la respuesta incluya un order_token.
    """
    fu_id_guest = uuid4()
    fu_guest = FormatoUnico(id=fu_id_guest, customer_id=None, state=FormatoUnicoState.COTIZACION)
    mock_fu_repo.save(fu_guest)
    
    payload = {
        "fu_id": str(fu_id_guest),
        "billing_id": "987654321",
        "address": "Calle Verdadera 123"
    }
    
    response = client.post("/checkout/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "order_token" in data
    assert data["order_token"] is not None
    assert len(data["order_token"]) > 20

def test_obtener_datos_facturacion():
    """
    Verifica que GET /usuarios/me/facturacion retorne datos mockeados.
    """
    from app.services.auth_service import AuthService
    token = AuthService.crear_token({"sub": "123e4567-e89b-12d3-a456-426614174000", "role": "CUSTOMER"})
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/usuarios/me/facturacion", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["document_type"] == "RUC"
    assert "document_number" in data
    assert "address" in data

def test_checkout_crea_order_real_en_bd(setup_test_db):
    """
    OPS-FU-006 / OPS-CHK-001: al hacer checkout de un FU en COTIZACION, el
    sistema debe crear una fila Order real (no solo mutar el FU en memoria),
    con status PENDING_PAYMENT y los datos de envío/facturación capturados.
    Antes de este fix, /orders y /orders/{id} SIEMPRE devolvían vacío/404
    porque ninguna Order se persistía jamás.
    """
    from app.models.order import Order, OrderStatus

    fu_id = uuid4()
    fu = FormatoUnico(id=fu_id, customer_id=uuid4(), state=FormatoUnicoState.COTIZACION)
    from app.domain.formato_unico import FormatoUnicoItem
    fu.items.append(FormatoUnicoItem(product_id=uuid4(), quantity=2, unit_price=Decimal("50.00")))
    fu.recalcular_subtotal()
    mock_fu_repo.save(fu)

    payload = {"fu_id": str(fu_id), "billing_id": "12345678", "address": "Av. Siempre Viva 742"}
    response = client.post("/checkout/", json=payload)
    assert response.status_code == 200

    order = setup_test_db.query(Order).filter(Order.formato_unico_id == str(fu_id)).first()
    assert order is not None, "No se creó ninguna fila Order tras el checkout"
    assert order.status == OrderStatus.PENDING_PAYMENT
    assert order.shipping_address == "Av. Siempre Viva 742"
    assert order.dni_or_ruc == "12345678"
    assert order.total_amount > 0


def test_obtener_estado_checkout():
    """
    Verifica que GET /checkout/{fu_id}/status retorne el estado actual del FSM.
    """
    fu_id_status = uuid4()
    fu_status = FormatoUnico(id=fu_id_status, customer_id=None, state=FormatoUnicoState.CONFIRMADO)
    mock_fu_repo.save(fu_status)
    
    response = client.get(f"/checkout/{fu_id_status}/status")
    assert response.status_code == 200
    data = response.json()
    assert data["state"] == "CONFIRMADO"
    assert data["order_id"] == str(fu_id_status)
    assert "message" in data
