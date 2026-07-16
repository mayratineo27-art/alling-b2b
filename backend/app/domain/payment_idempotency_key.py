from dataclasses import dataclass
import time

@dataclass
class PaymentIdempotencyKey:
    event_id: str
    processed_at: float
