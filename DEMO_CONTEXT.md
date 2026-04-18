# NEXUS Portal FCE 2026 — Demo Context

> **Generado:** 17 abril 2026
> **Demo:** lunes 20 abril 2026
> **Owner:** Juan (visionpatagonia@gmail.com)
> **Propósito:** este archivo es el puente entre sesiones de Claude. Si empezás una conversación nueva, léelo primero.

---

## 🎯 Estado actual (snapshot)

**Producción:** portal-fce-v2.vercel.app
**Último commit pusheado:** `b1dc22b`
**sw.js cache version:** `fce-portal-v19.30.3`
**KB entries en prod:** ~136-138 (verificar con `python scripts/verify_deploy.py`)

### Qué hay en la KB

- **Contabilidad U2:** Itinerarios II Parte 1 + Parte 2 + III (Fowler Newton, Biondi, Lezanski) — conceptos de patrimonio, activo, pasivo, partida doble, ecuación contable
- **Sociales U3:** Bourdieu "Clase 18 de enero de 1990 en Sobre el Estado" — 88 entries aprobadas de 141 generadas (28% rechazo por validator)
- **Administración:** 13 entries Chiavenato (heredadas de sesiones previas)
- **Manual patches:** `ecuacion_contable` + `activo_vs_pasivo` (agregadas a mano para fixear falsos positivos y miss comparativo)

### Qué NO hay todavía

- **Contabilidad U1 (Itinerario I):** PDFs son scans sin OCR → Task #15 post-demo
- **Propedéutica:** sin ingestar
- **Sociales Unidades I, II:** sin ingestar
- **Resto de Admin:** sin ingestar

---

## 🏗️ Arquitectura — decisiones clave

### Hybrid KB + LLM
1. **Cache-first matching** (Jaccard/Levenshtein contra patterns de KB) — <10ms si hit
2. **LLM fallback** (Llama 3.2 via nexus-ai-proxy) — ~4s si miss
3. **Plan B UX (v1.5.0)** — cuando LLM falla: banner offline, retry button, error clasificado (429/5xx/timeout), sugerencia KB alternativa

### Zero-hallucination guarantee
- Toda entry tiene `source_refs` obligatorios (path + página del PDF)
- Validator rechaza entries sin refs o con frases prohibidas
- Juan revisa manualmente antes de merge

### Pipeline
```
ingest_pdf.py → pipeline/chunks/{slug}.json  (chunks de ~1100 chars)
generate_kb.py → pipeline/kb_draft/{slug}.json  (Mistral 7B)
validator.py → kb/knowledge_base.json  (final, merged con --append-kb)
```

Ver `pipeline/README.md` y `pipeline/run_pipeline.py` para orquestación.

### Hallazgos importantes

1. **nexus-ai-proxy/server.js hardcodea `OLLAMA_MODEL`** e ignora el field `model` del body. Esto significa que **generate_kb.py NO puede correr vía proxy** — siempre forzaría Llama3.2 en vez de Mistral. Juan lo corre directo contra su Ollama local (localhost:11434).

2. **Itinerario I Contabilidad son scans** (0 chars extraíbles con pypdf). Requieren OCR pipeline (Task #15).

3. **Git index en sandbox corrompe seguido** con error "cache entry has null sha1" o "bad signature". Fix: `rm -f .git/index && git read-tree HEAD`.

4. **No modificar git config global.** Usar per-command:
   ```bash
   git -c user.email="visionpatagonia@gmail.com" \
       -c user.name="visionpatagonia-bit" commit -m "..."
   ```

5. **Path con "á" fallan** en Windows PowerShell si se pasan con salto de línea. Usar comillas dobles sin newlines.

---

## 📋 PENDIENTES — orden sugerido

### 1. Test visual de 5 queries (siguiente acción)
Juan tiene 5 screenshots listos del portal con estas queries:

| # | Query | Match esperado |
|---|---|---|
| 1 | ¿Cuál es la ecuación contable básica? | `ecuacion_contable` 1.00 |
| 2 | Diferencia entre activo y pasivo | `activo_vs_pasivo` 1.00 |
| 3 | ¿Qué dice Bourdieu sobre el Estado? | alguna entry Bourdieu |
| 4 | ¿Qué es la tradición marxista del Estado? | entry Bourdieu tradicion_marxista |
| 5 | ¿Cómo define Bourdieu las categorías estatales? | entry Bourdieu categorias |

**Analizar cada una:** KB match o LLM, confidence, latencia, si respuesta es on-topic o falso positivo.

### 2. Patches quirúrgicos si hay misses
Para cada miss o falso positivo, editar `kb/knowledge_base.json` directamente (el workspace ES el disco de Juan) agregando patterns a entries existentes o creando nuevas. Template en sección siguiente.

### 3. Build + push
```powershell
node scripts/build.js
python scripts/verify_deploy.py --local
git add kb/knowledge_base.json
git commit -m "kb: <descripción>"
git push origin main
# esperar 60s
python scripts/verify_deploy.py
```

### 4. DEMO_FLOW.md
Documento con las queries que funcionan bien para que Juan las use en vivo el lunes. 8-10 queries diversas cubriendo Contabilidad + Sociales + Admin.

### 5. Opcional (si hay tiempo)
- Ingesta Propedéutica
- Bloque 2 pendiente: E2E enrich test (Juan no lo entendió, deferido)
- Fix del commit message inexacto de `b1dc22b`

---

## 🔧 Template para agregar entry manual al KB

```python
# Patch script (correr desde portal_v19.3.0/)
import json
from pathlib import Path

kb_path = Path('kb/knowledge_base.json')
kb = json.loads(kb_path.read_text(encoding='utf-8'))

nueva = {
    "id": "nombre_unico_snake_case",
    "type": "material_concept",  # o formula, comparison, definition
    "patterns": [
        "query exacta que esperás",
        "variante 1",
        "variante 2",
        # 5-10 variantes
    ],
    "answer_full": "Markdown completo...",
    "source_refs": [
        "Materiales/CATEGORIA/Archivo.pdf#pN"
    ],
    "related_concepts": ["concepto1", "concepto2"],
    "materia": "Contabilidad",  # o Sociales, Administración
    "difficulty": "intro",  # o intermedio, avanzado
    "validated": True,
    "generated_by": "manual_patch:v19.30.X",
    "chunk_id": "manual-NN"
}
kb['entries'].append(nueva)
kb['total_entries'] = len(kb['entries'])

kb_path.write_text(json.dumps(kb, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'OK: {kb["total_entries"]} entries')
```

---

## 📚 Archivos clave para entender el sistema

Leer en este orden si empezás fresco:

1. `CLAUDE.md` — principios de NEXUS (content standard, content preservation layer, modo auditor)
2. `pipeline/README.md` — pipeline de ingesta
3. `pipeline/run_pipeline.py` — orquestador
4. `sw.js` — service worker, estrategia de cache por tipo
5. `nexus-ai.js` — chat UI + Plan B UX + matcher (grande, ~2200 líneas)
6. `scripts/verify_deploy.py` — smoke tests local + remoto
7. `kb/knowledge_base.json` — la KB en sí (últimas 50 entries para ver patterns estilo)

---

## 🔑 Comandos de uso frecuente

```powershell
# Ingestar un PDF nuevo
python pipeline/run_pipeline.py --append-kb --materia "Contabilidad" --pdf "Materiales/.../archivo.pdf"

# Build + preflight
node scripts/build.js
python scripts/verify_deploy.py --local

# Commit + push + verify remoto
git add kb/knowledge_base.json
git commit -m "kb: <descripción>"
git push origin main
# esperar 60s
python scripts/verify_deploy.py

# Ver qué entries hay
python -c "import json; kb=json.load(open('kb/knowledge_base.json', encoding='utf-8')); [print(e['id']) for e in kb['entries']]"
```

---

## 💡 Reglas de oro

- **No regenerar con Mistral si alcanza con patches de patterns** — es 10x más rápido y no rompe.
- **Toda entry nueva necesita source_refs reales** — no inventar paths.
- **Antes de deployar: preflight local + verify remoto.** Nunca saltar pasos.
- **Si el commit message es ambiguo o falso, se puede corregir** con un commit siguiente ("chore: fix commit message de b1dc22b — también incluía Bourdieu"). No amendear historial público.
- **Todo cambio de sw.js requiere bump de CACHE_NAME** en `sw.js` + sync en `scripts/verify_deploy.py` (`EXPECTED_CACHE_VERSION`).
