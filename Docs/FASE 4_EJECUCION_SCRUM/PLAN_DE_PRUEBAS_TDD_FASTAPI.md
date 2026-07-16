# PLAN DE PRUEBAS TDD — Backend FastAPI (Alling v1.2)

**Documento:** `Docs/FASE 4_EJECUCION_SCRUM/PLAN_DE_PRUEBAS_TDD_FASTAPI.md` **Versión:** 1.0.0 **Rol:** QA Automation Engineer / Python Expert **Metodología:** TDD (RED-GREEN-REFACTOR) + Backend-First + Zero Trust **Stack de Pruebas:** pytest 8.x, TestClient (FastAPI), SQLModel, testcontainers (PostgreSQL 15)

---

## 1. 📂 Estructura de Directorios

La carpeta `tests/` se organiza siguiendo la arquitectura en capas de nuestro backend (Dominio → Aplicación → Infraestructura), garantizando aislamiento entre pruebas unitarias puras y pruebas de integración con BD/HTTP.
```text
backend/
├── app/
│   ├── core/            # Configuración, seguridad (JWT RS256)
│   ├── domain/          # Modelos de dominio, FSM-01/02, Servicios puros
│   ├── services/        # Lógica de negocio (FormatoUnicoService, etc.)
│   ├── api/             # Routers FastAPI, DTOs Pydantic, Dependencias
│   └── infra/           # SQLModel, Repositorios, Integraciones (MP, Telegram)
└── tests/
    ├── __init__.py
    ├── conftest.py                  # Fixtures globales (DB, Auth, Mocks)
    ├── unit/                        # Pruebas puras (Sin BD, Sin HTTP)
    │   ├── __init__.py
    │   ├── test_formato_unico_service.py
    │   ├── test_state_machine.py    # FSM-01 y FSM-02
    │   └── test_inventory_service.py
    ├── integration/                 # Pruebas de endpoints + BD real
    │   ├── __init__.py
    │   ├── test_auth_endpoints.py
    │   ├── test_formato_unico_endpoints.py
    │   └── test_checkout_endpoints.py
    └── mocks/                       # Stubs de servicios externos
        ├── __init__.py
        ├── mock_mercadopago.py      # Webhooks y Preferencias
        ── mock_telegram.py         # Deep links y respuestas
```
## 2. ⚙️ Fixtures Globales (`conftest.py`)

Dado que Alling utiliza **PostgreSQL 15+ con Row Level Security (RLS)** y **JWT RS256**, no podemos usar SQLite en memoria. Usaremos `testcontainers` para levantar un PostgreSQL 15 real y efímero, y sobrescribiremos las dependencias de FastAPI.

### 2.1. Base de Datos Transaccional (PostgreSQL 15 via Testcontainers)

```python
# tests/conftest.py (Fragmento conceptual)
import pytest
from testcontainers.postgres import PostgresContainer
from sqlmodel import SQLModel, create_engine, Session

@pytest.fixture(scope="session")
def test_db():
    # Levanta un PostgreSQL 15 real en Docker para respetar RLS y tipos nativos
    with PostgresContainer("postgres:15") as postgres:
        engine = create_engine(postgres.get_connection_url())
        SQLModel.metadata.create_all(engine)
        yield engine
        SQLModel.metadata.drop_all(engine)

@pytest.fixture(scope="function")
def db_session(test_db):
    # Patrón de rollback transaccional para aislar cada test
    connection = test_db.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
```
### 2.2. Mockeo de Autenticación JWT (Zero Trust)

Sobrescribimos la dependencia `get_current_active_user` para inyectar actores (GUEST, CUSTOMER, SELLER, ADMIN) sin generar tokens RS256 reales en cada test unitario.

```python
# tests/conftest.py
from fastapi.testclient import TestClient
from app.api.dependencies import get_current_active_user
from app.domain.user import User, Role

def override_auth_guest():
    return User(id="guest-123", role=Role.GUEST, email="guest@alling.pe")

def override_auth_customer():
    return User(id="cust-123", role=Role.CUSTOMER, email="cust@alling.pe")

@pytest.fixture
def client_guest(db_session):
    app.dependency_overrides[get_current_active_user] = override_auth_guest
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def client_customer(db_session):
    app.dependency_overrides[get_current_active_user] = override_auth_customer
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

### 2.3. Mocks de Servicios Externos

```python
@pytest.fixture
def mock_mercadopago(mocker):
    # Mockea el SDK de Mercado Pago para no hacer llamadas reales
    mock = mocker.patch("app.infra.mercadopago.MercadoPagoSDK")
    mock.create_preference.return_value = {"init_point": "https://mp.mock/pay/123"}
    return mock
```

## 3. 🧱 Mapeo TDD Unitario (Capa de Dominio / Servicios)

**Regla:** Estas pruebas NO tocan la base de datos ni el servidor HTTP. Validan la lógica pura de negocio, la FSM-01 y las reglas de negocio (RN).

### 3.1. Módulo MOD-FU-01 (Formato Único)

|RF|Nombre de la Prueba Unitaria|Aserciones Clave (RED → GREEN)|
|---|---|---|
|**RF-FU-001**|`test_crear_formato_unico_nuevo()`|Al instanciar `FormatoUnicoService.crear()`, el estado inicial es `BORRADOR` y `items` está vacío.|
|**RF-FU-002**|`test_agregar_item_con_stock_exitoso()`|Al agregar `Product(stock=10)`, el `FormatoUnicoItem` se crea con `qty=2` y el subtotal se recalcula.|
|**RF-FU-002**|`test_agregar_item_sin_stock_falla()`|Al agregar `Product(stock=0)`, el servicio lanza `DomainException("Stock insuficiente")`.|
|**RF-FU-003**|`test_editar_cantidad_mayor_a_stock_advertencia()`|Al actualizar `qty > stock`, el servicio retorna estado `WARNING` pero permite la acción (según RN-EXCEL-03).|
|**RF-FU-004**|`test_eliminar_item_recalcula_subtotal()`|Al eliminar un ítem, la lista de items se reduce y el `total_general` se actualiza correctamente.|
|**RF-FU-005**|`test_transicion_borrador_a_cotizacion_fija_precios()`|Al ejecutar `generar_cotizacion()`, el estado cambia a `COTIZACION` y se guarda `price_at_time` en cada ítem.|
|**FSM-01**|`test_fsm_transicion_invalida_cotizacion_a_borrador_falla()`|Intentar forzar `COTIZACION -> BORRADOR` lanza `InvalidStateTransitionError`.|

### 3.2. Módulo MOD-CHK-01 (Checkout e Inventario)

|RF|Nombre de la Prueba Unitaria|Aserciones Clave (RED → GREEN)|
|---|---|---|
|**RF-CHK-011**|`test_reservar_stock_decrementa_disponible()`|`InventoryService.reservar(stock=10, qty=3)` deja `available_stock=7` y `reserved_stock=3`.|
|**RF-CHK-012**|`test_liberar_reserva_restaura_stock()`|`InventoryService.liberar_reserva(qty=3)` restaura `available_stock=10` y `reserved_stock=0`.|
|**RN-MP-03**|`test_mapeo_estado_mp_approved_a_confirmado()`|`PaymentService.map_fsm_status("approved")` retorna `OrderStatus.CONFIRMADO`.|
|**RN-MP-03**|`test_mapeo_estado_mp_rejected_a_cancelado()`|`PaymentService.map_fsm_status("rejected")` retorna `OrderStatus.CANCELADO`.|

---

## 4. Mapeo TDD de Integración (Capa FastAPI)

**Regla:** Estas pruebas usan `TestClient`, interactúan con la BD de prueba (PostgreSQL 15), validan middleware (JWT/RBAC) y verifican respuestas HTTP.

### 4.1. Módulo MOD-FU-01 (Endpoints)

|RF|Nombre de la Prueba de Integración|Flujo y Aserciones (TestClient)|
|---|---|---|
|**RF-FU-001**|`test_post_formato_unico_crea_registro_bd()`|**POST** `/api/v1/formato-unico`. Aserción: HTTP 201, y `db.query(FormatoUnico).first().state == "BORRADOR"`.|
|**RF-FU-002**|`test_post_agregar_item_retorna_201_y_actualiza_bd()`|**POST** `/api/v1/formato-unico/{id}/items`. Aserción: HTTP 201, el ítem persiste en BD con el subtotal calculado.|
|**RF-FU-013**|`test_post_importar_excel_procesa_filas_validas()`|**POST** `/api/v1/formato-unico/{id}/import`. Payload: Archivo Excel mock. Aserción: HTTP 200, retorna JSON con `valid_rows=45`, `errors=1`.|
|**Zero Trust**|`test_get_formato_unico_otro_usuario_retorna_404()`|**GET** `/api/v1/formato-unico/{id_otro_user}`. Aserción: HTTP 404 (gracias a RLS y validación de ownership en el servicio).|

### 4.2. Módulo MOD-CHK-01 (Checkout y Pagos)

|RF|Nombre de la Prueba de Integración|Flujo y Aserciones (TestClient)|
|---|---|---|
|**RF-FU-009 / RF-CHK-011**|`test_post_iniciar_pago_reserva_stock_y_cambia_estado_pedido()`|**POST** `/api/v1/formato-unico/{id}/pedido`. Aserción: HTTP 200. Verifica en BD: `Order.status == "PEDIDO"`, `Product.available_stock` disminuyó, `Product.reserved_stock` aumentó.|
|**RF-CHK-010**|`test_post_checkout_genera_preferencia_mp()`|**POST** `/api/v1/checkout/pay`. Aserción: HTTP 200, response JSON contiene `mp_preference_url` (mockeado).|
|**RF-CHK-014**|`test_post_webhook_mp_approved_confirma_pedido()`|**POST** `/api/v1/webhooks/mercadopago`. Payload: JSON de MP con `status="approved"`. Aserción: HTTP 200, `Order.status` cambia a `CONFIRMADO` y se libera la reserva de stock definitivamente.|
|**RF-CHK-014**|`test_post_webhook_mp_reject_cancela_y_libera_stock()`|**POST** `/api/v1/webhooks/mercadopago`. Payload: `status="rejected"`. Aserción: HTTP 200, `Order.status` cambia a `CANCELADO` y `reserved_stock` vuelve a 0.|

### 4.3. Módulo MOD-AUT-01 (Autenticación y Migración)

|RF|Nombre de la Prueba de Integración|Flujo y Aserciones (TestClient)|
|---|---|---|
|**RF-AUT-007**|`test_post_login_fusiona_carritos_guest_y_customer()`|1. GUEST crea FU con ítem A (qty 2).  <br>2. CUSTOMER tiene FU con ítem A (qty 1).  <br>3. **POST** `/api/v1/auth/login` (simulando migración).  <br>Aserción: El FU del CUSTOMER ahora tiene ítem A con `qty=3`.|
|**Zero Trust**|`test_post_admin_kits_sin_mfa_retorna_403()`|**POST** `/api/v1/admin/kits` con usuario ADMIN pero sin header MFA. Aserción: HTTP 403 Forbidden.|

---

## 5. 🔄 Ciclo de Ejecución TDD (RED-GREEN-REFACTOR)

Para cada RF listado arriba, el desarrollador deberá seguir estrictamente este ciclo antes de hacer commit:

1. **RED:** Escribir la prueba en `tests/unit/` o `tests/integration/` basándose en el CA del `CASOS_DE_PRUEBA_TEST.md`. Ejecutar `pytest`. **Debe fallar** (AssertionError o 404/500).
2. **GREEN:** Escribir el código mínimo en `app/services/` o `app/api/` para que la prueba pase. Ejecutar `pytest`. **Debe pasar en verde**.
3. **REFACTOR:** Limpiar el código, aplicar tipado estricto (mypy), asegurar que cumple con Ruff y que no rompe las pruebas existentes (`pytest --cov=app --cov-report=term-missing`).
4. **COMMIT:** Hacer commit con el mensaje: `feat: [RF-XXX] Implementado y testeado (TDD)`.

---

## 6. 📊 Métricas de Calidad Obligatorias (Pipeline GRI)

Antes de integrar el código al repositorio principal, el QA debe verificar:

- **Cobertura de Código:** `pytest-cov` reporta **≥ 80%** en la capa de Dominio y Servicios.
- **Aislamiento:** Ninguna prueba unitaria falla si se desconecta la red o la BD.
- **Zero Trust:** Todas las pruebas de integración que acceden a datos sensibles usan el fixture de `db_session` con RLS habilitado.
- **Velocidad:** El suite completo de pruebas unitarias corre en **< 10 segundos**. Las de integración en **< 60 segundos**.

---

**Fin del documento.**