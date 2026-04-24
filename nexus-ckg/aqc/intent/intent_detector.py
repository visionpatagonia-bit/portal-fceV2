"""
intent_detector.py — Lógica de detección de intents estructurales.

Arquitectura (P6 — Ronda 2, refactor auditor):
    * Los 3 detectores corren sobre la query normalizada.
    * Cada detector retorna (bool, triggered_by) — no hace el mapping a concepto.
    * Si un SOLO detector matchea → return IntentMatch construido desde intent_map.
    * Si MÚLTIPLES detectores matchean → None (conflict → fallback al keyword router).
      Regla del auditor: "no repitas el error del dict-order".
    * Si NINGUNO matchea → None (fallback al keyword router).

Stats (opt-in para auditar cobertura):
    * get_last_detection() devuelve info del último detect_intent() — estado
      para el harness: {"detected": bool, "routed": bool, "conflict": bool,
                         "candidates": [...]}. No es thread-safe; uso secuencial.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Optional

from .intent_map import (
    INTENT_CASH_TIMING_MISMATCH,
    INTENT_VALUE_CHANGE_WITHOUT_SALE,
    INTENT_CAPITALIZATION_DOUBT,
    IntentMatch,
)
from .intent_patterns import (
    ANY_ASYMMETRY_TEMPORAL,
    CAPITALIZATION_DISJUNCTION_PHRASES,
    CASH_FLOW_VERBS,
    EXPLICIT_CASH_MISMATCH_PHRASES,
    INSTALLMENT_MARKERS,
    NEGATION_TOKENS,
    SALE_NEGATION_PHRASES,
    STRONG_ASYMMETRY_TEMPORAL,
    TRANSACTION_NOUNS,
    TRANSACTION_VERBS,
    VALUE_CHANGE_MARKERS,
)


# =====================================================================
# Helpers
# =====================================================================

_WORD_RE = re.compile(r"\b[\w]+\b", re.UNICODE)


def _tokens(normalized_query: str) -> set[str]:
    return set(_WORD_RE.findall(normalized_query))


def _has_any_token(query_tokens: set[str], token_set: set[str]) -> list[str]:
    return sorted(query_tokens & token_set)


def _has_any_phrase(normalized_query: str, phrase_set: set[str]) -> list[str]:
    return sorted([p for p in phrase_set if p in normalized_query])


def _markers_present(normalized_query: str, marker_set: set[str]) -> list[str]:
    """Para sets mixtos (tokens + frases): chequea según haya espacio o no."""
    tokens = _tokens(normalized_query)
    hits: set[str] = set()
    for m in marker_set:
        if " " in m:
            if m in normalized_query:
                hits.add(m)
        else:
            if m in tokens:
                hits.add(m)
    return sorted(hits)


def _normalize(text: str) -> str:
    """Lower + strip acentos + colapsa whitespace. Espeja keyword_router._normalize."""
    if not text:
        return ""
    text = text.lower()
    text = "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )
    text = re.sub(r"\s+", " ", text).strip()
    return text


# =====================================================================
# Detectores individuales — cada uno devuelve (fired, triggered_by_list)
# =====================================================================

def _check_capitalization_doubt(normalized_query: str) -> tuple[bool, list[str]]:
    """Disjunción explícita "gasto o activo" (y variantes)."""
    hits = _has_any_phrase(normalized_query, CAPITALIZATION_DISJUNCTION_PHRASES)
    return (bool(hits), hits)


def _check_value_change_without_sale(normalized_query: str) -> tuple[bool, list[str]]:
    """
    Requiere AMBAS condiciones combinadas:
      (A) marcador de cambio de valor ("aumenta", "sube", "vale mas")
      (B) negación/posposición de venta ("no vendo", "hasta venderlo")
    """
    value_hits = _markers_present(normalized_query, VALUE_CHANGE_MARKERS)
    sale_neg_hits = _has_any_phrase(normalized_query, SALE_NEGATION_PHRASES)
    fired = bool(value_hits) and bool(sale_neg_hits)
    return (fired, value_hits + sale_neg_hits if fired else [])


def _check_cash_timing_mismatch(normalized_query: str) -> tuple[bool, list[str]]:
    """
    Dispara por CUALQUIERA de estas condiciones:
      (A) Frase explícita de asimetría cash/fact.
      (B) Installment marker + (cash_verb o transaction).
      (C) Cash verb + negación + asimetría temporal (cualquiera).
      (D) Transaction + cash verb + asimetría temporal.
      (E) Cash verb + STRONG_ASYMMETRY (todavia/aun/diferido) aunque no haya negación.
    """
    # (A) frase explícita
    explicit = _has_any_phrase(normalized_query, EXPLICIT_CASH_MISMATCH_PHRASES)
    if explicit:
        return (True, explicit)

    tokens = _tokens(normalized_query)
    cash = _has_any_token(tokens, CASH_FLOW_VERBS)
    trans_v = _has_any_token(tokens, TRANSACTION_VERBS)
    trans_n = _has_any_token(tokens, TRANSACTION_NOUNS)
    neg = _has_any_token(tokens, NEGATION_TOKENS)
    strong_asym = _has_any_token(tokens, STRONG_ASYMMETRY_TEMPORAL)
    any_asym = _has_any_token(tokens, ANY_ASYMMETRY_TEMPORAL)
    installments = _has_any_token(tokens, INSTALLMENT_MARKERS)

    has_cash = bool(cash)
    has_transaction = bool(trans_v or trans_n)

    # (B) installment + contexto transaccional
    if installments and (has_cash or has_transaction):
        return (True, installments + cash + trans_v + trans_n)

    # (C) cash + negación + asimetría (cualquier temporal)
    if has_cash and neg and any_asym:
        return (True, cash + neg + any_asym)

    # (D) transaction + cash + asimetría (cualquier temporal)
    if has_transaction and has_cash and any_asym:
        return (True, trans_v + trans_n + cash + any_asym)

    # (E) cash + STRONG asymmetry (sin negación explícita)
    if has_cash and strong_asym:
        return (True, cash + strong_asym)

    return (False, [])


# Mapeo detector → intent_id (en el mismo orden declarado en intent_map).
_DETECTORS: tuple[tuple[str, callable], ...] = (
    (INTENT_CAPITALIZATION_DOUBT, _check_capitalization_doubt),
    (INTENT_VALUE_CHANGE_WITHOUT_SALE, _check_value_change_without_sale),
    (INTENT_CASH_TIMING_MISMATCH, _check_cash_timing_mismatch),
)


# =====================================================================
# Estado del último detect (opt-in stats para harness)
# =====================================================================

# dict mutable — intencionalmente no thread-safe, uso del harness es serial.
_LAST_DETECTION: dict[str, object] = {
    "detected": False,
    "routed": False,
    "conflict": False,
    "candidates": [],
}


def get_last_detection() -> dict[str, object]:
    """Retorna una copia del estado del último detect_intent()."""
    return dict(_LAST_DETECTION)


def _reset_last_detection() -> None:
    _LAST_DETECTION["detected"] = False
    _LAST_DETECTION["routed"] = False
    _LAST_DETECTION["conflict"] = False
    _LAST_DETECTION["candidates"] = []


# =====================================================================
# Entry point — detect_intent
# =====================================================================

def detect_intent(normalized_query: str) -> Optional[IntentMatch]:
    """
    Corre los 3 detectores sobre la query normalizada.

    Semántica (auditor Ronda 2):
        * 0 matches → None (fallback al keyword router).
        * 1 match   → IntentMatch (route via intent layer).
        * >1 match  → None + flag conflict (fallback al keyword router).

    Precondición: normalized_query ya viene lower + sin acentos + ws colapsado.
    """
    _reset_last_detection()

    if not normalized_query:
        return None

    candidates: list[tuple[str, list[str]]] = []
    for intent_id, check in _DETECTORS:
        fired, triggered_by = check(normalized_query)
        if fired:
            candidates.append((intent_id, triggered_by))

    _LAST_DETECTION["candidates"] = [c[0] for c in candidates]

    if len(candidates) == 0:
        return None

    if len(candidates) > 1:
        # Conflict: múltiples intents compatibles — devolvemos None y que el
        # keyword router decida con sus disambiguation rules (u otra vez refuse).
        _LAST_DETECTION["detected"] = True
        _LAST_DETECTION["conflict"] = True
        return None

    # Exactamente 1 candidato → route via intent.
    intent_id, triggered_by = candidates[0]
    _LAST_DETECTION["detected"] = True
    _LAST_DETECTION["routed"] = True
    return IntentMatch.from_intent_id(intent_id, triggered_by)


# =====================================================================
# Self-test
# =====================================================================

def _self_test() -> int:
    """
    Casos críticos:
      * Paráfrasis del blind_juan batch que SOLO pasan vía intent.
      * Variantes adicionales por intent.
      * Negativos (no debe disparar).
      * Conflict (debe retornar None).
    """
    cases = [
        # --- cash_timing_mismatch (devengado) ---
        ("si vendo algo pero no me lo pagan todavia cuenta como ingreso igual",
         "cash_timing_mismatch", "devengado"),
        ("los gastos siempre son cosas que ya pague o pueden ser antes",
         "cash_timing_mismatch", "devengado"),
        ("che si compro algo pero lo pago en cuotas cuando cuenta como gasto",
         "cash_timing_mismatch", "devengado"),
        ("antes de cobrar ya es ingreso",
         "cash_timing_mismatch", "devengado"),
        ("sin cobrar puedo reconocer el ingreso",
         "cash_timing_mismatch", "devengado"),
        ("no me pagan todavia",
         "cash_timing_mismatch", "devengado"),
        ("cobro en cuotas como lo registro",
         "cash_timing_mismatch", "devengado"),

        # --- value_change_without_sale (realizacion) ---
        ("si algo aumenta de precio pero no lo vendo eso es ganancia",
         "value_change_without_sale", "realizacion"),
        ("si algo vale mas con el tiempo eso se registra o no hasta venderlo",
         "value_change_without_sale", "realizacion"),
        ("aumenta el valor aunque no vendi todavia",
         "value_change_without_sale", "realizacion"),

        # --- capitalization_doubt (activo) ---
        ("si compro una maquina eso es gasto o activo directamente",
         "capitalization_doubt", "activo"),
        ("esto es activo o gasto",
         "capitalization_doubt", "activo"),
        ("no se si es un gasto o un activo",
         "capitalization_doubt", "activo"),

        # --- Negativos: no debe disparar ---
        ("que es un activo", None, None),
        ("definicion de pasivo", None, None),
        ("ya le pague al proveedor", None, None),
        ("vendi ayer toda la mercaderia", None, None),
        ("el patrimonio es lo mismo que el capital", None, None),
        ("contabilidad???", None, None),
        ("", None, None),
    ]

    failures = []
    for query, exp_intent, exp_concept in cases:
        q = _normalize(query)
        result = detect_intent(q)
        ok = False
        if exp_intent is None and result is None:
            ok = True
        elif result is not None and result.intent_id == exp_intent and result.concept_id == exp_concept:
            ok = True

        if not ok:
            failures.append({
                "query": query,
                "normalized": q,
                "expected": {"intent": exp_intent, "concept": exp_concept},
                "got": {
                    "intent": result.intent_id if result else None,
                    "concept": result.concept_id if result else None,
                    "triggered_by": result.triggered_by if result else None,
                    "last_detection": get_last_detection(),
                },
            })

    # Conflict test: query que dispara ≥2 intents → None con flag conflict.
    # Construcción intencional: "aumenta de precio pero no lo vendo, y si lo compro
    # en cuotas..." → dispara value_change_without_sale + cash_timing_mismatch.
    conflict_query = (
        "si aumenta de precio pero no lo vendo, y ademas lo compro en cuotas, "
        "eso es ganancia?"
    )
    q = _normalize(conflict_query)
    result = detect_intent(q)
    last = get_last_detection()
    conflict_ok = (
        result is None
        and last.get("conflict") is True
        and len(last.get("candidates", [])) >= 2
    )
    if not conflict_ok:
        failures.append({
            "query": conflict_query,
            "normalized": q,
            "expected": {"result": None, "conflict": True, "candidates_gte": 2},
            "got": {
                "intent": result.intent_id if result else None,
                "last_detection": last,
            },
        })

    total = len(cases) + 1  # +1 por el conflict test
    if failures:
        import json
        print(f"intent_detector — self-test FAILED ({len(failures)}/{total} cases):")
        print(json.dumps(failures, ensure_ascii=False, indent=2))
        return 1

    print(f"intent_detector — self-test PASSED ({total}/{total} cases)")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(_self_test())
