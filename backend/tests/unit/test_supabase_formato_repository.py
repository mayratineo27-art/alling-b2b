"""
SupabaseFormatoRepository — persistencia real del Formato Único.

Contexto: reporte de soporte "ya no encuentro la cotización que generé
ayer" — USE_MOCK_DB=True hacía que todo Formato Único viviera solo en la
RAM del proceso backend (InMemoryFormatoRepository), perdiéndose en cada
reinicio. Al activar la persistencia real se detectaron y corrigieron 3
defectos en SupabaseFormatoRepository:
  1. Instanciaba su propia Session(engine) contra la BD global, ignorando
     el override de sesión de tests — cualquier test la habría escrito
     directo en la base de datos real de producción.
  2. get_active_by_customer_id ordenaba por created_at (favorece siempre
     a la cotización recién clonada sobre el borrador reseteado).
  3. save()/_to_domain() nunca persistían ni recuperaban updated_at real.
"""
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from app.domain.formato_unico import FormatoUnico, FormatoUnicoItem, FormatoUnicoState
from app.infra.repositories.supabase_formato_repository import SupabaseFormatoRepository


def test_save_and_get_by_id_roundtrip(setup_test_db):
    repo = SupabaseFormatoRepository(setup_test_db)
    customer_id = uuid4()
    product_id = uuid4()

    formato = FormatoUnico(
        state=FormatoUnicoState.BORRADOR,
        customer_id=customer_id,
        items=[FormatoUnicoItem(product_id=product_id, quantity=2, unit_price=Decimal("25.50"))],
    )
    formato.recalcular_subtotal()
    repo.save(formato)

    loaded = repo.get_by_id(formato.id)

    assert loaded is not None
    assert loaded.state == FormatoUnicoState.BORRADOR
    assert loaded.customer_id == customer_id
    assert len(loaded.items) == 1
    assert loaded.items[0].product_id == product_id
    assert loaded.items[0].quantity == 2
    assert loaded.subtotal == Decimal("51.00")


def test_save_persiste_updated_at_explicito_no_lo_deja_null(setup_test_db):
    """Antes save() nunca escribía formato_model.updated_at, confiando en
    onupdate=func.now() de la columna — que no se dispara en el INSERT."""
    repo = SupabaseFormatoRepository(setup_test_db)
    formato = FormatoUnico(state=FormatoUnicoState.BORRADOR, customer_id=uuid4())
    marca_de_tiempo = datetime.utcnow() - timedelta(minutes=3)
    formato.updated_at = marca_de_tiempo
    repo.save(formato)

    loaded = repo.get_by_id(formato.id)

    assert loaded.updated_at is not None
    assert abs((loaded.updated_at - marca_de_tiempo).total_seconds()) < 1


def test_get_active_by_customer_id_resuelve_el_mas_reciente_por_updated_at(setup_test_db):
    """Mismo comportamiento que InMemoryFormatoRepository (RN-FU-09)."""
    repo = SupabaseFormatoRepository(setup_test_db)
    customer_id = uuid4()

    fu_viejo = FormatoUnico(state=FormatoUnicoState.BORRADOR, customer_id=customer_id)
    fu_viejo.updated_at = datetime.utcnow() - timedelta(days=5)
    repo.save(fu_viejo)

    fu_reciente = FormatoUnico(state=FormatoUnicoState.BORRADOR, customer_id=customer_id)
    fu_reciente.updated_at = datetime.utcnow()
    repo.save(fu_reciente)

    activo = repo.get_active_by_customer_id(customer_id)

    assert activo.id == fu_reciente.id


def test_get_active_by_customer_id_no_favorece_la_cotizacion_clonada_por_created_at(setup_test_db):
    """RN-FU-09/RN-FU-10: reproduce el Patrón de Clonación contra la BD
    real. Antes, get_active_by_customer_id ordenaba por created_at — la
    cotización clonada (registro NUEVO) siempre gana sobre el borrador
    reseteado (registro preexistente), aunque el borrador sea la edición
    más reciente. Esto reintroducía el bug "ya no puedo comprar otra cosa
    después de cotizar", ahora contra la base de datos real.
    """
    repo = SupabaseFormatoRepository(setup_test_db)
    customer_id = uuid4()

    # 1. Borrador original: creado primero (created_at más antiguo).
    original = FormatoUnico(state=FormatoUnicoState.BORRADOR, customer_id=customer_id)
    repo.save(original)

    # 2. Simula generar_cotizacion(): clona en un registro NUEVO en
    #    COTIZACION (created_at más reciente que el original)...
    cotizacion = FormatoUnico(
        state=FormatoUnicoState.COTIZACION,
        customer_id=customer_id,
        items=[FormatoUnicoItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.00"))],
    )
    repo.save(cotizacion)

    # ...y resetea el original a BORRADOR vacío con updated_at más nuevo
    # que el de la cotización recién creada.
    original.state = FormatoUnicoState.BORRADOR
    original.items = []
    original.updated_at = cotizacion.updated_at + timedelta(seconds=1)
    repo.save(original)

    activo = repo.get_active_by_customer_id(customer_id)

    assert activo is not None
    assert activo.id == original.id
    assert activo.state == FormatoUnicoState.BORRADOR
    assert activo.items == []


def test_list_by_states_ordena_por_updated_at_descendente(setup_test_db):
    repo = SupabaseFormatoRepository(setup_test_db)

    fu_a = FormatoUnico(state=FormatoUnicoState.CONSULTA, customer_id=uuid4())
    fu_a.updated_at = datetime.utcnow() - timedelta(hours=2)
    repo.save(fu_a)

    fu_b = FormatoUnico(state=FormatoUnicoState.CONSULTA, customer_id=uuid4())
    fu_b.updated_at = datetime.utcnow()
    repo.save(fu_b)

    resultados = repo.list_by_states([FormatoUnicoState.CONSULTA])

    ids = [str(f.id) for f in resultados]
    assert ids.index(str(fu_b.id)) < ids.index(str(fu_a.id))


def test_get_by_order_token_resuelve_fu_guest(setup_test_db):
    repo = SupabaseFormatoRepository(setup_test_db)
    token = str(uuid4())
    formato = FormatoUnico(state=FormatoUnicoState.BORRADOR, order_token=token)
    repo.save(formato)

    loaded = repo.get_by_order_token(token)

    assert loaded is not None
    assert loaded.id == formato.id
    assert loaded.customer_id is None
