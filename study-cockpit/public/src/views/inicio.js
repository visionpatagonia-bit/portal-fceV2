import { escapeHtml, fmt2, statusLabel, statusTone, subjectAccent, fmtDateTime } from '../format.js';
import { donut, bars } from '../components/charts.js';
import { loadingState, errorState, chip } from '../components/ui.js';
import { getHistory, blockTrends } from '../progress.js';
import { getSessionId } from '../telemetry.js';

export async function render(root, ctx) {
  const { store, data, api } = ctx;
  root.innerHTML = loadingState('Armando tu cockpit...');

  try {
    await data.ensureSubjects();
    const subject = data.activeSubject();
    if (!subject) { root.innerHTML = errorState('No hay materias disponibles.'); return; }

    const [contract, plan] = await Promise.all([
      data.ensureContract(subject.folder).catch(() => null),
      data.ensurePlan(subject.id).catch(() => null)
    ]);

    const st = store.get();
    const showScore = st.lastScore && st.lastScoreSubject === subject.id;
    let sequence = null;
    try { sequence = await data.loadSequence(subject.id, showScore ? st.lastScore : null); } catch {}
    let events = [];
    try { events = (await api.events({ limit: 6 })).events || []; } catch {}
    let topFails = [];
    try { topFails = (await api.failExplanations({ subjectId: subject.id, limit: 5 })).entries || []; } catch {}

    // Director de Vuelo: prefs persistidas por sesion+materia (examDate editable, minutes recordado).
    const sessionId = getSessionId();
    const flightKey = `nexus.flight.${sessionId}.${subject.id}`;
    let flightPrefs = {};
    try { flightPrefs = JSON.parse(localStorage.getItem(flightKey) || '{}') || {}; } catch (_) { flightPrefs = {}; }
    if (!(flightPrefs.minutes > 0)) flightPrefs.minutes = 90;
    let flightPlan = null;
    if (flightPrefs.examDate) { try { flightPlan = await api.flightPlan({ subjectId: subject.id, sessionId, minutes: flightPrefs.minutes, examDate: flightPrefs.examDate }); } catch (_) { flightPlan = null; } }

    const blockCount = plan?.blocks?.length || contract?.blocks?.length || subject.blocks || 0;
    const llm = st.health?.llm;
    const llmOk = llm && (typeof llm === 'object' ? llm.configured : llm !== 'not_configured');
    const current = sequence?.steps?.find((s) => s.id === sequence.currentStep) || sequence?.steps?.[0] || null;
    const nextLabel = current ? current.label : 'Hace un intento';

    root.innerHTML = `
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">NEXUS Study Cockpit</p>
          <h1>Elegi materia, estudia con guia y rendi un intento real.</h1>
          <p class="lead">Estudias un bloque, rendis como parcial y recibis correccion con score en minutos. La devolucion te manda al tema que mas afecta tu nota.</p>
          <div class="hero-status">
            ${chip(st.health?.ok ? 'Backend online' : 'Backend offline', st.health?.ok ? 'ok' : 'bad')}
            ${chip(llmOk ? 'Gemini activo' : 'Gemini no configurado', llmOk ? 'ok' : 'warn')}
            ${chip('Materia: ' + subject.name, 'cyan')}
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="b b2"></div><div class="b b1"></div><div class="b ground"></div>
        </div>
      </section>

      <div class="grid grid-metrics section">
        <article class="card metric accent">
          <div class="ic">${ico('star')}</div>
          <span class="k">Score estimado</span>
          <b class="v">${showScore ? fmt2(st.lastScore.total) : '--'}</b>
          <span class="s">${showScore ? statusLabel(st.lastScore.status) : 'calibrable con nota real'}</span>
        </article>
        <article class="card metric">
          <div class="ic">${ico('layers')}</div>
          <span class="k">Bloques</span>
          <b class="v">${blockCount}</b>
          <span class="s">del plan de estudio</span>
        </article>
        <article class="card metric">
          <div class="ic">${ico('book')}</div>
          <span class="k">Materias</span>
          <b class="v">${st.subjects.length}</b>
          <span class="s">en el cockpit</span>
        </article>
        <article class="card metric">
          <div class="ic">${ico('flag')}</div>
          <span class="k">Proxima accion</span>
          <b class="v" style="font-size:20px;line-height:1.15">${escapeHtml(nextLabel)}</b>
          <span class="s">${escapeHtml(sequence?.targetBlock?.label || 'segun tu ultimo intento')}</span>
        </article>
      </div>

      <section class="card section" id="flightCard">
        <div class="card-head"><h2>Plan de esta noche</h2>${chip('Director de Vuelo', 'cyan')}</div>
        <div class="btn-row" style="gap:14px;flex-wrap:wrap;align-items:end;margin-bottom:6px">
          <label class="field" style="max-width:200px"><span>¿Cuando rendis?</span><input type="date" class="input" id="flightDate" value="${escapeHtml(flightPrefs.examDate || '')}"></label>
          <label class="field" style="max-width:150px"><span>Minutos de hoy</span><input type="number" class="input" id="flightMin" min="15" max="600" step="15" value="${flightPrefs.minutes}"></label>
        </div>
        <div id="flightBody">${flightBodyHtml(flightPlan, flightPrefs)}</div>
      </section>

      <div class="grid grid-2 section">
        <section class="card">
          <div class="card-head"><h2>Mis materias</h2><button class="btn-ghost" data-go="materias">Ver todas</button></div>
          <div class="row-list">
            ${st.subjects.map((s) => subjectRow(s, st)).join('')}
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>Proxima accion recomendada</h2></div>
          ${sequence && current ? `
            <div class="ai-card" style="background:linear-gradient(150deg,rgba(255,45,142,.1),var(--tile));border-color:rgba(255,45,142,.2)">
              <p class="eyebrow" style="margin-bottom:6px">${escapeHtml(current.knowledgeLayer || 'ruta')}</p>
              <strong style="font-size:16px">${escapeHtml(current.label)}: ${escapeHtml(sequence.targetBlock.label)}</strong>
              <p>${escapeHtml(current.purpose || sequence.displayModel?.principle || '')}</p>
              <span class="trigger">Adaptacion: ${escapeHtml(sequence.targetBlock.reason)}${showScore ? ' · score ' + fmt2(st.lastScore.total) : ''}</span>
            </div>
            <div class="btn-row" style="margin-top:12px">
              <button class="btn btn-primary" data-go="aprender">Continuar ruta</button>
              <button class="btn" data-go="evaluar">Hacer intento</button>
              <button class="btn btn-soft" data-go="diagnostico">Diagnostico rapido</button>
            </div>
          ` : `<p class="muted">Elegi una materia y empeza el recorrido guiado.</p>
            <div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" data-go="aprender">Empezar a estudiar</button><button class="btn btn-soft" data-go="diagnostico">Diagnostico rapido</button></div>`}
        </section>
      </div>

      <div class="grid grid-2 section">
        <section class="card">
          <div class="card-head"><h2>Progreso por bloque</h2>${showScore ? `<button class="btn-ghost" data-go="devolucion">Devolucion</button>` : ''}</div>
          ${showScore ? bars(Object.entries(st.lastScore.blocks).map(([k, b]) => ({
            label: b.label || k, value: b.points, max: 2, weak: b.points < 1.35, miss: (b.misses || [])[0]
          }))) : `<div class="state"><p>Todavia no corregiste un intento de ${escapeHtml(subject.name)}.</p><button class="btn btn-primary" data-go="evaluar">Rendir intento</button></div>`}
        </section>

        <section class="card">
          <div class="card-head"><h2>Actividad reciente</h2><button class="btn-ghost" data-go="progreso">Ver progreso</button></div>
          ${events.length ? `<div class="row-list">${events.slice().reverse().map(eventRow).join('')}</div>`
            : `<p class="muted">Sin eventos todavia. Corregi un intento para empezar tu bitacora.</p>`}
        </section>
      </div>

      ${topFails.length ? `
      <section class="card section">
        <div class="card-head"><h2>Lo que mas cuesta</h2>${chip('Datos reales del uso', 'warn')}</div>
        <p class="muted" style="margin:-4px 0 12px">Los errores que mas se repiten entre intentos. Cada uno ya tiene su explicacion guardada.</p>
        <div class="row-list">
          ${topFails.map((f) => `<div class="list-row" style="cursor:default">
            <span class="badge amber">${escapeHtml(String(f.occurrenceCount || 1))}</span>
            <span><span class="t-title" style="font-size:13px">${escapeHtml((f.missText || '').slice(0, 90))}</span><span class="t-sub">${escapeHtml(f.blockLabel || f.blockId || '')}</span></span>
            <span class="t-end">x${escapeHtml(String(f.occurrenceCount || 1))}</span>
          </div>`).join('')}
        </div>
      </section>` : ''}

      ${evolutionCard(subject.id)}

      <section class="card section">
        <div class="card-head"><h2>Accesos rapidos</h2></div>
        <div class="btn-row">
          <button class="btn btn-soft" data-go="aprender">${ico('learn')} Aprender</button>
          <button class="btn btn-soft" data-go="evaluar">${ico('exam')} Evaluar</button>
          <button class="btn btn-soft" data-go="progreso">${ico('flag')} Progreso</button>
          <button class="btn btn-soft" data-go="biblioteca">${ico('book')} Mi biblioteca</button>
          <button class="btn btn-soft" data-go="gemini">${ico('star')} Gemini</button>
        </div>
      </section>
    `;

    // Director de Vuelo: persiste fecha/minutos y re-arma el plan al cambiarlos (sin recargar Inicio).
    const fDate = root.querySelector('#flightDate');
    const fMin = root.querySelector('#flightMin');
    const fBody = root.querySelector('#flightBody');
    const refetchFlight = async () => {
      const prefs = { examDate: (fDate.value || '').trim() || null, minutes: Math.max(15, Math.min(600, parseInt(fMin.value, 10) || 90)) };
      try { localStorage.setItem(flightKey, JSON.stringify(prefs)); } catch (_) {}
      if (!prefs.examDate) { fBody.innerHTML = flightBodyHtml(null, prefs); return; }
      fBody.innerHTML = '<p class="muted">Armando tu plan...</p>';
      let p = null;
      try { p = await api.flightPlan({ subjectId: subject.id, sessionId, minutes: prefs.minutes, examDate: prefs.examDate }); } catch (_) { p = null; }
      fBody.innerHTML = flightBodyHtml(p, prefs);
    };
    fDate?.addEventListener('change', refetchFlight);
    fMin?.addEventListener('change', refetchFlight);
  } catch (err) {
    root.innerHTML = errorState(err.message, 'data-retry="inicio"');
  }
}

// Cuerpo de la card "Plan de esta noche". F4: NUNCA renderiza P(L) como %, solo band + orden.
// Sin fecha -> CTA. Con plan -> lista por need (flojo primero), dominados atenuados. Falla -> aviso suave.
function flightBodyHtml(plan, prefs) {
  if (!prefs.examDate) {
    return `<div class="ai-card" style="background:linear-gradient(150deg,rgba(41,229,229,.1),var(--tile));border-color:rgba(41,229,229,.2)">
      <strong style="font-size:16px">¿Cuando rendis?</strong>
      <p>Carga la fecha del parcial y los minutos que tenes hoy, y te armo el plan: que estudiar primero segun tu dominio real.</p></div>`;
  }
  if (!plan || !plan.ok || !Array.isArray(plan.plan) || !plan.plan.length) {
    return `<p class="muted">No pude armar el plan ahora (el backend puede estar despertando). Reintenta en unos segundos, o segui con la accion recomendada de abajo.</p>`;
  }
  const dim = (b) => b.band === 'dominado';
  const rows = plan.plan.map((b) => `<button class="list-row" data-go="aprender" data-params='{"block":"${escapeHtml(b.blockId)}"}' style="cursor:pointer;width:100%;text-align:left${dim(b) ? ';opacity:.5' : ''}">
      <span class="badge ${b.band === 'flojo' ? 'amber' : 'cyan'}">${b.minutes}'</span>
      <span><span class="t-title" style="font-size:13px">${escapeHtml(b.label)}</span><span class="t-sub">${dim(b) ? 'mantenimiento · ' : ''}${escapeHtml(b.band)} · ${escapeHtml(b.reason || '')}</span></span>
      <span class="t-end">${ico('chev')}</span>
    </button>`).join('');
  return `<p class="muted" style="margin:2px 0 10px"><b style="color:var(--ink)">${escapeHtml(plan.headline || 'Plan de esta noche')}</b></p>
    <div class="row-list">${rows}</div>
    <p class="muted" style="margin-top:10px">Plan: <b style="color:var(--ink)">${plan.totalMinutes} de ${plan.budgetMinutes} min</b>. Toca un bloque para estudiarlo. El orden va por tu dominio real (no es nota).</p>`;
}

function subjectRow(s, st) {
  const scored = st.lastScore && st.lastScoreSubject === s.id;
  return `<button class="list-row" data-select-subject="${escapeHtml(s.folder)}" data-go="aprender">
    <span class="badge ${subjectAccent(s.id)}">${escapeHtml((s.name || '?').slice(0, 2).toUpperCase())}</span>
    <span><span class="t-title">${escapeHtml(s.name)}</span><span class="t-sub">${s.blocks || 0} bloques${scored ? ' · ultimo score ' + fmt2(st.lastScore.total) : ''}</span></span>
    <span class="t-end">${ico('chev')}</span>
  </button>`;
}

function eventRow(ev) {
  return `<div class="list-row" style="cursor:default">
    <span class="badge cyan" style="font-size:10px">${escapeHtml(String(ev.type || '').slice(0, 2).toUpperCase())}</span>
    <span><span class="t-title" style="font-size:13px">${escapeHtml(ev.type)}</span><span class="t-sub">${escapeHtml(fmtDateTime(ev.createdAt))}</span></span>
    <span></span>
  </div>`;
}

// "Tu evolucion": sparkline de los ultimos intentos + tendencia por bloque (mejoro/bajo).
function evolutionCard(subjectId) {
  const h = getHistory(subjectId);
  if (h.length < 2) return '';
  const sparks = h.map((e, i) => `<div class="evo-bar" title="Intento ${i + 1}: ${fmt2(e.total)}/10"><span style="height:${Math.max(6, Math.min(100, (e.total / 10) * 100))}%"></span></div>`).join('');
  const trends = blockTrends(subjectId);
  const arrow = { up: '<b class="t-up">▲</b>', down: '<b class="t-down">▼</b>', flat: '<span class="muted">=</span>', new: '<span class="muted">nuevo</span>' };
  const rows = Object.entries(trends).map(([id, t]) => `<div class="list-row" style="cursor:default"><span class="t-title" style="font-size:13px">${escapeHtml(t.label)}</span><span class="t-end">${fmt2(t.points)}/2 ${arrow[t.trend] || ''}</span></div>`).join('');
  const last = h[h.length - 1].total, prev = h[h.length - 2].total;
  const d = Math.round((last - prev) * 100) / 100;
  return `<section class="card section">
    <div class="card-head"><h2>Tu evolucion</h2>${chip(h.length + ' intentos', 'cyan')}</div>
    <div class="evo-spark">${sparks}</div>
    <p class="muted" style="margin:8px 0 12px">Ultimo intento: <b style="color:var(--ink)">${fmt2(last)}/10</b> (${d >= 0 ? '+' : ''}${d} vs anterior). <b class="t-up">▲</b> mejoraste el bloque · <b class="t-down">▼</b> bajaste.</p>
    <div class="row-list">${rows}</div>
  </section>`;
}

function ico(name) {
  const P = {
    star: '<path d="M12 3l2.2 6.3L20 12l-5.8 2.7L12 21l-2.2-6.3L4 12l5.8-2.7z"/>',
    layers: '<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    book: '<path d="M5 4h14v16H6a2 2 0 0 1-1-3z"/>',
    flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
    learn: '<path d="M12 4 3 8l9 4 9-4z"/><path d="M7 10v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5"/>',
    exam: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6"/>',
    contract: '<path d="M7 3h7l5 5v13H7z"/><path d="M10 13h6M10 17h6"/>',
    chev: '<path d="m9 6 6 6-6 6"/>'
  };
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;
}
