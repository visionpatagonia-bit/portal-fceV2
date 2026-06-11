# Mini-informe · #10 — Predicción de nota del simulacro (autopredecir_nota)

**Principio:** calibration of comprehension / mastery-monitoring. La sorpresa entre "creí 8" y "saqué 5" es uno de los disparadores conductuales más potentes para corregir el estudio (Dunlosky & Rawson).

**Problema:** `mission-engine` ya declaraba la acción `autopredecir_nota` en `full_simulation`, pero era **solo un string en un array** — nunca se implementó.

**Cambio (frontend, no toca el motor):**
- En `makeSubmit` (evaluar.js), centralizado para TODOS los modos duros (`mode==='hard'`: parcial real de Admin/Sociales/Contab + simulacro): antes de corregir se pide la predicción (0-10). El motor la **ignora** por completo; se guarda en `store.lastPrediction` + evento `fe_prediction_reported`.
- En `devolucion.js`, junto a la nota estimada se muestra el contraste: **"Predijiste 8.0 · el motor estima 5.40 · sobreconfianza (creíste 2.6 de más)"** (o "calibración buena ✓" / "te subestimaste"). Resalta el delta.

**Archivos:** `public/src/views/evaluar.js`, `public/src/views/devolucion.js`.

**Verificación:** `node --check` OK en ambos. La predicción no entra a `scoreAttempt`; el delta se computa contra `notaEstimada ?? total` que ya devuelve el motor.

**Regla de oro:** intacta — la predicción del alumno NO influye la nota; es puro feedback metacognitivo. **Impacto:** alto · **Esfuerzo:** S · **Estado:** ✅ hecho.
