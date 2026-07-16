# Alling — Diseño del Plan de Ejecución

## Stack Técnico

- **Frontend:** Next.js 15, React 19, Tailwind CSS v4, TypeScript, Axios
- **Backend:** FastAPI (Python), SQLAlchemy, Supabase (PostgreSQL + RLS)
- **Auth:** JWT RS256, Google OAuth (CUSTOMER), MFA TOTP (ADMIN)
- **Pagos:** Mercado Pago SDK
- **Pipeline CI/CD:** Jenkins, SonarQube, Semgrep, Trivy, OWASP ZAP

---

## FASE A — Estrategia de Debugging

### Reglas estrictas
- NO agregar features nuevas
- NO reescribir arquitectura (Next.js 15 App Router + Tailwind)
- Respetar la separación Server Components vs Client Components
- Mantener integración con backend (endpoints `/api/v1/...`)

### Proceso de corrección
1. `npm run build 2>&1` → clasificar errores por severidad
2. 🔴 Build errors → corregir primero (TypeScript types, imports rotos, missing exports)
3. 🟡 Runtime errors → corregir después (hydration, missing env vars, fetch errors)
4. 🟢 Visual/UX → solo si hay tiempo

### Páginas críticas a validar
- `/` — Landing (app/page.tsx)
- `/productos` — Catálogo (app/productos/page.tsx — puede no existir aún)
- `/formato` o `/formatos` — Formato Único
- `/checkout` — Checkout
- `/dashboard` — Dashboard post-login

---

## FASE B — Arquitectura de Módulos

### Estructura de archivos nuevos

```
backend/
  app/
    services/
      scheduler_service.py      # AUTO-SYS-002
      notification_service.py   # RF-SYS-004
    api/
      routers/
        admin.py                # MOD-ADM-01
        seller.py               # MOD-SEL-01
        consultas.py            # MOD-CON-01
        cotizaciones.py         # MOD-COT-01
        distribuidor.py         # MOD-DIS-01
        system.py               # MOD-SYS-01

frontend/
  src/
    app/
      admin/
        usuarios/page.tsx       # SCR-ADM-001
        productos/page.tsx      # SCR-ADM-002
        metricas/page.tsx       # SCR-ADM-003
        configuracion/page.tsx  # SCR-ADM-004
        kits/page.tsx           # SCR-ADM-005
      vendedor/
        stock/page.tsx          # SCR-SEL-001
        pedidos/page.tsx        # SCR-SEL-002
        pedidos/[id]/guia/page.tsx  # SCR-SEL-003
        consultas/page.tsx      # SCR-CON-001
        consultas/[id]/page.tsx # SCR-CON-002
        cotizaciones/page.tsx   # SCR-COT-001
        cotizaciones/[id]/page.tsx  # SCR-COT-002
    components/
      admin/
        UserTable.tsx
        ProductForm.tsx
        KitBuilder.tsx
        MetricsChart.tsx
      seller/
        StockTable.tsx
        OrderQueue.tsx
        ShippingForm.tsx
        ConsultaQueue.tsx
        CotizacionList.tsx
      layout/
        Header.tsx              # CMP-SYS-009 (sticky con notificaciones)
        Footer.tsx              # CMP-SYS-010
        NotificationBadge.tsx   # CMP-SYS-011
```

### Orden de implementación (dependencias)
```
MOD-SYS-01  ──────────────────────────────────┐
                                               ↓
MOD-ADM-01 (depende de AuditLog SYS-01)       │
MOD-SEL-01 (depende de AuditLog SYS-01)       │
MOD-CON-01 (depende de FSM FU-01)             │
MOD-COT-01 (depende de FSM FU-01)             │
MOD-DIS-01 (depende de AuditLog SYS-01)       │
```

### Metodología TDD por RF
1. Escribir test que falla (RED)
2. Implementar mínimo para pasar (GREEN)
3. Refactorizar sin romper tests (REFACTOR)
4. Actualizar MATRIZ_COMPLEMENTARIA.md con ✅ Listo

---

## FASE C — Pipeline GRI

### Adaptaciones permitidas en Jenkinsfile
Solo las líneas marcadas con 🔧:
- `PROJECT_PATH` → ruta absoluta al repo
- `PROJECT_KEY` → "alling"
- Añadir `-Dsonar.typescript.tsconfigPath=tsconfig.json`

### Lo que NO se toca
- Herramientas: SonarQube, Semgrep, Trivy, OWASP ZAP, Dependency-Check
- Criterios del Security Gate (bloqueo ante CVEs críticos)
- Estructura de las 7 etapas del pipeline

### Estructura del Reporte Capítulo IV
Archivo: `04_EJECUCION/CAPITULO_IV_GRI.md`
Secciones 4.X.1 a 4.X.9 según plantilla de `desarrollo-GRI.md` sección 3.1.
