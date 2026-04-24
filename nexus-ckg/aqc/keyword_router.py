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
        # Técnico
        "devengado", "devengamiento", "devengar",
        "percibido", "criterio contable de reconocimiento",
        "hecho sustancial",
        # Coloquial / situacional (Día 5 Ronda 5 — dirigido, multi-palabra)
        # Captura "hay movimiento pero no hay cobro/venta materializada".
        "todavia no vendi", "todavía no vendí", "todavia no cobre", "todavía no cobré",
        "aunque no vendi", "aunque no vendí", "aunque no cobre", "aunque no cobré",
        "aunque no lo cobre", "aunque no lo cobré",
        "sin cobrar todavia", "sin cobrar todavía",
        "sin facturar todavia", "sin facturar todavía",
        "no vendi todavia", "no vendí todavía",
        "no facture todavia", "no facturé todavía",
        "no cobre todavia", "no cobré todavía",
        "no lo cobre todavia", "no lo cobré todavía",
        "pero no lo cobre", "pero no lo cobré",
        "no lo vendi todavia", "no lo vendí todavía",
        "antes de cobrar", "antes de facturar",
        # Situacional extendido — ventas/cobros diferidos (cuotas, consignación)
        "cobra en cuotas", "cobran en cuotas", "cobro en cuotas",
        "venta en cuotas", "ventas en cuotas",
    ],
    "realizacion": [
        "realizacion", "realización", "realizado",
        "resultado no realizado", "resultado realizado",
        # Día 5 Ronda 5 — plural (dirigido)
        "resultados no realizados", "resultados realizados",
    ],
    "control": [
        "control", "controla", "dirigir las actividades relevantes",
        "dirigir actividades relevantes", "participacion en otra entidad",
        "participación en otra entidad", "mandataria",
    ],
    "medicion": [
        "medicion", "medición", "medir", "mediciones contables",
        "criterio de medicion", "criterio de medición",
        "reconocimiento y medicion", "reconocimiento y medición",
        "atributos de medicion", "atributos de medición",
        # Día 5 Ronda 5 — flexión verbal (dirigido; tokens específicos de "medir")
        "medis", "medís", "medimos",
        "como se mide", "cómo se mide",
        "como medis", "cómo medís",
        "como medimos", "cómo medimos",
    ],
    "unidad_medida": [
        "unidad de medida", "moneda homogenea", "moneda homogénea",
        "ajuste por inflacion", "ajuste por inflación",
        "poder adquisitivo", "re-expresion monetaria", "re-expresión monetaria",
    ],
    "prudencia": [
        "prudencia", "prudente", "conservadurismo",
        "actuar con prudencia", "principio de prudencia",
        "cautela contable",
    ],
    "plusvalia_generada_internamente": [
        "plusvalia generada internamente", "plusvalía generada internamente",
        "goodwill interno", "goodwill generado internamente",
        "plusvalia interna", "plusvalía interna",
        "plusvalia autogenerada", "plusvalía autogenerada",
    ],
    "fase_desarrollo_activo_intangible": [
        "fase de desarrollo", "fase desarrollo",
        "activo intangible desarrollado", "desarrollo de intangibles",
        "capitalizar desarrollo", "activar desarrollo",
        "proyecto interno de desarrollo",
    ],
    "fase_investigacion_activo_intangible": [
        "fase de investigacion", "fase de investigación",
        "fase investigacion", "fase investigación",
        "gastos de investigacion", "gastos de investigación",
        "desembolsos de investigacion", "desembolsos de investigación",
        "activar investigacion", "activar investigación",
    ],
    "marca_generada_internamente": [
        "marca generada internamente", "marca autogenerada",
        "marca propia", "marca desarrollada internamente",
        "listas de clientes", "cabeceras de periodicos", "cabeceras de periódicos",
        "denominaciones editoriales",
        # Día 5 Ronda 5 — paráfrasis (dirigido, multi-palabra)
        "marca que crea", "marca que hace", "marca que desarrolla",
        "una marca que crea", "una marca que hace",
        "crear una marca", "crea una marca", "crean una marca",
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
    "devengado": "NUA",                         # Día 3: upgraded a verified_against_authoritative_secondary
    # Día 5 Ronda 6 — Fix consistency del contrato:
    # 'realizacion' tiene 3 frameworks en stub (sin canonical_text).
    # Antes: default NUA como "canary de simetría" (refuse downstream garantizado).
    # Problema: el contrato del default debe apuntar al framework donde el anchor
    # AUTORITATIVO vive (o vivirá). Para realizacion, ese framework es el
    # argentino (RT 16/17), no NUA. Mantenerlo en NUA introducía un mismatch
    # silencioso que contaminaba framework_accuracy y expectations futuras.
    # El stub sigue → downstream REP sigue refusando correctamente (INV-1 intacto).
    "realizacion": "RT_16_HISTORIC",
    "control": "NUA",
    "medicion": "RT_16_HISTORIC",               # único framework con texto verificado
    "unidad_medida": "RT_16_HISTORIC",          # único framework con texto verificado
    "prudencia": "RT_16_HISTORIC",              # caso adversarial: solo RT 16 tiene literal
    "plusvalia_generada_internamente": "IASB",  # NIC 38 §48 es el único anclaje
    "fase_desarrollo_activo_intangible": "IASB",   # NIC 38 §57 verified_against_pdf
    "fase_investigacion_activo_intangible": "IASB",  # NIC 38 §54 verified_against_pdf
    "marca_generada_internamente": "IASB",  # NIC 38 §63 verified_against_pdf
}


# ---------- reglas de desambiguación (Día 5 Ronda 5 — P1 auditor) ----------
#
# Schema: {id, if_concepts: set, prefer: concept_id, when_query_contains_any: [str]}
#
# Algoritmo (ver _disambiguate):
#   1. Primera regla cuyo if_concepts ⊆ hits  AND  algún trigger ∈ query gana.
#   2. Si ninguna regla matchea completamente → refuse (ver classify_query).
#
# Regla de oro: "Si hay empate sin regla → refuse, no guess".
# Esto cierra P1 del auditor (desambiguación inexistente, empates resueltos
# por orden de dict invalidaban auditabilidad externa).
#
# §9.5 compliance: reglas determinísticas explícitas — no scoring numérico,
# no fuzzy matching, no embeddings. Modelado semántico manual.
AQC_DISAMBIGUATION_RULES: list[dict] = [
    # R1 — marca_generada_internamente > activo
    #   Evita que "marca que crea una empresa se puede contar como activo" rutee a 'activo'.
    {
        "id": "marca_over_activo",
        "if_concepts": {"marca_generada_internamente", "activo"},
        "prefer": "marca_generada_internamente",
        "when_query_contains_any": [
            "marca", "marca propia", "marca que crea", "marca que hace",
            "marca que desarrolla", "marca generada", "marca autogenerada",
        ],
    },
    # R2 — plusvalia_generada_internamente > activo
    {
        "id": "plusvalia_over_activo",
        "if_concepts": {"plusvalia_generada_internamente", "activo"},
        "prefer": "plusvalia_generada_internamente",
        "when_query_contains_any": [
            "plusvalia", "plusvalía", "goodwill", "llave de negocio", "valor llave",
        ],
    },
    # R3 — fase_desarrollo > activo
    {
        "id": "fase_desarrollo_over_activo",
        "if_concepts": {"fase_desarrollo_activo_intangible", "activo"},
        "prefer": "fase_desarrollo_activo_intangible",
        "when_query_contains_any": [
            "fase de desarrollo", "fase desarrollo",
            "capitalizar desarrollo", "activar desarrollo",
            "proyecto de desarrollo", "desarrollo interno",
        ],
    },
    # R4 — fase_investigacion > activo
    {
        "id": "fase_investigacion_over_activo",
        "if_concepts": {"fase_investigacion_activo_intangible", "activo"},
        "prefer": "fase_investigacion_activo_intangible",
        "when_query_contains_any": [
            "fase de investigacion", "fase de investigación",
            "gastos de investigacion", "gastos de investigación",
            "activar investigacion", "activar investigación",
        ],
    },
    # R5 — activo > gasto (capitalización de costos)
    #   a1/a4/s4: "pasa de gasto a activo", "compro algo para vender despues",
    #              "deja de ser gasto y pasa a activo".
    {
        "id": "activo_over_gasto_capitalization",
        "if_concepts": {"activo", "gasto"},
        "prefer": "activo",
        "when_query_contains_any": [
            "pasa de gasto a activo", "de gasto a activo", "gasto a activo",
            "pasa a activo", "pasa a ser activo",
            "deja de ser gasto", "deja de ser un gasto",
            "capitalizar", "capitalizacion", "capitalización",
            "reconocer como activo", "convertir en activo",
            "comprar para vender", "para vender despues", "para vender después",
            "bien de cambio", "mercaderia", "mercadería",
        ],
    },
    # R6 — devengado > ingreso (situacional: "todavia no hubo venta/cobro")
    #   s5/s10/a8: "es ingreso aunque no vendi todavía".
    {
        "id": "devengado_over_ingreso",
        "if_concepts": {"devengado", "ingreso"},
        "prefer": "devengado",
        "when_query_contains_any": [
            "todavia no", "todavía no",
            "aunque no", "aunque todavia", "aunque todavía",
            "sin cobrar", "sin facturar", "sin haber cobrado",
            "no cobre", "no cobré", "no vendi", "no vendí",
            "no facture", "no facturé",
            "antes de cobrar", "antes de facturar",
            "pero no lo cobre", "pero no lo cobré",
            "pero no lo vendi", "pero no lo vendí",
        ],
    },
    # R7 — gasto > patrimonio_neto (efecto del gasto sobre el patrimonio)
    #   a5/a9: "el patrimonio cambia si gasto plata", "el gasto siempre baja el patrimonio".
    {
        "id": "gasto_over_patrimonio",
        "if_concepts": {"gasto", "patrimonio_neto"},
        "prefer": "gasto",
        "when_query_contains_any": [
            "baja el patrimonio", "baja al patrimonio",
            "afecta el patrimonio", "afecta al patrimonio",
            "cambia el patrimonio", "cambia al patrimonio",
            "disminuye el patrimonio", "disminuye al patrimonio",
            "reduce el patrimonio", "reduce al patrimonio",
            "si gasto", "al gastar", "cuando gasto", "porque gasto",
            "cada vez que gasto", "el gasto siempre",
            "siempre baja el patrimonio",
        ],
    },
    # R8 — realizacion > patrimonio_neto (resultados no realizados)
    #   s9: "los resultados no realizados van a patrimonio".
    {
        "id": "realizacion_over_patrimonio",
        "if_concepts": {"realizacion", "patrimonio_neto"},
        "prefer": "realizacion",
        "when_query_contains_any": [
            "resultado no realizado", "resultados no realizados",
            "resultado realizado", "resultados realizados",
            "no realizados van", "realizados van",
        ],
    },
]


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

    NOTA DÍA 5 RONDA 5: el score YA NO resuelve empates de ruteo — solo
    informa el confidence tag. Empates los resuelve _disambiguate() con
    reglas explícitas; si no hay regla, se refusa (no guess).
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


def _disambiguate(
    concept_ids: list[str],
    normalized_query: str,
) -> tuple[Optional[str], Optional[str]]:
    """
    Aplica AQC_DISAMBIGUATION_RULES sobre hits ambiguos (≥2 conceptos).

    Retorna:
        (concept_id, rule_id) si alguna regla matchea COMPLETAMENTE
          (if_concepts ⊆ hits  AND  algún trigger ∈ query).
        (None, None) si ninguna regla matchea completamente
          → caller debe refusar (no guess).

    La primera regla que matchea completamente gana. Se itera en el orden
    declarado de AQC_DISAMBIGUATION_RULES (más específicas primero).
    """
    concept_set = set(concept_ids)
    for rule in AQC_DISAMBIGUATION_RULES:
        if not rule["if_concepts"].issubset(concept_set):
            continue
        for trigger in rule["when_query_contains_any"]:
            trigger_norm = _normalize(trigger)
            if trigger_norm and trigger_norm in normalized_query:
                return rule["prefer"], rule["id"]
    return None, None


# ---------- motor de clasificación ----------


def classify_query(query_text: str) -> Classification:
    """
    Clasifica una query en (concept_id, framework_scope, confidence).

    Algoritmo (Día 5 Ronda 5 — 4 ramas explícitas, deterministas):
        0 matches          → refuse (concept=None, confidence=none).
        1 match            → route directo a ese concepto.
        ≥2 matches + regla → route al 'prefer' de la regla.
        ≥2 matches sin reg → refuse (NO guess, NO orden de dict).

    El framework se resuelve como antes:
        * Si la query trae señal explícita (IASB/RT_16/NUA) → ese.
        * Sino → CONCEPT_DEFAULT_FRAMEWORK[concept_id].

    Confidence tagging:
        * high   — concept match fuerte + framework explícito.
        * medium — concept match fuerte + framework inferido, ó
                   concept débil + framework explícito.
        * low    — concept débil + framework inferido.
        * none   — refuse (0 matches ó ambigüedad sin regla).
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

    # Rama 1: 0 matches → refuse.
    if not concept_hits:
        return Classification(
            concept_id=None,
            framework_scope=None,
            confidence="none",
            matched_concept_keywords=[],
            matched_framework_keywords=sum(framework_hits.values(), []),
            reason="no_concept_keyword_matched",
        )

    # Rama 2 / 3 / 4: decidir concepto según cantidad de hits.
    rule_applied: Optional[str] = None
    if len(concept_hits) == 1:
        top_concept = next(iter(concept_hits))
    else:
        # ≥2 matches — requiere desambiguación explícita.
        chosen, rule_id = _disambiguate(list(concept_hits.keys()), normalized)
        if chosen is None:
            # Rama 4: empate sin regla → refuse (no guess).
            return Classification(
                concept_id=None,
                framework_scope=None,
                confidence="none",
                matched_concept_keywords=sum(concept_hits.values(), []),
                matched_framework_keywords=sum(framework_hits.values(), []),
                reason=(
                    "ambiguous_no_rule__concepts="
                    + ",".join(sorted(concept_hits.keys()))
                ),
            )
        top_concept = chosen
        rule_applied = rule_id

    top_concept_matches = concept_hits[top_concept]

    # Score del concepto elegido → alimenta confidence (no el ruteo).
    concept_scores = _score_concepts(concept_hits)
    top_score = next(s for c, s in concept_scores if c == top_concept)

    # Framework: señal explícita del usuario prevalece; sino default del concepto.
    chosen_framework = None
    framework_matches_flat: list[str] = []
    if framework_hits:
        fw_scored = sorted(
            framework_hits.items(), key=lambda kv: len(kv[1]), reverse=True
        )
        chosen_framework = fw_scored[0][0]
        framework_matches_flat = sum(framework_hits.values(), [])

    # Confidence
    if chosen_framework:
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

    if rule_applied:
        reason = f"{reason}__disambiguated_by={rule_applied}"

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
        # Día 3 — 4 conceptos nuevos
        (
            "¿Qué criterios de medición contable reconoce RT 16?",
            "medicion", "RT_16_HISTORIC", {"high", "medium"},
        ),
        (
            "¿Qué dice RT 16 sobre unidad de medida y moneda homogénea?",
            "unidad_medida", "RT_16_HISTORIC", {"high", "medium"},
        ),
        (
            "¿Qué dice RT 16 sobre prudencia?",
            "prudencia", "RT_16_HISTORIC", {"high", "medium"},
        ),
        (
            "¿Se puede reconocer la plusvalía generada internamente como activo bajo NIC 38?",
            "plusvalia_generada_internamente", "IASB", {"high", "medium"},
        ),
        # Día 4 — 3 conceptos nuevos (intangibles NIC 38)
        (
            "¿Cuándo puede capitalizarse la fase de desarrollo de un proyecto interno?",
            "fase_desarrollo_activo_intangible", "IASB", {"high", "medium"},
        ),
        (
            "¿Los desembolsos en fase de investigación se pueden activar?",
            "fase_investigacion_activo_intangible", "IASB", {"high", "medium"},
        ),
        (
            "¿Se puede reconocer una marca generada internamente como activo intangible?",
            "marca_generada_internamente", "IASB", {"high", "medium"},
        ),
        # ---------- Día 5 Ronda 5 — casos de desambiguación (P1 + comportamiento refuse-sin-regla) ----------
        # R5: activo > gasto (capitalización) — espejo de a1 del auditor.
        (
            "profe cuando algo pasa de gasto a activo o eso no existe?",
            "activo", "NUA", {"medium", "low"},
        ),
        # R5: activo > gasto (mercadería) — espejo de a4.
        (
            "si compro algo para vender despues eso es gasto o activo?",
            "activo", "NUA", {"medium", "low"},
        ),
        # R1: marca > activo — espejo de a2.
        (
            "una marca que crea una empresa se puede contar como activo o no?",
            "marca_generada_internamente", "IASB", {"medium", "low"},
        ),
        # R7: gasto > patrimonio — espejo de a5.
        (
            "porque dicen que el patrimonio cambia si gasto plata si la plata ya la tenia?",
            "gasto", "RT_16_HISTORIC", {"medium", "low"},
        ),
        # R7: gasto > patrimonio — espejo de a9.
        (
            "el gasto siempre baja el patrimonio o hay excepciones?",
            "gasto", "RT_16_HISTORIC", {"medium", "low"},
        ),
        # R6: devengado > ingreso — espejo de a8.
        (
            "si algo me da plata pero no lo vendi todavia es ingreso igual?",
            "devengado", "NUA", {"medium", "low"},
        ),
        # Flexión verbal (medicion) — espejo de s8 del synthetic.
        (
            "¿cómo medís un activo cuando no hay mercado?",
            # Acá hits={activo, medicion}, pero NO hay regla activo↔medicion →
            # debe refusar, no rutear por orden de dict.
            None, None, {"none"},
        ),
        # Plural (realizacion) — espejo de s9.
        # Post-Ronda 6: default alineado a RT_16_HISTORIC (tradición argentina).
        (
            "los resultados no realizados van al resultado del ejercicio?",
            "realizacion", "RT_16_HISTORIC", {"medium", "low"},
        ),
        # Ambigüedad sin regla aplicable → refuse.
        # "ingreso y pasivo" → hits ambos, no hay regla definida → refuse.
        (
            "la diferencia entre ingreso y pasivo cómo se arma?",
            None, None, {"none"},
        ),
        # Regla aplicable pero trigger NO en query → el auditor pidió:
        # "si regla existe pero triggers no están → refuse, no azar".
        # Query con {gasto, patrimonio_neto} pero sin ningún trigger de R7.
        (
            "explicame gasto y patrimonio neto por separado",
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
