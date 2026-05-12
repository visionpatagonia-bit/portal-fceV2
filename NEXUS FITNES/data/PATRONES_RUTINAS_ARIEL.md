# Patrones de rutinas Ariel · análisis consolidado

**Fecha:** 2026-05-12 noche
**Versión motor:** v2028.36 (MODO ARIEL feature flag)
**Total rutinas analizadas:** 6 procesadas + 4 pendientes

## Corpus analizado

| # | Archivo | Origen | Estilo |
|---|---|---|---|
| 1 | Pablo | Externa (Ariel pasó) | Post-op rodilla · 4 días · máquinas + cardio LISS |
| 2 | Rocío | Anubis (Ariel hizo) | 5+1 días · 3 piernas + 2 tren · mancuernas/máquinas/polea |
| 3 | Rutina Definición | Como Ariel quiere | 5 días · piernas A/B/C + 2 tren · cardio al cierre cada día pierna |
| 4 | Rutinas Mayo / Team Elías Cejas | Externa | Musculación pro avanzada · 8 ejercicios/día · drop sets |
| 5 | **Plan Holístico Mujer 6 días** | Anubis (premium) | **3 fibras color · 3 piernas + 2 tren sup + 1 full** |
| 6 | **Azucena (adulto mayor)** | Anubis (premium) | **5 días · todo máquinas · sin barra libre · tono cálido** |

**Pendientes de procesar:**
- Rutinas Septiembre (PDF largo · posiblemente Cejas)
- Plantilla 3 días (PDF corto · template)
- Rutina terminada.docx
- rutina MUJERN1.xlsx
- rutina Nadia.pdf

## ⚠️ FEEDBACK REAL DE ARIEL (2026-04-23 · WhatsApp)

Juan compartió capturas de WhatsApp con Ariel comentando rutinas Anubis (Azucena + Holística Mujer 6 días). Estos son comentarios LITERALES de Ariel sobre rutinas que generamos · más valiosos que cualquier análisis indirecto:

| Comentario Ariel | Regla derivada |
|---|---|
| "No poner puente disco · necesita seguimiento del profe" | Puente de glúteo en piso = supervisado · no como ejercicio default |
| "No utilizar **silla** de cuádriceps · es **sillón**" | Nomenclatura: usar "sillón" |
| **"2 ejercicios más por día"** | mainCount = 7 (no 5) cuando modo Ariel ON |
| "Anotador de pesos sería genial" | Tabla progresión validada como feature |
| "Imágenes de ejercicios o link bueno" | yuhonas_thumb validado · ya implementado |
| **"2 días seguidos de piernas con mismos ejercicios · deberían estar SEPARADOS por un día"** | **Splits: piernas NO consecutivas · tren superior entre ellas** |
| "Esa está mejor" (post-fix split alternado) | Estructura split alternado VALIDADA |
| **"Los colores no los entendió"** (sistema fibras) | **DESCARTAR sistema fibras color** · no es prioritario · invento sin valor |
| "El texto debería estar separado de los días" | PDF: bloque intro + calendario en 2 secciones |

**DECISIONES INMEDIATAS aplicadas v2028.37:**
1. Splits Ariel modo ON: piernas separadas por tren superior (NO consecutivas)
2. mainCount: 7 cuando modo Ariel (no 5)
3. Fibras color REMOVIDO del backlog
4. Renombrar "silla cuádriceps" → "sillón cuádriceps" en EX

---

## Hallazgos clave NUEVOS (no detectados en primera vuelta)

### 1 · Sistema de 3 fibras musculares por color (Holística Mujer)
⚠️ **DESCARTADO por feedback Ariel 2026-04-23** · "los colores no los entendió". Se documenta pero no se implementa.
Estructura que NEXUS no tiene:

| Color | Fibra | Reps | Objetivo | Descanso |
|---|---|---|---|---|
| 🟧 Ámbar | Fibra blanca | 6-12 | Fuerza/potencia | 90-120s |
| 🩵 Turquesa | Intermedia | 12-20 | Hipertrofia/mixta | 60-90s |
| 🔵 Azul | Fibra roja | 20-30 | Definición/resistencia | 30-45s |

**Las 3 se combinan EN EL MISMO día.** Ejemplo Lunes Pecho Holística:
- Press banca 4×8 (ámbar · 90s)
- Press inclinado mc 4×12 (turquesa · 75s)
- Aperturas polea 3×15 (turquesa · 60s)
- Máquina peck-deck 3×25 (azul · 45s)
- Fondos máquina 3×10 (ámbar · 75s)
- Press francés 4×12 (turquesa · 60s)
- Jalón tríceps 3×20 (azul · 45s)

**Implicación motor:** un día tiene 6-8 mains con reps/descansos heterogéneos, no homogéneos como hoy NEXUS hace.

### 2 · Estructura de 4 zonas por día (Holística + Azucena · sistema Anubis)
Cada día está dividido en:
- **PARA EMPEZAR · MOVILIDAD** (1-2 ejercicios warmup específico al grupo del día)
- **EJERCICIOS PRINCIPALES** (5-8 ejercicios fuertes)
- **COMPLEMENTARIOS** (1-2 ejercicios aislamiento o accesorios)
- **PARA CERRAR · ABDOMEN + ESTIRAMIENTO** (1-2 ejercicios cierre)

**Lo que NEXUS hace hoy:** solo "mains" (warmup/cooldown sacados en v2028.33).

**Lo que falta:** zonificación del día. Ariel quiere ver "ahora estás en el warmup · ahora en lo pesado · ahora cierre".

### 3 · Series progresivas / heterogéneas (Azucena)
NEXUS hoy genera "3×12-15" uniforme. Ariel usa:
- `Prensa 45° → 1×15 / 2×12 / 1×10` (4 series escaladas)
- `Glúteo en máquina → 25 / 20 / 15 / 10` (pirámide invertida)
- `Camilla femoral → 2 suaves + 4×12` (entrada en ritmo)
- `Silla cuádriceps → 2 suaves + 1 serie especial` (drop set)

**Implicación:** schema de "reps" debería poder ser un array o string con barras, no solo "12-15".

### 4 · Splits específicos por tipo de cliente

| Tipo cliente | Días | Estructura |
|---|---|---|
| Hombre tonificación (Pablo · post-op) | 4 | TS / Piernas / TS / Piernas (2 pierna + 2 tren) |
| Mujer tonificación (Rocío) | 5+1 | Pierna A / TS empuje / Pierna B / TS tracción / Pierna C / Sábado opcional |
| Mujer definición (Holística) | 6 | Pecho+Tri / Pierna #1 / Espalda+Bi / Pierna #2 / Hombro+Tri / Pierna #3 + Bi |
| Musculación pro (Cejas) | 6 | Femorales+Hombros / Pecho+Espalda / Cuad+Glúteo / Hombro+Brazos / Femorales / Glúteos |
| Adulto mayor (Azucena) | 5 | Piernas / Brazos+Pecho / Glúteos / Espalda / Equilibrio |

**Patrón común:** mujeres tonificación/definición → **3 días de pierna por semana**.

### 5 · Reglas para adultos mayores (Azucena)
- 0 barra libre · TODO máquinas
- "Sin punta de pie" (talón siempre apoyado)
- Hip thrust como único glúteo pesado
- Caminata como cierre (no cardio HIIT)
- Tono cálido: "tranquila · pedaleá · sin apuro"
- Descanso explícito 1-1:30 min entre series
- "Serie especial guiada por la profe" (señal de supervisión)

### 6 · "Anotador de progresión" (Holística)
12 ejercicios CLAVE donde el cliente trackea peso semana a semana:
- Press banca plano con barra · Remo con barra · Sentadilla con barra
- Press militar con mancuernas · Hip thrust · Peso muerto rumano con barra
- Sentadilla frontal con barra · Peso muerto sumo con barra · Hack squat
- Camilla femorales acostada · Curl con barra Z · Curl con mancuernas en banco inclinado

**Implicación:** estos son los "compound lifts" donde Ariel rastrea progreso. Deberían destacarse en el PDF.

### 7 · Cardio al cierre cada día pierna (Definición + Rocío)
Sistema canónico:
- Día de pierna → 30 min bicicleta/elíptica al final
- Día tren superior → 30 min elíptico ritmo constante

**Lo que NEXUS hace hoy:** cardio en día separado. **Lo que Ariel quiere:** cardio al cierre de día pierna.

## Patrones confirmados (ya implementados en v2028.36)

✅ Mancuernas + máquinas + polea > barra libre (boost máquinas + boost whitelist Ariel)
✅ Press de hombro con mancuernas SENTADO (no barra parado) → whitelist
✅ 3 días de pierna en split 5+ días → splits_ariel implementado
✅ Defaults por objetivo (hipertrofia 8-12 / definición 15-20 / rehab 3×15)
✅ Hip thrust como ejercicio canónico de glúteo
✅ Patada de glúteo en polea / abductores en máquina canónicos
✅ Bicicleta fija + elíptica + cinta como cardio real

## Backlog priorizado (próximas iteraciones)

### Alta prioridad
1. **Sistema de fibras color** · agregar campo `fibra` a EX y permitir mezclar ámbar/turquesa/azul en mismo día
2. **Zonificación del día** · render PDF en 4 zonas (movilidad / principales / complementarios / cierre)
3. **Series heterogéneas** · permitir "1×15 / 2×12 / 1×10" en lugar de "3×12-15" uniforme

### Media prioridad
4. **Cardio al cierre día pierna** · si día contiene Cuádriceps/Glúteos en modo Ariel, agregar 30 min cardio al final
5. **Whitelist por tipo cliente** · whitelist específica para adulto_mayor (Azucena) · mujer_definicion (Holística) · etc.
6. **Anotador de progresión** · marcar ejercicios "compound" en EX y destacar en PDF Anubis

### Backlog frío
7. **Feedback loop ediciones del coach** (3-4 hrs · auto-aprendizaje)
8. **Comparador A/B en UI** (rutina normal vs Ariel lado a lado)
9. **Procesar las 4 rutinas pendientes** (Septiembre · Plantilla 3 días · docx · xlsx · Nadia)

## Whitelist actualizada · ejercicios canónicos confirmados (≥3 de 6 rutinas)

### Glúteos (estrella de Ariel · aparece TODOS los días pierna)
- Hip thrust con barra ★★★★★★ (en TODAS las 6 rutinas)
- Patada de glúteo en máquina ★★★★ (Rocío, Definición, Pablo, Azucena)
- Patada de glúteo en polea ★★★ (Rocío, Definición, Holística)
- Abductores en máquina ★★★★★ (5 rutinas)
- Sentadilla búlgara con mancuernas ★★★★ (4 rutinas)
- Peso muerto rumano con mancuernas/barra ★★★★ (4 rutinas)
- Peso muerto sumo ★★★ (Definición, Cejas, Holística)
- Step-up con mancuernas ★★★ (Rocío, Cejas, Holística)

### Cuádriceps
- Prensa de piernas ★★★★★★ (TODAS las 6)
- Sillón de cuádriceps (extensión) ★★★★★ (5 rutinas)
- Hack squat / sentadilla en máquina inclinada ★★★★ (4 rutinas)
- Sentadilla búlgara ★★★★

### Isquios
- Curl femoral acostado ★★★★★★ (TODAS)
- Curl femoral sentado en máquina ★★★★

### Pecho
- Press inclinado con mancuernas ★★★★★ (Pablo, Rocío, Definición, Cejas, Holística)
- Aperturas con mancuernas banco plano ★★★★★
- Press plano con mancuernas ★★★★ (Pablo, Rocío, Cejas, Azucena)
- Aperturas en polea / máquina (peck-deck) ★★★ (Definición, Holística, Pablo)
- **Press de banca con BARRA** ★★★ (Pablo, Definición, Holística · pero solo 1 ej por día · NUNCA Day 1 con principiantes)

### Espalda
- Remo con mancuerna a una mano ★★★★★★ (TODAS)
- Jalón al pecho agarre ancho ★★★★★ (5 rutinas)
- Remo en máquina agarre neutro ★★★★★
- Pullover en polea ★★★ (Rocío, Cejas, Holística)
- Dominadas asistidas ★★★ (Rocío, Holística, Pablo)
- Remo con barra ★★★ (Cejas, Holística, Definición)

### Hombros
- **Press militar con mancuernas SENTADO** ★★★★★ (NO barra parado)
- Elevaciones laterales con mancuernas ★★★★★★ (TODAS)
- Pájaros / deltoides posterior ★★★★ (Rocío, Cejas, Definición, Holística)
- Elevaciones laterales en polea/cable ★★★ (Cejas, Definición, Holística)

### Brazos
- Curl con mancuernas alternado ★★★★
- Curl martillo con mancuernas ★★★★★
- Press francés con MANCUERNA ★★★★ (Pablo, Rocío, Holística, Cejas)
- Extensión de tríceps en polea con cuerda ★★★★★
- Curl predicador en máquina ★★★ (Holística)

### Core
- Plancha frontal ★★★★★ (TODAS menos Cejas que omite core)
- Crunch abdominal ★★★★★
- Dead bug ★★★ (Rocío, Holística, Azucena)
- Russian twist ★★★ (Rocío, Pablo, Holística)

### Cardio
- Bicicleta fija ★★★★★ (TODAS · Pablo, Rocío, Definición, Holística, Azucena)
- Elíptica ★★★★★
- Cinta caminata/trote ★★★

## Nuevos IDs a investigar / agregar al catálogo

- Máquina de aperturas peck-deck
- Fondos en máquina asistida
- Jalón de tríceps en polea (rope press)
- Patada de tríceps con mancuerna
- Pasos laterales con banda (Anubis)
- Glúteo en máquina (drop set 25/20/15/10)
- Aducción en máquina (es opuesto a abductores)
- Patada lateral en polea con tobillera

---

**Doctrina cerrada:** Ariel quiere rutinas que se parezcan a estas 6. El motor con MODO ARIEL ON debe priorizar estos ejercicios + estructura. Las próximas iteraciones añaden las features de los hallazgos clave (fibras color, zonas, series heterogéneas, cardio al cierre).
