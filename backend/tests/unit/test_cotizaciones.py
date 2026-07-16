"""
TDD Tests — MOD-COT-01: Cotizaciones Vista SELLER
RF-COT-001 a RF-COT-003
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

client = TestClient(app)


def seller_auth_header():
    return {"Authorization": "Bearer seller-test-token"}


# ─── RF-COT-001: Listar cotizaciones ────────────────────────────────────────

class TestListarCotizaciones:
    def test_seller_puede_listar_cotizaciones(self):
        """GET /cotizaciones → 200 with list"""
        with patch("app.api.endpoints.cotizaciones.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.get("/cotizaciones", headers=seller_auth_header())
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_sin_auth_retorna_401(self):
        response = client.get("/cotizaciones")
        assert response.status_code == 401

    def test_customer_no_puede_ver_cotizaciones(self):
        """CUSTOMER role → 403"""
        with patch("app.api.endpoints.cotizaciones.get_current_user_with_role") as m:
            m.return_value = ("cust-1", "CUSTOMER")
            response = client.get("/cotizaciones", headers=seller_auth_header())
        assert response.status_code == 403

    def test_filtro_por_estado_vigente(self):
        """GET /cotizaciones?estado=COTIZACION → 200"""
        with patch("app.api.endpoints.cotizaciones.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.get(
                "/cotizaciones?estado=COTIZACION",
                headers=seller_auth_header()
            )
        assert response.status_code == 200

    def test_filtro_por_estado_expirada(self):
        """GET /cotizaciones?estado=EXPIRADA → 200"""
        with patch("app.api.endpoints.cotizaciones.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.get(
                "/cotizaciones?estado=EXPIRADA",
                headers=seller_auth_header()
            )
        assert response.status_code == 200

    def test_filtro_estado_invalido_retorna_422(self):
        """GET /cotizaciones?estado=BORRADOR → 422 (not a valid quote state)"""
        with patch("app.api.endpoints.cotizaciones.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.get(
                "/cotizaciones?estado=BORRADOR",
                headers=seller_auth_header()
            )
        assert response.status_code == 422


# ─── RF-COT-002: Ver detalle de cotización ──────────────────────────────────

class TestDetalleCotizacion:
    def test_detalle_no_existente_retorna_404(self):
        """GET /cotizaciones/{id} for non-existent FU → 404"""
        with patch("app.api.endpoints.cotizaciones.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.get(
                "/cotizaciones/non-existent-id",
                headers=seller_auth_header()
            )
        assert response.status_code == 404


# ─── RF-COT-003: Descargar PDF de cotización ────────────────────────────────

class TestDescargaPDF:
    def test_pdf_no_disponible_retorna_404(self):
        """GET /cotizaciones/{id}/pdf when no pdf_url → 404"""
        with patch("app.api.endpoints.cotizaciones.get_current_user_with_role") as m:
            m.return_value = ("seller-1", "SELLER")
            response = client.get(
                "/cotizaciones/no-pdf-id/pdf",
                headers=seller_auth_header()
            )
        assert response.status_code == 404

    def test_pdf_disponible_redirige(self):
        """GET /cotizaciones/{id}/pdf when pdf_url set → 307 redirect"""
        import app.api.endpoints.cotizaciones as cot_module
        from app.domain.formato_unico import FormatoUnico, FormatoUnicoState
        
        fu = FormatoUnico(
            id="fu-with-pdf",
            state=FormatoUnicoState.COTIZACION,
            pdf_url="https://storage.example.com/cot-001.pdf"
        )
        cot_module._mock_repo.save(fu)
        try:
            with patch("app.api.endpoints.cotizaciones.get_current_user_with_role") as m:
                m.return_value = ("seller-1", "SELLER")
                response = client.get(
                    "/cotizaciones/fu-with-pdf/pdf",
                    headers=seller_auth_header(),
                    follow_redirects=False
                )
            assert response.status_code in (200, 302, 307)
        finally:
            cot_module._mock_repo._store.pop("fu-with-pdf", None)
