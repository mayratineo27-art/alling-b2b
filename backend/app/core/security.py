from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
import jwt
from app.services.auth_service import AuthService

class OAuth2PasswordBearerCookie(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> Optional[str]:
        original_auto_error = self.auto_error
        self.auto_error = False
        token = await super().__call__(request)
        self.auto_error = original_auto_error

        if token:
            return token

        cookie_token = request.cookies.get("session_token")
        if cookie_token:
            return cookie_token
            
        if self.auto_error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return None

oauth2_scheme = OAuth2PasswordBearerCookie(tokenUrl="token")
oauth2_scheme_optional = OAuth2PasswordBearerCookie(tokenUrl="token", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    """Valida token y retorna el user_id. Para endpoints privados."""
    try:
        payload = AuthService.decodificar_token(token)
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        mfa_validated = payload.get("mfa_validated", False)
        
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
            
        if role == "ADMIN" and not mfa_validated:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="MFA requerido para ADMIN")
            
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

def get_current_user_optional(token: str = Depends(oauth2_scheme_optional)) -> str | None:
    """Intenta extraer user_id, si falla o no hay token retorna None. Para checkout mixto."""
    if not token:
        return None
    try:
        payload = AuthService.decodificar_token(token)
        return payload.get("sub")
    except jwt.PyJWTError:
        return None
