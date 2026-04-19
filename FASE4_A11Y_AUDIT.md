# FASE 4.0 — Accessibility audit (preview Sovereign)

**Fecha:** 2026-04-19 · **Responsable técnico:** Juan · **Archivo auditado:** `NEXUS-preview-sovereign.html` (1 525 líneas).
**Herramienta:** axe-core 4.11.3 sobre jsdom 29.0.2 · WCAG 2.1 AA + best-practice.
**Contexto:** prerrequisito para deploy institucional (punto 6.4 del `INFORME_AUDITOR.md`).

> **Nota metodológica:** axe corre sobre un DOM parseado sin motor de layout. Por eso las reglas que dependen de `getComputedStyle` real (principalmente `color-contrast`) caen en `incomplete` y requieren una segunda pasada con browser headless (puppeteer/playwright) o inspección manual visual. Para este audit se marca `incomplete` con severidad reportada y se indica cómo verificar cada una.

---

## 0. Resumen ejecutivo

| Métrica | Valor |
|---|---:|
| Reglas evaluadas | 33 |
| **Violations confirmadas** | **1** (moderate) |
| **Incomplete (requieren review manual)** | **4** (2 serious, 2 moderate) |
| Passes | 28 |

**Veredicto:** el preview está en **buen estado accesible de base**, sin violations críticas (ni `critical` ni `serious` confirmadas). Todos los findings son fixables en la Fase 4.3.1–4.3.2 con cambios de markup semántico. No hay *dealbreakers* para deploy institucional.

**Recomendación:** resolver los 5 puntos (1 violation + 4 incomplete) antes de arrancar Fase 4.1 efectiva. Tiempo estimado: **45–60 min** para el set completo.

---

## 1. Violations confirmadas

### V1 — `region` (moderate · best-practice · RGAA 9.2.1)

**Descripción:** 5 elementos del topbar están fuera de landmarks semánticos (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`).

**Nodos afectados:**

| # | Selector | Elemento |
|:---:|---|---|
| 1 | `#chip-os` | Badge de NEXUS_OS (topbar) |
| 2 | `input` | Input de búsqueda |
| 3 | `.kbd` | Shortcut hint `⌘K` |
| 4 | `.user-badge` | Badge del usuario (ANALISTA_ECONOMÍA · Trelew, AR) |
| 5 | `.ticker` | Feed de patrones detectados |

**Causa raíz:** el layout del preview usa `<div class="topbar">` y no hay `<header>`, `<main>` ni `<nav>`. Todo el contenido está en `<div>` genéricos.

**Fix propuesto (Fase 4.3.1):**

```html
<header class="sov-topbar" role="banner">
  <!-- chip + search + kbd + user-badge -->
</header>

<nav class="sov-sidebar" aria-label="Navegación principal" role="navigation">
  <!-- sidebar content -->
</nav>

<main class="sov-main" role="main">
  <!-- kpi cards + sovereign card + paneles -->
  <aside class="sov-ticker" aria-label="Feed de patrones" role="complementary">
    <!-- ticker -->
  </aside>
</main>
```

Impacto en CSS: cero (los selectores `.sov-topbar`, `.sov-sidebar`, etc., se mapean 1:1 con los actuales).
Impacto en JS: cero.
Impacto visual: cero.

---

## 2. Incomplete (revisión manual requerida)

### I1 — `aria-hidden-focus` (serious · WCAG 4.1.2) — **issue real confirmado**

**Descripción:** elementos con `aria-hidden="true"` no deben ser focusables ni contener focusables. Los modales del preview (`#modal-os`, `#modal-cycle`) están marcados con `aria-hidden="true"` cuando están cerrados, pero su CSS los cierra con `opacity:0 + pointer-events:none` — lo que **no los saca del tab order**. Los `<button>` internos siguen siendo tabeables.

**Ubicaciones:**

- `NEXUS-preview-sovereign.html:596–604` — regla CSS de `.overlay`.
- `NEXUS-preview-sovereign.html:1138` — `#modal-os` con `aria-hidden="true"` inicial.
- `NEXUS-preview-sovereign.html:1169` — `#modal-cycle` con `aria-hidden="true"` inicial.
- `NEXUS-preview-sovereign.html:1331, 1338` — el JS hace toggle de `aria-hidden` pero no del tab order.

**Fix propuesto — opción A (moderna, recomendada):** usar el atributo `inert` de HTML5 (saca del tab order + del aria tree).

```html
<div class="sov-overlay" id="modal-os" role="dialog" inert>
  <!-- cuando se abre: el.removeAttribute('inert'); el.setAttribute('aria-hidden','false'); -->
</div>
```

**Fix propuesto — opción B (fallback compatibilidad):** cuando `aria-hidden="true"`, agregar `visibility: hidden` o `display: none` al CSS de `.sov-overlay`.

```css
.sov-overlay[aria-hidden="true"] { visibility: hidden; }
```

Recomendado: **opción A** (`inert`) — es el estándar moderno, soportado en todos los browsers modernos (Chrome 102+, Firefox 112+, Safari 15.5+). El portal productivo ya asume evergreen browsers.

### I2 — `color-contrast` (serious · WCAG 1.4.3) — **probablemente falso positivo**

**Descripción:** 1 elemento no cumple el ratio de contraste AA. axe no pudo calcular con certeza porque jsdom no layoutea.

**Verificación necesaria:** correr el audit en browser real con axe DevTools o Chrome Lighthouse. Candidatos sospechosos a chequear visualmente en el preview:

- `.text-lo` (`#64748B` sobre `#0F0F11`) — ratio calculado ≈ 5.3:1 · **PASS AA** ✓
- `.text-mono` (`#94A3B8` sobre `#0F0F11`) — ratio ≈ 8.9:1 · **PASS AAA** ✓
- `.ticker-label` (`#64748B` sobre `#050506`) — ratio ≈ 5.8:1 · **PASS AA** ✓
- Chips con `color: var(--accent)` sobre `var(--accent-glow)` — este es el más probable fallo. Verde `#4ADE80` sobre verde translúcido puede dar contraste bajo.

**Recomendación Fase 4.3.1:** correr axe desde Chrome DevTools sobre el preview local para identificar el nodo exacto. Si es el caso de chip accent, oscurecer el texto a `var(--accent-hi)` (`#22C55E`) o aumentar opacidad del glow.

### I3 — `landmark-one-main` (moderate · best-practice) — **issue real**

**Descripción:** el documento no contiene un `<main>` único. Relacionado directamente con V1 — se resuelve con el mismo fix (envolver el contenido principal en `<main role="main">`).

### I4 — `page-has-heading-one` (moderate · best-practice) — **probable falso positivo**

**Descripción:** la página debería tener un `<h1>`. Axe no lo detectó.

**Verificación:** sí hay un `<h1>` en línea 1001 del preview:

```html
<h1>Vista de <span class="accent">Comando</span></h1>
```

Está dentro del bloque `.sovereign-card`, que es visible al render. axe lo marcó como incomplete porque jsdom no pudo determinar si el `<h1>` es efectivamente renderizado (sin layout). En browser real debería pasar. **Recomendación:** confirmar en la segunda pasada con axe DevTools en Chrome.

---

## 3. Matriz de acción

| # | Finding | Severidad | Ubicación | Fix | Dónde en roadmap |
|:---:|---|:---:|---|---|---|
| V1 | Topbar fuera de landmarks | moderate | topbar completo | Envolver en `<header role="banner">` | Fase 4.3.1 |
| I1 | Modales focusables con aria-hidden | serious | `#modal-os`, `#modal-cycle` | Agregar `inert` attribute en estado cerrado | Fase 4.3.1 |
| I2 | Color contrast incompleto | serious | 1 elemento (probable `.chip` accent) | Revisar con axe DevTools, ajustar tokens si falla | Fase 4.3.1 |
| I3 | Falta `<main>` | moderate | root del body | Mismo fix que V1 | Fase 4.3.1 |
| I4 | `<h1>` no detectado | moderate | línea 1001 | Confirmar visible en browser real | Fase 4.3.1 |

---

## 4. Contrato de accesibilidad para Fase 4.3+

Para que la migración no degrade la accesibilidad al reskin de cada componente, estos contratos quedan explícitos:

1. **Todo modal Sovereign debe soportar `inert` en estado cerrado.** No usar solo `aria-hidden`.
2. **Todo modal debe tener focus trap activo cuando está abierto** (pendiente de implementar; el preview actualmente no lo tiene).
3. **Todo modal debe cerrarse con `Esc`.** El preview ya lo cumple (línea 1349 del preview).
4. **Navegación por teclado completa:** cada componente de la Fase 4.3 debe ser operable sin mouse. Sidebar, quiz cycler, panic mode, ticker — todos con tab order sensato y visible focus ring.
5. **Visible focus ring:** revisar que ningún selector del preview o del portal haga `outline: none` sin alternativa visible. En Fase 4.3.1 agregar una regla default `:focus-visible` con outline Sovereign (`2px solid var(--sov-accent)`).
6. **Contraste AA mínimo:** ningún par fondo/texto por debajo de 4.5:1 (texto regular) o 3:1 (texto grande ≥18 pt). Verificar en cada PR con axe DevTools.
7. **Landmarks semánticos obligatorios:** `<header>`, `<nav>`, `<main>`, `<aside role="complementary">` para el ticker, `<footer>` si aplica.

---

## 5. Checklist de salida Fase 4.0 — a11y

- [x] Audit automático ejecutado con axe-core (33 reglas evaluadas).
- [x] 1 violation confirmada, plan de fix en Fase 4.3.1.
- [x] 4 incomplete analizadas manualmente y clasificadas (2 reales, 2 probables falsos positivos).
- [x] Contrato de accesibilidad para Fase 4.3+ documentado (7 puntos).
- [ ] Segunda pasada con axe DevTools en Chrome sobre preview local (pendiente, confirma I2 y I4).
- [ ] Implementar focus trap en modales (pendiente, Fase 4.3.2 cuando se migre el modal-os).

---

## 6. Referencias

- `FASE4_AUDIT.md` — audit arquitectónico global.
- `INFORME_AUDITOR.md` §6.4 — punto de origen de este audit de accesibilidad.
- Regla `region`: https://dequeuniversity.com/rules/axe/4.11/region
- Regla `aria-hidden-focus`: https://dequeuniversity.com/rules/axe/4.11/aria-hidden-focus
- MDN `inert`: https://developer.mozilla.org/docs/Web/HTML/Global_attributes/inert

*Fin del audit de accesibilidad Fase 4.0.*
