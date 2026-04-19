"""
NEXUS Pipeline — clean_ocr.py
─────────────────────────────────────────────────────────────────────
Fase 6.3 · 2026-04-20

Limpieza de output OCR crudo (tesseract, pypdf sobre scans, etc.) antes
de pasarlo al pipeline de ingest + generate_kb. Output sucio = alucinación
río abajo: si Mistral recibe `informa-\nción` se confunde y genera entries
basura (visto en Fase 2 con Sociales antes de tener scans buenos).

Calibrado contra sample real: `Capítulo 2 - Contabilidad Básica - Fowler
Newton` (Contabilidad U1, 21 páginas scan 200dpi + tesseract v4.1.1 spa).

Artefactos que limpia:
  · hyphens de corte de línea       `ba-\njo`        → `bajo`
  · headers repetidos               `CAP. 2 — CONTABILIDAD... 21`
  · páginas sueltas numéricas       `21\n`            → ``
  · líneas stray de 1-2 chars       `>`, `:`, `-`     → ``
  · whitespace colapsable           `  ` / `\n\n\n+` → ` ` / `\n\n`
  · typos OCR conocidos (curado)    `retetridos`     → `referidos`
  · footnote markers inline         `(*) (4) (5)`    → eliminados (opt-in)

Política:
  · Conservador por default. Reglas destructivas (typos, footnotes,
    headers) son opt-in via config; el default solo aplica transformaciones
    reversibles (dehyphen, whitespace).
  · No asume idioma. Las reglas son lingüísticamente agnósticas salvo
    por el diccionario de typos OCR, que está curado para español.
  · Pipelineable. `clean_ocr_text` compone funciones puras; cada una
    es testeable en isolación.

Uso:
    # CLI
    python pipeline/clean_ocr.py --in raw.txt --out clean.txt
    python pipeline/clean_ocr.py --in raw.txt --out clean.txt --strict

    # Como módulo
    from clean_ocr import clean_ocr_text, CleanConfig
    cleaned = clean_ocr_text(raw_text, CleanConfig(strict=True))

    # Self-test
    python pipeline/clean_ocr.py --self-test
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, List, Optional


# ─── Configuración ─────────────────────────────────────────────────────

@dataclass
class CleanConfig:
    """
    Flags para habilitar/deshabilitar reglas de limpieza.

    Default = solo reglas seguras (dehyphen + whitespace + stray 1-char lines).
    Strict = todas las reglas incluyendo las destructivas.
    """
    dehyphenate: bool = True
    normalize_whitespace: bool = True
    strip_stray_lines: bool = True
    # Reglas más agresivas (opt-in vía strict=True)
    fix_common_typos: bool = False
    strip_repeated_headers: bool = False
    strip_footnote_markers: bool = False
    strip_pure_number_lines: bool = False
    # Parámetros
    header_min_occurrences: int = 3       # líneas que aparecen ≥ N veces son headers
    stray_line_max_chars: int = 2         # líneas con ≤ N chars significativos se borran

    @classmethod
    def strict(cls) -> "CleanConfig":
        return cls(
            dehyphenate=True,
            normalize_whitespace=True,
            strip_stray_lines=True,
            fix_common_typos=True,
            strip_repeated_headers=True,
            strip_footnote_markers=True,
            strip_pure_number_lines=True,
        )


# ─── Diccionario de typos OCR conocidos ────────────────────────────────
# Curado empíricamente contra el sample real de Fowler Newton.
# Regla de oro: solo incluir typos que NO sean palabras válidas en español.
# Ej: `retetridos` no es palabra → safe to fix; `marcado` SÍ es palabra
# (aunque en KB Sociales apareció como typo de `mercado`) → NO meter acá,
# que el validator S5 lo flaggee.
OCR_TYPO_DICT = {
    # Calibrados empíricamente contra Fowler Newton (Contabilidad U1) 2026-04-20.
    # Todos confirmados como NO siendo palabras válidas en español.
    # Solo keys con chars alfanuméricos — palabras con puntuación van a
    # OCR_TYPO_PATTERNS (porque \b no cuenta como word boundary entre dos
    # caracteres no-word, rompiendo el regex genérico).
    "reteridos":   "referidos",    # rete-\nridos en el scan
    "párrato":     "párrafo",      # t por f, clásico OCR
    "¿ctividades": "actividades",  # "a" leída como "¿"
    "aparéce":     "aparece",      # tilde espuria
}
# Reglas de patching posicional. Se aplican con regex explícita cuando el
# typo involucra chars no-word (puntuación, quotes) o espacios perdidos.
OCR_TYPO_PATTERNS = [
    # `oa` aislado entre palabras → `o a` (conector + artículo).
    # Espacio perdido entre conjunción + vocal inicial es frecuente post-OCR.
    (re.compile(r"\b([a-záéíóúñ]+)\s+oa\s+([a-záéíóúñ]+)\b", re.IGNORECASE),
     r"\1 o a \2"),
    # Quote mark espurio adherido a palabra: `terceros"en` → `terceros en`.
    # Solo aplica al MEDIO de una secuencia palabra-quote-palabra para no
    # tocar citas legítimas al inicio/final (`"hola"` queda igual).
    (re.compile(r'([a-záéíóúñ])"([a-záéíóúñ])', re.IGNORECASE),
     r"\1 \2"),
    # `principa!` → `principal`: `!` como OCR confusion por `l` al final.
    # Lookbehind word-char + `!` al final (fin de palabra o frase).
    (re.compile(r"\bprincipa!", re.IGNORECASE), "principal"),
]


# ─── Primitivas de limpieza ────────────────────────────────────────────

_HYPHEN_LINE_BREAK_RE = re.compile(r"(\w+)-\s*\n\s*(\w+)")


def dehyphenate(text: str) -> str:
    """
    Une palabras cortadas por hyphen al final de línea.
    `ba-\njo` → `bajo`. No toca compuestos hyphenados legítimos
    (`auto-evaluación`) porque esos NO tienen \n en medio.
    """
    return _HYPHEN_LINE_BREAK_RE.sub(r"\1\2", text)


_MULTI_SPACE_RE = re.compile(r"[ \t]+")
_MULTI_NEWLINE_RE = re.compile(r"\n{3,}")
_TRAILING_SPACE_RE = re.compile(r"[ \t]+\n")


def normalize_whitespace(text: str) -> str:
    """
    Colapsa espacios múltiples → 1 espacio.
    Colapsa 3+ newlines → 2 newlines (preserva párrafos).
    Strip trailing spaces al final de cada línea.
    """
    text = _TRAILING_SPACE_RE.sub("\n", text)
    text = _MULTI_SPACE_RE.sub(" ", text)
    text = _MULTI_NEWLINE_RE.sub("\n\n", text)
    return text.strip() + "\n"


def strip_stray_lines(text: str, max_chars: int = 2) -> str:
    """
    Remueve líneas con ≤ max_chars caracteres significativos (alfanuméricos).
    Los OCR típicamente dejan `>`, `:`, `- -` sueltos como ruido.
    No afecta líneas de párrafo legítimo ni líneas en blanco (que son
    separadores importantes).
    """
    out: List[str] = []
    for line in text.split("\n"):
        if not line.strip():
            out.append(line)
            continue
        # Contar solo alfanuméricos (ignora puntuación y whitespace)
        meaningful = sum(1 for c in line if c.isalnum())
        if meaningful > max_chars:
            out.append(line)
    return "\n".join(out)


# ─── Reglas destructivas (opt-in) ──────────────────────────────────────

def fix_common_typos(text: str) -> str:
    """
    Aplica el diccionario OCR_TYPO_DICT + patrones posicionales.
    Solo toca typos claros (no palabras válidas en español).
    """
    # Diccionario simple
    for wrong, right in OCR_TYPO_DICT.items():
        if wrong == right:
            continue
        # Word-boundary para no romper compuestos
        pattern = re.compile(r"\b" + re.escape(wrong) + r"\b", re.IGNORECASE)
        text = pattern.sub(right, text)
    # Patrones posicionales
    for pattern, replacement in OCR_TYPO_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def strip_repeated_headers(text: str, min_occurrences: int = 3) -> str:
    """
    Detecta líneas que aparecen ≥ min_occurrences veces en el documento
    (típicamente page headers/footers tipo `CAP. 2 — CONTABILIDAD... 21`).

    Solo considera líneas de 10-80 chars como candidatas a header (muy cortas
    son legítimas repetidas, muy largas son párrafos).

    Tolera variación de número de página al final: `CAP. 2 ... 21`,
    `CAP. 2 ... 22`, etc., se normalizan quitando dígitos para el conteo.
    """
    lines = text.split("\n")
    # Normalizar para contar (quita números al final de línea)
    def norm(line: str) -> str:
        return re.sub(r"\s*\d+\s*$", "", line.strip())

    counter = Counter(norm(line) for line in lines
                      if 10 <= len(line.strip()) <= 80)
    headers = {h for h, c in counter.items() if c >= min_occurrences and h}

    if not headers:
        return text

    out = []
    for line in lines:
        if norm(line) in headers:
            continue  # skip header
        out.append(line)
    return "\n".join(out)


_FOOTNOTE_MARKER_RE = re.compile(
    r"\s*\((?:\*+|\d{1,3})\)",  # (*), (**), (1), (23), ...
)


def strip_footnote_markers(text: str) -> str:
    """
    Remueve markers inline tipo `(*)`, `(4)`, `(23)`.
    PELIGROSO: puede romper enumeraciones legítimas `(1) primera opción`.
    Solo opt-in bajo strict=True y cuando el corpus lo amerita.
    """
    return _FOOTNOTE_MARKER_RE.sub("", text)


_PURE_NUMBER_LINE_RE = re.compile(r"^\s*\d+\s*$")


def strip_pure_number_lines(text: str) -> str:
    """
    Remueve líneas que son SOLO un número (típicamente page numbers).
    Preserva números inline dentro de párrafos.
    """
    return "\n".join(
        line for line in text.split("\n")
        if not _PURE_NUMBER_LINE_RE.match(line)
    )


# ─── Pipeline ──────────────────────────────────────────────────────────

def clean_ocr_text(text: str, config: Optional[CleanConfig] = None) -> str:
    """
    Entry point. Aplica el pipeline de limpieza sobre text crudo.
    Orden de operaciones es significativo: dehyphenate antes de
    strip_stray_lines (si no, `ba-` suelta en una línea se consideraría stray).
    """
    if config is None:
        config = CleanConfig()

    if not text:
        return ""

    # 1) Dehyphenate PRIMERO — todo lo demás opera sobre palabras completas.
    if config.dehyphenate:
        text = dehyphenate(text)

    # 2) Typos (antes de whitespace collapse, que puede preservar tokens raros)
    if config.fix_common_typos:
        text = fix_common_typos(text)

    # 3) Headers repetidos (antes de stray, que podría dejar vestigios)
    if config.strip_repeated_headers:
        text = strip_repeated_headers(text, config.header_min_occurrences)

    # 4) Números puros y markers de footnote
    if config.strip_pure_number_lines:
        text = strip_pure_number_lines(text)
    if config.strip_footnote_markers:
        text = strip_footnote_markers(text)

    # 5) Stray lines y whitespace al final (resetean todo lo anterior)
    if config.strip_stray_lines:
        text = strip_stray_lines(text, config.stray_line_max_chars)
    if config.normalize_whitespace:
        text = normalize_whitespace(text)

    return text


# ─── Self-test ─────────────────────────────────────────────────────────

def _expect(name: str, got, want):
    if got == want:
        print(f"  ✓ {name}")
    else:
        print(f"  ✗ {name}")
        print(f"      got:  {got!r}")
        print(f"      want: {want!r}")
        raise AssertionError(name)


def _run_self_test() -> int:
    print("[clean_ocr self-test]")

    # ── dehyphenate ──
    _expect("dehyphenate simple",
            dehyphenate("ba-\njo"), "bajo")
    _expect("dehyphenate preserva hyphens legítimos",
            dehyphenate("auto-evaluación"), "auto-evaluación")
    _expect("dehyphenate con espacios alrededor del newline",
            dehyphenate("infor-  \n  mación"), "información")

    # ── normalize_whitespace ──
    _expect("collapse spaces",
            normalize_whitespace("hola   mundo"), "hola mundo\n")
    _expect("collapse triple newlines",
            normalize_whitespace("a\n\n\n\nb"), "a\n\nb\n")
    _expect("trim trailing spaces",
            normalize_whitespace("hola  \nmundo  \n"), "hola\nmundo\n")

    # ── strip_stray_lines ──
    _expect("remove 1-char stray",
            strip_stray_lines("hola\n>\nmundo"), "hola\nmundo")
    _expect("preserva blanks",
            strip_stray_lines("hola\n\nmundo"), "hola\n\nmundo")
    _expect("preserva palabra corta legítima",  # 3+ alphanum
            strip_stray_lines("hola\nsol\nmundo"), "hola\nsol\nmundo")

    # ── fix_common_typos ──
    _expect("fix reteridos",
            fix_common_typos("datos reteridos a página"),
            "datos referidos a página")
    _expect("fix oa → o a",
            fix_common_typos("recesión generalizada oa otras razones"),
            "recesión generalizada o a otras razones")
    _expect("fix terceros\"en → terceros en",
            fix_common_typos('bienes de terceros"en poder'),
            "bienes de terceros en poder")
    _expect("fix principa! → principal",
            fix_common_typos("no el principa!"),
            "no el principal")

    # ── strip_repeated_headers ──
    repeated = "CAP. 2 CONTABILIDAD 21\ncontenido\nCAP. 2 CONTABILIDAD 22\ncontenido\nCAP. 2 CONTABILIDAD 23\nfin"
    _expect("remove headers (3+ occ, variable page num)",
            strip_repeated_headers(repeated, min_occurrences=3),
            "contenido\ncontenido\nfin")

    # ── strip_footnote_markers ──
    _expect("remove (*) y (4)",
            strip_footnote_markers("ver ilustración (4) y nota (*)"),
            "ver ilustración y nota")

    # ── strip_pure_number_lines ──
    _expect("remove pure number line",
            strip_pure_number_lines("párrafo\n21\nsigue"),
            "párrafo\nsigue")
    _expect("preserva números inline",
            strip_pure_number_lines("año 2026 fue especial"),
            "año 2026 fue especial")

    # ── pipeline integrado ──
    sample = (
        "CAP. 2 — CONTABILIDAD E INFORMACION CONTABLE 21\n"
        "\n"
        "a) para evaluar la productividad de una máqui-\n"
        "na cuya adquisición se encuentra ba-\n"
        "jo estudio (*)\n"
        "\n"
        ">\n"
        "CAP. 2 — CONTABILIDAD E INFORMACION CONTABLE 22\n"
        "\n"
        "Así, los datos reteridos a la mayoría de recursos.\n"
        "\n"
        "CAP. 2 — CONTABILIDAD E INFORMACION CONTABLE 23\n"
    )
    cleaned = clean_ocr_text(sample, CleanConfig.strict())
    # Debería haber eliminado headers, dehyphenated, fix typo, removed (*)
    assert "CAP. 2" not in cleaned, f"header no eliminado: {cleaned!r}"
    assert "ba-\njo" not in cleaned and "bajo" in cleaned, f"dehyphen falló: {cleaned!r}"
    assert "retetridos" not in cleaned and "referidos" in cleaned, f"typo no fixeado"
    assert "(*)" not in cleaned, f"footnote marker no removido"
    assert ">" not in cleaned, f"stray char no removido"
    print("  ✓ pipeline integrado sobre sample Fowler-like")

    # ── default config (no strict) ──
    sample_default = "texto con ba-\njo y retetridos adentro"
    cleaned_default = clean_ocr_text(sample_default)  # default config
    assert "bajo" in cleaned_default, "dehyphen debe estar ON by default"
    assert "retetridos" in cleaned_default, "fix_typos NO debe estar ON by default"
    print("  ✓ default config aplica solo reglas seguras")

    print("[clean_ocr self-test] ✓ todos los checks pasaron")
    return 0


# ─── CLI ───────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="OCR output cleaner")
    parser.add_argument("--in", dest="input_path", help="archivo de entrada (texto OCR crudo)")
    parser.add_argument("--out", dest="output_path", help="archivo de salida (texto limpio)")
    parser.add_argument("--strict", action="store_true",
                        help="aplica todas las reglas (default: solo safe)")
    parser.add_argument("--self-test", action="store_true",
                        help="corre la batería de tests y sale")
    args = parser.parse_args()

    if args.self_test:
        return _run_self_test()

    if not args.input_path:
        parser.error("--in es requerido salvo con --self-test")

    in_path = Path(args.input_path)
    if not in_path.exists():
        print(f"ERROR: {in_path} no existe", file=sys.stderr)
        return 1

    raw = in_path.read_text(encoding="utf-8", errors="replace")
    config = CleanConfig.strict() if args.strict else CleanConfig()
    cleaned = clean_ocr_text(raw, config)

    if args.output_path:
        Path(args.output_path).write_text(cleaned, encoding="utf-8")
        delta = len(raw) - len(cleaned)
        ratio = 100.0 * delta / max(1, len(raw))
        print(f"✓ escribí {args.output_path}")
        print(f"  · input:  {len(raw):>8d} chars")
        print(f"  · output: {len(cleaned):>8d} chars  (−{delta} chars · {ratio:.1f}% reducción)")
    else:
        sys.stdout.write(cleaned)

    return 0


if __name__ == "__main__":
    sys.exit(main())
