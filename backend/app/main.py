from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Routers
from app.api.endpoints import (
    formato_unico, dashboard, catalogo, kits, categorias,
    checkout, webhooks, usuarios, favoritos, auth, orders,
    seller, admin, system, consultas, cotizaciones, distribuidor,
    notifications
)

# Core & Infra
from app.domain.exceptions import DomainException, PaymentGatewayError
from app.core.middleware import LoggingMiddleware
from app.db.database import engine, Base
from sqlmodel import SQLModel

# Registrar modelos (Crucial para que SQLAlchemy los conozca al crear tablas)
import app.models.user          
import app.models.formato_unico  
import app.models.formato_unico_item
import app.models.order         
import app.models.product       # Importado correctamente
import app.models.kit
import app.models.category
import app.models.system_config
import app.models.favorite

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida: Inicia Scheduler al arrancar, lo detiene al cerrar"""
    # Startup
    Base.metadata.create_all(bind=engine)
    SQLModel.metadata.create_all(bind=engine)
    yield
    # Shutdown (opcional: limpiar jobs si es necesario)

app = FastAPI(
    title="Alling B2B API",
    version="1.2.0",
    lifespan=lifespan,
    # El proxy de Next.js (rewrites con :path*) siempre quita el "/" final antes
    # de reenviar al backend. Con redirect_slashes=True (default), FastAPI
    # respondía 307 agregando el slash, pero con Location apuntando al host
    # real del backend (127.0.0.1:8000) en vez de localhost:3000: el navegador
    # sigue ese redirect como origen distinto y pierde la cookie httpOnly de
    # sesión. Se desactiva aquí; los routers afectados registran su ruta raíz
    # sin slash ("") para que nunca haga falta redirigir.
    redirect_slashes=False,
)

# Middlewares Globales
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Desarrollo local
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Producción Vercel (DEC-021)
        "https://alling-b2b.vercel.app",
        "https://alling-b2b-git-main-ales-projects-5079a085.vercel.app",
        "https://alling-b2b-fnqesvtz1-ales-projects-5079a085.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

# Rate Limiting Optimizado (RNF-SEC-008)
import time
_rate_limit_store = {}

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    if request.url.path.startswith("/productos"):
        client_ip = request.client.host if request.client else "127.0.0.1"
        current_time = int(time.time())
        window = current_time // 60 
        key = f"{client_ip}:{window}"
        count = _rate_limit_store.get(key, 0)
        
        if count >= 100:
            return JSONResponse(status_code=429, content={"detail": "Too Many Requests"})
            
        _rate_limit_store[key] = count + 1

    response = await call_next(request)
    return response

# Security Headers (RNF-SEC-007)
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY" # Agregado para Zero Trust
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin" # Agregado
    return response

# Exception Handlers Centralizados
@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException):
    msg = getattr(exc, "message", str(exc))
    status_code = getattr(exc, "status_code", 400)
    return JSONResponse(status_code=status_code, content={"detail": msg})

@app.exception_handler(PaymentGatewayError)
async def payment_gateway_exception_handler(request: Request, exc: PaymentGatewayError):
    return JSONResponse(
        status_code=503,
        content={"error": exc.message, "retry_allowed": exc.retry_allowed}
    )

# Registro de Routers
app.include_router(formato_unico.router, prefix="/formatos", tags=["Formato Único"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(catalogo.router, prefix="/productos", tags=["Catálogo"]) # Incluye /landing
app.include_router(kits.router, prefix="/kits", tags=["Kits"])
app.include_router(categorias.router, prefix="/categorias", tags=["Categorías"])
app.include_router(checkout.router, prefix="/checkout", tags=["Checkout"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuarios"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(favoritos.router, prefix="/favoritos", tags=["Favoritos"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(seller.router, prefix="/seller", tags=["Seller"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(consultas.router, prefix="/consultas", tags=["Consultas"])
app.include_router(cotizaciones.router, prefix="/cotizaciones", tags=["Cotizaciones"])
app.include_router(distribuidor.router, prefix="/distribuidor", tags=["Distribuidor"])
app.include_router(system.router, prefix="/api/v1/system", tags=["System"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])