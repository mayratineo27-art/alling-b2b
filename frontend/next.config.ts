import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin esto, Next.js quita el "/" final de /api/dashboard/ ANTES del proxy
  // (trailingSlash:false por defecto). El backend (FastAPI, redirect_slashes=True)
  // respondía 307 agregando el slash de vuelta, pero con Location apuntando al
  // host real del backend (127.0.0.1:8000) en vez de localhost:3000. El navegador
  // sigue ese redirect como origen distinto y pierde la cookie httpOnly de sesión
  // → 401 en /dashboard//orders pese a tener sesión válida.
  skipTrailingSlashRedirect: true,
  // El proxy same-origin /backend/* -> backend se implementa en
  // src/app/backend/[...path]/route.ts, NO con rewrites(): en Next.js 16
  // desplegado en Vercel, un rewrite a una URL externa se resuelve como
  // redirect 308 en vez de reenviar la petición al backend (confirmado que
  // `next start` local sí proxya bien, así que es una particularidad del
  // builder de Vercel). El Route Handler evita ese problema por completo.
};

export default nextConfig;
