// Repaso adaptativo: se arma en la Devolucion (a partir de las debilidades que decidio el motor
// determinista + las correcciones que ya estan en la KB) y se muestra en Aprender como contenido
// nuevo, guardado y borrable. Persiste en el navegador del alumno (localStorage); con login se
// sincroniza a su cuenta (ver firebase.js). El motor decide QUE reforzar; aca solo se empaqueta.

import { reviewLinkFor } from './review-links.js';

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
// studyBlocks (opcional): { blockId -> study-block } precargado, para derivar el concepto real de
// cada link de reestudio; si falta, reviewLinkFor degrada a { block }.
export function buildReview({ subjectId, attemptId, result, explanations, studyBlocks = {} }) {
  // Usa los GAPS (todo bloque que perdio puntos), no solo las debilidades por umbral: asi el repaso
  // resalta CADA punto recuperable. Fallback a weaknesses para resultados viejos.
  const weaknesses = (result && Array.isArray(result.gaps) && result.gaps.length ? result.gaps : (result && result.weaknesses)) || [];
  // Dedup por fingerprint del servidor (mismo criterio que la pantalla de Devolucion): dos misses
  // distintos (ej b2 y b4, las dos afirmaciones falsas sin justificar) colapsan en la MISMA
  // explicacion generica y comparten fingerprint -> se guarda UNA sola tarjeta, no duplicados.
  const byBlock = {};
  const seenFp = new Set();
  (explanations || []).filter((e) => e && e.explanation).forEach((e) => {
    const fp = e.fingerprint || (e.blockId + '|' + ((e.explanation && (e.explanation.tituloFalla || e.explanation.titulo)) || e.missText || ''));
    if (seenFp.has(fp)) return;
    seenFp.add(fp);
    (byBlock[e.blockId] = byBlock[e.blockId] || []).push(e);
  });
  const items = weaknesses.map((w) => {
    // Segunda red anti-duplicado por contenido (idempotente entre reintentos de loadFailExplanations).
    const seenCorr = new Set();
    const corrections = (byBlock[w.blockId] || []).map((e) => ({
      titulo: (e.explanation && (e.explanation.tituloFalla || e.explanation.titulo)) || e.missText,
      texto: (e.explanation && e.explanation.textoPedagogico) || '',
      proximoPaso: (e.explanation && e.explanation.proximoPaso) || '',
      respuestaModelo: (e.explanation && e.explanation.respuestaModelo) || '',
      source: e.source || null,
      // Accion de reestudio derivada deterministicamente (concepto/worked-example) — sin Gemini.
      reviewLink: reviewLinkFor(w.blockId, e.missText || (e.explanation && (e.explanation.tituloFalla || e.explanation.titulo)) || '', studyBlocks[w.blockId])
    })).filter((c) => {
      const fp = (String(c.titulo || '').toLowerCase().trim()) + '|' + (String(c.texto || '').toLowerCase().trim());
      if (seenCorr.has(fp)) return false;
      seenCorr.add(fp);
      return true;
    });
    return {
      blockId: w.blockId,
      label: w.label,
      score: w.score,
      maxPoints: w.maxPoints != null ? w.maxPoints : 2,
      pointsLost: w.pointsLost != null ? w.pointsLost : null,
      misses: w.misses || [],
      corrections
    };
  });
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
