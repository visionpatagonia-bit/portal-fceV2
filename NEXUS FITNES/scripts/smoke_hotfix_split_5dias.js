// =====================================================================
// smoke_hotfix_split_5dias.js · HOTFIX 2026-05-10 noche · bug Michael Lopez
// Valida fix raíz línea 5662: isInicial NO debe aplicar a 5+ días.
//   1. Comentario v2028.24 trazabilidad presente
//   2. isInicial incluye condición totalDays <= 4
//   3. splits5plus sigue intacto (no se rompió el else-if 5+ días)
//   4. Estructura del bloque if-else preservada
//   5. Verificar que targetGroups full body NO se asigna si totalDays>=5
// Asserts: 10
// =====================================================================

const fs = require('fs');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label, expected, actual){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + '\n    expected: ' + JSON.stringify(expected) + '\n    actual:   ' + JSON.stringify(actual)); }
}

console.log('[smoke_hotfix_split_5dias] HTML: ' + HTML_PATH);
const html = fs.readFileSync(HTML_PATH, 'utf8');

// === T1: Comentario trazabilidad v2028.24 presente ===
assert(/v2028\.24 · HOTFIX 2026-05-10 noche · bug Michael Lopez/.test(html),
  'T1 comentario v2028.24 HOTFIX traceability', 'truthy', 'check');

// === T2: isInicial incluye totalDays <= 4 ===
assert(/const isInicial = profile\.level <= 2 && profile\.goal !== "rehab" && profile\.goal !== "adulto_mayor" && totalDays <= 4;/.test(html),
  'T2 isInicial con condición totalDays <= 4', 'truthy', 'check');

// === T3: splits5plus sigue intacto (Pecho · Espalda · Cuádri/Glúteos · Hombros/Brazos · Cardio/Core/Movilidad) ===
assert(/const splits5plus = \[\s*\["Pecho"\],\s*\["Espalda"\],\s*\["Cuádriceps","Glúteos"\],\s*\["Hombros","Brazos"\],\s*\["Cardio","Core","Movilidad"\]/.test(html),
  'T3 splits5plus array literal intacto', 'truthy', 'check');

// === T4: full body targetGroups (Pecho Espalda Cuádriceps Hombros Core) presente solo en rama isInicial ===
assert(/if\(isInicial\)\{[\s\S]{0,200}?targetGroups = \["Pecho","Espalda","Cuádriceps","Hombros","Core"\]/.test(html),
  'T4 full body targetGroups dentro de if(isInicial)', 'truthy', 'check');

// === T5: else if(totalDays===2) sigue intacto ===
assert(/\} else if\(totalDays===2\)\{/.test(html),
  'T5 else if totalDays===2 preservado', 'truthy', 'check');

// === T6: else if(totalDays===3) sigue intacto ===
assert(/\} else if\(totalDays===3\)\{/.test(html),
  'T6 else if totalDays===3 preservado', 'truthy', 'check');

// === T7: else if(totalDays===4) sigue intacto ===
assert(/\} else if\(totalDays===4\)\{/.test(html),
  'T7 else if totalDays===4 preservado', 'truthy', 'check');

// === T8: fallback splits5plus[dayIdx] || ["Cardio","Movilidad"] sigue intacto ===
assert(/targetGroups = splits5plus\[dayIdx\] \|\| \["Cardio","Movilidad"\]/.test(html),
  'T8 fallback 7+ días preservado', 'truthy', 'check');

// === T9: pickDayExercises sigue siendo function (no se rompió signatura) ===
assert(/function pickDayExercises\(dayIdx, totalDays, profile, gp\)\{/.test(html),
  'T9 signatura function pickDayExercises preservada', 'truthy', 'check');

// === T10: ANTES del fix, el HTML NO debe contener el patrón roto ===
// Patrón roto: isInicial sin totalDays <= 4
const brokenPattern = 'const isInicial = profile.level <= 2 && profile.goal !== "rehab" && profile.goal !== "adulto_mayor";';
assert(!html.includes(brokenPattern),
  'T10 patrón roto pre-fix ya NO está presente', 'truthy', 'check');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
