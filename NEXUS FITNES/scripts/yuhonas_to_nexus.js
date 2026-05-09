// =====================================================================
// yuhonas_to_nexus.js
// Sprint 1.5 Día 1 · Mapping yuhonas/free-exercise-db → NEXUS schema
//
// Input:  ../../free-exercise-db/dist/exercises.json (873 entries EN)
// Output: ../deploy_qa/public/exercises_extended.json (873 entries · NEXUS schema · ES enums)
//
// Uso:
//   node yuhonas_to_nexus.js              -> procesa los 873 al deploy_qa/public/
//   node yuhonas_to_nexus.js --sample 10  -> imprime 10 entries mapeadas (validación shape)
// =====================================================================

const fs = require('fs');
const path = require('path');

// -------- ENUMS estáticos (yuhonas EN → NEXUS ES) --------

const LEVEL = {
  beginner: 'inicial',
  intermediate: 'intermedio',
  expert: 'avanzado',
};

const CATEGORY = {
  strength: 'fuerza',
  stretching: 'estiramiento',
  plyometrics: 'pliometría',
  cardio: 'cardio',
  powerlifting: 'powerlifting',
  'olympic weightlifting': 'levantamiento olímpico',
  strongman: 'strongman',
};

const MECHANIC = {
  compound: 'compuesto',
  isolation: 'aislamiento',
};

const FORCE = {
  pull: 'tracción',
  push: 'empuje',
  static: 'estático',
};

const EQUIPMENT = {
  'body only': 'peso corporal',
  barbell: 'barra',
  dumbbell: 'mancuernas',
  machine: 'máquina',
  cable: 'cable/polea',
  bands: 'bandas',
  kettlebells: 'pesas rusas',
  'medicine ball': 'balón medicinal',
  'exercise ball': 'pelota suiza',
  'foam roll': 'rollo de espuma',
  'e-z curl bar': 'barra zeta',
  other: 'otro',
};

const MUSCLES = {
  abdominals: 'abdominales',
  abductors: 'abductores',
  adductors: 'aductores',
  biceps: 'bíceps',
  calves: 'gemelos',
  chest: 'pecho',
  forearms: 'antebrazos',
  glutes: 'glúteos',
  hamstrings: 'isquiotibiales',
  lats: 'dorsales',
  'lower back': 'lumbares',
  'middle back': 'espalda media',
  neck: 'cuello',
  quadriceps: 'cuádriceps',
  shoulders: 'hombros',
  traps: 'trapecios',
  triceps: 'tríceps',
};

// -------- DICCIONARIO de nombres ES (manual · ~85 ejercicios canónicos) --------
// Match es por keyword principal contenida en yuhonas id (case-insensitive · normalizado)
// Reglas: si el id contiene la KEY exacta separada por guion bajo o al inicio/fin, matchea.

const NAME_DICT = [
  // Squats
  { match: 'barbell_squat', es: 'Sentadilla con barra' },
  { match: 'dumbbell_squat', es: 'Sentadilla con mancuernas' },
  { match: 'goblet_squat', es: 'Sentadilla goblet' },
  { match: 'front_squat', es: 'Sentadilla frontal' },
  { match: 'hack_squat', es: 'Sentadilla hack' },
  { match: 'split_squat', es: 'Búlgara/Split squat' },
  { match: 'jump_squat', es: 'Sentadilla con salto' },
  { match: 'overhead_squat', es: 'Sentadilla por encima' },
  // Lunges
  { match: 'lunge', es: 'Zancada' },
  { match: 'walking_lunge', es: 'Zancada caminando' },
  // Hinges
  { match: 'romanian_deadlift', es: 'Peso muerto rumano' },
  { match: 'sumo_deadlift', es: 'Peso muerto sumo' },
  { match: 'deadlift', es: 'Peso muerto' },
  { match: 'good_morning', es: 'Buenos días (good morning)' },
  { match: 'hip_thrust', es: 'Empuje de cadera' },
  { match: 'glute_bridge', es: 'Puente de glúteos' },
  { match: 'hyperextension', es: 'Hiperextensión' },
  // Press
  { match: 'bench_press', es: 'Press de banca' },
  { match: 'incline_bench', es: 'Press inclinado' },
  { match: 'decline_bench', es: 'Press declinado' },
  { match: 'overhead_press', es: 'Press militar' },
  { match: 'arnold_press', es: 'Press Arnold' },
  { match: 'shoulder_press', es: 'Press de hombros' },
  { match: 'push_press', es: 'Push press' },
  // Push-ups y fondos
  { match: 'push-up', es: 'Flexión de brazos' },
  { match: 'pushup', es: 'Flexión de brazos' },
  { match: 'diamond_push', es: 'Flexión diamante' },
  { match: 'wide_push', es: 'Flexión agarre amplio' },
  { match: 'dips', es: 'Fondos' },
  // Aperturas
  { match: 'cable_fly', es: 'Aperturas en polea' },
  { match: 'dumbbell_fly', es: 'Aperturas con mancuernas' },
  { match: 'pec_deck', es: 'Pec deck' },
  // Pull
  { match: 'pull-up', es: 'Dominada' },
  { match: 'pullup', es: 'Dominada' },
  { match: 'chin-up', es: 'Dominada supina' },
  { match: 'chinup', es: 'Dominada supina' },
  { match: 'lat_pulldown', es: 'Jalón al pecho' },
  { match: 'pulldown', es: 'Jalón' },
  // Rows
  { match: 'bent-over_row', es: 'Remo inclinado' },
  { match: 'bent_over_row', es: 'Remo inclinado' },
  { match: 'cable_row', es: 'Remo en polea' },
  { match: 't-bar_row', es: 'Remo en T' },
  { match: 'dumbbell_row', es: 'Remo con mancuerna' },
  { match: 'face_pull', es: 'Face pull' },
  { match: 'shrug', es: 'Encogimiento de hombros' },
  // Hombros
  { match: 'lateral_raise', es: 'Elevaciones laterales' },
  { match: 'front_raise', es: 'Elevaciones frontales' },
  { match: 'rear_delt', es: 'Deltoide posterior (pájaros)' },
  { match: 'reverse_fly', es: 'Pájaros (reverse fly)' },
  // Bíceps
  { match: 'barbell_curl', es: 'Curl con barra' },
  { match: 'dumbbell_curl', es: 'Curl con mancuernas' },
  { match: 'hammer_curl', es: 'Curl martillo' },
  { match: 'preacher_curl', es: 'Curl Scott (predicador)' },
  { match: 'concentration_curl', es: 'Curl concentrado' },
  // Tríceps
  { match: 'tricep_pushdown', es: 'Extensión de tríceps en polea' },
  { match: 'pushdown', es: 'Pushdown' },
  { match: 'skull_crusher', es: 'Press francés (skull crusher)' },
  { match: 'kickback', es: 'Patada de tríceps' },
  { match: 'tricep_extension', es: 'Extensión de tríceps' },
  // Core
  { match: 'crunch', es: 'Abdominales' },
  { match: 'sit-up', es: 'Abdominal completo' },
  { match: 'situp', es: 'Abdominal completo' },
  { match: 'plank', es: 'Plancha' },
  { match: 'side_plank', es: 'Plancha lateral' },
  { match: 'russian_twist', es: 'Russian twist' },
  { match: 'leg_raise', es: 'Elevación de piernas' },
  { match: 'mountain_climber', es: 'Escaladores' },
  { match: 'pallof_press', es: 'Pallof press' },
  { match: 'wood_chop', es: 'Leñador (wood chop)' },
  { match: 'cable_crunch', es: 'Abdominal en polea' },
  // Glúteos / piernas
  { match: 'leg_press', es: 'Prensa de piernas' },
  { match: 'leg_extension', es: 'Extensión de cuádriceps' },
  { match: 'leg_curl', es: 'Curl femoral' },
  { match: 'calf_raise', es: 'Elevación de gemelos' },
  // Cardio / pliometría
  { match: 'burpee', es: 'Burpee' },
  { match: 'box_jump', es: 'Salto al cajón' },
  { match: 'kettlebell_swing', es: 'Swing con pesa rusa' },
  { match: 'wall_ball', es: 'Wall ball' },
  { match: 'thruster', es: 'Thruster' },
  { match: 'farmer', es: "Caminata del granjero" },
  // Olímpicos
  { match: 'clean_and_press', es: 'Cargada y press' },
  { match: 'power_clean', es: 'Cargada de potencia' },
  { match: 'snatch', es: 'Arranque' },
  { match: 'jerk', es: 'Envión' },
  { match: 'clean', es: 'Cargada' },
  // Estiramientos / movilidad
  { match: 'cobra', es: 'Postura cobra' },
  { match: 'cat_stretch', es: 'Postura del gato' },
  { match: 'child', es: 'Postura del niño' },
  { match: 'foam_roll', es: 'Foam roll (rolling)' },
  // Otros comunes
  { match: 'bicep_curl', es: 'Curl de bíceps' },
  { match: 'tricep_dip', es: 'Fondos de tríceps' },
];

function lookupName(yId) {
  const norm = yId.toLowerCase();
  // sort por longitud descendente · matches más específicos primero
  const sorted = NAME_DICT.slice().sort((a, b) => b.match.length - a.match.length);
  for (const entry of sorted) {
    if (norm.includes(entry.match)) return entry.es;
  }
  return null;
}

// -------- MAPPING principal --------

const CDN_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

function mapExercise(y, idx) {
  const now = Date.now();
  const muscles_pri = (y.primaryMuscles || []).map(m => MUSCLES[m] || m);
  const muscles_sec = (y.secondaryMuscles || []).map(m => MUSCLES[m] || m);
  return {
    id: 'yuhonas_' + y.id,
    origen: 'yuhonas',
    nombre: y.name,
    nombre_es: lookupName(y.id),
    nivel: LEVEL[y.level] || y.level,
    categoria: CATEGORY[y.category] || y.category,
    mecanica: y.mechanic ? (MECHANIC[y.mechanic] || y.mechanic) : null,
    fuerza_tipo: y.force ? (FORCE[y.force] || y.force) : null,
    equipamiento: y.equipment ? (EQUIPMENT[y.equipment] || y.equipment) : null,
    musculos_primarios: muscles_pri,
    musculos_secundarios: muscles_sec,
    instrucciones: y.instructions || [],
    instrucciones_es: null,
    imagenes: (y.images || []).map(img => CDN_BASE + img),
    _version: 1,
    _updated_at: now,
    _deleted: false,
  };
}

// -------- MAIN --------

function main() {
  const argv = process.argv.slice(2);
  const sampleIdx = argv.indexOf('--sample');
  const sampleN = sampleIdx >= 0 ? parseInt(argv[sampleIdx + 1] || '10', 10) : null;

  const inputPath = path.resolve(__dirname, '../../../../free-exercise-db/dist/exercises.json');
  const outputPath = path.resolve(__dirname, '../deploy_qa/public/exercises_extended.json');

  if (!fs.existsSync(inputPath)) {
    console.error('FATAL: input no existe ·', inputPath);
    console.error('Asegurate de tener clonado yuhonas/free-exercise-db en /sessions/dreamy-happy-shannon/');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`[INFO] Loaded ${raw.length} ejercicios desde yuhonas`);

  if (sampleN) {
    // Muestra estratificada: 3 sin diccionario · 7 con diccionario
    const withDict = raw.filter(e => lookupName(e.id) !== null).slice(0, 7);
    const withoutDict = raw.filter(e => lookupName(e.id) === null).slice(0, 3);
    const sample = [...withDict, ...withoutDict].slice(0, sampleN);
    const mapped = sample.map(mapExercise);
    console.log(JSON.stringify(mapped, null, 2));
    console.log(`\n[INFO] Sample: ${sample.length} mapped (${withDict.length} con dict ES · ${withoutDict.length} sin dict)`);
    return;
  }

  // Procesar los 873
  const mapped = raw.map(mapExercise);
  const withDict = mapped.filter(e => e.nombre_es !== null).length;
  const dictRatio = ((withDict / mapped.length) * 100).toFixed(1);

  const bundle = {
    version: 1,
    generated_at: Date.now(),
    source: 'yuhonas/free-exercise-db@main',
    total: mapped.length,
    es_dict_coverage: withDict,
    es_dict_coverage_pct: parseFloat(dictRatio),
    exercises: mapped,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(bundle, null, 0));

  const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`[OK] Output → ${outputPath}`);
  console.log(`[OK] ${mapped.length} ejercicios · ${withDict} con nombre_es (${dictRatio}%) · ${sizeKb} KB`);
}

main();
