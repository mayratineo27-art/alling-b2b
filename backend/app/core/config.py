from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    USE_MOCK_DB: bool = True
    DATABASE_URL: Optional[str] = None
    
    # Credenciales de API de Supabase (Para futuros servicios como Auth o Storage)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    
    TELEGRAM_BOT_USERNAME: str = "allingtechnology"
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None

    # Mercado Pago / Webhooks / Distribuidor: antes se leían con os.getenv(),
    # que solo ve variables de entorno reales del proceso — NUNCA lee
    # backend/.env (eso solo lo parsea esta clase Settings). Por eso
    # MP_ACCESS_TOKEN y WEBHOOK_SECRET quedaban silenciosamente vacíos sin
    # importar cuántas veces se reiniciara el backend.
    MP_ACCESS_TOKEN: str = "TEST-mock-token"
    MP_SANDBOX: bool = True
    WEBHOOK_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    DISTRIBUTOR_API_KEY: str = "dist-api-key-test"
    DISTRIBUTOR_SECRET: str = "test-distributor-secret-key"

    @model_validator(mode='after')
    def validate_supabase_credentials(self) -> 'Settings':
        if not self.USE_MOCK_DB:
            if not self.SUPABASE_URL or not (self.SUPABASE_ANON_KEY or self.SUPABASE_KEY):
                raise ValueError("Las variables SUPABASE_URL y SUPABASE_ANON_KEY (o SUPABASE_KEY) son requeridas cuando USE_MOCK_DB es False.")

        if not self.SUPABASE_KEY and self.SUPABASE_ANON_KEY:
            self.SUPABASE_KEY = self.SUPABASE_ANON_KEY
        return self

settings = Settings()
