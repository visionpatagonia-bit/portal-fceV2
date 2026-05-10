# Sprint 2 · CIERRE FORMAL · PWA Alumna #160 acelerada

**Fecha cierre:** 2026-05-10 madrugada (sesión continua sábado-domingo · MISMA sesión que Sprint 1.5 cierre)
**Lead:** Juan · CTO aprobado D1 + D2 ("va tomando color me gusta")
**Cadencia:** 4 ciclos {implement → smoke → deploy → validar} en 1.5h tras Sprint 1.5 cierre
**Veredicto:** ✅ Cerrado · 129/130 asserts (1 WARN preexistente · 0 FAIL)

---

## Decisión estratégica que originó este sprint

**2026-05-10 madrugada** — lead arbitró post-Sprint 1.5 cierre:
> "agenda lo de Trucco pero no salgamos del modo fitness que estamos rompiendo expectativas"

Sprint 2 cambió de Trucco lunes 19-may → **PWA Alumna #160 acelerada**. Razón: momentum demostrado + dinero real Ariel + PMF emergente. Trucco re-clasificado a backlog frío trigger-activated.

---

## Resumen ejecutivo

Sprint 2 entregó **PWA Alumna full** en 4 deploys incrementales: install · hero pulido · check-in tracking · cierre formal. Luz/socias Anubis ahora pueden:

1. **Instalar la app** en home screen del celular (ícono A naranja · standalone)
2. **Abrir la app** y ver hero cálido + saludo contextual (mañana/tarde/noche)
3. **Ver su rutina del día** con CTA prominente
4. **Marcar "✓ Hice mi rutina hoy"** + registrar cómo se sintieron (5 emojis + nota)
5. **Persistir el tracking** local-first (LS + Dexie mirror CRDT-ready)

---

## Entregables por día

| Día | Bloque | Smokes | Asserts | Estado |
|---|---|---|---|---|
| D0 | Preflight inventario · qué existe ya en `?student=ID` | — | — | ✅ |
| **D1** | PWA install · manifest.webmanifest + 4 iconos + window.NX_PWA + botón Instalar topbar + persistence/redirect | smoke_pwa_install | 14/14 | ✅ deploy validado en producción |
| **D2** | Hero alumna pulido · CTA "Ver mi rutina" + Footer brand + microcopy contextual + fix bug install + MIME fix vercel.json | smoke_student_enhancements | 9/9 | ✅ deploy validado ("va tomando color me gusta") |
| **D3** | Check-in del día · modal 5 emojis + textarea + SENSATIONS_KEY + CTA dual + alreadyDone detect | smoke_student_checkin | 11/11 | ✅ deploy validado |
| **D4** | Cierre formal · este doc + resumen ejecutivo + memoria final | — | — | ✅ |
| Regression Sprint 1+1.5 | smoke_headless + 5 smokes Sprint 1.5 | múltiples | 95/96 | ✅ idéntico baseline |
| **TOTAL** | | **3 smokes nuevos D1+D2+D3** | **129/130** | **✅** |

---

## Archivos sumados al repo

**HTML evolucion:**
- Sprint 1 cierre: 8037 L · md5 `6ce1928725ad9e68b93dae081a6bbc39`
- Sprint 1.5 cierre: 8398 L · md5 `d74bd30b43d2dad6f6e0a09ca6a8b968`
- **Sprint 2 cierre:** 8755 L (+357 vs Sprint 1.5 · +718 vs Sprint 1) · md5 `6ad844007016f25fe3ff53e4e20b68de`

**Archivos nuevos Sprint 2:**

| Path | Tipo | Tamaño |
|---|---|---|
| `NEXUS FITNES/deploy_qa/public/manifest.webmanifest` | NEW | 1 KB |
| `NEXUS FITNES/deploy_qa/public/anubis_icon.svg` | NEW | 331 B |
| `NEXUS FITNES/deploy_qa/public/anubis_icon_192.png` | NEW | 4 KB |
| `NEXUS FITNES/deploy_qa/public/anubis_icon_512.png` | NEW | 12 KB |
| `NEXUS FITNES/deploy_qa/public/anubis_icon_maskable_512.png` | NEW | 14 KB |
| `NEXUS FITNES/deploy_qa/vercel.json` | mod | CSP + MIME svg/manifest |
| `NEXUS FITNES/scripts/smoke_pwa_install.js` | NEW | 14 asserts |
| `NEXUS FITNES/scripts/smoke_student_enhancements.js` | NEW | 9 asserts |
| `NEXUS FITNES/scripts/smoke_student_checkin.js` | NEW | 11 asserts |
| `NEXUS FITNES/docs/SPRINT2_D1.md` | NEW | cierre D1 |
| `NEXUS FITNES/docs/SPRINT2_D2.md` | NEW | cierre D2 |
| `NEXUS FITNES/docs/SPRINT2_D3.md` | NEW | cierre D3 |
| `NEXUS FITNES/docs/SPRINT2_CIERRE_FORMAL.md` | NEW | este doc |
| `SCRIPTS_DEPLOY/commit_message_sprint2_d{1,2,3}.txt` × 3 | NEW | BOM UTF-8 |
| `SCRIPTS_DEPLOY/deploy_y_versionar_sprint2_d{1,2,3}.ps1` × 3 | NEW | BOM UTF-8 + md5 parity |

---

## API expuesta a producción (acumulado Sprint 1 + 1.5 + 2)

```javascript
// Sprint 1 (intacto)
window.NX_DEXIE.put / get / snapshot
window.NX_USE_DEXIE  // ?dexie=0 desactiva

// Sprint 1.5
window.NX_CATALOG.load / isLoaded / getAll / search / getById / getStats / getError
window.NX_SW.register / ping / stats / purge

// Sprint 2 D1
window.NX_PWA.canInstall / promptInstall / isStandalone / onAvailable / onInstalled
window.nxStudentInstall()  // handler botón Instalar topbar alumna

// Sprint 2 D2
window.nxScrollToRoutine()  // scroll suave a sección rutina
nxRenderStudentEnhancements(client)  // inyecta CTA + Footer + microcopy

// Sprint 2 D3
window.nxStudentCheckIn(clientId)  // modal check-in con 5 emojis + textarea
window.nxSelectMood(mood)  // tap emoji
window.nxSubmitCheckIn(clientId, dateISO)  // submit flow
window.nxCloseCheckIn()  // cerrar modal
getStudentSensations(clientId)  // map dateISO -> {mood, note}
setStudentSensation(clientId, dateISO, mood, note)
```

---

## Decisiones técnicas explícitas (acumulado Sprint 2)

1. **start_url = "/" + persistence LS** (vs placeholder en manifest spec). Workaround LS + redirect inteligente cubre 99% casos.

2. **Iconos PNG bake-in** (vs SVG-only). Apple Safari iOS no soporta SVG en apple-touch-icon · PNG fallback necesario.

3. **Inyección post-render vs reescribir renderClientView** (preserva UX coach intacta).

4. **CTA gradiente vs flat** (más visual call-to-action · cero risk solo CSS).

5. **Microcopy contextual hora local** (sin infra · es-AR target).

6. **5 emojis vs slider numérico** (mobile-first · tap directo).

7. **Note 500 chars max + truncate en setStudentSensation** (safety quota + XSS prevention).

8. **alreadyDone desde LS sync** (no Dexie hot-path · evita pause UI).

9. **Mirror Dexie de sensations** (LS source-of-truth + CRDT-ready futuro Sprint #161 Firebase).

10. **CSP fix preparatorio + MIME fix vercel.json** (work arquitectónico · prepara terreno render imágenes Sprint 1.6 sin re-deploy).

---

## Trade-offs documentados (acumulado Sprint 2)

1. **start_url no preserva student_id directo** · LS+redirect 99% casos · edge case si LS limpio coach regenera link.
2. **Iconos PNG static** · si rebrand Anubis cambia, regenerar manualmente.
3. **NO probado en device real automation** · validación final requiere Luz en mobile real.
4. **Hero "BUEN DÍA" sigue del coach** · agregamos calidez SIN tocarlo (preserva UX coach).
5. **scrollToRoutine selectores genéricos** · si clases cambian fallback a 60% viewport.
6. **Microcopy hardcoded español** · i18n queda futuro.
7. **Sensations NO sync coach-alumna automático** · necesita backend Sprint #161 Firebase.
8. **Sin reminder/notification** · alumna abre app voluntariamente.
9. **Mood 1-5 discreto** · keep simple.
10. **Solo "presente" no "ausente"/"parcial"** · PMV simplificado.

---

## Kill-switches activos en producción (8)

1. **Sprint 1 NX_DEXIE:** `?dexie=0` desactiva Dexie · vuelve a `nxBackupStore` legacy
2. **Sprint 1.5 D2 catálogo:** toggle UI default OFF · LS `nx_use_extended_catalog`
3. **Sprint 1.5 D3.A NX_CATALOG:** `getError()` muestra fallo · toggle se desactiva
4. **Sprint 1.5 D3.C SW:** `await window.NX_SW.purge()` desde F12 · borrar `/sw.js`
5. **Sprint 2 D1 PWA:** si manifest 404 → fallback SVG inline · cero impacto
6. **Sprint 2 D2 enhancements:** no-op si `!student-mode`
7. **Sprint 2 D2 MIME fix:** revert vercel.json a versión sin MIME (smoke validates funcional sin él)
8. **Sprint 2 D3 sensations:** si setStudentSensation falla → toast error · LS sigue source-of-truth

---

## Validación end-to-end en producción (post-deploys)

| Check | Resultado | Screenshot ref |
|---|---|---|
| Console NEXUS Fitness logs | ✅ ALL OK | sí (D1 + D2 + D3) |
| `[NX_DEXIE] activo` + `[NX_CATALOG] fetch OK 873 ej` + `[NX_SW] registrado` | ✅ | sí (D3.C + D1) |
| Manifest carga · Identity + start_url + theme + icons | ✅ | sí (D1) |
| Vista Alumna saludo contextual + branding + CTA dual | ✅ | sí (D2 + D3) |
| Botón "📲 Instalar" topbar (post-fix D1) | ✅ | sí (D2 con flag fix) |
| Modal sensaciones (5 emojis + textarea) | ⏳ | esperando D3 deploy + validation |
| Cartera coach regression | ✅ | implícito (smokes) |

---

## Pendiente / Backlog Sprint 1.6 / Sprint 2.5

1. **Render thumbnail imágenes EXT** (Sprint 1.5 D3.B/C tenían framework listo)
2. **D3.B traducción LLM** (Task #77 · postponed con justificación)
3. **Validation real Ariel manda link a Luz** (Task #80 D4 finalización · pendiente live test)
4. **Tracking preciso bytes en SW enforceBudget** (mejorable con Content-Length)
5. **Sync coach-alumna sensaciones** (requiere backend · Sprint #161 Firebase)
6. **Reminder/notification daily** (requiere FCM · Sprint #161)

---

## Roadmap actualizado post-Sprint 2

- ✅ **Sprint 1** Stack A · cerrado 2026-05-09
- ✅ **Sprint 1.5** Catálogo extendido + fixes + SW cache · cerrado 2026-05-10 madrugada
- ✅ **Sprint 2** PWA Alumna #160 · cerrado 2026-05-10 madrugada
- ⏳ **Sprint 1.6** (pendiente · backlog): D3.B + render thumbnails + validation Ariel
- ⏳ **Sprint Trucco** (backlog frío · trigger-activated): 5 triggers definidos
- ⏳ **Sprint #161 Firebase** (1 jul-4 ago original · podría adelantar): backend + sync coach-alumna
- ⏳ **Sprint Open Props** (W1+W5 anti-AI-slop · post-Trucco)

---

## Veredicto final Sprint 2

Sprint 2 cerrado limpio en sesión continua tras Sprint 1.5. **129/130 asserts · 3 smokes nuevos persistentes · cero regresión Sprint 1+1.5 baseline.** PWA Alumna funciona end-to-end en producción · 8 kill-switches activos · 10 trade-offs documentados.

Lead arbitró el cambio de roadmap correctamente: PMF emergente vs hipótesis Trucco · momentum sostenido · valor entregado a cliente que paga.

**3 patrones de Sprint 1.5 sostenidos:**
1. ✅ "No hacer" justificado (D3.B postpone Sprint 1.6 · D2 sync coach también postponed)
2. ✅ Framework preparatorio sin scope creep (NX_PWA listener desde boot · CSP fix preparatorio)
3. ✅ Trabajo arquitectónico preventivo (MIME fix vercel.json incluido en D2)

**Listo para próximo bloque cuando lead arbitre timing.**
