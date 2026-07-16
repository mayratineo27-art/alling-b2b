from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class UserBillingDataSchema(BaseModel):
    document_type: str
    document_number: str
    address: str

class UserQueryService:
    @staticmethod
    def obtener_datos_facturacion(user_id: str) -> UserBillingDataSchema:
        # Mock de datos de facturación para autocompletar (RF-CHK-009)
        return UserBillingDataSchema(
            document_type="RUC",
            document_number="20123456789",
            address="Av. Siempre Viva 123, Lima"
        )

from app.core.security import get_current_user
from fastapi import Depends

@router.get("/me/facturacion", response_model=UserBillingDataSchema)
def get_user_billing_data(user_id: str = Depends(get_current_user)):
    """
    Retorna los datos de facturación pre-llenados del usuario autenticado.
    (Mock: en la vida real requeriría token y extraería el user_id)
    
    @sdd-endpoint GET /usuarios/me/facturacion
    @sdd-rf RF-CHK-009
    """
    service = UserQueryService()
    # Hardcodeado para propósitos de demostración pero usando el id real
    return service.obtener_datos_facturacion(user_id)
