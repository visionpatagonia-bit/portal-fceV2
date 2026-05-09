// =====================================================================
// smoke_h4_h5.js · Sprint 1.5 Día 2
// Valida fixes H4 (resolveContext Path 3 Vista Alumno) y H5 (safeText ZWNJ)
//
// Ejecución:
//   cd /tmp/sprint1_5_smoke
//   cp ../portal_v19.3.0/NEXUS\ FITNES/scripts/smoke_h4_h5.js .
//   node smoke_h4_h5.js
//
// Asserts: 12 (3 H5 + 9 H4)
// =====================================================================

require('fake-indexeddb/auto');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label, expected, actual){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + '\n    expected: ' + JSON.stringify(expected) + '\n    actual:   ' + JSON.stringify(actual)); }
}

console.log('[smoke_h4_h5] Loading HTML from: ' + HTML_PATH);
const html = fs.readFileSync(HTML_PATH, 'utf8');

// Extraer función safeText con regex (parser-light)
// Buscamos el bloque function safeText(s){...}
const safeTextMatch = html.match(/function safeText\(s\)\{[\s\S]*?\n\s*\}/);
if(!safeTextMatch){
  console.error('FATAL: no se encontró function safeText() en el HTML');
  process.exit(1);
}
const safeTextSrc = safeTextMatch[0];
console.log('[smoke_h4_h5] safeText source extraído (' + safeTextSrc.length + ' chars)');

// Eval seguro en sandbox
const safeTextFn = new Function('return ' + safeTextSrc.replace('function safeText', 'function _st'))();

console.log('\n=== H5 · safeText debe insertar U+200C (ZWNJ) entre f y i/l ===');

// H5.1 · safeText('tonificación') debe contener U+200C entre f e i
const r1 = safeTextFn('tonificación');
const hasZWNJ_1 = r1.charCodeAt(r1.indexOf('f') + 1) === 0x200C;
assert(hasZWNJ_1, 'H5.1 safeText("tonificación") inserta ZWNJ post-f', '0x200C', '0x' + r1.charCodeAt(r1.indexOf('f') + 1).toString(16));

// H5.2 · safeText('flexiones') debe contener U+200C entre f y l
const r2 = safeTextFn('flexiones');
const hasZWNJ_2 = r2.charCodeAt(r2.indexOf('f') + 1) === 0x200C;
assert(hasZWNJ_2, 'H5.2 safeText("flexiones") inserta ZWNJ post-f', '0x200C', '0x' + r2.charCodeAt(r2.indexOf('f') + 1).toString(16));

// H5.3 · safeText NO debe insertar U+200B (ZWSP · char anterior buggy)
const allChars = safeTextFn('tonificación flexiones').split('').map(c => c.charCodeAt(0));
const hasZWSP = allChars.some(c => c === 0x200B);
assert(!hasZWSP, 'H5.3 safeText NO contiene U+200B (regression check)', false, hasZWSP);

console.log('\n=== H4 · resolveContext Path 3 cubre Vista Alumno por URL ===');

// Para H4 montamos el HTML completo en jsdom y verificamos resolveContext()
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://example.com/?student=cliente_demo_1',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const win = dom.window;

// Stub mínimo de STATE (escenario: rutina persistida por coach previamente)
win.STATE = {
  clients: [
    { id: 'cliente_demo_1', name: 'Luz Pérez' },
    { id: 'cliente_demo_2', name: 'Susana Gómez' }
  ],
  routines: {
    'cliente_demo_1': [
      {
        generated_at: '2026-05-09T18:00:00Z',
        days: [{ id: 'd1', label: 'Lunes', exercises: [{ id: 'sentadilla', name: 'Sentadilla' }] }],
        gp_meta: { sets: 3, reps: '10-12' },
        profile_snapshot: { goal: 'tonification', level: 'intermediate' }
      }
    ]
  },
  // CRITICAL: NO seteamos currentClient → simulamos race condition Vista Alumno
  currentClient: undefined
};
win.EX = [];
// Slugify real del HTML (con NFD normalize · remueve diacríticos)
win.slugify = function(s){
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,30) || "cliente_"+Date.now();
};

// Extraer resolveContext del HTML
const resolveCtxMatch = html.match(/function resolveContext\(\)\{[\s\S]*?\n\s{2}\}/);
if(!resolveCtxMatch){
  console.error('FATAL: no se encontró function resolveContext() en el HTML');
  process.exit(1);
}
const resolveCtxSrc = resolveCtxMatch[0];
console.log('[smoke_h4_h5] resolveContext source extraído (' + resolveCtxSrc.length + ' chars)');

// Inyectar al window y ejecutar
win.eval('var STATE = this.STATE; var EX = this.EX; var slugify = this.slugify; ' + resolveCtxSrc + '; this._resolveContext = resolveContext;');

// H4.1 · Path 3 detecta cliente por ?student=ID aunque STATE.currentClient sea undefined
const ctx1 = win._resolveContext();
assert(ctx1.client && ctx1.client.id === 'cliente_demo_1', 'H4.1 Vista Alumno · client detectado por URL', 'cliente_demo_1', ctx1.client && ctx1.client.id);
assert(ctx1.routine !== null && ctx1.routine !== undefined, 'H4.2 Vista Alumno · routine recuperada de STATE.routines', 'truthy', ctx1.routine);
assert(ctx1.routine && Array.isArray(ctx1.routine.days), 'H4.3 Vista Alumno · routine.days es array', 'array', typeof ctx1.routine.days);
assert(ctx1.routine && ctx1.routine.days && ctx1.routine.days.length > 0, 'H4.4 Vista Alumno · routine.days no vacío', '> 0', ctx1.routine && ctx1.routine.days && ctx1.routine.days.length);

// H4.5 · Path 3 con slugify match (?student=luz_perez vs id=cliente_demo_1)
const dom2 = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'https://example.com/?student=luz_perez', runScripts: 'outside-only' });
const win2 = dom2.window;
win2.STATE = win.STATE;
win2.EX = [];
win2.slugify = win.slugify;
win2.eval('var STATE = this.STATE; var EX = this.EX; var slugify = this.slugify; ' + resolveCtxSrc + '; this._resolveContext = resolveContext;');
const ctx2 = win2._resolveContext();
assert(ctx2.client && ctx2.client.id === 'cliente_demo_1', 'H4.5 Vista Alumno · slugify match (luz_perez → Luz Pérez)', 'cliente_demo_1', ctx2.client && ctx2.client.id);

// H4.6 · Path 3 con ?view=cliente&id=ID (alias)
const dom3 = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'https://example.com/?view=cliente&id=cliente_demo_2', runScripts: 'outside-only' });
const win3 = dom3.window;
win3.STATE = {
  clients: win.STATE.clients,
  routines: { 'cliente_demo_2': [{ days: [{id: 'd1', exercises: []}] }] },
  currentClient: undefined
};
win3.EX = [];
win3.slugify = win.slugify;
win3.eval('var STATE = this.STATE; var EX = this.EX; var slugify = this.slugify; ' + resolveCtxSrc + '; this._resolveContext = resolveContext;');
const ctx3 = win3._resolveContext();
assert(ctx3.client && ctx3.client.id === 'cliente_demo_2', 'H4.6 Vista Alumno · alias view=cliente&id=ID', 'cliente_demo_2', ctx3.client && ctx3.client.id);

// H4.7 · Path 1 sigue funcionando (ficha cliente abierta normalmente)
const dom4 = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'https://example.com/', runScripts: 'outside-only' });
const win4 = dom4.window;
win4.STATE = {
  clients: win.STATE.clients,
  routines: win.STATE.routines,
  currentClient: 0  // ficha cliente abierta normalmente (Path 1)
};
win4.EX = [];
win4.slugify = win.slugify;
win4.eval('var STATE = this.STATE; var EX = this.EX; var slugify = this.slugify; ' + resolveCtxSrc + '; this._resolveContext = resolveContext;');
const ctx4 = win4._resolveContext();
assert(ctx4.client && ctx4.client.id === 'cliente_demo_1' && ctx4.routine, 'H4.7 Path 1 cartera coach · sigue funcionando (regression check)', 'truthy', !!(ctx4.client && ctx4.routine));

// H4.8 · Sin URL ni STATE.currentClient ni _lastGeneratedRoutine → no falsos positivos
const dom5 = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'https://example.com/', runScripts: 'outside-only' });
const win5 = dom5.window;
win5.STATE = { clients: [], routines: {}, currentClient: undefined };
win5.EX = [];
win5.slugify = win.slugify;
win5.eval('var STATE = this.STATE; var EX = this.EX; var slugify = this.slugify; ' + resolveCtxSrc + '; this._resolveContext = resolveContext;');
const ctx5 = win5._resolveContext();
assert(!ctx5.client && !ctx5.routine, 'H4.8 Sin contexto · retorna null/null (no falsos positivos)', 'no client/routine', { client: !!ctx5.client, routine: !!ctx5.routine });

// H4.9 · URL ?student=ID con cliente que NO existe en STATE → no crash
const dom6 = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'https://example.com/?student=cliente_inexistente', runScripts: 'outside-only' });
const win6 = dom6.window;
win6.STATE = win.STATE;
win6.EX = [];
win6.slugify = win.slugify;
win6.eval('var STATE = this.STATE; var EX = this.EX; var slugify = this.slugify; ' + resolveCtxSrc + '; this._resolveContext = resolveContext;');
let didNotCrash = true;
try { win6._resolveContext(); } catch(e){ didNotCrash = false; console.error('  CRASH:', e.message); }
assert(didNotCrash, 'H4.9 URL student=ID inexistente · no crash', true, didNotCrash);

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
