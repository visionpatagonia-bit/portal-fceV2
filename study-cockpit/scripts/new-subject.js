'use strict';

/*
 * new-subject — scaffold de una materia nueva (para escalar). Crea
 * data/subjects/<id>/{exam-profile.json, study-map.json} con una plantilla VALIDA (texto + choice +
 * cloze) que ya pasa el validador; despues se edita el contenido real y se corre validate-subjects.
 *
 * Uso: node scripts/new-subject.js <id> "Nombre de la materia"
 *   ej: node scripts/new-subject.js economia_1p "Economia - Primer Parcial"
 */

const fs = require('fs');
const path = require('path');
const { validateContract } = require('../src/services/contract-validator');

const id = (process.argv[2] || '').trim();
const name = (process.argv[3] || '').trim() || id;
if (!id || !/^[a-z0-9_]+$/.test(id)) {
  console.error('Uso: node scripts/new-subject.js <id_en_snake_case> "Nombre"');
  process.exit(1);
}
const dir = path.join(__dirname, '..', 'data', 'subjects', id);
if (fs.existsSync(dir)) { console.error(`Ya existe data/subjects/${id} — elegi otro id.`); process.exit(1); }

const examProfile = {
  schemaVersion: '1.0.0',
  subject: { id, name, accentColor: '#58a6ff' },
  assessment: { name: 'Parcial', totalPoints: 10, passPoints: 6, promotionPoints: 8, notes: ['Plantilla generada por new-subject: reemplazar el contenido por el real.'] },
  gradingFamilies: { ejemplo_familia: ['termino', 'concepto', 'palabra clave'] },
  blocks: [
    { id: 'definicion', label: 'Definicion escrita', kind: 'development', points: 3, grading: { type: 'text', input: 'definicion', criteria: [
      { label: 'Menciona el concepto clave', terms: ['concepto', 'definicion'], points: 1.5 },
      { label: 'Da un ejemplo', terms: ['ejemplo', 'por ejemplo'], points: 1.5 }
    ] } },
    { id: 'opcion', label: 'Opcion multiple', kind: 'choice', points: 3, grading: { type: 'choice', input: 'opcion' } },
    { id: 'completar', label: 'Completar la oracion', kind: 'cloze', points: 4, grading: { type: 'cloze', input: 'completar', gaps: [
      { id: 'g1', expected: 'respuesta', accept: ['respuesta', 'la respuesta'] },
      { id: 'g2', expected: 'opcion correcta', options: ['opcion correcta', 'distractor 1', 'distractor 2'] }
    ] } }
  ],
  variants: [
    { id: 'T1', label: 'Tema 1', blocks: [
      { blockId: 'definicion', items: [{ id: 'T1-D', prompt: 'Defini el concepto X y da un ejemplo concreto.' }] },
      { blockId: 'opcion', items: [{ id: 'T1-O', prompt: 'El concepto X se define mejor como:', options: ['la opcion correcta', 'un distractor', 'otro distractor'], answer: 0 }] },
      { blockId: 'completar', items: [{ id: 'T1-C', prompt: 'El concepto X se define como {{g1}} y, segun el caso, es {{g2}}.' }] }
    ] }
  ]
};

const studyMap = {
  title: `${name} - plan de estudio`,
  northStar: 'Dominar los conceptos centrales de la materia para el parcial.',
  blocks: [
    { id: 'definicion', code: 'A', label: 'Definicion del concepto X', priority: 'high', studyMinutes: 25, examSkill: 'Definir y ejemplificar', whyItMatters: 'Es la base conceptual de la materia.', learningObjectives: ['Definir X', 'Dar un ejemplo de X'], coreTheory: [{ title: 'Concepto X', body: 'Reemplazar por la definicion real.' }], examLanguage: ['Defina X', 'De un ejemplo de X'], commonErrors: ['Confundir X con Y'], minimumAnswer: 'X es ... ; por ejemplo ...', drills: [{ prompt: 'Defini X en una oracion.', expected: 'X es ...' }] }
  ]
};

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'exam-profile.json'), JSON.stringify(examProfile, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(dir, 'study-map.json'), JSON.stringify(studyMap, null, 2) + '\n', 'utf8');

const { ok, errors, warnings } = validateContract(examProfile, { subjectId: id });
console.log(`Creada data/subjects/${id}/ (exam-profile.json + study-map.json)`);
warnings.forEach((w) => console.log('  ⚠ ' + w));
errors.forEach((e) => console.log('  ✗ ' + e));
console.log(ok ? '✓ La plantilla pasa el validador. Editá el contenido real y corré: node scripts/validate-subjects.js'
  : '✗ La plantilla NO valida (bug del scaffold).');
process.exit(ok ? 0 : 1);
