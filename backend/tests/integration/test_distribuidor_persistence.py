"""
Integration Test — MOD-DIS-01: Persistencia de Sincronización del Distribuidor
Tarea S5-05: Verificar que los cambios de precios y cantidades se persisten en base de datos real
"""
import hmac
import hashlib
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from sqlmodel import Session, select
from app.models.product import ProductModel
from decimal import Decimal

client = TestClient(app)

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


class TestDistribuidorPersistence:
    def test_sincronizacion_persiste_en_base_de_datos(self, setup_test_db: Session):
        """
        Tarea S5-05: Verificar que la sincronización del distribuidor persiste en base de datos real.
        
        Given: Un producto existente en la base de datos con precio_public=100.00 y stock=50
        When: El distribuidor envía una solicitud de sincronización con precio_public=150.00 y stock=30
        Then: El producto se actualiza en la base de datos y los cambios persisten
        """
        from app.services.distributor_auth_service import distributor_auth_service
        distributor_auth_service._nonces.clear()

        # Given: Crear un producto de prueba en la base de datos
        test_product = ProductModel(
            name="Router Wi-Fi 6 Test",
            slug="router-wifi-6-test",
            sku="ROUTER-WIFI-6-TEST",
            category="Redes",
            brand="TP-Link",
            description="Router de prueba para integración distribuidor",
            image_url="https://example.com/router.jpg",
            price_public=Decimal("100.00"),
            stock=50,
            reserved_stock=0,
            is_active=True,
            is_featured=False,
            specs={},
            image_gallery=[],
        )
        setup_test_db.add(test_product)
        setup_test_db.commit()
        setup_test_db.refresh(test_product)

        # Verificar estado inicial
        assert test_product.price_public == Decimal("100.00")
        assert test_product.stock == 50

        # When: Enviar solicitud de sincronización al endpoint
        body = {
            "items": [
                {
                    "sku": "ROUTER-WIFI-6-TEST",
                    "price_public": 150.00,
                    "stock": 30
                }
            ]
        }
        nonce = "nonce-persistence-test-001"
        headers = _make_headers(body, nonce)
        response = client.post("/distribuidor/sync", json=body, headers=headers)

        # Then: Verificar respuesta exitosa
        assert response.status_code == 200
        data = response.json()
        assert data["processed_count"] == 1
        assert len(data["rejected_skus"]) == 0

        # Then: Verificar que los cambios persistieron en base de datos
        updated_product = setup_test_db.exec(
            select(ProductModel).where(ProductModel.sku == "ROUTER-WIFI-6-TEST")
        ).first()

        assert updated_product is not None
        assert updated_product.price_public == Decimal("150.00")
        assert updated_product.stock == 30

    def test_sincronizacion_batch_mixto_persiste_correctamente(self, setup_test_db: Session):
        """
        Tarea S5-05: Verificar procesamiento parcial con persistencia correcta.
        
        Given: Dos productos en base de datos (SKU-A y SKU-B)
        When: El distribuidor envía un batch con SKU-A (válido) y SKU-C (inválido)
        Then: SKU-A se actualiza en BD, SKU-C se rechaza, sin afectar a SKU-A
        """
        from app.services.distributor_auth_service import distributor_auth_service
        distributor_auth_service._nonces.clear()

        # Given: Crear dos productos de prueba
        product_a = ProductModel(
            name="Producto A",
            slug="producto-a",
            sku="SKU-A",
            category="Test",
            brand="Test",
            description="Producto A",
            image_url="https://example.com/a.jpg",
            price_public=Decimal("50.00"),
            stock=20,
            reserved_stock=0,
            is_active=True,
            is_featured=False,
            specs={},
            image_gallery=[],
        )
        product_b = ProductModel(
            name="Producto B",
            slug="producto-b",
            sku="SKU-B",
            category="Test",
            brand="Test",
            description="Producto B",
            image_url="https://example.com/b.jpg",
            price_public=Decimal("75.00"),
            stock=15,
            reserved_stock=0,
            is_active=True,
            is_featured=False,
            specs={},
            image_gallery=[],
        )
        setup_test_db.add(product_a)
        setup_test_db.add(product_b)
        setup_test_db.commit()

        # When: Enviar batch mixto
        body = {
            "items": [
                {"sku": "SKU-A", "price_public": 60.00, "stock": 25},  # Válido
                {"sku": "SKU-C", "price_public": 10.00, "stock": 5},   # Inválido (no existe)
            ]
        }
        nonce = "nonce-mixed-batch-001"
        headers = _make_headers(body, nonce)
        response = client.post("/distribuidor/sync", json=body, headers=headers)

        # Then: Verificar respuesta parcial (207)
        assert response.status_code == 207
        data = response.json()
        assert data["processed_count"] == 1
        assert "SKU-C" in data["rejected_skus"]

        # Then: Verificar que SKU-A se actualizó en BD
        updated_a = setup_test_db.exec(
            select(ProductModel).where(ProductModel.sku == "SKU-A")
        ).first()
        assert updated_a.price_public == Decimal("60.00")
        assert updated_a.stock == 25

        # Then: Verificar que SKU-B no fue afectado
        unchanged_b = setup_test_db.exec(
            select(ProductModel).where(ProductModel.sku == "SKU-B")
        ).first()
        assert unchanged_b.price_public == Decimal("75.00")
        assert unchanged_b.stock == 15
