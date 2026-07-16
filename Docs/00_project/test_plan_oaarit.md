# Plan de Pruebas y Aseguramiento de Calidad — Sistema Alling

|Campo|Valor|
|---|---|
|**ID Documento**|DOC_ALLING_TEST_PLAN_001|
|**Versión**|1.0.0|
|**Estado**|Borrador (pendiente VoBo)|
|**Fuente de verdad**|`functional_requirements.md`, `non_functional_requirements.md`, `business_rules.yaml`, `rbac_policy.md`, `zero_trust_actors.md`, `desarrollo-GRI.md`|
|**Metodología**|OAARIT (Oscar Alejandro Arreola Ramírez) + Spec-Driven Development (SDD) + TDD|
|**Fecha**|30 de junio de 2026|
|**Plazo de Ejecución**|5 días (Sprint MVP)|

---

## 1. Introducción y Alcance

### 1.1 Propósito

Este documento establece la estrategia, alcance, recursos y cronograma para las actividades de pruebas del sistema **Alling** (e-commerce B2B/B2C de redes y fibra óptica). Su objetivo es garantizar que el MVP cumpla con los 55 Requisitos Funcionales (RF) y 28 Requisitos No Funcionales (RNF) definidos, bajo los principios de **Zero Trust** y el marco de calidad **OAARIT**.

### 1.2 Alcance (In-Scope)

- **Backend (Python/FastAPI):** Pruebas unitarias, de integración (con Postgres real) y de seguridad (RLS, RBAC, HMAC).
- **Frontend (Next.js 15):** Pruebas End-to-End (E2E) de flujos críticos y componentes visuales.
- **Integraciones:** MercadoPago Sandbox (webhooks idempotentes) y Shalom Mock (generación de guías).
- **Arquitectura Zero Trust:** Validación exhaustiva de Row Level Security (RLS) y Middleware de autenticación.
- **Pipeline GRI:** Ejecución y reporte de análisis estático (SAST/SCA) según la plantilla fija del curso.

### 1.3 Fuera de Alcance (Out-of-Scope)

- Pruebas de carga masiva (stress testing) superiores a 100 usuarios concurrentes.
- Pruebas de penetración éticas avanzadas (pentesting manual).
- Validación de integraciones reales de Shalom (se usa mock).
- Pruebas en dispositivos móviles nativos (solo web responsive vía Playwright).

---

## 2. Estrategia de Pruebas (Test Strategy)

Se aplicará un enfoque de **Pirámide de Pruebas** con énfasis en TDD (Test-Driven Development) para el backend y Property-Based Testing para la API.

### 2.1 Niveles de Prueba

#### A. Pruebas Unitarias (Backend - Python)

- **Herramienta:** `pytest` + `pytest-asyncio` + `pytest-cov`.
- **Enfoque:** Aislar la lógica de dominio (Máquina de Estados del Formato Único, cálculos de IGV, validaciones Pydantic).
- **Cobertura objetivo:** ≥ 80% de líneas de código en módulos productivos.
- **Ejemplo:** `TC_ALLING_UNIT_FSM_001` (Validar que un FU en estado PEDIDO no permite edición de ítems).

#### B. Pruebas de Integración (Backend + Base de Datos)

- **Herramienta:** `Testcontainers` (PostgreSQL 15) + `SQLModel`.
- **Enfoque:** Verificar que las queries y transacciones funcionen correctamente contra una base de datos real, incluyendo la ejecución de políticas RLS.
- **Clave:** Cada test de integración levanta un contenedor Docker efímero de Postgres, aplica el esquema y las políticas RLS, ejecuta el test y destruye el contenedor.

#### C. Property-Based Testing (API REST)

- **Herramienta:** `Schemathesis`.
- **Enfoque:** Generar miles de payloads aleatorios (incluyendo casos límite y maliciosos) contra el schema OpenAPI 3.1 de FastAPI para detectar errores 500 no manejados o violaciones de contrato.

#### D. Pruebas End-to-End (E2E - Frontend)

- **Herramienta:** `Playwright` (Python/TypeScript).
- **Enfoque:** Simular el flujo completo de usuario: Navegar catálogo → Agregar al Formato Único → Checkout → Pago (Mock) → Confirmación.
- **Navegadores:** Chrome, Firefox, WebKit (últimas versiones).

#### E. Pruebas de Seguridad (Zero Trust)

- **Enfoque:**
    - **RLS Penetration Testing:** Intentar acceder a datos de otro tenant inyectando JWTs de diferentes usuarios.
    - **Webhook Security:** Reenviar webhooks de MercadoPago (replay attacks) y verificar idempotencia.
    - **DISTRIBUTOR API:** Intentar sincronizar stock con firmas HMAC inválidas o nonces reutilizados.

---

## 3. Sistema de Homoclaves y Nomenclatura OAARIT

Para garantizar la trazabilidad absoluta, todos los artefactos de prueba seguirán la nomenclatura canónica `TC_ALLING_[NIVEL]_[MODULO]_[NNN]`.

### 3.1 Estructura de Homoclaves

|Nivel|Formato|Ejemplo|Descripción|
|---|---|---|---|
|**Unitario**|`TC_ALLING_UNIT_[MOD]_[NNN]`|`TC_ALLING_UNIT_FSM_005`|Prueba de lógica de dominio aislada (sin DB).|
|**Integración**|`TC_ALLING_INT_[MOD]_[NNN]`|`TC_ALLING_INT_PAY_003`|Prueba con DB real o servicios externos (MP Mock).|
|**E2E**|`TC_ALLING_E2E_[NNN]`|`TC_ALLING_E2E_007`|Flujo completo de UI (Frontend + Backend).|
|**Seguridad**|`TC_ALLING_SEC_[MOD]_[NNN]`|`TC_ALLING_SEC_RLS_001`|Pruebas específicas de seguridad (RLS, HMAC, JWT).|
|**Performance**|`TC_ALLING_PERF_[MOD]_[NNN]`|`TC_ALLING_PERF_001`|Pruebas de tiempos de respuesta y carga.|
|**Defecto**|`DEF_ALLING_[MOD]_[NNN]`|`DEF_ALLING_CHK_002`|Hallazgo documentado durante la ejecución.|
|**Evidencia**|`EV_ALLING_[TIPO]_[NNN]`|`EV_ALLING_SCREENSHOT_015`|Artefacto generado (log, screenshot, video, JSON).|

### 3.2 Módulos de Referencia (MOD)

- `CAT`: Catálogo
- `FU`: Formato Único
- `CHK`: Checkout y Pagos
- `CON`: Consulta Pre-Venta
- `COT`: Cotización
- `SEL`: Panel SELLER
- `ADM`: Panel ADMIN
- `AUT`: Autenticación
- `DIS`: Integración DISTRIBUTOR
- `SYS`: Sistema Transversal

---

## 4. Matriz de Trazabilidad (Plantilla)

La trazabilidad es el pilar del marco OAARIT. Cada Requisito Funcional (RF) debe estar vinculado a al menos un Caso de Prueba (TC), y cada TC debe tener una Evidencia (EV) asociada.

### 4.1 Plantilla de Matriz

|ID Requisito (RF)|Descripción Breve|ID Caso de Prueba (TC)|Tipo de Prueba|Estado (Pass/Fail/Block)|ID Evidencia (EV)|
|---|---|---|---|---|---|
|`RF-FU-005`|Generar cotización (BORRADOR → COTIZACIÓN)|`TC_ALLING_UNIT_FSM_003`|Unitaria|Pass|`EV_ALLING_LOG_001`|
|`RF-FU-005`|Generar cotización (BORRADOR → COTIZACIÓN)|`TC_ALLING_INT_FU_002`|Integración|Pass|`EV_ALLING_DB_001`|
|`RF-CHK-004`|Confirmar pago (Webhook idempotente)|`TC_ALLING_SEC_PAY_001`|Seguridad|Pass|`EV_ALLING_LOG_012`|
|`RF-SEL-002`|Actualizar stock (Validación ≥ 0)|`TC_ALLING_UNIT_SEL_001`|Unitaria|Pass|`EV_ALLING_LOG_015`|

### 4.2 Reglas de Trazabilidad

1. **Cobertura 1:1 mínimo:** Todo RF crítico (Prioridad MVP) debe tener al menos 1 TC Unitario y 1 TC de Integración.
2. **RNF vinculados:** Los RNF de seguridad (`RNF-SEC-*`) deben tener TCs específicos de seguridad (`TC_ALLING_SEC-*`).
3. **Defectos trazados:** Todo `DEF_ALLING_*` debe referenciar el `TC_ALLING_*` que lo detectó y el `RF-*` que violó.

---

## 5. Criterios de Aceptación y Definition of Done (DoD)

Ninguna funcionalidad se considerará "Terminada" hasta que cumpla estrictamente con el siguiente DoD.

### 5.1 Definition of Done (DoD) por Feature

|ID|Criterio DoD|Verificación|
|---|---|---|
|**DoD-01**|Spec aprobada y trazada a RFs.|Revisión de `functional_requirements.md`.|
|**DoD-02**|Tests unitarios escritos **antes** del código (TDD).|Historial de commits y reporte `pytest-cov`.|
|**DoD-03**|Cobertura de código ≥ 80% en módulos productivos.|Gate de CI/CD (`coverage.xml`).|
|**DoD-04**|Tests de integración pasan con Postgres real (Testcontainers).|Ejecución local de `pytest tests/integration`.|
|**DoD-05**|Schemathesis no reporta errores 5xx no esperados.|Reporte `schemathesis run http://localhost:8000/openapi.json`.|
|**DoD-06**|Políticas RLS validadas (0 fugas cross-tenant).|`TC_ALLING_SEC_RLS_*` en verde.|
|**DoD-07**|Cero defectos Críticos o Altos abiertos.|Revisión de `DEF_ALLING_*` en tablero.|
|**DoD-08**|Evidencias de ejecución cargadas en el repo.|Carpeta `/evidence/` con logs y screenshots.|
|**DoD-09**|Pipeline GRI ejecutado y reportes generados.|Capturas de Jenkins/SonarQube/Trivy.|

### 5.2 Criterios de Exit (Sprint MVP)

- 100% de los RFs de prioridad **MVP** implementados y probados.
- 0 Defectos de Severidad **Critical** o **High**.
- Cobertura de código backend ≥ 75% (objetivo 80%, mínimo aceptable 75% por plazo).
- Flujo E2E "Happy Path" (Catálogo → Checkout → Pago) funcionando en Vercel Preview.

---

## 6. Entorno de Pruebas y Herramientas

### 6.1 Stack de Pruebas

|Herramienta|Versión|Uso en Alling|
|---|---|---|
|**Pytest**|8.x|Motor principal de pruebas backend (Unit/Int).|
|**Testcontainers**|0.3.x|Levantar Postgres 15 efímero para tests de integración y RLS.|
|**Schemathesis**|3.27.x|Property-based testing sobre OpenAPI.|
|**Playwright**|1.45.x|Pruebas E2E de frontend Next.js.|
|**pytest-cov**|5.x|Medición de cobertura de código.|
|**Factory Boy**|3.3.x|Generación de fixtures y datos de prueba (Fakers).|
|**HTTPX**|0.27.x|Cliente asíncrono para tests de FastAPI (`TestClient`).|

### 6.2 Estrategia de Mocks

Dado que el MVP no tendrá integraciones productivas reales, se usarán mocks estrictos:

1. **MercadoPago Sandbox:**
    - Se usarán las credenciales de prueba (`TEST-...`) proporcionadas por MP.
    - Para tests de integración locales, se mockeará la respuesta del webhook usando `responses` o `httpx.MockTransport` para simular `status=approved` y `status=rejected`.
2. **Shalom (Logística):**
    - Se implementará un `ShippingServiceMock` que retorne un `tracking_code` hardcoded (ej: `SHALOM-TEST-123`) y un tiempo de entrega simulado de 24h.
3. **DISTRIBUTOR API:**
    - Se probará el endpoint de sincronización enviando requests firmados con HMAC generados en el mismo test (usando la `SECRET_KEY` de prueba).

---

## 7. Plan de Ejecución y Cronograma (5 Días)

Alineado con la restricción de tiempo del proyecto, las pruebas se ejecutarán en paralelo con el desarrollo (TDD).

### Día 1: Fundamentos y Autenticación

- **Desarrollo:** Setup, Modelos User/Product, Auth Google/JWT.
- **Pruebas:**
    - `TC_ALLING_UNIT_AUT_*`: Validación de schemas Pydantic (DNI, RUC, Email).
    - `TC_ALLING_INT_AUT_*`: Login exitoso, login fallido, cuenta suspendida.
    - `TC_ALLING_SEC_AUT_*`: Intento de acceso a ruta protegida sin JWT.

### Día 2: Formato Único (El Corazón)

- **Desarrollo:** FSM del Formato Único, transiciones de estado.
- **Pruebas:**
    - `TC_ALLING_UNIT_FSM_*`: **Crítico.** Probar todas las transiciones permitidas y prohibidas (ej: GUEST no puede ir a COTIZACIÓN).
    - `TC_ALLING_INT_FU_*`: Crear FU, agregar ítems, validar stock.

### Día 3: Checkout y Pagos

- **Desarrollo:** Order, Webhook MercadoPago, Idempotencia.
- **Pruebas:**
    - `TC_ALLING_INT_CHK_*`: Crear Order desde FU, calcular envío.
    - `TC_ALLING_SEC_PAY_*`: **Crítico.** Enviar el mismo webhook 5 veces y verificar que solo se procesa una vez (Idempotencia).
    - `TC_ALLING_SEC_PAY_002`: Enviar webhook con firma HMAC inválida (debe retornar 401).

### Día 4: Paneles SELLER/ADMIN y RLS

- **Desarrollo:** Endpoints de gestión, políticas RLS en Postgres.
- **Pruebas:**
    - `TC_ALLING_SEC_RLS_*`: **Crítico.** Conectar como CUSTOMER A e intentar hacer `SELECT` sobre pedidos de CUSTOMER B. Debe retornar 0 filas (no error 403, para no filtrar existencia).
    - `TC_ALLING_INT_SEL_*`: SELLER actualiza stock, valida que no sea negativo.

### Día 5: E2E, Integración Final y Pipeline GRI

- **Desarrollo:** Conexión Frontend-Backend, Deploy Vercel.
- **Pruebas:**
    - `TC_ALLING_E2E_001`: Flujo completo GUEST (Catálogo → Checkout → Pago Mock).
    - `TC_ALLING_E2E_002`: Flujo completo CUSTOMER (Cotización → Pago).
    - **Pipeline GRI:** Ejecutar Jenkinsfile, capturar evidencias de SonarQube, Semgrep, Trivy.

---

## 8. Gestión de Defectos

Todo defecto encontrado será documentado en el archivo `defect_log.md` siguiendo el formato OAARIT.

### 8.1 Clasificación de Severidad

|Severidad|Definición|Ejemplo en Alling|SLA de Resolución|
|---|---|---|---|
|**Critical**|Bloquea el flujo principal o compromete seguridad (fuga de datos).|RLS permite ver pedidos de otros usuarios. Webhook de pago duplica órdenes.|Inmediato (Stop the line)|
|**High**|Funcionalidad importante rota, sin workaround.|No se puede generar el PDF de cotización. Stock permite valores negativos.|< 4 horas|
|**Medium**|Funcionalidad rota con workaround disponible.|El filtro de marca en el catálogo no ordena alfabéticamente.|< 24 horas|
|**Low**|Problemas cosméticos, tipográficos o de UX menor.|Color de botón incorrecto en modo oscuro. Toast de éxito dura poco.|Antes del VoBo final|

### 8.2 Plantilla de Reporte de Defecto

### DEF_ALLING_[MOD]_[NNN]

- **Título:** [Descripción corta del fallo]
- **Severidad:** [Critical/High/Medium/Low]
- **Prioridad:** [P1/P2/P3]
- **Módulo:** [MOD-XXX]
- **Requisito Violado:** [RF-XXX o RNF-XXX]
- **Caso de Prueba:** [TC_ALLING_XXX]
- **Evidencia:** [EV_ALLING_XXX (link a screenshot/log)]
- **Pasos para Reproducir:**
  1. ...
  2. ...
- **Resultado Esperado:** ...
- **Resultado Actual:** ...
- **Estado:** [Open/In Progress/Fixed/Closed]

---

## 9. Riesgos y Mitigaciones

|ID|Riesgo|Probabilidad|Impacto|Mitigación|
|---|---|---|---|---|
|**RSK-01**|**Tiempo insuficiente (5 días):** No alcanzar a cubrir todos los TCs planificados.|Alta|Alto|Priorizar TCs de Severidad Critical y High. Dejar TCs de UI (Low) para post-MVP.|
|**RSK-02**|**Falsos positivos en SAST/SCA (Pipeline GRI):** SonarQube o Semgrep bloquean el pipeline por código válido.|Media|Medio|Documentar en el reporte GRI (Bloque 4.X.8) justificando por qué es un falso positivo. No modificar el pipeline.|
|**RSK-03**|**Inestabilidad de Testcontainers:** Los contenedores de Postgres no levantan rápido en CI.|Media|Alto|Usar `reuse=True` en desarrollo local. En CI, aumentar timeouts de `pytest`.|
|**RSK-04**|**Cold Start en Vercel:** Los tests E2E fallan por timeouts en el primer request.|Media|Medio|Implementar endpoint `/api/health` y configurar Playwright con `timeout=30000` para el primer paso.|
|**RSK-05**|**Webhooks de MercadoPago no llegan al localhost:** Imposible probar el flujo de pago localmente.|Alta|Alto|Usar `ngrok` o `localtunnel` para exponer el puerto 8000, o mockear el webhook en tests de integración (preferido).|

---

## 10. Entregables

Al finalizar el Sprint MVP, se entregarán los siguientes artefactos en el repositorio:

1. **`test_plan_oaarit.md`** (Este documento).
2. **Carpeta `/tests/`:**
    - `/tests/unit/`: Tests unitarios de dominio y validación.
    - `/tests/integration/`: Tests de integración con DB y APIs.
    - `/tests/e2e/`: Scripts de Playwright.
    - `/tests/security/`: Tests específicos de RLS y HMAC.
3. **`/evidence/`:** Carpeta con logs de ejecución (`pytest.log`), reportes de cobertura (`htmlcov/`), y screenshots de Playwright.
4. **`defect_log.md`:** Registro de todos los defectos encontrados y su estado.
5. **Reporte Pipeline GRI:** Documento `reporte_gri_sistema_X.md` con las capturas y análisis de SonarQube, Trivy, etc. (Bloques 4.X.1 a 4.X.9).

---

## 11. Aprobación y VoBo

|Rol|Nombre|Firma|Fecha|
|---|---|---|---|
|**QA Lead / Analista**|[Tu Nombre]|_Digital_|30/06/2026|
|**Product Owner**|[Tu Nombre]|_Digital_|Pendiente|
|**Desarrollo Backend**|[Tu Nombre]|_Digital_|Pendiente|

---

## 🆕 EXTENSIONES v1.2 (Estrategia de Pruebas para Nuevas Integraciones)

### 1. Pruebas de Integración con Mercado Pago
- **Mock de Webhooks:** Simular payloads de MP (`approved`, `pending`, `rejected`) para validar transiciones FSM sin depender del entorno Sandbox.
- **Pruebas de Idempotencia:** Enviar el mismo webhook 5 veces y verificar que solo se procese una transición de estado.
- **Pruebas de Firma HMAC:** Intentar inyectar webhooks con firma inválida y verificar rechazo (HTTP 401).

### 2. Pruebas de Carga Masiva (Excel)
- **Pruebas de Estrés:** Subir archivos de 5MB con 1000 filas para validar el RNF-PERF-006 (<5 segundos).
- **Pruebas de Formatos:** Validar lectura de `.xls`, `.xlsx` y `.csv` con diferentes codificaciones (UTF-8, ISO-8859-1).
- **Pruebas de Mapeo:** Simular columnas con nombres distintos ("Codigo", "Qty") y validar el modal de mapeo dinámico.

### 3. Pruebas de Seguridad y RBAC
- **Pruebas de Inyección SQL:** Validar que los campos de búsqueda y carga Excel estén parametrizados.
- **Pruebas de Acceso:** Intentar acceder a `/admin/kits` con rol CUSTOMER y verificar redirección a 403.
- **Pruebas de Datos Sensibles:** Verificar que las credenciales de MP no aparezcan en logs ni en respuestas de API.

### 4. Pruebas de UI/UX (E2E con Playwright)
- **Flujo de Migración GUEST→CUSTOMER:** Validar que el carrito no se pierda al iniciar sesión desde el checkout.
- **Flujo de Reserva de Stock:** Validar visualmente el countdown de 30 min en la pantalla de pago.
- **Flujo de Telegram:** Verificar que el enlace `t.me` se genere correctamente con el mensaje pre-armado (URL encoded).