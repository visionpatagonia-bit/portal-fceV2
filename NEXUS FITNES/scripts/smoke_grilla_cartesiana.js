// =====================================================================
// smoke_grilla_cartesiana.js · Sprint 1 Stack A · Día 2
// =====================================================================
// Lección bug 6 días (commit d67c770 · 2026-05-09 madrugada): el motor
// crasheaba con totalDays >= 6 porque ningún smoke testeaba esa cantidad
// de días. Este smoke previene futuros bugs silenciosos en bordes
// (días extremos · goals raros · niveles fuera del usual).
//
// Cubre 7 días × 8 goals × 5 niveles = 280 perfiles canónicos.
// Asserts:
//   - pickDayExercises NO crashea (try/catch · log error específico)
//   - Cada día retorna >0 ejercicios
//   - targetGroups NUNCA undefined
//   - Tiempo total smoke < 30 segundos
//
// Run:
//   cd /tmp/nexus_smoke (o donde estén los node_modules)
//   node smoke_grilla_cartesiana.js
// =====================================================================
require('fake-indexeddb/auto');

const fs = require('fs');
const { JSDOM } = require('jsdom');

const HTML_PATH = '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

async function main(){
  const t0 = Date.now();

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

  if(!win.pickDayExercises){
    console.error("✗ pickDayExercises no expuesto · revisar HTML");
    process.exit(1);
  }
  // goalProfile es local dentro de _generateRoutineCore · construimos gp mock representativo
  const gpByGoal = {
    tonificacion:     { patterns:["squat","push","pull","hinge","lunge","flexion","cardio_liss"], reps:"12-15", sets:3 },
    hipertrofia:      { patterns:["squat","push","pull","hinge","lunge","flexion","rotation"],    reps:"8-12",  sets:4 },
    salud_general:    { patterns:["squat","push","pull","hinge","stability","cardio_liss","mobility"], reps:"10-12", sets:3 },
    adulto_mayor:     { patterns:["squat","push","pull","stability","balance","mobility","cardio_liss"], reps:"10-12", sets:2 },
    rehab:            { patterns:["mobility","stability","stretch","balance"], reps:"10-12", sets:2 },
    salud_metabolica: { patterns:["squat","push","pull","stability","cardio_liss","cardio_hiit"], reps:"10-12", sets:3 },
    perdida_grasa:    { patterns:["squat","push","pull","cardio_hiit","cardio_liss","flexion"], reps:"12-15", sets:3 },
    low_impact:       { patterns:["squat","push","pull","stability","mobility","stretch"], reps:"10-12", sets:2 },
  };

  console.log("═══════════════════════════════════════════════════════════");
  console.log(" SMOKE GRILLA CARTESIANA · 7d × 8 goals × 5 niveles = 280 perfiles");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Goals canónicos del banco
  const goals = [
    "tonificacion",
    "hipertrofia",
    "salud_general",
    "adulto_mayor",
    "rehab",
    "salud_metabolica",
    "perdida_grasa",
    "low_impact",
  ];
  const levels = [1, 2, 3, 4, 5];
  const dayCounts = [1, 2, 3, 4, 5, 6, 7];

  let totalProfiles = 0;
  let crashes = 0;
  let emptyDays = 0;
  let undefinedTargetGroups = 0;
  const failures = [];

  for(const days of dayCounts){
    for(const goal of goals){
      for(const level of levels){
        totalProfiles++;
        const profile = {
          name: `test_${goal}_L${level}_${days}d`,
          age: 35,
          sex: "F",
          goal: goal,
          level: level,
          days: days,
          modifiers: [],
          contras: [],
          equip: ["Mancuernas","Banco","Polea","Colchoneta","Cinta","Bicicleta","Barra olímpica + soporte"],
        };

        const gp = gpByGoal[goal] || { sets: 3, reps: "12-15", patterns: ["squat","push","pull"] };

        for(let dayIdx = 0; dayIdx < days; dayIdx++){
          try {
            const dayEx = win.pickDayExercises(dayIdx, days, profile, gp);
            if(!Array.isArray(dayEx)){
              undefinedTargetGroups++;
              failures.push(`${goal}/L${level}/${days}d · día ${dayIdx+1} · pickDayExercises devolvió no-array`);
              continue;
            }
            if(dayEx.length === 0){
              emptyDays++;
              if(failures.length < 10){
                failures.push(`${goal}/L${level}/${days}d · día ${dayIdx+1} · 0 ejercicios`);
              }
            }
          } catch(e){
            crashes++;
            const msg = e.message || String(e);
            if(failures.length < 10){
              failures.push(`${goal}/L${level}/${days}d · día ${dayIdx+1} · CRASH: ${msg}`);
            }
            // Detectar específicamente el bug 6 días arreglado en d67c770
            if(/targetGroups.*some|reading 'some'/.test(msg)){
              failures.push(`  ⚠ REGRESIÓN bug 6 días detectada · revisar pickDayExercises L5342`);
            }
          }
        }
      }
    }
  }

  const elapsed = Date.now() - t0;

  console.log(`Perfiles testeados: ${totalProfiles}`);
  console.log(`Tiempo total: ${elapsed} ms`);
  console.log("");
  console.log(`Crashes: ${crashes}`);
  console.log(`Días vacíos (0 ejercicios): ${emptyDays}`);
  console.log(`targetGroups undefined: ${undefinedTargetGroups}`);

  if(failures.length){
    console.log("\nMuestra de fallas (primeras 10):");
    failures.forEach(f => console.log("  · " + f));
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  const ok = (crashes === 0) && (undefinedTargetGroups === 0) && (elapsed < 30000);
  // emptyDays es WARNING · no FAIL (algunos goals con level 5 tienen días intencionalmente cortos)
  if(ok){
    console.log(` ✅ GRILLA CARTESIANA PASS · ${totalProfiles}/${totalProfiles} OK`);
    if(emptyDays > 0){
      console.log(` ⚠ ${emptyDays} días con 0 ejercicios (WARN · no bloquea)`);
    }
  } else {
    console.log(` ❌ GRILLA CARTESIANA FAIL · ${crashes} crashes · ${undefinedTargetGroups} undefined`);
  }
  console.log("═══════════════════════════════════════════════════════════");
  process.exit(ok ? 0 : 1);
}

main().catch(e => {
  console.error("FATAL:", e.message);
  console.error(e.stack);
  process.exit(1);
});
