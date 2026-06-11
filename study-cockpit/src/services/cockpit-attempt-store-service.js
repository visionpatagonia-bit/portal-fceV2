'use strict';

/*
 * cockpit-attempt-store-service — registro DURABLE de cada evaluacion.
 *
 * Guarda CADA intento corregido (resultado del motor determinista: bloques, gaps, score) para tener
 * el dataset completo de "que fallo cada evaluacion". ANONIMO: solo sessionId de navegador, NUNCA las
 * respuestas crudas del alumno (privacidad). Espejo del patron de fail-explanation-kb-service:
 * Firestore (Admin SDK) si hay FIREBASE_SERVICE_ACCOUNT, si no archivos locales; degrada a no-op.
 *
 * NO decide nada de la nota (eso lo hizo el motor); es solo persistencia/archivo.
 */

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

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

// Compacta el resultado del motor a lo que vale la pena archivar (sin respuestas del alumno).
function compactAttempt({ subjectId, sessionId, attemptId, mode, result }) {
  const r = result || {};
  return {
    schemaVersion: '1.0.0',
    attemptId: attemptId || ('att_' + Date.now()),
    subjectId,
    sessionId: sessionId || 'anon',
    mode: mode || 'practice',
    variantId: r.variantId || null,
    total: r.total != null ? r.total : null,
    scoreTecnico: r.scoreTecnico != null ? r.scoreTecnico : null,
    notaEstimada: r.notaEstimada != null ? r.notaEstimada : null,
    estimatedStatus: r.estimatedStatus || r.status || null,
    pointsRecoverable: r.pointsRecoverable != null ? r.pointsRecoverable : null,
    blocks: Object.entries(r.blocks || {}).map(([id, b]) => ({
      id,
      label: b.label || id,
      points: b.points,
      maxPoints: b.maxPoints != null ? b.maxPoints : 2,
      misses: (b.misses || []).slice(0, 6),
      // #1 psicometria: correctitud por item (score01 0..1) para p-value + discriminacion. Sin respuestas del alumno.
      itemResults: (b.itemResults || []).map((it) => ({ itemId: it.itemId, score01: it.score01, maxPoints: it.maxPoints }))
    })),
    gaps: (r.gaps || []).map((g) => ({ blockId: g.blockId, pointsLost: g.pointsLost, misses: (g.misses || []).slice(0, 6) })),
    audit: { excludesStudentAnswer: true, anonymous: true, finalScoreAuthority: 'deterministic_core' }
  };
}

class CockpitAttemptStoreService {
  constructor({ root, db = null } = {}) {
    this.db = lazyFirestore(db);
    this.mode = this.db ? 'firestore' : 'local';
    this.dir = root ? path.join(root, 'data', 'runtime', 'attempts') : null;
    this.col = 'cockpit_attempts';
  }

  async save(attempt) {
    const record = { ...attempt, createdAt: attempt.createdAt || new Date().toISOString() };
    const id = record.attemptId;
    if (this.mode === 'firestore') {
      try { await this.db.collection(this.col).doc(id).set(record, { merge: true }); } catch (_) {}
      return record;
    }
    if (!this.dir) return record;
    try {
      await fs.mkdir(this.dir, { recursive: true });
      await fs.writeFile(path.join(this.dir, `${id}.json`), JSON.stringify(record, null, 2), 'utf8');
    } catch (_) {}
    return record;
  }

  async list({ subjectId, sessionId, limit = 50 } = {}) {
    if (this.mode === 'firestore') {
      try {
        let q = this.db.collection(this.col);
        if (subjectId) q = q.where('subjectId', '==', subjectId);
        if (sessionId) q = q.where('sessionId', '==', sessionId);
        const snap = await q.limit(Number(limit) || 50).get();
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
        .filter((r) => !sessionId || r.sessionId === sessionId)
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
        .slice(0, Number(limit) || 50);
    } catch (_) { return []; }
  }
}

module.exports = { CockpitAttemptStoreService, compactAttempt };
