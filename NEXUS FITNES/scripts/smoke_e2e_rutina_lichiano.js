// =====================================================================
// smoke_e2e_rutina_lichiano.js · v2028.33 · 2026-05-12 madrugada
// Ejecuta pickDayExercises REAL con jsdom · genera rutina completa
// para el perfil que reportó Ariel ("lichiano · 33a F · L3 · 6d ·
// tonificación · 10 modifiers · sin contras") y verifica:
//   - 0 mains con pattern=stretch/mobility/recovery
//   - 0 mains con sufijo (EN)
//   - 0 items con extended_only:true en NINGÚN slot (warmup/main/cooldown)
//   - cooldown sin (EN)
//   - warmup sin (EN)
// =====================================================================
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// v2028.33 · Paths portables Windows/Linux
const HTML_PATH = process.env.NX_HTML_PATH ||
  path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
const win = dom.window;

// Esperar a que cargue el script (síncrono)
let pass = 0, fail = 0;
function assert(cond, label, detail){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + (detail ? ' · ' + detail : '')); }
}

// Profile lichiano (del reporte de Juan)
const profile = {
  name: 'lichiano',
  age: 33,
  sex: 'F',
  goal: 'tonificacion',
  level: 3,
  days: 6,
  modifiers: ['chest_focus','back_focus','shoulders_focus','arms_focus','legs_focus','glute_focus','calves_focus','core_focus','fat_loss','low_impact'],
  contras: [],
  equip: ['Apoyo (pared o silla)','Banco hiperextensión','Banco plano','Banco plano + mancuernas','Banco scott + barra','Banda elástica','Barra + banco','Barra Z + banco','Barra de dominadas','Barra olímpica + banco','Barra olímpica + soporte','Barra recta','Bicicleta','Cinta','Colchoneta','Cuerda','Elíptica','Foam roller','Mancuernas','Mancuernas + banco','Mancuernas + banco inclinado','Mancuernas o barra','Marco de puerta','Máquina','Máquina curl','Máquina hack','Máquina prensa','Otro','Palo o escoba','Paralelas o sillas','Polea','Polea + cuerda','Remo ergómetro','Rueda abdominal','Step','Step + mancuernas']
};
const gp = { sets: 3, reps: '12-15', patternsExpanded: new Set() };

console.log('=== Smoke E2E rutina lichiano · v2028.33 ===\n');
console.log(`Perfil: ${profile.name} · ${profile.age}a ${profile.sex} · L${profile.level} · ${profile.days}d · ${profile.goal}`);
console.log(`Mods: ${profile.modifiers.join(', ')}\n`);

// Generar los 6 días
let allItems = [];
let allMains = [];
let allWarmups = [];
let allCooldowns = [];
let exec_error = null;

try {
  for(let dayIdx = 0; dayIdx < profile.days; dayIdx++){
    const dayResult = win.pickDayExercises(dayIdx, profile.days, profile, gp);
    if(!Array.isArray(dayResult)){ throw new Error(`Día ${dayIdx+1} no retorna array`); }
    console.log(`Día ${dayIdx+1}: ${dayResult.length} items`);
    dayResult.forEach(it => {
      const ex = it.ex || {};
      const tag = `[${it.role}] ${ex.id} · ${ex.name} · pat=${ex.pattern} · ext=${ex.extended_only}`;
      console.log('  ', tag);
      allItems.push({ day: dayIdx+1, role: it.role, ex });
      if(it.role === 'main') allMains.push(ex);
      if(it.role === 'warmup') allWarmups.push(ex);
      if(it.role === 'cooldown') allCooldowns.push(ex);
    });
  }
} catch(e){
  exec_error = e;
  console.error('\nEXEC ERROR:', e.message);
}

console.log('\n=== Asserts ===');
assert(!exec_error, 'pickDayExercises ejecuta sin error', exec_error ? exec_error.message : '');
assert(allMains.length > 0, `Mains generados (${allMains.length})`);

// === ASSERT 1: 0 mains con (EN) ===
const mainsEN = allMains.filter(e => {
  const n = e.name || '';
  return n.endsWith('(EN)') || /\s\(EN\)$/.test(n);
});
assert(mainsEN.length === 0, `Mains con sufijo (EN): 0`,
  mainsEN.length > 0 ? mainsEN.map(e => e.id).join(', ') : '');

// === ASSERT 2: 0 mains con pattern stretch/mobility/recovery/balance ===
const mainsStretch = allMains.filter(e => {
  return e.pattern === 'stretch' || e.pattern === 'mobility' || e.pattern === 'recovery' || e.pattern === 'balance';
});
assert(mainsStretch.length === 0, `Mains con pattern stretch/mobility/recovery/balance: 0`,
  mainsStretch.length > 0 ? mainsStretch.map(e => `${e.id} (pat=${e.pattern})`).join(', ') : '');

// === ASSERT 3: 0 mains con group=Movilidad ===
const mainsMov = allMains.filter(e => e.group === 'Movilidad');
assert(mainsMov.length === 0, `Mains con group=Movilidad: 0`,
  mainsMov.length > 0 ? mainsMov.map(e => e.id).join(', ') : '');

// === ASSERT 4: 0 items extended_only en cualquier slot ===
const extOnly = allItems.filter(it => it.ex.extended_only === true);
assert(extOnly.length === 0, `Items extended_only en rutina: 0`,
  extOnly.length > 0 ? extOnly.map(it => `[${it.role}]${it.ex.id}`).join(', ') : '');

// === ASSERT 5: 0 warmups con (EN) ===
const warmupsEN = allWarmups.filter(e => (e.name||'').endsWith('(EN)'));
assert(warmupsEN.length === 0, `Warmups con (EN): 0`);

// === ASSERT 6: 0 cooldowns con (EN) ===
const cooldownsEN = allCooldowns.filter(e => (e.name||'').endsWith('(EN)'));
assert(cooldownsEN.length === 0, `Cooldowns con (EN): 0`);

// === ASSERT 7 · v2028.33 (post-Ariel Carlos Maslaton): rutina CORE solamente.
// Ariel pidió: "rutina sea core de ejercicio y no incluya complementarios".
// Por lo tanto · 0 warmup y 0 cooldown en el flujo del día.
assert(allWarmups.length === 0, `Sin warmup en rutina (Ariel: rutina solo core)`, allWarmups.length > 0 ? allWarmups.map(e=>e.id).join(', ') : '');
assert(allCooldowns.length === 0, `Sin cooldown en rutina (Ariel: rutina solo core)`, allCooldowns.length > 0 ? allCooldowns.map(e=>e.id).join(', ') : '');

// === ASSERT 8 · v2028.34.1 (post-Carlos Maslaton): ningún día vacío.
// Juan reportó: "le puse que haga de lunes a sábado y no puso nada (sábado)"
// porque los splits día 5/6 dependían de warmup+cooldown. Reformados splits.
const mainsByDay = {};
allItems.forEach(it => {
  if(it.role === 'main'){ mainsByDay[it.day] = (mainsByDay[it.day] || 0) + 1; }
});
const emptyDays = [];
for(let d = 1; d <= profile.days; d++){
  if(!mainsByDay[d] || mainsByDay[d] === 0) emptyDays.push(d);
}
assert(emptyDays.length === 0, `Todos los ${profile.days} días con mains > 0`, emptyDays.length > 0 ? `Días vacíos: ${emptyDays.join(', ')}` : '');

// === ASSERT 8: foam_roller_cuadriceps NO aparece (Ariel lo bloqueó) ===
const hasFoamCuad = allItems.some(it => it.ex.id === 'foam_roller_cuadriceps');
assert(!hasFoamCuad, 'foam_roller_cuadriceps NO aparece (Ariel: "no en día pecho")');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
console.log(`Mains generados: ${allMains.length} · Warmups: ${allWarmups.length} · Cooldowns: ${allCooldowns.length}`);
process.exit(fail > 0 ? 1 : 0);
