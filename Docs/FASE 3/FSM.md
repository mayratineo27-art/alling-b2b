# MÁQUINA DE ESTADOS FINITOS (FSM) — Sistema Alling

|Campo|Valor|
|---|---|
|**ID Documento**|DOC_ALLING_FSM_001|
|**Versión**|1.0.0|
|**Estado**|Borrador (pendiente VoBo)|
|**Fuente de verdad**|Inventario Funcional Maestro (10 módulos normalizados), específicamente MOD-FU-01 y MOD-CHK-01|
|**Metodología**|Spec-Driven Development (SpecDD) + Domain-Driven Design (DDD)|
|**Fecha**|30 de junio de 2026|

---

## 1. Introducción

Este documento consolida las **Máquinas de Estados Finitos (FSM)** del sistema Alling, derivadas **exclusivamente** de los módulos del Inventario Funcional Maestro. Se documentan dos FSM independientes pero relacionadas:

- **FSM-01**: Ciclo de vida del `FormatoUnico` (contenedor central de intención de compra/consulta/cotización)
- **FSM-02**: Ciclo de vida del `Order` (transacción comercial formal)

**Principios de derivación:**

1. **No invención**: Solo se documentan estados y transiciones explícitamente mencionados en los módulos.
2. **Trazabilidad**: Cada transición cita la operación funcional (OPS) que la ejecuta.
3. **Consistencia**: Las restricciones y reglas de negocio (RN) citadas son las ya definidas en los módulos.
4. **Vacíos documentados**: Las transiciones inferibles pero no documentadas se registran en la sección de vacíos, no se completan arbitrariamente.

---

## 2. FSM-01: Formato Único

### 2.1 Descripción

La FSM-01 gobierna el ciclo de vida del agregado `FormatoUnico`, desde su creación hasta su conversión en pedido, consulta, cotización o cancelación. Es el núcleo del diferenciador comercial de Alling.

**Agregado raíz**: `FormatoUnico` (MOD-FU-01) **Módulos que consumen**: MOD-FU-01, MOD-CHK-01, MOD-CON-01, MOD-COT-01, MOD-SEL-01, MOD-AUT-01

---

### 2.2 Estados de FSM-01

#### Estado: `BORRADOR`

|Campo|Valor|
|---|---|
|**Nombre**|BORRADOR|
|**Significado**|Estado inicial editable. El usuario puede agregar, modificar o eliminar ítems libremente.|
|**Estado inicial**|✅ Sí (estado de entrada tras FU-T-01)|
|**Estado final**|❌ No|
|**Actores autorizados**|GUEST (vía `guest_token`), CUSTOMER (vía `owner_id`)|
|**Operaciones ejecutables**|`OPS-FU-001` (editar cantidad), `OPS-FU-002` (eliminar ítem), `OPS-FU-003` (vaciar FU), `OPS-FU-004` (solicitar consulta), `OPS-FU-005` (generar cotización), `OPS-FU-006` (iniciar checkout)|
|**Eventos generados**|`EVT-FU-002` (ItemActualizado/ItemEliminado), `EVT-FU-003` (ConsultaIniciada), `EVT-FU-004` (CotizacionGenerada), `EVT-FU-005` (PedidoIniciado)|
|**Restricciones**|GUEST solo puede tener 1 FU en BORRADOR (RN-GUEST-01). Ítems deben tener stock suficiente.|

---

#### Estado: `CONSULTA`

|Campo|Valor|
|---|---|
|**Nombre**|CONSULTA|
|**Significado**|FU enviado a cola de SELLER para asesoría pre-venta. Solo lectura para el cliente.|
|**Estado inicial**|No|
|**Estado final**|❌ No|
|**Actores autorizados**|GUEST/CUSTOMER (lectura), SELLER (asignación y respuesta)|
|**Operaciones ejecutables**|`OPS-CON-002` (tomar consulta), `OPS-CON-003` (responder consulta)|
|**Eventos generados**|`EVT-CON-001` (ConsultaAsignada), `EVT-FU-012` (ConsultaResuelta)|
|**Restricciones**|Solo el SELLER asignado puede responder (RN-CON-002). Asignación manual, sin round-robin (RN-CONSULTA-ASSIGN-01).|

---

#### Estado: `RESUELTA`

|Campo|Valor|
|---|---|
|**Nombre**|RESUELTA|
|**Significado**|Consulta respondida por SELLER. Cliente puede decidir convertir a cotización o descartar.|
|**Estado inicial**|❌ No|
|**Estado final**|❌ No|
|**Actores autorizados**|CUSTOMER (lectura y transición), SELLER (lectura)|
|**Operaciones ejecutables**|`OPS-FU-005` (generar cotización desde RESUELTA)|
|**Eventos generados**|`EVT-FU-004` (CotizacionGenerada)|
|**Restricciones**|Solo CUSTOMER puede transicionar. Requiere autenticación.|

---

#### Estado: `COTIZACIÓN`

|Campo|Valor|
|---|---|
|**Nombre**|COTIZACIÓN|
|**Significado**|Propuesta comercial formal con precios fijados y vigencia de 15 días. PDF generado.|
|**Estado inicial**|❌ No|
|**Estado final**|❌ No|
|**Actores autorizados**|CUSTOMER (lectura, descarga PDF, transición a PEDIDO, cancelación voluntaria), SELLER (lectura, seguimiento)|
|**Operaciones ejecutables**|`OPS-FU-006` (iniciar checkout), `OPS-FU-007` (descargar PDF), `OPS-FU-020` (cancelar cotización vigente), `OPS-COT-001/002/003` (vista SELLER)|
|**Eventos generados**|`EVT-FU-005` (PedidoIniciado), `EVT-FU-006` (CotizacionExpirada, vía AUTO-FU-002), `EVT-FU-014` (CotizacionCancelada, vía FU-T-15)|
|**Restricciones**|Precios fijados e inmutables (RN-CHECKOUT-02). Vigencia 15 días (RN-FU-03). Solo CUSTOMER owner puede transicionar o cancelar (RN-FU-06).|

---

#### Estado: `EXPIRADA`

|Campo|Valor|
|---|---|
|**Nombre**|EXPIRADA|
|**Significado**|Cotización vencida tras 15 días. Precios liberados, PDF invalidado.|
|**Estado inicial**|❌ No|
|**Estado final**|❌ No|
|**Actores autorizados**|CUSTOMER (lectura y regeneración)|
|**Operaciones ejecutables**|`OPS-FU-008` (regenerar cotización)|
|**Eventos generados**|`EVT-FU-007` (CotizacionRegenerada)|
|**Restricciones**|Transición automática vía AUTO-FU-002 (scheduler). Solo CUSTOMER owner puede regenerar.|

---

#### Estado: `PEDIDO`

|Campo|Valor|
|---|---|
|**Nombre**|PEDIDO|
|**Significado**|FU convertido en transacción formal. Order creado en PENDING_PAYMENT.|
|**Estado inicial**|❌ No|
|**Estado final**|❌ No|
|**Actores autorizados**|GUEST/CUSTOMER (lectura, cancelación), Sistema (confirmación vía webhook)|
|**Operaciones ejecutables**|`OPS-CHK-004` (confirmar pago), `OPS-CHK-005` (manejar fallo), `OPS-CHK-008` (cancelar manualmente)|
|**Eventos generados**|`EVT-CHK-002` (PagoConfirmado), `EVT-CHK-003` (PagoFallido)|
|**Restricciones**|Solo 1 Order activo por FU (RN-CHK-010). Precios fijados (RN-CHECKOUT-02).|

---

#### Estado: `CONFIRMADO`

|Campo|Valor|
|---|---|
|**Nombre**|CONFIRMADO|
|**Significado**|Pago confirmado. FU inmutable. Order en PAID.|
|**Estado inicial**|❌ No|
|**Estado final**|✅ Sí (estado terminal exitoso)|
|**Actores autorizados**|GUEST/CUSTOMER (lectura), SELLER (lectura para despacho)|
|**Operaciones ejecutables**|Ninguna (solo lectura)|
|**Eventos generados**|Ninguno|
|**Restricciones**|Inmutabilidad total (RN-FU-02). No se permiten ediciones ni transiciones.|

---

#### Estado: `CANCELADO`

|Campo|Valor|
|---|---|
|**Nombre**|CANCELADO|
|**Significado**|Pago fallido o cancelado manualmente. FU liberado para reintento.|
|**Estado inicial**|No|
|**Estado final**|❌ No (permite reintento vía FU-T-14)|
|**Actores autorizados**|GUEST/CUSTOMER (reintento), Sistema (cancelación por timeout)|
|**Operaciones ejecutables**|`OPS-FU-011` (reintentar pedido)|
|**Eventos generados**|`EVT-FU-011` (FormatoUnicoReintentado)|
|**Restricciones**|Order anterior permanece CANCELLED e inmutable. Ítems preservados.|

---

### 2.3 Transiciones de FSM-01

|ID|Estado Origen|Estado Destino|Evento Disparador|Operación Funcional|Actor|Condiciones|Restricciones|RN Relacionadas|RF Relacionados|
|---|---|---|---|---|---|---|---|---|---|
|**FU-T-01**|(ninguno)|BORRADOR|EVT-FU-001|OPS-CAT-003|GUEST, CUSTOMER|Producto activo con stock > 0|GUEST solo 1 FU activo|RN-GUEST-01|RF-CAT-003|
|**FU-T-02**|BORRADOR|CONSULTA|EVT-FU-003|OPS-FU-004|GUEST, CUSTOMER|≥1 ítem, email válido (GUEST)|Asignación manual posterior|RN-CONSULTA-ASSIGN-01|RF-FU-004|
|**FU-T-03**|BORRADOR|COTIZACIÓN|EVT-FU-004|OPS-FU-005|CUSTOMER|≥1 ítem, stock suficiente, autenticado|Precios fijados, vigencia 15 días|RN-CHECKOUT-01, RN-CHECKOUT-02, RN-FU-03|RF-FU-005|
|**FU-T-04**|BORRADOR|PEDIDO|EVT-FU-005|OPS-FU-006|GUEST, CUSTOMER|≥1 ítem, stock suficiente|Crea Order en PENDING_PAYMENT|RN-CHECKOUT-01, RN-CHECKOUT-02, RN-CHK-010|RF-FU-006|
|**FU-T-05**|CONSULTA|RESUELTA|EVT-FU-012|OPS-CON-003|SELLER (asignado)|seller_id = actor_id, nota no vacía|Solo SELLER asignado puede responder|RN-CON-002|RF-CON-003|
|**FU-T-07**|RESUELTA|COTIZACIÓN|EVT-FU-004|OPS-FU-005|CUSTOMER|≥1 ítem, stock suficiente, autenticado|Igual que FU-T-03|RN-CHECKOUT-01, RN-CHECKOUT-02, RN-FU-03|RF-FU-005|
|**FU-T-09**|COTIZACIÓN|PEDIDO|EVT-FU-005|OPS-FU-006|GUEST, CUSTOMER|Cotización vigente (expires_at > now)|Precios ya fijados, no se recalculan|RN-CHECKOUT-01, RN-CHECKOUT-02|RF-FU-006|
|**FU-T-10**|COTIZACIÓN|EXPIRADA|EVT-FU-006|AUTO-FU-002|Sistema (scheduler)|expires_at < now|Transición automática, idempotente|RN-FU-03|RF-FU-008|
|**FU-T-11**|EXPIRADA|BORRADOR|EVT-FU-007|OPS-FU-008|CUSTOMER|FU en EXPIRADA, owner|Limpia expires_at y pdf_url, precios vuelven dinámicos|—|RF-FU-008|
|**FU-T-12**|PEDIDO|CONFIRMADO|EVT-CHK-002|OPS-CHK-004|Sistema (webhook MP)|status=approved, firma válida, event_id único|Idempotencia, inmutabilidad posterior|RN-CHK-004, RN-CHK-005|RF-CHK-004|
|**FU-T-13**|PEDIDO|CANCELADO|EVT-CHK-003|OPS-CHK-005, OPS-CHK-008|Sistema (webhook) o GUEST/CUSTOMER|Order en PENDING_PAYMENT|Registra cancellation_reason|RN-CHK-006, RN-CHK-009|RF-CHK-005, RF-CHK-008|
|**FU-T-14**|CANCELADO|BORRADOR|EVT-FU-011|OPS-FU-011|GUEST, CUSTOMER|Order en CANCELLED|Ítems preservados, Order anterior inmutable|RN-CHK-009, RN-CHK-010|RF-FU-011|
|**FU-T-15**|COTIZACIÓN|BORRADOR|EVT-FU-014|OPS-FU-020|CUSTOMER|Cotización vigente (expires_at > now), CUSTOMER owner|Ítems preservados, precios liberados (vuelven a dinámicos), pdf_url invalidado|RN-FU-06|RF-FU-020|

---

## 3. FSM-02: Pedido (Order)

### 3.1 Descripción

La FSM-02 gobierna el ciclo de vida del agregado `Order`, desde su creación tras el checkout hasta su despacho y entrega. Está acoplada a FSM-01 (un Order se crea cuando un FU transiciona a PEDIDO).

**Agregado raíz**: `Order` (MOD-CHK-01) **Módulos que consumen**: MOD-CHK-01, MOD-SEL-01, MOD-ADM-01

---

### 3.2 Estados de FSM-02

#### Estado: `PENDING_PAYMENT`

|Campo|Valor|
|---|---|
|**Nombre**|PENDING_PAYMENT|
|**Significado**|Order creado, esperando confirmación de pago. Datos de envío/facturación capturados.|
|**Estado inicial**|✅ Sí (estado de entrada tras ORD-T-01)|
|**Estado final**|❌ No|
|**Actores autorizados**|GUEST/CUSTOMER (cancelación manual), Sistema (confirmación/fallo vía webhook)|
|**Operaciones ejecutables**|`OPS-CHK-001` (capturar datos), `OPS-CHK-002` (calcular envío), `OPS-CHK-003` (iniciar pago), `OPS-CHK-004` (confirmar), `OPS-CHK-005` (manejar fallo), `OPS-CHK-008` (cancelar manualmente)|
|**Eventos generados**|`EVT-CHK-001` (PagoIniciado), `EVT-CHK-002` (PagoConfirmado), `EVT-CHK-003` (PagoFallido)|
|**Restricciones**|Solo 1 Order activo por FU (RN-CHK-010). Timeout de 30 min (AUTO-CHK-003).|

---

#### Estado: `PAID`

|Campo|Valor|
|---|---|
|**Nombre**|PAID|
|**Significado**|Pago confirmado. Order inmutable en datos de facturación. Listo para despacho.|
|**Estado inicial**|❌ No|
|**Estado final**|❌ No|
|**Actores autorizados**|GUEST/CUSTOMER (lectura), SELLER (lectura para despacho)|
|**Operaciones ejecutables**|`OPS-SEL-004` (ver cola), `OPS-SEL-005` (generar guía)|
|**Eventos generados**|`EVT-SEL-003` (GuiaGenerada)|
|**Restricciones**|Inmutabilidad de datos de facturación. No se permiten cancelaciones.|

---

#### Estado: `CANCELLED`

|Campo|Valor|
|---|---|
|**Nombre**|CANCELLED|
|**Significado**|Pago fallido o cancelado manualmente. Order inmutable como histórico.|
|**Estado inicial**|❌ No|
|**Estado final**|✅ Sí (estado terminal de fallo)|
|**Actores autorizados**|GUEST/CUSTOMER (lectura), Sistema (cancelación por timeout)|
|**Operaciones ejecutables**|Ninguna (solo lectura)|
|**Eventos generados**|Ninguno|
|**Restricciones**|Inmutabilidad total. cancellation_reason registrado.|

---

#### Estado: `READY_TO_SHIP`

|Campo|Valor|
|---|---|
|**Nombre**|READY_TO_SHIP|
|**Significado**|Order pagado, pendiente de despacho físico. Visible en cola de SELLER.|
|**Estado inicial**|❌ No|
|**Estado final**|❌ No|
|**Actores autorizados**|SELLER (generación de guía)|
|**Operaciones ejecutables**|`OPS-SEL-005` (generar guía)|
|**Eventos generados**|`EVT-SEL-003` (GuiaGenerada)|
|**Restricciones**|Solo SELLER puede transicionar.|

---

#### Estado: `SHIPPED`

|Campo|Valor|
|---|---|
|**Nombre**|SHIPPED|
|**Significado**|Guía de envío generada. Pedido en tránsito.|
|**Estado inicial**|❌ No|
|**Estado final**|❌ No|
|**Actores autorizados**|GUEST/CUSTOMER (lectura, seguimiento), SELLER (lectura)|
|**Operaciones ejecutables**|Ninguna (solo lectura)|
|**Eventos generados**|Ninguno|
|**Restricciones**|ShippingGuide creada con tracking_code.|

---

#### Estado: `DELIVERED`

|Campo|Valor|
|---|---|
|**Nombre**|DELIVERED|
|**Significado**|Pedido entregado al cliente. Ciclo de vida completado exitosamente.|
|**Estado inicial**|❌ No|
|**Estado final**|✅ Sí (estado terminal exitoso)|
|**Actores autorizados**|GUEST/CUSTOMER (lectura), SELLER (lectura)|
|**Operaciones ejecutables**|Ninguna (solo lectura)|
|**Eventos generados**|Ninguno|
|**Restricciones**|Estado final. No se permiten transiciones.|

---

#### Estado: `REFUNDED`

|Campo|Valor|
|---|---|
|**Nombre**|REFUNDED|
|**Significado**|Reembolso procesado. Pedido cancelado post-pago.|
|**Estado inicial**|❌ No|
|**Estado final**|✅ Sí (estado terminal de reembolso)|
|**Actores autorizados**|ADMIN (gestión de reembolso)|
|**Operaciones ejecutables**|Ninguna documentada explícitamente|
|**Eventos generados**|Ninguno documentado explícitamente|
|**Restricciones**|Requiere intervención ADMIN. No documentado en módulos.|

---

### 3.3 Transiciones de FSM-02

|ID|Estado Origen|Estado Destino|Evento Disparador|Operación Funcional|Actor|Condiciones|Restricciones|RN Relacionadas|RF Relacionados|
|---|---|---|---|---|---|---|---|---|---|
|**ORD-T-01**|(ninguno)|PENDING_PAYMENT|EVT-FU-005|OPS-FU-006|GUEST, CUSTOMER|FU transiciona a PEDIDO|Crea Order con datos de envío|RN-CHK-010|RF-FU-006|
|**ORD-T-02**|PENDING_PAYMENT|PAID|EVT-CHK-002|OPS-CHK-004|Sistema (webhook MP)|status=approved, firma válida, event_id único|Idempotencia, inmutabilidad posterior|RN-CHK-004, RN-CHK-005|RF-CHK-004|
|**ORD-T-03**|PENDING_PAYMENT|CANCELLED|EVT-CHK-003|OPS-CHK-005, OPS-CHK-008|Sistema (webhook) o GUEST/CUSTOMER|Order en PENDING_PAYMENT|Registra cancellation_reason|RN-CHK-006, RN-CHK-009|RF-CHK-005, RF-CHK-008|
|**ORD-T-04**|PAID|READY_TO_SHIP|(no documentado)|(no documentado)|Sistema|(no documentado)|(no documentado)|(no documentado)|(no documentado)|
|**ORD-T-05**|READY_TO_SHIP|SHIPPED|EVT-SEL-003|OPS-SEL-005|SELLER|Order en READY_TO_SHIP, formulario de guía completo|Crea ShippingGuide|RN-SHP-01|RF-SEL-005|
|**ORD-T-06**|SHIPPED|DELIVERED|(no documentado)|(no documentado)|Sistema|(no documentado)|(no documentado)|(no documentado)|(no documentado)|
|**ORD-T-07**|PAID|REFUNDED|(no documentado)|(no documentado)|ADMIN|(no documentado)|(no documentado)|(no documentado)|(no documentado)|

---

## 4. Consistencia de la FSM

### 4.1 Validación de Propiedades

|Propiedad|FSM-01 (FormatoUnico)|FSM-02 (Order)|Estado|
|---|---|---|---|
|**Estado inicial único**|✅ BORRADOR (vía FU-T-01)|✅ PENDING_PAYMENT (vía ORD-T-01)|Consistente|
|**Estados finales definidos**|✅ CONFIRMADO, CANCELADO|✅ DELIVERED, CANCELLED, REFUNDED|Consistente|
|**Transiciones deterministas**|✅ Cada transición tiene evento y operación únicos|✅ Cada transición documentada tiene evento único|Consistente|
|**Sin ciclos infinitos**|✅ CANCELADO → BORRADOR permite reintento pero no ciclo infinito|✅ No hay ciclos|Consistente|
|**Acoplamiento entre FSM**|✅ FU-T-04/FU-T-09 crean Order (ORD-T-01)|✅ ORD-T-02/ORD-T-03 actualizan FU (FU-T-12/FU-T-13)|Consistente|
|**Inmutabilidad de estados finales**|✅ CONFIRMADO y CANCELADO sin transiciones salientes|✅ CANCELLED, DELIVERED, REFUNDED sin transiciones salientes|Consistente|

### 4.2 Invariantes de la FSM

|ID|Invariante|Descripción|FSM Aplicada|
|---|---|---|---|
|**INV-FSM-01**|Unicidad de Order activo|Un FormatoUnico solo puede tener 1 Order en PENDING_PAYMENT simultáneamente|FSM-01, FSM-02|
|**INV-FSM-02**|Inmutabilidad post-pago|Un Order en PAID o posterior no puede modificarse en datos de facturación|FSM-02|
|**INV-FSM-03**|Inmutabilidad de FU confirmado|Un FormatoUnico en CONFIRMADO no permite ediciones ni transiciones|FSM-01|
|**INV-FSM-04**|Idempotencia de transiciones|Transiciones automáticas (AUTO-FU-002, AUTO-CHK-003) deben ser idempotentes|FSM-01, FSM-02|
|**INV-FSM-05**|Preservación de ítems en reintento|FU-T-14 preserva ítems del FU al transicionar de CANCELADO a BORRADOR|FSM-01|
|**INV-FSM-06**|Preservación de ítems en cancelación de cotización|FU-T-15 preserva ítems del FU al transicionar de COTIZACIÓN a BORRADOR; libera precios congelados e invalida pdf_url|FSM-01|

### 4.3 Matriz de Transiciones por Actor

|Actor|FSM-01 Transiciones|FSM-02 Transiciones|
|---|---|---|
|**GUEST**|FU-T-01, FU-T-02, FU-T-04, FU-T-13, FU-T-14|ORD-T-01, ORD-T-03|
|**CUSTOMER**|FU-T-01, FU-T-02, FU-T-03, FU-T-04, FU-T-09, FU-T-11, FU-T-13, FU-T-14, FU-T-15|ORD-T-01, ORD-T-03|
|**SELLER**|FU-T-05|ORD-T-05|
|**ADMIN**|Ninguna|Ninguna documentada|
|**Sistema**|FU-T-10, FU-T-12|ORD-T-02, ORD-T-03 (timeout)|

---

## 5. Vacíos Documentales Detectados

Los siguientes vacíos no pueden completarse objetivamente porque el material existente (10 módulos del Inventario Funcional Maestro) no los documenta explícitamente. No se han inventado transiciones, estados ni operaciones para completarlos.

### 5.1 Transición ORD-T-04: PAID → READY_TO_SHIP

**Referencia**: Ningún módulo documenta explícitamente esta transición.

**Razón**: MOD-CHK-01 documenta ORD-T-02 (PENDING_PAYMENT → PAID) y MOD-SEL-01 documenta ORD-T-05 (READY_TO_SHIP → SHIPPED), pero no existe OPS ni AUTO que ejecute la transición intermedia PAID → READY_TO_SHIP. Se infiere que debería existir (un Order pagado debe quedar listo para despacho), pero no hay base objetiva para definir:

- ¿Qué operación la ejecuta?
- ¿Es automática tras ORD-T-02?
- ¿Requiere intervención de SELLER o ADMIN?
- ¿Qué evento la dispara?

**Impacto**: La FSM-02 tiene un "salto" entre PAID y READY_TO_SHIP sin transición documentada. No se puede implementar sin decisión explícita.

---

### 5.2 Transición ORD-T-06: SHIPPED → DELIVERED

**Referencia**: Ningún módulo documenta explícitamente esta transición.

**Razón**: MOD-SEL-01 documenta ORD-T-05 (READY_TO_SHIP → SHIPPED) pero no hay OPS ni AUTO que ejecute SHIPPED → DELIVERED. Se infiere que debería existir (un pedido enviado debe marcarse como entregado), pero no hay base objetiva para definir:

- ¿Qué operación la ejecuta?
- ¿Es automática tras confirmación de Shalom (mock)?
- ¿Requiere intervención manual de SELLER?
- ¿Qué evento la dispara?

**Impacto**: DELIVERED aparece como estado final en la FSM-02 pero no hay camino documentado para alcanzarlo.

---

### 5.3 Transición ORD-T-07: PAID → REFUNDED

**Referencia**: Ningún módulo documenta explícitamente esta transición.

**Razón**: REFUNDED aparece como estado en la FSM-02 pero ningún módulo documenta una operación que ejecute PAID → REFUNDED. No hay base objetiva para definir:

- ¿Qué actor la ejecuta (ADMIN, Sistema)?
- ¿Qué operación funcional la dispara?
- ¿Qué condiciones la habilitan?
- ¿Qué evento genera?

**Impacto**: REFUNDED es un estado huérfano sin transición de entrada documentada.

---

### 5.4 Operación de actualización de estado de Order tras despacho

**Referencia**: MOD-SEL-01 (OPS-SEL-005)

**Razón**: OPS-SEL-005 documenta la generación de ShippingGuide y la transición ORD-T-05 (READY_TO_SHIP → SHIPPED), pero no especifica si el Order se actualiza automáticamente o requiere confirmación adicional. No hay base para definir si existe un paso intermedio de "confirmación de despacho" antes de SHIPPED.

**Impacto**: La transición ORD-T-05 está documentada pero su atomicidad y condiciones exactas no están especificadas.

---

### 5.5 Timeout de Order en PENDING_PAYMENT

**Referencia**: MOD-CHK-01 (AUTO-CHK-003)

**Razón**: AUTO-CHK-003 documenta un timeout de 30 minutos para Orders en PENDING_PAYMENT, pero no especifica:

- ¿El timeout ejecuta ORD-T-03 (CANCELLED)?
- ¿Qué evento dispara?
- ¿Es idempotente?
- ¿Qué sucede con el FU asociado (FU-T-13)?

**Impacto**: La transición automática por timeout está mencionada pero no integrada formalmente en la FSM-02.

---

### 5.6 Estado intermedio entre PAID y READY_TO_SHIP

**Referencia**: Ningún módulo

**Razón**: Se infiere que podría existir un estado intermedio (ej. "PROCESSING" o "VALIDATING") entre PAID y READY_TO_SHIP para validaciones post-pago, pero no hay base objetiva en los módulos para documentarlo. No se inventa.

**Impacto**: La FSM-02 podría requerir un estado adicional no documentado.

---

### 5.7 Transición de FU tras confirmación de pago

**Referencia**: MOD-CHK-01 (OPS-CHK-004)

**Razón**: OPS-CHK-004 documenta que tras confirmación de pago, el FU transiciona a CONFIRMADO (FU-T-12), pero no especifica si esta transición es atómica con ORD-T-02 o si puede fallar independientemente. No hay base para definir el manejo de errores de esta transición cruzada.

**Impacto**: El acoplamiento entre FSM-01 y FSM-02 en la confirmación de pago no está especificado formalmente.

---

### 5.8 Estados finales de FU sin Order asociado

**Referencia**: MOD-FU-01

**Razón**: No está documentado qué sucede con un FU en BORRADOR de GUEST cuando el `guest_token` expira (24h sliding). No hay transición documentada para "expiración de sesión GUEST" ni estado "ABANDONED" para FU huérfanos.

**Impacto**: La FSM-01 no contempla el ciclo de vida completo de FU de GUEST sin conversión a CUSTOMER.

---

## 6. Control de Cambios

|Versión|Fecha|Cambio|Estado|
|---|---|---|---|
|1.0.0|30/06/2026|Versión inicial consolidada de FSM-01 (12 transiciones) y FSM-02 (3 transiciones documentadas + 4 vacíos).|Borrador (pendiente VoBo)|

---

## 🆕 EXTENSIONES v1.2 (14 Mejoras UI/UX e Integraciones)

### ⚠️ Nota Importante

**Las máquinas de estados FSM-01 (Formato Único) y FSM-02 (Order) NO sufren modificaciones en v1.2.**

Las 14 mejoras agregan:
- ✅ Nuevas pantallas (Dashboard, Landing, Confirmación de pago)
- ✅ Nuevas entidades (Kit, Favorite, Notification)
- ✅ Nuevas integraciones (Mercado Pago, Telegram, Excel)
- ✅ Nuevos flujos de UI/UX

**Pero NO agregan nuevos estados ni transiciones a las FSM existentes.**

### 🔄 Flujos Complementarios (No son FSM)

**Flujo de Reserva de Stock:**

COTIZACIÓN → [Usuario clickea "Comprar"] → PEDIDO
↓
reserved_stock += quantity
↓
[Timeout 30 min]
↓
Si no hay pago confirmado:
reserved_stock -= quantity
PEDIDO → CANCELADO


**Flujo de Notificaciones:**

Evento FSM detectado:
COTIZACIÓN creada → Programar notificación "Expirará en 24h"
CONSULTA respondida → Notificación inmediata
Order CONFIRMADO → Notificación inmediata
↓
Crear registro en Notification
↓
Incrementar badge en header


**Flujo de Migración GUEST → CUSTOMER:**

GUEST tiene FU activo + Inicia sesión
↓
¿CUSTOMER tiene FU activo?
/
SÍ NO
↓ ↓
Fusionar items Asignar FU
(sumar qty) al CUSTOMER
↓ ↓
Eliminar FU GUEST
↓
Redirigir a Dashboard
