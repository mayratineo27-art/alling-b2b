import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy same-origin /backend/* -> backend real, implementado como Route Handler.
 *
 * Reemplaza al rewrite de next.config.ts: en Next.js 16 desplegado en Vercel,
 * un rewrite hacia una URL externa termina resolviéndose como un redirect 308
 * en vez de reenviar la petición al backend (confirmado: `next start` local
 * sí proxya bien, así que es una particularidad del builder de Vercel).
 *
 * IMPORTANTE: no usar `redirect: "manual"` en el fetch interno. Con esa
 * opción, el runtime serverless de Vercel para Next.js 16 devuelve un 308
 * pelado (Location sin el prefijo de la ruta) en vez de la respuesta real
 * del backend, incluso cuando el backend NO redirige (confirmado con
 * pruebas aisladas variando nombre de carpeta y métodos exportados: el
 * único factor que reproducía el bug era `redirect: "manual"`).
 */
const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

async function proxy(request: NextRequest, path: string[]) {
  const targetUrl = new URL(`${BACKEND_URL}/${path.join("/")}`);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const backendResponse = await fetch(targetUrl, init);

  const responseHeaders = new Headers(backendResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  return proxy(request, (await params).path);
}
export async function POST(request: NextRequest, { params }: RouteContext) {
  return proxy(request, (await params).path);
}
export async function PUT(request: NextRequest, { params }: RouteContext) {
  return proxy(request, (await params).path);
}
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return proxy(request, (await params).path);
}
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return proxy(request, (await params).path);
}
