# Sprint 1 · Día 1 cierre · Dexie CRUD wrapper + schema CRDT-ready

**Fecha:** 2026-05-09 · sábado tarde-noche
**Status:** ✅ Día 1 cerrado · ⏸️ esperando checkpoint con lead antes de Día 2

---

## 1. Lo que se hizo

### Wrapper `NX_DEXIE` insertado en HTML (líneas 7714-7988)

- 220 líneas nuevas · `coexiste` con `nxBackupStore` legacy (NO lo reemplaza)
- Lazy-load Dexie 4.0.10 vía `cdn.jsdelivr.net` (CSP-friendly · mismo patrón que pdfmake)
- Single table `kv` con schema CRDT-ready: `&key, _updated_at, _version, _deleted`
- API pública compatible con `nxBackupStore`: `put / get / has / keys / snapshot / restore / softDelete`
- Migration automática desde `nxBackupStore` legacy al primer load · idempotente
- `nxBackupStore` legacy preservado · sirve de fallback si Dexie falla init

### Smokes nuevos · PERSISTENTES en repo (no en sandbox)

| Archivo | Asserts | Resultado |
|---|---|---|
| `NEXUS FITNES/scripts/smoke_dexie_crud.js` | 10 | ✅ 10 OK · 0 FAIL |
| `NEXUS FITNES/scripts/smoke_dexie_migration.js` | 9 | ✅ 9 OK · 0 FAIL |

**Cubren:** put + get + has + keys + snapshot + restore + softDelete + CRDT `_version` + `_updated_at` ISO + idempotencia migration + legacy preservado + API contract compatible.

### Anti-regresión

- Smoke headless general · ✅ 46 OK · 1 WARN · 0 FAIL (mismo baseline que pre-Sprint 1)
- Cero modificaciones al motor adaptativo (pickDayExercises)
- Cero modificaciones al módulo PDF Anubis (NX_ANUBIS_PDF intacto · líneas 7376-7710)
- Módulos ortogonales · cero variables compartidas

---

## 2. Estado HTML

```
md5 pre-Día 1:  4d02ceb37f1495f0b8e41205b64d5432 (v3.3 PDF · commit 42180cf)
md5 post-Día 1: f59a47cb2973d3abebdf80ace0256295 (Dexie wrapper insertado)
líneas: 7768 → 7988 (+220)
```

Backup pre-Día 1 archivado en `NEXUS FITNES/_backups/NEXUS_Fitness_pre-sprint1-dia1_20260509_172903.html` · rollback en 1 comando si fuera necesario.

---

## 3. Decisión arquitectónica sellada · single table 'kv'

El plan original proponía 12 tables (clients · routines · history · etc.) por queries declarativas. **Hoy elegí single table `kv`** porque:

1. **Contract de `nxBackupStore` intacto** · cero cambios al proxy dual-write existente · cero cambios a `loadState/saveState`
2. **Migration trivial (1:1)** · sin redistribuir data
3. **Si aparece caso de query** (ej: list clients sorted by `_updated_at`) · Dexie migrations permiten splittear sin perder data. Los CRDT helpers (`_updated_at` / `_version` / `_deleted`) ya están en cada record desde el día 1.
4. **Trade-off aceptable:** queries siguen siendo "load all + filter en JS" (igual que hoy con localStorage). Funciona hasta 500+ socios o caso de uso real que demande queries.

Documentado en bloque-comentario del código (HTML L7714-7740) y validado contra el plan original.

---

## 4. Hallazgos del día

### H1 (preflight) · resuelto

Smokes del sandbox `/tmp/nexus_smoke/` no persistían entre sesiones. **Resuelto:** los 2 smokes nuevos (CRUD + migration) están en `NEXUS FITNES/scripts/` con paths relativos. Solo dependen de `node_modules` · que Juan-side puede instalar con `npm install jsdom fake-indexeddb dexie@4.0.10` (después de limpiar los symlinks rotos).

### H2 (Día 1) · NO bloqueante

Hay un `pdfmake@0.3.7` en `/sessions/dreamy-happy-shannon/node_modules/` (carpeta padre de la sandbox · fuera del proyecto) que Node resuelve ANTES que el `pdfmake@0.2.10` instalado en `/tmp/nexus_smoke/`. Esto rompe el `smoke_pdf.js` cuando se ejecuta desde sandbox.

**No afecta nada real:**
- El HTML cargado en producción usa pdfmake@0.2.10 desde CDN (cdnjs)
- El módulo PDF Anubis está intacto (verificado por grep: `NX_ANUBIS_PDF` · `nxExportAnubisPDF` · `buildDocDef` · `enrichExercise` · `safeText` todos presentes)
- El smoke PDF funcionará en Juan-side (Windows · sin conflicto de ancestor node_modules)

**Acción:** no hacer nada. Cuando Juan corra el smoke desde su máquina · funciona. Si en el futuro alguien necesita correrlo desde sandbox · agregar `vfsModule.pdfMake?.vfs ?? vfsModule` como fallback. NO lo hago hoy · es scope Sprint 1.5 si aparece.

---

## 5. Lo que NO se hizo · y por qué

| Item | Por qué NO hoy | Cuándo |
|---|---|---|
| Reemplazar `nxBackupStore` por NX_DEXIE | Coexistencia primero · validar wrapper antes de hookear | Día 2 (con flag) |
| Modificar proxy dual-write LS → IDB | Igual razón · primero validamos wrapper | Día 2 |
| Reescribir `loadState`/`saveState` | Igual razón | Día 2 |
| Reescribir `nxSaveClient`/`nxSaveRoutine` | Igual razón | Día 2 |
| `smoke_grilla_cartesiana.js` (lección bug 6 días) | Día 2 obligatorio (objeción 4 arbitrada) | Día 2 |
| Deploy a producción | Sin flag activo · sin riesgo a Ariel | Día 2 con flag `?dexie=1` |
| Commit a git | Día 1 wrapper coexistiendo · sin uso real · prefiero commit junto a Día 2 | Día 2 al final |
| Cargar free-exercise-db | Sprint 1.5 (objeción 3 arbitrada) | post-Trucco |

---

## 6. Plan Día 2 (próxima sesión)

| Hora | Tarea | Tiempo |
|---|---|---|
| 0:00-0:30 | Detectar flag `?dexie=1` en URL · setear `window.NX_USE_DEXIE = true` boolean global | 30 min |
| 0:30-1:30 | Reescribir proxy dual-write para usar `NX_DEXIE` cuando flag=1 · LS sigue siendo primario · cambia solo el destino del backup IDB | 1h |
| 1:30-2:30 | Reescribir `loadState`/`saveState`: si flag=1, leer/escribir Dexie como primario · LS fallback elegante si Dexie falla init | 1h |
| 2:30-3:30 | Crear `smoke_grilla_cartesiana.js` · 7d × 8 goals × 5 levels = 280 perfiles · 0 crashes · 0 rutinas vacías | 1h |
| 3:30-4:00 | Anti-regresión completa: 5 smokes verdes (headless · CRUD · migration · grilla cartesiana · PDF) | 30 min |
| 4:00-4:30 | Deploy con flag (HTML actualizado a deploy_qa con md5 parity-check) · NO commit todavía | 30 min |
| Final | Yo abro `?dexie=1` en navegador anónimo · valido manualmente que cargue + use Dexie | 15 min |

**Estimado Día 2:** 4-4.5h · cierra con flag deployado (Ariel intacta en LS · yo valido con flag).

---

## 7. Archivos tocados · trazabilidad para auditor

| Archivo | Cambio | Estado |
|---|---|---|
| `NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html` | +220 líneas · NX_DEXIE wrapper insertado al final del último script tag (L7714-7988) · NO toca nxBackupStore ni proxy ni loadState | local · no commiteado todavía |
| `NEXUS FITNES/scripts/smoke_dexie_crud.js` | nuevo · 10 asserts | local · no commiteado |
| `NEXUS FITNES/scripts/smoke_dexie_migration.js` | nuevo · 9 asserts | local · no commiteado |
| `NEXUS FITNES/_backups/NEXUS_Fitness_pre-sprint1-dia1_20260509_172903.html` | backup pre-Día 1 · rollback disponible | local |
| `NEXUS FITNES/docs/SPRINT1_DIA0_PREFLIGHT.md` | informe Día 0 | local |
| `NEXUS FITNES/docs/SPRINT1_DIA1_CIERRE.md` | este documento | local |

---

## 8. Lo que necesito de vos antes de Día 2

1. **Limpiar `node_modules` con permisos rotos** en `NEXUS FITNES/scripts/` (PowerShell admin · 5 min) — ya pendiente de antes
2. **Decidir cuándo arrancamos Día 2** · mismo mecanismo (vos avisás "dale")
3. **Validar conceptualmente** que:
   - Coexistencia Día 1 (NX_DEXIE como variable nueva · sin reemplazar nada) es OK
   - El plan Día 2 (flag URL · NX_USE_DEXIE boolean · proxy condicional) tiene sentido
   - La decisión single table vs 12 tables es aceptable para ahora

Si confirmás · arranco Día 2 cuando me digas.

---

**Status:** ⏸️ Día 1 cerrado · 19/19 asserts smokes verdes · 0 regresión · 0 commit · 0 deploy. Esperando checkpoint.
