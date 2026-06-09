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
const gemini = new GeminiAdaptiveLayer({ root: ROOT });

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
  const scored = await attemptService.score({
    subjectId: body.subjectId || 'contabilidad_2p',
    sessionId: body.sessionId || 'local-demo',
    attemptId: body.attemptId || null,
    answers: body.answers || {},
    mode: body.mode || 'practice'
  });

  return sendJson(res, 200, {
    ok: true,
    result: scored.result,
    nextMission: scored.nextMission,
    event: scored.events.attemptScored,
    events: scored.events
  });
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
