from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.services.favorite_service import FavoriteService
from pydantic import BaseModel
from typing import List
from uuid import UUID
from app.api.deps import get_db
from sqlmodel import Session
from app.core.deps import get_product_query_service
from app.services.product_query_service import ProductQueryService
from app.schemas.catalogo import ProductResponseSchema

router = APIRouter()
favorite_service = FavoriteService()

class FavoriteResponse(BaseModel):
    product_ids: List[str]
    products: List[ProductResponseSchema] = []

@router.post("/{producto_id}", status_code=200)
def add_favorite(
    producto_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Agrega un producto a la lista de favoritos del usuario autenticado.
    
    @sdd-endpoint POST /favoritos/{producto_id}
    @sdd-rf RF-CAT-006
    """
    try:
        favorite_service.add_favorite(db, user_id, producto_id)
        return {"message": "Agregado a favoritos"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{producto_id}", status_code=200)
def remove_favorite(
    producto_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remueve un producto de la lista de favoritos del usuario autenticado.
    
    @sdd-endpoint DELETE /favoritos/{producto_id}
    @sdd-rf RF-CAT-006
    """
    try:
        favorite_service.remove_favorite(db, user_id, producto_id)
        return {"message": "Removido de favoritos"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=FavoriteResponse)
@router.get("/", response_model=FavoriteResponse, include_in_schema=False)
def list_favorites(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    product_query_service: ProductQueryService = Depends(get_product_query_service)
):
    """
    Lista todos los productos favoritos del usuario autenticado.
    
    @sdd-endpoint GET /favoritos
    @sdd-rf RF-CAT-006
    """
    try:
        product_ids = favorite_service.list_favorites(db, user_id)
        
        # Resolve full product details
        products = []
        for pid in product_ids:
            try:
                product = product_query_service.repo.get_by_id(UUID(pid))
                if product:
                    products.append(product)
            except Exception:
                pass
                
        return {"product_ids": product_ids, "products": products}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
