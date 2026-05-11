// =====================================================================
// inject_yuhonas_to_html.js · Sprint 1.7 D4 · 2026-05-11
// Inyecta 873 yuhonas adaptados al array EX del HTML.
// Output a archivo PREVIEW · NO toca el HTML master en producción.
//
// Estrategia:
//   1. Lee HTML master
//   2. Lee EX_yuhonas_ready_for_inject.json (873 entries)
//   3. Localiza `]; const TOTAL = EX.length;` (cierre del array EX)
//   4. Inyecta las 873 entries antes del `]` (preservando los 100 curados)
//   5. Output a `dashboard/NEXUS_Fitness_v2028.30_D4_PREVIEW.html`
// =====================================================================

const fs = require('fs');
const path = require('path');

const HTML_MASTER = path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');
const HTML_PREVIEW = path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_v2028.30_D4_PREVIEW.html');
const YUHONAS_PATH = path.join(__dirname, '..', 'data_generated', 'EX_yuhonas_ready_for_inject.json');

const html = fs.readFileSync(HTML_MASTER, 'utf8');
const yuhonas = JSON.parse(fs.readFileSync(YUHONAS_PATH, 'utf8'));

console.log(`[Inject] HTML master: ${html.length} bytes`);
console.log(`[Inject] Yuhonas adaptadas: ${yuhonas.length} entries`);

// Localizar el cierre del array EX
// Pattern: `}];\nconst TOTAL = EX.length;`
// Buscamos el último `]` antes de `const TOTAL = EX.length`
const closingPattern = /\}\];\s*const TOTAL = EX\.length;/;
const match = html.match(closingPattern);
if(!match){
  console.error('FATAL: no se pudo localizar el cierre del array EX');
  process.exit(1);
}
const closingIndex = match.index;
console.log(`[Inject] Cierre del array EX en posición: ${closingIndex}`);
console.log(`[Inject] Contexto previo (50 chars): ...${html.substring(closingIndex - 50, closingIndex + 20)}...`);

// Serializar yuhonas como JSON compacto (sin spaces · ahorra ~30-40%)
const yuhonasJson = yuhonas.map(e => JSON.stringify(e)).join(',');
console.log(`[Inject] Yuhonas serializado: ${(yuhonasJson.length/1024).toFixed(1)} KB`);

// Inyectar: cambiar `}];` → `},${yuhonasJson}];`
// Es decir: agregar `,${yuhonasJson}` antes del `];`
const before = html.substring(0, closingIndex + 1); // hasta el `}` final del último curado
const after = html.substring(closingIndex + 1);     // desde `];` hacia adelante

const newHtml = before + ',' + yuhonasJson + after;

console.log(`[Inject] HTML resultado: ${newHtml.length} bytes (delta: +${((newHtml.length - html.length)/1024).toFixed(1)} KB)`);

fs.writeFileSync(HTML_PREVIEW, newHtml);
console.log(`[Inject] Output: ${HTML_PREVIEW}`);

// Verificación: contar entries en el nuevo HTML
const idMatches = (newHtml.match(/"id":\s*"[^"]+"/g) || []).length;
console.log(`[Inject] Total entries con "id" en HTML resultado: ${idMatches}`);
console.log(`[Inject] Esperado: ~100 curados + 873 yuhonas + ~30 contras + algunos otros = ~1000-1100`);
