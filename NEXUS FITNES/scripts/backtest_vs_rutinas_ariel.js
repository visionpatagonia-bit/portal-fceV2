// =====================================================================
// backtest_vs_rutinas_ariel.js · 2026-05-12 noche
// Backtest cuantitativo · 8 rutinas históricas Ariel vs motor modo ON.
// Para cada rutina histórica:
//   1. Reconstruir perfil teórico (cliente, días, objetivo)
//   2. Simular generar con modo Ariel ON
//   3. Calcular % overlap entre ejercicios generados y los de Ariel
// Output: tabla de overlap · si >70% promedio → motor alineado con Ariel.
// =====================================================================
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_PATH = path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');
const RUTINAS_JSON = path.join(__dirname, '..', 'clientes', 'anubis', 'rutinas_ariel', 'rutinas_normalized.json');
const ARIEL_UNIQUE = path.join(__dirname, '..', 'clientes', 'anubis', 'rutinas_ariel', 'ariel_exercises_unique.json');

const html = fs.readFileSync(HTML_PATH, 'utf8');

// Perfiles teóricos · uno por rutina histórica
// Datos extraídos de rutinas_normalized.md (sesión 2026-05-03 análisis)
const PERFILES_BACKTEST = [
  { rutinaName: 'Jonathan (hombre)',           goal: 'hipertrofia',  level: 4, days: 6, sex: 'M', age: 30 },
  { rutinaName: 'Guia Enero 2025',             goal: 'tonificacion', level: 3, days: 5, sex: 'F', age: 32 },
  { rutinaName: 'Plantilla 3 días',            goal: 'tonificacion', level: 2, days: 3, sex: 'F', age: 28 },
  { rutinaName: 'Vale (mujer)',                goal: 'tonificacion', level: 3, days: 5, sex: 'F', age: 30 },
  { rutinaName: 'Tren inferior bikini',        goal: 'hipertrofia',  level: 4, days: 6, sex: 'F', age: 28 },
  { rutinaName: 'BIkini Julio 2025',           goal: 'hipertrofia',  level: 4, days: 6, sex: 'F', age: 26 },
  { rutinaName: 'Rutinas Mayo (Cejas)',        goal: 'hipertrofia',  level: 4, days: 6, sex: 'M', age: 28 },
  { rutinaName: 'Septiembre',                  goal: 'hipertrofia',  level: 4, days: 6, sex: 'M', age: 28 },
];

const EQUIP_FULL = ['Mancuernas','Banco plano','Máquina','Máquina hack','Máquina prensa','Máquina curl','Polea','Polea + cuerda','Cinta','Bicicleta','Elíptica','Barra olímpica + banco','Banco scott + barra','Mancuernas + banco','Mancuernas + banco inclinado','Barra Z + banco','Banda elástica','Banco hiperextensión','Colchoneta','Barra de dominadas','Step','Step + mancuernas','Foam roller','Apoyo (pared o silla)'];

// Top 50 ejercicios canónicos Ariel (frecuencia)
let arielTop = [];
try {
  arielTop = JSON.parse(fs.readFileSync(ARIEL_UNIQUE, 'utf8')).slice(0, 50);
} catch(e){
  console.error('No pude leer ariel_exercises_unique.json:', e.message);
  process.exit(1);
}

// Normalización · matching por keyword
function normalize(s){
  return (s||'').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Tokens del ejercicio Ariel para buscar en EX generado
const ARIEL_TOKENS = arielTop.map(e => ({
  name: e.name,
  freq: e.freq,
  tokens: new Set(normalize(e.name).split(' ').filter(t => t.length >= 4)),
}));

function matchAriel(exGenerado, arielSet){
  const txt = normalize((exGenerado.name||'') + ' ' + (exGenerado.id||''));
  const tokens = new Set(txt.split(' ').filter(t => t.length >= 4));
  // Conteo de intersección
  let bestMatch = null;
  let bestScore = 0;
  for(const a of arielSet){
    if(a.tokens.size === 0) continue;
    let inter = 0;
    for(const t of a.tokens) if(tokens.has(t)) inter++;
    const score = inter / a.tokens.size;
    if(score > bestScore){ bestScore = score; bestMatch = a; }
  }
  return bestScore >= 0.5 ? bestMatch : null;
}

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/?ariel=1' });
const win = dom.window;

console.log('\n=== BACKTEST · rutinas Ariel reales vs motor modo ON ===\n');
console.log('Tabla: % de ejercicios generados que matchean canónicos Ariel\n');
console.log('Perfil teórico                          | Mains | Match Ariel | %');
console.log('----------------------------------------+-------+-------------+-----');

let totalMatches = 0, totalMains = 0;
for(const perfil of PERFILES_BACKTEST){
  const profile = {
    name: perfil.rutinaName, age: perfil.age, sex: perfil.sex,
    goal: perfil.goal, level: perfil.level, days: perfil.days,
    modifiers: [], contras: [], equip: EQUIP_FULL,
  };
  const gp = { sets: 3, reps: '12-15', patternsExpanded: new Set() };
  const mains = [];
  for(let d = 0; d < profile.days; d++){
    const items = win.pickDayExercises(d, profile.days, profile, gp);
    items.filter(it => it.role === 'main').forEach(it => mains.push(it.ex));
  }
  let matches = 0;
  for(const ex of mains) if(matchAriel(ex, ARIEL_TOKENS)) matches++;
  totalMatches += matches;
  totalMains += mains.length;
  const pct = mains.length ? (matches/mains.length*100).toFixed(0) : '0';
  console.log(`${perfil.rutinaName.padEnd(40)}| ${String(mains.length).padStart(5)} | ${String(matches).padStart(11)} | ${pct.padStart(3)}%`);
}
const overallPct = (totalMatches/totalMains*100).toFixed(1);
console.log('----------------------------------------+-------+-------------+-----');
console.log(`TOTAL                                   | ${String(totalMains).padStart(5)} | ${String(totalMatches).padStart(11)} | ${overallPct.padStart(3)}%`);

console.log('\nVeredicto:');
if(overallPct >= 70) console.log('  ✓ ESTAMOS BIEN · ≥70% overlap promedio · motor alineado con estilo Ariel');
else if(overallPct >= 50) console.log('  ⚠ MEJORABLE · 50-70% · motor en el camino pero hay gap');
else console.log('  ✗ INSUFICIENTE · <50% · motor todavía se aparta de Ariel · revisar whitelist');
