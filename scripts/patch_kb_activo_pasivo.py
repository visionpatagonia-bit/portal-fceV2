"""
patch_kb_activo_pasivo.py — Fix urgente para queries 'activo / pasivo'.

Problema detectado por Alejandra y Trucco:
  Pregunta "diferencia entre activo y pasivo" → portal devuelve respuesta
  alucinada porque:
    1. El matcher Levenshtein no llega al threshold 0.75 con paráfrasis típicas.
    2. Cae a `activo_concepto` o `pasivo_concepto` que TIENEN alucinaciones
       de Mistral (ej: pasivo dice "derechos por cobrar", activo_2 usa
       terminología MX/CO).
    3. Si nada matchea, fallback a Mistral generativo → inventa.

Fix (3 acciones):
  A. Reemplazar las 3 entries alucinadas (activo_concepto, activo_concepto_2,
     pasivo_concepto) con cita literal del CKG (RT 54 NUA + RT 16 +
     IASB Marco Conceptual).
  B. Ampliar patterns de activo_vs_pasivo con paráfrasis típicas.
  C. Bajar threshold de matching para esa entry a 0.65 (queries
     comparativas suelen tener prefijos como "explicame", "decime").

Aplica al `kb/knowledge_base.json` y al `dist/kb/knowledge_base.json`.
"""

import json
import shutil
from pathlib import Path

ROOT = Path("/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0")
KB_SRC = ROOT / "kb" / "knowledge_base.json"
KB_DIST = ROOT / "dist" / "kb" / "knowledge_base.json"
CKG_PATH = ROOT / "nexus-ckg" / "registry" / "canonical_registry.json"

# === 1. Cargar CKG para citar literal ===
with open(CKG_PATH, encoding="utf-8") as f:
    ckg = json.load(f)

# Tomamos las definiciones literales de activo y pasivo del CKG
activo_defs = ckg["concepts"]["activo"]["definitions"]
pasivo_defs = ckg["concepts"]["pasivo"]["definitions"]

# === 2. Construir entries nuevas con cita literal ===

def build_concept_entry(concept_id, concept_name, defs, source_pdf):
    """Genera una entry de KB con cita literal de CKG (3 frameworks)."""
    # Buscar las 3 definiciones por framework
    nua_def = next((d for d in defs if d["framework_scope"] == "NUA"), None)
    iasb_def = next((d for d in defs if d["framework_scope"] == "IASB"), None)
    rt16_def = next((d for d in defs if d["framework_scope"] == "RT_16_HISTORIC"), None)

    answer_full = f"**{concept_name}** según las normas contables vigentes:\n\n"

    if nua_def:
        answer_full += (
            f"**Normas Unificadas Argentinas (RT 54 NUA, vigente desde 2024-07-01):**\n"
            f"> {nua_def['canonical_text']}\n\n"
            f"_Fuente: RT 54 FACPCE — {nua_def['source_ref'].get('section', '')}_\n\n"
        )

    if iasb_def:
        answer_full += (
            f"**Marco Conceptual IASB 2018 (referencia internacional):**\n"
            f"> {iasb_def['canonical_text']}\n\n"
            f"_Fuente: Marco Conceptual IASB — {iasb_def['source_ref'].get('section', '')}_\n\n"
        )

    if rt16_def:
        answer_full += (
            f"**RT 16 (vigente hasta 2024-06-30, referencia histórica):**\n"
            f"> {rt16_def['canonical_text']}\n\n"
            f"_Fuente: RT 16 FACPCE — {rt16_def['source_ref'].get('section', '')}_\n"
        )

    return {
        "id": concept_id,
        "type": "material_concept",
        "patterns": [
            f"que es el {concept_name.lower()}",
            f"qué es el {concept_name.lower()}",
            f"que es {concept_name.lower()}",
            f"qué es {concept_name.lower()}",
            f"definición de {concept_name.lower()}",
            f"definicion de {concept_name.lower()}",
            f"explicame el {concept_name.lower()}",
            f"explicame {concept_name.lower()}",
            f"explicar {concept_name.lower()}",
            f"qué significa {concept_name.lower()}",
            f"que significa {concept_name.lower()}",
            f"cómo se define el {concept_name.lower()}",
            f"como se define el {concept_name.lower()}",
            f"cómo se define {concept_name.lower()}",
            f"concepto de {concept_name.lower()}",
            f"qué entendés por {concept_name.lower()}",
            f"qué entiende por {concept_name.lower()}",
        ],
        "answer_full": answer_full.strip(),
        "source_refs": [source_pdf, "nexus-ckg/registry/canonical_registry.json (CKG v0.6.1)"],
        "related_concepts": [c.lower() for c in ["activo", "pasivo", "patrimonio_neto", "ecuacion_contable", "RT_54", "RT_16", "IASB"]],
        "materia": "Contabilidad",
        "difficulty": "basico",
        "validated": True,
        "validation_method": "ckg_literal_quote_v0.6.1",
        "generated_by": "ckg_canonical_registry",
        "chunk_id": "ckg_v0.6.1",
        "confidence_threshold": 0.7
    }

new_activo = build_concept_entry(
    "activo_concepto", "Activo", activo_defs,
    "Materiales/CONTABILIDAD/Itinerario II-20260304/Itinerario II - Parte 1.pdf"
)
new_pasivo = build_concept_entry(
    "pasivo_concepto", "Pasivo", pasivo_defs,
    "Materiales/CONTABILIDAD/Itinerario II-20260304/Itinerario II - Parte 1.pdf"
)

# Patterns ampliados para activo_vs_pasivo (queries comparativas)
EXTENDED_VS_PATTERNS = [
    # originales
    "diferencia entre activo y pasivo",
    "activo y pasivo diferencia",
    "activo vs pasivo",
    "diferencia activo pasivo",
    "qué diferencia hay entre activo y pasivo",
    "comparación activo pasivo",
    "activo contra pasivo",
    # paráfrasis con prefijos típicos
    "explicame la diferencia entre activo y pasivo",
    "explicame diferencia entre activo y pasivo",
    "cuál es la diferencia entre activo y pasivo",
    "cual es la diferencia entre activo y pasivo",
    "decime la diferencia entre activo y pasivo",
    "decime cuál es la diferencia entre activo y pasivo",
    "explicar diferencia entre activo y pasivo",
    "qué diferencias hay entre activo y pasivo",
    "diferencias entre activo y pasivo",
    "diferencias activo pasivo",
    "diferencia entre el activo y el pasivo",
    "explicame la diferencia entre el activo y el pasivo",
    "cuáles son las diferencias entre activo y pasivo",
    # variaciones contextuales
    "comparar activo y pasivo",
    "comparame activo y pasivo",
    "diferencia activo pasivo contabilidad",
    "qué es la diferencia entre activo y pasivo",
    "como se diferencian activo y pasivo",
    "cómo se diferencian activo y pasivo",
    # típicas de chat
    "activo o pasivo cuál es la diferencia",
    "diferenciar activo de pasivo",
]


def patch_kb(kb_path):
    """Aplica las 3 acciones al KB en kb_path."""
    with open(kb_path, encoding="utf-8") as f:
        kb = json.load(f)

    # Backup
    backup = kb_path.with_suffix(".json.bak_pre_ckg_patch")
    shutil.copy2(kb_path, backup)

    # Indexar entries por ID
    by_id = {e["id"]: i for i, e in enumerate(kb["entries"])}
    actions = []

    # A1. Reemplazar activo_concepto
    if "activo_concepto" in by_id:
        kb["entries"][by_id["activo_concepto"]] = new_activo
        actions.append("Reemplazada activo_concepto con cita literal CKG (3 frameworks)")

    # A2. Eliminar activo_concepto_2 (terminología MX/CO incorrecta)
    if "activo_concepto_2" in by_id:
        # Lo dejamos como obsoleto pero con redirect
        kb["entries"][by_id["activo_concepto_2"]] = {
            "id": "activo_concepto_2_deprecated",
            "type": "deprecated_redirect",
            "patterns": [],  # sin patterns para que no matchee
            "answer_full": "[OBSOLETA] Esta entry contenía terminología contable mexicana/colombiana inadecuada para Argentina. Reemplazada por activo_concepto con cita literal RT 54 NUA.",
            "source_refs": [],
            "materia": "Contabilidad",
            "difficulty": "deprecated",
            "validated": False,
            "generated_by": "ckg_patch_2026-04-25",
            "chunk_id": "deprecated"
        }
        actions.append("Marcada activo_concepto_2 como deprecated (sin patterns, no matchea)")

    # A3. Reemplazar pasivo_concepto (la peor — Mistral inventó "derechos por cobrar")
    if "pasivo_concepto" in by_id:
        kb["entries"][by_id["pasivo_concepto"]] = new_pasivo
        actions.append("Reemplazada pasivo_concepto con cita literal CKG (3 frameworks)")

    # B. Ampliar patterns de activo_vs_pasivo
    if "activo_vs_pasivo" in by_id:
        e = kb["entries"][by_id["activo_vs_pasivo"]]
        existing = set(e.get("patterns", []))
        for p in EXTENDED_VS_PATTERNS:
            existing.add(p)
        e["patterns"] = sorted(existing)
        # C. Bajar threshold a 0.65
        e["confidence_threshold"] = 0.65
        actions.append(f"activo_vs_pasivo: {len(e['patterns'])} patterns + threshold 0.65")

    # Update metadata
    kb["last_patched"] = "2026-04-25T15:50:00Z"
    kb["patch_log"] = kb.get("patch_log", []) + [{
        "date": "2026-04-25",
        "patch": "ckg_v0.6.1_patch_activo_pasivo",
        "actions": actions,
        "reason": "Fix de alucinaciones detectadas por Alejandra y Trucco en queries diferencia activo/pasivo"
    }]

    # Atomic write
    tmp = kb_path.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(kb, f, ensure_ascii=False, indent=2)
    tmp.replace(kb_path)

    return actions, backup


# === Apply ===
print(f"Patching {KB_SRC} ...")
actions_src, backup_src = patch_kb(KB_SRC)
for a in actions_src: print(f"  ✓ {a}")
print(f"  Backup: {backup_src.name}")

print(f"\nPatching {KB_DIST} (build de producción) ...")
actions_dist, backup_dist = patch_kb(KB_DIST)
for a in actions_dist: print(f"  ✓ {a}")
print(f"  Backup: {backup_dist.name}")

print("\n=== Verificación post-patch ===")
with open(KB_SRC, encoding="utf-8") as f:
    kb = json.load(f)
for eid in ["activo_concepto", "pasivo_concepto", "activo_vs_pasivo"]:
    e = next((x for x in kb["entries"] if x["id"] == eid), None)
    if not e:
        print(f"  ⚠ {eid}: no encontrada")
        continue
    print(f"  {eid}:")
    print(f"    threshold: {e.get('confidence_threshold')}")
    print(f"    patterns: {len(e.get('patterns', []))}")
    print(f"    validated: {e.get('validated')}")
    print(f"    generated_by: {e.get('generated_by')}")
    answer = e.get('answer_full', '')
    print(f"    answer: {answer[:100]}...")
    print()
