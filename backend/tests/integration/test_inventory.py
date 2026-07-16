import pytest
from uuid import uuid4
from decimal import Decimal
from datetime import datetime, timedelta
from app.domain.product import Product
from app.domain.formato_unico import FormatoUnico, FormatoUnicoItem, FormatoUnicoState
from app.infra.repositories.in_memory_product_repository import InMemoryProductRepository
from app.infra.repositories.in_memory_formato_repository import InMemoryFormatoRepository
from app.services.inventory_service import InventoryService
from app.services.scheduler_service import SchedulerService

def test_reservar_stock():
    """
    Verifica que al reservar stock, disponible = total - reservado.
    """
    product_repo = InMemoryProductRepository()
    fu_repo = InMemoryFormatoRepository()
    inv_service = InventoryService(fu_repo, product_repo)
    
    # 1. Crear producto con stock 10
    p_id = uuid4()
    p = Product(id=p_id, stock=10, price_public=Decimal("100"), name="Item 1")
    product_repo.add(p)
    
    # 2. Crear FU en estado COTIZACION con qty = 3
    fu_id = uuid4()
    fu = FormatoUnico(id=fu_id, state=FormatoUnicoState.COTIZACION)
    fu.items.append(FormatoUnicoItem(product_id=p_id, quantity=3, unit_price=Decimal("100")))
    fu_repo.save(fu)
    
    # 3. Reservar
    inv_service.reservar_stock(fu_id)
    
    # 4. Validar
    p_actualizado = product_repo.get_by_id(p_id)
    assert p_actualizado.reserved_stock == 3
    disponible = p_actualizado.stock - p_actualizado.reserved_stock
    assert disponible == 7

def test_limpiar_reservas_expiradas():
    """
    Simula el paso del tiempo y libera las reservas de PEDIDOS expirados.
    """
    product_repo = InMemoryProductRepository()
    fu_repo = InMemoryFormatoRepository()
    inv_service = InventoryService(fu_repo, product_repo)
    scheduler = SchedulerService(fu_repo, inv_service)
    
    # 1. Producto y FU viejo
    p_id = uuid4()
    p = Product(id=p_id, stock=10, reserved_stock=2, price_public=Decimal("100"))
    product_repo.add(p)
    
    fu_id_viejo = uuid4()
    fu_viejo = FormatoUnico(id=fu_id_viejo, state=FormatoUnicoState.PEDIDO)
    fu_viejo.items.append(FormatoUnicoItem(product_id=p_id, quantity=2, unit_price=Decimal("100")))
    # Forzar fecha antigua (35 min)
    fu_viejo.updated_at = datetime.utcnow() - timedelta(minutes=35)
    fu_repo.save(fu_viejo)
    
    # 2. Correr scheduler
    liberados = scheduler.limpiar_reservas_expiradas()
    assert liberados == 1
    
    # 3. Validar
    fu_actualizado = fu_repo.get_by_id(fu_id_viejo)
    assert fu_actualizado.state == FormatoUnicoState.CANCELADO
    
    p_actualizado = product_repo.get_by_id(p_id)
    assert p_actualizado.reserved_stock == 0
