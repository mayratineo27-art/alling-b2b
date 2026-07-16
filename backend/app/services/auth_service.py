import base64
import hashlib
import hmac
import secrets
import uuid
import jwt
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

SECRET_KEY = "super_secret_jwt_key_b2b"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 30

class AuthService:
    PASSWORD_ITERATIONS = 120000

    @staticmethod
    def crear_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> str:
        password_salt = salt or secrets.token_hex(16)
        derived_key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            password_salt.encode("utf-8"),
            AuthService.PASSWORD_ITERATIONS,
        )
        encoded_key = base64.urlsafe_b64encode(derived_key).decode("utf-8")
        return f"pbkdf2_sha256${AuthService.PASSWORD_ITERATIONS}${password_salt}${encoded_key}"

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        try:
            algorithm, iterations, password_salt, encoded_key = password_hash.split("$", 3)
            if algorithm != "pbkdf2_sha256":
                return False
            iterations_int = int(iterations)
            derived_key = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                password_salt.encode("utf-8"),
                iterations_int,
            )
            candidate = base64.urlsafe_b64encode(derived_key).decode("utf-8")
            return hmac.compare_digest(candidate, encoded_key)
        except (ValueError, TypeError):
            return False
        
    @staticmethod
    def decodificar_token(token: str) -> Dict[str, Any]:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    # ------------------------------------------------------------------
    # RF-AUT-009: Refresh token (renovación de sesión sin re-login)
    #
    # El access_token (JWT, 60 min) nunca se renueva a sí mismo — es
    # stateless por diseño (RN-AUT-004: RS256/HS256 corta duración). El
    # refresh_token es opaco (no JWT), de larga duración (30 días) y se
    # persiste HASHEADO (SHA-256) para poder revocarlo; el valor plaintext
    # solo existe en la cookie httpOnly del cliente, nunca en la BD.
    # ------------------------------------------------------------------

    @staticmethod
    def _hash_refresh_token(plaintext: str) -> str:
        return hashlib.sha256(plaintext.encode("utf-8")).hexdigest()

    @staticmethod
    def _as_utc(value: datetime) -> datetime:
        """Normaliza a datetime timezone-aware en UTC antes de comparar.
        Postgres (DateTime(timezone=True)) devuelve datetimes aware, pero
        SQLite (usado en tests) los devuelve naive para la misma columna —
        comparar un aware con un naive lanza TypeError en Python."""
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    @staticmethod
    def crear_refresh_token(db: Session, user_id: str) -> tuple[str, datetime]:
        """Genera y persiste un nuevo refresh token para user_id.
        Retorna (plaintext, expires_at). El plaintext se entrega una sola vez."""
        from app.models.refresh_token import RefreshToken

        plaintext = secrets.token_urlsafe(48)
        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        db_token = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=user_id,
            token_hash=AuthService._hash_refresh_token(plaintext),
            expires_at=expires_at,
        )
        db.add(db_token)
        db.commit()
        return plaintext, expires_at

    @staticmethod
    def rotar_refresh_token(db: Session, plaintext: str) -> Optional[tuple[str, str]]:
        """RN-AUT-004: valida un refresh token y lo ROTA (revoca el usado,
        emite uno nuevo) en vez de reutilizarlo indefinidamente — así, si un
        token robado se reutiliza tras la rotación legítima, se detecta como
        inválido (ya revocado) en vez de seguir siendo válido para siempre.
        Retorna (user_id, nuevo_plaintext) o None si es inválido/expirado/revocado.
        """
        from app.models.refresh_token import RefreshToken

        token_hash = AuthService._hash_refresh_token(plaintext)
        db_token = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

        if not db_token or db_token.revoked_at is not None:
            return None
        if AuthService._as_utc(db_token.expires_at) < datetime.now(timezone.utc):
            return None

        db_token.revoked_at = datetime.now(timezone.utc)
        db.add(db_token)
        db.commit()

        nuevo_plaintext, _ = AuthService.crear_refresh_token(db, db_token.user_id)
        return db_token.user_id, nuevo_plaintext

    # ------------------------------------------------------------------
    # RF-AUT-001: Upsert de usuario para login con Google
    # ------------------------------------------------------------------

    @staticmethod
    def get_or_create_google_user(
        db: Session,
        google_id: str,
        email: str,
        name: str,
        email_verified: bool,
    ):
        """
        Busca el usuario por google_id y, si no aparece, por email (cuenta
        creada antes por otro medio). Solo se vincula por email si Google
        confirma email_verified=True y la cuenta encontrada no tiene
        password_hash: una cuenta LOCAL/staff con contraseña nunca se
        adopta vía Google, o cualquiera con un Google account que declare
        (sin verificar) el correo de un admin podría heredar esa cuenta
        sin conocer su contraseña ni pasar MFA.

        El INSERT va protegido contra la carrera de doble clic/reintento:
        dos requests concurrentes pueden pasar el SELECT antes de que
        cualquiera haga commit; si el INSERT choca con el unique de
        email o google_id (IntegrityError), se hace rollback y se relee
        la fila que ganó la carrera en vez de propagar el 500.
        """
        from app.models.user import User

        email = email.strip().lower()

        user = db.query(User).filter(User.google_id == google_id).first()

        if not user and email_verified:
            candidato = db.query(User).filter(User.email == email).first()
            if candidato and not candidato.password_hash:
                candidato.google_id = candidato.google_id or google_id
                user = candidato
            elif candidato:
                raise ValueError(
                    f"Ya existe una cuenta con el correo {email} que usa "
                    "inicio de sesión local. Ingresa con tu contraseña."
                )

        if user:
            if not user.role:
                user.role = "CUSTOMER"
            if user.auth_provider != "GOOGLE":
                user.auth_provider = "GOOGLE"
            db.add(user)
            db.commit()
            db.refresh(user)
            return user

        nuevo_usuario = User(
            id=str(uuid.uuid4()),
            email=email,
            google_id=google_id,
            role="CUSTOMER",
            auth_provider="GOOGLE",
            name=name,
        )
        db.add(nuevo_usuario)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            ganador = (
                db.query(User)
                .filter((User.google_id == google_id) | (User.email == email))
                .first()
            )
            if not ganador or ganador.password_hash:
                raise
            return ganador

        db.refresh(nuevo_usuario)
        return nuevo_usuario

    @staticmethod
    def revocar_refresh_token(db: Session, plaintext: str) -> None:
        """RF-AUT-006 (logout): invalida el refresh token server-side, no
        solo la cookie del cliente (Zero Trust — no basta con "olvidar" el
        token en el navegador, debe dejar de ser válido en el servidor)."""
        from app.models.refresh_token import RefreshToken

        token_hash = AuthService._hash_refresh_token(plaintext)
        db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).update(
            {"revoked_at": datetime.now(timezone.utc)}
        )
        db.commit()
