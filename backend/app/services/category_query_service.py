from typing import List
from app.domain.repositories.product_repository import IProductRepository
from app.schemas.catalogo import CategoryResponseSchema

class CategoryQueryService:
    def __init__(self, product_repo: IProductRepository):
        self.product_repo = product_repo
        
    def get_categories_with_count(self) -> List[CategoryResponseSchema]:
        counts = self.product_repo.get_category_counts()
        result = [
            CategoryResponseSchema(nombre=cat, count=cnt)
            for cat, cnt in counts.items()
        ]
        # Opcional: ordenar alfabéticamente
        result.sort(key=lambda x: x.nombre)
        return result
