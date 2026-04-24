# Blind Test Delta — P6 v1 → P6R2 (refactor del auditor)

- **Fecha**: 2026-04-24
- **Scope**: refactor arquitectónico del intent layer según directiva del auditor
  (Ronda 2). Sin re-calibración, sin tocar keywords, sin agregar intents.
- **Objetivo**: validar que el refactor **preserva el comportamiento** medido en
  P6 v1 (juan 0.333 → 0.7333) y **agrega observabilidad** por capa.
- **Expectativa explícita del auditor**: "Si da 1.0: está sobreajustado (otra vez)".
  La señal de éxito no es mejorar números: es **bajar `wrong_route`, subir
  `correct_route`, mantener `refuse` razonable, y que nuevas frases no vistas
  empiecen a funcionar**. Eso ya había pasado en P6 v1. Acá solo validamos que
  la arquitectura nueva no rompió nada y **deja ver qué capa hace qué**.

---

## 1. Cambios estructurales (P6R2)

Antes (P6 v1): un solo archivo `aqc/intent_layer.py` con todo mezclado.

Ahora (P6R2): paquete `aqc/intent/` con responsabilidades separadas.

| Archivo | Responsabilidad |
|---|---|
| `aqc/intent/intent_map.py` | `IntentMatch` dataclass + `INTENT_TO_CONCEPT` (tabla estática intent → concept/framework). Sin lógica. |
| `aqc/intent/intent_patterns.py` | `VERB_NORMALIZATION` (forma → lema) como **single source of truth**. `VERB_FAMILIES` derivadas. Marcadores estructurales (negación, asimetría temporal, cuotas). Frases explícitas. |
| `aqc/intent/intent_detector.py` | `detect_intent()` entry point. Conflict check (0/1/>1 candidatos). Estado `_LAST_DETECTION` para harness. |
| `aqc/intent/__init__.py` | Re-exporta API pública (`detect_intent`, `get_last_detection`, `IntentMatch`, `INTENT_TO_CONCEPT`). |

Además:

- Nuevo campo en `Classification`: `routing_source: "intent" | "keyword" | "none"`.
  Se popula en **las 5 rutas de retorno** de `classify_query()`.
- Router reason strings: `intent_layer=...` → `intent=...` (coherencia con
  nombre del paquete nuevo).
- `aqc/intent_layer.py` (archivo viejo) convertido a **stub deprecated** que
  levanta `ImportError` si algún path legacy lo importa.

---

## 2. Resultado — 3 batches post-refactor

| Batch | Total | Accuracy | Prec | Recall | Refuse Prec | Intent routed | Keyword | None |
|---|---|---|---|---|---|---|---|---|
| `blind_synthetic_v1` | 10 | **1.0** | 1.0 | 1.0 | 1.0 | 2 | 7 | 1 |
| `blind_real_simulated_auditor_v1` | 10 | **1.0** | 1.0 | 1.0 | 1.0 | 1 | 8 | 1 |
| `blind_real_simulated_juan_v1` | 15 | **0.7333** | 0.7692 | 0.7692 | 0.5 | 6 | 7 | 2 |

**Comparación vs P6 v1** (mismo accuracy en los 3 batches):

| Batch | P6 v1 | P6R2 | Delta |
|---|---|---|---|
| synthetic | 1.0 | 1.0 | 0 |
| auditor | 1.0 | 1.0 | 0 |
| juan | 0.7333 | 0.7333 | 0 |

Conclusión: **el refactor no cambia decisiones de routing** — solo la arquitectura
y la observabilidad. Ningún query cambió de bucket.

---

## 3. Aporte real de la capa intent (observabilidad nueva)

Con `routing_source` podemos responder la pregunta del auditor:
**"¿P6 realmente mejora o solo tapa problemas?"**

### Por batch

| Batch | % resuelto por intent | % resuelto por keyword | % refuse |
|---|---|---|---|
| synthetic | 20% (2/10) | 70% (7/10) | 10% (1/10) |
| auditor | 10% (1/10) | 80% (8/10) | 10% (1/10) |
| juan | **40% (6/15)** | 47% (7/15) | 13% (2/15) |

El dato más honesto: en queries **sintéticas o diseñadas** (synthetic/auditor)
el keyword router ya hacía la mayor parte del trabajo. En el batch **real simulado
de Juan**, la capa intent resuelve **40% de las queries**, que es exactamente
donde el keyword router no llegaba (paráfrasis de B2 — vocabulario no visto).

### Precisión de la capa intent

En los 3 batches, `intent_precision = 1.0` — **cuando la capa intent rutea, acierta**.
No hay wrong_route ni over_route atribuibles a intent en ninguno de los batches.

Los errores de juan (2 wrong_route + 1 refuse_bad + 1 over_route = 4 fallas) son
todos del **keyword layer**, no del intent layer:

| Query | routing_source | result_type | Análisis |
|---|---|---|---|
| j2 | keyword | wrong_route | B2 — vocab nuevo no cubierto por intents actuales |
| j7 | keyword | wrong_route | Requiere intent `self_created_intangible` (P7) |
| j11 | none | refuse_bad | No keyword match, no intent match |
| j12 | keyword | over_route | Scope query ruteada como concept query |

Ninguna falla pide agregar un intent que ya existe. Las 4 son **gaps genuinos**
de la arquitectura actual, no overfitting.

### Conflict rate

En los 3 batches combinados (35 queries): **0 conflicts** — ningún query disparó
>1 intent simultáneamente. Esto valida que los 3 intents MVP son lo suficientemente
ortogonales para no pisarse. La validación `len(candidates) > 1 → None` existe
como safety net pero no está siendo ejercida en data real.

---

## 4. Validación de la doctrina del auditor

El auditor pedía estas 4 condiciones (Día 5, Ronda 2):

| Condición | Estado |
|---|---|
| "No integres P6 dentro del router" | ✅ Paquete `aqc/intent/` separado, 4 archivos. |
| "Output debe incluir routing_source" | ✅ Campo nuevo en Classification, 5 rutas populadas. |
| "Si el intent no es inequívoco → NO rutear" | ✅ `len(candidates) > 1 → return None` + `_LAST_DETECTION['conflict']=True`. |
| "Agregá métricas: detected / routed / fallback / conflict" | ✅ Bloque `intent_stats` en cada reporte. |

Orden de ejecución ("sin desviarte"):

| Paso | Estado |
|---|---|
| 1. Crear módulo intent/ | ✅ |
| 2. Implementar normalize (VERB_NORMALIZATION explícito) | ✅ |
| 3. Implementar 2 intents (en realidad 3 — carry-over de P6 v1, no nuevos) | ✅ |
| 4. Integrar sin tocar router (fuera del loop de keywords) | ✅ |
| 5. Loggear source | ✅ |
| 6. Correr los 3 batches | ✅ |
| 7. Recién ahí evaluar | ✅ (este documento) |

---

## 5. Qué NO se hizo (deliberadamente)

- **No se agregaron intents nuevos.** Los 3 MVP (`cash_timing_mismatch`,
  `value_change_without_sale`, `capitalization_doubt`) siguen siendo los únicos.
- **No se tocaron keywords.** `CONCEPT_KEYWORDS` y `AQC_DISAMBIGUATION_RULES`
  quedaron congeladas desde v0.5.1-router-hardened.
- **No se re-calibraron thresholds.** El router no tiene scoring numérico; esto
  es un checkpoint arquitectónico, no un ajuste fino.
- **No se buscó subir juan de 0.7333.** Las 4 fallas restantes son gaps genuinos
  que requieren decisión del auditor: agregar intents nuevos, expandir keywords
  dirigidos, o aceptar como "requiere revisión manual" (bucket B3).

---

## 6. Siguiente decisión pendiente (para el auditor)

Después de ver los 3 reportes P6R2, 3 caminos viables:

1. **Sellar v0.6.0-intent-layer** como tag estable. juan 0.7333 con observabilidad
   completa. Próximo paso: recolectar blind_real_v1 de Juan real (no simulado) y
   medir contra esta arquitectura.

2. **Expandir intents MVP a 4-5** agregando `self_created_intangible` (cubre j7)
   y/o refinar cash_timing para capturar j2 (B2 vocab nuevo). Riesgo: overfit
   otra vez sobre el mismo set juan.

3. **Parar en P6R2 + blind_real_v1** antes de tocar nada más. Obtener señal
   externa primero (Juan harvested), comparar con la simulada (Juan propio
   simulado por mí), y recién con esos dos puntos decidir si agregar intents.

Recomendación personal: opción **3**. Agregar intents sin señal externa es el
mismo error del ciclo B2 — ajustar contra un set conocido.

---

## 7. Artefactos

Reportes persistidos:

- `blind_test/blind_synthetic_v1_result_P6R2.json` + `BLIND_TEST_REPORT_synthetic_P6R2.md`
- `blind_test/blind_real_simulated_auditor_v1_result_P6R2.json` + `BLIND_TEST_REPORT_real_simulated_auditor_P6R2.md`
- `blind_test/blind_real_simulated_juan_v1_result_P6R2.json` + `BLIND_TEST_REPORT_real_simulated_juan_P6R2.md`

Código:

- `aqc/intent/` (paquete nuevo — 4 archivos)
- `aqc/keyword_router.py` — Classification con `routing_source`, import del paquete nuevo
- `aqc/intent_layer.py` — stub deprecated (legacy fail-loud)
- `aqc/blind_test/run_blind_test.py` — `get_last_detection()` wired, `intent_stats` aggregate + per-query breakdown
