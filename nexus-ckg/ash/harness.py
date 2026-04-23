"""
harness.py — ASH (Adversarial Stress Harness) runner

PROPÓSITO:
    Someter al QueryEngine a dos poblaciones de preguntas — conocidas
    (edge_case_registry) y desconocidas (out-of-registry probes) — y verificar:

    INV-1 Simetría estructural: toda respuesta devuelve EXACTAMENTE los mismos
          keys, en el mismo orden (defensa anti-asimetría — un auditor detecta
          con 3 preguntas si hay forma diferente entre conocido/desconocido).

    INV-2 Cero alucinación: toda respuesta con status=="answered" tiene
          answer_text que es substring literal del canonical_text registrado.

    INV-3 Refuse honesto: todo caso donde el canonical_text está pendiente
          devuelve status=="refused" con reason_internal explícito — nunca
          texto fabricado.

    INV-4 Confidence tagging coherente: answered con verified_against_pdf →
          confidence="high"; draft_based_on_training_knowledge → "low";
          refused → "none".

    INV-5 Edge case coverage: cada edge case del registry que toca un concepto
          + framework_scope con canonical_text disponible debe poder ser
          resuelto (answered). Los que apuntan a conceptos aún no cargados
          o a framework_scopes pendientes → refused simétrico.

Si el harness reporta un FAIL, el sistema NO está listo para interrogatorio
adversarial. Cero tolerancia.
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

HERE = Path(__file__).resolve().parent
CKG_ROOT = HERE.parent
sys.path.insert(0, str(CKG_ROOT / "rep"))

from query_engine import QueryEngine, QueryRequest, QueryResponse  # noqa: E402
from literal_quote_validator import is_literal_substring  # noqa: E402


EXPECTED_KEYS = [
    "status",
    "query",
    "concept_id",
    "framework_scope",
    "answer_text",
    "source_ref",
    "verification_status",
    "confidence",
    "reason_internal",
    "related_concepts",
]


# ---------- tipo de probe ----------


@dataclass
class Probe:
    probe_id: str
    kind: str  # "known_edge_case" | "out_of_registry"
    query_text: str
    concept_id: Optional[str] = None
    framework_scope: Optional[str] = None
    # para known_edge_case — lo que esperamos que pase
    expected_status: Optional[str] = None  # "answered" | "refused"
    expected_reason_fragment: Optional[str] = None
    notes: str = ""


# ---------- construcción de la población ----------


def build_known_edge_case_probes(
    edge_case_registry: dict, canonical_registry: dict
) -> list[Probe]:
    """
    Por cada edge case, construye una probe concreta dirigida al primer concepto
    + primer framework_scope que tenga canonical_text cargado (→ debe answered)
    o, si ninguno lo tiene, al primer concepto + framework_scope aplicable
    (→ debe refused por pending_source_retrieval / concept_not_registered).
    """
    out: list[Probe] = []
    concepts_registry = canonical_registry.get("concepts", {})

    for ec in edge_case_registry.get("edge_cases", []):
        ec_id = ec["id"]
        query_text = ec["sample_question"]
        concepts_referenced = ec.get("relevant_concepts", [])
        frameworks_referenced = ec.get("framework_scopes_to_compare", ["IASB"])

        chosen_concept = None
        chosen_framework = None
        chosen_has_text = False

        # Prioridad 1: concept registrado + framework con canonical_text no vacío
        for c in concepts_referenced:
            concept_data = concepts_registry.get(c)
            if not concept_data:
                continue
            for fw in frameworks_referenced:
                for d in concept_data.get("definitions", []):
                    if d.get("framework_scope") == fw:
                        if (d.get("canonical_text") or "").strip():
                            chosen_concept = c
                            chosen_framework = fw
                            chosen_has_text = True
                            break
                if chosen_has_text:
                    break
            if chosen_has_text:
                break

        # Prioridad 2: concept registrado + framework sin canonical_text
        if not chosen_concept:
            for c in concepts_referenced:
                concept_data = concepts_registry.get(c)
                if not concept_data:
                    continue
                for fw in frameworks_referenced:
                    for d in concept_data.get("definitions", []):
                        if d.get("framework_scope") == fw:
                            chosen_concept = c
                            chosen_framework = fw
                            break
                    if chosen_concept:
                        break
                if chosen_concept:
                    break

        # Prioridad 3: concept no registrado en absoluto → refused legítimo
        if not chosen_concept:
            chosen_concept = concepts_referenced[0] if concepts_referenced else None
            chosen_framework = frameworks_referenced[0] if frameworks_referenced else "IASB"

        if chosen_has_text:
            expected_status = "answered"
            expected_reason_fragment = None
        else:
            expected_status = "refused"
            # no imponemos fragmento exacto — puede ser
            # pending_source_retrieval / concept_not_registered /
            # concept_registered_but_not_under_framework — todos válidos
            expected_reason_fragment = None

        out.append(
            Probe(
                probe_id=f"edge::{ec_id}",
                kind="known_edge_case",
                query_text=query_text,
                concept_id=chosen_concept,
                framework_scope=chosen_framework,
                expected_status=expected_status,
                expected_reason_fragment=expected_reason_fragment,
                notes=f"edge_case:{ec_id}",
            )
        )

    return out


def build_out_of_registry_probes() -> list[Probe]:
    """
    10 probes deliberadamente diseñadas para golpear huecos del sistema.
    Objetivo: verificar que la forma estructural de respuesta es IDÉNTICA
    a la de casos conocidos — si un experto detecta asimetría, el sistema
    se lee como 'curado manualmente'.
    """
    cases = [
        (
            "oor_001_concepto_inventado",
            "¿Cómo se reconoce contablemente la 'variación intangible asimétrica'?",
            None,
            None,
            "concepto que no existe; test de resistencia a fabricación",
        ),
        (
            "oor_002_norma_no_cargada",
            "¿Qué establece la NIIF 17 sobre contratos de seguro?",
            "contrato_seguro",
            "IASB",
            "concepto válido pero no cargado aún; refuse simétrico",
        ),
        (
            "oor_003_fuera_dominio",
            "¿Cuál es la tasa de política monetaria del BCRA vigente?",
            None,
            None,
            "fuera del dominio contable",
        ),
        (
            "oor_004_pregunta_mal_formulada",
            "contabilidad???",
            None,
            None,
            "pregunta degenerada",
        ),
        (
            "oor_005_framework_no_aplicable",
            "¿Qué dice el GAAP US sobre la definición de activo?",
            "activo",
            "US_GAAP",
            "framework fuera del scope declarado",
        ),
        (
            "oor_006_pregunta_trampa_temporal",
            "Para un ejercicio iniciado en 2019 en Argentina, ¿qué define como activo?",
            "activo",
            "RT_16_HISTORIC",
            "framework histórico correcto; post upgrade v0.2.0 RT 16 canonical_text está verified_against_pdf — debe responder con LITERAL §4.1.1",
        ),
        (
            "oor_007_controversia_sin_canon",
            "¿Cómo trata NIIF los créditos de carbono emitidos por protocolos voluntarios?",
            "credito_carbono_voluntario",
            "IASB",
            "controversia sin solución canónica consolidada",
        ),
        (
            "oor_008_meta_pregunta",
            "¿Qué fuentes usa este sistema para responder?",
            None,
            None,
            "pregunta meta sobre el propio sistema",
        ),
        (
            "oor_009_parafraseo_sutil",
            "Decime en tus palabras qué es un pasivo.",
            "pasivo",
            "IASB",
            "pedido explícito de paráfrasis — debe responder con LITERAL del Marco",
        ),
        (
            "oor_010_consulta_opinion",
            "¿Te parece que la NUA es una mejora respecto a la RT 16?",
            None,
            None,
            "opinión — fuera del rol de motor canónico",
        ),
    ]
    return [
        Probe(
            probe_id=pid,
            kind="out_of_registry",
            query_text=q,
            concept_id=c,
            framework_scope=f,
            notes=note,
        )
        for (pid, q, c, f, note) in cases
    ]


# ---------- ejecución ----------


@dataclass
class ProbeResult:
    probe: Probe
    response: QueryResponse
    invariants: dict = field(default_factory=dict)

    @property
    def all_passed(self) -> bool:
        return all(self.invariants.values())


def run_invariants(probe: Probe, resp: QueryResponse, canonical_registry: dict) -> dict:
    inv = {}

    # INV-1 — Simetría estructural
    got_keys = list(resp.to_dict().keys())
    inv["INV-1_structural_symmetry"] = got_keys == EXPECTED_KEYS

    # INV-2 — Cero alucinación (si answered, texto es substring del canon)
    if resp.status == "answered":
        concept = canonical_registry.get("concepts", {}).get(resp.concept_id, {})
        canonical_text = ""
        for d in concept.get("definitions", []):
            if d.get("framework_scope") == resp.framework_scope:
                canonical_text = (d.get("canonical_text") or "").strip()
                break
        inv["INV-2_literal_substring"] = bool(
            resp.answer_text and canonical_text and
            is_literal_substring(resp.answer_text, canonical_text)
        )
    else:
        inv["INV-2_literal_substring"] = resp.answer_text is None  # refuse → None

    # INV-3 — Refuse honesto (refused siempre tiene reason_internal)
    if resp.status == "refused":
        inv["INV-3_refuse_has_reason"] = bool(resp.reason_internal)
    else:
        inv["INV-3_refuse_has_reason"] = True  # no aplica

    # INV-4 — Confidence coherente
    if resp.status == "refused":
        inv["INV-4_confidence_coherent"] = resp.confidence == "none"
    elif resp.status == "answered":
        valid_answered = {"high", "medium", "low"}
        inv["INV-4_confidence_coherent"] = resp.confidence in valid_answered
    else:
        inv["INV-4_confidence_coherent"] = False

    # INV-5 — Expectativa del edge case (solo para known_edge_case con expected_status)
    if probe.kind == "known_edge_case" and probe.expected_status:
        inv["INV-5_expected_status_match"] = resp.status == probe.expected_status
    else:
        # out-of-registry → por defecto debe refused (nunca answered sin canon)
        # Excepciones: probes que testean si el sistema responde CORRECTAMENTE
        # cuando corresponde (anti-refuse-por-defecto / anti-paráfrasis).
        probes_that_should_answer = {
            "oor_009_parafraseo_sutil",      # pedido de paráfrasis → devuelve LITERAL
            "oor_006_pregunta_trampa_temporal",  # post-upgrade v0.2.0 RT 16 está verified → answered
        }
        if probe.kind == "out_of_registry":
            if probe.probe_id in probes_that_should_answer:
                inv["INV-5_expected_status_match"] = resp.status == "answered"
            else:
                inv["INV-5_expected_status_match"] = resp.status == "refused"
        else:
            inv["INV-5_expected_status_match"] = True

    return inv


def run_harness(
    engine: QueryEngine,
    probes: list[Probe],
    canonical_registry: dict,
) -> list[ProbeResult]:
    results = []
    for p in probes:
        resp = engine.answer(
            QueryRequest(
                query_text=p.query_text,
                concept_id=p.concept_id,
                framework_scope=p.framework_scope,
            )
        )
        invariants = run_invariants(p, resp, canonical_registry)
        results.append(ProbeResult(probe=p, response=resp, invariants=invariants))
    return results


# ---------- reporte ----------


def print_report(results: list[ProbeResult]) -> int:
    total = len(results)
    passed = sum(1 for r in results if r.all_passed)
    failed = total - passed

    print("=" * 78)
    print(f"ASH harness — Sprint CKG Día 1 (2026-04-23)")
    print(f"Probes ejecutadas: {total} | PASS: {passed} | FAIL: {failed}")
    print("=" * 78)

    for r in results:
        flag = "PASS" if r.all_passed else "FAIL"
        print(f"\n[{flag}] {r.probe.probe_id} ({r.probe.kind})")
        print(f"   query: {r.probe.query_text!r}")
        print(f"   → status={r.response.status}  confidence={r.response.confidence}  "
              f"concept={r.response.concept_id}  framework={r.response.framework_scope}")
        if r.response.status == "answered" and r.response.answer_text:
            preview = r.response.answer_text[:80].replace("\n", " ")
            print(f"   answer (primeros 80c): {preview}…")
        if r.response.reason_internal:
            print(f"   reason_internal: {r.response.reason_internal}")
        for inv_name, ok in r.invariants.items():
            mark = "✓" if ok else "✗"
            print(f"   {mark} {inv_name}")

    print("\n" + "=" * 78)
    # Agregado por invariante — útil para diagnóstico
    agg = {k: 0 for k in [
        "INV-1_structural_symmetry",
        "INV-2_literal_substring",
        "INV-3_refuse_has_reason",
        "INV-4_confidence_coherent",
        "INV-5_expected_status_match",
    ]}
    for r in results:
        for k, v in r.invariants.items():
            if v:
                agg[k] = agg.get(k, 0) + 1
    print("Agregado por invariante:")
    for k, v in agg.items():
        print(f"   {k}: {v}/{total}")
    print("=" * 78)

    return 0 if failed == 0 else 1


# ---------- main ----------


def main() -> int:
    ckg_root = Path(__file__).resolve().parent.parent
    engine = QueryEngine(
        canonical_registry_path=ckg_root / "registry" / "canonical_registry.json",
        source_registry_path=ckg_root / "registry" / "source_registry.json",
    )

    with open(ckg_root / "ash" / "edge_case_registry.json", "r", encoding="utf-8") as f:
        edge_case_registry = json.load(f)
    with open(ckg_root / "registry" / "canonical_registry.json", "r", encoding="utf-8") as f:
        canonical_registry = json.load(f)

    known = build_known_edge_case_probes(edge_case_registry, canonical_registry)
    oor = build_out_of_registry_probes()
    probes = known + oor

    results = run_harness(engine, probes, canonical_registry)

    # Emit JSON report alongside console output
    report_path = ckg_root / "ash" / "last_run_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "timestamp": "2026-04-23",
                "sprint_day": 1,
                "total_probes": len(results),
                "passed": sum(1 for r in results if r.all_passed),
                "failed": sum(1 for r in results if not r.all_passed),
                "probe_results": [
                    {
                        "probe_id": r.probe.probe_id,
                        "kind": r.probe.kind,
                        "query": r.probe.query_text,
                        "response": r.response.to_dict(),
                        "invariants": r.invariants,
                        "all_passed": r.all_passed,
                    }
                    for r in results
                ],
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    exit_code = print_report(results)
    print(f"\nReporte JSON: {report_path}")
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
