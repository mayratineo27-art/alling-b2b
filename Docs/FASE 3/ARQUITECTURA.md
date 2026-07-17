# ARQUITECTURA DEL SISTEMA — Proyecto Alling

|Campo|Valor|
|---|---|
|**ID Documento**|DOC_ALLING_ARCHITECTURE_001|
|**Versión**|1.0.0|
|**Estado**|Borrador (pendiente VoBo)|
|**Fuente de verdad**|Inventario Funcional Maestro (10 módulos), RF, RNF, HU, UC, CA, TEST, DECISIONS.md|
|**Metodología**|Spec-Driven Development (SDD) + Domain-Driven Design (DDD) + Zero Trust Architecture|
|**Fecha**|30 de junio de 2026|

---

## 1. Objetivo Arquitectónico

La arquitectura del sistema Alling debe soportar los siguientes objetivos derivados exclusivamente del material existente:

1. **Soportar el Formato Único Interactivo** como diferenciador comercial, permitiendo transiciones fluidas entre 4 estados (BORRADOR, COTIZACIÓN, PEDIDO, CONSULTA) sin pérdida de datos (MOD-FU-01, FSM-01).
2. **Implementar Zero Trust nativo** con tres capas de defensa: WAF perimetral, Middleware de autenticación/autorización, y Row Level Security (RLS) en PostgreSQL (RNF-SEC-001, RNF-SEC-002, zero_trust_actors.md §1).
3. **Entregar un MVP funcional en 12 días** con calidad OAARIT, incluyendo cobertura de pruebas ≥ 80% (RNF-MAINT-001), trazabilidad completa (RNF-MAINT-004), y cero defectos críticos (RNF-SEC-006).
4. **Coexistir con dos pipelines de CI/CD**: Pipeline OAARIT (GitHub Actions) para calidad funcional y Pipeline GRI (Jenkins) para análisis de seguridad estático (DECISIONS.md DEC-023, DEC-024, desarrollo-GRI.md).
5. **Desplegar en Vercel Serverless** con fallback a Docker para el pipeline GRI (RNF-PORT-001, DECISIONS.md DEC-021).

---

## 2. Estilo Arquitectónico

### 2.0 Definición Consolidada del Estilo Arquitectónico

**Alling es una aplicación web de arquitectura en capas con modelo de dominio rico, 
desplegada como funciones serverless, con comunicación híbrida síncrona (REST) y 
asíncrona (eventos de dominio).**

#### Nombre Técnico Formal
**"Layered Architecture with Rich Domain Model + Event-Driven + Serverless Deployment"**

#### Descomposición del Estilo

| Dimensión | Patrón | Justificación | Referencia |
|---|---|---|---|
| **Organización interna** | Clean Architecture (5 capas) | Independencia del dominio respecto a frameworks | §2.1 |
| **Comunicación entre agregados** | Event-Driven (EDA) | Desacoplamiento + trazabilidad | §2.2, §7 |
| **Comunicación con clientes** | API REST | Estándar web, OpenAPI 3.1 | §3.2, §8.1 |
| **Despliegue** | Serverless-First (Vercel) | Costo cero MVP, escalado automático | §2.3, §10.1 |
| **Derivación funcional** | Spec-Driven Development | Trazabilidad desde módulos | §2.4 |
| **Seguridad** | Zero Trust (3 capas) | WAF + Middleware + RLS | §1, §9.1 |

#### ¿Por qué NO es un Monolito?

Aunque el backend FastAPI es una **unidad lógica única**, la arquitectura **no es monolítica** porque:

1. ✅ **Despliegue serverless**: Cada endpoint se ejecuta como función independiente en Vercel.
2. ✅ **Dominio desacoplado**: Los 24 servicios de dominio (§5) son testeables de forma aislada.
3. ✅ **Comunicación por eventos**: Los agregados no se llaman directamente (EDA, §2.2).
4. ✅ **Capas independientes**: Frontend (Next.js) y Backend (FastAPI) son unidades separadas.

**Analogía correcta**: No es un "monolito" (proceso único), es un **sistema modular desplegado como serverless functions** con dominio rico.

#### Diagrama de Contexto C4 (Level 1)



┌─────────────────────────────────────────────────────────────────┐
│ USUARIOS │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ GUEST │ │ CUSTOMER │ │ SELLER │ │ ADMIN │ │
│ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
└───────┼──────────────┼──────────────┼──────────────┼────────────┘
│ │ │ │
└──────────────┴──────┬───────┴──────────────┘
│ HTTPS
▼
┌─────────────────────────────────────────────────────────────────┐
│ ALLING (Sistema) │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Frontend: Next.js 15 (SSG/SSR/ISR) + Tailwind + shadcn │ │
│ └───────────────────────────┬───────────────────────────────┘ │
│ │ REST (JSON) │
│ ┌───────────────────────────▼───────────────────────────────┐ │
│ │ Backend: FastAPI (Clean Architecture + EDA) │ │
│ │ - 24 Servicios de Dominio │ │
│ │ - FSM-01 (Formato Único) + FSM-02 (Order) │ │
│ │ - Zero Trust (JWT RS256 + RLS + HMAC) │ │
│ └───────┬───────────────┬───────────────┬───────────────────┘ │
│ │ │ │ │
│ ┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐ │
│ │ PostgreSQL │ │ Supabase │ │ Vercel Cron │ │
│ │ (Neon) + RLS │ │ Storage │ │ (Scheduler) │ │
│ └──────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
│ │ │
▼ ▼ ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ MercadoPago │ │ Google │ │ DISTRIBUTOR │
│ (Pagos) │ │ OAuth │ │ (Stock/Precio)│
└──────────────┘ └──────────┘ └──────────────┘
### 2.1 Clean Architecture Adaptada a FastAPI

El sistema sigue los principios de Clean Architecture (Robert C. Martin) adaptados al stack Python/FastAPI:

- **Independencia de frameworks**: El dominio no depende de FastAPI, Next.js ni PostgreSQL.
- **Testabilidad**: Cada capa puede probarse de forma aislada (RNF-MAINT-001).
- **Independencia de UI**: El dominio no conoce la interfaz web.
- **Independencia de base de datos**: El dominio no conoce SQLModel ni PostgreSQL.
- **Independencia de agentes externos**: El dominio no conoce MercadoPago ni Google OAuth.

### 2.2 Event-Driven Architecture (EDA)

La comunicación entre agregados se realiza mediante **Eventos de Dominio** (ver sección 7), permitiendo:

- Desacoplamiento entre módulos (ej. MOD-CHK-01 no conoce MOD-SEL-01 directamente).
- Trazabilidad completa de mutaciones (AUTO-SYS-001).
- Idempotencia en operaciones críticas (RNF-SEC-003, RNF-SEC-004).

### 2.3 Serverless-First con Fallback Docker

- **Producción**: Vercel Serverless Functions (DECISIONS.md DEC-021).
- **Pipeline GRI**: Docker Compose local (desarrollo-GRI.md §1.2).
- **Base de datos**: PostgreSQL serverless en Neon/Supabase (DECISIONS.md DEC-022).

### 2.4 Spec-Driven Development (SDD)

Toda la arquitectura se deriva de las especificaciones funcionales en el siguiente orden jerárquico:
Inventario Funcional Maestro (10 módulos)
         ↓
Requisitos Funcionales (RF)
         ↓
Requisitos No Funcionales (RNF)
         ↓
Historias de Usuario (HU)
         ↓
Casos de Uso (UC)
         ↓
Criterios de Aceptación (CA)
         ↓
Casos de Prueba (TEST)

**Los módulos del Inventario Funcional Maestro son la fuente de verdad primaria** porque contienen información granular que los RFs no capturan completamente:

|Artefacto del Módulo|Qué documenta|Ejemplo|
|---|---|---|
|**OPS** (Operaciones Funcionales)|Lógica de negocio detallada, estados FSM, entidades afectadas|`OPS-FU-005` (Generar cotización)|
|**SCR** (Pantallas)|Interfaz de usuario, permisos, dependencias|`SCR-FU-001` (Formato Único)|
|**CMP** (Componentes)|Elementos UI reutilizables, datos consumidos/producidos|`CMP-FU-002` (Control de cantidad)|
|**BTN** (Botones)|Acciones del usuario, pre/postcondiciones, errores|`BTN-FU-004` (Generar Cotización)|
|**ACT** (Acciones)|Interacciones de usuario (click, input, scroll)|`ACT-FU-001` (Incrementar cantidad)|
|**NAV** (Navegación)|Flujos entre pantallas, condiciones de entrada|`NAV-FU-001` (Catálogo → FU)|
|**AUTO** (Automatizaciones)|Procesos del sistema sin actor humano|`AUTO-FU-002` (Expiración de cotización)|
|**EVT** (Eventos de Dominio)|Comunicación asíncrona entre agregados|`EVT-FU-004` (CotizacionGenerada)|

**Principio de derivación:**

1. **No se introduce ningún componente técnico** sin justificación en los módulos o requisitos existentes.
2. **Los módulos definen el "qué"** (lógica de negocio, UI, automatizaciones).
3. **Los RF/RNF definen el "cómo"** (restricciones de calidad, performance, seguridad).
4. **Los HU/UC/CA/TEST definen el "verificar"** (criterios de aceptación y pruebas).

**Jerarquía de autoridad:**

- Si hay conflicto entre un módulo y un RF, **el módulo tiene prioridad** (es la fuente original).
- Si hay conflicto entre dos módulos, **se documenta como inconsistencia** y se resuelve en `DECISIONS.md`.
- Los RFs/RNFs/HUs/UCs/CAs/TESTs son **derivaciones** de los módulos, no fuentes independientes.
---

## 3. Capas del Sistema

### 3.1 Capa de Presentación

**Tecnología**: Next.js 15 App Router + TypeScript + Tailwind CSS + shadcn/ui

**Responsabilidades**:

- Renderizado de páginas (SSG, SSR, CSR según ruta).
- Middleware de autenticación y autorización (NEXTJS_MIDDLEWARE).
- Componentes Server (datos sensibles) y Client (interactividad).
- Validación de formularios en cliente (RNF-USE-003).
- Consumo de API REST del backend.

**Rutas críticas** (derivadas de routing_strategy.md):

- `/productos` (SSG/ISR) — MOD-CAT-01
- `/formato` (SSR) — MOD-FU-01
- `/checkout` (SSR) — MOD-CHK-01
- `/vendedor/*` (SSR, protegido) — MOD-SEL-01, MOD-CON-01, MOD-COT-01
- `/admin/*` (SSR, protegido + MFA) — MOD-ADM-01
- `/api/*` (API Routes) — Backend FastAPI

**Headers de seguridad** (RNF-SEC-007):

- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` (estricto)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`

### 3.2 Capa de Aplicación

**Tecnología**: FastAPI 0.110+ + Pydantic V2

**Responsabilidades**:

- Endpoints REST (rutas HTTP).
- DTOs (Data Transfer Objects) con Pydantic.
- Orquestación de casos de uso (llamadas a servicios de dominio).
- Validación de requests (schemas Pydantic).
- Manejo de errores HTTP (401, 403, 404, 409, 422, 500).
- Generación de OpenAPI 3.1 (RNF-MAINT-003).

**Estructura de endpoints** (derivada de los 10 módulos):
/api/v1/
├── auth/          # MOD-AUT-01
├── products/      # MOD-CAT-01, MOD-ADM-01
├── formato-unico/ # MOD-FU-01
── checkout/      # MOD-CHK-01
├── seller/        # MOD-SEL-01, MOD-CON-01, MOD-COT-01
├── admin/         # MOD-ADM-01
└── distributors/  # MOD-DIS-01
### 3.3 Capa de Dominio

**Tecnología**: Python 3.11 + Pydantic V2 (modelos de dominio)

**Responsabilidades**:

- Modelos de dominio (entidades, value objects, agregados).
- Máquina de estados FSM-01 (Formato Único) y FSM-02 (Order).
- Policy Engine RBAC (validación de permisos).
- Calculadoras (IGV, totales, envíos).
- Validadores (DNI, RUC, email, HMAC).
- Servicios de dominio (lógica de negocio pura).

**Agregados** (derivados del Modelo de Dominio):

- `Catalog` (Product, Category)
- `FormatoUnico` (FormatoUnico, FormatoUnicoItem, FormatoUnicoTransition)
- `Order` (Order, ShippingGuide, PaymentIdempotencyKey)
- `User` (User)
- `DistributorIntegration` (DistributorApiKey, NonceRegistry)
- `SystemConfiguration` (SystemConfig)
- `AuditTrail` (AuditLog)

**Invariantes de dominio** (INV-001 a INV-015, Modelo de Dominio §8):

- AuditLog inmutable (INV-001).
- Email único (INV-002).
- SKU único (INV-003).
- Order activo único por FU (INV-005).
- Mínimo 2 ADMINs activos (INV-006).
- MFA obligatorio para ADMIN (INV-010).
- Idempotencia de webhooks (INV-012).

### 3.4 Capa de Infraestructura

**Tecnología**: PostgreSQL 15+ + Redis (opcional) + Servicios externos

**Responsabilidades**:

- Persistencia de datos (SQLModel/Prisma).
- Row Level Security (RLS) para aislamiento de datos (RNF-SEC-001).
- Integración con MercadoPago (SDK oficial).
- Integración con Google OAuth (NextAuth).
- Generación de PDF (WeasyPrint/Puppeteer).
- Envío de emails (SMTP, mock para MVP).
- Almacenamiento de archivos (Supabase Storage/S3).

**Políticas RLS** (derivadas de rbac_policy.md §5):

- `users`: CUSTOMER solo ve su registro, ADMIN ve todos.
- `products`: GUEST/CUSTOMER ven activos, SELLER/ADMIN ven todos.
- `formato_unico`: Owner ve los suyos, SELLER ve asignados, ADMIN ve todos.
- `orders`: Owner ve los suyos, SELLER ve asignados, ADMIN ve todos.
- `audit_logs`: Append-only, ADMIN ve todos.

### 3.5 Capa de Persistencia

**Tecnología**: SQLModel + Alembic (migraciones) + PostgreSQL 15+

**Responsabilidades**:

- Mapeo objeto-relacional (ORM).
- Migraciones de esquema (Alembic).
- Transacciones ACID.
- Índices para performance (RNF-PERF-001, RNF-SCAL-001).
- Triggers para auditoría (AUTO-SYS-001).

**Esquema de base de datos** (derivado del Modelo de Dominio):

-- Tablas principales
users
products
categories
formato_unico
formato_unico_items
formato_unico_transitions
orders
shipping_guides
payment_idempotency_keys
system_config
distributor_api_keys
nonce_registry
audit_logs

-- Vistas materializadas (analytics)
analytics.sales_summary
analytics.formato_unico_funnel

## 4. Componentes

### 4.1 Frontend

|Componente|Tecnología|Versión|Responsabilidad|
|---|---|---|---|
|Framework|Next.js|15.x|App Router, Server Components, ISR|
|Lenguaje|TypeScript|5.4+|Tipado estático|
|Estilos|Tailwind CSS|3.4+|Utility-first CSS|
|Componentes UI|shadcn/ui|Latest|Componentes accesibles|
|Autenticación|NextAuth.js|5.x|OAuth Google, JWT|
|Validación|Zod|3.x|Schemas en cliente|
|HTTP Client|fetch API|Native|Consumo de backend|
|Testing E2E|Playwright|1.45+|Pruebas end-to-end|

**RNF relacionados**: RNF-USE-001 (responsive), RNF-USE-002 (accesibilidad), RNF-COMP-001 (navegadores), RNF-MAINT-002 (ESLint, tsc).

### 4.2 Backend

|Componente|Tecnología|Versión|Responsabilidad|
|---|---|---|---|
|Framework|FastAPI|0.110+|API REST, OpenAPI|
|Lenguaje|Python|3.11+|Lógica de negocio|
|Validación|Pydantic|2.x|Schemas, DTOs|
|ORM|SQLModel|0.0.x|Mapeo objeto-relacional|
|Migraciones|Alembic|1.x|Evolución de esquema|
|Autenticación|python-jose|3.x|JWT RS256|
|MFA|pyotp|2.x|TOTP|
|Hashing|argon2-cffi|23.x|Argon2id|
|Testing|pytest|8.x|Pruebas unitarias/integración|
|Coverage|pytest-cov|5.x|Medición de cobertura|
|Property-based|Schemathesis|3.27+|Testing sobre OpenAPI|
|Linting|Ruff|0.4+|Linter rápido|
|Type checking|mypy|1.x|Tipado estático|
|Security|Bandit|1.x|Análisis estático de seguridad|

**RNF relacionados**: RNF-MAINT-001 (cobertura ≥ 80%), RNF-MAINT-002 (Ruff, mypy), RNF-MAINT-003 (OpenAPI), RNF-PERF-001 (P95 < 300ms).

### 4.3 Base de Datos

|Componente|Tecnología|Versión|Responsabilidad|
|---|---|---|---|
|Motor|PostgreSQL|15+|Base de datos relacional|
|Hosting|Neon / Supabase|Serverless|PostgreSQL gestionado|
|RLS|PostgreSQL native|15+|Aislamiento de datos|
|Backups|Automático|Diario|Recuperación ante desastres|
|Índices|B-tree, GIN|Native|Performance de consultas|

**RNF relacionados**: RNF-SEC-001 (RLS), RNF-REL-001 (uptime ≥ 99%), RNF-SCAL-001 (hasta 10,000 productos).

### 4.4 Storage

|Componente|Tecnología|Versión|Responsabilidad|
|---|---|---|---|
|Archivos|Supabase Storage / S3|-|PDFs, imágenes de productos|
|CDN|Vercel Edge Network|-|Distribución de assets estáticos|

**RNF relacionados**: RNF-PERF-002 (PDF < 3s), RNF-REL-001 (uptime).

### 4.5 Correo

|Componente|Tecnología|Versión|Responsabilidad|
|---|---|---|---|
|SMTP|Resend / SendGrid|-|Envío de emails transaccionales|
|Templates|React Email|-|Plantillas de email|

**Estado**: Mock para MVP, implementación real postergada a v1.1.

**RNF relacionados**: RNF-REL-003 (estados de UI), RNF-USE-003 (validaciones).

### 4.6 Scheduler

|Componente|Tecnología|Versión|Responsabilidad|
|---|---|---|---|
|Cron jobs|Vercel Cron / Celery|-|Jobs programados|
|Orquestador|AUTO-SYS-002|-|Consolidación de jobs|

**Jobs programados** (derivados de AUTO-*):

- `AUTO-FU-002`: Expiración de cotizaciones (diario).
- `AUTO-CHK-003`: Timeout de pagos pendientes (cada 5 min).
- `AUTO-SYS-003`: Anonimización de AuditLog (mensual).

**RNF relacionados**: RNF-REL-002 (integridad FSM), RNF-REL-004 (inmutabilidad AuditLog).

### 4.7 Pasarela de Pago

|Componente|Tecnología|Versión|Responsabilidad|
|---|---|---|---|
|SDK|mercadopago|2.x|Integración con MercadoPago|
|Webhooks|FastAPI endpoint|-|Recepción de notificaciones|
|Idempotencia|PaymentIdempotencyKey|-|Prevención de duplicados|

**RNF relacionados**: RNF-SEC-003 (idempotencia), RNF-PERF-004 (latencia webhook < 2s), RNF-DIS-001 (degradación graceful).

### 4.8 Servicios Externos

|Servicio|Tipo|Responsabilidad|RNF relacionados|
|---|---|---|---|
|Google OAuth|Autenticación|Login de CUSTOMER|RNF-SEC-002|
|Shalom Mock|Logística|Cálculo de envío (mock)|RNF-USE-003|
|DISTRIBUTOR API|Integración|Sync de stock/precios|RNF-SEC-004, RNF-PERF-005|
|Cloudflare WAF|Seguridad|Protección perimetral|RNF-SEC-007|

---

## 5. Servicios de Dominio

Lista completa de servicios de dominio derivados del Modelo de Dominio (sección 6):

|Servicio|Módulo|Responsabilidad|
|---|---|---|
|`FormatoUnicoService`|MOD-FU-01|Gestionar ciclo de vida del FU|
|`FormatoUnicoQueryService`|MOD-FU-01, MOD-CON-01, MOD-COT-01|Consultas de lectura sobre FU|
|`StateMachineService`|MOD-FU-01, MOD-CHK-01, MOD-CON-01, MOD-SEL-01|Validar y ejecutar transiciones FSM|
|`ProductService`|MOD-ADM-01, MOD-DIS-01|CRUD de productos|
|`ProductQueryService`|MOD-CAT-01, MOD-SEL-01|Consultas de lectura sobre productos|
|`InventoryService`|MOD-SEL-01, MOD-DIS-01, MOD-FU-01|Gestionar inventario|
|`PricingService`|MOD-FU-01, MOD-DIS-01|Gestionar precios (fijar price_at_time)|
|`OrderService`|MOD-CHK-01|Gestionar ciclo de vida del Order|
|`OrderQueryService`|MOD-SEL-01, MOD-ADM-01|Consultas de lectura sobre Orders|
|`PaymentService`|MOD-CHK-01|Integración con MercadoPago|
|`ShippingService`|MOD-CHK-01, MOD-SEL-01|Calcular envío, generar guías|
|`IdempotencyService`|MOD-CHK-01, MOD-DIS-01|Garantizar idempotencia|
|`UserService`|MOD-ADM-01, MOD-AUT-01|Gestionar usuarios|
|`UserQueryService`|MOD-ADM-01|Consultas de lectura sobre usuarios|
|`AuthService`|MOD-AUT-01|Autenticación (login, logout)|
|`MFAService`|MOD-AUT-01|Gestionar MFA (TOTP, backup codes)|
|`NotificationService`|MOD-CHK-01, MOD-CON-01|Enviar notificaciones (email)|
|`ValidationService`|MOD-CHK-01|Validar datos de entrada (DNI, RUC, email)|
|`TokenService`|MOD-CHK-01|Generar/validar tokens opacos (orderToken)|
|`DistributorAuthService`|MOD-DIS-01|Autenticar solicitudes DISTRIBUTOR (HMAC, nonce)|
|`AnalyticsService`|MOD-ADM-01|Calcular métricas de ventas|
|`SystemConfigService`|MOD-ADM-01|Gestionar parámetros globales|
|`ExportService`|MOD-ADM-01|Generar archivos de exportación|
|`QuoteService`|MOD-FU-01, MOD-COT-01|Generar PDF de cotizaciones|

---

## 6. Flujo General de una Petición

### 6.1 Flujo: GUEST agrega producto al Formato Único

1. GUEST hace click en "Agregar" (BTN-CAT-001) en /productos
   ↓
2. Next.js Middleware valida cookie de sesión anónima (guest_token)
   ↓
3. Frontend envía POST /api/v1/formato-unico/items
   Body: { product_id: "prod_123", quantity: 2 }
   ↓
4. FastAPI valida JWT/cookie y extrae actor (GUEST)
   ↓
5. Capa de Aplicación invoca FormatoUnicoService.agregar_item()
   ↓
6. Capa de Dominio:
   - Valida que GUEST no tenga ya un FU activo (RN-GUEST-01)
   - Valida stock disponible (AUTO-FU-004)
   - Crea FormatoUnico si no existe (FU-T-01)
   - Crea/actualiza FormatoUnicoItem
   - Recalcula totales (AUTO-FU-001)
   ↓
7. Capa de Infraestructura:
   - SQLModel persiste en PostgreSQL
   - Trigger de auditoría registra en audit_logs (AUTO-SYS-001)
   ↓
8. Capa de Dominio emite eventos:
   - EVT-FU-001 (FormatoUnicoCreado, condicional)
   - EVT-FU-002 (ItemAgregado)
   - EVT-CAT-002 (ProductoAgregadoAFormato)
   ↓
9. FastAPI retorna HTTP 201 Created
   ↓
10. Frontend muestra toast de confirmación (CMP-CAT-014)

### 6.2 Flujo: Webhook de MercadoPago confirma pago

1. MercadoPago envía POST /api/v1/webhooks/mercadopago
   Headers: X-Signature, X-Request-Id
   Body: { id: "pay_123", status: "approved", external_reference: "fu_456" }
   ↓
2. FastAPI recibe webhook (sin autenticación JWT, es server-to-server)
   ↓
3. Capa de Aplicación invoca PaymentService.procesar_webhook()
   ↓
4. Capa de Dominio:
   - Valida firma HMAC (RN-CHK-005)
   - Verifica idempotencia: event_id no procesado previamente (INV-012)
   - Valida que Order esté en PENDING_PAYMENT
   ↓
5. Capa de Infraestructura:
   - Transacción atómica:
     a. Actualiza Order.status → PAID (ORD-T-02)
     b. Actualiza FormatoUnico.state → CONFIRMADO (FU-T-12)
     c. Crea PaymentIdempotencyKey
   - Trigger de auditoría registra en audit_logs
   ↓
6. Capa de Dominio emite eventos:
   - EVT-CHK-002 (PagoConfirmado)
   ↓
7. NotificationService encola email de confirmación (AUTO-CHK-004)
   ↓
8. FastAPI retorna HTTP 200 OK a MercadoPago

### 6.3 Flujo: SELLER genera guía de envío

1. SELLER hace click en "Generar guía" (BTN-SEL-003) en /vendedor/pedidos/[id]/guia
   ↓
2. Next.js Middleware valida sesión SELLER y permiso order:update_status:assigned
   ↓
3. Frontend envía POST /api/v1/seller/orders/{order_id}/shipping-guide
   Body: { weight_kg: 5.2, packages_count: 2, notes: "Frágil" }
   ↓
4. FastAPI valida JWT y extrae actor (SELLER)
   ↓
5. Capa de Aplicación invoca ShippingService.generar_guia()
   ↓
6. Capa de Dominio:
   - Valida que Order esté en READY_TO_SHIP
   - Valida que SELLER tenga permiso (RN-SHP-01)
   ↓
7. Capa de Infraestructura:
   - Transacción atómica:
     a. Actualiza Order.status → SHIPPED (ORD-T-06)
     b. Crea ShippingGuide con tracking_code mock
   - Trigger de auditoría registra en audit_logs
   ↓
8. Capa de Dominio emite eventos:
   - EVT-SEL-003 (GuiaGenerada)
   ↓
9. FastAPI retorna HTTP 201 Created con tracking_code
   ↓
10. Frontend muestra código de seguimiento (CMP-SEL-014)
## 7. Eventos de Dominio

Catálogo consolidado de eventos de dominio (derivado del Modelo de Dominio §7):

### 7.1 Eventos del Agregado FormatoUnico

|ID|Evento|Disparado por|Módulo|
|---|---|---|---|
|EVT-FU-001|FormatoUnicoCreado|OPS-CAT-003|MOD-FU-01|
|EVT-FU-002|ItemAgregado/ItemActualizado/ItemEliminado|OPS-CAT-003, OPS-FU-001, OPS-FU-002, OPS-FU-003|MOD-FU-01|
|EVT-FU-003|ConsultaIniciada|OPS-FU-004|MOD-FU-01|
|EVT-FU-004|CotizacionGenerada|OPS-FU-005|MOD-FU-01|
|EVT-FU-005|PedidoIniciado|OPS-FU-006|MOD-FU-01|
|EVT-FU-006|CotizacionExpirada|AUTO-FU-002|MOD-FU-01|
|EVT-FU-007|CotizacionRegenerada|OPS-FU-008|MOD-FU-01|
|EVT-FU-008|FormatoUnicoMigrado/Combinado|OPS-FU-009|MOD-FU-01|
|EVT-FU-011|FormatoUnicoReintentado|OPS-FU-011|MOD-FU-01|
|EVT-FU-012|ConsultaResuelta|OPS-CON-003|MOD-CON-01|

### 7.2 Eventos del Agregado Order

|ID|Evento|Disparado por|Módulo|
|---|---|---|---|
|EVT-CHK-001|PagoIniciado|OPS-CHK-003|MOD-CHK-01|
|EVT-CHK-002|PagoConfirmado|OPS-CHK-004|MOD-CHK-01|
|EVT-CHK-003|PagoFallido|OPS-CHK-005, OPS-CHK-008|MOD-CHK-01|
|EVT-CHK-004|EmailConfirmacionEnviado|OPS-CHK-007|MOD-CHK-01|
|EVT-SEL-003|GuiaGenerada|OPS-SEL-005|MOD-SEL-01|

### 7.3 Eventos del Agregado Catalog

|ID|Evento|Disparado por|Módulo|
|---|---|---|---|
|EVT-CAT-001|ProductoVisto|OPS-CAT-002|MOD-CAT-01|
|EVT-CAT-002|ProductoAgregadoAFormato|OPS-CAT-003|MOD-CAT-01|
|EVT-ADM-004|ProductoCreado/Actualizado/Desactivado|OPS-ADM-005|MOD-ADM-01|
|EVT-DIS-001|PrecioSincronizado|OPS-DIS-002|MOD-DIS-01|
|EVT-DIS-002|StockSincronizado|OPS-DIS-003|MOD-DIS-01|
|EVT-DIS-003|SincronizacionRechazada|OPS-DIS-004|MOD-DIS-01|
|EVT-SEL-001|StockActualizado|OPS-SEL-002|MOD-SEL-01|
|EVT-SEL-002|UmbralStockActualizado|OPS-SEL-003|MOD-SEL-01|

### 7.4 Eventos del Agregado User

|ID|Evento|Disparado por|Módulo|
|---|---|---|---|
|EVT-AUT-001|SesionIniciada|OPS-AUT-001, OPS-AUT-002|MOD-AUT-01|
|EVT-AUT-002|UsuarioRegistrado|OPS-AUT-001 (condicional)|MOD-AUT-01|
|EVT-AUT-003|MFAVerificado|OPS-AUT-003|MOD-AUT-01|
|EVT-AUT-004|CodigoRespaldoUsado|OPS-AUT-004|MOD-AUT-01|
|EVT-AUT-005|MFAHabilitado|OPS-AUT-005|MOD-AUT-01|
|EVT-AUT-006|SesionCerrada|OPS-AUT-006|MOD-AUT-01|
|EVT-ADM-001|UsuarioCreado|OPS-ADM-002|MOD-ADM-01|
|EVT-ADM-002|UsuarioSuspendido|OPS-ADM-003|MOD-ADM-01|
|EVT-ADM-003|UsuarioEliminado|OPS-ADM-004|MOD-ADM-01|

### 7.5 Eventos del Agregado SystemConfiguration

|ID|Evento|Disparado por|Módulo|
|---|---|---|---|
|EVT-ADM-005|ConfiguracionActualizada|OPS-ADM-007|MOD-ADM-01|
|EVT-ADM-006|ExportacionDatosRealizada|OPS-ADM-008|MOD-ADM-01|

### 7.6 Eventos del Agregado DistributorIntegration

|ID|Evento|Disparado por|Módulo|
|---|---|---|---|
|EVT-DIS-001|PrecioSincronizado|OPS-DIS-002|MOD-DIS-01|
|EVT-DIS-002|StockSincronizado|OPS-DIS-003|MOD-DIS-01|
|EVT-DIS-003|SincronizacionRechazada|OPS-DIS-004|MOD-DIS-01|

### 7.7 Eventos del Agregado Consulta

|ID|Evento|Disparado por|Módulo|
|---|---|---|---|
|EVT-CON-001|ConsultaAsignada|OPS-CON-002|MOD-CON-01|

---

## 8. Comunicación entre Módulos

### 8.1 Comunicación Síncrona (HTTP REST)

**Frontend → Backend**:

- Todas las operaciones de usuario se realizan vía HTTP REST.
- Autenticación: JWT RS256 en header `Authorization: Bearer <token>`.
- Autorización: Middleware Next.js + FastAPI dependency injection.

**Backend → Servicios Externos**:

- MercadoPago: SDK oficial (crear preferencia, validar webhook).
- Google OAuth: NextAuth.js (login de CUSTOMER).
- DISTRIBUTOR: API REST con HMAC (sync de stock/precios).

### 8.2 Comunicación Asíncrona (Eventos de Dominio)

**Entre Agregados**:

- Los eventos de dominio se publican tras mutaciones exitosas.
- Los consumidores reaccionan a eventos (ej. AUTO-CAT-001 recalcula badge de stock tras EVT-SEL-001).
- No hay acoplamiento directo entre módulos (ej. MOD-SEL-01 no conoce MOD-CAT-01).

**Entre Sistemas**:

- Webhooks de MercadoPago: server-to-server, idempotente (RNF-SEC-003).
- API DISTRIBUTOR: server-to-server, con HMAC y nonce (RNF-SEC-004).

### 8.3 Comunicación Transversal (Auditoría)

**AUTO-SYS-001**:

- Interceptor/middleware que registra toda mutación en `audit_logs`.
- Si el registro falla, la operación de negocio se revierte (INV-001).
- No hay acoplamiento directo entre módulos y AuditLog.

---

## 9. Restricciones Arquitectónicas

### 9.1 Restricciones de Seguridad (Zero Trust)

|ID|Restricción|Justificación|RNF relacionados|
|---|---|---|---|
|ARC-SEC-001|Toda petición debe autenticarse (JWT o API Key)|Principio ZT-01|RNF-SEC-002, RNF-SEC-004|
|ARC-SEC-002|Toda tabla sensible debe tener RLS habilitado|Principio ZT-02|RNF-SEC-001|
|ARC-SEC-003|ADMIN debe tener MFA obligatorio|Invariante INV-010|RNF-SEC-002|
|ARC-SEC-004|Webhooks deben ser idempotentes|Prevención de duplicados|RNF-SEC-003|
|ARC-SEC-005|AuditLog debe ser append-only|Invariante INV-001|RNF-REL-004|
|ARC-SEC-006|Cero secretos en repositorio|Prevención de fugas|RNF-SEC-005|
|ARC-SEC-007|Cero CVEs High/Critical en dependencias|Prevención de vulnerabilidades|RNF-SEC-006|
|ARC-SEC-008|Headers de seguridad en todas las respuestas|Defensa en profundidad|RNF-SEC-007|
|ARC-SEC-009|Rate limiting en endpoints públicos|Prevención de abuso|RNF-SEC-008|

### 9.2 Restricciones de Performance

|ID|Restricción|Justificación|RNF relacionados|
|---|---|---|---|
|ARC-PERF-001|P95 < 300ms en catálogo|Experiencia de usuario|RNF-PERF-001|
|ARC-PERF-002|PDF < 3s|Evitar abandono B2B|RNF-PERF-002|
|ARC-PERF-003|Cold start < 2s|Mitigar impacto serverless|RNF-PERF-003|
|ARC-PERF-004|Webhook < 2s|Confirmación rápida|RNF-PERF-004|
|ARC-PERF-005|Batch 1000 SKUs < 10s|Sincronización eficiente|RNF-PERF-005|

### 9.3 Restricciones de Confiabilidad

|ID|Restricción|Justificación|RNF relacionados|
|---|---|---|---|
|ARC-REL-001|Uptime ≥ 99%|Disponibilidad del MVP|RNF-REL-001|
|ARC-REL-002|FSM debe rechazar transiciones inválidas|Integridad de negocio|RNF-REL-002|
|ARC-REL-003|UI debe manejar estados Loading/Error/Empty|Experiencia de usuario|RNF-REL-003|
|ARC-REL-004|AuditLog inmutable|Trazabilidad forense|RNF-REL-004|

### 9.4 Restricciones de Pipeline

|ID|Restricción|Justificación|RNF relacionados|
|---|---|---|---|
|ARC-PIPE-001|Cobertura ≥ 80% en backend|Calidad de código|RNF-MAINT-001|
|ARC-PIPE-002|Ruff, mypy, ESLint, tsc sin errores|Prevención de bugs|RNF-MAINT-002|
|ARC-PIPE-003|OpenAPI 3.1 completo|Documentación de API|RNF-MAINT-003|
|ARC-PIPE-004|Pipeline GRI FIJO (no modificar)|Comparabilidad académica|DECISIONS.md DEC-024|

---

## 10. Decisiones Arquitectónicas Relevantes

### 10.1 Serverless-First con Fallback Docker

**Decisión**: Desplegar en Vercel Serverless Functions para producción, con fallback a Docker Compose para el pipeline GRI.

**Justificación**:

- Vercel ofrece despliegue nativo de Next.js con ISR/SSG (DECISIONS.md DEC-021).
- El pipeline GRI requiere Docker Compose para Jenkins, SonarQube, Trivy (desarrollo-GRI.md §1.2).
- RNF-PORT-001 exige que el backend funcione en ambos entornos.

**Consecuencias**:

- ✅ Despliegue automático en Vercel (CI/CD nativo).
- ✅ Costo cero en MVP (plan gratuito de Vercel y Neon).
- ⚠️ Cold start en Vercel (mitigado con RNF-PERF-003).
- ⚠️ Requiere Dockerfile académico para pipeline GRI (no usado en producción).

### 10.2 JWT RS256 para Autenticación

**Decisión**: Usar JWT con algoritmo RS256 (asimétrico) para autenticación.

**Justificación**:

- RS256 es más seguro que HS256 (DECISIONS.md DEC-004).
- Permite validación de tokens sin compartir secret (clave pública distribuida).
- NextAuth.js soporta JWT RS256 nativamente.

**Consecuencias**:

- ✅ Tokens stateless (no requiere sesión en servidor).
- ✅ Rotación de claves cada 90 días (RNF-SEC-002).
- ⚠️ Requiere gestión de par de claves (privada/pública).

### 10.3 Row Level Security (RLS) para Aislamiento de Datos

**Decisión**: Implementar RLS en PostgreSQL para aislamiento de datos a nivel de fila.

**Justificación**:

- Principio Zero Trust ZT-02 (mínimo privilegio).
- RNF-SEC-001 exige 0 fugas cross-tenant.
- PostgreSQL 15+ soporta RLS nativo (DECISIONS.md DEC-002).

**Consecuencias**:

- ✅ Aislamiento garantizado incluso si la capa de aplicación tiene bugs.
- ✅ Políticas declarativas en SQL (fáciles de auditar).
- ⚠️ Requiere configurar variables de sesión (`app.current_user_id`, `app.current_role`).
- ️ Performance: índices deben cubrir políticas RLS (RNF-SCAL-001).

### 10.4 Event-Driven para Comunicación entre Agregados

**Decisión**: Usar eventos de dominio para comunicación entre agregados.

**Justificación**:

- Desacoplamiento entre módulos (ej. MOD-SEL-01 no conoce MOD-CAT-01).
- Trazabilidad completa de mutaciones (AUTO-SYS-001).
- Idempotencia en operaciones críticas (RNF-SEC-003, RNF-SEC-004).

**Consecuencias**:

- ✅ Módulos independientes y testeables.
- ✅ Eventos persistidos en `audit_logs` para auditoría.
- ⚠️ Requiere mecanismo de publicación/consumo de eventos (in-process para MVP).
- ⚠️ No hay garantía de entrega asíncrona (aceptable para MVP).

### 10.5 Mock de Shalom para MVP

**Decisión**: Mockear la integración con Shalom (logística) para el MVP.

**Justificación**:

- Plazo de 12 días insuficiente para integración real (DECISIONS.md DEC-006).
- RNF-DIS-001 exige degradación graceful ante fallos de pasarela.

**Consecuencias**:

- ✅ MVP funcional sin dependencia externa.
- ✅ Testing determinista (respuestas mock predecibles).
- ⚠️ Postergado a v1.1 (requiere refactor de ShippingService).

### 10.6 Pipeline GRI FIJO

**Decisión**: No modificar el pipeline DevSecOps del curso GRI.

**Justificación**:

- Requisito académico de comparabilidad entre 5 sistemas (DECISIONS.md DEC-024).
- desarrollo-GRI.md establece reglas de no invención.

**Consecuencias**:

- ✅ Comparabilidad garantizada en apartado 4.6 del informe.
- ⚠️ No se pueden agregar herramientas ni cambiar criterios de severidad.
- ️ Requiere Dockerfile académico (no usado en producción).

---

## 11. Riesgos Arquitectónicos

### 11.1 Riesgos Técnicos

|ID|Riesgo|Probabilidad|Impacto|Mitigación|RNF relacionados|
|---|---|---|---|---|---|
|ARC-RSK-001|Cold start en Vercel degrada P95|Media|Alto|Endpoint `/healthz` con warm-up programático|RNF-PERF-003|
|ARC-RSK-002|Webhooks de MercadoPago inestables|Media|Alto|Reintento exponencial + idempotency key|RNF-SEC-003, RNF-DIS-001|
|ARC-RSK-003|RLS mal configurado expone datos|Baja|Crítico|Tests Schemathesis + revisión peer|RNF-SEC-001|
|ARC-RSK-004|Plazo de 12 días insuficiente|Alta|Alto|Priorizar RFs MVP, postergar MVP+|RNF-MAINT-001|
|ARC-RSK-005|Falsos positivos en SAST/SCA|Media|Medio|Documentar en reporte GRI (Bloque 4.X.8)|RNF-SEC-006|
|ARC-RSK-006|Testcontainers inestable en CI|Media|Alto|Usar `reuse=True` en desarrollo, aumentar timeouts en CI|RNF-MAINT-001|

### 11.2 Riesgos de Seguridad

|ID|Riesgo|Probabilidad|Impacto|Mitigación|RNF relacionados|
|---|---|---|---|---|---|
|ARC-SEC-RSK-001|JWT comprometido|Baja|Crítico|Rotación de claves cada 90 días, MFA obligatorio ADMIN|RNF-SEC-002|
|ARC-SEC-RSK-002|Replay attack en DISTRIBUTOR|Media|Alto|Nonce único + ventana temporal ±5 min|RNF-SEC-004|
|ARC-SEC-RSK-003|Secretos expuestos en repo|Baja|Crítico|gitleaks en pre-commit + Trivy en CI|RNF-SEC-005|
|ARC-SEC-RSK-004|CVEs en dependencias|Media|Alto|pip-audit + npm audit + Trivy + Dependency-Check|RNF-SEC-006|

### 11.3 Riesgos Operativos

|ID|Riesgo|Probabilidad|Impacto|Mitigación|RNF relacionados|
|---|---|---|---|---|---|
|ARC-OPS-RSK-001|Neon/Supabase caído|Baja|Alto|Backups automáticos, RTO < 1h|RNF-REL-001|
|ARC-OPS-RSK-002|Vercel caído|Baja|Alto|Fallback a Docker (no implementado en MVP)|RNF-REL-001|
|ARC-OPS-RSK-003|AuditLog crece sin control|Media|Medio|Anonimización mensual (AUTO-SYS-003)|RNF-REL-004|

---

## 12. Relación entre Arquitectura y Módulos

### 12.1 Mapeo de Módulos a Capas

|Módulo|Capa de Presentación|Capa de Aplicación|Capa de Dominio|Capa de Infraestructura|
|---|---|---|---|---|
|MOD-CAT-01|SCR-CAT-001, SCR-CAT-002|OPS-CAT-001, OPS-CAT-002, OPS-CAT-003|ProductQueryService, InventoryService|PostgreSQL (lectura)|
|MOD-FU-01|SCR-FU-001, SCR-FU-002|OPS-FU-001 a OPS-FU-011|FormatoUnicoService, StateMachineService, PricingService|PostgreSQL (lectura/escritura)|
|MOD-CHK-01|SCR-CHK-001, SCR-CHK-002, SCR-CHK-003|OPS-CHK-001 a OPS-CHK-008|OrderService, PaymentService, ShippingService, IdempotencyService|PostgreSQL, MercadoPago, SMTP|
|MOD-CON-01|SCR-CON-001, SCR-CON-002|OPS-CON-001 a OPS-CON-004|FormatoUnicoQueryService, StateMachineService, NotificationService|PostgreSQL (lectura)|
|MOD-COT-01|SCR-COT-001, SCR-COT-002|OPS-COT-001, OPS-COT-002, OPS-COT-003|FormatoUnicoQueryService, QuoteService|PostgreSQL (lectura), Storage (PDF)|
|MOD-SEL-01|SCR-SEL-001, SCR-SEL-002, SCR-SEL-003|OPS-SEL-001 a OPS-SEL-006|ProductQueryService, InventoryService, OrderQueryService, ShippingService|PostgreSQL (lectura/escritura)|
|MOD-ADM-01|SCR-ADM-001, SCR-ADM-002, SCR-ADM-003, SCR-ADM-004|OPS-ADM-001 a OPS-ADM-008|UserService, ProductService, SystemConfigService, AnalyticsService, ExportService|PostgreSQL (lectura/escritura)|
|MOD-AUT-01|SCR-AUT-001, SCR-AUT-002, SCR-AUT-003, SCR-AUT-004|OPS-AUT-001 a OPS-AUT-006|AuthService, MFAService, UserService|PostgreSQL, Google OAuth, JWT RS256|
|MOD-DIS-01|(sin UI)|OPS-DIS-001 a OPS-DIS-004|DistributorAuthService, ProductService, PricingService, InventoryService, IdempotencyService|PostgreSQL (escritura)|
|MOD-SYS-01|(sin UI)|AUTO-SYS-001, AUTO-SYS-002, AUTO-SYS-003|Capa transversal de auditoría, Orquestador de jobs|PostgreSQL (audit_logs), Cron|

### 12.2 Mapeo de Módulos a Componentes

|Módulo|Frontend|Backend|Base de Datos|Storage|Correo|Scheduler|Pasarela de Pago|Servicios Externos|
|---|---|---|---|---|---|---|---|---|
|MOD-CAT-01|Next.js (SSG/ISR)|FastAPI|PostgreSQL|-|-|AUTO-CAT-002|-|-|
|MOD-FU-01|Next.js (SSR)|FastAPI|PostgreSQL|-|-|AUTO-FU-002|-|-|
|MOD-CHK-01|Next.js (SSR)|FastAPI|PostgreSQL|-|SMTP|AUTO-CHK-003|MercadoPago|-|
|MOD-CON-01|Next.js (SSR)|FastAPI|PostgreSQL|-|SMTP (pendiente)|-|-|-|
|MOD-COT-01|Next.js (SSR)|FastAPI|PostgreSQL|Supabase Storage|-|-|-|-|
|MOD-SEL-01|Next.js (SSR)|FastAPI|PostgreSQL|-|-|-|-|Shalom Mock|
|MOD-ADM-01|Next.js (SSR)|FastAPI|PostgreSQL|-|-|-|-|-|
|MOD-AUT-01|Next.js (SSR)|FastAPI|PostgreSQL|-|-|-|-|Google OAuth|
|MOD-DIS-01|(sin UI)|FastAPI|PostgreSQL|-|-|-|-|DISTRIBUTOR API|
|MOD-SYS-01|(sin UI)|FastAPI|PostgreSQL|-|-|AUTO-SYS-002|-|-|

### 12.3 Mapeo de Módulos a RNF

|Módulo|RNF Críticos|RNF Importantes|
|---|---|---|
|MOD-CAT-01|RNF-PERF-001, RNF-SCAL-001|RNF-SEC-007, RNF-USE-001|
|MOD-FU-01|RNF-REL-002, RNF-INT-001, RNF-INT-002|RNF-SEC-001, RNF-USE-003|
|MOD-CHK-01|RNF-SEC-003, RNF-PERF-004, RNF-DIS-001|RNF-REL-003, RNF-USE-003|
|MOD-CON-01|RNF-REL-002|RNF-USE-003|
|MOD-COT-01|RNF-PERF-002|RNF-INT-002|
|MOD-SEL-01|RNF-USE-003|RNF-REL-003|
|MOD-ADM-01|RNF-SEC-002, RNF-REL-004|RNF-USE-003|
|MOD-AUT-01|RNF-SEC-002|RNF-SEC-007|
|MOD-DIS-01|RNF-SEC-004, RNF-PERF-005|RNF-SEC-008|
|MOD-SYS-01|RNF-REL-004|RNF-MAINT-004|

---

## Vacíos Documentales Detectados

Los siguientes vacíos no pueden completarse objetivamente porque el material existente (10 módulos del Inventario Funcional Maestro, RF, RNF, HU, UC, CA, TEST, DECISIONS.md) los identifica explícitamente como decisiones pendientes o vacíos no resueltos. No se han inventado valores para completarlos.

### 1. Mecanismo Concreto de Sesión (JWT vs Server-Side)

**Referencia**: MOD-AUT-01 (Notas de diseño: "pendiente de definir si la verificación TOTP y el almacenamiento de sesión usan un mecanismo concreto (JWT, sesión server-side)").

**Razón**: El contexto original no especifica si las sesiones se gestionan con JWT stateless o sesiones server-side (Redis/DB). DECISIONS.md DEC-004 menciona JWT RS256, pero no detalla el mecanismo de almacenamiento de sesión (cookie httpOnly, localStorage, etc.).

**Impacto en Arquitectura**: No se puede definir el componente de gestión de sesiones (Redis, DB, cookie) sin esta decisión.

---

### 2. Patrón de Interceptor/Middleware de Auditoría

**Referencia**: MOD-SYS-01 (Notas de diseño: "requiere actualización. Debe documentarse la existencia de un orquestador de jobs/scheduler como componente de infraestructura transversal, y el patrón de interceptor/middleware de auditoría que aplica a todas las mutaciones del sistema").

**Razón**: AUTO-SYS-001 documenta que toda mutación debe registrarse en `audit_logs`, pero no especifica el patrón técnico (middleware FastAPI, decorator, event listener, trigger de BD).

**Impacto en Arquitectura**: No se puede definir el componente de auditoría (middleware, decorator, trigger) sin esta decisión.

---

### 3. Orquestador de Jobs/Scheduler Específico

**Referencia**: MOD-SYS-01 (Notas de diseño: "AUTO-SYS-002 no duplica la especificación de AUTO-FU-002 ni AUTO-CHK-003; aquí solo se documenta la existencia de un orquestador transversal").

**Razón**: AUTO-SYS-002 documenta la existencia de un orquestador de jobs, pero no especifica la tecnología (Vercel Cron, Celery, APScheduler, cron nativo).

**Impacto en Arquitectura**: No se puede definir el componente de scheduler (Vercel Cron, Celery, etc.) sin esta decisión.

---

### 4. Mecanismo de Publicación/Consumo de Eventos de Dominio

**Referencia**: Modelo de Dominio §7 (Eventos de Dominio).

**Razón**: Los eventos de dominio están documentados, pero no se especifica el mecanismo de publicación/consumo (in-process, message queue, event bus).

**Impacto en Arquitectura**: No se puede definir el componente de eventos (Redis Pub/Sub, RabbitMQ, in-process) sin esta decisión.

---

### 5. Mecanismo de Generación de PDF

**Referencia**: MOD-FU-01 (OPS-FU-005), MOD-COT-01 (OPS-COT-003).

**Razón**: La generación de PDF está documentada como operación, pero no se especifica la tecnología (WeasyPrint, Puppeteer, wkhtmltopdf).

**Impacto en Arquitectura**: No se puede definir el componente de generación de PDF sin esta decisión.

---

### 6. Mecanismo de Almacenamiento de Archivos

**Referencia**: MOD-COT-01 (OPS-COT-003), MOD-ADM-01 (OPS-ADM-005).

**Razón**: El almacenamiento de PDFs e imágenes está documentado, pero no se especifica la tecnología (Supabase Storage, AWS S3, Vercel Blob).

**Impacto en Arquitectura**: No se puede definir el componente de storage sin esta decisión.

---

### 7. Mecanismo de Envío de Emails

**Referencia**: MOD-CHK-01 (OPS-CHK-007), MOD-CON-01 (OPS-CON-003).

**Razón**: El envío de emails está documentado, pero no se especifica la tecnología (Resend, SendGrid, SMTP directo). Además, el canal de notificación para consultas respondidas está pendiente (vacío ya señalado en MOD-CON-01).

**Impacto en Arquitectura**: No se puede definir el componente de correo sin esta decisión.

---

### 8. Mecanismo de Migraciones de Base de Datos

**Referencia**: Modelo de Dominio §3 (Entidades).

**Razón**: El esquema de base de datos está documentado, pero no se especifica la herramienta de migraciones (Alembic, Prisma Migrate, Django Migrations).

**Impacto en Arquitectura**: No se puede definir el componente de migraciones sin esta decisión.

---

### 9. Mecanismo de Indexación de Búsqueda

**Referencia**: MOD-CAT-01 (AUTO-CAT-002).

**Razón**: AUTO-CAT-002 documenta indexación de búsqueda, pero no especifica la tecnología (PostgreSQL full-text search, Elasticsearch, Meilisearch).

**Impacto en Arquitectura**: No se puede definir el componente de búsqueda sin esta decisión.

---

### 10. Mecanismo de Cache

**Referencia**: RNF-PERF-001 (P95 < 300ms), RNF-SCAL-001 (hasta 10,000 productos).

**Razón**: Los RNF de performance exigen tiempos de respuesta específicos, pero no se especifica el mecanismo de cache (Redis, Vercel Edge Cache, ISR de Next.js).

**Impacto en Arquitectura**: No se puede definir el componente de cache sin esta decisión.

---

### 11. Mecanismo de Rate Limiting

**Referencia**: RNF-SEC-008 (Rate limiting en endpoints públicos).

**Razón**: El RNF exige rate limiting, pero no se especifica la tecnología (Redis + sliding window, Vercel Edge Middleware, Nginx).

**Impacto en Arquitectura**: No se puede definir el componente de rate limiting sin esta decisión.

---

### 12. Mecanismo de WAF

**Referencia**: RNF-SEC-007 (Headers de seguridad), zero_trust_actors.md §1 (ZT-05 Defensa en profundidad).

**Razón**: Se menciona Cloudflare WAF como capa perimetral, pero no se especifica la configuración ni las reglas.

**Impacto en Arquitectura**: No se puede definir la configuración del WAF sin esta decisión.

---

### 13. Mecanismo de Monitoreo y Alertas

**Referencia**: RNF-REL-001 (Uptime ≥ 99%).

**Razón**: El RNF exige monitoreo de uptime, pero no se especifica la tecnología (UptimeRobot, Vercel Analytics, Sentry).

**Impacto en Arquitectura**: No se puede definir el componente de monitoreo sin esta decisión.

---

### 14. Mecanismo de Logging de Aplicación

**Referencia**: AUTO-SYS-001 (Registro de auditoría).

**Razón**: AUTO-SYS-001 documenta registro de auditoría en `audit_logs`, pero no se especifica el mecanismo de logging de aplicación (stdout, structured logging, ELK stack).

**Impacto en Arquitectura**: No se puede definir el componente de logging sin esta decisión.

---

### 15. Mecanismo de CI/CD para Frontend

**Referencia**: DECISIONS.md DEC-021 (Frontend en Vercel), DEC-023 (CI/CD Académico en GitHub Actions).

**Razón**: Se menciona Vercel para despliegue de frontend, pero no se especifica el flujo de CI/CD (GitHub Actions → Vercel, Vercel Git Integration).

**Impacto en Arquitectura**: No se puede definir el pipeline de CI/CD de frontend sin esta decisión.

---

### 16. Mecanismo de CI/CD para Backend

**Referencia**: DECISIONS.md DEC-024 (Pipeline GRI FIJO en Jenkins), RNF-MAINT-001 (Cobertura ≥ 80%).

**Razón**: Se menciona Jenkins para pipeline GRI, pero no se especifica el flujo de CI/CD de backend (GitHub Actions → Vercel Serverless, Jenkins → Docker).

**Impacto en Arquitectura**: No se puede definir el pipeline de CI/CD de backend sin esta decisión.

---

### 17. Mecanismo de Gestión de Secretos

**Referencia**: RNF-SEC-005 (Cero secretos en repositorio).

**Razón**: El RNF exige gestión de secretos, pero no se especifica la tecnología (Vercel Environment Variables, AWS Secrets Manager, Doppler).

**Impacto en Arquitectura**: No se puede definir el componente de gestión de secretos sin esta decisión.

---

### 18. Mecanismo de Backup y Recuperación

**Referencia**: RNF-REL-001 (Uptime ≥ 99%).

**Razón**: El RNF exige disponibilidad, pero no se especifica el mecanismo de backup (Neon automatic backups, pg_dump manual, point-in-time recovery).

**Impacto en Arquitectura**: No se puede definir el componente de backup sin esta decisión.

---

### 19. Mecanismo de Testing de Performance

**Referencia**: RNF-PERF-001 (P95 < 300ms), RNF-SCAL-001 (hasta 10,000 productos).

**Razón**: Los RNF de performance exigen métricas específicas, pero no se especifica la herramienta de testing (k6, Locust, Artillery).

**Impacto en Arquitectura**: No se puede definir el componente de testing de performance sin esta decisión.

---

### 20. Mecanismo de Testing de Seguridad

**Referencia**: RNF-SEC-001 (RLS), RNF-SEC-003 (Idempotencia).

**Razón**: Los RNF de seguridad exigen validaciones específicas, pero no se especifica la herramienta de testing de seguridad (OWASP ZAP, Burp Suite, Schemathesis).

**Impacto en Arquitectura**: No se puede definir el componente de testing de seguridad sin esta decisión.

---

### 21. Transición ORD-T-04: PAID → READY_TO_SHIP

**Referencia**: FSM-02 (Sección 3.3).

**Razón**: La transición está inferida pero no documentada explícitamente en ningún módulo. No se puede definir el componente que ejecuta esta transición sin decisión explícita.

**Impacto en Arquitectura**: No se puede definir el flujo de transición de Order sin esta decisión.

---

### 22. Transición ORD-T-06: SHIPPED → DELIVERED

**Referencia**: FSM-02 (Sección 3.3).

**Razón**: La transición está inferida pero no documentada explícitamente en ningún módulo.

**Impacto en Arquitectura**: No se puede definir el flujo de entrega sin esta decisión.

---

### 23. Transición ORD-T-07: PAID → REFUNDED

**Referencia**: FSM-02 (Sección 3.3).

**Razón**: La transición está inferida pero no documentada explícitamente en ningún módulo.

**Impacto en Arquitectura**: No se puede definir el flujo de reembolso sin esta decisión.

---

### 24. Formato de Exportación de Datos

**Referencia**: MOD-ADM-01 (OPS-ADM-008), DECISIONS.md DEC-027.

**Razón**: DECISIONS.md DEC-027 establece CSV como formato inicial, pero no se especifica la tecnología de generación (pandas, csv module, Apache POI).

**Impacto en Arquitectura**: No se puede definir el componente de exportación sin esta decisión.

---

### 25. Soft-Delete vs Hard-Delete de User

**Referencia**: MOD-ADM-01 (OPS-ADM-004), DECISIONS.md DEC-028.

**Razón**: DECISIONS.md DEC-028 establece soft-delete obligatorio, pero no se especifica el mecanismo técnico (trigger de BD, aplicación, vista filtrada).

**Impacto en Arquitectura**: No se puede definir el componente de eliminación de usuarios sin esta decisión.

---

### 26. Archivado vs Eliminación de AuditLog

**Referencia**: MOD-SYS-01 (AUTO-SYS-003), DECISIONS.md DEC-029.

**Razón**: DECISIONS.md DEC-029 establece anonimización después de 12 meses, pero no se especifica el mecanismo técnico (job de BD, aplicación, particionamiento).

**Impacto en Arquitectura**: No se puede definir el componente de retención de AuditLog sin esta decisión.

---

### 27. Límite de Intentos MFA

**Referencia**: MOD-AUT-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre el límite de intentos MFA fallidos antes de bloqueo temporal.

**Impacto en Arquitectura**: No se puede definir el componente de bloqueo de MFA sin esta decisión.

---

### 28. Regeneración de Códigos de Respaldo MFA

**Referencia**: MOD-AUT-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre el mecanismo de regeneración de códigos de respaldo.

**Impacto en Arquitectura**: No se puede definir el componente de gestión de códigos de respaldo sin esta decisión.

---

### 29. Capacidad de ADMIN para Forzar MFA en SELLER

**Referencia**: MOD-AUT-01 (Notas de diseño), DECISIONS.md DEC-026.

**Razón**: DECISIONS.md DEC-026 establece que está fuera de alcance MVP, pero no se especifica cómo se implementaría en v1.1.

**Impacto en Arquitectura**: No se puede diseñar la extensión de MFA forzado sin esta decisión.

---

### 30. SLA de Respuesta para Consultas

**Referencia**: MOD-CON-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre el SLA de respuesta para consultas pre-venta.

**Impacto en Arquitectura**: No se puede definir el componente de alertas de SLA sin esta decisión.

---

### 31. Canal de Notificación al Cliente tras Respuesta de Consulta

**Referencia**: MOD-CON-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre el canal de notificación (email, push, in-app).

**Impacto en Arquitectura**: No se puede definir el componente de notificaciones de consultas sin esta decisión.

---

### 32. SLA de Despacho

**Referencia**: MOD-SEL-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre el SLA de despacho tras PAID → READY_TO_SHIP.

**Impacto en Arquitectura**: No se puede definir el componente de alertas de SLA de despacho sin esta decisión.

---

### 33. Capacidad de Gestión Activa del SELLER sobre Cotizaciones

**Referencia**: MOD-COT-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre si el SELLER puede extender vigencia o anular cotizaciones.

**Impacto en Arquitectura**: No se puede diseñar la extensión de gestión de cotizaciones sin esta decisión.

---

### 34. Propiedad/Asignación de Cotización a SELLER

**Referencia**: MOD-COT-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre si las cotizaciones se asignan a un SELLER específico.

**Impacto en Arquitectura**: No se puede diseñar el modelo de asignación de cotizaciones sin esta decisión.

---

### 35. Visibilidad de ADMIN sobre Cotizaciones

**Referencia**: MOD-COT-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre si ADMIN tiene vista de supervisión sobre cotizaciones.

**Impacto en Arquitectura**: No se puede diseñar la vista de ADMIN sobre cotizaciones sin esta decisión.

---

### 36. Visibilidad de ADMIN sobre Consultas

**Referencia**: MOD-CON-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre si ADMIN puede ver la cola de consultas de SELLER.

**Impacto en Arquitectura**: No se puede diseñar la vista de ADMIN sobre consultas sin esta decisión.

---

### 37. Umbral de Stock Mínimo: Conflicto de Actor

**Referencia**: MOD-SEL-01 vs MOD-ADM-01, DECISIONS.md DEC-029.

**Razón**: DECISIONS.md DEC-029 establece jerarquía (producto > global), pero no se especifica el mecanismo técnico de resolución (trigger de BD, aplicación, vista).

**Impacto en Arquitectura**: No se puede diseñar el componente de resolución de umbrales de stock sin esta decisión.

---

## Control de Cambios

|Versión|Fecha|Cambio|Estado|
|---|---|---|---|
|1.0.0|30/06/2026|Versión inicial. 12 secciones documentadas + 37 vacíos detectados.|Borrador (pendiente VoBo)|

---

**Fin del documento.**O-SYS-001 documenta que toda mutación debe registrarse en `audit_logs`, pero no especifica el patrón técnico (middleware FastAPI, decorator, event listener, trigger de BD).

**Impacto en Arquitectura**: No se puede definir el componente de auditoría (middleware, decorator, trigger) sin esta decisión.

---

### 3. Orquestador de Jobs/Scheduler Específico

**Referencia**: MOD-SYS-01 (Notas de diseño: "AUTO-SYS-002 no duplica la especificación de AUTO-FU-002 ni AUTO-CHK-003; aquí solo se documenta la existencia de un orquestador transversal").

**Razón**: AUTO-SYS-002 documenta la existencia de un orquestador de jobs, pero no especifica la tecnología (Vercel Cron, Celery, APScheduler, cron nativo).

**Impacto en Arquitectura**: No se puede definir el componente de scheduler (Vercel Cron, Celery, etc.) sin esta decisión.

---

### 4. Mecanismo de Publicación/Consumo de Eventos de Dominio

**Referencia**: Modelo de Dominio §7 (Eventos de Dominio).

**Razón**: Los eventos de dominio están documentados, pero no se especifica el mecanismo de publicación/consumo (in-process, message queue, event bus).

**Impacto en Arquitectura**: No se puede definir el componente de eventos (Redis Pub/Sub, RabbitMQ, in-process) sin esta decisión.

---

### 5. Mecanismo de Generación de PDF

**Referencia**: MOD-FU-01 (OPS-FU-005), MOD-COT-01 (OPS-COT-003).

**Razón**: La generación de PDF está documentada como operación, pero no se especifica la tecnología (WeasyPrint, Puppeteer, wkhtmltopdf).

**Impacto en Arquitectura**: No se puede definir el componente de generación de PDF sin esta decisión.

---

### 6. Mecanismo de Almacenamiento de Archivos

**Referencia**: MOD-COT-01 (OPS-COT-003), MOD-ADM-01 (OPS-ADM-005).

**Razón**: El almacenamiento de PDFs e imágenes está documentado, pero no se especifica la tecnología (Supabase Storage, AWS S3, Vercel Blob).

**Impacto en Arquitectura**: No se puede definir el componente de storage sin esta decisión.

---

### 7. Mecanismo de Envío de Emails

**Referencia**: MOD-CHK-01 (OPS-CHK-007), MOD-CON-01 (OPS-CON-003).

**Razón**: El envío de emails está documentado, pero no se especifica la tecnología (Resend, SendGrid, SMTP directo). Además, el canal de notificación para consultas respondidas está pendiente (vacío ya señalado en MOD-CON-01).

**Impacto en Arquitectura**: No se puede definir el componente de correo sin esta decisión.

---

### 8. Mecanismo de Migraciones de Base de Datos

**Referencia**: Modelo de Dominio §3 (Entidades).

**Razón**: El esquema de base de datos está documentado, pero no se especifica la herramienta de migraciones (Alembic, Prisma Migrate, Django Migrations).

**Impacto en Arquitectura**: No se puede definir el componente de migraciones sin esta decisión.

---

### 9. Mecanismo de Indexación de Búsqueda

**Referencia**: MOD-CAT-01 (AUTO-CAT-002).

**Razón**: AUTO-CAT-002 documenta indexación de búsqueda, pero no especifica la tecnología (PostgreSQL full-text search, Elasticsearch, Meilisearch).

**Impacto en Arquitectura**: No se puede definir el componente de búsqueda sin esta decisión.

---

### 10. Mecanismo de Cache

**Referencia**: RNF-PERF-001 (P95 < 300ms), RNF-SCAL-001 (hasta 10,000 productos).

**Razón**: Los RNF de performance exigen tiempos de respuesta específicos, pero no se especifica el mecanismo de cache (Redis, Vercel Edge Cache, ISR de Next.js).

**Impacto en Arquitectura**: No se puede definir el componente de cache sin esta decisión.

---

### 11. Mecanismo de Rate Limiting

**Referencia**: RNF-SEC-008 (Rate limiting en endpoints públicos).

**Razón**: El RNF exige rate limiting, pero no se especifica la tecnología (Redis + sliding window, Vercel Edge Middleware, Nginx).

**Impacto en Arquitectura**: No se puede definir el componente de rate limiting sin esta decisión.

---

### 12. Mecanismo de WAF

**Referencia**: RNF-SEC-007 (Headers de seguridad), zero_trust_actors.md §1 (ZT-05 Defensa en profundidad).

**Razón**: Se menciona Cloudflare WAF como capa perimetral, pero no se especifica la configuración ni las reglas.

**Impacto en Arquitectura**: No se puede definir la configuración del WAF sin esta decisión.

---

### 13. Mecanismo de Monitoreo y Alertas

**Referencia**: RNF-REL-001 (Uptime ≥ 99%).

**Razón**: El RNF exige monitoreo de uptime, pero no se especifica la tecnología (UptimeRobot, Vercel Analytics, Sentry).

**Impacto en Arquitectura**: No se puede definir el componente de monitoreo sin esta decisión.

---

### 14. Mecanismo de Logging de Aplicación

**Referencia**: AUTO-SYS-001 (Registro de auditoría).

**Razón**: AUTO-SYS-001 documenta registro de auditoría en `audit_logs`, pero no se especifica el mecanismo de logging de aplicación (stdout, structured logging, ELK stack).

**Impacto en Arquitectura**: No se puede definir el componente de logging sin esta decisión.

---

### 15. Mecanismo de CI/CD para Frontend

**Referencia**: DECISIONS.md DEC-021 (Frontend en Vercel), DEC-023 (CI/CD Académico en GitHub Actions).

**Razón**: Se menciona Vercel para despliegue de frontend, pero no se especifica el flujo de CI/CD (GitHub Actions → Vercel, Vercel Git Integration).

**Impacto en Arquitectura**: No se puede definir el pipeline de CI/CD de frontend sin esta decisión.

---

### 16. Mecanismo de CI/CD para Backend

**Referencia**: DECISIONS.md DEC-024 (Pipeline GRI FIJO en Jenkins), RNF-MAINT-001 (Cobertura ≥ 80%).

**Razón**: Se menciona Jenkins para pipeline GRI, pero no se especifica el flujo de CI/CD de backend (GitHub Actions → Vercel Serverless, Jenkins → Docker).

**Impacto en Arquitectura**: No se puede definir el pipeline de CI/CD de backend sin esta decisión.

---

### 17. Mecanismo de Gestión de Secretos

**Referencia**: RNF-SEC-005 (Cero secretos en repositorio).

**Razón**: El RNF exige gestión de secretos, pero no se especifica la tecnología (Vercel Environment Variables, AWS Secrets Manager, Doppler).

**Impacto en Arquitectura**: No se puede definir el componente de gestión de secretos sin esta decisión.

---

### 18. Mecanismo de Backup y Recuperación

**Referencia**: RNF-REL-001 (Uptime ≥ 99%).

**Razón**: El RNF exige disponibilidad, pero no se especifica el mecanismo de backup (Neon automatic backups, pg_dump manual, point-in-time recovery).

**Impacto en Arquitectura**: No se puede definir el componente de backup sin esta decisión.

---

### 19. Mecanismo de Testing de Performance

**Referencia**: RNF-PERF-001 (P95 < 300ms), RNF-SCAL-001 (hasta 10,000 productos).

**Razón**: Los RNF de performance exigen métricas específicas, pero no se especifica la herramienta de testing (k6, Locust, Artillery).

**Impacto en Arquitectura**: No se puede definir el componente de testing de performance sin esta decisión.

---

### 20. Mecanismo de Testing de Seguridad

**Referencia**: RNF-SEC-001 (RLS), RNF-SEC-003 (Idempotencia).

**Razón**: Los RNF de seguridad exigen validaciones específicas, pero no se especifica la herramienta de testing de seguridad (OWASP ZAP, Burp Suite, Schemathesis).

**Impacto en Arquitectura**: No se puede definir el componente de testing de seguridad sin esta decisión.

---

### 21. Transición ORD-T-04: PAID → READY_TO_SHIP

**Referencia**: FSM-02 (Sección 3.3).

**Razón**: La transición está inferida pero no documentada explícitamente en ningún módulo. No se puede definir el componente que ejecuta esta transición sin decisión explícita.

**Impacto en Arquitectura**: No se puede definir el flujo de transición de Order sin esta decisión.

---

### 22. Transición ORD-T-06: SHIPPED → DELIVERED

**Referencia**: FSM-02 (Sección 3.3).

**Razón**: La transición está inferida pero no documentada explícitamente en ningún módulo.

**Impacto en Arquitectura**: No se puede definir el flujo de entrega sin esta decisión.

---

### 23. Transición ORD-T-07: PAID → REFUNDED

**Referencia**: FSM-02 (Sección 3.3).

**Razón**: La transición está inferida pero no documentada explícitamente en ningún módulo.

**Impacto en Arquitectura**: No se puede definir el flujo de reembolso sin esta decisión.

---

### 24. Formato de Exportación de Datos

**Referencia**: MOD-ADM-01 (OPS-ADM-008), DECISIONS.md DEC-027.

**Razón**: DECISIONS.md DEC-027 establece CSV como formato inicial, pero no se especifica la tecnología de generación (pandas, csv module, Apache POI).

**Impacto en Arquitectura**: No se puede definir el componente de exportación sin esta decisión.

---

### 25. Soft-Delete vs Hard-Delete de User

**Referencia**: MOD-ADM-01 (OPS-ADM-004), DECISIONS.md DEC-028.

**Razón**: DECISIONS.md DEC-028 establece soft-delete obligatorio, pero no se especifica el mecanismo técnico (trigger de BD, aplicación, vista filtrada).

**Impacto en Arquitectura**: No se puede definir el componente de eliminación de usuarios sin esta decisión.

---

### 26. Archivado vs Eliminación de AuditLog

**Referencia**: MOD-SYS-01 (AUTO-SYS-003), DECISIONS.md DEC-029.

**Razón**: DECISIONS.md DEC-029 establece anonimización después de 12 meses, pero no se especifica el mecanismo técnico (job de BD, aplicación, particionamiento).

**Impacto en Arquitectura**: No se puede definir el componente de retención de AuditLog sin esta decisión.

---

### 27. Límite de Intentos MFA

**Referencia**: MOD-AUT-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre el límite de intentos MFA fallidos antes de bloqueo temporal.

**Impacto en Arquitectura**: No se puede definir el componente de bloqueo de MFA sin esta decisión.

---

### 28. Regeneración de Códigos de Respaldo MFA

**Referencia**: MOD-AUT-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre el mecanismo de regeneración de códigos de respaldo.

**Impacto en Arquitectura**: No se puede definir el componente de gestión de códigos de respaldo sin esta decisión.

---

### 29. Capacidad de ADMIN para Forzar MFA en SELLER

**Referencia**: MOD-AUT-01 (Notas de diseño), DECISIONS.md DEC-026.

**Razón**: DECISIONS.md DEC-026 establece que está fuera de alcance MVP, pero no se especifica cómo se implementaría en v1.1.

**Impacto en Arquitectura**: No se puede diseñar la extensión de MFA forzado sin esta decisión.

---

### 30. SLA de Respuesta para Consultas

**Referencia**: MOD-CON-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre el SLA de respuesta para consultas pre-venta.

**Impacto en Arquitectura**: No se puede definir el componente de alertas de SLA sin esta decisión.

---

### 31. Canal de Notificación al Cliente tras Respuesta de Consulta

**Referencia**: MOD-CON-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre el canal de notificación (email, push, in-app).

**Impacto en Arquitectura**: No se puede definir el componente de notificaciones de consultas sin esta decisión.

---

### 32. SLA de Despacho

**Referencia**: MOD-SEL-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre el SLA de despacho tras PAID → READY_TO_SHIP.

**Impacto en Arquitectura**: No se puede definir el componente de alertas de SLA de despacho sin esta decisión.

---

### 33. Capacidad de Gestión Activa del SELLER sobre Cotizaciones

**Referencia**: MOD-COT-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre si el SELLER puede extender vigencia o anular cotizaciones.

**Impacto en Arquitectura**: No se puede diseñar la extensión de gestión de cotizaciones sin esta decisión.

---

### 34. Propiedad/Asignación de Cotización a SELLER

**Referencia**: MOD-COT-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre si las cotizaciones se asignan a un SELLER específico.

**Impacto en Arquitectura**: No se puede diseñar el modelo de asignación de cotizaciones sin esta decisión.

---

### 35. Visibilidad de ADMIN sobre Cotizaciones

**Referencia**: MOD-COT-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre si ADMIN tiene vista de supervisión sobre cotizaciones.

**Impacto en Arquitectura**: No se puede diseñar la vista de ADMIN sobre cotizaciones sin esta decisión.

---

### 36. Visibilidad de ADMIN sobre Consultas

**Referencia**: MOD-CON-01 (Notas de diseño), DECISIONS.md (pendiente).

**Razón**: No hay decisión registrada sobre si ADMIN puede ver la cola de consultas de SELLER.

**Impacto en Arquitectura**: No se puede diseñar la vista de ADMIN sobre consultas sin esta decisión.

---

### 37. Umbral de Stock Mínimo: Conflicto de Actor

**Referencia**: MOD-SEL-01 vs MOD-ADM-01, DECISIONS.md DEC-029.

**Razón**: DECISIONS.md DEC-029 establece jerarquía (producto > global), pero no se especifica el mecanismo técnico de resolución (trigger de BD, aplicación, vista).

**Impacto en Arquitectura**: No se puede diseñar el componente de resolución de umbrales de stock sin esta decisión.

---

## Control de Cambios

|Versión|Fecha|Cambio|Estado|
|---|---|---|---|
|1.0.0|30/06/2026|Versión inicial. 12 secciones documentadas + 37 vacíos detectados.|Borrador (pendiente VoBo)|

---

## 🆕 EXTENSIONES v1.2 (14 Mejoras UI/UX e Integraciones)

### 🔗 Diagrama de Integraciones Externas

┌─────────────────────────────────────────────────────────────┐
│ ALLENG │
│ │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Frontend │ │ Backend │ │ Base de │ │
│ │ (Next.js) │ │ (FastAPI) │ │ Datos │ │
│ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ │
│ │ │ │ │
└─────────┼─────────────────┼─────────────────┼───────────────┘
│ │ │
│ │ │
┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
│ Mercado │ │ Telegram │ │ Excel │
│ Pago │ │ (Deep │ │ Parsing │
│ │ │ Links) │ │ │
└───────────┘ └───────────┘ └───────────┘


### 🔐 Integración con Mercado Pago

**Flujo de Pago:**

Usuario clickea "Comprar Ahora"
↓
Backend crea Order en estado PEDIDO
↓
Backend reserva stock (reserved_stock += qty)
↓
Backend crea preferencia en MP:
{
"items": [...],
"total": 1000.00,
"external_reference": "fu_123e4567-e89b-12d3"
}
↓
MP retorna preference_url
↓
Frontend redirige a MP (Checkout Pro)
↓
Usuario paga en MP
↓
MP envía webhook a /api/webhooks/mercadopago
{
"type": "payment",
"data": {
"status": "approved",
"external_reference": "fu_123e4567-e89b-12d3"
}
}
↓
Backend valida firma HMAC
↓
Backend busca Order por external_reference
↓
Backend actualiza:
Order.status: PEDIDO → CONFIRMADO
reserved_stock → stock definitivo
↓
Backend envía email de confirmación


**Seguridad:**
- Credenciales MP en `.env` (NO en BD)
- Webhook valida firma HMAC-SHA256
- Idempotencia con `PaymentIdempotencyKey`

### 💬 Integración con Telegram

**Deep Links (Solo salida):**

1. Usuario clickea "Consultar por Telegram" ↓
2. Frontend construye URL: https://t.me/username?text=[URL_ENCODED_MESSAGE]
    
    Mensaje: "Hola, tengo una consulta sobre: Producto: Cable UTP Cat6 305m SKU: UTP-CAT6-305 Cantidad: 5 unidades Estado: Sin stock" ↓
3. Navegador abre Telegram (app o web) ↓
4. Usuario envía mensaje ↓
5. SELLER responde por Telegram (fuera de Alling)


**Nota:** No hay bot bidireccional en MVP. Telegram es solo canal de salida.

### 📊 Procesamiento de Excel

**Flujo de Carga Masiva:**

1. Usuario sube archivo Excel ↓
2. Frontend valida:
    - Tamaño < 5MB
    - Formato .xls/.xlsx/.csv ↓
3. Backend lee archivo (pandas/openpyxl) ↓
4. Backend detecta columnas:
    - Si coinciden con plantilla → procesar
    - Si no → mostrar modal de mapeo ↓
5. Backend valida cada fila:
    - SKU existe en DB?
    - Stock disponible >= cantidad? ↓
6. Backend retorna resumen: { "total_rows": 50, "valid_rows": 45, "errors": [ {"row": 12, "sku": "XYZ", "error": "SKU no existe"}, {"row": 23, "sku": "ABC", "error": "Stock insuficiente: 5 < 10"} ] } ↓
7. Frontend muestra pre-visualización ↓
8. Usuario confirma o corrige ↓
9. Backend agrega items al Formato Único


### 🎨 Sistema de Diseño Global

**Paleta de Colores:**

```css
:root {
  /* Primario */
  --primary: #10B981;        /* Turquesa/Verde Esmeralda */
  --primary-hover: #059669;
  
  /* Texto */
  --text-primary: #111827;   /* Gris oscuro */
  --text-secondary: #6B7280; /* Gris medio */
  --text-metadata: #9CA3AF;  /* Gris claro */
  
  /* Estados */
  --success: #10B981;
  --warning: #F59E0B;
  --danger: #EF4444;
  
  /* UI */
  --background: #FFFFFF;
  --border: #E5E7EB;
  --muted: #F1F5F9;
  
  /* Footer */
  --footer-bg: #111111;
  --footer-text: #FFFFFF;
}
```

**Tipografía:**

- Familia: Inter (Google Fonts)
- Pesos: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

**Componentes Globales:**

- Header: Sticky, 2 bloques (utilidades + menú)
- Footer: Tema oscuro, 3 columnas
- Notificaciones: Badge en header, polling cada 30s

### 🔐 Gestión de Secretos

**Variables de Entorno (.env):**

```css
# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/alling

# JWT
JWT_SECRET_KEY=...
JWT_ALGORITHM=HS256

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Mercado Pago
MP_ACCESS_TOKEN=sk_test_...  # Sandbox
MP_PUBLIC_KEY=pk_test_...
MP_WEBHOOK_SECRET=whsec_...

# Telegram
TELEGRAM_BOT_USERNAME=alling_support

# AWS/S3 (para imágenes)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET=alling-assets

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
```

**SystemConfig (solo parámetros de negocio):**

```Python
{
  "quote_validity_days": 7,
  "payment_timeout_minutes": 30,
  "stock_min_threshold_default": 10,
  "max_excel_file_size_mb": 5,
  "audit_log_retention_months": 12
}
```

