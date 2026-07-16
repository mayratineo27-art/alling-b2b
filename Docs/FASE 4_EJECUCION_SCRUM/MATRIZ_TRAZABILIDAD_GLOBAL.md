# 📊 MATRIZ DE TRAZABILIDAD GLOBAL — Proyecto Alling v1.2

**Documento:** `04_EJECUCION/MATRIZ_TRAZABILIDAD_GLOBAL.md`
**Versión:** 1.2.0
**Metodología:** Scrum + Spec-Driven Development (SDD)
**Alcance:** Módulos críticos (MOD-FU-01, MOD-CAT-01, MOD-CHK-01) + Zero Trust transversal

---

## 🎯 1. MÓDULO MOD-FU-01 — Formato Único (Núcleo del Negocio)

| ID RF / RNF      | Caso de Uso / Historia de Usuario                                         | Criterios de Aceptación (CA)                                                                    | Componente / Módulo                                   | Caso de Prueba Conceptual                                  | Estado en Sprint |
| ---------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- | ---------------- |
| **RF-FU-001**    | HU-FU-001: Como GUEST/CUSTOMER quiero crear un Formato Único en BORRADOR  | Si no existe FU activo, se crea uno nuevo con estado BORRADOR                                   | `app/formato/page.tsx` + `FormatoUnicoService`        | Crear FU vacío y verificar estado inicial BORRADOR         | ✅ Listo          |
| **RF-FU-002**    | HU-FU-001: Como GUEST quiero agregar productos al FU                      | Si stock > 0, el ítem se agrega y se recalcula el subtotal                                      | `FormatoUnicoService.agregar_item()`                  | Agregar producto con stock=0 → debe fallar con error       | ✅ Listo          |
| **RF-FU-003**    | HU-FU-001: Como CUSTOMER quiero editar cantidades inline                  | Si qty ≤ stock, se actualiza; si qty > stock, se muestra advertencia naranja                    | `CMP-FU-002` (Control de cantidad)                    | Incrementar qty más allá de stock disponible               | ✅ Listo          |
| **RF-FU-004**    | HU-FU-001: Como CUSTOMER quiero eliminar ítems del FU                     | Al eliminar, se recalcula subtotal y se emite EVT-FU-002                                        | `FormatoUnicoService.eliminar_item()`                 | Eliminar último ítem → FU vuelve a vacío                   | ✅ Listo          |
| **RF-FU-005**    | HU-FU-005: Como CUSTOMER quiero generar cotización                        | Transición BORRADOR→COTIZACIÓN fija precios (`price_at_time`) y activa countdown 15 días         | `StateMachineService` + FSM-01                        | Verificar que precios no cambian tras cotizar              | ✅ Listo          |
| **RF-FU-006**    | RNF-INT-002: Precios fijados son inmutables                               | Si ADMIN cambia `price_public`, los FU en COTIZACIÓN mantienen `price_at_time`                  | `PricingService` + snapshot en BD                     | Modificar precio producto y verificar FU existente         | ✅ Listo          |
| **RF-FU-007**    | HU-FU-005: Countdown de vigencia visible                                  | Banner amarillo muestra "Válido por: Xd Yh" con actualización en tiempo real                    | `CMP-FU-019` (Banner FSM)                             | Esperar 24h y verificar actualización del countdown        | ✅ Listo          |
| **RF-FU-008**    | AUTO-FU-002: Expiración automática                                        | Si pasan 15 días, transición COTIZACIÓN→EXPIRADA + liberación de precios                         | `SchedulerService` + `AUTO-FU-002`                    | Job cron dispara expiración y verifica estado              | ✅ Listo          |
| **RF-FU-009**    | HU-FU-005: Como CUSTOMER quiero convertir cotización en pedido            | Transición COTIZACIÓN→PEDIDO reserva stock temporalmente                                        | `OrderService` + `InventoryService`                   | Verificar `reserved_stock` tras iniciar pago               | ✅ Listo          |
| **RF-FU-010**    | HU-FU-010: Como CUSTOMER quiero cancelar un FU                            | Solo permitido en BORRADOR o EXPIRADA; en otros estados retorna 409                             | `StateMachineService` + FSM-01                        | Intentar cancelar FU en COTIZACIÓN → error 409             | ✅ Listo          |
| **RF-FU-011**    | HU-FU-011: Como CUSTOMER quiero ver historial de FU                       | Lista paginada con estados (BORRADOR, COTIZACIÓN, PEDIDO, CONFIRMADO)                           | `app/historial/page.tsx` + `FormatoUnicoQueryService` | Verificar que solo se muestran FU del usuario actual (RLS) | ✅ Listo          |
| **RF-FU-012** 🆕 | HU-FU-002: Como CUSTOMER quiero Dashboard post-login                      | Redirección automática HOME→Dashboard; widget del FU activo + notificaciones                    | `app/dashboard/page.tsx` + `NotificationService`      | Login y verificar redirección + render de notificaciones   | ✅ Listo          |
| **RF-FU-013** 🆕 | HU-FU-003: Como B2B quiero cargar Excel masivo                            | Archivo ≤5MB, 1000 filas procesadas en <5s con pre-visualización                                | `ExcelImportService` + `CMP-FU-016`                   | Subir Excel con 500 filas y verificar tiempo <5s           | ✅ Listo (corregido 12/07/2026, ver §6.3 — validaba contra catálogo fantasma vacío) |
| **RF-FU-014** 🆕 | HU-FU-004: Como B2B quiero descargar plantilla Excel                      | Botón genera `.xlsx` con columnas SKU + Cantidad y datos de ejemplo                             | `CMP-FU-012` (Botón descargar)                        | Descargar y abrir en Excel → columnas correctas            | ✅ Listo (corregido 12/07/2026, ver §6.3 — SKU de ejemplo era ficticio) |
| **RF-FU-015** 🆕 | HU-FU-005: Como B2B quiero mapear columnas propias                        | Si columnas difieren, modal permite mapear "Mi columna X" → SKU/Cantidad                        | `CMP-FU-017` (Modal mapeo)                            | Subir Excel con columnas "Codigo" y "Qty" → mapeo funciona | ⚠️ No implementado (modal de mapeo dinámico no existe en `ExcelImporter.tsx`; gap preexistente, fuera de alcance de §6.3) |
| **RF-FU-016** 🆕 | HU-FU-006: Como CUSTOMER quiero consultar producto sin stock por Telegram | Click en ícono Telegram → abre `t.me` con payload pre-armado (SKU, nombre, qty)                 | `CMP-FU-020` + deep link                              | Verificar URL generada con payload URL-encoded             | ✅ Listo          |
| **RF-FU-017** 🆕 | HU-FU-007: Como CUSTOMER quiero consultar masivamente por Telegram        | Si hay >1 fila roja, aparece botón "Consultar [N] productos" con mensaje concatenado            | `CMP-FU-020` (botón bulk)                             | Agregar 3 productos sin stock → botón aparece con N=3      | ✅ Listo          |
| **RF-FU-018** 🆕 | HU-FU-008: Banners dinámicos según estado FSM                             | Cada estado (BORRADOR/COTIZACIÓN/CONSULTA/EXPIRADA) muestra banner con color y texto específico | `CMP-FU-019` (Banner FSM)                             | Transicionar FU y verificar cambio de banner               | ✅ Listo          |
| **RF-FU-019** 🆕 | HU-FU-009: Validación doble de importación Excel                          | Modal resumen + filas rojas (SKU inválido) / naranjas (stock insuficiente) en tabla             | `ExcelImportService` + `CMP-FU-018`                   | Subir Excel con errores mixtos → colores correctos         | ✅ Listo (corregido 12/07/2026, ver §6.3 — "Confirmar Importación" no aplicaba nada al FU) |

---

## 🛒 2. MÓDULO MOD-CAT-01 — Catálogo (Punto de Entrada)

| ID RF / RNF | Caso de Uso / Historia de Usuario | Criterios de Aceptación (CA) | Componente / Módulo | Caso de Prueba Conceptual | Estado en Sprint |
|---|---|---|---|---|---|
| **RF-CAT-001** | HU-CAT-001: Como GUEST quiero ver listado de productos | Solo productos `is_active=true`; filtros por categoría, marca, precio; paginación | `app/productos/page.tsx` + `ProductQueryService` | Aplicar 3 filtros simultáneos → resultados correctos | ✅ Listo |
| **RNF-PERF-001** | Latencia de búsqueda | P95 < 300ms con 3 filtros activos y 50 usuarios concurrentes | `ProductQueryService` + índices PostgreSQL | k6 load test: P95 < 300ms | ✅ Listo |
| **RF-CAT-002** | HU-CAT-002: Como GUEST quiero ver detalle de producto | Galería de imágenes, especificaciones, stock, botón "Agregar al FU" | `app/productos/[slug]/page.tsx` | Click en producto → detalle completo cargado | ✅ Listo |
| **RF-CAT-003** | HU-CAT-003: Como GUEST quiero buscar productos | Buscador con debounce 300ms busca por nombre, descripción, marca | `CMP-CAT-007` (Buscador) | Escribir "cable" → resultados en <300ms | ✅ Listo |
| **RF-CAT-004** 🆕 | HU-CAT-004: Como GUEST quiero Landing atractiva | Hero con Bokeh + productos destacados (sin precio) + categorías con contadores + novedades | `app/page.tsx` (Landing) + `CMP-CAT-023..026` | Carga inicial < 2s con efecto Bokeh | ✅ Listo |
| **RF-CAT-005** | HU-CAT-005: Como GUEST quiero explorar categorías | Grid de categorías con contador dinámico; click → listado filtrado | `app/categorias/page.tsx` + `CMP-CAT-027` | Verificar contadores actualizados tras cambio de stock | ✅ Listo |
| **RF-CAT-006** | HU-CAT-006: Como B2B quiero ver Kits pre-armados | Precio calculado dinámicamente; stock = mínimo de componentes | `KitService` + `CMP-CAT-028` | Cambiar precio componente → precio Kit se actualiza | ✅ Listo |
| **RF-CAT-007** 🆕 | HU-CAT-007: Como CUSTOMER quiero guardar favoritos | Solo CUSTOMER; persistencia entre sesiones; acceso desde header | `FavoriteService` + `CMP-CAT-029` | GUEST intenta favoritar → botón oculto; CUSTOMER → funciona | ✅ Listo |
| **RF-CAT-008** 🆕 | HU-CAT-008: Como GUEST quiero consultar producto por Telegram | Botón Telegram en card → abre `t.me` con payload (SKU, nombre) | `CMP-CAT-030` + deep link | Verificar URL con payload correcto | ✅ Listo |

---

## 💳 3. MÓDULO MOD-CHK-01 — Checkout y Pago (Cierre de Venta)

| ID RF / RNF | Caso de Uso / Historia de Usuario | Criterios de Aceptación (CA) | Componente / Módulo | Caso de Prueba Conceptual | Estado en Sprint |
|---|---|---|---|---|---|
| **RF-CHK-001** | HU-CHK-001: Como GUEST/CUSTOMER quiero ingresar datos de facturación | Selector Boleta (DNI) / Factura (RUC); auto-completado si CUSTOMER | `app/checkout/page.tsx` + `ValidationService` | CUSTOMER logueado → datos auto-completados | ✅ Listo |
| **RF-CHK-002** | HU-CHK-001: Cálculo de envío | Mock Shalom retorna costo según peso/volumen; visible antes de pagar | `ShippingService` (mock) | Verificar cálculo con 3 productos de distinto peso | ✅ Listo |
| **RF-CHK-003** | HU-CHK-003: Como CUSTOMER quiero pagar con Mercado Pago | Generación de preferencia con `external_reference = FU.id`; redirección a MP | `PaymentService` + SDK MercadoPago | Crear preferencia → URL de MP válida | ✅ Listo |
| **RF-CHK-004** | RNF-SEC-003: Webhook idempotente | Enviar mismo webhook 5 veces → solo 1 transición de estado | `PaymentService.procesar_webhook()` + `PaymentIdempotencyKey` | Test de idempotencia: 5 payloads → 1 Order CONFIRMADO | ✅ Listo |
| **RF-CHK-005** | RNF-SEC-008: Validación HMAC de webhooks | Webhook sin firma válida → HTTP 401 sin procesar | `PaymentService` + verificación HMAC-SHA256 | Enviar webhook con firma inválida → 401 | ✅ Listo |
| **RF-CHK-006** | HU-CHK-003: Transición automática PENDING→PAID | Webhook `status=approved` → Order PAID + FU CONFIRMADO + email | `PaymentService` + FSM-02 | Simular webhook approved → Order cambia estado | ✅ Listo |
| **RF-CHK-007** | HU-CHK-001: Token opaco para GUEST | GUEST recibe `orderToken` para rastrear pedido sin cuenta | `TokenService` + cookie httpOnly | GUEST verifica pedido con token → acceso permitido | ✅ Listo |
| **RF-CHK-008** | HU-CHK-004: Email de confirmación post-pago | Email enviado tras PAID con número de orden y resumen | `NotificationService` (SMTP mock) | Verificar email recibido tras pago exitoso | ✅ Listo |
| **RF-CHK-009** 🆕 | HU-CHK-002: Datos facturación pre-llenados | CUSTOMER logueado → DNI/RUC/dirección auto-completados desde perfil | `app/checkout/page.tsx` + `UserQueryService` | Login → checkout → datos ya llenos | ✅ Listo |
| **RF-CHK-010** 🆕 | HU-CHK-003: Integración Mercado Pago | Checkout Pro o Bricks; `external_reference = FU.id`; webhooks sincronizan FSM | `PaymentService` + webhook endpoint | Flujo completo: pago → webhook → CONFIRMADO | ✅ Listo |
| **RF-CHK-011** 🆕 | RNF-REL-002: Reserva temporal de stock | Al transicionar COTIZACIÓN→PEDIDO, `reserved_stock += qty` | `InventoryService` + `OrderService` | Iniciar pago → stock disponible disminuye | ✅ Listo |
| **RF-CHK-012** 🆕 | AUTO-CHK-003: Expiración de reserva | Si no hay pago en 30 min → libera reserva + Order CANCELADO | `SchedulerService` + `AUTO-CHK-003` | Esperar 31 min → stock vuelve a disponible | ✅ Listo |
| **RF-CHK-013** 🆕 | HU-CHK-004: Pantalla confirmación post-pago | Éxito: checkmark verde + #orden + botón descargar. Rechazo: banner rojo + reintentar | `app/checkout/exito/page.tsx` + `app/checkout/error/page.tsx` | Pago exitoso → pantalla verde; rechazo → pantalla roja | ✅ Listo |
| **RF-CHK-014** 🆕 | RNF-SEC-008: Mapeo webhook MP → FSM | `approved`→CONFIRMADO, `pending`→mantiene PEDIDO, `rejected`→CANCELADO + libera stock | `PaymentService` + FSM-02 | Simular 3 estados MP → 3 transiciones FSM correctas | ✅ Listo |
| **RNF-DIS-001** | Degradación graceful ante fallo MP | Timeout 30s en MP → error controlado, Order mantiene PEDIDO, permite reintento | `PaymentService` + retry con backoff exponencial | Simular timeout MP → UI muestra error + botón reintentar | ✅ Listo |

---

## 🔒 4. CAPA TRANSVERSAL — Zero Trust + Seguridad

| ID RF / RNF | Caso de Uso / Historia de Usuario | Criterios de Aceptación (CA) | Componente / Módulo | Caso de Prueba Conceptual | Estado en Sprint |
|---|---|---|---|---|---|
| **RNF-SEC-001** | Aislamiento de datos con RLS | CUSTOMER A no puede ver datos de CUSTOMER B incluso con JWT válido | PostgreSQL RLS + políticas por tabla | Inyectar JWT de USER_A en query directa → 0 filas | ✅ Listo |
| **RNF-SEC-002** | Autenticación JWT RS256 + MFA ADMIN | JWT asimétrico; ADMIN requiere TOTP obligatorio | `AuthService` + `MFAService` + `python-jose` | ADMIN sin MFA → 403; CUSTOMER con JWT → 200 | ✅ Listo |
| **RNF-SEC-003** | Idempotencia en webhooks | Replay de webhook no genera efectos duplicados | `IdempotencyService` + `PaymentIdempotencyKey` | Enviar webhook 5 veces → 1 mutación | ✅ Listo |
| **RNF-SEC-004** | Autenticación DISTRIBUTOR con HMAC | Nonce único + ventana ±5min; replay retorna 409 | `DistributorAuthService` + `NonceRegistry` | Reutilizar nonce en 24h → HTTP 409 | ✅ Listo |
| **RNF-SEC-005** | Cero secretos en repositorio | `gitleaks` en pre-commit + `Trivy` en CI detectan secrets | Pipeline GRI (Jenkins) + `.gitignore` | Commit con API key → pipeline falla | ✅ Listo |
| **RNF-SEC-006** | Cero CVEs High/Critical | `Trivy` + `pip-audit` + `npm audit` bloquean deploy si hay CVEs críticos | Pipeline GRI + `requirements.txt` + `package.json` | Instalar lib con CVE crítico → build falla | ✅ Listo |
| **RNF-SEC-007** | Headers de seguridad | Todas las respuestas incluyen HSTS, X-Frame-Options, CSP, Referrer-Policy | Middleware FastAPI + Next.js headers | `curl -I` verifica headers presentes | ✅ Listo |
| **RNF-SEC-008** | Rate limiting en endpoints públicos | Máx 100 req/min por IP en `/api/v1/products`; retorna 429 | Middleware FastAPI + Redis sliding window | 101 requests en 1 min → 429 | ✅ Listo |
| **RNF-SEG-001** | Idempotencia y protección replay | Mismo payload 5 veces en 500ms → 1 mutación + 4 HTTP 200 | `IdempotencyService` + índices únicos | Test de concurrencia con 5 requests paralelos | ✅ Listo |
| **RNF-SEG-002** | RLS automático por sesión | Variables `app.current_user_id` + `app.current_role` filtran datos | PostgreSQL RLS + middleware FastAPI | CUSTOMER consulta tabla users → solo ve su registro | ✅ Listo |
| **RNF-AUD-001** | AuditLog inmutable | Ni ADMIN puede borrar/modificar `audit_logs`; retención 12 meses | Trigger PostgreSQL + RLS append-only | `DELETE FROM audit_logs` con ADMIN → rechazado | ✅ Listo |
| **RF-SYS-001** | Inmutabilidad de auditoría | Toda mutación se registra en `audit_logs` con actor, timestamp, cambios | `AUTO-SYS-001` + middleware transversal | Crear producto → verificar registro en audit_logs | ✅ Listo |
| **RF-AUT-001** | Login Google OAuth (CUSTOMER) | Solo CUSTOMER puede usar Google OAuth; SELLER/ADMIN usan credenciales locales | `NextAuth.js` + `AuthService` | CUSTOMER login Google → sesión válida; ADMIN Google → 403 | ✅ Listo |
| **RF-AUT-002** | Login credenciales locales (SELLER/ADMIN) | Email + password con Argon2id; MFA obligatorio para ADMIN | `AuthService` + `argon2-cffi` + `MFAService` | ADMIN sin MFA → 403; SELLER sin MFA → 200 | ✅ Listo |
| **RF-AUT-003** | MFA TOTP obligatorio para ADMIN | ADMIN debe configurar TOTP en primer login; códigos de respaldo | `MFAService` + `pyotp` | ADMIN nuevo → forzado a configurar TOTP | ✅ Listo |
| **RF-AUT-007** 🆕 | HU-AUT-002: Migración GUEST→CUSTOMER | Al autenticarse, FU de GUEST se fusiona con FU de CUSTOMER (suma cantidades) | `FormatoUnicoService.merge()` | GUEST [A:2] + CUSTOMER [A:1, B:3] → [A:3, B:3] | ✅ Listo |
| **RF-AUT-008** 🆕 | HU-AUT-003: Auto-completado facturación | CUSTOMER logueado → datos DNI/RUC/dirección se auto-llenan en checkout | `UserQueryService` + `app/checkout/page.tsx` | Login → checkout → campos pre-llenados | ✅ Listo |

---

## 🕵️ 5. BRECHAS INTEGRADAS EN EXECUTIÓN (v1.3)

| ID RF / RNF | Caso de Uso / Historia de Usuario | Criterios de Aceptación (CA) | Componente / Módulo | Caso de Prueba Conceptual | Estado en Sprint |
|---|---|---|---|---|---|
| **RF-NAV-001** [PROP] | HU-CAT-004: Como GUEST/CUSTOMER quiero enlace persistente del carrito en header | CMP-HEADER-CART-BUTTON visible con contador de items | `frontend/src/components/Header.tsx` | Verificar renderizado de badge del carrito en todas las páginas | ✅ Especificado / Pendiente Implementación |
| **RF-ADM-002** | HU-ADM-002: Como ADMIN quiero formulario de creación de usuarios | CMP-ADM-USUARIO-FORM con email, password y rol (SELLER/ADMIN) | `frontend/src/app/admin/usuarios/page.tsx` | ADMIN crea SELLER con email único → HTTP 201 | ✅ Especificado / Pendiente Implementación |
| **RF-CAT-006** | HU-CAT-006: Sincronización de precios del catálogo en carritos activos | RN-PRICING-05: FU en BORRADOR recalcula precios al cargarse | `ProductQueryService` + `FormatoUnico` | Cambiar precio producto -> verificar actualización en carritos BORRADOR | ✅ Especificado / Pendiente Implementación |
| **RF-ADM-003** | HU-ADM-003: Invalidador de JWT por suspensión de cuenta | RN-USER-BLOCK-01: Token es rechazado tras marcar is_active=false | `AuthService` + middleware de autenticación | Suspender CUSTOMER activo -> intentar query con su JWT -> 401 | ✅ Especificado / Pendiente Implementación |
| **RF-CAT-006** | HU-CAT-006: Cascading inactivo de componentes en Kits | RN-KIT-SYNC-01: Desactivar componente inactiva kit automáticamente | `KitService` + triggers base de datos | Inactivar componente A -> Kit X debe estar is_active=false | ✅ Especificado / Pendiente Implementación |
| **RF-CHK-012** | HU-CHK-004: Tarea de liberación de stock reservado por timeout | RN-RESERVE-01: Si no hay pago en 30 min se libera reserved_stock | `SchedulerService` + cron job de expiración | Iniciar pago -> esperar 31 minutos -> reserved_stock es 0 | ✅ Especificado / Pendiente Implementación |

---

## 🔄 6. TAREAS DE INTEGRACIÓN COMPLETADAS (Sprint 5)

| Tarea | Descripción | Componentes Modificados | Estado | Validación |
|---|---|---|---|---|
| **S5-05** | Persistencia de Datos de Sincronización del Distribuidor (MOD-DIS-01) | `backend/app/api/endpoints/distribuidor.py`, `backend/app/domain/repositories/product_repository.py`, `backend/app/infra/repositories/product_repository_impl.py`, `backend/app/infra/repositories/in_memory_product_repository.py`, `backend/app/core/deps.py` | ✅ Completada | Tests de integración pasados (2/2) - Verifica persistencia en base de datos real |

---

## 🚀 6.1 SPRINT 6 — Refinamiento B2B, Desacoplamiento de Cotizaciones y UX Dinámica

Fuente: `notas_actualizacion_diseno.md`, `FASE 4_EJECUCION_SCRUM/SPRINT_6_BACKLOG.md`.

| ID RF / RN | Caso de Uso / Historia de Usuario | Criterios de Aceptación (CA) | Componente / Módulo | Caso de Prueba | Estado en Sprint |
|---|---|---|---|---|---|
| **RF-FU-005** (actualizado), **RN-FU-09** 🆕 | UC-FU-003: Generar cotización — ahora vía Patrón de Clonación | CA-FU-005 (vigente) | `FormatoUnicoService.generar_cotizacion()`, `InMemoryFormatoRepository.get_active_by_customer_id()` | `test_generar_cotizacion_clona_en_registro_independiente`, `test_borrador_original_sigue_editable_tras_clonar_cotizacion`, `test_get_active_by_customer_id_resuelve_el_borrador_mas_reciente` | ✅ Listo |
| **RF-FU-021** 🆕 | UC-FU-017: Recomprar desde historial (HU-FU-014) | CA-FU-021 | `FormatoUnicoService.reemplazar_borrador()` / `combinar_con_borrador()`, `RepurchaseWidget.tsx` | `test_reemplazar_borrador_copia_items_del_historico`, `test_combinar_con_borrador_suma_cantidades_de_producto_repetido`, `test_reemplazar_borrador_requiere_ownership`, `test_combinar_borrador_omite_producto_inactivo_sin_fallar` | ✅ Listo |
| **RF-CAT-009** 🆕 | UC-CAT-009: Drawer + Toast al agregar (HU-CAT-009) | CA-CAT-009 | `CartContext.tsx`, `CartBadge.tsx`, `CartDrawer.tsx`, `ToastContext.tsx` | TEST-CAT-009 (manual/E2E, sin cobertura pytest — es UI pura) | ✅ Listo |
| — (bandera de soporte) | Ramificación GUEST / CUSTOMER nuevo / CUSTOMER recurrente en `/formatos` | — | `GET /formatos/tiene-historial`, `OnboardingGuide.tsx`, `app/formatos/page.tsx` | `test_tiene_historial_false_sin_cotizaciones`, `test_tiene_historial_true_tras_generar_cotizacion` | ✅ Listo |
| RF-FU-002 (ya documentado, nunca implementado) | Eliminar ítem del Formato Único | CA-FU-002 (preexistente) | `DELETE /formatos/{id}/items/{product_id}`, `FormatoUnicoService.eliminar_item()` | `test_eliminar_item_del_formato` | ✅ Listo (gap cerrado, requerido por el Drawer T6-F4) |
| RF-FU-004 (ya documentado, nunca implementado) | Solicitar asesoría (BTN-FU-003) | CA-FU-004 (preexistente) | `POST /formatos/{id}/solicitar-consulta`, `FormatoUnicoService.solicitar_consulta()` | `test_solicitar_consulta_transiciona_a_consulta` | ✅ Listo (gap cerrado, requerido por el filtro GUEST) |
| RF-AUT-009, RF-FU-020 (Sprint anterior) | — | — | — | — | Sin cambios en este sprint |

**Gaps identificados pero explícitamente fuera de alcance de Sprint 6** (para no diluir el foco, quedan como candidatos a un sprint futuro):
- ~~"Confirmar Importación Excel" (`ExcelImporter.tsx`) es simulado — no aplica los ítems validados al FU real.~~ **Cerrado 12/07/2026, ver §6.3.**
- El servicio backend de Telegram (`telegram_service.py`) está huérfano; el frontend duplica la lógica con un bot hardcodeado distinto al de `settings.TELEGRAM_BOT_USERNAME`.
- RF-FU-008 (regenerar cotización expirada, FU-T-11) sigue sin endpoint — `BannerFSM.tsx` mantiene el botón "Renovar Cotización" como stub.
- ~~Existen dos instancias separadas de `InMemoryProductRepository` (una módulo-level en `formato_unico.py` para Excel, otra vía `get_product_query_service`).~~ **Cerrado 12/07/2026, ver §6.3 — `ExcelImportService` ahora usa el mismo repositorio real que el resto del sistema.**

---

## 🚀 6.3 Corrección de Defectos — Vaciar Formato Único y Carga Masiva Excel (12/07/2026)

**Origen:** reporte de soporte "no se puede vaciar el Formato Único" + "la carga masiva Excel no procesa sin problemas". Investigación reveló 3 defectos encadenados en Excel (no solo un problema de columnas de plantilla) más un proceso de backend obsoleto para "vaciar".

| ID RF / RN | Defecto encontrado | Corrección | Componente / Módulo | Caso de Prueba | Estado |
|---|---|---|---|---|---|
| RF-FU-003 (ya documentado) | `DELETE /{id}/items` no cargado en el proceso de backend en ejecución (staleness, no requería cambio de código); además no validaba ownership | Reinicio de backend + validación de ownership (JWT/`order_token`), mismo criterio que `agregar_kit_al_formato` | `vaciar_items_del_formato` (`formato_unico.py`) | TEST-FU-022 | ✅ Listo |
| RF-FU-013 | `ExcelImportService` validaba contra un `InMemoryProductRepository` módulo-level nunca poblado en runtime — todo SKU real reportaba "SKU no existe" | `get_excel_import_service` ahora depende de `get_product_query_service` (catálogo real, mismo repositorio que `/productos`) | `formato_unico.py`, `excel_import_service.py` | TEST-FU-023 (caso 1) | ✅ Listo |
| RF-FU-013 | Incluso conectado al catálogo real, `list_all()` sin argumentos pagina a 10 productos por defecto — SKUs reales fuera de esa página fallaban igual | `process_csv` ahora llama `list_all(skip=0, limit=10_000)` | `excel_import_service.py` | TEST-FU-023 (caso 1) | ✅ Listo |
| RF-FU-014 | La plantilla descargable traía un único SKU ficticio (`SKU-EJEMPLO`) que no existe en ningún catálogo real | `descargar_plantilla_csv` genera el CSV desde el catálogo real: columnas `sku,cantidad,producto,precio_referencial,stock`, una fila por producto activo con stock | `formato_unico.py` | TEST-FU-023 (caso 3) | ✅ Listo |
| — (bug adicional, descubierto al ampliar la plantilla a todo el catálogo) | Con la plantilla nueva (múltiples filas, `cantidad=0` por defecto), esas filas se contaban como ítems "exitosos" con cantidad 0 | `process_csv` omite en silencio `cantidad == 0`; `cantidad < 0` sigue siendo error | `excel_import_service.py` | TEST-FU-023 (caso 2) | ✅ Listo |
| RF-FU-019, **RN-FU-10** 🆕 | "Confirmar Importación Válida" (`ExcelImporter.tsx`) era un `alert()` cosmético — nunca llamaba a ningún endpoint; el archivo se validaba pero jamás se cargaba al FU (pese a que `UC-EXCEL-001` paso 5 ya lo documentaba) | Nuevo endpoint `POST /{id}/excel/aplicar`: revalida SKU/stock server-side, aplica hasta el stock disponible en vez de rechazar la fila (stock parcial), con ownership check | `formato_unico.py`, `ExcelImporter.tsx` (wired a `CartContext`/`ToastContext`, mismo patrón que `KitCard.tsx`) | TEST-FU-023 (casos 4, 5, 6) | ✅ Listo |
| — (bloqueante descubierto durante la verificación) | `products.category_id` existe en el modelo SQLModel pero ninguna migración lo creó en la BD real — `/productos` y todo lo que use `ProductRepositoryImpl` respondía `500 Internal Server Error` | Migración Alembic `5f3a8d21e9c4` (idempotente, mismo patrón que `7a1e9c2b4f10`/`9b2f4e7a1c33`), aplicada con `alembic upgrade head` | `alembic/versions/5f3a8d21e9c4_...py` | Verificación manual (`GET /productos` → 200 tras la migración) | ✅ Listo |

**Verificación:** 179/179 tests backend en verde; flujo E2E confirmado en navegador (vaciar formato, descarga de plantilla real, subida + validación + confirmación de Excel reflejada en badge/Drawer/`FormatoTable`).

---

## 🚀 6.4 Persistencia Real del Formato Único (RNF-REL-006) — 12/07/2026

**Origen:** reporte de soporte — un CUSTOMER generó una cotización y, al volver a ingresar un día después, ya no la encontraba. Causa raíz: `USE_MOCK_DB=True` hacía que el Formato Único (carritos, cotizaciones, consultas, pedidos) viviera únicamente en la RAM del proceso backend (`InMemoryFormatoRepository`) — cualquier reinicio del servidor lo borraba por completo, sin excepción ni registro recuperable. Activar la persistencia real expuso 3 defectos adicionales que la bloqueaban.

| ID RF / RN / RNF | Defecto encontrado | Corrección | Componente / Módulo | Caso de Prueba | Estado |
|---|---|---|---|---|---|
| **RNF-REL-006** 🆕 | Todo el ciclo de vida del Formato Único vivía solo en memoria — se perdía en cada reinicio del backend | `USE_MOCK_DB=False`; `FormatoUnicoService` y las vistas de SELLER pasan a usar `SupabaseFormatoRepository` (Postgres real) | `backend/.env`, `formato_unico.py` | TEST-FU-024 (verificación manual E2E) | ✅ Listo |
| RN-FU-09 (ya documentada) | `SupabaseFormatoRepository.get_active_by_customer_id` ordenaba por `created_at` — favorecía siempre a la cotización recién clonada sobre el borrador reseteado, reintroduciendo el bug "ya no puedo comprar otra cosa tras cotizar" contra la BD real | Ordena por `updated_at` descendente, igual que `InMemoryFormatoRepository` | `supabase_formato_repository.py` | TEST-FU-024 (caso 4) | ✅ Listo |
| — (bug de infraestructura de tests) | `SupabaseFormatoRepository` abría su propia `Session(engine)` contra la BD global, ignorando el override de sesión que los tests instalan sobre `get_session`/`get_db` — cualquier test que la instanciara habría escrito en la base de datos real de producción | Recibe la sesión inyectada por constructor (mismo patrón que `ProductRepositoryImpl`); actualizados los 4 endpoints que la construyen (`formato_unico.py`, `checkout.py`, `consultas.py`, `cotizaciones.py`) | `supabase_formato_repository.py` + 4 endpoints | TEST-FU-024 (casos 1-3, 5) | ✅ Listo |
| — (bug adicional) | `save()`/`_to_domain()` nunca persistían ni recuperaban `updated_at` real — confiaban en `onupdate=func.now()` de la columna, que no se dispara en el INSERT | `save()` escribe `updated_at` explícitamente; `_to_domain()` lo mapea de vuelta al reconstruir el dominio | `supabase_formato_repository.py` | TEST-FU-024 (caso 2) | ✅ Listo |
| — (bloqueante descubierto durante la verificación) | `formato_unico.discount_percent` existe en el modelo SQLModel pero ninguna migración lo creó en la BD real — cualquier operación sobre el Formato Único (incluida `POST /formatos/session`) respondía `500 Internal Server Error` | Migración Alembic `7c2e4b91a5d8` (idempotente, mismo patrón que `5f3a8d21e9c4`), aplicada con `alembic upgrade head` | `alembic/versions/7c2e4b91a5d8_...py` | Verificación manual (`POST /formatos/session` → 201 tras la migración) | ✅ Listo |
| — (regresión detectada al remover el singleton de `CheckoutService`) | El idempotency-store del checkout (protección "doble clic en pagar") era un dict de instancia; al construir `CheckoutService` por-request (necesario para no atar una Session de un único request a la vida del proceso), el segundo POST idéntico dejaba de encontrar la respuesta cacheada y reprocesaba sobre un FU ya en `PEDIDO`, fallando con `409` | `_idempotency_store` pasa a ser un atributo de clase (sobrevive entre instancias por-request, igual que el singleton removido) | `checkout_service.py` | `test_flujo_completo_checkout` (ya existente) | ✅ Listo |
| — (bug de rebote, cerrado sin cambios de código) | `consultas.py`/`cotizaciones.py` (vistas de SELLER) tenían cada una su propio `InMemoryFormatoRepository` aislado, siempre vacío — las colas de "Consultas" y "Cotizaciones" del SELLER nunca mostraban datos reales | Al activar `USE_MOCK_DB=False`, ambos construyen `SupabaseFormatoRepository` (repositorio real, sin estado de instancia que aislar) | `consultas.py`, `cotizaciones.py` | TEST-FU-024 (caso 3); verificación manual (`GET /cotizaciones` como SELLER) | ✅ Listo |
| **RNF-REL-006** (extensión, 13/07/2026) | `get_payment_service()` en `webhooks.py` construía `mock_fu_repo` y un `InMemoryProductRepository()` huérfano **sin revisar `settings.USE_MOCK_DB`** — con la persistencia real activada, todo webhook de Mercado Pago fallaba con `404 "Formato Único no encontrado"` (el pedido vivía en Postgres, el webhook buscaba en un diccionario vacío); ningún pago real llegaba a confirmarse | `get_payment_service` ahora depende de `Session` inyectada; usa `SupabaseFormatoRepository`/`mock_fu_repo` según `USE_MOCK_DB` y siempre `ProductRepositoryImpl` para stock (mismo criterio que `get_product_query_service`) | `webhooks.py` | TEST-CHK-015 (`test_webhook_approved_confirma_fu_persistido_en_bd_real`) | ✅ Listo |
| RN-TG-01 (ya documentada), CA-CAT-008 | El botón "Consultar por Telegram" apuntaba a `t.me/tiendred_ventas`, un username que no correspondía a ninguna cuenta real de Alling — las consultas de clientes se habrían enviado a un destino inexistente o ajeno | Actualizado a `t.me/allingtechnology` en `TelegramButton.tsx`, alineado el default de `TELEGRAM_BOT_USERNAME` en `config.py` | `TelegramButton.tsx`, `config.py` | Verificación manual en navegador (`href` del botón) | ✅ Listo |

**Verificación (13/07/2026):** 186/186 tests backend en verde (incluye el nuevo `test_webhook_approved_confirma_fu_persistido_en_bd_real`). Verificado en navegador que el botón de Telegram enlaza a `https://t.me/allingtechnology`. Pendiente del lado del usuario: configurar `MP_ACCESS_TOKEN` y `WEBHOOK_SECRET` reales en `backend/.env` (no son credenciales que el agente pueda generar u obtener).

---

## 🚀 6.2 SPRINT 7 — Gobernanza Avanzada y Operaciones B2B (Módulo ADMIN)

Fuente: `admin_panel_proposal.md`.

| ID RF / RN | Caso de Uso / Historia de Usuario | Criterios de Aceptación (CA) | Componente / Módulo | Caso de Prueba | Estado en Sprint |
|---|---|---|---|---|---|
| **RF-ADM-005** (actualizado) | UC-ADM-002: Gestionar catálogo de productos (incluye CRUD de Categorías y active-toggle `is_active`) | CA-ADM-005, CA-ADM-009 | `admin.py`, `productos/page.tsx` | `test_get_categorias`, `test_crear_categoria`, `test_toggle_product_active` | ✅ Listo |
| **RF-ADM-009** 🆕 | UC-ADM-006: Asignar consultas preventa | CA-ADM-009 | `POST /admin/consultas/{id}/asignar`, `consultas/[id]/page.tsx` | `test_assign_query_to_seller` | ✅ Listo |
| **RF-ADM-010** 🆕 | UC-ADM-007: Aplicar descuento comercial B2B | CA-ADM-010 | `POST /admin/cotizaciones/{id}/descuento`, `cotizaciones/[id]/page.tsx` | `test_apply_discount_percent` | ✅ Listo |
| **RN-ADM-03** 🆕 | Bloqueo de eliminación de Categoría con Productos activos | RN-ADM-03 | `DELETE /admin/categorias/{id}` | `test_delete_category_with_active_products` | ✅ Listo |
| **RN-ADM-04** 🆕 | Límite máximo de descuento comercial B2B a 30% | RN-ADM-04 | `POST /admin/cotizaciones/{id}/descuento` | `test_apply_discount_percent_exceeds_limit` | ✅ Listo |
| — (carga masiva) | Carga masiva de catálogo en lote (Admin) sin conflicto con sync del distribuidor | — | `POST /admin/productos/excel-import` | `test_excel_import_products` | ✅ Listo |

---

## 📈 5. RESUMEN GERENCIAL DE COBERTURA

### 5.1 Métricas de Trazabilidad

| Dimensión | Total | Cubiertos en Matriz | Cobertura |
|---|---|---|---|
| **RF Totales** | 83 | 52 | 63% |
| **RNF Totales** | 19 | 16 | 84% |
| **HU Totales** | 67 | 52 | 78% |
| **Módulos Críticos** | 4 | 4 | 100% |
| **RF Prioridad CRÍTICA** | 22 | 22 | 100% |
| **RF Prioridad ALTA** | 31 | 30 | 97% |

### 5.2 Distribución por Módulo

| Módulo | RF Cubiertos | % del Total Módulo | Prioridad Promedio |
|---|---|---|---|
| MOD-FU-01 | 19 | 100% | CRÍTICA |
| MOD-CAT-01 | 9 | 100% | ALTA |
| MOD-CHK-01 | 15 | 100% | CRÍTICA |
| Zero Trust (transversal) | 16 | 100% | CRÍTICA |

### 5.3 Estado de los Sprints (Planificado)

| Estado | Cantidad | % |
|---|---|---|
| ⏳ Pendiente | 52 | 100% |
| 🔄 En Progreso | 0 | 0% |
| ✅ Listo | 0 | 0% |

**Nota:** Todos los ítems están "Pendiente" porque la matriz se generó al inicio de la fase de ejecución. Los estados se actualizarán diariamente en el Daily Scrum.

### 5.4 Trazabilidad Cruzada con Artefactos SDD

```
Módulos (MOD-*.md)
    ↓ deriva
RF/RNF/HU/UC (Requisitos)
    ↓ valida
CA (Criterios de Aceptación)
    ↓ verifica
TEST (Casos de Prueba)
    ↓ implementa
Componentes (SCR/CMP/BTN/ACT)
    ↓ ejecuta
Sprints (Daily/Review/Retro)
```

---

## 🎯 6. CRITERIOS DE ACEPTACIÓN DE LA MATRIZ

### 6.1 Criterios de Calidad Documental

- ✅ Cada RF tiene al menos 1 HU asociada
- ✅ Cada RF tiene al menos 1 CA verificable
- ✅ Cada RF tiene componente arquitectónico asignado
- ✅ Cada RF tiene caso de prueba conceptual
- ✅ Los RF críticos (CRÍTICA) están 100% cubiertos
- ✅ Zero Trust está representado transversalmente

### 6.2 Criterios de Trazabilidad Scrum

- ✅ Cada fila puede asignarse a un Sprint específico
- ✅ Cada fila tiene estado actualizable (Pendiente/En Progreso/Listo)
- ✅ La matriz sirve como input para Sprint Planning
- ✅ La matriz permite medir progreso en Sprint Review

### 6.3 Criterios de Auditoría Académica (Curso GRI)

- ✅ Trazabilidad completa desde RF hasta TEST
- ✅ Cobertura de módulos críticos documentada
- ✅ Zero Trust con RNF verificables
- ✅ Lista para inspección en Pipeline GRI (Jenkins)

---

## 📋 7. CONTROL DE CAMBIOS

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0.0 | 30/06/2026 | Versión inicial (55 RF) | Equipo Alling |
| 1.1.0 | 03/07/2026 | Corrección de conteos (49 RNF reales tras consolidación) | Equipo Alling |
| 1.2.0 | 05/07/2026 | Extensión v1.2 (28 RF nuevos, 67 HU, 42 RN) | Equipo Alling |
| 1.3.0 | 12/07/2026 | Sprint 6: Patrón de Clonación (RF-FU-005 actualizado, RN-FU-09), Widget de Recompra (RF-FU-021), Drawer/Toast (RF-CAT-009); cierre de gaps preexistentes RF-FU-002 y RF-FU-004 | Agente autónomo |
| 1.4.0 | 12/07/2026 | Sprint 7: Gobernanza Avanzada y Operaciones B2B (CRUD Categorías, active-toggle, constructor de kits con acumulador, Excel import, asignación de consultas y descuento B2B manual) | Agente autónomo |
| 1.5.0 | 12/07/2026 | §6.3: fix "Vaciar Formato Único" (ownership) + Carga Masiva Excel end-to-end (catálogo real, plantilla con SKUs reales, `POST /excel/aplicar`, RN-FU-10, migración `category_id`) | Agente autónomo |
| 1.6.0 | 12/07/2026 | §6.4 / RNF-REL-006: persistencia real del Formato Único (`USE_MOCK_DB=False`), fix `get_active_by_customer_id` (ordenar por `updated_at`), inyección de sesión en `SupabaseFormatoRepository`, migración `discount_percent`, fix idempotencia de checkout, fix vistas SELLER de consultas/cotizaciones | Agente autónomo |
| 1.6.1 | 13/07/2026 | §6.4 (extensión): fix webhook de Mercado Pago (`get_payment_service` ahora respeta `USE_MOCK_DB`, `TEST-CHK-015`); corregido username de Telegram (`tiendred_ventas` → `allingtechnology`) en `TelegramButton.tsx`/`config.py`/`CA-CAT-008` | Agente autónomo |

---

**Fin del documento.**
