// =====================================================================
// auditor_completo_v2028_33.js · 2026-05-12 madrugada
// Auditor exhaustivo de NEXUS Fitness · 3 frentes en 1 script:
//   1. MOTOR · faker matrix expandido (200 perfiles) · ejercicio E2E
//   2. PRESETS/PLANTILLAS · property tests del form (estabilidad de campos)
//   3. HANDLERS · scan onclick + dispatch en jsdom
//
// Output: audit_report.html con bugs reproducibles · 0 LLM · 0 costo.
// =====================================================================
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// v2028.33 · Paths portables · funciona en Windows y Linux/Mac.
// __dirname = .../NEXUS FITNES/scripts · subimos 1 nivel y vamos a dashboard/
const SCRIPTS_DIR = __dirname;
const NEXUS_DIR = path.resolve(SCRIPTS_DIR, '..');
const REPO_DIR = path.resolve(NEXUS_DIR, '..');
const HTML_PATH = path.join(NEXUS_DIR, 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');
const REPORT_PATH = path.join(SCRIPTS_DIR, 'AUDIT_REPORT.html');
const REPORT_WORKSPACE = path.join(REPO_DIR, 'AUDIT_REPORT_v2028_33.html');

if(!fs.existsSync(HTML_PATH)){
  console.error('ERROR · No encuentro HTML en: ' + HTML_PATH);
  console.error('  __dirname = ' + SCRIPTS_DIR);
  process.exit(2);
}
const html = fs.readFileSync(HTML_PATH, 'utf8');

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
const win = dom.window;

// Helpers
const bugs = { motor: [], presets: [], handlers: [] };
const stats = { motor: { profiles: 0, perfect: 0, withIssues: 0 }, presets: { runs: 0, ok: 0, bugs: 0 }, handlers: { total: 0, ok: 0, errors: 0 } };

function addBug(category, severity, label, detail){
  bugs[category].push({ severity, label, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
}

// =====================================================================
// AUDITOR 1 · MOTOR · faker matrix 200 perfiles
// =====================================================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('  AUDITOR 1 · MOTOR · 200 perfiles aleatorios determinísticos');
console.log('═══════════════════════════════════════════════════════════════\n');

const GOALS = ['tonificacion','hipertrofia','fuerza','resistencia','salud_metabolica','adulto_mayor','rehab'];
const MODS = ['chest_focus','back_focus','shoulders_focus','arms_focus','legs_focus','glute_focus','calves_focus','core_focus','fat_loss','low_impact'];
const CONTRAS = ['','escoliosis leve','dolor lumbar agudo','coxalgia','lesión meniscal','dolor de hombro agudo','embarazo trimestre 3','hipertensión no controlada','diabetes tipo 2','Lesión hombro sin alta médica','Hernia discal sin alta médica'];
const EQUIP_FULL = ["Apoyo (pared o silla)","Banco hiperextensión","Banco plano","Banco plano + mancuernas","Banco scott + barra","Banda elástica","Barra + banco","Barra Z + banco","Barra de dominadas","Barra olímpica + banco","Barra olímpica + soporte","Barra recta","Bicicleta","Cinta","Colchoneta","Cuerda","Elíptica","Foam roller","Mancuernas","Mancuernas + banco","Mancuernas + banco inclinado","Mancuernas o barra","Marco de puerta","Máquina","Máquina curl","Máquina hack","Máquina prensa","Otro","Palo o escoba","Paralelas o sillas","Polea","Polea + cuerda","Remo ergómetro","Rueda abdominal","Step","Step + mancuernas"];

function rng(seed){ let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

function genProfile(idx){
  const r = rng(idx * 7919 + 31);
  const age = 18 + Math.floor(r() * 60); // 18-78
  const level = 1 + Math.floor(r() * 4); // 1-4
  const days = 2 + Math.floor(r() * 5); // 2-6
  const numMods = Math.floor(r() * 5);
  const modifiers = [...new Set(Array.from({length:numMods}, () => MODS[Math.floor(r() * MODS.length)]))];
  const contra = CONTRAS[Math.floor(r() * CONTRAS.length)];
  const contras = contra ? [contra] : [];
  return {
    id: 'P' + String(idx).padStart(3,'0'),
    name: 'Perfil ' + idx,
    age, sex: r() < 0.5 ? 'M' : 'F',
    goal: GOALS[Math.floor(r() * GOALS.length)],
    level, days,
    modifiers, contras,
    equip: EQUIP_FULL,
  };
}

for(let i = 0; i < 200; i++){
  const profile = genProfile(i);
  const gp = { sets: 3, reps: '10-15', patternsExpanded: new Set() };
  stats.motor.profiles++;
  let profileIssues = [];

  try {
    const allMains = []; const allWarm = []; const allCool = [];
    for(let d = 0; d < profile.days; d++){
      const items = win.pickDayExercises(d, profile.days, profile, gp);
      items.forEach(it => {
        if(it.role === 'warmup') allWarm.push(it.ex);
        else if(it.role === 'cooldown') allCool.push(it.ex);
        else allMains.push(it.ex);
      });
    }

    // Asserts críticos
    const mainsEN = allMains.filter(e => /\s\(EN\)$|\(EN\)$/.test(e.name || ''));
    if(mainsEN.length) profileIssues.push({sev:'CRITICAL', label:'Mains con (EN)', detail: mainsEN.map(e => e.id).join(', ')});

    const warmEN = allWarm.filter(e => /\(EN\)$/.test(e.name || ''));
    if(warmEN.length) profileIssues.push({sev:'CRITICAL', label:'Warmup con (EN)', detail: warmEN.map(e => e.id).join(', ')});

    const coolEN = allCool.filter(e => /\(EN\)$/.test(e.name || ''));
    if(coolEN.length) profileIssues.push({sev:'CRITICAL', label:'Cooldown con (EN)', detail: coolEN.map(e => e.id).join(', ')});

    const stretchMains = allMains.filter(e => ['stretch','mobility','recovery','balance'].includes(e.pattern));
    if(stretchMains.length) profileIssues.push({sev:'CRITICAL', label:'Stretch/mobility en mains', detail: stretchMains.map(e => `${e.id}(${e.pattern})`).join(', ')});

    const movMains = allMains.filter(e => e.group === 'Movilidad');
    if(movMains.length) profileIssues.push({sev:'CRITICAL', label:'Group=Movilidad en mains', detail: movMains.map(e => e.id).join(', ')});

    const extInRoutine = [...allMains, ...allWarm, ...allCool].filter(e => e.extended_only === true);
    if(extInRoutine.length) profileIssues.push({sev:'CRITICAL', label:'extended_only en rutina', detail: extInRoutine.map(e => e.id).join(', ')});

    // foam_roller_cuadriceps NUNCA
    const hasFRC = [...allMains, ...allWarm, ...allCool].some(e => e.id === 'foam_roller_cuadriceps');
    if(hasFRC) profileIssues.push({sev:'CRITICAL', label:'foam_roller_cuadriceps presente (Ariel bloqueó)'});

    // v2028.33 · Ariel "rutina solo core": 0 warmup y 0 cooldown
    if(allWarm.length > 0) profileIssues.push({sev:'CRITICAL', label:'Warmup en rutina (Ariel: rutina solo core)', detail: allWarm.map(e=>e.id).join(', ')});
    if(allCool.length > 0) profileIssues.push({sev:'CRITICAL', label:'Cooldown en rutina (Ariel: rutina solo core)', detail: allCool.map(e=>e.id).join(', ')});

    // Bloqueados explícitamente por Ariel · no pueden aparecer NUNCA
    const FORBIDDEN_IDS = ['yuhonas_Deadlift_with_Bands','yuhonas_One-Arm_Side_Deadlift','yuhonas_Bench_Press_with_Chains','yuhonas_Kneeling_Jump_Squat','yuhonas_Plyo_Kettlebell_Pushups','yuhonas_Rear_Leg_Raises','yuhonas_Split_Squats','yuhonas_Front_Leg_Raises'];
    const forbidden = allMains.filter(e => FORBIDDEN_IDS.includes(e.id));
    if(forbidden.length) profileIssues.push({sev:'CRITICAL', label:'IDs bloqueados por Ariel aparecen en rutina', detail: forbidden.map(e=>e.id).join(', ')});

    // Mínimo de mains por día · v2028.33 ya no hay warmup/cooldown · tolerancia ajustada
    const totalDays = profile.days;
    const expectedMins = totalDays >= 5 ? totalDays * 2 : totalDays * 3;
    if(allMains.length < expectedMins) profileIssues.push({sev:'WARN', label:'Pocos mains', detail: `${allMains.length} mains en ${totalDays} días (esperado ≥${expectedMins})`});

    if(profileIssues.length === 0) stats.motor.perfect++;
    else {
      stats.motor.withIssues++;
      profileIssues.forEach(iss => addBug('motor', iss.sev, `[${profile.id} · ${profile.goal} L${profile.level} ${profile.days}d age${profile.age}] ${iss.label}`, iss.detail));
    }
  } catch(e){
    stats.motor.withIssues++;
    addBug('motor', 'FATAL', `[${profile.id}] pickDayExercises lanzó error`, e.message);
  }

  if((i+1) % 50 === 0) console.log(`  ${i+1}/200 perfiles procesados · ${stats.motor.perfect} perfectos · ${stats.motor.withIssues} con issues`);
}
console.log(`\nMotor: ${stats.motor.perfect}/${stats.motor.profiles} perfiles SIN issues (${(stats.motor.perfect/stats.motor.profiles*100).toFixed(1)}%)`);
console.log(`Total bugs motor: ${bugs.motor.length}\n`);

// =====================================================================
// AUDITOR 2 · PRESETS / PLANTILLAS · property tests
// =====================================================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('  AUDITOR 2 · PRESETS · estabilidad de campos del cliente');
console.log('═══════════════════════════════════════════════════════════════\n');

const doc = win.document;
// PROFILE_PRESETS es const global · no en window. Lo extraemos via eval.
let PRESETS = [];
try { PRESETS = win.eval('PROFILE_PRESETS') || []; } catch(e){ console.error('No pude leer PROFILE_PRESETS:', e.message); }
console.log(`  Presets cargados: ${PRESETS.length}`);

function fieldValues(){
  return {
    age: doc.getElementById('g-age')?.value,
    sex: doc.getElementById('g-sex')?.value,
    level: doc.getElementById('g-level')?.value,
    goal: doc.getElementById('g-goal')?.value,
  };
}

function clearFields(){
  ['g-age','g-sex','g-level'].forEach(id => { const el = doc.getElementById(id); if(el) el.value = ''; });
}

// Test 1: cargar preset · cambiar edad manual · cargar otro preset · ¿edad respeta?
PRESETS.forEach(p1 => {
  PRESETS.forEach(p2 => {
    if(p1.id === p2.id) return;
    stats.presets.runs++;
    try {
      clearFields();
      win.loadProfilePreset(p1.id);
      // Coach pone manualmente edad y nivel
      doc.getElementById('g-age').value = '99';
      doc.getElementById('g-level').value = '4';
      const manualSex = 'F';
      doc.getElementById('g-sex').value = manualSex;

      // Carga otro preset
      win.loadProfilePreset(p2.id);
      const after = fieldValues();

      // Verificar que NO se sobreescribieron
      let bugCount = 0;
      if(after.age !== '99'){
        bugCount++;
        addBug('presets', 'CRITICAL', `Edad pisada al cambiar ${p1.id} → ${p2.id}`, `coach puso 99 · post-preset quedó ${after.age}`);
      }
      if(after.level !== '4'){
        bugCount++;
        addBug('presets', 'CRITICAL', `Nivel pisado al cambiar ${p1.id} → ${p2.id}`, `coach puso 4 · post-preset quedó ${after.level}`);
      }
      if(after.sex !== manualSex){
        bugCount++;
        addBug('presets', 'CRITICAL', `Sexo pisado al cambiar ${p1.id} → ${p2.id}`, `coach puso ${manualSex} · post-preset quedó ${after.sex}`);
      }
      // Goal SÍ debe pisarse (es propio de la plantilla)
      if(after.goal !== p2.goal){
        bugCount++;
        addBug('presets', 'WARN', `Goal NO aplicado al cargar ${p2.id}`, `esperado=${p2.goal} · real=${after.goal}`);
      }
      if(bugCount === 0) stats.presets.ok++;
      else stats.presets.bugs++;
    } catch(e){
      stats.presets.bugs++;
      addBug('presets', 'FATAL', `Error cargando ${p1.id} → ${p2.id}`, e.message);
    }
  });
});

// Test 2: cargar preset sin nada previo · campos deben tomar valor del preset (sugerencia inicial)
PRESETS.forEach(p => {
  stats.presets.runs++;
  try {
    clearFields();
    win.loadProfilePreset(p.id);
    const after = fieldValues();
    let bugCount = 0;
    if(after.age != p.age){
      bugCount++;
      addBug('presets', 'WARN', `Preset ${p.id} no setea edad cuando estaba vacía`, `esperado=${p.age} · real=${after.age}`);
    }
    if(after.sex !== p.sex){
      bugCount++;
      addBug('presets', 'WARN', `Preset ${p.id} no setea sexo cuando estaba vacío`, `esperado=${p.sex} · real=${after.sex}`);
    }
    if(after.level != p.level){
      bugCount++;
      addBug('presets', 'WARN', `Preset ${p.id} no setea nivel cuando estaba vacío`, `esperado=${p.level} · real=${after.level}`);
    }
    if(bugCount === 0) stats.presets.ok++;
    else stats.presets.bugs++;
  } catch(e){
    stats.presets.bugs++;
    addBug('presets', 'FATAL', `Error en carga vacía ${p.id}`, e.message);
  }
});

console.log(`Presets: ${stats.presets.runs} permutaciones · ${stats.presets.ok} OK · ${stats.presets.bugs} con bugs`);
console.log(`Total bugs presets: ${bugs.presets.length}\n`);

// =====================================================================
// AUDITOR 3 · HANDLERS · scan onclick + dispatch
// =====================================================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('  AUDITOR 3 · HANDLERS · scan onclick + dispatch jsdom');
console.log('═══════════════════════════════════════════════════════════════\n');

// Regex que captura onclick con comillas dobles O simples
const onclickRe = /onclick\s*=\s*(?:"([^"]+)"|'([^']+)')/g;
const handlersSet = new Set();
let m;
while((m = onclickRe.exec(html)) !== null){
  const code = (m[1] || m[2] || '').trim();
  // Extraer TODOS los nombres de función llamados en el handler (puede haber varios)
  const fnRe = /(\w+)\s*\(/g;
  let fm;
  while((fm = fnRe.exec(code)) !== null){
    const name = fm[1];
    // Filtrar keywords JS (if, for, etc.) y nombres muy cortos
    if(['if','for','while','return','function','new','typeof'].includes(name)) continue;
    handlersSet.add(name);
  }
}
const handlerNames = [...handlersSet].sort();
stats.handlers.total = handlerNames.length;

// Whitelist: métodos nativos DOM/JS que aparecen en handlers como event.X() o this.X()
// NO son handlers globales · son métodos · descartar para evitar falsos positivos.
const NATIVE_METHODS = new Set([
  'stopPropagation','preventDefault','stopImmediatePropagation',
  'getElementById','querySelector','querySelectorAll','getAttribute','setAttribute',
  'classList','toggle','add','remove','contains','replace',
  'click','focus','blur','dispatchEvent','submit',
  'parseInt','parseFloat','isNaN','isFinite',
  'escapeHtml', // helper local también usado dentro de onclick strings
  'forEach','map','filter','find','some','every','reduce','push','pop','slice','splice','includes',
  'split','join','trim','substring','indexOf','lastIndexOf','toLowerCase','toUpperCase',
  'now','floor','ceil','round','random','min','max','abs'
]);

handlerNames.forEach(name => {
  if(NATIVE_METHODS.has(name)) return; // skip nativos
  const fn = win[name];
  if(typeof fn !== 'function'){
    addBug('handlers', 'WARN', `Handler ${name} referenciado en HTML pero NO definido en window`, '');
    stats.handlers.errors++;
    return;
  }
  stats.handlers.ok++;
});

console.log(`Handlers detectados: ${stats.handlers.total} · ${stats.handlers.ok} definidos · ${stats.handlers.errors} faltantes`);
console.log(`Total bugs handlers: ${bugs.handlers.length}\n`);

// =====================================================================
// GENERAR REPORTE HTML
// =====================================================================
const totalBugs = bugs.motor.length + bugs.presets.length + bugs.handlers.length;
const critBugs = [...bugs.motor, ...bugs.presets, ...bugs.handlers].filter(b => b.severity === 'CRITICAL' || b.severity === 'FATAL').length;

function bugSection(title, bugList){
  if(bugList.length === 0) return `<section><h2>${title}</h2><p class="ok">✓ 0 bugs</p></section>`;
  const grouped = {};
  bugList.forEach(b => { if(!grouped[b.severity]) grouped[b.severity]=[]; grouped[b.severity].push(b); });
  let s = `<section><h2>${title} <span class="count">${bugList.length} bugs</span></h2>`;
  ['FATAL','CRITICAL','WARN'].forEach(sev => {
    if(!grouped[sev]) return;
    s += `<h3 class="sev sev-${sev}">${sev} (${grouped[sev].length})</h3><ul>`;
    grouped[sev].slice(0, 50).forEach(b => {
      s += `<li><b>${escapeHtml(b.label)}</b>${b.detail ? `<br><span class="detail">${escapeHtml(b.detail)}</span>` : ''}</li>`;
    });
    if(grouped[sev].length > 50) s += `<li><i>... y ${grouped[sev].length - 50} más</i></li>`;
    s += `</ul>`;
  });
  return s + `</section>`;
}
function escapeHtml(s){ return String(s).replace(/[<>&"]/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;' }[c])); }

const reportHtml = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>NEXUS Fitness · Audit Report v2028.33</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:1200px;margin:2em auto;padding:0 1em;color:#111;background:#fafafa}
h1{color:#e85d04;border-bottom:3px solid #e85d04;padding-bottom:8px}
section{background:#fff;border-radius:8px;padding:1em 1.5em;margin:1em 0;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
h2{margin-top:0;color:#222}
.count{background:#e85d04;color:#fff;padding:2px 10px;border-radius:12px;font-size:0.7em;vertical-align:middle}
.sev{margin-top:1em;padding:4px 0}
.sev-FATAL{color:#a00;border-left:4px solid #a00;padding-left:8px}
.sev-CRITICAL{color:#c00;border-left:4px solid #c00;padding-left:8px}
.sev-WARN{color:#a60;border-left:4px solid #fa0;padding-left:8px}
.ok{color:#080;font-weight:600}
.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:1em;margin:1em 0}
.stat{background:#fff;padding:1em;border-radius:8px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
.stat .n{font-size:2em;font-weight:700;color:#e85d04;display:block}
.stat .l{color:#666;font-size:0.85em}
.detail{color:#666;font-size:0.85em;font-family:monospace;background:#f4f4f4;padding:2px 4px;border-radius:3px}
ul{margin:0.5em 0;padding-left:1.5em}
li{margin:0.3em 0;line-height:1.4}
</style></head><body>
<h1>NEXUS Fitness · Audit Report v2028.33</h1>
<p><b>Fecha:</b> ${new Date().toISOString()} · <b>HTML:</b> ${(fs.statSync(HTML_PATH).size/1024).toFixed(0)} KB</p>

<div class="summary">
  <div class="stat"><span class="n">${stats.motor.profiles}</span><span class="l">Perfiles motor testeados</span></div>
  <div class="stat"><span class="n">${stats.motor.perfect}</span><span class="l">Perfiles SIN issues</span></div>
  <div class="stat"><span class="n">${stats.presets.runs}</span><span class="l">Permutaciones presets</span></div>
  <div class="stat"><span class="n">${totalBugs}</span><span class="l">Bugs totales (${critBugs} críticos)</span></div>
</div>

${bugSection('1 · Motor adaptativo (pickDayExercises)', bugs.motor)}
${bugSection('2 · Presets / Plantillas (loadProfilePreset)', bugs.presets)}
${bugSection('3 · Handlers UI (onclick)', bugs.handlers)}

<section>
  <h2>Cómo reproducir un bug</h2>
  <p>Cada bug del motor tiene tag <code>[Pnnn · goal Lnivel Ndíasd ageXX]</code>. Para reproducir:</p>
  <ol>
    <li>Identificar el perfil del tag (ej: P042 · hipertrofia L3 5d age28)</li>
    <li>Cargar el HTML en browser</li>
    <li>Construir el perfil manualmente con esos parámetros</li>
    <li>Generar rutina · el bug debe aparecer determinísticamente</li>
  </ol>
</section>

</body></html>`;

fs.writeFileSync(REPORT_PATH, reportHtml);
console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`  Reporte: ${REPORT_PATH}`);
console.log(`  Total bugs: ${totalBugs} (${critBugs} críticos)`);
console.log(`═══════════════════════════════════════════════════════════════`);

// Copiar al workspace (raíz del repo · acceso visual fácil)
try {
  fs.copyFileSync(REPORT_PATH, REPORT_WORKSPACE);
  console.log(`  Workspace: ${REPORT_WORKSPACE}`);
} catch(e){
  console.warn(`  (no se pudo copiar a workspace: ${e.message})`);
}

process.exit(critBugs > 0 ? 1 : 0);
