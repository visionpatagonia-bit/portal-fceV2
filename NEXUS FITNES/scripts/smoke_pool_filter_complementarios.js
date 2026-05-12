// =====================================================================
// smoke_pool_filter_complementarios.js · v2028.32 · 2026-05-11
// Sprint Bloque A · Día 1 · post-feedback Ariel reunión NICO + Michael
// Valida pool filter del motor adaptativo:
//   1. Movilidad NO entra a mains
//   2. pattern=stretch NO entra a mains
//   3. Ejercicios con sufijo "(EN)" NO entran a mains
// + Valida que apartado "Ejercicios complementarios opcionales" existe en PDF
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

// === T1: comentario v2028.32 traceability ===
assert(/v2028\.32 · CRÍTICO post-feedback Ariel reunión 2026-05-11/.test(html),
  'T1 comentario v2028.32 traceability post-feedback Ariel');

// === T2: filter Movilidad presente en pickDayExercises ===
assert(/if\(e\.group === "Movilidad"\) return false;/.test(html),
  'T2 filter Movilidad → return false');

// === T3: filter stretch pattern presente ===
assert(/if\(e\.pattern === "stretch"\) return false;/.test(html),
  'T3 filter pattern=stretch → return false');

// === T4: filter (EN) sufijo presente ===
assert(/nameStr\.endsWith\("\(EN\)"\)/.test(html),
  'T4 filter sufijo (EN) → return false');

// === T5: apartado complementarios opcionales en PDF ===
assert(/EJERCICIOS COMPLEMENTARIOS OPCIONALES/.test(html),
  'T5 apartado "Ejercicios complementarios opcionales" en PDF Anubis');

// === T6: subtítulo apartado · "NO forman parte de la rutina principal" ===
assert(/NO forman parte de la rutina principal/.test(html),
  'T6 subtítulo · NO forman parte de la rutina principal');

// === T7: complementariosSugeridos function array ===
assert(/var complementariosSugeridos = \(EX \|\| \[\]\)\.filter/.test(html),
  'T7 complementariosSugeridos array desde EX');

// === T8: page break antes del apartado para separación visual ===
assert(/pageBreak: 'before'/.test(html),
  'T8 pageBreak before apartado complementarios');

// === T9: version badge actualizado v2028.32 ===
assert(/NX_MOTOR_VERSION = "v2028\.32"/.test(html),
  'T9 version badge v2028.32');

// === T10: style filter condicional (Día 3 correction) ===
assert(/isCrossfitOrPower && !goalAllowsCrossfit && !exStyles\.includes\("general"\)/.test(html),
  'T10 lógica condicional crossfit/potencia en motor');

// === T11: requires_specific_equipment filter ===
assert(/e\.requires_specific_equipment === true/.test(html),
  'T11 filter requires_specific_equipment activo');

// === T12: style field presente en entries ===
assert(/"style":\s*\["general"\]/.test(html) || /"style":\s*\["potencia"/.test(html),
  'T12 field style presente en entries del catálogo');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
