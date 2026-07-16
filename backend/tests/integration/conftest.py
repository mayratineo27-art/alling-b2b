import pytest
from sqlmodel import SQLModel, create_engine, Session
from testcontainers.postgres import PostgresContainer
from app.db.database import Base
from app.main import app as fastapi_app
from app.db.database import get_session
from app.api.deps import get_db

@pytest.fixture(scope="session")
def postgres_container():
    with PostgresContainer("postgres:15-alpine") as postgres:
        yield postgres

@pytest.fixture(scope="function")
def postgres_session(postgres_container):
    engine = create_engine(postgres_container.get_connection_url())
    Base.metadata.create_all(bind=engine)
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session
        
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(scope="function")
def override_db(postgres_session):
    def _override_get_session():
        yield postgres_session
    def _override_get_db():
        yield postgres_session
        
    fastapi_app.dependency_overrides[get_session] = _override_get_session
    fastapi_app.dependency_overrides[get_db] = _override_get_db
    yield
    fastapi_app.dependency_overrides.clear()
