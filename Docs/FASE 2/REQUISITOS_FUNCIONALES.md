# Requisitos Funcionales (RF) — Sistema Alling

| Campo | Valor |
|---|---|
| **Versión** | 1.0.0 |
| **Estado** | Derivado del Inventario Funcional Maestro (10 módulos congelados) |
| **Fuente de verdad** | `MOD-CAT-01`, `MOD-FU-01`, `MOD-CHK-01`, `MOD-CON-01`, `MOD-COT-01`, `MOD-SEL-01`, `MOD-ADM-01`, `MOD-AUT-01`, `MOD-DIS-01`, `MOD-SYS-01` |
| **Metodología** | SpecDD — derivación directa de Operaciones Funcionales (OPS), sin invención |
| **Total de RFs** | 56 |

---

## 1. Resumen ejecutivo

Este documento consolida los Requisitos Funcionales (RF) del sistema Alling, derivados **exclusivamente** de las Operaciones Funcionales (OPS) definidas en los 10 módulos del Inventario Funcional Maestro. Cada RF tiene trazabilidad directa hacia su OPS de origen y mantiene los identificadores (RN, RNF, HU, UC, CA, TEST) ya referenciados en los módulos.

**Principios aplicados:**

- **No-invención:** no se introduce ninguna capacidad funcional que no exista ya en una OPS documentada.
- **Trazabilidad bidireccional:** cada RF apunta a su OPS de origen; cada OPS produce exactamente un RF.
- **No-modificación de módulos:** las inconsistencias detectadas se registran como observaciones (§6), no como cambios en los módulos.
- **Consolidación selectiva:** se preserva la separación de RFs cuando representan la misma capacidad técnica vista desde actores distintos (por ejemplo, descarga de PDF de cotización desde CUSTOMER vs SELLER). Esta decisión se argumenta en §6.

---

## 2. Convenciones

### 2.1 Nomenclatura

- **Formato del ID:** `RF-[MÓDULO]-[NNN]` donde `[MÓDULO]` es el código de 3 letras del módulo y `[NNN]` es un correlativo desde `001`. Coincide con la nomenclatura ya reservada en las OPS.
- **Códigos de módulo:** `CAT` (Catálogo), `FU` (Formato Único), `CHK` (Checkout), `CON` (Consulta), `COT` (Cotización), `SEL` (Panel SELLER), `ADM` (Panel ADMIN), `AUT` (Autenticación), `DIS` (Distribuidor), `SYS` (Sistema transversal).

### 2.2 Prioridad

Heredada de la OPS de origen:

- **MVP:** indispensable para release inicial. Sin este RF, el flujo de negocio principal no se completa.
- **MVP+:** importante pero no bloqueante; primer ciclo post-release.

### 2.3 Trazabilidad de referencias

Cuando un campo aparece como _(reservado)_ significa que la OPS ya introdujo el ID pero su detalle se documenta en otro entregable de SpecDD. Cuando aparece como **—** significa que la OPS explícitamente declara que no aplica.

---

## 3. Tabla resumen de RFs por módulo

| Módulo | Cantidad de RFs | Rango de IDs |
|---|---:|---|
| MOD-CAT-01 (Catálogo) | 3 | RF-CAT-001 a RF-CAT-003 |
| MOD-FU-01 (Formato Único) | 11 | RF-FU-001 a RF-FU-011 |
| MOD-CHK-01 (Checkout) | 9 | RF-CHK-001 a RF-CHK-008, RF-ORD-001 |
| MOD-CON-01 (Consulta — vista SELLER) | 4 | RF-CON-001 a RF-CON-004 |
| MOD-COT-01 (Cotización — vista SELLER) | 3 | RF-COT-001 a RF-COT-003 |
| MOD-SEL-01 (Panel SELLER — stock/pedidos/guías) | 6 | RF-SEL-001 a RF-SEL-006 |
| MOD-ADM-01 (Panel ADMIN) | 8 | RF-ADM-001 a RF-ADM-008 |
| MOD-AUT-01 (Autenticación) | 6 | RF-AUT-001 a RF-AUT-006 |
| MOD-DIS-01 (Integración DISTRIBUTOR) | 4 | RF-DIS-001 a RF-DIS-004 |
| MOD-SYS-01 (Sistema transversal) | 2 | RF-SYS-001 a RF-SYS-002 |
| **Total** | **56** | — |

---

## 4. Vista agregada de RFs (resumen tabular)

| RF | Nombre | Actores | Prioridad | Módulo | OPS |
|---|---|---|---|---|---|
| RF-CAT-001 | Buscar y filtrar productos | GUEST, CUSTOMER, SELLER, ADMIN | MVP | MOD-CAT-01 | OPS-CAT-001 |
| RF-CAT-002 | Ver detalle de producto | GUEST, CUSTOMER, SELLER, ADMIN | MVP | MOD-CAT-01 | OPS-CAT-002 |
| RF-CAT-003 | Agregar producto al Formato Único | GUEST, CUSTOMER | MVP | MOD-CAT-01 | OPS-CAT-003 |
| RF-FU-001 | Editar cantidad de un ítem | GUEST, CUSTOMER | MVP | MOD-FU-01 | OPS-FU-001 |
| RF-FU-002 | Eliminar ítem del Formato Único | GUEST, CUSTOMER | MVP | MOD-FU-01 | OPS-FU-002 |
| RF-FU-003 | Vaciar Formato Único | GUEST, CUSTOMER | MVP | MOD-FU-01 | OPS-FU-003 |
| RF-FU-004 | Solicitar consulta pre-venta | GUEST, CUSTOMER | MVP | MOD-FU-01 | OPS-FU-004 |
| RF-FU-005 | Generar cotización | CUSTOMER | MVP | MOD-FU-01 | OPS-FU-005 |
| RF-FU-006 | Iniciar checkout (Pedido) | GUEST, CUSTOMER | MVP | MOD-FU-01 | OPS-FU-006 |
| RF-FU-007 | Descargar PDF de cotización (vista CUSTOMER) | CUSTOMER | MVP | MOD-FU-01 | OPS-FU-007 |
| RF-FU-008 | Regenerar cotización expirada | CUSTOMER | MVP | MOD-FU-01 | OPS-FU-008 |
| RF-FU-009 | Resolver conflicto de migración GUEST→CUSTOMER | CUSTOMER | MVP | MOD-FU-01 | OPS-FU-009 |
| RF-FU-010 | Consultar historial de Formatos Únicos | CUSTOMER | MVP+ | MOD-FU-01 | OPS-FU-010 |
| RF-FU-011 | Reintentar pedido tras cancelación | GUEST, CUSTOMER | MVP | MOD-FU-01 | OPS-FU-011 |
| RF-CHK-001 | Capturar datos de envío y facturación | GUEST, CUSTOMER | MVP | MOD-CHK-01 | OPS-CHK-001 |
| RF-CHK-002 | Calcular costo de envío | sistema | MVP | MOD-CHK-01 | OPS-CHK-002 |
| RF-CHK-003 | Iniciar proceso de pago | GUEST, CUSTOMER | MVP | MOD-CHK-01 | OPS-CHK-003 |
| RF-CHK-004 | Confirmar pago (webhook) | sistema (MercadoPago) | MVP | MOD-CHK-01 | OPS-CHK-004 |
| RF-CHK-005 | Manejar pago fallido o cancelado | sistema, CUSTOMER, GUEST | MVP | MOD-CHK-01 | OPS-CHK-005 |
| RF-CHK-006 | Consultar confirmación de pedido | GUEST (vía orderToken), CUSTOMER | MVP | MOD-CHK-01 | OPS-CHK-006 |
| RF-CHK-007 | Enviar email de confirmación | sistema | MVP | MOD-CHK-01 | OPS-CHK-007 |
| RF-CHK-008 | Cancelar/reintentar pedido manualmente | GUEST, CUSTOMER | MVP | MOD-CHK-01 | OPS-CHK-008 |
| RF-CON-001 | Ver cola de consultas pendientes | SELLER | MVP | MOD-CON-01 | OPS-CON-001 |
| RF-CON-002 | Tomar (asignarse) una consulta | SELLER | MVP | MOD-CON-01 | OPS-CON-002 |
| RF-CON-003 | Responder consulta | SELLER | MVP | MOD-CON-01 | OPS-CON-003 |
| RF-CON-004 | Filtrar y buscar consultas | SELLER | MVP+ | MOD-CON-01 | OPS-CON-004 |
| RF-COT-001 | Ver listado de cotizaciones | SELLER | MVP | MOD-COT-01 | OPS-COT-001 |
| RF-COT-002 | Ver detalle de cotización | SELLER | MVP | MOD-COT-01 | OPS-COT-002 |
| RF-COT-003 | Descargar PDF de cotización (vista SELLER) | SELLER | MVP | MOD-COT-01 | OPS-COT-003 |
| RF-SEL-001 | Ver listado de productos para gestión de stock | SELLER | MVP | MOD-SEL-01 | OPS-SEL-001 |
| RF-SEL-002 | Actualizar stock de un producto | SELLER | MVP | MOD-SEL-01 | OPS-SEL-002 |
| RF-SEL-003 | Configurar umbral mínimo de stock por producto | SELLER (ver OBS-001) | MVP+ | MOD-SEL-01 | OPS-SEL-003 |
| RF-SEL-004 | Ver cola de pedidos listos para envío | SELLER | MVP | MOD-SEL-01 | OPS-SEL-004 |
| RF-SEL-005 | Generar guía de envío | SELLER | MVP | MOD-SEL-01 | OPS-SEL-005 |
| RF-SEL-006 | Ver historial de pedidos despachados | SELLER | MVP+ | MOD-SEL-01 | OPS-SEL-006 |
| RF-ADM-001 | Listar usuarios | ADMIN | MVP | MOD-ADM-01 | OPS-ADM-001 |
| RF-ADM-002 | Crear usuario (SELLER/ADMIN) | ADMIN | MVP | MOD-ADM-01 | OPS-ADM-002 |
| RF-ADM-003 | Suspender usuario | ADMIN | MVP | MOD-ADM-01 | OPS-ADM-003 |
| RF-ADM-004 | Eliminar usuario | ADMIN | MVP | MOD-ADM-01 | OPS-ADM-004 |
| RF-ADM-005 | Gestionar catálogo completo (CRUD de productos) | ADMIN | MVP | MOD-ADM-01 | OPS-ADM-005 |
| RF-ADM-006 | Ver métricas de ventas | ADMIN | MVP+ | MOD-ADM-01 | OPS-ADM-006 |
| RF-ADM-007 | Configurar parámetros del sistema | ADMIN (ver OBS-001) | MVP+ | MOD-ADM-01 | OPS-ADM-007 |
| RF-ADM-008 | Exportar datos con re-autenticación MFA | ADMIN | MVP+ | MOD-ADM-01 | OPS-ADM-008 |
| RF-AUT-001 | Iniciar sesión con Google (CUSTOMER) | CUSTOMER potencial | MVP | MOD-AUT-01 | OPS-AUT-001 |
| RF-AUT-002 | Iniciar sesión local (SELLER/ADMIN) | SELLER, ADMIN | MVP | MOD-AUT-01 | OPS-AUT-002 |
| RF-AUT-003 | Verificar código MFA (TOTP) | SELLER (si habilitado), ADMIN | MVP | MOD-AUT-01 | OPS-AUT-003 |
| RF-AUT-004 | Usar código de respaldo MFA | SELLER, ADMIN | MVP+ | MOD-AUT-01 | OPS-AUT-004 |
| RF-AUT-005 | Habilitar/configurar MFA (SELLER) | SELLER | MVP+ | MOD-AUT-01 | OPS-AUT-005 |
| RF-AUT-006 | Cerrar sesión | CUSTOMER, SELLER, ADMIN | MVP | MOD-AUT-01 | OPS-AUT-006 |
| RF-DIS-001 | Autenticar solicitud de sincronización | DISTRIBUTOR (sistema externo) | MVP | MOD-DIS-01 | OPS-DIS-001 |
| RF-DIS-002 | Sincronizar precios de productos | DISTRIBUTOR | MVP | MOD-DIS-01 | OPS-DIS-002 |
| RF-DIS-003 | Sincronizar stock de productos | DISTRIBUTOR | MVP | MOD-DIS-01 | OPS-DIS-003 |
| RF-DIS-004 | Rechazar SKU desconocido en sincronización | DISTRIBUTOR (origina), sistema (rechaza) | MVP | MOD-DIS-01 | OPS-DIS-004 |
| RF-SYS-001 | Registro de auditoría transversal | sistema | MVP | MOD-SYS-01 | AUTO-SYS-001 |
| RF-SYS-002 | Retención y purga de auditoría | sistema | MVP+ | MOD-SYS-01 | AUTO-SYS-003 |

---

## 5. Detalle de cada Requisito Funcional

### 5.1 Módulo Catálogo (MOD-CAT-01)

#### RF-CAT-001 — Buscar y filtrar productos

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir que cualquier visitante encuentre productos relevantes rápidamente, reduciendo fricción de descubrimiento. |
| **Descripción** | El sistema debe ofrecer una capacidad de búsqueda y filtrado sobre el catálogo de productos, accesible sin autenticación. La operación es de solo lectura sobre `Product` y `Category`, no afecta ninguna FSM ni emite eventos de dominio. |
| **Actores** | GUEST, CUSTOMER, SELLER, ADMIN |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CAT-01 |
| **OPS de origen** | OPS-CAT-001 |
| **RN** | — |
| **RNF** | RNF-CAT-001 _(reservado — tiempo de respuesta de búsqueda)_ |
| **HU** | HU-CAT-001 |
| **UC** | UC-CAT-001 |
| **CA** | CA-CAT-001 |
| **TEST** | TEST-CAT-001 |

#### RF-CAT-002 — Ver detalle de producto

| Campo | Valor |
|---|---|
| **Objetivo** | Dar información suficiente para decisión de compra/consulta. |
| **Descripción** | El sistema debe presentar la vista completa de un producto individual seleccionado desde el catálogo. Opcionalmente puede emitir el evento `EVT-CAT-001 ProductoVisto`. No muta entidades. |
| **Actores** | GUEST, CUSTOMER, SELLER, ADMIN |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CAT-01 |
| **OPS de origen** | OPS-CAT-002 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-CAT-002 |
| **UC** | UC-CAT-002 |
| **CA** | CA-CAT-002 |
| **TEST** | TEST-CAT-002 |

#### RF-CAT-003 — Agregar producto al Formato Único

| Campo | Valor |
|---|---|
| **Objetivo** | Capturar intención de compra en el contenedor central (Formato Único), habilitando la conversión posterior a Consulta/Cotización/Pedido. |
| **Descripción** | Desde la vista de catálogo o detalle de producto, el sistema debe permitir agregar un producto al Formato Único del actor. Si el actor no tiene un FU activo, se crea uno nuevo (FSM `FU-T-01`). Si ya existe, se agrega o incrementa cantidad del ítem. Emite eventos `EVT-FU-001`, `EVT-CAT-002`, `EVT-FU-002`. |
| **Actores** | GUEST, CUSTOMER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CAT-01 |
| **OPS de origen** | OPS-CAT-003 |
| **RN** | RN-GUEST-01 |
| **RNF** | — |
| **HU** | HU-CAT-003 |
| **UC** | UC-CAT-003 |
| **CA** | CA-CAT-003 |
| **TEST** | TEST-CAT-003 |

---

### 5.2 Módulo Formato Único (MOD-FU-01)

#### RF-FU-001 — Editar cantidad de un ítem

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir ajuste de intención de compra antes de comprometerse a una transición irreversible. |
| **Descripción** | Sobre un FU en estado `BORRADOR`, el sistema debe permitir modificar la cantidad de un ítem existente. Recalcula totales vía `AUTO-FU-001`. Emite `EVT-FU-002 ItemActualizado`. |
| **Actores** | GUEST, CUSTOMER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-FU-01 |
| **OPS de origen** | OPS-FU-001 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-FU-001 |
| **UC** | UC-FU-001 |
| **CA** | CA-FU-001 |
| **TEST** | TEST-FU-001 |

#### RF-FU-002 — Eliminar ítem del Formato Único

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir corrección de intención de compra. |
| **Descripción** | Sobre un FU en `BORRADOR`, el sistema debe permitir eliminar un ítem específico. Recalcula totales. Emite `EVT-FU-002 ItemEliminado`. |
| **Actores** | GUEST, CUSTOMER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-FU-01 |
| **OPS de origen** | OPS-FU-002 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-FU-002 |
| **UC** | UC-FU-001 (sub-flujo) |
| **CA** | CA-FU-002 |
| **TEST** | TEST-FU-002 |

#### RF-FU-003 — Vaciar Formato Único

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir reinicio completo de la intención de compra sin crear un nuevo FU. |
| **Descripción** | Sobre un FU en `BORRADOR`, el sistema debe permitir eliminar todos los ítems en una sola operación. El FU permanece en `BORRADOR` sin contenido. |
| **Actores** | GUEST, CUSTOMER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-FU-01 |
| **OPS de origen** | OPS-FU-003 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-FU-003 |
| **UC** | UC-FU-001 (sub-flujo) |
| **CA** | CA-FU-003 |
| **TEST** | TEST-FU-003 |

#### RF-FU-004 — Solicitar consulta pre-venta

| Campo | Valor |
|---|---|
| **Objetivo** | Habilitar asesoría humana antes de comprometer una compra, capturando leads que requieren consultoría. |
| **Descripción** | El sistema debe permitir transicionar un FU de `BORRADOR` a `CONSULTA` (`FU-T-02`). La consulta queda visible en la cola de SELLER (MOD-CON-01). Emite `EVT-FU-003 ConsultaIniciada`. |
| **Actores** | GUEST, CUSTOMER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-FU-01 |
| **OPS de origen** | OPS-FU-004 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-FU-004 |
| **UC** | UC-FU-002 |
| **CA** | CA-FU-004 |
| **TEST** | TEST-FU-004 |

#### RF-FU-005 — Generar cotización

| Campo | Valor |
|---|---|
| **Objetivo** | Formalizar una propuesta comercial con precio fijo y validez temporal para clientes B2B. |
| **Descripción** | El sistema debe permitir transicionar un FU de `BORRADOR` a `COTIZACIÓN` (`FU-T-03`) o de `RESUELTA` a `COTIZACIÓN` (`FU-T-07`), congelando precios al momento de la operación (`price_at_time`), generando PDF e iniciando countdown de vigencia de 15 días. Requiere autenticación. Emite `EVT-FU-004 CotizacionGenerada`. **Sprint 6 — Patrón de Clonación (RN-FU-09):** la cotización se genera como un FU **clonado e independiente**; el FU original (el carrito) se vacía y permanece en `BORRADOR`, disponible de inmediato para seguir agregando productos, en vez de quedar bloqueado durante toda la vigencia de la cotización. |
| **Actores** | CUSTOMER (requiere autenticación) |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-FU-01 |
| **OPS de origen** | OPS-FU-005 |
| **RN** | RN-CHECKOUT-01, RN-CHECKOUT-02, RN-FU-03, RN-FU-09 |
| **RNF** | — |
| **HU** | HU-FU-005 |
| **UC** | UC-FU-003 |
| **CA** | CA-FU-005 |
| **TEST** | TEST-FU-005 |

#### RF-FU-006 — Iniciar checkout (Pedido)

| Campo | Valor |
|---|---|
| **Objetivo** | Convertir intención de compra en transacción formal de pago. |
| **Descripción** | El sistema debe permitir transicionar un FU de `BORRADOR` a `PEDIDO` (`FU-T-04`) o de `COTIZACIÓN` a `PEDIDO` (`FU-T-09`), creando un `Order` en estado `PENDING_PAYMENT` y navegando al flujo de checkout (MOD-CHK-01). Emite `EVT-FU-005 PedidoIniciado`. |
| **Actores** | GUEST, CUSTOMER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-FU-01 |
| **OPS de origen** | OPS-FU-006 |
| **RN** | RN-CHECKOUT-01, RN-CHECKOUT-02, RN-CHK-010 |
| **RNF** | — |
| **HU** | HU-FU-006 |
| **UC** | UC-FU-004 |
| **CA** | CA-FU-006 |
| **TEST** | TEST-FU-006 |

#### RF-FU-007 — Descargar PDF de cotización (vista CUSTOMER)

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir que el CUSTOMER comparta la propuesta comercial fuera del sistema. |
| **Descripción** | Sobre un FU en `COTIZACIÓN` o histórico con `pdf_url` válido, el sistema debe permitir al propietario CUSTOMER descargar el documento PDF generado. Operación de lectura. Capacidad técnica compartida con RF-COT-003 (ver OBS-002). |
| **Actores** | CUSTOMER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-FU-01 |
| **OPS de origen** | OPS-FU-007 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-FU-007 |
| **UC** | UC-FU-003 (sub-flujo) |
| **CA** | CA-FU-007 |
| **TEST** | TEST-FU-007 |

#### RF-FU-008 — Regenerar cotización expirada

| Campo | Valor |
|---|---|
| **Objetivo** | Evitar pérdida de la intención de compra cuando la vigencia comercial venció. |
| **Descripción** | Sobre un FU en `EXPIRADA`, el sistema debe permitir transicionar a `BORRADOR` (`FU-T-11`), preservando los ítems pero liberando los precios congelados para que vuelvan a ser dinámicos. Emite `EVT-FU-007 CotizacionRegenerada`. |
| **Actores** | CUSTOMER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-FU-01 |
| **OPS de origen** | OPS-FU-008 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-FU-008 |
| **UC** | UC-FU-005 |
| **CA** | CA-FU-008 |
| **TEST** | TEST-FU-008 |

#### RF-FU-009 — Resolver conflicto de migración GUEST→CUSTOMER

| Campo | Valor |
|---|---|
| **Objetivo** | Preservar intención de compra de ambas sesiones sin pérdida silenciosa de datos al autenticarse. |
| **Descripción** | Cuando un GUEST con FU activo se autentica como CUSTOMER que también tenía FU previo en `BORRADOR`, el sistema debe presentar opciones (descartar uno, combinar) para resolver el conflicto sin pérdida silenciosa. Emite `EVT-FU-008 FormatoUnicoMigrado` o `FormatoUnicoCombinado`. |
| **Actores** | CUSTOMER (en el instante posterior al login) |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-FU-01 |
| **OPS de origen** | OPS-FU-009 |
| **RN** | RN-GUEST-MIGRATE-01 |
| **RNF** | — |
| **HU** | HU-FU-009 |
| **UC** | UC-FU-006 |
| **CA** | CA-FU-009 |
| **TEST** | TEST-FU-009 |

#### RF-FU-010 — Consultar historial de Formatos Únicos

| Campo                | Valor                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Objetivo**         | Dar trazabilidad al CUSTOMER sobre sus interacciones comerciales pasadas, reforzando confianza y soporte pre-venta.                    |
| **Descripción**      | El sistema debe presentar al CUSTOMER autenticado un listado estructurado y filtrable de todos sus Formatos Únicos históricos en cualquier estado de la FSM (BORRADOR, COTIZACIÓN, CONSULTA, RESUELTA). Permite al cliente rastrear la evolución de sus carritos pre-compra, solicitudes de asesoría técnica y cotizaciones vigentes/expiradas, antes de que estas se conviertan en una orden de compra transaccional definitiva (Pedido). |
| **Actores**          | CUSTOMER                                                                                                                               |
| **Prioridad**        | MVP+                                                                                                                                   |
| **Módulo de origen** | MOD-FU-01                                                                                                                              |
| **OPS de origen**    | OPS-FU-010                                                                                                                             |
| **RN**               | —                                                                                                                                      |
| **RNF**              | —                                                                                                                                      |
| **HU**               | HU-FU-010                                                                                                                              |
| **UC**               | UC-FU-007                                                                                                                              |
| **CA**               | CA-FU-010                                                                                                                              |
| **TEST**             | TEST-FU-010                                                                                                                            |

#### RF-FU-011 — Reintentar pedido tras cancelación

| Campo                | Valor                                                                                                                                                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objetivo**         | Preservar la intención de compra cuando un intento de pago falla o se cancela, evitando que el usuario tenga que recrear su FU desde cero.                                                                                                                            |
| **Descripción**      | Sobre un FU en `CANCELADO`, el sistema debe permitir transicionar a `BORRADOR` (`FU-T-14`) preservando los ítems. El `Order` cancelado permanece inmutable como histórico. Emite `EVT-FU-011 FormatoUnicoReintentado`. Ver OBS-003 sobre colaboración con MOD-CHK-01. |
| **Actores**          | GUEST, CUSTOMER                                                                                                                           |
| **Prioridad**        | MVP                                                                                                                                       |
| **Módulo de origen** | MOD-FU-01                                                                                                                                 |
| **OPS de origen**    | OPS-FU-011                                                                                                                                |
| **RN**               | RN-CHK-009, RN-CHK-010                                                                                                                    |
| **RNF**              | —                                                                                                                                         |
| **HU**               | HU-FU-011                                                                                                                                 |
| **UC**               | UC-CHK-004                                                                                                                                |
| **CA**               | CA-FU-011                                                                                                                                 |
| **TEST**             | TEST-FU-011                                                                                                                               |

---

#### RF-FU-012 — Consultar Historial de Pedidos

| Campo                | Valor                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Objetivo**         | Dar trazabilidad al CUSTOMER sobre sus interacciones post-venta.                                                                                                                                                                                                                                                                                                                                 |
| **Descripción**      | El sistema debe presentar al CUSTOMER autenticado un listado detallado de sus Formatos Únicos que ya han transicionado a estados transaccionales (PEDIDO o CONFIRMADO) y por ende cuentan con una orden de compra (Order) asociada. Permite realizar el seguimiento transaccional post-venta: estado del pago (pendiente, pagado, cancelado), costos de envío Shalom y descarga de comprobantes. |
| **Actores**          | CUSTOMER                                                                                                                                                                                                                                                                                                                                                                                         |
| **Prioridad**        | MVP+                                                                                                                                                                                                                                                                                                                                                                                             |
| **Módulo de origen** | MOD-FU-01                                                                                                                                                                                                                                                                                                                                                                                        |
| **OPS de origen**    | OPS-FU-010                                                                                                                                                                                                                                                                                                                                                                                       |
| **RN**               | —                                                                                                                                                                                                                                                                                                                                                                                                |
| **RNF**              | —                                                                                                                                                                                                                                                                                                                                                                                                |
| **HU**               | HU-FU-012                                                                                                                                                                                                                                                                                                                                                                                        |
| **UC**               | UC-FU-007                                                                                                                                                                                                                                                                                                                                                                                        |
| **CA**               | CA-FU-011                                                                                                                                                                                                                                                                                                                                                                                        |
| **TEST**             | TEST-FU-011                                                                                                                                                                                                                                                                                                                                                                                      |


---

### 5.3 Módulo Checkout (MOD-CHK-01)

#### RF-CHK-001 — Capturar datos de envío y facturación

| Campo | Valor |
|---|---|
| **Objetivo** | Recolectar la información mínima necesaria para emitir un comprobante válido y ejecutar el envío físico. |
| **Descripción** | Sobre un `Order` en `PENDING_PAYMENT`, el sistema debe capturar y validar datos de dirección de envío, DNI/RUC y tipo de documento. |
| **Actores** | GUEST, CUSTOMER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CHK-01 |
| **OPS de origen** | OPS-CHK-001 |
| **RN** | RN-CHK-001, RN-CHK-002 |
| **RNF** | — |
| **HU** | HU-CHK-001 |
| **UC** | UC-CHK-001 |
| **CA** | CA-CHK-001 |
| **TEST** | TEST-CHK-001 |

#### RF-CHK-002 — Calcular costo de envío

| Campo | Valor |
|---|---|
| **Objetivo** | Dar transparencia de costo total antes del pago, evitando abandono de checkout. |
| **Descripción** | Tras la captura de dirección, el sistema debe calcular y reflejar el costo de envío y el total final en el resumen visible al actor antes de confirmar el pago. Disparado automáticamente. |
| **Actores** | sistema (disparado por acción del usuario) |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CHK-01 |
| **OPS de origen** | OPS-CHK-002 |
| **RN** | RN-SHP-01 |
| **RNF** | — |
| **HU** | HU-CHK-002 |
| **UC** | UC-CHK-001 (sub-flujo) |
| **CA** | CA-CHK-002 |
| **TEST** | TEST-CHK-002 |

#### RF-CHK-003 — Iniciar proceso de pago

| Campo | Valor |
|---|---|
| **Objetivo** | Entregar el control transaccional a la pasarela de pago de forma segura. |
| **Descripción** | El sistema debe redirigir al actor a la interfaz de MercadoPago con los datos correctos de monto y referencia, registrando la preferencia de pago en `Order`. Emite `EVT-CHK-001 PagoIniciado`. |
| **Actores** | GUEST, CUSTOMER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CHK-01 |
| **OPS de origen** | OPS-CHK-003 |
| **RN** | RN-CHK-003 |
| **RNF** | — |
| **HU** | HU-CHK-003 |
| **UC** | UC-CHK-002 |
| **CA** | CA-CHK-003 |
| **TEST** | TEST-CHK-003 |

#### RF-CHK-004 — Confirmar pago (webhook)

| Campo | Valor |
|---|---|
| **Objetivo** | Garantizar que el sistema reconoce de forma fiable y única un pago real, evitando duplicados o fraude por replay. |
| **Descripción** | El sistema debe procesar webhooks de MercadoPago con idempotencia (`PaymentIdempotencyKey`), transicionando el `Order` a `PAID` (`ORD-T-02`) y el FU a `CONFIRMADO` (`FU-T-12`). Emite `EVT-CHK-002 PagoConfirmado`. Dispara `OPS-CHK-007` (email). |
| **Actores** | sistema (MercadoPago como disparador externo) |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CHK-01 |
| **OPS de origen** | OPS-CHK-004 |
| **RN** | RN-CHK-004, RN-CHK-005 |
| **RNF** | RNF-CHK-001 _(reservado — tiempo máximo de procesamiento del webhook)_ |
| **HU** | HU-CHK-004 |
| **UC** | UC-CHK-003 |
| **CA** | CA-CHK-004 |
| **TEST** | TEST-CHK-004 |

#### RF-CHK-005 — Manejar pago fallido o cancelado

| Campo | Valor |
|---|---|
| **Objetivo** | Liberar el FU del estado bloqueado PEDIDO cuando el pago no se concreta, permitiendo reintentar sin perder la intención de compra. |
| **Descripción** | Ante notificación de fallo/cancelación de MercadoPago o acción del usuario, el sistema debe transicionar `Order` a `CANCELLED` (`ORD-T-03`) y FU a `CANCELADO` (`FU-T-13`), registrando `cancellation_reason`. Emite `EVT-CHK-003 PagoFallido`. |
| **Actores** | sistema (MercadoPago) o CUSTOMER/GUEST |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CHK-01 |
| **OPS de origen** | OPS-CHK-005 |
| **RN** | RN-CHK-006 |
| **RNF** | — |
| **HU** | HU-CHK-005 |
| **UC** | UC-CHK-004 |
| **CA** | CA-CHK-005 |
| **TEST** | TEST-CHK-005 |

#### RF-CHK-006 — Consultar confirmación de pedido

| Campo | Valor |
|---|---|
| **Objetivo** | Dar certeza al comprador de que su compra fue exitosa, reduciendo ansiedad post-compra y contactos de soporte. |
| **Descripción** | El sistema debe permitir consultar el estado de un `Order` mediante URL con `orderToken` (acceso GUEST) o sesión autenticada (CUSTOMER). Operación de lectura. |
| **Actores** | GUEST (vía orderToken), CUSTOMER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CHK-01 |
| **OPS de origen** | OPS-CHK-006 |
| **RN** | RN-CHK-007 |
| **RNF** | — |
| **HU** | HU-CHK-006 |
| **UC** | UC-CHK-005 |
| **CA** | CA-CHK-006 |
| **TEST** | TEST-CHK-006 |

#### RF-CHK-007 — Enviar email de confirmación

| Campo | Valor |
|---|---|
| **Objetivo** | Entregar comprobante y certeza transaccional fuera del sistema, en un canal persistente. |
| **Descripción** | Tras confirmación de pago (`ORD-T-02`), el sistema debe enviar automáticamente un email al comprador con el detalle del pedido y/o `orderToken` de consulta. Emite `EVT-CHK-004 EmailConfirmacionEnviado`. |
| **Actores** | sistema |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CHK-01 |
| **OPS de origen** | OPS-CHK-007 |
| **RN** | RN-CHK-008 |
| **RNF** | — |
| **HU** | HU-CHK-007 |
| **UC** | UC-CHK-003 (sub-flujo) |
| **CA** | CA-CHK-007 |
| **TEST** | TEST-CHK-007 |

#### RF-CHK-008 — Cancelar/reintentar pedido manualmente

| Campo | Valor |
|---|---|
| **Objetivo** | Dar control al comprador para abortar una compra antes de la confirmación, y luego permitir reintento conservando la intención de compra. |
| **Descripción** | El sistema debe ofrecer al usuario controles explícitos para cancelar un pedido en `PENDING_PAYMENT` (`ORD-T-03`), y desde el estado de pedido fallido, lanzar el reintento que delega en RF-FU-011. Ver OBS-003 sobre colaboración entre módulos. |
| **Actores** | CUSTOMER, GUEST (vía orderToken) |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CHK-01 |
| **OPS de origen** | OPS-CHK-008 |
| **RN** | RN-CHK-009, RN-CHK-010 |
| **RNF** | — |
| **HU** | HU-CHK-008 |
| **UC** | UC-CHK-004 |
| **CA** | CA-CHK-008 |
| **TEST** | TEST-CHK-008 |

---

#### RF-ORD-001 — Listar y consultar detalle de pedidos (Orders)

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir al cliente consultar su historial de pedidos y verificar el estado y los detalles de una compra específica. |
| **Descripción** | El sistema debe exponer endpoints para listar todos los pedidos del usuario autenticado (`GET /orders`) y ver el detalle completo de un pedido específico (`GET /orders/{order_id}`). Debe aplicar validación estricta de propiedad (Zero Trust/RLS) para que un cliente solo acceda a sus propios pedidos. |
| **Actores** | CUSTOMER, GUEST (vía orderToken) |
| **Prioridad** | CRÍTICA |
| **Módulo de origen** | MOD-CHK-01 |
| **OPS de origen** | OPS-CHK-006 |
| **RN** | RN-CHK-006 |
| **RNF** | RNF-SEC-001 |
| **HU** | HU-CHK-003 |
| **UC** | UC-CHK-003 |
| **CA** | CA-CHK-006 |
| **TEST** | TEST-CHK-006 |

---

### 5.4 Módulo Consulta — vista SELLER (MOD-CON-01)

#### RF-CON-001 — Ver cola de consultas pendientes

| Campo | Valor |
|---|---|
| **Objetivo** | Dar visibilidad centralizada de toda la demanda de asesoría aún no atendida, permitiendo que cualquier SELLER disponible la tome. |
| **Descripción** | El sistema debe presentar al SELLER un listado filtrable/ordenable de todos los FU en estado `CONSULTA`, sin distinción entre asignados y no asignados. Operación de lectura. |
| **Actores** | SELLER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CON-01 |
| **OPS de origen** | OPS-CON-001 |
| **RN** | RN-CONSULTA-ASSIGN-01 |
| **RNF** | — |
| **HU** | HU-CON-001 |
| **UC** | UC-CON-001 |
| **CA** | CA-CON-001 |
| **TEST** | TEST-CON-001 |

#### RF-CON-002 — Tomar (asignarse) una consulta

| Campo | Valor |
|---|---|
| **Objetivo** | Convertir una consulta huérfana en una consulta con responsable claro, evitando que dos SELLERs trabajen sobre el mismo lead simultáneamente. |
| **Descripción** | El sistema debe permitir al SELLER fijarse como responsable de una consulta no asignada, sin cambiar el estado del FU. Emite `EVT-CON-001 ConsultaAsignada`. Debe resolver condición de carrera con bloqueo optimista. |
| **Actores** | SELLER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CON-01 |
| **OPS de origen** | OPS-CON-002 |
| **RN** | RN-CONSULTA-ASSIGN-01, RN-CON-001 _(reservado — unicidad de asignación)_ |
| **RNF** | — |
| **HU** | HU-CON-002 |
| **UC** | UC-CON-001 (sub-flujo) |
| **CA** | CA-CON-002 |
| **TEST** | TEST-CON-002 |

#### RF-CON-003 — Responder consulta

| Campo | Valor |
|---|---|
| **Objetivo** | Entregar asesoría comercial que permita al cliente decidir entre convertir su interés en cotización formal o descartarlo. |
| **Descripción** | El SELLER asignado debe poder redactar y enviar una respuesta de asesoría, transicionando el FU de `CONSULTA` a `RESUELTA` (`FU-T-05`). Emite `EVT-FU-012 ConsultaResuelta`. |
| **Actores** | SELLER (asignado) |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-CON-01 |
| **OPS de origen** | OPS-CON-003 |
| **RN** | RN-CON-002 _(reservado — solo el asignado puede responder)_ |
| **RNF** | — |
| **HU** | HU-CON-003 |
| **UC** | UC-CON-002 |
| **CA** | CA-CON-003 |
| **TEST** | TEST-CON-003 |

#### RF-CON-004 — Filtrar y buscar consultas

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir al SELLER priorizar su carga de trabajo (consultas propias vs cola general, por fecha, por estado). |
| **Descripción** | El sistema debe permitir refinar el listado de consultas mediante filtros combinables (asignación al actor, rango de fecha). |
| **Actores** | SELLER |
| **Prioridad** | MVP+ |
| **Módulo de origen** | MOD-CON-01 |
| **OPS de origen** | OPS-CON-004 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-CON-004 |
| **UC** | UC-CON-001 (sub-flujo) |
| **CA** | CA-CON-004 |
| **TEST** | TEST-CON-004 |

---

### 5.5 Módulo Cotización — vista SELLER (MOD-COT-01)

#### RF-COT-001 — Ver listado de cotizaciones

| Campo | Valor |
|---|---|
| **Objetivo** | Dar visibilidad centralizada al equipo de ventas sobre el pipeline comercial B2B. |
| **Descripción** | El sistema debe presentar al SELLER un listado filtrable de FU en estados `COTIZACIÓN`, `EXPIRADA`, `PEDIDO`, `CONFIRMADO`, con su vigencia. Operación de lectura, sin filtro de propiedad (visibilidad compartida). |
| **Actores** | SELLER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-COT-01 |
| **OPS de origen** | OPS-COT-001 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-COT-001 |
| **UC** | UC-COT-001 |
| **CA** | CA-COT-001 |
| **TEST** | TEST-COT-001 |

#### RF-COT-002 — Ver detalle de cotización

| Campo | Valor |
|---|---|
| **Objetivo** | Dar contexto completo para soporte comercial proactivo. |
| **Descripción** | El sistema debe presentar al SELLER el detalle de una cotización individual (cliente, ítems, precios fijados, vigencia, historial, PDF). Operación de lectura. |
| **Actores** | SELLER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-COT-01 |
| **OPS de origen** | OPS-COT-002 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-COT-002 |
| **UC** | UC-COT-001 (sub-flujo) |
| **CA** | CA-COT-002 |
| **TEST** | TEST-COT-002 |

#### RF-COT-003 — Descargar PDF de cotización (vista SELLER)

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir al SELLER acceder al mismo documento comercial que el cliente recibió, para soporte o seguimiento telefónico. |
| **Descripción** | Desde el detalle de cotización, el SELLER debe poder descargar el PDF persistido. Operación de lectura. Capacidad técnica compartida con RF-FU-007 (ver OBS-002). |
| **Actores** | SELLER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-COT-01 |
| **OPS de origen** | OPS-COT-003 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-COT-003 |
| **UC** | UC-COT-001 (sub-flujo) |
| **CA** | CA-COT-003 |
| **TEST** | TEST-COT-003 |

---

### 5.6 Módulo Panel SELLER (MOD-SEL-01)

#### RF-SEL-001 — Ver listado de productos para gestión de stock

| Campo | Valor |
|---|---|
| **Objetivo** | Dar visibilidad operativa sobre el inventario para mantenerlo actualizado y evitar ventas sobre productos agotados. |
| **Descripción** | El sistema debe presentar al SELLER un listado de productos con su stock actual, indicando visualmente alertas cuando el stock está bajo el umbral. Operación de lectura. |
| **Actores** | SELLER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-SEL-01 |
| **OPS de origen** | OPS-SEL-001 |
| **RN** | RN-CALC-03 |
| **RNF** | — |
| **HU** | HU-SEL-001 |
| **UC** | UC-SEL-001 |
| **CA** | CA-SEL-001 |
| **TEST** | TEST-SEL-001 |

#### RF-SEL-002 — Actualizar stock de un producto

| Campo | Valor |
|---|---|
| **Objetivo** | Mantener el inventario sincronizado con la realidad física, condición necesaria para que la validación de stock funcione en todo el sistema. |
| **Descripción** | El SELLER debe poder modificar el valor de `Product.stock` para un producto específico. Emite `EVT-SEL-001 StockActualizado`. Dispara recalculo de badges en MOD-CAT-01 vía `AUTO-CAT-001`. |
| **Actores** | SELLER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-SEL-01 |
| **OPS de origen** | OPS-SEL-002 |
| **RN** | RN-SEL-001 _(reservado — stock no negativo)_ |
| **RNF** | — |
| **HU** | HU-SEL-002 |
| **UC** | UC-SEL-001 (sub-flujo) |
| **CA** | CA-SEL-002 |
| **TEST** | TEST-SEL-002 |

#### RF-SEL-003 — Configurar umbral mínimo de stock por producto

| Campo                | Valor                                                                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objetivo**         | Permitir que la alerta de stock bajo se ajuste a la rotación real de cada producto, en vez de un valor genérico.                                                                                                |
| **Descripción**      | El SELLER debe poder fijar `Product.stock_min_threshold` por producto, sobreescribiendo el default global de ADMIN. Emite `EVT-SEL-002 UmbralStockActualizado`. Jerarquía: valor por producto > default global. |
| **Actores**          | SELLER (con conflicto documentado — ver OBS-001)                                                                                                                                                                |
| **Prioridad**        | MVP+                                                                                                                                                                                                            |
| **Módulo de origen** | MOD-SEL-01                                                                                                                                                                                                      |
| **OPS de origen**    | OPS-SEL-003                                                                                                                                                                                                     |
| **RN**               | RN-CALC-03                                                                                                                                                                                                      |
| **RNF**              | —                                                                                                                                                                                                               |
| **HU**               | HU-SEL-003                                                                                                                                                                                                      |
| **UC**               | UC-SEL-001 (sub-flujo)                                                                                                                                                                                          |
| **CA**               | CA-SEL-003                                                                                                                                                                                                      |
| **TEST**             | TEST-SEL-003                                                                                                                                                                                                    |

#### RF-SEL-004 — Ver cola de pedidos listos para envío

| Campo | Valor |
|---|---|
| **Objetivo** | Dar visibilidad operativa sobre pedidos pagados que requieren despacho físico. |
| **Descripción** | El sistema debe presentar al SELLER un listado ordenable de `Order` en estado `READY_TO_SHIP`. Operación de lectura. |
| **Actores** | SELLER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-SEL-01 |
| **OPS de origen** | OPS-SEL-004 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-SEL-004 |
| **UC** | UC-SEL-002 |
| **CA** | CA-SEL-004 |
| **TEST** | TEST-SEL-004 |

#### RF-SEL-005 — Generar guía de envío

| Campo | Valor |
|---|---|
| **Objetivo** | Formalizar el despacho físico del pedido, transicionándolo a un estado de seguimiento logístico. |
| **Descripción** | El SELLER debe poder generar una `ShippingGuide` para un `Order` en `READY_TO_SHIP`, transicionándolo a `SHIPPED` (`ORD-T-06`) con código de seguimiento mock. Emite `EVT-SEL-003 GuiaGenerada`. |
| **Actores** | SELLER |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-SEL-01 |
| **OPS de origen** | OPS-SEL-005 |
| **RN** | RN-SHP-01 |
| **RNF** | — |
| **HU** | HU-SEL-005 |
| **UC** | UC-SEL-002 (sub-flujo) |
| **CA** | CA-SEL-005 |
| **TEST** | TEST-SEL-005 |

#### RF-SEL-006 — Ver historial de pedidos despachados

| Campo | Valor |
|---|---|
| **Objetivo** | Dar trazabilidad operativa sobre despachos ya completados, para soporte o auditoría interna. |
| **Descripción** | El sistema debe presentar al SELLER un listado filtrado de `Order` en estado `SHIPPED`. Operación de lectura. |
| **Actores** | SELLER |
| **Prioridad** | MVP+ |
| **Módulo de origen** | MOD-SEL-01 |
| **OPS de origen** | OPS-SEL-006 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-SEL-006 |
| **UC** | UC-SEL-002 (sub-flujo) |
| **CA** | CA-SEL-006 |
| **TEST** | TEST-SEL-006 |

---

### 5.7 Módulo Panel ADMIN (MOD-ADM-01)

#### RF-ADM-001 — Listar usuarios

| Campo | Valor |
|---|---|
| **Objetivo** | Dar visibilidad completa sobre el conjunto de cuentas (SELLER, ADMIN, CUSTOMER) para gobernanza. |
| **Descripción** | El sistema debe presentar al ADMIN un listado de `User` filtrable por rol y estado. Operación de lectura. |
| **Actores** | ADMIN |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-ADM-01 |
| **OPS de origen** | OPS-ADM-001 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-ADM-001 |
| **UC** | UC-ADM-001 |
| **CA** | CA-ADM-001 |
| **TEST** | TEST-ADM-001 |

#### RF-ADM-002 — Crear usuario (SELLER/ADMIN)

| Campo | Valor |
|---|---|
| **Objetivo** | Habilitar el ingreso controlado de personal interno con privilegios, restringido a creación administrativa (no autoregistro). |
| **Descripción** | El ADMIN debe poder crear cuentas `User` con `role ∈ {SELLER, ADMIN}` y `auth_provider = LOCAL`. Emite `EVT-ADM-001 UsuarioCreado`. |
| **Actores** | ADMIN |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-ADM-01 |
| **OPS de origen** | OPS-ADM-002 |
| **RN** | RN-ADM-001 _(reservado — email único en el sistema)_ |
| **RNF** | — |
| **HU** | HU-ADM-002 |
| **UC** | UC-ADM-001 (sub-flujo) |
| **CA** | CA-ADM-002 |
| **TEST** | TEST-ADM-002 |

#### RF-ADM-003 — Suspender usuario

| Campo | Valor |
|---|---|
| **Objetivo** | Revocar acceso temporal sin destruir el historial asociado a esa cuenta. |
| **Descripción** | El ADMIN debe poder marcar un `User` como `is_suspended = true`, invalidando sus sesiones activas. Emite `EVT-ADM-002 UsuarioSuspendido`. |
| **Actores** | ADMIN |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-ADM-01 |
| **OPS de origen** | OPS-ADM-003 |
| **RN** | RN-ADMIN-01, RN-ADMIN-02 |
| **RNF** | — |
| **HU** | HU-ADM-003 |
| **UC** | UC-ADM-001 (sub-flujo) |
| **CA** | CA-ADM-003 |
| **TEST** | TEST-ADM-003 |

#### RF-ADM-004 — Eliminar usuario

| Campo                | Valor                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Objetivo**         | Remover permanentemente una cuenta cuando la suspensión no es suficiente.                                                                                                                                                                  |
| **Descripción**      | El ADMIN debe poder eliminar un `User` mediante soft-delete (`is_active = false`, `deleted_at` timestamp), preservando la integridad referencial de `AuditLog`, `Order` y `FormatoUnico` históricos. Emite `EVT-ADM-003 UsuarioEliminado`. |
| **Actores**          | ADMIN                                                                                                                                                                                                                                      |
| **Prioridad**        | MVP                                                                                                                                                                                                                                        |
| **Módulo de origen** | MOD-ADM-01                                                                                                                                                                                                                                 |
| **OPS de origen**    | OPS-ADM-004                                                                                                                                                                                                                                |
| **RN**               | RN-ADMIN-01, RN-ADMIN-02                                                                                                                                                                                                                   |
| **RNF**              | —                                                                                                                                                                                                                                          |
| **HU**               | HU-ADM-004                                                                                                                                                                                                                                 |
| **UC**               | UC-ADM-001 (sub-flujo)                                                                                                                                                                                                                     |
| **CA**               | CA-ADM-004                                                                                                                                                                                                                                 |
| **TEST**             | TEST-ADM-004                                                                                                                                                                                                                               |

#### RF-ADM-005 — Gestionar catálogo completo (CRUD de productos)

| Campo | Valor |
|---|---|
| **Objetivo** | Mantener control total sobre la oferta comercial, separado de la edición operativa de stock que tiene SELLER. |
| **Descripción** | El ADMIN debe poder crear, editar y desactivar `Product` y `Category`. Emite `EVT-ADM-004` (`ProductoCreado`/`ProductoActualizado`/`ProductoDesactivado`). Los cambios se reflejan en MOD-CAT-01 vía `AUTO-CAT-002`. |
| **Actores** | ADMIN |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-ADM-01 |
| **OPS de origen** | OPS-ADM-005 |
| **RN** | RN-CATALOG-01 |
| **RNF** | — |
| **HU** | HU-ADM-005 |
| **UC** | UC-ADM-002 |
| **CA** | CA-ADM-005 |
| **TEST** | TEST-ADM-005 |

#### RF-ADM-006 — Ver métricas de ventas

| Campo | Valor |
|---|---|
| **Objetivo** | Dar visibilidad analítica del desempeño comercial para toma de decisiones de negocio. |
| **Descripción** | El sistema debe presentar al ADMIN gráficos agregados de revenue por período y productos más vendidos, derivados de `Order` en estados `PAID`/`SHIPPED`. Operación de lectura. |
| **Actores** | ADMIN |
| **Prioridad** | MVP+ |
| **Módulo de origen** | MOD-ADM-01 |
| **OPS de origen** | OPS-ADM-006 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-ADM-006 |
| **UC** | UC-ADM-003 |
| **CA** | CA-ADM-006 |
| **TEST** | TEST-ADM-006 |

#### RF-ADM-007 — Configurar parámetros del sistema

| Campo                | Valor                                                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Objetivo**         | Centralizar configuración global que afecta el comportamiento de negocio.                                                                                                                                                |
| **Descripción**      | El ADMIN debe poder modificar parámetros globales (ej. `default_stock_min_threshold` aplicable a productos nuevos, `quote_validity_days`) sobre la entidad `SystemConfig`. Emite `EVT-ADM-005 ConfiguracionActualizada`. |
| **Actores**          | ADMIN                                                                                                                                                                                                                    |
| **Prioridad**        | MVP+                                                                                                                                                                                                                     |
| **Módulo de origen** | MOD-ADM-01                                                                                                                                                                                                               |
| **OPS de origen**    | OPS-ADM-007                                                                                                                                                                                                              |
| **RN**               | RN-CALC-03, RN-FU-03                                                                                                                                                                                                     |
| **RNF**              | —                                                                                                                                                                                                                        |
| **HU**               | HU-ADM-007                                                                                                                                                                                                               |
| **UC**               | UC-ADM-004                                                                                                                                                                                                               |
| **CA**               | CA-ADM-007                                                                                                                                                                                                               |
| **TEST**             | TEST-ADM-007                                                                                                                                                                                                             |

#### RF-ADM-008 — Exportar datos con re-autenticación MFA

| Campo                | Valor                                                                                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objetivo**         | Permitir extracción de datos sensibles para reportes externos o respaldo, con control de seguridad reforzad                                                                                                           |
| **Descripción**     El ADMIN debe poder ejecutar una exportación masiva en formato CSV tras completar una re-autenticación MFA step-up inmediatamente previa. Emite `EVT-ADM-006 ExportacionDatosRealizada` y se registra en `AuditLog`. g`. |
| **Actores**          | A                                                                                                                                                                                                                     |
| **Prioridad**        |                                                                                                                                                                                                                       |
| **Módulo de origen** | MOD-                                                                                                                                                                                                                  |
| **OPS de origen**    | OPS-                                                                                                                                                                                                                  |
| **RN**               | RN-ADM-002 _(reservado — MFA step-up oblig                                                                                                                                                                            |
| **RNF**                                                                                                                                                                                                                                      |
| **HU**               |                                                                                                                                                                                                                       |
| **UC**               |                                                                                                                                                                                                                       |
| **CA**                                                                                                                                                                                                                                       |
| **TEST**             |                                                                                                                                                                                                                       |

#### RF-ADM-009 — Asignar consultas preventa

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir al administrador equilibrar la carga de trabajo asignando preventas a vendedores específicos. |
| **Descripción** | El ADMIN debe poder asignar manualmente cualquier consulta en estado `CONSULTA` a un `User` con rol `SELLER` a través de un panel de asignación. |
| **Actores** | ADMIN |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-ADM-01, MOD-CON-01 |
| **OPS de origen** | OPS-ADM-009 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-ADM-009 |
| **UC** | UC-ADM-005 |
| **CA** | CA-ADM-009 |
| **TEST** | TEST-ADM-009 |

#### RF-ADM-010 — Aplicar descuento comercial B2B

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir al administrador otorgar condiciones comerciales especiales congeladas en cotizaciones de volumen. |
| **Descripción** | El ADMIN debe poder aplicar un descuento de hasta el 30% a cotizaciones vigentes (`COTIZACION`). El subtotal se recalcula de inmediato y se regenera el PDF. |
| **Actores** | ADMIN |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-ADM-01, MOD-COT-01 |
| **OPS de origen** | OPS-ADM-010 |
| **RN** | RN-ADM-04 |
| **RNF** | — |
| **HU** | HU-ADM-010 |
| **UC** | UC-ADM-006 |
| **CA** | CA-ADM-010 |
| **TEST** | TEST-ADM-010 |

---

### 5.8 Módulo Autenticación (MOD-AUT-01)

#### RF-AUT-001 — Iniciar sesión con Google (CUSTOMER)

| Campo | Valor |
|---|---|
| **Objetivo** | Reducir fricción de registro para clientes, delegando la verificación de identidad a un proveedor confiable. |
| **Descripción** | El sistema debe ofrecer autenticación CUSTOMER vía OAuth con Google. En el primer login crea el `User`; en logins posteriores autentica al existente. Si existía conflicto de FU activo, dispara automáticamente RF-FU-009. Emite `EVT-AUT-001` y opcionalmente `EVT-AUT-002`. |
| **Actores** | CUSTOMER (potencial) |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-AUT-01 |
| **OPS de origen** | OPS-AUT-001 |
| **RN** | RN-AUT-001 _(reservado — CUSTOMER solo vía Google)_ |
| **RNF** | — |
| **HU** | HU-AUT-001 |
| **UC** | UC-AUT-001 |
| **CA** | CA-AUT-001 |
| **TEST** | TEST-AUT-001 |

#### RF-AUT-002 — Iniciar sesión local (SELLER/ADMIN)

| Campo | Valor |
|---|---|
| **Objetivo** | Autenticar personal interno con credenciales gestionadas internamente, sin depender de proveedores externos. |
| **Descripción** | El sistema debe permitir login con email + password (Argon2id) para `User` con `auth_provider = LOCAL`. Si `mfa_enabled = true`, continúa a RF-AUT-003. Emite `EVT-AUT-001 SesionIniciada`. |
| **Actores** | SELLER, ADMIN |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-AUT-01 |
| **OPS de origen** | OPS-AUT-002 |
| **RN** | RN-AUT-002 _(reservado — SELLER/ADMIN solo con credenciales locales)_ |
| **RNF** | — |
| **HU** | HU-AUT-002 |
| **UC** | UC-AUT-002 |
| **CA** | CA-AUT-002 |
| **TEST** | TEST-AUT-002 |

#### RF-AUT-003 — Verificar código MFA (TOTP)

| Campo | Valor |
|---|---|
| **Objetivo** | Reforzar la seguridad de cuentas con privilegios elevados, mitigando riesgo de acceso no autorizado por credenciales comprometidas. |
| **Descripción** | Tras login local exitoso, el sistema debe solicitar y verificar un código TOTP de 6 dígitos contra `User.mfa_secret`. Obligatorio para ADMIN (invariante), opcional para SELLER (si habilitó). Emite `EVT-AUT-003 MFAVerificado`. |
| **Actores** | SELLER (si habilitado), ADMIN (siempre) |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-AUT-01 |
| **OPS de origen** | OPS-AUT-003 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-AUT-003 |
| **UC** | UC-AUT-002 (sub-flujo) |
| **CA** | CA-AUT-003 |
| **TEST** | TEST-AUT-003 |

#### RF-AUT-004 — Usar código de respaldo MFA

| Campo | Valor |
|---|---|
| **Objetivo** | Evitar bloqueo permanente de cuenta cuando el dispositivo TOTP no está disponible. |
| **Descripción** | Como alternativa al código TOTP, el sistema debe aceptar uno de los códigos de respaldo registrados en `User.mfa_backup_codes` y marcarlo como consumido. Emite `EVT-AUT-004 CodigoRespaldoUsado`. |
| **Actores** | SELLER, ADMIN |
| **Prioridad** | MVP+ |
| **Módulo de origen** | MOD-AUT-01 |
| **OPS de origen** | OPS-AUT-004 |
| **RN** | RN-AUT-003 _(reservado — código de respaldo single-use)_ |
| **RNF** | — |
| **HU** | HU-AUT-004 |
| **UC** | UC-AUT-002 (sub-flujo alternativo) |
| **CA** | CA-AUT-004 |
| **TEST** | TEST-AUT-004 |

#### RF-AUT-005 — Habilitar/configurar MFA (SELLER)

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir adopción voluntaria de seguridad reforzada para SELLER. |
| **Descripción** | El SELLER debe poder generar su `mfa_secret` y `mfa_backup_codes`, activando `mfa_enabled = true` para sesiones futuras. Emite `EVT-AUT-005 MFAHabilitado`. Ver OBS-004 sobre ausencia de capacidad de forzado por ADMIN. |
| **Actores** | SELLER |
| **Prioridad** | MVP+ |
| **Módulo de origen** | MOD-AUT-01 |
| **OPS de origen** | OPS-AUT-005 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-AUT-005 |
| **UC** | UC-AUT-003 |
| **CA** | CA-AUT-005 |
| **TEST** | TEST-AUT-005 |

#### RF-AUT-006 — Cerrar sesión

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir terminación explícita de sesión por el propio usuario, control básico de seguridad. |
| **Descripción** | El sistema debe ofrecer una acción de logout disponible globalmente que invalide la sesión actual del actor. Emite `EVT-AUT-006 SesionCerrada`. |
| **Actores** | CUSTOMER, SELLER, ADMIN |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-AUT-01 |
| **OPS de origen** | OPS-AUT-006 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-AUT-006 |
| **UC** | UC-AUT-004 |
| **CA** | CA-AUT-006 |
| **TEST** | TEST-AUT-006 |


RF-AUT-007 (Nueva): Gestión de Acceso Administrativo. 
**Definición**: "El personal administrativo (ADMIN) y comercial (SELLER) accede al sistema mediante un portal exclusivo en la ruta /admin/login, utilizando credenciales de correo y contraseña validadas contra la base de datos interna."

### 5.9 Módulo Integración DISTRIBUTOR (MOD-DIS-01)

#### RF-DIS-001 — Autenticar solicitud de sincronización

| Campo | Valor |
|---|---|
| **Objetivo** | Garantizar que solo distribuidores autorizados pueden modificar precios/stock del catálogo, protegiendo la integridad comercial del sistema. |
| **Descripción** | El sistema debe verificar firma HMAC y `NonceRegistry` en cada solicitud entrante al endpoint de sincronización. Rechazo con 401 si la validación falla, registrando intento en `AuditLog` (posible actividad sospechosa). Sin actor humano (sistema externo). |
| **Actores** | DISTRIBUTOR (sistema externo) |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-DIS-01 |
| **OPS de origen** | OPS-DIS-001 |
| **RN** | RN-DIS-002 _(reservado — HMAC + nonce no reutilizado)_ |
| **RNF** | — |
| **HU** | — _(ver OBS-005 — sin actor humano, decisión metodológica)_ |
| **UC** | UC-DIS-001 |
| **CA** | CA-DIS-001 |
| **TEST** | TEST-DIS-001 |

#### RF-DIS-002 — Sincronizar precios de productos

| Campo | Valor |
|---|---|
| **Objetivo** | Mantener los precios del catálogo alineados con el costo mayorista actual sin intervención manual de ADMIN. |
| **Descripción** | Tras autenticación exitosa, el sistema debe aplicar actualizaciones de `Product.price_public` y `Product.price_wholesale` solo para SKUs existentes y reconocidos. Respeta `RN-CHECKOUT-02` (no afecta cotizaciones ya emitidas). Emite `EVT-DIS-001 PrecioSincronizado`. |
| **Actores** | DISTRIBUTOR |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-DIS-01 |
| **OPS de origen** | OPS-DIS-002 |
| **RN** | RN-DIST-01, RN-CHECKOUT-02 |
| **RNF** | — |
| **HU** | — _(ver OBS-005)_ |
| **UC** | UC-DIS-002 |
| **CA** | CA-DIS-002 |
| **TEST** | TEST-DIS-002 |

#### RF-DIS-003 — Sincronizar stock de productos

| Campo | Valor |
|---|---|
| **Objetivo** | Mantener el inventario disponible alineado con la realidad del distribuidor, complementando (no sustituyendo) la edición manual de RF-SEL-002. |
| **Descripción** | El sistema debe actualizar `Product.stock` para los SKUs incluidos en el batch. Dispara recalculo de badges en MOD-CAT-01 vía `AUTO-CAT-001`. Emite `EVT-DIS-002 StockSincronizado`. |
| **Actores** | DISTRIBUTOR |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-DIS-01 |
| **OPS de origen** | OPS-DIS-003 |
| **RN** | RN-DIST-01 |
| **RNF** | — |
| **HU** | — _(ver OBS-005)_ |
| **UC** | UC-DIS-002 (sub-flujo) |
| **CA** | CA-DIS-003 |
| **TEST** | TEST-DIS-003 |

#### RF-DIS-004 — Rechazar SKU desconocido en sincronización

| Campo | Valor |
|---|---|
| **Objetivo** | Prevenir que el DISTRIBUTOR cree productos nuevos sin pasar por el control de calidad/catálogo de ADMIN. |
| **Descripción** | Si un batch de sincronización incluye SKUs que no existen en el catálogo, el sistema debe rechazar solo esos SKUs (procesamiento parcial, no todo-o-nada), procesando el resto y respondiendo con 404 + detalle de SKUs rechazados. Emite `EVT-DIS-003 SincronizacionRechazada`. |
| **Actores** | DISTRIBUTOR (origina), sistema (rechaza) |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-DIS-01 |
| **OPS de origen** | OPS-DIS-004 |
| **RN** | RN-DIST-01 |
| **RNF** | — |
| **HU** | — _(ver OBS-005)_ |
| **UC** | UC-DIS-002 (flujo de excepción) |
| **CA** | CA-DIS-004 |
| **TEST** | TEST-DIS-004 |

---

### 5.10 Módulo Sistema Transversal (MOD-SYS-01)

#### RF-SYS-001 — Registro de auditoría transversal

| Campo | Valor |
|---|---|
| **Objetivo** | Garantizar trazabilidad completa de toda mutación de entidad en el sistema, condición esencial para gobernanza, seguridad y diagnóstico. |
| **Descripción** | El sistema debe registrar de forma inmutable en `AuditLog` toda operación mutante (cualquier `OPS-*` con efectos sobre entidades) con actor, acción, timestamp, IP, estado anterior y estado nuevo. Si el registro falla, la operación de negocio original **debe revertirse** (la invariante de auditoría completa tiene prioridad). Implementado como interceptor/middleware transversal. |
| **Actores** | sistema |
| **Prioridad** | MVP |
| **Módulo de origen** | MOD-SYS-01 |
| **OPS de origen** | AUTO-SYS-001 _(ver OBS-006 — derivado de AUTO porque MOD-SYS-01 no define OPS propias)_ |
| **RN** | — (opera sobre invariante de `AuditLog` ya definida en el Modelo de Dominio) |
| **RNF** | — |
| **HU** | — _(sistema sin actor humano)_ |
| **UC** | — _(módulo no define UC; ver OBS-006)_ |
| **CA** | CA-SYS-001 |
| **TEST** | TEST-SYS-001, TEST-SYS-002 |

#### RF-SYS-002 — Retención y purga de auditoría

| Campo                | Valor                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objetivo**         | Cumplir la política de retención de 12 meses sobre `AuditLog`, balanceando trazabilidad histórica con costo de almacenamiento.                                                                                                                                                                       |
| **Descripción**      | El sistema debe ejecutar periódicamente (cron mensual) una operación de anonimización sobre registros de `AuditLog` con `timestamp` mayor a 12 meses. Se anonimizan campos PII (ip, user_agent, actor_id) sin eliminación física. Operación de baja criticidad; un fallo no debe detener el sistema. |
| **Actores**          | sistema                                                                                                                                                                                                                                                                                              |
| **Prioridad**        | MVP+                                                                                                                                                                                                                                                                                                 |
| **Módulo de origen** | MOD-SYS-01                                                                                                                                                                                                                                                                                           |
| **OPS de origen**    | AUTO-SYS-003 _(ver OBS-006)_                                                                                                                                                                                                                                                                         |
| **RN**               | —                                                                                                                                                                                                                                                                                                    |
| **RNF**              | — _(política de retención mencionada en contexto original §9 como NFR)_                                                                                                                                                                                                                              |
| **HU**               | —                                                                                                                                                                                                                                                                                                    |
| **UC**               | —                                                                                                                                                                                                                                                                                                    |
| **CA**               | CA-SYS-002                                                                                                                                                                                                                                                                                           |
| **TEST**             | TEST-SYS-003                                                                                                                                                                                                                                                                                         |

---

## 6. Observaciones — inconsistencias detectadas durante la derivación

Las siguientes observaciones documentan inconsistencias o consideraciones identificadas durante la derivación de los RF. **Ninguna implica modificación de los módulos** (que son fuente de verdad congelada); todas se registran como anotaciones de trazabilidad para resolución futura en otra fase de SpecDD.

### OBS-001 — Conflicto de actor sobre umbral mínimo de stock

**Módulos involucrados:** MOD-SEL-01 (`OPS-SEL-003`), MOD-ADM-01 (`OPS-ADM-007`).

**Descripción:** MOD-SEL-01 asigna a SELLER la capacidad de configurar `stock_min_threshold` por producto. Sin embargo, el propio módulo señala explícitamente: _"en Sesión 1, `RN-CALC-03` asignó esta configuración a ADMIN; ver nota de diseño sobre conflicto de actor"_. En paralelo, MOD-ADM-01 (`OPS-ADM-007`) define que ADMIN configura parámetros del sistema incluyendo `default_stock_min_threshold` global.

**Lectura posible no-resuelta:** podrían coexistir como dos niveles (ADMIN fija el default global, SELLER lo sobreescribe por producto), pero el conflicto entre la `RN-CALC-03` original (que atribuía a ADMIN) y la asignación a SELLER en MOD-SEL-01 no está resuelto en ninguno de los dos módulos.

**Impacto en RFs derivados:** RF-SEL-003 y RF-ADM-007 documentan ambos la capacidad sin invalidarse mutuamente. La resolución corresponde a una sesión posterior de SpecDD.

### OBS-002 — Capacidad funcional compartida: descarga de PDF de cotización

**Módulos involucrados:** MOD-FU-01 (`OPS-FU-007`), MOD-COT-01 (`OPS-COT-003`).

**Descripción:** ambos OPS implementan la misma capacidad técnica subyacente (entregar el `pdf_url` persistido al solicitante) pero desde actores y contextos distintos (CUSTOMER en la vista cliente vs SELLER en la vista comercial).

**Decisión:** **no se consolida** en un único RF, porque:
- los IDs `RF-FU-007` y `RF-COT-003` ya están reservados por sus módulos respectivos;
- los módulos son fuente de verdad congelada y no deben modificarse;
- los actores y contextos de uso son distintos (incluso la pantalla de origen es distinta: SCR-FU-001 vs SCR-COT-002);
- la consolidación rompería la trazabilidad bidireccional OPS↔RF que el usuario solicitó preservar.

Se documenta la relación con referencias cruzadas en las descripciones de ambos RFs.

### OBS-003 — Colaboración entre módulos: reintento de pedido

**Módulos involucrados:** MOD-FU-01 (`OPS-FU-011`), MOD-CHK-01 (`OPS-CHK-008`).

**Descripción:** el flujo de reintento de pedido tras cancelación se distribuye entre dos módulos:
- MOD-CHK-01 contiene el botón de origen (`BTN-CHK-003`) y la lógica de cancelación;
- MOD-FU-01 contiene la operación que efectivamente muta el agregado `FormatoUnico` (transición `FU-T-14`).

`OPS-CHK-008` declara explícitamente: _"dispara `OPS-FU-011`"_. Son dos RFs distintos (RF-CHK-008 y RF-FU-011) que conjuntamente cubren el flujo completo.

**Impacto:** no es duplicación; es colaboración explícita por separación de responsabilidades (un módulo gestiona el botón y el Order, el otro gestiona la transición del FU). Se documenta para evitar interpretaciones erróneas en sesiones futuras de trazabilidad.

### OBS-004 — Capacidad ausente: ADMIN no puede forzar MFA en SELLER

**Módulo involucrado:** MOD-AUT-01 (`OPS-AUT-005`), MOD-SYS-01 (notas de cierre del Inventario).

**Descripción:** `OPS-AUT-005` documenta que el SELLER habilita su MFA voluntariamente. El cierre de MOD-SYS-01 señala como pendiente: _"capacidad de ADMIN para forzar MFA en SELLER"_, indicando que el contexto original no documenta esta capacidad.

**Impacto:** no existe OPS, y por tanto no existe RF, que permita a ADMIN obligar a un SELLER a habilitar MFA. Esto se preserva fielmente en RF-AUT-005 (capacidad solo del SELLER). La eventual incorporación correspondería a una sesión posterior de SpecDD que actualice MOD-AUT-01 o MOD-ADM-01.

### OBS-005 — Ausencia metodológica de HU en módulos sin actor humano

**Módulos involucrados:** MOD-DIS-01, MOD-SYS-01.

**Descripción:** ambos módulos declaran explícitamente que no documentan Historias de Usuario porque las HU, por definición ("Como [actor], quiero..."), no aplican naturalmente a un sistema externo automatizado (DISTRIBUTOR) o a procesos transversales sin actor humano (SYS).

**Impacto:** los RFs derivados (`RF-DIS-001` a `RF-DIS-004`, `RF-SYS-001`, `RF-SYS-002`) no tienen HU asociada. **Esto no es un vacío de trazabilidad sino una decisión metodológica consistente con los módulos de origen.** Se documenta explícitamente para que auditorías futuras no lo marquen como omisión accidental.

### OBS-006 — `MOD-SYS-01` no define OPS; los RFs derivan de AUTO

**Módulo involucrado:** MOD-SYS-01.

**Descripción:** el módulo declara explícitamente que no define OPS en sentido estricto (capacidad invocable por actor) y que su contenido se documenta como funcionalidades automáticas (AUTO). Adicionalmente, declara no tener UC porque "estas son funcionalidades de infraestructura transversal".

**Impacto:** RF-SYS-001 y RF-SYS-002 son los únicos RFs en este documento cuya derivación parte de un `AUTO-*` en lugar de un `OPS-*`, y son los únicos sin UC asociado. Se preserva fielmente lo declarado por el módulo.

### OBS-007 — Mayoría de RFs sin RNF asociado

**Descripción:** solo `OPS-CAT-001` y `OPS-CHK-004` mencionan explícitamente RNFs (ambos como _reservados_). El resto de OPS no tiene RNF.

**Impacto:** los RFs derivados reflejan fielmente esa ausencia. Esto sugiere que la sesión de derivación de Requisitos No Funcionales del sistema queda pendiente como entregable separado de SpecDD. Una vez generados los RNF, los enlaces RF↔RNF deberán completarse retroactivamente sin modificar este documento ni los módulos.

### OBS-008 — Catálogo de eventos extendido por módulos posteriores

**Módulos involucrados:** MOD-FU-01 (catálogo original `EVT-FU-001..011`), MOD-CON-01 (introduce `EVT-FU-012`).

**Descripción:** MOD-CON-01 introduce `EVT-FU-012 ConsultaResuelta` declarando que _"actualiza catálogo de MOD-FU-01"_. Esto es consistente porque el evento pertenece al agregado FormatoUnico aunque la operación que lo dispara viva en MOD-CON-01.

**Impacto:** no afecta la derivación de RFs (los RFs documentan los eventos que dispara la OPS de origen, sin pronunciarse sobre el agregado dueño del evento). Se documenta para que el catálogo global de eventos (que MOD-SYS-01 señala como pendiente de consolidación) refleje esta cross-reference correctamente.

---

## 7. Trazabilidad inversa — vista por actor

| Actor | RFs asociados |
|---|---|
| GUEST | RF-CAT-001, RF-CAT-002, RF-CAT-003, RF-FU-001, RF-FU-002, RF-FU-003, RF-FU-004, RF-FU-006, RF-FU-011, RF-CHK-001, RF-CHK-003, RF-CHK-005, RF-CHK-006, RF-CHK-008 |
| CUSTOMER | RF-CAT-001, RF-CAT-002, RF-CAT-003, RF-FU-001 a RF-FU-011, RF-CHK-001, RF-CHK-003, RF-CHK-005, RF-CHK-006, RF-CHK-008, RF-AUT-001, RF-AUT-006 |
| SELLER | RF-CAT-001, RF-CAT-002, RF-CON-001 a RF-CON-004, RF-COT-001 a RF-COT-003, RF-SEL-001 a RF-SEL-006, RF-AUT-002, RF-AUT-003, RF-AUT-004, RF-AUT-005, RF-AUT-006 |
| ADMIN | RF-CAT-001, RF-CAT-002, RF-ADM-001 a RF-ADM-008, RF-AUT-002, RF-AUT-003, RF-AUT-004, RF-AUT-006 |
| DISTRIBUTOR | RF-DIS-001, RF-DIS-002, RF-DIS-003, RF-DIS-004 |
| sistema (sin actor humano disparador) | RF-CHK-002, RF-CHK-004, RF-CHK-007, RF-SYS-001, RF-SYS-002 |

---

## 8. Control de cambios

| Versión | Fecha | Cambio | Estado |
|---|---|---|---|
| 1.0.0 | Día de derivación | Versión inicial derivada de los 10 módulos congelados del Inventario Funcional Maestro. 55 RFs documentados, 8 observaciones registradas. | Borrador (pendiente VoBo) |

---


## 🆕 EXTENSIONES v1.2 (14 Mejoras UI/UX e Integraciones)

> **Nota:** Los siguientes 28 RF complementan los 55 RF existentes. No reemplazan ni renumeran los anteriores.

---

###  MOD-SYS-01 (Sistema Transversal) — 5 RF Nuevos

**RF-SYS-001: Sistema de Diseño Global**
El sistema debe aplicar una paleta de colores consistente en toda la plataforma: primario Turquesa/Verde Esmeralda (#10B981), texto gris oscuro (#111827), metadatos gris claro (#9CA3AF), bordes gris ultra claro (#E5E7EB), estados semánticos (verde/rojo/naranja).
- **Actores afectados:** GUEST, CUSTOMER, SELLER, ADMIN
- **Módulo:** MOD-SYS-01

**RF-SYS-002: Header Persistente con Buscador Avanzado**
El sistema debe mostrar un header sticky con: Bloque superior (logo, buscador con selector de categoría, iconos de cuenta/carrito/notificaciones/favoritos) y Bloque inferior (menú HOME | CATÁLOGO | KITS | NOSOTROS | NOTICIAS).
- **Actores afectados:** GUEST, CUSTOMER, SELLER, ADMIN
- **Módulo:** MOD-SYS-01

**RF-SYS-003: Footer Persistente**
El sistema debe mostrar un footer con tema oscuro en todas las pantallas, conteniendo: redes sociales, contacto, información legal, trust signals (logos logística/pago), copyright.
- **Actores afectados:** GUEST, CUSTOMER, SELLER, ADMIN
- **Módulo:** MOD-SYS-01

**RF-SYS-004: Icono de Notificaciones FSM en Header**
El sistema debe mostrar un badge numérico en el icono de notificaciones del header con eventos FSM pendientes (cotización por expirar, respuesta de consulta, pedido confirmado).
- **Actores afectados:** CUSTOMER, SELLER, ADMIN
- **Módulo:** MOD-SYS-01

**RF-SYS-005: Icono de Favoritos en Header**
El sistema debe permitir a usuarios autenticados (CUSTOMER) acceder a su lista de productos favoritos desde el header.
- **Actores afectados:** CUSTOMER
- **Módulo:** MOD-SYS-01

---

###  MOD-CAT-01 (Catálogo) — 5 RF Nuevos

**RF-CAT-004: Landing Page (HOME-GUEST)**
El sistema debe mostrar una landing page con: hero image con efecto Bokeh, productos destacados (sin precio), cuadrícula de categorías con contadores, sección de novedades.
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-CAT-01

**RF-CAT-005: Exploración Intermedia de Categorías cuando se da click en catálogo**
El sistema debe mostrar una vista intermedia con cuadrícula de categorías y contadores dinámicos antes de ingresar al listado de productos, luego de dar click en la cabecera en "catálogo".
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-CAT-01

**RF-CAT-006: Gestión de Kits**
El sistema debe permitir al ADMIN crear Kits como agrupaciones lógicas de productos. El precio del Kit se calcula dinámicamente según los componentes. El stock del Kit es el mínimo de sus componentes. El ki debería mostrar una foto de referencia para dar una idea al cliente de lo que incluye el kit.
- **Actores afectados:** ADMIN (gestión), GUEST, CUSTOMER (visualización)
- **Módulo:** MOD-CAT-01

**RF-CAT-007: Favoritos de Productos**
El sistema debe permitir a usuarios CUSTOMER marcar productos como favoritos. La lista de favoritos es persistente y accesible desde el header.
- **Actores afectados:** CUSTOMER
- **Módulo:** MOD-CAT-01

**RF-CAT-008: Consulta Rápida por Telegram desde Catálogo**
El sistema debe mostrar un botón de Telegram en cada tarjeta de producto. Al hacer clic, abre t.me con mensaje pre-armado incluyendo SKU y nombre del producto.
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-CAT-01

**RF-CAT-009: Carrito flotante (Drawer) y notificación no intrusiva al agregar**

| Campo | Valor |
|---|---|
| **Objetivo** | Reducir la fricción de navegación al agregar productos al Formato Único, evitando forzar una redirección de página completa para ver el resumen del carrito. |
| **Descripción** | Al agregar un producto, el sistema debe mostrar una tarjeta flotante temporizada (Toast) confirmando la adición, con dos acciones: "Seguir buscando" (cierra la alerta) y "Ver proforma" (abre un Drawer lateral derecho con el resumen). El ícono del carrito en el Header debe mostrar un badge dinámico con la cantidad de ítems y, al pasar el cursor, un popover con el subtotal estimado; al hacer clic abre el mismo Drawer. El Drawer lista los ítems (nombre, SKU, cantidad editable, eliminar), el subtotal neto, y los botones "Comprar ahora" (→ `/checkout`) y "Gestionar Pedido" (→ `/formatos`). |
| **Actores** | GUEST, CUSTOMER |
| **Prioridad** | MVP+ |
| **Módulo de origen** | MOD-CAT-01 |
| **OPS de origen** | OPS-CAT-009 |
| **RN** | — |
| **RNF** | — |
| **HU** | HU-CAT-009 |
| **UC** | UC-CAT-009 |
| **CA** | CA-CAT-009 |
| **TEST** | TEST-CAT-009 |
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-CAT-01

---

###  MOD-FU-01 (Formato Único) — 8 RF Nuevos

**RF-FU-012: Dashboard del Customer (HOME-CUSTOMER)**
El sistema debe redirigir al Dashboard al hacer clic en HOME estando autenticado. El Dashboard muestra: panel de notificaciones, widget del Formato Único activo según estado FSM, accesos rápidos, cross-selling de novedades.
- **Actores afectados:** CUSTOMER
- **Módulo:** MOD-FU-01

**RF-FU-013: Carga Masiva por Excel**
El sistema debe permitir importar un archivo Excel/CSV con columnas SKU y Cantidad. Debe validar contra inventario en tiempo real, mostrar pre-visualización con errores, y permitir mapeo dinámico de columnas si el formato difiere de la plantilla.
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-FU-01

**RF-FU-014: Descarga de Plantilla Excel**
El sistema debe ofrecer un botón para descargar plantilla Excel estandarizada con columnas SKU y Cantidad.
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-FU-01

**RF-FU-015: Mapeo Dinámico de Columnas Excel**
Si el Excel del cliente tiene nombres de columnas distintos a la plantilla estándar, el sistema presenta un modal de "Mapeo de Columnas" donde el usuario indica qué columna corresponde a SKU y cuál a Cantidad.
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-FU-01

**RF-FU-016: Resolución Individual de Conflictos vía Telegram**
El sistema debe permitir consultar por Telegram productos sin stock desde el Formato Único, con payload pre-armado y modal de limpieza posterior.
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-FU-01

**RF-FU-017: Consulta Masiva (Bulk) vía Telegram**
Cuando hay más de un producto sin stock, el sistema genera un botón "Consultar [N] productos por Telegram" con mensaje concatenado.
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-FU-01

**RF-FU-018: Banners Dinámicos FSM en Formato Único**
El sistema debe mostrar banners condicionales según estado FSM: countdown amarillo (COTIZACIÓN), azul informativo (CONSULTA), rojo error (EXPIRADA).
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-FU-01

**RF-FU-019: Doble Validación de Importación Excel**
El sistema debe mostrar modal de resumen + resaltado inline en tabla (filas rojas para errores, naranjas para advertencias de stock).
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-FU-01

**RF-FU-020: Cancelar cotización vigente**

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir que el CUSTOMER retome la edición de su Formato Único sin esperar el vencimiento de 15 días de una cotización, cuando decide que necesita agregar o cambiar productos antes de comprar. |
| **Descripción** | El sistema debe permitir al CUSTOMER dueño cancelar voluntariamente un FU en estado `COTIZACIÓN` en cualquier momento antes de su vencimiento (`FU-T-15`). El FU vuelve a `BORRADOR` conservando los ítems; el precio congelado se libera (vuelve a ser dinámico, mismo criterio que la expiración automática `FU-T-10`) y el `pdf_url` se invalida. Distinto de `RF-FU-008` (regenerar cotización *expirada*): esta operación aplica sobre una cotización todavía *vigente*. |
| **Actores** | CUSTOMER (dueño exclusivo) |
| **Prioridad** | MVP+ |
| **Módulo de origen** | MOD-FU-01 |
| **OPS de origen** | OPS-FU-020 |
| **RN** | RN-FU-06 |
| **RNF** | RNF-SEC-001 (aislamiento por ownership) |
| **HU** | HU-FU-013 |
| **UC** | UC-FU-016 |
| **CA** | CA-FU-020 |
| **TEST** | TEST-FU-020 |
- **Actores afectados:** CUSTOMER
- **Módulo:** MOD-FU-01

---

### 💳 MOD-CHK-01 (Checkout) — 6 RF Nuevos

**RF-CHK-009: Captura de Datos de Facturación**
Antes del pago, el sistema debe capturar datos de facturación (Boleta DNI / Factura RUC) con auto-completado para usuarios autenticados.
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-CHK-01

**RF-CHK-010: Integración con Mercado Pago**
El sistema debe integrar Mercado Pago Checkout Pro o Bricks para procesar pagos. Debe enviar external_reference = ID del Formato Único y escuchar webhooks para sincronizar FSM.
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-CHK-01

**RF-CHK-011: Reserva Temporal de Inventario al Iniciar Pago**
El sistema debe reservar stock al transicionar de COTIZACIÓN a PEDIDO. La reserva se libera si no hay confirmación en 30 minutos.
- **Actores afectados:** SISTEMA (automático), SELLER (visualización de stock real)
- **Módulo:** MOD-CHK-01

**RF-CHK-012: Expiración de Reserva tras 30 Minutos**
Si el pago no se confirma en 30 minutos (AUTO-CHK-003), la reserva de stock se libera automáticamente y el Formato Único vuelve a COTIZACIÓN o pasa a CANCELADO.
- **Actores afectados:** SISTEMA (automático)
- **Módulo:** MOD-CHK-01

**RF-CHK-013: Pantalla de Confirmación Post-Pago**
El sistema debe mostrar pantalla de éxito (checkmark verde + número de orden + botón descargar comprobante) o rechazo (banner rojo + botón reintentar) según respuesta de Mercado Pago.
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-CHK-01

**RF-CHK-014: Webhook Mercado Pago con Mapeo de Estados FSM**
El webhook de Mercado Pago debe mapear estados: approved → CONFIRMADO, pending → mantiene PEDIDO, rejected/cancelled → CANCELADO + libera stock.
- **Actores afectados:** SISTEMA (automático)
- **Módulo:** MOD-CHK-01

---

### 🔐 MOD-AUT-01 (Autenticación) — 2 RF Nuevos

**RF-AUT-007: Migración GUEST → CUSTOMER**
Durante el checkout, el sistema debe ofrecer opción de migrar de GUEST a CUSTOMER fusionando automáticamente el Formato Único de sesión con el de la cuenta registrada.
- **Actores afectados:** GUEST, CUSTOMER
- **Módulo:** MOD-AUT-01

**RF-AUT-008: Auto-completado de Datos de Facturación**
Si el usuario es CUSTOMER (logueado), los datos de facturación (DNI/RUC, nombre, dirección) deben auto-completarse desde su perfil.
- **Actores afectados:** CUSTOMER
- **Módulo:** MOD-AUT-01

**RF-FU-021: Recompra desde historial (Widget de Recompra)**

| Campo | Valor |
|---|---|
| **Objetivo** | Acelerar el flujo de recompra recurrente del CUSTOMER B2B, reutilizando ítems de cotizaciones cerradas sin tener que reconstruir el pedido desde cero. |
| **Descripción** | El sistema debe presentar al CUSTOMER con historial (`hasHistory = true`) un widget con sus últimas 3 cotizaciones cerradas, ofreciendo dos acciones de carga: **"Reemplazar Borrador"** (`BTN-FU-008a`, vacía el borrador activo y copia los ítems de la cotización histórica con precios actuales del catálogo, con confirmación explícita por ser destructiva) y **"Combinar con Borrador"** (`BTN-FU-008b`, fusiona los ítems en el borrador activo sumando cantidades para productos repetidos en vez de duplicar filas). Ambas acciones omiten productos inactivos o sin stock sin fallar la operación completa. |
| **Actores** | CUSTOMER (requiere autenticación e historial) |
| **Prioridad** | MVP+ |
| **Módulo de origen** | MOD-FU-01 |
| **OPS de origen** | OPS-FU-021 |
| **RN** | RN-FU-09 |
| **RNF** | RNF-SEC-001 |
| **HU** | HU-FU-014 |
| **UC** | UC-FU-017 |
| **CA** | CA-FU-021 |
| **TEST** | TEST-FU-021 |
- **Actores afectados:** CUSTOMER
- **Módulo:** MOD-FU-01

---

**RF-AUT-009: Renovar sesión mediante refresh token**

| Campo | Valor |
|---|---|
| **Objetivo** | Evitar que el usuario deba volver a iniciar sesión cada 60 minutos (vigencia del access_token) mientras mantiene una sesión activa, sin comprometer la seguridad de una sesión de larga duración. |
| **Descripción** | El sistema debe emitir, junto con el access_token (JWT, 60 min) en cada login exitoso, un refresh_token opaco de larga duración (30 días) en cookie httpOnly separada, persistido hasheado (SHA-256) server-side. El sistema debe exponer un endpoint que, dado un refresh_token válido, emita un nuevo access_token y ROTE el refresh_token (revoca el usado, emite uno nuevo), de forma que la reutilización de un token ya rotado sea detectada y rechazada. El logout debe revocar el refresh_token server-side, no solo borrar la cookie del cliente. |
| **Actores** | CUSTOMER, SELLER, ADMIN |
| **Prioridad** | MVP+ |
| **Módulo de origen** | MOD-AUT-01 |
| **OPS de origen** | OPS-AUT-009 |
| **RN** | RN-AUT-004 |
| **RNF** | RNF-SEC-001 |
| **HU** | HU-AUT-007 |
| **UC** | UC-AUT-007 |
| **CA** | CA-AUT-009 |
| **TEST** | TEST-AUT-009 |
- **Actores afectados:** CUSTOMER, SELLER, ADMIN
- **Módulo:** MOD-AUT-01

---

### 👑 MOD-ADM-01 (Panel ADMIN) — 1 RF Nuevo

**RF-ADM-009: CRUD Completo de Kits**
El sistema debe permitir al ADMIN crear, editar, activar/desactivar Kits. Un Kit contiene múltiples productos componentes y su precio se calcula dinámicamente.
- **Actores afectados:** ADMIN
- **Módulo:** MOD-ADM-01

---

### 🏪 MOD-SEL-01 (Panel SELLER) — 1 RF Nuevo

**RF-SEL-007: Alertas de Productos sin Stock vía Telegram**
En la vista de Consultas, el SELLER debe tener un botón "Abrir chat en Telegram" si el cliente dejó su usuario. Además, el stock visible debe considerar reservas temporales (stock_real = stock_total - reserved_stock).
- **Actores afectados:** SELLER
- **Módulo:** MOD-SEL-01

