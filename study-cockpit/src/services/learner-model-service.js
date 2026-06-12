'use strict';
/*
 * learner-model-service · Cog #3 — Bayesian Knowledge Tracing (Corbett & Anderson 1995).
 *
 * Mantiene P(L) = probabilidad de DOMINIO por (sessionId, subjectId, knowledge-component=bloque).
 * Cada `itemResult` del motor (#1) es una OBSERVACION binaria que actualiza P(L) con BKT estandar.
 *
 * PERSISTENCIA (F1, fix de amnesia): Firestore (Admin SDK) si hay FIREBASE_SERVICE_ACCOUNT; si no,
 * archivos locales; en ambos casos cache en memoria. En Render free el FS es efimero -> sin Firestore
 * el modelo se resetea en cada sleep (degrada limpio, pero NO acumula). update() CARGA el estado previo
 * antes de actualizar, asi tras un restart sigue acumulando en vez de volver a cold-start.
 *
 * F4: P(L) se reporta tambien como BANDA cualitativa ('dominado'/'en progreso'/'flojo'); el numero
 * crudo es ORDINAL (sirve para rankear que repasar), NO una promesa de dominio hasta calibrar params.
 *
 * REGLA DE ORO: esto NO pone ni cambia la nota (el motor es el unico juez). Persiste anonimo.
 */
const fs = require('fs');
const path = require('path');

const BKT = { pInit: 0.25, pTransit: 0.15, pSlip: 0.10, pGuess: 0.20 };
const CORRECT_THRESHOLD = 0.6;

function bktUpdate(pL, correct, p = BKT) {
  const prior = Math.max(0, Math.min(1, pL));
  let posterior;
  if (correct) { const num = prior * (1 - p.pSlip); posterior = num / ((num + (1 - prior) * p.pGuess) || 1e-9); }
  else { const num = prior * p.pSlip; posterior = num / ((num + (1 - prior) * (1 - p.pGuess)) || 1e-9); }
  return posterior + (1 - posterior) * p.pTransit;
}

// F4: banda cualitativa (lo que la UI debe mostrar, NO el %).
function band(pL) { return pL >= 0.85 ? 'dominado' : (pL >= 0.5 ? 'en progreso' : 'flojo'); }

function lazyFirestore() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    return admin.firestore();
  } catch (_) { return null; }
}

class LearnerModelService {
  constructor(root) {
    this.dir = root ? path.join(root, 'data', 'runtime', 'learner-model') : null;
    this.db = lazyFirestore();
    this.mode = this.db ? 'firestore' : 'local';
    this.col = 'cockpit_learner_model';
    this.cache = new Map(); // sessionId -> { subjectId -> { kc -> {pL,reps,lastAt,label} } }
  }

  _file(sessionId) { return this.dir ? path.join(this.dir, String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '_') + '.json') : null; }

  async _load(sessionId) {
    if (this.cache.has(sessionId)) return this.cache.get(sessionId);
    let data = {};
    if (this.mode === 'firestore') {
      try { const snap = await this.db.collection(this.col).doc(String(sessionId)).get(); if (snap.exists) data = snap.data() || {}; } catch (_) { data = {}; }
    } else {
      const f = this._file(sessionId);
      if (f) { try { data = JSON.parse(fs.readFileSync(f, 'utf8')) || {}; } catch (_) { data = {}; } }
    }
    this.cache.set(sessionId, data);
    return data;
  }

  async _save(sessionId, data) {
    this.cache.set(sessionId, data);
    if (this.mode === 'firestore') {
      try { await this.db.collection(this.col).doc(String(sessionId)).set(data, { merge: true }); } catch (_) {}
    } else {
      const f = this._file(sessionId);
      if (f) { try { fs.mkdirSync(this.dir, { recursive: true }); fs.writeFileSync(f, JSON.stringify(data), 'utf8'); } catch (_) {} }
    }
  }

  // Carga el estado previo, aplica BKT con las observaciones del intento, persiste. KC = blockId.
  async update({ sessionId = 'anon', subjectId, result }) {
    if (!subjectId || !result || !result.blocks) return null;
    const data = await this._load(sessionId);
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
    await this._save(sessionId, data);
    return subj;
  }

  async mastery({ sessionId = 'anon', subjectId }) {
    const subj = (await this._load(sessionId))[subjectId] || {};
    const out = {};
    for (const [kc, v] of Object.entries(subj)) out[kc] = { pL: Math.round(v.pL * 1000) / 1000, band: band(v.pL), reps: v.reps, label: v.label };
    return out;
  }

  // KCs por DEFICIT ponderado: (1 - P(L)) * examWeight. Ordinal: el ORDEN es la senal, no el numero.
  async weakest({ sessionId = 'anon', subjectId, examWeights = {} }) {
    const subj = (await this._load(sessionId))[subjectId] || {};
    return Object.entries(subj).map(([blockId, v]) => ({
      blockId, label: v.label, band: band(v.pL), pL: Math.round(v.pL * 1000) / 1000,
      deficit: Math.round((1 - v.pL) * (examWeights[blockId] || 1) * 1000) / 1000
    })).sort((a, b) => b.deficit - a.deficit);
  }
}

module.exports = { LearnerModelService, bktUpdate, band, BKT };
