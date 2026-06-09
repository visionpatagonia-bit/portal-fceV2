import { escapeHtml, fmtDateTime } from '../format.js';
import { loadingState, errorState, emptyState, $, delegate, chip } from '../components/ui.js';
import { FE, track } from '../telemetry.js';

export async function render(root, ctx) {
  const { store, data, api, toast } = ctx;
  root.innerHTML = loadingState('Cargando biblioteca adaptativa...');

  try {
    await data.ensureSubjects();
    const subject = data.activeSubject();
    const entries = (await api.kbList({ subjectId: subject.id, limit: 80 })).entries || [];
    store.set({ kbEntries: entries });

    root.innerHTML = `
      <div class="view-head">
        <div><p class="eyebrow">KB adaptativa · ${escapeHtml(subject.name)}</p><h1>Contenido guardado para reutilizar</h1>
          <p>La KB evita gastar Gemini dos veces para el mismo hueco. Cada entrada queda como <strong>generada / no auditada</strong> hasta validarla contra el contrato: reutilizable no significa canonica.</p></div>
        <button class="btn" data-go="aprender">Generar contenido</button>
      </div>

      <div class="note-banner">Flujo correcto: <strong>Reusar</strong> para entrenar rapido → <strong>Auditar</strong> antes de canonizar → <strong>Migrar</strong> a Firestore/portal.</div>

      <div id="kbList" class="row-list section">
        ${entries.length ? entries.map((e) => kbRow(e)).join('') : emptyState('KB vacia', 'Todavia no hay contenido adaptativo guardado. Genera una microclase con Gemini desde Aprender para poblar la KB.', '<button class="btn btn-primary" data-go="aprender">Ir a aprender</button>')}
      </div>
      <div id="kbDetail" class="section"></div>
    `;

    delegate(root, '[data-open]', 'click', async (_e, el) => {
      const detail = $('#kbDetail', root);
      detail.innerHTML = `<div class="card"><span class="inline-load"><span class="spinner"></span>Abriendo entrada...</span></div>`;
      try {
        const { entry } = await api.kbGet(el.dataset.open);
        detail.innerHTML = `<section class="card">
          <div class="card-head"><h3>${escapeHtml(entry.content?.lesson_title || entry.entryId)}</h3>
            <div class="btn-row">${chip(entry.quality?.reviewStatus || 'generated', 'warn')}<button class="btn btn-sm" id="closeDetail">Cerrar</button></div></div>
          <pre class="code">${escapeHtml(JSON.stringify(entry, null, 2))}</pre>
        </section>`;
        $('#closeDetail', root).addEventListener('click', () => { detail.innerHTML = ''; });
        detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (err) {
        detail.innerHTML = errorState(err.message);
      }
    });

    delegate(root, '[data-reuse]', 'click', (_e, el) => {
      const entry = entries.find((x) => x.entryId === el.dataset.reuse);
      if (!entry) return;
      track(FE.KB_REUSED, { entryId: entry.entryId, blockId: entry.blockId }, subject.id);
      toast('Reutilizando contenido en Aprender', 'ok');
      ctx.go('aprender', { block: entry.blockId, gen: '1' });
    });

    delegate(root, '[data-audit]', 'click', (_e, el) => {
      track('fe_kb_flag_audit', { entryId: el.dataset.audit }, subject.id);
      el.textContent = 'Marcado para auditar ✓';
      el.disabled = true;
      toast('Entrada marcada para auditoria', 'ok');
    });
  } catch (err) {
    root.innerHTML = errorState(err.message, 'data-retry="kb"');
  }
}

function kbRow(e) {
  return `<article class="card kb-row">
    <div>
      <p class="eyebrow" style="margin-bottom:4px">${escapeHtml(e.blockLabel || e.blockId)}</p>
      <h3>${escapeHtml(e.title || 'Contenido adaptativo')}</h3>
      <div class="meta-line">
        ${chip(e.llmUsed ? 'origen: IA' : 'origen: contrato', e.llmUsed ? 'warn' : 'cyan')}
        ${chip('generated_unreviewed')}
        ${chip('reusos ' + (e.reuseCount || 0))}
        ${chip(fmtDateTime(e.updatedAt || e.createdAt))}
      </div>
    </div>
    <div class="btn-row" style="flex-direction:column;align-items:stretch">
      <button class="btn btn-sm" data-open="${escapeHtml(e.entryId)}">Abrir</button>
      <button class="btn btn-sm btn-soft" data-reuse="${escapeHtml(e.entryId)}">Reutilizar</button>
      <button class="btn btn-sm" data-audit="${escapeHtml(e.entryId)}">Marcar para auditar</button>
    </div>
  </article>`;
}
