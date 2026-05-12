// =====================================================================
// bloquear_pesos_muertos_exoticos.js · v2028.34.3 · 2026-05-12 noche
// Juan reportó (rutina MASLATON): aparece "Peso muerto" en grupo Espalda
// con técnica "Trabajo de dorsal · tirando con codos" · mismatch severo.
// Hay 15 yuhonas con name="Peso muerto" sin sufijo descriptivo.
// Bloqueamos los exóticos · mantenemos solo los que tienen nombre claro.
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

// Bloquear · yuhonas con name="Peso muerto" sin contexto + variantes exóticas
const BLOQUEAR = [
  // Espalda · Ariel: peso muerto NO en espalda
  'yuhonas_Axle_Deadlift',                 // "Peso muerto" sin sufijo · strongman
  'yuhonas_Barbell_Deadlift',              // "Peso muerto · con barra" · Ariel: NO en espalda
  'yuhonas_Deficit_Deadlift',              // "Peso muerto" · variante avanzada
  'yuhonas_Reverse_Band_Deadlift',         // "Peso muerto" · técnica especial
  // Cuádriceps · group mal cat (deadlift es hinge → Glúteos/Espalda)
  'yuhonas_Car_Deadlift',                  // "Peso muerto" · strongman
  'yuhonas_Cable_Deadlifts',               // "Peso muerto · en polea" · extraño
  'yuhonas_Leverage_Deadlift',             // "Peso muerto" · variante con máquina
  'yuhonas_Rickshaw_Deadlift',             // "Peso muerto" · strongman
  'yuhonas_Trap_Bar_Deadlift',             // "Peso muerto" · variante específica
  // Glúteos · variantes exóticas (olimpicas/nicho)
  'yuhonas_Clean_Deadlift',                // "Peso muerto" · olimpico
  'yuhonas_Snatch_Deadlift',               // "Peso muerto" · olimpico arranque
  'yuhonas_Kettlebell_One-Legged_Deadlift',// "Peso muerto · con pesa rusa" · unilateral avanzado
  'yuhonas_Sumo_Deadlift_with_Bands',      // variante con bandas · nicho
  'yuhonas_Romanian_Deadlift_from_Deficit',// variante avanzada redundante
];

// MANTENER (NO bloquear · nombres claros y categorización correcta):
//   - yuhonas_Romanian_Deadlift          → "Peso muerto rumano"
//   - yuhonas_Sumo_Deadlift              → "Peso muerto sumo"
//   - yuhonas_Stiff-Legged_Barbell_Deadlift   → "Peso muerto · con barra"
//   - yuhonas_Stiff-Legged_Dumbbell_Deadlift  → "Peso muerto · con mancuernas"
//   - yuhonas_Smith_Machine_Stiff-Legged_Deadlift → "Peso muerto · en máquina"
//   - yuhonas_Reverse_Band_Sumo_Deadlift  → "Peso muerto sumo"

let bloqueados = 0;
BLOQUEAR.forEach(id => {
  const e = EX.find(x => x.id === id);
  if(!e){ console.log('  -', id, 'NO existe'); return; }
  if(e.extended_only === true){ console.log('  -', id, 'ya bloqueado'); return; }
  e.extended_only = true;
  bloqueados++;
  console.log(`  ✓ ${id} · ${e.group}/${e.pattern} · "${e.name}"`);
});

console.log(`\nBloqueados: ${bloqueados}/${BLOQUEAR.length}`);

// Reinyectar
const newJson = JSON.stringify(EX);
html = html.substring(0, start + offset) + newJson + html.substring(end);
fs.writeFileSync(HTML_PATH, html);

// Verificación · pesos muertos restantes
const pesosMuertos = EX.filter(e => /peso muerto/i.test(e.name || '') && e.extended_only !== true);
console.log(`\nPeso muerto en pool (post-bloqueo): ${pesosMuertos.length}`);
pesosMuertos.forEach(e => console.log(`  - ${e.id} · ${e.group} · "${e.name}"`));
