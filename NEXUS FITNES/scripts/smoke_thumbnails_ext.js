// =====================================================================
// smoke_thumbnails_ext.js · Sprint 1.6 D1
// Valida render thumbnails en filas EXT del modal +Agregar:
//   - nxCatalogToEX incluye imagen_thumb (primera URL yuhonas)
//   - _renderAddRow renderiza <img> 40x40 si isExtended && imagen_thumb
//   - onerror fallback al groupIcon original
//   - Filas curadas NO afectadas (regression check)
// Asserts: 9
// =====================================================================

const fs = require('fs');
const path = require('path');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';
const JSON_PATH = process.env.NX_JSON_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/deploy_qa/public/exercises_extended.json';

let pass = 0, fail = 0;
function assert(cond, label, expected, actual){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + '\n    expected: ' + JSON.stringify(expected) + '\n    actual:   ' + JSON.stringify(actual)); }
}

console.log('[smoke_thumbnails_ext] HTML: ' + HTML_PATH);
const html = fs.readFileSync(HTML_PATH, 'utf8');

// === T1: nxCatalogToEX incluye imagen_thumb ===
assert(html.includes('imagen_thumb: imagen_thumb'), 'T1 nxCatalogToEX devuelve campo imagen_thumb', 'truthy', 'check');

// === T2: imagen_thumb = primera URL de imagenes ===
assert(/imagen_thumb = \(entry\.imagenes && entry\.imagenes\[0\]\) \|\| null/.test(html), 'T2 imagen_thumb = imagenes[0] o null si no hay', 'truthy', 'check');

// === T3: _renderAddRow renderiza <img> si isExtended + imagen_thumb ===
assert(/isExtended && e\.imagen_thumb[\s\S]*?<img src="\$\{escapeHtml\(e\.imagen_thumb\)\}"/.test(html), 'T3 _renderAddRow condicional con <img> si EXT + imagen_thumb', 'truthy', 'check');

// === T4: Thumbnail tiene loading lazy + decoding async ===
assert(html.includes('loading="lazy" decoding="async"'), 'T4 img loading=lazy + decoding=async (perf)', 'truthy', 'check');

// === T5: onerror fallback al groupIcon ===
assert(html.includes('onerror="this.parentElement.innerHTML=this.dataset.fallback"'), 'T5 onerror cae al groupIcon (fallback graceful)', 'truthy', 'check');

// === T6: data-fallback escapa quotes correctamente ===
assert(html.includes("data-fallback='${groupIcon(e.group).replace(/'/g"), 'T6 data-fallback escapa single quotes (XSS safety)', 'truthy', 'check');

// === T7: Caso curado (isExtended=false) sigue usando groupIcon directo ===
assert(/const thumbHtml = \(isExtended && e\.imagen_thumb\)[\s\S]*?: groupIcon\(e\.group\)/.test(html), 'T7 fallback estructural · curado sigue con groupIcon', 'truthy', 'check');

// === T8: Verify bundle JSON tiene imagenes en estructura yuhonas ===
const bundle = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const hasImages = bundle.exercises.every(e => Array.isArray(e.imagenes) && e.imagenes.length >= 1);
assert(hasImages, 'T8 todos los 873 ej en bundle tienen imagenes[] no vacío', true, hasImages);

// === T9: Primera URL apunta a raw.githubusercontent.com/yuhonas ===
const sampleUrl = bundle.exercises[0].imagenes[0];
assert(sampleUrl && sampleUrl.startsWith('https://raw.githubusercontent.com/yuhonas/'),
  'T9 URLs apuntan a CDN GitHub raw (SW cache yuhonas las captura)', 'https://raw.githubusercontent.com/yuhonas/...', sampleUrl);

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
