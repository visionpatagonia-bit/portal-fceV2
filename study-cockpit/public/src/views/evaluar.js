import { escapeHtml } from '../format.js';
import { loadingState, errorState, $, chip } from '../components/ui.js';
import { FE, track, getSessionId } from '../telemetry.js';
import * as fb from '../firebase.js';
import { pushHistory, buildEntry, updateSRS } from '../progress.js';

export async function render(root, ctx) {
  const { data, api, store, toast } = ctx;
  root.innerHTML = loadingState('Preparando el intento...');

  try {
    await data.ensureSubjects();
    const subject = data.activeSubject();
    const contract = await data.ensureContract(subject.folder).catch(() => null);

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
      renderContabilidad(root, ctx, subject);
    } else if (subject.id === 'administracion') {
      if (!contract?.variants?.length) { root.innerHTML = head + errorState('La materia no tiene variantes de examen.'); return; }
      renderAdmin(root, ctx, subject, contract);
    } else {
      root.innerHTML = head + `<div class="note-banner">Esta materia todavia no tiene rubrica de correccion en el backend.</div>`;
    }
  } catch (err) {
    root.innerHTML = errorState(err.message, 'data-retry="evaluar"');
  }
}

/* ---------------- shared submit ---------------- */
function makeSubmit(root, ctx, subject) {
  const { api, store, toast } = ctx;
  return async function submit(answers, btn, mode = 'practice') {
    track(FE.ATTEMPT_STARTED, { subjectId: subject.id, mode }, subject.id);
    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Corrigiendo...';
    try {
      const sessionId = getSessionId();
      const attemptId = `att_${Date.now()}`;
      const res = await api.scoreAttempt({ subjectId: subject.id, sessionId, attemptId, answers, mode });
      const result = res.result;
      store.set({ lastScore: result, lastScoreSubject: subject.id, lastSessionId: sessionId, lastAttemptId: attemptId });
      pushHistory(subject.id, buildEntry(result)); // historial para "Tu evolucion"
      updateSRS(subject.id, result); // agenda el repaso espaciado por bloque
      track(FE.ATTEMPT_CORRECTED, { total: result.total, notaEstimada: result.notaEstimada, status: result.estimatedStatus, mode }, subject.id);
      (result.weaknesses || []).forEach((w) => track(FE.WEAKNESS_DETECTED, { blockId: w.blockId, score: w.score }, subject.id));
      // Persistencia por UID (no-op si no hay login). Nunca recalcula la nota.
      fb.saveStudySession({ subjectId: subject.id, sessionId, attemptId, result });
      fb.saveAttempt({ subjectId: subject.id, sessionId, attemptId, result });
      clearDraft(subject.id); // intento corregido: el borrador ya no hace falta
      toast(`Nota estimada: ${result.notaEstimada ?? result.total}/10`, 'ok');
      ctx.go('devolucion');
    } catch (err) {
      toast('No se pudo corregir: ' + err.message, 'bad');
      btn.disabled = false; btn.textContent = original;
    }
  };
}

/* ---------------- borrador auto-guardado (no toca la nota) ---------------- */
function draftKey(subjectId) { return 'nexus.draft.' + subjectId; }
function loadDraft(subjectId) { try { return JSON.parse(localStorage.getItem(draftKey(subjectId)) || 'null'); } catch { return null; } }
function clearDraft(subjectId) { try { localStorage.removeItem(draftKey(subjectId)); } catch { /* no-op */ } }
function saveDraft(subjectId, snap) {
  try { localStorage.setItem(draftKey(subjectId), JSON.stringify({ at: Date.now(), snap })); } catch { /* no-op */ }
}

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
function setupDraft(root, ctx, subject, containerSel) {
  const container = $(containerSel, root);
  if (!container) return;
  // 1) ofrecer retomar
  const d = loadDraft(subject.id);
  if (d && d.snap && snapshotHasContent(d.snap)) {
    const banner = document.createElement('div');
    banner.className = 'note-banner draft-banner';
    banner.style.marginBottom = '14px';
    banner.innerHTML = `Tenes un intento sin terminar (${escapeHtml(timeAgo(d.at))}). <button class="btn btn-sm btn-primary" id="draftResume" style="margin-left:8px">Retomar</button> <button class="btn btn-sm" id="draftDiscard">Descartar</button>`;
    container.insertAdjacentElement('beforebegin', banner);
    $('#draftResume', banner).addEventListener('click', () => { restoreForm(container, d.snap); banner.remove(); ctx.toast('Borrador retomado', 'ok'); });
    $('#draftDiscard', banner).addEventListener('click', () => { clearDraft(subject.id); banner.remove(); });
  }
  // 2) auto-guardar (debounced) mientras se completa
  let t = null;
  const save = () => { clearTimeout(t); t = setTimeout(() => saveDraft(subject.id, snapshotForm(container)), 1200); };
  container.addEventListener('input', save);
  container.addEventListener('change', save);
}

/* ---------------- Contabilidad ---------------- */
const VF_ITEMS = [
  { id: 'b1', text: 'El devengado reconoce resultados por el hecho sustancial del periodo, con independencia del cobro o pago.' },
  { id: 'b2', text: 'Los aportes que se le retienen al trabajador son contribuciones patronales.' },
  { id: 'b3', text: 'Las contribuciones patronales son un costo de la empresa y una obligacion a pagar.' },
  { id: 'b4', text: 'El auditor puede preparar la informacion contable que luego audita.' }
];
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
        ${PAYROLL.map(([id, label]) => `<label class="field"><span>${escapeHtml(label)}</span><input class="input num" id="${id}" inputmode="decimal" placeholder="0"></label>`).join('')}
      </div>
    </section>`;
}

const CONTAB_PROMPTS = {
  a_def: 'Defini el criterio de devengado y diferencialo del criterio de percibido. Indica como imputa los resultados cada uno (que hecho los genera) y da un ejemplo concreto.',
  a_dev: 'Desarrolla que es la auditoria y como se relaciona con la independencia del profesional y con el control interno del ente. Explica el alcance y los limites de cada uno.',
  a_case: 'Caso: en una PyME, una misma persona autoriza, registra y paga los sueldos del mes. Analiza el caso aplicando el criterio de devengado, la diferencia entre aportes y contribuciones, el riesgo de control que genera esa concentracion de funciones y que controles concretos recomendarias.'
};

// variant (opcional): variante IA con scenario + vfStatements [{id,text}] + textPrompts {a_def,a_dev,a_case}.
function contabilidadForm(variant) {
  const p = (variant && variant.textPrompts) || {};
  const vf = (variant && variant.vfStatements) || VF_ITEMS;
  const givens = (variant && variant.scenario) ? scenarioGivens(variant.scenario) : PAYROLL_GIVENS;
  return `
    <div class="grid" style="gap:14px">
      ${variant ? '<div class="note-banner">✦ Examen generado por IA (no auditado). El calculo lo corrige el motor determinista; V/F y desarrollos son orientativos.</div>' : ''}
      ${textBlock('a_def', 'Bloque A · Definicion escrita', p.a_def || CONTAB_PROMPTS.a_def)}
      <section class="card">
        <div class="card-head"><h3>Bloque B · Verdadero/Falso justificado</h3>${chip('2 pts')}</div>
        ${vf.map((it, i) => `
          <div class="sb-section" ${i === 0 ? 'style="border-top:0;padding-top:0"' : ''}>
            <p style="margin-bottom:8px">${escapeHtml(it.text)}</p>
            <div class="choice" style="grid-template-columns:1fr 1fr;display:grid;gap:8px">
              <label><input type="radio" name="${it.id}" value="V"> Verdadero</label>
              <label><input type="radio" name="${it.id}" value="F"> Falso</label>
            </div>
            <textarea class="textarea" id="${it.id}_j" style="min-height:64px;margin-top:8px" placeholder="Justificacion tecnica (corregi las falsas)"></textarea>
          </div>`).join('')}
      </section>
      ${payrollBlock(givens)}
      ${textBlock('a_dev', 'Bloque D · Auditoria y control', p.a_dev || CONTAB_PROMPTS.a_dev)}
      ${textBlock('a_case', 'Bloque E · Caso integrador', p.a_case || CONTAB_PROMPTS.a_case)}
    </div>`;
}

// El enunciado se renderiza VISIBLE (no como placeholder, que se borra al escribir):
// el alumno puede releerlo mientras razona su respuesta.
function textBlock(id, title, prompt) {
  return `<section class="card"><div class="card-head"><h3>${escapeHtml(title)}</h3>${chip('2 pts')}</div>
    <p class="q-prompt">${escapeHtml(prompt)}</p>
    <textarea class="textarea" id="${id}" placeholder="Escribi tu respuesta tecnica..."></textarea></section>`;
}

function renderContabilidad(root, ctx, subject) {
  let mode = 'practice';
  let genVariant = null; // examen generado por IA (gen_*) en esta sesion
  function paint() {
    stopTimer();
    root.innerHTML = `
      <div class="view-head">
        <div>
          <p class="eyebrow">Evaluar · ${escapeHtml(subject.name)}</p>
          <h1>${mode === 'hard' ? 'Examen duro' : 'Intento de examen real'}</h1>
          <p>${mode === 'hard'
            ? 'Cronometrado, sin ayuda, correccion estricta: ningun bloque debajo de 1.5/2 y mayor margen de incertidumbre. (Contabilidad: sin parcial real calibrado todavia.)'
            : 'Resolve como parcial: el backend corrige por bloques. El score no lo decide el frontend ni Gemini.'}</p>
        </div>
        <div class="btn-row" style="align-items:center">
          <div class="segmented" role="group" aria-label="Modo de examen">
            <button id="modePractice" aria-pressed="${mode === 'practice'}">Practica</button>
            <button id="modeHard" aria-pressed="${mode === 'hard'}">Examen duro</button>
          </div>
          ${mode === 'hard' ? '<span class="chip warn" id="admTimer">--:--</span>' : '<button class="btn btn-soft" id="genCalcBtn" title="Gemini arma un examen nuevo (escenario de calculo + V/F + desarrollos); el calculo lo corrige el motor determinista">✦ Variante con IA</button>'}
          <button class="btn btn-primary" id="correctBtn">Corregir intento</button>
        </div>
      </div>
      <div id="contBody">${contabilidadForm(genVariant)}</div>`;
    wireContabilidad(root, ctx, subject, mode, genVariant, (v) => { genVariant = v; paint(); });
    if (mode === 'hard') startTimer(40, () => $('#correctBtn', root)?.click());
    $('#modePractice', root)?.addEventListener('click', () => { mode = 'practice'; genVariant = null; paint(); });
    $('#modeHard', root)?.addEventListener('click', () => { mode = 'hard'; genVariant = null; paint(); });
  }
  paint();
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
    set(root, 'a_def', 'El devengado registra por hecho sustancial y periodo, independientemente del cobro o pago. El percibido depende del cobro o pago.');
    set(root, 'a_dev', 'La auditoria examina evidencia y emite opinion independiente. La independencia exige no preparar la informacion auditada. El control interno mejora confiabilidad y salvaguarda sin garantizar riesgo cero.');
    set(root, 'a_case', 'Aplico devengado por periodo y hecho sustancial. Aportes se retienen al trabajador y contribuciones patronales son costo. Si una persona autoriza, registra y paga hay riesgo: propongo separacion de funciones, autorizacion, comprobantes y conciliacion.');
    const just = { b1: 'Hecho sustancial del periodo, independiente del cobro o pago.', b2: 'Son retenciones al trabajador, no contribuciones patronales.', b3: 'Costo de la empresa y pasivo a pagar.', b4: 'Por independencia el auditor no prepara la informacion auditada.' };
    const vf = { b1: 'V', b2: 'F', b3: 'V', b4: 'F' };
    VF_ITEMS.forEach((it) => {
      const r = root.querySelector(`input[name="${it.id}"][value="${vf[it.id]}"]`); if (r) r.checked = true;
      set(root, `${it.id}_j`, just[it.id]);
    });
    const nums = { c_worker: 85000, c_net: 415000, c_employer: 130000, c_cost: 630000, c_debitWages: 500000, c_debitSocialCharges: 130000, c_creditPayrollPayable: 415000, c_creditContributionsPayable: 215000 };
    Object.entries(nums).forEach(([id, v]) => set(root, id, v));
    ctx.toast('Demo cargada', 'ok');
  });

  $('#correctBtn', root).addEventListener('click', (e) => {
    const vfIds = (genVariant && genVariant.vfStatements) ? genVariant.vfStatements.map((s) => ({ id: s.id })) : VF_ITEMS;
    const answers = {
      variantId: (genVariant && genVariant.id) || undefined,
      A: val('a_def'),
      B: Object.fromEntries(vfIds.map((it) => [it.id, { value: radio(it.id), justification: val(`${it.id}_j`) }])),
      C: { worker: val('c_worker'), net: val('c_net'), employer: val('c_employer'), cost: val('c_cost'), debitWages: val('c_debitWages'), debitSocialCharges: val('c_debitSocialCharges'), creditPayrollPayable: val('c_creditPayrollPayable'), creditContributionsPayable: val('c_creditContributionsPayable') },
      D: val('a_dev'), E: val('a_case')
    };
    submit(answers, e.currentTarget, mode);
  });

  if (mode === 'practice' && !genVariant) setupDraft(root, ctx, subject, '#contBody');
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
      </div>
    </section>
    <div id="genVariantPanel"></div>
    <div id="admQuestions" class="grid" style="gap:14px">${admQuestions(variants[0])}</div>`;
}

function admQuestions(variant) {
  const order = ['matching', 'true_false', 'short_answer', 'development', 'case'];
  return order.map((blockId) => {
    const item = (variant.blocks.find((b) => b.blockId === blockId) || {}).items?.[0];
    if (!item) return '';
    const body = ADM_CHOICE.includes(blockId)
      ? `<div class="choice">${(item.options || []).map((opt, idx) => `<label><input type="radio" name="${blockId}" value="${idx}"> ${escapeHtml(opt)}</label>`).join('')}</div>`
      : `<textarea class="textarea" id="adm_${blockId}" placeholder="Desarrolla con vocabulario tecnico de la materia."></textarea>`;
    return `<section class="card">
      <div class="card-head"><h3>${escapeHtml(ADM_LABELS[blockId])}</h3>${chip('2 pts')}</div>
      <p style="margin-bottom:10px">${escapeHtml(item.prompt)}</p>
      ${body}
    </section>`;
  }).join('');
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
        const r = root.querySelector(`input[name="${blockId}"][value="${item.answer}"]`); if (r) r.checked = true;
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
      true_false: radio('true_false'),
      case: radio('case'),
      short_answer: val('adm_short_answer'),
      development: val('adm_development')
    };
    submit(answers, e.currentTarget);
  });

  setupDraft(root, ctx, subject, '#admBody');
}

/* ---------------- Administracion: practica + examen DURO ---------------- */
let admTimer = null;
function stopTimer() { if (admTimer) { clearInterval(admTimer); admTimer = null; } }
function startTimer(minutes, onExpire) {
  stopTimer();
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
        <textarea class="textarea" id="tfj${i}" style="min-height:56px;margin-top:8px" placeholder="Si es FALSA, justifica por que"></textarea>
      </div>`).join(''))}
    ${hardBlock('Respuestas cortas', sa.map((it, i) => `
      <div class="sb-section" ${i === 0 ? 'style="border-top:0;padding-top:0"' : ''}>
        <p style="margin-bottom:6px">${escapeHtml(it.prompt)}</p>
        <input class="input" id="sa${i}" placeholder="Respuesta">
      </div>`).join(''))}
    ${hardBlock('Desarrollo tecnico', dv.map((it, i) => `<p style="margin-bottom:6px">${escapeHtml(it.prompt)}</p><textarea class="textarea" id="dev${i}"></textarea>`).join(''))}
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
