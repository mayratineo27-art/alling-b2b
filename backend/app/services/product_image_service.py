"""
ProductImageService — Gestión de imágenes de referencia por producto.

RF relacionado  : RF-PROD-004
CA relacionado  : CA-PROD-004
RN relacionadas : RN-PROD-IMG-01 .. RN-PROD-IMG-05
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Protocol, runtime_checkable
from uuid import UUID

from sqlmodel import Session

from app.domain.exceptions import DomainException
from app.models.product import ProductModel


_ALLOWED_TYPES: frozenset[str] = frozenset({"image/png", "image/jpeg", "image/jpg", "image/webp", "image/pjpeg"})
_MAX_BYTES: int = 2 * 1024 * 1024          # 2 MB (RN-PROD-IMG-02)



def _optimize_image_bytes(file_bytes: bytes, original_filename: str, content_type: str) -> tuple[bytes, str, str]:
    """Redimensiona y comprime imágenes de producto a WebP/JPEG súper liviano (< 40 KB)."""
    try:
        import io
        from PIL import Image
        img = Image.open(io.BytesIO(file_bytes))
        img.thumbnail((600, 600), Image.Resampling.LANCZOS)
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


@dataclass
class ProductImageResult:
    product_id: str
    image_url: str


@runtime_checkable
class IUploadFile(Protocol):
    filename: str
    content_type: str
    size: int

    def read(self) -> bytes: ...


@runtime_checkable
class IStorageService(Protocol):
    def upload(self, file_bytes: bytes, filename: str, content_type: str) -> str: ...
    def delete(self, public_url: str) -> bool: ...


class ProductImageService:
    def __init__(self, storage_service: IStorageService) -> None:
        self._storage: IStorageService = storage_service

    def upload_image(
        self,
        db: Session,
        product_id: str,
        file: IUploadFile,
        actor_role: str = "ADMIN",
    ) -> ProductImageResult:
        self._assert_admin(actor_role)
        self._assert_valid_file(file)

        product = self._get_product_or_404(db, product_id)

        if product.image_url:
            self._storage.delete(product.image_url)

        raw_bytes: bytes = file.read()
        file_bytes, opt_filename, opt_content_type = _optimize_image_bytes(
            raw_bytes, file.filename, file.content_type
        )
        public_url: str = self._storage.upload(
            file_bytes=file_bytes,
            filename=opt_filename,
            content_type=opt_content_type,
        )

        product.image_url = public_url
        db.add(product)
        db.commit()
        db.refresh(product)

        return ProductImageResult(
            product_id=product_id,
            image_url=public_url,
        )

    def delete_image(
        self,
        db: Session,
        product_id: str,
        actor_role: str = "ADMIN",
    ) -> bool:
        self._assert_admin(actor_role)
        product = self._get_product_or_404(db, product_id)

        if product.image_url:
            self._storage.delete(product.image_url)
            product.image_url = None
            db.add(product)
            db.commit()
            db.refresh(product)

        return True

    @staticmethod
    def _assert_admin(actor_role: str) -> None:
        if actor_role.upper() != "ADMIN":
            raise DomainException(
                message="Solo el usuario ADMIN puede gestionar imágenes de productos",
                status_code=403,
            )

    @staticmethod
    def _assert_valid_file(file: IUploadFile) -> None:
        if file.content_type not in _ALLOWED_TYPES:
            raise DomainException(
                message=f"Tipo de archivo no permitido: '{file.content_type}'. Use png, jpeg o webp",
                status_code=422,
            )
        if file.size > _MAX_BYTES:
            raise DomainException(
                message=f"El archivo supera el tamaño máximo de 2 MB (tamaño: {file.size} bytes)",
                status_code=422,
            )

    @staticmethod
    def _get_product_or_404(db: Session, product_id: str) -> ProductModel:
        product: Optional[ProductModel] = None
        try:
            uuid_obj = UUID(product_id)
            product = db.get(ProductModel, uuid_obj)
        except (ValueError, TypeError):
            pass

        if product is None:
            product = db.get(ProductModel, product_id)

        if not product:
            raise DomainException(
                message=f"Producto con ID '{product_id}' no encontrado",
                status_code=404,
            )
        return product

