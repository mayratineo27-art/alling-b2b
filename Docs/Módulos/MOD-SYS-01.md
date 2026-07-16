## MOD-SYS-01 — Funcionalidades Automáticas Transversales

- **Objetivo:** centralizar la documentación de procesos de sistema que no pertenecen a un módulo funcional específico, sino que operan transversalmente sobre todo el dominio (auditoría, scheduler consolidado).
- **Actores:** sistema (sin actor humano)
- **Procesos de negocio de origen:** transversal a todos los procesos 6.1–6.6
- **Integraciones:** ninguna externa directa

---

### Operaciones Funcionales (OPS)

Este módulo no define Operaciones Funcionales propias en el sentido estricto (capacidad invocable por un actor). Su contenido completo se documenta en la sección de Funcionalidades Automáticas (AUTO) más abajo, que es la categoría correcta para procesos sin actor humano disparador directo.

---

### Pantallas (SCR)

Este módulo no define pantallas propias. No obstante, señalo una dependencia: el contexto original (§6.5) menciona que ADMIN puede "exportar datos", ya documentado como `OPS-ADM-008` en `MOD-ADM-01`. Si en el futuro se decide dar a ADMIN una vista de exploración de `AuditLog` (no solo exportación), esa pantalla pertenecería a `MOD-ADM-01`, no a este módulo — se señala aquí para evitar duplicación futura.

---

### Componentes (CMP)

Este módulo no define componentes visuales.

---

### Botones (BTN)

Este módulo no define botones.

---

### Acciones (ACT)

Este módulo no define acciones de usuario.

---

### Navegación (NAV)

Este módulo no define navegación.

---

### Funcionalidades Automáticas (AUTO)

#### `AUTO-SYS-001` — Registro de auditoría (logging transversal)

- **Evento disparador:** cualquier operación mutante ejecutada en cualquier módulo del sistema (todas las `OPS-*` que afectan entidades, según lo ya señalado en cada módulo)
- **Responsable:** capa transversal de auditoría (interceptor/middleware, no un servicio de dominio específico de un módulo)
- **Condiciones de ejecución:** siempre, sin excepción, para toda mutación de entidad
- **Resultado esperado:** registro inmutable en `AuditLog` con actor, acción, timestamp, IP, estado anterior/nuevo
- **Manejo de errores:** si el registro de auditoría falla, la operación de negocio original **debe revertirse** (la invariante de auditoría completa, ya establecida en Sesión 1, tiene prioridad sobre completar la operación sin registro)

#### `AUTO-SYS-002` — Scheduler consolidado

- **Evento disparador:** ejecución periódica programada (cron)
- **Responsable:** orquestador de jobs (infraestructura, no servicio de dominio)
- **Condiciones de ejecución:** según frecuencia configurada por job
- **Resultado esperado:** ejecuta, en cadena consolidada, los jobs ya definidos de forma dispersa en otros módulos: `AUTO-FU-002` (expiración de cotizaciones, `MOD-FU-01`) y `AUTO-CHK-003` (timeout de pago pendiente, `MOD-CHK-01`)
- **Manejo de errores:** cada job debe ser idempotente de forma independiente (ya señalado en sus módulos de origen); un fallo en un job no debe detener la ejecución de los demás jobs del mismo ciclo

#### `AUTO-SYS-003` — Purga/retención de auditoría

- **Evento disparador:** ejecución periódica programada (cron, baja frecuencia — ej. mensual)
- **Responsable:** orquestador de jobs
- **Condiciones de ejecución:** registros de `AuditLog` con `timestamp` mayor a la política de retención (12 meses, según contexto original §9 de requisitos no funcionales)
- **Resultado esperado:** archivado o eliminación de registros fuera de la ventana de retención, según la decisión técnica que se tome (archivado en almacenamiento frío vs eliminación física — ver nota de diseño)
- **Manejo de errores:** operación de baja criticidad; un fallo no debe afectar operación normal del sistema, solo registrarse para revisión manual

---

### Eventos de Dominio (EVT)

Este módulo no genera eventos de dominio de negocio propios. `AUTO-SYS-001` consume eventos ya generados por otros módulos para persistirlos en `AuditLog`; no es en sí mismo un emisor de eventos de dominio.

---

### Reglas de Negocio relacionadas (RN)

Ninguna nueva. Este módulo opera sobre la invariante de inmutabilidad de `AuditLog` ya definida como invariante de entidad en el Modelo de Dominio (Sesión 1), no sobre una regla de negocio en el sentido de `RN-*` numerada.

### Requisitos Funcionales relacionados (RF)

`RF-SYS-001` (registro de auditoría), `RF-SYS-002` (retención de auditoría)

### Historias de Usuario relacionadas (HU)

Ninguna, por la misma razón metodológica señalada en `MOD-DIS-01`: sin actor humano disparador.

### Casos de Uso relacionados (UC)

Ninguno. Estas son funcionalidades de infraestructura transversal, no flujos de interacción con un actor (humano o sistema externo) que tenga un objetivo de negocio propio invocable — se documentan como `AUTO` exclusivamente, no como `OPS`/`UC`.

### Criterios de Aceptación relacionados (CA)

`CA-SYS-001`, `CA-SYS-002`

### Casos de Prueba relacionados (TEST)

`TEST-SYS-001`, `TEST-SYS-002`, `TEST-SYS-003`

---

### Notas de diseño y decisiones del módulo

**Archivado vs eliminación de AuditLog (no resuelto arbitrariamente):** el contexto original (§9, requisitos no funcionales) establece retención de 12 meses pero no especifica si al vencer ese periodo los registros se eliminan físicamente o se archivan en almacenamiento de menor costo. Dado que `AuditLog` tiene la invariante de "solo INSERT, nunca DELETE/UPDATE" (Sesión 1), una eliminación automática por política de retención requeriría una excepción explícita a esa invariante, documentada como tal — no la asumo por defecto.

**Consolidación de schedulers ya documentados en otros módulos:** `AUTO-SYS-002` no duplica la especificación de `AUTO-FU-002` ni `AUTO-CHK-003` (esas siguen siendo la fuente de verdad de su propia lógica); aquí solo se documenta la existencia de un orquestador transversal que los ejecuta en el mismo ciclo de infraestructura, relevante para la futura especificación de Arquitectura.

---

### Impacto en documentos globales

- **Modelo de Dominio:** sin cambios. Reconfirma (no modifica) la invariante de inmutabilidad de `AuditLog` ya definida en Sesión 1.
- **FSM:** sin cambios.
- **Arquitectura:** **requiere actualización.** Debe documentarse la existencia de un orquestador de jobs/scheduler como componente de infraestructura transversal, y el patrón de interceptor/middleware de auditoría que aplica a todas las mutaciones del sistema.
- **Base de Datos:** sin cambios estructurales inmediatos, pendiente de la decisión de archivado vs eliminación para `AuditLog` (podría requerir tabla de archivo separada si se elige archivado).
- **Decisiones Técnicas:** **requiere una decisión nueva** registrada: política de archivado vs eliminación de `AuditLog` al vencer la retención de 12 meses.
- **Catálogo Global de Eventos:** sin cambios. Este módulo no introduce eventos de dominio nuevos.

---

## Cierre del Inventario Funcional Maestro

Con `MOD-SYS-01` queda completo el recorrido por los nueve módulos identificados al inicio: `MOD-CAT-01`, `MOD-FU-01`, `MOD-CHK-01`, `MOD-CON-01`, `MOD-COT-01`, `MOD-SEL-01`, `MOD-ADM-01`, `MOD-AUT-01`, `MOD-DIS-01`, `MOD-SYS-01` (diez en total, contando la división original).

Quedan pendientes, como trabajo explícitamente diferido y ya señalado a lo largo de los módulos:

La normalización de `MOD-CAT-01` y `MOD-FU-01` a la plantilla consolidada final (con secciones de Artefactos derivados, Servicios de Dominio, Prioridad funcional e Impacto en documentos globales), que en su momento se entregaron con un formato más temprano de la plantilla.

La resolución de los conflictos de actor señalados explícitamente (umbral de stock mínimo en `MOD-SEL-01` vs `MOD-ADM-01`; capacidad de ADMIN para forzar MFA en SELLER).

Las actualizaciones acumuladas a documentos globales: el Modelo de Dominio necesita incorporar `SystemConfig` y resolver soft-delete vs hard-delete de `User`; la Arquitectura necesita documentar el orquestador de jobs y el patrón de auditoría transversal; las Decisiones Técnicas necesitan registrar el límite de intentos MFA, el formato de exportación de datos, y la política de retención de `AuditLog`; y el Catálogo Global de Eventos necesita consolidar todos los `EVT-*` generados en `MOD-SEL-01` a `MOD-SYS-01`.

---

## 🆕 EXTENSIONES v1.2 (Mejoras UI/UX e Integraciones)

### 📋 Nuevos Requisitos Funcionales
- **RF-SYS-001:** Sistema de diseño global (paleta turquesa/verde esmeralda)
- **RF-SYS-002:** Header persistente con buscador avanzado por categoría
- **RF-SYS-003:** Footer persistente con trust signals
- **RF-SYS-004:** Icono de notificaciones FSM en header
- **RF-SYS-005:** Icono de favoritos en header

### 🔧 Nuevos Componentes Globales (CMP-*)

**CMP-SYS-009: Header Persistente (Sticky)**
- **Bloque Superior:**
  - Logo (izquierda)
  - Buscador con selector de categoría (centro)
  - Iconos: Cuenta, Carrito, Notificaciones, Favoritos (derecha)
- **Bloque Inferior:**
  - Menú: HOME | CATÁLOGO | KITS | NOSOTROS | NOTICIAS
- **Comportamiento:** Sticky al hacer scroll
- **Permisos:** Visible para todos los actores

**CMP-SYS-010: Footer Persistente**
- Tema oscuro (#111111)
- **Columnas:**
  - Contacto (teléfono, dirección, email, horario)
  - Información (FAQ, Nosotros, B2B, Política de pago/envío)
  - Legal (Términos, Privacidad, Devoluciones)
- **Trust Signals:** Logos de logística y métodos de pago
- **Botón "ARRIBA":** Scroll-to-top suave

**CMP-SYS-011: Badge de Notificaciones**
- Número rojo en icono de campana
- Se actualiza en tiempo real (WebSocket o polling)
- Tooltip con últimas 3 notificaciones
- Click → Dropdown con lista completa

**CMP-SYS-012: Sistema de Diseño Global**
- Paleta de colores:
  - Primary: #10B981 (Turquesa/Verde Esmeralda)
  - Text: #111827 (Gris oscuro)
  - Metadata: #9CA3AF (Gris claro)
  - Border: #E5E7EB (Gris ultra claro)
  - Success: #10B981, Warning: #F59E0B, Danger: #EF4444
- Tipografía: Inter
- Bordes: rounded-md (4px)
- Sombras: shadow-sm

### 📜 Nuevas Reglas de Negocio

**RN-SYS-001:** Header y footer deben ser visibles en todas las pantallas (excepto checkout MP)
**RN-SYS-002:** Notificaciones se limpian tras 30 días

### 🔄 Impacto en Actores

**GUEST:**
- ✅ Ve header con buscador y menú
- ✅ Ve footer con información de contacto
- ❌ No ve icono de favoritos (solo CUSTOMER)

**CUSTOMER:**
- ✅ Ve badge de notificaciones
- ✅ Ve icono de favoritos
- ✅ Acceso rápido desde header

**SELLER:**
- ✅ Ve notificaciones de pedidos por despachar
- ✅ Header simplificado (sin favoritos)

**ADMIN:**
- ✅ Ve notificaciones de alertas del sistema
- ✅ Acceso rápido a panel desde header

### 🔗 Nuevas Navegaciones (NAV-*)

**NAV-SYS-007:** Header → SCR-CAT-001 (HOME)
**NAV-SYS-008:** Header → SCR-FU-001 (Carrito)
**NAV-SYS-009:** Header → SCR-AUT-001 (Cuenta)
**NAV-SYS-010:** Footer → SCR-ADM-009 (Nosotros)
**NAV-SYS-011:** Header → Dropdown de notificaciones