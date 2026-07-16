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
    # En Vercel serverless usamos pg8000 (pure Python, sin extensiones C)
    # psycopg2-binary no está disponible en el entorno Lambda de Vercel
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

engine = create_engine(
    DATABASE_URL,
    echo=False,  # Cambiar a True solo para debug de SQL en desarrollo
    connect_args=connect_args
)

def get_session() -> Session:
    """
    Generador de sesión para inyección de dependencias en FastAPI.
    Garantiza cierre automático tras cada request.
    """
    with Session(engine) as session:
        yield session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

