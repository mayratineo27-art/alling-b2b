# Historias de Usuario — Sistema Alling

|Campo|Valor|
|---|---|
|**ID Documento**|DOC_ALLING_USER_STORIES_001|
|**Versión**|1.0.0|
|**Estado**|Borrador (pendiente VoBo)|
|**Fuente de verdad**|`functional_requirements.md` (94 RFs), `non_functional_requirements.md` (49 RNFs), Inventario Funcional Maestro (10 módulos)|
|**Metodología**|SpecDD — derivación estricta desde RFs, sin invención|
|**Total de HUs**|49|
|**Nota metodológica**|MOD-DIS-01 y MOD-SYS-01 no generan HUs por decisión metodológica (sin actor humano). Ver OBS-005 del documento de RFs.|

---

## 1. Convenciones

### 1.1 Nomenclatura

- **Formato:** `HU-[MÓDULO]-[NNN]`
- **Códigos de módulo:** CAT, FU, CHK, CON, COT, SEL, ADM, AUT
- **Prioridad:** MVP / MVP+ (heredada del RF de origen)

### 1.2 Principios de derivación

1. **No invención:** Toda HU deriva de uno o más RFs explícitamente documentados.
2. **Trazabilidad bidireccional:** Cada HU cita sus RFs y RNFs; cada RF crítico tiene al menos una HU asociada.
3. **Respeto a decisiones de reconciliación:** Las HUs reflejan las decisiones de INC-001 (jerarquía de stock), INC-005 (formato CSV), INC-006 (soft-delete), INC-007 (anonimización).

---

## 2. Historias de Usuario por Módulo

### 2.1 Módulo Catálogo (MOD-CAT-01)

#### HU-CAT-001 — Buscar productos en el catálogo

**Como** visitante del sitio (GUEST o CUSTOMER autenticado)  
**Quiero** buscar y filtrar productos por categoría, marca, precio y disponibilidad  
**Para** encontrar rápidamente los insumos de redes que necesito sin navegar manualmente todo el catálogo

**RF relacionados:** RF-CAT-001  
**RNF relacionados:** RNF-PERF-001 (P95 < 300 ms), RNF-SCAL-001 (hasta 10,000 productos)  
**Actor:** GUEST, CUSTOMER, SELLER, ADMIN  
**Prioridad:** MVP  
**Valor de negocio:** Punto de entrada principal del funnel de conversión; reduce abandono por fricción de búsqueda.  
**Precondiciones:**

- El catálogo tiene al menos un producto activo.
- El usuario tiene conexión a internet.

**Postcondiciones:**

- Se muestra un listado filtrado de productos activos.
- Los filtros aplicados son visibles como chips removibles.

**Flujo resumido:**

1. Usuario accede a `/productos`.
2. Escribe texto en buscador y/o selecciona filtros.
3. Sistema retorna resultados paginados en < 300 ms (P95).
4. Usuario puede refinar o limpiar filtros.

**Observaciones:**

- El stock se muestra como booleano/rango (RN-CATALOG-01), nunca cantidad exacta.
- Los productos inactivos no aparecen en resultados.

---

#### HU-CAT-002 — Ver detalle de un producto

**Como** visitante del sitio  
**Quiero** ver la información completa de un producto específico (imágenes, especificaciones, stock, precio)  
**Para** tomar una decisión informada antes de agregarlo a mi Formato Único

**RF relacionados:** RF-CAT-002  
**RNF relacionados:** RNF-PERF-001  
**Actor:** GUEST, CUSTOMER, SELLER, ADMIN  
**Prioridad:** MVP  
**Valor de negocio:** Reduce consultas pre-venta innecesarias para decisiones simples.  
**Precondiciones:**

- El producto existe y está activo.
- El usuario accede vía URL con slug válido.

**Postcondiciones:**

- Se muestra la vista completa del producto.
- El usuario puede agregar el producto al Formato Único desde esta vista.

**Flujo resumido:**

1. Usuario hace click en un producto desde el listado.
2. Sistema carga la vista de detalle con galería, tabs de información y selector de cantidad.
3. Si el producto fue desactivado entre el listado y el click, se muestra 404.

**Observaciones:**

- La URL usa slug SEO-friendly (ej: `/productos/cable-utp-cat6-marca-x`).
- El evento `EVT-CAT-001 ProductoVisto` es opcional para MVP.

---

#### HU-CAT-004 — Explorar Landing Page (Home GUEST)

**Como** visitante no autenticado (GUEST)
**Quiero** visualizar una Landing Page atractiva con imágenes, categorías y productos destacados sin precios
**Para** descubrir la oferta de la tienda antes de registrarme o iniciar sesión

**RF relacionados:** RF-CAT-004
**RNF relacionados:** RNF-PERF-001, RNF-USE-001 (Contraste WCAG AA)
**Actor:** GUEST, CUSTOMER (redirección a Dashboard)
**Prioridad:** MVP+
**Valor de negocio:** Incrementa la tasa de retención de nuevos usuarios y conversiones preliminares.
**Precondiciones:**
- El sistema cuenta con productos marcados como `is_featured = true`.
- El sistema cuenta con categorías activas con contadores correctos.

**Postcondiciones:**
- Se visualiza la Landing Page con Hero Image, productos destacados sin precio y novedades.

**Flujo resumido:**
1. Usuario accede a `/`.
2. El sistema carga la estructura de la landing page y consume el endpoint `/productos/landing`.
3. Si el actor es CUSTOMER, redirige a `/dashboard`.
4. El sistema muestra Hero Image (CMP-CAT-023), Grid de Destacados (CMP-CAT-024) y Categorías (CMP-CAT-025).

**Observaciones:**
- La visualización de precios está deshabilitada en esta vista para incentivar la autenticación (B2B).

---

#### HU-CAT-005 — Navegar por grid de categorías intermedio

**Como** visitante de la tienda (GUEST o CUSTOMER)
**Quiero** acceder a una cuadrícula interactiva con los nombres y contadores de cada categoría
**Para** seleccionar la sección específica de mi interés antes de ver todo el listado de productos

**RF relacionados:** RF-CAT-005
**RNF relacionados:** RNF-PERF-001
**Actor:** GUEST, CUSTOMER
**Prioridad:** MVP+
**Valor de negocio:** Mejora la experiencia de usuario y reduce la carga del servidor al evitar scans de catálogo innecesarios.
**Precondiciones:**
- Al menos una categoría cuenta con productos activos en el sistema.

**Postcondiciones:**
- Se visualiza el grid de categorías con la cantidad dinámica de productos disponibles.

**Flujo resumido:**
1. El usuario hace click en "Categorías" en el menú de navegación.
2. El sistema carga `SCR-CAT-004` consumiendo los contadores dinámicos del backend.
3. El usuario hace click en una tarjeta de categoría.
4. El sistema redirige a `SCR-CAT-001` con el filtro de categoría pre-aplicado.

---

#### HU-CAT-006 — Explorar y adquirir Kits Pre-armados

**Como** cliente de la tienda (GUEST o CUSTOMER)
**Quiero** ver agrupaciones de productos armadas como Kits con precio consolidado y stock dinámico
**Para** agregar soluciones completas a mi Formato Único con un solo click

**RF relacionados:** RF-CAT-006
**RNF relacionados:** RNF-REL-002, RN-KIT-01, RN-KIT-02, RN-KIT-03
**Actor:** GUEST, CUSTOMER
**Prioridad:** MVP+
**Valor de negocio:** Aumenta el ticket promedio y simplifica la compra de paquetes de insumos comunes.
**Precondiciones:**
- Existe al menos un Kit configurado en el sistema con al menos 2 componentes activos.

**Postcondiciones:**
- El Kit seleccionado se desglosa en ítems individuales y se agrega al Formato Único.

**Flujo resumido:**
1. El usuario navega a la sección `/kits`.
2. El sistema renderiza las tarjetas de Kits con precio y stock efectivo (mínimo de stock de sus componentes).
3. El usuario hace click en "Agregar al Formato Único".
4. El sistema valida stock de todos los componentes y agrega las cantidades correspondientes al FU.

---

#### HU-CAT-007 — Gestionar productos Favoritos

**Como** cliente corporativo autenticado (CUSTOMER)
**Quiero** marcar productos del catálogo como favoritos
**Para** guardarlos en una lista de acceso rápido y simplificar compras recurrentes

**RF relacionados:** RF-CAT-007
**RNF relacionados:** RN-FAV-01
**Actor:** CUSTOMER
**Prioridad:** MVP+
**Valor de negocio:** Fomenta la lealtad y retención del cliente B2B facilitando reordenamientos.
**Precondiciones:**
- El CUSTOMER se encuentra autenticado en el sistema.

**Postcondiciones:**
- El producto seleccionado se añade o remueve de la lista de favoritos del usuario.

**Flujo resumido:**
1. El CUSTOMER ve un producto en el listado o detalle y hace click en el icono de corazón (`BTN-CAT-006`).
2. El sistema envía petición `POST /favoritos/{id}`.
3. El sistema actualiza el estado visual del corazón y añade el producto a la vista `/favoritos`.

---

#### HU-CAT-008 — Solicitar consulta rápida por Telegram

**Como** visitante de la tienda (GUEST o CUSTOMER)
**Quiero** iniciar una conversación directa por Telegram enviando datos del producto de forma automática
**Para** resolver dudas específicas con soporte comercial sin llenar formularios complejos

**RF relacionados:** RF-CAT-008
**RNF relacionados:** RN-TG-01
**Actor:** GUEST, CUSTOMER
**Prioridad:** MVP+
**Valor de negocio:** Canal alternativo rápido para consultas pre-venta, incrementando la conversión offline.
**Precondiciones:**
- El usuario cuenta con la aplicación Telegram instalada o activa en su navegador.

**Postcondiciones:**
- Se abre una ventana externa de chat con soporte de ventas con el mensaje pre-configurado listo para enviar.

**Flujo resumido:**
1. El usuario visualiza un producto sin stock o con dudas y hace click en el botón de Telegram.
2. El sistema abre la URL externa `https://t.me/` pasando el texto estructurado con el nombre y el SKU/ID del producto.

---

#### HU-CAT-009 — Carrito flotante (Drawer) y notificación no intrusiva

**Como** GUEST o CUSTOMER navegando el catálogo
**Quiero** ver una confirmación rápida al agregar un producto, sin salir de la página
**Para** seguir comprando sin perder el hilo de mi búsqueda

**RF relacionados:** RF-CAT-009
**RNF relacionados:** —
**Actor:** GUEST, CUSTOMER
**Prioridad:** MVP+
**Valor de negocio:** Reduce el abandono de catálogo causado por redirecciones forzadas a la página completa del carrito.
**Precondiciones:**
- El actor agrega un producto con stock disponible.

**Postcondiciones:**
- Se muestra una notificación temporizada (Toast) con las acciones "Seguir buscando" / "Ver proforma".
- El ícono del carrito del Header refleja la cantidad de ítems en todo momento.

**Flujo resumido:**
1. El actor hace clic en "Agregar a mi Formato".
2. El sistema confirma con un Toast; el badge del Header se actualiza.
3. El actor elige seguir navegando o abrir el Drawer lateral para ver/editar el resumen.

**Observaciones:**
- Antes de esta HU no existía ningún sistema de notificación no bloqueante en el frontend (todo era `alert()` o mensajes locales con `setTimeout`).

---

### 2.2 Módulo Formato Único (MOD-FU-01)

#### HU-FU-001 — Editar cantidad de un ítem

**Como** usuario con productos en mi Formato Único  
**Quiero** modificar la cantidad de un producto específico  
**Para** ajustar mi intención de compra antes de comprometerme

**RF relacionados:** RF-FU-001  
**RNF relacionados:** RNF-REL-002 (FSM)  
**Actor:** GUEST, CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Flexibilidad para refinar la intención de compra.  
**Precondiciones:**

- El FU está en estado `BORRADOR`.
- El ítem existe en el FU.

**Postcondiciones:**

- La cantidad se actualiza.
- Los totales se recalculan (AUTO-FU-001).
- Se valida que la nueva cantidad no exceda el stock disponible.

**Flujo resumido:**

1. Usuario incrementa/decrementa cantidad inline o escribe directamente.
2. Sistema valida contra stock y recalcula totales.
3. Si la cantidad excede stock, se muestra mensaje de error inline.

**Observaciones:**

- Solo aplicable en estado `BORRADOR`.
- Cantidad mínima: 1.

---

#### HU-FU-002 — Eliminar un ítem del Formato Único

**Como** usuario con productos en mi Formato Único  
**Quiero** eliminar un producto específico de mi lista  
**Para** corregir mi selección antes de continuar

**RF relacionados:** RF-FU-002  
**RNF relacionados:** RNF-REL-002  
**Actor:** GUEST, CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Corrección rápida sin vaciar todo el FU.  
**Precondiciones:**

- El FU está en `BORRADOR`.
- El ítem pertenece al FU del actor.

**Postcondiciones:**

- El ítem se elimina del FU.
- Los totales se recalculan.
- Si era el último ítem, el FU queda vacío.

**Flujo resumido:**

1. Usuario hace click en "Eliminar" junto al ítem.
2. Sistema solicita confirmación.
3. Tras confirmar, el ítem se elimina y los totales se recalculan.

**Observaciones:**

- Si el ítem ya no existe (condición de carrera), se retorna 404.

---

#### HU-FU-003 — Vaciar el Formato Único

**Como** usuario con productos en mi Formato Único  
**Quiero** eliminar todos los ítems de una sola vez  
**Para** reiniciar mi lista sin crear un nuevo FU

**RF relacionados:** RF-FU-003  
**RNF relacionados:** RNF-REL-002  
**Actor:** GUEST, CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Reinicio rápido cuando la selección inicial no sirve.  
**Precondiciones:**

- El FU está en `BORRADOR` con al menos 1 ítem.

**Postcondiciones:**

- El FU queda en `BORRADOR` sin ítems.
- Se emite `EVT-FU-002` × n (uno por ítem eliminado).

**Flujo resumido:**

1. Usuario hace click en "Vaciar Formato Único".
2. Sistema solicita confirmación ("¿Vaciar todo?").
3. Tras confirmar, todos los ítems se eliminan.

**Observaciones:**

- El FU no se elimina, solo se vacía.

---

#### HU-FU-004 — Solicitar consulta pre-venta

**Como** usuario con productos en mi Formato Único  
**Quiero** enviar una consulta técnica a un vendedor  
**Para** recibir asesoría humana antes de decidir si comprar o cotizar

**RF relacionados:** RF-FU-004  
**RNF relacionados:** RNF-USE-003 (validación de email)  
**Actor:** GUEST, CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Captura leads que requieren consultoría; reduce abandono por dudas técnicas.  
**Precondiciones:**

- El FU está en `BORRADOR` con al menos 1 ítem.
- El usuario proporciona un email válido (GUEST) o tiene sesión activa (CUSTOMER).

**Postcondiciones:**

- El FU transiciona a `CONSULTA` (`FU-T-02`).
- La consulta aparece en la cola de SELLER (`MOD-CON-01`).
- Se muestra mensaje "Tu consulta fue enviada".

**Flujo resumido:**

1. Usuario hace click en "Solicitar Consulta".
2. Sistema solicita confirmación.
3. El FU transiciona a `CONSULTA` y queda visible para SELLER.

**Observaciones:**

- La asignación a un SELLER específico es manual (RN-CONSULTA-ASSIGN-01).
- Si el email de GUEST es inválido, se retorna 422.

---

#### HU-FU-005 — Generar cotización formal

**Como** CUSTOMER autenticado  
**Quiero** convertir mi Formato Único en una cotización formal con PDF  
**Para** compartir la propuesta comercial con mi empresa y tener precios congelados por 15 días

**RF relacionados:** RF-FU-005  
**RNF relacionados:** RNF-PERF-002 (PDF < 3s), RNF-INT-001 (atomicidad FSM), RNF-INT-002 (snapshot de precios)  
**Actor:** CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Formaliza la propuesta B2B; habilita aprobación interna del cliente.  
**Precondiciones:**

- El usuario tiene sesión CUSTOMER activa.
- El FU está en `BORRADOR` o `RESUELTA` con al menos 1 ítem.
- Todos los ítems tienen stock suficiente.

**Postcondiciones:**

- El FU transiciona a `COTIZACIÓN` (`FU-T-03` o `FU-T-07`).
- Se fija `price_at_time` para cada ítem (inmutable).
- Se genera PDF con vigencia de 15 días.
- Se inicia countdown de expiración.

**Flujo resumido:**

1. Usuario hace click en "Generar Cotización".
2. Sistema valida stock y confirma transición.
3. Se genera PDF y se fija `expires_at = now + 15 días`.
4. Usuario puede descargar el PDF inmediatamente.

**Observaciones:**

- Si la generación de PDF falla tras fijar el estado, la transición se revierte (transacción atómica).
- Requiere autenticación CUSTOMER (GUEST no puede cotizar, RN-FU-01).

---

#### HU-FU-006 — Iniciar checkout (convertir a pedido)

**Como** usuario con productos en mi Formato Único  
**Quiero** convertir mi lista en un pedido formal para proceder al pago  
**Para** completar mi compra

**RF relacionados:** RF-FU-006  
**RNF relacionados:** RNF-INT-001 (atomicidad), RNF-INT-002 (snapshot de precios)  
**Actor:** GUEST, CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Convierte intención de compra en transacción formal.  
**Precondiciones:**

- El FU tiene al menos 1 ítem con stock suficiente.
- Si viene de `COTIZACIÓN`, debe estar vigente.

**Postcondiciones:**

- El FU transiciona a `PEDIDO` (`FU-T-04` o `FU-T-09`).
- Se crea un `Order` en estado `PENDING_PAYMENT`.
- Se navega al flujo de checkout (`SCR-CHK-001`).

**Flujo resumido:**

1. Usuario hace click en "Ir a Checkout".
2. Sistema valida stock y crea Order.
3. Usuario es redirigido a `/checkout` para completar datos.

**Observaciones:**

- Si la cotización expiró en el instante del click, se redirige al flujo de expiración (no se crea Order inválido).
- Un FU solo puede tener un Order activo simultáneamente (RN-CHK-010).

---

#### HU-FU-007 — Descargar PDF de cotización

**Como** CUSTOMER  
**Quiero** descargar el PDF de mi cotización  
**Para** compartirlo externamente o conservarlo como respaldo

**RF relacionados:** RF-FU-007  
**RNF relacionados:** RNF-PERF-002  
**Actor:** CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Soporte para proceso de aprobación externa del cliente.  
**Precondiciones:**

- El FU está en `COTIZACIÓN` o es histórico con `pdf_url` no nulo.
- El usuario es el owner del FU.

**Postcondiciones:**

- El archivo PDF se descarga en el navegador del usuario.

**Flujo resumido:**

1. Usuario hace click en "Descargar PDF".
2. Sistema retorna el archivo desde el storage.

**Observaciones:**

- Si el archivo fue removido del storage, se retorna 404.

---

#### HU-FU-008 — Regenerar cotización expirada

**Como** CUSTOMER  
**Quiero** reactivar una cotización que venció  
**Para** volver a cotizar con los mismos productos pero a precios actualizados

**RF relacionados:** RF-FU-008  
**RNF relacionados:** RNF-REL-002 (FSM)  
**Actor:** CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Recupera intención de compra que de otro modo se perdería.  
**Precondiciones:**

- El FU está en estado `EXPIRADA`.
- El usuario es el owner.

**Postcondiciones:**

- El FU transiciona a `BORRADOR` (`FU-T-11`).
- Se limpian `expires_at` y `pdf_url`.
- Los precios vuelven a ser dinámicos (se actualizan al valor vigente).

**Flujo resumido:**

1. Usuario hace click en "Regenerar Cotización".
2. Sistema confirma transición.
3. El FU vuelve a `BORRADOR` y el usuario puede editarlo nuevamente.

**Observaciones:**

- Los ítems se preservan; solo los precios se actualizan.

---

#### HU-FU-009 — Resolver conflicto al autenticarse (GUEST → CUSTOMER)

**Como** GUEST que se registra como CUSTOMER  
**Quiero** decidir qué hacer con mi Formato Único si ya tenía uno como GUEST y otro como CUSTOMER  
**Para** no perder mi intención de compra de ninguna de las dos sesiones

**RF relacionados:** RF-FU-009  
**RNF relacionados:** RNF-USE-003 (feedback claro)  
**Actor:** CUSTOMER (en el instante posterior al login)  
**Prioridad:** MVP  
**Valor de negocio:** Evita pérdida silenciosa de datos; mejora experiencia de migración.  
**Precondiciones:**

- Existía un FU de GUEST en `BORRADOR` vinculado a `guest_token`.
- Al autenticarse, el CUSTOMER también tiene un FU en `BORRADOR`.

**Postcondiciones:**

- Un único FU `BORRADOR` resultante.
- El FU del GUEST se elimina.
- Se emite `EVT-FU-008` (variante descarte o combinación).

**Flujo resumido:**

1. Tras login exitoso, sistema detecta conflicto.
2. Se muestra modal con dos opciones: "Usar mi lista anterior" o "Combinar listas".
3. Según la elección, se descarta o combinan los ítems.

**Observaciones:**

- Si solo existe uno de los dos FU, la migración es automática sin modal (AUTO-FU-003).
- Si la combinación supera stock disponible, se agrega con la cantidad máxima y se notifica.

---

#### HU-FU-010 — Consultar historial de Formatos Únicos

**Como** CUSTOMER autenticado  
**Quiero** ver todos mis Formatos Únicos históricos (cotizaciones) , que no han llegado a ser Pedidos, mediante el botón "Mis cotizaciones"
**Para** hacer seguimiento pre-venta y reutilizar listas anteriores

**RF relacionados:** RF-FU-010  
**RNF relacionados:** RNF-SEC-001 (RLS — solo ve los suyos)  
**Actor:** CUSTOMER  
**Prioridad:** MVP+  
**Valor de negocio:** Autoservicio; reduce carga de soporte.  
**Precondiciones:**

- Sesión CUSTOMER activa.

**Postcondiciones:**

- Se muestra listado filtrable de FU históricos del CUSTOMER.

**Flujo resumido:**

1. Usuario accede a `/cuenta/formatos`.
2. Sistema retorna todos los FU donde `owner_id = user_id`.
3. Usuario puede filtrar por estado y ver detalle.

**Observaciones:**

- RLS garantiza que solo ve los suyos (RNF-SEC-001).



---

#### HU-FU-011 — Reintentar pedido tras cancelación

**Como** usuario cuyo pago fue rechazado o canceló un pedido  
**Quiero** reintentar el pago sin perder los productos que había seleccionado  
**Para** no tener que reconstruir mi lista desde cero

**RF relacionados:** RF-FU-011  
**RNF relacionados:** RNF-REL-002 (FSM), RNF-DIS-001 (degradación graceful)  
**Actor:** GUEST, CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Recupera ventas que de otro modo se perderían por fricción de pago.  
**Precondiciones:**

- El Order anterior está en estado `CANCELLED`.
- El Formato Único asociado aún existe.

**Postcondiciones:**

- El FU transiciona a `BORRADOR` (`FU-T-14`).
- Los ítems se preservan.
- El Order anterior permanece `CANCELLED` como histórico.
- El usuario aterriza en `SCR-FU-001` para reintentar.

**Flujo resumido:**

1. Desde la pantalla de error de pago, usuario hace click en "Reintentar pago".
2. Sistema revierte el FU a `BORRADOR` preservando ítems.
3. Usuario puede revisar y volver a intentar checkout.

**Observaciones:**

- El Order anterior no se modifica; permanece como histórico inmutable.
- Esta HU comparte caso de uso con MOD-CHK-01 (UC-CHK-004).

---

#### HU-FU-012 — Consultar historial de Pedidos

**Como** CUSTOMER autenticado  
**Quiero** ver todos mis  Pedidos, mediante el botón "Mis pedidos"
**Para** hacer seguimiento post-venta y filtrar los pedidos realizados

**RF relacionados:** RF-FU-012  
**RNF relacionados:** RNF-SEC-001 (RLS — solo ve los suyos)  
**Actor:** CUSTOMER  
**Prioridad:** MVP+  
**Valor de negocio:** Autoservicio; reduce carga de soporte.  
**Precondiciones:**

- Sesión CUSTOMER activa.

**Postcondiciones:**

- Se muestra listado filtrable de Pedidos del CUSTOMER.

**Flujo resumido:**

1. Usuario accede a `/cuenta/formatos`.
2. Sistema retorna todos los Pedidos donde `owner_id = user_id`.
3. Usuario puede filtrar por fecha y ver detalle.

**Observaciones:**

- RLS garantiza que solo ve los suyos (RNF-SEC-001).

---

#### HU-FU-013 — Cancelar cotización vigente

**Como** CUSTOMER con una cotización activa
**Quiero** poder cancelarla antes de que expire y volver a mi Formato Único editable
**Para** seguir agregando productos que decidí comprar, sin esperar 15 días

**RF relacionados:** RF-FU-020
**RNF relacionados:** RNF-SEC-001 (solo el dueño puede cancelar)
**Actor:** CUSTOMER
**Prioridad:** MVP+
**Valor de negocio:** Evita que el cliente abandone la compra por fricción — hoy, generar una cotización bloquea silenciosamente el carrito hasta que expira o se compra tal cual.
**Precondiciones:**

- Sesión CUSTOMER activa.
- FU en estado `COTIZACIÓN`, perteneciente al actor.

**Postcondiciones:**

- El FU transiciona a `BORRADOR` (`FU-T-15`).
- Los ítems se preservan; el precio congelado se libera (vuelve a ser dinámico).
- El `pdf_url` de la cotización cancelada se invalida.

**Flujo resumido:**

1. Desde "Mis Cotizaciones" o el detalle del FU, usuario hace clic en "Cancelar cotización".
2. Sistema muestra confirmación explicando que se pierde el precio congelado.
3. Usuario confirma; sistema revierte el FU a `BORRADOR` preservando ítems.
4. Usuario puede seguir agregando productos al mismo Formato Único.

**Observaciones:**

- Distinta de HU-FU-008 (regenerar cotización *expirada*): esta aplica sobre una cotización todavía vigente, a voluntad del usuario.
- Requiere confirmación explícita en la UI por ser una acción que pierde el precio congelado.

---

#### HU-FU-014 — Recomprar desde el historial (Widget de Recompra)

**Como** CUSTOMER B2B con cotizaciones cerradas en mi historial
**Quiero** reutilizar los productos de una cotización anterior en mi borrador actual
**Para** agilizar una recompra recurrente sin reconstruir el pedido desde cero

**RF relacionados:** RF-FU-021
**RNF relacionados:** RNF-SEC-001
**Actor:** CUSTOMER
**Prioridad:** MVP+
**Valor de negocio:** Acelera el ciclo de recompra B2B, un patrón de uso frecuente en clientes corporativos recurrentes.
**Precondiciones:**
- Sesión CUSTOMER activa, con al menos una cotización cerrada en su historial (`hasHistory = true`).

**Postcondiciones:**
- El borrador activo queda actualizado con los ítems de la cotización histórica (reemplazados o combinados, según la acción elegida).

**Flujo resumido:**
1. Usuario ve el Widget de Recompra en `/formatos` con sus últimas 3 cotizaciones cerradas.
2. Elige "Reemplazar Borrador" (con confirmación, ya que descarta lo que tenía) o "Combinar con Borrador" (suma cantidades de productos repetidos).
3. El sistema actualiza el borrador activo y confirma con un mensaje de éxito.

**Observaciones:**
- Los precios se recalculan con el valor **actual** del catálogo, no con el precio congelado de la cotización original.
- Productos descontinuados o sin stock se omiten sin bloquear el resto de la operación.

---

### 2.3 Módulo Checkout (MOD-CHK-01)

#### HU-CHK-001 — Completar datos de envío y facturación

**Como** usuario en proceso de checkout  
**Quiero** ingresar mis datos de contacto, documento y dirección de envío  
**Para** que el sistema pueda emitir un comprobante válido y coordinar el despacho

**RF relacionados:** RF-CHK-001  
**RNF relacionados:** RNF-USE-003 (validaciones inline)  
**Actor:** GUEST, CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Reduce abandono de checkout por fricción de datos.  
**Precondiciones:**

- El FU transicionó a `PEDIDO`.
- Existe un `Order` en `PENDING_PAYMENT`.

**Postcondiciones:**

- El Order tiene `shipping_address`, `dni_or_ruc`, `document_type` válidos.
- El sistema calcula automáticamente el costo de envío.

**Flujo resumido:**

1. Usuario completa formulario de contacto, documento y dirección.
2. Sistema valida en tiempo real (DNI 8 dígitos, RUC 11 dígitos, email RFC 5322).
3. Al completar dirección, se calcula automáticamente el costo de envío.

**Observaciones:**

- Validaciones inline con mensajes específicos por campo (RNF-USE-003).
- Si es CUSTOMER, algunos datos pueden pre-llenarse desde el perfil.

---

#### HU-CHK-002 — Ver costo de envío calculado

**Como** usuario en checkout  
**Quiero** ver el costo de envío antes de confirmar el pago  
**Para** conocer el total real a pagar y decidir si continuar

**RF relacionados:** RF-CHK-002  
**RNF relacionados:** —  
**Actor:** GUEST, CUSTOMER (disparado por sistema)  
**Prioridad:** MVP  
**Valor de negocio:** Transparencia; evita abandono por costos ocultos.  
**Precondiciones:**

- Dirección de envío completa.

**Postcondiciones:**

- El `shipping_cost` se refleja en el total.
- El resumen muestra subtotal + IGV + envío + total.

**Flujo resumido:**

1. Al completar dirección, sistema invoca Shalom Mock.
2. Se actualiza el resumen con costo de envío.
3. Usuario puede cambiar método de envío si hay opciones.

**Observaciones:**

- Si el cálculo falla, se bloquea el checkout (RN-SHP-01).

---

#### HU-CHK-003 — Pagar con MercadoPago

**Como** usuario en checkout  
**Quiero** pagar mi pedido usando MercadoPago  
**Para** completar la transacción de forma segura

**RF relacionados:** RF-CHK-003  
**RNF relacionados:** RNF-DIS-001 (degradación graceful ante fallos de pasarela)  
**Actor:** GUEST, CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Conversión final del funnel.  
**Precondiciones:**

- Todos los datos de checkout son válidos.
- El costo de envío está calculado.

**Postcondiciones:**

- Se crea preferencia de pago en MercadoPago.
- Usuario es redirigido a la interfaz de MP.
- Se emite `EVT-CHK-001 PagoIniciado`.

**Flujo resumido:**

1. Usuario hace click en "Pagar ahora".
2. Sistema crea preferencia en MP Sandbox.
3. Usuario es redirigido a URL de MP para completar pago.

**Observaciones:**

- Si MP no responde, se retorna 502 con mensaje claro.
- El Order permanece en `PENDING_PAYMENT` hasta webhook de confirmación.

---

#### HU-CHK-004 — Recibir confirmación de pago exitoso

**Como** usuario que completó el pago  
**Quiero** ver la confirmación de que mi pago fue recibido  
**Para** tener certeza de que mi pedido está en proceso

**RF relacionados:** RF-CHK-004  
**RNF relacionados:** RNF-SEC-003 (idempotencia), RNF-PERF-004 (latencia webhook < 2s)  
**Actor:** Sistema (MercadoPago dispara)  
**Prioridad:** MVP  
**Valor de negocio:** Cierra el ciclo de confianza transaccional.  
**Precondiciones:**

- MercadoPago envía webhook con `status=approved`.
- La firma HMAC es válida.
- El `event_id` no fue procesado previamente.

**Postcondiciones:**

- El Order transiciona a `PAID` (`ORD-T-02`).
- El FU transiciona a `CONFIRMADO` (`FU-T-12`).
- Se encola email de confirmación.

**Flujo resumido:**

1. MercadoPago envía webhook a `/api/webhooks/mercadopago`.
2. Sistema valida firma y idempotencia.
3. Se actualizan estados y se encola notificación.

**Observaciones:**

- Si el webhook se repite, se retorna 200 sin reprocesar (RNF-SEC-003).
- Esta HU no tiene actor humano; es disparada por sistema externo.

---

#### HU-CHK-005 — Recibir notificación de pago fallido

**Como** usuario cuyo pago fue rechazado  
**Quiero** saber qué ocurrió con mi intento de pago  
**Para** decidir si reintentar o cancelar

**RF relacionados:** RF-CHK-005  
**RNF relacionados:** RNF-DIS-001  
**Actor:** Sistema (MercadoPago) o GUEST/CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Claridad para recuperación de carritos abandonados.  
**Precondiciones:**

- MercadoPago envía webhook con `status=rejected`/`cancelled`, o usuario cancela manualmente.

**Postcondiciones:**

- El Order transiciona a `CANCELLED` (`ORD-T-03`).
- El FU transiciona a `CANCELADO` (`FU-T-13`).
- Se registra `cancellation_reason`.
- Se muestra pantalla de error con opción de reintento.

**Flujo resumido:**

1. Sistema recibe webhook o acción de cancelación.
2. Se actualizan estados.
3. Usuario es redirigido a `/checkout/error` con mensaje claro.

**Observaciones:**

- El usuario puede reintentar vía HU-FU-011.

---

#### HU-CHK-006 — Consultar estado de mi pedido

**Como** usuario que completó un checkout  
**Quiero** ver el estado actual de mi pedido  
**Para** saber si fue confirmado, está pendiente o fue cancelado

**RF relacionados:** RF-CHK-006  
**RNF relacionados:** RNF-SEC-001 (RLS), RNF-SEC-007 (acceso vía orderToken opaco)  
**Actor:** GUEST (vía `orderToken`), CUSTOMER (vía sesión)  
**Prioridad:** MVP  
**Valor de negocio:** Reduce ansiedad post-compra y contactos de soporte.  
**Precondiciones:**

- GUEST tiene `orderToken` válido en URL.
- CUSTOMER tiene sesión activa y es owner del Order.

**Postcondiciones:**

- Se muestra detalle del Order con estado actual.

**Flujo resumido:**

1. Usuario accede a `/checkout/confirmacion/[orderToken]` o vía menú de cuenta.
2. Sistema valida token o sesión.
3. Se muestra estado del pedido.

**Observaciones:**

- GUEST solo puede acceder vía orderToken (IDs opacos, RN-CHK-007).
- RLS garantiza que CUSTOMER solo ve sus pedidos.

---

#### HU-CHK-007 — Recibir email de confirmación

**Como** usuario que completó un pago exitoso  
**Quiero** recibir un email con el detalle de mi pedido  
**Para** tener un comprobante persistente fuera del sistema

**RF relacionados:** RF-CHK-007  
**RNF relacionados:** —  
**Actor:** Sistema  
**Prioridad:** MVP  
**Valor de negocio:** Canal persistente de comprobante transaccional.  
**Precondiciones:**

- El Order está en `PAID`.

**Postcondiciones:**

- Email enviado con detalle del pedido y `orderToken`.
- Se emite `EVT-CHK-004 EmailConfirmacionEnviado`.

**Flujo resumido:**

1. Tras confirmación de pago, sistema encola email.
2. Servicio de notificaciones intenta envío hasta 3 veces con backoff.
3. Fallo de email no revierte la confirmación de pago.

**Observaciones:**

- Esta HU es automática; no requiere acción del usuario.

---

#### HU-CHK-008 — Cancelar pedido antes de confirmar

**Como** usuario con un pedido pendiente de pago  
**Quiero** cancelar mi pedido si cambié de opinión  
**Para** no ser cobrado y liberar el Formato Único

**RF relacionados:** RF-CHK-008  
**RNF relacionados:** RNF-REL-002 (FSM)  
**Actor:** GUEST, CUSTOMER  
**Prioridad:** MVP  
**Valor de negocio:** Control del usuario sobre su intención de compra.  
**Precondiciones:**

- El Order está en `PENDING_PAYMENT`.

**Postcondiciones:**

- El Order transiciona a `CANCELLED` (`ORD-T-03`).
- El FU transiciona a `CANCELADO` (`FU-T-13`).
- Se registra `cancelled_by` y `cancellation_reason`.

**Flujo resumido:**

1. Usuario hace click en "Cancelar pedido" en la pantalla de confirmación.
2. Sistema solicita confirmación.
3. Se actualizan estados.

**Observaciones:**

- Si el webhook de pago ya confirmó el pago (condición de carrera), prevalece el pago.
- Desde el estado `CANCELADO`, el usuario puede reintentar (HU-FU-011).

---

### 2.4 Módulo Consulta Pre-Venta (MOD-CON-01)

#### HU-CON-001 — Ver cola de consultas pendientes

**Como** SELLER  
**Quiero** ver todas las consultas pre-venta pendientes (asignadas y sin asignar)  
**Para** priorizar mi trabajo y atender leads rápidamente

**RF relacionados:** RF-CON-001  
**RNF relacionados:** —  
**Actor:** SELLER  
**Prioridad:** MVP  
**Valor de negocio:** Maximiza tasa de respuesta; reduce fuga de leads.  
**Precondiciones:**

- Sesión SELLER activa.

**Postcondiciones:**

- Se muestra listado filtrable de FU en estado `CONSULTA`.

**Flujo resumido:**

1. SELLER accede a `/vendedor/consultas`.
2. Sistema retorna todos los FU en `CONSULTA`.
3. SELLER puede filtrar por asignación y fecha.

**Observaciones:**

- No hay filtro de propiedad: todas las consultas son visibles para todo SELLER.

---

#### HU-CON-002 — Tomar (asignarse) una consulta

**Como** SELLER  
**Quiero** asignarme una consulta de la cola  
**Para** ser el responsable de atenderla y evitar que otro SELLER la tome

**RF relacionados:** RF-CON-002  
**RNF relacionados:** RNF-REL-002 (bloqueo optimista)  
**Actor:** SELLER  
**Prioridad:** MVP  
**Valor de negocio:** Responsabilidad clara; evita trabajo duplicado.  
**Precondiciones:**

- La consulta no tiene SELLER asignado.
- Sesión SELLER activa.

**Postcondiciones:**

- El `seller_id` del FU se fija al SELLER actual.
- Se emite `EVT-CON-001 ConsultaAsignada`.
- La consulta desaparece de la cola "sin asignar" para otros SELLERs.

**Flujo resumido:**

1. SELLER hace click en "Atender" junto a una consulta sin asignar.
2. Sistema fija `seller_id` con bloqueo optimista.
3. Si otro SELLER la tomó en el mismo instante, se retorna 409.

**Observaciones:**

- La asignación es manual (RN-CONSULTA-ASSIGN-01); no hay round-robin.

---

#### HU-CON-003 — Responder una consulta asignada

**Como** SELLER asignado a una consulta  
**Quiero** redactar y enviar una respuesta de asesoría  
**Para** ayudar al cliente a decidir si cotizar o comprar

**RF relacionados:** RF-CON-003  
**RNF relacionados:** —  
**Actor:** SELLER (asignado)  
**Prioridad:** MVP  
**Valor de negocio:** Convierte consultas en cotizaciones/ventas.  
**Precondiciones:**

- El SELLER está asignado a la consulta (`seller_id = actor_id`).
- La consulta está en estado `CONSULTA`.

**Postcondiciones:**

- El FU transiciona a `RESUELTA` (`FU-T-05`).
- Se registra `consultant_note`.
- Se emite `EVT-FU-012 ConsultaResuelta`.
- El cliente puede ver la respuesta al volver a `/formato`.

**Flujo resumido:**

1. SELLER accede a `/vendedor/consultas/[id]`.
2. Redacta respuesta en el editor.
3. Hace click en "Enviar respuesta" y confirma.
4. El FU transiciona a `RESUELTA`.

**Observaciones:**

- Solo el SELLER asignado puede responder (RN-CON-002); otros reciben 403.
- El canal de notificación al cliente queda pendiente de definir.

---

#### HU-CON-004 — Filtrar y buscar consultas

**Como** SELLER  
**Quiero** filtrar las consultas por asignación, fecha o estado  
**Para** priorizar mi carga de trabajo

**RF relacionados:** RF-CON-004  
**RNF relacionados:** —  
**Actor:** SELLER  
**Prioridad:** MVP+  
**Valor de negocio:** Eficiencia operativa.  
**Precondiciones:**

- Sesión SELLER activa.

**Postcondiciones:**

- El listado se refina según criterios.

**Flujo resumido:**

1. SELLER aplica filtros en la cola de consultas.
2. Sistema retorna resultados filtrados.

**Observaciones:**

- Filtros disponibles: "todas" / "mías", rango de fechas.

---

### 2.5 Módulo Cotización vista SELLER (MOD-COT-01)

#### HU-COT-001 — Ver listado de cotizaciones

**Como** SELLER  
**Quiero** ver todas las cotizaciones generadas por clientes B2B  
**Para** tener visibilidad del pipeline comercial y priorizar seguimiento

**RF relacionados:** RF-COT-001  
**RNF relacionados:** —  
**Actor:** SELLER  
**Prioridad:** MVP  
**Valor de negocio:** Reduce pérdida de ventas por cotizaciones olvidadas.  
**Precondiciones:**

- Sesión SELLER activa.

**Postcondiciones:**

- Se muestra listado filtrable de FU en estados `COTIZACIÓN`, `EXPIRADA`, `PEDIDO`, `CONFIRMADO`.

**Flujo resumido:**

1. SELLER accede a `/vendedor/cotizaciones`.
2. Sistema retorna cotizaciones con estado y vigencia.
3. SELLER puede filtrar por estado y fecha.

**Observaciones:**

- No hay asignación de cotización a SELLER específico; visibilidad compartida.

---

#### HU-COT-002 — Ver detalle de una cotización

**Como** SELLER  
**Quiero** ver el detalle completo de una cotización específica  
**Para** dar seguimiento informado antes de contactar al cliente

**RF relacionados:** RF-COT-002  
**RNF relacionados:** —  
**Actor:** SELLER  
**Prioridad:** MVP  
**Valor de negocio:** Mejora calidad del seguimiento comercial.  
**Precondiciones:**

- Sesión SELLER activa.

**Postcondiciones:**

- Se muestra detalle completo: cliente, ítems, precios fijados, vigencia, historial, PDF.

**Flujo resumido:**

1. SELLER hace click en una fila de la tabla de cotizaciones.
2. Sistema muestra vista de detalle.

**Observaciones:**

- El SELLER no puede modificar ni extender la cotización (solo lectura).

---

#### HU-COT-003 — Descargar PDF de cotización (vista SELLER)

**Como** SELLER  
**Quiero** descargar el PDF de una cotización  
**Para** tener el mismo documento que recibió el cliente y dar soporte telefónico

**RF relacionados:** RF-COT-003  
**RNF relacionados:** RNF-PERF-002  
**Actor:** SELLER  
**Prioridad:** MVP  
**Valor de negocio:** Soporte comercial informado.  
**Precondiciones:**

- La cotización tiene `pdf_url` no nulo.

**Postcondiciones:**

- El PDF se descarga en el navegador del SELLER.

**Flujo resumido:**

1. SELLER hace click en "Descargar PDF" en el detalle.
2. Sistema retorna el archivo desde el storage.

**Observaciones:**

- Capacidad técnica compartida con RF-FU-007 (OBS-002 del documento de RFs).

---

### 2.6 Módulo Panel SELLER (MOD-SEL-01)

#### HU-SEL-001 — Ver listado de productos con stock

**Como** SELLER  
**Quiero** ver el stock actual de todos los productos con alertas visuales  
**Para** identificar rápidamente qué productos necesitan reposición

**RF relacionados:** RF-SEL-001  
**RNF relacionados:** —  
**Actor:** SELLER  
**Prioridad:** MVP  
**Valor de negocio:** Previene ventas fallidas por stock desactualizado.  
**Precondiciones:**

- Sesión SELLER activa.

**Postcondiciones:**

- Se muestra listado de productos con stock actual y badges de alerta.

**Flujo resumido:**

1. SELLER accede a `/vendedor/stock`.
2. Sistema retorna productos con stock y badges cuando `stock < stock_min_threshold`.

**Observaciones:**

- SELLER puede buscar y ordenar la tabla.

---

#### HU-SEL-002 — Actualizar stock de un producto

**Como** SELLER  
**Quiero** ajustar el stock de un producto tras conteo físico  
**Para** mantener el inventario sincronizado con la realidad

**RF relacionados:** RF-SEL-002  
**RNF relacionados:** RNF-USE-003 (validación inline)  
**Actor:** SELLER  
**Prioridad:** MVP  
**Valor de negocio:** Condición necesaria para que `RN-CHECKOUT-01` funcione correctamente.  
**Precondiciones:**

- Sesión SELLER activa.
- El producto existe.

**Postcondiciones:**

- `Product.stock` se actualiza.
- Se recalcula el badge en el catálogo público (AUTO-CAT-001).
- Se emite `EVT-SEL-001 StockActualizado`.

**Flujo resumido:**

1. SELLER edita el stock inline en la tabla.
2. Sistema valida que el valor sea ≥ 0.
3. SELLER hace click en "Guardar".
4. Se actualiza el stock y se recalculan badges.

**Observaciones:**

- SELLER no puede modificar precio, descripción ni imágenes (solo ADMIN).
- Valores negativos retornan 422 (RN-SEL-001).

---

#### HU-SEL-003 — Configurar umbral mínimo de stock por producto

**Como** SELLER  
**Quiero** ajustar el umbral de alerta de stock bajo para productos específicos  
**Para** que las alertas reflejen la rotación real de cada producto

**RF relacionados:** RF-SEL-003  
**RNF relacionados:** —  
**Actor:** SELLER  
**Prioridad:** MVP+  
**Valor de negocio:** Alertas más precisas; reduce falsas alarmas.  
**Precondiciones:**

- Sesión SELLER activa.
- El producto existe.

**Postcondiciones:**

- `Product.stock_min_threshold` se actualiza.
- Se emite `EVT-SEL-002 UmbralStockActualizado`.

**Flujo resumido:**

1. SELLER edita el umbral inline en la tabla.
2. Sistema valida que el valor sea ≥ 0.
3. SELLER hace click en "Guardar umbral".
4. Se actualiza el umbral para ese producto.

**Observaciones:**

- **Decisión de reconciliación INC-001:** SELLER configura umbral por producto, sobreescribiendo el default global de ADMIN. Si el producto no tiene umbral específico, se usa `SystemConfig.default_stock_min_threshold`.

---

#### HU-SEL-004 — Ver cola de pedidos listos para envío

**Como** SELLER  
**Quiero** ver los pedidos pagados pendientes de despacho  
**Para** priorizar mi trabajo de logística

**RF relacionados:** RF-SEL-004  
**RNF relacionados:** —  
**Actor:** SELLER  
**Prioridad:** MVP  
**Valor de negocio:** Asegura que ningún pedido pagado quede sin despachar.  
**Precondiciones:**

- Sesión SELLER activa.
- Existen pedidos en estado `READY_TO_SHIP`.

**Postcondiciones:**

- Se muestra listado de pedidos pendientes, ordenable por antigüedad.

**Flujo resumido:**

1. SELLER accede a `/vendedor/pedidos`.
2. Sistema retorna pedidos en `READY_TO_SHIP`.
3. SELLER puede filtrar entre pendientes y despachados.

**Observaciones:**

- **Decisión de reconciliación:** Procesamiento individual inmediato (RN-SHP-01), sin lógica de lotes.

---

#### HU-SEL-005 — Generar guía de envío para un pedido

**Como** SELLER  
**Quiero** generar una guía de envío para un pedido pagado  
**Para** formalizar el despacho y dar seguimiento al cliente

**RF relacionados:** RF-SEL-005  
**RNF relacionados:** —  
**Actor:** SELLER  
**Prioridad:** MVP  
**Valor de negocio:** Trazabilidad de envíos; base para resolución de disputas.  
**Precondiciones:**

- El pedido está en `READY_TO_SHIP`.
- Sesión SELLER activa.

**Postcondiciones:**

- El pedido transiciona a `SHIPPED` (`ORD-T-06`).
- Se crea `ShippingGuide` con código de seguimiento mock.
- Se emite `EVT-SEL-003 GuiaGenerada`.

**Flujo resumido:**

1. SELLER hace click en un pedido pendiente.
2. Completa formulario de guía (peso, bultos, observaciones).
3. Hace click en "Generar guía" y confirma.
4. Se muestra código de seguimiento.

**Observaciones:**

- Shalom está mockeado para MVP; retorna tracking code hardcoded.
- Si el pedido ya tiene guía, se retorna 409 (doble click).

---

#### HU-SEL-006 — Ver historial de pedidos despachados

**Como** SELLER  
**Quiero** ver los pedidos que ya despaché  
**Para** tener trazabilidad de mi trabajo operativo

**RF relacionados:** RF-SEL-006  
**RNF relacionados:** —  
**Actor:** SELLER  
**Prioridad:** MVP+  
**Valor de negocio:** Soporte y auditoría interna.  
**Precondiciones:**

- Sesión SELLER activa.

**Postcondiciones:**

- Se muestra listado de pedidos en estado `SHIPPED`.

**Flujo resumido:**

1. SELLER filtra la cola de pedidos por estado "Despachados".
2. Sistema retorna pedidos en `SHIPPED`.

**Observaciones:**

- Vista filtrada de la misma pantalla de cola, no pantalla separada.

---

### 2.7 Módulo Panel ADMIN (MOD-ADM-01)

#### HU-ADM-001 — Listar usuarios del sistema

**Como** ADMIN  
**Quiero** ver todos los usuarios del sistema filtrados por rol y estado  
**Para** tener gobernanza sobre las identidades con acceso

**RF relacionados:** RF-ADM-001  
**RNF relacionados:** RNF-SEC-002 (MFA obligatorio para ADMIN)  
**Actor:** ADMIN  
**Prioridad:** MVP  
**Valor de negocio:** Gobernanza de acceso.  
**Precondiciones:**

- Sesión ADMIN activa con MFA verificado.

**Postcondiciones:**

- Se muestra listado de usuarios con filtros aplicables.

**Flujo resumido:**

1. ADMIN accede a `/admin/usuarios`.
2. Sistema retorna todos los usuarios.
3. ADMIN puede filtrar por rol y estado.

**Observaciones:**

- Requiere MFA obligatorio (RNF-SEC-002).

---

#### HU-ADM-002 — Crear usuario SELLER o ADMIN

**Como** ADMIN  
**Quiero** crear una cuenta para nuevo personal interno  
**Para** habilitar su acceso al sistema

**RF relacionados:** RF-ADM-002  
**RNF relacionados:** RNF-USE-003 (validación de email único)  
**Actor:** ADMIN  
**Prioridad:** MVP  
**Valor de negocio:** Onboarding controlado de personal.  
**Precondiciones:**

- Sesión ADMIN activa con MFA.
- El email no está registrado previamente.

**Postcondiciones:**

- Se crea `User` con `role ∈ {SELLER, ADMIN}` y `auth_provider = LOCAL`.
- Se emite `EVT-ADM-001 UsuarioCreado`.

**Flujo resumido:**

1. ADMIN hace click en "Crear usuario".
2. Completa modal con email, nombre, rol.
3. Sistema crea el usuario con credenciales iniciales.

**Observaciones:**

- Si el email ya existe, se retorna 409 (RN-ADM-001).
- No se permite autoregistro de SELLER/ADMIN.

---

#### HU-ADM-003 — Suspender un usuario

**Como** ADMIN  
**Quiero** suspender temporalmente el acceso de un usuario  
**Para** revocar privilegios sin destruir su historial

**RF relacionados:** RF-ADM-003  
**RNF relacionados:** RNF-REL-004 (auditoría inmutable)  
**Actor:** ADMIN  
**Prioridad:** MVP  
**Valor de negocio:** Control de acceso reversible.  
**Precondiciones:**

- Sesión ADMIN activa con MFA.
- El usuario target no es el propio ADMIN (RN-ADMIN-01).
- Si el target es ADMIN, deben existir ≥3 ADMINs activos (RN-ADMIN-02).

**Postcondiciones:**

- `User.is_suspended = true`.
- Sesiones activas del usuario se invalidan.
- Se emite `EVT-ADM-002 UsuarioSuspendido`.

**Flujo resumido:**

1. ADMIN hace click en "Suspender" junto al usuario.
2. Sistema confirma y valida reglas (auto-suspensión, mínimo ADMINs).
3. Se actualiza el estado y se invalidan sesiones.

**Observaciones:**

- Si se viola RN-ADMIN-01 o RN-ADMIN-02, se retorna 403 o 409.

---

#### HU-ADM-004 — Eliminar un usuario

**Como** ADMIN  
**Quiero** eliminar permanentemente una cuenta  
**Para** remover accesos cuando la suspensión no es suficiente

**RF relacionados:** RF-ADM-004  
**RNF relacionados:** RNF-REL-004 (integridad referencial)  
**Actor:** ADMIN  
**Prioridad:** MVP  
**Valor de negocio:** Cumplimiento legal o corrección de errores de creación.  
**Precondiciones:**

- Sesión ADMIN activa con MFA.
- Mismas reglas que HU-ADM-003.

**Postcondiciones:**

- El usuario se marca como eliminado (soft-delete: `is_active = false`, `deleted_at` timestamp).
- Se preserva integridad referencial con `AuditLog`, `Order`, `FormatoUnico`.
- Se emite `EVT-ADM-003 UsuarioEliminado`.

**Flujo resumido:**

1. ADMIN hace click en "Eliminar".
2. Sistema solicita doble confirmación.
3. Se ejecuta soft-delete preservando historial.

**Observaciones:**

- **Decisión de reconciliación INC-006:** Soft-delete obligatorio (no hard-delete) para preservar integridad referencial.

---

#### HU-ADM-005 — Gestionar catálogo completo de productos

**Como** ADMIN  
**Quiero** crear, editar y desactivar productos del catálogo  
**Para** mantener la oferta comercial actualizada

**RF relacionados:** RF-ADM-005  
**RNF relacionados:** RNF-INT-002 (snapshot de precios no retroactivo)  
**Actor:** ADMIN  
**Prioridad:** MVP  
**Valor de negocio:** Control total de la oferta comercial.  
**Precondiciones:**

- Sesión ADMIN activa con MFA.

**Postcondiciones:**

- `Product` creado/editado/desactivado.
- Se emite `EVT-ADM-004` (variante según operación).
- Los cambios se reflejan en el catálogo público (AUTO-CAT-002).

**Flujo resumido:**

1. ADMIN accede a `/admin/productos`.
2. Crea nuevo producto o edita existente.
3. Sistema valida campos (SKU único, slug único, precio > 0).
4. Se actualiza el catálogo.

**Observaciones:**

- Cambios de precio no afectan cotizaciones ya emitidas (RN-CHECKOUT-02).
- SELLER no puede editar precios, solo stock.

---

#### HU-ADM-006 — Ver métricas de ventas

**Como** ADMIN  
**Quiero** ver gráficos de revenue y productos más vendidos  
**Para** tomar decisiones de negocio basadas en datos

**RF relacionados:** RF-ADM-006  
**RNF relacionados:** —  
**Actor:** ADMIN  
**Prioridad:** MVP+  
**Valor de negocio:** Soporte a decisiones estratégicas.  
**Precondiciones:**

- Sesión ADMIN activa con MFA.
- Existen pedidos en estados `PAID`/`SHIPPED`.

**Postcondiciones:**

- Se muestran gráficos de revenue por período y tabla de productos más vendidos.

**Flujo resumido:**

1. ADMIN accede a `/admin/metricas/ventas`.
2. Sistema consulta vistas materializadas `analytics.*`.
3. ADMIN puede filtrar por rango de fechas.

**Observaciones:**

- Los datos son agregados; PII hasheado para privacidad.

---

#### HU-ADM-007 — Configurar parámetros globales del sistema

**Como** ADMIN  
**Quiero** ajustar parámetros como el umbral de stock global o la vigencia de cotizaciones  
**Para** centralizar gobernanza técnica-operativa

**RF relacionados:** RF-ADM-007  
**RNF relacionados:** —  
**Actor:** ADMIN  
**Prioridad:** MVP+  
**Valor de negocio:** Agilidad operativa sin dependencia de desarrollo.  
**Precondiciones:**

- Sesión ADMIN activa con MFA.

**Postcondiciones:**

- `SystemConfig` actualizado.
- Se emite `EVT-ADM-005 ConfiguracionActualizada`.

**Flujo resumido:**

1. ADMIN accede a `/admin/configuracion`.
2. Modifica parámetros globales.
3. Sistema valida rangos válidos.
4. Se guardan los cambios.

**Observaciones:**

- **Decisión de reconciliación INC-001:** ADMIN configura `default_stock_min_threshold` global, aplicable a productos nuevos. SELLER puede sobreescribirlo por producto.
- Cambios de `quote_validity_days` solo afectan nuevas cotizaciones (no retroactivo).

---

#### HU-ADM-008 — Exportar datos del sistema

**Como** ADMIN  
**Quiero** exportar datos sensibles del sistema en formato CSV  
**Para** generar reportes externos o respaldos

**RF relacionados:** RF-ADM-008  
**RNF relacionados:** RNF-SEC-002 (MFA step-up)  
**Actor:** ADMIN  
**Prioridad:** MVP+  
**Valor de negocio:** Reportes y respaldo.  
**Precondiciones:**

- Sesión ADMIN activa con MFA.
- Re-autenticación MFA step-up inmediata previa.

**Postcondiciones:**

- Archivo CSV generado y descargado.
- Se emite `EVT-ADM-006 ExportacionDatosRealizada`.
- Se registra en `AuditLog`.

**Flujo resumido:**

1. ADMIN hace click en "Exportar datos".
2. Sistema solicita re-autenticación MFA (step-up).
3. Tras verificación, se genera y descarga el CSV.

**Observaciones:**

- **Decisión de reconciliación INC-005:** Formato CSV para MVP. JSON/Excel postergados a v1.1.
- Sin re-autenticación MFA, se retorna 401 (RN-ADM-002).

---

### 2.8 Módulo Autenticación (MOD-AUT-01)

#### HU-AUT-001 — Iniciar sesión con Google (CUSTOMER)

**Como** cliente potencial  
**Quiero** iniciar sesión con mi cuenta de Google  
**Para** acceder rápidamente sin crear credenciales nuevas

**RF relacionados:** RF-AUT-001  
**RNF relacionados:** RNF-SEC-002 (OAuth seguro)  
**Actor:** CUSTOMER (potencial)  
**Prioridad:** MVP  
**Valor de negocio:** Reduce fricción de conversión.  
**Precondiciones:**

- El usuario tiene cuenta de Google.

**Postcondiciones:**

- Si es primer login: se crea `User` con `auth_provider = GOOGLE`.
- Si ya existe: se autentica.
- Se emite `EVT-AUT-001 SesionIniciada` (y opcionalmente `EVT-AUT-002 UsuarioRegistrado`).
- Si había conflicto de FU, se dispara HU-FU-009.

**Flujo resumido:**

1. Usuario hace click en "Iniciar con Google".
2. Sistema redirige a OAuth de Google.
3. Tras autorización, se crea/auth el usuario y se emite JWT.

**Observaciones:**

- CUSTOMER solo puede autenticarse vía Google (RN-AUT-001); no se permiten credenciales locales.

---

#### HU-AUT-002 — Iniciar sesión local (SELLER/ADMIN)

**Como** personal interno  
**Quiero** iniciar sesión con email y password  
**Para** acceder al panel correspondiente a mi rol

**RF relacionados:** RF-AUT-002  
**RNF relacionados:** RNF-SEC-002 (MFA si aplica)  
**Actor:** SELLER, ADMIN  
**Prioridad:** MVP  
**Valor de negocio:** Autenticación segura de personal interno.  
**Precondiciones:**

- El usuario tiene credenciales locales válidas.
- La cuenta no está suspendida.

**Postcondiciones:**

- Si `mfa_enabled = true`, se redirige a verificación MFA.
- Si no, sesión activa directamente.
- Se emite `EVT-AUT-001 SesionIniciada`.

**Flujo resumido:**

1. Usuario accede a `/auth/login/staff`.
2. Ingresa email y password.
3. Sistema valida y redirige según corresponda.

**Observaciones:**

- SELLER/ADMIN solo pueden autenticarse con credenciales locales (RN-AUT-002).
- Si la cuenta está suspendida, se retorna 403 con mensaje específico (AUTO-AUT-001).

---

#### HU-AUT-003 — Verificar código MFA (TOTP)

**Como** SELLER o ADMIN con MFA habilitado  
**Quiero** ingresar mi código TOTP de 6 dígitos  
**Para** completar el segundo factor de autenticación

**RF relacionados:** RF-AUT-003  
**RNF relacionados:** RNF-SEC-002 (MFA obligatorio para ADMIN)  
**Actor:** SELLER (si habilitado), ADMIN (siempre)  
**Prioridad:** MVP  
**Valor de negocio:** Mitigación de riesgo de cuentas comprometidas.  
**Precondiciones:**

- Primer factor validado (sesión parcial).
- `mfa_enabled = true`.

**Postcondiciones:**

- Sesión completa activa.
- Se emite `EVT-AUT-003 MFAVerificado`.

**Flujo resumido:**

1. Usuario ingresa código de 6 dígitos de su app TOTP.
2. Sistema valida contra `mfa_secret`.
3. Si es válido, se concede sesión completa.

**Observaciones:**

- Para ADMIN, MFA es obligatorio (invariante); sin TOTP no se emite JWT.
- Límite de intentos fallidos pendiente de decisión técnica.

---

#### HU-AUT-004 — Usar código de respaldo MFA

**Como** SELLER o ADMIN sin acceso a mi dispositivo TOTP  
**Quiero** usar uno de mis códigos de respaldo  
**Para** no quedar bloqueado permanentemente

**RF relacionados:** RF-AUT-004  
**RNF relacionados:** —  
**Actor:** SELLER, ADMIN  
**Prioridad:** MVP+  
**Valor de negocio:** Evita bloqueo permanente de cuenta.  
**Precondiciones:**

- Primer factor validado.
- Usuario tiene códigos de respaldo no consumidos.

**Postcondiciones:**

- Sesión completa activa.
- El código de respaldo usado se invalida (uso único).
- Se emite `EVT-AUT-004 CodigoRespaldoUsado`.

**Flujo resumido:**

1. Usuario hace click en "Usar código de respaldo".
2. Ingresa uno de los 10 códigos.
3. Sistema valida y concede acceso.

**Observaciones:**

- Cada código es de un solo uso (RN-AUT-003).
- No hay operación documentada para regenerar códigos (pendiente v1.1).

---

#### HU-AUT-005 — Habilitar MFA (SELLER)

**Como** SELLER  
**Quiero** activar MFA TOTP en mi cuenta  
**Para** reforzar la seguridad de mi acceso

**RF relacionados:** RF-AUT-005  
**RNF relacionados:** —  
**Actor:** SELLER  
**Prioridad:** MVP+  
**Valor de negocio:** Adopción voluntaria de buenas prácticas.  
**Precondiciones:**

- Sesión SELLER activa.
- MFA no habilitado previamente.

**Postcondiciones:**

- `User.mfa_enabled = true`.
- Se generan `mfa_secret` y 10 códigos de respaldo.
- Se emite `EVT-AUT-005 MFAHabilitado`.

**Flujo resumido:**

1. SELLER accede a `/cuenta/seguridad`.
2. Hace click en "Activar MFA".
3. Escanea QR con app TOTP.
4. Verifica con primer código TOTP válido.
5. Sistema muestra los 10 códigos de respaldo (una sola vez).

**Observaciones:**

- MFA es recomendado pero no obligatorio para SELLER (DEC-010).
- ADMIN no necesita esta pantalla porque MFA es obligatorio desde su creación.

---

#### HU-AUT-006 — Cerrar sesión

**Como** usuario autenticado  
**Quiero** cerrar mi sesión explícitamente  
**Para** proteger mi cuenta en dispositivos compartidos

**RF relacionados:** RF-AUT-006  
**RNF relacionados:** RNF-SEC-007 (invalidación segura de sesión)  
**Actor:** CUSTOMER, SELLER, ADMIN  
**Prioridad:** MVP  
**Valor de negocio:** Control básico de seguridad.  
**Precondiciones:**

- Sesión activa.

**Postcondiciones:**

- Sesión invalidada.
- Se emite `EVT-AUT-006 SesionCerrada`.
- Usuario redirigido a estado no autenticado.

**Flujo resumido:**

1. Usuario hace click en "Cerrar sesión" en el menú de cuenta.
2. Sistema invalida token y cookie.
3. Usuario es redirigido al home o login.

**Observaciones:**

- Disponible globalmente en el menú de cuenta.

---

#### HU-AUT-007 — Renovar sesión mediante refresh token

**Como** usuario autenticado (CUSTOMER, SELLER o ADMIN)
**Quiero** que mi sesión se renueve automáticamente mientras estoy activo
**Para** no tener que volver a iniciar sesión cada 60 minutos

**RF relacionados:** RF-AUT-009
**RNF relacionados:** RNF-SEC-001
**Actor:** CUSTOMER, SELLER, ADMIN
**Prioridad:** MVP+
**Valor de negocio:** Reduce fricción y abandono causado por sesiones que expiraban en silencio a mitad de una tarea.
**Precondiciones:**

- El usuario inició sesión previamente y posee un refresh_token válido (cookie httpOnly, no vencido, no revocado).

**Postcondiciones:**

- Se emite un nuevo access_token (JWT, 60 min).
- El refresh_token usado queda revocado; se emite uno nuevo (rotación).
- La sesión continúa activa sin intervención del usuario.

**Flujo resumido:**

1. El frontend recibe un `401` en cualquier petición autenticada.
2. Automáticamente solicita `POST /auth/refresh` (sin intervención del usuario).
3. El sistema valida el refresh_token, lo rota y emite un nuevo access_token.
4. El frontend reintenta la petición original de forma transparente.

**Observaciones:**

- Si el refresh_token también es inválido/expiró, el usuario cae al flujo normal de sesión no autenticada (login) — no se fuerza una redirección desde el interceptor HTTP, eso sigue siendo responsabilidad de las rutas protegidas.
- El logout (HU-AUT-006) revoca el refresh_token server-side, no solo la cookie local.

---

## 3. Matriz de Trazabilidad HU → RF

|HU|RF Primario|RFs Secundarios|RNFs Asociados|
|---|---|---|---|
|HU-CAT-001|RF-CAT-001|—|RNF-PERF-001, RNF-SCAL-001|
|HU-CAT-002|RF-CAT-002|—|RNF-PERF-001|
|HU-CAT-003|RF-CAT-003|—|RNF-REL-002|
|HU-FU-001|RF-FU-001|—|RNF-REL-002|
|HU-FU-002|RF-FU-002|—|RNF-REL-002|
|HU-FU-003|RF-FU-003|—|RNF-REL-002|
|HU-FU-004|RF-FU-004|—|RNF-USE-003|
|HU-FU-005|RF-FU-005|—|RNF-PERF-002, RNF-INT-001, RNF-INT-002|
|HU-FU-006|RF-FU-006|—|RNF-INT-001, RNF-INT-002|
|HU-FU-007|RF-FU-007|—|RNF-PERF-002|
|HU-FU-008|RF-FU-008|—|RNF-REL-002|
|HU-FU-009|RF-FU-009|—|RNF-USE-003|
|HU-FU-010|RF-FU-010|—|RNF-SEC-001|
|HU-FU-011|RF-FU-011|—|RNF-REL-002, RNF-DIS-001|
|HU-CHK-001|RF-CHK-001|—|RNF-USE-003|
|HU-CHK-002|RF-CHK-002|—|—|
|HU-CHK-003|RF-CHK-003|—|RNF-DIS-001|
|HU-CHK-004|RF-CHK-004|—|RNF-SEC-003, RNF-PERF-004|
|HU-CHK-005|RF-CHK-005|—|RNF-DIS-001|
|HU-CHK-006|RF-CHK-006|—|RNF-SEC-001, RNF-SEC-007|
|HU-CHK-007|RF-CHK-007|—|—|
|HU-CHK-008|RF-CHK-008|—|RNF-REL-002|
|HU-CON-001|RF-CON-001|—|—|
|HU-CON-002|RF-CON-002|—|RNF-REL-002|
|HU-CON-003|RF-CON-003|—|—|
|HU-CON-004|RF-CON-004|—|—|
|HU-COT-001|RF-COT-001|—|—|
|HU-COT-002|RF-COT-002|—|—|
|HU-COT-003|RF-COT-003|—|RNF-PERF-002|
|HU-SEL-001|RF-SEL-001|—|—|
|HU-SEL-002|RF-SEL-002|—|RNF-USE-003|
|HU-SEL-003|RF-SEL-003|—|—|
|HU-SEL-004|RF-SEL-004|—|—|
|HU-SEL-005|RF-SEL-005|—|—|
|HU-SEL-006|RF-SEL-006|—|—|
|HU-ADM-001|RF-ADM-001|—|RNF-SEC-002|
|HU-ADM-002|RF-ADM-002|—|RNF-USE-003|
|HU-ADM-003|RF-ADM-003|—|RNF-REL-004|
|HU-ADM-004|RF-ADM-004|—|RNF-REL-004|
|HU-ADM-005|RF-ADM-005|—|RNF-INT-002|
|HU-ADM-006|RF-ADM-006|—|—|
|HU-ADM-007|RF-ADM-007|—|—|
|HU-ADM-008|RF-ADM-008|—|RNF-SEC-002|
|HU-AUT-001|RF-AUT-001|—|RNF-SEC-002|
|HU-AUT-002|RF-AUT-002|—|RNF-SEC-002|
|HU-AUT-003|RF-AUT-003|—|RNF-SEC-002|
|HU-AUT-004|RF-AUT-004|—|—|
|HU-AUT-005|RF-AUT-005|—|—|
|HU-AUT-006|RF-AUT-006|—|RNF-SEC-007|
|HU-AUT-007|RF-AUT-009|RN-AUT-004|RNF-SEC-001|

---

## 4. Observaciones Metodológicas

### OBS-HU-001 — Ausencia deliberada de HUs en MOD-DIS-01 y MOD-SYS-01

Los módulos **MOD-DIS-01** (Integración DISTRIBUTOR) y **MOD-SYS-01** (Sistema Transversal) no generan Historias de Usuario porque:

- **MOD-DIS-01:** El actor es un sistema externo (DISTRIBUTOR), no un usuario humano. Las HU, por definición ("Como [actor], quiero..."), no aplican naturalmente.
- **MOD-SYS-01:** Son funcionalidades automáticas transversales sin actor humano disparador.

**Esto NO es un vacío de trazabilidad.** Los RFs derivados (`RF-DIS-*`, `RF-SYS-*`) tienen Casos de Uso (`UC-DIS-*`) y Casos de Prueba (`TEST-*`) asociados. La decisión metodológica está documentada en OBS-005 del documento de RFs.

### OBS-HU-002 — HUs con actor "Sistema"

Algunas HUs (HU-CHK-004, HU-CHK-005, HU-CHK-007) tienen como actor principal al "Sistema" (disparado por webhooks o jobs automáticos). Esto es consistente con la naturaleza server-to-server de estas operaciones y no constituye una violación del formato de HU, ya que describen el comportamiento esperado del sistema ante eventos externos.

### OBS-HU-003 — Decisiones de reconciliación reflejadas

Las siguientes HUs incorporan decisiones de reconciliación documentadas en `DOC_ALLING_RECONCILIATION_001`:

- **HU-SEL-003:** Refleja INC-001 (jerarquía de umbral de stock).
- **HU-ADM-004:** Refleja INC-006 (soft-delete obligatorio).
- **HU-ADM-007:** Refleja INC-001 (default global de ADMIN).
- **HU-ADM-008:** Refleja INC-005 (formato CSV para MVP).

### OBS-HU-004 — Cobertura de RFs

- **49 HUs** cubren **55 RFs**.
- Los RFs sin HU asociada son aquellos que corresponden a operaciones automáticas o de sistema (RF-SYS-001, RF-SYS-002, RF-DIS-001 a RF-DIS-004), consistentes con OBS-HU-001.
- Todos los RFs de actores humanos (GUEST, CUSTOMER, SELLER, ADMIN) tienen al menos una HU asociada.

---

## 5. Control de Cambios

|Versión|Fecha|Cambio|Estado|
|---|---|---|---|
|1.0.0|30/06/2026|Versión inicial. 49 HUs derivadas de 55 RFs.|Borrador (pendiente VoBo)|

---
## 🆕 EXTENSIONES v1.2 (18 Nuevas Historias de Usuario)

###  HU Transversales (SYS)
**HU-SYS-001: Búsqueda avanzada desde el header**
- **Como** visitante o cliente
- **Quiero** buscar productos filtrando por categoría desde el header
- **Para** encontrar rápidamente lo que necesito sin entrar al catálogo completo.

**HU-SYS-002: Notificaciones en tiempo real**
- **Como** cliente autenticado
- **Quiero** ver un badge con notificaciones pendientes en el header
- **Para** estar al tanto de eventos importantes (cotización por expirar, respuesta de consulta).

**HU-SYS-003: Acceso rápido a favoritos**
- **Como** cliente autenticado
- **Quiero** acceder a mi lista de favoritos desde el header
- **Para** revisar productos de interés rápidamente.

### 🛒 HU Catálogo (CAT)
**HU-CAT-004: Landing page atractiva**
- **Como** visitante
- **Quiero** ver una página principal con imagen destacada y productos promocionales
- **Para** conocer la oferta de Alling rápidamente.

**HU-CAT-005: Exploración por categorías**
- **Como** visitante
- **Quiero** ver una cuadrícula de categorías con cantidad de productos
- **Para** decidir qué sección explorar según disponibilidad.

**HU-CAT-006: Kits de productos pre-armados**
- **Como** cliente B2B
- **Quiero** ver y comprar Kits de productos relacionados
- **Para** adquirir soluciones completas de una sola vez.

**HU-CAT-007: Guardar productos favoritos**
- **Como** cliente autenticado
- **Quiero** marcar productos como favoritos
- **Para** acceder a ellos fácilmente en futuras compras.

**HU-CAT-008: Consulta rápida por Telegram**
- **Como** visitante o cliente
- **Quiero** consultar dudas técnicas de un producto vía Telegram
- **Para** recibir asesoría inmediata sin salir de la plataforma.

### 📦 HU Formato Único (FU)
**HU-FU-002: Dashboard personalizado post-login**
- **Como** cliente autenticado
- **Quiero** ver un panel con mi Formato Único activo y notificaciones al entrar
- **Para** gestionar mis cotizaciones y pedidos desde un solo lugar.

**HU-FU-003: Carga masiva de productos por Excel**
- **Como** cliente B2B
- **Quiero** subir un archivo Excel con SKUs y cantidades
- **Para** poblar mi Formato Único rápidamente sin agregar ítem por ítem.

**HU-FU-004: Descarga de plantilla Excel**
- **Como** cliente B2B
- **Quiero** descargar un archivo de ejemplo para cargar masivamente
- **Para** conocer el formato correcto y evitar errores.

**HU-FU-005: Mapeo dinámico de columnas Excel**
- **Como** cliente B2B con un Excel en formato propio
- **Quiero** mapear mis columnas a "SKU" y "Cantidad"
- **Para** no tener que reformatear mi archivo original.

**HU-FU-006: Resolución de conflictos por Telegram**
- **Como** cliente con productos sin stock en su Formato Único
- **Quiero** consultar por Telegram los productos en conflicto
- **Para** no bloquear el resto de mi cotización.

### 💳 HU Checkout (CHK)
**HU-CHK-002: Datos de facturación pre-llenados**
- **Como** cliente autenticado
- **Quiero** que mis datos de facturación se auto-completen en el checkout
- **Para** agilizar el proceso de pago.

**HU-CHK-003: Pago seguro con Mercado Pago**
- **Como** cliente
- **Quiero** pagar con Mercado Pago (tarjeta, Yape, PagoEfectivo)
- **Para** tener múltiples opciones de pago seguras.

**HU-CHK-004: Confirmación visual de pago**
- **Como** cliente
- **Quiero** ver una pantalla de confirmación tras pagar exitosamente
- **Para** tener certeza de que mi pedido fue procesado.

**HU-CHK-005: Reintento de pago fallido**
- **Como** cliente con pago rechazado
- **Quiero** reintentar el pago desde la pantalla de error
- **Para** no perder mi carrito ni tener que empezar de nuevo.

### 🔐 HU Autenticación (AUT)
**HU-AUT-002: Migración de carrito de Invitado a Cliente**
- **Como** invitado con Formato Único activo
- **Quiero** registrarme durante el checkout sin perder mi carrito
- **Para** vincular mi pedido a una cuenta permanente.
