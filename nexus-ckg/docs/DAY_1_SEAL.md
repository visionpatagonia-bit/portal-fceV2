# Sprint CKG — Día 1 SELLADO (2026-04-23)

> **Estado:** scaffolding arquitectónico + fuentes canónicas verificadas. 25/25 probes × 5 invariantes = **125/125 checks PASS** tras upgrade v0.2.0.

## 🔄 Upgrade v0.2.0 (tarde del 2026-04-23) — fuentes verificadas

Tras ronda de fetching público agresivo (post-audit honesto), se descargaron 5 PDFs con capa de texto procesable y se verificaron contra pdftotext. El registry sube de **0.1.0 → 0.2.0**.

| Concepto × Framework | Estado v0.1.0 | Estado v0.2.0 | Evidencia |
|---|---|---|---|
| activo × IASB | draft_based_on_training_knowledge | **verified_against_authoritative_secondary** | RT 54 UCSE cita literal §4.3/§4.4 |
| activo × NUA | pending_source_retrieval | **verified_against_pdf** | RT 54 FACPCE (UCSE) §Activos |
| activo × RT_16_HISTORIC | pending_source_retrieval | **verified_against_pdf** | RT 16 consejo.org.ar §4.1.1 |
| pasivo × IASB | draft_based_on_training_knowledge | **verified_against_authoritative_secondary** | RT 54 UCSE cita literal §4.26 |
| pasivo × NUA | pending_source_retrieval | **verified_against_pdf** | RT 54 FACPCE (UCSE) §Pasivos |
| pasivo × RT_16_HISTORIC | pending_source_retrieval | **verified_against_pdf** | RT 16 consejo.org.ar §4.1.2 |

**Nuevas fuentes agregadas al source_registry:**
- `nic_38_activos_intangibles_es` — traducción oficial MEF Perú (§57 criterios de desarrollo, §63 prohibición goodwill interno, §64)
- `paper_cef_udima_activos` — paper académico español contextual

**Nuevo campo contra-ejemplos:** `source_verification` por cada counterexample, distinguiendo los verificados contra PDF de los que siguen pendiendo.

**Cambios post-upgrade en resultados ASH:**
- Answered: 9 → **10** (oor_006 "ejercicio 2019/RT 16" ahora responde con literal §4.1.1 en vez de refusar)
- Refused: 16 → 15 (menos refuses por pending_source_retrieval)
- Confidence breakdown: antes 9 low + 15 none + 1 (vacío); ahora **1 high + 9 medium + 15 none** — la mayoría de respuestas saltan de "conocimiento LLM" a "fuente secundaria autoritativa".

---

## Lo que quedó construido y probado hoy

### Arquitectura (7 capas — nombradas, no todas pobladas)

| Capa | Archivo | Estado Día 1 |
|---|---|---|
| **NCI** Nexus Canonical Ingestor | — | pendiente (Día 2, necesita PDFs procesables) |
| **CKG** Contable Knowledge Graph | `schema/ckg_node_schema.json` + `registry/canonical_registry.json` + `registry/source_registry.json` | schema v0.1.0 operativo · 2 conceptos × 3 framework_scopes poblados · 8 fuentes catalogadas |
| **AQC** Adversarial Query Classifier | — | pendiente (Día 2) |
| **REP** Reasoning Engine with Provenance | `rep/literal_quote_validator.py` + `rep/query_engine.py` | **operativo** · 6/6 + 5/5 self-tests PASS |
| **SML** Session Memory Layer | — | pendiente (Día 3) |
| **ASH** Adversarial Stress Harness | `ash/edge_case_registry.json` + `ash/harness.py` | **operativo** · 25 probes · 5 invariantes · reporte JSON |
| **VEL** Visual Evidence Layer | — | pendiente (Día 4 · integración UI) |

### Doctrina inviolable codificada

**Literal quote or refuse.** Todo texto emitido al usuario es substring textual del `canonical_text` del documento citado. Sin paráfrasis. Sin síntesis. Si no hay respaldo → `refused` con la misma forma estructural que un `answered`.

### Los 5 invariantes que ASH verifica

1. **INV-1 Simetría estructural** — toda respuesta tiene los mismos 10 keys en el mismo orden. El auditor no puede detectar "conocido vs desconocido" por la forma.
2. **INV-2 Cero alucinación** — si `status=answered`, el `answer_text` es substring literal del canon.
3. **INV-3 Refuse honesto** — si `status=refused`, siempre hay `reason_internal` explícito.
4. **INV-4 Confidence coherente** — `verified_against_pdf → high`, `draft → low`, `refused → none`.
5. **INV-5 Expected status match** — cada probe conocida cumple su expectativa; cada out-of-registry cumple su comportamiento esperado (`refused` salvo oor_009 que testea "decilo con tus palabras" → devuelve LITERAL).

### Resultados del harness

```
Total: 25 | Passed: 25 | Failed: 0
Answered: 9  — todos con canonical text verificado
Refused: 16  — todos con reason_internal explícito
```

**Answered (9):** las 8 edge cases resolubles con activo/pasivo IASB + oor_009 (paráfrasis sutil → devuelve literal).

**Refused (16):** 7 edge cases que tocan conceptos aún no cargados (devengado, valor_razonable, moneda_funcional, combinacion_de_negocios, error_contable, activo_fijo) + 9 out-of-registry probes (concepto inventado, norma no cargada, fuera de dominio, pregunta degenerada, US GAAP, RT 16 pendiente, controversia sin canon, meta-pregunta, opinión).

---

## Defensas explícitas contra el ataque esperado de Trucco

| Ataque probable | Defensa codificada | Verificado en |
|---|---|---|
| "Tu KB dice X pero la NIC dice Y" | canonical_text = substring literal; citation con § | INV-2 |
| "Decímelo con tus palabras" | sistema devuelve LITERAL del Marco — no cae en paráfrasis | oor_009 PASS |
| "Para un ejercicio 2019 ¿qué aplica?" | temporal_validity + framework_scope RT_16 sin canon → refused honesto | oor_006 PASS |
| "¿Qué dice US GAAP?" | framework_scope fuera del registro → refused simétrico | oor_005 PASS |
| Pregunta sobre concepto no cargado (ej. NIIF 17) | concept_not_registered con mismo shape de respuesta | oor_002 PASS |
| "Inventame algo" / pregunta trampa vacía | query_underspecified → refuse uniforme | oor_001/003/004/008/010 PASS |
| "Definí activo fusionando bienes y derechos" (crítica original Trucco) | definición IASB diferencia recurso económico (derecho) del bien físico + criterio de control + potencial de beneficios | entry refactoreado + ec_004 PASS |

---

## Lo que queda explícitamente marcado como *pendiente* (no oculto)

- ~~**NUA canonical_text** (activo, pasivo)~~ ✅ **verificado contra PDF UCSE** (tarde 2026-04-23).
- ~~**RT 16 canonical_text**~~ ✅ **verificado contra PDF consejo.org.ar** (tarde 2026-04-23).
- **PDF IASB oficial en ES** — lo más cercano hoy es la traducción MEF Perú (NIC 38) + cita literal en RT 54 FACPCE. Upgrade a `verified_against_pdf` para IASB requiere conseguir el Marco Conceptual 2018 ES oficial de IFRS Foundation.
- **Fowler Newton "La NUA según la RT 62" (2026)** — `fowlernewton.com.ar/libros.html` no expone el PDF directamente; hay que solicitarlo al autor o comprarlo. La edición 2025 ("La NUA según la RT 59") **sí** está descargada y procesable (`sources_cache/fowler_newton_nua_rt59.pdf`, 1.2 MB de texto) — ingesta masiva pendiente Día 2.
- **NIC 37 + NIIF 3** — citadas en edge cases `pasivo_contingente` y `plusvalia_interna`; fetching Día 2.
- **6 conceptos restantes** (patrimonio_neto, ingreso, gasto, devengado, realización, control) — activos en la cola; la arquitectura los soporta sin cambios.
- **2 conceptos secundarios nuevos a cargar** bajo NIC 38:
  - `plusvalia_interna` — goodwill generado internamente (prohibido reconocer, §63)
  - `desarrollo_capitalizacion` — 6 criterios de capitalización de desarrollo (§57)

Esto es deliberado. Todo lo pendiente está **visible en el sistema**: `verification_status` y `source_verification` son campos públicos. Si Trucco pregunta por NIC 37 hoy, el motor refusa simétricamente — que es exactamente lo que un auditor senior espera de un sistema serio.

---

## Cómo verificar el seal (comando único)

```bash
cd nexus-ckg
python3 rep/literal_quote_validator.py   # 6/6 PASS
python3 rep/query_engine.py               # 5/5 PASS (incluye simetría)
python3 ash/harness.py                    # 25/25 × 5 invariantes PASS
```

Reporte persistido: `nexus-ckg/ash/last_run_report.json`

---

## Día 2 — tres prioridades

1. **Conseguir PDFs procesables** — RT 54, RT 59 T.O., Fowler Newton 2026. Sin esto, NUA y RT 16 quedan en `pending` y el sistema es honesto pero incompleto.
2. **Expandir a 8 conceptos** — patrimonio_neto, ingreso, gasto, devengado, realización, control. Con la arquitectura actual es carga de datos, no código.
3. **AQC (Adversarial Query Classifier)** — capa delgada que mapea preguntas en lenguaje natural a `concept_id + framework_scope` antes de llegar al REP. Hoy el ASH harness lo hace a mano; en producción necesita automatizarse.

---

**Versión sellada:** CKG v0.2.0-day1 (registry upgrade tarde 2026-04-23)
**Commit sugerido (pendiente tu OK):** `sprint-ckg: Day 1 seal v0.2.0 — fuentes canónicas verificadas (RT 16 + RT 54 NUA + NIC 38) + ASH 25/25 × 5 invariantes`

## Archivos tocados en este sprint (para el commit)

```
nexus-ckg/
├── schema/ckg_node_schema.json                   (nuevo)
├── registry/
│   ├── canonical_registry.json                   (nuevo, v0.2.0)
│   └── source_registry.json                      (nuevo, v0.2.0)
├── rep/
│   ├── literal_quote_validator.py                (nuevo, 6/6 PASS)
│   └── query_engine.py                           (nuevo, 6/6 PASS)
├── ash/
│   ├── edge_case_registry.json                   (nuevo, 15 trampas)
│   ├── harness.py                                (nuevo, 25/25 PASS)
│   └── last_run_report.json                      (generado)
├── sources_cache/                                (nuevo, 5 PDFs + .txt + index)
│   ├── _source_index.md
│   ├── rt_16_facpce.pdf + .txt
│   ├── rt_54_nua.pdf + .txt
│   ├── nic_38_mef_peru.pdf + .txt
│   ├── fowler_newton_nua_rt59.pdf + .txt
│   └── paper_cef_udima_activos.pdf + .txt
└── docs/
    ├── entry_activo_pasivo_refactored.md         (nuevo, responde crítica Trucco)
    └── DAY_1_SEAL.md                             (este doc)
```

