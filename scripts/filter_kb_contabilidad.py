#!/usr/bin/env python3
"""
filter_kb_contabilidad.py — NEXUS Build solo-contabilidad para Trucco

Lee kb/knowledge_base.json (271 entries) y produce una versión filtrada
con solo las 173 entries de materia=Contabilidad. Sirve para el deploy
nexus-contabilidad.vercel.app.

Output: kb/knowledge_base.json sobreescrito (en branch trucco-only-contabilidad,
NO en main).

Uso:
    python3 scripts/filter_kb_contabilidad.py

Verificación post-filtrado:
    python3 -c "import json; kb=json.load(open('kb/knowledge_base.json')); print(kb['total_entries'], 'entries')"
"""
import json
import hashlib
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KB_IN = ROOT / "kb" / "knowledge_base.json"
KB_OUT = ROOT / "kb" / "knowledge_base.json"  # sobreescribe in-place

with open(KB_IN, "r", encoding="utf-8") as f:
    kb = json.load(f)

total_in = len(kb["entries"])
filtered = [e for e in kb["entries"] if e.get("materia") == "Contabilidad"]
total_out = len(filtered)

# Validación: 173 esperados según el conteo previo
if total_out != 173:
    print(f"⚠ Esperado 173 entries de Contabilidad, encontrado {total_out}")
    print("  No es bloqueante pero verificar antes de deploy.")

kb["entries"] = filtered
kb["total_entries"] = total_out
kb["materia"] = "Contabilidad"
kb["filter_applied"] = "solo_contabilidad_trucco"
kb["filter_date"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
kb["filter_origin_total"] = total_in

# Limpiar rejected si existe (no aplica al subset)
if "rejected" in kb:
    kb["rejected"] = [r for r in kb.get("rejected", []) if r.get("materia") == "Contabilidad"]

with open(KB_OUT, "w", encoding="utf-8") as f:
    json.dump(kb, f, ensure_ascii=False, indent=2)

# Verificación
size_out = KB_OUT.stat().st_size
md5 = hashlib.md5(KB_OUT.read_bytes()).hexdigest()

print(f"✓ KB filtrado generado")
print(f"  Input:  {total_in} entries totales")
print(f"  Output: {total_out} entries de Contabilidad")
print(f"  Size:   {size_out:,} bytes ({size_out/1024:.1f} KB)")
print(f"  MD5:    {md5}")
print()
print(f"Distribución de tipos en el KB filtrado:")
from collections import Counter
types = Counter(e.get("type", "unknown") for e in filtered)
for t, c in types.most_common():
    print(f"  {t:30s}: {c}")
