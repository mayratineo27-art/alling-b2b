"""Fixtures globales para el suite de pruebas del backend Alling B2B."""
import os
import pytest
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import NullPool
from app.main import app as fastapi_app
from app.db.database import get_session

# Active session reference for proxies
active_test_session = None

# Create a test SQLite database engine
TEST_DATABASE_URL = "sqlite:///./test_alling.db"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=NullPool
)


def _ensure_clean_db():
    """Limpia agresivamente el estado de la BD de pruebas.
    Se llama tanto en el setup como en el teardown para garantizar
    que un teardown fallido (p.ej. por testcontainers en background)
    no contamine el siguiente test."""
    from app.db.database import Base
    import app.models.user        # noqa: F401
    import app.models.formato_unico  # noqa: F401
    import app.models.order       # noqa: F401
    import app.models.product     # noqa: F401
    import app.models.kit         # noqa: F401
    import app.models.refresh_token  # noqa: F401
    import app.models.category    # noqa: F401
    import app.models.system_config  # noqa: F401
    import app.models.favorite    # noqa: F401

    # 1. Intentar drop de tablas antes de borrar el archivo
    for metadata in (SQLModel.metadata, Base.metadata):
        try:
            metadata.drop_all(test_engine)
        except Exception:
            pass

    # 2. Borrar el archivo físico
    if os.path.exists("./test_alling.db"):
        try:
            os.remove("./test_alling.db")
        except Exception:
            pass


@pytest.fixture(autouse=True, scope="function")
def setup_test_db():
    """
    Fixture autouse para inicializar la base de datos de pruebas (SQLite)
    y anular la sesión inyectada en FastAPI.
    """
    global active_test_session

    # 0. Forzar USE_MOCK_DB=True durante los tests, sin importar el valor
    #    real en backend/.env: gran parte de la suite siembra datos
    #    directo en los singletons mock_repo/_mock_repo (formato_unico.py,
    #    catalogo.py, kits.py, consultas.py, cotizaciones.py) y luego llama
    #    a la API esperando que lea de ahí mismo. Si USE_MOCK_DB=False en
    #    .env (persistencia real activada), los endpoints usan en cambio
    #    SupabaseFormatoRepository — los datos sembrados quedan invisibles
    #    para la API y decenas de tests fallan con 404/expectativas vacías.
    #    Los tests de persistencia real (test_supabase_formato_repository.py)
    #    instancian su propio repositorio explícitamente y no dependen de
    #    este flag.
    from app.core.config import settings
    valor_original_use_mock_db = settings.USE_MOCK_DB
    settings.USE_MOCK_DB = True

    # 1. Limpiar estado previo (cubre el caso de un teardown fallido)
    _ensure_clean_db()

    # 2. Crear todas las tablas en la BD SQLite de prueba (estado limpio)
    from app.db.database import Base
    Base.metadata.create_all(bind=test_engine)
    SQLModel.metadata.create_all(test_engine)

    # 3. Abrir la sesión transaccional de prueba
    with Session(test_engine) as session:
        active_test_session = session

        # 4. Anular la dependencia get_session y get_db en FastAPI
        from app.api.deps import get_db

        def override_get_session():
            yield session

        def override_get_db():
            yield session

        fastapi_app.dependency_overrides[get_session] = override_get_session
        fastapi_app.dependency_overrides[get_db] = override_get_db

        yield session

        # 5. Limpiar anulaciones tras terminar el test
        fastapi_app.dependency_overrides.clear()
        active_test_session = None

    # 6. Eliminar base de datos de pruebas tras finalizar
    _ensure_clean_db()

    settings.USE_MOCK_DB = valor_original_use_mock_db

