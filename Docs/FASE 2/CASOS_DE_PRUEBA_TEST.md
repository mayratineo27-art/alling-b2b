Como QA Automation Architect, he derivado los Casos de Prueba (TEST) mapeando estrictamente uno a uno con los Criterios de Aceptación (CA) previamente definidos. No se ha inventado comportamiento, reglas de negocio, actores ni estados.

A continuación, se presentan los Casos de Prueba para los módulos críticos, seguidos de la sección obligatoria de "Vacíos documentales detectados".

---

### Casos de Prueba (TEST)

#### TEST-CAT-003-001 — Agregar producto al Formato Único (Flujo exitoso)

- **Objetivo:** Verificar que un GUEST/CUSTOMER puede agregar un producto con stock disponible al Formato Único.
- **RF relacionado:** RF-CAT-003
- **RNF relacionado:** RNF-REL-002
- **HU relacionada:** HU-CAT-003
- **UC relacionado:** UC-CAT-003
- **CA relacionado:** CA-CAT-003 (Escenario 1)
- **Tipo de prueba:** Integración / E2E
- **Precondiciones:**
    - Existe un `Product` activo con `stock = 10`.
    - El actor (GUEST o CUSTOMER) no tiene un FU activo o tiene uno en `BORRADOR`.
- **Datos de prueba:** `product_id = "prod_123"`, `quantity = 2`, `actor_role = "GUEST"`.
- **Pasos:**
    1. El actor envía una solicitud POST a `/api/formato-unico/items` con el payload `{product_id: "prod_123", quantity: 2}`.
    2. El sistema valida el stock y la propiedad del FU.
- **Resultado esperado:**
    - HTTP 201 Created.
    - Se crea/actualiza `FormatoUnicoItem` con `quantity = 2`.
    - El `FormatoUnico` permanece o pasa a estado `BORRADOR`.
    - Se emite el evento `EVT-FU-002`.
- **Resultado alternativo:** Ninguno.
- **Prioridad:** P1 (MVP)
- **Automatizable:** Sí (Pytest + HTTPX / Playwright)

#### TEST-CAT-003-002 — Agregar producto sin stock (Validación de restricción)

- **Objetivo:** Verificar que el sistema rechaza agregar un producto agotado.
- **RF relacionado:** RF-CAT-003
- **RNF relacionado:** RNF-REL-002
- **HU relacionada:** HU-CAT-003
- **UC relacionado:** UC-CAT-003
- **CA relacionado:** CA-CAT-003 (Escenario 2)
- **Tipo de prueba:** Unitaria / Integración
- **Precondiciones:** Existe un `Product` activo con `stock = 0`.
- **Datos de prueba:** `product_id = "prod_456"`, `quantity = 1`.
- **Pasos:**
    1. El actor envía POST a `/api/formato-unico/items` con `{product_id: "prod_456", quantity: 1}`.
- **Resultado esperado:**
    - HTTP 409 Conflict.
    - El cuerpo de la respuesta indica "Stock insuficiente".
    - No se crea ni modifica ningún `FormatoUnicoItem`.
- **Resultado alternativo:** Ninguno.
- **Prioridad:** P1 (MVP)
- **Automatizable:** Sí

#### TEST-FU-005-001 — Generar cotización exitosa (CUSTOMER)

- **Objetivo:** Verificar la transición de FU a COTIZACIÓN con fijación de precios y generación de PDF.
- **RF relacionado:** RF-FU-005
- **RNF relacionado:** RNF-PERF-002, RNF-INT-001
- **HU relacionada:** HU-FU-005
- **UC relacionado:** UC-FU-003
- **CA relacionado:** CA-FU-005 (Escenario 1)
- **Tipo de prueba:** Integración
- **Precondiciones:**
    - Actor autenticado como CUSTOMER.
    - FU en `BORRADOR` con 1 ítem, stock suficiente.
- **Datos de prueba:** `fu_id = "fu_789"`, `actor_role = "CUSTOMER"`.
- **Pasos:**
    1. El actor envía POST a `/api/formato-unico/{fu_id}/cotizar`.
- **Resultado esperado:**
    - HTTP 200 OK.
    - `FormatoUnico.state` cambia a `COTIZACIÓN`.
    - `FormatoUnicoItem.price_at_time` se fija con el valor actual.
    - `expires_at` se establece en `now + 15 días`.
    - Se genera y almacena el PDF.
    - Se emite `EVT-FU-004`.
- **Resultado alternativo:** Si la generación de PDF falla, la transacción se revierte (HTTP 500, estado permanece en `BORRADOR`).
- **Prioridad:** P1 (MVP)
- **Automatizable:** Sí (Mockeando el servicio de PDF para pruebas de integración)

#### TEST-FU-005-002 — GUEST intenta generar cotización (Validación de permiso)

- **Objetivo:** Verificar que un GUEST no puede transicionar a COTIZACIÓN.
- **RF relacionado:** RF-FU-005
- **RNF relacionado:** RNF-SEC-001
- **HU relacionada:** HU-FU-005
- **UC relacionado:** UC-FU-003
- **CA relacionado:** CA-FU-005 (Escenario 2)
- **Tipo de prueba:** Seguridad / Integración
- **Precondiciones:** Actor con rol `GUEST` (cookie anónima), FU en `BORRADOR`.
- **Datos de prueba:** `fu_id = "fu_101"`, `actor_role = "GUEST"`.
- **Pasos:**
    1. El actor envía POST a `/api/formato-unico/{fu_id}/cotizar`.
- **Resultado esperado:**
    - HTTP 403 Forbidden.
    - El estado del FU permanece en `BORRADOR`.
- **Resultado alternativo:** Ninguno.
- **Prioridad:** P1 (MVP)
- **Automatizable:** Sí

#### TEST-CHK-004-001 — Procesamiento exitoso de webhook de pago (Flujo feliz)

- **Objetivo:** Verificar que un webhook válido de MercadoPago actualiza los estados correctamente.
- **RF relacionado:** RF-CHK-004
- **RNF relacionado:** RNF-SEC-003, RNF-PERF-004
- **HU relacionada:** HU-CHK-004
- **UC relacionado:** UC-CHK-003
- **CA relacionado:** CA-CHK-004 (Escenario 1)
- **Tipo de prueba:** Integración
- **Precondiciones:**
    - `Order` en `PENDING_PAYMENT`.
    - Webhook entrante con `status=approved`, firma HMAC válida, `event_id` único.
- **Datos de prueba:** Payload JSON de MP con `id: "pay_123"`, `status: "approved"`, headers HMAC válidos.
- **Pasos:**
    1. Enviar POST a `/api/webhooks/mercadopago` con el payload y headers.
- **Resultado esperado:**
    - HTTP 200 OK.
    - `Order.status` cambia a `PAID`.
    - `FormatoUnico.state` cambia a `CONFIRMADO`.
    - Se registra `event_id` en `PaymentIdempotencyKey`.
    - Se encola email de confirmación.
- **Resultado alternativo:** Ninguno.
- **Prioridad:** P1 (MVP)
- **Automatizable:** Sí

#### TEST-CHK-004-002 — Idempotencia de webhook (Caso límite / Seguridad)

- **Objetivo:** Verificar que un webhook duplicado no genera efectos secundarios.
- **RF relacionado:** RF-CHK-004
- **RNF relacionado:** RNF-SEC-003
- **HU relacionada:** HU-CHK-004
- **UC relacionado:** UC-CHK-003
- **CA relacionado:** CA-CHK-004 (Escenario 2)
- **Tipo de prueba:** Seguridad / Integración
- **Precondiciones:** Webhook con `event_id = "evt_123"` ya procesado exitosamente.
- **Datos de prueba:** Mismo payload y headers del TEST-CHK-004-001.
- **Pasos:**
    1. Reenviar el mismo POST a `/api/webhooks/mercadopago` 5 veces en ráfaga.
- **Resultado esperado:**
    - Todas las respuestas son HTTP 200 OK.
    - El `Order` permanece en `PAID` (no se duplica).
    - No se generan emails adicionales.
- **Resultado alternativo:** Ninguno.
- **Prioridad:** P1 (MVP)
- **Automatizable:** Sí

#### TEST-CHK-004-003 — Webhook con firma HMAC inválida (Restricción de seguridad)

- **Objetivo:** Verificar que el sistema rechaza webhooks manipulados.
- **RF relacionado:** RF-CHK-004
- **RNF relacionado:** RNF-SEC-003
- **HU relacionada:** HU-CHK-004
- **UC relacionado:** UC-CHK-003
- **CA relacionado:** CA-CHK-004 (Escenario 3)
- **Tipo de prueba:** Seguridad
- **Precondiciones:** Payload de webhook modificado o firma incorrecta.
- **Datos de prueba:** Payload con `status=approved`, header `X-Signature` inválido.
- **Pasos:**
    1. Enviar POST a `/api/webhooks/mercadopago` con firma inválida.
- **Resultado esperado:**
    - HTTP 401 Unauthorized.
    - Se registra intento en `AuditLog`.
    - No se mutan estados de `Order` ni `FormatoUnico`.
- **Resultado alternativo:** Ninguno.
- **Prioridad:** P1 (MVP)
- **Automatizable:** Sí

#### TEST-AUT-003-001 — Login de SELLER sin MFA habilitado (Flujo feliz)

- **Objetivo:** Verificar que un SELLER sin MFA obtiene sesión completa directamente.
- **RF relacionado:** RF-AUT-002
- **RNF relacionado:** RNF-SEC-002
- **HU relacionada:** HU-AUT-002
- **UC relacionado:** UC-AUT-002
- **CA relacionado:** CA-AUT-003 (Escenario 1)
- **Tipo de prueba:** Integración / E2E
- **Precondiciones:** `User` con rol `SELLER`, `mfa_enabled = false`, credenciales válidas.
- **Datos de prueba:** `email = "seller@alling.pe"`, `password = "HashedPassword"`.
- **Pasos:**
    1. Enviar POST a `/api/auth/login/staff` con credenciales.
- **Resultado esperado:**
    - HTTP 200 OK.
    - Se emite JWT de sesión completo (claim `mfa_verified: true` o ausente).
    - No se redirige a `/auth/mfa/verify`.
- **Resultado alternativo:** Ninguno.
- **Prioridad:** P1 (MVP)
- **Automatizable:** Sí

#### TEST-AUT-003-002 — Login de ADMIN requiere MFA (Validación de restricción)

- **Objetivo:** Verificar que el ADMIN no obtiene sesión completa sin pasar por MFA.
- **RF relacionado:** RF-AUT-002, RF-AUT-003
- **RNF relacionado:** RNF-SEC-002
- **HU relacionada:** HU-AUT-002, HU-AUT-003
- **UC relacionado:** UC-AUT-002
- **CA relacionado:** CA-AUT-003 (Escenario 2)
- **Tipo de prueba:** Seguridad / Integración
- **Precondiciones:** `User` con rol `ADMIN`, `mfa_enabled = true`, credenciales válidas.
- **Datos de prueba:** `email = "admin@alling.pe"`, `password = "HashedPassword"`.
- **Pasos:**
    1. Enviar POST a `/api/auth/login/staff` con credenciales.
- **Resultado esperado:**
    - HTTP 200 OK (primer factor validado).
    - NO se emite JWT de sesión completo.
    - El cuerpo de la respuesta indica `requires_mfa: true`.
    - El frontend redirige a `/auth/mfa/verify`.
- **Resultado alternativo:** Ninguno.
- **Prioridad:** P1 (MVP)
- **Automatizable:** Sí

#### TEST-SEL-002-001 — Actualización válida de stock (Flujo feliz)

- **Objetivo:** Verificar que el SELLER puede actualizar el stock y se recalculan los badges.
- **RF relacionado:** RF-SEL-002
- **RNF relacionado:** RNF-USE-003
- **HU relacionada:** HU-SEL-002
- **UC relacionado:** UC-SEL-001
- **CA relacionado:** CA-SEL-002 (Escenario 1)
- **Tipo de prueba:** Integración
- **Precondiciones:** Actor SELLER autenticado, `Product` con `stock = 50`.
- **Datos de prueba:** `product_id = "prod_123"`, `new_stock = 45`.
- **Pasos:**
    1. Enviar PUT a `/api/seller/products/{product_id}/stock` con `{stock: 45}`.
- **Resultado esperado:**
    - HTTP 200 OK.
    - `Product.stock` actualizado a 45 en la base de datos.
    - Se emite `EVT-SEL-001`.
- **Resultado alternativo:** Ninguno.
- **Prioridad:** P1 (MVP)
- **Automatizable:** Sí

#### TEST-SEL-002-002 — Intento de stock negativo (Validación de error)

- **Objetivo:** Verificar que el sistema rechaza valores de stock negativos.
- **RF relacionado:** RF-SEL-002
- **RNF relacionado:** RNF-USE-003
- **HU relacionada:** HU-SEL-002
- **UC relacionado:** UC-SEL-001
- **CA relacionado:** CA-SEL-002 (Escenario 2)
- **Tipo de prueba:** Unitaria / Integración
- **Precondiciones:** Actor SELLER autenticado.
- **Datos de prueba:** `product_id = "prod_123"`, `new_stock = -5`.
- **Pasos:**
    1. Enviar PUT a `/api/seller/products/{product_id}/stock` con `{stock: -5}`.
- **Resultado esperado:**
    - HTTP 422 Unprocessable Entity.
    - Mensaje de error inline: "El stock no puede ser negativo".
    - El stock en BD permanece en 50.
- **Resultado alternativo:** Ninguno.
- **Prioridad:** P1 (MVP)
- **Automatizable:** Sí

---

### Vacíos documentales detectados

De acuerdo con la regla obligatoria de derivación, los siguientes escenarios no pueden ser convertidos en Casos de Prueba objetivos porque el material existente (Módulos, RF, RNF, HU, UC, CA) los identifica explícitamente como decisiones pendientes o vacíos no resueltos. No se han inventado valores para completarlos.

1. **Bloqueo temporal por intentos MFA fallidos:**
    - _Referencia:_ MOD-AUT-01 (Notas de diseño: "Vacío detectado — límite de intentos MFA no definido").
    - _Razón:_ No existe un número objetivo de intentos (ej. 3 o 5) ni un tiempo de bloqueo definido en el contexto. Un TEST que valide "bloqueo tras N intentos" requeriría inventar el valor de N.
2. **Alerta de SLA vencido en Consultas Pre-Venta:**
    - _Referencia:_ MOD-CON-01 (Notas de diseño: "no existe en el contexto original ni en las sesiones previas una definición de SLA de respuesta para SELLER").
    - _Razón:_ El componente `CMP-CON-004` (Badge de antigüedad) existe, pero no hay umbral objetivo (ej. 24 horas) para disparar una alerta de "urgente" o "vencido". Un TEST de validación de SLA no puede derivarse.
3. **Estructura y formato del archivo de Exportación de Datos:**
    - _Referencia:_ MOD-ADM-01 (Notas de diseño: "Formato de exportación no definido... ni su alcance").
    - _Razón:_ La operación `OPS-ADM-008` existe, pero no se define si el archivo es CSV, JSON o Excel, ni qué columnas específicas debe contener. Un TEST que valide el schema del archivo exportado no puede derivarse objetivamente.
4. **Canal de notificación al cliente tras respuesta de consulta:**
    - _Referencia:_ MOD-CON-01 (Notas de diseño: "no existe en el contexto... qué canal se usa para notificar al cliente que su consulta fue respondida").
    - _Razón:_ No se puede derivar un TEST que valide "el cliente recibe un email" o "el cliente recibe una notificación push" porque el canal es una decisión pendiente. Solo se puede probar que la nota queda visible al volver a `/formato`.
5. **Regeneración de códigos de respaldo MFA:**
    - _Referencia:_ MOD-AUT-01 (Notas de diseño: "Regeneración de códigos de respaldo no contemplada").
    - _Razón:_ No existe una operación funcional (OPS) documentada para regenerar los 10 códigos una vez consumidos. No se puede derivar un TEST para una funcionalidad inexistente en el inventario.

---
## 🆕 EXTENSIONES v1.2 (Casos de Prueba Clave)

### 🧪 Pruebas de Integración y UI

**TEST-SYS-001: Renderizado de Paleta Global**
- **Pasos:** Navegar a 3 pantallas distintas (Landing, Catálogo, Dashboard).
- **Esperado:** Los botones primarios mantienen el color #10B981 en todas las vistas.

**TEST-CAT-004: Carga de Landing Page**
- **Objetivo:** Verificar que GUEST ve los destacados y novedades en el HOME sin precios y que CUSTOMER es redirigido.
- **RF relacionado:** RF-CAT-004
- **HU relacionada:** HU-CAT-004
- **UC relacionado:** UC-CAT-004
- **Pasos (GUEST):**
  1. Acceder a `/` sin sesión activa.
  2. Verificar que se renderizan el Hero y los productos destacados.
  3. Validar que no se muestran los precios de los productos.
- **Pasos (CUSTOMER):**
  1. Iniciar sesión como CUSTOMER.
  2. Intentar navegar a `/`.
  3. Verificar redirección a `/dashboard`.

**TEST-CAT-005: Navegación de Categorías**
- **Objetivo:** Validar que el grid de categorías intermedio redirige correctamente al catálogo filtrado.
- **RF relacionado:** RF-CAT-005
- **HU relacionada:** HU-CAT-005
- **UC relacionado:** UC-CAT-005
- **Pasos:**
  1. Acceder a la página de categorías `/categorias` (SCR-CAT-004).
  2. Hacer clic en la tarjeta de la categoría "Redes".
  3. Verificar que la URL del navegador cambia a `/productos?categoria=Redes` y se muestran los productos filtrados.

**TEST-CAT-006: Cálculo Dinámico de Kit**
- **Pasos:** 
  1. ADMIN cambia el precio del Producto A (componente de Kit X).
  2. GUEST visualiza el Kit X en el catálogo.
- **Esperado:** El precio del Kit X refleja el nuevo precio del Producto A inmediatamente (suma de componentes, RN-KIT-01).

**TEST-CAT-007: Visualización y Modificación de Favoritos**
- **Objetivo:** Validar que solo el CUSTOMER puede guardar favoritos y que persisten.
- **RF relacionado:** RF-CAT-007
- **HU relacionada:** HU-CAT-007
- **UC relacionado:** UC-CAT-007
- **Pasos (CUSTOMER):**
  1. Iniciar sesión como CUSTOMER.
  2. Ir al catálogo `/productos` y hacer clic en el corazón de un producto.
  3. Verificar que se añade a favoritos (corazón activo y producto listado en `/favoritos`).
- **Pasos (GUEST):**
  1. Ir al catálogo `/productos` de forma anónima.
  2. Verificar que el icono de favoritos no se muestra en las tarjetas.

**TEST-CAT-008: Redirección de Consulta por Telegram**
- **Objetivo:** Validar que la redirección a Telegram contiene la estructura del mensaje correcta.
- **RF relacionado:** RF-CAT-008
- **HU relacionada:** HU-CAT-008
- **UC relacionado:** UC-CAT-008
- **Pasos:**
  1. Ir a `/productos` y hacer clic en el botón de Telegram.
  2. Verificar la URL de destino externa (`t.me`).
  3. Comprobar que el parámetro de consulta contiene el SKU e ID del producto correspondiente (RN-TG-01).

**TEST-FU-013: Carga Masiva con Errores**
- **Pasos:** 
  1. Subir Excel con 10 filas: 8 válidas, 1 SKU inexistente, 1 con stock insuficiente.
- **Esperado:** 
  - Fila SKU inexistente: Fondo rojo.
  - Fila stock insuficiente: Fondo naranja.
  - 8 filas válidas: Fondo verde y listas para importar.

**TEST-CHK-011: Reserva y Liberación de Stock**
- **Pasos:** 
  1. Iniciar pago (reserva stock).
  2. Esperar 31 minutos sin confirmar pago.
  3. Verificar stock del producto.
- **Esperado:** El stock vuelve a su valor original tras 30 minutos.

**TEST-CHK-015: Webhook de Mercado Pago confirma el pedido contra la base de datos real (RNF-REL-006)**
Implementado en `backend/tests/integration/test_webhooks.py::test_webhook_approved_confirma_fu_persistido_en_bd_real`. Reporte de soporte (ver RNF-REL-006): con la persistencia real activada, `checkout.py` crea el pedido en `SupabaseFormatoRepository` (Postgres) pero `get_payment_service()` en `webhooks.py` seguía construyendo el repositorio de Formato Único en memoria (`mock_fu_repo`) **sin revisar `settings.USE_MOCK_DB`** — cualquier webhook real de Mercado Pago buscaba el Formato Único en un diccionario vacío y fallaba con `404 "Formato Único no encontrado para el webhook"`, dejando el pedido en `PENDING_PAYMENT` para siempre pese a que el pago sí se aprobó en MP.
- **Pasos:**
  1. Forzar `USE_MOCK_DB=False`.
  2. Crear un Formato Único en estado `PEDIDO` directamente vía `SupabaseFormatoRepository` (BD real).
  3. Enviar un webhook `POST /webhooks/mercadopago/` con firma HMAC válida y `status: approved` referenciando ese `fu_id`.
- **Esperado:** Respuesta `200 OK`; al releer el Formato Único desde `SupabaseFormatoRepository`, su estado es `CONFIRMADO`.

**TEST-AUT-007: Fusión de Carritos**
- **Pasos:** 
  1. GUEST agrega Producto A (qty 2).
  2. GUEST inicia sesión (CUSTOMER ya tenía Producto A qty 1 y Producto B qty 3).
- **Esperado:** Carrito final: Producto A (qty 3), Producto B (qty 3).

**TEST-FU-010 : Visualizar "Mis cotizaciones"
**Pasos*:
1. CUSTOMER inicia sesión, se dirige a "Home".
2. CUSTOMER da click a "Mis cotizaciones"
**Esperado**: Vista con  listado filtrable de sus FU históricos en cualquier estado.

**TEST-FU-011 : Visualizar "Mis pedidos"
**Pasos*:
1. CUSTOMER inicia sesión, se dirige a "Home".
2. CUSTOMER da click a "Mis pedidos"
**Esperado**: Vista con filtros de fecha sobre los pedido realizados.

**TEST-AUT-009 : Renovar sesión mediante refresh token**
Implementado en `backend/tests/integration/test_refresh_token.py`.

**Caso 1 — `test_login_local_emite_cookie_refresh_token`**
**Esperado**: Al iniciar sesión (`POST /auth/login`), la respuesta incluye tanto la cookie `session_token` como `refresh_token`.

**Caso 2 — `test_refresh_emite_nuevo_access_token_valido`**
**Pasos:** Login → eliminar `session_token` (simula expiración a los 60 min) → `POST /auth/refresh`.
**Esperado**: HTTP `200`; nueva cookie `session_token`; `GET /auth/me` con el nuevo token responde `200`.

**Caso 3 — `test_refresh_sin_cookie_retorna_401`** / **`test_refresh_con_token_invalido_retorna_401`**
**Esperado**: HTTP `401` sin cookie `refresh_token`, o con un valor que no existe en la base de datos.

**Caso 4 — `test_refresh_rota_token_e_invalida_reuso_del_anterior`**
**Pasos:** Login → `POST /auth/refresh` (rota el token) → reintentar `POST /auth/refresh` con el token VIEJO.
**Esperado**: El primer refresh responde `200` con un `refresh_token` distinto al original; el reuso del token viejo responde `401`.

**Caso 5 — `test_logout_revoca_refresh_token_server_side`**
**Pasos:** Login → `POST /auth/logout` → reintentar `POST /auth/refresh` con el refresh_token obtenido antes del logout.
**Esperado**: HTTP `401` (revocado server-side, no solo eliminado del navegador).

**TEST-FU-020 : Cancelar cotización vigente**
Implementado en `backend/tests/integration/test_formato_api.py`.

**Caso 1 — `test_cancelar_cotizacion_vuelve_a_borrador_preservando_items`**
**Pasos:**
1. CUSTOMER crea un Formato Único y agrega 1 ítem (qty 2).
2. CUSTOMER genera cotización (`POST /formatos/{id}/aprobar`) → FU pasa a `COTIZACIÓN`.
3. CUSTOMER solicita `POST /formatos/{id}/cancelar-cotizacion`.
**Esperado**: HTTP `200`; `state == "BORRADOR"`; el ítem se preserva con la misma cantidad (qty 2).

**Caso 2 — `test_cancelar_cotizacion_fuera_de_estado_retorna_409`**
**Pasos:**
1. CUSTOMER crea un Formato Único (queda en `BORRADOR`, nunca se aprueba).
2. CUSTOMER solicita `POST /formatos/{id}/cancelar-cotizacion`.
**Esperado**: HTTP `409 Conflict` (no se puede cancelar algo que no es una cotización vigente).

**Caso 3 — `test_otro_customer_no_puede_cancelar_cotizacion_ajena`**
**Pasos:**
1. CUSTOMER `A` crea un Formato Único, agrega un ítem y genera cotización.
2. CUSTOMER `B` (intruso) solicita `POST /formatos/{id}/cancelar-cotizacion` sobre el FU de `A`.
**Esperado**: HTTP `403 Forbidden`; el estado del FU de `A` no cambia.

**TEST-FU-021 : Patrón de Clonación y Widget de Recompra (Sprint 6)**
Implementado en `backend/tests/integration/test_sprint6_clonacion.py`.

**Caso 1 — `test_generar_cotizacion_clona_en_registro_independiente`**
**Esperado**: Al generar cotización, la respuesta es un FU con `id` distinto al original; el FU original queda en `BORRADOR` con `items == []`.

**Caso 2 — `test_borrador_original_sigue_editable_tras_clonar_cotizacion`**
**Esperado**: Tras clonar, agregar otro producto al FU original responde `200` (ya no está bloqueado por el estado COTIZACIÓN).

**Caso 3 — `test_get_active_by_customer_id_resuelve_el_borrador_mas_reciente`**
**Esperado**: Con 2 FU en `BORRADOR` para el mismo cliente, se resuelve el de `updated_at` más reciente, no el primero encontrado.

**Caso 4 — `test_reemplazar_borrador_copia_items_del_historico`** / **`test_combinar_con_borrador_suma_cantidades_de_producto_repetido`**
**Esperado**: Reemplazar deja solo los ítems del histórico; combinar suma cantidades de productos repetidos sin duplicar filas.

**Caso 5 — `test_reemplazar_borrador_requiere_ownership`** / **`test_combinar_borrador_omite_producto_inactivo_sin_fallar`**
**Esperado**: `403` si el histórico no pertenece al actor; productos inactivos se omiten sin fallar la operación completa.

**Caso 6 — `test_tiene_historial_false_sin_cotizaciones`** / **`test_tiene_historial_true_tras_generar_cotizacion`**
**Esperado**: `GET /formatos/tiene-historial` responde `has_history: false` sin historial y `true` tras generar al menos una cotización.

**TEST-CAT-009: Carrito flotante (Drawer) y notificación no intrusiva**
- **Objetivo:** Verificar que agregar un producto no interrumpe la navegación y que el Drawer permite gestionar el carrito sin cambiar de página.
- **Pasos:**
  1. En `/productos`, agregar un producto a través del botón "Agregar a Formato Único".
  2. Verificar que aparece una notificación temporizada con "Seguir buscando" y "Ver proforma", y que el badge del ícono del carrito en el Header muestra la cantidad correcta.
  3. Hacer clic en el ícono del carrito del Header.
  4. Verificar que se despliega el Drawer lateral (sin navegar de página) con el ítem agregado, su cantidad editable, botón de eliminar, y el subtotal neto.
  5. Hacer clic en "Gestionar Pedido" y verificar la navegación a `/formatos`.
- **Esperado:** En ningún paso se pierde el estado de navegación del catálogo hasta que el actor elige explícitamente ir a `/checkout` o `/formatos`.

**TEST-FU-022: Vaciar Formato Único (RF-FU-003 / CA-FU-003)**
Implementado en `backend/tests/integration/test_formato_api.py`. Reporte de soporte: "presiono Vaciar Formato Único y no se puede vaciar el formato" — causado por un proceso de backend obsoleto sin la ruta `DELETE /{id}/items` cargada (no requería cambio de código, solo reinicio), aprovechado para cerrar un hueco de ownership pre-existente en ese mismo endpoint.

**Caso 1 — `test_vaciar_formato_unico_customer_elimina_todos_los_items`** / **`test_vaciar_formato_unico_guest_via_order_token`**
**Esperado**: `DELETE /formatos/{id}/items` responde `200` con `items: []` y `subtotal: 0`, tanto para CUSTOMER (JWT) como GUEST (cookie `order_token`).

**Caso 2 — `test_vaciar_formato_unico_ajeno_de_otro_customer_retorna_403`** / **`test_vaciar_formato_unico_sin_order_token_retorna_403`**
**Esperado**: `403 Forbidden` si el actor no es el dueño del Formato Único (RNF-SEC-001).

**Caso 3 — `test_vaciar_formato_unico_fuera_de_borrador_retorna_error`**
**Esperado**: `400` si el Formato Único no está en `BORRADOR` (p. ej. `COTIZACIÓN`).

**TEST-FU-023: Confirmar Importación Excel aplica ítems reales al Formato Único (RF-FU-013/019 / CA-FU-022)**
Implementado en `backend/tests/integration/test_excel_import.py`. Reporte: "añade más columnas válidas al Excel para que al importar se procese sin problemas" — se detectaron y corrigieron tres defectos encadenados: (1) `ExcelImportService` validaba contra un `InMemoryProductRepository` propio, nunca poblado en runtime — todo SKU real fallaba con "SKU no existe"; (2) incluso conectado al catálogo real, `list_all()` sin argumentos pagina a 10 productos por defecto; (3) "Confirmar Importación Válida" era un `alert()` cosmético que nunca llamaba a ningún endpoint.

**Caso 1 — `test_import_csv_no_se_limita_a_los_primeros_10_productos`**
**Esperado**: Con más de 10 productos activos, un SKU real fuera de la primera página de 10 se valida correctamente (no "SKU no existe").

**Caso 2 — `test_import_csv_cantidad_cero_se_omite_sin_error`** / **`test_import_csv_cantidad_negativa_es_error`**
**Esperado**: `cantidad = 0` (fila de la plantilla no solicitada) se omite en silencio, sin aparecer como error ni como éxito; `cantidad < 0` sí se reporta como error.

**Caso 3 — `test_get_template_incluye_skus_reales_del_catalogo`**
**Esperado**: La plantilla descargada (`GET /formatos/excel/template`) contiene SKUs reales del catálogo activo (no el `SKU-EJEMPLO` ficticio previo) y columnas de referencia (`producto`, `precio_referencial`, `stock`).

**Caso 4 — `test_aplicar_importacion_excel_agrega_items_reales_al_formato`**
**Esperado**: `POST /formatos/{id}/excel/aplicar` responde `200` y el Formato Único queda con los ítems solicitados en las cantidades exactas.

**Caso 5 — `test_aplicar_importacion_excel_capa_al_stock_disponible_en_vez_de_fallar`**
**Esperado**: Si la cantidad solicitada excede el stock disponible, se aplica hasta el stock disponible (RN-FU-10) en vez de rechazar la fila.

**Caso 6 — `test_aplicar_importacion_excel_ignora_sku_inexistente_sin_fallar`** / **`test_aplicar_importacion_excel_de_fu_ajeno_retorna_403`**
**Esperado**: SKU inexistente se omite sin fallar la operación completa; aplicar sobre un FU ajeno responde `403 Forbidden` (RNF-SEC-001).

**TEST-FU-024: Persistencia durable del Formato Único (RNF-REL-006 / CA-FU-023)**
Implementado en `backend/tests/unit/test_supabase_formato_repository.py`. Reporte de soporte: "ya no encuentro la cotización que generé ayer" — `USE_MOCK_DB=True` hacía vivir el Formato Único solo en la RAM del proceso backend; se perdía en cada reinicio. Se activó `SupabaseFormatoRepository` (persistencia real sobre Postgres) y se corrigieron 3 defectos que la bloqueaban.

**Caso 1 — `test_save_and_get_by_id_roundtrip`**
**Esperado**: Guardar y recuperar un Formato Único con ítems contra la base de datos real conserva estado, cantidades, precios y subtotal exactos.

**Caso 2 — `test_save_persiste_updated_at_explicito_no_lo_deja_null`**
**Esperado**: `save()` persiste `updated_at` explícitamente (antes confiaba en `onupdate=func.now()` de la columna, que no se dispara en el INSERT y dejaba el campo en `NULL`).

**Caso 3 — `test_get_active_by_customer_id_resuelve_el_mas_reciente_por_updated_at`**
**Esperado**: Con 2 Formatos Únicos en `BORRADOR` para el mismo cliente, se resuelve el de `updated_at` más reciente — mismo comportamiento que `InMemoryFormatoRepository` (RN-FU-09).

**Caso 4 — `test_get_active_by_customer_id_no_favorece_la_cotizacion_clonada_por_created_at`**
**Esperado**: Reproduce el Patrón de Clonación contra la base real: tras generar una cotización, `get_active_by_customer_id` devuelve el BORRADOR reseteado (registro preexistente, `updated_at` más reciente) y no la COTIZACIÓN recién clonada (registro nuevo, `created_at` más reciente) — antes, ordenar por `created_at` reintroducía el bug "ya no puedo comprar otra cosa tras cotizar".

**Caso 5 — `test_list_by_states_ordena_por_updated_at_descendente`** / **`test_get_by_order_token_resuelve_fu_guest`**
**Esperado**: Listar por estados (usado por las colas de SELLER en `/consultas` y `/cotizaciones`) ordena por `updated_at` descendente; resolver un FU GUEST por `order_token` funciona igual que en memoria.

**Verificación manual E2E (no automatizada por requerir reinicio real de proceso):** generar una cotización vía API, matar el proceso `uvicorn`, reiniciarlo, y confirmar que `GET /formatos/historial` sigue devolviendo la cotización intacta. Verificado exitosamente durante la implementación de RNF-REL-006.


