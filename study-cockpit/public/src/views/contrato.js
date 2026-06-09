import { escapeHtml } from '../format.js';
import { loadingState, errorState, $, chip } from '../components/ui.js';

export async function render(root, ctx) {
  const { data } = ctx;
  root.innerHTML = loadingState('Cargando contrato academico...');

  try {
    await data.ensureSubjects();
    const subject = data.activeSubject();
    const contract = await data.ensureContract(subject.folder);
    if (!contract) { root.innerHTML = errorState('No hay contrato para esta materia.'); return; }

    const a = contract.assessment || {};
    const families = contract.conceptFamilies || [];
    const blocks = contract.blocks || [];

    root.innerHTML = `
      <div class="view-head">
        <div><p class="eyebrow">Contrato academico · ${escapeHtml(subject.name)}</p><h1>${escapeHtml(contract.subject?.name || subject.name)}</h1>
          <p>El contrato define que entra, cuanto pesa y que evidencia pide cada bloque. Es la fuente de verdad del scoring.</p></div>
      </div>

      <div class="kv">
        <div class="tile"><span>Total</span><b>${escapeHtml(a.totalPoints ?? '—')} pts</b></div>
        <div class="tile"><span>Aprobacion</span><b>${escapeHtml(a.passPoints ?? '—')} pts</b></div>
        <div class="tile"><span>Promocion</span><b>${escapeHtml(a.promotionPoints ?? '—')} pts</b></div>
        <div class="tile"><span>Familias</span><b>${families.length}</b></div>
      </div>

      <div class="grid grid-2 section">
        <section class="card">
          <div class="card-head"><h2>Familias de conceptos</h2></div>
          <div class="row-list">
            ${families.map((f) => `<div class="tile"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>${escapeHtml(f.label)}</strong>${chip(f.priority || 'normal', f.priority === 'high' ? 'cyan' : '')}</div><p class="muted" style="margin-top:6px;font-size:13px">${escapeHtml((f.concepts || []).join(', '))}</p></div>`).join('')}
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>Bloques del examen</h2></div>
          <div class="row-list">
            ${blocks.map((b, i) => `<div class="tile"><div style="display:flex;justify-content:space-between;gap:8px"><strong>${i + 1}. ${escapeHtml(b.label)}</strong><span class="t-end">${escapeHtml(b.points)} pts</span></div><span class="dim" style="font-size:12px">${escapeHtml(b.kind)} · ${escapeHtml(b.id)}</span></div>`).join('')}
          </div>
        </section>
      </div>

      <section class="card section">
        <details><summary style="cursor:pointer;font-weight:700">Ver JSON del contrato</summary>
          <pre class="code" style="margin-top:12px">${escapeHtml(JSON.stringify(contract, null, 2))}</pre>
        </details>
      </section>
    `;
  } catch (err) {
    root.innerHTML = errorState(err.message, 'data-retry="contrato"');
  }
}
