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

*Se utilizará `Playwright` para simular la navegación de un usuario real en el navegador.*

### T7-E2E1 — Flujo Básico de Compra GUEST (MOD-FU)
- **Descripción:** Implementar `TC_ALLING_E2E_001`. El script de Playwright debe: Entrar a la landing → Buscar "Cable Fibra" → Agregar 2 al carrito → Abrir Drawer → Ir al Checkout → Llenar formulario de envío → Verificar redirección a Mercado Pago (Mock).
- **DoD:** Video o artefacto de Playwright demostrando el flujo exitoso sin errores en consola 400/500.

### T7-E2E2 — Bloqueo de UI en Estado de PEDIDO (MOD-FU)
- **Descripción:** Implementar `TC_ALLING_E2E_002`. Validar que si el carrito está en `PEDIDO`, el usuario visualice el *Banner de Advertencia* en el Drawer y no pueda sumar/restar cantidades (los botones `+` y `-` deben estar ocultos o deshabilitados).
- **DoD:** Aserción visual en Playwright garantizando la ausencia de controles de edición si el carrito está bloqueado.

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
