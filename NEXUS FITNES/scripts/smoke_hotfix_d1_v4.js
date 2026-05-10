// =====================================================================
// smoke_hotfix_d1_v4.js · Sprint 1.6 D1 HOTFIX v4 · 2026-05-10 tarde
// Valida 3 nuevos fixes raíz tras feedback Juan ronda 2:
//   1. rerenderRoutineFromState NO skip cuando ej no está en EX (uses exData fallback)
//   2. Dark mode .check-chip.active visible (botón equipo iluminado)
//   3. Equipamiento DEFAULT ON al cargar form (todas las chips activas)
// Asserts: 9
// =====================================================================

const fs = require('fs');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label, expected, actual){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + '\n    expected: ' + JSON.stringify(expected) + '\n    actual:   ' + JSON.stringify(actual)); }
}

console.log('[smoke_hotfix_d1_v4] HTML: ' + HTML_PATH);
const html = fs.readFileSync(HTML_PATH, 'utf8');

// === T1-T2: rerenderRoutineFromState fallback en 2 lugares ===
// L4976 (calc tiempo) y L5129 (render principal)
const fallbackPattern = /let e = EX\.find\(x => x\.id === exData\.id\);\s*\n\s*if\(!e && exData\.name\)\{ e = exData; \}/g;
const fallbackCount = (html.match(fallbackPattern) || []).length;
assert(fallbackCount === 2, 'T1 fallback exData inline aplicado en 2 lugares (totalWeek + render)', 2, fallbackCount);

// === T3: comentario HOTFIX v4 presente ===
assert(html.includes('HOTFIX v4'), 'T2 comentario HOTFIX v4 presente (traceability)', 'truthy', 'check');

// === T4: dark mode .check-chip.active regla ===
assert(/html\.dark \.check-chip\.active\{background:var\(--anubis-orange\)!important/.test(html),
  'T3 dark .check-chip.active iluminado con naranja Anubis + !important', 'truthy', 'check');

// === T5: dark .check-chip.active tiene box-shadow ===
assert(/html\.dark \.check-chip\.active[^}]*box-shadow:[^}]*rgba\(232,93,4/.test(html),
  'T4 dark .check-chip.active tiene box-shadow naranja', 'truthy', 'check');

// === T6: defaultAllEquipActive IIFE post-renderChips ===
assert(/defaultAllEquipActive[\s\S]*?querySelectorAll\(".check-chip"\)[\s\S]*?classList\.add\("active"\)/.test(html),
  'T5 defaultAllEquipActive IIFE activa todas las chips de equipamiento', 'truthy', 'check');

// === T7: IIFE ejecuta tras renderChips("g-equip"...) ===
const renderEquipIdx = html.indexOf('renderChips("g-equip"');
const defaultActiveIdx = html.indexOf('defaultAllEquipActive');
assert(renderEquipIdx > 0 && defaultActiveIdx > renderEquipIdx,
  'T6 defaultAllEquipActive ejecuta DESPUÉS de renderChips g-equip', 'orden correcto',
  `renderChips=${renderEquipIdx}, defaultActive=${defaultActiveIdx}`);

// === T8: Comentario explica el "por qué" (feedback Juan) ===
assert(html.includes('feedback Juan') && html.includes('gym completo'),
  'T7 comentario explica decisión UX (feedback Juan · gym completo)', 'truthy', 'check');

// === T9: NO rompe coach uso normal (solo afecta render skip · default fix conservador) ===
// Verificamos que la lógica original sigue presente (busca primero en EX)
assert(html.includes('EX.find(x => x.id === exData.id)'),
  'T8 EX.find sigue siendo el primer match (curado prioritario)', 'truthy', 'check');

// === T10: addToDay sigue poblando exData con name/level/group (para que fallback funcione) ===
assert(/_lastGeneratedDays\[dayIdx\]\.exercises\.push\(\{[\s\S]*?id: newEx\.id, name: newEx\.name, level: newEx\.level/.test(html),
  'T9 addToDay sigue poblando name/level/group en exData (req para fallback)', 'truthy', 'check');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
