# Consolidado para auditoría externa — Implementación de mejoras cognitivas (2026-06-11)

## Resumen ejecutivo
Tras la auditoría de 7 lentes (`AUDITORIA_COGNITIVA_2026-06-11.md`), se implementaron y **deployaron a producción** los cambios de **mayor ROI y menor riesgo** (los que reutilizan señal existente sin tocar el motor). Quedan specados los 12 restantes —de naturaleza *service-level* (modelos del alumno, psicometría)— para sucesivas olas.

**Garantía arquitectónica transversal (verificada en cada cambio):** el **motor determinista es la única autoridad de la nota**; toda mejora metacognitiva/IA es **advisory** y nunca altera el score. `core-unit` (demo 8.64) y `validate` (4 materias) intactos.

**Deploy:** todo en Render (`nexus-study-cockpit`, branch `feat/study-cockpit`) vía deploy hook; cada feature es un commit atómico con su mini-informe en `docs/audit-impl/`.

---

## A. Implementado, verificado y LIVE (3/15)

| # | Cambio | Principio | Archivos | Verificación | Commit |
|---|--------|-----------|----------|--------------|--------|
| **4** | Diagnóstico con **juicio antes de revelar** + persistencia | testing effect / hindsight bias | `diagnostico.js` | reveal bloqueado hasta marcar; persiste en localStorage; `node --check` OK | `feat(cognitivo #4)` |
| **10** | **Predicción de nota** (autopredecir_nota) en modos duros + delta de calibración | mastery-monitoring | `evaluar.js`, `devolucion.js` | predicción ignorada por el motor; delta vs `notaEstimada`; sintaxis OK | `feat(cognitivo #10)` |
| **7** | **SRS adaptativo half-life (FSRS-lite)** reemplaza Leitner fijo | FSRS / HLR (Duolingo) / SM-2 | `progress.js` | test: éxito 2.5→6.4→16.5 d, lapso colapsa a 4.3 d, recupera 10→26 d | `feat(cognitivo #7)` |

Las tres respetan la regla de oro; ninguna toca `scoring.js`.

---

## B. Pendientes — spec de implementación (12/15 + foto)

> Orden por ROI. Cada ítem indica **qué, dónde, esfuerzo, dependencias y riesgo** para evaluación externa.

### Ola 1 (quick wins restantes)
- **#1 · Matriz persona-ítem + p-value/discriminación** — *M (revisado al alza: el resultado expone hits/misses por BLOQUE, no `itemId` estable).* Requiere: (a) que cada grader de `scoring.js` emita `itemResults:[{itemId, score01, maxPoints}]`; (b) `compactAttempt` los archive; (c) `handleAnalyticsDifficulty` agregue por `itemId` con p-value y punto-biserial. **Dependencia raíz** de #5, #11, #12, #13. Riesgo: bajo (aditivo, no cambia la nota) pero toca todos los graders.
- **#2 · JOL: confianza por bloque antes de corregir** — *M.* Slider de confianza por bloque (en `render-blocks.js` para modalidades data-driven; en forms custom de Admin/Contab por separado), recolectado en paralelo a `answers`, IGNORADO por el motor, contrastado en Devolución (confianza vs points). Nota: #10 ya cubre la versión *global*; #2 es la granularidad por-bloque. Riesgo: bajo; fricción de UI media.

### Ola 2 (estructural · de reglas a modelos)
- **#3 · Knowledge Tracing (BKT/PFA) + ruteo por déficit acumulado** — *M-L.* Nuevo `learner-model-service` (server-side): `P(L)` por `(uid, conceptFamily)` actualizado con BKT estándar desde la evidencia que el motor ya emite. Reordenar `adaptive-sequence-service`/`mission-engine` por `(1-P(L))·examWeight`, **manteniendo el contrato de salida** (sin tocar frontend). Riesgo: medio (ranking nuevo; cae al heurístico si no hay datos).
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

**Estado de esta sesión:** 3/15 implementados, verificados y live; 12 + #16 specados. Sin deuda de código rota; cada commit es atómico y reversible.
