#!/usr/bin/env node
/**
 * scripts/build.js — NEXUS Build Script
 *
 * Copia los archivos de la aplicación a dist/ para deploy.
 * NO usa bundler — el proyecto es vanilla JS/CSS sin módulos ES.
 *
 * Por qué no vite build:
 *   Vite procesaría los <script src="..."> del HTML hasheando filenames,
 *   lo que rompería las referencias del Service Worker (sw.js) que usa
 *   nombres estáticos en SHELL_FILES. Este script copia 1:1 sin transformar.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

/* ── Archivos de la aplicación (excluye backups, scripts de dev, etc.) ── */
const APP_FILES = [
  /* Core de la app */
  'index.html',
  'manifest.json',
  'sw.js',

  /* JavaScript — motor principal */
  'portal.js',
  'nexus-core.js',
  'nexus-quiz.js',
  'nexus-scheduler.js',
  'nexus-fetch.js',
  'nexus-exam.js',
  'nexus-modules.js',
  'nexus-intelligence.js',
  'nexus-adaptive-engine.js',
  'nexus-prefetch.js',
  'nexus-ui-addons.js',
  'nexus-adaptive-ui.js',
  'nexus-ai.js',
  'nexus-ai-config.json',

  /* CSS — sistema de diseño */
  'nexus-ui-system.css',
  'nexus-contrast-tokens.css',
  'nexus-legibility.css',

  /* Datos — contenido académico */
  'materiales.json',
  'glossary.json',
  'comparativa.json',
  'noticias.json',
];

/* ── Limpia y crea dist/ ─────────────────────────────────────────────── */
function cleanDist() {
  if (fs.existsSync(DIST)) {
    /* Limpiar archivo por archivo (evita EPERM en algunos entornos) */
    try {
      fs.rmSync(DIST, { recursive: true, force: true });
    } catch (_) {
      fs.readdirSync(DIST).forEach(function(f) {
        try { fs.unlinkSync(path.join(DIST, f)); } catch (_) {}
      });
    }
    console.log('  ✓ dist/ limpiado');
  }
  fs.mkdirSync(DIST, { recursive: true });
}

/* ── Copia un archivo preservando permisos ───────────────────────────── */
function copyFile(filename) {
  const src  = path.join(ROOT, filename);
  const dest = path.join(DIST, filename);

  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ Archivo no encontrado: ${filename}`);
    return false;
  }

  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  fs.copyFileSync(src, dest);

  const kb = Math.round(fs.statSync(dest).size / 1024);
  console.log(`  ✓ ${filename.padEnd(40)} ${kb} KB`);
  return true;
}

/* ── Main ────────────────────────────────────────────────────────────── */
console.log('\n  NEXUS Build — copiando app a dist/\n');

cleanDist();

let ok = 0, fail = 0;
for (const f of APP_FILES) {
  copyFile(f) ? ok++ : fail++;
}

const totalKB = Math.round(
  APP_FILES
    .map(f => path.join(DIST, f))
    .filter(p => fs.existsSync(p))
    .reduce((sum, p) => sum + fs.statSync(p).size, 0)
  / 1024
);

console.log(`\n  ─────────────────────────────────────────────`);
console.log(`  ✅ Build completo: ${ok} archivos · ${totalKB} KB · dist/`);
if (fail > 0) console.warn(`  ⚠  ${fail} archivos faltantes`);
console.log(`  ─────────────────────────────────────────────\n`);

if (fail > 0) process.exit(1);
