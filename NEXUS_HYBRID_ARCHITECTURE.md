# 🧠 NEXUS HYBRID ARCHITECTURE v1.1

**Arquitectura híbrida Mistral + Llama 3.2 para independencia de tokens, calidad académica suprema y escalabilidad lateral a múltiples dominios (NEXUS universitario + GYM).**

> **v1.1 (17 abril 2026)** — incorporadas 2 adiciones de Juan: (1) Capa 4 API paga como último fallback (apagada por default, hook listo para futuro con ingresos), (2) auto-mejora con retroalimentación de usuarios (preguntas de alumnos → Mistral → KB crece solo).

---

## 🎯 OBJETIVO

Construir un sistema donde:

- **Mistral 7B** pre-mastica todo el contenido offline (sin apuro, GPU local)
- **Llama 3.2** solo hace retrieval + rewrite en runtime (rápido, consistente)
- **UI determinística** (cero IA en capa visual)
- **Zero token cost** en runtime (todo local)
- **Modularidad total**: el mismo motor sirve para NEXUS académico y para GYM
- **Watcher automático**: nuevos materiales → reprocesamiento automático

---

## ⚙️ HARDWARE DISPONIBLE

| Componente | Specs | Uso previsto |
|------------|-------|--------------|
| GPU | NVIDIA RTX 3080 · 10GB VRAM dedicada + 16GB compartida | Mistral 7B Q4 + Llama 3.2 3B Q4 |
| RAM | 32GB (15.8GB en uso) | Buffer para Python pipeline + OS |
| Storage | HDD C: + SSD D: + HDD E: | Materiales en C:, kb_cache en SSD (mejor latencia) |
| GPU load actual | 3% / 37°C | Tenemos headroom enorme |

**Decisión técnica**: Mistral 7B Q4_K_M (~4.5GB VRAM) + Llama 3.2 3B Q4 (~2.5GB VRAM) = ~7GB. Caben los dos cargados simultáneamente en la 3080. No hace falta descargar/cargar al intercambiar.

---

## 🏗️ ARQUITECTURA DE 3 CAPAS

```
┌──────────────────────────────────────────────────────────────────┐
│                    CAPA 1 — OFFLINE (MISTRAL)                    │
│                                                                  │
│  /Materiales/*.pdf ──┐                                           │
│  /Materiales/*.docx ─┤                                           │
│  horarios.json ──────┼──► [Mistral 7B] ──► /kb/*.json            │
│  materiales.json ────┘    + reglas de              │             │
│                             calidad                 │             │
│                             académica               │             │
│                                                     ▼             │
│                               ┌────────────────────────────┐     │
│                               │  knowledge_base.json       │     │
│                               │  qa_patterns.json          │     │
│                               │  embeddings.json (opt)     │     │
│                               │  materiales_resumen.json   │     │
│                               └────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 │  (deploy como static JSON)
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    CAPA 2 — RUNTIME (LLAMA 3.2)                  │
│                                                                  │
│  Usuario pregunta en chat ──► nexus-ai.js                        │
│                                   │                              │
│                                   ▼                              │
│                            [Matcher runtime]                     │
│                            keyword + fuzzy                       │
│                                   │                              │
│                      ┌────────────┴────────────┐                 │
│                      ▼                         ▼                 │
│                  MATCH HIT                MATCH MISS             │
│                      │                         │                 │
│                      ▼                         ▼                 │
│              Render template            Llama 3.2 intenta        │
│              con data runtime            (low confidence?)       │
│                      │                         │                 │
│                      │              ┌──────────┴──────────┐      │
│                      │              ▼                     ▼      │
│                      │         Llama responde      Mistral fallback
│                      │                                   │       │
│                      │                                   ▼       │
│                      │                         Guarda en kb_cache
│                      │                         (nunca más miss)  │
│                      ▼                                   │       │
│                   Respuesta ←─────────────────────────────┘      │
│                      │                                           │
└──────────────────────┼───────────────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              CAPA 3 — UI (DETERMINÍSTICA, SIN IA)                │
│                                                                  │
│  Render bubble de chat · Markdown · Links internos · Estilos    │
│  100% JS + CSS. Cero razonamiento, cero latencia LLM.            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
portal_v19.3.0/
│
├── Materiales/                      ← INPUT (watched folder)
│   ├── 2026-1C/
│   │   ├── contabilidad/
│   │   │   ├── clase-01-patrimonio.pdf
│   │   │   └── apunte-catedra.docx
│   │   ├── sociales/
│   │   ├── administracion/
│   │   └── propedeutica/
│   └── _new/                        ← carpeta de staging para Mistral
│
├── kb/                              ← OUTPUT de Mistral (deploy-ready)
│   ├── knowledge_base.json          ← preguntas + respuestas pre-generadas
│   ├── qa_patterns.json             ← variantes de preguntas
│   ├── materiales_resumen.json      ← síntesis por PDF
│   ├── embeddings.json              ← (opcional fase 2)
│   └── manifest.json                ← hashes + timestamps para invalidar
│
├── pipeline/                        ← scripts Mistral (Python)
│   ├── ingest_pdf.py                ← PDF → texto → chunks
│   ├── generate_kb.py               ← chunks → Mistral → kb.json
│   ├── watcher.py                   ← fs watchdog
│   └── prompts/
│       ├── nexus_academic.md        ← reglas calidad académica
│       └── gym_fitness.md           ← reglas calidad fitness
│
├── nexus-ai.js                      ← RUNTIME (ya existe, se extiende)
│   ├── + _loadKB() (nuevo)
│   ├── + _matchQuery() (nuevo)
│   └── + existing streamChat flow
│
├── horarios.json                    ← ya existe
├── materiales.json                  ← ya existe
└── scripts/build.js                 ← ya existe, agregar kb/ a APP_FILES
```

---

## 📜 CONTRATOS DE DATOS

### `knowledge_base.json` (output de Mistral)

```json
{
  "version": "1.0",
  "generated_at": "2026-04-17T10:30:00Z",
  "mistral_model": "mistral:7b-instruct-q4_K_M",
  "domain": "nexus_academic",
  "entries": [
    {
      "id": "sched_today",
      "type": "schedule",
      "patterns": [
        "qué clases tengo hoy",
        "clases hoy",
        "mi agenda hoy",
        "qué tengo hoy",
        "horarios de hoy"
      ],
      "answer_template": "Hoy ({{dayName}}) tenés {{count}} clase(s):\n{{list}}",
      "template_vars": ["dayName", "count", "list"],
      "runtime_source": "horarios.json",
      "validated": true
    },
    {
      "id": "mat_patrimonio_intro",
      "type": "material_concept",
      "patterns": [
        "qué es patrimonio",
        "definición de patrimonio",
        "explicame patrimonio"
      ],
      "answer_full": "El patrimonio es el conjunto de bienes, derechos y obligaciones de una persona o entidad. Se compone de: activo (bienes + derechos), pasivo (obligaciones), patrimonio neto (activo - pasivo). [...]",
      "source_refs": ["Materiales/2026-1C/contabilidad/clase-01-patrimonio.pdf#p3"],
      "validated": true
    }
  ]
}
```

### `manifest.json` (invalidación de cache)

```json
{
  "last_run": "2026-04-17T10:30:00Z",
  "files_hash": {
    "Materiales/2026-1C/contabilidad/clase-01-patrimonio.pdf": "sha256:abc123...",
    "Materiales/2026-1C/sociales/clase-01.pdf": "sha256:def456..."
  },
  "needs_regeneration": false
}
```

### `qa_cache.json` (cache de respuestas MISS resueltas)

```json
{
  "entries": [
    {
      "question_hash": "sha256:...",
      "original_question": "cómo preparo el parcial de contabilidad",
      "generated_answer": "...",
      "resolved_by": "mistral_fallback",
      "created_at": "2026-04-17T14:22:00Z",
      "hit_count": 3
    }
  ]
}
```

---

## 📚 REGLAS DE CALIDAD ACADÉMICA SUPREMA

Estas son las reglas que Mistral usa al generar `knowledge_base.json`. Van en `pipeline/prompts/nexus_academic.md`:

### Principios fundamentales

1. **Precisión > síntesis**. Antes de recortar, elegir mejor redacción.
2. **Cero alucinación**. Si el material no lo dice, no se inventa.
3. **Profundidad conceptual**. No resúmenes de manual — explicaciones con matices.
4. **Ejemplos concretos**. Cada concepto abstracto debe venir con ejemplo.
5. **Trazabilidad**. Toda respuesta debe citar su fuente (`source_refs`).
6. **Anti-repetición**. No repetir explicaciones iguales en distintos entries.
7. **Jerarquía cognitiva**: definición → contexto → ejemplo → implicación.

### Anti-patrones prohibidos

- ❌ Respuestas genéricas tipo "depende del contexto"
- ❌ Repetir la pregunta antes de responder
- ❌ Usar "en general" o "típicamente" sin especificar
- ❌ Responder con más preguntas
- ❌ Listas de bullets sin sustancia
- ❌ Citar fuentes inventadas

### Formato obligatorio de respuestas

```
1. Oración-definición (máx. 2 líneas)
2. Contexto/por qué importa (1-3 oraciones)
3. Ejemplo concreto del material (obligatorio si aplica)
4. Relación con otros conceptos del programa (si existe)
```

### Validación automática (auditor local)

Cada entry generada se valida contra:

- Longitud mínima (>80 chars si es `answer_full`)
- Presencia de ejemplo si `type: material_concept`
- Source_refs no vacío
- No contiene frases prohibidas ("como modelo de lenguaje", "no tengo información", etc.)
- Coherencia: si pregunta es específica, respuesta debe serlo también

Entries que fallan validación → marcadas `validated: false` → NO se incluyen en el deploy.

---

## 🔁 WATCHER DE MATERIALES

### Estrategia de detección

```
Loop infinito en pipeline/watcher.py:
  cada 5 min:
    escanear /Materiales recursivamente
    calcular hash sha256 de cada archivo
    comparar con manifest.json
    si hay nuevo/modificado:
      mover archivo a /Materiales/_new/
      trigger generate_kb.py
      actualizar manifest.json
      commit + push automático? (opcional, Fase 3)
```

### Trigger manual

```bash
python pipeline/generate_kb.py --force
```

Para cuando Juan sube un lote grande y quiere procesarlo ya.

### Modo incremental

Solo reprocesa archivos con hash nuevo. No regenera todo el kb si solo cambió 1 PDF.

---

## 🎯 RUNTIME MATCHER (lo que corre en el browser)

Nuevo módulo dentro de `nexus-ai.js`:

```js
// Fase 1 — simple, sin embeddings
function _matchQuery(userQuery, kb) {
  var q = userQuery.toLowerCase().trim();
  var bestMatch = null;
  var bestScore = 0;
  
  for (var entry of kb.entries) {
    for (var pattern of entry.patterns) {
      var score = _fuzzyScore(q, pattern);
      if (score > bestScore && score > 0.7) {
        bestScore = score;
        bestMatch = entry;
      }
    }
  }
  return bestMatch;
}
```

### Estrategia en orden de fallback:

1. **Keyword match** (stem + synonyms) → instant
2. **Fuzzy match** (Levenshtein) → <10ms
3. **Embedding cosine** (Fase 2) → <50ms
4. **Llama 3.2 con kb como contexto** (fallback 1)
5. **Mistral regenera** (fallback 2, slow path, async)

**Criterio de confianza**:
- Score > 0.85 → HIT directo, renderiza template
- Score 0.6-0.85 → HIT tentativo, Llama re-redacta con el entry
- Score < 0.6 → MISS, cae a fallback

---

## 🌐 CAPA 4 — API PAGA COMO ÚLTIMO FALLBACK (FUTURO, APAGADA POR DEFAULT)

**Principio**: solo se activa cuando hay ingresos recurrentes. Hasta entonces, el código existe pero el flag está en `false`.

### Cuándo se activaría

Cuando **TODAS** estas condiciones se cumplen simultáneamente:

1. Runtime matcher devolvió MISS (no hay HIT en kb)
2. Llama 3.2 no pudo responder con confianza alta
3. Mistral fallback tampoco encontró respuesta en los materiales locales
4. Juan activó el flag `ENABLE_API_FALLBACK: true` en config

### Diseño del hook

```js
// nexus-ai.js
var API_FALLBACK = {
  enabled: false,                    // OFF hasta que haya ingresos
  provider: 'claude',                // o 'openai', 'gemini'
  daily_budget_usd: 2.00,            // kill switch automático
  daily_spent: 0,
  max_tokens_per_call: 500,          // respuestas cortas = costo controlado
  log_every_call: true               // auditoría total
};

async function _apiFallback(query, context) {
  if (!API_FALLBACK.enabled) return null;
  if (API_FALLBACK.daily_spent >= API_FALLBACK.daily_budget_usd) {
    return { error: 'budget_exhausted', fallback: 'ask_teacher' };
  }
  // ...llamada API con prompt estricto anti-alucinación
  // respuesta se persiste en qa_cache.json → NUNCA se paga 2 veces
}
```

### Garantía anti-gasto innecesario

Toda respuesta que venga de la API se **cachea obligatoriamente** en `kb/qa_cache.json`. La segunda vez que un usuario haga la misma pregunta (o una semánticamente equivalente) → HIT del cache, cero costo. Es imposible pagar dos veces la misma pregunta.

### Criterio de uso responsable

- Preguntas triviales ("hola", "qué hora es") → **nunca** llegan a la API (filtradas antes)
- Preguntas de opinión personal → **nunca** (filtradas)
- Solo preguntas académicas/de ejercicios con alto valor → sí

### Estado inicial

**Implementación Fase 6+ (post-lunes, post-demo).** El hook queda listo pero desactivado. No afecta en absoluto la operación local.

---

## 🔄 AUTO-MEJORA — USUARIOS COMO AGENTES DEL SISTEMA

**Principio**: el sistema crece con el uso. Cada pregunta nueva que hace un alumno (o cliente del gym) es una oportunidad para que el KB se perfeccione.

### Flujo end-to-end

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Usuario hace pregunta en el chat                             │
│         │                                                        │
│         ▼                                                        │
│  2. Runtime matcher busca en kb                                  │
│         │                                                        │
│    ┌────┴────┐                                                   │
│    ▼         ▼                                                   │
│  HIT       MISS                                                  │
│    │         │                                                   │
│    │         ▼                                                   │
│    │    3. Se persiste en pending_questions.json                 │
│    │       con metadata: {query, timestamp, user_ctx}            │
│    │         │                                                   │
│    │         ▼                                                   │
│    │    4. Llama intenta respuesta temporal                      │
│    │       (con nota "respuesta tentativa — pendiente de revisión")│
│    │         │                                                   │
│    │         ▼                                                   │
│    │    5. En próxima corrida batch de Mistral:                  │
│    │       - procesa la queue pending_questions.json             │
│    │       - busca en materiales si puede responder              │
│    │       - si puede: genera entry + la marca pending_review    │
│    │       - si no: la marca needs_source_material               │
│    │         │                                                   │
│    │         ▼                                                   │
│    │    6. Juan (o docente) revisa panel admin:                  │
│    │       - aprueba → entra al kb productivo                    │
│    │       - edita → se corrige + entra al kb                    │
│    │       - rechaza → se descarta                               │
│    │         │                                                   │
│    └─────────┴─ 7. Próxima vez que alguien pregunta lo mismo     │
│                   → HIT directo, respuesta pulida                │
└─────────────────────────────────────────────────────────────────┘
```

### Caso de uso estrella (lo que contó Juan)

> "Alumno sube pregunta que hizo el profesor en clase el sistema debe retroalimentarse de la experiencia del usuario para su mejora."

Ejemplo concreto:

1. Alumno después de clase: *"¿cuál es la diferencia entre costo histórico y valor razonable que mencionó la profesora?"*
2. KB no tiene esta entry específica → MISS
3. Pregunta entra a `pending_questions.json`
4. Al día siguiente, Mistral corre batch, busca en los PDFs de contabilidad
5. Encuentra referencia en "clase-04-valuacion.pdf#p7" → genera entry con `source_refs`
6. Juan revisa en panel admin, aprueba
7. Un mes después, otro alumno pregunta lo mismo → HIT instantáneo con la respuesta ya pulida

### Contrato de datos — `pending_questions.json`

```json
{
  "entries": [
    {
      "id": "pq_2026-04-18_00123",
      "original_question": "diferencia entre costo histórico y valor razonable",
      "submitted_at": "2026-04-18T14:22:00Z",
      "submitted_by": "user_hash_abc",
      "runtime_answer": "(tentativa de Llama)",
      "runtime_confidence": 0.4,
      "status": "pending_mistral_processing",
      "next_status_options": [
        "mistral_generated_pending_review",
        "needs_source_material",
        "rejected_out_of_scope"
      ]
    }
  ]
}
```

### Flags de seguridad (crítico para calidad)

- **Ninguna entry generada automáticamente** entra al kb productivo sin aprobación humana en las primeras semanas
- **Panel admin obligatorio**: Juan revisa lote semanal
- **Para gym**: validación manual **obligatoria** si la pregunta toca contraindicaciones o técnica de ejercicio (riesgo de lesión)
- Threshold configurable: `auto_approve_if_confidence > 0.95 AND source_refs.length > 0` (activable solo cuando hay historial de calidad)

### Endpoint mínimo (Fase 2)

```js
// POST /api/submit-question
{
  "question": "string",
  "user_id": "string",  // opcional, anónimo por default
  "context": "schedule|material|other"
}
```

Server (o serverless function de Vercel) → valida → persiste en `pending_questions.json` (o en una DB si escala).

### Beneficio estratégico

Cada alumno **enseña al sistema** sin saberlo. Esto crea un **efecto red**:

- Más usuarios → más preguntas → kb más rico → respuestas mejores → más usuarios
- Mistral no procesa en blanco: procesa **exactamente lo que los usuarios preguntan** en la práctica
- Para la demo a inversores: "cada usuario te hace el producto mejor sin que vos hagas nada" — narrativa potente

---

## 🧬 MODULARIDAD — CÓMO SE USA PARA GYM

**El motor es idéntico. Solo cambia**:

| Componente | NEXUS | GYM |
|------------|-------|-----|
| Carpeta input | `/Materiales` académicos | `/Rutinas` + `/Ejercicios` |
| Prompts Mistral | `nexus_academic.md` | `gym_fitness.md` |
| Domain en kb | `"nexus_academic"` | `"gym_fitness"` |
| Schema base | común | común |
| Campos extra | `source_refs`, `material_chapter` | `muscle_group`, `difficulty`, `equipment` |
| Runtime matcher | mismo código | mismo código |
| UI | tema universitario | tema fitness |

**Arquitectura** = reutilizable al 95%. Lo único específico por dominio son los prompts y algunos campos del schema.

### Para lanzar Gym después:

```
mkdir portal_gym_v1/
cp -r portal_v19.3.0/pipeline/* portal_gym_v1/pipeline/
cp -r portal_v19.3.0/nexus-ai.js portal_gym_v1/
# cambiar prompts, cambiar domain flag, cambiar materiales source
```

---

## 🛣️ PLAN DE IMPLEMENTACIÓN POR FASES

### **FASE 0 — Setup (1 día)**

- [ ] Instalar Ollama en la máquina con 3080
- [ ] `ollama pull mistral:7b-instruct-q4_K_M`
- [ ] `ollama pull llama3.2:3b` (si no está ya)
- [ ] Verificar ambos modelos cargados + benchmark de latencia
- [ ] Instalar Python + libs: `pypdf`, `python-docx`, `watchdog`, `requests`

**Entregable**: ambos modelos responden a un prompt de prueba vía API local.

---

### **FASE 1 — Pipeline básico schedule (1 día)**

- [ ] `pipeline/generate_kb.py` versión minimal: solo procesa `horarios.json`
- [ ] Output: `kb/knowledge_base.json` con ~15 entries de schedule
- [ ] Validator local integrado
- [ ] Integración runtime: `_loadKB()` + `_matchQuery()` en `nexus-ai.js`
- [ ] Llama ahora consulta kb ANTES de razonar
- [ ] Test: 3 preguntas de schedule funcionan al 100%

**Entregable**: bug actual del schedule (Administración omitida, PRÓXIMA duplicada) RESUELTO.

---

### **FASE 2 — PDF ingestion (2-3 días)**

- [ ] `pipeline/ingest_pdf.py`: PDF → texto → chunks
- [ ] Prompts de calidad académica (`nexus_academic.md`)
- [ ] Mistral genera entries tipo `material_concept` por PDF
- [ ] Validation rules aplicadas
- [ ] `kb/materiales_resumen.json` populado
- [ ] Runtime matcher maneja tipo `material_concept`

**Entregable**: el chat puede responder preguntas sobre el contenido de los PDFs sin alucinar.

---

### **FASE 3 — Fallback dinámico (1-2 días)**

- [ ] Llama detecta MISS → envía pregunta a Mistral local (nuevo endpoint)
- [ ] Mistral genera respuesta usando contexto relevante
- [ ] Response se cachea en `kb/qa_cache.json`
- [ ] Próxima pregunta similar = HIT

**Entregable**: cero preguntas sin respuesta decente. El sistema aprende sin reentrenamiento.

---

### **FASE 4 — Watcher automático (1 día)**

- [ ] `pipeline/watcher.py` corriendo como servicio
- [ ] Detecta nuevos archivos cada 5 min
- [ ] Ejecuta `generate_kb.py` incremental
- [ ] Actualiza manifest + avisa al portal (via timestamp)

**Entregable**: Juan sube PDFs a /Materiales → 5 min después NEXUS ya los sabe.

---

### **FASE 5 — Replicar para GYM (2 días)**

- [ ] Copiar estructura a `portal_gym_v1/`
- [ ] Crear `gym_fitness.md` con reglas de calidad de rutinas
- [ ] Schema adaptado con `muscle_group`, etc.
- [ ] Runtime matcher sin cambios

**Entregable**: MVP de GYM usando el mismo motor.

---

**Tiempo total estimado**: 7-10 días de trabajo focalizado.  
**Para la demo técnica inversores**: Fases 0-2 mínimo (4-5 días).

---

## ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Mistral genera entries inválidas | Alta | Medio | Validator local rechaza entries que no cumplen reglas |
| Matcher runtime falla con query rara | Media | Bajo | Fallback a Llama + eventualmente Mistral |
| PDFs corruptos rompen pipeline | Media | Medio | Try/catch por archivo, log, no abortar batch |
| Mistral tarda demasiado en batch | Baja | Bajo | Es offline — no importa |
| VRAM insuficiente con 2 modelos cargados | Baja | Alto | Usar Q4 en ambos (probado con headroom) |
| Cache kb crece sin límite | Media | Bajo | Policy de poda: entries con hit_count=0 por >30 días se borran |
| Watcher duplica procesamiento | Media | Bajo | Lockfile + hash check |
| Latencia runtime degrada UX | Baja | Alto | Matcher <10ms + template render sincrónico |

---

## ✅ CRITERIOS DE ÉXITO (MÉTRICAS PARA LA DEMO)

**Criterios técnicos** (observables en demo):

1. **Consistencia**: la misma pregunta retorna la misma respuesta 10 veces seguidas → 100% idéntico
2. **Zero alucinación en schedule**: las 3 preguntas clásicas responden correcto siempre
3. **Citación de fuentes**: al menos 50% de respuestas académicas incluyen `source_refs`
4. **Latencia**: respuesta en <800ms para HITs, <3s para MISS con fallback
5. **Cobertura**: kb_schedule contiene al menos 15 patterns de preguntas temporales
6. **Modularidad demostrable**: mostrar que el mismo código sirve para Gym con solo cambiar kb

**Criterios de negocio** (para inversores):

1. **Independencia de tokens**: mostrar que todo corre local, facturación API = $0
2. **Escalabilidad lateral**: demostrar Gym funcionando con el mismo motor
3. **Mejora automática**: subir un PDF en vivo durante demo, 5 min después el chat lo responde
4. **Confiabilidad**: cero errores visibles durante toda la demo de 20 min

---

## 🧠 PRINCIPIOS QUE NO NEGOCIAMOS

1. **Mistral razona una vez, Llama repite mil veces**
2. **La inteligencia está en la preparación, no en la interfaz**
3. **Zero tokens pagados en runtime — siempre**
4. **Modularidad primero — todo código debe servir para N dominios**
5. **Calidad académica ≠ cantidad. Una respuesta impecable > diez respuestas genéricas**
6. **Determinismo en UI, no creatividad en UI**
7. **El usuario nunca debe sentir "no sé" sin que el sistema ya esté resolviéndolo**

---

## ✅ DECISIONES APROBADAS POR JUAN (17 abril 2026)

| Pregunta | Respuesta | Justificación |
|----------|-----------|---------------|
| ¿Mapa refleja lo pedido? | ✅ Sí, con 2 adiciones | Capa 4 API + auto-mejora usuarios (ya incorporadas) |
| ¿Ruta `/Materiales` correcta? | ✅ Sí | Materiales ya presentes + algunos nuevos para test |
| ¿Modelo Mistral? | ✅ **7B Q4_K_M** | 4.5GB VRAM, batch 2x más rápido, suficiente para extracción estructurada |
| ¿Punto de partida? | ✅ **Fase 0 + 1 (schedule)** | Fixea bugs PATCH 10.4, valida arquitectura con dataset chico |
| ¿Watcher desde inicio? | Manual primero → automático Fase 4 | Garantía de control en semana de demo |
| ¿Deadline demo? | **Lunes 20 abril @ 80% (estudio)** · 2 semanas (gym) | Priorización cristal clara |
| ¿Materiales en carpeta? | ✅ Sí + nuevos para probar | Test real del sistema de ingesta |

---

## 📅 PLAN CONCRETO HASTA EL LUNES (DEMO 80%)

### **Viernes 17 abril (HOY, tarde/noche)** — Fase 0 + Fase 1

**Juan en paralelo:**
- `ollama pull mistral:7b-instruct-q4_K_M` (~10-15 min)
- `ollama pull llama3.2:3b` (~3 min)
- `ollama list` → verificar

**Claude:**
- Crear estructura `/kb/`, `/pipeline/`
- Escribir `pipeline/ingest_schedule.py` (horarios.json → schedule_kb.json)
- Escribir `pipeline/config.py` + `requirements.txt` + `README.md`
- Escribir prompt `prompts/nexus_academic.md`
- Actualizar `nexus-ai.js` con `_loadKB()` + `_matchQuery()` (behind feature flag)
- Actualizar `sw.js` + `scripts/build.js` para incluir `kb/*.json`

**Entregable viernes**: pipeline corre localmente, genera `schedule_kb.json`, runtime matcher funciona en local. Bug de PATCH 10.4 resuelto con sistema nuevo.

---

### **Sábado 18 abril** — Fase 2 parte 1 (PDF ingestion)

- `pipeline/ingest_pdf.py`: extract + chunking
- `pipeline/generate_kb.py`: Mistral procesa chunks con prompt académico
- Validator local (anti-alucinación, source_refs obligatorio)
- Corrida batch con los materiales actuales
- Runtime matcher extendido a `material_concept`
- Tests con 10+ preguntas académicas reales

**Entregable sábado**: chat responde preguntas sobre contenido de PDFs con fuente citada.

---

### **Domingo 19 abril** — Hardening + fallback + submit-question

- Fallback dinámico: MISS → Mistral local → cachear en `qa_cache.json`
- Endpoint `/submit-question` mínimo (escribe a `pending_questions.json`)
- Smoke test end-to-end: 30 preguntas reales
- Fix de edge cases que aparezcan
- Verificación latencias <500ms para HIT, <3s para MISS

**Entregable domingo**: sistema robusto, medición de métricas, listo para producción soft.

---

### **Lunes 20 abril (antes de demo)** — Buffer + deploy

- Verificación final
- Deploy a Vercel con kb/ incluido
- Smoke test en producción
- Script de reset rápido si algo falla durante la demo

**Entregable lunes**: demo al 80%+ ready. Margen para imprevistos.

---

### **Post-lunes (semana del 21-26 abril)** — Camino a la demo del Gym

- Fase 3 completada (fallback dinámico robusto)
- Fase 4 (watcher automático)
- Panel admin mínimo (revisión de `pending_questions.json`)
- Replicación estructura a `portal_gym_v1/`
- Prompts fitness + schema muscle_group/difficulty
- Demo gym lista para semana del 28 abril - 3 mayo

---

## 🧪 DECISIÓN SOBRE SEGURIDAD DEL CONTENIDO (punto 5 Juan)

**Regla de oro no negociable**: ninguna respuesta productiva puede existir sin `source_refs` válido apuntando a material del docente/Juan.

**Protecciones escalonadas**:

1. **Validator local** (runtime Python): entries sin source_refs se marcan `validated: false` y NO se deployan
2. **Runtime matcher**: threshold mínimo 0.7 de fuzzy score; por debajo → fallback explícito "necesito más contexto"
3. **Respuesta UI**: toda answer académica muestra fuente inline: *"Según el apunte de cátedra (clase-04-valuacion.pdf, p.7):"*
4. **Gym — protección extra**: campo `safety_notes` + `contraindications` **obligatorios** en entries de ejercicios. Validator rechaza entries de ejercicios sin estos campos. Mistral nunca publica al KB productivo sin flag de revisión humana en las primeras 4 semanas.
5. **Panel admin semanal**: Juan revisa qué entries se crearon, qué quedó pendiente, qué fallback se disparó

**En palabras de Juan**: *"un alumno puede estar estudiando para un parcial que le define su futuro académico o un cliente del gimnasio haciendo ejercicios que tienen que estar bien explicados por que podría lesionarse."* — esto es la estrella polar del sistema.

---

*Documento vivo. Actualizar cada vez que cambie una decisión de arquitectura.*
*Última revisión: 17 abril 2026 (v1.1 — post-aprobación Juan, arranca implementación)*
