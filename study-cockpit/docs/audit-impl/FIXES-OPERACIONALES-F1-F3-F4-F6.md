# Mini-informe · Fixes del adendum operacional (F1, F3, F4, F6)

Responde al `ADENDUM-OPERACIONAL-2026-06-11.md`. Se aplicaron los de "Ahora + Gates"; F2/F5/F7 quedan como Ola 0 (pre-beta paga).

## F1 (CRÍTICO) — Persistencia durable del learner model (mata la amnesia)
- `learner-model-service.js` ahora persiste **Firestore-or-local** (mismo patrón que el attempt store): si está `FIREBASE_SERVICE_ACCOUNT`, guarda P(L) en Firestore (`cockpit_learner_model/<sessionId>`); si no, archivo local + cache. Métodos `update/mastery/weakest` pasaron a **async** y `update()` **carga el estado previo antes de actualizar** → tras un sleep/restart de Render sigue acumulando en vez de cold-start.
- `server.js`: el update se llama `.catch()` (fire-and-forget async); el endpoint hace `await`.
- **ACCIÓN DE INFRA PENDIENTE (vos):** para que sea durable en producción hay que setear **`FIREBASE_SERVICE_ACCOUNT`** (JSON del service account) en las env vars de Render. Sin eso, degrada limpio a local efímero (sigue andando, pero se resetea al dormir). Verificable: `GET /api/learner-model` devuelve `persistence: "firestore"` cuando está bien configurado.

## F3 (ALTO) — Umbral de muestra para los flags psicométricos
- `/api/analytics/difficulty`: los flags (`discriminacion_baja/negativa`, `demasiado_facil/dificil`) solo se emiten con **n ≥ 30** (`reliable`); cada ítem trae `n`, `reliable` y `autoDecisionReady` (n ≥ 100). Regla documentada en la respuesta: #5/#12/#13 NO deben tomar decisiones automáticas hasta `autoDecisionReady`. Evita falsos positivos con la base chica actual.

## F4 (ALTO) — P(L) ordinal, no porcentaje mostrado
- El learner model expone **`band`** ('dominado'/'en progreso'/'flojo') por bloque; el endpoint agrega `weakestLabel` ("tu bloque más débil es X") + un `caveat` explícito: el % es ordinal (para priorizar), NO una promesa de dominio hasta calibrar params BKT con cohorte real. La UI debe usar band/orden, nunca el número.

## F6 (BAJO) — Consistencia documental
- `00-CONSOLIDADO` actualizado a **5/15** (agrega #1 y #3 a la tabla de "implementado", saca de pendientes). Sin contradicciones internas.

**Verificación:** `node --check` OK; core-unit **8.64** + validate 4/4; learner-model async probado (mastery con band, weakest por déficit, fallback local sin Firestore). Regla de oro intacta.

**Estado addendum:** F1 (código ✅ + infra pendiente), F3 ✅, F4 ✅, F6 ✅ · F2/F5/F7 = Ola 0 (proceso/infra/auth, pre-beta paga).
