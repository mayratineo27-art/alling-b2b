from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal

class CheckoutRequestSchema(BaseModel):
    fu_id: UUID
    billing_id: str
    address: str

class CheckoutResponseSchema(BaseModel):
    fu_id: str
    payment_url: str
    shipping_cost: str
    idempotency_key: str
    order_token: str | None = None
