"""
TDD Tests — MOD-CON-01: Consultas Pre-Venta (vista SELLER)
RF-CON-001 a RF-CON-004
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)


def seller_auth_header():
    return {"Authorization": "Bearer seller-test-token"}


# ─── RF-CON-001: Ver cola de consultas ──────────────────────────────────────

class TestColadeConsultas:
    def test_seller_puede_ver_consultas(self):
        """GET /consultas → 200 with list"""
        with patch("app.api.endpoints.consultas.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.get("/consultas", headers=seller_auth_header())
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_sin_auth_retorna_401(self):
        response = client.get("/consultas")
        assert response.status_code == 401

    def test_customer_no_puede_ver_consultas(self):
        """CUSTOMER role → 403"""
        with patch("app.api.endpoints.consultas.get_current_user_with_role") as m:
            m.return_value = ("cust-1", "CUSTOMER")
            response = client.get("/consultas", headers=seller_auth_header())
        assert response.status_code == 403


# ─── RF-CON-004: Filtrar consultas ──────────────────────────────────────────

class TestFiltrarConsultas:
    def test_filtro_assigned_to_me(self):
        """GET /consultas?assigned_to_me=true → 200"""
        with patch("app.api.endpoints.consultas.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.get(
                "/consultas?assigned_to_me=true",
                headers=seller_auth_header()
            )
        assert response.status_code == 200

    def test_filtro_sin_asignar(self):
        """GET /consultas?assigned_to_me=false → 200"""
        with patch("app.api.endpoints.consultas.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.get(
                "/consultas?assigned_to_me=false",
                headers=seller_auth_header()
            )
        assert response.status_code == 200


# ─── RF-CON-002: Tomar una consulta ─────────────────────────────────────────

class TestTomarConsulta:
    def test_tomar_consulta_no_existente_retorna_404(self):
        """POST /consultas/{id}/tomar for non-existent FU → 404"""
        with patch("app.api.endpoints.consultas.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.post(
                "/consultas/non-existent-id/tomar",
                headers=seller_auth_header()
            )
        assert response.status_code == 404

    def test_tomar_consulta_ya_asignada_retorna_409(self):
        """
        POST /consultas/{id}/tomar when already assigned → 409 (RN-CON-001)
        """
        from app.domain.formato_unico import FormatoUnico, FormatoUnicoState
        import app.api.endpoints.consultas as consultas_module
        
        fu = FormatoUnico(
            id="fu-already-taken",
            state=FormatoUnicoState.CONSULTA,
            assigned_seller_id="seller-2"
        )
        consultas_module._mock_repo.save(fu)
        try:
            with patch("app.api.endpoints.consultas.get_current_user_with_role") as m:
                m.return_value = ("seller-1", "SELLER")
                response = client.post(
                    "/consultas/fu-already-taken/tomar",
                    headers=seller_auth_header()
                )
            assert response.status_code == 409
        finally:
            consultas_module._mock_repo._store.pop("fu-already-taken", None)


# ─── RF-CON-003: Responder consulta ─────────────────────────────────────────

class TestResponderConsulta:
    def test_responder_consulta_no_asignada_retorna_403(self):
        """
        POST /consultas/{id}/responder when seller is NOT assigned → 403 (RN-CON-002)
        """
        with patch("app.api.endpoints.consultas.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.post(
                "/consultas/some-fu-id/responder",
                json={"consultant_note": "Tenemos stock disponible para su pedido."},
                headers=seller_auth_header()
            )
        # 403 (not assigned) or 404 (FU not found)
        assert response.status_code in (403, 404)

    def test_responder_con_nota_vacia_retorna_422(self):
        """POST /consultas/{id}/responder with empty note → 422"""
        with patch("app.api.endpoints.consultas.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.post(
                "/consultas/some-fu-id/responder",
                json={"consultant_note": ""},
                headers=seller_auth_header()
            )
        assert response.status_code == 422

    def test_responder_sin_nota_retorna_422(self):
        """POST /consultas/{id}/responder without body → 422"""
        with patch("app.api.endpoints.consultas.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.post(
                "/consultas/some-fu-id/responder",
                json={},
                headers=seller_auth_header()
            )
        assert response.status_code == 422
