// NEXUS Study Cockpit — frontend bootstrap.
import { api } from './api.js';
import { createStore, initialState } from './store.js';
import { createRouter } from './router.js';
import { FE, track, getSessionId } from './telemetry.js';
import { renderSidebar, setActiveNav } from './components/sidebar.js';
import { renderTopbar, updateTopbarStatus, setSubjectSwitch } from './components/topbar.js';
import { delegate, errorState } from './components/ui.js';
import * as fb from './firebase.js';

import * as inicio from './views/inicio.js';
import * as materias from './views/materias.js';
import * as aprender from './views/aprender.js';
import * as evaluar from './views/evaluar.js';
import * as devolucion from './views/devolucion.js';
import * as gemini from './views/gemini.js';
import * as kb from './views/kb.js';
import * as contrato from './views/contrato.js';

const views = { inicio, materias, aprender, evaluar, devolucion, gemini, kb, contrato };

const store = createStore(initialState);
const sidebarEl = document.getElementById('sidebar');
const topbarEl = document.getElementById('topbar');
const viewEl = document.getElementById('view');
const backdrop = document.getElementById('railBackdrop');
const toastStack = document.getElementById('toastStack');

/* ---------------- helpers ---------------- */
function toast(message, tone = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + tone;
  el.textContent = message;
  toastStack.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(() => el.remove(), 200); }, 3000);
}

function openRail() { document.body.classList.add('rail-open'); backdrop.hidden = false; }
function closeRail() { document.body.classList.remove('rail-open'); backdrop.hidden = true; }

async function refreshHealth() {
  try {
    const health = await api.health();
    store.set({ health });
    updateTopbarStatus(topbarEl, health);
  } catch { /* keep last */ }
}

function setActiveSubject(folder) {
  if (!folder || store.get().activeSubjectId === folder) return;
  store.set({ activeSubjectId: folder, activeBlockId: null, sequence: null });
  setSubjectSwitch(topbarEl, folder);
  const subj = store.get().subjects.find((s) => s.folder === folder);
  track(FE.SUBJECT_SELECTED, { subjectId: subj?.id }, subj?.id);
}

/* ---------------- data loaders (cache-aware) ---------------- */
const data = {
  _blocks: {},
  async ensureSubjects() {
    if (store.get().subjects.length) return store.get().subjects;
    const subjects = (await api.subjects()).subjects || [];
    const active = store.get().activeSubjectId
      || subjects.find((s) => s.id === 'contabilidad_2p')?.folder
      || subjects[0]?.folder || null;
    store.set({ subjects, activeSubjectId: active });
    return subjects;
  },
  activeSubject() {
    const st = store.get();
    return st.subjects.find((s) => s.folder === st.activeSubjectId) || st.subjects[0] || null;
  },
  async ensureContract(folder) {
    const cache = store.get().contractsBySubject;
    if (cache[folder]) return cache[folder];
    const contract = (await api.contract(folder)).contract;
    store.set({ contractsBySubject: { ...store.get().contractsBySubject, [folder]: contract } });
    return contract;
  },
  async ensurePlan(subjectId) {
    const cache = store.get().plansBySubject;
    if (cache[subjectId]) return cache[subjectId];
    const plan = (await api.studyPlan(subjectId)).plan;
    store.set({ plansBySubject: { ...store.get().plansBySubject, [subjectId]: plan } });
    return plan;
  },
  async ensureBlock(subjectId, blockId) {
    const key = subjectId + ':' + blockId;
    if (this._blocks[key]) return this._blocks[key];
    const block = (await api.studyBlock(subjectId, blockId)).block;
    this._blocks[key] = block;
    return block;
  },
  async loadSequence(subjectId, deterministicResult) {
    const sequence = (await api.adaptiveSequence({
      subjectId,
      sessionId: getSessionId(),
      blockId: store.get().activeBlockId || null,
      deterministicResult: deterministicResult || null
    })).sequence;
    store.set({ sequence });
    return sequence;
  }
};

const ctx = {
  store, api, data, fb, track, FE, toast, refreshHealth,
  go: (key, params) => router.go(key, params)
};

/* ---------------- auth (opcional) ---------------- */
function onSignIn() {
  if (!fb.available()) { toast('Login no disponible en este entorno', 'warn'); return; }
  fb.signInGoogle().catch((e) => toast('No se pudo iniciar sesion: ' + (e.message || ''), 'bad'));
}
function onSignOut() {
  fb.signOut().then(() => toast('Sesion cerrada', 'ok'));
}

function paintTopbar() {
  renderTopbar(topbarEl, {
    subjects: store.get().subjects,
    activeSubjectId: store.get().activeSubjectId,
    health: store.get().health,
    user: store.get().user,
    firebaseReady: fb.available(),
    onMenu: () => (document.body.classList.contains('rail-open') ? closeRail() : openRail()),
    onSubject: (folder) => { setActiveSubject(folder); rerenderCurrent(); },
    onSearch: (text) => onSearch(text),
    onSignIn,
    onSignOut
  });
}

/* ---------------- routing / render ---------------- */
async function renderView(key, params) {
  setActiveNav(sidebarEl, key);
  closeRail();
  window.scrollTo({ top: 0 });
  const view = views[key] || views.inicio;
  try {
    await view.render(viewEl, ctx, params || {});
  } catch (err) {
    viewEl.innerHTML = errorState(err.message || 'Error inesperado.');
  }
}

const router = createRouter(({ key, params }) => renderView(key, params));

function rerenderCurrent() {
  const { key, params } = router.parse();
  renderView(key, params);
}

/* ---------------- global delegation ---------------- */
delegate(viewEl, '[data-go]', 'click', (_event, el) => {
  if (el.dataset.selectSubject) setActiveSubject(el.dataset.selectSubject);
  let params = {};
  if (el.dataset.params) { try { params = JSON.parse(el.dataset.params); } catch { params = {}; } }
  router.go(el.dataset.go, params);
});
delegate(viewEl, '[data-select-subject]:not([data-go])', 'click', (_event, el) => {
  setActiveSubject(el.dataset.selectSubject);
  rerenderCurrent();
});
delegate(viewEl, '[data-retry]', 'click', () => rerenderCurrent());

backdrop.addEventListener('click', closeRail);

/* ---------------- boot ---------------- */
(async function boot() {
  renderSidebar(sidebarEl, { active: 'inicio', onNav: (k) => router.go(k) });

  await refreshHealth();
  try {
    await data.ensureSubjects();
  } catch (err) {
    viewEl.innerHTML = errorState('No se pudo conectar con el backend. ¿Esta corriendo el servidor? ' + (err.message || ''));
  }

  paintTopbar();

  // Login OPCIONAL: la app funciona en sesion local; Google login agrega
  // persistencia por UID. No hay gate — respeta el "uso gratuito sin friccion".
  if (fb.available()) {
    fb.onAuth((user) => {
      store.set({ user: user ? fb.adaptUser(user) : null });
      paintTopbar();
      if (user) fb.logEvent({ type: 'cockpit_session_open', subjectId: store.get().activeSubjectId || null });
    });
  }

  router.start();
})();

function onSearch(text) {
  const q = String(text || '').trim().toLowerCase();
  if (!q) return;
  const map = [
    ['materia', 'materias'], ['aprend', 'aprender'], ['estud', 'aprender'], ['tema', 'aprender'],
    ['eval', 'evaluar'], ['intento', 'evaluar'], ['examen', 'evaluar'],
    ['devol', 'devolucion'], ['feedback', 'devolucion'], ['correc', 'devolucion'],
    ['gemini', 'gemini'], ['ia', 'gemini'],
    ['kb', 'kb'], ['biblio', 'kb'],
    ['contrato', 'contrato'], ['inicio', 'inicio']
  ];
  const hit = map.find(([k]) => q.includes(k));
  router.go(hit ? hit[1] : 'inicio');
}
