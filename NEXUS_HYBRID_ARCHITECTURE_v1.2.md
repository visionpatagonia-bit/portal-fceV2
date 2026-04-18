# 🧠 NEXUS HYBRID ARCHITECTURE v1.2

**Arquitectura híbrida Mistral + Llama 3.2 para independencia de tokens, calidad académica suprema y escalabilidad lateral a múltiples dominios (NEXUS universitario + GYM).**

> **v1.2 (18 abril 2026) — revisión post-implementación Fases 0-2.**
> Este documento actualiza v1.1 incorporando 6 cambios de arquitectura motivados por evidencia empírica recolectada durante la implementación de Fases 0-2 (17-18 abril) y por el test visual de 5 queries ejecutado el 18 abril. Mantiene la estructura del v1.1 para facilitar auditoría por diff visual. Cada sección modificada lleva un bloque **🔄 v1.2** explicando el cambio y su motivación.

---

## 📋 CHANGELOG v1.1 → v1.2

| # | Cambio | Sección afectada | Motivación |
|---|---|---|---|
| a | Reordenar Fase 3 (fallback+cache) antes de Fase 4 (watcher) | Plan por fases | Sin qa_cache, el sistema no "aprende" y repite latencia LLM en queries ya resueltas |
| b | **Nueva Fase 2.5 — Validator semántico** | Plan por fases + Reglas de calidad | Evidencia 18/04: 82 entries Sociales con `validated: true` contienen alucinaciones (mezcla contable/sociológico) que el validator estructural no detecta |
| c | Auditoría retroactiva de las 84 entries Sociales | Plan por fases (sub-tarea de 2.5) | Bomba de tiempo pre-clonar a GYM — evidencia empírica de alucinaciones vivas en producción |
| d | Pre-requisito formal para Fase 5 GYM: ≥95% entries pasando validator semántico | Modularidad + Fases | En GYM, alucinación = riesgo de lesión del cliente (no solo mala nota académica) |
| e | Reemplazar métrica débil "50% incluyen source_refs" por métricas duras (KB match rate ≥80% + zero alucinación verificada por muestreo) | Criterios de éxito | 100% de las entries alucinadas de hoy TIENEN source_refs válidos — el criterio no distingue señal de ruido |
| f | Documentar en matriz de riesgos 4 fricciones operativas ya observadas | Riesgos | Git index corrupto, paths con acentos, proxy hardcodea modelo, Itinerario I sin OCR |

**Estado de implementación al 18/04 16:00 ARG:**

- ✅ Fase 0, 1, 2: completadas (138 entries en prod, KB hit 5/5 en queries de test)
- ❌ Fase 3 (fallback + qa_cache): **no iniciada**
- ❌ Fase 4 (watcher): manual por design, OK
- ❌ Fase 5 (GYM): bloqueada por pre-requisito nuevo (cambio **d**)

---

## 🎯 OBJETIVO

Construir un sistema donde:

- **Mistral 7B** pre-mastica todo el contenido offline (sin apuro, GPU local)
- **Llama 3.2** solo hace retrieval + rewrite en runtime (rápido, consistente)
- **UI determinística** (cero IA en capa visual)
- **Zero token cost** en runtime (todo local)
- **Modularidad total**: el mismo motor sirve para NEXUS académico y para GYM
- **Watcher automático**: nuevos materiales → reprocesamiento automático

*(Objetivos sin cambios respecto a v1.1.)*

---

## ⚙️ HARDWARE DISPONIBLE

*(Sin cambios respecto a v1.1. Specs 3080 + 32GB RAM + SSD/HDD validadas en implementación.)*

---

## 🏗️ ARQUITECTURA DE 3 CAPAS

*(Diagrama sin cambios respecto a v1.1. Validado en producción: 3 capas funcionando, Llama 3.2 vía proxy `kit-grammar-fire-least.trycloudflare.com`, matcher runtime en nexus-ai.js `_loadKB()` operativo.)*

---

## 📁 ESTRUCTURA DE ARCHIVOS

> **🔄 v1.2:** estructura real post-implementación. Incluye `pipeline/validator.py`, `pipeline/run_pipeline.py` (orquestador), `pipeline/chunks/`, `pipeline/kb_draft/`, `pipeline/enrich_from_misses.py` que no estaban en v1.1. Mantiene carpetas planificadas aún no creadas marcadas con `(FASE N)`.

```
portal_v19.3.0/
│
├── Materiales/                      ← INPUT
│   ├── CONTABILIDAD/                ← ingesta real (estructura plana por materia, no por cuatrimestre)
│   ├── CS SOCIALES/
│   ├── ADMINISTRACIÓN/
│   └── PROPEDÉUTICA/                ← sin ingestar aún
│
├── kb/                              ← OUTPUT de Mistral (deploy-ready)
│   ├── knowledge_base.json          ← 138 entries (18/04)
│   ├── schedule_kb.json             ← 8 entries
│   ├── manifest.json
│   ├── qa_cache.json                ← (FASE 3, no existe aún)
│   └── pending_questions.json       ← (FASE 3, no existe aún)
│
├── pipeline/
│   ├── ingest_pdf.py
│   ├── ingest_schedule.py
│   ├── generate_kb.py
│   ├── validator.py                 ← solo estructural hoy, se reforzará (FASE 2.5)
│   ├── enrich_from_misses.py        ← (parcial, no cableado al runtime aún)
│   ├── run_pipeline.py              ← orquestador
│   ├── test_matcher.js              ← smoke test matcher
│   ├── config.py
│   ├── requirements.txt
│   ├── prompts/
│   │   └── nexus_academic.md
│   ├── chunks/
│   └── kb_draft/
│
├── nexus-ai.js                      ← _loadKB() implementado (línea 1444)
├── nexus-ai-proxy/                  ← proxy Cloudflare a Ollama local
│                                      ⚠️ Bug documentado: hardcodea OLLAMA_MODEL
│                                      (ver sección RIESGOS v1.2)
├── sw.js                            ← kb/*.json con strategy network-first
└── scripts/
    ├── build.js
    └── verify_deploy.py
```

---

## 📜 CONTRATOS DE DATOS

*(Contratos `knowledge_base.json` y `manifest.json` sin cambios estructurales respecto a v1.1.)*

> **🔄 v1.2:** agregado contrato `validation_report.json` como output de la nueva Fase 2.5 (validator semántico):

### `validation_report.json` (nuevo — output del validator semántico)

```json
{
  "run_at": "2026-04-25T10:00:00Z",
  "validator_version": "2.0-semantic",
  "total_entries_analyzed": 138,
  "passed": 54,
  "failed_semantic": 82,
  "failures_by_rule": {
    "domain_leak": 12,
    "pattern_template_monotony": 71,
    "author_mention_missing_when_required": 68,
    "empty_answer_field": 0
  },
  "failures": [
    {
      "entry_id": "estado_concepto",
      "rules_failed": ["domain_leak"],
      "evidence": "Entry en materia=Sociales menciona 'activo' y 'pasivo' en sentido contable (blacklist)",
      "action_recommended": "regenerate_or_delete"
    }
  ]
}
```

---

## 📚 REGLAS DE CALIDAD ACADÉMICA SUPREMA

> **🔄 v1.2:** la sección de validación se desdobla en dos niveles — **estructural** (ya implementado) y **semántico** (nuevo, Fase 2.5). El validator v1.1 solo chequea estructura (refs, longitud, frases prohibidas); la evidencia del 18/04 demuestra que es insuficiente.

### Principios fundamentales

*(Sin cambios respecto a v1.1: precisión > síntesis, cero alucinación, profundidad conceptual, ejemplos concretos, trazabilidad, anti-repetición, jerarquía cognitiva.)*

### Anti-patrones prohibidos

*(Sin cambios respecto a v1.1.)*

### Formato obligatorio de respuestas

*(Sin cambios respecto a v1.1.)*

### Validación automática — NIVEL 1: estructural *(ya implementado en `validator.py` actual)*

Cada entry generada se valida contra:

- Longitud mínima (>80 chars si es `answer_full`)
- Presencia de ejemplo si `type: material_concept`
- Source_refs no vacío
- No contiene frases prohibidas ("como modelo de lenguaje", "no tengo información", etc.)

### Validación automática — NIVEL 2: semántica *(🆕 v1.2, Fase 2.5)*

Evidencia empírica (18/04) que motiva este nivel: de las 84 entries en `materia: Sociales`, al menos 12 presentan alucinación tipo **domain leak** (mezcla contenido contable con sociológico) y 71 presentan **pattern template monotony** (todos los patterns siguen la plantilla `"qué es X"/"definición de X"/"explicame X"`, sin mencionar autor ni contexto), haciendo imposible el match con queries naturales. Todas estas entries están marcadas `validated: true` por el validator v1.

Reglas semánticas a agregar:

| # | Regla | Qué valida | Acción si falla |
|---|---|---|---|
| S1 | **Domain leak** | Entry con `materia: Sociales` no menciona keywords contables (`activo`, `pasivo`, `partida doble`, `patrimonio neto`, `ecuación contable`). Blacklist simétrica por materia. | `validated: false` + flag `needs_regeneration` |
| S2 | **Pattern diversity** | Al menos 30% de los patterns deben diferir del template base. Medido por diff sintáctico. | `validated: false` + re-prompt a Mistral con instrucción de diversificar |
| S3 | **Author mention** | Si el chunk fuente proviene de un PDF con autor identificado (ej. "Bourdieu"), al menos un pattern debe mencionar al autor. | `validated: false` + auto-patch (añadir pattern con autor) |
| S4 | **Id uniqueness semantic** | Rechazar IDs duplicados semánticamente (`bourdieu_concepto_3`, `bourdieu_concepto_5`, `bourdieu_concepto_7` sobre el mismo tema). | `validated: false` + merge sugerido |
| S5 | **Chunk-answer coherence** | Muestreo 10% manual: comparar chunk fuente vs `answer_full`. Si >5% del muestreo es incoherente, bloquear deploy del batch. | Bloqueo de batch + revisión humana obligatoria |

Entries que fallan Nivel 2 → **no se deployan** y pasan a queue de revisión.

---

## 🔁 WATCHER DE MATERIALES

> **🔄 v1.2:** el watcher automático se pospone hasta que el validator semántico esté operativo y la auditoría retroactiva (Fase 2.5) esté completa. **Mantener modo manual** durante 2-3 semanas post-demo para evitar que ingesta automática siga metiendo entries alucinadas al KB productivo. Trigger manual `python pipeline/run_pipeline.py --append-kb` sin cambios.

---

## 🎯 RUNTIME MATCHER

*(Sin cambios de diseño respecto a v1.1. Implementación Jaccard + fuzzy actual cumple criterio de latencia <20ms observado en producción.)*

> **🔄 v1.2 — evidencia empírica:** test del 18/04 confirma que el threshold de 0.7 es correcto. El problema detectado NO es del matcher sino de los patterns de origen (ver Fase 2.5, regla S2). Patterns diversos → matcher funciona; patterns monótonos → matcher no puede compensar.

---

## 🌐 CAPA 4 — API PAGA COMO ÚLTIMO FALLBACK (FUTURO, APAGADA POR DEFAULT)

*(Sin cambios respecto a v1.1. El hook sigue siendo Fase 6+, apagado por default.)*

---

## 🔄 AUTO-MEJORA — USUARIOS COMO AGENTES DEL SISTEMA

> **🔄 v1.2 — pre-requisito agregado:** el flujo de auto-mejora (MISS → queue → Mistral batch → revisión humana → KB) **solo se activa después de Fase 2.5**. Rationale: si el validator semántico no está operativo, cada iteración de auto-mejora agregará entries potencialmente alucinadas al KB, amplificando el problema observado el 18/04 en lugar de mitigarlo.

*(Resto de la sección — contrato `pending_questions.json`, flujo end-to-end, caso de uso estrella, flags de seguridad — sin cambios respecto a v1.1.)*

---

## 🧬 MODULARIDAD — CÓMO SE USA PARA GYM

> **🔄 v1.2 — pre-requisito formal:** Fase 5 (replicar a GYM) requiere cumplir **TODAS** estas condiciones antes de arrancar:
>
> 1. Validator semántico v2.0 operativo (Fase 2.5 completa)
> 2. Auditoría retroactiva NEXUS completa: ≥ 95% de entries pasando validación semántica
> 3. Harness de 30-50 queries representativas con KB match rate ≥ 80%
> 4. Zero alucinación semántica verificada en muestreo del 10% de entries productivas
>
> **Justificación:** en dominio académico, alucinación = mala nota del alumno. En GYM, alucinación sobre contraindicaciones o técnica de ejercicio = **riesgo de lesión del cliente**. El mismo documento v1.1 reconoce esto en la sección 7 (Seguridad del contenido). Clonar la arquitectura con el validator actual propagaría el problema a un dominio de mayor riesgo.

*(Resto de la sección — tabla NEXUS vs GYM, comando de clonado — sin cambios respecto a v1.1.)*

---

## 🛣️ PLAN DE IMPLEMENTACIÓN POR FASES

> **🔄 v1.2 — cambios en el plan:**
> - **Fases 0, 1, 2: COMPLETADAS** al 18/04.
> - **Nueva Fase 2.5** insertada entre Fase 2 y Fase 3.
> - **Fases 3 y 4 reordenadas**: Fase 3 (fallback + qa_cache) arranca antes que Fase 4 (watcher automático).
> - **Fase 5 (GYM) bloqueada** hasta cumplir pre-requisitos de la sección MODULARIDAD.

### **FASE 0 — Setup** ✅ COMPLETADA (17/04)

*(Sin cambios.)*

---

### **FASE 1 — Pipeline básico schedule** ✅ COMPLETADA (17/04)

*(Sin cambios.)*

---

### **FASE 2 — PDF ingestion** ✅ COMPLETADA (17-18/04)

Resultado en producción al 18/04:
- 138 entries deployadas en `knowledge_base.json`
- 84 Sociales (Bourdieu U3), 40 Contabilidad (Itinerarios II-III), 13 Administración (Chiavenato), 1 otra
- Manual patches: 2 Contabilidad (ecuacion_contable, activo_vs_pasivo) + 2 Sociales (bourdieu_estado_concepto, bourdieu_tradicion_marxista)
- Test 5 queries: 5/5 KB hit con score 1.00 post-patch (era 2/5 pre-patch)

---

### **🆕 FASE 2.5 — Validator semántico + auditoría retroactiva** (3-4 días post-demo)

Objetivos:

1. **Implementar `validator_v2.py`** con las 5 reglas semánticas S1-S5 (ver sección Reglas de Calidad).
2. **Correr auditoría retroactiva** sobre las 138 entries actuales. Output: `kb/validation_report.json`.
3. **Purgar/regenerar** entries que fallan Nivel 2:
   - Candidatos confirmados: `estado_concepto`, `marcado_concepto`, `bourdieu_concepto_3`, `bourdieu_concepto_5`, `bourdieu_concepto_7` (5-12 entries identificadas preliminarmente)
   - Para entries regenerables: re-prompt a Mistral con instrucciones diversificadas
   - Para entries no regenerables: purgar y documentar gap de cobertura
4. **Integrar validator v2 al pipeline** `run_pipeline.py`: toda ingesta nueva pasa por Nivel 1 + Nivel 2 antes de append-kb.
5. **Harness de regresión**: script con 30-50 queries representativas que se corre antes de cada deploy. Fail si KB match rate < 80%.

**Entregable:** pipeline robusto contra alucinaciones. KB productivo verificado semánticamente.

**Pre-requisito para:** Fase 3, Fase 4, Fase 5 auto-mejora.

---

### **FASE 3 — Fallback dinámico** (reordenada, ahora post-2.5; 1-2 días)

> **🔄 v1.2:** Nota operativa crítica — antes de implementar esta fase, resolver el bug documentado de `nexus-ai-proxy/server.js`, que hardcodea `OLLAMA_MODEL` e ignora el field `model` del body del request. Sin ese fix, un MISS no puede dirigirse a Mistral vía proxy — siempre forzaría Llama3.2.

*(Resto del diseño — Llama detecta MISS → Mistral local → `qa_cache.json` → próxima pregunta similar = HIT — sin cambios respecto a v1.1.)*

---

### **FASE 4 — Watcher automático** (post-Fase 3; 1 día)

> **🔄 v1.2:** la activación del watcher está condicionada a:
> 1. Fase 2.5 operativa (validator semántico integrado al pipeline)
> 2. Harness de regresión verde por al menos 7 días consecutivos con KB cambiante
>
> Sin ambas condiciones, mantener modo manual (`python pipeline/run_pipeline.py --append-kb --pdf ...`).

*(Resto — hash sha256, /Materiales/_new/, modo incremental — sin cambios respecto a v1.1.)*

---

### **FASE 5 — Replicar para GYM** (bloqueada hasta cumplir pre-requisitos)

*(Ver pre-requisitos formales en sección MODULARIDAD v1.2.)*

---

**Tiempo total estimado revisado:**
- Fases 0-2: ✅ hechas (2 días efectivos vs 4-5 estimados)
- Fase 2.5: 3-4 días (NUEVA)
- Fase 3: 1-2 días (nota: sumar 0.5 día por fix del proxy)
- Fase 4: 1 día
- Fase 5: 2 días (post pre-requisitos)

**Total revisado: 9-12 días** (antes 7-10). Los 2-3 días adicionales compran robustez pre-GYM y evitan propagación de alucinaciones al dominio de mayor riesgo.

---

## ⚠️ RIESGOS Y MITIGACIONES

> **🔄 v1.2:** matriz ampliada. Agregados 4 riesgos operativos observados durante Fases 0-2 que v1.1 no anticipaba. Recalibrada la probabilidad del riesgo "Mistral genera entries inválidas" de Media → **Alta confirmada** con evidencia empírica.

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Mistral genera entries con alucinación semántica pese a `validated: true` | **Alta (confirmada 18/04)** | **Alto** | **Fase 2.5 — validator semántico v2 con reglas S1-S5** |
| Matcher runtime falla con query rara | Media | Bajo | Fallback a Llama + eventualmente Mistral |
| PDFs corruptos rompen pipeline | Media | Medio | Try/catch por archivo, log, no abortar batch |
| Mistral tarda demasiado en batch | Baja | Bajo | Es offline — no importa |
| VRAM insuficiente con 2 modelos cargados | Baja | Alto | Usar Q4 en ambos (probado con headroom) |
| Cache kb crece sin límite | Media | Bajo | Policy de poda: entries con hit_count=0 por >30 días |
| Watcher duplica procesamiento | Media | Bajo | Lockfile + hash check |
| Latencia runtime degrada UX | Baja | Alto | Matcher <10ms + template render sincrónico — validado 7-13ms en prod |
| **🆕 Git index corrompe en sandbox/Windows** | **Media (recurrente)** | Medio | Fix documentado: `rm -f .git/index .git/index.lock && git read-tree HEAD`. Correr desde PowerShell local, no desde sandbox |
| **🆕 Paths con acentos (á, ó) fallan en PowerShell con newlines** | Media | Bajo | Usar comillas dobles sin newlines en el comando. Documentado en DEMO_CONTEXT |
| **🆕 `nexus-ai-proxy/server.js` hardcodea `OLLAMA_MODEL`, ignora el field `model` del body** | **Alta (confirmada)** | **Alto para Fase 3** | Arreglar proxy antes de Fase 3 (leer `body.model` y forwardear a Ollama). Juan corre `generate_kb.py` directo contra `localhost:11434` por ahora |
| **🆕 Contabilidad U1 (Itinerario I) son scans sin OCR, 0 chars extraíbles por pypdf** | Alta (confirmada) | Medio | OCR pipeline como sub-fase entre 2.5 y 3. Task #15 del DEMO_CONTEXT. `pytesseract` + `pdf2image` candidatos |

---

## ✅ CRITERIOS DE ÉXITO (MÉTRICAS PARA LA DEMO)

> **🔄 v1.2:** criterios endurecidos. El criterio débil *"50% de respuestas académicas incluyen source_refs"* se elimina — **el 100% de las entries alucinadas observadas el 18/04 tienen source_refs válidos**, es decir, la presencia de source_refs no distingue señal de ruido. Reemplazado por métricas que sí discriminan.

### Criterios técnicos — v1.2

1. **Consistencia**: la misma pregunta retorna la misma respuesta 10 veces seguidas → 100% idéntico *(sin cambios)*
2. **Zero alucinación en schedule**: las 3 preguntas clásicas responden correcto siempre *(sin cambios)*
3. **🆕 KB match rate en queries naturales ≥ 80%**, medido sobre un harness de 30-50 queries representativas. Medición actual (5 queries): 100% post-patch, 40% pre-patch. Sample size insuficiente — expandir a 30+ queries antes de demo inversores.
4. **🆕 Zero alucinación semántica verificada** por muestreo manual del 10% de entries productivas por materia. Criterio de aprobación: < 5% de falsos positivos semánticos en el muestreo. Ejecutado trimestralmente + obligatorio antes de cada deploy a GYM.
5. **Latencia**: respuesta en <800ms para HITs, <3s para MISS con fallback *(sin cambios; medido 7-13ms para HITs en prod)*
6. **Cobertura**: kb_schedule contiene al menos 15 patterns de preguntas temporales *(sin cambios)*
7. **Modularidad demostrable**: mostrar que el mismo código sirve para Gym con solo cambiar kb *(sin cambios; bloqueado por pre-requisitos MODULARIDAD v1.2)*

### Criterios de negocio — v1.2

*(Sin cambios respecto a v1.1.)*

---

## 🧠 PRINCIPIOS QUE NO NEGOCIAMOS

*(Sin cambios respecto a v1.1. Los 7 principios siguen siendo los mismos.)*

> **🔄 v1.2 — clarificación operativa del principio 7** (*"El usuario nunca debe sentir 'no sé' sin que el sistema ya esté resolviéndolo"*): este principio implica Fase 3 operativa (MISS → queue → Mistral batch). Hasta que Fase 3 exista, la realidad operacional es que los MISS hoy se tiran y se repiten cada vez — principio incumplido por arquitectura, no por design.

---

## ✅ DECISIONES APROBADAS POR JUAN

*(Tabla v1.1 sin cambios. Aprobaciones del 17/04 siguen vigentes.)*

> **🔄 v1.2 — decisiones adicionales a confirmar con auditor:**
>
> | Pregunta | Propuesta v1.2 |
> |---|---|
> | ¿Implementar Fase 2.5 antes o después de demo inversores? | Después. Demo 80% del 20/04 ya es funcional con Fase 2 completa. Fase 2.5 es hardening para GYM |
> | ¿Purgar entries alucinadas pre-demo o solo flaggearlas? | Flaggear + no preguntarlas en vivo. Purgar post-demo con validator v2 |
> | ¿OCR para Itinerario I entra en 2.5 o en fase propia? | Sub-fase 2.5.1 (independiente del validator pero misma ventana temporal) |
> | ¿Reforzar proxy antes de Fase 3? | Sí, es pre-requisito estructural de Fase 3 |

---

## 📅 PLAN CONCRETO HASTA EL LUNES (DEMO 80%)

> **🔄 v1.2:** plan original (viernes-domingo-lunes) se ejecutó adelantado. Estado al 18/04 16:00:
> - ✅ Viernes 17: Fase 0 + Fase 1 completadas
> - ✅ Sábado 18 (mañana): Fase 2 completada, 138 entries en prod, 5/5 KB hit en test
> - 📌 Sábado 18 (tarde) + Domingo 19: **nuevas prioridades revisadas** (abajo)

### Sábado 18 (resto) + Domingo 19 — plan revisado

**Prioridad 1 — Demo-ready (bloqueante para lunes):**
- Re-test en `portal-fce-v2.vercel.app` con hard reload, confirmar 5/5 KB hit en vivo
- Armar `DEMO_FLOW.md` con 8-10 queries diversas (Contabilidad + Sociales + Admin) verificadas contra KB actual
- Script ad-hoc de flaggeo preliminar (precursor Fase 2.5): identificar entries Sociales con keywords contables → lista de entries a NO preguntar en demo

**Prioridad 2 — Buffer (no bloqueante):**
- Corrección del commit message ambiguo de `b1dc22b` (ya documentado en DEMO_CONTEXT)
- Smoke test final + script de reset rápido

### Lunes 20 — demo

*(Sin cambios respecto a v1.1: verificación final, deploy, smoke test, script de reset.)*

### Post-lunes (semana 21-26 abril) — revisado

**Antes (v1.1):** Fase 3 + Fase 4 + Panel admin + Replicación GYM.
**Ahora (v1.2):**
- **21-24/04**: Fase 2.5 (validator semántico + auditoría retroactiva + OCR Itinerario I)
- **25-26/04**: Fase 3 (fallback + qa_cache + fix proxy)
- **27+**: Fase 4 (watcher), panel admin, y solo entonces Fase 5 GYM (si pre-requisitos cumplidos)

---

## 🧪 DECISIÓN SOBRE SEGURIDAD DEL CONTENIDO (punto 5 Juan)

> **🔄 v1.2:** sección fortalecida con escalón adicional (punto 6) motivado por evidencia del 18/04.

**Regla de oro no negociable**: ninguna respuesta productiva puede existir sin `source_refs` válido apuntando a material del docente/Juan.

**Protecciones escalonadas:**

1. **Validator local Nivel 1 (estructural)** — implementado, en `validator.py`
2. **🆕 Validator local Nivel 2 (semántico)** — Fase 2.5, en `validator_v2.py` con reglas S1-S5
3. **Runtime matcher**: threshold mínimo 0.7 de fuzzy score; por debajo → fallback explícito
4. **Respuesta UI**: toda answer académica muestra fuente inline
5. **Gym — protección extra**: `safety_notes` + `contraindications` obligatorios
6. **🆕 Harness de regresión pre-deploy**: 30-50 queries representativas que deben dar KB match rate ≥ 80% antes de aceptar un deploy a main. Implementación en `scripts/regression_queries.py` (Fase 2.5)
7. **Panel admin semanal**: Juan revisa qué entries se crearon, qué quedó pendiente, qué fallback se disparó

**En palabras de Juan**: *"un alumno puede estar estudiando para un parcial que le define su futuro académico o un cliente del gimnasio haciendo ejercicios que tienen que estar bien explicados porque podría lesionarse."* — esta sigue siendo la estrella polar del sistema, y la motivación principal de Fase 2.5.

---

## 📎 ANEXO v1.2 — Evidencia empírica que motiva los cambios

### Test visual de 5 queries (18/04, pre-patches)

| # | Query | Esperado | Observado |
|---|---|---|---|
| 1 | ¿Ecuación contable básica? | KB `ecuacion_contable` 1.00 | ✅ KB 1.00, 13ms |
| 2 | Diferencia activo y pasivo | KB `activo_vs_pasivo` 1.00 | ✅ KB 1.00, 7ms |
| 3 | ¿Bourdieu sobre el Estado? | KB match alguna entry Bourdieu | ❌ **LLM fallback, 5.4s, 424 tok** |
| 4 | ¿Tradición marxista del Estado? | KB `tradicion_marxista` | ❌ **LLM fallback, 2.8s, 421 tok, contenido falso a posición de Bourdieu** |
| 5 | ¿Categorías estatales según Bourdieu? | KB match | ❌ **LLM fallback, 3.3s, 453 tok** |

Score: **2/5 KB hit (40%)**, muy por debajo del criterio v1.2 de ≥80%.

### Diagnóstico del fallo en queries 3-5

Al inspeccionar el KB post-test, las 84 entries Sociales contenían los siguientes problemas:

1. **Ninguna mencionaba "Bourdieu"** en sus patterns pese a provenir del PDF de Bourdieu
2. **Todos los patterns siguen 3 plantillas**: `"qué es X"`, `"definición de X"`, `"explicame X"`
3. **IDs duplicados semánticamente**: `bourdieu_concepto_3`, `_5`, `_7`; `estado_concepto`, `_3`, `_6`; `calendario_concepto`, `_2`, `_3`
4. **Alucinación contable en entry `estado_concepto`**: la respuesta decía que el Estado sociológico tiene *"activo (relaciones con terceros), pasivo (relaciones con otros miembros del Estado), y estado neto (activo − pasivo)"*, mezclando ecuación contable con sociología. La entry pasó el validator v1 con `validated: true` y tiene `source_refs` apuntando correctamente al PDF de Bourdieu p2.

### Fix aplicado (patch quirúrgico, no sistémico)

- Agregadas 2 entries manuales (`bourdieu_estado_concepto`, `bourdieu_tradicion_marxista`) con citas literales del PDF (páginas 3, 4, 6, 7, 14)
- Patch de 10 patterns adicionales a `clasificaciones_sociales` que incluyen "Bourdieu" y "categorías estatales"

**Resultado post-patch:** 5/5 KB hit con score 1.00.

### Conclusión

El fix manual resuelve las 3 queries del test, pero **no resuelve el problema sistémico**: las entries alucinadas siguen vivas en KB, pueden matchear queries que no se incluyeron en el test, y el pipeline actual seguirá generando entries similares cada vez que se ingesta un PDF nuevo. De ahí la necesidad de Fase 2.5 con validator semántico v2.

---

*Documento vivo. Actualizar cada vez que cambie una decisión de arquitectura.*
*v1.1 — 17 abril 2026 (aprobación inicial de Juan, arranque de implementación)*
*v1.2 — 18 abril 2026 (revisión post-implementación Fases 0-2, para auditoría externa)*
