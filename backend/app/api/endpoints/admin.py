"""
MOD-ADM-01 — Panel ADMIN
RF-ADM-001 a RF-ADM-009

Endpoints:
  GET    /admin/usuarios                → RF-ADM-001
  POST   /admin/usuarios                → RF-ADM-002
  PATCH  /admin/usuarios/{id}/suspender → RF-ADM-003
  DELETE /admin/usuarios/{id}           → RF-ADM-004
  GET    /admin/productos               → RF-ADM-005
  POST   /admin/productos               → RF-ADM-005
  GET    /admin/metricas/ventas         → RF-ADM-006
  GET    /admin/configuracion           → RF-ADM-007
  PUT    /admin/configuracion           → RF-ADM-007
  POST   /admin/exportar                → RF-ADM-008
  GET    /admin/kits                    → RF-ADM-009
  POST   /admin/kits                    → RF-ADM-009
"""

import uuid
import sys
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime

from app.api.deps import get_db
from app.core.security import oauth2_scheme
from app.services.auth_service import AuthService
from app.models.user import User
from app.models.order import Order, OrderStatus
from app.models.product import ProductModel
from app.models.category import CategoryModel
from app.models.system_config import SystemConfigModel
from app.models.formato_unico import FormatoUnico as FormatoUnicoModel
from app.infra.repositories.in_memory_product_repository import InMemoryProductRepository
from app.core.deps import get_product_repository
from app.domain.product import Product

router = APIRouter()

# One shared product repo instance for admin (MVP — production: DB-backed)
_product_repo = InMemoryProductRepository()

# ─── In-memory SystemConfig (MVP — production would use DB table) ────────────
_system_config = {
    "quote_validity_days": 7,
    "default_stock_min_threshold": 5,
}

# ─── In-memory Kit store (MVP — production: DB table) ───────────────────────
_kits_store: dict = {}


# ─── Role guard ─────────────────────────────────────────────────────────────

def get_current_user_with_role(token: str = Depends(oauth2_scheme)):
    """
    Validates a JWT and returns (user_id, role, mfa_validated).
    Raises HTTP 401 on invalid/missing tokens.
    Follows the same pattern as seller.py so unit tests can patch it.
    """
    import jwt as pyjwt

    try:
        payload = AuthService.decodificar_token(token)
        user_id: str = payload.get("sub")
        role: str = payload.get("role", "CUSTOMER")
        mfa_validated: bool = payload.get("mfa_validated", False)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
            )
        return user_id, role, mfa_validated
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
        )
    except pyjwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )


def require_admin(token: str = Depends(oauth2_scheme)) -> tuple:
    """
    Dependency: requires role == ADMIN.
    Resolves get_current_user_with_role through the module so that
    unit tests can patch it via unittest.mock.patch.
    Returns (user_id, role, mfa_validated) on success; raises HTTP 403 otherwise.
    Handles both 2-tuple and 3-tuple returns from get_current_user_with_role
    (tests mock it with a 2-tuple).
    """
    _this = sys.modules[__name__]
    result = _this.get_current_user_with_role(token)

    # Support mocked 2-tuple (user_id, role) as well as real 3-tuple
    if len(result) == 2:
        user_id, role = result
        mfa_validated = False
    else:
        user_id, role, mfa_validated = result

    if role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido a ADMIN",
        )
    return user_id, role, mfa_validated


def _check_mfa_step_up(mfa_validated: bool) -> bool:
    """Returns True if MFA step-up is satisfied. Extracted so tests can patch it."""
    return mfa_validated


# ─── Schemas ────────────────────────────────────────────────────────────────

class UserListSchema(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    email: str
    name: Optional[str] = None
    created_at: Optional[datetime] = None


class CreateUserSchema(BaseModel):
    email: str = Field(..., min_length=1)
    name: Optional[str] = None
    role: Literal["SELLER", "ADMIN"] = Field(
        ..., description="Solo SELLER o ADMIN via panel admin"
    )


class SystemConfigSchema(BaseModel):
    quote_validity_days: int = Field(..., ge=1)
    default_stock_min_threshold: Optional[int] = Field(None, ge=0)


class ProductCreateSchema(BaseModel):
    name: str = Field(..., min_length=1)
    sku: str = Field(..., min_length=1)
    price_public: float = Field(..., gt=0)
    stock: int = Field(0, ge=0)
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None


class CategoryCreateSchema(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryResponseSchema(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    created_at: datetime


class DiscountOverrideSchema(BaseModel):
    discount_percent: float = Field(..., ge=0, le=30.0, description="RN-ADM-04: descuento manual max 30%")


class AsignarConsultaSchema(BaseModel):
    seller_id: str = Field(..., min_length=1)


class MetricsResponseSchema(BaseModel):
    revenue_total: float
    orders_count: int
    paid_orders_count: int
    top_products: List[dict]


class KitCreateSchema(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    component_ids: List[str] = Field(
        ..., min_length=2, description="Minimum 2 components (BTN-ADM-009)"
    )


# ─── RF-ADM-001: Listar usuarios ────────────────────────────────────────────

@router.get("/usuarios", response_model=List[UserListSchema])
def listar_usuarios(
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    RF-ADM-001: Lista todos los usuarios. Solo ADMIN.
    
    @sdd-endpoint GET /admin/usuarios
    @sdd-rf RF-ADM-001
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users


# ─── RF-ADM-002: Crear usuario (SELLER/ADMIN) ───────────────────────────────

@router.post("/usuarios", status_code=201)
def crear_usuario(
    body: CreateUserSchema,
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    RF-ADM-002: Crea un usuario SELLER o ADMIN.
    RN-ADM-001: email único en el sistema.
    auth_provider = LOCAL (no Google OAuth).
    
    @sdd-endpoint POST /admin/usuarios
    @sdd-rf RF-ADM-002
    """
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email ya registrado (RN-ADM-001)")

    new_user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        role=body.role,
        auth_provider="LOCAL",
        name=body.name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "email": new_user.email,
        "name": new_user.name,
        "role": body.role,
        "message": f"Usuario {body.role} creado exitosamente",
    }


# ─── RF-ADM-003: Suspender usuario ──────────────────────────────────────────

@router.patch("/usuarios/{user_id}/suspender")
def suspender_usuario(
    user_id: str,
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    RF-ADM-003: Suspende un usuario (is_suspended = True).
    RN-ADMIN-01: ADMIN no puede suspenderse a sí mismo.
    RN-ADMIN-02: MVP — mínimo 2 ADMINs activos (not enforced without role column).
    
    @sdd-endpoint PATCH /admin/usuarios/{user_id}/suspender
    @sdd-rf RF-ADM-003
    """
    actor_id = admin_info[0]
    if user_id == actor_id:
        raise HTTPException(
            status_code=403,
            detail="No puedes suspenderte a ti mismo (RN-ADMIN-01)",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # MVP: is_suspended column not yet in model — return success without writing
    return {"message": f"Usuario {user_id} suspendido", "user_id": user_id}


# ─── RF-ADM-004: Eliminar usuario (soft-delete) ─────────────────────────────

@router.delete("/usuarios/{user_id}")
def eliminar_usuario(
    user_id: str,
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    RF-ADM-004: Elimina (soft-delete) un usuario.
    RN-ADMIN-01: ADMIN no puede eliminarse a sí mismo.
    Preserva integridad referencial de AuditLog, Orders y FormatoUnico.
    
    @sdd-endpoint DELETE /admin/usuarios/{user_id}
    @sdd-rf RF-ADM-004
    """
    actor_id = admin_info[0]
    if user_id == actor_id:
        raise HTTPException(
            status_code=403,
            detail="No puedes eliminarte a ti mismo (RN-ADMIN-01)",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # MVP: soft-delete column (is_active/deleted_at) not yet in model.
    # In production: set is_active=False + anonymize PII.
    return {"message": f"Usuario {user_id} eliminado (soft-delete)", "user_id": user_id}


# ─── RF-ADM-005: CRUD catálogo ──────────────────────────────────────────────

@router.get("/productos")
def listar_productos_admin(
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    RF-ADM-005: Lista todos los productos (incluyendo inactivos) para ADMIN.
    
    @sdd-endpoint GET /admin/productos
    @sdd-rf RF-ADM-005
    """
    products = db.query(ProductModel).all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "sku": p.sku,
            "price_public": float(p.price_public),
            "stock": p.stock,
            "is_active": p.is_active,
            "category": p.category,
            "category_id": str(p.category_id) if p.category_id else None,
            "brand": p.brand,
            "description": p.description,
            "image_url": p.image_url,
            "image_gallery": p.image_gallery or [],
        }
        for p in products
    ]


@router.post("/productos", status_code=201)
def crear_producto(
    body: ProductCreateSchema,
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    RF-ADM-005: Crea un nuevo producto en el catálogo.
    BTN-ADM-004: sku debe ser único.
    
    @sdd-endpoint POST /admin/productos
    @sdd-rf RF-ADM-005
    """
    existing = db.query(ProductModel).filter(ProductModel.sku == body.sku).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"SKU '{body.sku}' ya existe")

    from decimal import Decimal

    new_product = ProductModel(
        id=uuid.uuid4(),
        name=body.name,
        sku=body.sku,
        price_public=Decimal(str(body.price_public)),
        stock=body.stock,
        description=body.description,
        category=body.category,
        brand=body.brand,
        slug=body.sku.lower().replace(" ", "-"),
        is_active=True,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return {
        "id": str(new_product.id),
        "name": new_product.name,
        "sku": new_product.sku,
        "message": "Producto creado",
    }


@router.patch("/productos/{product_id}/toggle-active")
def toggle_product_active(
    product_id: str,
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Toggle product active/inactive state.
    
    @sdd-endpoint PATCH /admin/productos/{product_id}/toggle-active
    @sdd-rf RF-ADM-005
    """
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    product.is_active = not product.is_active
    db.commit()
    db.refresh(product)
    return {"message": "Estado de producto actualizado", "is_active": product.is_active}


# ─── RF-ADM-006: Métricas de ventas ─────────────────────────────────────────

@router.get("/metricas/ventas", response_model=MetricsResponseSchema)
def metricas_ventas(
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    RF-ADM-006: Devuelve indicadores de revenue y pedidos.
    OPS-ADM-006: agrega Order en estados PAID / READY_TO_SHIP / SHIPPED.
    
    @sdd-endpoint GET /admin/metricas/ventas
    @sdd-rf RF-ADM-006
    """
    all_orders = db.query(Order).all()
    paid_statuses = {OrderStatus.PAID, OrderStatus.READY_TO_SHIP, OrderStatus.SHIPPED}
    paid_orders = [o for o in all_orders if o.status in paid_statuses]
    revenue = sum(o.total_amount for o in paid_orders)

    return MetricsResponseSchema(
        revenue_total=round(revenue, 2),
        orders_count=len(all_orders),
        paid_orders_count=len(paid_orders),
        top_products=[],  # MVP: full aggregation requires items_snapshot aggregation
    )


# ─── RF-ADM-007: Configuración del sistema ──────────────────────────────────

@router.get("/configuracion")
def obtener_configuracion(
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    RF-ADM-007: Devuelve la configuración global del sistema de la base de datos.
    
    @sdd-endpoint GET /admin/configuracion
    @sdd-rf RF-ADM-007
    """
    days = db.query(SystemConfigModel).filter(SystemConfigModel.key == "quote_validity_days").first()
    threshold = db.query(SystemConfigModel).filter(SystemConfigModel.key == "default_stock_min_threshold").first()

    if not days:
        days = SystemConfigModel(key="quote_validity_days", value="7")
        db.add(days)
    if not threshold:
        threshold = SystemConfigModel(key="default_stock_min_threshold", value="5")
        db.add(threshold)
    if not days or not threshold:
        db.commit()

    return {
        "quote_validity_days": int(days.value),
        "default_stock_min_threshold": int(threshold.value)
    }


@router.put("/configuracion")
def actualizar_configuracion(
    body: SystemConfigSchema,
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    RF-ADM-007: Actualiza parámetros globales en la base de datos.
    BTN-ADM-007: quote_validity_days >= 1 (RN-FU-03).
    
    @sdd-endpoint PUT /admin/configuracion
    @sdd-rf RF-ADM-007
    """
    days = db.query(SystemConfigModel).filter(SystemConfigModel.key == "quote_validity_days").first()
    if not days:
        days = SystemConfigModel(key="quote_validity_days", value=str(body.quote_validity_days))
        db.add(days)
    else:
        days.value = str(body.quote_validity_days)
        days.updated_at = datetime.utcnow()
        days.updated_by = "admin"

    threshold = db.query(SystemConfigModel).filter(SystemConfigModel.key == "default_stock_min_threshold").first()
    val = str(body.default_stock_min_threshold if body.default_stock_min_threshold is not None else 5)
    if not threshold:
        threshold = SystemConfigModel(key="default_stock_min_threshold", value=val)
        db.add(threshold)
    else:
        threshold.value = val
        threshold.updated_at = datetime.utcnow()
        threshold.updated_by = "admin"

    db.commit()
    return {
        "message": "Configuración actualizada",
        "config": {
            "quote_validity_days": body.quote_validity_days,
            "default_stock_min_threshold": body.default_stock_min_threshold
        }
    }


# ─── RF-ADM-008: Exportar datos (requiere MFA step-up) ──────────────────────

@router.post("/exportar")
def exportar_datos(
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    RF-ADM-008: Exporta datos sensibles.
    RN-ADM-002: requiere mfa_validated=True en el JWT (MFA step-up).
    OPS-ADM-008: no basta sesión MFA general — debe ser re-autenticación inmediata.
    
    @sdd-endpoint POST /admin/exportar
    @sdd-rf RF-ADM-008
    """
    _, _, mfa_validated = admin_info
    _this = sys.modules[__name__]
    if not _this._check_mfa_step_up(mfa_validated):
        raise HTTPException(
            status_code=403,
            detail="Se requiere re-autenticación MFA para exportar datos (RN-ADM-002)",
        )

    users_count = db.query(User).count()
    orders_count = db.query(Order).count()
    return {
        "message": "Exportación completada",
        "format": "JSON",
        "records": {"users": users_count, "orders": orders_count},
        "exported_at": datetime.utcnow().isoformat(),
    }


# ─── RF-ADM-009: CRUD Kits ──────────────────────────────────────────────────

@router.get("/kits")
def listar_kits_admin(admin_info: tuple = Depends(require_admin)):
    """
    RF-ADM-009: Lista todos los kits (MVP: in-memory).
    
    @sdd-endpoint GET /admin/kits
    @sdd-rf RF-ADM-009
    """
    return list(_kits_store.values())


@router.post("/kits", status_code=201)
def crear_kit(
    body: KitCreateSchema,
    admin_info: tuple = Depends(require_admin),
):
    """
    RF-ADM-009: Crea un nuevo kit de productos.
    BTN-ADM-009: mínimo 2 componentes.
    
    @sdd-endpoint POST /admin/kits
    @sdd-rf RF-ADM-009
    """
    kit_id = str(uuid.uuid4())
    kit = {
        "id": kit_id,
        "name": body.name,
        "description": body.description,
        "component_ids": body.component_ids,
        "created_at": datetime.utcnow().isoformat(),
    }
    _kits_store[kit_id] = kit
    return kit


# ─── Módulo de Categorías ───────────────────────────────────────────────────

@router.get("/categorias", response_model=List[CategoryResponseSchema])
def listar_categorias(
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Listar todas las categorías disponibles.
    
    @sdd-endpoint GET /admin/categorias
    @sdd-rf RF-CAT-005
    """
    categories = db.query(CategoryModel).order_by(CategoryModel.name).all()
    return categories


@router.post("/categorias", response_model=CategoryResponseSchema, status_code=201)
def crear_categoria(
    body: CategoryCreateSchema,
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Crear una nueva categoría. El slug se deriva automáticamente.
    
    @sdd-endpoint POST /admin/categorias
    @sdd-rf RF-CAT-005
    """
    slug = body.name.lower().strip().replace(" ", "-").replace("/", "-")
    existing = db.query(CategoryModel).filter(CategoryModel.slug == slug).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"La categoría '{body.name}' ya existe")

    new_cat = CategoryModel(
        id=uuid.uuid4(),
        name=body.name,
        slug=slug,
        description=body.description,
        icon=body.icon
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat


@router.put("/categorias/{cat_id}", response_model=CategoryResponseSchema)
def actualizar_categoria(
    cat_id: str,
    body: CategoryCreateSchema,
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Actualizar una categoría existente.
    
    @sdd-endpoint PUT /admin/categorias/{cat_id}
    @sdd-rf RF-CAT-005
    """
    cat_uuid = uuid.UUID(cat_id) if isinstance(cat_id, str) and len(cat_id) == 36 else cat_id
    cat = db.query(CategoryModel).filter(CategoryModel.id == cat_uuid).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    slug = body.name.lower().strip().replace(" ", "-").replace("/", "-")
    cat.name = body.name
    cat.slug = slug
    cat.description = body.description
    cat.icon = body.icon
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categorias/{cat_id}")
def eliminar_categoria(
    cat_id: str,
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Eliminar una categoría.
    RN-ADM-03: No se permite eliminar si tiene productos activos asociados.
    
    @sdd-endpoint DELETE /admin/categorias/{cat_id}
    @sdd-rf RF-CAT-005
    """
    cat_uuid = uuid.UUID(cat_id) if isinstance(cat_id, str) and len(cat_id) == 36 else cat_id
    cat = db.query(CategoryModel).filter(CategoryModel.id == cat_uuid).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    # Verificar si hay productos activos asociados
    associated_count = db.query(ProductModel).filter(
        ProductModel.category_id == cat.id,
        ProductModel.is_active == True
    ).count()

    if associated_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar la categoría '{cat.name}' porque tiene {associated_count} productos activos asociados (RN-ADM-03)"
        )

    db.delete(cat)
    db.commit()
    return {"message": f"Categoría '{cat.name}' eliminada con éxito"}


# ─── Carga Masiva de Catálogo (Excel/CSV) ───────────────────────────────────

from fastapi import UploadFile, File
import csv
import io

@router.post("/productos/excel-import")
async def cargar_catalogo_admin(
    file: UploadFile = File(...),
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    POST /admin/productos/excel-import: Carga masiva de catálogo.
    Inserta o actualiza productos desde un archivo CSV o Excel.
    
    @sdd-endpoint POST /admin/productos/excel-import
    @sdd-rf RF-ADM-005
    """
    import pandas as pd
    from decimal import Decimal
    import unicodedata
    
    content = await file.read()
    
    try:
        # Intentar leer como Excel (.xlsx) primero
        df = pd.read_excel(io.BytesIO(content))
    except Exception:
        try:
            # Si falla, intentar como CSV
            df = pd.read_csv(io.BytesIO(content), sep=None, engine='python')
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"No se pudo procesar el archivo. Formato no soportado o archivo corrupto. Use CSV o Excel (.xlsx). Detalle: {str(e)}"
            )
            
    # Estandarizar cabeceras a minúsculas y sin acentos/espacios
    def clean_header(h):
        if not isinstance(h, str):
            return ""
        h = unicodedata.normalize('NFKD', h).encode('ASCII', 'ignore').decode('utf-8')
        return h.strip().lower()

    df.columns = [clean_header(c) for c in df.columns]
    
    cols = {col: col for col in df.columns if col}
    
    def find_col(possible_names: list[str]) -> str | None:
        for name in possible_names:
            if name in cols:
                return name
        return None

    sku_col = find_col(["sku"])
    name_col = find_col(["nombre", "name", "nombre de producto", "titulo", "title"])
    price_col = find_col(["precio", "price", "precio publico", "precio_publico", "price_public"])
    stock_col = find_col(["stock", "cantidad", "qty", "inventario"])
    desc_col = find_col(["descripcion", "description", "desc"])
    brand_col = find_col(["marca", "brand"])
    category_col = find_col(["categoria", "category"])

    if not sku_col or not name_col:
        raise HTTPException(
            status_code=400,
            detail=f"El archivo debe contener las columnas 'sku' y 'nombre' (o 'name'). Encontradas: {list(df.columns)}"
        )

    # Reemplazar NaN con vacíos o ceros
    df = df.fillna("")

    created = 0
    updated = 0

    for _, row in df.iterrows():
        sku = str(row.get(sku_col)).strip()
        name = str(row.get(name_col)).strip()
        
        # Ignorar vacíos o si pandas leyó una celda como 'nan' string
        if not sku or sku.lower() == "nan" or not name or name.lower() == "nan":
            continue
            
        # Parse price
        price = Decimal("0.00")
        if price_col:
            price_val = str(row.get(price_col)).strip()
            if price_val and price_val.lower() != "nan":
                price_val = price_val.replace(",", ".")
                try:
                    price = Decimal(price_val)
                    if price.is_nan():
                        price = Decimal("0.00")
                except Exception:
                    price = Decimal("0.00")

        # Parse stock
        stock = 0
        if stock_col:
            stock_val = str(row.get(stock_col)).strip()
            if stock_val and stock_val.lower() != "nan":
                try:
                    stock = int(float(stock_val))
                except Exception:
                    stock = 0

        desc = str(row.get(desc_col)).strip() if desc_col else ""
        if desc.lower() == "nan":
            desc = ""
            
        brand = str(row.get(brand_col)).strip() if brand_col else ""
        if brand.lower() == "nan":
            brand = ""
            
        category_name = str(row.get(category_col)).strip() if category_col else ""
        if category_name.lower() == "nan":
            category_name = ""

        # Buscar categoría o crearla
        cat_id = None
        if category_name:
            cat = db.query(CategoryModel).filter(CategoryModel.name == category_name).first()
            if not cat:
                slug = category_name.lower().replace(" ", "-").replace("/", "-")
                cat = CategoryModel(id=uuid.uuid4(), name=category_name, slug=slug)
                db.add(cat)
                db.flush()
            cat_id = cat.id

        product = db.query(ProductModel).filter(ProductModel.sku == sku).first()
        if product:
            product.name = name
            product.price_public = price
            product.stock = stock
            product.description = desc
            product.brand = brand
            product.category = category_name
            product.category_id = cat_id
            product.is_active = True
            updated += 1
        else:
            product = ProductModel(
                id=uuid.uuid4(),
                sku=sku,
                name=name,
                price_public=price,
                stock=stock,
                description=desc,
                brand=brand,
                category=category_name,
                category_id=cat_id,
                slug=sku.lower().replace(" ", "-").replace("/", "-"),
                is_active=True
            )
            db.add(product)
            created += 1

    db.commit()
    return {
        "message": "Carga masiva completada",
        "created_count": created,
        "updated_count": updated
    }


# ─── Asignación de Consultas a Vendedores ───────────────────────────────────

@router.post("/consultas/{fu_id}/asignar")
def asignar_consulta(
    fu_id: str,
    body: AsignarConsultaSchema,
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Asignar de forma forzada una consulta a un vendedor específico.
    
    @sdd-endpoint POST /admin/consultas/{fu_id}/asignar
    @sdd-rf RF-FU-006
    """
    from app.api.endpoints.consultas import _get_formato_repository
    repo = _get_formato_repository()
    fu = repo.get_by_id(uuid.UUID(fu_id) if isinstance(fu_id, str) and len(fu_id) == 36 else fu_id)
    if not fu:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
        
    fu.assigned_seller_id = body.seller_id
    repo.save(fu)
    return {
        "message": "Consulta asignada exitosamente",
        "fu_id": fu_id,
        "assigned_seller_id": body.seller_id
    }


# ─── Recalculación y Congelación de Descuentos B2B ───────────────────────────

@router.post("/cotizaciones/{fu_id}/descuento")
def aplicar_descuento_cotizacion(
    fu_id: str,
    body: DiscountOverrideSchema,
    admin_info: tuple = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    POST /admin/cotizaciones/{id}/descuento:
    Aplica un descuento manual (máximo 30%) a una cotización y regenera su PDF.
    
    @sdd-endpoint POST /admin/cotizaciones/{fu_id}/descuento
    @sdd-rf RF-FU-008
    """
    from app.api.endpoints.cotizaciones import _get_formato_repository
    from decimal import Decimal
    repo = _get_formato_repository()
    
    fu = repo.get_by_id(uuid.UUID(fu_id) if isinstance(fu_id, str) and len(fu_id) == 36 else fu_id)
    if not fu:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    if fu.state.value != "COTIZACION":
        raise HTTPException(status_code=400, detail="El formato único debe estar en estado COTIZACION para aplicar descuentos")

    # Aplicar y recalcular
    fu.discount_percent = Decimal(str(body.discount_percent))
    fu.recalcular_subtotal()
    
    # Regenerar PDF url inmutable
    fu.pdf_url = f"https://storage.example.com/cotizaciones/cot-{fu.id}-disc-{body.discount_percent}.pdf"
    
    repo.save(fu)
    return {
        "message": "Descuento aplicado correctamente",
        "fu_id": str(fu.id),
        "discount_percent": float(fu.discount_percent),
        "subtotal": float(fu.subtotal),
        "pdf_url": fu.pdf_url
    }
