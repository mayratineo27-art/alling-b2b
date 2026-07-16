from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.schemas.formato_unico import FormatoResponseSchema

class NotificationSchema(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    title: str
    message: str
    created_at: datetime
    is_read: bool

class DashboardResponseSchema(BaseModel):
    model_config = {"from_attributes": True}
    formato_activo: Optional[FormatoResponseSchema] = None
    notificaciones: List[NotificationSchema] = []
