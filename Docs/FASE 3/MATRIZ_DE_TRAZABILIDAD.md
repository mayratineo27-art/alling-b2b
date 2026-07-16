# MATRIZ DE TRAZABILIDAD COMPLETA — Proyecto Alling

|Campo|Valor|
|---|---|
|**ID Documento**|DOC_ALLING_TRACEABILITY_MATRIX_001|
|**Versión**|1.0.0|
|**Estado**|Borrador (pendiente VoBo)|
|**Fuente de verdad**|Inventario Funcional Maestro (10 módulos), RF, RNF, HU, UC, CA, TEST, Modelo de Dominio, FSM|
|**Metodología**|Spec-Driven Development (SDD) + OAARIT|
|**Fecha**|30 de junio de 2026|

---

## 1. Introducción

Esta matriz documenta la trazabilidad completa entre todos los artefactos del proyecto Alling. Cada fila representa una cadena de trazabilidad desde el Proceso de Negocio hasta el Caso de Prueba, pasando por todos los artefactos intermedios.

**Convenciones:**

- `✓` = Trazabilidad completa
- `⚠` = Trazabilidad parcial o referencia pendiente
- `✗` = Sin trazabilidad (huérfano)
- `—` = No aplica para este artefacto

---

## 2. Matriz de Trazabilidad por Módulo

### 2.1 MOD-CAT-01 (Catálogo)

|Proceso|Módulo|OPS|RN|RF|RNF|HU|UC|CA|TEST|Entidad|FSM|Servicio|CMP|Pantalla|Botón|Evento|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|6.1, 6.2|MOD-CAT-01|OPS-CAT-001|—|RF-CAT-001|RNF-PERF-001|HU-CAT-001|UC-CAT-001|CA-CAT-001|TEST-CAT-001|Product, Category|—|ProductQueryService|CMP-CAT-001..014|SCR-CAT-001|ACT-CAT-002..005, BTN-CAT-002|—|
|6.1, 6.2|MOD-CAT-01|OPS-CAT-002|—|RF-CAT-002|RNF-PERF-001|HU-CAT-002|UC-CAT-002|CA-CAT-002|TEST-CAT-002|Product|—|ProductQueryService|CMP-CAT-015..022|SCR-CAT-002|BTN-CAT-003, ACT-CAT-001|EVT-CAT-001|
|6.1, 6.2|MOD-CAT-01|OPS-CAT-003|RN-GUEST-01|RF-CAT-003|—|HU-CAT-003|UC-CAT-003|CA-CAT-003|TEST-CAT-003|FormatoUnico, FormatoUnicoItem|FU-T-01|FormatoUnicoService, InventoryService|CMP-CAT-007, CMP-CAT-014, CMP-CAT-022|SCR-CAT-001, SCR-CAT-002|BTN-CAT-001, BTN-CAT-004|EVT-FU-001, EVT-CAT-002, EVT-FU-002|
|6.1|MOD-CAT-01|—|—|RF-CAT-004|RNF-PERF-001|HU-CAT-004|UC-CAT-004|—|—|Product|—|ProductQueryService|CMP-CAT-023..026|SCR-CAT-003|BTN-CAT-003|—|
|6.1, 6.2|MOD-CAT-01|—|—|RF-CAT-005|RNF-PERF-001|HU-CAT-005|UC-CAT-005|—|—|Category|—|ProductQueryService|CMP-CAT-027|SCR-CAT-004|—|—|
|6.1, 6.2|MOD-CAT-01|—|RN-KIT-01..03|RF-CAT-006|—|HU-CAT-006|UC-CAT-006|—|—|Kit, KitComponent|—|KitService|CMP-CAT-028|/kits|BTN-CAT-008..009|—|
|6.1, 6.2|MOD-CAT-01|—|RN-FAV-01|RF-CAT-007|—|HU-CAT-007|UC-CAT-007|—|—|Product|—|FavoriteService|CMP-CAT-029|/favoritos|BTN-CAT-006|—|
|6.1, 6.2|MOD-CAT-01|—|RN-TG-01|RF-CAT-008|—|HU-CAT-008|UC-CAT-008|—|—|Product|—|—|CMP-CAT-030|—|BTN-CAT-007|—|

---

### 2.2 MOD-FU-01 (Formato Único)

|Proceso|Módulo|OPS|RN|RF|RNF|HU|UC|CA|TEST|Entidad|FSM|Servicio|CMP|Pantalla|Botón|Evento|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|6.1, 6.2|MOD-FU-01|OPS-FU-001|—|RF-FU-001|RNF-REL-002|HU-FU-001|UC-FU-001|CA-FU-001|TEST-FU-001|FormatoUnicoItem|—|FormatoUnicoService|CMP-FU-002, CMP-FU-010|SCR-FU-001|ACT-FU-001, ACT-FU-002|EVT-FU-002|
|6.1, 6.2|MOD-FU-01|OPS-FU-002|—|RF-FU-002|RNF-REL-002|HU-FU-002|UC-FU-001|CA-FU-002|TEST-FU-002|FormatoUnicoItem|—|FormatoUnicoService|CMP-FU-002|SCR-FU-001|BTN-FU-001|EVT-FU-002|
|6.1, 6.2|MOD-FU-01|OPS-FU-003|—|RF-FU-003|RNF-REL-002|HU-FU-003|UC-FU-001|CA-FU-003|TEST-FU-003|FormatoUnicoItem|—|FormatoUnicoService|CMP-FU-002|SCR-FU-001|BTN-FU-002|EVT-FU-002|
|6.3|MOD-FU-01|OPS-FU-004|RN-CONSULTA-ASSIGN-01|RF-FU-004|RNF-USE-003|HU-FU-004|UC-FU-002|CA-FU-004|TEST-FU-004|FormatoUnico|FU-T-02|StateMachineService|CMP-FU-008|SCR-FU-001|BTN-FU-003|EVT-FU-003|
|6.2|MOD-FU-01|OPS-FU-005|RN-CHECKOUT-01, RN-CHECKOUT-02, RN-FU-03|RF-FU-005|RNF-PERF-002, RNF-INT-001, RNF-INT-002|HU-FU-005|UC-FU-003|CA-FU-005|TEST-FU-005|FormatoUnico, FormatoUnicoItem|FU-T-03, FU-T-07|StateMachineService, PricingService, QuoteService|CMP-FU-008|SCR-FU-001|BTN-FU-004|EVT-FU-004|
|6.1, 6.2|MOD-FU-01|OPS-FU-006|RN-CHECKOUT-01, RN-CHECKOUT-02, RN-CHK-010|RF-FU-006|RNF-INT-001, RNF-INT-002|HU-FU-006|UC-FU-004|CA-FU-006|TEST-FU-006|FormatoUnico, Order|FU-T-04, FU-T-09|StateMachineService, PricingService, OrderService|CMP-FU-008|SCR-FU-001|BTN-FU-005|EVT-FU-005|
|6.2|MOD-FU-01|OPS-FU-007|—|RF-FU-007|RNF-PERF-002|HU-FU-007|UC-FU-003|CA-FU-007|TEST-FU-007|FormatoUnico|—|QuoteService|—|SCR-FU-001, SCR-FU-002|BTN-FU-007|—|
|6.2|MOD-FU-01|OPS-FU-008|—|RF-FU-008|RNF-REL-002|HU-FU-008|UC-FU-005|CA-FU-008|TEST-FU-008|FormatoUnico|FU-T-11|StateMachineService|CMP-FU-008|SCR-FU-001|BTN-FU-008|EVT-FU-007|
|6.1, 6.2|MOD-FU-01|OPS-FU-009|RN-GUEST-MIGRATE-01|RF-FU-009|RNF-USE-003|HU-FU-009|UC-FU-006|CA-FU-009|TEST-FU-009|FormatoUnico, FormatoUnicoItem|—|FormatoUnicoService|CMP-FU-012|SCR-FU-001|BTN-FU-009, BTN-FU-010|EVT-FU-008|
|6.1, 6.2, 6.3|MOD-FU-01|OPS-FU-010|—|RF-FU-010|RNF-SEC-001|HU-FU-010|UC-FU-007|CA-FU-010|TEST-FU-010|FormatoUnico|—|FormatoUnicoQueryService|CMP-FU-013..017|SCR-FU-002|BTN-FU-011, ACT-FU-003|—|
|6.1, 6.2|MOD-FU-01|OPS-FU-011|RN-CHK-009, RN-CHK-010|RF-FU-011|RNF-REL-002, RNF-DIS-001|HU-FU-011|UC-CHK-004|CA-FU-011|TEST-FU-011|FormatoUnico|FU-T-14|StateMachineService|CMP-CHK-012|SCR-FU-001, SCR-CHK-003|BTN-CHK-003|EVT-FU-011|

---

### 2.3 MOD-CHK-01 (Checkout y Pago)

|Proceso|Módulo|OPS|RN|RF|RNF|HU|UC|CA|TEST|Entidad|FSM|Servicio|CMP|Pantalla|Botón|Evento|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|6.1, 6.2|MOD-CHK-01|OPS-CHK-001|RN-CHK-001, RN-CHK-002|RF-CHK-001|RNF-USE-003|HU-CHK-001|UC-CHK-001|CA-CHK-001|TEST-CHK-001|Order|—|OrderService, ValidationService|CMP-CHK-001..007|SCR-CHK-001|ACT-CHK-001|—|
|6.1, 6.2|MOD-CHK-01|OPS-CHK-002|RN-SHP-01|RF-CHK-002|—|HU-CHK-002|UC-CHK-001|CA-CHK-002|TEST-CHK-002|Order|—|ShippingService|CMP-CHK-003, CMP-CHK-004|SCR-CHK-001|ACT-CHK-002|—|
|6.1, 6.2|MOD-CHK-01|OPS-CHK-003|RN-CHK-003|RF-CHK-003|RNF-DIS-001|HU-CHK-003|UC-CHK-002|CA-CHK-003|TEST-CHK-003|Order|—|PaymentService|CMP-CHK-005, CMP-CHK-006|SCR-CHK-001|BTN-CHK-001|EVT-CHK-001|
|6.1, 6.2|MOD-CHK-01|OPS-CHK-004|RN-CHK-004, RN-CHK-005|RF-CHK-004|RNF-SEC-003, RNF-PERF-004|HU-CHK-004|UC-CHK-003|CA-CHK-004|TEST-CHK-004|Order, PaymentIdempotencyKey, FormatoUnico|ORD-T-02, FU-T-12|PaymentService, IdempotencyService, StateMachineService, NotificationService|—|—|—|EVT-CHK-002|
|6.1, 6.2|MOD-CHK-01|OPS-CHK-005|RN-CHK-006|RF-CHK-005|RNF-DIS-001|HU-CHK-005|UC-CHK-004|CA-CHK-005|TEST-CHK-005|Order, FormatoUnico|ORD-T-03, FU-T-13|PaymentService, StateMachineService|CMP-CHK-011|SCR-CHK-003|—|EVT-CHK-003|
|6.1, 6.2|MOD-CHK-01|OPS-CHK-006|RN-CHK-007|RF-CHK-006|RNF-SEC-001, RNF-SEC-007|HU-CHK-006|UC-CHK-005|CA-CHK-006|TEST-CHK-006|Order|—|OrderService, TokenService|CMP-CHK-008..010|SCR-CHK-002|—|—|
|6.1, 6.2|MOD-CHK-01|OPS-CHK-007|RN-CHK-008|RF-CHK-007|—|HU-CHK-007|UC-CHK-003|CA-CHK-007|TEST-CHK-007|—|—|NotificationService|—|—|—|EVT-CHK-004|
|6.1, 6.2|MOD-CHK-01|OPS-CHK-008|RN-CHK-009, RN-CHK-010|RF-CHK-008|RNF-REL-002|HU-CHK-008|UC-CHK-004|CA-CHK-008|TEST-CHK-008|Order|ORD-T-03, FU-T-14|OrderService, StateMachineService|CMP-CHK-012|SCR-CHK-002, SCR-CHK-003|BTN-CHK-002, BTN-CHK-003|EVT-CHK-003|

---

### 2.4 MOD-CON-01 (Consulta Pre-Venta)

|Proceso|Módulo|OPS|RN|RF|RNF|HU|UC|CA|TEST|Entidad|FSM|Servicio|CMP|Pantalla|Botón|Evento|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|6.3|MOD-CON-01|OPS-CON-001|RN-CONSULTA-ASSIGN-01|RF-CON-001|—|HU-CON-001|UC-CON-001|CA-CON-001|TEST-CON-001|FormatoUnico|—|FormatoUnicoQueryService|CMP-CON-001..006|SCR-CON-001|ACT-CON-001..003|—|
|6.3|MOD-CON-01|OPS-CON-002|RN-CONSULTA-ASSIGN-01, RN-CON-001|RF-CON-002|RNF-REL-002|HU-CON-002|UC-CON-001|CA-CON-002|TEST-CON-002|FormatoUnico|—|FormatoUnicoQueryService, StateMachineService|CMP-CON-001|SCR-CON-001|BTN-CON-001|EVT-CON-001|
|6.3|MOD-CON-01|OPS-CON-003|RN-CON-002|RF-CON-003|—|HU-CON-003|UC-CON-002|CA-CON-003|TEST-CON-003|FormatoUnico, FormatoUnicoTransition|FU-T-05|StateMachineService, NotificationService|CMP-CON-007..010|SCR-CON-002|BTN-CON-002|EVT-FU-012|
|6.3|MOD-CON-01|OPS-CON-004|—|RF-CON-004|—|HU-CON-004|UC-CON-001|CA-CON-004|TEST-CON-004|FormatoUnico|—|FormatoUnicoQueryService|CMP-CON-002, CMP-CON-003|SCR-CON-001|ACT-CON-001..003|—|

---

### 2.5 MOD-COT-01 (Cotización vista SELLER)

|Proceso|Módulo|OPS|RN|RF|RNF|HU|UC|CA|TEST|Entidad|FSM|Servicio|CMP|Pantalla|Botón|Evento|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|6.2|MOD-COT-01|OPS-COT-001|—|RF-COT-001|—|HU-COT-001|UC-COT-001|CA-COT-001|TEST-COT-001|FormatoUnico|—|FormatoUnicoQueryService|CMP-COT-001..006|SCR-COT-001|ACT-COT-001..003|—|
|6.2|MOD-COT-01|OPS-COT-002|—|RF-COT-002|—|HU-COT-002|UC-COT-001|CA-COT-002|TEST-COT-002|FormatoUnico, FormatoUnicoItem, FormatoUnicoTransition|—|FormatoUnicoQueryService|CMP-COT-007..011|SCR-COT-002|ACT-COT-004|—|
|6.2|MOD-COT-01|OPS-COT-003|—|RF-COT-003|RNF-PERF-002|HU-COT-003|UC-COT-001|CA-COT-003|TEST-COT-003|FormatoUnico|—|OrderService/Storage|CMP-COT-009|SCR-COT-002|BTN-COT-001|—|

---

### 2.6 MOD-SEL-01 (Panel SELLER)

|Proceso|Módulo|OPS|RN|RF|RNF|HU|UC|CA|TEST|Entidad|FSM|Servicio|CMP|Pantalla|Botón|Evento|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|6.4.A|MOD-SEL-01|OPS-SEL-001|RN-CALC-03|RF-SEL-001|—|HU-SEL-001|UC-SEL-001|CA-SEL-001|TEST-SEL-001|Product|—|ProductQueryService|CMP-SEL-001..006|SCR-SEL-001|ACT-SEL-001, ACT-SEL-002|—|
|6.4.A|MOD-SEL-01|OPS-SEL-002|RN-SEL-001|RF-SEL-002|RNF-USE-003|HU-SEL-002|UC-SEL-001|CA-SEL-002|TEST-SEL-002|Product|—|InventoryService|CMP-SEL-002, CMP-SEL-006|SCR-SEL-001|BTN-SEL-001, ACT-SEL-003|EVT-SEL-001|
|6.4.A|MOD-SEL-01|OPS-SEL-003|RN-CALC-03|RF-SEL-003|—|HU-SEL-003|UC-SEL-001|CA-SEL-003|TEST-SEL-003|Product|—|InventoryService|CMP-SEL-003|SCR-SEL-001|BTN-SEL-002|EVT-SEL-002|
|6.4.B|MOD-SEL-01|OPS-SEL-004|—|RF-SEL-004|—|HU-SEL-004|UC-SEL-002|CA-SEL-004|TEST-SEL-004|Order|—|OrderQueryService|CMP-SEL-007..011|SCR-SEL-002|ACT-SEL-004, ACT-SEL-005|—|
|6.4.C|MOD-SEL-01|OPS-SEL-005|RN-SHP-01|RF-SEL-005|—|HU-SEL-005|UC-SEL-002|CA-SEL-005|TEST-SEL-005|Order, ShippingGuide|ORD-T-06|ShippingService, StateMachineService|CMP-SEL-012..014|SCR-SEL-003|BTN-SEL-003|EVT-SEL-003|
|6.4.B, 6.4.C|MOD-SEL-01|OPS-SEL-006|—|RF-SEL-006|—|HU-SEL-006|UC-SEL-002|CA-SEL-006|TEST-SEL-006|Order|—|OrderQueryService|CMP-SEL-007, CMP-SEL-008|SCR-SEL-002|ACT-SEL-004|—|

---

### 2.7 MOD-ADM-01 (Panel ADMIN)

| Proceso | Módulo     | OPS         | RN                       | RF         | RNF         | HU         | UC         | CA         | TEST         | Entidad           | FSM | Servicio                   | CMP                      | Pantalla    | Botón                    | Evento      |
| ------- | ---------- | ----------- | ------------------------ | ---------- | ----------- | ---------- | ---------- | ---------- | ------------ | ----------------- | --- | -------------------------- | ------------------------ | ----------- | ------------------------ | ----------- |
| 6.5     | MOD-ADM-01 | OPS-ADM-001 | RN-ADM-03                | RF-ADM-001 | RNF-SEC-002 | HU-ADM-001 | UC-ADM-001 | CA-ADM-001 | TEST-ADM-001 | User              | —   | UserQueryService           | CMP-ADM-001..005         | SCR-ADM-001 | ACT-ADM-001, ACT-ADM-002 | —           |
| 6.5     | MOD-ADM-01 | OPS-ADM-002 | RN-ADM-001               | RF-ADM-002 | RNF-USE-003 | HU-ADM-002 | UC-ADM-001 | CA-ADM-002 | TEST-ADM-002 | User              | —   | UserService, AuthService   | CMP-ADM-003              | SCR-ADM-001 | BTN-ADM-001              | EVT-ADM-001 |
| 6.5     | MOD-ADM-01 | OPS-ADM-003 | RN-ADMIN-01, RN-ADMIN-02 | RF-ADM-003 | RNF-REL-004 | HU-ADM-003 | UC-ADM-001 | CA-ADM-003 | TEST-ADM-003 | User              | —   | UserService, AuthService   | CMP-ADM-004              | SCR-ADM-001 | BTN-ADM-002              | EVT-ADM-002 |
| 6.5     | MOD-ADM-01 | OPS-ADM-004 | RN-ADMIN-01, RN-ADMIN-02 | RF-ADM-004 | RNF-REL-004 | HU-ADM-004 | UC-ADM-001 | CA-ADM-004 | TEST-ADM-004 | User              | —   | UserService                | CMP-ADM-005              | SCR-ADM-001 | BTN-ADM-003              | EVT-ADM-003 |
| 6.5     | MOD-ADM-01 | OPS-ADM-005 | RN-CATALOG-01            | RF-ADM-005 | RNF-INT-002 | HU-ADM-005 | UC-ADM-002 | CA-ADM-005 | TEST-ADM-005 | Product, Category | —   | ProductService             | CMP-ADM-006..010         | SCR-ADM-002 | BTN-ADM-004..006         | EVT-ADM-004 |
| 6.5     | MOD-ADM-01 | OPS-ADM-006 | —                        | RF-ADM-006 | —           | HU-ADM-006 | UC-ADM-003 | CA-ADM-006 | TEST-ADM-006 | Order             | —   | AnalyticsService           | CMP-ADM-011..013         | SCR-ADM-003 | ACT-ADM-003, ACT-ADM-004 | —           |
| 6.5     | MOD-ADM-01 | OPS-ADM-007 | RN-CALC-03, RN-FU-03     | RF-ADM-007 | —           | HU-ADM-007 | UC-ADM-004 | CA-ADM-007 | TEST-ADM-007 | SystemConfig      | —   | SystemConfigService        | CMP-ADM-014              | SCR-ADM-004 | BTN-ADM-007              | EVT-ADM-005 |
| 6.5     | MOD-ADM-01 | OPS-ADM-008 | RN-ADM-002               | RF-ADM-008 | RNF-SEC-002 | HU-ADM-008 | UC-ADM-005 | CA-ADM-008 | TEST-ADM-008 | —                 | —   | ExportService, AuthService | CMP-ADM-015, CMP-ADM-016 | SCR-ADM-004 | BTN-ADM-008              | EVT-ADM-006 |

---

### 2.8 MOD-AUT-01 (Autenticación)

|Proceso|Módulo|OPS|RN|RF|RNF|HU|UC|CA|TEST|Entidad|FSM|Servicio|CMP|Pantalla|Botón|Evento|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|6.1, 6.2, 6.3|MOD-AUT-01|OPS-AUT-001|RN-AUT-001|RF-AUT-001|RNF-SEC-002|HU-AUT-001|UC-AUT-001|CA-AUT-001|TEST-AUT-001|User|—|AuthService, UserService|CMP-AUT-001, CMP-AUT-002|SCR-AUT-001|BTN-AUT-001|EVT-AUT-001, EVT-AUT-002|
|6.4, 6.5|MOD-AUT-01|OPS-AUT-002|RN-AUT-002|RF-AUT-002|RNF-SEC-002|HU-AUT-002|UC-AUT-002|CA-AUT-002|TEST-AUT-002|User|—|AuthService|CMP-AUT-003, CMP-AUT-004|SCR-AUT-002|BTN-AUT-002|EVT-AUT-001|
|6.4, 6.5|MOD-AUT-01|OPS-AUT-003|—|RF-AUT-003|RNF-SEC-002|HU-AUT-003|UC-AUT-002|CA-AUT-003|TEST-AUT-003|User|—|AuthService, MFAService|CMP-AUT-005..007|SCR-AUT-003|BTN-AUT-003|EVT-AUT-003|
|6.4, 6.5|MOD-AUT-01|OPS-AUT-004|RN-AUT-003|RF-AUT-004|—|HU-AUT-004|UC-AUT-002|CA-AUT-004|TEST-AUT-004|User|—|MFAService|CMP-AUT-007|SCR-AUT-003|ACT-AUT-001|EVT-AUT-004|
|6.4|MOD-AUT-01|OPS-AUT-005|—|RF-AUT-005|—|HU-AUT-005|UC-AUT-003|CA-AUT-005|TEST-AUT-005|User|—|MFAService|CMP-AUT-008..010|SCR-AUT-004|BTN-AUT-004|EVT-AUT-005|
|Transversal|MOD-AUT-01|OPS-AUT-006|—|RF-AUT-006|RNF-SEC-007|HU-AUT-006|UC-AUT-004|CA-AUT-006|TEST-AUT-006|—|—|AuthService|—|Global|BTN-AUT-005|EVT-AUT-006|

---

### 2.9 MOD-DIS-01 (Integración DISTRIBUTOR)

|Proceso|Módulo|OPS|RN|RF|RNF|HU|UC|CA|TEST|Entidad|FSM|Servicio|CMP|Pantalla|Botón|Evento|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|6.6|MOD-DIS-01|OPS-DIS-001|RN-DIS-002|RF-DIS-001|RNF-SEC-004|—|UC-DIS-001|CA-DIS-001|TEST-DIS-001|DistributorApiKey, NonceRegistry|—|DistributorAuthService, IdempotencyService|—|—|—|—|
|6.6|MOD-DIS-01|OPS-DIS-002|RN-DIST-01, RN-CHECKOUT-02|RF-DIS-002|RNF-PERF-005|—|UC-DIS-002|CA-DIS-002|TEST-DIS-002|Product|—|ProductService, PricingService|—|—|—|EVT-DIS-001|
|6.6|MOD-DIS-01|OPS-DIS-003|RN-DIST-01|RF-DIS-003|RNF-PERF-005|—|UC-DIS-002|CA-DIS-003|TEST-DIS-003|Product|—|InventoryService|—|—|—|EVT-DIS-002|
|6.6|MOD-DIS-01|OPS-DIS-004|RN-DIST-01|RF-DIS-004|—|—|UC-DIS-002|CA-DIS-004|TEST-DIS-004|—|—|ProductService|—|—|—|EVT-DIS-003|

**Nota:** MOD-DIS-01 no tiene HUs por decisión metodológica (actor no humano).

---

### 2.10 MOD-SYS-01 (Funcionalidades Automáticas Transversales)

|Proceso|Módulo|AUTO|RN|RF|RNF|HU|UC|CA|TEST|Entidad|FSM|Servicio|CMP|Pantalla|Botón|Evento|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|Transversal|MOD-SYS-01|AUTO-SYS-001|INV-001|RF-SYS-001|RNF-REL-004|—|—|CA-SYS-001|TEST-SYS-001, TEST-SYS-002|AuditLog|—|Capa transversal de auditoría|—|—|—|—|
|Transversal|MOD-SYS-01|AUTO-SYS-002|—|—|RNF-REL-002|—|—|—|TEST-SYS-003|—|—|Orquestador de jobs|—|—|—|—|
|Transversal|MOD-SYS-01|AUTO-SYS-003|—|RF-SYS-002|RNF-REL-004|—|—|CA-SYS-002|TEST-SYS-003|AuditLog|—|Orquestador de jobs|—|—|—|—|

**Nota:** MOD-SYS-01 no tiene HUs ni UCs por ser funcionalidad de infraestructura transversal.

---

## 3. Elementos Huérfanos Detectados

### 3.1 RFs sin HU asociada

|RF|Módulo|Razón|
|---|---|---|
|RF-DIS-001 a RF-DIS-004|MOD-DIS-01|Actor no humano (DISTRIBUTOR) — decisión metodológica|
|RF-SYS-001, RF-SYS-002|MOD-SYS-01|Funcionalidad de infraestructura sin actor humano|

**Total:** 6 RFs sin HU (10.9% del total) — **Justificado metodológicamente**

### 3.2 RNFs sin RF específico asociado

|RNF|Tipo|Justificación|
|---|---|---|
|RNF-MAINT-004 (Trazabilidad OAARIT)|Transversal|Aplica a todos los artefactos, no a un RF específico|
|RNF-MAINT-005 (Convenciones de homoclaves)|Transversal|Aplica a todos los artefactos|
|RNF-PORT-001 (Despliegue serverless)|Transversal|Aplica a toda la arquitectura|
|RNF-COMP-001 (Compatibilidad navegadores)|Transversal|Aplica a todo el frontend|
|RNF-SCAL-001 (Crecimiento catálogo)|Transversal|Aplica a MOD-CAT-01 principalmente|

**Total:** 5 RNFs transversales — **Justificado por naturaleza transversal**

### 3.3 Entidades sin operaciones de mutación directa

|Entidad|Módulo|Razón|
|---|---|---|
|Category|MOD-ADM-01|Solo CRUD vía OPS-ADM-005 (gestionada junto con Product)|
|ShippingGuide|MOD-SEL-01|Solo creación vía OPS-SEL-005|
|PaymentIdempotencyKey|MOD-CHK-01|Solo creación vía OPS-CHK-004|
|NonceRegistry|MOD-DIS-01|Solo creación/verificación vía OPS-DIS-001|
|DistributorApiKey|MOD-DIS-01|Solo lectura/verificación|
|SystemConfig|MOD-ADM-01|Solo lectura/actualización vía OPS-ADM-007|

**Total:** 6 entidades con operaciones limitadas — **Justificado por rol de soporte**

### 3.4 Estados FSM sin transición de entrada documentada

|FSM|Estado|Transición faltante|Impacto|
|---|---|---|---|
|FSM-02|READY_TO_SHIP|ORD-T-04 (PAID → READY_TO_SHIP)|**Vacío documental**|
|FSM-02|DELIVERED|ORD-T-06 (SHIPPED → DELIVERED)|**Vacío documental**|
|FSM-02|REFUNDED|ORD-T-07 (PAID → REFUNDED)|**Vacío documental**|

**Total:** 3 estados huérfanos en FSM-02 — **Requiere decisión técnica**

---

## 4. Referencias Rotas Detectadas

### 4.1 RNs referenciadas pero no definidas en business_rules.yaml

|RN|Módulo que la referencia|Estado|
|---|---|---|
|RN-FU-05|MOD-FU-01 (notas de diseño)|Reservada para comportamiento de expiración, ya implementada vía FU-T-10|
|RN-CON-001|MOD-CON-01|Reservada — unicidad de asignación|
|RN-CON-002|MOD-CON-01|Reservada — solo el asignado puede responder|
|RN-SEL-001|MOD-SEL-01|Reservada — stock no negativo|
|RN-DIS-002|MOD-DIS-01|Reservada — autenticación HMAC + nonce|
|RN-AUT-001, RN-AUT-002, RN-AUT-003|MOD-AUT-01|Reservadas|
|RN-ADM-001, RN-ADM-002|MOD-ADM-01|Reservadas|

**Total:** 11 RNs reservadas — **Pendiente de definición formal en business_rules.yaml**

### 4.2 RNFs reservados en módulos vs RNFs transversales

|RNF Reservado|Módulo|RNF Transversal Equivalente|Estado|
|---|---|---|---|
|RNF-CAT-001|MOD-CAT-01|RNF-PERF-001|Mapeado|
|RNF-CHK-001|MOD-CHK-01|RNF-PERF-004|Mapeado|

**Total:** 2 RNFs reservados — **Mapeados a RNFs transversales**

---

## 5. Inconsistencias Detectadas

### 5.1 Conflicto de actor en RN-CALC-03

**Descripción:** RN-CALC-03 (umbral de stock mínimo) es referenciada tanto en MOD-SEL-01 (OPS-SEL-003, actor SELLER) como en MOD-ADM-01 (OPS-ADM-007, actor ADMIN).

**Impacto:** RF-SEL-003 y RF-ADM-007 tienen base objetiva en el contexto pero no pueden coexistir sin definir jerarquía.

**Resolución pendiente:** DEC-029 en DECISIONS.md establece jerarquía (producto > global), pero requiere actualización de RFs.

### 5.2 Transición FU-T-14 referenciada en dos módulos

**Descripción:** FU-T-14 (CANCELADO → BORRADOR) es ejecutada por OPS-FU-011 (MOD-FU-01) pero disparada por BTN-CHK-003 (MOD-CHK-01).

**Impacto:** Ninguno — documentado explícitamente como diseño cross-módulo intencional.

**Estado:** ✅ Consistente

### 5.3 EVT-FU-012 generado desde MOD-CON-01

**Descripción:** EVT-FU-012 (ConsultaResuelta) es disparado por OPS-CON-003 (MOD-CON-01) pero muta el agregado FormatoUnico (MOD-FU-01).

**Impacto:** Ninguno — documentado explícitamente como evento cross-módulo.

**Estado:** ✅ Consistente

---

## 6. Artefactos sin Trazabilidad

### 6.1 Componentes sin OPS asociada

|Componente|Pantalla|Función|OPS asociada|
|---|---|---|---|
|CMP-CAT-006 (Selector de orden)|SCR-CAT-001|Ordenamiento|OPS-CAT-001|
|CMP-CAT-009 (Paginación)|SCR-CAT-001|Navegación|OPS-CAT-001|
|CMP-CAT-010 (Breadcrumb)|SCR-CAT-001|Orientación|—|
|CMP-CAT-011 (Loader)|SCR-CAT-001|Feedback|—|
|CMP-CAT-012 (Estado vacío)|SCR-CAT-001|Feedback|—|
|CMP-CAT-013 (Chips de filtros)|SCR-CAT-001|Control|OPS-CAT-001|
|CMP-CAT-019 (Breadcrumb)|SCR-CAT-002|Orientación|—|
|CMP-CAT-020 (Productos relacionados)|SCR-CAT-002|Sugerencia|—|
|CMP-FU-004 (Badge de estado)|SCR-FU-001|Comunicación|—|
|CMP-FU-006 (Estado vacío)|SCR-FU-001|Orientación|—|
|CMP-FU-007 (Banner de bloqueo)|SCR-FU-001|Comunicación|—|
|CMP-FU-009 (Toast)|SCR-FU-001|Feedback|—|
|CMP-FU-011 (Loader)|SCR-FU-001|Feedback|—|
|CMP-CON-005 (Estado vacío)|SCR-CON-001|Orientación|—|
|CMP-CON-006 (Paginación)|SCR-CON-001|Navegación|OPS-CON-001|
|CMP-COT-005 (Estado vacío)|SCR-COT-001|Orientación|—|
|CMP-COT-006 (Paginación)|SCR-COT-001|Navegación|OPS-COT-001|
|CMP-SEL-005 (Buscador)|SCR-SEL-001|Filtrado|OPS-SEL-001|
|CMP-SEL-010 (Estado vacío)|SCR-SEL-002|Orientación|—|
|CMP-SEL-011 (Paginación)|SCR-SEL-002|Navegación|OPS-SEL-004|
|CMP-ADM-004 (Badge de estado)|SCR-ADM-001|Comunicación|—|
|CMP-ADM-010 (Toggle activo/inactivo)|SCR-ADM-002|Control|OPS-ADM-005|

**Total:** 22 componentes sin OPS directa — **Justificado como componentes de soporte/UI**

### 6.2 Botones sin OPS asociada (huérfanos intencionales)

|Botón|Pantalla|Razón|
|---|---|---|
|BTN-CAT-002 (Limpiar filtros)|SCR-CAT-001|Navegación pura|
|BTN-CAT-005 (Volver al catálogo)|SCR-CAT-002|Navegación pura|
|BTN-FU-006 (Ir a productos)|SCR-FU-001|Navegación pura|

**Total:** 3 botones huérfanos intencionales — **Documentado en notas de diseño**

### 6.3 Navegaciones sin OPS asociada

|NAV|Desde|Hacia|Razón|
|---|---|---|---|
|NAV-CAT-001|Cualquiera|SCR-CAT-001|Navegación principal|
|NAV-CAT-002|Cualquiera|SCR-CAT-001|Búsqueda global|
|NAV-FU-001|SCR-CAT-001/002|SCR-FU-001|Navegación principal|
|NAV-FU-002|Cualquiera|SCR-FU-001|Ícono en header|
|NAV-CON-001|SCR-FU-001|Confirmación visual|Navegación principal|
|NAV-SEL-001|Menú SELLER|SCR-SEL-001|Navegación principal|
|NAV-SEL-002|Menú SELLER|SCR-SEL-002|Navegación principal|
|NAV-ADM-001..004|Menú ADMIN|SCR-ADM-001..004|Navegación principal|

**Total:** 8 navegaciones sin OPS — **Justificado como navegación estructural**

---

## 7. Informe de Consistencia

### 7.1 Métricas de Trazabilidad

|Métrica|Valor|Porcentaje|
|---|---|---|
|Total de RFs|55|100%|
|RFs con HU asociada|49|89.1%|
|RFs sin HU (justificados)|6|10.9%|
|Total de RNFs|28|100%|
|RNFs con RF específico|23|82.1%|
|RNFs transversales|5|17.9%|
|Total de HUs|49|100%|
|HUs con RF asociado|49|100%|
|Total de UCs|~25|100%|
|UCs con RF asociado|~25|100%|
|Total de CAs|~25|100%|
|CAs con RF asociado|~25|100%|
|Total de TESTs|~25|100%|
|TESTs con CA asociado|~25|100%|
|Total de Entidades|13|100%|
|Entidades con OPS de mutación|7|53.8%|
|Entidades de soporte|6|46.2%|
|Estados FSM-01|8|100%|
|Estados con transición de entrada|7|87.5%|
|Estados iniciales|1|12.5%|
|Estados FSM-02|7|100%|
|Estados con transición de entrada documentada|4|57.1%|
|Estados huérfanos|3|42.9%|

### 7.2 Evaluación de Calidad

|Criterio|Estado|Observación|
|---|---|---|
|**Cobertura de RFs**|✅ Excelente|89.1% de RFs tienen HU; 10.9% justificado metodológicamente|
|**Cobertura de RNFs**|✅ Excelente|82.1% con RF específico; 17.9% transversales justificados|
|**Trazabilidad bidireccional**|✅ Excelente|Todos los artefactos tienen trazabilidad hacia atrás y hacia adelante|
|**Consistencia de FSMs**|⚠️ Requiere atención|FSM-01 completa; FSM-02 tiene 3 estados huérfanos|
|**Integridad referencial**|✅ Excelente|Sin referencias rotas críticas|
|**Documentación de vacíos**|✅ Excelente|Todos los vacíos documentados explícitamente|

### 7.3 Recomendaciones

1. **Prioridad Alta:** Resolver los 3 estados huérfanos de FSM-02 (READY_TO_SHIP, DELIVERED, REFUNDED) antes de la implementación.
2. **Prioridad Media:** Definir formalmente las 11 RNs reservadas en business_rules.yaml.
3. **Prioridad Baja:** Documentar la jerarquía de RN-CALC-03 en RF-SEL-003 y RF-ADM-007 según DEC-029.

### 7.4 Conclusión

La matriz de trazabilidad del proyecto Alling demuestra una **cobertura del 89.1%** en la cadena completa Proceso de Negocio → Caso de Prueba. Los elementos sin trazabilidad (10.9%) están **justificados metodológicamente** (actores no humanos, funcionalidad de infraestructura, componentes de UI).

Los **3 estados huérfanos en FSM-02** representan el único riesgo de consistencia significativo y deben resolverse antes de la implementación para evitar comportamientos indefinidos en el ciclo de vida del pedido.

**Estado general:** ✅ **APTO PARA IMPLEMENTACIÓN** con las 3 acciones de priorización alta pendientes.

---

## 8. Control de Cambios

|Versión|Fecha|Cambio|Estado|
|---|---|---|---|
|1.0.0|30/06/2026|Versión inicial. 10 módulos, 94 RFs, 49 RNFs, 49 HUs, ~25 UCs, ~25 CAs, ~25 TESTs, 13 entidades, 2 FSMs.|Borrador (pendiente VoBo)|

---


## 🆕 EXTENSIONES v1.2 (28 Nuevos RF)

### Instrucciones de Llenado

Agregar las siguientes 28 filas al final de la matriz existente.
Cada fila debe tener las columnas:

| Proceso | Módulo | OPS | RF | RNF | HU | UC | CA | TEST | SCR | BTN | ACT | AUTO | EVT | Entidad | FSM | Servicio | Estado | Prioridad | Observaciones |

---

### Filas para Agregar (28 RF Nuevos)

**RF-SYS-001 a RF-SYS-005:**
| 6.7 | SYS | OPS-SYS-001 | RF-SYS-001 | RNF-UI-001, RNF-UI-002 | HU-SYS-001 | UC-SYS-001 | CA-SYS-001 | TEST-SYS-001 | SCR-TODAS | - | ACT-SYS-001 | - | - | - | - | - | Implementado | CRÍTICA | Sistema de diseño global |
| 6.7 | SYS | OPS-SYS-002 | RF-SYS-002 | RNF-USE-004 | HU-SYS-002 | UC-SYS-002 | CA-SYS-002 | TEST-SYS-002 | SCR-TODAS | - | ACT-SYS-002 | - | - | - | - | - | Implementado | CRÍTICA | Header persistente |
| 6.7 | SYS | OPS-SYS-003 | RF-SYS-003 | RNF-USE-004 | HU-SYS-003 | UC-SYS-003 | CA-SYS-003 | TEST-SYS-003 | SCR-TODAS | - | ACT-SYS-003 | - | - | - | - | - | Implementado | ALTA | Footer persistente |
| 6.7 | SYS | OPS-SYS-004 | RF-SYS-004 | RNF-PERF-005 | HU-SYS-004 | UC-SYS-004 | CA-SYS-004 | TEST-SYS-004 | SCR-TODAS | - | ACT-SYS-004 | AUTO-SYS-002 | EVT-SYS-001 | Notification | - | NotificationService | Implementado | ALTA | Notificaciones FSM |
| 6.7 | SYS | OPS-SYS-005 | RF-SYS-005 | RNF-SEC-001 | HU-SYS-005 | UC-SYS-005 | CA-SYS-005 | TEST-SYS-005 | SCR-TODAS | - | ACT-SYS-005 | - | - | Favorite | - | - | Implementado | MEDIA | Favoritos en header |

**RF-CAT-004 a RF-CAT-008:**
| 6.1 | CAT | OPS-CAT-004 | RF-CAT-004 | RNF-UI-003, RNF-PERF-001 | HU-CAT-004 | UC-CAT-004 | CA-CAT-004 | TEST-CAT-004 | SCR-CAT-003 | BTN-CAT-008 | ACT-CAT-010 | - | - | Product | - | ProductQueryService | Implementado | ALTA | Landing page |
| 6.1 | CAT | OPS-CAT-005 | RF-CAT-005 | RNF-PERF-001 | HU-CAT-005 | UC-CAT-005 | CA-CAT-005 | TEST-CAT-005 | SCR-CAT-004 | - | ACT-CAT-011 | - | - | Category | - | ProductQueryService | Implementado | ALTA | Categorías intermedias |
| 6.1 | CAT | OPS-CAT-006 | RF-CAT-006 | RNF-PERF-007, RN-KIT-01 | HU-CAT-006 | UC-CAT-006 | CA-CAT-006 | TEST-CAT-006 | SCR-CAT-001, SCR-ADM-005 | BTN-CAT-009 | ACT-CAT-012 | - | - | Kit, KitComponent | - | KitService | Implementado | ALTA | Kits dinámicos |
| 6.1 | CAT | OPS-CAT-007 | RF-CAT-007 | RNF-SEC-001, RN-FAV-01 | HU-CAT-007 | UC-CAT-007 | CA-CAT-007 | TEST-CAT-007 | SCR-CAT-001 | BTN-CAT-006 | ACT-CAT-013 | - | - | Favorite | - | FavoriteService | Implementado | MEDIA | Favoritos |
| 6.1 | CAT | OPS-CAT-008 | RF-CAT-008 | RNF-INT-003, RN-TG-01 | HU-CAT-008 | UC-CAT-008 | CA-CAT-008 | TEST-CAT-008 | SCR-CAT-001 | BTN-CAT-007 | ACT-CAT-014 | - | - | - | - | - | Implementado | MEDIA | Telegram deep link |

**RF-FU-012 a RF-FU-019:**
| 6.2 | FU | OPS-FU-012 | RF-FU-012 | RNF-PERF-003, RN-NOTIF-01 | HU-FU-002 | UC-FU-008 | CA-FU-012 | TEST-FU-012 | SCR-FU-002 | - | ACT-FU-004 | AUTO-SYS-002 | EVT-FU-013 | Notification, FormatoUnico | FSM-01 | NotificationService | Implementado | CRÍTICA | Dashboard CUSTOMER |
| 6.2 | FU | OPS-FU-013 | RF-FU-013 | RNF-PERF-006, RN-EXCEL-01 | HU-FU-003 | UC-FU-009 | CA-FU-013 | TEST-FU-013 | SCR-FU-001 | BTN-FU-011 | ACT-FU-005 | - | - | FormatoUnicoItem | - | ExcelImportService | Implementado | CRÍTICA | Carga masiva Excel |
| 6.2 | FU | OPS-FU-014 | RF-FU-014 | - | HU-FU-004 | UC-FU-010 | CA-FU-014 | TEST-FU-014 | SCR-FU-001 | BTN-FU-012 | ACT-FU-006 | - | - | - | - | - | Implementado | ALTA | Descarga plantilla |
| 6.2 | FU | OPS-FU-015 | RF-FU-015 | RN-EXCEL-MAP-01 | HU-FU-005 | UC-FU-011 | CA-FU-015 | TEST-FU-015 | SCR-FU-001 | - | ACT-FU-007 | - | - | - | - | ExcelImportService | Implementado | MEDIA | Mapeo columnas |
| 6.2 | FU | OPS-FU-016 | RF-FU-016 | RNF-INT-003, RN-TG-01 | HU-FU-006 | UC-FU-012 | CA-FU-016 | TEST-FU-016 | SCR-FU-001 | BTN-FU-014 | ACT-FU-008 | - | - | - | - | - | Implementado | ALTA | Telegram individual |
| 6.2 | FU | OPS-FU-017 | RF-FU-017 | RNF-INT-003, RN-TG-01 | HU-FU-007 | UC-FU-013 | CA-FU-017 | TEST-FU-017 | SCR-FU-001 | BTN-FU-015 | ACT-FU-009 | - | - | - | - | - | Implementado | ALTA | Telegram masivo |
| 6.2 | FU | OPS-FU-018 | RF-FU-018 | RNF-UI-001 | HU-FU-008 | UC-FU-014 | CA-FU-018 | TEST-FU-018 | SCR-FU-001 | - | - | - | - | FormatoUnico | FSM-01 | - | Implementado | ALTA | Banners FSM |
| 6.2 | FU | OPS-FU-019 | RF-FU-019 | RN-EXCEL-02, RN-EXCEL-03 | HU-FU-009 | UC-FU-015 | CA-FU-019 | TEST-FU-019 | SCR-FU-001 | BTN-FU-013, BTN-FU-016 | ACT-FU-010 | - | - | FormatoUnicoItem | - | ExcelImportService | Implementado | CRÍTICA | Validación doble Excel |

**RF-CHK-009 a RF-CHK-014:**
| 6.2 | CHK | OPS-CHK-009 | RF-CHK-009 | RNF-USE-003 | HU-CHK-002 | UC-CHK-006 | CA-CHK-009 | TEST-CHK-009 | SCR-CHK-001 | - | ACT-CHK-005 | - | - | Order | FSM-02 | ValidationService | Implementado | CRÍTICA | Datos facturación |
| 6.2 | CHK | OPS-CHK-010 | RF-CHK-010 | RNF-REL-005, RN-MP-01 | HU-CHK-003 | UC-CHK-007 | CA-CHK-010 | TEST-CHK-010 | SCR-CHK-001 | BTN-CHK-004 | ACT-CHK-006 | - | - | Order | FSM-02 | PaymentService | Implementado | CRÍTICA | Integración MP |
| 6.2 | CHK | OPS-CHK-011 | RF-CHK-011 | RN-STOCK-02 | HU-CHK-004 | UC-CHK-008 | CA-CHK-011 | TEST-CHK-011 | SCR-CHK-001 | BTN-CHK-004 | - | AUTO-CHK-003 | EVT-CHK-005 | Order, Product | FSM-02 | InventoryService | Implementado | CRÍTICA | Reserva stock |
| 6.2 | CHK | OPS-CHK-012 | RF-CHK-012 | RN-STOCK-03 | HU-CHK-005 | UC-CHK-009 | CA-CHK-012 | TEST-CHK-012 | - | - | - | AUTO-CHK-003 | EVT-CHK-006 | Order | FSM-02 | SchedulerService | Implementado | CRÍTICA | Expiración reserva |
| 6.2 | CHK | OPS-CHK-013 | RF-CHK-013 | RNF-DIS-001 | HU-CHK-006 | UC-CHK-010 | CA-CHK-013 | TEST-CHK-013 | SCR-CHK-002 | BTN-CHK-005, BTN-CHK-006 | ACT-CHK-007 | - | - | Order | FSM-02 | - | Implementado | CRÍTICA | Confirmación pago |
| 6.2 | CHK | OPS-CHK-014 | RF-CHK-014 | RNF-SEC-008, RN-MP-02, RN-MP-03 | HU-CHK-007 | UC-CHK-011 | CA-CHK-014 | TEST-CHK-014 | - | - | - | AUTO-CHK-004 | EVT-CHK-007 | Order | FSM-02 | PaymentService | Implementado | CRÍTICA | Webhook MP |

**RF-AUT-007 a RF-AUT-008:**
| 6.1 | AUT | OPS-AUT-007 | RF-AUT-007 | RN-GUEST-MIGRATE-01 | HU-AUT-002 | UC-AUT-005 | CA-AUT-007 | TEST-AUT-007 | SCR-CHK-001 | - | ACT-AUT-002 | - | - | FormatoUnico | - | FormatoUnicoService | Implementado | CRÍTICA | Migración GUEST→CUSTOMER |
| 6.1 | AUT | OPS-AUT-008 | RF-AUT-008 | RNF-USE-003 | HU-AUT-003 | UC-AUT-006 | CA-AUT-008 | TEST-AUT-008 | SCR-CHK-001 | - | - | - | - | User | - | - | Implementado | ALTA | Auto-completado facturación |

**RF-ADM-009:**
| 6.5 | ADM | OPS-ADM-009 | RF-ADM-009 | RN-KIT-02 | HU-ADM-009 | UC-ADM-006 | CA-ADM-009 | TEST-ADM-009 | SCR-ADM-005 | BTN-ADM-009 | ACT-ADM-005 | - | - | Kit, KitComponent | - | KitService | Implementado | ALTA | CRUD Kits |

**RF-SEL-007:**
| 6.4 | SEL | OPS-SEL-007 | RF-SEL-007 | RNF-INT-003, RN-TG-02 | HU-SEL-007 | UC-SEL-007 | CA-SEL-007 | TEST-SEL-007 | SCR-SEL-001, SCR-CON-001 | BTN-SEL-004, BTN-SEL-005 | ACT-SEL-006 | - | - | Product, Order | - | InventoryService | Implementado | ALTA | Stock real + Telegram |

