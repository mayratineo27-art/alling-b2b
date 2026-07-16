import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Cliente HTTP centralizado para todas las peticiones a la API de Alling.
 *
 * CONFIGURACIÓN CLAVE:
 * - baseURL '/backend': Route Handler en src/app/backend/[...path]/route.ts
 *   proxea same-origin /backend/* → BACKEND_API_URL/*. No se usa "/api" como
 *   prefijo porque Vercel tiene manejo especial reservado para ese path
 *   (legado de "Serverless Functions" con archivos sueltos en /api) que
 *   pisa el Route Handler de Next.js y lo convierte en un redirect 308
 *   pelado del prefijo, rompiendo el proxy por completo.
 *   Esto evita CORS y permite que el browser envíe cookies httpOnly automáticamente.
 * - withCredentials: true: Obligatorio para enviar/recibir cookies httpOnly.
 *
 * POLÍTICA DE ERRORES 401:
 * El interceptor NO redirige automáticamente en caso de 401.
 * La razón: el interceptor global no tiene acceso al estado de carga de AuthContext
 * (isLoading). Si redirigiera, lo haría antes de que AuthContext termine de
 * verificar la sesión, creando un bucle de redirección.
 * La redirección es responsabilidad de ProtectedRoute, que SÍ conoce isLoading.
 *
 * @sdd-rf RF-AUT-001 RF-AUT-002 RF-AUT-009
 */
const apiClient = axios.create({
    baseURL: '/backend',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// RF-AUT-009: el access_token (JWT) expira a los 60 min sin refresh, el
// usuario tenía que volver a iniciar sesión aunque hubiera estado activo.
// Antes de rendirse ante un 401, intentamos UNA renovación silenciosa vía
// /auth/refresh (refresh_token httpOnly, 30 días) y reintentamos la
// petición original. No se aplica a los propios endpoints de auth (login/
// google/refresh) para no entrar en loop, ni cambia la política de "no
// redirigir" descrita arriba: si el refresh también falla, simplemente se
// rechaza la promesa como antes.
type RetryableConfig = InternalAxiosRequestConfig & { _retriedAfterRefresh?: boolean };

const AUTH_ENDPOINTS_SIN_REFRESH = ['/auth/refresh', '/auth/login', '/auth/google'];

let refreshEnCurso: Promise<boolean> | null = null;

function esEndpointDeAuthSinRefresh(url?: string): boolean {
    if (!url) return false;
    return AUTH_ENDPOINTS_SIN_REFRESH.some((endpoint) => url.includes(endpoint));
}

async function intentarRenovarSesion(): Promise<boolean> {
    if (!refreshEnCurso) {
        refreshEnCurso = apiClient
            .post('/auth/refresh')
            .then(() => true)
            .catch(() => false)
            .finally(() => {
                refreshEnCurso = null;
            });
    }
    return refreshEnCurso;
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryableConfig | undefined;

        const debeIntentarRefresh =
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retriedAfterRefresh &&
            !esEndpointDeAuthSinRefresh(originalRequest.url);

        if (debeIntentarRefresh && originalRequest) {
            originalRequest._retriedAfterRefresh = true;
            const renovada = await intentarRenovarSesion();
            if (renovada) {
                return apiClient(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;