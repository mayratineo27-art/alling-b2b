Estado: Propuesta / Pendiente de implementación
Contexto: Necesitamos procesar imágenes de productos y fibra óptica.
Decisión: Implementar el patrón Strategy para la interfaz IVisionService.

Estrategia A (Cloud): GeminiVisionService (usando Google AI Studio API).

Estrategia B (Local): OllamaVisionService (usando contenedores locales de LLaVA).
Implementación: Se inyectará la estrategia mediante Dependency Injection en los servicios de negocio. Esto permite cambiar el proveedor en el .env sin cambiar una sola línea de lógica de negocio.

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

### Prompt 11: Ejecución RF-FU-010 (Cancelación de Formato Único)
**Fecha:** 05/07/2026
**Objetivo:** Implementar la lógica de cancelación de un Formato Único, aplicando las restricciones de estado del FSM.
**Prompt Empleado:**
> "Sprint 4: RF-FU-010 (Cancelación de FU). 1. RED: Crea un test que intente cancelar un FU en estado 'COTIZACIÓN' y verifique que el sistema retorne un error 409 Conflict. Luego, crea otro test que permita cancelar un FU en 'BORRADOR'. Ejecuta pytest y confirma que fallan. 2. GREEN: Implementa la lógica en StateMachineService y FormatoUnicoService. 3. REFACTOR: Asegura que la transición respete las reglas del FSM. 4. Actualización: Marca RF-FU-010 como ✅ Listo en la matriz."

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

### Prompt 15: Ejecución RF-FU-014 (Descarga de Plantilla)
**Fecha:** 05/07/2026
**Objetivo:** Implementar endpoint para generación dinámica de plantillas Excel (.xlsx) para importación.
**Prompt Empleado:**
> "Sprint 4: RF-FU-014 (Plantilla Excel). 1. RED: Crea un endpoint GET /formatos/plantilla/ que intente descargar un archivo .xlsx y falle porque la ruta no existe. 2. GREEN: Implementa el endpoint usando StreamingResponse y un buffer en memoria para generar el Excel con columnas 'SKU' y 'Cantidad'. 3. REFACTOR: Asegura que el archivo tenga headers estándar y formato de celdas básico. 4. Actualización: Marca RF-FU-014 como ✅ Listo."

### Prompt 16: Ejecución RF-FU-015 (Mapeo dinámico de columnas)
**Fecha:** 05/07/2026
**Objetivo:** Permitir que el usuario defina su propio mapeo de columnas (ej. "Código" -> "SKU") durante la importación.
**Prompt Empleado:**
> "Sprint 4: RF-FU-015 (Mapeo dinámico). 1. RED: Crea un endpoint POST /formatos/importar-excel-mapeado/ que reciba un objeto JSON con el mapeo (ej. {'SKU': 'Codigo', 'Cantidad': 'Qty'}). Haz que falle si el Excel no cumple. 2. GREEN: Modifica ExcelImportService para aplicar un diccionario de traducción antes de validar con Pydantic. 3. REFACTOR: Asegura que el error reporte qué columna no se encontró. 4. Actualización: Marca RF-FU-015 como ✅ Listo."

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

### Prompt 23: Ejecución RF-CAT-003 (Buscador de productos)
**Fecha:** 06/07/2026
**Objetivo:** Implementar la búsqueda por texto (nombre, descripción, marca) en el catálogo con optimización de consulta.
**Prompt Empleado:**
> "Sprint 5: RF-CAT-003 (Buscador). 1. RED: Crea un endpoint GET /productos/buscar/ que acepte un parámetro 'q'. Verifica que filtre productos por nombre o descripción. 2. GREEN: Implementa la búsqueda en ProductQueryService. 3. REFACTOR: Aplica indexación básica y asegúrate de que sea insensible a mayúsculas/minúsculas. 4. Actualización: Marca RF-CAT-003 como ✅ Listo."

### Prompt 24: Ejecución RF-CAT-006 (Kits pre-armados)
**Fecha:** 06/07/2026
**Objetivo:** Implementar la lógica de negocio para Kits cuyo precio y stock se calculan dinámicamente.
**Prompt Empleado:**
> "Sprint 5: RF-CAT-006 (Kits). 1. RED: Crea un endpoint GET /kits/{id}/ que retorne un Kit con precio y stock calculados (mínimo de componentes). 2. GREEN: Implementa KitService que combine los productos asociados al Kit. 3. REFACTOR: Asegura que el stock del kit se actualice en tiempo real basándose en sus componentes. 4. Actualización: Marca RF-CAT-006 como ✅ Listo."

### Prompt 25: Ejecución RF-CAT-005 (Exploración de Categorías)
**Fecha:** 06/07/2026
**Objetivo:** Implementar el listado de categorías con conteo dinámico de productos activos.
**Prompt Empleado:**
> "Sprint 5: RF-CAT-005 (Categorías). 1. RED: Crea endpoint GET /categorias/ que retorne una lista de categorías únicas y su respectivo contador de productos. 2. GREEN: Implementa lógica en un nuevo CategoryQueryService. 3. REFACTOR: Asegura que el conteo solo considere productos con is_active=True. 4. Actualización: Marca RF-CAT-005 como ✅ Listo."