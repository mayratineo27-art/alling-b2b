from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import AuthService

client = TestClient(app)

def auth_headers(user_id: str) -> dict:
    token = AuthService.crear_token({"sub": user_id, "role": "CUSTOMER"})
    return {"Authorization": f"Bearer {token}"}

def test_crear_formato_unico_endpoint():
    """Prueba que el endpoint POST /formatos/ cree un Formato Único vacío en BORRADOR."""
    response = client.post("/formatos/")
    
    assert response.status_code == 201
    
    data = response.json()
    assert data["state"] == "BORRADOR"
    assert data["items"] == []

def test_no_se_puede_aprobar_formato_vacio_api():
    """Prueba que el endpoint maneje correctamente una DomainException con HTTP 400."""
    user_id = "123e4567-e89b-12d3-a456-426614174000"
    client.post("/formatos/", headers={"X-User-Id": user_id})
    # Ocupamos buscar el ID del formato recién creado
    res_list = client.get("/formatos/historial/?skip=0&limit=10", headers=auth_headers(user_id))
    fid = res_list.json()[0]["id"]
    
    response = client.post(f"/formatos/{fid}/aprobar", headers=auth_headers(user_id))
    
    assert response.status_code == 400
    assert response.json() == {"detail": "No se puede aprobar un Formato Único sin ítems"}

def test_aprobar_transiciona_a_cotizacion_no_a_aprobado():
    """
    RF-FU-005 / FU-T-03: "Generar Cotización" debe transicionar BORRADOR
    directamente a COTIZACION (no a un estado APROBADO no documentado en la
    FSM-01). Solo CUSTOMER dueño del FU puede hacerlo.
    """
    from uuid import uuid4
    from app.api.endpoints.catalogo import mock_repo as product_repo
    from app.domain.product import Product
    from decimal import Decimal

    user_id = "123e4567-e89b-12d3-a456-426614174001"
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("100.00"), name="Router", is_active=True))

    res_create = client.post("/formatos/", headers={"X-User-Id": user_id})
    fid = res_create.json()["id"]
    client.post(f"/formatos/{fid}/items/{p_id}", json={"cantidad": 1})

    response = client.post(f"/formatos/{fid}/aprobar", headers=auth_headers(user_id))
    assert response.status_code == 200
    assert response.json()["state"] == "COTIZACION"


def test_guest_no_puede_generar_cotizacion():
    """RF-FU-005: GUEST (sin JWT) no puede generar cotización, solo CUSTOMER."""
    response = client.post("/formatos/00000000-0000-0000-0000-000000000099/aprobar")
    assert response.status_code == 401


def test_otro_customer_no_puede_generar_cotizacion_de_fu_ajeno():
    """Ownership: un CUSTOMER no puede aprobar el FU de otro CUSTOMER."""
    from uuid import uuid4
    from app.api.endpoints.catalogo import mock_repo as product_repo
    from app.domain.product import Product
    from decimal import Decimal

    owner_id = "123e4567-e89b-12d3-a456-426614174002"
    intruder_id = "123e4567-e89b-12d3-a456-426614174003"
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("100.00"), name="Router", is_active=True))

    res_create = client.post("/formatos/", headers={"X-User-Id": owner_id})
    fid = res_create.json()["id"]
    client.post(f"/formatos/{fid}/items/{p_id}", json={"cantidad": 1})

    response = client.post(f"/formatos/{fid}/aprobar", headers=auth_headers(intruder_id))
    assert response.status_code == 403


def test_cancelar_cotizacion_vuelve_a_borrador_preservando_items():
    """
    RF-FU-020 / FU-T-15 (RN-FU-06): el CUSTOMER dueño puede cancelar una
    cotización vigente en cualquier momento, sin esperar el vencimiento de
    15 días. El FU vuelve a BORRADOR conservando sus ítems para poder seguir
    agregando productos (ver conversación de soporte sobre "vence en 8 días").

    Sprint 6 (Patrón de Clonación): "aprobar" ya no muta el FU original —
    retorna un FU CLONADO e independiente en COTIZACION. La cancelación se
    ejecuta sobre ese clon, no sobre el FU original (que ya quedó en
    BORRADOR vacío desde el momento de la clonación).
    """
    from uuid import uuid4
    from app.api.endpoints.catalogo import mock_repo as product_repo
    from app.domain.product import Product
    from decimal import Decimal

    user_id = "123e4567-e89b-12d3-a456-426614174020"
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("100.00"), name="Router", is_active=True))

    res_create = client.post("/formatos/", headers={"X-User-Id": user_id})
    fid = res_create.json()["id"]
    client.post(f"/formatos/{fid}/items/{p_id}", json={"cantidad": 2})

    res_aprobar = client.post(f"/formatos/{fid}/aprobar", headers=auth_headers(user_id))
    assert res_aprobar.json()["state"] == "COTIZACION"
    fid_cotizacion = res_aprobar.json()["id"]

    response = client.post(f"/formatos/{fid_cotizacion}/cancelar-cotizacion", headers=auth_headers(user_id))

    assert response.status_code == 200
    data = response.json()
    assert data["state"] == "BORRADOR"
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2


def test_cancelar_cotizacion_fuera_de_estado_retorna_409():
    """Solo se puede cancelar un FU que esté en COTIZACION (RN-FU-06)."""
    user_id = "123e4567-e89b-12d3-a456-426614174021"
    res_create = client.post("/formatos/", headers={"X-User-Id": user_id})
    fid = res_create.json()["id"]

    response = client.post(f"/formatos/{fid}/cancelar-cotizacion", headers=auth_headers(user_id))
    assert response.status_code == 409


def test_otro_customer_no_puede_cancelar_cotizacion_ajena():
    """Ownership: un CUSTOMER no puede cancelar la cotización de otro CUSTOMER."""
    from uuid import uuid4
    from app.api.endpoints.catalogo import mock_repo as product_repo
    from app.domain.product import Product
    from decimal import Decimal

    owner_id = "123e4567-e89b-12d3-a456-426614174022"
    intruder_id = "123e4567-e89b-12d3-a456-426614174023"
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("100.00"), name="Router", is_active=True))

    res_create = client.post("/formatos/", headers={"X-User-Id": owner_id})
    fid = res_create.json()["id"]
    client.post(f"/formatos/{fid}/items/{p_id}", json={"cantidad": 1})
    res_aprobar = client.post(f"/formatos/{fid}/aprobar", headers=auth_headers(owner_id))
    fid_cotizacion = res_aprobar.json()["id"]

    response = client.post(f"/formatos/{fid_cotizacion}/cancelar-cotizacion", headers=auth_headers(intruder_id))
    assert response.status_code == 403


def test_detalle_formato_requiere_ownership():
    """
    RNF-SEC-001 / NAV-FU-003: GET /formatos/{id} (SCR-FU-002 "Ver detalle")
    debe exigir sesión CUSTOMER y bloquear el acceso al FU de otro usuario.
    """
    from uuid import uuid4
    from app.api.endpoints.catalogo import mock_repo as product_repo
    from app.domain.product import Product
    from decimal import Decimal

    owner_id = "123e4567-e89b-12d3-a456-426614174010"
    intruder_id = "123e4567-e89b-12d3-a456-426614174011"
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("100.00"), name="Router", is_active=True))

    res_create = client.get("/formatos/me", headers=auth_headers(owner_id))
    fid = res_create.json()["id"]
    client.post(f"/formatos/{fid}/items/{p_id}", json={"cantidad": 1})

    # Sin sesión → 401
    assert client.get(f"/formatos/{fid}").status_code == 401

    # Otro CUSTOMER → 403
    assert client.get(f"/formatos/{fid}", headers=auth_headers(intruder_id)).status_code == 403

    # El dueño → 200
    res_owner = client.get(f"/formatos/{fid}", headers=auth_headers(owner_id))
    assert res_owner.status_code == 200
    assert res_owner.json()["id"] == fid


def test_obtener_historial_formatos_api():
    """Prueba la obtención del historial paginado de formatos (RF-FU-011)."""
    user_id = "123e4567-e89b-12d3-a456-426614174000"
    headers = {"X-User-Id": user_id}
    
    # Simular la creación de 3 formatos para este usuario
    for _ in range(3):
        client.post("/formatos/", headers=headers)
        
    response = client.get("/formatos/historial/?skip=0&limit=10", headers=auth_headers(user_id))
    
    assert response.status_code == 200
    data = response.json()
    
    # Verificar que retorna una lista de al menos 3
    assert isinstance(data, list)
    assert len(data) >= 3
    
    # Verificar que la estructura incluye el estado
    assert "state" in data[0]

def test_historial_expone_consultant_note_y_pdf_url():
    """
    RF-FU-010 (redisenio /cotizaciones y /consultas): el historial debe
    exponer consultant_note (respuesta del asesor, CA-FU-010) y pdf_url
    (indicador de PDF disponible en cotizaciones, RF-FU-007) para que el
    frontend pueda mostrarlos sin una llamada adicional por FU.
    """
    from app.api.endpoints.formato_unico import mock_repo
    from app.domain.formato_unico import FormatoUnico, FormatoUnicoItem, FormatoUnicoState
    from uuid import uuid4, UUID
    from decimal import Decimal

    user_id = "123e4567-e89b-12d3-a456-426614174002"
    fu = FormatoUnico(
        state=FormatoUnicoState.RESUELTA,
        customer_id=UUID(user_id),
        items=[FormatoUnicoItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.00"))],
        consultant_note="Recomendamos el kit Cat6 para su instalación.",
        pdf_url="https://cdn.example.com/cotizaciones/abc.pdf",
    )
    fu.recalcular_subtotal()
    mock_repo.save(fu)

    response = client.get("/formatos/historial/?skip=0&limit=50", headers=auth_headers(user_id))

    assert response.status_code == 200
    encontrado = next(f for f in response.json() if f["id"] == str(fu.id))
    assert encontrado["consultant_note"] == "Recomendamos el kit Cat6 para su instalación."
    assert encontrado["pdf_url"] == "https://cdn.example.com/cotizaciones/abc.pdf"


def test_historial_sin_slash_final_no_colisiona_con_ruta_id():
    """
    Regresión: el proxy de Next.js recorta el slash final de /formatos/historial/
    antes de reenviar al backend. Con redirect_slashes=False, si /{id} está
    registrada antes que /historial en el router, Starlette captura "historial"
    como id y responde 422 "Input should be a valid UUID" en vez de la lista.
    """
    user_id = "123e4567-e89b-12d3-a456-426614174000"
    client.post("/formatos/", headers={"X-User-Id": user_id})

    response = client.get("/formatos/historial?skip=0&limit=10", headers=auth_headers(user_id))

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_configuracion_ui_endpoint():
    formato_id = "00000000-0000-0000-0000-000000000003"
    user_id = "123e4567-e89b-12d3-a456-426614174000"
    
    # Crear un formato para probar
    client.post("/formatos/", headers={"X-User-Id": user_id})
    # Ocupamos buscar el ID del formato recién creado
    res_list = client.get("/formatos/historial/?skip=0&limit=10", headers=auth_headers(user_id))
    fid = res_list.json()[0]["id"]
    
    response = client.get(
        f"/formatos/{fid}/configuracion-ui/",
        headers={"X-User-Id": user_id}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["color"] == "blue"
    assert data["mensaje"] == "Edición abierta"
    assert "icono" in data

def test_agregar_item_al_formato_unico():
    from uuid import uuid4
    from app.api.endpoints.catalogo import mock_repo as product_repo
    from app.domain.product import Product
    from decimal import Decimal
    
    user_id = "123e4567-e89b-12d3-a456-426614174000"
    
    # 1. Crear producto con stock suficiente
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("150.00"), name="Router", is_active=True))
    
    # 2. Crear formato único
    res_create = client.post("/formatos/", headers={"X-User-Id": user_id})
    assert res_create.status_code == 201
    fid = res_create.json()["id"]
    
    # 3. Agregar producto al formato (POST /{id}/items/{product_id})
    res_add = client.post(f"/formatos/{fid}/items/{p_id}", json={"cantidad": 2})
    assert res_add.status_code == 200
    
    data = res_add.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == str(p_id)
    assert data["items"][0]["quantity"] == 2
    
    # 4. Agregar el mismo producto incrementa la cantidad
    res_add_again = client.post(f"/formatos/{fid}/items/{p_id}", json={"cantidad": 3})
    assert res_add_again.status_code == 200
    
    data_again = res_add_again.json()
    assert len(data_again["items"]) == 1
    assert data_again["items"][0]["quantity"] == 5


def test_vaciar_formato_unico_customer_elimina_todos_los_items():
    """RF-FU-003 (BTN-FU-002 'Vaciar Formato Único'): reporte de soporte
    'no se puede vaciar el formato'. El endpoint ya existía y funcionaba,
    pero un proceso de backend obsoleto (sin reiniciar) no lo tenía cargado
    — este test cierra la ausencia total de cobertura sobre TEST-FU-003."""
    from uuid import uuid4
    from app.api.endpoints.catalogo import mock_repo as product_repo
    from app.domain.product import Product
    from decimal import Decimal

    user_id = str(uuid4())
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("100.00"), name="Router", is_active=True))

    fu_id = client.get("/formatos/me", headers=auth_headers(user_id)).json()["id"]
    client.post(f"/formatos/{fu_id}/items/{p_id}", json={"cantidad": 2}, headers=auth_headers(user_id))

    response = client.delete(f"/formatos/{fu_id}/items", headers=auth_headers(user_id))

    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert float(data["subtotal"]) == 0.0
    assert data["state"] == "BORRADOR"


def test_vaciar_formato_unico_guest_via_order_token():
    """RF-FU-003: el flujo GUEST (cookie order_token) también debe poder vaciar."""
    from uuid import uuid4
    from app.api.endpoints.catalogo import mock_repo as product_repo
    from app.domain.product import Product
    from decimal import Decimal

    guest_client = TestClient(app, base_url="http://localhost")
    session_res = guest_client.post("/formatos/session")
    fu_id = guest_client.get("/formatos/me").json()["id"]

    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("50.00"), name="Cable", is_active=True))
    guest_client.post(f"/formatos/{fu_id}/items/{p_id}", json={"cantidad": 1})

    response = guest_client.delete(f"/formatos/{fu_id}/items")

    assert response.status_code == 200
    assert response.json()["items"] == []


def test_vaciar_formato_unico_ajeno_de_otro_customer_retorna_403():
    """RNF-SEC-001: al igual que agregar_kit_al_formato, este endpoint no
    validaba ownership — cualquier CUSTOMER podía vaciar el FU de otro
    adivinando su UUID."""
    from uuid import uuid4

    owner_id = str(uuid4())
    intruder_id = str(uuid4())

    fu_id = client.get("/formatos/me", headers=auth_headers(owner_id)).json()["id"]

    response = client.delete(f"/formatos/{fu_id}/items", headers=auth_headers(intruder_id))

    assert response.status_code == 403


def test_vaciar_formato_unico_sin_order_token_retorna_403():
    """RNF-SEC-001: un GUEST sin la cookie order_token correcta no puede vaciar el FU ajeno."""
    owner_client = TestClient(app, base_url="http://localhost")
    owner_client.post("/formatos/session")
    fu_id = owner_client.get("/formatos/me").json()["id"]

    anon_client = TestClient(app, base_url="http://localhost")
    response = anon_client.delete(f"/formatos/{fu_id}/items")

    assert response.status_code == 403


def test_vaciar_formato_unico_fuera_de_borrador_retorna_error():
    """RF-FU-003: 'Vaciar' solo está disponible en BORRADOR."""
    from uuid import uuid4
    from app.api.endpoints.catalogo import mock_repo as product_repo
    from app.domain.product import Product
    from decimal import Decimal

    user_id = str(uuid4())
    p_id = uuid4()
    product_repo.add(Product(id=p_id, stock=10, price_public=Decimal("100.00"), name="Router", is_active=True))

    fu_id = client.get("/formatos/me", headers=auth_headers(user_id)).json()["id"]
    client.post(f"/formatos/{fu_id}/items/{p_id}", json={"cantidad": 1}, headers=auth_headers(user_id))
    res_aprobar = client.post(f"/formatos/{fu_id}/aprobar", headers=auth_headers(user_id))
    cotizacion_id = res_aprobar.json()["id"]

    response = client.delete(f"/formatos/{cotizacion_id}/items", headers=auth_headers(user_id))

    assert response.status_code == 400
