"""
NEXUS Pipeline — Configuración central

Principio: toda constante del pipeline vive acá. Ningún script hardcodea paths.
Modularidad: cambiar `DOMAIN` permite reutilizar el pipeline para gym.
"""

from pathlib import Path

# ─── Dominio ────────────────────────────────────────────────────────────
# Posibles valores: "nexus_academic" | "gym_fitness"
# Determina qué prompt usar + qué validator aplicar.
DOMAIN = "nexus_academic"

# ─── Paths (raíz del proyecto) ──────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent

MATERIALES_DIR = PROJECT_ROOT / "Materiales"        # input (watched)
KB_DIR         = PROJECT_ROOT / "kb"                # output (deploy-ready)
PROMPTS_DIR    = PROJECT_ROOT / "pipeline" / "prompts"

HORARIOS_JSON     = PROJECT_ROOT / "horarios.json"
MATERIALES_JSON   = PROJECT_ROOT / "materiales.json"

# ─── Outputs del pipeline ───────────────────────────────────────────────
KB_FILE           = KB_DIR / "knowledge_base.json"
SCHEDULE_KB_FILE  = KB_DIR / "schedule_kb.json"
MANIFEST_FILE     = KB_DIR / "manifest.json"
QA_CACHE_FILE     = KB_DIR / "qa_cache.json"
PENDING_QUESTIONS = KB_DIR / "pending_questions.json"

# ─── Modelos Ollama ─────────────────────────────────────────────────────
OLLAMA_BASE_URL = "http://localhost:11434"
MISTRAL_MODEL   = "mistral:7b-instruct-q4_K_M"
LLAMA_MODEL     = "llama3.2:3b"

# Timeouts (segundos) — Mistral genera entries largas, Llama es solo rewrite
MISTRAL_TIMEOUT = 180
LLAMA_TIMEOUT   = 30

# ─── Calidad ────────────────────────────────────────────────────────────
# Thresholds para validator local. Entries que fallan → validated: false.
MIN_ANSWER_LENGTH_CHARS = 80
MIN_PATTERNS_PER_ENTRY  = 2
REQUIRE_SOURCE_REFS_FOR = {"material_concept", "material_example"}

# Frases prohibidas en respuestas (detectan alucinación o evasión)
FORBIDDEN_PHRASES = [
    "como modelo de lenguaje",
    "como ia",
    "no tengo información",
    "no tengo acceso",
    "no puedo ayudarte",
    "lo siento, pero",
    "en general, depende",
    "típicamente",  # sin especificar
]

# ─── KB Schema version ──────────────────────────────────────────────────
KB_SCHEMA_VERSION = "1.0"

# ─── Runtime matcher thresholds (ref. para docs, no ejecuta) ───────────
MATCH_CONFIDENCE_HIT       = 0.85  # HIT directo, render template
MATCH_CONFIDENCE_TENTATIVE = 0.60  # HIT tentativo, Llama re-redacta
# Por debajo → MISS, cae a fallback

# ─── Watcher ────────────────────────────────────────────────────────────
WATCHER_INTERVAL_SECONDS = 300    # 5 min
WATCHER_LOCKFILE = KB_DIR / ".watcher.lock"
