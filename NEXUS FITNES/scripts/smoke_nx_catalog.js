// =====================================================================
// smoke_nx_catalog.js · Sprint 1.5 Día 3.A
// Valida wrapper NX_CATALOG (load/isLoaded/getAll/search/getById)
//
// Asserts: 14
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

console.log('[smoke_nx_catalog] HTML: ' + HTML_PATH);
console.log('[smoke_nx_catalog] JSON: ' + JSON_PATH);

const html = fs.readFileSync(HTML_PATH, 'utf8');
const bundle = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// Extract NX_CATALOG IIFE source
const m = html.match(/const NX_CATALOG = \(function\(\)\{[\s\S]*?\}\)\(\);[\s\S]*?window\.NX_CATALOG = NX_CATALOG;/);
if(!m){ console.error('FATAL: NX_CATALOG no encontrado en HTML'); process.exit(1); }
const nxCatalogSrc = m[0];
console.log('[smoke_nx_catalog] NX_CATALOG source extraído (' + nxCatalogSrc.length + ' chars)');

(async function run(){
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://example.com/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const win = dom.window;

  // Stub fetch que devuelve el bundle local
  win.fetch = async function(url){
    if(url.includes('exercises_extended.json')){
      return {
        ok: true,
        status: 200,
        json: async () => bundle,
      };
    }
    return { ok: false, status: 404 };
  };

  // Stub NX_DEXIE mínimo (memoria)
  const _kv = {};
  win.NX_DEXIE = {
    get: async (key) => _kv[key] || null,
    put: async (key, val) => { _kv[key] = val; return true; },
    has: async (key) => key in _kv,
    snapshot: async () => Object.assign({}, _kv),
  };
  win.NX_USE_DEXIE = true;
  win.performance = { now: () => Date.now() };

  // Inject NX_CATALOG
  win.eval(nxCatalogSrc);

  // === Test 1: estado inicial ===
  assert(typeof win.NX_CATALOG === 'object', 'T1 window.NX_CATALOG existe', 'object', typeof win.NX_CATALOG);
  assert(typeof win.NX_CATALOG.load === 'function', 'T2 NX_CATALOG.load es función', 'function', typeof win.NX_CATALOG.load);
  assert(win.NX_CATALOG.isLoaded() === false, 'T3 isLoaded() === false antes de load()', false, win.NX_CATALOG.isLoaded());
  assert(win.NX_CATALOG.getAll().length === 0, 'T4 getAll() === [] antes de load()', 0, win.NX_CATALOG.getAll().length);

  // === Test 2: primera carga (fetch path · Dexie vacío) ===
  const ok1 = await win.NX_CATALOG.load();
  assert(ok1 === true, 'T5 load() returns true en primer fetch', true, ok1);
  assert(win.NX_CATALOG.isLoaded() === true, 'T6 isLoaded() === true post-load', true, win.NX_CATALOG.isLoaded());
  assert(win.NX_CATALOG.getAll().length === 873, 'T7 getAll() retorna 873 ejercicios', 873, win.NX_CATALOG.getAll().length);

  // === Test 3: persistido en Dexie tras fetch ===
  const dexieEntry = await win.NX_DEXIE.get('exercises_extended_v1');
  assert(dexieEntry && Array.isArray(dexieEntry.exercises), 'T8 bundle persistido en Dexie', 'truthy', !!(dexieEntry && dexieEntry.exercises));
  assert(dexieEntry && dexieEntry.exercises.length === 873, 'T9 Dexie tiene 873 ej', 873, dexieEntry && dexieEntry.exercises.length);

  // === Test 4: search ===
  const r1 = win.NX_CATALOG.search('press');
  assert(r1.length > 5, 'T10 search("press") devuelve >5 ej', '> 5', r1.length);

  const r2 = win.NX_CATALOG.search('', { nivel: 'inicial' });
  assert(r2.length > 200, 'T11 filter nivel=inicial devuelve >200 ej', '> 200', r2.length);

  const r3 = win.NX_CATALOG.search('', { equipamiento: 'peso corporal' });
  assert(r3.length > 50, 'T12 filter equipamiento=peso corporal devuelve >50 ej', '> 50', r3.length);

  const r4 = win.NX_CATALOG.search('squat', { equipamiento: 'barra' });
  const todosTienenBarra = r4.every(e => e.equipamiento === 'barra');
  assert(todosTienenBarra, 'T13 search compuesto query+filter funciona', 'todos barra', r4.map(e => e.equipamiento).filter((v,i,a) => a.indexOf(v) === i));

  // === Test 5: getById ===
  const sample = win.NX_CATALOG.getAll()[0];
  const lookup = win.NX_CATALOG.getById(sample.id);
  assert(lookup && lookup.id === sample.id, 'T14 getById(id) retorna ej correcto', sample.id, lookup && lookup.id);

  console.log('\n=== RESULTADO ===');
  console.log('PASS: ' + pass);
  console.log('FAIL: ' + fail);
  console.log('TOTAL: ' + (pass + fail));
  process.exit(fail > 0 ? 1 : 0);
})();
