"""
Endpoint de notificaciones — RF-FU-012 / CMP-FU-013

Respalda la campanita de notificaciones del header (NotificationBadge.tsx).
Antes de este archivo, el frontend llamaba a una ruta inexistente (404).
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime

from app.core.security import get_current_user
from app.services.notification_service import NotificationService

router = APIRouter()


def get_notification_service() -> NotificationService:
    return NotificationService()


class NotificationItemSchema(BaseModel):
    id: str
    message: str
    read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationItemSchema]


@router.get("", response_model=NotificationListResponse)
@router.get("/", response_model=NotificationListResponse, include_in_schema=False)
def listar_notificaciones(
    user_id: str = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    """CMP-FU-013: últimas notificaciones FSM del CUSTOMER (cotizaciones por
    expirar, pedidos confirmados).
    
    @sdd-endpoint GET /notifications
    @sdd-rf CMP-FU-013
    """
    notifications = service.get_latest_notifications(user_id, limit=20)
    return NotificationListResponse(items=[
        NotificationItemSchema(
            id=str(n.id),
            message=n.message,
            read=n.is_read,
            created_at=n.created_at,
        )
        for n in notifications
    ])


@router.post("/{notification_id}/read")
def marcar_notificacion_leida(
    notification_id: str,
    user_id: str = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    """Marca una notificación como leída para el usuario actual.
    
    @sdd-endpoint POST /notifications/{notification_id}/read
    @sdd-rf CMP-FU-013
    """
    service.marcar_como_leida(user_id, notification_id)
    return {"message": "Notificación marcada como leída"}
