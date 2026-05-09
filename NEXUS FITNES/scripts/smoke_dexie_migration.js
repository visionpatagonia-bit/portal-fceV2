// =====================================================================
// smoke_dexie_migration.js · Sprint 1 Stack A · Día 1
// =====================================================================
// Valida la migración automática de nxBackupStore (custom IDB con DB
// 'nexus_fitness_backup') al wrapper NX_DEXIE (DB 'nexus_fitness_v1').
//
// Setup deps (en /tmp/nexus_smoke o similar con escritura):
//   npm i jsdom fake-indexeddb dexie
//
// Run:
//   NODE_PATH=/tmp/nexus_smoke/node_modules node smoke_dexie_migration.js
// =====================================================================
require('fake-indexeddb/auto');

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_PATH = path.resolve(__dirname, '../dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');
const DEXIE_SOURCE = fs.readFileSync(require.resolve('dexie/dist/dexie.min.js'), 'utf8');

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
  win.indexedDB = globalThis.indexedDB;
  win.IDBKeyRange = globalThis.IDBKeyRange;

  await new Promise(r => setTimeout(r, 2500));
  win.eval(DEXIE_SOURCE);
  if(!win.Dexie){ console.error("✗ Dexie no inyectado"); process.exit(1); }

  let pass = 0, fail = 0;
  const log = (ok, name, detail) => {
    if(ok){ pass++; console.log("  ✓ " + name + (detail ? " · " + detail : "")); }
    else  { fail++; console.log("  ✗ " + name + (detail ? " · " + detail : "")); }
  };

  console.log("═══════════════════════════════════════════════════════════");
  console.log(" SMOKE DEXIE MIGRATION · nxBackupStore → NX_DEXIE");
  console.log("═══════════════════════════════════════════════════════════\n");

  // --- Setup · poblar nxBackupStore con datos sintéticos ---
  if(!win.nxBackupStore){
    console.error("✗ nxBackupStore no expuesto · revisar HTML");
    process.exit(1);
  }

  const seed = {
    nx_clients: { joaquin: { id: "joaquin", name: "Joaquín M.", age: 25 }},
    nx_routines: { joaquin: [{ id: "r1", days: 3 }] },
    nx_history: [{ session: "s1", clientId: "joaquin" }],
    nx_templates: { presets: ["musc_int", "musc_avz"] },
    nx_attendance: { joaquin: { "2026-05-01": true, "2026-05-03": true } },
    nx_progression: { joaquin: { sentadilla: [60, 65, 70] } },
    nx_client_prefs: { joaquin: { unit: "kg", lang: "es" } },
    nx_streak: { joaquin: 7 },
    nx_audio_guide: "1",
    nx_dark_mode: "0",
  };

  for(const [k, v] of Object.entries(seed)){
    await win.nxBackupStore.put(k, v);
  }
  const seededCount = (await win.nxBackupStore.keys()).length;
  log(seededCount === Object.keys(seed).length,
      "nxBackupStore seeded", seededCount + " keys (legacy custom IDB)");

  // --- Reset NX_DEXIE para forzar migration desde scratch ---
  await win.NX_DEXIE._resetForTest();
  const beforeCount = (await win.NX_DEXIE.keys()).length;
  log(beforeCount === 0, "NX_DEXIE pre-migration vacío", "" + beforeCount + " keys");

  // --- Trigger migration · primer get fuerza _nxDexieGetDb que invoca migration ---
  // (la migration solo corre si count === 0 al primer init)
  // Hack: forzar reset del singleton para re-trigger init
  win.eval("_nxDexieInstance = null;");
  await win.NX_DEXIE.get("_trigger_init"); // primer get fuerza init + migration

  // --- Validar migration ---
  const migratedKeys = await win.NX_DEXIE.keys();
  const migratedSnap = await win.NX_DEXIE.snapshot();
  log(migratedKeys.length === Object.keys(seed).length,
      "migration · counts match", seededCount + " seed → " + migratedKeys.length + " migrated");

  // Sample 5 keys aleatorios · validar contenido idéntico
  const samples = ["nx_clients", "nx_routines", "nx_attendance", "nx_streak", "nx_audio_guide"];
  let contentOk = 0;
  for(const k of samples){
    const original = seed[k];
    const migrated = migratedSnap[k];
    const match = JSON.stringify(original) === JSON.stringify(migrated);
    if(match) contentOk++;
    else console.log("    DIFF en " + k + " · original=" + JSON.stringify(original) + " · migrated=" + JSON.stringify(migrated));
  }
  log(contentOk === samples.length,
      "migration · content match en samples", contentOk + "/" + samples.length);

  // --- Validar campos CRDT presentes ---
  const allRecords = await win.NX_DEXIE._allRecords();
  const allHaveUpdatedAt = allRecords.every(r => typeof r._updated_at === "string");
  const allHaveVersion = allRecords.every(r => typeof r._version === "number" && r._version >= 1);
  const allHaveDeleted = allRecords.every(r => r._deleted === 0 || r._deleted === false);
  log(allHaveUpdatedAt, "migration · todos con _updated_at", "" + allRecords.length + " records");
  log(allHaveVersion, "migration · todos con _version >= 1");
  log(allHaveDeleted, "migration · todos con _deleted=0 (nada eliminado)");

  // --- Re-migration NO sobreescribe (idempotencia) ---
  // Modificar un valor en NX_DEXIE · re-correr migration · valor NO debe revertir
  await win.NX_DEXIE.put("nx_streak", { joaquin: 999, modified: true });
  win.eval("_nxDexieInstance = null;"); // forzar re-init
  await win.NX_DEXIE.get("_trigger");
  const afterReinit = await win.NX_DEXIE.get("nx_streak");
  log(afterReinit.modified === true && afterReinit.joaquin === 999,
      "re-migration es idempotente", "valor modificado preservado · NO se sobrescribe con seed");

  // --- nxBackupStore viejo NO se borra (fallback disponible) ---
  const legacyStillThere = await win.nxBackupStore.has("nx_clients");
  log(legacyStillThere === true,
      "nxBackupStore legacy preservado", "fallback disponible si Dexie falla");

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
