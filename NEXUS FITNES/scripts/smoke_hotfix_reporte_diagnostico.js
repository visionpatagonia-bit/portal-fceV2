// =====================================================================
// smoke_hotfix_reporte_diagnostico.js · v2028.27 · 2026-05-10 noche
// Valida botón "Reportar problema" para telemetría manual Ariel.
// Asserts: 6
// =====================================================================

const fs = require('fs');
const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label){ if(cond){ pass++; console.log('  OK · ' + label); } else { fail++; console.error('  FAIL · ' + label); } }

const html = fs.readFileSync(HTML_PATH, 'utf8');

assert(/v2028\.27 · 2026-05-10 noche · botón "Reportar problema"/.test(html),
  'T1 comentario v2028.27 traceability');

assert(/window\.nxBuildDiagnostic = function\(\)/.test(html),
  'T2 window.nxBuildDiagnostic handler global');

assert(/window\.nxCopyDiagnostic = async function\(\)/.test(html),
  'T3 window.nxCopyDiagnostic async handler');

assert(/navigator\.clipboard\.writeText\(text\)/.test(html),
  'T4 usa navigator.clipboard.writeText (Web Clipboard API)');

assert(/id = 'nx-report-problem-btn';/.test(html) && /🔧 Reportar problema/.test(html),
  'T5 botón Reportar problema inyectado');

assert(/motorVersion: NX_MOTOR_VERSION/.test(html) && /client: c \?/.test(html) && /routine: lastRoutine/.test(html),
  'T6 diagnostic captura motorVersion + client + routine');

console.log('\nPASS: ' + pass + ' · FAIL: ' + fail);
process.exit(fail > 0 ? 1 : 0);
