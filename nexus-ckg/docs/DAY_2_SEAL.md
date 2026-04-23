# DAY 2 SEAL — Sprint CKG v0.3.0

**Fecha:** 2026-04-23 (continuación del mismo día que Día 1; cerrado después del demo Trucco)
**Versión:** CKG v0.3.0 · Edge-case registry v0.2.0 · AQC v0.1.0 (MVP)

---

## Qué se hizo hoy

### Stage 2 — Expansión del CKG de 2 → 8 conceptos

`registry/canonical_registry.json` pasó de v0.2.0 (2 conceptos: `activo`, `pasivo`) a v0.3.0 (8 conceptos). Los 6 nuevos son:

- `patrimonio_neto`
- `ingreso`
- `gasto`
- `devengado` _(stub — pending_source_retrieval)_
- `realizacion` _(stub — pending_source_retrieval)_
- `control`

Cada concepto tiene tres `framework_scope` posibles: `IASB`, `NUA`, `RT_16_HISTORIC`. La matriz de cobertura efectiva quedó:

| concepto        | IASB | NUA | RT 16 |
|-----------------|------|-----|-------|
| activo          | ✓    | ✓   | ✓     |
| pasivo          | ✓    | ✓   | ✓     |
| patrimonio_neto | —    | —   | ✓     |
| ingreso         | —    | ✓   | ✓     |
| gasto           | —    | —   | ✓     |
| devengado       | —    | —   | —     |
| realizacion     | —    | —   | —     |
| control         | —    | ✓   | —     |

Totales: 24 pares concepto×framework; 13 verificados con PDF procesable y canonical_text literal; 11 pendientes de fuente y marcados explícitamente con `verification_status: pending_source_retrieval`.

**Doctrina mantenida:** los conceptos sin canonical_text cargado se registran **igual** en el registry como stubs — eso permite que el motor refuse simétricamente con reason `canonical_text_pending_source_retrieval:<framework>` en vez de aparentar que el concepto no existe. Cero invención.

### Stage 3 — Expansión del ASH harness +8 edge cases

`ash/edge_case_registry.json` pasó a v0.2.0 con 8 nuevos edge cases `ec_016` → `ec_023` que golpean los 6 conceptos nuevos con foco en counterexamples:

- `ec_016_patrimonio_neto_ecuacion` — composición (aportes + resultados)
- `ec_017_aporte_propietarios_no_es_ingreso` — contraejemplo de ingreso
- `ec_018_ingreso_actividades_principales_vs_accesorias` — criterio funcional
- `ec_019_gasto_vs_distribucion_dividendos` — contraejemplo de gasto
- `ec_020_gasto_correlacion_ingresos` — principio de matching / CMV
- `ec_021_control_sobre_entidad_nua` — definición literal NUA
- `ec_022_participacion_minoritaria_no_da_control` — sin umbral mecánico
- `ec_023_realizacion_definicion` — refuse honesto (stub)

Adicionalmente se corrigió una asimetría sutil en `harness.py`: el probe builder saltaba del primer concepto referenced al siguiente si no tenía texto, produciendo respuestas literales pero semánticamente desalineadas con la pregunta. Se fijó a **semantic primacy** — `relevant_concepts[0]` es vinculante. Esto hizo que `ec_023` (realización) ahora refuse bajo `concept=realizacion`, no que responda con el texto de `ingreso`.

**Resultado del harness post-expansión: 33 probes × 5 invariantes = 165/165 PASS.**

### Stage 4 — AQC skeleton (MVP keyword-based)

`aqc/keyword_router.py` es la capa que cierra el loop: pregunta natural → `(concept_id, framework_scope, confidence)` → REP → canonical_text literal. Implementación keyword matching con normalización (lowercase + strip acentos) y word boundaries para evitar falsos positivos tipo `"pasivo"` dentro de `"compasivo"`.

Estructura:

- `aqc/keyword_router.py` — clasificador + self-test 10/10 PASS
- `aqc/integration_test.py` — loop end-to-end AQC → REP, 10/10 PASS

Diseño explícito:

- **Sin invención:** si no detecta concepto → `concept_id=None` → refuse upstream.
- **Sin fabricar framework:** si no hay señal explícita de framework, usa el `CONCEPT_DEFAULT_FRAMEWORK` pero baja confidence a medium/low.
- **Confidence tagging visible:** high = concepto fuerte + framework explícito; medium = concepto fuerte + framework inferido; low = concepto débil; none = sin match.

Limitación documentada: no hace desambiguación semántica real ("activo de la empresa" vs "estoy activo"). La expansión prevista es embeddings multilingües locales (sin API externa) en Día 4-5.

---

## Verificación de seal (comando único)

```
cd nexus-ckg && \
  python3 rep/literal_quote_validator.py && \
  python3 rep/query_engine.py && \
  python3 aqc/keyword_router.py && \
  python3 aqc/integration_test.py && \
  python3 ash/harness.py | tail -10
```

Resultado esperado:

- literal_quote_validator: 6/6 PASS
- query_engine: 6/6 PASS
- keyword_router: 10/10 PASS
- integration AQC→REP: 10/10 PASS
- ASH harness: 33 probes × 5 = 165/165 PASS

---

## Qué no se hizo (deuda declarada)

- **NIC 37, 38 y NIIF 3 siguen sin procesar.** El fetch a MEF Perú está bloqueado por Incapsula (incluso con User-Agent de navegador). NIC 38 ya estaba cacheado de Día 1. Para NIC 37 y NIIF 3 hay alternativas pendientes de probar: consejo.org.ar, IASplus, incp.org.co.
- **IASB 2018 solo tiene activo/pasivo verificados contra la secondary source RT 54 FACPCE UCSE.** Los 6 nuevos conceptos bajo IASB están todos en `pending_source_retrieval` — el motor refuse honestamente. Cerrar esto requiere un PDF procesable del Marco Conceptual 2018 en español.
- **AQC sin embeddings.** Keyword matching tiene techo bajo para paráfrasis. Día 4-5.

Estos huecos están visibles en el motor vía `verification_status` y `confidence=none` en los refuses — no ocultos.

---

## Próximos pasos (Día 3)

1. **Día 3 prioridad 1 — conseguir PDFs procesables** de NIC 37, NIIF 3, Marco Conceptual IASB 2018 desde fuentes alternativas (consejo.org.ar, IASplus, incp.org.co, bibliotecas universitarias). Apuntar a subir la cobertura IASB y eliminar stubs.
2. **Día 3 prioridad 2 — expansion de conceptos a 12-15**: agregar `valor_razonable`, `deterioro`, `moneda_funcional`, `combinacion_de_negocios`, `obligacion_implicita` — conceptos que ya son edge cases pero no están en el registry.
3. **Día 3 prioridad 3 — endurecer AQC**: agregar sinónimos doctrinales adicionales, testear con queries de exámenes CPA reales. Preparar interface para swap a embeddings.
4. **Día 4-5 — embeddings locales** en AQC (sentence-transformers multilingual).

---

## Contrato invariante mantenido

Zero alucinación, zero paráfrasis. Toda afirmación emitida por el sistema es substring literal de `canonical_text` verificado contra fuente procesable. Si no hay respaldo, el sistema refuse con la misma forma estructural — un experto no puede detectar asimetría entre conocido y desconocido.

**Este es el punto central que distingue el CKG de cualquier sistema basado en LLM con RAG convencional: el motor no tiene permitido fabricar texto.**
