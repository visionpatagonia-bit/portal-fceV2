"""
audit_and_fix_kb_v2.py — Auditoría completa y auto-fix masivo del KB.

Estrategia (post-patch activo/pasivo del 2026-04-25):

  ACCIÓN 1 — CKG REPLACE
    Para cada concepto en el CKG v0.6.1, buscar entries en KB que cubran
    el mismo concepto (matching por ID). Reemplazar la entry alucinada con
    cita literal del CKG cubriendo los frameworks disponibles.

  ACCIÓN 2 — NEUTRALIZAR ALUCINACIONES DE SOCIALES
    Entries de Sociales que tienen H1 alta (cross-domain leak con
    Contabilidad) → marcar como `validated: false` para que el matcher las
    pueda ignorar, y limpiar patterns genéricos que provoquen falsos
    positivos en queries contables.

  ACCIÓN 3 — DEPRECAR DUPLICADOS
    Entries con H2 (generic_id, e.g. `bourdieu_concepto_5`,
    `agentes_concepto_2`) que sean duplicados semánticos: marcarlas como
    deprecated y vaciar patterns para que no matcheen.

Output:
    Reporte completo de cambios en /tmp/audit_fix_report.md
    KB modificado in-place con backup .bak_v2.
"""

import json
import shutil
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path("/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0")
KB_SRC = ROOT / "kb" / "knowledge_base.json"
KB_DIST = ROOT / "dist" / "kb" / "knowledge_base.json"
CKG = ROOT / "nexus-ckg" / "registry" / "canonical_registry.json"
REPORT = Path("/tmp/audit_fix_report.md")

NOW = datetime.now(timezone.utc).isoformat(timespec="seconds")

# === Cargar CKG ===
with open(CKG, encoding="utf-8") as f:
    ckg = json.load(f)

# Mapeo CKG concept_id → patterns canónicos para reemplazar entries
# Cada concepto del CKG genera patterns "qué es X / definición de X / etc"
def make_concept_entry(concept_id, concept):
    """Genera entry de KB con cita literal del CKG."""
    name = concept["concept_name_es"]
    name_low = name.lower()
    defs = concept["definitions"]

    # Construir respuesta multiframework
    body_parts = [f"**{name}** según las normas contables vigentes:\n"]
    for d in defs:
        fw = d["framework_scope"]
        if fw == "NUA":
            label = "Normas Unificadas Argentinas (RT 54 NUA, vigente desde 2024-07-01)"
            sec = d.get("source_ref", {}).get("section", "")
            src = f"RT 54 FACPCE — {sec}" if sec else "RT 54 FACPCE"
        elif fw == "IASB":
            label = "Marco Conceptual IASB 2018"
            sec = d.get("source_ref", {}).get("section", "")
            src = f"Marco Conceptual IASB — {sec}" if sec else "Marco Conceptual IASB"
        elif fw == "RT_16_HISTORIC":
            label = "RT 16 (vigente hasta 2024-06-30, referencia histórica)"
            sec = d.get("source_ref", {}).get("section", "")
            src = f"RT 16 FACPCE — {sec}" if sec else "RT 16 FACPCE"
        elif fw == "DIDACTIC_LOCAL":
            label = "Material de cátedra UNPSJB FCE 2026"
            src = d.get("source_ref", {}).get("section", "Material curricular")
        else:
            label = fw
            src = d.get("source_ref", {}).get("section", "")

        body_parts.append(f"\n**{label}:**\n> {d['canonical_text']}\n\n_Fuente: {src}_")

    answer_full = "\n".join(body_parts).strip()

    # Patterns ricos
    base = name_low
    base_no_art = base.replace("(", "").replace(")", "").strip()
    if base_no_art.startswith("método de la "):
        short = base_no_art.replace("método de la ", "")
    else:
        short = base_no_art

    patterns = list(set([
        f"que es el {short}",
        f"qué es el {short}",
        f"que es {short}",
        f"qué es {short}",
        f"definición de {short}",
        f"definicion de {short}",
        f"definir {short}",
        f"explicame el {short}",
        f"explicame {short}",
        f"explicar {short}",
        f"qué significa {short}",
        f"que significa {short}",
        f"cómo se define el {short}",
        f"como se define el {short}",
        f"cómo se define {short}",
        f"como se define {short}",
        f"concepto de {short}",
        f"qué es {name_low}",
    ]))

    return {
        "id": f"{concept_id}_concepto",
        "type": "material_concept",
        "patterns": patterns,
        "answer_full": answer_full,
        "source_refs": [f"nexus-ckg/registry/canonical_registry.json#{concept_id} (CKG v{ckg.get('registry_version','0.6.1')})"],
        "related_concepts": [e.get("target_concept_id") for e in concept.get("edges", []) if e.get("target_concept_id")],
        "materia": "Contabilidad",
        "difficulty": "basico",
        "validated": True,
        "validation_method": f"ckg_literal_quote_v{ckg.get('registry_version','0.6.1')}",
        "generated_by": "ckg_canonical_registry",
        "chunk_id": f"ckg_v{ckg.get('registry_version','0.6.1')}",
        "confidence_threshold": 0.7
    }


# Generar entries CKG-backed para todos los conceptos
ckg_entries = {}
for cid, concept in ckg["concepts"].items():
    entry = make_concept_entry(cid, concept)
    ckg_entries[entry["id"]] = entry

print(f"Generadas {len(ckg_entries)} entries CKG-backed")

# === Auditoría heurística (reproduce parcial de audit_hallucinations.py) ===
DOMAIN_TERMS = {
    "Contabilidad": {"activo", "pasivo", "patrimonio", "asiento", "débito", "haber", "iva", "balance", "cuenta"},
    "Sociales": {"bourdieu", "campo", "habitus", "estado", "violencia simbólica", "reproducción"},
    "Administración": {"chiavenato", "organización", "planificación", "stakeholders", "competitividad"},
}

def detect_h1_cross_domain(entry):
    """Detecta cross-domain leak: materia X menciona conceptos de materia Y."""
    materia = entry.get("materia", "")
    text = (entry.get("answer_full", "") + " " + " ".join(entry.get("patterns", []))).lower()
    leaks = []
    for other_materia, terms in DOMAIN_TERMS.items():
        if other_materia == materia: continue
        for t in terms:
            if t in text:
                leaks.append(t)
    return leaks

def detect_h2_generic_id(entry):
    """ID con sufijo numérico (e.g. _concepto_2)."""
    eid = entry.get("id", "")
    import re
    return bool(re.match(r".+_concepto_\d+$", eid))


# === Aplicar fixes al KB ===
def apply_fixes(kb_path):
    with open(kb_path, encoding="utf-8") as f:
        kb = json.load(f)

    # Backup
    backup = kb_path.with_suffix(".json.bak_v2_audit")
    shutil.copy2(kb_path, backup)

    # Indexar entries por ID
    by_id = {e["id"]: i for i, e in enumerate(kb["entries"])}

    actions = {
        "ckg_replaced": [],
        "ckg_added": [],
        "neutralized": [],
        "deprecated": [],
    }

    # ACCIÓN 1: CKG REPLACE / ADD
    for cid, ckg_entry in ckg_entries.items():
        if cid in by_id:
            # Si la entry existente fue generada por CKG (e.g. ya patcheamos activo), skip
            existing = kb["entries"][by_id[cid]]
            if existing.get("generated_by") == "ckg_canonical_registry":
                continue
            kb["entries"][by_id[cid]] = ckg_entry
            actions["ckg_replaced"].append(cid)
        else:
            kb["entries"].append(ckg_entry)
            actions["ckg_added"].append(cid)

    # ACCIÓN 2: NEUTRALIZAR cross-domain leaks (H1 alta) + ACCIÓN 3: DEPRECAR generic_id
    for i, e in enumerate(kb["entries"]):
        eid = e.get("id", "")
        # Skip las que acabamos de poner desde CKG
        if e.get("generated_by") == "ckg_canonical_registry":
            continue

        h1 = detect_h1_cross_domain(e)
        h2 = detect_h2_generic_id(e)

        # Severidad alta: H1 con leak + H2 (duplicado) → deprecar
        if h1 and h2:
            kb["entries"][i] = {
                **e,
                "patterns": [],  # sin patterns no matchea
                "validated": False,
                "deprecation_reason": f"H1+H2: cross-domain leak ({h1}) + generic ID. Auditoría 2026-04-25.",
                "_was": eid,
                "id": f"{eid}__deprecated_h1h2",
            }
            actions["deprecated"].append(eid)
            continue

        # H1 solo (cross-domain alto sin H2): neutralizar — mantener entry pero
        # quitar patterns genéricos para evitar falsos positivos
        if h1:
            # Filtrar patterns que mencionen el dominio prestado
            other_terms = set(h1)
            new_patterns = [p for p in e.get("patterns", [])
                            if not any(t in p.lower() for t in other_terms)]
            if len(new_patterns) < len(e.get("patterns", [])):
                e["patterns"] = new_patterns
                e["validated"] = False
                e["neutralization_note"] = (
                    f"Patterns con términos de otro dominio quitados ({h1}). "
                    f"Auditoría 2026-04-25."
                )
                actions["neutralized"].append(eid)

    # Update metadata
    kb["last_audited"] = NOW
    kb["audit_log"] = kb.get("audit_log", []) + [{
        "date": NOW,
        "audit_id": "ckg_v0.6.1_full_kb_audit",
        "ckg_replaced": len(actions["ckg_replaced"]),
        "ckg_added": len(actions["ckg_added"]),
        "neutralized": len(actions["neutralized"]),
        "deprecated": len(actions["deprecated"]),
    }]

    # Atomic write
    tmp = kb_path.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(kb, f, ensure_ascii=False, indent=2)
    tmp.replace(kb_path)

    return actions, backup


print(f"\n=== Patcheando {KB_SRC.name} ===")
actions_src, backup_src = apply_fixes(KB_SRC)
print(f"  CKG replaced:  {len(actions_src['ckg_replaced'])} → {actions_src['ckg_replaced'][:8]}{'...' if len(actions_src['ckg_replaced'])>8 else ''}")
print(f"  CKG added:     {len(actions_src['ckg_added'])} → {actions_src['ckg_added'][:8]}{'...' if len(actions_src['ckg_added'])>8 else ''}")
print(f"  Neutralized:   {len(actions_src['neutralized'])} → {actions_src['neutralized'][:5]}{'...' if len(actions_src['neutralized'])>5 else ''}")
print(f"  Deprecated:    {len(actions_src['deprecated'])} → {actions_src['deprecated'][:5]}{'...' if len(actions_src['deprecated'])>5 else ''}")
print(f"  Backup: {backup_src.name}")

print(f"\n=== Patcheando {KB_DIST.name} (build prod) ===")
actions_dist, backup_dist = apply_fixes(KB_DIST)
print(f"  CKG replaced:  {len(actions_dist['ckg_replaced'])}")
print(f"  CKG added:     {len(actions_dist['ckg_added'])}")
print(f"  Neutralized:   {len(actions_dist['neutralized'])}")
print(f"  Deprecated:    {len(actions_dist['deprecated'])}")

# === Generar reporte ===
report_lines = [
    f"# Audit + Fix KB · {NOW}",
    "",
    f"**CKG version:** v{ckg.get('registry_version','0.6.1')} ({len(ckg['concepts'])} conceptos)",
    "",
    "## Acciones aplicadas",
    "",
    f"| Acción | Count |",
    f"|---|---:|",
    f"| CKG replaced (entries existentes reemplazadas con cita literal) | {len(actions_src['ckg_replaced'])} |",
    f"| CKG added (conceptos nuevos agregados) | {len(actions_src['ckg_added'])} |",
    f"| Neutralized (patterns con cross-domain leak quitados) | {len(actions_src['neutralized'])} |",
    f"| Deprecated (H1+H2 alta severidad) | {len(actions_src['deprecated'])} |",
    "",
    "## CKG Replaced",
    "",
    *[f"- `{x}`" for x in actions_src['ckg_replaced']],
    "",
    "## CKG Added",
    "",
    *[f"- `{x}`" for x in actions_src['ckg_added']],
    "",
    "## Neutralized (patterns limpiados)",
    "",
    *[f"- `{x}`" for x in actions_src['neutralized']],
    "",
    "## Deprecated (sin patterns, no matchea)",
    "",
    *[f"- `{x}`" for x in actions_src['deprecated']],
    "",
    "---",
    "",
    "_Backup pre-fix: `kb/knowledge_base.json.bak_v2_audit` y `dist/kb/knowledge_base.json.bak_v2_audit`_",
]
REPORT.write_text("\n".join(report_lines), encoding="utf-8")

# Guardar también en el repo
REPORT_REPO = ROOT / "docs" / "AUDIT_KB_2026-04-25.md"
REPORT_REPO.parent.mkdir(exist_ok=True)
REPORT_REPO.write_text("\n".join(report_lines), encoding="utf-8")
print(f"\nReporte: {REPORT_REPO}")
print(f"          /tmp/audit_fix_report.md")

# Stats finales
with open(KB_SRC, encoding="utf-8") as f:
    kb_after = json.load(f)
print(f"\n=== Estado final KB ===")
print(f"  Total entries: {len(kb_after['entries'])}")
print(f"  Validated: {sum(1 for e in kb_after['entries'] if e.get('validated'))}")
print(f"  Deprecated: {sum(1 for e in kb_after['entries'] if 'deprecated' in e.get('id',''))}")
print(f"  CKG-backed: {sum(1 for e in kb_after['entries'] if e.get('generated_by') == 'ckg_canonical_registry')}")
