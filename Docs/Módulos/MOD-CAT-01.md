## MOD-CAT-01 — Catálogo de Productos

- **Objetivo:** Permitir descubrimiento y exploración de productos por cualquier visitante.
- **Actores:** GUEST, CUSTOMER, SELLER, ADMIN (todos pueden ver; SELLER/ADMIN gestionan vía `MOD-SEL-01`/`MOD-ADM-01`)
- **Procesos de negocio de origen:** 6.1 (Compra B2C), 6.2 (Cotización B2B)
- **Integraciones:** ninguna directa (recibe datos de `MOD-DIS-01` vía sync)

---

### Operaciones Funcionales (OPS)

#### `OPS-CAT-001` — Buscar y filtrar productos

- **Objetivo de negocio:** permitir que cualquier visitante encuentre productos relevantes rápidamente, reduciendo fricción de descubrimiento
- **Actor:** GUEST, CUSTOMER, SELLER, ADMIN
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** ninguno (operación de solo lectura)
- **Entidades afectadas:** ninguna (lectura de `Product`, `Category`)
- **Eventos de dominio:** ninguno
- **Pantallas:** `SCR-CAT-001`
- **Botones/acciones que la disparan:** `ACT-CAT-002`, `ACT-CAT-003`, `ACT-CAT-004`, `ACT-CAT-005`, `BTN-CAT-002`
- **Resultado esperado:** listado de productos filtrado/ordenado según criterios combinados
- **Servicios de dominio involucrados:** `ProductQueryService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna
- **RF relacionados:** `RF-CAT-001`
- **RNF relacionados:** `RNF-CAT-001` _(tiempo de respuesta de búsqueda — el contexto original §9 define métricas de performance generales; se reserva el ID específico para este módulo)_
- **HU relacionadas:** `HU-CAT-001`
- **UC relacionados:** `UC-CAT-001`
- **CA relacionados:** `CA-CAT-001`
- **TEST relacionados:** `TEST-CAT-001`

#### `OPS-CAT-002` — Ver detalle de producto

- **Objetivo de negocio:** dar información suficiente para decisión de compra/consulta
- **Actor:** GUEST, CUSTOMER, SELLER, ADMIN
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** ninguna (lectura de `Product`)
- **Eventos de dominio:** `EVT-CAT-001` (`ProductoVisto`, opcional MVP)
- **Pantallas:** `SCR-CAT-002`
- **Botones/acciones que la disparan:** `BTN-CAT-003`, `ACT-CAT-001`
- **Resultado esperado:** vista completa del producto cargada
- **Servicios de dominio involucrados:** `ProductQueryService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** ninguna
- **RF relacionados:** `RF-CAT-002`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-CAT-002`
- **UC relacionados:** `UC-CAT-002`
- **CA relacionados:** `CA-CAT-002`
- **TEST relacionados:** `TEST-CAT-002`

#### `OPS-CAT-003` — Agregar producto al Formato Único

- **Objetivo de negocio:** capturar intención de compra en el contenedor central (Formato Único), habilitando la conversión posterior a Consulta/Cotización/Pedido
- **Actor:** GUEST, CUSTOMER
- **Proceso de negocio de origen:** 6.1, 6.2
- **Estados de FSM involucrados:** `FormatoUnico` permanece en `BORRADOR` (si ya existía) o se crea uno nuevo vía `FU-T-01`
- **Entidades afectadas:** `FormatoUnico` (crea si no existe), `FormatoUnicoItem` (crea o incrementa cantidad)
- **Eventos de dominio:** `EVT-FU-001` (`FormatoUnicoCreado`, condicional), `EVT-CAT-002` (`ProductoAgregadoAFormato`), `EVT-FU-002` (`ItemAgregado`)
- **Pantallas:** `SCR-CAT-001`, `SCR-CAT-002`
- **Botones/acciones que la disparan:** `BTN-CAT-001`, `BTN-CAT-004`
- **Resultado esperado:** el FU del actor contiene el producto con la cantidad indicada; totales recalculados (delega en `AUTO-FU-001`, de `MOD-FU-01`)
- **Servicios de dominio involucrados:** `FormatoUnicoService`, `InventoryService` (validación de stock)
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-GUEST-01` (resuelta en Sesión 1: 1 solo FU activo por sesión GUEST)
- **RF relacionados:** `RF-CAT-003`
- **RNF relacionados:** ninguno
- **HU relacionadas:** `HU-CAT-003`
- **UC relacionados:** `UC-CAT-003`
- **CA relacionados:** `CA-CAT-003`
- **TEST relacionados:** `TEST-CAT-003`

---

### Pantallas (SCR)

#### `SCR-CAT-001` — Listado de productos (`/productos`)

- **Propósito:** explorar catálogo completo con filtros
- **Objetivo de negocio:** maximizar conversión inicial mostrando el catálogo de forma navegable y filtrable, reduciendo la tasa de abandono por dificultad de búsqueda
- **Valor para el usuario:** encuentra lo que busca sin necesidad de conocer nombres exactos de producto
- **Valor para el negocio:** punto de entrada principal al funnel de ventas; primera oportunidad de conversión
- **Actores autorizados:** todos (público)
- **Estados:** vacío (sin resultados), con datos, cargando, error de red
- **Permisos:** ninguno (público)
- **Dependencias con otras pantallas:** alimenta `SCR-CAT-002` y `SCR-FU-001`; depende de datos provistos por `MOD-DIS-01` y `MOD-SEL-01`/`MOD-ADM-01`
- **Navegación de entrada:** `NAV-CAT-001`, `NAV-CAT-002`, enlace directo
- **Navegación de salida:** `NAV-CAT-003`, `NAV-FU-001`

#### `SCR-CAT-002` — Detalle de producto (`/productos/[slug]`)

- **Propósito:** ver información completa de un producto y agregarlo al Formato Único
- **Objetivo de negocio:** convertir interés en intención de compra concreta (ítem en el FU)
- **Valor para el usuario:** información suficiente (imágenes, specs, stock) para decidir sin necesidad de contactar a un vendedor
- **Valor para el negocio:** punto de conversión directo; reduce dependencia de consultas pre-venta para decisiones simples
- **Actores autorizados:** todos (público)
- **Estados:** con datos, error (producto no existe/inactivo → 404), cargando
- **Permisos:** ninguno
- **Dependencias con otras pantallas:** depende de `SCR-CAT-001` como origen típico; alimenta `SCR-FU-001`
- **Navegación de entrada:** `NAV-CAT-003`, enlace directo, `NAV-CAT-004`
- **Navegación de salida:** `NAV-CAT-001`, `NAV-FU-001`

---

### Componentes (CMP)

**`SCR-CAT-001`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-CAT-001`|Buscador|Ejecuta `OPS-CAT-001` por texto libre|`query` string|parámetro de búsqueda aplicado|`AUTO-CAT-002`|
|`CMP-CAT-002`|Filtro categoría|Ejecuta `OPS-CAT-001` por categoría|`Category[]`|`category_id[]`|`Category` (lectura)|
|`CMP-CAT-003`|Filtro precio|Ejecuta `OPS-CAT-001` por rango|rango del catálogo (min/max)|`price_min`, `price_max`|`Product.price_public`|
|`CMP-CAT-004`|Filtro marca|Ejecuta `OPS-CAT-001` por marca|marcas distintas|`brand[]`|`Product.brand`|
|`CMP-CAT-005`|Filtro disponibilidad|Ejecuta `OPS-CAT-001` por stock|—|`in_stock_only: boolean`|`Product.stock`|
|`CMP-CAT-006`|Selector de orden|Ejecuta `OPS-CAT-001` con criterio de orden|—|`sort_by` enum|—|
|`CMP-CAT-007`|Card de producto|Resume producto, dispara `OPS-CAT-002`/`OPS-CAT-003`|`Product` (subset)|click → navegación o agregado|`CMP-CAT-008`|
|`CMP-CAT-008`|Badge de stock|Comunica disponibilidad sin exponer cantidad exacta (`RN-CATALOG-01`)|`Product.stock`, `stock_visible_mode`|texto/color de estado|`AUTO-CAT-001`|
|`CMP-CAT-009`|Paginación|Navega resultados de `OPS-CAT-001`|total de resultados, página actual|página solicitada|—|
|`CMP-CAT-010`|Breadcrumb|Orientación de navegación|categoría activa|—|`CMP-CAT-002`|
|`CMP-CAT-011`|Loader|Feedback visual durante `OPS-CAT-001`|estado de carga|—|—|
|`CMP-CAT-012`|Estado vacío|Feedback cuando `OPS-CAT-001` no retorna resultados|resultado vacío|acción de limpiar filtros (`BTN-CAT-002`)|—|
|`CMP-CAT-013`|Chips de filtros activos|Resumen y control granular de filtros|filtros activos|remoción individual de filtro|`CMP-CAT-002..005`|
|`CMP-CAT-014`|Toast|Confirma resultado de `OPS-CAT-003`|resultado de la operación|—|`BTN-CAT-001`|

**`SCR-CAT-002`:**

|ID|Tipo|Función en el proceso|Datos consumidos|Datos producidos|Dependencias|
|---|---|---|---|---|---|
|`CMP-CAT-015`|Galería de imágenes|Soporta `OPS-CAT-002`|`Product.images[]`|imagen activa|—|
|`CMP-CAT-016`|Selector de cantidad|Define cantidad para `OPS-CAT-003`|`Product.stock` (máximo)|`quantity: integer`|`CMP-CAT-021`|
|`CMP-CAT-017`|Badge de stock|Igual función que `CMP-CAT-008`|`Product.stock`, `stock_visible_mode`|texto/color de estado|`AUTO-CAT-001`|
|`CMP-CAT-018`|Tabs de información|Organiza contenido de `OPS-CAT-002`|descripción, specs, info de envío|tab activa|—|
|`CMP-CAT-019`|Breadcrumb|Orientación de navegación|categoría/producto activo|—|—|
|`CMP-CAT-020`|Productos relacionados|Sugerencia cruzada|productos de la misma categoría|navegación (`NAV-CAT-004`)|`CMP-CAT-007`|
|`CMP-CAT-021`|Mensaje de error|Feedback de validación de `OPS-CAT-003`|`quantity` vs `stock`|—|`CMP-CAT-016`|
|`CMP-CAT-022`|Toast|Confirma resultado de `OPS-CAT-003`|resultado de la operación|—|`BTN-CAT-004`|

---

### Botones (BTN)

#### `BTN-CAT-001` — "Agregar" (rápido, en card)

- Pantalla: `SCR-CAT-001` | Actor: GUEST, CUSTOMER | Estado donde aparece: producto con `stock > 0`
- Operación funcional: `OPS-CAT-003`
- Proceso de negocio de origen: 6.1
- Precondiciones: `product.is_active = true`; `product.stock ≥ 1`
- Postcondiciones: existe un `FormatoUnicoItem` para ese producto con `quantity ≥ 1`; FU permanece en `BORRADOR`
- Errores posibles: `409` si el stock se agotó entre carga y click; `404` si el producto fue desactivado en el ínterin
- Excepciones: ninguna (operación idempotente: clicks repetidos incrementan cantidad)
- Restricciones: `RN-GUEST-01`
- Impacto en la FSM: ninguno si el FU ya existe; si no existe, dispara `FU-T-01`
- Eventos generados: `EVT-FU-001` (condicional), `EVT-FU-002`, `EVT-CAT-002`
- Confirmación: no | Mensaje: toast de éxito o error | Navegación posterior: ninguna | Permisos: ninguno

#### `BTN-CAT-002` — "Limpiar filtros"

- Pantalla: `SCR-CAT-001` | Actor: todos | Estado donde aparece: filtros activos presentes
- Operación funcional: `OPS-CAT-001`
- Proceso de negocio de origen: 6.1, 6.2
- Precondiciones: al menos un filtro activo
- Postcondiciones: listado vuelve al estado sin filtros
- Errores posibles: ninguno
- Excepciones: ninguna | Restricciones: ninguna
- Impacto en la FSM: ninguno | Eventos generados: ninguno
- Confirmación: no | Mensaje: ninguno | Navegación posterior: ninguna | Permisos: ninguno

#### `BTN-CAT-003` — "Ver detalle" (card, click completo)

- Pantalla: `SCR-CAT-001` | Actor: todos | Estado donde aparece: siempre
- Operación funcional: `OPS-CAT-002`
- Proceso de negocio de origen: 6.1, 6.2
- Precondiciones: producto activo y existente
- Postcondiciones: ninguna (navegación)
- Errores posibles: `404` si el producto fue desactivado entre el render y el click
- Excepciones: ninguna | Restricciones: ninguna
- Impacto en la FSM: ninguno | Eventos generados: `EVT-CAT-001` (opcional)
- Confirmación: no | Mensaje: ninguno | Navegación posterior: `NAV-CAT-003` | Permisos: ninguno

#### `BTN-CAT-004` — "Agregar al Formato Único" (detalle)

- Pantalla: `SCR-CAT-002` | Actor: GUEST, CUSTOMER | Estado donde aparece: `stock > 0`, cantidad válida
- Operación funcional: `OPS-CAT-003`
- Proceso de negocio de origen: 6.1, 6.2
- Precondiciones: `product.is_active = true`; `quantity ≤ product.stock`
- Postcondiciones: `FormatoUnicoItem` creado/actualizado con la cantidad seleccionada
- Errores posibles: `409` (stock insuficiente server-side); `422` (cantidad ≤ 0)
- Excepciones: ninguna | Restricciones: `RN-GUEST-01`
- Impacto en la FSM: igual que `BTN-CAT-001`
- Eventos generados: `EVT-FU-001` (condicional), `EVT-FU-002`, `EVT-CAT-002`
- Confirmación: no | Mensaje: toast de éxito o error | Navegación posterior: ninguna | Permisos: ninguno

#### `BTN-CAT-005` — "Volver al catálogo"

- Pantalla: `SCR-CAT-002` | Actor: todos | Estado donde aparece: siempre
- Operación funcional: **ninguna** (navegación pura, sin efecto de negocio — marcado explícitamente como botón huérfano intencional)
- Impacto en la FSM: ninguno | Eventos generados: ninguno
- Confirmación: no | Navegación posterior: `NAV-CAT-001` | Permisos: ninguno

---

### Acciones (ACT)

|ID|Acción|Pantalla|Actor|Operación asociada|Resultado|Restricciones|
|---|---|---|---|---|---|---|
|`ACT-CAT-001`|Click sobre card completa|`SCR-CAT-001`|Todos|`OPS-CAT-002`|Navega a detalle|Ninguna|
|`ACT-CAT-002`|Escribir en buscador|`SCR-CAT-001`|Todos|`OPS-CAT-001`|Filtra con debounce ~300ms|Ninguna|
|`ACT-CAT-003`|Arrastrar slider de precio|`SCR-CAT-001`|Todos|`OPS-CAT-001`|Actualiza filtro en tiempo real|Ninguna|
|`ACT-CAT-004`|Cambiar selector de orden|`SCR-CAT-001`|Todos|`OPS-CAT-001`|Reordena resultados|Ninguna|
|`ACT-CAT-005`|Click en chip (X)|`SCR-CAT-001`|Todos|`OPS-CAT-001`|Remueve ese filtro|Ninguna|
|`ACT-CAT-006`|Incrementar/decrementar cantidad|`SCR-CAT-002`|Todos|Ninguna (prepara `OPS-CAT-003`)|Actualiza selector, valida contra stock|`quantity ≥ 1`, `quantity ≤ stock`|
|`ACT-CAT-007`|Click en thumbnail|`SCR-CAT-002`|Todos|`OPS-CAT-002` (sub-acción)|Cambia imagen principal|Ninguna|
|`ACT-CAT-008`|Cambiar tab de información|`SCR-CAT-002`|Todos|`OPS-CAT-002` (sub-acción)|Muestra contenido de la tab|Ninguna|
|`ACT-CAT-009`|Scroll para cargar más|`SCR-CAT-001`|Todos|`OPS-CAT-001`|Carga siguiente página|Ninguna|

---

### Navegación (NAV)

|ID|Desde|Hacia|Disparador|Flujo|Condición de entrada|Permisos|Bloqueado si|
|---|---|---|---|---|---|---|---|
|`NAV-CAT-001`|Cualquiera/Home|`SCR-CAT-001`|Click en "Productos"|Principal|Ninguna|Ninguno|Nunca|
|`NAV-CAT-002`|Cualquiera|`SCR-CAT-001`|Búsqueda global|Alternativo|`query` no vacío|Ninguno|Nunca|
|`NAV-CAT-003`|`SCR-CAT-001`|`SCR-CAT-002`|`BTN-CAT-003`/`ACT-CAT-001`|Principal|Producto activo|Ninguno|Producto inactivo (→404)|
|`NAV-CAT-004`|`SCR-CAT-002`|`SCR-CAT-002` (otro slug)|Click en producto relacionado|Alternativo|Producto relacionado activo|Ninguno|Producto inactivo|

---

### Funcionalidades Automáticas (AUTO)

#### `AUTO-CAT-001` — Recalculo de badge de stock

- **Evento disparador:** cambio en `product.stock` (vía `MOD-SEL-01`, `MOD-ADM-01` o `MOD-DIS-01`)
- **Responsable:** sistema (cálculo derivado en capa de presentación)
- **Condiciones de ejecución:** siempre que se renderiza `CMP-CAT-008`/`CMP-CAT-017`
- **Resultado esperado:** badge refleja `stock` actual según `stock_visible_mode`
- **Manejo de errores:** si `stock_visible_mode` no está definido, se usa `BOOLEAN` por defecto (fail-safe)

#### `AUTO-CAT-002` — Indexado de búsqueda

- **Evento disparador:** creación, edición o desactivación de `Product`
- **Responsable:** sistema (job o trigger de actualización de índice)
- **Condiciones de ejecución:** cualquier mutación sobre `Product` relevante para búsqueda
- **Resultado esperado:** `CMP-CAT-001` refleja el catálogo actualizado en la siguiente búsqueda
- **Manejo de errores:** si el indexado falla, degrada a búsqueda directa sobre `Product` sin índice optimizado

---

### Eventos de Dominio (EVT)

|ID|Evento|Disparado por|
|---|---|---|
|`EVT-CAT-001`|`ProductoVisto`|`OPS-CAT-002` (opcional MVP)|
|`EVT-CAT-002`|`ProductoAgregadoAFormato`|`OPS-CAT-003`|

---

### Reglas de Negocio relacionadas (RN)

`RN-GUEST-01`, `RN-CATALOG-01` (heredada, gobierna `CMP-CAT-008`/`CMP-CAT-017`)

### Requisitos Funcionales relacionados (RF)

`RF-CAT-001`, `RF-CAT-002`, `RF-CAT-003`

### Requisitos No Funcionales relacionados (RNF)

`RNF-CAT-001`

### Historias de Usuario relacionadas (HU)

`HU-CAT-001`, `HU-CAT-002`, `HU-CAT-003`

### Casos de Uso relacionados (UC)

`UC-CAT-001`, `UC-CAT-002`, `UC-CAT-003`

### Criterios de Aceptación relacionados (CA)

`CA-CAT-001`, `CA-CAT-002`, `CA-CAT-003`

### Casos de Prueba relacionados (TEST)

`TEST-CAT-001`, `TEST-CAT-002`, `TEST-CAT-003`

---

### Notas de diseño y decisiones del módulo

**Botón sin operación funcional:** `BTN-CAT-005` se mantiene documentado explícitamente como huérfano intencional (navegación pura), consistente con el criterio aprobado en la fase de enriquecimiento de la plantilla. No se fuerza una OPS artificial solo para evitar esta excepción.

---

### Impacto en documentos globales

- **Modelo de Dominio:** sin cambios. Este módulo no introduce ni modifica entidades.
- **FSM:** sin cambios. `OPS-CAT-003` dispara `FU-T-01` (creación), ya existente.
- **Arquitectura:** sin cambios.
- **Base de Datos:** sin cambios.
- **Decisiones Técnicas:** sin cambios.
- **Catálogo Global de Eventos:** sin cambios pendientes; `EVT-CAT-001` y `EVT-CAT-002` ya estaban documentados desde la primera versión de este módulo.
---

## 🆕 EXTENSIONES v1.2 (Mejoras UI/UX e Integraciones)

### 📋 Nuevos Requisitos Funcionales
- **RF-CAT-004:** Landing Page (HOME-GUEST) con hero image, productos destacados (sin precio), categorías con contadores, novedades
- **RF-CAT-005:** Vista intermedia de categorías con contadores antes de listado de productos
- **RF-CAT-006:** Gestión de Kits (agrupaciones dinámicas con precio calculado)
- **RF-CAT-007:** Favoritos de productos (solo CUSTOMER)
- **RF-CAT-008:** Consulta rápida por Telegram desde tarjeta de producto

### 🖼️ Nuevas Pantallas (SCR-*)

**SCR-CAT-003: Landing Page (HOME-GUEST)**
- **Propósito:** Punto de entrada para visitantes no autenticados
- **Permisos:** GUEST, CUSTOMER (redirige a Dashboard)
- **Componentes:**
  - CMP-CAT-023: Hero Image con efecto Bokeh
  - CMP-CAT-024: Grid de productos destacados (sin precio)
  - CMP-CAT-025: Cuadrícula de categorías con contadores
  - CMP-CAT-026: Sección de novedades/noticias
- **Navegación:** 
  - Desde: Header (logo, menú HOME)
  - Hacia: SCR-CAT-001 (clic en categoría), SCR-CAT-002 (clic en producto)

**SCR-CAT-004: Exploración Intermedia de Categorías**
- **Propósito:** Vista de transición para optimizar consultas
- **Permisos:** GUEST, CUSTOMER
- **Componentes:**
  - CMP-CAT-027: Grid de tarjetas de categoría (imagen + nombre + contador)
- **Interacción:** Clic en categoría → SCR-CAT-001 con filtro aplicado

### 🔧 Nuevos Componentes (CMP-*)

**CMP-CAT-023: Hero Image con Bokeh**
- Imagen principal de alta definición con efecto Bokeh
- Texto superpuesto con contraste WCAG AA (blanco/gris claro)
- CTA principal: "Descúbrelo ahora"

**CMP-CAT-024: Card de Producto Destacado (sin precio)**
- Imagen con efecto Bokeh
- Nombre del producto
- Marca
- Badge "Destacado"
- Botón "Ver detalle"

**CMP-CAT-025: Tarjeta de Categoría con Contador**
- Imagen miniatura de categoría
- Nombre de categoría
- Contador dinámico: "X productos disponibles"

**CMP-CAT-026: Sección de Novedades**
- Grid horizontal de productos nuevos
- Badge "Nuevo"
- Fecha de ingreso

**CMP-CAT-027: Grid de Categorías**
- Layout responsive (1 col mobile, 2 tablet, 3 desktop)
- Tarjetas clickeables

**CMP-CAT-028: Kit Card**
- Imagen compuesta del Kit
- Nombre del Kit
- Lista de componentes resumida (ej. "5 productos")
- Precio dinámico calculado
- Badge de stock (mínimo de componentes)
- Botón "Agregar al Formato Único"

**CMP-CAT-029: Botón de Favoritos**
- Icono de corazón
- Estado: activo/inactivo
- Tooltip: "Agregar a favoritos" (solo CUSTOMER)

**CMP-CAT-030: Botón de Consulta Telegram**
- Icono de Telegram (azul #24A1DE)
- Tooltip: "Consultar por Telegram"
- Acción: Abre t.me con payload pre-armado

### 🔘 Nuevos Botones (BTN-*)

**BTN-CAT-006: Agregar a Favoritos**
- **Acción:** POST /products/{id}/favorite
- **Precondición:** CUSTOMER autenticado
- **Postcondición:** Producto en lista de favoritos
- **Permiso:** CUSTOMER only

**BTN-CAT-007: Consultar por Telegram**
- **Acción:** Abre t.me/[username]?text=[payload]
- **Payload:** "Hola, tengo una consulta sobre [Nombre] (SKU: [Código])"
- **Permiso:** GUEST, CUSTOMER

**BTN-CAT-008: Ver Kit**
- **Acción:** Navega a detalle de Kit
- **Permiso:** GUEST, CUSTOMER

**BTN-CAT-009: Agregar Kit al Formato Único**
- **Acción:** POST /kits/{id}/add-to-formato
- **Validación:** Stock del Kit (mínimo de componentes)
- **Permiso:** GUEST, CUSTOMER

### 📦 Nueva Entidad: Kit

```python
class Kit(SQLModel, table=True):
    __tablename__ = "kits"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    description: Optional[str] = Field(default=None)
    dynamic_price: bool = Field(default=True)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    components: List["KitComponent"] = Relationship(back_populates="kit")
    
    @property
    def calculated_price(self) -> Decimal:
        """Suma de precios públicos de componentes"""
        return sum(comp.product.price_public * comp.quantity 
                   for comp in self.components)
    
    @property
    def stock(self) -> int:
        """Stock = mínimo de stocks de componentes"""
        return min(comp.product.stock for comp in self.components)


class KitComponent(SQLModel, table=True):
    __tablename__ = "kit_components"
    
    kit_id: UUID = Field(foreign_key="kits.id", primary_key=True)
    product_id: UUID = Field(foreign_key="products.id", primary_key=True)
    quantity: int = Field(default=1, ge=1)
    
    # Relaciones
    kit: Kit = Relationship(back_populates="components")
    product: Product = Relationship()
```

### 📜 Nuevas Reglas de Negocio

**RN-KIT-01:** Precio dinámico de Kit = suma de precios de componentes **RN-KIT-02:** Kit requiere mínimo 2 componentes **RN-KIT-03:** Stock de Kit = mínimo stock de componentes **RN-FAV-01:** Solo CUSTOMER puede tener favoritos **RN-TG-01:** Payload Telegram debe incluir SKU + nombre + cantidad

### 🔄 Impacto en Actores

**GUEST:**

- ✅ Ve landing page (SCR-CAT-003)
- ✅ Ve categorías con contadores (SCR-CAT-004)
- ✅ Ve Kits (sin precio si no está autenticado)
- ❌ No puede agregar favoritos

**CUSTOMER:**

- ✅ Redirige a Dashboard al hacer clic en HOME
- ✅ Agrega productos a favoritos
- ✅ Ve Kits con precio dinámico
- ✅ Consulta por Telegram desde catálogo

**SELLER:**

- ✅ Ve Kits en listado de productos
- ⚠️ Debe ver desglose de componentes en pedidos

**ADMIN:**

- ✅ CRUD completo de Kits (SCR-ADM-005)
- ✅ Gestiona contenido de Landing (SCR-ADM-006)

### 🔗 Nuevas Navegaciones (NAV-*)

**NAV-CAT-003:** Header → SCR-CAT-003 (Landing) **NAV-CAT-004:** SCR-CAT-003 → SCR-CAT-004 (clic en categoría) **NAV-CAT-005:** SCR-CAT-004 → SCR-CAT-001 (clic en categoría) **NAV-CAT-006:** SCR-CAT-001 → Modal Telegram (BTN-CAT-007)
