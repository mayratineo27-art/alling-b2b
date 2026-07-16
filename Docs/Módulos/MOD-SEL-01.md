
## MOD-SEL-01 — Panel SELLER (Stock, Pedidos, Guías)

- **Objetivo:** dar al SELLER las herramientas operativas para gestionar inventario, atender la cola de pedidos pagados pendientes de envío y generar guías de despacho.
- **Actores:** SELLER (ejecuta todas las operaciones), ADMIN (visibilidad de supervisión, sin interacción documentada explícitamente), DISTRIBUTOR (origina actualizaciones de stock vía `MOD-DIS-01`, indirecto)
- **Procesos de negocio de origen:** Proceso 6.4 (Gestión SELLER), sub-flujos A (gestión de catálogo/stock), B (pedidos), C (guías de envío)
- **Integraciones:** Shalom (mock de generación de guía, sin API real en MVP según contexto original §3.2)

---

### Operaciones Funcionales (OPS)

#### `OPS-SEL-001` — Ver listado de productos para gestión de stock

- **Objetivo de negocio:** dar visibilidad operativa sobre el inventario para mantenerlo actualizado y evitar ventas sobre productos agotados
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.4.A
- **Estados de FSM involucrados:** ninguno (lectura de `Product`)
- **Entidades afectadas:** ninguna
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-SEL-001`
- **Botones/acciones que la disparan:** `ACT-SEL-001`, `ACT-SEL-002`
- **Resultado esperado:** listado de productos con stock actual y badge de alerta cuando corresponda
- **Servicios de dominio involucrados:** `ProductQueryService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CALC-03` (alerta de stock mínimo, resuelta en Sesión 1)
- **RF relacionados:** `RF-SEL-001`
- **HU relacionadas:** `HU-SEL-001`
- **UC relacionados:** `UC-SEL-001`
- **CA relacionados:** `CA-SEL-001`
- **TEST relacionados:** `TEST-SEL-001`

#### `OPS-SEL-002` — Actualizar stock de un producto

- **Objetivo de negocio:** mantener el inventario sincronizado con la realidad física, condición necesaria para que `RN-CHECKOUT-01` (validación de stock) funcione correctamente en todo el sistema
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.4.A
- **Estados de FSM involucrados:** ninguno (no afecta FSM de FU/Order directamente, pero condiciona transiciones futuras)
- **Entidades afectadas:** `Product` (modifica `stock`)
- **Eventos de dominio:** `EVT-SEL-001` (`StockActualizado`)
- **Pantallas:** `SCR-SEL-001`
- **Botones/acciones que la disparan:** `BTN-SEL-001`, `ACT-SEL-003`
- **Resultado esperado:** `Product.stock` actualizado; recalculo de badge en `MOD-CAT-01` (`AUTO-CAT-001`)
- **Servicios de dominio involucrados:** `InventoryService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-SEL-001` _(nueva referencia reservada: "el stock no puede establecerse en un valor negativo")_
- **RF relacionados:** `RF-SEL-002`
- **HU relacionadas:** `HU-SEL-002`
- **UC relacionados:** `UC-SEL-001` (sub-flujo)
- **CA relacionados:** `CA-SEL-002`
- **TEST relacionados:** `TEST-SEL-002`

#### `OPS-SEL-003` — Configurar umbral mínimo de stock

- **Objetivo de negocio:** permitir que la alerta de stock bajo (`RN-CALC-03`) se ajuste a la rotación real de cada producto, en vez de un valor genérico
- **Actor:** SELLER (gestión operativa) — _nota: en Sesión 1, `RN-CALC-03` asignó esta configuración a ADMIN; ver nota de diseño sobre conflicto de actor_
- **Proceso de negocio de origen:** 6.4.A
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** `Product` (modifica `stock_min_threshold`)
- **Eventos de dominio:** `EVT-SEL-002` (`UmbralStockActualizado`)
- **Pantallas:** `SCR-SEL-001`
- **Botones/acciones que la disparan:** `BTN-SEL-002`
- **Resultado esperado:** `stock_min_threshold` actualizado para ese producto
- **Servicios de dominio involucrados:** `InventoryService`
- **Prioridad funcional:** MVP+
- **RN relacionadas:** `RN-CALC-03`
- **RF relacionados:** `RF-SEL-003`
- **HU relacionadas:** `HU-SEL-003`
- **UC relacionados:** `UC-SEL-001` (sub-flujo)
- **CA relacionados:** `CA-SEL-003`
- **TEST relacionados:** `TEST-SEL-003`

#### `OPS-SEL-004` — Ver cola de pedidos listos para envío

- **Objetivo de negocio:** dar visibilidad operativa sobre pedidos pagados que requieren despacho físico
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.4.B
- **Estados de FSM involucrados:** `Order.status = READY_TO_SHIP` (lectura)
- **Entidades afectadas:** ninguna
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-SEL-002`
- **Botones/acciones que la disparan:** `ACT-SEL-004`, `ACT-SEL-005`
- **Resultado esperado:** listado de pedidos pendientes de despacho, ordenable por antigüedad
- **Servicios de dominio involucrados:** `OrderQueryService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-SEL-004`
- **HU relacionadas:** `HU-SEL-004`
- **UC relacionados:** `UC-SEL-002`
- **CA relacionados:** `CA-SEL-004`
- **TEST relacionados:** `TEST-SEL-004`

#### `OPS-SEL-005` — Generar guía de envío

- **Objetivo de negocio:** formalizar el despacho físico del pedido, transicionándolo a un estado de seguimiento logístico
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.4.C
- **Estados de FSM involucrados:** `READY_TO_SHIP → SHIPPED` (`ORD-T-06`)
- **Entidades afectadas:** `Order` (cambia `status`, fija `shipping_guide_id`), `ShippingGuide` (crea registro)
- **Eventos de dominio:** `EVT-SEL-003` (`GuiaGenerada`)
- **Pantallas:** `SCR-SEL-003`
- **Botones/acciones que la disparan:** `BTN-SEL-003`
- **Resultado esperado:** `Order` en `SHIPPED`; `ShippingGuide` creada con código de seguimiento mock
- **Servicios de dominio involucrados:** `ShippingService`, `StateMachineService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-SHP-01` (ya existente en el contexto original §6.4.C)
- **RF relacionados:** `RF-SEL-005`
- **HU relacionadas:** `HU-SEL-005`
- **UC relacionados:** `UC-SEL-002` (sub-flujo)
- **CA relacionados:** `CA-SEL-005`
- **TEST relacionados:** `TEST-SEL-005`

#### `OPS-SEL-006` — Ver historial de pedidos despachados

- **Objetivo de negocio:** dar trazabilidad operativa sobre despachos ya completados, para soporte o auditoría interna
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.4.B, 6.4.C
- **Estados de FSM involucrados:** `Order.status = SHIPPED` (lectura)
- **Entidades afectadas:** ninguna
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-SEL-002` (vista filtrada, no pantalla separada)
- **Botones/acciones que la disparan:** `ACT-SEL-004` (mismo filtro de estado)
- **Resultado esperado:** listado de pedidos ya despachados
- **Servicios de dominio involucrados:** `OrderQueryService`
- **Prioridad funcional:** MVP+
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-SEL-006`
- **HU relacionadas:** `HU-SEL-006`
- **UC relacionados:** `UC-SEL-002` (sub-flujo)
- **CA relacionados:** `CA-SEL-006`
- **TEST relacionados:** `TEST-SEL-006`

---

### Pantallas (SCR)

#### `SCR-SEL-001` — Gestión de stock (`/vendedor/stock`)

- **Propósito:** listar y editar el inventario de productos
- **Objetivo de negocio:** mantener consistencia entre el catálogo público y la realidad física, condición de integridad para todo el sistema de checkout
- **Valor para el usuario (SELLER):** edición rápida sin necesidad de pasar por gestión completa de catálogo (que pertenece a ADMIN según §2.3 del contexto original)
- **Valor para el negocio:** reduce ventas fallidas por stock desactualizado y sobreventa
- **Actores autorizados:** SELLER
- **Estados:** con datos, cargando, error de validación inline
- **Permisos:** sesión SELLER
- **Dependencias con otras pantallas:** alimenta `MOD-CAT-01` (badge de stock) y `MOD-FU-01` (`RN-CHECKOUT-01`)
- **Navegación de entrada:** `NAV-SEL-001` (menú panel SELLER)
- **Navegación de salida:** ninguna (pantalla terminal del flujo de gestión de stock)

#### `SCR-SEL-002` — Cola de pedidos (`/vendedor/pedidos`)

- **Propósito:** listar pedidos en `READY_TO_SHIP` y, opcionalmente filtrar, ya `SHIPPED`
- **Objetivo de negocio:** asegurar que ningún pedido pagado quede sin despachar por falta de visibilidad operativa
- **Valor para el usuario (SELLER):** cola priorizable de trabajo de despacho
- **Valor para el negocio:** reduce tiempo de entrega, mejora experiencia post-compra
- **Actores autorizados:** SELLER
- **Estados:** vacío (sin pedidos pendientes), con datos, cargando
- **Permisos:** sesión SELLER
- **Dependencias con otras pantallas:** alimenta `SCR-SEL-003`; depende de `MOD-CHK-01` como origen del pedido pagado
- **Navegación de entrada:** `NAV-SEL-002`
- **Navegación de salida:** `NAV-SEL-003` (→generar guía)

#### `SCR-SEL-003` — Generación de guía (`/vendedor/pedidos/[id]/guia`)

- **Propósito:** capturar los datos físicos del envío (peso, bultos, observaciones) y generar la guía
- **Objetivo de negocio:** formalizar el compromiso de despacho con datos suficientes para el transportista
- **Valor para el usuario (SELLER):** flujo simple y rápido para no convertir el despacho en un cuello de botella operativo
- **Valor para el negocio:** trazabilidad de envíos, base para resolución de disputas de entrega
- **Actores autorizados:** SELLER
- **Estados:** formulario activo (pedido sin guía), solo lectura (pedido ya con guía generada)
- **Permisos:** sesión SELLER
- **Dependencias con otras pantallas:** depende de `SCR-SEL-002` como origen
- **Navegación de entrada:** `NAV-SEL-003`
- **Navegación de salida:** `NAV-SEL-004` (volver a la cola)

---

### Componentes (CMP)

**`SCR-SEL-001`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-SEL-001`|Tabla editable de productos|Soporta `OPS-SEL-001`, `OPS-SEL-002`|`Product[]`|ediciones inline de `stock`|`CMP-SEL-002`|
|`CMP-SEL-002`|Input de stock inline|Ejecuta `OPS-SEL-002`|`stock` actual|nuevo valor de `stock`|`CMP-SEL-001`|
|`CMP-SEL-003`|Input de umbral mínimo|Ejecuta `OPS-SEL-003`|`stock_min_threshold` actual|nuevo umbral|`CMP-SEL-001`|
|`CMP-SEL-004`|Badge de alerta de stock bajo|Comunica visualmente `RN-CALC-03`|`stock` vs `stock_min_threshold`|—|`AUTO-CAT-001` (comparte lógica)|
|`CMP-SEL-005`|Buscador de productos|Filtra la tabla|texto libre|filtro aplicado|`CMP-SEL-001`|
|`CMP-SEL-006`|Mensaje de validación inline|Feedback de `OPS-SEL-002` (rechazo de valor negativo)|resultado de validación|—|`CMP-SEL-002`|

**`SCR-SEL-002`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-SEL-007`|Tabla de pedidos|Soporta `OPS-SEL-004`, `OPS-SEL-006`|`Order[]`|selección de fila|`CMP-SEL-008`|
|`CMP-SEL-008`|Filtro de estado|Alterna entre `READY_TO_SHIP` y `SHIPPED`|—|`status` filtrado|`CMP-SEL-007`|
|`CMP-SEL-009`|Badge de antigüedad del pedido|Comunica urgencia visual de despacho|`Order.created_at` (desde `PAID`)|—|—|
|`CMP-SEL-010`|Estado vacío|Orienta cuando no hay pedidos pendientes|resultado vacío|—|—|
|`CMP-SEL-011`|Paginación|Navega resultados|total de resultados|página solicitada|`CMP-SEL-007`|

**`SCR-SEL-003`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-SEL-012`|Resumen del pedido|Contexto del pedido a despachar|`Order` completo, `Order.shipping_address`|—|—|
|`CMP-SEL-013`|Formulario de guía|Captura datos físicos|—|`weight_kg`, `packages_count`, `notes`|`OPS-SEL-005`|
|`CMP-SEL-014`|Vista de guía generada|Muestra código de seguimiento tras generar|`ShippingGuide`|—|`BTN-SEL-003`|

---

### Botones (BTN)

#### `BTN-SEL-001` — "Guardar" (edición de stock)

- Pantalla: `SCR-SEL-001` | Actor: SELLER | Estado donde aparece: campo de stock modificado
- Operación funcional: `OPS-SEL-002`
- Proceso de negocio de origen: 6.4.A
- Precondiciones: nuevo valor de `stock` es un entero ≥ 0
- Postcondiciones: `Product.stock` actualizado
- Errores posibles: `422` si el valor es negativo o no numérico
- Excepciones: ninguna
- Restricciones: `RN-SEL-001` (reservada)
- Impacto en la FSM: ninguno
- Eventos generados: `EVT-SEL-001`
- Confirmación: no | Mensaje: toast de confirmación | Navegación posterior: ninguna | Permisos: rol SELLER

#### `BTN-SEL-002` — "Guardar umbral"

- Pantalla: `SCR-SEL-001` | Actor: SELLER | Estado donde aparece: campo de umbral modificado
- Operación funcional: `OPS-SEL-003`
- Proceso de negocio de origen: 6.4.A
- Precondiciones: nuevo valor de `stock_min_threshold` es un entero ≥ 0
- Postcondiciones: `Product.stock_min_threshold` actualizado
- Errores posibles: `422` si el valor es inválido
- Excepciones: ninguna
- Restricciones: `RN-CALC-03`
- Impacto en la FSM: ninguno
- Eventos generados: `EVT-SEL-002`
- Confirmación: no | Mensaje: toast | Navegación posterior: ninguna | Permisos: rol SELLER

#### `BTN-SEL-003` — "Generar guía"

- Pantalla: `SCR-SEL-003` | Actor: SELLER | Estado donde aparece: `Order.status = READY_TO_SHIP`, formulario completo
- Operación funcional: `OPS-SEL-005`
- Proceso de negocio de origen: 6.4.C
- Precondiciones: `weight_kg > 0`; `packages_count ≥ 1`
- Postcondiciones: `Order.status = SHIPPED`; `ShippingGuide` creada
- Errores posibles: `409` si el pedido ya tiene guía generada (doble click o doble pestaña); `422` si el formulario es inválido
- Excepciones: ninguna
- Restricciones: `RN-SHP-01`
- Impacto en la FSM: ejecuta `ORD-T-06`
- Eventos generados: `EVT-SEL-003`
- Confirmación: sí ("¿Confirmar generación de guía?") | Mensaje: muestra código de seguimiento | Navegación posterior: `NAV-SEL-004` | Permisos: rol SELLER

---

### Acciones (ACT)

|ID|Acción|Pantalla|Actor|Operación asociada|Resultado|
|---|---|---|---|---|---|
|`ACT-SEL-001`|Buscar producto por nombre/SKU|`SCR-SEL-001`|SELLER|`OPS-SEL-001`|Filtra tabla|
|`ACT-SEL-002`|Ordenar tabla por columna|`SCR-SEL-001`|SELLER|`OPS-SEL-001`|Reordena (ej. por stock ascendente)|
|`ACT-SEL-003`|Incrementar/decrementar stock inline|`SCR-SEL-001`|SELLER|`OPS-SEL-002` (prepara, no ejecuta hasta guardar)|Actualiza valor en input, pendiente de confirmar|
|`ACT-SEL-004`|Cambiar filtro de estado de pedido|`SCR-SEL-002`|SELLER|`OPS-SEL-004` / `OPS-SEL-006`|Refiltra entre pendientes/despachados|
|`ACT-SEL-005`|Click en fila de pedido|`SCR-SEL-002`|SELLER|`OPS-SEL-004` (navegación)|Navega a `SCR-SEL-003`|

---

### Navegación (NAV)

|ID|Desde|Hacia|Disparador|Flujo|Condición de entrada|Permisos|Bloqueado si|
|---|---|---|---|---|---|---|---|
|`NAV-SEL-001`|Menú panel SELLER|`SCR-SEL-001`|Click en "Stock"|Principal|Sesión SELLER|SELLER|Sin sesión|
|`NAV-SEL-002`|Menú panel SELLER|`SCR-SEL-002`|Click en "Pedidos"|Principal|Sesión SELLER|SELLER|Sin sesión|
|`NAV-SEL-003`|`SCR-SEL-002`|`SCR-SEL-003`|`ACT-SEL-005`|Principal|`Order.status = READY_TO_SHIP`|SELLER|Pedido ya `SHIPPED` (redirige a vista solo lectura, no bloquea)|
|`NAV-SEL-004`|`SCR-SEL-003`|`SCR-SEL-002`|Tras `BTN-SEL-003`, o navegación manual|Principal|—|SELLER|—|

---

### Funcionalidades Automáticas (AUTO)

Este módulo no define funcionalidades automáticas propias. La sincronización masiva de stock vía DISTRIBUTOR se documenta en `MOD-DIS-01`, no aquí, porque el actor disparador es el sistema externo, no el SELLER. No se identifica ninguna automatización adicional (por ejemplo, reorden automático de stock no está documentado en el contexto ni puede inferirse como obligatorio para el MVP).

---

### Eventos de Dominio (EVT)

|ID|Evento|Disparado por|
|---|---|---|
|`EVT-SEL-001`|`StockActualizado`|`OPS-SEL-002`|
|`EVT-SEL-002`|`UmbralStockActualizado`|`OPS-SEL-003`|
|`EVT-SEL-003`|`GuiaGenerada`|`OPS-SEL-005`|

---

### Reglas de Negocio relacionadas (RN)

`RN-CALC-03` (resuelta en Sesión 1), `RN-SHP-01` (existente en contexto original §6.4.C), `RN-SEL-001` (reservada — stock no negativo)

### Requisitos Funcionales relacionados (RF)

`RF-SEL-001`, `RF-SEL-002`, `RF-SEL-003`, `RF-SEL-004`, `RF-SEL-005`, `RF-SEL-006`

### Historias de Usuario relacionadas (HU)

`HU-SEL-001`, `HU-SEL-002`, `HU-SEL-003`, `HU-SEL-004`, `HU-SEL-005`, `HU-SEL-006`

### Casos de Uso relacionados (UC)

`UC-SEL-001`, `UC-SEL-002`

### Criterios de Aceptación relacionados (CA)

`CA-SEL-001`, `CA-SEL-002`, `CA-SEL-003`, `CA-SEL-004`, `CA-SEL-005`, `CA-SEL-006`

### Casos de Prueba relacionados (TEST)

`TEST-SEL-001`, `TEST-SEL-002`, `TEST-SEL-003`, `TEST-SEL-004`, `TEST-SEL-005`, `TEST-SEL-006`

---

### Notas de diseño y decisiones del módulo

**Conflicto de actor detectado (señalado, no resuelto arbitrariamente):** la Sesión 1 estableció `RN-CALC-03` indicando que `stock_min_threshold` es "editable por ADMIN en `/admin/productos/{id}`". Este módulo, basado en el contexto original §6.4.A ("Actualiza stock... Configura parámetros del sistema" aparecía bajo ADMIN, no SELLER), también podría justificar que el umbral se edite desde el panel SELLER por ser quien opera el inventario día a día. Documento `OPS-SEL-003`/`BTN-SEL-002` como existentes en este módulo, pero dejo explícito que esto **duplica una capacidad ya asignada a ADMIN en la Sesión 1** y debe resolverse: o bien el umbral se edita en ambos paneles (con la misma regla `RN-CALC-03`), o se retira de uno de los dos. No elimino la operación unilateralmente porque ambas asignaciones tienen base objetiva en el contexto; la decisión final se marca pendiente para `MOD-ADM-01` cuando se documente, evitando contradicción.

**Vacío detectado — sin SLA de despacho:** igual que en `MOD-COT-01`, no hay base en el contexto para definir un tiempo máximo de despacho tras `PAID → READY_TO_SHIP`. `CMP-SEL-009` se documenta como elemento visual de antigüedad sin umbral de alerta definido.

**Restricción de catálogo respetada:** se mantiene la separación de §2.3 del contexto original: SELLER edita `stock` pero no `price_public`, `price_wholesale`, `name`, `description` ni `images` del producto — esas son atribuciones de ADMIN. Por eso `CMP-SEL-001` se documenta como "tabla editable" únicamente en la columna de stock, no en campos de catálogo completo.

---

### Impacto en documentos globales

- **Modelo de Dominio:** sin cambios estructurales. Confirma el uso de atributos ya definidos en Sesión 1 (`Product.stock`, `Product.stock_min_threshold`, `ShippingGuide` completa).
- **FSM:** sin cambios. Ejecuta la transición ya existente `ORD-T-06` (`READY_TO_SHIP → SHIPPED`), no introduce ninguna nueva.
- **Arquitectura:** sin cambios.
- **Base de Datos:** sin cambios.
- **Decisiones Técnicas:** sin cambios.
- **Catálogo Global de Eventos:** se deben incorporar `EVT-SEL-001`, `EVT-SEL-002`, `EVT-SEL-003` al catálogo global (no estaban registrados en sesiones previas).

---

## 🆕 EXTENSIONES v1.2 (Mejoras UI/UX e Integraciones)

### 📋 Nuevos Requisitos Funcionales
- **RF-SEL-007:** Alertas de productos sin stock vía Telegram + visualización de stock real (considerando reservas)

### 🔧 Nuevos Componentes (CMP-*)

**CMP-SEL-012: Visualización de Stock Real**
- Muestra: stock_real = stock_total - reserved_stock
- Tooltip: "X reservados en pagos pendientes"
- Badge de color:
  - Verde: stock_real > umbral
  - Naranja: 0 < stock_real <= umbral
  - Rojo: stock_real = 0

**CMP-SEL-013: Desglose de Kit en Pedido**
- Se muestra en SCR-SEL-002 (Pedidos)
- Lista de componentes del Kit con cantidades
- Checkbox para marcar cada componente como "empacado"
- Alerta si algún componente está sin stock

**CMP-SEL-014: Botón de Telegram con Cliente**
- Se muestra en SCR-CON-001 (Consultas)
- Si el cliente dejó usuario de Telegram en el formulario
- Icono de Telegram azul
- Abre chat directo: t.me/[username_cliente]

### 🔘 Nuevos Botones (BTN-*)

**BTN-SEL-004: Contactar Cliente por Telegram**
- **Acción:** Abre t.me/[username]
- **Precondición:** Cliente dejó username en consulta
- **Permiso:** SELLER

**BTN-SEL-005: Marcar Componente como Empacado**
- **Acción:** PATCH /orders/{id}/kit-components/{component_id}/packed
- **Postcondición:** Cuando todos los componentes están empacados → Order: READY_TO_SHIP → SHIPPED
- **Permiso:** SELLER

### 📜 Nuevas Reglas de Negocio

**RN-SEL-002:** Stock visible para SELLER = stock_total - reserved_stock
**RN-SEL-003:** Al despachar Kit, todos los componentes deben estar disponibles

### 🔄 Impacto en Actores

**SELLER:**
- ✅ Ve stock real (no puede vender lo reservado)
- ✅ Ve desglose de Kits en pedidos
- ✅ Contacta clientes por Telegram desde consultas
- ⚠️ Debe empacar cada componente del Kit individualmente

### 🔗 Nuevas Navegaciones (NAV-*)

**NAV-SEL-007:** SCR-SEL-001 → Tooltip de stock reservado
**NAV-SEL-008:** SCR-SEL-002 → Desglose de Kit (clic en producto tipo Kit)
**NAV-SEL-009:** SCR-CON-001 → Telegram (BTN-SEL-004)