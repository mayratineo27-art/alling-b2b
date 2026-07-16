from app.db.database import SessionLocal
from typing import Generator

def get_db() -> Generator:
    """
    Dependencia de FastAPI para inyectar la sesión de base de datos.
    Garantiza que la sesión se cierre al finalizar la petición.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
