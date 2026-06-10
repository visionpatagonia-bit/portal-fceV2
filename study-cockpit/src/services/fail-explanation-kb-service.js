'use strict';

/*
 * fail-explanation-kb-service — dataset de "explicaciones de fallo" reutilizable.
 *
 * Unidad = el MISS individual que detecta el nucleo determinista (scoring.js).
 * Fingerprint = (subjectId, blockId, missText normalizado). El mismo fallo entre
 * alumnos comparte explicacion -> con el tiempo se sirve SIN Gemini.
 *
 * Espejo del patron de firestore-kb-service: Firestore (Admin SDK) si hay
 * FIREBASE_SERVICE_ACCOUNT, si no archivos locales. Degrada a no-op ante errores.
 * Gemini NUNCA decide que esta mal (eso lo marco el motor); solo EXPLICA.
 */

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableJson(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const slug = (v) => String(v || 'unknown').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'unknown';

// Normaliza el texto del miss para deduplicar entre alumnos sin colisionar misses distintos.
// Quita "(esperado: ...)", "esperado X", numeros y acentos. (warning del diseno)
function normalizeMiss(v) {
  return String(v || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\(esperad[oa]s?:[^)]*\)/g, ' ')
    .replace(/esperad[oa]s?\s+[^,.;:]+/g, ' ')
    .replace(/\d+([.,]\d+)?/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lazyFirestore(injectedDb) {
  if (injectedDb) return injectedDb;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    return admin.firestore();
  } catch (_) { return null; }
}

function fvIncrement(n) {
  try { return require('firebase-admin').firestore.FieldValue.increment(n); } catch (_) { return n; }
}

class FailExplanationKbService {
  constructor({ root, db = null } = {}) {
    this.db = lazyFirestore(db);
    this.mode = this.db ? 'firestore' : 'local';
    this.dir = root ? path.join(root, 'data', 'kb', 'fail-explanations') : null;
    this.col = 'cockpit_fail_explanations';
  }

  fingerprint({ subjectId, blockId, missText }) {
    const payload = { s: slug(subjectId), b: slug(blockId), m: normalizeMiss(missText) };
    return crypto.createHash('sha256').update(stableJson(payload)).digest('hex').slice(0, 20);
  }

  _entryId(subjectId, blockId, fp) { return `fxk_${slug(subjectId)}_${slug(blockId)}_${fp}`; }
  _file(entryId) { return path.join(this.dir, `${entryId}.json`); }

  async find({ subjectId, blockId, missText }) {
    const fp = this.fingerprint({ subjectId, blockId, missText });
    if (this.mode === 'firestore') {
      try { const d = await this.db.collection(this.col).doc(fp).get(); return d.exists ? d.data() : null; }
      catch (_) { return null; }
    }
    if (!this.dir) return null;
    const f = this._file(this._entryId(subjectId, blockId, fp));
    if (!fsSync.existsSync(f)) return null;
    try { return JSON.parse(await fs.readFile(f, 'utf8')); } catch (_) { return null; }
  }

  async touch({ subjectId, blockId, missText }) {
    const fp = this.fingerprint({ subjectId, blockId, missText });
    const now = new Date().toISOString();
    if (this.mode === 'firestore') {
      try { await this.db.collection(this.col).doc(fp).update({ occurrenceCount: fvIncrement(1), lastUsedAt: now }); } catch (_) {}
      return fp;
    }
    try {
      const f = this._file(this._entryId(subjectId, blockId, fp));
      if (fsSync.existsSync(f)) {
        const rec = JSON.parse(await fs.readFile(f, 'utf8'));
        rec.occurrenceCount = (rec.occurrenceCount || 0) + 1;
        rec.lastUsedAt = now;
        await fs.writeFile(f, JSON.stringify(rec, null, 2), 'utf8');
      }
    } catch (_) {}
    return fp;
  }

  async save({ subjectId, blockId, blockLabel, missText, explanation, source }) {
    const fp = this.fingerprint({ subjectId, blockId, missText });
    const now = new Date().toISOString();
    const entryId = this._entryId(subjectId, blockId, fp);
    const record = {
      schemaVersion: '1.0.0',
      entryId,
      fingerprint: fp,
      subjectId,
      blockId,
      blockLabel: blockLabel || null,
      missText,
      explanation,
      source: source || 'gemini',
      reviewStatus: 'generated_unreviewed',
      canonical: false,
      occurrenceCount: 1,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
      audit: { excludesStudentAnswer: true, excludesApiKey: true, finalScoreAuthority: 'deterministic_core' }
    };
    if (this.mode === 'firestore') {
      try { await this.db.collection(this.col).doc(fp).set(record, { merge: true }); } catch (_) {}
      return record;
    }
    if (!this.dir) return record;
    try {
      await fs.mkdir(this.dir, { recursive: true });
      await fs.writeFile(this._file(entryId), JSON.stringify(record, null, 2), 'utf8');
    } catch (_) {}
    return record;
  }

  // Mejora la explicacion guardada SIN tocar el contador ni la fecha de creacion (a diferencia de
  // save, que reinicia occurrenceCount). Se usa cuando un error es frecuente y conviene una mejor
  // explicacion generada por IA. Marca reviewStatus 'ai_improved' + qualityVersion.
  async improve({ subjectId, blockId, missText, explanation, source = 'gemini' }) {
    const fp = this.fingerprint({ subjectId, blockId, missText });
    const now = new Date().toISOString();
    const patch = { explanation, source, reviewStatus: 'ai_improved', qualityVersion: 2, updatedAt: now };
    if (this.mode === 'firestore') {
      // update() (no set+merge): si el doc no existe, falla y queda atrapado -> nunca crea una entrada
      // KB incompleta (sin occurrenceCount/subjectId). Simetrico con touch() y con la guarda local.
      try { await this.db.collection(this.col).doc(fp).update(patch); } catch (_) {}
      return patch;
    }
    if (!this.dir) return patch;
    try {
      const f = this._file(this._entryId(subjectId, blockId, fp));
      if (fsSync.existsSync(f)) {
        const rec = JSON.parse(await fs.readFile(f, 'utf8'));
        Object.assign(rec, patch);
        await fs.writeFile(f, JSON.stringify(rec, null, 2), 'utf8');
      }
    } catch (_) {}
    return patch;
  }

  async list({ subjectId, blockId, limit = 50 } = {}) {
    if (this.mode === 'firestore') {
      try {
        let q = this.db.collection(this.col);
        if (subjectId) q = q.where('subjectId', '==', subjectId);
        const snap = await q.limit(limit).get();
        return snap.docs.map((d) => d.data());
      } catch (_) { return []; }
    }
    if (!this.dir || !fsSync.existsSync(this.dir)) return [];
    try {
      const files = (await fs.readdir(this.dir)).filter((f) => f.endsWith('.json'));
      const all = [];
      for (const f of files) { try { all.push(JSON.parse(await fs.readFile(path.join(this.dir, f), 'utf8'))); } catch (_) {} }
      return all
        .filter((r) => !subjectId || r.subjectId === subjectId)
        .filter((r) => !blockId || r.blockId === blockId)
        .sort((a, b) => (b.occurrenceCount || 0) - (a.occurrenceCount || 0))
        .slice(0, Number(limit) || 50);
    } catch (_) { return []; }
  }
}

module.exports = { FailExplanationKbService };
