#!/usr/bin/env python3
"""
build_trucco.py — Build separado para Trucco · solo-contabilidad

Workflow:
  1. Correr `node scripts/build.js` primero (genera dist/ normal)
  2. Correr este script: modifica dist/ in-place
     - Filtra dist/kb/knowledge_base.json a 173 entries de Contabilidad
     - Inyecta banner "actualizado tras feedback de auditor académico"
     - Cambia title del HTML
  3. Deploy: vercel deploy --prod desde el repo (apunta a dist/)

Resultado: dist/ queda como build solo-contabilidad listo para deploy
a un proyecto Vercel separado (nexus-contabilidad.vercel.app).

IMPORTANTE: NO PUSHEAR dist/ modificado al main del repo. Esto se ejecuta
en branch trucco-contabilidad o se deploya directo via Vercel CLI sin
commitear.
"""
import json
import re
import hashlib
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

# ── Validación ──────────────────────────────────────────────────────────
if not DIST.exists():
    raise SystemExit("ERROR: dist/ no existe. Correr primero: node scripts/build.js")

KB_PATH = DIST / "kb" / "knowledge_base.json"
HTML_PATH = DIST / "index.html"

if not KB_PATH.exists():
    raise SystemExit(f"ERROR: {KB_PATH} no encontrado")
if not HTML_PATH.exists():
    raise SystemExit(f"ERROR: {HTML_PATH} no encontrado")


# ── 1. Filtrar KB a Contabilidad solo ──────────────────────────────────
print("[1/3] Filtrando KB a materia=Contabilidad...")
with open(KB_PATH, "r", encoding="utf-8") as f:
    kb = json.load(f)

total_in = len(kb["entries"])
filtered = [e for e in kb["entries"] if e.get("materia") == "Contabilidad"]
total_out = len(filtered)

kb["entries"] = filtered
kb["total_entries"] = total_out
kb["materia"] = "Contabilidad"
kb["filter_applied"] = "solo_contabilidad_trucco"
kb["filter_date"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
kb["filter_origin_total"] = total_in
if "rejected" in kb:
    kb["rejected"] = [r for r in kb.get("rejected", []) if r.get("materia") == "Contabilidad"]

with open(KB_PATH, "w", encoding="utf-8") as f:
    json.dump(kb, f, ensure_ascii=False, indent=2)

print(f"   ✓ {total_in} → {total_out} entries (Contabilidad)")


# ── 2. Modificar HTML: title + banner ──────────────────────────────────
print("[2/3] Modificando HTML: title + banner...")
with open(HTML_PATH, "r", encoding="utf-8") as f:
    html = f.read()

# Cambiar title
new_title = "<title>NEXUS Contabilidad · Versión Auditor Académico</title>"
html = re.sub(r"<title>[^<]*</title>", new_title, html, count=1)

# Inyectar banner después del primer <body...>
# IMPORTANTE: el body del Portal FCE usa display:flex (sidebar + main).
# Si el banner se inyecta como hijo directo del body sin position:fixed,
# se vuelve un flex item columna y ocupa la mitad izquierda de la pantalla.
# Solución: position:fixed arriba + padding-top en body para no tapar contenido.
banner_html = '''<!-- ── BANNER TRUCCO BUILD ─────────────────────────────── -->
<style id="trucco-body-padding">body{padding-top:48px !important}</style>
<div id="trucco-banner" style="
  position:fixed;
  top:0;
  left:0;
  right:0;
  z-index:99999;
  background:linear-gradient(135deg, #c8651b 0%, #9e4d14 100%);
  color:#fff;
  padding:12px 24px;
  font-family:'Inter','DM Sans','Segoe UI',sans-serif;
  font-size:13px;
  text-align:center;
  border-bottom:2px solid rgba(0,0,0,0.15);
  box-shadow:0 2px 8px rgba(0,0,0,0.15)">
  <strong style="font-weight:700;letter-spacing:0.02em">Versión Contabilidad</strong>
  &nbsp;·&nbsp;
  <span style="opacity:0.95">Actualizado tras feedback de auditor académico</span>
  &nbsp;·&nbsp;
  <span style="opacity:0.85;font-size:12px">Citas verificadas literalmente desde RT 16, RT 54 NUA e IASB Marco Conceptual</span>
</div>
<!-- ──────────────────────────────────────────────────────── -->
'''

m = re.search(r"<body[^>]*>", html)
if m:
    insert_pos = m.end()
    html = html[:insert_pos] + "\n" + banner_html + html[insert_pos:]
    print("   ✓ Banner inyectado después de <body>")
else:
    raise SystemExit("ERROR: no se encontró <body> en index.html")

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html)


# ── 3. Verificación final ──────────────────────────────────────────────
print("[3/3] Verificación final...")
size_html = HTML_PATH.stat().st_size
size_kb = KB_PATH.stat().st_size
md5_html = hashlib.md5(HTML_PATH.read_bytes()).hexdigest()

# Verifica el banner está presente
with open(HTML_PATH, "r", encoding="utf-8") as f:
    h = f.read()
banner_ok = "trucco-banner" in h
title_ok = "NEXUS Contabilidad" in h

print(f"   ✓ HTML:  {size_html:,} bytes ({size_html/1024:.1f} KB)  md5={md5_html[:16]}")
print(f"   ✓ KB:    {size_kb:,} bytes ({size_kb/1024:.1f} KB)  {total_out} entries")
print(f"   ✓ Banner inyectado: {banner_ok}")
print(f"   ✓ Title cambiado: {title_ok}")
print()
print("Build solo-contabilidad LISTO en dist/")
print("Próximo paso: vercel deploy --prod desde la raíz del repo.")
