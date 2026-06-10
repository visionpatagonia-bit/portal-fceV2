import { escapeHtml, fmt2, fmtDateTime } from '../format.js';
import { loadingState, errorState, chip } from '../components/ui.js';
import { getHistory, blockTrends } from '../progress.js';

// Analitica de aprendizaje: timeline de intentos (snapshots locales) + tendencia por bloque +
// dificultad agregada (del store durable, anonimo). Solo lectura; el motor sigue siendo la autoridad.
export async function render(root, ctx) {
  const { data, api } = ctx;
  root.innerHTML = loadingState('Analizando tu progreso...');
  try {
    await data.ensureSubjects();
    const subject = data.activeSubject();
    if (!subject) { root.innerHTML = errorState('No hay materias disponibles.'); return; }

    const history = getHistory(subject.id);
    let diff = null;
    try { diff = await api.analyticsDifficulty({ subjectId: subject.id }); } catch (_) {}

    root.innerHTML = `
      <div class="view-head">
        <div><p class="eyebrow">Progreso · ${escapeHtml(subject.name)}</p><h1>Tu analitica de aprendizaje</h1>
          <p>Como venis intento a intento, que bloques mejoraron y que es lo que mas cuesta (a vos y en general).</p></div>
        <button class="btn btn-primary" data-go="evaluar">Hacer un intento</button>
      </div>

      ${timelineCard(history)}
      ${trendsCard(subject.id)}
      ${difficultyCard(diff)}
      ${topMissesCard(diff)}
    `;
  } catch (err) {
    root.innerHTML = errorState(err.message, 'data-retry="progreso"');
  }
}

// Timeline: cada intento es un snapshot (nota + fecha). Sparkline + lista cronologica.
function timelineCard(history) {
  if (!history.length) {
    return `<section class="card section"><div class="card-head"><h2>Tu evolucion</h2></div>
      <p class="muted">Todavia no hay intentos corregidos. Rendi uno y vas a ver tu linea de progreso, snapshot a snapshot.</p>
      <div class="btn-row" style="margin-top:10px"><button class="btn btn-primary" data-go="evaluar">Rendir intento</button></div></section>`;
  }
  const max = 10;
  const sparks = history.map((e, i) => {
    const v = e.notaEstimada != null ? e.notaEstimada : e.total;
    return `<div class="evo-bar" title="Intento ${i + 1}: ${fmt2(v)}/10 (${escapeHtml(fmtDateTime(e.at))})"><span style="height:${Math.max(6, Math.min(100, (v / max) * 100))}%"></span></div>`;
  }).join('');
  const rows = history.slice().reverse().map((e, idx) => {
    const i = history.length - idx;
    const v = e.notaEstimada != null ? e.notaEstimada : e.total;
    const prev = history[history.length - idx - 2];
    const d = prev ? Math.round(((e.notaEstimada ?? e.total) - (prev.notaEstimada ?? prev.total)) * 100) / 100 : null;
    const darrow = d == null ? '' : (d > 0 ? `<b class="t-up">+${fmt2(d)}</b>` : d < 0 ? `<b class="t-down">${fmt2(d)}</b>` : '<span class="muted">=</span>');
    return `<div class="list-row" style="cursor:default">
      <span class="badge cyan">#${i}</span>
      <span><span class="t-title" style="font-size:13px">Nota estimada ${fmt2(v)}/10</span><span class="t-sub">${escapeHtml(fmtDateTime(e.at))}</span></span>
      <span class="t-end">${darrow}</span></div>`;
  }).join('');
  const last = history[history.length - 1];
  const lastV = last.notaEstimada != null ? last.notaEstimada : last.total;
  return `<section class="card section">
    <div class="card-head"><h2>Tu evolucion</h2>${chip(history.length + ' intentos', 'cyan')}</div>
    <div class="evo-spark">${sparks}</div>
    <p class="muted" style="margin:8px 0 12px">Ultimo: <b style="color:var(--ink)">${fmt2(lastV)}/10</b>. Cada barra es un intento (snapshot). Guardamos los ultimos ${history.length}.</p>
    <div class="row-list">${rows}</div>
  </section>`;
}

// Tendencia por bloque entre los dos ultimos intentos (mejoraste / bajaste).
function trendsCard(subjectId) {
  const trends = blockTrends(subjectId);
  const keys = Object.keys(trends);
  if (!keys.length) return '';
  const arrow = { up: '<b class="t-up">▲ mejoraste</b>', down: '<b class="t-down">▼ bajaste</b>', flat: '<span class="muted">= igual</span>', new: '<span class="muted">nuevo</span>' };
  const rows = keys.map((id) => {
    const t = trends[id];
    return `<div class="list-row" style="cursor:default" data-go="aprender" data-params='{"block":"${escapeHtml(id)}"}'>
      <span><span class="t-title" style="font-size:13px">${escapeHtml(t.label)}</span><span class="t-sub">${fmt2(t.points)}/2</span></span>
      <span class="t-end">${arrow[t.trend] || ''}</span></div>`;
  }).join('');
  return `<section class="card section">
    <div class="card-head"><h2>Tendencia por bloque</h2><span class="muted" style="font-size:12px">ultimo vs anterior</span></div>
    <div class="row-list">${rows}</div></section>`;
}

// Dificultad agregada del store durable: que bloques cuestan mas en promedio (entre todos los intentos).
function difficultyCard(diff) {
  if (!diff || !Array.isArray(diff.blocks) || !diff.blocks.length) {
    return `<section class="card section"><div class="card-head"><h2>Dificultad de los temas</h2></div>
      <p class="muted">Cuando se acumulen intentos vas a ver aca que bloques cuestan mas en promedio. Se arma del dataset de evaluaciones.</p></section>`;
  }
  const rows = diff.blocks.map((b) => {
    const tone = b.avgLost >= 1 ? 'warn' : b.avgLost >= 0.5 ? 'cyan' : 'ok';
    return `<div class="list-row" data-go="aprender" data-params='{"block":"${escapeHtml(b.blockId)}"}'>
      <span><span class="t-title" style="font-size:13px">${escapeHtml(b.label)}</span><span class="t-sub">${b.attempts} intento(s) · falla el ${b.failRate}%</span></span>
      <span class="t-end">${chip('pierde ' + fmt2(b.avgLost) + '/2', tone)}</span></div>`;
  }).join('');
  return `<section class="card section">
    <div class="card-head"><h2>Dificultad de los temas</h2>${chip(diff.attemptsAnalyzed + ' evaluaciones', 'cyan')}</div>
    <p class="muted" style="margin:-4px 0 12px">Promedio de puntos perdidos por bloque entre todos los intentos. Tocá uno para reforzarlo.</p>
    <div class="row-list">${rows}</div></section>`;
}

// Conceptos/errores mas frecuentes (KB) — los que mas conviene dominar.
function topMissesCard(diff) {
  const top = (diff && Array.isArray(diff.topMisses)) ? diff.topMisses : [];
  if (!top.length) return '';
  return `<section class="card section">
    <div class="card-head"><h2>Conceptos que mas cuestan</h2>${chip('mejorados con IA', 'warn')}</div>
    <p class="muted" style="margin:-4px 0 12px">Los errores que mas se repiten. Cada uno ya tiene su explicacion guardada (y mejora con el uso).</p>
    <div class="row-list">
      ${top.map((f) => `<div class="list-row" data-go="aprender" data-params='{"block":"${escapeHtml(f.blockId || '')}"}'>
        <span class="badge amber">${escapeHtml(String(f.occurrenceCount))}</span>
        <span><span class="t-title" style="font-size:13px">${escapeHtml((f.missText || '').slice(0, 90))}</span><span class="t-sub">${escapeHtml(f.blockLabel || f.blockId || '')}${f.reviewStatus === 'ai_improved' ? ' · explicacion mejorada ✦' : ''}</span></span>
        <span class="t-end">x${escapeHtml(String(f.occurrenceCount))}</span></div>`).join('')}
    </div></section>`;
}
