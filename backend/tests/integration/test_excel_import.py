import io
from fastapi.testclient import TestClient
from app.main import app
from app.api.endpoints.catalogo import mock_repo as product_repo
from app.domain.product import Product
from app.services.auth_service import AuthService
from uuid import uuid4
from decimal import Decimal

client = TestClient(app)


def auth_headers(user_id: str) -> dict:
    token = AuthService.crear_token({"sub": user_id, "role": "CUSTOMER"})
    return {"Authorization": f"Bearer {token}"}

def test_import_csv():
    # Setup de productos en mock repo
    p1 = Product(id=uuid4(), stock=100, price_public=Decimal("10.0"), name="Prod1", category="C1", is_active=True, sku="SKU-OK")
    p2 = Product(id=uuid4(), stock=5, price_public=Decimal("20.0"), name="Prod2", category="C1", is_active=True, sku="SKU-PARTIAL")
    product_repo.add(p1)
    product_repo.add(p2)

    csv_content = (
        "sku,cantidad\n"
        "SKU-OK,50\n"          # Exitoso (hay stock suficiente)
        "SKU-PARTIAL,10\n"     # Advertencia (se pide 10, hay 5)
        "SKU-INVALID,5\n"      # Error (sku no existe)
    )
    
    file_bytes = csv_content.encode("utf-8")
    
    response = client.post(
        "/formatos/excel/import",
        files={"file": ("test.csv", io.BytesIO(file_bytes), "text/csv")}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "exitosos" in data
    assert "advertencias" in data
    assert "errores" in data
    
    assert len(data["exitosos"]) == 1
    assert data["exitosos"][0]["sku"] == "SKU-OK"
    
    assert len(data["advertencias"]) == 1
    assert data["advertencias"][0]["sku"] == "SKU-PARTIAL"
    
    assert len(data["errores"]) == 1
    assert data["errores"][0]["sku"] == "SKU-INVALID"

def test_get_template():
    response = client.get("/formatos/excel/template")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "sku,cantidad" in response.text


def test_import_csv_no_se_limita_a_los_primeros_10_productos():
    """RF-FU-013: list_all() sin argumentos pagina a 10 por defecto — con
    más de 10 productos activos, un SKU real fuera de esa primera página
    se reportaba como 'SKU no existe'."""
    for i in range(12):
        product_repo.add(Product(
            id=uuid4(), stock=50, price_public=Decimal("10.0"),
            name=f"Prod{i}", is_active=True, sku=f"SKU-PAG-{i:02d}",
        ))

    csv_content = "sku,cantidad\nSKU-PAG-11,5\n"
    response = client.post(
        "/formatos/excel/import",
        files={"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["errores"]) == 0
    assert len(data["exitosos"]) == 1
    assert data["exitosos"][0]["sku"] == "SKU-PAG-11"


def test_import_csv_cantidad_cero_se_omite_sin_error():
    """La plantilla trae el catálogo completo con cantidad=0 — no debe
    reportarse como error ni como ítem exitoso, se omite en silencio."""
    p = Product(id=uuid4(), stock=10, price_public=Decimal("10.0"), name="ProdZero", is_active=True, sku="SKU-ZERO")
    product_repo.add(p)

    csv_content = "sku,cantidad\nSKU-ZERO,0\n"
    response = client.post(
        "/formatos/excel/import",
        files={"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["exitosos"] == []
    assert data["advertencias"] == []
    assert data["errores"] == []


def test_import_csv_cantidad_negativa_es_error():
    p = Product(id=uuid4(), stock=10, price_public=Decimal("10.0"), name="ProdNeg", is_active=True, sku="SKU-NEG")
    product_repo.add(p)

    csv_content = "sku,cantidad\nSKU-NEG,-3\n"
    response = client.post(
        "/formatos/excel/import",
        files={"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["errores"]) == 1
    assert data["errores"][0]["sku"] == "SKU-NEG"


def test_get_template_incluye_skus_reales_del_catalogo():
    """RF-FU-014: antes la plantilla traía un único SKU-EJEMPLO ficticio que
    no existe en ningún catálogo real — cualquier fila calcada de la
    plantilla fallaba la validación al importar."""
    product_repo.add(Product(
        id=uuid4(), stock=20, price_public=Decimal("99.90"),
        name="Producto Plantilla Real", is_active=True, sku="SKU-PLANTILLA-REAL",
    ))

    response = client.get("/formatos/excel/template")

    assert response.status_code == 200
    assert "SKU-EJEMPLO" not in response.text
    assert "SKU-PLANTILLA-REAL" in response.text
    assert "producto" in response.text
    assert "precio_referencial" in response.text


def test_aplicar_importacion_excel_agrega_items_reales_al_formato():
    """RF-FU-013/019 (BTN-FU-017 'Confirmar Importación Válida'): antes este
    paso era 100% cosmético en el frontend (alert 'Simulado', sin llamar a
    ningún endpoint) — el archivo se validaba pero nunca se cargaba al FU."""
    user_id = str(uuid4())
    p1 = Product(id=uuid4(), stock=50, price_public=Decimal("10.0"), name="ProdApply1", is_active=True, sku="SKU-APPLY-1")
    p2 = Product(id=uuid4(), stock=50, price_public=Decimal("20.0"), name="ProdApply2", is_active=True, sku="SKU-APPLY-2")
    product_repo.add(p1)
    product_repo.add(p2)

    fu_id = client.get("/formatos/me", headers=auth_headers(user_id)).json()["id"]

    response = client.post(
        f"/formatos/{fu_id}/excel/aplicar",
        json={"items": [{"sku": "SKU-APPLY-1", "cantidad": 3}, {"sku": "SKU-APPLY-2", "cantidad": 2}]},
        headers=auth_headers(user_id),
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    cantidades = {item["sku"]: item["quantity"] for item in data["items"]}
    assert cantidades["SKU-APPLY-1"] == 3
    assert cantidades["SKU-APPLY-2"] == 2


def test_aplicar_importacion_excel_capa_al_stock_disponible_en_vez_de_fallar():
    """RN-FU-10: si la cantidad solicitada excede el stock disponible, se
    aplica hasta el stock disponible en vez de rechazar la fila completa
    (mismo criterio de 'stock parcial' que ya reporta /excel/import)."""
    user_id = str(uuid4())
    p = Product(id=uuid4(), stock=4, price_public=Decimal("10.0"), name="ProdPartial", is_active=True, sku="SKU-PARTIAL-APPLY")
    product_repo.add(p)

    fu_id = client.get("/formatos/me", headers=auth_headers(user_id)).json()["id"]

    response = client.post(
        f"/formatos/{fu_id}/excel/aplicar",
        json={"items": [{"sku": "SKU-PARTIAL-APPLY", "cantidad": 10}]},
        headers=auth_headers(user_id),
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 4


def test_aplicar_importacion_excel_ignora_sku_inexistente_sin_fallar():
    user_id = str(uuid4())
    fu_id = client.get("/formatos/me", headers=auth_headers(user_id)).json()["id"]

    response = client.post(
        f"/formatos/{fu_id}/excel/aplicar",
        json={"items": [{"sku": "SKU-NO-EXISTE-JAMAS", "cantidad": 5}]},
        headers=auth_headers(user_id),
    )

    assert response.status_code == 200
    assert response.json()["items"] == []


def test_aplicar_importacion_excel_de_fu_ajeno_retorna_403():
    """RNF-SEC-001: mismo criterio de ownership que el resto de mutaciones del FU."""
    owner_id = str(uuid4())
    intruder_id = str(uuid4())
    p = Product(id=uuid4(), stock=10, price_public=Decimal("10.0"), name="ProdAjeno", is_active=True, sku="SKU-AJENO")
    product_repo.add(p)

    fu_id = client.get("/formatos/me", headers=auth_headers(owner_id)).json()["id"]

    response = client.post(
        f"/formatos/{fu_id}/excel/aplicar",
        json={"items": [{"sku": "SKU-AJENO", "cantidad": 1}]},
        headers=auth_headers(intruder_id),
    )

    assert response.status_code == 403
