import urllib.parse
from app.core.config import settings

def generar_url_consulta(sku: str, nombre: str, qty: int) -> str:
    """
    Genera un deep link para Telegram con el payload pre-armado.
    """
    bot_username = settings.TELEGRAM_BOT_USERNAME
    mensaje = f"Hola, quiero consultar la disponibilidad de:\nSKU: {sku}\nProducto: {nombre}\nCantidad: {qty}"
    encoded_mensaje = urllib.parse.quote(mensaje)
    return f"https://t.me/{bot_username}?text={encoded_mensaje}"

from typing import List, Dict
from app.domain.exceptions import DomainException

def generar_url_masiva(items: List[Dict]) -> str:
    """
    Genera un deep link para Telegram con múltiples productos.
    """
    if not items:
        raise DomainException("La lista de ítems para consultar está vacía.")
        
    bot_username = settings.TELEGRAM_BOT_USERNAME
    lineas = ["Hola, quiero consultar la disponibilidad de los siguientes productos:"]
    
    for item in items:
        lineas.append(f"- SKU: {item['sku']}, Producto: {item['nombre']}, Cant: {item['qty']}")
        
    mensaje = "\n".join(lineas)
    
    if len(mensaje) > 3500:
        raise DomainException("Demasiados productos para una sola consulta. Por favor, reduce la lista.")
        
    encoded_mensaje = urllib.parse.quote(mensaje)
    return f"https://t.me/{bot_username}?text={encoded_mensaje}"
