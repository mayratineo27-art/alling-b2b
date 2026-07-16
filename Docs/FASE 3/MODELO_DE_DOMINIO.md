# MODELO DE DOMINIO — Sistema Alling

|Campo|Valor|
|---|---|
|**ID Documento**|DOC_ALLING_DOMAIN_MODEL_001|
|**Versión**|1.0.0|
|**Estado**|Borrador (pendiente VoBo)|
|**Fuente de verdad**|Inventario Funcional Maestro (10 módulos normalizados)|
|**Metodología**|Domain-Driven Design (DDD) + Spec-Driven Development (SpecDD)|
|**Fecha**|30 de junio de 2026|

---

## 1. Introducción

Este documento consolida el Modelo de Dominio del sistema Alling, derivado **exclusivamente** de los 10 módulos del Inventario Funcional Maestro. No se inventan entidades, atributos, relaciones ni invariantes. Todo elemento documentado tiene trazabilidad directa a al menos un módulo fuente.

El modelo sigue los principios de **Domain-Driven Design (DDD)**:

- **Agregados** como unidades de consistencia transaccional.
- **Value Objects** para conceptos sin identidad propia.
- **Entidades** con identidad y ciclo de vida.
- **Servicios de Dominio** para lógica que no pertenece a una entidad específica.
- **Eventos de Dominio** para comunicación asíncrona entre agregados.
- **Invariantes** como reglas de integridad no negociables.

---

## 2. Agregados

### 2.1 Agregado: `Catalog`

**Responsabilidad:** Gestionar la oferta comercial pública del sistema (productos y categorías).

**Entidades:**

- `Category`
- `Product`

**Raíz del Agregado:** `Product`

**Invariantes:**

- `Product.sku` debe ser único en todo el catálogo.
- `Product.slug` debe ser único y seguir el patrón `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- `Product.price_public > 0`.
- `Product.stock >= 0`.
- `Product.is_active = true` es condición necesaria para aparecer en búsquedas públicas.

**Servicios de Dominio relacionados:**

- `ProductService` (MOD-ADM-01, MOD-DIS-01)
- `ProductQueryService` (MOD-CAT-01, MOD-SEL-01)
- `InventoryService` (MOD-SEL-01, MOD-DIS-01)
- `PricingService` (MOD-FU-01, MOD-DIS-01)

**Eventos de Dominio relacionados:**

- `EVT-CAT-001` (ProductoVisto)
- `EVT-CAT-002` (ProductoAgregadoAFormato)
- `EVT-ADM-004` (ProductoCreado/ProductoActualizado/ProductoDesactivado)
- `EVT-DIS-001` (PrecioSincronizado)
- `EVT-DIS-002` (StockSincronizado)
- `EVT-DIS-003` (SincronizacionRechazada)
- `EVT-SEL-001` (StockActualizado)
- `EVT-SEL-002` (UmbralStockActualizado)

**Módulos donde participa:**

- MOD-CAT-01 (consumidor principal)
- MOD-ADM-01 (gestión CRUD)
- MOD-SEL-01 (gestión operativa de stock)
- MOD-DIS-01 (sincronización masiva)
- MOD-FU-01 (validación de stock en transiciones)
- MOD-COT-01 (lectura de precios fijados)

---

### 2.2 Agregado: `FormatoUnico`

**Responsabilidad:** Contenedor central de intención de compra/consulta/cotización del usuario. Gestiona el ciclo de vida comercial desde la selección de productos hasta la conversión en pedido o consulta.

**Entidades:**

- `FormatoUnico` (raíz)
- `FormatoUnicoItem`
- `FormatoUnicoTransition`

**Value Objects:**

- `PriceSnapshot` (price_at_time + timestamp de fijación)

**Invariantes:**

- Un GUEST solo puede tener **1** `FormatoUnico` activo en estado `BORRADOR` vinculado a su `guest_token` (RN-GUEST-01).
- Un `FormatoUnico` solo puede tener **1** `Order` en estado `PENDING_PAYMENT` simultáneamente (RN-CHK-010).
- Las transiciones de estado deben respetar la FSM-01 (no se permiten saltos no definidos).
- Un `FormatoUnico` en estado `PEDIDO` con pago confirmado (`CONFIRMADO`) es **inmutable** (RN-FU-02).
- `FormatoUnicoItem.quantity >= 1` y `quantity <= Product.stock` al momento de la transición.
- `price_at_time` se fija en la primera transición a `COTIZACIÓN` o `PEDIDO` y es inmutable thereafter (RN-CHECKOUT-02).

**Servicios de Dominio relacionados:**

- `FormatoUnicoService` (MOD-FU-01)
- `FormatoUnicoQueryService` (MOD-FU-01, MOD-CON-01, MOD-COT-01)
- `StateMachineService` (MOD-FU-01, MOD-CHK-01, MOD-CON-01, MOD-SEL-01)

**Eventos de Dominio relacionados:**

- `EVT-FU-001` (FormatoUnicoCreado)
- `EVT-FU-002` (ItemAgregado/ItemActualizado/ItemEliminado)
- `EVT-FU-003` (ConsultaIniciada)
- `EVT-FU-004` (CotizacionGenerada)
- `EVT-FU-005` (PedidoIniciado)
- `EVT-FU-006` (CotizacionExpirada)
- `EVT-FU-007` (CotizacionRegenerada)
- `EVT-FU-008` (FormatoUnicoMigrado/FormatoUnicoCombinado)
- `EVT-FU-011` (FormatoUnicoReintentado)
- `EVT-FU-012` (ConsultaResuelta)

**Módulos donde participa:**

- MOD-FU-01 (gestión principal)
- MOD-CAT-01 (origen de ítems vía OPS-CAT-003)
- MOD-CHK-01 (transición a PEDIDO y confirmación de pago)
- MOD-CON-01 (gestión de consultas)
- MOD-COT-01 (vista SELLER de cotizaciones)
- MOD-SEL-01 (lectura de pedidos para despacho)
- MOD-AUT-01 (migración GUEST→CUSTOMER)

---

### 2.3 Agregado: `Order`

**Responsabilidad:** Representar una transacción comercial formal con estado de pago y logística.

**Entidades:**

- `Order` (raíz)
- `ShippingGuide`

**Value Objects:**

- `ShippingAddress` (calle, distrito, provincia, departamento, referencia)
- `Money` (amount + currency, implícito en `total`, `shipping_cost`, `price_at_time`)

**Invariantes:**

- `Order.status` debe seguir la FSM-02 (no se permiten transiciones inválidas).
- `Order.shipping_cost >= 0`.
- `Order.total = subtotal + IGV (18%) + shipping_cost - discounts`.
- Un `Order` en estado `PAID` o posterior es **inmutable** en sus datos de facturación.
- `Order.formato_unico_id` referencia al `FormatoUnico` origen (cardinalidad N:1 desde Order hacia FormatoUnico).

**Servicios de Dominio relacionados:**

- `OrderService` (MOD-CHK-01)
- `OrderQueryService` (MOD-SEL-01, MOD-ADM-01)
- `PaymentService` (MOD-CHK-01)
- `ShippingService` (MOD-CHK-01, MOD-SEL-01)
- `IdempotencyService` (MOD-CHK-01, MOD-DIS-01)

**Eventos de Dominio relacionados:**

- `EVT-CHK-001` (PagoIniciado)
- `EVT-CHK-002` (PagoConfirmado)
- `EVT-CHK-003` (PagoFallido)
- `EVT-CHK-004` (EmailConfirmacionEnviado)
- `EVT-SEL-003` (GuiaGenerada)

**Módulos donde participa:**

- MOD-CHK-01 (creación y gestión de pago)
- MOD-SEL-01 (despacho y generación de guías)
- MOD-ADM-01 (métricas de ventas)
- MOD-FU-01 (referencia via `current_order_id`)

---

### 2.4 Agregado: `User`

**Responsabilidad:** Gestionar la identidad, autenticación y autorización de todos los actores humanos del sistema.

**Entidades:**

- `User` (raíz)

**Value Objects:**

- `Email` (validación RFC 5322)
- `PasswordHash` (Argon2id)
- `MfaSecret` (TOTP secret, cifrado AES-256-GCM)
- `MfaBackupCode` (código de un solo uso)

**Invariantes:**

- `User.email` debe ser **único** en todo el sistema, sin importar el rol (RN-ADM-001).
- Un `User` con `role = ADMIN` **debe** tener `mfa_enabled = true` (invariante de seguridad).
- Deben existir **mínimo 2** `User` con `role = ADMIN` y `is_suspended = false` y `is_active = true` simultáneamente (RN-ADMIN-02).
- Un `User` **no puede** suspenderse ni eliminarse a sí mismo (RN-ADMIN-01).
- `User.auth_provider = GOOGLE` implica `role = CUSTOMER` (RN-AUT-001).
- `User.auth_provider = LOCAL` implica `role IN (SELLER, ADMIN)` (RN-AUT-002).
- Cada `User.mfa_backup_code` es de **un solo uso** (RN-AUT-003).

**Servicios de Dominio relacionados:**

- `UserService` (MOD-ADM-01, MOD-AUT-01)
- `UserQueryService` (MOD-ADM-01)
- `AuthService` (MOD-AUT-01)
- `MFAService` (MOD-AUT-01)

**Eventos de Dominio relacionados:**

- `EVT-AUT-001` (SesionIniciada)
- `EVT-AUT-002` (UsuarioRegistrado)
- `EVT-AUT-003` (MFAVerificado)
- `EVT-AUT-004` (CodigoRespaldoUsado)
- `EVT-AUT-005` (MFAHabilitado)
- `EVT-AUT-006` (SesionCerrada)
- `EVT-ADM-001` (UsuarioCreado)
- `EVT-ADM-002` (UsuarioSuspendido)
- `EVT-ADM-003` (UsuarioEliminado)

**Módulos donde participa:**

- MOD-AUT-01 (autenticación y MFA)
- MOD-ADM-01 (gestión de usuarios)
- MOD-FU-01 (owner de FormatoUnico)
- MOD-CHK-01 (customer de Order)
- MOD-CON-01 (datos de contacto del cliente)
- MOD-COT-01 (datos del cliente en cotización)

---

### 2.5 Agregado: `DistributorIntegration`

**Responsabilidad:** Gestionar la autenticación y sincronización con sistemas externos del distribuidor.

**Entidades:**

- `DistributorApiKey` (raíz)
- `NonceRegistry`

**Invariantes:**

- Cada `DistributorApiKey.key_id` debe ser único.
- Cada `NonceRegistry.nonce` debe ser único dentro de una ventana de 24 horas.
- Toda solicitud del DISTRIBUTOR debe incluir firma HMAC válida (RN-DIS-002).
- El `timestamp` de la solicitud debe estar dentro de una ventana de ±5 minutos.

**Servicios de Dominio relacionados:**

- `DistributorAuthService` (MOD-DIS-01)
- `IdempotencyService` (MOD-DIS-01, MOD-CHK-01)

**Eventos de Dominio relacionados:**

- `EVT-DIS-001` (PrecioSincronizado)
- `EVT-DIS-002` (StockSincronizado)
- `EVT-DIS-003` (SincronizacionRechazada)

**Módulos donde participa:**

- MOD-DIS-01 (gestión principal)
- MOD-CAT-01 (consumidor de sincronización)
- MOD-SEL-01 (complementa edición manual de stock)

---

### 2.6 Agregado: `SystemConfiguration`

**Responsabilidad:** Centralizar parámetros globales del sistema que afectan el comportamiento de negocio.

**Entidades:**

- `SystemConfig` (raíz)

**Invariantes:**

- `SystemConfig.key` debe ser único.
- `quote_validity_days >= 1`.
- `default_stock_min_threshold >= 0`.

**Servicios de Dominio relacionados:**

- `SystemConfigService` (MOD-ADM-01)

**Eventos de Dominio relacionados:**

- `EVT-ADM-005` (ConfiguracionActualizada)

**Módulos donde participa:**

- MOD-ADM-01 (gestión principal)
- MOD-SEL-01 (fallback para `stock_min_threshold` por producto)
- MOD-FU-01 (cálculo de vigencia de cotizaciones)

---

### 2.7 Agregado: `AuditTrail`

**Responsabilidad:** Registrar de forma inmutable toda acción mutante del sistema para trazabilidad y cumplimiento normativo.

**Entidades:**

- `AuditLog` (raíz)

**Invariantes:**

- **Solo INSERT, nunca DELETE/UPDATE** (invariante de inmutabilidad, Sesión 1).
- Todo evento mutante debe registrarse con: `actor_id`, `actor_role`, `event_type`, `resource_type`, `resource_id`, `action`, `result`, `ip_address`, `user_agent`, `metadata`, `timestamp`.
- Si el registro de auditoría falla, la operación de negocio original **debe revertirse** (AUTO-SYS-001).
- Retención de 12 meses, luego anonimización de PII (ip, user_agent, actor_id) sin eliminación física (DEC-029).

**Servicios de Dominio relacionados:**

- Capa transversal de auditoría (interceptor/middleware, no servicio específico de módulo)

**Eventos de Dominio relacionados:**

- Ninguno propio (consume eventos de todos los módulos para persistencia).

**Módulos donde participa:**

- MOD-SYS-01 (gestión transversal)
- Todos los módulos (consumo implícito en toda operación mutante)

---

## 3. Entidades Detalladas

### 3.1 `Product`

|Campo|Valor|
|---|---|
|**Nombre**|Product|
|**Responsabilidad**|Representar un producto comercializable en el catálogo.|
|**Descripción**|Entidad raíz del agregado `Catalog`. Contiene toda la información comercial, de inventario y de categorización de un producto.|
|**Agregado**|Catalog|
|**Módulos**|MOD-CAT-01, MOD-ADM-01, MOD-SEL-01, MOD-DIS-01, MOD-FU-01, MOD-COT-01|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`sku`|VARCHAR(50)|Código único de inventario|UNIQUE, NOT NULL|
|`slug`|VARCHAR(100)|Identificador SEO-friendly|UNIQUE, regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`|
|`name`|VARCHAR(200)|Nombre del producto|NOT NULL|
|`description`|TEXT|Descripción detallada|—|
|`brand`|VARCHAR(100)|Marca del producto|—|
|`price_public`|DECIMAL(10,2)|Precio de venta al público|> 0|
|`price_wholesale`|DECIMAL(10,2)|Precio mayorista (opcional)|>= 0|
|`stock`|INTEGER|Cantidad en inventario|>= 0|
|`stock_min_threshold`|INTEGER|Umbral de alerta de stock bajo|>= 0, NULL usa default de SystemConfig|
|`is_active`|BOOLEAN|Visible en catálogo público|DEFAULT true|
|`images`|JSONB|Array de URLs de imágenes|—|
|`category_id`|UUID (FK)|Categoría a la que pertenece|FK → Category.id|
|`created_at`|TIMESTAMPTZ|Fecha de creación|NOT NULL|
|`updated_at`|TIMESTAMPTZ|Última actualización|NOT NULL|

**Relaciones:**

|Relación|Entidad relacionada|Cardinalidad|Tipo|
|---|---|---|---|
|`Product.category_id → Category.id`|Category|N:1|Muchos productos pertenecen a una categoría|
|`Product.id ← FormatoUnicoItem.product_id`|FormatoUnicoItem|1:N|Un producto puede estar en muchos ítems de FU|
|`Product.id ← Order.items_snapshot`|Order (snapshot)|1:N|Referencia histórica en pedidos|

**Servicios de Dominio relacionados:**

- `ProductService` (MOD-ADM-01, MOD-DIS-01)
- `ProductQueryService` (MOD-CAT-01, MOD-SEL-01)
- `InventoryService` (MOD-SEL-01, MOD-DIS-01)
- `PricingService` (MOD-FU-01, MOD-DIS-01)

**Eventos de Dominio relacionados:**

- `EVT-CAT-001`, `EVT-CAT-002`, `EVT-ADM-004`, `EVT-DIS-001`, `EVT-DIS-002`, `EVT-DIS-003`, `EVT-SEL-001`, `EVT-SEL-002`

---

### 3.2 `Category`

|Campo|Valor|
|---|---|
|**Nombre**|Category|
|**Responsabilidad**|Clasificar productos en el catálogo.|
|**Descripción**|Entidad de soporte del agregado `Catalog`. Permite filtrado y navegación jerárquica.|
|**Agregado**|Catalog|
|**Módulos**|MOD-CAT-01, MOD-ADM-01|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`name`|VARCHAR(100)|Nombre de la categoría|NOT NULL, UNIQUE|
|`slug`|VARCHAR(100)|Identificador SEO-friendly|UNIQUE|
|`description`|TEXT|Descripción opcional|—|
|`parent_id`|UUID (FK, nullable)|Categoría padre (jerarquía)|FK → Category.id|
|`is_active`|BOOLEAN|Visible en filtros|DEFAULT true|
|`created_at`|TIMESTAMPTZ|Fecha de creación|NOT NULL|

**Relaciones:**

|Relación|Entidad relacionada|Cardinalidad|Tipo|
|---|---|---|---|
|`Category.id ← Product.category_id`|Product|1:N|Una categoría tiene muchos productos|
|`Category.parent_id → Category.id`|Category (self-reference)|1:N|Jerarquía de categorías|

---

### 3.3 `FormatoUnico`

|Campo|Valor|
|---|---|
|**Nombre**|FormatoUnico|
|**Responsabilidad**|Contenedor central de intención de compra/consulta/cotización.|
|**Descripción**|Raíz del agregado `FormatoUnico`. Gestiona el ciclo de vida comercial desde la selección de productos hasta la conversión en pedido, consulta o cotización.|
|**Agregado**|FormatoUnico|
|**Módulos**|MOD-FU-01, MOD-CAT-01, MOD-CHK-01, MOD-CON-01, MOD-COT-01, MOD-SEL-01, MOD-AUT-01|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`state`|ENUM|Estado actual (FSM-01)|NOT NULL, ver Enumeraciones|
|`owner_id`|UUID (FK, nullable)|ID del CUSTOMER propietario|FK → User.id, NULL si es GUEST|
|`guest_token`|VARCHAR(100, nullable)|Token de sesión anónima|UNIQUE si no es NULL|
|`current_order_id`|UUID (FK, nullable)|ID del Order activo (PENDING_PAYMENT)|FK → Order.id, máximo 1 activo por FU|
|`seller_id`|UUID (FK, nullable)|SELLER asignado (para CONSULTA)|FK → User.id|
|`consultant_note`|TEXT (nullable)|Respuesta del SELLER a consulta|—|
|`expires_at`|TIMESTAMPTZ (nullable)|Fecha de expiración (COTIZACIÓN)|—|
|`pdf_url`|VARCHAR(500, nullable)|URL del PDF generado|—|
|`subtotal`|DECIMAL(10,2)|Subtotal calculado|>= 0|
|`igv`|DECIMAL(10,2)|IGV (18%)|>= 0|
|`total`|DECIMAL(10,2)|Total final|>= 0|
|`created_at`|TIMESTAMPTZ|Fecha de creación|NOT NULL|
|`updated_at`|TIMESTAMPTZ|Última actualización|NOT NULL|

**Relaciones:**

|Relación|Entidad relacionada|Cardinalidad|Tipo|
|---|---|---|---|
|`FormatoUnico.owner_id → User.id`|User|N:1|Muchos FU pertenecen a un CUSTOMER|
|`FormatoUnico.seller_id → User.id`|User|N:1|Muchos FU asignados a un SELLER|
|`FormatoUnico.current_order_id → Order.id`|Order|1:1 (activo)|Un FU tiene máximo 1 Order activo|
|`FormatoUnico.id ← FormatoUnicoItem.formato_unico_id`|FormatoUnicoItem|1:N|Un FU tiene muchos ítems|
|`FormatoUnico.id ← FormatoUnicoTransition.formato_unico_id`|FormatoUnicoTransition|1:N|Historial de transiciones|
|`FormatoUnico.id ← Order.formato_unico_id`|Order|1:N|Un FU puede tener muchos Orders históricos|

**Servicios de Dominio relacionados:**

- `FormatoUnicoService` (MOD-FU-01)
- `FormatoUnicoQueryService` (MOD-FU-01, MOD-CON-01, MOD-COT-01)
- `StateMachineService` (MOD-FU-01, MOD-CHK-01, MOD-CON-01, MOD-SEL-01)

**Eventos de Dominio relacionados:**

- `EVT-FU-001` a `EVT-FU-012` (todos los eventos del agregado)

---

### 3.4 `FormatoUnicoItem`

|Campo|Valor|
|---|---|
|**Nombre**|FormatoUnicoItem|
|**Responsabilidad**|Representar un producto específico dentro de un Formato Único con su cantidad y precio fijado.|
|**Descripción**|Entidad hija del agregado `FormatoUnico`. Contiene la cantidad seleccionada y el precio congelado al momento de la transición.|
|**Agregado**|FormatoUnico|
|**Módulos**|MOD-FU-01, MOD-CAT-01, MOD-CHK-01, MOD-COT-01|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`formato_unico_id`|UUID (FK)|FU al que pertenece|FK → FormatoUnico.id|
|`product_id`|UUID (FK)|Producto referenciado|FK → Product.id|
|`quantity`|INTEGER|Cantidad seleccionada|>= 1|
|`price_at_time`|DECIMAL(10,2)|Precio fijado al transicionar|NOT NULL tras primera transición a COTIZACIÓN/PEDIDO|
|`created_at`|TIMESTAMPTZ|Fecha de creación|NOT NULL|
|`updated_at`|TIMESTAMPTZ|Última actualización|NOT NULL|

**Relaciones:**

|Relación|Entidad relacionada|Cardinalidad|Tipo|
|---|---|---|---|
|`FormatoUnicoItem.formato_unico_id → FormatoUnico.id`|FormatoUnico|N:1|Muchos ítems pertenecen a un FU|
|`FormatoUnicoItem.product_id → Product.id`|Product|N:1|Muchos ítems referencian un producto|

---

### 3.5 `FormatoUnicoTransition`

|Campo|Valor|
|---|---|
|**Nombre**|FormatoUnicoTransition|
|**Responsabilidad**|Registrar el historial de transiciones de estado del Formato Único para auditoría.|
|**Descripción**|Entidad hija del agregado `FormatoUnico`. Cada cambio de estado genera un registro inmutable.|
|**Agregado**|FormatoUnico|
|**Módulos**|MOD-FU-01, MOD-CON-01, MOD-CHK-01|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`formato_unico_id`|UUID (FK)|FU que transicionó|FK → FormatoUnico.id|
|`from_state`|ENUM|Estado anterior|NOT NULL|
|`to_state`|ENUM|Estado nuevo|NOT NULL|
|`transition_code`|VARCHAR(20)|Código de transición (ej. FU-T-03)|NOT NULL|
|`actor_id`|UUID (nullable)|ID del actor que disparó|FK → User.id|
|`actor_role`|ENUM|Rol del actor|NOT NULL|
|`timestamp`|TIMESTAMPTZ|Momento de la transición|NOT NULL|
|`metadata`|JSONB|Datos adicionales (ej. reason)|—|

**Relaciones:**

|Relación|Entidad relacionada|Cardinalidad|Tipo|
|---|---|---|---|
|`FormatoUnicoTransition.formato_unico_id → FormatoUnico.id`|FormatoUnico|N:1|Muchas transiciones pertenecen a un FU|

---

### 3.6 `Order`

|Campo|Valor|
|---|---|
|**Nombre**|Order|
|**Responsabilidad**|Representar una transacción comercial formal con estado de pago y logística.|
|**Descripción**|Raíz del agregado `Order`. Se crea cuando un Formato Único transiciona a PEDIDO y gestiona el ciclo de pago y despacho.|
|**Agregado**|Order|
|**Módulos**|MOD-CHK-01, MOD-SEL-01, MOD-ADM-01, MOD-FU-01|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`formato_unico_id`|UUID (FK)|FU origen|FK → FormatoUnico.id|
|`customer_id`|UUID (FK, nullable)|CUSTOMER propietario|FK → User.id, NULL si GUEST|
|`guest_email`|VARCHAR(200, nullable)|Email del GUEST|RFC 5322 si no es NULL|
|`guest_token`|VARCHAR(100, nullable)|Token de sesión GUEST|—|
|`status`|ENUM|Estado del pedido (FSM-02)|NOT NULL, ver Enumeraciones|
|`dni_or_ruc`|VARCHAR(11)|Documento de facturación|8 dígitos (DNI) o 11 dígitos (RUC)|
|`document_type`|ENUM|Tipo de documento|DNI o RUC|
|`shipping_address`|JSONB|Dirección de envío|NOT NULL tras OPS-CHK-001|
|`shipping_cost`|DECIMAL(10,2)|Costo de envío|>= 0|
|`subtotal`|DECIMAL(10,2)|Subtotal de ítems|>= 0|
|`igv`|DECIMAL(10,2)|IGV (18%)|>= 0|
|`total`|DECIMAL(10,2)|Total final|>= 0|
|`payment_method`|VARCHAR(50, nullable)|Método de pago usado|—|
|`cancellation_reason`|TEXT (nullable)|Motivo de cancelación|—|
|`cancelled_by`|UUID (nullable)|Quién canceló|FK → User.id|
|`order_token`|VARCHAR(100)|Token opaco para acceso GUEST|UNIQUE|
|`created_at`|TIMESTAMPTZ|Fecha de creación|NOT NULL|
|`updated_at`|TIMESTAMPTZ|Última actualización|NOT NULL|

**Relaciones:**

|Relación|Entidad relacionada|Cardinalidad|Tipo|
|---|---|---|---|
|`Order.formato_unico_id → FormatoUnico.id`|FormatoUnico|N:1|Muchos Orders pertenecen a un FU (históricos)|
|`Order.customer_id → User.id`|User|N:1|Muchos Orders pertenecen a un CUSTOMER|
|`Order.id ← ShippingGuide.order_id`|ShippingGuide|1:1|Un Order tiene máximo 1 guía|
|`Order.id ← PaymentIdempotencyKey.order_id`|PaymentIdempotencyKey|1:1|Un Order tiene máximo 1 key de idempotencia|

**Servicios de Dominio relacionados:**

- `OrderService` (MOD-CHK-01)
- `OrderQueryService` (MOD-SEL-01, MOD-ADM-01)
- `PaymentService` (MOD-CHK-01)
- `ShippingService` (MOD-CHK-01, MOD-SEL-01)

**Eventos de Dominio relacionados:**

- `EVT-CHK-001`, `EVT-CHK-002`, `EVT-CHK-003`, `EVT-CHK-004`, `EVT-SEL-003`

---

### 3.7 `ShippingGuide`

|Campo|Valor|
|---|---|
|**Nombre**|ShippingGuide|
|**Responsabilidad**|Registrar la guía de envío generada para un pedido despachado.|
|**Descripción**|Entidad hija del agregado `Order`. Se crea cuando el SELLER genera la guía de despacho.|
|**Agregado**|Order|
|**Módulos**|MOD-SEL-01, MOD-CHK-01|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`order_id`|UUID (FK)|Order despachado|FK → Order.id, UNIQUE|
|`tracking_code`|VARCHAR(100)|Código de seguimiento (mock Shalom)|NOT NULL|
|`weight_kg`|DECIMAL(6,2)|Peso del envío|> 0|
|`packages_count`|INTEGER|Cantidad de bultos|>= 1|
|`notes`|TEXT (nullable)|Observaciones del SELLER|—|
|`created_at`|TIMESTAMPTZ|Fecha de generación|NOT NULL|

**Relaciones:**

|Relación|Entidad relacionada|Cardinalidad|Tipo|
|---|---|---|---|
|`ShippingGuide.order_id → Order.id`|Order|1:1|Una guía pertenece a un Order|

---

### 3.8 `PaymentIdempotencyKey`

|Campo|Valor|
|---|---|
|**Nombre**|PaymentIdempotencyKey|
|**Responsabilidad**|Garantizar idempotencia en el procesamiento de webhooks de pago.|
|**Descripción**|Entidad de soporte del agregado `Order`. Registra el `event_id` de MercadoPago para evitar procesamiento duplicado.|
|**Agregado**|Order|
|**Módulos**|MOD-CHK-01|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`order_id`|UUID (FK)|Order asociado|FK → Order.id, UNIQUE|
|`event_id`|VARCHAR(200)|ID del evento de MercadoPago|UNIQUE, NOT NULL|
|`processed_at`|TIMESTAMPTZ|Fecha de procesamiento|NOT NULL|

**Relaciones:**

|Relación|Entidad relacionada|Cardinalidad|Tipo|
|---|---|---|---|
|`PaymentIdempotencyKey.order_id → Order.id`|Order|1:1|Una key pertenece a un Order|

---

### 3.9 `User`

|Campo|Valor|
|---|---|
|**Nombre**|User|
|**Responsabilidad**|Gestionar la identidad, autenticación y autorización de actores humanos.|
|**Descripción**|Raíz del agregado `User`. Representa a cualquier actor humano del sistema (CUSTOMER, SELLER, ADMIN).|
|**Agregado**|User|
|**Módulos**|MOD-AUT-01, MOD-ADM-01, MOD-FU-01, MOD-CHK-01, MOD-CON-01, MOD-COT-01|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`email`|VARCHAR(200)|Email único|UNIQUE, RFC 5322, NOT NULL|
|`name`|VARCHAR(200)|Nombre completo|NOT NULL|
|`role`|ENUM|Rol del usuario|NOT NULL, ver Enumeraciones|
|`auth_provider`|ENUM|Proveedor de autenticación|NOT NULL, ver Enumeraciones|
|`google_sub`|VARCHAR(200, nullable)|ID de Google (si OAuth)|UNIQUE si no es NULL|
|`password_hash`|VARCHAR(255, nullable)|Hash de contraseña (Argon2id)|NOT NULL si auth_provider = LOCAL|
|`mfa_enabled`|BOOLEAN|MFA habilitado|DEFAULT false, TRUE obligatorio si role = ADMIN|
|`mfa_secret`|VARCHAR(255, nullable)|Secret TOTP cifrado (AES-256-GCM)|—|
|`mfa_backup_codes`|JSONB|Array de 10 códigos de respaldo|—|
|`is_suspended`|BOOLEAN|Cuenta suspendida|DEFAULT false|
|`is_active`|BOOLEAN|Cuenta activa (soft-delete)|DEFAULT true|
|`deleted_at`|TIMESTAMPTZ (nullable)|Fecha de soft-delete|—|
|`created_at`|TIMESTAMPTZ|Fecha de creación|NOT NULL|
|`updated_at`|TIMESTAMPTZ|Última actualización|NOT NULL|

**Relaciones:**

|Relación|Entidad relacionada|Cardinalidad|Tipo|
|---|---|---|---|
|`User.id ← FormatoUnico.owner_id`|FormatoUnico|1:N|Un CUSTOMER tiene muchos FU|
|`User.id ← FormatoUnico.seller_id`|FormatoUnico|1:N|Un SELLER tiene muchas consultas asignadas|
|`User.id ← Order.customer_id`|Order|1:N|Un CUSTOMER tiene muchos Orders|
|`User.id ← AuditLog.actor_id`|AuditLog|1:N|Un actor tiene muchos logs|

**Servicios de Dominio relacionados:**

- `UserService` (MOD-ADM-01, MOD-AUT-01)
- `UserQueryService` (MOD-ADM-01)
- `AuthService` (MOD-AUT-01)
- `MFAService` (MOD-AUT-01)

**Eventos de Dominio relacionados:**

- `EVT-AUT-001` a `EVT-AUT-006`, `EVT-ADM-001` a `EVT-ADM-003`

---

### 3.10 `SystemConfig`

|Campo|Valor|
|---|---|
|**Nombre**|SystemConfig|
|**Responsabilidad**|Almacenar parámetros globales del sistema.|
|**Descripción**|Raíz del agregado `SystemConfiguration`. Entidad nueva introducida en MOD-ADM-01 (no estaba en Sesión 1).|
|**Agregado**|SystemConfiguration|
|**Módulos**|MOD-ADM-01, MOD-SEL-01, MOD-FU-01|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`key`|VARCHAR(100)|Clave del parámetro|UNIQUE, NOT NULL|
|`value`|TEXT|Valor del parámetro|NOT NULL|
|`updated_at`|TIMESTAMPTZ|Última actualización|NOT NULL|
|`updated_by`|UUID (FK)|ADMIN que actualizó|FK → User.id|

**Relaciones:**

|Relación|Entidad relacionada|Cardinalidad|Tipo|
|---|---|---|---|
|`SystemConfig.updated_by → User.id`|User|N:1|Muchos configs actualizados por un ADMIN|

---

### 3.11 `DistributorApiKey`

|Campo|Valor|
|---|---|
|**Nombre**|DistributorApiKey|
|**Responsabilidad**|Gestionar las credenciales de autenticación del DISTRIBUTOR.|
|**Descripción**|Raíz del agregado `DistributorIntegration`. Contiene la API Key y el secret HMAC.|
|**Agregado**|DistributorIntegration|
|**Módulos**|MOD-DIS-01|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`key_id`|VARCHAR(100)|Identificador público de la key|UNIQUE, NOT NULL|
|`hmac_secret`|VARCHAR(255)|Secret para firma HMAC (cifrado)|NOT NULL|
|`ip_allowlist`|JSONB|Array de IPs permitidas|—|
|`is_active`|BOOLEAN|Key activa|DEFAULT true|
|`created_at`|TIMESTAMPTZ|Fecha de creación|NOT NULL|

---

### 3.12 `NonceRegistry`

|Campo|Valor|
|---|---|
|**Nombre**|NonceRegistry|
|**Responsabilidad**|Prevenir replay attacks en la API del DISTRIBUTOR.|
|**Descripción**|Entidad de soporte del agregado `DistributorIntegration`. Registra nonces usados en las últimas 24 horas.|
|**Agregado**|DistributorIntegration|
|**Módulos**|MOD-DIS-01|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`nonce`|VARCHAR(100)|Nonce usado|UNIQUE, NOT NULL|
|`used_at`|TIMESTAMPTZ|Fecha de uso|NOT NULL|

---

### 3.13 `AuditLog`

|Campo|Valor|
|---|---|
|**Nombre**|AuditLog|
|**Responsabilidad**|Registrar de forma inmutable toda acción mutante del sistema.|
|**Descripción**|Raíz del agregado `AuditTrail`. Entidad transversal consumida por todos los módulos.|
|**Agregado**|AuditTrail|
|**Módulos**|MOD-SYS-01 (gestión), todos los módulos (consumo)|

**Atributos:**

|Atributo|Tipo|Descripción|Invariante|
|---|---|---|---|
|`id`|UUID|Identificador único|PK|
|`timestamp`|TIMESTAMPTZ|Momento del evento|NOT NULL|
|`actor_id`|UUID (nullable)|ID del actor|FK → User.id|
|`actor_role`|ENUM|Rol del actor|NOT NULL|
|`event_type`|VARCHAR(100)|Tipo de evento|NOT NULL|
|`resource_type`|VARCHAR(100)|Tipo de recurso afectado|NOT NULL|
|`resource_id`|UUID (nullable)|ID del recurso|—|
|`action`|VARCHAR(50)|Acción realizada|NOT NULL|
|`result`|ENUM|Resultado (SUCCESS, DENIED, ERROR)|NOT NULL|
|`ip_address`|INET (nullable)|IP del cliente|—|
|`user_agent`|TEXT (nullable)|User-Agent|—|
|`metadata`|JSONB|Datos adicionales|—|

**Relaciones:**

|Relación|Entidad relacionada|Cardinalidad|Tipo|
|---|---|---|---|
|`AuditLog.actor_id → User.id`|User|N:1|Muchos logs pertenecen a un actor|

---

## 4. Value Objects

### 4.1 `ShippingAddress`

**Responsabilidad:** Representar una dirección de envío estructurada.

**Atributos:**

- `street` (VARCHAR(200))
- `district` (VARCHAR(100))
- `province` (VARCHAR(100))
- `department` (VARCHAR(100))
- `reference` (TEXT, nullable)
- `postal_code` (VARCHAR(10, nullable)

**Invariantes:**

- `street`, `district`, `province`, `department` son obligatorios.
- Se almacena como JSONB en `Order.shipping_address`.

**Módulos donde se usa:** MOD-CHK-01, MOD-SEL-01

---

### 4.2 `Money`

**Responsabilidad:** Representar un valor monetario con moneda.

**Atributos:**

- `amount` (DECIMAL(10,2))
- `currency` (VARCHAR(3), default 'PEN')

**Invariantes:**

- `amount >= 0` para precios y totales.
- `amount` puede ser negativo solo en descuentos.
- Moneda fija: PEN (Sol peruano).

**Módulos donde se usa:** Todos los módulos con cálculos económicos (MOD-FU-01, MOD-CHK-01, MOD-COT-01, MOD-ADM-01)

---

### 4.3 `PriceSnapshot`

**Responsabilidad:** Capturar el precio de un producto en un momento específico para inmutabilidad histórica.

**Atributos:**

- `price` (DECIMAL(10,2))
- `snapshot_at` (TIMESTAMPTZ)

**Invariantes:**

- Una vez fijado, no puede modificarse.
- Se almacena en `FormatoUnicoItem.price_at_time` y `Order.items_snapshot`.

**Módulos donde se usa:** MOD-FU-01, MOD-CHK-01, MOD-COT-01

---

### 4.4 `Email`

**Responsabilidad:** Validar formato de email según RFC 5322.

**Invariantes:**

- Debe cumplir RFC 5322.
- Único en el sistema para `User.email`.

**Módulos donde se usa:** MOD-AUT-01, MOD-ADM-01, MOD-CHK-01, MOD-CON-01

---

### 4.5 `PasswordHash`

**Responsabilidad:** Almacenar contraseña hasheada con Argon2id.

**Invariantes:**

- Nunca se almacena en texto plano.
- Algoritmo: Argon2id.
- Obligatorio si `User.auth_provider = LOCAL`.

**Módulos donde se usa:** MOD-AUT-01, MOD-ADM-01

---

### 4.6 `MfaSecret`

**Responsabilidad:** Almacenar secret TOTP cifrado.

**Invariantes:**

- Cifrado: AES-256-GCM.
- Obligatorio si `User.mfa_enabled = true`.

**Módulos donde se usa:** MOD-AUT-01

---

### 4.7 `MfaBackupCode`

**Responsabilidad:** Representar un código de respaldo de un solo uso.

**Invariantes:**

- Cada código es de un solo uso (RN-AUT-003).
- Se generan 10 códigos al activar MFA.

**Módulos donde se usa:** MOD-AUT-01

---

## 5. Enumeraciones

### 5.1 `FormatoUnicoState`

**Valores:**

- `BORRADOR`
- `CONSULTA`
- `COTIZACIÓN`
- `EXPIRADA`
- `PEDIDO`
- `CONFIRMADO`
- `CANCELADO`
- `RESUELTA`

**FSM asociada:** FSM-01 (definida en documentos globales)

**Módulos donde se usa:** MOD-FU-01, MOD-CON-01, MOD-COT-01, MOD-CHK-01, MOD-SEL-01

---

### 5.2 `OrderStatus`

**Valores:**

- `PENDING_PAYMENT`
- `PAID`
- `CANCELLED`
- `READY_TO_SHIP`
- `SHIPPED`
- `DELIVERED`
- `REFUNDED`

**FSM asociada:** FSM-02 (definida en documentos globales)

**Módulos donde se usa:** MOD-CHK-01, MOD-SEL-01, MOD-ADM-01

---

### 5.3 `UserRole`

**Valores:**

- `GUEST` (no es un User registrado, solo referencia conceptual)
- `CUSTOMER`
- `SELLER`
- `ADMIN`
- `DISTRIBUTOR` (no es un User humano, solo referencia conceptual)

**Invariantes:**

- `GUEST` y `DISTRIBUTOR` no tienen registro en tabla `User`.
- `CUSTOMER` solo puede autenticarse vía Google (RN-AUT-001).
- `SELLER` y `ADMIN` solo pueden autenticarse con credenciales locales (RN-AUT-002).

**Módulos donde se usa:** MOD-AUT-01, MOD-ADM-01, todos los módulos con RBAC

---

### 5.4 `AuthProvider`

**Valores:**

- `GOOGLE`
- `LOCAL`

**Invariantes:**

- `GOOGLE` implica `role = CUSTOMER`.
- `LOCAL` implica `role IN (SELLER, ADMIN)`.

**Módulos donde se usa:** MOD-AUT-01, MOD-ADM-01

---

### 5.5 `DocumentType`

**Valores:**

- `DNI`
- `RUC`

**Invariantes:**

- `DNI`: 8 dígitos numéricos.
- `RUC`: 11 dígitos numéricos.

**Módulos donde se usa:** MOD-CHK-01

---

### 5.6 `AuditResult`

**Valores:**

- `SUCCESS`
- `DENIED`
- `ERROR`

**Módulos donde se usa:** MOD-SYS-01 (AuditLog)

---

## 6. Servicios de Dominio

### 6.1 `FormatoUnicoService`

**Responsabilidad:** Gestionar el ciclo de vida del Formato Único (crear, editar ítems, transicionar estados).

**Módulos:** MOD-FU-01

**Operaciones:**

- Crear Formato Único (FU-T-01)
- Agregar/actualizar/eliminar ítems
- Transicionar estados (FU-T-02 a FU-T-14)

---

### 6.2 `FormatoUnicoQueryService`

**Responsabilidad:** Consultas de lectura sobre Formatos Únicos (listados, filtros, historial).

**Módulos:** MOD-FU-01, MOD-CON-01, MOD-COT-01

---

### 6.3 `StateMachineService`

**Responsabilidad:** Validar y ejecutar transiciones de estado según FSM-01 y FSM-02.

**Módulos:** MOD-FU-01, MOD-CHK-01, MOD-CON-01, MOD-SEL-01

---

### 6.4 `ProductService`

**Responsabilidad:** CRUD de productos (crear, editar, desactivar).

**Módulos:** MOD-ADM-01, MOD-DIS-01

---

### 6.5 `ProductQueryService`

**Responsabilidad:** Consultas de lectura sobre productos (catálogo, filtros, búsqueda).

**Módulos:** MOD-CAT-01, MOD-SEL-01

---

### 6.6 `InventoryService`

**Responsabilidad:** Gestionar el inventario (actualizar stock, validar disponibilidad).

**Módulos:** MOD-SEL-01, MOD-DIS-01, MOD-FU-01

---

### 6.7 `PricingService`

**Responsabilidad:** Gestionar precios (fijar price_at_time, calcular totales).

**Módulos:** MOD-FU-01, MOD-DIS-01

---

### 6.8 `OrderService`

**Responsabilidad:** Gestionar el ciclo de vida del Order (crear, actualizar estado, cancelar).

**Módulos:** MOD-CHK-01

---

### 6.9 `OrderQueryService`

**Responsabilidad:** Consultas de lectura sobre Orders (cola de pedidos, historial).

**Módulos:** MOD-SEL-01, MOD-ADM-01

---

### 6.10 `PaymentService`

**Responsabilidad:** Integración con MercadoPago (crear preferencia, procesar webhooks).

**Módulos:** MOD-CHK-01

---

### 6.11 `ShippingService`

**Responsabilidad:** Calcular costo de envío y generar guías (mock Shalom).

**Módulos:** MOD-CHK-01, MOD-SEL-01

---

### 6.12 `IdempotencyService`

**Responsabilidad:** Garantizar idempotencia en webhooks y API del DISTRIBUTOR.

**Módulos:** MOD-CHK-01, MOD-DIS-01

---

### 6.13 `UserService`

**Responsabilidad:** Gestionar usuarios (crear, suspender, eliminar).

**Módulos:** MOD-ADM-01, MOD-AUT-01

---

### 6.14 `UserQueryService`

**Responsabilidad:** Consultas de lectura sobre usuarios (listados, filtros).

**Módulos:** MOD-ADM-01

---

### 6.15 `AuthService`

**Responsabilidad:** Gestionar autenticación (login, logout, validación de credenciales).

**Módulos:** MOD-AUT-01

---

### 6.16 `MFAService`

**Responsabilidad:** Gestionar MFA (generar secret, verificar TOTP, gestionar códigos de respaldo).

**Módulos:** MOD-AUT-01

---

### 6.17 `NotificationService`

**Responsabilidad:** Enviar notificaciones (email de confirmación, etc.).

**Módulos:** MOD-CHK-01, MOD-CON-01

---

### 6.18 `ValidationService`

**Responsabilidad:** Validar datos de entrada (DNI, RUC, email, etc.).

**Módulos:** MOD-CHK-01

---

### 6.19 `TokenService`

**Responsabilidad:** Generar y validar tokens opacos (orderToken, guestToken).

**Módulos:** MOD-CHK-01

---

### 6.20 `DistributorAuthService`

**Responsabilidad:** Autenticar solicitudes del DISTRIBUTOR (HMAC, nonce).

**Módulos:** MOD-DIS-01

---

### 6.21 `AnalyticsService`

**Responsabilidad:** Calcular métricas de ventas (revenue, productos más vendidos).

**Módulos:** MOD-ADM-01

---

### 6.22 `SystemConfigService`

**Responsabilidad:** Gestionar parámetros globales del sistema.

**Módulos:** MOD-ADM-01

---

### 6.23 `ExportService`

**Responsabilidad:** Generar archivos de exportación de datos.

**Módulos:** MOD-ADM-01

---

### 6.24 `QuoteService`

**Responsabilidad:** Generar PDF de cotizaciones.

**Módulos:** MOD-FU-01, MOD-COT-01

---

## 7. Eventos de Dominio

### 7.1 Catálogo Consolidado de Eventos

|ID|Evento|Disparado por|Agregado|Módulos consumidores|
|---|---|---|---|---|
|EVT-FU-001|FormatoUnicoCreado|OPS-CAT-003|FormatoUnico|MOD-FU-01|
|EVT-FU-002|ItemAgregado/ItemActualizado/ItemEliminado|OPS-CAT-003, OPS-FU-001, OPS-FU-002, OPS-FU-003|FormatoUnico|MOD-FU-01, MOD-CAT-01|
|EVT-FU-003|ConsultaIniciada|OPS-FU-004|FormatoUnico|MOD-FU-01, MOD-CON-01|
|EVT-FU-004|CotizacionGenerada|OPS-FU-005|FormatoUnico|MOD-FU-01, MOD-COT-01|
|EVT-FU-005|PedidoIniciado|OPS-FU-006|FormatoUnico|MOD-FU-01, MOD-CHK-01|
|EVT-FU-006|CotizacionExpirada|AUTO-FU-002|FormatoUnico|MOD-FU-01, MOD-COT-01|
|EVT-FU-007|CotizacionRegenerada|OPS-FU-008|FormatoUnico|MOD-FU-01|
|EVT-FU-008|FormatoUnicoMigrado/FormatoUnicoCombinado|OPS-FU-009|FormatoUnico|MOD-FU-01, MOD-AUT-01|
|EVT-FU-011|FormatoUnicoReintentado|OPS-FU-011|FormatoUnico|MOD-FU-01, MOD-CHK-01|
|EVT-FU-012|ConsultaResuelta|OPS-CON-003|FormatoUnico|MOD-CON-01, MOD-FU-01|
|EVT-CAT-001|ProductoVisto|OPS-CAT-002|Catalog|MOD-CAT-01|
|EVT-CAT-002|ProductoAgregadoAFormato|OPS-CAT-003|Catalog|MOD-CAT-01, MOD-FU-01|
|EVT-CHK-001|PagoIniciado|OPS-CHK-003|Order|MOD-CHK-01|
|EVT-CHK-002|PagoConfirmado|OPS-CHK-004|Order|MOD-CHK-01|
|EVT-CHK-003|PagoFallido|OPS-CHK-005, OPS-CHK-008|Order|MOD-CHK-01|
|EVT-CHK-004|EmailConfirmacionEnviado|OPS-CHK-007|Order|MOD-CHK-01|
|EVT-CON-001|ConsultaAsignada|OPS-CON-002|FormatoUnico|MOD-CON-01|
|EVT-SEL-001|StockActualizado|OPS-SEL-002|Catalog|MOD-SEL-01, MOD-CAT-01|
|EVT-SEL-002|UmbralStockActualizado|OPS-SEL-003|Catalog|MOD-SEL-01|
|EVT-SEL-003|GuiaGenerada|OPS-SEL-005|Order|MOD-SEL-01, MOD-CHK-01|
|EVT-ADM-001|UsuarioCreado|OPS-ADM-002|User|MOD-ADM-01|
|EVT-ADM-002|UsuarioSuspendido|OPS-ADM-003|User|MOD-ADM-01|
|EVT-ADM-003|UsuarioEliminado|OPS-ADM-004|User|MOD-ADM-01|
|EVT-ADM-004|ProductoCreado/ProductoActualizado/ProductoDesactivado|OPS-ADM-005|Catalog|MOD-ADM-01, MOD-CAT-01|
|EVT-ADM-005|ConfiguracionActualizada|OPS-ADM-007|SystemConfiguration|MOD-ADM-01|
|EVT-ADM-006|ExportacionDatosRealizada|OPS-ADM-008|User|MOD-ADM-01|
|EVT-AUT-001|SesionIniciada|OPS-AUT-001, OPS-AUT-002|User|MOD-AUT-01|
|EVT-AUT-002|UsuarioRegistrado|OPS-AUT-001 (condicional)|User|MOD-AUT-01|
|EVT-AUT-003|MFAVerificado|OPS-AUT-003|User|MOD-AUT-01|
|EVT-AUT-004|CodigoRespaldoUsado|OPS-AUT-004|User|MOD-AUT-01|
|EVT-AUT-005|MFAHabilitado|OPS-AUT-005|User|MOD-AUT-01|
|EVT-AUT-006|SesionCerrada|OPS-AUT-006|User|MOD-AUT-01|
|EVT-DIS-001|PrecioSincronizado|OPS-DIS-002|DistributorIntegration|MOD-DIS-01, MOD-CAT-01|
|EVT-DIS-002|StockSincronizado|OPS-DIS-003|DistributorIntegration|MOD-DIS-01, MOD-CAT-01, MOD-SEL-01|
|EVT-DIS-003|SincronizacionRechazada|OPS-DIS-004|DistributorIntegration|MOD-DIS-01|

---

## 8. Invariantes Globales

### 8.1 Invariantes de Integridad Referencial

|ID|Invariante|Descripción|Módulos afectados|
|---|---|---|---|
|INV-001|AuditLog inmutable|Solo INSERT, nunca DELETE/UPDATE. Si el registro falla, la operación de negocio se revierte.|MOD-SYS-01, todos|
|INV-002|Email único|`User.email` debe ser único en todo el sistema, sin importar el rol.|MOD-ADM-01, MOD-AUT-01|
|INV-003|SKU único|`Product.sku` debe ser único en el catálogo.|MOD-ADM-01, MOD-DIS-01|
|INV-004|Slug único|`Product.slug` debe ser único y seguir patrón SEO.|MOD-ADM-01|
|INV-005|Order activo único por FU|Un `FormatoUnico` solo puede tener 1 `Order` en estado `PENDING_PAYMENT` simultáneamente.|MOD-CHK-01, MOD-FU-01|
|INV-006|Mínimo 2 ADMINs activos|Deben existir mínimo 2 `User` con `role=ADMIN`, `is_suspended=false`, `is_active=true`.|MOD-ADM-01|
|INV-007|Auto-eliminación prohibida|Un `User` no puede suspenderse ni eliminarse a sí mismo.|MOD-ADM-01|
|INV-008|Stock no negativo|`Product.stock >= 0` siempre.|MOD-SEL-01, MOD-DIS-01, MOD-FU-01|
|INV-009|Precio positivo|`Product.price_public > 0`.|MOD-ADM-01, MOD-DIS-01|
|INV-010|MFA obligatorio para ADMIN|`User.mfa_enabled = true` si `role = ADMIN`.|MOD-AUT-01, MOD-ADM-01|
|INV-011|Código de respaldo single-use|Cada `User.mfa_backup_code` es de un solo uso.|MOD-AUT-004|
|INV-012|Idempotencia de webhooks|`PaymentIdempotencyKey.event_id` debe ser único.|MOD-CHK-01|
|INV-013|Nonce único en 24h|`NonceRegistry.nonce` debe ser único dentro de ventana de 24 horas.|MOD-DIS-01|
|INV-014|Price_at_time inmutable|Una vez fijado en transición a COTIZACIÓN/PEDIDO, no puede modificarse.|MOD-FU-01, MOD-COT-01|
|INV-015|Pedido confirmado inmutable|Un `Order` en estado `PAID` o posterior es inmutable en datos de facturación.|MOD-CHK-01|

---

## 9. Impacto de cada módulo sobre el Modelo de Dominio

### 9.1 MOD-CAT-01 (Catálogo)

**Entidades creadas/modificadas:**

- `Product` (lectura)
- `Category` (lectura)
- `FormatoUnico` (creación vía FU-T-01)
- `FormatoUnicoItem` (creación)

**Eventos generados:**

- `EVT-CAT-001`, `EVT-CAT-002`, `EVT-FU-001`, `EVT-FU-002`

**Servicios consumidos:**

- `ProductQueryService`, `FormatoUnicoService`, `InventoryService`

**Invariantes afectadas:**

- INV-005 (Order activo único por FU, indirectamente)

---

### 9.2 MOD-FU-01 (Formato Único)

**Entidades creadas/modificadas:**

- `FormatoUnico` (raíz, gestión completa del ciclo de vida)
- `FormatoUnicoItem` (edición, eliminación)
- `FormatoUnicoTransition` (creación en cada transición)
- `Order` (creación vía FU-T-04/FU-T-09)

**Eventos generados:**

- `EVT-FU-001` a `EVT-FU-012` (todos los eventos del agregado)

**Servicios consumidos:**

- `FormatoUnicoService`, `FormatoUnicoQueryService`, `StateMachineService`, `PricingService`, `InventoryService`

**Invariantes afectadas:**

- INV-001, INV-005, INV-014, INV-015

---

### 9.3 MOD-CHK-01 (Checkout y Pago)

**Entidades creadas/modificadas:**

- `Order` (creación, actualización de estado)
- `ShippingGuide` (lectura)
- `PaymentIdempotencyKey` (creación)
- `FormatoUnico` (transición a CONFIRMADO/CANCELADO)

**Eventos generados:**

- `EVT-CHK-001` a `EVT-CHK-004`, `EVT-FU-011`

**Servicios consumidos:**

- `OrderService`, `PaymentService`, `ShippingService`, `IdempotencyService`, `StateMachineService`, `NotificationService`, `ValidationService`, `TokenService`

**Invariantes afectadas:**

- INV-001, INV-012, INV-015

---

### 9.4 MOD-CON-01 (Consulta Pre-Venta)

**Entidades creadas/modificadas:**

- `FormatoUnico` (asignación de seller_id, transición a RESUELTA)
- `FormatoUnicoTransition` (creación)

**Eventos generados:**

- `EVT-CON-001`, `EVT-FU-012`

**Servicios consumidos:**

- `FormatoUnicoQueryService`, `StateMachineService`, `NotificationService`

**Invariantes afectadas:**

- INV-001

---

### 9.5 MOD-COT-01 (Cotización vista SELLER)

**Entidades creadas/modificadas:**

- Ninguna (solo lectura)

**Eventos generados:**

- Ninguno

**Servicios consumidos:**

- `FormatoUnicoQueryService`, `QuoteService`

**Invariantes afectadas:**

- Ninguna (solo lectura)

---

### 9.6 MOD-SEL-01 (Panel SELLER)

**Entidades creadas/modificadas:**

- `Product` (actualización de stock y stock_min_threshold)
- `Order` (transición a SHIPPED)
- `ShippingGuide` (creación)

**Eventos generados:**

- `EVT-SEL-001`, `EVT-SEL-002`, `EVT-SEL-003`

**Servicios consumidos:**

- `ProductQueryService`, `InventoryService`, `OrderQueryService`, `ShippingService`, `StateMachineService`

**Invariantes afectadas:**

- INV-008

---

### 9.7 MOD-ADM-01 (Panel ADMIN)

**Entidades creadas/modificadas:**

- `User` (creación, suspensión, soft-delete)
- `Product` (CRUD completo)
- `Category` (CRUD)
- `SystemConfig` (creación/actualización)

**Eventos generados:**

- `EVT-ADM-001` a `EVT-ADM-006`

**Servicios consumidos:**

- `UserService`, `UserQueryService`, `ProductService`, `SystemConfigService`, `AnalyticsService`, `ExportService`, `AuthService`

**Invariantes afectadas:**

- INV-002, INV-003, INV-004, INV-006, INV-007, INV-009, INV-010

---

### 9.8 MOD-AUT-01 (Autenticación)

**Entidades creadas/modificadas:**

- `User` (creación en primer login, actualización de mfa_enabled, mfa_secret, mfa_backup_codes)

**Eventos generados:**

- `EVT-AUT-001` a `EVT-AUT-006`

**Servicios consumidos:**

- `AuthService`, `MFAService`, `UserService`

**Invariantes afectadas:**

- INV-002, INV-010, INV-011

---

### 9.9 MOD-DIS-01 (Integración DISTRIBUTOR)

**Entidades creadas/modificadas:**

- `DistributorApiKey` (lectura/verificación)
- `NonceRegistry` (creación)
- `Product` (actualización de price_public, price_wholesale, stock)

**Eventos generados:**

- `EVT-DIS-001`, `EVT-DIS-002`, `EVT-DIS-003`

**Servicios consumidos:**

- `DistributorAuthService`, `IdempotencyService`, `ProductService`, `PricingService`, `InventoryService`

**Invariantes afectadas:**

- INV-003, INV-008, INV-009, INV-013, INV-014

---

### 9.10 MOD-SYS-01 (Funcionalidades Automáticas Transversales)

**Entidades creadas/modificadas:**

- `AuditLog` (creación en toda operación mutante)

**Eventos generados:**

- Ninguno propio (consume eventos de todos los módulos)

**Servicios consumidos:**

- Capa transversal de auditoría (interceptor/middleware)

**Invariantes afectadas:**

- INV-001 (AuditLog inmutable)

---

## 10. Vacíos documentales detectados

Los siguientes vacíos no pueden completarse objetivamente porque el material existente (10 módulos del Inventario Funcional Maestro) los identifica explícitamente como decisiones pendientes o vacíos no resueltos. No se han inventado valores para completarlos.

### 10.1 Soft-delete vs hard-delete de `User`

**Referencia:** MOD-ADM-01 (Notas de diseño: "Soft-delete vs hard-delete de usuario (no resuelto arbitrariamente)")

**Razón:** El contexto original usa el verbo "eliminar" sin especificar si es destrucción física o desactivación permanente. Dado que `AuditLog`, `Order.customer_id` y `FormatoUnico.owner_id` referencian `User.id`, una eliminación física rompería la integridad referencial. Se recomienda soft-delete (`is_active = false` + `deleted_at`), pero esto requiere decisión explícita antes de construir el esquema de base de datos.

**Impacto en el Modelo:** Atributos `User.is_active` y `User.deleted_at` están documentados como pendientes de confirmación.

---

### 10.2 Formato de exportación de datos

**Referencia:** MOD-ADM-01 (Notas de diseño: "Formato de exportación no definido")

**Razón:** El contexto original menciona la operación `OPS-ADM-008` pero no especifica el formato del archivo (CSV, JSON, Excel) ni su alcance (¿todos los datos? ¿solo transaccionales?). No se puede definir la estructura del archivo de exportación sin esta decisión.

**Impacto en el Modelo:** No hay entidad específica para representar el archivo de exportación; se documenta como operación de lectura masiva sin persistencia.

---

### 10.3 Política de archivado vs eliminación de `AuditLog`

**Referencia:** MOD-SYS-01 (Notas de diseño: "Archivado vs eliminación de AuditLog (no resuelto arbitrariamente)")

**Razón:** El contexto original establece retención de 12 meses pero no especifica si al vencer ese periodo los registros se eliminan físicamente o se archivan en almacenamiento de menor costo. Dado que `AuditLog` tiene la invariante de "solo INSERT, nunca DELETE/UPDATE", una eliminación automática requeriría una excepción explícita a esa invariante.

**Impacto en el Modelo:** No hay entidad de archivo separada; se documenta como pendiente de decisión técnica.

---

### 10.4 Límite de intentos MFA fallidos

**Referencia:** MOD-AUT-01 (Notas de diseño: "Vacío detectado — límite de intentos MFA no definido")

**Razón:** El contexto original no especifica cuántos intentos fallidos de código TOTP se permiten antes de bloqueo temporal. No se puede inventar un número arbitrario (ej. 3 o 5) sin base objetiva.

**Impacto en el Modelo:** No hay atributo en `User` para representar intentos fallidos o bloqueo temporal; se documenta como parámetro pendiente para `SystemConfig`.

---

### 10.5 Regeneración de códigos de respaldo MFA

**Referencia:** MOD-AUT-01 (Notas de diseño: "Regeneración de códigos de respaldo no contemplada")

**Razón:** Una vez los 10 códigos de `OPS-AUT-005` se consumen o se pierden, no hay operación documentada para regenerarlos. No se puede inferir automáticamente una funcionalidad sin definición explícita.

**Impacto en el Modelo:** No hay operación ni servicio documentado para regeneración; `User.mfa_backup_codes` se documenta como array estático generado una sola vez.

---

### 10.6 Capacidad de ADMIN para forzar MFA en SELLER

**Referencia:** MOD-AUT-01 (Notas de diseño: "Capacidad de ADMIN forzar MFA en SELLER (vacío ya señalado)")

**Razón:** El contexto original sugiere en §6.4.A que el ADMIN puede habilitar MFA obligatorio para SELLER, pero no hay una operación documentada en `MOD-ADM-01` para esto. No se puede crear `OPS-ADM-009` ("Forzar MFA en SELLER") sin decisión explícita.

**Impacto en el Modelo:** No hay atributo en `User` para representar "MFA forzado por ADMIN"; `User.mfa_enabled` se documenta como configuración voluntaria para SELLER.

---

### 10.7 SLA de respuesta para consultas

**Referencia:** MOD-CON-01 (Notas de diseño: "no existe en el contexto original ni en las sesiones previas una definición de SLA de respuesta para SELLER")

**Razón:** El componente `CMP-CON-004` (Badge de antigüedad) existe, pero no hay umbral objetivo (ej. 24 horas) para disparar una alerta de "urgente" o "vencido". No se puede definir un atributo `sla_deadline` en `FormatoUnico` sin esta decisión.

**Impacto en el Modelo:** No hay atributo de SLA en `FormatoUnico`; `CMP-CON-004` se documenta como elemento visual sin umbral definido.

---

### 10.8 Canal de notificación al cliente tras respuesta de consulta

**Referencia:** MOD-CON-01 (Notas de diseño: "no existe en el contexto... qué canal se usa para notificar al cliente que su consulta fue respondida")

**Razón:** No se puede derivar si se usa email, notificación push, o solo se refleja al volver a `/formato`. No se puede definir un servicio de notificación específico sin esta decisión.

**Impacto en el Modelo:** `NotificationService` se documenta como servicio genérico sin canal específico definido para consultas.

---

### 10.9 SLA de despacho

**Referencia:** MOD-SEL-01 (Notas de diseño: "Vacío detectado — sin SLA de despacho")

**Razón:** No hay base en el contexto para definir un tiempo máximo de despacho tras `PAID → READY_TO_SHIP`. `CMP-SEL-009` se documenta como elemento visual de antigüedad sin umbral de alerta definido.

**Impacto en el Modelo:** No hay atributo de SLA en `Order`; `CMP-SEL-009` se documenta como elemento visual sin umbral definido.

---

### 10.10 Capacidad de gestión activa del SELLER sobre cotizaciones

**Referencia:** MOD-COT-01 (Notas de diseño: "Vacío detectado — ausencia de capacidad de gestión activa del SELLER sobre cotizaciones")

**Razón:** A diferencia de `MOD-CON-01` (donde el SELLER toma y responde), el contexto original no otorga ninguna acción de mutación sobre una cotización. No se puede inferir arbitrariamente una capacidad de "extender vigencia" o "anular cotización" sin base objetiva.

**Impacto en el Modelo:** No hay operaciones de mutación sobre `FormatoUnico` en estado `COTIZACIÓN` desde el rol SELLER; solo lectura.

---

### 10.11 Propiedad/asignación de cotización a SELLER

**Referencia:** MOD-COT-01 (Notas de diseño: "Vacío detectado — ausencia de propiedad/asignación de cotización a un SELLER")

**Razón:** A diferencia de consultas (`RN-CONSULTA-ASSIGN-01`), no existe en el contexto ninguna mención de que las cotizaciones se asignen a un SELLER específico para seguimiento. No se puede agregar `FormatoUnico.seller_id` para cotizaciones sin esta decisión.

**Impacto en el Modelo:** `FormatoUnico.seller_id` se documenta como aplicable solo para estado `CONSULTA`, no para `COTIZACIÓN`.

---

### 10.12 Visibilidad de ADMIN sobre cotizaciones

**Referencia:** MOD-COT-01 (Notas de diseño: "Visibilidad de ADMIN: igual que en MOD-CON-01, no hay base en el contexto para definir si ADMIN tiene una vista de supervisión sobre cotizaciones")

**Razón:** No se puede definir permisos de lectura para ADMIN sobre cotizaciones sin decisión explícita.

**Impacto en el Modelo:** No hay política RBAC documentada para `ADMIN` sobre `FormatoUnico` en estado `COTIZACIÓN`.

---

### 10.13 Visibilidad de ADMIN sobre consultas

**Referencia:** MOD-CON-01 (Notas de diseño: "Visibilidad de ADMIN sobre consultas: el contexto original no especifica si ADMIN puede ver la cola de consultas de SELLER como supervisión")

**Razón:** No se puede definir permisos de lectura para ADMIN sobre consultas sin decisión explícita.

**Impacto en el Modelo:** No hay política RBAC documentada para `ADMIN` sobre `FormatoUnico` en estado `CONSULTA`.

---

### 10.14 Umbral de stock mínimo: conflicto de actor

**Referencia:** MOD-SEL-01 vs MOD-ADM-01 (Notas de diseño en ambos módulos: "Conflicto de actor detectado (señalado, pendiente de resolución)")

**Razón:** La Sesión 1 estableció `RN-CALC-03` indicando que `stock_min_threshold` es "editable por ADMIN en `/admin/productos/{id}`". MOD-SEL-01 también documenta `OPS-SEL-003` para que el SELLER configure el umbral por producto. Ambas asignaciones tienen base objetiva en el contexto; la decisión final se marca pendiente.

**Impacto en el Modelo:** `Product.stock_min_threshold` se documenta con la nota de que su gestión puede estar en MOD-SEL-01, MOD-ADM-01, o ambos con jerarquía (valor por producto > default global de `SystemConfig.default_stock_min_threshold`).

---

## 11. Control de Cambios

|Versión|Fecha|Cambio|Estado|
|---|---|---|---|
|1.0.0|30/06/2026|Versión inicial consolidada de los 10 módulos del Inventario Funcional Maestro. 13 entidades, 7 agregados, 7 Value Objects, 6 Enumeraciones, 24 Servicios de Dominio, 33 Eventos de Dominio, 15 Invariantes Globales.|Borrador (pendiente VoBo)|

---

## 🆕 EXTENSIONES v1.2 (14 Mejoras UI/UX e Integraciones)

### 📦 Nueva Entidad: Kit

```python
class Kit(SQLModel, table=True):
    """
    Agrupación lógica de productos con precio dinámico.
    Permite vender soluciones pre-armadas (ej. "Kit de instalación de red").
    """
    __tablename__ = "kits"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False, index=True)
    description: Optional[str] = Field(default=None)
    dynamic_price: bool = Field(default=True)
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    components: List["KitComponent"] = Relationship(back_populates="kit")
    
    @property
    def calculated_price(self) -> Decimal:
        """Calcula precio sumando componentes"""
        return sum(comp.product.price_public * comp.quantity 
                   for comp in self.components)
    
    @property
    def stock(self) -> int:
        """Stock = mínimo de componentes disponibles"""
        if not self.components:
            return 0
        return min(comp.product.stock for comp in self.components)


class KitComponent(SQLModel, table=True):
    """Tabla intermedia Kit-Product (muchos a muchos)"""
    __tablename__ = "kit_components"
    
    kit_id: UUID = Field(foreign_key="kits.id", primary_key=True)
    product_id: UUID = Field(foreign_key="products.id", primary_key=True)
    quantity: int = Field(default=1, ge=1)
    
    # Relaciones
    kit: Kit = Relationship(back_populates="components")
    product: Product = Relationship()
```

### 🔔 Nueva Entidad: Favorite


```Python
class Favorite(SQLModel, table=True):
    """Productos favoritos de CUSTOMER"""
    __tablename__ = "favorites"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", nullable=False, index=True)
    product_id: UUID = Field(foreign_key="products.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Índices únicos
    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='uq_user_product'),
    )
    
    # Relaciones
    user: User = Relationship()
    product: Product = Relationship()
```

### 📊 Nueva Entidad: LandingConfig

```Python
class LandingConfig(SQLModel, table=True):
    """Configuración de Landing Page (HOME-GUEST)"""
    __tablename__ = "landing_config"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hero_image_url: Optional[str] = Field(default=None)
    featured_product_ids: List[UUID] = Field(sa_column=Column(ARRAY(UUID)))
    show_prices_in_featured: bool = Field(default=False)
    news_section_text: Optional[str] = Field(default=None)
    updated_at: datetime = Field(default_factory=datetime.utcnow, onupdate=datetime.utcnow)
```

### 🔔 Nueva Entidad: Notification

```Python
class Notification(SQLModel, table=True):
    """Notificaciones FSM para CUSTOMER"""
    __tablename__ = "notifications"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", nullable=False, index=True)
    title: str = Field(max_length=255)
    message: str = Field(max_length=500)
    notification_type: str = Field(max_length=50)  # 'COTIZATION_EXPIRING', 'CONSULT_ANSWER', 'ORDER_CONFIRMED'
    reference_id: Optional[UUID] = Field(default=None)  # ID de FU o Order
    is_read: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=30))
    
    # Relaciones
    user: User = Relationship()
````
``
**### 🔄 Modificaciones a Entidades Existentes

**Product:****

```Python
# Agregar campo
is_featured: bool = Field(default=False, index=True)  # Para landing page
```

**Order:**

```Python
# Agregar campo
reserved_stock_released_at: Optional[datetime] = Field(default=None)  # Timestamp de liberación  
```

**User:**

```Python
# Agregar campos
telegram_username: Optional[str] = Field(default=None, max_length=100)
billing_address: Optional[str] = Field(default=None)
billing_dni: Optional[str] = Field(default=None, max_length=8)
billing_ruc: Optional[str] = Field(default=None, max_length=11)
billing_company_name: Optional[str] = Field(default=None, max_length=255)
```
