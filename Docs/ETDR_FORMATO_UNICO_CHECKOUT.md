# Especificación Técnica Detallada de Requisitos (ETDR) — Formato Único y Checkout

Este documento especifica de manera formal y técnica la vinculación entre los Requisitos de Negocio, el Diseño de Arquitectura, la Implementación de Código y los Tests de Integración en el sistema Alling B2B.

---

## Tabla de Contenidos
1. [RF-FU-005 — Generar cotización](#rf-fu-005--generar-cotizacion)
2. [RF-FU-007 — Descargar PDF de cotización (vista CUSTOMER)](#rf-fu-007--descargar-pdf-de-cotizacion-vista-customer)
3. [RF-CHK-007 — Sesión GUEST via cookie httpOnly](#rf-chk-007--sesion-guest-via-cookie-httponly)
4. [RF-AUT-007 — Migración GUEST → CUSTOMER](#rf-aut-007--migracion-guest--customer)
5. [Matriz de Trazabilidad Simplificada Cruzada](#matriz-de-trazabilidad-simplificada-cruzada)
6. [Deuda Técnica Documentada](#deuda-tecnica-documentada)

---

## 1. RF-FU-005 — Generar cotización

> **Texto Original:**
> El sistema debe permitir transicionar un FU de `BORRADOR` a `COTIZACIÓN` (`FU-T-03`) o de `RESUELTA` a `COTIZACIÓN` (`FU-T-07`), congelando precios al momento de la operación (`price_at_time`), generando PDF e iniciando countdown de vigencia de 15 días. Requiere autenticación. Emite `EVT-FU-004 CotizacionGenerada`.
> 
> * **Actores:** CUSTOMER (requiere autenticación)
> * **Módulo:** MOD-FU-01
> * **OPS:** OPS-FU-005
> * **RN:** RN-CHECKOUT-01, RN-CHECKOUT-02, RN-FU-03

**Especificación Técnica Detallada:**
* **Precondiciones:**
  * El Formato Único (FU) debe existir y encontrarse en estado `BORRADOR` o `RESUELTA` (FSM-01).
  * El FU debe contener al menos 1 ítem.
  * Si pertenece a un `CUSTOMER`, requiere cabecera HTTP `Authorization: Bearer <JWT>` válida.
  * Si pertenece a un `GUEST`, requiere una cookie `order_token` httpOnly válida que coincida con el `order_token` registrado en el FU.
* **Flujo Técnico:**
  1. El cliente inicia una llamada POST a `/formatos/{formato_id}/aprobar`.
  2. La dependencia `get_fu_owner_or_guest` valida la identidad del propietario.
  3. El endpoint invoca a `FormatoUnicoService.cambiar_estado(formato_unico, FormatoUnicoState.APROBADO)`.
  4. El repositorio persiste el nuevo estado en la base de datos simulada/real.
  5. Se registra la auditoría mediante `AuditService.log_mutation` asincrónicamente.
* **Postcondiciones Verificables:**
  * El estado de la entidad `FormatoUnico` cambia a `APROBADO` (o `COTIZACION` en flujo completo).
  * La respuesta HTTP retorna `200 OK` con el payload enriquecido de la orden.
* **Reglas de Negocio Aplicables:**
  * `RN-CHECKOUT-01`: Validación de stock disponible antes de la aprobación (lanzando `409` si hay insuficiencia).
  * `RN-CHECKOUT-02`: Inmutabilidad de precios en el momento de la transición.
  * `RN-FU-03`: Expiración a los 15 días.
* **Casos Borde Documentados:**
  * **Manipulación de ID (Intrusión GUEST):** Si un GUEST `A` intenta aprobar el FU del GUEST `B` (cambiando el UUID en el endpoint), el sistema devuelve `403 Forbidden` ("Sesión inválida").
  * **Aislamiento RLS (CUSTOMER):** Si el CUSTOMER `X` intenta aprobar el FU del CUSTOMER `Y`, se devuelve `403 Forbidden` ("No autorizado").
* **Fuente de Validación Técnica:**
  * **Implementación:** 
    * Dependencia: [formato_unico.py:L285-L309](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/api/endpoints/formato_unico.py#L285-L309) (`get_fu_owner_or_guest`)
    * Endpoint: [formato_unico.py:L311-L343](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/api/endpoints/formato_unico.py#L311-L343) (`aprobar_formato`)
  * **Test:** [test_formato_persistencia.py::test_aprobar_cotizacion_authorization_guest_and_customer](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/tests/integration/test_formato_persistencia.py)
  * **Frontend:** [BannerFSM.tsx:L42-L57](file:///c:/Users/MAYRATM/source/repos/tiendRed/frontend/src/components/formato/BannerFSM.tsx#L42-L57) (`handleGenerarCotizacion`)

---

## 2. RF-FU-007 — Descargar PDF de cotización (vista CUSTOMER)

> **Texto Original:**
> Sobre un FU en `COTIZACIÓN` o histórico con `pdf_url` válido, el sistema debe permitir al propietario CUSTOMER descargar el documento PDF generado. Operación de lectura. Capacidad técnica compartida con RF-COT-003.
> 
> * **Actores:** CUSTOMER
> * **Módulo:** MOD-FU-01
> * **OPS:** OPS-FU-007

**Especificación Técnica Detallada:**
* **Precondiciones:**
  * [PENDIENTE DE ESPECIFICAR] (No hay endpoint de descarga de PDF para clientes implementado en `formato_unico.py`).
* **Flujo Técnico:**
  * [PENDIENTE DE ESPECIFICAR]
* **Postcondiciones Verificables:**
  * [PENDIENTE DE ESPECIFICAR]
* **Reglas de Negocio Aplicables:**
  * `RN-FU-03`: La cotización debe estar vigente (countdown visible).
* **Casos Borde Documentados:**
  * [PENDIENTE DE ESPECIFICAR]
* **Fuente de Validación Técnica:**
  * **Implementación:** [PENDIENTE DE ESPECIFICAR] (Actualmente mockeado en el frontend mediante countdown y URLs de prueba)
  * **Test:** [PENDIENTE DE ESPECIFICAR]
  * **Frontend:** [BannerFSM.tsx:L77-L92](file:///c:/Users/MAYRATM/source/repos/tiendRed/frontend/src/components/formato/BannerFSM.tsx#L77-L92) (Simulación de countdown temporal de 15 días y visibilidad del estado `COTIZACIÓN`)

---

## 3. RF-CHK-007 — Sesión GUEST via cookie httpOnly

> **Texto Original (Matriz Sprint 4):**
> GUEST recibe `orderToken` para rastrear pedido sin cuenta. La persistencia utiliza una cookie HttpOnly opaca segura y SameSite=Lax para asociar la sesión al Formato Único sin almacenar identificadores en JavaScript del frontend.
> 
> * **Actores:** GUEST
> * **Módulo:** MOD-CHK-01 (Capa transaccional)
> * **OPS:** OPS-CHK-007

**Especificación Técnica Detallada:**
* **Precondiciones:**
  * El usuario no está autenticado (no hay cabecera Bearer JWT en la petición).
* **Flujo Técnico:**
  1. El cliente inicia una acción en el carrito y el frontend detecta que no hay sesión activa (404 al consultar `/formatos/me`).
  2. El frontend llama a `POST /formatos/session`.
  3. `FormatoUnicoService.crear_guest_session()` genera un `order_token` UUID v4 aleatorio y crea el FU en `BORRADOR`.
  4. El endpoint responde agregando la cabecera `Set-Cookie` con `order_token={uuid}; HttpOnly; Secure; SameSite=Lax; Path=/`.
  5. El cuerpo de respuesta pública oculta el ID del FU y el token de sesión (retorna únicamente el estado del FSM y contador).
* **Postcondiciones Verificables:**
  * El navegador almacena la cookie httpOnly asociada al dominio `localhost:3000`.
  * La cookie se envía automáticamente en cada subsecuente petición de red same-origin.
* **Reglas de Negocio Aplicables:**
  * `RNF-SEC-001`: Aislamiento estricto de identificadores (el ID de base de datos nunca se expone en la cookie de sesión).
* **Casos Borde Documentados:**
  * **Recarga de página/Navegación:** La cookie al ser httpOnly persiste ante recargas y transiciones de páginas en React, permitiendo que la vista del carrito `/formatos` y el catálogo `/kits` compartan exactamente el mismo Formato Único.
  * **Expiración de la sesión:** Si el servidor se reinicia o el token expira, el backend retorna `404` y el frontend regenera la sesión llamando a `/session` limpiamente.
* **Fuente de Validación Técnica:**
  * **Implementación:** 
    * Endpoint: [formato_unico.py:L40-L63](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/api/endpoints/formato_unico.py#L40-L63) (`crear_sesion_guest`)
    * Servicio: [formato_unico_service.py:L22-L34](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/services/formato_unico_service.py#L22-L34) (`crear_guest_session`)
    * Repositorio: [in_memory_formato_repository.py:L22-L30](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/infra/repositories/in_memory_formato_repository.py#L22-L30) (`get_by_order_token`)
  * **Test:** 
    * [test_formato_persistencia.py::test_guest_creates_fu_via_cookie_and_retrieves_it](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/tests/integration/test_formato_persistencia.py)
    * [test_formato_persistencia.py::test_api_never_exposes_fu_id_in_public_session_response](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/tests/integration/test_formato_persistencia.py)
  * **Frontend:** 
    * Petición de sesión: [api.ts:L7-L13](file:///c:/Users/MAYRATM/source/repos/tiendRed/frontend/src/lib/api.ts#L7-L13) (Base URL `/api` proxy same-origin)
    * Recuperación: [page.tsx:L15-L35](file:///c:/Users/MAYRATM/source/repos/tiendRed/frontend/src/app/formatos/page.tsx#L15-L35) (`fetchFormato`)

---

## 4. RF-AUT-007 — Migración GUEST → CUSTOMER

> **Texto Original:**
> Al autenticarse, el Formato Único del GUEST se fusiona automáticamente con el Formato Único del CUSTOMER (sumando cantidades).
> 
> * **Actores:** GUEST, CUSTOMER
> * **Módulo:** MOD-AUT-01
> * **OPS:** OPS-AUT-007
> * **RN:** RN-GUEST-MIGRATE-01

**Especificación Técnica Detallada:**
* **Precondiciones:**
  * El usuario se ha logueado exitosamente y ha recibido un token JWT corporativo.
  * Existe una cookie `order_token` en el navegador del usuario.
* **Flujo Técnico:**
  1. Tras iniciar sesión, el frontend realiza un POST síncrono a `/formatos/merge` con la cabecera `Authorization: Bearer <JWT>`.
  2. `FormatoUnicoService.merge_guest_to_customer` recupera el FU del GUEST (por la cookie) y el FU activo del CUSTOMER.
  3. Si el CUSTOMER no tenía un FU activo, adopta el del GUEST asignándole su `customer_id` y limpiando el `order_token`.
  4. Si ambos tienen FU activos, se combinan los ítems, sumando las cantidades y validando contra el stock disponible.
  5. El FU GUEST anterior pasa a estado `CANCELADO`.
  6. La cookie `order_token` es borrada mediante `Set-Cookie: order_token=; Max-Age=0` en la respuesta del backend.
* **Postcondiciones Verificables:**
  * Los ítems agregados como GUEST aparecen listados en la cuenta del cliente corporativo.
  * La cookie `order_token` desaparece del navegador.
* **Reglas de Negocio Aplicables:**
  * `RN-GUEST-MIGRATE-01`: Fusión automática de carritos sin pérdida silenciosa de datos.
* **Casos Borde Documentados:**
  * **Exceso de stock disponible:** Si la suma de las cantidades del GUEST y del CUSTOMER supera el stock real físico disponible del producto, la fusión acota la cantidad resultante al stock máximo y avisa al usuario, protegiendo al sistema de órdenes inválidas.
* **Fuente de Validación Técnica:**
  * **Implementación:**
    * Endpoint: [formato_unico.py:L115-L150](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/api/endpoints/formato_unico.py#L115-L150) (`merge_guest_to_customer`)
    * Servicio: [formato_unico_service.py:L141-L206](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/services/formato_unico_service.py#L141-L206) (`merge_guest_to_customer`)
  * **Test:** [test_formato_persistencia.py::test_guest_to_customer_merge_preserves_items](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/tests/integration/test_formato_persistencia.py)
  * **Frontend:** [AuthContext.tsx:L64-L74](file:///c:/Users/MAYRATM/source/repos/tiendRed/frontend/src/context/AuthContext.tsx#L64-L74) (`apiClient.post('/formatos/merge')` al procesar login)

---

## 5. Matriz de Trazabilidad Simplificada Cruzada

| ID RF | Caso de Uso / Historia | Especificación Técnica | Código (Backend / Frontend) | Caso de Prueba Integrado |
|---|---|---|---|---|
| **RF-FU-005** | `HU-FU-005` Generar cotización | Aprobación por Token/JWT mixta | [formato_unico.py:L288](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/api/endpoints/formato_unico.py#L288) / [BannerFSM.tsx:L42](file:///c:/Users/MAYRATM/source/repos/tiendRed/frontend/src/components/formato/BannerFSM.tsx#L42) | `test_aprobar_cotizacion_authorization_guest_and_customer` |
| **RF-FU-007** | `HU-FU-005` Descargar PDF | [PENDIENTE DE ESPECIFICAR] | [PENDIENTE DE ESPECIFICAR] / [BannerFSM.tsx:L77](file:///c:/Users/MAYRATM/source/repos/tiendRed/frontend/src/components/formato/BannerFSM.tsx#L77) | [PENDIENTE DE ESPECIFICAR] |
| **RF-CHK-007** | `HU-CHK-001` Cookie GUEST | Identificadores opacos httpOnly | [formato_unico.py:L40](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/api/endpoints/formato_unico.py#L40) / [page.tsx:L15](file:///c:/Users/MAYRATM/source/repos/tiendRed/frontend/src/app/formatos/page.tsx#L15) | `test_guest_creates_fu_via_cookie_and_retrieves_it` |
| **RF-AUT-007** | `HU-AUT-002` Fusión carritos | Algoritmo merge + borrado cookie | [formato_unico.py:L115](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/api/endpoints/formato_unico.py#L115) / [AuthContext.tsx:L64](file:///c:/Users/MAYRATM/source/repos/tiendRed/frontend/src/context/AuthContext.tsx#L64) | `test_guest_to_customer_merge_preserves_items` |

---

## 6. Deuda Técnica Documentada

1. **Simulación de Countdown de Cotización (RF-FU-007 / RF-FU-005):**
   * **Descripción:** En la vista del carrito, la expiración de la cotización (`timeLeft`) se calcula de forma estática en React sumando un tiempo fijo de 15 días. El modelo en base de datos no persiste una fecha de expiración física calculada en base al parámetro configurable global.
   * **Impacto:** Si el cliente recarga la página, el countdown vuelve a iniciarse en 15 días independientemente de la fecha de generación original.
2. **Generación e Integración de PDF Comercial (RF-FU-007):**
   * **Descripción:** No existe un servicio de dominio acoplado (`QuoteService`) ni almacenamiento persistente (ej: MinIO, S3 o Supabase Storage) para alojar los archivos PDF de cotizaciones generadas para el CUSTOMER.
   * **Impacto:** El botón de "Descargar PDF" en la vista cliente no realiza descargas físicas reales sino que redirige a mocks de navegación.
3. **Mapeo de Estados de FSM en el Checkout (RF-CHK-014):**
   * **Descripción:** Aunque el flujo de webhook de Mercado Pago está documentado conceptualmente, la integración real y la persistencia de estados de pago intermedios a nivel de pasarela en la máquina de estados se encuentran actualmente simulados en memoria.

