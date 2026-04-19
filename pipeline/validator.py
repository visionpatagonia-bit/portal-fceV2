"""
NEXUS Pipeline — validator.py
─────────────────────────────────────────────────────────────────────
Fase 2 · Bloque B  (+ Fase 2.5 semantic guard, v19.30.7)

Valida los entries generados por generate_kb.py y produce el knowledge_base.json
final que consume el runtime matcher del portal.

Reglas básicas (vienen de config.py):
  · id, type, patterns, answer_full obligatorios
  · patterns ≥ MIN_PATTERNS_PER_ENTRY (2)
  · answer_full ≥ MIN_ANSWER_LENGTH_CHARS (80) para material_concept
  · sin FORBIDDEN_PHRASES (anti-alucinación + anti-evasión)
  · source_refs no vacío para tipos listados en REQUIRE_SOURCE_REFS_FOR
  · patterns deduplicados globalmente (si dos entries comparten un pattern,
    gana la primera y la segunda pierde ese pattern)

Fase 2.5 — Reglas semánticas S1–S5 (v19.30.7, post-demo 20/4/2026):
  · S1  cross_domain_leak      — BLOCKING. Foreign materia mencionada + marker
                                  de esa materia en el answer. Evita los
                                  "En contabilidad, X tiene activo y pasivo"
                                  que alucinó Mistral en la U3 de Sociales.
  · S2  overgen_id             — BLOCKING. IDs tipo `concepto_N` con N ≥ 3
                                  (Mistral over-generó duplicados).
  · S3  pattern_diversity      — BLOCKING. Si TODOS los patterns son formulaicos
                                  ("qué es X", "definicion de X", ...) sin
                                  mención a autor ni keyword específica.
  · S4  author_presence        — BLOCKING cuando la entry declara
                                  `expected_author` y el autor no aparece en
                                  answer_full ni patterns.
  · S5  typo_hallucination     — BLOCKING. ID con raíz dentro de Levenshtein=2
                                  de un término común sin match exacto
                                  (detecta `marcado`→`mercado` tipo typo).

Las reglas S1–S5 se pueden desactivar con env var `NEXUS_VALIDATOR_STRICT=0`
(útil para migraciones donde hay que dejar pasar legacy). Por default: ON.

Entries que fallan → movidas a la sección "rejected" con sus razones.
La pipeline NO borra nada: prefiere transparencia a higiene.

Uso:
    python pipeline/validator.py --draft "pipeline/kb_draft/u2-6-chiavenato.json"
    python pipeline/validator.py --self-test
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from config import (
    FORBIDDEN_PHRASES,
    KB_FILE,
    KB_SCHEMA_VERSION,
    MIN_ANSWER_LENGTH_CHARS,
    MIN_PATTERNS_PER_ENTRY,
    PROJECT_ROOT,
    REQUIRE_SOURCE_REFS_FOR,
)

# Fase 6.1 — primitivas compartidas con scripts/audit_hallucinations.py.
# Ver pipeline/_shared.py para detalle del contrato.
from _shared import (
    COMMON_TERMS,
    ID_SUFFIX_RE as _ID_SUFFIX_RE,
    LEV_THRESHOLD as S5_LEV_THRESHOLD,
    id_root as _id_root,
    levenshtein as _levenshtein,
    strip_accents as _strip_accents,
)

# ─── Parámetros de checks nuevos (v19.30.2) ────────────────────────────
# Jaccard sobre tokens del answer_full. ≥ este threshold → near-duplicate.
SEMANTIC_DUP_JACCARD_THRESHOLD = 0.60

# ─── Fase 2.5 — Guardrails semánticos S1-S5 (v19.30.7) ─────────────────
# Feature flag. Apagar con NEXUS_VALIDATOR_STRICT=0 si hace falta migrar
# un draft viejo sin bloquear por S1-S5. Por default: ON en generación nueva.
STRICT_SEMANTIC_CHECKS = os.environ.get("NEXUS_VALIDATOR_STRICT", "1") != "0"

# S1 — Markers "dominio-propio". Si la entry de materia X menciona "en Y" y
# arrastra markers fuertes de Y en el mismo answer, es fuga cross-domain.
# Markers elegidos para ser distintivos (no aparecerían tangencialmente).
CROSS_DOMAIN_MARKERS: Dict[str, List[str]] = {
    "contabilidad": [
        "activo y pasivo", "activo, pasivo", "partida doble", "debe y haber",
        "asiento contable", "balance general", "patrimonio neto",
        "estado de resultados", "libro diario",
    ],
    "administracion": [
        "planificar, organizar", "planificacion, organizacion",
        "chiavenato", "proceso administrativo",
        "organigrama", "departamentalizacion",
    ],
    "sociales": [
        "habitus", "capital simbolico", "capital social", "campo social",
        "lucha de clases", "reproduccion social", "bourdieu",
    ],
    "propedeutica": [
        "propedeutica",
    ],
}

# S3 — Regex de patterns formulaicos. Si TODOS los patterns caen acá, la
# entry es un template vacío (no sobrevive queries naturales).
TEMPLATE_PATTERN_RE = re.compile(
    r"^(que es|qué es|definicion de|definición de|explicame|explícame|"
    r"concepto de|explicacion de|explicación de|que significa|qué significa)\s",
    re.IGNORECASE,
)

# S5 — Levenshtein de IDs vs términos comunes del corpus.
# `S5_LEV_THRESHOLD` y `COMMON_TERMS` viven en pipeline/_shared.py para ser
# single source of truth con scripts/audit_hallucinations.py (H7).

# S2 — IDs tipo `concepto_N`. A partir de N ≥ OVERGEN_N se considera overgen
# (Mistral repitió el mismo concepto varias veces).
OVERGEN_N_THRESHOLD = 3
_OVERGEN_ID_RE = re.compile(r"_(\d+)$")

# S4 — Mapping (materia, unidad) → autor esperado. Si la entry declara
# expected_author inline en metadata, gana la entry. Este mapping es fallback.
EXPECTED_AUTHORS_BY_MATERIA_UNIDAD: Dict[Tuple[str, str], str] = {
    ("sociales", "u3"):       "bourdieu",
    ("administracion", "u2"): "chiavenato",
    ("administracion", "u6"): "chiavenato",
}

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


# `_strip_accents` importado desde `_shared` (ver header del módulo).


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


# ─── Helpers para Fase 2.5 (S1-S5) ─────────────────────────────────────
# `_levenshtein`, `_ID_SUFFIX_RE`, `_id_root` se importan desde `_shared`.


def _is_template_pattern(p: str) -> bool:
    """True si el pattern arranca con un template formulaico sin contenido
    específico. Usado para S3 (pattern diversity)."""
    if not p:
        return True
    norm = _normalize_pattern(p)
    return bool(TEMPLATE_PATTERN_RE.match(norm))


def _pattern_has_specific_keyword(p: str, entry_id: str) -> bool:
    """
    Heurística: el pattern aporta información más allá del template genérico
    si menciona un autor, un término de dominio o una keyword que no esté
    implícita en el ID (ej: pattern "diferencia entre habitus y campo" para
    `habitus_concepto` aporta ≥ 1 keyword nueva).
    """
    if not p:
        return False
    norm = _strip_accents(_normalize_pattern(p))
    # Tokens del pattern sin stopwords
    tokens = {
        t for t in _TOKEN_RE.findall(norm)
        if len(t) > 3 and t not in _STOPWORDS_ES
    }
    # Quitar tokens ya presentes en el ID (son redundantes — el ID los implica)
    root = _id_root(entry_id)
    tokens -= {root}
    # Template/meta words que no aportan especificidad aunque pasen filtros
    # por longitud. "explicame" (9) y "significa" (9) pasan len>3.
    tokens -= {
        "que", "como", "cual", "cuales",
        "definicion", "concepto", "explicacion", "explicar",
        "explicame", "significa", "tipos",
    }
    return len(tokens) >= 1


# ─── S1-S5: checks bloqueantes ─────────────────────────────────────────

def _check_s1_cross_domain_leak(answer: str, materia: str) -> Optional[str]:
    """S1 — BLOCKING. Fuga cross-domain confirmada por co-ocurrencia de
    mención a materia ajena + marker propio de esa materia en el answer.

    Evita falsos positivos sobre menciones comparativas inocuas como
    "a diferencia de la contabilidad" (ésa no trae markers)."""
    if not answer or not materia:
        return None
    foreign = _check_cross_materia(answer, materia)
    if not foreign:
        return None
    a_norm = _strip_accents(answer.lower())
    for fmat in foreign:
        for marker in CROSS_DOMAIN_MARKERS.get(fmat, []):
            if _strip_accents(marker.lower()) in a_norm:
                return f"S1_cross_domain_leak:{fmat}:{marker[:24]}"
    return None


def _check_s2_overgen_id(entry_id: str) -> Optional[str]:
    """S2 — BLOCKING. ID con sufijo numérico ≥ OVERGEN_N_THRESHOLD indica
    que el generador insistió con el mismo concepto varias veces. Lo típico
    de alucinación es `bourdieu_concepto_3`, `_5`, `_7` — todos redundantes."""
    if not entry_id:
        return None
    m = _OVERGEN_ID_RE.search(entry_id)
    if not m:
        return None
    try:
        n = int(m.group(1))
    except ValueError:
        return None
    if n >= OVERGEN_N_THRESHOLD:
        return f"S2_overgen_id:suffix_{n}"
    return None


def _check_s3_pattern_diversity(
    patterns: List[str],
    entry_id: str,
) -> Optional[str]:
    """S3 — BLOCKING. Si TODOS los patterns son templates formulaicos
    sin keyword específica, la entry no sobrevive queries naturales."""
    if not patterns:
        return None  # otro check lo rechaza por patterns<2
    specific_count = 0
    for p in patterns:
        is_template = _is_template_pattern(p)
        has_specific = _pattern_has_specific_keyword(p, entry_id)
        if not is_template or has_specific:
            specific_count += 1
    if specific_count == 0:
        return "S3_pattern_diversity:all_templates"
    return None


def _check_s4_author_presence(entry: Dict[str, Any]) -> Optional[str]:
    """S4 — BLOCKING. Si la entry declara `expected_author` (o cae en un
    mapping materia+unidad conocido), el autor debe aparecer en answer_full
    o en algún pattern. Si no, es un hueco de contexto."""
    expected = entry.get("expected_author")
    if not expected:
        materia = (entry.get("materia") or "").lower().strip()
        unidad = (entry.get("unidad") or "").lower().strip()
        expected = EXPECTED_AUTHORS_BY_MATERIA_UNIDAD.get((materia, unidad))
    if not expected:
        return None
    needle = _strip_accents(expected.lower())
    hay = _strip_accents((entry.get("answer_full") or "").lower())
    if needle in hay:
        return None
    for p in entry.get("patterns") or []:
        if needle in _strip_accents((p or "").lower()):
            return None
    return f"S4_author_missing:{expected}"


def _check_s5_typo_hallucination(entry_id: str) -> Optional[str]:
    """S5 — BLOCKING. Raíz del ID dentro de Levenshtein=2 de un término
    común SIN match exacto. Captura `marcado`→`mercado` (Mistral typó y
    generó contenido irrelevante que matcheaba fuzzy por cercanía)."""
    root = _id_root(entry_id)
    if not (4 <= len(root) <= 16):
        return None
    for term in COMMON_TERMS:
        t = _strip_accents(term.lower())
        if root == t:
            return None  # exacto — no es typo
    # Segunda pasada: buscar near-match
    best = None
    best_d = 99
    for term in COMMON_TERMS:
        t = _strip_accents(term.lower())
        d = _levenshtein(root, t)
        if d < best_d:
            best_d = d
            best = t
        if d == 0:
            return None
    if best is not None and best_d <= S5_LEV_THRESHOLD:
        return f"S5_typo_hallucination:{root}~{best}@{best_d}"
    return None


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

    # ─── Fase 2.5 · Reglas S1-S5 (strict semantic guard) ─────────────
    # Escape hatch: entries con `validator_whitelist: true` o con
    # `audit_whitelist_reason` seteado se consideran revisadas humanamente
    # y se saltean S1-S5 (coherente con el mecanismo de whitelist del audit).
    # Útil para plurales legítimos (ingresos) o contenido de origen distinto.
    whitelisted = bool(
        entry.get("validator_whitelist")
        or entry.get("audit_whitelist_reason")
    )

    if STRICT_SEMANTIC_CHECKS and not whitelisted:
        entry_id = entry.get("id") or ""
        materia = entry.get("materia") or ""

        r = _check_s1_cross_domain_leak(answer, materia)
        if r:
            reasons.append(r)

        r = _check_s2_overgen_id(entry_id)
        if r:
            reasons.append(r)

        r = _check_s3_pattern_diversity(valid_patterns, entry_id)
        if r:
            reasons.append(r)

        r = _check_s4_author_presence(entry)
        if r:
            reasons.append(r)

        r = _check_s5_typo_hallucination(entry_id)
        if r:
            reasons.append(r)

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


# ─── Self-tests (Fase 2.5) ─────────────────────────────────────────────
# Unit tests mínimos para S1-S5 + helpers nuevos. Se corren con
# `python pipeline/validator.py --self-test`.
# Si falla alguno, sale con exit code 1 y detalle por pantalla.

def _run_self_tests() -> int:
    failures: List[str] = []

    def _expect(label: str, actual, expected):
        if actual != expected:
            failures.append(f"{label}\n  expected: {expected!r}\n  actual:   {actual!r}")

    def _expect_none(label: str, actual):
        if actual is not None:
            failures.append(f"{label}\n  expected: None\n  actual:   {actual!r}")

    def _expect_prefix(label: str, actual: Optional[str], prefix: str):
        if actual is None or not actual.startswith(prefix):
            failures.append(f"{label}\n  expected prefix: {prefix!r}\n  actual: {actual!r}")

    # Levenshtein
    _expect("lev(marcado, mercado)", _levenshtein("marcado", "mercado"), 1)
    _expect("lev(activo, activo)", _levenshtein("activo", "activo"), 0)
    _expect("lev(abc, xyz)", _levenshtein("abc", "xyz"), 3)
    _expect("lev('', abc)", _levenshtein("", "abc"), 3)

    # id_root
    _expect("id_root(bourdieu_concepto_3)", _id_root("bourdieu_concepto_3"), "bourdieu")
    _expect("id_root(estado_explicacion)", _id_root("estado_explicacion"), "estado")
    _expect("id_root(marcado_concepto)", _id_root("marcado_concepto"), "marcado")
    _expect("id_root(bare_id)", _id_root("bare_id"), "bare_id")

    # S1 — cross_domain_leak
    # Caso alucinado: entry Sociales cuyo answer dice que el Estado tiene
    # "activo y pasivo" (marker de contabilidad) + menciona "en contabilidad".
    leaky_answer = (
        "El Estado es una institución política. En contabilidad, "
        "el estado tiene activo y pasivo que se balancean."
    )
    _expect_prefix(
        "S1 detecta fuga contabilidad→sociales",
        _check_s1_cross_domain_leak(leaky_answer, "sociales"),
        "S1_cross_domain_leak:contabilidad",
    )
    # Mención comparativa inocua — NO debe bloquear
    benign_answer = (
        "El concepto de capital social en Bourdieu difiere del uso "
        "económico habitual, a diferencia de lo que ocurre en contabilidad."
    )
    _expect_none(
        "S1 ignora mención comparativa sin marker",
        _check_s1_cross_domain_leak(benign_answer, "sociales"),
    )
    # Entry de la propia materia — no es cross-domain
    _expect_none(
        "S1 no dispara en la propia materia",
        _check_s1_cross_domain_leak("El activo y pasivo son cuentas.", "contabilidad"),
    )

    # S2 — overgen_id
    _expect_prefix("S2 detecta _3", _check_s2_overgen_id("bourdieu_concepto_3"), "S2_overgen_id")
    _expect_prefix("S2 detecta _7", _check_s2_overgen_id("estado_concepto_7"), "S2_overgen_id")
    _expect_none("S2 ignora _2", _check_s2_overgen_id("bourdieu_concepto_2"))
    _expect_none("S2 ignora sin sufijo", _check_s2_overgen_id("bourdieu_concepto"))

    # S3 — pattern_diversity
    all_templates = ["que es bourdieu", "definicion de bourdieu", "explicame bourdieu"]
    _expect_prefix(
        "S3 bloquea si TODOS son templates",
        _check_s3_pattern_diversity(all_templates, "bourdieu_concepto"),
        "S3_pattern_diversity",
    )
    # Al menos uno tiene keyword específica (habitus)
    mixed = ["que es bourdieu", "diferencia entre habitus y campo"]
    _expect_none(
        "S3 pasa si ≥1 pattern trae keyword",
        _check_s3_pattern_diversity(mixed, "bourdieu_concepto"),
    )

    # S4 — author_presence
    entry_missing_author = {
        "id": "habitus_concepto",
        "materia": "sociales",
        "unidad": "u3",
        "answer_full": "El habitus es un sistema de disposiciones duraderas que estructuran la práctica social.",
        "patterns": ["que es el habitus", "habitus social"],
    }
    _expect_prefix(
        "S4 bloquea si falta Bourdieu en Sociales U3",
        _check_s4_author_presence(entry_missing_author),
        "S4_author_missing:bourdieu",
    )
    entry_with_author = {
        **entry_missing_author,
        "answer_full": "Según Bourdieu, el habitus es un sistema de disposiciones duraderas.",
    }
    _expect_none(
        "S4 pasa si Bourdieu está presente",
        _check_s4_author_presence(entry_with_author),
    )
    # Sin expected_author y sin mapping — S4 no aplica
    entry_no_mapping = {
        "id": "foo", "materia": "contabilidad", "unidad": "u99",
        "answer_full": "x", "patterns": ["y"],
    }
    _expect_none("S4 no aplica sin mapping", _check_s4_author_presence(entry_no_mapping))

    # S5 — typo_hallucination
    _expect_prefix(
        "S5 detecta marcado→mercado",
        _check_s5_typo_hallucination("marcado_concepto"),
        "S5_typo_hallucination:marcado~mercado",
    )
    _expect_none(
        "S5 no dispara en match exacto (mercado)",
        _check_s5_typo_hallucination("mercado_concepto"),
    )
    _expect_none(
        "S5 no dispara en ID corto (too_short)",
        _check_s5_typo_hallucination("xy_concepto"),
    )
    _expect_none(
        "S5 no dispara en palabra no cercana",
        _check_s5_typo_hallucination("propedeutica_concepto"),
    )

    # Integration: validate_entry rechaza entries alucinadas
    hallucinated = {
        "id": "marcado_concepto",
        "type": "material_concept",
        "materia": "sociales",
        "unidad": "u3",
        "patterns": ["que es el marcado", "definicion de marcado"],
        "answer_full": (
            "El marcado es un concepto. En contabilidad, tiene activo y pasivo "
            "que se equilibran en el balance general. " * 3  # > 80 chars
        ),
        "source_refs": ["fake"],
    }
    ok, reasons = validate_entry(hallucinated)
    if ok:
        failures.append("integration: entry alucinada DEBERÍA fallar, pasó")
    else:
        # Debería fallar por S1 + S3 + S4 + S5 — al menos uno
        expected_any = ("S1_", "S3_", "S4_", "S5_")
        if not any(any(r.startswith(p) for p in expected_any) for r in reasons):
            failures.append(
                f"integration: fallo pero sin reasons S1-S5. reasons={reasons}"
            )

    # Entry sana debe pasar
    healthy = {
        "id": "habitus_concepto",
        "type": "material_concept",
        "materia": "sociales",
        "unidad": "u3",
        "patterns": [
            "que es el habitus segun bourdieu",
            "diferencia entre habitus y campo",
        ],
        "answer_full": (
            "Según Bourdieu, el habitus es un sistema de disposiciones duraderas "
            "y transferibles que estructuran las prácticas sociales y los modos "
            "de percepción de los agentes en el campo social."
        ),
        "source_refs": ["bourdieu_razones_practicas.pdf#p12"],
    }
    ok, reasons = validate_entry(healthy)
    if not ok:
        failures.append(f"integration: entry sana debería pasar. reasons={reasons}")

    # ─── Report ─────────────────────────────────────────────────────
    if failures:
        print(f"[validator self-test] ❌ {len(failures)} fallo(s):\n")
        for f in failures:
            print(f"  · {f}\n")
        return 1
    print("[validator self-test] ✓ todos los checks S1-S5 + helpers pasaron")
    return 0


# ─── CLI ────────────────────────────────────────────────────────────────

def _cli():
    parser = argparse.ArgumentParser(description="Validate KB draft → knowledge_base.json")
    parser.add_argument("--draft", default=None, help="Ruta al draft JSON")
    parser.add_argument("--out", default=None, help="Output path (default: kb/knowledge_base.json)")
    parser.add_argument("--append", action="store_true", help="Merge con KB existente en lugar de sobreescribir")
    parser.add_argument("--self-test", action="store_true", help="Corre los unit tests internos de S1-S5 y helpers")
    args = parser.parse_args()

    if args.self_test:
        sys.exit(_run_self_tests())

    if not args.draft:
        parser.error("--draft es requerido (o usá --self-test)")

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
