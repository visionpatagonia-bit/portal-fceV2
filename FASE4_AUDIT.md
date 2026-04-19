# FASE 4.0 — Audit arquitectónico (UI Sovereign → portal productivo)

**Fecha:** 2026-04-19 · **Responsable técnico:** Juan · **Sesión:** pre-demo hardening
**Inputs:** `NEXUS-preview-sovereign.html` (1 525 líneas), `index.html` (5 162 líneas).
**Output:** este documento + matriz de migración para Fase 4.1–4.5.

Este documento es el entregable oficial de la Fase 4.0 según la sección 5.3 del `INFORME_AUDITOR.md`. Su único propósito es producir un inventario exhaustivo; no se toca código productivo.

---

## 0. Resumen ejecutivo

- El preview Sovereign define **~25 vars CSS**, **~10 componentes visuales** y **6 animaciones** distintivas. Es autónomo: no depende de nada del portal productivo.
- Se detectan **3 colisiones críticas de namespace** (`.chip`, `.dot`, `.bar`) y **2 colisiones secundarias** (`.overlay`, reglas globales en `html/body`).
- Hay **5 riesgos específicos** identificados, todos mitigables con renaming + scoping bajo un flag `[data-theme="sovereign"]`.
- La migración se puede ordenar en **4 sub-bloques de riesgo creciente** (4.3.1 → 4.3.4), con rollback por componente individual.
- **Estimación ajustada:** 10–14 h efectivas para la migración gradual (Fase 4.3), dentro del rango de 8–12 h originalmente previsto en el informe al auditor.

**Veredicto arquitectónico:** viable, riesgo medio, reversible. No hay *dealbreakers*. La complejidad más alta está en el `cycle modal` y en la convivencia de `.overlay` con los modales `.q55-*` ya productivos.

---

## 1. Design tokens del preview Sovereign

**Ubicación:** bloque `<style>` líneas 10–90 del preview. Todas las vars viven en `:root`.

### 1.1 Fuentes

| Uso | Fuente | Fallbacks | Pesos |
|---|---|---|---|
| Headers + body | **Inter** | `-apple-system, 'Segoe UI', sans-serif` | 400, 500, 600, 700, 800, 900 |
| Monospace | **JetBrains Mono** | `Consolas, ui-monospace, monospace` | 400, 600, 700 |

Ambas se cargan vía Google Fonts (líneas 10, 61). Para el portal productivo conviene self-host (Vercel + `/fonts/`) para evitar dependencia externa y mejorar TTFB.

### 1.2 Paleta de color

Agrupada por uso funcional (renombrada con prefijo `--sov-` para la migración):

| Categoría | Variable (preview) | → `--sov-*` | Hex / valor |
|---|---|---|---|
| **Fondos** | `--bg` | `--sov-bg` | `#050506` |
| | `--bg-alt` | `--sov-bg-alt` | `#0A0A0B` |
| | `--panel` | `--sov-panel` | `#0F0F11` |
| | `--panel-hi` | `--sov-panel-hi` | `#16161A` |
| | `--panel-glow` | `--sov-panel-glow` | `#1C1C20` |
| **Bordes** | `--line` | `--sov-line` | `rgba(255,255,255,.06)` |
| | `--line-hi` | `--sov-line-hi` | `rgba(255,255,255,.10)` |
| **Texto** | `--text-hi` | `--sov-text-hi` | `#F8FAFC` |
| | `--text-mid` | `--sov-text-mid` | `#CBD5E1` |
| | `--text-lo` | `--sov-text-lo` | `#64748B` |
| | `--text-mono` | `--sov-text-mono` | `#94A3B8` |
| **Acento verde** | `--accent` | `--sov-accent` | `#4ADE80` |
| | `--accent-hi` | `--sov-accent-hi` | `#22C55E` |
| | `--accent-glow` | `--sov-accent-glow` | `rgba(74,222,128,.16)` |
| **Púrpura** | `--purple` | `--sov-purple` | `#A855F7` |
| | `--purple-hi` | `--sov-purple-hi` | `#9333EA` |
| | `--purple-glow` | `--sov-purple-glow` | `rgba(168,85,247,.18)` |
| **Rojo (pánico)** | `--red` | `--sov-red` | `#EF4444` |
| | `--red-hi` | `--sov-red-hi` | `#DC2626` |
| | `--red-glow` | `--sov-red-glow` | `rgba(239,68,68,.22)` |
| **Otros** | `--warm` | `--sov-warm` | `#F59E0B` |
| | `--blue` | `--sov-blue` | `#3B82F6` |

### 1.3 Spacings, radii, motion

No hay vars `--sp-*` ni `--radius-*` declaradas explícitamente — los valores están inline:

- **Radii:** `4px` (botones small), `10px` (chips, botones base), `14px` (cards), `16px` (sovereign card), `20px` (modales), `999px` (pills).
- **Padding interior de paneles:** `18–22px`.
- **Gap layouts:** `6–18px`.
- **Transitions:** `160–260ms ease`.
- **Keyframes:** `pulse` (1.4 s), `barPulse` (1.8 s), `fadeUp` (0.6 s), `toastBar` (7 s lineal).

**Recomendación 4.2:** al extraer a `nexus-sovereign-tokens.css`, promover estos valores a vars explícitas (`--sov-radius-sm`, `--sov-radius-md`, `--sov-motion-fast`, etc.) para tener un design system consolidado.

### 1.4 Tipografía base

| Rol | Fuente | Tamaño | Peso | Letter-spacing |
|---|---|---|---|---|
| Body | Inter | 13–14 px | 400–500 | -0.01em |
| H1 display | Inter | 42–46 px | 800–900 | -0.025em |
| H2 section | Inter | 20–24 px | 600–700 | -0.02em |
| Eyebrow/label | JetBrains Mono | 10–11 px | 600 | 0.12em (uppercase) |
| KPI value | JetBrains Mono | 28–32 px | 700 | 0.04em |

---

## 2. Componentes del preview Sovereign

Inventariados en orden de aparición en el DOM. Columna **Migración** = estimación de esfuerzo aislado (sin efectos de red con el resto).

| # | Componente | Clase raíz | JS handler | Datos | Migración |
|---:|---|---|---|---|---|
| 1 | Topbar | `.topbar` | listener chip-os (1356) | estáticos | Baja |
| 2 | Chip NEXUS_OS (badge) | `.chip` | click → `openModal('modal-os')` | estático | Baja |
| 3 | Sidebar | `.sidebar` | toggle active, nav switch | estático | Baja |
| 4 | KPI cards (grid) | `.kpi`, `.kpi-value` | counter animate (1295–1304) | mock `data-count` | Baja |
| 5 | Sovereign card | `.sovereign`, `.sov-head`, `.sov-bars` | state machine (1393); CTA → cycle modal | mock metrics | **Alta** |
| 6 | Panic mode | `.panic`, `.panic-cta` | toggle activo (1451); countdown (1467) | estático | Media |
| 7 | Ticker feed | `.ticker`, `.ticker-feed` | `pushFeed()` (1496); rotación 4.2 s | mock queue | Media |
| 8 | Toast patrones | `.toast`, `.toast-bar` | auto-show 2.6 s; dismiss 7 s | mock | Media |
| 9 | Cycle modal | `.overlay#modal-cycle`, `.cycle-step` | `advance()` cada 2.4 s (1417) | mock 6 pasos | **Alta** |
| 10 | Manifesto NEXUS_OS | `.overlay#modal-os`, `.man-*` | Esc key (1349), click-outside | estático | Baja |

**Observación importante sobre el "cycle":** no es un ciclador de ejercicios reales con datos del KB — es una **animación demostrativa** de 6 pasos mockeados (el sistema "trabajando"). Cuando se migre a productivo, habrá que decidir si:

- (a) se conserva como animación de demo visual (sin backend), o
- (b) se conecta a `nexus-quiz.js` y se convierte en ciclador real de ejercicios.

**Decisión tomada (2026-04-19, Juan):** opción (a) — mantener como animación demostrativa durante Fase 4.3. La opción (b) se promueve a **Fase 4.3.5 — Ciclador real**, condicionada a que antes se arme el modelo de ejercicios (diseño de estados intermedios correcto / incorrecto / omitido, integración con `nexus-quiz.js`, y criterios de selección adaptativa). No bloquea el resto de la migración Sovereign.

---

## 3. Colisiones de namespace

Grep sistemático sobre ambos archivos. Se listan las colisiones que pueden causar *style bleed* si se cargan los dos CSS sin scoping.

### 3.1 Colisiones críticas

| Clase | Preview (línea) | index.html | Renombre propuesto |
|---|---|---|---|
| `.chip` | L.76 — topbar status badge verde, clickeable | L.635, L.647 — label "inicio" y "hot status" | `.sov-chip` |
| `.dot` | L.87, 246 — círculo pulsante verde en chips | Usado en componentes globales sin namespace | `.sov-dot` |
| `.bar` | L.286 — barra animada en `.sov-bars` | L.756 `.kpi-minibar` (diferente contexto pero sufijo compartido) | `.sov-bar` |

### 3.2 Colisiones secundarias

| Clase | Preview | index.html | Tratamiento |
|---|---|---|---|
| `.overlay` | `#modal-os`, `#modal-cycle` — z-index 1100 | modales `.q55-*` con z-index 99997 | Renombrar preview → `.sov-overlay` (z-index distinto evita el solapamiento, pero el nombre compartido es fuente futura de bugs) |
| `.card` | L.437 — card layout principal | L.751 `.kpi-card`, L.1140 `.v4-mat-card` (ya namespaced) | Aceptable; renombrar `.sov-card` por higiene |
| `.progress` | L.467 — `.progress-bar` en sovereign card | L.1058 `.sb-prog-bar` (ya namespaced) | Sin conflicto directo; renombrar por consistencia |
| `.badge` | no usado | L.2029 `.mastery-badge` (ya namespaced) | Sin conflicto |

### 3.3 Reglas globales en html/body

- **Preview** (L.38–43): reset en `html, body { margin:0; font-family:Inter; background:var(--bg); -webkit-font-smoothing:antialiased; }`
- **index.html** (L.1938, 1952–1959): reglas en `:root` + `body.page { display:block !important; }` (L.4545).

Si se cargan ambos sin scoping, el reset del preview pisa el `background` y la `font-family` del portal. Solución: **envolver todo el CSS Sovereign en un scope** `[data-theme="sovereign"] { … }` y setear `document.documentElement.dataset.theme = 'sovereign'` solo bajo el flag.

---

## 4. Componentes del portal productivo que requieren reskin

Identificados por namespace. Se listan en orden de impacto visual y riesgo.

| Bloque | Namespace | Líneas aprox. | Reskin necesario | Riesgo |
|---|---|---:|---|:---:|
| Sidebar | `.sb-*` | 600–800 | Alta (nav principal) | Medio |
| Main content | `.pw-*` | 300–400 | Baja (pocos elementos) | Bajo |
| KPI section | `.kpi-*` | 750–810 | Media (datos dinámicos ya enganchados) | Medio |
| Quiz / Training (q55) | `.q55-*`, `.training-*`, `.fc-*` | 2090–2100+ | Alta (componentes complejos con estado) | **Alto** |
| Material card (v4) | `.v4-mat-card`, `.mc-*` | 1140–1400 | Media | Medio |
| Neumorfismo (v7.6) | `.nm-*` vars | 3350–3500 | Media (cambio visual global) | Medio |

**Decisión recomendada:** no tocar `.q55-*` ni `.training-*` en Fase 4.3 — migrar solo *wrapper* visual (fondos, tipografía, bordes). La paridad funcional de quizzes ya está resuelta; cambiar su markup internamente es riesgo innecesario.

---

## 5. Riesgos específicos detectados

### R1 — Cascade de `!important` en index.html

Ubicaciones:

- L.1964–1965: `.mc-well.tips-only > *:not(...) { display:none !important; } .show !important;`
- L.2027–2028: `.sb-item.unit-mastered { background ... !important; }`
- L.4545: `.page { display:block !important; }`

**Impacto:** cualquier override Sovereign que intente cambiar `display`, `background` o visibilidad de estos elementos va a fallar sin `!important` propio.
**Mitigación:** documentar estos 3 puntos como "no-touch" en Fase 4.3; si el Sovereign necesita modificarlos, usar selectores más específicos (`[data-theme=sovereign] .sb-item.unit-mastered`) en vez de `!important` competitivo.

### R2 — Body overflow lock en modales

Preview L.1332: `document.body.style.overflow = "hidden"` al abrir `modal-os`. index.html usa estado dinámico (`.open`, `.active`, `.cne-hidden`) en el mismo `<body>`.

**Impacto:** si un modal Sovereign se abre y el usuario cierra la pestaña sin dismiss explícito, el portal legacy queda con `overflow:hidden` en la próxima apertura (sobre todo si el flag vuelve a `legacy`).
**Mitigación:** encapsular el lock en una función `withBodyLock(fn)` que garantiza el restore en `finally`. Revisar todos los `closeModal` para confirmar restore.

### R3 — Grid layout hardcoded

Preview L.159–162: `.grid { grid-template-columns: 280px 1fr; }` fijo, sin media query.
index.html tiene media queries complejas (~L.2100) con breakpoints 480 / 760 px.

**Impacto:** en viewport <760 px el preview rompe (sidebar no se colapsa). La demo institucional se hará en desktop, pero el portal real se usa también en mobile.
**Mitigación:** en Fase 4.3.1 agregar media queries equivalentes a las del portal (colapso de sidebar bajo 760 px).

### R4 — Transitions globales

Preview L.43: `-webkit-font-smoothing: antialiased` en `body`.
index.html L.2014: `#sb, #topbar, #main { transition: var(--cne-transition); }`

**Impacto:** al activar Sovereign, las transitions del portal (300 ms aprox) aplicadas a sidebar/topbar/main van a efectuar cambios visuales simultáneos con las animaciones Sovereign (pulse, fadeUp, barPulse). Puede generar doble-animación perceptible al primer render.
**Mitigación:** durante el boot de Sovereign, setear `transition: none` temporal por 1 frame, luego restaurar.

### R5 — Z-index clash en overlays

Preview `.overlay` z-index 1100 vs index.html `.q55-*` modales z-index 99997.

**Impacto:** si el usuario abre un quiz q55 y encima se dispara un toast Sovereign (z-index implícito bajo), el toast queda oculto debajo. Si se abre `modal-os` y luego un quiz, el quiz tapa al modal.
**Mitigación:** definir una escala z-index Sovereign clara (`--sov-z-toast: 1200`, `--sov-z-overlay: 1300`, `--sov-z-panic: 1400`) todas por encima de `.q55-*`. Documentar como contrato.

---

## 6. Orden de migración ajustado (Fase 4.3)

Basado en el inventario real, el orden propuesto en el informe al auditor se mantiene casi idéntico pero se consolida en 4 sub-bloques:

### Fase 4.3.1 — Foundation (3–4 h · riesgo bajo)

1. Crear `styles/sovereign-tokens.css` con las ~25 vars renombradas a `--sov-*`.
2. Crear `styles/sovereign-base.css` con reset + tipografía + media queries responsive, todo scoped bajo `[data-theme="sovereign"]`.
3. Renombrar en el preview `.chip` → `.sov-chip`, `.dot` → `.sov-dot`, `.bar` → `.sov-bar`, `.overlay` → `.sov-overlay`, `.card` → `.sov-card`, `.progress` → `.sov-progress`.
4. Self-test: cargar el preview con el CSS renombrado en aislado y confirmar que se ve idéntico al original.

### Fase 4.3.2 — Componentes aislables (3–4 h · riesgo medio)

5. **Toast patrones** → wire con el observer adaptativo ya existente (`nexus-adaptive-engine.js`, evento `pattern_detected`).
6. **Manifesto NEXUS_OS modal** → contenido estático, zero backend; incluir Esc key + click-outside.
7. **Panic mode** → feature toggleable, encapsular `withBodyLock()`. Wire opcional con `nexus-quiz.js` para modo "8 s por pregunta".

Checkpoint: simulacro + `demo_evitar.js` verdes en ambos modos (`legacy` / `sovereign`).

### Fase 4.3.3 — Chrome + sidebar reskin (2–3 h · riesgo medio)

8. **Chrome visual base** — background, tipografía global, grid overlay (respetando media queries).
9. **Sidebar reskin** bajo namespace `.sov-sb-*`, clonando comportamiento de `.sb-*`. Paridad funcional verificada con checklist.
10. **KPI cards** — reskin visual, mantener binding a datos existentes.

### Fase 4.3.4 — Componentes complejos (4–6 h · riesgo alto)

11. **Ticker** → wire con log de eventos del engine (`nexus-ai.js`, filtered feed).
12. **Sovereign card** → montar como bloque separado en dashboard; decidir si es animación visual o binding real.
13. **Cycle modal** → montar como animación demostrativa (decisión D2). Preservar keyframes, mocks y timing del preview. No requiere binding al KB.

Checkpoint final: simulacro 10/10 en ambos modos, axe-core sin errores críticos, latencias p95 < 60 ms (igual o mejor que legacy).

### Fase 4.3.5 — Ciclador real (post modelo de ejercicios · sin fecha)

Condicionada a que se arme antes el **modelo de ejercicios**: diseño de estados (correcto / incorrecto / omitido), criterios de selección adaptativa (lógica ya presente en `nexus-adaptive-engine.js`), y criterios de cierre de ciclo. Cuando el modelo esté, esta sub-fase:

- Reemplaza la animación mock del cycle modal por un ciclador real.
- Conecta con `nexus-quiz.js` y con el motor adaptativo.
- Agrega telemetría de ciclo completado / abandonado.

**Estimación preliminar:** 6–10 h, dependiendo de qué tanto del motor adaptativo se reusa vs. se extiende. No bloquea ni se bloquea por ninguna otra sub-fase de 4.x.

---

## 7. Decisiones pendientes (para Juan)

Estas son decisiones de producto/arquitectura que no pueden tomarse automáticamente y deben quedar resueltas antes de Fase 4.3.2:

- **D1 — Self-host de fuentes — RESUELTA 2026-04-19 (Juan): self-host** (criterio: *la mejor para la lectura*). Inter + JetBrains Mono se sirven desde `/fonts/` con `font-display: swap` para evitar FOIT/FOUT. Ventajas: renderizado consistente sin depender de la CDN externa, TTFB más bajo (mismo dominio), resiliencia offline PWA.
- **D2 — Cycle modal — RESUELTA 2026-04-19 (Juan): opción (a)** — animación demostrativa ahora. Opción (b) → Fase 4.3.5, condicionada a armar antes el modelo de ejercicios.
- **D3 — Sovereign card datos — RESUELTA 2026-04-19 (Juan): datos reales** desde día 1. La card bindea contra el `adaptive-engine` (aciertos, racha, mastery por unidad/materia). Si falta data (usuario nuevo, sin eventos), fallback a estado placeholder explícito (no mock silencioso).
- **D4 — Panic mode — RESUELTA 2026-04-19 (Juan): togueable**. Queda fuera del default, accesible por query param `?panic=on` y/o botón UI en el perfil. No se promociona a default hasta tener telemetría favorable de uso + retención.
- **D5 — Rollout — RESUELTA 2026-04-19 (Juan): opt-in**. Activación por `?ui=sovereign` durante 7–10 días. Default sigue siendo `legacy` hasta que haya 48 h de telemetría verde (tasa de fallback LLM, latencia p95, errores JS) bajo `ui_mode=sovereign`. Recién entonces se flipa el default.

---

## 8. Checklist de salida Fase 4.0

- [x] Inventario de design tokens extraído.
- [x] Componentes del preview inventariados con complejidad estimada.
- [x] Colisiones de namespace identificadas.
- [x] Riesgos específicos documentados con mitigación.
- [x] Orden de migración refinado al estado real del código.
- [x] Decisiones de producto pendientes identificadas.
- [x] Validación con Juan de las decisiones D1–D5 — **todas resueltas 2026-04-19**. Fase 4.1 desbloqueada.
- [x] Accessibility audit con axe-core sobre el preview — **ejecutado 2026-04-19**. Resultado: 1 violation (moderate) + 4 incomplete, todas fixables en Fase 4.3.1. Reporte completo en `FASE4_A11Y_AUDIT.md`. Pendiente: segunda pasada con axe DevTools en Chrome para confirmar I2 (color-contrast) e I4 (h1 detection).

---

## 9. Referencias

- `INFORME_AUDITOR.md` §5 — Fase 4 roadmap original.
- `NEXUS-preview-sovereign.html` — preview standalone del 2026-04-18.
- `index.html` — portal productivo v19.30.7.
- `NEXUS_HYBRID_ARCHITECTURE_v1.2.md` — contratos del matcher (relevante para D3 Sovereign card).

*Fin del audit arquitectónico Fase 4.0.*
