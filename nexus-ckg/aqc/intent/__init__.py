"""
aqc.intent — Capa pre-keyword de detección de intents estructurales.

Exports públicos:
    detect_intent(normalized_query) -> Optional[IntentMatch]
    get_last_detection() -> dict          # stats del último detect_intent()
    IntentMatch                           # dataclass del resultado
    INTENT_TO_CONCEPT                     # tabla estática intent_id → (concept, framework)
"""

from .intent_detector import detect_intent, get_last_detection
from .intent_map import INTENT_TO_CONCEPT, IntentMatch

__all__ = [
    "detect_intent",
    "get_last_detection",
    "IntentMatch",
    "INTENT_TO_CONCEPT",
]
