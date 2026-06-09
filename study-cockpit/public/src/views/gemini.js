import { escapeHtml } from '../format.js';
import { errorState, $, chip } from '../components/ui.js';
import { FE, track, getSessionId } from '../telemetry.js';

export async function render(root, ctx) {
  const { store, data, api, toast } = ctx;
  await data.ensureSubjects();
  const subject = data.activeSubject();
  const llm = store.get().health?.llm || {};
  const configured = typeof llm === 'object' ? llm.configured : false;

  root.innerHTML = `
    <div class="view-head">
      <div><p class="eyebrow">Gemini · capa adaptativa</p><h1>IA backend-only</h1>
        <p>Gemini acompana con feedback y practica nueva. <strong>No decide la nota</strong>: el score lo fija el nucleo determinista. La API key se guarda en el backend, nunca en el navegador.</p></div>
    </div>

    <div class="grid grid-2">
      <section class="card">
        <div class="card-head"><h2>Estado</h2>${chip(configured ? 'Configurado' : 'No configurado', configured ? 'ok' : 'warn')}</div>
        ${configured
          ? `<p class="muted">Modelo activo: <strong>${escapeHtml(llm.model || '—')}</strong>${llm.keyPreview ? ` · key ${escapeHtml(llm.keyPreview)}` : ''}</p>
             <p class="muted" style="margin-top:6px">Fuente de la clave: ${escapeHtml(llm.keySource || 'backend')}.</p>`
          : `<p class="muted">Sin IA activa el cockpit funciona igual: la practica adaptativa se genera del contrato determinista.</p>`}
      </section>

      <section class="card">
        <div class="card-head"><h2>Configuracion local</h2></div>
        <p class="muted" style="margin-bottom:12px">Crea una API key en Google AI Studio y pegala aca. Se guarda en el backend runtime.</p>
        <div class="grid" style="gap:10px">
          <label class="field"><span>API key</span><input class="input" id="apiKey" type="password" autocomplete="off" placeholder="AIza..."></label>
          <label class="field"><span>Modelo</span><input class="input" id="model" value="${escapeHtml((typeof llm === 'object' && llm.model) || 'gemini-2.5-flash')}"></label>
          <button class="btn btn-primary" id="saveBtn">Guardar Gemini</button>
        </div>
      </section>
    </div>

    <section class="card section">
      <div class="card-head"><h2>Feedback conversacional</h2><span class="ai-flag">★ Respuesta generada por IA · no auditada</span></div>
      <p class="muted" style="margin-bottom:10px">Escribi tu respuesta o consulta sobre ${escapeHtml(subject.name)}. Gemini devuelve feedback; el score sigue siendo determinista.</p>
      <textarea class="textarea" id="answer" placeholder="Pega tu respuesta o consulta..."></textarea>
      <div class="btn-row" style="margin-top:10px"><button class="btn btn-soft" id="reviewBtn">Pedir feedback</button></div>
      <div id="reviewOut" class="section"></div>
    </section>
  `;

  $('#saveBtn', root).addEventListener('click', async (e) => {
    const apiKey = $('#apiKey', root).value.trim();
    const model = $('#model', root).value.trim() || 'gemini-2.5-flash';
    if (apiKey.length < 20) { toast('La API key parece invalida', 'bad'); return; }
    e.target.disabled = true;
    try {
      const res = await api.llmConfig({ subjectId: subject.id, sessionId: getSessionId(), apiKey, model });
      $('#apiKey', root).value = '';
      await ctx.refreshHealth();
      toast(`Gemini configurado (${res.model})`, 'ok');
      ctx.go('gemini');
    } catch (err) {
      toast('No se pudo guardar: ' + err.message, 'bad');
      e.target.disabled = false;
    }
  });

  $('#reviewBtn', root).addEventListener('click', async (e) => {
    const answer = $('#answer', root).value.trim();
    const out = $('#reviewOut', root);
    out.innerHTML = `<div class="card"><span class="inline-load"><span class="spinner"></span>Consultando a Gemini...</span></div>`;
    e.target.disabled = true;
    try {
      const st = store.get();
      const res = await api.llmReview({
        subjectId: subject.id,
        sessionId: getSessionId(),
        blockId: st.activeBlockId || null,
        answer,
        deterministicResult: (st.lastScore && st.lastScoreSubject === subject.id) ? st.lastScore : null
      });
      track(FE.GEMINI_USED, { mode: 'review', status: res.status }, subject.id);
      const fb = res.structuredFeedback || {};
      out.innerHTML = `<div class="card">
        <div class="card-head"><h3>${res.status === 'completed' ? 'Feedback de Gemini' : 'Sin IA activa'}</h3>${chip(res.configured ? 'IA' : 'determinista', res.configured ? 'warn' : 'cyan')}</div>
        <p>${escapeHtml(fb.feedback || res.message || '')}</p>
        ${(fb.study_actions || []).length ? `<div class="sb-section"><strong>Acciones sugeridas</strong><ul>${fb.study_actions.map((a) => `<li class="muted">${escapeHtml(a)}</li>`).join('')}</ul></div>` : ''}
        ${res.configured ? '<p class="ai-flag" style="margin-top:10px">★ Contenido generado por IA · no auditado contra el contrato</p>' : ''}
      </div>`;
    } catch (err) {
      out.innerHTML = errorState(err.message);
    } finally {
      e.target.disabled = false;
    }
  });
}
