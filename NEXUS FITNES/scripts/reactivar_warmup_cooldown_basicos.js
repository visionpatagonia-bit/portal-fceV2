// =====================================================================
// reactivar_warmup_cooldown_basicos.js · v2028.33 · 2026-05-12 madrugada
// Los curados de Movilidad/stretch quedaron en extended_only:true porque
// no tenían yuhonas_match. PERO el motor los necesita para warmup
// (pattern=mobility) y cooldown (pattern=stretch/recovery). Como están
// fuera del pool de MAINS por el filter line 5836-5837 (group=Movilidad
// y pattern=stretch retornan false), reactivarlos no los pone en main.
// Excepción: foam_roller_cuadriceps queda extended porque Ariel lo bloqueó
// específicamente para día pecho.
// =====================================================================
const fs = require('fs');
const HTML_PATH = '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';
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

// Reactivar warmup/cooldown · curados de Movilidad/stretch/recovery
// EXCEPCIÓN: foam_roller_cuadriceps queda fuera (Ariel)
const EXCLUIR = ['foam_roller_cuadriceps'];

let reactivados = 0;
const log = [];
EX.forEach(e => {
  if(e.id.startsWith('yuhonas_')) return;          // solo curados
  if(EXCLUIR.includes(e.id)) return;                // Ariel bloqueó
  if(e.extended_only !== true) return;              // ya activo
  const esMovilidad = e.group === 'Movilidad';
  const esStretch = e.pattern === 'stretch' || e.pattern === 'recovery' || e.pattern === 'mobility';
  if(!(esMovilidad || esStretch)) return;
  e.extended_only = false;
  reactivados++;
  log.push({ id: e.id, name: e.name, pattern: e.pattern, group: e.group });
});

console.log(`Reactivados (warmup/cooldown · siguen fuera de mains por filter line 5836-5837): ${reactivados}\n`);
log.forEach(x => console.log(`  - ${x.id} · ${x.name} · ${x.group}/${x.pattern}`));

// Verificar foam_roller_cuadriceps sigue extendido
const frq = EX.find(e => e.id === 'foam_roller_cuadriceps');
console.log(`\nfoam_roller_cuadriceps · extended_only: ${frq && frq.extended_only}`);

// Reinyectar
const newJson = JSON.stringify(EX);
html = html.substring(0, start + offset) + newJson + html.substring(end);
fs.writeFileSync(HTML_PATH, html);
console.log('\n✓ HTML actualizado');
