#!/usr/bin/env python3
"""
scripts/apply_itinerario_i_triage.py — cierre Fase 3
─────────────────────────────────────────────────────────────────────────
Aplica triage sobre los drafts Fowler + Telese (Itinerario I · Contabilidad)
en una sola pasada idempotente y atómica:

  1) Renames dirigidos (IDs malos → IDs semánticamente correctos)
  2) Deletes dirigidos (entries alucinadas o meta-basura)
  3) Intra-dedup por ID: para cada grupo duplicado keep longest answer_full,
     mergear patterns + source_refs de los descartados en la canonical
  4) Whitelists dirigidos (S1-S7/H7 false positives legítimos)
  5) Patches de patterns (H3 formulaico → agregar 1-2 patterns específicos)
  6) Cross-KB collision guard: si un ID colisiona con kb/knowledge_base.json,
     se sufija `_itinerario_i` para no pisar entries ya validadas

Backup automático de los drafts originales en `pipeline/kb_draft/.bak/`.

Uso:
    python scripts/apply_itinerario_i_triage.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Tuple

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DRAFT_DIR    = PROJECT_ROOT / "pipeline" / "kb_draft"
BAK_DIR      = DRAFT_DIR / ".bak"
KB_FILE      = PROJECT_ROOT / "kb" / "knowledge_base.json"

FOWLER_SLUG = "capitulo-2-contabilidad-basica-enrique-fowler-newton"
TELESE_SLUG = "conociendo-la-contabilidad-2da-edision-telese-cap-ii"

# ─── Triage tables ──────────────────────────────────────────────────────

# Renames: id_viejo → id_nuevo  (uno por draft)
# Deletes: lista de ids a borrar directamente
# Whitelists: ids que deben llevar validator_whitelist=true + audit_whitelist_reason
# Patches: id → { add_patterns: [...] }

TRIAGE = {
    FOWLER_SLUG: {
        "renames": {
            # ID "cap2_concepto2" habla de "grupos de usuarios" — el ID era malo
            "cap2_concepto2": "grupos_de_usuarios_concepto",
            # ID "empresas_concepto" trata sobre "usuarios de info contable"
            "empresas_concepto": "usuarios_informacion_contable_concepto",
        },
        "deletes": [
            "cap2_concepto1",             # meta-entry: "el capítulo 2"
            "capitulo_concepto",          # meta-entry: "el capítulo II AR"
        ],
        # Delete dirigido por (id, chunk_id) cuando hay duplicates semánticos
        # y queremos matar uno específico por su chunk de origen.
        "deletes_by_chunk": [
            ("normas_contables_legales", "c037"),  # short answer (104 chars), redundant con c043
        ],
        "whitelists": {
            "deteccion_concepto":        "detección es palabra real (FP H7 vs 'direccion')",
            "organizaciones_concepto":   "plural con acento legítimo (FP H7 vs 'organizacion')",
        },
        "patches": {
            "contabilidad_sistema_concepto": {
                "add_patterns": [
                    "elementos de un sistema contable",
                    "cómo funciona un sistema contable",
                ],
            },
            "control_interno": {
                "add_patterns": [
                    "objetivos del control interno",
                    "políticas de control interno",
                ],
            },
            "sistema_informacion": {
                "add_patterns": [
                    "cómo se integra el sistema de información contable",
                    "componentes del sistema de información",
                ],
            },
        },
    },
    TELESE_SLUG: {
        "renames": {},
        "deletes": [
            # Alucinación real: Mistral salió de Contabilidad y habló de biología
            "alimento_concepto",
        ],
        "deletes_by_chunk": [],
        "whitelists": {
            "valor_concepto": "valor es concepto central contable (FP H7 vs 'mayor')",
        },
        "patches": {
            "relacion_importancia_relevancia": {
                "add_patterns": [
                    "importancia de la relevancia en contabilidad",
                    "rol de la relevancia en la información contable",
                ],
            },
        },
    },
}

MAX_PATTERNS = 8  # cap sensato por entry después de merges

# ─── Helpers ────────────────────────────────────────────────────────────

def _dedup_list(items: List[Any]) -> List[Any]:
    """Preserva orden, elimina duplicates exactos."""
    seen = set()
    out = []
    for x in items:
        k = x if isinstance(x, (str, int, float)) else json.dumps(x, ensure_ascii=False, sort_keys=True)
        if k not in seen:
            seen.add(k)
            out.append(x)
    return out


def _answer_len(e: Dict[str, Any]) -> int:
    return len(e.get("answer_full") or "")


def _normalize_source_refs(refs: Any) -> List[str]:
    """
    Algunas entries tienen source_refs como lista de listas (artefacto Mistral).
    Aplanamos a lista plana de strings únicos.
    """
    if refs is None:
        return []
    out: List[str] = []
    stack = list(refs) if isinstance(refs, list) else [refs]
    while stack:
        x = stack.pop(0)
        if isinstance(x, list):
            stack = list(x) + stack
        elif isinstance(x, str):
            out.append(x)
    return _dedup_list(out)


def _merge_into_canonical(canonical: Dict[str, Any], other: Dict[str, Any]) -> None:
    """Mergea patterns + source_refs del 'other' en la 'canonical'."""
    # Patterns: concat + dedup + cap
    merged_patterns = _dedup_list(list(canonical.get("patterns", [])) + list(other.get("patterns", [])))
    canonical["patterns"] = merged_patterns[:MAX_PATTERNS]

    # Source refs: normalizar + concat + dedup
    merged_refs = _dedup_list(
        _normalize_source_refs(canonical.get("source_refs")) +
        _normalize_source_refs(other.get("source_refs"))
    )
    canonical["source_refs"] = merged_refs

    # related_concepts: preservar si ambos tienen
    if other.get("related_concepts"):
        merged_rc = _dedup_list(
            list(canonical.get("related_concepts") or []) +
            list(other.get("related_concepts") or [])
        )
        canonical["related_concepts"] = merged_rc


# ─── Phases ─────────────────────────────────────────────────────────────

def phase_apply_renames(entries: List[Dict[str, Any]], renames: Dict[str, str]) -> int:
    n = 0
    for e in entries:
        if e["id"] in renames:
            e["id"] = renames[e["id"]]
            n += 1
    return n


def phase_apply_deletes(
    entries: List[Dict[str, Any]],
    deletes: List[str],
    deletes_by_chunk: List[Tuple[str, str]],
) -> Tuple[List[Dict[str, Any]], int]:
    delete_ids = set(deletes)
    delete_pairs = set(deletes_by_chunk)
    kept = []
    n = 0
    for e in entries:
        if e["id"] in delete_ids:
            n += 1
            continue
        if (e["id"], e.get("chunk_id")) in delete_pairs:
            n += 1
            continue
        kept.append(e)
    return kept, n


def phase_intra_dedup(entries: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], int]:
    """
    Agrupa por id, keep longest answer_full, mergear patterns + source_refs de los
    descartados en el canonical. Retorna (entries_deduped, n_dropped).
    """
    by_id: Dict[str, List[Dict[str, Any]]] = {}
    order: List[str] = []
    for e in entries:
        eid = e["id"]
        if eid not in by_id:
            by_id[eid] = []
            order.append(eid)
        by_id[eid].append(e)

    out: List[Dict[str, Any]] = []
    dropped = 0
    for eid in order:
        group = by_id[eid]
        if len(group) == 1:
            # Normalizar source_refs incluso cuando no hay dedup (limpia listas anidadas)
            group[0]["source_refs"] = _normalize_source_refs(group[0].get("source_refs"))
            out.append(group[0])
            continue
        # keep longest answer_full
        canonical = max(group, key=_answer_len)
        canonical["source_refs"] = _normalize_source_refs(canonical.get("source_refs"))
        for other in group:
            if other is canonical:
                continue
            _merge_into_canonical(canonical, other)
            dropped += 1
        out.append(canonical)
    return out, dropped


def phase_apply_whitelists(entries: List[Dict[str, Any]], whitelists: Dict[str, str]) -> int:
    n = 0
    for e in entries:
        if e["id"] in whitelists:
            e["validator_whitelist"] = True
            e["audit_whitelist_reason"] = whitelists[e["id"]]
            n += 1
    return n


def phase_apply_pattern_patches(entries: List[Dict[str, Any]], patches: Dict[str, Dict[str, Any]]) -> int:
    n = 0
    for e in entries:
        if e["id"] in patches:
            add = patches[e["id"]].get("add_patterns", [])
            if add:
                merged = _dedup_list(list(e.get("patterns", [])) + list(add))
                e["patterns"] = merged[:MAX_PATTERNS]
                n += 1
    return n


def phase_cross_kb_suffix(entries: List[Dict[str, Any]], kb_ids: set, suffix: str = "_itinerario_i") -> int:
    """
    Si un id del draft ya existe en KB global, sufijamos para no pisar.
    Se aplica DESPUÉS de renames + dedup para no sufijar IDs que ya fueron fixeados.
    """
    n = 0
    for e in entries:
        if e["id"] in kb_ids:
            e["id"] = e["id"] + suffix
            n += 1
    return n


# ─── Main ───────────────────────────────────────────────────────────────

def process_draft(slug: str, kb_ids: set, dry_run: bool) -> Dict[str, Any]:
    draft_path = DRAFT_DIR / f"{slug}.json"
    if not draft_path.exists():
        raise FileNotFoundError(f"Draft no existe: {draft_path}")

    draft = json.load(draft_path.open(encoding="utf-8"))
    entries = draft.get("entries", [])
    before_count = len(entries)

    cfg = TRIAGE[slug]

    # 1. Renames
    n_renamed = phase_apply_renames(entries, cfg["renames"])
    # 2. Deletes
    entries, n_deleted = phase_apply_deletes(entries, cfg["deletes"], cfg["deletes_by_chunk"])
    # 3. Intra-dedup
    entries, n_deduped = phase_intra_dedup(entries)
    # 4. Whitelists
    n_whitelisted = phase_apply_whitelists(entries, cfg["whitelists"])
    # 5. Pattern patches
    n_patched = phase_apply_pattern_patches(entries, cfg["patches"])
    # 6. Cross-KB suffix
    n_suffixed = phase_cross_kb_suffix(entries, kb_ids)

    # Sanity: no duplicate IDs post-triage
    final_ids = [e["id"] for e in entries]
    dup_check = [k for k, v in Counter(final_ids).items() if v > 1]
    if dup_check:
        print(f"⚠️  post-triage {slug}: AÚN quedan duplicates: {dup_check}", file=sys.stderr)

    # Update top-level metadata
    draft["entries"] = entries
    draft["total_entries"] = len(entries)
    draft.setdefault("triage", {}).update({
        "applied": True,
        "renamed": n_renamed,
        "deleted": n_deleted,
        "deduped": n_deduped,
        "whitelisted": n_whitelisted,
        "patched": n_patched,
        "cross_kb_suffixed": n_suffixed,
        "before_count": before_count,
        "after_count": len(entries),
    })

    if not dry_run:
        BAK_DIR.mkdir(parents=True, exist_ok=True)
        bak_path = BAK_DIR / f"{slug}.json.bak"
        if not bak_path.exists():
            shutil.copy2(draft_path, bak_path)
        draft_path.write_text(json.dumps(draft, ensure_ascii=False, indent=2), encoding="utf-8")

    return draft["triage"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Triage Itinerario I drafts (Fowler + Telese)")
    parser.add_argument("--dry-run", action="store_true", help="No escribir, solo reportar")
    args = parser.parse_args()

    # Load KB global para detectar cross-KB collisions
    if KB_FILE.exists():
        kb = json.load(KB_FILE.open(encoding="utf-8"))
        kb_entries = kb.get("entries", []) if isinstance(kb, dict) else kb
        kb_ids = {e["id"] for e in kb_entries}
        print(f"[triage] KB global: {len(kb_ids)} entries existentes")
    else:
        kb_ids = set()
        print(f"[triage] KB global no existe aún — cross-KB suffix skip")

    print()
    for slug in (FOWLER_SLUG, TELESE_SLUG):
        print(f"━━━ {slug}")
        try:
            report = process_draft(slug, kb_ids, args.dry_run)
        except FileNotFoundError as e:
            print(f"  ✗ {e}", file=sys.stderr)
            return 1
        print(f"  entries: {report['before_count']} → {report['after_count']}  (Δ {report['after_count'] - report['before_count']})")
        print(f"  renamed:     {report['renamed']}")
        print(f"  deleted:     {report['deleted']}")
        print(f"  deduped:     {report['deduped']}")
        print(f"  whitelisted: {report['whitelisted']}")
        print(f"  patched:     {report['patched']}")
        print(f"  cross_kb:    {report['cross_kb_suffixed']}")
        print()

    print("✓ triage aplicado" + (" (dry-run)" if args.dry_run else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
