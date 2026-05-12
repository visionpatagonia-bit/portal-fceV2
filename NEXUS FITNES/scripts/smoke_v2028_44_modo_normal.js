// =====================================================================
// smoke_v2028_44_modo_normal.js · 2026-05-12 noche
// Valida split modo NORMAL (sin ariel=1) · template Pablo/Martín:
//   D1: Tren superior compuesto · 0 brazos
//   D2: Pierna + bíceps complemento (max 2) + cardio cierre
//   D3: Hombros + Brazos completo (mixto bi+tri)
//   D4: Pierna + bíceps complemento (max 2) + cardio cierre
// =====================================================================
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');
const html = fs.readFileSync(HTML, 'utf8');

// SIN ?ariel=1 → modo Normal
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/'
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
const groupOf = (it) => it.ex.group;

console.log('=== Smoke v2028.44 · Modo NORMAL (template Pablo/Martín) ===');
console.log('Ariel mode:', typeof win.isArielModeOn === 'function' ? win.isArielModeOn() : 'fn missing');

const profile = {
  name: 'M35_normal', sex: 'M', age: 35, level: 3, goal: 'hipertrofia',
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

console.log('\n--- 5 días (hombre hipertrofia · sin modo Ariel) ---');
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
  day.forEach(it => { grupos[groupOf(it)] = (grupos[groupOf(it)]||0)+1; });
  console.log(`\nDía ${d+1}: ${day.length} ej · ${Object.entries(grupos).map(([k,v]) => k+':'+v).join(' · ')} · BI:${bi.length} TRI:${tri.length} Cardio:${cardio.length}`);
  day.forEach(it => console.log(`    ${it.ex.name}`));
}

// === ASSERTS ===
console.log('\n--- Asserts ---');
const [d1, d2, d3, d4, d5] = dayResults;

// D1 · Tren superior compuesto · sin brazos
const d1Bi = d1.filter(it => isBiceps(it.ex)).length;
const d1Tri = d1.filter(it => isTriceps(it.ex)).length;
check(d1Bi === 0 && d1Tri === 0, `D1 (Tren superior compuesto) SIN brazos · bi=${d1Bi} tri=${d1Tri}`);
const d1Grupos = new Set(d1.map(it => it.ex.group));
check(d1Grupos.has('Pecho') && d1Grupos.has('Espalda') && d1Grupos.has('Hombros'),
      `D1 incluye Pecho + Espalda + Hombros · ${Array.from(d1Grupos).join(',')}`);

// D2 · Pierna + bíceps complemento (1-2) + cardio
const d2Bi = d2.filter(it => isBiceps(it.ex)).length;
const d2Tri = d2.filter(it => isTriceps(it.ex)).length;
const d2Cardio = d2.filter(it => isCardio(it.ex)).length;
const d2Pierna = d2.filter(it => ['Cuádriceps','Glúteos','Pantorrillas'].includes(it.ex.group)).length;
check(d2Pierna >= 2, `D2 tiene ≥2 ej de pierna · ${d2Pierna}`);
check(d2Bi >= 1 && d2Bi <= 2, `D2 tiene 1-2 bíceps complemento · ${d2Bi}`);
check(d2Tri === 0, `D2 NO tiene tríceps (queda para día arms) · ${d2Tri}`);
check(d2Cardio >= 1, `D2 tiene cardio al cierre · ${d2Cardio}`);

// D3 · Día arms específico (Hombros + Brazos · mixto bi+tri)
const d3Bi = d3.filter(it => isBiceps(it.ex)).length;
const d3Tri = d3.filter(it => isTriceps(it.ex)).length;
check(d3Bi >= 1 && d3Tri >= 1, `D3 (día arms) tiene bi+tri mixto · bi=${d3Bi} tri=${d3Tri}`);

// D4 · Idem D2
const d4Bi = d4.filter(it => isBiceps(it.ex)).length;
const d4Tri = d4.filter(it => isTriceps(it.ex)).length;
const d4Cardio = d4.filter(it => isCardio(it.ex)).length;
const d4Pierna = d4.filter(it => ['Cuádriceps','Glúteos','Pantorrillas'].includes(it.ex.group)).length;
check(d4Pierna >= 2, `D4 tiene ≥2 ej de pierna · ${d4Pierna}`);
check(d4Bi >= 1 && d4Bi <= 2, `D4 tiene 1-2 bíceps complemento · ${d4Bi}`);
check(d4Tri === 0, `D4 NO tiene tríceps · ${d4Tri}`);
check(d4Cardio >= 1, `D4 tiene cardio al cierre · ${d4Cardio}`);

// D5 · Cardio + Core
const d5Cardio = d5.filter(it => isCardio(it.ex)).length;
const d5Core = d5.filter(it => it.ex.group === 'Core').length;
check(d5Cardio >= 1, `D5 tiene cardio · ${d5Cardio}`);
check(d5Core >= 1, `D5 tiene core · ${d5Core}`);

// Semana total
const weekBi = dayResults.flat().filter(it => isBiceps(it.ex)).length;
const weekTri = dayResults.flat().filter(it => isTriceps(it.ex)).length;
console.log(`\nTOTAL semana: ${weekBi} bi · ${weekTri} tri`);
check(weekBi >= 3, `Semana tiene ≥3 bíceps (cobertura mínima) · ${weekBi}`);
check(weekTri >= 1, `Semana tiene ≥1 tríceps · ${weekTri}`);

console.log(`\n=== RESULTADO ===`);
console.log(`PASS: ${pass} · FAIL: ${fail}`);
if(failures.length){
  console.error('\nFailures:');
  failures.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log('✓ Modo Normal v2028.44 OK');
