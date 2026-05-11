// =====================================================================
// smoke_hotfix_cardio_guarantee.js · HOTFIX v2028.26 · 2026-05-10 noche
// Valida fix: en isCardioDay siempre garantizar al menos 1 cardio
// (independiente de mainAdded < mainCount). Ariel reportó día Cardio+Core
// con 0 cardio aeróbico aunque targetGroups incluía "Cardio".
// Asserts: 5
// =====================================================================

const fs = require('fs');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label); }
}

const html = fs.readFileSync(HTML_PATH, 'utf8');

// === T1: comentario v2028.26 trazabilidad ===
assert(/v2028\.26 · HOTFIX 2026-05-10 noche · garantizar cardio en isCardioDay/.test(html),
  'T1 comentario v2028.26 HOTFIX traceability');

// === T2: condición simplificada (sin mainAdded < mainCount) ===
assert(/if\(isCardioDay && !hasCardioPicked\)\{/.test(html),
  'T2 condición simplificada · cardio garantizado siempre que isCardioDay y no haya cardio picked');

// === T3: NO existe versión rota con mainAdded < mainCount en cardio fallback ===
assert(!/if\(isCardioDay && !hasCardioPicked && mainAdded < mainCount\)\{/.test(html),
  'T3 versión rota previa removida');

// === T4: fallbackCardio sigue filtrando por pattern cardio_liss/cardio_hiit ===
assert(/\(e\.pattern === "cardio_liss" \|\| e\.pattern === "cardio_hiit"\)/.test(html),
  'T4 filtro cardio_liss/cardio_hiit preservado');

// === T5: trace "Día requiere cardio" sigue intacto ===
assert(/"Día requiere cardio".*"targetGroups incluye Cardio"/.test(html),
  'T5 trace "Día requiere cardio" preservado');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
