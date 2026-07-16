from fastapi import APIRouter, Depends
from typing import List
from app.schemas.catalogo import CategoryResponseSchema
from app.services.category_query_service import CategoryQueryService
from app.core.deps import get_category_query_service

router = APIRouter()

@router.get("", response_model=List[CategoryResponseSchema])
@router.get("/", response_model=List[CategoryResponseSchema], include_in_schema=False)
def obtener_categorias_con_conteo(
    service: CategoryQueryService = Depends(get_category_query_service)
):
    """
    Retorna la lista de categorías con su respectivo conteo de productos activos.
    
    @sdd-endpoint GET /categorias
    @sdd-rf RF-CAT-005
    """
    return service.get_categories_with_count()
