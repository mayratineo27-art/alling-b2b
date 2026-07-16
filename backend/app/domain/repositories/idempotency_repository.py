from typing import Optional
from app.domain.payment_idempotency_key import PaymentIdempotencyKey

class IIdempotencyRepository:
    def get_by_event_id(self, event_id: str) -> Optional[PaymentIdempotencyKey]:
        raise NotImplementedError
        
    def save(self, key: PaymentIdempotencyKey) -> None:
        raise NotImplementedError

class MockIdempotencyRepository(IIdempotencyRepository):
    def __init__(self):
        self._keys = {}
        
    def get_by_event_id(self, event_id: str) -> Optional[PaymentIdempotencyKey]:
        return self._keys.get(event_id)
        
    def save(self, key: PaymentIdempotencyKey) -> None:
        self._keys[key.event_id] = key
