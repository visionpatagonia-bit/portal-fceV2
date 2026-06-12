'use strict';
/*
 * lexicon-service · Feature A — Indice de despliegue lexico (capital linguistico, V1).
 *
 * Registra, por (sessionId, subjectId), que grupos-concepto / terminos canonicos el alumno DEMOSTRO
 * usar alguna vez en sus respuestas escritas (los `lexical[].hit` que emite el motor). Con eso la
 * Devolucion distingue dos fallos distintos en cortas/desarrollo:
 *   - concepto NUNCA demostrado  -> conocimiento ("todavia no lo demostraste aca", CTA Aprender)
 *   - concepto demostrado antes y OMITIDO aca -> habito ("lo sabes y no lo desplegaste; lo usaste el X")
 *
 * Determinista, CERO IA. No toca la nota (el motor sigue siendo el unico juez); esto es una SENAL.
 * PERSISTENCIA: Firestore (Admin SDK via FIREBASE_SERVICE_ACCOUNT) o archivos locales; cache en memoria.
 * IDENTIDAD: el merge cross-dispositivo se hace en el server (resolveLinkedSessions -> demonstrated con
 * todas las sesiones vinculadas), igual que el learner-model. Asi un termino demostrado en la tablet
 * cuenta al corregir desde la identidad unificada (criterio del fundador).
 *
 * Esquema del doc (por sessionId): { [subjectId]: { [key]: {label, firstAt, lastAt, count} }, _sessionId, _subjects }
 */
const fs = require('fs');
const path = require('path');

function lazyFirestore() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    return admin.firestore();
  } catch (_) { return null; }
}

class LexiconService {
  constructor(root) {
    this.dir = root ? path.join(root, 'data', 'runtime', 'lexicon') : null;
    this.db = lazyFirestore();
    this.mode = this.db ? 'firestore' : 'local';
    this.col = 'cockpit_lexicon';
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

  // Registra los conceptos/terminos DEMOSTRADOS (hit) en este intento. items: [{key,label}].
  async record({ sessionId = 'anon', subjectId, items = [], at = 0 }) {
    if (!subjectId || !items.length) return null;
    const data = await this._load(sessionId);
    const subj = data[subjectId] || (data[subjectId] = {});
    for (const it of items) {
      if (!it || !it.key) continue;
      const cur = subj[it.key] || (subj[it.key] = { label: it.label || it.key, firstAt: at, lastAt: at, count: 0 });
      cur.label = it.label || cur.label;
      cur.lastAt = at || cur.lastAt;
      if (!cur.firstAt) cur.firstAt = at;
      cur.count += 1;
    }
    await this._save(sessionId, data);
    return subj;
  }

  // Conceptos demostrados, AGREGADOS sobre todas las sesiones vinculadas (identidad). {key:{label,firstAt,lastAt,count}}
  async demonstrated({ sessionIds = [], subjectId }) {
    const out = {};
    for (const sid of sessionIds) {
      const subj = (await this._load(sid))[subjectId] || {};
      for (const [key, v] of Object.entries(subj)) {
        const cur = out[key];
        if (!cur) out[key] = { label: v.label, firstAt: v.firstAt || 0, lastAt: v.lastAt || 0, count: v.count || 0 };
        else {
          cur.firstAt = Math.min(cur.firstAt || v.firstAt || 0, v.firstAt || 0) || cur.firstAt;
          cur.lastAt = Math.max(cur.lastAt || 0, v.lastAt || 0);
          cur.count += (v.count || 0);
          cur.label = cur.label || v.label;
        }
      }
    }
    return out;
  }
}

module.exports = { LexiconService };
