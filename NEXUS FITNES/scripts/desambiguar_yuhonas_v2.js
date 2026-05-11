// =====================================================================
// desambiguar_yuhonas_v2.js · Bloque A Día 3 v2 · 2026-05-11
// Versión robusta · usa regex replace con callback · evita offsets dinámicos
// =====================================================================

const fs = require('fs');
const HTML_PATH = '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let html = fs.readFileSync(HTML_PATH, 'utf8');

// Pass 1: contar nombres yuhonas
const yuhonasEntryRe = /"id":\s*"(yuhonas_[^"]+)"[^{}]{0,500}?"name":\s*"([^"]+)"/g;
const nameCount = {};
let m;
while((m = yuhonasEntryRe.exec(html)) !== null){
  nameCount[m[2]] = (nameCount[m[2]] || 0) + 1;
}
const totalYuhonas = Object.values(nameCount).reduce((a, b) => a + b, 0);
const duplicadosCount = Object.values(nameCount).filter(c => c > 1).reduce((a, b) => a + b, 0);
console.log(`Total yuhonas: ${totalYuhonas} · Con nombre duplicado: ${duplicadosCount}`);

// Helper: derivar sufijo desde id
function deriveSufijo(id){
  let parts = id.replace(/^yuhonas_/, '').replace(/_/g, ' ').toLowerCase();
  const mapping = [
    ['close grip', 'agarre cerrado'], ['wide grip', 'agarre ancho'], ['medium grip', 'agarre medio'],
    ['reverse grip', 'agarre invertido'], ['neutral grip', 'agarre neutro'],
    ['powerlifting', 'powerlifting'], ['with chains', 'con cadenas'], ['with bands', 'con bandas'],
    ['guillotine', 'guillotina'], ['decline', 'declinado'], ['incline', 'inclinado'],
    ['flat', 'plano'], ['seated', 'sentado'], ['standing', 'parado'],
    ['kneeling', 'arrodillado'], ['lying', 'acostado'],
    ['one arm', 'a una mano'], ['one leg', 'a una pierna'],
    ['alternate', 'alternado'], ['alternating', 'alternado'],
    ['cable', 'en polea'], ['dumbbell', 'con mancuernas'], ['barbell', 'con barra'],
    ['machine', 'en máquina'], ['kettlebell', 'con pesa rusa'], ['smith', 'en smith'],
    ['low pulley', 'polea baja'], ['high pulley', 'polea alta'],
    ['behind the back', 'tras la espalda'], ['behind the head', 'tras la cabeza'], ['behind neck', 'tras nuca'],
    ['hammer', 'martillo'], ['preacher', 'predicador'], ['concentration', 'concentrado'],
    ['spider', 'spider'], ['skull crusher', 'rompe-cráneos'],
    ['front', 'frontal'], ['lateral', 'lateral'], ['reverse', 'invertido'],
    ['romanian', 'rumano'], ['stiff legged', 'piernas rígidas'], ['stiff-legged', 'piernas rígidas'],
    ['single leg', 'una pierna'], ['walking lunge', 'estocada caminando'],
    ['static lunge', 'estocada estática'], ['side', 'lateral'],
    ['narrow', 'estrecho'], ['negative', 'negativo'], ['paused', 'con pausa'],
    ['plyometric', 'pliométrico'], ['explosive', 'explosivo'], ['eccentric', 'excéntrico'],
    ['isometric', 'isométrico'],
  ];
  for(const [en, es] of mapping){ if(parts.includes(en)) return es; }
  // Fallback: extraer última palabra distintiva
  const words = parts.split(' ').filter(w => w.length > 3 && !['with','from','press','bench','squat','curl','rows','lift','pull','push','back','flexión','flexion','para','con','del','peso','banca','muerto'].includes(w));
  return words.length > 0 ? words[words.length - 1] : null;
}

// Pass 2: replace con callback · cambia name para duplicados
let modifiedCount = 0;
const updates = [];
const idsModificados = new Set();

const fullRe = /("id":\s*"(yuhonas_[^"]+)"[^{}]{0,500}?"name":\s*")([^"]+)(")/g;
html = html.replace(fullRe, (match, prefix, id, name, suffix) => {
  if(idsModificados.has(id)) return match;
  if((nameCount[name] || 0) <= 1) return match; // No es duplicado
  const sufijo = deriveSufijo(id);
  if(!sufijo) return match;
  idsModificados.add(id);
  modifiedCount++;
  const newName = name + ' · ' + sufijo;
  updates.push({ id, old: name, new: newName });
  return prefix + newName + suffix;
});

console.log(`\n=== Sufijos aplicados: ${modifiedCount} ===`);
updates.slice(0, 15).forEach(u => console.log(`  ${u.id.substring(0, 45).padEnd(45)} "${u.old}" → "${u.new}"`));
if(updates.length > 15) console.log(`  ... (${updates.length - 15} más)`);

// Re-contar nombres únicos post-fix
const yuhonasEntryRe2 = /"id":\s*"(yuhonas_[^"]+)"[^{}]{0,500}?"name":\s*"([^"]+)"/g;
const uniqueNamesPost = new Set();
let m2;
while((m2 = yuhonasEntryRe2.exec(html)) !== null){
  uniqueNamesPost.add(m2[2]);
}
console.log(`\nNombres únicos yuhonas post-fix: ${uniqueNamesPost.size}/${totalYuhonas}`);

if(modifiedCount > 0){
  fs.writeFileSync(HTML_PATH, html);
  console.log('\n✓ HTML actualizado · ' + HTML_PATH);
} else {
  console.log('\n⚠ Sin modificaciones · HTML sin cambios');
}
process.exit(0);
