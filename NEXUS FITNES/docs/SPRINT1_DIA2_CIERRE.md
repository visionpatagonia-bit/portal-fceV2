# Sprint 1 · Día 2 cierre · flag URL + proxy ramificado + smoke grilla cartesiana

**Fecha:** 2026-05-09 · sábado tarde-noche
**Status:** ✅ implementación + smokes Día 2 cerrados · ⏸️ esperando que Juan ejecute deploy

---

## 1. Lo que se hizo

### Modificaciones al HTML (3 ediciones · sin tocar nada del Día 1)

| Línea | Cambio | Efecto |
|---|---|---|
| L7159 | Proxy dual-write LS → IDB · ramificación condicional NX_USE_DEXIE | Cuando flag=1 · escribe a Dexie · sino a nxBackupStore legacy |
| L7990 | IIFE detect URL ?dexie=1 · setea window.NX_USE_DEXIE | Activación opt-in · runtime-toggle sin reload |
| (Día 1 · L7714) | NX_DEXIE wrapper · sin tocar | coexiste · ahora está ENGANCHADO al proxy |

### Smokes nuevos · persistentes en `NEXUS FITNES/scripts/`

| Archivo | Asserts | Resultado | Tiempo |
|---|---|---|---|
| `smoke_dexie_crud.js` | 10 | ✅ 10/10 OK | <1s |
| `smoke_dexie_migration.js` | 9 | ✅ 9/9 OK | <1s |
| `smoke_grilla_cartesiana.js` | 280 perfiles (7d × 8 goals × 5 levels) | ✅ 280/280 OK · 0 crashes · 0 vacíos | 4.2s |

### Anti-regresión

- Smoke headless general · ✅ 46 OK · 1 WARN · 0 FAIL (mismo baseline)
- Motor adaptativo intacto (`pickDayExercises` sin tocar)
- Módulo PDF Anubis intacto (líneas 7376-7710 · `NX_ANUBIS_PDF` sin tocar)
- localStorage sigue siendo primary read/write (síncrono · API existente)

---

## 2. Estado HTML

```
md5 pre-Día 2:  f59a47cb2973d3abebdf80ace0256295 (Día 1 · solo NX_DEXIE coexistencia)
md5 post-Día 2: 699e791c5933a4acc5f0970c663f559e (proxy ramificado + flag detect)
líneas: 7988 → 8028 (+40 del proxy + flag)
```

deploy_qa sincronizado · md5 coincide con master.

Backup pre-Día 2: `NEXUS FITNES/_backups/NEXUS_Fitness_pre-sprint1-dia2_20260509_175908.html` · rollback en 1 comando.

---

## 3. Argumento honesto · qué cambia y qué NO (objeción 5 arbitrada)

**Sprint 1 NO cambia "primary read/write":**
- localStorage sigue siendo síncrono
- `loadState`/`saveState`/`nxSaveClient`/etc. NO modificadas
- Toda la app sigue asumiendo lectura síncrona como hoy

**Sprint 1 SÍ promueve IDB a "primary backup":**
- Antes: `nxBackupStore` custom (key-value plano · sin schema versionado · sin CRDT helpers)
- Ahora (con flag): `NX_DEXIE` con schema CRDT-ready · cuota IDB ~50% del disco vs 5-10MB de LS

**Sprint 1 prepara path Yjs colaborativo:**
- Cada record tiene `_updated_at` (Last-Write-Wins) · `_version` (counter) · `_deleted` (tombstone)
- Sin Yjs hoy · pero cuando emerja caso colaborativo · migración trivial

---

## 4. Hallazgos del Día 2

### H3 (nuevo · NO bloqueante)

`package.json` en `portal_v19.3.0/` está cortado al final (`"depende` incompleto · 450 bytes · timestamp Apr 5). Rompe Node al subir el árbol buscando node_modules. **NO afecta producción ni el HTML real** · solo bloquea correr smokes desde el repo. Workaround: correr smokes desde `/tmp/nexus_smoke/` o desde Juan-side Windows (sin árbol contaminado).

**Recomendación:** evaluación independiente del lead. Fuera de scope Sprint 1.

---

## 5. Archivos para Juan-side (deploy)

### Generados

| Archivo | Bytes | Propósito |
|---|---|---|
| `SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_dia2.ps1` | 4152 (BOM) | Script con md5 parity-check + npx vercel + git commit/push |
| `SCRIPTS_DEPLOY/commit_message_sprint1_dia2.txt` | 4191 (BOM) | Commit message detallado con changelog completo |

### Pendiente de instalación local (para que los smokes corran en Juan-side)

```powershell
cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0\NEXUS FITNES\scripts"
npm install jsdom@^29 fake-indexeddb dexie@4.0.10 pdfmake@0.2.10 pdf-parse
```

(Esto ya lo hizo Juan según screenshot anterior · 91 packages · 3 moderate vulnerabilities NO críticas)

---

## 6. Plan de validación (Día 3-4 · 48h)

### Yo (programador · con flag)

- Abro `https://nexus-fitness-ruby.vercel.app/?dexie=1` en navegador anónimo (Chrome + Firefox)
- F12 → Console → verificar:
  - `typeof NX_USE_DEXIE` → `'boolean'`
  - `NX_USE_DEXIE` → `true`
  - `[NX_DEXIE] flag URL ?dexie=1 detectada` aparece en console
  - `await NX_DEXIE.snapshot()` → muestra records migrados
- Genero rutina · cliente · etc. · verifico que data persista en Dexie
- Ventana 48h · sin reportar problemas

### Ariel (sin flag · default)

- Sigue usando `https://nexus-fitness-ruby.vercel.app` (sin parámetros)
- Cero cambio en su flow · NEXUS funciona como hoy
- NEXUS_USE_DEXIE = false · todo va a LS + nxBackupStore legacy

---

## 7. Decisión arquitectónica refinada (vs plan original)

El plan original Día 2 decía: "reescribir loadState/saveState/nxSaveClient/nxSaveRoutine para Dexie cuando flag=1 · LS fallback elegante si Dexie falla init"

**Lo que hice realmente:** NO toqué esas 4 funciones. Solo modifiqué el proxy dual-write (1 línea condicional).

**Razón:** las 4 funciones usan `localStorage.setItem` directamente. El proxy ya las intercepta. Reescribirlas sería redundante y aumentaría riesgo. Disciplina O1 aplicada.

**Trade-off honesto:** el wrapper Dexie hoy es solo destino del backup async. NO es primary read/write. Para hacerlo primary read/write hay que reescribir loadState a async · cambio masivo · merece sprint propio si emerge necesidad.

**Este matiz está en el commit message** (sección "ARGUMENTO HONESTO") para que el CTO lo vea explícito.

---

## 8. Lo que NO se hizo · y por qué

| Item | Por qué NO | Cuándo |
|---|---|---|
| Reescribir loadState/saveState a async | NO necesario · proxy intercepta setItem · disciplina O1 | Si emerge caso real |
| Free-exercise-db (catálogo expandido) | Sprint 1.5 (objeción 3 arbitrada por CTO) | Post-Trucco |
| UI buscador catálogo extendido | Sprint 1.5 con free-exercise-db | Post-Trucco |
| Lit + Web Components (Misión 2) | Sprint 4+ con disparador | Cuando duplicación HTML > 30% |
| Open Props + W1+W5 (UI tokens) | Sprint 3 (lunes 26-28 may) | Post-Trucco |

---

## 9. Plan Día 3-4 (validación 48h · sin código)

| Día | Tarea | Owner |
|---|---|---|
| Día 3 (domingo o lunes) | Yo abro `?dexie=1` · valido manual cargar + use Dexie | Programador |
| Día 3 EOD | Reporte intermedio: latencia · sin errores · F12 limpio | Programador |
| Día 4 | Sin tocar código · Ariel sigue sin flag intacta | (espera) |
| Día 4 EOD | Decisión: si OK · pasamos a Día 5 cierre | Lead |

---

## 10. Plan Día 5 (cierre)

1. Flippear flag a default · `NX_USE_DEXIE = true` por default (sin necesitar URL)
2. Ariel hereda automático sin tocar nada
3. Informe Sprint 1 cierre formato estándar (mismo nivel del v3.3 PDF que el CTO calificó "entre los mejores")
4. Commit + push final · md5 parity-check pre-deploy
5. Backlog post-Sprint 1: Sprint 1.5 (free-exercise-db) · Sprint 2 (Trucco) · Sprint 3 (Open Props + W1+W5) · #160 PWA Alumna · #161 Firebase

---

## 11. Resumen para checkpoint con lead

✅ Implementación Día 2 cerrada · 3 ediciones HTML quirúrgicas
✅ 19 + 280 = 299 asserts smokes verdes · 0 regresión
✅ Proxy dual-write ramificado · flag URL detect funcional
✅ Coexistencia mantenida · Ariel intacta sin flag
✅ Argumento honesto en commit message · "primary backup" (no "primary read/write")
✅ deploy_qa sincronizado · md5 master = deploy_qa = `699e791c`
✅ Script PowerShell + commit message listos (BOM UTF-8) para Juan-side

⏸️ **Esperando que Juan ejecute:**

```powershell
cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
.\SCRIPTS_DEPLOY\deploy_y_versionar_sprint1_dia2.ps1
```

Después · yo abro `?dexie=1` y arrancan las 48h de validación.
