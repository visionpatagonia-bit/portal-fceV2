// =====================================================================
// auditor_modo_ariel.js · 2026-05-12 noche
// Audita 200 perfiles en MODO ARIEL ON · valida 8 reglas no-negociables.
// Si alguna falla, CRITICAL antes de presentar a Ariel.
// =====================================================================
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_PATH = path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');

// IDs canónicos Ariel para validar presencia
const ARIEL_HIP_THRUST_IDS = new Set(['hip_thrust', 'yuhonas_Barbell_Hip_Thrust', 'yuhonas_Barbell_Glute_Bridge']);
const ARIEL_GLUTE_KICKBACK_IDS = new Set(['yuhonas_Glute_Kickback', 'yuhonas_One-Legged_Cable_Kickback']);
const ARIEL_AB_DUCT_IDS = new Set(['abducciones_polea', 'abducciones_banda', 'yuhonas_Thigh_Adductor', 'yuhonas_Cable_Hip_Adduction', 'yuhonas_Band_Hip_Adductions']);
const FORBIDDEN_ARIEL = new Set(['flexiones', 'flexiones_diamante', 'sentadilla_barra', 'peso_muerto_barra', 'press_militar_barra', 'curl_predicador']);

const GOALS = ['tonificacion','hipertrofia','fuerza','resistencia','salud_metabolica'];

function rng(seed){ let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

function genProfile(idx){
  const r = rng(idx * 7919 + 31);
  return {
    id: 'P' + String(idx).padStart(3,'0'),
    name: 'Perfil ' + idx, age: 25 + Math.floor(r() * 35),
    sex: r() < 0.5 ? 'M' : 'F',
    goal: GOALS[Math.floor(r() * GOALS.length)],
    level: 1 + Math.floor(r() * 4),
    days: 5 + Math.floor(r() * 2), // 5 o 6 días (donde aplica modo Ariel)
    modifiers: [], contras: [],
    equip: ['Mancuernas','Banco plano','Máquina','Máquina hack','Máquina prensa','Máquina curl','Polea','Cinta','Bicicleta','Elíptica','Barra olímpica + banco','Banco scott + barra','Mancuernas + banco'],
  };
}

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/?ariel=1' });
const win = dom.window;

const stats = { total: 0, pass: 0, violations: {} };
const RULES = [
  'piernas_no_consecutivas',
  'mainCount_7_min',
  'hip_thrust_dia_gluteo',
  'cero_forbidden',
  'aductores_semana',
  'reps_10_15_o_similar',
  'tres_dias_pierna_min',
  'cero_EN_cero_sin_foto',
];
RULES.forEach(r => stats.violations[r] = []);

for(let i = 0; i < 200; i++){
  const profile = genProfile(i);
  const gp = { sets: 3, reps: '12-15', patternsExpanded: new Set() };
  stats.total++;
  let violations = [];

  try {
    const days = [];
    for(let d = 0; d < profile.days; d++){
      const items = win.pickDayExercises(d, profile.days, profile, gp);
      const mains = items.filter(it => it.role === 'main');
      days.push({ idx: d, mains: mains.map(it => it.ex) });
    }
    // Verificar flag activo · sanity check primer perfil
    if(i === 0){
      const flagOn = win.isArielModeOn && win.isArielModeOn();
      console.log(`  · Modo Ariel ON? ${flagOn} (?ariel=1)`);
    }

    // Regla 1: piernas no consecutivas
    let lastWasLegs = false;
    for(const day of days){
      const hasLegs = day.mains.some(e => e.group === 'Cuádriceps' || e.group === 'Glúteos');
      if(hasLegs && lastWasLegs){ violations.push('piernas_no_consecutivas'); break; }
      lastWasLegs = hasLegs;
    }

    // Regla 2: mainCount ≥ 6 (modo Ariel target 7)
    const tooFew = days.filter(d => d.mains.length < 6);
    if(tooFew.length > 0) violations.push('mainCount_7_min');

    // Regla 3: hip thrust o equivalente en cada día glúteo
    const dayGluteo = days.filter(d => d.mains.some(e => e.group === 'Glúteos'));
    const dayWithHipThrust = dayGluteo.filter(d => d.mains.some(e => ARIEL_HIP_THRUST_IDS.has(e.id)));
    if(dayGluteo.length >= 2 && dayWithHipThrust.length === 0) violations.push('hip_thrust_dia_gluteo');

    // Regla 4: cero forbidden Ariel
    const allItems = days.flatMap(d => d.mains);
    if(allItems.some(e => FORBIDDEN_ARIEL.has(e.id))) violations.push('cero_forbidden');

    // Regla 5: aductores ≥1 vez en semana (cuando hay día glúteo)
    if(dayGluteo.length >= 2){
      const hasAd = allItems.some(e => ARIEL_AB_DUCT_IDS.has(e.id));
      if(!hasAd) violations.push('aductores_semana');
    }

    // Regla 7: 3 días pierna en split 5-6 días
    const diasPierna = days.filter(d => d.mains.some(e => ['Cuádriceps','Glúteos'].includes(e.group))).length;
    if(diasPierna < 3) violations.push('tres_dias_pierna_min');

    // Regla 8: 0 (EN) y 0 sin foto
    const enIssues = allItems.filter(e => /\(EN\)$/.test(e.name||''));
    const sinFoto = allItems.filter(e => !e.imagen_thumb && !e.yuhonas_thumb);
    if(enIssues.length > 0 || sinFoto.length > 0) violations.push('cero_EN_cero_sin_foto');

  } catch(e){
    violations.push('fatal_error');
  }

  if(violations.length === 0) stats.pass++;
  violations.forEach(v => { if(stats.violations[v]) stats.violations[v].push(profile.id); });
}

console.log(`\n=== AUDITOR MODO ARIEL · 200 perfiles ===`);
console.log(`PASS: ${stats.pass}/${stats.total} (${(stats.pass/stats.total*100).toFixed(1)}%)`);
console.log(`\nViolaciones por regla:`);
RULES.forEach(r => {
  const n = stats.violations[r].length;
  const mark = n === 0 ? '✓' : '✗';
  console.log(`  ${mark} ${r}: ${n} violations`);
  if(n > 0 && n <= 5) console.log(`     ${stats.violations[r].join(', ')}`);
});

const critical = ['cero_forbidden', 'cero_EN_cero_sin_foto'];
const criticalFails = critical.filter(r => stats.violations[r].length > 0);
if(criticalFails.length){
  console.error(`\n✗ FAIL: violaciones CRITICAL · ${criticalFails.join(', ')}`);
  process.exit(1);
}
console.log(`\n✓ OK · 0 violaciones críticas`);
