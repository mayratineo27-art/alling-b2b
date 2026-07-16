from sqlalchemy.orm import Session
from app.services.notification_service import NotificationService
from app.domain.formato_unico import FormatoUnico
from app.domain.formato_unico import FormatoUnicoState
from uuid import UUID

class DashboardService:
    def __init__(self, notification_service: NotificationService):
        self.notification_service = notification_service
        
    def get_dashboard_data(self, user_id: str, db: Session) -> tuple[FormatoUnico | None, list]:
        """
        Obtiene los datos del dashboard. Si está en modo mock, consulta InMemoryFormatoRepository.
        De lo contrario, consulta la base de datos a través de SupabaseFormatoRepository.
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
                if user_uuid:
                    from app.infra.repositories.supabase_formato_repository import SupabaseFormatoRepository
                    repo = SupabaseFormatoRepository(db)
                    formato_activo = repo.get_active_by_customer_id(user_uuid)
                else:
                    formato_activo = None
            except ValueError:
                formato_activo = None
        
        # El notification_service original podría estar esperando UUID. Si es así, intentamos convertir.
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            user_uuid = user_id
            
        notificaciones = self.notification_service.get_latest_notifications(user_uuid, limit=5)
        
        return formato_activo, notificaciones
