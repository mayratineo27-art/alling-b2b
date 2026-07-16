# Alling — Requisitos del Plan de Ejecución Maestro

## Contexto del Proyecto

Alling es una plataforma B2B/B2C de comercio electrónico con arquitectura Next.js 15 (frontend) + FastAPI (backend). El trabajo está dividido en tres fases secuenciales.

---

## FASE A — Debugging del Frontend

### RF-A-001: Build limpio del frontend
El frontend debe compilar sin errores con `npm run build`. Cualquier error de build bloqueante debe corregirse antes de avanzar.

### RF-A-002: Corrección de bugs críticos
Los bugs que causan crash o impiden el render de páginas críticas (/, /productos, /formato, /checkout, /dashboard) deben corregirse con cambios mínimos, sin agregar features ni reescribir arquitectura.

### RF-A-003: Corrección de errores de TypeScript/ESLint
Los errores de tipo y lint que bloquean el build deben corregirse. Los warnings no bloqueantes son secundarios.

### RF-A-004: Reporte de bugs
Se debe generar el archivo `04_EJECUCION/BUGFIX_FRONTEND_REPORT.md` con la lista de bugs encontrados, correcciones aplicadas y resultado del build.

**Criterios de aceptación:**
- `npm run build` pasa sin errores
- Las 5 páginas críticas renderizan sin crash
- No se introducen features nuevas
- No se cambia la arquitectura (Next.js 15 + Tailwind)

---

## FASE B — Implementación de 6 Módulos Faltantes

### RF-B-SYS: MOD-SYS-01 (Sistema Transversal)
- RF-SYS-001: AuditLog inmutable — registro automático de toda mutación en `audit_logs`
- RF-SYS-002: SchedulerService consolidado — jobs `AUTO-FU-002` + `AUTO-CHK-003` + purga de auditoría
- RF-SYS-003: Paleta de colores global (sistema de diseño en Tailwind/CSS vars)
- RF-SYS-004: NotificationService con FSM — badge en header, polling/WebSocket
- RF-SYS-005: Icono de favoritos en header con contador

### RF-B-ADM: MOD-ADM-01 (Panel Admin)
- RF-ADM-001 a 004: CRUD de usuarios (listar, crear, suspender, eliminar con restricciones RN-ADMIN-01/02)
- RF-ADM-005: CRUD completo de catálogo (productos + categorías)
- RF-ADM-006: Métricas de ventas (dashboard analítico)
- RF-ADM-007: Configuración de parámetros del sistema (SystemConfig)
- RF-ADM-008: Exportación de datos con re-autenticación MFA step-up
- RF-ADM-009: CRUD de Kits + CMS de Landing Page

### RF-B-SEL: MOD-SEL-01 (Panel Seller)
- RF-SEL-001 a 003: Gestión de stock (listar, editar, configurar umbral mínimo)
- RF-SEL-004 a 006: Cola de pedidos (listar, generar guía, historial)
- RF-SEL-007: Stock real con descuento de reservas + alertas Telegram + desglose de Kits

### RF-B-CON: MOD-CON-01 (Consultas Pre-Venta)
- RF-CON-001: Cola de consultas pendientes para SELLER
- RF-CON-002: Tomar/asignarse una consulta (bloqueo optimista)
- RF-CON-003: Responder consulta (transición CONSULTA→RESUELTA)
- RF-CON-004: Filtrar y buscar consultas

### RF-B-COT: MOD-COT-01 (Cotizaciones — Vista Seller)
- RF-COT-001: Listado de cotizaciones (pipeline comercial B2B)
- RF-COT-002: Detalle de cotización con visor PDF
- RF-COT-003: Descargar PDF de cotización (vista SELLER)

### RF-B-DIS: MOD-DIS-01 (Integración Distribuidor)
- RF-DIS-001: Autenticación HMAC con nonce no reutilizable
- RF-DIS-002: Sincronización de precios vía API
- RF-DIS-003: Sincronización de stock vía API
- RF-DIS-004: Rechazo de SKUs desconocidos (procesamiento parcial de batch)

**Criterios de aceptación para Fase B:**
- Todos los 32 RFs tienen implementación backend (FastAPI) + tests (TDD)
- Los módulos con UI tienen páginas Next.js funcionales
- La Matriz Complementaria actualizada con ✅ Listo en cada RF
- Cada módulo sigue TDD: RED → GREEN → REFACTOR

---

## FASE C — Pipeline GRI (DevSecOps)

### RF-C-001: Infraestructura Docker
Levantar los contenedores del pipeline DevSecOps con `docker compose` y verificar que los 3 servicios estén Up.

### RF-C-002: Configuración del Jenkinsfile
Adaptar únicamente las líneas marcadas con 🔧 en `desarrollo-GRI.md`: PROJECT_PATH, PROJECT_KEY, configuración TypeScript para SonarQube.

### RF-C-003: Ejecución del pipeline (7 etapas)
Ejecutar las 7 etapas: Checkout, SAST, SCA, Security Gate, Build de imagen, Deploy staging (condicional), DAST.

### RF-C-004: Reporte Capítulo IV
Generar los 9 bloques del reporte según la estructura exacta de `desarrollo-GRI.md` sección 3.1:
- 4.X.1 Descripción del sistema
- 4.X.2 Configuración del pipeline
- 4.X.3 Evidencia SAST (SonarQube + Semgrep)
- 4.X.4 Evidencia SCA y secretos (Trivy + Dependency-Check)
- 4.X.5 Evidencia Security Gate
- 4.X.6 Evidencia Build y despliegue
- 4.X.7 Evidencia DAST (o limitación declarada)
- 4.X.8 Análisis propio (con cita APA7)
- 4.X.9 Tabla de métricas (obligatoria)

**Criterios de aceptación para Fase C:**
- Pipeline ejecuta sin modificar herramientas ni criterios del Security Gate
- Los 9 bloques del reporte están completos
- Las evidencias son capturas o salidas reales del pipeline
