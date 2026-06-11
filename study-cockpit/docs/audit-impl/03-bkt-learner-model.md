# Mini-informe · #3 — Bayesian Knowledge Tracing (modelo del alumno) + ruteo por déficit

**Principio:** BKT (Corbett & Anderson 1995), el modelo de los Cognitive Tutors. Estima la probabilidad de DOMINIO P(L) por knowledge-component y la actualiza con cada observación con p(slip)/p(guess)/p(transit), distinguiendo "tuvo un mal día" de "no domina".

**Problema:** el ruteo usaba `weaknesses[0]` del ÚLTIMO intento (sin memoria) y la progresión un umbral de nota sobre un único intento ruidoso. No había estado de dominio latente.

**Cambio (backend, NO toca la nota):**
- Nuevo **`learner-model-service.js`**: KC = bloque del contrato. Cada `itemResult` que emite el motor (#1) es una **observación BKT** (correcto si score01≥0.6). `bktUpdate` aplica la fórmula estándar (posterior por slip/guess + transición de aprendizaje). Persiste anónimo por sessionId (file local + cache; FS efímero → cae a cache).
- API: `update()` (se llama tras cada corrección en el flujo de score), `mastery()` (P(L) por bloque), `weakest()` (KCs ordenados por **(1 − P(L)) · examWeight** = déficit de dominio ponderado por peso de examen).
- Wiring: `learnerModel.update()` en `handleScoreAttempt`; nuevo endpoint **`GET /api/learner-model?sessionId&subjectId`** → mastery + weakest (con examWeights = points del contrato).

**Verificación:** unit: 4 aciertos → P(L) 0.66→0.91→0.98→0.997; 1 fallo tras dominio → 0.977 (robusto al slip). E2E HTTP: 2 intentos → P(L) por bloque, `weakest[0]` = el bloque de menor dominio × peso. core-unit 8.64 + syntax OK.

**Estado del ruteo:** `weakest()` ES el ranking por déficit (lo que pedía la auditoría), ya expuesto por el endpoint para que Aprender/adaptive-review lo consuma. Rewire fino de `mission-engine.fromScore`/`chooseTargetBlock` para consumirlo en vivo = paso aditivo siguiente (mismo contrato de salida).

**Regla de oro:** intacta — P(L) estima dominio para guiar QUÉ repasar; el motor sigue siendo el único juez de la nota. **Impacto:** alto · **Esfuerzo:** M-L · **Estado:** ✅ core hecho (BKT + persistencia + endpoint); rewire de ruteo en vivo pendiente.
