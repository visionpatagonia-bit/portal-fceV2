# Sprint 1.5 · Días 1+2 · CIERRE PARCIAL

**Fecha:** 2026-05-09 noche
**Owner:** Claude (impl) · Juan (lead)
**Cadencia:** Deploy incremental aprobado por lead — captura valor inmediato (fixes H4+H5 reportados hoy) + cataloga extendido pre-cargado pero sin cablear a UI (zero risk)

---

## Resumen ejecutivo

| Bloque | Estado | Asserts |
|---|---|---|
| Día 0 · Preflight | ✅ | md5 parity master ↔ deploy_qa: `6ce1928725ad9e68b93dae081a6bbc39` |
| Día 1 · Mapping yuhonas → NEXUS | ✅ | 873 ejercicios · 41.1% nombre_es · 1.1 MB |
| Día 2 · Fix H4 + H5 | ✅ | 12 asserts verde |
| Regression Sprint 1 baseline | ✅ | 46/47 idéntico (1 WARN preexistente · no bloqueante) |
| Día 3 · UI buscador + Dexie | ⏳ | Pendiente próxima sesión |
| Día 4 · SW cache + cierre | ⏳ | Pendiente |

**Total Sprint 1.5 acumulado:** 58 asserts OK · 0 FAIL · 1 WARN (preexistente)

---

## Día 1 · Catálogo extendido (yuhonas/free-exercise-db)

**Fuente:** `yuhonas/free-exercise-db@main` (MIT) · 873 ejercicios · 1746 imágenes

**Schema NEXUS extendido (CRDT-ready):**
- `id`: `yuhonas_*` (namespace) · evita colisión con catálogo viejo
- `origen`: `'yuhonas'` (discriminator UI)
- `nombre`: EN original · siempre presente
- `nombre_es`: ES (diccionario manual ~85 entradas · cubre 41.1% · resto null)
- Enums (level/categoria/mecanica/fuerza_tipo/equipamiento/musculos): tabla estática ES
- `instrucciones`: EN array
- `instrucciones_es`: null · lazy LLM on-demand (Día 3+)
- `imagenes`: URLs CDN raw.githubusercontent.com
- `_version` · `_updated_at` · `_deleted` (compatible Sprint 1 CRDT-ready)

**Distribución cobertura:**
- 581 strength · 123 stretching · 61 plyometrics
- 523 beginner · 293 intermediate · 57 expert
- 12 tipos equipment · 17 grupos musculares

**Output:** `deploy_qa/public/exercises_extended.json` (1.11 MB · md5 `ef64419ce8eca1bc759ee1736e1afb8b`)

**Estado UI:** archivo SERVIDO desde Vercel pero NO cableado a UI todavía (Día 3). Zero impacto en UX actual de Ariel.

---

## Día 2 · Fix H4 (Vista Alumno PDF)

**Bug reportado:** PDF "no hay rutina cargada" al exportar desde Vista Alumno (URL `?student=ID`). Workaround usuario: editar desde cartera coach.

**Root cause:** `resolveContext()` (HTML L7710) tenía solo 2 paths:
- Path 1: `STATE.currentClient` (índice numérico) + última rutina persistida
- Path 2: `window._lastGeneratedRoutine` (rutina recién generada en memoria)

Vista Alumno tiene race condition: `detectStudentUrl()` puede correr antes de hidratar `STATE.routines` completamente desde LS, o `STATE.currentClient` se pierde tras navegación SPA.

**Fix aplicado (Path 3):** detectar cliente por URL como respaldo robusto.

```javascript
// Path 3 (Sprint 1.5 H4 fix · 2026-05-09): Vista Alumno detectada por URL
if(!routine){
  try {
    var params = new URLSearchParams(window.location.search);
    var urlStudentId = params.get('student') || (params.get('view') === 'cliente' ? params.get('id') : null);
    if(urlStudentId && STATE.clients && STATE.clients.length > 0){
      var matched = STATE.clients.find(function(c){
        return c.id === urlStudentId || (typeof slugify === 'function' && slugify(c.name) === urlStudentId);
      });
      if(matched){
        if(!client) client = matched;
        var arr2 = (STATE.routines && STATE.routines[matched.id]) || [];
        if(arr2.length > 0){
          routine = arr2[arr2.length - 1];
          console.log('[NX-PDF] Path 3 · Vista Alumno fallback · cliente=' + matched.id + ' · rutinas=' + arr2.length);
        }
      }
    }
  } catch(e){ console.warn('[NX-PDF] Path 3 fallo no bloqueante:', e && e.message); }
}
```

**Cobertura smoke (9 asserts):**
- H4.1 · client detectado por URL `?student=ID`
- H4.2 · routine recuperada de `STATE.routines`
- H4.3 · routine.days es array
- H4.4 · routine.days no vacío
- H4.5 · slugify match (`?student=luz_perez` → `Luz Pérez`)
- H4.6 · alias `?view=cliente&id=ID`
- H4.7 · regression Path 1 cartera coach sigue OK
- H4.8 · sin contexto retorna null sin falsos positivos
- H4.9 · URL student=ID inexistente → no crash

---

## Día 2 · Fix H5 (espacio visible f-i / f-l en PDF)

**Bug reportado:** `safeText()` insertaba U+200B (ZWSP · zero-width space) entre `f` e `i/l` para evitar ligaduras en pdfmake/Roboto. En algunos PDF readers (Chrome PDF viewer · Acrobat ciertas versiones) ZWSP se renderiza como espacio normal: "tonificación" → "tonif icación", "flexiones" → "f lexiones".

**Root cause:** U+200B es semánticamente "permitir corte de palabra aquí". Algunos renderers respetan eso y dejan espacio visible cuando hay justificación o kerning extremo.

**Fix aplicado:** cambiar U+200B (ZWSP) → U+200C (ZWNJ · zero-width non-joiner). ZWNJ es purpose-designed para impedir ligaduras y es estrictamente invisible en TODOS los renderers PDF (Chrome · Acrobat · Preview · Edge · Firefox).

```javascript
// Antes (v2028.24 · 8-may): ​ (ZWSP)
// return String(s).replace(/f([il])/g, 'f​$1');

// Ahora (v2028.25 · 9-may): ‌ (ZWNJ · purpose-designed)
return String(s).replace(/f([il])/g, 'f‌$1');
```

**Verificación hex en HTML:**
```
00000020: 5b69 6c5d 292f 672c 2027 66e2 808c 2431
                                  ^^ ^^^^^^^^
                                  f  U+200C ZWNJ ✓
```

**Cobertura smoke (3 asserts):**
- H5.1 · `safeText("tonificación")` inserta U+200C post-f
- H5.2 · `safeText("flexiones")` inserta U+200C post-f
- H5.3 · `safeText` NO contiene U+200B (regression check)

---

## Archivos tocados

| Path | Tipo | Estado | Razón |
|---|---|---|---|
| `NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html` | MOD | 8066 líneas (+30) | Fix H4 (Path 3) + H5 (ZWNJ) |
| `NEXUS FITNES/deploy_qa/public/index.html` | MOD | md5 parity master | Copy del HTML para Vercel |
| `NEXUS FITNES/deploy_qa/public/exercises_extended.json` | NEW | 1.11 MB · 873 ej | Catálogo yuhonas listo para Día 3 |
| `NEXUS FITNES/scripts/yuhonas_to_nexus.js` | NEW | 9 KB | Mapping yuhonas → NEXUS schema |
| `NEXUS FITNES/scripts/smoke_h4_h5.js` | NEW | 8 KB | Smoke 12 asserts (3 H5 + 9 H4) |
| `NEXUS FITNES/docs/SPRINT1_5_MAPPING.md` | NEW | 9 KB | Documentación schema mapping |
| `NEXUS FITNES/docs/SPRINT1_5_DIA1_2.md` | NEW | este doc | Cierre parcial |
| `SCRIPTS_DEPLOY/commit_message_sprint1_5_dia1_2.txt` | NEW | TBD | Commit message |
| `SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_5_dia1_2.ps1` | NEW | TBD | Deploy script |

---

## md5 baseline

| Archivo | md5 | Estado |
|---|---|---|
| HTML pre-Sprint 1.5 (commit 262258a) | `6ce1928725ad9e68b93dae081a6bbc39` | Sprint 1 sellado |
| HTML post-Día 2 (master) | `264766dd80969a51e46cf3d617368e70` | Fix H4+H5 aplicados |
| HTML post-Día 2 (deploy_qa/public/index.html) | `264766dd80969a51e46cf3d617368e70` | Parity check OK |
| exercises_extended.json | `ef64419ce8eca1bc759ee1736e1afb8b` | Identical /tmp/ ↔ workspace |

---

## Pendiente Día 3 (próxima sesión)

1. **UI buscador catálogo extendido**
   - Toggle "Incluir catálogo extendido" en form generador (default OFF)
   - Cuando ON: input search con debouncing 300ms · filtros level + equipment + muscle
   - Resultados <50ms en 873 ejercicios · paginación 20 por página
   - Card preview con imagen + nombre_es (o `name (EN)` si null)

2. **Persistencia Dexie**
   - Primera carga: fetch `/exercises_extended.json` → persist en `NX_DEXIE.put('exercises_extended_v1', ...)`
   - Subsiguientes: read directo desde Dexie (sin network)
   - Cache version-controlled (incrementar `version: 1` si fuente cambia)

3. **Lazy LLM traducción instructions on-demand**
   - Botón "Traducir" en card detalle (cuando `instrucciones_es === null`)
   - LLM call → cache permanente en Dexie con campo `instrucciones_es`
   - Flag `?translate=0` para desactivar (modo fast development)

4. **Service Worker cache imágenes**
   - SW intercepta requests a `raw.githubusercontent.com/yuhonas/...`
   - Strategy: stale-while-revalidate · cache budget 50 MB
   - Invalidación: month-rolling

5. **Smoke UI buscador (estimado 8-12 asserts):**
   - Toggle ON/OFF
   - Search "press" devuelve >5 resultados
   - Filtro level=beginner reduce conjunto
   - Card detalle abre modal correcto
   - Persistencia entre reloads (Dexie)

---

## Decisiones aplicadas

1. **Coexistencia con catálogo curado** — toggle UI default OFF · preserva UX actual Ariel
2. **Lazy translation** — solo enums + 85 nombres canónicos en Día 1 · instructions on-demand Día 3
3. **CRDT-ready schema** — compatible con Sprint 1 Dexie · path Yjs futuro preservado
4. **Deploy incremental** — Día 1+2 ahora · Día 3+4 próxima sesión (disciplina O1 · cierre incremental memoria+commits validado por lead)

---

## Verificación post-deploy esperada

Una vez pusheado y Vercel actualizado, validar:

1. **F12 console** — `await fetch('/exercises_extended.json').then(r => r.json()).then(d => d.total)` debe retornar `873`
2. **Vista Alumno PDF** — abrir `https://nexus-fitness-ruby.vercel.app/?student=ID` con cliente que tiene rutina persistida → click Exportar PDF → debe bajar PDF (no toast "no hay rutina")
3. **PDF Luz** — generar rutina nueva · exportar PDF · abrir en Chrome/Acrobat → "tonificación" sin espacio raro · "flexiones" sin espacio raro
4. **Regression** — coach sigue funcionando idéntico desde cartera

Si los 4 OK → Sprint 1.5 Día 1+2 sellado.
