// =====================================================================
// smoke_v2028_43_brazos_balance.js · 2026-05-12 noche
// Valida fix sub-balance bíceps/tríceps en días Brazos (modo Ariel ON)
// Esperado: cada día Brazos con ≥2 ej brazos tiene ≥1 bíceps Y ≥1 tríceps
// =====================================================================
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = process.env.NX_HTML_PATH ||
  path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');
const html = fs.readFileSync(HTML, 'utf8');

// Inject URL param ?ariel=1 via JSDOM URL
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/?ariel=1'
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

// Confirmar modo Ariel ON
console.log('=== Smoke v2028.43 · Brazos sub-balance ===');
if(typeof win.isArielModeOn === 'function'){
  console.log('isArielModeOn() =', win.isArielModeOn());
} else {
  console.error('✗ isArielModeOn no disponible');
  process.exit(1);
}

// Perfiles a testear (hombre normal · sin focus pierna · split balanced)
const perfiles = [
  { label: 'Hombre 35a · tonificación · 5d', profile: { name: 'M35', sex: 'M', age: 35, level: 3, goal: 'tonificacion',
    equip: ['Mancuerna', 'Mancuernas', 'Barra', 'Máquina', 'Polea', 'Banda', 'Ninguno', 'Colchoneta', 'Banco plano', 'Barra recta', 'Barra Z + banco', 'Banco scott + barra', 'Banco plano + mancuernas'],
    contras: [], modifiers: [], days: 5 } },
  { label: 'Hombre 28a · hipertrofia · 5d', profile: { name: 'M28', sex: 'M', age: 28, level: 4, goal: 'hipertrofia',
    equip: ['Mancuerna', 'Mancuernas', 'Barra', 'Máquina', 'Polea', 'Banda', 'Ninguno', 'Colchoneta', 'Banco plano', 'Barra recta', 'Barra Z + banco', 'Banco scott + barra'],
    contras: [], modifiers: [], days: 5 } },
  { label: 'Hombre 40a · tonificación · 6d', profile: { name: 'M40', sex: 'M', age: 40, level: 3, goal: 'tonificacion',
    equip: ['Mancuerna', 'Mancuernas', 'Barra', 'Máquina', 'Polea', 'Banda', 'Ninguno', 'Colchoneta', 'Banco plano', 'Barra recta', 'Barra Z + banco', 'Banco scott + barra'],
    contras: [], modifiers: [], days: 6 } },
];

let pass = 0, fail = 0;
const failures = [];

for(const { label, profile } of perfiles){
  console.log(`\n--- ${label} ---`);
  const gp = { sets: 4, reps: '10-15', patternsExpanded: new Set() };
  const usedAcrossDays = new Set();
  let weekBi = 0, weekTri = 0;
  const brazosDays = [];

  for(let d = 0; d < profile.days; d++){
    let day;
    try {
      day = win.pickDayExercises(d, profile.days, profile, gp, usedAcrossDays);
    } catch(e){
      console.error('  EXEC ERROR día', d+1, e.message);
      fail++; failures.push(`${label} d${d+1} ERROR: ${e.message}`);
      continue;
    }
    if(!Array.isArray(day)) continue;
    day.forEach(it => usedAcrossDays.add(it.ex.id));

    const bi = day.filter(it => isBiceps(it.ex));
    const tri = day.filter(it => isTriceps(it.ex));
    const totalBrazos = bi.length + tri.length;

    if(totalBrazos > 0){
      brazosDays.push({ d: d+1, bi: bi.length, tri: tri.length, biNames: bi.map(it=>it.ex.name), triNames: tri.map(it=>it.ex.name) });
      weekBi += bi.length;
      weekTri += tri.length;
    }
  }

  brazosDays.forEach(bd => {
    console.log(`  Día ${bd.d}: ${bd.bi} bi + ${bd.tri} tri`);
    if(bd.biNames.length) console.log(`    Bi: ${bd.biNames.join(' · ')}`);
    if(bd.triNames.length) console.log(`    Tri: ${bd.triNames.join(' · ')}`);
    const total = bd.bi + bd.tri;
    if(total >= 2 && (bd.bi === 0 || bd.tri === 0)){
      fail++;
      failures.push(`${label} d${bd.d} desbalanceado: ${bd.bi} bi vs ${bd.tri} tri`);
    } else {
      pass++;
    }
  });

  console.log(`  TOTAL semana: ${weekBi} bi · ${weekTri} tri`);
  const ratio = weekTri > 0 ? (weekBi / weekTri) : 999;
  console.log(`  Ratio bi:tri = ${ratio === 999 ? '∞' : ratio.toFixed(2)} (target 0.5–2.0)`);
  if(weekBi + weekTri > 0){
    if(ratio < 0.5 || ratio > 2.0){
      fail++;
      failures.push(`${label} ratio fuera de rango: ${ratio.toFixed(2)}`);
    } else {
      pass++;
    }
  }
}

console.log(`\n=== RESULTADO ===`);
console.log(`PASS: ${pass} · FAIL: ${fail}`);
if(failures.length){
  console.error('\nFailures:');
  failures.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log('✓ TODOS los perfiles balanceados');
