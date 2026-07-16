from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, select, func
from app.domain.product import Product
from app.domain.repositories.product_repository import IProductRepository
from app.models.product import ProductModel  # Tu modelo SQLModel

class ProductRepositoryImpl(IProductRepository):
    def __init__(self, session: Session):
        self.session = session
        
    def _to_domain(self, p: ProductModel) -> Product:
        return Product(
            id=p.id,
            name=p.name,
            slug=p.slug,
            category=p.category,
            brand=p.brand,
            description=p.description,
            image_url=p.image_url,
            price_public=p.price_public,
            stock=p.stock,
            reserved_stock=p.reserved_stock,
            is_active=p.is_active,
            is_featured=p.is_featured,
            specs=p.specs,
            image_gallery=p.image_gallery,
            sku=p.sku,
            stock_visible_mode=getattr(p, 'stock_visible_mode', 'EXACT')
        )

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
        """Consulta optimizada con índices y filtros dinámicos (RNF-PERF-001)"""
        query = select(ProductModel).where(ProductModel.is_active == True)
        
        if categoria:
            query = query.where(ProductModel.category == categoria)
        if marca:
            query = query.where(ProductModel.brand == marca)
        if precio_min is not None:
            query = query.where(ProductModel.price_public >= precio_min)
        if precio_max is not None:
            query = query.where(ProductModel.price_public <= precio_max)
        if in_stock is True:
            query = query.where((ProductModel.stock - ProductModel.reserved_stock) > 0)
            
        query = query.offset(skip).limit(limit)
        results = self.session.exec(query).all()
        return [self._to_domain(p) for p in results]

    def get_by_id(self, id: UUID) -> Optional[Product]:
        product = self.session.get(ProductModel, id)
        return self._to_domain(product) if product else None

    def save(self, product: Product) -> None:
        existing = self.session.exec(
            select(ProductModel).where(ProductModel.id == product.id)
        ).first()
        if existing:
            existing.name = product.name
            existing.slug = product.slug
            existing.category = product.category
            existing.brand = product.brand
            existing.description = product.description
            existing.image_url = product.image_url
            existing.price_public = product.price_public
            existing.stock = product.stock
            existing.reserved_stock = product.reserved_stock
            existing.is_active = product.is_active
            existing.is_featured = product.is_featured
            existing.specs = product.specs
            existing.image_gallery = product.image_gallery
            existing.sku = product.sku
            existing.stock_visible_mode = getattr(product, 'stock_visible_mode', 'EXACT')
            self.session.add(existing)
        else:
            model = ProductModel.from_domain(product)
            self.session.add(model)
        self.session.commit()

    def get_by_slug(self, slug: str) -> Optional[Product]:
        query = select(ProductModel).where(ProductModel.slug == slug)
        result = self.session.exec(query).first()
        return self._to_domain(result) if result else None

    def search(self, query: str) -> List[Product]:
        """Búsqueda full-text usando índices GIN en PostgreSQL"""
        search_term = f"%{query.lower()}%"
        stmt = select(ProductModel).where(
            ProductModel.is_active == True,
            (
                ProductModel.name.ilike(search_term) |
                ProductModel.description.ilike(search_term) |
                ProductModel.brand.ilike(search_term)
            )
        ).limit(20)
        results = self.session.exec(stmt).all()
        return [self._to_domain(p) for p in results]

    def get_category_counts(self) -> dict[str, int]:
        """Agregación nativa en BD para evitar scans completos"""
        stmt = select(
            ProductModel.category, 
            func.count(ProductModel.id)
        ).where(ProductModel.is_active == True).group_by(ProductModel.category)
        results = self.session.exec(stmt).all()
        return {cat: count for cat, count in results}

    # Métodos nuevos requeridos por Landing Page (RF-CAT-004)
    def list_featured(self, limit: int = 8) -> List[Product]:
        stmt = select(ProductModel).where(
            ProductModel.is_active == True,
            ProductModel.is_featured == True
        ).limit(limit)
        results = self.session.exec(stmt).all()
        return [self._to_domain(p) for p in results]

    def list_recent(self, limit: int = 8) -> List[Product]:
        stmt = select(ProductModel).where(
            ProductModel.is_active == True
        ).order_by(ProductModel.created_at.desc()).limit(limit)
        results = self.session.exec(stmt).all()
        return [self._to_domain(p) for p in results]

    def get_by_sku(self, sku: str) -> Optional[Product]:
        """
        Obtiene un producto por su SKU.
        Usado por la integración del distribuidor (MOD-DIS-01).
        """
        stmt = select(ProductModel).where(ProductModel.sku == sku)
        result = self.session.exec(stmt).first()
        return self._to_domain(result) if result else None