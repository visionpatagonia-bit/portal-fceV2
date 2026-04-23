"""
query_engine.py — REP (Reasoning Engine with Provenance) — motor de consulta.

Capa sobre literal_quote_validator que convierte una pregunta en respuesta
estructurada usando SOLO textos canónicos del canonical_registry.

Contrato invariante:
    * Toda respuesta tiene la misma forma estructural (dict) independientemente
      de si el caso es conocido o desconocido. Defensa anti-asimetría.
    * Si no hay texto canónico registrado para el framework solicitado, el motor
      REFUSA con refuse_response() — no infiere, no parafrasea.
    * Todo `answer_text` emitido debe pasar validate_claim() contra el
      canonical_text del registry. Si falla → refuse.

Esta capa es deliberadamente delgada: su función es proveer al ASH harness
un punto de invocación homogéneo que se pueda someter a probes adversariales.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

from literal_quote_validator import (
    load_canonical_registry,
    lookup_canonical_text,
    validate_claim,
    refuse_response,
)


# ---------- estructuras ----------


@dataclass
class QueryRequest:
    query_text: str
    concept_id: Optional[str] = None
    framework_scope: Optional[str] = None  # IASB | NUA | RT_16_HISTORIC

    def as_dict(self) -> dict:
        return asdict(self)


@dataclass
class QueryResponse:
    """
    Forma estructural única — emitida idéntica en caso de éxito y de refuse.
    Lo que varía es el contenido de los campos, NUNCA la presencia de ellos.
    """

    status: str  # "answered" | "refused"
    query: str
    concept_id: Optional[str]
    framework_scope: Optional[str]
    answer_text: Optional[str]
    source_ref: Optional[dict]
    verification_status: Optional[str]
    confidence: str  # "high" | "medium" | "low" | "none"
    reason_internal: Optional[str] = None
    related_concepts: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


# ---------- motor ----------


class QueryEngine:
    def __init__(self, canonical_registry_path: Path, source_registry_path: Path):
        self.canonical_registry = load_canonical_registry(canonical_registry_path)
        with open(source_registry_path, "r", encoding="utf-8") as f:
            self.source_registry = json.load(f)

    # ---- helpers ----

    def _source_info(self, source_id: str) -> dict:
        return self.source_registry.get("sources", {}).get(source_id, {})

    def _concept(self, concept_id: str) -> Optional[dict]:
        return self.canonical_registry.get("concepts", {}).get(concept_id)

    def _definition_for_framework(
        self, concept_id: str, framework_scope: str
    ) -> Optional[dict]:
        concept = self._concept(concept_id)
        if not concept:
            return None
        for d in concept.get("definitions", []):
            if d.get("framework_scope") == framework_scope:
                return d
        return None

    # ---- endpoint principal ----

    def answer(self, req: QueryRequest) -> QueryResponse:
        """
        Puerta única de entrada. Rige los 4 escenarios posibles con la
        misma forma estructural de salida.
        """
        # Escenario 1 — concept_id / framework_scope no especificados
        # (out-of-registry probe o pregunta mal formulada)
        if not req.concept_id or not req.framework_scope:
            return self._refuse(
                req,
                reason="query_underspecified__missing_concept_or_framework",
                confidence="none",
            )

        # Escenario 2 — concept_id no está en el registry
        concept = self._concept(req.concept_id)
        if not concept:
            return self._refuse(
                req,
                reason=f"concept_not_registered:{req.concept_id}",
                confidence="none",
            )

        # Escenario 3 — concept registrado pero no bajo este framework_scope
        defn = self._definition_for_framework(req.concept_id, req.framework_scope)
        if not defn:
            return self._refuse(
                req,
                reason=f"concept_registered_but_not_under_framework:{req.framework_scope}",
                confidence="none",
            )

        canonical_text = (defn.get("canonical_text") or "").strip()
        verification_status = defn.get("verification_status", "unknown")
        source_ref = defn.get("source_ref", {})

        # Escenario 3b — definición registrada pero canonical_text pendiente
        if not canonical_text:
            return self._refuse(
                req,
                reason=f"canonical_text_pending_source_retrieval:{req.framework_scope}",
                confidence="none",
                concept_id=req.concept_id,
                framework_scope=req.framework_scope,
                source_ref=source_ref,
                verification_status=verification_status,
            )

        # Escenario 4 — hay texto canónico → validar que devolvemos literal
        validation = validate_claim(
            claim=canonical_text,
            source_canonical_text=canonical_text,
            source_id=source_ref.get("document_id", ""),
            source_section=source_ref.get("section", ""),
        )
        if not validation.passed:
            # Defensa interna: nunca debería disparar (mismo texto), pero si por
            # alguna razón de normalización falla, NO parafraseamos.
            return self._refuse(
                req,
                reason=f"validator_self_check_failed:{validation.failure_reason}",
                confidence="none",
                concept_id=req.concept_id,
                framework_scope=req.framework_scope,
                source_ref=source_ref,
                verification_status=verification_status,
            )

        # Mapeo verification_status → confidence (explícito, no inferido)
        confidence_map = {
            "verified_against_pdf": "high",
            "verified_against_authoritative_secondary": "medium",
            "draft_based_on_training_knowledge": "low",
            "pending_source_retrieval": "none",
            "requires_expert_review": "low",
        }
        confidence = confidence_map.get(verification_status, "low")

        related = [
            e.get("target_concept_id")
            for e in concept.get("edges", [])
            if e.get("target_concept_id")
        ]

        return QueryResponse(
            status="answered",
            query=req.query_text,
            concept_id=req.concept_id,
            framework_scope=req.framework_scope,
            answer_text=canonical_text,
            source_ref=source_ref,
            verification_status=verification_status,
            confidence=confidence,
            reason_internal=None,
            related_concepts=related,
        )

    # ---- refuse path ----

    def _refuse(
        self,
        req: QueryRequest,
        reason: str,
        confidence: str = "none",
        concept_id: Optional[str] = None,
        framework_scope: Optional[str] = None,
        source_ref: Optional[dict] = None,
        verification_status: Optional[str] = None,
    ) -> QueryResponse:
        return QueryResponse(
            status="refused",
            query=req.query_text,
            concept_id=concept_id or req.concept_id,
            framework_scope=framework_scope or req.framework_scope,
            answer_text=None,
            source_ref=source_ref,
            verification_status=verification_status,
            confidence=confidence,
            reason_internal=reason,
            related_concepts=[],
        )


# ---------- self-test ----------


def _run_self_test() -> None:
    here = Path(__file__).resolve().parent
    ckg_root = here.parent
    eng = QueryEngine(
        canonical_registry_path=ckg_root / "registry" / "canonical_registry.json",
        source_registry_path=ckg_root / "registry" / "source_registry.json",
    )

    # Case A — activo bajo IASB (verified_against_authoritative_secondary, post upgrade Día 1)
    r = eng.answer(
        QueryRequest(
            query_text="¿Qué es un activo bajo el Marco Conceptual IASB?",
            concept_id="activo",
            framework_scope="IASB",
        )
    )
    assert r.status == "answered", r.to_dict()
    assert r.answer_text is not None and "recurso económico" in r.answer_text
    assert r.confidence == "medium", f"expected medium, got {r.confidence}"  # authoritative_secondary via RT 54

    # Case B — activo bajo NUA (verified_against_pdf, post upgrade Día 1)
    r = eng.answer(
        QueryRequest(
            query_text="¿Qué es un activo bajo la NUA?",
            concept_id="activo",
            framework_scope="NUA",
        )
    )
    assert r.status == "answered", r.to_dict()
    assert r.answer_text is not None and "recurso económico" in r.answer_text
    assert r.confidence == "high", f"expected high, got {r.confidence}"  # verified_against_pdf

    # Case B2 — activo bajo RT_16_HISTORIC (verified_against_pdf, post upgrade Día 1)
    r = eng.answer(
        QueryRequest(
            query_text="¿Qué es un activo bajo la RT 16?",
            concept_id="activo",
            framework_scope="RT_16_HISTORIC",
        )
    )
    assert r.status == "answered", r.to_dict()
    assert r.answer_text is not None and "Un ente tiene un activo" in r.answer_text
    assert r.confidence == "high"

    # Case C — concepto no registrado
    r = eng.answer(
        QueryRequest(
            query_text="¿Qué es goodwill?",
            concept_id="goodwill",
            framework_scope="IASB",
        )
    )
    assert r.status == "refused"
    assert "concept_not_registered" in (r.reason_internal or "")

    # Case D — out-of-registry probe (sin concept_id)
    r = eng.answer(
        QueryRequest(
            query_text="¿Qué opinás del régimen cambiario argentino?",
        )
    )
    assert r.status == "refused"
    assert "underspecified" in (r.reason_internal or "")

    # Case E — simetría estructural: todas las respuestas tienen los mismos keys
    expected_keys = {
        "status", "query", "concept_id", "framework_scope", "answer_text",
        "source_ref", "verification_status", "confidence", "reason_internal",
        "related_concepts",
    }
    for probe in [
        QueryRequest(query_text="q1", concept_id="activo", framework_scope="IASB"),
        QueryRequest(query_text="q2", concept_id="activo", framework_scope="NUA"),
        QueryRequest(query_text="q3", concept_id="xxx", framework_scope="IASB"),
        QueryRequest(query_text="q4"),
    ]:
        resp_keys = set(eng.answer(probe).to_dict().keys())
        assert resp_keys == expected_keys, f"Asymmetry detected: {resp_keys ^ expected_keys}"

    print("query_engine — self-test PASSED (6/6 cases incluyendo simetría estructural post v0.2.0 upgrade)")


if __name__ == "__main__":
    _run_self_test()
