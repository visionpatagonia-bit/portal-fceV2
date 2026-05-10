// =====================================================================
// smoke_hotfix_d1.js · Sprint 1.6 D1 HOTFIX v3 · 2026-05-10 tarde
// Valida 3 fixes raíz tras user feedback:
//   1. pointer-events:none en thumb wrapper + img (click pasa al .ex-row)
//   2. Dark mode .level-N (no -lN) renderiza badges L1-L5 correctamente
//   3. Badge .nx-ext-badge tiene glow en dark mode para contraste
// Asserts: 11
// =====================================================================

const fs = require('fs');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';
const JSON_PATH = process.env.NX_JSON_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/deploy_qa/public/exercises_extended.json';

let pass = 0, fail = 0;
function assert(cond, label, expected, actual){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + '\n    expected: ' + JSON.stringify(expected) + '\n    actual:   ' + JSON.stringify(actual)); }
}

console.log('[smoke_hotfix_d1] HTML: ' + HTML_PATH);
const html = fs.readFileSync(HTML_PATH, 'utf8');

// === T1: pointer-events:none en wrapper div del thumb (mobile click fix) ===
assert(/place-items:center;pointer-events:none">/.test(html),
  'T1 thumb wrapper div tiene pointer-events:none', 'truthy', 'check');

// === T2: pointer-events:none en img tag ===
assert(/object-fit:cover;display:block;pointer-events:none"\/>/.test(html),
  'T2 thumb img tiene pointer-events:none', 'truthy', 'check');

// === T3: addToDay NO usa strip (revertido a v2 · bundle YA tiene yuhonas_ prefix) ===
assert(!html.includes('exId.startsWith("yuhonas_") ? exId.slice'),
  'T3 addToDay NO strip prefix (revert · bundle tiene prefix nativo)', 'no strip', 'check');

// === T4-T8: Dark mode rules .level-N (no -l prefix) ===
for(let i = 1; i <= 5; i++){
  const hasRule = new RegExp(`html\\.dark[^{]*\\.level-${i}\\b`).test(html);
  assert(hasRule, `T${3+i} dark mode regla para .level-${i}`, 'truthy', hasRule);
}

// === T9: !important en dark .level-N para override light ===
assert(/\.level-1\{background:rgba\(34,197,94,\.22\)!important/.test(html),
  'T9 dark .level-1 con !important', 'truthy', 'check');

// === T10: nx-ext-badge class aplicada ===
assert(/class="nx-ext-badge"[\s\S]*?EXT/.test(html),
  'T10 badge EXT tiene class="nx-ext-badge"', 'truthy', 'check');

// === T11: Dark .nx-ext-badge tiene glow ===
assert(/html\.dark \.nx-ext-badge\{box-shadow:[^}]*?rgba\(14,165,233/.test(html),
  'T11 dark .nx-ext-badge tiene glow azul', 'truthy', 'check');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
