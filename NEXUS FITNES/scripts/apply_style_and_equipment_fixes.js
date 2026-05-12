// =====================================================================
// apply_style_and_equipment_fixes.js · Bloque A Día 3 · CORRECCIÓN 2026-05-11
// Aplica 2 fixes que faltaban del pedido formal:
//   1. Tag `style` agregado al catálogo (default ['general'] · crossfit/potencia donde aplica)
//   2. Flag `requires_specific_equipment: true` para remo_ergometro
//
// La lógica condicional crossfit en motor se aplica directamente al HTML
// post-script via Edit tool.
// =====================================================================

const fs = require('fs');
const HTML_PATH = '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let html = fs.readFileSync(HTML_PATH, 'utf8');
const originalLength = html.length;

// Keywords para detectar crossfit/oly/power
const STYLE_TAGS = [
  // Olympic lifting
  { kw: /snatch|arranque/i,                   styles: ['potencia', 'crossfit'] },
  { kw: /\bclean\b|cargada/i,                 styles: ['potencia', 'crossfit'] },
  { kw: /jerk|envion|envión/i,                styles: ['potencia', 'crossfit'] },
  { kw: /power.clean|power_clean/i,           styles: ['potencia', 'crossfit'] },
  // Crossfit típicos
  { kw: /burpee/i,                            styles: ['crossfit'] },
  { kw: /thruster/i,                          styles: ['crossfit'] },
  { kw: /\bwod\b/i,                           styles: ['crossfit'] },
  { kw: /muscle.up|muscle_up/i,               styles: ['crossfit'] },
  // Powerlifting variants
  { kw: /powerlifting|power.lift/i,           styles: ['potencia'] },
  { kw: /push.press|push_press/i,             styles: ['potencia', 'crossfit'] },
  // Olympic competition
  { kw: /olympic|olímpico|olimpico/i,         styles: ['potencia'] },
  { kw: /pendlay/i,                           styles: ['potencia'] },
];

function deriveStyle(id, name){
  const text = (id + ' ' + name).toLowerCase();
  for(const rule of STYLE_TAGS){
    if(rule.kw.test(text)) return rule.styles;
  }
  return ['general'];
}

// Pass: extraer entries · agregar `style` field después de `pattern`
// Pattern target: `"pattern": "X",` → agregar `, "style": [...]`
const entryRe = /("id":\s*"([^"]+)"[^{}]{0,1500}?"name":\s*"([^"]+)"[^{}]{0,1500}?"pattern":\s*"[^"]+",)/g;
let stylesAdded = 0;
const stylesByCount = { general: 0, potencia: 0, crossfit: 0 };

html = html.replace(entryRe, (match, prefix, id, name) => {
  // Skip si ya tiene style
  if(/"style":\s*\[/.test(match)) return match;
  const style = deriveStyle(id, name);
  stylesAdded++;
  style.forEach(s => { stylesByCount[s] = (stylesByCount[s] || 0) + 1; });
  return prefix + ' "style": ' + JSON.stringify(style) + ',';
});

console.log(`Entries con style agregado: ${stylesAdded}`);
console.log('Distribución:');
console.log(`  general:  ${stylesByCount.general}`);
console.log(`  potencia: ${stylesByCount.potencia}`);
console.log(`  crossfit: ${stylesByCount.crossfit}`);

// === Flag requires_specific_equipment para remo_ergometro ===
const remoRe = /("id":\s*"remo_ergometro"[^{}]{0,500}?"equipment":\s*"[^"]+",)/;
const matchRemo = html.match(remoRe);
if(matchRemo){
  html = html.replace(remoRe, matchRemo[1] + ' "requires_specific_equipment": true,');
  console.log('\n✓ Flag requires_specific_equipment agregado a remo_ergometro');
} else {
  console.log('\n⚠ remo_ergometro no encontrado para flag');
}

fs.writeFileSync(HTML_PATH, html);
console.log(`\nHTML actualizado · delta: ${html.length - originalLength} bytes`);
