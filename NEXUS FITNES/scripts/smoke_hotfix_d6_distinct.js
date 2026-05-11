// =====================================================================
// smoke_hotfix_d6_distinct.js · v2028.29 · 2026-05-11 madrugada
// Valida que día 6 (active recovery) tenga targetGroups distintos a día 5.
// Bug detectado por smoke_faker_matrix.js · 50 perfiles sintéticos.
// Asserts: 4
// =====================================================================

const fs = require('fs');
const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label){ if(cond){ pass++; console.log('  OK · ' + label); } else { fail++; console.error('  FAIL · ' + label); } }

const html = fs.readFileSync(HTML_PATH, 'utf8');

assert(/v2028\.29 · fix smoke_faker_matrix/.test(html),
  'T1 comentario v2028.29 traceability');

assert(/\["Cardio","Core","Movilidad"\][\s\S]{0,100}\["Movilidad","Cardio"\]/.test(html),
  'T2 día 5 = [Cardio,Core,Movilidad] · día 6 = [Movilidad,Cardio] (distintos · sin Core)');

// Detalle: ya NO debe existir el patrón viejo en el ARRAY LITERAL (puede aparecer en comentarios explicativos)
assert(!/\["Cardio","Movilidad","Core"\],\s*\];/.test(html),
  'T3 patrón viejo ["Cardio","Movilidad","Core"] removido del array literal');

assert(/día 6 · active recovery REAL · sin Core/.test(html),
  'T4 comentario "active recovery REAL · sin Core"');

console.log('\nPASS: ' + pass + ' · FAIL: ' + fail);
process.exit(fail > 0 ? 1 : 0);
