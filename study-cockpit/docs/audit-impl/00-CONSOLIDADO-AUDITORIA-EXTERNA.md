# Consolidado para auditoría externa — Implementación de mejoras cognitivas (2026-06-11)

## Resumen ejecutivo
Tras la auditoría de 7 lentes (`AUDITORIA_COGNITIVA_2026-06-11.md`), se implementaron y **deployaron a producción** los cambios de **mayor ROI y menor riesgo** (los que reutilizan señal existente sin tocar el motor). Quedan specados los 12 restantes —de naturaleza *service-level* (modelos del alumno, psicometría)— para sucesivas olas.

**Garantía arquitectónica transversal (verificada en cada cambio):** el **motor determinista es la única autoridad de la nota**; toda mejora metacognitiva/IA es **advisory** y nunca altera el score. `core-unit` (demo 8.64) y `validate` (4 materias) intactos.

**Deploy:** todo en Render (`nexus-study-cockpit`, branch `feat/study-cockpit`) vía deploy hook; cada feature es un commit atómico con su mini-informe en `docs/audit-impl/`.

---

## A. Implementado, verificado y LIVE (5/15)

| # | Cambio | Principio | Archivos | Verificación | Commit |
|---|--------|-----------|----------|--------------|--------|
| **4** | Diagnóstico con **juicio antes de revelar** + persistencia | testing effect / hindsight bias | `diagnostico.js` | reveal bloqueado hasta marcar; persiste en localStorage; `node --check` OK | `feat(cognitivo #4)` |
| **10** | **Predicción de nota** (autopredecir_nota) en modos duros + delta de calibración | mastery-monitoring | `evaluar.js`, `devolucion.js` | predicción ignorada por el motor; delta vs `notaEstimada`; sintaxis OK | `feat(cognitivo #10)` |
| **7** | **SRS adaptativo half-life (FSRS-lite)** reemplaza Leitner fijo | FSRS / HLR (Duolingo) / SM-2 | `progress.js` | test: éxito 2.5→6.4→16.5 d, lapso colapsa a 4.3 d, recupera 10→26 d | `feat(cognitivo #7)` |
| **1** | **Matriz persona-ítem** (itemResults por grader) + p-value/discriminación | Teoría Clásica de Tests | `scoring.js`, `cockpit-attempt-store`, `server.js` | E2E: 25 ítems con stats; flags correctos; 8.64 intacto | `feat(cognitivo #1)` |
| **3** | **BKT learner-model** (P(L) por bloque) + ruteo por déficit + endpoint | Bayesian Knowledge Tracing | `learner-model-service.js`, `server.js` | E2E: P(L) 0.66→0.997, weakest por déficit×peso | `feat(cognitivo #3)` |

Las cinco respetan la regla de oro; #1/#3 son aditivas (no cambian la nota). **F1 aplicado:** el learner-model persiste Firestore-or-local (durable si `FIREBASE_SERVICE_ACCOUNT` está seteada). **F3/F4 aplicados:** flags psicométricos gateados por n; P(L) ordinal (band, no %).

---

## B. Pendientes — spec de implementación (10/15 + foto)
> ✅ #1 y #3 ya implementados (ver sección A). Quedan #2, #5, #6, #9, #11, #12, #13, #14, #15, #16.

> Orden por ROI. Cada ítem indica **qué, dónde, esfuerzo, dependencias y riesgo** para evaluación externa.

### Ola 1 (quick wins restantes)
- **#1 ✅ HECHO** — itemResults por grader + p-value/discriminación en `/api/analytics/difficulty` (ver sección A).
- **#2 · JOL: confianza por bloque antes de corregir** — *M.* Slider de confianza por bloque (en `render-blocks.js` para modalidades data-driven; en forms custom de Admin/Contab por separado), recolectado en paralelo a `answers`, IGNORADO por el motor, contrastado en Devolución (confianza vs points). Nota: #10 ya cubre la versión *global*; #2 es la granularidad por-bloque. Riesgo: bajo; fricción de UI media.

### Ola 2 (estructural · de reglas a modelos)
- **#3 ✅ HECHO** — `learner-model-service` (BKT, P(L) por bloque, persistencia durable F1) + endpoint `GET /api/learner-model` (mastery + weakest por déficit). Pendiente fino: rewire de `mission-engine`/`adaptive-sequence` para consumir `weakest()` en vivo (aditivo, mismo contrato de salida).
- **#5 · Gatekeeping psicométrico de ítems de IA** — *M.* Sobre #1: filtrar variantes generadas por Gemini con discriminación <0.2 / punto-biserial negativo antes de promoverlas al banco. Depende de #1.
- **#6 · Self-explanation gate (ICAP)** — *M.* En `devolucion.js` (failCard): antes de revelar la respuesta modelo, exigir "¿por qué falló?"; el texto va a un nuevo `gemini.selfExplanationCheck` (advisory, no puntúa) + endpoint. Sin IA, exige >10 chars para desbloquear.
- **#9 · Micro-retest dirigido al error** — *M.* Tras remediar un gap, encolar micro-quiz de 1-2 ítems sobre ese `misconceptionId` (reusa questions-kb + confusablePairs), separado del SRS por bloque; registrar tasa error→acierto.
- **#11 · Theta/SEM + mastery-gating con incertidumbre** — *M (depende de #1, #12).* `AbilityService` que estime theta EAP + SEM; el gate de promoción pasa de `total>=8` a `(nota - SEM) >= umbral`.

### Ola 3 (apuestas pesadas)
- **#12 · Calibrar dificultad b (Rasch/1PL)** — *L.* Job offline (`scripts/`) que ajuste Rasch sobre la matriz persona-ítem y escriba `difficultyB` opcional en el contrato (retrocompatible). `points` no cambia.
- **#13 · Mini-CAT por máxima información de Fisher** — *M-L (depende de #12).* Selección del próximo ítem con `b` más cercano a theta (flow/ZPD); fallback 100% al heurístico actual sin `b`.
- **#14 · Bug library curada (bug-rule canónica + misconceptionId)** — *L.* Flujo de promoción en `fail-explanation-kb-service`: al superar `occurrenceCount`, cola de revisión → `canonical=true`; tipar con `misconceptionId` sembrado desde confusablePairs.
- **#15 · A/B pedagógico con outcome de RETENCIÓN** — *L.* `experiment-service` que asigne brazo por `hash(sessionId+blockId)` y mida el outcome en el SIGUIENTE repaso espaciado (retención), no en el intento inmediato.

### Ítem adicional pedido por el usuario
- **#16 · Imágenes en los ejercicios** — *M.* Varios TPs reales (p.ej. TP5/TP6 de Sociales) tienen figuras que hoy no se muestran. Agregar campo opcional `image`/`imageUrl` al ítem del contrato (data-driven, Principio #1) + render en `render-blocks.js`/forms + hosting de los assets (extraídos de los PDF). Riesgo: bajo (aditivo); el trabajo real es extraer/alojar las imágenes por ejercicio.

---

## C. Recomendación de secuencia para continuación
1. **#1** primero (desbloquea #5, #11, #12, #13 — es la raíz de toda la psicometría).
2. **#3** (BKT) en paralelo — es el mayor salto pedagógico y no depende de #1.
3. Luego #6, #9, #2 (loops pedagógicos), después la Ola 3.
4. **#16 (imágenes)** puede ir en cualquier momento (independiente).

**Estado:** 5/15 implementados (#4 #10 #7 #1 #3), verificados y live; 10 + #16 specados. Adendum operacional (F1/F3/F4/F6) aplicado; F2/F5/F7 = Ola 0 pre-beta. Sin deuda de código rota; cada commit es atómico y reversible.
