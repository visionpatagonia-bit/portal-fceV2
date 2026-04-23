"""
keyword_router.py — AQC (Adaptive Query Classifier) — MVP keyword-based.

PROPÓSITO:
    Mapear una pregunta en lenguaje natural a (concept_id, framework_scope)
    para que el QueryEngine pueda resolverla contra el canonical_registry.

    Es la pieza que cierra el loop del sistema:
        query natural  →  AQC  →  (concept_id, framework_scope)  →  REP  →  canonical_text literal

DOCTRINA:
    * No inventa conceptos: solo mapea a los que ya existen en el registry.
    * No fabrica framework: si no hay señal explícita, devuelve None → upstream
      refuse simétrico (mantiene invariante INV-1).
    * Confidence tagging explícito: high = match fuerte + framework explícito;
      medium = match + framework inferido por default del concepto; low = match
      débil (una sola keyword periférica); none = ningún concept identificado.

LIMITACIONES del MVP keyword-based:
    * Sin desambiguación semántica real — no distingue "el activo de la empresa"
      vs "estoy activo en la app".
    * Sin lemmatización — cobertura por sinónimos explícitos listados abajo.
    * Expansión prevista: embeddings locales en Día 4-5 (sentence-transformers
      multilingual, sin dependencia de API externa).
"""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional


# ---------- diccionarios de keywords ----------

# Cada entry: concept_id → lista de frases/tokens que, si aparecen en la query
# normalizada, apuntan a ese concepto. Frases multi-palabra pesan más que
# tokens individuales (ver CONCEPT_MULTIWORD_WEIGHT).
CONCEPT_KEYWORDS: dict[str, list[str]] = {
    "activo": [
        "activo", "activos", "bien de uso", "bienes de uso",
        "recurso economico", "recurso económico", "controla",
    ],
    "pasivo": [
        "pasivo", "pasivos", "obligacion presente", "obligación presente",
        "deuda", "provision", "provisión", "contingencia",
    ],
    "patrimonio_neto": [
        "patrimonio neto", "patrimonio", "capital propio",
        "aporte de propietarios", "utilidades retenidas",
    ],
    "ingreso": [
        "ingreso", "ingresos", "venta", "ventas",
        "aumento del patrimonio", "actividades principales",
    ],
    "gasto": [
        "gasto", "gastos", "costo", "costos",
        "disminucion del patrimonio", "disminución del patrimonio",
    ],
    "devengado": [
        "devengado", "devengamiento", "devengar",
        "percibido", "criterio contable de reconocimiento",
        "hecho sustancial",
    ],
    "realizacion": [
        "realizacion", "realización", "realizado",
        "resultado no realizado", "resultado realizado",
    ],
    "control": [
        "control", "controla", "dirigir las actividades relevantes",
        "dirigir actividades relevantes", "participacion en otra entidad",
        "participación en otra entidad", "mandataria",
    ],
}

# Keywords que apuntan a un framework_scope específico.
FRAMEWORK_KEYWORDS: dict[str, list[str]] = {
    "NUA": [
        "nua", "rt 54", "rt54", "resolucion tecnica 54",
        "resolución técnica 54", "norma unica argentina",
        "norma única argentina",
    ],
    "RT_16_HISTORIC": [
        "rt 16", "rt16", "resolucion tecnica 16", "resolución técnica 16",
        "historico", "histórico", "antes de 2023", "2019", "2020", "2021",
        "2022", "rt 17", "rt17",
    ],
    "IASB": [
        "iasb", "marco conceptual", "niif", "nic", "ifrs",
        "international accounting", "norma internacional",
    ],
}

# Default framework_scope por concepto, cuando la query no da señal.
# Usamos el framework más rico (con más canonical_text cargado) para cada
# concepto — esto reduce falsos refuses en queries genéricas.
CONCEPT_DEFAULT_FRAMEWORK: dict[str, str] = {
    "activo": "NUA",
    "pasivo": "NUA",
    "patrimonio_neto": "RT_16_HISTORIC",
    "ingreso": "RT_16_HISTORIC",
    "gasto": "RT_16_HISTORIC",
    "devengado": "NUA",           # stub; refuse honesto
    "realizacion": "NUA",         # stub; refuse honesto
    "control": "NUA",
}


# ---------- output ----------


@dataclass
class Classification:
    """
    Resultado de clasificar una query.

    Campos nunca cambian de forma (paralelo a la doctrina del REP).
    """
    concept_id: Optional[str]
    framework_scope: Optional[str]
    confidence: str  # "high" | "medium" | "low" | "none"
    matched_concept_keywords: list[str]
    matched_framework_keywords: list[str]
    reason: str

    def to_dict(self) -> dict:
        return asdict(self)


# ---------- helpers ----------


def _normalize(text: str) -> str:
    """
    Lower + strip acentos + colapsa whitespace.
    Mantiene la cadena original accesible por quien quiera reportar matches.
    """
    if not text:
        return ""
    text = text.lower()
    # Remover acentos — NFD descompone, filtramos combining marks
    text = "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _match_keywords(normalized_query: str, keyword_map: dict[str, list[str]]) -> dict[str, list[str]]:
    """
    Retorna {key_id: [keywords matched]} — keys ordenadas por cantidad de match.
    """
    hits: dict[str, list[str]] = {}
    for key_id, kws in keyword_map.items():
        matched_for_key = []
        for kw in kws:
            kw_norm = _normalize(kw)
            if not kw_norm:
                continue
            # Match con word boundaries para tokens cortos; match substring
            # para frases multi-palabra (más tolerante a flexiones cercanas).
            if " " in kw_norm:
                if kw_norm in normalized_query:
                    matched_for_key.append(kw)
            else:
                # Token único: exigir boundary para evitar "pasivo" dentro
                # de "compasivo" u otros superset fortuitos.
                pattern = r"\b" + re.escape(kw_norm) + r"\b"
                if re.search(pattern, normalized_query):
                    matched_for_key.append(kw)
        if matched_for_key:
            hits[key_id] = matched_for_key
    return hits


def _score_concepts(matches: dict[str, list[str]]) -> list[tuple[str, int]]:
    """
    Scoring: frases multi-palabra valen más que tokens individuales.
    Retorna lista [(concept_id, score)] ordenada desc por score.
    """
    scored = []
    for concept_id, matched_kws in matches.items():
        score = 0
        for kw in matched_kws:
            # Multi-word phrases pesan 3; tokens individuales pesan 1.
            score += 3 if " " in kw else 1
        scored.append((concept_id, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored


# ---------- motor de clasificación ----------


def classify_query(query_text: str) -> Classification:
    """
    Clasifica una query en (concept_id, framework_scope, confidence).

    Algoritmo:
        1. Normalizar query.
        2. Matchear concept keywords — seleccionar el de mayor score.
        3. Matchear framework keywords — seleccionar el primero con match.
        4. Si no hay concepto detectado → confidence=none, todo None.
        5. Si hay concepto pero no framework → usar CONCEPT_DEFAULT_FRAMEWORK,
           confidence=medium (no tenemos señal explícita del usuario).
        6. Si hay concepto + framework explícito → confidence=high.
        7. Si concepto con score=1 (una sola keyword débil) → downgrade a low.
    """
    if not query_text or not query_text.strip():
        return Classification(
            concept_id=None,
            framework_scope=None,
            confidence="none",
            matched_concept_keywords=[],
            matched_framework_keywords=[],
            reason="empty_query",
        )

    normalized = _normalize(query_text)

    concept_hits = _match_keywords(normalized, CONCEPT_KEYWORDS)
    framework_hits = _match_keywords(normalized, FRAMEWORK_KEYWORDS)

    if not concept_hits:
        return Classification(
            concept_id=None,
            framework_scope=None,
            confidence="none",
            matched_concept_keywords=[],
            matched_framework_keywords=sum(framework_hits.values(), []),
            reason="no_concept_keyword_matched",
        )

    concept_scores = _score_concepts(concept_hits)
    top_concept, top_score = concept_scores[0]
    top_concept_matches = concept_hits[top_concept]

    # Framework: tomar el primero que haya disparado match.
    chosen_framework = None
    framework_matches_flat = []
    if framework_hits:
        # Si hay más de un framework matched, priorizar el que tenga más matches.
        fw_scored = sorted(
            framework_hits.items(), key=lambda kv: len(kv[1]), reverse=True
        )
        chosen_framework = fw_scored[0][0]
        framework_matches_flat = sum(framework_hits.values(), [])

    # Confidence
    if chosen_framework:
        # Concepto + framework explícito del usuario.
        if top_score >= 3:
            confidence = "high"
            reason = "concept_and_framework_explicit__strong_match"
        else:
            confidence = "medium"
            reason = "concept_weak_but_framework_explicit"
    else:
        chosen_framework = CONCEPT_DEFAULT_FRAMEWORK.get(top_concept)
        if top_score >= 3:
            confidence = "medium"
            reason = "concept_strong__framework_inferred_from_default"
        else:
            confidence = "low"
            reason = "concept_weak_and_framework_inferred"

    return Classification(
        concept_id=top_concept,
        framework_scope=chosen_framework,
        confidence=confidence,
        matched_concept_keywords=top_concept_matches,
        matched_framework_keywords=framework_matches_flat,
        reason=reason,
    )


# ---------- self-test ----------


def _self_test() -> int:
    cases = [
        # (query, expected_concept, expected_framework, expected_confidence_in)
        (
            "¿Qué es un activo bajo la NUA?",
            "activo", "NUA", {"high", "medium"},
        ),
        (
            "Definición de pasivo según Marco Conceptual IASB",
            "pasivo", "IASB", {"high", "medium"},
        ),
        (
            "¿Cómo se compone el patrimonio neto según RT 16?",
            "patrimonio_neto", "RT_16_HISTORIC", {"high", "medium"},
        ),
        (
            "¿El aporte del socio es un ingreso?",
            "ingreso", "RT_16_HISTORIC", {"medium", "low"},  # sin fw explícito
        ),
        (
            "Diferencia entre gasto y distribución de dividendos",
            "gasto", "RT_16_HISTORIC", {"medium", "low"},
        ),
        (
            "Devengado vs percibido",
            "devengado", "NUA", {"medium", "low"},  # default a NUA
        ),
        (
            "¿Cuándo hay control sobre otra entidad?",
            "control", "NUA", {"medium", "low"},  # default NUA
        ),
        (
            "contabilidad???",
            None, None, {"none"},
        ),
        (
            "",
            None, None, {"none"},
        ),
        # Edge: framework explícito sin concepto fuerte → still no concept → none.
        (
            "¿Algo sobre NIIF en general?",
            None, None, {"none"},
        ),
    ]

    failures = []
    for query, exp_concept, exp_framework, exp_conf_set in cases:
        result = classify_query(query)
        ok_concept = result.concept_id == exp_concept
        ok_framework = (result.framework_scope == exp_framework) if exp_concept else True
        ok_conf = result.confidence in exp_conf_set
        if not (ok_concept and ok_framework and ok_conf):
            failures.append({
                "query": query,
                "expected": {
                    "concept": exp_concept,
                    "framework": exp_framework,
                    "confidence_in": sorted(exp_conf_set),
                },
                "got": {
                    "concept": result.concept_id,
                    "framework": result.framework_scope,
                    "confidence": result.confidence,
                    "reason": result.reason,
                },
            })

    if failures:
        print(f"keyword_router — self-test FAILED ({len(failures)}/{len(cases)} cases failing):")
        print(json.dumps(failures, ensure_ascii=False, indent=2))
        return 1

    print(f"keyword_router — self-test PASSED ({len(cases)}/{len(cases)} cases)")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(_self_test())
