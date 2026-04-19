/* ═══════════════════════════════════════════════════════════════════════
   NEXUS SOVEREIGN  ·  Foundation A11y  ·  v19.33.0 · 2026-04-19
   ───────────────────────────────────────────────────────────────────────
   Fase 4.3.1 · Helpers de accesibilidad reutilizables por componentes
   Sovereign (toast, modal, drawer, panic dialog, etc).

   No-ops si el modo activo es legacy — el script se carga siempre pero
   sus efectos (focus trap, inert, announces) son opt-in: solo se aplican
   cuando un componente Sovereign los invoca explícitamente.

   API pública (window.NexusA11y):
     .trapFocus(container)       → instala focus trap (tab cycling) + foco inicial
     .releaseTrap()              → desmonta el trap activo + restaura foco previo
     .setInert(els, bool)        → marca/desmarca elementos como inert + aria-hidden
     .announce(msg, priority?)   → SR announce vía live region (polite|assertive)
     .saveFocus() / .restoreFocus() → stack manual de focus (para flujos custom)
     .getFocusable(container)    → array de elementos focuseables visibles

   Live regions: dos divs invisibles (#sv-live-polite, #sv-live-assertive)
   se inyectan en <body> al DOMContentLoaded. Las clases .sv-sr-only y
   .sv-skip-link viven en nexus-sovereign.css §6.

   Idempotente: si NexusA11y.version ya existe, el módulo no se re-instala.
   ═══════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  /* ── Idempotency guard ──────────────────────────────────────────────── */
  if (window.NexusA11y && window.NexusA11y.version) {
    /* Ya cargado — no re-instalar. Permite hot-reload sin doble binding. */
    return;
  }

  const VERSION = '19.33.0';
  const LIVE_POLITE_ID    = 'sv-live-polite';
  const LIVE_ASSERTIVE_ID = 'sv-live-assertive';

  /* ── Focusable selector ─────────────────────────────────────────────── */
  /* Cubre todo lo que es navegable por teclado de forma estándar.
     [tabindex="-1"] queda fuera adrede (programmatic-only focus). */
  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    'object',
    'embed',
    'audio[controls]',
    'video[controls]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]:not([contenteditable="false"])'
  ].join(', ');

  /* ── State ──────────────────────────────────────────────────────────── */
  const focusStack = [];   /* Stack de elementos para save/restore de foco. */
  let activeTrap = null;   /* { container, handler, addedTabindex } | null  */

  /* ── Helpers internos ───────────────────────────────────────────────── */

  function isVisible(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    /* offsetParent === null cuando display:none o ancestor display:none
       (no detecta visibility:hidden puro pero es 95% de los casos). */
    if (el.offsetParent === null && el.tagName !== 'BODY') {
      /* fixed positioning rompe offsetParent, fallback a getClientRects */
      if (el.getClientRects().length === 0) return false;
    }
    return true;
  }

  function getFocusable(container) {
    if (!container || !(container instanceof HTMLElement)) return [];
    const all = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
    return all.filter(el => {
      if (el.hasAttribute('inert')) return false;
      /* Cualquier ancestro con [inert] también lo deshabilita */
      let p = el.parentElement;
      while (p && p !== container) {
        if (p.hasAttribute('inert')) return false;
        p = p.parentElement;
      }
      return isVisible(el);
    });
  }

  /* ── Save / restore focus stack ─────────────────────────────────────── */

  function saveFocus() {
    focusStack.push(document.activeElement);
  }

  function restoreFocus() {
    const el = focusStack.pop();
    if (el && typeof el.focus === 'function' && document.contains(el)) {
      try { el.focus({ preventScroll: false }); }
      catch (_) { /* element may have become non-focusable */ }
    }
  }

  /* ── Focus trap ─────────────────────────────────────────────────────── */

  function trapFocus(container) {
    if (!container || !(container instanceof HTMLElement)) {
      console.warn('[NexusA11y] trapFocus: container debe ser HTMLElement');
      return null;
    }

    /* Si ya hay un trap activo, lo soltamos antes (no anidamos) */
    if (activeTrap) releaseTrap();

    saveFocus();

    let addedTabindex = false;
    const focusables = getFocusable(container);

    if (focusables.length === 0) {
      /* Sin children focuseables → el container mismo recibe foco
         con tabindex temporal de -1 (reversible al releaseTrap). */
      if (!container.hasAttribute('tabindex')) {
        container.setAttribute('tabindex', '-1');
        addedTabindex = true;
      }
      try { container.focus({ preventScroll: false }); } catch (_) {}
    } else {
      try { focusables[0].focus({ preventScroll: false }); } catch (_) {}
    }

    function handleKey(e) {
      /* Escape se deja pasar — el componente decide cerrar o no.
         Solo interceptamos Tab para hacer el cycling. */
      if (e.key !== 'Tab') return;

      const list = getFocusable(container);
      if (list.length === 0) {
        /* Container vacío: prevenir Tab para no escapar */
        e.preventDefault();
        return;
      }

      const first = list[0];
      const last  = list[list.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          try { last.focus(); } catch (_) {}
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          try { first.focus(); } catch (_) {}
        }
      }
    }

    container.addEventListener('keydown', handleKey);
    activeTrap = { container, handler: handleKey, addedTabindex };
    return activeTrap;
  }

  function releaseTrap() {
    if (!activeTrap) return;
    const { container, handler, addedTabindex } = activeTrap;
    container.removeEventListener('keydown', handler);
    if (addedTabindex && container.getAttribute('tabindex') === '-1') {
      container.removeAttribute('tabindex');
    }
    activeTrap = null;
    restoreFocus();
  }

  /* ── Inert helper (con aria-hidden mirror) ──────────────────────────── */

  function setInert(targets, value) {
    /* targets puede ser: HTMLElement, NodeList, HTMLCollection, Array */
    let list;
    if (!targets) return;
    if (targets instanceof HTMLElement) {
      list = [targets];
    } else if (typeof targets.length === 'number') {
      list = Array.from(targets);
    } else {
      console.warn('[NexusA11y] setInert: targets inválido');
      return;
    }

    const flag = !!value;
    for (const el of list) {
      if (!(el instanceof HTMLElement)) continue;
      if (flag) {
        el.setAttribute('inert', '');
        el.setAttribute('aria-hidden', 'true');
      } else {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      }
    }
  }

  /* ── Live regions ────────────────────────────────────────────────────
     Dos divs invisibles en <body> con aria-live polite/assertive.
     Los componentes llaman announce() para leer texto sin mover el foco.
     ─────────────────────────────────────────────────────────────────── */

  function ensureLiveRegions() {
    if (!document.body) return false;

    if (!document.getElementById(LIVE_POLITE_ID)) {
      const polite = document.createElement('div');
      polite.id = LIVE_POLITE_ID;
      polite.className = 'sv-sr-only';
      polite.setAttribute('aria-live', 'polite');
      polite.setAttribute('aria-atomic', 'true');
      polite.setAttribute('role', 'status');
      document.body.appendChild(polite);
    }

    if (!document.getElementById(LIVE_ASSERTIVE_ID)) {
      const assertive = document.createElement('div');
      assertive.id = LIVE_ASSERTIVE_ID;
      assertive.className = 'sv-sr-only';
      assertive.setAttribute('aria-live', 'assertive');
      assertive.setAttribute('aria-atomic', 'true');
      assertive.setAttribute('role', 'alert');
      document.body.appendChild(assertive);
    }

    return true;
  }

  function announce(message, priority) {
    if (!message) return;
    const id = priority === 'assertive' ? LIVE_ASSERTIVE_ID : LIVE_POLITE_ID;
    const region = document.getElementById(id);
    if (!region) {
      /* Probablemente el script se invocó antes del DOMContentLoaded.
         Reintentamos asegurar regions y postergamos el announce. */
      if (ensureLiveRegions()) {
        setTimeout(() => announce(message, priority), 50);
      } else {
        console.warn('[NexusA11y] announce: live regions no disponibles');
      }
      return;
    }
    /* Limpiar antes para forzar re-anuncio aunque sea el mismo texto.
       Algunos lectores ignoran cambios "duplicados" sin este reset. */
    region.textContent = '';
    setTimeout(() => { region.textContent = String(message); }, 50);
  }

  /* ── Init: live regions cuando <body> está listo ────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureLiveRegions, { once: true });
  } else {
    ensureLiveRegions();
  }

  /* ── Public API ─────────────────────────────────────────────────────── */

  window.NexusA11y = {
    version: VERSION,

    /* Focus management */
    trapFocus,
    releaseTrap,
    saveFocus,
    restoreFocus,
    getFocusable,

    /* Element state */
    setInert,

    /* Screen reader announces */
    announce,

    /* Internals (testing / debugging) */
    _internal: {
      get activeTrap()  { return activeTrap; },
      get focusStack()  { return focusStack.slice(); },
      LIVE_POLITE_ID,
      LIVE_ASSERTIVE_ID,
      FOCUSABLE_SELECTOR,
      ensureLiveRegions
    }
  };

  console.log(`[NexusA11y v${VERSION}] foundation ready`);
})();
