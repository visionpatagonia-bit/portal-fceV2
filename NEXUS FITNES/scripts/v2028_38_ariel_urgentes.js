// =====================================================================
// v2028_38_ariel_urgentes.js · 2026-05-12 noche
// Aplicar URGENTES del backlog feedback_ariel_durable.md:
//   1. Aductores (Ariel pide 5x · todos extended_only con nombres EN)
//   2. Step-up (Ariel pide 2x · todos extended_only)
//   3. BUG nomenclatura: yuhonas dicen "Patada de tríceps" pero son
//      patada de GLÚTEO (yuhonas_Glute_Kickback, _One-Legged_Cable_Kickback)
//      Ariel los pide 8x como TOP-1 frecuencia.
//   4. yuhonas_Barbell_Hip_Thrust: agregar alias "Empuje de pelvis con barra"
// =====================================================================
const fs = require('fs');
const path = require('path');
const HTML_PATH = path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');
let html = fs.readFileSync(HTML_PATH, 'utf8');

const start = html.indexOf('const EX = [');
const offset = 'const EX = '.length;
let depth = 0, i = start + offset, end = -1;
for(; i < html.length; i++){
  const c = html[i];
  if(c === '[') depth++;
  else if(c === ']'){ depth--; if(depth === 0){ end = i+1; break; } }
}
const EX = JSON.parse(html.substring(start + offset, end));

// === FIX 1: ADUCTORES traducir + reactivar (Ariel pide 5x) ===
const ADUCTORES = {
  'yuhonas_Thigh_Adductor':         'Aductores en máquina',          // Máquina
  'yuhonas_Cable_Hip_Adduction':    'Aductores en polea',            // Polea
  'yuhonas_Band_Hip_Adductions':    'Aductores con banda',           // Banda
};
let aductoresReact = 0;
Object.entries(ADUCTORES).forEach(([id, name]) => {
  const e = EX.find(x => x.id === id);
  if(!e) return;
  e.name = name;
  e.extended_only = false;
  aductoresReact++;
  console.log(`  ✓ ${id} · "${name}" reactivado`);
});

// === FIX 2: STEP-UP traducir + reactivar (Ariel pide 2x) ===
const STEPUP = {
  'yuhonas_Dumbbell_Step_Ups':      'Step-up con mancuernas',
  'yuhonas_Barbell_Step_Ups':       'Step-up con barra',
};
let stepupReact = 0;
Object.entries(STEPUP).forEach(([id, name]) => {
  const e = EX.find(x => x.id === id);
  if(!e) return;
  e.name = name;
  e.extended_only = false;
  stepupReact++;
  console.log(`  ✓ ${id} · "${name}" reactivado`);
});

// === FIX 3: PATADA DE GLÚTEO · renombrar nomenclatura mal ===
// (Ariel pide 8x "Patada de glúteos en polea" · TOP-1 frecuencia)
// Los yuhonas tienen group=Glúteos pero name dice "Patada de tríceps" · BUG
const GLUTE_KICKBACK_FIX = {
  'yuhonas_Glute_Kickback':           'Patada de glúteo · kickback',
  'yuhonas_One-Legged_Cable_Kickback':'Patada de glúteo · en polea',
};
let kickbackFix = 0;
Object.entries(GLUTE_KICKBACK_FIX).forEach(([id, name]) => {
  const e = EX.find(x => x.id === id);
  if(!e) return;
  console.log(`  ✓ ${id} · "${e.name}" → "${name}"`);
  e.name = name;
  kickbackFix++;
});

// === FIX 4: Hip Thrust · alias Ariel ===
const ht = EX.find(x => x.id === 'yuhonas_Barbell_Hip_Thrust');
if(ht){
  console.log(`  ✓ ${ht.id} · "${ht.name}" → "Empuje de pelvis con barra (Hip Thrust)"`);
  ht.name = 'Empuje de pelvis con barra (Hip Thrust)';
}

console.log(`\nResumen:`);
console.log(`  Aductores reactivados: ${aductoresReact}/3`);
console.log(`  Step-up reactivados: ${stepupReact}/2`);
console.log(`  Kickback renombrados (bug): ${kickbackFix}/2`);
console.log(`  Hip Thrust alias: 1/1`);

// Reinyectar
const newJson = JSON.stringify(EX);
html = html.substring(0, start + offset) + newJson + html.substring(end);
fs.writeFileSync(HTML_PATH, html);
console.log('\n✓ HTML actualizado');
