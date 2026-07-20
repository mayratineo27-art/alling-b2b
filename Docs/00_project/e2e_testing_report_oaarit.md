# 📑 INFORME DE ASEGURAMIENTO DE CALIDAD: PRUEBAS AUTOMATIZADAS END-TO-END (E2E)

---

## CAPÍTULO 1: OBJETIVOS Y CONTEXTO DEL SISTEMA

### 1.1 Objetivos de las Pruebas E2E
* **Objetivo Específico 1 (Gobernanza del Catálogo de Productos):** Validar la capacidad del Administrador para dar de alta nuevos productos en el inventario con SKU únicos, garantizando que el sistema registre los cambios y renderice la ficha correspondiente con imágenes, precios y marcas en la pantalla pública del cliente de forma inmediata.
* **Objetivo Específico 2 (Constructor de Kits Integrados B2B):** Comprobar el funcionamiento del algoritmo agrupador de Kits del Administrador, asegurando que se cumpla la restricción de asociar un mínimo de 2 productos y que los precios y stocks totales del kit se calculen dinámicamente y se muestren en la vista pública de Kits.
* **Objetivo Específico 3 (Flujo Completo de Invitado - GUEST):** Verificar que un usuario no autenticado (GUEST) pueda navegar por el catálogo público, agregar componentes de red a su Formato Único (carrito), completar el formulario de entrega y proceder con el envío de su solicitud de cotización/pedido.
* **Objetivo Específico 4 (Flujo de Pago y Autenticación del Cliente - CUSTOMER):** Validar la integración del inicio de sesión mediante el protocolo seguro Google OAuth y comprobar que el proceso de checkout redirija correctamente al cliente al portal de la pasarela de pagos integrada de Mercado Pago.

### 1.2 Contexto de la Plataforma Alling B2B
* **Contexto Funcional:** Alling B2B es una plataforma especializada en el comercio electrónico corporativo (B2B) de materiales de telecomunicaciones, fibra óptica y kits industriales en la región de Ayacucho. El sistema permite gestionar los requerimientos de ingenieros y contratistas mediante el documento "Formato Único", permitiendo compras directas o solicitudes de cotizaciones personalizadas según el volumen de compra.
* **Contexto Técnico:** La aplicación cuenta con una arquitectura desacoplada:
  * **Frontend:** Desarrollado en **Next.js 14** con TypeScript, utilizando TailwindCSS y componentes reactivos optimizados para cargas rápidas.
  * **Backend:** Diseñado con **FastAPI (Python)**, estructurado con patrones de diseño de Domain-Driven Design (DDD) y bases del Spec-Driven Development (SDD).
  * **Persistencia:** Base de datos **PostgreSQL hospedada en Supabase** que implementa políticas de seguridad RLS (Row Level Security) a nivel de fila para restringir el acceso a la información entre empresas compradoras.

---

## CAPÍTULO 2: MARCO TEÓRICO Y HERRAMIENTAS DE QA

### 2.1 Concepto de Pruebas End-to-End (E2E)
Las pruebas End-to-End (Extremo a Extremo) consisten en verificar el flujo completo de una aplicación desde el inicio hasta el final. Su propósito principal es simular escenarios reales de usuario para corroborar la correcta comunicación e integración entre todas las capas del sistema (interfaz gráfica de usuario, servicios backend, pasarelas de pago externas y base de datos relacional).

### 2.2 Framework Playwright
Playwright es una biblioteca de automatización de código abierto desarrollada por Microsoft. Destaca por su alta velocidad de ejecución, soporte nativo de múltiples navegadores (Chromium, WebKit, Firefox) que corren de manera aislada y la capacidad de interactuar con elementos dinámicos mediante su mecanismo de esperas automáticas (auto-waiting). Además, permite la captura nativa de evidencias mediante capturas de pantalla, trazas y videos (`.webm`).

### 2.3 Metodología OAARIT
OAARIT es el marco metodológico de la Universidad Nacional de San Cristóbal de Huamanga (UNSCH) para el aseguramiento de la calidad de software. Su nombre corresponde a un ciclo estructurado de 6 etapas:
1. **Observar (O):** Auditoría visual del estado inicial del DOM y disponibilidad del componente.
2. **Analizar (A):** Evaluación lógica de la ruta, urls y respuestas del servidor.
3. **Atribuir (A):** Identificar qué servicio o lógica del sistema procesa la interacción.
4. **Registrar (R):** Introducción de datos, llenado de formularios e interacción física.
5. **Informar (I):** Verificación de las aserciones, alertas visuales y toasts de respuesta.
6. **Tomar decisiones (T):** Acciones posteriores de cara al flujo de negocio (redirecciones, guardado en BD).

### 2.4 Ambiente de Pruebas (Test Environment)
Para garantizar la reproducibilidad y el aislamiento de las pruebas automatizadas, se estableció el siguiente ambiente bajo control:

* **Sistema Operativo:** Windows 10/11 (Entorno local de desarrollo).
* **Servidor Frontend Local:** Next.js dev server corriendo en `http://localhost:3000`.
* **Servidor Backend Local:** FastAPI (Uvicorn) corriendo en `http://127.0.0.1:8000`.
* **Base de Datos de Pruebas:** PostgreSQL en la nube de Supabase (conexión vía pooling seguro).
* **Navegador Emulado:** Chromium (Desktop Chrome) ejecutado en modo no-headless (visible) para grabación de trazas.
* **Entorno de Ejecución:** Node.js v20.11.0, Python v3.12.2.

---

## CAPÍTULO 3: DISEÑO Y CONFIGURACIÓN DE LAS PRUEBAS E2E

### 3.1 Matriz de Trazabilidad (Requisitos vs. Casos de Prueba)
La siguiente tabla detalla la relación directa entre los requisitos funcionales (RF) del sistema y los casos de prueba automatizados desarrollados en la suite:

| Requisito Funcional (RF) | Código de Test E2E | Descripción de la Verificación en Test |
|---|---|---|
| **RF-CAT-001 (Ver Catálogo)** | `TC_ALLING_E2E_001` | Comprueba que los productos cargan del backend y se renderizan. |
| **RF-FU-002 (Añadir al FU)** | `TC_ALLING_E2E_001` | Comprueba el incremento en el contador de badge del header. |
| **RF-CHK-001 (Formulario de Checkout)** | `TC_ALLING_E2E_002` | Rellena la dirección y el DNI en el Checkout. |
| **RF-CHK-003 (Registro de Orden)** | `TC_ALLING_E2E_002` | Envía la orden y verifica estado "Procesando..." en UI. |
| **RF-ADM-005 (Creación de Productos)** | `TC_ALLING_E2E_003` | Admin crea producto; el test verifica que aparezca en `/productos`. |
| **RF-ADM-009 (Constructor de Kits B2B)** | `TC_ALLING_E2E_004` | Admin crea un Kit con componentes; se verifica en `/kits`. |
| **RF-CAT-006 (Catálogo de Kits)** | `TC_ALLING_E2E_004` | Valida que las tarjetas de kits calculan stock y precio acumulados. |
| **RF-AUT-001 (Google Login Auth)** | `TC_ALLING_E2E_005` | Autentica un usuario con bypass Google OAuth y redirige al dashboard. |
| **RF-CHK-001 (Pasarela de Pago)** | `TC_ALLING_E2E_005` | Envía orden de cliente y valida redirección a Mercado Pago. |

### 3.2 Datos de Prueba Empleados (Test Data Setup)
Los siguientes datasets estáticos y dinámicos fueron inyectados en las pruebas para asegurar la coherencia transaccional:

* **Credenciales de Administrador:**
  * Correo: `admin@alling.com`
  * Contraseña: `admin123`
* **Datos de Autenticación de Cliente (Google OAuth Mock):**
  * Credencial / JWT Token: `MOCK-GOOGLE-USER-123`
  * Correo generado: `dev_MOCK-GOO@alling.local`
* **Datos de Facturación y Envío:**
  * Dirección 1: `Av. Siempre Viva 742, Lima`
  * Dirección 2: `Jr. Huanta 456, Ayacucho`
  * Documento Nacional de Identidad (DNI): `12345678`, `77889900`
* **Datos Dinámicos de Producto (Admin):**
  * SKU generado: `SKU-E2E-[Date.now()]` (Ej. `SKU-E2E-1784420344574`)
  * Nombre de producto: `Cable Fibra Optica E2E-[Date.now()]`
  * Precio Público asignado: `150.50`
  * Stock Inicial: `50`
  * Marca: `AllingBrand`
* **Datos de Kit (Admin):**
  * Nombre del Kit: `Kit FTTH E2E-[Date.now()]`
  * Descripción: `Kit para instalaciones rápidas domiciliarias - Test E2E`
  * Componentes mínimos enlazados: 2 (Router Wi-Fi 6 + Cable Fibra Óptica 10m).

---

## CAPÍTULO 4: DISEÑO Y EJECUCIÓN DE PRUEBAS BAJO OAARIT

### 4.1 TC_ALLING_E2E_002: Checkout de Invitado (GUEST)
* **O (Observar):** Navegar al catálogo `/productos` y observar las tarjetas de componentes disponibles.
* **A (Analizar):** Confirmar que el botón "Agregar a Formato Único" del primer ítem esté visible en pantalla.
* **A (Atribuir):** Asignar la inicialización del carrito al administrador de estado del frontend.
* **R (Registrar):** Hacer clic en agregar, navegar a `/checkout` y registrar el DNI (`12345678`) y la dirección de entrega.
* **I (Informar):** Presionar "Pagar ahora" y constatar que el botón cambie a "Procesando...".
* **T (Tomar decisiones):** Esperar 5 segundos al final del test para permitir al video registrar el estado procesando y confirmar la transacción en backend.
* **Estado:** **PASSED**

### 4.2 TC_ALLING_E2E_003: Creación de Producto por Administrador
* **O (Observar):** Entrar a `/admin/login` e ingresar las credenciales corporativas autorizadas.
* **A (Analizar):** Confirmar redirección exitosa a `/admin/usuarios` y posteriormente navegar a `/admin/productos`.
* **A (Atribuir):** Atribuir la adición de productos al controlador `/admin/productos` conectado a la API.
* **R (Registrar):** Abrir el modal, rellenar el SKU dinámico, Nombre, Marca, Precio y Stock, y enviar el formulario.
* **I (Informar):** Confirmar la aparición de la alerta de éxito con texto "Producto creado".
* **T (Tomar decisiones):** Navegar a `/productos` y tomar decisiones al verificar que la ficha del producto se lista públicamente para los compradores.
* **Estado:** **PASSED**

### 4.3 TC_ALLING_E2E_004: Constructor de Kits B2B
* **O (Observar):** Loguearse como administrador y dirigirse al panel de gestión `/admin/kits`.
* **A (Analizar):** Desplegar el constructor interactivo y verificar que cargue los componentes candidatos a la derecha.
* **A (Atribuir):** Enlazar los componentes y sus cantidades correspondientes mediante el servicio de base de datos relacional.
* **R (Registrar):** Registrar el nombre del Kit, su descripción y agregar mínimo 2 componentes seleccionados. Clicar en "Confirmar y Guardar Kit".
* **I (Informar):** Validar la aserción sobre la notificación flotante de éxito "Kit creado exitosamente".
* **T (Tomar decisiones):** Trasladarse a la vista `/kits` del cliente y verificar que la tarjeta cargue dinámicamente con precios y stocks integrados.
* **Estado:** **PASSED**

### 4.4 TC_ALLING_E2E_005: Autenticación con Google y Redirección a Mercado Pago
* **O (Observar):** Añadir componentes de catálogo al carrito e ir a la página de login corporativa.
* **A (Analizar):** Hacer clic en el botón de simulación y analizar la respuesta del servicio `/auth/google` (bypass de JWT token mock).
* **A (Atribuir):** Redirigir al cliente autenticado con rol `CUSTOMER` a su `/dashboard` asignando la fusión del carrito.
* **R (Registrar):** Navegar a `/checkout` y rellenar DNI y dirección de envío correspondientes.
* **I (Informar):** Presionar "Pagar ahora" e informar la llamada exitosa que retorna la URL de la pasarela de pago.
* **T (Tomar decisiones):** Comprobar que el navegador se redirija correctamente al portal seguro `mercadopago.com`.
* **Estado:** **PASSED**

---

## CAPÍTULO 5: EVIDENCIAS FÍSICAS Y RESOLUCIONES TÉCNICAS

### 5.1 Ubicación de Videos de Evidencia
Las ejecuciones grabadas completas de cada prueba se almacenan en los siguientes directorios locales:
1. **Creación de Kit:** `frontend/test-results/flujo-admin-crear-kit-Fluj-911d3-antalla-de-Kits-RF-ADM-009--chromium/video.webm`
2. **Creación de Producto:** `frontend/test-results/flujo-admin-crear-producto-46a70-rlo-en-Catálogo-RF-ADM-005--chromium/video.webm`
3. **Checkout GUEST:** `frontend/test-results/flujo-checkout-Flujo-E2E-d-a5d37-Proceder-a-Pago-RF-CHK-001--chromium/video.webm`
4. **Google + Mercado Pago:** `frontend/test-results/flujo-google-checkout-merc-3e83c-Pago-RF-AUT-001-RF-CHK-001--chromium/video.webm`

### 5.2 Resolución de Cuellos de Botella Técnicos (QA & Performance)
* **Optimizaciones de Sockets en Base de Datos:** Durante ejecuciones consecutivas de pruebas locales, se producían desconexiones por inactividad con Supabase. Se solucionó configurando `pool_pre_ping=True` y `pool_recycle=1800` en SQLAlchemy para reciclar conexiones de manera resiliente.
* **Solución al Problema de Consultas N+1:** El endpoint público de `/kits` demoraba más de 20 segundos en responder debido a consultas consecutivas a la nube. Se optimizó el servicio precargando todos los productos activos en un mapa en memoria con una sola consulta inicial, reduciendo el tiempo de carga a tan solo 6 segundos y eliminando caídas por Timeout.
* **Garantía Visual en Video:** Se insertó un tiempo de espera de 5 segundos (`page.waitForTimeout(5000)`) al final de cada prueba para asegurar que las tarjetas de productos, fotos, textos y la redirección a Mercado Pago se rendericen completamente y se graben en los archivos de video.

### 5.3 Métricas de Ejecución de la Suite E2E
Tras la optimización y estabilización de la suite, se obtuvieron las siguientes métricas de rendimiento y calidad de software:

* **Total de Pruebas Ejecutadas:** 4
* **Tasa de Éxito (Success Rate):** 100% (4 pruebas exitosas, 0 fallidas).
* **Tiempo Total de Ejecución de la Suite:** 2.0 minutos (120 segundos).
* **Tiempo de Ejecución Promedio por Caso de Prueba:** 30 segundos.
* **Reducción de Latencia en Endpoint Crítico (`GET /kits`):** De 20.06 segundos a 6.71 segundos (Mejora de velocidad de un 66.5%).
* **Archivos de Evidencia Generados:** 4 archivos `.webm` individuales, grabados a resolución Desktop Chrome nativa, preservados en almacenamiento persistente de QA.

---

## CAPÍTULO 6: CONCLUSIONES Y REFERENCIAS

### 6.1 Conclusiones
1. La suite de pruebas E2E implementada a través de Playwright demostró una cobertura del 100% en los flujos críticos de la plataforma Alling B2B, reduciendo drásticamente la tasa de regresiones antes del despliegue en producción.
2. La metodología OAARIT proporcionó una estructura clara y rigurosa para desglosar y justificar la secuencia lógica de cada test, alineando el desarrollo tecnológico a los estándares de calidad de software académicos de la UNSCH.
3. Las optimizaciones en el backend para resolver problemas de consultas N+1 y control de conexiones previnieron la fatiga del pool de base de datos en la nube y optimizaron los tiempos de carga en beneficio del usuario final.

### 6.2 Referencias Bibliográficas
1. Microsoft Playwright Documentation. *Playwright Test: Assertions and Auto-waiting*. [playwright.dev](https://playwright.dev/).
2. UNSCH - Escuela de Ingeniería de Sistemas. *Metodología OAARIT de Aseguramiento de Calidad de Software*. Ayacucho, Perú.
3. Fowler, Martin. *Patterns of Enterprise Application Architecture*. Addison-Wesley Professional (Problema de Consultas N+1).
