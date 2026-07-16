import pytest
from app.services.telegram_service import generar_url_consulta
import urllib.parse

def test_generar_url_consulta_correcta():
    sku = "SKU-12345"
    nombre = "Laptop Pro 15"
    qty = 2
    
    url = generar_url_consulta(sku, nombre, qty)
    
    # Payload esperado
    mensaje = f"Hola, quiero consultar la disponibilidad de:\nSKU: {sku}\nProducto: {nombre}\nCantidad: {qty}"
    encoded_mensaje = urllib.parse.quote(mensaje)
    
    assert url.startswith("https://t.me/")
    assert encoded_mensaje in url

from app.domain.exceptions import DomainException

def test_generar_url_masiva():
    from app.services.telegram_service import generar_url_masiva
    items = [
        {"sku": "SKU-1", "nombre": "Prod 1", "qty": 10},
        {"sku": "SKU-2", "nombre": "Prod 2", "qty": 5},
        {"sku": "SKU-3", "nombre": "Prod 3", "qty": 20},
    ]
    
    url = generar_url_masiva(items)
    
    assert url.startswith("https://t.me/")
    # Verificar que los SKUs están en el payload
    for item in items:
        assert urllib.parse.quote(item['sku']) in url
        
def test_generar_url_masiva_vacia():
    from app.services.telegram_service import generar_url_masiva
    with pytest.raises(DomainException):
        generar_url_masiva([])
