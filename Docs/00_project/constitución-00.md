
# 📜 CONSTITUCIÓN DEL SISTEMA ALLING B2B

**Versión:** 1.0  
**Fecha de creación:** Junio 2026  
**Metodología:** Scrum + Spec-Driven Development (SDD)  
**Stack:** Next.js 14 + FastAPI + PostgreSQL

---

##  1. VISIÓN Y PROPÓSITO

### 1.1 Visión del Producto
*"Ser la plataforma B2B de referencia en Ayacucho para la gestión eficiente de kits industriales, cotizaciones formales y control de stock, eliminando la informalidad tecnológica del comercio industrial local."*

### 1.2 Propósito
Desarrollar un ecosistema digital seguro, trazable y escalable que formalice las transacciones B2B mediante:
- **Especificaciones formales** (SDD) como fuente de verdad
- **Arquitectura Zero Trust** para seguridad empresarial
- **Trazabilidad completa** desde RF hasta código

---

## ️ 2. PRINCIPIOS FUNDAMENTALES

### 2.1 Principios Técnicos
1. **Spec-First:** Todo código debe tener su especificación técnica documentada ANTES de implementar
2. **Zero Trust:** Ningún dato es confiable por defecto; validar siempre
3. **Trazabilidad Obligatoria:** Cada RF → Spec → Código → Test debe estar vinculado
4. **Deuda Técnica Visible:** Las simulaciones y workarounds deben documentarse explícitamente

### 2.2 Principios de Negocio
1. **B2B Formal:** Precios congelados, cotizaciones con vigencia, stock reservado
2. **Seguridad Transaccional:** Idempotencia, HMAC, RLS (Row-Level Security)
3. **Auditabilidad Total:** Todo cambio se registra en `audit_logs`

### 2.3 Principios de Calidad
1. **Cero Simulaciones Ocultas:** Si algo es mock, debe estar documentado
2. **Tests como Contrato:** Los tests de integración validan la spec, no solo el código
3. **OpenAPI es Ley:** El contrato API no se rompe sin actualizar la spec

---

## 👥 3. ROLES Y RESPONSABILIDADES

### 3.1 Roles Scrum Adaptados
| Rol | Responsable | Responsabilidades Clave |
|---|---|---|
| **Product Owner** | Investigador (perspectiva usuario) | Priorizar backlog según valor B2B |
| **Scrum Master** | Investigador (gestión) | Velar por Scrum + SDD, remover impedimentos |
| **Development Team** | Investigador (técnico) | Codificar siguiendo spec, mantener trazabilidad |

### 3.2 Roles Técnicos Transversales
- **Guardián de Spec:** Verificar que todo commit tenga su RF/HU asociado
- **Auditor de Calidad:** Revisar que tests cubran criterios de aceptación
- **Administrador de Deuda:** Mantener actualizado el registro de simulaciones

---

##  4. ACUERDOS DE DESARROLLO

### 4.1 Convenciones de Código
```python
# Backend (FastAPI)
# - Cada endpoint debe citar RF en docstring
# - Validar con Pydantic según openapi_real.json
# - Usar RLS en todas las queries

@app.post("/formatos/{id}/aprobar")
async def aprobar_formato(
    """
    RF-FU-005: Generar cotización
    Spec: ETDR_FORMATO_UNICO_CHECKOUT.md
    """
    formato_id: UUID,
    current_user: User = Depends(get_current_user)
):
    # Implementación...
```

```tsx
// Frontend (Next.js)
// - Componentes con JSDoc trazable
// - Usar @sdd-rf, @sdd-endpoint, @sdd-schema

/**
 * @sdd-rf RF-FU-005
 * @sdd-endpoint POST /formatos/{id}/aprobar
 * @sdd-schema FormatoResponseSchema
 */
export function BannerFSM({ state }: Props) { ... }
```

### 4.2 Convenciones de Commits
```bash
# Formato: type(scope): RF-XXX - descripción
git commit -m "feat(FU): RF-FU-005 - Implementar transición a COTIZACIÓN"
git commit -m "fix(AUTH): RF-AUT-007 - Corregir bucle de login"
git commit -m "docs(SPEC): Actualizar ETDR con estado real"
```

### 4.3 Definición de "Terminado" (DoD)
Una HU/RF se considera **completada** SOLO si:
- ✅ Spec técnica documentada en `ETDR_*.md` o `Módulos/MOD-*.md`
- ✅ Endpoint implementado y documentado en `openapi_real.json`
- ✅ Test de integración creado y pasando en verde
- ✅ Frontend conectado (si aplica) con datos reales
- ✅ Trazabilidad actualizada en `MATRIZ_DE_TRAZABILIDAD.md`
- ✅ Deuda técnica documentada (si hay simulaciones)

---

## 🔧 5. HERRAMIENTAS Y FLUJO DE TRABAJO

### 5.1 Stack Tecnológico Oficial
| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| **Frontend** | Next.js 14 | Latest | RSC, SSR, Mobile First |
| **Backend** | FastAPI | Latest | Async, Pydantic, OpenAPI nativo |
| **Base de Datos** | PostgreSQL | 15+ | RLS, JSONB, ACID |
| **ORM** | SQLModel | Latest | Type-safe, SQLAlchemy base |
| **Auth** | Google OAuth2 + python-jose + bcrypt | Latest | SSO Google (Clientes) + JWT/Bcrypt (Staff) |
| **Testing** | Pytest + HTTPX | Latest | Tests de integración |

### 5.2 Flujo de Desarrollo SDD
```
1. LEER RF/HU en MATRIZ_TRAZABILIDAD_GLOBAL.md
   ↓
2. CREAR/ACTUALIZAR spec en ETDR o Módulos/*.md
   ↓
3. IMPLEMENTAR backend (FastAPI) siguiendo spec
   ↓
4. GENERAR/ACTUALIZAR openapi_real.json
   ↓
5. CREAR test de integración validando spec
   ↓
6. IMPLEMENTAR frontend (Next.js) conectado a API real
   ↓
7. ACTUALIZAR matriz de trazabilidad
   ↓
8. DOCUMENTAR deuda técnica (si aplica)
```

### 5.3 Estructura de Carpetas
```
tiendRed/
├── backend/
│   ├── app/
│   │   ├── api/endpoints/      # Rutas con docstring RF
│   │   ├── services/           # Lógica de negocio
│   │   ├── models/             # SQLModel + RLS
│   │   ── security/           # JWT, HMAC, MFA
│   └── tests/integration/      # Tests por RF
── frontend/
│   ├── src/
│   │   ├── components/         # Con JSDoc @sdd-rf
│   │   ├── app/                # Next.js 14 App Router
│   │   └── lib/api.ts          # Axios con withCredentials
── Docs/
│   ├── 00_project/
│   │   ├── business_rules.yaml.md
│   │   └── rbac_policy.md
│   ├── FASE_2/                 # RF, HU, CA
│   ├── FASE_3/                 # Arquitectura, BD, FSM
│   ├── FASE_4_EJECUCION_SCRUM/
│   │   ├── MATRIZ_TRAZABILIDAD_GLOBAL.md
│   │   └── PROMPTS_LOG.md
│   ├── Módulos/
│   │   ── MOD-FU-01.md, MOD-CAT-01.md, etc.
│   ├── ETDR_FORMATO_UNICO_CHECKOUT.md
│   └── openapi_real.json
```

---

## 📊 6. MÉTRICAS Y GOBERNANZA

### 6.1 Métricas de Calidad SDD
| Métrica | Objetivo | Cómo Medir |
|---|---|---|
| **Cobertura de Trazabilidad** | 100% RFs con spec | Contar RFs en matriz con spec vinculada |
| **Conformidad Spec-Código** | ≥95% | Auditoría automática vs openapi_real.json |
| **Tests de Integración** | 100% RFs críticos | Pytest coverage report |
| **Deuda Técnica Documentada** | 100% visible | Revisar sección "Deuda Técnica" en ETDR |

### 6.2 Revisiones Periódicas
- **Daily Scrum:** 15 min - ¿Qué spec implementé ayer? ¿Qué spec implementaré hoy?
- **Sprint Review:** Validar que cada HU cumpla DoD SDD
- **Sprint Retrospective:** ¿Qué práctica SDD podemos mejorar?
- **Auditoría Quincenal:** Revisar consistencia matriz ↔ código ↔ openapi

---

## ⚠️ 7. POLÍTICAS DE EXCEPCIÓN

### 7.1 Cuándo Permitir Simulaciones
Solo se permite simular SI:
1. El endpoint backend NO existe aún
2. La simulación está documentada en `ETDR_*.md` como `[PENDIENTE]`
3. Hay un ticket creado para implementar lo real
4. La simulación NO expone datos sensibles

### 7.2 Proceso para Romper Spec
Si es necesario cambiar la spec:
1. Actualizar `business_rules.yaml.md` o `Módulos/*.md`
2. Regenerar `openapi_real.json`
3. Actualizar tests
4. Documentar cambio en `PROMPTS_LOG.md`
5. **NUNCA** cambiar código sin actualizar spec primero

---

## 🎓 8. COMPROMISO ACADÉMICO

Como investigador único del proyecto Alling B2B, me comprometo a:

1. **Mantener la integridad SDD:** No sacrificar trazabilidad por velocidad
2. **Documentar honestamente:** Reconocer simulaciones y deuda técnica
3. **Validar rigurosamente:** Tests primero, código después
4. **Entregar valor real:** MVP funcional, no solo documentación
5. **Aprender continuamente:** Adaptar SDD a la realidad del proyecto

---

## ✅ 9. ACEPTACIÓN

**Firma del Investigador:** ___________________________  
**Fecha:** ___/___/2026  
**Versión:** 1.0

*"Esta constitución no es un documento estático; evolucionará con el proyecto mediante retrospectivas y actualizaciones controladas."*

---

## 📎 ANEXOS

- Anexo A: Checklist de DoD SDD
- Anexo B: Plantilla de Spec Técnica (ETDR)
- Anexo C: Guía de Commits Convencionales
- Anexo D: Matriz de Roles Scrum Detallada

---