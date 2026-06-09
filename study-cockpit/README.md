# NEXUS Study Cockpit API

Runtime interno: `SOVERINGBACKEND`.

Este backend convierte los prototipos HTML en una arquitectura backend-first:

```text
Contrato academico -> mision -> intento -> scoring -> telemetria -> calibracion -> proxima mision
```

Regla de oro:

```text
El backend manda. El frontend consume. Gemini asiste. El score se calibra contra nota real.
```

## Que resuelve

Un estudiante elige materia, hace un intento de parcial real o modelo fiel, recibe score por bloques y una proxima mision en minutos.

La metrica norte no es uso ni clicks:

```text
calibration_within_1pt_rate >= 0.70
```

Es decir: el score estimado debe quedar a `+/- 1 punto` de la nota real en al menos `70%` de los casos piloto.

## Arquitectura actual

```text
public/app.js
  -> server.js
    -> src/services/exam-contract-service.js
    -> src/services/attempt-service.js
    -> src/services/mission-engine.js
    -> src/services/telemetry-service.js
    -> src/services/calibration-service.js
    -> src/services/gemini-adaptive-layer.js
    -> src/scoring.js
```

El nucleo determinista funciona sin Gemini.

## Arranque

```powershell
cd SOVERINGBACKEND
node server.js
```

Abrir:

```text
http://127.0.0.1:8788
```

## Tests

Nucleo determinista sin servidor ni LLM:

```powershell
node scripts\core-unit.js
```

Smoke contra API local:

```powershell
node scripts\smoke.js
```

## API

### Sistema

```http
GET /api/health
```

Devuelve estado del runtime, frontera Gemini y regla de arquitectura.

### Materias y contratos

```http
GET /api/subjects
GET /api/subjects/:subjectFolder/contract
```

### Misiones

```http
GET /api/missions/next?subjectId=contabilidad_2p&sessionId=local-demo
```

Devuelve la proxima mision determinista segun evidencia previa.

### Estudio

```http
GET /api/study/plan?subjectId=contabilidad_2p
GET /api/study/block?subjectId=contabilidad_2p&blockId=calculation_entry
```

El plan de Contabilidad vive en backend:

```text
data/subjects/contabilidad_2p/study-map.json
```

Incluye:

- objetivos por bloque;
- teoria minima defendible;
- errores que bajan puntos;
- lenguaje de examen;
- drills;
- respuesta minima.

### Intentos

```http
POST /api/attempts/start
POST /api/attempts/score
```

`/api/attempts/score` emite:

- `answer_submitted`;
- `attempt_scored`;
- `mission_recommended`.

### Nota real y calibracion

```http
POST /api/grades/real
GET  /api/calibration?subjectId=contabilidad_2p
```

`/api/grades/real` emite:

- `real_grade_reported`;
- `calibration_evaluated`.

### Telemetria

```http
GET  /api/events
POST /api/events
```

Filtros disponibles:

```text
subjectId
sessionId
type
limit
```

### Gemini subordinado

```http
POST /api/llm/review
POST /api/llm/config
```

La app puede usar Gemini de dos formas:

1. Variable de entorno:

```powershell
$env:GEMINI_API_KEY="TU_API_KEY"
node server.js
```

2. UI del cockpit:

```text
Gemini -> pegar API key de Google AI Studio -> Guardar Gemini
```

La clave se guarda en:

```text
data/runtime/gemini.secrets.json
```

Ese archivo esta ignorado por git. El frontend no llama a Google ni guarda la clave.

Gemini solo genera feedback conversacional/estructurado. No decide el score final.

## Materias actuales

- `administracion`
- `contabilidad_2p`

## Decision CTO

Los HTML standalone quedan como evidencia y prototipos. La plataforma real debe vivir en:

```text
backend determinista + telemetria + calibracion + PWA + Gemini subordinado
```

No volver a monolitos HTML que reimplementen scoring o display critico.
