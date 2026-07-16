from dataclasses import dataclass
from uuid import UUID
from typing import List

@dataclass(frozen=True, slots=True)
class KitComponent:
    product_id: UUID
    quantity: int = 1

@dataclass(frozen=True, slots=True)
class Kit:
    id: UUID
    name: str
    components: List[KitComponent]
    description: str | None = None
    image_url: str | None = None
