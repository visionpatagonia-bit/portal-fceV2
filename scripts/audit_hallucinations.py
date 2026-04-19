#!/usr/bin/env python3
"""
scripts/audit_hallucinations.py — KB quality audit

Analiza kb/knowledge_base.json con heurísticas para detectar entries
potencialmente alucinadas por Mistral durante la generación offline.

Heurísticas aplicadas:
    H1  cross-domain leak — materia Sociales menciona conceptos contables
        (activo, pasivo, patrimonio, asiento, débito); materia
        Administración menciona contabilidad, partida doble, etc.
    H2  generic ID — ID matching patrón `{X}_concepto_{N}` o
        `bourdieu_concepto_{N}` sugiere duplicado semántico que el
        validator dejó pasar.
    H3  template patterns only — todos los patterns responden al molde
        "qué es X / definición de X / explicame X / cómo se define X",
        sin variantes ni mención al autor. Indica generación formulaica
        que no sobrevive queries naturales ("según Bourdieu...").
    H4  missing author — entry de Sociales U3 que no menciona "Bourdieu"
        en ningún pattern ni en answer_full (cuando Unidad III se basa
        exclusivamente en su texto). Idem Admin → "Chiavenato".
    H5  short answer — answer_full < 150 chars sugiere contenido
        esquelético, típico de fallos de Mistral con chunks pobres.
    H6  prohibited phrases — "no tengo información", "consulta al
        profesor", "revisa el material" — frases que el validator
        debería haber rechazado.
    H7  typo hallucination — ID del entry (prefijo antes de `_concepto`)
        está a distancia Levenshtein ≤2 de un término común del dominio
        SIN coincidir exactamente. Ej: `marcado_concepto` (typo de
        "mercado"). Riesgo: match fuzzy en queries naturales (Levenshtein
        runtime matcha 0.94 para "qué es el mercado" vs "qué es el marcado").
        Descubierto empíricamente post-demo el 19/4/2026.

Output:
    Reporte markdown en stdout, o --out FILE para guardarlo.
    Formato: entries agrupadas por severidad (alta / media / baja),
    con breakdown por heurística. Cada entry flaggeada incluye ID,
    materia, heurísticas gatilladas, y preview de los primeros 120
    chars del answer_full.

Uso:
    python scripts/audit_hallucinations.py
    python scripts/audit_hallucinations.py --out HALLUCINATION_AUDIT.md
    python scripts/audit_hallucinations.py --only Sociales
    python scripts/audit_hallucinations.py --min-severity medium

Notas:
    Este es un reporte DIAGNÓSTICO — no modifica el KB. Post-demo,
    las entries de severidad alta deberían purgarse o regenerarse con
    validator más estricto (ver Fase 2.5 en NEXUS_HYBRID_ARCHITECTURE_v1.2.md).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from collections import defaultdict

# Fase 6.1 — primitivas compartidas con pipeline/validator.py.
# Agregamos pipeline/ al sys.path para compartir _shared.py sin convertir
# pipeline en package (cambio invasivo que rompería scripts existentes).
_PIPELINE_DIR = Path(__file__).resolve().parent.parent / "pipeline"
if str(_PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(_PIPELINE_DIR))

from _shared import (  # noqa: E402  (path setup necesario antes del import)
    COMMON_TERMS,
    LEV_THRESHOLD as H7_LEV_THRESHOLD,
    levenshtein as _levenshtein,
    strip_accents as _strip_accents,
)

# ── Heurísticas ──────────────────────────────────────────────────────

CROSS_DOMAIN_LEAKS = {
    "Sociales": [
        "activo", "pasivo", "patrimonio neto", "contabilidad",
        "ecuación contable", "partida doble", "asiento contable",
        "débito", "crédito", "cuenta", "balance"
    ],
    "Administración": [
        "contabilid", "activo", "pasivo", "patrimonio", "asiento",
        "débito", "crédito", "partida doble", "balance general"
    ],
    "Contabilidad": [
        "bourdieu", "weber", "foucault", "marxismo", "clase social",
        "violencia simbólica", "categoría estatal"
    ],
}

GENERIC_ID_RE = re.compile(
    r"^([a-z_]+)_concepto_(\d+)$|^bourdieu_concepto(_\d+)?$",
    re.IGNORECASE
)

TEMPLATE_PATTERNS_RE = re.compile(
    r"^(qué es|que es|definición de|definicion de|explicame|cómo se define|como se define)\s+",
    re.IGNORECASE
)

AUTHOR_BY_MATERIA = {
    # Para unidades específicas; clave simple por materia para heurística ligera.
    "Sociales": ["bourdieu"],
    "Administración": ["chiavenato"],
}

PROHIBITED_PHRASES = [
    "no tengo información",
    "no tengo informacion",
    "consulta al profesor",
    "revisa el material",
    "no puedo responder",
    "lo siento, no",
]

SHORT_ANSWER_THRESHOLD = 150

# H7 — términos frecuentes del corpus multi-materia viven en pipeline/_shared.py
# (single source of truth con validator.py S5). Ver import al tope del archivo.


# ── Audit engine ─────────────────────────────────────────────────────

def _lower(s: str) -> str:
    return (s or "").lower()


def _check_cross_domain(entry: dict) -> tuple[bool, list[str]]:
    materia = entry.get("materia", "")
    leaks = CROSS_DOMAIN_LEAKS.get(materia, [])
    if not leaks:
        return False, []
    blob = _lower(entry.get("answer_full", "") + " " + " ".join(entry.get("patterns", [])))
    hits = [k for k in leaks if k in blob]
    return len(hits) > 0, hits


def _check_generic_id(entry: dict) -> bool:
    return bool(GENERIC_ID_RE.match(entry.get("id", "")))


def _check_template_patterns(entry: dict) -> bool:
    patterns = entry.get("patterns", [])
    if len(patterns) < 2:
        return False
    template_hits = sum(1 for p in patterns if TEMPLATE_PATTERNS_RE.match(p))
    return template_hits == len(patterns)


def _check_missing_author(entry: dict) -> tuple[bool, list[str]]:
    materia = entry.get("materia", "")
    expected_authors = AUTHOR_BY_MATERIA.get(materia, [])
    if not expected_authors:
        return False, []
    blob = _lower(
        entry.get("answer_full", "") + " "
        + " ".join(entry.get("patterns", [])) + " "
        + " ".join(entry.get("source_refs", []))
    )
    missing = [a for a in expected_authors if a not in blob]
    # Solo flaggeamos si la entry NO es manual (esas ya sabemos que están limpias)
    gen = entry.get("generated_by", "")
    if "manual_patch" in gen:
        return False, []
    return len(missing) == len(expected_authors), missing


def _check_short_answer(entry: dict) -> bool:
    return len(entry.get("answer_full", "")) < SHORT_ANSWER_THRESHOLD


def _check_prohibited(entry: dict) -> tuple[bool, list[str]]:
    blob = _lower(entry.get("answer_full", ""))
    hits = [p for p in PROHIBITED_PHRASES if p in blob]
    return len(hits) > 0, hits


# `_strip_accents` y `_levenshtein` se importan desde `pipeline/_shared.py`
# (ver header del módulo).


def _check_typo_hallucination(entry: dict) -> tuple[bool, dict]:
    """
    H7 — typo hallucination.

    Extrae el "root" del ID (todo antes del primer `_concepto` / `_explicacion` /
    `_tipos` / `_definicion`). Si ese root está a distancia Levenshtein ≤2 de
    algún término de COMMON_TERMS SIN ser exactamente ese término, flaggear.
    """
    raw_id = (entry.get("id") or "").lower()
    # Heurística: quedarnos con el primer segmento significativo del ID.
    # Cortamos en sufijos semánticos habituales si aparecen.
    SUFFIXES = ["_concepto", "_explicacion", "_definicion", "_tipos"]
    root = raw_id
    for suf in SUFFIXES:
        idx = root.find(suf)
        if idx > 0:
            root = root[:idx]
            break
    # También cortamos numeración final `_2`, `_3`, etc.
    root = re.sub(r"_\d+$", "", root)
    # Normalizar (sin tildes) para comparación uniforme
    root_norm = _strip_accents(root)

    # Si el root es demasiado corto o demasiado largo para un término común,
    # no tiene sentido compararlo.
    if len(root_norm) < 4 or len(root_norm) > 16:
        return False, {}

    best = None
    best_dist = H7_LEV_THRESHOLD + 1
    for term in COMMON_TERMS:
        term_norm = _strip_accents(term.lower())
        d = _levenshtein(root_norm, term_norm)
        if d == 0:
            # Match exacto → NO es typo, no flaggear
            return False, {}
        if d < best_dist:
            best_dist = d
            best = term_norm
    if best is not None and best_dist <= H7_LEV_THRESHOLD:
        return True, {"root": root_norm, "closest": best, "distance": best_dist}
    return False, {}


def audit_entry(entry: dict) -> dict:
    flags = {}
    hit_cd, words_cd = _check_cross_domain(entry)
    if hit_cd:
        flags["H1_cross_domain"] = words_cd
    if _check_generic_id(entry):
        flags["H2_generic_id"] = entry.get("id", "")
    if _check_template_patterns(entry):
        flags["H3_template_patterns"] = len(entry.get("patterns", []))
    hit_ma, missing_authors = _check_missing_author(entry)
    if hit_ma:
        flags["H4_missing_author"] = missing_authors
    if _check_short_answer(entry):
        flags["H5_short_answer"] = len(entry.get("answer_full", ""))
    hit_ph, phrases = _check_prohibited(entry)
    if hit_ph:
        flags["H6_prohibited_phrases"] = phrases
    hit_typo, typo_detail = _check_typo_hallucination(entry)
    if hit_typo:
        flags["H7_typo_hallucination"] = typo_detail
    return flags


def severity(flags: dict) -> str:
    """
    Severidad en base a qué heurísticas se gatillaron.
    alta   → H1 (cross-domain) o H6 (prohibited), o H7+H3 (typo con templates)
             — fix obligatorio pre-regenerate / pre-demo
    media  → H2+H3 combinados, H4 solo, o H7 solo
    baja   → H5 (short) o heurística única sin agravantes
    """
    if "H1_cross_domain" in flags or "H6_prohibited_phrases" in flags:
        return "alta"
    if "H7_typo_hallucination" in flags and "H3_template_patterns" in flags:
        # Typo + templates → el runtime matcha fuzzy con cualquier query del término real
        return "alta"
    if ("H2_generic_id" in flags and "H3_template_patterns" in flags) or "H4_missing_author" in flags:
        return "media"
    if "H7_typo_hallucination" in flags:
        return "media"
    if flags:
        return "baja"
    return "clean"


# ── Report rendering ─────────────────────────────────────────────────

def render_markdown(results: list[dict], total: int) -> str:
    grouped = defaultdict(list)
    for r in results:
        grouped[r["severity"]].append(r)

    flagged = sum(len(v) for k, v in grouped.items() if k != "clean")

    out = []
    out.append("# KB Hallucination Audit\n")
    out.append(f"> **Generado por** `scripts/audit_hallucinations.py`\n")
    out.append(f"> **Total entries auditadas:** {total}\n")
    out.append(f"> **Entries flaggeadas:** {flagged} ({100*flagged/total:.1f}%)\n")
    out.append(f"> **Desglose:** alta={len(grouped['alta'])} · media={len(grouped['media'])} · baja={len(grouped['baja'])}\n\n")

    # Resumen por heurística
    by_heuristic = defaultdict(int)
    for r in results:
        for h in r["flags"]:
            by_heuristic[h] += 1
    if by_heuristic:
        out.append("## Desglose por heurística\n\n")
        out.append("| Heurística | Conteo |\n|---|---:|\n")
        for h, c in sorted(by_heuristic.items()):
            out.append(f"| `{h}` | {c} |\n")
        out.append("\n")

    # Resumen por materia
    by_materia = defaultdict(lambda: defaultdict(int))
    for r in results:
        if r["severity"] != "clean":
            by_materia[r["materia"]][r["severity"]] += 1
    if by_materia:
        out.append("## Desglose por materia\n\n")
        out.append("| Materia | Alta | Media | Baja |\n|---|---:|---:|---:|\n")
        for m, sevs in sorted(by_materia.items()):
            out.append(f"| {m} | {sevs.get('alta', 0)} | {sevs.get('media', 0)} | {sevs.get('baja', 0)} |\n")
        out.append("\n")

    # Detalle por severidad
    for sev in ["alta", "media", "baja"]:
        if not grouped[sev]:
            continue
        out.append(f"## Severidad {sev.upper()} ({len(grouped[sev])} entries)\n\n")
        for r in grouped[sev]:
            out.append(f"### `{r['id']}` · {r['materia']}\n\n")
            out.append(f"- **generated_by:** `{r['generated_by']}`\n")
            out.append(f"- **heurísticas:** {', '.join(r['flags'].keys())}\n")
            for h, detail in r["flags"].items():
                out.append(f"  - `{h}`: {detail}\n")
            preview = r["answer_preview"].replace("\n", " ")
            out.append(f"- **preview:** {preview}\n\n")

    return "".join(out)


# ── Main ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="KB hallucination audit")
    parser.add_argument("--kb", default="kb/knowledge_base.json", help="path al KB JSON")
    parser.add_argument("--out", default=None, help="escribir reporte a archivo")
    parser.add_argument("--only", default=None, help="filtrar por materia (ej: Sociales)")
    parser.add_argument("--min-severity", default="baja", choices=["alta", "media", "baja"])
    parser.add_argument(
        "--exclude-neutralized", action="store_true",
        help="excluir entries ya neutralizadas (demo_safe=False o patterns=[])"
    )
    parser.add_argument(
        "--exclude-whitelisted", action="store_true",
        help="excluir entries marcadas demo_safe=True con audit_whitelist_reason"
    )
    args = parser.parse_args()

    kb_path = Path(args.kb)
    if not kb_path.exists():
        print(f"ERROR: no se encuentra {kb_path}", file=sys.stderr)
        return 1

    kb = json.loads(kb_path.read_text(encoding="utf-8"))
    entries = kb.get("entries", [])
    if args.only:
        entries = [e for e in entries if e.get("materia") == args.only]
    if args.exclude_neutralized:
        def _is_neutralized(e: dict) -> bool:
            return e.get("demo_safe") is False or not (e.get("patterns") or [])
        entries = [e for e in entries if not _is_neutralized(e)]
    if args.exclude_whitelisted:
        entries = [
            e for e in entries
            if not (e.get("demo_safe") is True and e.get("audit_whitelist_reason"))
        ]

    severity_order = {"alta": 3, "media": 2, "baja": 1, "clean": 0}
    min_sev = severity_order[args.min_severity]

    results = []
    for e in entries:
        flags = audit_entry(e)
        sev = severity(flags)
        if severity_order[sev] >= min_sev:
            results.append({
                "id":            e.get("id", ""),
                "materia":       e.get("materia", ""),
                "generated_by":  e.get("generated_by", "?"),
                "flags":         flags,
                "severity":      sev,
                "answer_preview": (e.get("answer_full", "") or "")[:200],
            })

    # Sort: severidad alta primero, luego por materia, luego por id
    results.sort(key=lambda r: (-severity_order[r["severity"]], r["materia"], r["id"]))

    report = render_markdown(results, total=len(entries))

    if args.out:
        Path(args.out).write_text(report, encoding="utf-8")
        print(f"✓ Reporte guardado en {args.out}")
        print(f"  · entries auditadas: {len(entries)}")
        print(f"  · flaggeadas: {sum(1 for r in results if r['severity'] != 'clean')}")
    else:
        sys.stdout.write(report)

    return 0


if __name__ == "__main__":
    sys.exit(main())
