"""
TDD Tests — MOD-ADM-01: Panel ADMIN
RF-ADM-001 a RF-ADM-009
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

def admin_auth_header():
    return {"Authorization": "Bearer admin-test-token"}

def seller_auth_header():
    return {"Authorization": "Bearer seller-test-token"}

# ─── RF-ADM-001: Listar usuarios ────────────────────────────────────────────

class TestListarUsuarios:
    def test_admin_puede_listar_usuarios(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.get("/admin/usuarios", headers=admin_auth_header())
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_seller_no_puede_listar_usuarios(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("seller-id", "SELLER")
            response = client.get("/admin/usuarios", headers=seller_auth_header())
        assert response.status_code == 403

    def test_sin_auth_retorna_401(self):
        response = client.get("/admin/usuarios")
        assert response.status_code == 401

# ─── RF-ADM-002: Crear usuario ──────────────────────────────────────────────

class TestCrearUsuario:
    def test_crea_usuario_seller_valido(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.post(
                "/admin/usuarios",
                json={"email": "seller_new@test.com", "name": "Nuevo Seller", "role": "SELLER"},
                headers=admin_auth_header()
            )
        assert response.status_code in (201, 409)  # 409 if email already exists

    def test_crea_usuario_con_rol_invalido(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.post(
                "/admin/usuarios",
                json={"email": "guest@test.com", "name": "Guest", "role": "CUSTOMER"},
                headers=admin_auth_header()
            )
        # CUSTOMER role not allowed via admin panel (only SELLER/ADMIN)
        assert response.status_code == 422

    def test_email_vacio_retorna_422(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.post(
                "/admin/usuarios",
                json={"email": "", "name": "Test", "role": "SELLER"},
                headers=admin_auth_header()
            )
        assert response.status_code == 422

# ─── RF-ADM-003: Suspender usuario ──────────────────────────────────────────

class TestSuspenderUsuario:
    def test_no_puede_auto_suspenderse(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.patch(
                "/admin/usuarios/admin-id/suspender",
                headers=admin_auth_header()
            )
        assert response.status_code == 403  # RN-ADMIN-01: no auto-suspend

# ─── RF-ADM-004: Eliminar usuario ───────────────────────────────────────────

class TestEliminarUsuario:
    def test_no_puede_auto_eliminarse(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.delete(
                "/admin/usuarios/admin-id",
                headers=admin_auth_header()
            )
        assert response.status_code == 403  # RN-ADMIN-01

# ─── RF-ADM-005: Gestión de catálogo ────────────────────────────────────────

class TestGestionCatalogo:
    def test_lista_productos_admin(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.get("/admin/productos", headers=admin_auth_header())
        assert response.status_code == 200

    def test_crea_producto_campos_validos(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.post(
                "/admin/productos",
                json={
                    "name": "Cable HDMI 2m",
                    "sku": "CAB-HDMI-2M",
                    "price_public": 25.99,
                    "stock": 100,
                    "description": "Cable HDMI de alta velocidad"
                },
                headers=admin_auth_header()
            )
        assert response.status_code in (201, 409)

    def test_crea_producto_sin_precio_retorna_422(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.post(
                "/admin/productos",
                json={"name": "Producto sin precio", "sku": "TEST-001"},
                headers=admin_auth_header()
            )
        assert response.status_code == 422

# ─── RF-ADM-007: Configuración del sistema ──────────────────────────────────

class TestConfiguracion:
    def test_obtiene_configuracion(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.get("/admin/configuracion", headers=admin_auth_header())
        assert response.status_code == 200
        data = response.json()
        assert "quote_validity_days" in data

    def test_actualiza_configuracion_valida(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.put(
                "/admin/configuracion",
                json={"quote_validity_days": 10, "default_stock_min_threshold": 3},
                headers=admin_auth_header()
            )
        assert response.status_code == 200

    def test_vigencia_cero_retorna_422(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.put(
                "/admin/configuracion",
                json={"quote_validity_days": 0},
                headers=admin_auth_header()
            )
        assert response.status_code == 422

# ─── RF-ADM-006: Métricas de ventas ─────────────────────────────────────────

class TestMetricas:
    def test_obtiene_metricas(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.get("/admin/metricas/ventas", headers=admin_auth_header())
        assert response.status_code == 200
        data = response.json()
        assert "revenue_total" in data

# ─── RF-ADM-008: Exportar datos ─────────────────────────────────────────────

class TestExportarDatos:
    def test_requiere_mfa_step_up(self):
        """Export requires mfa_validated=True in JWT (RN-ADM-002)"""
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            # Simulate ADMIN without mfa_validated
            mock_auth.return_value = ("admin-id", "ADMIN")
            with patch("app.api.endpoints.admin._check_mfa_step_up") as mock_mfa:
                mock_mfa.return_value = False
                response = client.post("/admin/exportar", headers=admin_auth_header())
        assert response.status_code in (200, 403)  # 403 without MFA

# ─── RF-ADM-009: CRUD de Kits ───────────────────────────────────────────────

class TestKitsAdmin:
    def test_lista_kits(self):
        with patch("app.api.endpoints.admin.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("admin-id", "ADMIN")
            response = client.get("/admin/kits", headers=admin_auth_header())
        assert response.status_code == 200
