// Pure formatting/helpers — no DOM, no state.

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const fmt2 = (value) => Number(value || 0).toFixed(2);

export const clampPct = (value) => Math.max(0, Math.min(100, Number(value) || 0));

export function fmtDateTime(value) {
  try {
    return new Date(value).toLocaleString('es-AR', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
    });
  } catch {
    return 'sin fecha';
  }
}

export function statusLabel(status) {
  return {
    promotion_estimated: 'Promocion estimada',
    pass_estimated: 'Aprobacion probable',
    risk: 'Riesgo activo',
    unsupported_subject: 'Materia sin rubrica'
  }[status] || status || 'Sin estado';
}

export function statusTone(status) {
  if (status === 'promotion_estimated') return 'ok';
  if (status === 'pass_estimated') return 'cyan';
  if (status === 'risk') return 'warn';
  return 'warn';
}

// Stable visual accent per subject (badge color class).
export function subjectAccent(subjectId) {
  return subjectId === 'administracion' ? 'blue' : 'magenta';
}
