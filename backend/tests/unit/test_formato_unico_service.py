"""Pruebas unitarias — FormatoUnicoService (MOD-FU-01).

RF-FU-001: Crear Formato Único en estado BORRADOR con items vacío.
RF-FU-002: Agregar ítems al Formato Único respetando stock.
Plan: PLAN_DE_PRUEBAS_TDD_FASTAPI.md §3.1
"""

from decimal import Decimal
from uuid import uuid4

import pytest

from app.domain.exceptions import DomainException
from app.domain.product import Product
from app.services.formato_unico_service import FormatoUnicoService
from app.domain.formato_unico import FormatoUnicoState
from app.infra.repositories.in_memory_formato_repository import InMemoryFormatoRepository


@pytest.fixture
def service():
    repo = InMemoryFormatoRepository()
    return FormatoUnicoService(repo)


class TestFormatoUnicoServiceCrear:
    """RF-FU-001 — Crear Formato Único nuevo."""

    def test_crear_formato_unico_nuevo(self, service: FormatoUnicoService) -> None:
        """
        Al instanciar FormatoUnicoService.crear(), el estado inicial es BORRADOR
        y items está vacío.
        """
        formato_unico = service.crear()

        assert formato_unico.state == FormatoUnicoState.BORRADOR
        assert formato_unico.items == []
        
        # Verify persistence
        saved = service.repo.get_by_id(formato_unico.id)
        assert saved is not None


class TestFormatoUnicoServiceAgregarItem:
    """RF-FU-002 — Agregar ítems al Formato Único."""

    def test_agregar_item_con_stock_exitoso(self, service: FormatoUnicoService) -> None:
        """Al agregar Product(stock=10), el ítem se crea con qty=2 y recalcula subtotal."""
        product = Product(id=uuid4(), stock=10, price_public=Decimal("25.00"))
        formato_unico = service.crear()

        resultado = service.agregar_item(formato_unico, product, qty=2)

        assert len(resultado.items) == 1
        assert resultado.items[0].quantity == 2
        assert resultado.items[0].product_id == product.id
        assert resultado.items[0].subtotal == Decimal("50.00")
        assert resultado.subtotal == Decimal("50.00")

    def test_agregar_item_sin_stock_falla(self, service: FormatoUnicoService) -> None:
        """Al agregar Product(stock=0), el servicio lanza DomainException."""
        product = Product(id=uuid4(), stock=0, price_public=Decimal("25.00"))
        formato_unico = service.crear()

        with pytest.raises(DomainException, match="Stock insuficiente"):
            service.agregar_item(formato_unico, product, qty=2)

        assert formato_unico.items == []

class TestFormatoUnicoServiceEstado:
    """RF-FU-003, RF-FU-004 — Cambio de estado del Formato Único."""

    def test_cambiar_estado_formato_exitoso(self, service: FormatoUnicoService) -> None:
        """Al cambiar el estado de BORRADOR a APROBADO, se actualiza correctamente."""
        formato_unico = service.crear()
        product = Product(id=uuid4(), stock=10, price_public=Decimal("25.00"))
        service.agregar_item(formato_unico, product, qty=1)

        resultado = service.cambiar_estado(formato_unico, FormatoUnicoState.APROBADO)

        assert resultado.state == FormatoUnicoState.APROBADO

    def test_no_se_puede_aprobar_formato_vacio(self, service: FormatoUnicoService) -> None:
        """Al intentar cambiar el estado a APROBADO sin ítems, lanza DomainException."""
        formato_unico = service.crear()

        with pytest.raises(DomainException, match="No se puede aprobar un Formato Único sin ítems"):
            service.cambiar_estado(formato_unico, FormatoUnicoState.APROBADO)

    def test_cancelar_formato_en_cotizacion_falla_409(self, service: FormatoUnicoService) -> None:
        formato = service.crear()
        # Forzar estado inicial para la prueba
        formato.state = FormatoUnicoState.COTIZACION
        
        with pytest.raises(DomainException, match="Solo permitido en BORRADOR o EXPIRADA"):
            service.cambiar_estado(formato, FormatoUnicoState.CANCELADO)
            
    def test_cancelar_formato_en_borrador_exitoso(self, service: FormatoUnicoService) -> None:
        formato = service.crear()
        resultado = service.cambiar_estado(formato, FormatoUnicoState.CANCELADO)
        assert resultado.state == FormatoUnicoState.CANCELADO