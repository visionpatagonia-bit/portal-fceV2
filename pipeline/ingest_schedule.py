#!/usr/bin/env python3
"""
NEXUS Pipeline — ingest_schedule.py
====================================

Lee `horarios.json` y genera `kb/schedule_kb.json` con entries pre-computadas
para preguntas frecuentes sobre horarios.

DECISIÓN TÉCNICA CLAVE:
    No usa LLM. El schedule ya es estructurado → generación 100% determinista.
    Cero alucinación, cero latencia, cero costo. Este archivo es la
    respuesta definitiva al bug del PATCH 10.4 (Administración omitida,
    PRÓXIMA CLASE duplicada) — eliminamos la variabilidad del LLM en
    runtime reemplazándolo por templates + data.

Mistral SÍ se usa después para procesar PDFs (ingest_pdf.py).
Para estructurados: Python determinista. Para no-estructurados: Mistral.

Uso:
    python pipeline/ingest_schedule.py
    python pipeline/ingest_schedule.py --verbose

Entrada:
    horarios.json

Salida:
    kb/schedule_kb.json   (deploy-ready)
    kb/manifest.json      (actualizado con hash de horarios.json)
"""

import json
import hashlib
import sys
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Import config (permite correr desde cualquier cwd)
sys.path.insert(0, str(Path(__file__).resolve().parent))
from config import (
    HORARIOS_JSON,
    KB_DIR,
    SCHEDULE_KB_FILE,
    MANIFEST_FILE,
    KB_SCHEMA_VERSION,
    DOMAIN,
)

# ────────────────────────────────────────────────────────────────────────
#  Patterns — variantes de pregunta que el runtime matcher reconocerá
# ────────────────────────────────────────────────────────────────────────

PATTERNS_TODAY = [
    "qué clases tengo hoy",
    "que clases tengo hoy",
    "clases hoy",
    "mi agenda hoy",
    "qué tengo hoy",
    "que tengo hoy",
    "horarios hoy",
    "horarios de hoy",
    "tengo clase hoy",
    "cursada hoy",
    "agenda hoy",
]

PATTERNS_TOMORROW = [
    "qué clases tengo mañana",
    "que clases tengo mañana",
    "clases mañana",
    "mi agenda mañana",
    "qué tengo mañana",
    "que tengo manana",
    "horarios mañana",
    "tengo clase mañana",
    "cursada mañana",
    "agenda mañana",
]

PATTERNS_NEXT_CLASS = [
    "cuál es mi próxima clase",
    "cual es mi proxima clase",
    "próxima clase",
    "proxima clase",
    "siguiente clase",
    "cuándo tengo la próxima clase",
    "cuando es mi siguiente clase",
    "qué clase tengo ahora",
    "qué tengo ahora",
]

PATTERNS_MATERIA_TIME = [
    # template: "a qué hora es {materia}"
    "a qué hora es {materia}",
    "a que hora es {materia}",
    "horario de {materia}",
    "cuándo tengo {materia}",
    "cuando tengo {materia}",
    "cuándo es {materia}",
    "qué días tengo {materia}",
    "que dias tengo {materia}",
    "días de {materia}",
]

PATTERNS_WEEK_OVERVIEW = [
    "horarios de la semana",
    "mi agenda semanal",
    "qué tengo esta semana",
    "que tengo esta semana",
    "cursada de la semana",
    "agenda semanal",
    "horarios",
    "mi horario",
    "todos mis horarios",
]


# ────────────────────────────────────────────────────────────────────────
#  Utilidades
# ────────────────────────────────────────────────────────────────────────

DAY_ORDER = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


def _file_hash(path: Path) -> str:
    """SHA256 para detectar cambios en horarios.json."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def _normalize_day(day: str) -> str:
    return (day or "").lower().strip()


def _load_horarios() -> dict:
    if not HORARIOS_JSON.exists():
        raise FileNotFoundError(f"No se encontró {HORARIOS_JSON}")
    with open(HORARIOS_JSON, encoding="utf-8") as f:
        return json.load(f)


def _classes_by_day(horarios: dict) -> dict:
    """
    Transpone la estructura: agrupa todas las clases por día.
    Input:  { "horarios": [{ "materia": "X", "clases": [{dia, desde, hasta, aula}] }] }
    Output: { "lunes": [{materia, desde, hasta, aula}, ...], "martes": [...] }
    """
    by_day = {d: [] for d in DAY_ORDER}
    for materia_entry in horarios.get("horarios", []):
        materia = materia_entry.get("materia", "")
        for clase in materia_entry.get("clases", []):
            day = _normalize_day(clase.get("dia"))
            if day in by_day:
                by_day[day].append({
                    "materia": materia,
                    "desde": clase.get("desde", ""),
                    "hasta": clase.get("hasta", ""),
                    "aula": clase.get("aula", "s/aula"),
                })
    # Ordenar cada día por hora de inicio
    for day in by_day:
        by_day[day].sort(key=lambda c: c.get("desde", "99:99"))
    return by_day


def _materias_unique(horarios: dict) -> list:
    return [m.get("materia", "") for m in horarios.get("horarios", []) if m.get("materia")]


# ────────────────────────────────────────────────────────────────────────
#  Generadores de entries
# ────────────────────────────────────────────────────────────────────────

def build_entry_today() -> dict:
    """Entry de tipo schedule_today — resuelto en runtime usando horarios.json."""
    return {
        "id": "sched_today",
        "type": "schedule_today",
        "patterns": PATTERNS_TODAY,
        "answer_template": (
            "Hoy ({{dayName}}) tenés {{count}} clase{{sPlural}}:\n"
            "{{classList}}"
        ),
        "template_vars": ["dayName", "count", "sPlural", "classList"],
        "runtime_source": "horarios.json",
        "runtime_fn": "getClassesForDayOffset(0)",
        "empty_fallback": "Hoy ({{dayName}}) no tenés clases. 🎉",
        "validated": True,
        "confidence_threshold": 0.85,
    }


def build_entry_tomorrow() -> dict:
    return {
        "id": "sched_tomorrow",
        "type": "schedule_tomorrow",
        "patterns": PATTERNS_TOMORROW,
        "answer_template": (
            "Mañana ({{dayName}}) tenés {{count}} clase{{sPlural}}:\n"
            "{{classList}}"
        ),
        "template_vars": ["dayName", "count", "sPlural", "classList"],
        "runtime_source": "horarios.json",
        "runtime_fn": "getClassesForDayOffset(1)",
        "empty_fallback": "Mañana ({{dayName}}) no tenés clases. Podés descansar. 😴",
        "validated": True,
        "confidence_threshold": 0.85,
    }


def build_entry_next_class() -> dict:
    return {
        "id": "sched_next_class",
        "type": "schedule_next",
        "patterns": PATTERNS_NEXT_CLASS,
        "answer_template": (
            "Tu próxima clase es {{materia}} {{whenDescr}} "
            "a las {{desde}} hs en {{aula}}."
        ),
        "template_vars": ["materia", "whenDescr", "desde", "aula"],
        "runtime_source": "horarios.json",
        "runtime_fn": "getNextClass()",
        "empty_fallback": "No encontré clases próximas en tu agenda.",
        "validated": True,
        "confidence_threshold": 0.85,
    }


def build_entries_materia_time(materias: list, by_day: dict) -> list:
    """Una entry por materia — pregunta: '¿a qué hora es X?'."""
    entries = []
    for materia in materias:
        # Buscar todos los días+horas donde aparece esta materia
        sessions = []
        for day, classes in by_day.items():
            for c in classes:
                if c["materia"].lower() == materia.lower():
                    sessions.append({
                        "dia": day,
                        "desde": c["desde"],
                        "hasta": c["hasta"],
                        "aula": c["aula"],
                    })

        if not sessions:
            continue

        # Render de lista de sesiones
        lines = [
            f"  • {s['dia'].capitalize()}: {s['desde']}–{s['hasta']} ({s['aula']})"
            for s in sessions
        ]
        answer = f"{materia} se cursa:\n" + "\n".join(lines)

        # Patterns con materia sustituida
        patterns = [p.replace("{materia}", materia.lower()) for p in PATTERNS_MATERIA_TIME]
        # Capitalizada también
        patterns += [p.replace("{materia}", materia) for p in PATTERNS_MATERIA_TIME]

        entries.append({
            "id": f"sched_materia_{materia.lower().replace(' ', '_').replace('ó','o').replace('é','e').replace('í','i').replace('á','a').replace('ú','u')}",
            "type": "schedule_materia",
            "materia": materia,
            "patterns": patterns,
            "answer_full": answer,
            "answer_data": {"sessions": sessions},
            "validated": True,
            "confidence_threshold": 0.80,
        })
    return entries


def build_entry_week_overview(by_day: dict) -> dict:
    """Resumen semanal completo."""
    lines = []
    for day in DAY_ORDER:
        classes = by_day.get(day, [])
        if not classes:
            continue
        lines.append(f"**{day.capitalize()}**:")
        for c in classes:
            lines.append(f"  • {c['materia']}: {c['desde']}–{c['hasta']} ({c['aula']})")
    overview = "\n".join(lines) if lines else "Sin clases cargadas esta semana."

    return {
        "id": "sched_week_overview",
        "type": "schedule_week",
        "patterns": PATTERNS_WEEK_OVERVIEW,
        "answer_full": overview,
        "validated": True,
        "confidence_threshold": 0.75,
    }


# ────────────────────────────────────────────────────────────────────────
#  Manifest (cache invalidation)
# ────────────────────────────────────────────────────────────────────────

def update_manifest(hash_horarios: str):
    """Actualiza manifest.json con el hash actual de horarios.json."""
    manifest = {}
    if MANIFEST_FILE.exists():
        try:
            with open(MANIFEST_FILE, encoding="utf-8") as f:
                manifest = json.load(f)
        except Exception:
            manifest = {}

    manifest.setdefault("files_hash", {})
    manifest["files_hash"]["horarios.json"] = f"sha256:{hash_horarios}"
    manifest["last_run_schedule"] = datetime.now(timezone.utc).isoformat()
    manifest["domain"] = DOMAIN
    manifest["schema_version"] = KB_SCHEMA_VERSION

    KB_DIR.mkdir(exist_ok=True, parents=True)
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)


# ────────────────────────────────────────────────────────────────────────
#  Main
# ────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Genera schedule_kb.json determinista")
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    print("\n  NEXUS · ingest_schedule.py")
    print("  ──────────────────────────────────────────────")

    # 1. Cargar horarios
    horarios = _load_horarios()
    by_day   = _classes_by_day(horarios)
    materias = _materias_unique(horarios)
    hash_h   = _file_hash(HORARIOS_JSON)

    if args.verbose:
        print(f"  Cuatrimestre: {horarios.get('cuatrimestre', '?')}")
        print(f"  Materias encontradas: {len(materias)} → {', '.join(materias)}")
        print(f"  Días con clases: {sum(1 for d in by_day if by_day[d])}")

    # 2. Generar entries
    entries = []
    entries.append(build_entry_today())
    entries.append(build_entry_tomorrow())
    entries.append(build_entry_next_class())
    entries.extend(build_entries_materia_time(materias, by_day))
    entries.append(build_entry_week_overview(by_day))

    # 3. Armar KB
    kb = {
        "version": KB_SCHEMA_VERSION,
        "domain": DOMAIN,
        "type": "schedule",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_file": "horarios.json",
        "source_hash": f"sha256:{hash_h}",
        "generator": "ingest_schedule.py (deterministic, no LLM)",
        "entries": entries,
    }

    # 4. Escribir
    KB_DIR.mkdir(exist_ok=True, parents=True)
    with open(SCHEDULE_KB_FILE, "w", encoding="utf-8") as f:
        json.dump(kb, f, indent=2, ensure_ascii=False)

    # 5. Update manifest
    update_manifest(hash_h)

    # 6. Resumen
    size_kb = SCHEDULE_KB_FILE.stat().st_size / 1024
    print(f"  ✓ {len(entries)} entries generadas")
    print(f"  ✓ Output: {SCHEDULE_KB_FILE.relative_to(SCHEDULE_KB_FILE.parent.parent)} ({size_kb:.1f} KB)")
    print(f"  ✓ Manifest actualizado")
    print(f"  ✓ Hash horarios: {hash_h[:16]}...")
    print("  ──────────────────────────────────────────────\n")


if __name__ == "__main__":
    main()
