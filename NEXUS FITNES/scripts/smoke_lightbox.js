// =====================================================================
// smoke_lightbox.js · Sprint 1.6 D2 · 2026-05-10 tarde
// Valida modal lightbox educativo (visión Juan):
//   - nxOpenExDetail handler global con opts {dayIdx, fromRoutine}
//   - nxCloseExDetail + nxOpenExDetailAdd handlers
//   - Botón ⓘ en _renderAddRow con event.stopPropagation
//   - Thumb clickeable en rutina con cursor:zoom-in
//   - Modal estructura: imágenes (paso 1+2) + instructions + CTA condicional
//   - ESC + click overlay para cerrar
// Asserts: 12
// =====================================================================

const fs = require('fs');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label, expected, actual){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + '\n    expected: ' + JSON.stringify(expected) + '\n    actual:   ' + JSON.stringify(actual)); }
}

console.log('[smoke_lightbox] HTML: ' + HTML_PATH);
const html = fs.readFileSync(HTML_PATH, 'utf8');

// === T1: nxOpenExDetail handler global (sync or async tras D3) ===
assert(/window\.nxOpenExDetail = (async )?function\(exId, opts\)/.test(html),
  'T1 window.nxOpenExDetail definido global (sync/async)', 'truthy', 'check');

// === T2: nxCloseExDetail handler ===
assert(html.includes('window.nxCloseExDetail = function()'),
  'T2 window.nxCloseExDetail definido global', 'truthy', 'check');

// === T3: nxOpenExDetailAdd handler (CTA agregar) ===
assert(html.includes('window.nxOpenExDetailAdd = function(exId, dayIdx)'),
  'T3 window.nxOpenExDetailAdd definido (CTA agregar)', 'truthy', 'check');

// === T4: nxOpenExDetail busca en EX primero, luego NX_CATALOG ===
assert(/let ex = EX\.find\(x => x\.id === exId\);[\s\S]*?NX_CATALOG\.getById\(exId\)/.test(html),
  'T4 nxOpenExDetail busca EX → NX_CATALOG (fallback)', 'truthy', 'check');

// === T5: Renderiza imagen 1 + imagen 2 si yuhonas ===
assert(/grid-template-columns:\$\{images\.length > 1 \? '1fr 1fr' : '1fr'\}/.test(html),
  'T5 grid 1fr 1fr si 2 imágenes (paso 1+2 lado a lado)', 'truthy', 'check');

// === T6: Badge "PASO N" en imágenes ===
assert(/PASO \$\{i\+1\}/.test(html),
  'T6 cada imagen muestra "PASO N" si hay >1', 'truthy', 'check');

// === T7: Botón ⓘ en _renderAddRow con event.stopPropagation ===
assert(/event\.stopPropagation\(\);nxOpenExDetail\("\$\{e\.id\}",\{dayIdx:\$\{dayIdx\}\}\)/.test(html),
  'T7 botón ⓘ en modal +Agregar con event.stopPropagation', 'truthy', 'check');

// === T8: Thumb en rutina con cursor:zoom-in + onclick lightbox ===
assert(/onclick='event\.stopPropagation\(\);nxOpenExDetail\("\$\{e\.id\}",\{fromRoutine:true\}\)'/.test(html),
  'T8 thumb en rutina clickeable con fromRoutine:true', 'truthy', 'check');

assert(/cursor:zoom-in/.test(html),
  'T9 cursor:zoom-in en thumb rutina (affordance visual)', 'truthy', 'check');

// === T9: CTA condicional "Agregar al día" solo si dayIdx + !fromRoutine ===
assert(/typeof opts\.dayIdx === "number" && !opts\.fromRoutine/.test(html),
  'T10 CTA "Agregar al día" solo si dayIdx presente y NO fromRoutine', 'truthy', 'check');

// === T10: ESC handler para cerrar ===
assert(/e\.key === "Escape"[\s\S]*?nxCloseExDetail\(\)/.test(html),
  'T11 ESC key cierra el modal', 'truthy', 'check');

// === T11: Click overlay (no card) cierra ===
assert(/if\(e\.target === overlay\) nxCloseExDetail\(\)/.test(html),
  'T12 click en overlay (no card) cierra el modal', 'truthy', 'check');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
