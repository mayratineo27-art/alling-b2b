"""
RF-AUT-009: renovación de sesión vía refresh token, sin forzar re-login
cada 60 minutos (access_token). Usa credenciales bootstrap de SELLER
(seller@alling.pe) ya definidas en login_local para no depender de OAuth.

Cada test crea su propio TestClient (no el `client` module-level de otros
archivos) para tener un cookie jar aislado — httpx persiste cookies en la
instancia, y varios tests de este módulo dependen de estados de cookie
mutuamente excluyentes (token rotado, revocado, etc.).
"""
from fastapi.testclient import TestClient
from app.main import app

CREDENCIALES_SELLER = {"email": "seller@alling.pe", "password": "HashedPassword"}


def test_login_local_emite_cookie_refresh_token():
    client = TestClient(app, base_url="http://localhost")
    response = client.post("/auth/login", json=CREDENCIALES_SELLER)

    assert response.status_code == 200
    assert "refresh_token" in response.cookies
    assert "session_token" in response.cookies


def test_refresh_emite_nuevo_access_token_valido():
    client = TestClient(app, base_url="http://localhost")
    client.post("/auth/login", json=CREDENCIALES_SELLER)

    # Simula que el access_token (60 min) expiró: solo queda refresh_token.
    del client.cookies["session_token"]
    assert client.get("/auth/me").status_code == 401

    refresh_res = client.post("/auth/refresh")
    assert refresh_res.status_code == 200
    assert "session_token" in refresh_res.cookies

    me_res = client.get("/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "seller@alling.pe"


def test_refresh_sin_cookie_retorna_401():
    client = TestClient(app, base_url="http://localhost")
    response = client.post("/auth/refresh")
    assert response.status_code == 401


def test_refresh_con_token_invalido_retorna_401():
    client = TestClient(app, base_url="http://localhost")
    client.cookies.set("refresh_token", "token-que-no-existe-en-bd")
    response = client.post("/auth/refresh")
    assert response.status_code == 401


def test_refresh_rota_token_e_invalida_reuso_del_anterior():
    """RN-AUT-004: reutilizar un refresh token ya rotado debe fallar,
    en vez de seguir siendo válido indefinidamente (mitiga robo de token)."""
    client = TestClient(app, base_url="http://localhost")
    login_res = client.post("/auth/login", json=CREDENCIALES_SELLER)
    token_viejo = login_res.cookies.get("refresh_token")

    primer_refresh = client.post("/auth/refresh")
    assert primer_refresh.status_code == 200
    token_nuevo = primer_refresh.cookies.get("refresh_token")
    assert token_nuevo != token_viejo

    # Reintentar con el token viejo (ya rotado) debe fallar.
    client.cookies.set("refresh_token", token_viejo)
    reuso = client.post("/auth/refresh")
    assert reuso.status_code == 401


def test_logout_revoca_refresh_token_server_side():
    client = TestClient(app, base_url="http://localhost")
    login_res = client.post("/auth/login", json=CREDENCIALES_SELLER)
    refresh_token = login_res.cookies.get("refresh_token")

    logout_res = client.post("/auth/logout")
    assert logout_res.status_code == 200

    # Reutilizar el refresh_token tras logout debe fallar (revocado en BD,
    # no solo borrado del navegador).
    client.cookies.set("refresh_token", refresh_token)
    response = client.post("/auth/refresh")
    assert response.status_code == 401
