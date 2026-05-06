#!/usr/bin/env python3
"""patch_kb_post_auditor_nivel1.py · fixes post-veredicto agente contador Nivel 1"""
import json
from pathlib import Path
from datetime import datetime

ROOT = Path("/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0")
KB_PATH = ROOT / "kb" / "knowledge_base.json"

with open(KB_PATH, "r", encoding="utf-8") as f:
    kb = json.load(f)

ACTIVO_MC_IASB = {
    "id": "activo_definicion_normativa",
    "type": "definition",
    "patterns": ["definí activo","definir activo","qué es un activo","qué es activo","definición de activo","activo según el marco conceptual iasb","activo según iasb","activo según el iasb","activo según marco conceptual","activo según mc iasb","activo según mc iasb 2018","definición técnica de activo","activo según rt 16","activo según la rt 16","concepto de activo","activo según rt 54 nua"],
    "answer_full": "**Activo · definición técnica normativa**\n\n**MC IASB 2018:** \"Un activo es un recurso económico presente controlado por la entidad como resultado de sucesos pasados.\" (MC IASB 2018, párr. 4.3). El propio Marco aclara que \"un recurso económico es un derecho que tiene el potencial de producir beneficios económicos.\" (MC IASB 2018, párr. 4.4). Los tres elementos constitutivos son: (i) recurso económico, (ii) control por la entidad, y (iii) hecho generador pasado. El concepto de control se desarrolla en MC IASB 2018, párr. 4.19-4.25.\n\n**RT 16 FACPCE (referencia histórica · vigente hasta 2024-06-30):** \"Un ente tiene un activo cuando, debido a un hecho ya ocurrido, controla los beneficios económicos que produce un bien.\" (RT 16, § 4.1.1). Criterio análogo al MC IASB con redacción propia.\n\n**RT 54 NUA (vigente desde 2024-07-01):** Actualizó la definición acercándola al MC IASB 2018, manteniendo los tres elementos constitutivos (recurso económico controlado · sucesos pasados · beneficios económicos futuros).",
    "source_refs": ["MC IASB 2018, párr. 4.3 (definición de activo)","MC IASB 2018, párr. 4.4 (definición de recurso económico)","MC IASB 2018, párr. 4.19-4.25 (concepto de control)","RT 16 FACPCE, § 4.1.1 (definición de activo · vigente hasta 2024-06-30)","RT 54 NUA FACPCE (vigente desde 2024-07-01 · actualización armonizada con MC IASB 2018)"],
    "related_concepts": ["activo","recurso_economico","control","patrimonio_neto","ecuacion_contable"],
    "materia": "Contabilidad", "difficulty": "intro", "validated": True,
    "generated_by": "manual_patch:auditor_contador_2026-05-05",
    "chunk_id": "auditor-nivel1-q1-activo-v1",
    "_anubis_meta": {"fix_origin": "auditor_contador_nivel1_q1_rechazada","fix_date": "2026-05-05","fix_reason": "LLM fallback fabricó definición con cita falsa (párr. 4.1) y comillas a texto inventado","doctrina": "literal_quote_or_refuse §9.5","audited_by": "agente_contador_adversarial_cto"}
}

DEVENGADO_VS_PERCIBIDO = {
    "id": "devengado_vs_percibido",
    "type": "comparison",
    "patterns": ["diferencia entre devengado y percibido","devengado y percibido","devengado vs percibido","percibido vs devengado","qué es devengado","qué es percibido","criterio devengado","criterio percibido","principio del devengado","principio de devengado","base de acumulación","base contable de acumulación","diferencia entre devengado y percibido en contabilidad","diferencia entre lo devengado y lo percibido"],
    "answer_full": "**Devengado vs percibido · criterio de imputación temporal**\n\n**Devengado (criterio contable estándar):** Los efectos de las transacciones y otros sucesos se reconocen cuando ocurren los hechos sustanciales que les dan origen, con independencia del momento en que se cobran o pagan. Aplica a ingresos, gastos, activos y pasivos.\n\n- **Marco argentino:** RT 17 FACPCE § 2.2 establece el devengado como criterio de medición. RT 54 NUA mantiene el principio.\n- **Marco IASB:** NIC 1 párr. 27 obliga a usar la \"base contable de acumulación (o devengo)\" para todos los estados financieros excepto el de flujos de efectivo. MC IASB 2018, párr. 1.17 lo refuerza.\n\n**Percibido (criterio de caja):** Reconoce ingresos y gastos en el momento del cobro o pago efectivo. **NO es criterio contable bajo NIIF ni bajo RT FACPCE para preparación de estados contables.** Aparece en marcos fiscales (Ley de Ganancias argentina · categorías de personas humanas) y en estados de flujos de efectivo.\n\n**Diferencia esencial:** No es \"uno argentino y otro IASB\". Ambos marcos contables (RT y NIIF) adoptan devengado. El percibido es marco fiscal o auxiliar, no contable.",
    "source_refs": ["MC IASB 2018, párr. 1.17 (base de acumulación)","NIC 1, párr. 27-28 (obligación de usar base de acumulación)","RT 17 FACPCE, § 2.2 (criterio de devengado · medición)","RT 54 NUA FACPCE (mantiene principio de devengado)","Ley de Impuesto a las Ganancias (Argentina · marco fiscal donde aparece percibido)"],
    "related_concepts": ["devengado","percibido","imputacion_temporal","ingreso","gasto","estados_contables"],
    "materia": "Contabilidad", "difficulty": "intro", "validated": True,
    "generated_by": "manual_patch:auditor_contador_2026-05-05",
    "chunk_id": "auditor-nivel1-q3-devengado-v1",
    "_anubis_meta": {"fix_origin": "auditor_contador_nivel1_q3_rechazada","fix_date": "2026-05-05","fix_reason": "LLM fallback INVIRTIÓ los criterios (atribuyó percibido al MC IASB · IASB usa devengado por NIC 1 párr. 27)","doctrina": "literal_quote_or_refuse §9.5","audited_by": "agente_contador_adversarial_cto"}
}

PASIVO_DEFINICION = {
    "id": "pasivo_definicion_normativa",
    "type": "definition",
    "patterns": ["definí pasivo","definir pasivo","qué es un pasivo","qué es pasivo","definición de pasivo","definición técnica de pasivo","pasivo según rt 16","pasivo según iasb","pasivo según mc iasb","pasivo según marco conceptual","pasivo según rt 54 nua","concepto de pasivo","qué es un pasivo en contabilidad","definir pasivo técnicamente"],
    "answer_full": "**Pasivo · definición técnica normativa**\n\n**RT 54 NUA (vigente desde 2024-07-01):** \"Un pasivo es una obligación presente del ente, surgida a raíz de sucesos pasados, cuya cancelación se espera dé lugar a una salida de recursos del ente que incorporan beneficios económicos.\" (RT 54 NUA, § 23)\n\n**RT 16 FACPCE (referencia histórica · vigente hasta 2024-06-30):** Define pasivo con criterio análogo en § 4.1.2 — existe pasivo cuando un ente tiene una obligación de entregar activos o prestar servicios a otra parte, esa obligación es ineludible, y existe a la fecha de los estados contables como consecuencia de hechos ya ocurridos.\n\n**MC IASB 2018:** \"Un pasivo es una obligación presente de la entidad de transferir un recurso económico como resultado de sucesos pasados.\" (MC IASB 2018, párr. 4.26). Los tres criterios constitutivos: (i) obligación presente, (ii) de transferir un recurso económico, (iii) como consecuencia de sucesos pasados.\n\n**Tensión normativa:** RT 54 NUA y MC IASB 2018 están alineados. La RT 16 histórica usaba \"obligación ineludible\" mientras que MC IASB usa \"obligación que la entidad no tiene capacidad práctica de evitar\" (MC IASB 2018, párr. 4.29). Diferencia de redacción, no de fondo.",
    "source_refs": ["RT 54 NUA FACPCE, § 23 (definición de pasivo · vigente desde 2024-07-01)","RT 16 FACPCE, § 4.1.2 (definición de pasivo · referencia histórica vigente hasta 2024-06-30)","MC IASB 2018, párr. 4.26 (definición de pasivo)","MC IASB 2018, párr. 4.29 (obligación que la entidad no tiene capacidad práctica de evitar)"],
    "related_concepts": ["pasivo","obligacion_presente","recurso_economico","activo","patrimonio_neto","ecuacion_contable"],
    "materia": "Contabilidad", "difficulty": "intro", "validated": True,
    "generated_by": "manual_patch:auditor_contador_2026-05-05",
    "chunk_id": "auditor-nivel1-q4-pasivo-v1",
    "_anubis_meta": {"fix_origin": "auditor_contador_nivel1_q4_rechazada","fix_date": "2026-05-05","fix_reason": "LLM fallback definió pasivo como activos · cita inventada RT 16 Art. 3 · ignoró RT 54 NUA","doctrina": "literal_quote_or_refuse §9.5","audited_by": "agente_contador_adversarial_cto"}
}

INGRESO_DEFINICION = {
    "id": "ingreso_definicion_normativa",
    "type": "definition",
    "patterns": ["qué se entiende por ingreso","qué es un ingreso","definición de ingreso","ingreso en términos contables","ingreso contable","definir ingreso","definí ingreso","ingreso según rt 16","ingreso según iasb","ingreso según marco conceptual","ingreso según mc iasb","ingreso según rt 54 nua","concepto de ingreso"],
    "answer_full": "**Ingreso · definición técnica normativa**\n\n**RT 16 FACPCE (referencia histórica):** \"Los ingresos son aumentos del patrimonio neto originados en la producción o venta de bienes, en la prestación de servicios o en otros hechos que hacen a las actividades principales del ente. Surgen, generalmente, de transacciones con terceros distintos de los propietarios.\" (RT 16, § 4.2.4)\n\n**RT 54 NUA (vigente desde 2024-07-01):** Mantiene criterio análogo en § 25, con alineación al MC IASB.\n\n**MC IASB 2018:** \"Ingresos son incrementos en los activos, o disminuciones en los pasivos, que dan lugar a aumentos en el patrimonio, distintos de los relacionados con aportaciones de los tenedores de derechos sobre el patrimonio.\" (MC IASB 2018, párr. 4.68)\n\n**Elementos esenciales:** (i) variación patrimonial positiva, (ii) origen distinto de aportes de propietarios, (iii) reconocimiento bajo criterio de devengado, no de percibido.\n\n**Importante distinguir flujo de fondos vs ingreso contable:** un ingreso NO es \"el monto de activos recibidos durante un período\". Esa caracterización confunde flujo de caja con resultado. Bajo criterio de devengado, un ingreso se reconoce cuando ocurren los hechos sustanciales que le dan origen (entrega del bien, prestación del servicio), independientemente del cobro.",
    "source_refs": ["RT 16 FACPCE, § 4.2.4 (definición de ingreso · referencia histórica)","RT 54 NUA FACPCE, § 25 (definición de ingreso · vigente desde 2024-07-01)","MC IASB 2018, párr. 4.68 (definición de ingreso)","MC IASB 2018, párr. 4.68-4.72 (reconocimiento de ingresos)"],
    "related_concepts": ["ingreso","patrimonio_neto","devengado","estado_de_resultados","flujo_de_fondos"],
    "materia": "Contabilidad", "difficulty": "intro", "validated": True,
    "generated_by": "manual_patch:auditor_contador_2026-05-05",
    "chunk_id": "auditor-nivel1-q5-ingreso-v1",
    "_anubis_meta": {"fix_origin": "auditor_contador_nivel1_q5_rechazada","fix_date": "2026-05-05","fix_reason": "LLM fallback definió ingreso como monto de activos recibidos (confunde flujo con resultado) · cita en sección errada (RT 16 § 4.1.2 es PASIVO)","doctrina": "literal_quote_or_refuse §9.5","audited_by": "agente_contador_adversarial_cto"}
}

PATRIMONIO_NETO_FIXED = {
    "id": "patrimonio_neto_concepto",
    "type": "definition",
    "patterns": ["qué es patrimonio neto","que es patrimonio neto","patrimonio neto definicion","patrimonio neto definición","qué es el patrimonio neto","definición de patrimonio neto","patrimonio neto desde el punto de vista normativo","patrimonio neto normativo","patrimonio neto según rt 16","patrimonio neto según rt 54 nua","patrimonio neto según iasb","patrimonio neto según mc iasb","concepto de patrimonio neto"],
    "answer_full": "**Patrimonio Neto · definición normativa multi-marco**\n\n**RT 16 FACPCE (referencia histórica · vigente hasta 2024-06-30):** \"El patrimonio neto de un ente resulta del aporte de sus propietarios o asociados y de la acumulación de resultados.\" (RT 16, § 4.1.3)\n\n**RT 54 NUA (vigente desde 2024-07-01):** \"Patrimonio neto es la suma de: a) los aportes de los propietarios o asociados de una entidad; b) los resultados acumulados, que incluyen: (i) las ganancias reservadas; (ii) los resultados no asignados; y (iii) los resultados diferidos.\" (RT 54 NUA, § 24)\n\n**MC IASB 2018:** \"El patrimonio es la participación residual en los activos de la entidad, una vez deducidos todos sus pasivos.\" (MC IASB 2018, párr. 4.63)\n\n**Tensión normativa relevante:** La RT 16 histórica adoptaba una **definición patrimonialista** del patrimonio neto (origen: aportes + resultados acumulados). Tanto la RT 54 NUA como el MC IASB 2018 adoptan una **definición residualista** (PN = Activo − Pasivo). El cambio de RT 16 a RT 54 NUA alinea explícitamente el marco argentino con el IASB en este punto.",
    "source_refs": ["RT 16 FACPCE, § 4.1.3 (definición patrimonialista · referencia histórica vigente hasta 2024-06-30)","RT 54 NUA FACPCE, § 24 (definición vigente desde 2024-07-01)","MC IASB 2018, párr. 4.63 (definición residualista)"],
    "related_concepts": ["patrimonio_neto","activo","pasivo","ecuacion_contable","rt_16","rt_54_nua","marco_conceptual_iasb"],
    "materia": "Contabilidad", "difficulty": "intro", "validated": True,
    "generated_by": "manual_patch:auditor_contador_2026-05-05",
    "chunk_id": "auditor-nivel1-q2-pn-v2",
    "_anubis_meta": {"fix_origin": "auditor_contador_nivel1_q2_observaciones","fix_date": "2026-05-05","fix_reason": "v1 tenía cuerpo IASB vacío + metadata leakeada · v2 completa + agrega tensión patrimonialista vs residualista","doctrina": "literal_quote_or_refuse §9.5","audited_by": "agente_contador_adversarial_cto"}
}

NEW_ENTRIES = [ACTIVO_MC_IASB, DEVENGADO_VS_PERCIBIDO, PASIVO_DEFINICION, INGRESO_DEFINICION]
ENTRIES_TO_REPLACE = {"patrimonio_neto_concepto": PATRIMONIO_NETO_FIXED}

replaced = 0
for i, e in enumerate(kb["entries"]):
    if e.get("id") in ENTRIES_TO_REPLACE:
        kb["entries"][i] = ENTRIES_TO_REPLACE[e["id"]]
        replaced += 1
        print(f"[fix] {e['id']}: REEMPLAZADA · entry #{i}")

if replaced != len(ENTRIES_TO_REPLACE):
    raise SystemExit(f"ERROR: esperaba reemplazar {len(ENTRIES_TO_REPLACE)}, reemplacé {replaced}")

existing_ids = {e.get("id") for e in kb["entries"]}
added = 0
for new_entry in NEW_ENTRIES:
    if new_entry["id"] in existing_ids:
        for i, e in enumerate(kb["entries"]):
            if e.get("id") == new_entry["id"]:
                kb["entries"][i] = new_entry
                print(f"[fix] {new_entry['id']}: REEMPLAZADA (ya existía) · entry #{i}")
                break
    else:
        kb["entries"].append(new_entry)
        added += 1
        print(f"[add] {new_entry['id']}: NUEVA · entry #{len(kb['entries'])-1}")

kb["total_entries"] = len(kb["entries"])
kb["last_patch"] = {
    "date": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "reason": "fixes post-veredicto agente contador adversarial Nivel 1 (4 ✗ + 1 ⚠)",
    "entries_modified": ["patrimonio_neto_concepto"],
    "entries_added": [e["id"] for e in NEW_ENTRIES],
    "audited_by": "agente_contador_adversarial_cto"
}

with open(KB_PATH, "w", encoding="utf-8") as f:
    json.dump(kb, f, ensure_ascii=False, indent=2)

print(f"\n✓ KB patched · {replaced} reemplazadas + {added} nuevas · total: {kb['total_entries']}")
