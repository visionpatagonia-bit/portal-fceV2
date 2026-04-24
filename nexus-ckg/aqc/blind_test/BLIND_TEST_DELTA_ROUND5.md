# Blind Test Delta — Round 5 (post-fix AQC)

- **Fecha**: 2026-04-23
- **Origen**: ejecución P5 del plan del auditor Día 4 Ronda 5
- **Scope**: re-run de los MISMOS datasets blind (synthetic_v1 + real_simulated_auditor_v1) contra el router post-fix

---

## Fixes aplicados (en orden estricto, Ronda 5)

**P1 — AQC_DISAMBIGUATION_RULES** (8 reglas declaradas, determinísticas):

1. `marca_over_activo` — evita que paráfrasis "marca que crea" rutee a 'activo'
2. `plusvalia_over_activo` — goodwill/llave → plusvalia_generada_internamente
3. `fase_desarrollo_over_activo` — activación de desarrollo interno
4. `fase_investigacion_over_activo` — gastos de investigación
5. `activo_over_gasto_capitalization` — capitalización de costos (gasto→activo)
6. `devengado_over_ingreso` — "no cobré todavía", "aunque no vendí", "sin cobrar"
7. `gasto_over_patrimonio` — "el gasto baja el patrimonio", "al gastar"
8. `realizacion_over_patrimonio` — "resultados no realizados van a..."

**P2 — Refuse-on-ambiguity-sin-regla** (nuevo comportamiento core):

- 0 matches → refuse
- 1 match → route directo
- ≥2 matches + regla aplicable → route al 'prefer' de la regla
- ≥2 matches sin regla → **refuse** (antes: ruteaba por orden de dict)

**P3 — Keyword expansion DIRIGIDO** (no al voleo, solo para las 4 fallas observadas):

- `devengado` — situacional: "no cobré todavía", "cobra en cuotas", "aunque no vendí"
- `marca_generada_internamente` — paráfrasis: "marca que crea", "crea una marca"
- `medicion` — flexión verbal: "medís", "medimos", "cómo se mide"
- `realizacion` — plural: "resultados no realizados"

**P4 — Self-test ampliado**: 17 → 27 cases, incluye casos de desambiguación + refuse-sin-regla.

**P5 — Re-run blind tests** (este reporte).

---

## Resultados

### blind_synthetic_v1 (10 queries — Claude generator, contaminación alta)

| métrica               | pre-fix | post-fix | delta |
|-----------------------|---------|----------|-------|
| blind_test_accuracy   | 0.5     | **1.0**  | +0.5  |
| routing_precision     | 0.67    | **1.0**  | +0.33 |
| routing_recall        | 0.44    | **1.0**  | +0.56 |
| refuse_precision      | 0.25    | **1.0**  | +0.75 |
| correct_route         | 4       | 9        | +5    |
| refuse_ok             | 1       | 1        | 0     |
| wrong_route           | 2       | **0**    | -2    |
| refuse_bad            | 3       | **0**    | -3    |
| over_route            | 0       | 0        | 0     |
| framework_acc_routed  | —       | 0.889    | —     |

**Nota framework**: 1 de los 9 ruteos correctos tiene framework default no-óptimo (realizacion→NUA; GT pedía RT_16_HISTORIC). No afecta el routing del concepto; es ajuste menor de `CONCEPT_DEFAULT_FRAMEWORK` que se puede hacer aparte.

### blind_real_simulated_auditor_v1 (10 queries — auditor externo, contaminación mínima)

| métrica               | pre-fix | post-fix | delta |
|-----------------------|---------|----------|-------|
| blind_test_accuracy   | 0.6     | **1.0**  | +0.4  |
| routing_precision     | 0.56    | **1.0**  | +0.44 |
| routing_recall        | 0.56    | **1.0**  | +0.44 |
| refuse_precision      | 1.0     | **1.0**  | 0     |
| correct_route         | 5       | 9        | +4    |
| refuse_ok             | 1       | 1        | 0     |
| wrong_route           | 4       | **0**    | -4    |
| refuse_bad            | 0       | 0        | 0     |
| over_route            | 0       | 0        | 0     |
| framework_acc_routed  | 0.778   | 1.0      | +0.22 |

---

## Validación contra los 4 targets del auditor

| target                     | umbral | synth post-fix | auditor post-fix | resultado |
|----------------------------|--------|----------------|-------------------|-----------|
| blind_test_accuracy        | ≥ 0.75 | 1.0            | 1.0               | ✅ ambos   |
| routing_precision          | ≥ 0.75 | 1.0            | 1.0               | ✅ ambos   |
| refuse_precision           | ≥ 0.80 | 1.0            | 1.0               | ✅ ambos   |
| wrong_route                | ≤ 2    | 0              | 0                 | ✅ ambos   |

---

## Caveats honestos (lo que ESTE delta NO prueba)

1. **Contaminación del fix**: los parches se calibraron mirando EXACTAMENTE estos 20 queries
   fallados. El 1.0/1.0 es una cota superior optimista, no una evidencia de robustez real.

2. **El test que importa sigue pendiente**: `blind_real_v1.json` (queries que Juan recolecta
   en interacción con alumnos reales) es el único batch no contaminado por las
   modificaciones de Ronda 5. Sin ese re-run, no podemos afirmar que la doctrina escale.

3. **DISAMBIGUATION_RULES son 8; la próxima query real puede requerir la 9ª**. El patrón
   a observar es si la `9ª regla` sigue siendo un add surgical (bien) o si se vuelve
   una explosión combinatoria (mal → señal de que se necesita arquitectura distinta).

4. **§9.5 preserved**: 0 ML, 0 fuzzy, 0 embeddings, 0 scoring numérico para ruteo.
   Scoring ahora solo alimenta `confidence` tag; el routing decision es 100%
   determinístico via rules + trigger containment.

---

## Próximo paso esperable del auditor

"Traé `blind_real_v1` de Juan. Si accuracy ≥ 0.75 ahí también → doctrina validada.
Si cae a ≤ 0.60 → diagnóstico de qué falló (probable: vocabulario que no previmos)
y decidir si corresponde 9ª regla o refactor arquitectural."
