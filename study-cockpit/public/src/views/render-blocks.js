// Render DATA-DRIVEN de bloques de examen: elige el widget por block.grading.type (NO por materia ni
// por blockId), asi una misma funcion sirve a CUALQUIER materia. IDs deterministas (block.id__sub) para
// que el draft (snapshotForm/restoreForm) rehidrate solo. El frontend NO puntua: solo recolecta answers.
import { escapeHtml } from '../format.js';
import { chip } from '../components/ui.js';

// item = la pregunta de la variante para ese bloque (prompt/options), opcional.
export function renderBlock(block, item) {
  const g = block.grading || {};
  const type = g.type || 'text';
  const head = `<div class="card-head"><h3>${escapeHtml(block.label || block.id)}</h3>${chip((block.points != null ? block.points : 2) + ' pts')}</div>`;
  const showPrompt = type !== 'cloze' && item && item.prompt;
  const promptHtml = showPrompt ? `<p class="q-prompt">${escapeHtml(item.prompt)}</p>` : '';
  let body;
  switch (type) {
    case 'cloze': body = clozeBody(block, item); break;
    case 'debe_haber': case 'ledger_entry': body = debeHaberBody(block); break;
    case 'choice': body = choiceBody(block, item); break;
    case 'calculation': body = calcBody(block); break;
    default: body = `<textarea class="textarea" id="${block.id}__txt" placeholder="Escribi tu respuesta tecnica..." autocomplete="off" autocorrect="off" spellcheck="false"></textarea>`;
  }
  return `<section class="card" data-block="${escapeHtml(block.id)}" data-type="${escapeHtml(type)}" data-input="${escapeHtml(g.input || block.id)}">${head}${promptHtml}${body}</section>`;
}

// Cloze: el prompt lleva marcadores {{gapId}}; se reemplazan por inputs inline entre el texto.
function clozeBody(block, item) {
  const text = (item && item.prompt) || '';
  const gapById = {}; (block.grading.gaps || []).forEach((g) => { gapById[g.id] = g; });
  let html = ''; let last = 0; const re = /\{\{(\w+)\}\}/g; let m;
  while ((m = re.exec(text))) {
    html += escapeHtml(text.slice(last, m.index));
    const gid = m[1]; const g = gapById[gid] || {};
    html += `<input class="input cloze-blank" id="${block.id}__${gid}" data-gap="${escapeHtml(gid)}" ${g.numeric ? 'inputmode="decimal"' : ''} autocomplete="off" autocorrect="off" spellcheck="false">`;
    last = re.lastIndex;
  }
  html += escapeHtml(text.slice(last));
  return `<p class="muted" style="font-size:12.5px;margin-bottom:6px">Completa los espacios:</p><p class="cloze-text">${html}</p>`;
}

// Debe/Haber: tabla cuenta + dos columnas de montos (Debe / Haber).
function debeHaberBody(block) {
  const rows = block.grading.rows || [];
  return `<p class="muted" style="font-size:12.5px;margin-bottom:6px">Coloca los montos en la columna que corresponda. El asiento tiene que balancear (sumar Debe = sumar Haber).</p>
    <table class="dh-table"><thead><tr><th>Cuenta</th><th>Debe</th><th>Haber</th></tr></thead><tbody>
    ${rows.map((r) => `<tr>
      <td>${escapeHtml(r.account || r.id)}</td>
      <td><input class="input num dh-cell" id="${block.id}__${r.id}__debit" data-row="${escapeHtml(r.id)}" data-side="debit" inputmode="decimal" placeholder="0" autocomplete="off" autocorrect="off" spellcheck="false"></td>
      <td><input class="input num dh-cell" id="${block.id}__${r.id}__credit" data-row="${escapeHtml(r.id)}" data-side="credit" inputmode="decimal" placeholder="0" autocomplete="off" autocorrect="off" spellcheck="false"></td>
    </tr>`).join('')}
    </tbody></table>`;
}

function choiceBody(block, item) {
  const options = (item && Array.isArray(item.options)) ? item.options : [];
  if (!options.length) return `<textarea class="textarea" id="${block.id}__txt" placeholder="Respuesta..." autocomplete="off"></textarea>`;
  return `<div class="choice" style="display:grid;gap:8px">${options.map((o, i) => `<label><input type="radio" name="${block.id}" value="${i}"> ${escapeHtml(o)}</label>`).join('')}</div>`;
}

function calcBody(block) {
  const fields = (block.grading && block.grading.fields) || [];
  return `<div class="payroll-grid">${fields.map((f) => `<label class="field"><span>${escapeHtml(f.label || f.key)}</span><input class="input num" id="${block.id}__${f.key}" data-field="${escapeHtml(f.key)}" inputmode="decimal" placeholder="0" autocomplete="off" autocorrect="off" spellcheck="false"></label>`).join('')}</div>`;
}

// Recolecta answers SIEMPRE en answers[grading.input] derivado del contrato (nunca claves fijas),
// con la forma que espera cada grader determinista.
export function collectAnswers(blocks, root) {
  const answers = {};
  for (const block of blocks) {
    const g = block.grading || {};
    const input = g.input || block.id;
    const sec = root.querySelector(`[data-block="${cssEscape(block.id)}"]`);
    if (!sec) continue;
    const type = g.type || 'text';
    if (type === 'cloze') {
      const obj = {};
      sec.querySelectorAll('.cloze-blank').forEach((el) => { obj[el.dataset.gap] = el.value.trim(); });
      answers[input] = obj;
    } else if (type === 'debe_haber' || type === 'ledger_entry') {
      const byRow = {};
      sec.querySelectorAll('.dh-cell').forEach((el) => {
        const r = (byRow[el.dataset.row] = byRow[el.dataset.row] || { id: el.dataset.row });
        r[el.dataset.side] = el.value.trim();
      });
      answers[input] = { rows: Object.values(byRow) };
    } else if (type === 'choice') {
      const sel = sec.querySelector(`input[name="${cssEscape(block.id)}"]:checked`);
      answers[input] = sel ? sel.value : '';
    } else if (type === 'calculation') {
      const obj = {};
      sec.querySelectorAll('[data-field]').forEach((el) => { obj[el.dataset.field] = el.value.trim(); });
      answers[input] = obj;
    } else {
      const ta = sec.querySelector('textarea, input.input');
      answers[input] = ta ? ta.value.trim() : '';
    }
  }
  return answers;
}

function cssEscape(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }
