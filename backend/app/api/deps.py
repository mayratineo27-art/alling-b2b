from app.db.database import engine
from sqlmodel import Session
from typing import Generator

def get_db() -> Generator:
    """
    Dependencia de FastAPI para inyección de dependencias en FastAPI.
    Garantiza que la sesión se cierre al finalizar la petición.
    """
    with Session(engine) as db:
        yield db
