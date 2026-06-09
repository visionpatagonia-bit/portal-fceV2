// Topbar: menu (mobile), command search, subject switch, backend status, session.
import { escapeHtml } from '../format.js';
import { $ } from './ui.js';
import { getSessionId } from '../telemetry.js';

const PERSON_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/></svg>';
const GOOGLE_G = '<svg viewBox="0 0 24 24" width="15" height="15"><path fill="#4285F4" d="M21.6 12.2c0-.6-.05-1.2-.15-1.8H12v3.4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.1z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .95-3.4.95-2.6 0-4.8-1.75-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.95a6 6 0 0 1 0-3.9V7.45H3.1a10 10 0 0 0 0 9.1z"/><path fill="#EA4335" d="M12 5.95c1.45 0 2.75.5 3.8 1.5l2.8-2.8A10 10 0 0 0 12 2a10 10 0 0 0-8.9 5.45l3.3 2.6C7.2 7.7 9.4 5.95 12 5.95z"/></svg>';

function initials(name) {
  const parts = String(name || 'E').trim().split(/\s+/);
  return ((parts[0]?.[0] || 'E') + (parts[1]?.[0] || '')).toUpperCase();
}

function userPill(user, firebaseReady) {
  if (user) {
    return `<div class="user-pill" title="${escapeHtml(user.email || 'Sesion Google')}">
      <div class="avatar">${escapeHtml(initials(user.displayName))}</div>
      <div class="user-meta"><strong>${escapeHtml(user.displayName || 'Estudiante')}</strong><span>${escapeHtml(user.email || 'Google')}</span></div>
      <button class="btn btn-sm" id="signOutBtn" title="Cerrar sesion" style="margin-left:8px">Salir</button>
    </div>`;
  }
  return `<div class="user-pill" title="Sesion anonima local, sin login. Entra con Google para guardar tu progreso entre dispositivos.">
    <div class="avatar" aria-hidden="true">${PERSON_ICON}</div>
    <div class="user-meta"><strong>Sesion local</strong><span>${escapeHtml(sessionLabel())}</span></div>
    ${firebaseReady ? `<button class="btn btn-primary btn-sm" id="signInBtn" style="margin-left:8px">${GOOGLE_G} Entrar</button>` : ''}
  </div>`;
}

function llmConfigured(health) {
  if (!health || !health.llm) return false;
  return typeof health.llm === 'object' ? Boolean(health.llm.configured) : health.llm !== 'not_configured';
}

export function renderTopbar(root, { subjects, activeSubjectId, health, user = null, firebaseReady = false, onMenu, onSubject, onSearch, onSignIn, onSignOut }) {
  root.innerHTML = `
    <button class="menu-btn" id="menuBtn" aria-label="Abrir menu">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
    <label class="search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
      <input id="searchInput" type="search" autocomplete="off" placeholder="Ir a tema, intento, Gemini, KB...">
      <kbd>Ctrl K</kbd>
    </label>
    <select class="subject-switch" id="subjectSwitch" aria-label="Materia activa">
      ${subjects.map((s) => `<option value="${escapeHtml(s.folder)}" ${s.folder === activeSubjectId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
    </select>
    <div class="topbar-status" id="topStatus">${statusChips(health)}</div>
    ${userPill(user, firebaseReady)}
  `;

  $('#menuBtn', root).addEventListener('click', onMenu);
  $('#subjectSwitch', root).addEventListener('change', (e) => onSubject(e.target.value));
  const signIn = $('#signInBtn', root); if (signIn && onSignIn) signIn.addEventListener('click', onSignIn);
  const signOut = $('#signOutBtn', root); if (signOut && onSignOut) signOut.addEventListener('click', onSignOut);

  const search = $('#searchInput', root);
  search.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    onSearch(search.value);
    search.value = '';
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); search.focus(); }
  });
}

function sessionLabel() {
  return '#' + String(getSessionId()).replace(/^cockpit-/, '').toUpperCase();
}

function statusChips(health) {
  const apiOk = Boolean(health && health.ok);
  const llm = llmConfigured(health);
  return `
    <span class="chip ${apiOk ? 'ok' : 'bad'}"><span class="dot"></span>${apiOk ? 'Backend online' : 'Backend offline'}</span>
    <span class="chip ${llm ? 'ok' : 'warn'}"><span class="dot"></span>${llm ? 'Gemini activo' : 'Gemini no config.'}</span>
  `;
}

export function updateTopbarStatus(root, health) {
  const el = $('#topStatus', root);
  if (el) el.innerHTML = statusChips(health);
}

export function setSubjectSwitch(root, folder) {
  const el = $('#subjectSwitch', root);
  if (el) el.value = folder;
}
