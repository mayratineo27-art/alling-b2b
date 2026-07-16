import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 50, // 50 Virtual Users concurrentes
    duration: '30s',
    thresholds: {
        // RNF-PERF-001: El 95% de las peticiones debe completarse en menos de 300ms
        http_req_duration: ['p(95)<300'],
        // Garantizar que no haya más de 1% de errores
        http_req_failed: ['rate<0.01']
    },
};

export default function () {
    // Simulamos la búsqueda en el catálogo con 3 filtros
    // Endpoint: GET /productos/?category=electronica&min_price=100&max_price=500
    const url = 'http://127.0.0.1:8000/productos/?categoria=Herramientas&min_price=10&max_price=1000';

    const res = http.get(url, {
        tags: { name: 'CatalogSearch' }
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response contains data': (r) => {
            try {
                const body = r.json();
                return Array.isArray(body) || body.hasOwnProperty('items');
            } catch (e) {
                return false;
            }
        },
    });

    sleep(1);
}
