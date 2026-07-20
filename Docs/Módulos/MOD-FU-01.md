## MOD-FU-01 — Formato Único Interactivo

- **Objetivo:** Gestionar el contenedor central de intención de compra/consulta/cotización del usuario.
- **Actores:** GUEST, CUSTOMER
- **Procesos de negocio de origen:** 6.1, 6.2, 6.3
- **Integraciones:** ninguna externa. FSM de referencia: FSM-01 (Formato Único)

---

### Operaciones Funcionales (OPS)

#### `OPS-FU-001` — Editar cantidad de un ítem

- **Objetivo de negocio:** permitir ajuste de intención de compra antes de comprometerse a una transición irreversible
- **Actor:** GUEST, CUSTOMER
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** válido solo si `FormatoUnico.state = BORRADOR`
- **Entidades afectadas:** `FormatoUnicoItem` (modifica `quantity`)
- **Eventos de dominio:** `EVT-FU-002` (`ItemActualizado`)
- **Pantallas:** `SCR-FU-001`
- **Botones/acciones que la disparan:** `ACT-FU-001`, `ACT-FU-002`
- **Resultado esperado:** cantidad actualizada, totales recalculados (`AUTO-FU-001`)
- **Servicios de dominio involucrados:** `FormatoUnicoService`, `InventoryService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-FU-001`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-FU-001`
- **UC relacionados:** `UC-FU-001`
- **CA relacionados:** `CA-FU-001`
- **TEST relacionados:** `TEST-FU-001`

#### `OPS-FU-002` — Eliminar ítem

- **Objetivo de negocio:** permitir corrección de intención de compra
- **Actor:** GUEST, CUSTOMER
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** válido solo en `BORRADOR`
- **Entidades afectadas:** `FormatoUnicoItem` (elimina)
- **Eventos de dominio:** `EVT-FU-002` (`ItemEliminado`)
- **Pantallas:** `SCR-FU-001`
- **Botones/acciones que la disparan:** `BTN-FU-001`
- **Resultado esperado:** ítem removido, totales recalculados
- **Servicios de dominio involucrados:** `FormatoUnicoService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-FU-002`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-FU-002`
- **UC relacionados:** `UC-FU-001` (sub-flujo)
- **CA relacionados:** `CA-FU-002`
- **TEST relacionados:** `TEST-FU-002`

#### `OPS-FU-003` — Vaciar Formato Único

- **Objetivo de negocio:** permitir reinicio completo de la intención de compra sin crear un nuevo FU
- **Actor:** GUEST, CUSTOMER
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** válido solo en `BORRADOR`
- **Entidades afectadas:** todos los `FormatoUnicoItem` del FU (elimina)
- **Eventos de dominio:** `EVT-FU-002` (`ItemEliminado` × n)
- **Pantallas:** `SCR-FU-001`
- **Botones/acciones que la disparan:** `BTN-FU-002`
- **Resultado esperado:** FU queda en `BORRADOR` sin ítems
- **Servicios de dominio involucrados:** `FormatoUnicoService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-FU-003`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-FU-003`
- **UC relacionados:** `UC-FU-001` (sub-flujo)
- **CA relacionados:** `CA-FU-003`
- **TEST relacionados:** `TEST-FU-003`

#### `OPS-FU-004` — Solicitar consulta pre-venta

- **Objetivo de negocio:** habilitar asesoría humana antes de comprometer una compra, capturando leads que requieren consultoría
- **Actor:** GUEST, CUSTOMER
- **Proceso de negocio de origen:** 6.3
- **Estados de FSM involucrados:** `BORRADOR → CONSULTA` (`FU-T-02`)
- **Entidades afectadas:** `FormatoUnico` (cambia `state`), `FormatoUnicoTransition`
- **Eventos de dominio:** `EVT-FU-003` (`ConsultaIniciada`)
- **Pantallas:** `SCR-FU-001`
- **Botones/acciones que la disparan:** `BTN-FU-003`
- **Resultado esperado:** FU en `CONSULTA`, visible en cola de SELLER (`MOD-CON-01`)
- **Servicios de dominio involucrados:** `StateMachineService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva (la asignación posterior es responsabilidad de `MOD-CON-01`)
- **RF relacionados:** `RF-FU-004`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-FU-004`
- **UC relacionados:** `UC-FU-002`
- **CA relacionados:** `CA-FU-004`
- **TEST relacionados:** `TEST-FU-004`

#### `OPS-FU-005` — Generar cotización

- **Objetivo de negocio:** formalizar una propuesta comercial con precio fijo y validez temporal para clientes B2B
- **Actor:** CUSTOMER (requiere autenticación)
- **Proceso de negocio de origen:** 6.2
- **Estados de FSM involucrados:** `BORRADOR → COTIZACIÓN` (`FU-T-03`) o `RESUELTA → COTIZACIÓN` (`FU-T-07`)
- **Entidades afectadas:** `FormatoUnico` (cambia `state`, fija `expires_at`, `pdf_url`), `FormatoUnicoItem` (fija `price_at_time`), `FormatoUnicoTransition`
- **Eventos de dominio:** `EVT-FU-004` (`CotizacionGenerada`)
- **Pantallas:** `SCR-FU-001`
- **Botones/acciones que la disparan:** `BTN-FU-004`
- **Resultado esperado:** PDF generado y accesible; countdown de 15 días iniciado
- **Servicios de dominio involucrados:** `StateMachineService`, `PricingService`, `QuoteService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CHECKOUT-01`, `RN-CHECKOUT-02`, `RN-FU-03` (vigencia 15 días)
- **RF relacionados:** `RF-FU-005`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-FU-005`
- **UC relacionados:** `UC-FU-003`
- **CA relacionados:** `CA-FU-005`
- **TEST relacionados:** `TEST-FU-005`
- **AUTO relacionadas:** `AUTO-FU-004`, `AUTO-FU-005`

#### `OPS-FU-006` — Iniciar checkout (Pedido)

- **Objetivo de negocio:** convertir intención de compra en transacción formal de pago
- **Actor:** GUEST, CUSTOMER
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** `BORRADOR → PEDIDO` (`FU-T-04`) o `COTIZACIÓN → PEDIDO` (`FU-T-09`)
- **Entidades afectadas:** `FormatoUnico` (cambia `state`, fija `current_order_id`), `Order` (crea en `PENDING_PAYMENT`), `FormatoUnicoItem` (fija `price_at_time` si no estaba fijo)
- **Eventos de dominio:** `EVT-FU-005` (`PedidoIniciado`)
- **Pantallas:** `SCR-FU-001` (inicia), continúa en `SCR-CHK-001` (`MOD-CHK-01`)
- **Botones/acciones que la disparan:** `BTN-FU-005`
- **Resultado esperado:** navega a checkout con FU en estado `PEDIDO`
- **Servicios de dominio involucrados:** `StateMachineService`, `PricingService`, `OrderService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CHECKOUT-01`, `RN-CHECKOUT-02`, `RN-CHK-010` (un FU solo puede tener un Order activo simultáneo, definida en la sesión de `MOD-CHK-01`)
- **RF relacionados:** `RF-FU-006`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-FU-006`
- **UC relacionados:** `UC-FU-004`
- **CA relacionados:** `CA-FU-006`
- **TEST relacionados:** `TEST-FU-006`
- **AUTO relacionadas:** `AUTO-FU-004`, `AUTO-FU-005`

#### `OPS-FU-007` — Descargar PDF de cotización

- **Objetivo de negocio:** permitir que el CUSTOMER comparta la propuesta comercial fuera del sistema
- **Actor:** CUSTOMER
- **Proceso de negocio de origen:** 6.2
- **Estados de FSM involucrados:** ninguno (lectura sobre FU en `COTIZACIÓN` o histórico)
- **Entidades afectadas:** ninguna (lectura de `pdf_url`)
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-FU-001`, `SCR-FU-002`
- **Botones/acciones que la disparan:** `BTN-FU-007`
- **Resultado esperado:** archivo PDF descargado
- **Servicios de dominio involucrados:** `QuoteService` (acceso a almacenamiento de documentos)
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-FU-007`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-FU-007`
- **UC relacionados:** `UC-FU-003` (sub-flujo)
- **CA relacionados:** `CA-FU-007`
- **TEST relacionados:** `TEST-FU-007`

#### `OPS-FU-008` — Regenerar cotización expirada

- **Objetivo de negocio:** evitar pérdida de la intención de compra cuando la vigencia comercial venció
- **Actor:** CUSTOMER
- **Proceso de negocio de origen:** 6.2
- **Estados de FSM involucrados:** `EXPIRADA → BORRADOR` (`FU-T-11`)
- **Entidades afectadas:** `FormatoUnico` (cambia `state`, limpia `expires_at`/`pdf_url`), `FormatoUnicoItem` (precios vuelven a ser dinámicos)
- **Eventos de dominio:** `EVT-FU-007` (`CotizacionRegenerada`)
- **Pantallas:** `SCR-FU-001`
- **Botones/acciones que la disparan:** `BTN-FU-008`
- **Resultado esperado:** FU editable nuevamente con los mismos ítems, precios actualizados al valor vigente
- **Servicios de dominio involucrados:** `StateMachineService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-FU-008`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-FU-008`
- **UC relacionados:** `UC-FU-005`
- **CA relacionados:** `CA-FU-008`
- **TEST relacionados:** `TEST-FU-008`

#### `OPS-FU-009` — Resolver conflicto de migración GUEST→CUSTOMER

- **Objetivo de negocio:** preservar intención de compra de ambas sesiones sin pérdida silenciosa de datos al autenticarse
- **Actor:** CUSTOMER (en el instante posterior al login)
- **Proceso de negocio de origen:** 6.1, 6.2 (transversal, disparado por `MOD-AUT-01`)
- **Estados de FSM involucrados:** ninguno directamente sobre un único FU; afecta a dos FU en `BORRADOR`
- **Entidades afectadas:** `FormatoUnico` (uno se descarta o ambos se fusionan), `FormatoUnicoItem` (se combinan cantidades si aplica)
- **Eventos de dominio:** `EVT-FU-008` (`FormatoUnicoMigrado`/`FormatoUnicoCombinado`)
- **Pantallas:** `SCR-FU-001` (modal `CMP-FU-012`)
- **Botones/acciones que la disparan:** `BTN-FU-009`, `BTN-FU-010`
- **Resultado esperado:** un único FU `BORRADOR` resultante, sin pérdida de datos no confirmada por el usuario
- **Servicios de dominio involucrados:** `FormatoUnicoService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-GUEST-MIGRATE-01` (resuelta en Sesión 1)
- **RF relacionados:** `RF-FU-009`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-FU-009`
- **UC relacionados:** `UC-FU-006`
- **CA relacionados:** `CA-FU-009`
- **TEST relacionados:** `TEST-FU-009`
- **AUTO relacionadas:** `AUTO-FU-003`

#### `OPS-FU-010` — Consultar historial de Formatos Únicos

- **Objetivo de negocio:** dar trazabilidad al CUSTOMER sobre sus interacciones comerciales pasadas, reforzando confianza y soporte post-venta
- **Actor:** CUSTOMER
- **Proceso de negocio de origen:** 6.1, 6.2, 6.3 (transversal)
- **Estados de FSM involucrados:** ninguno (lectura de todos los estados históricos)
- **Entidades afectadas:** ninguna (lectura de `FormatoUnico[]`)
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-FU-002`
- **Botones/acciones que la disparan:** `BTN-FU-011`, `ACT-FU-003`
- **Resultado esperado:** listado filtrable de FU históricos del CUSTOMER
- **Servicios de dominio involucrados:** `FormatoUnicoQueryService`
- **Prioridad funcional:** MVP+
- **RN relacionadas:** ninguna
- **RF relacionados:** `RF-FU-010`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-FU-010`
- **UC relacionados:** `UC-FU-007`
- **CA relacionados:** `CA-FU-010`
- **TEST relacionados:** `TEST-FU-010`

#### `OPS-FU-011` — Reintentar pedido tras cancelación

- **Objetivo de negocio:** preservar la intención de compra cuando un intento de pago falla o se cancela, evitando que el usuario tenga que recrear su FU desde cero
- **Actor:** GUEST, CUSTOMER
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** `CANCELADO → BORRADOR` (`FU-T-14`, incorporada durante la sesión de `MOD-CHK-01`)
- **Entidades afectadas:** `FormatoUnico` (cambia `state`, limpia `current_order_id`, ítems preservados), `Order` anterior (permanece `CANCELLED`, inmutable, histórico)
- **Eventos de dominio:** `EVT-FU-011` (`FormatoUnicoReintentado`)
- **Pantallas:** `SCR-FU-001` (destino), disparado desde `SCR-CHK-003` (`MOD-CHK-01`)
- **Botones/acciones que la disparan:** `BTN-CHK-003` (botón vive en `MOD-CHK-01`; la operación que ejecuta pertenece a este módulo porque muta el agregado `FormatoUnico`)
- **Resultado esperado:** FU en `BORRADOR` con ítems preservados, listo para nuevo intento de checkout
- **Servicios de dominio involucrados:** `StateMachineService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CHK-009`, `RN-CHK-010`
- **RF relacionados:** `RF-FU-011`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-FU-011`
- **UC relacionados:** `UC-CHK-004` (caso de uso compartido con `MOD-CHK-01`, ya referenciado en esa sesión)
- **CA relacionados:** `CA-FU-011`
- **TEST relacionados:** `TEST-FU-011`

---

### Pantallas (SCR)

#### `SCR-FU-001` — Formato Único (`/formato`)

- **Propósito:** revisar, editar ítems y decidir transición
- **Objetivo de negocio:** ser el punto de decisión central que convierte intención difusa en una de tres acciones comerciales concretas
- **Valor para el usuario:** control total sobre su intención de compra antes de comprometerse; transparencia de totales y vigencia
- **Valor para el negocio:** es el "punto de no retorno" comercial; cada transición desde aquí genera valor medible
- **Actores autorizados:** GUEST (vía cookie), CUSTOMER
- **Estados:** vacío, con datos, en `CONSULTA` (solo lectura + estado), en `COTIZACIÓN` (solo lectura + PDF + countdown), bloqueado (`PEDIDO`/`CONFIRMADO`, solo lectura)
- **Permisos:** el FU debe pertenecer al actor (`owner_id` o `guest_token`)
- **Dependencias con otras pantallas:** recibe ítems desde `SCR-CAT-001`/`SCR-CAT-002`; entrega control a `SCR-CHK-001`; depende de `MOD-AUT-01` para `OPS-FU-009`; recibe retorno desde `SCR-CHK-003` vía `OPS-FU-011`
- **Navegación de entrada:** `NAV-FU-001`, `NAV-FU-002`, `NAV-CTA-001`, `NAV-CHK-006`
- **Navegación de salida:** `NAV-CHK-001`, `NAV-CON-001`, `NAV-COT-001`

#### `SCR-FU-002` — Historial de Formatos Únicos (`/cuenta/formatos`)

- **Propósito:** ver todos los FU históricos del CUSTOMER
- **Objetivo de negocio:** soporte post-venta y reducción de carga sobre SELLER para consultas de estado
- **Valor para el usuario:** autoservicio para revisar estado y descargar documentos sin contactar a soporte
- **Valor para el negocio:** reduce fricción operativa en el equipo de ventas
- **Actores autorizados:** CUSTOMER autenticado
- **Estados:** vacío, con datos
- **Permisos:** requiere sesión CUSTOMER
- **Dependencias con otras pantallas:** depende de menú de cuenta (`MOD-AUT-01`)
- **Navegación de entrada:** `NAV-CTA-002`
- **Navegación de salida:** `NAV-FU-003`

---

### Componentes (CMP)

**`SCR-FU-001`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-FU-001`|Tabla/lista de ítems|Visualiza y permite editar contenido del FU|`FormatoUnicoItem[]`|—|`CMP-FU-002`|
|`CMP-FU-002`|Control de cantidad por ítem|Ejecuta `OPS-FU-001`|`quantity` actual, `stock`|nueva `quantity`|`CMP-FU-010`|
|`CMP-FU-003`|Resumen de totales|Comunica impacto económico|ítems con `price_at_time` o precio en vivo|subtotal/IGV/total (`AUTO-FU-001`)|`CMP-FU-001`|
|`CMP-FU-004`|Badge de estado del FU|Comunica etapa del flujo|`FormatoUnico.state`|—|—|
|`CMP-FU-005`|Countdown de vigencia|Comunica urgencia de la COTIZACIÓN|`FormatoUnico.expires_at`|—|`CMP-FU-004`|
|`CMP-FU-006`|Estado vacío|Orienta hacia el catálogo|FU sin ítems|navegación (`BTN-FU-006`)|—|
|`CMP-FU-007`|Banner de bloqueo|Comunica inmutabilidad post-transición|`FormatoUnico.state`|—|—|
|`CMP-FU-008`|Modal de confirmación de transición|Previene transiciones accidentales|operación a confirmar|confirmación/cancelación|`BTN-FU-003`, `BTN-FU-004`|
|`CMP-FU-009`|Toast|Feedback de resultado de operaciones|resultado de operación|—|—|
|`CMP-FU-010`|Mensaje de error de stock|Feedback de validación en `OPS-FU-001`|`quantity` vs `stock`|—|`CMP-FU-002`|
|`CMP-FU-011`|Loader|Feedback durante recálculo/transición|estado de carga|—|—|
|`CMP-FU-012`|Modal de migración GUEST→CUSTOMER|Interfaz de `OPS-FU-009`|dos FU candidatos|decisión del usuario|`AUTO-FU-003`|

**`SCR-FU-002`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-FU-013`|Tabla de historial|Soporta `OPS-FU-010`|`FormatoUnico[]` históricos|selección de fila|`CMP-FU-014`, `CMP-FU-015`|
|`CMP-FU-014`|Badge de estado|Igual función que `CMP-FU-004`|`FormatoUnico.state`|—|—|
|`CMP-FU-015`|Filtro por estado|Refina `OPS-FU-010`|estados disponibles|`state[]` filtrados|`CMP-FU-013`|
|`CMP-FU-016`|Paginación|Navega resultados|total de resultados|página solicitada|`CMP-FU-013`|
|`CMP-FU-017`|Estado vacío|Orienta cuando no hay historial|FU histórico vacío|—|—|

---

### Botones (BTN)

#### `BTN-FU-001` — "Eliminar" (por ítem)

- Pantalla: `SCR-FU-001` | Actor: GUEST/CUSTOMER | Estado: `BORRADOR`
- Operación funcional: `OPS-FU-002` | Proceso de origen: 6.1, 6.2
- Precondiciones: FU en `BORRADOR`; el ítem pertenece al FU del actor
- Postcondiciones: ítem eliminado; si era el último, FU queda vacío
- Errores posibles: `404` (ítem ya no existe); `403` (FU no pertenece al actor)
- Excepciones: ninguna | Restricciones: solo aplicable en `BORRADOR`
- Impacto en la FSM: ninguno | Eventos generados: `EVT-FU-002`
- Confirmación: sí ("¿Eliminar este producto?") | Mensaje: toast | Navegación posterior: ninguna | Permisos: owner del FU

#### `BTN-FU-002` — "Vaciar Formato Único"

- Pantalla: `SCR-FU-001` | Actor: GUEST/CUSTOMER | Estado: `BORRADOR` con ≥1 ítem
- Operación funcional: `OPS-FU-003` | Proceso de origen: 6.1, 6.2
- Precondiciones: FU en `BORRADOR`; ≥1 ítem
- Postcondiciones: FU sin ítems, permanece en `BORRADOR`
- Errores posibles: `409` si el FU cambió de estado entre render y click
- Excepciones: ninguna | Restricciones: solo en `BORRADOR`
- Impacto en la FSM: ninguno | Eventos generados: `EVT-FU-002` × n
- Confirmación: sí ("¿Vaciar todo?") | Mensaje: toast | Navegación posterior: ninguna | Permisos: owner

#### `BTN-FU-003` — "Solicitar Consulta"

- Pantalla: `SCR-FU-001` | Actor: GUEST/CUSTOMER | Estado: `BORRADOR` con ≥1 ítem
- Operación funcional: `OPS-FU-004` | Proceso de origen: 6.3
- Precondiciones: FU en `BORRADOR`; ≥1 ítem; email válido disponible
- Postcondiciones: FU en `CONSULTA`; visible en cola de `MOD-CON-01`
- Errores posibles: `422` (email inválido de GUEST); `409` (FU ya no en `BORRADOR`)
- Excepciones: ninguna | Restricciones: `RN-CONSULTA-ASSIGN-01` (queda sin asignar hasta que un SELLER la tome)
- Impacto en la FSM: ejecuta `FU-T-02` | Eventos generados: `EVT-FU-003`
- Confirmación: sí | Mensaje: "Tu consulta fue enviada" | Navegación posterior: `NAV-CON-001` | Permisos: owner

#### `BTN-FU-004` — "Generar Cotización"

- Pantalla: `SCR-FU-001` | Actor: CUSTOMER | Estado: `BORRADOR` o `RESUELTA`, con ≥1 ítem
- Operación funcional: `OPS-FU-005` | Proceso de origen: 6.2
- Precondiciones: actor CUSTOMER autenticado; FU en `BORRADOR`/`RESUELTA`; ≥1 ítem; stock suficiente
- Postcondiciones: FU en `COTIZACIÓN`; `expires_at = now + 15 días`; `price_at_time` fijado; PDF generado
- Errores posibles: `409` (stock insuficiente, lista de productos afectados); `401` (sesión expirada); `500` (fallo de generación de PDF)
- Excepciones: si la generación de PDF falla tras fijar el estado, el sistema revierte la transición (transacción atómica)
- Restricciones: `RN-CHECKOUT-01`, `RN-CHECKOUT-02`
- Impacto en la FSM: ejecuta `FU-T-03`/`FU-T-07` | Eventos generados: `EVT-FU-004`
- Confirmación: sí | Mensaje: "Cotización generada" | Navegación posterior: `NAV-COT-001` | Permisos: owner, rol CUSTOMER

#### `BTN-FU-005` — "Ir a Checkout"

- Pantalla: `SCR-FU-001` | Actor: GUEST/CUSTOMER | Estado: `BORRADOR` con ≥1 ítem, o `COTIZACIÓN` vigente
- Operación funcional: `OPS-FU-006` | Proceso de origen: 6.1, 6.2
- Precondiciones: ≥1 ítem; stock suficiente; si viene de `COTIZACIÓN`, debe estar vigente
- Postcondiciones: FU en `PEDIDO`; `Order` creado en `PENDING_PAYMENT`
- Errores posibles: `409` (stock insuficiente); `410 Gone` (cotización expirada)
- Excepciones: si la cotización expira en el instante exacto del click, el sistema redirige al flujo de expiración en vez de crear un Pedido inválido
- Restricciones: `RN-CHECKOUT-01`, `RN-CHECKOUT-02`
- Impacto en la FSM: ejecuta `FU-T-04`/`FU-T-09` | Eventos generados: `EVT-FU-005`
- Confirmación: no | Mensaje: ninguno | Navegación posterior: `NAV-CHK-001` | Permisos: owner

#### `BTN-FU-006` — "Ir a productos"

- Pantalla: `SCR-FU-001` | Actor: todos | Estado: FU vacío
- Operación funcional: **ninguna** (navegación pura, huérfano intencional)
- Impacto en la FSM: ninguno | Eventos generados: ninguno
- Navegación posterior: `NAV-CAT-001` | Permisos: ninguno

#### `BTN-FU-007` — "Descargar PDF"

- Pantalla: `SCR-FU-001`/`SCR-FU-002` | Actor: CUSTOMER | Estado: `COTIZACIÓN` (o histórico con `pdf_url`)
- Operación funcional: `OPS-FU-007` | Proceso de origen: 6.2
- Precondiciones: `pdf_url` existe
- Postcondiciones: ninguna (lectura)
- Errores posibles: `404` si el archivo fue removido
- Excepciones: ninguna | Impacto en la FSM: ninguno | Eventos generados: ninguno
- Confirmación: no | Navegación posterior: ninguna | Permisos: owner

#### `BTN-FU-008` — "Regenerar Cotización"

- Pantalla: `SCR-FU-001` | Actor: CUSTOMER | Estado: `EXPIRADA`
- Operación funcional: `OPS-FU-008` | Proceso de origen: 6.2
- Precondiciones: FU en `EXPIRADA`
- Postcondiciones: FU en `BORRADOR`; `expires_at`/`pdf_url` limpiados
- Errores posibles: ninguno esperado | Excepciones: ninguna
- Impacto en la FSM: ejecuta `FU-T-11` | Eventos generados: `EVT-FU-007`
- Confirmación: sí | Mensaje: "Puedes generar una nueva cotización" | Navegación posterior: permanece en `BORRADOR` | Permisos: owner

#### `BTN-FU-009` — "Usar mi lista anterior"

- Pantalla: `CMP-FU-012` (modal) | Actor: CUSTOMER | Estado: conflicto de migración detectado
- Operación funcional: `OPS-FU-009` | Proceso de origen: 6.1, 6.2
- Precondiciones: existen dos FU en `BORRADOR` en conflicto
- Postcondiciones: FU del GUEST eliminado; FU del CUSTOMER sin cambios
- Errores posibles: ninguno esperado | Impacto en la FSM: ninguno
- Eventos generados: `EVT-FU-008` (variante descarte)
- Confirmación: sí | Navegación posterior: permanece en `SCR-FU-001` | Permisos: CUSTOMER

#### `BTN-FU-010` — "Combinar listas"

- Pantalla: `CMP-FU-012` (modal) | Actor: CUSTOMER | Estado: conflicto de migración detectado
- Operación funcional: `OPS-FU-009` | Proceso de origen: 6.1, 6.2
- Precondiciones: igual a `BTN-FU-009`
- Postcondiciones: ítems combinados (cantidades sumadas si coincide producto); FU del GUEST eliminado
- Errores posibles: `409` si la combinación supera el stock disponible
- Excepciones: si supera el stock, se agrega con la cantidad máxima disponible y se notifica, sin fallar la operación completa
- Impacto en la FSM: ninguno | Eventos generados: `EVT-FU-008` (variante combinación)
- Confirmación: no | Mensaje: "Listas combinadas" | Navegación posterior: permanece en `SCR-FU-001` | Permisos: CUSTOMER

#### `BTN-FU-011` — "Ver detalle" (fila historial)

- Pantalla: `SCR-FU-002` | Actor: CUSTOMER | Estado: cualquiera
- Operación funcional: `OPS-FU-010` (sub-acción) | Proceso de origen: 6.1, 6.2, 6.3
- Precondiciones: el FU pertenece al CUSTOMER
- Postcondiciones: ninguna (lectura) | Errores posibles: `403` si no pertenece al actor
- Impacto en la FSM: ninguno | Eventos generados: ninguno
- Confirmación: no | Navegación posterior: `NAV-FU-003` | Permisos: owner

---

### Acciones (ACT)

|ID|Acción|Pantalla|Actor|Operación asociada|Resultado|Restricciones|
|---|---|---|---|---|---|---|
|`ACT-FU-001`|Incrementar/decrementar cantidad inline|`SCR-FU-001`|GUEST/CUSTOMER|`OPS-FU-001`|Recalcula subtotal/total; valida stock|FU en `BORRADOR`; `quantity ≥ 1`|
|`ACT-FU-002`|Escribir cantidad directamente|`SCR-FU-001`|GUEST/CUSTOMER|`OPS-FU-001`|Igual que `ACT-FU-001`, validación on-blur|Igual que `ACT-FU-001`|
|`ACT-FU-003`|Filtrar historial por estado|`SCR-FU-002`|CUSTOMER|`OPS-FU-010`|Refiltra tabla|Ninguna|

---

### Navegación (NAV)

|ID|Desde|Hacia|Disparador|Flujo|Condición de entrada|Permisos|Bloqueado si|
|---|---|---|---|---|---|---|---|
|`NAV-FU-001`|`SCR-CAT-001/002`|`SCR-FU-001`|Tras `OPS-CAT-003`, o navegación manual|Principal|Ninguna|Ninguno|Nunca|
|`NAV-FU-002`|Cualquiera|`SCR-FU-001`|Ícono FU en header|Principal|Ninguna|Ninguno|Nunca|
|`NAV-FU-003`|`SCR-FU-002`|Vista detalle|`BTN-FU-011`|Alternativo|FU pertenece al actor|owner|FU no pertenece al actor|
|`NAV-CTA-002`|Menú de cuenta|`SCR-FU-002`|Click en "Mis Formatos Únicos"|Principal|Sesión CUSTOMER activa|CUSTOMER|Sin sesión|

---

### Funcionalidades Automáticas (AUTO)

#### `AUTO-FU-001` — Recalculo de totales

- **Evento disparador:** cualquier cambio de cantidad/ítem (`OPS-FU-001`, `OPS-FU-002`, `OPS-FU-003`)
- **Responsable:** sistema (cálculo derivado)
- **Condiciones de ejecución:** siempre tras mutación de ítems en `BORRADOR`
- **Resultado esperado:** `subtotal`, `igv` (18%), `total` actualizados y consistentes
- **Manejo de errores:** si el cálculo falla, se bloquea la transición a estados posteriores hasta resolver

#### `AUTO-FU-002` — Expiración de COTIZACIÓN

- **Evento disparador:** scheduler diario (cron, consolidado vía `AUTO-SYS-002` en `MOD-SYS-01`)
- **Responsable:** sistema (job programado)
- **Condiciones de ejecución:** `FormatoUnico.state = COTIZACIÓN AND expires_at < now`
- **Resultado esperado:** ejecuta `FU-T-10`; FU pasa a `EXPIRADA`
- **Manejo de errores:** idempotente y reintentable, verifica `state` actual antes de transicionar

#### `AUTO-FU-003` — Detección de conflicto GUEST→CUSTOMER

- **Evento disparador:** login exitoso de CUSTOMER con `guest_token` activo y FU en `BORRADOR`
- **Responsable:** sistema (hook post-autenticación, originado en `MOD-AUT-01`)
- **Condiciones de ejecución:** existe FU de GUEST en `BORRADOR` Y FU de CUSTOMER en `BORRADOR`
- **Resultado esperado:** dispara `CMP-FU-012`
- **Manejo de errores:** si solo existe uno de los dos FU, se migra automáticamente sin modal

#### `AUTO-FU-004` — Validación de stock pre-transición

- **Evento disparador:** click en `BTN-FU-003`, `BTN-FU-004` o `BTN-FU-005`
- **Responsable:** sistema (validación server-side)
- **Condiciones de ejecución:** antes de ejecutar cualquier transición de estado del FU
- **Resultado esperado:** transición permitida solo si todos los ítems tienen stock suficiente
- **Manejo de errores:** rechaza con `409` y lista de productos sin stock; no se ejecuta la transición ni se fija el precio

#### `AUTO-FU-005` — Fijación de precio

- **Evento disparador:** ejecución exitosa de `FU-T-03`, `FU-T-04`, `FU-T-07` o `FU-T-09`
- **Responsable:** sistema (misma transacción atómica que la transición de estado)
- **Condiciones de ejecución:** primera vez que el FU transiciona a `COTIZACIÓN` o `PEDIDO`
- **Resultado esperado:** `price_at_time` copiado desde `Product.price_public`, inmutable
- **Manejo de errores:** si falla, la transición completa se revierte

---

### Eventos de Dominio (EVT)

|ID|Evento|Disparado por|
|---|---|---|
|`EVT-FU-001`|`FormatoUnicoCreado`|`OPS-CAT-003` (condicional)|
|`EVT-FU-002`|`ItemAgregado`/`ItemActualizado`/`ItemEliminado`|`OPS-CAT-003`, `OPS-FU-001`, `OPS-FU-002`, `OPS-FU-003`|
|`EVT-FU-003`|`ConsultaIniciada`|`OPS-FU-004`|
|`EVT-FU-004`|`CotizacionGenerada`|`OPS-FU-005`|
|`EVT-FU-005`|`PedidoIniciado`|`OPS-FU-006`|
|`EVT-FU-006`|`CotizacionExpirada`|`AUTO-FU-002`|
|`EVT-FU-007`|`CotizacionRegenerada`|`OPS-FU-008`|
|`EVT-FU-008`|`FormatoUnicoMigrado`/`FormatoUnicoCombinado`|`OPS-FU-009`|
|`EVT-FU-011`|`FormatoUnicoReintentado`|`OPS-FU-011`|
|`EVT-FU-012`|`ConsultaResuelta`|`OPS-CON-003` (disparado desde `MOD-CON-01`, mutando este agregado)|

---

### Reglas de Negocio relacionadas (RN)

`RN-GUEST-01`, `RN-FU-03`, `RN-FU-05` _(reservada para el comportamiento de expiración, ya implementado vía `FU-T-10`)_, `RN-CHECKOUT-01`, `RN-CHECKOUT-02`, `RN-GUEST-MIGRATE-01`, `RN-CONSULTA-ASSIGN-01` (heredada, gobierna el destino de `OPS-FU-004`), `RN-CHK-009`, `RN-CHK-010` (heredadas de `MOD-CHK-01`, gobiernan `OPS-FU-011`)

### Requisitos Funcionales relacionados (RF)

`RF-FU-001` a `RF-FU-011`

### Requisitos No Funcionales relacionados (RNF)

Ninguno propio identificado más allá de los ya cubiertos transversalmente en `MOD-CAT-01` (`RNF-CAT-001`, performance de lectura). No se infiere un RNF adicional sin base explícita en el contexto original.

### Historias de Usuario relacionadas (HU)

`HU-FU-001` a `HU-FU-011`

### Casos de Uso relacionados (UC)

`UC-FU-001` a `UC-FU-007`, y `UC-CHK-004` (compartido con `MOD-CHK-01` para `OPS-FU-011`)

### Criterios de Aceptación relacionados (CA)

`CA-FU-001` a `CA-FU-011`

### Casos de Prueba relacionados (TEST)

`TEST-FU-001` a `TEST-FU-011`

---

### Notas de diseño y decisiones del módulo

**Botón sin operación funcional:** `BTN-FU-006` se mantiene como huérfano intencional (navegación pura), igual criterio que `BTN-CAT-005`.

**`OPS-FU-011` y su botón disparador viven en módulos distintos:** se documenta explícitamente que `BTN-CHK-003` (definido en `MOD-CHK-01`) es el disparador de esta operación, porque la operación muta el agregado `FormatoUnico` y por tanto pertenece conceptualmente a este módulo, no a checkout. Esta separación botón/operación entre módulos ya estaba prevista por el diseño de la plantilla (una OPS puede ser disparada desde fuera de su propio módulo) y se hace explícita aquí para evitar ambigüedad de "dónde vive" la lógica.

**Corrección de nombre de atributo:** se actualiza la referencia de `FormatoUnico.order_id` a `FormatoUnico.current_order_id`, consistente con el ajuste de cardinalidad 1:N decidido durante la sesión de `MOD-CHK-01` (un FU puede tener múltiples Orders históricos; solo uno activo a la vez).

---

### Impacto en documentos globales

- **Modelo de Dominio:** sin cambios nuevos en esta normalización (los cambios de cardinalidad FU↔Order y el renombrado a `current_order_id` ya fueron señalados como pendientes durante la sesión de `MOD-CHK-01`; esta normalización solo confirma y referencia esa pendiente, no la duplica).
- **FSM:** sin cambios nuevos. Confirma el uso de `FU-T-14`, ya incorporada a la FSM-01 en la sesión de `MOD-CHK-01`.
- **Arquitectura:** sin cambios.
- **Base de Datos:** sin cambios nuevos (pendiente ya señalado: índice sobre `Order.formato_unico_id` dado el cambio de cardinalidad).
- **Decisiones Técnicas:** sin cambios.
- **Catálogo Global de Eventos:** se debe incorporar `EVT-FU-011` (`FormatoUnicoReintentado`) y confirmar la incorporación de `EVT-FU-012` (`ConsultaResuelta`), ya señalada como pendiente en la sesión de `MOD-CON-01`.
---

## 🆕 EXTENSIONES v1.2 (Mejoras UI/UX e Integraciones)

### 📋 Nuevos Requisitos Funcionales
- **RF-FU-012:** Dashboard del Customer (HOME-CUSTOMER) con notificaciones FSM
- **RF-FU-013:** Carga masiva por Excel/CSV
- **RF-FU-014:** Descarga de plantilla Excel
- **RF-FU-015:** Mapeo dinámico de columnas Excel
- **RF-FU-016:** Resolución individual de conflictos vía Telegram
- **RF-FU-017:** Consulta masiva (bulk) vía Telegram
- **RF-FU-018:** Banners dinámicos FSM en Formato Único
- **RF-FU-019:** Doble validación de importación Excel (modal + inline)

### 🖼️ Nueva Pantalla (SCR-*)

**SCR-FU-002: Dashboard del Customer (HOME-CUSTOMER)**
- **Propósito:** Centro de control personalizado post-login
- **Permisos:** CUSTOMER only
- **Redirección:** HOME → Dashboard (si está autenticado)
- **Componentes:**
  - CMP-FU-013: Panel de notificaciones FSM
  - CMP-FU-014: Widget de Formato Único activo
  - CMP-FU-015: Accesos rápidos
  - CMP-FU-016: Cross-selling de novedades
- **Navegación:**
  - Desde: Header (HOME), Login exitoso
  - Hacia: SCR-FU-001 (clic en FU activo), SCR-CAT-001 (catálogo), SCR-COT-001 (mis cotizaciones)

### 🔧 Nuevos Componentes (CMP-*)

**CMP-FU-013: Panel de Notificaciones FSM**
- Badge numérico en header
- Lista desplegable de notificaciones:
  - "Cotización #COT-XXX expirará en 24h" (amarillo)
  - "Respuesta a consulta recibida" (azul)
  - "Pedido #ORD-XXX confirmado" (verde)
- Click en notificación → navega al FU/Order correspondiente

**CMP-FU-014: Widget de Formato Único Activo**
- Muestra el FU más reciente según estado:
  - BORRADOR: Tabla editable + botones de acción
  - COTIZACIÓN: Read-only + countdown + botón "Comprar"
  - CONSULTA: Read-only + banner "En revisión"
- Countdown visible si COTIZACIÓN (RN-FU-03: 15 días)

**CMP-FU-015: Accesos Rápidos**
- Grid de 4 botones:
  - "Ver catálogo" → SCR-CAT-001
  - "Mis cotizaciones" → SCR-COT-001
  - "Mis consultas" → SCR-CON-001
  - "Historial de pedidos" → SCR-CHK-003

**CMP-FU-016: Dropzone de Carga Excel**
- Área drag & drop
- Botón "Seleccionar archivo"
- Restricciones: 5MB max, .xls/.xlsx/.csv
- Barra de progreso durante carga

**CMP-FU-017: Modal de Mapeo de Columnas**
- Se muestra si columnas del Excel no coinciden con plantilla
- Dropdowns para mapear: "Tu columna" → "SKU/Cantidad"
- Preview de primeras 5 filas

**CMP-FU-018: Tabla de Pre-visualización Excel**
- Muestra filas procesadas
- Badges por fila:
  - Verde: "OK - Stock confirmado"
  - Naranja: "Advertencia - Stock insuficiente"
  - Rojo: "Error - SKU no existe"
- Checkboxes para seleccionar qué filas importar

**CMP-FU-019: Banner FSM Dinámico**
- **COTIZACIÓN:** Amarillo/naranja suave
  - Texto: "Esta cotización es válida por: [06 días 23 hrs]"
  - Countdown en tiempo real
- **CONSULTA:** Azul
  - Texto: "En revisión por un asesor técnico"
- **EXPIRADA:** Rojo suave
  - Texto: "Cotización Expirada. Regenere el formato"
- **PEDIDO:** Azul
  - Texto: "Procesando pago..."

**CMP-FU-020: Botón de Consulta Masiva Telegram**
- Se muestra si hay >1 fila roja en tabla
- Texto: "Consultar [N] productos sin stock por Telegram"
- Icono de Telegram
- Estilo: Borde azul/turquesa

### 🔘 Nuevos Botones (BTN-*)

**BTN-FU-011: Importar Excel**
- **Acción:** Abre modal de carga
- **Habilitado:** Solo en estado BORRADOR
- **Permiso:** GUEST, CUSTOMER

**BTN-FU-012: Descargar Plantilla**
- **Acción:** Descarga archivo .xlsx de ejemplo
- **Contenido:** Columnas "SKU" y "Cantidad" con datos de ejemplo
- **Permiso:** GUEST, CUSTOMER

**BTN-FU-013: Confirmar Importación Excel**
- **Acción:** POST /formato-unico/import
- **Payload:** Array de ítems validados
- **Validación:** Al menos 1 fila sin errores
- **Postcondición:** Ítems agregados al FU

**BTN-FU-014: Consultar por Telegram (Individual)**
- **Acción:** Abre t.me con payload individual
- **Payload:** "Hola, intenté agregar [SKU] pero indica falta de stock. ¿Tienen fecha de ingreso?"
- **Permiso:** GUEST, CUSTOMER

**BTN-FU-015: Consultar Masivo por Telegram**
- **Acción:** Abre t.me con payload concatenado
- **Payload:** Lista de todos los SKUs en rojo
- **Permiso:** GUEST, CUSTOMER

**BTN-FU-016: Limpiar Filas con Error**
- **Acción:** Elimina todas las filas rojas del FU
- **Confirmación:** Modal "¿Eliminar [N] productos en conflicto?"
- **Postcondición:** Botón "Generar Cotización" se habilita

### 📜 Nuevas Reglas de Negocio

**RN-GUEST-MIGRATE-01:** Fusión automática de carritos GUEST → CUSTOMER
**RN-EXCEL-01:** Archivo Excel max 5MB, columnas SKU + Cantidad obligatorias
**RN-EXCEL-02:** SKU no existe → fila roja, no bloquea procesamiento
**RN-EXCEL-03:** Stock insuficiente → fila naranja, usuario decide
**RN-EXCEL-MAP-01:** Mapeo dinámico de columnas si difieren de plantilla
**RN-TG-02:** Integración Telegram solo deep links (sin bot)
**RN-NOTIF-01:** Eventos notificables: cotización por expirar (<24h), respuesta consulta, pedido confirmado

### 🔄 Impacto en Actores

**GUEST:**
- ✅ Puede cargar Excel en BORRADOR
- ✅ Puede consultar por Telegram productos sin stock
- ⚠️ Al autenticarse, se fusiona su FU con el de CUSTOMER (RN-GUEST-MIGRATE-01)

**CUSTOMER:**
- ✅ Dashboard personalizado (SCR-FU-002)
- ✅ Notificaciones FSM en header
- ✅ Múltiples FU en historial
- ✅ Carga masiva Excel
- ✅ Favoritos desde header

**SELLER:**
- ✅ Ve alertas de notificaciones (pedidos por despachar)
- ⚠️ Debe ver desglose de Kits en pedidos

**ADMIN:**
- ✅ Ve métricas de cargas Excel (RF-ADM-007)

**NAV-FU-006:** Header (HOME) → SCR-FU-002 (Dashboard, si CUSTOMER)
**NAV-FU-007:** SCR-FU-002 → SCR-FU-001 (clic en FU activo)
**NAV-FU-008:** SCR-FU-001 → Modal Excel (BTN-FU-011)
**NAV-FU-009:** SCR-FU-001 → Telegram (BTN-FU-014/015)

---

### 🕵️ ESPECIFICACIONES ADICIONALES v1.3 (Integración de Brechas)

#### `BRG-NAV-001` — persistent Link & Count en Header Global
- **Especificación:** Se añade el botón global `CMP-HEADER-CART-BUTTON` en la barra de navegación del frontend. Al cargar cualquier pantalla, el cliente consulta `/formatos/me`. El total de ítems acumulados se refleja en el badge del botón. Si se hace click, se navega directo a `SCR-FU-001` (`/formatos`).

#### `BRG-CROSS-001` — Sincronización de Precios en Borrador
- **Especificación:** Al ejecutar `GET /formatos/me`, si el Formato Único se encuentra en estado `BORRADOR`, el backend actualiza de forma síncrona el campo `price_at_time` de cada `FormatoUnicoItem` con el precio actual del catálogo (`Product.price_public`), recalculando los subtotales antes de responder. Si el estado es `COTIZACION` o superior, el precio se mantiene congelado (inmutable).

#### `BRG-CROSS-005` — Tarea de Liberación de Stock Reservado
- **Especificación:** Se añade la lógica programada en el backend (`AUTO-CHK-003`) que corre cada 5 minutos. Esta tarea escanea las órdenes en estado `PENDING_PAYMENT` y si la diferencia entre la hora actual y su creación excede 30 minutos, libera las reservas (`reserved_stock` vuelve a disponible) y marca la orden y el FU como `CANCELADO`.


---

### 🔘 Mapeo de Botones Existentes y Requerimiento de Color

| ID Botón | Nombre / Función del Botón | Componente / Archivo Frontend | Requerimiento de Color |
| :--- | :--- | :--- | :--- |
| **`BTN-FU-001`** | Vaciar Formato Único | `src/components/formato/FormatoTable.tsx` | **Rojo Peligro (`#EF4444`)** con texto rojo / hover fondo rojo claro (`#FEF2F2`). |
| **`BTN-FU-002`** | Eliminar Ítem del Carrito (Ícono Tacho) | `src/components/formato/FormatoTable.tsx` | **Rojo Peligro (`#EF4444`)** en el icono de eliminación. |
| **`BTN-FU-003`** | Solicitar Asesoría Preventa | `src/components/formato/BannerFSM.tsx` | **Azul Informativo (`#2563EB`)** con texto blanco. |
| **`BTN-FU-004`** | Generar Cotización | `src/components/formato/BannerFSM.tsx` | **Verde Esmeralda CTA (`#10B981`)** con texto blanco. |
| **`BTN-FU-005`** | Iniciar Checkout / Pagar Pedido | `src/components/formato/BannerFSM.tsx` | **Verde Esmeralda CTA (`#10B981`)** con texto blanco. |
| **`BTN-FU-006`** | Cargar Excel Masivo | `src/components/formato/ExcelImporter.tsx` | **Verde Esmeralda (`#10B981`)** con texto blanco. |
| **`BTN-FU-007`** | Descargar Plantilla Excel | `src/components/formato/ExcelImporter.tsx` | **Gris Neutro Secundario (`#4B5563`)** con texto blanco. |
| **`BTN-FU-008`** | Recomprar Todo (Historial) | `src/components/formato/RepurchaseWidget.tsx` | **Verde Esmeralda (`#10B981`)** con texto blanco. |
