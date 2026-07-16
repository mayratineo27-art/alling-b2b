from fastapi import APIRouter, Depends
from uuid import UUID
from typing import List
from app.schemas.kit import KitResponseSchema
from app.services.kit_service import KitService
from app.core.deps import get_kit_service

from app.infra.repositories.in_memory_kit_repository import InMemoryKitRepository

router = APIRouter()
mock_kit_repo = InMemoryKitRepository()

@router.get("", response_model=List[KitResponseSchema])
@router.get("/", response_model=List[KitResponseSchema], include_in_schema=False)
def listar_kits(
    service: KitService = Depends(get_kit_service)
):
    """
    Obtiene todos los Kits calculando dinámicamente sus precios y stocks efectivos.
    
    @sdd-endpoint GET /kits
    @sdd-rf RF-CAT-006
    """
    return service.list_kits()

@router.get("/{id}", response_model=KitResponseSchema)
@router.get("/{id}/", response_model=KitResponseSchema, include_in_schema=False)
def obtener_detalle_kit(
    id: UUID,
    service: KitService = Depends(get_kit_service)
):
    """
    Obtiene el detalle de un Kit pre-armado calculando dinámicamente su precio y stock.
    
    @sdd-endpoint GET /kits/{id}
    @sdd-rf RF-CAT-006
    """
    return service.get_kit_detail(id)
