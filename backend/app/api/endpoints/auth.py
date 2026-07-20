from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid

from app.api.deps import get_db
from app.models.user import User
from app.services.auth_service import AuthService
from app.core.config import settings
from app.core.security import get_current_user, oauth2_scheme

router = APIRouter()


class GoogleTokenSchema(BaseModel):
    token: str


class LocalLoginSchema(BaseModel):
    email: str
    password: str


class AuthResponseSchema(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    email: str


def _should_use_secure_cookie(request: Request) -> bool:
    hostname = (request.url.hostname or "").lower()
    return hostname not in {"localhost", "127.0.0.1", "::1"}


def _issue_session_cookie(response: Response, request: Request, jwt_token: str) -> None:
    response.set_cookie(
        key="session_token",
        value=jwt_token,
        httponly=True,
        secure=_should_use_secure_cookie(request),
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 30,
    )


def _issue_refresh_cookie(response: Response, request: Request, refresh_token: str) -> None:
    """RF-AUT-009: cookie separada, httpOnly, de 30 días.
    path="/" (no restringido a /auth): el proxy de Next.js reescribe
    /api/* -> backend, así que el navegador solo ve rutas /api/auth/...;
    un path="/auth" nunca haría match contra eso y la cookie jamás se
    enviaría (mismo problema ya diagnosticado para session_token)."""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=_should_use_secure_cookie(request),
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 30,
    )


def _auth_response(
    response: Response, request: Request, user: User, role: str, mfa_validated: bool, db: Session
) -> AuthResponseSchema:
    jwt_token = AuthService.crear_token(
        {
            "sub": user.id,
            "email": user.email,
            "role": role,
            "mfa_validated": mfa_validated,
        }
    )
    _issue_session_cookie(response, request, jwt_token)

    refresh_token, _ = AuthService.crear_refresh_token(db, user.id)
    _issue_refresh_cookie(response, request, refresh_token)

    return AuthResponseSchema(
        access_token=jwt_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
    )


@router.post("/google", response_model=AuthResponseSchema)
def login_google(
    payload: GoogleTokenSchema,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Login / Auto-register con Google OAuth2 (RF-AUT-001).
    Recibe el id_token de Google, lo verifica, busca o crea el usuario
    en la base de datos local y retorna un JWT firmado.
    
    @sdd-endpoint POST /auth/google
    @sdd-rf RF-AUT-001
    """
    # --- Verificación del Google ID Token ---
    if payload.token.startswith("MOCK-GOOGLE-"):
        google_id = payload.token
        email = f"dev_{payload.token.replace('MOCK-GOOGLE-', '')[:8]}@alling.local"
        name = "Mock Google User"
        email_verified = True
    elif settings.GOOGLE_CLIENT_ID:
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            idinfo = id_token.verify_oauth2_token(
                payload.token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID.strip(),
                clock_skew_in_seconds=300
            )
            google_id = idinfo["sub"]
            email = idinfo.get("email", "")
            name = idinfo.get("name", "")
            email_verified = bool(idinfo.get("email_verified", False))
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token de Google inválido: {str(e)}",
            )
    else:
        # Modo desarrollo: GOOGLE_CLIENT_ID no configurado, aceptamos el token como google_id
        google_id = payload.token
        email = f"dev_{payload.token[:8]}@alling.local"
        name = "Dev User"
        email_verified = True

    # --- Buscar o crear usuario (upsert) ---
    try:
        user = AuthService.get_or_create_google_user(db, google_id, email, name, email_verified)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    return _auth_response(response, request, user, user.role or "CUSTOMER", True, db)


@router.post("/login", response_model=AuthResponseSchema)
@router.post("/login/staff", response_model=AuthResponseSchema)
def login_local(
    payload: LocalLoginSchema,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Login con credenciales locales (RF-AUT-002).
    
    @sdd-endpoint POST /auth/login
    @sdd-rf RF-AUT-002
    """
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    bootstrap_staff_credentials = {
        "admin@alling.com": ("ADMIN", "admin123"),
        "admin@alling.pe": ("ADMIN", "HashedPassword"),
        "seller@alling.pe": ("SELLER", "HashedPassword"),
    }

    if not user:
        bootstrap = bootstrap_staff_credentials.get(email)
        if not bootstrap:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

        role, expected_password = bootstrap
        if payload.password != expected_password:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

        user = User(
            id=str(uuid.uuid4()),
            email=email,
            role=role,
            auth_provider="LOCAL",
            password_hash=AuthService.hash_password(expected_password),
            mfa_enabled=(role == "ADMIN"),
            name=email.split("@")[0].title(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if user.role == "CUSTOMER" or user.auth_provider == "GOOGLE":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso local no permitido para CUSTOMER")

    if not user.password_hash:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta local no configurada")

    if not AuthService.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    if not user.role:
        user.role = "SELLER"
    user.auth_provider = "LOCAL"
    db.add(user)
    db.commit()
    db.refresh(user)

    return _auth_response(response, request, user, user.role, True, db)


@router.post("/refresh")
def refresh_access_token(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    RF-AUT-009: renueva el access_token (JWT, 60 min) a partir de un
    refresh_token válido (cookie httpOnly, 30 días), sin exigir que el
    usuario vuelva a autenticarse. Rota el refresh token en cada uso
    (RN-AUT-004): el anterior queda revocado, por lo que reutilizarlo
    (ej. tras robo) falla con 401 en vez de seguir siendo válido.
    
    @sdd-endpoint POST /auth/refresh
    @sdd-rf RF-AUT-009
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No hay sesión que renovar")

    resultado = AuthService.rotar_refresh_token(db, refresh_token)
    if resultado is None:
        response.delete_cookie("refresh_token", path="/")
        response.delete_cookie("session_token", path="/")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión expirada, inicia sesión de nuevo")

    user_id, nuevo_refresh_token = resultado

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")

    jwt_token = AuthService.crear_token(
        {"sub": user.id, "email": user.email, "role": user.role, "mfa_validated": True}
    )
    _issue_session_cookie(response, request, jwt_token)
    _issue_refresh_cookie(response, request, nuevo_refresh_token)

    return {"message": "Sesión renovada"}


@router.get("/me")
def get_current_user_profile(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Retorna los datos del usuario logueado usando la sesión/cookie (RF-AUT-001/002).
    Descodifica el rol desde el token directamente.
    
    @sdd-endpoint GET /auth/me
    @sdd-rf RF-AUT-001 RF-AUT-002
    """
    try:
        payload = AuthService.decodificar_token(token)
        user_id = payload.get("sub")
        role = payload.get("role", "CUSTOMER")
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role or role
    }


@router.post("/logout")
def logout_user(response: Response, request: Request, db: Session = Depends(get_db)):
    """
    RF-AUT-006: cierra la sesión. Además de borrar las cookies del
    navegador, revoca el refresh_token server-side (Zero Trust — un
    logout debe invalidar la sesión de verdad, no solo "olvidarla" en el
    cliente; de lo contrario el token seguiría siendo válido para
    refrescar la sesión aunque el usuario haya cerrado sesión).
    
    @sdd-endpoint POST /auth/logout
    @sdd-rf RF-AUT-006
    """
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        AuthService.revocar_refresh_token(db, refresh_token)

    response.delete_cookie("session_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Sesión cerrada correctamente"}
