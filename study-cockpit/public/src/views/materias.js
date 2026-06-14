import { escapeHtml, subjectAccent } from '../format.js';
import { loadingState, errorState, chip } from '../components/ui.js';

const EXAM_KIND = {
  development: 'desarrollo escrito',
  'true-false': 'verdadero/falso',
  matching: 'asociacion',
  'short-answer': 'respuesta corta',
  choice: 'opcion multiple'
};

export async function render(root, ctx) {
  const { data } = ctx;
  root.innerHTML = loadingState('Cargando materias...');

  try {
    await data.ensureSubjects();
    const subjects = ctx.store.get().subjects;

    const cards = await Promise.all(subjects.map(async (s) => {
      const contract = await data.ensureContract(s.folder).catch(() => null);
      const plan = await data.ensurePlan(s.id).catch(() => null);
      return subjectCard(s, contract, plan, ctx);
    }));

    root.innerHTML = `
      <div class="view-head">
        <div>
          <p class="eyebrow">Paso 1</p>
          <h1>Elegi tu materia</h1>
          <p>Cada materia tiene su contrato de examen real: temas, bloques y tipo de evaluacion. Elegi una para empezar el recorrido guiado.</p>
        </div>
      </div>
      <div class="grid grid-2">${cards.join('')}</div>
    `;
  } catch (err) {
    root.innerHTML = errorState(err.message, 'data-retry="materias"');
  }
}

function subjectCard(s, contract, plan, ctx) {
  const families = contract?.conceptFamilies || [];
  const blocks = contract?.blocks || [];
  const kinds = [...new Set(blocks.map((b) => EXAM_KIND[b.kind] || b.kind).filter(Boolean))];
  const objetivo = plan?.northStar || contract?.assessment?.name || 'Aprobar el parcial con criterio.';
  const isActive = s.folder === ctx.store.get().activeSubjectId;

  return `
    <section class="card">
      <div class="card-head">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="badge ${subjectAccent(s.id)}" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;color:#fff;font-weight:800">${escapeHtml((s.name || '?').slice(0, 2).toUpperCase())}</span>
          <div><h2 style="font-size:18px">${escapeHtml(s.name)}</h2><span class="dim" style="font-size:12px">${blocks.length} bloques · ${contract?.assessment?.totalPoints ?? 10} puntos</span></div>
        </div>
        ${isActive ? chip('Activa', 'ok') : ''}
      </div>

      <div class="sb-section" style="border-top:0;padding-top:0">
        <strong>Objetivo</strong>
        <p class="muted">${escapeHtml(objetivo)}</p>
      </div>

      <div class="sb-section">
        <strong>Temas principales</strong>
        <div class="hero-status" style="margin-top:0">${families.length ? families.map((f) => chip(f.label, f.priority === 'high' ? 'cyan' : '')).join('') : '<span class="muted">Sin temas cargados.</span>'}</div>
      </div>

      <div class="sb-section">
        <strong>Tipo de examen</strong>
        <div class="hero-status" style="margin-top:0">${kinds.length ? kinds.map((k) => chip(k)).join('') : '<span class="muted">—</span>'}</div>
      </div>

      <div class="btn-row" style="margin-top:14px">
        <button class="btn btn-primary" data-select-subject="${escapeHtml(s.folder)}" data-go="aprender">Estudiar esta materia</button>
        <button class="btn" data-select-subject="${escapeHtml(s.folder)}" data-go="evaluar" data-params='${escapeHtml(JSON.stringify({ integrador: '1' }))}'>Examen integrador</button>
        <button class="btn" data-select-subject="${escapeHtml(s.folder)}" data-go="contrato">Ver contrato</button>
      </div>
    </section>
  `;
}
