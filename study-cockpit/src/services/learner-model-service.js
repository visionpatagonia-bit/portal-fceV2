'use strict';
/*
 * learner-model-service · Cog #3 — Bayesian Knowledge Tracing (Corbett & Anderson 1995).
 *
 * Mantiene P(L) = probabilidad de DOMINIO por (sessionId, subjectId, knowledge-component).
 * El KC es el BLOQUE (cada bloque del contrato = una habilidad). Cada `itemResult` que emite el
 * motor (#1) es una OBSERVACION binaria (correcto/incorrecto) que actualiza P(L) con BKT estandar.
 *
 * REGLA DE ORO: esto NO pone ni cambia la nota (el motor determinista es el unico juez). P(L) solo
 * estima dominio para guiar QUE repasar / el ruteo. Persiste anonimo, sin respuestas del alumno.
 */
const fs = require('fs');
const path = require('path');

// Parametros BKT por defecto (overridables por materia si hiciera falta).
const BKT = { pInit: 0.25, pTransit: 0.15, pSlip: 0.10, pGuess: 0.20 };
const CORRECT_THRESHOLD = 0.6; // un itemResult con score01 >= 0.6 cuenta como "correcto"

// Una observacion BKT: actualiza P(L) dado correcto/incorrecto, luego aplica la transicion de aprendizaje.
function bktUpdate(pL, correct, p = BKT) {
  const prior = Math.max(0, Math.min(1, pL));
  let posterior;
  if (correct) {
    const num = prior * (1 - p.pSlip);
    posterior = num / (num + (1 - prior) * p.pGuess || 1e-9);
  } else {
    const num = prior * p.pSlip;
    posterior = num / (num + (1 - prior) * (1 - p.pGuess) || 1e-9);
  }
  // P(L_{t+1}) = P(L|obs) + (1 - P(L|obs)) * P(T)
  return posterior + (1 - posterior) * p.pTransit;
}

class LearnerModelService {
  constructor(root) {
    this.dir = root ? path.join(root, 'data', 'runtime', 'learner-model') : null;
    this.cache = new Map(); // sessionId -> { subjectId -> { kc -> {pL, reps, lastAt} } }
  }

  _file(sessionId) { return this.dir ? path.join(this.dir, String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '_') + '.json') : null; }

  _load(sessionId) {
    if (this.cache.has(sessionId)) return this.cache.get(sessionId);
    let data = {};
    const f = this._file(sessionId);
    if (f) { try { data = JSON.parse(fs.readFileSync(f, 'utf8')) || {}; } catch (_) { data = {}; } }
    this.cache.set(sessionId, data);
    return data;
  }

  _save(sessionId, data) {
    this.cache.set(sessionId, data);
    const f = this._file(sessionId);
    if (!f) return;
    try { fs.mkdirSync(this.dir, { recursive: true }); fs.writeFileSync(f, JSON.stringify(data), 'utf8'); } catch (_) { /* FS efimero/no disponible: queda en cache */ }
  }

  // Actualiza el modelo con un resultado del motor. KC = blockId; cada itemResult es una observacion.
  update({ sessionId = 'anon', subjectId, result }) {
    if (!subjectId || !result || !result.blocks) return null;
    const data = this._load(sessionId);
    const subj = data[subjectId] || (data[subjectId] = {});
    const now = Date.now();
    for (const [blockId, b] of Object.entries(result.blocks)) {
      const kc = subj[blockId] || (subj[blockId] = { pL: BKT.pInit, reps: 0, lastAt: null, label: b.label });
      const obs = Array.isArray(b.itemResults) && b.itemResults.length
        ? b.itemResults.map((it) => (it.score01 != null ? it.score01 : 0) >= CORRECT_THRESHOLD)
        : [((b.points || 0) / (b.maxPoints || 2)) >= CORRECT_THRESHOLD];
      for (const correct of obs) { kc.pL = bktUpdate(kc.pL, correct); kc.reps++; }
      kc.lastAt = now; kc.label = b.label || kc.label;
    }
    this._save(sessionId, data);
    return subj;
  }

  // Mapa de dominio { blockId: {pL, reps, label} } para una materia.
  mastery({ sessionId = 'anon', subjectId }) {
    const subj = (this._load(sessionId) || {})[subjectId] || {};
    const out = {};
    for (const [kc, v] of Object.entries(subj)) out[kc] = { pL: Math.round(v.pL * 1000) / 1000, reps: v.reps, label: v.label };
    return out;
  }

  // KCs ordenados por DEFICIT DE DOMINIO ponderado por peso de examen: (1 - P(L)) * examWeight.
  // examWeights: { blockId: peso }. Si falta, peso 1. Devuelve [{blockId, pL, deficit, label}] (peor primero).
  weakest({ sessionId = 'anon', subjectId, examWeights = {} }) {
    const subj = (this._load(sessionId) || {})[subjectId] || {};
    return Object.entries(subj).map(([blockId, v]) => ({
      blockId, pL: Math.round(v.pL * 1000) / 1000, label: v.label,
      deficit: Math.round((1 - v.pL) * (examWeights[blockId] || 1) * 1000) / 1000
    })).sort((a, b) => b.deficit - a.deficit);
  }
}

module.exports = { LearnerModelService, bktUpdate, BKT };
