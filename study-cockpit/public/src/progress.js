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
