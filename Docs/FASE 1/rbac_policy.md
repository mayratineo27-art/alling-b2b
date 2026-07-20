# RBAC Policy — Sistema Alling

|Campo|Valor|
|---|---|
|**ID Documento**|DOC_ALLING_RBAC_POLICY_001|
|**Versión**|1.0.0|
|**Estado**|Borrador (pendiente VoBo)|
|**Fuente de verdad**|`zero_trust_actors.md`, `functional_requirements.md`, `business_rules.yaml`, `PROJECT_OVERVIEW.md`|
|**Metodología**|Zero Trust Architecture + OAARIT|
|**Fecha**|30 de junio de 2026|

---

## 1. Introducción y Propósito

Este documento define las políticas de **Control de Acceso Basado en Roles (RBAC)** y **Seguridad a Nivel de Fila (RLS)** del sistema Alling. Establece qué actores pueden realizar qué acciones sobre qué recursos, bajo qué condiciones, y cómo se audita cada decisión de autorización.

**Principios fundamentales:**

- **Zero Trust:** Nunca confíes, verifica siempre. Cada request debe autenticarse y autorizarse explícitamente.
- **Mínimo privilegio:** Cada actor recibe solo los permisos necesarios para cumplir su función.
- **Defensa en profundidad:** Múltiples capas de validación (WAF → Middleware → JWT → RBAC → RLS).
- **Auditoría completa:** Toda decisión de autorización (grant/deny) queda registrada en `audit_logs`.

---

## 2. Principios Zero Trust Aplicados

|ID|Principio|Aplicación en Alling|
|---|---|---|
|ZT-01|Nunca confíes, verifica siempre|Cada request valida JWT + RLS + RBAC antes de ejecutar|
|ZT-02|Mínimo privilegio|Permisos verbales `<recurso>:<acción>:<scope>` granulares|
|ZT-03|Asume brecha|Logs de auditoría en toda acción mutante|
|ZT-04|Verificación explícita|Middleware Next.js + FastAPI dependency injection|
|ZT-05|Defensa en profundidad|WAF → CORS → Middleware → JWT → RBAC → RLS|
|ZT-06|Sin perímetro de confianza|ADMIN/SELLER se autentican igual que externos|

---

## 3. Actores del Sistema

|ID|Actor|Tipo|Autenticación|MFA|Vigencia Sesión|
|---|---|---|---|---|---|
|**ACT-01**|GUEST|Humano/Externo|Cookie anónima firmada|No|24h sliding|
|**ACT-02**|CUSTOMER|Humano/Externo|OAuth Google + JWT RS256|Opcional TOTP|12h access / 7d refresh|
|**ACT-03**|SELLER|Humano/Interno|Credenciales locales + JWT|Recomendado TOTP|8h access / 24h refresh|
|**ACT-04**|ADMIN|Humano/Interno|Credenciales locales + JWT|**OBLIGATORIO TOTP**|2h access / 8h refresh|
|**ACT-05**|DISTRIBUTOR|Sistema/Externo|API Key + HMAC-SHA256|N/A|Stateless|

---

## 4. Matriz de Permisos RBAC

### 4.1 Notación de Permisos

Formato: `<recurso>:<acción>:<scope>`

- **recurso:** Entidad del sistema (product, order, user, etc.)
- **acción:** Operación permitida (create, read, update, delete, list, transition_state, export)
- **scope:** Alcance de la acción (own, assigned, any, public)

### 4.2 Matriz Completa de Permisos

|Recurso|Acción|GUEST (ACT-01)|CUSTOMER (ACT-02)|SELLER (ACT-03)|ADMIN (ACT-04)|DISTRIBUTOR (ACT-05)|
|---|---|---|---|---|---|---|
|**product**|read|public|public|any|any|—|
|**product**|create|—|—|—|any|—|
|**product**|update|—|—|—|any|—|
|**product**|delete|—|—|—|any|—|
|**product**|list|public|public|any|any|—|
|**stock**|read|boolean/range|boolean/range|any|any|—|
|**stock**|update|—|—|any|any|any (via API)|
|**price_public**|read|public|public|any|any|—|
|**price_public**|update|—|—|—|any|any (via API)|
|**price_wholesale**|read|—|—|—|any|—|
|**price_wholesale**|update|—|—|—|any|any (via API)|
|**formato_unico**|create|own (1 solo)|own (múltiples)|—|any|—|
|**formato_unico**|read|own|own|assigned|any|—|
|**formato_unico**|update|own (solo BORRADOR)|own (solo BORRADOR)|—|any|—|
|**formato_unico**|delete|own (solo BORRADOR)|own (solo BORRADOR)|—|any|—|
|**formato_unico**|transition_state|own|own|—|any|—|
|**quotation**|create|—|own|—|any|—|
|**quotation**|read|—|own|assigned|any|—|
|**quotation**|respond|—|—|assigned|—|—|
|**quotation**|export|—|own|assigned|any|—|
|**order**|create|own|own|—|any|—|
|**order**|read|own (vía orderToken)|own|assigned|any|—|
|**order**|update_status|—|—|assigned|any|—|
|**order**|cancel|own (solo PENDING_PAYMENT)|own (solo PENDING_PAYMENT)|—|any|—|
|**order**|export|—|—|—|any|—|
|**user**|create|—|—|—|any|—|
|**user**|read|—|own|—|any|—|
|**user**|update|—|own|—|any|—|
|**user**|delete|—|—|—|any|—|
|**user**|assign_role|—|—|—|any|—|
|**user**|suspend|—|—|—|any|—|
|**audit_log**|read|—|own_actions|—|any|—|
|**audit_log**|export|—|—|—|any (con MFA step-up)|—|
|**metric**|read|—|—|—|any|—|
|**system_config**|read|—|—|—|any|—|
|**system_config**|update|—|—|—|any|—|
|**shipping_guide**|create|—|—|assigned|any|—|
|**shipping_guide**|read|—|own|assigned|any|—|
|**webhook_payment**|receive|—|—|—|any|any (via API)|
|**webhook_payment**|read|—|—|—|any|—|

### 4.3 Restricciones Especiales por Actor

#### GUEST (ACT-01)

- ✅ Puede crear 1 solo Formato Único en estado BORRADOR (vinculado a `guest_token`)
- ✅ Puede navegar catálogo público (lectura de productos)
- ✅ Puede completar checkout invitado (crear Order, pagar)
- No puede transicionar Formato Único a COTIZACIÓN ni PEDIDO directamente
- ❌ No puede acceder a historial de pedidos (solo vía `orderToken`)
- ❌ No puede ver stock exacto (solo booleano/rango)

#### CUSTOMER (ACT-02)

- ✅ Puede crear múltiples Formatos Únicos
- ✅ Puede transicionar BORRADOR → COTIZACIÓN → PEDIDO
- ✅ Puede descargar PDF de cotizaciones propias
- ✅ Puede ver historial completo de Formatos Únicos
- ✅ Puede activar MFA TOTP (opcional)
- ❌ No puede acceder a paneles SELLER ni ADMIN
- No puede ver datos de otros CUSTOMERs

#### SELLER (ACT-03)

- ✅ Puede ver cola de cotizaciones/consultas asignadas
- ✅ Puede responder consultas técnicas
- ✅ Puede actualizar stock de productos
- ✅ Puede generar guías de envío para pedidos asignados
- ✅ Puede marcar pedidos como SHIPPED
- **NO puede:**
- Acceder a finanzas globales, dashboards de ingresos, márgenes
- Ver datos personales sensibles de CUSTOMERs (solo nombre, email, dirección, RUC)
- Crear ni eliminar usuarios
- Modificar configuración del sistema
- Leer ni modificar precios públicos o mayoristas

#### ADMIN (ACT-04)

- ✅ Acceso total con responsabilidad total
- ⚠️ MFA obligatorio en TODO login
- ⚠️ Toda acción mutante queda en `audit_logs` (retención 12 meses)
- ⚠️ No puede eliminarse a sí mismo
- ⚠️ Sistema requiere mínimo 2 ADMINs activos
- ⚠️ Exportación de datos requiere re-autenticación MFA (step-up)

#### DISTRIBUTOR (ACT-05)

- ✅ Puede sincronizar stock vía API (con HMAC válido)
- ✅ Puede sincronizar precios vía API (con HMAC válido)
- ❌ No puede crear productos nuevos (solo actualizar existentes)
- ❌ No puede acceder a datos de usuarios, pedidos, ni configuración

---

## 5. Políticas de Row Level Security (RLS)

### 5.1 Principios RLS

Toda tabla con datos sensibles debe tener políticas RLS activas. Las políticas se evalúan en este orden:

1. **Autenticación:** ¿El usuario tiene JWT válido?
2. **Autorización RBAC:** ¿El usuario tiene el permiso `<recurso>:<acción>:<scope>`?
3. **Filtro RLS:** ¿La fila pertenece al scope del usuario?

### 5.2 Políticas por Tabla

#### Tabla: `users`

-- CUSTOMER solo puede ver su propio registro
CREATE POLICY customer_sees_own_user ON users
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'CUSTOMER'
    AND id = current_setting('app.current_user_id')::uuid
  );

-- SELLER no puede ver usuarios (solo ADMIN)
CREATE POLICY seller_cannot_see_users ON users
  FOR SELECT
  USING (false);

-- ADMIN puede ver todos los usuarios
CREATE POLICY admin_sees_all_users ON users
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'ADMIN'
  );

-- Solo ADMIN puede crear/actualizar/eliminar usuarios
CREATE POLICY admin_manages_users ON users
  FOR ALL
  USING (
    current_setting('app.current_role') = 'ADMIN'
  );

#### Tabla: `products`

-- GUEST y CUSTOMER ven productos activos (lectura pública)
CREATE POLICY public_sees_active_products ON products
  FOR SELECT
  USING (
    current_setting('app.current_role') IN ('GUEST', 'CUSTOMER')
    AND is_active = true
  );

-- SELLER ve todos los productos (incluidos inactivos)
CREATE POLICY seller_sees_all_products ON products
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'SELLER'
  );

-- ADMIN ve y gestiona todos los productos
CREATE POLICY admin_manages_products ON products
  FOR ALL
  USING (
    current_setting('app.current_role') = 'ADMIN'
  );

-- DISTRIBUTOR solo puede actualizar stock y precios (vía API)
CREATE POLICY distributor_updates_stock ON products
  FOR UPDATE
  USING (
    current_setting('app.current_role') = 'DISTRIBUTOR'
  )
  WITH CHECK (
    current_setting('app.current_role') = 'DISTRIBUTOR'
  );


#### Tabla: `formato_unico`

-- GUEST solo ve sus propios FU (vinculados a guest_token)
CREATE POLICY guest_sees_own_fu ON formato_unico
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'GUEST'
    AND guest_token = current_setting('app.current_guest_token')
  );

-- CUSTOMER solo ve sus propios FU
CREATE POLICY customer_sees_own_fu ON formato_unico
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'CUSTOMER'
    AND owner_id = current_setting('app.current_user_id')::uuid
  );

-- SELLER ve FU asignados (consultas/cotizaciones)
CREATE POLICY seller_sees_assigned_fu ON formato_unico
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'SELLER'
    AND seller_id = current_setting('app.current_user_id')::uuid
  );

-- ADMIN ve todos los FU
CREATE POLICY admin_sees_all_fu ON formato_unico
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'ADMIN'
  );

-- Solo owner puede crear/actualizar/eliminar FU (en estado BORRADOR)
CREATE POLICY owner_manages_own_fu ON formato_unico
  FOR ALL
  USING (
    current_setting('app.current_role') IN ('GUEST', 'CUSTOMER')
    AND owner_id = current_setting('app.current_user_id')::uuid
    AND state = 'BORRADOR'
  );

#### Tabla: `orders`

-- GUEST solo ve sus propios pedidos (vía orderToken, no RLS directo)
-- Nota: GUEST accede vía endpoint específico que valida orderToken

-- CUSTOMER solo ve sus propios pedidos
CREATE POLICY customer_sees_own_orders ON orders
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'CUSTOMER'
    AND customer_id = current_setting('app.current_user_id')::uuid
  );

-- SELLER ve pedidos asignados (READY_TO_SHIP, SHIPPED)
CREATE POLICY seller_sees_assigned_orders ON orders
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'SELLER'
    AND assigned_seller_id = current_setting('app.current_user_id')::uuid
  );

-- ADMIN ve todos los pedidos
CREATE POLICY admin_sees_all_orders ON orders
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'ADMIN'
  );

-- Solo ADMIN puede actualizar estado de pedidos
CREATE POLICY admin_updates_order_status ON orders
  FOR UPDATE
  USING (
    current_setting('app.current_role') = 'ADMIN'
  );

-- SELLER puede actualizar estado a SHIPPED (solo pedidos asignados)
CREATE POLICY seller_ships_assigned_orders ON orders
  FOR UPDATE
  USING (
    current_setting('app.current_role') = 'SELLER'
    AND assigned_seller_id = current_setting('app.current_user_id')::uuid
    AND status = 'READY_TO_SHIP'
  );

#### Tabla: `audit_logs`

-- Nadie puede actualizar o eliminar audit_logs (inmutabilidad)
CREATE POLICY audit_logs_immutable ON audit_logs
  FOR ALL
  USING (false);

-- Solo INSERT permitido (aplicación gestiona esto, no RLS)
-- CUSTOMER puede ver sus propios logs de acciones
CREATE POLICY customer_sees_own_audit_logs ON audit_logs
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'CUSTOMER'
    AND actor_id = current_setting('app.current_user_id')::uuid
  );

-- ADMIN puede ver todos los logs
CREATE POLICY admin_sees_all_audit_logs ON audit_logs
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'ADMIN'
  );

## 6. Reglas de Autorización Específicas

### 6.1 Reglas de Negocio Críticas

|ID|Regla|Descripción|Implementación|
|---|---|---|---|
|**RN-AUTH-001**|CUSTOMER solo vía Google OAuth|No se permiten credenciales locales para CUSTOMER|Validación en `AuthService`|
|**RN-AUTH-002**|SELLER/ADMIN solo credenciales locales|No se permite Google OAuth para roles internos|Validación en `AuthService`|
|**RN-MFA-001**|MFA obligatorio para ADMIN|Sin TOTP no se emite JWT de ADMIN|Validación en `MFAService`|
|**RN-MFA-002**|MFA step-up para exportación|ADMIN debe re-autenticarse con MFA para exportar datos|Validación en `ExportService`|
|**RN-STOCK-001**|Stock no negativo|`Product.stock >= 0` siempre|Validación en `InventoryService`|
|**RN-STOCK-002**|Umbral de stock mínimo|Alerta si `stock < stock_min_threshold`|Validación en `ProductQueryService`|
|**RN-ORDER-001**|Mínimo 2 ADMINs activos|No se puede suspender/eliminar si queda solo 1|Validación en `UserService`|
|**RN-ORDER-002**|Auto-eliminación prohibida|ADMIN no puede eliminarse a sí mismo|Validación en `UserService`|
|**RN-FU-001**|GUEST no transita a COTIZACIÓN/PEDIDO|Debe convertirse en CUSTOMER o usar checkout invitado|Validación en `StateMachineService`|
|**RN-FU-002**|PEDIDO confirmado es inmutable|No se permiten ediciones tras confirmación de pago|Validación en `StateMachineService`|
|**RN-FU-003**|COTIZACIÓN vigencia 15 días|Expira automáticamente tras 15 días|Job programado `AUTO-FU-002`|
|**RN-CHK-001**|Un FU solo puede tener 1 Order activo|Máximo un Order en PENDING_PAYMENT por FU|Validación en `OrderService`|
|**RN-CHK-002**|Precio fijo al transicionar|`price_at_time` se fija al crear COTIZACIÓN/PEDIDO|Validación en `PricingService`|
|**RN-CHK-003**|Idempotencia de webhooks|Mismo `event_id` no se procesa dos veces|Validación en `IdempotencyService`|
|**RN-DIST-001**|HMAC válido obligatorio|Toda solicitud DISTRIBUTOR debe tener firma HMAC válida|Validación en `DistributorAuthService`|
|**RN-DIST-002**|Nonce no reutilizado|Nonce no puede usarse en 24h|Validación en `NonceRegistry`|

---

## 7. Flujo de Evaluación de Permisos

### 7.1 Secuencia de Validación

# Secuencia de Autorización y Control de Acceso

```text
1. Request HTTP recibido
   ↓
2. Middleware Next.js / FastAPI
   ↓
3. Validación JWT (firma, expiración, claims)
   ↓
4. Extracción de rol y user_id desde JWT
   ↓
5. Consulta a RBAC:
   ¿El rol tiene el permiso <recurso>:<acción>:<scope>?
   ├─ NO → 403 Forbidden + registro en audit_logs
   └─ SÍ → Continuar
   ↓
6. Consulta a RLS (PostgreSQL):
   ¿La fila pertenece al scope del usuario?
   ├─ NO → 404 Not Found (para evitar filtrar la existencia del recurso)
   └─ SÍ → Continuar
   ↓
7. Ejecución de la operación solicitada
   ↓
8. Registro en audit_logs (si la acción modifica datos)
```

## Flujo resumido

- **JWT**: autentica al usuario y proporciona sus claims.
- **RBAC**: verifica si el rol posee el permiso requerido.
- **RLS**: valida que el usuario pueda acceder específicamente a la fila o recurso solicitado.
- **Audit Logs**: registra accesos denegados y operaciones que modifican datos para trazabilidad y cumplimiento.

### 7.2 Manejo de Errores de Autorización

| Escenario                        | Respuesta HTTP   | Mensaje                 | Log en audit_logs |
| -------------------------------- | ---------------- | ----------------------- | ----------------- |
| JWT inválido/expirado            | 401 Unauthorized | "Sesión expirada"       | ✅                 |
| Rol sin permiso RBAC             | 403 Forbidden    | "Permiso denegado"      | ✅                 |
| Fila no pertenece al scope       | 404 Not Found    | "Recurso no encontrado" | ✅                 |
| MFA requerido pero no verificado | 403 Forbidden    | "MFA requerido"         | ✅                 |
| Cuenta suspendida                | 403 Forbidden    | "Cuenta suspendida"     | ✅                 |

---

## 8. Auditoría de Permisos

### 8.1 Campos Obligatorios en `audit_logs`

|Campo|Tipo|Descripción|
|---|---|---|
|`id`|UUID|Identificador único del evento|
|`timestamp`|TIMESTAMPTZ|Momento exacto del evento|
|`actor_id`|UUID|ID del usuario que ejecutó la acción|
|`actor_role`|ENUM|Rol del actor (GUEST, CUSTOMER, SELLER, ADMIN, DISTRIBUTOR)|
|`event_type`|ENUM|Tipo de evento (LOGIN, PERMISSION_GRANTED, PERMISSION_DENIED, etc.)|
|`resource_type`|VARCHAR|Tipo de recurso (product, order, user, etc.)|
|`resource_id`|UUID|ID del recurso afectado|
|`action`|VARCHAR|Acción realizada (create, read, update, delete, etc.)|
|`result`|ENUM|Resultado (SUCCESS, DENIED, ERROR)|
|`ip_address`|INET|IP del cliente|
|`user_agent`|TEXT|User-Agent del cliente|
|`metadata`|JSONB|Datos adicionales (permiso evaluado, scope, etc.)|

### 8.2 Eventos de Autorización a Auditar

|Evento|Cuándo se registra|
|---|---|
|`PERMISSION_GRANTED`|Cuando RBAC/RLS permite una acción|
|`PERMISSION_DENIED`|Cuando RBAC/RLS rechaza una acción|
|`MFA_VERIFIED`|Cuando se verifica código TOTP|
|`MFA_FAILED`|Cuando falla verificación TOTP|
|`LOGIN_SUCCESS`|Login exitoso|
|`LOGIN_FAILED`|Login fallido|
|`SESSION_CREATED`|Creación de sesión|
|`SESSION_INVALIDATED`|Invalidación de sesión (logout, suspensión)|
|`DATA_EXPORTED`|Exportación de datos por ADMIN|
|`CONFIG_CHANGED`|Cambio de configuración del sistema|

---

## 9. Casos de Uso de Autorización

### 9.1 Caso: CUSTOMER intenta ver pedido de otro CUSTOMER

**Escenario:** CUSTOMER A intenta acceder a `/orders/{order_id}` donde `order_id` pertenece a CUSTOMER B.

**Flujo:**

1. Request llega con JWT de CUSTOMER A
2. Middleware valida JWT → válido
3. RBAC verifica: ¿CUSTOMER tiene permiso `order:read:own`? → SÍ
4. RLS evalúa: ¿`orders.customer_id = CUSTOMER_A.id`? → NO
5. **Resultado:** 404 Not Found (no 403, para no filtrar existencia)
6. **Audit log:** `PERMISSION_DENIED` con `resource_type=order`, `action=read`

### 9.2 Caso: SELLER intenta modificar precio de producto

**Escenario:** SELLER intenta `PUT /api/products/{id}` con `price_public` en el payload.

**Flujo:**

1. Request llega con JWT de SELLER
2. Middleware valida JWT → válido
3. RBAC verifica: ¿SELLER tiene permiso `product:update:any`? → NO (solo ADMIN)
4. **Resultado:** 403 Forbidden
5. **Audit log:** `PERMISSION_DENIED` con `resource_type=product`, `action=update`

### 9.3 Caso: ADMIN intenta eliminarse a sí mismo

**Escenario:** ADMIN A intenta `DELETE /api/users/{admin_a_id}`.

**Flujo:**

1. Request llega con JWT de ADMIN A
2. Middleware valida JWT → válido
3. RBAC verifica: ¿ADMIN tiene permiso `user:delete:any`? → SÍ
4. Validación de negocio: ¿`target_id == actor_id`? → SÍ
5. **Resultado:** 403 Forbidden (regla RN-ADMIN-01)
6. **Audit log:** `PERMISSION_DENIED` con `reason=auto_deletion_prohibited`

### 9.4 Caso: DISTRIBUTOR envía solicitud sin HMAC

**Escenario:** Request a `/api/v1/distributors/sync/stock` sin header `X-Alling-Signature`.

**Flujo:**

1. Request llega sin header de firma
2. Middleware de DISTRIBUTOR verifica: ¿Existe `X-Alling-Signature`? → NO
3. **Resultado:** 401 Unauthorized
4. **Audit log:** `PERMISSION_DENIED` con `reason=missing_hmac_signature`

---

## 10. Implementación Técnica

### 10.1 Middleware Next.js (Frontend)

// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  // Rutas públicas no requieren autenticación
  if (request.nextUrl.pathname.startsWith('/productos') || 
      request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next();
  }
  
  // Validar JWT
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  const payload = await verifyJWT(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // Verificar rol para rutas protegidas
  if (request.nextUrl.pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  if (request.nextUrl.pathname.startsWith('/vendedor') && payload.role !== 'SELLER') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  // Pasar claims al backend via headers
  const response = NextResponse.next();
  response.headers.set('X-User-ID', payload.sub);
  response.headers.set('X-User-Role', payload.role);
  
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

### 10.2 Dependency Injection FastAPI (Backend)


# dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=["RS256"]
        )
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if user_id is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado"
            )
        
        if user.is_suspended:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cuenta suspendida"
            )
        
        return user
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado o inválido"
        )

def require_permission(permission: str):
    async def permission_checker(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # Verificar RBAC
        if not user.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso denegado: {permission}"
            )
        
        # Verificar MFA para ADMIN
        if user.role == 'ADMIN' and not user.mfa_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="MFA requerido"
            )
        
        return user
    
    return permission_checker

### 10.3 Configuración RLS en PostgreSQL

-- Habilitar RLS en todas las tablas sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE formato_unico ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Configurar variables de sesión para RLS
-- Esto se hace en cada conexión desde la aplicación
SET app.current_user_id = 'uuid-del-usuario';
SET app.current_role = 'CUSTOMER';
SET app.current_guest_token = 'token-anonimo';

## 11. Control de Cambios

|Versión|Fecha|Cambio|Autor|
|---|---|---|---|
|1.0.0|30/06/2026|Versión inicial con matriz RBAC completa, políticas RLS, y reglas de autorización|Equipo Alling|

---

## 🆕 EXTENSIONES v1.2 (Actualización de Matriz RBAC)

### Permisos Nuevos por Actor

| Acción / Recurso | GUEST | CUSTOMER | SELLER | ADMIN |
|---|---|---|---|---|
| **Ver Landing Page** | ✅ | ✅ (Redirige a Dashboard) | ✅ | ✅ |
| **Carga Masiva Excel** | ✅ (Sesión) | ✅ (Persistente) | ❌ | ❌ |
| **Consulta Telegram** | ✅ | ✅ | ✅ (Responder) | ❌ |
| **Favoritos** |  | ✅ | ❌ | ❌ |
| **Ver Kits** | ✅ | ✅ | ✅ | ✅ |
| **CRUD Kits** | ❌ | ❌ | ❌ | ✅ |
| **CMS Landing** | ❌ | ❌ | ❌ | ✅ |
| **Ver Stock Real** | ❌ |  | ✅ (Total - Reservado) | ✅ |
| **Notificaciones FSM** | ❌ | ✅ | ✅ (Pedidos) | ✅ (Sistema) |

### Notas de Seguridad
- **GUEST:** Los datos de carga Excel y favoritos se pierden si no se autentica antes de 30 min (sesión).
- **SELLER:** No puede ver el precio de costo de los Kits, solo el precio público y componentes.
- **ADMIN:** El acceso al CMS de Landing requiere MFA step-up si modifica configuraciones críticas.
