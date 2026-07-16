from app.domain.formato_unico import FormatoUnicoState
from typing import Dict, Any

class UIConfigService:
    def get_config_for_state(self, state: FormatoUnicoState) -> Dict[str, Any]:
        config_map = {
            FormatoUnicoState.BORRADOR: {
                "color": "blue",
                "mensaje": "Edición abierta",
                "icono": "edit-icon"
            },
            FormatoUnicoState.COTIZACION: {
                "color": "yellow",
                "mensaje": "En revisión",
                "icono": "clock-icon"
            },
            FormatoUnicoState.CONSULTA: {
                "color": "purple",
                "mensaje": "Consulta enviada",
                "icono": "send-icon"
            },
            FormatoUnicoState.APROBADO: {
                "color": "green",
                "mensaje": "Aprobado",
                "icono": "check-icon"
            },
            FormatoUnicoState.RECHAZADO: {
                "color": "red",
                "mensaje": "Rechazado",
                "icono": "x-icon"
            },
            FormatoUnicoState.EXPIRADA: {
                "color": "gray",
                "mensaje": "Expirada",
                "icono": "slash-icon"
            }
        }
        return config_map.get(state, {
            "color": "gray",
            "mensaje": "Desconocido",
            "icono": "help-icon"
        })
