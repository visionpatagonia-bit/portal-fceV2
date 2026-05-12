// =====================================================================
// rematch_curados_explicit_ids.js · v2028.33 · 2026-05-11
// Re-match con IDs yuhonas exactos (sin heurística). Cubre todos los
// items aprobados por Ariel textualmente · saca del extended_only.
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

// === Matches explícitos (curado_id → yuhonas_id) ===
// Origen: feedback textual Ariel · validado primary_muscles
const MATCHES = [
  // "vuelos laterales · es de los viejos hay que machear"
  { curado: 'vuelos_laterales',     yuhonas: 'yuhonas_Side_Lateral_Raise' },        // Elevaciones laterales · hombro
  // "vuelos polea" implícito (vuelos en polea baja)
  { curado: 'vuelos_polea',         yuhonas: 'yuhonas_Cable_Seated_Lateral_Raise' }, // Elevaciones laterales · sentado · polea
  // "rueda" hecho · "elevación piernas acostado · es de los viejos hay que machear"
  { curado: 'elevacion_piernas',    yuhonas: 'yuhonas_Flat_Bench_Lying_Leg_Raise' }, // Elevación de piernas · plano · core
  // "encogimientos" trapecio (Ariel: "está bien")
  { curado: 'encogimientos',        yuhonas: 'yuhonas_Dumbbell_Shrug' },             // Encogimiento · con mancuernas
  // "Apertura mancuernas BANCO PLANO" (NO declinado · fix mismatch)
  { curado: 'aperturas_mc',         yuhonas: 'yuhonas_Dumbbell_Flyes' },             // Aperturas con mancuernas (plano default)
  // "Jalón al pecho con barra recta · NO cruzado"
  { curado: 'jalon_polea',          yuhonas: 'yuhonas_Wide-Grip_Lat_Pulldown' },     // Jalón al pecho · barra recta wide grip
  // "Peso muerto sumo perfecto" (curado se llama sentadilla_sumo pero Ariel lo interpreta como peso muerto sumo)
  { curado: 'sentadilla_sumo',      yuhonas: 'yuhonas_Sumo_Deadlift' },              // Peso muerto sumo
  // "Hip thrust" aprobado
  { curado: 'hip_thrust',           yuhonas: 'yuhonas_Barbell_Hip_Thrust' },         // Empuje de cadera · barra
  // "Puente glúteos OK pero tiene que machear con foto" · mejor match
  { curado: 'puente_gluteo',        yuhonas: 'yuhonas_Barbell_Glute_Bridge' },       // Puente de glúteos · con barra
];

const idx = {};
EX.forEach(e => idx[e.id] = e);

console.log('=== Re-match explícito por ID ===\n');
let aplicados = 0, fallidos = 0;
MATCHES.forEach(m => {
  const curado = idx[m.curado];
  const yuh = idx[m.yuhonas];
  if(!curado){ console.log(`✗ Curado ${m.curado} NO existe`); fallidos++; return; }
  if(!yuh){ console.log(`✗ Yuhonas ${m.yuhonas} NO existe`); fallidos++; return; }
  curado.yuhonas_match = yuh.id;
  curado.yuhonas_thumb = yuh.thumb || yuh.image || '';
  curado.extended_only = false; // Reactivar en pool
  aplicados++;
  console.log(`✓ ${m.curado} (${curado.group}) → ${yuh.id} (${yuh.name})`);
  console.log(`    primary curado: ${JSON.stringify(curado.primary_muscles)}`);
  console.log(`    primary yuhonas: ${JSON.stringify(yuh.primary_muscles)}`);
});

console.log(`\n=== TOTAL aplicados: ${aplicados} · fallidos: ${fallidos} ===`);

// Reinyectar
const newJson = JSON.stringify(EX);
html = html.substring(0, start + offset) + newJson + html.substring(end);
fs.writeFileSync(HTML_PATH, html);
console.log('\n✓ HTML actualizado');

// Resumen pool
const yuhonas = EX.filter(e => e.id.startsWith('yuhonas_'));
const curados = EX.filter(e => !e.id.startsWith('yuhonas_'));
const yuhonasPool = yuhonas.filter(e => e.extended_only !== true);
const curadosPool = curados.filter(e => e.extended_only !== true);
console.log('\nPool motor · yuhonas:', yuhonasPool.length, '· curados:', curadosPool.length, '· total:', yuhonasPool.length + curadosPool.length);

// Verificación binaria: nadie en pool sin foto
const sinFoto = [...yuhonasPool, ...curadosPool].filter(e => {
  // Yuhonas siempre tiene foto. Curados solo si tienen yuhonas_match
  if(e.id.startsWith('yuhonas_')) return false;
  return !e.yuhonas_match;
});
console.log('Pool sin foto:', sinFoto.length, sinFoto.length === 0 ? '✓ TODOS TIENEN FOTO' : '✗ FALLA');
