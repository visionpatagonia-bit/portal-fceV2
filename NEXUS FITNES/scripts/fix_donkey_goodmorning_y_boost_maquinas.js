// =====================================================================
// fix_donkey_goodmorning_y_boost_maquinas.js · v2028.34.4 · 2026-05-12
// Juan reportó (rutina MASLATITA):
//   1. Foto absurda Donkey Calf Raises (mujer encima del hombre)
//   2. "Buenos días" en Espalda con técnica genérica de remo (hinge complejo)
//   3. Pocas máquinas en la rutina · Anubis tiene muchas
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

// FIX 1 + 2 · Bloquear donkey + good_mornings
const BLOQUEAR = [
  'yuhonas_Donkey_Calf_Raises',           // foto absurda · mujer encima del hombre · old-school
  // Good Mornings · son hinge (técnica de peso muerto · compleja · Ariel:
  // "peso muerto técnica compleja · no recomendado")
  'yuhonas_Band_Good_Morning',
  'yuhonas_Band_Good_Morning_Pull_Through',
  'yuhonas_Good_Morning',
  'yuhonas_Good_Morning_off_Pins',
  'yuhonas_Hanging_Bar_Good_Morning',
  'yuhonas_Seated_Good_Mornings',         // group=Espalda · Ariel: NO en espalda
  'yuhonas_Stiff_Leg_Barbell_Good_Morning', // group=Espalda
];

let bloqueados = 0;
BLOQUEAR.forEach(id => {
  const e = EX.find(x => x.id === id);
  if(!e) return;
  if(e.extended_only === true) return;
  e.extended_only = true;
  bloqueados++;
  console.log(`  bloqueado: ${id} · ${e.group}/${e.pattern} · "${e.name}"`);
});
console.log(`Bloqueados: ${bloqueados}/${BLOQUEAR.length}`);

const newJson = JSON.stringify(EX);
html = html.substring(0, start + offset) + newJson + html.substring(end);
fs.writeFileSync(HTML_PATH, html);
console.log('\n✓ HTML actualizado (catálogo)');
