"""
DEPRECATED — este módulo fue reemplazado por el paquete aqc.intent/.

Refactor P6R2 (auditor Día 5, Ronda 2):
    * aqc/intent/intent_map.py        — INTENT_TO_CONCEPT + IntentMatch
    * aqc/intent/intent_patterns.py   — VERB_NORMALIZATION + marcadores
    * aqc/intent/intent_detector.py   — detect_intent + conflict check

Cualquier import de `aqc.intent_layer` es legacy y debe migrarse a `aqc.intent`.
Se deja este stub (en vez de borrar el archivo) para que cualquier path viejo
reviente con un mensaje claro en lugar de resolver silenciosamente a la versión
vieja.
"""

raise ImportError(
    "aqc.intent_layer fue reemplazado por el paquete aqc.intent. "
    "Importá desde `from aqc.intent import detect_intent, get_last_detection, IntentMatch`."
)
