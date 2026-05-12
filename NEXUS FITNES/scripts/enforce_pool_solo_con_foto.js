// =====================================================================
// enforce_pool_solo_con_foto.js · v2028.33 · 2026-05-11
// Pedido literal Ariel: "eliminar los 100 ejercicios previos solo usar
// los de imagenes"
// Regla binaria: si un curado Anubis NO tiene yuhonas_match (= sin foto),
// se marca extended_only:true · NO entra al pool del motor.
// Los curados con match validado mantienen su lugar.
// Doctrina: 0 LLM · 0 API · 0 gasto · cambio determinístico textual.
// =====================================================================

const fs = require('fs');
const HTML_PATH = '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let html = fs.readFileSync(HTML_PATH, 'utf8');

// === Localizar el bloque EX ===
const startMark = 'const EX = [';
const start = html.indexOf(startMark);
let depth = 0, i = start + 'const EX = '.length, end = -1;
for(; i < html.length; i++){
  const c = html[i];
  if(c === '[') depth++;
  else if(c === ']'){ depth--; if(depth === 0){ end = i+1; break; } }
}
const exJson = html.substring(start + 'const EX = '.length, end);
const EX = JSON.parse(exJson);
console.log('EX parseado · total:', EX.length);

// === Aplicar regla: curados sin match → extended_only:true ===
let marcados = 0;
const cambios = [];
EX.forEach(e => {
  const esCurado = !e.id.startsWith('yuhonas_');
  if(!esCurado) return;
  // ¿Tiene match válido?
  const tieneMatch = !!(e.yuhonas_match && typeof e.yuhonas_match === 'string' && e.yuhonas_match.length > 0);
  if(!tieneMatch){
    if(e.extended_only !== true){
      e.extended_only = true;
      marcados++;
      cambios.push({ id: e.id, name: e.name, group: e.group });
    }
  }
});

console.log('\nCurados marcados extended_only (fuera del pool):', marcados);
console.log('Ejemplos:');
cambios.slice(0, 25).forEach(c => console.log('  -', c.id, '·', c.name, '·', c.group));

// === Verificación post: nadie sin match queda en pool ===
const enPoolSinFoto = EX.filter(e => !e.id.startsWith('yuhonas_') && !e.yuhonas_match && e.extended_only !== true);
console.log('\nVerificación · curados sin foto que aún entrarían al pool:', enPoolSinFoto.length);
if(enPoolSinFoto.length > 0){
  console.error('FALLA · todavía hay curados sin foto en pool:');
  enPoolSinFoto.forEach(e => console.error('  ', e.id));
  process.exit(1);
}

// === Distribuciones finales ===
const yuhonas = EX.filter(e => e.id.startsWith('yuhonas_'));
const curados = EX.filter(e => !e.id.startsWith('yuhonas_'));
const yuhonasPool = yuhonas.filter(e => e.extended_only !== true);
const curadosPool = curados.filter(e => e.extended_only !== true);
console.log('\n=== POOL FINAL (ejercicios que entran al motor) ===');
console.log('Yuhonas en pool:', yuhonasPool.length, '(de', yuhonas.length, 'total)');
console.log('Curados en pool:', curadosPool.length, '(de', curados.length, 'total)');
console.log('TOTAL pool del motor:', yuhonasPool.length + curadosPool.length);
console.log('Todos con foto: SÍ (regla binaria aplicada)');

// === Reinyectar EX al HTML ===
const newJson = JSON.stringify(EX);
const newHtml = html.substring(0, start + 'const EX = '.length) + newJson + html.substring(end);
fs.writeFileSync(HTML_PATH, newHtml);
console.log('\n✓ HTML actualizado · pool limpio');
