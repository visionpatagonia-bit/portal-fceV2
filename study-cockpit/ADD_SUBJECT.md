# Agregar una materia (escalar el cockpit)

El sistema es **subject-agnostic**: el motor determinista (`src/scoring.js`) y el frontend renderizan
por `grading.type`, no por materia. **Agregar una materia = autoría de JSON**, sin tocar código.

## Pasos

1. **Scaffold** (crea una plantilla válida):
   ```
   node scripts/new-subject.js <id_snake_case> "Nombre de la materia"
   ```
   Crea `data/subjects/<id>/exam-profile.json` (el contrato: rúbrica + variantes) y `study-map.json`
   (el plan de estudio de Aprender). La plantilla ya pasa el validador y puntúa.

2. **Editar el contenido real** en esos dos JSON (ver tipos de bloque abajo).

3. **Validar** (chequea estructura + que el motor puntúa sin romper, TODAS las materias):
   ```
   node scripts/validate-subjects.js
   ```
   Corregir cualquier `✗` antes de subir. `node scripts/core-unit.js` también valida los contratos.

La materia aparece sola en `/api/subjects`, en la UI de Materias, tiene examen (render data-driven) y
corrige. En vivo: `GET /api/subjects/health` lista la validación de todas.

## Tipos de bloque (`block.grading.type`) y qué declara cada uno

Cada bloque: `{ id, label, points, grading: { type, input, ... } }`. `input` = la clave bajo la que
llega la respuesta (default = `id`). La pregunta visible vive en `variants[].blocks[].items[].prompt`.

- **text** — desarrollo escrito. `grading.criteria: [{ label, terms:[...], points }]` (+ opcional
  `critical`, `criticalPenalty`). Puntúa por cobertura de términos; tiene anti-relleno.
- **text_family** — desarrollo puntuado por familia conceptual. El item de variante lleva
  `conceptFamily`; los términos van en `contract.gradingFamilies[familia]`.
- **true_false_justified** — V/F con justificación. `grading.items: [{ id, expected:'V'|'F', terms:[...] }]`,
  `optionPoints`, `justPoints`. Las V suman con marcar; las F exigen justificación técnica.
- **calculation** — cálculo con clave numérica. `grading.fields: [{ key, label, expected, weight }]` +
  `grading.balance: { debit:[keys], credit:[keys], weight }` opcional. Tolerante a es-AR (`500.000`).
- **choice** — opción múltiple. La clave va en el item de variante: `options:[...]`, `answer:<índice>`.
- **cloze** — completar oraciones. `grading.gaps: [{ id, expected, accept:[sinónimos], numeric?, options?:[...] }]`.
  El prompt de la variante lleva `{{gapId}}` por cada gap (huecos de escribir o de elegir si hay `options`).
- **debe_haber** (alias `ledger_entry`) — colocar montos. `grading.rows: [{ id, account, debit:<monto|null>, credit:<monto|null> }]`.
  Puntúa por celda + verifica que el asiento balancee (suma Debe = suma Haber).
- **multi** — examen duro multi-ítem (sub-graders choice/tf_justified/text); los items van en la variante.

## Modalidad "Parcial real" (cloze + Debe/Haber) por materia

Para una modalidad distinta a la práctica (ej. el parcial presencial: completar + Debe/Haber), declarar
`contract.hard: { label, blocks:[...], variants:[...] }`. El motor la corrige en modo `hard` y, en el
frontend, las materias con `contract.hard` muestran el toggle del segundo modo. Ver `contabilidad_2p`
como ejemplo (3 cloze + 2 asientos Debe/Haber).

## Reglas de oro

- El **motor determinista** decide la nota; **Gemini solo explica**; el **frontend no puntúa**.
- `assessment.passPoints`/`promotionPoints` definen los umbrales por materia (default 6/8).
- La calibración del demo (contabilidad 8.64) se protege en `core-unit.js`: no cambiar los bloques
  base ni los `expected` de `calculation_entry`.
