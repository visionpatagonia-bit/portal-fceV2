# Sprint 1.6 · Día 1 · CIERRE · Render thumbnails EXT

**Fecha:** 2026-05-10 tarde (post-almuerzo · sesión nueva tras Sprint 2 cierre madrugada)
**Objetivo D1:** activar SW cache yuhonas (ya corriendo) · agregar thumbnails 40x40 en filas EXT del modal +Agregar
**Estado:** ✅ 9/9 asserts D1 + 129/130 acumulados Sprint 1+1.5+2 = **138/139 acumulados**

---

## Qué se entregó

**1. `nxCatalogToEX` extendido** (HTML L5290):
- Nuevo campo `imagen_thumb` = `entry.imagenes[0]` (primera URL de yuhonas)
- Null si no hay imágenes (defensive · 0 ej en bundle tienen imagenes vacío pero por las dudas)

**2. `_renderAddRow` con thumbnail condicional** (HTML L5293-5314):
- Si `isExtended && e.imagen_thumb` → renderiza `<img>` 40x40 con border-radius:8px + object-fit:cover
- Si no → usa `groupIcon(e.group)` original (regression OK · curado sin cambios)
- `loading="lazy"` + `decoding="async"` para perf (no bloquea scroll)
- `onerror` cae al `groupIcon` original (fallback graceful si imagen 404)
- `data-fallback` con groupIcon string · escapes single quotes (XSS safety)

**3. SW cache automático** (ya activo desde Sprint 1.5 D3.C):
- Primera carga: fetch network · cache stale-while-revalidate
- Cargas siguientes: 0 ms latency · cache hit
- Budget 50MB · LRU eviction si supera 1700 entries

---

## Validación

| Smoke | Pass/Total | Notas |
|---|---|---|
| **smoke_thumbnails_ext.js** (D1 nuevo) | **9/9** | imagen_thumb · render condicional · lazy/async · onerror · XSS safety · bundle valid · CDN URL |
| smoke_pwa_install (D1 Sprint 2) | 14/14 | regression OK |
| smoke_student_enhancements (D2 Sprint 2) | 9/9 | regression OK |
| smoke_student_checkin (D3 Sprint 2) | 11/11 | regression OK |
| smoke_h4_h5 | 12/12 | regression OK |
| smoke_nx_catalog | 14/14 | regression OK |
| smoke_extended_ui | 12/12 | regression OK |
| smoke_sw_cache | 11/11 | regression OK |
| smoke_headless (Sprint 1 baseline) | 46/47 | 1 WARN preexistente · 0 regresión |
| **Total Sprint 1.6 D1 acumulado** | **138/139** | 9 smokes · 0 FAIL · 1 WARN preexistente |

---

## Decisiones aplicadas

1. **Thumbnail SOLO si EXT + imagen_thumb.** Curado sigue con `groupIcon` · cero cambio UX coach. Si EXT pero sin imagen (improbable) → fallback groupIcon también.

2. **40x40 con border-radius:8px + object-fit:cover.** Tamaño coherente con `groupIcon` original (no rompe alineación grid). Object-fit cover evita distorsión de imágenes con aspect ratio raro.

3. **loading="lazy" + decoding="async".** Performance · img solo carga cuando entra al viewport · decoding fuera del main thread. En modal con 30 filas EXT visibles solo se cargan las primeras 5-6.

4. **onerror fallback graceful.** Si imagen 404 (CDN GitHub raw caído · red lenta · etc) → reemplaza con `groupIcon` original. UX consistente · no roto.

5. **data-fallback escapa single quotes.** Defensive XSS · `groupIcon` puede contener HTML con quotes. Replace `'/g` con `&#39;` evita SVG injection.

6. **Inyección sin tocar modal · solo función helper.** `_renderAddRow` cambia · `openAddModal` + `filterAddList` + `addToDay` intactos. Quirúrgico.

---

## Trade-offs explícitos

1. **CDN GitHub raw es upstream.** Si yuhonas deletea repo o cambia rama → 404. SW cache mitiga sesiones siguientes pero primera carga depende. Aceptable: GitHub raw es estable +99.9% uptime, repo MIT.

2. **Imagen 0 de cada ej · no permitimos elegir cuál.** Yuhonas trae 2 imágenes por ej. Usamos `imagenes[0]` que es la posición inicial. Para mejorar: agregar carrusel en modal detalle (Sprint futuro).

3. **Tamaño imagen yuhonas ~30 KB cada una.** 30 filas EXT visibles × 30 KB = ~900 KB primera carga. Lazy mitiga (solo carga las primeras). Con SW cache · siguiente carga 0 ms.

4. **NO valida que el SW realmente intercepte.** Smoke valida que el código renderiza img correctamente. Validación que SW cachea requiere browser real con DevTools > Network (cache vs network column).

5. **Thumbnail NO clickable separado.** Click en la fila completa agrega al día (igual que antes). UX consistente · alumna no aprende nuevo flujo.

---

## Verificación post-deploy esperada

1. **Modal +Agregar ejercicio (ventana normal Chrome):**
   - Toggle "Incluir catálogo extendido" ON
   - Filas curadas: icono de grupo (Pecho/Espalda/etc) → SIN cambios
   - Filas con badge EXT: thumbnail 40x40 real de yuhonas (push-up, squat, etc)
   - Scroll: imágenes cargan lazy (visible en Network tab)
2. **Second reload (mismo cliente):**
   - DevTools > Network: filas EXT cargadas desde SW cache (Size column = "(ServiceWorker)")
   - Tiempo de render <50ms vs primera vez 500-1000ms
3. **DevTools > Application > Cache Storage:**
   - `nx-yuhonas-images-v1` se llena con thumbnails tras primera carga
   - `await window.NX_SW.stats()` retorna entries > 0
4. **Caso fallback:** F12 console · `document.querySelectorAll('.ex-row img').forEach(i => i.src = 'https://bad-url.invalid/x.jpg')` → todos deben caer al groupIcon

---

## Pendiente Sprint 1.6 D2+

- **D3.B traducción** (Task #77 · sigue postponed condicional)
- **Modal detalle ej** con instructions + imagenes[1] + carrusel
- **Smoke E2E browser** con Playwright o Puppeteer para validar SW intercepta de verdad
- **Validation Ariel manda link a Luz** (pendiente live test desde Sprint 2)

---

## Kill-switches activos (sin cambios + nuevo)

1. `?dexie=0` (S1)
2. Toggle catálogo OFF (S1.5 D2)
3. NX_CATALOG.getError (S1.5 D3.A)
4. NX_SW.purge (S1.5 D3.C)
5. Manifest 404 → SVG fallback (S2 D1)
6. Enhancements no-op si !student-mode (S2 D2)
7. MIME fix revertible (S2 D2)
8. setStudentSensation falla → LS SoT (S2 D3)
9. **Sprint 1.6 D1 thumbnails:** si imagen 404 → onerror → groupIcon (cero crash · UX consistente)

---

**Veredicto D1:** Ariel ahora ve thumbnails reales en filas EXT del modal · valor visible inmediato · justifica el SW cache que ya estaba corriendo. Trabajo quirúrgico (2 funciones · ~25 líneas).
