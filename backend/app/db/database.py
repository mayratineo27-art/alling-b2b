from sqlmodel import create_engine, Session
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings
import os

# Configuración de conexión segura
DATABASE_URL = (settings.DATABASE_URL or "sqlite:///./alling.db").strip()
Base = declarative_base()

# Manejo de conectores según entorno
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif DATABASE_URL.startswith("postgresql://"):
    try:
        import pg8000
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
    except ImportError:
        try:
            import psycopg2
            DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
        except ImportError:
            pass

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=1800
)

def get_session() -> Session:
    """
    Generador de sesión para inyección de dependencias en FastAPI.
    Garantiza cierre automático tras cada request.
    """
    with Session(engine) as session:
        yield session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

