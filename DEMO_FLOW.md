# NEXUS Portal FCE — DEMO FLOW (lunes 20 abril 2026)

> **Audiencia:** UNPSJB FCE · Ciclo Inicial 2026
> **URL:** portal-fce-v2.vercel.app
> **Versión en prod:** commit `8f86d00` · sw.js `fce-portal-v19.30.3` · KB 138 entries
> **Preparado:** sábado 18 abril 2026 — verificado contra KB actual
> **Objetivo:** demostrar flujo híbrido KB + LLM con latencias reales, cubriendo las 3 materias.

---

## 🎯 Checklist pre-demo (domingo 19, 30 min antes)

Antes de abrir el navegador frente a la audiencia:

1. Hard-reload en `portal-fce-v2.vercel.app` (Ctrl+Shift+R) para garantizar SW fresco.
2. Abrir DevTools → Network → deshabilitar "Throttling" y habilitar "Disable cache" mientras verificás.
3. Correr las 10 queries abajo en orden, anotando:
   - ¿Match KB o LLM?
   - Confidence (el matcher lo muestra en consola)
   - Latencia percibida
4. Si alguna query de la lista "verdes" cae a LLM, me avisás y hacemos un patch quirúrgico el domingo a la noche.
5. Cerrar DevTools, limpiar historial, abrir en ventana normal para el demo.

**Durante el demo:** usar solo las 10 queries de la sección "VERDES". No improvisar en Sociales ni en los entries Admin marcados como "🔴 EVITAR".

---

## ✅ VERDES — 10 queries seguras para el demo

### Bloque 1 · Contabilidad (4 queries)

Arrancar por acá: es el bloque con más entries manualmente patcheadas, latencia < 100ms garantizada.

| # | Query | Match esperado | Confidence | Notas para narrar |
|---|---|---|---|---|
| 1 | `¿Cuál es la ecuación contable básica?` | `ecuacion_contable` | 1.00 | Fowler Newton. Entry con 9 patterns. Patcheada a mano en v19.30.4. |
| 2 | `Diferencia entre activo y pasivo` | `activo_vs_pasivo` | 1.00 | Comparativo. 7 patterns. También v19.30.4. |
| 3 | `Qué es el patrimonio neto` | `patrimonio_neto` | ≥0.95 | Entry Mistral, answer verificado — menciona capital + resultados acumulados. Ref: `Itinerario II Parte 1 p5`. |
| 4 | `Qué es la partida doble` | `partida_doble` | ≥0.95 | Entry Mistral, answer verificado. Ref: `Itinerario III p2`. |

**Guión sugerido:** "El portal tiene un KB local con conceptos clave del programa. Para preguntas directas como éstas, responde en menos de 100ms sin tocar el LLM."

---

### Bloque 2 · Sociales / Bourdieu (3 queries)

Estas son las 3 que fallaban el jueves pasado. Se fixearon el viernes 18 con 2 entries manuales + patch de patterns. Ya verificadas en prod.

| # | Query | Match esperado | Confidence | Notas |
|---|---|---|---|---|
| 5 | `¿Qué dice Bourdieu sobre el Estado?` | `bourdieu_estado_concepto` | ≥0.95 | Monopolio de violencia física + simbólica legítima. Rectifica a Weber. Refs: `Clase 18-1-1990 p3+p6`. |
| 6 | `¿Qué es la tradición marxista del Estado?` | `bourdieu_tradicion_marxista` | ≥0.95 | Crítica a marxismo clásico, rescate del neomarxismo de Hirsch. Refs: `p4+p7+p14`. |
| 7 | `¿Cómo define Bourdieu las categorías estatales?` | `clasificaciones_sociales` | ≥0.90 | Estado como productor de categorías (ejemplo INSEE). Entry original Mistral con patterns Bourdieu patcheados el 18/4. |

**Guión sugerido:** "Sociales es material narrativo — Bourdieu son 15 páginas densas. El KB extrae los conceptos clave con citas textuales del PDF. Si la query sale del scope del KB, cae al LLM."

---

### Bloque 3 · Administración (2 queries)

Las entries Admin son Mistral-generadas pero estos 2 están verificados on-topic (sin fugas a Contabilidad).

| # | Query | Match esperado | Confidence | Notas |
|---|---|---|---|---|
| 8 | `Qué es responsabilidad social` | `responsabilidad_social` | ≥0.95 | Chiavenato U2.6. Entry clean, answer de 1011 chars. |
| 9 | `Qué es competitividad` | `competitividad_concepto` | ≥0.90 | Chiavenato. Entry clean, relaciona competitividad con ética organizacional. |

---

### Bloque 4 · LLM fallback (1 query)

Esta query **intencionalmente** no matchea en KB y cae al LLM. Sirve para mostrar la capa híbrida y el Plan B UX (loading state, status-aware).

| # | Query | Match esperado | Latencia | Notas |
|---|---|---|---|---|
| 10 | `Explicame brevemente cómo se organizan las materias del ciclo inicial` | LLM (Llama 3.2 via proxy) | ~3-5s | El proxy streamea tokens, mostrando la respuesta progresivamente. Si el túnel está caído, Plan B UX muestra banner offline + retry. |

**Guión sugerido:** "Cuando el KB no tiene cobertura, delegamos al LLM. El proxy local maneja autenticación, rate limit y streaming. El frontend ve los tokens en tiempo real."

---

## 🔴 EVITAR — queries que pueden disparar alucinaciones

Estas entries tienen contenido cross-domain (mezcla contable con Admin/Sociales) o template fijo sin anchor a autor. **No hacer ninguna de estas queries en vivo.**

### ~~Admin con fuga a Contabilidad~~ → FIXED (19/4)

Los 4 entries Admin con fuga a Contabilidad fueron **neutralizados en v19.30.5**: se removió la oración "En contabilidad se relaciona con..." del `answer_full`, preservando el contenido Admin puro. Ahora responden contenido Admin limpio.

- `qué es la calidad` → ✅ responde ventaja competitiva / Chiavenato
- `qué es la ética` → ✅ responde ética + RSE
- `qué es velocidad` → ✅ responde ventaja competitiva
- `qué es confiabilidad` → ✅ responde ventaja competitiva

Igual mantenerlos como **backup**, no como queries principales del demo (los Bloques 1-3 siguen siendo la primera opción).

### Sociales con contenido alucinado → 17+1 NEUTRALIZADOS (19/4)

En v19.30.5 se neutralizaron **18 entries Sociales** identificadas por el audit H1-H6:
- 17 ALTA severity (patterns vaciados, `demo_safe=false`, `_original_patterns` preservado para rollback)
- 1 typo-alucinación descubierta por el simulacro: `marcado_concepto` (Mistral generó "marcado" por typo de "mercado", causaba match fuzzy 0.94 con "qué es el mercado"). También neutralizada.

Estas queries ahora caen al LLM (verificadas en simulacro 19/4):
- `qué es el crédito`, `qué es el mercado`, `qué es una dirección/distancia/dominio/superficie`
- `qué es la historia`, `qué es un vínculo`, `qué son los agentes`

⚠ Siguen matcheando (contenido legítimo):
- `qué es el Estado` → `bourdieu_estado_concepto` (score 0.88) — contenido válido con citas Bourdieu. SAFE pero off-script del demo.

Recomendación: seguir sin improvisar queries de Sociales fuera del Bloque 2.

---

## 🛟 Plan de contingencia en vivo

| Situación | Qué hacer |
|---|---|
| Query verde falla (cae a LLM inesperadamente) | Seguir. Decir "acá vemos el fallback funcionando" — no insistir en la query, pasar a la siguiente. |
| Proxy caído / Cloudflare tunnel caído | El portal muestra Plan B banner. Mostrar que la UX queda estable (no se rompe). Seguir con queries del Bloque 1-3 (son KB puro, no necesitan proxy). |
| Query roja por accidente (alucinación visible) | No explicarla técnicamente. Decir "el LLM a veces se pone creativo, por eso tenemos validator y KB con citas". Pasar a otra query. |
| Servidor Vercel caído | Abrir `localhost:3000` como fallback si lo tenés corriendo, o usar ventana con la PWA ya cacheada (SW la sirve offline). |

---

## 🧭 Orden sugerido del demo (15-20 min)

1. **Intro 2 min** — qué es NEXUS, arquitectura híbrida.
2. **Query 1 (ecuación contable)** — mostrar latencia < 100ms, abrir DevTools si se quiere lucir.
3. **Query 2 (activo vs pasivo)** — mismo bloque, reforzar velocidad.
4. **Query 5 (Bourdieu Estado)** — cambio de materia, mostrar que KB es multi-dominio.
5. **Query 6 (tradición marxista)** — profundidad dentro del mismo material.
6. **Query 10 (LLM fallback)** — pivot: "¿y si el KB no tiene la respuesta?"
7. **Query 8 (responsabilidad social)** — cerrar con Admin para mostrar las 3 materias.
8. **Cierre 2 min** — roadmap: Fase 3 (cache layer) en preparación, 138 entries hoy → 400+ post-OCR Itinerario I.

Queries 3, 4, 7, 9 quedan como **backup** si alguien pide más ejemplos o si una de las anteriores falla.

---

## 📊 Estado de producción al momento del demo

- **Commit prod actual:** `8f86d00` (docs) sobre `decfef3` (phase-3 infra pasiva) sobre `5997325` (fix Bourdieu)
- **Commit pendiente (local, listo para push):** `kb: neutralize hallucination-prone entries (v19.30.5)` — 4 Admin clean + 18 Sociales neutralizadas
- **KB:** 138 entries · Contabilidad 40 · Sociales 84 · Admin 13 · Sociología 1
- **sw.js cache:** `fce-portal-v19.30.3` (network-first para kb/*.json)
- **Fase 3:** `ENABLE_QA_CACHE = false` — infra lista, se activa post-demo en 1 línea
- **Proxy:** acepta `req.body.model` con fallback a env (desbloquea `generate_kb.py` con Mistral)
- **qa_cache.json:** servido en HTTP 200, vacío, seed para activación post-demo

## ✅ Simulacro del 19/4 — resultados

- **10/10 verdes** pasan contra KB prod · scores 0.95-1.00 · latencias 6-46ms
- **9/14 EVITAR** caen al LLM (neutralización efectiva)
- **5/14 siguen matcheando** — todos con contenido limpio y verificado (4 Admin post-fix + bourdieu_estado legítimo)

### Segunda iteración (v19.30.6, post-H7)

Tras agregar la heurística H7 (typo-hallucination) al audit y re-correrlo:
- +5 entries neutralizadas (duplicado responsabilidad + typo burocractica + basura principios + off-topic calendario + tautología agentes)
- +2 entries whitelisted (bourdieu_estado_concepto, ingresos_concepto — false positives)

**Estado final KB:** 138 entries · 115 activas · 23 neutralizadas · 2 whitelisted. Audit pending-only: **0 ALTA, 0 MEDIA, 21 BAJA** (inocuas — H2/H3 code smell sin contenido tóxico).

## 🪟 Git push pendiente — desbloquear desde PowerShell

El sandbox no pudo hacer `git commit && git push` (lock file en `.git/index.lock` mantenido por proceso Windows). Juan corre esto desde PowerShell en `portal_v19.3.0`:

```powershell
# 1. Desbloquear
Remove-Item .git\index.lock -Force

# 2. Preflight (opcional pero recomendado)
node scripts\build.js
python scripts\verify_deploy.py --local

# 3. Commit + push con identidad correcta
git add kb/knowledge_base.json DEMO_FLOW.md scripts/audit_hallucinations.py HALLUCINATION_AUDIT.md HALLUCINATION_AUDIT_active.md HALLUCINATION_AUDIT_pending.md OCR_SCOUTING.md
git -c user.email="visionpatagonia@gmail.com" `
    -c user.name="visionpatagonia-bit" `
    commit -m "kb: pre-demo hardening v19.30.5-6 — 4 Admin clean + 23 neutralized + 2 whitelisted; audit H7 + OCR scouting"
git push origin main

# 4. Verify remoto (esperá ~60s el autodeploy de Vercel)
Start-Sleep -Seconds 60
python scripts\verify_deploy.py
```

**Rollback trivial** si algo sale mal: `git revert HEAD` + `git push`. Los `_original_patterns` están preservados en cada entry neutralizada.

---

## 🧪 Testing checklist (correr antes del demo)

```powershell
# 1. Preflight local
node scripts/build.js
python scripts/verify_deploy.py --local

# 2. Verify remoto
python scripts/verify_deploy.py

# 3. Check directo de qa_cache.json y flag en prod
curl -sS https://portal-fce-v2.vercel.app/kb/qa_cache.json | python -c "import sys,json; d=json.load(sys.stdin); print('schema:', d['schema'], '· entries:', len(d['entries']))"
curl -sS https://portal-fce-v2.vercel.app/nexus-ai.js | grep "var ENABLE_QA_CACHE"
```

Esperado:
- preflight: 29 archivos, 0 faltantes
- remote verify: 14 passed · 0 failed
- qa_cache: `schema: qa_cache-v1 · entries: 0`
- flag: `var ENABLE_QA_CACHE = false;`
