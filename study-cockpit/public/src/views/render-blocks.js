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
  // #16 imagen en la consigna (subject-agnostic): item.image (por variante) o block.image (fija).
  // Fidelidad al formato real: si el parcial tiene un cuadro/tabla/esquema, el contrato lo referencia.
  const imgSrc = (item && item.image) || block.image || null;
  const imgHtml = imgSrc ? `<figure class="q-figure"><img class="q-image" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(block.label || 'consigna')}" loading="lazy"></figure>` : '';
  let body;
  switch (type) {
    case 'cloze': body = clozeBody(block, item); break;
    case 'debe_haber': case 'ledger_entry': body = debeHaberBody(block); break;
    case 'choice': body = choiceBody(block, item); break;
    case 'calculation': body = calcBody(block); break;
    default: body = `<textarea class="textarea" id="${block.id}__txt" placeholder="Escribi tu respuesta tecnica..." autocomplete="off" autocorrect="off" spellcheck="false"></textarea>`;
  }
  return `<section class="card" data-block="${escapeHtml(block.id)}" data-type="${escapeHtml(type)}" data-input="${escapeHtml(g.input || block.id)}">${head}${promptHtml}${imgHtml}${body}${jolControl(block.id)}</section>`;
}

// #2 JOL (Judgment of Learning): el alumno autoevalua su confianza en ESTE bloque ANTES de corregir.
// Metacognicion (Nelson & Narens); el motor lo IGNORA — se compara contra el resultado real en
// Devolucion para detectar sobreconfianza por tema. type="button" para no disparar el submit del form.
export function jolControl(blockId) {
  return `<div class="jol-row" data-jol-block="${escapeHtml(blockId)}" style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
    <span class="muted" style="font-size:12px">¿Qué tan seguro estás de este bloque?</span>
    <div class="jol-pick" role="group" aria-label="Confianza en el bloque">
      <button type="button" class="btn btn-sm jol-btn" data-jol="flojo" aria-pressed="false">Inseguro</button>
      <button type="button" class="btn btn-sm jol-btn" data-jol="medio" aria-pressed="false">Más o menos</button>
      <button type="button" class="btn btn-sm jol-btn" data-jol="seguro" aria-pressed="false">Seguro</button>
    </div>
  </div>`;
}

// Cloze: el prompt lleva marcadores {{gapId}}; se reemplazan por inputs inline entre el texto.
function clozeBody(block, item) {
  const text = (item && item.prompt) || '';
  const gapById = {}; (block.grading.gaps || []).forEach((g) => { gapById[g.id] = g; });
  let html = ''; let last = 0; const re = /\{\{(\w+)\}\}/g; let m;
  while ((m = re.exec(text))) {
    html += escapeHtml(text.slice(last, m.index));
    const gid = m[1]; const g = gapById[gid] || {};
    if (Array.isArray(g.options) && g.options.length) {
      // Hueco tipo "elegir de una lista" (Moodle: select missing words / drag into text).
      html += `<select class="input cloze-blank cloze-select" id="${block.id}__${gid}" data-gap="${escapeHtml(gid)}"><option value="">— elegi —</option>${g.options.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}</select>`;
    } else {
      html += `<input class="input cloze-blank" id="${block.id}__${gid}" data-gap="${escapeHtml(gid)}" ${g.numeric ? 'inputmode="decimal"' : ''} autocomplete="off" autocorrect="off" spellcheck="false">`;
    }
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

// Parser es-AR minimo para la visual (mismo criterio que el backend toNumber): punto=miles, coma=decimal.
function nEsAr(v) {
  let s = String(v == null ? '' : v).trim().replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  const hasComma = s.includes(','), hasDot = s.includes('.');
  if (hasComma && hasDot) s = s.replace(/\./g, '').replace(',', '.');
  else if (hasComma) s = s.replace(',', '.');
  else if (hasDot) { const p = s.split('.'); if (p.length > 2 || (p.length === 2 && p[1].length === 3)) s = p.join(''); }
  const x = parseFloat(s); return Number.isFinite(x) ? x : 0;
}
const fmtAr = (n) => (n || n === 0) ? Number(n).toLocaleString('es-AR') : '';
// Misma tolerancia que el motor (scoring.js near): max(2, |target|*0.5%). La visual NO puede ser mas
// estricta que la nota (si no, pintaria en rojo celdas que el motor cuenta como correctas).
const nearAr = (v, target) => Math.abs(v - target) <= Math.max(2, Math.abs(target) * 0.005);

// #8 Cuenta T / libro diario DETERMINISTA: muestra el asiento CORRECTO (modelo) y, si se pasa el
// intento del alumno, sus sumas y el DESBALANCE. Generado de los numeros (NO de un LLM).
export function ledgerVisual(rows, studentByRow) {
  let sumDc = 0, sumHc = 0, sumDs = 0, sumHs = 0;
  const body = (rows || []).map((r) => {
    const ed = r.debit != null ? r.debit : null;
    const ec = r.credit != null ? r.credit : null;
    sumDc += ed || 0; sumHc += ec || 0;
    const st = studentByRow ? studentByRow[r.id] : null;
    let tu = '';
    if (st) {
      const sd = nEsAr(st.debit), sc = nEsAr(st.credit);
      sumDs += sd; sumHs += sc;
      const dOk = (ed != null) ? nearAr(sd, ed) : sd === 0;
      const cOk = (ec != null) ? nearAr(sc, ec) : sc === 0;
      tu = `<td class="tu-amt ${dOk ? 'ok' : (sd ? 'bad' : '')}">${sd ? fmtAr(sd) : ''}</td><td class="tu-amt ${cOk ? 'ok' : (sc ? 'bad' : '')}">${sc ? fmtAr(sc) : ''}</td>`;
    }
    return `<tr><td>${escapeHtml(r.account || r.id)}</td><td class="t-amt">${ed != null ? fmtAr(ed) : ''}</td><td class="t-amt">${ec != null ? fmtAr(ec) : ''}</td>${tu}</tr>`;
  }).join('');
  const hasStudent = !!studentByRow;
  const balOk = nearAr(sumDs, sumHs) && sumDs > 0;
  return `<div class="ledger">
    <table class="ledger-table">
      <thead><tr><th>Cuenta</th><th colspan="2">Modelo correcto</th>${hasStudent ? '<th colspan="2">Tu asiento</th>' : ''}</tr>
        <tr class="sub"><th></th><th>Debe</th><th>Haber</th>${hasStudent ? '<th>Debe</th><th>Haber</th>' : ''}</tr></thead>
      <tbody>${body}
        <tr class="totals"><td>Totales</td><td class="t-amt">${fmtAr(sumDc)}</td><td class="t-amt">${fmtAr(sumHc)}</td>${hasStudent ? `<td class="tu-amt">${fmtAr(sumDs)}</td><td class="tu-amt">${fmtAr(sumHs)}</td>` : ''}</tr>
      </tbody>
    </table>
    ${hasStudent ? `<p class="ledger-bal ${balOk ? 'ok' : 'bad'}">${balOk ? '✓ Tu asiento balancea (Debe = Haber).' : `✗ Tu asiento NO balancea: Debe ${fmtAr(sumDs)} ≠ Haber ${fmtAr(sumHs)} (diferencia ${fmtAr(Math.abs(sumDs - sumHs))}).`}</p>` : ''}
  </div>`;
}
