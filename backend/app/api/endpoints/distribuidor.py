"""
MOD-DIS-01 — Integración DISTRIBUTOR
RF-DIS-001 a RF-DIS-004

Endpoint:
  POST /distribuidor/sync   → Sincroniza precios y/o stock por lote (batch)

Autenticación server-to-server:
  X-API-Key:    clave del distribuidor (identidad)
  X-Nonce:      valor único por solicitud (anti-replay, RN-DIS-002)
  X-Signature:  HMAC-SHA256(nonce + body_str, api_secret)

Seguridad:
  - RNF-SEC-004: nonce único + ventana ±5min anti-replay → HTTP 409 en replay
  - RN-DIST-01: solo actualiza SKUs existentes, no crea nuevos
  - RN-CHECKOUT-02: no afecta precios fijados en cotizaciones vigentes
  - Procesamiento parcial: batch mixto → válidos procesados, inválidos en rejected_skus
"""

import hmac
import hashlib
import dataclasses
import time
from decimal import Decimal
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Request, HTTPException, status, Depends
from pydantic import BaseModel

from app.domain.repositories.product_repository import IProductRepository
from app.core.deps import get_product_repository
from app.core.config import settings

router = APIRouter()

# ─── Configuration ───────────────────────────────────────────────────────────
# Antes: os.getenv(...) — nunca lee backend/.env (solo variables de entorno
# reales del proceso). `settings` sí parsea .env correctamente.
_DISTRIBUTOR_API_KEY = settings.DISTRIBUTOR_API_KEY
_DISTRIBUTOR_SECRET  = settings.DISTRIBUTOR_SECRET

# Product repository inyectado via dependency injection (persistencia real)
# _product_repo = InMemoryProductRepository()  # ELIMINADO: ahora usa ProductRepositoryImpl


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _find_product_by_sku(sku: str, product_repo: IProductRepository):
    """Returns the Product domain object for a given SKU, or None if not found."""
    return product_repo.get_by_sku(sku)


def _verify_hmac(api_key: str, nonce: str, signature: str, body_str: str) -> None:
    """
    OPS-DIS-001: Validates HMAC-SHA256 signature and nonce.
    Raises HTTP 401 on invalid credentials.
    Raises HTTP 409 on nonce replay (RN-DIS-002, RNF-SEC-004).
    """
    # 1. Validate API key (identity)
    if api_key != _DISTRIBUTOR_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key inválida",
        )

    # 2. Validate HMAC signature
    expected = hmac.new(
        _DISTRIBUTOR_SECRET.encode(),
        (nonce + body_str).encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firma HMAC inválida (RN-DIS-002)",
        )

    # 3. Anti-replay: check + register nonce using centralized security service
    from app.services.distributor_auth_service import distributor_auth_service
    from app.domain.exceptions import DomainException

    try:
        distributor_auth_service.validar_nonce(nonce)
    except DomainException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nonce reutilizado — posible ataque de replay (RNF-SEC-004)",
        )


# ─── Schemas ─────────────────────────────────────────────────────────────────

class SyncItemSchema(BaseModel):
    sku: str
    price_public: Optional[float] = None    # RF-DIS-002: sync price
    price_wholesale: Optional[float] = None  # RF-DIS-002: sync wholesale price
    stock: Optional[int] = None             # RF-DIS-003: sync stock


class SyncBatchSchema(BaseModel):
    items: List[SyncItemSchema]


class SyncResponseSchema(BaseModel):
    message: str
    processed_count: int
    rejected_skus: List[str]
    details: List[Dict[str, Any]]


# ─── POST /distribuidor/sync ──────────────────────────────────────────────────

@router.post("/sync", response_model=SyncResponseSchema)
async def sincronizar_distribuidor(
    request: Request,
    product_repo: IProductRepository = Depends(get_product_repository),
):
    """
    AUTO-DIS-001 → OPS-DIS-001 → OPS-DIS-002/003 → OPS-DIS-004 (if partial reject).

    RF-DIS-001: Authenticate with HMAC + nonce.
    RF-DIS-002: Update price_public / price_wholesale for known SKUs.
    RF-DIS-003: Update stock for known SKUs.
    RF-DIS-004: Unknown SKUs → rejected_skus (partial processing, not all-or-nothing).
    
    @sdd-endpoint POST /distribuidor/sync
    @sdd-rf RF-DIS-001 RF-DIS-002 RF-DIS-003 RF-DIS-004
    """
    # Read raw body for HMAC verification
    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8")

    # Extract auth headers
    api_key  = request.headers.get("X-API-Key", "")
    nonce    = request.headers.get("X-Nonce", "")
    signature = request.headers.get("X-Signature", "")

    if not api_key or not nonce or not signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Headers de autenticación faltantes: X-API-Key, X-Nonce, X-Signature",
        )

    # OPS-DIS-001: Verify HMAC + anti-replay
    _verify_hmac(api_key, nonce, signature, body_str)

    # Parse validated body
    import json
    try:
        raw = json.loads(body_str)
        batch = SyncBatchSchema(**raw)
    except Exception:
        raise HTTPException(status_code=400, detail="Payload inválido")

    # OPS-DIS-002 / OPS-DIS-003: Process batch
    processed_count = 0
    rejected_skus: List[str] = []
    details: List[Dict[str, Any]] = []

    for item in batch.items:
        product = _find_product_by_sku(item.sku, product_repo)

        if product is None:
            # OPS-DIS-004: Unknown SKU — reject, do not create (RN-DIST-01)
            rejected_skus.append(item.sku)
            details.append({
                "sku": item.sku,
                "status": "rejected",
                "reason": f"SKU '{item.sku}' no existe en el catálogo (RN-DIST-01)",
            })
            continue

        # Apply updates — only fields provided in the payload
        updates: dict = {}
        if item.price_public is not None:
            updates["price_public"] = Decimal(str(item.price_public))
        if item.price_wholesale is not None:
            updates["price_wholesale"] = Decimal(str(item.price_wholesale)) \
                if hasattr(product, "price_wholesale") else None
        if item.stock is not None:
            updates["stock"] = item.stock

        if updates:
            # price_wholesale may not exist on the Product dataclass — skip gracefully
            safe_updates = {
                k: v for k, v in updates.items()
                if k in {f.name for f in dataclasses.fields(product)}
            }
            if safe_updates:
                updated = dataclasses.replace(product, **safe_updates)
                product_repo.save(updated)

        processed_count += 1
        details.append({
            "sku": item.sku,
            "status": "processed",
            "updates": {k: str(v) for k, v in updates.items()},
        })

    status_code = 207 if rejected_skus else 200
    response_body = SyncResponseSchema(
        message=f"Sincronización completada. {processed_count} procesados, {len(rejected_skus)} rechazados.",
        processed_count=processed_count,
        rejected_skus=rejected_skus,
        details=details,
    )

    from fastapi.responses import JSONResponse
    return JSONResponse(
        content=response_body.model_dump(),
        status_code=status_code,
    )
