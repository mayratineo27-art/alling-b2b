import secrets

class TokenService:
    @staticmethod
    def generate_order_token() -> str:
        """
        Genera un token opaco y seguro para tracking de órdenes de GUEST.
        """
        return secrets.token_urlsafe(32)
