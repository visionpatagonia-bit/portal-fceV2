'use strict';

const { scoreAttempt, computePayroll } = require('../src/scoring');
const { MissionEngine } = require('../src/services/mission-engine');
const { CalibrationService } = require('../src/services/calibration-service');
const contabilidad = require('../data/subjects/contabilidad_2p/exam-profile.json');
const administracion = require('../data/subjects/administracion/exam-profile.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function demoAnswers() {
  return {
    A: 'El devengado registra por hecho sustancial y periodo, independientemente del cobro o pago. El percibido depende del cobro o pago.',
    B: {
      b1: { value: 'V', justification: 'Hecho sustancial del periodo independiente del cobro o pago.' },
      b2: { value: 'F', justification: 'Son retenciones al trabajador, no contribuciones patronales.' },
      b3: { value: 'V', justification: 'Costo de la empresa y pasivo a pagar.' },
      b4: { value: 'F', justification: 'Por independencia el auditor no prepara la informacion auditada.' }
    },
    C: {
      worker: 85000,
      net: 415000,
      employer: 130000,
      cost: 630000,
      debitWages: 500000,
      debitSocialCharges: 130000,
      creditPayrollPayable: 415000,
      creditContributionsPayable: 215000
    },
    D: 'La auditoria examina evidencia y emite opinion independiente. La independencia exige que no prepare la informacion auditada. El control interno mejora confiabilidad, salvaguarda y cumplimiento, sin garantizar riesgo cero.',
    E: 'Aplico devengado por periodo y hecho sustancial. Aportes se retienen al trabajador y contribuciones patronales son costo. Detecto riesgo si una persona autoriza, registra y paga; propongo separacion de funciones, autorizacion, comprobantes y conciliacion.'
  };
}

const result = scoreAttempt({ subjectId: 'contabilidad_2p', answers: demoAnswers(), contract: contabilidad });
assert(result.total >= 8, 'demo score should be in promotion range');
assert(result.status === 'promotion_estimated', 'demo should estimate promotion');
// Calibracion conservadora (auditoria 2026-06-08): nota estimada < score tecnico.
assert(result.notaEstimada < result.total, 'nota estimada debe ser conservadora (score - margen)');
assert(result.estimatedStatus === 'pass_estimated', 'con margen, 8.64 tecnico NO promociona (estimada 7.79)');

// Regresion footgun es-AR: importes con separador de miles ("500.000") deben valer 500000, no 500.
const esAR = demoAnswers();
esAR.C = { worker: '85.000', net: '415.000', employer: '130.000', cost: '630.000', debitWages: '500.000', debitSocialCharges: '130.000', creditPayrollPayable: '415.000', creditContributionsPayable: '215.000' };
const esARresult = scoreAttempt({ subjectId: 'contabilidad_2p', answers: esAR, contract: contabilidad });
assert((esARresult.blocks.calculation_entry.misses || []).length === 0, 'Bloque C en notacion es-AR (puntos de miles) no debe tener misses');
assert(esARresult.blocks.calculation_entry.points === result.blocks.calculation_entry.points, 'Bloque C: es-AR y entero deben puntuar identico');

// V/F alineado a la consigna ("corregi las falsas"): las VERDADERAS bien marcadas suman aunque no
// se justifiquen; las FALSAS hay que justificarlas (corregirlas) o no suman.
// b1=V (sin justif -> suma), b2=F (sin justif -> miss), b3=V (sin justif -> suma), b4=F (justif mala -> miss).
const sinJust = demoAnswers();
sinJust.B = { b1: { value: 'V', justification: '' }, b2: { value: 'F', justification: '' }, b3: { value: 'V', justification: '' }, b4: { value: 'F', justification: 'no se la justificacion' } };
const sinJustResult = scoreAttempt({ subjectId: 'contabilidad_2p', answers: sinJust, contract: contabilidad });
assert(sinJustResult.blocks.true_false_justified.points === 1, 'V/F: las verdaderas (b1,b3) suman sin justificar; las falsas (b2,b4) sin justificar no -> 1/2');
assert(sinJustResult.blocks.true_false_justified.misses.length === 2, 'solo las falsas no justificadas dejan miss');
assert(result.blocks.true_false_justified.points === 2, 'V/F del demo (todo bien) sigue puntuando completo');

// Variante de calculo generada por IA: la clave la computa el backend (computePayroll) y el grader
// la usa via gradingOverrides. El demo fijo (500k) debe seguir intacto (cubierto arriba: 8.64).
const calcFields = contabilidad.blocks.find((b) => b.id === 'calculation_entry').grading.fields;
assert(calcFields.every((f) => computePayroll({ bruto: 500000, pctAportes: 17, pctContrib: 26 })[f.key] === f.expected), 'computePayroll(500k/17/26) reproduce la clave del contrato');
const expV = computePayroll({ bruto: 600000, pctAportes: 16, pctContrib: 27 });
const genVar = { id: 'gen_test', subjectId: 'contabilidad_2p', gradingOverrides: { calculation_entry: { fields: calcFields.map((f) => ({ ...f, expected: expV[f.key] })) } } };
const aGen = demoAnswers();
aGen.variantId = 'gen_test';
aGen.C = { worker: expV.worker, net: expV.net, employer: expV.employer, cost: expV.cost, debitWages: expV.debitWages, debitSocialCharges: expV.debitSocialCharges, creditPayrollPayable: expV.creditPayrollPayable, creditContributionsPayable: expV.creditContributionsPayable };
const rGen = scoreAttempt({ subjectId: 'contabilidad_2p', answers: aGen, contract: { ...contabilidad, variants: [...(contabilidad.variants || []), genVar] }, mode: 'practice' });
assert((rGen.blocks.calculation_entry.misses || []).length === 0, 'variante de calculo IA: Bloque C sin misses contra la clave computada (600k/16/27)');

// Banco de rotacion del parcial: cada tema debe ser CALIFICABLE por el motor (clave determinista via
// computePayroll) y su V/F via gradingOverrides. Rotar el examen solo AGREGA variantes validas; el
// demo base 500k/8.64 queda intacto (cubierto arriba, no usa variantId).
const examBank = require('../data/subjects/contabilidad_2p/exam-bank.json');
assert(Array.isArray(examBank.themes) && examBank.themes.length >= 1, 'exam-bank debe tener al menos un tema');
for (const th of examBank.themes) {
  const p = computePayroll(th.scenario);
  assert(Object.values(p).every(Number.isInteger), `banco ${th.id}: computePayroll debe dar enteros`);
  assert((p.debitWages + p.debitSocialCharges) === (p.creditPayrollPayable + p.creditContributionsPayable), `banco ${th.id}: el asiento debe balancear (debe=haber)`);
  assert(Array.isArray(th.vf) && th.vf.length === 4, `banco ${th.id}: debe tener 4 V/F`);
  assert(th.vf.every((v) => String(v.text || '').length > 8), `banco ${th.id}: textos V/F validos (>8)`);
  assert(th.vf.filter((v) => String(v.expected).toUpperCase() === 'F').every((v) => Array.isArray(v.terms) && v.terms.length), `banco ${th.id}: cada falsa con terms para poder justificar`);
}

// Intento PERFECTO sobre un tema rotado, corregido via gradingOverrides (igual que el handler del
// banco): Bloque C y V/F deben puntuar completo, probando que la rotacion se corrige bien.
const themeT = examBank.themes[0];
const expT = computePayroll(themeT.scenario);
const rotVar = {
  id: 'gen_rot_test', subjectId: 'contabilidad_2p',
  gradingOverrides: {
    calculation_entry: { fields: calcFields.map((f) => ({ ...f, expected: expT[f.key] })) },
    true_false_justified: { items: themeT.vf.map((v) => ({ id: v.id, expected: String(v.expected).toUpperCase() === 'V' ? 'V' : 'F', terms: v.terms })) }
  }
};
const perfectVF = {};
themeT.vf.forEach((v) => {
  const isF = String(v.expected).toUpperCase() === 'F';
  perfectVF[v.id] = { value: isF ? 'F' : 'V', justification: isF ? `correccion tecnica: ${(v.terms || [])[0] || ''}` : '' };
});
const aRot = {
  variantId: 'gen_rot_test', A: demoAnswers().A, D: demoAnswers().D, E: demoAnswers().E, B: perfectVF,
  C: { worker: expT.worker, net: expT.net, employer: expT.employer, cost: expT.cost, debitWages: expT.debitWages, debitSocialCharges: expT.debitSocialCharges, creditPayrollPayable: expT.creditPayrollPayable, creditContributionsPayable: expT.creditContributionsPayable }
};
const rRot = scoreAttempt({ subjectId: 'contabilidad_2p', answers: aRot, contract: { ...contabilidad, variants: [...(contabilidad.variants || []), rotVar] }, mode: 'practice' });
assert((rRot.blocks.calculation_entry.misses || []).length === 0, 'tema rotado: Bloque C sin misses contra la clave computada');
assert(rRot.blocks.true_false_justified.points === 2, 'tema rotado: V/F perfecto puntua completo (2/2) via gradingOverrides');

// Modalidades nuevas subject-agnostic (cloze + debe_haber): solo se activan cuando un bloque las
// declara, asi que NO afectan la calibracion de las materias existentes (verificado: demo 8.64 arriba).
const modalContract = {
  subject: { id: 'modal_test' }, assessment: { passPoints: 6, promotionPoints: 8 },
  blocks: [
    { id: 'cz', label: 'Completar', points: 2, grading: { type: 'cloze', input: 'cz', gaps: [
      { id: 'g1', expected: 'devengado', accept: ['devengado'], points: 0.5 },
      { id: 'g2', expected: 'hecho sustancial', points: 0.5 },
      { id: 'g3', expected: 'independientemente', accept: ['independientemente', 'sin importar'], points: 0.5 },
      { id: 'g4', numeric: true, expected: 500000, points: 0.5 } ] } },
    { id: 'dh', label: 'Asiento', points: 2, grading: { type: 'debe_haber', input: 'dh', balanceWeight: 0.2, rows: [
      { id: 'r1', account: 'Sueldos', debit: 500000, credit: null },
      { id: 'r2', account: 'Cargas', debit: 130000, credit: null },
      { id: 'r3', account: 'Remun a pagar', debit: null, credit: 415000 },
      { id: 'r4', account: 'Organismos', debit: null, credit: 215000 } ] } }
  ], variants: [{ id: 'M1', blocks: [] }]
};
const modalPerfect = scoreAttempt({ subjectId: 'modal_test', contract: modalContract, answers: { variantId: 'M1',
  cz: { g1: 'Devengado', g2: 'hecho sustancial', g3: 'sin importar', g4: '500.000' },
  dh: { rows: [{ id: 'r1', debit: '500.000', credit: '' }, { id: 'r2', debit: '130.000', credit: '' }, { id: 'r3', debit: '', credit: '415.000' }, { id: 'r4', debit: '', credit: '215.000' }] } } });
assert(modalPerfect.blocks.cz.points === 2, 'cloze perfecto (incl sinonimo "sin importar" y numerico es-AR 500.000) = 2/2');
assert(modalPerfect.blocks.dh.points === 2, 'debe_haber perfecto + balanceado = 2/2');
const modalBad = scoreAttempt({ subjectId: 'modal_test', contract: modalContract, answers: { variantId: 'M1',
  cz: { g1: 'percibido', g2: 'hecho sustancial', g3: 'sin importar', g4: '500000' },
  dh: { rows: [{ id: 'r1', debit: '500.000', credit: '' }, { id: 'r2', debit: '', credit: '130.000' }, { id: 'r3', debit: '', credit: '415.000' }, { id: 'r4', debit: '', credit: '215.000' }] } } });
assert(modalBad.blocks.cz.points === 1.5, 'cloze con un hueco mal pierde solo el peso de ese hueco (1.5/2)');
assert((modalBad.blocks.dh.misses || []).some((m) => /no balancea/i.test(m)), 'debe_haber: monto en lado equivocado descuadra el asiento -> miss de balance');
assert(modalBad.blocks.dh.points < 2, 'debe_haber con error puntua menos que el perfecto');

const missionEngine = new MissionEngine({
  telemetry: {
    latestEvent: async () => null
  }
});

const firstMission = missionEngine.fromScore({
  subjectId: 'contabilidad_2p',
  contract: contabilidad,
  scoreResult: null
});
assert(firstMission.purpose === 'diagnostic', 'first mission should be diagnostic');

const nextMission = missionEngine.fromScore({
  subjectId: 'contabilidad_2p',
  contract: contabilidad,
  scoreResult: result
});
assert(nextMission.source === 'deterministic', 'mission source should be deterministic');
assert(nextMission.purpose === 'full_simulation', 'promotion score should recommend full simulation');

const calibrationService = new CalibrationService({ telemetry: null });
const cases = calibrationService.buildCases([
  {
    eventId: 'score-1',
    type: 'attempt_scored',
    subjectId: 'contabilidad_2p',
    sessionId: 'pilot-1',
    attemptId: 'att-1',
    createdAt: '2026-06-04T10:00:00.000Z',
    payload: { total: 8.64 }
  },
  {
    eventId: 'grade-1',
    type: 'real_grade_reported',
    subjectId: 'contabilidad_2p',
    sessionId: 'pilot-1',
    attemptId: 'att-1',
    createdAt: '2026-06-04T11:00:00.000Z',
    payload: { realGrade: 8.5 }
  }
]);
const summary = calibrationService.summarize(cases);
assert(summary.totalCases === 1, 'calibration should include one case');
assert(summary.calibrationWithin1ptRate === 1, 'calibration should be within one point');

// Administracion: opcion multiple por clave del contrato + texto por terminos.
const adminGood = scoreAttempt({
  subjectId: 'administracion',
  contract: administracion,
  answers: {
    variantId: 'T1',
    matching: 1,
    true_false: 1,
    case: 1,
    short_answer: 'Roles decisorios de Mintzberg: emprendedor, gestor de problemas, asignador de recursos y negociador.',
    development: 'El proceso administrativo integra planeacion, organizacion, direccion y control como ciclo continuo.'
  }
});
assert(adminGood.total >= 8, 'admin good attempt should be in promotion range');
assert(adminGood.status === 'promotion_estimated', 'admin good attempt should estimate promotion');

const adminBad = scoreAttempt({
  subjectId: 'administracion',
  contract: administracion,
  answers: { variantId: 'T1', matching: 0, true_false: 0, case: 0, short_answer: 'no se', development: 'algo' }
});
assert(adminBad.total === 0, 'admin bad attempt should score zero');
assert(adminBad.weaknesses.length === 5, 'admin bad attempt should flag every block');

console.log(JSON.stringify({
  ok: true,
  deterministicScore: result.total,
  firstMission: firstMission.purpose,
  nextMission: nextMission.purpose,
  calibrationWithin1ptRate: summary.calibrationWithin1ptRate,
  adminGoodScore: adminGood.total,
  adminBadWeaknesses: adminBad.weaknesses.length
}, null, 2));
