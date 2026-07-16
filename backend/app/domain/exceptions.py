"""Excepciones de dominio — capa pura sin dependencias de infraestructura."""

class DomainException(Exception):
    """Error de regla de negocio dentro del dominio."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

    def __str__(self) -> str:
        return self.message


class PaymentGatewayError(DomainException):
    def __init__(self, message: str, retry_allowed: bool = True, status_code: int = 400):
        super().__init__(message, status_code)
        self.retry_allowed = retry_allowed

