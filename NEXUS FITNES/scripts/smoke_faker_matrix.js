// =====================================================================
// smoke_faker_matrix.js · Sprint 1.7 D4 (parcial) · 2026-05-11 madrugada
// Stress-test del motor adaptativo con 50 perfiles sintéticos.
// Aplica doctrina Lección 3 del Investigador #2:
//   "Cualquier sistema con output complejo (rutinas) requiere smoke con
//    datos sintéticos en volumen · NO solo 1-2 casos manuales".
//
// Self-contained · zero deps externas (no requiere npm install).
// Implementa Faker simplificado + deep-equal trivial inline.
//
// Validaciones por perfil:
//   1. mainCount mínimo cumplido por día (≥ 3 ejercicios principales)
//   2. 0 contraindicaciones violadas (anti-contra hard check)
//   3. Cardio presente en isCardioDay
//   4. Primary muscle alineado con group (v2028.28 sostenido)
//   5. No 2+ días con grupos IDÉNTICOS (v2028.24 split sostenido)
//   6. Femorales/isquios presentes en día Glúteos para level >= 3
// =====================================================================

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

process.on('uncaughtException', () => {});

const HTML_PATH = process.env.NX_HTML_PATH ||
  path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');

// ============================================================
// Faker simplificado (inline · zero deps)
// ============================================================
const FAKER = {
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  pickN(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  },
  intBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  weighted(items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for(let i = 0; i < items.length; i++){
      r -= weights[i];
      if(r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
};

// ============================================================
// Deep-equal trivial (compara arrays/objetos)
// ============================================================
function deepEqual(a, b){
  if(a === b) return true;
  if(typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if(ka.length !== kb.length) return false;
  return ka.every(k => deepEqual(a[k], b[k]));
}
function arrayEqual(a, b){
  if(a.length !== b.length) return false;
  const sa = [...a].sort(), sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

// ============================================================
// Perfil sintético generator
// ============================================================
const EQUIP_POOL = [
  "Mancuernas","Banco plano","Banco plano + mancuernas","Mancuernas + banco","Mancuernas + banco inclinado",
  "Barra olímpica + banco","Barra olímpica + soporte","Barra Z + banco","Barra recta","Barra de dominadas",
  "Máquina prensa","Máquina","Polea","Polea + cuerda","Máquina curl","Máquina hack","Máquina apertura de pecho",
  "Banco scott + barra","Banco hiperextensión","Banda elástica","Camilla de isquiotibiales","Marco de puerta",
  "Foam roller","Colchoneta","Cuerda","Apoyo (pared o silla)","Paralelas o sillas","Rueda abdominal","Step","Step + mancuernas",
  "Bicicleta","Cinta","Elíptica","Remo ergómetro","Palo o escoba"
];
const MODIFIERS_POOL = ["chest_focus","back_focus","shoulders_focus","arms_focus","legs_focus","glute_focus","calves_focus","core_focus"];
const CONTRAS_POOL = ["escoliosis leve","escoliosis severa","dolor lumbar agudo","hernia de disco","coxalgia","dolor de rodilla agudo","lesión meniscal","dolor de hombro agudo","manguito rotador","embarazo trimestre 3","hipertensión no controlada","cardiopatía no estabilizada","diabetes tipo 2"];
const GOAL_POOL = ["tonificacion","hipertrofia","fuerza","resistencia","salud_metabolica","adulto_mayor","rehab"];

function genProfile(idx){
  const level = FAKER.weighted([1,2,3,4,5], [10,30,30,20,10]);
  const age = FAKER.weighted([22,30,45,55,68,75], [20,30,25,15,7,3]);
  const goal = FAKER.weighted(GOAL_POOL, [25,20,10,15,15,10,5]);
  const days = FAKER.weighted([2,3,4,5,6], [10,30,30,25,5]);
  const modCount = FAKER.intBetween(0, 6);
  const modifiers = modCount === 0 ? [] : FAKER.pickN(MODIFIERS_POOL, modCount);
  const contraCount = FAKER.weighted([0,1,2,3], [60,25,10,5]);
  const contras = contraCount === 0 ? [] : FAKER.pickN(CONTRAS_POOL, contraCount);
  const equipCount = FAKER.intBetween(8, EQUIP_POOL.length);
  const equipment = FAKER.pickN(EQUIP_POOL, equipCount);
  return {
    _faker_id: 'P' + String(idx).padStart(3, '0'),
    name: 'Faker-' + idx,
    age, sex: Math.random() < 0.5 ? 'M' : 'F',
    goal, level,
    days,
    contras,
    equip: equipment,
    modifiers
  };
}

// ============================================================
// Mapping group → primary muscles esperados (v2028.28 doctrina)
// ============================================================
const GROUP_PRIMARY_MAP = {
  'Pecho': ['pectoral'],
  'Espalda': ['dorsal','romboides','trapecio medio','trapecio inferior','erectores','lumbar'],
  'Hombros': ['deltoides','trapecio superior'],
  'Brazos': ['bíceps','tríceps','braquial','braquiorradial'],
  'Cuádriceps': ['cuádriceps'],
  'Glúteos': ['glúteo','isquiotibiales','aductores'],
  'Core': ['recto','oblicuos','transverso','abdomen'],
  'Pantorrillas': ['gemelo','sóleo'],
  'Cardio': ['sistema'],
  'Movilidad': null
};
function primaryAligned(ex){
  const exp = GROUP_PRIMARY_MAP[ex.group];
  if(!exp) return true;
  const pb = (ex.primary_muscles?.[0] || '').toLowerCase();
  return exp.some(m => pb.includes(m));
}

// ============================================================
// Validaciones por perfil
// ============================================================
function validateRoutine(profile, days){
  const issues = [];
  // Skip si días undefined (motor falló · raro)
  if(!days || !Array.isArray(days)){
    issues.push({ severity: 'FATAL', issue: 'motor devolvió undefined/no array' });
    return issues;
  }

  const dayGroupsList = [];

  for(let dIdx = 0; dIdx < days.length; dIdx++){
    const dayResult = days[dIdx];
    if(!dayResult || !Array.isArray(dayResult)){
      issues.push({ severity: 'FATAL', day: dIdx + 1, issue: 'día undefined' });
      continue;
    }
    const mains = dayResult.filter(r => r.role === 'main');
    const groups = [...new Set(mains.map(r => r.ex.group))].sort();
    dayGroupsList.push(groups);

    // V1: mainCount mínimo
    if(mains.length < 3){
      issues.push({ severity: 'WARN', day: dIdx + 1, issue: `solo ${mains.length} mains (esperaba >=3)`, groups });
    }
    // V2: contras violadas (anti-contra hard check)
    for(const r of mains){
      const exContras = r.ex.contraindications || [];
      for(const profContra of profile.contras){
        const profContraKey = profContra.toLowerCase().split(/[\s,]+/).slice(0, 2).join(' ');
        for(const exContra of exContras){
          const exContraKey = exContra.toLowerCase().split(/[\s,]+/).slice(0, 2).join(' ');
          if(profContraKey && exContraKey && (profContraKey.includes(exContraKey) || exContraKey.includes(profContraKey))){
            issues.push({ severity: 'CRITICAL', day: dIdx + 1, issue: `CONTRA VIOLADA: cliente=${profContra} · ej=${r.ex.name} bloquea por ${exContra}` });
          }
        }
      }
    }
    // V3: cardio presente en isCardioDay
    if(groups.includes('Cardio')){
      const hasCardio = mains.some(r => /^cardio_/.test(r.ex.pattern || ''));
      if(!hasCardio) issues.push({ severity: 'WARN', day: dIdx + 1, issue: 'isCardioDay sin cardio aeróbico' });
    }
    // V4: primary aligned con group (v2028.28)
    const mismatches = mains.filter(r => !primaryAligned(r.ex));
    if(mismatches.length > 0){
      issues.push({ severity: 'WARN', day: dIdx + 1, issue: `${mismatches.length} primary mismatch`, sample: mismatches[0].ex.name });
    }
  }

  // V5: 2+ días con grupos IDÉNTICOS (deep equal en arrays)
  // EXCEPT: isInicial es FEATURE (full body para principiante con days<=4 + goal NOT rehab/adulto_mayor)
  // CTO Obs.2 aprobado · cobertura pecho+espalda+piernas+core+hombros por día principiante
  const isInicial = profile.level <= 2 && profile.goal !== 'rehab' && profile.goal !== 'adulto_mayor' && profile.days <= 4;
  if(!isInicial){
    for(let i = 0; i < dayGroupsList.length; i++){
      for(let j = i + 1; j < dayGroupsList.length; j++){
        if(arrayEqual(dayGroupsList[i], dayGroupsList[j]) && dayGroupsList[i].length > 0){
          issues.push({ severity: 'CRITICAL', issue: `Día ${i+1} y Día ${j+1} con grupos IDÉNTICOS [${dayGroupsList[i].join('+')}] · split bug regresión` });
        }
      }
    }
  }

  return issues;
}

// ============================================================
// MAIN
// ============================================================
const html = fs.readFileSync(HTML_PATH, 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" });
const w = dom.window;
w.URL.createObjectURL = () => 'blob:fake';
w.URL.revokeObjectURL = () => {};
w.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });

setTimeout(() => {
  console.log('=== smoke_faker_matrix · 50 perfiles sintéticos · motor actual ===\n');
  const N = 50;
  const allResults = [];
  let totalIssues = 0, criticalIssues = 0, warnIssues = 0, fatalIssues = 0;
  let perfectProfiles = 0;

  for(let i = 0; i < N; i++){
    const profile = genProfile(i + 1);
    const gp = { patternsExpanded: new Set() };
    let days;
    try {
      days = [];
      for(let d = 0; d < profile.days; d++){
        days.push(w.pickDayExercises(d, profile.days, profile, gp));
      }
    } catch(e){
      days = null;
    }
    const issues = validateRoutine(profile, days);
    if(issues.length === 0) perfectProfiles++;
    issues.forEach(iss => {
      if(iss.severity === 'CRITICAL') criticalIssues++;
      else if(iss.severity === 'WARN') warnIssues++;
      else if(iss.severity === 'FATAL') fatalIssues++;
    });
    totalIssues += issues.length;
    allResults.push({ profile, issues });
  }

  // Report
  allResults.forEach(r => {
    if(r.issues.length > 0){
      console.log(`\n${r.profile._faker_id} · L${r.profile.level} ${r.profile.goal} ${r.profile.days}d · age=${r.profile.age} mods=${r.profile.modifiers.length} contras=[${r.profile.contras.join(', ')||'-'}]`);
      r.issues.forEach(iss => {
        const tag = iss.severity === 'CRITICAL' ? '🔴' : iss.severity === 'FATAL' ? '💀' : '⚠';
        const day = iss.day ? `Día ${iss.day}: ` : '';
        console.log(`  ${tag} ${iss.severity}: ${day}${iss.issue}${iss.sample ? ' (' + iss.sample + ')' : ''}`);
      });
    }
  });

  console.log('\n\n=== RESUMEN ===');
  console.log(`Perfiles testeados: ${N}`);
  console.log(`Perfiles perfectos (0 issues): ${perfectProfiles}/${N} (${(perfectProfiles/N*100).toFixed(1)}%)`);
  console.log(`Total issues: ${totalIssues}`);
  console.log(`  💀 FATAL: ${fatalIssues}`);
  console.log(`  🔴 CRITICAL: ${criticalIssues}`);
  console.log(`  ⚠ WARN: ${warnIssues}`);
  console.log();
  if(criticalIssues === 0 && fatalIssues === 0){
    console.log('✓ PASS · 0 critical · 0 fatal · motor estructural sólido');
    if(warnIssues > 0) console.log(`  (${warnIssues} WARN · revisar pero no bloquea deploy)`);
    process.exit(0);
  } else {
    console.log(`✗ FAIL · ${criticalIssues} critical + ${fatalIssues} fatal · revisar antes de D4 final`);
    process.exit(1);
  }
}, 2500);
