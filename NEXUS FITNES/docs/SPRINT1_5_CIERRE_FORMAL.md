# Sprint 1.5 · CIERRE FORMAL

**Fecha cierre:** 2026-05-10 madrugada (sesión continua sábado 9-may noche → domingo 10-may madrugada)
**Lead:** Juan · CTO aprobado D1+D2 · luz verde D3
**Cadencia:** Deploy incremental sostenida · 4 ciclos {implement → smoke → deploy → validar} en una sesión
**Veredicto:** ✅ Cerrado · 95/96 asserts (1 WARN preexistente · 0 FAIL)

---

## Resumen ejecutivo

Sprint 1.5 entregó **catálogo extendido yuhonas (873 ej · 1.1 MB)** + **2 fixes urgentes (H4 PDF · H5 ZWNJ)** + **infraestructura SW para imágenes performantes**, en 4 deploys incrementales con cero regresión sobre Sprint 1.

Decisión técnica explícita: **D3.B (lazy LLM traducción) postpone a Sprint 1.6** por análisis de ROI bajo (Ariel usa ~100 ej de los 873 · diccionario ES manual ya cubre 41% · costo infra desproporcionado).

---

## Entregables por día

| Día | Bloque | Smokes | Asserts | Estado |
|---|---|---|---|---|
| D0 | Preflight + inventory baseline | — | — | ✅ |
| D1 | Mapping yuhonas/free-exercise-db → NEXUS schema CRDT-ready · 873 ej · 41.1% nombre_es | (estructural) | n/a | ✅ deploy |
| D2 H4 | Fix `resolveContext()` Path 3 Vista Alumno por URL | smoke_h4_h5 | 9/9 | ✅ deploy |
| D2 H5 | Fix `safeText()` U+200B → U+200C (ZWNJ purpose-designed) | smoke_h4_h5 | 3/3 | ✅ deploy |
| D3.A core | NX_CATALOG wrapper (load · cache Dexie · search · filtros · getById) | smoke_nx_catalog | 14/14 | ✅ deploy |
| D3.A UI | Toggle "Incluir catálogo extendido" en modal +Agregar · nxCatalogToEX · addToDay con yuhonas IDs | smoke_extended_ui | 12/12 | ✅ deploy |
| D3.B | Lazy LLM traducción instructions | — | postpone | ⏳ Sprint 1.6 |
| D3.C | Service Worker cache yuhonas (SWR · 50MB LRU) + CSP fix raw.githubusercontent.com | smoke_sw_cache | 11/11 | ✅ deploy |
| D4 | Cierre formal · este doc · resumen ejecutivo · update DEMO_CONTEXT · memoria | — | — | ✅ |
| Regression | smoke_headless Sprint 1 baseline · cero regresión a través de los 4 deploys | smoke_headless | 46/47 | ✅ |
| **TOTAL** | | **5 smokes nuevos** | **95/96** | **✅** |

---

## Archivos sumados al repo

| Archivo | Tipo | Tamaño |
|---|---|---|
| `NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html` | mod | 8398 L (+361 vs Sprint 1) · md5 `d74bd30b43d2dad6f6e0a09ca6a8b968` |
| `NEXUS FITNES/deploy_qa/public/index.html` | mod | parity master |
| `NEXUS FITNES/deploy_qa/public/exercises_extended.json` | NEW | 1.11 MB · 873 ej · md5 `ef64419ce8eca1bc759ee1736e1afb8b` |
| `NEXUS FITNES/deploy_qa/public/sw.js` | NEW | 142 L · md5 `102edba11b69f2d42982d9d16ccfcbe9` |
| `NEXUS FITNES/deploy_qa/vercel.json` | mod | CSP + worker-src |
| `NEXUS FITNES/scripts/yuhonas_to_nexus.js` | NEW | 9 KB |
| `NEXUS FITNES/scripts/smoke_h4_h5.js` | NEW | 12 asserts |
| `NEXUS FITNES/scripts/smoke_nx_catalog.js` | NEW | 14 asserts |
| `NEXUS FITNES/scripts/smoke_extended_ui.js` | NEW | 12 asserts |
| `NEXUS FITNES/scripts/smoke_sw_cache.js` | NEW | 11 asserts |
| `NEXUS FITNES/docs/SPRINT1_5_MAPPING.md` | NEW | 9 KB · schema mapping yuhonas → NEXUS |
| `NEXUS FITNES/docs/SPRINT1_5_DIA1_2.md` | NEW | cierre parcial D1+D2 |
| `NEXUS FITNES/docs/SPRINT1_5_DIA3_A.md` | NEW | cierre D3.A |
| `NEXUS FITNES/docs/SPRINT1_5_DIA3_C.md` | NEW | cierre D3.C |
| `NEXUS FITNES/docs/MINI_INFORME_CTO_SPRINT1_5_DIA1_2.md` | NEW | informe CTO post D1+D2 |
| `NEXUS FITNES/docs/SPRINT1_5_CIERRE_FORMAL.md` | NEW | este doc |
| `SCRIPTS_DEPLOY/commit_message_sprint1_5_dia*.txt` × 3 | NEW | BOM UTF-8 |
| `SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_5_dia*.ps1` × 3 | NEW | BOM UTF-8 + md5 parity-check |

---

## API expuesta a producción

```javascript
// Sprint 1 (intacto)
window.NX_DEXIE.put(key, value)
window.NX_DEXIE.get(key)
window.NX_DEXIE.snapshot()
window.NX_USE_DEXIE  // true por default · ?dexie=0 desactiva

// Sprint 1.5 D3.A
window.NX_CATALOG.load()           // async · lazy load 873 ej
window.NX_CATALOG.isLoaded()       // bool
window.NX_CATALOG.getAll()          // array · 873 ej (post-load)
window.NX_CATALOG.search(q, fil)    // in-memory filter · sub-50ms
window.NX_CATALOG.getById(id)       // lookup individual
window.NX_CATALOG.getStats()        // {total, generated_at, version, es_dict_coverage_pct}
window.NX_CATALOG.getError()        // last error · null si OK

// Sprint 1.5 D3.C
window.NX_SW.register()             // auto-llamado al boot
window.NX_SW.ping()                 // {cacheName, version}
window.NX_SW.stats()                // {entries, urls_sample}
window.NX_SW.purge()                // borra cache · forzar refetch
```

---

## Decisiones técnicas explícitas (5 trade-offs documentados)

1. **Catálogo coexiste con curado** (vs reemplazo). Toggle UI default OFF preserva UX de Ariel · activación opcional cuando necesite variedad. Cero risk al flujo principal.

2. **Conversión yuhonas → EX en runtime** (vs pre-procesada). `nxCatalogToEX` ejecuta cada render (~0.5ms × 30 entries = 15ms · negligible). Bundle JSON puro en disco · cualquier cambio del mapping no requiere re-correr `yuhonas_to_nexus.js`.

3. **Path 3 H4 defensivo** (vs refactor de orden `loadState`/`detectStudentUrl`). CTO aprobó: refactor mayor no urge · Path 3 cubre el síntoma de race condition. Si emerge Path 4, reevaluar.

4. **D3.B postpone con justificación** (vs implementar). Análisis explícito ROI: Ariel usa ~100 ej de 873 · diccionario ES ya cubre 41% · costo infra (Ollama+ngrok) desproporcionado · instrucciones técnicas cortas no se benefician. Agendado backlog Sprint 1.6 con condición clara: revisitar si Ariel reporta confusión real con EN.

5. **SW activo aunque sin UI usando imágenes todavía**. Framework listo (sw.js servido · CSP permite raw.githubusercontent.com · catálogo tiene URLs). Render thumbnail en filas EXT del modal queda Sprint 1.6. Trade-off: pequeño costo SW idle vs preparar terreno para próxima feature sin re-deploy.

---

## Kill-switches activos en producción (4)

1. **Sprint 1 NX_DEXIE:** `?dexie=0` desactiva Dexie · vuelve a `nxBackupStore` legacy
2. **Sprint 1.5 D2 catálogo:** toggle UI default OFF · LS `nx_use_extended_catalog` persiste preferencia
3. **Sprint 1.5 D3.A NX_CATALOG:** si fetch JSON falla → `getError()` muestra mensaje · toggle se desactiva · cero impacto UX curada
4. **Sprint 1.5 D3.C SW:** si registro falla → `console.warn` no bloqueante · `await window.NX_SW.purge()` desde F12 limpia · borrar `/sw.js` deploy desactiva

---

## Validación end-to-end en producción (post-deploys)

| Check | Resultado | Screenshot ref |
|---|---|---|
| F12 console al cargar | `[NX_DEXIE] activo (default)` + `[NX_CATALOG] fetch OK · 873 ej · 563ms` + `[NX_SW] registrado · scope=...` | sí (D3.A + D3.C) |
| Toggle "Incluir catálogo extendido" | OFF default · ON dispara fetch + persist Dexie · status feedback inline | sí (D3.A) |
| Modal "+Agregar ejercicio" | Mezcla curado + extendido · badge azul "EXT" · íconos por grupo correctos | sí (D3.A) |
| Search "press" con toggle ON | Header "Mostrando hasta 30 curados (de 100) + hasta 30 extendidos (de 873)" | sí (D3.A) |
| DevTools > Application > SW | sw.js · `#2 activated and is running` | sí (D3.C) |
| CSP errors | 0 errores `Refused to load image from raw.githubusercontent.com` | sí (D3.C) |
| Regression cartera coach | Path 1 H4 funciona · catálogo viejo intacto | implícito (smokes) |

---

## Pendientes / Backlog Sprint 1.6

1. **D3.B traducción** (Task #77 · agendado): lazy LLM on-click "Traducir" + cache Dexie · alternativa zero-dep diccionario manual ~50 frases EN→ES
2. **Render thumbnail imágenes** en filas EXT del modal (justifica el SW cache que ya está corriendo)
3. **Validación user uso real**: Ariel reporta tras 1-2 semanas si el catálogo extendido se usa · cuáles ej busca · feedback de calidad nombres
4. **Tracking preciso de bytes** en `enforceBudget` SW (mejorable con `Content-Length`)

---

## Roadmap sostenido (sin cambios desde Sprint 1)

- **Sprint 2 Trucco** (lunes 19-23 may): E1+E2+E3 · auditoría CTO previa lunes-martes
- **Sprint 3 Open Props** (lunes 26-28 may): W1+W5 anti-AI-slop
- **#160 PWA Alumna** (10-30 jun · post-Trucco)
- **#161 Firebase backend** (1 jul-4 ago · con disparador)

---

## Veredicto final

Sprint 1.5 cerrado limpio. **95/96 asserts · 5 smokes nuevos persistentes · cero regresión Sprint 1 baseline.** Catálogo extendido funciona end-to-end en producción · 4 kill-switches activos · trade-offs documentados.

D3.B postponed con justificación técnica explícita y agendado · NO es deuda oculta.

Disciplina O1 sostenida durante toda la sesión: cierre incremental con commits + memoria + docs por cada deploy. Lead aprobó la cadencia.

**Listo para Sprint 2 Trucco lunes 19 may.**
