# NEXUS Study Cockpit — Criterio de Desarrollo de Nueva Generación
**2026-06-11 · Documento unificador · Roadmap canónico del proyecto**
**Firma de calendario: pendiente del fundador en todos los casos. Este documento ordena por DEPENDENCIA y por CONDICIÓN DE DATOS, nunca por fecha.**

> Documento maestro de rumbo. El resto de los docs (`audit-impl/`, `ADR-001`, mini-informes) son
> detalle de implementación; este fija el criterio que decide **qué** se construye y **bajo qué
> condición**. El **cuándo** es siempre firma del fundador (regla 7).

> **Estado de ratificación (fundador, 2026-06-12):**
> - **CRITERIO (7 reglas + estructura de 5 vías): APROBADO/RATIFICADO.**
> - **Ola 0 = F2/F5/F7 (gate de evento, antes de cobrar): RATIFICADO** como política.
> - **Director de Vuelo V1 priorizado para el recu: RATIFICADO** (histórico).
> - **C (sesiones server-side) agrupado en Ola 0: PROPUESTA, sin ratificar** — su timing/agrupamiento
>   espera firma del fundador.
> - **Gates psicométricos (#5/#11/#12/#13) "bloqueados por F3": son DEPENDENCIAS TÉCNICAS por datos
>   (n≥100), NO directivas de calendario** — se activan solas (regla 4), sin "no tocar" de fecha.

---

## 1. Estado consolidado (lo que ya es verdad en producción)

**Núcleo:** motor determinista único juez (intocable) · contratos JSON como fuente de verdad, calibrados contra corpus de 9 parciales reales · 4 materias.

**Capa de modelo del alumno:** BKT por bloque con persistencia durable Firestore (F1 ✓) · bandas ordinales, P(L) nunca como % (F4 ✓) · SRS half-life FSRS-lite · JOL/autopredicción (#10, #2 parcial) · diagnóstico juicio-pre-reveal (#4).

**Capa de decisión:** Director de Vuelo V1 — `GET /api/flight-plan`, asignación greedy de minutos por `(1−P(L))·peso`, capado por presupuesto, con card en Inicio (fecha de examen + presupuesto persistidos).

**Capa de loop:** pipeline único `onAttemptScored` (B-core ✓) — intento normal y simulacro alimentan historial+SRS+BKT+JOL por el mismo camino · Devolución session-aware con acordeones por tema y CTA "Repasar esto ahora" → Aprender → vuelta sin pérdida (B-UI ✓) · principio en ADR: **ninguna pantalla es terminal**.

**Capa psicométrica:** matriz persona-ítem con p-value y discriminación (#1), con gate F3: flags suprimidos bajo n<30, decisiones automáticas exigen n≥100.

**Pipeline de confianza:** `deploy.sh` — push verificado + hook + smoke contra PROD; "deployado" = VERDE · `/api/version` con short-sha en el smoke (task_8a6f0daa) · regla de evidencia: todo claim "X está en Y" requiere archivo+línea o check en prod · decisiones de calendario llevan únicamente firma del fundador.

**Puente de identidad:** docs con `_sessionId`+`_subjects`, colección `identity_links` lista para auth futura sin migración dolorosa.

---

## 2. El criterio (las siete reglas que deciden qué se construye, sin necesitar a nadie)

1. **El juez no se toca.** El motor determinista es la única autoridad de nota. Toda IA es advisory, marcada, y enjaulada. Cualquier feature que acerque la IA a puntuar se rechaza sin discusión.
2. **El loop nunca se rompe.** Pensamiento → evaluación → devolución → aprender → pensamiento. Ninguna pantalla terminal; toda devolución ofrece acción; toda acción ofrece re-evaluación. Una feature que crea un callejón sin salida está mal diseñada aunque funcione.
3. **Toda feature mejora exactamente una de tres cosas — señal, decisión o acción.** Señal: medir mejor al alumno (BKT, JOL, matriz, perfil lingüístico). Decisión: planificar mejor su tiempo (Director, SRS). Acción: hacer mejor el acto de estudiar/rendir (devolución, micro-retest, contenido). Si una propuesta no mejora ninguna, no entra. Si mejora dos, gana prioridad.
4. **Gates por datos, no por fechas.** Las features estadísticas se activan por N acumulado, no por roadmap: flags descriptivos n≥30 · decisiones automáticas/Rasch/gatekeeping n≥100 · calibración de parámetros BKT y CAT solo con cohorte real. Hasta entonces: heurísticas honestas con caveat. El sistema nunca finge precisión que sus datos no sostienen.
5. **Verificado = VERDE + evidencia.** Deploy: script VERDE commit-específico. Claims: archivo+línea o output de prod. Visual: ojo del fundador. Las tres verificaciones son distintas y ninguna sustituye a otra.
6. **Gobernanza antes del primer peso cobrado.** La Ola 0 (auth, consentimiento, privacidad, ToS, export/borrado, revisión académica de contenido) no tiene fecha — tiene condición: se completa ANTES de cobrar a un solo estudiante. Es un gate de evento, no de calendario.
7. **El calendario tiene una sola firma.** Dependencias y riesgos los proponen los agentes; el cuándo lo decide el fundador, explícito, siempre.

---

## 3. Backlog unificado, ordenado por dependencia y condición

### Vía A — Profundización del loop (sin dependencias externas, construible cuando el fundador disponga)
| Ítem | Qué aporta (regla 3) | Dependencia |
|---|---|---|
| **#9 micro-retest del error** | Acción — cierra el loop del todo: devolución → aprender → re-test del error específico | B-UI ✓ (listo para construir) |
| **#6 self-explanation gate (ICAP)** | Acción + Señal — explicar el fallo antes de ver la respuesta; sus textos alimentan el futuro perfil lingüístico | ninguna |
| **#2 JOL por bloque (completar)** | Señal — calibración confianza-vs-realidad por bloque en todas las materias (render `admQuestions` ya corregido) | ninguna |
| **#16 imágenes en ejercicios** | Acción — fidelidad al formato real de consignas | ninguna |
| **#14 bug library canónica** | Acción — errores típicos por familia, nombrados y reutilizables en devolución | corpus actual alcanza |

> Nota de estado (evidencia, regla 5): **#6 (ICAP)** y **#2 (JOL, incl. fix de `admQuestions`)** ya están
> implementados y LIVE (commits 95a36e5 / a244425 / 55da6cc). Permanecen acá como capacidades del loop a
> profundizar/extender (p. ej. JOL en el form legacy de Contabilidad, textos de #6 → perfil lingüístico).

### Vía B — Ola 0 de gobernanza (condición: ANTES de cobrar; los ítems se construyen juntos porque comparten esquema)
| Ítem | Qué es |
|---|---|
| **F2** | Auth real (Firebase Auth — proyecto y credencial ya vivos) + consentimiento + política de privacidad + ToS + export/borrado de datos |
| **F5** | Migrar SRS y juicios de localStorage a persistencia durable por uid |
| **C** *(agrupamiento en Ola 0 = propuesta, sin ratificar)* | Sesiones persistidas server-side (agrupar intentos por sesión en Firestore) |
| **F7** | Revisión académica humana del contenido `generated_unreviewed`, materia piloto primero, usando el corpus real como ground truth |
| **identity_links → uid** | Reclamar sessionIds históricos al crear cuenta (el puente ya existe) |

### Vía C — Psicometría con cohorte (condición: N real acumulado; el sistema la activa solo, regla 4)
| Ítem | Gate |
|---|---|
| **#5 gatekeeping de ítems IA** | n≥100 por ítem |
| **#12 Rasch b offline** | ~100+ respuestas/ítem |
| **#11 theta/SEM gating** | cohorte + #12 |
| **#13 mini-CAT** | #12 estable; fallback heurístico ya existe |
| **#15 A/B con retención** | F5 + C (verdad server-side) |
| **Calibración parámetros BKT** | primera cohorte real; hasta entonces P(L) sigue ordinal |

### Vía D — Los tres pilares de nueva generación (lo que nadie más tiene)
| Pilar | Qué es | Dependencia |
|---|---|---|
| **Director de Vuelo V2** | La sesión como unidad de planificación: presupuesto multi-noche, descenso programado hacia la fecha (de greedy a horizonte), re-plan tras cada sesión | B-core ✓ + C (sesiones server) |
| **Perfil de capital lingüístico** | De los textos libres (definiciones, justificaciones, self-explanations de #6): léxico técnico usado vs. evitado, registro, escalera léxica en las explicaciones de Gemini, apropiación de vocabulario como outcome medible | #6 + acumulación de texto + F5 |
| **Fidelidad al corpus** | Score de similitud de cada ítem generado contra la distribución real de la cátedra (fraseo, temas, criterio de corrección); gate de promoción al banco complementario al estadístico — funciona desde n=0 | corpus actual (9 parciales) alcanza para V1 heurística |

### Vía E — Plataforma (condición: alianza + Ola 0)
| Ítem | Qué es | Dependencia |
|---|---|---|
| **Torre de Control** | Estación del centro de estudiantes: ingesta en lenguaje natural → borrador estructurado → validación determinista → confirmación humana. Carga de fechas, parciales al banco, cola de revisión de F7. Convierte la alianza en pipeline de corpus | F2 (auth+roles) |
| **Segundo cuatrimestre** | Cada materia nueva = contrato empírico sobre corpus real; la Torre es su boca de carga | Torre + corpus entregado por el centro |

---

## 4. Cómo se usa este documento

El fundador estudia y genera datos; cada intento suyo y del grupo alimenta la Vía C sin que nadie haga nada. Cuando el fundador firma "siguiente", el agente toma el primer ítem de la vía que el fundador elija, lo entrega con VERDE + evidencia, y este documento se actualiza. Las condiciones de activación (cobro, N, alianza) convierten el roadmap en un sistema de gates: nada se construye antes de que sus datos o su evento lo sostengan, y nada espera un permiso de calendario que no sea del fundador.

**La frase que resume el criterio entero:** *cada commit mejora la señal, la decisión o la acción del loop — sin tocar al juez, sin romper el ciclo, y activándose solo cuando sus datos lo sostienen.*
