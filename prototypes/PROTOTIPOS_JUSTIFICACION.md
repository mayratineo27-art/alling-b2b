# Justificación de Prototipos - Sistema Alling

Este documento establece la trazabilidad entre la documentación funcional (10 módulos) y los prototipos generados para la validación visual, documentando formalmente la decisión de incluir o excluir módulos de esta fase.

## 1. Módulos Analizados

| Módulo | ¿Tiene SCR-*? | ¿Genera prototipo? | Razón |
|--------|---------------|---------------------|-------|
| MOD-CAT-01 | ✅ SCR-CAT-001, SCR-CAT-002 | ✅ SÍ | Pantallas públicas críticas para la conversión B2B/B2C. |
| MOD-FU-01 | ✅ SCR-FU-001 | ✅ SÍ | Núcleo del negocio, contenedor interactivo principal. |
| MOD-CHK-01 | ✅ SCR-CHK-001 | ✅ SÍ | Cierre de venta, flujo crítico. |
| MOD-CON-01 | ✅ SCR-CON-001, SCR-CON-002 | ❌ NO | Sus pantallas están integradas funcionalmente en el panel del vendedor (MOD-SEL-01). |
| MOD-COT-01 | ✅ SCR-COT-001, SCR-COT-002 | ❌ NO | Sus pantallas están integradas en la vista de cotizaciones del vendedor (MOD-SEL-01). |
| MOD-SEL-01 | ✅ SCR-SEL-001, SCR-SEL-002 | ✅ SÍ | Panel operativo necesario para la gestión del vendedor. |
| MOD-ADM-01 | ✅ SCR-ADM-001 | ✅ SÍ | Gobernanza y administración de cuentas. |
| MOD-AUT-01 | ✅ SCR-AUT-001..004 | ❌ NO | Login estándar, no requiere validación visual al emplear OAuth y formularios típicos. |
| MOD-DIS-01 | ❌ Sin UI | ❌ NO | API server-to-server; comunicación automatizada sin actor humano directo. |
| MOD-SYS-01 | ❌ Sin UI | ❌ NO | Infraestructura transversal (auditoría, scheduler) sin interfaz visual. |

## 2. Extracción de Especificaciones para Prototipos Generados

### MOD-CAT-01 (Catálogo)
- **Pantallas:** `SCR-CAT-001` (Listado), `SCR-CAT-002` (Detalle).
- **Componentes:** `CMP-CAT-001` a `022` (Buscadores, filtros de categoría/precio/marca, tarjetas, galería de imágenes).
- **Botones:** `BTN-CAT-001` (Add), `BTN-CAT-002` (Limpiar), `BTN-CAT-003` (Ver), `BTN-CAT-004` (Add to FU), `BTN-CAT-005` (Back).
- **Lógica condicional implementada:** Badges de stock (Verde: En stock, Ámbar: Bajo, Rojo: Agotado).

### MOD-FU-01 (Formato Único)
- **Pantallas:** `SCR-FU-001`.
- **Componentes:** `CMP-FU-001` a `012` (Tabla de ítems, resumen total, countdown de vigencia, banners, modales).
- **Botones:** `BTN-FU-001` a `010` (Cotizar, Checkout, Eliminar ítem, Vaciar).
- **Lógica condicional implementada:** Representación visual de los estados de la FSM (BORRADOR, CONSULTA, COTIZACIÓN, PEDIDO).

### MOD-CHK-01 (Checkout)
- **Pantallas:** `SCR-CHK-001`.
- **Componentes:** `CMP-CHK-001` a `007` (Formularios de contacto, dirección, envío, resumen de pedido).
- **Botones:** `BTN-CHK-001` (Pagar ahora).

### MOD-SEL-01 (Panel SELLER)
- **Pantallas:** `SCR-SEL-001` (Stock), `SCR-SEL-002` (Pedidos).
- **Componentes:** `CMP-SEL-001` a `011` (Tabla editable de stock, indicadores visuales de umbral bajo, tabla de pedidos con estado).
- **Botones:** `BTN-SEL-001` (Guardar edición), `BTN-SEL-002` (Guardar umbral).

### MOD-ADM-01 (Panel ADMIN)
- **Pantallas:** `SCR-ADM-001`.
- **Componentes:** `CMP-ADM-001` a `005` (Lista de usuarios, filtro de rol, modal de creación, modal destructivo).
- **Botones:** `BTN-ADM-001` a `003` (Crear, Suspender, Eliminar).
