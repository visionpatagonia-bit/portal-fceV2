import { escapeHtml, fmtDateTime } from '../format.js';
import { loadingState, errorState, $, chip } from '../components/ui.js';

// Mi biblioteca: consolida TODO lo que el alumno genero/guardo en su navegador (re-explicaciones,
// preguntas respondidas, correcciones con respuesta modelo). Buscable. Es su material adaptativo,
// reunido en un solo lugar y disponible para repasar. Persiste en localStorage (sin login = por navegador).
const lsGet = (k, def) => { try { return JSON.parse(localStorage.getItem(k) || def); } catch { return JSON.parse(def); } };

function collectItems(subjectId) {
  const items = [];
  // 1) Re-explicaciones ("No entendi este")
  const rx = lsGet('nexus.reexplain.' + subjectId, '{}');
  Object.entries(rx).forEach(([blockId, byConcept]) => {
    Object.entries(byConcept || {}).forEach(([concept, data]) => {
      items.push({ kind: 'reexplicacion', blockId, title: data.title || concept, body: data.explanation || '', extra: data.exam_trigger || '', tag: 'Explicado de otra forma' });
    });
  });
  // 2) Preguntas respondidas
  const asks = lsGet('nexus.asks.' + subjectId, '{}');
  Object.entries(asks).forEach(([blockId, list]) => {
    (list || []).filter((q) => q && q.source !== 'contract_fallback').forEach((q) => {
      items.push({ kind: 'pregunta', blockId, title: q.question || 'Pregunta', body: q.respuesta || q.answer || '', extra: '', tag: 'Pregunta resuelta' });
    });
  });
  // 3) Correcciones del ultimo repaso (con respuesta modelo)
  const reviews = lsGet('nexus.review.' + subjectId, '[]');
  (reviews[0]?.items || []).forEach((it) => {
    (it.corrections || []).forEach((c) => {
      items.push({ kind: 'correccion', blockId: it.blockId, title: c.titulo || 'Punto a reforzar', body: c.texto || '', extra: c.respuestaModelo ? ('Respuesta modelo: ' + c.respuestaModelo) : '', tag: 'Correccion' });
    });
  });
  return items;
}

const KIND_TONE = { reexplicacion: 'cyan', pregunta: 'warn', correccion: 'ok' };

export async function render(root, ctx) {
  const { data } = ctx;
  root.innerHTML = loadingState('Abriendo tu biblioteca...');
  try {
    await data.ensureSubjects();
    const subject = data.activeSubject();
    if (!subject) { root.innerHTML = errorState('No hay materias disponibles.'); return; }
    const items = collectItems(subject.id);

    root.innerHTML = `
      <div class="view-head">
        <div><p class="eyebrow">Mi biblioteca · ${escapeHtml(subject.name)}</p><h1>Tu material adaptativo</h1>
          <p>Todo lo que fuiste generando: re-explicaciones, preguntas resueltas y correcciones con respuesta modelo. Buscalo y repasalo cuando quieras.</p></div>
        <button class="btn" data-go="aprender">Generar mas</button>
      </div>
      ${items.length ? `
        <div class="ask-row section" style="max-width:520px">
          <input class="input" id="bibSearch" placeholder="Buscar en tu material..." autocomplete="off">
          ${chip(items.length + ' guardados', 'cyan')}
        </div>
        <div id="bibList" class="grid section" style="gap:12px">${items.map(card).join('')}</div>
      ` : `<section class="card section"><div class="card-head"><h2>Todavia vacia</h2></div>
        <p class="muted">Cuando uses "No entendi este", hagas preguntas o recibas correcciones, todo queda guardado aca para repasar.</p>
        <div class="btn-row" style="margin-top:10px"><button class="btn btn-primary" data-go="aprender">Ir a aprender</button></div></section>`}
    `;

    const search = $('#bibSearch', root);
    if (search) {
      search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        const filtered = q ? items.filter((it) => (it.title + ' ' + it.body + ' ' + it.extra).toLowerCase().includes(q)) : items;
        $('#bibList', root).innerHTML = filtered.length ? filtered.map(card).join('') : '<p class="muted">Nada coincide con tu busqueda.</p>';
      });
    }
  } catch (err) {
    root.innerHTML = errorState(err.message, 'data-retry="biblioteca"');
  }
}

function card(it) {
  return `<section class="card">
    <div class="card-head" style="margin-bottom:8px"><h3 style="font-size:15px">${escapeHtml(it.title)}</h3>${chip(it.tag, KIND_TONE[it.kind] || 'cyan')}</div>
    ${it.body ? `<p class="muted" style="line-height:1.5">${escapeHtml(it.body)}</p>` : ''}
    ${it.extra ? `<p class="model-answer" style="margin-top:8px">${escapeHtml(it.extra)}</p>` : ''}
    <div class="btn-row" style="margin-top:10px"><button class="btn btn-sm btn-soft" data-go="aprender" data-params='{"block":"${escapeHtml(it.blockId || '')}"}'>Ir al bloque</button></div>
  </section>`;
}
