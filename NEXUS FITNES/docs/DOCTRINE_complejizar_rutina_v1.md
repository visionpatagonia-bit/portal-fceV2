# DOCTRINA · Complejizar rutina · 3 transformaciones canónicas

**Versión:** v1.0
**Fecha de captura:** 2026-05-05
**Origen:** feedback en tiempo real de Ariel Díaz Campos (Anubis Athletic Center) sobre rutina de definición de 5 días.
**Aprobación:** CTO externo (auditoría 2026-05-05) · marcado como **activo de plataforma**.
**Aplica a:** NEXUS Fitness · feature futuro "Complejizar rutina automático" en el dashboard del trainer.

---

## CONTEXTO

Esta doctrina se descubrió aplicando manualmente las instrucciones literales de Ariel sobre una rutina pre-armada. La transformación de v1 → v2 dejó visible un patrón estructural reproducible que el trainer aplica cuando dice "complejizá esta rutina".

Documentar el patrón permite que NEXUS Fitness lo automatice: en el futuro, el botón "Complejizar rutina" en el dashboard del trainer puede aplicar estas 3 transformaciones programáticamente sobre cualquier rutina cargada.

---

## LAS 3 TRANSFORMACIONES CANÓNICAS

Cuando un trainer pide complejizar una rutina ya armada, el patrón estructural que aplica un trainer profesional es:

### 1 · Más reps en accesorios y aislamientos (NO en compuestos pesados)

- **Ejemplo:** abductores 4×15 → 4×25,20,15,15 (escalera descendente con pico en la primera serie)
- **Ejemplo:** gemelos 3×15,15,12 → 3×20,15,15
- **Compuestos pesados** (sentadilla con barra, hip thrust con barra, press plano con barra) **NO suben reps** · siguen 6-12 con peso alto
- **Razón:** más reps en aislamientos = mayor estímulo metabólico y bombeo, clave para definición. Subir reps en compuestos pesados los saca del rango de hipertrofia neural.

### 2 · Fallo (★) en la última serie de 1 compuesto clave por día

- Marcado con `★` en `display_name` del ejercicio
- **Solo 1 fallo por día** · saturar el SNC con 3-4 fallos rompe la recuperación
- **Variantes:**
  - **AMRAP** (As Many Reps As Possible · al fallo limpio)
  - **Drop set** (al fallo + bajada 25-30% del peso + nuevo fallo)
  - **TODAS AMRAP** en aislamientos accesibles sin riesgo (tipo fondos en banco)
- **Aplicación típica:** 1 compuesto pesado al fallo + opcionalmente 1 aislamiento AMRAP en el mismo día
- **Razón:** 1 serie máxima por día genera estímulo neural sin sobrecargar la recuperación

### 3 · Dos supersets quirúrgicos (no más, no menos)

- Etiquetados `▶ SUPERSET A` y `▶ SUPERSET B`
- Cada uno = 2 ejercicios encadenados SIN descanso entre uno y otro · descanso 60-90s recién al terminar el segundo
- **Tipos canónicos:**
  - **Mismo músculo desde 2 ángulos** (ej. Abductores bilateral + Patada lateral unilateral · ambos glúteo medio)
  - **Agonista-antagonista** (ej. Curl martillo + Extensión tríceps polea cuerda · clásico bíceps-tríceps de Anubis)
- **Razón:** densidad + bombeo cruzado · ahorra tiempo + mantiene FC alta

---

## CÓMO APLICAR (algoritmo para automatización)

Cuando un trainer pide complejizar una rutina existente:

1. **Identificar accesorios/aislamientos** → subir reps en esquema piramidal o escalera descendente (15-25 reps)
2. **Mantener compuestos pesados** con reps bajas pero marcar 1 con ★ al fallo (drop set en aislamiento, AMRAP en compuesto)
3. **Detectar 2 lugares donde un superset suma sentido:**
   - Día con dos aislamientos del mismo músculo → mismo grupo desde 2 ángulos
   - Día con bíceps + tríceps separados → bíceps-tríceps clásico
4. **Documentar en `decisions_log`** v1→v2 con razón explícita del trainer

---

## ANTI-PATRONES A EVITAR

- ❌ **Más de 2 supersets por rutina** (rompe la lectura del trainer y satura al cliente)
- ❌ **Fallo en compuestos NO entrenados** (sentadilla al fallo sin spotter = riesgo lesión)
- ❌ **Subir reps en compuestos que ya tienen 6-10** (eso los saca del rango de hipertrofia neural)
- ❌ **Mezclar técnicas avanzadas con principiantes** · este patrón es para nivel 3+ (intermedio-avanzado)
- ❌ **Aplicar a clientes con lesiones activas** sin filtrado adicional · el fallo y los supersets requieren técnica dominada

---

## TRAZABILIDAD

- **Caso de aplicación:** `clientes/anubis/rutinas/Rutina_Definicion_avanzada.{docx,pdf,json}` (2026-05-05)
- **Decisions_log v1→v2** documentado en el campo `_anubis_meta.decisions_log` del JSON correspondiente
- **Ejemplo concreto** de las 3 transformaciones aplicadas a una rutina de 5 días con resultado visible en el PDF

---

## PARA EL FEATURE "COMPLEJIZAR RUTINA AUTOMÁTICO" (futuro)

Cuando se construya el botón en el dashboard del trainer:

- Input: una rutina cargada en `STATE.routines[clientId]`
- Output: misma rutina con las 3 transformaciones aplicadas + decisions_log v1→v2 con `trainer: "NEXUS auto-complexify v1.0"` y referencia a esta doctrina
- UI: confirmar al trainer las 3 cosas que se van a aplicar antes de ejecutar (texto explícito, no caja negra)
- Nivel mínimo del cliente: 3 (intermedio) · refuse honesto si nivel < 3

---

*Doctrina capturada en sesión del 2026-05-05 · aprobada por CTO externo el mismo día como activo de plataforma.*
