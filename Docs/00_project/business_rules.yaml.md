# ============================================
# REGLAS DE NEGOCIO — Sistema Alling
# ============================================
# ID Documento: DOC_ALLING_BUSINESS_RULES_001
# Versión: 1.1.0
# Fuente: Derivado de los 10 módulos del Inventario Funcional Maestro
# Metodología: SpecDD / OAARIT
# Última actualización: 30/06/2026
# ============================================

rules:
  # ------------------------------------------
  # MÓDULO: Formato Único (MOD-FU-01)
  # ------------------------------------------
  - id: RN-FU-01
    description: >
      Un GUEST no puede transicionar su Formato Único directamente a COTIZACIÓN 
      ni a PEDIDO. Debe convertirse en CUSTOMER o usar el checkout invitado.
    category: TRANSICION
    priority: CRITICAL
    actor_restriction: 
      - ACT-01 # GUEST
    route_constraint: 
      - RT-FU-02
      - RT-FU-03
    enforcement: HARD
    spec_origen: MOD-FU-01 (OPS-FU-005, OPS-FU-006)

  - id: RN-FU-02
    description: >
      Un Formato Único en estado PEDIDO con pago confirmado (CONFIRMADO) es 
      inmutable. No se permiten ediciones de ítems ni cantidades.
    category: TRANSICION
    priority: CRITICAL
    actor_restriction: 
      - ACT-01 # GUEST
      - ACT-02 # CUSTOMER
    route_constraint: 
      - RT-FU-01
    enforcement: HARD
    spec_origen: MOD-FU-01 (OPS-FU-006)

  - id: RN-FU-03
    description: >
      Una COTIZACIÓN tiene una vigencia de 15 días desde su generación. 
      Al vencer, transiciona automáticamente a EXPIRADA.
    category: TRANSICION
    priority: HIGH
    actor_restriction: 
      - SYSTEM
    route_constraint: []
    enforcement: HARD
    spec_origen: MOD-FU-01 (AUTO-FU-002)

  - id: RN-FU-04
    description: >
      Toda transición de estado del Formato Único debe registrarse en 
      FormatoUnicoTransition con actor, timestamp y estado anterior/nuevo.
    category: AUDITORIA
    priority: HIGH
    actor_restriction: 
      - SYSTEM
    route_constraint: []
    enforcement: HARD
    spec_origen: MOD-FU-01 (FormatoUnicoTransition)

  - id: RN-FU-05
    description: >
      La expiración de una COTIZACIÓN es automática e idempotente. 
      El sistema verifica state actual antes de transicionar a EXPIRADA.
    category: TRANSICION
    priority: HIGH
    actor_restriction: 
      - SYSTEM
    route_constraint: []
    enforcement: HARD
    spec_origen: MOD-FU-01 (AUTO-FU-002, FU-T-10)

  - id: RN-FU-06
    description: >
      El CUSTOMER dueño puede cancelar voluntariamente una COTIZACIÓN vigente
      en cualquier momento, sin esperar el vencimiento automático de 15 días
      (RN-FU-03). Al cancelar, el FU transiciona a BORRADOR conservando sus
      ítems; el precio congelado se libera (vuelve a ser dinámico, mismo
      criterio que la expiración automática) y el pdf_url se invalida.
    category: TRANSICION
    priority: HIGH
    actor_restriction:
      - ACT-02 # CUSTOMER (dueño exclusivo, ver RNF-SEC-001)
    route_constraint:
      - RT-FU-02
    enforcement: HARD
    spec_origen: MOD-FU-01 (OPS-FU-020, FU-T-15)

  - id: RN-FU-07
    description: >
      Cláusula Cambiaria. Si el tipo de cambio de la moneda (USD a PEN/Soles) 
      varía de forma significativa antes del pago final de la orden, la 
      cotización podrá ser actualizada por el sistema o quedar sin efecto.
    category: VALIDACION
    priority: HIGH
    actor_restriction: 
      - SYSTEM
    route_constraint: []
    enforcement: HARD
    spec_origen: MOD-FU-01

  - id: RN-FU-08
    description: >
      Cláusula de Precios Internacionales. Los precios de ciertos productos 
      tecnológicos importados están sujetos a fluctuaciones comerciales 
      internacionales, por lo que su cotización queda sujeta a modificaciones 
      en el precio final por parte de la tienda si ocurren dichos cambios globales.
    category: VALIDACION
    priority: HIGH
    actor_restriction: 
      - SYSTEM
    route_constraint: []
    enforcement: HARD
    spec_origen: MOD-FU-01

  - id: RN-FU-09
    description: >
      Patrón de Clonación (Sprint 6): al generar una cotización, el sistema
      CLONA el Formato Único en un registro nuevo e independiente en estado
      COTIZACIÓN; el Formato Único original se vacía y permanece en
      BORRADOR, editable de inmediato. Un mismo CUSTOMER puede tener
      múltiples FU en BORRADOR simultáneos (el activo + huérfanos históricos
      de cotizaciones canceladas): el "borrador activo" se resuelve siempre
      como el de `updated_at` más reciente, nunca por orden de iteración.
    category: TRANSICION
    priority: CRITICAL
    actor_restriction:
      - ACT-02 # CUSTOMER
    route_constraint:
      - RT-FU-02
    enforcement: HARD
    spec_origen: MOD-FU-01 (OPS-FU-005, RF-FU-005)

  - id: RN-FU-10
    description: >
      Stock Parcial en Confirmación de Importación Excel: al confirmar una
      Carga Masiva (RF-FU-013/RF-FU-019), si la cantidad solicitada de un
      SKU excede el stock disponible, el sistema NO rechaza la fila
      completa — aplica al Formato Único hasta el stock disponible (mismo
      criterio que la advertencia de "stock parcial" ya reportada por la
      validación previa). Si el SKU ya existía en el FU, la cantidad final
      queda acotada al stock disponible total, no se suma sin límite.
    category: VALIDACION
    priority: MEDIUM
    actor_restriction:
      - ACT-01 # GUEST
      - ACT-02 # CUSTOMER
    route_constraint:
      - RT-FU-02
    enforcement: HARD
    spec_origen: MOD-FU-01 (RF-FU-013, RF-FU-019)

  - id: RN-GUEST-01
    description: >
      Un GUEST solo puede tener 1 Formato Único activo en estado BORRADOR 
      vinculado a su guest_token.
    category: VALIDACION
    priority: HIGH
    actor_restriction: 
      - ACT-01 # GUEST
    route_constraint: 
      - RT-FU-01
    enforcement: HARD
    spec_origen: MOD-FU-01 (OPS-CAT-003)

  - id: RN-GUEST-MIGRATE-01
    description: >
      Al autenticarse un GUEST como CUSTOMER, si ambos tienen FU en BORRADOR, 
      se debe presentar un modal de resolución (descartar o combinar) sin 
      pérdida silenciosa de datos.
    category: TRANSICION
    priority: HIGH
    actor_restriction: 
      - ACT-02 # CUSTOMER
    route_constraint: 
      - RT-AUTH-01
    enforcement: HARD
    spec_origen: MOD-FU-01 (OPS-FU-009)

  # ------------------------------------------
  # MÓDULO: Checkout y Pago (MOD-CHK-01)
  # ------------------------------------------
  - id: RN-CHECKOUT-01
    description: >
      Antes de transicionar un FU a COTIZACIÓN o PEDIDO, se debe validar 
      que todos los ítems tengan stock suficiente. Si algún ítem no tiene 
      stock, se rechaza la transición con 409 y lista de productos afectados.
    category: VALIDACION
    priority: CRITICAL
    actor_restriction: 
      - SYSTEM
    route_constraint: 
      - RT-FU-02
      - RT-FU-03
    enforcement: HARD
    spec_origen: MOD-FU-01 (AUTO-FU-004), MOD-CHK-01 (OPS-CHK-001)

  - id: RN-CHECKOUT-02
    description: >
      Al transicionar a COTIZACIÓN o PEDIDO, el precio de cada ítem se fija 
      (price_at_time) y no se ve afectado por cambios futuros en el catálogo.
      Esta inmutabilidad aplica también para sincronizaciones de DISTRIBUTOR.
    category: CALCULO
    priority: CRITICAL
    actor_restriction: 
      - SYSTEM
    route_constraint: []
    enforcement: HARD
    spec_origen: MOD-FU-01 (AUTO-FU-005), MOD-CHK-01 (OPS-CHK-004), 
                 MOD-COT-01, MOD-DIS-01, MOD-ADM-01

  - id: RN-CHK-001
    description: >
      Para checkout invitado, el DNI debe tener 8 dígitos numéricos y el RUC 
      11 dígitos numéricos. El email debe cumplir RFC 5322.
    category: VALIDACION
    priority: CRITICAL
    actor_restriction: 
      - ACT-01 # GUEST
      - ACT-02 # CUSTOMER
    route_constraint: 
      - RT-CHK-01
    enforcement: HARD
    spec_origen: MOD-CHK-01 (OPS-CHK-001)

  - id: RN-CHK-002
    description: >
      Al transicionar a COTIZACIÓN o PEDIDO, el precio de cada ítem se fija 
      (price_at_time) y no se ve afectado por cambios futuros en el catálogo.
    category: CALCULO
    priority: CRITICAL
    actor_restriction: 
      - SYSTEM
    route_constraint: []
    enforcement: HARD
    spec_origen: MOD-CHK-01 (OPS-CHK-004)

  - id: RN-CHK-003
    description: >
      El inicio de pago debe redirigir al usuario a la interfaz de MercadoPago 
      con el monto exacto y la referencia del Order.
    category: TRANSICION
    priority: HIGH
    actor_restriction: 
      - ACT-01 # GUEST
      - ACT-02 # CUSTOMER
    route_constraint: 
      - RT-PAY-01
    enforcement: HARD
    spec_origen: MOD-CHK-01 (OPS-CHK-003)

  - id: RN-CHK-004
    description: >
      Todo webhook de MercadoPago debe validarse mediante idempotency_key 
      (event_id único) para evitar duplicación de pedidos.
    category: SEGURIDAD
    priority: CRITICAL
    actor_restriction: 
      - SYSTEM
    route_constraint: 
      - RT-WEBHOOK-01
    enforcement: HARD
    spec_origen: MOD-CHK-01 (OPS-CHK-004)

  - id: RN-CHK-005
    description: >
      La firma HMAC del webhook de MercadoPago debe validarse antes de 
      procesar cualquier mutación de estado.
    category: SEGURIDAD
    priority: CRITICAL
    actor_restriction: 
      - SYSTEM
    route_constraint: 
      - RT-WEBHOOK-01
    enforcement: HARD
    spec_origen: MOD-CHK-01 (AUTO-CHK-001)

  - id: RN-CHK-006
    description: >
      Toda cancelación de pedido (manual o por timeout) debe registrar 
      cancellation_reason en el Order.
    category: AUDITORIA
    priority: MEDIUM
    actor_restriction: 
      - SYSTEM
      - ACT-01 # GUEST
      - ACT-02 # CUSTOMER
    route_constraint: []
    enforcement: HARD
    spec_origen: MOD-CHK-01 (OPS-CHK-005)

  - id: RN-CHK-007
    description: >
      Un GUEST puede consultar su pedido confirmado únicamente mediante 
      orderToken (UUID opaco) en la URL.
    category: SEGURIDAD
    priority: HIGH
    actor_restriction: 
      - ACT-01 # GUEST
    route_constraint: 
      - RT-CHK-02
    enforcement: HARD
    spec_origen: MOD-CHK-01 (OPS-CHK-006)

  - id: RN-CHK-008
    description: >
      Tras la confirmación de pago (ORD-T-02), se debe enviar automáticamente 
      un email de confirmación al comprador.
    category: AUDITORIA
    priority: MEDIUM
    actor_restriction: 
      - SYSTEM
    route_constraint: []
    enforcement: SOFT
    spec_origen: MOD-CHK-01 (OPS-CHK-007)

  - id: RN-CHK-009
    description: >
      Un pedido en estado PENDING_PAYMENT puede ser cancelado manualmente 
      por el owner antes de la confirmación del webhook.
    category: TRANSICION
    priority: HIGH
    actor_restriction: 
      - ACT-01 # GUEST
      - ACT-02 # CUSTOMER
    route_constraint: 
      - RT-CHK-02
    enforcement: HARD
    spec_origen: MOD-CHK-01 (OPS-CHK-008)

  - id: RN-CHK-010
    description: >
      Un Formato Único solo puede tener un Order activo (PENDING_PAYMENT) 
      simultáneamente.
    category: VALIDACION
    priority: CRITICAL
    actor_restriction: 
      - SYSTEM
    route_constraint: []
    enforcement: HARD
    spec_origen: MOD-CHK-01 (OPS-FU-006)

  - id: RN-SHP-01
    description: >
      El costo de envío debe calcularse y reflejarse en el total antes de 
      confirmar el pago. Si falla el cálculo, se bloquea el checkout.
    category: CALCULO
    priority: HIGH
    actor_restriction: 
      - SYSTEM
    route_constraint: 
      - RT-CHK-01
    enforcement: HARD
    spec_origen: MOD-CHK-01 (OPS-CHK-002)

  # ------------------------------------------
  # MÓDULO: Panel SELLER (MOD-SEL-01)
  # ------------------------------------------
  - id: RN-SEL-001
    description: >
      El stock de un producto no puede establecerse en un valor negativo. 
      El mínimo permitido es 0.
    category: VALIDACION
    priority: CRITICAL
    actor_restriction: 
      - ACT-03 # SELLER
    route_constraint: 
      - RT-SELLER-03
    enforcement: HARD
    spec_origen: MOD-SEL-01 (OPS-SEL-002)

  - id: RN-CALC-03
    description: >
      El sistema debe mostrar una alerta visual cuando el stock de un producto 
      esté por debajo de su umbral mínimo (stock_min_threshold).
    category: CALCULO
    priority: MEDIUM
    actor_restriction: 
      - ACT-03 # SELLER
    route_constraint: 
      - RT-SELLER-01
    enforcement: SOFT
    spec_origen: MOD-SEL-01 (OPS-SEL-001)

  - id: RN-CALC-03-BIS
    description: >
      Jerarquía de umbral de stock: Si Product.stock_min_threshold es NULL, 
      se usa SystemConfig.default_stock_min_threshold (valor global de ADMIN).
    category: CALCULO
    priority: HIGH
    actor_restriction: 
      - SYSTEM
    route_constraint: []
    enforcement: HARD
    spec_origen: MOD-SEL-01 / MOD-ADM-01 (Reconciliación INC-001)

  # ------------------------------------------
  # MÓDULO: Panel ADMIN (MOD-ADM-01)
  # ------------------------------------------
  - id: RN-ADMIN-01
    description: >
      Un ADMIN no puede suspender ni eliminar su propia cuenta.
    category: SEGURIDAD
    priority: CRITICAL
    actor_restriction: 
      - ACT-04 # ADMIN
    route_constraint: 
      - RT-ADMIN-01
    enforcement: HARD
    spec_origen: MOD-ADM-01 (OPS-ADM-003, OPS-ADM-004)

  - id: RN-ADMIN-02
    description: >
      Debe haber un mínimo de 2 ADMINs activos en el sistema. No se permite 
      suspender/eliminar si queda solo 1.
    category: SEGURIDAD
    priority: CRITICAL
    actor_restriction: 
      - ACT-04 # ADMIN
    route_constraint: 
      - RT-ADMIN-01
    enforcement: HARD
    spec_origen: MOD-ADM-01 (OPS-ADM-003, OPS-ADM-004)

  - id: RN-ADM-001
    description: >
      El email de un usuario debe ser único en todo el sistema, sin importar 
      su rol (CUSTOMER, SELLER, ADMIN).
    category: VALIDACION
    priority: CRITICAL
    actor_restriction: 
      - ACT-04 # ADMIN
    route_constraint: 
      - RT-ADMIN-01
    enforcement: HARD
    spec_origen: MOD-ADM-01 (OPS-ADM-002)

  - id: RN-ADM-002
    description: >
      Toda exportación de datos sensibles por ADMIN requiere re-autenticación 
      MFA (TOTP) inmediatamente previa (step-up).
    category: SEGURIDAD
    priority: CRITICAL
    actor_restriction: 
      - ACT-04 # ADMIN
    route_constraint: 
      - RT-ADMIN-05
    enforcement: HARD
    spec_origen: MOD-ADM-01 (OPS-ADM-008)

  - id: RN-CATALOG-01
    description: >
      El stock mostrado al público (GUEST/CUSTOMER) debe ser un booleano 
      (En stock/Agotado) o un rango, nunca la cantidad exacta.
    category: VALIDACION
    priority: MEDIUM
    actor_restriction: 
      - ACT-01 # GUEST
      - ACT-02 # CUSTOMER
    route_constraint: 
      - RT-PUB-03
    enforcement: HARD
    spec_origen: MOD-ADM-01 (OPS-ADM-005)

    - id: RN-ADM-03
    description: >
    El administrador  puede listar a todos los usuarios registrados en el sistema.
      

  # ------------------------------------------
  # MÓDULO: Autenticación (MOD-AUT-01)
  # ------------------------------------------
  - id: RN-AUT-001
    description: >
      Un CUSTOMER solo puede autenticarse vía Google OAuth. No se permiten 
      credenciales locales (email/password) para este rol.
    category: SEGURIDAD
    priority: HIGH
    actor_restriction: 
      - ACT-02 # CUSTOMER
    route_constraint: 
      - RT-AUTH-01
    enforcement: HARD
    spec_origen: MOD-AUT-01 (OPS-AUT-001)

  - id: RN-AUT-002
    description: >
      SELLER y ADMIN solo pueden autenticarse con credenciales locales 
      (email/password). No se permite Google OAuth para estos roles.
    category: SEGURIDAD
    priority: HIGH
    actor_restriction: 
      - ACT-03 # SELLER
      - ACT-04 # ADMIN
    route_constraint: 
      - RT-AUTH-02
    enforcement: HARD
    spec_origen: MOD-AUT-01 (OPS-AUT-002)

  - id: RN-AUT-003
    description: >
      Cada código de respaldo MFA es de un solo uso. Una vez consumido, 
      se invalida permanentemente.
    category: SEGURIDAD
    priority: HIGH
    actor_restriction: 
      - ACT-03 # SELLER
      - ACT-04 # ADMIN
    route_constraint: 
      - RT-AUTH-03
    enforcement: HARD
    spec_origen: MOD-AUT-01 (OPS-AUT-004)

  - id: RN-AUT-004
    description: >
      El refresh_token se persiste únicamente hasheado (SHA-256), nunca en
      texto plano. Cada uso válido lo ROTA: el token consumido queda
      revocado de inmediato y se emite uno nuevo. Reutilizar un
      refresh_token ya rotado o revocado (ej. tras robo, o tras logout)
      debe rechazarse con 401, no seguir siendo válido.
    category: SEGURIDAD
    priority: CRITICAL
    actor_restriction:
      - ACT-02 # CUSTOMER
      - ACT-03 # SELLER
      - ACT-04 # ADMIN
    route_constraint:
      - RT-AUTH-01
    enforcement: HARD
    spec_origen: MOD-AUT-01 (OPS-AUT-009)

  # ------------------------------------------
  # MÓDULO: Integración DISTRIBUTOR (MOD-DIS-01)
  # ------------------------------------------
  - id: RN-DIST-01
    description: >
      La sincronización de stock/precios solo afecta a SKUs existentes en 
      el catálogo. Los SKUs desconocidos se rechazan individualmente sin 
      bloquear el batch completo.
    category: VALIDACION
    priority: CRITICAL
    actor_restriction: 
      - ACT-05 # DISTRIBUTOR
    route_constraint: 
      - RT-API-02
    enforcement: HARD
    spec_origen: MOD-DIS-01 (OPS-DIS-002, OPS-DIS-003, OPS-DIS-004)

  - id: RN-DIS-002
    description: >
      Toda solicitud del DISTRIBUTOR debe incluir firma HMAC válida y un 
      nonce no reutilizado en las últimas 24 horas.
    category: SEGURIDAD
    priority: CRITICAL
    actor_restriction: 
      - ACT-05 # DISTRIBUTOR
    route_constraint: 
      - RT-API-02
    enforcement: HARD
    spec_origen: MOD-DIS-01 (OPS-DIS-001)

  # ------------------------------------------
  # MÓDULO: Consulta Pre-Venta (MOD-CON-01)
  # ------------------------------------------
  - id: RN-CONSULTA-ASSIGN-01
    description: >
      La asignación de una consulta a un SELLER es manual. No hay round-robin 
      automático en el MVP.
    category: TRANSICION
    priority: MEDIUM
    actor_restriction: 
      - ACT-03 # SELLER
    route_constraint: 
      - RT-SELLER-01
    enforcement: SOFT
    spec_origen: MOD-CON-01 (OPS-CON-001)

  - id: RN-CON-001
    description: >
      Una consulta solo puede tener un SELLER asignado a la vez. Si dos 
      SELLERs intentan tomarla simultáneamente, el primero gana (bloqueo 
      optimista).
    category: VALIDACION
    priority: HIGH
    actor_restriction: 
      - ACT-03 # SELLER
    route_constraint: 
      - RT-SELLER-01
    enforcement: HARD
    spec_origen: MOD-CON-01 (OPS-CON-002)

  - id: RN-CON-002
    description: >
      Solo el SELLER asignado a una consulta puede responderla. Otros 
      SELLERs reciben 403 Forbidden.
    category: SEGURIDAD
    priority: HIGH
    actor_restriction: 
      - ACT-03 # SELLER
    route_constraint: 
      - RT-SELLER-02
    enforcement: HARD
    spec_origen: MOD-CON-01 (OPS-CON-003)

##  EXTENSIONES v1.2 (14 Mejoras UI/UX e Integraciones)

> **Nota:** Las siguientes 14 RN complementan las 28 RN existentes. No reemplazan ni renumeran las anteriores.

---

### 🔄 Migración GUEST → CUSTOMER

**RN-GUEST-MIGRATE-01**
- **Descripción:** Cuando un GUEST con Formato Único activo se autentica como CUSTOMER, el sistema debe fusionar automáticamente el FU de sesión con el FU existente del CUSTOMER (sumar cantidades de SKUs coincidentes, agregar SKUs distintos como nuevas filas).
- **Módulo:** MOD-FU-01, MOD-AUT-01
- **Actores afectados:** GUEST, CUSTOMER
- **Validación técnica:**
```python
def test_guest_migration_fusiona_carritos():
    guest_fu = FormatoUnico(items=[Item(sku="A", qty=2)])
    customer_fu = FormatoUnico(items=[Item(sku="A", qty=1), Item(sku="B", qty=3)])
    result = merge(guest_fu, customer_fu)
    assert result.items[0].qty == 3  # A: 2+1
    assert result.items[1].qty == 3  # B: 3
```

- **Prioridad:** CRÍTICA

---

### Reserva de Inventario

**RN-STOCK-02**

- **Descripción:** Al transicionar Formato Único de COTIZACIÓN a PEDIDO (inicio de pago), el sistema debe RESERVAR (descontar temporalmente) el stock de cada ítem. La reserva NO es definitiva hasta confirmación de pago.
- **Módulo:** MOD-CHK-01
- **Actores afectados:** GUEST, CUSTOMER, SELLER (ve stock real = total - reservado)
- **Validación técnica:**
```Python
def test_reserva_stock_al_iniciar_pago():
    product = Product(sku="A", stock=10)
    fu = FormatoUnico(items=[Item(sku="A", qty=3)])
    order = iniciar_pago(fu)
    assert order.status == "PEDIDO"
    assert product.reserved_stock == 3
    assert product.available_stock == 7
```

- **Prioridad:** CRÍTICA

**RN-STOCK-03**

- **Descripción:** Si el pago no se confirma en 30 minutos (AUTO-CHK-003), la reserva de stock se libera automáticamente y el Formato Único vuelve a COTIZACIÓN o pasa a CANCELADO.
- **Módulo:** MOD-CHK-01
- **Actores afectados:** SISTEMA (automático)
- **Prioridad:** CRÍTICA

---

### 📊 Importación Excel

**RN-EXCEL-01**

- **Descripción:** El archivo Excel/CSV debe tener tamaño máximo 5MB, formato .xls/.xlsx/.csv, y contener al menos las columnas obligatorias: SKU (o equivalente mapeable) y Cantidad.
- **Módulo:** MOD-FU-01
- **Actores afectados:** GUEST, CUSTOMER
- **Prioridad:** ALTA

**RN-EXCEL-02**

- **Descripción:** Si un SKU del Excel no existe en el catálogo, la fila se marca como error (rojo) pero NO bloquea el procesamiento del resto.
- **Módulo:** MOD-FU-01
- **Actores afectados:** GUEST, CUSTOMER
- **Prioridad:** ALTA

**RN-EXCEL-03**

- **Descripción:** Si la cantidad solicitada excede el stock disponible, la fila se marca como advertencia (naranja) y el usuario puede aceptar reducir la cantidad o mantener la solicitud.
- **Módulo:** MOD-FU-01
- **Actores afectados:** GUEST, CUSTOMER
- **Prioridad:** ALTA

**RN-EXCEL-MAP-01**

- **Descripción:** Si el Excel del cliente tiene nombres de columnas distintos a la plantilla estándar, el sistema presenta un modal de "Mapeo de Columnas" donde el usuario indica qué columna corresponde a SKU y cuál a Cantidad.
- **Módulo:** MOD-FU-01
- **Actores afectados:** GUEST, CUSTOMER
- **Prioridad:** MEDIA

---

### Kits

**RN-KIT-01**

- **Descripción:** El precio total de un Kit se calcula dinámicamente como la suma de los precios públicos de sus componentes. Si un componente cambia de precio, el Kit se actualiza automáticamente.
- **Módulo:** MOD-CAT-01
- **Actores afectados:** GUEST, CUSTOMER (visualización), ADMIN (gestión)
- **Prioridad:** ALTA

**RN-KIT-02**

- **Descripción:** Un Kit debe contener al menos 2 productos. No se puede crear un Kit con un solo componente.
- **Módulo:** MOD-CAT-01
- **Actores afectados:** ADMIN
- **Prioridad:** MEDIA

**RN-KIT-03**

- **Descripción:** El stock de un Kit es igual al stock mínimo de sus componentes. Si un componente está agotado, el Kit completo aparece como agotado.
- **Módulo:** MOD-CAT-01
- **Actores afectados:** GUEST, CUSTOMER (visualización), SELLER (despacho)
- **Prioridad:** ALTA

---

### Telegram

**RN-TG-01**

- **Descripción:** Los mensajes pre-armados a Telegram deben incluir SIEMPRE: (a) SKU del producto, (b) nombre del producto, (c) cantidad solicitada, (d) contexto del error (si aplica).
- **Módulo:** MOD-FU-01, MOD-CAT-01
- **Actores afectados:** GUEST, CUSTOMER, SELLER
- **Prioridad:** MEDIA

**RN-TG-02**

- **Descripción:** La integración con Telegram es SOLO de salida (deep links a t.me). No se implementa bot bidireccional en MVP.
- **Módulo:** MOD-FU-01
- **Actores afectados:** GUEST, CUSTOMER, SELLER
- **Prioridad:** MEDIA

---

### 💳 Mercado Pago

**RN-MP-01**

- **Descripción:** El ID del Formato Único se envía a Mercado Pago como external_reference para permitir conciliación en webhooks.
- **Módulo:** MOD-CHK-01
- **Actores afectados:** GUEST, CUSTOMER, SISTEMA
- **Prioridad:** CRÍTICA

**RN-MP-02**

- **Descripción:** El webhook de Mercado Pago debe validar firma HMAC antes de procesar cualquier evento (refuerzo de RN-CHK-005).
- **Módulo:** MOD-CHK-01
- **Actores afectados:** SISTEMA
- **Prioridad:** CRÍTICA

**RN-MP-03**

- **Descripción:** Mapeo de estados MP → FSM: approved → PEDIDO a CONFIRMADO, pending → mantiene PEDIDO, rejected/cancelled → PEDIDO a CANCELADO + libera stock.
- **Módulo:** MOD-CHK-01
- **Actores afectados:** SISTEMA
- **Prioridad:** CRÍTICA

---

### ⭐ Favoritos

**RN-FAV-01**

- **Descripción:** Solo usuarios autenticados (CUSTOMER) pueden guardar favoritos. Los favoritos se almacenan por usuario y persisten entre sesiones.
- **Módulo:** MOD-CAT-01
- **Actores afectados:** CUSTOMER
- **Prioridad:** MEDIA

---

### 🔔 Notificaciones

**RN-NOTIF-01**

- **Descripción:** Eventos notificables en Dashboard del Customer: Cotización próxima a expirar (<24h), Respuesta a consulta recibida, Pedido confirmado, Pedido enviado.
- **Módulo:** MOD-FU-01
- **Actores afectados:** CUSTOMER
- **Prioridad:** MEDIA

---

### 🕵️ Reglas de Auditoría e Integración de Brechas (v1.3)

**RN-PRICING-05 (Recálculo de precios activos en FU)**
- **Descripción:** Si el precio de un producto cambia en el catálogo, los Formatos Únicos que permanecen en estado `BORRADOR` deben actualizar sus subtotales al cargarse (`GET /formatos/me`). Los que están en estado `COTIZACION` o superior están exentos (fijados).
- **Módulo:** MOD-FU-01, MOD-CAT-01
- **Actores afectados:** GUEST, CUSTOMER, SISTEMA
- **Prioridad:** CRÍTICA
- **Vínculo:** BRG-CROSS-001 / RF-CAT-006

**RN-USER-BLOCK-01 (Cierre de sesión por suspensión)**
- **Descripción:** Si un usuario es marcado como `is_active = false` (suspendido) por un ADMIN, todos sus tokens JWT emitidos deben ser inmediatamente invalidados en la validación middleware.
- **Módulo:** MOD-ADM-01, MOD-AUT-01
- **Actores afectados:** CUSTOMER, SELLER, ADMIN, SISTEMA
- **Prioridad:** CRÍTICA
- **Vínculo:** BRG-CROSS-002 / RF-ADM-003

**RN-KIT-SYNC-01 (Propagación de estado Kit componente)**
- **Descripción:** Si un producto individual componente de un Kit cambia su estado a inactivo (`is_active = false`), el Kit contenedor debe cambiar automáticamente su propiedad `is_active` a `false` para evitar compras rotas.
- **Módulo:** MOD-CAT-01, MOD-ADM-01
- **Actores afectados:** SISTEMA, ADMIN
- **Prioridad:** CRÍTICA
- **Vínculo:** BRG-CROSS-003 / RF-CAT-006

**RN-RESERVE-01 (Liberación de Stock Reservado)**
- **Descripción:** La reserva temporal de stock (`reserved_stock`) efectuada en `COTIZACION -> PEDIDO` tiene un tiempo de expiración estricto de 30 minutos. Si el webhook de pago no confirma la transacción en ese lapso, el stock vuelve a estar disponible.
- **Módulo:** MOD-CHK-01
- **Actores afectados:** SISTEMA
- **Prioridad:** CRÍTICA
- **Vínculo:** BRG-CROSS-005 / RF-CHK-012

**RN-NAV-01 (Header Cart Persistent Link)**
- **Descripción:** El enlace y contador del carrito/Formato Único debe ser renderizado en el header global en todas las vistas públicas, manteniendo sincronización de cookies e ítems.
- **Módulo:** MOD-FU-01, MOD-CAT-01
- **Actores afectados:** GUEST, CUSTOMER
- **Prioridad:** CRÍTICA
- **Vínculo:** BRG-NAV-001 / RF-NAV-001

**RN-ADM-03 (Bloqueo de eliminación de Categoría con Productos)**
- **Descripción:** No se permite eliminar una categoría si existen productos activos asociados a ella. La eliminación debe ser rechazada con un error HTTP 400.
- **Módulo:** MOD-ADM-01
- **Actores afectados:** ADMIN, SISTEMA
- **Prioridad:** ALTA
- **Vínculo:** RF-ADM-005

**RN-ADM-04 (Límite de Descuento B2B Comercial Manual)**
- **Descripción:** El Administrador puede aplicar un descuento manual sobre una cotización vigente en estado `COTIZACION` de hasta un 30% como máximo. Valores mayores a 30% deben ser rechazados. Al aplicarse, el subtotal de la cotización se recalcula y congela en el PDF asociado.
- **Módulo:** MOD-ADM-01, MOD-COT-01
- **Actores afectados:** ADMIN, SELLER, SISTEMA
- **Prioridad:** CRÍTICA
- **Vínculo:** RF-ADM-010


