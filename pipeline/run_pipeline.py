"""
NEXUS Pipeline — run_pipeline.py
─────────────────────────────────────────────────────────────────────
Orquestador: ingest → generate → validate.

Encadena los 3 pasos de Bloque B en un solo comando. Cada paso
escribe un artefacto intermedio en disco (reproducibilidad + debugging).

Uso:
    # Pipeline completa (ingest + Mistral + validator)
    python pipeline/run_pipeline.py \\
        --pdf "Materiales/ADMINISTRACION/.../U2.6 Chiavenato.pdf" \\
        --materia "Administración"

    # Solo reprocessar validator (cuando cambian reglas de validación)
    python pipeline/run_pipeline.py \\
        --pdf "Materiales/.../X.pdf" \\
        --materia "Admin" \\
        --only-validate

Artefactos generados:
    pipeline/chunks/{slug}.json       ← texto chunked
    pipeline/kb_draft/{slug}.json     ← entries Mistral (pre-validación)
    kb/knowledge_base.json            ← KB final (consumido por el portal)
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

from slugify import slugify

from config import KB_FILE, PROJECT_ROOT
from generate_kb import process_chunks_file
from ingest_pdf import ingest_pdf
from validator import validate_draft


def _cli():
    parser = argparse.ArgumentParser(description="NEXUS Pipeline — ingest + generate + validate")
    parser.add_argument("--pdf", required=True, help="Ruta al PDF (relativa al proyecto o absoluta)")
    parser.add_argument("--materia", required=True, help="Nombre de la materia")
    parser.add_argument("--only-ingest",   action="store_true", help="Solo chunking, no llamar a Mistral")
    parser.add_argument("--only-generate", action="store_true", help="Asume chunks ya existen, solo Mistral + validate")
    parser.add_argument("--only-validate", action="store_true", help="Asume draft existe, solo validator")
    parser.add_argument("--append-kb",     action="store_true", help="Mergear con KB existente en lugar de sobreescribir")
    parser.add_argument("--out-kb",        default=None, help="Override del path del KB final")
    args = parser.parse_args()

    pdf_input = Path(args.pdf)
    if not pdf_input.is_absolute():
        pdf_input = PROJECT_ROOT / pdf_input

    if not pdf_input.exists():
        print(f"[pipeline] ERROR: no existe {pdf_input}", file=sys.stderr)
        sys.exit(2)

    pdf_slug     = slugify(pdf_input.stem, max_length=60) or "untitled"
    chunks_file  = PROJECT_ROOT / "pipeline" / "chunks"   / f"{pdf_slug}.json"
    draft_file   = PROJECT_ROOT / "pipeline" / "kb_draft" / f"{pdf_slug}.json"
    kb_out       = Path(args.out_kb) if args.out_kb else KB_FILE

    t0 = time.time()

    # ─── Paso 1: Ingest ─────────────────────────────────────────────────
    if not args.only_generate and not args.only_validate:
        print(f"\n━━━ [1/3] INGEST — {pdf_input.name}")
        try:
            data = ingest_pdf(pdf_input, args.materia)
        except RuntimeError as exc:
            print(f"[pipeline] ✗ INGEST FAILED: {exc}", file=sys.stderr)
            sys.exit(3)

        chunks_file.parent.mkdir(parents=True, exist_ok=True)
        chunks_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"[pipeline]   pages={data['total_pages']} chars={data['total_chars']} "
              f"chunks={data['total_chunks']}")
        print(f"[pipeline]   → {chunks_file.relative_to(PROJECT_ROOT)}")

        if args.only_ingest:
            print(f"\n[pipeline] ✓ Solo-ingest OK ({time.time()-t0:.1f}s)")
            return

    # ─── Paso 2: Generate (Mistral) ─────────────────────────────────────
    if not args.only_validate:
        print(f"\n━━━ [2/3] GENERATE — Mistral 7B")
        if not chunks_file.exists():
            print(f"[pipeline] ✗ chunks no existen: {chunks_file}", file=sys.stderr)
            print(f"[pipeline]   tip: corré sin --only-generate primero o pasá el pdf correcto",
                  file=sys.stderr)
            sys.exit(4)
        try:
            draft = process_chunks_file(chunks_file, draft_file)
        except Exception as exc:
            print(f"[pipeline] ✗ GENERATE FAILED: {exc}", file=sys.stderr)
            sys.exit(5)
        print(f"[pipeline]   chunks_ok={draft['chunks_ok']}/{draft['total_chunks']} "
              f"entries={draft['total_entries']} "
              f"avg={draft['avg_per_chunk_seconds']}s/chunk")

    # ─── Paso 3: Validate ───────────────────────────────────────────────
    print(f"\n━━━ [3/3] VALIDATE")
    if not draft_file.exists():
        print(f"[pipeline] ✗ draft no existe: {draft_file}", file=sys.stderr)
        sys.exit(6)
    kb = validate_draft(draft_file, kb_out, append=args.append_kb)
    print(f"[pipeline]   válidas={kb['total_entries']}  rechazadas={kb['total_rejected']}")
    print(f"[pipeline]   → {kb_out.relative_to(PROJECT_ROOT)}")

    # ─── Resumen ────────────────────────────────────────────────────────
    elapsed = time.time() - t0
    print(f"\n━━━ DONE  ({elapsed:.1f}s total)  ✓")


if __name__ == "__main__":
    _cli()
