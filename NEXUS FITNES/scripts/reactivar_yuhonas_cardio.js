// =====================================================================
// reactivar_yuhonas_cardio.js · v2028.33 · 2026-05-11
// El paso anterior dejó extended_only:true a TODOS los yuhonas
// (incluidos cardio). Reactivamos solo los cardio_liss y cardio_hiit
// que apliquen a las máquinas de Ariel (cinta, bici, elíptica, polea).
// El motor necesita cardio en el pool para días mixtos / cardio.
// =====================================================================
const fs = require('fs');
const HTML_PATH = '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';
let html = fs.readFileSync(HTML_PATH, 'utf8');

const startMark = 'const EX = [';
const start = html.indexOf(startMark);
const offset = 'const EX = '.length;
let depth = 0, i = start + offset, end = -1;
for(; i < html.length; i++){
  const c = html[i];
  if(c === '[') depth++;
  else if(c === ']'){ depth--; if(depth === 0){ end = i+1; break; } }
}
const EX = JSON.parse(html.substring(start + offset, end));

// Filtros de reactivación · cardio que SÍ tiene máquina Ariel
// Ariel: cintas, bicis fijas, elíptica, polea. NO ergómetro (lo dijo textualmente).
const KW_REACTIVAR = ['Treadmill', 'Bicycling', 'Recumbent_Bike', 'Elliptical_Trainer', 'Rope_Jumping', 'Stationary_Bike', 'Skating'];
const KW_EXCLUIR  = ['Rowing_Stationary', 'Prowler', 'Sled', 'Sprint', 'Skating'];  // remo ergómetro fuera + sprints/sled (Ariel no menciona)

let reactivados = 0, mantenidos = 0;
const cardiosReact = [];
EX.forEach(e => {
  if(!e.id.startsWith('yuhonas_')) return;
  const pattern = (e.pattern || '').toLowerCase();
  const esCardio = pattern.startsWith('cardio_');
  if(!esCardio) return;
  if(e.extended_only !== true) return; // ya activo

  const idStr = e.id;
  const excluir = KW_EXCLUIR.some(k => idStr.includes(k));
  if(excluir){ mantenidos++; return; }
  const reactivar = KW_REACTIVAR.some(k => idStr.includes(k));
  if(reactivar){
    e.extended_only = false;
    // Re-categorizar al grupo Cardio para que aparezca como cardio
    e.group = 'Cardio';
    reactivados++;
    cardiosReact.push(e.id);
  } else {
    mantenidos++;
  }
});

console.log(`Cardio yuhonas reactivados: ${reactivados}`);
cardiosReact.forEach(id => console.log('  -', id));
console.log(`Cardio yuhonas mantenidos fuera: ${mantenidos} (ergómetro · sprints · sled · etc)`);

// Reinyectar
const newJson = JSON.stringify(EX);
html = html.substring(0, start + offset) + newJson + html.substring(end);
fs.writeFileSync(HTML_PATH, html);
console.log('\n✓ HTML actualizado');

// Resumen pool
const pool = EX.filter(e => e.extended_only !== true);
const byGroup = {};
pool.forEach(e => { byGroup[e.group || '?'] = (byGroup[e.group || '?'] || 0) + 1; });
console.log('\nPool por grupo:');
Object.entries(byGroup).sort((a,b) => b[1]-a[1]).forEach(([g,n]) => console.log(`  ${g}: ${n}`));
console.log('\nTotal pool:', pool.length);
