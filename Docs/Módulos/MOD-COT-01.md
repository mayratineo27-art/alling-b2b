## MOD-COT-01 — Cotización (vista SELLER/B2B)

- **Objetivo:** dar visibilidad y herramientas de seguimiento a SELLER sobre las cotizaciones generadas por CUSTOMER, permitiendo gestión comercial sobre propuestas formales en curso (vigentes, expiradas, convertidas a pedido).
- **Actores:** SELLER (gestiona/visualiza), CUSTOMER (genera, gestionado desde `MOD-FU-01`), ADMIN (visibilidad de supervisión, sin interacción documentada explícitamente)
- **Procesos de negocio de origen:** Proceso 6.2 (Cotización B2B)
- **Integraciones:** ninguna externa. Depende internamente de `MOD-FU-01` (el FU en estado `COTIZACIÓN`/`EXPIRADA` es la entidad gestionada desde el lado SELLER)

---

### Operaciones Funcionales (OPS)

#### `OPS-COT-001` — Ver listado de cotizaciones

- **Objetivo de negocio:** dar visibilidad centralizada al equipo de ventas sobre el pipeline comercial B2B (cuántas cotizaciones están vigentes, próximas a expirar, ya convertidas o ya expiradas)
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.2
- **Estados de FSM involucrados:** `FormatoUnico.state IN (COTIZACIÓN, EXPIRADA, PEDIDO, CONFIRMADO)` (lectura agregada, sin filtro de propiedad — el contexto no asigna cotizaciones a un SELLER específico como sí ocurre con consultas)
- **Entidades afectadas:** ninguna (lectura de `FormatoUnico[]`)
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-COT-001`
- **Botones/acciones que la disparan:** `ACT-COT-001`, `ACT-COT-002`, `ACT-COT-003`
- **Resultado esperado:** listado filtrable/ordenable de cotizaciones con su estado y vigencia
- **Servicios de dominio involucrados:** `FormatoUnicoQueryService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-COT-001`
- **HU relacionadas:** `HU-COT-001`
- **UC relacionados:** `UC-COT-001`
- **CA relacionados:** `CA-COT-001`
- **TEST relacionados:** `TEST-COT-001`

#### `OPS-COT-002` — Ver detalle de cotización

- **Objetivo de negocio:** dar contexto completo (cliente, ítems, precios fijados, vigencia, historial) para soporte comercial proactivo
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.2
- **Estados de FSM involucrados:** cualquier estado histórico del FU que haya pasado por `COTIZACIÓN`
- **Entidades afectadas:** ninguna (lectura de `FormatoUnico`, `FormatoUnicoItem`, `FormatoUnicoTransition`)
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-COT-002`
- **Botones/acciones que la disparan:** `ACT-COT-004`
- **Resultado esperado:** vista completa de la cotización, incluyendo el PDF generado
- **Servicios de dominio involucrados:** `FormatoUnicoQueryService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-COT-002`
- **HU relacionadas:** `HU-COT-002`
- **UC relacionados:** `UC-COT-001` (sub-flujo)
- **CA relacionados:** `CA-COT-002`
- **TEST relacionados:** `TEST-COT-002`

#### `OPS-COT-003` — Descargar PDF de cotización (vista SELLER)

- **Objetivo de negocio:** permitir al SELLER acceder al mismo documento comercial que el cliente recibió, para soporte o seguimiento telefónico
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.2
- **Estados de FSM involucrados:** `COTIZACIÓN` o histórico con `pdf_url` no nulo
- **Entidades afectadas:** ninguna (lectura)
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-COT-002`
- **Botones/acciones que la disparan:** `BTN-COT-001`
- **Resultado esperado:** archivo PDF descargado
- **Servicios de dominio involucrados:** `OrderService` / almacenamiento de documentos (mismo mecanismo que `OPS-FU-007`)
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-COT-003`
- **HU relacionadas:** `HU-COT-003`
- **UC relacionados:** `UC-COT-001` (sub-flujo)
- **CA relacionados:** `CA-COT-003`
- **TEST relacionados:** `TEST-COT-003`

---

### Pantallas (SCR)

#### `SCR-COT-001` — Listado de cotizaciones (`/vendedor/cotizaciones`)

- **Propósito:** listar todas las cotizaciones generadas por clientes B2B, con su estado y vigencia
- **Objetivo de negocio:** dar visibilidad de pipeline comercial para priorizar seguimiento proactivo (ej. contactar antes de que expire)
- **Valor para el usuario (SELLER):** panorama completo del embudo de cotizaciones sin necesidad de consultar caso por caso
- **Valor para el negocio:** reduce pérdida de ventas por cotizaciones olvidadas que expiran sin seguimiento
- **Actores autorizados:** SELLER
- **Estados:** vacío (sin cotizaciones), con datos, cargando, error de red
- **Permisos:** requiere sesión SELLER
- **Dependencias con otras pantallas:** alimenta `SCR-COT-002`; depende de `MOD-FU-01` como origen del dato
- **Navegación de entrada:** `NAV-COT-002` (menú panel SELLER)
- **Navegación de salida:** `NAV-COT-003` (→detalle)

#### `SCR-COT-002` — Detalle de cotización (`/vendedor/cotizaciones/[id]`)

- **Propósito:** ver el contenido completo de una cotización específica, incluyendo PDF e historial
- **Objetivo de negocio:** soportar seguimiento comercial informado (saber exactamente qué se cotizó y a qué precio antes de contactar al cliente)
- **Valor para el usuario (SELLER):** evita tener que pedirle al cliente que reenvíe el PDF para dar seguimiento
- **Valor para el negocio:** mejora la calidad del seguimiento comercial, potencialmente incrementando tasa de conversión a `PEDIDO`
- **Actores autorizados:** SELLER
- **Estados:** vigente (con countdown), expirada (solo lectura, sin countdown), convertida a pedido (solo lectura, con indicador de éxito)
- **Permisos:** sesión SELLER (sin restricción de asignación, a diferencia de `MOD-CON-01`, porque el contexto no define propiedad de cotización por SELLER)
- **Dependencias con otras pantallas:** depende de `SCR-COT-001` como origen
- **Navegación de entrada:** `NAV-COT-003`
- **Navegación de salida:** `NAV-COT-004` (volver al listado)

---

### Componentes (CMP)

**`SCR-COT-001`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-COT-001`|Tabla de cotizaciones|Soporta `OPS-COT-001`|`FormatoUnico[]` en estados relevantes|selección de fila|`CMP-COT-002`, `CMP-COT-003`|
|`CMP-COT-002`|Filtro de estado|Soporta `OPS-COT-001`|—|`state[]` filtrados (vigente/expirada/convertida)|`CMP-COT-001`|
|`CMP-COT-003`|Filtro de fecha|Soporta `OPS-COT-001`|—|rango de fechas|`CMP-COT-001`|
|`CMP-COT-004`|Badge de vigencia|Comunica días restantes o expiración|`FormatoUnico.expires_at`|—|—|
|`CMP-COT-005`|Estado vacío|Orienta cuando no hay cotizaciones|resultado vacío|—|—|
|`CMP-COT-006`|Paginación|Navega resultados|total de resultados|página solicitada|`CMP-COT-001`|

**`SCR-COT-002`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-COT-007`|Detalle de ítems cotizados|Da contexto de productos y precios fijados|`FormatoUnicoItem[]` con `price_at_time`|—|—|
|`CMP-COT-008`|Datos del cliente|RUC/empresa, contacto|`User` (CUSTOMER)|—|—|
|`CMP-COT-009`|Visor de PDF embebido|Soporta `OPS-COT-002`|`pdf_url`|—|`BTN-COT-001`|
|`CMP-COT-010`|Historial de transición|Auditoría del FU|`FormatoUnicoTransition[]`|—|—|
|`CMP-COT-011`|Countdown de vigencia|Igual función que `CMP-FU-005`, vista SELLER|`FormatoUnico.expires_at`|—|—|

---

### Botones (BTN)

#### `BTN-COT-001` — "Descargar PDF" (vista SELLER)

- Pantalla: `SCR-COT-002` | Actor: SELLER | Estado donde aparece: `pdf_url` no nulo
- Operación funcional: `OPS-COT-003`
- Proceso de negocio de origen: 6.2
- Precondiciones: `pdf_url` existe
- Postcondiciones: ninguna (operación de lectura)
- Errores posibles: `404` si el archivo fue removido del storage
- Excepciones: ninguna
- Restricciones: ninguna
- Impacto en la FSM: ninguno
- Eventos generados: ninguno
- Confirmación: no | Mensaje: ninguno | Navegación posterior: ninguna | Permisos: rol SELLER

> **Nota de diseño:** este módulo tiene una superficie de botones deliberadamente reducida respecto a `MOD-CON-01`. A diferencia de las consultas, el contexto original no otorga al SELLER ninguna capacidad de mutación sobre una cotización (no puede modificarla, extenderla, ni cancelarla). Esto se señala explícitamente más abajo como vacío detectado, no como omisión accidental.

---

### Acciones (ACT)

|ID|Acción|Pantalla|Actor|Operación asociada|Resultado|
|---|---|---|---|---|---|
|`ACT-COT-001`|Cambiar filtro de estado|`SCR-COT-001`|SELLER|`OPS-COT-001`|Refiltra por vigente/expirada/convertida|
|`ACT-COT-002`|Cambiar rango de fecha|`SCR-COT-001`|SELLER|`OPS-COT-001`|Refiltra por antigüedad|
|`ACT-COT-003`|Ordenar tabla por columna|`SCR-COT-001`|SELLER|`OPS-COT-001`|Reordena resultados (ej. por vigencia ascendente)|
|`ACT-COT-004`|Click en fila de tabla|`SCR-COT-001`|SELLER|`OPS-COT-002` (navegación)|Navega a detalle|

---

### Navegación (NAV)

|ID|Desde|Hacia|Disparador|Flujo|Condición de entrada|Permisos|Bloqueado si|
|---|---|---|---|---|---|---|---|
|`NAV-COT-002`|Menú panel SELLER|`SCR-COT-001`|Click en "Cotizaciones"|Principal|Sesión SELLER|SELLER|Sin sesión|
|`NAV-COT-003`|`SCR-COT-001`|`SCR-COT-002`|`ACT-COT-004`|Principal|—|SELLER|—|
|`NAV-COT-004`|`SCR-COT-002`|`SCR-COT-001`|Navegación manual (breadcrumb/volver)|Principal|—|SELLER|—|

---

### Funcionalidades Automáticas (AUTO)

Este módulo no define funcionalidades automáticas propias. La expiración de cotizaciones ya está cubierta por `AUTO-FU-002` en `MOD-FU-01`; este módulo solo consume el resultado (lectura del estado `EXPIRADA`). No se identifica, a partir del contexto disponible, ninguna automatización adicional propia de la vista SELLER de cotizaciones (por ejemplo, una alerta automática "cotización vence en 24h" no está documentada ni puede inferirse como obligatoria — ver nota de diseño).

---

### Eventos de Dominio (EVT)

Este módulo no genera eventos de dominio propios. Consume eventos ya definidos en `MOD-FU-01` (`EVT-FU-004` `CotizacionGenerada`, `EVT-FU-006` `CotizacionExpirada`) para fines de visualización, sin disparar mutaciones nuevas.

---

### Reglas de Negocio relacionadas (RN)

Ninguna regla nueva propia de este módulo. Hereda y respeta `RN-CHECKOUT-02` (precio fijo al momento de cotización), ya definida en `MOD-FU-01`/Sesión 1, que es la que garantiza que lo que el SELLER ve en `CMP-COT-007` sea inmutable.

### Requisitos Funcionales relacionados (RF)

`RF-COT-001`, `RF-COT-002`, `RF-COT-003`

### Historias de Usuario relacionadas (HU)

`HU-COT-001`, `HU-COT-002`, `HU-COT-003`

### Casos de Uso relacionados (UC)

`UC-COT-001`

### Criterios de Aceptación relacionados (CA)

`CA-COT-001`, `CA-COT-002`, `CA-COT-003`

### Casos de Prueba relacionados (TEST)

`TEST-COT-001`, `TEST-COT-002`, `TEST-COT-003`

---

### Notas de diseño y decisiones del módulo

**Vacío detectado — ausencia de capacidad de gestión activa del SELLER sobre cotizaciones:** a diferencia de `MOD-CON-01` (donde el SELLER toma y responde), aquí el contexto original no otorga ninguna acción de mutación. No se infiere arbitrariamente una capacidad de "extender vigencia" o "anular cotización" porque no hay base objetiva en el contexto para definir sus reglas (¿quién autoriza una extensión? ¿hay límite de extensiones?). Se documenta como vista de solo consulta y seguimiento, consistente con lo que el contexto sí permite afirmar.

**Vacío detectado — ausencia de propiedad/asignación de cotización a un SELLER:** a diferencia de consultas (`RN-CONSULTA-ASSIGN-01`), no existe en el contexto ninguna mención de que las cotizaciones se asignen a un SELLER específico para seguimiento. Esto se documenta como visibilidad compartida entre todo el equipo SELLER, no como omisión sino como reflejo fiel de lo que el contexto permite afirmar.

**Visibilidad de ADMIN:** igual que en `MOD-CON-01`, no hay base en el contexto para definir si ADMIN tiene una vista de supervisión sobre cotizaciones. Se marca como no definido, no como ausente por decisión.

---

### Impacto en documentos globales

- **Modelo de Dominio:** sin cambios. No se introduce ningún atributo o entidad nuevo.
- **FSM:** sin cambios. Este módulo es de solo lectura sobre transiciones ya existentes (`FU-T-03`, `FU-T-07`, `FU-T-09`, `FU-T-10`); no ejecuta ninguna transición nueva.
- **Arquitectura:** sin cambios.
- **Base de Datos:** sin cambios.
- **Decisiones Técnicas:** sin cambios.
- **Catálogo Global de Eventos:** sin cambios. Este módulo no introduce eventos nuevos; consume `EVT-FU-004` y `EVT-FU-006` ya catalogados.

---

¿Continúo con `MOD-SEL-01` (Panel SELLER — stock, pedidos, guías) en el siguiente módulo?

---

### 🔘 Mapeo de Botones Existentes y Requerimiento de Color

| ID Botón | Nombre / Función del Botón | Componente / Archivo Frontend | Requerimiento de Color |
| :--- | :--- | :--- | :--- |
| **`BTN-COT-001`** | Aplicar Descuento Comercial B2B | `src/app/admin/cotizaciones/[id]/page.tsx` | **Naranja Ámbar (`#F59E0B`)** con texto blanco. |
| **`BTN-COT-002`** | Descargar PDF de Cotización | `src/app/vendedor/cotizaciones/[id]/page.tsx` | **Gris Oscuro (`#374151`)** con texto blanco. |
