"""
pipeline/_shared.py — Primitivas compartidas entre validator y audit
─────────────────────────────────────────────────────────────────────
Fase 6.1 · 2026-04-20

Single source of truth para las constantes y helpers que usan al mismo
tiempo `pipeline/validator.py` (generación, S5 blocking) y
`scripts/audit_hallucinations.py` (diagnóstico post-hoc, H7 flagging).

Motivación del refactor:
Antes de Fase 6.1 cada archivo mantenía su copia de:
  · _levenshtein
  · _strip_accents
  · COMMON_TERMS
  · _ID_SUFFIX_RE + _id_root

Divergencia silenciosa = bug class: si validator aceptaba un ID que
audit flaggeaba (o viceversa), el comportamiento dependía del orden en
que se corría cada uno. Peor: los umbrales (S5_LEV_THRESHOLD vs
H7_LEV_THRESHOLD) podían desincronizarse sin que nada avisara.

Contrato:
- Este módulo NO tiene dependencias del pipeline (solo stdlib).
- Cambios a `COMMON_TERMS` deben pensarse para los dos contextos:
  * generación (blocking → falsos positivos cuestan regeneraciones)
  * audit (diagnostic → falsos positivos cuestan ruido en el reporte)
- `LEV_THRESHOLD` se comparte por default. Si alguna vez hace falta
  diferenciar blocking vs diagnostic, cada sitio puede tener su propia
  constante local que referencie a esta como base.
"""

from __future__ import annotations

import re
import unicodedata
from typing import List


# ─── Normalización ──────────────────────────────────────────────────────

def strip_accents(s: str) -> str:
    """Quita diacríticos. `mercádo` → `mercado`. Seguro con None/''"""
    if not s:
        return ""
    return "".join(
        c for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    )


# ─── Distancia de edición ──────────────────────────────────────────────

def levenshtein(a: str, b: str) -> int:
    """
    Distancia de edición clásica, iterativa.
    O(len(a)·len(b)) tiempo, O(min(len(a), len(b))) memoria.
    """
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    if len(a) < len(b):
        a, b = b, a
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        curr = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1):
            cost = 0 if ca == cb else 1
            curr[j] = min(
                curr[j - 1] + 1,        # insert
                prev[j] + 1,            # delete
                prev[j - 1] + cost,     # substitute
            )
        prev = curr
    return prev[-1]


# ─── Extracción canónica de la raíz de un entry ID ─────────────────────

# Sufijos semánticos canónicos (SIEMPRE en español; los suffixes spanglish
# tipo `_concept` los normaliza validator._fix_spanglish_id antes).
ID_SUFFIX_RE = re.compile(
    r"_(concepto|explicacion|definicion|tipos|ejemplo|teoria|enfoque|metodo)(?:_\d+)?$"
)


def id_root(entry_id: str) -> str:
    """
    Raíz semántica de un ID.
    `mercado_concepto_3` → `mercado`
    `marcado_concepto`   → `marcado`  (typo → H7/S5 decide)
    `bourdieu_teoria_2`  → `bourdieu`
    Normalizada sin acentos, lower, sin `_` finales.
    """
    if not entry_id:
        return ""
    low = entry_id.lower().strip()
    low = ID_SUFFIX_RE.sub("", low)
    low = re.sub(r"_+$", "", low)
    return strip_accents(low)


# ─── Vocabulario común del corpus FCE ──────────────────────────────────

# Distancia Levenshtein máxima para considerar typo-hallucination.
# 2 captura insert/delete/substitute clásicos (marcado↔mercado,
# contabilida↔contabilidad) sin explotar en falsos positivos.
LEV_THRESHOLD: int = 2

# Union curada de términos que aparecen con frecuencia en el KB de las
# 4 materias. Usado por:
#   · validator.py S5 (typo_hallucination, BLOCKING en generación)
#   · audit_hallucinations.py H7 (typo_hallucination, diagnostic post-hoc)
#
# Criterio de inclusión:
#   · término ≥ 4 chars (más cortos no son robustos a Levenshtein=2)
#   · aparece al menos en una unidad del programa FCE
#   · tiene raíz semántica clara (no compuestos tipo "partida doble")
#
# Los términos están en lowercase SIN acentos (id_root también normaliza),
# para que la comparación sea simétrica.
COMMON_TERMS: List[str] = [
    # ── Contabilidad ──────────────────────────────────────────────────
    "activo", "pasivo", "patrimonio", "cuenta", "balance",
    "debe", "haber", "debito", "credito",
    "asiento", "libro", "mayor", "diario",
    "ingreso", "egreso", "gasto", "capital",
    "inventario", "amortizacion", "depreciacion",
    "resultado", "ecuacion", "partida", "contabilidad", "informe",
    # ── Administración ────────────────────────────────────────────────
    "empresa", "organizacion", "planificacion", "direccion", "control",
    "liderazgo", "motivacion", "estrategia", "mercado", "cliente",
    "eficiencia", "eficacia", "calidad", "etica",
    "velocidad", "confiabilidad", "responsabilidad",
    "competitividad", "productividad",
    "gestion", "proceso", "sistema",
    # ── Sociales ──────────────────────────────────────────────────────
    "estado", "gobierno", "sociedad", "campo", "habitus",
    "agente", "agentes", "clase", "poder",
    "economia", "politica", "cultura", "ideologia", "trabajo",
    "dominio", "violencia", "simbolico",
    "institucion", "burocracia", "tradicion", "marxismo", "genesis",
    # ── Propedéutica / generales ──────────────────────────────────────
    "texto", "lectura", "escritura", "argumento",
    "concepto", "definicion", "teoria", "principio", "historia",
]


__all__ = [
    "strip_accents",
    "levenshtein",
    "ID_SUFFIX_RE",
    "id_root",
    "LEV_THRESHOLD",
    "COMMON_TERMS",
]
