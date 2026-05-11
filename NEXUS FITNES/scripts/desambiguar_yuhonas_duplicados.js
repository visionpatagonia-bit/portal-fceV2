// =====================================================================
// desambiguar_yuhonas_duplicados.js · Bloque A Día 3 · 2026-05-11
// Detecta yuhonas con nombre duplicado en el HTML · agrega sufijo descriptivo
// para desambiguar visualmente (caso: 10+ "Press de banca" con groups distintos).
// =====================================================================

const fs = require('fs');
const HTML_PATH = '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let html = fs.readFileSync(HTML_PATH, 'utf8');

// Extraer todos los yuhonas con id + name + group
const yuhonasRe = /"id":\s*"(yuhonas_[^"]+)"[^{}]{0,500}?"name":\s*"([^"]+)"[^{}]{0,500}?"group":\s*"([^"]+)"/g;
const all = [];
let m;
while((m = yuhonasRe.exec(html)) !== null){
  all.push({ id: m[1], name: m[2], group: m[3] });
}

// Detectar nombres duplicados
const nameCount = {};
all.forEach(e => { nameCount[e.name] = (nameCount[e.name] || 0) + 1; });
const duplicados = all.filter(e => nameCount[e.name] > 1);
console.log(`Total yuhonas: ${all.length}`);
console.log(`Yuhonas con nombre duplicado: ${duplicados.length}`);

// Agrupar por name para mostrar
const porNombre = {};
duplicados.forEach(e => {
  if(!porNombre[e.name]) porNombre[e.name] = [];
  porNombre[e.name].push(e);
});

console.log('\n=== Top 10 nombres más duplicados ===');
Object.entries(porNombre)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10)
  .forEach(([name, entries]) => {
    console.log(`  ${entries.length}× "${name}" · groups: ${[...new Set(entries.map(e => e.group))].join(', ')}`);
  });

// === Generar sufijos descriptivos por id ===
// Estrategia: extraer hint del id (palabra clave técnica) y construir sufijo legible.
// Ej: yuhonas_Bench_Press_-_Powerlifting → sufijo "powerlifting"
function deriveSufijo(id){
  // Quitar prefix yuhonas_ y suffix probable
  let parts = id.replace(/^yuhonas_/, '').replace(/_/g, ' ').toLowerCase();
  // Reemplazos típicos
  const mapping = [
    ['close grip', 'agarre cerrado'],
    ['wide grip', 'agarre ancho'],
    ['medium grip', 'agarre medio'],
    ['reverse grip', 'agarre invertido'],
    ['neutral grip', 'agarre neutro'],
    ['powerlifting', 'powerlifting'],
    ['with chains', 'con cadenas'],
    ['with bands', 'con bandas'],
    ['guillotine', 'guillotina'],
    ['decline', 'declinado'],
    ['incline', 'inclinado'],
    ['flat', 'plano'],
    ['seated', 'sentado'],
    ['standing', 'parado'],
    ['kneeling', 'arrodillado'],
    ['lying', 'acostado'],
    ['one arm', 'a una mano'],
    ['one leg', 'a una pierna'],
    ['alternate', 'alternado'],
    ['alternating', 'alternado'],
    ['cable', 'en polea'],
    ['dumbbell', 'con mancuernas'],
    ['barbell', 'con barra'],
    ['machine', 'en máquina'],
    ['kettlebell', 'con pesa rusa'],
    ['smith', 'en smith'],
    ['low pulley', 'polea baja'],
    ['high pulley', 'polea alta'],
    ['behind the back', 'tras la espalda'],
    ['behind the head', 'tras la cabeza'],
    ['behind neck', 'tras nuca'],
    ['back', 'espalda'],
    ['front', 'frontal'],
    ['lateral', 'lateral'],
    ['reverse', 'invertido'],
    ['romanian', 'rumano'],
    ['stiff legged', 'piernas rígidas'],
    ['stiff-legged', 'piernas rígidas'],
    ['single leg', 'una pierna'],
    ['walking lunge', 'estocada caminando'],
    ['static lunge', 'estocada estática'],
    ['side', 'lateral'],
    ['hammer', 'martillo'],
    ['preacher', 'predicador'],
    ['concentration', 'concentrado'],
    ['spider', 'spider'],
    ['skull crusher', 'rompe-cráneos'],
    ['triceps', 'tríceps'],
    ['biceps', 'bíceps'],
    ['narrow', 'estrecho'],
    ['negative', 'negativo'],
    ['paused', 'con pausa'],
    ['tempo', 'tempo'],
    ['plyometric', 'pliométrico'],
    ['explosive', 'explosivo'],
    ['eccentric', 'excéntrico'],
    ['isometric', 'isométrico'],
  ];
  for(const [en, es] of mapping){
    if(parts.includes(en)){ return es; }
  }
  // Fallback: usar última palabra significativa
  const words = parts.split(' ').filter(w => w.length > 3 && !['with','from','press','bench','squat','curl','rows','lift','pull','push'].includes(w));
  return words.length > 0 ? words[words.length - 1] : null;
}

// === Aplicar sufijos a los duplicados ===
let modifiedCount = 0;
const updates = [];
Object.entries(porNombre).forEach(([name, entries]) => {
  if(entries.length < 2) return;
  entries.forEach(e => {
    const sufijo = deriveSufijo(e.id);
    if(sufijo){
      const newName = name + ' · ' + sufijo;
      // Reemplazar en HTML específicamente
      const oldStr = '"id": "' + e.id + '"';
      const idx = html.indexOf(oldStr);
      if(idx === -1) return;
      // Buscar el name asociado a este id (dentro de los próximos ~500 chars)
      const block = html.substring(idx, idx + 2000);
      const nameStr = '"name": "' + name + '"';
      const nameIdx = block.indexOf(nameStr);
      if(nameIdx === -1) return;
      // Reemplazar SOLO la primera ocurrencia post-id (atomic)
      const absoluteNameIdx = idx + nameIdx;
      html = html.substring(0, absoluteNameIdx) + '"name": "' + newName + '"' + html.substring(absoluteNameIdx + nameStr.length);
      modifiedCount++;
      updates.push({ id: e.id, old: name, new: newName });
    }
  });
});

console.log(`\n=== Sufijos aplicados: ${modifiedCount} entries ===`);
updates.slice(0, 15).forEach(u => console.log(`  ${u.id.padEnd(50)} "${u.old}" → "${u.new}"`));
if(updates.length > 15) console.log(`  ... (${updates.length - 15} más)`);

// Verificar que el conteo de nombres únicos aumentó
const yuhonasRe2 = /"id":\s*"(yuhonas_[^"]+)"[^{}]{0,500}?"name":\s*"([^"]+)"/g;
const all2 = [];
let m2;
while((m2 = yuhonasRe2.exec(html)) !== null){
  all2.push({ id: m2[1], name: m2[2] });
}
const uniqueNames = new Set(all2.map(e => e.name));
console.log(`\nNombres únicos post-fix: ${uniqueNames.size}/${all2.length}`);

if(modifiedCount > 0){
  fs.writeFileSync(HTML_PATH, html);
  console.log('\n✓ HTML actualizado · ' + HTML_PATH);
  process.exit(0);
} else {
  console.log('\n⚠ No se aplicaron modificaciones · HTML sin cambios');
  process.exit(0);
}
