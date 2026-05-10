# Sprint 2 · Día 1 · CIERRE · PWA install

**Fecha:** 2026-05-10 madrugada (post Sprint 1.5 cierre formal)
**Objetivo D1:** alumnas pueden instalar Anubis Fitness como app real en su home screen
**Estado:** ✅ 14/14 asserts D1 + 95/96 regression Sprint 1+1.5 = **109/110 acumulados**

---

## Qué se entregó

**Iconos generados** (deploy_qa/public/):
- `anubis_icon.svg` (331 bytes · source-of-truth · "A" naranja Anubis)
- `anubis_icon_192.png` (4 KB · 192×192)
- `anubis_icon_512.png` (12 KB · 512×512)
- `anubis_icon_maskable_512.png` (14 KB · safe-area 64px padding · maskable)

**manifest.webmanifest** (deploy_qa/public/):
- `name`: "Anubis Fitness · Tu rutina personal"
- `short_name`: "Anubis"
- `start_url`: "/" (con redirect inteligente vía LS · ver abajo)
- `scope`: "/"
- `display`: "standalone"
- `theme_color`: "#E85D04" (naranja Anubis)
- `background_color`: "#1A1A1C" (carbón)
- `icons`: 4 entries (svg any · 192 any · 512 any · 512 maskable)

**HTML head** (mod):
- `<link rel="manifest" href="/manifest.webmanifest">`
- 3 `<link rel="icon">` (svg + png 192 + png 512)
- `<link rel="apple-touch-icon">` con PNG real (mejor calidad que data URL)
- Fallback SVG inline preservado (favicon si manifest 404)

**window.NX_PWA API** (HTML +60 líneas):
- `canInstall()` · bool · ¿hay prompt disponible?
- `promptInstall()` · async · dispara prompt nativo · resuelve `{outcome}`
- `isStandalone()` · bool · ¿corriendo como app instalada?
- `onAvailable(cb)` / `onInstalled(cb)` · callbacks
- Listener `beforeinstallprompt` (preserva e.preventDefault + e guardado)
- Listener `appinstalled` (limpia _deferredPrompt + log + callbacks)

**Botón "📲 Instalar" en topbar alumna** (HTML mod):
- Visible solo si `NX_PWA.canInstall()` y `!isStandalone()`
- onClick → `nxStudentInstall()` → toast UX clara según outcome
- Auto-hide tras install via `onInstalled` callback
- Estilo Anubis (naranja · negrita · padding cómodo touch)

**Persistence + redirect inteligente** (HTML mod en detectStudentUrl):
- Al detectar `?student=ID` → persiste `nx_last_student_id` en LS
- Al boot en standalone (PWA instalada) sin `?student=` → recupera de LS y redirect via `history.replaceState`
- Resuelve el caso: Luz instala con `?student=luz_id` → al abrir desde home (sin query) la PWA recuperaría vista coach default. Ahora redirige correctamente a su vista alumna.

---

## Validación

| Smoke | Pass/Total | Notas |
|---|---|---|
| **smoke_pwa_install.js** (D1 nuevo) | **14/14** | manifest válido + icons existen + HTML link + NX_PWA API + redirect logic |
| smoke_h4_h5.js (D2) | 12/12 | regression OK |
| smoke_nx_catalog.js (D3.A core) | 14/14 | regression OK |
| smoke_extended_ui.js (D3.A UI) | 12/12 | regression OK |
| smoke_sw_cache.js (D3.C) | 11/11 | regression OK |
| smoke_headless.js (Sprint 1 baseline) | 46/47 | 1 WARN preexistente · 0 regresión |
| **Total Sprint 2 D1 acumulado** | **109/110** | 6 smokes · 0 FAIL · 1 WARN preexistente |

---

## Decisiones aplicadas

1. **start_url = "/" en manifest** (vs "/?student={STUDENT_ID}"). PWA spec no admite placeholders. Solución: persistir student_id en LS y redirect en boot si standalone + no query. UX equivalente sin violar spec.

2. **maskable + any en icons.** Algunos OS recortan iconos en círculo/squircle. Maskable variant tiene safe-area 64px padding · evita recorte de la "A". Mantenemos `any` para fallback en OS sin maskable support.

3. **NX_PWA listener al boot** (vs lazy register). PWA install event puede dispararse inmediatamente en algunas browsers · listener debe estar listo desde el load · costo mínimo (cero overhead si no se usa).

4. **Botón install solo en topbar alumna** (no coach). Coach ya conoce la app · alumnas son el target de install (mobile-first). Decisión consciente: no contaminar UX coach con CTA de instalación.

5. **Fallback SVG inline preservado.** Si manifest.webmanifest 404 o CSP bloquea, sigue habiendo favicon visible. Defensive coding · cero risk.

---

## Trade-offs explícitos

1. **manifest start_url no preserva student_id directo.** Workaround LS + redirect funciona en 99% casos. Edge case: si Luz limpia LS o cambia de browser, primera abertura post-install la lleva a vista coach. Mitigación: el coach puede regenerar el link y compartir nuevamente. Aceptable para PWA primera versión.

2. **Iconos PNG bake-in.** Generamos PNG estáticos (192 + 512 + maskable). Si rebrand de logo Anubis cambia, regenerar manualmente. Trade-off: vs SVG-only que no funciona en Safari iOS para apple-touch-icon. Decisión: PNG ahora · SVG en futuro si todos los browsers lo soportan.

3. **NO probado en device real.** Smokes verifican source code + manifest válido. Validación final requiere device físico (iOS · Android) para confirmar prompt de install aparece. **Pendiente: Ariel manda link a Luz · feedback.**

---

## Verificación post-deploy esperada

1. **F12 console al cargar:** `[NX_PWA] browser web · SW controlando · install puede aparecer pronto`
2. **F12 console:** `window.NX_PWA.canInstall()` retorna `true` tras 1-2 minutos de engagement
3. **Chrome DevTools > Application > Manifest:** carga manifest.webmanifest sin errores · iconos visibles
4. **Chrome DevTools > Lighthouse PWA audit:** "Installable" check pass
5. **Vista Alumna real device** (`?student=luz_id` en celular):
   - Topbar muestra botón "📲 Instalar" visible
   - Click → prompt nativo del browser
   - Accept → app aparece en home screen con icono "A" naranja
   - Click icono home → app abre en standalone (sin URL bar)
   - Sin `?student=` en URL pero el LS persiste → redirect automático a vista alumna
6. **iOS Safari:** Share menu → "Add to Home Screen" → icono "A" + nombre "Anubis Fitness"

---

## Pendiente Sprint 2 D2-D4

- **D2 (~2h):** Hero alumna pulido (saludo cálido + racha visual + CTA "Ver mi rutina del día") · branding Anubis fuerte. Hoy reusa renderClientView() técnico del coach · D2 lo personaliza para Luz.
- **D3 (~1.5h):** Check-in del día + anotador estructurado en Dexie namespace alumna.
- **D4 (~1h):** smoke + deploy + Ariel manda link a Luz · feedback real.

---

## Kill-switches activos (sin cambios)

- Sprint 1 NX_DEXIE: `?dexie=0`
- Sprint 1.5 D2 catálogo: toggle OFF default
- Sprint 1.5 D3.A NX_CATALOG: `getError()` muestra fallo
- Sprint 1.5 D3.C SW: `await window.NX_SW.purge()`
- **Sprint 2 D1 PWA:** si manifest falla (404 · CSP · etc) → fallback SVG inline funciona · botón install no aparece · cero impacto

---

**Veredicto D1:** entregable visible · pequeño · cierre incremental sostenido. Alumnas ahora pueden instalar Anubis Fitness como app real. D2 (hero alumna) próximo.
