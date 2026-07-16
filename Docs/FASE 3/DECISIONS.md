# DECISIONES TÉCNICAS — Proyecto Alling

| Campo | Valor |
|---|---|
| **ID Documento** | DOC_ALLING_DECISIONS_001 |
| **Versión** | 1.0.0 |
| **Estado** | Vigente |
| **Propósito** | Registrar todas las decisiones técnicas y de negocio tomadas durante el desarrollo del proyecto Alling |
| **Fecha** | 30 de junio de 2026 |

---

## Decisiones de Arquitectura y Stack

### DEC-001: Stack Backend — Python + FastAPI
- **Decisión:** Backend en Python 3.11+ con FastAPI.
- **Justificación:** Usuario domina Python; Pydantic V2 es spec ejecutable; mejor alineación con SDD (Spec-Driven Development).
- **Alternativas descartadas:** NestJS (TypeScript, menos SDD-friendly), Django (monolítico, menos ágil).

### DEC-002: Base de Datos — PostgreSQL con RLS
- **Decisión:** PostgreSQL 15+ con Row Level Security (RLS).
- **Justificación:** RLS nativo para Zero Trust; mejor que MySQL para datos JSON; integración con SQLModel/Prisma.
- **Alternativas descartadas:** SQL Server (costo, hosting), MySQL (RLS menos robusto).

### DEC-003: Frontend — Next.js 15 App Router
- **Decisión:** Next.js 15 con App Router.
- **Justificación:** Server Components para rutas privadas; ISR para catálogo; integración nativa con Vercel.
- **Alternativas descartadas:** React SPA (SEO), Nuxt (menos maduro).

### DEC-004: Autenticación — NextAuth + JWT RS256
- **Decisión:** NextAuth.js con OAuth Google + JWT RS256.
- **Justificación:** OAuth Google nativo; JWT stateless; RS256 más seguro que HS256.
- **Alternativas descartadas:** Sesiones server-side (no escala), Auth0 (costo).

### DEC-005: Pagos — MercadoPago Sandbox
- **Decisión:** MercadoPago en modo Sandbox para MVP.
- **Justificación:** Único medio de pago del MVP; documentación clara; SDK oficial.
- **Alternativas descartadas:** Niubiz, Izipay (fuera de alcance).

### DEC-006: Logística — Shalom Mockeado
- **Decisión:** Integración con Shalom mockeada para MVP.
- **Justificación:** Plazo de 12 días insuficiente para integración real.
- **Alternativas descartadas:** Integración real (fuera de alcance).

### DEC-007: Arquitectura — Cascada + Zero Trust
- **Decisión:** Arquitectura en capas (Cascada) con principios Zero Trust.
- **Justificación:** Alineación con curso; 3 capas de defensa; RLS como diferenciador.
- **Alternativas descartadas:** Hexagonal pura (más compleja), MVC (no soporta Zero Trust).

---

## Decisiones de Negocio

### DEC-008: Formato Único como Innovación Central
- **Decisión:** Formato Único Interactivo como diferenciador.
- **Justificación:** Unifica B2C/B2B; reduce fricción; 4 estados (BORRADOR, COTIZACIÓN, PEDIDO, CONSULTA).
- **Alternativas descartadas:** Carrito + cotizador separados (como competencia).

### DEC-009: 4 Estados del Formato Único
- **Decisión:** BORRADOR, COTIZACIÓN, PEDIDO, CONSULTA.
- **Justificación:** Cubre todos los flujos: edición, B2B, B2C, pre-venta.
- **Alternativas descartadas:** 3 estados (sin CONSULTA), 5 estados (complejidad innecesaria).

### DEC-010: MFA Obligatorio Solo para ADMIN
- **Decisión:** MFA TOTP obligatorio solo para ADMIN; recomendado para SELLER; opcional para CUSTOMER.
- **Justificación:** Balance seguridad/UX; ADMIN tiene acceso total.
- **Alternativas descartadas:** MFA para todos (fricción alta), sin MFA (inseguro).

### DEC-011: 404 en Lugar de 403 para Recursos Ajenos
- **Decisión:** Responder 404 (no 403) cuando un CUSTOMER intenta acceder a recursos ajenos.
- **Justificación:** No filtrar existencia de recursos; seguridad por oscuridad.
- **Alternativas descartadas:** 403 (filtra existencia).

### DEC-012: IDs Opacos (UUID) para Recursos Privados
- **Decisión:** UUID v4 para pedidos, cotizaciones, formatos únicos.
- **Justificación:** No enumerable; no filtra secuencia.
- **Alternativas descartadas:** IDs incrementales (enumerable).

### DEC-013: Slugs SEO-Friendly para Productos
- **Decisión:** Slugs legibles para URLs de productos (ej: `/productos/cable-utp-cat6-marca-x`).
- **Justificación:** Mejor SEO; URLs legibles; compartibles.
- **Alternativas descartadas:** IDs numéricos (no SEO).

### DEC-014: Stock como Booleano/Rango para GUEST/CUSTOMER
- **Decisión:** No exponer stock exacto a GUEST/CUSTOMER; mostrar como booleano o rango.
- **Justificación:** No exponer inventario exacto a competencia.
- **Alternativas descartadas:** Stock exacto (expone inventario).

### DEC-015: SELLER sin Acceso a Finanzas
- **Decisión:** SELLER no puede ver finanzas globales, márgenes, ni datos sensibles de CUSTOMERS.
- **Justificación:** Mínimo privilegio; SELLER solo necesita operar.
- **Alternativas descartadas:** SELLER con acceso parcial a finanzas (riesgo).

---

## Decisiones de Calidad

### DEC-016: Marco OAARIT del Libro del Docente
- **Decisión:** Seguir marco OAARIT (homoclaves, trazabilidad, evidencias).
- **Justificación:** Alineación con evaluación del curso.
- **Alternativas descartadas:** ISTQB puro (menos práctico), marco propio (no reconocido).

### DEC-017: TDD para Backend
- **Decisión:** Test-Driven Development para backend Python.
- **Justificación:** Código más robusto; cobertura garantizada; documentación viva.
- **Alternativas descartadas:** Testing posterior (menos cobertura).

### DEC-018: Schemathesis para Property-Based Testing
- **Decisión:** Usar Schemathesis sobre OpenAPI.
- **Justificación:** Detecta bugs que tests manuales no encuentran; genera casos automáticamente.
- **Alternativas descartadas:** Solo tests manuales (menos cobertura).

### DEC-019: Playwright para E2E
- **Decisión:** Playwright para pruebas end-to-end.
- **Justificación:** Más rápido que Selenium; soporta múltiples navegadores; screenshots automáticos.
- **Alternativas descartadas:** Cypress (menos navegadores), Selenium (más lento).

### DEC-020: Cobertura ≥ 80% Backend
- **Decisión:** Cobertura mínima de 80% en backend.
- **Justificación:** Estándar industrial; gate de PR.
- **Alternativas descartadas:** 100% (costo/beneficio bajo), 60% (insuficiente).

---

## Decisiones de Despliegue

### DEC-021: Frontend en Vercel
- **Decisión:** Despliegue de frontend en Vercel.
- **Justificación:** Despliegue nativo Next.js; CI/CD automático; gratis.
- **Alternativas descartadas:** AWS Amplify (más complejo), Netlify (menos integración).

### DEC-022: DB en Neon/Supabase
- **Decisión:** Base de datos PostgreSQL en Neon o Supabase.
- **Justificación:** PostgreSQL serverless; RLS nativo; backups automáticos; gratis.
- **Alternativas descartadas:** AWS RDS (costo), hosting propio (complejidad).

### DEC-023: CI/CD Académico en GitHub Actions
- **Decisión:** Pipeline de calidad funcional en GitHub Actions.
- **Justificación:** Integración nativa con GitHub; gratis para repos públicos.
- **Alternativas descartadas:** Jenkins local (requiere hosting), CircleCI (límites).

### DEC-024: Pipeline GRI FIJO en Jenkins
- **Decisión:** Pipeline DevSecOps del curso GRI en Jenkins (no se modifica).
- **Justificación:** Requisito del curso; comparabilidad entre 5 sistemas.
- **Alternativas descartadas:** Modificar pipeline (rompe comparabilidad).

---

## Decisiones de Reconciliación de Módulos (Fase 1.5)

### DEC-025: Capacidad de ADMIN para Forzar MFA en SELLER
- **Decisión:** Fuera de alcance para el MVP.
- **Justificación:** El plazo de 12 días no permite implementar esta capacidad sin afectar prioridades críticas. MFA recomendado para SELLER es suficiente para el MVP.
- **Impacto:** MOD-AUT-01 (OPS-AUT-005) mantiene MFA voluntario para SELLER. No se agrega OPS-ADM-009.
- **Postergado a:** v1.1 (post-MVP).

### DEC-026: Formato de Exportación de Datos (ADMIN)
- **Decisión:** CSV como formato inicial para MVP.
- **Justificación:** CSV es el formato más simple de implementar y compatible con Excel/herramientas de análisis. JSON/Excel pueden agregarse en v1.1.
- **Impacto:** RF-ADM-008 especifica "Exportar datos en formato CSV".

### DEC-027: Eliminación de Usuario (Soft-Delete vs Hard-Delete)
- **Decisión:** Soft-delete obligatorio con anonimización opcional de PII.
- **Justificación:** Hard-delete rompería integridad referencial con AuditLog, Order y FormatoUnico. Soft-delete preserva auditoría histórica.
- **Impacto:** RF-ADM-004 especifica "Soft-delete (`is_active=false`, `deleted_at`)". Se agrega columna `deleted_at` en tabla `users`.

### DEC-028: Política de Retención de AuditLog
- **Decisión:** Anonimización después de 12 meses, sin eliminación física.
- **Justificación:** Preserva invariante de inmutabilidad de AuditLog (solo INSERT). Cumple LPDP anonimizando PII. Consistente con zero_trust_actors.md §6.
- **Impacto:** RF-SYS-002 especifica "Anonimización de PII (ip, user_agent, actor_id) tras 12 meses". rbac_policy.md §2.8 actualizado.

### DEC-029: Jerarquía de Umbral de Stock Mínimo
- **Decisión:** Coexistencia con jerarquía clara.
- **Justificación:** ADMIN configura `default_stock_min_threshold` global (valor por defecto para productos nuevos). SELLER puede sobreescribir el umbral por producto específico (valor operativo). Si SELLER no define umbral por producto, se usa el default de ADMIN.
- **Impacto:** 
  - RF-SEL-003: "SELLER configura umbral por producto, sobreescribiendo default de ADMIN".
  - RF-ADM-007: "ADMIN configura default global, aplicable a productos nuevos".
  - Regla de negocio RN-CALC-03-BIS: "Si `Product.stock_min_threshold` es NULL, se usa `SystemConfig.default_stock_min_threshold`".

---

### DEC-030: Desacoplar Cart / Quote / Order (Camino C) — Propuesta, pendiente de implementación

- **Estado:** 🟡 PROPUESTA — documentada para guiar una evolución futura de MOD-FU-01. No implementada; no reemplaza DEC-008/DEC-009 mientras no se ejecute.
- **Contexto:** DEC-008/DEC-009 modelan el Formato Único como **un único agregado mutable** que atraviesa los estados de su FSM (BORRADOR → COTIZACIÓN → PEDIDO, etc.). Esto implica que un CUSTOMER solo puede tener **un FU activo a la vez** (`get_active_by_customer_id` retorna uno solo). En uso real se detectó una brecha de UX: al generar una COTIZACIÓN (`FU-T-03`), el mismo objeto que servía de "carrito" queda congelado (precios fijos, `RN-FU-03`) durante 15 días, y el cliente pierde la capacidad de seguir agregando productos que ya decidió comprar — no existe una noción de "carrito" independiente de la cotización.
- **Decisión:** Documentar la ruta de evolución hacia un modelo donde **Cart, Quote y Order son entidades independientes**, siguiendo el patrón estándar de plataformas B2B/B2C reales (Amazon Business, Salesforce B2B Commerce, SAP Commerce): el carrito vive siempre editable; una cotización es una **copia/snapshot congelado** del carrito en el momento en que se solicita, no una transformación del mismo objeto; el pedido nace de aceptar una cotización o de un checkout directo del carrito.
- **Mitigación de corto plazo ya implementada (no es Camino C, es un parche sobre el modelo actual):** `RF-FU-020` / `FU-T-15` (cancelar cotización vigente) permite al CUSTOMER romper manualmente el bloqueo, volviendo el FU a BORRADOR a voluntad en vez de esperar 15 días. Preserva el modelo de "un solo FU activo"; no resuelve la limitación de fondo de no poder tener carrito y cotización simultáneos.
- **Fases propuestas para una implementación futura:**
  1. **Fase 1 (hecha):** `RF-FU-020` como mitigación inmediata sobre el modelo actual.
  2. **Fase 2:** Introducir una entidad `Quote` independiente, generada como snapshot inmutable (copia de ítems + precios congelados) al ejecutar `generar_cotizacion`, en vez de mutar el `state` del mismo `FormatoUnico`. El `FormatoUnico` en `BORRADOR` pasa a ser conceptualmente "el Cart" del cliente — permanece siempre editable, sin transicionar a `COTIZACIÓN`.
  3. **Fase 3:** `Order` sigue naciendo de dos caminos posibles — checkout directo del Cart (equivalente a `FU-T-04`) o aceptación de una `Quote` (equivalente a `FU-T-09`) — misma dualidad de hoy, ahora desacoplada de un agregado mutable compartido.
  4. **Impacto en datos:** nueva tabla `quotes` (o reutilizar `formato_unico` pero dejar de mutar el registro original — cada `generar_cotizacion` crearía una fila nueva referenciando su `source_cart_id`). La restricción de "un carrito activo por cliente" se mantiene sobre `Cart`; `Quote` NO tiene esa restricción — un cliente puede tener varias cotizaciones abiertas en paralelo.
  5. **Impacto en FSM:** requiere una revisión de FSM-01 (`Docs/FASE 3/FSM.md`) — "COTIZACIÓN" dejaría de ser un estado del mismo agregado `FormatoUnico` para ser el ciclo de vida de un agregado `Quote` propio. Se considera un cambio de versión mayor de MOD-FU-01, fuera del alcance de un RF individual.
- **Alternativas descartadas:**
  - Mantener el modelo de un solo FU activo indefinidamente — descartada: la necesidad de `RF-FU-020` como parche es evidencia directa de que la limitación es real y recurrente, no un caso extremo.
  - Permitir múltiples `FormatoUnico` simultáneos en `BORRADOR` sin separar formalmente `Quote` — descartada: reintroduce ambigüedad sobre "cuál es el carrito real", entra en conflicto con invariantes tipo `RN-GUEST-01` (un solo FU activo por GUEST), y es más confuso que una separación limpia Cart/Quote.
- **Impacto documental si se ejecuta esta ruta:** `RF-FU-005`, `RF-FU-006`, `RF-FU-010`, `RF-FU-012`, `RF-FU-020`; transiciones `FU-T-03`, `FU-T-07`, `FU-T-09`, `FU-T-10`, `FU-T-11`, `FU-T-14`, `FU-T-15`; reglas `RN-FU-03`, `RN-GUEST-01`, `RN-FU-06`; `Docs/FASE 3/MODELO_DE_DOMINIO.md` (nueva entidad `Quote`); `Docs/FASE 3/BASE_DE_DATOS.md` (nueva tabla). Se marca como candidato a MOD-FU-01 v2, pendiente de decisión de roadmap — no forma parte del alcance MVP/MVP+ actual.

---

## Control de Cambios

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0.0 | 30/06/2026 | Versión inicial con 29 decisiones (DEC-001 a DEC-029) | Equipo Alling |
| 1.1.0 | 11/07/2026 | Se agrega DEC-030 (propuesta de desacoplar Cart/Quote/Order — Camino C), documentada a raíz de la brecha de UX detectada en `COTIZACIÓN` y mitigada de corto plazo con RF-FU-020 | Equipo Alling |

---


#### Decisiones Clave que Definen la Arquitectura

| Decisión | Impacto | Referencia |
|---|---|---|
| Serverless sobre Vercel | Sin servidores que gestionar, cold start mitigado | DEC-021, §10.1 |
| Clean Architecture | Dominio testeable, independiente de FastAPI | §2.1 |
| EDA in-process | Eventos síncronos en MVP, sin message broker | §2.2, §10.4 |
| JWT RS256 stateless | Sin sesiones server-side | DEC-004, §10.2 |
| RLS en PostgreSQL | Aislamiento de datos a nivel de BD | DEC-002, §10.3 |
| FastAPI + Next.js separados | Frontend y backend evolucionan independientemente | §3.1, §3.2 |

#### Lo que esta arquitectura NO es

| ❌ NO es              | ✅ En su lugar es                                |
| -------------------- | ----------------------------------------------- |
| Monolito tradicional | Sistema modular serverless                      |
| Microservicios       | Aplicación en capas con dominio rico            |
| MVC simple           | Clean Architecture con 5 capas                  |
| SPA pura             | Híbrida SSG/SSR/ISR según ruta                  |
| SaaS multi-tenant    | Aplicación single-tenant (Alling)               |
| Monorepo complejo    | 2 repos: frontend (Next.js) + backend (FastAPI) |
