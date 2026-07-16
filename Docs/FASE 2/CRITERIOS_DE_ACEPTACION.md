Como QA Lead, he derivado los Criterios de Aceptación (CA) siguiendo estrictamente la sintaxis Gherkin (Given/When/Then). Estos criterios están diseñados para ser convertidos directamente en scripts de pruebas automatizadas (Pytest-BDD para backend, Playwright para E2E).

A continuación, presento los CA para los **4 módulos críticos del negocio** (Catálogo, Formato Único, Checkout y Autenticación).

---

### CA-CAT-003 — Agregar producto al Formato Único

**Objetivo:** Verificar que el sistema permite agregar productos al contenedor central respetando las restricciones de stock y límites por rol. **RF relacionado:** RF-CAT-003 **HU relacionada:** HU-CAT-003 **UC relacionado:** UC-CAT-003

**Escenarios:**

**Escenario 1: Agregar producto exitosamente (Happy Path)**

- **Given** un producto activo con `stock = 10`
- **And** el actor (GUEST o CUSTOMER) no tiene un Formato Único activo (o tiene uno en `BORRADOR`)
- **When** el actor ejecuta la acción de agregar el producto con `quantity = 2`
- **Then** el sistema crea o actualiza el `FormatoUnicoItem` con la cantidad solicitada
- **And** el estado del Formato Único permanece o pasa a `BORRADOR`
- **And** se emite el evento `EVT-FU-002` (ItemAgregado)

**Escenario 2: Intentar agregar producto sin stock (Restricción de Inventario)**

- **Given** un producto activo con `stock = 0`
- **When** el actor intenta agregar el producto al Formato Único
- **Then** el sistema rechaza la operación con código HTTP `409 Conflict`
- **And** no se crea ni modifica ningún `FormatoUnicoItem`

**Escenario 3: Límite de Formato Único para GUEST (Regla de Negocio)**

- **Given** un actor con rol `GUEST`
- **And** el GUEST ya posee un `FormatoUnico` activo en estado `BORRADOR` vinculado a su `guest_token`
- **When** el GUEST intenta agregar un producto que crearía un segundo Formato Único (ej. sesión cruzada no manejada)
- **Then** el sistema rechaza la operación con código HTTP `409`
- **And** el mensaje indica que solo se permite un Formato Único activo por sesión anónima (RN-GUEST-01)

---

### CA-FU-003 — Vaciar Formato Único

**Objetivo:** Verificar que el actor dueño del Formato Único puede eliminar todos sus ítems en una sola operación, sin poder hacerlo sobre un FU ajeno ni fuera de `BORRADOR`. **RF relacionado:** RF-FU-003 **HU relacionada:** HU-FU-003 **UC relacionado:** UC-FU-001

*(Nota de implementación: este CA estaba referenciado en `MATRIZ_DE_TRAZABILIDAD.md` y `MOD-FU-01.md` desde antes, pero su contenido nunca se redactó — se completa aquí al cerrar el reporte de soporte "no se puede vaciar el Formato Único", causado por un proceso de backend desactualizado que no tenía cargada la ruta `DELETE /{id}/items`, y aprovechado para cerrar además un hueco de ownership pre-existente en ese mismo endpoint.)*

**Escenarios:**

**Escenario 1: Vaciar exitosamente (Happy Path)**

- **Given** un `FormatoUnico` en estado `BORRADOR` con 1 o más ítems, perteneciente al actor (GUEST vía `order_token` o CUSTOMER vía JWT)
- **When** el actor ejecuta "Vaciar Formato Único" (`BTN-FU-002`)
- **Then** el sistema elimina todos los `FormatoUnicoItem` del agregado
- **And** el `subtotal` se recalcula a `0.00`
- **And** el estado permanece en `BORRADOR`

**Escenario 2: Intentar vaciar un Formato Único ajeno (RNF-SEC-001)**

- **Given** un `FormatoUnico` perteneciente al CUSTOMER A
- **When** el CUSTOMER B intenta vaciarlo con su propio JWT
- **Then** el sistema rechaza la operación con código HTTP `403`
- **And** los ítems del FU de A permanecen intactos

**Escenario 3: Intentar vaciar fuera de BORRADOR**

- **Given** un `FormatoUnico` en estado `COTIZACIÓN`
- **When** el dueño intenta ejecutar "Vaciar Formato Único"
- **Then** el sistema rechaza la operación con código HTTP `400`

---

### CA-FU-005 — Generar Cotización

**Objetivo:** Verificar la transición de Formato Único a Cotización, asegurando la fijación de precios y la generación del PDF. **RF relacionado:** RF-FU-005 **HU relacionada:** HU-FU-005 **UC relacionado:** UC-FU-003

**Escenarios:**

**Escenario 1: Generación exitosa de Cotización (CUSTOMER)**

- **Given** un actor con rol `CUSTOMER` autenticado
- **And** un `FormatoUnico` en estado `BORRADOR` con al menos 1 ítem y stock suficiente
- **When** el actor solicita "Generar Cotización"
- **Then** el sistema transiciona el estado a `COTIZACIÓN` (`FU-T-03`)
- **And** el sistema fija el campo `price_at_time` en cada ítem con el valor actual del catálogo
- **And** el sistema establece `expires_at` a 15 días a partir del momento actual
- **And** se genera y almacena el PDF en el storage
- **And** se emite el evento `EVT-FU-004` (CotizacionGenerada)

**Escenario 2: GUEST intenta generar Cotización (Validación de Rol)**

- **Given** un actor con rol `GUEST` (no autenticado)
- **And** un `FormatoUnico` en estado `BORRADOR`
- **When** el actor intenta ejecutar la transición a `COTIZACIÓN`
- **Then** el sistema rechaza la operación con código HTTP `403 Forbidden`
- **And** el estado del Formato Único permanece en `BORRADOR` (RN-FU-01)

**Escenario 3: Cotización con stock insuficiente al momento de transicionar**

- **Given** un `FormatoUnico` en `BORRADOR` con un ítem de `quantity = 5`
- **And** el stock real del producto en el catálogo baja a `3` antes de la transición
- **When** el actor solicita "Generar Cotización"
- **Then** el sistema rechaza la operación con código HTTP `409 Conflict`
- **And** la respuesta incluye la lista de productos con stock insuficiente (AUTO-FU-004)

---

### CA-CHK-004 — Confirmar Pago (Webhook Idempotente)

**Objetivo:** Verificar el procesamiento seguro e idempotente de los webhooks de MercadoPago. **RF relacionado:** RF-CHK-004 **HU relacionada:** HU-CHK-004 **UC relacionado:** UC-CHK-003

**Escenarios:**

**Escenario 1: Procesamiento exitoso de webhook de pago aprobado**

- **Given** un `Order` en estado `PENDING_PAYMENT`
- **And** un webhook entrante con `status=approved`, firma HMAC válida y `event_id` único
- **When** el sistema recibe y procesa el webhook
- **Then** el `Order` transiciona a estado `PAID` (`ORD-T-02`)
- **And** el `FormatoUnico` asociado transiciona a `CONFIRMADO` (`FU-T-12`)
- **And** se registra el `event_id` en la tabla `PaymentIdempotencyKey`
- **And** se encola el envío de email de confirmación

**Escenario 2: Webhook duplicado (Idempotencia)**

- **Given** un webhook con `event_id = "evt_123"` ya procesado exitosamente
- **When** el sistema recibe nuevamente el mismo webhook con `event_id = "evt_123"`
- **Then** el sistema responde con HTTP `200 OK`
- **And** **NO** se modifica el estado del `Order` (permanece en `PAID`)
- **And** **NO** se genera un segundo email de confirmación

**Escenario 3: Webhook con firma HMAC inválida (Seguridad)**

- **Given** un webhook entrante con payload manipulado o firma incorrecta
- **When** el sistema valida la firma HMAC
- **Then** el sistema responde con HTTP `401 Unauthorized`
- **And** se registra el intento en `AuditLog` como posible actividad sospechosa
- **And** no se procesa ninguna mutación de estado

---

### CA-AUT-002/003 — Login Local y Verificación MFA

**Objetivo:** Verificar el flujo de autenticación para personal interno y la obligatoriedad del segundo factor para ADMIN. **RF relacionado:** RF-AUT-002, RF-AUT-003 **HU relacionada:** HU-AUT-002, HU-AUT-003 **UC relacionado:** UC-AUT-002

**Escenarios:**

**Escenario 1: Login exitoso de SELLER sin MFA habilitado**

- **Given** un usuario con rol `SELLER` y `mfa_enabled = false`
- **And** credenciales (email/password) válidas
- **When** el usuario envía el formulario de login local
- **Then** el sistema valida las credenciales
- **And** emite un JWT de sesión completo directamente
- **And** redirige al panel de SELLER (`/vendedor`)

**Escenario 2: Login de ADMIN requiere MFA obligatorio**

- **Given** un usuario con rol `ADMIN` y `mfa_enabled = true`
- **And** credenciales válidas
- **When** el usuario envía el formulario de login local
- **Then** el sistema valida el primer factor (password)
- **And** **NO** emite el JWT de sesión completo
- **And** redirige al usuario a `/auth/mfa/verify` solicitando el código TOTP

**Escenario 3: Código TOTP inválido o expirado**

- **Given** un usuario en la pantalla de verificación MFA (`SCR-AUT-003`)
- **When** el usuario ingresa un código TOTP de 6 dígitos incorrecto o expirado
- **Then** el sistema responde con HTTP `401 Unauthorized`
- **And** muestra un mensaje de error inline "Código inválido o expirado"
- **And** no concede acceso al panel

---

### CA-SEL-002 — Actualizar Stock de Producto

**Objetivo:** Verificar que el SELLER puede actualizar el inventario respetando las validaciones de integridad. **RF relacionado:** RF-SEL-002 **HU relacionada:** HU-SEL-002 **UC relacionado:** UC-SEL-001

**Escenarios:**

**Escenario 1: Actualización válida de stock**

- **Given** un actor con rol `SELLER` autenticado
- **And** un producto con `stock = 50`
- **When** el SELLER ingresa `stock = 45` y guarda los cambios
- **Then** el sistema actualiza `Product.stock` a 45
- **And** el badge de stock en el catálogo público se recalcula (`AUTO-CAT-001`)
- **And** se emite el evento `EVT-SEL-001` (StockActualizado)

**Escenario 2: Intento de establecer stock negativo (Validación)**

- **Given** un actor con rol `SELLER`
- **When** el SELLER intenta ingresar `stock = -5`
- **Then** el sistema rechaza la operación con código HTTP `422 Unprocessable Entity`
- **And** muestra un mensaje de validación inline "El stock no puede ser negativo" (RN-SEL-001)
- **And** el valor anterior del stock se mantiene intacto

---

### CA-ADM-004 — Eliminar Usuario (Soft-Delete)

**Objetivo:** Verificar la eliminación segura de usuarios preservando la integridad referencial. **RF relacionado:** RF-ADM-004 **HU relacionada:** HU-ADM-004 **UC relacionado:** UC-ADM-001

**Escenarios:**

**Escenario 1: Soft-delete exitoso de usuario CUSTOMER**

- **Given** un actor con rol `ADMIN`
- **And** un usuario target con rol `CUSTOMER`
- **When** el ADMIN ejecuta la acción de eliminar usuario
- **Then** el sistema marca `User.is_active = false` y registra `deleted_at`
- **And** los registros históricos en `Order` y `AuditLog` referencian al usuario (integridad preservada)
- **And** se emite el evento `EVT-ADM-003` (UsuarioEliminado)

**Escenario 2: ADMIN intenta eliminarse a sí mismo (Restricción de Seguridad)**

- **Given** un actor con rol `ADMIN`
- **When** el ADMIN intenta ejecutar la acción de eliminar sobre su propio `user_id`
- **Then** el sistema rechaza la operación con código HTTP `403 Forbidden`
- **And** el mensaje indica "No puede eliminar su propia cuenta" (RN-ADMIN-01)

---

### 📋 Notas para la Automatización (QA Lead)

1. **Mapeo a Pytest-BDD:** Cada escenario `Given/When/Then` se mapeará directamente a funciones `@given`, `@when`, `@then` en `tests/integration/`.
2. **Mapeo a Playwright:** Los escenarios que involucran UI (ej. CA-AUT-003 Escenario 3, CA-SEL-002 Escenario 2) se implementarán en `tests/e2e/` verificando los mensajes de error en el DOM.
3. **Datos de Prueba:** Se utilizará `Factory Boy` para generar los estados `Given` (ej. `FormatoUnicoFactory(state='BORRADOR')`) asegurando aislamiento entre tests.
---
## 🆕 EXTENSIONES v1.2 (Criterios de Aceptación Clave)

> **Nota:** Se listan los CA más críticos por RF nuevo. Para el detalle completo, revisar la Matriz de Trazabilidad.

###  Criterios Transversales (SYS)
- **CA-SYS-001:** El sistema debe aplicar la paleta de colores corporativa (Turquesa #10B981) en todos los botones primarios.
- **CA-SYS-002:** El header debe mantenerse visible (sticky) al hacer scroll en todas las vistas.
- **CA-SYS-003:** El footer debe mostrarse con tema oscuro en todas las páginas públicas.

### 🛒 Criterios de Catálogo (CAT)
- **CA-CAT-004 (Landing Page):** 
  - **Escenario 1: GUEST accede a Landing Page:**
    - *Given* un visitante no autenticado (GUEST)
    - *When* accede a la raíz del sitio `/`
    - *Then* el sistema consume `/productos/landing` y renderiza el Hero Banner (CMP-CAT-023), los productos destacados sin precios (CMP-CAT-024) y el grid de categorías (CMP-CAT-025).
  - **Escenario 2: CUSTOMER accede a Landing Page (Redirección):**
    - *Given* un usuario autenticado con rol `CUSTOMER`
    - *When* intenta acceder a la raíz `/`
    - *Then* el sistema lo redirige automáticamente al Dashboard (`/dashboard`).
- **CA-CAT-005 (Grid de Categorías Intermedio):**
  - **Escenario 1: Clic en categoría navega a catálogo filtrado:**
    - *Given* un usuario en la página intermedia de categorías (`SCR-CAT-004`)
    - *When* hace clic en la tarjeta de la categoría "Redes"
    - *Then* el sistema redirige al catálogo general (`/productos?categoria=Redes`).
- **CA-CAT-006 (Kits Pre-armados):**
  - **Escenario 1: Agregar Kit al Formato Único con stock suficiente:**
    - *Given* un kit con componentes "Router Wi-Fi 6" (stock 5) y "Cable Fibra" (stock 10)
    - *When* el usuario hace clic en "Agregar Kit al Formato Único"
    - *Then* el sistema agrega 1 unidad de "Router Wi-Fi 6" y 1 unidad de "Cable Fibra" al FU
    - *And* recalcula el subtotal en base a la suma de precios de los componentes (RN-KIT-01).
- **CA-CAT-007 (Favoritos):**
  - **Escenario 1: CUSTOMER agrega favorito:**
    - *Given* un CUSTOMER autenticado en `SCR-CAT-001`
    - *When* hace clic en el botón de corazón (`BTN-CAT-006`) del "Router Wi-Fi 6"
    - *Then* el sistema envía un `POST /favoritos/{producto_id}`
    - *And* marca visualmente el corazón en la UI.
  - **Escenario 2: GUEST intenta agregar favorito (Restricción):**
    - *Given* un visitante no autenticado (GUEST)
    - *Then* el sistema no muestra el icono de corazón (corazón oculto, RN-FAV-01).
- **CA-CAT-008 (Telegram):**
  - **Escenario 1: Clic en Telegram redirige con payload correcto:**
    - *Given* un usuario visualizando el detalle de un producto o el catálogo
    - *When* hace clic en "Consultar por Telegram" (`BTN-CAT-007`)
    - *Then* el sistema abre una pestaña externa a `https://t.me/allingtechnology` con el mensaje formateado que incluye el SKU e ID del producto (RN-TG-01).

###  Criterios de Formato Único (FU)
- **CA-FU-012:** Al iniciar sesión, un CUSTOMER debe ser redirigido automáticamente a su Dashboard.
- **CA-FU-013:** El sistema debe procesar un Excel de 500 filas en menos de 5 segundos.
- **CA-FU-019:** Si un SKU no existe, la fila debe marcarse en rojo y no debe bloquear la importación del resto.

### 💳 Criterios de Checkout (CHK)
- **CA-CHK-010:** Al iniciar el pago, el stock debe reservarse temporalmente (reserved_stock).
- **CA-CHK-011:** Si el pago no se confirma en 30 minutos, la reserva de stock debe liberarse automáticamente.
- **CA-CHK-013:** La pantalla de confirmación debe mostrar el número de orden y un botón para descargar el comprobante.

### 🔐 Criterios de Autenticación (AUT)
### 🔐 Criterios de Autenticación (AUT)
- **CA-AUT-007:** Si un GUEST con carrito activo inicia sesión, los ítems de su carrito deben fusionarse con los de su cuenta CUSTOMER.

---

### 🕵️ Criterios de Aceptación para Integración de Brechas (v1.3)

**CA-NAV-001 (Persistent Header Link & Count)**
- **Escenario 1: Visualización del carrito en todas las vistas públicas**
  - *Given* un visitante (GUEST o CUSTOMER) en cualquier vista del catálogo o landing
  - *When* renderiza la página
  - *Then* se muestra un componente `CMP-HEADER-CART-BUTTON` en el header global
  - *And* el badge muestra la cantidad exacta de productos acumulados.

**CA-CRUD-001 (ADMIN User Creation Form)**
- **Escenario 1: Creación exitosa de usuario SELLER por ADMIN**
  - *Given* un usuario autenticado con rol `ADMIN`
  - *When* completa el formulario `CMP-ADM-USUARIO-FORM` con email corporativo único y contraseña y envía la petición
  - *Then* el sistema responde con `201 Created`
  - *And* se almacena el nuevo usuario en base de datos.

**CA-CROSS-001 (Pricing Synchronization in Cart)**
- **Escenario 1: Recálculo automático de precio en BORRADOR**
  - *Given* un Formato Único en estado `BORRADOR` con Producto A
  - *And* el precio de Producto A cambia de S/.50 a S/.60 en el catálogo
  - *When* el cliente consulta `/formatos/me`
  - *Then* el precio del ítem se actualiza automáticamente a S/.60 y se recalcula el subtotal (RN-PRICING-05).
- **Escenario 2: Cotización mantiene precio congelado**
  - *Given* un Formato Único en estado `COTIZACION` con Producto A
  - *And* el precio de Producto A cambia de S/.50 a S/.60
  - *When* el cliente visualiza `/formatos/me` o descarga el PDF
  - *Then* el precio del ítem se mantiene inalterado en S/.50 (fijado).

**CA-CROSS-002 (Forced Logout on Suspension)**
- **Escenario 1: Suspensión invalida JWT**
  - *Given* un usuario CUSTOMER con token JWT activo
  - *When* el ADMIN suspende al usuario (`is_active = false`)
  - *Then* cualquier petición subsiguiente del CUSTOMER al backend con ese JWT es rechazada con `401 Unauthorized` (RN-USER-BLOCK-01).

**CA-CROSS-003 (Kit Components Synchronization)**
- **Escenario 1: Desactivación de componente desactiva Kit**
  - *Given* un Kit X que requiere del Producto A para su compra (RN-KIT-02)
  - *When* el ADMIN desactiva el Producto A en el catálogo
  - *Then* el sistema marca automáticamente el Kit X como inactivo (`is_active = false`, RN-KIT-SYNC-01).

**CA-CROSS-005 (Temporary Stock Release)**
- **Escenario 1: Liberación de stock tras timeout**
  - *Given* un pedido iniciado (`reserved_stock = 10`)
  - *When* transcurren 31 minutos sin confirmación de pago
  - *Then* el cron job (`AUTO-CHK-003`) libera el stock (`reserved_stock = 0`, stock_disponible restaurado).

---

###  Criterios de Formato Único Adicionales (v1.4)

#### **CA-FU-010 (Consultar historial de Formatos Únicos)**
- **Objetivo:** Verificar que el CUSTOMER autenticado puede ver el listado de todos sus Formatos Únicos en cualquier estado, mientras que un GUEST no tiene acceso directo a este historial.
- **RF relacionado:** RF-FU-010
- **HU relacionada:** HU-FU-010
- **UC relacionado:** UC-FU-007

**Escenarios:**

**Escenario 1: CUSTOMER autenticado consulta su historial de Formatos Únicos exitosamente**
- **Given** un actor con rol `CUSTOMER` autenticado
- **And** el CUSTOMER posee 3 Formatos Únicos registrados (uno en `BORRADOR`, uno en `COTIZACION` y uno en `CANCELADO`)
- **When** el CUSTOMER solicita ver su historial de Formatos Únicos en `/cuenta/formatos`
- **Then** el sistema responde con HTTP `200 OK`
- **And** renderiza el listado con los 3 Formatos Únicos mostrando su ID, fecha de actualización y estado correspondiente
- **And** los precios de los ítems en el formato `BORRADOR` están actualizados con respecto al catálogo, mientras que los de `COTIZACION` se muestran fijos.

**Escenario 2: GUEST intenta consultar historial de Formatos Únicos (Restricción de Seguridad)**
- **Given** un actor con rol `GUEST` (no autenticado)
- **When** el GUEST intenta acceder a la ruta del historial de Formatos Únicos `/cuenta/formatos`
- **Then** el sistema rechaza la operación con código HTTP `401 Unauthorized` (o redirige a la pantalla de login)
- **And** no se expone ningún historial de datos.

---

#### **CA-FU-011 (Consultar Historial de Pedidos)**
- **Objetivo:** Verificar que el CUSTOMER autenticado puede consultar únicamente los Formatos Únicos que han transicionado al estado de Pedido/Confirmado (o sus órdenes de compra asociadas), asegurando la correcta filtración.
- **RF relacionado:** RF-FU-012
- **HU relacionada:** HU-FU-012
- **UC relacionado:** UC-CHK-005 / UC-FU-007

**Escenarios:**

**Escenario 1: CUSTOMER autenticado visualiza su historial de Pedidos/órdenes**
- **Given** un actor con rol `CUSTOMER` autenticado
- **And** el CUSTOMER posee 1 Formato Único en estado `BORRADOR` y 2 Formatos Únicos en estado `CONFIRMADO` (con órdenes de compra asociadas)
- **When** el CUSTOMER solicita ver su historial de Pedidos en la sección correspondiente del panel de control
- **Then** el sistema responde con HTTP `200 OK`
- **And** el listado muestra únicamente los 2 Formatos Únicos en estado `CONFIRMADO` con sus respectivos detalles de orden
- **And** el Formato Único en estado `BORRADOR` queda excluido del listado de Pedidos.

---

#### **CA-FU-020 (Cancelar cotización vigente)**
- **Objetivo:** Verificar que el CUSTOMER dueño puede cancelar una cotización vigente en cualquier momento (sin esperar los 15 días) y que el sistema bloquea la operación fuera de estado o de ownership.
- **RF relacionado:** RF-FU-020
- **HU relacionada:** HU-FU-013
- **UC relacionado:** UC-FU-016

**Escenarios:**

**Escenario 1: CUSTOMER dueño cancela una cotización vigente exitosamente**
- **Given** un actor con rol `CUSTOMER` autenticado
- **And** el CUSTOMER posee un Formato Único propio en estado `COTIZACIÓN`, generado hace 2 días (vigencia aún no vencida), con 2 ítems
- **When** el CUSTOMER solicita cancelar la cotización (`POST /formatos/{id}/cancelar-cotizacion`)
- **Then** el sistema responde con HTTP `200 OK`
- **And** el Formato Único queda en estado `BORRADOR`
- **And** los 2 ítems originales se preservan sin cambios
- **And** el campo `pdf_url` queda en `null`.

**Escenario 2: CUSTOMER intenta cancelar un Formato Único que no está en COTIZACIÓN**
- **Given** un actor con rol `CUSTOMER` autenticado
- **And** el CUSTOMER posee un Formato Único propio en estado `BORRADOR`
- **When** el CUSTOMER solicita cancelar la cotización de ese Formato Único
- **Then** el sistema rechaza la operación con HTTP `409 Conflict`
- **And** el estado del Formato Único no cambia.

**Escenario 3: CUSTOMER intenta cancelar la cotización de otro CUSTOMER (Restricción de Seguridad)**
- **Given** un actor con rol `CUSTOMER` autenticado (`customer_id = A`)
- **And** existe un Formato Único en estado `COTIZACIÓN` perteneciente a otro CUSTOMER (`customer_id = B`)
- **When** el CUSTOMER `A` solicita cancelar la cotización del Formato Único de `B`
- **Then** el sistema rechaza la operación con HTTP `403 Forbidden`
- **And** el estado del Formato Único de `B` no cambia.

---

#### **CA-AUT-009 (Renovar sesión mediante refresh token)**
- **Objetivo:** Verificar que un usuario con refresh_token válido puede renovar su sesión sin re-login, que el token se rota en cada uso, y que un token ya rotado, expirado o revocado (logout) es rechazado.
- **RF relacionado:** RF-AUT-009
- **HU relacionada:** HU-AUT-007
- **UC relacionado:** UC-AUT-007

**Escenarios:**

**Escenario 1: Usuario renueva su sesión exitosamente con un refresh_token válido**
- **Given** un actor autenticado con un refresh_token válido (cookie httpOnly, no vencido, no revocado)
- **When** el actor (o el interceptor HTTP automático del frontend) solicita `POST /auth/refresh`
- **Then** el sistema responde con HTTP `200 OK`
- **And** emite un nuevo access_token (cookie `session_token`)
- **And** emite un nuevo refresh_token (cookie `refresh_token`), distinto del anterior
- **And** una petición inmediata a `GET /auth/me` con el nuevo access_token responde `200 OK`.

**Escenario 2: Reutilización de un refresh_token ya rotado (mitigación de robo de token)**
- **Given** un actor que ya ejecutó `POST /auth/refresh` exitosamente una vez (su refresh_token original quedó rotado/revocado)
- **When** el actor intenta usar el refresh_token ORIGINAL (ya rotado) en un nuevo `POST /auth/refresh`
- **Then** el sistema rechaza la operación con HTTP `401 Unauthorized`
- **And** ambas cookies (`session_token`, `refresh_token`) se eliminan de la respuesta.

**Escenario 3: Refresh_token inválido, inexistente o ausente**
- **Given** un actor sin cookie `refresh_token`, o con un valor que no corresponde a ningún token persistido
- **When** el actor solicita `POST /auth/refresh`
- **Then** el sistema rechaza la operación con HTTP `401 Unauthorized`.

**Escenario 4: Logout revoca el refresh_token server-side**
- **Given** un actor autenticado con sesión y refresh_token activos
- **When** el actor solicita `POST /auth/logout`
- **And** posteriormente intenta reutilizar el mismo refresh_token (obtenido antes del logout) en `POST /auth/refresh`
- **Then** el sistema rechaza la operación con HTTP `401 Unauthorized` (el token quedó revocado en la base de datos, no solo eliminado del navegador).

---

#### **CA-FU-021 (Recompra desde historial — Widget de Recompra)**
- **Objetivo:** Verificar que el CUSTOMER puede reemplazar o combinar su borrador activo con los ítems de una cotización histórica, con el aislamiento de ownership correspondiente.
- **RF relacionado:** RF-FU-021
- **HU relacionada:** HU-FU-014
- **UC relacionado:** UC-FU-017

**Escenarios:**

**Escenario 1: CUSTOMER reemplaza su borrador con una cotización histórica**
- **Given** un actor `CUSTOMER` autenticado con un borrador activo con 1 ítem distinto
- **And** una cotización histórica propia con 2 ítems
- **When** el actor solicita `POST /formatos/{historial_id}/reemplazar-borrador`
- **Then** el sistema responde con HTTP `200 OK`
- **And** el borrador activo queda con exactamente los 2 ítems de la cotización histórica (el ítem previo se descarta).

**Escenario 2: CUSTOMER combina su borrador con una cotización histórica (producto repetido)**
- **Given** un borrador activo con el Producto A (cantidad 2)
- **And** una cotización histórica con el Producto A (cantidad 3) y el Producto B (cantidad 1)
- **When** el actor solicita `POST /formatos/{historial_id}/combinar-borrador`
- **Then** el sistema responde con HTTP `200 OK`
- **And** el borrador activo queda con el Producto A en cantidad 5 (2+3) y el Producto B en cantidad 1 (sin duplicar filas).

**Escenario 3: CUSTOMER intenta reemplazar con una cotización ajena (Restricción de Seguridad)**
- **Given** una cotización histórica perteneciente a otro CUSTOMER
- **When** el actor solicita `POST /formatos/{historial_id}/reemplazar-borrador` sobre ella
- **Then** el sistema rechaza la operación con HTTP `403 Forbidden`.

---

#### **CA-FU-022 (Confirmar Importación Excel aplica ítems reales al Formato Único)**
- **Objetivo:** Verificar que "Confirmar Importación Válida" (RF-FU-013/RF-FU-019) efectivamente agrega los ítems validados al Formato Único, en vez de ser un paso cosmético.
- **RF relacionado:** RF-FU-013, RF-FU-019
- **HU relacionada:** HU-FU-013 *(Carga masiva de productos por Excel)*
- **UC relacionado:** UC-EXCEL-001

*(Nota de implementación: antes de este fix, `handleConfirmImport` en el frontend mostraba un `alert("...Simulado")` sin llamar a ningún endpoint — el archivo se validaba pero nunca se cargaba al FU, pese a que `UC-EXCEL-001` ya documentaba el paso 5 "Sistema agrega ítems válidos al Formato Único" como parte del flujo. Se construyó `POST /formatos/{id}/excel/aplicar` para cerrar esa brecha.)*

**Escenarios:**

**Escenario 1: Confirmar importación agrega los ítems al Formato Único (Happy Path)**
- **Given** un archivo validado con SKUs reales y stock suficiente
- **When** el actor confirma la importación (`POST /formatos/{id}/excel/aplicar`)
- **Then** el sistema responde con HTTP `200 OK`
- **And** el Formato Único queda con los ítems solicitados en las cantidades exactas del archivo

**Escenario 2: Stock parcial se aplica hasta el disponible en vez de fallar (RN-FU-10)**
- **Given** un producto con `stock = 4` y una fila del archivo solicitando `cantidad = 10`
- **When** el actor confirma la importación
- **Then** el sistema agrega el ítem con `quantity = 4` (el máximo disponible), sin rechazar la fila ni la operación completa

**Escenario 3: SKU inexistente se ignora sin fallar la operación completa**
- **Given** una fila del archivo con un SKU que no existe en el catálogo
- **When** el actor confirma la importación
- **Then** el sistema omite esa fila y aplica normalmente el resto de ítems válidos, respondiendo HTTP `200 OK`

**Escenario 4: Intentar aplicar la importación sobre un Formato Único ajeno (RNF-SEC-001)**
- **Given** un Formato Único perteneciente al CUSTOMER A
- **When** el CUSTOMER B intenta confirmar una importación sobre él
- **Then** el sistema rechaza la operación con HTTP `403 Forbidden`.

**Escenario 4: Producto descontinuado en la cotización histórica**
- **Given** una cotización histórica con un ítem cuyo producto ya no está activo en el catálogo
- **When** el actor solicita combinar o reemplazar el borrador con esa cotización
- **Then** el sistema omite ese ítem sin fallar la operación completa
- **And** el resto de los ítems válidos se copian correctamente.

---

#### **CA-FU-023 (Persistencia durable del Formato Único — RNF-REL-006)**
- **Objetivo:** Verificar que ningún Formato Único (carrito, cotización, consulta, pedido) se pierde ante un reinicio del proceso backend, y que la resolución del "borrador activo" (Patrón de Clonación) se comporta igual contra la base de datos real que en memoria.
- **RF relacionado:** RF-FU-001 a RF-FU-021 (transversal)
- **RN relacionada:** RN-FU-09
- **RNF relacionado:** RNF-REL-006

*(Nota de implementación: reporte de soporte "ya no encuentro la cotización que generé ayer" — causado por `USE_MOCK_DB=True`, que hacía vivir el Formato Único solo en la RAM del proceso. Se activó la persistencia real y se corrigieron 3 defectos que la bloqueaban: `SupabaseFormatoRepository` abría su propia sesión ignorando el aislamiento de tests, `get_active_by_customer_id` ordenaba por `created_at` en vez de `updated_at`, y dos columnas declaradas en los modelos [`products.category_id`, `formato_unico.discount_percent`] nunca se migraron a la base de datos real.)*

**Escenarios:**

**Escenario 1: La cotización sobrevive a un reinicio del backend**
- **Given** un CUSTOMER genera una cotización con ítems
- **When** el proceso backend se reinicia por completo
- **Then** `GET /formatos/historial` sigue devolviendo la cotización con sus ítems, cantidades y precios intactos

**Escenario 2: El Patrón de Clonación resuelve el borrador activo correctamente contra la base real**
- **Given** un CUSTOMER genera una cotización (el FU original se clona y se resetea a BORRADOR vacío)
- **When** el actor solicita `GET /formatos/me`
- **Then** el sistema devuelve el BORRADOR vacío reseteado, no la COTIZACIÓN recién clonada (que tiene un `created_at` más reciente pero un `updated_at` más antiguo)

**Escenario 3: Las vistas de SELLER reflejan los Formatos Únicos reales**
- **Given** un CUSTOMER genera una cotización o solicita una consulta a través de la API pública
- **When** un SELLER consulta `GET /cotizaciones` o `GET /consultas`
- **Then** el Formato Único aparece en el listado (antes, estos endpoints consultaban un repositorio en memoria aislado, siempre vacío).

**Escenario 4: El webhook de Mercado Pago confirma el pedido contra la base de datos real (TEST-CHK-015)**
- **Given** un Formato Único en estado `PEDIDO` persistido en la base de datos real (no en memoria)
- **When** Mercado Pago envía un webhook `approved` con firma HMAC válida referenciando ese Formato Único
- **Then** el sistema lo encuentra, lo transiciona a `CONFIRMADO` y sincroniza la fila `Order` real a `PAID`
- **And** ya no responde `404 "Formato Único no encontrado"` como ocurría cuando el webhook seguía apuntando al repositorio en memoria pese a `USE_MOCK_DB=False`.

---

#### **CA-CAT-009 (Carrito flotante — Drawer y notificación no intrusiva)**
- **Objetivo:** Verificar que agregar un producto muestra una notificación no bloqueante y que el badge del Header refleja la cantidad de ítems en tiempo real.
- **RF relacionado:** RF-CAT-009
- **HU relacionada:** HU-CAT-009
- **UC relacionado:** UC-CAT-009

**Escenarios:**

**Escenario 1: Confirmación no intrusiva al agregar un producto**
- **Given** un actor (GUEST o CUSTOMER) viendo el catálogo
- **When** el actor agrega un producto con stock disponible
- **Then** el sistema muestra una notificación temporizada con las acciones "Seguir buscando" y "Ver proforma"
- **And** el badge numérico del ícono del carrito en el Header se actualiza para reflejar la nueva cantidad de ítems.

**Escenario 2: Apertura del Drawer desde el Header**
- **Given** un actor con al menos un ítem en su Formato Único
- **Then** el sistema despliega el Drawer lateral con el listado de ítems, el subtotal neto, y los botones "Comprar ahora" y "Gestionar Pedido"
- **And** no se produce una navegación de página completa.

---

#### **CA-ADM-009 (Asignar consultas preventa)**
- **Objetivo:** Verificar que el administrador puede asignar consultas preventa a un vendedor específico de forma manual.
- **RF relacionado:** RF-ADM-009
- **HU relacionada:** HU-ADM-009
- **UC relacionado:** UC-ADM-006

**Escenarios:**

**Escenario 1: Asignación exitosa de consulta**
- **Given** un administrador con sesión activa
- **And** una consulta en estado `CONSULTA` sin asignar
- **When** el administrador selecciona un vendedor de la lista y confirma la asignación
- **Then** la consulta es asignada al vendedor (`assigned_seller_id` actualizado)
- **And** el sistema retorna HTTP `200 OK`

---

#### **CA-ADM-010 (Aplicar descuento comercial B2B)**
- **Objetivo:** Verificar que el administrador puede aplicar un descuento de hasta el 30% a una cotización, recalculando el subtotal y regenerando el PDF inmutable.
- **RF relacionado:** RF-ADM-010
- **HU relacionada:** HU-ADM-010
- **UC relacionado:** UC-ADM-007

**Escenarios:**

**Escenario 1: Aplicación exitosa de descuento (descuento <= 30%)**
- **Given** un administrador con sesión activa
- **And** una cotización vigente en estado `COTIZACION`
- **When** el administrador ingresa un descuento del 15% y confirma
- **Then** el subtotal se actualiza aplicando el 15% de descuento
- **And** el campo `discount_percent` se guarda con valor `15.0`
- **And** el PDF de la cotización es regenerado con el nuevo subtotal congelado

**Escenario 2: Intento de aplicar descuento superior al límite (descuento > 30%)**
- **Given** un administrador con sesión activa
- **And** una cotización vigente en estado `COTIZACION`
- **When** el administrador intenta ingresar un descuento de 35%
- **Then** el sistema rechaza la operación con HTTP `400 Bad Request`
- **And** el descuento no es aplicado y el subtotal permanece inalterado (RN-ADM-04)

