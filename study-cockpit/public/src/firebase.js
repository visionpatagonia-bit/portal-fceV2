// Fase 3b — persistencia client-side en Firestore con el login Google del portal.
// Usa el SDK compat global (window.firebase) inicializado en index.html.
// Defensivo: si Firebase no está disponible, todo degrada a no-op (no rompe la app).
// REGLA: nunca recalcula la nota; guarda lo que devolvió el backend.

const fb = typeof window !== 'undefined' ? window.firebase : null;
let auth = null;
let db = null;
let ready = false;

try {
  if (fb && fb.apps && fb.apps.length) {
    auth = fb.auth();
    db = fb.firestore();
    ready = true;
  }
} catch (_) { ready = false; }

export const available = () => ready;
const uid = () => (auth && auth.currentUser ? auth.currentUser.uid : null);
const serverTs = () => fb.firestore.FieldValue.serverTimestamp();

export function adaptUser(user) {
  if (!user) return null;
  return {
    userId: user.uid,
    displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Estudiante'),
    email: user.email || null,
    authProvider: (user.providerData && user.providerData[0] && user.providerData[0].providerId) || 'firebase'
  };
}

export function onAuth(cb) { if (ready) auth.onAuthStateChanged(cb); }
export function currentUser() { return auth && auth.currentUser ? auth.currentUser : null; }
export function signInGoogle() {
  const provider = new fb.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return auth.signInWithPopup(provider);
}
export function signOut() { return auth ? auth.signOut() : Promise.resolve(); }

function userCol(name) {
  const u = uid();
  return u ? db.collection('usuarios').doc(u).collection(name) : null;
}

/* Telemetría → usuarios/{uid}/cockpit_events (fire-and-forget) */
export async function logEvent(event) {
  const col = ready ? userCol('cockpit_events') : null;
  if (!col) return;
  try { await col.add({ ...event, userId: uid(), createdAt: serverTs() }); } catch (_) {}
}

/* Sesión de estudio (post-score) → usuarios/{uid}/studySessions/{sessionId} */
export async function saveStudySession({ subjectId, sessionId, attemptId = null, result }) {
  const col = ready ? userCol('studySessions') : null;
  if (!col || !result) return null;
  const doc = {
    userId: uid(), subjectId, sessionId, attemptId,
    score: { total: result.total, status: result.status, source: 'deterministic_backend' },
    blocks: result.blocks || {},
    weaknesses: result.weaknesses || [],
    nextMission: result.nextMission || null,
    updatedAt: serverTs()
  };
  try { await col.doc(sessionId).set(doc, { merge: true }); return doc; } catch (_) { return null; }
}

/* Intento (inmutable) → usuarios/{uid}/attempts/{attemptId} */
export async function saveAttempt({ subjectId, sessionId, attemptId, result }) {
  const col = ready ? userCol('attempts') : null;
  if (!col || !result) return null;
  const id = attemptId || `att_${Date.now()}`;
  const doc = { userId: uid(), subjectId, sessionId, attemptId: id, total: result.total, status: result.status, createdAt: serverTs() };
  try { await col.doc(id).set(doc); return doc; } catch (_) { return null; }
}

/* Nota real → usuarios/{uid}/realGrades (guarda estimado para calibración) */
export async function saveRealGrade({ subjectId, sessionId, realGrade, estimatedScore }) {
  const col = ready ? userCol('realGrades') : null;
  if (!col) return null;
  const within = Number.isFinite(estimatedScore) ? Math.abs(estimatedScore - realGrade) <= 1 : false;
  const doc = { userId: uid(), subjectId, sessionId: sessionId || null, realGrade, estimatedScore: estimatedScore ?? null, withinOnePoint: within, createdAt: serverTs() };
  try { await col.add(doc); return doc; } catch (_) { return null; }
}

/* Repaso adaptativo → usuarios/{uid}/adaptiveReviews/{reviewId} (persiste el flujo de estudio) */
export async function saveAdaptiveReview({ subjectId, review }) {
  const col = ready ? userCol('adaptiveReviews') : null;
  if (!col || !review || !review.reviewId) return null;
  try { await col.doc(review.reviewId).set({ userId: uid(), subjectId, ...review, updatedAt: serverTs() }, { merge: true }); return review; }
  catch (_) { return null; }
}
export async function deleteAdaptiveReview({ reviewId }) {
  const col = ready ? userCol('adaptiveReviews') : null;
  if (!col || !reviewId) return;
  try { await col.doc(reviewId).delete(); } catch (_) {}
}

/* Sync hibrido: al iniciar sesion, sube lo generado en local (repasos, re-explicaciones,
   preguntas, bloques repasados) a la cuenta del usuario. Captura, no pisa: merge. */
export async function syncLocalToFirestore() {
  if (!ready || !uid()) return;
  try {
    const artifacts = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('nexus.') === 0) artifacts[k.replace(/\./g, '__')] = localStorage.getItem(k);
    }
    if (!Object.keys(artifacts).length) return;
    await db.collection('usuarios').doc(uid()).collection('cockpit_artifacts').doc('local')
      .set({ userId: uid(), artifacts, updatedAt: serverTs() }, { merge: true });
  } catch (_) {}
}

/* Calibración por materia (lee realGrades del propio alumno) */
export async function getCalibration({ subjectId } = {}) {
  const col = ready ? userCol('realGrades') : null;
  if (!col) return { totalCases: 0, withinOnePointCount: 0, calibrationWithin1ptRate: null, cases: [] };
  try {
    let q = col;
    if (subjectId) q = q.where('subjectId', '==', subjectId);
    const snap = await q.get();
    const cases = snap.docs.map((d) => d.data()).filter((c) => Number.isFinite(c.estimatedScore) && Number.isFinite(c.realGrade));
    const within = cases.filter((c) => c.withinOnePoint).length;
    return {
      totalCases: cases.length,
      withinOnePointCount: within,
      calibrationWithin1ptRate: cases.length ? within / cases.length : null,
      cases
    };
  } catch (_) {
    return { totalCases: 0, withinOnePointCount: 0, calibrationWithin1ptRate: null, cases: [] };
  }
}
