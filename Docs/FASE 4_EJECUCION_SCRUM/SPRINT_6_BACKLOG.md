# 🚀 SPRINT 6: Refinamiento B2B, Desacoplamiento de Cotizaciones y Experiencia Dinámica (UX)

| Campo | Valor |
|---|---|
| **Sprint anterior** | Sprint 5 (Core del sistema — completado) |
| **Fuente de especificación** | `notas_actualizacion_diseno.md` (secciones 1–4) |
| **Metodología** | Scrum + TDD backend-first (RED-GREEN-REFACTOR) |
| **Autor del backlog** | Agente autónomo, a partir de análisis de código + spec |

---

## 0. Hallazgos del análisis previo (por qué el backlog está estructurado así)

Antes de planificar, se auditó el código actual. Hallazgos clave que determinan el alcance:

1. `/formatos/page.tsx` **ya existe** como workspace completo (SCR-FU-001) — no se crea desde cero, se extiende.
2. El ícono de carrito en `Header.tsx` es un `<Link>` plano sin badge ni popover — no existe `CartBadge.tsx`.
3. **No existe ningún componente Drawer/SlideOver** en todo el frontend.
4. **No existe ningún sistema de Toast** — todo el feedback actual es `alert()` o estado local con `setTimeout` (hay un comentario TODO literal en `dashboard/page.tsx` reconociendo el vacío).
5. **No existe `RepurchaseWidget`** — se construye desde cero.
6. `useCart.ts` es mínimo (`addToCart`/`adding`), sin estado global de carrito — cada componente refetchea `/formatos/me` por su cuenta.
7. `generar_cotizacion()` (backend) **muta el mismo agregado** en vez de clonarlo — es la causa raíz documentada en `DEC-030` ("Camino C"). Este sprint implementa esa decisión, con una técnica más simple que la propuesta original: clonar dentro de la misma tabla `formato_unico` (mismo modelo, sin tabla `Quote` nueva), no todo el rediseño de 3 fases de DEC-030.
8. `get_active_by_customer_id()` (repo) asume **un solo BORRADOR por cliente**. El Patrón de Clonación introduce múltiples BORRADOR (el activo + los históricos huérfanos de cotizaciones canceladas) — esto **rompe la resolución del carrito activo** si no se corrige. Se identificó como bug de diseño a resolver dentro de este sprint, no como ítem opcional.
9. Hallazgos fuera de alcance de este sprint (se documentan pero no se resuelven, para no diluir el foco): "Confirmar Importación Excel" es simulado (no aplica ítems al FU realmente); el servicio de Telegram backend está huérfano (el frontend duplica la lógica con un bot hardcodeado distinto); existen dos instancias separadas de `InMemoryProductRepository`. Se dejan como tareas spawneadas independientes.

---

## 1. Backend — Clonación, persistencia y FSM

### T6-B1 — Patrón de Clonación en `generar_cotizacion` (FU-T-03 / FU-T-07)
- **Descripción:** Al generar una cotización, `FormatoUnicoService.generar_cotizacion()` deja de mutar el `FormatoUnico` original. En su lugar: (a) crea un **nuevo registro independiente** en estado `COTIZACIÓN` con los ítems clonados y `pdf_url=None`; (b) el registro original se **vacía** (`items=[]`, `subtotal=0`) y permanece en `BORRADOR`, listo para seguir editándose de inmediato.
- **Archivos:** `backend/app/services/formato_unico_service.py`, `backend/app/api/endpoints/formato_unico.py` (el endpoint `/aprobar` ahora retorna la cotización clonada, no el FU original).
- **DoD:**
  - Test que verifica que tras generar cotización, el `id` de la cotización retornada **es distinto** al `fu_id` original.
  - Test que verifica que el original queda en `BORRADOR` con `items == []`.
  - Test que verifica que la cotización clonada conserva los ítems y sus precios (`unit_price`) intactos.
  - Suite completa de `pytest` en verde, incluyendo los tests preexistentes que dependían del comportamiento anterior (deben actualizarse, no eliminarse, documentando el cambio de contrato).

### T6-B2 — Corregir resolución de "carrito activo" ante múltiples BORRADOR (`RN-FU-09` nueva)
- **Descripción:** `InMemoryFormatoRepository.get_active_by_customer_id()` debe resolver, entre todos los `BORRADOR` del cliente, el de `updated_at` más reciente — no el primero que encuentre iterando el diccionario. Cada operación que "toca" un borrador (clonación, reemplazo, combinación) debe refrescar su `updated_at`.
- **Archivos:** `backend/app/infra/repositories/in_memory_formato_repository.py`.
- **DoD:** Test con 2 `BORRADOR` simultáneos para el mismo cliente (uno histórico huérfano de una cotización cancelada, uno activo) — `get_active_by_customer_id` debe retornar siempre el más reciente.

### T6-B3 — Endpoints de Widget de Recompra: "Reemplazar Borrador" y "Combinar con Borrador"
- **Descripción:** Dos endpoints nuevos que clonan ítems de un Formato Único histórico (cerrado) hacia el borrador activo del cliente:
  - `POST /formatos/{historial_id}/reemplazar-borrador` (`BTN-FU-008a`): vacía el borrador activo y copia los ítems de `historial_id`, con precios **actuales** del catálogo (no los precios congelados históricos).
  - `POST /formatos/{historial_id}/combinar-borrador` (`BTN-FU-008b`): fusiona ítems — si el producto ya está en el borrador activo, **suma cantidades** en vez de duplicar filas (reutiliza `_merge_quantity`, ya existente).
  - Ambos validan ownership (`historial_id.customer_id == current_user`), omiten productos inactivos/sin stock, y crean el borrador activo si el cliente no tuviera ninguno.
- **Archivos:** `backend/app/services/formato_unico_service.py`, `backend/app/api/endpoints/formato_unico.py`.
- **DoD:**
  - Test "reemplazar": borrador con ítems previos termina con **solo** los ítems del histórico.
  - Test "combinar": producto presente en ambos termina con cantidades **sumadas**, no duplicado.
  - Test de ownership: 403 si el histórico no pertenece al actor.
  - Test de producto inactivo: se omite sin romper la operación completa.

### T6-B4 — Endpoint `hasHistory` para ramificación de onboarding
- **Descripción:** Nuevo endpoint ligero `GET /formatos/tiene-historial` → `{"has_history": bool}`, usado por el frontend para decidir entre las vistas B (nuevo) y C (recurrente) de la sección 1 de la spec.
- **Archivos:** `backend/app/api/endpoints/formato_unico.py`.
- **DoD:** Test que verifica `false` para un CUSTOMER sin ningún FU no-BORRADOR, y `true` tras generar al menos una cotización.

---

## 2. Frontend — Drawer, Tooltips, Onboarding, Widget de Recompra

### T6-F1 — Sistema de Toast mínimo (no existe hoy)
- **Descripción:** Contexto de Toast ligero (sin dependencia nueva de npm) con soporte para acciones (ej. "Seguir buscando" / "Ver proforma"), reemplazando los `alert()` dispersos en `BannerFSM.tsx` y `ExcelImporter.tsx` donde aplique al flujo de este sprint.
- **Archivos nuevos:** `frontend/src/context/ToastContext.tsx`, `frontend/src/components/ui/Toast.tsx`.
- **DoD:** Toast se dispara al agregar un producto (`ProductCard.tsx`, `productos/[slug]/page.tsx`) con las dos acciones descritas en la sección 2 de la spec; se auto-cierra tras unos segundos.

### T6-F2 — Contexto global de carrito (`CartContext`)
- **Descripción:** Dado que `useCart.ts` no expone conteo/subtotal global y cada componente refetchea por su cuenta, se introduce un contexto que centraliza `items`, `count`, `subtotal` y expone `refresh()`, para que el Badge del Header y el Drawer reaccionen a los mismos datos sin duplicar llamadas.
- **Archivos:** `frontend/src/context/CartContext.tsx` (nuevo), integrado en `app/layout.tsx`.
- **DoD:** Header y Drawer muestran el mismo conteo sin desincronizarse tras agregar/quitar un ítem desde cualquier punto de la app.

### T6-F3 — `CartBadge` + Popover en el Header
- **Descripción:** Reemplaza el ícono plano de carrito por un componente con badge numérico dinámico y popover en hover (resumen de cantidad + subtotal estimado).
- **Archivos:** `frontend/src/components/layout/CartBadge.tsx` (nuevo), `frontend/src/components/layout/Header.tsx` (modificado).
- **DoD:** Badge se actualiza en tiempo real tras agregar un producto; popover muestra subtotal correcto; click abre el Drawer (no navega directo a `/formatos`).

### T6-F4 — Drawer lateral de carrito
- **Descripción:** Panel deslizante derecho con listado de ítems (nombre, SKU, thumbnail, `QuantityInput`, eliminar), subtotal neto, botón primario "Comprar ahora" (→ `/checkout`) y botón secundario "Gestionar Pedido" (→ `/formatos`).
- **Archivos:** `frontend/src/components/formato/CartDrawer.tsx` (nuevo).
- **DoD:** Se abre desde el `CartBadge` y desde la acción "Ver proforma" del Toast; eliminar un ítem lo remueve sin cerrar el Drawer; el subtotal se recalcula en vivo.

### T6-F5 — Onboarding B2B para CUSTOMER nuevo (`hasHistory = false`)
- **Descripción:** Guía visual de 3 pasos (Agregar / Cotizar / Pagar) en `/formatos` cuando el CUSTOMER autenticado no tiene historial. Se minimiza/oculta en cuanto se agrega el primer ítem.
- **Archivos:** `frontend/src/components/formato/OnboardingGuide.tsx` (nuevo), `frontend/src/app/formatos/page.tsx` (modificado).
- **DoD:** Se muestra solo si `isAuthenticated && !hasHistory && items.length === 0`; desaparece al agregar el primer ítem sin recargar la página.

### T6-F6 — Widget de Recompra (lateral, con fusión e importación)
- **Descripción:** Para CUSTOMER con `hasHistory = true`, columna lateral derecha con las últimas 3 cotizaciones cerradas y los dos botones de acción ("Reemplazar Borrador" / "Combinar con Borrador") con su modal/toast de confirmación respectivo, consumiendo T6-B3.
- **Archivos:** `frontend/src/components/formato/RepurchaseWidget.tsx` (nuevo), `frontend/src/app/formatos/page.tsx` (modificado).
- **DoD:** "Reemplazar" pide confirmación explícita antes de ejecutar; "Combinar" ejecuta directo y muestra toast de éxito con el conteo de productos fusionados; ambos refrescan la tabla principal sin recargar.

### T6-F7 — Filtro de interfaz GUEST y ramificación por perfil en `/formatos`
- **Descripción:** `/formatos/page.tsx` decide su composición según `isAuthenticated`/`hasHistory`: GUEST oculta "Generar Cotización", "Solicitar Asesoría" y el Widget de Recompra; CUSTOMER nuevo muestra el onboarding; CUSTOMER recurrente muestra el Widget de Recompra.
- **Archivos:** `frontend/src/app/formatos/page.tsx`, `frontend/src/components/formato/BannerFSM.tsx` (ajustar mensajería tras la clonación: ahora "Generar Cotización" no cambia el estado del borrador visible, sino que abre/notifica una cotización independiente).
- **DoD:** Verificado manualmente en navegador para los 3 perfiles (GUEST, CUSTOMER nuevo, CUSTOMER recurrente).

---

## 3. Definición de Terminado (DoD) global del Sprint

- Backend: TDD estricto (RED confirmado antes de cada GREEN); `pytest` completo en verde, sin regressions en la suite preexistente (los 3 fallos ya documentados como preexistentes/no relacionados no cuentan como regresión).
- Frontend: `tsc --noEmit` limpio; verificación visual en navegador de los flujos críticos (agregar producto → toast → drawer → checkout; generar cotización → borrador queda vacío → cotización visible en `/cotizaciones`; reemplazar/combinar borrador).
- Documentación: `CASOS_DE_USO.md`, `REQUISITOS_FUNCIONALES.md`, `CRITERIOS_DE_ACEPTACION.md`, `MATRIZ_TRAZABILIDAD_GLOBAL.md` actualizados con los nuevos RF/HU/CA/UC del Patrón de Clonación y los perfiles GUEST/CUSTOMER nuevo/recurrente, con IDs verificados como libres antes de usarse.
- Cierre: sección `## 6. Reporte de Implementación (Sprint 6)` añadida a `notas_actualizacion_diseno.md`.
