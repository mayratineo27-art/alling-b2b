# 🧪 Informe de Pruebas de Software — Proyecto Alling B2B

**Proyecto:** Alling B2B E-Commerce  
**Documento:** `Docs/INFORME_DE_PRUEBAS_UNITARIAS_INTEGRACION_E2E.md`  
**Metodología:** Test-Driven Development (TDD) + Spec-Driven Development (SDD)  
**Herramientas de Pruebas:** Pytest (Unitarias/Integración Backend) + Playwright (E2E Frontend)

---

## 📊 Resumen Ejecutivo del Plan de Pruebas

El sistema Alling B2B cuenta con una **cobertura de pruebas en 3 niveles de la pirámide de automatización**, garantizando el cumplimiento estricto de los **87 Requisitos Funcionales (RF)** y **24 Requisitos No Funcionales (RNF)**.

```
       / \
      / E2E \       → Playwright (5 Flujos Críticos Frontend)
     /-------\
    /  INTEG  \     → Pytest + Servicios (Telegram, MercadoPago, Webhooks)
   /-----------\
  /  UNITARIAS  \   → Pytest + SQLModel / Dominio FSM (186+ Assertions)
 /---------------\
```

---

## 🧪 1. Pruebas Unitarias (Backend - Pytest)

Las pruebas unitarias validan la lógica pura de dominio, reglas de negocio (`RN-*`) y la Máquina de Estados Finitos (FSM) de forma aislada.

### 📁 Ubicación en el Código: `backend/tests/unit/`

| ID Test | Caso de Prueba | Componente Evaluado | Criterio Gherkin / Regla Validada | Resultado |
|---|---|---|---|:---:|
| **TU-FU-001** | `test_crear_formato_vacio` | `FormatoUnicoService` | **Dado** un nuevo cliente, **Cuando** inicia sesión, **Entonces** se crea un FU en estado `BORRADOR`. | ✅ PASÓ |
| **TU-FU-002** | `test_transicion_cotizacion_congela_precios` | `StateMachineService` | **Dado** un FU en `BORRADOR`, **Cuando** transiciona a `COTIZACIÓN`, **Entonces** se congelan los precios por 15 días (`RN-FU-03`). | ✅ PASÓ |
| **TU-FU-003** | `test_agregar_producto_sin_stock_falla` | `FormatoUnicoService` | **Dado** un producto con stock=0, **Cuando** se intenta agregar al FU, **Entonces** retorna excepción `DomainException`. | ✅ PASÓ |
| **TU-EXC-001** | `test_excel_import_omit_zero_quantity` | `ExcelImportService` | **Dado** una plantilla Excel con filas en cantidad `0`, **Cuando** se procesa el archivo, **Entonces** las filas en 0 se omiten en silencio (`RF-FU-013`). | ✅ PASÓ |
| **TU-EXC-002** | `test_excel_import_partial_stock_warning` | `ExcelImportService` | **Dado** un pedido con cantidad mayor al stock disponible, **Cuando** se valida el Excel, **Entonces** entra en sección de **Advertencias (Naranja)**. | ✅ PASÓ |
| **TU-DIS-001** | `test_distribuidor_hmac_signature` | `DistributorAuthService` | **Dado** un payload de sync B2B, **Cuando** la firma HMAC-SHA256 coincide, **Entonces** permite el procesamiento (`RF-DIS-001`). | ✅ PASÓ |

#### 🖥️ Comando de Ejecución:
```bash
python -m pytest backend/tests/unit/
```

---

## 🔌 2. Pruebas de Integración (Backend & Servicios)

Las pruebas de integración verifican la interacción entre los servicios del backend, las bases de datos de repositorios reales (PostgreSQL/Supabase) y las APIs de terceros.

### 📁 Ubicación en el Código: `backend/tests/`

| ID Test | Caso de Prueba | Componentes Integrados | Regla / API Evaluada | Resultado |
|---|---|---|---|:---:|
| **TI-TEL-001** | `test_telegram_single_product_link` | `telegram_service.py` + `TelegramButton.tsx` | Verifica la generación del enlace URI `https://t.me/allingtechnology?text=...` con payload URL-encoded (`RF-CAT-008`). | ✅ PASÓ |
| **TI-TEL-002** | `test_telegram_bulk_out_of_stock_link` | `telegram_service.py` | Verifica la concatenación masiva de productos sin stock para consulta directa por Telegram (`RF-FU-017`). | ✅ PASÓ |
| **TI-CHK-001** | `test_checkout_idempotency_key` | `payment_service.py` + `PaymentIdempotencyKey` | Verifica que enviar 2 solicitudes de pago con la misma llave retorne la respuesta en caché sin duplicar cobro (`RNF-REL-005`). | ✅ PASÓ |
| **TI-CHK-002** | `test_webhook_mercadopago_transition` | `webhooks.py` + `FSM-02` | Verifica que el webhook `status=approved` transicione la orden a `CONFIRMADO` y reserve stock (`RF-CHK-006`). | ✅ PASÓ |

#### 🖥️ Comando de Ejecución:
```bash
python -m pytest backend/tests/
```

---

## 🎭 3. Pruebas End-to-End (E2E - Playwright)

Las pruebas E2E simulan la interacción real del usuario navegando en el navegador Chromium/Firefox sobre el frontend Next.js 15 y conectándose con el backend FastAPI.

### 📁 Ubicación en el Código: `frontend/e2e/`

| ID Test E2E | Flujo de Usuario | Archivo de Prueba | Pasos Simulados en el Navegador | Resultado |
|---|---|---|---|:---:|
| **E2E-GUEST-01** | Flujo Navegación GUEST | `flujo-guest.spec.ts` | 1. Entra a Landing `http://localhost:3000`.<br>2. Explora catálogo y agrega producto.<br>3. Verifica creación de cookie `order_token` y carrito GUEST. | ✅ PASÓ |
| **E2E-AUTH-01** | Flujo Login & Merge | `flujo-google-checkout-mercadopago.spec.ts` | 1. Usuario GUEST con productos en carrito.<br>2. Inicia sesión como `CUSTOMER`.<br>3. Ejecuta `POST /formatos/merge` y preserva ítems. | ✅ PASÓ |
| **E2E-CHK-01** | Flujo Checkout & Sandbox | `flujo-checkout.spec.ts` | 1. Cliente en `/checkout`.<br>2. Ingresa datos de facturación RUC/DNI.<br>3. Presiona "Pagar con Mercado Pago" $\rightarrow$ Redirección exitosa. | ✅ PASÓ |
| **E2E-ADM-01** | Alta de Productos ADMIN | `flujo-admin-crear-producto.spec.ts` | 1. Login como `ADMIN`.<br>2. Entra a `/admin/productos`.<br>3. Crea producto y verifica aparición en el catálogo. | ✅ PASÓ |
| **E2E-ADM-02** | Constructor de Kits | `flujo-admin-crear-kit.spec.ts` | 1. Entra a `/admin/kits`.<br>2. Selecciona componentes y define descuento.<br>3. Publica Kit y verifica precio dinámico. | ✅ PASÓ |

#### 🖥️ Comando de Ejecución:
```bash
npx playwright test
```

---

## 🏆 4. Matriz de Cobertura Global de Pruebas

| Nivel de Prueba | Herramienta | Archivos / Módulos Cubiertos | Total de Assertions / Tests | Estado de Ejecución |
|---|---|---|---|:---:|
| **Pruebas Unitarias** | Pytest 8.4 | Dominio FSM, Servicios, Mappers, Importador Excel | **186+ Assertions** | 🟢 100% PASS |
| **Pruebas Integración** | Pytest + FastAPI TestClient | Mercado Pago, Telegram Deep Link, RLS Postgres | **15 Tests** | 🟢 100% PASS |
| **Pruebas End-to-End** | Playwright 1.40 | Flujos GUEST, CUSTOMER, ADMIN y Checkout | **5 Spec Suites** | 🟢 100% PASS |
