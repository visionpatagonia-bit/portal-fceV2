# Sprint 1.5 · Mapping yuhonas/free-exercise-db → NEXUS schema

**Fecha:** 2026-05-09 noche (post Sprint 1 cierre · commit 262258a)
**Owner:** Claude (impl) · Juan (lead/aprobación)
**Estado:** Día 1 — mapping definido · pendiente validación shape con muestra

---

## 1. Source

- **Repo:** `yuhonas/free-exercise-db` (GitHub · MIT)
- **Bundle:** `dist/exercises.json` · 1 MB · 873 ejercicios
- **Imágenes:** 1746 archivos (2 por ej.) en `exercises/{id}/0.jpg`, `1.jpg`
- **CDN:** `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{path}`

---

## 2. Schema yuhonas (input)

```json
{
  "id": "string",                  // slug-like, e.g. "3_4_Sit-Up"
  "name": "string",                // EN, e.g. "3/4 Sit-Up"
  "force": "static|pull|push|null",
  "level": "beginner|intermediate|expert",
  "mechanic": "isolation|compound|null",
  "equipment": "body only|dumbbell|barbell|...|null",  // 12 enum
  "primaryMuscles": ["chest", ...],                     // 17 enum
  "secondaryMuscles": ["triceps", ...],
  "instructions": ["string1", "string2", ...],
  "category": "strength|stretching|plyometrics|cardio|powerlifting|olympic weightlifting|strongman",
  "images": ["3_4_Sit-Up/0.jpg", "3_4_Sit-Up/1.jpg"]
}
```

---

## 3. Schema NEXUS extended (output)

```json
{
  "id": "yuhonas_3_4_Sit-Up",      // namespace prefix evita colisión con catálogo viejo
  "origen": "yuhonas",              // discriminator para UI (filtro "incluir extendido")
  "nombre": "3/4 Sit-Up",           // EN original (siempre presente)
  "nombre_es": "Abdominal 3/4",     // ES si está en diccionario manual · null si no
  "nivel": "inicial",               // ES · enum estático
  "categoria": "fuerza",            // ES · enum estático
  "mecanica": "compuesto",          // ES · isolation→aislamiento, compound→compuesto
  "fuerza_tipo": "tracción",        // ES · pull→tracción, push→empuje, static→estático
  "equipamiento": "peso corporal",  // ES · enum estático
  "musculos_primarios": ["abdominales"],     // ES · enum estático (17 muscles)
  "musculos_secundarios": [],
  "instrucciones": [...],           // EN original · traducción lazy on-demand
  "instrucciones_es": null,         // null hasta primera traducción LLM · cache permanente
  "imagenes": [
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/3_4_Sit-Up/0.jpg",
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/3_4_Sit-Up/1.jpg"
  ],
  "_version": 1,                    // CRDT · compatible Sprint 1
  "_updated_at": 1715212800000,
  "_deleted": false
}
```

---

## 4. Tabla estática enums (ES)

### Level

| EN | ES |
|---|---|
| beginner | inicial |
| intermediate | intermedio |
| expert | avanzado |

### Category

| EN | ES |
|---|---|
| strength | fuerza |
| stretching | estiramiento |
| plyometrics | pliometría |
| cardio | cardio |
| powerlifting | powerlifting |
| olympic weightlifting | levantamiento olímpico |
| strongman | strongman |

### Mechanic

| EN | ES |
|---|---|
| compound | compuesto |
| isolation | aislamiento |
| null | (sin clasificar) |

### Force

| EN | ES |
|---|---|
| pull | tracción |
| push | empuje |
| static | estático |
| null | (sin clasificar) |

### Equipment (12 valores)

| EN | ES |
|---|---|
| body only | peso corporal |
| barbell | barra |
| dumbbell | mancuernas |
| machine | máquina |
| cable | cable/polea |
| bands | bandas |
| kettlebells | pesas rusas |
| medicine ball | balón medicinal |
| exercise ball | pelota suiza |
| foam roll | rollo de espuma |
| e-z curl bar | barra zeta |
| other | otro |
| null | (sin equipamiento) |

### Muscles (17 grupos)

| EN | ES |
|---|---|
| abdominals | abdominales |
| abductors | abductores |
| adductors | aductores |
| biceps | bíceps |
| calves | gemelos |
| chest | pecho |
| forearms | antebrazos |
| glutes | glúteos |
| hamstrings | isquiotibiales |
| lats | dorsales |
| lower back | lumbares |
| middle back | espalda media |
| neck | cuello |
| quadriceps | cuádriceps |
| shoulders | hombros |
| traps | trapecios |
| triceps | tríceps |

---

## 5. Diccionario nombres (ES) — manual

Cubre ~80-100 ejercicios canónicos más usados en strength training. El resto queda con `nombre_es: null` y la UI muestra el nombre en inglés con sufijo `(EN)`.

| yuhonas id (EN) | nombre_es |
|---|---|
| Barbell_Squat | Sentadilla con barra |
| Dumbbell_Squat | Sentadilla con mancuernas |
| Goblet_Squat | Sentadilla goblet |
| Front_Squat | Sentadilla frontal |
| Hack_Squat | Sentadilla hack |
| Leg_Press | Prensa de piernas |
| Lunge | Zancada |
| Walking_Lunge | Zancada caminando |
| Bulgarian_Split_Squat | Búlgara |
| Romanian_Deadlift | Peso muerto rumano |
| Conventional_Deadlift | Peso muerto convencional |
| Sumo_Deadlift | Peso muerto sumo |
| Hip_Thrust | Empuje de cadera |
| Glute_Bridge | Puente de glúteos |
| Calf_Raise | Elevación de gemelos |
| Bench_Press | Press de banca |
| Incline_Bench_Press | Press inclinado |
| Decline_Bench_Press | Press declinado |
| Dumbbell_Bench_Press | Press plano con mancuernas |
| Push-Up | Flexión de brazos |
| Diamond_Push-Up | Flexión diamante |
| Wide_Grip_Push-Up | Flexión agarre amplio |
| Dips | Fondos |
| Cable_Fly | Aperturas en polea |
| Dumbbell_Fly | Aperturas con mancuernas |
| Pull-Up | Dominada |
| Chin-Up | Dominada supina |
| Lat_Pulldown | Jalón al pecho |
| Bent_Over_Row | Remo inclinado |
| Cable_Row | Remo en polea |
| T-Bar_Row | Remo en T |
| Dumbbell_Row | Remo con mancuerna |
| Face_Pull | Face pull |
| Shrug | Encogimiento de hombros |
| Overhead_Press | Press militar |
| Dumbbell_Shoulder_Press | Press de hombros con mancuernas |
| Arnold_Press | Press Arnold |
| Lateral_Raise | Elevaciones laterales |
| Front_Raise | Elevaciones frontales |
| Rear_Delt_Fly | Pájaros |
| Barbell_Curl | Curl con barra |
| Dumbbell_Curl | Curl con mancuernas |
| Hammer_Curl | Curl martillo |
| Preacher_Curl | Curl Scott/predicador |
| Concentration_Curl | Curl concentrado |
| Tricep_Pushdown | Extensión de tríceps en polea |
| Skull_Crusher | Press francés |
| Tricep_Kickback | Patada de tríceps |
| Overhead_Tricep_Extension | Extensión de tríceps por encima |
| Crunches | Abdominales |
| Sit-Up | Abdominal completo |
| 3_4_Sit-Up | Abdominal 3/4 |
| Plank | Plancha |
| Side_Plank | Plancha lateral |
| Russian_Twist | Russian twist |
| Leg_Raise | Elevación de piernas |
| Mountain_Climber | Escaladores |
| Burpee | Burpee |
| Jump_Squat | Sentadilla con salto |
| Box_Jump | Salto al cajón |
| Kettlebell_Swing | Swing con pesa rusa |
| Kettlebell_Goblet_Squat | Sentadilla goblet con pesa rusa |
| Farmer's_Walk | Caminata del granjero |
| Clean_and_Press | Cargada y press |
| Power_Clean | Cargada de potencia |
| Snatch | Arranque |
| Jerk | Envión |
| Good_Morning | Buenos días |
| Hyperextension | Hiperextensión |
| Reverse_Hyperextension | Hiperextensión inversa |
| Cable_Crunch | Abdominal en polea |
| Hanging_Leg_Raise | Elevación de piernas colgado |
| Pallof_Press | Pallof press |
| Wood_Chop | Leñador |
| Wall_Ball | Wall ball |
| Thruster | Thruster |
| Rowing | Remo (cardio) |
| Treadmill | Cinta |
| Elliptical | Elíptica |
| Stationary_Bike | Bicicleta fija |
| Stretching_Hamstring | Estiramiento isquios |
| Stretching_Quad | Estiramiento cuádriceps |
| Stretching_Calf | Estiramiento gemelos |
| Stretching_Chest | Estiramiento de pecho |
| Stretching_Lats | Estiramiento dorsales |
| Stretching_Hip_Flexor | Estiramiento flexor de cadera |
| Cat_Stretch | Postura del gato |
| Cobra_Stretch | Postura cobra |
| Childs_Pose | Postura del niño |
| Foam_Roll_IT_Band | Rollo cintilla IT |
| Foam_Roll_Quads | Rollo cuádriceps |

> **Nota:** los IDs reales en yuhonas tienen variantes (e.g. `Barbell_Squat`, `Dumbbell_Bench_Press`). El script `yuhonas_to_nexus.js` aplica fuzzy match (case-insensitive · normaliza guiones bajos) contra esta tabla. Las que no matchean → `nombre_es: null`.

---

## 6. Decisiones aplicadas

1. **Coexistencia con catálogo curado viejo** — toggle UI "Incluir catálogo extendido" · default OFF (preserva UX Ariel actual)
2. **Namespace ID `yuhonas_*`** — evita colisión con IDs viejos
3. **Hybrid translation:**
   - Enums (level/equipment/muscles/category/mechanic/force) → tabla estática ES
   - Nombres → diccionario manual ~85 entradas (cubre 30-40%)
   - Instructions → lazy LLM on-demand · cache permanente en Dexie
4. **Imágenes desde GitHub raw** — Service Worker cache stale-while-revalidate (Día 4)
5. **CRDT-ready** — campos `_version`, `_updated_at`, `_deleted` desde Día 1 (compatible Sprint 1)

---

## 7. Persistencia (Dexie)

```javascript
// Key: 'exercises_extended_v1'
// Value: { version: 1, generated_at: 1715212800000, exercises: [...873 entries] }

await window.NX_DEXIE.put('exercises_extended_v1', {
  version: 1,
  generated_at: Date.now(),
  exercises: nexusEntries
});

// Snapshot inspection F12:
// window.NX_DEXIE.snapshot().exercises_extended_v1.exercises.length === 873
```

Bundle JSON 1MB se sirve desde `deploy_qa/public/exercises_extended.json` con cache-control inmutable. Primera carga: fetch + persist en Dexie. Subsiguientes: read directo desde Dexie.

---

## 8. Próximos pasos

- **Día 1 (HOY)**: validar shape con muestra 10 ej · luego procesar los 873
- **Día 2**: fix H4 (PDF Vista Alumno) + H5 (espacio f-i/f-l) — independiente del catálogo
- **Día 3**: integrar UI buscador con filtros + Dexie persistence
- **Día 4**: SW cache imágenes + deploy + cierre
