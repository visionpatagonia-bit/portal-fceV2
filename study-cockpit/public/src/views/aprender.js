import { escapeHtml, fmt2 } from '../format.js';
import { loadingState, errorState, $, delegate, chip } from '../components/ui.js';
import { FE, track, getSessionId } from '../telemetry.js';
import { latestReview, hasUnseen, markSeen, deleteReview } from '../adaptive-review.js';
import { dueReviews, nextReview } from '../progress.js';
import { slug } from '../review-links.js';
import { tutorButtons, wireTutor, userState } from '../tutor.js';
import * as fb from '../firebase.js';

export async function render(root, ctx, params = {}) {
  const { data, api, store, toast } = ctx;
  root.innerHTML = loadingState('Cargando ruta de estudio...');

  try {
    await data.ensureSubjects();
    const subject = data.activeSubject();
    const plan = await data.ensurePlan(subject.id).catch(() => null);

    if (!plan || !plan.blocks?.length) {
      root.innerHTML = errorState(`No hay plan de estudio para ${subject.name} todavia.`);
      return;
    }

    const blockId = params.block || store.get().activeBlockId || plan.blocks[0].id;
    store.set({ activeBlockId: blockId });

    const block = await data.ensureBlock(subject.id, blockId);
    if (!block) { root.innerHTML = errorState('No se encontro el bloque pedido.'); return; }

    const st = store.get();
    const showScore = st.lastScore && st.lastScoreSubject === subject.id;
    let sequence = null;
    try { sequence = await data.loadSequence(subject.id, showScore ? st.lastScore : null); } catch {}

    track(FE.STUDY_STARTED, { blockId: block.id, blockLabel: block.label }, subject.id);
    const misses = missesFor(st, subject, block);
    const reviewed = getReviewed(subject.id);

    root.innerHTML = `
      ${params.mission ? `<div class="mission-bar">
        <span class="m-info">🎯 <b>Misión</b> · ${escapeHtml(block.label)} <span>· ${block.studyMinutes || 20} min sugeridos</span></span>
        <button class="btn btn-sm" data-go="inicio">Salir de misión</button>
      </div>` : `<div class="view-head">
        <div>
          <p class="eyebrow">Aprender · ${escapeHtml(subject.name)}</p>
          <h1>${escapeHtml(plan.title || 'Ruta de aprendizaje')}</h1>
          <p>${escapeHtml(plan.northStar || '')}</p>
        </div>
        <button class="btn btn-primary" data-go="evaluar">Ir a evaluar</button>
      </div>`}

      <div class="study-aux">
      ${reviewPanel(subject.id)}
      ${priorityPanel(subject.id, plan, st)}
      ${srsPanel(subject.id)}

      ${sequence ? `<section class="card section" style="margin-top:0">
        <div class="card-head"><h2>Secuencia adaptativa</h2>${chip(reasonLabel(sequence.targetBlock.reason), 'cyan')}</div>
        <p class="muted" style="margin:-2px 0 12px;max-width:680px">Tu ruta guiada: el paso <b style="color:var(--magenta-2)">resaltado</b> es lo que conviene hacer ahora. Se reordena segun tu ultimo intento. Toca un paso para ir a esa pantalla.</p>
        <div class="seq">${sequence.steps.map((s, i) => seqStep(s, i, sequence.currentStep)).join('')}</div>
      </section>` : ''}
      </div>

      <div class="split section">
        <aside class="block-pills">
          <div class="pills-head"><span>Bloques del plan</span><b id="reviewCount">${reviewed.size}/${plan.blocks.length} repasados</b></div>
          ${plan.blocks.map((b) => `
            <button class="block-pill ${b.id === block.id ? 'active' : ''} ${reviewed.has(b.id) ? 'done' : ''}" data-go="aprender" data-params='${attr({ block: b.id })}'>
              ${reviewed.has(b.id) ? '<span class="pill-check" aria-label="repasado">✓</span>' : ''}
              <span class="pp">${escapeHtml(b.code)} · ${escapeHtml(b.priority || '')}</span>
              <strong>${escapeHtml(b.label)}</strong>
              <small>${escapeHtml(b.studyMinutes || 0)} min · ${escapeHtml(b.examSkill || '')}</small>
            </button>
          `).join('')}
        </aside>

        <section class="card">
          <div class="card-head">
            <div><p class="eyebrow" style="margin-bottom:4px">Bloque ${escapeHtml(block.code)}</p><h2>${escapeHtml(block.label)}</h2></div>
            <span class="study-time-chip" id="studyTimeChip" title="Tiempo que llevas en este bloque vs lo recomendado">${studyTimeLabel(subject.id, block.id, block.studyMinutes)}</span>
          </div>
          ${misses.length ? `<div class="note-banner">Foco adaptado a tu ultimo intento: ${escapeHtml(misses.slice(0, 2).join(' · '))}</div>` : ''}
          ${params.retest ? `<div class="ai-card" style="background:linear-gradient(150deg,rgba(41,229,229,.12),var(--tile));border-color:rgba(41,229,229,.3);margin-top:8px">
            <strong style="font-size:15px">🎯 Estás recuperando un error</strong>
            <p style="margin:4px 0 8px">Estudiá este bloque y, cuando estés listo, hacé el <b>re-test dirigido</b>: reintentás solo este error y cuenta para tu progreso (no altera la nota del simulacro).</p>
            <button class="btn btn-primary btn-sm" data-go="evaluar" data-params='${attr({ retest: block.id })}'>Hacer el re-test de este error</button>
          </div>` : ''}

          <div class="study-block-body" style="margin-top:14px">
            <div class="sb-section"><strong>Por que importa</strong><p class="muted">${escapeHtml(block.whyItMatters || '')}</p></div>

            <div class="sb-section"><strong>Que aprender</strong>
              <ul>${(block.learningObjectives || []).map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
            </div>

            <div class="sb-section"><strong>Teoria minima defendible</strong>
              ${(block.coreTheory || []).map((t) => `<div class="sb-note" id="ct-${slug(t.title)}"><b>${escapeHtml(t.title)}</b><p>${escapeHtml(t.body)}</p><div class="sb-note-foot"><button class="btn btn-ghost btn-sm" data-reexplain="${escapeHtml(t.title)}">No entendi este</button></div><div class="reexplain-slot"></div></div>`).join('')}
            </div>

            ${workedExampleSection(block.workedExample)}

            ${(block.examLanguage || []).length ? `<div class="sb-section"><strong>Como aparece en el parcial</strong>
              <ul>${block.examLanguage.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>` : ''}

            <div class="sb-section"><strong>Errores que bajan puntos</strong>
              <ul>${(block.commonErrors || []).map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
            </div>

            <div class="sb-section"><strong>Respuesta minima</strong><p class="muted">${escapeHtml(block.minimumAnswer || '')}</p></div>

            ${(block.drills || []).length ? `<div class="sb-section"><strong>Quiz rapido (recall)</strong>
              <p class="muted" style="font-size:12.5px;margin:4px 0 8px">Pensa la respuesta, revelala y marca honestamente si la sabias. Fijar con recall es la mejor forma de no perder esos puntos en el parcial.</p>
              ${block.drills.map((d, i) => `<div class="sb-note"><b>${escapeHtml(d.prompt)}</b>
                <details style="margin-top:6px"><summary style="cursor:pointer;color:var(--magenta-2)">Ver respuesta</summary><span class="model-answer" style="display:block;margin-top:6px">${escapeHtml(d.expected)}</span></details>
                <div class="btn-row" style="margin-top:8px"><button class="btn btn-ghost btn-sm" data-quiz-know="${i}">La sabia ✓</button><button class="btn btn-ghost btn-sm" data-quiz-dont="${i}">No la sabia ✗</button></div>
              </div>`).join('')}
              <div id="quizResult" class="muted" style="margin-top:8px;font-size:12.5px">0/${block.drills.length} respondidas.</div>
            </div>` : ''}
          </div>

          <div class="btn-row" style="margin-top:16px;align-items:center">
            <button class="btn btn-primary" id="genBtn">Generar practica con Gemini</button>
            ${sequence?.currentStep === 'adaptive_retrain' ? chip('Hace esto ahora', 'cyan') : ''}
            <button class="btn" id="doneBtn">Marcar como repasado</button>
            ${params.retest ? `<button class="btn btn-primary" data-go="evaluar" data-params='${attr({ retest: block.id })}'>🎯 Hacer el re-test</button>` : ''}
            <button class="btn" data-go="evaluar">Evaluar este bloque</button>
          </div>
          <div class="ask-box section">
            <div class="card-head" style="margin-bottom:10px"><h3>Pregunta sobre este bloque</h3><span class="ai-flag">IA · responde con el contenido de la materia</span></div>
            <div class="ask-row">
              <input class="input" id="askInput" autocomplete="off" placeholder="Ej: por que el devengado no depende del cobro?">
              <button class="btn btn-primary" id="askBtn">Preguntar</button>
            </div>
            <div id="askSlot"></div>
          </div>

          <div id="adaptivePanel" class="section" style="margin-top:14px"></div>
        </section>
      </div>

      ${confusablesCard(plan.confusablePairs)}
    `;

    // Deep-link desde una correccion (Devolucion / repaso): si viene params.concept o
    // params.section, scrollea y resalta la teoria/resolucion EXACTA para reaprender ese error.
    // Si no, al cambiar de bloque se muestra el bloque desde su inicio.
    const deepId = params.section === 'worked-example' ? 'worked-example' : (params.concept ? 'ct-' + slug(params.concept) : null);
    const scrollToSplit = () => {
      const split = root.querySelector('.split');
      if (split) window.scrollTo({ top: Math.max(0, split.getBoundingClientRect().top + window.scrollY - 76), behavior: 'smooth' });
    };
    if (deepId) {
      requestAnimationFrame(() => {
        const sel = '#' + ((window.CSS && CSS.escape) ? CSS.escape(deepId) : deepId);
        const el = root.querySelector(sel);
        if (el) {
          window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84), behavior: 'smooth' });
          el.classList.add('deep-target');
          setTimeout(() => el.classList.remove('deep-target'), 1800);
        } else { scrollToSplit(); }
      });
    } else if (params.block) {
      requestAnimationFrame(scrollToSplit);
    }

    // ---- wiring ----
    wireTutor(root, ctx, subject); // tutor socratico / analogia / pistas en las correcciones del repaso
    const panel = $('#adaptivePanel', root);

    async function generate(forceNew) {
      panel.innerHTML = `<div class="card"><span class="inline-load"><span class="spinner"></span>${forceNew ? 'Generando variante nueva...' : 'Buscando en KB y adaptando...'}</span></div>`;
      try {
        const target = missesFor(store.get(), subject, block);
        const res = await api.adaptiveContent({
          subjectId: subject.id,
          sessionId: getSessionId(),
          blockId: block.id,
          mode: target.length ? 'retrain_weakness' : 'study_variant',
          forceNew: Boolean(forceNew),
          targetMisses: target,
          deterministicResult: showScore ? store.get().lastScore : null,
          studentProfile: { goal: `aprobar ${subject.name}`, answerStyle: 'criterio tecnico, aplicacion y precision' }
        });
        track(FE.GEMINI_USED, { blockId: block.id, provider: res.provider, status: res.status }, subject.id);
        if (res.kb?.reused) track(FE.KB_REUSED, { entryId: res.kb.entryId, blockId: block.id }, subject.id);
        renderAdaptive(panel, res);
        // Re-hidratar re-explicaciones guardadas en las cards generadas que coincidan.
        const sx = blockReexplains(subject.id, block.id);
        panel.querySelectorAll('.ai-card [data-reexplain]').forEach((b) => {
          const data = sx[b.dataset.reexplain];
          const slot = b.closest('.ai-card')?.querySelector('.reexplain-slot');
          if (data && slot) slot.innerHTML = reexplainCard(data);
        });
        toast(res.provider === 'kb' ? 'Contenido reutilizado desde KB' : (res.configured ? 'Contenido generado por Gemini' : 'Practica generada del contrato'), 'ok');
      } catch (err) {
        panel.innerHTML = errorState(err.message);
      }
    }

    async function reexplain(concept, slot, btn) {
      track(FE.MICRO_LESSON_CONFUSION, { blockId: block.id, concept }, subject.id);
      const orig = btn.textContent;
      btn.disabled = true; btn.textContent = 'Re-explicando...';
      slot.innerHTML = '<div class="inline-load" style="margin-top:8px"><span class="spinner"></span>Buscando otra forma de explicarlo...</div>';
      try {
        const res = await api.adaptiveContent({
          subjectId: subject.id, sessionId: getSessionId(), blockId: block.id,
          mode: 'reexplain', targetConcept: concept, forceNew: true,
          studentProfile: { goal: `entender ${concept}`, answerStyle: 'explicacion simple, analogia cotidiana y ejemplo concreto' }
        });
        const m = res.content?.micro_lesson?.[0];
        const data = m
          ? { title: m.title, explanation: m.explanation, exam_trigger: m.exam_trigger }
          : { explanation: res.content?.why_this_block || 'No se pudo re-explicar ahora.' };
        slot.innerHTML = reexplainCard(data);
        // Persiste como complemento del bloque en la sesion del alumno (este navegador).
        saveReexplain(subject.id, block.id, concept, data);
      } catch (err) {
        slot.innerHTML = `<div class="error-box" style="margin-top:8px">No se pudo re-explicar: ${escapeHtml(err.message)}</div>`;
      }
      btn.disabled = false; btn.textContent = orig;
    }

    // Quiz rapido (recall): autoevaluacion de las mini-practicas del bloque (quiz post-repaso).
    const quizMarks = {};
    const quizTotal = (block.drills || []).length;
    if (quizTotal) {
      const quizUpdate = () => {
        const out = $('#quizResult', root);
        if (!out) return;
        const answered = Object.keys(quizMarks).length;
        if (answered < quizTotal) { out.textContent = `${answered}/${quizTotal} respondidas.`; return; }
        const known = Object.values(quizMarks).filter((v) => v === 'know').length;
        out.innerHTML = known === quizTotal
          ? '✓ Dominaste el recall de este bloque. Marcalo como repasado y pasa a evaluar.'
          : `Te faltan ${quizTotal - known}: volve a la teoria de arriba y reintenta el quiz.`;
      };
      delegate(root, '[data-quiz-know]', 'click', (_e, el) => { quizMarks[el.dataset.quizKnow] = 'know'; quizUpdate(); });
      delegate(root, '[data-quiz-dont]', 'click', (_e, el) => { quizMarks[el.dataset.quizDont] = 'dont'; quizUpdate(); });
    }

    $('#genBtn', root).addEventListener('click', () => generate(false));
    $('#doneBtn', root).addEventListener('click', (e) => {
      track(FE.BLOCK_COMPLETED, { blockId: block.id }, subject.id);
      addReviewed(subject.id, block.id);
      e.target.textContent = 'Bloque repasado ✓';
      e.target.disabled = true;
      const pill = root.querySelector('.block-pill.active');
      if (pill && !pill.classList.contains('done')) {
        pill.classList.add('done');
        pill.insertAdjacentHTML('afterbegin', '<span class="pill-check" aria-label="repasado">✓</span>');
      }
      const now = getReviewed(subject.id);
      const counter = $('#reviewCount', root);
      if (counter) counter.textContent = `${now.size}/${plan.blocks.length} repasados`;
      toast('Bloque marcado como repasado', 'ok');
    });
    panel.addEventListener('click', (e) => {
      const f = e.target.closest('#forceNewBtn');
      if (f) { generate(true); return; }
      const re = e.target.closest('[data-reexplain]');
      if (re) {
        const slot = re.closest('.ai-card')?.querySelector('.reexplain-slot');
        if (slot) reexplain(re.dataset.reexplain, slot, re);
      }
    });

    // "No entendi este" en la teoria base del bloque (reusa el pipeline reexplain).
    const studyBody = root.querySelector('.study-block-body');
    if (studyBody) studyBody.addEventListener('click', (e) => {
      const re = e.target.closest('[data-reexplain]');
      if (!re) return;
      const slot = re.closest('.sb-note')?.querySelector('.reexplain-slot');
      if (slot) reexplain(re.dataset.reexplain, slot, re);
    });

    // Re-hidratar las re-explicaciones guardadas: persisten como complemento del bloque.
    const savedRx = blockReexplains(subject.id, block.id);
    if (studyBody) studyBody.querySelectorAll('.sb-note [data-reexplain]').forEach((b) => {
      const data = savedRx[b.dataset.reexplain];
      const slot = b.closest('.sb-note')?.querySelector('.reexplain-slot');
      if (data && slot) slot.innerHTML = reexplainCard(data);
    });

    // Pregunta libre sobre el bloque. El historial Q&A persiste como complemento del bloque.
    async function ask(question, slot, btn) {
      const q = String(question || '').trim();
      if (!q) return;
      const orig = btn.textContent;
      btn.disabled = true; btn.textContent = 'Pensando...';
      slot.innerHTML = '<div class="inline-load" style="margin-top:10px"><span class="spinner"></span>Buscando en el contenido del bloque...</div>' + blockAsks(subject.id, block.id).map(askCard).join('');
      try {
        const res = await api.ask({ subjectId: subject.id, sessionId: getSessionId(), blockId: block.id, question: q, userState: userState(subject.id) });
        const a = res.answer || {};
        if (res.source === 'gemini' || res.source === 'cache' || res.source === 'cache_similar') {
          // Respuesta real: se guarda como complemento del bloque y se limpia la caja.
          saveAsk(subject.id, block.id, { question: q, respuesta: a.respuesta, dondeRepasar: a.dondeRepasar, source: res.source });
          renderAskHistory(slot, subject.id, block.id);
          const inp = $('#askInput', root); if (inp) inp.value = '';
        } else {
          // Fallback (Gemini ocupado): NO se persiste un no-answer; se deja la pregunta para reintentar.
          slot.innerHTML = `<div class="ai-card" style="margin-top:10px;border-color:rgba(255,177,61,.35)"><strong>${escapeHtml(q)}</strong><p>${escapeHtml(a.respuesta || '')}</p><span class="trigger" style="color:var(--amber)">↻ La IA esta con mucha demanda. Toca "Preguntar" otra vez en unos segundos.</span></div>` + blockAsks(subject.id, block.id).map(askCard).join('');
        }
      } catch (err) {
        slot.innerHTML = `<div class="error-box" style="margin-top:10px">No se pudo responder: ${escapeHtml(err.message)}</div>` + blockAsks(subject.id, block.id).map(askCard).join('');
      }
      btn.disabled = false; btn.textContent = orig;
    }
    const askBtn = $('#askBtn', root), askInput = $('#askInput', root), askSlot = $('#askSlot', root);
    if (askBtn && askInput && askSlot) {
      askBtn.addEventListener('click', () => ask(askInput.value, askSlot, askBtn));
      askInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ask(askInput.value, askSlot, askBtn); } });
      renderAskHistory(askSlot, subject.id, block.id); // re-hidratar el historial al abrir el bloque
    }

    // Repaso adaptativo: marcar como visto (saca el badge "nuevo") y permitir borrarlo/regenerarlo.
    const reviewSection = root.querySelector('.review-panel');
    if (reviewSection) {
      const rid = reviewSection.dataset.reviewId;
      if (hasUnseen(subject.id)) markSeen(subject.id, rid);
      const delBtn = reviewSection.querySelector('[data-review-del]');
      if (delBtn) delBtn.addEventListener('click', () => {
        deleteReview(subject.id, delBtn.dataset.reviewDel);
        try { fb.deleteAdaptiveReview({ reviewId: delBtn.dataset.reviewDel }); } catch (_) {}
        reviewSection.remove();
        toast('Repaso borrado. Rendi un intento nuevo para regenerarlo.', 'ok');
      });
    }

    // Cronometro de estudio: suma tiempo mientras el bloque esta abierto y la pestania visible.
    if (studyTimer) clearInterval(studyTimer);
    studyTimer = setInterval(() => {
      const chip = document.getElementById('studyTimeChip');
      if (!chip) { clearInterval(studyTimer); studyTimer = null; return; } // salio de Aprender
      if (document.visibilityState !== 'visible') return;
      addStudyTime(subject.id, block.id, 20);
      chip.innerHTML = studyTimeLabel(subject.id, block.id, block.studyMinutes);
    }, 20000);

    if (params.gen) generate(false);
  } catch (err) {
    root.innerHTML = errorState(err.message, 'data-retry="aprender"');
  }
}

function missesFor(st, subject, block) {
  if (!st.lastScore || st.lastScoreSubject !== subject.id) return [];
  const w = (st.lastScore.weaknesses || []).find((x) => x.blockId === block.id || x.blockId === block.code);
  return w?.misses?.length ? w.misses : [];
}

const PANEL_FOR = { study: 'aprender', attempt: 'evaluar', feedback: 'devolucion', contract: 'contrato' };
const DEST_LABEL = { study: 'Aprender', attempt: 'Evaluar', feedback: 'Devolucion', contract: 'Contrato' };
const REASON_LABEL = {
  selected_by_student: 'Bloque elegido por vos',
  weakness_priority: 'Priorizado por tu bloque mas flojo',
  exam_weight_priority: 'Priorizado por peso de examen'
};

function reasonLabel(reason) {
  return REASON_LABEL[reason] || 'Ruta sugerida';
}

function seqStep(step, i, current) {
  const route = PANEL_FOR[step.panel] || 'aprender';
  const isNow = step.id === current;
  const params = {};
  if (step.blockId) params.block = step.blockId;
  if (step.action === 'generate_adaptive_content') params.gen = '1';
  const right = isNow
    ? '<span class="seq-now">Hace esto ahora</span>'
    : `<span class="seq-dest">→ ${escapeHtml(DEST_LABEL[step.panel] || 'Aprender')}</span>`;
  return `<button class="seq-step ${isNow ? 'active' : ''}" data-go="${route}" data-params='${attr(params)}'>
    <span class="n">${String(i + 1).padStart(2, '0')}</span>
    <span class="seq-main">
      <strong>${escapeHtml(step.label)}</strong>
      <small>${escapeHtml(step.purpose || '')}</small>
    </span>
    ${right}
  </button>`;
}

function renderAdaptive(panel, res) {
  const c = res.content;
  if (!c) { panel.innerHTML = `<div class="error-box"><b>Sin contenido.</b><p>${escapeHtml(res.message || '')}</p></div>`; return; }
  const flag = res.provider === 'kb'
    ? '<span class="ai-flag">⟳ Reutilizado desde KB</span>'
    : (res.configured && res.status === 'completed')
      ? '<span class="ai-flag">★ Generado por IA · no auditado</span>'
      : '<span class="ai-flag" style="color:var(--cyan)">⚙ Generado del contrato (sin IA)</span>';

  panel.innerHTML = `
    <section class="card">
      <div class="card-head"><h3>${escapeHtml(c.lesson_title)}</h3>${flag}</div>
      <p class="muted">${escapeHtml(c.why_this_block || c.student_mode || '')}</p>

      <div class="sb-section" style="border-top:0;padding-top:12px"><strong>Microclase</strong>
        ${(c.micro_lesson || []).map((m) => `<div class="ai-card"><strong>${escapeHtml(m.title)}</strong><p>${escapeHtml(m.explanation)}</p>${m.exam_trigger ? `<span class="trigger">${escapeHtml(m.exam_trigger)}</span>` : ''}<div class="btn-row" style="margin-top:8px"><button class="btn btn-sm" data-reexplain="${escapeHtml(m.title)}">No entendi este</button></div><div class="reexplain-slot"></div></div>`).join('')}
      </div>

      <div class="sb-section"><strong>Recall activo</strong>
        <div class="ai-card">${(c.active_recall || []).map((r) => `<div class="recall-row"><strong>${escapeHtml(r.question)}</strong><p>${escapeHtml(r.expected_answer)}</p>${r.hint ? `<span class="trigger">${escapeHtml(r.hint)}</span>` : ''}</div>`).join('')}</div>
      </div>

      ${c.exam_drill ? `<div class="sb-section"><strong>Ejercicio nuevo tipo parcial</strong>
        <div class="ai-card"><p style="color:var(--ink)">${escapeHtml(c.exam_drill.prompt)}</p>
          <details style="margin-top:8px"><summary style="cursor:pointer;color:var(--magenta-2)">Ver respuesta esperada</summary>
            <p>${escapeHtml(c.exam_drill.expected_answer)}</p>
            <ul style="margin:8px 0 0;padding-left:18px">${(c.exam_drill.grading_focus || []).map((g) => `<li class="muted">${escapeHtml(g)}</li>`).join('')}</ul>
          </details>
        </div></div>` : ''}

      <div class="sb-section"><strong>Errores a bloquear</strong>
        <ul>${(c.misconceptions || []).map((m) => `<li class="muted">${escapeHtml(m)}</li>`).join('')}</ul>
        <p class="muted" style="margin-top:8px">${escapeHtml(c.next_action || '')}</p>
      </div>

      <div class="btn-row"><button class="btn btn-sm" id="forceNewBtn">Generar variante nueva</button></div>
    </section>
  `;
}

// Resolucion guiada paso a paso (ej: liquidacion de remuneraciones). Numeros precomputados en el
// study-map con el MISMO motor determinista (computePayroll), distintos a los del examen para que el
// alumno aprenda el procedimiento y no memorice la respuesta. Refuerza el flujo fallo -> aprender.
function weRows(rows) {
  return (rows || []).map((r) => `<tr><td>${escapeHtml(r.account)}</td><td class="we-amt">${escapeHtml(r.amount)}</td></tr>`).join('');
}
function workedExampleSection(we) {
  if (!we || !Array.isArray(we.steps) || !we.steps.length) return '';
  const givens = (we.givens || []).map((g) => `<span class="we-given"><small>${escapeHtml(g.label)}</small><b>${escapeHtml(g.value)}</b></span>`).join('');
  const steps = we.steps.map((s) => `
    <div class="we-step">
      <span class="we-n">${escapeHtml(String(s.n))}</span>
      <div class="we-step-main">
        <strong>${escapeHtml(s.title)}</strong>
        <code class="we-formula">${escapeHtml(s.formula)}</code>
        ${s.note ? `<small class="muted">${escapeHtml(s.note)}</small>` : ''}
      </div>
      <span class="we-result">${escapeHtml(s.result)}</span>
    </div>`).join('');
  const e = we.entry;
  const entry = e ? `<div class="we-entry">
      <table class="we-table"><thead><tr><th>Debe</th><th class="we-amt">$</th></tr></thead>
        <tbody>${weRows(e.debit)}<tr class="we-total"><td>Total Debe</td><td class="we-amt">${escapeHtml(e.debitTotal || '')}</td></tr></tbody></table>
      <table class="we-table"><thead><tr><th>Haber</th><th class="we-amt">$</th></tr></thead>
        <tbody>${weRows(e.credit)}<tr class="we-total"><td>Total Haber</td><td class="we-amt">${escapeHtml(e.creditTotal || '')}</td></tr></tbody></table>
    </div>` : '';
  const checks = (we.checks || []).length ? `<ul class="we-checks">${we.checks.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>` : '';
  return `<div class="sb-section worked-example" id="worked-example"><strong>${escapeHtml(we.title || 'Resolucion paso a paso')}</strong>
    ${we.intro ? `<p class="muted" style="margin:4px 0 10px">${escapeHtml(we.intro)}</p>` : ''}
    ${givens ? `<div class="we-givens">${givens}</div>` : ''}
    <div class="we-steps">${steps}</div>
    ${entry ? `<div class="we-entry-wrap"><span class="we-entry-title">Asiento de liquidacion</span>${entry}</div>` : ''}
    ${checks}
  </div>`;
}

// Acciones de reestudio por correccion (mismo patron que en Devolucion): cada error lleva a COMO
// reaprenderlo — teoria concreta, resolucion paso a paso, o practicar ese error. Si el review es viejo
// y no tiene reviewLink, no pinta nada (cae al boton generico "Estudiar: <bloque>" del item).
function reviewActions(link) {
  if (!link || !link.block) return '';
  const btn = (params, label) => `<button class="btn btn-sm" data-go="aprender" data-params='${attr(params)}'>${escapeHtml(label)}</button>`;
  const out = [];
  if (link.worked) out.push(btn({ block: link.block, section: 'worked-example' }, link.label || 'Ver resolucion paso a paso'));
  else if (link.concept) out.push(btn({ block: link.block, concept: link.concept }, link.label || 'Ver teoria'));
  else out.push(btn({ block: link.block }, link.label || 'Estudiar el bloque'));
  out.push(btn({ block: link.block, gen: '1' }, 'Practicar este error'));
  return `<div class="btn-row review-actions" style="margin-top:8px">${out.join('')}</div>`;
}

// Panel "Tu repaso adaptativo": se arma en la Devolucion y aparece aca como contenido nuevo,
// guardado y borrable. El motor determinista eligio las debilidades; aca se estudian.
function reviewPanel(subjectId) {
  const r = latestReview(subjectId);
  if (!r || !Array.isArray(r.items) || !r.items.length) return '';
  const isNew = !r.seen;
  let fecha = '';
  try { fecha = new Date(r.createdAt).toLocaleDateString('es-AR'); } catch { fecha = ''; }
  const recoverable = r.items.reduce((s, it) => s + (it.pointsLost || 0), 0);
  return `<section class="card section review-panel" style="margin-top:0" data-review-id="${escapeHtml(r.reviewId)}">
    <div class="card-head">
      <h2 style="display:flex;align-items:center;gap:8px">Lo que necesitas recuperar ${isNew ? chip('nuevo', 'warn') : ''}</h2>
      <button class="btn btn-sm" data-review-del="${escapeHtml(r.reviewId)}">Borrar y regenerar</button>
    </div>
    ${recoverable > 0 ? `<div class="recover-banner">Recuperá hasta <b>${escapeHtml(fmt2(recoverable))} pts</b> para subir la nota. Cada bloque de abajo es un punto que dejaste: tocá un boton y vas directo a reaprenderlo.</div>` : ''}
    <p class="muted" style="margin:-2px 0 12px;max-width:700px">Armado desde tu ultima devolucion (nota estimada ${escapeHtml(fmt2(r.estimated))}${fecha ? ' · ' + escapeHtml(fecha) : ''}). Ordenado por cuanto se recupera. Para regenerarlo, borralo y rendi otro intento.</p>
    ${r.items.map((it) => `
      <div class="review-item">
        <h3><span>${escapeHtml(it.label || it.blockId)}</span><span style="display:flex;gap:8px;align-items:center">${it.pointsLost ? chip('recuperas ' + fmt2(it.pointsLost) + ' pts', 'warn') : ''}<span class="sc">${escapeHtml(fmt2(it.score))}/${escapeHtml(fmt2(it.maxPoints != null ? it.maxPoints : 2))}</span></span></h3>
        ${(it.corrections && it.corrections.length)
          ? it.corrections.map((c) => `<div class="fail-card"><strong>${escapeHtml(c.titulo || 'Punto a reforzar')}</strong>${c.texto ? `<p>${escapeHtml(c.texto)}</p>` : ''}${c.respuestaModelo ? `<p class="model-answer"><b>Respuesta modelo:</b> ${escapeHtml(c.respuestaModelo)}</p>` : ''}${c.proximoPaso ? `<span class="trigger">→ ${escapeHtml(c.proximoPaso)}</span>` : ''}${reviewActions(c.reviewLink)}${tutorButtons({ blockId: it.blockId, concept: c.titulo || '', missText: c.titulo || '' })}</div>`).join('')
          : `<ul class="muted">${(it.misses || []).map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul><p class="muted" style="font-size:12.5px;margin-top:6px">Las explicaciones se terminan de generar solas; si volves en unos segundos van a estar completas.</p>`}
        <div class="btn-row" style="margin-top:8px"><button class="btn btn-sm btn-primary" data-go="aprender" data-params='${attr({ block: it.blockId })}'>Estudiar: ${escapeHtml(it.label || it.blockId)}</button></div>
      </div>
    `).join('')}
  </section>`;
}

// Prioridad de repaso: ordena lo que conviene reforzar por (puntos perdidos x peso en el examen).
// Apunta al mejor retorno de nota, no solo al ultimo bloque flojo.
function priorityPanel(subjectId, plan, st) {
  if (!st || !st.lastScore || st.lastScoreSubject !== subjectId) return '';
  const gaps = st.lastScore.gaps || [];
  if (!gaps.length) return '';
  // Peso por PRIORIDAD del bloque (varia: critical/high/medium); el examWeight del contrato es uniforme
  // (2) y no diferenciaria nada. Asi el ranking realmente prioriza lo que mas pesa en el examen.
  const W = { critical: 2, high: 1.5, medium: 1, low: 0.8 };
  const blocks = (plan && plan.blocks) || [];
  const weightOf = (blockId) => {
    const b = blocks.find((x) => x.id === blockId || x.code === blockId);
    return (b && (W[b.priority] != null ? W[b.priority] : (b.examWeight != null ? b.examWeight : 1))) || 1;
  };
  const ranked = gaps.map((g) => {
    const weight = weightOf(g.blockId);
    return { blockId: g.blockId, label: g.label, pointsLost: g.pointsLost || 0, weight, priority: Math.round((g.pointsLost || 0) * weight * 100) / 100 };
  }).sort((a, b) => b.priority - a.priority);
  const rows = ranked.map((r, i) => `<button class="list-row" data-go="aprender" data-params='${attr({ block: r.blockId })}' style="cursor:pointer;width:100%;text-align:left">
    <span class="badge ${i === 0 ? 'amber' : 'cyan'}">${i + 1}</span>
    <span><span class="t-title" style="font-size:13px">${escapeHtml(r.label || r.blockId)}</span><span class="t-sub">recuperas ${fmt2(r.pointsLost)} pts · peso ${fmt2(r.weight)}</span></span>
    <span class="t-end">${chip('prioridad ' + fmt2(r.priority), i === 0 ? 'warn' : 'cyan')}</span></button>`).join('');
  return `<section class="card section" style="margin-top:0"><div class="card-head"><h2>Prioridad de repaso</h2>${chip('fallo x peso', 'warn')}</div>
    <p class="muted" style="margin:-2px 0 12px">Ordenado por el mejor retorno de nota: cuanto perdiste por cuanto pesa en el examen. Empeza por el #1.</p>
    <div class="row-list">${rows}</div></section>`;
}

// Repaso espaciado: bloques que "tocan" hoy segun como te fue (fallaste -> vuelve pronto).
function srsPanel(subjectId) {
  const due = dueReviews(subjectId);
  if (!due.length) {
    const next = nextReview(subjectId);
    if (next == null) return '';
    return `<section class="card section" style="margin-top:0"><div class="card-head"><h2>Repaso espaciado</h2>${chip('al dia', 'ok')}</div><p class="muted">No hay bloques para repasar hoy. Tu proximo repaso programado es en ${next} dia(s).</p></section>`;
  }
  const rows = due.slice(0, 6).map((d) => `<button class="list-row" data-go="aprender" data-params='${attr({ block: d.blockId })}' style="cursor:pointer;width:100%;text-align:left"><span class="t-title" style="font-size:13px">${escapeHtml(d.label || d.blockId)}</span><span class="t-end">${chip(d.lastScore < 1.35 ? 'reforzar' : 'mantener', d.lastScore < 1.35 ? 'warn' : 'cyan')}</span></button>`).join('');
  return `<section class="card section" style="margin-top:0"><div class="card-head"><h2>Repaso espaciado</h2>${chip(due.length + ' para hoy', 'warn')}</div>
    <p class="muted" style="margin:-2px 0 12px">Estos bloques toca repasarlos hoy (programados segun como te fue en el ultimo intento). Toca uno para estudiarlo.</p>
    <div class="row-list">${rows}</div></section>`;
}

function confusablesCard(pairs) {
  if (!Array.isArray(pairs) || !pairs.length) return '';
  return `<section class="card section">
    <div class="card-head"><h2>Pares que se confunden</h2>${chip('No los mezcles en el parcial', 'cyan')}</div>
    <div class="confusables">
      ${pairs.map((p) => {
        // Bug #3: tolera AMBOS formatos de dato (cualquier materia): objeto {a,b,c,key} (Contabilidad)
        // o string "A (...) vs B (...)" (Administracion). Sin esto, las cards quedaban vacias en Admin.
        if (typeof p === 'string') {
          const chips = p.split(/\s+vs\.?\s+/i).map((t) => t.trim()).filter(Boolean)
            .map((t) => `<span class="cf-term">${escapeHtml(t)}</span>`).join('<span class="cf-vs">vs</span>');
          return `<div class="confusable"><div class="cf-pair">${chips || escapeHtml(p)}</div></div>`;
        }
        const terms = [p.a, p.b, p.c].filter(Boolean).map((t) => `<span class="cf-term">${escapeHtml(t)}</span>`).join('<span class="cf-vs">vs</span>');
        return `<div class="confusable"><div class="cf-pair">${terms}</div><p class="muted">${escapeHtml(p.key || '')}</p></div>`;
      }).join('')}
    </div>
  </section>`;
}

// Tiempo de estudio por bloque (metacognicion): cuanto llevas vs lo recomendado.
let studyTimer = null;
function studyTimeKey(subjectId) { return 'nexus.studytime.' + subjectId; }
function getStudyTime(subjectId) { try { return JSON.parse(localStorage.getItem(studyTimeKey(subjectId)) || '{}'); } catch { return {}; } }
function addStudyTime(subjectId, blockId, secs) {
  try { const all = getStudyTime(subjectId); all[blockId] = (all[blockId] || 0) + secs; localStorage.setItem(studyTimeKey(subjectId), JSON.stringify(all)); } catch { /* no-op */ }
}
function studyTimeLabel(subjectId, blockId, recommendedMin) {
  const min = Math.round((getStudyTime(subjectId)[blockId] || 0) / 60);
  const rec = recommendedMin || 0;
  const reached = rec && min >= rec;
  return `<span class="${reached ? 'st-ok' : ''}">⏱ ${min} min${rec ? ` / ${rec} rec.` : ''}</span>`;
}

function reviewedKey(subjectId) { return 'nexus.reviewed.' + subjectId; }
function getReviewed(subjectId) {
  try { return new Set(JSON.parse(localStorage.getItem(reviewedKey(subjectId)) || '[]')); }
  catch { return new Set(); }
}
function addReviewed(subjectId, blockId) {
  try {
    const s = getReviewed(subjectId);
    s.add(blockId);
    localStorage.setItem(reviewedKey(subjectId), JSON.stringify([...s]));
  } catch { /* localStorage no disponible */ }
}

// Re-explicaciones "No entendi": persisten en el navegador del alumno como complemento del bloque.
function reexplainKey(subjectId) { return 'nexus.reexplain.' + subjectId; }
function getReexplainStore(subjectId) {
  try { return JSON.parse(localStorage.getItem(reexplainKey(subjectId)) || '{}'); }
  catch { return {}; }
}
function saveReexplain(subjectId, blockId, concept, data) {
  try {
    const all = getReexplainStore(subjectId);
    (all[blockId] = all[blockId] || {})[concept] = data;
    localStorage.setItem(reexplainKey(subjectId), JSON.stringify(all));
  } catch { /* localStorage no disponible */ }
}
function blockReexplains(subjectId, blockId) { return getReexplainStore(subjectId)[blockId] || {}; }

function reexplainCard(data) {
  const body = `${data.title ? `<strong>${escapeHtml(data.title)}</strong>` : ''}<p>${escapeHtml(data.explanation || '')}</p>${data.exam_trigger ? `<span class="trigger">${escapeHtml(data.exam_trigger)}</span>` : ''}`;
  return `<div class="ai-card reexplain-card" style="margin-top:8px;background:linear-gradient(150deg,rgba(41,229,229,.08),var(--tile));border-color:rgba(41,229,229,.22)"><span class="ai-flag" style="color:var(--cyan)">&#8635; Explicado de otra forma</span>${body}</div>`;
}

// Preguntas + respuestas: persisten como historial del bloque en el navegador del alumno.
function askKey(subjectId) { return 'nexus.asks.' + subjectId; }
function getAskStore(subjectId) {
  try { return JSON.parse(localStorage.getItem(askKey(subjectId)) || '{}'); }
  catch { return {}; }
}
// Solo respuestas reales (Gemini/cache). Oculta no-answers de fallback que se hayan guardado antes.
function blockAsks(subjectId, blockId) {
  return (getAskStore(subjectId)[blockId] || []).filter((x) => x && x.source !== 'contract_fallback');
}
function saveAsk(subjectId, blockId, qa) {
  try {
    const all = getAskStore(subjectId);
    const norm = (s) => String(s || '').trim().toLowerCase();
    const list = (all[blockId] || []).filter((x) => norm(x.question) !== norm(qa.question));
    list.unshift(qa);
    all[blockId] = list.slice(0, 20);
    localStorage.setItem(askKey(subjectId), JSON.stringify(all));
  } catch { /* localStorage no disponible */ }
}
function askCard(qa) {
  const flag = qa.source === 'cache_similar'
    ? '<span class="ai-flag">★ respondido por IA (pregunta similar)</span>'
    : (qa.source === 'gemini' || qa.source === 'cache')
      ? '<span class="ai-flag">★ respondido por IA</span>'
      : '<span class="ai-flag" style="color:var(--cyan)">⚙ del contrato</span>';
  return `<div class="ai-card" style="margin-top:10px"><strong>${escapeHtml(qa.question)}</strong><p>${escapeHtml(qa.respuesta || '')}</p>${qa.dondeRepasar ? `<span class="trigger">↳ ${escapeHtml(qa.dondeRepasar)}</span>` : ''}${flag}</div>`;
}
function renderAskHistory(slot, subjectId, blockId) {
  if (slot) slot.innerHTML = blockAsks(subjectId, blockId).map(askCard).join('');
}

function attr(obj) {
  return escapeHtml(JSON.stringify(obj));
}
