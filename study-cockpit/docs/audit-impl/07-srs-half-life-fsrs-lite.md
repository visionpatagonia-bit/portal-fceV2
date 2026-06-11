# Mini-informe · #7 — SRS adaptativo half-life (FSRS-lite) reemplaza el Leitner fijo

**Principio:** FSRS / Half-Life Regression (Duolingo 2016) / SM-2. La retención se optimiza modelando la *tasa de olvido* (half-life) por tarjeta y por desempeño, no con intervalos fijos iguales para todos.

**Problema:** `progress.js` agendaba con intervalos FIJOS (1,2,4,8,14; fallo→1) y desempeño BINARIO (passed≥1.35), tratando todos los bloques y todos los alumnos igual.

**Cambio (client-side, no toca el motor):** modelo de memoria por bloque con **estabilidad** (half-life en días):
- Recall **graduado** (`points/maxPoints`, 0-1), no binario.
- La estabilidad **crece** con el recall, con el *spacing* (premia acertar sobre una tarjeta vencida) y **decrece** con la **dificultad** del bloque (media móvil del recall fallado).
- Un **lapso colapsa** la estabilidad proporcional a cuán lejos quedó del dominio.
- `dueAt = now + estabilidad·día`. Se mantuvo el shape (`dueAt/interval/label/lastScore`) → `dueReviews`/`nextReview` siguen funcionando sin cambios.

**Verificación (con localStorage mockeado):** éxito espaciado → estabilidad 2.5→6.4→16.5 d; un fallo → colapsa 16.5→4.3 d (sube dificultad); recupera 10→26 d. `node --check` OK.

**Limitación honesta:** la tarjeta sigue siendo el **bloque**, no la `conceptFamily` individual — llevarla a concepto requiere los `itemResults` por-ítem (depende de #1). El scheduling ya es adaptativo; la granularidad fina queda para #1.

**Regla de oro:** intacta — el motor decide `passed` por `points`; esto solo agenda. **Impacto:** alto · **Esfuerzo:** M · **Estado:** ✅ hecho.
