# 📊 MATRICES COMPLEMENTARIAS — Módulos Restantes

**Documento:** `04_EJECUCION/MATRIZ_TRAZABILIDAD_COMPLEMENTARIA.md`
**Versión:** 1.2.0
**Alcance:** Módulos no críticos (ADM, SEL, CON, COT, DIS, SYS, AUT restante)

---

##  1. MATRIZ DE MÓDULOS ADMINISTRATIVOS (MOD-ADM-01 + MOD-SEL-01)

| ID RF / RNF | Caso de Uso / Historia de Usuario | Criterios de Aceptación (CA) | Componente / Módulo | Caso de Prueba Conceptual | Estado en Sprint |
|---|---|---|---|---|---|
| **RF-ADM-001** | HU-ADM-001: Como ADMIN quiero crear/editar usuarios SELLER/ADMIN | Formulario con email, rol, contraseña temporal; ADMIN requiere MFA | `app/admin/usuarios/page.tsx` + `UserService` | Crear SELLER → login funciona; crear ADMIN → forzar MFA | ⏳ Pendiente |
| **RF-ADM-002** | HU-ADM-001: Como ADMIN quiero suspender usuarios | Toggle `is_active=false`; usuario no puede hacer login | `app/admin/usuarios/[id]/page.tsx` | Suspender SELLER → login retorna 403 | ⏳ Pendiente |
| **RF-ADM-003** | HU-ADM-001: Como ADMIN quiero soft-delete usuarios | Campo `deleted_at` populated; usuario no aparece en listados | `UserService.soft_delete()` | Eliminar usuario → no aparece en queries | ⏳ Pendiente |
| **RF-ADM-004** | HU-ADM-002: Como ADMIN quiero CRUD de productos | Formulario con SKU, nombre, precio, stock, categoría, imágenes | `app/admin/productos/page.tsx` + `ProductService` | Crear producto → visible en catálogo público | ⏳ Pendiente |
| **RF-ADM-005** | HU-ADM-002: Como ADMIN quiero gestionar categorías | CRUD de categorías con nombre, descripción, imagen | `app/admin/categorias/page.tsx` | Crear categoría → productos pueden asignarse | ⏳ Pendiente |
| **RF-ADM-006** | HU-ADM-003: Como ADMIN quiero configurar parámetros globales | Formulario de `SystemConfig` (días vigencia cotización, umbral stock) | `app/admin/configuracion/page.tsx` | Cambiar vigencia → nuevas cotizaciones usan nuevo valor | ⏳ Pendiente |
| **RF-ADM-007** | HU-ADM-004: Como ADMIN quiero ver métricas de ventas | Dashboard con revenue total, top productos, órdenes por estado | `app/admin/dashboard/page.tsx` + `AnalyticsService` | Verificar cálculos correctos de métricas | ⏳ Pendiente |
| **RF-ADM-008** | HU-ADM-005: Como ADMIN quiero exportar datos CSV | Botón descarga CSV con filtros aplicados; requiere MFA step-up | `ExportService` + `BTN-ADM-008` | Exportar 1000 productos → CSV descargado correctamente | ⏳ Pendiente |
| **RF-ADM-009** 🆕 | HU-ADM-009: Como ADMIN quiero gestionar Kits | CRUD de Kits con selección de productos componentes | `app/admin/kits/page.tsx` + `KitService` | Crear Kit con 3 productos → precio calculado dinámicamente | ⏳ Pendiente |
| **RF-SEL-001** | HU-SEL-001: Como SELLER quiero ver listado de productos | Grid de productos con stock, umbral mínimo, badge de alerta | `app/vendedor/productos/page.tsx` + `ProductQueryService` | Verificar que solo ve productos asignados (RLS) | ⏳ Pendiente |
| **RF-SEL-002** | HU-SEL-001: Como SELLER quiero actualizar stock | Input inline para modificar stock; validación >= 0 | `InventoryService` + `BTN-SEL-002` | Actualizar stock de 10 a 15 → cambio persistido | ⏳ Pendiente |
| **RF-SEL-003** | HU-SEL-001: Como SELLER quiero configurar umbral mínimo | Input para `stock_min_threshold` por producto | `InventoryService` + `BTN-SEL-003` | Configurar umbral 5 → alerta si stock < 5 | ⏳ Pendiente |
| **RF-SEL-004** | HU-SEL-002: Como SELLER quiero ver cola de pedidos READY_TO_SHIP | Lista paginada de órdenes listas para despachar | `app/vendedor/pedidos/page.tsx` + `OrderQueryService` | Verificar que solo ve órdenes asignadas (RLS) | ⏳ Pendiente |
| **RF-SEL-005** | HU-SEL-002: Como SELLER quiero generar guía de envío | Formulario con peso, dimensiones, notas; genera tracking_code mock | `ShippingService` + `BTN-SEL-005` | Generar guía → Order cambia a SHIPPED | ⏳ Pendiente |
| **RF-SEL-006** | HU-SEL-003: Como SELLER quiero consultar historial de pedidos | Filtros por fecha, estado, cliente; exportación CSV | `app/vendedor/historial/page.tsx` | Filtrar por último mes → resultados correctos | ⏳ Pendiente |
| **RF-SEL-007** 🆕 | HU-SEL-007: Como SELLER quiero contactar cliente por Telegram | Botón en consultas que abre `t.me/[username_cliente]` | `app/vendedor/consultas/page.tsx` + `BTN-SEL-004` | Click en botón → abre Telegram con username correcto | ⏳ Pendiente |

---

##  2. MATRIZ DE MÓDULOS DE POST-VENTA (MOD-CON-01 + MOD-COT-01)

| ID RF / RNF | Caso de Uso / Historia de Usuario | Criterios de Aceptación (CA) | Componente / Módulo | Caso de Prueba Conceptual | Estado en Sprint |
|---|---|---|---|---|---|
| **RF-CON-001** | HU-CON-001: Como CUSTOMER quiero crear consulta desde FU | Botón "Solicitar Asesoría" en BORRADOR → transición a CONSULTA | `app/formato/page.tsx` + `BTN-FU-005` | Click en botón → FU cambia a CONSULTA | ⏳ Pendiente |
| **RF-CON-002** | HU-CON-002: Como SELLER quiero ver consultas asignadas | Lista de consultas en estado CONSULTA con prioridad | `app/vendedor/consultas/page.tsx` + `FormatoUnicoQueryService` | Verificar que solo ve consultas asignadas (RLS) | ⏳ Pendiente |
| **RF-CON-003** | HU-CON-002: Como SELLER quiero responder consulta | Textarea para respuesta; transición CONSULTA → RESUELTA | `app/vendedor/consultas/[id]/page.tsx` + `StateMachineService` | Responder → FU cambia a RESUELTA + notificación | ⏳ Pendiente |
| **RF-CON-004** | HU-CON-003: Como CUSTOMER quiero ver respuesta a consulta | Banner azul en Dashboard con link a la respuesta | `NotificationService` + `CMP-FU-013` | Recibir notificación → click lleva a respuesta | ⏳ Pendiente |
| **RF-COT-001** | HU-COT-001: Como SELLER quiero ver listado de cotizaciones | Grid de FU en COTIZACIÓN con countdown de vigencia | `app/vendedor/cotizaciones/page.tsx` | Verificar que solo ve cotizaciones asignadas (RLS) | ⏳ Pendiente |
| **RF-COT-002** | HU-COT-001: Como SELLER quiero ver detalle de cotización | Tabla de ítems con `price_at_time`, totales, estado FSM | `app/vendedor/cotizaciones/[id]/page.tsx` | Verificar que precios son inmutables (snapshot) | ⏳ Pendiente |
| **RF-COT-003** | HU-COT-002: Como SELLER quiero descargar PDF de cotización | Botón genera PDF con logo, datos cliente, ítems, totales | `QuoteService` + `BTN-COT-003` | Descargar PDF → archivo válido con datos correctos | ⏳ Pendiente |

---

##  3. MATRIZ DE MÓDULOS DE SISTEMA E INTEGRACIÓN (MOD-SYS-01 + MOD-DIS-01 + AUT restante)

| ID RF / RNF | Caso de Uso / Historia de Usuario | Criterios de Aceptación (CA) | Componente / Módulo | Caso de Prueba Conceptual | Estado en Sprint |
|---|---|---|---|---|---|
| **RF-SYS-001** | HU-SYS-001: Como sistema quiero registrar auditoría inmutable | Toda mutación crea registro en `audit_logs` con actor, timestamp, cambios | `AUTO-SYS-001` + trigger PostgreSQL | Crear producto → verificar registro en audit_logs | ⏳ Pendiente |
| **RF-SYS-002** | HU-SYS-002: Como sistema quiero ejecutar jobs programados | Scheduler ejecuta AUTO-FU-002, AUTO-CHK-003, AUTO-SYS-003 | `SchedulerService` + Vercel Cron | Esperar 24h → job expira cotizaciones antiguas | ⏳ Pendiente |
| **RF-SYS-003** 🆕 | HU-SYS-003: Como sistema quiero aplicar paleta de colores global | Variables CSS con colores corporativos en todas las pantallas | `app/globals.css` + Tailwind config | Inspeccionar elemento → color #10B981 en botones primarios | ⏳ Pendiente |
| **RF-SYS-004** 🆕 | HU-SYS-004: Como sistema quiero mostrar notificaciones FSM | Badge en header con conteo de notificaciones no leídas | `CMP-SYS-011` + `NotificationService` | Crear notificación → badge incrementa; click → decrementa | ⏳ Pendiente |
| **RF-SYS-005** 🆕 | HU-SYS-005: Como sistema quiero mostrar icono de favoritos | Icono corazón en header visible solo para CUSTOMER | `CMP-SYS-012` + RBAC middleware | GUEST → no ve icono; CUSTOMER → ve icono | ⏳ Pendiente |
| **RF-DIS-001** | HU-DIS-001: Como DISTRIBUTOR quiero sincronizar precios vía API | Endpoint POST `/api/v1/distributors/prices` con HMAC auth | `DistributorAuthService` + `PricingService` | Enviar batch de 100 precios → todos actualizados | ⏳ Pendiente |
| **RF-DIS-002** | HU-DIS-001: Como DISTRIBUTOR quiero sincronizar stock vía API | Endpoint POST `/api/v1/distributors/stock` con HMAC auth | `DistributorAuthService` + `InventoryService` | Enviar batch de 100 stocks → todos actualizados | ⏳ Pendiente |
| **RF-DIS-003** | RNF-SEC-004: Autenticación DISTRIBUTOR con HMAC | Validación de firma HMAC-SHA256 + nonce único en ventana ±5min | `DistributorAuthService` + `NonceRegistry` | Request sin firma → 401; nonce repetido → 409 | ⏳ Pendiente |
| **RF-DIS-004** | HU-DIS-002: Como sistema quiero manejar SKU desconocidos | Si SKU no existe, retorna partial success (207) con lista de errores | `DistributorAuthService` + response 207 | Enviar 10 SKUs (5 válidos, 5 inválidos) → 207 con errores | ⏳ Pendiente |
| **RF-AUT-004** | HU-AUT-004: Como usuario quiero recuperar contraseña | Formulario envía email con link de reset; token expira en 1h | `AuthService` + `NotificationService` | Solicitar reset → email recibido; link expirado → 401 | ⏳ Pendiente |
| **RF-AUT-005** | HU-AUT-005: Como sistema quiero mantener sesiones persistentes | JWT RS256 con expiración 15 días; refresh token opcional | `AuthService` + `python-jose` | Login → token válido por 15 días; expirado → 401 | ⏳ Pendiente |
| **RF-AUT-006** | HU-AUT-006: Como usuario quiero cerrar sesión | Endpoint revoca token (blacklist opcional); frontend limpia cookies | `AuthService` + `BTN-AUT-006` | Logout → token inválido; reintentar → 401 | ⏳ Pendiente |

---

## 📈 RESUMEN DE COBERTURA COMPLEMENTARIA

### Métricas de Trazabilidad

| Dimensión | Total | Cubiertos en Matriz Original | Cubiertos en Complementaria | Cobertura Total |
|---|---|---|---|---|
| **RF Totales** | 83 | 52 | 31 | **83 (100%)** |
| **Módulos** | 10 | 4 | 6 | **10 (100%)** |
| **Pantallas Frontend** | ~30 | ~18 | ~12 | **~30 (100%)** |

### Distribución por Módulo Complementario

| Módulo | RF Cubiertos | % del Total Módulo | Prioridad Promedio |
|---|---|---|---|
| MOD-ADM-01 | 9 | 100% | MEDIA |
| MOD-SEL-01 | 7 | 100% | ALTA |
| MOD-CON-01 | 4 | 100% | MEDIA |
| MOD-COT-01 | 3 | 100% | MEDIA |
| MOD-SYS-01 | 5 | 100% | ALTA |
| MOD-DIS-01 | 4 | 100% | MEDIA |
| MOD-AUT-01 (restante) | 3 | 50% | MEDIA |

---

##  RELACIÓN CON ARTEFACTOS FRONTEND

### Componentes Frontend Nuevos Requeridos

**Módulos Administrativos:**
- `CMP-ADM-001`: Formulario de creación de usuarios
- `CMP-ADM-002`: Grid de productos con acciones inline
- `CMP-ADM-003`: Dashboard de métricas con gráficos
- `CMP-ADM-004`: Kit builder (selector múltiple de productos)
- `CMP-SEL-001`: Grid de productos con alertas de stock
- `CMP-SEL-002`: Cola de pedidos con acciones rápidas

**Módulos de Post-Venta:**
- `CMP-CON-001`: Panel de consultas con textarea de respuesta
- `CMP-COT-001`: Grid de cotizaciones con countdown
- `CMP-COT-002`: Detalle de cotización con botón PDF

**Módulos de Sistema:**
- `CMP-SYS-001`: Badge de notificaciones en header
- `CMP-SYS-002`: Icono de favoritos (condicional por rol)
- `CMP-SYS-003`: Footer persistente con trust signals

---

##  ESTRATEGIA DE IMPLEMENTACIÓN

### Priorización por Sprint

**Sprint 2 (Post-MVP crítico):**
1. MOD-SEL-01 (7 RF) — Panel de vendedor para operaciones diarias
2. MOD-CON-01 (4 RF) — Gestión de consultas para soporte
3. RF-SYS-001 y RF-SYS-002 — Auditoría y jobs programados

**Sprint 3 (Funcionalidades administrativas):**
1. MOD-ADM-01 (9 RF) — Panel de administración completo
2. MOD-COT-01 (3 RF) — Gestión de cotizaciones
3. RF-SYS-003 a RF-SYS-005 — UI global (colores, notificaciones, favoritos)

**Sprint 4 (Integraciones y refinamiento):**
1. MOD-DIS-01 (4 RF) — Integración con distribuidor
2. RF-AUT-004 a RF-AUT-006 — Funcionalidades de autenticación restantes
3. Optimizaciones de performance y seguridad

### Dependencias Críticas

- **MOD-SEL-01** depende de **MOD-FU-01** (para ver cotizaciones asignadas)
- **MOD-CON-01** depende de **MOD-FU-01** (para transiciones de estado)
- **MOD-COT-01** depende de **MOD-FU-01** (para leer datos de cotizaciones)
- **MOD-ADM-009** (Kits) depende de **MOD-CAT-01** (para seleccionar productos)
- **RF-SYS-004** (notificaciones) depende de **MOD-FU-01** (eventos FSM)

---

**Fin del documento.**
