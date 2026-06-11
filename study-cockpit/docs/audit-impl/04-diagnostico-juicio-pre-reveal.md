# Mini-informe · #4 — Invertir el diagnóstico (juicio antes de revelar)

**Principio:** testing effect + delayed-JOL (Bjork; Nelson & Dunlosky). El intento genuino de recuerdo + el compromiso de juicio ANTES del feedback es lo que produce aprendizaje y calibración; ver la respuesta primero induce *hindsight bias* ("ah, la sabía").

**Problema detectado (bug real):** en `diagnostico.js` el `<details>Ver respuesta esperada</details>` aparecía ANTES de los botones "La sabía / No la sabía", y el marcado vivía solo en memoria (`marks = {}`) → se perdía al recargar y no alimentaba ningún loop.

**Cambio (frontend-only, no toca el motor):**
- La respuesta modelo ahora está **oculta** (`.dx-reveal[hidden]`) hasta que el alumno **comprometa su juicio**; al marcar "La sabía/No", recién ahí se revela (con el `<details open>`).
- El juicio se **persiste** en `localStorage` (`nexus.dx.<subjectId>` → `{blockId:{mark,at}}`) y se **re-aplica al recargar** (mantiene estado + reveal).
- Queda el dato `{mark, at}` para, más adelante (#cross-view), contrastar el self-rating contra los `points` reales del motor cuando rinde Evaluar → cierre del loop de calibración.

**Archivos:** `public/src/views/diagnostico.js`.

**Verificación:** `node --check` OK. Lógica: antes de marcar, el reveal está `hidden`; marcar lo muestra + persiste; recargar mantiene. No hay scoring involucrado.

**Regla de oro:** intacta — el diagnóstico nunca puntuó (no es el motor); esto solo mejora el dato metacognitivo. **Impacto:** alto · **Esfuerzo:** S · **Estado:** ✅ hecho.
