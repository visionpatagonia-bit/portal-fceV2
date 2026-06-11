'use strict';

const fs = require('fs/promises');
const fsSync = require('fs');
const https = require('https');
const path = require('path');

function maskKey(key) {
  if (!key) return null;
  return `...${String(key).slice(-4)}`;
}

function postJson(url, payload, timeoutMs = 20000) {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: timeoutMs
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch (_) {
          parsed = { raw };
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          reject(new Error(parsed.error?.message || `gemini_http_${res.statusCode}`));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error('gemini_timeout'));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Errores transitorios de Gemini (alta demanda / saturado) que valen un reintento.
// NO reintenta: cuota agotada (429 RESOURCE_EXHAUSTED) -> reintentar es en vano hasta que
// resetee la cuota; ni timeout (ya fue lento). SI reintenta el "high demand" temporal.
function isRetryableGemini(err) {
  const m = String((err && err.message) || '').toLowerCase();
  if (/quota|exceeded|billing|resource[_ ]exhausted/.test(m)) return false;
  return /high demand|try again|temporar|overload|unavailable|service is|\b503\b|\b502\b/.test(m);
}

// Cuota agotada / facturacion (429 RESOURCE_EXHAUSTED): reintentar la MISMA key es en vano.
// Vale rotar a una key de fallback. Distinto del "high demand" transitorio (mismo key, retry).
function isQuotaError(err) {
  const m = String((err && err.message) || '').toLowerCase();
  return /quota|resource[_ ]exhausted|exceeded your current|billing|\b429\b/.test(m);
}

// Una key INUTILIZABLE para esta llamada: cuota agotada (429) O invalida/auth (mal pegada,
// revocada, sin permiso). En ambos casos conviene saltar a la siguiente key de fallback en vez
// de frenar. Otros errores (request malformado, modelo inexistente, red) NO rotan: fallarian
// igual con cualquier key y hay que dejarlos salir para no enmascarar un bug.
function isKeyUnusable(err) {
  const m = String((err && err.message) || '').toLowerCase();
  return isQuotaError(err) || /api[_ ]?key|invalid authentication|unauthenticated|permission denied|\b401\b|\b403\b/.test(m);
}

// postJson con reintentos acotados, SOLO ante errores transitorios.
async function postJsonRetry(url, payload, { timeoutMs = 20000, tries = 1, delayMs = 2500 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await postJson(url, payload, timeoutMs); }
    catch (err) {
      last = err;
      if (i === tries - 1 || !isRetryableGemini(err)) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw last;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

// Parser tolerante: Gemini a veces envuelve el JSON en ```json o agrega prosa alrededor.
// Intenta JSON.parse directo y, si falla, extrae el primer objeto {...} del texto.
function parseJsonLoose(text) {
  let s = String(text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(s); } catch (_) { /* sigue */ }
  const i = s.indexOf('{'), j = s.lastIndexOf('}');
  if (i >= 0 && j > i) { try { return JSON.parse(s.slice(i, j + 1)); } catch (_) { /* sigue */ } }
  return null;
}

function trimText(value, max = 900) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeList(value, fallback = [], maxItems = 5, maxText = 360) {
  const source = asArray(value).length ? value : fallback;
  return source
    .map((item) => trimText(item, maxText))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeCards(value, fallback = [], maxItems = 4) {
  const source = asArray(value).length ? value : fallback;
  return source
    .map((item) => ({
      title: trimText(item?.title, 90),
      explanation: trimText(item?.explanation || item?.body, 380),
      exam_trigger: trimText(item?.exam_trigger || item?.trigger, 220)
    }))
    .filter((item) => item.title && item.explanation)
    .slice(0, maxItems);
}

function normalizeRecall(value, fallback = [], maxItems = 4) {
  const source = asArray(value).length ? value : fallback;
  return source
    .map((item) => ({
      question: trimText(item?.question || item?.prompt, 260),
      expected_answer: trimText(item?.expected_answer || item?.expected, 420),
      hint: trimText(item?.hint, 220)
    }))
    .filter((item) => item.question && item.expected_answer)
    .slice(0, maxItems);
}

class GeminiAdaptiveLayer {
  constructor({ root, apiKey = process.env.GEMINI_API_KEY, telemetry = null } = {}) {
    this.root = root;
    this.envApiKey = apiKey || null;
    this.runtimeDir = root ? path.join(root, 'data', 'runtime') : null;
    this.secretsFile = this.runtimeDir ? path.join(this.runtimeDir, 'gemini.secrets.json') : null;
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    // Monitoreo de keys (en memoria; se pierde al reiniciar, la telemetria guarda el historico).
    this.telemetry = telemetry || null;
    this.keyHealth = [];        // por indice de key: contadores + ultimas rotaciones
    this.activeKeyIndex = null; // ultima key que respondio OK
  }

  // Actualiza el contador de salud de una key tras una llamada.
  _trackKey(i, preview, status, err) {
    const h = this.keyHealth[i] || (this.keyHealth[i] = { keyIndex: i, keyPreview: preview, ok: 0, quota: 0, auth: 0, other: 0, lastStatus: null, lastAt: null, rotations: [] });
    h.keyPreview = preview;
    if (status === 'ok') h.ok++; else if (status === 'quota') h.quota++; else if (status === 'auth') h.auth++; else h.other++;
    h.lastStatus = status;
    h.lastAt = new Date().toISOString();
    if (err) h.lastError = String((err && err.message) || err).slice(0, 120);
  }

  // Registra una rotacion (key inutilizable -> siguiente) en memoria + telemetria (best-effort).
  _recordRotation(from, to, reason, err) {
    const h = this.keyHealth[from];
    if (h) { h.rotations = (h.rotations || []); h.rotations.unshift({ to, reason, at: new Date().toISOString() }); h.rotations = h.rotations.slice(0, 5); }
    if (this.telemetry && typeof this.telemetry.appendEvent === 'function') {
      try { this.telemetry.appendEvent({ type: 'gemini_key_rotated', actor: 'system', payload: { fromKeyIndex: from, toKeyIndex: to, reason, error: String((err && err.message) || '').slice(0, 120), keyCount: this.keyHealth.length } }); } catch (_) {}
    }
  }

  // Estado consolidado de salud de keys (para /api/gemini/keys-health y el panel del front).
  async keysHealth() {
    const keys = await this.getApiKeys();
    for (let i = 0; i < keys.length; i++) {
      if (!this.keyHealth[i]) this.keyHealth[i] = { keyIndex: i, keyPreview: '...' + keys[i].slice(-4), ok: 0, quota: 0, auth: 0, other: 0, lastStatus: 'sin_uso', lastAt: null, rotations: [] };
    }
    return {
      keyCount: keys.length,
      activeKeyIndex: this.activeKeyIndex,
      model: (await this.readStoredConfig()).model || this.model,
      keys: this.keyHealth.slice(0, keys.length)
    };
  }

  async readStoredConfig() {
    if (!this.secretsFile || !fsSync.existsSync(this.secretsFile)) return {};
    return JSON.parse(await fs.readFile(this.secretsFile, 'utf8'));
  }

  // Lista ordenada de keys: primaria primero, luego fallbacks. Fuentes:
  //  - env: GEMINI_API_KEY (primaria), GEMINI_API_KEY_2/3/4, o GEMINI_FALLBACK_KEYS (coma-separadas)
  //  - secrets file: apiKey (primaria) + fallbackKeys[] (o apiKeys[])
  // Todas son secretas (gitignored / env de Render). Se deduplican y se descartan las vacias.
  async getApiKeys() {
    const candidates = [];
    if (this.envApiKey) candidates.push(this.envApiKey);
    // Cualquier env var GEMINI_* (menos MODEL y la primaria GEMINI_API_KEY) cuyo valor sea una key
    // o una lista separada por comas. Asi sirve CUALQUIER nombre en Render: GEMINI_API_KEY_2,
    // GEMINI_FALL_1, GEMINI_FALL_2, GEMINI_FALLBACK_KEYS=k1,k2, etc.
    for (const [name, val] of Object.entries(process.env)) {
      if (/^GEMINI_/i.test(name) && !/^GEMINI_(MODEL|API_KEY)$/i.test(name)) {
        String(val || '').split(',').forEach((k) => candidates.push(k));
      }
    }
    let stored = {};
    try { stored = await this.readStoredConfig(); } catch (_) { stored = {}; }
    if (stored.apiKey) candidates.push(stored.apiKey);
    [].concat(stored.fallbackKeys || [], stored.apiKeys || []).forEach((k) => candidates.push(k));
    // Solo formatos reales de key de Gemini (AQ.... nuevo, AIza... viejo). Dedup, descarta vacias.
    return [...new Set(candidates.map((k) => String(k || '').trim()).filter((k) => /^(AQ\.|AIza)/.test(k) && k.length >= 25))];
  }

  async getApiKey() {
    return (await this.getApiKeys())[0] || null;
  }

  // Seam de red (inyectable en tests): un POST a Gemini con reintentos transitorios.
  _post(url, payload, opts) {
    return postJsonRetry(url, payload, opts);
  }

  // Llama a Gemini rotando keys ante cuota agotada. Cada key reintenta transitorios (postJsonRetry);
  // si una key da 429/quota, pasa a la siguiente. Devuelve la respuesta cruda o lanza el ultimo error.
  async generateContent(payload, { timeoutMs = 30000, tries = 2, delayMs = 2500 } = {}) {
    const keys = await this.getApiKeys();
    if (!keys.length) { const e = new Error('not_configured'); e.notConfigured = true; throw e; }
    const model = (await this.readStoredConfig()).model || this.model;
    let lastErr;
    for (let i = 0; i < keys.length; i++) {
      const preview = '...' + keys[i].slice(-4);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(keys[i])}`;
      try {
        const resp = await this._post(endpoint, payload, { timeoutMs, tries, delayMs });
        this.activeKeyIndex = i; // visibilidad: que key respondio
        this._trackKey(i, preview, 'ok');
        return resp;
      } catch (err) {
        lastErr = err;
        const status = isQuotaError(err) ? 'quota' : (isKeyUnusable(err) ? 'auth' : 'other');
        this._trackKey(i, preview, status, err);
        // Rota si la key quedo inutilizable (cuota o invalida/auth) y hay otra. Transitorio ya lo
        // reintento postJsonRetry; errores no ligados a la key (request/red) no se enmascaran.
        if (isKeyUnusable(err) && i < keys.length - 1) { this._recordRotation(i, i + 1, status, err); continue; }
        throw err;
      }
    }
    throw lastErr;
  }

  // Genera JSON estructurado con reintento ante JSON MALFORMADO (Gemini a veces lo devuelve roto).
  // generateContent ya maneja errores de red/cuota (rotando keys); esto agrega el reintento de parseo.
  // Devuelve el objeto parseado o null (el caller decide el fallback). parseRetries = reintentos extra.
  async generateStructured(payload, opts = {}, parseRetries = 2) {
    for (let attempt = 0; attempt <= parseRetries; attempt++) {
      const response = await this.generateContent(payload, opts); // propaga errores de red/cuota
      const text = response.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '';
      const parsed = parseJsonLoose(text);
      if (parsed && typeof parsed === 'object') return parsed;
      // JSON malformado -> reintentar (otra pasada / otra key)
    }
    return null;
  }

  async configure({ apiKey, model }) {
    if (!apiKey || String(apiKey).trim().length < 20) {
      return { ok: false, error: 'invalid_gemini_api_key' };
    }
    if (!this.runtimeDir || !this.secretsFile) {
      return { ok: false, error: 'runtime_dir_not_configured' };
    }

    await fs.mkdir(this.runtimeDir, { recursive: true });
    const config = {
      apiKey: String(apiKey).trim(),
      model: model || this.model,
      configuredAt: new Date().toISOString(),
      storage: 'backend_runtime_file'
    };
    await fs.writeFile(this.secretsFile, JSON.stringify(config, null, 2), 'utf8');
    this.model = config.model;
    return {
      ok: true,
      provider: 'gemini',
      configured: true,
      keyPreview: maskKey(config.apiKey),
      model: config.model,
      storage: config.storage
    };
  }

  async status() {
    const stored = await this.readStoredConfig();
    const keys = await this.getApiKeys();
    const key = keys[0] || null;
    return {
      provider: 'gemini',
      configured: keys.length > 0,
      keyCount: keys.length, // cuantas keys (primaria + fallbacks) levanto: confirma rotacion en prod
      keySource: this.envApiKey ? 'env' : stored.apiKey ? 'backend_runtime_file' : null,
      keyPreview: maskKey(key),
      model: stored.model || this.model,
      mode: 'backend_only',
      role: 'adaptive_layer_subordinate_to_deterministic_core',
      canScoreFinal: false
    };
  }

  buildReviewPrompt({ subjectId, answer, deterministicResult, studyBlock }) {
    return [
      'Sos una capa de feedback educativo subordinada a un corrector determinista.',
      'No cambies la nota final. No inventes criterios. No prometas aprobacion.',
      `Materia: ${subjectId}.`,
      `Bloque de estudio: ${studyBlock?.label || 'general'}.`,
      `Score determinista: ${deterministicResult?.total ?? 'sin score'}.`,
      `Debilidades detectadas: ${JSON.stringify(deterministicResult?.weaknesses || [])}.`,
      `Respuesta del estudiante: ${String(answer || '').slice(0, 5000)}`,
      '',
      'Se breve y preciso: feedback maximo 2 oraciones; detected_misses maximo 2; study_actions maximo 1. No inventes criterios fuera del resultado determinista. No prometas aprobacion ni cambies la nota.',
      'Devolve SOLO JSON valido con esta forma:',
      '{"feedback":"texto breve","detected_misses":["..."],"study_actions":["..."],"suggested_next_mission":"...","confidence":0.0}'
    ].join('\n');
  }

  parseStructuredText(text) {
    const clean = String(text || '').trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    try {
      return JSON.parse(clean);
    } catch (_) {
      return {
        feedback: (clean || 'Gemini no devolvio contenido util.').slice(0, 300),
        detected_misses: [],
        study_actions: [],
        suggested_next_mission: null,
        confidence: 0.2
      };
    }
  }

  fallbackAdaptiveContent({ studyBlock, deterministicResult = null, reason = 'deterministic_fallback' }) {
    const weaknesses = asArray(deterministicResult?.weaknesses);
    const misses = weaknesses.flatMap((weakness) => asArray(weakness.misses));
    const commonErrors = asArray(studyBlock?.commonErrors);
    const drills = asArray(studyBlock?.drills);
    const theory = asArray(studyBlock?.coreTheory);

    return {
      ok: true,
      provider: 'deterministic_core',
      mode: 'adaptive_content_fallback',
      configured: false,
      canScoreFinal: false,
      status: reason,
      content: {
        lesson_title: `Entrenamiento adaptativo: ${studyBlock?.label || 'bloque general'}`,
        student_mode: 'Reentrenamiento guiado sin LLM',
        why_this_block: trimText(studyBlock?.whyItMatters || 'Bloque priorizado por contrato de examen.', 380),
        micro_lesson: normalizeCards(theory.map((item) => ({
          title: item.title,
          explanation: item.body,
          exam_trigger: asArray(studyBlock?.examLanguage)[0] || studyBlock?.examSkill
        })), [], 4),
        active_recall: normalizeRecall(drills, [{
          question: `Explique ${studyBlock?.label || 'el concepto'} como si fuera una pregunta de parcial.`,
          expected_answer: studyBlock?.minimumAnswer || 'Respuesta tecnica breve usando los conceptos del contrato.',
          hint: 'Use definicion, criterio tecnico y ejemplo.'
        }], 4),
        exam_drill: {
          prompt: trimText(drills[0]?.prompt || asArray(studyBlock?.examLanguage)[0] || `Desarrolle ${studyBlock?.label || 'el bloque'} con criterio de parcial.`, 420),
          expected_answer: trimText(drills[0]?.expected || studyBlock?.minimumAnswer || '', 600),
          grading_focus: normalizeList(misses, commonErrors, 4, 180)
        },
        misconceptions: normalizeList(misses, commonErrors, 5, 220),
        next_action: 'Resolver el ejercicio, comparar contra la respuesta esperada y luego volver al intento.',
        audit: {
          source: 'study_map_contract',
          llm_used: false,
          final_score_authority: 'deterministic_core'
        }
      }
    };
  }

  buildAdaptiveContentPrompt({
    subjectId,
    studyBlock,
    deterministicResult,
    studentProfile = {},
    targetMisses = [],
    mode = 'retrain',
    targetConcept = null
  }) {
    const contractSlice = {
      id: studyBlock?.id,
      code: studyBlock?.code,
      label: studyBlock?.label,
      examWeight: studyBlock?.examWeight,
      examSkill: studyBlock?.examSkill,
      whyItMatters: studyBlock?.whyItMatters,
      learningObjectives: studyBlock?.learningObjectives,
      coreTheory: studyBlock?.coreTheory,
      examLanguage: studyBlock?.examLanguage,
      commonErrors: studyBlock?.commonErrors,
      minimumAnswer: studyBlock?.minimumAnswer,
      drills: studyBlock?.drills
    };

    return [
      'Sos la capa adaptativa de NEXUS Study Cockpit.',
      'Regla central: el nucleo determinista manda. No cambies notas, no inventes temas fuera del contrato y no prometas aprobacion.',
      'Tu tarea es generar contenido de estudio personalizado para un estudiante de Contabilidad.',
      'Usa SOLO el contrato y bloque entregado. Si falta informacion, explicitalo como limite.',
      '',
      `Materia: ${subjectId}.`,
      `Modo: ${mode}.`,
      ...((mode === 'reexplain' && targetConcept) ? [
        `IMPORTANTE: el estudiante toco "NO ENTENDI" sobre el concepto "${targetConcept}". Re-explicalo de OTRA forma, mas simple: una analogia cotidiana, un mini-ejemplo concreto, y nombra el error/confusion mas comun con ese concepto. Centrate SOLO en ese concepto, no repitas la explicacion anterior. No cambies la nota ni prometas aprobacion.`
      ] : []),
      `Perfil del estudiante: ${JSON.stringify(studentProfile || {})}.`,
      `Resultado determinista: ${JSON.stringify(deterministicResult || null).slice(0, 3500)}.`,
      `Faltantes objetivo: ${JSON.stringify(targetMisses || [])}.`,
      `Bloque auditado: ${JSON.stringify(contractSlice).slice(0, 7000)}.`,
      '',
      'Genera contenido desafiante pero educativo. Debe preparar para examen escrito, calculo o definicion segun el bloque.',
      'No pidas cita textual. Evalua por criterio tecnico, aplicacion y precision.',
      'Se conciso: cada explicacion maximo 1-2 oraciones; maximo 4 conceptos y 4 preguntas; si falta informacion, omitila en vez de inventar; cada campo concreto y ligado SOLO al bloque auditado. No prometas aprobacion ni cambies la nota.',
      '',
      'Devolve SOLO JSON valido con esta forma exacta:',
      JSON.stringify({
        lesson_title: 'titulo',
        student_mode: 'como debe estudiar este bloque',
        why_this_block: 'por que aparece ahora',
        micro_lesson: [
          { title: 'concepto', explanation: 'explicacion', exam_trigger: 'como aparece en parcial' }
        ],
        active_recall: [
          { question: 'pregunta activa', expected_answer: 'respuesta esperada', hint: 'pista' }
        ],
        exam_drill: {
          prompt: 'ejercicio nuevo tipo parcial',
          expected_answer: 'respuesta esperada',
          grading_focus: ['criterio que se corrige']
        },
        misconceptions: ['error probable'],
        next_action: 'accion concreta siguiente'
      })
    ].join('\n');
  }

  normalizeAdaptiveContent(parsed, { studyBlock, deterministicResult, status }) {
    const fallback = this.fallbackAdaptiveContent({ studyBlock, deterministicResult, reason: 'normalization_fallback' }).content;
    const content = parsed && typeof parsed === 'object' ? parsed : {};

    const normalized = {
      lesson_title: trimText(content.lesson_title, 100) || fallback.lesson_title,
      student_mode: trimText(content.student_mode, 280) || fallback.student_mode,
      why_this_block: trimText(content.why_this_block, 420) || fallback.why_this_block,
      micro_lesson: normalizeCards(content.micro_lesson, fallback.micro_lesson, 4),
      active_recall: normalizeRecall(content.active_recall, fallback.active_recall, 4),
      exam_drill: {
        prompt: trimText(content.exam_drill?.prompt, 520) || fallback.exam_drill.prompt,
        expected_answer: trimText(content.exam_drill?.expected_answer, 720) || fallback.exam_drill.expected_answer,
        grading_focus: normalizeList(content.exam_drill?.grading_focus, fallback.exam_drill.grading_focus, 5, 220)
      },
      misconceptions: normalizeList(content.misconceptions, fallback.misconceptions, 5, 220),
      next_action: trimText(content.next_action, 260) || fallback.next_action,
      audit: {
        source: 'gemini_plus_study_map_contract',
        llm_used: status === 'completed',
        final_score_authority: 'deterministic_core'
      }
    };

    return normalized;
  }

  async reviewAnswer({ subjectId, answer, deterministicResult = null, studyBlock = null }) {
    const answerLength = String(answer || '').length;
    const status = await this.status();
    const base = {
      ok: true,
      provider: 'gemini',
      mode: 'backend_only',
      configured: status.configured,
      canScoreFinal: false,
      model: status.model,
      received: {
        subjectId: subjectId || null,
        answerLength,
        deterministicScore: deterministicResult?.total ?? null
      }
    };

    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return {
        ...base,
        status: 'not_configured',
        message: 'Gemini no esta configurado. Carga una API key de Google AI Studio en Configurar Gemini.',
        structuredFeedback: {
          feedback: 'Sin capa IA activa. El nucleo determinista sigue funcionando.',
          detected_misses: deterministicResult?.weaknesses || [],
          study_actions: [],
          suggested_next_mission: deterministicResult?.nextMission || null,
          confidence: 0
        }
      };
    }

    const prompt = this.buildReviewPrompt({ subjectId, answer, deterministicResult, studyBlock });
    let response;
    try {
      response = await this.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 400,
          responseMimeType: 'application/json'
        }
      }, { timeoutMs: 45000, tries: 2, delayMs: 2000 });
    } catch (err) {
      return {
        ...base,
        status: 'gemini_unavailable',
        message: 'Gemini no disponible ahora (' + (err.message || 'error') + '). El nucleo determinista sigue funcionando.',
        structuredFeedback: {
          feedback: 'Capa IA no disponible temporalmente. Tu score determinista no cambia.',
          detected_misses: deterministicResult?.weaknesses || [],
          study_actions: [],
          suggested_next_mission: deterministicResult?.nextMission || null,
          confidence: 0
        }
      };
    }
    const text = response.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
    const structuredFeedback = this.parseStructuredText(text);

    return {
      ...base,
      status: 'completed',
      message: 'Feedback Gemini generado por backend. El score final sigue siendo determinista.',
      structuredFeedback,
      usageMetadata: response.usageMetadata || null
    };
  }

  async generateAdaptiveContent({
    subjectId,
    studyBlock,
    deterministicResult = null,
    studentProfile = {},
    targetMisses = [],
    mode = 'retrain',
    targetConcept = null
  }) {
    const status = await this.status();
    const apiKey = await this.getApiKey();

    const base = {
      ok: true,
      provider: 'gemini',
      mode: 'adaptive_content_backend_only',
      configured: status.configured,
      canScoreFinal: false,
      model: status.model,
      received: {
        subjectId: subjectId || null,
        blockId: studyBlock?.id || null,
        deterministicScore: deterministicResult?.total ?? null,
        targetMisses: normalizeList(targetMisses, [], 8, 160)
      }
    };

    if (!studyBlock) {
      return {
        ...base,
        ok: false,
        status: 'study_block_required',
        message: 'No hay bloque de estudio para generar contenido adaptativo.'
      };
    }

    if (!apiKey) {
      return {
        ...this.fallbackAdaptiveContent({ studyBlock, deterministicResult, reason: 'not_configured' }),
        ...base,
        status: 'not_configured',
        message: 'Gemini no esta configurado. Se genero entrenamiento determinista desde el contrato.'
      };
    }

    const prompt = this.buildAdaptiveContentPrompt({
      subjectId,
      studyBlock,
      deterministicResult,
      studentProfile,
      targetMisses,
      mode,
      targetConcept
    });

    let response;
    try {
      response = await this.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 2200,
          responseMimeType: 'application/json'
        }
      }, { timeoutMs: 55000, tries: 2, delayMs: 2500 });
    } catch (err) {
      // Gemini caido / alta demanda / timeout -> degrada al contrato. El nucleo determinista manda.
      return {
        ...this.fallbackAdaptiveContent({ studyBlock, deterministicResult, reason: 'gemini_unavailable' }),
        ...base,
        status: 'gemini_unavailable',
        message: 'Gemini no disponible ahora (' + (err.message || 'error') + '). Se genero practica del contrato.'
      };
    }

    const text = response.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
    const parsed = this.parseStructuredText(text);

    return {
      ...base,
      status: 'completed',
      message: 'Contenido adaptativo generado por Gemini y normalizado por backend. El score sigue siendo determinista.',
      content: this.normalizeAdaptiveContent(parsed, {
        studyBlock,
        deterministicResult,
        status: 'completed'
      }),
      usageMetadata: response.usageMetadata || null
    };
  }

  // Explica UN fallo (miss) que ya marco el nucleo determinista. Gemini NO decide
  // si esta mal ni la severidad: solo da el "por que" pedagogico anclado al contrato.
  async explainFailure({ subjectId, blockId, blockLabel, missText, studyBlock = null, emphasis = null }) {
    const fallback = () => ({
      source: 'contract_fallback',
      explanation: {
        tituloFalla: trimText(missText, 90) || 'Punto a reforzar',
        textoPedagogico: trimText(studyBlock?.minimumAnswer || studyBlock?.whyItMatters || 'Repasa este punto con la teoria minima del bloque.', 260),
        respuestaModelo: trimText(studyBlock?.minimumAnswer || asArray(studyBlock?.coreTheory)[0]?.body || 'Responde con la definicion tecnica, el criterio y un ejemplo del bloque.', 280),
        proximoPaso: trimText(asArray(studyBlock?.commonErrors)[0] ? ('Evita el error: ' + asArray(studyBlock.commonErrors)[0]) : 'Volve a la teoria minima del bloque y rehace el ejercicio.', 170)
      }
    });

    const apiKey = await this.getApiKey();
    if (!apiKey) return fallback();
    const status = await this.status();

    const contractSlice = {
      coreTheory: studyBlock?.coreTheory,
      minimumAnswer: studyBlock?.minimumAnswer,
      commonErrors: studyBlock?.commonErrors,
      examLanguage: studyBlock?.examLanguage
    };
    const prompt = [
      'Sos una capa pedagogica subordinada a un corrector determinista. El motor YA detecto este fallo del alumno; vos SOLO lo explicas.',
      'No cambies la nota, no decidas severidad, no prometas aprobacion. Anclate SOLO al contrato del bloque.',
      `Materia: ${subjectId}. Bloque: ${blockLabel || blockId}.`,
      `Contrato del bloque: ${JSON.stringify(contractSlice).slice(0, 3000)}.`,
      `Fallo que marco el motor: "${String(missText || '').slice(0, 300)}".`,
      'Explica breve, concreto y util para que el alumno lo corrija. Incluye una RESPUESTA MODELO: como se responde bien ese punto (la respuesta correcta en 1-2 oraciones, con el criterio tecnico), util sobre todo si el alumno no contesto o puso "no se".',
      ...(emphasis === 'high_frequency' ? ['Este es uno de los errores MAS FRECUENTES entre los alumnos: escribi la explicacion MAS CLARA posible, con una analogia simple del dia a dia y una respuesta modelo impecable. Maxima utilidad pedagogica.'] : []),
      'Devolve SOLO JSON valido con esta forma exacta:',
      JSON.stringify({ tituloFalla: 'que se fallo (frase corta)', textoPedagogico: 'POR QUE pasa este error, 1-2 oraciones', respuestaModelo: 'COMO se responde correctamente, 1-2 oraciones con criterio tecnico', proximoPaso: '1 accion concreta para corregirlo' })
    ].join('\n');

    let parsed;
    try {
      parsed = await this.generateStructured({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 320, responseMimeType: 'application/json' }
      }, { timeoutMs: 30000, tries: 3, delayMs: 3000 }, 2);
    } catch (_) { return fallback(); }
    if (!parsed || typeof parsed !== 'object') return fallback();

    const fb = fallback().explanation;
    return {
      source: 'gemini',
      explanation: {
        tituloFalla: trimText(parsed.tituloFalla, 90) || fb.tituloFalla,
        textoPedagogico: trimText(parsed.textoPedagogico, 280) || fb.textoPedagogico,
        respuestaModelo: trimText(parsed.respuestaModelo, 300) || fb.respuestaModelo,
        proximoPaso: trimText(parsed.proximoPaso, 180) || fb.proximoPaso
      }
    };
  }

  // Genera una VARIANTE de examen nueva respetando el esquema del contrato de la materia.
  // Gemini PROPONE preguntas (y, en las de opcion, la clave correcta). El grader determinista
  // sigue puntuando; un validador server-side rechaza la variante si no cumple el esquema.
  async generateExamVariant({ subjectId, contract, conceptHint = null }) {
    const apiKey = await this.getApiKey();
    if (!apiKey) return { source: 'not_configured', variant: null };
    const status = await this.status();

    const families = asArray(contract?.conceptFamilies).map((f) => ({ id: f.id, label: f.label, concepts: asArray(f.concepts).slice(0, 8) }));
    const sample = (contract?.variants && contract.variants[0]) || null;
    // Plantilla compacta: tipos de bloque + un ejemplo de item por bloque (para que copie el formato, no el contenido).
    const template = asArray(sample?.blocks).map((b) => {
      const it = asArray(b.items)[0] || {};
      const ex = { blockId: b.blockId, prompt: trimText(it.prompt, 200) };
      if (Array.isArray(it.options)) { ex.options = it.options; ex.answer = it.answer; }
      return ex;
    });

    const prompt = [
      'Sos un generador de variantes de examen para NEXUS Study Cockpit, subordinado a un corrector determinista.',
      'Tu tarea: crear UNA variante NUEVA de examen para la materia, distinta en redaccion y casos pero que RESPETE EXACTAMENTE el esquema (mismos blockId, mismos tipos, misma cantidad de items por bloque que el ejemplo).',
      'Reglas: en los bloques de opcion (matching, true_false, case) incluye "options" (lista) y "answer" (indice entero de la opcion CORRECTA, base 0). En los de texto (short_answer, development) incluye solo "prompt". No inventes blockId nuevos. No cambies puntajes. No prometas aprobacion.',
      'IMPORTANTE para los bloques de TEXTO (short_answer, development): manten el MISMO concepto/tema del ejemplo (la respuesta esperada debe ser la misma), cambia SOLO la redaccion del enunciado. No cambies a otro concepto de la familia: la correccion usa criterios fijos por concepto.',
      'Para true_false: options debe ser ["Verdadero","Falso"] y answer 0 o 1, con un enunciado claramente verdadero o falso. Asegurate de que la "answer" sea CORRECTA segun la teoria de la materia.',
      `Materia: ${subjectId}.`,
      `Familias de conceptos de la materia: ${JSON.stringify(families).slice(0, 2000)}.`,
      conceptHint ? `Priorizá conceptos relacionados con: ${trimText(conceptHint, 160)}.` : '',
      `Esquema/ejemplo a respetar (copia la ESTRUCTURA, cambia el CONTENIDO): ${JSON.stringify(template).slice(0, 4000)}.`,
      '',
      'Devolve SOLO JSON valido con esta forma exacta:',
      JSON.stringify({ label: 'Tema generado (breve)', blocks: [{ blockId: 'matching', items: [{ prompt: 'consigna', options: ['a', 'b', 'c'], answer: 0, conceptFamily: 'id_familia' }] }] })
    ].filter(Boolean).join('\n');

    let parsed;
    try {
      parsed = await this.generateStructured({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 2400, responseMimeType: 'application/json' }
      }, { timeoutMs: 55000, tries: 2, delayMs: 2500 }, 2);
    } catch (err) {
      return { source: 'gemini_unavailable', variant: null, error: String((err && err.message) || err).slice(0, 160) };
    }
    if (!parsed || typeof parsed !== 'object') return { source: 'parse_error', variant: null };
    return { source: 'gemini', variant: parsed };
  }

  // Gemini propone SOLO el escenario de una liquidacion (sueldo bruto + %), realista. NUNCA calcula
  // la clave: los valores esperados los computa el backend deterministicamente (computePayroll).
  async generatePayrollScenario() {
    const apiKey = await this.getApiKey();
    if (!apiKey) return { source: 'not_configured', scenario: null };
    const prompt = [
      'Sos un generador de escenarios para un ejercicio de LIQUIDACION DE SUELDOS (Contabilidad).',
      'Devolve SOLO un escenario realista (numeros), NO calcules nada. El backend calcula la liquidacion.',
      'Rangos obligatorios: bruto entero entre 400000 y 700000 (multiplo de 1000); pctAportes entre 15 y 19; pctContrib entre 24 y 28.',
      'Agrega un "contexto" muy breve (una frase, ej: "Empleado de comercio, jornada completa").',
      'Devolve SOLO JSON valido con esta forma exacta:',
      JSON.stringify({ bruto: 520000, pctAportes: 17, pctContrib: 26, contexto: 'frase breve' })
    ].join('\n');
    let parsed;
    try {
      parsed = await this.generateStructured({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 200, responseMimeType: 'application/json' }
      }, { timeoutMs: 30000, tries: 2, delayMs: 2000 }, 2);
    } catch (err) {
      return { source: 'gemini_unavailable', scenario: null, error: String((err && err.message) || err).slice(0, 160) };
    }
    if (!parsed || typeof parsed !== 'object') return { source: 'parse_error', scenario: null };
    return { source: 'gemini', scenario: parsed };
  }

  // Variante COMPLETA de Contabilidad: escenario de calculo + 4 V/F nuevos + 3 enunciados de texto.
  // Gemini propone el contenido; el backend computa la clave del CALCULO (no Gemini). Los V/F llevan
  // clave propuesta por Gemini (variante de practica, flag "IA no auditada"). El texto se corrige con
  // los criterios del contrato (mismo concepto). NO calcula la liquidacion.
  async generateContabVariant() {
    const apiKey = await this.getApiKey();
    if (!apiKey) return { source: 'not_configured', data: null };
    const prompt = [
      'Sos un generador de variantes del 2do parcial de CONTABILIDAD. Devolve un examen NUEVO y distinto, del MISMO temario (devengado/percibido, remuneraciones: aportes vs contribuciones, patrimonio neto, auditoria/control interno). NO calcules la liquidacion: eso lo hace el backend.',
      'Devolve 3 cosas en JSON:',
      '1) "scenario": liquidacion realista -> bruto entero 400000-700000 (multiplo de 1000), pctAportes 15-19, pctContrib 24-28, contexto (frase breve).',
      '2) "vf": EXACTAMENTE 4 enunciados Verdadero/Falso (uno por tema: devengado, remuneraciones, patrimonio neto, auditoria). Cada uno: { text, expected ("V" o "F"), terms (3-6 palabras clave de una buena justificacion) }. La "expected" tiene que ser CORRECTA segun la teoria.',
      '3) "text": enunciados nuevos para 3 desarrollos, MISMO concepto que el parcial: a_def (definir devengado y diferenciarlo de percibido), a_dev (auditoria, independencia y control interno), a_case (caso integrador: devengado + aportes/contribuciones + riesgo de control + controles). Solo el enunciado (string), sin regalar la respuesta.',
      'Devolve SOLO JSON valido con esta forma exacta:',
      JSON.stringify({ scenario: { bruto: 520000, pctAportes: 17, pctContrib: 26, contexto: 'frase' }, vf: [{ text: 'enunciado', expected: 'F', terms: ['palabra', 'clave'] }], text: { a_def: 'enunciado', a_dev: 'enunciado', a_case: 'enunciado' } })
    ].join('\n');
    let parsed;
    try {
      parsed = await this.generateStructured({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500, responseMimeType: 'application/json' }
      }, { timeoutMs: 50000, tries: 2, delayMs: 2500 }, 2);
    } catch (err) {
      return { source: 'gemini_unavailable', data: null, error: String((err && err.message) || err).slice(0, 160) };
    }
    if (!parsed || typeof parsed !== 'object') return { source: 'parse_error', data: null };
    return { source: 'gemini', data: parsed };
  }

  // Tono dinamico (#7): segun como viene el alumno, el tutor cambia de registro. NO cambia la nota
  // ni el contenido tecnico; solo COMO lo dice (empatico vs entrenador exigente).
  _toneLine(userState) {
    const s = userState && userState.level;
    if (s === 'struggling') return 'TONO: empatico, paciente y muy paso a paso; reforza lo que ya hizo bien antes de corregir; frases cortas y alentadoras.';
    if (s === 'confident') return 'TONO: de entrenador exigente; felicita corto y desafialo a no cometer errores finos; subi un poco la vara.';
    if (s === 'improving') return 'TONO: motivador; reconoce el progreso y empujalo al proximo nivel.';
    return 'TONO: claro y cercano, como un companero que estudia al lado tuyo.';
  }

  // Responde una pregunta LIBRE del alumno usando el bloque actual + el resumen de la MATERIA
  // (asi un concepto que se ve en otro bloque igual se responde, indicando donde). No puntua.
  // scenarioContext (#9): los numeros que genero el motor en ESE intento, para responder la microduda
  // exacta sin mandar a la teoria general. userState (#7): ajusta el tono.
  async answerQuestion({ subjectId, blockId, blockLabel, question, studyBlock = null, subjectOverview = null, scenarioContext = null, userState = null }) {
    const fallback = () => ({
      source: 'contract_fallback',
      answer: {
        respuesta: trimText('No pude generar una respuesta puntual a tu pregunta ahora mismo (alta demanda de la IA). Volve a intentar en unos segundos. Mientras tanto, lo central del bloque: ' + (studyBlock?.minimumAnswer || asArray(studyBlock?.coreTheory)[0]?.body || 'revisa la teoria minima del bloque.'), 420),
        dondeRepasar: trimText('Teoria minima defendible del bloque ' + (blockLabel || blockId), 140)
      }
    });

    const q = String(question || '').trim();
    if (!q) return fallback();
    const apiKey = await this.getApiKey();
    if (!apiKey) return fallback();
    const status = await this.status();

    const contractSlice = {
      coreTheory: studyBlock?.coreTheory,
      minimumAnswer: studyBlock?.minimumAnswer,
      learningObjectives: studyBlock?.learningObjectives,
      examLanguage: studyBlock?.examLanguage,
      commonErrors: studyBlock?.commonErrors
    };
    const prompt = [
      'Sos un tutor pedagogico de una materia. Responde la pregunta del alumno usando el contenido del BLOQUE actual y, si el concepto pertenece a OTRO bloque de la misma materia, RESPONDELO igual con el resumen de la materia e indica en que bloque se ve (no digas "el bloque no lo define"). Solo deci que esta fuera si el tema NO pertenece a la materia. No inventes fuera de la materia. No prometas aprobacion ni cambies notas.',
      `Materia: ${subjectId}. Bloque actual: ${blockLabel || blockId}.`,
      `Contenido del bloque actual: ${JSON.stringify(contractSlice).slice(0, 3000)}.`,
      subjectOverview ? `Resumen de los demas bloques de la materia (para conceptos que se ven en otro lado): ${JSON.stringify(subjectOverview).slice(0, 2800)}.` : '',
      scenarioContext ? `Datos EXACTOS del ejercicio que esta resolviendo ahora (responde la duda con ESTOS numeros, no con un ejemplo generico): ${JSON.stringify(scenarioContext).slice(0, 600)}.` : '',
      this._toneLine(userState),
      `Pregunta del alumno: "${q.slice(0, 400)}".`,
      'Se claro y breve (2-3 oraciones). Devolve SOLO JSON valido con esta forma exacta:',
      JSON.stringify({ respuesta: '2-3 oraciones claras y concretas', dondeRepasar: 'que parte del bloque conviene mirar' })
    ].join('\n');

    let parsed;
    try {
      parsed = await this.generateStructured({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 380, responseMimeType: 'application/json' }
      }, { timeoutMs: 35000, tries: 2, delayMs: 2500 }, 2);
    } catch (_) { return fallback(); }
    if (!parsed || typeof parsed !== 'object') return fallback();

    const fb = fallback().answer;
    return {
      source: 'gemini',
      answer: {
        respuesta: trimText(parsed.respuesta, 480) || fb.respuesta,
        dondeRepasar: trimText(parsed.dondeRepasar, 160) || fb.dondeRepasar
      }
    };
  }

  // #1 Desatasco Socratico: mini-chat ENJAULADO. Recibe el contexto (error/concepto + teoria de
  // referencia) y la conversacion; tiene PROHIBIDO dar la respuesta: solo hace UNA pregunta guia por
  // turno hasta que el alumno hace el clic. No cambia la nota.
  async socraticTurn({ subjectId, blockId, blockLabel, studyBlock = null, context = null, history = [], studentMessage = '', userState = null }) {
    const fallback = () => ({ source: 'contract_fallback', turn: { message: 'Pensemoslo juntos: ¿que hecho dice el enunciado que hay que reconocer, y en que periodo cae? Empecemos por ahi.', solved: false } });
    const apiKey = await this.getApiKey();
    if (!apiKey) return fallback();
    await this.status();
    const slice = { coreTheory: studyBlock?.coreTheory, minimumAnswer: studyBlock?.minimumAnswer, commonErrors: studyBlock?.commonErrors };
    const transcript = (Array.isArray(history) ? history : []).slice(-8).map((m) => `${m.role === 'tutor' ? 'TUTOR' : 'ALUMNO'}: ${String(m.text || '').slice(0, 300)}`).join('\n');
    const prompt = [
      'Sos un tutor SOCRATICO. El motor determinista ya corrigio; vos NO cambias la nota.',
      'REGLA ABSOLUTA: tenes PROHIBIDO dar la respuesta, el resultado, el numero final o la solucion. Si el alumno te la pide, NO se la des: devolvele otra pregunta guia.',
      'Tu UNICA funcion: hacer UNA sola pregunta guia, corta y concreta, que lleve al alumno a darse cuenta SOLO del proximo paso. Una pregunta por turno.',
      `Materia: ${subjectId}. Bloque: ${blockLabel || blockId}.`,
      `Concepto/error en el que esta atascado: ${JSON.stringify(context || {}).slice(0, 500)}.`,
      `Teoria y respuesta de REFERENCIA (solo para vos, NO la reveles): ${JSON.stringify(slice).slice(0, 1500)}.`,
      this._toneLine(userState),
      transcript ? `Conversacion hasta ahora:\n${transcript}` : '',
      `Ultimo mensaje del alumno: "${String(studentMessage || '').slice(0, 400)}".`,
      'Si por sus respuestas YA entendio (llego solo a la idea), poné solved=true y un cierre MUY breve felicitandolo, sin dar vos la respuesta. Si no, solved=false y la proxima pregunta guia.',
      'Devolve SOLO JSON valido: ' + JSON.stringify({ message: 'una sola pregunta guia (o cierre breve)', solved: false })
    ].join('\n');
    let parsed;
    try {
      parsed = await this.generateStructured({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5, maxOutputTokens: 220, responseMimeType: 'application/json' } }, { timeoutMs: 30000, tries: 2, delayMs: 2500 }, 2);
    } catch (_) { return fallback(); }
    if (!parsed || typeof parsed !== 'object' || !parsed.message) return fallback();
    return { source: 'gemini', turn: { message: trimText(parsed.message, 300), solved: !!parsed.solved } };
  }

  // #2 Analogia ("peras y manzanas"): one-shot. Baja la carga cognitiva con una analogia cotidiana.
  async analogy({ subjectId, blockLabel, studyBlock = null, concept = '', userState = null }) {
    const fallback = () => ({ source: 'contract_fallback', analogia: trimText('Pensalo como la plata de un kiosco: lo que ENTRA y SALE en el dia no es lo mismo que la GANANCIA del mes. ' + (studyBlock?.minimumAnswer || ''), 300) });
    const apiKey = await this.getApiKey();
    if (!apiKey) return fallback();
    await this.status();
    const prompt = [
      'Sos un tutor que baja la carga cognitiva con ANALOGIAS cotidianas (un kiosco, un club, la cuota de la luz). No cambias la nota.',
      `Materia: ${subjectId}. Explica con peras y manzanas: "${String(concept || blockLabel || '').slice(0, 200)}".`,
      `Apoyo del contrato (no te salgas del tema): ${JSON.stringify({ coreTheory: studyBlock?.coreTheory, minimumAnswer: studyBlock?.minimumAnswer }).slice(0, 1500)}.`,
      this._toneLine(userState),
      'Escribi UNA analogia simple y concreta (2-4 oraciones), sin jerga, y cerra conectando la analogia con el concepto tecnico correcto. Devolve SOLO JSON valido: ' + JSON.stringify({ analogia: 'la analogia + el cierre tecnico' })
    ].join('\n');
    let parsed;
    try { parsed = await this.generateStructured({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 260, responseMimeType: 'application/json' } }, { timeoutMs: 30000, tries: 2, delayMs: 2500 }, 2); }
    catch (_) { return fallback(); }
    if (!parsed || !parsed.analogia) return fallback();
    return { source: 'gemini', analogia: trimText(parsed.analogia, 380) };
  }

  // #3 Pistas en cascada: 3 hints de menor a mayor ayuda; la 3ra es resolucion PARCIAL, nunca la final.
  async progressiveHints({ subjectId, blockId, blockLabel, studyBlock = null, missText = '', userState = null }) {
    const fallback = () => ({ source: 'contract_fallback', hints: [
      'Pista 1: volve a la regla del bloque (' + (blockLabel || blockId) + ') e identifica que concepto pide este punto.',
      'Pista 2: mira los datos del enunciado y pensa que operacion los relaciona.',
      'Pista 3: escribi el primer paso de la resolucion; el resto sale de ahi.'
    ] });
    const apiKey = await this.getApiKey();
    if (!apiKey) return fallback();
    await this.status();
    const prompt = [
      'Sos un tutor que da PISTAS EN CASCADA (no la respuesta). El motor ya corrigio; no cambias la nota.',
      `Materia: ${subjectId}. Bloque: ${blockLabel || blockId}. Error del alumno: "${String(missText || '').slice(0, 300)}".`,
      `Apoyo del contrato: ${JSON.stringify({ coreTheory: studyBlock?.coreTheory, minimumAnswer: studyBlock?.minimumAnswer, commonErrors: studyBlock?.commonErrors }).slice(0, 1800)}.`,
      this._toneLine(userState),
      'Genera EXACTAMENTE 3 pistas, de menor a mayor ayuda: pista 1 = recordatorio CONCEPTUAL (sin numeros); pista 2 = que mirar / que operacion aproximar; pista 3 = resolucion PARCIAL (el primer paso), NUNCA la respuesta final completa.',
      'Devolve SOLO JSON valido: ' + JSON.stringify({ hints: ['pista 1', 'pista 2', 'pista 3'] })
    ].join('\n');
    let parsed;
    try { parsed = await this.generateStructured({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 340, responseMimeType: 'application/json' } }, { timeoutMs: 30000, tries: 2, delayMs: 2500 }, 2); }
    catch (_) { return fallback(); }
    const hints = Array.isArray(parsed && parsed.hints) ? parsed.hints.map((h) => trimText(h, 220)).filter(Boolean).slice(0, 3) : [];
    if (!hints.length) return fallback();
    return { source: 'gemini', hints };
  }

  // #5 Abogado del diablo: ancla el conocimiento mostrando la CONSECUENCIA PRACTICA del error en el
  // mundo real (no en la nota). El motor ya corrigio; no cambia la nota.
  async devilsAdvocate({ subjectId, blockId, blockLabel, studyBlock = null, missText = '', userState = null }) {
    const fallback = () => ({ source: 'contract_fallback', consecuencia: trimText('Si lo dejas asi, el resultado del periodo y el balance quedan mal armados y arrastran el error a las decisiones que se toman con esa informacion. Correccion: ' + (studyBlock?.minimumAnswer || 'revisa la regla del bloque y rehace el paso.'), 300) });
    const apiKey = await this.getApiKey();
    if (!apiKey) return fallback();
    await this.status();
    const prompt = [
      'Sos un tutor que ancla el conocimiento mostrando la CONSECUENCIA PRACTICA del error en el mundo real. El motor ya corrigio; vos NO cambias la nota.',
      `Materia: ${subjectId}. Bloque: ${blockLabel || blockId}. Error del alumno: "${String(missText || '').slice(0, 300)}".`,
      `Apoyo del contrato: ${JSON.stringify({ coreTheory: studyBlock?.coreTheory, minimumAnswer: studyBlock?.minimumAnswer, commonErrors: studyBlock?.commonErrors }).slice(0, 1500)}.`,
      this._toneLine(userState),
      'Explica en 2-3 oraciones CONCRETAS que pasaria en la REALIDAD si lo dejara asi (ej: "si debitas esta cuenta como hiciste, el balance de fin de año muestra una ganancia inflada y pagas mas impuestos"). Pragmatico, util para que el error duela y se fije. Cerra con la correccion en UNA frase.',
      'Devolve SOLO JSON valido: ' + JSON.stringify({ consecuencia: 'la consecuencia real (2-3 oraciones) + la correccion en 1 frase' })
    ].join('\n');
    let parsed;
    try { parsed = await this.generateStructured({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.6, maxOutputTokens: 260, responseMimeType: 'application/json' } }, { timeoutMs: 30000, tries: 2, delayMs: 2500 }, 2); }
    catch (_) { return fallback(); }
    if (!parsed || !parsed.consecuencia) return fallback();
    return { source: 'gemini', consecuencia: trimText(parsed.consecuencia, 380) };
  }

  // #6 Revision semantica ADVISORY: lee la respuesta REAL del alumno y le dice si su razonamiento va
  // bien aunque use lenguaje coloquial, y que termino tecnico le falto para que el motor se lo tome.
  // El motor determinista YA puso la nota; esto NO la cambia (es feedback, no correccion).
  async semanticFeedback({ subjectId, blockId, blockLabel, studyBlock = null, studentAnswer = '', criteria = null, userState = null }) {
    const fallback = () => ({ source: 'contract_fallback', feedback: trimText('El motor corrige por la presencia de los terminos tecnicos. Si tu idea esta bien encaminada pero falto la terminologia exacta, revisa la respuesta minima del bloque y usa esos terminos en el examen.', 260) });
    const apiKey = await this.getApiKey();
    if (!apiKey || !String(studentAnswer).trim()) return fallback();
    await this.status();
    const prompt = [
      'Sos un tutor que da feedback SEMANTICO ADVISORY. El motor determinista YA puso la nota por cobertura de terminos tecnicos; vos NO la cambias y NO prometes recalculo.',
      'Lee la respuesta REAL del alumno y deci, en 2-3 oraciones: (1) si su razonamiento/logica va por buen camino aunque use lenguaje coloquial, reconocelo explicitamente; (2) que termino tecnico o concepto exacto le falto para que el motor se lo tome (ej: "tu logica es correcta, pero en el examen tenes que usar la cuenta Sueldos y Jornales"). Orientalo, no le des la respuesta entera.',
      `Materia: ${subjectId}. Bloque: ${blockLabel || blockId}.`,
      criteria ? `Terminos/criterios que evalua el motor: ${JSON.stringify(criteria).slice(0, 1000)}.` : '',
      `Apoyo del contrato: ${JSON.stringify({ minimumAnswer: studyBlock?.minimumAnswer, coreTheory: studyBlock?.coreTheory }).slice(0, 1200)}.`,
      `Respuesta del alumno: "${String(studentAnswer).slice(0, 700)}".`,
      this._toneLine(userState),
      'Devolve SOLO JSON valido: ' + JSON.stringify({ feedback: 'feedback advisory 2-3 oraciones; NO cambia la nota' })
    ].join('\n');
    let parsed;
    try { parsed = await this.generateStructured({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 280, responseMimeType: 'application/json' } }, { timeoutMs: 30000, tries: 2, delayMs: 2500 }, 2); }
    catch (_) { return fallback(); }
    if (!parsed || !parsed.feedback) return fallback();
    return { source: 'gemini', feedback: trimText(parsed.feedback, 360) };
  }
}

module.exports = {
  GeminiAdaptiveLayer
};
