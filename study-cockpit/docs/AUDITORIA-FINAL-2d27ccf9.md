# NEXUS Study Cockpit — Auditoría Final + Paquete de Sucesión del Arquitecto (refresh)
**2026-06-14 · Estado @ commit `2d27ccf9` (PROD) · Verificado contra https://nexus-study-cockpit.onrender.com**

> Refresca y **supersede** `AUDITORIA-FINAL-3f59e610.md` (snapshot histórico al 2026-06-12). Incorpora los ciclos posteriores: materia **CMV/Inventario** (Grupo 1), **fidelidad al parcial real** (Grupo 2) + **conceptos sueltos** (Grupo 3), y el **Examen Integrador genérico** (multi-tema). Doble lectura: fundador (qué es, qué falta) y auditor externo (cómo verificarlo, cómo se trabaja acá). La verdad se verifica con curl; cuando el plano difiera del territorio, gana el territorio.

---

## 1. Resumen ejecutivo (10 líneas)

NEXUS Study Cockpit **produce, protege y certifica razonamiento demostrado**. Núcleo: un motor determinista (`scoring.js`) es la **única autoridad de nota** (Ring 0); toda IA (Gemini) es advisory, marcada y enjaulada (Ring 3). El loop está cerrado: pensar → evaluar → **devolución de sesión** → aprender (**Modo Misión**) → micro-retest del error → vuelta sin pérdida; ninguna pantalla es terminal. El expediente cognitivo vive durable en Firestore: dominio por bloque (BKT), índice de despliegue léxico (conocimiento vs hábito, cross-identidad), historial de calibración (JOL), SRS. El Director de Vuelo reparte minutos por déficit×peso. El HUD (Constitución de Diseño) hace la doctrina píxel. Las features estadísticas se activan por **datos acumulados, no por fecha** (regla 4). El pipeline de entrega exige que PROD sirva el commit pusheado antes de declarar VERDE. **5 materias evaluables**: Administración (calibrada contra 9 parciales reales), Contabilidad 2P (sueldos), **Contabilidad – Inventario y CMV** (drill del tema que costó la promoción del fundador), Sociales y Propedéutica. Sobre el parcial real del fundador se construyó la **fidelidad al formato Moodle** (opción múltiple con penalización por error, selección de cuenta en el asiento, formato numérico estricto) y el **Examen Integrador**: cualquier materia ensambla un examen comprensivo multi-tema (Contabilidad une sueldos+CMV), corregido por el motor determinista en una pasada y normalizado a /10, **sin tocar el juez**.

---

## 2. Estado por vía (roadmap A–E)

| Vía | Ítem | Estado | Commit | Evidencia |
|---|---|---|---|---|
| A (loop) | #9 micro-retest del error | **LIVE** | e9daddb | onlyBlocks aísla 1 KC (PROD) |
| A | #6 self-explanation gate (ICAP) | LIVE | 95a36e5 | gate ≥40 chars antes de la respuesta modelo |
| A | #2 JOL por bloque | LIVE | a244425 | calibración por bloque en devolución |
| A | A · índice de despliegue léxico | LIVE | 78ee918 | conocimiento vs hábito, cross-identity (PROD) |
| A | B · re-test de reformulación | LIVE | d7e0a72 | "desplegaste X/Y" determinista |
| A | C · coach de calibración | LIVE | eaa510f | patrón "te subestimaste 4/4", gate ≥4 |
| A/contenido | **CMV/Inventario (Grupo 1)** — materia nueva `contabilidad_2p_inventario` | **LIVE** | **30fc24a** | 5→6 formas (cloze/cálculo/2 asientos/variaciones/MCQ); claves auditadas adversarialmente |
| A/contenido | **Grupo 2 · fidelidad al parcial real** — negative marking, choice/multi render, selección de cuenta en debe_haber, formato numérico estricto | **LIVE** | **9ae7dc1** | 3 graders OPT-IN backward-compatible; 8.64 intacto |
| A/contenido | **Grupo 3 · activación de costos + bonificaciones por volumen** | **LIVE** | **9ae7dc1** | bloque MCQ + study-map; auditado adversarialmente |
| B (Ola 0) | F2 auth · F5 persistencia · C sesiones · F7 revisión | **PENDIENTE** (gate de EVENTO: antes de cobrar) | — | propuesta, sin construir |
| C (psicometría) | #1 matriz persona-ítem | LIVE | (cog) | /api/analytics/difficulty con p-value |
| C | #5/#11/#12/#13/#15 + Rasch + calibración BKT | **BLOQUEADO por DATOS** (n≥100) | — | dependencia técnica, no calendario |
| D (pilares) | Director de Vuelo V1 | LIVE | (flight-plan) | /api/flight-plan reparte minutos |
| D | identity-merge (puente) | LIVE | 1f049d9 | KCs agregados por identity_links (PROD) |
| D | HUD F1+F2 (Constitución) | LIVE | a2a5229 / 11eb5e6 | tokens semánticos + Modo Misión |
| D | #16 imágenes en consignas | LIVE (plumbing + assets parciales) | 762f270 / e707ad1 | `image` field + render; Sociales/Propedéutica con asset real |
| D | #14 bug library canónica | LIVE | 3f59e61 | misconceptionId determinista (PROD) |
| D | **Examen Integrador genérico** (la sesión/examen comprensivo como unidad — adelanto parcial de Director V2 + fidelidad al formato real) | **LIVE** | **2d27ccf9** | `/api/integrador` ensambla multi-tema, /10, juez intacto (PROD) |
| D | Director de Vuelo V2 (sesión multi-noche) · Perfil de capital lingüístico | **PENDIENTE** | — | esperan C (sesiones server) / #6-textos + F5 |
| D | Fidelidad al corpus (heurística V1) | **CONSTRUIBLE YA** (no bloqueada; corpus de 9 parciales alcanza) | — | propuesta, sin construir |
| E (plataforma) | Torre de Control · 2º cuatrimestre | **FUTURO** (gate: alianza + Ola 0) | — | gemas `nexus-ckg/` + `pipeline/` preservadas |

---

## 3. Verificación reproducible (cualquiera la corre)

```bash
P=https://nexus-study-cockpit.onrender.com
curl -s $P/api/version                                   # -> {"commit":"2d27ccf9...","short":"2d27ccf9"}
curl -s $P/api/learner-model | grep persistence          # -> "persistence":"firestore"
curl -s "$P/api/analytics/difficulty?subjectId=administracion" | grep -o '"items"'   # -> "items"
curl -s "$P/api/subjects/administracion/contract" | grep -o ADM-ROL-01                # -> ADM-ROL-01 (bug library)
curl -s "$P/api/flight-plan?subjectId=administracion&examDate=2026-06-16&minutes=120" | grep -o '"totalMinutes"'
curl -s "$P/api/lexicon?subjectId=administracion&sessionId=anon" | grep -o persistence
curl -s "$P/api/calibration-coach?subjectId=administracion&sessionId=anon" | grep -o minPairs
# 5 materias (la 5ta = el drill de CMV):
curl -s $P/api/subjects | grep -o contabilidad_2p_inventario
# Grupo 2/3 en el contrato del drill: mecánicas opt-in + bloque MCQ (JSON pretty-printed = tolerar espacios):
curl -s "$P/api/subjects/contabilidad_2p_inventario/contract" | grep -oE '"(negativeMarking|accountSelect|strictNumeric)"[[:space:]]*:[[:space:]]*true'
# Examen integrador (genérico): contrato fusionado /10 con variante 'INT':
curl -s "$P/api/integrador?subjectId=contabilidad_2p" | grep -oE '"id"[[:space:]]*:[[:space:]]*"INT"'
# Scoring determinista (regresión): core-unit Contabilidad sigue 8.64
node scripts/core-unit.js | grep deterministicScore       # -> "deterministicScore": 8.64
node scripts/validate-subjects.js                         # -> 5 materias válidas y calificables
```

Última corrida (2026-06-14): los 9 checks anteriores **PASAN** contra PROD `2d27ccf9`; core-unit 8.64; validate 5/5.

---

## 4. Autoevaluación de gates (ciclos posteriores a 3f59e610)

| Gate | Qué | Checklist | Resultado |
|---|---|---|---|
| G6 | CMV/Inventario (Grupo 1) | materia nueva subject-agnostic + claves auditadas adversarialmente + 8.64 + validate | ✅ VERDE (commit 30fc24a) |
| G7 | Grupo 2 fidelidad + Grupo 3 conceptos | 3 graders opt-in backward-compatible + contenido auditado + 8.64 + revisión adversarial 3 lentes 0 hallazgos | ✅ VERDE (commit 9ae7dc1) |
| G8 | Examen Integrador genérico | ensamblador clona (no muta cache) + namespacing consistente + suma EXACTA 10 + learner-model por source + revisión adversarial 4 lentes (2 bugs hallados y corregidos) + sin regresión al examen normal + 8.64 | ✅ VERDE (commit 2d27ccf9) |

Cada gate: `deploy.sh` VERDE commit-específico + evidencia (archivo+línea u output PROD) + lo no-API listado como smoke del fundador.

---

## 5. Métricas vivas (PROD, 2026-06-14)

- **Persistencia:** learner-model + lexicon + jol + KB = `firestore` (durable, F1 resuelto).
- **Gemini:** configurado, `gemini-2.5-flash-lite`, `canScoreFinal:false` (Ring 3, no puntúa).
- **Matriz persona-ítem (Administración):** ítems con n bajo (n<30) → flags **descriptivos**, no decisiones automáticas (gate F3/regla 4). El sistema NO finge precisión que sus datos no sostienen.
- **Materias:** **5** (administracion, contabilidad_2p, **contabilidad_2p_inventario**, propedeutica, sociales).
- **Motor:** 3 graders nuevos opt-in (negative marking, selección de cuenta, formato estricto) + `multi` render genérico — todo default OFF salvo donde el contrato lo pide; core-unit 8.64 intacto.
- **Examen Integrador:** GET `/api/integrador` + POST `/api/integrador/score` vivos; Contabilidad fusiona 2 temas (6 bloques /10), cualquier otra materia integra su propio contenido.

---

## 6. Deudas y condiciones de activación

| Deuda | Gate | Estado actual |
|---|---|---|
| Vía C (gatekeeping IA, Rasch, theta/SEM, mini-CAT, calibración BKT) | **DATOS** (n≥100/ítem) | n<30 hoy; se activa solo (regla 4) |
| Ola 0 (F2 auth, F5 durable, F7 revisión académica, C sesiones server) | **EVENTO** (antes de cobrar) | propuesta; ratificada como gate; auth OFF (anónimo por sessionId) |
| F7 revisión académica Sociales/Propedéutica | **CONTENIDO** (revisión humana) | `generated_unreviewed`; no cobrar sobre ese contenido |
| Propedéutica: alineación completa al parcial real | **CONTENIDO** | solo el bloque de técnicas de estudio está alineado; el resto sigue sobre el Estatuto |
| Imágenes reales de G2 restantes | **CONTENIDO** (PDF/fundador) | plumbing listo; Sociales/Propedéutica con asset; faltan otras |
| Merge `chore/repo-cleanup` → main · M1 (`nexus-fitness`) · 5 decisiones abiertas | **FIRMA del fundador** | esperan firma explícita (regla 7) |
| Director V2 · Perfil de capital lingüístico | **DEPENDENCIA** (C/F5/#6) | esperan Ola 0 / acumulación de texto |
| Fidelidad al corpus (heurística V1) | **FIRMA** (no bloqueada técnicamente) | construible ya con los 9 parciales |
| Integrador multi-intento (sesión de N temas en una devolución con acordeón) | **DISEÑO** (futuro) | hoy es sesión de 1 intento; el CTA `sessionHeader` se rutea con `repasarAttrs` cuando se habilite |
| bug library en bloques `multi` | **MECÁNICA** | las bug-cards disparan en cloze (texto de opción), no en MCQ (respuesta = índice); el MCQ usa misses deterministas + negative marking |
| Copia de la auditoría en `NEXUS_AUDITORIA/` | **HIGIENE** | esta versión (2d27ccf9) vive en `study-cockpit/docs/`; la copia externa puede quedar una versión atrás |

---

## 7. Riesgos abiertos (dichos primero por nosotros)

1. **Render free duerme (~15 min)** → primer request 30–50s; el smoke de deploy.sh reintenta hasta ~8 min. No es bug; documentar al usuario.
2. **Contenido `generated_unreviewed`** (Sociales/Propedéutica): corpus-grounded pero sin revisión académica humana (F7). No cobrar sobre ese contenido.
3. **Auth OFF**: el cockpit es anónimo por sessionId. Sin uid no hay portabilidad real salvo identity_links manual. F2 lo cierra.
4. **bug library / lexicon = seed chico**: defendibles pero pocos; el valor crece con el corpus de correcciones reales. No sobrevender la cobertura.
5. **Merge de `chore/repo-cleanup` pendiente**: la limpieza vive en branch sin mergear; main aún contiene lo viejo hasta la firma del fundador.
6. **El secreto (Doctrina Ética) es interno**: nunca debe entrar al repo; hay guarda en `.gitignore`.
7. **Examen Integrador — degradación F5**: el contrato fusionado vive en el store; si se recarga la devolución se RE-FETCHEA (ensamblado determinista, idéntico). Verificación visual del flujo completo (rendir integrador → /10 → "repasar" abre el tema correcto en su materia) = **smoke del fundador**, pendiente de uso real.

---

## 8. Inventario de entorno (NOMBRES, jamás valores)

- **Env vars (Render):** `RENDER_GIT_COMMIT` (auto), `GEMINI_API_KEY`, `GEMINI_MODEL`, `FIREBASE_SERVICE_ACCOUNT`, `PORT`, `HOST`. Hook de deploy: `RENDER_DEPLOY_HOOK` (env) o archivo `scripts/.deploy-hook` (gitignored).
- **Servicios externos:** Render (cockpit, Docker, Free); Vercel (portal viejo + legacy contabilidad); Firebase/Firestore (proyecto portal-fce); Google AI Studio (keys Gemini).
- **Repos/branches:** cockpit en **`feat/study-cockpit`** (→ Render vía deploy.sh) · portal en `main` · `chore/repo-cleanup` (higiene, pendiente de merge firmado).
- **Working tree del cockpit:** `C:\NEXUS\cockpit-repo` (clone fresco; un agente = un working tree). Fuente de edición: `…/NEXUS_STUDY_COCKPIT_APP/SOVERINGBACKEND` → `cp` a `study-cockpit/` → commit → `deploy.sh`.
- **Piezas nuevas de este refresh:** `src/services/integrador-service.js` (ensamblador); endpoints `GET /api/integrador` + `POST /api/integrador/score`; materia `data/subjects/contabilidad_2p_inventario/`; mecánicas opt-in en `src/scoring.js` (`gradeMulti` negative marking, `gradeDebeHaberSelect`); render `multi` + selección de cuenta en `public/src/views/render-blocks.js`.
- **Secretos (NUNCA al repo):** Doctrina Ética (interna), keys de Gemini, FIREBASE_SERVICE_ACCOUNT, deploy hook.

---

## 9. Paquete de sucesión (para el arquitecto nuevo)

**Leé en orden:** Doctrina Ética (interna, fuera del repo) → `docs/ROADMAP-NUEVA-GENERACION.md` (7 reglas, 5 vías) → `docs/CONSTITUCION-DISENO-HUD-v1.md` → `docs/NEXUS-OS-ARQUITECTURA-v1.md` → `docs/audit-impl/ADR-001` (sesión/loop) → **este documento** (`AUDITORIA-FINAL-2d27ccf9.md`) → último reporte de lote.

**Cómo se trabaja acá:**
1. El fundador firma **QUÉ y CUÁNDO**. El agente propone, evidencia, ejecuta. Ningún timing del agente viaja en bloques de instrucciones.
2. **"Deployado" = `deploy.sh` VERDE commit-específico.** "Hecho" = checklist universal autoevaluado + evidencia. "Verdad" = producción, no reporte.
3. **Regla de evidencia:** todo claim "X está en Y" requiere archivo+línea o output de PROD.
4. **El juez no se toca** (motor determinista). La inspiración es Ring 3. El Examen Integrador y los graders nuevos son **opt-in y backward-compatible**: 8.64 y las materias existentes intactas.
5. **El loop nunca se rompe**: ninguna pantalla terminal; en el integrador el repaso rutea a la materia SOURCE.
6. Lotes por ciclo; repaso del fundador al cierre. Handoffs limpios; el entorno viaja con el código.

**Progresión de commits (post-3f59e610):** `30fc24a` (CMV/Inventario · Grupo 1) → `9ae7dc1` (Grupo 2 fidelidad + Grupo 3 conceptos) → `2d27ccf9` (Examen Integrador genérico).

**Decisiones abiertas (esperan firma del fundador):** merge `chore/repo-cleanup`→main, M1 (`nexus-fitness`), 2ª vertical (PPI/CNV vs industrial), C en Ola 0, canje voucher Trucco, retorno a Propedéutica, separación del cockpit a repo propio, y cuál vía sigue cuando firme "siguiente".

*Este documento es el plano. El territorio se verifica con curl. Cuando difieran, gana el territorio.*
