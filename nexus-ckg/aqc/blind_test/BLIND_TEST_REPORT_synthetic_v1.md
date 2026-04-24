# Blind Test Report — synthetic

- **Version**: 1.0
- **Generator**: Claude Sonnet 4.6 — protocolo 'alumno bruto' (chat/whatsapp style, sin jerga académica, errores de tipeo permitidos)
- **Generated at**: 2026-04-23

## Caveat

CONTAMINACIÓN DECLARADA: el generator conocía el universo de 15 conceptos que existen en el registry (sellado en Día 4) pero NO consultó el archivo CONCEPT_KEYWORDS del router al redactar. Las queries fueron diseñadas para emular mensajes reales tipo WhatsApp de un estudiante de contabilidad básica, incluyendo paráfrasis, ambigüedad, slang y al menos una query genuinamente fuera de scope. Ground truth asignado por criterio profesional (qué diría un experto en contabilidad que es la pregunta REAL, no lo que el router podría inferir). Este set detecta fallas obvias del router — NO valida robustez real. Validación fuerte requiere el set de queries reales (blind_real_v1.json) que recolecta Juan.

## Métricas agregadas

- **Total queries**: 10
- **blind_test_accuracy**: **0.5**
- **routing_precision** (cuando rutea, ¿acierta?): **0.6667**
- **routing_recall** (¿rutea todo lo que debe?): **0.4444**
- **refuse_precision** (cuando no rutea, ¿es correcto?): **0.25**
- framework_accuracy_on_routed: 0.8333

### Breakdown por tipo

- correct_route:  4
- refuse_ok:      1
- wrong_route:    2  ← router ruteó mal
- refuse_bad:     3  ← router no ruteó y debió
- over_route:     0  ← router ruteó y no debió

### Failure reason breakdown

- no_keyword_match: 3
- wrong_keyword_trigger: 2

## Detalle por query

### ✅ [s1] correct_route

- **Query**: che que es un activo
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['activo'] (num_matched=1)
- **Matched keywords (top)**: ['activo']
- **Judge note**: Query mínima, coloquial, sin framework explícito. Ground truth 'activo' claro. Framework 'NUA' esperado por default (es el framework más rico para el concepto). Testea baseline: ¿el router sobrevive lenguaje coloquial sin acentos y sin signos?

### ❌ [s2] refuse_bad

- **Query**: una marca que crea una empresa vale algo o no
- **Ground truth**: concept=marca_generada_internamente framework=IASB
- **Router**:       concept=None framework=None confidence=none
- **Router reason**: no_concept_keyword_matched
- **All concepts hit**: [] (num_matched=0)
- **Matched keywords (top)**: []
- **Failure reason**: no_keyword_match
- **Judge note**: Paráfrasis directa del concepto 'marca generada internamente'. El router tiene 'marca generada internamente' y 'marca autogenerada' como keywords, pero esta query usa 'marca que crea una empresa' — construcción sintácticamente distinta. Testea: ¿el router reconoce paráfrasis sintáctica de una frase clave?

### ✅ [s3] correct_route

- **Query**: ganancia es lo mismo que ingreso
- **Ground truth**: concept=ingreso framework=RT_16_HISTORIC
- **Router**:       concept=ingreso framework=RT_16_HISTORIC confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['ingreso'] (num_matched=1)
- **Matched keywords (top)**: ['ingreso']
- **Judge note**: La query introduce 'ganancia' (sinónimo no listado en keywords) pero también contiene 'ingreso' (sí listado). Ground truth es 'ingreso' — la pregunta es sobre el concepto ingreso. Framework no explícito, default RT_16_HISTORIC. Testea: match por palabra exacta sin considerar el sinónimo ausente.

### ✅ [s4] correct_route

- **Query**: cuando algo deja de ser gasto y pasa a activo
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['activo', 'gasto'] (num_matched=2)
- **Matched keywords (top)**: ['activo']
- **Judge note**: Query AMBIGUA a propósito. Menciona 'gasto' y 'activo' — ambos en dict. La pregunta real es sobre capitalización (algo que era costo del período ahora es activo). Ground truth debatible: 'activo' porque es el sujeto final de la pregunta. Testea: desambiguación cuando hay doble match. Router actual: el concepto con más keywords matched gana. Si 'gasto' matchea más que 'activo', rutea mal.

### ❌ [s5] wrong_route

- **Query**: si no cobre todavia ya lo puedo considerar ingreso
- **Ground truth**: concept=devengado framework=NUA
- **Router**:       concept=ingreso framework=RT_16_HISTORIC confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['ingreso'] (num_matched=1)
- **Matched keywords (top)**: ['ingreso']
- **Failure reason**: wrong_keyword_trigger
- **Judge note**: La pregunta REAL es sobre el concepto devengado (reconocimiento sin cobro). La query menciona 'ingreso' (keyword) pero NO menciona 'devengado', 'percibido' ni 'hecho sustancial'. Router esperado: va a rutear a 'ingreso' por single keyword match. Ground truth correcto: 'devengado'. Esta es exactamente la falla que el auditor quiere encontrar — query semánticamente sobre X, vocabulariamente sobre Y.

### ✅ [s6] correct_route

- **Query**: por que dicen que el activo no siempre es algo que tengo
- **Ground truth**: concept=activo framework=NUA
- **Router**:       concept=activo framework=NUA confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['activo'] (num_matched=1)
- **Matched keywords (top)**: ['activo']
- **Judge note**: Query sobre el concepto NUA de 'control' (la empresa controla el recurso aunque no lo 'tenga' en posesión física). Matchea 'activo' como token y también potencialmente 'controla' si el router normaliza. Ground truth 'activo' porque el sujeto explícito es 'activo'; alternativamente podría ser 'control'. Testea: ambigüedad entre concepto principal y concepto auxiliar.

### ✅ [s7] refuse_ok

- **Query**: q diferencia hay entre rt 16 y la nua
- **Ground truth**: concept=None framework=None
- **Router**:       concept=None framework=None confidence=none
- **Router reason**: no_concept_keyword_matched
- **All concepts hit**: [] (num_matched=0)
- **Matched keywords (top)**: []
- **Judge note**: Query sobre diferencia entre frameworks — NO es pregunta sobre un concepto específico del registry. Expected: refuse_ok. El router podría matchear 'rt 16' y 'nua' como framework keywords PERO sin concept keyword no debe rutear (el algoritmo actual devuelve None si no hay concept match). Testea: ¿el refuse simétrico INV-1 se mantiene?

### ❌ [s8] refuse_bad

- **Query**: como medis algo que no es plata como un fondo de comercio
- **Ground truth**: concept=medicion framework=RT_16_HISTORIC
- **Router**:       concept=None framework=None confidence=none
- **Router reason**: no_concept_keyword_matched
- **All concepts hit**: [] (num_matched=0)
- **Matched keywords (top)**: []
- **Failure reason**: no_keyword_match
- **Judge note**: Query sobre medición de intangibles. Menciona 'medis' (flexión verbal de 'medir' — keyword) pero también 'fondo de comercio' (que es plusvalía comercial, no en dict). Ground truth principal: 'medicion' (la pregunta es sobre cómo medir). Secundario: podría considerarse 'plusvalia_generada_internamente'. Testea: ¿el router llega a 'medicion' por 'medir'? Hoy probablemente SÍ porque 'medir' está listado como keyword.

### ❌ [s9] wrong_route

- **Query**: los resultados no realizados van a patrimonio
- **Ground truth**: concept=realizacion framework=RT_16_HISTORIC
- **Router**:       concept=patrimonio_neto framework=RT_16_HISTORIC confidence=low
- **Router reason**: concept_weak_and_framework_inferred
- **All concepts hit**: ['patrimonio_neto'] (num_matched=1)
- **Matched keywords (top)**: ['patrimonio']
- **Failure reason**: wrong_keyword_trigger
- **Judge note**: Query contiene 'resultado no realizado' (frase multi-palabra, peso 3 en scoring) Y 'patrimonio' (token, peso 1). Router debería rutear a 'realizacion' porque la frase multi-palabra gana el scoring. Ground truth: 'realizacion'. Testea: scoring multi-word vs single-word funciona como esperado.

### ❌ [s10] refuse_bad

- **Query**: mi amigo vende ropa y cobra en cuotas, la ganancia la pone ahora o despues
- **Ground truth**: concept=devengado framework=NUA
- **Router**:       concept=None framework=None confidence=none
- **Router reason**: no_concept_keyword_matched
- **All concepts hit**: [] (num_matched=0)
- **Matched keywords (top)**: []
- **Failure reason**: no_keyword_match
- **Judge note**: Query sucia, caso de uso real. La pregunta es sobre devengamiento (cuándo reconocer el ingreso: al vender o al cobrar). Matchea 'venta' (en dict de 'ingreso') pero NO 'devengado' ni 'percibido'. Router esperado: rutea a 'ingreso' por 'vende/venta'. Ground truth: 'devengado'. Segunda falla del mismo tipo que s5 — vocabulario de superficie distinto del concepto real. Si s5 y s10 fallan ambas, confirma patrón de sobre-ruteo a 'ingreso' cuando la pregunta real es sobre devengamiento.
