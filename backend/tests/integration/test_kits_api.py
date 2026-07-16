from fastapi.testclient import TestClient
from app.main import app
from uuid import uuid4
from decimal import Decimal
from app.domain.kit import Kit, KitComponent
from app.domain.product import Product
from app.api.endpoints.catalogo import mock_repo as product_repo
from app.api.endpoints.kits import mock_kit_repo
from app.services.auth_service import AuthService

client = TestClient(app)


def auth_headers(user_id: str) -> dict:
    token = AuthService.crear_token({"sub": user_id, "role": "CUSTOMER"})
    return {"Authorization": f"Bearer {token}"}


def _crear_kit_con_producto(stock: int = 10) -> tuple:
    prod_id = uuid4()
    product_repo.add(Product(id=prod_id, name="Router para kit", stock=stock, price_public=Decimal("100.00")))
    kit_id = uuid4()
    mock_kit_repo.add(Kit(
        id=kit_id,
        name="Kit Instalación FTTH Básico",
        components=[KitComponent(product_id=prod_id, quantity=2)],
    ))
    return kit_id, prod_id

def test_obtener_detalle_kit():
    """
    Verifica que al consultar GET /kits/{id}/, el API retorne el precio sumado 
    y el stock como el mínimo stock disponible entre sus componentes.
    """
    # 1. Crear productos
    prod1_id = uuid4()
    prod2_id = uuid4()
    
    product_repo.add(Product(
        id=prod1_id,
        name="Producto 1 para kit",
        stock=10,
        price_public=Decimal("50")
    ))
    
    product_repo.add(Product(
        id=prod2_id,
        name="Producto 2 para kit",
        stock=5, # Este limitará el stock del kit a 5
        price_public=Decimal("150")
    ))
    
    # 2. Crear Kit
    kit_id = uuid4()
    mock_kit_repo.add(Kit(
        id=kit_id,
        name="Kit de prueba",
        components=[
            KitComponent(product_id=prod1_id, quantity=1),
            KitComponent(product_id=prod2_id, quantity=1)
        ]
    ))
    
    # 3. Solicitar detalle
    response = client.get(f"/kits/{kit_id}/")
    
    # 4. Validar
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(kit_id)
    assert data["name"] == "Kit de prueba"
    assert data["precio_total"] == "200.00"  # 50 + 150
    assert data["stock_disponible"] == 5 # min(10, 5)


def test_agregar_kit_a_formato_guest_responde_enriquecido_con_trazabilidad():
    """
    Reporte de soporte: "los kits nunca aparecen agregados". El backend sí
    los agrega, pero /{id}/kits no enriquecía la respuesta (product_name
    venía null) ni preservaba de qué kit provenía cada ítem.
    """
    kit_id, prod_id = _crear_kit_con_producto(stock=10)

    session_res = client.post("/formatos/session")
    fu_id = None
    # /formatos/me resuelve el FU recién creado vía cookie order_token
    me_res = client.get("/formatos/me", cookies=session_res.cookies)
    fu_id = me_res.json()["id"]

    response = client.post(
        f"/formatos/{fu_id}/kits",
        json={"kit_id": str(kit_id), "cantidad": 1},
        cookies=session_res.cookies,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    item = data["items"][0]
    assert item["product_id"] == str(prod_id)
    assert item["product_name"] == "Router para kit"  # antes venía null
    assert item["kit_id"] == str(kit_id)
    assert item["kit_name"] == "Kit Instalación FTTH Básico"


def test_agregar_kit_sin_order_token_retorna_403():
    """RNF-SEC-001: antes este endpoint no validaba ownership en absoluto."""
    kit_id, _ = _crear_kit_con_producto()

    # Cliente propio (cookie jar aislado) para crear el FU con order_token.
    owner_client = TestClient(app, base_url="http://localhost")
    owner_client.post("/formatos/session")
    fu_id = owner_client.get("/formatos/me").json()["id"]

    # Cliente distinto, SIN la cookie order_token (actor no autenticado y sin sesión GUEST).
    anon_client = TestClient(app, base_url="http://localhost")
    response = anon_client.post(f"/formatos/{fu_id}/kits", json={"kit_id": str(kit_id), "cantidad": 1})
    assert response.status_code == 403


def test_agregar_kit_a_formato_ajeno_de_otro_customer_retorna_403():
    """RNF-SEC-001: un CUSTOMER no puede inyectar ítems en el FU de otro."""
    kit_id, _ = _crear_kit_con_producto()
    owner_id = str(uuid4())
    intruder_id = str(uuid4())

    fu_id = client.get("/formatos/me", headers=auth_headers(owner_id)).json()["id"]

    response = client.post(
        f"/formatos/{fu_id}/kits",
        json={"kit_id": str(kit_id), "cantidad": 1},
        headers=auth_headers(intruder_id),
    )
    assert response.status_code == 403
