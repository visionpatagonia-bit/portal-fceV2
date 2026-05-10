// =====================================================================
// smoke_d3_matching.js · Sprint 1.6 D3 · 2026-05-10
// Valida 2 frentes raíz:
//   1. Matching curado ↔ yuhonas · 42 EX entries con yuhonas_match + yuhonas_thumb
//   2. Diccionario manual EN→ES · NX_INSTR_TRANSLATE 80+ patterns · wasTranslated heuristic
// Asserts: 13
// =====================================================================

const fs = require('fs');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';

let pass = 0, fail = 0;
function assert(cond, label, expected, actual){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + '\n    expected: ' + JSON.stringify(expected) + '\n    actual:   ' + JSON.stringify(actual)); }
}

const html = fs.readFileSync(HTML_PATH, 'utf8');

// === T1: EX entries tienen yuhonas_match field ===
const matchCount = (html.match(/"yuhonas_match":/g) || []).length;
assert(matchCount >= 30, `T1 EX entries con yuhonas_match (>=30, got ${matchCount})`, '>=30', matchCount);

// === T2: EX entries tienen yuhonas_thumb URL ===
const thumbCount = (html.match(/"yuhonas_thumb":/g) || []).length;
assert(thumbCount >= 30, `T2 EX entries con yuhonas_thumb URL (>=30, got ${thumbCount})`, '>=30', thumbCount);

// === T3: yuhonas_thumb URLs apuntan a raw.githubusercontent.com ===
assert(/"yuhonas_thumb": "https:\/\/raw\.githubusercontent\.com\/yuhonas/.test(html),
  'T3 yuhonas_thumb URL apunta a CDN GitHub raw (SW cache yuhonas captura)', 'truthy', 'check');

// === T4: _renderAddRow usa _thumbUrl priority chain ===
assert(/const _thumbUrl = \(isExtended && e\.imagen_thumb\) \|\| e\.yuhonas_thumb \|\| null/.test(html),
  'T4 _renderAddRow prioriza imagen_thumb > yuhonas_thumb > groupIcon', 'truthy', 'check');

// === T5: rerenderRoutineFromState usa _rThumb chain ===
assert(/const _rThumb = exData\.imagen_thumb \|\| e\.imagen_thumb \|\| e\.yuhonas_thumb \|\| null/.test(html),
  'T5 rerenderRoutineFromState prioriza chain de thumbs (incluye curado match)', 'truthy', 'check');

// === T6: nxOpenExDetail es async (para lazy load NX_CATALOG si curado tiene match) ===
assert(/window\.nxOpenExDetail = async function/.test(html),
  'T6 nxOpenExDetail es async (lazy load NX_CATALOG)', 'truthy', 'check');

// === T7: nxOpenExDetail carga matchRaw si curado tiene yuhonas_match ===
assert(/ex\.yuhonas_match[\s\S]*?NX_CATALOG\.getById\(ex\.yuhonas_match\)/.test(html),
  'T7 nxOpenExDetail busca matchRaw desde yuhonas_match (curado → match imágenes/instructions)', 'truthy', 'check');

// === T8: NX_INSTR_TRANSLATE diccionario presente ===
assert(html.includes('const NX_INSTR_TRANSLATE = ['),
  'T8 diccionario manual NX_INSTR_TRANSLATE definido', 'truthy', 'check');

// === T9: NX_INSTR_TRANSLATE tiene patterns clave (anatomy + actions) ===
const keyPatterns = [
  '\\bbarbell\\b', '\\bbench\\b', '\\bchest\\b', '\\bback\\b',
  'starting position', 'lie down on', 'repeat for', 'engage your core',
];
const presentPatterns = keyPatterns.filter(p => html.includes(p));
assert(presentPatterns.length >= 6, `T9 patterns clave presentes (>=6/${keyPatterns.length}, got ${presentPatterns.length})`, '>=6', presentPatterns.length);

// === T10: nxTranslateInstruction handler global ===
assert(html.includes('window.nxTranslateInstruction = function'),
  'T10 window.nxTranslateInstruction handler global', 'truthy', 'check');

// === T11: heurística wasTranslated · >= 3 replacements + length > 30 ===
assert(/wasTranslated = replacements >= 3 && s\.length > 30/.test(html),
  'T11 heurística wasTranslated: >=3 replacements + length > 30', 'truthy', 'check');

// === T12: Lightbox aplica traducción + sufijo (EN) discreto si NO traducido ===
assert(/translatedInstructions\.map\(t =>[\s\S]*?wasTranslated && isExt[\s\S]*?\(EN\)/.test(html),
  'T12 lightbox aplica traducción + sufijo (EN) discreto si NO traducido', 'truthy', 'check');

// === T13: tagLang condicional · solo si EXT y NADA traducido (vs lista) ===
assert(/\$\{isExt && !anyTranslated \? langTag : ''\}/.test(html),
  'T13 langTag "EN" solo si isExt y NADA traducido (UX clara)', 'truthy', 'check');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
