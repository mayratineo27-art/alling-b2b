# 🤖 Bitácora de Ingeniería de Prompts (Alling B2B)

Este documento registra las instrucciones (prompts) exactas utilizadas para orquestar al agente autónomo de código (Cursor/Cline), garantizando la trazabilidad entre los requerimientos, el ciclo TDD y la arquitectura DevSecOps.

## SPRINT 1: Módulo Formato Único (MOD-FU-01)

### Prompt 1: Inicialización Backend y TDD (Fase RED)
**Fecha:** 06/07/2026
**Objetivo:** Forzar al agente a crear la infraestructura base y la prueba unitaria en rojo para el primer requerimiento, validando que respeta el flujo Backend-First.
**Prompt Empleado:**
Iniciamos el Sprint 1. Lee atentamente tus reglas maestras en el archivo .clinerules. Luego, revisa nuestra Docs/FASE 4_EJECUCION_SCRUM/MATRIZ_TRAZABILIDAD_GLOBAL.md y nuestro Docs/FASE 4_EJECUCION_SCRUM/PLAN_DE_PRUEBAS_TDD_FASTAPI.md.

Tu primera misión es ejecutar el requerimiento RF-FU-001.

Aplica estrictamente el ciclo TDD (RED-GREEN-REFACTOR) que se te ha ordenado:

Crea la estructura de carpetas inicial para el backend en FastAPI (incluyendo backend/app y backend/tests).

Escribe la prueba unitaria en pytest para el RF-FU-001 basándote en el Plan de Pruebas (Fase RED).

Configura el entorno virtual o los archivos mínimos (requirements.txt, pytest.ini) para que la prueba pueda correr.

⚠️ REGLA ESTRICTA: Ejecuta la prueba para confirmar que falla (RED) y DETENTE AHÍ. No escribas la lógica de negocio (Servicios/Rutas) para que la prueba pase hasta que yo te dé la autorización explícita.

### Prompt 2: [Pendiente]
**Fecha:** [Pendiente]
**Objetivo:** [Ejecutando Green-Refactor]
**Prompt Empleado:**
> "Fase RED confirmada y validada. La prueba falla como se esperaba.

Procede a la Fase GREEN:

Implementa la clase FormatoUnicoService en backend/app/services/formato_unico_service.py con el método crear() que retorne un objeto con estado BORRADOR y items como lista vacía, tal como exige el test.

Asegúrate de que los archivos cumplan con el tipado estricto (no uses Any).

Vuelve a ejecutar pytest tests/unit/test_formato_unico_service.py y confírmame que el test pasa en verde.

Una vez que pase, actualiza la MATRIZ_TRAZABILIDAD_GLOBAL.md marcando el RF-FU-001 como ✅ Listo."


### Prompt 3: Validación Arquitectónica y Ejecución RF-FU-002
**Fecha:** 05/07/2026
**Objetivo:** Validar el archivo `VISION_SERVICE_STRATEGY.md` creado manualmente y ejecutar el ciclo TDD para el requerimiento de gestión de inventario.
**Prompt Empleado:**
> "Revisa el archivo Docs/FASE 3/DECISIONS/VISION_SERVICE_STRATEGY.md creado manualmente para validar la estrategia de Patrón Strategy. Luego, ejecuta el RF-FU-002 (Ciclo TDD): 1. Revisa la Matriz y el Plan TDD. 2. RED: Escribe los tests test_agregar_item_con_stock_exitoso() y test_agregar_item_sin_stock_falla(). Ejecuta pytest y confirma que fallan. 3. GREEN: Implementa la lógica mínima. 4. REFACTOR: Asegura tipado estricto. 5. Actualiza la Matriz marcando RF-FU-002 como Listo."


### Prompt 4: Ejecución RF-FU-003 (Cambio de Estado)
**Fecha:** 05/07/2026
**Objetivo:** Implementar la lógica de transición de estados ('BORRADOR' a 'APROBADO') siguiendo el ciclo TDD.
**Prompt Empleado:**
> "Sprint 1: Continuamos con el RF-FU-003 (Cambio de estado del Formato Único). 1. RED: Crea el test unitario test_cambiar_estado_formato_exitoso() en backend/tests/unit/test_formato_unico_service.py que verifique la transición de estado. Ejecuta pytest y confirma el fallo. 2. GREEN: Implementa la lógica mínima necesaria en FormatoUnicoService. 3. REFACTOR: Asegura tipado estricto y calidad de código. 4. Actualización: Marca el RF-FU-003 como ✅ Listo en la matriz tras pasar las pruebas."

### Prompt 5: Ejecución RF-FU-004 (Validación de Integridad)
**Fecha:** 05/07/2026
**Objetivo:** Implementar la validación de integridad (ej: no permitir aprobar un formato si está vacío) siguiendo el ciclo TDD.
**Prompt Empleado:**
> "Sprint 1: Continuamos con el RF-FU-004 (Validación de integridad). 1. RED: Crea el test unitario test_no_se_puede_aprobar_formato_vacio() que intente cambiar el estado a APROBADO sin ítems y verifique que lance una DomainException. Ejecuta pytest y confirma el fallo. 2. GREEN: Implementa la validación en FormatoUnicoService. 3. REFACTOR: Verifica tipado y limpia código. 4. Actualización: Marca el RF-FU-004 como ✅ Listo en la matriz tras pasar las pruebas."

### Prompt 6: Ejecución RF-FU-005 (Exposición vía API - FastAPI)
**Fecha:** 05/07/2026
**Objetivo:** Crear el endpoint POST para la creación de un Formato Único, delegando la lógica al servicio de dominio ya validado.
**Prompt Empleado:**
> "Sprint 2: Iniciamos la capa de API. RF-FU-005: Crear endpoint POST /formatos/ para crear un nuevo Formato Único. 1. RED: Crea un test de integración en backend/tests/integration/test_formato_api.py usando TestClient de FastAPI que intente llamar al endpoint y falle (porque no existe). 2. GREEN: Implementa el endpoint en backend/app/api/endpoints/formato_unico.py, inyectando el FormatoUnicoService. 3. REFACTOR: Asegura que el endpoint devuelva el estado correcto (201 Created) y use modelos Pydantic para la validación de entrada/salida. 4. Actualización: Marca RF-FU-005 como ✅ Listo en la matriz."

### Prompt 7: Ejecución RF-FU-006 (Gestión de Excepciones y Validación API)
**Fecha:** 05/07/2026
**Objetivo:** Implementar manejadores de excepciones globales en FastAPI para convertir DomainExceptions en respuestas HTTP amigables.
**Prompt Empleado:**
> "Sprint 2: RF-FU-006 (Gestión de Excepciones). 1. RED: Crea un test en test_formato_api.py que intente realizar una acción no permitida (ej. aprobar formato vacío) vía API y verifica que reciba un HTTP 400/422 en lugar de un 500. 2. GREEN: Implementa un `exception_handler` global en FastAPI para capturar DomainException y retornar JSON con formato estándar. 3. REFACTOR: Limpia la lógica de manejo de errores en los endpoints. 4. Actualización: Marca RF-FU-006 como ✅ Listo."

### Prompt 8: Ejecución RF-FU-007 (Capa de Persistencia - Repositorio)
**Fecha:** 05/07/2026
**Objetivo:** Definir la interfaz del repositorio para persistir el Formato Único y sus ítems, preparando la arquitectura para una base de datos real.
**Prompt Empleado:**
> "Sprint 2: RF-FU-007 (Persistencia). 1. RED: Define la interfaz abstracta `IFormatoUnicoRepository` en `backend/app/domain/repositories/` y un test unitario `test_repositorio_guarda_formato()` que falle porque el repositorio es solo una interfaz. 2. GREEN: Implementa una versión en memoria (`InMemoryFormatoRepository`) que pase el test. 3. REFACTOR: Asegura que el servicio de dominio ahora acepte el repositorio vía Inyección de Dependencias. 4. Actualización: Marca RF-FU-007 como ✅ Listo."

### Prompt 9: Ejecución RF-FU-008 (Persistencia con Supabase)
**Fecha:** 05/07/2026
**Objetivo:** Implementar `SupabaseFormatoRepository` para persistencia real y configurar el motor de base de datos.
**Prompt Empleado:**
> "Sprint 3: RF-FU-008 (Persistencia Supabase). 1. RED: Crea la clase SupabaseFormatoRepository que implemente IFormatoUnicoRepository. Necesitaremos configurar la conexión con el SDK de Supabase (o clientes de Postgres). 2. GREEN: Implementa los métodos save() y get_by_id() traduciendo el modelo de dominio a registros SQL/JSON. 3. REFACTOR: Configura la inyección de dependencias para que el sistema use Supabase si existe una URL de base de datos, o InMemory si no. 4. Actualización: Marca RF-FU-008 como ✅ Listo."

### Prompt 10: Ejecución RF-FU-009 (Logging y Observabilidad)
**Fecha:** 05/07/2026
**Objetivo:** Implementar un middleware de logging estructurado que capture peticiones sin registrar datos sensibles (PII).
**Prompt Empleado:**
> "Sprint 3: RF-FU-009 (Observabilidad). 1. RED: Implementar un middleware en FastAPI que capture cada petición y respuesta, pero que actualmente no registra nada en consola. 2. GREEN: Configura el logger estándar de Python para registrar logs estructurados (timestamp, path, status_code). 3. REFACTOR: Asegura que el logger no capture información sensible (como la API Key de Supabase o tokens de autorización). 4. Actualización: Marca RF-FU-009 como ✅ Listo."

### Prompt 10: Ejecución RF-FU-009 (Logging y Observabilidad)
**Fecha:** 05/07/2026
**Objetivo:** Implementar un middleware de logging estructurado que capture peticiones sin registrar datos sensibles (PII).
**Prompt Empleado:**
> "Sprint 3: RF-FU-009 (Observabilidad). 1. RED: Implementar un middleware en FastAPI que capture cada petición y respuesta, pero que actualmente no registra nada en consola. 2. GREEN: Configura el logger estándar de Python para registrar logs estructurados (timestamp, path, status_code). 3. REFACTOR: Asegura que el logger no capture información sensible (como la API Key de Supabase o tokens de autorización). 4. Actualización: Marca RF-FU-009 como ✅ Listo."

### Prompt 12: Ejecución RF-FU-011 (Historial de Formatos)
**Fecha:** 05/07/2026
**Objetivo:** Implementar el query service para listar formatos del usuario con paginación y filtros de estado.
**Prompt Empleado:**
> "Sprint 4: RF-FU-011 (Historial). 1. RED: Crea un test de integración que guarde 5 formatos (en distintos estados) y solicite una lista paginada. Verifica que el endpoint retorne solo los registros esperados. 2. GREEN: Implementa `FormatoUnicoQueryService` y el endpoint `GET /formatos/` con soporte para paginación (skip/limit). 3. REFACTOR: Aplica RLS (simulado o vía repositorio) para asegurar que solo se vean formatos del usuario. 4. Actualización: Marca RF-FU-011 como ✅ Listo."

### Prompt 13: Ejecución RF-FU-012 (Dashboard de usuario)
**Fecha:** 05/07/2026
**Objetivo:** Implementar un endpoint que consolide el estado del usuario (formatos activos y notificaciones).
**Prompt Empleado:**
> "Sprint 4: RF-FU-012 (Dashboard). 1. RED: Crea un endpoint GET /dashboard/ que retorne un resumen del formato activo (si existe) y una lista de notificaciones recientes. El test debe fallar por falta de endpoint. 2. GREEN: Implementa DashboardService que combine llamadas al FormatoUnicoQueryService y NotificationService. 3. REFACTOR: Asegura que el modelo de respuesta contenga un objeto consolidado (widget de FU + lista de notificaciones). 4. Actualización: Marca RF-FU-012 como ✅ Listo."

### Prompt 14: Ejecución RF-FU-013 (Carga masiva Excel)
**Fecha:** 05/07/2026
**Objetivo:** Implementar servicio de procesamiento asíncrono/rápido para carga de Excel cumpliendo restricciones de rendimiento.
**Prompt Empleado:**
> "Sprint 4: RF-FU-013 (Excel Import). 1. RED: Crea un endpoint POST /formatos/importar-excel/ que acepte un archivo .xlsx y falle si no se procesa correctamente. 2. GREEN: Implementa ExcelImportService usando pandas/openpyxl para procesar filas de SKU/Cantidad. 3. REFACTOR: Optimiza para que 500 filas se procesen en < 5s. 4. Actualización: Marca RF-FU-013 como ✅ Listo."

### Prompt 14: Ejecución RF-FU-013 (Carga masiva Excel)
**Fecha:** 05/07/2026
**Objetivo:** Implementar servicio de procesamiento asíncrono/rápido para carga de Excel cumpliendo restricciones de rendimiento.
**Prompt Empleado:**
> "Sprint 4: RF-FU-013 (Excel Import). 1. RED: Crea un endpoint POST /formatos/importar-excel/ que acepte un archivo .xlsx y falle si no se procesa correctamente. 2. GREEN: Implementa ExcelImportService usando pandas/openpyxl para procesar filas de SKU/Cantidad. 3. REFACTOR: Optimiza para que 500 filas se procesen en < 5s. 4. Actualización: Marca RF-FU-013 como ✅ Listo."

### Prompt 15: Ejecución RF-FU-014 (Descarga de Plantilla)
**Fecha:** 05/07/2026
**Objetivo:** Implementar endpoint para generación dinámica de plantillas Excel (.xlsx) para importación.
**Prompt Empleado:**
> "Sprint 4: RF-FU-014 (Plantilla Excel). 1. RED: Crea un endpoint GET /formatos/plantilla/ que intente descargar un archivo .xlsx y falle porque la ruta no existe. 2. GREEN: Implementa el endpoint usando StreamingResponse y un buffer en memoria para generar el Excel con columnas 'SKU' y 'Cantidad'. 3. REFACTOR: Asegura que el archivo tenga headers estándar y formato de celdas básico. 4. Actualización: Marca RF-FU-014 como ✅ Listo."

### Prompt 17: Ejecución RF-FU-016 (Consulta por Telegram)
**Fecha:** 05/07/2026
**Objetivo:** Implementar la generación de enlaces profundos (deep links) para consultas de productos por Telegram.
**Prompt Empleado:**
> "Sprint 4: RF-FU-016 (Telegram). 1. RED: Crea un endpoint o método utilitario que genere la URL t.me con el payload (SKU, nombre, qty) y verifica que el formato sea correcto. 2. GREEN: Implementa la lógica de generación del URL-encoded payload. 3. REFACTOR: Asegura que la URL sea segura y el payload esté correctamente codificado. 4. Actualización: Marca RF-FU-016 como ✅ Listo."

### Prompt 18: Ejecución RF-FU-017 (Consulta masiva Telegram)
**Fecha:** 05/07/2026
**Objetivo:** Implementar la lógica para concatenar múltiples consultas de productos en un solo payload de Telegram.
**Prompt Empleado:**
> "Sprint 4: RF-FU-017 (Telegram Bulk). 1. RED: Crea un test que pase una lista de ítems (ej. 3 ítems) y verifique que el texto del mensaje generado incluya la información de todos. 2. GREEN: Implementa en TelegramService un método generar_url_masiva(lista_items). 3. REFACTOR: Asegura que el formato del mensaje sea legible (ej. una línea por producto). 4. Actualización: Marca RF-FU-017 como ✅ Listo."

### Prompt 19: Ejecución RF-FU-019 (Validación doble de Excel)
**Fecha:** 05/07/2026
**Objetivo:** Implementar la lógica de pre-visualización con resumen de errores (rojo/naranja) antes de la carga final.
**Prompt Empleado:**
> "Sprint 4: RF-FU-019 (Validación doble). 1. RED: Crea un endpoint POST /formatos/validar-excel/ que simule la subida sin guardar, retornando un resumen con filas válidas, rojas (SKU inválido) y naranjas (stock bajo). 2. GREEN: Implementa la lógica en ExcelImportService. 3. REFACTOR: Asegura que el response retorne la estructura exacta de filas categorizadas. 4. Actualización: Marca RF-FU-019 como ✅ Listo."

### Prompt 20: Ejecución RF-FU-018 (Banners dinámicos)
**Fecha:** 05/07/2026
**Objetivo:** Exponer la configuración de UI necesaria para los estados del FSM.
**Prompt Empleado:**
> "Sprint 4: RF-FU-018 (Banners FSM). 1. RED: Crea un endpoint GET /formatos/{id}/configuracion-ui/ que retorne los metadatos visuales del estado actual. 2. GREEN: Implementa la lógica que mapea los estados (BORRADOR, COTIZACIÓN, etc.) a colores y mensajes. 3. REFACTOR: Asegura que la respuesta cumpla con el esquema necesario para el componente CMP-FU-019. 4. Actualización: Marca RF-FU-018 como ✅ Listo."

### Prompt 21: Ejecución RF-CAT-001 (Listado de productos)
**Fecha:** 05/07/2026
**Objetivo:** Implementar el listado paginado de productos con filtros de categoría, marca y precio.
**Prompt Empleado:**
> "Sprint 5: RF-CAT-001 (Catálogo). 1. RED: Crea un endpoint GET /productos/ que acepte parámetros de consulta (skip, limit, categoria, marca, precio_min, precio_max) y verifique que retorne una lista paginada. 2. GREEN: Implementa ProductQueryService y el repositorio para filtrar productos activos (is_active=true). 3. REFACTOR: Aplica paginación robusta y validación de parámetros con Pydantic. 4. Actualización: Marca RF-CAT-001 como ✅ Listo."

### Prompt 22: Ejecución RF-CAT-002 (Detalle del producto)
**Fecha:** 05/07/2026
**Objetivo:** Implementar la obtención del detalle completo de un producto mediante su slug o ID.
**Prompt Empleado:**
> "Sprint 5: RF-CAT-002 (Detalle Producto). 1. RED: Crea un endpoint GET /productos/{slug}/ que retorne los detalles completos, fallando si el producto no existe (404). 2. GREEN: Implementa el método en ProductQueryService para obtener un producto por su slug. 3. REFACTOR: Asegura que la respuesta contenga especificaciones, galería de imágenes y stock actual. 4. Actualización: Marca RF-CAT-002 como ✅ Listo."

### Prompt 22: Ejecución RF-CAT-002 (Detalle del producto)
**Fecha:** 05/07/2026
**Objetivo:** Implementar la obtención del detalle completo de un producto mediante su slug o ID.
**Prompt Empleado:**
> "Sprint 5: RF-CAT-002 (Detalle Producto). 1. RED: Crea un endpoint GET /productos/{slug}/ que retorne los detalles completos, fallando si el producto no existe (404). 2. GREEN: Implementa el método en ProductQueryService para obtener un producto por su slug. 3. REFACTOR: Asegura que la respuesta contenga especificaciones, galería de imágenes y stock actual. 4. Actualización: Marca RF-CAT-002 como ✅ Listo."

### Prompt 23: Ejecución RF-CAT-003 (Buscador de productos)
**Fecha:** 06/07/2026
**Objetivo:** Implementar la búsqueda por texto (nombre, descripción, marca) en el catálogo con optimización de consulta.
**Prompt Empleado:**
> "Sprint 5: RF-CAT-003 (Buscador). 1. RED: Crea un endpoint GET /productos/buscar/ que acepte un parámetro 'q'. Verifica que filtre productos por nombre o descripción. 2. GREEN: Implementa la búsqueda en ProductQueryService. 3. REFACTOR: Aplica indexación básica y asegúrate de que sea insensible a mayúsculas/minúsculas. 4. Actualización: Marca RF-CAT-003 como ✅ Listo."

### Prompt 25: Ejecución RF-CAT-005 (Exploración de Categorías)
**Fecha:** 06/07/2026
**Objetivo:** Implementar el listado de categorías con conteo dinámico de productos activos.
**Prompt Empleado:**
> "Sprint 5: RF-CAT-005 (Categorías). 1. RED: Crea endpoint GET /categorias/ que retorne una lista de categorías únicas y su respectivo contador de productos. 2. GREEN: Implementa lógica en un nuevo CategoryQueryService. 3. REFACTOR: Asegura que el conteo solo considere productos con is_active=True. 4. Actualización: Marca RF-CAT-005 como ✅ Listo."

### Prompt 26: Ejecución Bloque A - Checkout (RF-CHK-001 al 004)
**Fecha:** 06/07/2026
**Objetivo:** Implementar flujo de facturación, cálculo de envío (mock) y orquestación de pago con Mercado Pago.
**RFs Incluidos:** RF-CHK-001, RF-CHK-002, RF-CHK-003, RF-CHK-004.
**Prompt Empleado:**
> "Sprint 4 (Bloque A): Implementar checkout completo. 1. RED: Crear test de integración que valide el flujo: seteo de facturación, cálculo de envío, creación de preferencia de pago y persistencia de idempotencia. 2. GREEN: Crear CheckoutService que orqueste: ValidationService, ShippingService (mock), y PaymentService (MercadoPago). 3. REFACTOR: Definir esquemas CheckoutRequest/Response, asegurar validación de estado de pedido y manejar errores de integración. 4. Actualización: Marcar RF-CHK-001, 002, 003, 004 como ✅ Listo."

### Prompt 27: Ejecución Bloque B - Webhooks y Seguridad (RF-CHK-005, 006, 014)
**Fecha:** 06/07/2026
**Objetivo:** Implementar la recepción de webhooks seguros (HMAC), actualización de estado de orden y FSM.
**RFs Incluidos:** RF-CHK-005, RF-CHK-006, RF-CHK-014.
**Prompt Empleado:**
> "Sprint 4 (Bloque B): Implementar webhooks seguros. 1. RED: Crear endpoint POST /webhooks/mercadopago/ que verifique la firma HMAC-SHA256 y falle si es inválida. 2. GREEN: Implementar el manejador que, dado un status 'approved', transicione el FSM a CONFIRMADO y libere stock. 3. REFACTOR: Asegurar idempotencia en el procesamiento del webhook y manejo de estados (approved, pending, rejected). 4. Actualización: Marcar RF-CHK-005, 006, 014 como ✅ Listo."

### Prompt 28: Ejecución Bloque C - Resiliencia y Stock (RF-CHK-011, 012)
**Fecha:** 06/07/2026
**Objetivo:** Implementar reserva temporal de stock al crear un pedido y liberación automática por expiración.
**RFs Incluidos:** RF-CHK-011, RF-CHK-012.
**Prompt Empleado:**
> "Sprint 4 (Bloque C): Implementar gestión de stock. 1. RED: Crear test que verifique: al transicionar a PEDIDO, el stock disponible disminuye. Tras 31 min (simulados), verificar que el stock vuelve a su valor original. 2. GREEN: Implementar en InventoryService la lógica de `reserved_stock` y en SchedulerService la tarea de limpieza de reservas expiradas. 3. REFACTOR: Asegurar atomicidad en las actualizaciones de stock para evitar race conditions. 4. Actualización: Marcar RF-CHK-011, 012 como ✅ Listo."

### Prompt 29: Ejecución Bloque D - UX y Tracking (RF-CHK-007, 009, 013)
**Fecha:** 06/07/2026
**Objetivo:** Habilitar endpoints de soporte para UI de confirmación, autocompletado de facturación y tokens de rastreo para invitados.
**RFs Incluidos:** RF-CHK-007, RF-CHK-009, RF-CHK-013.
**Prompt Empleado:**
> "Sprint 4 (Bloque D): Endpoints de UX Checkout. 1. RED: Crear tests que validen la generación de un token opaco para usuarios GUEST al hacer checkout, la obtención de datos pre-llenados para usuarios CUSTOMER, y un endpoint de estado para la pantalla post-pago. 2. GREEN: Crear TokenService (usando la librería secrets), mockear UserQueryService para retornar perfil de usuario, y crear GET /checkout/{fu_id}/status. 3. REFACTOR: Asegurar que el CheckoutResponseSchema incluya el order_token si es GUEST. 4. Actualización: Marcar RF-CHK-007, 009, 013 como ✅ Listo."

### Prompt 30: Ejecución Bloque E - Zero Trust y Auth (RNF-SEC-001, 002, 007)
**Fecha:** 06/07/2026
**Objetivo:** Implementar seguridad transversal mediante autenticación JWT, RLS (simulado/en middleware) y cabeceras HTTP de seguridad.
**RFs Incluidos:** RNF-SEC-001, RNF-SEC-002, RNF-SEC-007, RF-AUT-002.
**Prompt Empleado:**
> "Sprint 4 (Bloque E): Capa Zero Trust. 1. RED: Crea tests que verifiquen el rechazo de peticiones sin token (401), acceso a datos de otro usuario (403), y la presencia de cabeceras de seguridad. 2. GREEN: Implementa AuthService (generación/validación de JWT), middleware de autenticación y middleware de headers (HSTS, CSP). 3. REFACTOR: Protege los endpoints de Checkout y Formato Único con la dependencia de autenticación, inyectando el `current_user_id` para garantizar el aislamiento de datos. 4. Actualización: Marca RNF-SEC-001, 002, 007 y RF-AUT-002 como ✅ Listo."

### Prompt 31: Ejecución Bloque F - Consolidación de Usuarios (RF-AUT-007, RF-CAT-007)
**Fecha:** 06/07/2026
**Objetivo:** Implementar migración de carrito (GUEST a CUSTOMER) y funcionalidad de favoritos.
**RFs Incluidos:** RF-AUT-007, RF-CAT-007.
**Prompt Empleado:**
> "Sprint 4 (Bloque F): Consolidación de usuarios. 1. RED: Crea test para validar que al autenticarse, un Formato Único de GUEST se fusiona correctamente con el Formato Único del CUSTOMER (sumando cantidades). Crea test para guardar/eliminar Favoritos (solo CUSTOMER). 2. GREEN: Implementa 'merge' en FormatoUnicoService. Crea FavoriteService para gestionar favoritos protegidos por JWT. 3. REFACTOR: Asegura que el merge no exceda el stock disponible. 4. Actualización: Marca RF-AUT-007 y RF-CAT-007 como ✅ Listo."

### Prompt 32: Ejecución Bloque G - Vitrina y Notificaciones (RF-CAT-004, 008, RF-CHK-008)
**Fecha:** 06/07/2026
**Objetivo:** Implementar endpoint consolidado para Landing Page, mock de notificaciones por email y deep link de Telegram para catálogo.
**RFs Incluidos:** RF-CAT-004, RF-CAT-008, RF-CHK-008.
**Prompt Empleado:**
> "Sprint 4 (Bloque G): Vitrina y Notificaciones. 1. RED: Crea tests para verificar que el endpoint /landing retorna destacados y conteo de categorías en una sola llamada. Verifica que al transicionar a CONFIRMADO se dispare el envío de un email simulado. 2. GREEN: Crea GET /landing orquestando ProductQueryService y CategoryQueryService. Crea NotificationService con un mock para SMTP. 3. REFACTOR: Integra NotificationService en PaymentService.procesar_webhook. Retorna la estructura de URL para Telegram en el ProductDetailSchema. 4. Actualización: Marca RF-CAT-004, RF-CAT-008 y RF-CHK-008 como ✅ Listo."

### Prompt 33: Ejecución Bloque H - Auditoría y Defensa (RNF-AUD-001, RF-SYS-001, RNF-SEC-008)
**Fecha:** 06/07/2026
**Objetivo:** Implementar registro de auditoría automático para mutaciones y protección contra ataques de fuerza bruta (Rate Limiting).
**RFs Incluidos:** RNF-AUD-001, RF-SYS-001, RNF-SEC-008.
**Prompt Empleado:**
> "Sprint 4 (Bloque H): Auditoría y Defensa. 1. RED: Crea test que verifique el bloqueo HTTP 429 tras exceder 100 req/min en un endpoint. Crea test que asegure la creación de un registro en 'audit_logs' tras crear/modificar un producto. 2. GREEN: Implementa un middleware de Rate Limiting (ventana de tiempo en memoria/Redis). Crea AuditLogService ejecutado como BackgroundTask en FastAPI. 3. REFACTOR: Asegura que el AuditLog almacene el 'actor' (current_user_id), la 'acción' (POST/PUT) y el 'recurso'. 4. Actualización: Marca RNF-AUD-001, RF-SYS-001, y RNF-SEC-008 como ✅ Listo."

### Prompt 34: Ejecución Bloque I - Autenticación Avanzada (RF-AUT-001, 003, RNF-SEC-004)
**Fecha:** 06/07/2026
**Objetivo:** Implementar validación de Google OAuth (mock), MFA TOTP para Admins y Auth B2B (HMAC+Nonce).
**RFs Incluidos:** RF-AUT-001, RF-AUT-003, RNF-SEC-004.
**Prompt Empleado:**
> "Sprint 4 (Bloque I): Autenticación Avanzada. 1. RED: Crea test para validar que un ADMIN sin MFA reciba 403. Crea test que rechace un request de DISTRIBUTOR si el 'nonce' (timestamp) ya fue usado (prevención replay). 2. GREEN: Implementa MFAService usando 'pyotp' para generar/verificar códigos de 6 dígitos. Implementa DistributorAuthService que almacene los 'nonce' usados en memoria. 3. REFACTOR: Crea mock endpoint POST /auth/google para retornar un JWT válido. Aplica la validación MFA a un endpoint protegido de Admin. 4. Actualización: Marca RF-AUT-001, 003 y RNF-SEC-004 como ✅ Listo."

### Prompt 35: Ejecución Bloque J - Importación Excel B2B y DevSecOps (RF-FU-013 a 019, RNF-SEC-005, 006)
**Fecha:** 06/07/2026
**Objetivo:** Implementar carga masiva de productos vía CSV/Excel, validación de stock en lote, y configuración base del pipeline DevSecOps (Jenkins/GitHub Actions).
**RFs Incluidos:** RF-FU-013, RF-FU-014, RF-FU-015, RF-FU-019, RNF-SEC-005, RNF-SEC-006.
**Prompt Empleado:**
> "Sprint 4 (Bloque J Final): Operaciones Masivas y CI/CD. 1. RED: Crea test que simule la subida de un archivo CSV/Excel con SKUs y cantidades, verificando que el sistema retorne los items validados (errores de SKU o stock insuficiente). 2. GREEN: Implementa ExcelImportService usando 'csv' o 'pandas' ligero para parsear el archivo. Crea endpoint POST /formatos/excel/import y GET /formatos/excel/template. 3. REFACTOR: Crea un archivo CI/CD (ej. .github/workflows/security.yml o Jenkinsfile) que incluya steps para 'Trivy' (escaneo de vulnerabilidades) y 'gitleaks' (escaneo de secretos). 4. Actualización: Marca RF-FU-013, 014, 015, 019, RNF-SEC-005 y 006 como ✅ Listo."

### Prompt 36: Hotfix Auditoría Crítica (Seguridad, Stock e Idempotencia)
**Fecha:** 06/07/2026
**Objetivo:** Resolver hallazgos bloqueantes de auditoría QA. Mover secreto de webhook a .env, implementar lógica real de reserva de stock eliminando el TODO, y migrar idempotencia de memoria a base de datos.
**RFs Afectados:** RNF-SEC-005, RF-CHK-011, RNF-SEC-003.
**Prompt Empleado:**
> "¡Modo Hotfix activado! Una auditoría ha detectado 3 hallazgos críticos que bloquean el paso a producción. Necesito que ejecutes las siguientes correcciones con máxima precisión: 1. Seguridad: Elimina el 'WEBHOOK_SECRET' hardcodeado en `webhooks.py`. Haz que se lea desde una variable de entorno de forma segura. 2. Lógica de Stock: Busca el comentario TODO en la lógica de reserva de stock (en `inventory_service.py` o donde aplique) y escribe el código real que actualiza `reserved_stock += cantidad` en el repositorio. 3. Idempotencia: Elimina el Set en memoria para los webhooks. Crea la entidad/repositorio `PaymentIdempotencyKey` con `event_id` único, y úsala en `payment_service.py` para rechazar eventos duplicados de forma persistente."

### Prompt 37: Actualización de RF
**Fecha:** 06/07/2026
**Prompt Empleado:**
> "Actúa como Auditor QA. Necesito que actualices el archivo 04_EJECUCION/MATRIZ_TRAZABILIDAD_GLOBAL.md basándote ESTRICTAMENTE en el código fuente actual del repositorio, sin asumir nada. Revisa backend/app/services/payment_service.py, payment_idempotency_key.py y idempotency_repository.py. Si existe la persistencia de idempotencia para webhooks, marca RNF-SEC-003 como ✅ Listo. Revisa backend/app/services/user_query_service.py y app/checkout/page.tsx (o su equivalente backend). Si existe el mock o endpoint que devuelve datos de facturación (RUC/DNI) pre-llenados, marca RF-AUT-008 como ✅ Listo. Deja estrictamente como ⏳ Pendiente los siguientes requerimientos, ya que aún no hemos implementado su código final: RF-CHK-010, RNF-DIS-001, RNF-PERF-001, RNF-SEG-001 y RNF-SEG-002. No modifiques nada más, solo cambia el estado en la columna de esos dos requerimientos específicos si el código lo comprueba." >

### Prompt 38: Ejecución Bloque L - Infraestructura B2B Definitiva (RNF-PERF-001, RNF-SEG-001, 002)
**Fecha:** 06/07/2026
**Objetivo:** Validar latencia bajo estrés, garantizar la protección de concurrencia estricta (500ms) y bajar la seguridad Zero Trust hasta las políticas internas (RLS) del motor de base de datos.
**RFs Incluidos:** RNF-PERF-001, RNF-SEG-001, RNF-SEG-002.
**Prompt Empleado:**
> "Sprint 5 (Bloque L Final): Infraestructura B2B. 1. RNF-PERF-001: Crea archivo k6_catalog_test.js (50 VUs) para GET /productos/ con un threshold estricto de p(95)<300ms. 2. RNF-SEG-001: Crea test_concurrency.py usando asyncio.gather para lanzar 5 webhooks paralelos en <500ms, verificando que solo 1 mute la BD. 3. RNF-SEG-002: Crea el script setup_rls.sql con políticas de Row Level Security para aislar usuarios a nivel de motor BD. 4. Actualización: Marca RNF-PERF-001, RNF-SEG-001 y RNF-SEG-002 como ✅ Listo."

### Prompt 39: Ejecución Bloque M - Frontend Base, CORS y Catálogo
**Fecha:** 06/07/2026
**Objetivo:** Configurar políticas CORS en FastAPI, establecer el cliente Axios con interceptores Zero Trust e implementar la Landing Page consumiendo el endpoint de catálogo real.
**RFs Incluidos:** RF-CAT-001, RF-CAT-004.
**Prompt Empleado:**
> "Activa el Modo Turbo. 1. BACKEND: En `main.py`, configura `CORSMiddleware` para permitir orígenes desde `http://localhost:3000`. 2. FRONTEND: Crea `frontend/src/lib/api.ts` con instancia Axios hacia `http://127.0.0.1:8000` y un interceptor que inyecte el token Bearer desde localStorage. 3. FRONTEND: Sobrescribe `src/app/page.tsx` con Tailwind CSS para renderizar un grid de productos B2B consumiendo `GET /productos/landing`, manejando estados de carga y error."

---

### Prompt 40: Ejecución Bloque N - Módulo B2B Masivo y Tabla FSM
**Fecha:** 06/07/2026
**Objetivo:** Crear la interfaz de carga de Excel/CSV para clientes corporativos y renderizar la matriz de validación de stock con estilos condicionales.
**RFs Incluidos:** RF-FU-013, RF-FU-019.
**Prompt Empleado:**
> "Desarrolla el Módulo Masivo B2B. 1. RUTA: Crea `frontend/src/app/formatos/page.tsx`. 2. COMPONENTE: Diseña un Dropzone con Tailwind para subir archivos `.csv`/`.xlsx`. 3. INTEGRACIÓN: Envía el archivo vía `POST` a `/formatos/excel/import` con FormData. 4. TABLA: Renderiza la respuesta aplicando colores semánticos: verde (Validado), naranja (Stock Insuficiente), rojo (SKU Inválido). 5. Añade botón 'Convertir en Pedido' habilitado si hay ítems válidos, redirigiendo a `/checkout`."

---

### Prompt 41: Ejecución Bloque O - Checkout Automático y Mercado Pago
**Fecha:** 06/07/2026
**Objetivo:** Implementar la pasarela de pagos en el cliente, autocompletado de datos B2B y redirección del flujo de Mercado Pago.
**RFs Incluidos:** RF-AUT-008, RF-CHK-010.
**Prompt Empleado:**
> "Finaliza el Checkout. 1. RUTA: Crea `frontend/src/app/checkout/page.tsx`. 2. AUTOCOMPLETADO (RF-AUT-008): En el mount, haz `GET` a `/usuarios/me/facturacion` y pre-llena RUC/DNI. 3. FORMULARIO: Muestra resumen de pedido interactivo. 4. REDIRECCIÓN (RF-CHK-010): Al hacer submit, envía `POST /checkout/`, captura el `init_point` y ejecuta `window.location.href = respuesta.init_point`. 5. RETORNO: Crea páginas `checkout/exito/page.tsx` (verde) y `checkout/error/page.tsx` (rojo) para el callback de la pasarela."


### Prompt 42: Generación del Hook useDashboardData

**Objetivo:** Crear un hook personalizado en Next.js para gestionar la carga concurrente de datos del dashboard, incluyendo el formato único activo y el historial de pedidos, aplicando transformaciones de fecha y validaciones de seguridad.

**Prompt Empleado:**

> "Actúa como desarrollador Senior en React/Next.js. Crea el hook src/hooks/useDashboardData.ts para consumir los endpoints de mi backend FastAPI.

Requerimientos del Hook:

Estados: Debe retornar dashboardData (objeto con el formato esperado), loading (booleano), error (string o null), y una función refetch para recargar datos.

Consumo de Endpoints:

Debe realizar llamadas concurrentes (usando Promise.all) a:

GET /api/v1/formato-unico/active (para el Widget Principal).

GET /api/v1/orders/ (para el historial).

Debe incluir en los headers el token JWT obtenido desde mi AuthContext.

Transformación: Si el backend devuelve un FormatoUnico con campos como created_at (string ISO), el hook debe transformarlos a objetos Date nativos para facilitar la lógica del countdown en la UI.

Manejo de Errores: Si algún endpoint falla, el hook debe capturar el error y devolver un mensaje descriptivo en el estado error.

Seguridad: Verifica que si el token JWT no está disponible, el hook no realice la petición.

Regla de oro: El hook debe ser tipado estrictamente (usa interfaces de TypeScript). No debe haber lógica de renderizado aquí, solo lógica de datos."

### Prompt 43: Generación del Componente MainWidget

**Objetivo:** Crear un componente de interfaz de usuario (UI) reutilizable para mostrar el estado actual del Formato Único, permitiendo al usuario iniciar acciones como el envío a revisión, con un diseño profesional basado en Tailwind CSS.

**Prompt Empleado:**

> "Actúa como desarrollador Senior en React y Tailwind CSS. Crea el componente src/components/dashboard/MainWidget.tsx. Este es el widget central que muestra el FormatoUnico activo.

Requerimientos funcionales y técnicos:

Props: El componente debe recibir data (objeto FormatoUnicoActive) y onAction (función callback).

UI Profesional:

Usa una estructura de Card con sombras sutiles, bordes redondeados (rounded-xl) y padding interno.

Incluye un Badge (etiqueta) con color dinámico basado en el estado:

DRAFT: Azul (bg-blue-100 text-blue-800).

PENDING_REVIEW: Amarillo (bg-yellow-100 text-yellow-800).

COMPLETED: Verde (bg-green-100 text-green-800).

Lógica de Estado:

Muestra los campos clave: ID de formato, Fecha de creación (formateada con toLocaleDateString), y el Total.

Si el estado es DRAFT, muestra un botón prominente: 'Enviar a Revisión'.

Si el estado es PENDING_REVIEW, muestra un mensaje informativo: 'Esperando validación del administrador'.

Interactividad:

Si el usuario hace clic en el botón de acción, debe llamar a onAction pasando el ID del formato.

Implementa un estado de carga local (loading) en el botón mientras onAction procesa.

Estética: Asegúrate de que el componente sea responsivo y luzca como un elemento de una plataforma B2B moderna.

Regla de oro: No escribas lógica de fetch (fetch/api) aquí. Este componente debe ser un 'dumb component' que recibe los datos vía props y emite eventos vía callbacks."

### Prompt 44: Generación del Componente OrderHistoryTable

**Objetivo:** Crear un componente de tabla para mostrar el historial de pedidos del cliente, con diseño responsivo y estilos condicionales.

**Prompt Empleado:**

> "Actúa como desarrollador Senior en React y Tailwind CSS. Crea el componente src/components/dashboard/OrderHistoryTable.tsx.

Requerimientos funcionales y técnicos:

Props: Recibe orders (un array de objetos Order). Si el array está vacío, muestra un estado visual amigable (un mensaje: 'No hay pedidos previos aún').

Diseño de Tabla:

Cabeceras: 'Fecha', 'ID Pedido', 'Total', 'Estado'.

Usa bordes sutiles y un espaciado amplio para que se vea profesional.

Implementa 'zebra-striping' (filas alternadas con un gris muy claro: bg-gray-50) para mejorar la legibilidad.

Columnas Dinámicas:

Fecha: Formateada a DD/MM/YYYY.

Total: Usar Intl.NumberFormat para formato de moneda (S/.).

Estado: Un Badge estilizado.

PENDING: Amarillo (bg-yellow-100 text-yellow-800).

SHIPPED: Azul (bg-blue-100 text-blue-800).

DELIVERED: Verde (bg-green-100 text-green-800).

Responsividad: Asegúrate de que, en pantallas pequeñas (móviles), la tabla se transforme en una lista de tarjetas apiladas mediante clases de Tailwind (usando hidden md:table-cell para ocultar columnas innecesarias y mostrando una tarjeta por fila).

Regla de oro: Al igual que el MainWidget, este es un 'dumb component'. La lógica de qué pedidos cargar se maneja fuera (en el hook useDashboardData)."





### Prompt 45: Generación del Dashboard Page

**Objetivo:** Crear la página principal del dashboard (src/app/dashboard/page.tsx) que integre los componentes construidos (MainWidget y OrderHistoryTable) con el hook useDashboardData.

**Prompt Empleado:**

"Actúa como desarrollador Senior en React/Next.js. Crea el archivo src/app/dashboard/page.tsx para ensamblar el dashboard completo siguiendo la arquitectura que hemos construido.

Requerimientos de ensamblaje:

Envoltorios: Debe usar ProtectedRoute (con requiredRole="CUSTOMER") y DashboardLayout para envolver todo el contenido.

Integración del Hook: Debe llamar a useDashboardData() para obtener dashboardData, loading y error.

Lógica de Renderizado:

Estado de Carga: Si loading es true, muestra un spinner centrado en pantalla.

Estado de Error: Si hay un error, muestra un mensaje de error estilizado en una tarjeta de aviso.

Dashboard Completo: Si los datos cargan correctamente:

Primero, renderiza el título principal 'Panel de Control'.

Luego, renderiza el MainWidget pasando dashboardData.formato_activo y la lógica para el botón onAction.

Finalmente, renderiza el componente OrderHistoryTable pasando dashboardData.orders.

Estilo: Asegúrate de que haya espacio vertical (space-y-6) entre el widget principal y la tabla para mantener la jerarquía visual.

Regla de oro: El archivo page.tsx no debe tener lógica de red, ni estilos complejos. Solo debe importar los componentes, el hook y estructurarlos visualmente."