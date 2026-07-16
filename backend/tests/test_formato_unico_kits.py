import pytest
from uuid import uuid4
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app

from app.domain.product import Product
from app.domain.kit import Kit, KitComponent
from app.domain.formato_unico import FormatoUnico, FormatoUnicoState, FormatoUnicoItem
from app.domain.exceptions import DomainException
from app.services.formato_unico_service import FormatoUnicoService

# We'll use mock services to test FormatoUnicoService directly

class MockKitService:
    def __init__(self, kit):
        self.kit = kit
        
    def get_kit_detail(self, kit_id):
        return self.kit

class MockProductRepo:
    def __init__(self, products):
        self.products = {p.id: p for p in products}
        
    def get_by_id(self, product_id):
        return self.products.get(product_id)

class MockFormatoRepo:
    def __init__(self, formatos):
        self.formatos = {f.id: f for f in formatos}
    
    def save(self, formato):
        self.formatos[formato.id] = formato

def test_agregar_kit_exitoso_descompone_componentes():
    # Arrange
    p1 = Product(id=uuid4(), name="P1", price_public=Decimal("10.0"), stock=100)
    p2 = Product(id=uuid4(), name="P2", price_public=Decimal("20.0"), stock=50)
    
    product_repo = MockProductRepo([p1, p2])
    
    from app.schemas.kit import KitResponseSchema, KitComponentSchema
    kit_schema = KitResponseSchema(
        id=uuid4(),
        name="Kit Prueba",
        components=[
            KitComponentSchema(product_id=p1.id, name="P1", quantity=2),
            KitComponentSchema(product_id=p2.id, name="P2", quantity=1)
        ],
        precio_total=Decimal("40.0"),
        stock_disponible=50 # limiting stock is p2 (50 // 1), p1 is 100 // 2 = 50
    )
    
    kit_service = MockKitService(kit_schema)
    
    fu = FormatoUnico(state=FormatoUnicoState.BORRADOR)
    fu_repo = MockFormatoRepo([fu])
    fu_service = FormatoUnicoService(fu_repo)
    
    # Act
    fu_actualizado = fu_service.agregar_kit(fu, kit_schema.id, qty=1, kit_service=kit_service, product_repo=product_repo)
    
    # Assert
    assert len(fu_actualizado.items) == 2
    
    item_p1 = next(i for i in fu_actualizado.items if i.product_id == p1.id)
    assert item_p1.quantity == 2
    
    item_p2 = next(i for i in fu_actualizado.items if i.product_id == p2.id)
    assert item_p2.quantity == 1
    
    assert fu_actualizado.subtotal == Decimal("40.0")

def test_agregar_kit_preserva_trazabilidad_kit_id_y_nombre():
    """
    Antes, un ítem agregado vía Kit era indistinguible de uno agregado
    manualmente — el usuario no podía ver "esto vino del Kit X" en su
    Formato Único. Se preserva kit_id/kit_name en cada ítem decompuesto.
    """
    p1 = Product(id=uuid4(), name="P1", price_public=Decimal("10.0"), stock=100)
    product_repo = MockProductRepo([p1])

    from app.schemas.kit import KitResponseSchema, KitComponentSchema
    kit_id = uuid4()
    kit_schema = KitResponseSchema(
        id=kit_id,
        name="Kit Instalación FTTH Básico",
        components=[KitComponentSchema(product_id=p1.id, name="P1", quantity=2)],
        precio_total=Decimal("20.0"),
        stock_disponible=50,
    )
    kit_service = MockKitService(kit_schema)

    fu = FormatoUnico(state=FormatoUnicoState.BORRADOR)
    fu_repo = MockFormatoRepo([fu])
    fu_service = FormatoUnicoService(fu_repo)

    fu_actualizado = fu_service.agregar_kit(fu, kit_id, qty=1, kit_service=kit_service, product_repo=product_repo)

    item = fu_actualizado.items[0]
    assert item.kit_id == kit_id
    assert item.kit_name == "Kit Instalación FTTH Básico"


def test_agregar_kit_sin_stock_falla_completo():
    # Arrange
    p1 = Product(id=uuid4(), name="P1", price_public=Decimal("10.0"), stock=100)
    p2 = Product(id=uuid4(), name="P2", price_public=Decimal("20.0"), stock=0) # NO STOCK
    
    product_repo = MockProductRepo([p1, p2])
    
    from app.schemas.kit import KitResponseSchema, KitComponentSchema
    kit_schema = KitResponseSchema(
        id=uuid4(),
        name="Kit Prueba",
        components=[
            KitComponentSchema(product_id=p1.id, name="P1", quantity=2),
            KitComponentSchema(product_id=p2.id, name="P2", quantity=1)
        ],
        precio_total=Decimal("40.0"),
        stock_disponible=0 
    )
    
    kit_service = MockKitService(kit_schema)
    
    fu = FormatoUnico(state=FormatoUnicoState.BORRADOR)
    fu_repo = MockFormatoRepo([fu])
    fu_service = FormatoUnicoService(fu_repo)
    
    # Act & Assert
    with pytest.raises(DomainException) as exc:
        fu_service.agregar_kit(fu, kit_schema.id, qty=1, kit_service=kit_service, product_repo=product_repo)
    
    assert "Stock insuficiente" in str(exc.value)
    assert len(fu.items) == 0 # Verification that no partial additions occurred

def test_agregar_kit_parcial_no_permitido():
    # Arrange
    p1 = Product(id=uuid4(), name="P1", price_public=Decimal("10.0"), stock=100)
    p2 = Product(id=uuid4(), name="P2", price_public=Decimal("20.0"), stock=2) 
    
    product_repo = MockProductRepo([p1, p2])
    
    from app.schemas.kit import KitResponseSchema, KitComponentSchema
    kit_schema = KitResponseSchema(
        id=uuid4(),
        name="Kit Prueba",
        components=[
            KitComponentSchema(product_id=p1.id, name="P1", quantity=2),
            KitComponentSchema(product_id=p2.id, name="P2", quantity=1)
        ],
        precio_total=Decimal("40.0"),
        stock_disponible=2 
    )
    
    kit_service = MockKitService(kit_schema)
    
    fu = FormatoUnico(state=FormatoUnicoState.BORRADOR)
    fu_repo = MockFormatoRepo([fu])
    fu_service = FormatoUnicoService(fu_repo)
    
    # Act & Assert
    with pytest.raises(DomainException) as exc:
        # User wants 3 kits, but stock_disponible is 2
        fu_service.agregar_kit(fu, kit_schema.id, qty=3, kit_service=kit_service, product_repo=product_repo)
    
    assert "Stock insuficiente para el kit" in str(exc.value)
    assert len(fu.items) == 0 
