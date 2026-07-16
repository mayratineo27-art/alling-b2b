from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from app.domain.product import Product

class IProductRepository(ABC):
    @abstractmethod
    def list_all(
        self,
        skip: int = 0,
        limit: int = 10,
        categoria: Optional[str] = None,
        marca: Optional[str] = None,
        precio_min: Optional[float] = None,
        precio_max: Optional[float] = None,
        in_stock: Optional[bool] = None
    ) -> List[Product]:
        pass
        
    @abstractmethod
    def get_by_id(self, id: UUID) -> Optional[Product]:
        pass

    @abstractmethod
    def save(self, product: Product) -> None:
        pass

    @abstractmethod
    def get_by_slug(self, slug: str) -> Optional[Product]:
        pass

    @abstractmethod
    def search(self, query: str) -> List[Product]:
        pass

    @abstractmethod
    def get_category_counts(self) -> dict[str, int]:
        pass


    @abstractmethod
    def list_featured(self, limit: int = 8) -> List[Product]:
        """
        Obtiene productos marcados como destacados (is_featured=True).
        Usado exclusivamente por la Landing Page (RF-CAT-004).
        Debe usar índice en BD para evitar scans completos.
        """
        pass

    @abstractmethod
    def list_recent(self, limit: int = 8) -> List[Product]:
        """
        Obtiene los N productos más recientes ordenados por created_at DESC.
        Usado para la sección 'Novedades' en Landing Page.
        """
        pass

    @abstractmethod
    def get_by_sku(self, sku: str) -> Optional[Product]:
        """
        Obtiene un producto por su SKU.
        Usado por la integración del distribuidor (MOD-DIS-01).
        """
        pass