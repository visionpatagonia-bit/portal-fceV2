// Lightweight charts as HTML strings (no libs): donut, bars, sparkline.
import { escapeHtml, fmt2, clampPct } from '../format.js';

export function donut(value, max, label) {
  const pct = clampPct((Number(value) / (max || 10)) * 100);
  const shown = (value === null || value === undefined) ? '--' : fmt2(value);
  return `<div class="donut" style="--pct:${pct}">
    <div class="donut-center"><b>${escapeHtml(shown)}</b><span>${escapeHtml(label)}</span></div>
  </div>`;
}

// items: [{ label, value, max, weak, miss }]
export function bars(items = []) {
  if (!items.length) return '';
  return `<div class="bars">${items.map((it) => {
    const max = it.max || 2;
    const pct = clampPct((Number(it.value) / max) * 100);
    return `<div class="bar-row ${it.weak ? 'weak' : ''}">
      <div class="bar-top"><span>${escapeHtml(it.label)}</span><b>${fmt2(it.value)}/${max}</b></div>
      <div class="bar"><span style="width:${pct}%"></span></div>
      ${it.miss ? `<div class="miss">${escapeHtml(it.miss)}</div>` : ''}
    </div>`;
  }).join('')}</div>`;
}

// values: array of 0..1
export function sparkline(values = []) {
  const n = values.length;
  if (n < 2) return '';
  const w = 120, h = 36;
  const pts = values.map((v, i) => `${((i / (n - 1)) * w).toFixed(1)},${(h - clampPct(v * 100) / 100 * h).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}"/></svg>`;
}
