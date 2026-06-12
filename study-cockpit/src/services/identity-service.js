'use strict';
/*
 * identity-service · PUENTE para auth futura (NO construye auth todavía).
 *
 * Hoy el alumno es una "sesión local" anónima (sessionId en el browser). Cuando exista login real,
 * vamos a querer linkear esas sesiones a un uid. Esta colección deja el puente listo SIN bloquear nada.
 *
 * Colección Firestore `identity_links` (1 doc por sessionId):
 *   {
 *     sessionId: string,        // id de la sesión local (clave del doc)
 *     uid: null,                // se completa cuando el alumno haga login (auth futura)
 *     sessionIds: string[],     // sesiones agrupadas bajo la misma identidad (multi-dispositivo)
 *     createdAt: number,        // epoch ms
 *     updatedAt: number
 *   }
 *
 * REGLA: anónimo por ahora (uid:null). No guarda datos personales. Firestore-or-local, degrada a no-op.
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

class IdentityService {
  constructor(root) {
    this.dir = root ? path.join(root, 'data', 'runtime', 'identity') : null;
    this.db = lazyFirestore();
    this.mode = this.db ? 'firestore' : 'local';
    this.col = 'identity_links';
  }

  _file(sessionId) { return this.dir ? path.join(this.dir, String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '_') + '.json') : null; }

  // Upsert del link de una sesión. (Opcional) linkSessionId = sesión a agrupar (otro dispositivo).
  async link({ sessionId, linkSessionId = null }) {
    if (!sessionId) return null;
    const now = Date.now();
    let doc = await this.get({ sessionId });
    if (!doc) doc = { sessionId: String(sessionId), uid: null, sessionIds: [String(sessionId)], createdAt: now, updatedAt: now };
    if (linkSessionId && !doc.sessionIds.includes(String(linkSessionId))) doc.sessionIds.push(String(linkSessionId));
    doc.updatedAt = now;
    if (this.mode === 'firestore') { try { await this.db.collection(this.col).doc(String(sessionId)).set(doc, { merge: true }); } catch (_) {} }
    else { const f = this._file(sessionId); if (f) { try { fs.mkdirSync(this.dir, { recursive: true }); fs.writeFileSync(f, JSON.stringify(doc), 'utf8'); } catch (_) {} } }
    return doc;
  }

  async get({ sessionId }) {
    if (!sessionId) return null;
    if (this.mode === 'firestore') { try { const s = await this.db.collection(this.col).doc(String(sessionId)).get(); return s.exists ? s.data() : null; } catch (_) { return null; } }
    const f = this._file(sessionId);
    if (f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { return null; } }
    return null;
  }
}

module.exports = { IdentityService };
