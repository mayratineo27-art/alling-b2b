
## MOD-CON01 — Consulta Pre-Venta (vista SELLER)

### Objetivo

Permitir que un SELLER reciba, atienda y resuelva consultas pre-venta generadas por GUEST/CUSTOMER desde su Formato Único, brindando asesoría comercial humana antes de una decisión de compra o cotización formal.

### Actores

SELLER (atiende), GUEST/CUSTOMER (origina la consulta, gestionado en `MOD-FU-01`), ADMIN (visibilidad de supervisión, sin interacción directa documentada en el contexto original)

### Procesos de negocio de origen

Proceso 6.3 (Consulta Pre-Venta)

### Integraciones

Ninguna externa. Depende internamente de `MOD-FU-01` (el FU en estado `CONSULTA`/`RESUELTA` es la entidad que este módulo gestiona desde el lado SELLER)

---

### Operaciones Funcionales (OPS)

#### `OPS-CON-001` — Ver cola de consultas pendientes

- **Objetivo de negocio:** dar visibilidad centralizada de toda la demanda de asesoría aún no atendida, permitiendo que cualquier SELLER disponible la tome
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.3
- **Estados de FSM involucrados:** `FormatoUnico.state = CONSULTA` (lectura, sin filtro de asignación — incluye asignadas y no asignadas)
- **Entidades afectadas:** ninguna (lectura de `FormatoUnico[]`)
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-CON-001`
- **Botones/acciones que la disparan:** `ACT-CON-001`, `ACT-CON-002`
- **Resultado esperado:** listado filtrable/ordenable de consultas en estado `CONSULTA`
- **Servicios de dominio involucrados:** `FormatoUnicoQueryService` (lectura especializada de FU por estado y rol)
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CONSULTA-ASSIGN-01` (ya resuelta en Sesión 1: asignación manual, sin round-robin)
- **RF relacionados:** `RF-CON-001`
- **HU relacionadas:** `HU-CON-001`
- **UC relacionados:** `UC-CON-001`
- **CA relacionados:** `CA-CON-001`
- **TEST relacionados:** `TEST-CON-001`

#### `OPS-CON-002` — Tomar (asignarse) una consulta

- **Objetivo de negocio:** convertir una consulta huérfana en una consulta con responsable claro, evitando que dos SELLERs trabajen sobre el mismo lead simultáneamente
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.3
- **Estados de FSM involucrados:** `FormatoUnico.state = CONSULTA` (no cambia de estado; solo se fija `seller_id`)
- **Entidades afectadas:** `FormatoUnico` (asigna `seller_id`)
- **Eventos de dominio:** `EVT-CON-001` (`ConsultaAsignada`)
- **Pantallas:** `SCR-CON-001`
- **Botones/acciones que la disparan:** `BTN-CON-001`
- **Resultado esperado:** la consulta queda asignada al SELLER que la tomó; desaparece de la cola "sin asignar" para otros SELLERs
- **Servicios de dominio involucrados:** `FormatoUnicoQueryService`, `StateMachineService` (aunque no cambia `state`, sí muta el agregado)
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CONSULTA-ASSIGN-01`, `RN-CON-001` _(nueva referencia reservada: "una consulta solo puede tener un SELLER asignado a la vez")_
- **RF relacionados:** `RF-CON-002`
- **HU relacionadas:** `HU-CON-002`
- **UC relacionados:** `UC-CON-001` (sub-flujo)
- **CA relacionados:** `CA-CON-002`
- **TEST relacionados:** `TEST-CON-002`

#### `OPS-CON-003` — Responder consulta

- **Objetivo de negocio:** entregar asesoría comercial que permita al cliente decidir entre convertir su interés en cotización formal o descartarlo
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.3
- **Estados de FSM involucrados:** `CONSULTA → RESUELTA` (`FU-T-05`)
- **Entidades afectadas:** `FormatoUnico` (cambia `state`, escribe `consultant_note`), `FormatoUnicoTransition` (registro de auditoría)
- **Eventos de dominio:** `EVT-FU-012` _(nuevo, no estaba en el catálogo de eventos de MOD-FU-01 original — ver nota de actualización al cierre)_ (`ConsultaResuelta`)
- **Pantallas:** `SCR-CON-002`
- **Botones/acciones que la disparan:** `BTN-CON-002`
- **Resultado esperado:** FU en `RESUELTA`; cliente notificado (canal pendiente de definir, ver nota de diseño); nota de asesoría visible para el cliente
- **Servicios de dominio involucrados:** `StateMachineService`, `NotificationService` (si se decide notificar por email, ver nota de diseño abajo)
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CON-002` _(nueva referencia reservada: "solo el SELLER asignado puede responder la consulta")_
- **RF relacionados:** `RF-CON-003`
- **HU relacionadas:** `HU-CON-003`
- **UC relacionados:** `UC-CON-002`
- **CA relacionados:** `CA-CON-003`
- **TEST relacionados:** `TEST-CON-003`

#### `OPS-CON-004` — Filtrar y buscar consultas

- **Objetivo de negocio:** permitir al SELLER priorizar su carga de trabajo (consultas propias vs. cola general, por fecha, por estado)
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.3
- **Estados de FSM involucrados:** ninguno (filtro sobre la operación de lectura `OPS-CON-001`)
- **Entidades afectadas:** ninguna
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-CON-001`
- **Botones/acciones que la disparan:** `ACT-CON-001`, `ACT-CON-002`, `ACT-CON-003`
- **Resultado esperado:** listado refinado según criterio
- **Servicios de dominio involucrados:** `FormatoUnicoQueryService`
- **Prioridad funcional:** MVP+
- **RN relacionadas:** ninguna
- **RF relacionados:** `RF-CON-004`
- **HU relacionadas:** `HU-CON-004`
- **UC relacionados:** `UC-CON-001` (sub-flujo)
- **CA relacionados:** `CA-CON-004`
- **TEST relacionados:** `TEST-CON-004`

---

### Pantallas (SCR)

#### `SCR-CON-001` — Cola de consultas (`/vendedor/consultas`)

- **Propósito:** listar todas las consultas pendientes (asignadas y sin asignar) para que el SELLER priorice su trabajo
- **Objetivo de negocio:** maximizar la tasa de respuesta a leads de asesoría, minimizando el tiempo de primera respuesta
- **Valor para el usuario (SELLER):** visibilidad total de su carga de trabajo y de la demanda general
- **Valor para el negocio:** convierte consultas en cotizaciones/ventas; reduce fuga de leads no atendidos
- **Actores autorizados:** SELLER
- **Estados:** vacío (sin consultas pendientes), con datos, cargando, error de red
- **Permisos:** requiere sesión SELLER (o ADMIN, si se decide dar visibilidad de supervisión — pendiente de definición, ver nota de diseño)
- **Dependencias con otras pantallas:** alimenta `SCR-CON-002` (detalle/respuesta); depende de `MOD-FU-01` como origen de las consultas
- **Navegación de entrada:** `NAV-CON-002` (menú del panel SELLER)
- **Navegación de salida:** `NAV-CON-003` (→detalle de consulta)

#### `SCR-CON-002` — Detalle y respuesta de consulta (`/vendedor/consultas/[id]`)

- **Propósito:** ver el contenido del Formato Único consultado y redactar la respuesta de asesoría
- **Objetivo de negocio:** ser el punto de conversión donde la asesoría humana se traduce en una decisión comercial siguiente (cotización o descarte por parte del cliente)
- **Valor para el usuario (SELLER):** contexto completo del cliente y sus productos de interés en una sola vista
- **Valor para el negocio:** calidad de la asesoría impacta directamente en tasa de conversión a cotización
- **Actores autorizados:** SELLER asignado a esa consulta (ver `RN-CON-002`, reservada)
- **Estados:** consulta sin responder (formulario de respuesta activo), consulta ya respondida (solo lectura, esperando decisión del cliente)
- **Permisos:** `seller_id` del FU debe coincidir con el actor
- **Dependencias con otras pantallas:** depende de `SCR-CON-001` como origen; su resultado es consumido por `SCR-FU-001` (donde el cliente ve la respuesta y decide)
- **Navegación de entrada:** `NAV-CON-003`
- **Navegación de salida:** `NAV-CON-004` (volver a la cola)

---

### Componentes (CMP)

**`SCR-CON-001`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-CON-001`|Tabla de consultas|Soporta `OPS-CON-001`|`FormatoUnico[]` en `CONSULTA`|selección de fila|`CMP-CON-002`, `CMP-CON-003`|
|`CMP-CON-002`|Filtro de estado de asignación|Soporta `OPS-CON-004`|—|`assigned_to_me` boolean|`CMP-CON-001`|
|`CMP-CON-003`|Filtro de fecha|Soporta `OPS-CON-004`|—|rango de fechas|`CMP-CON-001`|
|`CMP-CON-004`|Badge de antigüedad|Comunica urgencia visual (sin SLA formal definido, ver nota de diseño)|`FormatoUnico.created_at`|—|—|
|`CMP-CON-005`|Estado vacío|Orienta cuando no hay consultas|resultado vacío|—|—|
|`CMP-CON-006`|Paginación|Navega resultados|total de resultados|página solicitada|`CMP-CON-001`|

**`SCR-CON-002`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-CON-007`|Detalle de ítems consultados|Da contexto de productos de interés|`FormatoUnicoItem[]`|—|—|
|`CMP-CON-008`|Datos de contacto del cliente|Email (GUEST) o perfil (CUSTOMER)|`FormatoUnico.guest_email` o `User`|—|—|
|`CMP-CON-009`|Editor de respuesta|Captura la asesoría del SELLER|—|`consultant_note: text`|`OPS-CON-003`|
|`CMP-CON-010`|Historial de transición|Muestra auditoría del FU (cuándo se creó, cuándo se asignó)|`FormatoUnicoTransition[]`|—|—|

---

### Botones (BTN)

#### `BTN-CON-001` — "Atender"

- Pantalla: `SCR-CON-001` | Actor: SELLER | Estado donde aparece: `FormatoUnico.seller_id IS NULL`
- Operación funcional: `OPS-CON-002`
- Proceso de negocio de origen: 6.3
- Precondiciones: la consulta no tiene SELLER asignado
- Postcondiciones: `seller_id` fijado al SELLER actual
- Errores posibles: `409` si otro SELLER la tomó en el instante exacto (condición de carrera); debe resolverse con bloqueo optimista (primer write gana, el segundo recibe error y la fila se actualiza)
- Excepciones: ninguna adicional
- Restricciones: `RN-CON-001` (reservada)
- Impacto en la FSM: ninguno (no cambia `state`, solo asigna)
- Eventos generados: `EVT-CON-001`
- Confirmación: no | Validación previa: ninguna | Mensaje: toast de confirmación | Navegación posterior: `NAV-CON-003` | Permisos: rol SELLER

#### `BTN-CON-002` — "Enviar respuesta"

- Pantalla: `SCR-CON-002` | Actor: SELLER | Estado donde aparece: consulta asignada al actor, sin responder, con texto en `CMP-CON-009`
- Operación funcional: `OPS-CON-003`
- Proceso de negocio de origen: 6.3
- Precondiciones: `seller_id = actor_id`; `consultant_note` no vacío
- Postcondiciones: FU en `RESUELTA`; nota visible para el cliente
- Errores posibles: `403` si el SELLER no es el asignado; `422` si la nota está vacía
- Excepciones: ninguna
- Restricciones: `RN-CON-002` (reservada)
- Impacto en la FSM: ejecuta `FU-T-05`
- Eventos generados: `EVT-FU-012`
- Confirmación: sí ("¿Enviar esta respuesta?") | Mensaje: toast | Navegación posterior: `NAV-CON-004` | Permisos: SELLER asignado

---

### Acciones (ACT)

|ID|Acción|Pantalla|Actor|Operación asociada|Resultado|
|---|---|---|---|---|---|
|`ACT-CON-001`|Cambiar filtro de asignación|`SCR-CON-001`|SELLER|`OPS-CON-004`|Refiltra entre "todas" / "mías"|
|`ACT-CON-002`|Cambiar rango de fecha|`SCR-CON-001`|SELLER|`OPS-CON-004`|Refiltra por antigüedad|
|`ACT-CON-003`|Click en fila de tabla|`SCR-CON-001`|SELLER|`OPS-CON-001` (navegación)|Navega a detalle|

---

### Navegación (NAV)

|ID|Desde|Hacia|Disparador|Flujo|Condición de entrada|Permisos|Bloqueado si|
|---|---|---|---|---|---|---|---|
|`NAV-CON-002`|Menú panel SELLER|`SCR-CON-001`|Click en "Consultas"|Principal|Sesión SELLER|SELLER|Sin sesión|
|`NAV-CON-003`|`SCR-CON-001`|`SCR-CON-002`|`BTN-CON-001` / `ACT-CON-003`|Principal|—|SELLER|—|
|`NAV-CON-004`|`SCR-CON-002`|`SCR-CON-001`|Tras `BTN-CON-002`, o navegación manual|Principal|—|SELLER|—|
|`NAV-CON-001` _(ya referenciado desde MOD-FU-01)_|`SCR-FU-001` (cliente)|confirmación visual en la misma pantalla|`BTN-FU-003`|Principal|—|owner del FU|—|

---

### Funcionalidades Automáticas (AUTO)

Este módulo no define funcionalidades automáticas propias. La expiración y el scheduler relacionados con el ciclo de vida del FU ya están cubiertos por `AUTO-FU-002` en `MOD-FU-01`. No se identifica, a partir del contexto disponible, ninguna automatización adicional propia de la vista SELLER de consultas (por ejemplo, un SLA automático con reasignación tras N horas sin respuesta no está documentado ni puede inferirse objetivamente — ver nota de diseño).

---

### Eventos de Dominio (EVT)

|ID|Evento|Disparado por|
|---|---|---|
|`EVT-CON-001`|`ConsultaAsignada`|`OPS-CON-002`|
|`EVT-FU-012` _(actualiza catálogo de MOD-FU-01)_|`ConsultaResuelta`|`OPS-CON-003`|

---

### Reglas de Negocio relacionadas (RN)

`RN-CONSULTA-ASSIGN-01` (resuelta en Sesión 1), `RN-CON-001` (reservada — unicidad de asignación), `RN-CON-002` (reservada — solo el asignado puede responder)

### Requisitos Funcionales relacionados (RF)

`RF-CON-001`, `RF-CON-002`, `RF-CON-003`, `RF-CON-004`

### Historias de Usuario relacionadas (HU)

`HU-CON-001`, `HU-CON-002`, `HU-CON-003`, `HU-CON-004`

### Casos de Uso relacionados (UC)

`UC-CON-001`, `UC-CON-002`

### Criterios de Aceptación relacionados (CA)

`CA-CON-001`, `CA-CON-002`, `CA-CON-003`, `CA-CON-004`

### Casos de Prueba relacionados (TEST)

`TEST-CON-001`, `TEST-CON-002`, `TEST-CON-003`, `TEST-CON-004`

---

### Notas de diseño y decisiones del módulo

**Vacío no resuelto (señalado, no inventado):** no existe en el contexto original ni en las sesiones previas una definición de SLA de respuesta para SELLER, ni de qué canal se usa para notificar al cliente que su consulta fue respondida (¿email? ¿solo se refleja al volver a `/formato`?). `CMP-CON-004` (badge de antigüedad) se documenta como elemento visual razonable de inferir, pero sin umbral de "urgente" definido porque no hay SLA. No inserto un valor arbitrario; queda como decisión pendiente.

**Visibilidad de ADMIN sobre consultas:** el contexto original no especifica si ADMIN puede ver la cola de consultas de SELLER como supervisión. Lo marco como actor "sin interacción documentada" en vez de asumir que sí o que no tiene acceso.

---



---

### 🔘 Mapeo de Botones Existentes y Requerimiento de Color

| ID Botón | Nombre / Función del Botón | Componente / Archivo Frontend | Requerimiento de Color |
| :--- | :--- | :--- | :--- |
| **`BTN-CON-001`** | Tomar Consulta Preventa | `src/app/vendedor/consultas/page.tsx` | **Azul Operativo (`#2563EB`)** con texto blanco. |
| **`BTN-CON-002`** | Enviar Respuesta a Cliente | `src/app/vendedor/consultas/[id]/page.tsx` | **Verde Esmeralda (`#10B981`)** con texto blanco. |
