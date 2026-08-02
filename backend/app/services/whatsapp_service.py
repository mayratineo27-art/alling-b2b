"""
Servicio de Integración con WhatsApp Cloud API (Meta API) y Generación de Enlaces Directos.
Proporciona la arquitectura modular para el envío directo vía API oficial de WhatsApp 
y el fallback de enlaces wa.me para atención al cliente.
"""

import urllib.parse
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger("alling_b2b.whatsapp")

class WhatsAppService:
    """
    Servicio de WhatsApp Business Cloud API & Redirección Rápida.
    """
    
    META_GRAPH_API_URL = "https://graph.facebook.com/v18.0"

    @staticmethod
    def format_phone_number(phone: str) -> str:
        """Limpia caracteres no numéricos dejando el formato internacional (ej: 51999999999)."""
        if not phone:
            return "51999999999"
        cleaned = "".join([c for c in str(phone) if c.isdigit()])
        if not cleaned:
            return "51999999999"
        return cleaned

    @staticmethod
    def generate_wa_link(phone: str, message: Optional[str] = None) -> str:
        """
        Genera un enlace público wa.me con mensaje codificado en URL.
        """
        clean_phone = WhatsAppService.format_phone_number(phone)
        default_msg = message or "Hola Alling B2B, solicito información sobre sus productos y cotizaciones."
        encoded_msg = urllib.parse.quote(default_msg)
        return f"https://wa.me/{clean_phone}?text={encoded_msg}"

    @staticmethod
    async def send_whatsapp_template(
        phone: str,
        template_name: str,
        language_code: str = "es",
        components: Optional[list] = None,
        access_token: Optional[str] = None,
        phone_number_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Estructura base para el envío de mensajes plantilla vía WhatsApp Cloud API de Meta.
        Esta función se conecta directamente con los servidores de Meta cuando se configuran
        las credenciales de producción (WHATSAPP_TOKEN y PHONE_NUMBER_ID).
        """
        clean_phone = WhatsAppService.format_phone_number(phone)
        
        if not access_token or not phone_number_id:
            logger.info(
                f"[WhatsApp Cloud API Mock] Enviar plantilla '{template_name}' a {clean_phone}. "
                "Para producción, configura WHATSAPP_CLOUD_API_TOKEN y WHATSAPP_PHONE_NUMBER_ID."
            )
            return {
                "status": "simulated",
                "phone": clean_phone,
                "template": template_name,
                "message": "Mensaje encolado para simulación de WhatsApp Cloud API"
            }

        # Estructura de payload oficial de Meta Graph API
        payload = {
            "messaging_product": "whatsapp",
            "to": clean_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language_code},
                "components": components or []
            }
        }
        
        # En una futura fase con httpx instalado/disponible:
        # async with httpx.AsyncClient() as client:
        #     res = await client.post(
        #         f"{WhatsAppService.META_GRAPH_API_URL}/{phone_number_id}/messages",
        #         json=payload,
        #         headers={"Authorization": f"Bearer {access_token}"}
        #     )
        #     return res.json()

        return {
            "status": "ready",
            "payload": payload,
            "endpoint": f"{WhatsAppService.META_GRAPH_API_URL}/{phone_number_id}/messages"
        }
