"""
NEXUS Pipeline — validator.py
─────────────────────────────────────────────────────────────────────
Fase 2 · Bloque B

Valida los entries generados por generate_kb.py y produce el knowledge_base.json
final que consume el runtime matcher del portal.

Reglas (todas vienen de config.py):
  · id, type, patterns, answer_full obligatorios
  · patterns ≥ MIN_PATTERNS_PER_ENTRY (2)
  · answer_full ≥ MIN_ANSWER_LENGTH_CHARS (80) para material_concept
  · sin FORBIDDEN_PHRASES (anti-alucinación + anti-evasión)
  · source_refs no vacío para tipos listados en REQUIRE_SOURCE_REFS_FOR
  · patterns deduplicados globalmente (si dos entries comparten un pattern,
    gana la primera y la segunda pierde ese pattern)

Entries que fallan → movidas a la sección "rejected" con sus razones.
La pipeline NO borra nada: prefiere transparencia a higiene.

Uso:
    python pipeline/validator.py --draft "pipeline/kb_draft/u2-6-chiavenato.json"
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

from config import (
    FORBIDDEN_PHRASES,
    KB_FILE,
    KB_SCHEMA_VERSION,
    MIN_ANSWER_LENGTH_CHARS,
    MIN_PATTERNS_PER_ENTRY,
    PROJECT_ROOT,
    REQUIRE_SOURCE_REFS_FOR,
)

# ─── Parámetros de checks nuevos (v19.30.2) ────────────────────────────
# Jaccard sobre tokens del answer_full. ≥ este threshold → near-duplicate.
SEMANTIC_DUP_JACCARD_THRESHOLD = 0.60

# Stopwords mínimas para no inflar el Jaccard. No es un NLP serio —
# solo lo suficiente para que "es un concepto que" no domine el score.
_STOPWORDS_ES = {
    "el","la","los","las","un","una","unos","unas","de","del","al","a",
    "y","o","u","e","que","en","con","por","para","sin","sobre","como",
    "es","son","ser","esta","estan","estar","fue","fueron","ha","han",
    "se","su","sus","lo","le","les","me","te","nos","os","ya","no","si",
    "tambien","mas","menos","muy","poco","mucho","todo","toda","todos","todas",
    "este","esta","esto","estos","estas","ese","esa","esos","esas",
    "pero","cuando","donde","porque","aunque","sino",
    "cada","entre","hasta","desde","tras","durante","ante","bajo",
    "ni","pues","solo","hay","tiene","tienen",
}

# Materias conocidas del FCE (para cross-materia guard).
_MATERIAS_CONOCIDAS = [
    "administracion", "contabilidad", "sociales", "propedeutica",
]

# Patterns de spanglish en IDs: suffixes en inglés que deberían ser españoles.
_SPANGLISH_SUFFIX_RE = re.compile(
    r"(_concept|_example|_definition|_theory|_approach|_method)$",
    re.IGNORECASE,
)

_TOKEN_RE = re.compile(r"[a-záéíóúñü]+", re.IGNORECASE)

# ─── Normalización ──────────────────────────────────────────────────────

_PUNCT_RE = re.compile(r"[¿¡?!.,;:]")


def _strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    )


def _normalize_pattern(p: str) -> str:
    """Normaliza un pattern para comparación: lower, trim, quita puntuación."""
    if not p:
        return ""
    p = p.lower().strip()
    p = _PUNCT_RE.sub("", p)
    p = re.sub(r"\s+", " ", p)
    return p


def _answer_tokens(text: str) -> Set[str]:
    """
    Set de tokens únicos del answer_full, normalizados + sin stopwords.
    Base para Jaccard semántico.
    """
    if not text:
        return set()
    norm = _strip_accents(text.lower())
    tokens = _TOKEN_RE.findall(norm)
    return {t for t in tokens if len(t) > 2 and t not in _STOPWORDS_ES}


def _jaccard(a: Set[str], b: Set[str]) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def _check_spanglish_id(entry_id: str) -> bool:
    """True si el ID termina en un suffix inglés (flexibilidad_concept)."""
    if not entry_id:
        return False
    return bool(_SPANGLISH_SUFFIX_RE.search(entry_id))


def _fix_spanglish_id(entry_id: str) -> str:
    """Normaliza suffix inglés → español. `flexibilidad_concept` → `flexibilidad_concepto`."""
    mapping = {
        "_concept":    "_concepto",
        "_example":    "_ejemplo",
        "_definition": "_definicion",
        "_theory":     "_teoria",
        "_approach":   "_enfoque",
        "_method":     "_metodo",
    }
    low = entry_id.lower()
    for en, es in mapping.items():
        if low.endswith(en):
            return entry_id[: -len(en)] + es
    return entry_id


def _check_cross_materia(answer: str, materia: str) -> List[str]:
    """
    Retorna lista de materias AJENAS mencionadas en el answer_full.
    Heurística: busca 'en <materia>' literal (ajeno a la materia del entry).
    """
    if not answer or not materia:
        return []
    a_norm = _strip_accents(answer.lower())
    m_own = _strip_accents(materia.lower().strip())
    found: List[str] = []
    for mat in _MATERIAS_CONOCIDAS:
        if mat == m_own:
            continue
        # "en <materia>" o "para <materia>" o "de <materia>"
        if re.search(r"\b(en|para|de|desde)\s+" + re.escape(mat) + r"\b", a_norm):
            found.append(mat)
    return found


# ─── Validación por entry ───────────────────────────────────────────────

def validate_entry(entry: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Retorna (ok, reasons). ok=True si pasa todos los checks.
    """
    reasons: List[str] = []

    # Campos básicos
    if not entry.get("id") or not isinstance(entry["id"], str):
        reasons.append("missing_id")
    if not entry.get("type"):
        reasons.append("missing_type")

    # Patterns
    patterns = entry.get("patterns") or []
    if not isinstance(patterns, list):
        reasons.append("patterns_not_list")
        patterns = []
    valid_patterns = [p for p in patterns if isinstance(p, str) and p.strip()]
    if len(valid_patterns) < MIN_PATTERNS_PER_ENTRY:
        reasons.append(f"patterns<{MIN_PATTERNS_PER_ENTRY}")

    # Answer length (por tipo)
    answer = entry.get("answer_full") or ""
    if not isinstance(answer, str):
        reasons.append("answer_full_not_string")
        answer = ""
    entry_type = entry.get("type", "")
    if entry_type == "material_concept" and len(answer) < MIN_ANSWER_LENGTH_CHARS:
        reasons.append(f"answer_full<{MIN_ANSWER_LENGTH_CHARS}")

    # Forbidden phrases (anti-alucinación / evasión)
    answer_lower = answer.lower()
    for phrase in FORBIDDEN_PHRASES:
        if phrase in answer_lower:
            reasons.append(f"forbidden_phrase:{phrase[:30]}")
            break  # una es suficiente

    # Source refs obligatorios para tipos listados
    if entry_type in REQUIRE_SOURCE_REFS_FOR:
        refs = entry.get("source_refs") or []
        if not isinstance(refs, list) or not refs:
            reasons.append("missing_source_refs")

    # Pattern-only evasions (ej: 2 patterns idénticos lógicamente — "qué es X" vs "qué es x?")
    # Solo reportar si hay más patterns raw que únicos (redundancia real, no simple escasez).
    unique_pattern_norms = {_normalize_pattern(p) for p in valid_patterns if p.strip()}
    if (len(valid_patterns) > len(unique_pattern_norms)
            and len(unique_pattern_norms) < MIN_PATTERNS_PER_ENTRY):
        reasons.append("patterns_duplicated_internally")

    return (len(reasons) == 0, reasons)


def get_entry_warnings(entry: Dict[str, Any]) -> List[str]:
    """
    Warnings no-bloqueantes (v19.30.2). La entry pasa igual, pero queda
    registrado para auditoría. El spanglish se auto-fixea; el cross-materia
    solo se reporta (Juan decide si re-gen o aceptar).
    """
    warnings: List[str] = []

    if _check_spanglish_id(entry.get("id", "")):
        warnings.append("spanglish_id")

    foreign = _check_cross_materia(
        entry.get("answer_full", "") or "",
        entry.get("materia", "") or "",
    )
    if foreign:
        warnings.append("cross_materia:" + ",".join(foreign))

    return warnings


# ─── Dedup global de patterns ───────────────────────────────────────────

def _dedupe_patterns(entries: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
    """
    Elimina patterns duplicados entre entries. Gana la primera entry que lo usó.

    Returns:
        (entries_con_patterns_deduplicados, map_pattern→entry_id_ganadora)
    """
    seen: Dict[str, str] = {}
    for entry in entries:
        unique_patterns: List[str] = []
        for p in entry.get("patterns", []):
            if not isinstance(p, str):
                continue
            norm = _normalize_pattern(p)
            if not norm:
                continue
            if norm not in seen:
                seen[norm] = entry.get("id", "?")
                unique_patterns.append(p)
        entry["patterns"] = unique_patterns
    return entries, seen


# ─── Dedup semántico por answer (Jaccard sobre tokens) ─────────────────
#
# v19.30.2 — El MD5 viejo rompía en cuanto Mistral parafraseaba los primeros
# 200 chars (ej: 3 entries sobre "responsabilidad" sobrevivían porque el
# opening estaba reordenado). Jaccard sobre tokens captura near-duplicates
# incluso con rewriting.

def _dedupe_by_answer(
    entries: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Elimina near-duplicates usando Jaccard sobre tokens del answer_full.
    Threshold = SEMANTIC_DUP_JACCARD_THRESHOLD (0.60 por default).

    Returns:
        (kept, dropped) — kept mantiene el orden original sin duplicados;
        dropped contiene las entries descartadas con rejection_reasons seteado
        para que el caller las agregue al bloque `rejected` del KB.
    Complejidad O(n²) — aceptable porque corre offline.
    """
    kept: List[Dict[str, Any]] = []
    kept_tokens: List[Set[str]] = []
    dropped: List[Dict[str, Any]] = []

    for e in entries:
        tokens = _answer_tokens(e.get("answer_full") or "")
        if not tokens:
            # Si no hay answer, dejá pasar (el check básico lo rechaza antes).
            kept.append(e)
            kept_tokens.append(set())
            continue

        dup_of = None
        dup_score = 0.0
        for i, prev_tokens in enumerate(kept_tokens):
            j = _jaccard(tokens, prev_tokens)
            if j >= SEMANTIC_DUP_JACCARD_THRESHOLD and j > dup_score:
                dup_of = kept[i].get("id", "?")
                dup_score = j

        if dup_of:
            e.setdefault("rejection_reasons", []).append(
                f"semantic_dup_of:{dup_of}@{dup_score:.2f}"
            )
            dropped.append(e)
            continue

        kept.append(e)
        kept_tokens.append(tokens)
    return kept, dropped


# ─── Pipeline principal ─────────────────────────────────────────────────

def validate_draft(draft_file: Path, kb_out: Path, append: bool = False) -> Dict[str, Any]:
    """
    Valida un draft y escribe el KB final.

    Args:
        draft_file: path a kb_draft/*.json
        kb_out:     path donde escribir knowledge_base.json
        append:     si True y el archivo existe, mergea. Si False, sobreescribe.
    """
    draft = json.loads(draft_file.read_text(encoding="utf-8"))

    valid: List[Dict[str, Any]] = []
    rejected: List[Dict[str, Any]] = []
    warnings_counter: Dict[str, int] = {}

    for entry in draft.get("entries", []):
        ok, reasons = validate_entry(entry)
        entry["validated"] = ok

        # Warnings no-bloqueantes (v19.30.2) + auto-fix de spanglish
        ws = get_entry_warnings(entry)
        if ws:
            entry["warnings"] = ws
            for w in ws:
                tag = w.split(":", 1)[0]
                warnings_counter[tag] = warnings_counter.get(tag, 0) + 1
            # Auto-fix: si el ID es spanglish, normalizarlo en el mismo lugar.
            if "spanglish_id" in ws:
                old_id = entry.get("id", "")
                new_id = _fix_spanglish_id(old_id)
                if new_id != old_id:
                    entry["id_original"] = old_id
                    entry["id"] = new_id

        if ok:
            valid.append(entry)
        else:
            entry["rejection_reasons"] = reasons
            rejected.append(entry)

    # Dedup de IDs duplicados (v19.30.2): el runtime matcher asume IDs únicos.
    # Mistral a veces genera el mismo ID con contenidos distintos — colisión
    # invisible para los otros dedups. Gana la primera; las siguientes reciben
    # un sufijo automático "_2", "_3" para no perder contenido.
    seen_ids: Dict[str, int] = {}
    for e in valid:
        eid = e.get("id", "")
        if not eid:
            continue
        if eid in seen_ids:
            seen_ids[eid] += 1
            new_id = f"{eid}_{seen_ids[eid]}"
            e.setdefault("warnings", []).append(f"id_collision:{eid}")
            e["id_original"] = eid
            e["id"] = new_id
            warnings_counter["id_collision"] = warnings_counter.get("id_collision", 0) + 1
        else:
            seen_ids[eid] = 1

    # Dedup de patterns entre entries válidas
    valid, _seen_patterns = _dedupe_patterns(valid)

    # Dedup por answer (semántico, v19.30.2)
    valid, dup_dropped = _dedupe_by_answer(valid)
    rejected.extend(dup_dropped)

    # Re-check patterns después de dedup (pueden haber quedado entries con < 2)
    final_valid = []
    for e in valid:
        if len(e.get("patterns", [])) >= MIN_PATTERNS_PER_ENTRY:
            final_valid.append(e)
        else:
            e.setdefault("rejection_reasons", []).append("patterns_after_dedup<2")
            rejected.append(e)

    # Merge con KB existente si append
    if append and kb_out.exists():
        existing = json.loads(kb_out.read_text(encoding="utf-8"))
        existing_entries = existing.get("entries", [])
        existing_ids = {e.get("id") for e in existing_entries}
        final_valid = existing_entries + [e for e in final_valid if e.get("id") not in existing_ids]

    kb = {
        "schema_version":   KB_SCHEMA_VERSION,
        "generated_from":   draft.get("pdf"),
        "materia":          draft.get("materia"),
        "model":            draft.get("model"),
        "total_entries":    len(final_valid),
        "total_rejected":   len(rejected),
        "warnings_summary": warnings_counter,
        "entries":          final_valid,
        "rejected":         rejected,
    }

    kb_out.parent.mkdir(parents=True, exist_ok=True)
    kb_out.write_text(json.dumps(kb, indent=2, ensure_ascii=False), encoding="utf-8")
    return kb


# ─── CLI ────────────────────────────────────────────────────────────────

def _cli():
    parser = argparse.ArgumentParser(description="Validate KB draft → knowledge_base.json")
    parser.add_argument("--draft", required=True, help="Ruta al draft JSON")
    parser.add_argument("--out", default=None, help="Output path (default: kb/knowledge_base.json)")
    parser.add_argument("--append", action="store_true", help="Merge con KB existente en lugar de sobreescribir")
    args = parser.parse_args()

    draft_input = Path(args.draft)
    if not draft_input.is_absolute():
        draft_input = PROJECT_ROOT / draft_input

    if not draft_input.exists():
        print(f"[validator] ERROR: no existe {draft_input}", file=sys.stderr)
        sys.exit(2)

    kb_out = Path(args.out) if args.out else KB_FILE
    kb = validate_draft(draft_input, kb_out, append=args.append)

    print(f"[validator] ✓ válidas: {kb['total_entries']}  ·  rechazadas: {kb['total_rejected']}")
    if kb["rejected"]:
        print("[validator]   razones más comunes:")
        reason_counts: Dict[str, int] = {}
        for e in kb["rejected"]:
            for r in e.get("rejection_reasons", []):
                # Colapsá variantes tipo "semantic_dup_of:XYZ@0.73" → "semantic_dup_of"
                tag = r.split(":", 1)[0] if ":" in r else r
                reason_counts[tag] = reason_counts.get(tag, 0) + 1
        for r, c in sorted(reason_counts.items(), key=lambda x: -x[1])[:5]:
            print(f"   · {r}: {c}")
    if kb.get("warnings_summary"):
        print("[validator]   warnings (no-bloqueantes):")
        for w, c in sorted(kb["warnings_summary"].items(), key=lambda x: -x[1]):
            print(f"   ⚠ {w}: {c}")
    try:
        display_path = kb_out.relative_to(PROJECT_ROOT)
    except ValueError:
        display_path = kb_out
    print(f"[validator]   → {display_path}")


if __name__ == "__main__":
    _cli()
