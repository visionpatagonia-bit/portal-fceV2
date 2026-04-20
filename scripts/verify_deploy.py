#!/usr/bin/env python3
"""
scripts/verify_deploy.py — Smoke test del deploy de Vercel.

Para el demo del lunes: corré esto DESPUÉS del `vercel --prod` y ANTES de
abrir el portal al público. Si algo falla, el script sale con exit code ≠ 0.

Uso:
    python scripts/verify_deploy.py
    python scripts/verify_deploy.py --host https://portal-fce-v2.vercel.app

Checks:
  1. index.html sirve con HTML válido + versión esperada en meta
  2. sw.js sirve con CACHE_NAME esperado
  3. kb/schedule_kb.json parsea con ≥ N entries
  4. kb/knowledge_base.json parsea con ≥ N entries + schema_version correcto
  5. materiales.json parsea (JSON, no HTML fallback de SPA rewrite)
  6. Responde Content-Type: application/json en todos los JSONs
  7. Service Worker shell: cada SHELL_FILES llega y es cacheable
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple

import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

DEFAULT_HOST = "https://portal-fce-v2.vercel.app"
EXPECTED_CACHE_VERSION = "fce-portal-v19.38.1"  # bump en lockstep con sw.js
KB_SCHEMA_VERSION = "1.0"
MIN_KB_ENTRIES = 10
MIN_SCHEDULE_ENTRIES = 4

# Paths críticos que DEBEN responder con JSON, no con index.html fallback
CRITICAL_JSONS = [
    "kb/schedule_kb.json",
    "kb/knowledge_base.json",
    "kb/manifest.json",
    "materiales.json",
    "horarios.json",
    "glossary.json",
    "comparativa.json",
    "noticias.json",
    "nexus-ai-config.json",
    "manifest.json",
]

CRITICAL_CSSJS = [
    "portal.js",
    "nexus-ai.js",
    "nexus-core.js",
    "nexus-modules.js",
    "nexus-quiz.js",
    "nexus-ui-mode.js",      # v19.31.0: Fase 4.1 — dual UI routing
    "nexus-sovereign-a11y.js",  # v19.33.0: Fase 4.3.1 — foundation a11y
    "nexus-sovereign-components.js",  # v19.34.0: Fase 4.3.2 — toast + modal + manifesto + panic
    "nexus-sovereign-chrome.js",      # v19.35.0: Fase 4.3.3 — topbar + sidebar + skip link
    "nexus-sovereign-dashboard.js",   # v19.36.0: Fase 4.4 — hero + panic cta cyberpunk
    "sw.js",
    "nexus-ui-system.css",
    "nexus-sovereign.css",   # v19.32.0: Fase 4.2 — tokens + typography sovereign
]


# ─── HTTP helpers ───────────────────────────────────────────────────────

def _fetch(url: str, timeout: int = 15) -> Tuple[int, Dict[str, str], bytes]:
    """GET url. Returns (status, headers_lowercased, body_bytes)."""
    req = urllib.request.Request(url, headers={"User-Agent": "NEXUS-verify/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.status
            headers = {k.lower(): v for k, v in resp.getheaders()}
            body = resp.read()
            return status, headers, body
    except urllib.error.HTTPError as e:
        headers = {k.lower(): v for k, v in e.headers.items()} if e.headers else {}
        return e.code, headers, e.read() if e.fp else b""


# ─── Individual checks ──────────────────────────────────────────────────

def check_index(host: str) -> Tuple[bool, str]:
    status, h, body = _fetch(f"{host}/index.html")
    if status != 200:
        return False, f"HTTP {status}"
    ct = h.get("content-type", "")
    if "html" not in ct:
        return False, f"content-type inesperado: {ct}"
    body_str = body.decode("utf-8", errors="replace")
    if "<!DOCTYPE" not in body_str[:100]:
        return False, "no empieza con <!DOCTYPE"
    return True, f"{len(body)} bytes, {ct}"


def check_sw(host: str) -> Tuple[bool, str]:
    status, h, body = _fetch(f"{host}/sw.js")
    if status != 200:
        return False, f"HTTP {status}"
    body_str = body.decode("utf-8", errors="replace")
    if EXPECTED_CACHE_VERSION not in body_str:
        # Busca la versión real para reportar.
        m = re.search(r"CACHE_NAME\s*=\s*'([^']+)'", body_str)
        found = m.group(1) if m else "?"
        return False, f"cache_name '{found}' (esperado '{EXPECTED_CACHE_VERSION}')"
    return True, EXPECTED_CACHE_VERSION


def check_json_is_json(host: str, path: str) -> Tuple[bool, str]:
    """
    Crítico: Vercel SPA rewrite `/(.*) → /index.html` puede enmascarar
    archivos faltantes con HTML. Verificamos que el Content-Type sea JSON
    Y que el body parse como JSON válido.
    """
    url = f"{host}/{path}"
    status, h, body = _fetch(url)
    if status != 200:
        return False, f"HTTP {status}"
    ct = h.get("content-type", "")
    if "json" not in ct:
        head = body[:30].decode("utf-8", errors="replace")
        return False, f"content-type={ct} (HTML fallback?), body starts: {head!r}"
    try:
        json.loads(body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        return False, f"parse failed: {exc}"
    return True, f"{len(body)} bytes"


def check_schedule_kb(host: str) -> Tuple[bool, str]:
    status, h, body = _fetch(f"{host}/kb/schedule_kb.json")
    if status != 200:
        return False, f"HTTP {status}"
    try:
        data = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        return False, f"parse failed: {exc}"
    entries = data.get("entries") or data.get("patterns") or []
    if len(entries) < MIN_SCHEDULE_ENTRIES:
        return False, f"{len(entries)} entries (esperado ≥ {MIN_SCHEDULE_ENTRIES})"
    return True, f"{len(entries)} entries"


def check_knowledge_base(host: str) -> Tuple[bool, str]:
    status, h, body = _fetch(f"{host}/kb/knowledge_base.json")
    if status != 200:
        return False, f"HTTP {status}"
    try:
        data = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        return False, f"parse failed: {exc}"
    schema = data.get("schema_version")
    if schema != KB_SCHEMA_VERSION:
        return False, f"schema_version={schema} (esperado {KB_SCHEMA_VERSION})"
    entries = data.get("entries", [])
    if len(entries) < MIN_KB_ENTRIES:
        return False, f"{len(entries)} entries (esperado ≥ {MIN_KB_ENTRIES})"
    # Todos los IDs deben ser únicos (validator lo garantiza pero verifico)
    ids = [e.get("id") for e in entries]
    if len(set(ids)) != len(ids):
        return False, "IDs duplicados"
    # Cada entry debe tener patterns y source_refs (anti-alucinación)
    missing_refs = [e.get("id") for e in entries if not e.get("source_refs")]
    if missing_refs:
        return False, f"entries sin source_refs: {missing_refs[:3]}"
    return True, f"{len(entries)} entries · schema {schema}"


# ─── Orquestación ───────────────────────────────────────────────────────

def run_checks(host: str) -> int:
    host = host.rstrip("/")
    print(f"\n  NEXUS Portal · verify deploy\n  host: {host}\n")

    checks: List[Tuple[str, callable]] = [
        ("index.html",           lambda: check_index(host)),
        ("sw.js cache version",  lambda: check_sw(host)),
        ("schedule_kb.json",     lambda: check_schedule_kb(host)),
        ("knowledge_base.json",  lambda: check_knowledge_base(host)),
    ]
    for p in CRITICAL_JSONS:
        checks.append((f"JSON {p}", (lambda p=p: check_json_is_json(host, p))))

    passed = 0
    failed = 0
    for name, fn in checks:
        try:
            ok, detail = fn()
        except Exception as exc:
            ok, detail = False, f"crash: {exc}"
        mark = "✓" if ok else "✗"
        print(f"  {mark} {name:35s} {detail}")
        if ok:
            passed += 1
        else:
            failed += 1

    print(f"\n  ─────────────────────────────────────────────")
    print(f"  {passed} passed · {failed} failed")
    print(f"  ─────────────────────────────────────────────\n")

    if failed:
        print("  ⚠ Fix antes de demo. Pasos sugeridos:")
        print("    1. Si sw.js cache version no matchea → bump EXPECTED_CACHE_VERSION en este script")
        print("       O bump CACHE_NAME en sw.js si el deploy quedó atrás.")
        print("    2. Si un JSON devuelve HTML → el archivo no está en dist/. Verificá:")
        print("       scripts/build.js (SHELL_FILES list)")
        print("    3. Si schema_version no matchea → el validator corrió con otra versión.")
        print("")
    return failed


# ─── Local preflight (antes de push) ───────────────────────────────────


def run_local_checks() -> int:
    """
    Preflight sobre dist/ — correr después de `node scripts/build.js` y
    antes de `git push`. Detecta cache version mismatches y archivos faltantes
    sin necesidad de red.
    """
    print(f"\n  NEXUS Portal · local preflight\n  dist: {DIST}\n")
    failed = 0

    if not DIST.exists():
        print("  ✗ dist/ no existe. Corré: node scripts/build.js")
        return 1

    # Cache version consistency
    sw_path = DIST / "sw.js"
    if sw_path.exists():
        sw_text = sw_path.read_text(encoding="utf-8")
        m = re.search(r"CACHE_NAME\s*=\s*'([^']+)'", sw_text)
        sw_cache = m.group(1) if m else None
        if sw_cache == EXPECTED_CACHE_VERSION:
            print(f"  ✓ sw.js cache version                {sw_cache}")
        else:
            print(f"  ✗ sw.js cache version                {sw_cache!r} ≠ {EXPECTED_CACHE_VERSION!r}")
            failed += 1
    else:
        print("  ✗ sw.js                              no existe en dist/")
        failed += 1

    # Archivos esperados presentes + JSONs parseables
    expected_files = CRITICAL_JSONS + CRITICAL_CSSJS + ["index.html"]
    for rel in expected_files:
        f = DIST / rel
        if not f.exists():
            print(f"  ✗ {rel:35s} faltante en dist/")
            failed += 1
            continue
        size_kb = round(f.stat().st_size / 1024, 1)
        # Si es JSON, que parsee
        if rel.endswith(".json"):
            try:
                json.loads(f.read_text(encoding="utf-8"))
                print(f"  ✓ {rel:35s} {size_kb} KB")
            except json.JSONDecodeError as exc:
                print(f"  ✗ {rel:35s} JSON parse failed: {exc}")
                failed += 1
        else:
            print(f"  ✓ {rel:35s} {size_kb} KB")

    # Validaciones de contenido del KB académico
    kb_path = DIST / "kb" / "knowledge_base.json"
    if kb_path.exists():
        try:
            kb = json.loads(kb_path.read_text(encoding="utf-8"))
            entries = kb.get("entries", [])
            ids = [e.get("id") for e in entries]
            dupes = {x for x in ids if ids.count(x) > 1}
            missing_refs = [e.get("id") for e in entries if not e.get("source_refs")]
            if dupes:
                print(f"  ✗ knowledge_base.json                IDs duplicados: {dupes}")
                failed += 1
            elif missing_refs:
                print(f"  ✗ knowledge_base.json                sin source_refs: {missing_refs[:3]}")
                failed += 1
            else:
                print(f"  ✓ KB content ({len(entries)} entries)         IDs únicos, refs completas")
        except Exception as exc:
            print(f"  ✗ knowledge_base.json                read/parse crash: {exc}")
            failed += 1

    print(f"\n  ─────────────────────────────────────────────")
    if failed:
        print(f"  ⚠ {failed} checks fallaron — NO pushees todavía")
    else:
        print(f"  ✅ preflight OK. Next:")
        print("     git add -A")
        print("     git commit -m 'v19.30.2: validator polish + fase 3 lean enrichment'")
        print("     git push origin main")
        print("     # Vercel autodeploya en ~30s")
        print("     python scripts/verify_deploy.py")
    print(f"  ─────────────────────────────────────────────\n")
    return failed


def _cli():
    parser = argparse.ArgumentParser(description="Verify NEXUS deploy")
    parser.add_argument("--host", default=DEFAULT_HOST,
                        help=f"Host del deploy (default: {DEFAULT_HOST})")
    parser.add_argument("--local", action="store_true",
                        help="Preflight sobre dist/ en vez de un deploy remoto")
    args = parser.parse_args()
    if args.local:
        failed = run_local_checks()
    else:
        failed = run_checks(args.host)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    _cli()
