from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.dashboard import DashboardResponseSchema
from app.services.dashboard_service import DashboardService
from app.services.notification_service import NotificationService
from app.api.deps import get_db
from app.core.security import get_current_user

router = APIRouter()

def get_notification_service() -> NotificationService:
    return NotificationService()

def get_dashboard_service(
    notification_service = Depends(get_notification_service)
) -> DashboardService:
    return DashboardService(notification_service)

@router.get("", response_model=DashboardResponseSchema)
@router.get("/", response_model=DashboardResponseSchema, include_in_schema=False)
def get_dashboard(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    service: DashboardService = Depends(get_dashboard_service)
):
    """
    RF-FU-012: Dashboard del Cliente.
    Retorna el FormatoUnico activo y las notificaciones recientes.
    Protegido mediante JWT.
    
    @sdd-endpoint GET /dashboard
    @sdd-rf RF-FU-012
    """
    formato_activo, notificaciones = service.get_dashboard_data(user_id=current_user_id, db=db)
    return DashboardResponseSchema(
        formato_activo=formato_activo,
        notificaciones=notificaciones
    )
