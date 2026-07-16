import hmac
import hashlib
import time
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import AuthService
from uuid import uuid4

client = TestClient(app)

def test_admin_mfa_required():
    """
    Verifica que un ADMIN sin MFA validado reciba 403.
    """
    admin_id = str(uuid4())
    # Genera token de ADMIN pero sin mfa_validated
    token = AuthService.crear_token({"sub": admin_id, "role": "ADMIN", "mfa_validated": False})
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Intenta acceder al historial (endpoint protegido)
    response = client.get("/formatos/historial/", headers=headers)
    assert response.status_code == 403
    assert "MFA requerido para ADMIN" in response.json()["detail"]

def test_replay_attack_distributor():
    """
    Verifica que el sistema rechace un request duplicado (Replay Attack) para DISTRIBUTOR.
    Enviamos un mock webhook o endpoint protegido por HMAC y nonce.
    Como no hay endpoint explícito para distributor nonce, probamos el servicio.
    """
    from app.services.distributor_auth_service import distributor_auth_service
    from app.domain.exceptions import DomainException
    
    nonce = f"nonce_{int(time.time())}"
    
    # 1. Primer uso: debe pasar sin excepción
    distributor_auth_service.validar_nonce(nonce)
    
    # 2. Segundo uso: debe lanzar DomainException (409)
    try:
        distributor_auth_service.validar_nonce(nonce)
        assert False, "Debería haber fallado por Replay Attack"
    except DomainException as e:
        assert e.status_code == 409
        assert "Replay Attack" in e.message
