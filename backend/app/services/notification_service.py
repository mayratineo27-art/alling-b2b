from uuid import UUID, uuid5, NAMESPACE_URL
from datetime import datetime, timedelta
from app.schemas.dashboard import NotificationSchema

# RN-FU-03: una COTIZACION vence 15 días después de su última actualización
# (mismo cálculo que usa AUTO-FU-002 para expirar el Formato Único).
COTIZACION_VIGENCIA_DIAS = 15
ALERTA_EXPIRACION_HORAS = 24

# Notificaciones ya leídas por usuario (in-memory, igual que el resto de
# prototipos de este repo — ver mock_repo, _consulta_assignments, etc.).
# Las notificaciones son derivadas (no persistidas), así que solo se guarda
# el set de IDs ya vistos por cada usuario.
_read_notification_ids: dict[str, set[str]] = {}


class NotificationService:
    def get_latest_notifications(self, user_id: UUID | str, limit: int = 5) -> list[NotificationSchema]:
        """
        CMP-FU-013: deriva notificaciones reales a partir del estado actual
        del CUSTOMER (no son datos inventados/hardcodeados):
          - Amarillo: FU en COTIZACION que vence en <24h.
          - Verde: Order recientemente confirmado (PAID).
        """
        user_id_str = str(user_id)
        read_ids = _read_notification_ids.get(user_id_str, set())
        notifications: list[NotificationSchema] = []

        notifications.extend(self._cotizaciones_por_expirar(user_id_str, read_ids))
        notifications.extend(self._pedidos_confirmados(user_id_str, read_ids))

        notifications.sort(key=lambda n: n.created_at, reverse=True)
        return notifications[:limit]

    def _cotizaciones_por_expirar(self, user_id: str, read_ids: set[str]) -> list[NotificationSchema]:
        from app.api.endpoints.formato_unico import mock_repo
        from app.domain.formato_unico import FormatoUnicoState

        try:
            fus = mock_repo.list_all(UUID(user_id), skip=0, limit=100)
        except (ValueError, AttributeError):
            return []

        now = datetime.utcnow()
        result = []
        for fu in fus:
            if fu.state != FormatoUnicoState.COTIZACION:
                continue
            vence_en = fu.updated_at + timedelta(days=COTIZACION_VIGENCIA_DIAS) - now
            if timedelta(0) < vence_en <= timedelta(hours=ALERTA_EXPIRACION_HORAS):
                notif_id = uuid5(NAMESPACE_URL, f"cotizacion-expira:{fu.id}")
                horas_restantes = max(1, int(vence_en.total_seconds() // 3600))
                result.append(NotificationSchema(
                    id=notif_id,
                    title="Cotización por expirar",
                    message=f"Cotización #{str(fu.id)[:8].upper()} expirará en {horas_restantes}h",
                    created_at=fu.updated_at,
                    is_read=str(notif_id) in read_ids,
                ))
        return result

    def _pedidos_confirmados(self, user_id: str, read_ids: set[str]) -> list[NotificationSchema]:
        from app.db.database import SessionLocal
        from app.models.order import Order, OrderStatus
        from app.models.formato_unico import FormatoUnico as FormatoUnicoModel

        result = []
        session = SessionLocal()
        try:
            orders = (
                session.query(Order)
                .join(FormatoUnicoModel, Order.formato_unico_id == FormatoUnicoModel.id)
                .filter(FormatoUnicoModel.customer_id == user_id, Order.status == OrderStatus.PAID)
                .order_by(Order.created_at.desc())
                .limit(5)
                .all()
            )
            for order in orders:
                notif_id = uuid5(NAMESPACE_URL, f"pedido-confirmado:{order.id}")
                result.append(NotificationSchema(
                    id=notif_id,
                    title="Pedido confirmado",
                    message=f"Pedido #{str(order.id)[:8].upper()} confirmado",
                    created_at=order.created_at or datetime.utcnow(),
                    is_read=str(notif_id) in read_ids,
                ))
        except Exception:
            # Tabla/columna no disponible en este entorno (p.ej. SQLite de dev
            # sin migraciones de Order aplicadas) — degrada a lista vacía.
            return []
        finally:
            session.close()
        return result

    def marcar_como_leida(self, user_id: UUID | str, notification_id: str) -> None:
        _read_notification_ids.setdefault(str(user_id), set()).add(str(notification_id))

    def enviar_email_confirmacion(self, orden_id: UUID, email: str) -> None:
        """
        Simula el envío de un correo de confirmación de orden (RF-CHK-008).
        """
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Mock SMTP: Enviando email de confirmación a {email} para la orden {orden_id}")
        print(f"[NOTIFICACIÓN] Correo de confirmación enviado a {email} para la orden {orden_id}")
