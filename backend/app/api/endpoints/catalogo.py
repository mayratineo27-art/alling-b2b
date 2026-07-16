from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from app.schemas.catalogo import ProductResponseSchema, ProductDetailSchema, LandingResponseSchema
from app.services.product_query_service import ProductQueryService
from app.infra.repositories.in_memory_product_repository import InMemoryProductRepository
from app.core.deps import get_product_query_service

router = APIRouter()
mock_repo = InMemoryProductRepository()

@router.get("/landing", response_model=LandingResponseSchema)
def obtener_landing(
    service: ProductQueryService = Depends(get_product_query_service)
):
    """
    Retorna datos agrupados para Landing Page (RF-CAT-004).
    Usa métodos optimizados del repositorio SQLModel, no slicing artificial.
    
    @sdd-endpoint GET /catalogo/landing
    @sdd-rf RF-CAT-004
    """
    return service.get_landing_data()

@router.get("", response_model=List[ProductResponseSchema])
@router.get("/", response_model=List[ProductResponseSchema], include_in_schema=False)
def listar_productos(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    categoria: Optional[str] = Query(None),
    marca: Optional[str] = Query(None),
    precio_min: Optional[float] = Query(None),
    precio_max: Optional[float] = Query(None),
    in_stock: Optional[bool] = Query(None),
    service: ProductQueryService = Depends(get_product_query_service)
):
    """Lista productos con filtros (RF-CAT-001 + RNF-PERF-001)
    
    @sdd-endpoint GET /catalogo
    @sdd-rf RF-CAT-001 RNF-PERF-001
    """
    return service.list_products(
        skip=skip, limit=limit, categoria=categoria, marca=marca,
        precio_min=precio_min, precio_max=precio_max, in_stock=in_stock
    )

@router.get("/buscar/", response_model=List[ProductResponseSchema])
def buscar_productos(
    q: str = Query(..., description="Término de búsqueda"),
    service: ProductQueryService = Depends(get_product_query_service)
):
    """Búsqueda full-text (RF-CAT-003)
    
    @sdd-endpoint GET /catalogo/buscar
    @sdd-rf RF-CAT-003
    """
    if len(q) < 3:
        raise HTTPException(status_code=400, detail="La consulta debe tener al menos 3 caracteres")
    return service.search(q)

@router.get("/{slug}/", response_model=ProductDetailSchema)
def obtener_detalle_producto(
    slug: str,
    service: ProductQueryService = Depends(get_product_query_service)
):
    """Detalle por slug (RF-CAT-002)
    
    @sdd-endpoint GET /catalogo/{slug}
    @sdd-rf RF-CAT-002
    """
    return service.get_by_slug(slug)