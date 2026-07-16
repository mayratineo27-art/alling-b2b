## MOD-DIS-01 — Integración DISTRIBUTOR

- **Objetivo:** recibir actualizaciones de precios y stock desde sistemas externos del distribuidor, manteniendo el catálogo sincronizado sin intervención manual.
- **Actores:** DISTRIBUTOR (sistema externo, único actor de este módulo)
- **Procesos de negocio de origen:** Proceso 6.6 (Sincronización DISTRIBUTOR)
- **Integraciones:** API REST expuesta por el sistema Alling, consumida por sistemas del DISTRIBUTOR mediante autenticación HMAC

---

### Operaciones Funcionales (OPS)

#### `OPS-DIS-001` — Autenticar solicitud de sincronización

- **Objetivo de negocio:** garantizar que solo distribuidores autorizados pueden modificar precios/stock del catálogo, protegiendo la integridad comercial del sistema
- **Actor:** DISTRIBUTOR
- **Proceso de negocio de origen:** 6.6
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** `DistributorApiKey` (lectura/verificación), `NonceRegistry` (verificación de no-reutilización)
- **Eventos de dominio:** ninguno propio (la autenticación es una precondición, no un evento de negocio)
- **Pantallas:** ninguna (operación server-to-server, sin interfaz)
- **Botones/acciones que la disparan:** ninguno (disparado por solicitud HTTP externa)
- **Resultado esperado:** solicitud autenticada y autorizada para continuar a `OPS-DIS-002`
- **Servicios de dominio involucrados:** `DistributorAuthService`, `IdempotencyService` (reutiliza el mecanismo de nonce ya definido en Sesión 1)
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-DIS-002` _(nueva referencia reservada: "toda solicitud debe incluir nonce no reutilizado y firma HMAC válida")_
- **RF relacionados:** `RF-DIS-001`
- **HU relacionadas:** ninguna (este módulo no tiene actor humano; no aplica HU en sentido estricto — ver nota de diseño)
- **UC relacionados:** `UC-DIS-001`
- **CA relacionados:** `CA-DIS-001`
- **TEST relacionados:** `TEST-DIS-001`

#### `OPS-DIS-002` — Sincronizar precios de productos

- **Objetivo de negocio:** mantener los precios del catálogo alineados con el costo mayorista actual sin intervención manual de ADMIN
- **Actor:** DISTRIBUTOR
- **Proceso de negocio de origen:** 6.6
- **Estados de FSM involucrados:** ninguno directo; respeta `RN-CHECKOUT-02` (no afecta cotizaciones ya emitidas)
- **Entidades afectadas:** `Product` (actualiza `price_public`, `price_wholesale`)
- **Eventos de dominio:** `EVT-DIS-001` (`PrecioSincronizado`)
- **Pantallas:** ninguna
- **Botones/acciones que la disparan:** ninguno (solicitud HTTP externa)
- **Resultado esperado:** precios actualizados solo para SKUs existentes y reconocidos
- **Servicios de dominio involucrados:** `ProductService`, `PricingService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-DIST-01` (resuelta en Sesión 1: solo afecta productos existentes, no crea nuevos), `RN-CHECKOUT-02`
- **RF relacionados:** `RF-DIS-002`
- **HU relacionadas:** ninguna
- **UC relacionados:** `UC-DIS-002`
- **CA relacionados:** `CA-DIS-002`
- **TEST relacionados:** `TEST-DIS-002`

#### `OPS-DIS-003` — Sincronizar stock de productos

- **Objetivo de negocio:** mantener el inventario disponible alineado con la realidad del distribuidor, complementando (no sustituyendo) la edición manual de `MOD-SEL-01`
- **Actor:** DISTRIBUTOR
- **Proceso de negocio de origen:** 6.6
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** `Product` (actualiza `stock`)
- **Eventos de dominio:** `EVT-DIS-002` (`StockSincronizado`)
- **Pantallas:** ninguna
- **Botones/acciones que la disparan:** ninguno
- **Resultado esperado:** `Product.stock` actualizado; recalculo de badges en `MOD-CAT-01` vía `AUTO-CAT-001`
- **Servicios de dominio involucrados:** `InventoryService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-DIST-01`
- **RF relacionados:** `RF-DIS-003`
- **HU relacionadas:** ninguna
- **UC relacionados:** `UC-DIS-002` (sub-flujo)
- **CA relacionados:** `CA-DIS-003`
- **TEST relacionados:** `TEST-DIS-003`

#### `OPS-DIS-004` — Rechazar SKU desconocido

- **Objetivo de negocio:** prevenir que el DISTRIBUTOR cree productos nuevos sin pasar por el control de calidad/catálogo de ADMIN
- **Actor:** DISTRIBUTOR (origina la solicitud que es rechazada)
- **Proceso de negocio de origen:** 6.6
- **Estados de FSM involucrados:** ninguno
- **Entidades afectadas:** ninguna (operación de rechazo, no de mutación)
- **Eventos de dominio:** `EVT-DIS-003` (`SincronizacionRechazada`)
- **Pantallas:** ninguna
- **Botones/acciones que la disparan:** ninguno
- **Resultado esperado:** respuesta `404` con detalle de SKUs no reconocidos; el resto del batch (SKUs válidos) se procesa normalmente (procesamiento parcial, no todo-o-nada)
- **Servicios de dominio involucrados:** `ProductService`
- **Prioridad funcional:** MVP
- **RN relacionadas:** `RN-DIST-01`
- **RF relacionados:** `RF-DIS-004`
- **HU relacionadas:** ninguna
- **UC relacionados:** `UC-DIS-002` (flujo de excepción)
- **CA relacionados:** `CA-DIS-004`
- **TEST relacionados:** `TEST-DIS-004`

---

### Pantallas (SCR)

Este módulo no define pantallas. Es una integración server-to-server sin interfaz de usuario propia. La única superficie visible relacionada es indirecta: el resultado de la sincronización se refleja en `MOD-CAT-01` (catálogo público) y `MOD-SEL-01` (gestión de stock), pero esas pantallas pertenecen a esos módulos, no a este.

---

### Componentes (CMP)

Este módulo no define componentes visuales, por la misma razón señalada arriba.

---

### Botones (BTN)

Este módulo no define botones. No hay actor humano que dispare estas operaciones directamente.

---

### Acciones (ACT)

Este módulo no define acciones de usuario. Todas las operaciones se disparan por solicitud HTTP del sistema externo DISTRIBUTOR.

---

### Navegación (NAV)

Este módulo no define navegación, al no tener pantallas.

---

### Funcionalidades Automáticas (AUTO)

#### `AUTO-DIS-001` — Procesamiento de solicitud de sincronización entrante

- **Evento disparador:** solicitud HTTP POST recibida en el endpoint de sincronización
- **Responsable:** `DistributorAuthService` + `ProductService`
- **Condiciones de ejecución:** siempre que llega una solicitud al endpoint
- **Resultado esperado:** ejecuta en cadena `OPS-DIS-001` → `OPS-DIS-002`/`OPS-DIS-003` → `OPS-DIS-004` (si aplica)
- **Manejo de errores:** si la autenticación falla (`OPS-DIS-001`), se rechaza con `401` antes de tocar cualquier dato; se registra el intento en `AuditLog` como posible actividad sospechosa si hay fallos repetidos desde la misma IP

---

### Eventos de Dominio (EVT)

|ID|Evento|Disparado por|
|---|---|---|
|`EVT-DIS-001`|`PrecioSincronizado`|`OPS-DIS-002`|
|`EVT-DIS-002`|`StockSincronizado`|`OPS-DIS-003`|
|`EVT-DIS-003`|`SincronizacionRechazada`|`OPS-DIS-004`|

---

### Reglas de Negocio relacionadas (RN)

`RN-DIST-01` (resuelta en Sesión 1), `RN-CHECKOUT-02` (heredada de `MOD-FU-01`), `RN-DIS-002` (reservada — autenticación HMAC + nonce)

### Requisitos Funcionales relacionados (RF)

`RF-DIS-001`, `RF-DIS-002`, `RF-DIS-003`, `RF-DIS-004`

### Historias de Usuario relacionadas (HU)

Ninguna. Este módulo no tiene actor humano como originador de la interacción; las HU, por definición ("Como [actor], quiero..."), no aplican naturalmente a un sistema externo automatizado. Se documenta esta ausencia como decisión metodológica, no como vacío.

### Casos de Uso relacionados (UC)

`UC-DIS-001`, `UC-DIS-002`

### Criterios de Aceptación relacionados (CA)

`CA-DIS-001`, `CA-DIS-002`, `CA-DIS-003`, `CA-DIS-004`

### Casos de Prueba relacionados (TEST)

`TEST-DIS-001`, `TEST-DIS-002`, `TEST-DIS-003`, `TEST-DIS-004`

---

### Notas de diseño y decisiones del módulo

**Ausencia de HU como decisión metodológica:** se documenta explícitamente para que la auditoría final de trazabilidad no marque esto como un vacío accidental. Los Casos de Uso (`UC-DIS-001`, `UC-DIS-002`) sí aplican porque un UC puede tener un actor no humano (sistema externo) como actor principal; las HU no.

**Procesamiento parcial de batch (decisión ya tomada, no abierta):** `OPS-DIS-004` documenta que un batch de sincronización con algunos SKUs inválidos no rechaza el batch completo, solo los SKUs no reconocidos. Esto se infiere como comportamiento razonable de cualquier API de sincronización masiva, pero se señala que el contexto original no lo especifica explícitamente — es una inferencia objetiva basada en patrones estándar de integración, documentada como tal y no presentada como un hecho ya confirmado por el negocio.

---

### Impacto en documentos globales

- **Modelo de Dominio:** sin cambios. Confirma uso de `DistributorApiKey` y `NonceRegistry` ya definidos en Sesión 1.
- **FSM:** sin cambios.
- **Arquitectura:** sin cambios.
- **Base de Datos:** sin cambios.
- **Decisiones Técnicas:** sin cambios.
- **Catálogo Global de Eventos:** se deben incorporar `EVT-DIS-001`, `EVT-DIS-002`, `EVT-DIS-003` al catálogo global.