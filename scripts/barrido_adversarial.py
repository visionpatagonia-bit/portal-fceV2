#!/usr/bin/env python3
"""
barrido_adversarial.py · barrido automatizado de queries contra el chat NEXUS Auditor
=======================================================================================

Propósito: dado un archivo de queries (típicamente del agente contador adversarial del CTO),
ejecuta cada query contra la lógica completa que vería Trucco — KB match local primero,
LLM fallback via proxy si miss — y produce dos outputs:
  · barrido_<ts>.json       → estructurado, queryable para análisis posterior
  · barrido_<ts>_para_agente.txt → formateado para pegar al agente contador sin reformateo

Replica exactamente la lógica del frontend de Trucco:
  · KB filtrado Contabilidad (173 entries)
  · Threshold strict 0.75 (modo auditor)
  · Header X-Tenant: trucco al proxy
  · System prompt auditor_academico (lo aplica el proxy)

Out of scope (decisión arquitectónica del CTO):
  · NO integra con la API de Claude · el lead pega el TXT al agente contador manual
  · NO paraleliza · sequential con delay 1.5s para no saturar el proxy local
  · NO persiste en DB · archivos en disco son suficientes
  · NO toca el chat NEXUS · solo consume el endpoint como cliente

Uso:
  python scripts/barrido_adversarial.py scripts/queries_adversariales.txt

Variables de entorno opcionales:
  NEXUS_PROXY_URL  → endpoint del chat (default: http://localhost:3100/api/chat)
  NEXUS_API_KEY    → API key Bearer (default: nexus-fce-2026-changeme)
"""

import json
import sys
import os
import re
import time
import unicodedata
from datetime import datetime
from pathlib import Path

# requests es la lib estándar de facto · si falta, mensaje claro al lead
try:
    import requests
except ImportError:
    print("ERROR: este script requiere 'requests'. Instalar con:")
    print("  pip install requests")
    sys.exit(1)

# === Config ====================================================================
ROOT = Path(__file__).resolve().parent.parent  # portal_v19.3.0/
KB_PATH = ROOT / "nexus-contabilidad-deploy" / "public" / "kb" / "knowledge_base.json"
PROXY_URL = os.environ.get("NEXUS_PROXY_URL", "http://localhost:3100/api/chat")
API_KEY = os.environ.get("NEXUS_API_KEY", "nexus-fce-2026-changeme")
THRESHOLD_STRICT = 0.75       # modo auditor (CTO 2026-05-05)
DELAY_SECONDS = 1.5            # entre queries · no saturar el proxy
# Timeout 90s · cold start del modelo en primer call puede tomar 30-40s,
# y respuestas largas con system prompt auditor pueden tomar 20-30s.
TIMEOUT_SECONDS = 90
OUTPUT_DIR = ROOT / "scripts" / "output_barrido"

# === Lógica de matching · réplica fiel del frontend nexus-ai.js ================

def normalize_query(q):
    """Mismo flow que _normalizeQuery() del frontend: lowercase + sin acentos + sin puntuación."""
    if not q:
        return ""
    s = q.lower()
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r'[¿?¡!.,;:"\'`«»“”‘’]', '', s)  # comillas + puntuación · sync con frontend
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def levenshtein(a, b):
    """Edit distance · iterativo O(b) memoria · idéntico al del frontend."""
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        curr = [i]
        for j in range(1, len(b) + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            curr.append(min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost))
        prev = curr
    return prev[-1]


def similarity(q, pattern):
    """Score 0-1: combina contención (substring) + Levenshtein normalizado.
    Réplica de _similarity() del frontend."""
    nq = normalize_query(q)
    np_ = normalize_query(pattern)
    if not nq or not np_:
        return 0.0
    if nq == np_:
        return 1.0
    if len(np_) >= 4 and np_ in nq:
        return 0.95
    if len(nq) >= 4 and nq in np_:
        return 0.88
    maxlen = max(len(nq), len(np_))
    dist = levenshtein(nq, np_)
    return 1.0 - (dist / maxlen)


def match_kb_entry(query, kb_entries):
    """Réplica de _matchKBEntry() del frontend con threshold strict 0.75."""
    best = None
    best_score = 0.0
    for entry in kb_entries:
        entry_threshold = entry.get('confidence_threshold', 0.5)
        active_threshold = max(THRESHOLD_STRICT, entry_threshold)  # modo auditor
        for pattern in entry.get('patterns', []):
            score = similarity(query, pattern)
            if score > best_score and score >= active_threshold:
                best_score = score
                best = {
                    'entry': entry,
                    'score': score,
                    'matched_pattern': pattern,
                    'threshold_applied': active_threshold,
                }
    return best


# === Parseo de citas y refuse honesto =========================================

# Matchea citas técnicas con o sin paréntesis · 4 patrones canónicos:
#   "RT 16 § 4.1.2" o "(RT 16 § 4.1.2)"
#   "IASB MC párr. 4.3" o "(IASB MC párr. 4.3)"
#   "NIIF 9" o "NIIF 9 párr. X"
#   "RT 54 NUA art. 3"
CITATION_RE = re.compile(
    r'\(?\s*(?:'
    r'RT\s*54\s*NUA(?:\s+(?:art\.?|§|p[áa]?rr?\.?)\s*[\w.]+)?'
    r'|RT\s*\d+(?:\s+(?:art\.?|§|p[áa]?rr?\.?)\s*[\w.]+)?'
    r'|IASB(?:\s+Marco\s+Conceptual)?(?:\s+\d{4})?(?:\s+(?:MC|p[áa]?rr?\.?)\s*[\w.]+)*'
    r'|NIIF\s*\d+(?:\s+(?:p[áa]?rr?\.?)\s*[\w.]+)?'
    r')\s*\)?',
    re.IGNORECASE,
)

REFUSE_RE = re.compile(
    r'no tengo respaldo literal|no tengo respaldo en mi base|fuera del alcance|est[áa] fuera del alcance',
    re.IGNORECASE,
)


def extract_citations(text):
    if not text:
        return []
    found = CITATION_RE.findall(text)
    seen = set()
    unique = []
    for c in found:
        # Cleanup: strip whitespace, leading/trailing parens y puntos finales sueltos
        clean = c.strip().strip('()').strip().rstrip('.').strip()
        # Filtrar matches espurios (muy cortos · sin números · solo "IASB" sin párr/marco)
        if len(clean) < 4:
            continue
        if not re.search(r'\d', clean) and 'NUA' not in clean.upper() and 'MC' not in clean.upper() and 'MARCO' not in clean.upper():
            continue
        if clean.lower() not in seen:
            seen.add(clean.lower())
            unique.append(clean)
    return unique


def is_refuse(text):
    return bool(REFUSE_RE.search(text or ''))


# === Cliente del proxy NEXUS · streaming SSE ==================================

def call_proxy(query):
    """Llama al proxy con header X-Tenant: trucco · acumula stream SSE · devuelve respuesta full."""
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {API_KEY}',
        'X-Tenant': 'trucco',
        'X-Strict-Mode': 'true',
    }
    body = {
        'messages': [{'role': 'user', 'content': query}],
        'context': {'tenant': 'trucco', 'mode': 'auditor_academico'},
    }
    start = time.time()
    try:
        r = requests.post(
            PROXY_URL,
            headers=headers,
            json=body,
            stream=True,
            timeout=TIMEOUT_SECONDS,
        )
        r.raise_for_status()
        # Forzar UTF-8 · sin esto, requests asume ISO-8859-1 si Content-Type
        # no especifica charset (default HTTP), y los caracteres acentuados
        # quedan doble-codificados ("económico" → "econÃ³mico").
        r.encoding = 'utf-8'
        full = ''
        for raw_line in r.iter_lines(decode_unicode=True):
            if not raw_line:
                continue
            if raw_line.startswith('data: '):
                data = raw_line[6:]
                if data == '[DONE]':
                    break
                try:
                    obj = json.loads(data)
                except json.JSONDecodeError:
                    continue
                if obj.get('error'):
                    return None, obj['error'], int((time.time() - start) * 1000)
                if obj.get('token'):
                    full += obj['token']
        elapsed = int((time.time() - start) * 1000)
        return full, None, elapsed
    except requests.exceptions.Timeout:
        return None, f"timeout >{TIMEOUT_SECONDS}s", int((time.time() - start) * 1000)
    except requests.exceptions.ConnectionError as e:
        return None, f"connection error · proxy/tunnel posiblemente caído ({e.__class__.__name__})", 0
    except Exception as e:
        return None, f"unexpected error: {e}", int((time.time() - start) * 1000)


# === Main =====================================================================

def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/barrido_adversarial.py <queries_file>")
        print("Ejemplo: python scripts/barrido_adversarial.py scripts/queries_adversariales.txt")
        sys.exit(2)

    queries_file = Path(sys.argv[1])
    if not queries_file.is_absolute():
        queries_file = ROOT / queries_file
    if not queries_file.exists():
        print(f"ERROR: archivo de queries no existe: {queries_file}")
        sys.exit(1)

    if not KB_PATH.exists():
        print(f"ERROR: KB filtrado Contabilidad no existe: {KB_PATH}")
        print("       Generar antes con: node scripts/build.js && python3 scripts/build_trucco.py")
        sys.exit(1)

    # Cargar KB
    with open(KB_PATH, 'r', encoding='utf-8') as f:
        kb = json.load(f)
    kb_entries = kb.get('entries', [])
    print(f"[barrido] KB cargada · {len(kb_entries)} entries (filtradas Contabilidad)")

    # Cargar queries (uno por línea · # comentarios saltados)
    with open(queries_file, 'r', encoding='utf-8') as f:
        queries = [
            line.strip()
            for line in f
            if line.strip() and not line.strip().startswith('#')
        ]
    if not queries:
        print("ERROR: archivo de queries vacío o solo comentarios")
        sys.exit(1)
    print(f"[barrido] {len(queries)} queries cargadas")
    print(f"[barrido] Endpoint: {PROXY_URL}")
    print(f"[barrido] Threshold strict: {THRESHOLD_STRICT}")
    print()

    # Ejecutar barrido
    results = []
    errors_count = 0
    proxy_dead = False
    llm_total_latency = 0
    llm_total_calls = 0
    start_total = time.time()

    for i, query in enumerate(queries, 1):
        if proxy_dead:
            results.append({
                'query_n': i,
                'query': query,
                'respuesta': None,
                'error': 'barrido abortado · proxy/tunnel caído al inicio',
                'match_origin': None,
                'match_score': None,
                'citations': [],
                'latency_ms': 0,
            })
            continue

        # 1) KB match local primero (cache-first · réplica del frontend)
        kb_match = match_kb_entry(query, kb_entries)

        if kb_match:
            entry = kb_match['entry']
            response = entry.get('answer_full', '')
            citations = extract_citations(response)
            score = round(kb_match['score'], 3)
            print(f"[barrido] {i}/{len(queries)} ✓ KB · score={score} · entry={entry.get('id')}")
            results.append({
                'query_n': i,
                'query': query,
                'respuesta': response,
                'match_origin': 'kb',
                'match_score': score,
                'matched_entry_id': entry.get('id'),
                'matched_pattern': kb_match['matched_pattern'],
                'threshold_applied': kb_match['threshold_applied'],
                'citations': citations,
                'source_refs': entry.get('source_refs', []),
                'latency_ms': 0,
            })
        else:
            # 2) LLM fallback via proxy con system prompt auditor
            response, error, latency = call_proxy(query)
            if error:
                errors_count += 1
                print(f"[barrido] {i}/{len(queries)} ✗ ERROR · {error}")
                results.append({
                    'query_n': i,
                    'query': query,
                    'respuesta': None,
                    'error': error,
                    'match_origin': 'llm_error',
                    'match_score': None,
                    'citations': [],
                    'latency_ms': latency,
                })
                # Connection error en queries 1-2 → proxy caído · abortar
                if 'connection' in error.lower() and i <= 2:
                    print(f"\n[barrido] CRITICAL · proxy/tunnel caído. Abortando barrido.")
                    print(f"[barrido] Validar antes de relanzar:")
                    print(f"          1) curl {PROXY_URL.replace('/api/chat','/api/health')}")
                    print(f"          2) Verificar Terminal 1 (proxy) y Terminal 2 (tunnel)")
                    proxy_dead = True
            else:
                citations = extract_citations(response)
                origin = 'refuse' if is_refuse(response) else 'llm'
                print(f"[barrido] {i}/{len(queries)} ✓ {origin.upper()} · {latency}ms · citations={len(citations)}")
                results.append({
                    'query_n': i,
                    'query': query,
                    'respuesta': response,
                    'match_origin': origin,
                    'match_score': None,
                    'citations': citations,
                    'latency_ms': latency,
                })
                llm_total_latency += latency
                llm_total_calls += 1

        # Delay entre queries (excepto la última)
        if i < len(queries) and not proxy_dead:
            time.sleep(DELAY_SECONDS)

    # Output: JSON + TXT
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    json_path = OUTPUT_DIR / f"barrido_{timestamp}.json"
    txt_path = OUTPUT_DIR / f"barrido_{timestamp}_para_agente.txt"

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump({
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'queries_file': str(queries_file),
                'queries_count': len(queries),
                'kb_entries_count': len(kb_entries),
                'threshold_strict': THRESHOLD_STRICT,
                'proxy_url': PROXY_URL,
            },
            'results': results,
        }, f, ensure_ascii=False, indent=2)

    with open(txt_path, 'w', encoding='utf-8') as f:
        f.write("=" * 78 + "\n")
        f.write(f"BARRIDO ADVERSARIAL · NEXUS Auditor (versión Trucco)\n")
        f.write(f"Timestamp: {datetime.now().isoformat()}\n")
        f.write(f"Queries: {len(queries)} · KB entries: {len(kb_entries)} · Threshold strict: {THRESHOLD_STRICT}\n")
        f.write("=" * 78 + "\n\n")
        f.write("Pegá este bloque al agente contador adversarial del CTO.\n")
        f.write("Cada query incluye respuesta + metadata · auditá uno por uno.\n\n")

        for r in results:
            f.write(f"=== QUERY {r['query_n']} ===\n")
            f.write(f"QUERY: {r['query']}\n\n")
            if r.get('error'):
                f.write(f"RESPUESTA: [ERROR · {r['error']}]\n\n")
            else:
                f.write(f"RESPUESTA DEL CHAT:\n{r['respuesta']}\n\n")
            f.write("METADATA:\n")
            f.write(f"- Match origin: {r['match_origin']}\n")
            if r.get('match_score') is not None:
                f.write(f"- Score: {r['match_score']}\n")
            if r.get('matched_entry_id'):
                f.write(f"- Entry ID: {r['matched_entry_id']}\n")
            if r.get('matched_pattern'):
                f.write(f"- Matched pattern: \"{r['matched_pattern']}\"\n")
            cit_str = ', '.join(r['citations']) if r['citations'] else '(ninguna)'
            f.write(f"- Citations detectadas: {cit_str}\n")
            if r.get('source_refs'):
                f.write(f"- Source refs (KB): {'; '.join(r['source_refs'])}\n")
            f.write(f"- Latencia: {r['latency_ms']}ms\n")
            f.write("\n")

    # Reporte final
    elapsed_total = time.time() - start_total
    ok_count = sum(1 for r in results if not r.get('error'))
    avg_latency = (llm_total_latency / llm_total_calls) if llm_total_calls > 0 else 0
    kb_hits = sum(1 for r in results if r.get('match_origin') == 'kb')
    llm_calls = sum(1 for r in results if r.get('match_origin') == 'llm')
    refuses = sum(1 for r in results if r.get('match_origin') == 'refuse')

    print()
    print("=" * 60)
    print(f"[barrido] {ok_count}/{len(queries)} OK · {errors_count} errores")
    print(f"[barrido] KB hits: {kb_hits} · LLM calls: {llm_calls} · refuses: {refuses}")
    if llm_total_calls > 0:
        print(f"[barrido] Latencia promedio LLM: {avg_latency:.0f}ms")
    print(f"[barrido] Tiempo total: {elapsed_total:.1f}s ({elapsed_total/60:.1f} min)")
    print(f"[barrido] Output JSON: {json_path}")
    print(f"[barrido] Output TXT (para agente contador): {txt_path}")
    print("=" * 60)

    if proxy_dead:
        sys.exit(2)
    if errors_count > len(queries) // 2:
        sys.exit(3)


if __name__ == "__main__":
    main()
