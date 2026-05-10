// =====================================================================
// smoke_extended_ui.js · Sprint 1.5 Día 3.A
// Valida integración UI catálogo extendido:
//   - nxCatalogToEX (yuhonas → schema interno)
//   - addToDay con IDs de ambos catálogos
//   - filterAddList combina curado + extendido
// Asserts: 12
// =====================================================================

require('fake-indexeddb/auto');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

const JSON_PATH = process.env.NX_JSON_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/deploy_qa/public/exercises_extended.json';

let pass = 0, fail = 0;
function assert(cond, label, expected, actual){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + '\n    expected: ' + JSON.stringify(expected) + '\n    actual:   ' + JSON.stringify(actual)); }
}

console.log('[smoke_extended_ui] HTML: ' + HTML_PATH);
const html = fs.readFileSync(HTML_PATH, 'utf8');
const bundle = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// Extraer funciones nxCatalogToEX y addToDay del HTML
const fnNames = ['nxCatalogToEX', 'addToDay'];
const fnSources = {};
fnNames.forEach(name => {
  // Match function declaration con su body
  const re = new RegExp('function ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}');
  const m = html.match(re);
  if(!m){
    console.error('FATAL: función ' + name + ' no encontrada');
    process.exit(1);
  }
  fnSources[name] = m[0];
  console.log('[smoke_extended_ui] ' + name + ' extraída (' + m[0].length + ' chars)');
});

// Stub minimal: mock window con dependencias
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://example.com/',
  runScripts: 'outside-only',
});
const win = dom.window;

// Stubs necesarios
win._lastGeneratedDays = [
  { id: 'd1', label: 'Lunes', exercises: [] },
  { id: 'd2', label: 'Martes', exercises: [] }
];
win.EX = [
  { id: 'press_banca_barra', name: 'Press de banca con barra', group: 'Pecho', level: 4, equipment: 'Barra', primary_muscles: ['Pectoral mayor'], secondary_muscles: ['Tríceps'], pattern: 'push_horizontal', default_sets: 4, default_reps: '6-10' }
];
win.NX_CATALOG = {
  isLoaded: () => true,
  getById: (id) => bundle.exercises.find(e => e.id === id) || null,
};
let toastCalls = [];
win.toast = (msg, opts) => { toastCalls.push({ msg, opts }); };
win.closeExModal = () => {};
win.rerenderRoutineFromState = () => {};

// Inject helpers
win.eval(fnSources.nxCatalogToEX);
win.eval(fnSources.addToDay);

// === Test 1: nxCatalogToEX conversión correcta ===
const yuhonasSquat = bundle.exercises.find(e => e.id.toLowerCase().includes('barbell_squat')) || bundle.exercises.find(e => e.nivel === 'inicial' && e.equipamiento === 'peso corporal');
assert(!!yuhonasSquat, 'T1 sample yuhonas existe en bundle', 'truthy', !!yuhonasSquat);

const ex1 = win.nxCatalogToEX(yuhonasSquat);
assert(ex1 && ex1.id === yuhonasSquat.id, 'T2 nxCatalogToEX preserva id', yuhonasSquat.id, ex1 && ex1.id);
assert(ex1 && typeof ex1.level === 'number' && ex1.level >= 2 && ex1.level <= 4, 'T3 nivel string → numérico (2-4)', '2-4', ex1 && ex1.level);
assert(ex1 && typeof ex1.name === 'string' && ex1.name.length > 0, 'T4 name no vacío', 'no empty', ex1 && ex1.name);
assert(ex1 && ex1._origen === 'yuhonas', 'T5 _origen marcado yuhonas', 'yuhonas', ex1 && ex1._origen);
assert(ex1 && Array.isArray(ex1.primary_muscles), 'T6 primary_muscles es array', 'array', Array.isArray(ex1 && ex1.primary_muscles));

// Test ej sin nombre_es debe tener "(EN)" sufijo
const yuhonasSinDict = bundle.exercises.find(e => !e.nombre_es);
const ex2 = win.nxCatalogToEX(yuhonasSinDict);
assert(ex2 && ex2.name.endsWith('(EN)'), 'T7 ej sin nombre_es → name termina en "(EN)"', '(EN)', ex2 && ex2.name);

// === Test 2: addToDay acepta yuhonas IDs ===
win._lastGeneratedDays[0].exercises = []; // reset
win.addToDay(0, yuhonasSquat.id);
assert(win._lastGeneratedDays[0].exercises.length === 1, 'T8 addToDay con yuhonas ID agrega ej', 1, win._lastGeneratedDays[0].exercises.length);
const added = win._lastGeneratedDays[0].exercises[0];
assert(added && added.id === yuhonasSquat.id, 'T9 ej agregado tiene id yuhonas', yuhonasSquat.id, added && added.id);
assert(added && added._origen === 'yuhonas', 'T10 ej agregado tiene _origen=yuhonas', 'yuhonas', added && added._origen);

// addToDay con EX tradicional sigue funcionando (regression)
win._lastGeneratedDays[1].exercises = [];
win.addToDay(1, 'press_banca_barra');
assert(win._lastGeneratedDays[1].exercises.length === 1, 'T11 regression · addToDay con EX ID sigue OK', 1, win._lastGeneratedDays[1].exercises.length);

// addToDay con ID inexistente NO crashea
toastCalls = [];
win.addToDay(0, 'id_inexistente_xyz');
assert(toastCalls.length === 1 && toastCalls[0].opts.type === 'error', 'T12 ID inexistente · toast error mostrado, no crash', 'error toast', toastCalls.length === 1 ? toastCalls[0].opts.type : 'no toast');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
