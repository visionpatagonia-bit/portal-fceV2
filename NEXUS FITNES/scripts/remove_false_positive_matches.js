// =====================================================================
// remove_false_positive_matches.js · Bloque A Día 2 · 2026-05-11
// Remueve yuhonas_match + yuhonas_thumb de 7 curados con matching falso
// detectados por Ariel en reunión + audit del sábado.
// =====================================================================

const fs = require('fs');
const HTML_PATH = '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

const FALSOS = [
  { id: 'hip_thrust',                  reason: 'match Barbell_Curl · movimiento totalmente distinto · audit sábado' },
  { id: 'crunch_peso',                 reason: 'match Stiff-Legged Dumbbell Deadlift · abdominal vs cadena posterior · audit sábado' },
  { id: 'movilidad_hombros_circulos',  reason: 'match Alternating Cable Shoulder Press · movilidad vs ejercicio fuerza · audit sábado' },
  { id: 'remo_barra',                  reason: 'match Upright Barbell Row · Pendlay (espalda) vs upright (shoulder) · audit sábado + Ariel reunión' },
  { id: 'abducciones_polea',           reason: 'match Cable Hip Adduction · abducción vs aducción dirección invertida · audit sábado' },
  { id: 'aperturas_mc',                reason: 'match Decline Dumbbell Flyes · banco plano vs declinado · Ariel reunión 2026-05-11' },
  { id: 'jalon_polea',                 reason: 'match Close-Grip Front Lat Pulldown · cruzado vs barra recta · Ariel reunión 2026-05-11' }
];

let html = fs.readFileSync(HTML_PATH, 'utf8');
const originalLength = html.length;
let removedCount = 0;
const removedDetails = [];

FALSOS.forEach(f => {
  // Pattern: encuentra `"id": "X" ... "yuhonas_match": "Y", "yuhonas_thumb": "URL"`
  // y remueve el `, "yuhonas_match": ..., "yuhonas_thumb": "..."` (incluyendo coma anterior)
  const re = new RegExp(
    '("id":\\s*"' + f.id + '"[^{}]{0,2000}?),\\s*"yuhonas_match":\\s*"[^"]+",\\s*"yuhonas_thumb":\\s*"[^"]+"',
    'g'
  );
  const before = html;
  html = html.replace(re, '$1');
  if(html !== before){
    removedCount++;
    removedDetails.push(`✓ ${f.id} · ${f.reason}`);
  } else {
    removedDetails.push(`✗ ${f.id} · NO encontrado o pattern no matched`);
  }
});

const newLength = html.length;
console.log('=== Remove false positive matches ===\n');
removedDetails.forEach(d => console.log('  ' + d));
console.log(`\nTotal removidos: ${removedCount}/${FALSOS.length}`);
console.log(`Delta tamaño: ${originalLength} → ${newLength} (${newLength - originalLength} bytes)`);

if(removedCount === FALSOS.length){
  fs.writeFileSync(HTML_PATH, html);
  console.log('\n✓ HTML actualizado · ' + HTML_PATH);
  process.exit(0);
} else {
  console.error('\n✗ FAIL · no se removieron todos los matches · HTML NO modificado');
  process.exit(1);
}
