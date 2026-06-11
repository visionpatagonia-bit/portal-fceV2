// Tutor dinamico (bundle "companero de estudio"): Gemini actua como tutor scoped que NO puntua.
// - #1 Desatasco socratico: mini-chat enjaulado (te hace preguntas, no te da la respuesta).
// - #2 Analogia ("peras y manzanas").
// - #3 Pistas en cascada (3 hints, la 3ra parcial).
// - #7 Tono dinamico: userState (de tu historial) ajusta el registro del tutor.
// El motor determinista sigue siendo la unica autoridad de la nota.
import { escapeHtml } from './format.js';
import { delegate } from './components/ui.js';
import { getHistory } from './progress.js';

// #7: deriva el "estado" del alumno de su historial para que el tutor ajuste el tono.
export function userState(subjectId) {
  const h = getHistory(subjectId);
  if (!h.length) return { level: 'new' };
  const last = h[h.length - 1];
  const v = last.notaEstimada != null ? last.notaEstimada : last.total;
  const prev = h.length >= 2 ? (h[h.length - 2].notaEstimada != null ? h[h.length - 2].notaEstimada : h[h.length - 2].total) : null;
  let level = 'neutral';
  if (v < 4) level = 'struggling';
  else if (v >= 7) level = 'confident';
  else if (prev != null && v > prev) level = 'improving';
  return { level, lastScore: v };
}

// Botonera del tutor para pegar dentro de una correccion/concepto. Devuelve HTML; wireTutor maneja los clicks.
export function tutorButtons({ blockId, concept = '', missText = '' }) {
  const d = (k, v) => `data-${k}="${escapeHtml(String(v || ''))}"`;
  return `<div class="tutor-box">
    <div class="btn-row tutor-actions">
      <button class="btn btn-sm btn-ghost" data-tutor="socratic" ${d('tblock', blockId)} ${d('tconcept', concept)} ${d('tmiss', missText)}>No entiendo este paso</button>
      <button class="btn btn-sm btn-ghost" data-tutor="analogy" ${d('tblock', blockId)} ${d('tconcept', concept)}>Peras y manzanas</button>
      <button class="btn btn-sm btn-ghost" data-tutor="hints" ${d('tblock', blockId)} ${d('tmiss', missText || concept)}>Pistas</button>
      <button class="btn btn-sm btn-ghost" data-tutor="devil" ${d('tblock', blockId)} ${d('tmiss', missText || concept)}>¿Y si lo dejo asi?</button>
    </div>
    <div class="tutor-slot"></div>
  </div>`;
}

const sessions = new Map(); // sid -> { history, blockId, concept, missText }
let _sid = 0;
const loading = (t) => `<div class="inline-load" style="margin-top:8px"><span class="spinner"></span>${escapeHtml(t)}</div>`;
const analogyHtml = (a) => `<div class="tutor-msg"><span class="tutor-flag">Peras y manzanas</span><p>${escapeHtml(a)}</p></div>`;

// #10 Shadow prompting: precache de la analogia del bloque #1 mientras el alumno lee la devolucion.
// Cache por blockId (robusto: cualquier click de analogia en ese bloque responde al instante). Una
// sola llamada especulativa por bloque, con guardas para no quemar cuota.
const analogyCache = new Map();
const analogyInflight = new Set();
export function precacheAnalogy(ctx, subject, blockId, concept) {
  if (!blockId || analogyCache.has(blockId) || analogyInflight.has(blockId)) return;
  analogyInflight.add(blockId);
  ctx.api.analogy({ subjectId: subject.id, blockId, concept: concept || '', userState: userState(subject.id) })
    .then((r) => { if (r && r.analogia) { if (analogyCache.size > 20) analogyCache.clear(); analogyCache.set(blockId, r.analogia); } })
    .catch(() => {})
    .finally(() => analogyInflight.delete(blockId));
}

function appendMsg(slot, role, text) {
  const log = slot.querySelector('.socratic-log');
  if (!log) return;
  const div = document.createElement('div');
  div.className = 'socratic-line ' + (role === 'tutor' ? 'is-tutor' : 'is-me');
  div.innerHTML = `<b>${role === 'tutor' ? 'Tutor' : 'Vos'}:</b> ${escapeHtml(text)}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

async function runSocratic(slot, sid, ctx, subject, studentMessage) {
  const s = sessions.get(sid);
  if (!s) return;
  if (studentMessage) { appendMsg(slot, 'me', studentMessage); s.history.push({ role: 'user', text: studentMessage }); }
  const think = slot.querySelector('.socratic-thinking'); if (think) think.style.display = '';
  try {
    const r = await ctx.api.socratic({
      subjectId: subject.id, blockId: s.blockId,
      context: { concept: s.concept, miss: s.missText },
      history: s.history.slice(0, -1), // el motor recibe la conversacion previa; studentMessage va aparte
      studentMessage, userState: userState(subject.id)
    });
    const msg = (r.turn && r.turn.message) || 'Pensemoslo de nuevo: ¿que dato del enunciado todavia no usaste?';
    appendMsg(slot, 'tutor', msg);
    s.history.push({ role: 'tutor', text: msg });
    if (r.turn && r.turn.solved) {
      const row = slot.querySelector('.socratic-row');
      if (row) row.innerHTML = '<span class="tutor-flag" style="color:var(--green)">✓ Llegaste solo. Cerralo y segui practicando.</span>';
    }
  } catch (_) {
    appendMsg(slot, 'tutor', 'No pude responder ahora (alta demanda). Reintenta en unos segundos.');
  } finally {
    const t = slot.querySelector('.socratic-thinking'); if (t) t.style.display = 'none';
  }
}

function chatShell(sid) {
  return `<div class="socratic-chat" data-sid="${sid}">
    <span class="tutor-flag">Desatasco socratico — te hago preguntas, no te doy la respuesta</span>
    <div class="socratic-log"></div>
    <div class="socratic-thinking muted" style="display:none;margin-top:6px"><span class="spinner"></span> pensando una pregunta...</div>
    <div class="socratic-row" style="display:flex;gap:8px;margin-top:8px">
      <input class="input socratic-input" placeholder="Escribi tu razonamiento..." autocomplete="off">
      <button class="btn btn-sm btn-primary" data-socratic-send="${sid}">Responder</button>
    </div>
  </div>`;
}

// Contexto activo (la vista actual). Se actualiza en cada render que renderiza botones de tutor; los
// listeners se enganchan UNA sola vez por root (evita acumular handlers -> llamadas duplicadas a Gemini).
let _active = null;

async function onTutorClick(el) {
  const cur = _active; if (!cur) return;
  const { ctx, subject } = cur;
  const box = el.closest('.tutor-box');
  const slot = box && box.querySelector('.tutor-slot');
  if (!slot) return;
  const kind = el.dataset.tutor;
  const blockId = el.dataset.tblock;
  const concept = el.dataset.tconcept || '';
  const missText = el.dataset.tmiss || '';

  if (kind === 'analogy') {
    const pre = analogyCache.get(blockId); // #10 shadow prompting: si ya estaba precacheada, instantanea
    if (pre) { slot.innerHTML = analogyHtml(pre); return; }
    slot.innerHTML = loading('Buscando una analogia...');
    try { const r = await ctx.api.analogy({ subjectId: subject.id, blockId, concept, userState: userState(subject.id) }); if (r && r.analogia) analogyCache.set(blockId, r.analogia); slot.innerHTML = analogyHtml(r.analogia || ''); }
    catch (_) { slot.innerHTML = '<p class="muted">No se pudo generar la analogia ahora. Reintenta en unos segundos.</p>'; }
    return;
  }
  if (kind === 'hints') {
    slot.innerHTML = loading('Preparando pistas...');
    try {
      const r = await ctx.api.hints({ subjectId: subject.id, blockId, missText, userState: userState(subject.id) });
      const hints = Array.isArray(r.hints) ? r.hints : [];
      slot.innerHTML = `<div class="tutor-msg"><span class="tutor-flag">Pistas en cascada</span>
        <div class="hints">${hints.map((h, i) => `<details class="hint" ${i === 0 ? 'open' : ''}><summary>Pista ${i + 1}${i === hints.length - 1 ? ' · resolucion parcial' : ''}</summary><p>${escapeHtml(h)}</p></details>`).join('')}</div></div>`;
    } catch (_) { slot.innerHTML = '<p class="muted">No se pudieron generar las pistas ahora. Reintenta en unos segundos.</p>'; }
    return;
  }
  if (kind === 'devil') {
    slot.innerHTML = loading('Pensando la consecuencia real...');
    try { const r = await ctx.api.devil({ subjectId: subject.id, blockId, missText, userState: userState(subject.id) }); slot.innerHTML = `<div class="tutor-msg tutor-devil"><span class="tutor-flag">Consecuencia en el mundo real</span><p>${escapeHtml(r.consecuencia || '')}</p></div>`; }
    catch (_) { slot.innerHTML = '<p class="muted">No se pudo generar ahora. Reintenta en unos segundos.</p>'; }
    return;
  }
  if (kind === 'socratic') {
    const sid = 's' + (_sid++);
    sessions.set(sid, { history: [], blockId, concept, missText });
    slot.innerHTML = chatShell(sid);
    await runSocratic(slot, sid, ctx, subject, 'Estoy atascado en este paso, ayudame a pensarlo.');
  }
}

async function onSocraticSend(el) {
  const cur = _active; if (!cur) return;
  const sid = el.dataset.socraticSend;
  const slot = el.closest('.tutor-slot');
  const input = slot && slot.querySelector('.socratic-input');
  const msg = input ? input.value.trim() : '';
  if (!msg) return;
  input.value = '';
  await runSocratic(slot, sid, cur.ctx, cur.subject, msg);
}

// Engancha los clicks del tutor. Idempotente por root: actualiza el contexto activo y solo agrega los
// listeners la primera vez (asi una re-render no acumula handlers ni dispara Gemini dos veces).
export function wireTutor(root, ctx, subject) {
  _active = { root, ctx, subject };
  if (root.__tutorWired) return;
  root.__tutorWired = true;
  delegate(root, '[data-tutor]', 'click', (_e, el) => onTutorClick(el));
  delegate(root, '[data-socratic-send]', 'click', (_e, el) => onSocraticSend(el));
  delegate(root, '.socratic-input', 'keydown', (e, el) => {
    if (e.key === 'Enter') { e.preventDefault(); const btn = el.closest('.socratic-row') && el.closest('.socratic-row').querySelector('[data-socratic-send]'); if (btn) onSocraticSend(btn); }
  });
}
