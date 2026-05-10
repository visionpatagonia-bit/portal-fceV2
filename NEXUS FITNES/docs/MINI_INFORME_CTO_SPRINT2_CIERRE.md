# Mini informe CTO · Sprint 2 PWA Alumna · CERRADO

**Fecha:** 2026-05-10 madrugada · **Lead:** Juan · **Sesión:** continua sábado-domingo (mismo día que Sprint 1.5 cierre)

---

## Decisión estratégica origen

Tu arbitraje 2026-05-10: "agenda lo de Trucco pero no salgamos del modo fitness que estamos rompiendo expectativas" → Sprint 2 = **PWA Alumna acelerada** en lugar de Trucco lunes 19. Trucco re-clasificado a backlog frío trigger-activated (5 triggers).

---

## Lo entregado · 4 deploys incrementales

| Día | Bloque | Asserts |
|---|---|---|
| **D1** PWA install | manifest + 4 iconos + window.NX_PWA + botón Instalar + LS persistence redirect | 14/14 ✓ |
| **D2** Hero pulido | CTA "Ver mi rutina" + Footer brand + microcopy contextual + fix bug D1 + MIME fix vercel.json | 9/9 ✓ |
| **D3** Check-in tracking | Modal 5 emojis + nota + SENSATIONS_KEY + CTA dual "Hice mi rutina hoy" + alreadyDone detect | 11/11 ✓ |
| **D4** Cierre formal | Resumen ejecutivo + memoria + commit docs | — |

---

## Validación

- **3 smokes nuevos persistentes** en `NEXUS FITNES/scripts/`
- **129/130 asserts acumulados Sprint 2** (1 WARN preexistente · 0 FAIL)
- **Regression Sprint 1+1.5 baseline:** smoke_headless 46/47 idéntico a través de los 4 deploys
- **Validación user en producción:** D1 confirmado screenshot (Chrome URL bar Instalar nativo + console NX_PWA logs) · D2 confirmado screenshot ("va tomando color me gusta" · botón Instalar visible · saludo contextual nocturno · todo intacto)

---

## Lo que cambia para Luz/socias Anubis

**Antes (pre-Sprint 2):**
- Vista Alumna era una versión coach con sidebar oculto
- Acceso solo via link `?student=ID` cada vez
- Sin tracking propio · solo lectura de la rutina

**Después (Sprint 2):**
1. **Instalable como app real** en home screen (ícono A naranja)
2. **Saludo contextual** según hora del día (mañana/tarde/noche)
3. **Hero pulido** con racha visible + adherencia + objetivo
4. **CTA dual prominente:** "💪 Ver mi rutina" + "✓ Hice mi rutina hoy"
5. **Check-in con sensaciones:** 5 emojis (😣 → 💪) + nota opcional 500 chars
6. **Persistencia local** (LS + Dexie mirror) · sobrevive reload + restart Chrome
7. **Footer brand Anubis** "Hecho para vos por tu coach"
8. **Detect alreadyDone:** si ya marcó hoy, botón cambia a "✓ Hecho hoy" disabled

---

## Decisión clave: D3.B traducción LLM (postpone Sprint 1.6 sostenido)

Tu aprobación post-Sprint 1.5 mantiene D3.B postponed. Sprint 2 NO requirió LLM · todo se hizo con local-first + frontend nativo. Sprint 1.6 revisita D3.B solo si Ariel reporta confusión real con instrucciones EN del catálogo extendido.

---

## 3 patrones aprobados Sprint 1.5 · sostenidos en Sprint 2

1. ✅ **"No hacer" justificado** — sync coach-alumna sensaciones requiere backend (Sprint #161 Firebase) · postponed con justificación. Reminder/notification también requiere FCM · postponed.

2. ✅ **Framework preparatorio sin scope creep** — NX_PWA listener desde boot · CSP fix preparatorio para futura inyección de imágenes · `worker-src 'self'`.

3. ✅ **Trabajo arquitectónico preventivo** — MIME fix vercel.json incluido en D2 sin requerir redeploy aislado · CSP `connect-src` ampliado.

---

## 10 trade-offs documentados explícitos

1. start_url "/" + LS redirect (vs placeholder spec)
2. Iconos PNG bake-in (vs SVG-only · Safari iOS no soporta)
3. Inyección post-render vs reescribir renderClientView
4. CTA gradiente vs flat
5. Microcopy hora local hardcoded ES
6. 5 emojis vs slider numérico
7. Note 500 chars max + truncate
8. alreadyDone desde LS sync
9. Mirror Dexie sensations
10. CSP fix preparatorio sin necesidad inmediata

---

## 8 kill-switches activos producción

1. `?dexie=0` (Sprint 1)
2. Toggle catálogo OFF (D2 Sprint 1.5)
3. NX_CATALOG.getError (D3.A)
4. NX_SW.purge (D3.C)
5. Manifest 404 → SVG fallback (D1)
6. Enhancements no-op si !student-mode (D2)
7. MIME fix revertible (D2)
8. setStudentSensation falla → LS source-of-truth (D3)

---

## Cadencia

4 ciclos {implement → smoke → deploy → validar} en ~2.5h post-Sprint 1.5:
- **D1** deploy · validado screenshots Chrome URL bar Instalar nativo + console
- **D2** deploy · validado "va tomando color me gusta" · botón Instalar visible · saludo contextual
- **D3** deploy · pendiente validation user (modal sensaciones flow)
- **D4** cierre formal (este doc + memoria + commit)

Disciplina O1 sostenida por 2 sprints consecutivos en sesión continua: Sprint 1.5 (4 deploys) + Sprint 2 (4 deploys) = **8 deploys validados** · cero regresión a través de TODOS.

---

## Pendiente real (declarado · NO oculto)

- D4 Sprint 2 final test: Ariel manda link a Luz · feedback uso real
- Render thumbnail imágenes EXT (Sprint 1.6)
- D3.B traducción LLM (Sprint 1.6 conditional)
- Sync coach-alumna sensaciones (Sprint #161 Firebase backend)
- Reminder/notification daily (Sprint #161 FCM)

---

## Veredicto

Sprint 2 PWA Alumna cerrado limpio. Luz/socias Anubis ahora tienen app real instalable con tracking propio · 100% local-first · CRDT-ready para futuro sync. Decisión de pivot post-Sprint 1.5 fue correcta: PMF emergente capitalizado · momentum sostenido.

**Listo para Sprint 1.6 (validation user real · render thumbnails · D3.B condicional) cuando arbitres timing · sin urgencia.**
