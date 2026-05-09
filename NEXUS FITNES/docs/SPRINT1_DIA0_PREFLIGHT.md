# Sprint 1 · Día 0 preflight · informe corto

**Fecha:** 2026-05-09 · sábado 17:30 AR
**Owner:** Programador (Claude · sesión Cowork con Lead)
**Status:** ✅ preflight cerrado · ⏸️ esperando checkpoint con lead antes de Día 1

---

## 1. Baseline confirmado

### HTML target
```
md5:    4d02ceb37f1495f0b8e41205b64d5432
líneas: 7768
deploy_qa sincronizado: ✓
último commit: 42180cf (v3.3 PDF)
```

### Smokes baseline
- **Smoke headless general:** ✅ 46 OK · 1 WARN · 0 FAIL · total 47 (corre desde repo · sin deps externas)
- **Smoke Luz · v3.2 · 6 días · PDF:** ⚠️ requieren `/tmp/nexus_smoke/node_modules` que se borró entre sesiones · ver hallazgo H1 abajo

---

## 2. Archivos exactos que toca Sprint 1 Día 1

Todo en `NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html`:

| Línea | Función / declaración | Acción Día 1 |
|---|---|---|
| L2327 | `const STORAGE_KEY = "nx_fitness_v1"` | mantener · usar como key compatibilidad |
| L2364 | `function loadState()` | reescribir para Dexie cuando flag=1 · LS fallback si Dexie falla init |
| L2398 | `function saveState()` | idem |
| L2464 | `window.nxBackupStore.snapshot()` en exportJSON | mantener API · wrap Dexie debajo |
| L6559 | `function nxSaveClient(client)` | dual-write Dexie cuando flag=1 |
| L6591 | `function nxSaveRoutine(routine)` | idem |
| L7028 | `const nxBackupStore = (function(){...})()` | reemplazar interno por wrapper Dexie · API pública intacta |

---

## 3. Hallazgo H1 del preflight · NO bloqueante

**Síntoma:** los 4 smokes específicos que armé ayer (smoke_luz · smoke_v32_v2 · smoke_6dias_fix · smoke_pdf) vivían en `/tmp/nexus_smoke/` que se borró entre sesiones. `NEXUS FITNES/scripts/` tiene symlinks rotos a esos paths.

**Impacto:**
- No bloquea Día 0 (smoke_headless general validó baseline)
- Sí confirma una lección: **los smokes deben vivir en repo, no en sandbox**
- Los symlinks rotos en `NEXUS FITNES/scripts/node_modules` no se pueden borrar desde esta sesión (problema de permisos del mount Windows · igual que el EACCES previo)

**Acción que se integra al Día 1:**
- Recrear los 4 smokes como archivos persistentes en `NEXUS FITNES/scripts/` (no symlinks)
- Documentar deps necesarias en un `package.json` REAL (no symlink)
- Resolver permisos `node_modules` del mount Windows · pendiente Juan-side: `Remove-Item -Recurse -Force node_modules` desde PowerShell admin (ya documentado en backlog)

---

## 4. Memoria persistente relevante para Sprint 1

| Memoria | Por qué importa |
|---|---|
| `project_anubis_v3_post_feedback_luz.md` | estado v3.0→v3.3 · contras + anti-similar guard que NO debo romper |
| `feedback_audit_proactivo.md` | parity-check binario master vs deployado pre-deploy |
| `feedback_operacion_8may_patterns.md` | 4 patterns que rindieron (incluido cierre incremental memoria+tasks+commits) |
| `project_fitness_mvp_snapshot.md` | cuello raíz declarado: persistencia |
| `project_anubis_feedback_demo_mes3.md` | PWA Alumna prioritaria post-Anubis (preserved en Sprint #160) |
| `feedback_ip_protection.md` | descartar copyleft fuerte (Dexie Apache 2.0 · OK) |

Todas leídas mentalmente. Doctrinas activas en este Sprint:
- Dual-write Dexie + LS · LS como fallback elegante
- Schema CRDT-ready desde día 1 (timestamps + tombstones + immutable IDs)
- Promover IDB a primario · libera cuota LS
- Reemplazo `nxBackupStore` custom por Dexie wrapper · API pública intacta

---

## 5. Decisión operativa propuesta al lead

**Es sábado 17:30 AR.** Día 1 es 4h de trabajo concentrado. Mis opciones:

### Opción A · Arrancar Día 1 hoy (sábado tarde-noche)

Empezaría a las ~18hs · cerraría Día 1 a las ~22hs sábado. Sin commit · sin deploy. Día 2 iría domingo.

**Riesgos:**
- 4h concentradas un sábado tarde sin descanso · calidad de código puede bajar
- Si algo falla en el medio · debug de noche · poca margen de recuperación
- Lead probablemente no estaba esperando que arranque hoy

### Opción B · Día 1 mañana domingo (recomendada)

Arrancar Día 1 domingo en horario habitual (mañana o tarde temprana). Día 2 lunes 12. Día 3-4 validación 48h martes-miércoles. Día 5 cierre jueves 14 (alineado con timeline original del CTO que decía "Sprint 1 arranca jueves 14").

### Opción C · Respetar timeline original · Día 1 jueves 14

Más conservador. Ningún riesgo. Pero pierde 4-5 días de buffer.

**Mi voto:** **Opción B**. Arranca mañana domingo · respeta horario de programador · cierra Sprint 1 viernes 17 según el ajuste arbitrado por el CTO (cerrar con solo Dexie · sin free-exercise-db).

---

## 6. Resumen para el lead

✅ Día 0 preflight completo
✅ Baseline confirmado (HTML md5 4d02ceb3 · smoke headless 46 OK)
✅ Archivos a tocar identificados (L2327 · L2364 · L2398 · L2464 · L6559 · L6591 · L7028)
✅ Memoria persistente relevante leída
⚠️ 1 hallazgo no bloqueante: smokes específicos no persisten · se integra al Día 1
⏸️ Pausa antes de Día 1 · esperando checkpoint con lead

**Avisame cuando arranco:**
- "dale ahora" → Opción A · arranco Día 1 hoy
- "mañana" → Opción B · arranco domingo
- "esperá jueves" → Opción C · respeta timeline original

Cualquiera está OK. Mi voto Opción B.
