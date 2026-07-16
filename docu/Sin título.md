# Especificación de Requerimientos: Flujo de "HOME" y Customer Dashboard

## 1. Actualización de la Cabecera (Header Global)
Se añade un nuevo enlace de texto al menú principal para destacar las novedades de inventario. Este menú será visible para usuarios autenticados y no autenticados.
*   **Estructura del Menú:** `[ LOGO ] | HOME | CATÁLOGO | NUEVO / NOTICIAS | [Login/Perfil]`

## 2. Vista "HOME" - Usuario No Autenticado (Guest View)
Cuando un usuario sin sesión iniciada hace clic en "HOME", el sistema renderizará una vista orientada a la conversión y exploración rápida.

*   **Sección Principal (Exploración):** Cuadrícula de **Tarjetas de Categoría** (ej. Cat 6, Cat 7, Fibra Óptica) con contadores dinámicos (como se definió en requerimientos anteriores).
*   **Sección Secundaria (Novedades):** Un carrusel o bloque tipo *grid* promocional titulado "Nuevos Productos / Noticias". Aquí se mostrarán las últimas adiciones al inventario (ej. "Descubre nuestra nueva gama de patch cords", referenciando el diseño de la Hero Image), incentivando el clic hacia el catálogo.

## 3. Vista "HOME" - Usuario Autenticado (Customer Dashboard)
Cuando un cliente con sesión activa (Customer) accede a "HOME", el sistema redirige automáticamente al **Dashboard Post-Login**. Esta vista prioriza la gestión de sus requerimientos en curso basada en la Máquina de Estados Finito (FSM).

### 3.1. Panel de Notificaciones (Alertas)
Banners superiores descartables o persistentes según la criticidad:
*   **Alertas de Consulta:** "Tienes una respuesta a tu consulta pendiente de lectura."
*   **Alertas de Expiración:** "Tu cotización #COT-XXX expirará en [X] horas/días."

### 3.2. Módulo Principal: Formato Único Activo (MOD-FU-01)
Si el cliente tiene un trámite en curso, se mostrará una tarjeta destacada (Widget principal) con la información del Formato Único. La visualización depende de su estado FSM:

*   **Estado BORRADOR:**
    *   Muestra el progreso o los ítems guardados.
    *   Acciones: "Continuar edición", "Descartar".
*   **Estado COTIZACIÓN (MOD-COT-01):**
    *   Muestra el resumen de la propuesta económica.
    *   **Temporizador (Countdown):** Reloj dinámico de 7 días indicando la vigencia restante.
    *   Acciones: "Aceptar Cotización", "Rechazar", "Solicitar ajustes".
*   **Estado CONSULTA (MOD-CON-01):**
    *   Muestra el asunto de la consulta técnica.
    *   **Estado de Respuesta:** Indicador visual (ej. "En revisión por soporte", "Respuesta lista").
    *   Acciones: "Ver respuesta", "Añadir comentario".

### 3.3. Panel de Accesos Rápidos (Quick Links)
Un menú lateral o bloque de botones tipo *grid* para navegación rápida hacia los módulos clave:
*   **"Ver catálogo"** → Redirige a `SCR-CAT-001` (Vista de categorías/productos).
*   **"Mis cotizaciones"** → Filtra y lista los Formatos Únicos en estado COTIZACIÓN o CONFIRMADO.
*   **"Mis consultas"** → Filtra y lista los Formatos Únicos en estado CONSULTA o RESUELTA.
*   **"Historial de pedidos"** → Lista las órdenes (Orders) en estado CONFIRMADO (MOD-AUT-01).

### 3.4. Sección de Novedades (Cross-Selling)
Al final del Dashboard, se incluye el componente de "Nuevos Productos / Noticias" (el mismo de la vista no autenticada). Esto asegura que el cliente registrado siga expuesto a nuevas tecnologías y hardware disponible en la plataforma.