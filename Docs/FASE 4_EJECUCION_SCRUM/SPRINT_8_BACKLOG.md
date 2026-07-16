# 🚀 SPRINT 8: Despliegue a Producción (Serverless Vercel)

| **Métrica** | **Detalle** |
| :--- | :--- |
| **Objetivo del Sprint** | Configurar, automatizar y ejecutar el paso a producción del Frontend y Backend en la plataforma Vercel, cumpliendo con la arquitectura Serverless establecida. |
| **Sprint anterior** | Sprint 7 (Hardening y Pruebas E2E) |
| **Duración estimada** | 1 semana |
| **Marco Arquitectónico** | `DECISIONS.md` (DEC-021) y `ARQUITECTURA.md` (Serverless-First) |

---

## 📌 Contexto y Objetivos

Habiendo asegurado el núcleo transaccional en el Sprint 7 mediante pruebas de integración, el sistema está listo para producción. 
Basándonos en la decisión arquitectónica **DEC-021 (Frontend en Vercel)** y el diseño de **Despliegue Serverless (Vercel Serverless Functions)** para el backend, este Sprint se centrará puramente en habilitar el CI/CD y enlazar las variables de entorno para que el sistema funcione en la nube sin infraestructura que administrar.

---

## 1. Configuración de Backend (FastAPI a Vercel Serverless)

### T8-DEP1 — Configuración del Gateway Serverless (`vercel.json`) ✅ Completado
- **Descripción:** Crear el archivo `backend/vercel.json` configurando el builder `@vercel/python` para empaquetar `app.main:app` como una función Serverless que responde a las rutas API.
- **Justificación:** Vercel necesita saber cómo compilar aplicaciones de Python nativas.
- **DoD:** Archivo creado y compatible con la documentación oficial de Vercel.

### T8-DEP2 — Gestión de Dependencias (Production Ready) ✅ Completado
- **Descripción:** Limpiar `requirements.txt` asegurando que librerías pesadas o de desarrollo (como `testcontainers` o dependencias de tests locales) no inflemos el paquete Serverless superando el límite de 250MB de Vercel.
- **DoD:** El backend logra hacer *Build* en los servidores de Vercel en menos de 3 minutos.

---

## 2. Configuración de Frontend (Next.js)

### T8-DEP3 — Enlace de Variables de Entorno y Rutas ✅ Completado
- **Descripción:** Ajustar el frontend para que apunte a la nueva URL de producción del backend. Si están en el mismo monorepo bajo un solo dominio, configurar un re-write en `next.config.ts` o Vercel routes; de estar separados, inyectar `NEXT_PUBLIC_API_URL`.
- **Referencia:** `DEC-021` estipula la integración nativa y CI/CD automático de Next.js en Vercel.
- **DoD:** El frontend se compila con éxito (`npm run build`) usando ISR/SSG sin romper por falta de conexión al backend.

---

## 3. Seguridad y Base de Datos (Neon/Supabase)

### T8-SEC1 — Inyección de Secretos (Environment Variables)
- **Descripción:** Configurar en el Dashboard de Vercel todas las variables requeridas de producción.
  - `DATABASE_URL` (De Neon/Supabase apuntando a prod, acorde a DEC-022).
  - `JWT_SECRET`, `JWT_ALGORITHM`.
  - `MP_ACCESS_TOKEN` (Mercado Pago).
- **DoD:** Todas las variables de entorno están mapeadas correctamente, eliminando cualquier hardcoding de contraseñas.

### T8-SEC2 — Configuración de CORS y Dominios Aprobados
- **Descripción:** Actualizar `backend/app/main.py` para asegurar que el middleware de CORS acepte peticiones desde el dominio público otorgado por Vercel (ej: `https://tiendred.vercel.app`).
- **DoD:** No existen bloqueos por políticas CORS al intentar hacer *login* o llamadas a la API desde el cliente web productivo.

---

## 📋 Definición de Terminado (DoD) del Sprint 8

1. **Deploy Exitoso:** Las ramas principales de GitHub/GitLab detonan un pipeline automático en Vercel y el build es ✅ `Ready`.
2. **Navegación:** Es posible entrar a la URL pública y realizar el ciclo completo de visualización del Catálogo.
3. **Persistencia:** Al generar un carrito/cotización en producción, los datos se guardan en la DB de Neon/Supabase.
4. **Cumplimiento:** La implementación respeta estrictamente lo documentado en `DECISIONS.md` y `ARQUITECTURA.md`.
