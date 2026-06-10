'use strict';

/*
 * cockpit-questions-kb-service — cache de preguntas libres del alumno + su respuesta IA.
 *
 * Misma pregunta entre alumnos -> se sirve la respuesta guardada SIN llamar a Gemini.
 * Espejo del patron de fail-explanation-kb-service (Firestore-o-local, fingerprint, occurrenceCount).
 *
 * Normalizacion CONSERVADORA: solo minusculas/acentos/espacios/signos de cierre.
 * NO borra numeros ni negaciones (si no, "que es X" colisionaria con "que NO es X").
 * El matching es exacto por fingerprint: variantes de redaccion = cache-miss benigno.
 * Privacidad: guarda pregunta+respuesta, NUNCA sessionId ni identificador de alumno.
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

// CONSERVADORA: preserva numeros y negaciones; solo limpia mayusculas/acentos/espacios y signos de cierre.
function normalizeQuestion(v) {
  return String(v || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!]/g, ' ')
    .replace(/\.+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Stopwords ES: se descartan para comparar el CONTENIDO de dos preguntas, no su relleno.
const STOPWORDS = new Set(['que', 'cual', 'cuales', 'como', 'cuando', 'donde', 'es', 'son', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'en', 'por', 'para', 'con', 'y', 'o', 'u', 'se', 'su', 'sus', 'lo', 'le', 'me', 'mi', 'si', 'esto', 'este', 'esta', 'eso', 'esa', 'hay', 'tiene', 'define', 'defini', 'explica', 'explicame', 'decime', 'dame']);
const NEG_RE = /\bno\b|\bnunca\b|\bjamas\b|\btampoco\b|\bsin\b/;
function contentTokens(q) {
  return new Set(String(q || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w)));
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0; a.forEach((w) => { if (b.has(w)) inter++; });
  return inter / (a.size + b.size - inter);
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

class QuestionsKbService {
  constructor({ root, db = null } = {}) {
    this.db = lazyFirestore(db);
    this.mode = this.db ? 'firestore' : 'local';
    this.dir = root ? path.join(root, 'data', 'kb', 'questions') : null;
    this.col = 'cockpit_questions';
  }

  fingerprint({ subjectId, blockId, question }) {
    const payload = { s: slug(subjectId), b: slug(blockId), q: normalizeQuestion(question) };
    return crypto.createHash('sha256').update(stableJson(payload)).digest('hex').slice(0, 20);
  }

  _entryId(subjectId, blockId, fp) { return `qk_${slug(subjectId)}_${slug(blockId)}_${fp}`; }
  _file(entryId) { return path.join(this.dir, `${entryId}.json`); }

  async find({ subjectId, blockId, question }) {
    const fp = this.fingerprint({ subjectId, blockId, question });
    if (this.mode === 'firestore') {
      try { const d = await this.db.collection(this.col).doc(fp).get(); return d.exists ? d.data() : null; }
      catch (_) { return null; }
    }
    if (!this.dir) return null;
    const f = this._file(this._entryId(subjectId, blockId, fp));
    if (!fsSync.existsSync(f)) return null;
    try { return JSON.parse(await fs.readFile(f, 'utf8')); } catch (_) { return null; }
  }

  // Busca una pregunta SIMILAR (no exacta) ya respondida por IA en el mismo bloque, para servirla
  // sin volver a llamar a Gemini. Conservador: compara solo CONTENIDO (sin stopwords), exige
  // umbral alto y NEGACION consistente (no confunde "que es X" con "que NO es X").
  async findSimilar({ subjectId, blockId, question, minScore = 0.6 }) {
    const q = String(question || '').trim();
    if (!q) return null;
    const target = contentTokens(q);
    if (target.size < 1) return null;
    const qNeg = NEG_RE.test(q.toLowerCase());
    let all = [];
    try { all = await this.list({ subjectId, blockId, limit: 100 }); } catch (_) { return null; }
    let best = null; let bestScore = 0;
    for (const rec of all) {
      if (!rec || !rec.answer || rec.source !== 'gemini') continue;
      if (blockId && rec.blockId !== blockId) continue;
      if (NEG_RE.test(String(rec.question || '').toLowerCase()) !== qNeg) continue;
      const s = jaccard(target, contentTokens(rec.question));
      if (s > bestScore) { bestScore = s; best = rec; }
    }
    if (best && bestScore >= minScore) return { ...best, similarity: Math.round(bestScore * 100) / 100 };
    return null;
  }

  async touch({ subjectId, blockId, question }) {
    const fp = this.fingerprint({ subjectId, blockId, question });
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

  async save({ subjectId, blockId, blockLabel, question, answer }) {
    const fp = this.fingerprint({ subjectId, blockId, question });
    const now = new Date().toISOString();
    const entryId = this._entryId(subjectId, blockId, fp);
    const record = {
      schemaVersion: '1.0.0',
      entryId,
      fingerprint: fp,
      subjectId,
      blockId,
      blockLabel: blockLabel || null,
      question,
      answer,
      source: 'gemini',
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

module.exports = { QuestionsKbService };
