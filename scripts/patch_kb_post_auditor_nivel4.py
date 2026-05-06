#!/usr/bin/env python3
"""patch_kb_post_auditor_nivel4.py · 8 entries (6 técnicas + 2 meta salvaguarda)

Origen: agente contador Nivel 4 Ronda 1 = 5/5 ✗ con 2 patologías nuevas:
1. Invención de leyes y entidades (Q1: "Consejo Federal de Cuentas" · Q5: "Ley 24.174")
2. Texto duplicado sin lógica (Q4: "se capitaliza y se capitaliza")

Patologías heredadas que reaparecen sin cobertura KB:
- Citas con texto entrecomillado fabricado
- Todo se atribuye a RT 16 (mapeo erróneo)
- Numerología fabricada con confianza (umbrales inventados)

Acciones (cobertura completa Nivel 4 + salvaguarda contra leyes/entidades inventadas):
1. AGREGA rt6_ajuste_por_inflacion (Q1 · cobertura RT 6 marco general)
2. AGREGA nic29_hiperinflacion_argentina (Q1 · cobertura NIC 29 + refuse calibrado IPC)
3. AGREGA intangible_moneda_extranjera_rt17_rt18 (Q2 · RT 18 + RT 17 §5.13 articulación)
4. AGREGA bienes_de_uso_valuacion_posterior_rt17 (Q3 · §5.11 ambos modelos)
5. AGREGA diferencia_de_cambio_argentina_vigente (Q4 · regla resultados + excepciones NIC 23)
6. AGREGA reactivacion_rt6_julio_2018 (Q5 · cronología Ley 27.468 + Res 539/540/18)
7. AGREGA instituciones_normativa_contable_argentina (meta · salvaguarda contra "CFC" inventado)
8. AGREGA leyes_relevantes_marco_contable_argentino (meta · salvaguarda contra "Ley 24.174" inventada)
"""
import json
from pathlib import Path
from datetime import datetime

ROOT = Path("/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0")
KB_PATH = ROOT / "kb" / "knowledge_base.json"

with open(KB_PATH, "r", encoding="utf-8") as f:
    kb = json.load(f)


def _meta(reason, fix_origin):
    return {
        "fix_origin": fix_origin,
        "fix_date": "2026-05-06",
        "fix_reason": reason,
        "doctrina": "literal_quote_or_refuse §9.5 + refuse_calibrado_datos_variables",
        "audited_by": "agente_contador_adversarial_cto",
    }


# ── 1. RT 6 ajuste integral por inflación ─────────────────────────────────
RT6_AJUSTE = {
    "id": "rt6_ajuste_por_inflacion",
    "type": "regulation",
    "patterns": [
        "rt 6","qué es la rt 6","que es la rt 6","rt 6 facpce","rt 6 ajuste",
        "ajuste por inflación","ajuste integral por inflación","moneda homogénea",
        "estados contables homogéneos","estados contables en moneda homogénea",
        "recpam","reexpresión por inflación","reexpresion por inflacion",
        "qué tratamiento da la rt 6","tratamiento rt 6 hiperinflación",
        "rt 6 activación","rt 6 desactivación","cómo se activa rt 6","como se activa rt 6",
        "norma argentina ajuste por inflación","ajuste por inflación argentina"
    ],
    "answer_full": (
        "**RT 6 FACPCE · Estados contables en moneda homogénea (ajuste integral por inflación)**\n\n"
        "**Emisor:** FACPCE.\n"
        "**Emisión original:** 1984.\n"
        "**Modificatoria principal:** RT 39 FACPCE (2013) que introdujo el procedimiento operativo bajo NIC 29.\n\n"
        "**Naturaleza:** RT 6 establece el procedimiento argentino de **ajuste integral por inflación** "
        "(estados contables en moneda homogénea). Es la norma argentina paralela a NIC 29, con metodología "
        "compatible (reexpresión de partidas no monetarias · cálculo de RECPAM · resultado por exposición a la inflación).\n\n"
        "**Activación/Desactivación · criterio NIC 29:** la norma se aplica cuando una economía es considerada "
        "hiperinflacionaria. NIC 29 párr. 3 establece criterios cualitativos (preferencia por moneda extranjera "
        "estable, fijación de precios en moneda extranjera, tasas de interés y precios indexados, costos crediticios) "
        "y un criterio cuantitativo: **tasa acumulada de inflación en tres años que se aproxime o supere el 100%**.\n\n"
        "**Reactivación argentina (cronología):**\n"
        "- **Hasta 2003:** ajuste por inflación suspendido por Decreto 664/2003 y por Ley 23.928 (Ley de Convertibilidad).\n"
        "- **Diciembre 2018 · Ley 27.468:** modificó Ley 23.928 levantando la prohibición legal del ajuste por inflación a fines contables.\n"
        "- **Resoluciones FACPCE 539/18 y 540/18:** dispusieron la aplicación obligatoria de RT 6 (ajuste por inflación) "
        "para ejercicios y períodos intermedios cerrados a partir del **1° de julio de 2018**.\n"
        "- **Marco IASB paralelo:** desde 1° de julio de 2018 Argentina es considerada economía hiperinflacionaria a "
        "efectos de NIC 29 (decisión IPTF · International Practices Task Force).\n\n"
        "**Activación/Desactivación práctica argentina:** la determinación de aplicación/suspensión la realiza "
        "**FACPCE** (Junta de Gobierno) mediante Resoluciones de Junta basadas en datos de IPC INDEC. "
        "**No existe institución llamada \"Consejo Federal de Cuentas\" en el marco contable argentino.**\n\n"
        "**Tratamiento operativo:** RT 6 establece el ajuste de partidas no monetarias por aplicación del coeficiente IPC "
        "(índice general nivel general · INDEC), determinación de RECPAM (Resultado por Exposición a Cambios en el Poder "
        "Adquisitivo de la Moneda), y reexpresión de patrimonio neto.\n\n"
        "**Importante:** No reproduzco cifras puntuales de IPC INDEC ni tasas acumuladas de inflación en esta respuesta porque "
        "varían periódicamente y deben verificarse contra publicación oficial vigente del INDEC. Esta entry cubre el criterio "
        "cualitativo, la metodología y la estructura normativa."
    ),
    "source_refs": [
        "RT 6 FACPCE · Estados contables en moneda homogénea (1984 con modificatorias)",
        "RT 39 FACPCE (2013 · modificatoria operativa)",
        "Resolución FACPCE 539/2018 (29-sep-2018 · activación)",
        "Resolución FACPCE 540/2018 (procedimiento operativo)",
        "Ley 27.468 (sancionada 21-nov-2018 · BO 4-dic-2018)",
        "NIC 29 párr. 3 (criterios de hiperinflación)",
    ],
    "related_concepts": ["rt_6","rt_39","nic_29","facpce","indec","ipc","recpam","ley_27468","ajuste_por_inflacion","moneda_homogenea"],
    "materia": "Contabilidad",
    "difficulty": "intermedio",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel4_2026-05-06",
    "chunk_id": "auditor-nivel4-rt6-v1",
    "_anubis_meta": _meta(
        "Sin entry RT 6 · LLM inventó 'Consejo Federal de Cuentas' + invirtió rol RT 6 + umbral 50% inventado",
        "auditor_contador_nivel4_q1_rechazada",
    ),
}

# ── 2. NIC 29 hiperinflación argentina ────────────────────────────────────
NIC29 = {
    "id": "nic29_hiperinflacion_argentina",
    "type": "regulation",
    "patterns": [
        "nic 29","qué es nic 29","que es nic 29","nic 29 hiperinflación",
        "nic 29 argentina","hiperinflación nic 29","contexto hiperinflación argentina",
        "criterios hiperinflación","100 por ciento acumulado tres años","100% tres años",
        "argentina hiperinflacionaria","economía hiperinflacionaria","cuándo aplica nic 29",
        "umbral nic 29","activación nic 29","desactivación nic 29","ias 29"
    ],
    "answer_full": (
        "**NIC 29 · Información financiera en economías hiperinflacionarias**\n\n"
        "**Emisor:** IASB (mantenida desde IASC).\n"
        "**Cuerpo:** Norma Internacional de Contabilidad 29 (IAS 29 en inglés).\n\n"
        "**Criterios de hiperinflación · NIC 29 párr. 3:** la norma identifica una economía como hiperinflacionaria "
        "cuando concurren indicadores cualitativos y/o cuantitativos:\n\n"
        "**Indicadores cualitativos:**\n"
        "1. La población general prefiere mantener su riqueza en activos no monetarios o en moneda extranjera estable.\n"
        "2. La población piensa los precios no en moneda local sino en moneda extranjera estable.\n"
        "3. Las ventas y compras a crédito se realizan a precios que compensan la pérdida esperada de poder adquisitivo durante el período de crédito.\n"
        "4. Las tasas de interés, salarios y precios se vinculan con un índice de precios.\n\n"
        "**Indicador cuantitativo:**\n"
        "5. La **tasa acumulada de inflación en tres años se aproxime o sobrepase el 100%**.\n\n"
        "**Aplicación a Argentina:** desde 1° de julio de 2018 Argentina es considerada economía hiperinflacionaria "
        "a efectos de NIC 29, por decisión del IPTF (International Practices Task Force · panel del Center for Audit Quality).\n\n"
        "**Norma argentina equivalente:** RT 6 FACPCE (ajuste integral por inflación · estados contables en moneda homogénea).\n\n"
        "**Tratamiento operativo:** los estados financieros expresados en moneda de una economía hiperinflacionaria deben "
        "presentarse en moneda corriente al final del período sobre el que se informa. Las partidas no monetarias se "
        "reexpresan aplicando un índice general de precios (en Argentina: IPC INDEC). Las partidas monetarias generan "
        "resultado por exposición a la inflación (RECPAM en terminología argentina).\n\n"
        "**Importante:** No reproduzco la tasa acumulada de IPC INDEC vigente en esta respuesta porque se actualiza "
        "periódicamente y debe verificarse contra publicación oficial INDEC. Esta entry cubre el criterio cualitativo "
        "(100% acumulado en 3 años) y la estructura normativa, no cifras puntuales."
    ),
    "source_refs": [
        "NIC 29 párr. 3 (criterios cualitativos y cuantitativos · 100% acumulado en 3 años)",
        "NIC 29 párr. 38 (transición)",
        "RT 6 FACPCE · norma argentina equivalente",
        "IPTF (International Practices Task Force) · decisión sobre Argentina hiperinflacionaria desde 1-jul-2018",
    ],
    "related_concepts": ["nic_29","ias_29","rt_6","hiperinflacion","iptf","indec","ipc","recpam","facpce","argentina"],
    "materia": "Contabilidad",
    "difficulty": "intermedio",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel4_2026-05-06",
    "chunk_id": "auditor-nivel4-nic29-v1",
    "_anubis_meta": _meta(
        "Sin entry NIC 29 · LLM inventó umbral '50% anual' (real: 100% acumulado en 3 años)",
        "auditor_contador_nivel4_q1_rechazada",
    ),
}

# ── 3. Intangible moneda extranjera RT 17 + RT 18 ─────────────────────────
INTANGIBLE_ME = {
    "id": "intangible_moneda_extranjera_rt17_rt18",
    "type": "regulation",
    "patterns": [
        "intangible moneda extranjera","intangible adquirido en dolares","intangible adquirido en moneda extranjera",
        "rt 18 intangible","moneda extranjera intangible","activo intangible moneda extranjera",
        "cómo se contabiliza intangible moneda extranjera","contabilización intangible dólares",
        "rt 17 intangible moneda","conversión intangible moneda extranjera",
        "intangible extranjero argentina","intangible compra exterior"
    ],
    "answer_full": (
        "**Activo intangible adquirido en moneda extranjera · marco argentino**\n\n"
        "**Norma aplicable:**\n"
        "- **RT 18 FACPCE** (Estados contables en moneda extranjera y entes radicados en el exterior) regula la "
        "conversión de operaciones y saldos en moneda extranjera al peso argentino.\n"
        "- **RT 17 §5.13** regula la medición de intangibles (criterios de reconocimiento y medición posterior).\n"
        "- **RT 6 FACPCE** se aplica para reexpresión por inflación de partidas no monetarias (intangible es partida no monetaria) en ejercicios bajo régimen de ajuste por inflación.\n\n"
        "**Marco IASB equivalente:**\n"
        "- **NIC 21** (efectos de variaciones en tipos de cambio).\n"
        "- **NIC 38** (activos intangibles).\n"
        "- **NIC 29** (información financiera en economías hiperinflacionarias).\n\n"
        "**Tratamiento operativo · medición inicial:**\n"
        "El costo del intangible se convierte a moneda funcional (peso argentino para entes con actividades sustancialmente "
        "domésticas) al **tipo de cambio del día de la transacción** (tipo de cambio comprador o vendedor según "
        "corresponda al tipo de operación). El costo así determinado pasa a expresarse en pesos argentinos.\n\n"
        "**Medición posterior:**\n"
        "- Costo amortizado en moneda local (peso argentino), con vida útil definida o indefinida según naturaleza.\n"
        "- Evaluación de deterioro bajo RT 17 §4.4.7 (paralelo a NIC 36).\n"
        "- Si el ente aplica modelo de revaluación (excepcional en intangibles bajo RT 17), requisitos de mercado activo.\n\n"
        "**Tratamiento bajo ajuste por inflación (RT 6 activa · post julio 2018):**\n"
        "El intangible, como partida no monetaria, se reexpresa aplicando el coeficiente IPC desde la fecha de origen "
        "(fecha de la transacción · primera reexpresión en pesos) hasta la fecha de cierre. La reexpresión genera "
        "contrapartida en RECPAM (resultado por exposición a la inflación).\n\n"
        "**Diferencias de cambio · si hay deuda en moneda extranjera asociada:**\n"
        "Las diferencias de cambio del pasivo en moneda extranjera se reconocen en resultados (regla general bajo RT 17 "
        "actual y NIC 21), salvo excepciones limitadas para activos cualificados (RT 17 admitió capitalización con "
        "condiciones; NIC 23 admite capitalización en costos por intereses con tratamiento separado de las diferencias "
        "de cambio que sean ajustes de costos por intereses).\n\n"
        "**Importante: la cita 'RT 16 art. 3' no existe.** RT 16 (Marco Conceptual) no se estructura en artículos y no "
        "regula conversión de moneda extranjera."
    ),
    "source_refs": [
        "RT 18 FACPCE · Estados contables en moneda extranjera y entes radicados en el exterior",
        "RT 17 FACPCE §5.13 (medición de intangibles)",
        "RT 17 FACPCE §4.4.7 (deterioro)",
        "RT 6 FACPCE (reexpresión por inflación de partidas no monetarias)",
        "NIC 21 (efectos de variaciones en tipos de cambio)",
        "NIC 38 (activos intangibles)",
        "NIC 23 (costos por endeudamiento)",
    ],
    "related_concepts": ["rt_18","rt_17","rt_6","nic_21","nic_38","nic_23","intangible","moneda_extranjera","tipo_de_cambio","recpam"],
    "materia": "Contabilidad",
    "difficulty": "avanzado",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel4_2026-05-06",
    "chunk_id": "auditor-nivel4-intangible-me-v1",
    "_anubis_meta": _meta(
        "Sin entry · LLM atribuyó tema a RT 16 + cita 'RT 16 art. 3' inventada + omitió RT 18",
        "auditor_contador_nivel4_q2_rechazada",
    ),
}

# ── 4. Bienes de uso · valuación posterior RT 17 §5.11 ────────────────────
BIENES_USO = {
    "id": "bienes_de_uso_valuacion_posterior_rt17",
    "type": "regulation",
    "patterns": [
        "valuación posterior bienes de uso","valuacion posterior bienes de uso",
        "rt 17 bienes de uso","rt 17 5.11","rt 17 medición posterior","modelo costo modelo revaluación",
        "modelo del costo modelo revaluacion","revalúo técnico","revaluación bienes de uso",
        "criterio rt 17 valuación posterior","costo histórico valor razonable bienes de uso",
        "rt 17 ppe","propiedades planta y equipo argentina","ppe argentina"
    ],
    "answer_full": (
        "**RT 17 · Valuación posterior de bienes de uso · marco argentino**\n\n"
        "**Sección aplicable:** RT 17 §5.11 (Bienes de uso · medición posterior).\n\n"
        "**Modelos admitidos · ambos:**\n\n"
        "**1. Modelo del costo (regla general):**\n"
        "Costo de adquisición o producción + capitalización de costos imputables (RT 17 §4.2.7 · costos por endeudamiento "
        "bajo condiciones de RT 17 §4.2.7.2) − amortizaciones acumuladas − deterioro acumulado (RT 17 §4.4.7).\n\n"
        "**2. Modelo de revaluación técnica (alternativo · sujeto a condiciones):**\n"
        "El bien se mide a su valor revaluado, definido como el valor razonable a la fecha de la revaluación menos "
        "amortizaciones acumuladas posteriores y deterioro posterior. Condiciones operativas:\n"
        "- Revaluación realizada con frecuencia suficiente para que el valor en libros no difiera materialmente del valor razonable a la fecha de cierre.\n"
        "- Informe técnico profesional con criterio de medición sustentable.\n"
        "- Aplicación a clase completa de bienes (no a un activo individual aislado).\n"
        "- Vida útil restante posterior a la revaluación consistente con la base utilizada para el cálculo.\n"
        "- Saldo de revaluación se reconoce en el patrimonio neto (cuenta específica · saldo por revalúo técnico) y se transfiere a resultados acumulados a medida que el activo se consume (vía amortización del exceso) o por desafectación.\n\n"
        "**Marco IASB equivalente · NIC 16 párr. 29-31:**\n"
        "- **Modelo del costo** (párr. 30): costo − depreciación − pérdidas por deterioro.\n"
        "- **Modelo de revaluación** (párr. 31): valor razonable a la fecha de revaluación − depreciación posterior − deterioro posterior. Frecuencia de revaluación suficiente.\n\n"
        "**Tratamiento bajo ajuste por inflación (RT 6 activa):**\n"
        "Los bienes de uso son partidas no monetarias y se reexpresan aplicando coeficiente IPC desde fecha de origen "
        "(o fecha de la última revaluación si se aplica modelo de revaluación) hasta fecha de cierre. La reexpresión "
        "genera contrapartida en RECPAM. Bajo modelo de revaluación, la articulación entre revaluación y reexpresión "
        "por inflación requiere tratamiento específico (ver RT 39 y guías FACPCE).\n\n"
        "**Tensión RT 17 vs NIC 16:** ambos cuerpos admiten los dos modelos con lógica conceptual equivalente. "
        "Diferencias prácticas en condiciones documentales del informe técnico, frecuencia mínima de revaluación, y "
        "tratamiento del saldo de revalúo (NIC 16 admite transferencia gradual a resultados acumulados; RT 17 mantiene "
        "criterio similar).\n\n"
        "**Importante: la cita 'RT 17 art. 4.1.3' no existe.** RT 17 se estructura en secciones (§), no artículos. "
        "El criterio operativo de bienes de uso es §5.11. **No existe regla \"costo histórico como valoración razonable "
        "por uso durante 3 años o más\"** — esa formulación es invención."
    ),
    "source_refs": [
        "RT 17 FACPCE §5.11 (bienes de uso · medición posterior · modelo del costo y modelo de revaluación)",
        "RT 17 FACPCE §4.2.7 y §4.2.7.2 (capitalización de costos por endeudamiento)",
        "RT 17 FACPCE §4.4.7 (deterioro)",
        "RT 39 FACPCE (articulación revaluación-inflación)",
        "RT 6 FACPCE (reexpresión por inflación)",
        "NIC 16 párr. 29-31 (modelo del costo / modelo de revaluación)",
    ],
    "related_concepts": ["rt_17","rt_39","rt_6","nic_16","bienes_de_uso","ppe","modelo_del_costo","modelo_revaluacion","revaluo_tecnico","deterioro"],
    "materia": "Contabilidad",
    "difficulty": "avanzado",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel4_2026-05-06",
    "chunk_id": "auditor-nivel4-bienes-uso-v1",
    "_anubis_meta": _meta(
        "Sin entry · LLM fabricó citas con texto entrecomillado + criterio '3 años' inventado",
        "auditor_contador_nivel4_q3_rechazada",
    ),
}

# ── 5. Diferencia de cambio · regla resultados + excepciones NIC 23 ───────
DIF_CAMBIO = {
    "id": "diferencia_de_cambio_argentina_vigente",
    "type": "regulation",
    "patterns": [
        "diferencia de cambio","tratamiento diferencia de cambio","diferencias de cambio",
        "qué tratamiento contable diferencia de cambio","diferencia cambio argentina",
        "moneda extranjera resultados","nic 21 diferencia de cambio","nic 21 diferencias",
        "diferencia cambio capitaliza","diferencia cambio resultados","diferencia cambio capitalizar",
        "diferencias de cambio normativa argentina","ajuste tipo cambio resultados"
    ],
    "answer_full": (
        "**Diferencia de cambio · tratamiento contable bajo normativa argentina vigente**\n\n"
        "**Marco normativo argentino:**\n"
        "- **RT 17 §5.13** (medición de partidas en moneda extranjera bajo régimen FACPCE histórico).\n"
        "- **RT 18 FACPCE** (Estados contables en moneda extranjera y entes radicados en el exterior).\n"
        "- **RT 54 NUA** (vigente desde 2024-07-01 · integra el tratamiento de moneda extranjera).\n"
        "- **RT 6 FACPCE** (articulación con ajuste por inflación cuando aplicable).\n\n"
        "**Marco IASB:**\n"
        "- **NIC 21** (Efectos de las variaciones en las tasas de cambio de la moneda extranjera).\n"
        "- **NIC 23** (Costos por endeudamiento · capitalización en activos cualificados).\n\n"
        "**Regla general:** la diferencia de cambio se reconoce en **resultados del ejercicio** en el período en que "
        "se origina (NIC 21 párr. 28; tratamiento equivalente bajo RT 17 / RT 54 NUA). **No se capitaliza como regla general.**\n\n"
        "**Excepciones específicas:**\n"
        "1. **Diferencia de cambio sobre financiación de activos cualificados (NIC 23 párr. 6.e):** puede integrarse a "
        "los costos por endeudamiento susceptibles de capitalización en el costo del activo, hasta el límite del costo "
        "financiero adicional comparable en moneda local. Tratamiento argentino paralelo bajo RT 17 §4.2.7.2 con condiciones similares.\n"
        "2. **Inversión neta en operación extranjera (NIC 21 párr. 32):** las diferencias de cambio sobre partidas "
        "monetarias que en sustancia formen parte de la inversión neta en una operación extranjera se reconocen en "
        "Otros Resultados Integrales (ORI) en estados separados; al disponerse de la inversión, se reclasifican a resultados.\n"
        "3. **Cobertura de inversión neta (NIC 21 párr. 33 y NIIF 9):** tratamiento específico bajo contabilidad de coberturas.\n\n"
        "**Articulación con ajuste por inflación (RT 6 activa · post julio 2018):**\n"
        "Bajo régimen de ajuste por inflación, las partidas monetarias en moneda extranjera generan tanto diferencia "
        "de cambio (por variación del tipo de cambio) como RECPAM (por exposición a la inflación). El procedimiento "
        "de cálculo separa ambos efectos para evitar duplicación y mantener la lógica de moneda homogénea.\n\n"
        "**Documentación complementaria:** Resolución FACPCE 539/18 y guías técnicas posteriores para articulación "
        "operativa entre diferencia de cambio y RECPAM.\n\n"
        "**Importante: el cuerpo IASB sobre diferencias de cambio es NIC 21, no MC IASB párr. 4.5.** El Marco Conceptual "
        "párr. 4.5 trata recursos económicos, no diferencias de cambio. **Y la regla NO es 'se capitaliza' como regla general** — "
        "esa formulación es errada."
    ),
    "source_refs": [
        "NIC 21 párr. 28 (regla general · imputación a resultados)",
        "NIC 21 párr. 32 (inversión neta en operación extranjera · ORI)",
        "NIC 21 párr. 33 (cobertura de inversión neta)",
        "NIC 23 párr. 6.e (capitalización en activos cualificados)",
        "RT 17 FACPCE §5.13 y §4.2.7.2",
        "RT 18 FACPCE",
        "RT 54 NUA (vigente desde 2024-07-01)",
        "Resolución FACPCE 539/2018",
    ],
    "related_concepts": ["rt_17","rt_18","rt_54_nua","rt_6","nic_21","nic_23","niif_9","diferencia_de_cambio","moneda_extranjera","ori","activos_cualificados","recpam"],
    "materia": "Contabilidad",
    "difficulty": "avanzado",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel4_2026-05-06",
    "chunk_id": "auditor-nivel4-dif-cambio-v1",
    "_anubis_meta": _meta(
        "Sin entry · LLM duplicó texto 'se capitaliza y se capitaliza' + invirtió regla + cita IASB MC inventada",
        "auditor_contador_nivel4_q4_rechazada",
    ),
}

# ── 6. Reactivación RT 6 · julio 2018 + Ley 27.468 ─────────────────────────
REACTIVACION = {
    "id": "reactivacion_rt6_julio_2018",
    "type": "regulation",
    "patterns": [
        "reactivación rt 6","reactivacion rt 6","ley 27468","ley 27.468","ley 27 468",
        "fecha ajuste por inflación argentina","desde cuándo ajuste por inflación argentina",
        "1 julio 2018 inflación","julio 2018 ajuste inflación","res facpce 539",
        "resolución facpce 539","resolución facpce 540","resolución facpce 540/18","facpce 539/18",
        "cierre 31/12 ajuste por inflación","empresa argentina cierre diciembre ajuste",
        "cuándo aplicar ajuste por inflación argentina","reactivación ajuste por inflación argentina"
    ],
    "answer_full": (
        "**Reactivación del ajuste por inflación en Argentina · cronología y aplicación**\n\n"
        "**Antecedente legal:**\n"
        "- **Ley 23.928 (Convertibilidad · 1991):** prohibió legalmente la actualización monetaria, indexación y ajuste por inflación en estados contables.\n"
        "- **Decreto 664/2003:** dispuso a las autoridades de aplicación abstenerse de recibir estados contables ajustados por inflación.\n"
        "- **Resoluciones MTEySS 287/2003 y CNV 441/2003** entre otras: instrumentaron la suspensión del ajuste por inflación.\n\n"
        "**Reactivación · diciembre 2018:**\n"
        "- **Ley 27.468** (sancionada 21-nov-2018 · publicada BO 4-dic-2018): modificó el artículo 10 de la Ley 23.928 levantando la prohibición legal del ajuste por inflación a fines contables.\n"
        "- **Resolución FACPCE 539/2018** (29-sep-2018, ratificada por Junta de Gobierno): dispuso la aplicación obligatoria de RT 6 (ajuste integral por inflación) para ejercicios y períodos intermedios cerrados a partir del **1° de julio de 2018**.\n"
        "- **Resolución FACPCE 540/2018** (con ajustes operativos posteriores): definió procedimiento operativo, transición, reexpresión integral del ejercicio en curso y tratamiento de cifras comparativas.\n\n"
        "**Aplicación a empresas con cierre 31/12:**\n"
        "- **Ejercicio cerrado el 31/12/2018:** primer ejercicio con ajuste por inflación aplicado (por incluir el período posterior al 1° de julio de 2018). Se exigió reexpresión integral del ejercicio y de las cifras comparativas.\n"
        "- **Ejercicios cerrados al 31/12/2019, 2020, 2021, 2022, 2023, 2024, 2025:** aplicación continua del ajuste por inflación bajo RT 6 (Argentina sigue siendo considerada economía hiperinflacionaria a efectos de NIC 29).\n\n"
        "**Aplicación a empresas con cierres intermedios (30/06, 30/09, etc.):** primer ejercicio con ajuste fue el cerrado en o después del 1° de julio de 2018.\n\n"
        "**Marco IASB paralelo:**\n"
        "- Argentina considerada economía hiperinflacionaria a efectos de NIC 29 desde 1° de julio de 2018 por decisión del IPTF (International Practices Task Force).\n"
        "- Entidades bajo RT 26 (NIIF en Argentina) aplican NIC 29 desde la misma fecha.\n\n"
        "**Estado actual (2026):** ajuste por inflación bajo RT 6 / NIC 29 continúa en aplicación. La desactivación dependerá "
        "de evaluación cualitativa y cuantitativa de FACPCE basada en datos de IPC INDEC y los criterios de NIC 29 párr. 3.\n\n"
        "**Importante: la \"Ley 24.174 - Ley de Presupuesto y Cuenta Pública\" no existe.** La ley relevante para la reactivación "
        "del ajuste por inflación es **Ley 27.468** (diciembre 2018). El dato exacto de tasa acumulada de IPC INDEC en cualquier "
        "período concreto debe verificarse contra publicación oficial de INDEC; esta entry no reproduce cifras puntuales de "
        "inflación porque varían y deben consultarse en fuente oficial vigente."
    ),
    "source_refs": [
        "Ley 27.468 (sancionada 21-nov-2018 · BO 4-dic-2018 · modificó art. 10 Ley 23.928)",
        "Ley 23.928 (Convertibilidad · 1991)",
        "Decreto 664/2003",
        "Resolución FACPCE 539/2018 (29-sep-2018 · activación)",
        "Resolución FACPCE 540/2018 (procedimiento operativo)",
        "RT 6 FACPCE",
        "RT 39 FACPCE",
        "NIC 29 párr. 3 (criterios hiperinflación)",
        "IPTF · International Practices Task Force",
    ],
    "related_concepts": ["ley_27468","ley_23928","decreto_664_2003","facpce","rt_6","rt_39","nic_29","iptf","indec","ipc","ajuste_por_inflacion"],
    "materia": "Contabilidad",
    "difficulty": "avanzado",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel4_2026-05-06",
    "chunk_id": "auditor-nivel4-reactivacion-v1",
    "_anubis_meta": _meta(
        "Sin entry · LLM inventó 'Ley 24.174 - Ley de Presupuesto y Cuenta Pública' + omitió Ley 27.468 + fecha errada",
        "auditor_contador_nivel4_q5_rechazada",
    ),
}

# ── 7. META · Instituciones marco contable argentino (salvaguarda) ────────
INSTITUCIONES_META = {
    "id": "instituciones_normativa_contable_argentina",
    "type": "glossary",
    "patterns": [
        "facpce","cpcecaba","cecyt","indec","bcra","cnv","ssn","inaes","afip","igj",
        "qué es facpce","que es facpce","qué es cnv","que es cnv","qué es bcra","que es bcra",
        "qué es ssn","qué es inaes","qué es indec","qué es afip","qué es igj","qué es cpcecaba",
        "consejo federal de cuentas","cfc consejo federal","instituciones normativa contable argentina",
        "organismos contables argentina","entidades reguladoras contables argentina"
    ],
    "answer_full": (
        "**Glosario · Instituciones del marco contable argentino**\n\n"
        "**FACPCE** · **Federación Argentina de Consejos Profesionales de Ciencias Económicas**. Organismo nacional emisor "
        "de las Resoluciones Técnicas (RT). La Junta de Gobierno de FACPCE dispone la aplicación, modificación, suspensión "
        "y reactivación de las normas (incluida activación/desactivación del ajuste por inflación bajo RT 6 según criterios NIC 29).\n\n"
        "**CPCECABA** · Consejo Profesional de Ciencias Económicas de la Ciudad Autónoma de Buenos Aires. Uno de los "
        "Consejos profesionales provinciales que adhieren a las RT FACPCE.\n\n"
        "**CECYT** · Centro de Estudios Científicos y Técnicos de FACPCE. Órgano técnico que elabora los proyectos normativos.\n\n"
        "**INDEC** · Instituto Nacional de Estadística y Censos (Argentina). Publica el IPC (Índice de Precios al Consumidor) "
        "que es la base oficial para reexpresión bajo RT 6.\n\n"
        "**CNV** · Comisión Nacional de Valores (Argentina). Organismo regulador del mercado de capitales argentino. "
        "Régimen actual: Ley 26.831 + Texto Ordenado RG 622/2013 con modificatorias.\n\n"
        "**BCRA** · Banco Central de la República Argentina. Regulador de entidades financieras. Emite normas contables propias "
        "para bancos y entidades financieras (con NIIF parcial desde 2018).\n\n"
        "**SSN** · Superintendencia de Seguros de la Nación (Argentina). Regulador de aseguradoras. Emite normas contables propias.\n\n"
        "**INAES** · Instituto Nacional de Asociativismo y Economía Social (Argentina). Regulador de cooperativas y mutuales.\n\n"
        "**AFIP** · Administración Federal de Ingresos Públicos. Organismo recaudador (regulación tributaria, no contable per se).\n\n"
        "**IGJ** · Inspección General de Justicia (Ciudad de Buenos Aires) y registros provinciales equivalentes. Control de personería "
        "y publicidad registral de sociedades, no de normas contables.\n\n"
        "**Importante · entidades inexistentes:**\n"
        "- **\"Consejo Federal de Cuentas\" (CFC) no existe** en el marco contable argentino. La institución que dispone "
        "activación/desactivación del ajuste por inflación es **FACPCE** (Junta de Gobierno).\n"
        "- **\"Consejo Nacional de Contabilidad\" no existe** como entidad emisora de normas argentinas. El emisor nacional es FACPCE.\n"
        "- Cualquier referencia a entidades con nombres similares debe verificarse contra la lista oficial de organismos."
    ),
    "source_refs": [
        "FACPCE · facpce.org.ar",
        "INDEC · indec.gob.ar",
        "CNV · cnv.gov.ar",
        "BCRA · bcra.gob.ar",
        "SSN · argentina.gob.ar/ssn",
    ],
    "related_concepts": ["facpce","cpcecaba","cecyt","indec","bcra","cnv","ssn","inaes","afip","igj","instituciones"],
    "materia": "Contabilidad",
    "difficulty": "intermedio",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel4_2026-05-06",
    "chunk_id": "auditor-nivel4-instituciones-meta-v1",
    "_anubis_meta": _meta(
        "Salvaguarda contra invención de instituciones (caso Q1: 'Consejo Federal de Cuentas' fabricado)",
        "auditor_contador_nivel4_salvaguarda",
    ),
}

# ── 8. META · Leyes relevantes marco contable argentino (salvaguarda) ─────
LEYES_META = {
    "id": "leyes_relevantes_marco_contable_argentino",
    "type": "glossary",
    "patterns": [
        "ley 19550","ley 19.550","lgs","ley general de sociedades",
        "ley 23928","ley 23.928","ley convertibilidad","ley 27468","ley 27.468",
        "ley reactivación ajuste inflación","ley 26831","ley 26.831","ley mercado de capitales",
        "ley 11683","ley 11.683","ley procedimiento tributario",
        "leyes relevantes marco contable","leyes contables argentina","ley 24174","ley 24.174",
        "ley presupuesto cuenta pública"
    ],
    "answer_full": (
        "**Glosario · Leyes argentinas relevantes para el marco contable**\n\n"
        "**Ley 19.550 · Ley General de Sociedades (LGS).** Régimen societario argentino. Establece tipos societarios, "
        "obligaciones de los administradores, asambleas, distribución de resultados, fusiones, escisiones, disolución y liquidación. "
        "Marco base para que las normas contables se apliquen sobre sujetos societarios.\n\n"
        "**Ley 23.928 · Ley de Convertibilidad (1991).** Estableció la paridad peso-dólar y, en su artículo 10, prohibió "
        "la actualización monetaria, indexación, repotenciación de deudas y ajuste por inflación. Modificada por Ley 27.468 en 2018.\n\n"
        "**Ley 27.468 · Reactivación del ajuste por inflación contable (sancionada 21-nov-2018 · BO 4-dic-2018).** "
        "Modificó el artículo 10 de la Ley 23.928 levantando la prohibición legal del ajuste por inflación a fines contables. "
        "Es la ley que habilitó legalmente la activación de RT 6 / NIC 29 en Argentina desde 1° de julio de 2018 (la activación "
        "operativa fue por Resoluciones FACPCE 539/18 y 540/18).\n\n"
        "**Ley 26.831 · Ley de Mercado de Capitales (2012).** Régimen del mercado de capitales argentino. Marco que "
        "habilita a la CNV a regular información financiera de entidades emisoras de oferta pública. Texto reglamentario "
        "principal: RG CNV 622/2013 con modificatorias.\n\n"
        "**Ley 11.683 · Ley de Procedimiento Tributario.** Régimen procesal de AFIP. Marco tributario, no contable per se, pero "
        "interactúa con la información contable a fines fiscales.\n\n"
        "**Marco bancario:** las entidades financieras se rigen por **Ley 21.526 · Ley de Entidades Financieras** y por las "
        "Comunicaciones del BCRA.\n\n"
        "**Marco asegurador:** **Ley 20.091 · Ley de Entidades de Seguros** y reglamentaciones de la SSN.\n\n"
        "**Marco cooperativo:** **Ley 20.337 · Ley de Cooperativas** y reglamentaciones del INAES.\n\n"
        "**Importante · leyes inexistentes:**\n"
        "- **\"Ley 24.174 - Ley de Presupuesto y Cuenta Pública\" no existe** con esa función en el marco contable argentino. "
        "La ley relevante para la reactivación del ajuste por inflación es **Ley 27.468** (diciembre 2018).\n"
        "- Cualquier referencia a una ley argentina con función contable debe verificarse contra el cuerpo legal vigente "
        "(InfoLEG · sitio oficial)."
    ),
    "source_refs": [
        "Ley 19.550 · Ley General de Sociedades",
        "Ley 23.928 · Ley de Convertibilidad (1991)",
        "Ley 27.468 (sancionada 21-nov-2018 · BO 4-dic-2018)",
        "Ley 26.831 · Ley de Mercado de Capitales (2012)",
        "Ley 11.683 · Ley de Procedimiento Tributario",
        "Ley 21.526 · Ley de Entidades Financieras",
        "Ley 20.091 · Ley de Entidades de Seguros",
        "Ley 20.337 · Ley de Cooperativas",
        "InfoLEG · infoleg.gob.ar",
    ],
    "related_concepts": ["ley_19550","ley_23928","ley_27468","ley_26831","ley_11683","ley_21526","ley_20091","ley_20337","leyes_contables_argentina"],
    "materia": "Contabilidad",
    "difficulty": "intermedio",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel4_2026-05-06",
    "chunk_id": "auditor-nivel4-leyes-meta-v1",
    "_anubis_meta": _meta(
        "Salvaguarda contra invención de leyes (caso Q5: 'Ley 24.174' fabricada con función falsa)",
        "auditor_contador_nivel4_salvaguarda",
    ),
}


# ── Aplicar patches ───────────────────────────────────────────────────────
NEW_ENTRIES = [
    RT6_AJUSTE,
    NIC29,
    INTANGIBLE_ME,
    BIENES_USO,
    DIF_CAMBIO,
    REACTIVACION,
    INSTITUCIONES_META,
    LEYES_META,
]

existing_ids = {e["id"] for e in kb["entries"]}
added = 0
replaced = 0

for entry in NEW_ENTRIES:
    if entry["id"] in existing_ids:
        kb["entries"] = [e for e in kb["entries"] if e["id"] != entry["id"]]
        kb["entries"].append(entry)
        replaced += 1
        print(f"  ↻ replaced: {entry['id']}")
    else:
        kb["entries"].append(entry)
        added += 1
        print(f"  + added:    {entry['id']}")

kb["total_entries"] = len(kb["entries"])
kb["last_patched"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

with open(KB_PATH, "w", encoding="utf-8") as f:
    json.dump(kb, f, ensure_ascii=False, indent=2)

print()
print(f"[patch_nivel4] {added} added · {replaced} replaced")
print(f"[patch_nivel4] total entries: {kb['total_entries']}")
print(f"[patch_nivel4] KB: {KB_PATH}")
