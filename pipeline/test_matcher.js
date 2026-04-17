#!/usr/bin/env node
/**
 * test_matcher.js — Smoke test del runtime matcher
 *
 * Simula la lógica de nexus-ai.js contra el kb/schedule_kb.json real.
 * Útil para validar ANTES de abrir el browser.
 *
 * Uso: node pipeline/test_matcher.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const KB_PATH = path.resolve(__dirname, '..', 'kb', 'schedule_kb.json');

if (!fs.existsSync(KB_PATH)) {
  console.error('\n  ✗ No se encontró', KB_PATH);
  console.error('  Corré primero: python pipeline/ingest_schedule.py\n');
  process.exit(1);
}

const kb = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));

// ─── Réplica exacta del matcher de nexus-ai.js ──────────────────────────
function _normalizeQuery(q) {
  return (q || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function _levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  for (let k = 0; k <= b.length; k++) prev[k] = k;
  for (let i = 1; i <= a.length; i++) {
    let curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

function _similarity(q, pattern) {
  const nq = _normalizeQuery(q);
  const np = _normalizeQuery(pattern);
  if (!nq || !np) return 0;
  if (nq === np) return 1.0;
  if (np.length >= 4 && nq.indexOf(np) >= 0) return 0.95;
  if (nq.length >= 4 && np.indexOf(nq) >= 0) return 0.88;
  const maxLen = Math.max(nq.length, np.length);
  const dist = _levenshtein(nq, np);
  return 1 - (dist / maxLen);
}

function _matchKBEntry(userQuery, kb) {
  if (!kb || !kb.entries) return null;
  let best = null;
  let bestScore = 0;
  for (const entry of kb.entries) {
    const threshold = entry.confidence_threshold || 0.75;
    const patterns = entry.patterns || [];
    for (const pattern of patterns) {
      const score = _similarity(userQuery, pattern);
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        best = { entry, score, matchedPattern: pattern };
      }
    }
  }
  return best;
}

// ─── Casos de test ──────────────────────────────────────────────────────
const TESTS = [
  // HITs esperados — schedule
  { query: '¿qué clases tengo hoy?',           expect: 'sched_today'   },
  { query: 'clases hoy',                        expect: 'sched_today'   },
  { query: 'que tengo hoy',                     expect: 'sched_today'   },
  { query: 'mi agenda hoy por favor',           expect: 'sched_today'   },
  { query: 'clases mañana',                     expect: 'sched_tomorrow' },
  { query: '¿tengo clase mañana?',              expect: 'sched_tomorrow' },
  { query: 'próxima clase',                     expect: 'sched_next_class' },
  { query: 'cuál es mi siguiente clase',        expect: 'sched_next_class' },
  { query: 'a qué hora es contabilidad',        expect: 'sched_materia_contabilidad' },
  { query: 'cuando tengo administracion',       expect: 'sched_materia_administracion' },
  { query: 'horario de sociales',               expect: 'sched_materia_sociales' },
  { query: 'dias de propedeutica',              expect: 'sched_materia_propedeutica' },
  { query: 'mi horario',                        expect: 'sched_week_overview' },
  { query: 'horarios de la semana',             expect: 'sched_week_overview' },

  // MISSes esperados — deben caer a LLM
  { query: '¿cuál es la capital de Francia?',   expect: null },
  { query: 'hola cómo estás',                    expect: null },
  { query: 'explicame el principio de partida doble', expect: null },
  { query: 'qué es el patrimonio',              expect: null },
];

// ─── Ejecución ──────────────────────────────────────────────────────────
console.log('\n  NEXUS · Runtime Matcher Smoke Test');
console.log('  ──────────────────────────────────────────────────────────────');
console.log('  KB: ' + kb.entries.length + ' entries · version ' + kb.version);
console.log('  ──────────────────────────────────────────────────────────────\n');

let pass = 0;
let fail = 0;
const failures = [];

for (const t of TESTS) {
  const result = _matchKBEntry(t.query, kb);
  const got = result ? result.entry.id : null;
  const scoreStr = result ? result.score.toFixed(3) : '   -  ';
  const ok = got === t.expect;

  if (ok) {
    pass++;
    console.log(`  ✓ [${scoreStr}] "${t.query}"`);
    console.log(`         → ${got || '(MISS → LLM fallback)'}`);
  } else {
    fail++;
    failures.push({ query: t.query, expected: t.expect, got });
    console.log(`  ✗ [${scoreStr}] "${t.query}"`);
    console.log(`         esperado: ${t.expect || '(MISS)'}`);
    console.log(`         obtenido: ${got || '(MISS)'}`);
    if (result) {
      console.log(`         matched pattern: "${result.matchedPattern}"`);
    }
  }
}

console.log('\n  ──────────────────────────────────────────────────────────────');
console.log(`  ${pass} passed · ${fail} failed · ${TESTS.length} total`);
console.log('  ──────────────────────────────────────────────────────────────\n');

if (fail > 0) {
  console.log('  Fallos detallados:');
  failures.forEach(f => {
    console.log(`    - "${f.query}"  esperado=${f.expected || 'MISS'}  got=${f.got || 'MISS'}`);
  });
  console.log('');
  process.exit(1);
}
