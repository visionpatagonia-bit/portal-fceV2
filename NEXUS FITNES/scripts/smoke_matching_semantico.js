// =====================================================================
// smoke_matching_semantico.js · Bloque A Día 2 · 2026-05-11
// Valida que los curados restantes con yuhonas_match NO tengan inversión
// semántica (abducción/aducción · pull/push · bíceps/tríceps · etc).
// Doctrina: cualquier yuhonas_match futuro debe pasar este smoke.
// =====================================================================

const fs = require('fs');
const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label, detail){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + (detail ? ' · ' + detail : '')); }
}

const html = fs.readFileSync(HTML_PATH, 'utf8');

// === Extraer todos los pairs (curado id · yuhonas_match) restantes ===
const pairs = [];
const re = /"id":\s*"([^"]+)"[^{}]{0,2000}?"name":\s*"([^"]+)"[^{}]{0,2000}?"yuhonas_match":\s*"([^"]+)"/g;
let m;
while((m = re.exec(html)) !== null){
  pairs.push({ id: m[1], name: m[2], match: m[3] });
}
// Anexar group desde el JSON parseado (para reglas semánticas precisas)
try {
  const startIdx = html.indexOf('const EX = [');
  const offset2 = 'const EX = '.length;
  let depth2 = 0, i2 = startIdx + offset2, end2 = -1;
  for(; i2 < html.length; i2++){
    const c = html[i2];
    if(c === '[') depth2++;
    else if(c === ']'){ depth2--; if(depth2 === 0){ end2 = i2+1; break; } }
  }
  const EX = JSON.parse(html.substring(startIdx + offset2, end2));
  const byId = {}; EX.forEach(e => byId[e.id] = e);
  pairs.forEach(p => { p.group = (byId[p.id] && byId[p.id].group) || ''; });
} catch(e){ console.warn('  (no se pudo anexar group · usando solo id+name)'); }

// Excluir yuhonas auto-match (self-match) · solo curados con match a otro yuhonas
const curados = pairs.filter(p => !p.id.startsWith('yuhonas_'));
console.log(`Total curados con yuhonas_match: ${curados.length}`);
console.log(`(Excluidos: ${pairs.length - curados.length} yuhonas self-match)\n`);

// === Pares semánticos opuestos · validación ===
const OPUESTOS = [
  { kw_curado: ['abducci', 'abduct'],     kw_no_match: ['adduction', 'aducci'],  label: 'abducción ≠ aducción' },
  { kw_curado: ['aducci', 'adduct'],      kw_no_match: ['abduction', 'abducci'], label: 'aducción ≠ abducción' },
  { kw_curado: ['pull', 'jalon', 'tracci'], kw_no_match: ['push'],                label: 'pull ≠ push' },
  { kw_curado: ['push', 'press', 'empuj'], kw_no_match: ['pull', 'pulldown'],     label: 'push ≠ pull' },
  { kw_curado: ['biceps', 'bíceps', 'curl'],  kw_no_match: ['triceps', 'tríceps'], label: 'bíceps ≠ tríceps' },
  { kw_curado: ['triceps', 'tríceps', 'francés'], kw_no_match: ['biceps_curl', 'bíceps_curl'], label: 'tríceps ≠ bíceps' },
  { kw_curado: ['pecho', 'pectoral', 'banca', 'apertura'], kw_no_match: ['back', 'espalda', 'row', 'pulldown', 'lat'], label: 'pecho ≠ espalda' },
  { kw_curado: ['espalda', 'dorsal', 'remo', 'jalon'], kw_no_match: ['bench', 'press', 'pectoral', 'fly'], label: 'espalda ≠ pecho' },
  { kw_curado: ['movilidad', 'estiramiento', 'foam', 'mariposa', 'gato'], kw_no_match: ['barbell', 'dumbbell', 'cable', 'press'], label: 'movilidad ≠ ejercicio fuerza' },
  { kw_curado: ['hombro', 'deltoide', 'militar'], kw_no_match: ['curl', 'biceps', 'leg'], label: 'hombros ≠ bíceps/piernas' },
];

// === Validar cada par ===
const violations = [];
// Whitelist: nombres en español donde "pecho" no significa pectoral (jalón AL pecho = lat pulldown)
const ID_WHITELIST_PECHO = ['jalon_', 'jalón_'];
curados.forEach(c => {
  // Si el id del curado está en whitelist, ignoramos "pecho" del nombre (es expresión idiomática)
  const idWhitelistedPecho = ID_WHITELIST_PECHO.some(p => c.id.startsWith(p));
  const idLower = c.id.toLowerCase();
  const nameLower = (c.name || '').toLowerCase();
  // Si el group está disponible, usarlo como prioridad (id ya tiende a estar bien)
  const groupLower = (c.group || '').toLowerCase();
  const curadoLower = (idLower + ' ' + (idWhitelistedPecho ? '' : nameLower) + ' ' + groupLower).toLowerCase();
  const matchLower = c.match.toLowerCase();
  OPUESTOS.forEach(opuesto => {
    // ¿Curado matchea alguna kw_curado?
    const curadoMatches = opuesto.kw_curado.some(kw => curadoLower.includes(kw));
    if(!curadoMatches) return;
    // Anti-falso-positivo: si group del curado contradice la regla, saltar
    // Ej: regla "pecho ≠ espalda" aplica si group=Pecho. Si group=Espalda, no es violación.
    if(opuesto.label === 'pecho ≠ espalda' && groupLower === 'espalda') return;
    if(opuesto.label === 'espalda ≠ pecho' && groupLower === 'pecho') return;
    // ¿Match yuhonas tiene alguna kw_no_match?
    const matchInvalid = opuesto.kw_no_match.some(kw => matchLower.includes(kw));
    if(matchInvalid){
      violations.push({
        curado: c.id,
        name: c.name,
        match: c.match,
        rule: opuesto.label
      });
    }
  });
});

assert(violations.length === 0,
  `Inversión semántica detectada: ${violations.length} violaciones`,
  violations.length > 0 ? '\n    ' + violations.map(v => `${v.curado} (${v.name}) → ${v.match} · viola: ${v.rule}`).join('\n    ') : '');

// === Validar específicamente que los 7 false positives YA NO existen ===
const exFalsePositives = [
  { id: 'hip_thrust',                 badMatch: 'Barbell_Curl' },
  { id: 'crunch_peso',                badMatch: 'Stiff-Legged_Dumbbell_Deadlift' },
  { id: 'movilidad_hombros_circulos', badMatch: 'Alternating_Cable_Shoulder_Press' },
  { id: 'remo_barra',                 badMatch: 'Upright_Barbell_Row' },
  { id: 'abducciones_polea',          badMatch: 'Cable_Hip_Adduction' },
  { id: 'aperturas_mc',               badMatch: 'Decline_Dumbbell_Flyes' },
  { id: 'jalon_polea',                badMatch: 'Close-Grip_Front_Lat_Pulldown' },
];
exFalsePositives.forEach(fp => {
  const found = curados.find(c => c.id === fp.id && c.match.includes(fp.badMatch));
  assert(!found, `${fp.id} ya NO tiene matching falso (${fp.badMatch})`);
});

// === Total matches restantes razonable (≥25 · sano post-audit determinístico) ===
assert(curados.length >= 25, `Total curados con match restante razonable (${curados.length} ≥ 25 esperado · audit determinístico aplicado)`);

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
console.log(`Curados con yuhonas_match VÁLIDOS post-cleanup: ${curados.length}`);
process.exit(fail > 0 ? 1 : 0);
