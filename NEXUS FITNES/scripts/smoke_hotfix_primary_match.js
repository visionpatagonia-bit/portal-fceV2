// =====================================================================
// smoke_hotfix_primary_match.js · v2028.28 · 2026-05-10 noche
// Valida fix de prioridad primary_muscle alineado con group.
// Ariel ronda 2: flexiones_diamante (group=Pecho · primary=Tríceps) confundía.
// Asserts: 8
// =====================================================================

const fs = require('fs');
const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label){ if(cond){ pass++; console.log('  OK · ' + label); } else { fail++; console.error('  FAIL · ' + label); } }
const html = fs.readFileSync(HTML_PATH, 'utf8');

assert(/v2028\.28 · 2026-05-10 noche · prioridad primary_muscle alineado/.test(html),
  'T1 comentario v2028.28 traceability');

assert(/const GROUP_PRIMARY_MAP = \{/.test(html),
  'T2 GROUP_PRIMARY_MAP definido');

assert(/"Pecho": \["pectoral"\]/.test(html),
  'T3 Pecho mapeado a ["pectoral"]');

assert(/"Glúteos": \["glúteo", "isquiotibiales", "aductores"\]/.test(html),
  'T4 Glúteos incluye isquiotibiales (femoral) · feedback Ariel');

assert(/const primaryMatchesGroup = \(ex, group\) =>/.test(html),
  'T5 primaryMatchesGroup function definida');

assert(/const matchCandidates = rawCandidates\.filter\(c => primaryMatchesGroup\(c, g\)\);/.test(html),
  'T6 filter hard: si hay suficientes matchs, usar solo match');

assert(/const candidates = matchCandidates\.length >= exPerGroup \? matchCandidates : rawCandidates;/.test(html),
  'T7 fallback a rawCandidates si escasez KB');

assert(/const aMatch = primaryMatchesGroup\(a, g\) \? 1 : 0;/.test(html),
  'T8 sort priority por primary match (tiebreaker)');

console.log('\nPASS: ' + pass + ' · FAIL: ' + fail);
process.exit(fail > 0 ? 1 : 0);
