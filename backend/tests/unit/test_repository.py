import pytest
from uuid import uuid4
from app.domain.formato_unico import FormatoUnico, FormatoUnicoState
from app.domain.repositories.formato_unico_repository import IFormatoUnicoRepository

def test_repositorio_guarda_formato():
    """
    Intenta instanciar una implementación ficticia o el repositorio y probarlo.
    Falla porque no tenemos InMemoryFormatoRepository aún implementado en src.
    """
    from app.infra.repositories.in_memory_formato_repository import InMemoryFormatoRepository
    
    repo: IFormatoUnicoRepository = InMemoryFormatoRepository()
    
    formato = FormatoUnico(state=FormatoUnicoState.BORRADOR)
    repo.save(formato)
    
    recuperado = repo.get_by_id(formato.id)
    assert recuperado is not None
    assert recuperado.id == formato.id
    assert recuperado.state == FormatoUnicoState.BORRADOR
