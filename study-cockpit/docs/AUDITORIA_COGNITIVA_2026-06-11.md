# NEXUS Study Cockpit — Informe consolidado de auditoría pedagógico-técnica

## 1. Diagnóstico general

Tenemos el andamiaje de un sistema cognitivo serio —motor determinista como única autoridad de la nota, contrato JSON con granularidad de knowledge components, capa Gemini advisory enjaulada, SRS funcional, analítica que ya rutea a debilidad y calibración estimado-vs-real honesta— pero **la inteligencia adaptativa es heurística (umbrales fijos sobre el último intento), no basada en modelos**: lo que nos separa del estado del arte es que no estimamos dominio latente por concepto (BKT/PFA), no tenemos parámetros psicométricos por ítem (IRT/CAT), el SRS es Leitner fijo en vez de half-life adaptativo, no capturamos la confianza del alumno (JOL) ni cerramos el loop de remediación dirigida al error, y no medimos aprendizaje real (A/B con retención) ni validamos factualmente el contenido que genera la IA. La buena noticia: casi todo lo que falta se monta sobre evidencia que el motor **ya emite** y datos que **ya capturamos** —es trabajo de modelo, no de infraestructura.

> **Las 4 mejoras de mayor ROI (marcadas con ⭐):** #1 matriz persona-ítem + p-value/discriminación, #2 JOL pre-corrección, #3 ruteo por déficit de dominio acumulado, #4 invertir el diagnóstico (juicio antes de revelar). Son las que más mueven la aguja con menos código, porque reutilizan señal ya existente.

---

## 2. Quince puntos de mejora (priorizados por impacto/esfuerzo)

### 1. ⭐ Persistir matriz persona-ítem y stats psicométricas descriptivas por ítem
- **Hoy ofrecemos:** dificultad agregada por BLOQUE (failRate, avgLost en `/api/analytics/difficulty`), nunca por ítem.
- **Estado del arte:** Teoría Clásica de los Tests (p-value) + índice de discriminación punto-biserial (item-rest correlation), prerrequisito de toda psicometría.
- **El cambio:** extender `compactAttempt()` en cockpit-attempt-store-service para emitir `itemResults[] {itemId, correct/score01, maxPoints}` derivado de los hits/misses que scoring.js **ya itera** por ítem (gradeTrueFalseJustified, gradeMulti, gradeCloze...). Ampliar `handleAnalyticsDifficulty` para agregar por `itemId`: p-value y punto-biserial. El motor solo archiva lo que ya decidió.
- **Impacto:** alto · **Esfuerzo:** S · **Quick win:** sí

### 2. ⭐ JOL: capturar confianza del alumno ANTES de corregir
- **Hoy ofrecemos:** calibración estimado-vs-real del MOTOR (calibration-service, ±1pt), nunca la confianza del propio alumno.
- **Estado del arte:** Judgments of Learning (Nelson & Dunlosky), calibración confidence-accuracy / Brier score — el predictor más fuerte de mal estudio es la sobreconfianza.
- **El cambio:** en evaluar.js, antes de disparar `scoreAttempt`, un slider 0-100 por bloque "¿qué tan seguro estás?". Se envía como `confidence{blockId}` que **el motor IGNORA** (regla de oro intacta) y se guarda como evento `jol_reported`. En devolucion.js: "creíste 80%, sacaste 0.9/2 → sobreconfianza", usando los points que el motor ya devuelve.
- **Impacto:** alto · **Esfuerzo:** S · **Quick win:** sí

### 3. ⭐ Rutear por déficit de dominio acumulado, no por la debilidad del último intento
- **Hoy ofrecemos:** `weaknesses[0]` del ÚLTIMO intento manda la próxima misión (confunde "mal día" con "no domina").
- **Estado del arte:** Bayesian Knowledge Tracing (Corbett & Anderson 1995) / PFA (Pavlik 2009): estado latente P(L) por KC sobre TODA la historia.
- **El cambio:** un `learner-model-service` server-side que mantenga P(L) por (alumno, conceptFamily) alimentado por la evidencia que scoring.js ya emite, actualizado con BKT/PFA estándar. Reemplazar el ranking de `chooseTargetBlock` y `mission-engine.fromScore` por orden `(1 - P(L)_KC) * examWeight`, **manteniendo idéntico el contrato de salida** (mismos steps/missions) para no tocar el frontend. La IA nunca toca la nota; BKT solo ordena la secuencia.
- **Impacto:** alto · **Esfuerzo:** M (ruteo S si el servicio ya existe) · **Quick win:** parcial

### 4. ⭐ Invertir el diagnóstico: juicio ANTES de revelar (matar el hindsight bias)
- **Hoy ofrecemos:** en diagnostico.js el botón "La sabía / No la sabía" aparece DESPUÉS del `<details>Ver respuesta esperada</details>` → induce sesgo retrospectivo y el marcado ni se persiste.
- **Estado del arte:** retrieval-attempt genuino antes del feedback (testing effect); el delayed-JOL effect exige comprometerse con un juicio antes de ver la respuesta.
- **El cambio:** mover los botones ARRIBA del reveal y bloquear el reveal hasta marcar. Persistir en localStorage (`nexus.dx.<subject>`) y contrastar el self-rating contra los points reales cuando rinda evaluar. Convierte un gesto cosmético en un dato de calibración con loop cerrado. Cero cambios en el motor.
- **Impacto:** alto · **Esfuerzo:** S · **Quick win:** sí

### 5. Detector de discriminación + alarma de ítem malo (gatekeeping de ítems de IA)
- **Hoy ofrecemos:** las variantes que genera Gemini entran al banco determinista de rotación sin ningún filtro estadístico.
- **Estado del arte:** descarte/revisión de ítems por discriminación <0.2 o punto-biserial negativo (estándar de la industria de testing).
- **El cambio:** sobre la matriz persona-ítem (#1), marcar en rojo en progreso.js los ítems defectuosos y —crítico— aplicar el MISMO filtro a las variantes generadas por Gemini **antes** de promoverlas al banco de rotación. La IA propone el ítem; la estadística decide si entra. No toca ninguna nota ya puesta.
- **Impacto:** alto · **Esfuerzo:** M · **Quick win:** no

### 6. Self-explanation gate antes de la respuesta modelo (ICAP: de Activo a Constructivo)
- **Hoy ofrecemos:** se entrega la respuesta modelo de una → invita al modo pasivo (leer en vez de generar).
- **Estado del arte:** self-explanation effect (Chi 1989) + marco ICAP (Chi & Wylie 2014): generar la explicación supera a recibirla.
- **El cambio:** en devolucion.js (failCard), antes de revelar `respuestaModelo`, un mini-prompt obligatorio "¿por qué falló este punto?". El input va a `gemini.selfExplanationCheck` (mismo patrón advisory que semanticFeedback: orienta, NUNCA puntúa). Sin Gemini, igual se exige escribir >10 chars para desbloquear. Persistir la auto-explicación como señal de calidad de la KB.
- **Impacto:** alto · **Esfuerzo:** M · **Quick win:** no

### 7. SRS adaptativo half-life por conceptFamily (FSRS/HLR-lite) reemplazando Leitner fijo
- **Hoy ofrecemos:** Leitner de intervalos FIJOS por BLOQUE (1,2,4,8,14; fallo→1); reprograma el bloque entero aunque falle 1 de 4 criterios.
- **Estado del arte:** FSRS / Half-Life Regression (Duolingo 2016) / SM-2: half-life por ítem-alumno, ~20-30% menos repasos a igual retención.
- **El cambio:** en progress.js mover la unidad de tarjeta de "bloque" a "conceptFamily/criterion" (ya identificable por terms en el contrato) y computar `dueAt` desde una half-life que crece con aciertos espaciados y colapsa con fallos. Sigue client-side; el motor sigue decidiendo `passed` por points. Emitir `review_scheduled` para poder afinar el scheduler con datos agregados.
- **Impacto:** alto · **Esfuerzo:** M · **Quick win:** no

### 8. Faded worked examples / completion problems en el bloque de cálculo
- **Hoy ofrecemos:** workedExample BINARIO (ejemplo completo → intento completo), sin andamiaje intermedio justo donde más pega la carga cognitiva (liquidación, asiento Debe/Haber).
- **Estado del arte:** faded worked examples + completion effect (Renkl & Atkinson; Sweller): secuencia completo→faded→en-blanco mejora transfer.
- **El cambio:** en el contrato JSON, agregar a workedExample una variante "faded" con N pasos pre-resueltos y M en blanco, corregida por el MISMO grader determinista (computePayroll / gradeDebeHaber ya calculan la clave). En Aprender tras fallo de cálculo: 1er reintento = ejemplo completo, 2º = faded (mitad de celdas), 3º = problema entero. **Cero IA**: secuenciación + grader existente.
- **Impacto:** alto · **Esfuerzo:** M · **Quick win:** no

### 9. Micro-retest dirigido al error (cerrar el loop de remediación)
- **Hoy ofrecemos:** tras remediar un error, no se vuelve a testear ESE error; el SRS lo reabsorbe en el bloque y no se mide la tasa error→acierto.
- **Estado del arte:** mastery learning de Bloom + spaced retrieval del error: reevaluar el objetivo fallado hasta dominio.
- **El cambio:** cuando un error puntual se remedia (el alumno pasó por Aprender de ese gap), encolar un micro-quiz de 1-2 ítems sobre ESE misconceptionId (reusando questions-kb por fingerprint + confusablePairs), separado del SRS por bloque. Registrar la transición error→acierto como "tasa de remediación". El motor corrige; Gemini a lo sumo redacta la variante respetando reglas.
- **Impacto:** alto · **Esfuerzo:** M · **Quick win:** no

### 10. Implementar la predicción de nota del simulacro (loop "autopredecir_nota")
- **Hoy ofrecemos:** mission-engine declara la acción `autopredecir_nota` en full_simulation pero es solo un string en un array — nunca se implementó.
- **Estado del arte:** calibration of comprehension / mastery-monitoring: la sorpresa entre "creí 8" y "saqué 5" es el disparador conductual más potente.
- **El cambio:** materializarla: en evaluar.js, cuando mode='hard'/simulacro, antes de corregir pedir "predecí tu nota (0-10)". Guardar como `prediction_reported`. En devolucion.js mostrar "predijiste 8, el motor estima 5.4" con el delta resaltado + prompt de reflexión. El motor sigue siendo el juez.
- **Impacto:** alto · **Esfuerzo:** S · **Quick win:** sí

### 11. Estimar habilidad theta (EAP) con su error estándar y convertir el gating en mastery con incertidumbre
- **Hoy ofrecemos:** el gating de promoción es por nota cruda (total>=8 / bloque>=1.35-1.5) sobre un único intento ruidoso, sin banda de confianza.
- **Estado del arte:** estimación de theta (MLE/EAP) + SEM + fiabilidad marginal IRT; gating por límite inferior del intervalo, no por nota puntual.
- **El cambio:** un `AbilityService` que, con los b calibrados (ver #12) y el historial de itemResults, calcule theta EAP por materia/bloque con su SE. En mission-engine cambiar el gate de `total>=8` a `(nota - SEM) >= umbral`: no se promociona por ruido. El motor calcula el número; el SEM solo agrega la banda para decidir el siguiente paso, nunca cambia la nota mostrada.
- **Impacto:** medio · **Esfuerzo:** M (depende de #1 y #12) · **Quick win:** no

### 12. Calibrar dificultad b (Rasch/1PL) por ítem y guardarla en el contrato como metadato
- **Hoy ofrecemos:** dificultad descriptiva dependiente de la muestra; no se pueden comparar variantes de rotación entre sí.
- **Estado del arte:** IRT 1PL/Rasch (b en logits, invariante a la muestra) como base de selección informativa.
- **El cambio:** job OFFLINE (`scripts/`, fuera del request path) que ajuste Rasch sobre la matriz persona-ítem acumulada y escriba un campo NUEVO y OPCIONAL `difficultyB` en cada ítem del exam-profile.json. El contract-validator lo acepta como opcional con default null (data-driven, retrocompatible). `points` (lo que vale para la nota) **no cambia**: b es solo metadato de selección.
- **Impacto:** alto · **Esfuerzo:** L · **Quick win:** no

### 13. Mini-CAT: selección del siguiente ítem por máxima información de Fisher + difficulty-matching (flow)
- **Hoy ofrecemos:** el banco rota el parcial pero NO empareja la dificultad del ítem con el nivel del alumno (aburre al fuerte, frustra al débil).
- **Estado del arte:** CAT por máxima información de Fisher + canal de flow (Csikszentmihalyi) / ZPD: ~50% menos ítems para el mismo SE.
- **El cambio:** en adaptive-sequence-service / exam-variant-service, cuando exista `theta` y `b` calibrados, elegir del banco el ítem con b más cercano a theta dentro del bloque de mayor peso/debilidad. **Fallback 100% al heurístico actual** cuando no haya b calibrado (degrada limpio). El grader sigue corrigiendo; el CAT solo decide QUÉ ítem mostrar.
- **Impacto:** alto · **Esfuerzo:** M-L (depende de #12) · **Quick win:** no

### 14. Bug library curada: de explicación ad-hoc a bug-rule canónica con misconceptionId
- **Hoy ofrecemos:** fail-explanation-kb guarda explicaciones por miss en `generated_unreviewed`; casi nada llega a `canonical` y no hay misconceptionId estable.
- **Estado del arte:** bug-rule remediation de los Cognitive Tutors (Brown & Burton; Koedinger): cada error → remediación canónica validada (~1 sigma).
- **El cambio:** extender fail-explanation-kb-service con un flujo de promoción: al superar `occurrenceCount` un umbral, el error pasa a cola de revisión; un experto (o un 2º pase de Gemini con auto-crítica) fija `canonical=true`. Tipar cada entrada con `misconceptionId` estable sembrado desde confusablePairs (devengado/percibido, aportes/contribuciones). Servir SIEMPRE la canónica si existe; la generada solo como fallback.
- **Impacto:** alto · **Esfuerzo:** L · **Quick win:** no

### 15. Framework de A/B pedagógico con outcome de RETENCIÓN (no la nota inmediata)
- **Hoy ofrecemos:** no se puede responder qué intervención Gemini (socrático vs analogía vs abogado-del-diablo vs worked-example) mejora el aprendizaje real.
- **Estado del arte:** RCT pedagógico (ASSISTments, Heffernan/Koedinger): muchas "mejoras" suben la nota inmediata pero NO la retención — hay que medir el outcome retrasado.
- **El cambio:** un `experiment-service` que al entrar a un bloque asigne un brazo por `hash(sessionId+blockId)`, lo registre como `experiment_arm_assigned`, y mida el outcome en el SIGUIENTE repaso espaciado del mismo KC (retención), no en el intento inmediato. El motor determinista provee el outcome objetivo. Reporte de tasa de retención por brazo en /api/analytics. (Complementos baratos de gobernanza: hashear UID en events.jsonl, campo de consentimiento, faithfulness-check del contenido generado contra el corpus de Contabilidad ya existente.)
- **Impacto:** alto · **Esfuerzo:** L · **Quick win:** no

---

## 3. Hoja de ruta sugerida

| # | Mejora | Impacto | Esfuerzo | Ola | ROI |
|---|--------|---------|----------|-----|-----|
| 1 | Matriz persona-ítem + p-value/discriminación | alto | S | **Ola 1 — Quick wins** | ⭐ |
| 2 | JOL: confianza antes de corregir | alto | S | **Ola 1 — Quick wins** | ⭐ |
| 4 | Invertir diagnóstico (juicio antes de revelar) | alto | S | **Ola 1 — Quick wins** | ⭐ |
| 10 | Predicción de nota del simulacro (autopredecir_nota) | alto | S | **Ola 1 — Quick wins** | |
| 3 | Ruteo por déficit de dominio acumulado (BKT/PFA) | alto | M | **Ola 2 — Estructural** | ⭐ |
| 5 | Detector de ítem malo + gatekeeping de IA | alto | M | **Ola 2 — Estructural** | |
| 6 | Self-explanation gate (ICAP) | alto | M | **Ola 2 — Estructural** | |
| 7 | SRS half-life por conceptFamily | alto | M | **Ola 2 — Estructural** | |
| 8 | Faded worked examples (cálculo) | alto | M | **Ola 2 — Estructural** | |
| 9 | Micro-retest dirigido al error | alto | M | **Ola 2 — Estructural** | |
| 11 | Theta/SEM + mastery-gating con incertidumbre | medio | M | **Ola 2 — Estructural** | |
| 14 | Bug library curada (bug-rule canónica) | alto | L | **Ola 3 — Ambicioso** | |
| 12 | Calibrar b (Rasch) por ítem en el contrato | alto | L | **Ola 3 — Ambicioso** | |
| 13 | Mini-CAT por máxima información + flow | alto | L | **Ola 3 — Ambicioso** | |
| 15 | A/B pedagógico con retención + gobernanza | alto | L | **Ola 3 — Ambicioso** | |

**Lectura en 30 segundos:** Ola 1 (4 quick wins, todos S) instrumenta la señal que falta —datos por ítem, confianza del alumno, juicio pre-reveal, predicción de nota— sin tocar el motor y casi sin riesgo. Ola 2 convierte esa señal en modelos (dominio latente, SRS adaptativo, gating con incertidumbre) y cierra loops pedagógicos (self-explanation, faded examples, micro-retest). Ola 3 son las apuestas psicométricas pesadas (Rasch, CAT, bug library curada, A/B con retención) que dependen de tener primero los datos de la Ola 1 acumulados. **Regla de oro respetada en los 15 puntos: la IA orienta, el motor determinista pone la nota.**