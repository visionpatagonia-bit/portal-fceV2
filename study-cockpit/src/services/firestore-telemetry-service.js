'use strict';

/*
 * firestore-telemetry-service — reemplaza events.jsonl por Firestore.
 *
 * Estrategia de persistencia (en orden):
 *   1) Firestore inyectado (`db`) o via firebase-admin (FIREBASE_SERVICE_ACCOUNT).
 *   2) Fallback LOCAL a events.jsonl (desarrollo / sin Firebase).
 *
 * Mantiene la MISMA interfaz que TelemetryService (appendEvent/readEvents/latestEvent)
 * para ser drop-in. Eventos por usuario van a usuarios/{uid}/cockpit_events;
 * sin uid, a la coleccion raiz cockpit_events.
 */

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

function lazyFirestore(injectedDb) {
  if (injectedDb) return injectedDb;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    }
    return admin.firestore();
  } catch (_) {
    return null; // firebase-admin no instalado o credencial invalida -> fallback
  }
}

class FirestoreTelemetryService {
  constructor({ root, db = null } = {}) {
    this.db = lazyFirestore(db);
    this.mode = this.db ? 'firestore' : 'local';
    this.runtimeDir = root ? path.join(root, 'data', 'runtime') : null;
    this.eventsFile = this.runtimeDir ? path.join(this.runtimeDir, 'events.jsonl') : null;
  }

  _stamp(event) {
    return {
      eventId: event.eventId || `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      type: event.type || 'unknown',
      subjectId: event.subjectId || null,
      sessionId: event.sessionId || 'local-demo',
      attemptId: event.attemptId || null,
      userId: event.userId || null,
      actor: event.actor || 'system',
      payload: event.payload || {},
      createdAt: event.createdAt || new Date().toISOString()
    };
  }

  _col(uid) {
    return uid
      ? this.db.collection('usuarios').doc(uid).collection('cockpit_events')
      : this.db.collection('cockpit_events');
  }

  async appendEvent(event) {
    const stored = this._stamp(event);
    if (this.mode === 'firestore') {
      await this._col(stored.userId).doc(stored.eventId).set(stored);
      return stored;
    }
    // fallback local
    await fs.mkdir(this.runtimeDir, { recursive: true });
    await fs.appendFile(this.eventsFile, `${JSON.stringify(stored)}\n`, 'utf8');
    return stored;
  }

  async readEvents({ limit = 80, subjectId, sessionId, type, userId } = {}) {
    if (this.mode === 'firestore') {
      let q = this._col(userId);
      if (subjectId) q = q.where('subjectId', '==', subjectId);
      if (type) q = q.where('type', '==', type);
      const snap = await q.orderBy('createdAt', 'desc').limit(limit).get();
      const events = snap.docs.map((d) => d.data()).reverse();
      return sessionId ? events.filter((e) => e.sessionId === sessionId) : events;
    }
    if (!this.eventsFile || !fsSync.existsSync(this.eventsFile)) return [];
    const lines = (await fs.readFile(this.eventsFile, 'utf8')).trim().split(/\r?\n/).filter(Boolean);
    return lines
      .map((l) => JSON.parse(l))
      .filter((e) => !subjectId || e.subjectId === subjectId)
      .filter((e) => !sessionId || e.sessionId === sessionId)
      .filter((e) => !type || e.type === type)
      .filter((e) => !userId || e.userId === userId)
      .slice(-limit);
  }

  async latestEvent(filter) {
    const events = await this.readEvents({ ...filter, limit: 500 });
    return events.at(-1) || null;
  }

  async ensureReady() {
    if (this.mode === 'local' && this.runtimeDir) await fs.mkdir(this.runtimeDir, { recursive: true });
  }
}

module.exports = { FirestoreTelemetryService };
