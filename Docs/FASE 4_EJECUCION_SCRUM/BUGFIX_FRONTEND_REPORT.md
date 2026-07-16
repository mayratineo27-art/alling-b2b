# 🐛 BUGFIX FRONTEND REPORT — Alling v1.2

**Fecha:** 2025-07-14  
**Resultado final:** ✅ Build exitoso

---

## Bugs Encontrados

| # | Archivo | Tipo | Descripción | RF Asociado |
|---|---------|------|-------------|-------------|
| 1 | `src/app/auth/login/page.tsx` | 🔴 Blocking | Prop `locale` no existe en el tipo `GsiButtonConfiguration` del componente `<GoogleLogin>` de `@react-oauth/google`. TypeScript rechaza la propiedad y bloquea el build. | RF-AUTH-001 |
| 2 | `src/hooks/useDashboardData.ts` | 🔴 Blocking | Uso de `int` como tipo TypeScript en la propiedad `cantidad` de la interfaz `OrderItem`. `int` no es un tipo válido en TypeScript (solo en lenguajes como C# o Java). Causaría error de tipo implícito. | RF-DASH-001 |
| 3 | `src/app/productos/page.tsx` | 🟡 Runtime | La ruta `/productos` no tenía archivo `page.tsx`. La navegación a `/productos` retornaba 404. | RF-CAT-001 |
| 4 | `src/app/checkout/page.tsx` | 🟡 Runtime | La ruta `/checkout` no tenía archivo `page.tsx`. La navegación desde `/formatos` (botón "Convertir en Pedido") retornaba 404. | RF-CHK-001 |

---

## Correcciones Aplicadas

### Bug 1: Prop `locale` inválida en `<GoogleLogin>`
- **Archivo:** `src/app/auth/login/page.tsx`
- **Línea:** 74
- **Problema:** La versión `^0.13.5` de `@react-oauth/google` no incluye `locale` como prop válida del componente `<GoogleLogin>`. El tipo `GsiButtonConfiguration` no acepta esa propiedad.
- **Solución:** Se eliminó únicamente la línea `locale="es"` del componente. El resto de la configuración (`text`, `shape`, `theme`, `size`, `width`) permanece intacta.
- **RF Asociado:** RF-AUTH-001

### Bug 2: Tipo `int` inválido en TypeScript
- **Archivo:** `src/hooks/useDashboardData.ts`
- **Línea:** 12
- **Problema:** La propiedad `cantidad` en la interfaz `OrderItem` estaba tipada como `int`, que no existe en TypeScript.
- **Solución:** Se cambió `int` por `number`, el tipo numérico correcto en TypeScript.
- **RF Asociado:** RF-DASH-001

### Bug 3: Página `/productos` faltante
- **Archivo:** `src/app/productos/page.tsx` *(creado)*
- **Problema:** La ruta `/productos` no tenía `page.tsx`, causando 404 en tiempo de ejecución.
- **Solución:** Se creó un stub mínimo de Server Component (sin `'use client'`) que renderiza un placeholder. No se agregó lógica de negocio.
- **RF Asociado:** RF-CAT-001

### Bug 4: Página `/checkout` faltante
- **Archivo:** `src/app/checkout/page.tsx` *(creado)*
- **Problema:** La ruta `/checkout` no tenía `page.tsx`. El botón "Convertir en Pedido" en `/formatos` redirige con `router.push("/checkout")`, causando 404.
- **Solución:** Se creó un stub mínimo de Server Component que renderiza un placeholder. No se agregó lógica de negocio.
- **RF Asociado:** RF-CHK-001

---

## Resultado del Build

```
▲ Next.js 16.2.10 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 11.4s
✓ Finished TypeScript in 10.1s
✓ Collecting page data using 11 workers in 6.7s
✓ Generating static pages using 11 workers (10/10) in 6.7s
✓ Finalizing page optimization in 168ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /admin/login
├ ○ /auth/login
├ ○ /checkout
├ ○ /dashboard
├ ○ /formatos
└ ○ /productos

○  (Static)  prerendered as static content

Exit Code: 0
```

---

## Estado de Páginas Críticas

| Página | Ruta | Estado |
|--------|------|--------|
| Landing | `/` | ✅ OK — Página funcional con fetch al catálogo B2B |
| Catálogo | `/productos` | ⚠️ Stub — Creada página mínima, pendiente implementación |
| Formato Único | `/formatos` | ✅ OK — Página funcional con carga de Excel y validación FSM |
| Checkout | `/checkout` | ⚠️ Stub — Creada página mínima, pendiente implementación |
| Dashboard | `/dashboard` | ✅ OK — Página funcional con `ProtectedRoute`, `DashboardLayout`, `MainWidget` y `OrderHistoryTable` |

---

## Notas Adicionales

- El proyecto usa **Next.js 16.2.10** con **App Router** y **Turbopack**.
- El proyecto usa **Tailwind CSS v4** — compatible con las clases usadas.
- **`AuthContext`** (`src/context/AuthContext.tsx`) está correctamente marcado como `'use client'` y provee autenticación basada en localStorage + JWT. No requería cambios.
- **`ProtectedRoute`** (`src/components/ProtectedRoute.tsx`) está correctamente marcado como `'use client'` y maneja redirección por rol. No requería cambios.
- **`DashboardLayout`**, **`MainWidget`**, **`OrderHistoryTable`** son Server Components correctamente estructurados. No requería cambios.
- La URL base del backend (`http://127.0.0.1:8000`) en `src/lib/api.ts` **no fue modificada**.
