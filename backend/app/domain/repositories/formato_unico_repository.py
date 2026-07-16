import abc
from uuid import UUID
from typing import Optional
from app.domain.formato_unico import FormatoUnico

class IFormatoUnicoRepository(abc.ABC):
    """Interfaz abstracta para la persistencia del Formato Único."""
    
    @abc.abstractmethod
    def save(self, formato: FormatoUnico) -> None:
        """Guarda o actualiza un formato único en el repositorio."""
        pass

    @abc.abstractmethod
    def get_by_id(self, formato_id: UUID) -> Optional[FormatoUnico]:
        """Recupera un formato único por su ID."""
        pass

    @abc.abstractmethod
    def list_all(self, customer_id: UUID, skip: int = 0, limit: int = 10) -> list[FormatoUnico]:
        """Recupera el historial de formatos para un usuario."""
        pass

    @abc.abstractmethod
    def get_by_order_token(self, order_token: str) -> Optional[FormatoUnico]:
        """Recupera el Formato Único GUEST activo por su order_token (cookie httpOnly). RF-CHK-007."""
        pass

    @abc.abstractmethod
    def get_active_by_customer_id(self, customer_id: UUID) -> Optional[FormatoUnico]:
        """Recupera el Formato Único BORRADOR activo de un CUSTOMER autenticado. RNF-SEC-002."""
        pass

