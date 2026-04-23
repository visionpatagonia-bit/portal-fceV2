"""
literal_quote_validator.py — corazón de REP (Reasoning Engine with Provenance)

REGLA INVIOLABLE:
    Toda afirmación que el sistema emita al usuario DEBE ser un substring literal
    del texto canónico del documento fuente citado. Sin paráfrasis. Sin síntesis.
    Si no hay respaldo literal, el sistema REFUSA responder antes que alucinar.

Esta es la defensa primaria contra interrogatorio adversarial experto.
Diagnóstico del auditor (2026-04-23):
    "Expert systems die from confident wrong answers, not from ignorance.
     Trucco will click the citation, read the §, and say 'this doesn't say
     what the system claims.' Game over."

Mitigación: cada claim es substring del source. Cero paráfrasis en producción.
"""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional


# ---------- normalización ----------

_WHITESPACE_RE = re.compile(r"\s+")


def _strip_accents(s: str) -> str:
    """Remove diacritics for robust matching (á -> a). Does NOT alter semantics."""
    return "".join(
        c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c)
    )


def normalize_for_comparison(s: str, ignore_accents: bool = False) -> str:
    """
    Normalize whitespace (collapse runs, trim) and optionally strip accents.

    By default we KEEP accents (Spanish is accent-sensitive for meaning).
    Use ignore_accents=True only when matching against OCR'd sources where
    accent fidelity is unreliable.
    """
    out = _WHITESPACE_RE.sub(" ", s).strip()
    if ignore_accents:
        out = _strip_accents(out)
    return out


# ---------- resultado ----------


@dataclass
class ValidationResult:
    passed: bool
    claim: str
    source_id: str
    source_section: str
    failure_reason: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


# ---------- validación ----------


def is_literal_substring(
    claim: str, source_text: str, ignore_accents: bool = False
) -> bool:
    """True iff normalized claim appears as literal substring of normalized source."""
    if not claim or not source_text:
        return False
    norm_claim = normalize_for_comparison(claim, ignore_accents=ignore_accents)
    norm_source = normalize_for_comparison(source_text, ignore_accents=ignore_accents)
    return norm_claim in norm_source


def validate_claim(
    claim: str,
    source_canonical_text: str,
    source_id: str,
    source_section: str,
    ignore_accents: bool = False,
) -> ValidationResult:
    """
    Validate that a proposed claim is anchored as a literal substring of source text.

    Returns ValidationResult with passed=True only when the claim (modulo whitespace)
    appears verbatim inside the source's canonical_text.
    """
    if not claim or not claim.strip():
        return ValidationResult(
            passed=False,
            claim=claim,
            source_id=source_id,
            source_section=source_section,
            failure_reason="empty_claim",
        )

    if not source_canonical_text or not source_canonical_text.strip():
        return ValidationResult(
            passed=False,
            claim=claim,
            source_id=source_id,
            source_section=source_section,
            failure_reason="source_has_no_canonical_text_registered",
        )

    if is_literal_substring(claim, source_canonical_text, ignore_accents=ignore_accents):
        return ValidationResult(
            passed=True,
            claim=claim,
            source_id=source_id,
            source_section=source_section,
        )

    return ValidationResult(
        passed=False,
        claim=claim,
        source_id=source_id,
        source_section=source_section,
        failure_reason="claim_is_not_literal_substring__paraphrase_or_hallucination_detected",
    )


# ---------- respuesta honesta ----------


def refuse_response(query: str, reason: str) -> dict:
    """
    Generate the structured 'no canonical support' response.

    The user-facing message is deliberately the SAME shape as a successful
    response (minus the quote). This prevents the adversarial questioner
    from detecting confidence asymmetry between known and unknown cases
    (as flagged by the auditor for Weakness C).
    """
    return {
        "status": "refused",
        "query": query,
        "response_text": (
            "No tengo respaldo canónico literal verificado para responder con "
            "precisión a esta consulta. No voy a inferir: prefiero reconocer el "
            "límite. Si querés, puedo mostrarte los fragmentos adyacentes de los "
            "marcos normativos relacionados para que evaluemos juntos."
        ),
        "reason_internal": reason,
        "confidence": "none",
        "source_ref": None,
    }


# ---------- carga de registries ----------


def load_canonical_registry(path: Path) -> dict:
    """Load canonical_registry.json into memory."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def lookup_canonical_text(
    registry: dict, concept_id: str, framework_scope: str
) -> Optional[tuple[str, str, str]]:
    """
    Fetch (canonical_text, source_id, source_section) for a concept under a framework.

    Returns None if the concept or framework scope is not registered with canonical_text.
    """
    concept = registry.get("concepts", {}).get(concept_id)
    if not concept:
        return None
    for defn in concept.get("definitions", []):
        if defn.get("framework_scope") == framework_scope:
            text = defn.get("canonical_text", "").strip()
            if not text:
                return None
            src = defn.get("source_ref", {})
            return (text, src.get("document_id", ""), src.get("section", ""))
    return None


# ---------- self-test ----------


def _run_self_test() -> None:
    """Self-test exercising positive and negative cases."""

    iasb_activo_known = (
        "Un activo es un recurso económico presente controlado por la entidad como "
        "resultado de sucesos pasados."
    )

    # Case 1 — positive: exact literal substring
    r = validate_claim(
        claim="Un activo es un recurso económico presente controlado por la entidad",
        source_canonical_text=iasb_activo_known,
        source_id="iasb_marco_conceptual_2018_es",
        source_section="§4.3",
    )
    assert r.passed, f"Expected PASS, got FAIL: {r.failure_reason}"

    # Case 2 — positive with whitespace normalization
    r = validate_claim(
        claim="Un  activo   es un recurso económico presente",
        source_canonical_text=iasb_activo_known,
        source_id="iasb_marco_conceptual_2018_es",
        source_section="§4.3",
    )
    assert r.passed, f"Expected PASS with whitespace normalization, got FAIL: {r.failure_reason}"

    # Case 3 — negative: paraphrase (common LLM hallucination pattern)
    r = validate_claim(
        claim="Un activo es un bien económico que la empresa posee y controla",
        source_canonical_text=iasb_activo_known,
        source_id="iasb_marco_conceptual_2018_es",
        source_section="§4.3",
    )
    assert not r.passed, "Expected FAIL on paraphrase, got PASS (hallucination path open!)"
    assert "paraphrase" in (r.failure_reason or "") or "literal" in (r.failure_reason or "")

    # Case 4 — negative: empty claim
    r = validate_claim(
        claim="",
        source_canonical_text=iasb_activo_known,
        source_id="iasb_marco_conceptual_2018_es",
        source_section="§4.3",
    )
    assert not r.passed and r.failure_reason == "empty_claim"

    # Case 5 — negative: empty source
    r = validate_claim(
        claim="algo",
        source_canonical_text="",
        source_id="iasb_marco_conceptual_2018_es",
        source_section="§4.3",
    )
    assert not r.passed and "no_canonical_text" in (r.failure_reason or "")

    # Case 6 — refuse_response shape consistency
    refused = refuse_response(query="¿qué es goodwill interno?", reason="no_registered_entry")
    assert refused["status"] == "refused"
    assert refused["confidence"] == "none"
    assert refused["source_ref"] is None

    print("literal_quote_validator — self-test PASSED (6/6 cases)")


if __name__ == "__main__":
    _run_self_test()
