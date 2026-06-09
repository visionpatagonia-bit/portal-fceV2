'use strict';

/*
 * firestore-kb-service — KB adaptativa reutilizable sobre Firestore.
 *
 * Colección compartida `cockpit_kb/{fingerprint}`. Fallback LOCAL a archivos
 * cuando no hay Firebase (desarrollo). Guarda:
 *   materia, bloque, prompt fingerprint, contenido generado,
 *   source: gemini|kb|fallback, reviewStatus: generated_unreviewed|audited|rejected.
 *
 * Reuso por huella (subjectId+blockId+mode+targetMisses). NUNCA canónico hasta auditar.
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
const normalizeMisses = (v) => Array.isArray(v) ? v.map((i) => String(i || '').replace(/\s+/g, ' ').trim().toLowerCase()).filter(Boolean).sort() : [];

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

class FirestoreKbService {
  constructor({ root, db = null } = {}) {
    this.db = lazyFirestore(db);
    this.mode = this.db ? 'firestore' : 'local';
    this.kbDir = root ? path.join(root, 'data', 'kb', 'adaptive-content', 'entries') : null;
  }

  fingerprint({ subjectId, blockId, mode, targetMisses }) {
    const payload = { subjectId: slug(subjectId), blockId: slug(blockId), mode: slug(mode || 'retrain'), targetMisses: normalizeMisses(targetMisses) };
    return crypto.createHash('sha256').update(stableJson(payload)).digest('hex').slice(0, 20);
  }

  _record({ subjectId, blockId, mode, targetMisses, generated, studyBlock, fingerprint }) {
    const now = new Date().toISOString();
    const llmUsed = Boolean(generated?.content?.audit?.llm_used);
    return {
      schemaVersion: '1.0.0',
      entryId: `akc_${slug(subjectId)}_${slug(blockId)}_${fingerprint}`,
      fingerprint,
      subjectId,
      blockId,
      blockLabel: studyBlock?.label || null,
      mode: mode || 'retrain',
      targetMisses: normalizeMisses(targetMisses),
      content: generated.content,
      source: generated.provider === 'gemini' ? 'gemini' : (generated.provider === 'kb' ? 'kb' : 'fallback'),
      reviewStatus: 'generated_unreviewed',
      audit: { llmUsed, finalScoreAuthority: 'deterministic_core', excludesApiKey: true, excludesStudentAnswer: true },
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
      reuseCount: 0
    };
  }

  async findReusable({ subjectId, blockId, mode, targetMisses }) {
    const fp = this.fingerprint({ subjectId, blockId, mode, targetMisses });
    if (this.mode === 'firestore') {
      try {
        const doc = await this.db.collection('cockpit_kb').doc(fp).get();
        if (!doc.exists) return null;
        const entry = doc.data();
        await doc.ref.update({ reuseCount: (entry.reuseCount || 0) + 1, lastUsedAt: new Date().toISOString() });
        return { ...entry, reuse: { reused: true, fingerprint: fp, matchedBy: 'exact_pedagogic_fingerprint' } };
      } catch (_) { return null; } // Firestore no disponible -> sin cache, se genera de nuevo
    }
    if (!this.kbDir) return null;
    const file = path.join(this.kbDir, `akc_${slug(subjectId)}_${slug(blockId)}_${fp}.json`);
    if (!fsSync.existsSync(file)) return null;
    return JSON.parse(await fs.readFile(file, 'utf8'));
  }

  async save({ subjectId, blockId, mode, targetMisses, generated, studyBlock }) {
    if (!generated?.content) return null;
    const fp = this.fingerprint({ subjectId, blockId, mode, targetMisses });
    const record = this._record({ subjectId, blockId, mode, targetMisses, generated, studyBlock, fingerprint: fp });

    if (this.mode === 'firestore') {
      try {
        await this.db.collection('cockpit_kb').doc(fp).set(record, { merge: true });
        return record;
      } catch (_) { return null; } // Firestore no disponible -> no se persiste, el contenido igual se devuelve
    }
    await fs.mkdir(this.kbDir, { recursive: true });
    await fs.writeFile(path.join(this.kbDir, `${record.entryId}.json`), JSON.stringify(record, null, 2), 'utf8');
    return record;
  }

  async get(entryIdOrFingerprint) {
    if (this.mode === 'firestore') {
      try {
        const doc = await this.db.collection('cockpit_kb').doc(entryIdOrFingerprint).get();
        return doc.exists ? doc.data() : null;
      } catch (_) { return null; }
    }
    return null;
  }

  async list({ subjectId, limit = 50 } = {}) {
    if (this.mode === 'firestore') {
      try {
        let q = this.db.collection('cockpit_kb');
        if (subjectId) q = q.where('subjectId', '==', subjectId);
        const snap = await q.limit(limit).get();
        return snap.docs.map((d) => d.data());
      } catch (_) { return []; }
    }
    return [];
  }

  async setReviewStatus(fingerprint, status) {
    if (!['generated_unreviewed', 'audited', 'rejected'].includes(status)) throw new Error('invalid_review_status');
    if (this.mode === 'firestore') {
      try {
        await this.db.collection('cockpit_kb').doc(fingerprint).update({ reviewStatus: status, updatedAt: new Date().toISOString() });
      } catch (_) { /* no-op si Firestore no esta disponible */ }
    }
    return { fingerprint, reviewStatus: status };
  }
}

module.exports = { FirestoreKbService };
