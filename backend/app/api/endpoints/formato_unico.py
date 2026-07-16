from fastapi import APIRouter, status, Depends, Header, HTTPException, Cookie, Response, Request
from fastapi.responses import JSONResponse
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from sqlmodel import Session
from app.services.formato_unico_service import FormatoUnicoService
from app.domain.formato_unico import FormatoUnicoState
from app.services.formato_unico_query_service import FormatoUnicoQueryService
from app.schemas.formato_unico import FormatoResponseSchema
from app.infra.repositories.in_memory_formato_repository import InMemoryFormatoRepository
from app.core.config import settings
from app.core.deps import get_kit_service, get_product_query_service
from app.db.database import get_session
from app.services.ui_config_service import UIConfigService
from app.domain.exceptions import DomainException
from app.services.kit_service import KitService
from app.core.security import get_current_user, get_current_user_optional

router = APIRouter()

mock_repo = InMemoryFormatoRepository()


def _build_supabase_repo(session: Session = None):
    from app.infra.repositories.supabase_formato_repository import SupabaseFormatoRepository
    return SupabaseFormatoRepository(session)

def get_formato_unico_service(session: Session = Depends(get_session)) -> FormatoUnicoService:
    if settings.USE_MOCK_DB:
        repo = mock_repo
    else:
        repo = _build_supabase_repo(session)
    return FormatoUnicoService(repo)

def get_formato_unico_query_service(session: Session = Depends(get_session)) -> FormatoUnicoQueryService:
    if settings.USE_MOCK_DB:
        repo = mock_repo
    else:
        repo = _build_supabase_repo(session)
    return FormatoUnicoQueryService(repo)


# ──────────────────────────────────────────────────────────────────────────────
# RF-CHK-007: Sesión GUEST via cookie httpOnly
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/session", status_code=status.HTTP_201_CREATED)
def crear_sesion_guest(
    response: Response,
    service: FormatoUnicoService = Depends(get_formato_unico_service),
):
    """
    RF-CHK-007: Crea un Formato Único GUEST y emite cookie httpOnly con order_token.
    NUNCA expone el fu_id en el body de respuesta pública.
    El frontend no debe leer ni escribir este token en JavaScript.
    
    @sdd-endpoint POST /formatos/session
    @sdd-rf RF-CHK-007
    """
    formato, order_token = service.crear_guest_session()
    
    # Cookie httpOnly: inaccesible desde JS del frontend (XSS-safe)
    response.set_cookie(
        key="order_token",
        value=order_token,
        httponly=True,
        samesite="lax",
        # secure=True  # Habilitar en producción con HTTPS
        path="/",
        max_age=60 * 60 * 24 * 30,  # 30 días
    )
    # Respuesta pública: solo el estado, NUNCA el fu_id ni el order_token
    return {"state": formato.state, "items_count": len(formato.items)}


@router.get("/me", response_model=FormatoResponseSchema)
def obtener_formato_activo(
    request: Request,
    jwt_user_id: str | None = Depends(get_current_user_optional),
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    product_query_service=Depends(get_product_query_service),
):
    """
    RF-CHK-007 / RNF-SEC-002: Obtiene el Formato Único activo del solicitante.
    - Si hay sesión CUSTOMER (cookie session_token o header Authorization,
      via get_current_user_optional): retorna el FU del CUSTOMER (aislación
      por customer_id).
    - Si hay cookie order_token: retorna el FU del GUEST.
    - Si no hay ninguno: 404.
    
    @sdd-endpoint GET /formatos/me
    @sdd-rf RF-CHK-007
    """
    # Antes esto parseaba el header Authorization a mano y NUNCA miraba la
    # cookie session_token — el frontend real (apiClient, withCredentials)
    # jamás manda ese header, así que un CUSTOMER logueado siempre caía al
    # flujo GUEST (o 404), viendo el carrito de otra sesión o ninguno.
    customer_id = UUID(jwt_user_id) if jwt_user_id else None

    if customer_id:
        formato = service.repo.get_active_by_customer_id(customer_id)
        if not formato:
            # Crear FU vacío para el customer si no tiene uno
            formato = service.crear(customer_id)
        return _enrich_formato_response(formato, product_query_service.repo)

    # Intentar resolver como GUEST via cookie httpOnly
    order_token = request.cookies.get("order_token")
    if order_token:
        formato = service.repo.get_by_order_token(order_token)
        if formato:
            return _enrich_formato_response(formato, product_query_service.repo)

    raise DomainException("No hay Formato Único activo. Inicia sesión o crea una sesión GUEST.", status_code=404)


class MergeRequest(BaseModel):
    """Payload opcional para /formatos/merge. El order_token viene de la cookie, no del body."""
    pass


@router.post("/merge", response_model=FormatoResponseSchema)
def merge_guest_to_customer(
    request: Request,
    response: Response,
    user_id: str = Depends(get_current_user),
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    product_query_service=Depends(get_product_query_service),
):
    """
    RF-AUT-007: Fusiona el FU GUEST (cookie order_token) con el FU del CUSTOMER.
    Requiere sesión CUSTOMER válida (cookie httpOnly session_token o header
    Authorization, vía get_current_user — mismo mecanismo que el resto de la API)
    + cookie order_token (opcional). Tras el merge, borra la cookie order_token.
    
    @sdd-endpoint POST /formatos/merge
    @sdd-rf RF-AUT-007
    """
    customer_id = UUID(user_id)
    order_token = request.cookies.get("order_token", "")

    formato = service.merge_guest_to_customer(
        order_token=order_token,
        customer_id=customer_id,
        product_repo=product_query_service.repo,
    )

    # Borrar la cookie GUEST tras el merge exitoso (RF-AUT-007)
    response.delete_cookie(key="order_token", path="/")

    return _enrich_formato_response(formato, product_query_service.repo)


# ──────────────────────────────────────────────────────────────────────────────
# Endpoint legacy: POST / (mantener para compatibilidad interna)
# ──────────────────────────────────────────────────────────────────────────────

@router.post("", response_model=FormatoResponseSchema, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=FormatoResponseSchema, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def crear_formato_unico(
    x_user_id: UUID = Header(None, alias="X-User-Id"),
    service: FormatoUnicoService = Depends(get_formato_unico_service)
):
    """
    Crea un Formato Único vacío en estado BORRADOR (uso interno / tests).
    """
    formato_unico = service.crear(customer_id=x_user_id)
    return formato_unico



class AgregarKitRequest(BaseModel):
    kit_id: UUID
    cantidad: int = 1

@router.post("/{id}/kits", response_model=FormatoResponseSchema)
def agregar_kit_al_formato(
    id: UUID,
    req: AgregarKitRequest,
    request: Request,
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    kit_service: KitService = Depends(get_kit_service),
    product_query_service = Depends(get_product_query_service),
    jwt_user_id: str | None = Depends(get_current_user_optional),
):
    """
    Agrega todos los componentes de un kit al Formato Único.

    RNF-SEC-001: a diferencia de otras mutaciones sobre el FU, este endpoint
    no validaba ownership — cualquiera que adivinara un UUID de FU ajeno
    podía inyectarle ítems. Mismo criterio que el resto: CUSTOMER por JWT,
    GUEST por cookie order_token.
    """
    formato_unico = service.repo.get_by_id(id)
    if not formato_unico:
        raise DomainException("Formato no encontrado", status_code=404)

    if formato_unico.customer_id:
        if not jwt_user_id or str(jwt_user_id) != str(formato_unico.customer_id):
            raise DomainException("No tienes permiso sobre este Formato Único", status_code=403)
    else:
        order_token = request.cookies.get("order_token")
        if not order_token or order_token != formato_unico.order_token:
            raise DomainException("Sesión inválida", status_code=403)

    product_repo = product_query_service.repo
    formato_unico = service.agregar_kit(formato_unico, req.kit_id, req.cantidad, kit_service, product_repo)
    return _enrich_formato_response(formato_unico, product_repo)

class UpdateItemQuantityRequest(BaseModel):
    cantidad: int

def _enrich_formato_response(formato: 'FormatoUnico', product_repo: 'IProductRepository') -> dict:
    """Helper to enrich the domain model with product details before returning it.
    Note: FormatoUnico uses slots=True so __dict__ is unavailable; use dataclasses.fields().
    """
    import dataclasses
    
    # Build base response dict from dataclass fields (compatible with slots=True)
    response_data = {
        f.name: getattr(formato, f.name)
        for f in dataclasses.fields(formato)
        if f.name != 'items'  # items handled separately below
    }

    items_enriched = []
    for item in formato.items:
        item_data = {
            f.name: getattr(item, f.name)
            for f in dataclasses.fields(item)
        }
        # Add computed subtotal property
        item_data['subtotal'] = item.subtotal
        product = product_repo.get_by_id(item.product_id)
        if product:
            item_data['product_name'] = product.name
            item_data['sku'] = product.sku
            item_data['stock_disponible'] = product.stock - product.reserved_stock
        else:
            item_data.setdefault('product_name', None)
            item_data.setdefault('sku', None)
            item_data.setdefault('stock_disponible', None)
        items_enriched.append(item_data)
    
    response_data['items'] = items_enriched
    return response_data


@router.get("/historial", response_model=List[FormatoResponseSchema], include_in_schema=False)
@router.get("/historial/", response_model=List[FormatoResponseSchema])
def listar_formatos(
    skip: int = 0,
    limit: int = 10,
    user_id: str = Depends(get_current_user),
    query_service: FormatoUnicoQueryService = Depends(get_formato_unico_query_service)
):
    """
    Lista el historial de formatos para el usuario actual.

    Registrado ANTES de /{id}: Starlette resuelve rutas en orden de registro,
    y /{id} (parametrizada) capturaría literalmente "historial" como id,
    fallando la validación UUID (RNF-SEC-001). El proxy de Next.js además
    recorta el slash final de /historial/, por eso también se registra la
    variante sin slash.
    """
    return query_service.obtener_historial(customer_id=UUID(user_id), skip=skip, limit=limit)


@router.get("/tiene-historial")
def tiene_historial_endpoint(
    user_id: str = Depends(get_current_user),
    service: FormatoUnicoService = Depends(get_formato_unico_service),
):
    """
    T6-B4: indica si el CUSTOMER tiene al menos un Formato Único histórico
    (no-BORRADOR), usado por el frontend para ramificar el onboarding entre
    "CUSTOMER nuevo" (guía de 3 pasos) y "CUSTOMER recurrente" (Widget de
    Recompra) — notas_actualizacion_diseno.md, sección 1.

    Registrada ANTES de /{id} por el mismo motivo que /historial: Starlette
    resuelve rutas en orden de registro y /{id} (parametrizada) capturaría
    literalmente "tiene-historial" como id, fallando la validación UUID.
    """
    historial = service.repo.list_all(customer_id=UUID(user_id), skip=0, limit=1000)
    tiene_historial = any(f.state != FormatoUnicoState.BORRADOR for f in historial)
    return {"has_history": tiene_historial}


@router.get("/{id}", response_model=FormatoResponseSchema)
def obtener_formato(
    id: UUID,
    user_id: str = Depends(get_current_user),
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    product_query_service = Depends(get_product_query_service)
):
    """
    RNF-SEC-001 / NAV-FU-003 (SCR-FU-002 "Ver detalle"): obtiene un Formato
    Único por ID enriquecido con detalles de stock. Requiere sesión CUSTOMER
    y que el FU le pertenezca (bloqueado si no es el owner).
    """
    formato = service.repo.get_by_id(id)
    if not formato:
        raise DomainException("Formato no encontrado", status_code=404)

    if str(formato.customer_id) != str(user_id):
        raise DomainException("No tienes permiso para ver este Formato Único", status_code=403)

    return _enrich_formato_response(formato, product_query_service.repo)

@router.patch("/{id}/items/{product_id}", response_model=FormatoResponseSchema)
def actualizar_item(
    id: UUID,
    product_id: UUID,
    req: UpdateItemQuantityRequest,
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    product_query_service = Depends(get_product_query_service)
):
    """
    Actualiza la cantidad de un ítem existente.
    """
    from app.domain.exceptions import DomainException
    formato = service.repo.get_by_id(id)
    if not formato:
        raise DomainException("Formato no encontrado", status_code=404)
        
    product_repo = product_query_service.repo
    product = product_repo.get_by_id(product_id)
    if not product:
        raise DomainException("Producto no encontrado", status_code=404)
        
    formato = service.actualizar_cantidad_item(formato, product, req.cantidad)
    return _enrich_formato_response(formato, product_repo)

@router.post("/{id}/solicitar-consulta", response_model=FormatoResponseSchema)
def solicitar_consulta_endpoint(
    id: UUID,
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    product_query_service = Depends(get_product_query_service)
):
    """
    RF-FU-004 (BTN-FU-003 "Solicitar Asesoría"): transiciona BORRADOR a
    CONSULTA. Disponible para GUEST y CUSTOMER.
    """
    formato = service.repo.get_by_id(id)
    if not formato:
        raise DomainException("Formato no encontrado", status_code=404)

    formato = service.solicitar_consulta(formato)
    return _enrich_formato_response(formato, product_query_service.repo)


@router.delete("/{id}/items/{product_id}", response_model=FormatoResponseSchema)
def eliminar_item_del_formato(
    id: UUID,
    product_id: UUID,
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    product_query_service = Depends(get_product_query_service)
):
    """
    RF-FU-002 (BTN-FU-001 "Eliminar" por ítem): remueve un producto
    específico del Formato Único en BORRADOR.
    """
    formato = service.repo.get_by_id(id)
    if not formato:
        raise DomainException("Formato no encontrado", status_code=404)

    formato = service.eliminar_item(formato, product_id)
    return _enrich_formato_response(formato, product_query_service.repo)


@router.delete("/{id}/items", response_model=FormatoResponseSchema)
def vaciar_items_del_formato(
    id: UUID,
    request: Request,
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    product_query_service = Depends(get_product_query_service),
    jwt_user_id: str | None = Depends(get_current_user_optional),
):
    """
    RF-FU-003 (BTN-FU-002 "Vaciar Formato Único"): vacía todos los ítems
    del Formato Único en BORRADOR.

    RNF-SEC-001: al igual que agregar_kit_al_formato, este endpoint no
    validaba ownership — cualquiera que adivinara un UUID de FU ajeno podía
    vaciarlo. Mismo criterio que el resto: CUSTOMER por JWT, GUEST por
    cookie order_token.
    """
    from app.domain.formato_unico import FormatoUnicoState
    formato = service.repo.get_by_id(id)
    if not formato:
        raise DomainException("Formato no encontrado", status_code=404)

    if formato.customer_id:
        if not jwt_user_id or str(jwt_user_id) != str(formato.customer_id):
            raise DomainException("No tienes permiso sobre este Formato Único", status_code=403)
    else:
        order_token = request.cookies.get("order_token")
        if not order_token or order_token != formato.order_token:
            raise DomainException("Sesión inválida", status_code=403)

    if formato.state != FormatoUnicoState.BORRADOR:
        raise DomainException("Operación no permitida fuera de BORRADOR")
        
    formato.items = []
    formato.recalcular_subtotal()
    from datetime import datetime
    formato.updated_at = datetime.utcnow()
    service.repo.save(formato)
    return _enrich_formato_response(formato, product_query_service.repo)


@router.post("/{id}/clean-errors", response_model=FormatoResponseSchema)
def limpiar_errores_del_formato(
    id: UUID,
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    product_query_service = Depends(get_product_query_service)
):
    """
    BTN-FU-016 "Limpiar Filas con Error": elimina en bloque todas las
    filas que tengan SKU inexistente o error crítico.
    """
    from app.domain.formato_unico import FormatoUnicoState
    formato = service.repo.get_by_id(id)
    if not formato:
        raise DomainException("Formato no encontrado", status_code=404)
    if formato.state != FormatoUnicoState.BORRADOR:
        raise DomainException("Operación no permitida fuera de BORRADOR")
        
    product_repo = product_query_service.repo
    valid_items = []
    for item in formato.items:
        product = product_repo.get_by_id(item.product_id)
        if product and product.is_active:
            valid_items.append(item)
            
    formato.items = valid_items
    formato.recalcular_subtotal()
    from datetime import datetime
    formato.updated_at = datetime.utcnow()
    service.repo.save(formato)
    return _enrich_formato_response(formato, product_repo)


class AgregarItemRequest(BaseModel):
    cantidad: int = 1

@router.post("/{id}/items/{product_id}", response_model=FormatoResponseSchema)
def agregar_item_al_formato(
    id: UUID,
    product_id: UUID,
    req: AgregarItemRequest,
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    product_query_service = Depends(get_product_query_service)
):
    """
    Agrega un producto al Formato Único. Si ya existe, incrementa la cantidad.
    """
    formato = service.repo.get_by_id(id)
    if not formato:
        raise DomainException("Formato no encontrado", status_code=404)
        
    product_repo = product_query_service.repo
    product = product_repo.get_by_id(product_id)
    if not product:
        raise DomainException("Producto no encontrado", status_code=404)
        
    existing_item = next((i for i in formato.items if i.product_id == product.id), None)
    if existing_item:
        formato = service.actualizar_cantidad_item(formato, product, existing_item.quantity + req.cantidad)
    else:
        formato = service.agregar_item(formato, product, req.cantidad)
        
    return _enrich_formato_response(formato, product_repo)

from app.core.security import get_current_user_optional

async def get_fu_owner_or_guest(
    formato_id: UUID,
    request: Request,
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    jwt_user: Optional[str] = Depends(get_current_user_optional),
) -> dict:
    """
    RF-FU-005: Autoriza la acción sobre el FU.
    - Si el FU tiene customer_id (CUSTOMER): requiere JWT válido y que coincida el ID.
    - Si el FU es guest (customer_id es None): requiere cookie order_token coincidente.
    
    @sdd-rf RF-FU-005
    """
    fu = service.repo.get_by_id(formato_id)
    if not fu:
        raise DomainException("Formato Único no encontrado", status_code=404)
        
    # Caso CUSTOMER
    if fu.customer_id:
        if not jwt_user or str(jwt_user) != str(fu.customer_id):
            raise DomainException("No autorizado", status_code=403)
        return {"owner_type": "CUSTOMER", "user_id": jwt_user}
        
    # Caso GUEST
    else:
        order_token = request.cookies.get("order_token")
        if not order_token or order_token != fu.order_token:
            raise DomainException("Sesión inválida", status_code=403)
        return {"owner_type": "GUEST", "token": order_token}


from fastapi import BackgroundTasks
from app.services.audit_service import AuditService

@router.post("/{formato_id}/aprobar", response_model=FormatoResponseSchema)
def aprobar_formato(
    formato_id: UUID,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    service: FormatoUnicoService = Depends(get_formato_unico_service)
):
    """
    RF-FU-005 / FU-T-03: Genera cotización para un Formato Único (BORRADOR→COTIZACION).
    Actor exclusivo CUSTOMER dueño del FU (GUEST no genera cotización, ver
    FU-T-04/RF-FU-006 para su flujo directo a checkout).
    
    @sdd-endpoint POST /formatos/{id}/aprobar
    @sdd-rf RF-FU-005
    """
    formato_unico = service.repo.get_by_id(formato_id)
    if not formato_unico:
        raise DomainException("Formato no encontrado", status_code=404)

    formato_unico = service.generar_cotizacion(formato_unico, UUID(user_id))

    # Inyectar auditoría en background
    audit_svc = AuditService()
    background_tasks.add_task(
        audit_svc.log_mutation,
        user_id=str(user_id),
        action="GENERAR_COTIZACION",
        entity_id=str(formato_id)
    )

    return formato_unico


@router.post("/{formato_id}/cancelar-cotizacion", response_model=FormatoResponseSchema)
def cancelar_cotizacion_formato(
    formato_id: UUID,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    service: FormatoUnicoService = Depends(get_formato_unico_service)
):
    """
    RF-FU-020 / FU-T-15 (RN-FU-06): Cancela una cotización vigente antes de
    su vencimiento y retorna el Formato Único a BORRADOR, preservando los
    ítems para que el CUSTOMER pueda seguir agregando productos. Actor
    exclusivo CUSTOMER dueño del FU.
    
    @sdd-endpoint POST /formatos/{id}/cancelar-cotizacion
    @sdd-rf RF-FU-020
    """
    formato_unico = service.repo.get_by_id(formato_id)
    if not formato_unico:
        raise DomainException("Formato no encontrado", status_code=404)

    formato_unico = service.cancelar_cotizacion(formato_unico, UUID(user_id))

    audit_svc = AuditService()
    background_tasks.add_task(
        audit_svc.log_mutation,
        user_id=str(user_id),
        action="CANCELAR_COTIZACION",
        entity_id=str(formato_id)
    )

    return formato_unico


@router.post("/{historico_id}/reemplazar-borrador", response_model=FormatoResponseSchema)
def reemplazar_borrador_endpoint(
    historico_id: UUID,
    user_id: str = Depends(get_current_user),
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    product_query_service=Depends(get_product_query_service),
):
    """
    T6-B3 (Widget de Recompra) — BTN-FU-008a: reemplaza el borrador activo
    del CUSTOMER con los ítems de una cotización histórica (`historico_id`).
    """
    historico = service.repo.get_by_id(historico_id)
    if not historico:
        raise DomainException("Formato no encontrado", status_code=404)
    if historico.customer_id is None or str(historico.customer_id) != str(user_id):
        raise DomainException("No tienes permiso sobre este Formato Único", status_code=403)

    borrador_activo = service.repo.get_active_by_customer_id(UUID(user_id))
    if not borrador_activo or borrador_activo.state != FormatoUnicoState.BORRADOR:
        borrador_activo = service.crear(UUID(user_id))

    actualizado = service.reemplazar_borrador(historico, borrador_activo, product_query_service.repo)
    return _enrich_formato_response(actualizado, product_query_service.repo)


@router.post("/{historico_id}/combinar-borrador", response_model=FormatoResponseSchema)
def combinar_borrador_endpoint(
    historico_id: UUID,
    user_id: str = Depends(get_current_user),
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    product_query_service=Depends(get_product_query_service),
):
    """
    T6-B3 (Widget de Recompra) — BTN-FU-008b: fusiona los ítems de una
    cotización histórica (`historico_id`) dentro del borrador activo del
    CUSTOMER, sumando cantidades de productos repetidos.
    """
    historico = service.repo.get_by_id(historico_id)
    if not historico:
        raise DomainException("Formato no encontrado", status_code=404)
    if historico.customer_id is None or str(historico.customer_id) != str(user_id):
        raise DomainException("No tienes permiso sobre este Formato Único", status_code=403)

    borrador_activo = service.repo.get_active_by_customer_id(UUID(user_id))
    if not borrador_activo or borrador_activo.state != FormatoUnicoState.BORRADOR:
        borrador_activo = service.crear(UUID(user_id))

    actualizado = service.combinar_con_borrador(historico, borrador_activo, product_query_service.repo)
    return _enrich_formato_response(actualizado, product_query_service.repo)


from fastapi import UploadFile, File, Form
from fastapi.responses import StreamingResponse
import csv
import io
import json
from app.services.excel_import_service import ExcelImportService

def get_excel_import_service(
    product_query_service = Depends(get_product_query_service),
) -> ExcelImportService:
    """
    RF-FU-013: antes esto inyectaba un InMemoryProductRepository() propio,
    instanciado una sola vez a nivel de módulo y JAMÁS poblado en runtime
    (nada lo alimenta fuera de tests) — cada importación reportaba "SKU no
    existe" para TODOS los SKUs, sin importar cuán reales fueran, porque
    validaba contra un catálogo fantasma vacío en vez del catálogo real
    (RF-CAT-006). Se usa el mismo repositorio real que el resto del sistema.
    """
    return ExcelImportService(product_query_service.repo)

@router.get("/excel/template")
def descargar_plantilla_csv(
    product_query_service = Depends(get_product_query_service),
):
    """
    RF-FU-014: genera y descarga una plantilla CSV para la carga masiva de
    ítems, poblada con los SKUs reales del catálogo activo (antes traía un
    único SKU-EJEMPLO ficticio que no existe en ningún catálogo real, así
    que cualquier fila calcada de la plantilla fallaba la validación al
    importar). Incluye columnas de referencia (producto, precio, stock)
    para que el cliente sepa qué está pidiendo; el importador solo exige
    'sku' y 'cantidad', el resto se ignora al procesar.
    """
    productos = product_query_service.repo.list_all(skip=0, limit=200, in_stock=True)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["sku", "cantidad", "producto", "precio_referencial", "stock"])
    for producto in productos:
        if not producto.sku:
            continue
        writer.writerow([
            producto.sku,
            0,
            producto.name,
            producto.price_public,
            producto.stock - producto.reserved_stock,
        ])

    return StreamingResponse(
        io.StringIO(buffer.getvalue()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=plantilla.csv"}
    )

@router.post("/excel/import")
async def importar_csv(
    file: UploadFile = File(...),
    service: ExcelImportService = Depends(get_excel_import_service)
):
    """
    Importa un archivo CSV con ítems.
    """
    content = await file.read()
    result = service.process_csv(content)
    return result


class ExcelApplyItemRequest(BaseModel):
    sku: str
    cantidad: int

class ExcelApplyRequest(BaseModel):
    items: list[ExcelApplyItemRequest]

@router.post("/{id}/excel/aplicar", response_model=FormatoResponseSchema)
def aplicar_importacion_excel(
    id: UUID,
    req: ExcelApplyRequest,
    request: Request,
    service: FormatoUnicoService = Depends(get_formato_unico_service),
    product_query_service = Depends(get_product_query_service),
    jwt_user_id: str | None = Depends(get_current_user_optional),
):
    """
    RF-FU-013/RF-FU-019 (BTN-FU-017/CMP-FU-018 "Confirmar Importación
    Válida"): aplica al Formato Único los ítems validados por
    /excel/import. Antes este paso era puramente cosmético — el frontend
    mostraba un alert "(Simulado)" sin llamar a ningún endpoint, así que el
    archivo se validaba pero nunca se cargaba (UC-EXCEL-001, paso 5, nunca
    implementado).

    Revalida SKU/stock server-side (nunca confía en el resultado que ya
    validó el cliente, pudo quedar desactualizado): si el stock disponible
    es menor a lo solicitado, aplica solo hasta el stock disponible
    (RN-FU-10) en vez de rechazar la fila completa — mismo criterio de
    "stock parcial" que ya reporta /excel/import como advertencia.
    """
    formato_unico = service.repo.get_by_id(id)
    if not formato_unico:
        raise DomainException("Formato no encontrado", status_code=404)

    if formato_unico.customer_id:
        if not jwt_user_id or str(jwt_user_id) != str(formato_unico.customer_id):
            raise DomainException("No tienes permiso sobre este Formato Único", status_code=403)
    else:
        order_token = request.cookies.get("order_token")
        if not order_token or order_token != formato_unico.order_token:
            raise DomainException("Sesión inválida", status_code=403)

    product_repo = product_query_service.repo
    all_products = product_repo.list_all(skip=0, limit=10_000)
    products_by_sku = {p.sku: p for p in all_products if p.sku}

    for entry in req.items:
        product = products_by_sku.get(entry.sku)
        if not product or not product.is_active:
            continue

        disponible = product.stock - product.reserved_stock
        existing_item = next((i for i in formato_unico.items if i.product_id == product.id), None)
        ya_agregado = existing_item.quantity if existing_item else 0
        cantidad_aplicable = min(entry.cantidad, max(disponible - ya_agregado, 0))
        if cantidad_aplicable < 1:
            continue

        if existing_item:
            formato_unico = service.actualizar_cantidad_item(formato_unico, product, ya_agregado + cantidad_aplicable)
        else:
            formato_unico = service.agregar_item(formato_unico, product, cantidad_aplicable)

    return _enrich_formato_response(formato_unico, product_repo)

from app.services.ui_config_service import UIConfigService

def get_ui_config_service() -> UIConfigService:
    return UIConfigService()

@router.get("/{id}/configuracion-ui/")
def obtener_configuracion_ui(
    id: UUID,
    x_user_id: UUID = Header(..., alias="X-User-Id"),
    query_service: FormatoUnicoQueryService = Depends(get_formato_unico_query_service),
    ui_service: UIConfigService = Depends(get_ui_config_service)
):
    formato = query_service.obtener_formato_por_id(id)
    if not formato:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Formato no encontrado")
        
    return ui_service.get_config_for_state(formato.state)
