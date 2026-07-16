import pytest
from fastapi.testclient import TestClient
from app.main import app
from uuid import uuid4
from decimal import Decimal
from app.services.auth_service import AuthService
from app.models.category import CategoryModel
from app.models.product import ProductModel
from app.domain.formato_unico import FormatoUnico, FormatoUnicoState, FormatoUnicoItem
from app.api.endpoints.consultas import _get_formato_repository

client = TestClient(app)

def admin_headers(user_id: str = "admin-1") -> dict:
    token = AuthService.crear_token({"sub": user_id, "role": "ADMIN", "mfa_validated": True})
    return {"Authorization": f"Bearer {token}"}

def test_sprint7_admin_category_flow():
    headers = admin_headers()
    
    # 1. Create category
    response = client.post(
        "/admin/categorias",
        json={"name": "Fibra Optica", "description": "Accesorios de Fibra"},
        headers=headers
    )
    assert response.status_code == 201
    cat_data = response.json()
    assert cat_data["name"] == "Fibra Optica"
    assert cat_data["slug"] == "fibra-optica"
    cat_id = cat_data["id"]

    # 2. List categories
    response = client.get("/admin/categorias", headers=headers)
    assert response.status_code == 200
    cats = response.json()
    assert any(c["id"] == cat_id for c in cats)

    # 3. Update category
    response = client.put(
        f"/admin/categorias/{cat_id}",
        json={"name": "Fibra Optica Premium", "description": "Modificado"},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Fibra Optica Premium"

    # 4. Delete category (enforce RN-ADM-03)
    # We don't have products associated, so it should succeed.
    response = client.delete(f"/admin/categorias/{cat_id}", headers=headers)
    assert response.status_code == 200
    assert "eliminada con éxito" in response.json()["message"]


def test_sprint7_admin_excel_import():
    headers = admin_headers()
    
    # Send CSV content with custom headers
    csv_data = "sku;nombre;precio;stock;descripcion;marca;categoria\n" \
               "RT-WIFI7;Router WiFi 7;350.00;10;Alta velocidad;TPLink;Redes\n" \
               "FO-CABLE;Cable Fibra;5.50;100;Mono-modo;CISCO;Fibra"
               
    files = {"file": ("catalogo.csv", csv_data, "text/csv")}
    
    response = client.post("/admin/productos/excel-import", files=files, headers=headers)
    assert response.status_code == 200
    res = response.json()
    assert res["created_count"] == 2
    assert res["updated_count"] == 0

    # Retrieve products to verify import
    response = client.get("/admin/productos", headers=headers)
    assert response.status_code == 200
    products = response.json()
    assert any(p["sku"] == "RT-WIFI7" for p in products)


def test_sprint7_admin_query_assignment():
    headers = admin_headers()
    repo = _get_formato_repository()
    
    # Create format in CONSULTA state
    fu_id = uuid4()
    fu = FormatoUnico(
        id=fu_id,
        state=FormatoUnicoState.CONSULTA,
        customer_id=uuid4(),
        items=[]
    )
    repo.save(fu)

    # Assign query
    response = client.post(
        f"/admin/consultas/{fu_id}/asignar",
        json={"seller_id": "seller-xyz"},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["assigned_seller_id"] == "seller-xyz"

    # Check updated format
    updated = repo.get_by_id(fu_id)
    assert updated.assigned_seller_id == "seller-xyz"


def test_sprint7_admin_discount_override():
    headers = admin_headers()
    from app.api.endpoints.cotizaciones import _get_formato_repository as get_cot_repo
    repo = get_cot_repo()
    
    # Create quote format
    fu_id = uuid4()
    fu = FormatoUnico(
        id=fu_id,
        state=FormatoUnicoState.COTIZACION,
        customer_id=uuid4(),
        items=[FormatoUnicoItem(product_id=uuid4(), quantity=2, unit_price=Decimal("100.00"))]
    )
    fu.recalcular_subtotal()
    repo.save(fu)

    # Apply 15% discount (valid <= 30%)
    response = client.post(
        f"/admin/cotizaciones/{fu_id}/descuento",
        json={"discount_percent": 15.0},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["discount_percent"] == 15.0
    assert response.json()["subtotal"] == 170.0  # (2 * 100) * 0.85

    # Try applying 35% discount (should fail: RN-ADM-04 limit is 30%)
    response = client.post(
        f"/admin/cotizaciones/{fu_id}/descuento",
        json={"discount_percent": 35.0},
        headers=headers
    )
    assert response.status_code == 422  # Pydantic validation fails since le=30.0


def test_sprint7_admin_config_persistency():
    headers = admin_headers()

    # Get configuration (should seed default values if empty)
    response = client.get("/admin/configuracion", headers=headers)
    assert response.status_code == 200
    config = response.json()
    assert config["quote_validity_days"] == 7

    # Put configuration
    response = client.put(
        "/admin/configuracion",
        json={"quote_validity_days": 14, "default_stock_min_threshold": 8},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["config"]["quote_validity_days"] == 14

    # Verify update persisted
    response = client.get("/admin/configuracion", headers=headers)
    assert response.status_code == 200
    assert response.json()["quote_validity_days"] == 14
