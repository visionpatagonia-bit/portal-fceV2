"""
NEXUS Pipeline — generate_kb.py
─────────────────────────────────────────────────────────────────────
Fase 2 · Bloque B

Toma los chunks generados por ingest_pdf.py y los pasa por Mistral 7B
(vía Ollama local) para generar entries Q/A de alta calidad académica.

El system prompt vive en pipeline/prompts/nexus_academic.md —
es el "constitutivo" del dominio: reglas de trazabilidad, anti-alucinación,
formato de answer_full, etc.

Salida: kb_draft/{slug}.json con entries sin validar.
El validator.py se corre DESPUÉS para filtrar las que no pasan checks.

Uso:
    python pipeline/generate_kb.py \\
        --chunks "pipeline/chunks/u2-6-chiavenato.json"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

import requests

from config import (
    MISTRAL_MODEL,
    MISTRAL_TIMEOUT,
    OLLAMA_BASE_URL,
    PROJECT_ROOT,
    PROMPTS_DIR,
)

# ─── System prompt ──────────────────────────────────────────────────────
_SYSTEM_PROMPT_PATH = PROMPTS_DIR / "nexus_academic.md"

# ─── User prompt template (per chunk) ───────────────────────────────────
USER_PROMPT_TEMPLATE = """\
Contexto del chunk:
- Archivo fuente: {source_ref}
- Materia: {materia}
- Página: {page}

TEXTO DEL MATERIAL:
═════════════════════════════════════════════════════════════════════
{text}
═════════════════════════════════════════════════════════════════════

Generá entries del knowledge_base siguiendo ESTRICTAMENTE el schema JSON del \
system prompt. Principios:

1. SOLO extraé conceptos que estén LITERALMENTE en el texto. Cero inferencia.
2. Generá 0-3 entries por chunk (0 si el chunk no tiene conceptos útiles).
3. Cada entry debe incluir "source_refs": ["{source_ref}"].
4. Devolvé un ARRAY JSON (puede ser vacío []). Sin texto extra, sin markdown fences.
5. Si algún campo no aplica, omitilo — NO inventes valores.

JSON output:"""


# ─── Ollama client ──────────────────────────────────────────────────────

def _load_system_prompt() -> str:
    if not _SYSTEM_PROMPT_PATH.exists():
        raise FileNotFoundError(
            f"System prompt no encontrado: {_SYSTEM_PROMPT_PATH}. "
            f"Se esperaba pipeline/prompts/nexus_academic.md"
        )
    return _SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")


def _call_mistral(
    system_prompt: str,
    user_prompt: str,
    model: str = MISTRAL_MODEL,
    timeout: int = MISTRAL_TIMEOUT,
) -> str:
    """Llama /api/chat de Ollama y devuelve el content del assistant."""
    resp = requests.post(
        f"{OLLAMA_BASE_URL}/api/chat",
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            "stream": False,
            "options": {
                "temperature": 0.3,
                "top_p":       0.9,
                "num_predict": 2048,
            },
        },
        timeout=timeout,
    )
    resp.raise_for_status()
    payload = resp.json()
    if "message" not in payload or "content" not in payload["message"]:
        raise RuntimeError(f"Respuesta inesperada de Ollama: {payload}")
    return payload["message"]["content"]


# ─── Response parsing ───────────────────────────────────────────────────

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _extract_json_array(raw: str) -> List[Dict[str, Any]]:
    """
    Extrae un array JSON del output del LLM.

    Mistral a veces envuelve la respuesta en ```json ... ``` o agrega un
    prefacio tipo "Acá tenés las entries:". Intentamos ser resilientes.
    """
    if not raw:
        return []

    cleaned = _FENCE_RE.sub("", raw).strip()

    # Si ya empieza con [ → parse directo
    if cleaned.startswith("["):
        try:
            parsed = json.loads(cleaned)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            pass

    # Fallback: buscar el primer [ y el último ]
    start = cleaned.find("[")
    end = cleaned.rfind("]")
    if start == -1 or end == -1 or end <= start:
        return []

    candidate = cleaned[start : end + 1]
    try:
        parsed = json.loads(candidate)
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError as exc:
        print(f"[generate] ⚠️  JSON parse failed: {exc}. Raw preview:\n{raw[:300]}\n",
              file=sys.stderr)
        return []


# ─── Per-chunk processing ───────────────────────────────────────────────

def _enrich_entry(entry: Dict[str, Any], chunk: Dict[str, Any], materia: str) -> Dict[str, Any]:
    """
    Completa campos requeridos que Mistral puede haber omitido.
    No sobreescribe lo que el modelo devolvió.
    """
    entry.setdefault("materia", materia)
    refs = entry.get("source_refs") or []
    if chunk["source_ref"] not in refs:
        refs = refs + [chunk["source_ref"]]
    entry["source_refs"] = refs
    entry.setdefault("generated_by", MISTRAL_MODEL)
    entry.setdefault("chunk_id", chunk["id"])
    return entry


def process_chunks_file(chunks_file: Path, out_file: Path, verbose: bool = True) -> Dict[str, Any]:
    """
    Procesa TODOS los chunks de un archivo y genera el draft de KB.
    """
    data = json.loads(chunks_file.read_text(encoding="utf-8"))
    system_prompt = _load_system_prompt()

    all_entries: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []
    timings: List[float] = []

    total = len(data["chunks"])
    t_pipeline_start = time.time()

    for idx, chunk in enumerate(data["chunks"], start=1):
        user_prompt = USER_PROMPT_TEMPLATE.format(
            source_ref=chunk["source_ref"],
            materia=data["materia"],
            page=chunk["page"],
            text=chunk["text"],
        )
        t0 = time.time()
        try:
            raw = _call_mistral(system_prompt, user_prompt)
            entries = _extract_json_array(raw)
            entries = [_enrich_entry(e, chunk, data["materia"]) for e in entries if isinstance(e, dict)]
            all_entries.extend(entries)
            elapsed = time.time() - t0
            timings.append(elapsed)
            if verbose:
                print(f"[generate] [{idx}/{total}] chunk {chunk['id']} "
                      f"→ {len(entries)} entries ({elapsed:.1f}s)")
        except requests.exceptions.RequestException as exc:
            errors.append({"chunk_id": chunk["id"], "error_class": "RequestException", "error": str(exc)})
            print(f"[generate] [{idx}/{total}] chunk {chunk['id']} FAILED (network): {exc}",
                  file=sys.stderr)
        except Exception as exc:
            errors.append({"chunk_id": chunk["id"], "error_class": type(exc).__name__, "error": str(exc)})
            print(f"[generate] [{idx}/{total}] chunk {chunk['id']} FAILED: {exc}",
                  file=sys.stderr)

    total_elapsed = time.time() - t_pipeline_start
    avg_per_chunk = (sum(timings) / len(timings)) if timings else 0.0

    output = {
        "source_path":   data["source_path"],
        "pdf":           data["pdf"],
        "materia":       data["materia"],
        "model":         MISTRAL_MODEL,
        "total_chunks":  total,
        "chunks_ok":     total - len(errors),
        "chunks_failed": len(errors),
        "total_entries": len(all_entries),
        "pipeline_seconds": round(total_elapsed, 1),
        "avg_per_chunk_seconds": round(avg_per_chunk, 1),
        "errors":        errors,
        "entries":       all_entries,
    }

    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")

    if verbose:
        print(f"[generate] ✓ {len(all_entries)} entries generadas en {total_elapsed:.1f}s "
              f"(avg {avg_per_chunk:.1f}s/chunk)")
        print(f"[generate]   → {out_file.relative_to(PROJECT_ROOT)}")

    return output


# ─── CLI ────────────────────────────────────────────────────────────────

def _cli():
    parser = argparse.ArgumentParser(description="Generate KB entries from chunks via Mistral")
    parser.add_argument("--chunks", required=True, help="Ruta al archivo chunks JSON")
    parser.add_argument("--out-dir", default=None, help="Directorio de output (default: pipeline/kb_draft/)")
    args = parser.parse_args()

    chunks_input = Path(args.chunks)
    if not chunks_input.is_absolute():
        chunks_input = PROJECT_ROOT / chunks_input

    if not chunks_input.exists():
        print(f"[generate] ERROR: no existe {chunks_input}", file=sys.stderr)
        sys.exit(2)

    out_dir = Path(args.out_dir) if args.out_dir else (PROJECT_ROOT / "pipeline" / "kb_draft")
    out_file = out_dir / chunks_input.name

    process_chunks_file(chunks_input, out_file)


if __name__ == "__main__":
    _cli()
