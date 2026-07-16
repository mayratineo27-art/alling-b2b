from fastapi.testclient import TestClient
from app.main import app
from uuid import uuid4
from decimal import Decimal
from app.domain.formato_unico import FormatoUnico, FormatoUnicoState, FormatoUnicoItem
from app.domain.product import Product
from app.api.endpoints.formato_unico import mock_repo as fu_repo
from app.infra.repositories.in_memory_product_repository import InMemoryProductRepository
from app.services.auth_service import AuthService

client = TestClient(app)
product_repo = InMemoryProductRepository()

def setup_module(module):
    # Setup test data
    pass

def test_fusionar_formatos():
    """
    Un GUEST tiene 2 productos 'A'.
    Al loguearse como CUSTOMER (que ya tenía 1 'A' y 3 'B'),
    el sistema hace un merge y el resultado es: 3 'A' y 3 'B'.
    """
    # 1. Crear Productos
    p_a_id = uuid4()
    p_b_id = uuid4()
    p_a = Product(id=p_a_id, stock=10, price_public=Decimal("10.0"), name="Producto A")
    p_b = Product(id=p_b_id, stock=10, price_public=Decimal("20.0"), name="Producto B")
    product_repo.add(p_a)
    product_repo.add(p_b)
    
    # 2. Crear FU Guest
    guest_fu_id = uuid4()
    guest_fu = FormatoUnico(id=guest_fu_id, state=FormatoUnicoState.BORRADOR)
    guest_fu.items.append(FormatoUnicoItem(product_id=p_a_id, quantity=2, unit_price=Decimal("10.0")))
    fu_repo.save(guest_fu)
    
    # 3. Crear FU Customer
    customer_id = uuid4()
    customer_fu = FormatoUnico(id=uuid4(), customer_id=customer_id, state=FormatoUnicoState.BORRADOR)
    customer_fu.items.append(FormatoUnicoItem(product_id=p_a_id, quantity=1, unit_price=Decimal("10.0")))
    customer_fu.items.append(FormatoUnicoItem(product_id=p_b_id, quantity=3, unit_price=Decimal("20.0")))
    fu_repo.save(customer_fu)
    
    # 4. Merge
    from app.services.formato_unico_service import FormatoUnicoService
    service = FormatoUnicoService(fu_repo)
    merged_fu = service.fusionar_formatos(guest_fu_id, customer_id, product_repo)
    
    # 5. Validar
    assert merged_fu.id == customer_fu.id
    assert len(merged_fu.items) == 2
    
    item_a = next(i for i in merged_fu.items if i.product_id == p_a_id)
    item_b = next(i for i in merged_fu.items if i.product_id == p_b_id)
    
    assert item_a.quantity == 3
    assert item_b.quantity == 3
    
    # Validar que guest está cancelado
    guest_fu_db = fu_repo.get_by_id(guest_fu_id)
    assert guest_fu_db.state == FormatoUnicoState.CANCELADO

def test_favoritos():
    """
    Un CUSTOMER guarda un producto en favoritos y luego lo lista.
    Si un GUEST intenta hacerlo, recibe 401 Unauthorized.
    """
    # GUEST intenta (sin token)
    response = client.post(f"/favoritos/{uuid4()}")
    assert response.status_code == 401
    
    # CUSTOMER con token
    user_id = str(uuid4())
    token = AuthService.crear_token({"sub": user_id})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(f"/favoritos/{uuid4()}", headers=headers)
    assert response.status_code == 200
