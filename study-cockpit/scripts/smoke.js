'use strict';

const http = require('http');

const base = process.env.NEXUS_SMOKE_BASE || 'http://127.0.0.1:8788';

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

function request(pathname, options = {}) {
  const url = new URL(pathname, base);
  const body = Object.prototype.hasOwnProperty.call(options, 'body') ? JSON.stringify(options.body) : null;
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {}
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (_) {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  const sessionId = `smoke-${Date.now()}`;
  const health = await request('/api/health');
  const subjects = await request('/api/subjects');
  const missionBefore = await request(`/api/missions/next?subjectId=contabilidad_2p&sessionId=${sessionId}`);
  const start = await request('/api/attempts/start', {
    method: 'POST',
    body: {
      subjectId: 'contabilidad_2p',
      sessionId
    }
  });
  const score = await request('/api/attempts/score', {
    method: 'POST',
    body: {
      subjectId: 'contabilidad_2p',
      sessionId,
      attemptId: start.body.attempt?.attemptId,
      answers: demoAnswers()
    }
  });
  const grade = await request('/api/grades/real', {
    method: 'POST',
    body: {
      subjectId: 'contabilidad_2p',
      sessionId,
      attemptId: start.body.attempt?.attemptId,
      realGrade: 8.5,
      source: 'smoke_test'
    }
  });
  const calibration = await request(`/api/calibration?subjectId=contabilidad_2p&sessionId=${sessionId}`);

  const ok = Boolean(
    health.body.ok &&
    health.body.architecture?.deterministicCore === true &&
    subjects.body.subjects?.length >= 2 &&
    missionBefore.body.mission?.source === 'deterministic' &&
    start.body.attempt?.attemptId &&
    score.body.result?.total >= 8 &&
    score.body.nextMission?.source === 'deterministic' &&
    grade.body.calibration?.totalCases >= 1 &&
    calibration.body.calibration?.calibrationWithin1ptRate === 1
  );

  console.log(JSON.stringify({
    ok,
    service: health.body.service,
    subjects: subjects.body.subjects?.map((subject) => subject.id),
    firstMission: missionBefore.body.mission?.purpose,
    attemptId: start.body.attempt?.attemptId,
    score: score.body.result?.total,
    status: score.body.result?.status,
    nextMission: score.body.nextMission?.purpose,
    calibrationWithin1ptRate: calibration.body.calibration?.calibrationWithin1ptRate,
    llmConfigured: health.body.llm?.configured
  }, null, 2));

  process.exit(ok ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
