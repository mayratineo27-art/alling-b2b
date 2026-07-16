from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID
from app.domain.kit import Kit

class IKitRepository(ABC):
    @abstractmethod
    def get_by_id(self, id: UUID) -> Optional[Kit]:
        pass
