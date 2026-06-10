'use strict';

const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const { ExamContractService } = require('./src/services/exam-contract-service');
const { TelemetryService } = require('./src/services/telemetry-service');
const { MissionEngine } = require('./src/services/mission-engine');
const { AttemptService } = require('./src/services/attempt-service');
const { CalibrationService } = require('./src/services/calibration-service');
const { GeminiAdaptiveLayer } = require('./src/services/gemini-adaptive-layer');
const { StudyContentService } = require('./src/services/study-content-service');
const { AdaptiveSequenceService } = require('./src/services/adaptive-sequence-service');
const { AdaptiveContentKbService } = require('./src/services/adaptive-content-kb-service');
const { FirestoreKbService } = require('./src/services/firestore-kb-service');
const { FailExplanationKbService } = require('./src/services/fail-explanation-kb-service');
const { QuestionsKbService } = require('./src/services/cockpit-questions-kb-service');
const { CockpitAttemptStoreService, compactAttempt } = require('./src/services/cockpit-attempt-store-service');
const { ExamVariantService, validateVariant, normalizeVariant } = require('./src/services/exam-variant-service');
const { computePayroll } = require('./src/scoring');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8788);
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8'
};

const contractService = new ExamContractService({ root: ROOT });
const telemetry = new TelemetryService({ root: ROOT });
const missionEngine = new MissionEngine({ telemetry });
const attemptService = new AttemptService({ contractService, telemetry, missionEngine });
const calibrationService = new CalibrationService({ telemetry });
const studyContentService = new StudyContentService({ root: ROOT, contractService });
const adaptiveSequenceService = new AdaptiveSequenceService({ studyContentService });
// KB adaptativa: si hay FIREBASE_SERVICE_ACCOUNT -> Firestore compartido y persistente.
// Si no -> archivos locales (degrada solo, sin romper). El KB se genera server-side.
const firestoreKb = new FirestoreKbService({ root: ROOT });
const localKb = new AdaptiveContentKbService({ root: ROOT });
const adaptiveContentKb = firestoreKb.mode === 'firestore' ? firestoreKb : localKb;
const kbMode = firestoreKb.mode === 'firestore' ? 'firestore_shared' : 'local_file';
// Dataset de explicaciones de fallo (se ingesta async al corregir; sirve sin Gemini con el tiempo).
const failKb = new FailExplanationKbService({ root: ROOT });
// Cache de preguntas libres: la misma pregunta entre alumnos se sirve sin Gemini.
const questionsKb = new QuestionsKbService({ root: ROOT });
// Registro durable de cada evaluacion corregida (anonimo, sin respuestas del alumno). Dataset para
// entender que falla y mejorar el contenido. Firestore en prod, local de fallback.
const attemptStore = new CockpitAttemptStoreService({ root: ROOT });
// Espaciado entre generaciones de Gemini en la ingesta, para respetar el limite por minuto (free tier ~15 RPM).
const GEMINI_PACING_MS = 4000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const gemini = new GeminiAdaptiveLayer({ root: ROOT, telemetry });
// Variantes de examen generadas por Gemini y validadas contra el esquema del contrato.
const examVariantService = new ExamVariantService({ root: ROOT });

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end(JSON.stringify(body, null, 2));
}

function notFound(res) {
  sendJson(res, 404, { ok: false, error: 'not_found' });
}

function badRequest(res, error, extra = {}) {
  sendJson(res, 400, { ok: false, error, ...extra });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_500_000) reject(new Error('payload_too_large'));
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (_) {
        reject(new Error('invalid_json'));
      }
    });
  });
}

function safeJoin(base, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const normalized = path.normalize(path.join(base, decoded));
  return normalized.startsWith(base) ? normalized : null;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  let base = path.join(ROOT, 'public');
  let reqPath = url.pathname;

  if (reqPath === '/') reqPath = '/index.html';
  if (reqPath.startsWith('/prototypes/')) {
    base = path.join(ROOT, 'prototypes');
    reqPath = reqPath.replace('/prototypes', '');
  }
  if (reqPath.startsWith('/docs/')) {
    base = path.join(ROOT, 'docs');
    reqPath = reqPath.replace('/docs', '');
  }

  const filePath = safeJoin(base, reqPath);
  if (!filePath) return notFound(res);

  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  } catch (_) {
    notFound(res);
  }
}

async function handleHealth(res) {
  const llm = await gemini.status();
  return sendJson(res, 200, {
    ok: true,
    service: 'NEXUS Study Cockpit API',
    internalRuntime: 'SOVERINGBACKEND',
    version: '0.2.0',
    runtime: 'node-http-local',
    architecture: {
      deterministicCore: true,
      adaptiveLayer: 'gemini_backend_boundary',
      frontendMayScore: false,
      northStarMetric: 'calibration_within_1pt_rate'
    },
    llm,
    kb: { mode: kbMode, persistent: kbMode === 'firestore_shared', shared: kbMode === 'firestore_shared' },
    time: new Date().toISOString()
  });
}

async function handleStudyPlan(res, url) {
  const subjectId = url.searchParams.get('subjectId') || 'contabilidad_2p';
  const plan = await studyContentService.buildPlan(subjectId);
  if (!plan) return notFound(res);
  return sendJson(res, 200, { ok: true, plan });
}

async function handleStudyBlock(res, url) {
  const subjectId = url.searchParams.get('subjectId') || 'contabilidad_2p';
  const blockId = url.searchParams.get('blockId') || url.searchParams.get('code');
  if (!blockId) return badRequest(res, 'block_id_required');
  const block = await studyContentService.getStudyBlock(subjectId, blockId);
  if (!block) return notFound(res);
  return sendJson(res, 200, { ok: true, block });
}

async function handleAdaptiveSequence(req, res) {
  const body = await readBody(req);
  const subjectId = body.subjectId || 'contabilidad_2p';
  const sequence = await adaptiveSequenceService.build({
    subjectId,
    blockId: body.blockId || null,
    deterministicResult: body.deterministicResult || null
  });
  if (!sequence) return notFound(res);

  await telemetry.appendEvent({
    type: 'adaptive_sequence_requested',
    subjectId,
    sessionId: body.sessionId || 'local-cockpit',
    attemptId: body.attemptId || null,
    actor: 'student',
    payload: {
      currentStep: sequence.currentStep,
      targetBlock: sequence.targetBlock,
      deterministicScore: body.deterministicResult?.total ?? null
    }
  });

  return sendJson(res, 200, { ok: true, sequence });
}

async function handleAdaptiveStudyContent(req, res) {
  const body = await readBody(req);
  const subjectId = body.subjectId || 'contabilidad_2p';
  const sessionId = body.sessionId || 'local-cockpit';
  const blockId = body.blockId || body.code;
  const mode = body.mode || 'retrain';
  const targetMisses = body.targetMisses || [];
  const targetConcept = body.targetConcept || null; // feature "no entendi": re-explicar este concepto
  if (!blockId) return badRequest(res, 'block_id_required');

  const studyBlock = await studyContentService.getStudyBlock(subjectId, blockId);
  if (!studyBlock) return notFound(res);

  if (!body.forceNew) {
    const reusable = await adaptiveContentKb.findReusable({
      subjectId,
      blockId: studyBlock.id,
      mode,
      targetMisses
    });

    if (reusable) {
      const response = {
        ok: true,
        provider: 'kb',
        mode: 'adaptive_content_reused',
        configured: true,
        canScoreFinal: false,
        status: 'kb_reused',
        message: 'Contenido adaptativo reutilizado desde KB. No se llamo a Gemini.',
        content: reusable.content,
        kb: {
          entryId: reusable.entryId,
          fingerprint: reusable.fingerprint,
          reused: true,
          reuseCount: reusable.reuseCount,
          source: reusable.source,
          storedAt: reusable.createdAt,
          lastUsedAt: reusable.lastUsedAt
        }
      };

      await telemetry.appendEvent({
        type: 'adaptive_content_reused',
        subjectId,
        sessionId,
        attemptId: body.attemptId || null,
        actor: 'student',
        payload: {
          blockId: studyBlock.id,
          kbEntryId: reusable.entryId,
          fingerprint: reusable.fingerprint,
          mode,
          targetMisses
        }
      });

      return sendJson(res, 200, response);
    }
  }

  const generated = await gemini.generateAdaptiveContent({
    subjectId,
    studyBlock,
    deterministicResult: body.deterministicResult || null,
    studentProfile: body.studentProfile || {},
    targetMisses,
    mode,
    targetConcept
  });

  // No cachear el fallback transitorio (Gemini caido) ni las re-explicaciones one-off ("no entendi").
  const stored = (generated.content && generated.status !== 'gemini_unavailable' && mode !== 'reexplain')
    ? await adaptiveContentKb.save({
      subjectId,
      blockId: studyBlock.id,
      mode,
      targetMisses,
      generated,
      studyBlock
    })
    : null;

  await telemetry.appendEvent({
    type: 'adaptive_content_generated',
    subjectId,
    sessionId,
    attemptId: body.attemptId || null,
    actor: 'student',
    payload: {
      blockId: studyBlock.id,
      provider: generated.provider,
      configured: generated.configured,
      status: generated.status,
      model: generated.model || null,
      kbEntryId: stored?.entryId || null,
      kbStored: Boolean(stored),
      deterministicScore: body.deterministicResult?.total ?? null,
      targetMisses
    }
  });

  return sendJson(res, 200, {
    ...generated,
    kb: stored ? {
      entryId: stored.entryId,
      fingerprint: stored.fingerprint,
      stored: true,
      reused: false,
      source: stored.source,
      storedAt: stored.updatedAt
    } : null
  });
}

// Pregunta libre del alumno sobre un bloque -> Gemini responde anclado al contrato (no puntua).
async function handleStudyAsk(req, res) {
  const body = await readBody(req);
  const subjectId = body.subjectId || 'contabilidad_2p';
  const blockId = body.blockId || body.code;
  const question = String(body.question || '').trim();
  if (!blockId) return badRequest(res, 'block_id_required');
  if (!question) return badRequest(res, 'question_required');

  const studyBlock = await studyContentService.getStudyBlock(subjectId, blockId);
  if (!studyBlock) return notFound(res);

  // Reuso: si la misma pregunta ya fue respondida por IA, servir sin Gemini.
  // Una respuesta cacheada que es un "no lo sé / no esta en el bloque" NO se reutiliza: se regenera
  // (ahora con el resumen de toda la materia). Auto-cura las respuestas pobres viejas.
  const isRefusalAnswer = (a) => /no (lo )?define|no (se )?menciona|no (se )?encuentra|no (esta|figura)|fuera de (este|el) bloque|el bloque (de estudio )?no/i.test(String((a && a.respuesta) || ''));

  const cached = await questionsKb.find({ subjectId, blockId: studyBlock.id, question });
  if (cached && cached.answer && !isRefusalAnswer(cached.answer)) {
    await questionsKb.touch({ subjectId, blockId: studyBlock.id, question });
    await telemetry.appendEvent({ type: 'study_question_reused', subjectId, sessionId: body.sessionId || 'local-cockpit', actor: 'student', payload: { blockId: studyBlock.id, fingerprint: cached.fingerprint, occurrenceCount: cached.occurrenceCount } });
    return sendJson(res, 200, { ok: true, source: 'cache', answer: cached.answer, reuse: { occurrenceCount: cached.occurrenceCount } });
  }

  // Reuso por SIMILITUD: si ya hay una pregunta parecida respondida por IA en el bloque, servirla
  // sin gastar cuota de Gemini (conservador: contenido + negacion consistente).
  const similar = await questionsKb.findSimilar({ subjectId, blockId: studyBlock.id, question });
  if (similar && similar.answer && !isRefusalAnswer(similar.answer)) {
    try { await questionsKb.touch({ subjectId, blockId: studyBlock.id, question: similar.question }); } catch (_) {}
    await telemetry.appendEvent({ type: 'study_question_reused_similar', subjectId, sessionId: body.sessionId || 'local-cockpit', actor: 'student', payload: { blockId: studyBlock.id, similarity: similar.similarity } });
    return sendJson(res, 200, { ok: true, source: 'cache_similar', answer: similar.answer, reuse: { similarity: similar.similarity, originalQuestion: similar.question } });
  }

  // Resumen compacto de TODA la materia: si el concepto se ve en otro bloque, la IA lo responde igual.
  let subjectOverview = null;
  try {
    const map = await studyContentService.getStudyMap(subjectId);
    subjectOverview = (map?.blocks || []).map((b) => ({ bloque: b.label, claves: (b.coreTheory || []).map((t) => t.title).slice(0, 4), respuestaMinima: b.minimumAnswer })).slice(0, 12);
  } catch (_) { subjectOverview = null; }

  const result = await gemini.answerQuestion({ subjectId, blockId, blockLabel: studyBlock.label, question, studyBlock, subjectOverview });

  // Solo cachear si Gemini respondio de verdad (no el fallback transitorio del contrato).
  if (result.source === 'gemini') {
    await questionsKb.save({ subjectId, blockId: studyBlock.id, blockLabel: studyBlock.label, question, answer: result.answer });
  }

  await telemetry.appendEvent({
    type: 'study_question_asked',
    subjectId,
    sessionId: body.sessionId || 'local-cockpit',
    actor: 'student',
    payload: { blockId: studyBlock.id, question: question.slice(0, 200), source: result.source }
  });

  return sendJson(res, 200, { ok: true, ...result });
}

// Genera una variante de examen con Gemini, la VALIDA contra el esquema del contrato y la
// persiste. Si no se puede generar una valida, degrada al contrato (variant: null). El grader
// determinista sigue siendo la unica autoridad de score sobre la variante.
async function handleGenerateExamVariant(req, res) {
  const body = await readBody(req);
  const subjectId = body.subjectId || 'administracion';
  const resolved = await contractService.resolveSubject(subjectId);
  if (!resolved || !resolved.contract) return notFound(res);
  const contract = resolved.contract;
  const realSubjectId = resolved.subject?.id || subjectId;

  // Contabilidad: variedad numerica del Bloque C. Gemini propone el escenario; el backend computa la clave.
  if (realSubjectId === 'contabilidad_2p') {
    return handleGenerateContabVariant(res, realSubjectId, contract, body);
  }

  if (!Array.isArray(contract.variants) || !contract.variants.length) {
    return sendJson(res, 200, { ok: true, source: 'unsupported', variant: null, message: 'Esta materia todavia no soporta variantes generadas.' });
  }

  let gen;
  try { gen = await gemini.generateExamVariant({ subjectId, contract, conceptHint: body.conceptHint || null }); }
  catch (err) { gen = { source: 'error', variant: null, error: String((err && err.message) || err).slice(0, 160) }; }

  if (gen && gen.source === 'gemini' && gen.variant) {
    const check = validateVariant(contract, gen.variant);
    if (check.ok) {
      const id = 'gen_' + Date.now().toString(36);
      const variant = normalizeVariant(contract, gen.variant, { id, label: gen.variant.label });
      await examVariantService.save(subjectId, variant);
      try { await telemetry.appendEvent({ type: 'exam_variant_generated', subjectId, sessionId: body.sessionId || 'local-cockpit', actor: 'student', payload: { id, label: variant.label } }); } catch (_) {}
      return sendJson(res, 200, { ok: true, source: 'gemini', variant });
    }
    try { await telemetry.appendEvent({ type: 'exam_variant_rejected', subjectId, sessionId: body.sessionId || 'local-cockpit', actor: 'system', payload: { errors: check.errors.slice(0, 8) } }); } catch (_) {}
    return sendJson(res, 200, { ok: true, source: 'validation_failed', variant: null, message: 'La variante generada no cumplio el esquema; usa los temas del contrato.', errors: check.errors.slice(0, 8) });
  }

  return sendJson(res, 200, { ok: true, source: (gen && gen.source) || 'unavailable', variant: null, message: 'No se pudo generar una variante ahora; usa los temas del contrato.' });
}

// Clampa el escenario propuesto por Gemini a rangos seguros (aunque devuelva algo raro queda valido).
function sanitizeScenario(s) {
  if (!s || typeof s !== 'object') return null;
  let bruto = Math.round(Number(s.bruto));
  let ap = Math.round(Number(s.pctAportes));
  let cb = Math.round(Number(s.pctContrib));
  if (!Number.isFinite(bruto) || !Number.isFinite(ap) || !Number.isFinite(cb)) return null;
  bruto = Math.min(700000, Math.max(400000, Math.round(bruto / 1000) * 1000));
  ap = Math.min(19, Math.max(15, ap));
  cb = Math.min(28, Math.max(24, cb));
  return { bruto, pctAportes: ap, pctContrib: cb, contexto: String(s.contexto || '').slice(0, 120) };
}

// Variante de Contabilidad: escenario de calculo (clave determinista del backend) + V/F nuevos +
// enunciados de texto (propuestos por Gemini). Al frontend va SOLO lo visible (consigna, textos de
// V/F, enunciados); las claves (calculo + V/F expected/terms) quedan server-side.
async function handleGenerateContabVariant(res, subjectId, contract, body) {
  const calcBlock = (contract.blocks || []).find((b) => b.id === 'calculation_entry');
  if (!calcBlock || !calcBlock.grading || !Array.isArray(calcBlock.grading.fields)) {
    return sendJson(res, 200, { ok: true, source: 'unsupported', variant: null, message: 'La materia no soporta variantes de calculo.' });
  }
  let gen;
  try { gen = await gemini.generateContabVariant(); } catch (_) { gen = { source: 'error', data: null }; }
  const data = gen && gen.data;
  const sc = sanitizeScenario(data && data.scenario);
  if (!sc) {
    return sendJson(res, 200, { ok: true, source: (gen && gen.source) || 'unavailable', variant: null, message: 'No se pudo generar un escenario ahora; usa el tema del contrato.' });
  }
  const expected = computePayroll(sc); // CLAVE del calculo: determinista, backend (Gemini NO calcula)
  const calcFields = calcBlock.grading.fields.map((f) => ({ ...f, expected: expected[f.key] }));

  // V/F generados por Gemini (4). Si no vienen completos, se omite el override (B usa el contrato).
  const ids = ['b1', 'b2', 'b3', 'b4'];
  const vfIn = Array.isArray(data.vf) ? data.vf : [];
  const vfStatements = ids.map((id, i) => ({ id, text: String((vfIn[i] || {}).text || '').trim().slice(0, 220) }));
  const vfOk = vfStatements.every((s) => s.text.length > 8);
  const vfItems = ids.map((id, i) => {
    const src = vfIn[i] || {};
    return { id, expected: String(src.expected || '').toUpperCase() === 'V' ? 'V' : 'F', terms: Array.isArray(src.terms) ? src.terms.map(String).slice(0, 8) : [] };
  });

  // Enunciados de texto (mismo concepto): se corrigen con los criterios del contrato.
  const t = (data.text && typeof data.text === 'object') ? data.text : {};
  const textPrompts = {
    a_def: String(t.a_def || '').trim().slice(0, 400) || null,
    a_dev: String(t.a_dev || '').trim().slice(0, 400) || null,
    a_case: String(t.a_case || '').trim().slice(0, 400) || null
  };

  const id = 'gen_' + Date.now().toString(36);
  const miles = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const variant = {
    id, subjectId, generated: true,
    label: `Examen IA: liquidacion $${miles(sc.bruto)} (${sc.pctAportes}%/${sc.pctContrib}%)`,
    scenario: sc,
    vfStatements: vfOk ? vfStatements : null,
    textPrompts,
    gradingOverrides: {
      calculation_entry: { fields: calcFields },
      ...(vfOk ? { true_false_justified: { items: vfItems } } : {})
    }
  };
  await examVariantService.save(subjectId, variant);
  try { await telemetry.appendEvent({ type: 'exam_variant_generated', subjectId, sessionId: body.sessionId || 'local-cockpit', actor: 'student', payload: { id, kind: 'contab_full', vf: vfOk } }); } catch (_) {}
  // Al frontend SOLO lo visible (sin claves): consigna + textos de V/F + enunciados.
  return sendJson(res, 200, { ok: true, source: 'gemini', variant: { id, label: variant.label, scenario: sc, vfStatements: variant.vfStatements, textPrompts } });
}

// Banco de examen DETERMINISTA (cache en memoria). Permite rotar el parcial cada intento SIN Gemini.
let _examBankCache = null;
async function loadExamBank() {
  if (_examBankCache) return _examBankCache;
  try {
    const raw = await fs.readFile(path.join(ROOT, 'data', 'subjects', 'contabilidad_2p', 'exam-bank.json'), 'utf8');
    const parsed = JSON.parse(raw);
    const themes = Array.isArray(parsed.themes) ? parsed.themes : [];
    if (themes.length) _examBankCache = themes; // solo cachea si cargo bien (no fija un fallo transitorio)
    return themes;
  } catch (_) { return []; }
}

// Construye (sin persistir) la variante rotada determinista para un indice. Misma clave que la
// variante IA pero 100% determinista: computePayroll para el calculo + items V/F del banco. Es PURA
// para poder reusarla tanto al servir el examen como al CORREGIRLO, asi el score nunca depende de que
// la persistencia en disco haya funcionado. Devuelve null si el banco/contrato no soportan rotacion.
async function buildRotVariant(subjectId, contract, rotationIndex) {
  const calcBlock = (contract.blocks || []).find((b) => b.id === 'calculation_entry');
  if (!calcBlock || !calcBlock.grading || !Array.isArray(calcBlock.grading.fields)) return null;
  const bank = await loadExamBank();
  if (!bank.length) return null;
  const n = bank.length;
  const idx = (((Number(rotationIndex) || 0) % n) + n) % n; // normaliza negativos y NaN
  const theme = bank[idx] || bank[0];
  const sc = sanitizeScenario(theme.scenario);
  if (!sc) return null;
  const expected = computePayroll(sc); // CLAVE determinista del calculo (backend), igual que la variante IA
  const calcFields = calcBlock.grading.fields.map((f) => ({ ...f, expected: expected[f.key] }));

  const ids = ['b1', 'b2', 'b3', 'b4'];
  const byId = {};
  (Array.isArray(theme.vf) ? theme.vf : []).forEach((v) => { if (v && v.id) byId[v.id] = v; });
  const vfStatements = ids.map((id) => ({ id, text: String((byId[id] || {}).text || '').trim().slice(0, 240) }));
  const vfOk = vfStatements.every((s) => s.text.length > 8);
  const vfItems = ids.map((id) => {
    const src = byId[id] || {};
    return { id, expected: String(src.expected || '').toUpperCase() === 'V' ? 'V' : 'F', terms: Array.isArray(src.terms) ? src.terms.map(String).slice(0, 8) : [] };
  });

  const tp = (theme.textPrompts && typeof theme.textPrompts === 'object') ? theme.textPrompts : {};
  const textPrompts = {
    a_def: String(tp.a_def || '').trim().slice(0, 400) || null,
    a_dev: String(tp.a_dev || '').trim().slice(0, 400) || null,
    a_case: String(tp.a_case || '').trim().slice(0, 400) || null
  };

  const miles = (x) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return {
    id: 'gen_rot_' + idx, // ESTABLE: idempotente, no acumula archivos; re-derivable en el score
    subjectId, generated: true, deterministic: true,
    label: `Tema rotado ${theme.id || idx}: liquidacion $${miles(sc.bruto)} (${sc.pctAportes}%/${sc.pctContrib}%)`,
    scenario: sc,
    vfStatements: vfOk ? vfStatements : null,
    textPrompts,
    // Prompts de los bloques de texto, para que la deteccion anti-copia (gradeText) tenga el enunciado
    // del tema rotado y funcione igual que en el examen base. No afecta calc/V-F (van por overrides).
    blocks: [
      { blockId: 'written_definition', items: [{ prompt: textPrompts.a_def || '' }] },
      { blockId: 'technical_development', items: [{ prompt: textPrompts.a_dev || '' }] },
      { blockId: 'integrated_case', items: [{ prompt: textPrompts.a_case || '' }] }
    ],
    gradingOverrides: {
      calculation_entry: { fields: calcFields },
      ...(vfOk ? { true_false_justified: { items: vfItems } } : {})
    }
  };
}

// Sirve el tema rotado del turno: lo construye, lo persiste (best-effort) y devuelve SOLO lo visible.
// La clave queda server-side; el score la re-deriva si hiciera falta (no depende del disco).
async function handleNextContabVariant(res, subjectId, contract, body) {
  const variant = await buildRotVariant(subjectId, contract, body.rotationIndex);
  if (!variant) {
    return sendJson(res, 200, { ok: true, source: 'unavailable', variant: null, message: 'Banco de examen no disponible; usa el tema del contrato.' });
  }
  try { await examVariantService.save(subjectId, variant); } catch (_) {}
  return sendJson(res, 200, { ok: true, source: 'bank', variant: { id: variant.id, label: variant.label, scenario: variant.scenario, vfStatements: variant.vfStatements, textPrompts: variant.textPrompts } });
}

// Metricas de dificultad: agrega el store durable de evaluaciones (anonimo) -> por bloque cuanto se
// falla en promedio, y los conceptos/errores mas frecuentes (KB). Alimenta la analitica de Aprender.
async function handleAnalyticsDifficulty(res, url) {
  const subjectId = url.searchParams.get('subjectId') || 'contabilidad_2p';
  let attempts = [];
  try { attempts = await attemptStore.list({ subjectId, limit: 500 }); } catch (_) {}
  const byBlock = {};
  for (const a of attempts) {
    for (const b of (a.blocks || [])) {
      const e = byBlock[b.id] || (byBlock[b.id] = { blockId: b.id, label: b.label, attempts: 0, sumPoints: 0, gapCount: 0, sumLost: 0 });
      e.attempts++;
      e.sumPoints += (b.points || 0);
      if ((b.misses || []).length > 0) { e.gapCount++; e.sumLost += ((b.maxPoints || 2) - (b.points || 0)); }
    }
  }
  const blocks = Object.values(byBlock).map((e) => ({
    blockId: e.blockId, label: e.label, attempts: e.attempts,
    avgPoints: e.attempts ? Math.round((e.sumPoints / e.attempts) * 100) / 100 : 0,
    avgLost: e.attempts ? Math.round((e.sumLost / e.attempts) * 100) / 100 : 0,
    failRate: e.attempts ? Math.round((e.gapCount / e.attempts) * 100) : 0
  })).sort((a, b) => b.avgLost - a.avgLost);
  let topMisses = [];
  try {
    topMisses = (await failKb.list({ subjectId, limit: 8 })).map((f) => ({
      missText: f.missText, blockLabel: f.blockLabel, blockId: f.blockId,
      occurrenceCount: f.occurrenceCount || 1, reviewStatus: f.reviewStatus || null
    }));
  } catch (_) {}
  return sendJson(res, 200, { ok: true, subjectId, attemptsAnalyzed: attempts.length, mode: attemptStore.mode, blocks, topMisses });
}

async function handleAdaptiveContentKbList(res, url) {
  const entries = await adaptiveContentKb.list({
    subjectId: url.searchParams.get('subjectId') || undefined,
    blockId: url.searchParams.get('blockId') || undefined,
    mode: url.searchParams.get('mode') || undefined,
    limit: Number(url.searchParams.get('limit') || 50)
  });
  return sendJson(res, 200, { ok: true, entries });
}

async function handleAdaptiveContentKbGet(res, entryId) {
  const entry = await adaptiveContentKb.get(entryId);
  if (!entry) return notFound(res);
  return sendJson(res, 200, { ok: true, entry });
}

async function handleNextMission(req, res, url) {
  const subjectId = url.searchParams.get('subjectId') || url.searchParams.get('subject') || 'contabilidad_2p';
  const sessionId = url.searchParams.get('sessionId') || 'local-demo';
  const resolved = await contractService.resolveSubject(subjectId);
  if (!resolved) return notFound(res);

  const mission = await missionEngine.getNextMission({
    subjectId: resolved.subject.id,
    sessionId,
    contract: resolved.contract
  });

  return sendJson(res, 200, { ok: true, mission });
}

async function handleStartAttempt(req, res) {
  const body = await readBody(req);
  const started = await attemptService.startAttempt({
    subjectId: body.subjectId || 'contabilidad_2p',
    sessionId: body.sessionId || 'local-demo',
    variantId: body.variantId || null
  });

  if (!started.ok) return badRequest(res, started.error);
  return sendJson(res, 201, started);
}

async function handleScoreAttempt(req, res) {
  const body = await readBody(req);
  const subjectId = body.subjectId || 'contabilidad_2p';
  const sessionId = body.sessionId || 'local-demo';
  const mode = body.mode || 'practice';
  const attemptId = body.attemptId || ('att_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6));

  // Si el intento es sobre una variante generada por IA (gen_*), se carga del store y se inyecta
  // para que el grader determinista la corrija. El score lo sigue decidiendo el motor, no Gemini.
  const variantId = body.answers && body.answers.variantId;
  let extraVariant = null;
  if (typeof variantId === 'string' && variantId.indexOf('gen_') === 0) {
    try { extraVariant = await examVariantService.getById(subjectId, variantId); } catch (_) { extraVariant = null; }
    // Variante de ROTACION determinista (gen_rot_<idx>): si no se pudo cargar del disco (persistencia
    // fallida, dir null, otro proceso), se RE-DERIVA del banco. Asi el enunciado que vio el alumno y
    // la clave con que se corrige nunca se desincronizan: jamas cae a la clave del tema base.
    const rotM = typeof variantId === 'string' && variantId.match(/^gen_rot_(\d+)$/);
    if (!extraVariant && rotM) {
      try {
        const resolved = await contractService.resolveSubject(subjectId);
        if (resolved && resolved.contract) extraVariant = await buildRotVariant(resolved.subject?.id || subjectId, resolved.contract, Number(rotM[1]));
      } catch (_) { extraVariant = null; }
    }
  }

  const scored = await attemptService.score({ subjectId, sessionId, attemptId, answers: body.answers || {}, mode, extraVariant });

  // Responder YA con la nota determinista (la ingesta de fallos NO bloquea).
  sendJson(res, 200, {
    ok: true,
    attemptId,
    result: scored.result,
    nextMission: scored.nextMission,
    event: scored.events.attemptScored,
    events: scored.events
  });

  // Persistencia async (best-effort, post-respuesta): (1) registro durable de la evaluacion;
  // (2) ingesta de fallos -> explicaciones. Gemini solo EXPLICA; el motor ya decidio la nota.
  setImmediate(() => {
    attemptStore.save(compactAttempt({ subjectId, sessionId, attemptId, mode, result: scored.result })).catch(() => {});
    ingestFailures({ subjectId, sessionId, attemptId, mode, result: scored.result }).catch(() => {});
  });
}

// Por cada miss que marco el motor: si ya hay explicacion -> reusar (sin Gemini); si no -> generar + guardar.
async function ingestFailures({ subjectId, sessionId, attemptId, mode, result }) {
  // Ingesta TODOS los gaps (cada bloque que perdio puntos), no solo las debilidades por umbral, para
  // que cada error tenga su explicacion + respuesta modelo y sea recuperable. Fallback a weaknesses
  // para resultados viejos sin el campo gaps.
  const gaps = Array.isArray(result?.gaps) && result.gaps.length ? result.gaps
    : (Array.isArray(result?.weaknesses) ? result.weaknesses : []);
  // Mejora por frecuencia: cuando un error ya visto >= IMPROVE_AT veces todavia no fue mejorado, se
  // regenera una explicacion de MAYOR calidad con IA. Una sola por pasada (throttle) para no gastar cuota.
  const IMPROVE_AT = 3;
  let improvedThisPass = false;
  for (const w of gaps) {
    const blockId = w.blockId;
    const blockLabel = w.label || null;
    const misses = Array.isArray(w.misses) ? w.misses : [];
    if (!blockId || !misses.length) continue;
    let studyBlock = null;
    try { studyBlock = await studyContentService.getStudyBlock(subjectId, blockId); } catch (_) {}
    for (const missText of misses) {
      if (!missText) continue;
      try {
        const found = await failKb.find({ subjectId, blockId, missText });
        // Reusar solo explicaciones de Gemini que YA traen respuesta modelo; las viejas (sin
        // respuestaModelo) o el fallback de contrato se regeneran para subir la calidad.
        const cached = (found && found.source === 'gemini' && found.explanation && found.explanation.respuestaModelo) ? found : null;
        if (cached) {
          await failKb.touch({ subjectId, blockId, missText });
          await telemetry.appendEvent({ type: 'failure_explanation_reused', subjectId, sessionId, attemptId, actor: 'student', payload: { blockId, fingerprint: cached.fingerprint, entryId: cached.entryId, mode } });
          // occurrenceCount de cached es el de ANTES de este touch -> +1. Si ya es frecuente y no se
          // mejoro aun, regenerar una explicacion mejor (con analogia + respuesta modelo impecable).
          const count = (cached.occurrenceCount || 0) + 1;
          if (!improvedThisPass && count >= IMPROVE_AT && cached.reviewStatus !== 'ai_improved') {
            improvedThisPass = true;
            const better = await gemini.explainFailure({ subjectId, blockId, blockLabel, missText, studyBlock, emphasis: 'high_frequency' });
            if (better.source === 'gemini' && better.explanation && better.explanation.respuestaModelo) {
              await failKb.improve({ subjectId, blockId, missText, explanation: better.explanation, source: 'gemini' });
              await telemetry.appendEvent({ type: 'failure_explanation_improved', subjectId, sessionId, attemptId, actor: 'system', payload: { blockId, fingerprint: cached.fingerprint, entryId: cached.entryId, occurrenceCount: count, mode } });
            }
            await sleep(GEMINI_PACING_MS);
          }
        } else {
          const gen = await gemini.explainFailure({ subjectId, blockId, blockLabel, missText, studyBlock });
          const saved = await failKb.save({ subjectId, blockId, blockLabel, missText, explanation: gen.explanation, source: gen.source });
          await telemetry.appendEvent({ type: gen.source === 'gemini' ? 'failure_explanation_generated' : 'failure_explanation_fallback', subjectId, sessionId, attemptId, actor: 'student', payload: { blockId, fingerprint: saved.fingerprint, entryId: saved.entryId, source: gen.source, mode } });
          await sleep(GEMINI_PACING_MS); // espaciar pedidos para no exceder el limite por minuto
        }
      } catch (e) {
        try { await telemetry.appendEvent({ type: 'failure_explanation_failed', subjectId, sessionId, attemptId, actor: 'student', payload: { blockId, error: String((e && e.message) || e).slice(0, 200) } }); } catch (_) {}
      }
    }
  }
}

// Lookup STATELESS: el frontend manda sus misses, el server devuelve la explicacion guardada (KB persistente).
async function handleFailExplanationsLookup(req, res) {
  const body = await readBody(req);
  const subjectId = body.subjectId || 'contabilidad_2p';
  const items = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
  const explanations = [];
  for (const it of items) {
    const blockId = it && it.blockId;
    const missText = it && it.missText;
    if (!blockId || !missText) { explanations.push({ blockId: blockId || null, missText: missText || null, explanation: null }); continue; }
    let rec = null;
    try { rec = await failKb.find({ subjectId, blockId, missText }); } catch (_) {}
    explanations.push({ blockId, missText, fingerprint: rec ? rec.fingerprint : null, source: rec ? rec.source : null, occurrenceCount: rec ? rec.occurrenceCount : null, explanation: rec ? rec.explanation : null });
  }
  return sendJson(res, 200, { ok: true, explanations });
}

async function handleRealGrade(req, res) {
  const body = await readBody(req);
  const subjectId = body.subjectId || 'contabilidad_2p';
  const sessionId = body.sessionId || 'local-demo';
  const realGrade = Number(body.realGrade);

  if (!Number.isFinite(realGrade)) return badRequest(res, 'real_grade_required');
  if (realGrade < 0 || realGrade > 10) return badRequest(res, 'real_grade_out_of_range');

  const recorded = await calibrationService.recordRealGrade({
    subjectId,
    sessionId,
    attemptId: body.attemptId || null,
    realGrade,
    source: body.source || 'student_reported'
  });

  return sendJson(res, 201, { ok: true, ...recorded });
}

async function handleCalibration(res, url) {
  const calibration = await calibrationService.getCalibration({
    subjectId: url.searchParams.get('subjectId') || undefined,
    sessionId: url.searchParams.get('sessionId') || undefined
  });
  return sendJson(res, 200, { ok: true, calibration });
}

async function handleLlmReview(req, res) {
  const body = await readBody(req);
  const studyBlock = body.blockId
    ? await studyContentService.getStudyBlock(body.subjectId || 'contabilidad_2p', body.blockId)
    : null;
  const review = await gemini.reviewAnswer({
    subjectId: body.subjectId || 'contabilidad_2p',
    answer: body.answer || '',
    deterministicResult: body.deterministicResult || null,
    studyBlock
  });

  await telemetry.appendEvent({
    type: 'llm_feedback_requested',
    subjectId: body.subjectId || 'contabilidad_2p',
    sessionId: body.sessionId || 'local-demo',
    attemptId: body.attemptId || null,
    actor: 'student',
    payload: {
      provider: review.provider,
      configured: review.configured,
      status: review.status,
      answerLength: review.received.answerLength
    }
  });

  return sendJson(res, 200, review);
}

async function handleLlmConfig(req, res) {
  const body = await readBody(req);
  const configured = await gemini.configure({
    apiKey: body.apiKey,
    model: body.model || undefined
  });
  if (!configured.ok) return badRequest(res, configured.error);

  await telemetry.appendEvent({
    type: 'llm_configured',
    subjectId: body.subjectId || null,
    sessionId: body.sessionId || 'local-cockpit',
    actor: 'student',
    payload: {
      provider: 'gemini',
      keyPreview: configured.keyPreview,
      model: configured.model,
      storage: configured.storage
    }
  });

  return sendJson(res, 200, configured);
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const parts = url.pathname.split('/').filter(Boolean);

  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return handleHealth(res);
  }

  if (req.method === 'GET' && url.pathname === '/api/subjects') {
    return sendJson(res, 200, { ok: true, subjects: await contractService.listSubjects() });
  }

  if (req.method === 'GET' && parts[1] === 'subjects' && parts[3] === 'contract') {
    const resolved = await contractService.resolveSubject(parts[2]);
    if (!resolved) return notFound(res);
    return sendJson(res, 200, { ok: true, contract: resolved.contract });
  }

  if (req.method === 'GET' && url.pathname === '/api/missions/next') {
    return handleNextMission(req, res, url);
  }

  if (req.method === 'GET' && url.pathname === '/api/study/plan') {
    return handleStudyPlan(res, url);
  }

  if (req.method === 'GET' && url.pathname === '/api/study/block') {
    return handleStudyBlock(res, url);
  }

  if (req.method === 'POST' && url.pathname === '/api/study/adaptive-sequence') {
    return handleAdaptiveSequence(req, res);
  }

  if (req.method === 'POST' && url.pathname === '/api/study/adaptive-content') {
    return handleAdaptiveStudyContent(req, res);
  }

  if (req.method === 'POST' && url.pathname === '/api/study/ask') {
    return handleStudyAsk(req, res);
  }

  if (req.method === 'POST' && url.pathname === '/api/exam/generate-variant') {
    return handleGenerateExamVariant(req, res);
  }

  // Rotacion DETERMINISTA del parcial (sin Gemini): devuelve el tema del banco para el intento actual.
  if (req.method === 'POST' && url.pathname === '/api/exam/next-variant') {
    const body = await readBody(req);
    const subjectId = body.subjectId || 'contabilidad_2p';
    const resolved = await contractService.resolveSubject(subjectId);
    if (!resolved || !resolved.contract) return notFound(res);
    const realSubjectId = resolved.subject?.id || subjectId;
    if (realSubjectId !== 'contabilidad_2p') {
      return sendJson(res, 200, { ok: true, source: 'unsupported', variant: null });
    }
    return handleNextContabVariant(res, realSubjectId, resolved.contract, body);
  }

  if (req.method === 'GET' && url.pathname === '/api/analytics/difficulty') {
    return handleAnalyticsDifficulty(res, url);
  }

  if (req.method === 'GET' && url.pathname === '/api/gemini/keys-health') {
    return gemini.keysHealth().then((h) => sendJson(res, 200, { ok: true, ...h })).catch(() => sendJson(res, 200, { ok: true, keyCount: 0, keys: [] }));
  }

  if (req.method === 'GET' && url.pathname === '/api/kb/adaptive-content') {
    return handleAdaptiveContentKbList(res, url);
  }

  if (req.method === 'GET' && parts[1] === 'kb' && parts[2] === 'adaptive-content' && parts[3]) {
    return handleAdaptiveContentKbGet(res, parts[3]);
  }

  if (req.method === 'POST' && url.pathname === '/api/attempts/start') {
    return handleStartAttempt(req, res);
  }

  if (req.method === 'POST' && url.pathname === '/api/attempts/score') {
    return handleScoreAttempt(req, res);
  }

  if (req.method === 'POST' && url.pathname === '/api/fail-explanations/lookup') {
    return handleFailExplanationsLookup(req, res);
  }

  if (req.method === 'GET' && url.pathname === '/api/fail-explanations') {
    return sendJson(res, 200, {
      ok: true,
      kbMode: failKb.mode,
      entries: await failKb.list({
        subjectId: url.searchParams.get('subjectId') || undefined,
        blockId: url.searchParams.get('blockId') || undefined,
        limit: Number(url.searchParams.get('limit') || 50)
      })
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/grades/real') {
    return handleRealGrade(req, res);
  }

  if (req.method === 'GET' && url.pathname === '/api/calibration') {
    return handleCalibration(res, url);
  }

  if (req.method === 'GET' && url.pathname === '/api/prototypes') {
    return sendJson(res, 200, {
      ok: true,
      prototypes: await readJson(path.join(ROOT, 'data', 'prototypes-manifest.json'))
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/rescue-map') {
    return sendJson(res, 200, {
      ok: true,
      rescue: await readJson(path.join(ROOT, 'data', 'rescue-map.json'))
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/events') {
    return sendJson(res, 200, {
      ok: true,
      events: await telemetry.readEvents({
        limit: Number(url.searchParams.get('limit') || 40),
        subjectId: url.searchParams.get('subjectId') || undefined,
        sessionId: url.searchParams.get('sessionId') || undefined,
        type: url.searchParams.get('type') || undefined
      })
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/events') {
    const body = await readBody(req);
    return sendJson(res, 201, { ok: true, event: await telemetry.appendEvent(body) });
  }

  if (req.method === 'POST' && url.pathname === '/api/llm/review') {
    return handleLlmReview(req, res);
  }

  if (req.method === 'POST' && url.pathname === '/api/llm/config') {
    return handleLlmConfig(req, res);
  }

  notFound(res);
}

async function requestHandler(req, res) {
  try {
    if (req.url.startsWith('/api/')) return await handleApi(req, res);
    return await serveStatic(req, res);
  } catch (error) {
    sendJson(res, error.message === 'payload_too_large' ? 413 : 500, {
      ok: false,
      error: error.message || 'server_error'
    });
  }
}

telemetry.ensureReady().then(() => {
  http.createServer(requestHandler).listen(PORT, HOST, () => {
    console.log(`NEXUS Study Cockpit API listening on http://${HOST}:${PORT}`);
  });
});
