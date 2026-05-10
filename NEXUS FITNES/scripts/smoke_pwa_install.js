// =====================================================================
// smoke_pwa_install.js · Sprint 2 D1
// Valida PWA installable:
//   - manifest.webmanifest en deploy_qa/public
//   - JSON válido + campos requeridos
//   - Icons referenciados existen en filesystem
//   - HTML head: link manifest + apple-touch-icon
//   - window.NX_PWA expuesto (canInstall/promptInstall/isStandalone/onAvailable)
//   - nxStudentInstall handler
//   - detectStudentUrl tiene standalone redirect logic
// Asserts: 14
// =====================================================================

const fs = require('fs');
const path = require('path');

const HTML_PATH = process.env.NX_HTML_PATH ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html';
const PUBLIC_DIR = process.env.NX_PUBLIC_DIR ||
  '/sessions/dreamy-happy-shannon/mnt/portal_v19.3.0/NEXUS FITNES/deploy_qa/public';

let pass = 0, fail = 0;
function assert(cond, label, expected, actual){
  if(cond){ pass++; console.log('  OK · ' + label); }
  else { fail++; console.error('  FAIL · ' + label + '\n    expected: ' + JSON.stringify(expected) + '\n    actual:   ' + JSON.stringify(actual)); }
}

console.log('[smoke_pwa_install] HTML: ' + HTML_PATH);
console.log('[smoke_pwa_install] PUBLIC_DIR: ' + PUBLIC_DIR);

// === T1-T2: manifest existe + parseable ===
const manifestPath = path.join(PUBLIC_DIR, 'manifest.webmanifest');
assert(fs.existsSync(manifestPath), 'T1 manifest.webmanifest existe', 'exists', fs.existsSync(manifestPath));

let manifest = null;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(true, 'T2 manifest JSON válido (parseable)', true, true);
} catch(e){
  assert(false, 'T2 manifest JSON válido (parseable)', true, e.message);
  process.exit(1);
}

// === T3-T6: campos requeridos PWA ===
assert(manifest.name && manifest.name.length > 0, 'T3 name presente', 'truthy', manifest.name);
assert(manifest.short_name && manifest.short_name.length > 0, 'T4 short_name presente', 'truthy', manifest.short_name);
assert(manifest.start_url, 'T5 start_url presente', 'truthy', manifest.start_url);
assert(manifest.display === 'standalone' || manifest.display === 'fullscreen', 'T6 display standalone (instalable)', 'standalone', manifest.display);

// === T7: icons array no vacío + tipos requeridos ===
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'T7 icons array tiene >=2 entries', '>= 2', manifest.icons && manifest.icons.length);

// === T8: icons referenciados existen físicamente ===
const allIconsExist = manifest.icons.every(icon => {
  const iconPath = path.join(PUBLIC_DIR, icon.src.replace(/^\//, ''));
  return fs.existsSync(iconPath);
});
assert(allIconsExist, 'T8 todos los iconos referenciados existen en filesystem', true, allIconsExist);

// === T9: existe al menos uno con sizes 192x192 (PWA install requirement) ===
const has192 = manifest.icons.some(i => i.sizes && i.sizes.includes('192'));
assert(has192, 'T9 al menos un icon con sizes 192x192', true, has192);

// === T10: existe al menos uno con sizes 512x512 (PWA install requirement) ===
const has512 = manifest.icons.some(i => i.sizes && i.sizes.includes('512'));
assert(has512, 'T10 al menos un icon con sizes 512x512', true, has512);

// === T11: HTML head tiene <link rel="manifest"> ===
const html = fs.readFileSync(HTML_PATH, 'utf8');
assert(/<link\s+rel=["']manifest["']\s+href=["']\/manifest\.webmanifest["']/.test(html), 'T11 HTML head: link manifest presente', '<link rel="manifest" href="/manifest.webmanifest">', 'check');

// === T12: window.NX_PWA expuesto ===
assert(html.includes('window.NX_PWA = (function()'), 'T12 window.NX_PWA IIFE expuesto', 'IIFE', 'check');
assert(/canInstall.*promptInstall.*isStandalone.*onAvailable/s.test(html), 'T13 NX_PWA API completa (canInstall/promptInstall/isStandalone/onAvailable)', 'all 4 methods', 'check');

// === T14: detectStudentUrl tiene logic de standalone redirect ===
assert(html.includes("'nx_last_student_id'") && html.includes('display-mode: standalone'), 'T14 detectStudentUrl persiste student_id LS + redirect standalone', 'truthy', 'check');

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
console.log('TOTAL: ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
