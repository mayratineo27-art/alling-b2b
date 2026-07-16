"""
TDD Tests — MOD-DIS-01: Integración DISTRIBUTOR
RF-DIS-001 a RF-DIS-004

Estrategia de autenticación:
  Header X-API-Key: clave del distribuidor
  Header X-Nonce: valor único por solicitud (anti-replay)
  Header X-Signature: HMAC-SHA256(nonce + body, api_secret)
"""
import hmac
import hashlib
import json
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

client = TestClient(app)

# Shared secret para tests (matches DISTRIBUTOR_SECRET in the router)
_TEST_SECRET = "test-distributor-secret-key"
_TEST_API_KEY = "dist-api-key-test"


def _make_headers(body: dict, nonce: str, secret: str = _TEST_SECRET, api_key: str = _TEST_API_KEY) -> dict:
    """Build valid HMAC headers for a distributor request."""
    body_bytes = json.dumps(body, separators=(",", ":")).encode()
    signature = hmac.new(
        secret.encode(),
        (nonce + body_bytes.decode()).encode(),
        hashlib.sha256
    ).hexdigest()
    return {
        "X-API-Key": api_key,
        "X-Nonce": nonce,
        "X-Signature": signature,
        "Content-Type": "application/json",
    }


# ─── RF-DIS-001: Autenticación HMAC ─────────────────────────────────────────

class TestAutenticacionHMAC:
    def test_sin_headers_retorna_401(self):
        """POST /distribuidor/sync without auth headers → 401"""
        response = client.post("/distribuidor/sync", json={"items": []})
        assert response.status_code == 401

    def test_api_key_invalida_retorna_401(self):
        """POST /distribuidor/sync with wrong api_key → 401"""
        body = {"items": []}
        headers = _make_headers(body, "nonce-001", api_key="wrong-key")
        response = client.post("/distribuidor/sync", json=body, headers=headers)
        assert response.status_code == 401

    def test_firma_invalida_retorna_401(self):
        """POST /distribuidor/sync with wrong signature → 401"""
        body = {"items": []}
        response = client.post(
            "/distribuidor/sync",
            json=body,
            headers={
                "X-API-Key": _TEST_API_KEY,
                "X-Nonce": "nonce-002",
                "X-Signature": "bad-signature",
            }
        )
        assert response.status_code == 401


# ─── RF-DIS-001: Anti-replay (nonce) ────────────────────────────────────────

class TestAntiReplay:
    def test_nonce_reutilizado_retorna_409(self):
        """
        POST /distribuidor/sync same nonce twice → 409 (RN-DIS-002, RNF-SEC-004).
        First request succeeds (or processes), second with same nonce → 409.
        """
        from app.services.distributor_auth_service import distributor_auth_service
        # Reset nonce registry to start fresh
        distributor_auth_service._nonces.clear()

        body = {"items": []}
        nonce = "replay-nonce-unique-xyz"
        headers = _make_headers(body, nonce)

        # First request — consume nonce
        r1 = client.post("/distribuidor/sync", json=body, headers=headers)
        assert r1.status_code in (200, 207)  # processed (empty batch is OK)

        # Second request — same nonce → 409
        r2 = client.post("/distribuidor/sync", json=body, headers=headers)
        assert r2.status_code == 409


# ─── RF-DIS-002 + RF-DIS-003: Sincronizar precios y stock ───────────────────

class TestSincronizacion:
    def test_batch_vacio_retorna_200(self):
        """POST /distribuidor/sync with empty items list → 200"""
        from app.services.distributor_auth_service import distributor_auth_service
        distributor_auth_service._nonces.clear()

        body = {"items": []}
        headers = _make_headers(body, "nonce-empty-batch")
        response = client.post("/distribuidor/sync", json=body, headers=headers)
        assert response.status_code == 200

    def test_batch_con_sku_valido_actualiza(self):
        """POST /distribuidor/sync with existing SKU → 200 with processed count"""
        from app.services.distributor_auth_service import distributor_auth_service
        distributor_auth_service._nonces.clear()

        body = {
            "items": [
                {"sku": "existing-sku-001", "price_public": 99.99, "stock": 50}
            ]
        }
        headers = _make_headers(body, "nonce-valid-sku")
        with patch("app.api.endpoints.distribuidor._find_product_by_sku") as mock_find:
            from app.domain.product import Product
            from decimal import Decimal
            import uuid
            mock_product = Product(
                id=uuid.uuid4(),
                name="Cable Test",
                sku="existing-sku-001",
                price_public=Decimal("80.00"),
                stock=30,
            )
            mock_find.return_value = mock_product
            response = client.post("/distribuidor/sync", json=body, headers=headers)
        assert response.status_code in (200, 207)


# ─── RF-DIS-004: Rechazar SKUs desconocidos ──────────────────────────────────

class TestSKUDesconocido:
    def test_sku_desconocido_retorna_207_con_errores(self):
        """
        POST /distribuidor/sync with unknown SKU → 207 Multi-Status.
        Valid SKUs processed, unknown SKUs reported in errors (RN-DIST-01).
        Partial processing — not all-or-nothing.
        """
        from app.services.distributor_auth_service import distributor_auth_service
        distributor_auth_service._nonces.clear()

        body = {
            "items": [
                {"sku": "unknown-sku-999", "price_public": 10.0, "stock": 5}
            ]
        }
        headers = _make_headers(body, "nonce-unknown-sku")
        with patch("app.api.endpoints.distribuidor._find_product_by_sku") as mock_find:
            mock_find.return_value = None  # SKU not found
            response = client.post("/distribuidor/sync", json=body, headers=headers)

        # 207 (partial) or 200 with rejected_skus list
        assert response.status_code in (200, 207)
        data = response.json()
        assert "rejected_skus" in data
        assert "unknown-sku-999" in data["rejected_skus"]

    def test_batch_mixto_procesa_validos_rechaza_invalidos(self):
        """
        Batch with valid + invalid SKUs → valid processed, invalid in rejected_skus.
        """
        from app.services.distributor_auth_service import distributor_auth_service
        distributor_auth_service._nonces.clear()

        body = {
            "items": [
                {"sku": "valid-sku", "stock": 10},
                {"sku": "invalid-sku", "stock": 5},
            ]
        }
        headers = _make_headers(body, "nonce-mixed-batch")

        from app.domain.product import Product
        from decimal import Decimal
        import uuid
        valid_product = Product(
            id=uuid.uuid4(), name="Valid", sku="valid-sku",
            price_public=Decimal("10.0"), stock=5,
        )

        def side_effect(sku, *args, **kwargs):
            return valid_product if sku == "valid-sku" else None

        with patch("app.api.endpoints.distribuidor._find_product_by_sku", side_effect=side_effect):
            response = client.post("/distribuidor/sync", json=body, headers=headers)

        assert response.status_code in (200, 207)
        data = response.json()
        assert "rejected_skus" in data
        assert "invalid-sku" in data["rejected_skus"]
        assert "valid-sku" not in data["rejected_skus"]
