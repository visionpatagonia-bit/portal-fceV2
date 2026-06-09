# Informe — Refactor de UX del NEXUS Study Cockpit

**Fecha:** 2026-06-08
**Alcance:** reescritura completa del frontend del Study Cockpit + habilitación de Administración en backend para soportarlo.
**Ubicación del trabajo:** copia entregable `NEXUS_STUDY_COCKPIT_APP/SOVERINGBACKEND/` (la copia original `portal_v19.3.0` no fue tocada; puede sincronizarse).

---

## 1. Punto de partida

El frontend original era un **monolito**: un solo `app.js` (~970 líneas) + `styles.css` (~1950 líneas) + `index.html` con todo el markup estático embebido. Problemas detectados:

- Dashboard con **datos falsos** (notas y calendario mockup hardcodeados).
- App **clavada a Contabilidad** (Administración aparecía pero no se podía estudiar ni evaluar).
- Identidad de usuario y formulario de examen **hardcodeados** en HTML.
- Sin estados de carga/error/vacío reales; errores crudos inline.
- Re-render total con `innerHTML`, sin separación de capas.

---

## 2. Habilitación previa (backend) para que el UX funcione de verdad

Para cumplir "el estudiante puede elegir **cualquiera** de las dos materias y completar el flujo", primero se habilitó Administración en el backend (sin reimplementar lógica en el front):

- `data/subjects/administracion/study-map.json` — 5 bloques de contenido de estudio (A–E).
- `src/scoring.js` → `scoreAdministracionAttempt`: opción múltiple corregida contra la **clave del contrato** + texto por términos del concepto (`ADMIN_FAMILY_TERMS` según `conceptFamily`).
- `src/services/attempt-service.js` pasa el contrato al scorer.
- `mission-engine` y `adaptive-sequence-service` ya eran genéricos.
- **Verificado por endpoints:** intento bueno 10/10, malo 0/10, parcial → misión "Reentrenar …" correcta, secuencia adaptativa con `weakness_priority`, y **regresión de Contabilidad intacta (8.64)**.
- `scripts/core-unit.js` ampliado para cubrir ambas materias.

---

## 3. Arquitectura del nuevo frontend (componentizado, sin build)

ES modules nativos servidos como estáticos — listo para migrar al Portal/Vercel como cliente.

```
public/
├── index.html              # shell + favicon, carga /src/app.js como módulo
├── styles/                 # tokens.css · base.css · app.css (separados)
└── src/
    ├── app.js              # bootstrap: shell, router, loaders cache-aware, navegación delegada
    ├── api.js              # API client — único lugar que conoce los endpoints
    ├── store.js            # estado reactivo (subscribe/set) + caches
    ├── telemetry.js        # eventos frontend (fire-and-forget)
    ├── router.js           # navegación por hash con params (#/aprender?block=…)
    ├── format.js           # escapeHtml, números, fechas, etiquetas de estado
    ├── components/         # ui.js · charts.js · sidebar.js · topbar.js · logo.js
    └── views/              # inicio · materias · aprender · evaluar · devolucion · gemini · kb · contrato
```

**Separación de capas:** UI (views/components) · estado (store) · datos (api + loaders) desacoplados. Cada vista expone `render(root, ctx, params)` y se re-renderiza por navegación. El API client **mapea los endpoints reales** del backend:

> El spec mencionaba `POST /api/attempts/correct` y `POST /api/telemetry/events`; el backend real usa `POST /api/attempts/score` y `POST /api/events`. El cliente los mapea — no se tocó el backend.

Endpoints consumidos: `GET /api/health` · `GET /api/subjects` · `GET /api/subjects/:folder/contract` · `GET /api/study/plan` · `GET /api/study/block` · `POST /api/study/adaptive-sequence` · `POST /api/study/adaptive-content` · `POST /api/attempts/score` · `POST /api/grades/real` · `GET /api/calibration` · `GET /api/kb/adaptive-content` · `GET /api/kb/adaptive-content/:id` · `POST /api/llm/review` · `POST /api/llm/config` · `GET|POST /api/events`.

---

## 4. El flujo de producto (las 8 vistas)

| Vista | Qué resuelve en UX |
|-------|--------------------|
| **Inicio** | Dashboard con **datos reales**: valor del producto en una frase, estado del backend, score estimado, bloques, materias, próxima acción recomendada (secuencia adaptativa), mis materias, actividad reciente. Sin notas/calendario falsos. |
| **Materias** | Selección con objetivo, temas (familias de conceptos) y tipo de examen reales del contrato. |
| **Aprender** | Secuencia adaptativa de 7 pasos + bloque con: qué aprender, por qué importa, cómo aparece en el parcial, error común, mini práctica. "Generar práctica con Gemini" (usa KB o fallback determinista). |
| **Evaluar** | Simulador por bloques **adaptativo por materia**: Contabilidad (definición/VF/cálculo/desarrollo/caso) y Administración (variante T1–T4 → asociación/VF/corta/desarrollo/caso). Demo + corregir. |
| **Devolución** | Score (donut), barras por bloque, débiles con **"Estudiar esta debilidad" / "Generar práctica similar" / "Volver a intentar"**, y registro de nota real → calibración ±1. |
| **Gemini** | Estado de la IA, configurar key (se guarda en backend, nunca en el front), feedback marcado *generado por IA · no auditado*. |
| **KB** | Contenidos guardados con materia/bloque/origen/estado/fecha. Abrir, reutilizar, marcar para auditar. No se presentan como canónicos. |
| **Contrato** | Fuente de verdad del scoring (totales, familias, bloques, JSON). |

---

## 5. Mejoras de UX concretas

- **El estudiante nunca queda sin próximo paso:** la devolución redirige al bloque exacto que más le baja la nota (cierre del loop estudiar→rendir→reforzar).
- **Estados loading/error/vacío** en todas las vistas (spinners, errores con reintento, vacíos accionables).
- **Feedback inmediato:** toasts después de corregir, guardar y generar.
- **Responsive real** desktop/tablet/mobile: sidebar → drawer off-canvas con backdrop (<960px), grids a 1 columna, **sin overflow horizontal**.
- **Accesibilidad:** `aria-current` en nav, `aria-label`s, foco visible, `Ctrl/Cmd+K` enfoca el buscador.
- **Honestidad de datos:** todo viene del backend; nada inventado.
- **Telemetría instrumentada:** `fe_subject_selected`, `fe_study_started`, `fe_block_completed`, `fe_attempt_started`, `fe_attempt_corrected`, `fe_weakness_detected`, `fe_study_weakness_click`, `fe_gemini_used`, `fe_kb_reused` → métrica norte de calibración (score estimado vs nota real, ±1 en 70% de casos).

---

## 6. Design system y marca

- **Tokens CSS** (colores, spacing, radius, sombras, glows) centralizados en `styles/tokens.css`.
- Estética dark neón premium; **sin cards anidadas** (se usan `tiles` planas dentro de cards), jerarquía clara, charts livianos (donut por conic-gradient, barras, sparkline en SVG).
- **Logo NEXUS** recreado como **SVG escalable** (cubos isométricos azul→cyan con N y glifos `</> {}`) en `components/logo.js`, aplicado en la marca del sidebar + `public/favicon.svg` (se agregó MIME `.svg` en `server.js`). Se mantuvo la UI magenta por decisión del usuario.

---

## 7. Fix del topbar (buscador + selector de materia)

**Diagnóstico (medido en vivo):** el buscador colapsaba a 26px (solo el ícono) y su `Ctrl K` se desbordaba montándose sobre el selector. Causa: dos elementos `flex:1` (buscador + un spacer) competían con chips + selector + usuario, dejando al buscador sin ancho; su grilla desbordaba y el `kbd` se salía de la caja.

**Correcciones:**
1. Buscador con `min-width: 184px`, `flex: 1 1 240px` y `overflow: hidden`; columna del input `minmax(0, 1fr)`.
2. Eliminado el `spacer` redundante; selector empujado con `margin-left: auto`.
3. Selector con ancho controlado (150–220px), padding para la flecha, `ellipsis` y estados hover/focus.
4. Breakpoint ≤1180px: se ocultan chips de estado y `Ctrl K` antes de que apriete (el estado del backend sigue visible en el hero de Inicio).

**Verificado sin solapamiento a 1280 / 961 / 800px** (buscador pasó de 26px → ~306–414px usable).

---

## 8. Verificación (navegador real)

- Flujo completo de **ambas materias** evaluar→corregir→devolución (Contabilidad 8.64, Administración 10/10).
- Calibración ±1 (estimado vs nota real) funcionando (registro 9.5 → dentro de ±1, tasa 100%).
- Generación adaptativa con fallback determinista + guardado en KB.
- Responsive desktop + mobile con drawer abriendo/cerrando.
- **Cero errores de consola.**

---

## 9. Cómo correr

Desde `SOVERINGBACKEND/`:

```powershell
npm start            # node server.js -> http://127.0.0.1:8788
```

El backend sirve `public/` como estático. Para otro puerto: `$env:PORT=8790; node server.js`.

---

## 10. Pendientes opcionales

- **Sincronizar todo a la copia original** (`portal_v19.3.0`): frontend nuevo + backend Administración + logo (hoy la original tiene el frontend viejo).
- Microinteracciones extra, logo en el hero/splash.
- Migración de persistencia local a Firestore + Firebase Auth + deploy en Vercel.

---

*Documentos relacionados: `public/README_FRONTEND.md` (cómo probar el flujo), `NEXUS_STUDY_COCKPIT_CIERRE_MVP_2026-06-07.md` (cierre del MVP backend).*
