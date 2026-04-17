# /kb — NEXUS Knowledge Base (generated)

**No editar a mano.** Todo lo que está acá se genera desde `/pipeline/*.py`.

## Contenido

| Archivo | Generador | Descripción |
|---------|-----------|-------------|
| `schedule_kb.json` | `ingest_schedule.py` | Patrones + templates para preguntas sobre horarios. Determinista, sin LLM. |
| `knowledge_base.json` | `generate_kb.py` (Fase 2) | Entries académicas generadas por Mistral desde `/Materiales`. |
| `manifest.json` | cualquier ingester | Hashes de archivos fuente + timestamps para invalidación de cache. |
| `qa_cache.json` | runtime + watcher | Respuestas de fallback dinámico (Mistral) cacheadas. Crece con el uso. |
| `pending_questions.json` | endpoint submit | Preguntas de usuarios pendientes de procesar por Mistral. |

## Regenerar

```bash
python pipeline/ingest_schedule.py       # schedule
python pipeline/generate_kb.py            # materiales (Fase 2)
```

## Validar

```bash
node pipeline/test_matcher.js            # smoke test del runtime matcher
```

---

Este directorio se deploya vía `scripts/build.js` (incluido en `APP_FILES`).
El Service Worker lo sirve con estrategia **network-first** (updates sin redeploy).
