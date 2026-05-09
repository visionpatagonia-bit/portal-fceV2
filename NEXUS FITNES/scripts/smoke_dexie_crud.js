// =====================================================================
// smoke_dexie_crud.js · Sprint 1 Stack A · Día 1
// =====================================================================
// Valida CRUD básico del wrapper NX_DEXIE: put, get, has, keys, snapshot,
// restore, softDelete. Verifica schema CRDT-ready (timestamps + version
// + tombstones). Corre headless sobre el HTML real con jsdom + fake-indexeddb.
//
// Setup deps (en /tmp/nexus_smoke o similar con escritura):
//   npm i jsdom fake-indexeddb
//
// Run:
//   node smoke_dexie_crud.js
// =====================================================================
// Auto-inyecta fake-indexeddb en globalThis · cubre todo el process
require('fake-indexeddb/auto');

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_PATH = path.resolve(__dirname, '../dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');

// Precargar Dexie 4.0.10 desde node_modules (NO lazy-load via CDN · jsdom es offline)
let DEXIE_SOURCE = '';
try {
  const dexiePath = require.resolve('dexie/dist/dexie.min.js');
  DEXIE_SOURCE = fs.readFileSync(dexiePath, 'utf8');
} catch(e){
  console.error("[setup] dexie no instalado · ejecutar: npm i dexie@4.0.10");
  process.exit(1);
}

async function main(){
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    url: "http://localhost/",
  });
  const win = dom.window;
  win.URL.createObjectURL = () => "blob:fake";
  win.URL.revokeObjectURL = () => {};

  // Inyectar fake-indexeddb en window también (jsdom usa su propio window)
  win.indexedDB = globalThis.indexedDB;
  win.IDBKeyRange = globalThis.IDBKeyRange;

  // Esperar a que el HTML inicialice + scripts internos
  await new Promise(r => setTimeout(r, 2500));

  // Precargar Dexie en window · sustituye el lazy-load via CDN
  win.eval(DEXIE_SOURCE);
  if(!win.Dexie){
    console.error("✗ Dexie no se inyectó en window tras eval");
    process.exit(1);
  }

  if(!win.NX_DEXIE){
    console.error("✗ NX_DEXIE no se expuso en window · revisar inserción del wrapper");
    process.exit(1);
  }

  let pass = 0, fail = 0;
  const log = (ok, name, detail) => {
    if(ok){ pass++; console.log("  ✓ " + name + (detail ? " · " + detail : "")); }
    else  { fail++; console.log("  ✗ " + name + (detail ? " · " + detail : "")); }
  };

  console.log("═══════════════════════════════════════════════════════════");
  console.log(" SMOKE DEXIE CRUD · Sprint 1 Stack A Día 1");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Reset previo · sandbox limpio
  await win.NX_DEXIE._resetForTest();

  // Test 1 · put + get básico
  await win.NX_DEXIE.put("test_key", { hello: "world", n: 42 });
  const got = await win.NX_DEXIE.get("test_key");
  log(got && got.hello === "world" && got.n === 42, "put + get básico", JSON.stringify(got));

  // Test 2 · has retorna boolean
  const hasIt = await win.NX_DEXIE.has("test_key");
  const hasNot = await win.NX_DEXIE.has("doesnt_exist");
  log(hasIt === true && hasNot === false, "has()", "exists=" + hasIt + " · missing=" + hasNot);

  // Test 3 · keys() lista las keys vivas
  await win.NX_DEXIE.put("a", 1);
  await win.NX_DEXIE.put("b", 2);
  await win.NX_DEXIE.put("c", 3);
  const keys = await win.NX_DEXIE.keys();
  const expectedKeys = ["test_key", "a", "b", "c"];
  const allPresent = expectedKeys.every(k => keys.includes(k));
  log(allPresent && keys.length === 4, "keys()", keys.length + " keys: " + JSON.stringify(keys));

  // Test 4 · snapshot() · todas las keys + values
  const snap = await win.NX_DEXIE.snapshot();
  log(snap.a === 1 && snap.b === 2 && snap.c === 3 && snap.test_key.hello === "world",
      "snapshot()", "keys: " + Object.keys(snap).length);

  // Test 5 · CRDT _version se incrementa al put repetido
  const recs1 = await win.NX_DEXIE._allRecords();
  const a1 = recs1.find(r => r.key === "a");
  await win.NX_DEXIE.put("a", 99);
  const recs2 = await win.NX_DEXIE._allRecords();
  const a2 = recs2.find(r => r.key === "a");
  log(a1._version === 1 && a2._version === 2 && a2.value === 99,
      "_version CRDT incrementa", "v" + a1._version + " → v" + a2._version);

  // Test 6 · _updated_at ISO timestamp en cada record
  const allUpdatedAt = recs2.every(r => typeof r._updated_at === "string" && /T.*Z/.test(r._updated_at));
  log(allUpdatedAt, "_updated_at ISO timestamp", recs2.length + " records · todos con _updated_at");

  // Test 7 · softDelete · _deleted=1 · NO se borra fisicamente
  await win.NX_DEXIE.softDelete("b");
  const bAfter = await win.NX_DEXIE.get("b");
  const recs3 = await win.NX_DEXIE._allRecords();
  const b3 = recs3.find(r => r.key === "b");
  log(bAfter === null && b3 && b3._deleted === 1 && b3._version === 2,
      "softDelete()", "get devuelve null · record persiste con _deleted=1 · _version incrementó");

  // Test 8 · keys() y snapshot() ignoran soft-deleted
  const keysAfter = await win.NX_DEXIE.keys();
  const snapAfter = await win.NX_DEXIE.snapshot();
  log(!keysAfter.includes("b") && !("b" in snapAfter),
      "soft-deleted invisible para keys/snapshot", "b NO en keys ni en snapshot");

  // Test 9 · restore() bulk
  await win.NX_DEXIE._resetForTest();
  const restored = await win.NX_DEXIE.restore({
    foo: "bar",
    baz: { nested: true },
    num: 123,
  });
  const snapRest = await win.NX_DEXIE.snapshot();
  log(restored === true && snapRest.foo === "bar" && snapRest.num === 123,
      "restore() bulk", JSON.stringify(snapRest));

  // Test 10 · API pública compatible con nxBackupStore (audit del contract)
  const expectedAPI = ["put", "get", "has", "keys", "snapshot", "restore"];
  const missingAPI = expectedAPI.filter(m => typeof win.NX_DEXIE[m] !== "function");
  log(missingAPI.length === 0, "API pública compatible nxBackupStore",
      "expected: " + expectedAPI.join(", ") + (missingAPI.length ? " · MISSING: " + missingAPI.join(", ") : ""));

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(" RESUMEN: " + pass + " OK · " + fail + " FAIL · total " + (pass + fail));
  console.log("═══════════════════════════════════════════════════════════");
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => {
  console.error("FATAL:", e.message);
  console.error(e.stack);
  process.exit(1);
});
