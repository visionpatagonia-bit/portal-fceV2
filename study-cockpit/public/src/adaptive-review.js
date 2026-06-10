// Repaso adaptativo: se arma en la Devolucion (a partir de las debilidades que decidio el motor
// determinista + las correcciones que ya estan en la KB) y se muestra en Aprender como contenido
// nuevo, guardado y borrable. Persiste en el navegador del alumno (localStorage); con login se
// sincroniza a su cuenta (ver firebase.js). El motor decide QUE reforzar; aca solo se empaqueta.

function key(subjectId) { return 'nexus.review.' + subjectId; }

export function getReviews(subjectId) {
  try { return JSON.parse(localStorage.getItem(key(subjectId)) || '[]'); }
  catch { return []; }
}

export function latestReview(subjectId) {
  return getReviews(subjectId)[0] || null;
}

export function hasUnseen(subjectId) {
  return getReviews(subjectId).some((r) => !r.seen);
}

// Preserva el flag `seen` si ya existia un repaso con el mismo id (no re-notifica al revisitar).
export function saveReview(subjectId, review) {
  try {
    const all = getReviews(subjectId);
    const prev = all.find((r) => r.reviewId === review.reviewId);
    const merged = prev && prev.seen ? { ...review, seen: true } : review;
    const rest = all.filter((r) => r.reviewId !== review.reviewId);
    localStorage.setItem(key(subjectId), JSON.stringify([merged, ...rest].slice(0, 8)));
    return merged;
  } catch { return review; }
}

export function deleteReview(subjectId, reviewId) {
  try {
    const rest = getReviews(subjectId).filter((r) => r.reviewId !== reviewId);
    localStorage.setItem(key(subjectId), JSON.stringify(rest));
  } catch { /* localStorage no disponible */ }
}

export function markSeen(subjectId, reviewId) {
  try {
    const all = getReviews(subjectId).map((r) => (r.reviewId === reviewId ? { ...r, seen: true } : r));
    localStorage.setItem(key(subjectId), JSON.stringify(all));
  } catch { /* no-op */ }
}

// Arma el objeto de repaso desde el resultado determinista + las correcciones (fail-explanations de la KB).
export function buildReview({ subjectId, attemptId, result, explanations }) {
  const weaknesses = (result && result.weaknesses) || [];
  const byBlock = {};
  (explanations || []).filter((e) => e && e.explanation).forEach((e) => {
    (byBlock[e.blockId] = byBlock[e.blockId] || []).push(e);
  });
  const items = weaknesses.map((w) => ({
    blockId: w.blockId,
    label: w.label,
    score: w.score,
    misses: w.misses || [],
    corrections: (byBlock[w.blockId] || []).map((e) => ({
      titulo: (e.explanation && (e.explanation.tituloFalla || e.explanation.titulo)) || e.missText,
      texto: (e.explanation && e.explanation.textoPedagogico) || '',
      proximoPaso: (e.explanation && e.explanation.proximoPaso) || '',
      source: e.source || null
    }))
  }));
  return {
    reviewId: 'rev_' + (attemptId || String(Date.now())),
    subjectId,
    attemptId: attemptId || null,
    createdAt: new Date().toISOString(),
    estimated: (result && (result.notaEstimada != null ? result.notaEstimada : result.total)) || 0,
    seen: false,
    items
  };
}
