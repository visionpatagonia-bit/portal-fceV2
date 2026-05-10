# Sprint 2 · Día 3 · CIERRE · Check-in del día + sensaciones

**Fecha:** 2026-05-10 madrugada (continuación post D2)
**Objetivo D3:** Luz puede marcar "hice mi rutina hoy" + registrar cómo se sintió (1-5 emojis + nota)
**Estado:** ✅ 11/11 asserts D3 + 118/119 acumulados Sprint 1+1.5+D1+D2 = **129/130 acumulados**

---

## Qué se entregó

**1. SENSATIONS_KEY namespace** (`nx_sensations`):
- Schema: `{[clientId]: {[dateISO]: {mood: 1-5, note: string<=500, ts: number}}}`
- LS persistence + mirror a Dexie via NX_DEXIE proxy (CRDT-ready · compatible Sprint 1)
- API:
  - `getStudentSensations(clientId)` → map dateISO → {mood, note}
  - `setStudentSensation(clientId, dateISO, mood, note)` → bool

**2. window.nxStudentCheckIn(clientId)** modal:
- Header eyebrow "CHECK-IN DEL DÍA" + título "¡Bien hecho, [nombre]! 💪"
- 5 emojis mood: 😣 (1 Pesado) · 😐 (2 Justo) · 🙂 (3 Bien) · 😊 (4 Muy bien) · 💪 (5 Fuerte)
- Click emoji → border naranja + bg highlight (visual feedback)
- Textarea opcional 500 chars · placeholder "¿alguna molestia? ¿cambio en peso/reps?"
- 2 botones: "Después" (cancel) + "✓ Marcar hecho" (submit)
- Cerrar con × · click overlay · escape implícito

**3. nxSubmitCheckIn flow integrado:**
1. `setAttendance(clientId, today, "present")` → marca día como hecho
2. `setStudentSensation(clientId, today, mood, note)` → si hay datos
3. `bumpStreak()` → racha sube +1
4. Cerrar modal + toast "¡Sumaste tu sesión de hoy!"
5. Re-render `renderClientView()` + `nxRenderStudentEnhancements(c)` → grid semana muestra ✓ y CTA cambia a "Hecho hoy" disabled

**4. CTA dual en topbar de vista alumna:**
- Antes (D2): solo "💪 Ver mi rutina"
- Ahora (D3): **"💪 Ver mi rutina" + "✓ Hice mi rutina hoy"** (verde #10B981 con shadow)
- Si ya marcó hoy: 2do botón se reemplaza por **"✓ Hecho hoy"** disabled (estado claro · evita re-click)
- Detect via `getAttendance(client.id)[today] === "present"`
- Inyección sin gating frágil de selector (D2 fix · siempre se muestra ahora)

---

## Validación

| Smoke | Pass/Total | Notas |
|---|---|---|
| **smoke_student_checkin** (D3 nuevo) | **11/11** | sensations API + modal + flow + CTA dual + alreadyDone detect |
| smoke_student_enhancements (D2) | 9/9 | regression OK (CTA + Footer + microcopy) |
| smoke_pwa_install (D1) | 14/14 | regression OK |
| smoke_h4_h5 | 12/12 | regression OK |
| smoke_nx_catalog | 14/14 | regression OK |
| smoke_extended_ui | 12/12 | regression OK |
| smoke_sw_cache | 11/11 | regression OK |
| smoke_headless (Sprint 1 baseline) | 46/47 | 1 WARN preexistente · 0 regresión |
| **Total Sprint 2 D3 acumulado** | **129/130** | 8 smokes · 0 FAIL · 1 WARN preexistente |

---

## Decisiones aplicadas

1. **5 emojis vs slider numérico.** Más mobile-first · tap directo · sin precisión innecesaria. Las gimnasias femeninas Anubis prefieren emojis a sliders técnicos.

2. **Note opcional max 500 chars.** Truncado en `setStudentSensation` por safety quota + XSS prevention. Suficiente para "Me dolió un poco la rodilla" o "subí 2kg en sentadilla".

3. **CTA dual visible siempre · no gated.** D2 tenía bug de selector frágil (`.day-card`, etc no existían). D3 quita gating: si la alumna está en student-mode · CTA aparece.

4. **alreadyDone detection en frontend.** Lee `nx_attendance` LS · NO Dexie. Es sync rápido · evita pause UI esperando Dexie. Mirror Dexie es para CRDT futuro · NO hot-path render.

5. **Modal vs página separada.** Modal mantiene flujo · alumna no pierde contexto · tap → callback → ✓. Página separada hubiera requerido routing.

6. **Mirror Dexie de sensaciones.** `setStudentSensation` escribe LS Y Dexie. Si Sprint 1 NX_DEXIE inactivo (`?dexie=0`) · solo LS. Cero crash si Dexie falla · LS es source-of-truth en frontend.

---

## Trade-offs explícitos

1. **Sensaciones NO se sincronizan al coach automáticamente.** Quedan en device local de Luz. Coach las ve solo si Luz comparte el device o exportamos snapshot. Limitación PMV: para sync coach→alumna real necesitamos backend (Sprint #161 Firebase).

2. **Sin reminder/notification.** Luz tiene que abrir la app voluntariamente cada día. Push notifications requieren backend + Firebase Cloud Messaging. Trade-off aceptable PMV.

3. **Mood scale 1-5 sin escala continua.** Si Luz se siente "3.5" no puede registrarlo. Decisión: keep simple. Si emerge necesidad → slider 1-10 en futuro.

4. **Check-in solo "presente" · no "ausente"/"parcial".** D3 simplifica a "hice/no hice". Caso "hice mitad" no cubierto · alumna decide qué tap.

5. **Re-render renderClientView() post-submit.** Si hay race condition o STATE.currentClient cambió, re-render puede mostrar info errónea. Aceptable: setTimeout 200ms da margen + mostly idempotente.

---

## Verificación post-deploy esperada

1. **Vista Alumna (`?student=ID` ventana normal):**
   - Topbar: saludo cálido + botón Instalar (regression D1+D2)
   - CTA dual visible: "💪 Ver mi rutina" + "✓ Hice mi rutina hoy"
   - Click "Hice mi rutina" → modal aparece
   - Modal: 5 emojis · textarea opcional · "✓ Marcar hecho"
   - Tap emoji → border naranja highlight
   - Submit → toast "¡Sumaste tu sesión!" · modal cierra · grid semana DOM muestra ✓ · CTA cambia a "Hecho hoy" disabled
2. **Persistence test:**
   - Reload página → ✓ persiste en grid semana (LS persistente)
   - Console: `localStorage.getItem('nx_sensations')` retorna JSON con clientId + today
3. **Cartera coach:** sin cambios · regression OK

---

## Pendiente Sprint 2 D4

- **D4 (~1h):** smoke final + deploy + validación user (Ariel manda link a Luz · feedback real)
- Cierre formal Sprint 2 con resumen ejecutivo + memoria final + tag git opcional

---

## Kill-switches activos (sin cambios + nuevo)

- Sprint 1 NX_DEXIE: `?dexie=0`
- Sprint 1.5 D2: toggle catálogo OFF
- Sprint 1.5 D3.A: NX_CATALOG.getError()
- Sprint 1.5 D3.C: NX_SW.purge()
- Sprint 2 D1 PWA: fallback SVG inline
- Sprint 2 D2: enhancements no-op si !student-mode
- **Sprint 2 D3 sensations:** si setStudentSensation falla → toast error · LS sigue source-of-truth · no crash render

---

**Veredicto D3:** Luz ahora puede registrar su sesión + cómo se sintió. Datos persisten LS + Dexie mirror. Coach futuro (Sprint Firebase) podrá leer este histórico cuando haya backend. Por ahora: tracking real local-first.
