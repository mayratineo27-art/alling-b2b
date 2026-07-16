from fastapi.testclient import TestClient
from app.main import app
from uuid import uuid4
from app.services.auth_service import AuthService

client = TestClient(app)

def auth_headers(user_id: str) -> dict:
    token = AuthService.crear_token({"sub": user_id, "role": "CUSTOMER"})
    return {"Authorization": f"Bearer {token}"}

def test_dashboard_api_retorna_formato_y_notificaciones():
    user_id = "123e4567-e89b-12d3-a456-426614174000"
    headers_creation = {"X-User-Id": user_id}
    headers_dashboard = auth_headers(user_id)
    
    # Creamos un formato que deberia aparecer como formato_activo
    client.post("/formatos/", headers=headers_creation)
    
    response = client.get("/dashboard/", headers=headers_dashboard)
    assert response.status_code == 200
    
    data = response.json()
    assert "formato_activo" in data
    assert "notificaciones" in data
    
    # Debe ser el que acabamos de crear o al menos tener estado válido
    assert data["formato_activo"] is not None
    assert data["formato_activo"]["state"] in ["BORRADOR", "COTIZACION"]
    
    assert isinstance(data["notificaciones"], list)

def test_dashboard_api_sin_formato_activo():
    # Otro usuario sin formatos
    user_id = str(uuid4())
    headers_dashboard = auth_headers(user_id)
    
    response = client.get("/dashboard/", headers=headers_dashboard)
    assert response.status_code == 200
    
    data = response.json()
    assert data["formato_activo"] is None
    assert isinstance(data["notificaciones"], list)
