// =====================================================================
// fix_thumbs_curados_macheados.js · v2028.34.2 · 2026-05-12 noche
// Bug encontrado por Juan (rutina Carlos): curados con yuhonas_match
// muestran icono fallback en lugar de foto · porque los campos
// yuhonas_thumb e imagen_thumb del curado están NULL.
// Causa raíz: rematch_curados_explicit_ids.js usaba `yuh.thumb || yuh.image`
// que NO son los nombres reales de los campos (son yuhonas_thumb / imagen_thumb).
// =====================================================================
const fs = require('fs');
const path = require('path');
const HTML_PATH = path.join(__dirname, '..', 'dashboard', 'NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html');
let html = fs.readFileSync(HTML_PATH, 'utf8');

const start = html.indexOf('const EX = [');
const offset = 'const EX = '.length;
let depth = 0, i = start + offset, end = -1;
for(; i < html.length; i++){
  const c = html[i];
  if(c === '[') depth++;
  else if(c === ']'){ depth--; if(depth === 0){ end = i+1; break; } }
}
const EX = JSON.parse(html.substring(start + offset, end));

const byId = {}; EX.forEach(e => byId[e.id] = e);

let fixed = 0;
const log = [];
EX.forEach(e => {
  if(e.id.startsWith('yuhonas_')) return; // solo curados
  if(!e.yuhonas_match) return;
  const yuh = byId[e.yuhonas_match];
  if(!yuh){ console.warn('  ', e.id, '→ yuhonas_match', e.yuhonas_match, 'NO existe'); return; }
  const thumb = yuh.yuhonas_thumb || yuh.imagen_thumb;
  const full = yuh.imagen_full || yuh.yuhonas_thumb;
  if(!thumb){ console.warn('  ', e.id, 'yuhonas no tiene thumb'); return; }
  let needsFix = false;
  if(!e.yuhonas_thumb){ e.yuhonas_thumb = thumb; needsFix = true; }
  if(!e.imagen_thumb){ e.imagen_thumb = thumb; needsFix = true; }
  if(!e.imagen_full){ e.imagen_full = full; }
  if(needsFix){ fixed++; log.push({ id: e.id, match: e.yuhonas_match }); }
});

console.log(`Curados con thumb fixeado: ${fixed}`);
log.forEach(x => console.log(`  ✓ ${x.id} → ${x.match}`));

const newJson = JSON.stringify(EX);
html = html.substring(0, start + offset) + newJson + html.substring(end);
fs.writeFileSync(HTML_PATH, html);
console.log('\n✓ HTML actualizado');

// Verificación: todos los curados con match ahora tienen thumb
const stillNull = EX.filter(e => !e.id.startsWith('yuhonas_') && e.yuhonas_match && !e.yuhonas_thumb && !e.imagen_thumb);
console.log(`\nCurados con match pero SIN thumb: ${stillNull.length}`);
if(stillNull.length) stillNull.forEach(e => console.log('  ✗', e.id));
