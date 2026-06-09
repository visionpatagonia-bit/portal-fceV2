# NEXUS Sovereign v2 - Transportabilidad y rescate tecnico

Fecha: 2026-06-03.

## Decision CTO

NEXUS Sovereign v2 no debe volver al modelo de HTML monolitico como arquitectura principal. El nuevo sistema tiene que ser transportable a cualquier dispositivo mediante una PWA modular, backend-first, con contratos de datos claros y una interfaz cognitiva que pueda renderizarse igual en celular, notebook, tablet o instalacion futura.

La regla de producto queda:

```text
Un mismo motor pedagogico.
Un mismo contrato de estado.
Multiples superficies de uso.
```

La interfaz no debe depender del dispositivo. El dispositivo solo cambia layout, densidad, input y persistencia offline.

## Problemas viejos documentados

| Problema | Evidencia local | Riesgo | Resolucion v2 |
|---|---|---|---|
| HTML standalone pesado | Auditoria de bundle/audio: el audio Base64 era causa real del sobrepeso | Imposible escalar, dificil distribuir, carga lenta | No incrustar assets pesados; servir audio/video como asset externo o cache PWA |
| Mobile no pensado desde el inicio | Feedback de Administracion: botones abajo, equipo no entendia flujo | Friccion y abandono | Mobile-first, drawer de contenido, una accion primaria por pantalla |
| Dashboard estetico sin workflow | `NEXUS-preview-sovereign.html` + feedback de uso | El usuario mira, pero no sabe que hacer | Cognitive cockpit: siguiente accion, motivo, evidencia y correccion |
| Colisiones CSS | `FASE4_AUDIT.md`: `.chip`, `.dot`, `.bar`, `.overlay` | Reskin rompe portal legacy | Tokens y clases scoping `data-ui="sovereign"` + prefijos `sv-*` |
| Accesibilidad incompleta | `FASE4_A11Y_AUDIT.md`: landmarks, focus trap, inert | Mala experiencia, riesgo institucional | Mantener `nexus-sovereign-a11y.js` como base obligatoria |
| PWA incompleta | `manifest.json` sin iconos; SW funcional pero shell vieja | Instalabilidad debil | Manifest completo, iconos, app shell, offline UX visible |
| LocalStorage como backend | Sprints PWA/Fitness documentan puente legacy | Estado fragil, dificil auditar | IndexedDB/Dexie + `@nexus/offline-sync-queue` |
| Sin telemetria de aprendizaje suficiente | Inventario Sovereign: hit_count y procesos no implementados | No aprende del uso real | Eventos estructurados por sesion, respuesta, error, rubrica y sync |
| API key global/proxy simple | Inventario Sovereign: unica API key y multi-tenant no implementado | Riesgo B2B y auditoria backend | Auth por usuario/tenant, rate limit, logs sin PII |
| LLM local como callejon tecnico | Memoria CTO Gemini: motor local rudimentario para salto de calidad | Feedback pobre en respuestas escritas | LLM como evaluador auxiliar via backend, no clave en frontend |
| Alucinaciones en KB | `HALLUCINATION_AUDIT.md`: 46 entries flaggeadas, 18 altas | Perder confianza academica | Validator semantico, rubricas, evidencia y refusal cuando no hay base |
| OCR/material ilegible | Rescate de Administracion y docs: PDFs scan requieren OCR | Material fuera del sistema | Pipeline OCR/texto antes de generar entrenamiento |
| Mock UI sin backend real | `FASE4_AUDIT.md`: cycle modal era animacion | Promesa visual sin capacidad real | Ciclo real: diagnosticar, desafiar, corregir, memorizar |

## Piezas rescatables

### 1. Sovereign visual system

Rescatar:

- `nexus-sovereign.css`
- `nexus-sovereign-a11y.js`
- `nexus-sovereign-components.js`
- `nexus-sovereign-chrome.js`
- `nexus-sovereign-dashboard.js`
- `nexus-ui-mode.js`

Uso v2:

```text
No copiar como monolito.
Convertir en design system:
tokens + componentes + contratos de interaccion.
```

### 2. PWA reusable modules

Rescatar:

- `src/pwa/wake-lock`
- `src/pwa/undo-toast`
- `src/pwa/rest-timer`
- `src/pwa/offline-sync-queue`

Uso v2:

- Wake lock para simulacros largos y sesiones guiadas.
- Undo toast para respuestas, borrados, cambios de avance.
- Rest timer adaptado a pausas cognitivas o bloques Pomodoro.
- Offline sync queue para guardar intentos, respuestas y telemetria sin internet.

### 3. Service Worker actual

Rescatar:

- `sw.js`
- estrategia network-first para KB y assets criticos
- cache-first para shell/assets estaticos
- fallback offline seguro

Cambiar:

- manifest completo con iconos.
- no depender de `index.html` monolitico.
- cache versionado por app shell y por materia.
- pantalla offline con estado comprensible.

### 4. Contrato Gemini/LLM bajo coste

Rescatar:

- `docs/NEXUS_GEMINI_CTO_MEMORIA_2026-06-03.md`

Uso v2:

```text
Frontend -> Backend NEXUS -> LLM proveedor
```

El LLM no decide solo. Interpreta lenguaje natural, detecta omisiones y propone feedback. NEXUS puntua con rubrica versionada.

### 5. Auditoria de conocimiento

Rescatar:

- `HALLUCINATION_AUDIT.md`
- `pipeline/validator.py`
- `scripts/audit_hallucinations.py`
- `nexus-ckg/`

Uso v2:

Cada materia debe tener:

- corpus legible;
- perfil de parcial;
- rubrica;
- banco de casos;
- validator semantico;
- trazabilidad de fuente;
- refusal cuando el sistema no sabe.

## Arquitectura transportable propuesta

```text
NEXUS App Shell
  - React/Vite o frontend modular equivalente
  - PWA installable
  - mobile-first
  - design system Sovereign v2

NEXUS Session Engine
  - estado de aprendizaje
  - modo: estudio, practica, escritura, simulacro, postmortem
  - seleccion adaptativa
  - anti-repeticion

NEXUS Assessment Engine
  - rubricas por materia
  - correctores deterministas
  - corrector escrito asistido por LLM
  - puntaje estimado

NEXUS Offline Layer
  - IndexedDB/Dexie
  - offline-sync-queue
  - sync badge visible
  - crash/error logs sin PII

NEXUS Backend
  - auth
  - tenant/materia
  - rate limit
  - LLM proxy
  - rubricas versionadas
  - telemetry/event store

NEXUS Knowledge Layer
  - corpus OCR/texto
  - CKG/KB
  - validacion semantica
  - exam profiles
```

## Contrato unico de estado

La transportabilidad se logra si cada dispositivo renderiza el mismo contrato:

```json
{
  "sessionId": "sess_2026_06_03_001",
  "subject": "contabilidad",
  "deviceMode": "mobile",
  "learningMode": "simulacro",
  "currentGoal": "resolver asientos y justificar definiciones",
  "detectedWeakness": ["devengado_vs_percibido", "clasificacion_activo_pasivo"],
  "nextAction": {
    "type": "written_case",
    "estimatedMinutes": 8,
    "reason": "fallaste dos veces ajustes de cierre"
  },
  "offline": {
    "canContinue": true,
    "pendingEvents": 3,
    "lastSyncAt": "2026-06-03T18:20:00-03:00"
  },
  "rubricVersion": "contabilidad_2p_v1",
  "evidence": [
    "simulacro_01:item_4",
    "quiz_asientos:item_7"
  ]
}
```

El frontend no inventa el flujo. Lo representa.

## Reglas de transportabilidad

1. Mobile-first: el celular es el baseline, escritorio es expansion.
2. Un solo foco cognitivo por pantalla.
3. Sidebar/drawer siempre accesible, nunca como unica forma de avanzar.
4. Offline por defecto para lectura, practica local y borradores.
5. Sync visible: el usuario sabe si esta guardado, pendiente o fallando.
6. Sin claves en frontend.
7. Sin contenido pesado Base64 en bundle.
8. Componentes accesibles: focus trap, inert, landmarks, teclado.
9. Estado durable: si se corta internet o se cierra la app, vuelve donde estaba.
10. Cualquier materia entra por contrato, no por rediseño manual.

## Roadmap de consolidacion

### Fase 0 - Rescate sellado

- Mantener este documento como memoria de arquitectura.
- Marcar canonicos:
  - `nexus-sovereign.css`
  - `nexus-sovereign-a11y.js`
  - `src/pwa/*`
  - `sw.js`
  - `docs/NEXUS_GEMINI_CTO_MEMORIA_2026-06-03.md`

### Fase 1 - App shell transportable

- Crear shell PWA modular.
- Manifest completo con iconos.
- Layout mobile-first.
- Drawer de contenido + top action bar.
- Estado de sync visible.

### Fase 2 - Vertical slice Contabilidad

- Usar el simulador escrito como primera materia real.
- Guardar respuestas en IndexedDB.
- Encolar telemetria.
- Corregir deterministico cuando sea calculo/asiento.
- Usar LLM solo para respuesta escrita compleja.

### Fase 3 - Backend de nueva generacion

- Endpoint de evaluacion escrita.
- Endpoint de telemetry/sync.
- Auth simple por usuario.
- Rate limit.
- Rubricas versionadas.
- Logs anonimizados.

### Fase 4 - Motor multi-materia

- Administracion, Contabilidad y futuras materias comparten:
  - exam profile;
  - rubric profile;
  - content profile;
  - event profile;
  - UI renderer.

## Dictamen

La transportabilidad no se logra exportando un HTML mas grande. Se logra separando el sistema en:

```text
contenido auditable
estado pedagogico
componentes UI
offline layer
backend LLM/proxy
telemetria
```

Lo viejo tenia piezas muy buenas, pero estaban dispersas. El enfoque v2 es consolidarlas en una arquitectura donde cada materia y cada dispositivo consumen el mismo contrato.

