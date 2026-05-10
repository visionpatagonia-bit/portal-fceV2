# Sprint 2 · Día 2 · CIERRE · Hero alumna pulido + fixes D1

**Fecha:** 2026-05-10 madrugada (continuación sesión post D1)
**Objetivo D2:** UX alumna más cálida + branding Anubis fuerte + fix bug install button
**Estado:** ✅ 9/9 asserts D2 + 109/110 acumulados Sprint 1+1.5+D1 = **118/119 acumulados**

---

## Qué se entregó

**1. Fix bug install button D1** (HTML mod L7127-7146):
- Bug raíz: `detectStudentUrl()` IIFE corre antes que `window.NX_PWA` se define en el HTML
- Antes: `if(window.NX_PWA && !standalone)` retornaba `false` → callback nunca registrado → botón nunca aparecía
- Fix: `setTimeout(() => { if(!window.NX_PWA) return; ... }, 500)` defiere chequeo a microtask siguiente
- Confirmado por console screenshot: `[NX_PWA] install disponible` apareció pero botón mio no porque callback no registrado

**2. nxRenderStudentEnhancements** (HTML +60 líneas):
- Función inyecta enhancements post-`renderClientView()` solo en `student-mode`
- Idempotente: chequea `getElementById` antes de inyectar (no duplica al re-render)
- 3 enhancements: CTA · Footer · Microcopy

**3. CTA "💪 Ver mi rutina del día"** (id `nx-student-cta`):
- Botón naranja con gradiente Anubis (linear-gradient #E85D04 → #FB8B24)
- Box-shadow sutil para depth
- Click → `nxScrollToRoutine()` scroll suave a primera sección con rutina
- Posicionado tras hero (segundo elemento del view)

**4. Footer brand Anubis** (id `nx-student-footer`):
- Eyebrow "ANUBIS ATHLETIC CENTER" en uppercase + naranja
- "Hecho para vos por tu coach · sesión a sesión"
- Sub "Tu rutina personal · NEXUS Fitness"
- Border-top sutil para separar del contenido

**5. Microcopy contextual topbar** (basado en hora del día):
- Mañana (5-12): "Buen día · listas para entrenar 💪"
- Tarde (12-19): "Buenas tardes · tu sesión te espera 🔥"
- Noche (19-5): "Buenas noches · sumá tu sesión 🌙"
- Reemplaza "Tu rutina personal · Anubis" estático
- Marcado con `data-nx-studentized` para no pisar al re-render

**6. window.nxScrollToRoutine** (handler global):
- Scroll suave a `.day-card`, `[data-day]`, `.ex-row`, o `.progress-card` (primer match)
- Fallback: scroll a 60% de viewport si no encuentra target
- Behavior: smooth + block start

**7. vercel.json MIME fix** (incluido aquí desde D1 issue):
- `*.svg` → `Content-Type: image/svg+xml` + cache 1 año
- `/manifest.webmanifest` → `Content-Type: application/manifest+json`
- Resuelve console error D1: `Icon https://...anubis_icon.svg failed to load`

---

## Validación

| Smoke | Pass/Total | Notas |
|---|---|---|
| **smoke_student_enhancements** (D2 nuevo) | **9/9** | nxRenderStudentEnhancements + CTA + Footer + microcopy + scroll handler + fix install + idempotencia |
| smoke_pwa_install (D1) | 14/14 | regression OK |
| smoke_h4_h5 (D2 Sprint 1.5) | 12/12 | regression OK |
| smoke_nx_catalog (D3.A core) | 14/14 | regression OK |
| smoke_extended_ui (D3.A UI) | 12/12 | regression OK |
| smoke_sw_cache (D3.C) | 11/11 | regression OK |
| smoke_headless (Sprint 1 baseline) | 46/47 | 1 WARN preexistente · 0 regresión |
| **Total Sprint 2 D2 acumulado** | **118/119** | 7 smokes · 0 FAIL · 1 WARN preexistente |

HTML md5 master · parity OK con deploy_qa.

---

## Decisiones aplicadas

1. **Inyección post-render vs reescribir renderClientView.** Reescribir afectaría al coach. Inyección con `nxRenderStudentEnhancements()` solo cuando `student-mode` class presente preserva UX coach intacta.

2. **CTA con gradiente vs flat.** Gradiente naranja vibrante (Anubis) genera más call-to-action visual. Cero risk · solo CSS inline.

3. **Microcopy contextual basado en hora local.** No requiere infra · `Date().getHours()` suficiente. Trade-off: si Luz está en otro huso horario, el saludo puede no coincidir con su hora real. Aceptable para target Argentina.

4. **Footer estático (no link).** No agregamos links externos · evita salir de la PWA. Branding pasivo · sin distracciones.

5. **Idempotencia con `getElementById`.** Si `renderClientView` se llama múltiples veces (e.g. tras edición), no duplicamos CTAs ni footers.

---

## Trade-offs explícitos

1. **Hero sigue siendo el de coach.** "BUEN DÍA · [apellido]" viene de `renderClientView` original. Modificarlo afectaría coach. Aceptable: el hero ya es funcional · agregamos calidez con CTA + footer + microcopy SIN tocarlo.

2. **scrollToRoutine usa selectores genéricos.** Si en futuro las clases cambian (`.day-card` deprecated, etc), el scroll falla silentemente al fallback (60% viewport). Maintenance future.

3. **Microcopy hardcoded en español.** Si más adelante hay alumnas no-español, requiere i18n. No es scope actual.

4. **NO testeo visual real con renderClientView en jsdom.** El smoke valida que el código SE INYECTA correctamente, no que se ve bien. Validación visual requiere browser real.

---

## Verificación post-deploy esperada

1. **Vista Alumna (`?student=ID` en ventana normal):**
   - Topbar: saludo cálido contextual según hora ("Buen día · listas para entrenar 💪" o variante)
   - Hero existente intacto (Buen día · racha · pills)
   - CTA "💪 Ver mi rutina del día" visible debajo del hero
   - Click CTA → scroll suave a primera sección rutina
   - Footer al fondo: "ANUBIS ATHLETIC CENTER · Hecho para vos por tu coach"
   - Botón "📲 Instalar" visible si `NX_PWA.canInstall()` (fix D1)

2. **CSP error desaparecido:** consola NO debe mostrar `Icon...anubis_icon.svg failed to load`. SVG ahora con MIME correcto.

3. **DevTools > Application > Manifest:** SVG icon load OK (✓ tras MIME fix).

4. **Cartera coach:** sin cambios · regression Path 1 H4 sigue OK.

---

## Pendiente Sprint 2 D3-D4

- **D3 (~1.5h):** Check-in del día + anotador estructurado en Dexie namespace alumna
- **D4 (~1h):** smoke + deploy + Ariel manda link a Luz · feedback real

---

**Veredicto D2:** UX alumna más cálida sin tocar el flujo coach. Bug install fix incluido. MIME fix también incluido. Listo para deploy D2.
