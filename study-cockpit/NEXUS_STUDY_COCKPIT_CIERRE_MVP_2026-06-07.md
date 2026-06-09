# NEXUS Study Cockpit - Cierre MVP operativo

Fecha: 2026-06-07

## Valor para el estudiante

Un estudiante entra, elige materia, sigue una ruta guiada, estudia un bloque, genera practica adaptativa, resuelve un intento de examen real y recibe una devolucion con score y proximo foco en minutos.

El objetivo no es que dependa del sistema. El objetivo es que aprenda a detectar sus huecos, estudiar menos contenido irrelevante y calibrar mejor su nota antes del parcial o recuperatorio.

## Estado actual

El MVP local esta operativo en:

```txt
http://127.0.0.1:8788/
```

Incluye:

- Frontend cockpit responsive.
- Backend determinista.
- Contratos de examen por materia.
- Plan de estudio por bloques.
- Secuencia adaptativa guiada.
- Corrector/scoring determinista.
- Gemini backend-only para feedback y variacion.
- KB local de contenido adaptativo reutilizable.
- Telemetria local de eventos.

## Flujo de uso

1. Entrar al cockpit.
2. Elegir materia.
3. Leer la Guia del simulador.
4. Abrir Estudio.
5. Leer minimo defendible del bloque.
6. Generar entrenamiento Gemini si hace falta.
7. Resolver intento.
8. Corregir.
9. Leer devolucion.
10. Reentrenar bloque recomendado.
11. Repetir simulacro.
12. Registrar nota real cuando exista para calibracion.

## Arquitectura

```txt
Frontend
  consume API
  no calcula score
  no decide secuencia

Backend determinista
  contrato de examen
  plan de estudio
  secuencia adaptativa
  scoring
  telemetria
  calibracion

Gemini
  feedback conversacional
  microclase adaptativa
  ejercicios nuevos
  no decide nota final

KB adaptativa
  guarda contenido generado
  reutiliza por huella pedagogica
  evita llamar dos veces al LLM para el mismo hueco
```

## Regla de autoridad

```txt
Score final: backend determinista
Secuencia: backend determinista
Contenido variable: Gemini
Reutilizacion: KB
Display: frontend
```

El frontend nunca debe reimplementar scoring ni decidir la ruta por su cuenta.

## Endpoints principales

```txt
GET  /api/health
GET  /api/subjects
GET  /api/study/plan
GET  /api/study/block
POST /api/study/adaptive-sequence
POST /api/study/adaptive-content
POST /api/attempts/score
POST /api/llm/review
GET  /api/kb/adaptive-content
GET  /api/kb/adaptive-content/:entryId
GET  /api/events
GET  /api/calibration
```

## KB adaptativa

Ubicacion:

```txt
data/kb/adaptive-content/index.json
data/kb/adaptive-content/entries/*.json
```

La KB usa esta huella:

```txt
subjectId + blockId + mode + targetMisses
```

La KB no guarda:

- API keys.
- Respuestas completas del estudiante.
- Secrets runtime.

Cada entrada generada por Gemini queda como:

```txt
generated_unreviewed
```

Eso significa que es reutilizable para entrenar, pero no canonico hasta auditarlo contra contrato y materia.

## Materiales actuales

Materias detectadas por el cockpit:

- Contabilidad 2P.
- Administracion 2P.

Contabilidad tiene foco operativo urgente:

- definiciones escritas,
- verdadero/falso justificado,
- calculo/asiento,
- auditoria/control,
- caso integrador.

Administracion queda disponible para prueba comparativa del producto y validacion del flujo general.

## Pruebas realizadas

```txt
node -c server.js
node -c public/app.js
node -c src/services/adaptive-content-kb-service.js
node scripts/core-unit.js
```

Resultado nucleo:

```json
{
  "ok": true,
  "deterministicScore": 8.64,
  "firstMission": "diagnostic",
  "nextMission": "full_simulation",
  "calibrationWithin1ptRate": 1
}
```

Validaciones manuales:

- UI carga.
- Guia del simulador aparece.
- Estudio abre bloques.
- Intento corrige.
- Devolucion redirige.
- Gemini genera contenido.
- KB guarda contenido.
- Segunda solicitud equivalente reutiliza KB.

## Pendiente antes de producto real

1. Probar con usuarios reales.
2. Registrar nota real para calibracion.
3. Auditar entradas KB generadas por Gemini.
4. Migrar persistencia local a Firestore.
5. Integrar Firebase Auth Google del portal.
6. Mover API local a Vercel Functions o backend dedicado.
7. Configurar Gemini como server-side env var.
8. Excluir service worker de rutas `/api/*`.

## Criterio de exito piloto

Metrica norte:

```txt
Score estimado dentro de +/-1 punto de la nota real en 70% de casos piloto.
```

Metricas secundarias:

- El alumno entiende que hacer sin explicacion externa.
- El alumno usa la devolucion para reentrenar un bloque concreto.
- La KB reduce llamadas repetidas a Gemini.
- La guia no genera friccion en mobile.

## Proximo paso recomendado

Usar esta version para estudiar Contabilidad y Administracion. Durante la prueba, registrar:

- que bloque estudiaste,
- score estimado,
- si Gemini ayudo,
- si la guia fue clara,
- que contenido KB se reutilizo,
- nota real cuando exista.

Despues de esa prueba, migrar al portal Vercel con Firebase Auth y Firestore.
