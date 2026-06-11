# Mini-informe · #1 — Matriz persona-ítem + p-value / discriminación

**Principio:** Teoría Clásica de los Tests — p-value (proporción de aciertos) + discriminación punto-biserial (item-rest correlation). Es el prerrequisito de toda psicometría (IRT, CAT, gatekeeping de ítems). Raíz de #5, #11, #12, #13.

**Problema:** la dificultad se medía por BLOQUE (failRate/avgLost), nunca por ítem; los ítems individuales (cada V/F, cada hueco cloze, cada celda de cálculo) eran invisibles.

**Cambio (backend, aditivo, NO toca la nota):**
- `scoring.js`: cada grader emite **`itemResults:[{itemId, score01, maxPoints}]`** — `gradeTrueFalseJustified` (por afirmación), `gradeMulti` (por sub-ítem), `gradeCloze` (por hueco), `gradeCalculation` (por campo + balance). En `scoreAttempt`, los graders de respuesta única (text/text_family/choice/debe_haber) caen a **un ítem-bloque** (`score01 = points/maxPoints`).
- `cockpit-attempt-store-service.compactAttempt`: archiva `itemResults` por bloque (sin respuestas del alumno; anónimo).
- `/api/analytics/difficulty`: agrega por `itemId` → **p-value** (media de `score01`) y **discriminación** (punto-biserial = Pearson(score01 del ítem, total del intento)). Flags: `discriminacion_baja/negativa` (<0.2), `demasiado_facil` (p>0.95), `demasiado_dificil` (p<0.1). Devuelve `items[]` (peor discriminación primero) + `badItems[]`.

**Archivos:** `src/scoring.js`, `src/services/cockpit-attempt-store-service.js`, `server.js`.

**Verificación:** `node --check` OK; **core-unit 8.64 + validate 4/4 intactos** (cambio aditivo, no toca puntos). E2E (3 fuertes + 3 débiles, server real): 25 ítems con stats; ítem siempre-correcto → p=1.0 + flag `demasiado_facil`; ítems discriminantes → discriminación=1.0; 6 badItems detectados.

**Regla de oro:** intacta — `itemResults` es metadato derivado de lo que el motor ya decidió. **Impacto:** alto · **Esfuerzo:** M (revisado al alza vs S) · **Estado:** ✅ hecho.
