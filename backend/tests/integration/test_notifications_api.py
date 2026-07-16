"""
Tests de integración: GET/POST /api/v1/notifications (RF-FU-012, CMP-FU-013)

El panel de notificaciones del header (NotificationBadge.tsx) consume este
endpoint. Antes de esta implementación, el backend no lo exponía → 404
constante y la campanita nunca mostraba nada real.
"""
from datetime import datetime, timedelta
from uuid import uuid4, UUID

from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import AuthService

client = TestClient(app)


def auth_headers(user_id: str) -> dict:
    token = AuthService.crear_token({"sub": user_id, "role": "CUSTOMER"})
    return {"Authorization": f"Bearer {token}"}


def test_notifications_requiere_autenticacion():
    """Sin token → 401, igual que el resto de rutas protegidas."""
    response = client.get("/api/v1/notifications")
    assert response.status_code == 401


def test_notifications_alerta_cotizacion_por_expirar():
    """
    CMP-FU-013: si el CUSTOMER tiene un FU en COTIZACION que expira en <24h
    (RN-FU-03: countdown de 15 días), debe aparecer una notificación amarilla.
    """
    from app.api.endpoints.formato_unico import mock_repo
    from app.domain.formato_unico import FormatoUnico, FormatoUnicoState

    user_id = str(uuid4())
    fu = FormatoUnico(
        id=uuid4(),
        customer_id=UUID(user_id),
        state=FormatoUnicoState.COTIZACION,
        updated_at=datetime.utcnow() - timedelta(days=14, hours=1),  # vence en ~23h (RN-FU-03: vigencia de 15 días)
    )
    mock_repo.save(fu)

    response = client.get("/api/v1/notifications", headers=auth_headers(user_id))
    assert response.status_code == 200
    data = response.json()
    items = data["items"] if isinstance(data, dict) else data
    assert any("expirar" in n["message"].lower() for n in items), items


def test_notifications_marcar_como_leida():
    """POST /api/v1/notifications/{id}/read persiste el estado leído del usuario."""
    from app.api.endpoints.formato_unico import mock_repo
    from app.domain.formato_unico import FormatoUnico, FormatoUnicoState

    user_id = str(uuid4())
    fu = FormatoUnico(
        id=uuid4(),
        customer_id=UUID(user_id),
        state=FormatoUnicoState.COTIZACION,
        updated_at=datetime.utcnow() - timedelta(days=14, hours=1),
    )
    mock_repo.save(fu)

    headers = auth_headers(user_id)
    listado = client.get("/api/v1/notifications", headers=headers).json()
    items = listado["items"] if isinstance(listado, dict) else listado
    assert len(items) >= 1
    notif_id = items[0]["id"]

    read_res = client.post(f"/api/v1/notifications/{notif_id}/read", headers=headers)
    assert read_res.status_code == 200

    listado_2 = client.get("/api/v1/notifications", headers=headers).json()
    items_2 = listado_2["items"] if isinstance(listado_2, dict) else listado_2
    marcado = next(n for n in items_2 if n["id"] == notif_id)
    assert marcado["read"] is True
