// Sidebar navigation component.
import { delegate } from './ui.js';
import { brandMark } from './logo.js';

const ICONS = {
  inicio: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>',
  materias: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M20 18H6.5A2.5 2.5 0 0 0 4 20.5"/>',
  aprender: '<path d="M12 4 3 8l9 4 9-4z"/><path d="M7 10v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5"/>',
  evaluar: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  devolucion: '<path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/>',
  gemini: '<path d="M12 3l2.2 6.3L20 12l-5.8 2.7L12 21l-2.2-6.3L4 12l5.8-2.7z"/>',
  kb: '<path d="M4 6a2 2 0 0 1 2-2h12v16H6a2 2 0 0 1-2-2z"/><path d="M8 4v16"/>',
  contrato: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'
};

const NAV = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'materias', label: 'Materias' },
  { key: 'aprender', label: 'Aprender' },
  { key: 'evaluar', label: 'Evaluar' },
  { key: 'devolucion', label: 'Devolucion' },
  { key: 'gemini', label: 'Gemini' },
  { key: 'kb', label: 'KB' },
  { key: 'contrato', label: 'Contrato' }
];

function icon(key) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[key] || ''}</svg>`;
}

export function renderSidebar(root, { active, onNav }) {
  root.innerHTML = `
    <div class="brand">
      <div class="brand-logo">${brandMark({ size: 46, id: 'nx-rail' })}</div>
      <div>
        <div class="brand-name">NEXUS</div>
        <span class="brand-sub">Study Cockpit FCE</span>
      </div>
    </div>
    <nav class="nav">
      ${NAV.map((item) => `
        <button class="nav-item ${item.key === active ? 'active' : ''}" data-nav="${item.key}" ${item.key === active ? 'aria-current="page"' : ''}>
          ${icon(item.key)}<span>${item.label}</span>
        </button>
      `).join('')}
    </nav>
    <div class="sidebar-help">
      <strong>Estudia, intenta, reentrena.</strong>
      <p>El backend corrige y la devolucion te lleva al bloque que mas afecta tu nota.</p>
    </div>
  `;

  delegate(root, '[data-nav]', 'click', (_event, el) => onNav(el.dataset.nav));
}

export function setActiveNav(root, active) {
  root.querySelectorAll('.nav-item').forEach((el) => {
    const on = el.dataset.nav === active;
    el.classList.toggle('active', on);
    if (on) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
}
