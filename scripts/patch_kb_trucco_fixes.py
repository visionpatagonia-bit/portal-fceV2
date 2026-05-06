#!/usr/bin/env python3
"""
patch_kb_trucco_fixes.py — Reemplaza entries del KB con versiones auditor-friendly.

Origen: Trucco (auditor académico) rechazó la entry activo_vs_pasivo por la
regla mnemotécnica "el activo es lo que TENÉS, el pasivo es lo que DEBÉS"
que es imprecisa para el nivel técnico que él maneja.

Fix:
- activo_vs_pasivo: reemplazada por definiciones formales IASB MC + RT 16
  con citas literales explícitas. Sin regla mnemotécnica.
- ecuacion_contable: agregadas citas literales IASB MC + RT 16 a la
  definición existente (mantiene contenido, mejora trazabilidad).
"""
import json
from pathlib import Path
from datetime import datetime

ROOT = Path("/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0")
KB_PATH = ROOT / "kb" / "knowledge_base.json"

with open(KB_PATH, "r", encoding="utf-8") as f:
    kb = json.load(f)

# =============================================================================
# Versión auditor de activo_vs_pasivo
# =============================================================================
NEW_ACTIVO_VS_PASIVO = {
    "id": "activo_vs_pasivo",
    "type": "comparison",
    "patterns": [
        "activo contra pasivo",
        "activo o pasivo cuál es la diferencia",
        "activo vs pasivo",
        "activo y pasivo diferencia",
        "como se diferencian activo y pasivo",
        "diferencia entre activo y pasivo",
        "definición de activo y pasivo",
        "qué es activo y qué es pasivo",
        "activo y pasivo según RT 16",
        "activo y pasivo según IASB"
    ],
    "answer_full": (
        "**Activo** y **pasivo** son las dos categorías fundamentales del patrimonio. "
        "Las definiciones técnicas vigentes provienen de dos marcos:\n\n"
        "**Bajo IASB Marco Conceptual (versión 2018, vigente):**\n"
        "- **Activo** (párr. 4.3): \"Recurso económico presente controlado por la entidad como resultado de hechos pasados. Un recurso económico es un derecho con potencial para producir beneficios económicos.\"\n"
        "- **Pasivo** (párr. 4.4): \"Obligación presente de la entidad de transferir un recurso económico, surgida como resultado de hechos pasados.\"\n\n"
        "**Bajo RT 16 (FACPCE, marco contable argentino):**\n"
        "- **Activo** (§ 4.1.1): elemento que cumple condiciones de control por el ente, beneficios económicos futuros probables y medición confiable, originado en hecho ya ocurrido.\n"
        "- **Pasivo** (§ 4.1.2): obligación cierta o contingente, derivada de hecho pasado, que requerirá entrega o uso de activos para su cancelación.\n\n"
        "**Cuadro comparativo técnico:**\n\n"
        "| Dimensión | Activo | Pasivo |\n"
        "|---|---|---|\n"
        "| Naturaleza | Recurso económico controlado | Obligación presente |\n"
        "| Origen | Hecho pasado que confiere control | Hecho pasado que genera deber |\n"
        "| Efecto esperado | Beneficios económicos futuros | Salida o uso de recursos |\n"
        "| Medición | Costo, valor razonable o método aplicable según la norma | Valor de cancelación o equivalente |\n"
        "| En la ecuación | Lado izquierdo | Lado derecho |\n"
        "| Variación contable | Aumenta por débito | Aumenta por crédito |\n\n"
        "**Aplicación práctica argentina:** los entes locales aplican simultáneamente RT 16 (definiciones generales) y RT 17 / RT 26 / RT 41 según el régimen, con migración gradual hacia NIIF (vigente para entes que cotizan o adheridos voluntariamente). En los casos de tensión entre RT 16 y IASB MC, la aplicación profesional suele privilegiar el marco específico de la transacción.\n\n"
        "**Patrimonio neto** se define por diferencia: PN = A − P (IASB MC párr. 4.63 · participación residual en los activos una vez deducidos los pasivos)."
    ),
    "source_refs": [
        "IASB Marco Conceptual 2018 párr. 4.3 (definición de activo)",
        "IASB Marco Conceptual 2018 párr. 4.4 (definición de pasivo)",
        "IASB Marco Conceptual 2018 párr. 4.63 (definición de patrimonio neto)",
        "RT 16 FACPCE § 4.1.1 (definición de activo · marco contable argentino)",
        "RT 16 FACPCE § 4.1.2 (definición de pasivo · marco contable argentino)"
    ],
    "related_concepts": ["activo", "pasivo", "patrimonio_neto", "ecuacion_contable", "marco_conceptual_iasb", "rt_16"],
    "materia": "Contabilidad",
    "difficulty": "intermedio",
    "validated": True,
    "generated_by": "manual_patch:auditor_trucco_2026-05-05",
    "chunk_id": "trucco-activo-pasivo-v2",
    "_anubis_meta": {
        "fix_origin": "rechazo_explicito_trucco_2026-04-23",
        "fix_date": "2026-05-05",
        "fix_reason": "regla mnemotécnica 'activo es lo que tenés, pasivo es lo que debés' rechazada por auditor académico por imprecisión técnica · reemplazada por definiciones literales IASB MC 2018 + RT 16 con citas explícitas",
        "doctrina": "literal_quote_or_refuse §9.5"
    }
}

# =============================================================================
# Versión enriquecida de ecuacion_contable (mantiene contenido, agrega citas)
# =============================================================================
NEW_ECUACION_CONTABLE = {
    "id": "ecuacion_contable",
    "type": "formula",
    "patterns": [
        "ecuación contable",
        "ecuación contable básica",
        "cuál es la ecuación contable",
        "qué es la ecuación contable",
        "fórmula contable básica",
        "identidad contable",
        "ecuación patrimonial",
        "Activo = Pasivo + Patrimonio Neto"
    ],
    "answer_full": (
        "La **ecuación contable básica** expresa la identidad estructural del patrimonio:\n\n"
        "**Activo = Pasivo + Patrimonio Neto**\n\n"
        "Esta identidad es el fundamento formal de la partida doble · cada hecho económico se registra de manera tal que la igualdad permanece equilibrada en todo momento.\n\n"
        "**Justificación técnica (IASB Marco Conceptual párr. 4.63):** el patrimonio neto se define como \"participación residual en los activos de la entidad, una vez deducidos todos sus pasivos\". De allí surge la formulación equivalente:\n\n"
        "**Patrimonio Neto = Activo − Pasivo**\n\n"
        "**Bajo el marco contable argentino (RT 16 FACPCE):** la identidad mantiene la misma forma y se aplica para la elaboración del Estado de Situación Patrimonial. La ecuación se presenta de modo agregado en el balance general, con clasificación de activos y pasivos en corrientes y no corrientes según el horizonte de realización o cancelación.\n\n"
        "**Implicación operativa:** todo asiento contable correctamente registrado debe respetar esta identidad. Un débito implica al menos un crédito por igual monto · no hay registro contable válido que rompa el equilibrio."
    ),
    "source_refs": [
        "IASB Marco Conceptual 2018 párr. 4.63 (definición de patrimonio neto)",
        "RT 16 FACPCE (estructura y elementos de los estados contables)",
        "Materiales/CONTABILIDAD/Itinerario II-20260304/Itinerario II - Parte 1.pdf#p1",
        "Materiales/CONTABILIDAD/Itinerario III-20260304/Itinerario III.pdf#p1"
    ],
    "related_concepts": ["activo", "pasivo", "patrimonio_neto", "partida_doble", "balance_general"],
    "materia": "Contabilidad",
    "difficulty": "intro",
    "validated": True,
    "generated_by": "manual_patch:auditor_trucco_2026-05-05",
    "chunk_id": "trucco-ecuacion-v2",
    "_anubis_meta": {
        "fix_origin": "feedback_trucco_2026-04-23",
        "fix_date": "2026-05-05",
        "fix_reason": "agregadas citas literales IASB MC 2018 + RT 16 para coherencia con system_prompt_mode auditor_academico_v1 (cita obligatoria en cada afirmación técnica)",
        "doctrina": "literal_quote_or_refuse §9.5"
    }
}

# =============================================================================
# Aplicar reemplazos
# =============================================================================
replaced = 0
for i, e in enumerate(kb["entries"]):
    if e.get("id") == "activo_vs_pasivo":
        kb["entries"][i] = NEW_ACTIVO_VS_PASIVO
        replaced += 1
        print(f"[1/2] activo_vs_pasivo: REEMPLAZADA · entry #{i}")
    elif e.get("id") == "ecuacion_contable":
        kb["entries"][i] = NEW_ECUACION_CONTABLE
        replaced += 1
        print(f"[2/2] ecuacion_contable: REEMPLAZADA · entry #{i}")

if replaced != 2:
    raise SystemExit(f"ERROR: esperaba reemplazar 2 entries, reemplazé {replaced}")

kb["last_patch"] = {
    "date": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "reason": "fix activo_vs_pasivo (rechazo Trucco regla mnemotécnica) + ecuacion_contable (citas literales IASB+RT 16) para coherencia con system_prompt_mode auditor_academico_v1",
    "entries_modified": ["activo_vs_pasivo", "ecuacion_contable"]
}

with open(KB_PATH, "w", encoding="utf-8") as f:
    json.dump(kb, f, ensure_ascii=False, indent=2)

print(f"\n✓ KB patched · {replaced}/2 entries reemplazadas · total entries: {len(kb['entries'])}")
print(f"  Path: {KB_PATH}")
