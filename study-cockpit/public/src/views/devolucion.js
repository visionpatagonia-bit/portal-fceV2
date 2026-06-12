import { escapeHtml, fmt2, statusLabel, statusTone } from '../format.js';
import { donut, bars } from '../components/charts.js';
import { errorState, emptyState, $, delegate, chip } from '../components/ui.js';
import { FE, track, getSessionId } from '../telemetry.js';
import * as fb from '../firebase.js';
import { buildReview, saveReview } from '../adaptive-review.js';
import { reviewLinkFor } from '../review-links.js';
import { tutorButtons, wireTutor, userState, precacheAnalogy } from '../tutor.js';
import { ledgerVisual } from './render-blocks.js';
import { getHistory } from '../progress.js';

// ADR-001 (B-UI): la Devolucion es de SESION, no de un solo intento. Una sesion = N intentos (un
// intento normal = sesion de 1; un simulacro = sesion de N temas). Principio de loop: NINGUNA pantalla
// es terminal — cada fallo ofrece "Repasar esto ahora" (-> Aprender de ese bloque) y al volver la sesion
// sigue intacta (vive en store.lastSession, que sobrevive la navegacion). El motor sigue siendo el unico
// que puntua; aca solo se organiza y muestra lo que ya decidio por intento.
function sessionFor(st, subject) {
  if (st.lastSession && st.lastSession.subjectId === subject.id && Array.isArray(st.lastSession.attempts) && st.lastSession.attempts.length) {
    return st.lastSession;
  }
  // Compat: si no hay sesion explicita, envolver el ultimo score como sesion de 1.
  if (st.lastScore && st.lastScoreSubject === subject.id) {
    return { subjectId: subject.id, mode: st.lastMode || 'practice', attempts: [{
      label: subject.name, result: st.lastScore, answers: st.lastAnswers || {}, jol: st.lastJOL || {},
      prediction: st.lastPrediction, sessionId: st.lastSessionId, attemptId: st.lastAttemptId, mode: st.lastMode || 'practice'
    }] };
  }
  return null;
}

export async function render(root, ctx) {
  const { store, data, api, toast } = ctx;
  await data.ensureSubjects();
  const subject = data.activeSubject();
  const st = store.get();
  const session = sessionFor(st, subject);

  if (!session) {
    root.innerHTML = `
      <div class="view-head"><div><p class="eyebrow">Devolucion</p><h1>Todavia no hay correccion</h1></div></div>
      ${emptyState('Sin intento corregido', `Resolve un intento de ${subject.name} y la devolucion te va a mostrar fuertes, debiles y que reforzar.`,
        '<button class="btn btn-primary" data-go="evaluar">Rendir intento</button>')}`;
    return;
  }

  // Contrato (para la cuenta T visual #8 + revision semantica): trae los rows de los bloques debe_haber.
  const contract = await data.ensureContract(subject.folder).catch(() => null);
  const multi = session.attempts.length > 1;

  root.innerHTML = `
    <div class="view-head">
      <div><p class="eyebrow">Devolucion · ${escapeHtml(subject.name)}${multi ? ' · sesión de ' + session.attempts.length + ' temas' : ''}</p><h1>Que estudiar despues ${multi ? 'de la sesión' : 'del intento'}</h1></div>
      <button class="btn" data-go="evaluar">${multi ? 'Nuevo simulacro' : 'Volver a intentar'}</button>
    </div>
    ${multi ? sessionHeader(session) : ''}
    <div id="attempts">
      ${session.attempts.map((a, i) => {
        const ws = (a.result.gaps && a.result.gaps.length) ? a.result.gaps : (a.result.weaknesses || []);
        return multi
          ? `<details class="card section att-acc" id="att_${i}" ${i === 0 ? 'open' : ''} style="padding:0">
               <summary style="cursor:pointer;padding:16px 18px;list-style:none;display:flex;justify-content:space-between;gap:10px;align-items:center">
                 <span><b>${escapeHtml(a.label || ('Tema ' + (i + 1)))}</b> <span class="muted" style="font-size:13px">· nota ${fmt2(a.result.notaEstimada ?? a.result.total)}</span></span>
                 ${chip(ws.length ? ws.length + ' a reforzar' : 'ok', ws.length ? 'warn' : 'ok')}
               </summary>
               <div class="att-body" style="padding:0 18px 18px">${attemptBodyHTML(a, subject, contract, true)}</div>
             </details>`
          : `<div id="att_${i}">${attemptBodyHTML(a, subject, contract, false)}</div>`;
      }).join('')}
    </div>

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

  // Wiring POR INTENTO, scopeado al container del acordeon/bloque (delegates idempotentes por container;
  // loadFailExplanations consulta dentro de su container -> sin colisiones entre temas con el mismo blockId).
  session.attempts.forEach((a, i) => {
    const cont = root.querySelector('#att_' + i);
    if (cont) wireAttempt(cont, ctx, subject, a, contract, i);
  });

  // Calibracion a nivel SESION: usa el promedio de notas estimadas.
  const estimated = session.attempts.reduce((s, a) => s + (a.result.notaEstimada ?? a.result.total), 0) / session.attempts.length;
  $('#saveGrade', root).addEventListener('click', async (e) => {
    const raw = $('#realGrade', root).value.trim();
    const grade = Number(raw.replace(',', '.'));
    if (!Number.isFinite(grade) || grade < 0 || grade > 10) { toast('Ingresa una nota entre 0 y 10', 'bad'); return; }
    e.target.disabled = true;
    const sessionId = st.lastSessionId || getSessionId();
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

// Header agregado de la sesion (solo multi): promedio, gap tecnico-vs-nota, debilidades cross-tema,
// calibracion JOL global, tabla por tema, y el CTA "Repasar lo mas flojo" (cierre de loop a nivel sesion).
function sessionHeader(session) {
  const A = session.attempts;
  const notaOf = (r) => (r.notaEstimada != null ? r.notaEstimada : r.total);
  const avgNota = A.reduce((s, a) => s + notaOf(a.result), 0) / A.length;
  const avgTec = A.reduce((s, a) => s + (a.result.total || 0), 0) / A.length;
  const gap = Math.max(0, avgTec - avgNota);
  // Debilidades cross-tema: agrupadas por blockId (cuantos temas lo fallaron + puntos perdidos).
  const wmap = {};
  A.forEach((a) => {
    const ws = (a.result.gaps && a.result.gaps.length) ? a.result.gaps : (a.result.weaknesses || []);
    ws.forEach((w) => {
      const e = wmap[w.blockId] || (wmap[w.blockId] = { blockId: w.blockId, label: w.label, n: 0, lost: 0 });
      e.n += 1; e.lost += (w.pointsLost || 0);
    });
  });
  const cross = Object.values(wmap).sort((x, y) => (y.n - x.n) || (y.lost - x.lost)).slice(0, 4);
  // Calibracion JOL global de la sesion.
  let cal = 0, over = 0, under = 0, jtotal = 0;
  A.forEach((a) => {
    Object.entries(a.jol || {}).forEach(([bid, level]) => {
      const b = (a.result.blocks || {})[bid]; if (!b) return;
      const max = b.maxPoints != null ? b.maxPoints : 2;
      const ratio = max > 0 ? (b.points || 0) / max : 0;
      const actRank = ratio >= 0.8 ? 2 : (ratio >= 0.5 ? 1 : 0);
      const confRank = { flojo: 0, medio: 1, seguro: 2 }[level];
      jtotal++;
      if (confRank === actRank) cal++; else if (confRank > actRank) over++; else under++;
    });
  });
  const top = cross[0];
  return `<section class="card">
    <div class="score-hero">
      ${donut(avgNota, 10, 'Nota promedio')}
      <div class="meta">
        <div class="status">Sesión de ${A.length} temas · cubriste toda la materia</div>
        <div class="calib-strip" role="group" aria-label="Calibracion de la sesion" style="margin-top:8px">
          <div class="cs"><span>Promedio técnico</span><b>${fmt2(avgTec)}</b><small>dominio</small></div>
          <div class="op" aria-hidden="true">−</div>
          <div class="cs"><span>Margen</span><b>${fmt2(gap)}</b><small>conservador</small></div>
          <div class="op" aria-hidden="true">=</div>
          <div class="cs hot"><span>Nota promedio</span><b>${fmt2(avgNota)}</b><small>estimada</small></div>
        </div>
        ${jtotal ? `<p class="muted" style="margin-top:10px">Calibración (tu confianza vs lo real): ${chip(cal + ' calibrado', 'ok')} ${over ? chip(over + ' sobreconfianza', 'warn') : ''} ${under ? chip(under + ' te subestimaste', 'cyan') : ''}</p>` : ''}
        ${cross.length ? `<p class="muted" style="margin-top:10px">A reforzar en la sesión: ${cross.map((c) => `<b style="color:var(--ink)">${escapeHtml(c.label || c.blockId)}</b>${c.n > 1 ? ` (${c.n} temas)` : ''}`).join(' · ')}</p>` : '<p class="muted" style="margin-top:10px">Sin huecos dominantes en la sesión 🎯</p>'}
        ${top ? `<div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" data-go="aprender" data-params='${escapeHtml(JSON.stringify({ block: top.blockId, gen: '1' }))}'>Repasar lo más flojo: ${escapeHtml(top.label || top.blockId)}</button></div>` : ''}
      </div>
    </div>
    <div class="divider"></div>
    <table class="dh-table"><thead><tr><th>Tema</th><th>Técnico</th><th>Nota</th></tr></thead><tbody>
    ${A.map((a) => `<tr><td>${escapeHtml(a.label || '')}</td><td>${fmt2(a.result.total)}</td><td>${fmt2(notaOf(a.result))}</td></tr>`).join('')}
    </tbody></table>
    <p class="muted" style="margin-top:8px">Cada tema, abajo, tiene su devolución completa: qué fallaste, la respuesta modelo y el botón para repasarlo. Al volver de Aprender, esta sesión sigue acá.</p>
  </section>`;
}

// Devuelve la clave (grading.input) si el bloque es de texto y el alumno escribio algo; si no, null.
function semInputFor(attempt, contract, blockId) {
  if (!contract || !attempt.answers) return null;
  const mode = attempt.mode || 'practice';
  const blocks = (mode === 'hard' && contract.hard && Array.isArray(contract.hard.blocks)) ? contract.hard.blocks : (contract.blocks || []);
  const b = blocks.find((x) => x.id === blockId);
  const t = b && b.grading && b.grading.type;
  if (t !== 'text' && t !== 'text_family') return null;
  const input = (b.grading.input) || b.id;
  const a = attempt.answers[input];
  return (typeof a === 'string' && a.trim().length > 3) ? input : null;
}

// HTML de la devolucion de UN intento. compact=true para el cuerpo de un acordeon (sin hero grande).
function attemptBodyHTML(attempt, subject, contract, compact) {
  const result = attempt.result;
  const weaknesses = (result.gaps && result.gaps.length) ? result.gaps : (result.weaknesses || []);
  const recoverable = result.pointsRecoverable != null ? result.pointsRecoverable : weaknesses.reduce((s, w) => s + (w.pointsLost || 0), 0);
  const hero = compact
    ? `<div style="padding-top:14px">${calibStrip(result)}</div>`
    : `<section class="card">
        <div class="score-hero">
          ${donut(result.notaEstimada ?? result.total, 10, 'Nota estimada')}
          <div class="meta">
            <div class="status">${escapeHtml(statusLabel(result.estimatedStatus || result.status))}</div>
            ${calibStrip(result)}
            ${(attempt.prediction != null) ? (() => {
              const nota = result.notaEstimada ?? result.total; const d = nota - attempt.prediction;
              const close = Math.abs(d) <= 0.5; const over = d < -0.5;
              return `<div class="recover-banner" style="margin-top:10px">🎯 Predijiste <b>${attempt.prediction.toFixed(1)}</b> · el motor estima <b>${(nota).toFixed(2)}</b> · ${close ? 'calibración buena ✓' : (over ? `<b>sobreconfianza</b> (creíste ${Math.abs(d).toFixed(1)} de más)` : `te subestimaste (+${Math.abs(d).toFixed(1)})`)}</div>`;
            })() : ''}
            <div class="hero-status" style="margin-top:10px">
              ${chip('Confianza ' + (result.confidence || 'baja'), 'warn')}
              ${chip(weaknesses.length ? `${weaknesses.length} bloque(s) a reforzar` : 'Sin huecos dominantes', weaknesses.length ? 'warn' : 'ok')}
            </div>
            <p class="muted" style="margin-top:10px">${escapeHtml(result.calibrationNote || 'Estimacion conservadora; no es nota garantizada.')}</p>
            <p class="muted" style="margin-top:6px">${escapeHtml(result.nextMission || '')}</p>
            <div class="btn-row" style="margin-top:12px">
              ${weaknesses.length
                ? `<button class="btn btn-primary" data-go="aprender" data-params='${escapeHtml(JSON.stringify({ block: weaknesses[0].blockId, gen: '1' }))}'>Repasar esto ahora: ${escapeHtml(weaknesses[0].label)}</button>`
                : `<button class="btn btn-primary" data-go="evaluar">Simular variante nueva</button>`}
            </div>
            ${weaknesses.length ? `<p class="muted" data-review-saved style="margin-top:10px"></p>` : ''}
          </div>
        </div>
        <div class="divider"></div>
        ${bars(Object.entries(result.blocks).map(([k, b]) => ({ label: b.label || k, value: b.points, max: 2, weak: b.points < 1.35, miss: (b.misses || [])[0] })))}
      </section>`;
  return `
    ${hero}
    ${microRoutingCard(result, getHistory(subject.id))}
    ${correctionDetail(result, attempt.jol || {})}
    ${ledgerSection(result, contract, attempt.answers, attempt.mode)}
    <section class="card section">
      <div class="card-head"><h2>Que te fue mal y como recuperarlo</h2>${weaknesses.length ? `${chip('recuperas hasta ' + fmt2(recoverable) + ' pts', 'warn')}<button class="btn btn-sm" data-refresh-fails>Actualizar explicaciones</button>` : ''}</div>
      ${weaknesses.length ? `<p class="muted" data-fails-note style="margin:-4px 0 12px">Cada punto que dejaste, con su explicacion y la respuesta modelo. Tocá <b>Repasar esto ahora</b> para ir directo a reaprender ese tema.</p>` : ''}
      ${weaknesses.length ? weaknesses.map((w) => weakRow(w, semInputFor(attempt, contract, w.blockId))).join('')
        : `<p class="muted">Sin huecos en este tema. 🎯</p>`}
    </section>`;
}

// Wiring de un intento, scopeado a su container. Delegates idempotentes por container; loadFailExplanations
// consulta dentro del container (los #ids pasaron a data-* para no colisionar entre temas).
function wireAttempt(container, ctx, subject, attempt, contract, i) {
  const result = attempt.result;
  const weaknesses = (result.gaps && result.gaps.length) ? result.gaps : (result.weaknesses || []);
  wireTutor(container, ctx, subject);
  // #10 Shadow prompting: precachea la analogia del gap #1 SOLO del primer intento (cuida cuota Gemini).
  const st = ctx.store.get();
  const llmOk = st.health && st.health.llm && (typeof st.health.llm === 'object' ? st.health.llm.configured : st.health.llm !== 'not_configured');
  if (i === 0 && llmOk && weaknesses[0]) precacheAnalogy(ctx, subject, weaknesses[0].blockId, weaknesses[0].label || '');

  if (!container.__devolucionWired) {
    container.__devolucionWired = true;
    // #6 Revision semantica advisory: lee tu redaccion y orienta, NO cambia la nota.
    delegate(container, '[data-semantic]', 'click', async (_e, el) => {
      const subj = ctx.data.activeSubject(); if (!subj) return;
      const blockId = el.dataset.semantic;
      const input = el.dataset.input;
      const answer = (attempt.answers || {})[input] || '';
      const slot = el.closest('.weak-row') && el.closest('.weak-row').querySelector('.semantic-slot');
      if (slot) slot.innerHTML = '<div class="inline-load" style="margin-top:8px"><span class="spinner"></span>Revisando tu redaccion...</div>';
      try {
        const r = await ctx.api.semanticFeedback({ subjectId: subj.id, blockId, studentAnswer: answer, mode: attempt.mode || 'practice', userState: userState(subj.id) });
        if (slot) slot.innerHTML = `<div class="tutor-msg" style="margin-top:8px"><span class="tutor-flag">Revision semantica · no cambia tu nota</span><p>${escapeHtml(r.feedback || '')}</p></div>`;
      } catch (_) { if (slot) slot.innerHTML = '<p class="muted" style="margin-top:8px">No se pudo revisar ahora. Reintenta en unos segundos.</p>'; }
    });
    delegate(container, '[data-weakness-study]', 'click', (_e, el) => {
      const subj = ctx.data.activeSubject();
      track(FE.STUDY_WEAKNESS_CLICK, { blockId: el.dataset.weaknessStudy }, subj && subj.id);
    });
    // #6 Self-explanation gate (ICAP): explicar el fallo ANTES de ver la respuesta modelo. No toca la nota.
    const MIN_SELFEXP = 40;
    delegate(container, '.selfexp-text', 'input', (_e, el) => {
      const gate = el.closest('.selfexp-gate'); if (!gate) return;
      const n = el.value.trim().length;
      const btn = gate.querySelector('.selfexp-reveal');
      const hint = gate.querySelector('.selfexp-hint');
      if (btn) btn.disabled = n < MIN_SELFEXP;
      if (hint) hint.textContent = n < MIN_SELFEXP
        ? `Escribí al menos ${MIN_SELFEXP} caracteres para desbloquear · ${n}/${MIN_SELFEXP}`
        : '✓ Listo para revelar — tu explicación queda registrada (no cambia la nota).';
    });
    delegate(container, '.selfexp-reveal', 'click', (_e, el) => {
      const row = el.closest('.weak-row'); const gate = el.closest('.selfexp-gate'); if (!row || !gate) return;
      if (el.disabled) return;
      const blockId = gate.dataset.selfexp;
      const ta = gate.querySelector('.selfexp-text');
      const text = (ta && ta.value) || '';
      const model = row.querySelector('.model-slot');
      if (model) { model.hidden = false; if (!model.innerHTML.trim()) model.innerHTML = '<p class="muted">Generando la respuesta modelo… aparece en unos segundos.</p>'; }
      if (ta) ta.readOnly = true;
      gate.style.opacity = '.7';
      el.disabled = true; el.textContent = 'Respuesta modelo revelada ✓';
      const subj = ctx.data.activeSubject();
      try {
        const cur = ctx.store.get().selfExplanations || {};
        cur[`${subj.id}:${blockId}`] = { text, at: Date.now() };
        ctx.store.set({ selfExplanations: cur });
      } catch (_) {}
      track('fe_self_explanation', { blockId, len: text.trim().length }, subj && subj.id);
    });
  }

  // Explicaciones de fallo (KB persistente) + repaso adaptativo guardado, scopeado a este intento.
  if (weaknesses.length) {
    const attemptId = attempt.attemptId || null;
    const studyBlocks = {};
    Promise.all(weaknesses.map(async (w) => {
      try { studyBlocks[w.blockId] = await ctx.data.ensureBlock(subject.id, w.blockId); } catch (_) { studyBlocks[w.blockId] = null; }
    })).then(() => {
      try {
        const review0 = saveReview(subject.id, buildReview({ subjectId: subject.id, attemptId, result, explanations: [], studyBlocks }));
        fb.saveAdaptiveReview({ subjectId: subject.id, review: review0 });
      } catch (_) {}
      const savedEl = container.querySelector('[data-review-saved]');
      if (savedEl) savedEl.innerHTML = `Tu <b style="color:var(--magenta-2)">repaso adaptativo</b> quedo guardado en <a href="#/aprender" style="color:var(--cyan)">Aprender</a>.`;
      loadFailExplanations(container, ctx, subject, result, 0, null, studyBlocks);
      const rb = container.querySelector('[data-refresh-fails]');
      if (rb) rb.addEventListener('click', () => loadFailExplanations(container, ctx, subject, result, 0, rb, studyBlocks));
    });
  }
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

// #2 JOL vs resultado real: compara la confianza declarada (antes de corregir) con lo que pasó de
// verdad en el bloque, para hacer visible la sobreconfianza/subestimación POR TEMA (calibración local).
function jolVsActual(level, b) {
  if (!level) return '';
  const max = b.maxPoints != null ? b.maxPoints : 2;
  const ratio = max > 0 ? (b.points || 0) / max : 0;
  const actual = ratio >= 0.8 ? 'high' : (ratio >= 0.5 ? 'mid' : 'low');
  const confLabel = { flojo: 'Inseguro', medio: 'Más o menos', seguro: 'Seguro' }[level] || level;
  const actLabel = { high: 'bien', mid: 'a medias', low: 'flojo' }[actual];
  const confRank = { flojo: 0, medio: 1, seguro: 2 }[level];
  const actRank = { low: 0, mid: 1, high: 2 }[actual];
  let verdict; let tone;
  if (confRank === actRank) { verdict = 'calibrado ✓'; tone = 'ok'; }
  else if (confRank > actRank) { verdict = 'sobreconfianza'; tone = 'warn'; }
  else { verdict = 'te subestimaste'; tone = 'cyan'; }
  return `<p class="muted" style="margin:2px 0 8px;font-size:12.5px">Tu confianza antes de corregir: <b style="color:var(--ink)">${confLabel}</b> · resultado real: <b style="color:var(--ink)">${actLabel}</b> → ${chip(verdict, tone)}</p>`;
}

// Detalle por bloque: que sumo (verde, hits) y que falto/estuvo mal (rojo, misses) + calibración JOL.
function correctionDetail(result, jol = {}) {
  const rows = Object.entries(result.blocks || {}).map(([id, b]) => {
    const hits = (b.hits || []).map((h) => `<li class="ok">✓ ${escapeHtml(h)}</li>`).join('');
    const misses = (b.misses || []).map((m) => `<li class="bad">✗ ${escapeHtml(m)}</li>`).join('');
    if (!hits && !misses) return '';
    return `<div class="corr-block">
      <h4><span>${escapeHtml(b.label || id)}</span><span class="sc">${fmt2(b.points)}/2</span></h4>
      ${jolVsActual(jol[id], b)}
      <ul class="corr-list">${hits}${misses}</ul>
    </div>`;
  }).filter(Boolean).join('');
  if (!rows) return '';
  return `<section class="card section">
    <div class="card-head"><h2>Detalle de la correccion</h2>${chip('verde sumo · rojo falto', 'cyan')}</div>
    <p class="muted" style="margin:-4px 0 12px">Lo que sumo (verde) y lo que falto o estuvo mal (rojo) en cada bloque. Asi ves exactamente donde ganaste y donde perdiste puntos.</p>
    ${rows}
  </section>`;
}

// #4 Micro-ruteo: si un bloque viene fallando en varios intentos, suspende el "reintentar mas" y
// redirige a la BASE TEORICA (y al quiz de recall de Aprender) antes de seguir gastando intentos.
function microRoutingCard(result, history) {
  const gaps = (result.gaps && result.gaps.length) ? result.gaps : (result.weaknesses || []);
  if (!gaps.length || !history || history.length < 2) return '';
  const recent = history.slice(-3);
  const count = {};
  recent.forEach((h) => (h.weaknesses || []).forEach((bid) => { count[bid] = (count[bid] || 0) + 1; }));
  const candidate = gaps
    .map((g) => ({ blockId: g.blockId, label: g.label, n: count[g.blockId] || 0 }))
    .filter((x) => x.n >= 2)
    .sort((a, b) => b.n - a.n)[0];
  if (!candidate) return '';
  return `<section class="card section micro-route">
    <div class="card-head"><h2>Diagnostico de base</h2>${chip('fallaste esto ' + candidate.n + ' veces', 'warn')}</div>
    <p class="muted" style="margin:-4px 0 12px">Venis fallando <b style="color:var(--ink)">${escapeHtml(candidate.label || candidate.blockId)}</b> en varios intentos. Reintentar el parcial sin consolidar la base no va a mover la nota: primero volve a la teoria y rehace el quiz de recall de ese bloque.</p>
    <div class="btn-row">
      <button class="btn btn-primary" data-go="aprender" data-params='${escapeHtml(JSON.stringify({ block: candidate.blockId }))}'>Consolidar la base: ${escapeHtml(candidate.label || candidate.blockId)}</button>
    </div>
  </section>`;
}

// #8 Asientos (cuenta T): para cada bloque debe_haber, el modelo correcto + tu intento + el desbalance.
function ledgerSection(result, contract, lastAnswers, lastMode) {
  if (!contract) return '';
  const blocks = (lastMode === 'hard' && contract.hard && Array.isArray(contract.hard.blocks)) ? contract.hard.blocks : (contract.blocks || []);
  const dh = blocks.filter((b) => b.grading && (b.grading.type === 'debe_haber' || b.grading.type === 'ledger_entry'));
  if (!dh.length) return '';
  const cards = dh.map((b) => {
    const rb = (result.blocks || {})[b.id];
    if (!rb) return '';
    const ans = lastAnswers && lastAnswers[(b.grading.input) || b.id];
    const studentByRow = {};
    if (ans && Array.isArray(ans.rows)) ans.rows.forEach((r) => { if (r && r.id != null) studentByRow[r.id] = r; });
    const hasStudent = Object.keys(studentByRow).length > 0;
    return `<div class="ledger-card">
      <h4 style="display:flex;justify-content:space-between;gap:10px"><span>${escapeHtml(b.label || b.id)}</span><span class="sc">${fmt2(rb.points)}/${fmt2(rb.maxPoints != null ? rb.maxPoints : 2)}</span></h4>
      ${ledgerVisual(b.grading.rows || [], hasStudent ? studentByRow : null)}</div>`;
  }).filter(Boolean).join('');
  if (!cards) return '';
  return `<section class="card section">
    <div class="card-head"><h2>Asientos: modelo vs tu intento</h2>${chip('verde ok · rojo error', 'cyan')}</div>
    <p class="muted" style="margin:-4px 0 12px">El asiento correcto y, al lado, lo que cargaste. De un vistazo ves donde pusiste mal el monto o el lado, y si te balancea.</p>
    ${cards}</section>`;
}

function weakRow(w, semanticInput) {
  const params = JSON.stringify({ block: w.blockId });
  const paramsGen = JSON.stringify({ block: w.blockId, gen: '1' });
  const mx = w.maxPoints != null ? w.maxPoints : 2;
  const recover = w.pointsLost != null ? `${chip('recuperas ' + fmt2(w.pointsLost) + ' pts', 'warn')}` : '';
  return `<div class="weak-row" data-weak-block="${escapeHtml(w.blockId)}">
    <h3><span>${escapeHtml(w.label)}</span><span style="display:flex;gap:8px;align-items:center">${recover}<span class="sc">${fmt2(w.score)}/${fmt2(mx)}</span></span></h3>
    <div class="fail-slot">
      <ul>${(w.misses || []).length ? w.misses.map((m) => `<li>${escapeHtml(m)}</li>`).join('') : '<li class="muted">Sin faltantes principales.</li>'}</ul>
    </div>
    <div class="selfexp-gate" data-selfexp="${escapeHtml(w.blockId)}" style="margin:10px 0;padding:12px 14px;border:1px dashed var(--cyan);border-radius:10px;background:rgba(41,229,229,.06)">
      <label class="field" style="margin:0"><span>🧠 Antes de ver la respuesta modelo — explicá con tus palabras por qué perdiste estos puntos y cuál es el razonamiento correcto.</span>
        <textarea class="input selfexp-text" rows="3" placeholder="Lo escribís de memoria: ese esfuerzo de recuperar es el que fija el aprendizaje (testing effect)."></textarea></label>
      <div class="btn-row" style="margin-top:8px;align-items:center;gap:10px">
        <button class="btn btn-sm btn-primary selfexp-reveal" disabled>Ver respuesta modelo</button>
        <span class="muted selfexp-hint">Escribí al menos 40 caracteres para desbloquear · 0/40</span>
      </div>
    </div>
    <div class="model-slot" hidden></div>
    <div class="btn-row">
      <button class="btn btn-primary btn-sm" data-go="aprender" data-params='${escapeHtml(params)}' data-weakness-study="${escapeHtml(w.blockId)}">🔁 Repasar esto ahora</button>
      <button class="btn btn-sm" data-go="aprender" data-params='${escapeHtml(paramsGen)}'>Generar practica similar</button>
      ${semanticInput ? `<button class="btn btn-sm btn-soft" data-semantic="${escapeHtml(w.blockId)}" data-input="${escapeHtml(semanticInput)}">Revision semantica (no cambia la nota)</button>` : ''}
      <button class="btn btn-sm" data-go="evaluar">Volver a intentar</button>
    </div>
    ${semanticInput ? '<div class="semantic-slot"></div>' : ''}
  </div>`;
}

async function loadFailExplanations(root, ctx, subject, result, attempt = 0, btn = null, studyBlocks = {}) {
  // Pide explicaciones para TODOS los gaps (todo punto perdido), no solo las debilidades por umbral.
  const weaknesses = (result.gaps && result.gaps.length) ? result.gaps : (result.weaknesses || []);
  const items = [];
  weaknesses.forEach((w) => (w.misses || []).forEach((m) => items.push({ blockId: w.blockId, missText: m })));
  if (!items.length) return;
  if (btn) { btn.disabled = true; btn.textContent = 'Actualizando...'; }
  let resp;
  try { resp = await ctx.api.failExplanationsLookup({ subjectId: subject.id, items }); }
  catch { if (btn) { btn.disabled = false; btn.textContent = 'Actualizar explicaciones'; } return; }

  // Dedup por fingerprint: misses distintos pueden colapsar en la misma explicacion (ej "b1 sin
  // justificar" y "b3 sin justificar" comparten clave); no mostrar la tarjeta repetida.
  const byBlock = {};
  const seen = new Set();
  (resp.explanations || []).filter((e) => e.explanation).forEach((e) => {
    const fp = e.fingerprint || (e.blockId + '|' + ((e.explanation && e.explanation.tituloFalla) || e.missText || ''));
    if (seen.has(fp)) return;
    seen.add(fp);
    (byBlock[e.blockId] = byBlock[e.blockId] || []).push(e);
  });
  // Actualiza el repaso adaptativo guardado con las correcciones ya disponibles en la KB.
  try {
    const rev = saveReview(subject.id, buildReview({ subjectId: subject.id, attemptId: ctx.store.get().lastAttemptId || null, result, explanations: resp.explanations || [], studyBlocks }));
    fb.saveAdaptiveReview({ subjectId: subject.id, review: rev });
  } catch (_) {}
  let covered = 0;
  root.querySelectorAll('.weak-row[data-weak-block]').forEach((row) => {
    const list = byBlock[row.dataset.weakBlock];
    // #6 ICAP: la respuesta modelo va al .model-slot (gateado por la auto-explicacion); los misses del
    // alumno quedan visibles en .fail-slot. Si el alumno ya revelo el gate, mostramos el modelo al toque.
    const slot = row.querySelector('.model-slot');
    if (list && list.length && slot) { slot.innerHTML = list.map((e) => failCard(e, studyBlocks[row.dataset.weakBlock])).join(''); covered += list.length; }
  });

  const note = root.querySelector('[data-fails-note]');
  if (btn) { btn.disabled = false; btn.textContent = 'Actualizar explicaciones'; }
  if (covered < items.length) {
    if (note) note.textContent = 'Generando explicaciones de tus errores nuevos... se actualizan solas en unos segundos.';
    if (attempt < 1) setTimeout(() => loadFailExplanations(root, ctx, subject, result, attempt + 1, null, studyBlocks), 12000);
  } else if (note) {
    note.textContent = 'Cada error explicado y guardado: los errores comunes ya quedan listos al instante para todos.';
  }
}

function failCard(e, studyBlock) {
  const x = e.explanation || {};
  const flag = e.source === 'gemini'
    ? '<span class="ai-flag">★ explicado por IA</span>'
    : '<span class="ai-flag" style="color:var(--cyan)">⚙ del contrato</span>';
  const link = reviewLinkFor(e.blockId, e.missText || x.tituloFalla || '', studyBlock);
  return `<div class="fail-card">
    <strong>${escapeHtml(x.tituloFalla || e.missText || 'Punto a reforzar')}</strong>
    <p>${escapeHtml(x.textoPedagogico || '')}</p>
    ${x.respuestaModelo ? `<p class="model-answer"><b>Respuesta modelo:</b> ${escapeHtml(x.respuestaModelo)}</p>` : ''}
    ${x.proximoPaso ? `<span class="trigger">→ ${escapeHtml(x.proximoPaso)}</span>` : ''}
    ${reviewActions(link)}
    ${tutorButtons({ blockId: e.blockId, concept: x.tituloFalla || e.missText || '', missText: e.missText || '' })}
    ${flag}
  </div>`;
}

// Acciones de reestudio derivadas del reviewLink determinista: llevan al alumno a COMO reaprender
// (teoria concreta, resolucion paso a paso) y a practicar ese error. Reusa el router data-go/params.
function reviewActions(link) {
  if (!link || !link.block) return '';
  const btn = (params, label) => `<button class="btn btn-sm" data-go="aprender" data-params='${escapeHtml(JSON.stringify(params))}'>${escapeHtml(label)}</button>`;
  const out = [];
  if (link.worked) out.push(btn({ block: link.block, section: 'worked-example' }, link.label || 'Ver resolucion paso a paso'));
  else if (link.concept) out.push(btn({ block: link.block, concept: link.concept }, link.label || 'Ver teoria'));
  else out.push(btn({ block: link.block }, link.label || 'Estudiar el bloque'));
  out.push(btn({ block: link.block, gen: '1' }, 'Practicar este error'));
  return `<div class="btn-row review-actions" style="margin-top:8px">${out.join('')}</div>`;
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
