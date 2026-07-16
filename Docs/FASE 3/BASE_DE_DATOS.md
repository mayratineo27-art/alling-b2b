# DISEÑO DE BASE DE DATOS — Sistema Alling

|Campo|Valor|
|---|---|
|**ID Documento**|DOC_ALLING_DATABASE_DESIGN_001|
|**Versión**|1.0.0|
|**Estado**|Borrador (pendiente VoBo)|
|**Fuente de verdad**|Modelo de Dominio (DOC_ALLING_DOMAIN_MODEL_001), Inventario Funcional Maestro (10 módulos), Decisiones Técnicas (DECISIONS.md)|
|**Motor**|PostgreSQL 15+|
|**Metodología**|Spec-Driven Development (SpecDD)|
|**Fecha**|30 de junio de 2026|

---

## 1. Diseño de Tablas

### 1.1 `users`

**Descripción:** Almacena la identidad, credenciales y configuración de seguridad de los actores humanos (CUSTOMER, SELLER, ADMIN). **Módulos:** MOD-AUT-01, MOD-ADM-01, MOD-FU-01, MOD-CHK-01, MOD-CON-01, MOD-COT-01

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`email`|VARCHAR(200)|NO|NO|NO|SÍ|—|
|`name`|VARCHAR(200)|NO|NO|NO|NO|—|
|`role`|VARCHAR(20)|NO|NO|NO|NO|—|
|`auth_provider`|VARCHAR(20)|NO|NO|NO|NO|—|
|`google_sub`|VARCHAR(200)|SÍ|NO|NO|SÍ|NULL|
|`password_hash`|VARCHAR(255)|SÍ|NO|NO|NO|NULL|
|`mfa_enabled`|BOOLEAN|NO|NO|NO|NO|`false`|
|`mfa_secret`|VARCHAR(255)|SÍ|NO|NO|NO|NULL|
|`mfa_backup_codes`|JSONB|SÍ|NO|NO|NO|NULL|
|`is_suspended`|BOOLEAN|NO|NO|NO|NO|`false`|
|`is_active`|BOOLEAN|NO|NO|NO|NO|`true`|
|`deleted_at`|TIMESTAMPTZ|SÍ|NO|NO|NO|NULL|
|`created_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|
|`updated_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|

**Índices:** `idx_users_email` (unique), `idx_users_google_sub` (unique), `idx_users_role`, `idx_users_is_active`. **Restricciones:** `CHECK (role IN ('CUSTOMER', 'SELLER', 'ADMIN'))`, `CHECK (auth_provider IN ('GOOGLE', 'LOCAL'))`. **Relaciones:** 1:N con `formato_unicos` (owner_id), 1:N con `orders` (customer_id), 1:N con `audit_logs` (actor_id). **Triggers asociados:** Trigger de auditoría (AUTO-SYS-001) para registrar mutaciones. Trigger de soft-delete (DEC-028). **Eventos relacionados:** EVT-AUT-001, EVT-AUT-002, EVT-ADM-001, EVT-ADM-002, EVT-ADM-003. **Servicios:** UserService, AuthService, MFAService.

### 1.2 `categories`

**Descripción:** Clasificación jerárquica de productos. **Módulos:** MOD-CAT-01, MOD-ADM-01

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`name`|VARCHAR(100)|NO|NO|NO|SÍ|—|
|`slug`|VARCHAR(100)|NO|NO|NO|SÍ|—|
|`description`|TEXT|SÍ|NO|NO|NO|NULL|
|`parent_id`|UUID|SÍ|NO|SÍ (self)|NO|NULL|
|`is_active`|BOOLEAN|NO|NO|NO|NO|`true`|
|`created_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|

**Índices:** `idx_categories_slug` (unique), `idx_categories_parent_id`. **Restricciones:** `CHECK (name != '')`. **Relaciones:** 1:N con `products`, 1:N recursivo (parent_id). **Triggers asociados:** Trigger de auditoría. **Eventos relacionados:** EVT-ADM-004. **Servicios:** ProductService.

### 1.3 `products`

**Descripción:** Catálogo de productos comercializables. **Módulos:** MOD-CAT-01, MOD-ADM-01, MOD-SEL-01, MOD-DIS-01, MOD-FU-01

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`sku`|VARCHAR(50)|NO|NO|NO|SÍ|—|
|`slug`|VARCHAR(100)|NO|NO|NO|SÍ|—|
|`name`|VARCHAR(200)|NO|NO|NO|NO|—|
|`description`|TEXT|SÍ|NO|NO|NO|NULL|
|`brand`|VARCHAR(100)|SÍ|NO|NO|NO|NULL|
|`price_public`|DECIMAL(10,2)|NO|NO|NO|NO|—|
|`price_wholesale`|DECIMAL(10,2)|SÍ|NO|NO|NO|NULL|
|`stock`|INTEGER|NO|NO|NO|NO|`0`|
|`stock_min_threshold`|INTEGER|SÍ|NO|NO|NO|NULL|
|`is_active`|BOOLEAN|NO|NO|NO|NO|`true`|
|`images`|JSONB|SÍ|NO|NO|NO|'[]'::jsonb|
|`category_id`|UUID|SÍ|NO|SÍ|NO|NULL|
|`created_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|
|`updated_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|

**Índices:** `idx_products_sku` (unique), `idx_products_slug` (unique), `idx_products_category_id`, `idx_products_is_active`, `idx_products_stock`. **Restricciones:** `CHECK (price_public > 0)`, `CHECK (stock >= 0)`, `CHECK (stock_min_threshold IS NULL OR stock_min_threshold >= 0)`, `CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')`. **Relaciones:** N:1 con `categories`, 1:N con `formato_unico_items`. **Triggers asociados:** Trigger de auditoría. Trigger de recalculo de badge (AUTO-CAT-001). **Eventos relacionados:** EVT-CAT-001, EVT-CAT-002, EVT-ADM-004, EVT-DIS-001, EVT-DIS-002, EVT-SEL-001, EVT-SEL-002. **Servicios:** ProductService, ProductQueryService, InventoryService, PricingService.

### 1.4 `formato_unicos`

**Descripción:** Contenedor central de intención de compra/consulta/cotización. **Módulos:** MOD-FU-01, MOD-CHK-01, MOD-CON-01, MOD-COT-01, MOD-SEL-01

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`state`|VARCHAR(20)|NO|NO|NO|NO|—|
|`owner_id`|UUID|SÍ|NO|SÍ|NO|NULL|
|`guest_token`|VARCHAR(100)|SÍ|NO|NO|SÍ|NULL|
|`current_order_id`|UUID|SÍ|NO|SÍ|NO|NULL|
|`seller_id`|UUID|SÍ|NO|SÍ|NO|NULL|
|`consultant_note`|TEXT|SÍ|NO|NO|NO|NULL|
|`expires_at`|TIMESTAMPTZ|SÍ|NO|NO|NO|NULL|
|`pdf_url`|VARCHAR(500)|SÍ|NO|NO|NO|NULL|
|`subtotal`|DECIMAL(10,2)|NO|NO|NO|NO|`0.00`|
|`igv`|DECIMAL(10,2)|NO|NO|NO|NO|`0.00`|
|`total`|DECIMAL(10,2)|NO|NO|NO|NO|`0.00`|
|`created_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|
|`updated_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|

**Índices:** `idx_fu_state`, `idx_fu_owner_id`, `idx_fu_guest_token` (unique), `idx_fu_current_order_id`, `idx_fu_seller_id`, `idx_fu_expires_at`. **Restricciones:** `CHECK (state IN ('BORRADOR', 'CONSULTA', 'COTIZACIÓN', 'EXPIRADA', 'PEDIDO', 'CONFIRMADO', 'CANCELADO', 'RESUELTA'))`. **Relaciones:** N:1 con `users` (owner_id, seller_id), 1:1 con `orders` (current_order_id), 1:N con `formato_unico_items`, 1:N con `formato_unico_transitions`. **Triggers asociados:** Trigger de auditoría. **Eventos relacionados:** EVT-FU-001 a EVT-FU-012, EVT-CON-001. **Servicios:** FormatoUnicoService, FormatoUnicoQueryService, StateMachineService.

### 1.5 `formato_unico_items`

**Descripción:** Ítems individuales dentro de un Formato Único. **Módulos:** MOD-FU-01, MOD-CAT-01, MOD-CHK-01, MOD-COT-01

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`formato_unico_id`|UUID|NO|NO|SÍ|NO|—|
|`product_id`|UUID|NO|NO|SÍ|NO|—|
|`quantity`|INTEGER|NO|NO|NO|NO|—|
|`price_at_time`|DECIMAL(10,2)|SÍ|NO|NO|NO|NULL|
|`created_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|
|`updated_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|

**Índices:** `idx_fui_fu_id`, `idx_fui_product_id`. **Restricciones:** `CHECK (quantity >= 1)`, `CHECK (price_at_time IS NULL OR price_at_time > 0)`. **Relaciones:** N:1 con `formato_unicos`, N:1 con `products`. **Triggers asociados:** Trigger de auditoría. **Eventos relacionados:** EVT-FU-002. **Servicios:** FormatoUnicoService, PricingService.

### 1.6 `formato_unico_transitions`

**Descripción:** Historial inmutable de transiciones de estado del Formato Único. **Módulos:** MOD-FU-01, MOD-CON-01, MOD-CHK-01

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`formato_unico_id`|UUID|NO|NO|SÍ|NO|—|
|`from_state`|VARCHAR(20)|NO|NO|NO|NO|—|
|`to_state`|VARCHAR(20)|NO|NO|NO|NO|—|
|`transition_code`|VARCHAR(20)|NO|NO|NO|NO|—|
|`actor_id`|UUID|SÍ|NO|SÍ|NO|NULL|
|`actor_role`|VARCHAR(20)|NO|NO|NO|NO|—|
|`timestamp`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|
|`metadata`|JSONB|SÍ|NO|NO|NO|NULL|

**Índices:** `idx_fut_fu_id`, `idx_fut_timestamp`. **Restricciones:** `CHECK (from_state != to_state)`. **Relaciones:** N:1 con `formato_unicos`, N:1 con `users` (actor_id). **Triggers asociados:** Trigger de inmutabilidad (bloquea UPDATE/DELETE). **Eventos relacionados:** Todos los EVT-FU-*. **Servicios:** StateMachineService.

### 1.7 `orders`

**Descripción:** Transacciones comerciales formales derivadas de un Formato Único. **Módulos:** MOD-CHK-01, MOD-SEL-01, MOD-ADM-01

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`formato_unico_id`|UUID|NO|NO|SÍ|NO|—|
|`customer_id`|UUID|SÍ|NO|SÍ|NO|NULL|
|`guest_email`|VARCHAR(200)|SÍ|NO|NO|NO|NULL|
|`guest_token`|VARCHAR(100)|SÍ|NO|NO|NO|NULL|
|`status`|VARCHAR(30)|NO|NO|NO|NO|—|
|`dni_or_ruc`|VARCHAR(11)|SÍ|NO|NO|NO|NULL|
|`document_type`|VARCHAR(10)|SÍ|NO|NO|NO|NULL|
|`shipping_address`|JSONB|SÍ|NO|NO|NO|NULL|
|`shipping_cost`|DECIMAL(10,2)|NO|NO|NO|NO|`0.00`|
|`subtotal`|DECIMAL(10,2)|NO|NO|NO|NO|`0.00`|
|`igv`|DECIMAL(10,2)|NO|NO|NO|NO|`0.00`|
|`total`|DECIMAL(10,2)|NO|NO|NO|NO|`0.00`|
|`payment_method`|VARCHAR(50)|SÍ|NO|NO|NO|NULL|
|`cancellation_reason`|TEXT|SÍ|NO|NO|NO|NULL|
|`cancelled_by`|UUID|SÍ|NO|SÍ|NO|NULL|
|`order_token`|VARCHAR(100)|NO|NO|NO|SÍ|—|
|`created_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|
|`updated_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|

**Índices:** `idx_orders_fu_id`, `idx_orders_customer_id`, `idx_orders_status`, `idx_orders_order_token` (unique), `idx_orders_created_at`. **Restricciones:** `CHECK (status IN ('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'REFUNDED'))`, `CHECK (shipping_cost >= 0)`, `CHECK (total >= 0)`, `CHECK (dni_or_ruc IS NULL OR dni_or_ruc ~ '^\d{8}$' OR dni_or_ruc ~ '^\d{11}$')`. **Relaciones:** N:1 con `formato_unicos`, N:1 con `users` (customer_id, cancelled_by), 1:1 con `shipping_guides`, 1:1 con `payment_idempotency_keys`. **Triggers asociados:** Trigger de auditoría. **Eventos relacionados:** EVT-CHK-001 a EVT-CHK-004, EVT-SEL-003. **Servicios:** OrderService, OrderQueryService, PaymentService, ShippingService.

### 1.8 `shipping_guides`

**Descripción:** Guías de envío generadas para pedidos despachados. **Módulos:** MOD-SEL-01, MOD-CHK-01

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`order_id`|UUID|NO|NO|SÍ|SÍ|—|
|`tracking_code`|VARCHAR(100)|NO|NO|NO|NO|—|
|`weight_kg`|DECIMAL(6,2)|NO|NO|NO|NO|—|
|`packages_count`|INTEGER|NO|NO|NO|NO|—|
|`notes`|TEXT|SÍ|NO|NO|NO|NULL|
|`created_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|

**Índices:** `idx_sg_order_id` (unique). **Restricciones:** `CHECK (weight_kg > 0)`, `CHECK (packages_count >= 1)`. **Relaciones:** 1:1 con `orders`. **Triggers asociados:** Trigger de auditoría. **Eventos relacionados:** EVT-SEL-003. **Servicios:** ShippingService.

### 1.9 `payment_idempotency_keys`

**Descripción:** Registro de eventos de pago procesados para garantizar idempotencia. **Módulos:** MOD-CHK-01

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`order_id`|UUID|NO|NO|SÍ|SÍ|—|
|`event_id`|VARCHAR(200)|NO|NO|NO|SÍ|—|
|`processed_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|

**Índices:** `idx_pik_order_id` (unique), `idx_pik_event_id` (unique). **Restricciones:** Ninguna adicional. **Relaciones:** 1:1 con `orders`. **Triggers asociados:** Trigger de auditoría. **Eventos relacionados:** EVT-CHK-002. **Servicios:** IdempotencyService, PaymentService.

### 1.10 `system_configs`

**Descripción:** Parámetros globales del sistema. **Módulos:** MOD-ADM-01, MOD-SEL-01, MOD-FU-01

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`key`|VARCHAR(100)|NO|NO|NO|SÍ|—|
|`value`|TEXT|NO|NO|NO|NO|—|
|`updated_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|
|`updated_by`|UUID|SÍ|NO|SÍ|NO|NULL|

**Índices:** `idx_sc_key` (unique). **Restricciones:** Ninguna adicional. **Relaciones:** N:1 con `users` (updated_by). **Triggers asociados:** Trigger de auditoría. **Eventos relacionados:** EVT-ADM-005. **Servicios:** SystemConfigService.

### 1.11 `distributor_api_keys`

**Descripción:** Credenciales de autenticación para el sistema DISTRIBUTOR. **Módulos:** MOD-DIS-01

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`key_id`|VARCHAR(100)|NO|NO|NO|SÍ|—|
|`hmac_secret`|VARCHAR(255)|NO|NO|NO|NO|—|
|`ip_allowlist`|JSONB|SÍ|NO|NO|NO|'[]'::jsonb|
|`is_active`|BOOLEAN|NO|NO|NO|NO|`true`|
|`created_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|

**Índices:** `idx_dak_key_id` (unique). **Restricciones:** Ninguna adicional. **Relaciones:** Ninguna directa. **Triggers asociados:** Trigger de auditoría. **Eventos relacionados:** Ninguno propio. **Servicios:** DistributorAuthService.

### 1.12 `nonce_registry`

**Descripción:** Registro de nonces usados para prevenir replay attacks. **Módulos:** MOD-DIS-01

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`nonce`|VARCHAR(100)|NO|NO|NO|SÍ|—|
|`used_at`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|

**Índices:** `idx_nr_nonce` (unique), `idx_nr_used_at`. **Restricciones:** Ninguna adicional. **Relaciones:** Ninguna directa. **Triggers asociados:** Trigger de limpieza automática (job mensual). **Eventos relacionados:** Ninguno propio. **Servicios:** IdempotencyService, DistributorAuthService.

### 1.13 `audit_logs`

**Descripción:** Registro inmutable de todas las acciones mutantes del sistema. **Módulos:** MOD-SYS-01 (todos los módulos consumen)

|Columna|Tipo|Null|PK|FK|Unique|Default|
|---|---|---|---|---|---|---|
|`id`|UUID|NO|SÍ|NO|SÍ|`gen_random_uuid()`|
|`timestamp`|TIMESTAMPTZ|NO|NO|NO|NO|`now()`|
|`actor_id`|UUID|SÍ|NO|SÍ|NO|NULL|
|`actor_role`|VARCHAR(20)|NO|NO|NO|NO|—|
|`event_type`|VARCHAR(100)|NO|NO|NO|NO|—|
|`resource_type`|VARCHAR(100)|NO|NO|NO|NO|—|
|`resource_id`|UUID|SÍ|NO|NO|NO|NULL|
|`action`|VARCHAR(50)|NO|NO|NO|NO|—|
|`result`|VARCHAR(20)|NO|NO|NO|NO|—|
|`ip_address`|INET|SÍ|NO|NO|NO|NULL|
|`user_agent`|TEXT|SÍ|NO|NO|NO|NULL|
|`metadata`|JSONB|SÍ|NO|NO|NO|NULL|

**Índices:** `idx_al_timestamp`, `idx_al_actor_id`, `idx_al_event_type`, `idx_al_resource_type`. **Restricciones:** `CHECK (result IN ('SUCCESS', 'DENIED', 'ERROR'))`. **Relaciones:** N:1 con `users` (actor_id). **Triggers asociados:** Trigger de inmutabilidad (bloquea UPDATE/DELETE - INV-001). Trigger de anonimización (DEC-029). **Eventos relacionados:** Todos los eventos del sistema. **Servicios:** Capa transversal de auditoría.

---

## 2. Índices Generales

|Tabla|Índice|Tipo|Justificación (RNF)|
|---|---|---|---|
|`products`|`idx_products_slug`|B-tree Unique|RNF-PERF-001 (búsqueda rápida por slug)|
|`products`|`idx_products_category_id`|B-tree|RNF-PERF-001 (filtrado por categoría)|
|`formato_unicos`|`idx_fu_owner_id`|B-tree|RNF-SEC-001 (RLS: CUSTOMER ve los suyos)|
|`formato_unicos`|`idx_fu_state`|B-tree|RNF-PERF-001 (filtros de estado en paneles)|
|`orders`|`idx_orders_customer_id`|B-tree|RNF-SEC-001 (RLS: CUSTOMER ve los suyos)|
|`orders`|`idx_orders_status`|B-tree|RNF-PERF-001 (cola de pedidos SELLER)|
|`orders`|`idx_orders_order_token`|B-tree Unique|RNF-SEC-007 (acceso GUEST opaco)|
|`audit_logs`|`idx_al_timestamp`|B-tree|RNF-REL-004 (consultas de auditoría por fecha)|

---

## 3. Constraints

### 3.1 Check Constraints

- `products.price_public > 0`
- `products.stock >= 0`
- `formato_unico_items.quantity >= 1`
- `orders.shipping_cost >= 0`
- `orders.total >= 0`
- `users.role IN ('CUSTOMER', 'SELLER', 'ADMIN')`
- `formato_unicos.state IN (...)` (FSM-01)
- `orders.status IN (...)` (FSM-02)

### 3.2 Unique Constraints

- `users.email`
- `products.sku`, `products.slug`
- `formato_unicos.guest_token` (cuando no es NULL)
- `orders.order_token`
- `payment_idempotency_keys.event_id`
- `nonce_registry.nonce`

---

## 4. Soft Delete

**Tabla afectada:** `users` **Decisión:** DEC-028 (Soft-delete obligatorio). **Implementación:**

- Columna `is_active` (BOOLEAN, default `true`).
- Columna `deleted_at` (TIMESTAMPTZ, NULL por defecto).
- **Regla:** Ninguna operación de `DELETE` físico está permitida. Las consultas de aplicación deben filtrar por `is_active = true`.
- **Integridad:** Las tablas históricas (`orders`, `audit_logs`, `formato_unicos`) mantienen la FK `customer_id`/`actor_id` apuntando al usuario eliminado, preservando la trazabilidad.

---

## 5. Auditoría

**Tabla:** `audit_logs` **Invariante:** INV-001 (Solo INSERT, nunca DELETE/UPDATE). **Mecanismo:**

1. **Trigger de Inmutabilidad:** Un trigger a nivel de base de datos (`BEFORE UPDATE OR DELETE ON audit_logs`) lanza una excepción si se intenta modificar o borrar un registro.
2. **Trigger de Registro:** Un trigger (`AFTER INSERT OR UPDATE OR DELETE` en tablas de negocio) inserta automáticamente un registro en `audit_logs` capturando `actor_id`, `action`, `timestamp`, etc. Si este trigger falla, la transacción de negocio se revierte (AUTO-SYS-001).
3. **Anonimización:** Un job programado (AUTO-SYS-003) ejecuta mensualmente un `UPDATE` que establece `ip_address = NULL`, `user_agent = NULL`, `actor_id = NULL` para registros con `timestamp < now() - interval '12 months'`. (Nota: Esto es una excepción controlada a la inmutabilidad de datos PII, no de la existencia del registro).

---

## 6. Migraciones Importantes

1. **M001 - Schema Inicial:** Creación de todas las tablas, tipos ENUM (si se usan nativos en lugar de VARCHAR), índices básicos y constraints.
2. **M002 - RLS Policies:** Habilitación de Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) y creación de políticas según `rbac_policy.md`.
3. **M003 - Audit Triggers:** Implementación de triggers de inmutabilidad y registro automático en `audit_logs`.
4. **M004 - Soft Delete Users:** Adición de columnas `is_active` y `deleted_at` a `users` (si no se crearon en M001).
5. **M005 - Anonimización Job:** Configuración del job programado para la anonimización de `audit_logs`.

---

## 7. Convenciones

- **Nombres de tablas:** `snake_case`, plural (ej. `users`, `formato_unicos`).
- **Nombres de columnas:** `snake_case` (ej. `price_at_time`, `is_active`).
- **Primary Keys:** Siempre `UUID` tipo `id`, default `gen_random_uuid()`.
- **Fechas:** Siempre `TIMESTAMPTZ` (con zona horaria), nombres `created_at`, `updated_at`.
- **Foreign Keys:** Nombradas como `[tabla_referenciada]_id` (ej. `customer_id`, `category_id`).
- **JSONB:** Usado para datos flexibles o estructurados pero no relacionales (`images`, `shipping_address`, `metadata`, `mfa_backup_codes`, `ip_allowlist`).

---

## 8. Optimización

- **JSONB para direcciones y metadatos:** Permite consultas flexibles sin alterar el schema.
- **Índices parciales:** Se recomienda `CREATE INDEX idx_orders_pending ON orders (created_at) WHERE status = 'PENDING_PAYMENT'` para optimizar el job de timeout (AUTO-CHK-003).
- **Vistas Materializadas:** Para `OPS-ADM-006` (Métricas de ventas), se utilizarán vistas materializadas (`analytics.sales_summary`) refrescadas periódicamente, evitando cálculos en tiempo real sobre grandes volúmenes de `orders`.

---

## 9. Integridad Referencial

- **ON DELETE RESTRICT:** Aplicado por defecto en todas las FKs críticas (`orders.customer_id`, `formato_unicos.owner_id`). Esto previene la eliminación física de usuarios si tienen historial.
- **Soft Delete:** La integridad se mantiene mediante `is_active = false` en `users`, permitiendo que las FKs sigan apuntando a registros válidos pero lógicamente eliminados.
- **Audit Logs:** La FK `audit_logs.actor_id` es `ON DELETE SET NULL` o se mantiene restrictiva dependiendo de la decisión final de anonimización (DEC-029).

---

## Correspondencia entre Entidades y Tablas

|Entidad de Dominio|Tabla PostgreSQL|Agregado|
|---|---|---|
|`User`|`users`|User|
|`Product`|`products`|Catalog|
|`Category`|`categories`|Catalog|
|`FormatoUnico`|`formato_unicos`|FormatoUnico|
|`FormatoUnicoItem`|`formato_unico_items`|FormatoUnico|
|`FormatoUnicoTransition`|`formato_unico_transitions`|FormatoUnico|
|`Order`|`orders`|Order|
|`ShippingGuide`|`shipping_guides`|Order|
|`PaymentIdempotencyKey`|`payment_idempotency_keys`|Order|
|`SystemConfig`|`system_configs`|SystemConfiguration|
|`DistributorApiKey`|`distributor_api_keys`|DistributorIntegration|
|`NonceRegistry`|`nonce_registry`|DistributorIntegration|
|`AuditLog`|`audit_logs`|AuditTrail|

---

## Vacíos documentales detectados

1. **Estrategia de Particionamiento para `audit_logs`:**
    - **Razón:** El volumen de `audit_logs` crecerá linealmente con cada mutación. El Modelo de Dominio y los módulos no especifican si se usará particionamiento por rango (ej. mensual) para optimizar consultas y la anonimización.
    - **Impacto:** No se puede definir la estrategia de particionamiento en la migración inicial sin esta decisión.
2. **Definición exacta de Vistas Materializadas para Analytics:**
    - **Razón:** `OPS-ADM-006` requiere métricas de ventas. Aunque se infiere el uso de vistas materializadas, el contexto no define las columnas exactas, la frecuencia de refresco ni el nombre del schema (`analytics` es una inferencia).
    - **Impacto:** No se puede generar el script SQL de la vista materializada.
3. **Mecanismo exacto del Trigger de Auditoría (AUTO-SYS-001):**
    - **Razón:** Se documenta la _invariante_ de que toda mutación debe registrarse y que si falla se revierte. Sin embargo, la implementación técnica específica (¿un trigger genérico por tabla? ¿una función PL/pgSQL que recibe parámetros?) no está definida en los módulos.
    - **Impacto:** La migración M003 requiere una decisión de implementación técnica.
4. **Políticas RLS específicas para `system_configs` y `distributor_api_keys`:**
    - **Razón:** `rbac_policy.md` define RLS para `users`, `products`, `formato_unico`, `orders` y `audit_logs`. No especifica explícitamente las políticas para tablas de configuración y credenciales, aunque se infiere que solo ADMIN/DISTRIBUTOR respectivamente deben tener acceso.
    - **Impacto:** Las políticas RLS para estas tablas deben inferirse o dejarse como decisión técnica pendiente.

---


## 🆕 EXTENSIONES v1.2 (14 Mejoras UI/UX e Integraciones)

### 📋 Nuevas Tablas

#### Tabla: `kits`

```sql
CREATE TABLE kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dynamic_price BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_kits_name ON kits(name);
CREATE INDEX idx_kits_is_active ON kits(is_active);

-- Trigger para updated_at
CREATE TRIGGER trigger_kits_updated_at
    BEFORE UPDATE ON kits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    
```

#### Tabla: `kit_components`

```SQL
CREATE TABLE kit_components (
    kit_id UUID REFERENCES kits(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity >= 1),
    PRIMARY KEY (kit_id, product_id)
);

-- Índices
CREATE INDEX idx_kit_components_kit ON kit_components(kit_id);
CREATE INDEX idx_kit_components_product ON kit_components(product_id);
```

#### Tabla: `favorites`


```SQL
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_product UNIQUE (user_id, product_id)
);

-- Índices
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);
CREATE INDEX idx_favorites_user_product ON favorites(user_id, product_id);
```

#### Tabla: `landing_config`

```SQL
CREATE TABLE landing_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hero_image_url TEXT,
    featured_product_ids UUID[] DEFAULT '{}',
    show_prices_in_featured BOOLEAN DEFAULT FALSE,
    news_section_text TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solo una fila permitida
CREATE UNIQUE INDEX idx_landing_config_singleton ON landing_config((TRUE));
```

#### Tabla: `notifications`

```SQL
CREATE TYPE notification_type AS ENUM (
    'COTIZATION_EXPIRING',
    'CONSULT_ANSWER',
    'ORDER_CONFIRMED',
    'ORDER_SHIPPED'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(500) NOT NULL,
    notification_type notification_type NOT NULL,
    reference_id UUID,  -- ID de FormatoUnico o Order
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Índices
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

```

### 🔧 Modificaciones a Tablas Existentes

#### Tabla: `products`

```SQL
-- Agregar columna
ALTER TABLE products 
    ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;

-- Índice
CREATE INDEX idx_products_is_featured ON products(is_featured);

```

#### Tabla: `orders`

```SQL
-- Agregar columna
ALTER TABLE orders 
    ADD COLUMN reserved_stock_released_at TIMESTAMPTZ;

-- Índice para job de expiración
CREATE INDEX idx_orders_pending_payment_created 
    ON orders(created_at) 
    WHERE status = 'PENDING_PAYMENT';
```


#### Tabla: `users`

```SQL
-- Agregar columnas de facturación y Telegram
ALTER TABLE users 
    ADD COLUMN telegram_username VARCHAR(100),
    ADD COLUMN billing_address TEXT,
    ADD COLUMN billing_dni VARCHAR(8),
    ADD COLUMN billing_ruc VARCHAR(11),
    ADD COLUMN billing_company_name VARCHAR(255);

-- Índices
CREATE INDEX idx_users_telegram_username ON users(telegram_username);
```

### 📊 Vistas Materializadas (Opcional para Performance)

#### Vista: `v_kits_with_stock`

```SQL
CREATE MATERIALIZED VIEW v_kits_with_stock AS
SELECT 
    k.id,
    k.name,
    k.dynamic_price,
    k.is_active,
    k.calculated_price,
    MIN(p.stock) as kit_stock,
    COUNT(kc.product_id) as component_count
FROM kits k
LEFT JOIN kit_components kc ON k.id = kc.kit_id
LEFT JOIN products p ON kc.product_id = p.id
GROUP BY k.id, k.name, k.dynamic_price, k.is_active, k.calculated_price;

-- Índice
CREATE UNIQUE INDEX idx_v_kits_with_stock_id ON v_kits_with_stock(id);

-- Refresh cada 5 minutos (job programado)
-- REFRESH MATERIALIZED VIEW v_kits_with_stock;
```

### 🔐 Row Level Security (RLS) - Nuevas Políticas

#### Tabla: `favorites`

```SQL
-- Habilitar RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own favorites"
    ON favorites FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Users can insert own favorites"
    ON favorites FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Users can delete own favorites"
    ON favorites FOR DELETE
    USING (user_id = current_setting('app.current_user_id')::uuid);
```

#### Tabla: `notifications`
```SQL
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = current_setting('app.current_user_id')::uuid);
```
#### Tabla: `landing_config`

```SQL
ALTER TABLE landing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view landing config"
    ON landing_config FOR SELECT
    USING (true);

CREATE POLICY "Admins can update landing config"
    ON landing_config FOR UPDATE
    USING (current_setting('app.current_role') = 'ADMIN');
```

