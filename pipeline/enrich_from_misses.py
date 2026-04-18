"""
NEXUS Pipeline — enrich_from_misses.py
─────────────────────────────────────────────────────────────────────
Fase 3 · Lean

Ciclo cerrado de mejora:
    runtime kb_miss → cluster de queries → chunks relevantes → Mistral
    genera candidate → validator lo chequea → queda en qa_cache_draft
    con needs_review=true para que Juan lo revise/promuevue manualmente.

Filosofía:
  · Zero hallucination. Mistral SOLO ve chunks reales del corpus.
    Si ninguno matchea → se registra en unresolved_questions.json.
  · Zero auto-merge. El script NO toca knowledge_base.json — Juan
    decide qué promover. "Redistribuir conocimiento, no reducirlo."
  · Idempotente. Re-correr no duplica candidates.
  · Observable. CLI reporta clusters, matches, misses sin fuente.

Uso:
    python pipeline/enrich_from_misses.py
    python pipeline/enrich_from_misses.py --logs ../nexus-ai-proxy/logs/runtime.jsonl
    python pipeline/enrich_from_misses.py --min-occurrences 1 --dry-run
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from config import (
    KB_DIR,
    MISTRAL_MODEL,
    PROJECT_ROOT,
    PROMPTS_DIR,
)

# Imports de módulos hermanos — rutas relativas al pipeline.
from generate_kb import _call_mistral, _extract_json_array  # noqa: E402
from validator import (  # noqa: E402
    _STOPWORDS_ES,
    _TOKEN_RE,
    _strip_accents,
    get_entry_warnings,
    validate_entry,
)

# ─── Paths ──────────────────────────────────────────────────────────────

DEFAULT_LOGS_FILE = PROJECT_ROOT / "nexus-ai-proxy" / "logs" / "runtime.jsonl"
CHUNKS_DIR        = PROJECT_ROOT / "pipeline" / "chunks"
QA_CACHE_DRAFT    = KB_DIR / "qa_cache_draft.json"
UNRESOLVED_FILE   = KB_DIR / "unresolved_questions.json"

# ─── Parámetros ─────────────────────────────────────────────────────────

# Mínimo de tokens significativos para considerar una query "procesable".
# "qué es competitividad" → 1 token (competitividad) es válido — es el caso
# más común en queries de concepto único. Rechazamos solo queries sin ningún
# token de contenido (puras stopwords o 1-2 chars).
MIN_QUERY_TOKENS = 1

# Cuántas veces debe aparecer un cluster para generar un candidate.
# Para el demo del lunes arrancamos con 1 (datos escasos).
DEFAULT_MIN_OCCURRENCES = 1

# Top-K chunks más relevantes que le pasamos a Mistral por query.
# Más chunks = más contexto pero más probabilidad de alucinación cruzada.
TOP_K_CHUNKS = 3

# Score mínimo de relevancia para considerar que un chunk es retrievable.
# TF simple sobre tokens; calibrado empíricamente.
MIN_CHUNK_RELEVANCE = 0.12

# ─── Sistema prompt para enrichment ────────────────────────────────────
# Reutilizamos el prompt maestro pero con un user-prompt distinto:
# en vez de "extraé conceptos", le decimos "respondé ESTA pregunta".

_SYSTEM_PROMPT_PATH = PROMPTS_DIR / "nexus_academic.md"

USER_PROMPT_TEMPLATE = """\
Contexto: un alumno hizo esta pregunta al portal y no encontramos respuesta \
en el KB actual. Queremos generar UN entry candidate que responda la pregunta \
usando EXCLUSIVAMENTE el material fuente adjunto abajo.

PREGUNTA DEL ALUMNO (normalizada):
"{query}"

Variantes similares que hicieron otros alumnos:
{variants_block}

MATERIAL FUENTE DISPONIBLE (única base de conocimiento permitida):
═════════════════════════════════════════════════════════════════════
{chunks_block}
═════════════════════════════════════════════════════════════════════

Generá UN (1) entry JSON siguiendo ESTRICTAMENTE el schema del system prompt.

Reglas críticas:

1. SOLO podés usar información que esté LITERALMENTE en el material fuente.
   Cero inferencia. Cero "típicamente". Cero conocimiento general.
2. Si el material NO responde la pregunta → devolvé un array vacío [].
   Preferimos no-respuesta a alucinación.
3. El campo "source_refs" DEBE contener las referencias de los chunks que usaste.
4. Los "patterns" deben incluir la query original + las variantes + 2-3 reformulaciones naturales.
5. Devolvé un ARRAY JSON con el único entry (o vacío []). Sin markdown fences, sin prefacio.

JSON output:"""

# ─── Normalización y clustering ─────────────────────────────────────────


def _query_tokens(query: str) -> Set[str]:
    """Tokens significativos de una query — mismo criterio que validator."""
    if not query:
        return set()
    norm = _strip_accents(query.lower())
    tokens = _TOKEN_RE.findall(norm)
    return {t for t in tokens if len(t) > 2 and t not in _STOPWORDS_ES}


def _canonical_cluster_key(tokens: Set[str]) -> str:
    """
    Clave estable para agrupar queries casi-idénticas:
    tokens ordenados alfabéticamente, unidos con `_`.

    Ej: "qué es un activo" y "que es activo" → mismos tokens {'activo'}
        (stopwords descartadas) → misma clave.
    """
    return "_".join(sorted(tokens))


def cluster_miss_queries(
    miss_events: List[Dict[str, Any]],
    min_occurrences: int = DEFAULT_MIN_OCCURRENCES,
) -> List[Dict[str, Any]]:
    """
    Agrupa kb_miss events por overlap de tokens significativos.

    Returns:
        Lista de clusters, cada uno con:
          { key, canonical_query, variants[], count, last_seen_ts }
        Ordenados por count descendente (priorizar las más frecuentes).
    """
    buckets: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    for ev in miss_events:
        query = (ev.get("query_norm") or "").strip()
        if not query:
            continue
        tokens = _query_tokens(query)
        if len(tokens) < MIN_QUERY_TOKENS:
            # Queries demasiado cortas para clusterizar con seguridad.
            continue
        key = _canonical_cluster_key(tokens)
        buckets[key].append(ev)

    clusters: List[Dict[str, Any]] = []
    for key, events in buckets.items():
        if len(events) < min_occurrences:
            continue
        # Elegimos como canonical la variante más larga (suele ser la más completa).
        variants = list({e["query_norm"] for e in events if e.get("query_norm")})
        variants.sort(key=len, reverse=True)
        last_seen = max(e.get("server_ts") or e.get("ts") or 0 for e in events)
        clusters.append({
            "key":              key,
            "canonical_query":  variants[0] if variants else "",
            "variants":         variants,
            "count":            len(events),
            "last_seen_ts":     last_seen,
            "tokens":           sorted(_query_tokens(variants[0]) if variants else []),
        })

    clusters.sort(key=lambda c: (-c["count"], -c["last_seen_ts"]))
    return clusters


# ─── Retrieval TF-lite de chunks ───────────────────────────────────────


# Control chars (except tab/newline) que rompen el parse JSON si vienen
# crudos dentro de strings. Los PDFs extraídos a veces tienen \r literal
# (Windows line endings o ligaduras) que JSON spec no acepta sin escapar.
# Preservamos \t (0x09) y \n (0x0a); eliminamos el resto — incluido \r (0x0d).
_CTRL_CHARS_RE = re.compile(r"[\x00-\x08\x0b-\x0c\x0d\x0e-\x1f]")


def _read_chunks_json(path: Path) -> Optional[Dict[str, Any]]:
    """
    Lee un chunks file tolerando caracteres de control dentro de strings.
    ingest_pdf.py a veces deja \\r literales en el texto extraído del PDF.
    """
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"[enrich] ⚠️  no se pudo abrir {path.name}: {exc}",
              file=sys.stderr)
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Segundo intento: limpiar control chars sueltos.
        cleaned = _CTRL_CHARS_RE.sub(" ", text)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            print(f"[enrich] ⚠️  chunks file inválido {path.name}: {exc}",
                  file=sys.stderr)
            return None


def _load_all_chunks(chunks_dir: Path) -> List[Dict[str, Any]]:
    """
    Aplana todos los chunks de pipeline/chunks/*.json en una sola lista,
    preservando el contexto (pdf, materia, source_ref).
    """
    all_chunks: List[Dict[str, Any]] = []
    for f in sorted(chunks_dir.glob("*.json")):
        data = _read_chunks_json(f)
        if data is None:
            continue
        materia = data.get("materia", "")
        pdf = data.get("pdf", "")
        for ch in data.get("chunks", []):
            all_chunks.append({
                "chunk_id":   ch.get("id", ""),
                "text":       ch.get("text", ""),
                "page":       ch.get("page"),
                "source_ref": ch.get("source_ref", ""),
                "materia":    materia,
                "pdf":        pdf,
            })
    return all_chunks


def _chunk_tokens(text: str) -> Set[str]:
    """Token-set de un chunk, mismo pipeline que query_tokens."""
    if not text:
        return set()
    norm = _strip_accents(text.lower())
    tokens = _TOKEN_RE.findall(norm)
    return {t for t in tokens if len(t) > 2 and t not in _STOPWORDS_ES}


def retrieve_top_chunks(
    query_tokens: Set[str],
    all_chunks: List[Dict[str, Any]],
    top_k: int = TOP_K_CHUNKS,
    min_score: float = MIN_CHUNK_RELEVANCE,
) -> List[Tuple[float, Dict[str, Any]]]:
    """
    Score = |query_tokens ∩ chunk_tokens| / |query_tokens|.
    (Recall-oriented: qué fracción de la query está cubierta por el chunk.)

    Returns: lista [(score, chunk), ...] ordenada desc, filtrada por min_score.
    """
    if not query_tokens:
        return []

    scored: List[Tuple[float, Dict[str, Any]]] = []
    qsize = len(query_tokens)

    for ch in all_chunks:
        ct = _chunk_tokens(ch["text"])
        if not ct:
            continue
        overlap = len(query_tokens & ct)
        if overlap == 0:
            continue
        score = overlap / qsize
        if score < min_score:
            continue
        scored.append((score, ch))

    scored.sort(key=lambda s: -s[0])
    return scored[:top_k]


# ─── Generación de candidate via Mistral ────────────────────────────────


def _load_system_prompt() -> str:
    if not _SYSTEM_PROMPT_PATH.exists():
        raise FileNotFoundError(
            f"System prompt no encontrado: {_SYSTEM_PROMPT_PATH}"
        )
    return _SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")


def _format_chunks_block(scored_chunks: List[Tuple[float, Dict[str, Any]]]) -> str:
    """Bloque human-readable con los chunks retrievados, con source_ref."""
    parts: List[str] = []
    for score, ch in scored_chunks:
        parts.append(
            f"[chunk {ch['chunk_id']} · página {ch.get('page','?')} · "
            f"{ch['source_ref']} · relevance={score:.2f}]\n{ch['text']}"
        )
    return "\n\n---\n\n".join(parts)


def _format_variants_block(variants: List[str], canonical: str) -> str:
    others = [v for v in variants if v != canonical]
    if not others:
        return "(sin variantes adicionales)"
    return "\n".join(f"  · \"{v}\"" for v in others[:5])


def generate_candidate(
    cluster: Dict[str, Any],
    scored_chunks: List[Tuple[float, Dict[str, Any]]],
    verbose: bool = True,
) -> Tuple[Optional[Dict[str, Any]], str]:
    """
    Llama a Mistral con la query + chunks retrievados.

    Returns:
        (entry | None, reason)
        reason ∈ {"ok", "empty_response", "mistral_error", "no_chunks",
                  "parse_failed", "not_dict"}.
    """
    if not scored_chunks:
        return None, "no_chunks"

    system_prompt = _load_system_prompt()
    user_prompt = USER_PROMPT_TEMPLATE.format(
        query=cluster["canonical_query"],
        variants_block=_format_variants_block(
            cluster["variants"], cluster["canonical_query"]
        ),
        chunks_block=_format_chunks_block(scored_chunks),
    )

    t0 = time.time()
    try:
        raw = _call_mistral(system_prompt, user_prompt)
    except Exception as exc:
        print(f"[enrich] ⚠️  Mistral falló para '{cluster['canonical_query']}': {exc}",
              file=sys.stderr)
        return None, "mistral_error"

    entries = _extract_json_array(raw)
    elapsed = time.time() - t0

    if not entries:
        if verbose:
            print(f"[enrich]   Mistral devolvió vacío ({elapsed:.1f}s) — "
                  f"el material no responde la pregunta")
        return None, "empty_response"

    entry = entries[0]
    if not isinstance(entry, dict):
        return None, "not_dict"

    # Enriquecer con source_refs de los chunks usados + metadata de origen.
    chunk_refs = [ch["source_ref"] for _, ch in scored_chunks]
    existing_refs = entry.get("source_refs") or []
    # Unir sin duplicados, preservando orden.
    seen: Set[str] = set()
    refs: List[str] = []
    for r in list(existing_refs) + chunk_refs:
        if r and r not in seen:
            refs.append(r)
            seen.add(r)
    entry["source_refs"] = refs

    # Materia: si Mistral no la puso, tomarla del chunk top.
    if not entry.get("materia") and scored_chunks:
        entry["materia"] = scored_chunks[0][1].get("materia", "")

    entry["generated_by"] = MISTRAL_MODEL
    entry["source_miss_queries"] = cluster["variants"]
    entry["miss_cluster_count"] = cluster["count"]
    entry["needs_review"] = True
    entry["generated_at"] = int(time.time())
    entry["generation_elapsed_s"] = round(elapsed, 1)
    entry["retrieval_scores"] = [
        {"chunk_id": ch["chunk_id"], "score": round(s, 3)}
        for s, ch in scored_chunks
    ]

    if verbose:
        print(f"[enrich]   ✓ candidate generado "
              f"(id='{entry.get('id','?')}', {elapsed:.1f}s)")
    return entry, "ok"


# ─── Idempotencia: merge con drafts previos ─────────────────────────────


def _load_existing_draft(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {
            "schema_version": "1.0",
            "description": (
                "Candidates generados por enrich_from_misses.py. "
                "Revisar manualmente antes de promover a knowledge_base.json."
            ),
            "entries": [],
        }
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"[enrich] ⚠️  qa_cache_draft.json corrupto ({exc}), se reinicia",
              file=sys.stderr)
        return {
            "schema_version": "1.0",
            "description": "Reiniciado por draft corrupto.",
            "entries": [],
        }


def _already_cached(cluster: Dict[str, Any], existing: Dict[str, Any]) -> bool:
    """True si alguna entry previa ya cubre este cluster (por key o variants)."""
    cluster_variants = set(cluster["variants"])
    for e in existing.get("entries", []):
        prev_variants = set(e.get("source_miss_queries") or [])
        if cluster_variants & prev_variants:
            return True
    return False


# ─── Logging de miss no resueltos ───────────────────────────────────────


def _log_unresolved(cluster: Dict[str, Any], reason: str) -> Dict[str, Any]:
    return {
        "canonical_query":   cluster["canonical_query"],
        "variants":          cluster["variants"],
        "count":             cluster["count"],
        "last_seen_ts":      cluster["last_seen_ts"],
        "tokens":            cluster["tokens"],
        "reason":            reason,
        "logged_at":         int(time.time()),
    }


# ─── Pipeline principal ─────────────────────────────────────────────────


def read_miss_events(logs_file: Path) -> List[Dict[str, Any]]:
    """Lee runtime.jsonl y retorna los eventos type=kb_miss."""
    events: List[Dict[str, Any]] = []
    if not logs_file.exists():
        return events
    with logs_file.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except json.JSONDecodeError:
                continue
            if ev.get("type") == "kb_miss":
                events.append(ev)
    return events


def enrich(
    logs_file: Path = DEFAULT_LOGS_FILE,
    min_occurrences: int = DEFAULT_MIN_OCCURRENCES,
    max_candidates: Optional[int] = None,
    dry_run: bool = False,
    verbose: bool = True,
) -> Dict[str, Any]:
    """
    Pipeline completo.

    Returns: summary dict para la CLI.
    """
    if verbose:
        print(f"\n[enrich] leyendo logs: {logs_file}")

    misses = read_miss_events(logs_file)
    if verbose:
        print(f"[enrich]   {len(misses)} eventos kb_miss encontrados")

    clusters = cluster_miss_queries(misses, min_occurrences=min_occurrences)
    if verbose:
        print(f"[enrich]   {len(clusters)} clusters con ≥{min_occurrences} ocurrencia(s)")

    all_chunks = _load_all_chunks(CHUNKS_DIR)
    if verbose:
        print(f"[enrich]   {len(all_chunks)} chunks en el corpus\n")

    existing_draft = _load_existing_draft(QA_CACHE_DRAFT)
    existing_ids = {e.get("id") for e in existing_draft.get("entries", []) if e.get("id")}

    new_entries: List[Dict[str, Any]] = []
    unresolved: List[Dict[str, Any]] = []
    skipped_already_cached = 0
    skipped_validator_fail = 0
    processed = 0

    for cluster in clusters:
        if max_candidates is not None and processed >= max_candidates:
            break
        processed += 1

        q = cluster["canonical_query"]
        if verbose:
            print(f"[enrich] cluster '{q}' (×{cluster['count']})")

        if _already_cached(cluster, existing_draft):
            skipped_already_cached += 1
            if verbose:
                print("[enrich]   ⊙ ya existe en qa_cache_draft — skip")
            continue

        # Retrieval
        tokens = _query_tokens(q)
        scored = retrieve_top_chunks(tokens, all_chunks)
        if not scored:
            unresolved.append(_log_unresolved(cluster, "no_matching_chunks"))
            if verbose:
                print("[enrich]   ✗ sin chunks relevantes → unresolved")
            continue

        if verbose:
            print(f"[enrich]   {len(scored)} chunks retrievados "
                  f"(top score {scored[0][0]:.2f})")

        # Generación
        candidate, gen_reason = generate_candidate(cluster, scored, verbose=verbose)
        if candidate is None:
            unresolved.append(_log_unresolved(cluster, f"generation:{gen_reason}"))
            continue

        # Validación (no-bloqueante; warnings se anotan pero no rechazan)
        ok, reasons = validate_entry(candidate)
        candidate["validated"] = ok
        ws = get_entry_warnings(candidate)
        if ws:
            candidate["warnings"] = ws
        if not ok:
            candidate["rejection_reasons"] = reasons
            skipped_validator_fail += 1
            unresolved.append(_log_unresolved(
                cluster, f"validator_rejected:{','.join(reasons[:3])}"
            ))
            if verbose:
                print(f"[enrich]   ✗ validator rechazó: {reasons}")
            continue

        # Evitar colisión de IDs con el draft existente → sufijo automático.
        base_id = candidate.get("id") or "candidate"
        final_id = base_id
        n = 2
        while final_id in existing_ids or any(e.get("id") == final_id for e in new_entries):
            final_id = f"{base_id}_{n}"
            n += 1
        if final_id != base_id:
            candidate["id_original"] = base_id
            candidate["id"] = final_id

        new_entries.append(candidate)
        existing_ids.add(final_id)

    # Persistencia
    if not dry_run and new_entries:
        existing_draft["entries"] = existing_draft.get("entries", []) + new_entries
        existing_draft["last_run_ts"] = int(time.time())
        QA_CACHE_DRAFT.parent.mkdir(parents=True, exist_ok=True)
        QA_CACHE_DRAFT.write_text(
            json.dumps(existing_draft, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    if not dry_run and unresolved:
        existing_unresolved: List[Dict[str, Any]] = []
        if UNRESOLVED_FILE.exists():
            try:
                existing_unresolved = json.loads(
                    UNRESOLVED_FILE.read_text(encoding="utf-8")
                ).get("entries", [])
            except json.JSONDecodeError:
                existing_unresolved = []
        # Dedup por canonical_query — gana el más reciente.
        seen_q: Set[str] = set()
        merged: List[Dict[str, Any]] = []
        for u in unresolved + existing_unresolved:
            cq = u.get("canonical_query", "")
            if cq in seen_q:
                continue
            seen_q.add(cq)
            merged.append(u)
        UNRESOLVED_FILE.write_text(
            json.dumps({
                "schema_version": "1.0",
                "description": (
                    "Queries kb_miss que no encontraron material fuente. "
                    "Juan debe ingestar nuevo PDF/doc para cubrir estos conceptos."
                ),
                "last_run_ts": int(time.time()),
                "entries": merged,
            }, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    return {
        "misses_total":           len(misses),
        "clusters_total":         len(clusters),
        "clusters_processed":     processed,
        "candidates_generated":   len(new_entries),
        "skipped_already_cached": skipped_already_cached,
        "skipped_validator_fail": skipped_validator_fail,
        "unresolved_count":       len(unresolved),
        "dry_run":                dry_run,
    }


# ─── CLI ────────────────────────────────────────────────────────────────


def _cli():
    parser = argparse.ArgumentParser(
        description="Enrich KB candidates desde logs de kb_miss"
    )
    parser.add_argument(
        "--logs", default=str(DEFAULT_LOGS_FILE),
        help=f"Ruta al runtime.jsonl (default: {DEFAULT_LOGS_FILE})",
    )
    parser.add_argument(
        "--min-occurrences", type=int, default=DEFAULT_MIN_OCCURRENCES,
        help=f"Ocurrencias mínimas por cluster (default: {DEFAULT_MIN_OCCURRENCES})",
    )
    parser.add_argument(
        "--max-candidates", type=int, default=None,
        help="Máximo de clusters a procesar por corrida (rate-limit a Mistral)",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="No escribe qa_cache_draft.json ni unresolved_questions.json",
    )
    parser.add_argument(
        "-q", "--quiet", action="store_true",
        help="Menos verbosidad",
    )
    args = parser.parse_args()

    logs_file = Path(args.logs)
    if not logs_file.is_absolute():
        logs_file = PROJECT_ROOT / logs_file

    summary = enrich(
        logs_file=logs_file,
        min_occurrences=args.min_occurrences,
        max_candidates=args.max_candidates,
        dry_run=args.dry_run,
        verbose=not args.quiet,
    )

    print("\n[enrich] ─────────────────────────────────────────────")
    print(f"[enrich]   misses totales:        {summary['misses_total']}")
    print(f"[enrich]   clusters:              {summary['clusters_total']}")
    print(f"[enrich]   procesados:            {summary['clusters_processed']}")
    print(f"[enrich]   ✓ candidates nuevos:   {summary['candidates_generated']}")
    print(f"[enrich]   ⊙ ya cacheados:        {summary['skipped_already_cached']}")
    print(f"[enrich]   ✗ validator rechazó:   {summary['skipped_validator_fail']}")
    print(f"[enrich]   ⚠ unresolved:          {summary['unresolved_count']}")
    if summary["dry_run"]:
        print("[enrich]   (DRY RUN — no se escribió nada)")
    else:
        if summary["candidates_generated"]:
            print(f"[enrich]   → {QA_CACHE_DRAFT.relative_to(PROJECT_ROOT)}")
        if summary["unresolved_count"]:
            print(f"[enrich]   → {UNRESOLVED_FILE.relative_to(PROJECT_ROOT)}")
    print("[enrich] ─────────────────────────────────────────────\n")


if __name__ == "__main__":
    _cli()
