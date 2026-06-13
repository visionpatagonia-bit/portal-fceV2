# NEXUS Study Cockpit — Auditoría Final + Paquete de Sucesión del Arquitecto
**2026-06-12 · Estado @ commit `3f59e610` (PROD) · Verificado contra https://nexus-study-cockpit.onrender.com**

> Documento de cierre de ciclo. Doble lectura: para el fundador (qué es, qué falta) y para un auditor/arquitecto externo (cómo verificarlo, cómo se trabaja acá). La verdad se verifica con curl; cuando el plano difiera del territorio, gana el territorio.

---

## 1. Resumen ejecutivo (10 líneas)

NEXUS Study Cockpit es un simulador de parciales que **produce, protege y certifica razonamiento demostrado**. Núcleo: un motor determinista (`scoring.js`) es la **única autoridad de nota** (Ring 0); toda IA (Gemini) es advisory, marcada y enjaulada (Ring 3). El loop está cerrado: pensar → evaluar → **devolución de sesión** → aprender (**Modo Misión**) → micro-retest del error → vuelta sin pérdida; ninguna pantalla es terminal. El expediente cognitivo del alumno vive durable en Firestore: dominio por bloque (BKT), índice de despliegue léxico (conocimiento vs hábito, cross-identidad), historial de calibración (JOL), SRS. El Director de Vuelo reparte minutos por déficit×peso. El HUD (Constitución de Diseño) hace la doctrina píxel: color = señal, una acción brillante por pantalla, lo advisory se ve advisory. Las features estadísticas se activan por **datos acumulados, no por fecha** (F3/F4). El pipeline de entrega es a prueba de olvidos: `deploy.sh` exige que PROD sirva el commit pusheado antes de declarar VERDE. 4 materias evaluables; Administración calibrada contra 9 parciales reales.

---

## 2. Estado por vía (roadmap A–E)

| Vía | Ítem | Estado | Commit | Evidencia |
|---|---|---|---|---|
| A (loop) | #9 micro-retest del error | **LIVE** | e9daddb | onlyBlocks aísla 1 KC (PROD) |
| A | #6 self-explanation gate (ICAP) | LIVE | 95a36e5 | gate ≥40 chars antes de respuesta modelo |
| A | #2 JOL por bloque | LIVE | a244425 | calibración por bloque en devolución |
| A | A · índice de despliegue léxico | **LIVE** | 78ee918 | conocimiento vs hábito, cross-identity (PROD) |
| A | B · re-test de reformulación | LIVE | d7e0a72 | "desplegaste X/Y" determinista |
| A | C · coach de calibración | LIVE | eaa510f | patrón "te subestimaste 4/4" con gate ≥4 |
| B (Ola 0) | F2 auth · F5 persistencia · C sesiones · F7 revisión | **PENDIENTE** (gate de evento: antes de cobrar) | — | propuesta, sin construir |
| C (psicometría) | #1 matriz persona-ítem | LIVE | (cog) | /api/analytics/difficulty con p-value |
| C | #5/#11/#12/#13 + Rasch | **BLOQUEADO por datos** (n≥100) | — | dependencia técnica, no calendario |
| D (pilares) | Director de Vuelo V1 | LIVE | (flight-plan) | /api/flight-plan reparte minutos |
| D | identity-merge (puente) | **LIVE** | 1f049d9 | KCs agregados por identity_links (PROD) |
| D | HUD F1+F2 (Constitución) | **LIVE** | a2a5229 / 11eb5e6 | tokens semánticos + Modo Misión |
| D | #16 imágenes en consignas | LIVE (plumbing) | 762f270 | `image` field + render; assets pendientes |
| D | #14 bug library canónica | **LIVE** | 3f59e61 | misconceptionId determinista (PROD) |
| E (plataforma) | Torre de Control · 2º cuatrimestre | **FUTURO** (gate: alianza + Ola 0) | — | gemas `nexus-ckg/` + `pipeline/` preservadas |

---

## 3. Verificación reproducible (cualquiera la corre)

```bash
P=https://nexus-study-cockpit.onrender.com
curl -s $P/api/version                                   # -> {"commit":"3f59e610...","short":"3f59e610"}
curl -s $P/api/learner-model | grep persistence          # -> "persistence":"firestore"
curl -s "$P/api/analytics/difficulty?subjectId=administracion" | grep -o '"items"'  # -> "items"
curl -s "$P/api/subjects/administracion/contract" | grep -o ADM-ROL-01               # -> ADM-ROL-01 (bug library)
curl -s "$P/api/flight-plan?subjectId=administracion&examDate=2026-06-16&minutes=120" | grep -o '"totalMinutes"'  # plan <= budget
curl -s "$P/api/lexicon?subjectId=administracion&sessionId=anon" | grep -o persistence  # índice léxico
curl -s "$P/api/calibration-coach?subjectId=administracion&sessionId=anon" | grep -o minPairs  # coach (gate ≥4)
# Scoring determinista (regresión): core-unit Contabilidad debe dar 8.64
node scripts/core-unit.js | grep deterministicScore       # -> "deterministicScore": 8.64
node scripts/validate-subjects.js                         # -> todas las materias validas y calificables
```

---

## 4. Autoevaluación de gates (este ciclo)

| Gate | Qué | Checklist | Resultado |
|---|---|---|---|
| G0 | Pre-vuelo | version live + deploy.sh commit-específico + sync + 8.64 | ✅ VERDE |
| GA | índice léxico | criterio + cross-identity + F4 banda + 8.64 | ✅ VERDE (cross-identity probado en PROD) |
| GB | reformulación | scorecard determinista + reusa #9 | ✅ VERDE |
| GC | coach calibración | jol→server + gate ≥4 + F4 | ✅ VERDE (patrón verificado en PROD) |
| GD | HUD F1 | 7 tokens + 1 `--accion-director` + 0 hex + estado vacío | ✅ VERDE |
| GE | HUD F2 | Modo Misión oculta nav + salir restaura + debriefing color + advisory | ✅ VERDE |
| G2 | imágenes | campo + render + 0 sin image | ✅ VERDE (assets = contenido pendiente) |
| G3 | bug library | determinista + 0 falsos positivos | ✅ VERDE |

Cada gate: deploy.sh VERDE commit-específico + evidencia (archivo+línea o output PROD) + lo no-API listado como smoke del fundador.

---

## 5. Métricas vivas (PROD, 2026-06-12)

- **Persistencia:** learner-model + lexicon + jol + KB = `firestore` (durable, F1 resuelto).
- **Gemini:** configurado, 5 keys (env), `gemini-2.5-flash-lite`, `canScoreFinal:false` (Ring 3, no puntúa).
- **Matriz persona-ítem (Administración):** 30 ítems con n≥1. Top: development n=21 (p=0.79), true_false n=16 (p=0.38), case n=15 (p=0.67), matching n=15 (p=0.53), short_answer n=14 (p=0.39).
- **Gate F3:** todos los n (14–21) están **por debajo de 30** → los flags psicométricos son descriptivos, no decisiones automáticas. El sistema NO finge precisión que sus datos no sostienen.
- **Materias:** 4 (sociales, contabilidad_2p, administracion, propedeutica).

---

## 6. Deudas y condiciones de activación

| Deuda | Espera | Estado actual |
|---|---|---|
| Vía C (gatekeeping IA, Rasch, theta/SEM, mini-CAT) | **DATOS** (n≥100/ítem) | hoy n≈14–21; se activa solo |
| Calibración de parámetros BKT (P(L) deja de ser ordinal) | primera cohorte real | P(L) ordinal con caveat (F4) |
| Ola 0 (F2 auth, F5 durable, F7 revisión académica, C sesiones server) | **EVENTO** (antes de cobrar) | propuesta; ratificado por el fundador como gate |
| Imágenes reales de G2 | **CONTENIDO** (extraer de PDF / fundador) | plumbing listo en `public/img/` |
| C agrupado en Ola 0 | **FIRMA** del fundador | propuesta sin ratificar |
| M1 (NEXUS FITNES → repo propio) | `gh` auth / URL del repo | diferido |
| Caja Negra (estimación vs nota real) | notas reales | primer dato: recu del fundador 2026-06-16 |

---

## 7. Riesgos abiertos (dichos primero por nosotros)

1. **Render free duerme (~15 min)** → primer request 30–50s; el smoke de deploy.sh reintenta hasta ~8 min. No es bug; documentar al usuario.
2. **Contenido `generated_unreviewed`** (Sociales/Propedéutica): los contratos son corpus-grounded pero sin revisión académica humana (F7). No cobrar sobre ese contenido hasta F7.
3. **Auth OFF**: el cockpit es anónimo por sessionId. Sin uid no hay portabilidad real entre dispositivos salvo identity_links manual. F2 lo cierra.
4. **bug library / lexicon = seed chico**: ADM-ROL-01/ADM-EF-01 son defendibles pero pocos; el valor crece con el corpus de correcciones reales. No sobrevender la cobertura.
5. **Merge de `chore/repo-cleanup` pendiente**: la limpieza del repo (28 archivos) vive en una branch sin mergear; main aún contiene lo viejo hasta la firma del fundador.
6. **El secreto (Doctrina Ética) es interno**: nunca debe entrar al repo; hay guarda en `.gitignore`.

---

## 8. Inventario de entorno (NOMBRES, jamás valores)

- **Env vars (Render):** `RENDER_GIT_COMMIT` (auto), `GEMINI_API_KEY`, `GEMINI_MODEL`, `FIREBASE_SERVICE_ACCOUNT`, `PORT`, `HOST`. Hook de deploy: `RENDER_DEPLOY_HOOK` (env) o archivo `scripts/.deploy-hook` (gitignored).
- **Servicios externos:** Render (cockpit, Docker, Free, srv-d8juo8c8aovs73dgbnl0); Vercel (portal viejo en main, + legacy contabilidad); Firebase/Firestore (proyecto portal-fce); Google AI Studio (5 keys Gemini).
- **Repos/branches:** `visionpatagonia-bit/portal-fceV2` · cockpit en **`feat/study-cockpit`** (→ Render vía deploy.sh) · portal en `main` (→ Vercel) · `chore/repo-cleanup` (higiene, pendiente de merge firmado).
- **Working tree del cockpit:** `C:\NEXUS\cockpit-repo` (clone fresco; un agente = un working tree). Fuente de edición: `…/NEXUS_STUDY_COCKPIT_APP/SOVERINGBACKEND` → `cp` a `study-cockpit/` → commit → `deploy.sh`.
- **Secretos (NUNCA al repo):** Doctrina Ética (interna), keys de Gemini, FIREBASE_SERVICE_ACCOUNT, deploy hook.

---

## 9. Paquete de sucesión (para el arquitecto nuevo)

**Leé en orden:** Doctrina Ética (interna, fuera del repo) → `docs/ROADMAP-NUEVA-GENERACION.md` (7 reglas, 5 vías) → `docs/CONSTITUCION-DISENO-HUD-v1.md` → `docs/NEXUS-OS-ARQUITECTURA-v1.md` → `docs/audit-impl/ADR-001` (sesión/loop) → este documento → último reporte de lote.

**Cómo se trabaja acá:**
1. El fundador firma **QUÉ y CUÁNDO**. El agente propone, evidencia, ejecuta. Ningún timing del agente viaja en bloques de instrucciones.
2. **"Deployado" = `deploy.sh` VERDE commit-específico.** "Hecho" = checklist universal autoevaluado + evidencia. "Verdad" = producción, no reporte.
3. **Regla de evidencia:** todo claim "X está en Y" requiere archivo+línea o output de PROD; sin evidencia se redacta como "creo que X, a verificar".
4. **El juez no se toca** (motor determinista, Regla 1). La inspiración es Ring 3.
5. **El loop nunca se rompe**: ninguna pantalla terminal.
6. Lotes por ciclo; repaso del fundador al cierre. Handoffs limpios; el entorno viaja con el código.

**Decisiones abiertas (esperan firma del fundador):** 2ª vertical (PPI/CNV vs industrial), C en Ola 0, canje voucher Trucco (post-recu), retorno a Propedéutica, separación del cockpit a repo propio.

*Este documento es el plano. El territorio se verifica con curl. Cuando difieran, gana el territorio.*
