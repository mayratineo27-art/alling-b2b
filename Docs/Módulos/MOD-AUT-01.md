## MOD-AUT-01 — Autenticación y Gestión de Sesión

- **Objetivo:** gestionar el ciclo de vida de identidad de los cuatro actores del sistema (login, MFA, gestión de sesión) y disparar la resolución de conflictos de migración GUEST→CUSTOMER.
- **Actores:** GUEST (sin autenticación, pero origina sesión vía cookie), CUSTOMER (login vía Google OAuth), SELLER (login local, MFA recomendado), ADMIN (login local, MFA obligatorio)
- **Procesos de negocio de origen:** transversal a 6.1, 6.2, 6.3 (autenticación de CUSTOMER), 6.4 (autenticación SELLER), 6.5 (autenticación ADMIN)
- **Integraciones:** Google OAuth (autenticación CUSTOMER)

---

### Operaciones Funcionales (OPS)

#### `OPS-AUT-001` — Iniciar sesión con Google (CUSTOMER)

- **Objetivo de negocio:** reducir fricción de registro para clientes, delegando la verificación de identidad a un proveedor confiable
- **Actor:** CUSTOMER (potencial, antes de autenticarse)
- **Proceso de negocio de origen:** 6.1, 6.2, 6.3 (transversal)
- **Estados de FSM involucrados:** ninguno directamente; dispara `AUTO-FU-003` (detección de conflicto de migración) como efecto colateral
- **Entidades afectadas:** `User` (crea si es primer login, o autentica si existe)
- **Eventos de dominio:** `EVT-AUT-001` (`SesionIniciada`), `EVT-AUT-002` (`UsuarioRegistrado`, solo si es la primera vez)
- **Pantallas:** `SCR-AUT-001`
- **Botones/acciones que la disparan:** `BTN-AUT-001`
- **Resultado esperado:** sesión CUSTOMER activa; si existía conflicto de FU, se dispara `OPS-FU-009`
- **Servicios de dominio involucrados:** `AuthService`, `UserService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-AUT-001` _(nueva referencia reservada: "CUSTOMER solo puede autenticarse vía Google, nunca con contraseña local")_
- **RF relacionados:** `RF-AUT-001`
- **HU relacionadas:** `HU-AUT-001`
- **UC relacionados:** `UC-AUT-001`
- **CA relacionados:** `CA-AUT-001`
- **TEST relacionados:** `TEST-AUT-001`

#### `OPS-AUT-002` — Iniciar sesión local (SELLER/ADMIN)

- **Objetivo de negocio:** autenticar personal interno con credenciales gestionadas internamente, sin depender de proveedores externos
- **Actor:** SELLER, ADMIN
- **Proceso de negocio de origen:** 6.4, 6.5
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** ninguna (lectura/verificación de `User`)
- **Eventos de dominio:** `EVT-AUT-001` (`SesionIniciada`)
- **Pantallas:** `SCR-AUT-002`
- **Botones/acciones que la disparan:** `BTN-AUT-002`
- **Resultado esperado:** si `mfa_enabled = true`, continúa a `OPS-AUT-003`; si no, sesión activa directamente
- **Servicios de dominio involucrados:** `AuthService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-AUT-002` _(nueva referencia reservada: "SELLER/ADMIN solo se autentican con credenciales locales, nunca con Google")_
- **RF relacionados:** `RF-AUT-002`
- **HU relacionadas:** `HU-AUT-002`
- **UC relacionados:** `UC-AUT-002`
- **CA relacionados:** `CA-AUT-002`
- **TEST relacionados:** `TEST-AUT-002`

#### `OPS-AUT-003` — Verificar código MFA (TOTP)

- **Objetivo de negocio:** reforzar la seguridad de cuentas con privilegios elevados, mitigando riesgo de acceso no autorizado por credenciales comprometidas
- **Actor:** SELLER (si habilitado), ADMIN (siempre obligatorio, según invariante de Sesión 1)
- **Proceso de negocio de origen:** 6.4, 6.5
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** ninguna (verificación contra `User.mfa_secret`)
- **Eventos de dominio:** `EVT-AUT-003` (`MFAVerificado`)
- **Pantallas:** `SCR-AUT-003`
- **Botones/acciones que la disparan:** `BTN-AUT-003`
- **Resultado esperado:** sesión completamente autenticada
- **Servicios de dominio involucrados:** `AuthService`, `MFAService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva (la obligatoriedad para ADMIN ya es invariante de `User` en Sesión 1)
- **RF relacionados:** `RF-AUT-003`
- **HU relacionadas:** `HU-AUT-003`
- **UC relacionados:** `UC-AUT-002` (sub-flujo)
- **CA relacionados:** `CA-AUT-003`
- **TEST relacionados:** `TEST-AUT-003`

#### `OPS-AUT-004` — Usar código de respaldo MFA

- **Objetivo de negocio:** evitar bloqueo permanente de cuenta cuando el dispositivo TOTP no está disponible
- **Actor:** SELLER, ADMIN
- **Proceso de negocio de origen:** 6.4, 6.5
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** `User` (consume un código de `mfa_backup_codes`)
- **Eventos de dominio:** `EVT-AUT-004` (`CodigoRespaldoUsado`)
- **Pantallas:** `SCR-AUT-003`
- **Botones/acciones que la disparan:** `ACT-AUT-001`
- **Resultado esperado:** sesión autenticada; código de respaldo invalidado (uso único)
- **Servicios de dominio involucrados:** `MFAService`
- **Prioridad funcional:** MVP+
- **RN relacionadas:** `RN-AUT-003` _(nueva referencia reservada: "cada código de respaldo es de un solo uso")_
- **RF relacionados:** `RF-AUT-004`
- **HU relacionadas:** `HU-AUT-004`
- **UC relacionados:** `UC-AUT-002` (sub-flujo alternativo)
- **CA relacionados:** `CA-AUT-004`
- **TEST relacionados:** `TEST-AUT-004`

#### `OPS-AUT-005` — Habilitar/configurar MFA (SELLER)

- **Objetivo de negocio:** permitir adopción voluntaria de seguridad reforzada para SELLER (recomendado, no obligatorio, según §2.1 del contexto original)
- **Actor:** SELLER
- **Proceso de negocio de origen:** 6.4
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** `User` (genera `mfa_secret`, `mfa_backup_codes`, fija `mfa_enabled = true`)
- **Eventos de dominio:** `EVT-AUT-005` (`MFAHabilitado`)
- **Pantallas:** `SCR-AUT-004`
- **Botones/acciones que la disparan:** `BTN-AUT-004`
- **Resultado esperado:** SELLER con MFA activo en sesiones futuras
- **Servicios de dominio involucrados:** `MFAService`
- **Prioridad funcional:** MVP+
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-AUT-005`
- **HU relacionadas:** `HU-AUT-005`
- **UC relacionados:** `UC-AUT-003`
- **CA relacionados:** `CA-AUT-005`
- **TEST relacionados:** `TEST-AUT-005`

#### `OPS-AUT-006` — Cerrar sesión

- **Objetivo de negocio:** permitir terminación explícita de sesión por el propio usuario, control básico de seguridad
- **Actor:** CUSTOMER, SELLER, ADMIN
- **Proceso de negocio de origen:** transversal
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** ninguna (invalidación de sesión/token)
- **Eventos de dominio:** `EVT-AUT-006` (`SesionCerrada`)
- **Pantallas:** disponible globalmente (menú de cuenta, no pantalla propia)
- **Botones/acciones que la disparan:** `BTN-AUT-005`
- **Resultado esperado:** sesión invalidada, redirección a estado no autenticado
- **Servicios de dominio involucrados:** `AuthService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna nueva
- **RF relacionados:** `RF-AUT-006`
- **HU relacionadas:** `HU-AUT-006`
- **UC relacionados:** `UC-AUT-004`
- **CA relacionados:** `CA-AUT-006`
- **TEST relacionados:** `TEST-AUT-006`

#### `OPS-AUT-009` — Renovar sesión mediante refresh token

- **Objetivo de negocio:** evitar que el usuario deba re-autenticarse cada 60 minutos (vigencia del access_token), sin renunciar a la posibilidad de revocar una sesión de forma efectiva (Zero Trust)
- **Actor:** CUSTOMER, SELLER, ADMIN (disparado automáticamente por el interceptor HTTP del frontend, no requiere acción explícita del usuario)
- **Proceso de negocio de origen:** transversal
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** `RefreshToken` (crea uno nuevo, revoca el usado — rotación)
- **Eventos de dominio:** ninguno nuevo
- **Pantallas:** ninguna (operación transparente vía interceptor HTTP)
- **Botones/acciones que la disparan:** ninguno (automático, disparado por `401` en cualquier petición autenticada)
- **Resultado esperado:** nuevo access_token y refresh_token emitidos; la petición original que disparó el `401` se reintenta transparentemente
- **Servicios de dominio involucrados:** `AuthService` (`crear_refresh_token`, `rotar_refresh_token`, `revocar_refresh_token`)
- **Prioridad funcional:** MVP+
- **RN relacionadas:** `RN-AUT-004`
- **RF relacionados:** `RF-AUT-009`
- **HU relacionadas:** `HU-AUT-007`
- **UC relacionados:** `UC-AUT-007`
- **CA relacionados:** `CA-AUT-009`
- **TEST relacionados:** `TEST-AUT-009`

---

### Pantallas (SCR)

#### `SCR-AUT-001` — Login (`/auth/login`)

- **Propósito:** punto de entrada de autenticación para todos los roles
- **Objetivo de negocio:** ser la puerta de entrada segura y diferenciada por tipo de actor
- **Valor para el usuario:** acceso rápido (un click para CUSTOMER vía Google)
- **Valor para el negocio:** reduce fricción de conversión (CUSTOMER) sin sacrificar seguridad (SELLER/ADMIN)
- **Actores autorizados:** público (no autenticado)
- **Estados:** con datos, cargando (durante redirect OAuth), error (credenciales inválidas)
- **Permisos:** ninguno
- **Dependencias con otras pantallas:** redirige a `SCR-AUT-003` si MFA aplica; dispara `OPS-FU-009` indirectamente para CUSTOMER
- **Navegación de entrada:** enlace directo, redirección desde rutas protegidas
- **Navegación de salida:** `NAV-AUT-001` (éxito CUSTOMER), `NAV-AUT-002` (a login local)

#### `SCR-AUT-002` — Login local (`/auth/login/staff`)

- **Propósito:** captura de credenciales para SELLER/ADMIN
- **Objetivo de negocio:** autenticación segura de personal interno
- **Valor para el usuario:** acceso directo sin pasos innecesarios
- **Valor para el negocio:** separación clara de superficies de autenticación por sensibilidad de rol
- **Actores autorizados:** público (no autenticado), pero solo SELLER/ADMIN tienen credenciales válidas
- **Estados:** con datos, cargando, error (credenciales inválidas), error (cuenta suspendida)
- **Permisos:** ninguno
- **Dependencias con otras pantallas:** redirige a `SCR-AUT-003` si MFA aplica
- **Navegación de entrada:** `NAV-AUT-002`
- **Navegación de salida:** `NAV-AUT-003`

#### `SCR-AUT-003` — Verificación MFA (`/auth/mfa/verify`)

- **Propósito:** capturar código TOTP o código de respaldo
- **Objetivo de negocio:** segundo factor de seguridad antes de conceder sesión completa
- **Valor para el usuario:** proceso corto (un código de 6 dígitos)
- **Valor para el negocio:** mitigación de riesgo de cuentas comprometidas
- **Actores autorizados:** SELLER/ADMIN con primer factor ya validado (sesión parcial)
- **Estados:** esperando código, error (código inválido), contador de intentos (ver nota de diseño sobre límite de intentos)
- **Permisos:** sesión parcial válida (post primer factor)
- **Dependencias con otras pantallas:** depende de `SCR-AUT-002`
- **Navegación de entrada:** `NAV-AUT-003`
- **Navegación de salida:** `NAV-AUT-004` (éxito, a panel correspondiente)

#### `SCR-AUT-004` — Configuración de seguridad (`/cuenta/seguridad`)

- **Propósito:** habilitar/gestionar MFA para SELLER
- **Objetivo de negocio:** autoservicio de seguridad
- **Valor para el usuario:** control sobre su propio nivel de protección
- **Valor para el negocio:** adopción voluntaria de buenas prácticas de seguridad
- **Actores autorizados:** SELLER (ADMIN ya tiene MFA obligatorio, no necesita esta pantalla para habilitarlo, aunque podría usarla para regenerar códigos — ver nota de diseño)
- **Estados:** MFA deshabilitado (flujo de activación), MFA habilitado (vista de gestión/códigos de respaldo)
- **Permisos:** sesión SELLER (o ADMIN)
- **Dependencias con otras pantallas:** ninguna
- **Navegación de entrada:** `NAV-AUT-005` (menú de cuenta)
- **Navegación de salida:** ninguna (terminal)

---

### Componentes (CMP)

**`SCR-AUT-001`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-AUT-001`|Botón "Iniciar con Google"|Soporta `OPS-AUT-001`|—|token OAuth|`BTN-AUT-001`|
|`CMP-AUT-002`|Enlace a login staff|Navega a `SCR-AUT-002`|—|—|—|

**`SCR-AUT-002`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-AUT-003`|Formulario de credenciales|Soporta `OPS-AUT-002`|—|`email`, `password`|`BTN-AUT-002`|
|`CMP-AUT-004`|Mensaje de error de login|Feedback de credenciales inválidas|resultado de autenticación|—|`CMP-AUT-003`|

**`SCR-AUT-003`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-AUT-005`|Campo de código TOTP|Soporta `OPS-AUT-003`|—|código de 6 dígitos|`BTN-AUT-003`|
|`CMP-AUT-006`|Contador de expiración|Comunica ventana de validez del TOTP|tiempo restante|—|—|
|`CMP-AUT-007`|Enlace "Usar código de respaldo"|Soporta `OPS-AUT-004`|—|navegación a input alternativo|`ACT-AUT-001`|

**`SCR-AUT-004`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-AUT-008`|Toggle de habilitación MFA|Inicia `OPS-AUT-005`|`User.mfa_enabled`|—|`BTN-AUT-004`|
|`CMP-AUT-009`|Código QR|Muestra secret para vincular app TOTP|`mfa_secret` (codificado)|—|`CMP-AUT-008`|
|`CMP-AUT-010`|Lista de códigos de respaldo|Muestra los 10 códigos generados (una sola vez)|`mfa_backup_codes` (en claro, solo al generar)|—|`CMP-AUT-008`|

---

### Botones (BTN)

#### `BTN-AUT-001` — "Iniciar sesión con Google"

- Pantalla: `SCR-AUT-001` | Actor: CUSTOMER (potencial) | Estado donde aparece: siempre
- Operación funcional: `OPS-AUT-001`
- Proceso de negocio de origen: 6.1, 6.2, 6.3
- Precondiciones: ninguna
- Postcondiciones: sesión CUSTOMER activa
- Errores posibles: `401` si Google rechaza la autenticación; `502` si el proveedor OAuth no responde
- Excepciones: ninguna
- Restricciones: `RN-AUT-001`
- Impacto en la FSM: ninguno directo; dispara indirectamente `OPS-FU-009` si aplica
- Eventos generados: `EVT-AUT-001`, `EVT-AUT-002` (condicional)
- Confirmación: no | Mensaje: ninguno (redirección) | Navegación posterior: `NAV-AUT-001` | Permisos: ninguno

#### `BTN-AUT-002` — "Iniciar sesión" (local)

- Pantalla: `SCR-AUT-002` | Actor: SELLER, ADMIN | Estado donde aparece: formulario completo
- Operación funcional: `OPS-AUT-002`
- Proceso de negocio de origen: 6.4, 6.5
- Precondiciones: email y password no vacíos
- Postcondiciones: sesión parcial activa (pendiente MFA si aplica)
- Errores posibles: `401` (credenciales inválidas); `403` (cuenta suspendida)
- Excepciones: ninguna
- Restricciones: `RN-AUT-002`
- Impacto en la FSM: ninguno
- Eventos generados: `EVT-AUT-001` (si no requiere MFA)
- Confirmación: no | Mensaje: error inline si falla | Navegación posterior: `NAV-AUT-003` | Permisos: ninguno

#### `BTN-AUT-003` — "Verificar"

- Pantalla: `SCR-AUT-003` | Actor: SELLER, ADMIN | Estado donde aparece: código ingresado
- Operación funcional: `OPS-AUT-003`
- Proceso de negocio de origen: 6.4, 6.5
- Precondiciones: sesión parcial válida; código de 6 dígitos
- Postcondiciones: sesión completa activa
- Errores posibles: `401` (código inválido o expirado); `429` (demasiados intentos, ver nota de diseño)
- Excepciones: ninguna
- Restricciones: ninguna adicional
- Impacto en la FSM: ninguno
- Eventos generados: `EVT-AUT-003`
- Confirmación: no | Mensaje: error inline si falla | Navegación posterior: `NAV-AUT-004` | Permisos: ninguno (sesión parcial)

#### `BTN-AUT-004` — "Activar MFA"

- Pantalla: `SCR-AUT-004` | Actor: SELLER | Estado donde aparece: MFA deshabilitado
- Operación funcional: `OPS-AUT-005`
- Proceso de negocio de origen: 6.4
- Precondiciones: MFA no habilitado previamente
- Postcondiciones: `mfa_enabled = true`; secret y códigos de respaldo generados
- Errores posibles: ninguno esperado
- Excepciones: ninguna
- Restricciones: ninguna adicional
- Impacto en la FSM: ninguno
- Eventos generados: `EVT-AUT-005`
- Confirmación: sí (debe confirmar con un primer código TOTP válido antes de activar definitivamente) | Mensaje: muestra códigos de respaldo una sola vez | Navegación posterior: ninguna | Permisos: rol SELLER

#### `BTN-AUT-005` — "Cerrar sesión"

- Pantalla: global (menú de cuenta) | Actor: CUSTOMER, SELLER, ADMIN | Estado donde aparece: sesión activa
- Operación funcional: `OPS-AUT-006`
- Proceso de negocio de origen: transversal
- Precondiciones: sesión activa
- Postcondiciones: sesión invalidada
- Errores posibles: ninguno esperado
- Excepciones: ninguna
- Restricciones: ninguna
- Impacto en la FSM: ninguno
- Eventos generados: `EVT-AUT-006`
- Confirmación: no | Mensaje: ninguno | Navegación posterior: a `SCR-AUT-001` o home | Permisos: cualquier sesión activa

---

### Acciones (ACT)

|ID|Acción|Pantalla|Actor|Operación asociada|Resultado|
|---|---|---|---|---|---|
|`ACT-AUT-001`|Click en "Usar código de respaldo"|`SCR-AUT-003`|SELLER, ADMIN|`OPS-AUT-004`|Cambia input a modo código de respaldo|

---

### Navegación (NAV)

|ID|Desde|Hacia|Disparador|Flujo|Condición de entrada|Permisos|Bloqueado si|
|---|---|---|---|---|---|---|---|
|`NAV-AUT-001`|`SCR-AUT-001`|Pantalla previa o home|Éxito de `OPS-AUT-001`|Principal|—|—|—|
|`NAV-AUT-002`|`SCR-AUT-001`|`SCR-AUT-002`|`CMP-AUT-002`|Alternativo|—|—|—|
|`NAV-AUT-003`|`SCR-AUT-002`|`SCR-AUT-003`|Éxito de `OPS-AUT-002`, si `mfa_enabled = true`|Principal|`mfa_enabled = true`|—|`mfa_enabled = false` (salta directo a panel)|
|`NAV-AUT-004`|`SCR-AUT-003`|Panel SELLER o ADMIN|Éxito de `OPS-AUT-003`/`OPS-AUT-004`|Principal|—|—|—|
|`NAV-AUT-005`|Menú de cuenta|`SCR-AUT-004`|Click en "Seguridad"|Principal|Sesión SELLER/ADMIN|SELLER, ADMIN|Sin sesión|

---

### Funcionalidades Automáticas (AUTO)

#### `AUTO-AUT-001` — Detección de cuenta suspendida en login

- **Evento disparador:** intento de login (`OPS-AUT-002`) sobre un `User` con `is_suspended = true`
- **Responsable:** `AuthService`
- **Condiciones de ejecución:** siempre, como parte de la validación de `OPS-AUT-002`
- **Resultado esperado:** login rechazado con mensaje específico de cuenta suspendida (no genérico "credenciales inválidas", para no confundir con error de password)
- **Manejo de errores:** ninguno adicional; es en sí mismo un manejo de caso de error

---

### Eventos de Dominio (EVT)

|ID|Evento|Disparado por|
|---|---|---|
|`EVT-AUT-001`|`SesionIniciada`|`OPS-AUT-001`, `OPS-AUT-002`|
|`EVT-AUT-002`|`UsuarioRegistrado`|`OPS-AUT-001` (condicional, primer login)|
|`EVT-AUT-003`|`MFAVerificado`|`OPS-AUT-003`|
|`EVT-AUT-004`|`CodigoRespaldoUsado`|`OPS-AUT-004`|
|`EVT-AUT-005`|`MFAHabilitado`|`OPS-AUT-005`|
|`EVT-AUT-006`|`SesionCerrada`|`OPS-AUT-006`|

---

### Reglas de Negocio relacionadas (RN)

`RN-AUT-001`, `RN-AUT-002`, `RN-AUT-003` (todas reservadas, nuevas)

### Requisitos Funcionales relacionados (RF)

`RF-AUT-001` a `RF-AUT-006`

### Historias de Usuario relacionadas (HU)

`HU-AUT-001` a `HU-AUT-006`

### Casos de Uso relacionados (UC)

`UC-AUT-001`, `UC-AUT-002`, `UC-AUT-003`, `UC-AUT-004`

### Criterios de Aceptación relacionados (CA)

`CA-AUT-001` a `CA-AUT-006`

### Casos de Prueba relacionados (TEST)

`TEST-AUT-001` a `TEST-AUT-006`

---

### Notas de diseño y decisiones del módulo

**Vacío detectado — límite de intentos MFA no definido:** el contexto original no especifica cuántos intentos fallidos de código TOTP se permiten antes de bloqueo temporal. No invento un número arbitrario; se señala como parámetro pendiente, candidato natural para `OPS-ADM-007` (configuración del sistema) una vez decidido.

**Capacidad de ADMIN forzar MFA en SELLER (vacío ya señalado en la auditoría inicial, AMB/INC-02):** el contexto original sugiere en §6.4.A que el ADMIN puede habilitar MFA obligatorio para SELLER ("si está habilitado por ADMIN"), pero no hay una operación documentada en `MOD-ADM-01` para esto. Señalo aquí la dependencia cruzada: si se confirma esta capacidad, `MOD-ADM-01` necesitará una `OPS-ADM-009` nueva ("Forzar MFA en SELLER específico o globalmente"), pendiente de decisión antes de cerrarse como vacío resuelto.

**Regeneración de códigos de respaldo no contemplada:** una vez los 10 códigos de `OPS-AUT-005` se consumen o se pierden, no hay operación documentada para regenerarlos. Se señala como funcionalidad razonablemente inferible pero no construida automáticamente, a la espera de definición explícita.

---

### Impacto en documentos globales

- **Modelo de Dominio:** sin cambios estructurales. Confirma uso de atributos ya definidos en Sesión 1 (`User.mfa_enabled`, `mfa_secret`, `mfa_backup_codes`, `auth_provider`, `google_sub`, `password_hash`).
- **FSM:** sin cambios. Ningún OPS de este módulo ejecuta transiciones de FSM-01/FSM-02 directamente (la conexión con `OPS-FU-009` es una dependencia de orquestación, no una transición propia de este módulo).
- **Arquitectura:** sin cambios identificados aún, pendiente de definir si la verificación TOTP y el almacenamiento de sesión usan un mecanismo concreto (JWT, sesión server-side) — corresponde a una decisión técnica, no arquitectónica de alto nivel.
- **Base de Datos:** sin cambios.
- **Decisiones Técnicas:** **requiere una decisión nueva** registrada: límite de intentos MFA fallidos antes de bloqueo temporal; mecanismo de regeneración de códigos de respaldo.
- **Catálogo Global de Eventos:** se deben incorporar `EVT-AUT-001` a `EVT-AUT-006` al catálogo global.
---
## 🆕 EXTENSIONES v1.2 (Mejoras UI/UX e Integraciones)

### 📋 Nuevos Requisitos Funcionales
- **RF-AUT-007:** Migración GUEST → CUSTOMER (fusión automática de carritos)
- **RF-AUT-008:** Auto-completado de datos de facturación para CUSTOMER

### 🔧 Nuevos Componentes (CMP-*)

**CMP-AUT-009: Modal de Migración GUEST → CUSTOMER**
- Se muestra durante checkout si GUEST tiene FU activo
- Texto: "¿Ya tienes una cuenta? Inicia sesión para vincular tu pedido"
- Botones:
  - "Iniciar sesión con Google"
  - "Ingresar credenciales"
  - "Continuar como invitado"
- **Comportamiento:** 
  - Si inicia sesión → fusión de carritos (RN-GUEST-MIGRATE-01)
  - Si continúa → checkout sin cuenta

**CMP-AUT-010: Formulario de Facturación Auto-completado**
- Si CUSTOMER: campos pre-llenados desde perfil
- Si GUEST: campos vacíos
- Editable en ambos casos

### 📜 Nuevas Reglas de Negocio

**RN-GUEST-MIGRATE-01:** Fusión automática de carritos:
- GUEST tiene FU con items: [A:2, B:3]
- CUSTOMER tiene FU con items: [A:1, C:4]
- Resultado post-login: [A:3, B:3, C:4]
- Si hay conflicto (mismo SKU), se suman cantidades

### 🔄 Impacto en Actores

**GUEST:**
- ✅ Puede pagar sin registrarse
- ✅ Se le ofrece registrarse durante checkout
- ✅ Si se registra, no pierde su carrito

**CUSTOMER:**
- ✅ Login con Google OAuth o credenciales
- ✅ Datos de facturación auto-completados
- ✅ Carrito fusionado si tenía items como GUEST

### 🔗 Nuevas Navegaciones (NAV-*)

**NAV-AUT-007:** SCR-CHK-001 → Modal Migración (si GUEST hace clic en "Iniciar sesión")
**NAV-AUT-008:** Modal Migración → SCR-CHK-001 (post-fusión)

---

### 🔘 Mapeo de Botones y Requerimiento de Color

| ID Botón | Nombre / Función del Botón | Componente / Archivo Frontend | Requerimiento de Color |
| :--- | :--- | :--- | :--- |
| **`BTN-AUT-001`** | Iniciar Sesión con Google | `src/app/auth/login/page.tsx` | **Fondo Blanco (`#FFFFFF`)** con borde gris (`#D1D5DB`) y texto oscuro (`#111827`). |
| **`BTN-AUT-002`** | Iniciar Sesión (Credenciales) | `src/app/admin/login/page.tsx` | **Verde Esmeralda Primario (`#10B981`)** con hover verde oscuro (`#059669`). |
