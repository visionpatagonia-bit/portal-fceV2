"""
run_blind_test.py — Blind test harness aislado del contract endógeno.

PROPÓSITO:
    Medir la robustez real del AQC router contra queries que NO fueron
    diseñadas mirando las keywords del router. Complementa demo_contract.json
    (que es endógeno por construcción) con un set externo.

DOCTRINA:
    * Este harness NO modifica el router. Solo lo invoca y clasifica.
    * Métricas separadas por origen (synthetic vs real) y por tipo de
      resultado. NO se mezclan con contract_coverage_ratio del demo_contract.
    * Ground truth de cada query declarado explícitamente en el JSON de
      entrada, con un campo `judge_note` que documenta por qué un humano
      experto diría que esa query debería rutear así.

TIPOS DE RESULTADO (por query):
    * correct_route  — ground_truth = concept_id devuelto por el router.
    * refuse_ok      — ground_truth = None (refuse esperado) y el router
                       también devolvió None.
    * wrong_route    — ground_truth != None, router devolvió != None, pero
                       concept_id distinto (ruteo a concepto equivocado).
    * refuse_bad     — ground_truth != None pero router devolvió None
                       (falso negativo: el router debió rutear y no lo hizo).
    * over_route     — ground_truth = None pero router devolvió concept_id
                       (falso positivo: el router ruteó algo que no debía).

MÉTRICA PRINCIPAL:
    blind_test_accuracy = (correct_route + refuse_ok) / total

USO:
    python run_blind_test.py blind_synthetic_v1.json
    python run_blind_test.py blind_real_v1.json
    python run_blind_test.py blind_synthetic_v1.json --report report.md
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

# Import del router actual — sin tocar su implementación.
HERE = Path(__file__).resolve().parent
AQC_DIR = HERE.parent
sys.path.insert(0, str(AQC_DIR))

from keyword_router import (  # noqa: E402
    classify_query,
    _match_keywords,
    _normalize,
    CONCEPT_KEYWORDS,
)


def _classify_result(ground_truth_concept: str | None, router_concept: str | None) -> str:
    """Clasifica cada query según ground truth vs router output.

    Taxonomía (granular):
        correct_route — GT != None, router_concept == GT
        refuse_ok     — GT == None, router_concept == None
        wrong_route   — ambos != None, router_concept != GT
        refuse_bad    — GT != None, router_concept == None (falso negativo)
        over_route    — GT == None, router_concept != None (falso positivo)
    """
    if ground_truth_concept is None and router_concept is None:
        return "refuse_ok"
    if ground_truth_concept is None and router_concept is not None:
        return "over_route"
    if ground_truth_concept is not None and router_concept is None:
        return "refuse_bad"
    if ground_truth_concept == router_concept:
        return "correct_route"
    return "wrong_route"


def _infer_failure_reason(result_type: str, num_concepts_matched: int) -> str | None:
    """Infiere causa de falla para auditabilidad (Ronda 4 del auditor).

    Mapping:
        refuse_bad                     → no_keyword_match
        wrong_route (1 match)          → wrong_keyword_trigger
        wrong_route (>1 match)         → ambiguous_match
        over_route                     → over_routed_on_scope_query
        correct_route / refuse_ok      → None
    """
    if result_type == "refuse_bad":
        return "no_keyword_match"
    if result_type == "wrong_route":
        return "ambiguous_match" if num_concepts_matched > 1 else "wrong_keyword_trigger"
    if result_type == "over_route":
        return "over_routed_on_scope_query"
    return None


def _run_query(query_entry: dict[str, Any]) -> dict[str, Any]:
    """Corre una sola query por el router y clasifica el resultado."""
    q_text = query_entry["text"]
    gt_concept = query_entry.get("ground_truth_concept")
    gt_framework = query_entry.get("ground_truth_framework")

    classification = classify_query(q_text)
    result_type = _classify_result(gt_concept, classification.concept_id)

    # Exponer TODOS los conceptos matcheados (no solo el top) para detectar ambiguous_match.
    normalized = _normalize(q_text)
    all_concept_hits = _match_keywords(normalized, CONCEPT_KEYWORDS)
    num_concepts_matched = len(all_concept_hits)

    failure_reason = _infer_failure_reason(result_type, num_concepts_matched)

    framework_match = None
    if gt_framework is not None and classification.framework_scope is not None:
        framework_match = (gt_framework == classification.framework_scope)

    return {
        "id": query_entry["id"],
        "text": q_text,
        "ground_truth_concept": gt_concept,
        "ground_truth_framework": gt_framework,
        "router_concept": classification.concept_id,
        "router_framework": classification.framework_scope,
        "router_confidence": classification.confidence,
        "router_reason": classification.reason,
        "matched_keywords": classification.matched_concept_keywords,
        "matched_framework_kw": classification.matched_framework_keywords,
        "num_concepts_matched": num_concepts_matched,
        "all_concepts_hit": sorted(all_concept_hits.keys()),
        "result_type": result_type,
        "failure_reason": failure_reason,
        "framework_match": framework_match,
        "judge_note": query_entry.get("judge_note", ""),
    }


def run_harness(input_path: Path) -> dict[str, Any]:
    """Corre el harness completo contra un JSON de queries."""
    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)

    origin = data.get("origin", "unknown")
    queries = data["queries"]
    per_query = [_run_query(q) for q in queries]

    total = len(per_query)
    counts = Counter(r["result_type"] for r in per_query)
    correct_route = counts.get("correct_route", 0)
    refuse_ok = counts.get("refuse_ok", 0)
    wrong_route = counts.get("wrong_route", 0)
    refuse_bad = counts.get("refuse_bad", 0)
    over_route = counts.get("over_route", 0)

    correct = correct_route + refuse_ok
    accuracy = (correct / total) if total else 0.0

    # --- Ronda 4 del auditor: precision/recall separados ---
    # total_routed = queries donde el router devolvió un concepto
    total_routed = correct_route + wrong_route + over_route
    # total_expected_routes = queries cuyo ground_truth es un concepto
    total_expected_routes = correct_route + wrong_route + refuse_bad
    # total_refuses = queries donde el router devolvió None
    total_refuses = refuse_ok + refuse_bad

    routing_precision = (correct_route / total_routed) if total_routed else None
    routing_recall = (correct_route / total_expected_routes) if total_expected_routes else None
    refuse_precision = (refuse_ok / total_refuses) if total_refuses else None

    # Framework accuracy (solo sobre queries con ambos no-null)
    fw_cases = [r for r in per_query if r["framework_match"] is not None]
    fw_correct = sum(1 for r in fw_cases if r["framework_match"])
    fw_accuracy = (fw_correct / len(fw_cases)) if fw_cases else None

    # --- Failure reason breakdown ---
    failure_counts = Counter(
        r["failure_reason"] for r in per_query if r["failure_reason"] is not None
    )

    report = {
        "origin": origin,
        "version": data.get("version", "unknown"),
        "generator": data.get("generator", "unknown"),
        "generated_at": data.get("generated_at", "unknown"),
        "caveat": data.get("caveat", ""),
        "metrics": {
            "total": total,
            "correct_route": correct_route,
            "refuse_ok": refuse_ok,
            "wrong_route": wrong_route,
            "refuse_bad": refuse_bad,
            "over_route": over_route,
            "blind_test_accuracy": round(accuracy, 4),
            "routing_precision": round(routing_precision, 4) if routing_precision is not None else None,
            "routing_recall": round(routing_recall, 4) if routing_recall is not None else None,
            "refuse_precision": round(refuse_precision, 4) if refuse_precision is not None else None,
            "framework_accuracy_on_routed": round(fw_accuracy, 4) if fw_accuracy is not None else None,
            "failure_reason_breakdown": dict(failure_counts),
        },
        "per_query": per_query,
    }
    return report


def format_markdown(report: dict[str, Any]) -> str:
    """Genera reporte legible en markdown para auditoría."""
    m = report["metrics"]
    lines = [
        f"# Blind Test Report — {report['origin']}",
        "",
        f"- **Version**: {report['version']}",
        f"- **Generator**: {report['generator']}",
        f"- **Generated at**: {report['generated_at']}",
        "",
        "## Caveat",
        "",
        report.get("caveat", "_(none)_"),
        "",
        "## Métricas agregadas",
        "",
        f"- **Total queries**: {m['total']}",
        f"- **blind_test_accuracy**: **{m['blind_test_accuracy']}**",
        f"- **routing_precision** (cuando rutea, ¿acierta?): **{m['routing_precision']}**",
        f"- **routing_recall** (¿rutea todo lo que debe?): **{m['routing_recall']}**",
        f"- **refuse_precision** (cuando no rutea, ¿es correcto?): **{m['refuse_precision']}**",
        f"- framework_accuracy_on_routed: {m['framework_accuracy_on_routed']}",
        "",
        "### Breakdown por tipo",
        "",
        f"- correct_route:  {m['correct_route']}",
        f"- refuse_ok:      {m['refuse_ok']}",
        f"- wrong_route:    {m['wrong_route']}  ← router ruteó mal",
        f"- refuse_bad:     {m['refuse_bad']}  ← router no ruteó y debió",
        f"- over_route:     {m['over_route']}  ← router ruteó y no debió",
        "",
        "### Failure reason breakdown",
        "",
    ]
    fr = m.get("failure_reason_breakdown", {})
    if fr:
        for reason, count in fr.items():
            lines.append(f"- {reason}: {count}")
    else:
        lines.append("_(sin fallas)_")
    lines.extend([
        "",
        "## Detalle por query",
        "",
    ])
    for r in report["per_query"]:
        status_icon = {
            "correct_route": "✅",
            "refuse_ok":     "✅",
            "wrong_route":   "❌",
            "refuse_bad":    "❌",
            "over_route":    "⚠️",
        }.get(r["result_type"], "?")
        fr_line = f"- **Failure reason**: {r['failure_reason']}" if r['failure_reason'] else ""
        lines.extend([
            f"### {status_icon} [{r['id']}] {r['result_type']}",
            "",
            f"- **Query**: {r['text']}",
            f"- **Ground truth**: concept={r['ground_truth_concept']} framework={r['ground_truth_framework']}",
            f"- **Router**:       concept={r['router_concept']} framework={r['router_framework']} confidence={r['router_confidence']}",
            f"- **Router reason**: {r['router_reason']}",
            f"- **All concepts hit**: {r['all_concepts_hit']} (num_matched={r['num_concepts_matched']})",
            f"- **Matched keywords (top)**: {r['matched_keywords']}",
        ])
        if fr_line:
            lines.append(fr_line)
        lines.extend([
            f"- **Judge note**: {r['judge_note']}",
            "",
        ])

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="JSON con queries (schema blind_synthetic_v1.json)")
    parser.add_argument("--json-out", type=Path, help="Path para guardar reporte JSON completo")
    parser.add_argument("--md-out", type=Path, help="Path para guardar reporte markdown legible")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"ERROR: no existe {args.input}", file=sys.stderr)
        return 2

    report = run_harness(args.input)

    # Siempre imprimir resumen en stdout
    m = report["metrics"]
    print(f"=== Blind Test — origin={report['origin']} ===")
    print(f"  total: {m['total']}")
    print(f"  blind_test_accuracy: {m['blind_test_accuracy']}")
    print(f"  routing_precision:   {m['routing_precision']}")
    print(f"  routing_recall:      {m['routing_recall']}")
    print(f"  refuse_precision:    {m['refuse_precision']}")
    print(f"  correct_route: {m['correct_route']}  refuse_ok: {m['refuse_ok']}")
    print(f"  wrong_route:   {m['wrong_route']}  refuse_bad: {m['refuse_bad']}  over_route: {m['over_route']}")
    if m["framework_accuracy_on_routed"] is not None:
        print(f"  framework_accuracy_on_routed: {m['framework_accuracy_on_routed']}")
    if m["failure_reason_breakdown"]:
        print(f"  failure_reasons: {m['failure_reason_breakdown']}")

    if args.json_out:
        args.json_out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  → JSON: {args.json_out}")
    if args.md_out:
        args.md_out.write_text(format_markdown(report), encoding="utf-8")
        print(f"  → MD:   {args.md_out}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
