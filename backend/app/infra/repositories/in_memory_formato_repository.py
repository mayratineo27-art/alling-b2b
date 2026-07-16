from typing import Optional
from uuid import UUID
from app.domain.formato_unico import FormatoUnico, FormatoUnicoState
from app.domain.repositories.formato_unico_repository import IFormatoUnicoRepository

class InMemoryFormatoRepository(IFormatoUnicoRepository):
    """Implementación en memoria del repositorio para pruebas y prototipado."""
    
    def __init__(self):
        self._store: dict[UUID, FormatoUnico] = {}
        
    def save(self, formato: FormatoUnico) -> None:
        self._store[formato.id] = formato
        
    def get_by_id(self, formato_id: UUID) -> Optional[FormatoUnico]:
        return self._store.get(formato_id)
        
    def list_all(self, customer_id: UUID, skip: int = 0, limit: int = 10) -> list[FormatoUnico]:
        user_formats = [f for f in self._store.values() if f.customer_id == customer_id]
        return user_formats[skip : skip + limit]

    def get_by_order_token(self, order_token: str) -> Optional[FormatoUnico]:
        """RF-CHK-007: Busca el FU GUEST por su order_token (asociado a cookie httpOnly)."""
        active_states = {
            FormatoUnicoState.BORRADOR,
            FormatoUnicoState.APROBADO,
            FormatoUnicoState.COTIZACION,
            FormatoUnicoState.CONSULTA,
        }
        for formato in self._store.values():
            if (formato.order_token == order_token 
                    and formato.customer_id is None
                    and formato.state in active_states):
                return formato
        return None

    def get_active_by_customer_id(self, customer_id: UUID) -> Optional[FormatoUnico]:
        """RNF-SEC-002: Retorna el FU activo de un CUSTOMER. Aislación por customer_id.

        Sprint 6 (Patrón de Clonación, RN-FU-09): con la clonación al
        generar cotización, un CUSTOMER puede tener VARIOS FU en BORRADOR
        simultáneos (el activo + huérfanos históricos de cotizaciones
        canceladas). Iterar el dict y retornar "el primero que calce" ya
        no es determinista. Se resuelve por el `updated_at` más reciente
        entre todos los candidatos — cada operación que "toca" un FU
        (agregar ítem, clonar, cancelar) refresca su `updated_at`.
        """
        active_states = {
            FormatoUnicoState.BORRADOR,
            FormatoUnicoState.APROBADO,
            FormatoUnicoState.COTIZACION,
            FormatoUnicoState.CONSULTA,
        }
        candidatos = [
            formato for formato in self._store.values()
            if formato.customer_id == customer_id and formato.state in active_states
        ]
        if not candidatos:
            return None
        return max(candidatos, key=lambda formato: formato.updated_at)

    def list_by_states(self, states: list[FormatoUnicoState], skip: int = 0, limit: int = 100) -> list[FormatoUnico]:
        allowed_states = set(states)
        formatos = [f for f in self._store.values() if f.state in allowed_states]
        formatos.sort(key=lambda formato: formato.updated_at, reverse=True)
        return formatos[skip : skip + limit]


