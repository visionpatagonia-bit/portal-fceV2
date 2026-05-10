// =====================================================================
// smoke_student_enhancements.js · Sprint 2 D2
// Valida enhancements vista alumna:
//   - nxRenderStudentEnhancements existe en HTML
//   - CTA "Ver mi rutina del día" se inyecta en student-mode
//   - Footer brand Anubis se inyecta una sola vez
//   - Microcopy contextual según hora del día
//   - nxScrollToRoutine handler global
//   - Fix bug install button (setTimeout en detectStudentUrl)
// Asserts: 9
// =====================================================================

const fs = require('fs');
const path = require('path');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label, expected, actual){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + '\n    expected: ' + JSON.stringify(expected) + '\n    actual:   ' + JSON.stringify(actual)); }
}

console.log('[smoke_student_enhancements] HTML: ' + HTML_PATH);
const html = fs.readFileSync(HTML_PATH, 'utf8');

// === T1: función nxRenderStudentEnhancements existe ===
assert(html.includes('function nxRenderStudentEnhancements(client)'), 'T1 nxRenderStudentEnhancements definida', 'function declaration', 'check');

// === T2: detectStudentUrl llama nxRenderStudentEnhancements post-render ===
assert(/nxRenderStudentEnhancements\(c\)/.test(html), 'T2 detectStudentUrl invoca nxRenderStudentEnhancements(c)', 'invocation', 'check');

// === T3: CTA "Ver mi rutina del día" presente ===
assert(html.includes('Ver mi rutina del día') && html.includes('nx-student-cta'), 'T3 CTA "Ver mi rutina del día" + id nx-student-cta', 'truthy', 'check');

// === T4: Footer brand Anubis ===
assert(html.includes('nx-student-footer') && html.includes('Anubis Athletic Center'), 'T4 Footer brand Anubis Athletic Center con id nx-student-footer', 'truthy', 'check');

// === T5: Microcopy contextual según hora ===
assert(/Buen día.*Buenas tardes.*Buenas noches/s.test(html), 'T5 microcopy contextual (mañana/tarde/noche)', 'all 3 greetings', 'check');

// === T6: nxScrollToRoutine handler global ===
assert(html.includes('window.nxScrollToRoutine = function'), 'T6 window.nxScrollToRoutine handler global', 'truthy', 'check');

// === T7: Fix bug install button (setTimeout 500ms) ===
assert(/if\(!standalone\)\{[\s\S]*?setTimeout\(\(\)\s*=>\s*\{[\s\S]*?if\(!window\.NX_PWA\)\s*return;/.test(html), 'T7 fix install button · setTimeout defer + early-return si NX_PWA no listo', 'truthy', 'check');

// === T8: idempotencia · CTA y Footer solo se inyectan una vez ===
assert(html.includes("!document.getElementById(\"nx-student-cta\")") || html.includes("!document.getElementById('nx-student-cta')"), 'T8 CTA: check existing antes de inyectar (idempotente)', 'truthy', 'check');
assert(html.includes("!document.getElementById(\"nx-student-footer\")") || html.includes("!document.getElementById('nx-student-footer')"), 'T9 Footer: check existing antes de inyectar (idempotente)', 'truthy', 'check');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
