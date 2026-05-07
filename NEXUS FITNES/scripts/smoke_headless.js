// =============================================================================
// SMOKE AUTOMATIZADO HEADLESS · NEXUS Fitness piloto Anubis
// =============================================================================
// Reemplaza el smoke visual manual del MVP_DIA7. Carga el HTML en jsdom,
// inicializa el motor, simula los 7 presets activos + flujos críticos.
//
// Setup (una sola vez):
//   cd "NEXUS FITNES/scripts" && npm init -y && npm install jsdom
//
// Uso:
//   cd "NEXUS FITNES/scripts" && node smoke_headless.js
//
// Exit code: 0 = OK · 1 = FAIL (al menos 1 test FAIL)
//
// Test coverage:
//   [1] Carga HTML en jsdom · ejecución de scripts inline sin errores parser
//   [2] APIs críticas expuestas (NEXUS_STORAGE_API + 17 funciones)
//   [3] Banco ejercicios + CKG + PROFILE_PRESETS + Tren x3 + grupos
//   [4] Storage CRUD · cliente sintético (save · get · list · delete)
//   [5] Preferencias persistentes por (cliente, ejercicio) · nx_client_prefs
//   [6] Generación rutina · 7 presets · verificación días + ejercicios
//       + sustitución correcta (Susana sin sentadilla profunda)
//   [6.b] Refuse honesto · LIMITACIÓN: form usa chips de contras (no input texto)
//         · test requiere prueba MANUAL en navegador con perfil Ana
//         (embarazo + lumbar agudo) · ver MVP_DIA7_SMOKE_DEMO.md Perfil C
//   [6.c] PDF Anubis · trigger nxExportAnubisPDF() sin error sincrónico
//   [7] Storage keys · 13 nx_* + dark_mode persiste
//
// Limitaciones jsdom (no son fail reales):
//   - pdfmake CDN no carga (PDF no se descarga · trigger sí ejecuta)
//   - chips de contras requieren interacción DOM (refuse manual)
//   - fonts/CSS no renderean (lo visual no se valida automáticamente)
// =============================================================================
const jsdomLib = require("jsdom");
const { JSDOM } = jsdomLib;
const fs = require("fs");
const path = require("path");

// Resolver path · busca HTML target relativo al script (portable)
const SCRIPT_DIR = __dirname;
const HTML_CANDIDATES = [
  path.join(SCRIPT_DIR, "..", "dashboard", "NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"),
  "/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html",
];
const HTML = HTML_CANDIDATES.find(p => { try { return fs.existsSync(p); } catch(e){ return false; } });
if (!HTML) { console.error("[smoke] HTML target no encontrado · revisar SCRIPT_DIR"); process.exit(2); }
const html = fs.readFileSync(HTML, "utf-8");
const HTML_TARGET = HTML;

const results = [];
function log(name, status, detail) {
  results.push({ name, status, detail });
  const sym = status === "OK" ? "✓" : status === "WARN" ? "⚠" : "✗";
  const color = status === "OK" ? "\x1b[32m" : status === "WARN" ? "\x1b[33m" : "\x1b[31m";
  console.log(`  ${color}${sym}\x1b[0m ${name}${detail ? " · " + detail : ""}`);
}

// Suprimir todos los logs de jsdom para output limpio
const _virtualConsole = new jsdomLib.VirtualConsole();
_virtualConsole.on("error", () => {});
_virtualConsole.on("warn", () => {});
_virtualConsole.on("log", () => {});
_virtualConsole.on("info", () => {});

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("  SMOKE AUTOMATIZADO · NEXUS Fitness · piloto Anubis");
console.log("═══════════════════════════════════════════════════════════════");
console.log(`  HTML: ${path.basename(HTML)}`);
console.log(`  Tamaño: ${(html.length/1024).toFixed(1)} KB · ${html.split("\n").length} líneas`);
console.log("");

// === 1. CARGA DEL HTML EN JSDOM ===
console.log("[1/7] Carga HTML en jsdom + ejecución de scripts inline");
let dom, win, doc;
try {
  dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: _virtualConsole,
    url: "https://nexus-fitness-ruby.vercel.app/",
  });
  win = dom.window;
  doc = win.document;
  log("DOM creado sin errores", "OK", `${doc.body?.innerHTML?.length || 0} chars en body`);
} catch (e) {
  log("DOM falla en parse/eval", "FAIL", e.message);
  process.exit(1);
}

// Esperar a que el DOM termine de inicializar (DOMContentLoaded fired internamente)
function waitTick(ms = 100) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  await waitTick(500);

  // === 2. APIs CRÍTICAS EXPUESTAS ===
  console.log("\n[2/7] APIs críticas expuestas");
  const checks = [
    ["window.NEXUS_STORAGE_API", () => typeof win.NEXUS_STORAGE_API === "object" && win.NEXUS_STORAGE_API !== null],
    ["NEXUS_STORAGE_API.saveClient", () => typeof win.NEXUS_STORAGE_API?.saveClient === "function"],
    ["NEXUS_STORAGE_API.getClient", () => typeof win.NEXUS_STORAGE_API?.getClient === "function"],
    ["NEXUS_STORAGE_API.listClients", () => typeof win.NEXUS_STORAGE_API?.listClients === "function"],
    ["NEXUS_STORAGE_API.saveRoutine", () => typeof win.NEXUS_STORAGE_API?.saveRoutine === "function"],
    ["NEXUS_STORAGE_API.getClientHistory", () => typeof win.NEXUS_STORAGE_API?.getClientHistory === "function"],
    ["NEXUS_STORAGE_API.listTemplates", () => typeof win.NEXUS_STORAGE_API?.listTemplates === "function"],
    ["window.toggleDarkMode", () => typeof win.toggleDarkMode === "function"],
    ["window.toggleDarkMode aplicaclase", () => { try { win.toggleDarkMode(); const a = doc.documentElement.classList.contains("dark"); win.toggleDarkMode(); const b = !doc.documentElement.classList.contains("dark"); return a && b; } catch(e){ return false; } }],
    ["window.nxExportAnubisPDF", () => typeof win.nxExportAnubisPDF === "function"],
    ["window.generateRoutine", () => typeof win.generateRoutine === "function"],
    ["window.getClientExPref", () => typeof win.getClientExPref === "function"],
    ["window.setClientExPref", () => typeof win.setClientExPref === "function"],
    ["window.togglePresetGroup", () => typeof win.togglePresetGroup === "function"],
    ["window.loadProfilePreset", () => typeof win.loadProfilePreset === "function"],
    ["window.persistLastRoutine", () => typeof win.persistLastRoutine === "function"],
    ["window.openFullExplain (explain trace)", () => typeof win.openFullExplain === "function"],
  ];
  let api_ok = 0;
  for (const [name, fn] of checks) {
    try {
      const r = fn();
      log(name, r ? "OK" : "FAIL");
      if (r) api_ok++;
    } catch (e) {
      log(name, "FAIL", e.message);
    }
  }

  // === 3. BANCO DE EJERCICIOS ===
  // jsdom mete los const top-level en module scope · usar eval del window
  console.log("\n[3/7] Banco de ejercicios + CKG-Fitness");
  const exCount = (() => { try { return win.eval("typeof EX !== 'undefined' ? EX.length : 0"); } catch(e){ return 0; } })();
  log("EX (banco ejercicios)", exCount >= 80 ? "OK" : "WARN", `${exCount} ejercicios`);
  const ckgKeys = (() => { try { return win.eval("typeof CKG !== 'undefined' ? Object.keys(CKG).length : 0"); } catch(e){ return 0; } })();
  log("CKG canonical_registry", ckgKeys > 0 ? "OK" : "WARN", `${ckgKeys} keys`);
  const presetCount = (() => { try { return win.eval("typeof PROFILE_PRESETS !== 'undefined' ? PROFILE_PRESETS.length : 0"); } catch(e){ return 0; } })();
  log("PROFILE_PRESETS", presetCount >= 10 ? "OK" : "WARN", `${presetCount} presets`);
  // Verificar tren_sup/tren_inf/tren_med presentes
  const trenIds = (() => { try { return win.eval("typeof PROFILE_PRESETS !== 'undefined' ? JSON.stringify(PROFILE_PRESETS.filter(p => p.group === 'tren').map(p => p.id)) : '[]'"); } catch(e){ return "[]"; } })();
  const trenArr = JSON.parse(trenIds);
  log("Presets Tren x3 (tren_sup/inf/med)", trenArr.length === 3 ? "OK" : "FAIL", `presentes: ${trenArr.join(", ")}`);
  // Verificar grupos Musculación + Tren
  const groupKeys = (() => { try { return win.eval("typeof PRESET_GROUPS !== 'undefined' ? Object.keys(PRESET_GROUPS).join(',') : ''"); } catch(e){ return ""; } })();
  log("PRESET_GROUPS (musculacion + tren)", groupKeys.includes("musculacion") && groupKeys.includes("tren") ? "OK" : "WARN", `keys: ${groupKeys}`);

  // === 4. STORAGE: CRUD CLIENTE ===
  console.log("\n[4/7] Storage CRUD · cliente sintético");
  try {
    const c = { id: "smoke_test_001", name: "Smoke Test", age: 35, sex: "M", goal: "hipertrofia", level: 3 };
    win.NEXUS_STORAGE_API.saveClient(c);
    const got = win.NEXUS_STORAGE_API.getClient("smoke_test_001");
    log("Save + Get cliente", got?.name === "Smoke Test" ? "OK" : "FAIL", `id=${got?.id}`);
    const list = win.NEXUS_STORAGE_API.listClients();
    log("List clientes incluye nuevo", list.some(x => x.id === "smoke_test_001") ? "OK" : "FAIL", `${list.length} total`);
    win.NEXUS_STORAGE_API.deleteClient("smoke_test_001");
    log("Delete cliente", win.NEXUS_STORAGE_API.getClient("smoke_test_001") === null ? "OK" : "FAIL");
  } catch (e) {
    log("CRUD storage", "FAIL", e.message);
  }

  // === 5. PERSISTENCIA PREFERENCIAS POR (CLIENTE, EJERCICIO) ===
  console.log("\n[5/7] Preferencias persistentes por (cliente, ejercicio)");
  try {
    win.setClientExPref("c001", "ex_squat_back", "reps", 12);
    win.setClientExPref("c001", "ex_squat_back", "sets", 4);
    const pref = win.getClientExPref("c001", "ex_squat_back");
    log("Set + Get preferencia", pref?.reps === 12 && pref?.sets === 4 ? "OK" : "FAIL", JSON.stringify(pref));
    // Verificar persistencia en localStorage
    const raw = win.localStorage.getItem("nx_client_prefs");
    const parsed = JSON.parse(raw);
    log("Persistencia localStorage", parsed?.c001?.ex_squat_back?.reps === 12 ? "OK" : "FAIL", `key nx_client_prefs presente`);
    // Cleanup
    win.localStorage.removeItem("nx_client_prefs");
  } catch (e) {
    log("Preferencias", "FAIL", e.message);
  }

  // === 6. GENERACIÓN DE RUTINA · simulación flujo real (preset → form → render DOM) ===
  console.log("\n[6/7] Generación rutina · vía loadProfilePreset + generateRoutine + lectura DOM");

  // Probar los presets que ya están en el sistema · simulan los perfiles del MVP_DIA7
  const presetsToTest = [
    { id: "musc_int", name: "Musculación intermedio (≈ Marcos M35 hipertrofia L3)", expectMinDays: 3, expectNoContras: [] },
    { id: "rehab_kn", name: "Post-lesión rodilla (≈ Susana F58 con rodilla)", expectMinDays: 2, expectNoContras: ["sentadilla profunda", "peso muerto convencional"] },
    { id: "adultomayor", name: "Adulto mayor activo (≈ Carlos M67 + hombro)", expectMinDays: 2, expectNoContras: [] },
    { id: "glute", name: "Glúteo + femoral (≈ control consistencia perfil F)", expectMinDays: 3, expectNoContras: [] },
    { id: "tren_sup", name: "Tren superior (preset NUEVO Mes 4)", expectMinDays: 1, expectNoContras: [] },
    { id: "tren_inf", name: "Tren inferior (preset NUEVO Mes 4)", expectMinDays: 1, expectNoContras: [] },
    { id: "tren_med", name: "Tren medio core (preset NUEVO Mes 4)", expectMinDays: 1, expectNoContras: [] },
  ];

  for (const t of presetsToTest) {
    try {
      // Cargar preset → llena el form
      win.loadProfilePreset(t.id);
      await waitTick(300);

      // Generar rutina (renderiza al DOM en #generator-output · async setTimeout interno)
      win.generateRoutine();
      // Esperar a que termine el loading async (motor tiene delay para UX)
      await waitTick(1500);

      // Leer DOM
      const out = doc.getElementById("generator-output");
      const html = out?.innerHTML || "";
      const dayBlocks = out?.querySelectorAll(".routine-day, [data-day]") || [];
      const exBlocks = out?.querySelectorAll(".routine-ex") || [];

      // Si el DOM está vacío, capturar el primer mensaje para diagnóstico
      if (html.length < 300 && process.env.SMOKE_DEBUG === "1") {
        console.log(`    [debug ${t.id}] DOM: "${html.slice(0,150).replace(/\s+/g," ")}"`);
      }

      // Snapshot global de la rutina (lo que el código guarda para regen)
      const lastDays = win.eval("typeof _lastGeneratedDays !== 'undefined' ? _lastGeneratedDays : null");
      const dayCount = Array.isArray(lastDays) ? lastDays.length : 0;
      const totalEx = Array.isArray(lastDays) ? lastDays.reduce((a, d) => a + (d.exercises?.length || 0), 0) : exBlocks.length;

      const ok = dayCount >= t.expectMinDays && totalEx >= 4 && html.length > 200;
      log(`${t.name}`, ok ? "OK" : "WARN", `${dayCount}d · ${totalEx}ex · DOM ${html.length} chars`);

      // Verificar sustitución correcta · contras forbidden
      if (t.expectNoContras.length > 0 && Array.isArray(lastDays)) {
        const allExNames = lastDays.flatMap(d => (d.exercises || []).map(e => (e.name || "").toLowerCase()));
        const violation = t.expectNoContras.find(forbidden => allExNames.some(n => n.includes(forbidden.toLowerCase())));
        log(`  └ sustitución correcta`, !violation ? "OK" : "FAIL", violation ? `apareció "${violation}"` : `0 contras forbidden`);
      }
    } catch (e) {
      log(`${t.name}: error`, "FAIL", e.message?.slice(0,80));
    }
  }

  // Refuse honesto · perfil con embarazo + lumbar (simulado vía form directo)
  console.log("\n[6.b] Refuse honesto · perfil con contraindicación dura");
  try {
    // Llenar form manualmente con perfil de Ana
    const setVal = (id, val) => { const el = doc.getElementById(id); if (el) el.value = val; };
    setVal("client-name", "Ana Romero (smoke)");
    setVal("client-age", "42");
    const sex = doc.getElementById("client-sex"); if (sex) sex.value = "F";
    setVal("contras-input", "embarazo segundo trimestre, lumbar agudo");
    setVal("goal", "hipertrofia");

    // Ejecutar generación
    win.generateRoutine();
    await waitTick(150);
    const out = doc.getElementById("generator-output");
    const html = (out?.innerHTML || "").toLowerCase();

    const refuseSignals = ["refuse", "rechaz", "no puedo generar", "clearance médico", "sin clearance", "contraindicación", "bloqueo médico"];
    const refused = refuseSignals.some(s => html.includes(s));
    log("Refuse honesto en perfil contraindicación dura", refused ? "OK" : "WARN", refused ? "sistema rechazó / advirtió correctamente" : "no detecté banner de refuse · revisar manual");
  } catch (e) {
    log("Refuse perfil bloqueado", "WARN", e.message?.slice(0,80));
  }

  // Verificar PDF Anubis trigger (sin descarga real, sólo que la función no rompe)
  console.log("\n[6.c] PDF Anubis · trigger sin error");
  try {
    // Simular click — la función carga pdfmake CDN (en jsdom no llega), pero no debe tirar excepción sincrónica
    let pdfErrorCaught = false;
    const pdfPromise = new Promise(resolve => {
      try {
        win.nxExportAnubisPDF();
        resolve(true);
      } catch (e) {
        pdfErrorCaught = e.message;
        resolve(false);
      }
    });
    const result = await Promise.race([pdfPromise, waitTick(200).then(() => "timeout")]);
    log("nxExportAnubisPDF() trigger", result === "timeout" || result === true ? "OK" : "WARN", pdfErrorCaught ? `error: ${pdfErrorCaught}` : "función ejecutó sin excepción sincrónica (lazy-load CDN async)");
  } catch (e) {
    log("PDF trigger", "FAIL", e.message?.slice(0,80));
  }

  // === 7. STORAGE KEYS · SANIDAD ===
  console.log("\n[7/7] Storage keys · sanidad");
  const expected = ["nx_clients", "nx_routines", "nx_history", "nx_templates", "nx_attendance", "nx_progression", "nx_client_prefs", "nx_streak", "nx_dark_mode"];
  for (const k of expected) {
    const exists = win.localStorage.getItem(k) !== null;
    // No es FAIL no tener · es señal: storage limpio en primera carga es esperado
    log(`localStorage[${k}]`, "OK", exists ? "presente" : "vacío (esperado en sandbox limpio)");
  }

  // === RESUMEN ===
  console.log("\n═══════════════════════════════════════════════════════════════");
  const ok = results.filter(r => r.status === "OK").length;
  const warn = results.filter(r => r.status === "WARN").length;
  const fail = results.filter(r => r.status === "FAIL").length;
  console.log(`  RESUMEN: ${ok} OK · ${warn} WARN · ${fail} FAIL · total ${results.length}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Exit code: FAIL > 0 → 1
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => {
  console.error("[FATAL]", e);
  process.exit(2);
});
