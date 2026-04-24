# Blind Test Report — real_simulated_juan_v1

- **Version**: 1.0
- **Generator**: Juan (2026-04-24) — protocolo 'alumno bruto' propio, sin mirar registry ni CONCEPT_KEYWORDS del router. Queries pegadas en chat tal cual las escribió.
- **Generated at**: 2026-04-24

## Caveat

Origen distinto a blind_real_v1 (que queda reservado para queries harvested de alumnos reales). Este batch es la SIMULACIÓN de Juan de queries plausibles tipo alumno. Contaminación de 2do orden: (1) Juan conoce el proyecto y los 15 conceptos del registry (aunque no miró las keywords); (2) Claude vio las queries pegadas en chat antes de asignar ground truth (contaminación de lectura, no de ajuste — router NO tocado entre vista y run; baseline congelado en commit 8593e44 / tag v0.5.1-router-hardened). Ground truth asignado por Claude como juez profesional sobre el TEXTO de la query (qué está preguntando el alumno), no sobre lo que el router va a matchear. Este set es un puente entre el blind_real_simulated_auditor_v1 (low-contamination) y el blind_real_v1 harvested pendiente.

## Métricas agregadas

- **Total queries**: 15
- **blind_test_accuracy**: **0.7333**
- **routing_precision** (cuando rutea, ¿acierta?): **0.7692**
- **routing_recall** (¿rutea todo lo que debe?): **0.7692**
- **refuse_precision** (cuando no rutea, ¿es correcto?): **0.5**
- framework_accuracy_on_routed: 0.6667

### Breakdown por tipo

- correct_route:  10
- refuse_ok:      1
- wrong_route:    2  ← router ruteó mal
- refuse_bad:     1  ← router no ruteó y debió
- over_route:     1  ← router ruteó y no debió

### Failure reason breakdown

- no_keyword_match: 1
- wrong_keyword_trigger: 2
- over_routed_on_scope_query: 1

### Intent layer (P6R2)

- intent_detected_total: 6  (detectó 1+ intents)
- intent_routed_total:   6    (exactamente 1 → ruteó)
- intent_conflict_total: 0  (>1 candidatos → fallback)
- intent_fallback_total: 9  (total − routed)
- intent_precision:      1.0        (cuando rutea, ¿acierta?)
- routing_source breakdown: {'intent': 6, 'none': 2, 'keyword': 7}

## Detalle por query

### ✅ [j1] correct_route

- **Query**: che si compro algo pero lo pago en cuotas cuando cuenta como gasto
- **Ground truth**: concept=devengado framework=NUA
- **Router**:       concept=devengado framework=NUA confidence=medium source=intent
- **Router reason**: intent=cash_timing_mismatch__framework_inferred_from_intent
- **Intent**: detected=True routed=True conflict=False candidates=['cash_timing_mismatch']
- **All concepts hit**: ['gasto'] (num_matched=1)
- **Matched keywords (top)**: ['en cuotas']
- **Judge note**: Pregunta sobre reconocimiento temporal del gasto — cuándo se devenga vs cuándo se paga (cuotas). El sujeto lingüístico es 'gasto' pero la pregunta real es sobre devengamiento de un gasto cuando el pago es diferido. GT: devengado. Probable ambigüedad con 'gasto' (keyword) en el router.

### ❌ [j2] refuse_bad

- **Query**: una empresa puede tener valor por su nombre aunque no lo haya comprado
- **Ground truth**: concept=marca_generada_internamente framework=IASB
- **Router**:       concept=None framework=None confidence=none source=none
- **Router reason**: no_concept_keyword_matched
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: [] (num_matched=0)
- **Matched keywords (top)**: []
- **Failure reason**: no_keyword_match
- **Judge note**: Pregunta sobre reconocimiento de marca autogenerada. 'Por su nombre' apunta a marca más que a plusvalía (plusvalía es valor residual del negocio). Alternativa debatible: plusvalia_generada_internamente. GT: marca_generada_internamente.

### ✅ [j3] correct_route

- **Query**: si algo aumenta de precio pero no lo vendo eso es ganancia o no
- **Ground truth**: concept=realizacion framework=RT_16_HISTORIC
- **Router**:       concept=realizacion framework=RT_16_HISTORIC confidence=medium source=intent
- **Router reason**: intent=value_change_without_sale__framework_inferred_from_intent
- **Intent**: detected=True routed=True conflict=False candidates=['value_change_without_sale']
- **All concepts hit**: [] (num_matched=0)
- **Matched keywords (top)**: ['aumenta', 'aumenta de precio', 'no lo vendo']
- **Judge note**: Concepto clásico de realización — tenencia vs realización. En RT_16 el resultado por tenencia no se reconoce si no hay venta. La query no menciona 'realizacion' explícitamente; el sujeto lingüístico es 'ganancia'. Probable wrong_route a 'ingreso' o refuse_bad si nada matchea.

### ✅ [j4] correct_route

- **Query**: el patrimonio es lo mismo que lo que tengo en el banco o nada que ver
- **Ground truth**: concept=patrimonio_neto framework=NUA
- **Router**:       concept=patrimonio_neto framework=RT_16_HISTORIC confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['patrimonio_neto'] (num_matched=1)
- **Matched keywords (top)**: ['patrimonio']
- **Judge note**: Pregunta directa sobre definición de patrimonio. Match claro: 'patrimonio' está en keywords. Expected correct_route.

### ✅ [j5] correct_route

- **Query**: cuando dicen devengado es cuando entra la plata o cuando la gano
- **Ground truth**: concept=devengado framework=NUA
- **Router**:       concept=devengado framework=NUA confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['devengado'] (num_matched=1)
- **Matched keywords (top)**: ['devengado']
- **Judge note**: Pregunta directa sobre definición de devengado vs percibido. Match explícito: 'devengado' en query. Expected correct_route.

### ✅ [j6] correct_route

- **Query**: si una empresa pierde plata siempre baja el patrimonio?
- **Ground truth**: concept=patrimonio_neto framework=NUA
- **Router**:       concept=patrimonio_neto framework=RT_16_HISTORIC confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['patrimonio_neto'] (num_matched=1)
- **Matched keywords (top)**: ['patrimonio']
- **Judge note**: Pregunta sobre ecuación patrimonial — efecto del resultado negativo sobre el patrimonio. Sujeto de la pregunta: 'patrimonio'. Alternativa: gasto (pérdida → gasto). GT: patrimonio_neto porque la pregunta es sobre cómo se comporta el patrimonio, no qué es un gasto. Probable ambiguous_match gasto/patrimonio_neto.

### ❌ [j7] wrong_route

- **Query**: una marca que hizo una empresa desde cero se puede poner como activo?
- **Ground truth**: concept=marca_generada_internamente framework=IASB
- **Router**:       concept=activo framework=NUA confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['activo'] (num_matched=1)
- **Matched keywords (top)**: ['activo']
- **Failure reason**: wrong_keyword_trigger
- **Judge note**: Paráfrasis de marca autogenerada ('hizo desde cero'). Espejo de a7 del auditor. Menciona 'activo' al final → esperable que el router matchee ambos. Regla R1 (marca_over_activo) debería desambiguar.

### ✅ [j8] correct_route

- **Query**: si vendo algo pero no me lo pagan todavía cuenta como ingreso igual?
- **Ground truth**: concept=devengado framework=NUA
- **Router**:       concept=devengado framework=NUA confidence=medium source=intent
- **Router reason**: intent=cash_timing_mismatch__framework_inferred_from_intent
- **Intent**: detected=True routed=True conflict=False candidates=['cash_timing_mismatch']
- **All concepts hit**: ['ingreso'] (num_matched=1)
- **Matched keywords (top)**: ['pagan', 'no', 'todavia']
- **Judge note**: Pregunta clásica de devengamiento — reconocer ingreso sin cobro. Menciona 'ingreso' (keyword de 'ingreso') y 'venta' (derivada de 'vendo'). Regla R6 (devengado_over_ingreso) debería disparar si 'todavia' o 'no me lo pagan' matchea. Si no matchea vocabulario de devengado → wrong_route a ingreso.

### ✅ [j9] correct_route

- **Query**: los gastos siempre son cosas que ya pagué o pueden ser antes
- **Ground truth**: concept=devengado framework=NUA
- **Router**:       concept=devengado framework=NUA confidence=medium source=intent
- **Router reason**: intent=cash_timing_mismatch__framework_inferred_from_intent
- **Intent**: detected=True routed=True conflict=False candidates=['cash_timing_mismatch']
- **All concepts hit**: ['gasto'] (num_matched=1)
- **Matched keywords (top)**: ['pueden ser antes']
- **Judge note**: Pregunta sobre devengamiento de GASTOS (no de ingresos). '¿los gastos pueden ser antes del pago?' — sí, devengado. Menciona 'gastos' (keyword 'gasto'). Sin vocabulario de devengado explícito → probable wrong_route a gasto o refuse_bad.

### ✅ [j10] correct_route

- **Query**: el activo es todo lo que tengo o hay cosas que no entran
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['activo'] (num_matched=1)
- **Matched keywords (top)**: ['activo']
- **Judge note**: Pregunta sobre definición de activo (control vs posesión, exclusiones como intangibles autogenerados). Espejo de s6/a6. Match claro: 'activo'. Expected correct_route.

### ⚠️ [j11] over_route

- **Query**: cuando algo deja de servir se saca del activo o como es
- **Ground truth**: concept=None framework=None
- **Router**:       concept=activo framework=NUA confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['activo'] (num_matched=1)
- **Matched keywords (top)**: ['activo']
- **Failure reason**: over_routed_on_scope_query
- **Judge note**: Pregunta sobre baja de activos / deterioro / desvalorización. No tenemos 'baja de activo', 'deterioro', 'desvalorización' en el registry. GT: refuse (la pregunta específica está fuera de scope). Caso debatible — un juez más liberal podría aceptar ruteo a 'activo' como válido. Probable over_route si el router matchea 'activo'.

### ❌ [j12] wrong_route

- **Query**: lo que invierten los dueños cuenta como ingreso para la empresa?
- **Ground truth**: concept=patrimonio_neto framework=NUA
- **Router**:       concept=ingreso framework=RT_16_HISTORIC confidence=low source=keyword
- **Router reason**: concept_weak_and_framework_inferred
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: ['ingreso'] (num_matched=1)
- **Matched keywords (top)**: ['ingreso']
- **Failure reason**: wrong_keyword_trigger
- **Judge note**: Aportes de capital vs ingreso. Los aportes de los dueños son patrimonio, no ingreso — la pregunta del alumno refleja exactamente ese error común. GT: patrimonio_neto. Probable ambiguous_match ingreso/patrimonio_neto; sin regla específica → refuse (post-Ronda 5). Esto es refuse_bad si el GT es patrimonio_neto.

### ✅ [j13] correct_route

- **Query**: si compro una maquina eso es gasto o activo directamente
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=medium source=intent
- **Router reason**: intent=capitalization_doubt__framework_inferred_from_intent
- **Intent**: detected=True routed=True conflict=False candidates=['capitalization_doubt']
- **All concepts hit**: ['activo', 'gasto'] (num_matched=2)
- **Matched keywords (top)**: ['es gasto o activo', 'gasto o activo']
- **Judge note**: Espejo de a1/s4 — capitalización. Regla R5 (activo_over_gasto_capitalization) debería disparar. Expected correct_route via disambiguation.

### ✅ [j14] refuse_ok

- **Query**: el resultado del ejercicio es lo mismo que ganancia
- **Ground truth**: concept=None framework=None
- **Router**:       concept=None framework=None confidence=none source=none
- **Router reason**: no_concept_keyword_matched
- **Intent**: detected=False routed=False conflict=False candidates=[]
- **All concepts hit**: [] (num_matched=0)
- **Matched keywords (top)**: []
- **Judge note**: No tenemos 'resultado del ejercicio' como concepto en los 15 del registry. Pregunta sobre terminología de cierre de ejercicio, no sobre un concepto específico. GT: refuse. Probable over_route si matchea falsamente o refuse_ok si ningún keyword dispara.

### ✅ [j15] correct_route

- **Query**: si algo vale más con el tiempo eso se registra o no hasta venderlo
- **Ground truth**: concept=realizacion framework=RT_16_HISTORIC
- **Router**:       concept=realizacion framework=RT_16_HISTORIC confidence=medium source=intent
- **Router reason**: intent=value_change_without_sale__framework_inferred_from_intent
- **Intent**: detected=True routed=True conflict=False candidates=['value_change_without_sale']
- **All concepts hit**: [] (num_matched=0)
- **Matched keywords (top)**: ['vale mas', 'hasta venderlo']
- **Judge note**: Tenencia vs realización — variante de j3. RT_16 es estricto: solo se registra al realizar. Sin 'realizacion' explícita en query, sin 'resultado no realizado' → probable refuse_bad o wrong_route si matchea 'venta' ruteando a 'ingreso'.
