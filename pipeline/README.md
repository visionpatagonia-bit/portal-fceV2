# NEXUS Pipeline

Scripts Python que generan el Knowledge Base (`kb/`) que consume el runtime en el browser.

**Principio**: toda inteligencia vive acá (offline, sin apuro). El browser solo matchea + renderiza.

---

## Estructura

```
pipeline/
├── config.py                    # constantes compartidas (paths, modelos, thresholds)
├── requirements.txt             # dependencias Python
├── ingest_schedule.py           # Fase 1 — schedule determinista (SIN LLM)
├── ingest_pdf.py                # Fase 2 — extracción de PDFs (próximamente)
├── generate_kb.py               # Fase 2 — Mistral genera entries académicas
├── watcher.py                   # Fase 4 — fs watchdog automático
├── test_matcher.js              # smoke test del matcher JS (corre con node)
└── prompts/
    └── nexus_academic.md        # prompt maestro para Mistral
```

---

## Uso

### Fase 1 — regenerar schedule KB (cada vez que cambia `horarios.json`)

```bash
python pipeline/ingest_schedule.py --verbose
```

Genera `kb/schedule_kb.json` con 8+ entries determinísticas. Cero LLM, cero alucinación.

### Smoke test (validar matcher antes de deploy)

```bash
node pipeline/test_matcher.js
```

Corre 18 casos de prueba contra el KB actual. Si alguno falla, no deployes.

### Fase 2 — procesar PDFs de `/Materiales` (próximamente)

```bash
python pipeline/generate_kb.py --source Materiales/ --verbose
```

Requiere Ollama corriendo con `mistral:7b-instruct-q4_K_M`.

---

## Principios de diseño

1. **Determinista cuando se puede**. Schedule es estructurado → Python puro, sin LLM.
2. **Mistral solo para no-estructurado**. PDFs, DOCX, apuntes manuscritos.
3. **Validator local obligatorio**. Ningún output llega al KB productivo sin pasar validación.
4. **Trazabilidad total**. Toda entry académica cita `source_refs` (archivo + página).
5. **Modularidad**. Cambiar `DOMAIN` en `config.py` permite reutilizar el pipeline para gym.

---

## Rollback

Si algo sale mal, el feature flag está en `nexus-ai.js`:

```js
window.NexusAI.kb.setEnabled(false);   // vuelve al comportamiento anterior (LLM directo)
```

En consola del browser. Cambio inmediato sin redeploy.

---

## Dependencias (Fase 2+)

```bash
pip install -r pipeline/requirements.txt --break-system-packages
```

Incluye: `pypdf`, `python-docx`, `requests`, `watchdog`.

Y necesitás Ollama corriendo local con:
- `mistral:7b-instruct-q4_K_M` (batch offline)
- `llama3.2:3b` (runtime fallback)
