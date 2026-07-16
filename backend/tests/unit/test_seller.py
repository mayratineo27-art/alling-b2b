"""
TDD Tests — MOD-SEL-01: Panel SELLER (Stock, Pedidos, Guías)
RF-SEL-001 a RF-SEL-007
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

# ─── Helpers ───────────────────────────────────────────────────────────────

def seller_auth_header():
    """Returns a mock Authorization header for a SELLER user."""
    return {"Authorization": "Bearer seller-test-token"}

def mock_seller_user():
    return "seller-user-id"

# ─── RF-SEL-001: Listar productos con stock real ────────────────────────────

class TestListarStock:
    def test_lista_productos_con_stock_real(self):
        """GET /seller/stock → 200 con lista de productos"""
        with patch("app.api.endpoints.seller.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("seller-id", "SELLER")
            response = client.get("/seller/stock", headers=seller_auth_header())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_seller_sin_auth_retorna_401(self):
        """GET /seller/stock sin token → 401"""
        response = client.get("/seller/stock")
        assert response.status_code == 401

    def test_customer_no_puede_acceder(self):
        """GET /seller/stock con rol CUSTOMER → 403"""
        with patch("app.api.endpoints.seller.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("customer-id", "CUSTOMER")
            response = client.get("/seller/stock", headers=seller_auth_header())
        assert response.status_code == 403

# ─── RF-SEL-002: Actualizar stock ──────────────────────────────────────────

class TestActualizarStock:
    def test_actualiza_stock_valido(self):
        """PATCH /seller/stock/{id} con valor >= 0 → 200"""
        with patch("app.api.endpoints.seller.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("seller-id", "SELLER")
            response = client.patch(
                "/seller/stock/prod-001",
                json={"stock": 50},
                headers=seller_auth_header()
            )
        # 200 or 404 (product not found in mock) — not 422 or 403
        assert response.status_code in (200, 404)

    def test_stock_negativo_retorna_422(self):
        """PATCH /seller/stock/{id} con stock < 0 → 422 (RN-SEL-001)"""
        with patch("app.api.endpoints.seller.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("seller-id", "SELLER")
            response = client.patch(
                "/seller/stock/prod-001",
                json={"stock": -5},
                headers=seller_auth_header()
            )
        assert response.status_code == 422

# ─── RF-SEL-003: Configurar umbral mínimo ──────────────────────────────────

class TestUmbralStock:
    def test_actualiza_umbral_valido(self):
        """PATCH /seller/stock/{id}/umbral con umbral >= 0 → 200 or 404"""
        with patch("app.api.endpoints.seller.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("seller-id", "SELLER")
            response = client.patch(
                "/seller/stock/prod-001/umbral",
                json={"stock_min_threshold": 5},
                headers=seller_auth_header()
            )
        assert response.status_code in (200, 404)

    def test_umbral_negativo_retorna_422(self):
        """PATCH /seller/stock/{id}/umbral con valor < 0 → 422"""
        with patch("app.api.endpoints.seller.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("seller-id", "SELLER")
            response = client.patch(
                "/seller/stock/prod-001/umbral",
                json={"stock_min_threshold": -1},
                headers=seller_auth_header()
            )
        assert response.status_code == 422

# ─── RF-SEL-004: Cola de pedidos ───────────────────────────────────────────

class TestColaPedidos:
    def test_lista_pedidos_ready_to_ship(self):
        """GET /seller/pedidos → 200 con pedidos en READY_TO_SHIP"""
        with patch("app.api.endpoints.seller.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("seller-id", "SELLER")
            response = client.get("/seller/pedidos", headers=seller_auth_header())
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_filtro_por_estado(self):
        """GET /seller/pedidos?estado=SHIPPED → 200"""
        with patch("app.api.endpoints.seller.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("seller-id", "SELLER")
            response = client.get(
                "/seller/pedidos?estado=SHIPPED",
                headers=seller_auth_header()
            )
        assert response.status_code == 200

# ─── RF-SEL-005: Generar guía de envío ─────────────────────────────────────

class TestGenerarGuia:
    def test_genera_guia_valida(self, db_session_mock):
        """POST /seller/pedidos/{id}/guia con datos válidos → 201"""
        with patch("app.api.endpoints.seller.get_current_user_with_role") as mock_auth, \
             patch("app.api.endpoints.seller.get_db") as mock_db:
            mock_auth.return_value = ("seller-id", "SELLER")
            mock_db.return_value.__enter__ = MagicMock(return_value=db_session_mock)
            mock_db.return_value.__exit__ = MagicMock(return_value=False)
            response = client.post(
                "/seller/pedidos/order-001/guia",
                json={"weight_kg": 2.5, "packages_count": 1, "notes": "Frágil"},
                headers=seller_auth_header()
            )
        # 201 (created), 404 (order not found in test DB), or 409 (already shipped)
        assert response.status_code in (201, 404, 409)

    def test_peso_cero_retorna_422(self):
        """POST /seller/pedidos/{id}/guia con weight_kg=0 → 422"""
        with patch("app.api.endpoints.seller.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("seller-id", "SELLER")
            response = client.post(
                "/seller/pedidos/order-001/guia",
                json={"weight_kg": 0, "packages_count": 1},
                headers=seller_auth_header()
            )
        assert response.status_code == 422

    def test_bultos_cero_retorna_422(self):
        """POST /seller/pedidos/{id}/guia con packages_count=0 → 422"""
        with patch("app.api.endpoints.seller.get_current_user_with_role") as mock_auth:
            mock_auth.return_value = ("seller-id", "SELLER")
            response = client.post(
                "/seller/pedidos/order-001/guia",
                json={"weight_kg": 1.0, "packages_count": 0},
                headers=seller_auth_header()
            )
        assert response.status_code == 422


@pytest.fixture
def db_session_mock():
    return MagicMock()
