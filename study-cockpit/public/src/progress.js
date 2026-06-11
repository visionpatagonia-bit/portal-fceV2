// Historial de intentos por materia (para "Tu evolucion" y tendencia de debilidades).
// Persiste en el navegador del alumno; el motor determinista sigue siendo la unica autoridad de score.

const KEY = (subjectId) => 'nexus.history.' + subjectId;

export function getHistory(subjectId) {
  try { return JSON.parse(localStorage.getItem(KEY(subjectId)) || '[]'); }
  catch { return []; }
}

export function pushHistory(subjectId, entry) {
  try {
    const all = getHistory(subjectId);
    all.push(entry);
    localStorage.setItem(KEY(subjectId), JSON.stringify(all.slice(-12))); // ultimos 12
  } catch { /* localStorage no disponible */ }
}

// Arma una entrada de historial a partir del resultado determinista del backend.
export function buildEntry(result) {
  const blocks = {};
  Object.entries(result.blocks || {}).forEach(([id, b]) => { blocks[id] = { label: b.label, points: b.points }; });
  return {
    at: new Date().toISOString(),
    total: result.total,
    notaEstimada: result.notaEstimada != null ? result.notaEstimada : result.total,
    blocks,
    weaknesses: (result.weaknesses || []).map((w) => w.blockId)
  };
}

// ───────── Repaso espaciado (SRS) · #7 FSRS-lite ─────────
// Modelo de memoria por bloque: en vez de intervalos FIJOS (1,2,4,8,14), se estima la ESTABILIDAD
// (half-life en dias) que crece con el recall GRADUADO (points/max, no binario) y con el spacing
// (premiar acierto sobre tarjeta vencida), decrece con la DIFICULTAD del bloque, y COLAPSA con el
// lapso. dueAt = now + estabilidad. El motor sigue decidiendo el score; esto solo agenda el repaso.
const SRS_KEY = (s) => 'nexus.srs.' + s;
function getSRS(subjectId) { try { return JSON.parse(localStorage.getItem(SRS_KEY(subjectId)) || '{}'); } catch { return {}; } }
const DAY = 86400000;
const SRS_PASS = 1.35; // mismo umbral weakBlock del motor

export function updateSRS(subjectId, result, nowMs) {
  const now = nowMs || Date.now();
  const srs = getSRS(subjectId);
  Object.entries(result.blocks || {}).forEach(([id, b]) => {
    const prev = srs[id] || { stability: 1, reps: 0, lapses: 0, difficulty: 0.3 };
    const max = b.maxPoints || 2;
    const recall = Math.max(0, Math.min(1, (b.points || 0) / max)); // 0..1 (recall graduado)
    const passed = (b.points || 0) >= SRS_PASS;
    // dificultad por bloque (media movil): peor recall sostenido -> mas dificil -> menos crecimiento.
    const difficulty = Math.max(0.05, Math.min(0.95, (prev.difficulty != null ? prev.difficulty : 0.3) * 0.8 + (1 - recall) * 0.2));
    let stability;
    if (passed) {
      const overdue = prev.dueAt ? Math.max(0, (now - prev.dueAt) / DAY) : 0; // spacing effect
      const ease = 1.3 + 1.4 * recall - 0.8 * difficulty + Math.min(0.6, overdue * 0.15);
      stability = Math.min(120, Math.max(1, (prev.stability || 1) * Math.max(1.2, ease)));
    } else {
      stability = Math.max(0.5, (prev.stability || 1) * (0.2 + 0.3 * recall)); // lapso: colapsa
    }
    srs[id] = {
      lastScore: b.points, lastAt: now, stability, difficulty,
      reps: (prev.reps || 0) + 1, lapses: (prev.lapses || 0) + (passed ? 0 : 1),
      dueAt: now + Math.round(stability * DAY), interval: Math.round(stability), label: b.label
    };
  });
  try { localStorage.setItem(SRS_KEY(subjectId), JSON.stringify(srs)); } catch { /* no-op */ }
}

export function dueReviews(subjectId, nowMs) {
  const now = nowMs || Date.parse(new Date().toISOString());
  return Object.entries(getSRS(subjectId))
    .filter(([, s]) => s.dueAt && s.dueAt <= now)
    .map(([id, s]) => ({ blockId: id, label: s.label, lastScore: s.lastScore, dueAt: s.dueAt }))
    .sort((a, b) => a.dueAt - b.dueAt);
}

export function nextReview(subjectId, nowMs) {
  const now = nowMs || Date.parse(new Date().toISOString());
  const upcoming = Object.values(getSRS(subjectId)).filter((s) => s.dueAt && s.dueAt > now).sort((a, b) => a.dueAt - b.dueAt)[0];
  return upcoming ? Math.ceil((upcoming.dueAt - now) / DAY) : null; // dias hasta el proximo
}

// Tendencia por bloque entre el ultimo y el anteultimo intento: 'up' | 'down' | 'flat' | 'new'.
export function blockTrends(subjectId) {
  const h = getHistory(subjectId);
  if (h.length < 2) return {};
  const last = h[h.length - 1].blocks || {};
  const prev = h[h.length - 2].blocks || {};
  const out = {};
  Object.keys(last).forEach((id) => {
    if (!(id in prev)) { out[id] = { trend: 'new', label: last[id].label, points: last[id].points }; return; }
    const d = (last[id].points || 0) - (prev[id].points || 0);
    out[id] = { trend: d > 0.05 ? 'up' : d < -0.05 ? 'down' : 'flat', delta: Math.round(d * 100) / 100, label: last[id].label, points: last[id].points };
  });
  return out;
}
