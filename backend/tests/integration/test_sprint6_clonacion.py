"""
Sprint 6 — Patrón de Clonación (T6-B1), resolución de borrador activo
(T6-B2), Widget de Recompra (T6-B3) y bandera hasHistory (T6-B4).

Fuente: notas_actualizacion_diseno.md, secciones 1 y 4.
"""
from uuid import uuid4
from decimal import Decimal
from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import AuthService
from app.api.endpoints.catalogo import mock_repo as product_repo
from app.api.endpoints.formato_unico import mock_repo as formato_repo
from app.domain.product import Product
from app.domain.formato_unico import FormatoUnico, FormatoUnicoItem, FormatoUnicoState

client = TestClient(app)


def auth_headers(user_id: str) -> dict:
    token = AuthService.crear_token({"sub": user_id, "role": "CUSTOMER"})
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# T6-B1: Patrón de Clonación
# ---------------------------------------------------------------------------

def test_generar_cotizacion_clona_en_registro_independiente():
    """
    Al generar cotización, se crea un FU NUEVO e independiente en
    COTIZACION; el original permanece en BORRADOR, vacío, listo para
    seguir usándose de inmediato.
    """
    user_id = str(uuid4())
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("50.00"), name="Switch", is_active=True))

    res_create = client.post("/formatos/", headers={"X-User-Id": user_id})
    fid_original = res_create.json()["id"]
    client.post(f"/formatos/{fid_original}/items/{p_id}", json={"cantidad": 3})

    response = client.post(f"/formatos/{fid_original}/aprobar", headers=auth_headers(user_id))
    assert response.status_code == 200
    cotizacion = response.json()

    assert cotizacion["state"] == "COTIZACION"
    assert cotizacion["id"] != fid_original
    assert len(cotizacion["items"]) == 1
    assert cotizacion["items"][0]["quantity"] == 3

    res_original = client.get(f"/formatos/{fid_original}", headers=auth_headers(user_id))
    assert res_original.status_code == 200
    original_data = res_original.json()
    assert original_data["state"] == "BORRADOR"
    assert original_data["items"] == []


def test_borrador_original_sigue_editable_tras_clonar_cotizacion():
    """
    Tras clonar, el cliente puede seguir agregando productos de inmediato
    al borrador original sin bloqueo — soluciona el bug reportado por
    soporte de "ya no puedo comprar otra cosa" tras generar una cotización.
    """
    user_id = str(uuid4())
    p_id = uuid4()
    p_id_2 = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("50.00"), name="Switch A", is_active=True))
    product_repo.add(Product(id=p_id_2, stock=10, price_public=Decimal("20.00"), name="Cable B", is_active=True))

    res_create = client.post("/formatos/", headers={"X-User-Id": user_id})
    fid_original = res_create.json()["id"]
    client.post(f"/formatos/{fid_original}/items/{p_id}", json={"cantidad": 1})
    client.post(f"/formatos/{fid_original}/aprobar", headers=auth_headers(user_id))

    response = client.post(f"/formatos/{fid_original}/items/{p_id_2}", json={"cantidad": 1})
    assert response.status_code == 200
    assert response.json()["state"] == "BORRADOR"
    assert len(response.json()["items"]) == 1


def test_resuelta_tambien_clona_al_generar_cotizacion():
    """FU-T-07 (RESUELTA -> COTIZACION) sigue el mismo patrón de clonación
    que FU-T-03 (BORRADOR -> COTIZACION)."""
    user_id = uuid4()
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("15.00"), name="Item resuelto", is_active=True))

    fu = FormatoUnico(
        state=FormatoUnicoState.RESUELTA,
        customer_id=user_id,
        items=[FormatoUnicoItem(product_id=p_id, quantity=2, unit_price=Decimal("15.00"))],
        consultant_note="Recomendado.",
    )
    formato_repo.save(fu)

    response = client.post(f"/formatos/{fu.id}/aprobar", headers=auth_headers(str(user_id)))
    assert response.status_code == 200
    assert response.json()["state"] == "COTIZACION"
    assert response.json()["id"] != str(fu.id)

    original = formato_repo.get_by_id(fu.id)
    assert original.state == FormatoUnicoState.BORRADOR
    assert original.items == []


# ---------------------------------------------------------------------------
# T6-B2: Resolución del borrador activo ante múltiples BORRADOR
# ---------------------------------------------------------------------------

def test_get_active_by_customer_id_resuelve_el_borrador_mas_reciente():
    user_id = uuid4()

    fu_viejo = FormatoUnico(state=FormatoUnicoState.BORRADOR, customer_id=user_id)
    fu_viejo.updated_at = datetime.utcnow() - timedelta(days=5)
    formato_repo.save(fu_viejo)

    fu_reciente = FormatoUnico(state=FormatoUnicoState.BORRADOR, customer_id=user_id)
    formato_repo.save(fu_reciente)

    activo = formato_repo.get_active_by_customer_id(user_id)
    assert activo.id == fu_reciente.id


# ---------------------------------------------------------------------------
# T6-B3: Widget de Recompra — Reemplazar / Combinar borrador
# ---------------------------------------------------------------------------

def test_reemplazar_borrador_copia_items_del_historico():
    user_id = uuid4()
    p_historico = uuid4()
    p_activo = uuid4()
    product_repo.add(Product(id=p_historico, stock=10, price_public=Decimal("100.00"), name="Router Hist", is_active=True))
    product_repo.add(Product(id=p_activo, stock=10, price_public=Decimal("10.00"), name="Cable Activo", is_active=True))

    historico = FormatoUnico(
        state=FormatoUnicoState.COTIZACION,
        customer_id=user_id,
        items=[FormatoUnicoItem(product_id=p_historico, quantity=2, unit_price=Decimal("100.00"))],
    )
    formato_repo.save(historico)

    activo = FormatoUnico(
        state=FormatoUnicoState.BORRADOR,
        customer_id=user_id,
        items=[FormatoUnicoItem(product_id=p_activo, quantity=5, unit_price=Decimal("10.00"))],
    )
    formato_repo.save(activo)

    response = client.post(f"/formatos/{historico.id}/reemplazar-borrador", headers=auth_headers(str(user_id)))
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == str(p_historico)
    assert data["items"][0]["quantity"] == 2


def test_combinar_con_borrador_suma_cantidades_de_producto_repetido():
    user_id = uuid4()
    p_comun = uuid4()
    p_solo_historico = uuid4()
    product_repo.add(Product(id=p_comun, stock=100, price_public=Decimal("50.00"), name="Switch Comun", is_active=True))
    product_repo.add(Product(id=p_solo_historico, stock=100, price_public=Decimal("30.00"), name="Patch cord", is_active=True))

    historico = FormatoUnico(
        state=FormatoUnicoState.COTIZACION,
        customer_id=user_id,
        items=[
            FormatoUnicoItem(product_id=p_comun, quantity=3, unit_price=Decimal("50.00")),
            FormatoUnicoItem(product_id=p_solo_historico, quantity=1, unit_price=Decimal("30.00")),
        ],
    )
    formato_repo.save(historico)

    activo = FormatoUnico(
        state=FormatoUnicoState.BORRADOR,
        customer_id=user_id,
        items=[FormatoUnicoItem(product_id=p_comun, quantity=2, unit_price=Decimal("50.00"))],
    )
    formato_repo.save(activo)

    response = client.post(f"/formatos/{historico.id}/combinar-borrador", headers=auth_headers(str(user_id)))
    assert response.status_code == 200
    data = response.json()
    items_by_id = {i["product_id"]: i["quantity"] for i in data["items"]}
    assert items_by_id[str(p_comun)] == 5
    assert items_by_id[str(p_solo_historico)] == 1


def test_reemplazar_borrador_requiere_ownership():
    owner_id = uuid4()
    intruder_id = uuid4()
    historico = FormatoUnico(state=FormatoUnicoState.COTIZACION, customer_id=owner_id, items=[])
    formato_repo.save(historico)

    response = client.post(f"/formatos/{historico.id}/reemplazar-borrador", headers=auth_headers(str(intruder_id)))
    assert response.status_code == 403


def test_combinar_borrador_omite_producto_inactivo_sin_fallar():
    user_id = uuid4()
    p_activo_prod = uuid4()
    p_inactivo = uuid4()
    product_repo.add(Product(id=p_activo_prod, stock=10, price_public=Decimal("40.00"), name="Producto Activo", is_active=True))
    product_repo.add(Product(id=p_inactivo, stock=10, price_public=Decimal("40.00"), name="Producto Discontinuado", is_active=False))

    historico = FormatoUnico(
        state=FormatoUnicoState.EXPIRADA,
        customer_id=user_id,
        items=[
            FormatoUnicoItem(product_id=p_activo_prod, quantity=1, unit_price=Decimal("40.00")),
            FormatoUnicoItem(product_id=p_inactivo, quantity=1, unit_price=Decimal("40.00")),
        ],
    )
    formato_repo.save(historico)

    response = client.post(f"/formatos/{historico.id}/combinar-borrador", headers=auth_headers(str(user_id)))
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == str(p_activo_prod)


# ---------------------------------------------------------------------------
# RF-FU-002 (documentado, nunca implementado — requerido por el Drawer T6-F4)
# ---------------------------------------------------------------------------

def test_eliminar_item_del_formato():
    user_id = str(uuid4())
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("25.00"), name="Item a eliminar", is_active=True))

    res_create = client.post("/formatos/", headers={"X-User-Id": user_id})
    fid = res_create.json()["id"]
    client.post(f"/formatos/{fid}/items/{p_id}", json={"cantidad": 1})

    response = client.delete(f"/formatos/{fid}/items/{p_id}")
    assert response.status_code == 200
    assert response.json()["items"] == []
    assert float(response.json()["subtotal"]) == 0.0


def test_solicitar_consulta_transiciona_a_consulta():
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("25.00"), name="Item consulta", is_active=True))

    res_create = client.post("/formatos/")
    fid = res_create.json()["id"]
    client.post(f"/formatos/{fid}/items/{p_id}", json={"cantidad": 1})

    response = client.post(f"/formatos/{fid}/solicitar-consulta")
    assert response.status_code == 200
    assert response.json()["state"] == "CONSULTA"


# ---------------------------------------------------------------------------
# T6-B4: Bandera hasHistory
# ---------------------------------------------------------------------------

def test_tiene_historial_false_sin_cotizaciones():
    user_id = str(uuid4())
    response = client.get("/formatos/tiene-historial", headers=auth_headers(user_id))
    assert response.status_code == 200
    assert response.json()["has_history"] is False


def test_tiene_historial_true_tras_generar_cotizacion():
    user_id = str(uuid4())
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("10.00"), name="Item Historial", is_active=True))
    res_create = client.post("/formatos/", headers={"X-User-Id": user_id})
    fid = res_create.json()["id"]
    client.post(f"/formatos/{fid}/items/{p_id}", json={"cantidad": 1})
    client.post(f"/formatos/{fid}/aprobar", headers=auth_headers(user_id))

    response = client.get("/formatos/tiene-historial", headers=auth_headers(user_id))
    assert response.status_code == 200
    assert response.json()["has_history"] is True
