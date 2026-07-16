import time
from typing import Dict
from app.domain.exceptions import DomainException

class DistributorAuthService:
    def __init__(self):
        # Almacenamiento en memoria para el mock
        # En producción se usaría Redis con un TTL
        self._nonces: Dict[str, float] = {}
        self.window_seconds = 300  # 5 minutos
        
    def validar_nonce(self, nonce: str) -> None:
        """
        Valida que un nonce no haya sido utilizado recientemente.
        Evita ataques de Replay (RNF-SEC-004).
        """
        current_time = time.time()
        
        # Limpiar nonces expirados para no llenar la memoria en este mock
        keys_to_delete = [k for k, v in self._nonces.items() if current_time - v > self.window_seconds]
        for k in keys_to_delete:
            del self._nonces[k]
            
        if nonce in self._nonces:
            raise DomainException(message="Nonce duplicado o expirado (Replay Attack detectado)", status_code=409)
            
        self._nonces[nonce] = current_time

# Singleton para pruebas
distributor_auth_service = DistributorAuthService()
