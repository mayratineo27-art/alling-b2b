### UC-CAT-001: Buscar y filtrar productos

**Objetivo:** Permitir que cualquier visitante encuentre productos relevantes rápidamente mediante criterios de búsqueda y filtrado. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER, SELLER, ADMIN **RF relacionados:** RF-CAT-001 **HU relacionadas:** HU-CAT-001 **RNF relacionados:** RNF-PERF-001 **Precondiciones:** El sistema cuenta con productos activos en la base de datos. **Disparador:** El actor accede a `/productos` o interactúa con el buscador/filtros (`CMP-CAT-001` a `CMP-CAT-005`). **Flujo principal:**

1. El actor ingresa al listado de productos.
2. El sistema muestra los productos activos con paginación (`CMP-CAT-009`).
3. El actor ingresa texto en el buscador o selecciona filtros (categoría, precio, marca).
4. El sistema aplica los filtros (`OPS-CAT-001`) y actualiza la lista de resultados.
5. El actor visualiza los productos filtrados. **Flujos alternativos:**
6. El actor utiliza el scroll infinito o paginación para ver más resultados (`ACT-CAT-009`). **Flujos de excepción:**
7. No existen productos que coincidan con los filtros: El sistema muestra el estado vacío (`CMP-CAT-012`) y ofrece limpiar filtros (`BTN-CAT-002`). **Postcondiciones:** Listado de productos actualizado según los criterios del actor. **Reglas de negocio relacionadas:** Ninguna específica de filtrado. **Módulos involucrados:** MOD-CAT-01

---

### UC-CAT-002: Ver detalle de producto

**Objetivo:** Mostrar la información completa de un producto para apoyar la decisión de compra. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER, SELLER, ADMIN **RF relacionados:** RF-CAT-002 **HU relacionadas:** HU-CAT-002 **RNF relacionados:** RNF-PERF-001 **Precondiciones:** El producto existe y está activo (`is_active = true`). **Disparador:** El actor hace clic en una tarjeta de producto (`BTN-CAT-003` / `ACT-CAT-001`). **Flujo principal:**

1. El actor selecciona un producto desde el listado.
2. El sistema navega a `/productos/[slug]` (`NAV-CAT-003`).
3. El sistema carga la galería, especificaciones, tabs de información y selector de cantidad (`SCR-CAT-002`).
4. El actor visualiza el detalle. **Flujos de excepción:**
5. El producto fue desactivado entre el listado y el clic: El sistema responde con 404. **Postcondiciones:** Vista de detalle cargada. Evento `EVT-CAT-001` (opcional) generado. **Reglas de negocio relacionadas:** Ninguna. **Módulos involucrados:** MOD-CAT-01

---

### UC-CAT-003: Agregar producto al Formato Único

**Objetivo:** Capturar la intención de compra agregando un producto al contenedor central. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER **RF relacionados:** RF-CAT-003 **HU relacionadas:** HU-CAT-003 **RNF relacionados:** RNF-REL-002 **Precondiciones:** `Product.stock ≥ 1` y `Product.is_active = true`. **Disparador:** El actor hace clic en "Agregar" (`BTN-CAT-001`) o "Agregar al Formato Único" (`BTN-CAT-004`). **Flujo principal:**

1. El actor solicita agregar el producto.
2. El sistema valida stock y crea/actualiza `FormatoUnicoItem` (`OPS-CAT-003`).
3. Si no existía FU, el sistema crea uno nuevo (`FU-T-01`).
4. El sistema recalcula totales (`AUTO-FU-001`) y muestra toast de éxito. **Flujos de excepción:**
5. Stock agotado en el instante del clic: El sistema retorna 409 y no agrega el ítem. **Postcondiciones:** Producto agregado al FU del actor. Eventos `EVT-FU-001` (condicional) y `EVT-FU-002` generados. **Reglas de negocio relacionadas:** RN-GUEST-01 (GUEST solo puede tener 1 FU activo). **Módulos involucrados:** MOD-CAT-01, MOD-FU-01

---

### UC-CAT-004: Explorar Landing Page (Home GUEST)

**Objetivo:** Permitir que los visitantes no autenticados conozcan la oferta de productos de la tienda sin revelar precios para incentivar la autenticación. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER **RF relacionados:** RF-CAT-004 **HU relacionadas:** HU-CAT-004 **RNF relacionados:** RNF-PERF-001, RNF-USE-001 **Precondiciones:** El sistema cuenta con productos e imágenes cargados y marcados como destacados. **Disparador:** El actor accede a la URL raíz `/`. **Flujo principal:**

1. El actor ingresa a la raíz del sitio web.
2. El sistema consume el endpoint `/productos/landing` para obtener los productos destacados y novedades.
3. El sistema renderiza la Hero Image (CMP-CAT-023), los productos destacados sin precio (CMP-CAT-024) y el grid de categorías (CMP-CAT-025).
4. El actor explora las diferentes secciones de la Landing. **Flujos alternativos:**
5. El actor es un CUSTOMER autenticado: El sistema detecta el rol y redirige automáticamente al Dashboard (`/dashboard`). **Postcondiciones:** Landing page visualizada exitosamente. **Reglas de negocio relacionadas:** Ninguna. **Módulos involucrados:** MOD-CAT-01

---

### UC-CAT-005: Navegar por grid de categorías intermedio

**Objetivo:** Ofrecer una vista de exploración limpia con los contadores de productos por categoría para agilizar búsquedas. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER **RF relacionados:** RF-CAT-005 **HU relacionadas:** HU-CAT-005 **RNF relacionados:** RNF-PERF-001 **Precondiciones:** Existen categorías con productos activos asociados en el sistema. **Disparador:** El actor hace clic en el enlace "Categorías" del menú. **Flujo principal:**

1. El actor ingresa a la sección de categorías (`SCR-CAT-004`).
2. El sistema carga el grid con las tarjetas de categoría mostrando nombre, miniatura y contador dinámico (`CMP-CAT-027`).
3. El actor hace clic en una tarjeta de categoría.
4. El sistema redirige al catálogo (`SCR-CAT-001`) con el filtro de categoría aplicado. **Postcondiciones:** Navegación al catálogo filtrado completada. **Reglas de negocio relacionadas:** Ninguna. **Módulos involucrados:** MOD-CAT-01

---

### UC-CAT-006: Explorar y adquirir Kits Pre-armados

**Objetivo:** Permitir a los usuarios adquirir agrupaciones de productos afines a su necesidad en un único paso. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER **RF relacionados:** RF-CAT-006 **HU relacionadas:** HU-CAT-006 **RNF relacionados:** RNF-REL-002 **Precondiciones:** Existen Kits configurados con al menos 2 componentes activos en base de datos. **Disparador:** El actor accede a la sección `/kits`. **Flujo principal:**

1. El actor navega a la sección de kits.
2. El sistema muestra la lista de kits calculando su precio dinámico (suma de componentes, RN-KIT-01) y su stock efectivo (mínimo de stocks, RN-KIT-03).
3. El actor hace clic en "Agregar al Formato Único" (`BTN-CAT-009`).
4. El sistema valida el stock individual de todos los componentes.
5. El sistema inserta cada producto componente al Formato Único del usuario y recalcula los totales. **Flujos de excepción:**
6. Stock insuficiente en alguno de los componentes del kit: El sistema rechaza la operación, no agrega ningún ítem y muestra un mensaje de error detallando el componente faltante. **Postcondiciones:** Componentes del Kit agregados al FU. **Reglas de negocio relacionadas:** RN-KIT-01, RN-KIT-02, RN-KIT-03. **Módulos involucrados:** MOD-CAT-01, MOD-FU-01

---

### UC-CAT-007: Gestionar productos Favoritos

**Objetivo:** Permitir a los clientes autenticados guardar productos de su interés en una sección personalizada de acceso rápido. **Actor principal:** CUSTOMER **Actores secundarios:** Ninguno **RF relacionados:** RF-CAT-007 **HU relacionadas:** HU-CAT-007 **RNF relacionados:** RN-FAV-01 (Solo CUSTOMER) **Precondiciones:** El usuario ha iniciado sesión como CUSTOMER. **Disparador:** El actor hace clic en el corazón de favoritos (`BTN-CAT-006`). **Flujo principal:**

1. El CUSTOMER hace clic en el icono de favoritos de un producto.
2. El sistema envía petición `POST /favoritos/{producto_id}`.
3. El sistema asocia el producto al id del CUSTOMER e ilumina el corazón en la UI. **Flujos alternativos:**
4. Quitar de favoritos: El actor hace clic en un corazón ya activo; el sistema envía la petición para desvincular el producto y actualiza la vista. **Postcondiciones:** Lista de favoritos del CUSTOMER modificada. **Reglas de negocio relacionadas:** RN-FAV-01. **Módulos involucrados:** MOD-CAT-01, favoritos

---

### UC-CAT-008: Solicitar consulta rápida por Telegram

**Objetivo:** Facilitar una vía rápida de comunicación con soporte de ventas pasando los detalles del producto de manera directa. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER **RF relacionados:** RF-CAT-008 **HU relacionadas:** HU-CAT-008 **RNF relacionados:** RN-TG-01 **Precondiciones:** El dispositivo cuenta con la aplicación de Telegram. **Disparador:** El actor hace clic en el botón de consulta por Telegram (`BTN-CAT-007`). **Flujo principal:**

1. El actor hace clic en el icono de Telegram de la tarjeta o detalle de producto.
2. El sistema recupera el SKU/ID, nombre y cantidad del producto.
3. El sistema abre una pestaña externa redirigiendo a `https://t.me/` con el texto formateado: "Hola, tengo una consulta sobre [Nombre] (SKU: [ID])". **Postcondiciones:** Redirección externa realizada. **Reglas de negocio relacionadas:** RN-TG-01. **Módulos involucrados:** MOD-CAT-01

---

### UC-CAT-009: Agregar producto con notificación no intrusiva (Toast + Drawer)

**Objetivo:** Confirmar la adición de un producto al Formato Único sin interrumpir la navegación del actor en el catálogo, ofreciendo acceso inmediato al resumen del carrito si lo desea. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER **RF relacionados:** RF-CAT-009 **HU relacionadas:** HU-CAT-009 **RNF relacionados:** — **Precondiciones:** El actor está viendo el catálogo o el detalle de un producto con stock disponible. **Disparador:** El actor hace clic en "Agregar a mi Formato" (`BTN-CAT-006`, ya existente) sobre un producto. **Flujo principal:**

1. El sistema agrega el producto al FU (`OPS-CAT-003`, sin cambios) y muestra una tarjeta flotante temporizada (Toast) confirmando la adición.
2. El actor puede hacer clic en "Seguir buscando" (cierra la alerta, continúa en el catálogo) o "Ver proforma" (abre el Drawer lateral).
3. En cualquier momento, el actor puede abrir el mismo Drawer haciendo clic en el ícono del carrito del Header, cuyo badge numérico refleja la cantidad de ítems.
4. Desde el Drawer, el actor puede ajustar cantidades, eliminar ítems, y elegir "Comprar ahora" (checkout directo) o "Gestionar Pedido" (navega a `/formatos`).

**Flujos de excepción:** Ninguno adicional a `OPS-CAT-003`. **Postcondiciones:** Producto agregado; Drawer disponible globalmente hasta que el actor lo cierre o navegue. **Reglas de negocio relacionadas:** Ninguna nueva. **Módulos involucrados:** MOD-CAT-01, MOD-FU-01

---

### UC-FU-001: Gestionar ítems del Formato Único

**Objetivo:** Permitir al usuario editar, eliminar o vaciar los ítems de su Formato Único antes de transicionar. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER **RF relacionados:** RF-FU-001, RF-FU-002, RF-FU-003 **HU relacionadas:** HU-FU-001, HU-FU-002, HU-FU-003 **RNF relacionados:** RNF-REL-002 **Precondiciones:** El FU existe y está en estado `BORRADOR`. **Disparador:** El actor interactúa con controles de cantidad (`ACT-FU-001`), elimina ítems (`BTN-FU-001`) o vacía el FU (`BTN-FU-002`). **Flujo principal:**

1. El actor modifica la cantidad o elimina un ítem.
2. El sistema valida que la cantidad sea ≥ 1 y ≤ stock disponible.
3. El sistema actualiza el ítem y recalcula totales (`AUTO-FU-001`). **Flujos alternativos:**
4. El actor selecciona "Vaciar Formato Único": El sistema solicita confirmación y elimina todos los ítems, manteniendo el FU en `BORRADOR`. **Flujos de excepción:**
5. La cantidad excede el stock: El sistema muestra mensaje de error inline (`CMP-FU-010`) y rechaza el cambio. **Postcondiciones:** Ítems actualizados y totales recalculados. Evento `EVT-FU-002` generado. **Reglas de negocio relacionadas:** Ninguna nueva. **Módulos involucrados:** MOD-FU-01

---

### UC-FU-002: Solicitar consulta pre-venta

**Objetivo:** Iniciar un flujo de asesoría humana sobre los productos seleccionados. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER, SELLER (receptor) **RF relacionados:** RF-FU-004 **HU relacionadas:** HU-FU-004 **RNF relacionados:** RNF-USE-003 **Precondiciones:** FU en estado `BORRADOR` con ≥1 ítem. Email válido disponible (si es GUEST). **Disparador:** El actor hace clic en "Solicitar Consulta" (`BTN-FU-003`). **Flujo principal:**

1. El actor solicita la consulta.
2. El sistema valida el estado y los datos de contacto.
3. El sistema transiciona el FU a `CONSULTA` (`FU-T-02`).
4. El sistema muestra confirmación y la consulta aparece en la cola de SELLER. **Flujos de excepción:**
5. Email inválido (GUEST): El sistema retorna 422. **Postcondiciones:** FU en estado `CONSULTA`. Evento `EVT-FU-003` generado. **Reglas de negocio relacionadas:** RN-CONSULTA-ASSIGN-01 (Asignación manual posterior). **Módulos involucrados:** MOD-FU-01, MOD-CON-01

---

### UC-FU-003: Generar y descargar cotización

**Objetivo:** Formalizar una propuesta comercial con precios fijos y vigencia temporal. **Actor principal:** CUSTOMER **Actores secundarios:** SELLER (descarga vista SELLER) **RF relacionados:** RF-FU-005, RF-FU-007, RF-COT-003 **HU relacionadas:** HU-FU-005, HU-FU-007, HU-COT-003 **RNF relacionados:** RNF-PERF-002, RNF-INT-001, RNF-INT-002 **Precondiciones:** Actor autenticado como CUSTOMER. FU en `BORRADOR` o `RESUELTA` con ≥1 ítem y stock suficiente. **Disparador:** El actor hace clic en "Generar Cotización" (`BTN-FU-004`) o "Descargar PDF" (`BTN-FU-007` / `BTN-COT-001`). **Flujo principal:**

1. El actor solicita generar la cotización.
2. El sistema valida stock y fija `price_at_time` para cada ítem.
3. El sistema transiciona el FU a `COTIZACIÓN` (`FU-T-03`), fija `expires_at` (15 días) y genera el PDF.
4. El actor puede descargar el PDF inmediatamente. **Flujos de excepción:**
5. Generación de PDF falla: El sistema revierte la transición (atomicidad).
6. Stock insuficiente: El sistema retorna 409 con lista de productos afectados. **Postcondiciones:** FU en `COTIZACIÓN`, PDF generado. Evento `EVT-FU-004` generado. **Reglas de negocio relacionadas:** RN-CHECKOUT-01, RN-CHECKOUT-02, RN-FU-03. **Módulos involucrados:** MOD-FU-01, MOD-COT-01

---

### UC-FU-004: Iniciar checkout (Convertir a Pedido)

**Objetivo:** Convertir la intención de compra en una transacción formal de pago. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER **RF relacionados:** RF-FU-006 **HU relacionadas:** HU-FU-006 **RNF relacionados:** RNF-INT-001, RNF-INT-002 **Precondiciones:** FU en `BORRADOR` (con stock) o `COTIZACIÓN` (vigente). **Disparador:** El actor hace clic en "Ir a Checkout" (`BTN-FU-005`). **Flujo principal:**

1. El actor solicita ir a checkout.
2. El sistema valida stock y vigencia (si aplica).
3. El sistema crea un `Order` en `PENDING_PAYMENT` y transiciona el FU a `PEDIDO` (`FU-T-04` o `FU-T-09`).
4. El sistema navega a `SCR-CHK-001`. **Flujos de excepción:**
5. Cotización expirada en el instante del clic: El sistema redirige al flujo de expiración en lugar de crear Order inválido (410 Gone). **Postcondiciones:** Order creado, FU en `PEDIDO`. Evento `EVT-FU-005` generado. **Reglas de negocio relacionadas:** RN-CHECKOUT-01, RN-CHECKOUT-02, RN-CHK-010. **Módulos involucrados:** MOD-FU-01, MOD-CHK-01

---

### UC-FU-005: Regenerar cotización expirada

**Objetivo:** Reactivar una cotización vencida para permitir nueva compra con precios actualizados. **Actor principal:** CUSTOMER **Actores secundarios:** Ninguno **RF relacionados:** RF-FU-008 **HU relacionadas:** HU-FU-008 **RNF relacionados:** RNF-REL-002 **Precondiciones:** FU en estado `EXPIRADA`. Actor es el owner. **Disparador:** El actor hace clic en "Regenerar Cotización" (`BTN-FU-008`). **Flujo principal:**

1. El actor solicita regenerar.
2. El sistema transiciona el FU a `BORRADOR` (`FU-T-11`).
3. El sistema limpia `expires_at` y `pdf_url`, y actualiza precios a valores vigentes.
4. El FU queda editable nuevamente. **Flujos de excepción:** Ninguno esperado. **Postcondiciones:** FU en `BORRADOR` con precios actualizados. Evento `EVT-FU-007` generado. **Reglas de negocio relacionadas:** Ninguna nueva. **Módulos involucrados:** MOD-FU-01

---

### UC-FU-006: Resolver conflicto de migración GUEST→CUSTOMER

**Objetivo:** Preservar la intención de compra de ambas sesiones al autenticarse un GUEST como CUSTOMER. **Actor principal:** CUSTOMER **Actores secundarios:** Sistema (detecta conflicto) **RF relacionados:** RF-FU-009 **HU relacionadas:** HU-FU-009 **RNF relacionados:** RNF-USE-003 **Precondiciones:** Existía FU de GUEST en `BORRADOR` y al autenticarse el CUSTOMER también tiene uno en `BORRADOR`. **Disparador:** Login exitoso de CUSTOMER con `guest_token` activo (`AUTO-FU-003`). **Flujo principal:**

1. El sistema detecta el conflicto post-login.
2. El sistema muestra modal (`CMP-FU-012`) con opciones: "Usar mi lista anterior" o "Combinar listas".
3. El actor selecciona una opción.
4. El sistema descarta el FU del GUEST y preserva/combinan el del CUSTOMER. **Flujos alternativos:**
5. Solo existe uno de los dos FU: El sistema migra automáticamente sin mostrar modal. **Flujos de excepción:**
6. La combinación supera el stock disponible: Se agrega con cantidad máxima y se notifica, sin fallar la operación. **Postcondiciones:** Un único FU `BORRADOR` resultante. Evento `EVT-FU-008` generado. **Reglas de negocio relacionadas:** RN-GUEST-MIGRATE-01. **Módulos involucrados:** MOD-FU-01, MOD-AUT-01

---

### UC-FU-007: Consultar historial de Formatos únicos

**Objetivo:** Dar trazabilidad al CUSTOMER sobre sus interacciones comerciales pasadas. **Actor principal:** CUSTOMER **Actores secundarios:** Ninguno **RF relacionados:** RF-FU-010 **HU relacionadas:** HU-FU-010 **RNF relacionados:** RNF-SEC-001 **Precondiciones:** Sesión CUSTOMER activa. **Disparador:** El actor accede al historial de Formatos Únicos (`/cuenta/formatos` o `/consultas` o `/cotizaciones`). **Flujo principal:**

1. El actor accede al historial.
2. El sistema realiza una consulta a la API (`GET /formatos/historial/`) y retorna el listado de Formatos Únicos donde `customer_id = current_user_id`.
3. El actor puede filtrar el listado por estado (ej: BORRADOR, COTIZACIÓN, CONSULTA, RESUELTA) y ver el detalle correspondiente.
**Flujos de excepción:** Ninguno. **Postcondiciones:** Listado visualizado. **Reglas de negocio relacionadas:** Ninguna. **Módulos involucrados:** MOD-FU-01

---

### UC-FU-008: Consultar Historial de Pedidos

**Objetivo:** Dar trazabilidad al CUSTOMER sobre sus compras corporativas y pedidos finalizados o en curso. **Actor principal:** CUSTOMER **Actores secundarios:** Ninguno **RF relacionados:** RF-FU-012 **HU relacionadas:** HU-FU-012 **RNF relacionados:** RNF-SEC-001 **Precondiciones:** Sesión CUSTOMER activa. **Disparador:** El actor accede a la sección de "Historial de Pedidos" (`/pedidos` o el widget del dashboard). **Flujo principal:**

1. El actor solicita ver su historial de pedidos.
2. El sistema realiza una consulta a la API (`GET /orders/`) y retorna el listado de órdenes donde el Formato Único asociado pertenece a su `customer_id`.
3. El sistema muestra el listado conteniendo ID de orden, estado actual (ej: PENDING_PAYMENT, PAID, SHIPPED), fecha de creación y monto total.
4. El actor puede seleccionar una orden para visualizar los productos específicos y su guía de envío si está disponible.
**Flujos de excepción:**
- El usuario no tiene pedidos registrados: El sistema muestra un mensaje indicando "No tienes pedidos recientes".
**Postcondiciones:** Listado de pedidos visualizado. **Reglas de negocio relacionadas:** RN-CHK-007 (Aislamiento de ownership). **Módulos involucrados:** MOD-FU-01, MOD-CHK-01

---

### UC-FU-016: Cancelar cotización vigente

**Objetivo:** Permitir que el CUSTOMER retome la edición de su Formato Único cuando decide comprar productos adicionales antes de que su cotización actual expire, sin tener que esperar los 15 días de vigencia. **Actor principal:** CUSTOMER **Actores secundarios:** Ninguno **RF relacionados:** RF-FU-020 **HU relacionadas:** HU-FU-013 **RNF relacionados:** RNF-SEC-001 **Precondiciones:** Sesión CUSTOMER activa; FU en estado `COTIZACIÓN` y perteneciente al actor. **Disparador:** El actor hace clic en "Cancelar cotización" desde `SCR-FU-002` (listado o detalle). **Flujo principal:**

1. El actor solicita cancelar la cotización vigente.
2. El sistema confirma la acción (advierte que se pierde el precio congelado).
3. El sistema transiciona el FU de `COTIZACIÓN` a `BORRADOR` (`FU-T-15`), preserva los ítems, limpia `pdf_url`.
4. El actor puede seguir agregando productos al mismo FU (ahora en `BORRADOR`, precios dinámicos otra vez).

**Flujos de excepción:**
- El FU no está en `COTIZACIÓN` (ya expiró, fue cancelado, o transicionó a `PEDIDO`): el sistema rechaza con `409 Conflict`.
- El FU no pertenece al actor: el sistema rechaza con `403 Forbidden` (RNF-SEC-001).

**Postcondiciones:** FU en `BORRADOR` con ítems preservados. **Reglas de negocio relacionadas:** RN-FU-06. **Módulos involucrados:** MOD-FU-01

---

### UC-FU-017: Recomprar desde el historial (Widget de Recompra)

**Objetivo:** Acelerar el flujo de recompra del CUSTOMER recurrente, reutilizando ítems de una cotización cerrada sin reconstruir el pedido desde cero. **Actor principal:** CUSTOMER **Actores secundarios:** Ninguno **RF relacionados:** RF-FU-021 **HU relacionadas:** HU-FU-014 **RNF relacionados:** RNF-SEC-001 **Precondiciones:** Sesión CUSTOMER activa; `hasHistory = true` (al menos un FU no-BORRADOR en su historial). **Disparador:** El actor hace clic en "Reemplazar Borrador" (`BTN-FU-008a`) o "Combinar con Borrador" (`BTN-FU-008b`) sobre una cotización histórica listada en el Widget de Recompra (`/formatos`). **Flujo principal (Reemplazar):**

1. El actor solicita reemplazar su borrador con los ítems de una cotización histórica.
2. El sistema muestra confirmación explícita ("los productos que tienes seleccionados ahora se perderán").
3. El actor confirma; el sistema vacía el borrador activo y copia los ítems del histórico, con precios **actuales** del catálogo (no los precios congelados).

**Flujo principal (Combinar):**

4. El actor solicita combinar los ítems de una cotización histórica con su borrador activo.
5. El sistema fusiona los ítems: si un producto ya está en el borrador, suma las cantidades; si no, lo agrega como fila nueva.
6. El sistema muestra un mensaje de éxito indicando cuántos productos quedaron combinados.

**Flujos de excepción:**
- El histórico no pertenece al actor: el sistema rechaza con `403 Forbidden`.
- Un producto del histórico ya no existe o está inactivo: se omite silenciosamente, sin fallar la operación completa.

**Postcondiciones:** Borrador activo actualizado con los ítems del histórico (reemplazados o combinados). El FU histórico no se modifica. **Reglas de negocio relacionadas:** RN-FU-09. **Módulos involucrados:** MOD-FU-01

---

### UC-CHK-001: Completar datos de envío y facturación

**Objetivo:** Recolectar información para emitir comprobante y coordinar despacho. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER **RF relacionados:** RF-CHK-001, RF-CHK-002 **HU relacionadas:** HU-CHK-001, HU-CHK-002 **RNF relacionados:** RNF-USE-003 **Precondiciones:** Order en `PENDING_PAYMENT`. **Disparador:** El actor completa campos en `SCR-CHK-001` (`ACT-CHK-001`, `ACT-CHK-002`). **Flujo principal:**

1. El actor ingresa datos de contacto, documento y dirección.
2. El sistema valida inline (DNI 8 dígitos, RUC 11, email RFC 5322).
3. Al completar dirección, el sistema calcula costo de envío (`OPS-CHK-002`) y actualiza el total. **Flujos de excepción:**
4. Cálculo de envío falla: El sistema bloquea el checkout (RN-SHP-01). **Postcondiciones:** Order con datos de envío y costo calculado. **Reglas de negocio relacionadas:** RN-CHK-001, RN-CHK-002, RN-SHP-001. **Módulos involucrados:** MOD-CHK-01

---

### UC-CHK-002: Iniciar proceso de pago

**Objetivo:** Redirigir al usuario a la pasarela de pago con los montos correctos. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER, MercadoPago (Sistema externo) **RF relacionados:** RF-CHK-003 **HU relacionadas:** HU-CHK-003 **RNF relacionados:** RNF-DIS-001 **Precondiciones:** Formulario de checkout válido y costo de envío calculado. **Disparador:** El actor hace clic en "Pagar ahora" (`BTN-CHK-001`). **Flujo principal:**

1. El actor confirma el pago.
2. El sistema crea preferencia en MercadoPago.
3. El sistema redirige al actor a la interfaz de MP. **Flujos de excepción:**
4. MercadoPago no responde: El sistema retorna 502 y mantiene Order en `PENDING_PAYMENT`. **Postcondiciones:** Preferencia creada. Evento `EVT-CHK-001` generado. **Reglas de negocio relacionadas:** RN-CHK-003. **Módulos involucrados:** MOD-CHK-01

---

### UC-CHK-003: Confirmar pago y recibir notificación

**Objetivo:** Procesar el webhook de pago exitoso y notificar al comprador. **Actor principal:** Sistema (MercadoPago) **Actores secundarios:** GUEST, CUSTOMER (receptores) **RF relacionados:** RF-CHK-004, RF-CHK-007 **HU relacionadas:** HU-CHK-004, HU-CHK-007 **RNF relacionados:** RNF-SEC-003, RNF-PERF-004 **Precondiciones:** Webhook recibido con `status=approved`, firma válida y `event_id` único. **Disparador:** Notificación HTTP POST de MercadoPago (`AUTO-CHK-001`). **Flujo principal:**

1. El sistema recibe el webhook.
2. El sistema valida firma HMAC y verifica idempotencia (`event_id` no procesado).
3. El sistema transiciona Order a `PAID` (`ORD-T-02`) y FU a `CONFIRMADO` (`FU-T-12`).
4. El sistema encola email de confirmación (`AUTO-CHK-004`). **Flujos de excepción:**
5. Firma inválida: Retorna 401 y registra en AuditLog.
6. `event_id` repetido: Retorna 200 sin reprocesar. **Postcondiciones:** Order pagado, FU confirmado, email encolado. Eventos `EVT-CHK-002` y `EVT-CHK-004` generados. **Reglas de negocio relacionadas:** RN-CHK-004, RN-CHK-005, RN-CHK-008. **Módulos involucrados:** MOD-CHK-01, MOD-FU-01

---

### UC-CHK-004: Cancelar o reintentar pedido fallido

**Objetivo:** Liberar el FU tras un fallo de pago o permitir el reintento conservando los ítems. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER, Sistema (MercadoPago) **RF relacionados:** RF-CHK-005, RF-CHK-008, RF-FU-011 **HU relacionadas:** HU-CHK-005, HU-CHK-008, HU-FU-011 **RNF relacionados:** RNF-REL-002, RNF-DIS-001 **Precondiciones:** Order en `PENDING_PAYMENT` (para cancelar) o `CANCELLED` (para reintentar). **Disparador:** Webhook de fallo (`AUTO-CHK-002`) o actor hace clic en "Cancelar" (`BTN-CHK-002`) / "Reintentar" (`BTN-CHK-003`). **Flujo principal (Cancelar):**

1. El actor o sistema solicita cancelar.
2. El sistema transiciona Order a `CANCELLED` (`ORD-T-03`) y FU a `CANCELADO` (`FU-T-13`).
3. El sistema muestra pantalla de error con opción de reintento. **Flujo principal (Reintentar):**
4. El actor solicita reintentar desde la pantalla de error.
5. El sistema transiciona FU a `BORRADOR` (`FU-T-14`) preservando ítems.
6. El actor aterriza en `SCR-FU-001` para revisar y volver a intentar checkout. **Flujos de excepción:**
7. Condición de carrera: El webhook confirma el pago justo cuando el actor cancela. Prevalece el pago confirmado. **Postcondiciones:** Estados actualizados. Evento `EVT-CHK-003` o `EVT-FU-011` generado. **Reglas de negocio relacionadas:** RN-CHK-006, RN-CHK-009, RN-CHK-010. **Módulos involucrados:** MOD-CHK-01, MOD-FU-01

---

### UC-CHK-005: Consultar confirmación de pedido

**Objetivo:** Permitir al comprador verificar el estado final de su transacción. **Actor principal:** GUEST **Actores secundarios:** CUSTOMER **RF relacionados:** RF-CHK-006 **HU relacionadas:** HU-CHK-006 **RNF relacionados:** RNF-SEC-001, RNF-SEC-007 **Precondiciones:** Order existe. GUEST tiene `orderToken` válido o CUSTOMER tiene sesión activa y es owner. **Disparador:** Acceso directo a `/checkout/confirmacion/[orderToken]`. **Flujo principal:**

1. El actor accede a la URL de confirmación.
2. El sistema valida el token o la sesión.
3. El sistema muestra el detalle del pedido y su estado actual. **Flujos de excepción:**
4. Token inválido o no pertenece al actor: Sistema retorna 404 (para no filtrar existencia). **Postcondiciones:** Detalle visualizado. **Reglas de negocio relacionadas:** RN-CHK-007. **Módulos involucrados:** MOD-CHK-01

---

### UC-CON-001: Gestionar cola de consultas

**Objetivo:** Permitir al SELLER visualizar y tomar consultas pendientes para evitar trabajo duplicado. **Actor principal:** SELLER **Actores secundarios:** GUEST/CUSTOMER (origina) **RF relacionados:** RF-CON-001, RF-CON-002, RF-CON-004 **HU relacionadas:** HU-CON-001, HU-CON-002, HU-CON-004 **RNF relacionados:** RNF-REL-002 **Precondiciones:** Sesión SELLER activa. Existen FU en estado `CONSULTA`. **Disparador:** SELLER accede a `/vendedor/consultas` (`NAV-CON-002`) o hace clic en "Atender" (`BTN-CON-001`). **Flujo principal:**

1. El SELLER visualiza la cola de consultas (asignadas y sin asignar).
2. El SELLER filtra por asignación o fecha (`ACT-CON-001`, `ACT-CON-002`).
3. El SELLER selecciona una consulta sin asignar y hace clic en "Atender".
4. El sistema fija `seller_id` al SELLER actual mediante bloqueo optimista. **Flujos de excepción:**
5. Condición de carrera: Otro SELLER tomó la consulta en el mismo instante. El sistema retorna 409 y actualiza la vista. **Postcondiciones:** Consulta asignada. Evento `EVT-CON-001` generado. **Reglas de negocio relacionadas:** RN-CONSULTA-ASSIGN-01, RN-CON-001. **Módulos involucrados:** MOD-CON-01, MOD-FU-01

---

### UC-CON-002: Responder consulta

**Objetivo:** Entregar asesoría comercial para permitir al cliente decidir su siguiente paso. **Actor principal:** SELLER **Actores secundarios:** GUEST/CUSTOMER (receptor) **RF relacionados:** RF-CON-003 **HU relacionadas:** HU-CON-003 **RNF relacionados:** Ninguno específico. **Precondiciones:** SELLER asignado a la consulta (`seller_id = actor_id`). Consulta en estado `CONSULTA`. **Disparador:** SELLER redacta respuesta y hace clic en "Enviar respuesta" (`BTN-CON-002`). **Flujo principal:**

1. El SELLER ingresa la asesoría en el editor (`CMP-CON-009`).
2. El SELLER confirma el envío.
3. El sistema valida que el SELLER sea el asignado.
4. El sistema transiciona el FU a `RESUELTA` (`FU-T-05`) y guarda la nota. **Flujos de excepción:**
5. SELLER no asignado: Sistema retorna 403.
6. Nota vacía: Sistema retorna 422. **Postcondiciones:** FU en `RESUELTA`, nota visible para el cliente. Evento `EVT-FU-012` generado. **Reglas de negocio relacionadas:** RN-CON-002. **Módulos involucrados:** MOD-CON-01, MOD-FU-01

---

### UC-COT-001: Visualizar cotizaciones (Vista SELLER)

**Objetivo:** Dar visibilidad del pipeline comercial B2B al equipo de ventas. **Actor principal:** SELLER **Actores secundarios:** CUSTOMER (genera) **RF relacionados:** RF-COT-001, RF-COT-002, RF-COT-003 **HU relacionadas:** HU-COT-001, HU-COT-002, HU-COT-003 **RNF relacionados:** RNF-PERF-002 **Precondiciones:** Sesión SELLER activa. **Disparador:** SELLER accede a `/vendedor/cotizaciones` (`NAV-COT-002`). **Flujo principal:**

1. El SELLER visualiza el listado de cotizaciones (vigentes, expiradas, convertidas).
2. El SELLER filtra por estado o fecha (`ACT-COT-001`, `ACT-COT-002`).
3. El SELLER hace clic en una fila para ver el detalle (`ACT-COT-004`).
4. El SELLER visualiza ítems, precios fijados, vigencia y puede descargar el PDF (`BTN-COT-001`). **Flujos de excepción:**
5. PDF removido del storage: Sistema retorna 404 al intentar descargar. **Postcondiciones:** Información visualizada. **Reglas de negocio relacionadas:** RN-CHECKOUT-02 (Precios inmutables). **Módulos involucrados:** MOD-COT-01, MOD-FU-01

---

### UC-SEL-001: Gestionar stock de productos

**Objetivo:** Mantener el inventario sincronizado con la realidad física y configurar alertas. **Actor principal:** SELLER **Actores secundarios:** GUEST/CUSTOMER (consumen badge), DISTRIBUTOR (sync masivo) **RF relacionados:** RF-SEL-001, RF-SEL-002, RF-SEL-003 **HU relacionadas:** HU-SEL-001, HU-SEL-002, HU-SEL-003 **RNF relacionados:** RNF-USE-003 **Precondiciones:** Sesión SELLER activa. **Disparador:** SELLER accede a `/vendedor/stock` (`NAV-SEL-001`) y edita valores inline (`ACT-SEL-003`). **Flujo principal:**

1. El SELLER visualiza la tabla de productos con stock actual y badges de alerta.
2. El SELLER modifica el stock o el umbral mínimo inline.
3. El SELLER hace clic en "Guardar" (`BTN-SEL-001` / `BTN-SEL-002`).
4. El sistema valida que los valores sean ≥ 0 y actualiza `Product`.
5. El sistema recalcula badges en el catálogo público (`AUTO-CAT-001`). **Flujos de excepción:**
6. Valor negativo o no numérico: Sistema retorna 422 y muestra error inline. **Postcondiciones:** Stock o umbral actualizado. Eventos `EVT-SEL-001` o `EVT-SEL-002` generados. **Reglas de negocio relacionadas:** RN-SEL-001, RN-CALC-03. **Módulos involucrados:** MOD-SEL-01, MOD-CAT-01

---

### UC-SEL-002: Gestionar despacho de pedidos

**Objetivo:** Formalizar el despacho físico de pedidos pagados generando guías de envío. **Actor principal:** SELLER **Actores secundarios:** GUEST/CUSTOMER (receptor) **RF relacionados:** RF-SEL-004, RF-SEL-005, RF-SEL-006 **HU relacionadas:** HU-SEL-004, HU-SEL-005, HU-SEL-006 **RNF relacionados:** Ninguno específico. **Precondiciones:** Sesión SELLER activa. Order en `READY_TO_SHIP`. **Disparador:** SELLER accede a cola de pedidos (`NAV-SEL-002`) y selecciona un pedido para generar guía (`ACT-SEL-005`). **Flujo principal:**

1. El SELLER visualiza pedidos pendientes de despacho.
2. El SELLER selecciona un pedido y completa formulario de guía (peso, bultos) (`CMP-SEL-013`).
3. El SELLER hace clic en "Generar guía" (`BTN-SEL-003`) y confirma.
4. El sistema transiciona Order a `SHIPPED` (`ORD-T-06`) y crea `ShippingGuide` con código mock.
5. El sistema muestra código de seguimiento. **Flujos de excepción:**
6. Pedido ya tiene guía (doble clic): Sistema retorna 409. **Postcondiciones:** Order despachado, guía creada. Evento `EVT-SEL-003` generado. **Reglas de negocio relacionadas:** RN-SHP-01. **Módulos involucrados:** MOD-SEL-01, MOD-CHK-01

---

### UC-ADM-001: Gestionar usuarios

**Objetivo:** Administrar el ciclo de vida de las cuentas de usuarios internos y clientes. **Actor principal:** ADMIN **Actores secundarios:** SELLER, CUSTOMER (afectados) **RF relacionados:** RF-ADM-001, RF-ADM-002, RF-ADM-003, RF-ADM-004 **HU relacionadas:** HU-ADM-001, HU-ADM-002, HU-ADM-003, HU-ADM-004 **RNF relacionados:** RNF-REL-004 **Precondiciones:** Sesión ADMIN activa con MFA verificado. **Disparador:** ADMIN accede a `/admin/usuarios` (`NAV-ADM-001`) e interactúa con botones de gestión. **Flujo principal (Crear):**

1. ADMIN abre modal de creación, ingresa email, nombre y rol (SELLER/ADMIN).
2. Sistema valida unicidad de email y crea usuario con `auth_provider = LOCAL`. **Flujo principal (Suspender/Eliminar):**
3. ADMIN selecciona usuario y confirma acción.
4. Sistema valida que no sea auto-acción y que no se viole mínimo de ADMINs.
5. Sistema actualiza `is_suspended = true` o ejecuta soft-delete (`is_active = false`). **Flujos de excepción:**
6. Email ya existe: Sistema retorna 409.
7. Auto-suspensión/eliminación: Sistema retorna 403.
8. Quedaría < 2 ADMINs activos: Sistema retorna 409. **Postcondiciones:** Usuario creado, suspendido o eliminado. Eventos `EVT-ADM-001` a `EVT-ADM-003` generados. **Reglas de negocio relacionadas:** RN-ADMIN-01, RN-ADMIN-02, RN-ADM-001. **Módulos involucrados:** MOD-ADM-01, MOD-AUT-01

---

### UC-ADM-002: Gestionar catálogo de productos

**Objetivo:** Mantener control total sobre la oferta comercial (CRUD de productos). **Actor principal:** ADMIN **Actores secundarios:** GUEST/CUSTOMER (consumen catálogo) **RF relacionados:** RF-ADM-005 **HU relacionadas:** HU-ADM-005 **RNF relacionados:** RNF-INT-002 **Precondiciones:** Sesión ADMIN activa con MFA verificado. **Disparador:** ADMIN accede a `/admin/productos` (`NAV-ADM-002`) y crea/edita/desactiva productos. **Flujo principal:**

1. ADMIN completa formulario de producto (nombre, SKU, precio, imágenes, categoría).
2. Sistema valida campos obligatorios y unicidad de SKU/slug.
3. Sistema crea o actualiza `Product` y `Category`. **Flujos alternativos:**
4. ADMIN desactiva producto: Sistema invierte `is_active`. Productos inactivos no aparecen en catálogo público. **Flujos de excepción:**
5. SKU o slug duplicado: Sistema retorna 409.
6. Campos inválidos (precio ≤ 0): Sistema retorna 422. **Postcondiciones:** Catálogo actualizado. Evento `EVT-ADM-004` generado. **Reglas de negocio relacionadas:** RN-CATALOG-01. **Módulos involucrados:** MOD-ADM-01, MOD-CAT-01

---

### UC-ADM-003: Visualizar métricas de ventas

**Objetivo:** Proporcionar visibilidad analítica del desempeño comercial. **Actor principal:** ADMIN **Actores secundarios:** Ninguno **RF relacionados:** RF-ADM-006 **HU relacionadas:** HU-ADM-006 **RNF relacionados:** Ninguno específico. **Precondiciones:** Sesión ADMIN activa con MFA verificado. Existen pedidos en estados `PAID`/`SHIPPED`. **Disparador:** ADMIN accede a `/admin/metricas/ventas` (`NAV-ADM-003`). **Flujo principal:**

1. ADMIN visualiza gráficos de revenue por período y tabla de productos más vendidos.
2. ADMIN ajusta rango de fechas (`ACT-ADM-003`).
3. Sistema recalcula y muestra datos agregados. **Flujos de excepción:**
4. Sin datos suficientes: Sistema muestra estado "sin datos" en los gráficos. **Postcondiciones:** Métricas visualizadas. **Reglas de negocio relacionadas:** Ninguna. **Módulos involucrados:** MOD-ADM-01, MOD-CHK-01

---

### UC-ADM-004: Configurar parámetros del sistema

**Objetivo:** Ajustar configuración global que afecta el comportamiento de negocio. **Actor principal:** ADMIN **Actores secundarios:** Sistema (consume config) **RF relacionados:** RF-ADM-007 **HU relacionadas:** HU-ADM-007 **RNF relacionados:** Ninguno específico. **Precondiciones:** Sesión ADMIN activa con MFA verificado. **Disparador:** ADMIN accede a `/admin/configuracion` (`NAV-ADM-004`) y modifica valores. **Flujo principal:**

1. ADMIN modifica parámetros (ej. `default_stock_min_threshold`, `quote_validity_days`).
2. Sistema valida rangos (ej. días ≥ 1).
3. Sistema actualiza `SystemConfig`. **Flujos de excepción:**
4. Parámetro fuera de rango válido: Sistema retorna 422. **Postcondiciones:** Configuración global actualizada. Evento `EVT-ADM-005` generado. **Reglas de negocio relacionadas:** RN-CALC-03, RN-FU-03. **Módulos involucrados:** MOD-ADM-01

---

### UC-ADM-005: Exportar datos del sistema

**Objetivo:** Permitir extracción de datos sensibles con control de seguridad reforzado. **Actor principal:** ADMIN **Actores secundarios:** Sistema (genera archivo) **RF relacionados:** RF-ADM-008 **HU relacionadas:** HU-ADM-008 **RNF relacionados:** RNF-SEC-002 **Precondiciones:** Sesión ADMIN activa. **Disparador:** ADMIN hace clic en "Exportar datos" (`BTN-ADM-008`). **Flujo principal:**

1. Sistema solicita re-autenticación MFA (step-up) (`CMP-ADM-015`).
2. ADMIN ingresa código TOTP válido.
3. Sistema genera archivo (formato CSV según decisión técnica) y lo descarga.
4. Sistema registra evento en `AuditLog`. **Flujos de excepción:**
5. Verificación MFA falla: Sistema retorna 401 y no genera archivo. **Postcondiciones:** Archivo descargado, evento auditado. Evento `EVT-ADM-006` generado. **Reglas de negocio relacionadas:** RN-ADM-002. **Módulos involucrados:** MOD-ADM-01, MOD-AUT-01

---

### UC-ADM-006: Asignar consultas preventa

**Objetivo:** Permitir al administrador equilibrar la carga de trabajo asignando preventas a vendedores específicos. **Actor principal:** ADMIN **Actores secundarios:** SELLER **RF relacionados:** RF-ADM-009 **HU relacionadas:** HU-ADM-009 **RNF relacionados:** Ninguno. **Precondiciones:** Sesión ADMIN activa. La consulta existe en estado `CONSULTA`. **Disparador:** ADMIN selecciona un vendedor en el dropdown de asignación. **Flujo principal:**

1. ADMIN visualiza el detalle de una consulta.
2. ADMIN abre el selector de vendedor y selecciona un SELLER.
3. El sistema actualiza el campo `assigned_seller_id` en base de datos.
4. El sistema notifica al SELLER y actualiza el estado. **Flujos de excepción:**
5. El SELLER seleccionado no está activo: El sistema rechaza con error 400. **Postcondiciones:** Consulta asignada al vendedor seleccionado. **Reglas de negocio relacionadas:** Ninguna. **Módulos involucrados:** MOD-ADM-01, MOD-CON-01

---

### UC-ADM-007: Aplicar descuento comercial B2B

**Objetivo:** Permitir al administrador otorgar condiciones comerciales especiales congeladas en cotizaciones de volumen. **Actor principal:** ADMIN **Actores secundarios:** CUSTOMER **RF relacionados:** RF-ADM-010 **HU relacionadas:** HU-ADM-010 **RNF relacionados:** Ninguno. **Precondiciones:** Sesión ADMIN activa. La cotización está en estado `COTIZACION` (vigente). **Disparador:** ADMIN ingresa un porcentaje de descuento y confirma. **Flujo principal:**

1. ADMIN ingresa el descuento (hasta 30%) en el panel de gobernanza.
2. El sistema valida la regla de negocio `RN-ADM-04`.
3. El sistema recalcula el subtotal del Formato Único y actualiza la base de datos.
4. El sistema regenera el PDF inmutable con los precios congelados. **Flujos de excepción:**
5. El descuento ingresado es mayor a 30%: El sistema rechaza con error 400. **Postcondiciones:** Descuento aplicado y subtotal congelado en el PDF. **Reglas de negocio relacionadas:** RN-ADM-04. **Módulos involucrados:** MOD-ADM-01, MOD-COT-01

---

### UC-AUT-001: Iniciar sesión con Google (CUSTOMER)

**Objetivo:** Autenticar clientes delegando la verificación de identidad a Google. **Actor principal:** CUSTOMER (potencial) **Actores secundarios:** Google (Proveedor OAuth), Sistema (detecta conflicto) **RF relacionados:** RF-AUT-001 **HU relacionadas:** HU-AUT-001 **RNF relacionados:** RNF-SEC-002 **Precondiciones:** Usuario tiene cuenta de Google. **Disparador:** Actor hace clic en "Iniciar sesión con Google" (`BTN-AUT-001`). **Flujo principal:**

1. Sistema redirige a OAuth de Google.
2. Usuario autoriza la aplicación.
3. Sistema recibe token, crea `User` (si es primer login) o autentica existente.
4. Sistema emite JWT y redirige a panel o home. **Flujos alternativos:**
5. Existía conflicto de FU (GUEST y CUSTOMER con FU en BORRADOR): Sistema dispara `UC-FU-006` post-login. **Flujos de excepción:**
6. Google rechaza autenticación: Sistema retorna 401.
7. Proveedor OAuth no responde: Sistema retorna 502. **Postcondiciones:** Sesión CUSTOMER activa. Eventos `EVT-AUT-001` y `EVT-AUT-002` (condicional) generados. **Reglas de negocio relacionadas:** RN-AUT-001. **Módulos involucrados:** MOD-AUT-01, MOD-FU-01

---

### UC-AUT-002: Iniciar sesión local y verificar MFA

**Objetivo:** Autenticar personal interno con credenciales locales y segundo factor si aplica. **Actor principal:** SELLER **Actores secundarios:** ADMIN **RF relacionados:** RF-AUT-002, RF-AUT-003, RF-AUT-004 **HU relacionadas:** HU-AUT-002, HU-AUT-003, HU-AUT-004 **RNF relacionados:** RNF-SEC-002 **Precondiciones:** Usuario tiene credenciales locales válidas y cuenta no suspendida. **Disparador:** Actor completa formulario en `/auth/login/staff` (`BTN-AUT-002`). **Flujo principal:**

1. Actor ingresa email y password.
2. Sistema valida credenciales.
3. Si `mfa_enabled = true`, sistema redirige a `/auth/mfa/verify`.
4. Actor ingresa código TOTP (`BTN-AUT-003`) o código de respaldo (`ACT-AUT-001`).
5. Sistema valida código y concede sesión completa. **Flujos alternativos:**
6. `mfa_enabled = false`: Sistema concede sesión directamente tras validar password. **Flujos de excepción:**
7. Credenciales inválidas: Sistema retorna 401.
8. Cuenta suspendida: Sistema retorna 403 con mensaje específico (`AUTO-AUT-001`).
9. Código TOTP inválido: Sistema retorna 401.
10. Código de respaldo ya usado: Sistema retorna 401. **Postcondiciones:** Sesión completa activa. Eventos `EVT-AUT-001`, `EVT-AUT-003` o `EVT-AUT-004` generados. **Reglas de negocio relacionadas:** RN-AUT-002, RN-AUT-003. **Módulos involucrados:** MOD-AUT-01

---

### UC-AUT-003: Habilitar MFA (SELLER)

**Objetivo:** Permitir adopción voluntaria de seguridad reforzada. **Actor principal:** SELLER **Actores secundarios:** Ninguno **RF relacionados:** RF-AUT-005 **HU relacionadas:** HU-AUT-005 **RNF relacionados:** Ninguno específico. **Precondiciones:** Sesión SELLER activa. MFA no habilitado previamente. **Disparador:** SELLER accede a `/cuenta/seguridad` y activa toggle (`BTN-AUT-004`). **Flujo principal:**

1. SELLER escanea código QR con app TOTP.
2. SELLER ingresa primer código TOTP para verificar.
3. Sistema genera `mfa_secret` y 10 códigos de respaldo.
4. Sistema muestra códigos de respaldo (una sola vez) y fija `mfa_enabled = true`. **Flujos de excepción:** Ninguno esperado. **Postcondiciones:** MFA activo para sesiones futuras. Evento `EVT-AUT-005` generado. **Reglas de negocio relacionadas:** Ninguna nueva. **Módulos involucrados:** MOD-AUT-01

---

### UC-AUT-004: Cerrar sesión

**Objetivo:** Terminar explícitamente la sesión del usuario. **Actor principal:** CUSTOMER **Actores secundarios:** SELLER, ADMIN **RF relacionados:** RF-AUT-006 **HU relacionadas:** HU-AUT-006 **RNF relacionados:** RNF-SEC-007 **Precondiciones:** Sesión activa. **Disparador:** Actor hace clic en "Cerrar sesión" en menú global (`BTN-AUT-005`). **Flujo principal:**

1. Actor solicita cerrar sesión.
2. Sistema invalida token y cookie.
3. Sistema redirige a estado no autenticado (home o login). **Flujos de excepción:** Ninguno esperado. **Postcondiciones:** Sesión invalidada. Evento `EVT-AUT-006` generado. **Reglas de negocio relacionadas:** Ninguna. **Módulos involucrados:** MOD-AUT-01

---

### UC-AUT-007: Renovar sesión mediante refresh token

**Objetivo:** Mantener la sesión del usuario activa sin exigir re-login cada 60 minutos, mientras conserva la posibilidad de revocar la sesión de forma efectiva (Zero Trust). **Actor principal:** CUSTOMER **Actores secundarios:** SELLER, ADMIN, Sistema (interceptor HTTP del frontend) **RF relacionados:** RF-AUT-009 **HU relacionadas:** HU-AUT-007 **RNF relacionados:** RNF-SEC-001 **Precondiciones:** El actor posee un refresh_token vigente (cookie httpOnly, no vencido, no revocado). **Disparador:** Una petición autenticada recibe `401` por access_token expirado; el interceptor HTTP del frontend dispara la renovación automáticamente, sin acción explícita del usuario. **Flujo principal:**

1. El sistema recibe `401` en una petición a un endpoint protegido.
2. El sistema solicita `POST /auth/refresh` enviando el refresh_token (cookie httpOnly).
3. El sistema valida el refresh_token: existe, no está revocado, no expiró.
4. El sistema ROTA el token: revoca el usado, genera y persiste uno nuevo (hasheado).
5. El sistema emite un nuevo access_token (JWT, 60 min) y el nuevo refresh_token, ambos en cookies httpOnly.
6. El sistema reintenta automáticamente la petición original, ahora autenticada.

**Flujos de excepción:**
- El refresh_token no existe, expiró, o ya fue revocado (ej. reutilización tras rotación, o tras logout): el sistema responde `401` y borra ambas cookies; el actor cae al flujo de sesión no autenticada (debe iniciar sesión de nuevo).

**Postcondiciones:** Sesión renovada con nuevos access_token y refresh_token; el refresh_token anterior queda inválido. **Reglas de negocio relacionadas:** RN-AUT-004. **Módulos involucrados:** MOD-AUT-01

---

### UC-DIS-001: Autenticar solicitud de sincronización

**Objetivo:** Garantizar que solo distribuidores autorizados modifiquen el catálogo. **Actor principal:** DISTRIBUTOR (Sistema externo) **Actores secundarios:** Sistema Alling (valida) **RF relacionados:** RF-DIS-001 **HU relacionadas:** Ninguna (actor no humano) **RNF relacionados:** RNF-SEC-004 **Precondiciones:** DISTRIBUTOR posee API Key y HMAC Secret válidos. **Disparador:** Solicitud HTTP POST recibida en endpoint de sincronización. **Flujo principal:**

1. Sistema recibe solicitud con headers `Authorization`, `X-Alling-Timestamp`, `X-Alling-Nonce`, `X-Alling-Signature`.
2. Sistema busca `DistributorApiKey` y valida firma HMAC.
3. Sistema verifica que `nonce` no haya sido usado en últimas 24h y timestamp esté en ventana ±5 min.
4. Sistema autoriza continuación a `UC-DIS-002`. **Flujos de excepción:**
5. Firma inválida o API Key desconocida: Sistema retorna 401 y registra intento en AuditLog.
6. Nonce reutilizado o timestamp fuera de ventana: Sistema retorna 409/401. **Postcondiciones:** Solicitud autenticada. **Reglas de negocio relacionadas:** RN-DIS-002. **Módulos involucrados:** MOD-DIS-01

---

### UC-DIS-002: Sincronizar catálogo (Precios/Stock)

**Objetivo:** Actualizar masivamente precios y stock desde el distribuidor. **Actor principal:** DISTRIBUTOR (Sistema externo) **Actores secundarios:** Sistema Alling (procesa), GUEST/CUSTOMER (ven reflejo) **RF relacionados:** RF-DIS-002, RF-DIS-003, RF-DIS-004 **HU relacionadas:** Ninguna (actor no humano) **RNF relacionados:** RNF-PERF-005 **Precondiciones:** Autenticación exitosa (`UC-DIS-001`). **Disparador:** Payload JSON con lista de SKUs y nuevos valores recibido tras autenticación. **Flujo principal:**

1. Sistema itera sobre SKUs del payload.
2. Para SKUs existentes: Sistema actualiza `price_public`, `price_wholesale` o `stock`.
3. Sistema recalcula badges de catálogo (`AUTO-CAT-001`) si aplica.
4. Sistema retorna 200 OK con detalle de actualizaciones. **Flujos alternativos:**
5. SKU desconocido: Sistema ignora ese SKU, procesa el resto y retorna 404 con detalle de SKUs rechazados (procesamiento parcial). **Flujos de excepción:**
6. Payload masivo excede límites: Sistema retorna 413. **Postcondiciones:** Catálogo actualizado. Eventos `EVT-DIS-001`, `EVT-DIS-002` o `EVT-DIS-003` generados. **Reglas de negocio relacionadas:** RN-DIST-01, RN-CHECKOUT-02. **Módulos involucrados:** MOD-DIS-01, MOD-CAT-01
---

## 🆕 EXTENSIONES v1.2 (Nuevos Casos de Uso)

### UC-EXCEL-001: Carga Masiva de Productos
- **Actores:** GUEST, CUSTOMER
- **Precondición:** Formato Único en estado BORRADOR.
- **Flujo Principal:**
  1. Usuario hace clic en "Importar Excel".
  2. Sistema valida formato y tamaño del archivo.
  3. Sistema procesa el archivo y muestra pre-visualización con errores/advertencias.
  4. Usuario confirma la importación.
  5. Sistema agrega ítems válidos al Formato Único.
- **Postcondición:** Formato Único actualizado con nuevos ítems.

### UC-TG-001: Consulta Técnica vía Telegram
- **Actores:** GUEST, CUSTOMER, SELLER
- **Precondición:** Producto visible en catálogo o en Formato Único con error de stock.
- **Flujo Principal:**
  1. Usuario hace clic en "Consultar por Telegram".
  2. Sistema abre enlace `t.me` con mensaje pre-armado (SKU, nombre, contexto).
  3. Usuario envía el mensaje desde su app de Telegram.
- **Postcondición:** Consulta enviada al canal de soporte del SELLER.

### UC-MP-001: Pago con Mercado Pago
- **Actores:** GUEST, CUSTOMER
- **Precondición:** Formato Único en estado COTIZACIÓN, datos de facturación ingresados.
- **Flujo Principal:**
  1. Usuario hace clic en "Pagar con Mercado Pago".
  2. Sistema reserva stock y cambia estado a PEDIDO.
  3. Sistema redirige a la pasarela de Mercado Pago.
  4. Usuario completa el pago en la pasarela.
  5. Mercado Pago envía webhook al sistema.
  6. Sistema valida webhook y actualiza estado a CONFIRMADO.
- **Postcondición:** Order confirmada, stock descontado definitivamente.

### UC-KIT-001: Gestión de Kits (ADMIN)
- **Actores:** ADMIN
- **Precondición:** ADMIN autenticado.
- **Flujo Principal:**
  1. ADMIN ingresa a "Gestión de Kits".
  2. ADMIN crea nuevo Kit seleccionando productos componentes.
  3. Sistema calcula precio dinámico y stock mínimo.
  4. ADMIN guarda el Kit.
- **Postcondición:** Kit disponible en el catálogo para GUEST/CUSTOMER.
