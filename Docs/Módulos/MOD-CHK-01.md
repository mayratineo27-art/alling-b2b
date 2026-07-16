## MOD-CHK-01 — Checkout y Pago

- **Objetivo:** Convertir un Formato Único en estado `PEDIDO` en una transacción de pago completada, capturando datos de envío/facturación e integrando con la pasarela de pago.
- **Actores:** GUEST, CUSTOMER
- **Procesos de negocio de origen:** 6.1, 6.2 (tramo final)
- **Integraciones:** MercadoPago (pasarela de pago). FSM de referencia: FSM-02 (Pedido); FSM-01 en `FU-T-04`, `FU-T-09`, `FU-T-14`

---

### Operaciones Funcionales (OPS)

#### `OPS-CHK-001` — Capturar datos de envío y facturación

- **Objetivo de negocio:** recolectar la información mínima necesaria para emitir un comprobante válido y ejecutar el envío físico
- **Actor:** GUEST, CUSTOMER
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** `FormatoUnico.state = PEDIDO`; `Order.status = PENDING_PAYMENT` (recién creado)
- **Entidades afectadas:** `Order` (completa `shipping_address`, `dni_or_ruc`, `document_type`)
- **Eventos de dominio:** ninguno propio
- **Pantallas:** `SCR-CHK-001`
- **Botones/acciones que la disparan:** `ACT-CHK-001`
- **Resultado esperado:** `Order` con datos de envío/facturación completos y válidos
- **Servicios de dominio involucrados:** `OrderService`, `ValidationService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CHK-001`, `RN-CHK-002`
- **RF relacionados:** `RF-CHK-001`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-CHK-001`
- **UC relacionados:** `UC-CHK-001`
- **CA relacionados:** `CA-CHK-001`
- **TEST relacionados:** `TEST-CHK-001`

#### `OPS-CHK-002` — Calcular costo de envío

- **Objetivo de negocio:** dar transparencia de costo total antes del pago, evitando abandono de checkout
- **Actor:** sistema (disparado por la acción del usuario al completar dirección)
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** `Order.status = PENDING_PAYMENT`
- **Entidades afectadas:** `Order` (actualiza `shipping_cost`, `total`)
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-CHK-001`
- **Botones/acciones que la disparan:** `ACT-CHK-002`
- **Resultado esperado:** `shipping_cost` calculado y reflejado en el resumen antes de confirmar pago
- **Servicios de dominio involucrados:** `ShippingService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-SHP-01`
- **RF relacionados:** `RF-CHK-002`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-CHK-002`
- **UC relacionados:** `UC-CHK-001` (sub-flujo)
- **CA relacionados:** `CA-CHK-002`
- **TEST relacionados:** `TEST-CHK-002`

#### `OPS-CHK-003` — Iniciar proceso de pago

- **Objetivo de negocio:** entregar el control transaccional a la pasarela de pago de forma segura
- **Actor:** GUEST, CUSTOMER
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** `Order.status = PENDING_PAYMENT` (se mantiene)
- **Entidades afectadas:** `Order` (registra preferencia de pago)
- **Eventos de dominio:** `EVT-CHK-001` (`PagoIniciado`)
- **Pantallas:** `SCR-CHK-001` → MercadoPago (externo)
- **Botones/acciones que la disparan:** `BTN-CHK-001`
- **Resultado esperado:** usuario dirigido a la interfaz de pago con datos correctos de monto y referencia
- **Servicios de dominio involucrados:** `PaymentService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CHK-003`
- **RF relacionados:** `RF-CHK-003`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-CHK-003`
- **UC relacionados:** `UC-CHK-002`
- **CA relacionados:** `CA-CHK-003`
- **TEST relacionados:** `TEST-CHK-003`

#### `OPS-CHK-004` — Confirmar pago (webhook)

- **Objetivo de negocio:** garantizar que el sistema reconoce de forma fiable y única un pago real, evitando duplicados o fraude por replay
- **Actor:** sistema (MercadoPago como actor externo disparador)
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** `PENDING_PAYMENT → PAID` (`ORD-T-02`); `PEDIDO → CONFIRMADO` (`FU-T-12`)
- **Entidades afectadas:** `Order` (cambia `status`, fija `payment_method`), `PaymentIdempotencyKey` (crea), `FormatoUnico` (cambia `state`)
- **Eventos de dominio:** `EVT-CHK-002` (`PagoConfirmado`)
- **Pantallas:** ninguna (server-to-server); resultado visible en `SCR-CHK-002`
- **Botones/acciones que la disparan:** ninguno (webhook; ver `AUTO-CHK-001`)
- **Resultado esperado:** `Order` en `PAID`; FU en `CONFIRMADO`; email encolado
- **Servicios de dominio involucrados:** `PaymentService`, `IdempotencyService`, `StateMachineService`, `NotificationService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CHK-004`, `RN-CHK-005`
- **RF relacionados:** `RF-CHK-004`
- **RNF relacionados:** `RNF-CHK-001` _(nueva referencia reservada: tiempo máximo de procesamiento del webhook, relevante para experiencia de confirmación)_
- **HU relacionadas:** `HU-CHK-004`
- **UC relacionados:** `UC-CHK-003`
- **CA relacionados:** `CA-CHK-004`
- **TEST relacionados:** `TEST-CHK-004`

#### `OPS-CHK-005` — Manejar pago fallido o cancelado

- **Objetivo de negocio:** liberar el FU del estado bloqueado `PEDIDO` cuando el pago no se concreta, permitiendo reintentar (vía `OPS-FU-011`) sin perder la intención de compra
- **Actor:** sistema (MercadoPago) o CUSTOMER/GUEST
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** `PENDING_PAYMENT → CANCELLED` (`ORD-T-03`); `PEDIDO → CANCELADO` (`FU-T-13`)
- **Entidades afectadas:** `Order` (cambia `status`, registra `cancellation_reason`), `FormatoUnico` (cambia `state`)
- **Eventos de dominio:** `EVT-CHK-003` (`PagoFallido`)
- **Pantallas:** `SCR-CHK-003`
- **Botones/acciones que la disparan:** `BTN-CHK-002`, webhook de fallo (`AUTO-CHK-002`)
- **Resultado esperado:** Order y FU en estado de fallo, no terminal (puede reintentarse vía `FU-T-14`/`OPS-FU-011`)
- **Servicios de dominio involucrados:** `PaymentService`, `StateMachineService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CHK-006`
- **RF relacionados:** `RF-CHK-005`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-CHK-005`
- **UC relacionados:** `UC-CHK-004`
- **CA relacionados:** `CA-CHK-005`
- **TEST relacionados:** `TEST-CHK-005`

#### `OPS-CHK-006` — Consultar confirmación de pedido

- **Objetivo de negocio:** dar certeza al comprador de que su compra fue exitosa, reduciendo ansiedad post-compra y contactos de soporte
- **Actor:** GUEST (vía `orderToken`), CUSTOMER
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** ninguno (lectura sobre cualquier estado de `Order`)
- **Entidades afectadas:** ninguna
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-CHK-002`
- **Botones/acciones que la disparan:** acceso directo vía URL con `orderToken`
- **Resultado esperado:** detalle del pedido visible con estado actual
- **Servicios de dominio involucrados:** `OrderService`, `TokenService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CHK-007`
- **RF relacionados:** `RF-CHK-006`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-CHK-006`
- **UC relacionados:** `UC-CHK-005`
- **CA relacionados:** `CA-CHK-006`
- **TEST relacionados:** `TEST-CHK-006`

#### `OPS-CHK-007` — Enviar email de confirmación

- **Objetivo de negocio:** entregar comprobante y certeza transaccional fuera del sistema, en un canal persistente
- **Actor:** sistema
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** disparado tras `ORD-T-02`
- **Entidades afectadas:** ninguna directa
- **Eventos de dominio:** `EVT-CHK-004` (`EmailConfirmacionEnviado`)
- **Pantallas:** ninguna
- **Botones/acciones que la disparan:** ninguno (consecuencia automática)
- **Resultado esperado:** email entregado con detalle del pedido y/o `orderToken`
- **Servicios de dominio involucrados:** `NotificationService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CHK-008`
- **RF relacionados:** `RF-CHK-007`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-CHK-007`
- **UC relacionados:** `UC-CHK-003` (sub-flujo)
- **CA relacionados:** `CA-CHK-007`
- **TEST relacionados:** `TEST-CHK-007`

#### `OPS-CHK-008` — Cancelar/reintentar pedido manualmente

- **Objetivo de negocio:** dar control al comprador para abortar una compra antes de la confirmación, y luego permitir reintento conservando la intención de compra
- **Actor:** CUSTOMER, GUEST (vía `orderToken`)
- **Proceso de negocio de origen:** 6.1, 6.2 (cancelación inferida; reintento decidido explícitamente durante esta fase)
- **Estados de FSM involucrados:** `PENDING_PAYMENT → CANCELLED` (`ORD-T-03`); `CANCELADO → BORRADOR` (`FU-T-14`, ejecutada vía `OPS-FU-011`)
- **Entidades afectadas:** `Order` (cambia `status`, `cancelled_by`, `cancellation_reason`)
- **Eventos de dominio:** `EVT-CHK-003` (variante manual)
- **Pantallas:** `SCR-CHK-002` (cancelación), `SCR-CHK-003` (reintento)
- **Botones/acciones que la disparan:** `BTN-CHK-002` (cancelar), `BTN-CHK-003` (reintentar, dispara `OPS-FU-011`)
- **Resultado esperado:** Order cancelado; FU liberado; reintento disponible sin pérdida de ítems
- **Servicios de dominio involucrados:** `OrderService`, `StateMachineService`
- **Prioridad funcional:** MVP _(reclasificado desde MVP+ en la sesión de resolución de `FU-T-14`, dado que sin reintento un fallo de pago es un callejón sin salida)_
- **RN relacionadas:** `RN-CHK-009`, `RN-CHK-010`
- **RF relacionados:** `RF-CHK-008`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-CHK-008`
- **UC relacionados:** `UC-CHK-004`
- **CA relacionados:** `CA-CHK-008`
- **TEST relacionados:** `TEST-CHK-008`

---

### Pantallas (SCR)

#### `SCR-CHK-001` — Checkout (`/checkout`)

- **Propósito:** capturar datos de envío/facturación e iniciar el pago
- **Objetivo de negocio:** ser el último paso de fricción antes de la conversión
- **Valor para el usuario:** proceso claro y corto para completar la compra
- **Valor para el negocio:** tasa de conversión final del funnel
- **Actores autorizados:** GUEST (con FU propio en `PEDIDO`), CUSTOMER
- **Estados:** con datos, cargando, error de validación
- **Permisos:** el `Order` debe pertenecer al actor
- **Dependencias con otras pantallas:** recibe control desde `SCR-FU-001`; entrega control a MercadoPago; retorna a `SCR-CHK-002` o `SCR-CHK-003`
- **Navegación de entrada:** `NAV-CHK-001`
- **Navegación de salida:** `NAV-CHK-002`, `NAV-CHK-003`

#### `SCR-CHK-002` — Confirmación de pedido (`/checkout/confirmacion/[orderToken]`)

- **Propósito:** mostrar el estado final del pedido tras el intento de pago
- **Objetivo de negocio:** cerrar el ciclo de confianza transaccional
- **Valor para el usuario:** certeza inmediata del resultado de su compra
- **Valor para el negocio:** reduce carga operativa de soporte
- **Actores autorizados:** GUEST (vía `orderToken`), CUSTOMER (vía sesión)
- **Estados:** pago confirmado, pago pendiente, pago fallido (redirige a `SCR-CHK-003`)
- **Permisos:** `orderToken` válido o sesión del owner
- **Dependencias con otras pantallas:** depende de `OPS-CHK-004`; enlaza a `SCR-FU-002` para CUSTOMER
- **Navegación de entrada:** `NAV-CHK-003`
- **Navegación de salida:** `NAV-CHK-004`

#### `SCR-CHK-003` — Pago fallido/cancelado (`/checkout/error`)

- **Propósito:** informar el fallo y ofrecer reintento
- **Objetivo de negocio:** recuperar ventas que de otro modo se perderían por fricción de pago
- **Valor para el usuario:** claridad sobre qué ocurrió y cómo proceder
- **Valor para el negocio:** recuperación de carritos abandonados por fallo de pago
- **Actores autorizados:** GUEST, CUSTOMER
- **Estados:** fallo de pago, cancelado por usuario, timeout
- **Permisos:** igual que `SCR-CHK-002`
- **Dependencias con otras pantallas:** retorna a `SCR-FU-001` vía `OPS-FU-011` (resuelto; el FU vuelve a `BORRADOR` con ítems preservados)
- **Navegación de entrada:** `NAV-CHK-005`
- **Navegación de salida:** `NAV-CHK-006`

---

### Componentes (CMP)

**`SCR-CHK-001`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-CHK-001`|Formulario de contacto|Captura email (GUEST)|—|`email`|`OPS-CHK-001`|
|`CMP-CHK-002`|Formulario de documento|Captura DNI/RUC|—|`dni_or_ruc`, `document_type`|`OPS-CHK-001`|
|`CMP-CHK-003`|Formulario de dirección|Captura dirección de envío|—|`shipping_address`|`OPS-CHK-001`, `OPS-CHK-002`|
|`CMP-CHK-004`|Selector de método de envío|Si hay más de una opción Shalom|opciones disponibles|método seleccionado|`OPS-CHK-002`|
|`CMP-CHK-005`|Resumen del pedido|Muestra ítems, subtotal, IGV, envío, total|`FormatoUnico.items`, `Order` parcial|—|`CMP-CHK-003`|
|`CMP-CHK-006`|Indicador de carga|Feedback durante cálculo/inicio de pago|estado de operación|—|—|
|`CMP-CHK-007`|Mensajes de validación inline|Feedback de errores de formulario|resultado de validación|—|`CMP-CHK-001..003`|

**`SCR-CHK-002`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-CHK-008`|Detalle de pedido|Muestra ítems, totales, dirección|`Order` completo|—|—|
|`CMP-CHK-009`|Indicador de estado de pago|Comunica `PAID`/`PENDING_PAYMENT`|`Order.status`|—|—|
|`CMP-CHK-010`|Banner de seguimiento|Información de envío|`ShippingGuide` (si existe)|—|—|

**`SCR-CHK-003`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-CHK-011`|Mensaje de error de pago|Comunica motivo del fallo|`Order.cancellation_reason`|—|—|
|`CMP-CHK-012`|Botón de reintento|Ver `BTN-CHK-003`|—|—|—|

---

### Botones (BTN)

#### `BTN-CHK-001` — "Pagar ahora"

- Pantalla: `SCR-CHK-001` | Actor: GUEST/CUSTOMER | Estado: formulario completo y válido
- Operación funcional: `OPS-CHK-003` | Proceso de origen: 6.1, 6.2
- Precondiciones: todos los campos de `OPS-CHK-001` válidos; `shipping_cost` calculado
- Postcondiciones: preferencia de pago creada; usuario redirigido
- Errores posibles: `502` (MercadoPago no responde); `422` (campo inválido server-side)
- Excepciones: ninguna | Restricciones: `RN-CHK-003`
- Impacto en la FSM: ninguno directo | Eventos generados: `EVT-CHK-001`
- Confirmación: no | Mensaje: ninguno (redirección) | Navegación posterior: `NAV-CHK-002` | Permisos: owner del Order

#### `BTN-CHK-002` — "Cancelar pedido"

- Pantalla: `SCR-CHK-002` (mientras `PENDING_PAYMENT`) | Actor: GUEST/CUSTOMER | Estado: `PENDING_PAYMENT`
- Operación funcional: `OPS-CHK-008` | Proceso de origen: 6.1, 6.2
- Precondiciones: `Order.status = PENDING_PAYMENT`
- Postcondiciones: `Order.status = CANCELLED`; `FU.state = CANCELADO`
- Errores posibles: `409` si el webhook ya confirmó el pago (condición de carrera)
- Excepciones: prevalece el pago confirmado; se notifica que el pago ya fue procesado
- Restricciones: solo aplicable en `PENDING_PAYMENT`
- Impacto en la FSM: ejecuta `ORD-T-03` y `FU-T-13` | Eventos generados: `EVT-CHK-003`
- Confirmación: sí ("¿Cancelar este pedido?") | Mensaje: confirmación | Navegación posterior: ninguna o a `SCR-FU-002` | Permisos: owner

#### `BTN-CHK-003` — "Reintentar pago"

- Pantalla: `SCR-CHK-003` | Actor: GUEST/CUSTOMER | Estado: `Order.status = CANCELLED`
- Operación funcional: `OPS-CHK-008` (dispara `OPS-FU-011`, que ejecuta la mutación real sobre `FormatoUnico` en `MOD-FU-01`)
- Proceso de negocio de origen: 6.1, 6.2
- Precondiciones: `Order.status = CANCELLED`; el `FormatoUnico` asociado existe
- Postcondiciones: `FormatoUnico.state = BORRADOR`; ítems preservados; usuario aterriza en `SCR-FU-001`
- Errores posibles: ninguno esperado
- Excepciones: ninguna | Restricciones: `RN-CHK-010`
- Impacto en la FSM: ejecuta `FU-T-14` | Eventos generados: `EVT-FU-011`
- Confirmación: no | Mensaje: "Puedes revisar tu lista antes de intentar el pago nuevamente" | Navegación posterior: `NAV-CHK-006` | Permisos: owner

---

### Acciones (ACT)

|ID|Acción|Pantalla|Actor|Operación asociada|Resultado|
|---|---|---|---|---|---|
|`ACT-CHK-001`|Completar campos del formulario|`SCR-CHK-001`|GUEST/CUSTOMER|`OPS-CHK-001`|Datos capturados, validación inline|
|`ACT-CHK-002`|Completar/cambiar dirección|`SCR-CHK-001`|GUEST/CUSTOMER|`OPS-CHK-002`|Recalcula `shipping_cost`|

---

### Navegación (NAV)

|ID|Desde|Hacia|Disparador|Flujo|Condición de entrada|Permisos|Bloqueado si|
|---|---|---|---|---|---|---|---|
|`NAV-CHK-001`|`SCR-FU-001`|`SCR-CHK-001`|`BTN-FU-005`|Principal|FU transicionado a `PEDIDO`|owner|Stock insuficiente|
|`NAV-CHK-002`|`SCR-CHK-001`|MercadoPago (externo)|`BTN-CHK-001`|Principal|Formulario válido|owner|Formulario inválido|
|`NAV-CHK-003`|MercadoPago (externo)|`SCR-CHK-002`|Retorno de MercadoPago|Principal|—|owner/`orderToken`|—|
|`NAV-CHK-004`|`SCR-CHK-002`|`SCR-FU-002`|Click en "Ver mis pedidos"|Alternativo|Sesión CUSTOMER|CUSTOMER|GUEST|
|`NAV-CHK-005`|MercadoPago (externo)|`SCR-CHK-003`|Retorno con estado de fallo|Alternativo|—|owner/`orderToken`|—|
|`NAV-CHK-006`|`SCR-CHK-003`|`SCR-FU-001`|`BTN-CHK-003`|Alternativo (recuperación)|`Order.status = CANCELLED`|owner|FU eliminado o `guest_token` expirado|

---

### Funcionalidades Automáticas (AUTO)

#### `AUTO-CHK-001` — Procesamiento de webhook de pago exitoso

- **Evento disparador:** notificación HTTP POST de MercadoPago con `status=approved`
- **Responsable:** `PaymentService` + `IdempotencyService`
- **Condiciones de ejecución:** firma válida; `event_id` no procesado previamente
- **Resultado esperado:** ejecuta `OPS-CHK-004` completa
- **Manejo de errores:** firma inválida → `401`, registro en `AuditLog`; `event_id` repetido → `200` sin reprocesar

#### `AUTO-CHK-002` — Procesamiento de webhook de pago fallido

- **Evento disparador:** notificación HTTP POST con `status=rejected`/`cancelled`
- **Responsable:** `PaymentService`
- **Condiciones de ejecución:** firma válida
- **Resultado esperado:** ejecuta `OPS-CHK-005`
- **Manejo de errores:** igual tratamiento de firma que `AUTO-CHK-001`

#### `AUTO-CHK-003` — Timeout de pago pendiente

- **Evento disparador:** scheduler (consolidado vía `AUTO-SYS-002`)
- **Responsable:** sistema (job programado)
- **Condiciones de ejecución:** `Order.status = PENDING_PAYMENT AND created_at < now - 30min`
- **Resultado esperado:** ejecuta `OPS-CHK-005` (cancelación por timeout)
- **Manejo de errores:** idempotente

#### `AUTO-CHK-004` — Envío de email de confirmación

- **Evento disparador:** éxito de `OPS-CHK-004`
- **Responsable:** `NotificationService`
- **Condiciones de ejecución:** `Order.status = PAID`
- **Resultado esperado:** ejecuta `OPS-CHK-007`
- **Manejo de errores:** reintenta hasta 3 veces con backoff; fallo de email no revierte la confirmación de pago

---

### Eventos de Dominio (EVT)

|ID|Evento|Disparado por|
|---|---|---|
|`EVT-CHK-001`|`PagoIniciado`|`OPS-CHK-003`|
|`EVT-CHK-002`|`PagoConfirmado`|`OPS-CHK-004`|
|`EVT-CHK-003`|`PagoFallido`|`OPS-CHK-005`, `OPS-CHK-008`|
|`EVT-CHK-004`|`EmailConfirmacionEnviado`|`OPS-CHK-007`|

---

### Reglas de Negocio relacionadas (RN)

`RN-CHK-001` a `RN-CHK-010`, `RN-SHP-01`

### Requisitos Funcionales relacionados (RF)

`RF-CHK-001` a `RF-CHK-008`

### Requisitos No Funcionales relacionados (RNF)

`RNF-CHK-001`

### Historias de Usuario relacionadas (HU)

`HU-CHK-001` a `HU-CHK-008`

### Casos de Uso relacionados (UC)

`UC-CHK-001` a `UC-CHK-005`

### Criterios de Aceptación relacionados (CA)

`CA-CHK-001` a `CA-CHK-008`

### Casos de Prueba relacionados (TEST)

`TEST-CHK-001` a `TEST-CHK-008`

---

### Notas de diseño y decisiones del módulo

**Reclasificación de prioridad de `OPS-CHK-008`:** originalmente documentada como MVP+ por ser una inferencia no explícita en el contexto; tras la decisión de incorporar `FU-T-14` (CANCELADO ya no terminal), se reclasifica a MVP, porque sin esta capacidad el reintento de pago no tendría ningún camino, dejando al usuario sin salida tras un fallo.

**`BTN-CHK-003` ejecuta una operación cuya lógica de dominio vive en otro módulo:** se documenta explícitamente esta relación cross-módulo (ver nota equivalente en `MOD-FU-01`), consistente con el principio de que una OPS pertenece al agregado que muta, no a la pantalla que la dispara.

---

### Impacto en documentos globales

- **Modelo de Dominio:** confirma (no introduce de nuevo) el cambio de cardinalidad `FormatoUnico 1 — N Order` y el renombrado `order_id → current_order_id`, ya señalados como pendientes desde la sesión original de este módulo. Esta normalización no agrega pendientes nuevos.
- **FSM:** confirma la incorporación de `FU-T-14`, ya reflejada en el documento global de FSM desde la sesión correspondiente.
- **Arquitectura:** sin cambios nuevos.
- **Base de Datos:** confirma el pendiente ya señalado (índice sobre `Order.formato_unico_id`, invariante de "máximo un Order vivo por FU").
- **Decisiones Técnicas:** sin cambios nuevos.
- **Catálogo Global de Eventos:** sin pendientes nuevos; todos los eventos de este módulo (`EVT-CHK-001` a `EVT-CHK-004`) ya estaban documentados desde la sesión original.
---
## 🆕 EXTENSIONES v1.2 (Mejoras UI/UX e Integraciones)

### 📋 Nuevos Requisitos Funcionales
- **RF-CHK-009:** Captura de datos de facturación (Boleta DNI / Factura RUC)
- **RF-CHK-010:** Integración con Mercado Pago (Checkout Pro/Bricks)
- **RF-CHK-011:** Reserva temporal de inventario al iniciar pago
- **RF-CHK-012:** Expiración de reserva tras 30 minutos
- **RF-CHK-013:** Pantalla de confirmación post-pago (éxito/rechazo)
- **RF-CHK-014:** Webhook Mercado Pago con mapeo de estados FSM

### 🖼️ Nueva Pantalla (SCR-*)

**SCR-CHK-002: Confirmación Post-Pago**
- **Propósito:** Mostrar resultado del pago tras redirección desde Mercado Pago
- **Permisos:** GUEST, CUSTOMER
- **Estados:**
  - **Éxito:** Checkmark verde + número de orden + botón descargar comprobante
  - **Rechazo:** Banner rojo + mensaje de error + botón "Reintentar pago"
- **Componentes:**
  - CMP-CHK-008: Banner de estado (éxito/error)
  - CMP-CHK-009: Resumen de orden (productos, totales)
  - CMP-CHK-010: Botón de descarga de comprobante
  - CMP-CHK-011: Botón de reintento de pago

### 🔧 Nuevos Componentes (CMP-*)

**CMP-CHK-008: Selector de Tipo de Comprobante**
- Radio buttons: "Boleta de Venta" / "Factura Electrónica"
- Si Boleta: Input DNI (8 dígitos)
- Si Factura: Input RUC (11 dígitos) + Razón Social
- Auto-completado si CUSTOMER (RF-AUT-008)

**CMP-CHK-009: Widget de Mercado Pago**
- Checkout Pro: Redirección a MP
- Checkout Bricks: Formulario integrado (tarjeta, Yape, PagoEfectivo)
- Muestra total exacto (subtotal + IGV + envío)

**CMP-CHK-010: Banner de Reserva de Stock**
- Se muestra al iniciar pago
- Texto: "Stock reservado por 30 minutos. Complete el pago antes de que expire."
- Countdown: 30:00 → 00:00

**CMP-CHK-011: Checkmark de Éxito**
- Icono grande verde (#10B981)
- Animación de entrada
- Texto: "¡Pago confirmado!"
- Número de orden: #ORD-XXXXX

**CMP-CHK-012: Banner de Error de Pago**
- Icono rojo (#EF4444)
- Texto: "El pago fue rechazado"
- Mensaje específico: "Tarjeta insuficiente", "Tarjeta expirada", etc.
- Botón "Reintentar con otro método"

### 🔘 Nuevos Botones (BTN-*)

**BTN-CHK-004: Iniciar Pago con Mercado Pago**
- **Acción:** POST /checkout/pay
- **Precondición:** Datos de facturación válidos
- **Postcondición:** 
  - Formato Único: COTIZACIÓN → PEDIDO
  - Stock: reserved_stock += quantity
  - Redirección a Mercado Pago
- **Permiso:** GUEST, CUSTOMER

**BTN-CHK-005: Reintentar Pago**
- **Acción:** POST /checkout/pay/retry
- **Precondición:** Order en estado PEDIDO
- **Postcondición:** Nueva redirección a MP
- **Permiso:** GUEST, CUSTOMER

**BTN-CHK-006: Descargar Comprobante**
- **Acción:** GET /orders/{id}/receipt.pdf
- **Permiso:** GUEST (con token), CUSTOMER

**BTN-CHK-007: Ir a Mis Pedidos**
- **Acción:** Navega a SCR-CHK-003 (historial de pedidos)
- **Permiso:** CUSTOMER

### 📜 Nuevas Reglas de Negocio

**RN-STOCK-02:** Reserva de stock al transicionar COTIZACIÓN → PEDIDO
**RN-STOCK-03:** Liberación de reserva tras 30 min sin confirmación
**RN-MP-01:** external_reference = ID del Formato Único
**RN-MP-02:** Validación HMAC en webhooks de MP
**RN-MP-03:** Mapeo de estados MP → FSM:
  - approved → PEDIDO → CONFIRMADO
  - pending → mantiene PEDIDO
  - rejected/cancelled → PEDIDO → CANCELADO + libera stock

### 🔄 Impacto en Actores

**GUEST:**
- ✅ Ingresa datos de facturación manualmente
- ✅ Paga con Mercado Pago
- ✅ Recibe email de confirmación
- ⚠️ Sin cuenta: no puede descargar comprobante después (debe guardar PDF)

**CUSTOMER:**
- ✅ Datos de facturación auto-completados
- ✅ Historial de pedidos en Dashboard
- ✅ Descarga de comprobantes desde historial

**SELLER:**
- ✅ Ve pedidos en READY_TO_SHIP tras confirmación de pago
- ⚠️ Debe ver stock_real = stock_total - reserved_stock

**ADMIN:**
- ✅ Ve métricas de pagos exitosos vs rechazados
- ✅ Configura credenciales de MP en .env (NO en BD)

### 🔗 Nuevas Navegaciones (NAV-*)

**NAV-CHK-006:** SCR-FU-001 → SCR-CHK-001 (Checkout)
**NAV-CHK-007:** SCR-CHK-001 → Mercado Pago (redirección externa)
**NAV-CHK-008:** Mercado Pago → SCR-CHK-002 (confirmación)
**NAV-CHK-009:** SCR-CHK-002 → SCR-CHK-003 (mis pedidos, si CUSTOMER)