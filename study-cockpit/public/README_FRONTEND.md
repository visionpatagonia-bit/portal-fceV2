# NEXUS Study Cockpit — Frontend

Frontend de producto del Study Cockpit. **Vanilla JS con ES modules, sin build step.** El backend manda: el frontend solo consume la API, nunca reimplementa scoring, contratos ni corrección, y nunca expone API keys.

## Cómo correr

Desde `SOVERINGBACKEND/`:

```powershell
npm start            # node server.js -> http://127.0.0.1:8788
```

El backend sirve `public/` como estático. Abrí `http://127.0.0.1:8788/`.

Para otro puerto: `$env:PORT=8790; node server.js`.

## Probar el flujo completo

1. **Inicio** — valor del producto, estado del backend (online + Gemini), materia activa y próxima acción real.
2. **Materias** — elegí Contabilidad 2P o Administración 2P (objetivo, temas, tipo de examen). "Estudiar esta materia".
3. **Aprender** — secuencia adaptativa + bloque con: qué aprender, por qué importa, cómo aparece en el parcial, error común, mini práctica. Botón "Generar práctica con Gemini" (usa KB o fallback determinista).
4. **Evaluar** — simulador por bloques. "Cargar demo" → "Corregir intento".
   - Contabilidad: definición, V/F justificado, cálculo/asiento, desarrollo, caso.
   - Administración: elegí variante (T1–T4) → asociación, V/F, respuesta corta, desarrollo, caso.
5. **Devolución** — score (donut), barras por bloque, débiles con "Estudiar esta debilidad" / "Generar práctica similar" / "Volver a intentar", y registro de **nota real** (calibración ±1).
6. **Gemini** — estado de la IA, configurar API key (se guarda en backend), feedback conversacional (marcado *generado por IA · no auditado*).
7. **KB** — contenidos guardados con materia/bloque/origen/estado/fecha. Abrir, Reutilizar, Marcar para auditar. No se presentan como canónicos.
8. **Contrato** — fuente de verdad del scoring (totales, familias, bloques, JSON).

Atajos: `Ctrl/Cmd + K` enfoca el buscador; el buscador navega por palabras clave.

## Arquitectura

```
public/
├── index.html              # shell (carga /src/app.js como módulo)
├── styles/                 # tokens.css · base.css · app.css
└── src/
    ├── app.js              # bootstrap: shell, router, loaders cache-aware, navegación delegada
    ├── api.js              # API client (único lugar que conoce los endpoints)
    ├── store.js            # estado reactivo (subscribe/set) + caches
    ├── telemetry.js        # eventos frontend (fire-and-forget)
    ├── router.js           # navegación por hash (#/vista?param=...)
    ├── format.js           # escapeHtml, números, fechas, etiquetas de estado
    ├── components/         # ui.js (helpers + estados) · charts.js · sidebar.js · topbar.js
    └── views/              # inicio · materias · aprender · evaluar · devolucion · gemini · kb · contrato
```

**Separación:** UI (views/components) · estado (store) · datos (api + loaders) están desacoplados. Cada vista expone `render(root, ctx, params)` y se re-renderiza por navegación.

## Endpoints consumidos (reales del backend)

`GET /api/health` · `GET /api/subjects` · `GET /api/subjects/:folder/contract` · `GET /api/study/plan` · `GET /api/study/block` · `POST /api/study/adaptive-sequence` · `POST /api/study/adaptive-content` · `POST /api/attempts/score` · `POST /api/grades/real` · `GET /api/calibration` · `GET /api/kb/adaptive-content` · `GET /api/kb/adaptive-content/:id` · `POST /api/llm/review` · `POST /api/llm/config` · `GET|POST /api/events`.

> El spec mencionaba `POST /api/attempts/correct` y `POST /api/telemetry/events`; el backend real usa `POST /api/attempts/score` y `POST /api/events`. El API client los mapea — no se tocó el backend.

## Telemetría (eventos frontend)

`fe_subject_selected` · `fe_study_started` · `fe_block_completed` · `fe_attempt_started` · `fe_attempt_corrected` · `fe_weakness_detected` · `fe_study_weakness_click` · `fe_gemini_used` · `fe_kb_reused`. Se envían a `POST /api/events` y quedan en la bitácora de telemetría del backend. Métrica norte: calibración score estimado vs nota real (±1 punto en 70% de casos), instrumentada vía `POST /api/grades/real` + `GET /api/calibration`.

## Responsive

Desktop / tablet / mobile. < 960px el sidebar pasa a drawer (hamburguesa + backdrop); grids colapsan a 1 columna; sin overflow horizontal. Estados loading/error/vacío en todas las vistas. Botones e inputs con hover/focus/disabled.

## Notas

- El archivo viejo `public/app.js` y `public/styles.css` quedaron deprecados (no se cargan).
- La API key de Gemini nunca vive en el frontend: se envía a `POST /api/llm/config` y el backend la guarda en su runtime.
