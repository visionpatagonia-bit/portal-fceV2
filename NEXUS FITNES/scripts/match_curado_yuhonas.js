// =====================================================================
// match_curado_yuhonas.js · Sprint 1.6 D3 · v2 simplificado
// El bundle yuhonas YA viene en ES (nombre_es, equipamiento, musculos)
// Match directo ES↔ES sin necesidad de cognates EN.
// =====================================================================

const fs = require('fs');

const EX_PATH = process.env.NX_EX_PATH || '/tmp/EX_curado.json';
const YUHONAS_PATH = process.env.NX_YUHONAS_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/deploy_qa/public/exercises_extended.json';
const OUTPUT_PATH = process.env.NX_OUT_PATH || '/tmp/curado_yuhonas_matches.json';
const THRESHOLD = parseFloat(process.env.NX_THRESHOLD || '0.50');

// Cognates EN→ES para cuando yuhonas no tiene nombre_es (fallback)
const COGNATES_EN_ES = {
  'squat': 'sentadilla', 'squats': 'sentadilla',
  'deadlift': 'peso muerto', 'rdl': 'peso muerto rumano',
  'bench': 'banca', 'press': 'press',
  'incline': 'inclinado', 'decline': 'declinado',
  'pushup': 'flexion', 'push-up': 'flexion', 'pushups': 'flexion',
  'pullup': 'dominada', 'pull-up': 'dominada',
  'row': 'remo',
  'curl': 'curl', 'biceps': 'biceps',
  'triceps': 'triceps', 'extension': 'extension',
  'skullcrusher': 'frances',
  'stretch': 'estiramiento',
  'plank': 'plancha',
  'crunch': 'abdominales', 'crunches': 'abdominales', 'situp': 'abdominales',
  'bridge': 'puente', 'hip': 'cadera',
  'glute': 'gluteo', 'glutes': 'gluteo',
  'calf': 'gemelo', 'calves': 'gemelos',
  'shoulder': 'hombro', 'shoulders': 'hombro',
  'overhead': 'militar',
  'hammer': 'martillo',
  'lunge': 'zancada', 'lunges': 'zancada',
  'arnold': 'arnold',
  'face': 'face',
  'pulldown': 'jalon',
  'fly': 'apertura', 'flyes': 'apertura',
  'dip': 'fondo', 'dips': 'fondos',
  'leg press': 'prensa',
  'goblet': 'goblet',
  'romanian': 'rumano',
  'bulgarian': 'bulgara',
  'mobility': 'movilidad',
  'cardio': 'cardio',
  'burpee': 'burpee',
  'kettlebell': 'rusa',
  'swing': 'swing',
};

function normalize(s){
  return String(s||'')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(s){
  return normalize(s).split(' ').filter(t => t.length >= 2 && !STOPWORDS.has(t));
}

const STOPWORDS = new Set(['de','la','el','en','con','y','a','un','una','para','del','los','las','o','por','al']);

function translateEnToEs(tokens){
  return tokens.map(t => COGNATES_EN_ES[t] || t);
}

function jaccard(a, b){
  const sa = new Set(a), sb = new Set(b);
  let inter = 0;
  sa.forEach(x => { if(sb.has(x)) inter++; });
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

function scoreMatch(curado, yuhonas){
  // Curado nombre ES
  const cName = tokenize(curado.name);

  // Yuhonas: usar nombre_es si está, sino nombre EN translateado
  let yName;
  if(yuhonas.nombre_es){
    yName = tokenize(yuhonas.nombre_es);
  } else {
    yName = translateEnToEs(tokenize(yuhonas.nombre || ''));
  }

  const nameSim = jaccard(cName, yName);

  // Equipment: ambos ES
  const cEquip = normalize(curado.equipment);
  const yEquip = normalize(yuhonas.equipamiento || '');
  // Token-level overlap para equipment
  const cEquipTokens = cEquip.split(' ').filter(t => t.length >= 2);
  const yEquipTokens = yEquip.split(' ').filter(t => t.length >= 2);
  const equipOverlap = cEquipTokens.some(t => yEquipTokens.some(y => t.includes(y) || y.includes(t)));
  const equipSim = equipOverlap ? 1 : 0;

  // Músculo primario (ambos ES)
  const cMuscle = normalize((curado.primary_muscles||[])[0]||'').split(' ')[0]; // primera palabra
  const yMuscles = (yuhonas.musculos_primarios || []).map(m => normalize(m).split(' ')[0]);
  const muscleSim = cMuscle && yMuscles.includes(cMuscle) ? 1 : 0;

  const score = nameSim * 0.60 + equipSim * 0.20 + muscleSim * 0.20;
  return { score, nameSim, equipSim, muscleSim };
}

function main(){
  const EX = JSON.parse(fs.readFileSync(EX_PATH, 'utf8'));
  const bundle = JSON.parse(fs.readFileSync(YUHONAS_PATH, 'utf8'));
  const yuhonas = bundle.exercises;

  console.log(`[match v2] EX: ${EX.length} · yuhonas: ${yuhonas.length} · threshold: ${THRESHOLD}`);

  const matches = {};
  const noMatch = [];
  const stats = { high: 0, mid: 0, low: 0, none: 0 };

  EX.forEach(curado => {
    let best = null;
    let bestScore = 0;
    yuhonas.forEach(yu => {
      const r = scoreMatch(curado, yu);
      if(r.score > bestScore){
        bestScore = r.score;
        best = { yu, score: r.score, detail: r };
      }
    });

    if(best && best.score >= THRESHOLD){
      matches[curado.id] = {
        yuhonas_id: best.yu.id,
        yuhonas_name: best.yu.nombre_es || best.yu.nombre,
        score: Math.round(best.score * 100) / 100,
        curado_name: curado.name,
        detail: best.detail
      };
      if(best.score >= 0.75) stats.high++;
      else if(best.score >= 0.60) stats.mid++;
      else stats.low++;
    } else {
      noMatch.push({ id: curado.id, name: curado.name, best_score: best ? best.score.toFixed(2) : 'n/a', best_yu: best ? best.yu.id : null });
      stats.none++;
    }
  });

  console.log(`\n=== STATS ===`);
  console.log(`High (≥0.75): ${stats.high}`);
  console.log(`Mid (0.60-0.74): ${stats.mid}`);
  console.log(`Low (${THRESHOLD}-0.59): ${stats.low}`);
  console.log(`No match: ${stats.none}`);
  console.log(`Coverage: ${((EX.length - stats.none) / EX.length * 100).toFixed(1)}%`);

  const output = {
    threshold: THRESHOLD,
    total_curados: EX.length,
    total_matched: Object.keys(matches).length,
    coverage_pct: parseFloat(((EX.length - stats.none) / EX.length * 100).toFixed(1)),
    stats,
    matches,
    no_match: noMatch
  };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n[OK] Output → ${OUTPUT_PATH}`);

  // Print sample
  console.log(`\n=== Top 15 matches (score >= 0.65) ===`);
  Object.entries(matches)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 15)
    .forEach(([cid, m]) => {
      console.log(`  ${cid.padEnd(30)} → ${m.yuhonas_id.padEnd(45)} (${m.score})`);
    });

  console.log(`\n=== No match (sample 10) ===`);
  noMatch.slice(0, 10).forEach(nm => {
    console.log(`  ${nm.id.padEnd(30)} (best=${nm.best_score}) · "${nm.name}"`);
  });
}

main();
