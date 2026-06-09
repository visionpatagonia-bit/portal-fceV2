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
  constructor({ root, apiKey = process.env.GEMINI_API_KEY } = {}) {
    this.root = root;
    this.envApiKey = apiKey || null;
    this.runtimeDir = root ? path.join(root, 'data', 'runtime') : null;
    this.secretsFile = this.runtimeDir ? path.join(this.runtimeDir, 'gemini.secrets.json') : null;
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  }

  async readStoredConfig() {
    if (!this.secretsFile || !fsSync.existsSync(this.secretsFile)) return {};
    return JSON.parse(await fs.readFile(this.secretsFile, 'utf8'));
  }

  async getApiKey() {
    if (this.envApiKey) return this.envApiKey;
    const stored = await this.readStoredConfig();
    return stored.apiKey || null;
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
    const key = this.envApiKey || stored.apiKey || null;
    return {
      provider: 'gemini',
      configured: Boolean(key),
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
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(status.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    let response;
    try {
      response = await postJsonRetry(endpoint, {
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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(status.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    let response;
    try {
      response = await postJsonRetry(endpoint, {
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
  async explainFailure({ subjectId, blockId, blockLabel, missText, studyBlock = null }) {
    const fallback = () => ({
      source: 'contract_fallback',
      explanation: {
        tituloFalla: trimText(missText, 90) || 'Punto a reforzar',
        textoPedagogico: trimText(studyBlock?.minimumAnswer || studyBlock?.whyItMatters || 'Repasa este punto con la teoria minima del bloque.', 260),
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
      'Explica breve, concreto y util para que el alumno lo corrija.',
      'Devolve SOLO JSON valido con esta forma exacta:',
      JSON.stringify({ tituloFalla: 'que se fallo (frase corta)', textoPedagogico: 'POR QUE pasa este error, 1-2 oraciones', proximoPaso: '1 accion concreta para corregirlo' })
    ].join('\n');

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(status.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    let response;
    try {
      response = await postJsonRetry(endpoint, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 320, responseMimeType: 'application/json' }
      }, { timeoutMs: 30000, tries: 3, delayMs: 3000 });
    } catch (_) { return fallback(); }

    const text = response.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '';
    let parsed;
    try { parsed = JSON.parse(String(text).replace(/^```json\s*/i, '').replace(/```$/i, '').trim()); } catch (_) { return fallback(); }
    if (!parsed || typeof parsed !== 'object') return fallback();

    const fb = fallback().explanation;
    return {
      source: 'gemini',
      explanation: {
        tituloFalla: trimText(parsed.tituloFalla, 90) || fb.tituloFalla,
        textoPedagogico: trimText(parsed.textoPedagogico, 280) || fb.textoPedagogico,
        proximoPaso: trimText(parsed.proximoPaso, 180) || fb.proximoPaso
      }
    };
  }

  // Responde una pregunta LIBRE del alumno, anclada SOLO al contrato del bloque. No puntua.
  async answerQuestion({ subjectId, blockId, blockLabel, question, studyBlock = null }) {
    const fallback = () => ({
      source: 'contract_fallback',
      answer: {
        respuesta: trimText(studyBlock?.minimumAnswer || asArray(studyBlock?.coreTheory)[0]?.body || 'Revisa la teoria minima de este bloque para resolver tu duda.', 360),
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
      'Sos un tutor pedagogico anclado al CONTRATO de un bloque de estudio. Responde la pregunta del alumno usando SOLO el contenido del bloque entregado.',
      'Si la pregunta esta fuera de este bloque, decilo claramente y sugeri donde corresponde. No inventes fuera del contrato. No prometas aprobacion ni cambies notas.',
      `Materia: ${subjectId}. Bloque: ${blockLabel || blockId}.`,
      `Contenido del bloque: ${JSON.stringify(contractSlice).slice(0, 3500)}.`,
      `Pregunta del alumno: "${q.slice(0, 400)}".`,
      'Se claro y breve (2-3 oraciones). Devolve SOLO JSON valido con esta forma exacta:',
      JSON.stringify({ respuesta: '2-3 oraciones claras y concretas', dondeRepasar: 'que parte del bloque conviene mirar' })
    ].join('\n');

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(status.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    let response;
    try {
      response = await postJsonRetry(endpoint, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 380, responseMimeType: 'application/json' }
      }, { timeoutMs: 35000, tries: 2, delayMs: 2500 });
    } catch (_) { return fallback(); }

    const text = response.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '';
    let parsed;
    try { parsed = JSON.parse(String(text).replace(/^```json\s*/i, '').replace(/```$/i, '').trim()); } catch (_) { return fallback(); }
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
}

module.exports = {
  GeminiAdaptiveLayer
};
