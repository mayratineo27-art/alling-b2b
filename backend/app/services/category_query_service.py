from typing import List
from app.domain.repositories.product_repository import IProductRepository
from app.schemas.catalogo import CategoryResponseSchema

class CategoryQueryService:
    def __init__(self, product_repo: IProductRepository):
        self.product_repo = product_repo
        
    def get_categories_with_count(self) -> List[CategoryResponseSchema]:
        """
        Opción A (SDD): Retorna únicamente las categorías oficiales registradas en CategoryModel.
        Calcula el conteo de productos activos asociados a cada categoría oficial.
        """
        counts = self.product_repo.get_category_counts()
        
        # Coincidencias case-insensitive / trimmed para conteo
        counts_normalized = {k.lower().strip(): v for k, v in counts.items() if k}

        result: List[CategoryResponseSchema] = []
        try:
            from sqlmodel import select
            from app.models.category import CategoryModel
            if hasattr(self.product_repo, 'session') and self.product_repo.session:
                category_models = self.product_repo.session.exec(
                    select(CategoryModel).order_by(CategoryModel.position.asc(), CategoryModel.name.asc())
                ).all()

                for cat in category_models:
                    cnt = counts_normalized.get(cat.name.lower().strip(), 0)
                    result.append(
                        CategoryResponseSchema(
                            nombre=cat.name,
                            count=cnt,
                            image_url=cat.image_url,
                            position=cat.position
                        )
                    )
                return result
        except Exception:
            pass

        # Fallback si no hay DB de categorías configurada
        result = [
            CategoryResponseSchema(nombre=cat, count=cnt, image_url=None, position=0)
            for cat, cnt in counts.items()
        ]
        result.sort(key=lambda x: (x.position, x.nombre))
        return result
