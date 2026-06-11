'use strict';

/*
 * validate-subjects — chequeo de salud de TODAS las materias para escalar seguro.
 * Por cada data/subjects/<id>/: valida el contract (estructura por tipo de bloque) + confirma que
 * el motor puntua sin romper (smoke con respuestas vacias, practice y, si existe, hard). Exit 1 si
 * hay errores. Correr antes de agregar/cambiar materias: `node scripts/validate-subjects.js`.
 */

const fs = require('fs');
const path = require('path');
const { validateContract } = require('../src/services/contract-validator');
const { scoreAttempt } = require('../src/scoring');

const DIR = path.join(__dirname, '..', 'data', 'subjects');
let totalErrors = 0;
const lines = [];
const subjects = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((d) => fs.statSync(path.join(DIR, d)).isDirectory()) : [];

for (const id of subjects) {
  const profile = path.join(DIR, id, 'exam-profile.json');
  const map = path.join(DIR, id, 'study-map.json');
  lines.push(`\n=== ${id} ===`);
  if (!fs.existsSync(profile)) { lines.push('  ✗ falta exam-profile.json'); totalErrors++; continue; }
  let contract;
  try { contract = JSON.parse(fs.readFileSync(profile, 'utf8')); }
  catch (e) { lines.push('  ✗ exam-profile.json invalido: ' + e.message); totalErrors++; continue; }

  if (!fs.existsSync(map)) lines.push('  ⚠ falta study-map.json (Aprender no tendra plan)');

  const { ok, errors, warnings } = validateContract(contract, { subjectId: id });
  errors.forEach((e) => lines.push('  ✗ ' + e));
  warnings.forEach((w) => lines.push('  ⚠ ' + w));
  totalErrors += errors.length;

  // Smoke: el motor debe puntuar SIN romper con respuestas vacias (score 0 es valido).
  const realId = contract.subject?.id || id;
  for (const mode of (contract.hard ? ['practice', 'hard'] : ['practice'])) {
    try {
      const r = scoreAttempt({ subjectId: realId, answers: { variantId: ((mode === 'hard' ? contract.hard.variants : contract.variants) || [])[0]?.id }, contract, mode });
      if (!r || typeof r.total !== 'number') { lines.push(`  ✗ smoke ${mode}: el motor no devolvio un total numerico`); totalErrors++; }
      else lines.push(`  ✓ smoke ${mode}: puntua (vacio=${r.total}/${Object.values(r.blocks || {}).reduce((s, b) => s + (b.maxPoints || 2), 0)})`);
    } catch (e) { lines.push(`  ✗ smoke ${mode}: el motor TIRO -> ${e.message}`); totalErrors++; }
  }
  if (ok && !errors.length) lines.push('  ✓ contrato valido');
}

console.log(`Materias: ${subjects.length} (${subjects.join(', ')})`);
console.log(lines.join('\n'));
console.log(`\n${totalErrors ? '✗ ' + totalErrors + ' error(es) — corregir antes de escalar' : '✓ todas las materias validas y calificables'}`);
process.exit(totalErrors ? 1 : 0);
