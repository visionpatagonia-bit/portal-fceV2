# Sprint 1.7 · Traducción bulk yuhonas al main list ES

**Fecha arranque:** 2026-05-10 noche (preflight) · ejecución 2026-05-11 lunes
**Decisión Juan:** main list = 873 yuhonas traducidos · 100 curados como `EX_FALLBACK` de seguridad clínica
**Trigger:** Ariel pide variedad sostenida + biblioteca técnica completa con imágenes

---

## Estado del bundle yuhonas (preflight 2026-05-10)

| Métrica | Valor |
|---|---|
| Total ejercicios | 873 |
| Tiene `nombre_es` (pre-traducido por diccionario) | 359 (41%) |
| Tiene `instrucciones_es` (necesita traducción) | **0 · pendiente LLM** |
| Categorías main-list ready (fuerza · estiramiento · cardio) | 718 |
| Categorías niche (pliometría · oly · strongman · powerlifting) | 155 |
| Distribución nivel | inicial 523 · intermedio 293 · avanzado 57 |

**Path bundle:** `NEXUS FITNES/deploy_qa/public/exercises_extended.json` (1.11 MB · cargado lazy via NX_CATALOG)

---

## Schema mapping yuhonas → NEXUS EX

| yuhonas | NEXUS EX | Mapping rule |
|---|---|---|
| `id` | `id` | prefijo `yuhonas_` preservado |
| `nombre_es` (fallback `nombre` EN) | `name` | si `nombre_es` null · usar `nombre` con sufijo `(EN)` |
| `nivel` (string) | `level` (int) | inicial→2 · intermedio→3 · avanzado→4 |
| `categoria` (filtro) | (filter) | solo `fuerza` `estiramiento` `cardio` van al main · resto a `EX_FALLBACK` |
| `musculos_primarios[0]` | `group` | ver mapping abajo |
| `musculos_primarios` | `primary_muscles` | array completo · capitalizado |
| `musculos_secundarios` | `secondary_muscles` | array completo |
| `mecanica` + `fuerza_tipo` | `pattern` | tabla derivación |
| `equipamiento` | `equipment` | mapping a vocab NEXUS |
| `imagenes` | `imagen_thumb` + `imagen_full` | imagen[0]=thumb, imagen[1]=full |
| `instrucciones` (EN) | `instructions` | hasta D2 (LLM) · EN crudo |
| (nuevo) | `contraindications` | heurística por pattern · D3 |
| (nuevo) | `regression_chain` | auto-generada por group+pattern · D3 |
| (nuevo) | `citation` | "Banco yuhonas (free-exercise-db MIT)" |

**Mapping musculos_primarios → group:**
- abdominales → Core
- cuádriceps → Cuádriceps
- isquiotibiales → Glúteos
- glúteos → Glúteos
- aductores → Glúteos
- pecho → Pecho
- dorsales · espalda media · trapecios · lumbares → Espalda
- hombros → Hombros
- tríceps · bíceps · antebrazos → Brazos
- gemelos → Pantorrillas
- pulso (cardio) · cardiovascular → Cardio

**Mapping mecanica+fuerza_tipo → pattern:**
- compuesto + empuje → `push_horizontal` (default) o `push_vertical` (si shoulder/overhead)
- compuesto + tracción → `pull_horizontal` o `pull_vertical`
- aislamiento + empuje → `isolation_push`
- aislamiento + tracción → `isolation_pull`
- estático → `isometric`
- (estiramiento) → `stretch`
- (cardio) → `cardio_liss` o `cardio_hiit` (según nombre)

---

## Plan por días

### D1 · Pipeline mapping deterministic (esta noche · 45-60 min)

- Script Node: `scripts/build_ex_extended.js`
- Input: `exercises_extended.json`
- Output: `EX_yuhonas_mapped.json` con 873 entries en schema NEXUS
- SIN traducción de instrucciones (queda para D2)
- Smoke: verifica distribución por group + level + pattern + cobertura mínima

### D2 · Traducción LLM de instrucciones (mañana · 2-4 hrs)

- Pipeline Node con Ollama Mistral local (proxy NEXUS :3100)
- Para cada de las 873 entries: traducir `instrucciones` (EN array) → `instrucciones_es` (ES array)
- Cache de traducciones (no re-traducir si ya hecho)
- Muestreo manual 30-50 entries pre-aceptación
- Si Mistral no disponible · usar Anthropic API como fallback (costo bajo · ~$0.50)

### D3 · Heurística contraindicaciones + regression chain (mañana · 2-3 hrs)

- Tabla heurística conservadora:
  - `hinge` · spinal load → ["dolor lumbar agudo", "hernia de disco"]
  - `squat` · `lunge` → ["dolor de rodilla agudo", "lesión meniscal"]
  - `push_vertical` → ["dolor de hombro agudo", "manguito rotador"]
  - `cardio_hiit` · `plyometric` → ["embarazo trimestre 3", "cardiopatía no estabilizada"]
- Si yuhonas tiene match con curado original → heredar contras + regression del curado
- Auto-generar `regression_chain` por group+pattern+level desc

### D4 · Reemplazo EX + smoke regression + deploy (mañana · 1-2 hrs)

- Backup: 100 curados originales → `EX_FALLBACK` array (preservado para retrocompatibilidad)
- Reemplazo: `EX = EX_yuhonas_extended`
- Smoke regression headless + 7 smokes Sprint 1.5/2/1.6 + 5 hotfix smokes
- Diagnóstico empírico: generar rutinas con perfiles Luz · Michael · adulto mayor · embarazada · validar 0 contraindicaciones violadas
- Deploy + comunicación Ariel

---

## Riesgos a mitigar

1. **Traducción LLM errónea** → muestreo manual antes de aceptar bulk · acceptance threshold 95%+
2. **Contras conservadoras → bloqueo de ejercicios válidos** → heurística + fallback a curado match
3. **Imágenes yuhonas pueden fallar** (github rate limit) → SW cache yuhonas + onerror fallback al groupIcon
4. **Sprint 1.6 lightbox y matching usan EX actual** → validar que sigan funcionando con EX expandido
5. **Modal +Agregar puede tener mucho scroll** con 873 ej → mejorar buscador (sprint 1.7+ UX)

---

## Decisiones Juan pre-arranque D2

- [ ] **LLM:** Mistral local (preferido · zero costo) vs Anthropic API (fallback)
- [ ] **Heurística contras:** ¿conservadora estricta (más bloqueos) o permisiva con badge "validar con coach"?
- [ ] **EX_FALLBACK access:** ¿accesible vía UI toggle o solo lookup interno del motor?
- [ ] **Modal +Agregar UX:** ¿necesita re-organizar para 873 ej · o el buscador actual basta?
