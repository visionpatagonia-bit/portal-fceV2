# Mini informe CTO · Sprint 1.6 CERRADO · Biblioteca técnica

**Fecha:** 2026-05-10 noche · **Validación:** Ariel aprobó deploy

---

## Visión que originó el sprint

Juan post Sprint 2 cierre · ve thumbnails y dice: "sería bueno que el profesor o el alumno pueda ampliar la foto · no sabía que teníamos banco de imágenes que se puede usar para enseñar". Insight de producto: 1.746 imágenes yuhonas como **biblioteca técnica integrada** · expande PMF de "rutinador" a "rutinador + biblioteca técnica".

---

## Lo entregado · 3 bloques + 3 hotfixes iterativos

| Bloque | Resultado |
|---|---|
| **D1** Thumbnails EXT 40x40 en modal +Agregar | Visible para Ariel · justifica SW cache yuhonas |
| **D1 HOTFIX v3/v4/v5** | Click EXT fix · dark mode L1-L5 · equipo default ON · thumbnail en rutina · audit sistemático dark (7 reglas) |
| **D2** Modal lightbox educativo | `nxOpenExDetail` global · imagen 1+2 + instructions · ⓘ button + thumb clickeable · CTA condicional · ESC/click overlay cierra |
| **D3** Matching curado ↔ yuhonas + diccionario ES | 42/100 curados heredan foto del match · 200+ patterns regex traducen ~50% instructions · sufijo (EN) discreto si no |

---

## Validación

- **14 smokes nuevos persistentes** · ~205 asserts · 0 FAIL · 1 WARN preexistente
- **Regression Sprint 1+1.5+2** smoke_headless 46/47 idéntico baseline
- **Validación user real:** Ariel aprobó deploy D3 cuando Juan le envió link
- **3 rondas feedback iterativo** con Juan en vivo · cada bug resuelto raíz no parche

---

## Decisión clave: AUDIT SISTEMÁTICO dark mode

Tras 3 iteraciones de fixes puntuales de dark mode, Juan dijo: "estamos bajando el nivel · 4 iteraciones con esto". Cambio de approach: parar patches puntuales · aplicar audit en lote · buscar pattern raíz (backgrounds hardcoded sin dark rule) · 7 reglas dark nuevas con principio consistente (bg → rgba alpha + texto tono claro mismo color family).

Esto responde al patrón recurrente de "AI-slop dark mode" y muestra ingeniería sistémica vs reactiva.

---

## 3 patrones Sprint 1.5 sostenidos en Sprint 1.6

1. ✅ **"No hacer" justificado** · LLM bulk postpone con condición clara · 50% manual suficiente para PMF inicial
2. ✅ **Framework preparatorio sin scope creep** · `nxTranslateInstruction` expandible · lightbox async listo para lazy LLM futuro
3. ✅ **Trabajo arquitectónico preventivo** · matching genera campos `yuhonas_match`/`yuhonas_thumb` reutilizables · no requiere bundle cargado para mostrar thumb

---

## Trade-offs documentados (6)

1. 58 curados sin match · agregar overrides manuales si Ariel pide
2. Diccionario al 50% · expandir patterns si emerge necesidad
3. Match low tier · false positives posibles · corregir manualmente
4. NX_CATALOG lazy load · 500ms primera apertura lightbox curado matched
5. No carrusel swipe imágenes 1/2 · Sprint 1.7 nice-to-have
6. No pinch-zoom · Sprint 1.7 nice-to-have

---

## 11 kill-switches activos (acumulado todos los sprints)

- `?dexie=0` (S1)
- toggle catálogo OFF default (S1.5)
- NX_CATALOG.getError (S1.5)
- NX_SW.purge (S1.5)
- manifest 404 SVG fallback (S2)
- enhancements no-op si !student-mode (S2)
- MIME fix revertible (S2)
- setStudentSensation LS SoT (S2)
- thumbnail onerror groupIcon (S1.6)
- traducción sufijo (EN) si pattern no aplica (S1.6)
- matching yuhonas_thumb onerror fallback (S1.6)

---

## Cadencia · 12 deploys en sesión continua sábado-domingo

| Sprint | Deploys | Asserts | Validación |
|---|---|---|---|
| Sprint 1 Stack A | 1 | 345 | Baseline |
| Sprint 1.5 (D1+D2 · D3.A · D3.C · cierre) | 4 | 95/96 | Lead aprobó |
| Sprint 2 PWA Alumna (D1 · D2 · D3 · cierre) | 4 | 129/130 | Lead aprobó screenshots |
| Sprint 1.6 (D1 · hotfixes v3/v4/v5 · D2 · D3 · cierre) | 6+ | ~205 | **Ariel aprobó · uso real** |
| **TOTAL sesión** | **15 deploys** | **~775 asserts** | **0 regresión** |

Disciplina O1 sostenida sin interrupciones · 15 deploys consecutivos · cliente piloto aprobando producción.

---

## Pendiente real declarado (NO oculto)

- Validación uso real Ariel 1-3 días → feedback puntual si emerge
- LLM traducción 100% · condicional (Sprint 1.7 si Ariel pide)
- Overrides matching manuales · condicional (si Ariel pide curado sin foto)
- Sprint #161 Firebase backend · roadmap original 1 jul · evaluar si adelantar

---

## Veredicto

Sprint 1.6 cerrado con **cliente real aprobando**. Biblioteca técnica integrada en producción. Decisión estratégica de profundizar PMF Anubis (vs distraer a Trucco) **se confirma correcta empíricamente**.

**Listo para próximo bloque cuando arbitres timing · sin urgencia.**
