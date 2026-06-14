import { escapeHtml } from '../format.js';
import { loadingState, errorState, $, chip } from '../components/ui.js';
import { FE, track, getSessionId } from '../telemetry.js';
import * as fb from '../firebase.js';
import { pushHistory, buildEntry, updateSRS } from '../progress.js';
import { userState } from '../tutor.js';
import { renderBlock, collectAnswers, jolControl } from './render-blocks.js';

export async function render(root, ctx, params = {}) {
  const { data, api, store, toast } = ctx;
  root.innerHTML = loadingState('Preparando el intento...');

  try {
    await data.ensureSubjects();
    const subject = data.activeSubject();
    const contract = await data.ensureContract(subject.folder).catch(() => null);

    // #9 micro-retest dirigido: re-test de UN bloque fallado (llega desde Aprender tras "Repasar esto ahora").
    if (params && params.retest && contract) { renderRetest(root, ctx, subject, contract, params.retest, { reformulate: params.reformulate === '1' }); return; }

    // Examen integrador (generico): trae su propio contrato fusionado (multi-tema/companions); no usa el base.
    if (params && params.integrador) { renderIntegrador(root, ctx, subject); return; }

    const head = `
      <div class="view-head">
        <div>
          <p class="eyebrow">Evaluar · ${escapeHtml(subject.name)}</p>
          <h1>Intento de examen real</h1>
          <p>Resolve como parcial: el backend corrige por bloques. El score no lo decide el frontend ni Gemini.</p>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="correctBtn">Corregir intento</button>
        </div>
      </div>`;

    if (subject.id === 'contabilidad_2p') {
      renderContabilidad(root, ctx, subject, contract);
    } else if (subject.id === 'administracion') {
      if (!contract?.variants?.length) { root.innerHTML = head + errorState('La materia no tiene variantes de examen.'); return; }
      renderAdmin(root, ctx, subject, contract);
    } else if (contract && (contract.blocks || []).some((b) => b.grading && b.grading.type)) {
      // Cualquier materia con bloques calificables se renderiza DATA-DRIVEN (por grading.type), sin
      // formulario bespoke. Asi sociales/propedeutica (y cualquier futura, con cloze/debe_haber) tienen
      // examen real sin tocar codigo: alcanza con el JSON del contrato.
      renderGeneric(root, ctx, subject, contract);
    } else {
      root.innerHTML = head + `<div class="note-banner">Esta materia todavia no tiene rubrica de correccion en el backend.</div>`;
    }
  } catch (err) {
    root.innerHTML = errorState(err.message, 'data-retry="evaluar"');
  }
}

/* ---------------- shared submit ---------------- */
// B-core (ADR-001): pipeline CANONICO de "intento corregido". TODO camino que corrige un intento
// (intento normal Y cada tema del simulacro) pasa por aca -> alimenta historial + SRS + learner-model
// (este ultimo ya es server-side en /api/attempts/score) + JOL + telemetria + persistencia. Antes el
// simulacro se salteaba historial/SRS/JOL. El motor sigue siendo el unico que puntua (regla de oro).
function onAttemptScored(ctx, subject, { result, answers, sessionId, attemptId, mode = 'practice', prediction = null, jol = {}, navigate = true, pipelineOnly = false, mergedContract = null }) {
  const { store, toast } = ctx;
  // ADR-001: sesion de 1 para el intento normal (la devolucion trabaja sobre store.lastSession). El
  // simulacro sobreescribe lastSession con la sesion de N temas despues de su loop.
  // #9 pipelineOnly: el micro-retest alimenta historial+SRS+BKT pero NO toca la sesion/nota (asi la
  // devolucion del simulacro queda intacta al volver — "vuelta sin perdida").
  if (!pipelineOnly) {
    // mergedContract presente = Examen integrador: la sesion se marca para que la devolucion use el
    // contrato fusionado (bloques namespaced) en vez del contrato base de la materia.
    const session1 = { subjectId: subject.id, mode, at: Date.now(), integrador: !!mergedContract, attempts: [{ label: subject.name, result, answers, jol, prediction, sessionId, attemptId, mode }] };
    store.set({ lastScore: result, lastScoreSubject: subject.id, lastSessionId: sessionId, lastAttemptId: attemptId, lastAnswers: answers, lastMode: mode, lastPrediction: prediction, lastJOL: jol, lastSession: session1, lastMergedContract: mergedContract || null });
  }
  if (prediction != null) track('fe_prediction_reported', { prediction, nota: result.notaEstimada != null ? result.notaEstimada : result.total, tecnico: result.total }, subject.id);
  if (Object.keys(jol).length) track('fe_jol_reported', { count: Object.keys(jol).length, mode }, subject.id);
  pushHistory(subject.id, buildEntry(result)); // historial para "Tu evolucion"
  updateSRS(subject.id, result); // agenda el repaso espaciado por bloque
  track(FE.ATTEMPT_CORRECTED, { total: result.total, notaEstimada: result.notaEstimada, status: result.estimatedStatus, mode }, subject.id);
  (result.weaknesses || []).forEach((w) => track(FE.WEAKNESS_DETECTED, { blockId: w.blockId, score: w.score }, subject.id));
  // Persistencia por UID (no-op si no hay login). Nunca recalcula la nota.
  fb.saveStudySession({ subjectId: subject.id, sessionId, attemptId, result });
  fb.saveAttempt({ subjectId: subject.id, sessionId, attemptId, result });
  clearDraft(subject.id); // intento corregido: el borrador ya no hace falta
  // Rota el parcial para el proximo intento (asi "la proxima vez" sale otro tema y se sigue entrenando).
  if (subject.id === 'contabilidad_2p' && mode === 'practice') bumpRot(subject.id);
  if (navigate) { toast(`Nota estimada: ${result.notaEstimada ?? result.total}/10`, 'ok'); ctx.go('devolucion'); }
}

function makeSubmit(root, ctx, subject) {
  const { api, store, toast } = ctx;
  // #2 JOL: un solo listener delegado (idempotente por root) para seleccionar la confianza por bloque.
  // Marca exclusiva dentro de cada .jol-pick y resalta el elegido (btn-primary). No toca answers ni nota.
  if (!root.__jolWired) {
    root.__jolWired = true;
    root.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('.jol-btn');
      if (!b || !root.contains(b)) return;
      const group = b.closest('.jol-pick'); if (!group) return;
      group.querySelectorAll('.jol-btn').forEach((x) => {
        const on = x === b;
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
        x.classList.toggle('btn-primary', on);
      });
    });
  }
  // Lee la confianza elegida por bloque (omite los que el alumno no marco).
  const collectJOL = () => {
    const jol = {};
    root.querySelectorAll('.jol-row[data-jol-block]').forEach((row) => {
      const pressed = row.querySelector('.jol-btn[aria-pressed="true"]');
      if (pressed) jol[row.dataset.jolBlock] = pressed.dataset.jol;
    });
    return jol;
  };
  return async function submit(answers, btn, mode = 'practice') {
    track(FE.ATTEMPT_STARTED, { subjectId: subject.id, mode }, subject.id);
    // #10: autopredecir_nota — en modos duros (parcial/simulacro) el alumno predice su nota ANTES
    // de corregir. Es metacognicion (calibracion comprension): el motor IGNORA esto, solo se compara
    // contra la nota real en Devolucion. La sorpresa "crei 8 / saque 5" es el disparador conductual.
    let prediction = null;
    if (mode === 'hard') {
      const raw = window.prompt('Antes de corregir: ¿que nota crees que te vas a sacar? (0 a 10)');
      if (raw != null && String(raw).trim() !== '') { const n = parseFloat(String(raw).replace(',', '.')); if (!Number.isNaN(n)) prediction = Math.max(0, Math.min(10, n)); }
    }
    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Corrigiendo...';
    try {
      const sessionId = getSessionId();
      const attemptId = `att_${Date.now()}`;
      const jol = collectJOL(); // Feature C: se envia al server para el historial de calibracion.
      const res = await api.scoreAttempt({ subjectId: subject.id, sessionId, attemptId, answers, mode, jol });
      // Pipeline unico (B-core): historial + SRS + learner-model + JOL + persistencia + navegacion.
      // lastAnswers (en memoria) habilita la cuenta T visual (#8) y la revision semantica (#6).
      onAttemptScored(ctx, subject, { result: res.result, answers, sessionId, attemptId, mode, prediction, jol, navigate: true });
    } catch (err) {
      toast('No se pudo corregir: ' + err.message, 'bad');
      btn.disabled = false; btn.textContent = original;
    }
  };
}

/* ---------------- borrador auto-guardado (no toca la nota) ---------------- */
// Borrador namespaceado por variante: cada tema (base o rotado gen_rot_<idx>) guarda el suyo, asi un
// fallo de carga de la rotacion NUNCA pisa el borrador del tema real, y no se mezclan respuestas.
function draftKeyBase(subjectId) { return 'nexus.draft.' + subjectId; }
function draftKey(subjectId, variantId) { return draftKeyBase(subjectId) + (variantId ? '.' + variantId : ''); }
function loadDraft(subjectId, variantId) { try { return JSON.parse(localStorage.getItem(draftKey(subjectId, variantId)) || 'null'); } catch { return null; } }
function saveDraft(subjectId, snap, variantId) {
  try { localStorage.setItem(draftKey(subjectId, variantId), JSON.stringify({ at: Date.now(), snap })); } catch { /* no-op */ }
}
// clearDraft(subjectId): barre TODOS los borradores de la materia (base + temas rotados) — se usa al
// corregir, para no dejar borradores huerfanos. clearDraft(subjectId, variantId): limpia solo ese tema.
function clearDraft(subjectId, variantId) {
  try {
    if (variantId !== undefined) { localStorage.removeItem(draftKey(subjectId, variantId)); return; }
    const base = draftKeyBase(subjectId);
    const rm = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k === base || (k && k.indexOf(base + '.') === 0)) rm.push(k); }
    rm.forEach((k) => localStorage.removeItem(k));
  } catch { /* no-op */ }
}

/* ---------------- rotacion del parcial (el tema cambia en cada intento) ---------------- */
// Contador por materia en localStorage. El backend elige bank[rot % N]; al corregir un intento
// se incrementa, asi "la proxima vez" sale otro tema. Determinista, sin depender de Gemini.
function rotKey(subjectId) { return 'nexus.examRotation.' + subjectId; }
function getRot(subjectId) { try { return parseInt(localStorage.getItem(rotKey(subjectId)), 10) || 0; } catch { return 0; } }
function bumpRot(subjectId) { try { localStorage.setItem(rotKey(subjectId), String(getRot(subjectId) + 1)); } catch { /* no-op */ } }

function snapshotForm(container) {
  const snap = { fields: {}, radios: {} };
  container.querySelectorAll('input, textarea, select').forEach((el) => {
    if (el.type === 'radio') { if (el.checked) snap.radios[el.name] = el.value; return; }
    if (el.id) snap.fields[el.id] = el.value;
  });
  return snap;
}
function snapshotHasContent(snap) {
  if (!snap) return false;
  const anyField = Object.values(snap.fields || {}).some((v) => String(v || '').trim());
  return anyField || Object.keys(snap.radios || {}).length > 0;
}
function restoreForm(container, snap) {
  if (!snap) return;
  // selects primero (re-renderizan preguntas dependientes), luego el resto
  Object.entries(snap.fields || {}).forEach(([id, v]) => {
    const el = container.querySelector('#' + id);
    if (el && el.tagName === 'SELECT') { el.value = v; el.dispatchEvent(new Event('change')); }
  });
  Object.entries(snap.fields || {}).forEach(([id, v]) => {
    const el = container.querySelector('#' + id);
    if (el && el.tagName !== 'SELECT') el.value = v;
  });
  Object.entries(snap.radios || {}).forEach(([name, v]) => {
    const el = container.querySelector(`input[name="${name}"][value="${v}"]`);
    if (el) el.checked = true;
  });
}

function timeAgo(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'recien'; if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} dia(s)`;
}

// Auto-guarda el form en localStorage mientras escribis y ofrece retomarlo si quedo a medias.
// variantId: identifica el tema del turno; un borrador de OTRO tema no se ofrece (se descarta) para
// no mezclar respuestas entre parciales distintos.
function setupDraft(root, ctx, subject, containerSel, variantId = null) {
  const container = $(containerSel, root);
  if (!container) return;
  // 1) ofrecer retomar el borrador de ESTE tema (cada variante tiene su propia key)
  const d = loadDraft(subject.id, variantId);
  if (d && d.snap && snapshotHasContent(d.snap)) {
    const banner = document.createElement('div');
    banner.className = 'note-banner draft-banner';
    banner.style.marginBottom = '14px';
    banner.innerHTML = `Tenes un intento sin terminar (${escapeHtml(timeAgo(d.at))}). <button class="btn btn-sm btn-primary" id="draftResume" style="margin-left:8px">Retomar</button> <button class="btn btn-sm" id="draftDiscard">Descartar</button>`;
    container.insertAdjacentElement('beforebegin', banner);
    $('#draftResume', banner).addEventListener('click', () => { restoreForm(container, d.snap); banner.remove(); ctx.toast('Borrador retomado', 'ok'); });
    $('#draftDiscard', banner).addEventListener('click', () => { clearDraft(subject.id, variantId); banner.remove(); });
  }
  // 2) auto-guardar (debounced) mientras se completa
  let t = null;
  const save = () => { clearTimeout(t); t = setTimeout(() => saveDraft(subject.id, snapshotForm(container), variantId), 1200); };
  container.addEventListener('input', save);
  container.addEventListener('change', save);
}

/* ---------------- Contabilidad ---------------- */
// Principio #1: los enunciados V/F y los prompts de desarrollo viven en el contrato
// (contract.baseForm: vfStatements, textPrompts, demoAnswers), NO hardcodeados aca.
const PAYROLL = [
  ['c_worker', 'Aportes retenidos'], ['c_net', 'Sueldo neto'], ['c_employer', 'Contribuciones'], ['c_cost', 'Costo empresa'],
  ['c_debitWages', 'Debe sueldos'], ['c_debitSocialCharges', 'Debe cargas'], ['c_creditPayrollPayable', 'Haber remuneraciones'], ['c_creditContributionsPayable', 'Haber aportes/contrib.']
];
// Consigna visible del Bloque C. Estos datos DEBEN coincidir con los expected del grader
// (exam-profile.json -> calculation_entry): bruto 500000, aportes 17% (=85000),
// contribuciones 26% (=130000). Asiento: Debe 500000+130000 = Haber 415000+215000 (balancea en 630000).
const PAYROLL_GIVENS = [
  ['Sueldo bruto', '$500.000'],
  ['Aportes (retencion al trabajador)', '17%'],
  ['Contribuciones patronales (a cargo del empleador)', '26%']
];

const miles = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
function scenarioGivens(sc) {
  return [
    ['Sueldo bruto', '$' + miles(sc.bruto)],
    ['Aportes (retencion al trabajador)', sc.pctAportes + '%'],
    ['Contribuciones patronales (a cargo del empleador)', sc.pctContrib + '%']
  ];
}
function givensHtml(givens) {
  return givens.map(([k, v]) => `<li><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></li>`).join('');
}

function payrollBlock(givens = PAYROLL_GIVENS) {
  return `
    <section class="card">
      <div class="card-head"><h3>Bloque C · Remuneraciones y asiento</h3>${chip('2 pts')}</div>
      <p class="muted" style="margin-bottom:10px">Liquida el sueldo del periodo y registra el asiento contable balanceado con estos datos:</p>
      <ul class="givens" id="payrollGivens">${givensHtml(givens)}</ul>
      <p class="hint">Aportes y contribuciones se calculan sobre el bruto. Ingresa los importes en pesos (acepta <code>500000</code> o <code>500.000</code>).</p>
      <div class="payroll-grid">
        ${PAYROLL.map(([id, label]) => `<label class="field"><span>${escapeHtml(label)}</span><input class="input num" id="${id}" inputmode="decimal" placeholder="0" autocomplete="off" autocorrect="off" spellcheck="false"></label>`).join('')}
      </div>
      <div class="ask-row" style="margin-top:12px">
        <input class="input" id="cDoubt" autocomplete="off" placeholder="¿Una duda con estos numeros? Ej: por que aca se divide y no se multiplica?">
        <button class="btn btn-soft" id="cDoubtBtn" type="button">Preguntar</button>
      </div>
      <div id="cDoubtSlot"></div>
    </section>`;
}

// variant (opcional): variante IA con scenario + vfStatements [{id,text}] + textPrompts {a_def,a_dev,a_case}.
// El examen BASE toma vfStatements/textPrompts de contract.baseForm (data, no hardcodeado).
function contabilidadForm(variant, baseForm) {
  const p = (variant && variant.textPrompts) || (baseForm && baseForm.textPrompts) || {};
  const vf = (variant && variant.vfStatements) || (baseForm && baseForm.vfStatements) || [];
  const givens = (variant && variant.scenario) ? scenarioGivens(variant.scenario) : PAYROLL_GIVENS;
  return `
    <div class="grid" style="gap:14px">
      ${variant ? '<div class="note-banner">✦ Examen generado por IA (no auditado). El calculo lo corrige el motor determinista; V/F y desarrollos son orientativos.</div>' : ''}
      ${textBlock('a_def', 'Bloque A · Definicion escrita', p.a_def || '')}
      <section class="card">
        <div class="card-head"><h3>Bloque B · Verdadero/Falso justificado</h3>${chip('2 pts')}</div>
        ${vf.map((it, i) => `
          <div class="sb-section" ${i === 0 ? 'style="border-top:0;padding-top:0"' : ''}>
            <p style="margin-bottom:8px">${escapeHtml(it.text)}</p>
            <div class="choice" style="grid-template-columns:1fr 1fr;display:grid;gap:8px">
              <label><input type="radio" name="${it.id}" value="V"> Verdadero</label>
              <label><input type="radio" name="${it.id}" value="F"> Falso</label>
            </div>
            <textarea class="textarea" id="${it.id}_j" style="min-height:64px;margin-top:8px" placeholder="Justificacion tecnica (corregi las falsas)" autocomplete="off" autocorrect="off" spellcheck="false"></textarea>
          </div>`).join('')}
      </section>
      ${payrollBlock(givens)}
      ${textBlock('a_dev', 'Bloque D · Auditoria y control', p.a_dev || '')}
      ${textBlock('a_case', 'Bloque E · Caso integrador', p.a_case || '')}
    </div>`;
}

// El enunciado se renderiza VISIBLE (no como placeholder, que se borra al escribir):
// el alumno puede releerlo mientras razona su respuesta.
function textBlock(id, title, prompt) {
  return `<section class="card"><div class="card-head"><h3>${escapeHtml(title)}</h3>${chip('2 pts')}</div>
    <p class="q-prompt">${escapeHtml(prompt)}</p>
    <textarea class="textarea" id="${id}" placeholder="Escribi tu respuesta tecnica..." autocomplete="off" autocorrect="off" spellcheck="false"></textarea></section>`;
}

function renderContabilidad(root, ctx, subject, contract) {
  let mode = 'practice';
  let rotVariant = null;  // tema rotado del turno (determinista, del banco); null = examen base
  let genVariant = null;  // examen activo: el rotado, o uno IA generado a mano, o null (base)
  // Modalidad del PARCIAL REAL (completar oraciones + Debe/Haber): vive en contract.hard y la corrige
  // el motor en modo 'hard'. La practica escrita (concept anchoring) queda intacta.
  const hard = (contract && contract.hard) || null;
  const hasReal = !!(hard && Array.isArray(hard.blocks) && hard.blocks.some((b) => b.grading && b.grading.type));
  const realBlocks = hard ? (hard.blocks || []) : [];
  const realVariant = hard ? ((hard.variants || [])[0] || null) : null;
  const realItemFor = (bid) => { const vb = realVariant && (realVariant.blocks || []).find((x) => x.blockId === bid); return (vb && vb.items && vb.items[0]) || null; };

  function paint() {
    stopTimer();
    const isReal = mode === 'real';
    root.innerHTML = `
      <div class="view-head">
        <div>
          <p class="eyebrow">Evaluar · ${escapeHtml(subject.name)}</p>
          <h1>${isReal ? 'Parcial real (modalidad nueva)' : 'Intento de examen real'}</h1>
          <p>${isReal
            ? 'Modalidad del parcial presencial: completar oraciones y colocar montos en Debe/Haber, sin desarrollo escrito. Cronometrado.'
            : 'Resolve como parcial escrito: el backend corrige por bloques. Te sirve para anclar los conceptos.'}</p>
        </div>
        <div class="btn-row" style="align-items:center">
          ${hasReal ? `<div class="segmented" role="group" aria-label="Modo de examen">
            <button id="modePractice" aria-pressed="${mode === 'practice'}">Practica escrita</button>
            <button id="modeReal" aria-pressed="${isReal}">Parcial real</button>
          </div>` : ''}
          ${isReal ? '<span class="chip warn" id="admTimer">--:--</span>' : '<button class="btn btn-soft" id="genCalcBtn" title="Gemini arma un examen nuevo (escenario de calculo + V/F + desarrollos); el calculo lo corrige el motor determinista">✦ Variante con IA</button>'}
          <button class="btn btn-primary" id="correctBtn">Corregir intento</button>
        </div>
      </div>
      <div id="contBody">${isReal ? realBlocks.map((b) => renderBlock(b, realItemFor(b.id))).join('') : contabilidadForm(genVariant, contract.baseForm)}</div>`;

    if (isReal) {
      const submit = makeSubmit(root, ctx, subject);
      $('#correctBtn', root).addEventListener('click', (e) => {
        const answers = collectAnswers(realBlocks, root);
        if (realVariant) answers.variantId = realVariant.id;
        submit(answers, e.currentTarget, 'hard'); // el motor usa contract.hard.blocks en modo hard
      });
      startTimer(40, () => $('#correctBtn', root)?.click());
      setupDraft(root, ctx, subject, '#contBody', 'real');
    } else {
      wireContabilidad(root, ctx, subject, mode, genVariant, (v) => { genVariant = v; paint(); });
    }
    $('#modePractice', root)?.addEventListener('click', () => { mode = 'practice'; genVariant = rotVariant; paint(); });
    $('#modeReal', root)?.addEventListener('click', () => { mode = 'real'; paint(); });
  }
  // Pide el tema rotado del turno (practica). El modo Parcial real usa su propio contrato (contract.hard).
  (async () => {
    try {
      const r = await ctx.api.nextExamVariant({ subjectId: subject.id, rotationIndex: getRot(subject.id) });
      if (r && r.variant && r.variant.scenario) rotVariant = r.variant;
    } catch (_) { rotVariant = null; }
    genVariant = (mode === 'practice') ? rotVariant : null;
    paint();
  })();
}

function wireContabilidad(root, ctx, subject, mode = 'practice', genVariant = null, onGenVariant = () => {}) {
  const submit = makeSubmit(root, ctx, subject);
  const val = (id) => ($(`#${id}`, root)?.value || '').trim();
  const radio = (name) => root.querySelector(`input[name="${name}"]:checked`)?.value || '';

  // Variante con IA: Gemini arma un examen nuevo (escenario + V/F + desarrollos). Al recibirlo se
  // repinta el form con ese contenido; el calculo lo corrige el motor, V/F/textos son orientativos.
  $('#genCalcBtn', root)?.addEventListener('click', async (ev) => {
    const btn = ev.currentTarget, orig = btn.textContent;
    btn.disabled = true; btn.textContent = 'Generando examen...';
    try {
      const res = await ctx.api.generateExamVariant({ subjectId: subject.id, sessionId: getSessionId() });
      if (res.source === 'gemini' && res.variant && res.variant.scenario) {
        ctx.toast('Examen IA generado: escenario nuevo' + (res.variant.vfStatements ? ', V/F y desarrollos' : ''), 'ok');
        onGenVariant(res.variant); // setea + repinta (muestra el examen IA completo)
        return;
      }
      ctx.toast(res.message || 'No se pudo generar ahora. Usa el examen del contrato.', 'warn');
    } catch (err) {
      ctx.toast('No se pudo generar: ' + (err.message || ''), 'bad');
    }
    btn.disabled = false; btn.textContent = orig;
  });

  // demo dev-only: el boton no se renderiza en la UI del alumno (rompia el flujo de estudio).
  $('#demoBtn', root)?.addEventListener('click', () => {
    // demo dev-only: las respuestas modelo viven en el contrato (baseForm.demoAnswers), no en codigo.
    const d = (contract.baseForm && contract.baseForm.demoAnswers) || {};
    const vfList = (contract.baseForm && contract.baseForm.vfStatements) || [];
    set(root, 'a_def', d.a_def || ''); set(root, 'a_dev', d.a_dev || ''); set(root, 'a_case', d.a_case || '');
    vfList.forEach((it) => {
      const r = root.querySelector(`input[name="${it.id}"][value="${(d.vf || {})[it.id] || ''}"]`); if (r) r.checked = true;
      set(root, `${it.id}_j`, (d.just || {})[it.id] || '');
    });
    Object.entries(d.nums || {}).forEach(([id, v]) => set(root, id, v));
    ctx.toast('Demo cargada', 'ok');
  });

  $('#correctBtn', root).addEventListener('click', (e) => {
    const vfIds = (genVariant && genVariant.vfStatements) ? genVariant.vfStatements.map((s) => ({ id: s.id })) : ((contract.baseForm && contract.baseForm.vfStatements) || []);
    const answers = {
      variantId: (genVariant && genVariant.id) || undefined,
      A: val('a_def'),
      B: Object.fromEntries(vfIds.map((it) => [it.id, { value: radio(it.id), justification: val(`${it.id}_j`) }])),
      C: { worker: val('c_worker'), net: val('c_net'), employer: val('c_employer'), cost: val('c_cost'), debitWages: val('c_debitWages'), debitSocialCharges: val('c_debitSocialCharges'), creditPayrollPayable: val('c_creditPayrollPayable'), creditContributionsPayable: val('c_creditContributionsPayable') },
      D: val('a_dev'), E: val('a_case')
    };
    submit(answers, e.currentTarget, mode);
  });

  // #9 Barra de duda en contexto: responde la microduda con los numeros EXACTOS del intento actual,
  // sin resetear el examen ni mandarte a la teoria general. La IA explica; no toca la nota.
  $('#cDoubtBtn', root)?.addEventListener('click', async () => {
    const q = val('cDoubt');
    if (!q) return;
    const slot = $('#cDoubtSlot', root);
    if (slot) slot.innerHTML = '<div class="inline-load" style="margin-top:8px"><span class="spinner"></span>Pensando con tus numeros...</div>';
    const sc = (genVariant && genVariant.scenario) ? genVariant.scenario : { bruto: 500000, pctAportes: 17, pctContrib: 26 };
    try {
      const res = await ctx.api.ask({ subjectId: subject.id, sessionId: getSessionId(), blockId: 'calculation_entry', question: q, scenarioContext: sc, userState: userState(subject.id) });
      const a = res.answer || {};
      if (slot) slot.innerHTML = `<div class="ai-card" style="margin-top:8px"><span class="ai-flag">IA · con tus numeros</span><p>${escapeHtml(a.respuesta || '')}</p>${a.dondeRepasar ? `<span class="trigger">${escapeHtml(a.dondeRepasar)}</span>` : ''}</div>`;
    } catch (_) { if (slot) slot.innerHTML = '<p class="muted" style="margin-top:8px">No se pudo responder ahora. Reintenta en unos segundos.</p>'; }
  });

  if (mode === 'practice') setupDraft(root, ctx, subject, '#contBody', genVariant && genVariant.id);
}

/* ---------------- Render generico data-driven (cualquier materia/modalidad) ---------------- */
// Recorre contract.blocks y pinta cada uno por su grading.type (renderBlock). Al corregir, recolecta
// answers[grading.input] (collectAnswers) y los manda al motor. Reusable por toda materia.
function renderGeneric(root, ctx, subject, contract) {
  // Si la materia declara contract.hard (modalidad "parcial real": ej. completar oraciones), se ofrece
  // el toggle Practica / Parcial real, igual que Contabilidad pero GENERICO (sirve a cualquier materia).
  const hard = contract.hard || null;
  const hasReal = !!(hard && Array.isArray(hard.blocks) && hard.blocks.some((b) => b.grading && b.grading.type));
  let mode = 'practice';
  function paint() {
    stopTimer();
    const isReal = mode === 'real';
    const src = isReal ? hard : contract;
    const blocks = (src.blocks || []).filter((b) => b.grading && b.grading.type);
    const variant = (src.variants || [])[0] || null;
    const itemFor = (blockId) => {
      const vb = variant && (variant.blocks || []).find((x) => x.blockId === blockId);
      return (vb && vb.items && vb.items[0]) || null;
    };
    // G2 multi: el bloque puede tener varios sub-items (preguntas) en la variante.
    const itemsFor = (blockId) => {
      const vb = variant && (variant.blocks || []).find((x) => x.blockId === blockId);
      return (vb && vb.items) || [];
    };
    root.innerHTML = `
      <div class="view-head">
        <div>
          <p class="eyebrow">Evaluar · ${escapeHtml(subject.name)}</p>
          <h1>${isReal ? 'Parcial real' : 'Intento de examen real'}</h1>
          <p>${isReal ? escapeHtml(hard.note || 'Modalidad del parcial real: completar oraciones. Cronometrado.') : 'Resolve como parcial: el backend corrige por bloques. El score no lo decide el frontend ni Gemini.'}</p>
        </div>
        <div class="btn-row" style="align-items:center">
          ${hasReal ? `<div class="segmented" role="group" aria-label="Modo de examen">
            <button id="modePractice" aria-pressed="${!isReal}">Practica</button>
            <button id="modeReal" aria-pressed="${isReal}">Parcial real</button>
          </div>` : ''}
          ${isReal ? '<span class="chip warn" id="admTimer">--:--</span>' : ''}
          <button class="btn btn-primary" id="correctBtn">Corregir intento</button>
        </div>
      </div>
      <div id="genBody" class="grid section" style="gap:14px">${blocks.map((b) => renderBlock(b, itemFor(b.id), itemsFor(b.id))).join('')}</div>`;
    const submit = makeSubmit(root, ctx, subject);
    $('#correctBtn', root).addEventListener('click', (e) => {
      const answers = collectAnswers(blocks, root);
      if (variant) answers.variantId = variant.id;
      submit(answers, e.currentTarget, isReal ? 'hard' : 'practice');
    });
    if (isReal) startTimer(40, () => $('#correctBtn', root)?.click());
    setupDraft(root, ctx, subject, '#genBody', isReal ? 'real' : (variant && variant.id));
    $('#modePractice', root)?.addEventListener('click', () => { mode = 'practice'; paint(); });
    $('#modeReal', root)?.addEventListener('click', () => { mode = 'real'; paint(); });
  }
  paint();
}

// EXAMEN INTEGRADOR (generico): pide el contrato fusionado al backend (multi-tema/companions), lo
// renderiza con el MISMO render data-driven (renderBlock), recolecta con collectAnswers (las keys
// namespaced fluyen solas) y corrige en el endpoint dedicado (clave autoritativa server-side). Reusa
// onAttemptScored guardando el merged contract en el store para que la devolucion lo use. Sin draft
// (para no pisar el borrador del examen normal de la materia, que comparte subject.id).
function renderIntegrador(root, ctx, subject) {
  const { api, store, toast } = ctx;
  root.innerHTML = loadingState('Armando el examen integrador...');
  api.integrador({ subjectId: subject.id }).then((resp) => {
    const merged = resp && resp.contract;
    const blocks = ((merged && merged.blocks) || []).filter((b) => b.grading && b.grading.type);
    if (!merged || !blocks.length) { root.innerHTML = errorState('No se pudo armar el examen integrador para esta materia.', 'data-retry="evaluar"'); return; }
    store.set({ lastMergedContract: merged }); // disponible para la devolucion aunque se navegue
    const variant = (merged.variants || [])[0] || null;
    const itemFor = (id) => { const vb = variant && (variant.blocks || []).find((x) => x.blockId === id); return (vb && vb.items && vb.items[0]) || null; };
    const itemsFor = (id) => { const vb = variant && (variant.blocks || []).find((x) => x.blockId === id); return (vb && vb.items) || []; };
    const sources = (merged.integrador && merged.integrador.sources) || [];
    stopTimer();
    root.innerHTML = `
      <div class="view-head">
        <div>
          <p class="eyebrow">Examen integrador · ${escapeHtml(subject.name)}</p>
          <h1>${escapeHtml((merged.subject && merged.subject.name) || 'Examen integrador')}</h1>
          <p>Un solo examen que integra ${sources.length > 1 ? 'todos los temas' : 'todo el contenido'} de la materia (${blocks.length} bloques, nota sobre 10), cronometrado como el parcial real. El backend corrige por bloques; el motor es el unico juez.</p>
        </div>
        <div class="btn-row" style="align-items:center">
          <span class="chip warn" id="admTimer">--:--</span>
          <button class="btn btn-primary" id="correctBtn">Corregir integrador</button>
        </div>
      </div>
      <div id="intBody" class="grid section" style="gap:14px">${blocks.map((b) => renderBlock(b, itemFor(b.id), itemsFor(b.id))).join('')}</div>`;
    $('#correctBtn', root).addEventListener('click', async (e) => {
      const btn = e.currentTarget; const original = btn.textContent;
      btn.disabled = true; btn.textContent = 'Corrigiendo...';
      stopTimer();
      const answers = collectAnswers(blocks, root);
      if (variant) answers.variantId = variant.id;
      const sessionId = getSessionId();
      const attemptId = 'int_' + Date.now();
      try {
        const res = await api.integradorScore({ subjectId: subject.id, sessionId, attemptId, answers });
        track(FE.ATTEMPT_CORRECTED, { total: res.result.total, notaEstimada: res.result.notaEstimada, mode: 'integrador' }, subject.id);
        onAttemptScored(ctx, subject, { result: res.result, answers, sessionId, attemptId, mode: 'practice', navigate: true, mergedContract: res.contract || merged });
      } catch (err) {
        toast('No se pudo corregir el integrador: ' + err.message, 'bad');
        btn.disabled = false; btn.textContent = original;
      }
    });
    startTimer(40, () => $('#correctBtn', root)?.click());
  }).catch((err) => { root.innerHTML = errorState(err.message || 'Error armando el integrador', 'data-retry="evaluar"'); });
}

/* ---------------- Administracion ---------------- */
const ADM_CHOICE = ['matching', 'true_false', 'case'];
const ADM_LABELS = { matching: 'Asociacion de conceptos', true_false: 'Verdadero / Falso', short_answer: 'Respuesta corta', development: 'Desarrollo tecnico', case: 'Caso integrador' };

function administracionForm(contract) {
  const variants = contract.variants;
  return `
    <section class="card" style="margin-bottom:14px">
      <div class="btn-row" style="align-items:end;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <label class="field" style="max-width:260px"><span>Tema / variante</span>
          <select class="input" id="variantSel">${variants.map((v) => `<option value="${escapeHtml(v.id)}">${escapeHtml(v.label)}</option>`).join('')}</select>
        </label>
        <button class="btn btn-soft btn-sm" id="genVariantBtn" title="Gemini arma una variante nueva con las reglas de la materia (practica autoevaluable)">✦ Generar variante con IA</button>
        <button class="btn btn-soft btn-sm" id="simBtn" title="Arma UNA sesion con TODOS los temas del contrato y los corrige juntos (cobertura completa)">⚡ Simulacro completo</button>
      </div>
    </section>
    <div id="genVariantPanel"></div>
    <div id="admQuestions" class="grid" style="gap:14px">${admQuestions(variants[0])}</div>`;
}

function admQuestions(variant, pfx = '', onlyBlock = null) {
  const order = ['matching', 'true_false', 'short_answer', 'development', 'case'].filter((b) => !onlyBlock || b === onlyBlock);
  return order.map((blockId) => {
    const item = (variant.blocks.find((b) => b.blockId === blockId) || {}).items?.[0];
    if (!item) return '';
    let body;
    if (blockId === 'true_false') {
      // Bug #4: V/F con justificacion (como Contabilidad). Marca V/F + justifica si es Falsa.
      body = `<div class="choice" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <label><input type="radio" name="${pfx}true_false" value="V"> Verdadero</label>
          <label><input type="radio" name="${pfx}true_false" value="F"> Falso</label>
        </div>
        <textarea class="textarea" id="${pfx}adm_tf_just" style="min-height:56px;margin-top:8px" placeholder="Si la afirmacion es FALSA, justifica por que (corregila)." autocomplete="off" autocorrect="off" spellcheck="false"></textarea>`;
    } else if (ADM_CHOICE.includes(blockId)) {
      body = `<div class="choice">${(item.options || []).map((opt, idx) => `<label><input type="radio" name="${pfx}${blockId}" value="${idx}"> ${escapeHtml(opt)}</label>`).join('')}</div>`;
    } else {
      body = `<textarea class="textarea" id="${pfx}adm_${blockId}" placeholder="Desarrolla con vocabulario tecnico de la materia." autocomplete="off" autocorrect="off" spellcheck="false"></textarea>`;
    }
    return `<section class="card">
      <div class="card-head"><h3>${escapeHtml(ADM_LABELS[blockId])}</h3>${chip('2 pts')}</div>
      <p style="margin-bottom:10px">${escapeHtml(item.prompt)}</p>
      ${item.image ? `<figure class="q-figure"><img class="q-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(ADM_LABELS[blockId] || 'consigna')}" loading="lazy"></figure>` : ''}
      ${body}
      ${jolControl(pfx + blockId)}
    </section>`;
  }).join('');
}

// #9 Micro-retest dirigido: re-test de UN bloque fallado tras estudiarlo (cierra el loop devolución →
// aprender → re-test → devolución). Puntúa SOLO ese bloque (onlyBlocks) y lo manda por el pipeline
// canónico (pipelineOnly: historial+SRS+BKT) SIN tocar la sesión del simulacro. Resultado focalizado
// con CTAs (loop, no terminal). El motor sigue siendo el único juez.
function renderRetest(root, ctx, subject, contract, blockId, opts = {}) {
  const sess = ctx.store.get().lastSession;
  const att = (sess && Array.isArray(sess.attempts)) ? sess.attempts.find((a) => a.result && a.result.blocks && a.result.blocks[blockId]) : null;
  const label = (att && att.result.blocks[blockId] && att.result.blocks[blockId].label) || blockId;
  const isAdmin = subject.id === 'administracion';
  // GB (reformulación, B): conceptos que el alumno YA demostró antes y omitió acá (HÁBITO). Si se pidió
  // reformular y los hay, el re-test pide reescribir INCLUYÉNDOLOS — práctica de PRODUCCIÓN del registro
  // técnico (el gap exacto técnico-vs-nota). Corrección determinista (los terms se chequean con el grader).
  const habitTerms = (att && att.result.blocks[blockId] && Array.isArray(att.result.blocks[blockId].lexical))
    ? att.result.blocks[blockId].lexical.filter((x) => !x.hit && x.seenBefore).map((x) => x.label)
    : [];
  const reformulate = !!opts.reformulate && habitTerms.length > 0;

  let bodyHtml = '';
  let collect = null;
  if (isAdmin) {
    const variant = (att && att.answers && att.answers.variantId && (contract.variants || []).find((v) => v.id === att.answers.variantId)) || (contract.variants || [])[0];
    if (!variant) { renderRetestFallback(root, label); return; }
    bodyHtml = admQuestions(variant, 'rt_', blockId);
    collect = () => {
      const radio = (n) => root.querySelector(`input[name="${n}"]:checked`)?.value;
      const val = (id) => ($('#' + id, root)?.value || '').trim();
      const a = { variantId: variant.id };
      if (blockId === 'true_false') a.true_false = { tf: { value: radio('rt_true_false') || '', justification: val('rt_adm_tf_just') } };
      else if (blockId === 'matching' || blockId === 'case') a[blockId] = radio('rt_' + blockId);
      else a[blockId] = val('rt_adm_' + blockId);
      return a;
    };
  } else {
    const block = (contract.blocks || []).find((b) => b.id === blockId);
    const handled = block && block.grading && ['text', 'text_family', 'choice', 'calculation', 'cloze', 'debe_haber', 'ledger_entry'].includes(block.grading.type);
    if (!handled) { renderRetestFallback(root, label); return; }
    const item = (((contract.variants || [])[0] || {}).blocks || []).find((x) => x.blockId === blockId)?.items?.[0] || null;
    bodyHtml = renderBlock(block, item);
    collect = () => collectAnswers([block], root);
  }

  root.innerHTML = `
    <div class="view-head">
      <div><p class="eyebrow">${reformulate ? 'Reformulación' : 'Re-test dirigido'} · ${escapeHtml(subject.name)}</p><h1>${reformulate ? '✍️ Desplegá lo que ya sabés' : '🎯 Probá que recuperaste'}: ${escapeHtml(label)}</h1>
      <p>${reformulate ? 'Reescribí tu respuesta INCLUYENDO los conceptos que ya demostraste antes y acá omitiste. No es que no los sepas — es práctica de desplegarlos.' : 'Reintentá SOLO este error después de estudiarlo. Se corrige únicamente este bloque y cuenta para tu progreso.'}</p></div>
      <button class="btn" data-go="devolucion">← Volver a la devolución</button>
    </div>
    ${reformulate
      ? `<div class="ai-card" style="margin-bottom:14px;background:linear-gradient(150deg,rgba(41,229,229,.1),var(--tile));border-color:rgba(41,229,229,.3)"><strong>Incluí estos (los sabés, los usaste antes):</strong><div style="margin-top:6px">${habitTerms.map((t) => chip(escapeHtml(t), 'cyan')).join(' ')}</div></div>`
      : `<div class="note-banner" style="margin-bottom:14px">Esto es un <b>re-test del error</b>, no un examen nuevo: el motor corrige únicamente <b>${escapeHtml(label)}</b> y no altera la nota del simulacro.</div>`}
    <div id="rtBody" class="grid section" style="gap:14px">${bodyHtml}</div>
    <div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" id="rtCorrect">${reformulate ? 'Corregir la reformulación' : 'Corregir el re-test'}</button></div>
    <div id="rtResult" class="section"></div>`;

  $('#rtCorrect', root).addEventListener('click', async (e) => {
    const btn = e.currentTarget; const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Corrigiendo...';
    const answers = collect();
    const sid = getSessionId();
    const aid = 'retest_' + blockId + '_' + Date.now();
    try {
      const res = await ctx.api.scoreAttempt({ subjectId: subject.id, sessionId: sid, attemptId: aid, answers, mode: 'practice', onlyBlocks: [blockId] });
      // Alimenta el pipeline (historial+SRS+BKT) SIN pisar la sesión del simulacro ni navegar.
      onAttemptScored(ctx, subject, { result: res.result, answers, sessionId: sid, attemptId: aid, mode: 'practice', navigate: false, pipelineOnly: true });
      track(reformulate ? 'fe_reformulation_retest' : 'fe_micro_retest', { blockId }, subject.id);
      const blk = (res.result.blocks || {})[blockId] || { points: 0, maxPoints: 2, misses: [] };
      const mx = blk.maxPoints != null ? blk.maxPoints : 2;
      // GB: en reformulación, el éxito = desplegaste los terms-hábito (no el puntaje del bloque).
      const nowHit = new Set((Array.isArray(blk.lexical) ? blk.lexical : []).filter((x) => x.hit).map((x) => x.label));
      const deployed = habitTerms.filter((t) => nowHit.has(t));
      const stillMissing = habitTerms.filter((t) => !nowHit.has(t));
      const ok = reformulate ? (stillMissing.length === 0) : ((blk.points || 0) >= mx * 0.75);
      const reformCard = reformulate ? `
          <p class="muted" style="margin:6px 0 4px">Desplegaste lo que ya sabías: ${chip(deployed.length + '/' + habitTerms.length, deployed.length === habitTerms.length ? 'ok' : 'warn')}</p>
          ${deployed.length ? `<p style="margin:2px 0">✓ Desplegaste: ${deployed.map((t) => escapeHtml(t)).join(' · ')}</p>` : ''}
          ${stillMissing.length ? `<p class="muted" style="margin:2px 0">Todavía faltó: ${stillMissing.map((t) => escapeHtml(t)).join(' · ')} — reescribilo incluyéndolos.</p>` : ''}` : '';
      $('#rtResult', root).innerHTML = `
        <section class="card section" style="margin-top:6px">
          <div class="card-head"><h2>${reformulate ? (ok ? '✓ Lo desplegaste' : '✗ Faltó desplegar') : (ok ? '✓ Recuperado' : '✗ Todavía flojo')}: ${escapeHtml(label)}</h2>${chip(blk.points.toFixed(2) + '/' + mx.toFixed(2) + ' pts', ok ? 'ok' : 'warn')}</div>
          ${reformCard}
          ${(blk.misses || []).length ? `<ul class="corr-list">${blk.misses.map((m) => `<li class="bad">✗ ${escapeHtml(m)}</li>`).join('')}</ul>` : (reformulate ? '' : '<p class="muted">Sin faltantes — dominaste el error. 🎯</p>')}
          <p class="muted" style="margin-top:8px">Contó para tu progreso (historial + repaso espaciado + modelo de dominio); la nota del simulacro queda intacta.</p>
          <div class="btn-row" style="margin-top:10px">
            ${ok
              ? `<button class="btn btn-primary" data-go="devolucion">Volver a la devolución de la sesión</button><button class="btn" data-go="evaluar">Simular variante nueva</button>`
              : `<button class="btn btn-primary" data-go="aprender" data-params='${escapeHtml(JSON.stringify({ block: blockId, retest: '1' }))}'>🔁 Reestudiar y volver a intentar</button><button class="btn" data-go="devolucion">Volver a la devolución</button>`}
          </div>
        </section>`;
      btn.disabled = true; btn.textContent = reformulate ? 'Reformulación corregida ✓' : 'Re-test corregido ✓';
      $('#rtResult', root).scrollIntoView({ block: 'start', behavior: 'smooth' });
    } catch (err) {
      ctx.toast('No se pudo corregir el re-test: ' + err.message, 'bad');
      btn.disabled = false; btn.textContent = original;
    }
  });
}

function renderRetestFallback(root, label) {
  root.innerHTML = `
    <div class="view-head"><div><p class="eyebrow">Re-test dirigido</p><h1>🎯 Re-test de: ${escapeHtml(label)}</h1></div></div>
    <div class="note-banner" style="margin-bottom:14px">Este tipo de bloque se reintenta en el examen completo. Abrí Evaluar y reintentá <b>${escapeHtml(label)}</b>.</div>
    <div class="btn-row"><button class="btn btn-primary" data-go="evaluar">Ir a Evaluar</button><button class="btn" data-go="devolucion">← Volver a la devolución</button></div>`;
}

function wireAdministracion(root, ctx, subject, contract) {
  const submit = makeSubmit(root, ctx, subject);
  const genVariants = {}; // temas IA generados en esta sesion (id gen_* -> variante)
  const variantById = (id) => genVariants[id] || contract.variants.find((v) => v.id === id) || contract.variants[0];
  const sel = $('#variantSel', root), genPanel = $('#genVariantPanel', root);

  function renderGenNote(id) {
    if (genPanel) genPanel.innerHTML = (id && id.indexOf('gen_') === 0)
      ? `<div class="note-banner" style="margin-bottom:14px">✦ Estás en un <b>tema generado por IA</b> (no auditado contra parciales reales). Se corrige con el mismo motor determinista; tomá la nota como orientativa.</div>`
      : '';
  }

  sel.addEventListener('change', (e) => {
    $('#admQuestions', root).innerHTML = admQuestions(variantById(e.target.value));
    renderGenNote(e.target.value);
  });

  // Generar variante con IA: se suma como TEMA puntuable al selector y se corrige con el motor.
  const genBtn = $('#genVariantBtn', root);
  if (genBtn && sel) {
    genBtn.addEventListener('click', async () => {
      const orig = genBtn.textContent;
      genBtn.disabled = true; genBtn.textContent = 'Generando...';
      if (genPanel) genPanel.innerHTML = '<div class="card section" style="margin:0 0 14px"><span class="inline-load"><span class="spinner"></span>Gemini esta armando un tema nuevo con las reglas de la materia...</span></div>';
      try {
        const res = await ctx.api.generateExamVariant({ subjectId: subject.id, sessionId: getSessionId() });
        if (res.source === 'gemini' && res.variant) {
          const v = res.variant;
          genVariants[v.id] = v;
          const opt = document.createElement('option');
          opt.value = v.id; opt.textContent = '✦ Tema IA: ' + (v.label || 'generado');
          sel.appendChild(opt); sel.value = v.id;
          $('#admQuestions', root).innerHTML = admQuestions(v);
          renderGenNote(v.id);
          $('#admQuestions', root).scrollIntoView({ block: 'start', behavior: 'smooth' });
          ctx.toast('Tema IA generado: ya lo podes rendir y corregir', 'ok');
        } else {
          if (genPanel) genPanel.innerHTML = '';
          ctx.toast(res.message || 'No se pudo generar el tema ahora. Usa los temas del contrato.', 'warn');
        }
      } catch (err) {
        if (genPanel) genPanel.innerHTML = '';
        ctx.toast('No se pudo generar: ' + (err.message || ''), 'bad');
      }
      genBtn.disabled = false; genBtn.textContent = orig;
    });
  }

  // demo dev-only: el boton no se renderiza en la UI del alumno (rompia el flujo de estudio).
  $('#demoBtn', root)?.addEventListener('click', () => {
    const variant = variantById($('#variantSel', root).value);
    ADM_CHOICE.forEach((blockId) => {
      const item = (variant.blocks.find((b) => b.blockId === blockId) || {}).items?.[0];
      if (item && typeof item.answer === 'number') {
        const val = blockId === 'true_false' ? (item.answer === 0 ? 'V' : 'F') : item.answer;
        const r = root.querySelector(`input[name="${blockId}"][value="${val}"]`); if (r) r.checked = true;
      }
    });
    set(root, 'adm_short_answer', 'Roles decisorios de Mintzberg: emprendedor, gestor de problemas, asignador de recursos y negociador.');
    set(root, 'adm_development', 'El proceso administrativo integra planeacion, organizacion, direccion y control como ciclo continuo de gestion.');
    ctx.toast('Demo cargada', 'ok');
  });

  $('#correctBtn', root).addEventListener('click', (e) => {
    const radio = (name) => root.querySelector(`input[name="${name}"]:checked`)?.value;
    const val = (id) => ($(`#${id}`, root)?.value || '').trim();
    const answers = {
      variantId: $('#variantSel', root).value,
      matching: radio('matching'),
      // Bug #4: V/F justificado -> answer[itemId]={value,justification} (el grader es true_false_justified).
      true_false: { tf: { value: radio('true_false') || '', justification: val('adm_tf_just') } },
      case: radio('case'),
      short_answer: val('adm_short_answer'),
      development: val('adm_development')
    };
    submit(answers, e.currentTarget);
  });

  // Bug #5: Simulacro completo — UNA sesion que cubre TODAS las variantes del contrato. Renderiza
  // los temas apilados (ids namespaced por tema para no colisionar) y corrige cada uno con el motor
  // determinista (una llamada por variante), agregando las notas. El frontend NO puntua.
  $('#simBtn', root)?.addEventListener('click', () => {
    const vs = contract.variants || [];
    const cont = $('#admQuestions', root);
    if (genPanel) genPanel.innerHTML = '<div class="note-banner" style="margin-bottom:14px">⚡ <b>Simulacro completo</b>: resolve los ' + vs.length + ' temas y corregilos juntos. Cubris toda la materia en una sola sesion.</div>';
    cont.innerHTML = vs.map((v) => `
      <div class="sim-tema" style="border-top:2px solid var(--line-2);padding-top:10px;margin-top:4px">
        <h2 style="margin:6px 0 2px">Tema ${escapeHtml(v.label || v.id)}</h2>
        ${admQuestions(v, 'sim_' + v.id + '_')}
      </div>`).join('') +
      `<button class="btn btn-primary" id="simCorrectBtn" style="margin-top:12px">Corregir simulacro (${vs.length} temas)</button><div id="simResult"></div>`;
    $('#simCorrectBtn', root)?.addEventListener('click', async (ev) => {
      const sbtn = ev.currentTarget; sbtn.disabled = true; sbtn.textContent = 'Corrigiendo los temas...';
      const radio = (n) => root.querySelector(`input[name="${n}"]:checked`)?.value;
      const val = (id) => ($(`#${id}`, root)?.value || '').trim();
      // JOL del tema: lee las .jol-row prefijadas de ESTE tema y les quita el prefijo -> {blockId: nivel}.
      const simJOL = (pfx) => {
        const jol = {};
        root.querySelectorAll(`.jol-row[data-jol-block^="${pfx}"]`).forEach((row) => {
          const pressed = row.querySelector('.jol-btn[aria-pressed="true"]');
          if (pressed) jol[row.dataset.jolBlock.slice(pfx.length)] = pressed.dataset.jol;
        });
        return jol;
      };
      const results = [];
      for (const v of vs) {
        const pfx = 'sim_' + v.id + '_';
        const answers = {
          variantId: v.id,
          matching: radio(pfx + 'matching'),
          true_false: { tf: { value: radio(pfx + 'true_false') || '', justification: val(pfx + 'adm_tf_just') } },
          case: radio(pfx + 'case'),
          short_answer: val(pfx + 'adm_short_answer'),
          development: val(pfx + 'adm_development')
        };
        const sid = getSessionId();
        const aid = 'sim_' + v.id + '_' + Date.now();
        const jol = simJOL(pfx);
        try {
          track(FE.ATTEMPT_STARTED, { subjectId: subject.id, mode: 'practice', sim: true }, subject.id);
          const res = await ctx.api.scoreAttempt({ subjectId: subject.id, sessionId: sid, attemptId: aid, answers, mode: 'practice', jol }); // Feature C: jol al server
          // B-core: cada tema pasa por el pipeline canonico (historial+SRS+learner-model+JOL), sin navegar.
          onAttemptScored(ctx, subject, { result: res.result, answers, sessionId: sid, attemptId: aid, mode: 'practice', prediction: null, jol, navigate: false });
          results.push({ label: v.label || v.id, r: res.result, answers, sid, aid, jol });
        } catch (err) { results.push({ label: v.label || v.id, r: null }); }
      }
      const oks = results.filter((x) => x.r);
      if (!oks.length) {
        $('#simResult', root).innerHTML = '<p class="muted" style="margin-top:12px">No se pudo corregir ningún tema. Reintentá en unos segundos.</p>';
        sbtn.disabled = false; sbtn.textContent = 'Corregir simulacro (' + vs.length + ' temas)';
        return;
      }
      // ADR-001 (B-UI): el simulacro arma la SESION (N temas) y navega a la Devolucion de sesion, que
      // muestra el header agregado (promedio + tabla + debilidades cross-tema + calibracion JOL) y, abajo,
      // las N devoluciones completas en acordeon — cada fallo con su CTA "Repasar esto ahora" (cierre de
      // loop). Vive en store.lastSession -> sobrevive ir a Aprender y volver.
      const sessionAttempts = oks.map((x) => ({ label: 'Tema ' + x.label, result: x.r, answers: x.answers, jol: x.jol, prediction: null, sessionId: x.sid, attemptId: x.aid, mode: 'practice' }));
      ctx.store.set({ lastSession: { subjectId: subject.id, mode: 'simulacro', at: Date.now(), attempts: sessionAttempts } });
      ctx.go('devolucion');
    });
  });

  setupDraft(root, ctx, subject, '#admBody');
}

/* ---------------- Administracion: practica + examen DURO ---------------- */
let admTimer = null;
let admTimerKill = null;
function stopTimer() {
  if (admTimer) { clearInterval(admTimer); admTimer = null; }
  if (admTimerKill) { window.removeEventListener('hashchange', admTimerKill); admTimerKill = null; }
}
function startTimer(minutes, onExpire) {
  stopTimer();
  // Si el alumno navega fuera (cambia el hash) SIN corregir, matar el timer: evita que onExpire dispare
  // el #correctBtn de OTRA vista (click fantasma cross-view). One-shot; se limpia tambien en stopTimer.
  admTimerKill = () => stopTimer();
  window.addEventListener('hashchange', admTimerKill);
  let remaining = Math.max(1, Math.round(minutes * 60));
  const render = () => {
    const el = document.getElementById('admTimer');
    const m = Math.floor(remaining / 60), s = remaining % 60;
    if (el) el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (remaining <= 0) { stopTimer(); if (typeof onExpire === 'function') onExpire(); return; }
    remaining -= 1;
  };
  render();
  admTimer = setInterval(render, 1000);
}

function renderAdmin(root, ctx, subject, contract) {
  const hasHard = Array.isArray(contract.hard?.variants) && contract.hard.variants.length;
  let mode = 'practice';

  function paint() {
    stopTimer();
    root.innerHTML = `
      <div class="view-head">
        <div>
          <p class="eyebrow">Evaluar · ${escapeHtml(subject.name)}</p>
          <h1>${mode === 'hard' ? 'Examen duro (parcial real)' : 'Intento de examen real'}</h1>
          <p>${mode === 'hard'
            ? 'Cronometrado, formato parcial presencial, sin ayuda. Justifica las falsas; el caso son 5 decisiones. Ningun bloque debajo de 1.6/2.'
            : 'Resolve como parcial: el backend corrige por bloques. El score no lo decide el frontend ni Gemini.'}</p>
        </div>
        <div class="btn-row" style="align-items:center">
          ${hasHard ? `<div class="segmented" role="group" aria-label="Modo de examen">
            <button id="modePractice" aria-pressed="${mode === 'practice'}">Practica</button>
            <button id="modeHard" aria-pressed="${mode === 'hard'}">Examen duro</button>
          </div>` : ''}
          ${mode === 'hard' ? '<span class="chip warn" id="admTimer">--:--</span>' : ''}
          <button class="btn btn-primary" id="correctBtn">Corregir intento</button>
        </div>
      </div>
      <div id="admBody"></div>`;

    if (mode === 'hard') {
      $('#admBody', root).innerHTML = hardExamForm(contract.hard);
      wireHard(root, ctx, subject, contract);
    } else {
      $('#admBody', root).innerHTML = administracionForm(contract);
      wireAdministracion(root, ctx, subject, contract);
    }
    if (hasHard) {
      $('#modePractice', root)?.addEventListener('click', () => { mode = 'practice'; paint(); });
      $('#modeHard', root)?.addEventListener('click', () => { mode = 'hard'; paint(); });
    }
  }
  paint();
}

function hardBlock(title, inner) {
  return `<section class="card"><div class="card-head"><h3>${escapeHtml(title)}</h3>${chip('2 pts')}</div>${inner}</section>`;
}

function hardItems(variant, blockId) {
  return ((variant.blocks || []).find((b) => b.blockId === blockId) || {}).items || [];
}

function hardQuestions(variant) {
  const m = hardItems(variant, 'matching'), tf = hardItems(variant, 'true_false'),
    sa = hardItems(variant, 'short_answer'), dv = hardItems(variant, 'development'), cs = hardItems(variant, 'case');
  return `
    ${hardBlock('Asociacion concepto-definicion', m.map((it, i) => `
      <div class="sb-section" ${i === 0 ? 'style="border-top:0;padding-top:0"' : ''}>
        <p style="margin-bottom:6px">${escapeHtml(it.prompt)}</p>
        <select class="input" name="m${i}"><option value="">— elegir termino —</option>${(it.options || []).map((o, oi) => `<option value="${oi}">${escapeHtml(o)}</option>`).join('')}</select>
      </div>`).join(''))}
    ${hardBlock('Verdadero / Falso (justifica las falsas)', tf.map((it, i) => `
      <div class="sb-section" ${i === 0 ? 'style="border-top:0;padding-top:0"' : ''}>
        <p style="margin-bottom:8px">${escapeHtml(it.prompt)}</p>
        <div class="choice" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <label><input type="radio" name="tf${i}" value="V"> Verdadero</label>
          <label><input type="radio" name="tf${i}" value="F"> Falso</label>
        </div>
        <textarea class="textarea" id="tfj${i}" style="min-height:56px;margin-top:8px" placeholder="Si es FALSA, justifica por que" autocomplete="off" autocorrect="off" spellcheck="false"></textarea>
      </div>`).join(''))}
    ${hardBlock('Respuestas cortas', sa.map((it, i) => `
      <div class="sb-section" ${i === 0 ? 'style="border-top:0;padding-top:0"' : ''}>
        <p style="margin-bottom:6px">${escapeHtml(it.prompt)}</p>
        <input class="input" id="sa${i}" placeholder="Respuesta" autocomplete="off" autocorrect="off" spellcheck="false">
      </div>`).join(''))}
    ${hardBlock('Desarrollo tecnico', dv.map((it, i) => `<p style="margin-bottom:6px">${escapeHtml(it.prompt)}</p><textarea class="textarea" id="dev${i}" autocomplete="off" autocorrect="off" spellcheck="false"></textarea>`).join(''))}
    ${hardBlock('Caso integrador (5 decisiones)', cs.map((it, i) => `
      <div class="sb-section" ${i === 0 ? 'style="border-top:0;padding-top:0"' : ''}>
        <p style="margin-bottom:8px">${i + 1}. ${escapeHtml(it.prompt)}</p>
        <div class="choice">${(it.options || []).map((o, oi) => `<label><input type="radio" name="cs${i}" value="${oi}"> ${escapeHtml(o)}</label>`).join('')}</div>
      </div>`).join(''))}
  `;
}

function hardExamForm(hard, variantId) {
  const variants = hard.variants;
  const variant = variants.find((v) => v.id === variantId) || variants[0];
  return `
    <section class="card" style="margin-bottom:14px">
      <label class="field" style="max-width:300px"><span>Tema (parcial real)</span>
        <select class="input" id="hVariant">${variants.map((v) => `<option value="${escapeHtml(v.id)}" ${v.id === variant.id ? 'selected' : ''}>${escapeHtml(v.label)}</option>`).join('')}</select>
      </label>
      <p class="muted" style="margin-top:8px">Sin material. ${hard.timeLimitMinutes || 40} minutos. Al terminar el tiempo se corrige automaticamente.</p>
    </section>
    <div id="hQuestions" class="grid" style="gap:14px">${hardQuestions(variant)}</div>`;
}

function wireHard(root, ctx, subject, contract) {
  const hard = contract.hard;
  const submit = makeSubmit(root, ctx, subject);

  $('#hVariant', root)?.addEventListener('change', (e) => {
    const v = hard.variants.find((x) => x.id === e.target.value) || hard.variants[0];
    $('#hQuestions', root).innerHTML = hardQuestions(v);
  });

  startTimer(hard.timeLimitMinutes || 40, () => $('#correctBtn', root)?.click());

  $('#correctBtn', root)?.addEventListener('click', (e) => {
    stopTimer();
    const variantId = $('#hVariant', root).value;
    const variant = hard.variants.find((x) => x.id === variantId) || hard.variants[0];
    const selVal = (name) => { const s = root.querySelector(`select[name="${name}"]`); return s && s.value !== '' ? Number(s.value) : null; };
    const radioVal = (name) => { const r = root.querySelector(`input[name="${name}"]:checked`); return r ? Number(r.value) : null; };
    const tfVal = (i) => ({ value: root.querySelector(`input[name="tf${i}"]:checked`)?.value || '', justification: ($(`#tfj${i}`, root)?.value || '').trim() });
    const val = (id) => ($(`#${id}`, root)?.value || '').trim();
    const answers = {
      variantId,
      matching: hardItems(variant, 'matching').map((_, i) => selVal(`m${i}`)),
      true_false: hardItems(variant, 'true_false').map((_, i) => tfVal(i)),
      short_answer: hardItems(variant, 'short_answer').map((_, i) => val(`sa${i}`)),
      development: hardItems(variant, 'development').map((_, i) => val(`dev${i}`)),
      case: hardItems(variant, 'case').map((_, i) => radioVal(`cs${i}`))
    };
    submit(answers, e.currentTarget, 'hard');
  });
}

function set(root, id, value) {
  const el = $(`#${id}`, root);
  if (el) el.value = value;
}
