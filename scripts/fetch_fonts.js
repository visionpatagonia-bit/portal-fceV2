#!/usr/bin/env node
/**
 * scripts/fetch_fonts.js — Descarga Inter + JetBrains Mono self-hosted
 *
 * Fase 4.2 · Self-host fonts (decisión D1 del audit Fase 4).
 *
 * Uso:
 *     node scripts/fetch_fonts.js
 *
 * Qué hace:
 *   1. Fetch CSS de fonts.googleapis.com con UA de Chrome moderno
 *      (sin UA moderno Google devuelve .ttf, no .woff2).
 *   2. Parsea @font-face blocks, filtra SOLO el subset "latin"
 *      (cubre español incluidos acentos + ñ en Latin-1 Supplement).
 *   3. Descarga cada .woff2 a ./fonts/ con nombres predecibles:
 *        inter-400.woff2, inter-italic-700.woff2, jetbrains-mono-400.woff2
 *   4. Los nombres matchean con los @font-face en nexus-sovereign.css.
 *
 * Idempotente: si el archivo ya existe y pesa lo mismo, skip.
 * Sin dependencias — usa solo módulos built-in de Node.
 *
 * Salida típica:
 *   ✓ inter-400.woff2           17 KB
 *   ✓ inter-italic-400.woff2    18 KB
 *   ...
 *   ✅ 11 fuentes · 212 KB total · ./fonts/
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const FONTS_DIR = path.join(ROOT, 'fonts');

/* Chrome moderno — clave para que Google devuelva woff2 */
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

/**
 * Definición de lo que queremos descargar.
 * Cada entry: [urlParam, outputName]
 *
 * urlParam es lo que va dentro de `family=...` en Google Fonts CSS API v2.
 * outputName es el filename final en ./fonts/ (sin extensión).
 */
const REQUESTS = [
  {
    family: 'Inter',
    css: 'Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700',
    /**
     * map(weight/style → output filename sin extensión).
     * Keys en formato "wght[+italic]" para matching contra @font-face parseado.
     */
    variants: {
      '400':        'inter-400',
      '500':        'inter-500',
      '600':        'inter-600',
      '700':        'inter-700',
      '800':        'inter-800',
      '900':        'inter-900',
      '400+italic': 'inter-italic-400',
      '700+italic': 'inter-italic-700',
    },
  },
  {
    family: 'JetBrains Mono',
    css: 'JetBrains+Mono:wght@400;600;700',
    variants: {
      '400': 'jetbrains-mono-400',
      '600': 'jetbrains-mono-600',
      '700': 'jetbrains-mono-700',
    },
  },
];

/* ── HTTP helpers ──────────────────────────────────────────────────── */

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': CHROME_UA, ...headers } }, (res) => {
      /* Redirect */
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpsGet(res.headers.location, headers));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} para ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(new Error('timeout')); });
  });
}

/* ── Parser ─────────────────────────────────────────────────────────── */

/**
 * Recibe el CSS de Google Fonts para una family y devuelve solo los
 * bloques @font-face del subset `latin`. Uno por variante (wght+style).
 *
 * Google Fonts formatea:
 *   /* latin *\/
 *   @font-face {
 *     font-family: 'Inter';
 *     font-style: normal;
 *     font-weight: 400;
 *     src: url(https://...woff2) format('woff2');
 *     ...
 *   }
 *
 * Solo nos interesa `latin` (cubre español). Otros subsets (latin-ext,
 * cyrillic, greek, vietnamese) agregan peso sin valor para este portal.
 */
function parseLatinFaces(css) {
  const faces = [];
  /* Splitea en bloques /* <subset> *\/ @font-face { ... } */
  const re = /\/\*\s*([^\*]+?)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const subset = m[1].trim();
    if (subset !== 'latin') continue;
    const body = m[2];
    const styleMatch  = /font-style:\s*([^;]+);/.exec(body);
    const weightMatch = /font-weight:\s*([^;]+);/.exec(body);
    const urlMatch    = /url\(([^)]+)\)\s*format\(['"]woff2['"]\)/.exec(body);
    if (!styleMatch || !weightMatch || !urlMatch) continue;
    faces.push({
      style:  styleMatch[1].trim(),
      weight: weightMatch[1].trim(),
      url:    urlMatch[1].trim(),
    });
  }
  return faces;
}

function variantKey(face) {
  return face.style === 'italic' ? `${face.weight}+italic` : face.weight;
}

/* ── Main ──────────────────────────────────────────────────────────── */

async function main() {
  console.log('\n  NEXUS Sovereign · fetch_fonts\n');

  if (!fs.existsSync(FONTS_DIR)) {
    fs.mkdirSync(FONTS_DIR, { recursive: true });
  }

  let totalBytes = 0;
  let downloaded = 0;
  let skipped = 0;

  for (const req of REQUESTS) {
    console.log(`  ── ${req.family} ──`);
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURI(req.css)}&display=swap`;
    let cssBuf;
    try {
      cssBuf = await httpsGet(cssUrl);
    } catch (err) {
      console.error(`  ✗ CSS fetch falló: ${err.message}`);
      process.exit(1);
    }
    const css = cssBuf.toString('utf8');
    const faces = parseLatinFaces(css);

    if (faces.length === 0) {
      console.error(`  ✗ no se parseó ninguna @font-face para ${req.family}`);
      console.error('    (¿Google cambió el formato? revisar fetch_fonts.js)');
      process.exit(1);
    }

    for (const face of faces) {
      const key = variantKey(face);
      const outName = req.variants[key];
      if (!outName) {
        console.log(`  · skip ${req.family} ${key} (no requerido)`);
        continue;
      }
      const outPath = path.join(FONTS_DIR, `${outName}.woff2`);

      /* Idempotencia: si existe y tiene >5KB (no corrupto), skip */
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 5000) {
        const kb = Math.round(fs.statSync(outPath).size / 1024);
        console.log(`  · skip ${outName}.woff2 (ya existe · ${kb} KB)`);
        skipped++;
        totalBytes += fs.statSync(outPath).size;
        continue;
      }

      let woff2;
      try {
        woff2 = await httpsGet(face.url);
      } catch (err) {
        console.error(`  ✗ download falló ${outName}: ${err.message}`);
        process.exit(1);
      }
      fs.writeFileSync(outPath, woff2);
      const kb = Math.round(woff2.length / 1024);
      console.log(`  ✓ ${outName}.woff2`.padEnd(42) + `${kb} KB`);
      downloaded++;
      totalBytes += woff2.length;
    }
    console.log('');
  }

  const totalKB = Math.round(totalBytes / 1024);
  console.log(`  ─────────────────────────────────────────────`);
  console.log(`  ✅ ${downloaded} descargadas · ${skipped} ya presentes · ${totalKB} KB total`);
  console.log(`  📁 ./fonts/`);
  console.log(`  ─────────────────────────────────────────────\n`);
  console.log('  Siguiente paso: node scripts/build.js && python scripts/verify_deploy.py --local\n');
}

main().catch((err) => {
  console.error('\n  ✗ fetch_fonts crashed:', err.stack || err.message);
  process.exit(1);
});
