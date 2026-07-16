# Implementation Plan: Alling Master Execution Plan

## Overview

This spec implements the complete 3-phase master execution plan for Alling:
- **Fase A:** Frontend debugging (get clean build)
- **Fase B:** Implement 6 missing modules (SYS, ADM, SEL, CON, COT, DIS)
- **Fase C:** GRI DevSecOps pipeline + Capítulo IV report

See requirements.md and design.md for complete context.

## Tasks

### FASE A — Debugging del Frontend

- [ ] 1. Auditoría inicial: ejecutar build y clasificar errores
  - Ejecutar `npm run build` en `frontend/` y capturar salida completa
  - Clasificar cada error: 🔴 Build/TypeScript blocking | 🟡 Runtime | 🟢 Visual
  - Listar páginas críticas que existen actualmente vs. las esperadas
  - Documentar hallazgos en memoria para el siguiente paso
  - **Archivos relevantes:** `frontend/package.json`, `frontend/tsconfig.json`, `frontend/src/app/`

- [ ] 2. Corregir errores de TypeScript y build bloqueantes
  - Leer cada archivo con error de tipo o import roto reportado en tarea 1
  - Aplicar corrección mínima (no reescribir, solo arreglar el error)
  - Verificar que el error desaparece con `tsc --noEmit` o build parcial
  - Respetar Server Components vs Client Components (no agregar 'use client' innecesariamente)
  - **Dependencias:** tarea 1

- [ ] 3. Verificar y corregir páginas críticas faltantes
  - Revisar si existen: `/productos`, `/checkout`, `/dashboard`
  - Si una página crítica no existe, crear un stub mínimo funcional (no feature completa)
  - Si existe pero tiene errores de runtime, corregir el error mínimo
  - No agregar lógica nueva, solo asegurar que la ruta carga
  - **Dependencias:** tarea 2

- [ ] 4. Ejecutar build final y generar reporte de bugs
  - Ejecutar `npm run build` — debe pasar sin errores
  - Crear `Docs/FASE 4_EJECUCION_SCRUM/BUGFIX_FRONTEND_REPORT.md` con:
    - Lista de bugs encontrados (clasificados 🔴/🟡/🟢)
    - Correcciones aplicadas (archivo, línea, descripción del cambio)
    - Resultado final del build
  - **Dependencias:** tarea 3

---

## FASE B — Implementación de Módulos Faltantes

### B.1 — MOD-SYS-01: Sistema Transversal

- [ ] 5. Implementar SchedulerService (RF-SYS-002)
  - Crear `backend/app/services/scheduler_service.py`
  - Implementar job de expiración de cotizaciones (AUTO-FU-002: FU COTIZACIÓN → EXPIRADA tras 7 días)
  - Implementar job de timeout de pagos pendientes (AUTO-CHK-003: Order PEDIDO → CANCELADO tras 30 min)
  - Implementar job de purga de audit_logs (AUTO-SYS-003: retención 12 meses)
  - Seguir TDD: escribir tests en `backend/tests/test_scheduler_service.py` primero
  - Registrar scheduler en `backend/app/main.py` como lifespan event
  - **Archivos a crear:** `backend/app/services/scheduler_service.py`, `backend/tests/test_scheduler_service.py`

- [ ] 6. Implementar NotificationService (RF-SYS-004)
  - Crear `backend/app/services/notification_service.py`
  - Implementar creación de notificaciones por evento de dominio (FSM transitions)
  - Implementar endpoint GET `/api/v1/notifications` (últimas 20, paginado)
  - Implementar endpoint POST `/api/v1/notifications/{id}/read`
  - Escribir tests TDD en `backend/tests/test_notification_service.py`
  - **Archivos a crear:** `backend/app/services/notification_service.py`, `backend/app/api/routers/system.py`

- [ ] 7. Implementar sistema de diseño global (RF-SYS-001, RF-SYS-003, RF-SYS-005)
  - Crear/actualizar variables CSS en `frontend/src/app/globals.css` con paleta de colores Alling
  - Crear `frontend/src/components/layout/Header.tsx` (CMP-SYS-009: sticky, logo, buscador, iconos)
  - Crear `frontend/src/components/layout/Footer.tsx` (CMP-SYS-010: tema oscuro, trust signals)
  - Crear `frontend/src/components/layout/NotificationBadge.tsx` (CMP-SYS-011: badge con polling)
  - Actualizar `frontend/src/app/layout.tsx` para incluir Header y Footer globales
  - **Dependencias:** tarea 6

### B.2 — MOD-ADM-01: Panel Admin

- [ ] 8. Backend Admin — CRUD de usuarios (RF-ADM-001 a 004)
  - Crear `backend/app/api/routers/admin.py`
  - Implementar GET `/admin/usuarios` con filtros por rol y estado
  - Implementar POST `/admin/usuarios` (crear SELLER/ADMIN, auth_provider=LOCAL)
  - Implementar PATCH `/admin/usuarios/{id}/suspender` (respeta RN-ADMIN-01 y RN-ADMIN-02)
  - Implementar DELETE `/admin/usuarios/{id}` (soft-delete con is_active=false)
  - Todos los endpoints requieren rol ADMIN + MFA verificado
  - Escribir tests TDD
  - **Dependencias:** tareas 5, 6
  - **Archivos:** `backend/app/api/routers/admin.py`, `backend/tests/test_admin_users.py`

- [ ] 9. Backend Admin — CRUD de catálogo y configuración (RF-ADM-005 a 009)
  - Implementar GET/POST/PATCH/DELETE `/admin/productos` (CRUD completo con imágenes)
  - Implementar GET/POST/PATCH/DELETE `/admin/kits`
  - Implementar GET/PUT `/admin/configuracion` (SystemConfig: dias_vigencia, stock_min_threshold)
  - Implementar POST `/admin/exportar` (requiere MFA step-up, genera CSV/JSON)
  - Implementar GET `/admin/metricas/ventas` (revenue por período, top productos)
  - Escribir tests TDD
  - **Dependencias:** tarea 8

- [ ] 10. Frontend Admin — páginas de gestión
  - Crear `frontend/src/app/admin/usuarios/page.tsx` (SCR-ADM-001: tabla + modales CRUD)
  - Crear `frontend/src/app/admin/productos/page.tsx` (SCR-ADM-002: tabla + formulario)
  - Crear `frontend/src/app/admin/metricas/page.tsx` (SCR-ADM-003: gráficos de revenue)
  - Crear `frontend/src/app/admin/configuracion/page.tsx` (SCR-ADM-004: parámetros + export)
  - Crear `frontend/src/app/admin/kits/page.tsx` (SCR-ADM-005: Kit Builder)
  - Crear componentes en `frontend/src/components/admin/`
  - Proteger rutas con verificación rol ADMIN
  - **Dependencias:** tareas 7, 9

### B.3 — MOD-SEL-01: Panel Seller

- [ ] 11. Backend Seller — stock y pedidos (RF-SEL-001 a 007)
  - Crear `backend/app/api/routers/seller.py`
  - Implementar GET `/seller/stock` (listado con stock_real = stock - reserved_stock)
  - Implementar PATCH `/seller/stock/{id}` (actualizar stock, validar >= 0)
  - Implementar PATCH `/seller/stock/{id}/umbral` (configurar stock_min_threshold)
  - Implementar GET `/seller/pedidos` (filtro por READY_TO_SHIP / SHIPPED)
  - Implementar POST `/seller/pedidos/{id}/guia` (generar guía mock Shalom, transición READY_TO_SHIP→SHIPPED)
  - Escribir tests TDD
  - **Dependencias:** tarea 5
  - **Archivos:** `backend/app/api/routers/seller.py`, `backend/tests/test_seller.py`

- [ ] 12. Frontend Seller — páginas de gestión operativa
  - Crear `frontend/src/app/vendedor/stock/page.tsx` (SCR-SEL-001: tabla editable inline)
  - Crear `frontend/src/app/vendedor/pedidos/page.tsx` (SCR-SEL-002: cola + filtros)
  - Crear `frontend/src/app/vendedor/pedidos/[id]/guia/page.tsx` (SCR-SEL-003: formulario de guía)
  - Crear componentes en `frontend/src/components/seller/`
  - Proteger rutas con verificación rol SELLER
  - **Dependencias:** tareas 7, 11

### B.4 — MOD-CON-01: Consultas Pre-Venta

- [ ] 13. Backend Consultas (RF-CON-001 a 004)
  - Crear `backend/app/api/routers/consultas.py`
  - Implementar GET `/seller/consultas` (FU en estado CONSULTA, filtros asignación/fecha)
  - Implementar POST `/seller/consultas/{id}/tomar` (asignar seller_id, bloqueo optimista 409 si ya asignada)
  - Implementar POST `/seller/consultas/{id}/responder` (transición CONSULTA→RESUELTA, escribe consultant_note)
  - Validar que solo el SELLER asignado puede responder (RN-CON-002)
  - Escribir tests TDD (incluir test de condición de carrera)
  - **Dependencias:** tarea 5
  - **Archivos:** `backend/app/api/routers/consultas.py`, `backend/tests/test_consultas.py`

- [ ] 14. Frontend Consultas — páginas SELLER
  - Crear `frontend/src/app/vendedor/consultas/page.tsx` (SCR-CON-001: cola + filtros)
  - Crear `frontend/src/app/vendedor/consultas/[id]/page.tsx` (SCR-CON-002: detalle + editor respuesta)
  - Crear componentes en `frontend/src/components/seller/` (ConsultaQueue, ConsultaDetail)
  - **Dependencias:** tareas 12, 13

### B.5 — MOD-COT-01: Cotizaciones (Vista Seller)

- [ ] 15. Backend Cotizaciones (RF-COT-001 a 003)
  - Crear `backend/app/api/routers/cotizaciones.py`
  - Implementar GET `/seller/cotizaciones` (FU en COTIZACIÓN/EXPIRADA/PEDIDO/CONFIRMADO)
  - Implementar GET `/seller/cotizaciones/{id}` (detalle completo con historial de transiciones)
  - Implementar GET `/seller/cotizaciones/{id}/pdf` (redirect a pdf_url o 404)
  - Este módulo es solo lectura — el SELLER no muta cotizaciones
  - Escribir tests TDD
  - **Dependencias:** tarea 5
  - **Archivos:** `backend/app/api/routers/cotizaciones.py`, `backend/tests/test_cotizaciones.py`

- [ ] 16. Frontend Cotizaciones — páginas SELLER
  - Crear `frontend/src/app/vendedor/cotizaciones/page.tsx` (SCR-COT-001: pipeline con badges de vigencia)
  - Crear `frontend/src/app/vendedor/cotizaciones/[id]/page.tsx` (SCR-COT-002: detalle + visor PDF)
  - **Dependencias:** tareas 12, 15

### B.6 — MOD-DIS-01: Integración Distribuidor

- [ ] 17. Backend Distribuidor — sincronización HMAC (RF-DIS-001 a 004)
  - Crear `backend/app/api/routers/distribuidor.py`
  - Implementar middleware de autenticación HMAC-SHA256 con verificación de nonce
  - Implementar POST `/api/v1/distribuidor/sync` (batch de precios y stock)
  - Lógica: actualizar solo SKUs existentes (RN-DIST-01), rechazar desconocidos con 404 parcial
  - Registrar cada sincronización en AuditLog
  - Escribir tests TDD (incluir test de replay de nonce → 409)
  - **Dependencias:** tarea 5
  - **Archivos:** `backend/app/api/routers/distribuidor.py`, `backend/tests/test_distribuidor.py`

- [ ] 18. Actualizar MATRIZ_COMPLEMENTARIA.md con estado de Fase B
  - Crear/actualizar `Docs/FASE 4_EJECUCION_SCRUM/MATRIZ_COMPLEMENTARIA.md`
  - Marcar ✅ Listo todos los RFs completados en Fase B
  - Incluir fecha de completación y referencia a archivos creados
  - **Dependencias:** tareas 5 a 17

---

## FASE C — Pipeline GRI

- [ ] 19. Verificar infraestructura DevSecOps
  - Leer `desarrollo-GRI.md` para entender el setup completo
  - Verificar si existe `docker-compose-devsecops.yml` en `~/devsecops-infra/`
  - Documentar el estado actual de la infraestructura (disponible/no disponible)
  - Si la infraestructura no está disponible localmente, documentarlo como limitación declarada
  - **Archivos relevantes:** `desarrollo-GRI.md`

- [ ] 20. Adaptar Jenkinsfile (solo líneas 🔧)
  - Leer el Jenkinsfile actual o la plantilla en `desarrollo-GRI.md`
  - Adaptar ÚNICAMENTE: PROJECT_PATH, PROJECT_KEY="alling", sonar.typescript.tsconfigPath
  - NO modificar: herramientas, Security Gate, estructura de etapas
  - Guardar Jenkinsfile adaptado en `Docs/FASE 4_EJECUCION_SCRUM/Jenkinsfile`
  - **Dependencias:** tarea 19

- [ ] 21. Ejecutar pipeline y recopilar evidencias
  - Si la infraestructura está disponible: ejecutar pipeline y capturar salidas de cada etapa
  - Si no está disponible: documentar cada etapa con salida esperada/simulada como limitación declarada
  - Recopilar evidencias de: SAST (SonarQube + Semgrep), SCA (Trivy + Dependency-Check), Security Gate, Build
  - **Dependencias:** tarea 20

- [ ] 22. Generar Capítulo IV del reporte GRI
  - Crear `Docs/FASE 4_EJECUCION_SCRUM/CAPITULO_IV_GRI.md`
  - Escribir los 9 bloques obligatorios (4.X.1 a 4.X.9) siguiendo estructura exacta de `desarrollo-GRI.md` sección 3.1
  - 4.X.1: Descripción del sistema Alling
  - 4.X.2: Configuración del pipeline (Jenkinsfile adaptado)
  - 4.X.3: Evidencia SAST con análisis
  - 4.X.4: Evidencia SCA y detección de secretos
  - 4.X.5: Evidencia Security Gate (criterios + resultado)
  - 4.X.6: Evidencia Build y despliegue (o limitación)
  - 4.X.7: Evidencia DAST (o limitación declarada)
  - 4.X.8: Análisis propio con cita APA7
  - 4.X.9: Tabla de métricas (obligatoria)
  - **Dependencias:** tarea 21

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3"] },
    { "wave": 4, "tasks": ["4"] },
    { "wave": 5, "tasks": ["5", "6"] },
    { "wave": 6, "tasks": ["7", "8", "11", "13", "15", "17"] },
    { "wave": 7, "tasks": ["9"] },
    { "wave": 8, "tasks": ["10", "12"] },
    { "wave": 9, "tasks": ["14", "16"] },
    { "wave": 10, "tasks": ["18"] },
    { "wave": 11, "tasks": ["19"] },
    { "wave": 12, "tasks": ["20"] },
    { "wave": 13, "tasks": ["21"] },
    { "wave": 14, "tasks": ["22"] }
  ],
  "dependencies": {
    "2": ["1"],
    "3": ["2"],
    "4": ["3"],
    "7": ["6"],
    "8": ["5", "6"],
    "9": ["8"],
    "10": ["7", "9"],
    "11": ["5"],
    "12": ["7", "11"],
    "13": ["5"],
    "14": ["12", "13"],
    "15": ["5"],
    "16": ["12", "15"],
    "17": ["5"],
    "18": ["10", "12", "14", "16", "17"],
    "19": ["18"],
    "20": ["19"],
    "21": ["20"],
    "22": ["21"]
  }
}
```

## Notes

- Fase A must complete (task 4 done) before starting Fase B.
- Fase B must complete (task 18 done) before starting Fase C.
- All backend implementation follows strict TDD: RED → GREEN → REFACTOR.
- Never modify what already works — minimal changes only for bug fixes.
- For Fase C: if Docker infra is unavailable locally, document each stage as a declared limitation instead of skipping the report blocks.
- Reference files: `Docs/Módulos/MOD-*.md`, `Docs/FASE 4_EJECUCION_SCRUM/MATRIZ_TRAZABILIDAD_GLOBAL.md`, `desarrollo-GRI.md`
