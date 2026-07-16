from sqlalchemy.orm import Session
from app.services.notification_service import NotificationService
from app.models.formato_unico import FormatoUnico
from app.domain.formato_unico import FormatoUnicoState
from uuid import UUID

class DashboardService:
    def __init__(self, notification_service: NotificationService):
        self.notification_service = notification_service
        
    def get_dashboard_data(self, user_id: str, db: Session) -> tuple[FormatoUnico | None, list]:
        """
        Obtiene los datos del dashboard. Si está en modo mock, consulta InMemoryFormatoRepository.
        De lo contrario, consulta directamente la base de datos SQLAlchemy.
        """
        from app.core.config import settings
        if settings.USE_MOCK_DB:
            from app.api.endpoints.formato_unico import mock_repo
            try:
                user_uuid = UUID(user_id)
            except ValueError:
                user_uuid = None
            formato_activo = mock_repo.get_active_by_customer_id(user_uuid) if user_uuid else None
        else:
            try:
                user_uuid = UUID(user_id)
                # Buscar el formato activo (Borrador o Cotización) del usuario en BD
                formato_activo = (
                    db.query(FormatoUnico)
                    .filter(
                        FormatoUnico.customer_id == str(user_uuid),
                        FormatoUnico.state.in_([FormatoUnicoState.BORRADOR.value, FormatoUnicoState.COTIZACION.value])
                    )
                    .order_by(FormatoUnico.updated_at.desc())
                    .first()
                )
            except ValueError:
                formato_activo = None
        
        # El notification_service original podría estar esperando UUID. Si es así, intentamos convertir.
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            user_uuid = user_id
            
        notificaciones = self.notification_service.get_latest_notifications(user_uuid, limit=5)
        
        return formato_activo, notificaciones
