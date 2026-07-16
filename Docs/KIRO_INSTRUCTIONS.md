# INSTRUCCIONES PARA KIRO — Proyecto Alling

## 🚨 REGLAS SUPREMAS (NO NEGOCIABLES)

### 1. TDD ESTRICTO — OBLIGATORIO
**NUNCA escribas código de producción sin un test que falle primero.**

Ciclo obligatorio para cada funcionalidad:
1. ESCRIBIR TEST QUE FALLA (rojo)
2. ESCRIBIR CÓDIGO MÍNIMO PARA QUE PASE (verde)
3. REFACTORIZAR (refactor)
4. REPETIR

### 2. BACKEND PRIMERO, FRONTEND DESPUÉS
**ORDEN OBLIGATORIO:**
- FASE 1: Backend completo (Python/FastAPI)
- FASE 2: Tests backend (cobertura ≥80%)
- FASE 3: Pipeline GRI ejecutado
- FASE 4: Frontend (Next.js) — SOLO SI backend funciona

**PROHIBIDO:**
- Empezar frontend antes de que backend tenga ≥80% de cobertura
- Escribir código sin test primero
- Saltar el ciclo rojo-verde-refactor
- Inventar funcionalidades no documentadas en los módulos

### 3. FUENTE DE VERDAD: LOS 10 MÓDULOS
Los archivos `MOD-*.md` en la carpeta `/specs/modules/` son la fuente de verdad.

**Para implementar cualquier funcionalidad:**
1. Lee el módulo correspondiente (ej. `MOD-FU-01.md` para Formato Único)
2. Identifica las OPS (Operaciones Funcionales)
3. Implementa cada OPS siguiendo TDD
4. Respeta las reglas de negocio (RN) documentadas
5. Usa los servicios de dominio especificados

---

## 📋 STACK TECNOLÓGICO

### Backend (FASE 1 — PRIORIDAD)
- Lenguaje: Python 3.11+
- Framework: FastAPI 0.110+
- ORM: SQLModel (NO SQLAlchemy directo)
- Validación: Pydantic V2
- Autenticación: JWT RS256 (python-jose)
- MFA: pyotp (TOTP)
- Hashing: argon2-cffi
- Testing: pytest + pytest-asyncio + pytest-cov
- Base de datos: PostgreSQL 15+ (Neon/Supabase)
- Migraciones: Alembic

### Frontend (FASE 2 — SOLO DESPUÉS DE BACKEND)
- Framework: Next.js 15 (App Router)
- Lenguaje: TypeScript 5.4+
- Estilos: Tailwind CSS + shadcn/ui
- Autenticación: NextAuth.js
- Validación: Zod + React Hook Form
- Testing: Playwright

---

## 🗂️ ESTRUCTURA DE CARPETAS OBLIGATORIA

alling-project/
├── KIRO_INSTRUCTIONS.md
├── backend/
│ ├── app/
│ │ ├── main.py
│ │ ├── core/
│ │ ├── models/
│ │ ├── schemas/
│ │ ├── services/
│ │ ├── api/v1/
│ │ └── utils/
│ ├── tests/
│ │ ├── unit/
│ │ ├── integration/
│ │ └── conftest.py
│ ├── alembic/
│ ├── requirements.txt
│ └── .env.example
├── frontend/
├── specs/
│ ├── modules/
│ ├── requirements/
│ ├── design/
│ └── qa/
└── decisions/


---

## 🎯 ORDEN DE IMPLEMENTACIÓN (DÍAS 1-4)

### DÍA 1: Setup + Autenticación (MOD-AUT-01)

**Objetivos:**
1. Crear estructura de carpetas del backend
2. Configurar pytest + pytest-cov
3. Implementar modelo User con TDD
4. Implementar endpoints de autenticación con TDD
5. Configurar base de datos PostgreSQL
6. Configurar Alembic para migraciones

**Reglas de negocio críticas:**
- RN-AUT-001: CUSTOMER solo puede autenticarse vía Google OAuth
- RN-AUT-002: SELLER/ADMIN solo pueden autenticarse con credenciales locales
- RN-SEC-001: MFA obligatorio para ADMIN

**Entregables:**
- Modelo User implementado
- Endpoints auth funcionales
- Tests unitarios pasando
- Tests de integración pasando
- Migraciones aplicadas

---

### DÍA 2: Formato Único (MOD-FU-01) — El Corazón

**Objetivos:**
1. Implementar modelos FormatoUnico, FormatoUnicoItem, FormatoUnicoTransition con TDD
2. Implementar StateMachine (FSM-01) con TDD
3. Implementar endpoints de Formato Único con TDD
4. Implementar validación de stock (RN-CHECKOUT-01)
5. Implementar fijación de precios (RN-CHECKOUT-02)

**Reglas de negocio críticas:**
- RN-GUEST-01: GUEST solo puede tener 1 FU activo en BORRADOR
- RN-CHECKOUT-01: Validar stock suficiente antes de transicionar a COTIZACIÓN/PEDIDO
- RN-CHECKOUT-02: price_at_time es inmutable tras fijación
- RN-FU-03: Cotización tiene vigencia de 15 días

**Máquina de estados (FSM-01):**
- BORRADOR → CONSULTA (FU-T-02)
- BORRADOR → COTIZACIÓN (FU-T-03)
- BORRADOR → PEDIDO (FU-T-04)
- CONSULTA → RESUELTA (FU-T-05)
- RESUELTA → COTIZACIÓN (FU-T-07)
- COTIZACIÓN → PEDIDO (FU-T-09)
- COTIZACIÓN → EXPIRADA (FU-T-10, automático)
- EXPIRADA → BORRADOR (FU-T-11)
- PEDIDO → CONFIRMADO (FU-T-12)
- PEDIDO → CANCELADO (FU-T-13)
- CANCELADO → BORRADOR (FU-T-14)

**Entregables:**
- Modelos FormatoUnico implementados
- StateMachine funcional (FSM-01)
- Endpoints funcionales
- Validación de stock implementada
- Tests pasando

---

### DÍA 3: Checkout + Pagos + Paneles

**Objetivos:**
1. Implementar modelo Order con TDD
2. Implementar webhook MercadoPago con idempotencia (RN-CHK-004)
3. Implementar endpoints Panel SELLER con TDD
4. Implementar endpoints Panel ADMIN con TDD
5. Verificar cobertura ≥80%

**Reglas de negocio críticas:**
- RN-CHK-004: Webhook MercadoPago debe ser idempotente
- RN-CHK-005: Firma HMAC del webhook debe validarse
- RN-SEL-001: Stock no puede ser negativo
- RN-ADM-001: Email único en todo el sistema
- RN-ADMIN-001: ADMIN no puede suspenderse/eliminarse a sí mismo
- RN-ADMIN-002: Mínimo 2 ADMINs activos en el sistema

**Entregables:**
- Modelo Order implementado
- Webhook MercadoPago funcional (idempotente)
- Endpoints SELLER funcionales
- Endpoints ADMIN funcionales
- Cobertura ≥80% verificada

---

### DÍA 4: Frontend (SOLO SI BACKEND FUNCIONA)

**Objetivos:**
1. Setup Next.js 15 + TypeScript + Tailwind
2. Configurar middleware de autenticación
3. Implementar página /productos (catálogo)
4. Implementar página /formato (Formato Único)
5. Implementar página /checkout
6. Implementar páginas /vendedor/stock y /admin/usuarios
7. Integración con backend

**Entregables:**
- Frontend funcional
- Integración con backend (axios)
- Demo funcional de los 5 flujos críticos

---

## 🔑 REGLAS DE NEGOCIO CRÍTICAS

Consulta `business_rules.yaml` antes de implementar cualquier lógica.

**Top 10 reglas más importantes:**
1. RN-GUEST-01: GUEST solo puede tener 1 FU activo en BORRADOR
2. RN-CHECKOUT-01: Validar stock suficiente antes de transicionar a COTIZACIÓN/PEDIDO
3. RN-CHECKOUT-02: price_at_time es inmutable tras fijación
4. RN-CHK-004: Webhook MercadoPago debe ser idempotente
5. RN-CHK-005: Firma HMAC del webhook debe validarse
6. RN-SEC-001: MFA obligatorio para ADMIN
7. RN-SEL-001: Stock no puede ser negativo
8. RN-ADM-001: Email único en todo el sistema
9. RN-ADMIN-001: ADMIN no puede suspenderse/eliminarse a sí mismo
10. RN-ADMIN-002: Mínimo 2 ADMINs activos en el sistema

---

## 🔄 MÁQUINA DE ESTADOS

### FSM-01: Formato Único
8 estados, 12 transiciones (ver detalle en DÍA 2)

### FSM-02: Order
- PENDING_PAYMENT → PAID (ORD-T-02)
- PENDING_PAYMENT → CANCELLED (ORD-T-03)
- PAID → READY_TO_SHIP (ORD-T-04, automático)
- READY_TO_SHIP → SHIPPED (ORD-T-06)

---

## 📚 CÓMO USAR LOS MÓDULOS

**Para implementar cualquier funcionalidad:**

1. Identifica el módulo:
   - Autenticación → MOD-AUT-01.md
   - Catálogo → MOD-CAT-01.md
   - Formato Único → MOD-FU-01.md
   - Checkout → MOD-CHK-01.md
   - Consultas → MOD-CON-01.md
   - Cotizaciones → MOD-COT-01.md
   - Panel SELLER → MOD-SEL-01.md
   - Panel ADMIN → MOD-ADM-01.md
   - Integración DISTRIBUTOR → MOD-DIS-01.md
   - Sistema Transversal → MOD-SYS-01.md

2. Lee el módulo:
   - Identifica las OPS (Operaciones Funcionales)
   - Identifica las RN (Reglas de Negocio)
   - Identifica los servicios de dominio
   - Identifica las pantallas (SCR) y botones (BTN)

3. Implementa con TDD:
   - Escribe test que falla
   - Implementa código mínimo
   - Refactoriza
   - Repite

---

## ✅ CHECKLIST ANTES DE COMMIT

- Todos los tests pasan
- Cobertura ≥ 80%
- No hay código de producción sin test
- Nombres de tests son descriptivos
- Tests son independientes
- Sin hardcoded secrets
- Linting pasa (ruff, mypy)

---

## 🚫 LO QUE NO DEBES HACER

- Escribir código sin test primero
- Empezar frontend antes de backend
- Inventar funcionalidades no documentadas
- Modificar el pipeline GRI
- Ignorar tests que fallan
- Hardcoded secrets en el código
- Tests que dependen de otros tests

---

## 🎯 PLAZO

**Fecha límite:** 7 de julio de 2026 (4 días)

**Prioridad:**
1. Backend funcional con tests (Días 1-3)
2. Frontend básico (Día 4)
3. Demo funcional (Día 4)
