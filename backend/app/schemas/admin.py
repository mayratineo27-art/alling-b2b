"""Pydantic schemas for Admin Panel (MOD-ADM-01)."""

from pydantic import BaseModel, EmailStr
from typing import Literal, Optional, List
from datetime import datetime


# ─── User Management Schemas ────────────────────────────────────────────────

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str
    role: Literal["SELLER", "ADMIN"]
    password: str  # will be hashed


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str
    is_suspended: bool
    is_active: bool
    created_at: Optional[datetime] = None


# ─── Product Management Schemas ──────────────────────────────────────────────

class CreateProductRequest(BaseModel):
    name: str
    description: Optional[str] = None
    sku: str
    price_public: float
    category: Optional[str] = None
    brand: Optional[str] = None
    stock: int = 0
    images: Optional[List[str]] = None


class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_public: Optional[float] = None
    images: Optional[List[str]] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    stock: Optional[int] = None


class AdminProductResponse(BaseModel):
    id: str
    name: str
    sku: str
    description: Optional[str] = None
    price_public: float
    category: Optional[str] = None
    brand: Optional[str] = None
    stock: int
    images: Optional[List[str]] = None
    is_active: bool
    created_at: Optional[datetime] = None


# ─── Kit Management Schemas ───────────────────────────────────────────────────

class KitComponentRequest(BaseModel):
    product_id: str
    quantity: int = 1


class CreateKitRequest(BaseModel):
    name: str
    description: Optional[str] = None
    components: List[KitComponentRequest]


class UpdateKitRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    components: Optional[List[KitComponentRequest]] = None


class AdminKitResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    components: List[KitComponentRequest]
    is_active: bool
    created_at: Optional[datetime] = None


# ─── System Config Schemas ────────────────────────────────────────────────────

class SystemConfigUpdate(BaseModel):
    quote_validity_days: Optional[int] = None
    default_stock_min_threshold: Optional[int] = None


class SystemConfigResponse(BaseModel):
    quote_validity_days: int
    default_stock_min_threshold: int


# ─── Metrics & Export Schemas ─────────────────────────────────────────────────

class SalesMetricsResponse(BaseModel):
    revenue_total: float
    orders_count: int
    top_products: List[dict]
    period: str


class ExportResponse(BaseModel):
    export_url: str
    generated_at: str
