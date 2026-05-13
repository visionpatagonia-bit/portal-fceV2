// =====================================================================
// smoke_v2028_45_modo_normal_fix.js · 2026-05-13 tarde
// Valida HOTFIX doctrinal v2028.45: D2 y D4 (días pierna modo Normal)
// NO deben tener brazos (ni bíceps ni tríceps). Cardio cierre se mantiene.
// D3 sigue con bi+tri mixto (día arms específico).
// =====================================================================
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');
const html = fs.readFileSync(HTML, 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/'   // sin ariel=1 → modo Normal
});
const win = dom.window;

const isBiceps = (e) => {
  const pm = ((e.primary_muscles||[])[0]||'').toLowerCase();
  return pm.includes('bíceps') || pm.includes('biceps') || pm.includes('braquial') || pm.includes('braquiorradial');
};
const isTriceps = (e) => {
  const pm = ((e.primary_muscles||[])[0]||'').toLowerCase();
  return pm.includes('tríceps') || pm.includes('triceps');
};
const isCardio = (e) => /^cardio_/.test(e.pattern || '');

console.log('=== Smoke v2028.45 · Modo NORMAL · hotfix doctrinal ===');
console.log('Ariel mode:', typeof win.isArielModeOn === 'function' ? win.isArielModeOn() : 'fn missing');
console.log('NX_MOTOR_VERSION esperado: v2028.45');

const profile = {
  name: 'M35_normal_v45', sex: 'M', age: 35, level: 3, goal: 'hipertrofia',
  equip: ['Mancuerna', 'Mancuernas', 'Barra', 'Máquina', 'Polea', 'Banda', 'Ninguno', 'Colchoneta',
          'Banco plano', 'Bicicleta', 'Elíptica', 'Cinta', 'Barra recta'],
  contras: [], modifiers: [],
};
const gp = { sets: 4, reps: '10-15', patternsExpanded: new Set() };

let pass = 0, fail = 0;
const failures = [];
function check(cond, msg){
  if(cond){ pass++; console.log('  ✓ ' + msg); }
  else { fail++; failures.push(msg); console.error('  ✗ ' + msg); }
}

console.log('\n--- 5 días (hombre hipertrofia · modo Normal v2028.45) ---');
const usedAcrossDays = new Set();
const dayResults = [];
for(let d = 0; d < 5; d++){
  const day = win.pickDayExercises(d, 5, profile, gp, usedAcrossDays);
  day.forEach(it => usedAcrossDays.add(it.ex.id));
  dayResults.push(day);
  const bi = day.filter(it => isBiceps(it.ex));
  const tri = day.filter(it => isTriceps(it.ex));
  const cardio = day.filter(it => isCardio(it.ex));
  const grupos = {};
  day.forEach(it => { grupos[it.ex.group] = (grupos[it.ex.group]||0)+1; });
  console.log(`\nDía ${d+1}: ${day.length} ej · ${Object.entries(grupos).map(([k,v]) => k+':'+v).join(' · ')} · BI:${bi.length} TRI:${tri.length} Cardio:${cardio.length}`);
  day.forEach(it => console.log(`    ${it.ex.name}`));
}

console.log('\n--- Asserts hotfix doctrinal ---');
const [d1, d2, d3, d4, d5] = dayResults;

// D1 · Tren superior compuesto · 0 brazos (sin cambios)
check(d1.filter(it => isBiceps(it.ex)).length === 0 && d1.filter(it => isTriceps(it.ex)).length === 0,
      `D1 (Tren superior compuesto) · 0 brazos`);
const d1Grupos = new Set(d1.map(it => it.ex.group));
check(d1Grupos.has('Pecho') && d1Grupos.has('Espalda') && d1Grupos.has('Hombros'),
      `D1 incluye Pecho + Espalda + Hombros`);

// D2 · Pierna A · 0 BRAZOS (cambio v2028.45) + cardio cierre
const d2Bi = d2.filter(it => isBiceps(it.ex)).length;
const d2Tri = d2.filter(it => isTriceps(it.ex)).length;
const d2Cardio = d2.filter(it => isCardio(it.ex)).length;
const d2Pierna = d2.filter(it => ['Cuádriceps','Glúteos','Pantorrillas'].includes(it.ex.group)).length;
check(d2Bi === 0, `D2 (Pierna A) · 0 bíceps · doctrina REAL Anubis [bi=${d2Bi}]`);
check(d2Tri === 0, `D2 (Pierna A) · 0 tríceps [tri=${d2Tri}]`);
check(d2Pierna >= 2, `D2 tiene ≥2 ej de pierna · ${d2Pierna}`);
check(d2Cardio >= 1, `D2 tiene cardio al cierre · ${d2Cardio}`);

// D3 · Día arms específico · bi+tri mixto (sin cambios)
const d3Bi = d3.filter(it => isBiceps(it.ex)).length;
const d3Tri = d3.filter(it => isTriceps(it.ex)).length;
check(d3Bi >= 1 && d3Tri >= 1, `D3 (día arms) · bi+tri mixto · bi=${d3Bi} tri=${d3Tri}`);

// D4 · Pierna B · 0 BRAZOS (cambio v2028.45) + cardio cierre
const d4Bi = d4.filter(it => isBiceps(it.ex)).length;
const d4Tri = d4.filter(it => isTriceps(it.ex)).length;
const d4Cardio = d4.filter(it => isCardio(it.ex)).length;
const d4Pierna = d4.filter(it => ['Cuádriceps','Glúteos','Pantorrillas'].includes(it.ex.group)).length;
check(d4Bi === 0, `D4 (Pierna B) · 0 bíceps · doctrina REAL Anubis [bi=${d4Bi}]`);
check(d4Tri === 0, `D4 (Pierna B) · 0 tríceps [tri=${d4Tri}]`);
check(d4Pierna >= 2, `D4 tiene ≥2 ej de pierna · ${d4Pierna}`);
check(d4Cardio >= 1, `D4 tiene cardio al cierre · ${d4Cardio}`);

// D5 · Cardio + Core (sin cambios)
const d5Cardio = d5.filter(it => isCardio(it.ex)).length;
const d5Core = d5.filter(it => it.ex.group === 'Core').length;
check(d5Cardio >= 1, `D5 tiene cardio · ${d5Cardio}`);
check(d5Core >= 1, `D5 tiene core · ${d5Core}`);

// Semana total · bi y tri SOLO en D3
const weekBi = dayResults.flat().filter(it => isBiceps(it.ex)).length;
const weekTri = dayResults.flat().filter(it => isTriceps(it.ex)).length;
console.log(`\nTOTAL semana: ${weekBi} bi · ${weekTri} tri`);
check(weekBi >= 1, `Semana tiene ≥1 bíceps · ${weekBi}`);
check(weekTri >= 1, `Semana tiene ≥1 tríceps · ${weekTri}`);
check(weekBi <= 4, `Semana NO sobre-mete bíceps (esperado 1-4 · solo D3) · ${weekBi}`);
check(weekTri <= 4, `Semana NO sobre-mete tríceps (esperado 1-4 · solo D3) · ${weekTri}`);

console.log(`\n=== RESULTADO ===`);
console.log(`PASS: ${pass} · FAIL: ${fail}`);
if(failures.length){
  console.error('\nFailures:');
  failures.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log('✓ Modo Normal v2028.45 OK · doctrina REAL Anubis aplicada');
console.log('  Días pierna: 0 brazos (corrección doctrinal vs v2028.44)');
console.log('  Día arms (D3): bi+tri mixto · único día con brazos');
console.log('  Cardio cierre día pierna: mantenido');
