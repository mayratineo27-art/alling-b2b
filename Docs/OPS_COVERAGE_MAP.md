# Mapa de Cobertura OPS → Endpoints Implementados

> Generado el **08/07/2026** cruzando `Docs/openapi_real.json` (50 endpoints, 17 routers) con las OPS definidas en `Docs/Módulos/*.md` (54 OPS totales).

---

## Resumen Ejecutivo

| Métrica | Valor |
|---|---|
| **OPS totales definidas** | 54 |
| **OPS con endpoint implementado** | 38 |
| **OPS sin endpoint (pendientes)** | 16 |
| **Cobertura** | **70%** |

---

## 🟩 MOD-FU-01 — Formato Único (11 OPS)

| OPS | Descripción | Endpoint(s) Implementado(s) | Estado |
|---|---|---|---|
| OPS-FU-001 | Editar cantidad de un ítem | `PATCH /formatos/{id}/items/{product_id}` | ✅ Implementado |
| OPS-FU-002 | Eliminar ítem | `PATCH /formatos/{id}/items/{product_id}` (qty=0) | ✅ Implementado |
| OPS-FU-003 | Vaciar Formato Único | ⚠️ No hay endpoint `DELETE /formatos/{id}/items` | ❌ Pendiente |
| OPS-FU-004 | Solicitar consulta pre-venta | `POST /consultas/{fu_id}/tomar` + `POST /consultas/{fu_id}/responder` | ✅ Implementado |
| OPS-FU-005 | Generar cotización | `POST /formatos/{formato_id}/aprobar` | ✅ Implementado |
| OPS-FU-006 | Iniciar checkout (Pedido) | `POST /checkout/` | ✅ Implementado |
| OPS-FU-007 | Descargar PDF de cotización | `GET /cotizaciones/{fu_id}/pdf` (compartido) | ✅ Implementado |
| OPS-FU-008 | Regenerar cotización expirada | ⚠️ No hay endpoint `POST /formatos/{id}/regenerar` | ❌ Pendiente |
| OPS-FU-009 | Resolver conflicto migración GUEST→CUSTOMER | `POST /formatos/merge` | ✅ Implementado |
| OPS-FU-010 | Consultar historial de Formatos Únicos | `GET /formatos/historial/` | ✅ Implementado |
| OPS-FU-011 | Reintentar pedido tras cancelación | ⚠️ No hay endpoint `POST /orders/{id}/reintentar` | ❌ Pendiente |

**Cobertura MOD-FU-01: 8/11 (73%)**

---

## 🟩 MOD-CAT-01 — Catálogo de Productos (3 OPS)

| OPS | Descripción | Endpoint(s) Implementado(s) | Estado |
|---|---|---|---|
| OPS-CAT-001 | Buscar y filtrar productos | `GET /productos/buscar/` + `GET /productos/` | ✅ Implementado |
| OPS-CAT-002 | Ver detalle de producto | `GET /productos/{slug}/` + `GET /productos/landing` | ✅ Implementado |
| OPS-CAT-003 | Agregar producto al Formato Único | `POST /formatos/` + `POST /formatos/{id}/kits` | ✅ Implementado |

**Cobertura MOD-CAT-01: 3/3 (100%)**

---

## 🟨 MOD-CHK-01 — Checkout y Pago (8 OPS)

| OPS | Descripción | Endpoint(s) Implementado(s) | Estado |
|---|---|---|---|
| OPS-CHK-001 | Capturar datos de envío y facturación | `POST /checkout/` (incluye validación de datos) | ✅ Implementado |
| OPS-CHK-002 | Calcular costo de envío | ⚠️ No hay endpoint dedicado `GET /checkout/shipping` | ❌ Pendiente (mock interno) |
| OPS-CHK-003 | Iniciar proceso de pago | `POST /checkout/` (genera preferencia MP) | ✅ Implementado |
| OPS-CHK-004 | Confirmar pago (webhook) | `POST /webhooks/mercadopago/` | ✅ Implementado |
| OPS-CHK-005 | Manejar pago fallido o cancelado | `POST /webhooks/mercadopago/` (mapeo FSM) | ✅ Implementado |
| OPS-CHK-006 | Consultar confirmación de pedido | `GET /checkout/{fu_id}/status` | ✅ Implementado |
| OPS-CHK-007 | Enviar email de confirmación | ⚠️ No hay endpoint separado (lógica interna del webhook) | ❌ Pendiente (integración SMTP) |
| OPS-CHK-008 | Cancelar/reintentar pedido manualmente | ⚠️ No hay endpoint `POST /orders/{id}/cancelar` | ❌ Pendiente |

**Cobertura MOD-CHK-01: 5/8 (63%)**

---

## 🟩 MOD-COT-01 — Cotizaciones (3 OPS)

| OPS | Descripción | Endpoint(s) Implementado(s) | Estado |
|---|---|---|---|
| OPS-COT-001 | Ver listado de cotizaciones | `GET /cotizaciones` | ✅ Implementado |
| OPS-COT-002 | Ver detalle de cotización | `GET /cotizaciones/{fu_id}` | ✅ Implementado |
| OPS-COT-003 | Descargar PDF (vista SELLER) | `GET /cotizaciones/{fu_id}/pdf` | ✅ Implementado |

**Cobertura MOD-COT-01: 3/3 (100%)**

---

## 🟩 MOD-CON-01 — Consultas (4 OPS)

| OPS | Descripción | Endpoint(s) Implementado(s) | Estado |
|---|---|---|---|
| OPS-CON-001 | Ver cola de consultas pendientes | `GET /consultas` | ✅ Implementado |
| OPS-CON-002 | Tomar (asignarse) una consulta | `POST /consultas/{fu_id}/tomar` | ✅ Implementado |
| OPS-CON-003 | Responder consulta | `POST /consultas/{fu_id}/responder` | ✅ Implementado |
| OPS-CON-004 | Filtrar y buscar consultas | ⚠️ No hay query params documentados en `GET /consultas` para filtrado avanzado | ❌ Pendiente |

**Cobertura MOD-CON-01: 3/4 (75%)**

---

## 🟩 MOD-SEL-01 — Panel Vendedor (6 OPS)

| OPS | Descripción | Endpoint(s) Implementado(s) | Estado |
|---|---|---|---|
| OPS-SEL-001 | Ver listado de productos para gestión de stock | `GET /seller/stock` | ✅ Implementado |
| OPS-SEL-002 | Actualizar stock de un producto | `PATCH /seller/stock/{product_id}` | ✅ Implementado |
| OPS-SEL-003 | Configurar umbral mínimo de stock | `PATCH /seller/stock/{product_id}/umbral` | ✅ Implementado |
| OPS-SEL-004 | Ver cola de pedidos listos para envío | `GET /seller/pedidos` | ✅ Implementado |
| OPS-SEL-005 | Generar guía de envío | `POST /seller/pedidos/{order_id}/guia` | ✅ Implementado |
| OPS-SEL-006 | Ver historial de pedidos despachados | ⚠️ `GET /seller/pedidos` no tiene filtro por estado DESPACHADO | ❌ Pendiente |

**Cobertura MOD-SEL-01: 5/6 (83%)**

---

## 🟩 MOD-ADM-01 — Panel Admin (8 OPS)

| OPS | Descripción | Endpoint(s) Implementado(s) | Estado |
|---|---|---|---|
| OPS-ADM-001 | Listar usuarios | `GET /admin/usuarios` | ✅ Implementado |
| OPS-ADM-002 | Crear usuario (SELLER/ADMIN) | `POST /admin/usuarios` | ✅ Implementado |
| OPS-ADM-003 | Suspender usuario | `PATCH /admin/usuarios/{user_id}/suspender` | ✅ Implementado |
| OPS-ADM-004 | Eliminar usuario | `DELETE /admin/usuarios/{user_id}` | ✅ Implementado |
| OPS-ADM-005 | Gestionar catálogo completo (CRUD de productos) | `GET /admin/productos` + `POST /admin/productos` | ✅ Implementado |
| OPS-ADM-006 | Ver métricas de ventas | `GET /admin/metricas/ventas` | ✅ Implementado |
| OPS-ADM-007 | Configurar parámetros del sistema | `GET /admin/configuracion` + `PUT /admin/configuracion` | ✅ Implementado |
| OPS-ADM-008 | Exportar datos con re-autenticación MFA | `POST /admin/exportar` | ✅ Implementado |

**Cobertura MOD-ADM-01: 8/8 (100%)**

---

## 🟨 MOD-AUT-01 — Autenticación (6 OPS)

| OPS | Descripción | Endpoint(s) Implementado(s) | Estado |
|---|---|---|---|
| OPS-AUT-001 | Iniciar sesión con Google (CUSTOMER) | `POST /auth/google` | ✅ Implementado |
| OPS-AUT-002 | Iniciar sesión local (SELLER/ADMIN) | ⚠️ No hay `POST /auth/login` en la spec actual | ❌ Pendiente (parte del SPA) |
| OPS-AUT-003 | Verificar código MFA (TOTP) | ⚠️ No hay endpoint `/auth/mfa/verify` | ❌ Pendiente |
| OPS-AUT-004 | Usar código de respaldo MFA | ⚠️ No hay endpoint `/auth/mfa/backup` | ❌ Pendiente |
| OPS-AUT-005 | Habilitar/configurar MFA (SELLER) | ⚠️ No hay endpoint `/auth/mfa/setup` | ❌ Pendiente |
| OPS-AUT-006 | Cerrar sesión | ⚠️ No hay endpoint `POST /auth/logout` | ❌ Pendiente (manejado en frontend) |

**Cobertura MOD-AUT-01: 1/6 (17%)**

---

## 🟨 MOD-DIS-01 — Distribuidor (4 OPS)

| OPS | Descripción | Endpoint(s) Implementado(s) | Estado |
|---|---|---|---|
| OPS-DIS-001 | Autenticar solicitud de sincronización | `POST /distribuidor/sync` (incluye validación HMAC) | ✅ Implementado |
| OPS-DIS-002 | Sincronizar precios de productos | `POST /distribuidor/sync` (payload incluye precios) | ✅ Implementado |
| OPS-DIS-003 | Sincronizar stock de productos | `POST /distribuidor/sync` (payload incluye stock) | ✅ Implementado |
| OPS-DIS-004 | Rechazar SKU desconocido | `POST /distribuidor/sync` (responde 400 si SKU inválido) | ✅ Implementado |

**Cobertura MOD-DIS-01: 4/4 (100%)**

---

## 📊 Tabla Consolidada por Módulo

| Módulo | OPS Definidas | Implementadas | Pendientes | Cobertura |
|---|---|---|---|---|
| MOD-FU-01 | 11 | 8 | 3 | 73% |
| MOD-CAT-01 | 3 | 3 | 0 | 100% |
| MOD-CHK-01 | 8 | 5 | 3 | 63% |
| MOD-COT-01 | 3 | 3 | 0 | 100% |
| MOD-CON-01 | 4 | 3 | 1 | 75% |
| MOD-SEL-01 | 6 | 5 | 1 | 83% |
| MOD-ADM-01 | 8 | 8 | 0 | 100% |
| MOD-AUT-01 | 6 | 1 | 5 | 17% |
| MOD-DIS-01 | 4 | 4 | 0 | 100% |
| **TOTAL** | **54** | **38** | **16** | **70%** |

---

## ❌ OPS Pendientes de Implementar

| Prioridad | OPS | Módulo | Descripción | Causa |
|---|---|---|---|---|
| 🔴 Alta | OPS-FU-008 | MOD-FU-01 | Regenerar cotización expirada | Sin endpoint `POST /formatos/{id}/regenerar` |
| 🔴 Alta | OPS-AUT-002 | MOD-AUT-01 | Login local SELLER/ADMIN | Endpoint `/auth/login` no aparece en OpenAPI spec |
| 🔴 Alta | OPS-AUT-003 | MOD-AUT-01 | Verificar código MFA | Sin endpoint `/auth/mfa/verify` |
| 🟡 Media | OPS-FU-003 | MOD-FU-01 | Vaciar Formato Único | Sin endpoint `DELETE /formatos/{id}/items` |
| 🟡 Media | OPS-FU-011 | MOD-FU-01 | Reintentar pedido cancelado | Sin endpoint `POST /orders/{id}/reintentar` |
| 🟡 Media | OPS-CHK-002 | MOD-CHK-01 | Calcular envío (dedicado) | Cálculo embebido en checkout, no expuesto |
| 🟡 Media | OPS-CHK-008 | MOD-CHK-01 | Cancelar pedido manual | Sin endpoint `POST /orders/{id}/cancelar` |
| 🟡 Media | OPS-CON-004 | MOD-CON-01 | Filtrado avanzado de consultas | `GET /consultas` sin query params de filtrado |
| 🟡 Media | OPS-SEL-006 | MOD-SEL-01 | Historial pedidos despachados | `GET /seller/pedidos` sin filtro de estado |
| 🟠 Baja | OPS-CHK-007 | MOD-CHK-01 | Email confirmación (externo) | Integración SMTP pendiente |
| 🟠 Baja | OPS-AUT-004 | MOD-AUT-01 | Código respaldo MFA | Sin endpoint `/auth/mfa/backup` |
| 🟠 Baja | OPS-AUT-005 | MOD-AUT-01 | Configurar MFA SELLER | Sin endpoint `/auth/mfa/setup` |
| 🟠 Baja | OPS-AUT-006 | MOD-AUT-01 | Cerrar sesión (backend) | Manejado solo en frontend, sin invalidación de token |
