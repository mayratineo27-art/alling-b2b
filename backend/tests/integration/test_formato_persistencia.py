"""
Tests de Integración: Persistencia Diferenciada FU (GUEST vs CUSTOMER)
RF-CHK-007, RF-AUT-007, RNF-SEC-001, RNF-SEC-002

Valida:
1. Flujo GUEST completo via cookie httpOnly
2. Aislación por customer_id (contrato de código, sin PostgreSQL RLS en esta fase)
3. Fusión GUEST→CUSTOMER preservando ítems
4. Contrato de API: ningún endpoint público expone fu_id ni order_token en body JSON
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import AuthService

# ──────────────────────────────────────────────────────────────────────────────
# Fixtures y helpers
# ──────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """TestClient con cookies habilitadas para simular browser."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


def make_jwt(user_id: str, role: str = "CUSTOMER") -> str:
    """Genera un JWT de prueba firmado con la clave del sistema."""
    return AuthService.crear_token({"sub": user_id, "role": role})


def auth_headers(user_id: str) -> dict:
    return {"Authorization": f"Bearer {make_jwt(user_id)}"}


# ──────────────────────────────────────────────────────────────────────────────
# TEST 1: GUEST crea FU via cookie httpOnly y lo recupera
# ──────────────────────────────────────────────────────────────────────────────

def test_guest_creates_fu_via_cookie_and_retrieves_it(client):
    """
    RF-CHK-007: POST /formatos/session debe:
      - Retornar 201 con estado BORRADOR (NO el fu_id).
      - Setear una cookie 'order_token' con HttpOnly=True.
    Luego GET /formatos/me con esa cookie debe:
      - Retornar el FU activo en BORRADOR.
    """
    # 1. Crear sesión GUEST
    res = client.post("/formatos/session")
    assert res.status_code == 201, f"Esperado 201, recibido {res.status_code}: {res.text}"

    body = res.json()
    # El body NUNCA debe exponer fu_id ni order_token (Regla: no exponer IDs de sesión)
    assert "id" not in body, "VIOLACIÓN SEGURIDAD: body expone fu_id en sesión GUEST"
    assert "order_token" not in body, "VIOLACIÓN SEGURIDAD: body expone order_token"
    assert body["state"] == "BORRADOR"

    # 2. Verificar cookie httpOnly en Set-Cookie header
    # TestClient expone el header crudo en res.headers (puede haber múltiples Set-Cookie)
    # Recopilar TODOS los valores de Set-Cookie (requests puede combinarlos con coma)
    raw_headers = res.headers.get_list("set-cookie") if hasattr(res.headers, "get_list") else []
    if not raw_headers:
        # Fallback: usar el header combinado
        raw_headers = [res.headers.get("set-cookie", "")]
    
    set_cookie_combined = "; ".join(raw_headers).lower()
    
    # Alternativamente, verificar directamente el endpoint del backend usando el diccionario de cookies
    # TestClient guarda las cookies procesadas en client.cookies
    assert "order_token" in client.cookies, "Cookie order_token no fue guardada por el cliente"
    
    # Para verificar los atributos httpOnly, necesitamos inspeccionar los headers crudos.
    # El atributo httpOnly hace que el cookie NO sea accesible via JS (por definición).
    # En FastAPI TestClient, podemos verificar esto en el response.headers directamente.
    raw_set_cookie = ""
    for header_name, header_val in res.raw.headers.items() if hasattr(res, 'raw') else []:
        if header_name.lower() == b"set-cookie" if isinstance(header_name, bytes) else "set-cookie":
            raw_set_cookie += (header_val.decode() if isinstance(header_val, bytes) else header_val).lower()
    
    if not raw_set_cookie:
        # httpx (usado internamente por TestClient) accesible via response.headers
        raw_set_cookie = res.headers.get("set-cookie", "").lower()
    
    assert "order_token" in raw_set_cookie, f"order_token no aparece en Set-Cookie. Header: {raw_set_cookie}"
    assert "httponly" in raw_set_cookie, (
        f"Cookie NO tiene atributo HttpOnly. Set-Cookie header: {raw_set_cookie}. "
        "Verificar que el backend use httponly=True en set_cookie()."
    )
    assert "samesite=lax" in raw_set_cookie, f"Cookie debe tener SameSite=Lax. Header: {raw_set_cookie}"


    # 3. GET /formatos/me con la cookie automáticamente seteada por TestClient
    me_res = client.get("/formatos/me")
    assert me_res.status_code == 200, f"GET /formatos/me falló: {me_res.text}"

    me_data = me_res.json()
    assert me_data["state"] == "BORRADOR"
    assert "id" in me_data  # El FU ID SÍ se devuelve en /me (para uso interno del cliente)
    assert isinstance(me_data["items"], list)


# ──────────────────────────────────────────────────────────────────────────────
# TEST 2: FU de un CUSTOMER no es visible para otro CUSTOMER
# ──────────────────────────────────────────────────────────────────────────────

def test_customer_fu_isolated_by_customer_id(client):
    """
    RNF-SEC-002: Aislación por customer_id a nivel de código.
    USER_A no debe ver el FU de USER_B al consultar /formatos/me.
    """
    user_a = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    user_b = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"

    # Crear FU para USER_A via /formatos/me (auto-crea si no existe)
    res_a = client.get("/formatos/me", headers=auth_headers(user_a))
    assert res_a.status_code == 200
    fu_a_id = res_a.json()["id"]

    # Crear FU para USER_B
    res_b = client.get("/formatos/me", headers=auth_headers(user_b))
    assert res_b.status_code == 200
    fu_b_id = res_b.json()["id"]

    # Los FUs deben ser distintos
    assert fu_a_id != fu_b_id, "USER_A y USER_B comparten el mismo FU — falla de aislación"

    # USER_B consulta /formatos/me → debe ver SU FU, no el de USER_A
    res_b_check = client.get("/formatos/me", headers=auth_headers(user_b))
    assert res_b_check.status_code == 200
    assert res_b_check.json()["id"] == fu_b_id, "USER_B recibió el FU de USER_A"

    # USER_A intenta acceder directamente al FU de USER_B via GET /{id}
    # (El sistema actual retorna el FU si el ID es conocido — esto es aceptable
    #  en mock. En Fase 5 con RLS de PostgreSQL, esto será 403/0 filas.)
    # Por ahora verificamos que /formatos/me NO retorna el FU ajeno.
    res_a_me = client.get("/formatos/me", headers=auth_headers(user_a))
    assert res_a_me.json()["id"] == fu_a_id, "USER_A recibió el FU de USER_B en /formatos/me"


# ──────────────────────────────────────────────────────────────────────────────
# TEST 3: Fusión GUEST→CUSTOMER preserva ítems
# ──────────────────────────────────────────────────────────────────────────────

def test_guest_to_customer_merge_preserves_items(client):
    """
    RF-AUT-007:
    1. GUEST crea FU y agrega ítems (via POST /formatos/ legacy, ya que /formatos/{id}/kits
       necesita un kit existente — aquí probamos la lógica de merge directamente).
    2. Login como CUSTOMER.
    3. POST /formatos/merge → fusiona ítems.
    4. Cookie order_token debe ser borrada.
    5. GET /formatos/me con JWT → FU del CUSTOMER tiene los ítems del GUEST.
    """
    from app.api.endpoints.formato_unico import mock_repo
    from app.domain.formato_unico import FormatoUnico, FormatoUnicoItem, FormatoUnicoState
    from decimal import Decimal
    from uuid import uuid4

    customer_id = "cccccccc-cccc-cccc-cccc-cccccccccccc"
    product_id = uuid4()

    # 1. Crear sesión GUEST y poblar su FU directamente en el repositorio
    #    (simulamos que el GUEST ya agregó un ítem sin pasar por el catálogo)
    res_session = client.post("/formatos/session")
    assert res_session.status_code == 201

    # Extraer el order_token de la cookie para inspección
    set_cookie = res_session.headers.get("set-cookie", "")
    order_token = None
    for part in set_cookie.split(";"):
        part = part.strip()
        if part.startswith("order_token="):
            order_token = part.removeprefix("order_token=")
            break

    assert order_token is not None, "No se pudo extraer order_token de la cookie"

    # Agregar ítem al FU GUEST directamente en el repo (simula que el usuario agregó algo al carrito)
    guest_fu = mock_repo.get_by_order_token(order_token)
    assert guest_fu is not None, "No se encontró el FU GUEST por order_token"
    
    guest_item = FormatoUnicoItem(
        product_id=product_id,
        quantity=2,
        unit_price=Decimal("100.00")
    )
    guest_fu.items.append(guest_item)
    guest_fu.recalcular_subtotal()
    mock_repo.save(guest_fu)

    # 2. POST /formatos/merge con JWT del CUSTOMER (la cookie se envía automáticamente por TestClient)
    jwt_token = make_jwt(customer_id)
    merge_res = client.post(
        "/formatos/merge",
        headers={"Authorization": f"Bearer {jwt_token}"}
    )
    assert merge_res.status_code == 200, f"Merge falló: {merge_res.text}"

    merged_fu = merge_res.json()

    # 3. El FU fusionado debe tener el ítem del GUEST
    assert len(merged_fu["items"]) >= 1, "El merge no transfirió los ítems del GUEST"
    item_ids = [str(item["product_id"]) for item in merged_fu["items"]]
    assert str(product_id) in item_ids, "El ítem del GUEST no apareció en el FU del CUSTOMER"

    # 4. Verificar que la cookie order_token fue borrada por el backend
    delete_cookie_header = merge_res.headers.get("set-cookie", "")
    # En delete_cookie, FastAPI emite "order_token=; Max-Age=0" o similar
    cookie_cleared = (
        "order_token=" in delete_cookie_header and "max-age=0" in delete_cookie_header.lower()
    )
    assert cookie_cleared, f"La cookie order_token NO fue borrada tras el merge. Set-Cookie: {delete_cookie_header}"

    # 5. GET /formatos/me con JWT → sigue viendo el FU del CUSTOMER con los ítems del GUEST
    me_res = client.get("/formatos/me", headers={"Authorization": f"Bearer {jwt_token}"})
    assert me_res.status_code == 200
    assert len(me_res.json()["items"]) >= 1


# ──────────────────────────────────────────────────────────────────────────────
# TEST 3b: Fusión GUEST→CUSTOMER autenticando via cookie session_token (flujo real
# del frontend: apiClient usa withCredentials, NUNCA envía Authorization header)
# ──────────────────────────────────────────────────────────────────────────────

def test_guest_to_customer_merge_via_session_cookie(client):
    """
    RF-AUT-007: el frontend real (apiClient.post("/formatos/merge")) autentica
    exclusivamente via cookie httpOnly `session_token`, nunca via header
    Authorization. El endpoint debe aceptar ese mecanismo igual que el resto
    de rutas protegidas (get_current_user ya soporta ambos).
    """
    from app.api.endpoints.formato_unico import mock_repo
    from app.domain.formato_unico import FormatoUnicoItem
    from decimal import Decimal
    from uuid import uuid4

    customer_id = "dddddddd-dddd-dddd-dddd-dddddddddddd"
    product_id = uuid4()

    # 1. GUEST crea sesión y agrega un ítem directamente en el repo
    res_session = client.post("/formatos/session")
    assert res_session.status_code == 201
    order_token = client.cookies.get("order_token")
    assert order_token

    guest_fu = mock_repo.get_by_order_token(order_token)
    guest_fu.items.append(FormatoUnicoItem(product_id=product_id, quantity=1, unit_price=Decimal("50.00")))
    guest_fu.recalcular_subtotal()
    mock_repo.save(guest_fu)

    # 2. Simular sesión CUSTOMER como lo hace el navegador real: cookie
    # session_token, SIN header Authorization.
    jwt_token = make_jwt(customer_id)
    client.cookies.set("session_token", jwt_token)

    merge_res = client.post("/formatos/merge")
    assert merge_res.status_code == 200, (
        f"Merge via cookie session_token falló (RF-AUT-007): {merge_res.status_code} {merge_res.text}"
    )
    item_ids = [str(item["product_id"]) for item in merge_res.json()["items"]]
    assert str(product_id) in item_ids


# ──────────────────────────────────────────────────────────────────────────────
# TEST 3c: GET /formatos/me reconoce a CUSTOMER via cookie session_token
# (el frontend real nunca envía Authorization header, solo cookies httpOnly)
# ──────────────────────────────────────────────────────────────────────────────

def test_formatos_me_reconoce_customer_via_session_cookie(client):
    """
    RF-CHK-007 / RNF-SEC-002: si el CUSTOMER ya tiene un FU propio (con
    ítems), GET /formatos/me debe devolverlo autenticando por cookie
    session_token — no debe caer al flujo GUEST (order_token) ni dar 404,
    que es justo lo que le pasaba a un CUSTOMER real navegando por el sitio.
    """
    from app.api.endpoints.formato_unico import mock_repo
    from app.domain.formato_unico import FormatoUnicoItem
    from decimal import Decimal
    from uuid import uuid4, UUID

    customer_id = "ffffffff-ffff-ffff-ffff-ffffffffffff"
    product_id = uuid4()

    # El CUSTOMER ya tiene un FU propio con un ítem (creado en una sesión previa)
    res_create = client.get("/formatos/me", headers=auth_headers(customer_id))
    assert res_create.status_code == 200
    fu_id = res_create.json()["id"]
    fu = mock_repo.get_by_id(UUID(fu_id))
    fu.items.append(FormatoUnicoItem(product_id=product_id, quantity=1, unit_price=Decimal("30.00")))
    fu.recalcular_subtotal()
    mock_repo.save(fu)

    # Autenticar SOLO via cookie session_token, como hace apiClient en el navegador real
    jwt_token = make_jwt(customer_id)
    client.cookies.set("session_token", jwt_token)

    res_me = client.get("/formatos/me")
    assert res_me.status_code == 200, f"/formatos/me via cookie falló: {res_me.text}"
    assert res_me.json()["id"] == fu_id
    assert len(res_me.json()["items"]) == 1


# ──────────────────────────────────────────────────────────────────────────────
# TEST 4: Contrato de API — ningún endpoint público expone fu_id/order_token en body
# ──────────────────────────────────────────────────────────────────────────────

def test_api_never_exposes_fu_id_in_public_session_response(client):
    """
    RNF-SEC-001: El endpoint público POST /formatos/session NUNCA debe
    incluir 'id', 'fu_id', 'order_token', 'formato_id' en el body de respuesta.
    Esto garantiza que el identificador de sesión no viaja en JS-accessible JSON.
    """
    res = client.post("/formatos/session")
    assert res.status_code == 201

    body = res.json()
    forbidden_keys = {"id", "fu_id", "order_token", "formato_id", "format_id", "session_id"}
    exposed = forbidden_keys.intersection(set(body.keys()))
    
    assert not exposed, (
        f"VIOLACIÓN RNF-SEC-001: El body expone claves de sesión: {exposed}. "
        f"Body recibido: {body}"
    )

    # Verificar que solo contiene datos de estado (no de identidad)
    assert "state" in body
    assert body["state"] == "BORRADOR"


# ──────────────────────────────────────────────────────────────────────────────
# TEST 5: Autorización mixta para aprobar formato / generar cotización (RF-FU-005)
# ──────────────────────────────────────────────────────────────────────────────

def test_aprobar_cotizacion_authorization_guest_and_customer(client):
    """
    RF-FU-005 / FU-T-03: "Generar Cotización" es exclusivo de CUSTOMER
    (GUEST usa el atajo directo a checkout de FU-T-04, sin cotización).
    1. GUEST intenta aprobar -> 401 (no autenticado, RF-FU-005 no lo permite).
    2. CUSTOMER aprueba su propio FU -> 200, pasa a COTIZACION.
    3. CUSTOMER intenta aprobar FU de otro CUSTOMER -> 403.
    """
    from app.api.endpoints.formato_unico import mock_repo
    from app.domain.formato_unico import FormatoUnicoItem
    from decimal import Decimal
    from uuid import uuid4, UUID

    product_id = uuid4()

    # --- 1. GUEST no puede generar cotización ---
    res_guest = client.post("/formatos/session")
    assert res_guest.status_code == 201
    me_res = client.get("/formatos/me")
    guest_fu_id = me_res.json()["id"]
    guest_fu = mock_repo.get_by_id(UUID(guest_fu_id))
    guest_fu.items.append(FormatoUnicoItem(product_id=product_id, quantity=1, unit_price=Decimal("10.00")))
    mock_repo.save(guest_fu)

    res_aprob_guest = client.post(f"/formatos/{guest_fu.id}/aprobar")
    assert res_aprob_guest.status_code == 401, f"GUEST no debería poder generar cotización: {res_aprob_guest.text}"

    # --- 2. CUSTOMER aprueba su propio FU ---
    customer_id = "dddddddd-dddd-dddd-dddd-dddddddddddd"
    res_cust = client.get("/formatos/me", headers=auth_headers(customer_id))
    assert res_cust.status_code == 200
    cust_fu_id = res_cust.json()["id"]

    cust_fu = mock_repo.get_by_id(UUID(cust_fu_id))
    cust_fu.items.append(FormatoUnicoItem(product_id=product_id, quantity=1, unit_price=Decimal("20.00")))
    mock_repo.save(cust_fu)

    res_aprob_cust = client.post(
        f"/formatos/{cust_fu.id}/aprobar",
        headers=auth_headers(customer_id)
    )
    assert res_aprob_cust.status_code == 200, f"Aprobación CUSTOMER falló: {res_aprob_cust.text}"
    assert res_aprob_cust.json()["state"] == "COTIZACION"

    # --- 3. CUSTOMER intenta aprobar FU de otro CUSTOMER (RLS) ---
    other_customer = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"
    res_rls = client.post(
        f"/formatos/{cust_fu.id}/aprobar",
        headers=auth_headers(other_customer)
    )
    assert res_rls.status_code == 403, f"Esperado 403 por RLS de CUSTOMER, recibido: {res_rls.status_code}"


