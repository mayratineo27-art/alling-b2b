from uuid import UUID
from app.domain.formato_unico import FormatoUnico
from app.domain.repositories.formato_unico_repository import IFormatoUnicoRepository

class FormatoUnicoQueryService:
    """Servicio de lectura para historiales (CQRS simplificado)."""
    
    def __init__(self, repo: IFormatoUnicoRepository):
        self.repo = repo
        
    def obtener_historial(self, customer_id: UUID, skip: int, limit: int) -> list[FormatoUnico]:
        return self.repo.list_all(customer_id=customer_id, skip=skip, limit=limit)
        
    def obtener_formato_por_id(self, id: UUID) -> FormatoUnico | None:
        return self.repo.get_by_id(id)
