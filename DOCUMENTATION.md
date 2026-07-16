# DOCUMENTATION.md — Alling B2B Platform

> Documento técnico de referencia para la arquitectura de autenticación y gestión de rutas.
> Actualizado: Julio 2026 — Sprint 4

---

## 1. Matriz de Rutas de Autenticación

| Ruta | Audiencia | Propósito | Método de Auth | RF Relacionado |
|---|---|---|---|---|
| `/auth/login` | Clientes (CUSTOMER) | Acceso al portal de compras B2B | Google OAuth 2.0 | **RF-AUT-001** |
| `/admin/login` | Personal interno (ADMIN, SELLER) | Acceso al panel de gestión | Email + Contraseña (local) | **RF-AUT-007** |

## 1b. Matriz de Rutas — API de Pedidos (Orders)

| Método | Ruta | Acceso | Propósito | RF Relacionado |
|---|---|---|---|---|
| `GET` | `/orders/` | CUSTOMER (JWT) | Lista todos los pedidos del usuario autenticado. Cadena: JWT → FormatoUnico → Orders | **RF-ORD-001** |
| `GET` | `/orders/{order_id}` | CUSTOMER (JWT) | Detalle completo de un pedido con verificación de ownership transitivo | **RF-ORD-001** |

### Cadena de Aislamiento RLS

```
JWT (user_id)
  └─→ FormatoUnico (customer_id = user_id)
        └─→ Order (formato_unico_id)
```

El usuario solo puede ver pedidos de sus propios `FormatosUnicos`. Si la cadena no se cumple → HTTP 403.

### Principio de diseño

Se usan **dos flujos de autenticación completamente separados** para aislar la superficie de ataque:

- Los clientes nunca ven ni tienen acceso al formulario de credenciales del personal.
- El personal nunca puede usar Google OAuth para acceder al panel, lo que evita suplantación de identidad.

---

## 2. Matriz de Requisitos Funcionales — Módulo Auth

| RF | Nombre | Actor | Estado | Implementación |
|---|---|---|---|---|
| **RF-AUT-001** | Login con Google OAuth (CUSTOMER) | CUSTOMER | ✅ Listo | `POST /auth/google` + `@react-oauth/google` |
| **RF-AUT-002** | Login local (SELLER/ADMIN) | SELLER, ADMIN | ✅ Listo | `POST /auth/login` + `AuthService` |
| **RF-AUT-003** | Verificar código MFA (TOTP) | ADMIN | ✅ Listo | `MFAService` + `pyotp` |
| **RF-AUT-006** | Cerrar sesión | Todos | ✅ Listo | `logout()` limpia localStorage + redirige |
| **RF-AUT-007** 🆕 | Acceso Administrativo por Credenciales | ADMIN, SELLER | ✅ Listo | `src/app/admin/login/page.tsx` |
| **RF-AUT-008** | Auto-completado datos de facturación | CUSTOMER | ✅ Listo | `GET /usuarios/me/facturacion` |

### ¿Dónde está el "registro" de CUSTOMER?

> **No existe un formulario de registro separado.** Por diseño del sistema B2B, el primer inicio de sesión con Google a través de **RF-AUT-001** activa automáticamente el flujo de **auto-register** en el backend (`POST /auth/google`). Si el `google_id` no existe en la base de datos, se crea la fila del usuario en ese instante. El cliente nunca percibe esta distinción.

---

## 3. Guía de Autenticación — Por qué dos flujos distintos

### Flujo CUSTOMER (Google OAuth 2.0)

```
Browser → /auth/login
  → Botón "Sign in with Google" (@react-oauth/google)
  → Google abre el popup de cuentas
  → Google retorna un id_token (JWT firmado por Google)
  → Frontend envía: POST /auth/google { token: "<id_token>" }
  → Backend verifica el token con google-auth library
  → Backend busca usuario por google_id; si no existe, lo crea (auto-register)
  → Backend retorna JWT propio firmado
  → Frontend guarda JWT en localStorage y redirige a /
```

**Ventajas:**
- Sin contraseñas que gestionar o que puedan filtrarse.
- Identidad verificada por Google (2FA de Google incluido).
- Onboarding instantáneo: no hay paso de "registro".

### Flujo ADMIN/SELLER (Credenciales Locales)

```
Browser → /admin/login
  → Formulario email + password (temática oscura/segura)
  → Frontend envía: POST /auth/login { email, password }
  → Backend verifica hash Argon2id contra DB interna
  → Si role == ADMIN: se requiere también MFA (RF-AUT-003)
  → Backend retorna JWT con payload { sub, role, mfa_validated }
  → Frontend guarda JWT y redirige al panel de admin
```

**Ventajas:**
- Control total sobre el alta y baja de cuentas de personal.
- Aislado de proveedores externos (Google no puede revocar acceso al panel).
- MFA obligatorio para ADMIN (RF-AUT-003) sin depender de Google Authenticator.

---

## 4. Protección de Rutas (ProtectedRoute)

El componente `src/components/ProtectedRoute.tsx` acepta un prop `requiredRole`:

```tsx
// Ruta solo para CUSTOMER (redirige a /auth/login si no hay sesión)
<ProtectedRoute requiredRole="CUSTOMER">
  <FormatosPage />
</ProtectedRoute>

// Ruta solo para ADMIN (redirige a /admin/login si no hay sesión)
<ProtectedRoute requiredRole="ADMIN">
  <DashboardAdminPage />
</ProtectedRoute>

// Cualquier usuario autenticado (redirige al login más apropiado)
<ProtectedRoute>
  <HomePage />
</ProtectedRoute>
```

| Escenario | Comportamiento |
|---|---|
| Sin sesión + ruta CUSTOMER | Redirige a `/auth/login` |
| Sin sesión + ruta ADMIN | Redirige a `/admin/login` |
| CUSTOMER intenta acceder a ruta ADMIN | Redirige a `/admin/login` |
| ADMIN intenta acceder a ruta CUSTOMER | Redirige a `/` |

---

## 5. Variables de Entorno Requeridas

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<tu_client_id>.apps.googleusercontent.com
```

### Backend (`backend/.env`)

```env
GOOGLE_CLIENT_ID=<tu_client_id>.apps.googleusercontent.com
```

> **Nota:** El `GOOGLE_CLIENT_ID` debe obtenerse desde Google Cloud Console > APIs & Services > Credentials. En modo desarrollo, si no está configurado, el backend acepta cualquier string como `google_id` (modo dev).

---

## 6. Estructura de Archivos Relevantes

```
frontend/src/
├── app/
│   ├── auth/
│   │   └── login/page.tsx        # CUSTOMER login (Google OAuth)
│   ├── admin/
│   │   └── login/page.tsx        # ADMIN/SELLER login (credenciales)
│   └── formatos/page.tsx         # Carga masiva B2B (requiere CUSTOMER)
├── components/
│   └── ProtectedRoute.tsx        # Guard de rutas con soporte de roles
├── context/
│   └── AuthContext.tsx           # Estado global de sesión + JWT
└── lib/
    └── api.ts                    # Axios + interceptor Bearer token

backend/app/
├── api/endpoints/
│   └── auth.py                   # POST /auth/google (Google OAuth real)
├── models/
│   └── user.py                   # Modelo SQLAlchemy User
├── db/
│   └── database.py               # Motor SQLite + SessionLocal
└── services/
    └── auth_service.py           # JWT sign/verify
```

## 5. Refactorizaci�n de Persistencia de Producci�n

Se realiz� la migraci�n del esquema de almacenamiento desde repositorios vol�tiles en memoria hacia persistencia real usando Supabase y SQLAlchemy. Esta transici�n consolida la base de datos de producci�n:

- **Conexi�n de Base de Datos:** Configurada a trav�s de \DATABASE_URL\ (Soporte PostgreSQL/Supabase con fallback local SQLite).
- **ORM Real:** Los modelos \FormatoUnico\ y \Order\ est�n integrados como tablas SQLAlchemy conectadas bidireccionalmente (\customer_id\ y \ormato_unico_id\).
- **Zero Trust Endpoint:** El \DashboardService\ y \GET /dashboard/\ (RF-FU-012) fueron reescritos para consultar la Base de Datos inyectada directamente (\db: Session\), filtrando por el usuario extra�do exclusivamente desde el token JWT validado (\Depends(get_current_user)\).

