# Alling B2B — Plataforma de Comercio Electrónico B2B

Plataforma web para la gestión de kits industriales y cotizaciones, desarrollada bajo un proceso de ingeniería dirigido por especificaciones (**Spec-Driven Development**), con **Scrum** como marco de gestión y **Test-Driven Development** como práctica de construcción.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Pydantic, SQLModel |
| Base de datos | PostgreSQL 15 (Row Level Security) |
| Contrato | OpenAPI 3.1 (`Docs/openapi_real.json`) |
| Pruebas | Pytest, Testcontainers |
| CI/CD | GitHub Actions, gitleaks, Trivy |

## Spec-Driven Development (SDD)

Ninguna funcionalidad se implementa en este repositorio sin una especificación previa que la autorice. La carpeta [`Docs/`](./Docs) es la fuente de verdad del proyecto, estructurada como una cadena de artefactos:
Docs/Módulos/ → Inventario Funcional Maestro (10 módulos, OPS congeladas)
Docs/FASE 2/ → Requisitos derivados: RFs, RNFs, HUs, Casos de Uso, Criterios de Aceptación
Docs/FASE 3/ → Diseño: arquitectura, modelo de dominio, FSM, decisiones (ADR)
Docs/FASE 4_EJECUCION_SCRUM/ → Backlogs de sprint, matrices de trazabilidad, plan TDD


Antes de tocar código en un módulo, revisa su documento correspondiente en `Docs/Módulos/MOD-XXX-01.md` y su fila en `Docs/FASE 4_EJECUCION_SCRUM/MATRIZ_TRAZABILIDAD_GLOBAL.md`. Ningún RF se implementa si no deriva de una OPS ya documentada — si tu cambio no tiene un RF de origen, primero se especifica, luego se codifica.

## Test-Driven Development (TDD)

El ciclo de construcción sigue **RED → GREEN → REFACTOR**: se escribe la prueba que falla contra el criterio de aceptación del RF, se implementa el código mínimo para que pase, y solo entonces se refactoriza.
backend/tests/
├── unit/ # 73 pruebas — lógica de negocio aislada (servicios de dominio)
├── integration/ # 112 pruebas — endpoints reales contra el contrato OpenAPI
└── test_formato_unico_kits.py # 4 pruebas — integración Kits ↔ Formato Único

Ejecutar la suite completa:

```bash
cd backend
pip install -r requirements-dev.txt
pytest -q
Estado conocido: la suite mantiene ~97-98% de aprobación en corridas sucesivas. Un pequeño número de pruebas presenta sensibilidad al orden de ejecución por estado compartido entre fixtures (aíslalas con pytest tests/ruta::nombre_test para confirmar que aprueban individualmente). Este comportamiento está documentado como deuda técnica conocida, no oculta — ver Docs/FASE 4_EJECUCION_SCRUM/MATRIZ_TRAZABILIDAD_GLOBAL.md §5.

Trazabilidad de código
Las funciones críticas incluyen una anotación de comentario @sdd-rf que vincula el código con su requisito de origen, por ejemplo:
# @sdd-rf: RF-FU-005
def generar_cotizacion(formato_unico_id: str):
    ...
Estructura del repositorio
backend/    # API FastAPI
frontend/   # Aplicación Next.js 14
Docs/       # Especificación completa SDD (fuente de verdad del proyecto)
prototypes/ # Wireframes HTML (Mobile First)
.kiro/      # Plan maestro de ejecución adicional (spec nativa del IDE Kiro)

Contribuir
Verifica que tu cambio tenga un RF/RNF de origen en Docs/FASE 2/REQUISITOS_FUNCIONALES.md o REQUISITOS_NO_FUNCIONALES.md. Si no existe, se especifica primero.
Escribe la prueba que falla (RED) antes que el código.
Implementa lo mínimo necesario para pasar la prueba (GREEN).
Refactoriza sin romper la prueba.
Verifica que gitleaks y Trivy pasen antes de abrir el PR.


---

**Nota de verificación:** los conteos de la tabla de pruebas (73 unitarias, 112 integración, 4 en `test_formato_unico_kits.py` = 189 total) se obtuvieron contando directamente las funciones `def test_`/`async def test_` en cada archivo real del repositorio, coincidiendo con el total que `pytest` recolectó en las corridas ya reportadas.
