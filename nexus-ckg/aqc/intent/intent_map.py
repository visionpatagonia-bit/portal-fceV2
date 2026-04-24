"""
intent_map.py — Mapping intent → (concept_id, framework_scope).

Tabla estática, sin lógica. Cualquier if/elif sobre "cuál concepto" vive acá,
no en el detector ni en el router. Nueva intent → nueva entrada en este dict.
"""

from __future__ import annotations

from dataclasses import dataclass, field


# Identificadores canónicos de intents MVP (P6).
# Si se agregan intents en P7, extender este enum informal + el dict abajo.
INTENT_CASH_TIMING_MISMATCH = "cash_timing_mismatch"
INTENT_VALUE_CHANGE_WITHOUT_SALE = "value_change_without_sale"
INTENT_CAPITALIZATION_DOUBT = "capitalization_doubt"


# Mapping intent → (concept_id, framework_scope).
#   * concept_id: exactamente como aparece en canonical_registry.json
#   * framework_scope: default del intent; el router lo sobreescribe si la
#     query trae señal explícita de framework (IASB / RT_16 / NUA).
INTENT_TO_CONCEPT: dict[str, dict[str, str]] = {
    INTENT_CASH_TIMING_MISMATCH: {
        "concept_id": "devengado",
        "framework_scope": "NUA",
    },
    INTENT_VALUE_CHANGE_WITHOUT_SALE: {
        "concept_id": "realizacion",
        "framework_scope": "RT_16_HISTORIC",
    },
    INTENT_CAPITALIZATION_DOUBT: {
        "concept_id": "activo",
        "framework_scope": "NUA",
    },
}


@dataclass
class IntentMatch:
    """
    Resultado único de la capa intent.

    intent_id       — id canónico (ver constantes arriba).
    concept_id      — derivado de INTENT_TO_CONCEPT.
    framework_scope — default del intent (no sobrescribe señal del usuario).
    triggered_by    — lista de features/frases que activaron el intent
                      (usado para trazabilidad / logging).
    """
    intent_id: str
    concept_id: str
    framework_scope: str
    triggered_by: list[str] = field(default_factory=list)

    @classmethod
    def from_intent_id(cls, intent_id: str, triggered_by: list[str]) -> "IntentMatch":
        mapping = INTENT_TO_CONCEPT[intent_id]
        return cls(
            intent_id=intent_id,
            concept_id=mapping["concept_id"],
            framework_scope=mapping["framework_scope"],
            triggered_by=list(triggered_by),
        )
