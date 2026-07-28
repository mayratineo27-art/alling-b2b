"""
Pruebas unitarias para ProductImageService (RF-PROD-004).

Reglas de negocio:
  RN-PROD-IMG-01: Solo ADMIN puede subir/eliminar imágenes de productos.
  RN-PROD-IMG-02: Tipos permitidos: png, jpeg, webp. Máximo 2 MB.
  RN-PROD-IMG-03: image_url almacena la URL pública o Base64 optimizada.
  RN-PROD-IMG-04: delete_image() resetea image_url=None sin borrar el producto.
"""

import io
import pytest
from unittest.mock import MagicMock
from uuid import uuid4

from app.domain.exceptions import DomainException
from app.models.product import ProductModel
from app.services.product_image_service import ProductImageService, ProductImageResult


@pytest.fixture
def mock_storage():
    storage = MagicMock()
    storage.upload.return_value = "data:image/webp;base64,mocked_optimized_data"
    return storage


@pytest.fixture
def product_service(mock_storage):
    return ProductImageService(storage_service=mock_storage)


@pytest.fixture
def dummy_product():
    return ProductModel(
        id=uuid4(),
        name="Cable UTP Categ 6",
        price_public=100.0,
        stock=50,
        is_active=True,
        image_url=None
    )


class DummyUploadFile:
    def __init__(self, filename: str, content_type: str, data: bytes):
        self.filename = filename
        self.content_type = content_type
        self.size = len(data)
        self._data = data

    def read(self) -> bytes:
        return self._data


# ─── 1. HAPPY PATH ────────────────────────────────────────────────────────────

def test_upload_valid_product_image_returns_result(product_service, dummy_product, mock_storage):
    db_session = MagicMock()
    db_session.get.return_value = dummy_product

    # PNG de 1x1 píxel
    raw_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x03\x00\x05\xfe\x02\xfe\xa7\x5c\xc8\x00\x00\x00\x00IEND\xaeB`\x82"
    upload_file = DummyUploadFile("cable.png", "image/png", raw_png)

    result = product_service.upload_image(
        db=db_session,
        product_id=str(dummy_product.id),
        file=upload_file,
        actor_role="ADMIN"
    )

    assert isinstance(result, ProductImageResult)
    assert result.product_id == str(dummy_product.id)
    assert result.image_url == "data:image/webp;base64,mocked_optimized_data"
    assert dummy_product.image_url == "data:image/webp;base64,mocked_optimized_data"
    db_session.commit.assert_called_once()


# ─── 2. VALIDACIONES DE SEGURIDAD Y TAMAÑO ─────────────────────────────────────

def test_non_admin_cannot_upload_product_image(product_service, dummy_product):
    db_session = MagicMock()
    upload_file = DummyUploadFile("cable.png", "image/png", b"fake")

    with pytest.raises(DomainException) as exc:
        product_service.upload_image(
            db=db_session,
            product_id=str(dummy_product.id),
            file=upload_file,
            actor_role="CUSTOMER"
        )
    assert exc.value.status_code == 403


def test_invalid_mime_type_raises_error(product_service, dummy_product):
    db_session = MagicMock()
    upload_file = DummyUploadFile("manual.pdf", "application/pdf", b"pdf content")

    with pytest.raises(DomainException) as exc:
        product_service.upload_image(
            db=db_session,
            product_id=str(dummy_product.id),
            file=upload_file,
            actor_role="ADMIN"
        )
    assert exc.value.status_code == 422


def test_file_exceeding_max_size_raises_error(product_service, dummy_product):
    db_session = MagicMock()
    large_data = b"X" * (2 * 1024 * 1024 + 1)  # > 2 MB
    upload_file = DummyUploadFile("grande.png", "image/png", large_data)

    with pytest.raises(DomainException) as exc:
        product_service.upload_image(
            db=db_session,
            product_id=str(dummy_product.id),
            file=upload_file,
            actor_role="ADMIN"
        )
    assert exc.value.status_code == 422


# ─── 3. ELIMINACIÓN DE IMAGEN ──────────────────────────────────────────────────

def test_delete_product_image_resets_url_to_none(product_service, dummy_product):
    dummy_product.image_url = "https://example.com/cable.jpg"
    db_session = MagicMock()
    db_session.get.return_value = dummy_product

    res = product_service.delete_image(
        db=db_session,
        product_id=str(dummy_product.id),
        actor_role="ADMIN"
    )

    assert res is True
    assert dummy_product.image_url is None
    db_session.commit.assert_called_once()
