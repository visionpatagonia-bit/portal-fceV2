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

  // Contrato (para la cuenta T visual #8): trae los rows correctos de los bloques debe_haber.
  const contract = await data.ensureContract(subject.folder).catch(() => null);

  // La devolucion ahora trabaja sobre los GAPS = TODO bloque que perdio puntos (no solo las
  // debilidades por umbral). Asi cada punto recuperable se explica y se puede reforzar (ej un V/F
  // en 1.5 que el umbral ignoraba). Fallback a weaknesses para resultados viejos.
  const weaknesses = (result.gaps && result.gaps.length) ? result.gaps : (result.weaknesses || []);
  const recoverable = result.pointsRecoverable != null
    ? result.pointsRecoverable
    : weaknesses.reduce((s, w) => s + (w.pointsLost || 0), 0);

  // #6: que bloques de TEXTO con respuesta escrita admiten revision semantica advisory. Devuelve la
  // clave (grading.input) si el bloque es de texto y el alumno escribio algo; si no, null.
  const semInput = (blockId) => {
    if (!contract || !st.lastAnswers) return null;
    const blocks = (st.lastMode === 'hard' && contract.hard && Array.isArray(contract.hard.blocks)) ? contract.hard.blocks : (contract.blocks || []);
    const b = blocks.find((x) => x.id === blockId);
    const t = b && b.grading && b.grading.type;
    if (t !== 'text' && t !== 'text_family') return null;
    const input = (b.grading.input) || b.id;
    const a = st.lastAnswers[input];
    return (typeof a === 'string' && a.trim().length > 3) ? input : null;
  };
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
          ${(st.lastPrediction != null) ? (() => {
            const nota = result.notaEstimada ?? result.total; const d = nota - st.lastPrediction;
            const close = Math.abs(d) <= 0.5; const over = d < -0.5;
            return `<div class="recover-banner" style="margin-top:10px">🎯 Predijiste <b>${st.lastPrediction.toFixed(1)}</b> · el motor estima <b>${(nota).toFixed(2)}</b> · ${close ? 'calibración buena ✓' : (over ? `<b>sobreconfianza</b> (creíste ${Math.abs(d).toFixed(1)} de más)` : `te subestimaste (+${Math.abs(d).toFixed(1)})`)}</div>`;
          })() : ''}
          <div class="hero-status" style="margin-top:10px">
            ${chip('Confianza ' + (result.confidence || 'baja'), 'warn')}
            ${chip(weaknesses.length ? `${weaknesses.length} bloque(s) a reforzar` : 'Sin huecos dominantes', weaknesses.length ? 'warn' : 'ok')}
          </div>
          <p class="muted" style="margin-top:10px">${escapeHtml(result.calibrationNote || 'Estimacion conservadora; no es nota garantizada.')}</p>
          <p class="muted" style="margin-top:6px">${escapeHtml(result.nextMission || '')}</p>
          <div class="btn-row" style="margin-top:12px">
            ${weaknesses.length
              ? `<button class="btn btn-primary" data-go="aprender" data-params='${escapeHtml(JSON.stringify({ block: weaknesses[0].blockId, gen: '1' }))}'>Reentrenar ahora: ${escapeHtml(weaknesses[0].label)}</button>`
              : `<button class="btn btn-primary" data-go="evaluar">Simular variante nueva</button>`}
          </div>
          ${weaknesses.length ? `<p class="muted" id="reviewSaved" style="margin-top:10px"></p>` : ''}
        </div>
      </div>
      <div class="divider"></div>
      ${bars(Object.entries(result.blocks).map(([k, b]) => ({ label: b.label || k, value: b.points, max: 2, weak: b.points < 1.35, miss: (b.misses || [])[0] })))}
    </section>

    ${microRoutingCard(result, getHistory(subject.id))}
    ${correctionDetail(result)}
    ${ledgerSection(result, contract, st.lastAnswers, st.lastMode)}

    <section class="card section">
      <div class="card-head"><h2>Que te fue mal y como recuperarlo</h2>${weaknesses.length ? `${chip('recuperas hasta ' + fmt2(recoverable) + ' pts', 'warn')}<button class="btn btn-sm" id="refreshFails">Actualizar explicaciones</button>` : ''}</div>
      ${weaknesses.length ? `<p class="muted" id="failsNote" style="margin:-4px 0 12px">Cada punto que dejaste, con su explicacion y la respuesta modelo. Tocá un boton para ir directo a reaprender ese tema. Tambien queda resaltado en <a href="#/aprender" style="color:var(--cyan)">Aprender</a>.</p>` : ''}
      ${weaknesses.length ? weaknesses.map((w) => weakRow(w, semInput(w.blockId))).join('')
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
  wireTutor(root, ctx, subject); // tutor socratico / analogia / pistas en cada correccion
  // #10 Shadow prompting: precachea (UNA sola llamada) la analogia del gap #1 mientras leés la
  // devolucion -> si la pedis, aparece al instante. Solo si Gemini esta activo (no quema cuota offline).
  const llmOk = st.health && st.health.llm && (typeof st.health.llm === 'object' ? st.health.llm.configured : st.health.llm !== 'not_configured');
  const topGap = weaknesses[0];
  if (llmOk && topGap) precacheAnalogy(ctx, subject, topGap.blockId, topGap.label || '');
  // Delegates IDEMPOTENTES por root (el viewEl persiste entre renders): sin esto se acumularian y un
  // solo click de "Revision semantica" dispararia N llamadas a Gemini (cuota). Wired una vez; los
  // handlers leen la materia ACTIVA y el estado fresco en cada click (no el closure del primer render).
  if (!root.__devolucionWired) {
    root.__devolucionWired = true;
    // #6 Revision semantica advisory: lee tu redaccion y orienta, NO cambia la nota.
    delegate(root, '[data-semantic]', 'click', async (_e, el) => {
      const subj = ctx.data.activeSubject(); if (!subj) return;
      const blockId = el.dataset.semantic;
      const input = el.dataset.input;
      const answer = (ctx.store.get().lastAnswers || {})[input] || '';
      const slot = el.closest('.weak-row') && el.closest('.weak-row').querySelector('.semantic-slot');
      if (slot) slot.innerHTML = '<div class="inline-load" style="margin-top:8px"><span class="spinner"></span>Revisando tu redaccion...</div>';
      try {
        const r = await ctx.api.semanticFeedback({ subjectId: subj.id, blockId, studentAnswer: answer, mode: ctx.store.get().lastMode || 'practice', userState: userState(subj.id) });
        if (slot) slot.innerHTML = `<div class="tutor-msg" style="margin-top:8px"><span class="tutor-flag">Revision semantica · no cambia tu nota</span><p>${escapeHtml(r.feedback || '')}</p></div>`;
      } catch (_) { if (slot) slot.innerHTML = '<p class="muted" style="margin-top:8px">No se pudo revisar ahora. Reintenta en unos segundos.</p>'; }
    });
    delegate(root, '[data-weakness-study]', 'click', (_e, el) => {
      const subj = ctx.data.activeSubject();
      track(FE.STUDY_WEAKNESS_CLICK, { blockId: el.dataset.weaknessStudy }, subj && subj.id);
    });
    // #6 Self-explanation gate (ICAP): forzar la EXPLICACION del fallo (constructive) ANTES de ver la
    // respuesta modelo. No toca la nota; es metacognitivo y aplica testing effect al alumno fundador.
    const MIN_SELFEXP = 40;
    delegate(root, '.selfexp-text', 'input', (_e, el) => {
      const gate = el.closest('.selfexp-gate'); if (!gate) return;
      const n = el.value.trim().length;
      const btn = gate.querySelector('.selfexp-reveal');
      const hint = gate.querySelector('.selfexp-hint');
      if (btn) btn.disabled = n < MIN_SELFEXP;
      if (hint) hint.textContent = n < MIN_SELFEXP
        ? `Escribí al menos ${MIN_SELFEXP} caracteres para desbloquear · ${n}/${MIN_SELFEXP}`
        : '✓ Listo para revelar — tu explicación queda registrada (no cambia la nota).';
    });
    delegate(root, '.selfexp-reveal', 'click', (_e, el) => {
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
      // Persistencia advisory: telemetria + store local (semilla para KB/A-B futuros). NUNCA toca la nota.
      const subj = ctx.data.activeSubject();
      try {
        const cur = ctx.store.get().selfExplanations || {};
        cur[`${subj.id}:${blockId}`] = { text, at: Date.now() };
        ctx.store.set({ selfExplanations: cur });
      } catch (_) {}
      track('fe_self_explanation', { blockId, len: text.trim().length }, subj && subj.id);
    });
  }

  // Explicaciones de fallo: lookup a la KB persistente. La ingesta corre async tras el score.
  if (weaknesses.length) {
    // El repaso adaptativo se arma solo y queda guardado en Aprender (se completa con las correcciones).
    const attemptId = store.get().lastAttemptId || null;
    // Precarga los study-blocks de las debilidades para que cada correccion linkee a su concepto real
    // (deep-link a la teoria/resolucion exacta). Tolerante a fallos: si no carga, el link cae al bloque.
    const studyBlocks = {};
    await Promise.all(weaknesses.map(async (w) => {
      try { studyBlocks[w.blockId] = await data.ensureBlock(subject.id, w.blockId); } catch (_) { studyBlocks[w.blockId] = null; }
    }));
    const review0 = saveReview(subject.id, buildReview({ subjectId: subject.id, attemptId, result, explanations: [], studyBlocks }));
    try { fb.saveAdaptiveReview({ subjectId: subject.id, review: review0 }); } catch (_) {}
    const savedEl = $('#reviewSaved', root);
    if (savedEl) savedEl.innerHTML = `Tu <b style="color:var(--magenta-2)">repaso adaptativo</b> quedo guardado en <a href="#/aprender" style="color:var(--cyan)">Aprender</a> · ${weaknesses.length} punto(s) a reforzar. Lo podes borrar y regenerar cuando quieras.`;
    loadFailExplanations(root, ctx, subject, result, 0, null, studyBlocks);
    const rb = $('#refreshFails', root);
    if (rb) rb.addEventListener('click', () => loadFailExplanations(root, ctx, subject, result, 0, rb, studyBlocks));
  }

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

// Detalle por bloque: que sumo (verde, hits) y que falto/estuvo mal (rojo, misses).
function correctionDetail(result) {
  const rows = Object.entries(result.blocks || {}).map(([id, b]) => {
    const hits = (b.hits || []).map((h) => `<li class="ok">✓ ${escapeHtml(h)}</li>`).join('');
    const misses = (b.misses || []).map((m) => `<li class="bad">✗ ${escapeHtml(m)}</li>`).join('');
    if (!hits && !misses) return '';
    return `<div class="corr-block">
      <h4><span>${escapeHtml(b.label || id)}</span><span class="sc">${fmt2(b.points)}/2</span></h4>
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
      <button class="btn btn-primary btn-sm" data-go="aprender" data-params='${escapeHtml(params)}' data-weakness-study="${escapeHtml(w.blockId)}">Estudiar esta debilidad</button>
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

  const note = $('#failsNote', root);
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
