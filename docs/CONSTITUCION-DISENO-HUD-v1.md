# NEXUS Cockpit — Constitución de Diseño del HUD (v1)
**2026-06-12 · Spec ejecutable para GD/GE · Deltas sobre el diseño actual, NO rediseño**
**Regla madre: cada decisión cita el principio del que deriva. Lo que no cita, no entra.**

---

## 0. Lo que se CONSERVA (el ADN actual)

- Fondo dark profundo (#0a0a0f aprox.), cards elevadas sutiles.
- Identidad magenta→violeta en gradiente + cyan como acento.
- Pills/badges de estado redondeadas.
- Tipografía actual (sans geométrica, pesos marcados).
- Layout de navegación superior y selector de materia.

Nada de lo anterior se rediseña. Todo lo que sigue es asignación de
significado y poda.

---

## 1. Los cinco principios de diseño (con trazabilidad)

| # | Principio de diseño | Deriva de |
|---|---|---|
| D1 | **Dark cockpit**: el silencio visual es el estado normal. Color = señal, nunca decoración. Si todo está bien, la pantalla está tranquila. | Doctrina II (no compulsión artificial) + declutter del fundador |
| D2 | **Una acción brillante por pantalla**: solo la recomendación del Director lleva el gradiente magenta. Todo lo demás es secundario visualmente. | Regla del loop + Miller/Sweller (carga cognitiva, ensayo Portal) |
| D3 | **Evidencia, no azúcar**: cero streaks, confeti, puntos decorativos. El refuerzo es información de competencia (errores recuperados, bandas, calibración). | Doctrina II + cap. IV del ensayo (serotonérgico vs dopamínico) + SDT (Deci & Ryan) |
| D4 | **Lo advisory SE VE advisory**: todo contenido IA lleva marca visual constante (borde punteado + etiqueta ✦). El juez nunca la lleva. Distinguibles a un vistazo. | Regla de oro / Ring 0-Ring 3 |
| D5 | **Ninguna pantalla terminal**: todo estado final renderiza su siguiente paso del loop. El estado vacío dice "Nada requiere tu atención" — jamás rellena con feed. | Principio del loop (ADR) |

---

## 2. Tokens semánticos de color (la reasignación clave)

Hoy el color es estético. Pasa a ser **semántico estricto**:

| Token | Color | Significa | Único uso permitido |
|---|---|---|---|
| `--accion-director` | gradiente magenta→violeta | "Esto es lo que el Director recomienda AHORA" | UN elemento por pantalla, máximo |
| `--info` | cyan | dato/estado neutro | pills de estado, valores, links |
| `--atencion` | ámbar/naranja | requiere atención del piloto (banda floja, repaso vencido, sobreconfianza) | badges y filas que piden acción |
| `--confirmado` | verde | verificado/recuperado/calibrado | checks, "✓ Recuperado", backend online |
| `--fallo` | rojo suave | punto perdido / error concreto | detalle de corrección únicamente |
| `--advisory` | violeta desaturado + borde punteado | contenido generado por IA | TODO lo advisory, SOLO lo advisory |
| `--reposo` | grises de la paleta actual | todo lo demás | el 85% de la pantalla |

**Regla de presupuesto cromático:** por pantalla: 1 elemento `--accion-director`,
≤3 elementos `--atencion`. Si una pantalla necesita más, el problema es de
información, no de color: se poda (D1).

---

## 3. Arquitectura de información por pantalla (deltas)

### 3.1 INICIO → "El HUD"
Estado actual: hero + 4 stats + mis materias + próxima acción. Bueno,
pero todo compite.

Deltas:
- **Centro absoluto: la card del Director** ("Plan de esta noche") con
  el único gradiente magenta de la pantalla. Fecha de examen y
  presupuesto visibles y editables ahí mismo.
- Stats (score, bloques, materias) pasan a **instrumental periférico**:
  fila superior compacta, tipografía menor, `--reposo`. Son indicadores
  de cabina, no protagonistas (D1).
- "Mis materias" se colapsa a selector si hay misión activa (declutter).
- Estado vacío (sin plan, sin pendientes): *"Nada requiere tu atención.
  Buen vuelo."* + acción suave "Armar plan" (D5).

### 3.2 MODO MISIÓN (nuevo estado, no nueva pantalla)
Al iniciar un bloque del plan (desde Director o "Repasar esto ahora"):
- Pantalla completa del bloque: se OCULTA la navegación superior salvo
  un "salir de misión" discreto (D1: declutter activo, no pasivo).
- Header mínimo: bloque + tiempo asignado del plan + banda actual.
- Un solo CTA visible al completar: el siguiente paso del loop (D2, D5).

### 3.3 DEVOLUCIÓN → "Debriefing"
Estado actual (post B-UI): header agregado + acordeones. Correcto.
Deltas:
- El header agregado adopta lenguaje de instrumental: técnico, margen,
  estimada — ya está; sumar tendencia de calibración con flecha
  (`--info`), sin porcentaje de P(L) jamás (F4).
- Fallos de HÁBITO (🔁) en `--atencion`; de CONOCIMIENTO (📚) en
  `--info`: la distinción de GA se ve sin leer.
- "✓ Recuperado — este error ya no te debe nada" en `--confirmado`:
  el momento serotonérgico del producto (D3). Sin animación de fiesta;
  la frase ES la recompensa.
- Todo texto generado por Gemini dentro del debriefing: token
  `--advisory` (D4).

### 3.4 PROGRESO → "Bitácora"
- Eliminar cualquier métrica de vanidad si existe (tiempo total, días
  seguidos). Reemplazar por: errores recuperados (lista nominal),
  evolución de bandas por familia, historial de calibración (D3).
- Si está vacío: "Tu bitácora se escribe rindiendo. Primer intento →"
  (D5).

---

## 4. Microcopy de cabina (tono)

- Voz del juez: impersonal, breve, sin adjetivos. "0.55/2 · faltan
  conceptos técnicos (roles)". Nunca anima, nunca consuela.
- Voz del Director: imperativa suave, concreta. "40 min a Respuestas
  cortas: flojo y pesa 2 pts."
- Voz advisory (IA): siempre precedida de ✦ y en token `--advisory`.
- Prohibido en todo el producto: signos de exclamación dobles, emojis
  decorativos fuera de los 3 funcionales (🔁 📚 ✓), "¡felicitaciones!",
  y cualquier copy que celebre asistencia en vez de competencia (D3).

---

## 5. Criterios de éxito de GD (Fase 1: tokens + Inicio)

1. CSS: los 7 tokens semánticos definidos y TODO color del Inicio
   migrado a tokens (cero hex sueltos en vistas).
2. Inicio: un solo elemento con `--accion-director` (verificable
   contando en el DOM).
3. Stats periféricos visualmente subordinados a la card del Director
   (screenshot comparativo en el reporte).
4. Estado vacío implementado con su copy exacto.
5. deploy.sh VERDE + checklist universal + smoke del fundador.

## 6. Criterios de éxito de GE (Fase 2: Misión + Debriefing)

1. Modo Misión oculta navegación (verificable en DOM bajo misión activa).
2. Salir de misión restaura el HUD sin pérdida de estado del plan.
3. Debriefing: hábito/conocimiento distinguibles por color sin leer texto.
4. Todo output de Gemini en pantalla lleva marca advisory (auditoría
   visual: buscar texto IA sin borde punteado = fallo).
5. deploy.sh VERDE + checklist + smoke del fundador.

---

*Cierre doctrinal: esta constitución existe para que el producto pueda
crecer sin volverse lo que combate. El día que una pantalla de NEXUS
brille entera pidiendo atención, no habrá fallado el diseño — habrá
fallado la doctrina. Por eso cada regla cita su principio: para que
desviarse duela en la constitución, no en el gusto.*
