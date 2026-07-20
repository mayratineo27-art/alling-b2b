from uuid import UUID
from typing import Optional
from decimal import Decimal
from app.domain.repositories.kit_repository import IKitRepository
from app.domain.repositories.product_repository import IProductRepository
from app.schemas.kit import KitResponseSchema, KitComponentSchema
from app.domain.exceptions import DomainException

class KitService:
    def __init__(self, kit_repo: IKitRepository, product_repo: IProductRepository):
        self.kit_repo = kit_repo
        self.product_repo = product_repo
        
    def _build_detail_schema(self, kit, products_map: dict = None) -> KitResponseSchema:
        precio_total = Decimal("0")
        stock_disponible = float('inf')
        componentes_schema = []
        
        for comp in kit.components:
            product = None
            if products_map and comp.product_id in products_map:
                product = products_map[comp.product_id]
            else:
                product = self.product_repo.get_by_id(comp.product_id)
                
            if not product:
                raise DomainException(message=f"Producto {comp.product_id} no encontrado en catálogo", status_code=409)
            
            # Calcular precio
            precio_total += product.price_public * comp.quantity
            
            # Calcular stock (stock del producto // cantidad necesaria por kit)
            stock_posible = product.stock // comp.quantity if comp.quantity > 0 else 0
            if stock_posible < stock_disponible:
                stock_disponible = stock_posible
                
            componentes_schema.append(KitComponentSchema(
                product_id=product.id,
                name=product.name,
                quantity=comp.quantity
            ))
            
        if stock_disponible == float('inf'):
            stock_disponible = 0
            
        return KitResponseSchema(
            id=kit.id,
            name=kit.name,
            description=kit.description,
            image_url=kit.image_url,
            components=componentes_schema,
            precio_total=precio_total,
            stock_disponible=int(stock_disponible)
        )

    def get_kit_detail(self, kit_id: UUID) -> KitResponseSchema:
        kit = self.kit_repo.get_by_id(kit_id)
        if not kit:
            raise DomainException(message="Kit no encontrado", status_code=404)
        return self._build_detail_schema(kit)

    def list_kits(self) -> list[KitResponseSchema]:
        """Obtiene todos los kits calculando dinámicamente sus precios y stocks."""
        kits = self.kit_repo.list_all()
        
        # Pre-cargar productos activos para evitar N+1 query problem
        try:
            active_products = self.product_repo.list_all(limit=200)
            products_map = {p.id: p for p in active_products}
        except Exception:
            products_map = {}

        result = []
        for kit in kits:
            try:
                detail = self._build_detail_schema(kit, products_map)
                result.append(detail)
            except DomainException:
                # Si un componente falla, omitimos el kit
                pass
        return result
