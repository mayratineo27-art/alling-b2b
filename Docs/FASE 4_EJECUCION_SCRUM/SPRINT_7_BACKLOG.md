# 🛡️ SPRINT 7: Hardening, Pruebas de Integración y End-to-End (E2E)

| **Métrica** | **Detalle** |
| :--- | :--- |
| **Objetivo del Sprint** | Estabilizar el sistema mediante pruebas de integración reales, validación E2E del flujo de compra y resolución de deuda técnica crítica dejada en el Sprint 6. |
| **Sprint anterior** | Sprint 6 (Refinamiento B2B y UX — completado) |
| **Duración estimada** | 1 semana (Fase de Estabilización) |
| **Marco de Calidad** | OAARIT + Spec-Driven Development + Zero Trust |

---

## 📌 Contexto y Objetivos

Habiendo finalizado la lógica de negocio core y el desacoplamiento de cotizaciones en el Sprint 6, el sistema se encuentra funcional pero carece de cobertura automatizada profunda que interactúe con componentes reales (Base de Datos, Webhooks de terceros) y flujos visuales completos. 

Este sprint (conocido como *Hardening Sprint*) tiene como propósito blindar la aplicación ejecutando las estrategias descritas en el documento `test_plan_oaarit.md`.

---

## 1. QA — Pruebas de Integración (Backend)

*Se utilizará `Testcontainers` (PostgreSQL) y `pytest` para interactuar con la base de datos real.*

### T7-INT1 — Flujo Transaccional de Checkout (MOD-CHK) ✅ Completado
- **Descripción:** Implementar el caso de prueba `TC_ALLING_INT_CHK_001`. Validar la idempotencia real del proceso de checkout, asegurando que un doble clic no cree dos pagos paralelos en la base de datos de Postgres.
- **DoD:** Test de integración ejecutándose en CI/CD, pasando exitosamente contra un Postgres efímero.

### T7-INT2 — Seguridad RLS Zero Trust (MOD-AUT) ✅ Completado
- **Descripción:** Implementar el caso de prueba `TC_ALLING_SEC_RLS_001`. Inyectar un JWT del `USER_A` e intentar hacer una consulta SQL directa a los Formatos Únicos del `USER_B`.
- **DoD:** La política Row Level Security (RLS) en Supabase/Postgres deniega el acceso a nivel de motor (retorna lista vacía o error de permisos).

### T7-INT3 — Recepción de Webhooks (MOD-CHK) ✅ Completado
- **Descripción:** Implementar el caso de prueba `TC_ALLING_INT_CHK_002`. Simular el payload de Mercado Pago, verificar validación de firma HMAC y comprobar que el estado de la `Order` cambia a `PAID` y el stock en `Product` disminuye de forma transaccional.
- **DoD:** Cobertura de la lógica de `procesar_webhook` con transacciones SQL reales.

---

## 2. QA — Pruebas End-to-End (Frontend)

*Se utiliza `Playwright` para simular la navegación de un usuario e interacción real en el navegador.*

### T7-E2E1 — Navegación del Catálogo y Adición a Formato Único (MOD-FU) ✅ Completado
- **Descripción:** Implementar `TC_ALLING_E2E_001` (`flujo-guest.spec.ts`). Navegar por el catálogo público como usuario visitante, seleccionar productos y agregarlos exitosamente al Formato Único.
- **DoD:** Ejecución automatizada en Playwright validando la presencia del producto en el borrador y actualización del contador de la cabecera.

### T7-E2E2 — Completar Formulario de Checkout y Proceder a Pago (MOD-CHK) ✅ Completado
- **Descripción:** Implementar `TC_ALLING_E2E_002` (`flujo-checkout.spec.ts`). Validar la carga del Formato Único en la pantalla de checkout, el llenado del formulario de envío y la transición al flujo de pago.
- **DoD:** Script de Playwright completando el formulario de checkout y verificando la preparación de la orden de pago.

### T7-E2E3 — Creación de Producto desde Panel Admin (MOD-ADM) ✅ Completado
- **Descripción:** Implementar `TC_ALLING_E2E_003` (`flujo-admin-crear-producto.spec.ts`). Iniciar sesión como Administrador, registrar un nuevo producto desde el panel de gestión y verificar su inmediata disponibilidad en el catálogo público.
- **DoD:** Prueba E2E pasando exitosamente y confirmando la persistencia y visibilidad del nuevo producto.

### T7-E2E4 — Creación de Kit Personalizado B2B desde Panel Admin (MOD-ADM) ✅ Completado
- **Descripción:** Implementar `TC_ALLING_E2E_004` (`flujo-admin-crear-kit.spec.ts`). Iniciar sesión como Administrador, armar un kit de productos B2B desde el módulo administrativo y comprobar su visibilidad en el catálogo de Kits.
- **DoD:** Aserción en Playwright garantizando que el kit creado aparece correctamente publicado para los clientes.

---

## 3. Resolución de Deuda Técnica (Tech Debt)

*Tareas derivadas de los "hallazgos fuera de alcance" documentados en el Sprint 6.*

### T7-FIX1 — Reparación del Límite Falso de Checkout y Reserva de Stock
- **Descripción:** Resolver el bug de experiencia donde la idempotencia engaña al usuario y el stock temporal (`reserved_stock`) nunca se descuenta en el primer clic.
- **DoD:** Inyección correcta de `InventoryService` en `CheckoutService` y habilitación del descuento temporal de stock.

### T7-FIX2 — Implementación Real de Importación Excel (MOD-FU)
- **Descripción:** Reemplazar el proceso "simulado" actual de subida de Excel en el carrito para que, tras su validación, realmente despache peticiones `POST /formatos/{id}/items/` para poblar el Formato Único.
- **DoD:** Subir un archivo `.xlsx` de prueba llena efectivamente el carrito en el frontend.

### T7-FIX3 — Unificación de Repositorios (MOD-CAT)
- **Descripción:** Eliminar la duplicidad de instancias de `InMemoryProductRepository` en el backend para prevenir desincronización de stock durante pruebas locales.
- **DoD:** `deps.py` orquesta una única fuente de verdad (Singleton) para los mocks, o la elimina por completo si ya se migró 100% a Supabase local.

---

## 📋 Definición de Terminado (DoD) del Sprint 7

1. Todos los tests de Integración y E2E definidos pasan exitosamente (Green).
2. No existen regresiones en los Sprints 1-6.
3. Se han actualizado los logs de pruebas con los resultados (Ej: `EV_ALLING_SCREENSHOT_...`).
4. Pipeline de CI/CD capaz de ejecutar los tests de integración en contenedores efímeros de forma automatizada.
