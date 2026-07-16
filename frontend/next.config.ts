import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // Sin esto, Next.js quita el "/" final de /api/dashboard/ ANTES del rewrite
  // (trailingSlash:false por defecto). El backend (FastAPI, redirect_slashes=True)
  // responde 307 agregando el slash de vuelta, pero con Location apuntando al
  // host real del backend (127.0.0.1:8000) en vez de localhost:3000. El navegador
  // sigue ese redirect como origen distinto y pierde la cookie httpOnly de sesión
  // → 401 en /dashboard//orders pese a tener sesión válida.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    // Proxy same-origin: el browser llama a /api/* en localhost:3000
    // y Next.js lo redirige internamente a backendUrl
    // Resultado: cookies son same-origin → no hay CORS → httpOnly funciona perfecto.
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
