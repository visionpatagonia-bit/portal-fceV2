# Sprint 1.5 · Día 3.C · CIERRE · Service Worker cache yuhonas

**Fecha:** 2026-05-09 noche
**Lead:** Juan · CTO aprobó D3.A · luz verde para D3.C
**D3.B postpone:** lazy LLM traducción → backlog Sprint 1.6 (decisión técnica · ROI bajo · proxy infra no instalada)

---

## Qué se entregó

**Service Worker** (`deploy_qa/public/sw.js` · 142 líneas):
- Cache name versionado: `nx-yuhonas-images-v1`
- Strategy: stale-while-revalidate (sirve cache + revalida en background)
- Scope estricto: solo intercepta GETs a `https://raw.githubusercontent.com/yuhonas/...`
- Filtro MIME: solo cachea `Content-Type: image/*` (200 OK)
- Budget: 50 MB · LRU eviction (purga 10% más antigues si supera ~1700 entries)
- API mensajes: `NX_SW_PING`, `NX_SW_STATS`, `NX_SW_PURGE` para diagnóstico
- Activate handler: purga caches viejas (versiones anteriores) + claim clients

**HTML registration** (`window.NX_SW`):
- API: `register() · ping() · stats() · purge()`
- Auto-register on `load` event con fallback graceful
- `console.log` en éxito · `console.warn` no bloqueante en fallo
- Si SW no soportado por navegador → cero impacto

**vercel.json CSP fix** (paralelo a SW · prepara terreno):
- `img-src 'self' data: blob: https://raw.githubusercontent.com`
- `connect-src 'self' https://raw.githubusercontent.com`
- `worker-src 'self'` (necesario para registrar /sw.js)

---

## Validación pre-deploy

| Smoke | Pass/Total | Notas |
|---|---|---|
| smoke_sw_cache.js | 11/11 | source presente · cache name · scope filter · strategy SWR · cache MIME · enforceBudget · 4 escenarios funcionales |
| smoke_h4_h5.js | 12/12 | regression D2 fixes intactos |
| smoke_nx_catalog.js | 14/14 | regression D3.A core wrapper |
| smoke_extended_ui.js | 12/12 | regression D3.A UI integration |
| smoke_headless.js | 46/47 | regression Sprint 1 baseline · 1 WARN preexistente |
| **Total Sprint 1.5 acumulado** | **95/96** | 5 smokes nuevos · 0 FAIL · 1 WARN preexistente |

HTML 8398 líneas (+63 vs D3.A) · md5 master `d74bd30b43d2dad6f6e0a09ca6a8b968` · parity deploy_qa OK.
SW 142 líneas · md5 `102edba11b69f2d42982d9d16ccfcbe9`.
vercel.json 30 líneas · CSP actualizado.

---

## Decisiones aplicadas

1. **Scope estricto solo yuhonas.** SW NO intercepta otras requests (HTML · JS · fonts · APIs). Cualquier request fuera del prefijo `https://raw.githubusercontent.com/yuhonas/` pasa transparente al network. Reduce surface de bugs · mantiene UX original intacta.

2. **stale-while-revalidate vs cache-first.** Elegido SWR porque:
   - Sirve cache instant si existe → 0 ms latency en sesiones siguientes
   - Revalida en background → invalidación silenciosa si cambian imágenes upstream
   - Si fetch falla → cache sigue funcionando (offline graceful)
   Trade-off: 1 fetch network extra por imagen · costo aceptable (CDN GitHub + stale OK)

3. **Budget 50 MB · LRU eviction.** Estimación 1700 entries (30 KB promedio). Cuando supera, purga 10% más antigues. Best-effort · no precise tracking de bytes (costoso). Suficiente para uso real Anubis (~100 ej activos × 2 imgs = 200 entries efectivos).

4. **CSP fix INCLUIDO en este sprint.** El CSP previo bloqueaba imágenes raw.githubusercontent.com. Sin el fix, el SW cachearía 0 imágenes (404 antes de llegar al SW). Decisión consciente: incluir CSP fix junto con SW · ambos van juntos o ninguno.

5. **NO render imágenes en UI todavía.** El framework está listo (CSP permite · SW cachea · catálogo tiene URLs). Render thumbnail en filas EXT del modal queda para Sprint 1.6 o PWA Alumna #160. Justificación: D3.C minimal entrega framework · UX visible en próxima feature que necesite imágenes.

---

## Trade-offs explícitos

1. **SW activo aunque no haya UI usando imágenes todavía.** El SW se registra al boot. Si nadie pide imágenes yuhonas, el SW no hace nada (filtro estricto). Pero está corriendo. Trade-off: pequeño costo de SW idle vs preparar terreno para próximas features sin re-deploy.

2. **CSP `connect-src` ahora incluye raw.githubusercontent.com.** Esto permite también `fetch()` directo a esa URL desde el HTML (no solo `<img>`). Si en el futuro se agrega scraping inadvertido del repo yuhonas, no será bloqueado. Trade-off aceptable: fuente confiable (MIT · GitHub raw inmutable por commit hash).

3. **Budget LRU es best-effort.** No tracking de bytes precisos · solo cantidad de entries. Si las imágenes son significativamente más pesadas que 30 KB promedio, el budget real puede exceder 50 MB. Mitigación futura: agregar tracking en `enforceBudget` con `Content-Length` header.

---

## Pendiente (próximos sprints)

- **D3.B postpone** (Sprint 1.6 · ya agendado): lazy LLM traducción instructions on-click + cache Dexie. Decisión técnica: depende de endpoint LLM no instalado actualmente. Alternativa zero-dependency: diccionario manual 50 frases EN→ES (~30 min).
- **D4 cierre formal Sprint 1.5**: doc resumen ejecutivo · tag git · update DEMO_CONTEXT.md.
- **Sprint 1.6 candidates**: render thumbnail imágenes en filas EXT · D3.B traducción · validation user de catálogo extendido en uso real.

---

## Verificación post-deploy esperada

1. **F12 console al cargar página:** `[NX_SW] registrado · scope=https://nexus-fitness-ruby.vercel.app/`
2. **F12 console:** `await window.NX_SW.ping()` retorna `{cacheName: 'nx-yuhonas-images-v1', version: 1}`
3. **F12 console:** `await window.NX_SW.stats()` retorna `{entries: 0, ...}` inicialmente
4. **Test manual cache:** abrir Vista Alumno con cliente que tenga ej de catálogo extendido (cuando rendericemos imágenes en Sprint 1.6) · primera carga lenta · segunda carga instant
5. **DevTools > Application > Service Workers:** `sw.js` activado · scope `/`
6. **DevTools > Application > Cache Storage:** `nx-yuhonas-images-v1` aparece tras primera imagen cacheada
7. **CSP:** consola sin errores `Refused to load image from raw.githubusercontent.com because it violates...`

---

## Kill-switches activos

- Sprint 1 NX_DEXIE: `?dexie=0` (kill-switch IDB)
- Sprint 1.5 D2: catálogo extendido toggle OFF default
- Sprint 1.5 D3.C SW: si SW falla registro → cero impacto · `[NX_SW] registro falló (no bloqueante)`. Para purgar manualmente: `await window.NX_SW.purge()` desde F12. Para deshabilitar SW: borrar `/sw.js` del deploy o desregistrar desde DevTools.

---

**Veredicto:** D3.C entrega framework SW + CSP fix · 11/11 asserts smoke + 84 acumulados regression OK. Sprint 1.5 ahora tiene infraestructura completa para servir 873 ejercicios extendidos con imágenes performantes en sesiones siguientes. D3.B postponed con justificación técnica clara · agendado backlog. Listo para deploy Día 3.C + cierre formal Sprint 1.5 (D4).
