"""
Tests de integración: OPS-CHK-006 (consultar por orderToken) y OPS-CHK-008 /
OPS-FU-011 (cancelar / reintentar pedido) — RF-CHK-006, RF-CHK-008, RF-FU-011.
"""
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.domain.formato_unico import FormatoUnico, FormatoUnicoState
from app.api.endpoints.formato_unico import mock_repo

client = TestClient(app)


def _crear_order(setup_test_db, *, status, order_token=None, formato_unico_id=None):
    from app.models.order import Order

    order = Order(
        formato_unico_id=formato_unico_id or str(uuid4()),
        status=status,
        total_amount=100.0,
        order_token=order_token,
    )
    setup_test_db.add(order)
    setup_test_db.commit()
    setup_test_db.refresh(order)
    return order


def test_guest_consulta_pedido_por_order_token(setup_test_db):
    """RF-CHK-006: GUEST consulta su pedido solo con el orderToken, sin sesión."""
    from app.models.order import OrderStatus

    order = _crear_order(setup_test_db, status=OrderStatus.PAID, order_token="tok-guest-abc123")

    response = client.get("/orders/by-token/tok-guest-abc123")
    assert response.status_code == 200
    assert response.json()["id"] == order.id


def test_consulta_por_token_invalido_retorna_404(setup_test_db):
    response = client.get("/orders/by-token/no-existe-este-token")
    assert response.status_code == 404


def test_cancelar_pedido_pending_payment(setup_test_db):
    """RF-CHK-008 / RN-CHK-009: se puede cancelar mientras esté PENDING_PAYMENT."""
    from app.models.order import OrderStatus

    order = _crear_order(setup_test_db, status=OrderStatus.PENDING_PAYMENT, order_token="tok-cancel-1")

    response = client.post(f"/orders/{order.id}/cancelar?order_token=tok-cancel-1")
    assert response.status_code == 200

    setup_test_db.refresh(order)
    assert order.status == OrderStatus.CANCELLED
    assert order.cancellation_reason


def test_cancelar_pedido_ya_pagado_retorna_409(setup_test_db):
    """No se puede cancelar un pedido que ya fue confirmado (PAID)."""
    from app.models.order import OrderStatus

    order = _crear_order(setup_test_db, status=OrderStatus.PAID, order_token="tok-cancel-2")

    response = client.post(f"/orders/{order.id}/cancelar?order_token=tok-cancel-2")
    assert response.status_code == 409


def test_reintentar_pedido_revierte_fu_a_borrador(setup_test_db):
    """
    RF-FU-011 / FU-T-14: reintentar un pedido CANCELLED devuelve el FU
    asociado a BORRADOR preservando sus ítems; el Order histórico no cambia.
    """
    from app.models.order import OrderStatus
    from app.domain.formato_unico import FormatoUnicoItem
    from decimal import Decimal

    fu_id = uuid4()
    fu = FormatoUnico(id=fu_id, customer_id=None, state=FormatoUnicoState.CANCELADO)
    fu.items.append(FormatoUnicoItem(product_id=uuid4(), quantity=3, unit_price=Decimal("20.00")))
    fu.recalcular_subtotal()
    mock_repo.save(fu)

    order = _crear_order(
        setup_test_db, status=OrderStatus.CANCELLED, order_token="tok-retry-1", formato_unico_id=str(fu_id)
    )

    response = client.post(f"/orders/{order.id}/reintentar?order_token=tok-retry-1")
    assert response.status_code == 200

    fu_actualizado = mock_repo.get_by_id(fu_id)
    assert fu_actualizado.state == FormatoUnicoState.BORRADOR
    assert len(fu_actualizado.items) == 1

    setup_test_db.refresh(order)
    assert order.status == OrderStatus.CANCELLED  # histórico, inmutable


def test_reintentar_pedido_no_cancelado_retorna_409(setup_test_db):
    from app.models.order import OrderStatus

    order = _crear_order(setup_test_db, status=OrderStatus.PENDING_PAYMENT, order_token="tok-retry-2")

    response = client.post(f"/orders/{order.id}/reintentar?order_token=tok-retry-2")
    assert response.status_code == 409
