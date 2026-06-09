// Shared UI snippet builders (return HTML strings) + tiny DOM helpers.
import { escapeHtml } from '../format.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Event delegation helper.
export function delegate(root, selector, type, handler) {
  root.addEventListener(type, (event) => {
    const match = event.target.closest(selector);
    if (match && root.contains(match)) handler(event, match);
  });
}

export function loadingState(text = 'Cargando...') {
  return `<div class="state"><div class="spinner"></div><p>${escapeHtml(text)}</p></div>`;
}

export function skeletonRows(count = 3) {
  return `<div class="card">${Array.from({ length: count })
    .map(() => '<div class="skeleton sk-line" style="width:' + (60 + Math.round(Math.random() * 35)) + '%"></div>')
    .join('')}</div>`;
}

export function errorState(message, retryAttr = '') {
  return `<div class="error-box"><b>No se pudo cargar.</b><p>${escapeHtml(message)}</p>${
    retryAttr ? `<div class="btn-row" style="margin-top:10px"><button class="btn btn-sm" ${retryAttr}>Reintentar</button></div>` : ''
  }</div>`;
}

export function emptyState(title, message, action = '') {
  return `<div class="state">
    <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
    <div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div>
    ${action}
  </div>`;
}

export function chip(text, tone = '') {
  return `<span class="chip ${tone}">${escapeHtml(text)}</span>`;
}
