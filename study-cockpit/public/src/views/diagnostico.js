import { escapeHtml } from '../format.js';
import { loadingState, errorState, $, delegate, chip } from '../components/ui.js';

// Diagnostico pre-examen: recall rapido (una pregunta por bloque, del study-map) auto-evaluado.
// No puntua (no es el motor); solo detecta que NO sabes para mandarte a estudiar ANTES de rendir.
// Es la entrada del loop: diagnostico -> aprender lo flojo -> evaluar.
export async function render(root, ctx) {
  const { data } = ctx;
  root.innerHTML = loadingState('Armando tu diagnostico...');
  try {
    await data.ensureSubjects();
    const subject = data.activeSubject();
    const plan = await data.ensurePlan(subject.id).catch(() => null);
    if (!plan || !plan.blocks?.length) { root.innerHTML = errorState('No hay plan de estudio para diagnosticar.'); return; }

    // Una pregunta de recall por bloque (primer drill; si no hay, la respuesta minima).
    const blocks = await Promise.all(plan.blocks.map((b) => data.ensureBlock(subject.id, b.id).catch(() => null)));
    const questions = blocks.filter(Boolean).map((b) => {
      const drill = (b.drills || [])[0];
      return {
        blockId: b.id, label: b.label,
        prompt: drill ? drill.prompt : `Explica con tus palabras: ${b.label}`,
        answer: drill ? drill.expected : (b.minimumAnswer || 'Revisa la teoria minima del bloque.')
      };
    });

    const marks = {}; // blockId -> 'know' | 'dont'

    root.innerHTML = `
      <div class="view-head">
        <div><p class="eyebrow">Diagnostico · ${escapeHtml(subject.name)}</p><h1>Antes de rendir, ¿que tan listo estas?</h1>
          <p>Una pregunta por tema. Pensa la respuesta, revelala y marca honestamente si la sabias. Al final te digo que reforzar.</p></div>
      </div>
      <div id="dxList" class="grid section" style="gap:12px">
        ${questions.map((q, i) => `
          <section class="card" data-dx-block="${escapeHtml(q.blockId)}">
            <div class="card-head" style="margin-bottom:8px"><h3 style="font-size:15px">${i + 1}. ${escapeHtml(q.label)}</h3><span class="dx-state"></span></div>
            <p class="q-prompt">${escapeHtml(q.prompt)}</p>
            <details class="dx-ans" style="margin-top:8px"><summary style="cursor:pointer;color:var(--magenta-2)">Ver respuesta esperada</summary>
              <p class="model-answer" style="margin-top:8px">${escapeHtml(q.answer)}</p></details>
            <div class="btn-row" style="margin-top:10px">
              <button class="btn btn-sm" data-dx-know="${escapeHtml(q.blockId)}">La sabia ✓</button>
              <button class="btn btn-sm btn-soft" data-dx-dont="${escapeHtml(q.blockId)}">No la sabia ✗</button>
            </div>
          </section>`).join('')}
      </div>
      <section class="card section">
        <div class="btn-row"><button class="btn btn-primary" id="dxResult">Ver resultado del diagnostico</button></div>
        <div id="dxOut" class="section"></div>
      </section>
    `;

    const setState = (blockId, val) => {
      marks[blockId] = val;
      const card = root.querySelector(`[data-dx-block="${blockId}"]`);
      if (card) {
        const s = card.querySelector('.dx-state');
        if (s) s.innerHTML = chip(val === 'know' ? 'la sabias' : 'a reforzar', val === 'know' ? 'ok' : 'warn');
      }
    };
    delegate(root, '[data-dx-know]', 'click', (_e, el) => setState(el.dataset.dxKnow, 'know'));
    delegate(root, '[data-dx-dont]', 'click', (_e, el) => setState(el.dataset.dxDont, 'dont'));

    $('#dxResult', root).addEventListener('click', () => {
      const answered = Object.keys(marks).length;
      const weak = questions.filter((q) => marks[q.blockId] === 'dont');
      const out = $('#dxOut', root);
      if (!answered) { out.innerHTML = `<p class="muted">Marca al menos un tema (la sabia / no la sabia) para ver el resultado.</p>`; return; }
      if (!weak.length) {
        out.innerHTML = `<div class="recover-banner" style="margin-top:12px">Vas bien: marcaste todo lo respondido como sabido. <b>Rendi un intento</b> para confirmar con el motor.</div>
          <div class="btn-row" style="margin-top:10px"><button class="btn btn-primary" data-go="evaluar">Rendir intento</button></div>`;
        return;
      }
      out.innerHTML = `
        <div class="recover-banner" style="margin-top:12px">Reforza estos ${weak.length} tema(s) ANTES de rendir para no perder esos puntos:</div>
        <div class="row-list section">
          ${weak.map((q) => `<button class="list-row" data-go="aprender" data-params='{"block":"${escapeHtml(q.blockId)}"}' style="cursor:pointer;width:100%;text-align:left">
            <span class="badge amber">!</span>
            <span><span class="t-title" style="font-size:13px">${escapeHtml(q.label)}</span><span class="t-sub">tocá para estudiarlo</span></span>
            <span class="t-end">→</span></button>`).join('')}
        </div>
        <div class="btn-row" style="margin-top:6px"><button class="btn" data-go="evaluar">Rendir igual</button></div>`;
      out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  } catch (err) {
    root.innerHTML = errorState(err.message, 'data-retry="diagnostico"');
  }
}
