// =====================================================================
// smoke_pool_solo_con_foto.js · v2028.33 · 2026-05-11
// Valida la regla binaria pedida por Ariel:
//   "eliminar los 100 ejercicios previos · solo usar los de imágenes"
// Assert principal: NINGÚN ejercicio en pool sin foto matcheada.
// =====================================================================
const fs = require('fs');
const path = require('path');
// v2028.33 · Paths portables Windows/Linux
const HTML_PATH = process.env.NX_HTML_PATH ||
  path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');

const html = fs.readFileSync(HTML_PATH, 'utf8');
const start = html.indexOf('const EX = [');
const offset = 'const EX = '.length;
let depth = 0, i = start + offset, end = -1;
for(; i < html.length; i++){
  const c = html[i];
  if(c === '[') depth++;
  else if(c === ']'){ depth--; if(depth === 0){ end = i+1; break; } }
}
const EX = JSON.parse(html.substring(start + offset, end));

let pass = 0, fail = 0;
function assert(cond, label, detail){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + (detail ? ' · ' + detail : '')); }
}

console.log('=== Smoke pool solo-con-foto · v2028.33 ===\n');

// --- Pool del motor v2028.33 ---
// "Pool de MAINS" = items que pasan el filter line 5848-5853 de pickDayExercises:
//   extended_only !== true · group !== Movilidad · pattern NOT IN [stretch,mobility,recovery,balance]
// Los demás (warmup/cooldown elegibles) entran al filtro de warmup o cooldown.
const isWarmupCooldown = (e) => e.group === 'Movilidad' ||
  ['stretch','mobility','recovery','balance'].includes(e.pattern);
const poolMains = EX.filter(e => e.extended_only !== true && !isWarmupCooldown(e));
const poolWarmupCooldown = EX.filter(e => e.extended_only !== true && isWarmupCooldown(e));
const yuhonasPool = poolMains.filter(e => e.id.startsWith('yuhonas_'));
const curadosPool = poolMains.filter(e => !e.id.startsWith('yuhonas_'));

console.log(`Pool MAINS: ${poolMains.length} (yuhonas ${yuhonasPool.length} · curados ${curadosPool.length})`);
console.log(`Pool WARMUP/COOLDOWN: ${poolWarmupCooldown.length}\n`);

// --- ASSERT principal: cada item del pool MAINS tiene foto ---
const sinFoto = curadosPool.filter(e => !e.yuhonas_match || e.yuhonas_match === '');
assert(sinFoto.length === 0,
  `Pool MAINS sin foto: 0 (todos los curados en pool tienen yuhonas_match)`,
  sinFoto.length > 0 ? `Curados sin match: ${sinFoto.map(e => e.id).join(', ')}` : '');

// --- Cada yuhonas tiene yuhonas_thumb / imagen_thumb ---
const yuhonasSinThumb = yuhonasPool.filter(e => !e.yuhonas_thumb && !e.imagen_thumb);
assert(yuhonasSinThumb.length === 0,
  `Yuhonas en pool con imagen: ${yuhonasPool.length - yuhonasSinThumb.length}/${yuhonasPool.length}`,
  yuhonasSinThumb.length > 0 ? `Sin thumb: ${yuhonasSinThumb.slice(0,5).map(e => e.id).join(', ')}` : '');

// --- Validación re-matches Ariel: 9 curados específicos volvieron al pool con match correcto ---
const REMATCHES_ESPERADOS = [
  { id: 'vuelos_laterales',     match: 'yuhonas_Side_Lateral_Raise' },
  { id: 'vuelos_polea',         match: 'yuhonas_Cable_Seated_Lateral_Raise' },
  { id: 'elevacion_piernas',    match: 'yuhonas_Flat_Bench_Lying_Leg_Raise' },
  { id: 'encogimientos',        match: 'yuhonas_Dumbbell_Shrug' },
  { id: 'aperturas_mc',         match: 'yuhonas_Dumbbell_Flyes' },
  { id: 'jalon_polea',          match: 'yuhonas_Wide-Grip_Lat_Pulldown' },
  { id: 'sentadilla_sumo',      match: 'yuhonas_Sumo_Deadlift' },
  { id: 'hip_thrust',           match: 'yuhonas_Barbell_Hip_Thrust' },
  { id: 'puente_gluteo',        match: 'yuhonas_Barbell_Glute_Bridge' },
];
REMATCHES_ESPERADOS.forEach(rm => {
  const e = EX.find(x => x.id === rm.id);
  assert(e && e.yuhonas_match === rm.match && e.extended_only !== true,
    `Re-match ${rm.id} → ${rm.match} aplicado y activo en pool`,
    e ? `match=${e.yuhonas_match} · ext=${e.extended_only}` : 'NO EXISTE');
});

// --- Items específicos a SACAR definitivamente (extended_only:true) ---
const FUERA_POOL = ['foam_roller_cuadriceps', 'foam_roller_espalda', 'gato_camello',
  'dominadas_asistidas', 'remo_ergometro', 'aperturas_mc'  // Nota: aperturas_mc TIENE match ahora · debe estar en pool
];
// foam_roller_cuadriceps · único bloqueado totalmente (Ariel)
// foam_roller_espalda y gato_camello pueden volver como cooldown/warmup
// (pattern=recovery/mobility · NO entran a mains por filter v2028.33)
const TIENE_QUE_ESTAR_FUERA = ['foam_roller_cuadriceps'];
TIENE_QUE_ESTAR_FUERA.forEach(id => {
  const e = EX.find(x => x.id === id);
  assert(e && e.extended_only === true, `${id} fuera del pool TOTAL (extended_only:true)`,
    e ? `ext=${e.extended_only}` : 'NO EXISTE');
});

// gato_camello y foam_roller_espalda · fuera del pool MAINS pero OK como warmup/cooldown
const WARMUP_COOLDOWN_OK = ['gato_camello', 'foam_roller_espalda'];
WARMUP_COOLDOWN_OK.forEach(id => {
  const e = EX.find(x => x.id === id);
  assert(e && e.extended_only !== true && isWarmupCooldown(e),
    `${id} elegible como warmup/cooldown (no entra a mains por filter)`,
    e ? `ext=${e.extended_only} · group=${e.group} · pattern=${e.pattern}` : 'NO EXISTE');
});

// --- remo_ergometro fuera por requires_specific_equipment también ---
const remoErgo = EX.find(e => e.id === 'remo_ergometro');
assert(remoErgo && remoErgo.extended_only === true,
  'remo_ergometro fuera del pool (Ariel no tiene esa máquina)');

// --- Pool size razonable (≥ 300 ejercicios para variedad) ---
assert(poolMains.length >= 300, `Pool ≥ 300 ejercicios (${poolMains.length})`);

// --- Distribución por grupo (cada grupo tiene ≥ 5 ejercicios en pool) ---
const groups = {};
poolMains.forEach(e => {
  const g = e.group || 'unknown';
  groups[g] = (groups[g] || 0) + 1;
});
console.log('\nDistribución por grupo en pool:');
Object.entries(groups).sort((a,b) => b[1]-a[1]).forEach(([g,n]) => console.log(`  ${g}: ${n}`));

['Pecho', 'Espalda', 'Hombros', 'Brazos', 'Cuádriceps', 'Glúteos', 'Core', 'Cardio'].forEach(g => {
  assert((groups[g] || 0) >= 5, `Grupo ${g} ≥ 5 ejercicios en pool (${groups[g] || 0})`);
});

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
console.log(`Pool motor solo-con-foto: ${poolMains.length} ejercicios`);
process.exit(fail > 0 ? 1 : 0);
