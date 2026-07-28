"""
CategoryImageService — Gestión de imágenes de referencia por categoría.

RF relacionado  : RF-CAT-009
CA relacionado  : CA-CAT-009 (CRITERIOS_DE_ACEPTACION.md)
OPS relacionada : OPS-CAT-004
RN relacionadas : RN-CAT-IMG-01 .. RN-CAT-IMG-05

Reglas de negocio aplicadas aquí:
    RN-CAT-IMG-01: Solo ADMIN puede subir/eliminar.
    RN-CAT-IMG-02: Tipos permitidos: png, jpeg, webp. Máximo 2 MB.
    RN-CAT-IMG-03: image_url almacena la URL pública del objeto en Storage.
    RN-CAT-IMG-04: get_display_url() devuelve placeholder SVG si image_url=None.
    RN-CAT-IMG-05: delete_image() resetea image_url=None sin borrar la categoría.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Protocol, runtime_checkable

from sqlmodel import Session

from app.domain.exceptions import DomainException
from app.models.category import CategoryModel


# ─── CONSTANTES ──────────────────────────────────────────────────────────────

_ALLOWED_TYPES: frozenset[str] = frozenset({"image/png", "image/jpeg", "image/jpg", "image/webp", "image/pjpeg"})
_MAX_BYTES: int = 2 * 1024 * 1024          # 2 MB  (RN-CAT-IMG-02)
_PLACEHOLDER_URL: str = "/assets/category-placeholder.svg"  # static asset



def _optimize_image_bytes(file_bytes: bytes, original_filename: str, content_type: str) -> tuple[bytes, str, str]:
    """Redimensiona y comprime imágenes a WebP/JPEG súper liviano (~15-30 KB) para tarjetas."""
    try:
        import io
        from PIL import Image
        img = Image.open(io.BytesIO(file_bytes))
        img.thumbnail((450, 450), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        if img.mode in ("RGBA", "P"):
            img.save(out, format="WEBP", quality=80)
            new_filename = original_filename.rsplit(".", 1)[0] + ".webp"
            return out.getvalue(), new_filename, "image/webp"
        else:
            img = img.convert("RGB")
            img.save(out, format="JPEG", quality=80)
            new_filename = original_filename.rsplit(".", 1)[0] + ".jpg"
            return out.getvalue(), new_filename, "image/jpeg"
    except Exception:
        return file_bytes, original_filename, content_type



# ─── DTO de respuesta ─────────────────────────────────────────────────────────

@dataclass
class CategoryImageResult:
    """Objeto de retorno de upload_image(). No usa Pydantic para evitar overhead."""
    category_id: str
    image_url: str


# ─── PROTOCOLO para el UploadFile de FastAPI (permite tests sin FastAPI) ──────

@runtime_checkable
class IUploadFile(Protocol):
    """Interfaz mínima compatible con fastapi.UploadFile y MagicMock."""

    filename: str
    content_type: str
    size: int

    def read(self) -> bytes: ...


# ─── PROTOCOLO mínimo del StorageService ──────────────────────────────────────

@runtime_checkable
class IStorageService(Protocol):
    def upload(self, file_bytes: bytes, filename: str, content_type: str) -> str: ...
    def delete(self, public_url: str) -> None: ...


# ─── SERVICIO PRINCIPAL ───────────────────────────────────────────────────────

class CategoryImageService:
    """
    Servicio de dominio para gestionar imágenes de referencia de categorías.

    Diseñado para inyección de dependencias:
        service = CategoryImageService(storage=SupabaseStorageService(...))

    Los tests inyectan un MagicMock como storage (pytest-mock).
    """

    def __init__(self, storage: IStorageService) -> None:
        self._storage = storage

    # ── validaciones privadas ─────────────────────────────────────────────────

    def _assert_admin(self, actor_role: str) -> None:
        """RN-CAT-IMG-01: solo ADMIN puede mutar imágenes."""
        if actor_role != "ADMIN":
            raise DomainException(
                message=f"Permiso denegado: se requiere rol ADMIN, se recibió '{actor_role}'. (403)",
                status_code=403,
            )

    def _assert_valid_file(self, file: IUploadFile) -> None:
        """RN-CAT-IMG-02: tipo de archivo y tamaño."""
        if file.content_type not in _ALLOWED_TYPES:
            raise DomainException(
                message=(
                    f"Tipo de archivo no permitido: '{file.content_type}'. "
                    "Use png, jpeg o webp. (422)"
                ),
                status_code=422,
            )
        if file.size > _MAX_BYTES:
            raise DomainException(
                message=(
                    f"El archivo supera el tamaño máximo permitido de 2 MB "
                    f"(recibido: {file.size / 1_048_576:.2f} MB). (422)"
                ),
                status_code=422,
            )

    def _get_category_or_404(self, db: Session, category_id: str) -> CategoryModel:
        """Busca la categoría en BD; convierte a UUID si es necesario para PostgreSQL."""
        cat: Optional[CategoryModel] = None
        try:
            from uuid import UUID
            uuid_obj = UUID(category_id)
            cat = db.get(CategoryModel, uuid_obj)
        except (ValueError, TypeError):
            pass

        if cat is None:
            cat = db.get(CategoryModel, category_id)

        if cat is None:
            raise DomainException(
                message=f"Categoría '{category_id}' no encontrada.",
                status_code=404,
            )
        return cat


    # ── operaciones públicas ──────────────────────────────────────────────────

    def upload_image(
        self,
        db: Session,
        category_id: str,
        file: IUploadFile,
        actor_role: str = "ADMIN",
    ) -> CategoryImageResult:
        """
        Sube una imagen de referencia para la categoría indicada.

        Flujo (CA-CAT-009 Esc.1 / OPS-CAT-004):
            1. Verificar que actor_role == ADMIN            (RN-CAT-IMG-01)
            2. Validar MIME type y tamaño del archivo       (RN-CAT-IMG-02)
            3. Buscar la categoría en BD                    (→ 404 si no existe)
            4. Si ya tiene imagen, eliminar la anterior del storage (Esc.8)
            5. Subir los bytes al StorageService            (RN-CAT-IMG-03)
            6. Actualizar category.image_url en BD y commit
            7. Retornar CategoryImageResult

        Args:
            db          : sesión SQLModel/SQLAlchemy activa.
            category_id : UUID de la categoría como string.
            file        : objeto compatible con IUploadFile (FastAPI UploadFile o mock).
            actor_role  : rol del usuario autenticado (default "ADMIN" para tests).

        Raises:
            DomainException(403) si actor_role != ADMIN.
            DomainException(422) si MIME o tamaño son inválidos.
            DomainException(404) si la categoría no existe.
        """
        # 1. RBAC
        self._assert_admin(actor_role)

        # 2. Validar archivo
        self._assert_valid_file(file)

        # 3. Obtener categoría
        category = self._get_category_or_404(db, category_id)

        # 4. Si existe imagen previa, limpiarla del storage (CA-CAT-009 Esc.8)
        if category.image_url:
            self._storage.delete(category.image_url)

        # 5. Optimizar bytes y subir al storage (RN-CAT-IMG-03)
        raw_bytes: bytes = file.read()
        file_bytes, opt_filename, opt_content_type = _optimize_image_bytes(
            raw_bytes, file.filename, file.content_type
        )
        public_url: str = self._storage.upload(
            file_bytes=file_bytes,
            filename=opt_filename,
            content_type=opt_content_type,
        )


        # 6. Persistir en BD
        category.image_url = public_url
        db.add(category)
        db.commit()

        return CategoryImageResult(
            category_id=category_id,
            image_url=public_url,
        )

    def save_image_from_url_or_data_uri(
        self,
        db: Session,
        category_id: str,
        image_data: str,
        actor_role: str = "ADMIN",
    ) -> CategoryImageResult:
        """Permite guardar directamente una imagen proveniente de Data URI o URL remota de IA."""
        self._assert_admin(actor_role)
        category = self._get_category_or_404(db, category_id)

        if image_data.startswith("data:"):
            import base64
            header, b64 = image_data.split(",", 1)
            raw_bytes = base64.b64decode(b64)
            file_bytes, opt_filename, opt_content_type = _optimize_image_bytes(
                raw_bytes, f"category_{category_id}.webp", "image/webp"
            )
            public_url = self._storage.upload(file_bytes, opt_filename, opt_content_type)
        elif image_data.startswith("http://") or image_data.startswith("https://"):
            import urllib.request
            try:
                req = urllib.request.Request(image_data, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    raw_bytes = resp.read()
                file_bytes, opt_filename, opt_content_type = _optimize_image_bytes(
                    raw_bytes, f"category_{category_id}.webp", "image/webp"
                )
                public_url = self._storage.upload(file_bytes, opt_filename, opt_content_type)
            except Exception:
                public_url = image_data
        else:
            public_url = image_data

        if category.image_url and category.image_url != public_url:
            self._storage.delete(category.image_url)

        category.image_url = public_url
        db.add(category)
        db.commit()

        return CategoryImageResult(category_id=category_id, image_url=public_url)


    def delete_image(
        self,
        db: Session,
        category_id: str,
        actor_role: str = "ADMIN",
    ) -> None:
        """
        Elimina la imagen de referencia de la categoría.

        Flujo (CA-CAT-009 Esc.6 / RN-CAT-IMG-05):
            1. Verificar que actor_role == ADMIN
            2. Buscar la categoría en BD
            3. Si image_url es None → operación idempotente (no error)
            4. Eliminar objeto del storage
            5. Resetear category.image_url = None en BD y commit

        Raises:
            DomainException(403) si actor_role != ADMIN.
            DomainException(404) si la categoría no existe.
        """
        # 1. RBAC
        self._assert_admin(actor_role)

        # 2. Obtener categoría
        category = self._get_category_or_404(db, category_id)

        # 3. Idempotente: si no tiene imagen, nada que hacer (CA-CAT-009 Esc.6)
        if category.image_url is None:
            return

        # 4. Eliminar del storage
        self._storage.delete(category.image_url)

        # 5. Resetear en BD (RN-CAT-IMG-05: categoría NO se elimina)
        category.image_url = None
        db.add(category)
        db.commit()

    def get_display_url(self, image_url: Optional[str]) -> str:
        """
        Resuelve la URL de visualización para un componente frontend.

        RN-CAT-IMG-04: Si image_url es None, devuelve el placeholder SVG neutro.
        Nunca retorna None ni una cadena vacía.

        Args:
            image_url: valor de category.image_url (puede ser None).

        Returns:
            URL pública de la imagen, o ruta del placeholder SVG.
        """
        if image_url:
            return image_url
        return _PLACEHOLDER_URL
