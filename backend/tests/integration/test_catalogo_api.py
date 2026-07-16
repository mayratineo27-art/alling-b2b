from fastapi.testclient import TestClient
from app.main import app
from uuid import uuid4
from decimal import Decimal

client = TestClient(app)

from app.api.endpoints.catalogo import mock_repo
from app.domain.product import Product

def test_listar_productos_activos():
    """
    Verificar que solo retorne productos activos y que la paginación funcione correctamente.
    """
    # Insertar 5 productos
    mock_repo.add(Product(id=uuid4(), name="P1", stock=10, price_public=Decimal("100"), is_active=True))
    mock_repo.add(Product(id=uuid4(), name="P2", stock=10, price_public=Decimal("100"), is_active=True))
    mock_repo.add(Product(id=uuid4(), name="P3", stock=10, price_public=Decimal("100"), is_active=False))
    mock_repo.add(Product(id=uuid4(), name="P4", stock=10, price_public=Decimal("100"), is_active=True))
    mock_repo.add(Product(id=uuid4(), name="P5", stock=10, price_public=Decimal("100"), is_active=False))

    response = client.get("/productos/?skip=0&limit=10")
    
    # Esto fallará inicialmente porque el endpoint no existe
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # Todos deben estar activos
    for p in data:
        assert p["is_active"] is True

def test_obtener_detalle_producto_existente():
    """
    Verificar que los datos retornados coinciden con el producto creado.
    """
    test_slug = "producto-test-1"
    mock_repo.add(Product(
        id=uuid4(), 
        name="Producto Test 1", 
        slug=test_slug, 
        stock=5, 
        price_public=Decimal("150"), 
        is_active=True,
        specs={"color": "rojo"},
        image_gallery=["img1.jpg"]
    ))
    
    response = client.get(f"/productos/{test_slug}/")
    
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == test_slug
    assert data["name"] == "Producto Test 1"
    assert data["specs"] == {"color": "rojo"}
    assert data["image_gallery"] == ["img1.jpg"]
    assert "stock" not in data
    assert "stock_display" in data
    assert data["stock_display"] == "5 unidades"

def test_obtener_detalle_producto_inexistente():
    """
    Verificar error 404 para producto que no existe.
    """
    response = client.get("/productos/slug-inexistente/")
    assert response.status_code == 404
    assert response.json() == {"detail": "Producto no encontrado"}

def test_buscar_productos_por_texto():
    """
    Verificar que el buscador encuentre productos por nombre, marca o descripción.
    """
    mock_repo.add(Product(
        id=uuid4(), 
        name="Cable HDMI", 
        description="Cable de alta velocidad", 
        brand="BrandA",
        stock=10, 
        price_public=Decimal("15")
    ))
    mock_repo.add(Product(
        id=uuid4(), 
        name="Monitor 24", 
        description="Monitor IPS", 
        brand="BrandCable", # tiene cable en la marca
        stock=10, 
        price_public=Decimal("150")
    ))
    mock_repo.add(Product(
        id=uuid4(), 
        name="Teclado", 
        description="Mecánico", 
        brand="BrandB",
        stock=10, 
        price_public=Decimal("50")
    ))
    
    # Búsqueda válida
    response = client.get("/productos/buscar/?q=cable")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    nombres = [p["name"] for p in data]
    assert "Cable HDMI" in nombres
    assert "Monitor 24" in nombres
    
    # Búsqueda muy corta (debería retornar 400 o un error controlado)
    response = client.get("/productos/buscar/?q=ab")
    assert response.status_code == 400
    assert response.json()["detail"] == "La consulta debe tener al menos 3 caracteres"

def test_obtener_categorias_con_conteo():
    """
    Verifica que el endpoint de categorías agrupe y cuente productos activos.
    """
    # Agregar productos con categorías
    mock_repo.add(Product(id=uuid4(), name="C1", category="Electrónica", stock=1, price_public=Decimal("10"), is_active=True))
    mock_repo.add(Product(id=uuid4(), name="C2", category="Electrónica", stock=1, price_public=Decimal("10"), is_active=True))
    mock_repo.add(Product(id=uuid4(), name="C3", category="Electrónica", stock=1, price_public=Decimal("10"), is_active=False)) # Inactivo
    mock_repo.add(Product(id=uuid4(), name="H1", category="Hogar", stock=1, price_public=Decimal("10"), is_active=True))
    
    response = client.get("/categorias/")
    assert response.status_code == 200
    data = response.json()
    
    # Validar formato
    assert isinstance(data, list)
    assert len(data) >= 2
    
    # Validar conteo (Electrónica debería tener 2 activos)
    elect = next((c for c in data if c["nombre"] == "Electrónica"), None)
    assert elect is not None
    assert elect["count"] == 2
    
    hogar = next((c for c in data if c["nombre"] == "Hogar"), None)
    assert hogar is not None
    assert hogar["count"] == 1

def test_listar_productos_filtrados_por_disponibilidad():
    """
    Verifica que el parámetro in_stock=true filtre correctamente los productos sin stock disponible.
    """
    # Limpiar repositorio de pruebas si es necesario o añadir productos con nombres únicos
    p_instock_id = uuid4()
    p_outstock_id = uuid4()
    p_reserved_id = uuid4()
    
    mock_repo.add(Product(
        id=p_instock_id,
        name="Cable Fibra Optica InStock",
        stock=10,
        reserved_stock=2,
        price_public=Decimal("100"),
        is_active=True
    ))
    mock_repo.add(Product(
        id=p_outstock_id,
        name="Cable Fibra Optica OutStock",
        stock=0,
        reserved_stock=0,
        price_public=Decimal("100"),
        is_active=True
    ))
    mock_repo.add(Product(
        id=p_reserved_id,
        name="Cable Fibra Optica Reserved",
        stock=5,
        reserved_stock=5, # stock disponible = 0
        price_public=Decimal("100"),
        is_active=True
    ))

    # Consultar todos (debería retornar los 3 si no filtramos)
    response_all = client.get("/productos/?limit=100")
    assert response_all.status_code == 200
    names_all = [p["name"] for p in response_all.json()]
    assert "Cable Fibra Optica InStock" in names_all
    assert "Cable Fibra Optica OutStock" in names_all
    assert "Cable Fibra Optica Reserved" in names_all

    # Consultar con in_stock=true
    response_filtered = client.get("/productos/?in_stock=true&limit=100")
    assert response_filtered.status_code == 200
    names_filtered = [p["name"] for p in response_filtered.json()]
    
    assert "Cable Fibra Optica InStock" in names_filtered
    assert "Cable Fibra Optica OutStock" not in names_filtered
    assert "Cable Fibra Optica Reserved" not in names_filtered

def test_visualizacion_segura_de_stock_modos():
    """
    Verifica que el catálogo público de productos no exponga el entero 'stock' ni 'reserved_stock',
    y que calcule correctamente el campo 'stock_display' según los modos de visualización.
    """
    p_boolean_id = uuid4()
    p_range_high_id = uuid4()
    p_range_low_id = uuid4()
    p_exact_id = uuid4()
    p_out_id = uuid4()

    # Agregar productos con diferentes modos
    mock_repo.add(Product(
        id=p_boolean_id, name="P_Boolean", stock=15, reserved_stock=2,
        price_public=Decimal("10"), is_active=True, stock_visible_mode="BOOLEAN"
    ))
    mock_repo.add(Product(
        id=p_range_high_id, name="P_Range_High", stock=18, reserved_stock=3,
        price_public=Decimal("10"), is_active=True, stock_visible_mode="RANGE"
    ))
    mock_repo.add(Product(
        id=p_range_low_id, name="P_Range_Low", stock=8, reserved_stock=1,
        price_public=Decimal("10"), is_active=True, stock_visible_mode="RANGE"
    ))
    mock_repo.add(Product(
        id=p_exact_id, name="P_Exact", stock=5, reserved_stock=2,
        price_public=Decimal("10"), is_active=True, stock_visible_mode="EXACT"
    ))
    mock_repo.add(Product(
        id=p_out_id, name="P_Agotado", stock=0, reserved_stock=0,
        price_public=Decimal("10"), is_active=True, stock_visible_mode="EXACT"
    ))

    response = client.get("/productos/?limit=100")
    assert response.status_code == 200
    data = response.json()

    # 1. Verificar exclusión de campos crudos
    for p in data:
        assert "stock" not in p
        assert "reserved_stock" not in p
        assert "stock_visible_mode" not in p
        assert "stock_display" in p

    # 2. Verificar los valores de stock_display
    boolean_prod = next(p for p in data if p["name"] == "P_Boolean")
    assert boolean_prod["stock_display"] == "En Stock"

    range_high_prod = next(p for p in data if p["name"] == "P_Range_High")
    assert range_high_prod["stock_display"] == ">10 unidades"

    range_low_prod = next(p for p in data if p["name"] == "P_Range_Low")
    assert range_low_prod["stock_display"] == "Pocas unidades"

    exact_prod = next(p for p in data if p["name"] == "P_Exact")
    assert exact_prod["stock_display"] == "3 unidades"

    out_prod = next(p for p in data if p["name"] == "P_Agotado")
    assert out_prod["stock_display"] == "Agotado"
