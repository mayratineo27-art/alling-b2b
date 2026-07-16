from fastapi.testclient import TestClient
from app.main import app
from app.api.endpoints.catalogo import mock_repo as product_repo
from app.domain.product import Product
from uuid import uuid4
from decimal import Decimal

client = TestClient(app)

def test_obtener_landing():
    # Asegurar que hay productos
    if not product_repo.list_all():
        p1 = Product(id=uuid4(), stock=10, price_public=Decimal("100.0"), name="Cable Coaxial", category="Cables", is_active=True, is_featured=True)
        p2 = Product(id=uuid4(), stock=5, price_public=Decimal("50.0"), name="Router", category="Redes", is_active=True, is_featured=True)
        product_repo.add(p1)
        product_repo.add(p2)

    response = client.get("/productos/landing")
    assert response.status_code == 200
    data = response.json()
    
    assert "destacados" in data
    assert "novedades" in data
    assert "categorias_conteo" in data
    
    assert isinstance(data["destacados"], list)
    assert isinstance(data["novedades"], list)
    assert isinstance(data["categorias_conteo"], list)
    
    # Check if there is at least something if we added products
    assert len(data["destacados"]) > 0
    assert len(data["categorias_conteo"]) > 0
