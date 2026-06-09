import { escapeHtml, fmt2, statusLabel, statusTone } from '../format.js';
import { donut, bars } from '../components/charts.js';
import { errorState, emptyState, $, delegate, chip } from '../components/ui.js';
import { FE, track, getSessionId } from '../telemetry.js';
import * as fb from '../firebase.js';

export async function render(root, ctx) {
  const { store, data, api, toast } = ctx;
  await data.ensureSubjects();
  const subject = data.activeSubject();
  const st = store.get();
  const result = (st.lastScore && st.lastScoreSubject === subject.id) ? st.lastScore : null;

  if (!result) {
    root.innerHTML = `
      <div class="view-head"><div><p class="eyebrow">Devolucion</p><h1>Todavia no hay correccion</h1></div></div>
      ${emptyState('Sin intento corregido', `Resolve un intento de ${subject.name} y la devolucion te va a mostrar fuertes, debiles y que reforzar.`,
        '<button class="btn btn-primary" data-go="evaluar">Rendir intento</button>')}`;
    return;
  }

  const weaknesses = result.weaknesses || [];
  root.innerHTML = `
    <div class="view-head">
      <div><p class="eyebrow">Devolucion · ${escapeHtml(subject.name)}</p><h1>Que estudiar despues del intento</h1></div>
      <button class="btn" data-go="evaluar">Volver a intentar</button>
    </div>

    <section class="card">
      <div class="score-hero">
        ${donut(result.notaEstimada ?? result.total, 10, 'Nota estimada')}
        <div class="meta">
          <div class="status">${escapeHtml(statusLabel(result.estimatedStatus || result.status))}</div>
          ${calibStrip(result)}
          <div class="hero-status" style="margin-top:10px">
            ${chip('Confianza ' + (result.confidence || 'baja'), 'warn')}
            ${chip(weaknesses.length ? `${weaknesses.length} bloque(s) a reforzar` : 'Sin huecos dominantes', weaknesses.length ? 'warn' : 'ok')}
          </div>
          <p class="muted" style="margin-top:10px">${escapeHtml(result.calibrationNote || 'Estimacion conservadora; no es nota garantizada.')}</p>
          <p class="muted" style="margin-top:6px">${escapeHtml(result.nextMission || '')}</p>
        </div>
      </div>
      <div class="divider"></div>
      ${bars(Object.entries(result.blocks).map(([k, b]) => ({ label: b.label || k, value: b.points, max: 2, weak: b.points < 1.35, miss: (b.misses || [])[0] })))}
    </section>

    <section class="card section">
      <div class="card-head"><h2>Foco posterior</h2></div>
      ${weaknesses.length ? weaknesses.map((w) => weakRow(w)).join('')
        : `<p class="muted">No hay un hueco dominante. El siguiente paso es simular una variante nueva.</p>
           <div class="btn-row" style="margin-top:10px"><button class="btn btn-primary" data-go="evaluar">Simular variante</button></div>`}
    </section>

    <section class="card section">
      <div class="card-head"><h2>Calibracion: tu nota real</h2></div>
      <p class="muted" style="margin-bottom:12px">Cuando tengas la nota real del parcial, registrala. La metrica norte es que el score estimado caiga dentro de ±1 punto.</p>
      <div class="btn-row" style="align-items:end">
        <label class="field" style="max-width:160px"><span>Nota real (0-10)</span><input class="input" id="realGrade" inputmode="decimal" placeholder="Ej: 8.5"></label>
        <button class="btn btn-soft" id="saveGrade">Registrar nota</button>
      </div>
      <div id="calibBox" class="section"></div>
    </section>
  `;

  // wiring
  delegate(root, '[data-weakness-study]', 'click', (_e, el) => {
    track(FE.STUDY_WEAKNESS_CLICK, { blockId: el.dataset.weaknessStudy }, subject.id);
  });

  $('#saveGrade', root).addEventListener('click', async (e) => {
    const raw = $('#realGrade', root).value.trim();
    const grade = Number(raw.replace(',', '.'));
    if (!Number.isFinite(grade) || grade < 0 || grade > 10) { toast('Ingresa una nota entre 0 y 10', 'bad'); return; }
    e.target.disabled = true;
    const estimated = result.notaEstimada ?? result.total;
    const sessionId = store.get().lastSessionId || getSessionId();
    const useFb = fb.available() && fb.currentUser();
    try {
      let calibration;
      if (useFb) {
        await fb.saveRealGrade({ subjectId: subject.id, sessionId, realGrade: grade, estimatedScore: estimated });
        calibration = await fb.getCalibration({ subjectId: subject.id });
      } else {
        await api.realGrade({ subjectId: subject.id, sessionId, realGrade: grade });
        calibration = (await api.calibration({ subjectId: subject.id, sessionId })).calibration;
      }
      $('#calibBox', root).innerHTML = calibCard(calibration, estimated, grade);
      toast(useFb ? 'Nota registrada en tu cuenta' : 'Nota registrada (sesion local)', 'ok');
    } catch (err) {
      toast('No se pudo registrar: ' + err.message, 'bad');
      e.target.disabled = false;
    }
  });
}

function calibStrip(result) {
  const tecnico = result.scoreTecnico ?? result.total ?? 0;
  const estimada = result.notaEstimada ?? result.total ?? 0;
  const margen = Math.max(0, tecnico - estimada);
  return `<div class="calib-strip" role="group" aria-label="Calibracion de la nota">
    <div class="cs"><span>Score tecnico</span><b>${fmt2(tecnico)}</b><small>dominio del tema</small></div>
    <div class="op" aria-hidden="true">−</div>
    <div class="cs"><span>Margen</span><b>${fmt2(margen)}</b><small>conservador</small></div>
    <div class="op" aria-hidden="true">=</div>
    <div class="cs hot"><span>Nota estimada</span><b>${fmt2(estimada)}</b><small>prediccion</small></div>
  </div>`;
}

function weakRow(w) {
  const params = JSON.stringify({ block: w.blockId });
  const paramsGen = JSON.stringify({ block: w.blockId, gen: '1' });
  return `<div class="weak-row">
    <h3><span>${escapeHtml(w.label)}</span><span class="sc">${fmt2(w.score)}/2</span></h3>
    <ul>${(w.misses || []).length ? w.misses.map((m) => `<li>${escapeHtml(m)}</li>`).join('') : '<li class="muted">Sin faltantes principales.</li>'}</ul>
    <div class="btn-row">
      <button class="btn btn-primary btn-sm" data-go="aprender" data-params='${escapeHtml(params)}' data-weakness-study="${escapeHtml(w.blockId)}">Estudiar esta debilidad</button>
      <button class="btn btn-sm" data-go="aprender" data-params='${escapeHtml(paramsGen)}'>Generar practica similar</button>
      <button class="btn btn-sm" data-go="evaluar">Volver a intentar</button>
    </div>
  </div>`;
}

function calibCard(c, estimated, real) {
  if (!c) return '';
  const within = Math.abs(estimated - real) <= 1;
  return `<div class="card" style="background:var(--tile)">
    <div class="hero-status" style="margin-top:0">
      ${chip(`Estimado ${fmt2(estimated)}`, 'cyan')}
      ${chip(`Real ${fmt2(real)}`)}
      ${chip(within ? 'Dentro de ±1 ✓' : 'Fuera de ±1', within ? 'ok' : 'warn')}
    </div>
    <p class="muted" style="margin-top:10px">Casos: ${c.totalCases} · dentro de ±1: ${c.withinOnePointCount} · tasa ${c.calibrationWithin1ptRate !== null ? Math.round(c.calibrationWithin1ptRate * 100) + '%' : '—'} (objetivo 70%).</p>
  </div>`;
}
