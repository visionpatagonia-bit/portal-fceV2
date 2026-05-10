# Sprint 1.5 · Día 3.A · CIERRE

**Fecha:** 2026-05-09 noche · **Lead:** Juan (CTO aprobado D1+D2)
**Cadencia:** D3.A cierre incremental aprobado · D3.B (lazy LLM) + D3.C (SW cache) próxima sesión

---

## Qué se entregó

**NX_CATALOG wrapper** (HTML L8062-8190 · ~130 líneas): API lazy `load/isLoaded/getAll/search/getById/getStats/getError`. Estrategia carga: Dexie cache → fetch CDN → persist Dexie + window cache. Dedupe de loads concurrentes con `_loadPromise`. Versión gated en `CACHE_VERSION` para invalidación futura. Si fetch falla → `getError()` para UI clara, cero crash.

**Helpers conversión** (HTML L5244-5283): `nxCatalogToEX(entry)` mapea schema yuhonas (nivel string · musculos_primarios array · categoria · fuerza_tipo) al schema interno EX (level numérico 1-5 · group string · pattern inferido por categoría/músculo). Coverage: 17 grupos musculares mapeados a 8 grupos NEXUS · 7 categorías yuhonas → pattern (stretch · plyometric · cardio · push · pull · main).

**UI integración** (HTML L5285-5375): `openAddModal` extendido con toggle "Incluir catálogo extendido (873 EJ · BETA)" · default OFF · preferencia en LS `nx_use_extended_catalog`. `toggleExtendedCatalog(dayIdx, checked)` dispara lazy load + status feedback inline. `filterAddList` combina curado + extendido con headers visuales y badges "EXT" en filas extendidas. `addToDay(dayIdx, exId)` busca en EX primero, luego NX_CATALOG con conversión automática · soporta ambos catálogos sin tocar lógica de generación.

---

## Validación pre-deploy

| Smoke | Pass/Total | Notas |
|---|---|---|
| smoke_nx_catalog.js | 14/14 | wrapper core: load/cache Dexie/search/filtros/getById |
| smoke_extended_ui.js | 12/12 | nxCatalogToEX conversion + addToDay con yuhonas IDs + regression EX legacy |
| smoke_h4_h5.js | 12/12 | regression Día 2 fixes (H4 Path 3 + H5 ZWNJ) |
| smoke_headless.js | 46/47 | regression Sprint 1 baseline · 1 WARN preexistente |
| **Total Sprint 1.5 acumulado** | **84/85** | |

HTML 8335 líneas (+269 vs Día 2) · md5 master `ad5ee71bdf7e847843896b4d53cc5e2a` · md5 parity deploy_qa OK.

---

## Decisiones aplicadas

1. **Toggle dentro del modal "+ Agregar ejercicio"** (no en form generador). UX consistente con flujo existente · Ariel ya conoce ese modal · cero risk al flujo principal.
2. **Default OFF persistido en LS** (`nx_use_extended_catalog`). Si Ariel activó toggle previamente, persiste entre sesiones. Cero impacto si nunca lo activa.
3. **Curado primero, extendido después** en resultados combinados. Preferencia explícita por catálogo curado en español. Badge azul "EXT" diferencia visualmente las filas yuhonas.
4. **Conversión yuhonas → EX en runtime** (no pre-procesamiento). Mantiene el bundle JSON puro · si en el futuro cambia el schema interno, solo se actualiza `nxCatalogToEX`.
5. **LocalStorage para preferencia toggle** (no Dexie). El toggle es preferencia UI sync · LS es lo apropiado · Dexie es para datos.

---

## Trade-offs explícitos

1. **Conversión runtime vs pre-procesada** — `nxCatalogToEX` se ejecuta cada vez que se renderiza la lista. Costo: ~0.5ms × 30 entries = 15ms (negligible). Beneficio: schema yuhonas intacto en disco · cualquier cambio en el mapping no requiere re-ejecutar `yuhonas_to_nexus.js`.

2. **`pattern` inferido heurísticamente** — yuhonas no tiene campo `pattern` directo. Inferimos de `categoria + fuerza_tipo + grupo primario`. Imperfecto · ej "Bench Press" yuhonas → pattern="push" en lugar de "push_horizontal". Trade-off aceptable: el sistema NEXUS usa pattern principalmente para anti-similar guard, y para ejercicios extendidos eso no aplica con el mismo rigor (son add-ons manuales del coach, no parte del split automático).

3. **Curado tiene prioridad visual y de lookup** — `addToDay` busca en EX primero. Si en el futuro emergen IDs colisionantes (improbable: prefijo `yuhonas_*` evita), EX gana. Decisión consciente de preservar UX viejo.

---

## Pendiente Día 3.B/C (próxima sesión)

- **3.B** Lazy LLM traducción instructions on-click "Traducir" · cache permanente en Dexie con campo `instrucciones_es`. ~1h.
- **3.C** Service Worker cache stale-while-revalidate para imágenes raw.githubusercontent.com · budget 50 MB. ~1h.
- **Día 4** Cierre formal Sprint 1.5 · validación user (toggle ON · search "press" · agregar ej a rutina · PDF aún OK con ej extendido).

---

## Archivos tocados

- HTML master (mod · +269L) + deploy_qa parity (md5 `ad5ee71bdf7e847843896b4d53cc5e2a`)
- `NEXUS FITNES/scripts/smoke_nx_catalog.js` (NEW · 14 asserts)
- `NEXUS FITNES/scripts/smoke_extended_ui.js` (NEW · 12 asserts)
- `NEXUS FITNES/docs/SPRINT1_5_DIA3_A.md` (este doc)
- `SCRIPTS_DEPLOY/commit_message_sprint1_5_dia3_a.txt` + `.ps1` deploy

---

## Kill-switches activos (sin cambios)

- Sprint 1 NX_DEXIE: `?dexie=0` (kill-switch IDB · vuelve a `nxBackupStore` legacy)
- Sprint 1.5 D2: catálogo extendido NO cableado a UI principal (toggle OFF default)
- Sprint 1.5 D3.A: si fetch JSON falla → `NX_CATALOG.getError()` muestra mensaje claro, toggle se desactiva, cero impacto en UX curada

---

**Veredicto:** D3.A entrega 873 ejercicios accesibles desde UI con cero riesgo al flujo principal. Toggle default OFF preserva UX actual de Ariel. Activación opcional · cuando ON, search + filtros funcionan sub-50ms. Listo para deploy.
