import pytest
import os
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from uuid import uuid4
from decimal import Decimal

from app.main import app
from app.services.payment_service import PaymentService
from app.domain.formato_unico import FormatoUnico, FormatoUnicoState
from app.api.endpoints.checkout import mock_fu_repo

client = TestClient(app)

@patch("app.services.payment_service.mercadopago.SDK")
def test_degradacion_graceful_timeout_mp(mock_sdk_class):
    """
    RNF-DIS-001: Si MercadoPago falla por timeout, el sistema no crashea (500),
    sino que retorna un JSON controlado con retry_allowed=True.
    """
    # Configuramos el mock para lanzar un TimeoutError simulado al llamar al SDK
    mock_preference = MagicMock()
    # Mercado Pago SDK structure: sdk.preference().create()
    mock_preference.create.side_effect = TimeoutError("Connection to MercadoPago timed out")
    
    mock_sdk_instance = MagicMock()
    mock_sdk_instance.preference.return_value = mock_preference
    mock_sdk_class.return_value = mock_sdk_instance
    
    # Preparamos un FU
    fu_id = uuid4()
    fu = FormatoUnico(id=fu_id, customer_id=uuid4(), state=FormatoUnicoState.COTIZACION, items=[])
    mock_fu_repo.save(fu)
    
    # Creamos un endpoint temporal en checkout para probar crear_preferencia_pago o probamos el endpoint real
    # Nuestro sistema expone POST /checkout/, que usa PaymentService.
    # Pero probar POST /checkout/ implica mockear muchas cosas. Mejor probamos directamente el PaymentService y su manejo de errores o creamos un endpoint mock.
    # Si el requerimiento dice "retornando un JSON controlado con retry_allowed=True", significa que el controlador/endpoint maneja la excepción.
    # Vamos a crear una excepción custom de dominio PaymentGatewayError y la manejaremos en un exception_handler de FastAPI, o directamente en el endpoint POST /checkout/{fu_id}/pay.
    
    # El test real enviaría un POST al endpoint de pago (asumamos POST /checkout/{fu_id}/pay o POST /checkout/ con el fu_id)
    # Por ahora vamos a asumir que usamos el servicio y verificamos que levanta la excepción correcta, 
    # y luego en el router /checkout/ probamos el endpoint.
    
    response = client.post("/checkout/", json={
        "fu_id": str(fu_id),
        "billing_id": "DNI-12345678",
        "address": "Calle 123"
    })
    
    assert response.status_code == 503
    data = response.json()
    assert data.get("retry_allowed") is True
