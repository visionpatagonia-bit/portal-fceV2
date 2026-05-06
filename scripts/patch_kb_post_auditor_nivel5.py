#!/usr/bin/env python3
"""patch_kb_post_auditor_nivel5.py · 6 entries nuevas + 1 fix entry existente

Origen: agente contador Nivel 5 Ronda 1 = 4 ✗ + 1 ⚠ con 5 patologías:
1. RECURRENTE: cita IASB MC párr. 4.5 mal asignada (6 ocurrencias en el barrido).
2. REAPARECIDA: bloques con cuerpo vacío en entries KB (Q3 devengado_concepto).
3. NUEVA: invención de elementos editoriales ("nota del Comité" en RT 16 §4.1.2).
4. CONFIRMADA: texto entrecomillado fabricado.
5. NUEVA: atribución invertida de posición normativa (Q5 IASB exige "obligación legal" cuando IASB amplía a obligación implícita).

Acciones (cobertura completa Nivel 5 + salvaguarda contra patología #1):
1. AGREGA mc_iasb_2018_estructura_capitulos (META · cierra patología recurrente #1).
2. AGREGA pn_vs_capital_social_relacion_inclusion (Q1 · LGS 19.550 + relación de inclusión).
3. AGREGA pn_aritmetico_vs_presentacion_supuestos (Q2 · 6 supuestos donde igualdad aparente se rompe).
4. AGREGA devengado_alcance_partidas_no_monetarias (Q3 · dicotomía monetario/no-monetario).
5. AGREGA ecuacion_contable_genealogia_pacioli (Q4 · genealogía Pacioli 1494 + escuela continental).
6. AGREGA pasivo_obligacion_implicita_constructive (Q5 · NIC 37 + MC IASB párr. 4.31).
7. FIX devengado_concepto (bloques vacíos · completa RT 16 + MC IASB párr. 1.17).
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
        "doctrina": "literal_quote_or_refuse §9.5 + matching_specific_over_generic",
        "audited_by": "agente_contador_adversarial_cto",
    }


# ── 0. META · MC IASB 2018 estructura de capítulos (URGENTE · cierra patología #1) ──
MC_IASB_ESTRUCTURA = {
    "id": "mc_iasb_2018_estructura_capitulos",
    "type": "glossary",
    "patterns": [
        "iasb mc párr. 4.5","iasb mc parr 4.5","iasb mc 4.5","mc iasb 4.5",
        "mc iasb párrafo 4","mc iasb parrafo 4","marco conceptual iasb 4",
        "marco conceptual iasb párrafo","marco conceptual iasb parrafo",
        "marco conceptual iasb capítulo","marco conceptual iasb capitulo",
        "iasb mc capítulo","iasb mc capitulo","mc iasb capítulo","mc iasb capitulo",
        "iasb 2018 capítulo","iasb 2018 capitulo","iasb 2018 párrafo","iasb 2018 parrafo",
        "estructura mc iasb","estructura marco conceptual iasb",
        "qué trata mc iasb 4.5","que trata mc iasb 4.5",
        "qué trata párr 4.5 iasb","que trata parr 4.5 iasb",
        "definición de pasivo iasb","definicion de pasivo iasb",
        "definición de patrimonio iasb","definicion de patrimonio iasb",
        "iasb mc 4.26","iasb mc 4.63","iasb mc 4.31","iasb mc 1.17",
        "mc iasb 4.26","mc iasb 4.63","mc iasb 4.31","mc iasb 1.17",
    ],
    "answer_full": (
        "**Marco Conceptual IASB 2018 · estructura de capítulos · referencia rápida para evitar citas erradas**\n\n"
        "**Capítulo 1: El objetivo de la información financiera con propósito general.** Párrafos 1.1-1.23.\n"
        "Trata: usuarios, decisiones de los usuarios, información requerida sobre recursos económicos y derechos.\n"
        "- **Párr. 1.17:** base de acumulación / devengado.\n\n"
        "**Capítulo 2: Características cualitativas de la información financiera útil.** Párrafos 2.1-2.43.\n"
        "Trata: relevancia, representación fiel, comparabilidad, verificabilidad, oportunidad, comprensibilidad.\n\n"
        "**Capítulo 3: Estados financieros y la entidad informante.** Párrafos 3.1-3.18.\n"
        "Trata: objetivo y alcance de los estados financieros, períodos, entidad informante, estados consolidados/separados/combinados.\n\n"
        "**Capítulo 4: Los elementos de los estados financieros.** Párrafos 4.1-4.72. **Aquí están las definiciones de elementos.**\n"
        "- **Párr. 4.1:** introducción.\n"
        "- **Párr. 4.3:** definición de **activo**.\n"
        "- **Párr. 4.4-4.18:** concepto de **recurso económico**, beneficios económicos.\n"
        "- **Párr. 4.5-4.13:** detalles sobre potencial de producir beneficios económicos. **NO trata patrimonio, pasivos, ingresos, ni diferencias de cambio.**\n"
        "- **Párr. 4.19-4.25:** concepto de **control**.\n"
        "- **Párr. 4.26:** definición de **pasivo**.\n"
        "- **Párr. 4.29-4.31:** obligación que la entidad no tiene capacidad práctica de evitar (incluye **obligación implícita**).\n"
        "- **Párr. 4.63:** definición de **patrimonio**.\n"
        "- **Párr. 4.68:** definición de **ingresos**.\n"
        "- **Párr. 4.69:** definición de **gastos**.\n\n"
        "**Capítulo 5: Reconocimiento y baja en cuentas.** Párrafos 5.1-5.26.\n\n"
        "**Capítulo 6: Medición.** Párrafos 6.1-6.95.\n\n"
        "**Capítulo 7: Presentación e información a revelar.** Párrafos 7.1-7.22.\n\n"
        "**Capítulo 8: Conceptos de capital y mantenimiento del capital.** Párrafos 8.1-8.10.\n\n"
        "**IMPORTANTE · evitar las siguientes asignaciones erradas:**\n\n"
        "- **NO usar el párrafo 4.5 para citar definiciones de pasivo, patrimonio, ingresos, gastos, ni para temas de medición o presentación.** El párrafo 4.5 trata recursos económicos (subordinado a la definición de activo).\n"
        "- Para **pasivo**: párr. **4.26** (no 4.5).\n"
        "- Para **patrimonio**: párr. **4.63** (no 4.5).\n"
        "- Para **ingresos**: párr. **4.68** (no 4.5).\n"
        "- Para **gastos**: párr. **4.69** (no 4.5).\n"
        "- Para **obligación implícita** (constructive obligation): párr. **4.31** (no 4.5).\n"
        "- Para **base de acumulación / devengado**: párr. **1.17** (no 4.5).\n"
        "- Para temas de **medición**: capítulo **6** (no capítulo 4).\n"
        "- Para **diferencias de cambio**: **NIC 21** (no MC IASB · es norma específica, no marco conceptual).\n"
        "- Para **provisiones, pasivos contingentes, obligaciones implícitas**: **NIC 37** (no MC IASB)."
    ),
    "source_refs": [
        "Marco Conceptual IASB 2018 · IFRS Foundation",
        "ifrs.org · estructura oficial del Conceptual Framework for Financial Reporting (2018)",
    ],
    "related_concepts": [
        "mc_iasb","marco_conceptual_iasb","iasb","iasb_2018",
        "parr_4_5","parr_4_26","parr_4_63","parr_4_31","parr_1_17",
        "definicion_activo","definicion_pasivo","definicion_patrimonio",
        "obligacion_implicita","constructive_obligation",
    ],
    "materia": "Contabilidad",
    "difficulty": "intermedio",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel5_2026-05-06",
    "chunk_id": "auditor-nivel5-mc-iasb-estructura-v1",
    "_anubis_meta": _meta(
        "Salvaguarda contra patología recurrente #1: cita 'IASB MC párr. 4.5' mal asignada (6 ocurrencias en barrido N3-N5)",
        "auditor_contador_nivel5_salvaguarda_patologia_recurrente",
    ),
}

# ── 1. PN vs capital social (Q1) ─────────────────────────────────────────
PN_VS_CAPITAL_SOCIAL = {
    "id": "pn_vs_capital_social_relacion_inclusion",
    "type": "concept",
    "patterns": [
        "patrimonio neto vs capital social","capital social vs patrimonio neto",
        "es lo mismo patrimonio neto que capital social","es lo mismo patrimonio neto y capital social",
        "diferencia capital social patrimonio neto","diferencia entre capital social y patrimonio neto",
        "capital social y patrimonio neto","capital social patrimonio neto",
        "capital social es patrimonio neto","capital social parte patrimonio neto",
        "lgs 19.550 capital social","lgs 19550 capital social","ley 19.550 capital social",
        "componentes patrimonio neto","componentes del patrimonio neto",
        "capital suscripto integrado","capital social suscripto",
    ],
    "answer_full": (
        "**Patrimonio neto vs capital social · relación de inclusión, no equivalencia**\n\n"
        "**No son lo mismo:** capital social es **un componente** del patrimonio neto, no su equivalente.\n\n"
        "**Capital social** es el **aporte de los socios o accionistas** a la sociedad, regulado en Argentina por la "
        "**Ley General de Sociedades 19.550** (LGS), arts. 186-211 para sociedades por acciones. Tiene función de "
        "garantía frente a terceros y base para el cálculo de derechos políticos y económicos (voto, dividendos, "
        "suscripción preferente). Se subdivide en:\n"
        "- **Capital suscripto:** comprometido por los socios.\n"
        "- **Capital integrado:** efectivamente aportado.\n"
        "- **Capital autorizado:** límite estatutario.\n\n"
        "**Patrimonio neto** es el **conjunto de partidas que constituyen la participación residual de los propietarios "
        "en los activos del ente** (MC IASB 2018 párr. 4.63 · RT 54 NUA §24 · RT 16 §4.1.3 con redacción patrimonialista). "
        "Está integrado por:\n"
        "1. **Capital social** (aporte directo de los socios · LGS 19.550).\n"
        "2. **Ajustes al capital** (por reexpresión / inflación · RT 6).\n"
        "3. **Aportes irrevocables a cuenta de futuras suscripciones.**\n"
        "4. **Primas de emisión.**\n"
        "5. **Reservas** (legal, estatutaria, facultativa).\n"
        "6. **Resultados no asignados** (acumulados de ejercicios anteriores + del ejercicio).\n"
        "7. **Resultados diferidos** (ORI argentino · diferencias de conversión, ajustes por revaluación, ganancias/"
        "pérdidas actuariales según corresponda).\n\n"
        "**Relación: Capital social ⊂ Patrimonio neto.** El capital social es **un solo componente** entre los siete "
        "(o más) integrantes del PN. Una empresa puede tener capital social positivo y patrimonio neto cero o negativo "
        "si los resultados acumulados negativos absorben los aportes (situación de causal de disolución bajo "
        "LGS 19.550 art. 94 inc. 5: \"pérdida del capital social\" cuando las pérdidas absorben el capital).\n\n"
        "**Exposición:** RT 9 capítulo V regula el **Estado de Evolución del Patrimonio Neto**, que muestra los "
        "movimientos de cada componente entre dos fechas (saldo inicial · aumentos · disminuciones · saldo final). "
        "RT 8 capítulo III regula la presentación del PN dentro del estado de situación patrimonial.\n\n"
        "**Marco IASB:** **NIC 1** (presentación de estados financieros) regula la exposición del patrimonio en estados "
        "consolidados y separados. **NIIF 10** introduce la separación entre **patrimonio atribuible a propietarios "
        "de la controladora** y **participaciones no controlantes** (NCI), que son dos componentes del PN consolidado.\n\n"
        "**Citas correctas (no usar IASB MC párr. 4.5 para PN):** la definición IASB de patrimonio está en "
        "**MC IASB 2018 párr. 4.63**, no en párr. 4.5 (que trata recursos económicos)."
    ),
    "source_refs": [
        "Ley General de Sociedades 19.550 (LGS · arts. 186-211 sociedades por acciones · art. 94 inc. 5 disolución)",
        "RT 8 FACPCE capítulo III (presentación PN en estado de situación patrimonial)",
        "RT 9 FACPCE capítulo V (Estado de Evolución del Patrimonio Neto)",
        "RT 16 FACPCE §4.1.3 (definición patrimonialista)",
        "RT 54 NUA FACPCE §24 (definición vigente desde 2024-07-01)",
        "MC IASB 2018 párr. 4.63 (definición residualista de patrimonio)",
        "NIC 1 (presentación estados financieros)",
        "NIIF 10 párr. 22 (NCI en consolidados)",
    ],
    "related_concepts": ["patrimonio_neto","capital_social","lgs_19550","rt_8","rt_9","rt_16","rt_54_nua","mc_iasb","niif_10","nci"],
    "materia": "Contabilidad",
    "difficulty": "intermedio",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel5_2026-05-06",
    "chunk_id": "auditor-nivel5-pn-vs-capital-v1",
    "_anubis_meta": _meta(
        "Sin entry · LLM atribuyó RT 16 §4.1.2 (pasivo) a capital social + IASB MC párr. 4.5 a PN + 'activo líquido / pasivo líquido' inventado",
        "auditor_contador_nivel5_q1_rechazada",
    ),
}

# ── 2. PN aritmético vs presentación (Q2) ────────────────────────────────
PN_PRESENTACION = {
    "id": "pn_aritmetico_vs_presentacion_supuestos",
    "type": "concept",
    "patterns": [
        "patrimonio neto siempre activo menos pasivo","pn siempre activo menos pasivo",
        "patrimonio neto siempre 40","pn siempre 40","activo 100 pasivo 60 patrimonio neto 40",
        "supuestos pn igualdad","casos donde pn no es activo menos pasivo",
        "supuestos donde igualdad pn no se cumple","supuestos presentación patrimonio neto",
        "acciones propias en cartera pn","acciones propias en cartera patrimonio neto",
        "intereses no controlantes pn","intereses no controlantes patrimonio neto",
        "treasury shares patrimonio neto","participaciones no controlantes consolidados",
        "ori patrimonio neto","otros resultados integrales patrimonio neto",
        "dividendos a pagar declarados pre-cierre","dividendos declarados pre cierre pasivo",
        "igualdad aparente pn presentación","igualdad aparente pn presentacion",
    ],
    "answer_full": (
        "**¿El PN siempre es Activo − Pasivo? · supuestos donde la igualdad aparente se rompe en presentación**\n\n"
        "**Aritméticamente:** sí, el PN es siempre la diferencia matemática Activo total − Pasivo total. Esto es "
        "definición residualista del MC IASB 2018 párr. 4.63 y RT 54 NUA §24.\n\n"
        "**En presentación contable, hay supuestos donde la igualdad aparente \"Activo − Pasivo = PN\" requiere ajustes "
        "de lectura:**\n\n"
        "**1. Acciones propias en cartera (treasury shares):**\n"
        "Cuando una sociedad recompra acciones propias, **NIC 32 párr. 33-34** y **RT 9** disponen que **NO se reconocen "
        "como activo**. Se exponen como **deducción del patrimonio neto** (\"acciones propias en cartera\" con signo "
        "negativo en PN). Resultado: el activo recomprado no figura en el activo total, pero el costo de recompra "
        "reduce el PN.\n\n"
        "**2. Dividendos a pagar declarados pre-cierre:**\n"
        "Si el ente declara dividendos antes del cierre del ejercicio pero los paga después, **NIC 1 párr. 137** y "
        "**RT 9 capítulo V** disponen reconocer un **pasivo** por dividendos a pagar y reducir resultados acumulados "
        "en el PN. La declaración convierte resultados (PN) en pasivo, modificando ambas magnitudes simultáneamente.\n\n"
        "**3. Otros Resultados Integrales (ORI / OCI):**\n"
        "Bajo NIIF, ciertos cambios en valor razonable de activos (instrumentos financieros a valor razonable con cambios "
        "en ORI bajo **NIIF 9**, revaluación de PP&E bajo **NIC 16**, ganancias/pérdidas actuariales bajo **NIC 19**) "
        "se reconocen directamente en patrimonio sin pasar por resultados del ejercicio. La \"Resultado Integral Total\" "
        "combina resultado del ejercicio + ORI. En estados de Argentina vía RT 26, estos elementos se exponen en cuentas "
        "específicas dentro del PN.\n\n"
        "**4. Participaciones no controlantes (NCI) en estados consolidados:**\n"
        "Bajo **NIIF 10 párr. 22**, el patrimonio neto consolidado se separa en **patrimonio atribuible a propietarios "
        "de la controladora** + **participaciones no controlantes** (NCI). La NCI se mide al valor razonable o a la "
        "proporción del PN identificable de la subsidiaria (**NIIF 3 párr. 19**). En estados consolidados, "
        "A − P = PN total = PN controladora + NCI.\n\n"
        "**5. Ajustes de transición a NIIF (RT 26):**\n"
        "Para entes que adoptan NIIF, **NIIF 1** dispone reconocer en resultados acumulados los ajustes de primera "
        "adopción. Esto altera el PN inicial bajo NIIF respecto del PN bajo norma anterior, sin que la diferencia "
        "surja de operaciones del ejercicio.\n\n"
        "**6. Reexpresión por inflación (RT 6 activa):**\n"
        "La reexpresión de partidas no monetarias por IPC modifica el saldo en pesos del PN sin que cambien las "
        "magnitudes en moneda constante. La igualdad A − P = PN se mantiene en moneda homogénea pero los importes "
        "nominales en pesos varían según la fecha de reexpresión.\n\n"
        "**Conclusión:** la igualdad A − P = PN se mantiene siempre **aritméticamente** y **en moneda homogénea**. "
        "Lo que varía son los componentes específicos del PN según el régimen de presentación, y en algunos casos "
        "la presentación de partidas (acciones propias, NCI) modifica la lectura aparente del estado de situación "
        "patrimonial."
    ),
    "source_refs": [
        "MC IASB 2018 párr. 4.63 (definición residualista PN)",
        "RT 54 NUA FACPCE §24",
        "NIC 32 párr. 33-34 (acciones propias)",
        "NIC 1 párr. 137 (dividendos declarados pre-cierre)",
        "RT 9 FACPCE capítulo V (Estado de Evolución del PN)",
        "NIC 16, NIC 19, NIIF 9 (ORI · ganancias/pérdidas a patrimonio)",
        "NIIF 10 párr. 22 (separación NCI en consolidados)",
        "NIIF 3 párr. 19 (medición NCI)",
        "NIIF 1 (transición a NIIF)",
        "RT 6 FACPCE (reexpresión por inflación)",
    ],
    "related_concepts": [
        "patrimonio_neto","acciones_propias","treasury_shares","ori","oci",
        "nci","participaciones_no_controlantes","niif_10","niif_3","nic_32","nic_1","nic_16","nic_19","niif_9","niif_1","rt_9","rt_6",
    ],
    "materia": "Contabilidad",
    "difficulty": "avanzado",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel5_2026-05-06",
    "chunk_id": "auditor-nivel5-pn-presentacion-v1",
    "_anubis_meta": _meta(
        "Sin entry · refuse honesto + contenido superficial · trampa fina sobre supuestos donde igualdad aparente se rompe",
        "auditor_contador_nivel5_q2_observacion",
    ),
}

# ── 3. Devengado alcance partidas no monetarias (Q3) ─────────────────────
DEVENGADO_ALCANCE = {
    "id": "devengado_alcance_partidas_no_monetarias",
    "type": "concept",
    "patterns": [
        "devengado partidas no monetarias","devengado se aplica partidas no monetarias",
        "devengado solo flujos monetarios","devengado solo a flujos monetarios",
        "criterio de devengado se aplica también a partidas no monetarias o solo a flujos monetarios",
        "criterio del devengado se aplica también a partidas no monetarias o solo a flujos monetarios",
        "el criterio de devengado se aplica también a partidas no monetarias o solo a flujos monetarios",
        "alcance del devengado","alcance devengado","devengado aplica a todos los elementos",
        "devengado depreciación","devengado amortización","devengado deterioro",
        "devengado depreciacion","devengado amortizacion",
        "devengado costo de ventas","devengado recpam","devengado provisiones",
        "imputación temporal devengado","imputacion temporal devengado",
        "devengado partidas monetarias","devengado partidas monetarias y no monetarias",
        "se aplica a partidas no monetarias o solo a flujos monetarios",
    ],
    "answer_full": (
        "**Devengado · alcance: aplica a todos los elementos de los estados contables, monetarios y no monetarios**\n\n"
        "**Definición:** el devengado es un **criterio de imputación temporal** que reconoce los efectos de las "
        "transacciones y otros sucesos económicos en el período en que ocurren los hechos sustanciales que les dan "
        "origen, con independencia del momento de cobro o pago.\n\n"
        "**Marco normativo:**\n"
        "- **RT 17 FACPCE §2.2** establece el devengado como criterio de medición.\n"
        "- **RT 54 NUA §18** mantiene el principio: \"Una entidad elaborará sus estados contables utilizando la base "
        "de acumulación o devengado, salvo que esta Resolución Técnica u otras normas contables requieran o permitan "
        "algún tratamiento diferente.\"\n"
        "- **NIC 1 párr. 27-28** obliga a usar la base contable de acumulación para todos los estados financieros "
        "excepto el de flujos de efectivo.\n"
        "- **MC IASB 2018 párr. 1.17** refuerza el principio: \"La contabilidad de acumulación describe los efectos "
        "de las transacciones y otros sucesos y circunstancias en los recursos económicos y los derechos de los "
        "acreedores de una entidad informante en los períodos en que esos efectos ocurren, incluso si los cobros y "
        "pagos resultantes ocurren en un período diferente.\"\n\n"
        "**Alcance: el devengado aplica a TODOS los elementos contables, no solo a flujos monetarios.**\n\n"
        "**Aplicaciones a partidas monetarias (ejemplos):**\n"
        "- Intereses devengados sobre créditos / deudas en moneda.\n"
        "- Alquileres devengados.\n"
        "- Salarios devengados pendientes de pago.\n"
        "- Impuestos devengados pendientes de pago.\n\n"
        "**Aplicaciones a partidas no monetarias (ejemplos):**\n"
        "- **Depreciación de bienes de uso:** se devenga el consumo del activo no monetario en el período.\n"
        "- **Amortización de intangibles.**\n"
        "- **Deterioro de activos** (RT 17 §4.4.7 / NIC 36): se devenga la pérdida de valor recuperable.\n"
        "- **Costo de ventas:** se devenga al momento del reconocimiento del ingreso por venta, no al pago al proveedor.\n"
        "- **Ingresos por avance de obra (NIIF 15 / RT 17):** se devengan según método de avance, no al cobro.\n"
        "- **RECPAM (RT 6 activa):** se devenga el resultado por exposición a la inflación.\n"
        "- **Provisiones (RT 17 §5.11 / NIC 37):** se devengan obligaciones presentes con incertidumbre en monto o vencimiento.\n\n"
        "**Importante:** el único estado contable que **NO** usa devengado es el **estado de flujos de efectivo** "
        "(NIC 7 / RT 8 capítulo VI), que por definición trabaja con flujos efectivos de caja y equivalentes.\n\n"
        "**Confusión típica que la pregunta busca exponer:** algunos materiales pedagógicos sugieren que \"devengado\" "
        "es solo un criterio para diferenciar cobros/pagos de ingresos/gastos (es decir, solo aplicable a flujos "
        "monetarios). Esa lectura es **incompleta**. El devengado es un principio de **imputación temporal** universal, "
        "aplicable a la generación, baja, valuación y exposición de **todos los elementos contables** según el período "
        "en que ocurren los hechos sustanciales."
    ),
    "source_refs": [
        "RT 17 FACPCE §2.2 (devengado como criterio de medición)",
        "RT 54 NUA FACPCE §18 (base de acumulación / devengado)",
        "NIC 1 párr. 27-28 (base contable de acumulación)",
        "MC IASB 2018 párr. 1.17 (contabilidad de acumulación · texto literal)",
        "NIC 7 / RT 8 capítulo VI (estado de flujos de efectivo · única excepción)",
        "RT 17 §4.4.7 / NIC 36 (deterioro · ejemplo no monetario)",
        "NIIF 15 / RT 17 (ingresos por avance · ejemplo)",
        "RT 6 FACPCE (RECPAM · ejemplo)",
        "RT 17 §5.11 / NIC 37 (provisiones · ejemplo)",
    ],
    "related_concepts": [
        "devengado","acumulación","imputacion_temporal","rt_17","rt_54_nua","nic_1","mc_iasb",
        "depreciacion","amortizacion","deterioro","recpam","rt_6","provisiones","nic_37","nic_36","niif_15",
    ],
    "materia": "Contabilidad",
    "difficulty": "intermedio",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel5_2026-05-06",
    "chunk_id": "auditor-nivel5-devengado-alcance-v1",
    "_anubis_meta": _meta(
        "Entry específica para dicotomía monetario/no-monetario · evita patología 'matching parcial con devengado_concepto'",
        "auditor_contador_nivel5_q3_rechazada",
    ),
}

# ── 4. Ecuación contable genealogía Pacioli (Q4) ─────────────────────────
ECUACION_GENEALOGIA = {
    "id": "ecuacion_contable_genealogia_pacioli",
    "type": "concept",
    "patterns": [
        "ecuación contable historia","ecuacion contable historia",
        "ecuación contable genealogía","ecuacion contable genealogia",
        "ecuación contable origen","ecuacion contable origen",
        "ecuación contable básica origen","ecuacion contable basica origen",
        "a igual p mas pn origen","a = p + pn origen","a = p + pn historia",
        "ecuación contable iasb invención","ecuacion contable iasb invencion",
        "ecuación contable pacioli","ecuacion contable pacioli","luca pacioli partida doble",
        "summa de arithmetica pacioli","escuela continental europea contabilidad",
        "schmalenbach contabilidad","schmidt contabilidad estática",
        "ecuación contable básica a = p + pn","ecuacion contable basica a = p + pn",
        "es invención del marco conceptual iasb","es invencion del marco conceptual iasb",
        "ecuación contable iasb 2018 invención","ecuacion contable iasb 2018 invencion",
    ],
    "answer_full": (
        "**Genealogía de la ecuación contable A = P + PN**\n\n"
        "**Significado de la ecuación:**\n"
        "- **A:** Activo (recursos económicos controlados por el ente).\n"
        "- **P:** Pasivo (obligaciones presentes del ente).\n"
        "- **PN:** Patrimonio Neto (participación residual de los propietarios).\n\n"
        "Forma equivalente: **A − P = PN** (residualismo) · **A = P + PN** (suma).\n\n"
        "**Origen histórico (genealogía):**\n\n"
        "**Siglo XV · Luca Pacioli (1494):** sistematiza el método de la **partida doble** (debe / haber) en *Summa de "
        "Arithmetica, Geometria, Proportioni et Proportionalita*, obra publicada en Venecia. La partida doble es el "
        "sustrato lógico de la ecuación contable: toda transacción afecta al menos dos cuentas con igual monto. "
        "La identidad A = P + PN es consecuencia directa de la partida doble aplicada al estado de situación "
        "patrimonial.\n\n"
        "**Siglos XVII-XIX · Escuela continental europea:** desarrollo de la **contabilidad estática** y la "
        "sistematización de los estados patrimoniales. Autores como **Eugen Schmalenbach** (escuela alemana, fines "
        "del s. XIX y principios del XX) y **Fritz Schmidt** consolidaron el rol de la ecuación contable como base "
        "del balance.\n\n"
        "**Siglos XIX-XX · Derecho contable continental europeo:** la ecuación contable se incorpora a la legislación "
        "mercantil de los países de tradición napoleónica (Francia, España, Italia, Argentina por vía indirecta a "
        "través del Código de Comercio de 1862 y luego LGS 19.550 de 1972).\n\n"
        "**Siglo XX · Doctrina argentina:** la ecuación contable formaba parte del marco normativo y doctrinario "
        "argentino mucho antes de RT 16 (2000). Aparece en obras clásicas de la doctrina argentina (Lopes de Sá, "
        "Fowler Newton, Ostengo) y en la normativa profesional anterior (CECYT FACPCE, RT 6 original de 1984, etc.).\n\n"
        "**Siglo XXI · Recepción en MC IASB 2018:** el **Marco Conceptual IASB 2018** (párr. 4.63) adopta la "
        "formulación residualista (PN = A − P) como definición de patrimonio. **NO inventa la ecuación**, la "
        "recepciona desde la tradición contable. La RT 16 FACPCE (2000) §4.1.3 había adoptado una formulación "
        "patrimonialista (PN = aportes + resultados acumulados). RT 54 NUA §24 (vigente desde 2024-07-01) alinea el "
        "marco argentino con el residualismo IASB.\n\n"
        "**Conclusión:** la ecuación contable A = P + PN **NO es invención IASB 2018** ni invención de RT 16 / "
        "RT 54 NUA. Tiene origen en la partida doble de **Luca Pacioli (1494)** y se sistematiza en los siglos "
        "XVII-XIX por la **escuela continental europea**. Tanto el MC IASB 2018 como las RT FACPCE adoptan y "
        "formulan en sus respectivos lenguajes una identidad contable que es patrimonio común de la teoría contable "
        "desde hace más de cinco siglos.\n\n"
        "**Importante · errores categoriales que evitar:**\n"
        "- \"A\" significa **Activo**, no \"patrimonio neto\".\n"
        "- \"P\" significa **Pasivo**, no \"patrimonio líquido\".\n"
        "- \"PN\" significa **Patrimonio Neto**, no \"patrimonio no liquidado\".\n"
        "- Los términos **\"patrimonio líquido\"** y **\"patrimonio no liquidado\"** NO existen en el marco contable "
        "argentino ni IASB.\n"
        "- **RT 16 FACPCE es de diciembre de 2000**, no de 1974.\n"
        "- **RT 16 se estructura en secciones (§), no artículos.** No existe \"RT 16 art. 3\"."
    ),
    "source_refs": [
        "Luca Pacioli · Summa de Arithmetica, Geometria, Proportioni et Proportionalita (1494, Venecia)",
        "Eugen Schmalenbach · escuela alemana de contabilidad (fines s. XIX - principios s. XX)",
        "Fritz Schmidt · escuela continental europea",
        "Código de Comercio argentino (1862 · derogado por LGS 19.550 en 1972)",
        "LGS 19.550 (Ley General de Sociedades · 1972 con modificatorias)",
        "RT 6 FACPCE (1984 · norma argentina pre-RT 16)",
        "RT 16 FACPCE (2000 · §4.1.3 definición patrimonialista)",
        "RT 54 NUA FACPCE §24 (2024-07-01 · alineación residualista)",
        "MC IASB 2018 párr. 4.63 (definición residualista de patrimonio)",
        "Doctrina argentina · Fowler Newton, Lopes de Sá, Ostengo",
    ],
    "related_concepts": [
        "ecuacion_contable","partida_doble","luca_pacioli","schmalenbach","schmidt",
        "contabilidad_estatica","escuela_continental","rt_16","rt_54_nua","mc_iasb","patrimonio_neto",
    ],
    "materia": "Contabilidad",
    "difficulty": "avanzado",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel5_2026-05-06",
    "chunk_id": "auditor-nivel5-genealogia-pacioli-v1",
    "_anubis_meta": _meta(
        "Sin entry · LLM redefinió A=patrimonio neto, P=patrimonio líquido, PN=patrimonio no liquidado + RT 16 (1974) inventado + cita art. 3 inexistente",
        "auditor_contador_nivel5_q4_rechazada_catastrofica",
    ),
}

# ── 5. Pasivo obligación implícita NIC 37 (Q5) ───────────────────────────
PASIVO_OBLIGACION_IMPLICITA = {
    "id": "pasivo_obligacion_implicita_constructive",
    "type": "concept",
    "patterns": [
        "pasivo sin obligación legal","pasivo sin obligacion legal",
        "pasivo sin obligación legal exigible","pasivo sin obligacion legal exigible",
        "puede existir pasivo sin obligación legal","puede existir pasivo sin obligacion legal",
        "puede existir un pasivo sin obligación legal exigible","puede existir un pasivo sin obligacion legal exigible",
        "obligación implícita pasivo","obligacion implicita pasivo",
        "constructive obligation","constructive obligations",
        "obligación práctica de evitar pasivo","obligacion practica de evitar pasivo",
        "nic 37 obligación implícita","nic 37 obligacion implicita",
        "nic 37 provisiones","nic 37 pasivo contingente",
        "rt 17 §5.11 provisiones","rt 17 5.11 provisiones",
        "obligaciones implícitas constructive","obligaciones implicitas constructive",
        "garantía extendida obligación implícita","garantia extendida obligacion implicita",
        "programa fidelidad obligación implícita","programa fidelidad obligacion implicita",
        "iasb mc 4.31","mc iasb 4.31",
    ],
    "answer_full": (
        "**¿Puede existir un pasivo sin obligación legal exigible? · obligaciones implícitas (constructive obligations)**\n\n"
        "**Respuesta corta:** **Sí.** El marco contable (tanto MC IASB 2018 como RT FACPCE) reconoce que un pasivo "
        "puede existir sin obligación legal o contractual exigible cuando se trata de una **obligación implícita** "
        "(constructive obligation) que la entidad no tiene capacidad práctica de evitar.\n\n"
        "**Marco IASB:**\n\n"
        "**MC IASB 2018 párr. 4.31** desarrolla el concepto de **\"obligación que la entidad no tiene capacidad "
        "práctica de evitar\"**: incluye no solo obligaciones legales sino también obligaciones que surgen de "
        "**prácticas pasadas establecidas, políticas declaradas públicamente, o declaraciones específicas que crean "
        "expectativas válidas en terceros** que la entidad va a cumplir con esas responsabilidades.\n\n"
        "**NIC 37 párr. 10 (definición de obligación implícita):** una obligación implícita es aquella que se deriva "
        "de las actuaciones de la entidad cuando:\n"
        "- (a) Por un patrón establecido de comportamiento pasado, políticas publicadas o declaraciones efectuadas "
        "suficientemente específicas, la entidad ha indicado a terceros que aceptará ciertas responsabilidades; y\n"
        "- (b) Como consecuencia, la entidad ha creado una expectativa válida en esos terceros respecto al "
        "cumplimiento de dichas responsabilidades.\n\n"
        "**NIC 37 párr. 17:** una obligación implícita exigible debe reconocerse como pasivo (o provisión, según "
        "monto y vencimiento) si los demás criterios de reconocimiento se cumplen.\n\n"
        "**Marco argentino:**\n\n"
        "**RT 17 §5.11 (provisiones · paralelo a NIC 37):** reconoce provisiones por obligaciones que no son "
        "estrictamente legales pero que cumplen criterios análogos de probabilidad y estimación confiable. La "
        "**RT 16 §4.1.2**, en su definición de pasivo, contempla la cláusula **\"obligación ineludible o (en caso "
        "de ser contingente) altamente probable\"**, que captura obligaciones implícitas con redacción argentina.\n\n"
        "**RT 54 NUA §23 (vigente desde 2024-07-01):** mantiene el criterio alineado con MC IASB 2018, manteniendo "
        "la formulación argentina de \"obligación presente del ente, surgida a raíz de sucesos pasados, cuya "
        "cancelación se espera dé lugar a una salida de recursos\".\n\n"
        "**Ejemplos típicos de obligaciones implícitas (no legalmente exigibles):**\n"
        "1. **Política declarada de garantía extendida más allá del período legal.** Una empresa que históricamente "
        "extiende garantías por 24 meses cuando la ley solo exige 6 meses, y comunica esa práctica a sus clientes, "
        "ha creado obligación implícita que debe reconocerse como pasivo cuando se efectúan ventas.\n"
        "2. **Programa anunciado de retiros voluntarios.** Una empresa que anuncia un programa de retiros voluntarios "
        "con beneficios específicos genera obligación implícita por los pagos que efectivamente se materializarán, "
        "aunque cada empleado decida individualmente.\n"
        "3. **Política pública de reparación ambiental más estricta que la regulatoria.** Empresa que declara "
        "públicamente compromiso de remediación ambiental superior al exigido legalmente.\n"
        "4. **Bonus discrecionales con patrón consolidado.** Si la dirección históricamente paga bonus a empleados "
        "aunque no exista contrato formal, la práctica consolidada genera obligación implícita.\n\n"
        "**Distinción con caso de obligación legal con garantía real (ej. préstamo hipotecario):** un préstamo con "
        "garantía hipotecaria es **caso paradigmático de obligación legal formal**, NO de obligación implícita. "
        "La hipoteca es la garantía real (cosa) sobre la obligación principal (mutuo); ambas son obligaciones legales "
        "y contractuales formalmente exigibles.\n\n"
        "**Distinción con activos contingentes y pasivos contingentes:** las obligaciones implícitas con "
        "probabilidad alta + estimación confiable se reconocen como **pasivos** (provisiones). Las que tienen "
        "probabilidad menor o no admiten estimación confiable se exponen como **pasivos contingentes** en notas a "
        "los estados contables, sin reconocimiento como pasivo.\n\n"
        "**Importante · errores categoriales que evitar:**\n"
        "- El IASB **NO exige** \"obligación legal o contractual clara\" para reconocer un pasivo. Al contrario, "
        "**amplía** el concepto a obligaciones implícitas vía MC IASB 2018 párr. 4.31 y NIC 37 párr. 10.\n"
        "- **No existe \"nota del Comité\" en RT 16 §4.1.2.** Esa atribución es invención.\n"
        "- El cuerpo IASB sobre obligaciones implícitas es **NIC 37**, no MC IASB párr. 4.5 (que trata recursos económicos)."
    ),
    "source_refs": [
        "MC IASB 2018 párr. 4.31 (obligación que la entidad no tiene capacidad práctica de evitar)",
        "NIC 37 párr. 10 (definición de obligación implícita / constructive obligation)",
        "NIC 37 párr. 17 (criterio de reconocimiento)",
        "RT 17 FACPCE §5.11 (provisiones · paralelo a NIC 37)",
        "RT 16 FACPCE §4.1.2 (cláusula 'ineludible o altamente probable')",
        "RT 54 NUA FACPCE §23 (vigente desde 2024-07-01)",
        "LGS 19.550 (responsabilidades societarias)",
    ],
    "related_concepts": [
        "pasivo","obligacion_implicita","constructive_obligation","nic_37","provisiones",
        "rt_17","rt_16","rt_54_nua","mc_iasb","pasivos_contingentes",
    ],
    "materia": "Contabilidad",
    "difficulty": "avanzado",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel5_2026-05-06",
    "chunk_id": "auditor-nivel5-pasivo-implicita-v1",
    "_anubis_meta": _meta(
        "Sin entry · LLM atribución INVERTIDA al IASB ('obligación legal clara') + 'nota del Comité' inventada + ejemplo hipoteca invertido",
        "auditor_contador_nivel5_q5_rechazada_catastrofica",
    ),
}

# ── 6. FIX entry existente: devengado_concepto (bloques vacíos) ──────────
DEVENGADO_CONCEPTO_FIX = {
    "id": "devengado_concepto",
    "type": "concept",
    "patterns": [
        "como se define devengado","como se define el devengado","cómo se define devengado","cómo se define el devengado",
        "concepto de devengado","criterio de devengado","criterio del devengado",
        "definicion de devengado","definición de devengado",
        "qué es devengado","que es devengado","qué es el devengado","que es el devengado",
        "base de acumulación","base de acumulacion","base contable de acumulación","base contable de acumulacion",
        "principio de devengado","principio del devengado",
    ],
    "answer_full": (
        "**Devengado · definición técnica multi-marco**\n\n"
        "**Concepto:** el devengado (o base de acumulación) es un **criterio de imputación temporal** que reconoce "
        "los efectos de las transacciones y otros sucesos económicos en el período en que ocurren los hechos "
        "sustanciales que les dan origen, con independencia del momento de cobro o pago.\n\n"
        "**RT 17 FACPCE §2.2 (criterio de medición · devengado):**\n"
        "> \"Las variaciones patrimoniales que deben considerarse para establecer el resultado económico son las que "
        "competen a un ejercicio sin entrar a considerar si se han cobrado o pagado.\"\n\n"
        "_Fuente: RT 17 FACPCE — §2.2 Devengado_\n\n"
        "**RT 54 NUA FACPCE §18 (vigente desde 2024-07-01):**\n"
        "> \"Una entidad elaborará sus estados contables utilizando la base de acumulación o devengado, salvo que "
        "esta Resolución Técnica u otras normas contables requieran o permitan algún tratamiento diferente.\"\n\n"
        "_Fuente: RT 54 NUA FACPCE — §18 (Título I · Elementos / Bases)_\n\n"
        "**Marco Conceptual IASB 2018 párr. 1.17:**\n"
        "> \"La contabilidad de acumulación describe los efectos de las transacciones y otros sucesos y "
        "circunstancias en los recursos económicos y los derechos de los acreedores de una entidad informante en "
        "los períodos en que esos efectos ocurren, incluso si los cobros y pagos resultantes ocurren en un período "
        "diferente.\"\n\n"
        "_Fuente: MC IASB 2018 — Capítulo 1 · Párr. 1.17 (base de acumulación / devengado)_\n\n"
        "**Alcance del devengado:** aplica a **todos los elementos contables, monetarios y no monetarios** "
        "(activos, pasivos, ingresos, gastos, ganancias, pérdidas). Aplicaciones típicas: depreciación, "
        "amortización, deterioro, costo de ventas, ingresos por avance, RECPAM bajo RT 6, provisiones, intereses "
        "devengados, salarios devengados.\n\n"
        "**Excepción:** el único estado contable que NO usa devengado es el **estado de flujos de efectivo** "
        "(NIC 7 / RT 8 capítulo VI), que por definición trabaja con flujos efectivos de caja y equivalentes."
    ),
    "source_refs": [
        "RT 17 FACPCE §2.2 (devengado como criterio de medición)",
        "RT 54 NUA FACPCE §18 (base de acumulación / devengado · vigente desde 2024-07-01)",
        "MC IASB 2018 párr. 1.17 (contabilidad de acumulación · texto literal)",
        "NIC 1 párr. 27-28 (base contable de acumulación)",
        "NIC 7 / RT 8 capítulo VI (estado de flujos de efectivo · única excepción)",
    ],
    "related_concepts": [
        "devengado","acumulacion","imputacion_temporal","rt_17","rt_54_nua","mc_iasb","nic_1","nic_7","rt_8",
    ],
    "materia": "Contabilidad",
    "difficulty": "intermedio",
    "validated": True,
    "generated_by": "manual_patch:auditor_contador_nivel5_2026-05-06_fix_bloques_vacios",
    "chunk_id": "auditor-nivel5-devengado-fix-v2",
    "_anubis_meta": _meta(
        "Fix bloques vacíos en RT 16 (sin definición standalone · removido del cuerpo) + MC IASB 1.17 (texto agregado) + RT 17 §2.2 (texto agregado)",
        "auditor_contador_nivel5_q3_fix_bloques_vacios",
    ),
}


# ── Aplicar patches ───────────────────────────────────────────────────────
# Las que necesitan prioridad de matching van al INICIO del array:
#   - mc_iasb_2018_estructura_capitulos (salvaguarda contra párr. 4.5)
#   - devengado_alcance_partidas_no_monetarias (debe ganar a devengado_concepto en queries de dicotomía)
PRIORITY_NEW_ENTRIES = [
    MC_IASB_ESTRUCTURA,
    DEVENGADO_ALCANCE,
]
# Las nuevas que pueden ir al final (no compiten con entries existentes):
APPEND_NEW_ENTRIES = [
    PN_VS_CAPITAL_SOCIAL,
    PN_PRESENTACION,
    ECUACION_GENEALOGIA,
    PASIVO_OBLIGACION_IMPLICITA,
]
# Reemplazo de entry existente:
REPLACE_ENTRIES = [DEVENGADO_CONCEPTO_FIX]

added = 0
replaced = 0

# Reemplazos primero (in-place, sin alterar índice si está al inicio o medio)
for entry in REPLACE_ENTRIES:
    idx = next((i for i,e in enumerate(kb["entries"]) if e["id"] == entry["id"]), None)
    if idx is not None:
        kb["entries"][idx] = entry
        replaced += 1
        print(f"  ↻ replaced (in-place at idx {idx}): {entry['id']}")
    else:
        kb["entries"].append(entry)
        added += 1
        print(f"  + added (no existing): {entry['id']}")

# Insertar las priority al INICIO (orden inverso para que la primera quede en idx 0 final)
existing_ids = {e["id"] for e in kb["entries"]}
for entry in reversed(PRIORITY_NEW_ENTRIES):
    if entry["id"] in existing_ids:
        kb["entries"] = [e for e in kb["entries"] if e["id"] != entry["id"]]
    kb["entries"].insert(0, entry)
    added += 1
    print(f"  + inserted at idx 0 (priority): {entry['id']}")

# Append al final
for entry in APPEND_NEW_ENTRIES:
    if entry["id"] in existing_ids:
        kb["entries"] = [e for e in kb["entries"] if e["id"] != entry["id"]]
    kb["entries"].append(entry)
    added += 1
    print(f"  + appended: {entry['id']}")

kb["total_entries"] = len(kb["entries"])
kb["last_patched"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

with open(KB_PATH, "w", encoding="utf-8") as f:
    json.dump(kb, f, ensure_ascii=False, indent=2)

print()
print(f"[patch_nivel5] {added} added · {replaced} replaced · total entries: {kb['total_entries']}")
