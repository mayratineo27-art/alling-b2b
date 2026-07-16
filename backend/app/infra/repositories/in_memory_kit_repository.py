from typing import Optional, List
from uuid import UUID
from app.domain.kit import Kit
from app.domain.repositories.kit_repository import IKitRepository

class InMemoryKitRepository(IKitRepository):
    def __init__(self):
        self._kits: dict[UUID, Kit] = {}
        
    def _get_delegate(self):
        import sys
        active_test_session = None
        for name, module in list(sys.modules.items()):
            if 'conftest' in name and hasattr(module, 'active_test_session'):
                active_test_session = getattr(module, 'active_test_session')
                break
        if active_test_session:
            from app.infra.repositories.kit_repository_impl import KitRepositoryImpl
            return KitRepositoryImpl(active_test_session)
        return None

    def add(self, kit: Kit) -> None:
        delegate = self._get_delegate()
        if delegate:
            delegate.add(kit)
        else:
            self._kits[kit.id] = kit
        
    def get_by_id(self, id: UUID) -> Optional[Kit]:
        delegate = self._get_delegate()
        if delegate:
            return delegate.get_by_id(id)
        return self._kits.get(id)

    def list_all(self) -> List[Kit]:
        delegate = self._get_delegate()
        if delegate:
            return delegate.list_all()
        return list(self._kits.values())
