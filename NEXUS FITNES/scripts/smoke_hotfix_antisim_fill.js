// =====================================================================
// smoke_hotfix_antisim_fill.js · HOTFIX v2028.25 · 2026-05-10 noche
// Valida fix anti-similar fill en split fino (Michael Lopez ronda 2 feedback Ariel):
//   1. Comentario v2028.25 trazabilidad presente
//   2. While-loop reemplaza al if(pickedInGroup === 0)
//   3. Condición de fill usa exPerGroup y mainCount
//   4. Buffer antiSimSkipped.shift() (no [0])
//   5. pickedInGroup++ se incrementa en el fallback
//   6. Patrón roto previo NO está presente
// Asserts: 7
// =====================================================================

const fs = require('fs');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label, expected, actual){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + '\n    expected: ' + JSON.stringify(expected) + '\n    actual:   ' + JSON.stringify(actual)); }
}

console.log('[smoke_hotfix_antisim_fill] HTML: ' + HTML_PATH);
const html = fs.readFileSync(HTML_PATH, 'utf8');

// === T1: comentario v2028.25 trazabilidad ===
assert(/v2028\.25 · HOTFIX 2026-05-10 noche · bug Michael Lopez ronda 2/.test(html),
  'T1 comentario v2028.25 HOTFIX traceability', 'truthy', 'check');

// === T2: while-loop reemplaza al if(pickedInGroup === 0) ===
assert(/while\(pickedInGroup < exPerGroup && mainAdded < mainCount && antiSimSkipped\.length > 0\)/.test(html),
  'T2 while-loop con condición fill (pickedInGroup < exPerGroup && mainAdded < mainCount)', 'truthy', 'check');

// === T3: shift() en lugar de [0] · consumo del buffer ===
assert(/const c = antiSimSkipped\.shift\(\);/.test(html),
  'T3 antiSimSkipped.shift() · buffer consumido', 'truthy', 'check');

// === T4: pickedInGroup++ se incrementa en fallback (ambas ramas) ===
const fallbackBlock = html.match(/while\(pickedInGroup < exPerGroup[\s\S]{0,1500}?\}\s*\}\s*\}\);/);
const fallbackContent = fallbackBlock ? fallbackBlock[0] : '';
const pickedIncrements = (fallbackContent.match(/pickedInGroup\+\+/g) || []).length;
assert(pickedIncrements >= 2,
  `T4 pickedInGroup++ en ambas ramas del fallback (got ${pickedIncrements})`, '>=2', pickedIncrements);

// === T5: patrón roto previo (if pickedInGroup === 0) NO está presente como fallback anti-similar ===
const brokenLine = 'if(pickedInGroup === 0 && antiSimSkipped.length > 0 && mainAdded < mainCount){';
assert(!html.includes(brokenLine),
  'T5 patrón roto previo (if pickedInGroup === 0 ...) NO presente', 'truthy', 'check');

// === T6: substituteByRegression sigue siendo usado en rama de equipo/contras ===
assert(/substituteByRegression\(c, profile\.contras, profile\.equip\)/.test(fallbackContent || ''),
  'T6 substituteByRegression preservado en rama bloqueada', 'truthy', 'check');

// === T7: trace label "split fino" presente (UX traceability) ===
assert(/fallback anti-similar \(firma repetida tolerada en split fino\)/.test(html),
  'T7 trace label "split fino" presente · transparencia para auditor', 'truthy', 'check');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
