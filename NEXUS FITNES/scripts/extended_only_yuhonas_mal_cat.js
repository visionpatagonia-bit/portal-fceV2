// =====================================================================
// extended_only_yuhonas_mal_cat.js · v2028.33 · 2026-05-12 noche
// Ariel reportó (rutina Carlos Maslaton) yuhonas mal categorizados que
// se cuelan como mains. Los marcamos extended_only:true (fuera del pool).
// El coach puede agregarlos manualmente vía búsqueda si los quiere.
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

// IDs problemáticos detectados en rutinas reales que Ariel rechazó
const BLOCK = [
  // Peso muerto en lugares raros · Ariel: "Peso muerto en espalda · no recomendado"
  'yuhonas_Deadlift_with_Bands',          // group=Espalda · Ariel NO quiere
  'yuhonas_One-Arm_Side_Deadlift',        // group=Cuádriceps · debería ser Espalda/Glúteos
  // Plyometric oculto como squat normal · no apto low_impact
  'yuhonas_Kneeling_Jump_Squat',          // group=Glúteos · es jump (HIIT)
  'yuhonas_Kneeling_Squat',               // group=Cuádriceps · name en inglés sin (EN)
  'yuhonas_Plyo_Kettlebell_Pushups',      // group=Pecho · es plyo (HIIT · no para tonificación)
  // Categorización claramente errónea
  'yuhonas_Bench_Press_with_Chains',      // group=Brazos · es press de banca (Pecho)
  // Stretches con group ≠ Movilidad (catálogo inconsistente)
  'yuhonas_Rear_Leg_Raises',              // group=Cuádriceps · pattern=stretch · NO es ejercicio principal
  'yuhonas_Split_Squats',                 // group=Glúteos · pattern=stretch · catálogo inconsistente
  'yuhonas_Front_Leg_Raises',             // group=Glúteos · pattern=stretch · idem
];

let marcados = 0;
const log = [];
BLOCK.forEach(id => {
  const e = EX.find(x => x.id === id);
  if(!e){ console.log('  -', id, 'NO existe'); return; }
  if(e.extended_only === true) return;
  e.extended_only = true;
  marcados++;
  log.push({ id, group: e.group, pattern: e.pattern, name: e.name });
});

console.log(`Marcados extended_only: ${marcados}/${BLOCK.length}`);
log.forEach(x => console.log(`  - ${x.id} · ${x.group}/${x.pattern} · "${x.name}"`));

const newJson = JSON.stringify(EX);
html = html.substring(0, start + offset) + newJson + html.substring(end);
fs.writeFileSync(HTML_PATH, html);
console.log('\n✓ HTML actualizado');
