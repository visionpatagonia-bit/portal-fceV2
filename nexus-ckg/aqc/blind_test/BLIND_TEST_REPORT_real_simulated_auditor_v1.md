# Blind Test Report — real_simulated_auditor

- **Version**: 1.0
- **Generator**: Auditor externo (Ronda 4, 2026-04-23) — protocolo 'alumno bruto desprolijo' con 3 condiciones explícitas: (1) lenguaje natural desprolijo, (2) sin alineación a keywords, (3) mezcla de conceptos / ambigüedad forzada
- **Generated at**: 2026-04-23

## Caveat

Batch generado por el auditor externo SIN mirar el registry ni el router. Blind para Juan y para el router. El caveat de contaminación es distinto al de blind_synthetic_v1: allá el generator era Claude que había sellado el registry Día 4 (contaminación alta); acá el generator es el auditor externo que nunca vio el registry (contaminación mínima, probablemente algún sesgo por haber leído el informe auditor Día 4 que mencionaba los 15 conceptos). Ground truth asignado por Claude como juez profesional sobre el TEXTO de la query, no sobre las keywords del router.

## Métricas agregadas

- **Total queries**: 10
- **blind_test_accuracy**: **0.6**
- **routing_precision** (cuando rutea, ¿acierta?): **0.5556**
- **routing_recall** (¿rutea todo lo que debe?): **0.5556**
- **refuse_precision** (cuando no rutea, ¿es correcto?): **1.0**
- framework_accuracy_on_routed: 0.7778

### Breakdown por tipo

- correct_route:  5
- refuse_ok:      1
- wrong_route:    4  ← router ruteó mal
- refuse_bad:     0  ← router no ruteó y debió
- over_route:     0  ← router ruteó y no debió

### Failure reason breakdown

- wrong_keyword_trigger: 2
- ambiguous_match: 2

## Detalle por query

### ✅ [a1] correct_route

- **Query**: profe cuando algo pasa de gasto a activo o eso no existe?
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['activo', 'gasto'] (num_matched=2)
- **Matched keywords (top)**: ['activo']
- **Judge note**: Pregunta sobre capitalización de costos. La pregunta real es cuándo un desembolso deja de ser gasto del período y se reconoce como activo (capitalización). Sujeto final: 'activo'. Menciona también 'gasto' → esperable que el router matchee ambos. Espejo de s4 del synthetic.

### ❌ [a2] wrong_route

- **Query**: una marca que crea una empresa se puede contar como activo o no?
- **Ground truth**: concept=marca_generada_internamente framework=IASB
- **Router**:       concept=activo framework=NUA confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['activo'] (num_matched=1)
- **Matched keywords (top)**: ['activo']
- **Failure reason**: wrong_keyword_trigger
- **Judge note**: Paráfrasis directa de 'marca generada internamente' (NIC 38 §63). El router tiene 'marca generada internamente', 'marca autogenerada', 'marca propia', 'marca desarrollada internamente' como keywords — la query usa 'marca que crea una empresa' que es construcción sintáctica distinta. Menciona 'activo' al final → es probable wrong_route a 'activo' porque 'activo' sí matchea. Variante más explícita que s2 del synthetic.

### ✅ [a3] correct_route

- **Query**: ingreso es lo mismo que ganancia o estoy mezclando?
- **Ground truth**: concept=ingreso framework=RT_16_HISTORIC
- **Router**:       concept=ingreso framework=RT_16_HISTORIC confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['ingreso'] (num_matched=1)
- **Matched keywords (top)**: ['ingreso']
- **Judge note**: Idéntico a s3 del synthetic. 'ganancia' (sinónimo no listado) + 'ingreso' (listado) → router debería rutear a 'ingreso'.

### ✅ [a4] correct_route

- **Query**: si compro algo para vender despues eso es gasto o activo?
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['activo', 'gasto'] (num_matched=2)
- **Matched keywords (top)**: ['activo']
- **Judge note**: Pregunta sobre mercadería para reventa — concepto de bienes de cambio / inventarios. No hay 'inventarios' en el registry. La pregunta real apunta a reconocimiento como activo (bien de cambio) vs gasto. Menciona también 'vender' (sinónimo de 'venta' que está en keywords de 'ingreso') y 'gasto' y 'activo'. Triple match ambiguo — caso difícil. GT: 'activo'.

### ❌ [a5] wrong_route

- **Query**: porque dicen que el patrimonio cambia si gasto plata si la plata ya la tenia?
- **Ground truth**: concept=gasto framework=RT_16_HISTORIC
- **Router**:       concept=patrimonio_neto framework=RT_16_HISTORIC confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['gasto', 'patrimonio_neto'] (num_matched=2)
- **Matched keywords (top)**: ['patrimonio']
- **Failure reason**: ambiguous_match
- **Judge note**: Pregunta conceptual sobre ecuación patrimonial y efecto del gasto sobre el patrimonio. El dict de 'gasto' tiene 'disminucion del patrimonio' como keyword. La query menciona 'gasto' (y 'gastos') y 'patrimonio'. Probable ambiguous match entre 'gasto' y 'patrimonio_neto'. GT: 'gasto' porque la pregunta es sobre POR QUÉ el gasto afecta el patrimonio.

### ✅ [a6] correct_route

- **Query**: un activo puede no ser algo fisico o siempre tiene que ser algo que tengo?
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['activo'] (num_matched=1)
- **Matched keywords (top)**: ['activo']
- **Judge note**: Pregunta sobre definición de activo en NUA (recurso controlado vs posesión física). Keywords: 'activo' único match claro. Espejo de s6 del synthetic. Expected correct_route.

### ✅ [a7] correct_route

- **Query**: cuando algo no se puede poner como activo aunque tenga valor?
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['activo'] (num_matched=1)
- **Matched keywords (top)**: ['activo']
- **Judge note**: Pregunta sobre criterios de reconocimiento / exclusiones de activos (intangibles autogenerados, plusvalía, marcas). Alternativa: podría ser 'plusvalia_generada_internamente' o 'marca_generada_internamente' (los dos ejemplos clásicos). Keyword explícita: 'activo'. GT conservador: 'activo'.

### ❌ [a8] wrong_route

- **Query**: si algo me da plata pero no lo vendi todavia es ingreso igual?
- **Ground truth**: concept=devengado framework=NUA
- **Router**:       concept=ingreso framework=RT_16_HISTORIC confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['ingreso'] (num_matched=1)
- **Matched keywords (top)**: ['ingreso']
- **Failure reason**: wrong_keyword_trigger
- **Judge note**: Pregunta sobre devengamiento (reconocer ingreso sin venta realizada). Menciona 'ingreso' (keyword de 'ingreso') pero NO 'devengado', 'percibido', 'hecho sustancial'. GT: 'devengado'. Espejo de s5 del synthetic — predice wrong_route a 'ingreso'.

### ❌ [a9] wrong_route

- **Query**: el gasto siempre baja el patrimonio o hay excepciones?
- **Ground truth**: concept=gasto framework=RT_16_HISTORIC
- **Router**:       concept=patrimonio_neto framework=RT_16_HISTORIC confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['gasto', 'patrimonio_neto'] (num_matched=2)
- **Matched keywords (top)**: ['patrimonio']
- **Failure reason**: ambiguous_match
- **Judge note**: Pregunta sobre definición de gasto y su efecto sobre patrimonio. 'gasto' y 'patrimonio' ambos en dict. GT: 'gasto' (sujeto de la pregunta). Posible ambiguous_match.

### ✅ [a10] refuse_ok

- **Query**: por que algunas cosas no se pueden contabilizar aunque existan?
- **Ground truth**: concept=None framework=None
- **Router**:       concept=None framework=None confidence=none
- **Router reason**: no_concept_keyword_matched
- **All concepts hit**: [] (num_matched=0)
- **Matched keywords (top)**: []
- **Judge note**: Meta-pregunta sobre criterios de reconocimiento en general. No apunta a ningún concepto específico del registry (es pregunta sobre la teoría general de reconocimiento contable). Expected: refuse_ok (o over_route si el router matchea falsamente). Esta clasifica como 'difuso', el GT None obliga al sistema a declarar ignorancia cuando la pregunta es demasiado vaga.
