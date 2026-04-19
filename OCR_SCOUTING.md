# OCR Scouting — Itinerario I Contabilidad U1

> **Generado:** domingo 19 abril 2026
> **Scope:** 2 PDFs scan-puros de Contabilidad Itinerario I (U1)
> **Fase:** scouting únicamente — no toca el KB. El OCR real se ejecuta post-demo (lunes 20 a la noche o martes 21).

---

## 📦 Inventario

| # | Archivo | Tamaño | Páginas | Estado | Extracción pypdf |
|---|---|---|---|---|---|
| 1 | `Capítulo 2  - Contabilidad Básica -  Enrique Fowler Newton.pdf` | 2.6 MB | 21 | Scan puro (Nitro Pro) | 0 chars |
| 2 | `Conociendo-la-contabilidad-2da-edision-telese - CAP II_.pdf` | 6.1 MB | 16 | Scan puro (Nitro Pro 8) | 0 chars |
| | **Total** | **8.7 MB** | **37** | | |

Ambos PDFs fueron digitalizados con Nitro Pro (sin OCR embebido). Las páginas son imágenes crudas — `pypdf.extract_text()` devuelve strings vacíos en 5/5 muestras.

---

## 🧪 Pilot OCR — resultados

### Tooling disponible en el sandbox

| Herramienta | Versión | Status |
|---|---|---|
| Tesseract | 4.1.1 + Leptonica 1.82 | ✅ ok |
| pdftoppm (Poppler) | presente | ✅ ok |
| spa.traineddata | 2.3 MB | ✅ descargado a `~/.tessdata/spa.traineddata` desde github.com/tesseract-ocr/tessdata_fast |
| ocrmypdf | instalado via pip | ❌ falla por deps faltantes (hocr render) — no usar |

**Decisión:** pipeline manual `pdftoppm → tesseract` (ya validado en pilot).

### Samples extraídos

**Fowler p2** (1122 chars extraídos):
```
CAPITULO 2
CONTABILIDAD E INFORMACION CONTABLE
2,1. INTRODUCCION
En este capítulo nos referiremos a:
a) la caracterización de la contabilidad y su integración dentro de los sis-
temas de las organizaciones (§ 2,2 a 2,7);
...
```

**Telese p3** (5657 chars — página densa con cita larga de Sanders):
```
CONOCIENDO LA CONTABILIDAD
«Quien no conoce el pasado, difícilmente entenderá el presente...»
2. PRIMERA ETAPA DE LA HISTORIA DE LA CONTABILIDAD
«Mucho antes de la aparición de las universidades, mucho antes de que los
sofistas griegos inventaran las escuelas, Platón fundara su academia...»
```

### Calidad observada

- ✅ Tildes y ñ detectadas correctamente en cuerpo del texto.
- ✅ Estructura de listas (a/b/c, numeración) preservada.
- ⚠ Mayúsculas sin tilde (CAPITULO en vez de CAPÍTULO) — mejora con `--psm 3` vs `--psm 6`.
- ⚠ Símbolo § a veces sale como $ — recomendable post-proceso regex `\$ (?=\d,\d)` → `§ `.
- ⚠ Comillas « » detectadas correctamente; pero algunas comas son apóstrofes parásitos.

### Tiempos

| Etapa | Fowler (21 pg) | Telese (16 pg) | Total |
|---|---|---|---|
| Rasterizar @ 300 DPI | ~70s | ~60s | ~2.2 min |
| OCR tesseract `-l spa` | ~100s | ~80s | ~3 min |
| **Total estimado end-to-end** | ~3 min | ~2.5 min | **~5-6 min** |

Sandbox o máquina local: tiempo comparable (Tesseract es single-thread, la mayoría del CPU va en OCR). En PowerShell de Juan debería ser idéntico con Tesseract for Windows.

---

## 🏗️ Pipeline propuesto

```bash
# 1. Preparar
export TESSDATA_PREFIX="$HOME/.tessdata"
OUTDIR="pipeline/ocr_out/itinerario_I"
mkdir -p "$OUTDIR"

# 2. Para cada PDF: rasterizar → OCR → concatenar
for PDF in "Materiales/CONTABILIDAD/Itinerario I"/*.pdf; do
  NAME=$(basename "$PDF" .pdf | tr ' ' '_')
  TMPDIR=$(mktemp -d)
  pdftoppm -r 300 "$PDF" "$TMPDIR/page" -png
  for IMG in "$TMPDIR"/page-*.png; do
    tesseract "$IMG" "${IMG%.png}" -l spa --psm 3 --oem 1
  done
  cat "$TMPDIR"/page-*.txt > "$OUTDIR/${NAME}.txt"
  rm -rf "$TMPDIR"
done

# 3. Post-proceso básico (Python)
python pipeline/clean_ocr.py --in "$OUTDIR" --out "pipeline/chunks/"
# Normaliza: \$ → §, dedoble de puntuación, join de hyphenated line-breaks (ej. "sis-\ntemas" → "sistemas")

# 4. Ingesta al pipeline existente
python pipeline/run_pipeline.py --append-kb \
  --materia "Contabilidad" \
  --chunks "pipeline/chunks/capitulo_2_fowler_newton.json" \
  --chunks "pipeline/chunks/conociendo_telese.json"
```

El paso #3 (`clean_ocr.py`) aún no existe — hay que crearlo post-demo. Scope ~50 líneas Python:
- Re-unir líneas partidas por guión (`sis-\n temas` → `sistemas`)
- Normalizar dobles espacios, tabs a spaces
- Restaurar § donde detecte `\$ \d,\d`
- Remover page headers repetidos (detectar líneas idénticas que aparecen en N páginas)

---

## 📊 Proyección de impacto sobre el KB

| Métrica | Valor estimado |
|---|---|
| Chars extraídos total | ~90-100k (37 páginas × ~2500 chars/pg promedio) |
| Chunks @ 1100 chars | ~85-90 chunks |
| Entries esperados (Mistral validator rate ~70%) | **~60-65 entries nuevas** |
| KB Contabilidad actual | 40 entries |
| KB Contabilidad proyectado post-OCR | **~100 entries** (2.5×) |
| KB total proyectado | 138 → ~200 |

Cubre temas core de U1: concepto de contabilidad, historia (Sanders / Luca Pacioli), partida doble, informes contables, normas contables, caracterización de los sistemas — todos ya mencionados tangencialmente en Itinerario II pero sin profundidad.

---

## ⚠️ Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Calidad OCR sub-óptima en tablas o diagramas (Fowler tiene figuras) | Revisar manualmente chunks con densidad baja (<500 chars post-clean) antes de pasar a Mistral |
| Mistral vuelve a alucinar cross-domain como pasó con Admin | Aplicar prompt reforzado con anchor a Fowler/Telese en el system prompt. Audit H1-H7 automático post-generación |
| Tesseract confunde § con $ en contexto financiero contable | Post-proceso regex + un flag de revisión manual |
| Duplicados semánticos con entries de Itinerario II/III | Correr similarity check sobre embeddings antes del merge al KB (feature todavía no existe — deferido a Fase 2.5) |

---

## 🚦 Siguiente paso — ejecución post-demo

**Recipe para Juan (PowerShell, martes 21 o cuando tenga ventana):**

```powershell
# 1. Verificar Tesseract local + lang spa
tesseract --version
tesseract --list-langs  # debe incluir "spa"
# Si falta: descargar spa.traineddata de github.com/tesseract-ocr/tessdata_fast
# y ponerlo en C:\Program Files\Tesseract-OCR\tessdata\

# 2. Correr el pipeline completo (~6 min)
bash scripts/ocr_itinerario_I.sh  # ← script que hay que crear post-demo

# 3. Revisar outputs manualmente
code pipeline/ocr_out/itinerario_I/*.txt  # spot-check calidad

# 4. Ingesta al KB (ojo: esto sí tocca KB)
python pipeline/run_pipeline.py --append-kb --materia "Contabilidad" `
    --chunks pipeline/chunks/capitulo_2_fowler_newton.json

# 5. Audit de alucinaciones sobre las entries nuevas
python scripts/audit_hallucinations.py --since HEAD~1

# 6. Deploy estándar
node scripts/build.js
python scripts/verify_deploy.py --local
git add kb/ pipeline/
git -c user.email=... -c user.name=... commit -m "kb: OCR Itinerario I + N entries Contabilidad U1"
git push origin main
```

---

## ✅ Checklist pre-ejecución

- [ ] Demo 20/4 cerrado
- [ ] Commit `v19.30.5-neutralize-hallucinations` pusheado
- [ ] `scripts/ocr_itinerario_I.sh` creado (bash o versión .ps1)
- [ ] `pipeline/clean_ocr.py` creado
- [ ] `spa.traineddata` disponible en el Tesseract local de Juan
- [ ] Audit pre-ingesta: baseline de KB Contabilidad guardado (`entries_pre_u1.json`) para diff

Tiempo total estimado de ejecución end-to-end: **~45-60 min** (OCR 6min + clean 5min + Mistral generate ~15min + validator ~10min + manual review ~15min + deploy ~5min).
