// =====================================================================
// rematch_curados_pedidos_ariel.js · v2028.33 · 2026-05-11
// Ariel mencionó textualmente: "está bien PERO es de los viejos · hay
// que machear" para 6 curados puntuales. Los re-macheamos con yuhonas
// equivalentes (validados por primary_muscle) y los sacamos de
// extended_only para que vuelvan al pool con foto.
// =====================================================================

const fs = require('fs');
const HTML_PATH = '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';
let html = fs.readFileSync(HTML_PATH, 'utf8');

const startMark = 'const EX = [';
const start = html.indexOf(startMark);
let depth = 0, i = start + 'const EX = '.length, end = -1;
for(; i < html.length; i++){
  const c = html[i];
  if(c === '[') depth++;
  else if(c === ']'){ depth--; if(depth === 0){ end = i+1; break; } }
}
const EX = JSON.parse(html.substring(start + 'const EX = '.length, end));

// === Helper: buscar yuhonas por palabras clave en name/id ===
function findYuhonas(kwAny, kwAll = [], excludeKw = []){
  return EX.filter(e => {
    if(!e.id.startsWith('yuhonas_')) return false;
    const text = (e.id + ' ' + (e.name || '')).toLowerCase();
    const anyOk = kwAny.some(k => text.includes(k.toLowerCase()));
    if(!anyOk) return false;
    const allOk = kwAll.every(k => text.includes(k.toLowerCase()));
    if(!allOk) return false;
    const excOk = excludeKw.every(k => !text.includes(k.toLowerCase()));
    return excOk;
  });
}

// === Lista de re-matches solicitados por Ariel ===
// Cada entry: id curado, criterios de búsqueda yuhonas, validación primary_muscle esperada
const REMATCHES = [
  // "vuelos laterales · vuelos posteriores · está bien PERO es de los viejos · hay que machear"
  {
    curado: 'vuelos_laterales',
    busqueda: () => findYuhonas(['side lateral raise', 'dumbbell lateral raise'], [], ['front', 'rear', 'bent']),
    expectedMuscle: ['hombro', 'deltoid', 'shoulder']
  },
  {
    curado: 'vuelos_posteriores',
    busqueda: () => findYuhonas(['rear delt', 'bent over lateral', 'reverse fly', 'rear deltoid'], [], []),
    expectedMuscle: ['hombro', 'deltoid', 'shoulder']
  },
  // "rueda · elevación piernas acostado · está bien PERO son de los viejos · hay que machear"
  {
    curado: 'ab_wheel',
    busqueda: () => findYuhonas(['ab wheel', 'ab roller', 'wheel rollout'], [], []),
    expectedMuscle: ['abdomi', 'core']
  },
  {
    curado: 'elevacion_piernas',
    busqueda: () => findYuhonas(['leg raise', 'lying leg raise', 'lying knee raise'], [], ['standing', 'side']),
    expectedMuscle: ['abdomi', 'core']
  },
  // "Encogimientos" (shrug) implícito · Ariel dijo trapecio en hombro
  {
    curado: 'encogimientos',
    busqueda: () => findYuhonas(['dumbbell shrug', 'barbell shrug'], [], ['behind', 'upright']),
    expectedMuscle: ['trapec']
  },
  // "Aperturas con mancuernas BANCO PLANO" · fix mismatch declinado
  {
    curado: 'aperturas_mc',
    busqueda: () => {
      // Preferir flat / bench flyes sin "decline" ni "incline"
      const cand = findYuhonas(['dumbbell flyes', 'dumbbell fly'], [], ['decline', 'incline', 'cable']);
      return cand;
    },
    expectedMuscle: ['pectoral', 'pecho', 'chest']
  },
  // "Jalón al pecho prefiero barra recta NO cruzado"
  {
    curado: 'jalon_polea',
    busqueda: () => findYuhonas(['wide-grip lat pulldown', 'lat pulldown', 'wide grip lat pulldown'], [], ['close-grip', 'reverse', 'behind']),
    expectedMuscle: ['dorsal', 'lat', 'espalda', 'back']
  },
  // "Peso muerto sumo perfecto" · machear si no está
  {
    curado: 'sentadilla_sumo',
    busqueda: () => findYuhonas(['sumo squat', 'wide stance squat'], [], []),
    expectedMuscle: ['glute', 'glúteo', 'cuad', 'quad']
  },
  // "Puente glúteos OK pero tiene que machear con foto"
  {
    curado: 'puente_gluteo',
    busqueda: () => findYuhonas(['glute bridge', 'hip bridge', 'floor bridge'], [], []),
    expectedMuscle: ['glute', 'glúteo']
  },
  // "Hip thrust" aprobado · si tiene mejor match, asignar
  {
    curado: 'hip_thrust',
    busqueda: () => findYuhonas(['hip thrust', 'barbell hip thrust', 'glute thrust'], [], []),
    expectedMuscle: ['glute', 'glúteo']
  },
];

console.log('=== Re-matching curados aprobados por Ariel ===\n');
let aplicados = 0, fallidos = 0;
const log = [];

REMATCHES.forEach(rm => {
  const curado = EX.find(e => e.id === rm.curado);
  if(!curado){
    console.log(`✗ ${rm.curado}: NO existe en EX`);
    fallidos++;
    return;
  }
  const candidatos = rm.busqueda();
  if(candidatos.length === 0){
    console.log(`✗ ${rm.curado}: 0 candidatos yuhonas encontrados`);
    fallidos++;
    return;
  }
  // Primer candidato (más simple por preferencia)
  const match = candidatos[0];
  // Validar primary_muscle alineado (case-insensitive · substring)
  const matchPrim = (match.primary_muscles || []).join(' ').toLowerCase();
  const muscleOk = rm.expectedMuscle.some(m => matchPrim.includes(m.toLowerCase()));
  if(!muscleOk){
    console.log(`✗ ${rm.curado}: match "${match.id}" tiene primary=${JSON.stringify(match.primary_muscles)} no alineado con ${JSON.stringify(rm.expectedMuscle)}`);
    fallidos++;
    return;
  }
  // Aplicar match
  curado.yuhonas_match = match.id;
  curado.yuhonas_thumb = match.thumb || match.image || '';
  curado.extended_only = false; // Vuelve al pool con foto
  aplicados++;
  log.push({ curado: rm.curado, name: curado.name, match: match.id, matchName: match.name });
  console.log(`✓ ${rm.curado} → ${match.id} (${match.name})`);
  if(candidatos.length > 1){
    console.log(`    (otros candidatos: ${candidatos.slice(1, 4).map(c => c.id).join(', ')})`);
  }
});

console.log(`\n=== TOTAL aplicados: ${aplicados} · fallidos: ${fallidos} ===`);

// === Reinyectar ===
const newJson = JSON.stringify(EX);
html = html.substring(0, start + 'const EX = '.length) + newJson + html.substring(end);
fs.writeFileSync(HTML_PATH, html);
console.log('\n✓ HTML actualizado · rematches aplicados');

// === Resumen pool post-rematch ===
const yuhonas = EX.filter(e => e.id.startsWith('yuhonas_'));
const curados = EX.filter(e => !e.id.startsWith('yuhonas_'));
const yuhonasPool = yuhonas.filter(e => e.extended_only !== true);
const curadosPool = curados.filter(e => e.extended_only !== true);
console.log('\n=== Pool post-rematch ===');
console.log('Yuhonas pool:', yuhonasPool.length);
console.log('Curados pool:', curadosPool.length, '(antes: 29 + ' + aplicados + ' rematches)');
console.log('TOTAL pool motor:', yuhonasPool.length + curadosPool.length);
