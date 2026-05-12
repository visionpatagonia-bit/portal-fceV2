// =====================================================================
// fix_cardio_y_dia6.js · v2028.34.1 · 2026-05-12 noche
// 3 fixes en uno:
//   1. Traducir nombres de 8 yuhonas cardio (sacar "(EN)") · ahora pasan al pool
//   2. Bloquear yuhonas_Deadlift_with_Chains + yuhonas_Barbell_Guillotine_Bench_Press
//      (peso muerto en espalda + press guillotina riesgoso · Ariel no quiere)
//   3. NO toca splits acá · el ajuste va en HTML directo.
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

// === FIX 1: traducir nombres yuhonas cardio ===
const CARDIO_TRADUCCIONES = {
  'yuhonas_Bicycling':            'Bicicleta · aire libre',
  'yuhonas_Bicycling_Stationary': 'Bicicleta fija',
  'yuhonas_Elliptical_Trainer':   'Elíptica',
  'yuhonas_Jogging_Treadmill':    'Trote en cinta',
  'yuhonas_Recumbent_Bike':       'Bicicleta reclinada',
  'yuhonas_Rope_Jumping':         'Saltos de soga',
  'yuhonas_Running_Treadmill':    'Carrera en cinta',
  'yuhonas_Walking_Treadmill':    'Caminata en cinta',
};
let traducidos = 0;
Object.entries(CARDIO_TRADUCCIONES).forEach(([id, name]) => {
  const e = EX.find(x => x.id === id);
  if(e){ e.name = name; traducidos++; }
});
console.log(`Yuhonas cardio traducidos: ${traducidos}/${Object.keys(CARDIO_TRADUCCIONES).length}`);

// === FIX 2: bloquear yuhonas peligrosos o no apropiados para tonificación ===
const NUEVOS_BLOCK = [
  'yuhonas_Deadlift_with_Chains',           // group=Espalda · Ariel: peso muerto NO en espalda
  'yuhonas_Barbell_Guillotine_Bench_Press', // press guillotina · riesgoso para tonificación
  'yuhonas_Sumo_Deadlift_with_Chains',      // variante con cadenas · nicho · ya hay sumo deadlift normal
];
let bloqueados = 0;
NUEVOS_BLOCK.forEach(id => {
  const e = EX.find(x => x.id === id);
  if(!e) return;
  if(e.extended_only === true) return;
  e.extended_only = true;
  bloqueados++;
  console.log('  bloqueado:', id, '·', e.name);
});
console.log(`Nuevos bloqueados: ${bloqueados}/${NUEVOS_BLOCK.length}`);

// Reinyectar
const newJson = JSON.stringify(EX);
html = html.substring(0, start + offset) + newJson + html.substring(end);
fs.writeFileSync(HTML_PATH, html);
console.log('\n✓ HTML actualizado');
