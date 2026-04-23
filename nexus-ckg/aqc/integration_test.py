"""
integration_test.py — verifica el loop cerrado AQC → REP.

Pregunta en lenguaje natural → keyword_router clasifica → query_engine
resuelve contra canonical_registry → se verifica answer literal o refuse honesto.

Si esto falla, el sistema no está cerrado — la pregunta "¿funciona end-to-end?"
no tiene respuesta operacional. Cero tolerancia.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CKG_ROOT = HERE.parent
sys.path.insert(0, str(CKG_ROOT / "rep"))
sys.path.insert(0, str(CKG_ROOT / "aqc"))

from query_engine import QueryEngine, QueryRequest  # noqa: E402
from keyword_router import classify_query  # noqa: E402


def run_loop(query_text: str, engine: QueryEngine) -> dict:
    """
    Ejecuta el loop completo.

    1. AQC clasifica la pregunta.
    2. Si AQC devuelve concept_id=None → upstream refuse.
    3. Si AQC devuelve (concept, framework) → pasar al query_engine.
    """
    classification = classify_query(query_text)
    if classification.concept_id is None:
        return {
            "loop_status": "aqc_refused_before_rep",
            "aqc": classification.to_dict(),
            "rep": None,
        }

    req = QueryRequest(
        query_text=query_text,
        concept_id=classification.concept_id,
        framework_scope=classification.framework_scope,
    )
    resp = engine.answer(req)
    return {
        "loop_status": "aqc_routed_to_rep",
        "aqc": classification.to_dict(),
        "rep": resp.to_dict(),
    }


def main() -> int:
    engine = QueryEngine(
        canonical_registry_path=CKG_ROOT / "registry" / "canonical_registry.json",
        source_registry_path=CKG_ROOT / "registry" / "source_registry.json",
    )

    # Cada caso: (query, expected_loop_status, expected_rep_status_or_None).
    # Para queries mal formuladas o fuera de dominio, el AQC debe refuse antes
    # de llegar al REP — eso es "aqc_refused_before_rep" con rep=None.
    cases = [
        ("¿Qué es un activo bajo la NUA?", "aqc_routed_to_rep", "answered"),
        ("Definición literal de pasivo en el Marco Conceptual IASB",
         "aqc_routed_to_rep", "answered"),
        ("¿Cómo se compone el patrimonio neto según RT 16?",
         "aqc_routed_to_rep", "answered"),
        ("¿Qué es ingreso bajo RT 16?", "aqc_routed_to_rep", "answered"),
        ("¿Qué es un gasto según RT 16?", "aqc_routed_to_rep", "answered"),
        ("¿Qué es el devengado según NUA?", "aqc_routed_to_rep", "refused"),
        ("¿Qué es la realización en RT 16?", "aqc_routed_to_rep", "refused"),
        ("¿Cuándo hay control sobre otra entidad bajo NUA?",
         "aqc_routed_to_rep", "answered"),
        ("contabilidad???", "aqc_refused_before_rep", None),
        ("", "aqc_refused_before_rep", None),
    ]

    failures = []
    for query, exp_loop, exp_rep_status in cases:
        out = run_loop(query, engine)
        ok_loop = out["loop_status"] == exp_loop
        ok_rep = True
        if exp_rep_status:
            ok_rep = out["rep"] and out["rep"]["status"] == exp_rep_status
        if not (ok_loop and ok_rep):
            failures.append({
                "query": query,
                "expected": {"loop": exp_loop, "rep_status": exp_rep_status},
                "got": {
                    "loop": out["loop_status"],
                    "rep_status": out["rep"]["status"] if out["rep"] else None,
                    "rep_concept": out["rep"]["concept_id"] if out["rep"] else None,
                    "rep_fw": out["rep"]["framework_scope"] if out["rep"] else None,
                    "rep_confidence": out["rep"]["confidence"] if out["rep"] else None,
                    "aqc_concept": out["aqc"]["concept_id"],
                    "aqc_fw": out["aqc"]["framework_scope"],
                    "aqc_conf": out["aqc"]["confidence"],
                    "aqc_reason": out["aqc"]["reason"],
                },
            })

    if failures:
        print(f"AQC→REP integration — FAILED ({len(failures)}/{len(cases)} cases failing):")
        print(json.dumps(failures, ensure_ascii=False, indent=2))
        return 1

    print(f"AQC→REP integration — PASSED ({len(cases)}/{len(cases)} cases; loop end-to-end cerrado)")
    # Sample de output para inspección visual
    sample_query = "¿Qué es un activo bajo la NUA?"
    sample = run_loop(sample_query, engine)
    print()
    print(f"SAMPLE query: {sample_query!r}")
    print(f"  AQC → concept={sample['aqc']['concept_id']}  fw={sample['aqc']['framework_scope']}  conf={sample['aqc']['confidence']}")
    rep = sample["rep"]
    print(f"  REP → status={rep['status']}  confidence={rep['confidence']}")
    if rep["answer_text"]:
        preview = rep["answer_text"][:120].replace("\n", " ")
        print(f"  answer literal: {preview}…")
    return 0


if __name__ == "__main__":
    sys.exit(main())
