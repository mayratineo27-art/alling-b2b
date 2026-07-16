# Análisis de Impacto y Unidades de Referencia: Actualización del Panel ADMIN

Este documento detalla cuáles unidades de especificación (Requisitos Funcionales, Casos de Uso, Criterios de Aceptación y Reglas de Negocio) deben ser **añadidas o modificadas** en la documentación del proyecto para reflejar la propuesta de optimización del Panel del Administrador (ADMIN) y las nuevas funciones clave de negocio B2B.

---

## 1. Mapeo de Requisitos Funcionales (`REQUISITOS_FUNCIONALES.md`)

Se deben modificar 2 requisitos existentes y añadir 4 nuevos en el documento [REQUISITOS_FUNCIONALES.md](file:///c:/Users/MAYRATM/source/repos/tiendRed/Docs/FASE%202/REQUISITOS_FUNCIONALES.md):

### A. Requisitos a Modificar/Refinar:
*   **`RF-ADM-005` (Gestionar Catálogo):**
    *   *Modificación:* Ampliar la descripción para incluir el dashboard de grilla completa, buscador integrado, filtros por marca/categoría, e interruptor rápido (Toggle) de estado activo/inactivo (`is_active`).
*   **`RF-ADM-009` (CRUD de Kits):**
    *   *Modificación:* Especificar que la selección de componentes se realiza mediante un componente modal dinámico con buscador y filtro por categorías, descartando el ingreso manual de IDs.

### B. Nuevos Requisitos Funcionales a Añadir:
*   **`RF-ADM-011` (Carga Masiva de Catálogo):**
    *   *Descripción:* El sistema debe permitir al ADMIN cargar un archivo Excel para crear nuevos productos en lote, validando la estructura del archivo e ignorando duplicados de SKU. (Diferenciado de la sincronización del distribuidor).
*   **`RF-ADM-012` (Gestión de Categorías):**
    *   *Descripción:* El sistema debe permitir al ADMIN crear, editar y eliminar categorías físicas (con slug e icono) y asociar o mover productos en lote a estas categorías.
*   **`RF-ADM-013` (Asignación Manual de Consultas):**
    *   *Descripción:* El sistema debe permitir al ADMIN ver la cola de consultas técnicas pre-venta pendientes de asignación y asignar de manera manual un vendedor (`SELLER`) para su resolución.
*   **`RF-ADM-014` (Modificación y Descuento en Cotizaciones B2B):**
    *   *Descripción:* El sistema debe permitir al ADMIN abrir una cotización vigente (`COTIZACIÓN`), aplicar un descuento manual sobre el total o sobre ítems específicos, y re-generar el documento PDF inmutable para el cliente.

---

## 2. Mapeo de Casos de Uso (`CASOS_DE_USO.md`)

Se deben reflejar las siguientes modificaciones en [CASOS_DE_USO.md](file:///c:/Users/MAYRATM/source/repos/tiendRed/Docs/FASE%202/CASOS_DE_USO.md):

### A. Casos de Uso a Modificar:
*   **`UC-ADM-002` (Gestionar Catálogo):**
    *   *Modificación:* Incluir sub-flujos para:
        1. Subida y administración de imágenes secundarias de producto.
        2. Búsqueda y filtrado dinámico en la grilla.
        3. Activación/desactivación rápida vïa toggle.

### B. Nuevos Casos de Uso a Registrar:
*   **`UC-ADM-005` (Administrar Categorías):**
    *   *Flujo Principal:* ADMIN crea una categoría, define su slug e icono, selecciona productos del catálogo y los asocia en lote.
*   **`UC-ADM-006` (Gobernar Consultas y Cotizaciones B2B):**
    *   *Flujo Principal 1:* ADMIN visualiza cola de consultas y asigna manualmente a un vendedor.
    *   *Flujo Principal 2:* ADMIN edita precios de una cotización de gran volumen, introduce descuento y re-genera PDF de pago.

---

## 3. Mapeo de Criterios de Aceptación Gherkin (`CRITERIOS_DE_ACEPTACION.md`)

Se deben incorporar los siguientes escenarios en [CRITERIOS_DE_ACEPTACION.md](file:///c:/Users/MAYRATM/source/repos/tiendRed/Docs/FASE%202/CRITERIOS_DE_ACEPTACION.md):

*   **`CA-ADM-009` (Validación de Buscador de Kits):**
    *   *Escenario:* Buscar componentes por categoría y agregarlos dinámicamente al acumulador de precios del kit.
*   **`CA-ADM-011` (Validación de Carga Masiva de Catálogo):**
    *   *Escenario:* Subir un Excel de catálogo. Comprobar que los SKUs nuevos se inserten y los SKUs duplicados generen una alerta de conflicto sin tirar abajo el proceso completo.
*   **`CA-ADM-012` (Validación de Categorías):**
    *   *Escenario:* Intentar eliminar una categoría que contiene productos activos y verificar el bloqueo por integridad referencial.
*   **`CA-ADM-014` (Descuento Manual en Cotizaciones):**
    *   *Escenario:* Aplicar un descuento comercial a una cotización de estado `COTIZACIÓN` y verificar que el PDF se re-genere y los precios se recalculen.

---

## 4. Nuevas Reglas de Negocio (`business_rules.yaml.md`)

Se deben registrar 3 nuevas reglas de gobernanza en [business_rules.yaml.md](file:///c:/Users/MAYRATM/source/repos/tiendRed/Docs/00_project/business_rules.yaml.md):

*   **`RN-ADM-03` (Integridad de Categorías):**
    *   *Enunciado:* No se puede eliminar una categoría si existen productos activos asociados a ella. Los productos deben re-categorizarse o desactivarse previamente.
*   **`RN-ADM-04` (Límite de Descuento Manual):**
    *   *Enunciado:* El descuento máximo que el administrador puede aplicar manualmente sobre una cotización es del 30%. Descuentos mayores requieren aprobación de gerencia.
*   **`RN-ADM-05` (Inmutabilidad Post-Pago):**
    *   *Enunciado:* Solo se pueden aplicar descuentos y modificaciones de precio en cotizaciones activas de estado `COTIZACIÓN`. Una vez transicionado a `PEDIDO` o pagado, los precios son inalterables.

---

## 5. Matriz de Trazabilidad Global (`MATRIZ_TRAZABILIDAD_GLOBAL.md`)

*   **Actualización:**
    *   Se deben registrar las nuevas filas correspondientes a `RF-ADM-011` hasta `RF-ADM-014`.
    *   Mapear estas tareas al **Sprint 7: Gobernanza Avanzada y Operaciones B2B**, ya que exceden las capacidades del actual Sprint 5 del panel administrativo básico.



Actúa como un Ingeniero de Software Sénior y Scrum Master autónomo. 

Tu objetivo en esta etapa es leer y analizar en profundidad los siguientes dos documentos de planificación de arquitectura y diseño del Administrador:
1. Propuesta de interfaz y flujos:
📄 C:\Users\MAYRATM\.gemini\antigravity-ide\brain\8e9d3780-5357-4027-8ef5-e82d4266a722\admin_panel_proposal.md
2. Análisis de impacto y mapeo de unidades de referencia:
📄 C:\Users\MAYRATM\.gemini\antigravity-ide\brain\8e9d3780-5357-4027-8ef5-e82d4266a722\admin_documentation_impact.md

Con base en tu análisis de estas especificaciones y del estado actual del repositorio, realiza las siguientes acciones secuenciales:

---

### PASO 1: Análisis y Planificación Autónoma (Sprint Backlog 7)
1. Analiza el código fuente del backend y del frontend para identificar los archivos que necesitan modificarse o crearse (rutas del panel de administración en `/admin/...`, lógica de carga masiva de productos, constructor de kits, módulo de categorías y la lógica de inyección de descuentos en cotizaciones FSM).
2. Estructura y escribe tu propio plan de tareas ("Sprint Backlog") para lo que denominaremos:
   🚀 SPRINT 7: Gobernanza Avanzada y Operaciones B2B (Módulo ADMIN)
3. Desglosa las tareas técnicas detallando:
   - Backend (Modelado de `SystemConfig`, tabla de categorías, endpoints de carga masiva creadora, asignación de consultas y recalculación/congelado de descuentos en cotizaciones FSM).
   - Frontend (Dashboard CRUD de productos con toggle `is_active`, modal buscador de componentes en Kits, gestor de imágenes, pantalla de administración de categorías, panel de asignación y anulación/descuento de cotizaciones).
   - Definición de Terminado (Definition of Done - DoD) para cada tarea.

---

### PASO 2: Ejecución del Código (Backend y Frontend)
Desarrolla el código correspondiente para completar las tareas del Sprint 7 que has planificado.
- Escribe código limpio, seguro y modular.
- Asegúrate de que las actualizaciones automáticas del distribuidor (`MOD-DIS-01`) no entren en conflicto con la carga masiva del Administrador ni afecten los descuentos B2B aplicados manualmente.
- Ejecuta pytest (`backend/.venv/Scripts/python -m pytest backend/tests/`) y asegura que todas las pruebas pasen con éxito.

---

### PASO 3: Actualización de la Documentación (Trazabilidad)
Actualiza los documentos de diseño global para asegurar la integración formal del Sprint 7 de acuerdo a lo mapeado en el impacto:
- **`REQUISITOS_FUNCIONALES.md`:** Refinar `RF-ADM-005`/`009` y añadir `RF-ADM-011` al `014`.
- **`CASOS_DE_USO.md`:** Refinar `UC-ADM-002` y añadir `UC-ADM-005` y `006`.
- **`CRITERIOS_DE_ACEPTACION.md`:** Incorporar escenarios Gherkin desde `CA-ADM-009` al `CA-ADM-014`.
- **`business_rules.yaml.md`:** Registrar las reglas de negocio de integridad, límites y post-pago (`RN-ADM-03` al `05`).
- **`MATRIZ_TRAZABILIDAD_GLOBAL.md`:** Registrar los nuevos requisitos mapeándolos formalmente a las tareas y pruebas del Sprint 7.

---

### PASO 4: Cierre del Sprint
Al finalizar la ejecución, edita el archivo `admin_panel_proposal.md` y añade al final una sección titulada `## 7. Reporte de Implementación (Sprint 7)` detallando:
- Las tareas resueltas del backlog.
- Los archivos de código modificados en el repositorio.
- Los archivos de documentación actualizados.
- La confirmación de que la suite de pruebas unitarias pasó satisfactoriamente.
