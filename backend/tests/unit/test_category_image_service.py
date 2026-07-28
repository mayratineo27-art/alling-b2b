"""
🔴 CICLO RED — RF-CAT-009: Imagen de referencia por categoría
=============================================================
CA relacionado  : CA-CAT-009 (CRITERIOS_DE_ACEPTACION.md)
Módulo          : MOD-CAT-01 → OPS-CAT-004
RN relacionadas : RN-CAT-IMG-01 .. RN-CAT-IMG-05
Servicios target: CategoryImageService, StorageService (NO EXISTEN AÚN)

INSTRUCCIONES TDD:
  - Estos tests DEBEN FALLAR con ImportError / AttributeError
    porque CategoryImageService aún no está implementado.
  - GREEN: implementar el mínimo código para que pasen.
  - REFACTOR: tipado estricto, ruff, mypy.
"""

import io
import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4

# ─── IMPORTACIONES TARGET (aún no existen → RED) ───────────────────────────
# Si estos imports fallan, los tests ya están en RED correctamente.
from app.services.category_image_service import CategoryImageService  # noqa: F401
from app.domain.exceptions import DomainException  # noqa: F401


# ─── HELPERS ────────────────────────────────────────────────────────────────

def _fake_file(content: bytes = b"fake-image", filename: str = "img.webp",
               content_type: str = "image/webp") -> MagicMock:
    """Simula un UploadFile de FastAPI."""
    upload = MagicMock()
    upload.filename = filename
    upload.content_type = content_type
    upload.size = len(content)
    upload.read = MagicMock(return_value=content)
    upload.file = io.BytesIO(content)
    return upload


FAKE_STORAGE_URL = "https://storage.supabase.co/categories/{}/img.webp"

# ─── FIXTURES ────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_storage_service() -> MagicMock:
    """StorageService mockeado — integración externa (Supabase Storage / S3)."""
    storage = MagicMock()
    storage.upload.return_value = FAKE_STORAGE_URL.format("test-uuid")
    storage.delete.return_value = None
    return storage


@pytest.fixture
def service(mock_storage_service: MagicMock) -> "CategoryImageService":
    return CategoryImageService(storage=mock_storage_service)


@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock()


@pytest.fixture
def existing_category(mock_db: MagicMock) -> MagicMock:
    """Categoría existente con image_url=None."""
    cat = MagicMock()
    cat.id = uuid4()
    cat.image_url = None
    mock_db.get.return_value = cat
    return cat


@pytest.fixture
def category_with_image(mock_db: MagicMock) -> MagicMock:
    """Categoría existente con image_url ya asignada."""
    cat = MagicMock()
    cat.id = uuid4()
    cat.image_url = "https://storage.supabase.co/categories/old-uuid/old.png"
    mock_db.get.return_value = cat
    return cat


# ═══════════════════════════════════════════════════════════════════════════
# ESCENARIO 1: ADMIN sube imagen válida (Happy Path) — CA-CAT-009 Esc.1
# ═══════════════════════════════════════════════════════════════════════════

class TestUploadImageHappyPath:
    """RN-CAT-IMG-01, RN-CAT-IMG-02, RN-CAT-IMG-03"""

    def test_upload_valid_webp_returns_image_url(
        self, service: "CategoryImageService", mock_db: MagicMock,
        existing_category: MagicMock, mock_storage_service: MagicMock
    ) -> None:
        """CA-CAT-009 Esc.1: archivo .webp de 800 KB → HTTP 200, image_url persistida."""
        file = _fake_file(
            content=b"x" * 800_000,
            filename="fibra_optica.webp",
            content_type="image/webp",
        )
        result = service.upload_image(
            db=mock_db,
            category_id=str(existing_category.id),
            file=file,
        )

        # La URL pública devuelta debe ser la que entrega StorageService
        assert result.image_url.startswith("https://")
        # La categoría debe haber sido mutada con la nueva URL
        assert existing_category.image_url == result.image_url
        # StorageService.upload debe haber sido llamado una vez
        mock_storage_service.upload.assert_called_once()
        # La sesión debe haber hecho commit
        mock_db.commit.assert_called_once()

    def test_upload_valid_jpeg_returns_image_url(
        self, service: "CategoryImageService", mock_db: MagicMock,
        existing_category: MagicMock,
    ) -> None:
        """CA-CAT-009 Esc.1 (variante): archivo .jpeg también es válido."""
        file = _fake_file(
            content=b"x" * 500_000,
            filename="red_cat.jpeg",
            content_type="image/jpeg",
        )
        result = service.upload_image(
            db=mock_db,
            category_id=str(existing_category.id),
            file=file,
        )
        assert result.image_url.startswith("https://")

    def test_upload_valid_png_returns_image_url(
        self, service: "CategoryImageService", mock_db: MagicMock,
        existing_category: MagicMock,
    ) -> None:
        """CA-CAT-009 Esc.1 (variante): archivo .png también es válido."""
        file = _fake_file(
            content=b"x" * 200_000,
            filename="categoria.png",
            content_type="image/png",
        )
        result = service.upload_image(
            db=mock_db,
            category_id=str(existing_category.id),
            file=file,
        )
        assert result.image_url.startswith("https://")


# ═══════════════════════════════════════════════════════════════════════════
# ESCENARIO 2: Archivo excede 2 MB — CA-CAT-009 Esc.2  (RN-CAT-IMG-02)
# ═══════════════════════════════════════════════════════════════════════════

class TestUploadImageSizeValidation:
    """RN-CAT-IMG-02: talla máxima 2 MB → HTTP 422."""

    def test_file_exceeding_2mb_raises_domain_exception(
        self, service: "CategoryImageService", mock_db: MagicMock,
        existing_category: MagicMock,
    ) -> None:
        """CA-CAT-009 Esc.2: archivo de 3.5 MB → DomainException (→ HTTP 422)."""
        large_file = _fake_file(
            content=b"x" * 3_500_000,   # 3.5 MB
            filename="banner_hd.png",
            content_type="image/png",
        )

        with pytest.raises(DomainException) as exc_info:
            service.upload_image(
                db=mock_db,
                category_id=str(existing_category.id),
                file=large_file,
            )

        assert "2 MB" in str(exc_info.value)
        # image_url no debe cambiar
        assert existing_category.image_url is None
        mock_db.commit.assert_not_called()

    def test_file_exactly_at_2mb_boundary_is_accepted(
        self, service: "CategoryImageService", mock_db: MagicMock,
        existing_category: MagicMock,
    ) -> None:
        """Límite exacto de 2 MB debe aceptarse (boundary test)."""
        boundary_file = _fake_file(
            content=b"x" * 2_097_152,   # exactamente 2 MB
            filename="exact_limit.webp",
            content_type="image/webp",
        )
        # No debe lanzar excepción
        result = service.upload_image(
            db=mock_db,
            category_id=str(existing_category.id),
            file=boundary_file,
        )
        assert result.image_url.startswith("https://")


# ═══════════════════════════════════════════════════════════════════════════
# ESCENARIO 3: Tipo de archivo no permitido — CA-CAT-009 Esc.3
# ═══════════════════════════════════════════════════════════════════════════

class TestUploadImageMimeTypeValidation:
    """RN-CAT-IMG-02: solo image/png, image/jpeg, image/webp permitidos."""

    @pytest.mark.parametrize("mime_type,filename", [
        ("application/pdf", "documento.pdf"),
        ("image/gif", "animado.gif"),
        ("image/svg+xml", "icono.svg"),
        ("text/plain", "truco.txt"),
        ("application/octet-stream", "binario.bin"),
    ])
    def test_invalid_mime_type_raises_domain_exception(
        self, service: "CategoryImageService", mock_db: MagicMock,
        existing_category: MagicMock, mime_type: str, filename: str,
    ) -> None:
        """CA-CAT-009 Esc.3: tipo no permitido → DomainException (→ HTTP 422)."""
        bad_file = _fake_file(
            content=b"irrelevant",
            filename=filename,
            content_type=mime_type,
        )

        with pytest.raises(DomainException) as exc_info:
            service.upload_image(
                db=mock_db,
                category_id=str(existing_category.id),
                file=bad_file,
            )

        error_msg = str(exc_info.value).lower()
        assert "png" in error_msg or "jpeg" in error_msg or "webp" in error_msg
        mock_db.commit.assert_not_called()


# ═══════════════════════════════════════════════════════════════════════════
# ESCENARIO 4 & 5: Control de acceso (RBAC / Zero Trust) — CA-CAT-009 Esc.4, 5
# ═══════════════════════════════════════════════════════════════════════════

class TestUploadImageAuthorization:
    """RN-CAT-IMG-01: solo ADMIN puede subir/eliminar imágenes."""

    @pytest.mark.parametrize("role", ["CUSTOMER", "SELLER", "GUEST"])
    def test_non_admin_role_raises_permission_error(
        self, service: "CategoryImageService", mock_db: MagicMock,
        existing_category: MagicMock, role: str,
    ) -> None:
        """CA-CAT-009 Esc.4: roles no-ADMIN → DomainException (→ HTTP 403)."""
        file = _fake_file()

        with pytest.raises(DomainException) as exc_info:
            service.upload_image(
                db=mock_db,
                category_id=str(existing_category.id),
                file=file,
                actor_role=role,          # se pasa el rol del actor autenticado
            )

        assert "403" in str(exc_info.value) or "permission" in str(exc_info.value).lower()
        mock_db.commit.assert_not_called()

    def test_admin_role_is_allowed(
        self, service: "CategoryImageService", mock_db: MagicMock,
        existing_category: MagicMock,
    ) -> None:
        """Solo confirma que ADMIN pasa la guardia de autorización sin excepción."""
        file = _fake_file()
        result = service.upload_image(
            db=mock_db,
            category_id=str(existing_category.id),
            file=file,
            actor_role="ADMIN",
        )
        assert result.image_url is not None


# ═══════════════════════════════════════════════════════════════════════════
# ESCENARIO 6: ADMIN elimina imagen — CA-CAT-009 Esc.6  (RN-CAT-IMG-05)
# ═══════════════════════════════════════════════════════════════════════════

class TestDeleteImage:
    """RN-CAT-IMG-05: eliminar imagen → image_url=null, categoría intacta."""

    def test_delete_image_resets_image_url_to_null(
        self, service: "CategoryImageService", mock_db: MagicMock,
        category_with_image: MagicMock, mock_storage_service: MagicMock,
    ) -> None:
        """CA-CAT-009 Esc.6: DELETE → image_url=None, categoría NO eliminada."""
        service.delete_image(
            db=mock_db,
            category_id=str(category_with_image.id),
            actor_role="ADMIN",
        )

        assert category_with_image.image_url is None
        # StorageService.delete debe haber sido llamado con la URL anterior
        mock_storage_service.delete.assert_called_once()
        mock_db.commit.assert_called_once()
        # La categoría sigue en DB (no fue borrada)
        mock_db.delete.assert_not_called()

    def test_delete_image_on_category_without_image_is_idempotent(
        self, service: "CategoryImageService", mock_db: MagicMock,
        existing_category: MagicMock, mock_storage_service: MagicMock,
    ) -> None:
        """Eliminar imagen en categoría sin imagen no debe lanzar error."""
        service.delete_image(
            db=mock_db,
            category_id=str(existing_category.id),
            actor_role="ADMIN",
        )
        assert existing_category.image_url is None
        mock_storage_service.delete.assert_not_called()

    def test_non_admin_cannot_delete_image(
        self, service: "CategoryImageService", mock_db: MagicMock,
        category_with_image: MagicMock,
    ) -> None:
        """RN-CAT-IMG-01: CUSTOMER intenta eliminar → DomainException (403)."""
        with pytest.raises(DomainException):
            service.delete_image(
                db=mock_db,
                category_id=str(category_with_image.id),
                actor_role="CUSTOMER",
            )
        mock_db.commit.assert_not_called()


# ═══════════════════════════════════════════════════════════════════════════
# ESCENARIO 7: Placeholder cuando image_url=None — CA-CAT-009 Esc.7
# ═══════════════════════════════════════════════════════════════════════════

class TestCategoryImageUrlResolution:
    """RN-CAT-IMG-04: get_display_url devuelve placeholder si image_url=None."""

    def test_get_display_url_returns_placeholder_when_null(
        self, service: "CategoryImageService",
    ) -> None:
        """CA-CAT-009 Esc.7: image_url=None → placeholder SVG path (no roto)."""
        url = service.get_display_url(image_url=None)

        assert url is not None
        assert url != ""
        # El placeholder debe ser una ruta local o data-URI, nunca None
        assert "placeholder" in url.lower() or url.startswith("/") or url.startswith("data:")

    def test_get_display_url_returns_actual_url_when_set(
        self, service: "CategoryImageService",
    ) -> None:
        """Si image_url está seteada, se devuelve sin modificar."""
        real_url = "https://storage.supabase.co/categories/uuid/img.webp"
        url = service.get_display_url(image_url=real_url)
        assert url == real_url


# ═══════════════════════════════════════════════════════════════════════════
# ESCENARIO 8: Reemplazo de imagen existente — CA-CAT-009 Esc.8
# ═══════════════════════════════════════════════════════════════════════════

class TestReplaceImage:
    """Al reemplazar, la imagen anterior debe borrarse del storage."""

    def test_upload_replaces_old_image_in_storage(
        self, service: "CategoryImageService", mock_db: MagicMock,
        category_with_image: MagicMock, mock_storage_service: MagicMock,
    ) -> None:
        """CA-CAT-009 Esc.8: reemplazar imagen → storage.delete de la anterior."""
        old_url = category_with_image.image_url
        new_file = _fake_file(
            content=b"x" * 1_200_000,
            filename="redes_v2.jpeg",
            content_type="image/jpeg",
        )

        result = service.upload_image(
            db=mock_db,
            category_id=str(category_with_image.id),
            file=new_file,
            actor_role="ADMIN",
        )

        # La URL anterior debe haber sido eliminada del storage
        mock_storage_service.delete.assert_called_once_with(old_url)
        # La nueva URL debe ser diferente a la antigua
        assert result.image_url != old_url
        assert result.image_url.startswith("https://")
        mock_db.commit.assert_called_once()
