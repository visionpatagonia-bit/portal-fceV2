# Blind Test Report — real_simulated_auditor

- **Version**: 1.0
- **Generator**: Auditor externo (Ronda 4, 2026-04-23) — protocolo 'alumno bruto desprolijo' con 3 condiciones explícitas: (1) lenguaje natural desprolijo, (2) sin alineación a keywords, (3) mezcla de conceptos / ambigüedad forzada
- **Generated at**: 2026-04-23

## Caveat

Batch generado por el auditor externo SIN mirar el registry ni el router. Blind para Juan y para el router. El caveat de contaminación es distinto al de blind_synthetic_v1: allá el generator era Claude que había sellado el registry Día 4 (contaminación alta); acá el generator es el auditor externo que nunca vio el registry (contaminación mínima, probablemente algún sesgo por haber leído el informe auditor Día 4 que mencionaba los 15 conceptos). Ground truth asignado por Claude como juez profesional sobre el TEXTO de la query, no sobre las keywords del router.

## Métricas agregadas

- **Total queries**: 10
- **blind_test_accuracy**: **1.0**
- **routing_precision** (cuando rutea, ¿acierta?): **1.0**
- **routing_recall** (¿rutea todo lo que debe?): **1.0**
- **refuse_precision** (cuando no rutea, ¿es correcto?): **1.0**
- framework_accuracy_on_routed: 1.0

### Breakdown por tipo

- correct_route:  9
- refuse_ok:      1
- wrong_route:    0  ← router ruteó mal
- refuse_bad:     0  ← router no ruteó y debió
- over_route:     0  ← router ruteó y no debió

### Failure reason breakdown

_(sin fallas)_

### Intent layer (P6R2)

- intent_detected_total: 1  (detectó 1+ intents)
- intent_routed_total:   1    (exactamente 1 → ruteó)
- intent_conflict_total: 0  (>1 candidatos → fallback)
- intent_fallback_total: 9  (total − routed)
- intent_precision:      1.0        (cuando rutea, ¿acierta?)
- routing_source breakdown: {'keyword': 8, 'intent': 1, 'none': 1}

## Detalle por query

### ✅ [a1] correct_route

- **Query**: profe cuando algo pasa de gasto a activo o eso no existe?
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred__disambiguated_by=activo_over_gasto_capitalization
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['activo', 'gasto'] (num_matched=2)
- **Matched keywords (top)**: ['activo']
- **Judge note**: Pregunta sobre capitalización de costos. La pregunta real es cuándo un desembolso deja de ser gasto del período y se reconoce como activo (capitalización). Sujeto final: 'activo'. Menciona también 'gasto' → esperable que el router matchee ambos. Espejo de s4 del synthetic.

### ✅ [a2] correct_route

- **Query**: una marca que crea una empresa se puede contar como activo o no?
- **Ground truth**: concept=marca_generada_internamente framework=IASB
- **Router**:       concept=marca_generada_internamente framework=IASB confidence=medium source=keyword
- **Router reason**: concept_strong__framework_inferred_from_default__disambiguated_by=marca_over_activo
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['activo', 'marca_generada_internamente'] (num_matched=2)
- **Matched keywords (top)**: ['marca que crea', 'una marca que crea']
- **Judge note**: Paráfrasis directa de 'marca generada internamente' (NIC 38 §63). El router tiene 'marca generada internamente', 'marca autogenerada', 'marca propia', 'marca desarrollada internamente' como keywords — la query usa 'marca que crea una empresa' que es construcción sintáctica distinta. Menciona 'activo' al final → es probable wrong_route a 'activo' porque 'activo' sí matchea. Variante más explícita que s2 del synthetic.

### ✅ [a3] correct_route

- **Query**: ingreso es lo mismo que ganancia o estoy mezclando?
- **Ground truth**: concept=ingreso framework=RT_16_HISTORIC
- **Router**:       concept=ingreso framework=RT_16_HISTORIC confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['ingreso'] (num_matched=1)
- **Matched keywords (top)**: ['ingreso']
- **Judge note**: Idéntico a s3 del synthetic. 'ganancia' (sinónimo no listado) + 'ingreso' (listado) → router debería rutear a 'ingreso'.

### ✅ [a4] correct_route

- **Query**: si compro algo para vender despues eso es gasto o activo?
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=medium source=intent
- **Router reason**: intent=capitalization_doubt__framework_inferred_from_intent
- **Intent**: detected=True routed=True conflict=False candidates=['capitalization_doubt']
- **All concepts hit**: ['activo', 'gasto'] (num_matched=2)
- **Matched keywords (top)**: ['es gasto o activo', 'gasto o activo']
- **Judge note**: Pregunta sobre mercadería para reventa — concepto de bienes de cambio / inventarios. No hay 'inventarios' en el registry. La pregunta real apunta a reconocimiento como activo (bien de cambio) vs gasto. Menciona también 'vender' (sinónimo de 'venta' que está en keywords de 'ingreso') y 'gasto' y 'activo'. Triple match ambiguo — caso difícil. GT: 'activo'.

### ✅ [a5] correct_route

- **Query**: porque dicen que el patrimonio cambia si gasto plata si la plata ya la tenia?
- **Ground truth**: concept=gasto framework=RT_16_HISTORIC
- **Router**:       concept=gasto framework=RT_16_HISTORIC confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred__disambiguated_by=gasto_over_patrimonio
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['gasto', 'patrimonio_neto'] (num_matched=2)
- **Matched keywords (top)**: ['gasto']
- **Judge note**: Pregunta conceptual sobre ecuación patrimonial y efecto del gasto sobre el patrimonio. El dict de 'gasto' tiene 'disminucion del patrimonio' como keyword. La query menciona 'gasto' (y 'gastos') y 'patrimonio'. Probable ambiguous match entre 'gasto' y 'patrimonio_neto'. GT: 'gasto' porque la pregunta es sobre POR QUÉ el gasto afecta el patrimonio.

### ✅ [a6] correct_route

- **Query**: un activo puede no ser algo fisico o siempre tiene que ser algo que tengo?
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['activo'] (num_matched=1)
- **Matched keywords (top)**: ['activo']
- **Judge note**: Pregunta sobre definición de activo en NUA (recurso controlado vs posesión física). Keywords: 'activo' único match claro. Espejo de s6 del synthetic. Expected correct_route.

### ✅ [a7] correct_route

- **Query**: cuando algo no se puede poner como activo aunque tenga valor?
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['activo'] (num_matched=1)
- **Matched keywords (top)**: ['activo']
- **Judge note**: Pregunta sobre criterios de reconocimiento / exclusiones de activos (intangibles autogenerados, plusvalía, marcas). Alternativa: podría ser 'plusvalia_generada_internamente' o 'marca_generada_internamente' (los dos ejemplos clásicos). Keyword explícita: 'activo'. GT conservador: 'activo'.

### ✅ [a8] correct_route

- **Query**: si algo me da plata pero no lo vendi todavia es ingreso igual?
- **Ground truth**: concept=devengado framework=NUA
- **Router**:       concept=devengado framework=NUA confidence=medium source=keyword
- **Router reason**: concept_strong__framework_inferred_from_default__disambiguated_by=devengado_over_ingreso
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['devengado', 'ingreso'] (num_matched=2)
- **Matched keywords (top)**: ['no lo vendi todavia', 'no lo vendí todavía']
- **Judge note**: Pregunta sobre devengamiento (reconocer ingreso sin venta realizada). Menciona 'ingreso' (keyword de 'ingreso') pero NO 'devengado', 'percibido', 'hecho sustancial'. GT: 'devengado'. Espejo de s5 del synthetic — predice wrong_route a 'ingreso'.

### ✅ [a9] correct_route

- **Query**: el gasto siempre baja el patrimonio o hay excepciones?
- **Ground truth**: concept=gasto framework=RT_16_HISTORIC
- **Router**:       concept=gasto framework=RT_16_HISTORIC confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred__disambiguated_by=gasto_over_patrimonio
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['gasto', 'patrimonio_neto'] (num_matched=2)
- **Matched keywords (top)**: ['gasto']
- **Judge note**: Pregunta sobre definición de gasto y su efecto sobre patrimonio. 'gasto' y 'patrimonio' ambos en dict. GT: 'gasto' (sujeto de la pregunta). Posible ambiguous_match.

### ✅ [a10] refuse_ok

- **Query**: por que algunas cosas no se pueden contabilizar aunque existan?
- **Ground truth**: concept=None framework=None
- **Router**:       concept=None framework=None confidence=none source=none
- **Router reason**: no_concept_keyword_matched
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: [] (num_matched=0)
- **Matched keywords (top)**: []
- **Judge note**: Meta-pregunta sobre criterios de reconocimiento en general. No apunta a ningún concepto específico del registry (es pregunta sobre la teoría general de reconocimiento contable). Expected: refuse_ok (o over_route si el router matchea falsamente). Esta clasifica como 'difuso', el GT None obliga al sistema a declarar ignorancia cuando la pregunta es demasiado vaga.
