import pyotp

class MFAService:
    @staticmethod
    def generar_secreto() -> str:
        """Genera un nuevo secreto base32 para TOTP"""
        return pyotp.random_base32()
        
    @staticmethod
    def verificar_totp(secreto: str, codigo: str) -> bool:
        """Verifica que el código TOTP sea válido para el secreto dado"""
        if not secreto or not codigo:
            return False
        totp = pyotp.TOTP(secreto)
        return totp.verify(codigo)
