import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Configuración básica del logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"
)
logger = logging.getLogger("alling_b2b.api")

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware para observabilidad.
    Captura method, path, status_code y duration_ms.
    Aplica Zero Trust filtrando rutas sensibles.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Identificar rutas sensibles para evitar registro de datos confidenciales
        path_lower = request.url.path.lower()
        is_sensitive = any(keyword in path_lower for keyword in ["auth", "login", "password", "token"])

        try:
            response = await call_next(request)
            process_time_ms = (time.time() - start_time) * 1000

            log_msg = f"{request.method} {request.url.path} - Status: {response.status_code} - {process_time_ms:.2f}ms"

            if is_sensitive:
                log_msg += " [SENSITIVE ROUTE - REDACTED HEADERS/BODY]"

            logger.info(log_msg)
            return response
            
        except Exception as e:
            process_time_ms = (time.time() - start_time) * 1000
            logger.error(f"{request.method} {request.url.path} - Status: 500 - {process_time_ms:.2f}ms - Error: {str(e)}")
            raise e
