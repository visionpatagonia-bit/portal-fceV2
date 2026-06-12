# Mini-informe · Director de Vuelo V1 (flight-plan) + puente identity

## Director de Vuelo V1 — `GET /api/flight-plan`
**Qué:** "Plan de esta noche". Dado `subjectId`, `minutes` (presupuesto), `examDate` y `sessionId`, reparte los minutos entre los bloques.

**Algoritmo (determinista, NO toca notas):**
- `need(bloque) = (1 − P(L)) × examWeight × prioridad` — P(L) del BKT (#3); si el alumno no rindió ese bloque, P(L)=0.25 (necesita estudio).
- Reparto proporcional al `need`, **capado en `studyMinutes`** (study-map). Los bloques **`dominado`** (band) se capan en **≤10 min (mantenimiento)** → liberan presupuesto para los flojos.
- Garantía dura: **`sum(minutos) ≤ budget`**.
- Devuelve `plan[]` ordenado por need (lo más flojo/pesado primero) con `{blockId, minutes, band, pL, reason}`, `headline`, `daysLeft`.

**Consume señales ya live:** learner-model (`mastery`/`weakest`) + study-map (`studyMinutes`/`examWeight`/`priority`).

**Verificación CONTRA PROD (vía deploy.sh VERDE @ 7efe4b2e):**
- `?subjectId=administracion&examDate=2026-06-16&minutes=120` → 5 bloques, **total 110 ≤ 120 ✓**.
- Con datos (matching flojo) → **matching #1** (band flojo, minutos máx), dominados a 10 min, total 76 ≤ 120.

**Slug real confirmado:** Administración = **`administracion`** (= contabilidad_2p para Contabilidad).

## Mini-tarea identity (puente auth futura, sin construir auth)
- **a)** learner-model docs ahora incluyen `_sessionId` + `_subjects` (queryables) — además attempts ya llevan subjectId+sessionId.
- **b)** `identity-service` (Firestore-or-local) + colección **`identity_links {sessionId, uid:null, sessionIds[], createdAt, updatedAt}`** + endpoints `POST /api/identity/link` y `GET /api/identity?sessionId`. Esquema documentado en el service. Anónimo (uid:null) hasta que exista login.
- **c)** opcional "usar esta sesión en otro dispositivo": `link` ya acepta `linkSessionId` para agrupar sesiones; el botón de UI queda para después.

**Regla de oro / gobernanza:** todo determinista o de organización; sin datos personales; el motor sigue siendo el único juez. **Verificado:** core-unit 8.64 + validate 4/4 + E2E PROD.

**Pendiente V1:** la **card "Plan de esta noche"** en el frontend (inicio.js) que renderiza `/api/flight-plan`. El endpoint (criterio de éxito CTO) ya está live y verificado.
