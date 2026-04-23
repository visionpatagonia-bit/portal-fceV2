# NEXUS-CKG · Contable Knowledge Graph

**Sistema paralelo al KB actual.** No reemplaza — coexiste.
Propósito: responder consultas contables con **evidencia trazable al párrafo** del documento fuente, sin paráfrasis ni síntesis.

---

## Doctrina

1. **Literal quote or refuse.** Ninguna afirmación sale del sistema que no sea texto literal de una fuente canónica citada por §. Si no hay cita, el sistema responde "no tengo respaldo canónico verificado para esto".

2. **Framework scope + temporal validity son obligatorios.** Cada nodo/arista indica marco aplicable (IASB / NUA / RT 16 histórico) y vigencia temporal. Argentina tuvo cambio de régimen el 1° jul 2024 — el sistema lo codifica.

3. **Superficie chica impecable antes que superficie grande plausible.** Mejor 8 conceptos dominados que 80 ok-ish. Disciplina.

4. **El comportamiento es idéntico en casos conocidos y desconocidos.** Mismo shape de respuesta (claim + quote + source_ref + confidence), cambie o no el contenido. Asymmetry detectable = broken.

---

## Arquitectura

```
nexus-ckg/
├── schema/           # CKG schema definitions (nodes, edges, scopes)
├── registry/         # canonical_registry, source_registry, edge_case_registry (JSON)
├── rep/              # Reasoning Engine with Provenance — literal-quote validator + synthesizer
├── ash/              # Adversarial Stress Harness — trap battery + runner
└── docs/
    └── canonical_sources/   # PDFs canónicos + referencias a fuentes públicas
```

---

## Estado del régimen contable argentino (2026)

| Marco | Estado | Cobertura |
|---|---|---|
| IASB Marco Conceptual 2018 | vigente internacional | NIIF, marco conceptual |
| NUA (RT 54 → 56 → 59 → 62) | **vigente obligatorio desde 1° jul 2024** | normativa profesional argentina unificada |
| RT 16 | histórico | ejercicios pre-1° jul 2024 |

---

## Sprint Día 1 — objetivos

- [ ] 8 conceptos core curados manualmente (activo, pasivo, patrimonio neto, ingreso, gasto, devengado, realización, control) con definición NUA + RT 16 histórico + IASB diferenciadas
- [ ] Schema CKG con `framework_scope` + `temporal_validity` desde día 1
- [ ] Literal-quote validator implementado y probado
- [ ] Entry `activo/pasivo` refactoreado al nuevo estándar (cumple crítica Trucco 2026-04-23)
- [ ] 15 edge cases famosos cargados con respuestas validadas
- [ ] ASH runner con 15 cases + 10 out-of-registry probes
- [ ] Changelog y commit sellados

**Versionado:** CKG v0.1.0 = Día 1 completo.

---

## Contrato de integración con KB actual

El CKG vive en paralelo. En esta fase **no se toca** el KB actual (`kb/contabilidad.json` y similares). Los entries existentes siguen sirviendo como están.

Cuando un entry del KB actual llegue a un concepto cubierto por CKG v0.1+, se agrega un flag `promoted_to_ckg: true` con referencia al nodo CKG. El runtime consulta primero CKG, fallback a KB.

La migración es **gradual y opt-in por concepto**, no reemplazo en bloque.

---

## Fuentes canónicas — próximos pasos

- [ ] RT 54 (texto oficial, FACPCE)
- [ ] RT 59 (texto ordenado)
- [ ] RT 62 (modificación cooperativas)
- [ ] Fowler Newton — "La NUA según la RT 59" (PDF 2025)
- [ ] Fowler Newton — "La NUA según la RT 62" (PDF 2026) — "nuevo material" mencionado por Trucco
- [ ] IASB Marco Conceptual 2018 (español)
- [ ] RT 16 (archivo histórico)

---

## Changelog

- **2026-04-23** — v0.1.0 sprint iniciado post-reunión Trucco. Arquitectura definida tras adversarial stress-test por agente independiente.
