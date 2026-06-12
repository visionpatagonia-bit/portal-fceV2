# NEXUS OS — Documento de Arquitectura v1
**2026-06-12 · Plano del sistema mayor · Pieza central del paquete de sucesión del arquitecto**
**Estado de cada componente marcado: [LIVE] en producción · [SPEC] especificado · [FUTURO] visión con gate definido**

---

## 0. La tesis (por qué existe este sistema)

En la era en que las respuestas son gratis, el activo escaso es el
razonamiento demostrado. NEXUS OS es el sistema operativo que lo
**produce** (loop de esfuerzo obligatorio), lo **protege** (IA
estructuralmente incapaz de razonar por el sujeto) y lo **certifica**
(traza determinista verificable). No compite con los tutores-IA que
responden mejor: corre la carrera opuesta, la única que no tiende a
precio cero.

Documentos constitucionales que este plano obedece (en orden de
jerarquía): Doctrina Ética NEXUS (v1.0 + Principio VII en v1.1) →
Criterio de Desarrollo (7 reglas, 5 vías) → Constitución de Diseño del
HUD → este documento.

---

## 1. Mapa del sistema operativo (la metáfora es arquitectura literal)

```
┌─────────────────────────────────────────────────────────────┐
│  SHELL · El HUD (cockpit)                          [LIVE+SPEC]│
│  dark cockpit · una misión · debriefing · advisory marcado    │
├─────────────────────────────────────────────────────────────┤
│  SCHEDULER · Director de Vuelo                     [LIVE v1] │
│  asigna el recurso escaso (minutos) entre procesos           │
├──────────────────────────┬──────────────────────────────────┤
│  PROCESOS · Contratos    │  DRIVERS · Periferia académica    │
│  empíricos por examen    │  Moodle/prácticos/SQL/math-apps   │
│  [LIVE: 4 materias]      │  [FUTURO: 2º cuatrimestre]        │
├──────────────────────────┴──────────────────────────────────┤
│  FILESYSTEM · Expediente Cognitivo                 [LIVE parcial]│
│  BKT · léxico · calibración · bug library · SRS · trazas     │
├─────────────────────────────────────────────────────────────┤
│  KERNEL · El Loop + el Juez                        [LIVE]    │
│  pensamiento→evaluación→devolución→aprender→pensamiento      │
│  Ring 0: motor determinista (única autoridad de nota)        │
│  Ring 3: toda IA (advisory, marcada, enjaulada)              │
└─────────────────────────────────────────────────────────────┘
   Capa institucional: TORRE DE CONTROL [FUTURO·gate: Ola 0]
   Capa de verdad:     CAJA NEGRA       [SPEC·gate: notas reales]
```

---

## 2. Componentes, estado y destino

### 2.1 KERNEL — el loop y el juez [LIVE]
- Motor determinista (`scoring.js`) única autoridad de nota. Intocable
  (Regla 1). Pipeline canónico único `onAttemptScored` (B-core).
- Loop completo en producción: devolución de sesión → "Repasar esto
  ahora" → Aprender → micro-retest (#9) → reformulación (GB) → vuelta
  sin pérdida. Principio: ninguna pantalla terminal.
- Anillos de privilegio: Ring 0 puntúa y decide; Ring 3 (Gemini con
  failover multi-proveedor) explica y orienta, siempre marcado.
- **Destino:** estable. El kernel no crece; se endurece. Todo cambio
  requiere core-unit + validate intactos y firma del fundador.

### 2.2 FILESYSTEM — el Expediente Cognitivo [LIVE parcial]
Lo que el sistema sabe del sujeto, persistente y portable:
- [LIVE] BKT por bloque (P(L) ordinal, Firestore durable, F1).
- [LIVE] Índice de despliegue léxico (GA): conocimiento vs hábito,
  cross-identity vía identity_links.
- [LIVE] SRS half-life + juicios de diagnóstico (hoy localStorage →
  migra a durable en Ola 0/F5).
- [SPEC] Historial JOL por familia (GC, en construcción).
- [SPEC] Bug library canónica (#14, errores nombrados y superados).
- [FUTURO] Perfil lingüístico completo (escalera léxica en
  explicaciones; gate: acumulación de texto + #6 ya live).
- **Propietario: el sujeto (Principio VII).** NEXUS es custodio.
  Export, borrado, portabilidad entre procesos y verticales.
  Implementación técnica del Principio VII: Ola 0.

### 2.3 SCHEDULER — Director de Vuelo [LIVE v1 → FUTURO v3]
- [LIVE] V1 greedy: una materia, una sesión, déficit×peso/minutos,
  capado a presupuesto, fecha de examen del propio alumno.
- [SPEC] V2: la SESIÓN como unidad (requiere C, sesiones server-side).
- [FUTURO] V3: multi-proceso real — N materias compitiendo por un
  presupuesto de atención con deadlines distintos; descenso programado
  hacia cada fecha; interleaving entre materias (respaldo en
  literatura). Es scheduling clásico de OS aplicado a cognición.

### 2.4 PROCESOS — Contratos empíricos [LIVE]
- Unidad de valor del sistema: especificación máquina-legible de qué
  exige un evaluador, calibrada contra corpus real (9 parciales en
  Admin; metodología replicable).
- Agregar materia/certificación = un JSON + corpus + pase F7.
- [FUTURO] Verticales no universitarias sobre el mismo runtime:
  certificaciones profesionales (PPI/CNV — el fundador conoce ese
  examen por dentro) e industrial (canal Verónica). DECISIÓN ABIERTA:
  cuál es la segunda vertical (espera estudio de mercado + firma).

### 2.5 DRIVERS — Periferia académica [FUTURO · gate: 2º cuatrimestre]
Adaptadores entre el kernel y el mundo heterogéneo del estudiante.
Diseño invariante: el driver lee el formato del mundo y escribe el
formato del mundo, pero TODO lo intermedio pasa por el loop.
- Driver de prácticos: PDF → parseo contra contrato → resolución ítem
  por ítem CON gates → ensamblado del entregable para Moodle. El PDF
  es subproducto del razonamiento validado, jamás sustituto. Cada
  entregable porta decision_trace (ofrecible a cátedras como
  verificación voluntaria de autoría).
  **Activo existente: `pipeline/` del repo (ingest_pdf, H1-H7) es el
  prototipo. No se reescribe; se resucita.**
- Driver SQL/BD (Tecnología de la Información): corrección determinista
  perfecta — query del alumno contra base sembrada, comparación de
  result sets. El dominio más afín al juez que existe.
- Driver de app de Matemática impuesta: envolver o integrar según qué
  sea; corrección de cálculo ya soportada por el motor (calc engine).

### 2.6 SHELL — el HUD [LIVE + SPEC en ejecución]
Gobernado por la Constitución de Diseño v1 (dark cockpit, semántica
de color, presupuesto cromático, evidencia-no-azúcar, advisory
visible). GD/GE en cola. El shell es la doctrina hecha píxel.

### 2.7 TORRE DE CONTROL — operaciones institucionales [FUTURO · gate: Ola 0]
Estación para aliados (centro de estudiantes, cátedras, Verónica):
ingesta en lenguaje natural → borrador estructurado → validación
determinista de esquema → confirmación humana → entra al sistema.
Carga: fechas de examen, parciales al banco, cola de revisión F7.
Convierte aliados en pipeline de corpus (el flywheel). Requiere auth
y roles (F2). **Activo existente: pipeline/ + nexus-ckg como base.**

### 2.8 CAJA NEGRA — el loop de verdad [SPEC · gate: notas reales]
Post-examen real, el alumno carga su nota → el sistema compara
estimación vs realidad → calibra el mapeo P(L)→puntos → publica su
propia precisión como métrica ("acertamos ±0.5 en X% de la cohorte").
Es la métrica comercial definitiva y nadie más puede tenerla.
Primer dato de la serie: el recu del fundador (2026-06-16).

### 2.9 SEGURIDAD E INTEGRIDAD (transversal)
- Anillos: nada de Ring 3 puntúa, decide ruteo de nota, ni escribe
  contratos sin confirmación humana.
- Gates estadísticos por datos (F3): flags n>=30, decisiones n>=100;
  el sistema nunca finge precisión que sus datos no sostienen (F4).
- Gobernanza de datos: Ola 0 íntegra ANTES del primer peso cobrado
  (gate de evento, ratificado por el fundador).
- Pipeline de confianza: deploy.sh VERDE commit-específico + regla de
  evidencia (archivo+línea o output de PROD) + firma única del
  fundador sobre todo calendario.

---

## 3. Decisiones abiertas (requieren firma del fundador)

| # | Decisión | Estado |
|---|---|---|
| 1 | Segunda vertical: PPI/CNV vs industrial (Verónica) | Espera estudio de mercado |
| 2 | C (sesiones server-side): agrupamiento con Ola 0 | Propuesta sin ratificar |
| 3 | Canje del voucher Trucco (auditoría F7 Contabilidad + test adversarial) | Gate propuesto: post-recu; dossier specado |
| 4 | Retorno a Propedéutica (documento de la concesión) | Gate: decisión del fundador |
| 5 | Separación del cockpit a repo propio | Sugerido post-22, sin urgencia |

## 4. Cómo se trabaja acá (para el arquitecto sucesor)

1. Leé en orden: Doctrina Ética → Criterio de Desarrollo → Constitución
   de Diseño → este documento → ADRs → último reporte de lote.
2. El fundador firma QUÉ y CUÁNDO. Vos proponés, evidenciás y ejecutás.
   Ningún timing tuyo viaja en bloques de instrucciones.
3. "Deployado" = deploy.sh VERDE commit-específico. "Hecho" = checklist
   universal autoevaluado + evidencia. "Verdad" = producción, no reporte.
4. Lotes por ciclo de 4 horas; repaso del fundador al cierre de cada uno.
5. Los agentes rotan con handoffs limpios; el entorno (nombres de env
   vars, servicios, deploys) viaja en el handoff junto con el código.
6. La inspiración es Ring 3. El juez es el juez. También para vos.

---

*Este documento es el plano, no el territorio. El territorio se
verifica con curl. Cuando difieran, gana el territorio y se corrige
el plano — versionado, con trazabilidad, como manda la Cláusula de
Versionado Doctrinal.*
