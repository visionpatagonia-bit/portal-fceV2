// =====================================================================
// smoke_hotfix_d1_v5.js · Sprint 1.6 D1 HOTFIX v5 · 2026-05-10 tarde ronda 3
// Valida fixes raíz tras feedback Juan ronda 3 (4ta iteración dark mode):
//   1. addToDay push incluye imagen_thumb + default_* + primary_muscles
//   2. rerenderRoutineFromState usa thumbnail si EXT (no solo groupIcon)
//   3. Banner amarillo "Rutina con ediciones manuales" con class .nx-warn-banner
//   4. Dark mode audit sistemático · 7+ reglas nuevas (banner / tag-warn / refuse / sortable)
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

console.log('[smoke_hotfix_d1_v5] HTML: ' + HTML_PATH);
const html = fs.readFileSync(HTML_PATH, 'utf8');

// === T1: addToDay persiste imagen_thumb en exData ===
assert(/imagen_thumb: newEx\.imagen_thumb \|\| null/.test(html),
  'T1 addToDay incluye imagen_thumb en push exData', 'truthy', 'check');

// === T2: addToDay también persiste default_sets/reps/rest (para fallback render) ===
assert(/default_sets: newEx\.default_sets, default_reps: newEx\.default_reps/.test(html),
  'T2 addToDay persiste default_sets/reps/rest_seconds en exData', 'truthy', 'check');

// === T3: rerenderRoutineFromState usa thumbnail si disponible ===
assert(/_exIcon = \(exData\.imagen_thumb \|\| e\.imagen_thumb\)/.test(html),
  'T3 rerenderRoutineFromState usa imagen_thumb (de exData o e)', 'truthy', 'check');

// === T4: Render thumb con pointer-events:none + onerror fallback ===
assert(/_exIcon[\s\S]{0,500}?onerror="this\.parentElement\.innerHTML=this\.dataset\.fallback"/.test(html),
  'T4 thumb en rutina tiene onerror fallback graceful', 'truthy', 'check');

// === T5: Banner amarillo con class .nx-warn-banner ===
assert(/class='nx-warn-banner'[\s\S]{0,200}?background:#fef3c7/.test(html),
  'T5 banner amarillo "Rutina con ediciones manuales" tiene class nx-warn-banner', 'truthy', 'check');

// === T6: Banner amarillo light tiene color explícito (#854D0E) ===
assert(/class='nx-warn-banner'[\s\S]{0,200}?color:#854D0E/.test(html),
  'T6 banner amarillo light · color explícito (no default) para contraste base', 'truthy', 'check');

// === T7: Dark mode .nx-warn-banner rule presente ===
assert(/html\.dark \.nx-warn-banner\{background:rgba\(245,158,11,\.15\)!important/.test(html),
  'T7 dark .nx-warn-banner con bg amber alpha + color claro', 'truthy', 'check');

// === T8: Dark mode .tag-warn rule presente ===
assert(/html\.dark \.tag-warn\{background:rgba\(245,158,11,\.2\)/.test(html),
  'T8 dark .tag-warn (manual/sustituido) con bg amber rgba', 'truthy', 'check');

// === T9: Dark mode .refuse-banner rule presente ===
assert(/html\.dark \.refuse-banner\{background:rgba\(220,38,38,\.12\)/.test(html),
  'T9 dark .refuse-banner con bg red alpha', 'truthy', 'check');

// === T10: Dark mode sortable visual rules ===
assert(/html\.dark \.sortable-ghost,html\.dark \.sortable-chosen/.test(html),
  'T10 dark sortable-ghost + sortable-chosen sin bg blanco', 'truthy', 'check');

// === T11: Dark mode age-band-tag.juvenil ===
assert(/html\.dark \.age-band-tag\.juvenil\{background:rgba\(245,158,11/.test(html),
  'T11 dark age-band-tag.juvenil con bg amber rgba', 'truthy', 'check');

// === T12: Comentario AUDIT SISTEMATICO presente (traceability) ===
assert(/AUDIT SISTEMATICO dark mode/.test(html),
  'T12 comentario "AUDIT SISTEMATICO dark mode" (traceability)', 'truthy', 'check');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
