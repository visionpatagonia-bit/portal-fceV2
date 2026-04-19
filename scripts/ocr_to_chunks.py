#!/usr/bin/env python3
"""
scripts/ocr_to_chunks.py — Wrapper OCR externo para scans sin text layer
─────────────────────────────────────────────────────────────────────────
Fase 3 · 2026-04-20

Produce un `pipeline/chunks/*.json` a partir de un PDF que es un scan puro
(sin text layer extraíble por pypdf). Flujo:

    PDF scan
        ↓  pdftoppm  (rasterizar páginas a JPEG 200dpi)
        ↓  tesseract -l spa  (OCR por página)
        ↓  clean_ocr (strict)  (dehyphen, headers, typos)
        ↓  ingest_pdf._split_page_into_chunks (misma función)
    pipeline/chunks/<slug>.json

Por qué externo (no integrado en ingest_pdf.py):
- El ingest original asume que pypdf extrae texto. Acoplar OCR ahí metería
  dependencia de tesseract + pdftoppm a todo el pipeline, rompiendo el uso
  en máquinas donde solo hay material con text layer (Itinerario II/III).
- Mantener OCR como paso explícito deja claro en el log qué scans son
  "problemáticos" y cuáles no.
- clean_ocr.py ya fue validado como módulo independiente (Fase 6.3). Este
  wrapper solo lo compone con tesseract y el chunker del pipeline.

Requisitos del sistema:
- tesseract-ocr ≥ 4.1.1 con pack español (`spa.traineddata`)
- pdftoppm (poppler-utils)
- El pack español puede estar en /usr/share/tesseract-ocr/*/tessdata/ o
  pasarse vía `--tessdata-dir`.

Uso:
    # PDF único, materia y slug auto-detectados del path
    python scripts/ocr_to_chunks.py \\
        --pdf "Materiales/CONTABILIDAD/Itinerario I/Capítulo 2 ....pdf" \\
        --materia Contabilidad

    # Especificar slug custom y tessdata
    python scripts/ocr_to_chunks.py \\
        --pdf "path/to/scan.pdf" --materia Contabilidad \\
        --slug itinerario-i-fowler-cap2 \\
        --tessdata-dir /opt/tessdata

    # DPI alto para scans de baja calidad
    python scripts/ocr_to_chunks.py \\
        --pdf "path/to/scan.pdf" --materia Contabilidad --dpi 300

Output: un JSON en `pipeline/chunks/<slug>.json` listo para `generate_kb.py`.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path
from typing import List, Tuple

# Resolver PROJECT_ROOT y agregar pipeline al sys.path para reusar chunker + clean_ocr
PROJECT_ROOT = Path(__file__).resolve().parent.parent
PIPELINE_DIR = PROJECT_ROOT / "pipeline"
if str(PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_DIR))

from clean_ocr import clean_ocr_text, CleanConfig  # noqa: E402
from ingest_pdf import _split_page_into_chunks, _normalize_text  # noqa: E402


# ─── Helpers ───────────────────────────────────────────────────────────

def _slugify(name: str, max_length: int = 60) -> str:
    """Misma lógica que pipeline/ingest_pdf.slugify (inline para no crear deps extra)."""
    norm = unicodedata.normalize("NFD", name)
    norm = "".join(c for c in norm if unicodedata.category(c) != "Mn")
    norm = norm.lower()
    norm = re.sub(r"[^a-z0-9]+", "-", norm)
    norm = norm.strip("-")
    return norm[:max_length] if len(norm) > max_length else norm


def _check_tool(name: str) -> None:
    if shutil.which(name) is None:
        print(f"ERROR: falta '{name}' en PATH. Instalar antes de continuar.", file=sys.stderr)
        sys.exit(2)


def _rasterize(pdf: Path, dpi: int, out_prefix: Path) -> List[Path]:
    """Rasteriza el PDF a JPEGs con pdftoppm. Retorna lista de paths en orden."""
    cmd = ["pdftoppm", "-jpeg", "-r", str(dpi), str(pdf), str(out_prefix)]
    subprocess.run(cmd, check=True, capture_output=True)
    parent = out_prefix.parent
    prefix_name = out_prefix.name
    # pdftoppm produce {prefix}-{N}.jpg o {prefix}-{NN}.jpg dependiendo del count
    pages = sorted(parent.glob(f"{prefix_name}-*.jpg"))
    if not pages:
        raise RuntimeError(f"pdftoppm no produjo páginas para {pdf}")
    return pages


def _ocr_page(jpg: Path, lang: str, tessdata_dir: str | None) -> str:
    """Corre tesseract sobre un JPEG y devuelve el texto."""
    env = os.environ.copy()
    if tessdata_dir:
        env["TESSDATA_PREFIX"] = tessdata_dir
    cmd = ["tesseract", str(jpg), "-", "-l", lang]
    result = subprocess.run(cmd, check=True, capture_output=True, env=env, text=True)
    return result.stdout


def _default_tessdata_dir() -> str | None:
    """
    Busca tessdata en ubicaciones típicas. Retorna None si solo la default
    del sistema debería usarse.
    """
    candidates = [
        # Permitir que el usuario ya tenga TESSDATA_PREFIX seteado
        os.environ.get("TESSDATA_PREFIX"),
        # Path común de ubuntu
        "/usr/share/tesseract-ocr/4.00/tessdata",
        "/usr/share/tesseract-ocr/5/tessdata",
        # Path override del workspace (descargado manualmente por el user)
        str(Path.home() / "tessdata"),
    ]
    for c in candidates:
        if c and Path(c).exists() and any(Path(c).glob("*.traineddata")):
            return c
    return None


# ─── Pipeline principal ────────────────────────────────────────────────

def ocr_pdf_to_chunks(
    pdf: Path,
    materia: str,
    slug: str | None = None,
    dpi: int = 200,
    lang: str = "spa",
    tessdata_dir: str | None = None,
    clean_strict: bool = True,
) -> dict:
    """
    Core. OCR + clean + chunk sobre un PDF scan, retorna el dict del chunks JSON.
    """
    if not pdf.exists():
        raise FileNotFoundError(f"PDF no encontrado: {pdf}")

    _check_tool("pdftoppm")
    _check_tool("tesseract")

    # Slug
    slug = slug or _slugify(pdf.stem)
    if not slug:
        raise ValueError(f"No se pudo derivar slug del nombre: {pdf.stem}")

    # Source path relativo al proyecto (para que las entries citen bien)
    try:
        source_path = str(pdf.resolve().relative_to(PROJECT_ROOT)).replace("\\", "/")
    except ValueError:
        # PDF fuera del proyecto → uso el nombre nomás
        source_path = pdf.name

    print(f"[ocr] {pdf.name}")
    print(f"      materia={materia} · slug={slug} · dpi={dpi} · lang={lang}")

    clean_config = CleanConfig.strict() if clean_strict else CleanConfig()

    with tempfile.TemporaryDirectory(prefix="ocr-", dir="/tmp") as tmp:
        tmp_path = Path(tmp)
        out_prefix = tmp_path / "page"

        # 1) Rasterizar
        print("      [1/4] rasterizando con pdftoppm...")
        jpgs = _rasterize(pdf, dpi, out_prefix)
        print(f"             → {len(jpgs)} páginas")

        # 2) OCR por página + 3) clean_ocr por página
        print(f"      [2/4] OCR con tesseract -l {lang}...")
        print(f"      [3/4] clean_ocr ({'strict' if clean_strict else 'default'})...")
        pages_clean: List[Tuple[int, str]] = []
        for i, jpg in enumerate(jpgs, start=1):
            raw_ocr = _ocr_page(jpg, lang, tessdata_dir)
            cleaned = clean_ocr_text(raw_ocr, clean_config)
            # Aplicar la misma normalización que ingest_pdf usa, para que el
            # chunker opere sobre texto equivalente.
            normalized = _normalize_text(cleaned)
            pages_clean.append((i, normalized))
            if i % 5 == 0 or i == len(jpgs):
                print(f"             página {i}/{len(jpgs)}")

    # 4) Chunking
    print("      [4/4] chunking...")
    all_chunks: List[dict] = []
    chunk_counter = 0
    total_chars = 0
    for page_num, page_text in pages_clean:
        total_chars += len(page_text)
        if not page_text.strip():
            continue
        for chunk_text in _split_page_into_chunks(page_text):
            chunk_counter += 1
            all_chunks.append({
                "id":         f"c{chunk_counter:03d}",
                "page":       page_num,
                "char_len":   len(chunk_text),
                "source_ref": f"{source_path}#p{page_num}",
                "text":       chunk_text,
            })

    print(f"             → {chunk_counter} chunks ({total_chars} chars totales)")

    return {
        "pdf":          pdf.name,
        "source_path":  source_path,
        "materia":      materia,
        "slug":         slug,
        "total_pages":  len(pages_clean),
        "total_chars":  total_chars,
        "total_chunks": len(all_chunks),
        "chunks":       all_chunks,
        # Metadata extra: dejamos trazabilidad de que esto vino de OCR
        "ingested_via": f"ocr:tesseract-{lang}+clean_ocr:{'strict' if clean_strict else 'default'}",
        "ocr_dpi":      dpi,
    }


# ─── CLI ───────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="OCR wrapper: PDF scan → chunks JSON")
    parser.add_argument("--pdf", required=True, help="Ruta al PDF scan (relativa al proyecto o absoluta)")
    parser.add_argument("--materia", required=True, help="Nombre de la materia (ej: Contabilidad)")
    parser.add_argument("--slug", default=None, help="Slug del output (default: auto del nombre)")
    parser.add_argument("--dpi", type=int, default=200, help="DPI de rasterizado (default: 200)")
    parser.add_argument("--lang", default="spa", help="Idioma tesseract (default: spa)")
    parser.add_argument("--tessdata-dir", default=None,
                        help="Path a directorio con traineddata (default: auto-detectar)")
    parser.add_argument("--no-strict", action="store_true",
                        help="Usar clean_ocr default en vez de strict")
    parser.add_argument("--out-dir", default=None,
                        help="Directorio de output (default: pipeline/chunks/)")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.is_absolute():
        pdf_path = PROJECT_ROOT / pdf_path

    tessdata = args.tessdata_dir or _default_tessdata_dir()
    if not tessdata:
        print("WARN: no se detectó directorio de tessdata. Tesseract usará el default del sistema.", file=sys.stderr)

    try:
        data = ocr_pdf_to_chunks(
            pdf=pdf_path,
            materia=args.materia,
            slug=args.slug,
            dpi=args.dpi,
            lang=args.lang,
            tessdata_dir=tessdata,
            clean_strict=not args.no_strict,
        )
    except FileNotFoundError as e:
        print(f"[ocr] ERROR: {e}", file=sys.stderr)
        return 1
    except subprocess.CalledProcessError as e:
        print(f"[ocr] ERROR en subproceso: {e}", file=sys.stderr)
        print(f"      stderr: {e.stderr.decode('utf-8', errors='replace') if e.stderr else ''}", file=sys.stderr)
        return 1

    out_dir = Path(args.out_dir) if args.out_dir else (PROJECT_ROOT / "pipeline" / "chunks")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{data['slug']}.json"
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n✓ escribí {out_path.relative_to(PROJECT_ROOT)}")
    print(f"  · páginas: {data['total_pages']}")
    print(f"  · chunks:  {data['total_chunks']}")
    print(f"  · chars:   {data['total_chars']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
