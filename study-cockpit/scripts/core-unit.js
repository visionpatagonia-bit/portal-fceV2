'use strict';

const { scoreAttempt } = require('../src/scoring');
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
