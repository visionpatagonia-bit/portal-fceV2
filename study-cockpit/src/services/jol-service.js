'use strict';
/*
 * jol-service · Feature C (Coach de calibracion) — historial de JOL (judgment of learning) por familia.
 *
 * Acumula, por (sessionId, subjectId, familia=blockId), pares (confianza declarada ANTES de corregir,
 * resultado real del bloque). Con >=N pares el coach devuelve el PATRON (no el evento): "te subestimaste
 * 5/7 en cortas; tu 'inseguro' rinde 1.65/2 en promedio -> cuando dudes, escribi todo igual".
 *
 * El JOL lo captura el frontend (botones por bloque) y ahora el scoreAttempt lo MANDA al server, que lo
 * empareja con el resultado determinista y lo registra. Determinista, CERO IA, NO toca la nota (senal+accion).
 * PERSISTENCIA: Firestore (Admin SDK via FIREBASE_SERVICE_ACCOUNT) o archivos locales; cache en memoria.
 * IDENTIDAD: el coach agrega sobre las sesiones vinculadas (identity-merge), como lexicon/learner-model.
 *
 * Esquema del doc (por sessionId): { [subjectId]: { [family]: { label, pairs: [{c,r,at}] } }, _sessionId, _subjects }
 *   c = confianza ('flojo'|'medio'|'seguro')   r = ratio puntos/maxPuntos (0..1)   at = timestamp
 */
const fs = require('fs');
const path = require('path');

const MAX_PAIRS = 60; // cap por familia (evita crecimiento sin limite; el patron usa los mas recientes)

function lazyFirestore() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    return admin.firestore();
  } catch (_) { return null; }
}

class JolService {
  constructor(root) {
    this.dir = root ? path.join(root, 'data', 'runtime', 'jol') : null;
    this.db = lazyFirestore();
    this.mode = this.db ? 'firestore' : 'local';
    this.col = 'cockpit_jol';
    this.cache = new Map();
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
    data._sessionId = String(sessionId);
    data._subjects = Object.keys(data).filter((k) => k !== '_sessionId' && k !== '_subjects');
    this.cache.set(sessionId, data);
    if (this.mode === 'firestore') {
      try { await this.db.collection(this.col).doc(String(sessionId)).set(data, { merge: true }); } catch (_) {}
    } else {
      const f = this._file(sessionId);
      if (f) { try { fs.mkdirSync(this.dir, { recursive: true }); fs.writeFileSync(f, JSON.stringify(data), 'utf8'); } catch (_) {} }
    }
  }

  // Registra pares (confianza, resultado) de este intento. entries: [{family,label,confidence,ratio}].
  async record({ sessionId = 'anon', subjectId, entries = [], at = 0 }) {
    if (!subjectId || !entries.length) return null;
    const data = await this._load(sessionId);
    const subj = data[subjectId] || (data[subjectId] = {});
    for (const e of entries) {
      if (!e || !e.family || !e.confidence) continue;
      const fam = subj[e.family] || (subj[e.family] = { label: e.label || e.family, pairs: [] });
      fam.label = e.label || fam.label;
      fam.pairs.push({ c: e.confidence, r: Math.max(0, Math.min(1, e.ratio || 0)), at });
      if (fam.pairs.length > MAX_PAIRS) fam.pairs = fam.pairs.slice(-MAX_PAIRS);
    }
    await this._save(sessionId, data);
    return subj;
  }

  // Historial por familia AGREGADO sobre las sesiones vinculadas. {family:{label,pairs:[{c,r,at}]}}
  async history({ sessionIds = [], subjectId }) {
    const out = {};
    for (const sid of sessionIds) {
      const subj = (await this._load(sid))[subjectId] || {};
      for (const [fam, v] of Object.entries(subj)) {
        const cur = out[fam] || (out[fam] = { label: v.label, pairs: [] });
        cur.label = cur.label || v.label;
        cur.pairs.push(...(v.pairs || []));
      }
    }
    return out;
  }
}

module.exports = { JolService };
