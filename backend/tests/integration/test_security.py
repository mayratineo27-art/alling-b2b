from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_historial_sin_token():
    """
    Intenta acceder a un endpoint protegido sin token y espera 401.
    """
    response = client.get("/formatos/historial/")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_historial_con_token_invalido():
    """
    Intenta acceder con un JWT expirado o malformado y espera 401.
    """
    headers = {"Authorization": "Bearer token.malformado.aqui"}
    response = client.get("/formatos/historial/", headers=headers)
    assert response.status_code == 401
    assert "invalido" in response.json()["detail"].lower() or "credenciales" in response.json()["detail"].lower()

def test_headers_seguridad():
    """
    Verifica que los headers de seguridad estén presentes en cualquier endpoint.
    """
    response = client.get("/productos/")
    assert "Strict-Transport-Security" in response.headers
    assert response.headers["Strict-Transport-Security"] == "max-age=31536000; includeSubDomains"
    assert "X-Content-Type-Options" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"

def test_rate_limiting():
    """
    Crea 101 peticiones a /productos/ y verifica que la última retorne 429.
    """
    import time
    from app.main import _rate_limit_store
    _rate_limit_store.clear()

    current_time = int(time.time())
    window = current_time // 60
    # Simulamos 100 peticiones en la ventana activa para evitar la fluctuación del segundo
    _rate_limit_store[f"testclient:{window}"] = 100
    _rate_limit_store[f"127.0.0.1:{window}"] = 100

    res_101 = client.get("/productos/")
    assert res_101.status_code == 429
    assert "Too Many Requests" in res_101.json()["detail"]

def test_audit_log():
    """
    Modifica el estado de un Formato Único y verifica el AuditLogRepository.
    """
    from app.services.audit_service import mock_audit_repo
    from app.services.auth_service import AuthService
    from uuid import uuid4, UUID
    from app.api.endpoints.formato_unico import mock_repo as fu_repo
    from app.domain.formato_unico import FormatoUnico, FormatoUnicoState
    
    # 1. Limpiar logs anteriores
    mock_audit_repo._logs.clear()
    
    # 2. Crear FU
    fu_id = uuid4()
    user_id = str(uuid4())
    fu = FormatoUnico(id=fu_id, customer_id=UUID(user_id), state=FormatoUnicoState.BORRADOR)
    from app.domain.formato_unico import FormatoUnicoItem
    from decimal import Decimal
    fu.items.append(FormatoUnicoItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.0")))
    fu_repo.save(fu)
    
    # 3. Autenticarse
    token = AuthService.crear_token({"sub": user_id})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 4. Mutar estado
    response = client.post(f"/formatos/{fu_id}/aprobar", headers=headers)
    assert response.status_code == 200
    
    # BackgroundTasks corre sincrónicamente en TestClient, así que ya debe estar logueado
    logs = mock_audit_repo.get_all()
    assert len(logs) == 1
    
    audit_entry = logs[0]
    assert audit_entry.action == "GENERAR_COTIZACION"
    assert audit_entry.user_id == user_id
    assert audit_entry.entity_id == str(fu_id)
