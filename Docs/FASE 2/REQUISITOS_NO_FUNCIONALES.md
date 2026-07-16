### RNF-SEG-001

**Nombre:** Idempotencia y Protección contra Replay en Webhooks y APIs Externas **Objetivo:** Garantizar que el procesamiento de eventos asíncronos y solicitudes de sistemas externos no genere efectos secundarios duplicados ni permita la reutilización de credenciales temporales. **Justificación:** La arquitectura depende de integraciones server-to-server (MercadoPago y Distributor) donde la red puede reenviar payloads. La falta de idempotencia corrompe el estado financiero (pedidos duplicados) y el inventario. **Artefactos relacionados:** Política de Idempotencia, Modelo de Dominio (`PaymentIdempotencyKey`, `NonceRegistry`), Decisiones Técnicas (Sesión 1). **RF relacionados:** RF-CHK-004, RF-DIS-001. **Módulos afectados:** MOD-CHK-01, MOD-DIS-01. **Prioridad:** Crítica (MVP). **Criterios verificables:**

1. Enviar el mismo payload de webhook de MercadoPago 5 veces en un lapso de 500ms resulta en exactamente 1 transición de estado de `Order` y 4 respuestas HTTP 200 sin mutaciones.
2. Reutilizar un `nonce` de la API Distributor dentro de una ventana de 24 horas retorna HTTP 409 sin procesar el batch. **Riesgos mitigados:** Fraude por replay, duplicación de cobros, corrupción de inventario por sincronizaciones repetidas. **Dependencias:** Base de datos (índices únicos en tablas de idempotencia), Reloj del servidor (NTP sincronizado para validación de timestamps).

### RNF-SEG-002

**Nombre:** Aislamiento de Datos mediante Row Level Security (RLS) **Objetivo:** Asegurar que las consultas a la base de datos filtren automáticamente los registros a nivel de fila basándose en el contexto de la sesión, independientemente de la lógica de la capa de aplicación. **Justificación:** El modelo Zero Trust y la matriz RBAC exigen que un CUSTOMER o SELLER nunca pueda acceder a datos de otro tenant, incluso si la capa de aplicación (FastAPI/Next.js) tiene un bug o es bypassed. **Artefactos relacionados:** Matriz RBAC, Política Zero Trust, Esquema de Base de Datos. **RF relacionados:** RF-FU-010, RF-CHK-006, RF-CON-001, RF-COT-001. **Módulos afectados:** MOD-FU-01, MOD-CHK-01, MOD-CON-01, MOD-COT-01, MOD-SEL-01. **Prioridad:** Crítica (MVP). **Criterios verificables:** Inyectar un JWT válido de CUSTOMER A en una consulta directa a la base de datos solicitando registros de CUSTOMER B retorna 0 filas (no error 403). **Riesgos mitigados:** Fuga de datos cross-tenant, acceso no autorizado a información financiera o de contacto. **Dependencias:** PostgreSQL 15+, Configuración de variables de sesión (`app.current_user_id`, `app.current_role`).

### RNF-REN-001

**Nombre:** Latencia de Respuesta en Búsqueda y Filtrado de Catálogo **Objetivo:** Limitar el tiempo de respuesta del sistema ante operaciones de lectura masiva con múltiples criterios de filtrado simultáneos. **Justificación:** El catálogo es el punto de entrada principal del funnel de conversión. Una latencia alta en la búsqueda incrementa la tasa de abandono antes de que el usuario interactúe con el Formato Único. **Artefactos relacionados:** RNF-CAT-001 (reservado en MOD-CAT-01), Arquitectura de Capas. **RF relacionados:** RF-CAT-001. **Módulos afectados:** MOD-CAT-01. **Prioridad:** Alta (MVP). **Criterios verificables:** El percentil 95 (P95) de las respuestas de la API de búsqueda con 3 filtros activos (categoría, marca, rango de precio) es menor a 300ms bajo una carga de 50 usuarios concurrentes. **Riesgos mitigados:** Abandono del funnel de ventas, mala experiencia de usuario (UX). **Dependencias:** Índices de base de datos en `Product`, estrategia de caché (ISR/SSG en Next.js).

### RNF-REN-002

**Nombre:** Tiempo de Generación y Descarga de Documentos PDF **Objetivo:** Acotar el tiempo máximo de procesamiento síncrono para la generación de documentos comerciales complejos. **Justificación:** La transición a COTIZACIÓN requiere fijar precios y generar un PDF. Si este proceso es lento, bloquea el hilo de ejecución y degrada la percepción de inmediatez del sistema B2B. **Artefactos relacionados:** RNF-CHK-001 (reservado en MOD-CHK-01 para webhooks, aplicable por analogía de procesamiento), Arquitectura de Servicios. **RF relacionados:** RF-FU-005, RF-FU-007, RF-COT-003. **Módulos afectados:** MOD-FU-01, MOD-COT-01. **Prioridad:** Alta (MVP). **Criterios verificables:** La solicitud de generación de PDF para un Formato Único con 50 ítems se completa y el archivo está disponible para descarga en menos de 3 segundos. **Riesgos mitigados:** Timeouts de gateway, bloqueo de hilos en el servidor de aplicaciones, abandono del flujo B2B. **Dependencias:** Librería de generación de PDF (ej. WeasyPrint/Puppeteer), almacenamiento de objetos (S3/Supabase Storage).

### RNF-INT-001

**Nombre:** Atomicidad y Validez de Transiciones de Máquina de Estados (FSM) **Objetivo:** Garantizar que los cambios de estado en las entidades de dominio (Formato Único, Pedido) se ejecuten como transacciones atómicas y respeten estrictamente el diagrama de estados definido. **Justificación:** El núcleo del negocio (Formato Único) depende de transiciones irreversibles (ej. BORRADOR a COTIZACIÓN). Una transición parcial o inválida corrompe el ciclo de vida comercial. **Artefactos relacionados:** FSM-01, FSM-02, Modelo de Dominio. **RF relacionados:** RF-FU-004, RF-FU-005, RF-FU-006, RF-CHK-004, RF-CHK-005. **Módulos afectados:** MOD-FU-01, MOD-CHK-01. **Prioridad:** Crítica (MVP). **Criterios verificables:** Intentar forzar una transición no definida en la FSM (ej. de COTIZACIÓN directamente a BORRADOR sin pasar por EXPIRADA) retorna un error de dominio 409 y no altera el estado actual en la base de datos. **Riesgos mitigados:** Corrupción de datos de negocio, inconsistencias entre el estado del FU y el estado del Order. **Dependencias:** Motor de base de datos (transacciones ACID), Capa de Servicios de Dominio.

### RNF-INT-002

**Nombre:** Inmutabilidad de Snapshots de Precios y Stock **Objetivo:** Asegurar que los valores económicos y de disponibilidad capturados en el momento de una transición comercial no se alteren retroactivamente por cambios en el catálogo maestro. **Justificación:** Una cotización o un pedido representan un contrato comercial. Si el precio público cambia en el catálogo, las transacciones históricas o vigentes no deben verse afectadas para mantener la integridad financiera y legal. **Artefactos relacionados:** Modelo de Dominio (`price_at_time`), Regla de Negocio RN-CHECKOUT-02. **RF relacionados:** RF-FU-005, RF-FU-006, RF-COT-002. **Módulos afectados:** MOD-FU-01, MOD-COT-01, MOD-ADM-01. **Prioridad:** Crítica (MVP). **Criterios verificables:** Modificar el `price_public` de un producto a través de MOD-ADM-01 no altera el valor de `price_at_time` en los `FormatoUnicoItem` que ya transicionaron a COTIZACIÓN o PEDIDO. **Riesgos mitigados:** Disputas comerciales, pérdidas financieras por cambios de precios retroactivos, auditorías fallidas. **Dependencias:** Diseño del esquema de base de datos (columnas de snapshot vs foreign keys directas).

### RNF-AUD-001

**Nombre:** Inmutabilidad y Retención de Registros de Auditoría **Objetivo:** Garantizar que todo evento mutante del sistema se registre de forma inmutable y se preserve según la política de retención, sin posibilidad de alteración ni eliminación por parte de usuarios con privilegios. **Justificación:** El cumplimiento normativo y la trazabilidad Zero Trust exigen que ni siquiera un ADMIN pueda borrar su propio rastro. La retención de 12 meses equilibra el cumplimiento legal con el costo de almacenamiento. **Artefactos relacionados:** AUTO-SYS-001, AUTO-SYS-003, Política de Retención (12 meses). **RF relacionados:** RF-SYS-001, RF-SYS-002, RF-ADM-008. **Módulos afectados:** MOD-SYS-01, MOD-ADM-01. **Prioridad:** Alta (MVP). **Criterios verificables:** Ejecutar un comando SQL `DELETE` o `UPDATE` directo sobre la tabla `audit_logs` con credenciales de ADMIN es rechazado por la base de datos (trigger o política RLS). **Riesgos mitigados:** Manipulación de evidencia forense, incumplimiento de normativas de retención de datos. **Dependencias:** Base de datos (Triggers/RLS), Job programado (Scheduler) para anonimización post-12 meses.

### RNF-DIS-001

**Nombre:** Degradación Graceful ante Fallos de Pasarela de Pago **Objetivo:** Mantener la operatividad del sistema y la integridad de los datos locales cuando el proveedor externo de pagos (MercadoPago) experimenta indisponibilidad o latencia extrema. **Justificación:** El checkout es el punto crítico de conversión. Si la pasarela falla, el sistema no debe perder la intención de compra (el Formato Único) ni corromper el estado del Pedido local. **Artefactos relacionados:** Arquitectura de Integraciones, FSM-02. **RF relacionados:** RF-CHK-003, RF-CHK-005. **Módulos afectados:** MOD-CHK-01. **Prioridad:** Alta (MVP). **Criterios verificables:** Simular un timeout de 30 segundos en la API de MercadoPago durante la creación de la preferencia de pago resulta en un error controlado en la UI, manteniendo el `Order` en `PENDING_PAYMENT` y el `FormatoUnico` en `PEDIDO`, permitiendo reintentar sin perder datos. **Riesgos mitigados:** Pérdida de ventas por errores transitorios, carritos abandonados por falta de reintento. **Dependencias:** Mecanismos de timeout y retry en el cliente HTTP, FSM del Pedido.

### RNF-MAN-001

**Nombre:** Cumplimiento de Puertas de Calidad en Pipeline DevSecOps **Objetivo:** Asegurar que el código fuente cumpla con los umbrales de seguridad estática y cobertura de pruebas antes de ser integrado o desplegado, utilizando las herramientas estandarizadas del equipo. **Justificación:** La metodología del curso GRI y la arquitectura SpecDD exigen que la seguridad y la calidad no sean actividades manuales, sino gates automatizados e intransigentes en el CI/CD. **Artefactos relacionados:** Pipeline DevSecOps (Jenkinsfile), desarrollo-GRI.md (Bloque 4.X.9). **RF relacionados:** Transversal a todos los módulos. **Módulos afectados:** Todos (MOD-CAT-01 a MOD-SYS-01). **Prioridad:** Alta (MVP). **Criterios verificables:** El pipeline de Jenkins bloquea la etapa 4 (Security Gate) si Trivy o Semgrep reportan hallazgos de severidad CRITICAL o HIGH. El merge a la rama principal es rechazado si la cobertura de pytest es < 80%. **Riesgos mitigados:** Introducción de vulnerabilidades conocidas (CVEs), deuda técnica de seguridad, código no probado en producción. **Dependencias:** Jenkins, SonarQube, Trivy, Semgrep, GitHub/GitLab.

### RNF-ESC-001

**Nombre:** Throughput de Procesamiento de Lotes de Sincronización **Objetivo:** Definir la capacidad del sistema para procesar actualizaciones masivas de inventario y precios desde el Distributor sin bloquear las operaciones de lectura del catálogo público. **Justificación:** La sincronización de stock es vital para evitar sobreventas. Si el Distributor envía un batch de 5000 SKUs, el sistema debe procesarlo en un tiempo acotado sin degradar el rendimiento para los usuarios que navegan el catálogo. **Artefactos relacionados:** Arquitectura de Integraciones, Patrón de Procesamiento Parcial (MOD-DIS-01). **RF relacionados:** RF-DIS-002, RF-DIS-003, RF-DIS-004. **Módulos afectados:** MOD-DIS-01, MOD-CAT-01. **Prioridad:** Media (MVP+). **Criterios verificables:** El sistema procesa un payload JSON de 1000 SKUs en menos de 10 segundos, y durante este procesamiento, el tiempo de respuesta de la API de búsqueda de catálogo (RF-CAT-001) no se degrada más de un 20% respecto a su baseline. **Riesgos mitigados:** Bloqueo de tablas de base de datos, timeouts en la API del Distributor, degradación del servicio público. **Dependencias:** Estrategia de indexación de BD, posible uso de colas de mensajes o procesamiento en chunks.

## 🆕 EXTENSIONES v1.2 (14 Mejoras UI/UX e Integraciones)

> **Nota:** Este documento consolida el registro histórico. En la iteración actual (Fase 4), el sistema cuenta con un total de 49 RNFs únicos trazados a través de todos los módulos. No reemplazan ni renumeran los anteriores.

---

### 🎨 RNF de Interfaz de Usuario (UI)

**RNF-UI-001: Paleta de Colores Corporativa**
El sistema debe usar Turquesa/Verde Esmeralda (#10B981) como color primario en CTAs, gris oscuro (#111827) para texto, gris claro (#9CA3AF) para metadatos, y estados semánticos (verde/rojo/naranja).
- **Actores afectados:** GUEST, CUSTOMER, SELLER, ADMIN
- **Aplica a:** Todas las pantallas

**RNF-UI-002: Accesibilidad WCAG AA**
Los textos superpuestos a imágenes oscuras deben tener contraste mínimo 4.5:1 (blanco o gris muy claro sobre fondos oscuros).
- **Actores afectados:** GUEST, CUSTOMER, SELLER, ADMIN
- **Aplica a:** Hero image, banners, overlays

**RNF-UI-003: Efecto Bokeh en Hero y Destacados**
Las imágenes hero y productos destacados en landing deben aplicar efecto visual Bokeh (desenfoque artístico) sin afectar performance (<200ms de carga adicional).
- **Actores afectados:** GUEST, CUSTOMER
- **Aplica a:** Landing page, productos destacados

---

###  RNF de Performance (PERF)

**RNF-PERF-006: Carga Masiva Excel**
El sistema debe procesar archivos Excel de hasta 5MB y 1000 filas en menos de 5 segundos, mostrando progreso visual.
- **Actores afectados:** GUEST, CUSTOMER
- **Aplica a:** MOD-FU-01 (carga masiva)

**RNF-PERF-007: Precio Dinámico de Kits**
El cálculo de precio de Kits debe realizarse en menos de 200ms incluso con Kits de 20+ componentes.
- **Actores afectados:** GUEST, CUSTOMER
- **Aplica a:** MOD-CAT-01 (Kits)

---

### 🔒 RNF de Seguridad (SEC)

**RNF-SEC-008: Firma HMAC en Webhooks MP**
Todos los webhooks de Mercado Pago deben validar firma HMAC-SHA256 antes de procesar.
- **Actores afectados:** SISTEMA (automático)
- **Aplica a:** MOD-CHK-01 (webhooks)

---

###  RNF de Integración (INT)

**RNF-INT-003: Integración Telegram (Deep Links)**
La integración con Telegram debe funcionar mediante deep links (t.me) sin requerir bot bidireccional en MVP.
- **Actores afectados:** GUEST, CUSTOMER, SELLER
- **Aplica a:** MOD-CAT-01, MOD-FU-01

---

###  RNF de Usabilidad (USE)

**RNF-USE-004: Responsive Mobile-First**
Todas las nuevas vistas (Landing, Dashboard, Kits) deben ser responsive con breakpoints mobile-first (sm: 640px, md: 768px, lg: 1024px).
- **Actores afectados:** GUEST, CUSTOMER, SELLER, ADMIN
- **Aplica a:** Todas las nuevas pantallas

---

### 🛡️ RNF de Confiabilidad (REL)

**RNF-REL-005: Webhooks Mercado Pago**
El endpoint de webhooks de Mercado Pago debe tener disponibilidad 99.9% y procesar eventos en menos de 2 segundos.
- **Actores afectados:** SISTEMA (automático)
- **Aplica a:** MOD-CHK-01 (webhooks)

**RNF-REL-006: Persistencia Durable del Formato Único**

**Nombre:** Durabilidad del Formato Único ante reinicios del proceso backend. **Objetivo:** Garantizar que ningún Formato Único (carrito, cotización, consulta o pedido) se pierda por un reinicio, caída o redeploy del servidor. **Justificación:** Reporte de soporte real — un CUSTOMER generó una cotización y, tras volver a ingresar a su cuenta un día después, ya no la encontraba. La causa era que `USE_MOCK_DB=True` hacía que `FormatoUnicoService` operara sobre `InMemoryFormatoRepository`, un diccionario Python que vive únicamente en la RAM del proceso — cualquier reinicio del backend (incluyendo los reinicios rutinarios de desarrollo/despliegue) borraba permanentemente todos los carritos y cotizaciones de todos los usuarios, sin excepción y sin registro alguno para recuperarlos. **Artefactos relacionados:** `SupabaseFormatoRepository`, Migraciones Alembic `5f3a8d21e9c4`/`7c2e4b91a5d8`, RN-FU-09. **RF relacionados:** RF-FU-001 a RF-FU-021 (todo el ciclo de vida del Formato Único). **Módulos afectados:** MOD-FU-01, MOD-CON-01, MOD-COT-01, MOD-CHK-01. **Prioridad:** Crítica. **Criterios verificables:**

1. Generar una cotización, reiniciar por completo el proceso backend (`uvicorn`), y verificar que `GET /formatos/historial` sigue devolviendo la cotización con sus ítems intactos.
2. Tras el Patrón de Clonación (generar cotización), `GET /formatos/me` debe seguir resolviendo el borrador vacío reseteado — no la cotización recién clonada — incluso contra la base de datos real (no solo en memoria).
3. Las vistas de SELLER (`GET /cotizaciones`, `GET /consultas`) deben reflejar los Formatos Únicos creados por CUSTOMER/GUEST a través de la API pública, sin repositorios aislados que las dejen siempre vacías.
4. Un webhook `approved` de Mercado Pago sobre un Formato Único en `PEDIDO` persistido en la base de datos real debe transicionarlo a `CONFIRMADO` (no fallar con `404` por buscarlo en un repositorio en memoria distinto al que usó `/checkout` para crearlo).

**Riesgos mitigados:** Pérdida silenciosa e irrecuperable de intención de compra (carritos, cotizaciones) ante cualquier reinicio del servidor; vistas de SELLER (consultas/cotizaciones) permanentemente vacías por desincronización de repositorios. **Dependencias:** `DATABASE_URL` (PostgreSQL/Supabase), esquema de base de datos sincronizado vía Alembic (sin columnas faltantes respecto al modelo SQLModel).
- **Actores afectados:** GUEST, CUSTOMER, SELLER
- **Aplica a:** MOD-FU-01, MOD-CON-01, MOD-COT-01