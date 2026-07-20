# 📋 PLAN DE TRABAJO DEDICADO: TAREAS CRÍTICAS DE INTEGRACIÓN (task_vs.md)

Este documento detalla el backlog de tareas de integración críticas y correctivas discutidas para el sistema **tiendRed (Alling B2B)**. Cada tarea mapea de extremo a extremo (Backend + Frontend) con especificaciones de los módulos y requerimientos.

---

## 🚀 SPRINT 1: Identificación, Seguridad y Corrección de Login (MOD-AUT-01)

### [x] Tarea S1-02: Endpoint de Inicio de Sesión Local (RF-AUT-002 / BRG-NAV-004)
- **Backend:** 
  - Crear el endpoint `POST /auth/login` que valide `email` y `password` contra `User` (local).
  - Validar la regla `RN-AUT-002` (impedir acceso local a rol CUSTOMER e impedir Google OAuth a ADMIN/SELLER).
  - Retornar un JWT firmado con `role` ("ADMIN" o "SELLER") y `mfa_validated = false`.
- **Frontend:** 
  - Conectar el formulario de [admin/login/page.tsx](file:///c:/Users/MAYRATM/source/repos/tiendRed/frontend/src/app/admin/login/page.tsx) para realizar la petición `POST /auth/login`.
  - Crear el botón `BTN-AUT-005` (Cerrar sesión) en header global e invalidación del token.
- **Validación:** Ejecutar `TEST-AUT-002` y verificar respuesta HTTP `200` al ingresar credenciales correctas.

### [x] Tarea S1-06: Gestión de Sesión Segura vía Cookies httpOnly (Vercel/Deploy Ready)
- **Backend:** 
  - Al completar un login exitoso (`POST /auth/login` o `POST /auth/google`), inyectar el token JWT generado en una cookie con propiedades seguras (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`).
  - Crear endpoint `/auth/me` que extraiga la identidad y rol del usuario decodificando el JWT de la cookie.
- **Frontend:**
  - Configurar `AuthContext.tsx` y `apiClient` para operar con la propiedad `withCredentials: true` para todas las peticiones asíncronas.
  - Al inicializar o refrescar la aplicación, realizar una petición al endpoint `/auth/me` para hidratar el estado del usuario (`user.role`, `user.email`) de forma segura, eliminando por completo el uso de `localStorage`.
- **Validación:** Comprobar en las herramientas de desarrollo del navegador que el JWT viaja cifrado en cookies y que al refrescar la pantalla el rol persiste sin bucles de redirección.

### [x] Tarea S1-07: Redirección Dinámica post-login en base al Rol
- **Frontend:** 
  - Configurar el callback final del método `login()` en `AuthContext.tsx` para que, tras un login exitoso, redirija dinámicamente:
    - A `/admin/productos` si el rol es `ADMIN`.
    - A `/vendedor/stock` si el rol es `SELLER`.
    - A `/dashboard` si el rol es `CUSTOMER`.
- **Validación:** Iniciar sesión con la cuenta de administrador y comprobar que el flujo redirige automáticamente al panel del administrador.

### [x] Tarea S1-08: Unificación del Registro de Nonces (Seguridad / BRG-CROSS-004)
- **Backend:** 
  - Unificar el validador y registro de nonces en `distribuidor.py` utilizando el servicio centralizado y persistente de seguridad del backend en lugar del diccionario en memoria temporal.
- **Validación:** Ejecutar `test_replay_attack_distributor` contra el endpoint real de API.

---

## 📦 SPRINT 2: Catálogo, Búsqueda y Persistencia de Pruebas (MOD-CAT-01)

### [x] Tarea S2-02: Búsqueda con Debouncing y Filtro de Disponibilidad (RF-CAT-003 / BRG-CAT-003 / BRG-CAT-004)
- **Backend:** 
  - Añadir parámetro `in_stock: Optional[bool]` al endpoint `/productos/` y filtrar `stock > 0` en base de datos.
- **Frontend:**
  - Añadir checkbox "Solo en stock" en sidebar de filtros (`CMP-CAT-005`).
  - Implementar hook de debounce de ~300ms en el input de búsqueda de categorías/catálogo (`ACT-CAT-002`).
- **Validación:** `TEST-CAT-003` y `TEST-CAT-005` aprobados.

### [x] Tarea S2-03: Visualización Segura de Stock (RN-CATALOG-01 / BRG-CAT-001)
- **Backend:**
  - Agregar columna `stock_visible_mode` (BOOLEAN, RANGE, EXACT) a la tabla `products`.
  - Crear campo calculado `stock_display` en `ProductResponseSchema` (ej. "En Stock" / "Agotado" / ">10 unidades") y eliminar el entero `stock` crudo de la respuesta pública.
- **Frontend:**
  - Reemplazar cantidad numérica por el badge dinámico `stock_display` en las tarjetas del catálogo.
- **Validación:** Verificar que un request anónimo al backend no expone el stock en enteros.

### [x] Tarea S2-04: Detalle de Producto por Slug (RF-CAT-002 / BRG-CAT-002)
- **Backend:** Endpoint `GET /productos/{slug}/` implementado ([catalogo.py L43](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/api/endpoints/catalogo.py#L43)).
- **Frontend:**
  - Crear la ruta dinámica `frontend/src/app/productos/[slug]/page.tsx` (`SCR-CAT-002`).
  - Renderizar galería de imágenes, tabs de especificaciones y selector de cantidad.
  - Conectar el botón `BTN-CAT-004` (Agregar al FU desde detalle).
- **Validación:** `TEST-CAT-002` aprobado.

### [x] Tarea S2-06: Persistencia Real del Catálogo de Pruebas (Base de Datos)
- **Backend:**
  - Configurar las pruebas de Landing Page y Catálogo para que poblen y consuman una base de datos real (SQLite en memoria o base de datos de pruebas configurada mediante variables de entorno) usando `ProductRepositoryImpl` en lugar de `InMemoryProductRepository`.
- **Validación:** Ejecutar pytest y comprobar que las consultas de Landing Page cargan datos persistidos de forma idéntica a producción.

---

## 🛒 SPRINT 3: Gestión de Formato Único Persistente (MOD-FU-01)

### [x] Tarea S3-07: Implementación de Repositorio Persistente Supabase/SQLModel para Formato Único (MOD-FU-01 / Agregado: FormatoUnico / RN-GUEST-01 / RN-GUEST-MIGRATE-01 / RNF-REL-002)
- **Backend:**
  - Implementar todos los métodos en `SupabaseFormatoRepository` (como `get_active_by_customer_id`, `get_by_order_token`, `save()`, `merge_guest_to_customer()`, etc.) utilizando consultas directas a base de datos PostgreSQL mediante el engine de SQLModel, eliminando el fallback a la instancia en memoria.
- **Validación:** Arrancar el backend con `USE_MOCK_DB=False` y verificar que las operaciones de añadir ítems, consultar el carrito `/formatos/me` y fusionar carritos persistan directamente en PostgreSQL.

---

## 💳 SPRINT 4: Integración del Checkout con Base de Datos Real (MOD-CHK-01)

### [x] Tarea S4-06: Refactorización de Capa de Persistencia en Checkout
- **Backend:**
  - Refactorizar el router [checkout.py](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/api/endpoints/checkout.py) para inyectar el repositorio real que accede a la base de datos PostgreSQL (`FormatoRepositoryImpl`) en lugar del repositorio en memoria temporal `InMemoryFormatoRepository()`.
- **Validación:** Transicionar un FU real en base de datos hacia pedido sin que arroje excepción 404.

---

## 💼 SPRINT 5: Paneles Vendedor, Administrador e Integración Distribuidor (MOD-SEL-01 + MOD-ADM-01 + MOD-DIS-01)

### [x] Tarea S5-02: Persistencia Real en la Cola de Consultas de Pre-venta (SELLER)
- **Backend:**
  - Migrar la persistencia del router `consultas.py` y `cotizaciones.py` para usar `FormatoRepositoryImpl` y consultas directas a base de datos PostgreSQL, eliminando la dependencia del mock en memoria.
- **Frontend:**
  - En la cola de consultas de vendedor (`/vendedor/consultas`), renderizar y procesar las notas de respuesta guardándolas en base de datos.
- **Validación:** El SELLER se asigna una consulta y responde; la nota se almacena en PostgreSQL.

### [ ] Tarea S5-05: Persistencia de Datos de Sincronización del Distribuidor
- **Backend:**
  - Modificar [distribuidor.py](file:///c:/Users/MAYRATM/source/repos/tiendRed/backend/app/api/endpoints/distribuidor.py) para que persista los cambios de precios y cantidades directamente en la base de datos real a través de `ProductRepositoryImpl` en lugar de la instancia en memoria.
- **Validación:** Ejecutar un envío de lote de prueba al endpoint `/distribuidor/sync` y verificar que los productos actualizados se reflejen en la base de datos y catálogo en frontend.

### [ ] Tarea S5-06: Persistencia Real del CRUD de Catálogo (ADMIN)
- **Backend:**
  - Modificar el router de administración `admin.py` en los endpoints de productos (`GET` / `POST /admin/productos`) para que las altas y consultas se realicen sobre `ProductRepositoryImpl` conectado a base de datos real, eliminando el uso de `InMemoryProductRepository()`.
- **Frontend:**
  - Agregar un producto desde el formulario de administrador y verificar que se guarde en la base de datos.
- **Validación:** Verificar que el nuevo producto aparezca en el catálogo público `/productos` persistido.

---

## 📋 PLAN DE TRABAJO Y EJECUCIÓN (DAILY SCRUM)

Para garantizar la conformidad con **Spec-Driven Development (SDD)**, abordaremos las tareas de la siguiente manera:
1. Me indicarás con qué **ID de Tarea** (ej: `S1-06`) deseas iniciar.
2. Yo asumiré esa tarea de forma exclusiva, implementando la lógica del Backend, la UI del Frontend, y ejecutando la suite de pruebas local.
3. Al finalizar, reportaré el resultado con la firma del test pasando para que valides en el navegador antes de iniciar la siguiente tarea.
