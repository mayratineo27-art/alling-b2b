from typing import List, Optional, Dict, Any
from app.domain.product import Product
from app.domain.repositories.product_repository import IProductRepository
from app.domain.exceptions import DomainException

class ProductQueryService:
    def __init__(self, repo: IProductRepository):
        self.repo = repo
        
    def list_products(
        self,
        skip: int = 0,
        limit: int = 10,
        categoria: Optional[str] = None,
        marca: Optional[str] = None,
        precio_min: Optional[float] = None,
        precio_max: Optional[float] = None,
        in_stock: Optional[bool] = None
    ) -> List[Product]:
        """Listado paginado con filtros (RF-CAT-001 + RNF-PERF-001)"""
        return self.repo.list_all(
            skip=skip,
            limit=limit,
            categoria=categoria,
            marca=marca,
            precio_min=precio_min,
            precio_max=precio_max,
            in_stock=in_stock
        )

    def get_by_slug(self, slug: str) -> Product:
        """Detalle de producto por slug amigable (RF-CAT-002)"""
        product = self.repo.get_by_slug(slug)
        if not product:
            raise DomainException(message="Producto no encontrado", status_code=404)
        return product

    def search(self, query: str) -> List[Product]:
        """Búsqueda full-text con debounce en frontend (RF-CAT-003)"""
        return self.repo.search(query)

    # ------------------------------------------------------------------
    # NUEVO MÉTODO PARA LANDING PAGE (RF-CAT-004)
    # Optimizado para cargar todo en una sola consulta o pocas consultas
    # ------------------------------------------------------------------
    def get_landing_data(self) -> Dict[str, Any]:
        """
        Retorna datos agregados para la Landing Page GUEST.
        Estructura esperada por el frontend:
        {
            "destacados": [Product],      # is_featured=True, sin precio
            "novedades": [Product],       # created_at > hace 7 días
            "categorias_conteo": [{"nombre": str, "count": int}]
        }
        """
        destacados = self.repo.list_featured(limit=8)
        novedades = self.repo.list_recent(limit=8)
        categorias_dict = self.repo.get_category_counts()
        
        categorias_list = [
            {"nombre": cat, "count": count} 
            for cat, count in categorias_dict.items()
        ]
        
        return {
            "destacados": destacados,
            "novedades": novedades,
            "categorias_conteo": categorias_list
        }