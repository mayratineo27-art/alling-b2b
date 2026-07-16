MOD-ADM-01 — Panel ADMIN (Usuarios, Catálogo, Métricas, Configuración)

- **Objetivo:** dar al ADMIN control de gobernanza sobre usuarios, catálogo completo, configuración del sistema y visibilidad analítica del negocio.
- **Actores:** ADMIN (ejecuta todas las operaciones)
- **Procesos de negocio de origen:** Proceso 6.5 (Gobierno ADMIN)
- **Integraciones:** ninguna externa directa

---

### Operaciones Funcionales (OPS)

#### `OPS-ADM-001` — Listar usuarios

- **Objetivo de negocio:** dar visibilidad completa sobre el conjunto de cuentas con privilegios (SELLER, ADMIN) y clientes (CUSTOMER) para gobernanza
- **Actor:** ADMIN
- **Proceso de negocio de origen:** 6.5
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** ninguna (lectura de `User[]`)
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-ADM-001`
- **Botones/acciones que la disparan:** `ACT-ADM-001`, `ACT-ADM-002`
- **Resultado esperado:** listado filtrable por rol y estado
- **Servicios de dominio involucrados:** `UserQueryService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-ADM-001`
- **HU relacionadas:** `HU-ADM-001`
- **UC relacionados:** `UC-ADM-001`
- **CA relacionados:** `CA-ADM-001`
- **TEST relacionados:** `TEST-ADM-001`

#### `OPS-ADM-002` — Crear usuario (SELLER/ADMIN)

- **Objetivo de negocio:** habilitar el ingreso controlado de personal interno con privilegios, restringido a creación administrativa (no autoregistro, según `auth_provider = LOCAL` definido en Sesión 1)
- **Actor:** ADMIN
- **Proceso de negocio de origen:** 6.5
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** `User` (crea)
- **Eventos de dominio:** `EVT-ADM-001` (`UsuarioCreado`)
- **Pantallas:** `SCR-ADM-001`
- **Botones/acciones que la disparan:** `BTN-ADM-001`
- **Resultado esperado:** nuevo `User` con `role IN (SELLER, ADMIN)`, `auth_provider = LOCAL`, credenciales iniciales generadas
- **Servicios de dominio involucrados:** `UserService`, `AuthService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-ADM-001` _(nueva referencia reservada: "email único en el sistema, sin importar rol")_
- **RF relacionados:** `RF-ADM-002`
- **HU relacionadas:** `HU-ADM-002`
- **UC relacionados:** `UC-ADM-001` (sub-flujo)
- **CA relacionados:** `CA-ADM-002`
- **TEST relacionados:** `TEST-ADM-002`

#### `OPS-ADM-003` — Suspender usuario

- **Objetivo de negocio:** revocar acceso temporal sin destruir el historial asociado a esa cuenta (auditoría, pedidos, consultas atendidas)
- **Actor:** ADMIN
- **Proceso de negocio de origen:** 6.5
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** `User` (cambia `is_suspended`)
- **Eventos de dominio:** `EVT-ADM-002` (`UsuarioSuspendido`)
- **Pantallas:** `SCR-ADM-001`
- **Botones/acciones que la disparan:** `BTN-ADM-002`
- **Resultado esperado:** `User.is_suspended = true`; sesiones activas de ese usuario deben invalidarse (ver nota de diseño sobre invalidación de sesión)
- **Servicios de dominio involucrados:** `UserService`, `AuthService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-ADMIN-01` (auto-eliminación prohibida, resuelta en Sesión 1 — aplica también a auto-suspensión), `RN-ADMIN-02` (mínimo 2 ADMINs activos, resuelta en Sesión 1)
- **RF relacionados:** `RF-ADM-003`
- **HU relacionadas:** `HU-ADM-003`
- **UC relacionados:** `UC-ADM-001` (sub-flujo)
- **CA relacionados:** `CA-ADM-003`
- **TEST relacionados:** `TEST-ADM-003`

#### `OPS-ADM-004` — Eliminar usuario

- **Objetivo de negocio:** remover permanentemente una cuenta cuando la suspensión no es suficiente (ej. requerimiento legal, error de creación)
- **Actor:** ADMIN
- **Proceso de negocio de origen:** 6.5
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** `User` (elimina o soft-delete — ver nota de diseño)
- **Eventos de dominio:** `EVT-ADM-003` (`UsuarioEliminado`)
- **Pantallas:** `SCR-ADM-001`
- **Botones/acciones que la disparan:** `BTN-ADM-003`
- **Resultado esperado:** usuario eliminado del sistema, preservando integridad referencial de `AuditLog`, `Order`, `FormatoUnico` históricos
- **Servicios de dominio involucrados:** `UserService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-ADMIN-01`, `RN-ADMIN-02`
- **RF relacionados:** `RF-ADM-004`
- **HU relacionadas:** `HU-ADM-004`
- **UC relacionados:** `UC-ADM-001` (sub-flujo)
- **CA relacionados:** `CA-ADM-004`
- **TEST relacionados:** `TEST-ADM-004`

#### `OPS-ADM-005` — Gestionar catálogo completo (CRUD de productos)

- **Objetivo de negocio:** mantener control total sobre la oferta comercial (creación, edición de precios/descripciones, desactivación), separado de la edición operativa de stock que sí tiene SELLER
- **Actor:** ADMIN
- **Proceso de negocio de origen:** 6.5
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** `Product` (crea/edita/desactiva), `Category`
- **Eventos de dominio:** `EVT-ADM-004` (`ProductoCreado`/`ProductoActualizado`/`ProductoDesactivado`)
- **Pantallas:** `SCR-ADM-002`
- **Botones/acciones que la disparan:** `BTN-ADM-004`, `BTN-ADM-005`, `BTN-ADM-006`
- **Resultado esperado:** catálogo actualizado, reflejado en `MOD-CAT-01` vía `AUTO-CAT-002`
- **Servicios de dominio involucrados:** `ProductService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-CATALOG-01` (stock mostrado como booleano/rango, resuelta en Sesión 1)
- **RF relacionados:** `RF-ADM-005`
- **HU relacionadas:** `HU-ADM-005`
- **UC relacionados:** `UC-ADM-002`
- **CA relacionados:** `CA-ADM-005`
- **TEST relacionados:** `TEST-ADM-005`

#### `OPS-ADM-006` — Ver métricas de ventas

- **Objetivo de negocio:** dar visibilidad analítica del desempeño comercial para toma de decisiones de negocio
- **Actor:** ADMIN
- **Proceso de negocio de origen:** 6.5
- **Estados de FSM involucrados:** ninguno (lectura agregada de `Order` en `PAID`/`SHIPPED`)
- **Entidades afectadas:** ninguna
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-ADM-003`
- **Botones/acciones que la disparan:** `ACT-ADM-003`, `ACT-ADM-004`
- **Resultado esperado:** gráficos de revenue por período, productos más vendidos
- **Servicios de dominio involucrados:** `AnalyticsService`
- **Prioridad funcional:** MVP+
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-ADM-006`
- **HU relacionadas:** `HU-ADM-006`
- **UC relacionados:** `UC-ADM-003`
- **CA relacionados:** `CA-ADM-006`
- **TEST relacionados:** `TEST-ADM-006`

#### `OPS-ADM-007` — Configurar parámetros del sistema

- **Objetivo de negocio:** centralizar configuración global que afecta el comportamiento de negocio (ej. umbral de stock global por defecto, definido en Sesión 1 como valor `5`)
- **Actor:** ADMIN
- **Proceso de negocio de origen:** 6.5
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** `SystemConfig` _(entidad nueva — no estaba en el Modelo de Dominio de la Sesión 1, ver impacto en documentos globales)_
- **Eventos de dominio:** `EVT-ADM-005` (`ConfiguracionActualizada`)
- **Pantallas:** `SCR-ADM-004`
- **Botones/acciones que la disparan:** `BTN-ADM-007`
- **Resultado esperado:** parámetros globales actualizados (ej. `default_stock_min_threshold`, `quote_validity_days` actualmente fijo en 7 según `RN-FU-03`)
- **Servicios de dominio involucrados:** `SystemConfigService`
- **Prioridad funcional:** MVP+
- **RN relacionadas:** `RN-CALC-03`, `RN-FU-03`
- **RF relacionados:** `RF-ADM-007`
- **HU relacionadas:** `HU-ADM-007`
- **UC relacionados:** `UC-ADM-004`
- **CA relacionados:** `CA-ADM-007`
- **TEST relacionados:** `TEST-ADM-007`

#### `OPS-ADM-008` — Exportar datos con re-autenticación MFA

- **Objetivo de negocio:** permitir extracción de datos sensibles para reportes externos o respaldo, con control de seguridad reforzado dado el nivel de sensibilidad de la operación
- **Actor:** ADMIN
- **Proceso de negocio de origen:** 6.5 (mencionado explícitamente en el contexto original: "Exporta datos (con re-autenticación MFA)")
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** ninguna (operación de lectura masiva)
- **Eventos de dominio:** `EVT-ADM-006` (`ExportacionDatosRealizada`)
- **Pantallas:** `SCR-ADM-004`
- **Botones/acciones que la disparan:** `BTN-ADM-008`
- **Resultado esperado:** archivo de exportación generado (formato no especificado en contexto — ver nota de diseño); evento registrado en `AuditLog`
- **Servicios de dominio involucrados:** `ExportService`, `AuthService` (verificación MFA step-up)
- **Prioridad funcional:** MVP+
- **RN relacionadas:** `RN-ADM-002` _(nueva referencia reservada: "toda exportación requiere re-autenticación MFA inmediatamente previa, no solo sesión MFA general")_
- **RF relacionados:** `RF-ADM-008`
- **HU relacionadas:** `HU-ADM-008`
- **UC relacionados:** `UC-ADM-005`
- **CA relacionados:** `CA-ADM-008`
- **TEST relacionados:** `TEST-ADM-008`

---

### Pantallas (SCR)

#### `SCR-ADM-001` — Gestión de usuarios (`/admin/usuarios`)

- **Propósito:** listar, crear, suspender y eliminar usuarios
- **Objetivo de negocio:** gobernanza de acceso al sistema
- **Valor para el usuario (ADMIN):** control centralizado de identidades con privilegios
- **Valor para el negocio:** seguridad y cumplimiento de políticas de acceso
- **Actores autorizados:** ADMIN
- **Estados:** con datos, cargando, error de validación
- **Permisos:** sesión ADMIN
- **Dependencias con otras pantallas:** ninguna directa; afecta indirectamente a `MOD-AUT-01` (login) y `MOD-SEL-01`/`MOD-CON-01`/`MOD-COT-01` (quién puede operar)
- **Navegación de entrada:** `NAV-ADM-001`
- **Navegación de salida:** ninguna (terminal)

#### `SCR-ADM-002` — Gestión de catálogo (`/admin/productos`)

- **Propósito:** CRUD completo de productos y categorías
- **Objetivo de negocio:** control de oferta comercial y pricing
- **Valor para el usuario (ADMIN):** gestión completa sin pasar por SELLER para cambios estructurales
- **Valor para el negocio:** integridad de precios y descripciones, separado de la operación diaria de stock
- **Actores autorizados:** ADMIN
- **Estados:** con datos, cargando, error de validación
- **Permisos:** sesión ADMIN
- **Dependencias con otras pantallas:** alimenta `MOD-CAT-01` directamente
- **Navegación de entrada:** `NAV-ADM-002`
- **Navegación de salida:** ninguna (terminal)

#### `SCR-ADM-003` — Métricas de ventas (`/admin/metricas/ventas`)

- **Propósito:** visualizar indicadores de desempeño comercial
- **Objetivo de negocio:** soporte a decisiones de negocio basadas en datos
- **Valor para el usuario (ADMIN):** panorama analítico sin necesidad de exportar y procesar manualmente
- **Valor para el negocio:** detección temprana de tendencias (productos estrella, caída de ventas)
- **Actores autorizados:** ADMIN
- **Estados:** con datos, cargando, sin datos suficientes (periodo sin ventas)
- **Permisos:** sesión ADMIN
- **Dependencias con otras pantallas:** lee de `MOD-CHK-01` (Orders pagados)
- **Navegación de entrada:** `NAV-ADM-003`
- **Navegación de salida:** ninguna (terminal)

#### `SCR-ADM-004` — Configuración del sistema (`/admin/configuracion`)

- **Propósito:** ajustar parámetros globales y ejecutar exportación de datos
- **Objetivo de negocio:** centralizar gobernanza técnica-operativa del sistema
- **Valor para el usuario (ADMIN):** un solo lugar para ajustes que de otro modo requerirían intervención técnica directa
- **Valor para el negocio:** agilidad operativa sin dependencia de desarrollo para cambios de parámetros
- **Actores autorizados:** ADMIN
- **Estados:** con datos, requiere step-up MFA (para exportación)
- **Permisos:** sesión ADMIN; MFA re-verificado para `OPS-ADM-008`
- **Dependencias con otras pantallas:** ninguna directa
- **Navegación de entrada:** `NAV-ADM-004`
- **Navegación de salida:** ninguna (terminal)

---

### Componentes (CMP)

**`SCR-ADM-001`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-ADM-001`|Tabla de usuarios|Soporta `OPS-ADM-001`|`User[]`|selección de fila|`CMP-ADM-002`|
|`CMP-ADM-002`|Filtro por rol|Refina `OPS-ADM-001`|—|`role[]` filtrado|`CMP-ADM-001`|
|`CMP-ADM-003`|Modal de creación de usuario|Soporta `OPS-ADM-002`|—|`email`, `name`, `role`|`BTN-ADM-001`|
|`CMP-ADM-004`|Badge de estado (activo/suspendido)|Comunica `is_suspended`|`User.is_suspended`|—|—|
|`CMP-ADM-005`|Modal de confirmación de eliminación|Previene eliminación accidental|—|confirmación del usuario|`BTN-ADM-003`|

**`SCR-ADM-002`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-ADM-006`|Tabla de productos|Soporta `OPS-ADM-005` (listado)|`Product[]`|selección de fila|—|
|`CMP-ADM-007`|Formulario de producto|Soporta creación/edición|`Product` (si edita)|`Product` completo|`BTN-ADM-004`, `BTN-ADM-005`|
|`CMP-ADM-008`|Uploader de imágenes|Captura `Product.images[]`|archivos|URLs de imágenes subidas|`CMP-ADM-007`|
|`CMP-ADM-009`|Selector de categoría|Asigna `category_id`|`Category[]`|`category_id` seleccionado|`CMP-ADM-007`|
|`CMP-ADM-010`|Toggle de activo/inactivo|Ejecuta desactivación|`Product.is_active`|nuevo valor|`BTN-ADM-006`|

**`SCR-ADM-003`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-ADM-011`|Gráfico de revenue por periodo|Soporta `OPS-ADM-006`|`Order[]` agregados|—|`ACT-ADM-003`|
|`CMP-ADM-012`|Selector de rango de fechas|Refina `OPS-ADM-006`|—|rango de fechas|`CMP-ADM-011`|
|`CMP-ADM-013`|Tabla de productos más vendidos|Soporta `OPS-ADM-006`|`Order.items_snapshot` agregados|—|—|

**`SCR-ADM-004`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-ADM-014`|Formulario de parámetros globales|Soporta `OPS-ADM-007`|`SystemConfig` actual|nuevos valores|`BTN-ADM-007`|
|`CMP-ADM-015`|Modal de re-autenticación MFA|Soporta step-up de `OPS-ADM-008`|código TOTP|confirmación de identidad|`BTN-ADM-008`|
|`CMP-ADM-016`|Selector de formato de exportación|Define alcance de `OPS-ADM-008`|—|formato seleccionado (ver nota de diseño)|`CMP-ADM-015`|

---

### Botones (BTN)

#### `BTN-ADM-001` — "Crear usuario"

- Pantalla: `SCR-ADM-001` | Actor: ADMIN | Estado donde aparece: siempre
- Operación funcional: `OPS-ADM-002`
- Proceso de negocio de origen: 6.5
- Precondiciones: email no registrado previamente
- Postcondiciones: `User` creado con `role IN (SELLER, ADMIN)`
- Errores posibles: `409` si el email ya existe
- Excepciones: ninguna
- Restricciones: `RN-ADM-001` (reservada)
- Impacto en la FSM: ninguno
- Eventos generados: `EVT-ADM-001`
- Confirmación: sí (formulario en modal) | Mensaje: toast | Navegación posterior: ninguna | Permisos: rol ADMIN

#### `BTN-ADM-002` — "Suspender"

- Pantalla: `SCR-ADM-001` | Actor: ADMIN | Estado donde aparece: usuario activo
- Operación funcional: `OPS-ADM-003`
- Proceso de negocio de origen: 6.5
- Precondiciones: `target_id ≠ actor_id` (`RN-ADMIN-01`); si target es ADMIN, debe haber ≥3 ADMINs activos antes de suspender (para mantener ≥2 tras la operación, `RN-ADMIN-02`)
- Postcondiciones: `User.is_suspended = true`
- Errores posibles: `403` (auto-suspensión); `409` (rompería el mínimo de ADMINs)
- Excepciones: ninguna adicional
- Restricciones: `RN-ADMIN-01`, `RN-ADMIN-02`
- Impacto en la FSM: ninguno
- Eventos generados: `EVT-ADM-002`
- Confirmación: sí | Mensaje: toast | Navegación posterior: ninguna | Permisos: rol ADMIN

#### `BTN-ADM-003` — "Eliminar"

- Pantalla: `SCR-ADM-001` | Actor: ADMIN | Estado donde aparece: siempre (cualquier usuario)
- Operación funcional: `OPS-ADM-004`
- Proceso de negocio de origen: 6.5
- Precondiciones: igual a `BTN-ADM-002`
- Postcondiciones: `User` eliminado (soft-delete recomendado, ver nota de diseño)
- Errores posibles: igual a `BTN-ADM-002`
- Excepciones: ninguna
- Restricciones: `RN-ADMIN-01`, `RN-ADMIN-02`
- Impacto en la FSM: ninguno
- Eventos generados: `EVT-ADM-003`
- Confirmación: sí (modal `CMP-ADM-005`, doble confirmación recomendada por ser destructiva) | Mensaje: toast | Navegación posterior: ninguna | Permisos: rol ADMIN

#### `BTN-ADM-004` — "Crear producto"

- Pantalla: `SCR-ADM-002` | Actor: ADMIN | Estado donde aparece: siempre
- Operación funcional: `OPS-ADM-005`
- Proceso de negocio de origen: 6.5
- Precondiciones: campos obligatorios completos (`name`, `description`, `sku` único, `price_public > 0`, ≥1 imagen)
- Postcondiciones: `Product` creado, `is_active = true` por defecto
- Errores posibles: `409` si `sku` o `slug` ya existen; `422` si faltan campos
- Excepciones: ninguna
- Restricciones: ninguna adicional
- Impacto en la FSM: ninguno
- Eventos generados: `EVT-ADM-004` (variante creación)
- Confirmación: no | Mensaje: toast | Navegación posterior: ninguna | Permisos: rol ADMIN

#### `BTN-ADM-005` — "Guardar cambios" (edición de producto)

- Pantalla: `SCR-ADM-002` | Actor: ADMIN | Estado donde aparece: producto en edición
- Operación funcional: `OPS-ADM-005`
- Proceso de negocio de origen: 6.5
- Precondiciones: campos válidos
- Postcondiciones: `Product` actualizado
- Errores posibles: `422` si algún campo es inválido
- Excepciones: si se reduce `price_public` mientras existen `COTIZACIÓN` vigentes sobre ese producto, no afecta a las ya emitidas (`RN-CHECKOUT-02` ya lo garantiza); se documenta aquí solo como confirmación de consistencia, no como excepción nueva
- Restricciones: ninguna adicional
- Impacto en la FSM: ninguno
- Eventos generados: `EVT-ADM-004` (variante edición)
- Confirmación: no | Mensaje: toast | Navegación posterior: ninguna | Permisos: rol ADMIN

#### `BTN-ADM-006` — "Desactivar/Activar producto"

- Pantalla: `SCR-ADM-002` | Actor: ADMIN | Estado donde aparece: siempre
- Operación funcional: `OPS-ADM-005`
- Proceso de negocio de origen: 6.5
- Precondiciones: ninguna
- Postcondiciones: `Product.is_active` invertido
- Errores posibles: ninguno esperado
- Excepciones: un producto desactivado mientras está en un FU en `BORRADOR` de algún cliente no se elimina de ese FU automáticamente; al intentar transicionar (`AUTO-FU-004`), la validación de stock/disponibilidad debe rechazar productos inactivos — esto se señala como dependencia con `MOD-FU-01`, no como regla nueva
- Restricciones: ninguna adicional
- Impacto en la FSM: ninguno directo sobre `Product`, pero condiciona transiciones futuras de FU que lo contengan
- Eventos generados: `EVT-ADM-004` (variante desactivación)
- Confirmación: sí ("¿Desactivar este producto del catálogo público?") | Mensaje: toast | Navegación posterior: ninguna | Permisos: rol ADMIN

#### `BTN-ADM-007` — "Guardar configuración"

- Pantalla: `SCR-ADM-004` | Actor: ADMIN | Estado donde aparece: parámetros modificados
- Operación funcional: `OPS-ADM-007`
- Proceso de negocio de origen: 6.5
- Precondiciones: valores dentro de rangos válidos (ej. `quote_validity_days ≥ 1`)
- Postcondiciones: `SystemConfig` actualizado
- Errores posibles: `422` si algún parámetro es inválido
- Excepciones: ninguna
- Restricciones: ninguna adicional
- Impacto en la FSM: ninguno directo; si se modifica `quote_validity_days`, afecta el cálculo de `AUTO-FU-002` solo para nuevas cotizaciones (no retroactivo)
- Eventos generados: `EVT-ADM-005`
- Confirmación: sí | Mensaje: toast | Navegación posterior: ninguna | Permisos: rol ADMIN

#### `BTN-ADM-008` — "Exportar datos"

- Pantalla: `SCR-ADM-004` | Actor: ADMIN | Estado donde aparece: siempre
- Operación funcional: `OPS-ADM-008`
- Proceso de negocio de origen: 6.5
- Precondiciones: re-autenticación MFA exitosa en el instante de la acción (no sesión MFA general)
- Postcondiciones: archivo de exportación generado; evento registrado en `AuditLog`
- Errores posibles: `401` si la verificación MFA step-up falla
- Excepciones: ninguna
- Restricciones: `RN-ADM-002` (reservada)
- Impacto en la FSM: ninguno
- Eventos generados: `EVT-ADM-006`
- Confirmación: sí (vía `CMP-ADM-015`) | Mensaje: descarga directa o notificación de archivo listo | Navegación posterior: ninguna | Permisos: rol ADMIN

---

### Acciones (ACT)

|ID|Acción|Pantalla|Actor|Operación asociada|Resultado|
|---|---|---|---|---|---|
|`ACT-ADM-001`|Buscar usuario por email/nombre|`SCR-ADM-001`|ADMIN|`OPS-ADM-001`|Filtra tabla|
|`ACT-ADM-002`|Cambiar filtro de rol|`SCR-ADM-001`|ADMIN|`OPS-ADM-001`|Refiltra|
|`ACT-ADM-003`|Cambiar rango de fechas|`SCR-ADM-003`|ADMIN|`OPS-ADM-006`|Recalcula gráfico|
|`ACT-ADM-004`|Click sobre punto del gráfico|`SCR-ADM-003`|ADMIN|`OPS-ADM-006` (drill-down)|Muestra detalle del periodo|

---

### Navegación (NAV)

|ID|Desde|Hacia|Disparador|Flujo|Condición de entrada|Permisos|Bloqueado si|
|---|---|---|---|---|---|---|---|
|`NAV-ADM-001`|Menú panel ADMIN|`SCR-ADM-001`|Click en "Usuarios"|Principal|Sesión ADMIN|ADMIN|Sin sesión|
|`NAV-ADM-002`|Menú panel ADMIN|`SCR-ADM-002`|Click en "Catálogo"|Principal|Sesión ADMIN|ADMIN|Sin sesión|
|`NAV-ADM-003`|Menú panel ADMIN|`SCR-ADM-003`|Click en "Métricas"|Principal|Sesión ADMIN|ADMIN|Sin sesión|
|`NAV-ADM-004`|Menú panel ADMIN|`SCR-ADM-004`|Click en "Configuración"|Principal|Sesión ADMIN|ADMIN|Sin sesión|

---

### Funcionalidades Automáticas (AUTO)

Este módulo no define funcionalidades automáticas propias. Todas las operaciones aquí descritas requieren acción explícita del ADMIN; no hay procesos de gobernanza que se ejecuten sin intervención humana en el contexto disponible.

---

### Eventos de Dominio (EVT)

|ID|Evento|Disparado por|
|---|---|---|
|`EVT-ADM-001`|`UsuarioCreado`|`OPS-ADM-002`|
|`EVT-ADM-002`|`UsuarioSuspendido`|`OPS-ADM-003`|
|`EVT-ADM-003`|`UsuarioEliminado`|`OPS-ADM-004`|
|`EVT-ADM-004`|`ProductoCreado` / `ProductoActualizado` / `ProductoDesactivado`|`OPS-ADM-005`|
|`EVT-ADM-005`|`ConfiguracionActualizada`|`OPS-ADM-007`|
|`EVT-ADM-006`|`ExportacionDatosRealizada`|`OPS-ADM-008`|

---

### Reglas de Negocio relacionadas (RN)

`RN-ADMIN-01`, `RN-ADMIN-02` (ambas resueltas en Sesión 1), `RN-CATALOG-01` (resuelta en Sesión 1), `RN-CALC-03`, `RN-FU-03`, `RN-ADM-001` (reservada — unicidad de email), `RN-ADM-002` (reservada — MFA step-up para exportación)

### Requisitos Funcionales relacionados (RF)

`RF-ADM-001` a `RF-ADM-008`

### Historias de Usuario relacionadas (HU)

`HU-ADM-001` a `HU-ADM-008`

### Casos de Uso relacionados (UC)

`UC-ADM-001`, `UC-ADM-002`, `UC-ADM-003`, `UC-ADM-004`, `UC-ADM-005`

### Criterios de Aceptación relacionados (CA)

`CA-ADM-001` a `CA-ADM-008`

### Casos de Prueba relacionados (TEST)

`TEST-ADM-001` a `TEST-ADM-008`

---

### Notas de diseño y decisiones del módulo

**Conflicto de actor con `MOD-SEL-01` (señalado, pendiente de resolución):** ver nota equivalente en `MOD-SEL-01` sobre `stock_min_threshold`. Ambos módulos documentan la misma capacidad porque ambos tienen base objetiva en el contexto. Debe resolverse antes de construir el RF definitivo (`RF-SEL-003` vs `RF-ADM-007` no pueden ambos implementarse sin definir jerarquía o alcance diferenciado).

**Soft-delete vs hard-delete de usuario (no resuelto arbitrariamente):** el contexto original usa el verbo "eliminar" sin especificar si es destrucción física del registro o desactivación permanente. Dado que `AuditLog`, `Order.customer_id` y `FormatoUnico.owner_id` referencian `User.id`, una eliminación física rompería la integridad referencial de registros históricos. Recomiendo (sin imponerlo como regla ya decidida) que `OPS-ADM-004` implemente soft-delete (`is_active = false` + anonimización de PII si aplica), pero esto requiere decisión explícita antes de construir el esquema de base de datos.

**Formato de exportación no definido:** el contexto original menciona la operación pero no el formato del archivo (CSV, JSON, Excel) ni su alcance (¿todos los datos? ¿solo transaccionales?). `CMP-ADM-016` se documenta como componente necesario una vez que esa decisión se tome; no se asume un formato por defecto.

---

### Impacto en documentos globales

- **Modelo de Dominio:** **requiere actualización.** Se introduce la entidad `SystemConfig` (atributos: `id`, `key`, `value`, `updated_at`, `updated_by`), no presente en el Modelo de Dominio de la Sesión 1. Además, debe definirse explícitamente si `OPS-ADM-004` (eliminar usuario) implica soft-delete o hard-delete, ya que afecta las invariantes de integridad referencial de `User` declaradas en Sesión 1.
- **FSM:** sin cambios. Ningún OPS de este módulo ejecuta una transición de FSM-01 o FSM-02.
- **Arquitectura:** sin cambios identificados aún, pendiente de la decisión de formato de exportación (`OPS-ADM-008`), que podría requerir un servicio de generación de archivos asíncrono si el volumen de datos es grande.
- **Base de Datos:** **requiere actualización** (consecuencia directa del cambio en Modelo de Dominio): tabla `system_config` nueva; posible columna `deleted_at` en `users` si se decide soft-delete.
- **Decisiones Técnicas:** **requiere una decisión nueva** registrada: soft-delete vs hard-delete de `User`, y formato de exportación de datos.
- **Catálogo Global de Eventos:** se deben incorporar `EVT-ADM-001` a `EVT-ADM-006` al catálogo global.
---

## 🆕 EXTENSIONES v1.2 (Mejoras UI/UX e Integraciones)

### 📋 Nuevos Requisitos Funcionales
- **RF-ADM-009:** CRUD completo de Kits (agrupaciones de productos)

### 🖼️ Nueva Pantalla (SCR-*)

**SCR-ADM-005: Gestión de Kits**
- **Propósito:** Crear, editar, activar/desactivar Kits
- **Permisos:** ADMIN only
- **Componentes:**
  - CMP-ADM-011: Lista de Kits existentes
  - CMP-ADM-012: Formulario de creación/edición de Kit
  - CMP-ADM-013: Selector de productos componentes
  - CMP-ADM-014: Preview de precio dinámico

**SCR-ADM-006: CMS de Landing Page**
- **Propósito:** Gestionar contenido de Landing Page (HOME-GUEST)
- **Permisos:** ADMIN only
- **Componentes:**
  - CMP-ADM-015: Selector de Hero Image
  - CMP-ADM-016: Selector de productos destacados
  - CMP-ADM-017: Editor de sección de novedades
  - CMP-ADM-018: Preview de Landing

### 🔧 Nuevos Componentes (CMP-*)

**CMP-ADM-011: Kit Builder**
- Input: Nombre del Kit
- Textarea: Descripción
- Selector múltiple de productos (buscador integrado)
- Input: Cantidad por componente
- Cálculo en tiempo real: precio_total = Σ(precio_componente * cantidad)
- Checkbox: "Precio dinámico" (si se actualiza automáticamente)

**CMP-ADM-012: Landing Page CMS**
- Upload de imagen Hero
- Selector de hasta 6 productos destacados
- Toggle: "Mostrar precios en destacados" (default: false)
- Selector de categoría para cuadrícula
- Editor de texto para sección de novedades

### 🔘 Nuevos Botones (BTN-*)

**BTN-ADM-009: Crear Kit**
- **Acción:** POST /admin/kits
- **Validación:** Mínimo 2 componentes
- **Postcondición:** Kit creado, visible en catálogo

**BTN-ADM-010: Guardar Configuración de Landing**
- **Acción:** PUT /admin/landing-config
- **Validación:** Al menos 1 producto destacado
- **Postcondición:** Landing actualizada (cache invalidado)

### 📜 Consideraciones de Seguridad

**⚠️ IMPORTANTE:** Las credenciales de Mercado Pago y Telegram NO se guardan en SystemConfig.
- Se configuran vía variables de entorno (.env)
- ADMIN no puede modificarlas desde el panel
- Para cambiar de Sandbox → Producción, se requiere despliegue (DevOps)

SystemConfig solo almacena:
- Parámetros de negocio (días de vigencia de cotización)
- Umbrales de stock default
- Textos legales
- Configuración de Landing (imágenes, productos destacados)

### 🔄 Impacto en Actores

**ADMIN:**
- ✅ CRUD completo de Kits
- ✅ Gestiona contenido de Landing Page
- ✅ Ve métricas de Kits vendidos
- ❌ NO puede modificar credenciales de MP/Telegram desde panel

**CUSTOMER:**
- ✅ Ve Kits en catálogo
- ✅ Ve Landing Page personalizada

### 🔗 Nuevas Navegaciones (NAV-*)

**NAV-ADM-009:** SCR-ADM-001 → SCR-ADM-005 (Kits)
**NAV-ADM-010:** SCR-ADM-001 → SCR-ADM-006 (Landing CMS)

---

### 🕵️ ESPECIFICACIONES ADICIONALES v1.3 (Integración de Brechas)

#### `BRG-CRUD-001` — Formulario de Creación de Usuarios (ADMIN)
- **Especificación:** Se formaliza la vista `CMP-ADM-USUARIO-FORM` en la ruta `frontend/src/app/admin/usuarios/page.tsx`. Permite al administrador completar los campos `email` (con validación de formato), `name` (opcional), `password` y seleccionar el rol (`SELLER` o `ADMIN`). La petición se envía a `POST /admin/usuarios`, y ante un error de email duplicado (`RN-ADM-001`) el frontend renderiza un mensaje rojo inline con el detalle retornado por el backend.

#### `BRG-CROSS-002` — Invalidador de Sesión JWT por Suspensión
- **Especificación:** Cuando el ADMIN marca a un usuario como inactivo (`is_active = false`) mediante `PATCH /admin/usuarios/{id}/suspender`, el middleware de autenticación del backend rechazará inmediatamente cualquier token JWT activo de este usuario arrojando `401 Unauthorized` (RN-USER-BLOCK-01).

#### `BRG-CROSS-003` — Propagación de Estado Kit Componente (Cascada)
- **Especificación:** Si un producto individual componente de un Kit cambia su propiedad a inactivo (`is_active = false`), el Kit contenedor ejecuta un callback a nivel de base de datos (`RN-KIT-SYNC-01`) que cambia automáticamente su propiedad `is_active` a `false`, ocultándolo del catálogo público y evitando compras de Kits incompletos.