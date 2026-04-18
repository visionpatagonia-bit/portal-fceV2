"""
NEXUS Pipeline — ingest_pdf.py
─────────────────────────────────────────────────────────────────────
Fase 2 · Bloque B

Toma un PDF de Materiales/ → extrae texto → chunks cohesivos → JSON intermedio.
El output alimenta a generate_kb.py (llamada a Mistral).

Principios:
  · Chunks de ~1100 chars (≈ 250 palabras) — granularidad ideal para Q/A.
  · Respeta saltos de párrafo originales — no corta conceptos por la mitad.
  · Cada chunk guarda su source_ref para que la entry final pueda citar página.
  · Falla loud si el PDF es un scan (0 chars extraídos).

Uso (desde la raíz del proyecto):
    python pipeline/ingest_pdf.py \\
        --pdf "Materiales/ADMINISTRACION/UNIDAD 2/.../U2.6 Chiavenato.pdf" \\
        --materia "Administración"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import List, Tuple

from pypdf import PdfReader
from slugify import slugify

from config import PROJECT_ROOT

# ─── Parámetros de chunking ─────────────────────────────────────────────
CHUNK_TARGET_CHARS = 1100     # objetivo ~ 250 palabras por chunk
CHUNK_MIN_CHARS    = 400      # no emitir chunks minúsculos
CHUNK_MAX_CHARS    = 1800     # techo duro (evita chunks gigantes si no hay \n\n)


# ─── Helpers ────────────────────────────────────────────────────────────

def _normalize_text(text: str) -> str:
    """Limpia texto extraído de pypdf: unicode forms, null bytes, whitespace."""
    if not text:
        return ""
    # NFC normalization — colapsa "á" (combinada) a forma canónica
    text = unicodedata.normalize("NFC", text)
    # Remove null bytes y control chars (excepto \n \t)
    text = "".join(c for c in text if c == "\n" or c == "\t" or ord(c) >= 32)
    # Colapsa runs de whitespace (pero preserva \n\n para párrafos)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _extract_pages(pdf_path: Path) -> List[Tuple[int, str]]:
    """Devuelve [(page_num, normalized_text), ...] de todas las páginas."""
    reader = PdfReader(str(pdf_path))
    out: List[Tuple[int, str]] = []
    for i, page in enumerate(reader.pages, start=1):
        raw = page.extract_text() or ""
        normalized = _normalize_text(raw)
        out.append((i, normalized))
    return out


def _split_page_into_chunks(
    text: str,
    target: int = CHUNK_TARGET_CHARS,
    min_len: int = CHUNK_MIN_CHARS,
    max_len: int = CHUNK_MAX_CHARS,
) -> List[str]:
    """
    Divide el texto de UNA página en chunks cohesivos.

    Estrategia (en orden de preferencia):
      1. Cortes en párrafos (\\n\\n) — respeta estructura del autor.
      2. Si un párrafo solo ya excede max_len, cortar en oraciones (. ! ?).
      3. Si una oración solo excede max_len, cortar duro por caracteres.
    """
    if not text:
        return []

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [text]

    # Expandir párrafos gigantes en oraciones
    expanded: List[str] = []
    for p in paragraphs:
        if len(p) <= max_len:
            expanded.append(p)
            continue
        # Cortar en oraciones (regex conservador: punto + espacio + mayúscula/fin)
        sentences = re.split(r"(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])", p)
        for s in sentences:
            if len(s) <= max_len:
                expanded.append(s)
            else:
                # Corte duro por caracteres (último recurso)
                for i in range(0, len(s), max_len):
                    expanded.append(s[i : i + max_len])

    # Agregación: unir párrafos hasta alcanzar target
    chunks: List[str] = []
    buf: List[str] = []
    buf_len = 0
    for part in expanded:
        part_len = len(part)
        if buf_len + part_len + 2 > target and buf_len >= min_len:
            chunks.append("\n\n".join(buf))
            buf = [part]
            buf_len = part_len
        else:
            buf.append(part)
            buf_len += part_len + 2  # +2 por "\n\n"

    if buf:
        tail = "\n\n".join(buf)
        # Si queda un tail chiquito y hay un chunk previo, mergear (evita fragmento huérfano)
        if len(tail) < min_len and chunks:
            chunks[-1] = chunks[-1] + "\n\n" + tail
        else:
            chunks.append(tail)

    return chunks


# ─── API pública ────────────────────────────────────────────────────────

def ingest_pdf(pdf_path: Path, materia: str) -> dict:
    """
    Procesa un PDF y devuelve el dict listo para serializar.

    Raises:
        RuntimeError si el PDF no tiene texto extraíble (scan sin OCR).
    """
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF no encontrado: {pdf_path}")

    rel_path = pdf_path.resolve().relative_to(PROJECT_ROOT)
    source_path = str(rel_path).replace("\\", "/")
    pdf_slug = slugify(pdf_path.stem, max_length=60) or "untitled"

    pages = _extract_pages(pdf_path)
    total_chars = sum(len(t) for _, t in pages)

    if total_chars < 200:
        raise RuntimeError(
            f"PDF '{pdf_path.name}' tiene {total_chars} chars totales "
            f"→ probablemente es un scan sin OCR. Requiere pipeline de OCR (ver task #15)."
        )

    all_chunks: List[dict] = []
    chunk_counter = 0
    for page_num, page_text in pages:
        if not page_text:
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

    return {
        "pdf":          pdf_path.name,
        "source_path":  source_path,
        "materia":      materia,
        "slug":         pdf_slug,
        "total_pages":  len(pages),
        "total_chars":  total_chars,
        "total_chunks": len(all_chunks),
        "chunks":       all_chunks,
    }


# ─── CLI ────────────────────────────────────────────────────────────────

def _cli():
    parser = argparse.ArgumentParser(description="Ingest a PDF → chunks JSON")
    parser.add_argument("--pdf", required=True, help="Ruta al PDF (relativa al proyecto o absoluta)")
    parser.add_argument("--materia", required=True, help="Nombre de la materia (ej: Administración)")
    parser.add_argument("--out-dir", default=None, help="Directorio de output (default: pipeline/chunks/)")
    args = parser.parse_args()

    pdf_input = Path(args.pdf)
    if not pdf_input.is_absolute():
        pdf_input = PROJECT_ROOT / pdf_input

    try:
        data = ingest_pdf(pdf_input, args.materia)
    except RuntimeError as e:
        print(f"[ingest] ERROR: {e}", file=sys.stderr)
        sys.exit(2)

    out_dir = Path(args.out_dir) if args.out_dir else (PROJECT_ROOT / "pipeline" / "chunks")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{data['slug']}.json"
    out_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[ingest] ✓ {data['pdf']}")
    print(f"[ingest]   pages={data['total_pages']} chars={data['total_chars']} chunks={data['total_chunks']}")
    print(f"[ingest]   → {out_file.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    _cli()
