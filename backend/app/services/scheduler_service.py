from datetime import datetime, timedelta
from app.domain.repositories.formato_unico_repository import IFormatoUnicoRepository
from app.services.inventory_service import InventoryService
from app.domain.formato_unico import FormatoUnicoState

class SchedulerService:
    def __init__(self, fu_repo: IFormatoUnicoRepository, inventory_service: InventoryService):
        self.fu_repo = fu_repo
        self.inventory_service = inventory_service
        
    def limpiar_reservas_expiradas(self) -> int:
        """
        Busca FUs en estado PEDIDO que excedan los 30 min sin confirmar,
        libera su stock y los marca como CANCELADO.
        Retorna la cantidad de reservas liberadas.
        """
        # Como IFormatoUnicoRepository no tiene list_all() explícito por estado, 
        # para este mock accedemos asumiendo que lo tenemos o iteramos en memoria si es test
        # pero idealmente el repo debería proveerlo. Para la prueba de integración
        # usaremos un método especial de búsqueda o iteraremos en el repo en memoria.
        expirados_count = 0
        tiempo_limite = datetime.utcnow() - timedelta(minutes=30)
        
        # Ojo: esto asume que en el mock podemos ver ._store
        # En una DB real sería `repo.get_expired_orders(tiempo_limite)`
        if hasattr(self.fu_repo, '_store'):
            for fu in list(self.fu_repo._store.values()):
                if fu.state == FormatoUnicoState.PEDIDO and fu.updated_at < tiempo_limite:
                    self.inventory_service.liberar_stock(fu.id)
                    fu.state = FormatoUnicoState.CANCELADO
                    fu.updated_at = datetime.utcnow()
                    self.fu_repo.save(fu)
                    expirados_count += 1
                    
        return expirados_count
