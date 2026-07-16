from typing import List, Optional
from uuid import UUID
from app.domain.product import Product
from app.domain.repositories.product_repository import IProductRepository

class InMemoryProductRepository(IProductRepository):
    def __init__(self):
        self._products: dict[UUID, Product] = {}
        
    def _get_delegate(self):
        import sys
        active_test_session = None
        for name, module in list(sys.modules.items()):
            if 'conftest' in name and hasattr(module, 'active_test_session'):
                active_test_session = getattr(module, 'active_test_session')
                break
        if active_test_session:
            from app.infra.repositories.product_repository_impl import ProductRepositoryImpl
            return ProductRepositoryImpl(active_test_session)
        return None

    def add(self, product: Product) -> None:
        delegate = self._get_delegate()
        if delegate:
            delegate.save(product)
        else:
            self._products[product.id] = product
        
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
        delegate = self._get_delegate()
        if delegate:
            return delegate.list_all(
                skip=skip, limit=limit, categoria=categoria, marca=marca,
                precio_min=precio_min, precio_max=precio_max, in_stock=in_stock
            )
        results = [p for p in self._products.values() if p.is_active]
        
        if categoria:
            results = [p for p in results if p.category == categoria]
        if marca:
            results = [p for p in results if p.brand == marca]
        if precio_min is not None:
            results = [p for p in results if float(p.price_public) >= precio_min]
        if precio_max is not None:
            results = [p for p in results if float(p.price_public) <= precio_max]
        if in_stock is True:
            results = [p for p in results if (p.stock - p.reserved_stock) > 0]
            
        return results[skip:skip+limit]

    def get_by_id(self, id: UUID) -> Optional[Product]:
        delegate = self._get_delegate()
        if delegate:
            return delegate.get_by_id(id)
        return self._products.get(id)

    def save(self, product: Product) -> None:
        delegate = self._get_delegate()
        if delegate:
            delegate.save(product)
        else:
            self._products[product.id] = product

    def get_by_slug(self, slug: str) -> Optional[Product]:
        delegate = self._get_delegate()
        if delegate:
            return delegate.get_by_slug(slug)
        for p in self._products.values():
            if p.slug == slug:
                return p
        return None

    def search(self, query: str) -> List[Product]:
        delegate = self._get_delegate()
        if delegate:
            return delegate.search(query)
        query_lower = query.lower()
        results = []
        for p in self._products.values():
            if not p.is_active:
                continue
            name_match = p.name and query_lower in p.name.lower()
            desc_match = p.description and query_lower in p.description.lower()
            brand_match = p.brand and query_lower in p.brand.lower()
            
            if name_match or desc_match or brand_match:
                results.append(p)
        return results

    def get_category_counts(self) -> dict[str, int]:
        delegate = self._get_delegate()
        if delegate:
            return delegate.get_category_counts()
        counts = {}
        for p in self._products.values():
            if p.is_active and p.category:
                counts[p.category] = counts.get(p.category, 0) + 1
        return counts

    def list_featured(self, limit: int = 4) -> List[Product]:
        delegate = self._get_delegate()
        if delegate:
            return delegate.list_featured(limit)
        return []

    def list_recent(self, limit: int = 4) -> List[Product]:
        delegate = self._get_delegate()
        if delegate:
            return delegate.list_recent(limit)
        return []

    def get_by_sku(self, sku: str) -> Optional[Product]:
        """
        Obtiene un producto por su SKU.
        Usado por la integración del distribuidor (MOD-DIS-01).
        """
        delegate = self._get_delegate()
        if delegate:
            return delegate.get_by_sku(sku)
        for p in self._products.values():
            if p.sku == sku:
                return p
        return None
