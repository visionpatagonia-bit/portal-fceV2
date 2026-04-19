/* ═══════════════════════════════════════════════════════════════════════
   NEXUS SOVEREIGN  ·  Components  ·  v19.34.0 · 2026-04-19
   ───────────────────────────────────────────────────────────────────────
   Fase 4.3.2 · Toast + Modal (base + manifesto) + Panic mode.

   Consume primitivas de window.NexusA11y (Fase 4.3.1):
     · NexusA11y.trapFocus / releaseTrap   — para modales (manifesto, futuros)
     · NexusA11y.setInert                   — para siblings del modal abierto
     · NexusA11y.announce                   — para toasts + estado de panic

   API pública (window.NexusComponents):
     .toast.show(message, opts?)    → returns id
     .toast.dismiss(id)
     .toast.dismissAll()

     .modal.open(config)            → returns { id, close }
     .modal.close(id?)              → cierra el top del stack o el id dado

     .manifesto.show()              → caso particular del modal, contenido fijo
     .manifesto.close()

     .panic.isActive()              → bool
     .panic.activate()
     .panic.deactivate()
     .panic.toggle()

   Carga incondicional pero solo ACTÚA en modo Sovereign:
   si data-ui !== "sovereign", los métodos warneán + retornan no-op.

   Idempotente: si NexusComponents.version ya existe, el IIFE retorna.
   ═══════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  if (window.NexusComponents && window.NexusComponents.version) return;

  const VERSION = '19.34.0';

  /* ── Helpers compartidos ──────────────────────────────────────────── */

  function isSovereignMode() {
    return document.documentElement.getAttribute('data-ui') === 'sovereign';
  }

  function requireSovereign(componentName) {
    if (isSovereignMode()) return true;
    console.warn(`[NexusComponents] ${componentName}: solo funciona en modo sovereign (?ui=sovereign)`);
    return false;
  }

  function a11y() {
    return window.NexusA11y || null;
  }

  function uid(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 9);
  }

  function createEl(tag, attrs, children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'class') el.className = attrs[k];
        else if (k === 'html') el.innerHTML = attrs[k];
        else if (k === 'text') el.textContent = attrs[k];
        else if (k.startsWith('on') && typeof attrs[k] === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else {
          el.setAttribute(k, attrs[k]);
        }
      }
    }
    if (children) {
      for (const c of children) {
        if (c == null) continue;
        el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
    }
    return el;
  }

  /* ══════════════════════════════════════════════════════════════════
     TOAST
     ──────────────────────────────────────────────────────────────────
     Stack de notificaciones transitorias en esquina top-right.
     - Variants: info (default), success, warning, danger
     - Auto-dismiss configurable (default 5000ms, null = sticky)
     - Click en close cancela el timer y remueve
     - Cada show() anuncia vía NexusA11y.announce (polite por default,
       assertive para variant=danger)
     ══════════════════════════════════════════════════════════════════ */

  const TOAST_ROOT_ID = 'sv-toast-root';
  const TOAST_DEFAULT_DURATION = 5000;

  const toastRegistry = new Map();  /* id → { el, timer } */

  function ensureToastRoot() {
    let root = document.getElementById(TOAST_ROOT_ID);
    if (!root) {
      root = createEl('div', {
        id: TOAST_ROOT_ID,
        'aria-live': 'off',      /* los toasts anuncian vía NexusA11y live regions */
        'aria-atomic': 'false'
      });
      document.body.appendChild(root);
    }
    return root;
  }

  function toastShow(message, opts) {
    if (!requireSovereign('toast.show')) return null;
    opts = opts || {};

    const id       = opts.id || uid('sv-toast');
    const variant  = ['info','success','warning','danger'].indexOf(opts.variant) >= 0
                     ? opts.variant : 'info';
    const duration = opts.duration === null ? null
                     : (typeof opts.duration === 'number' ? opts.duration : TOAST_DEFAULT_DURATION);
    const title    = opts.title || null;

    const root = ensureToastRoot();

    const closeBtn = createEl('button', {
      class: 'sv-toast-close',
      'aria-label': 'Cerrar notificación',
      type: 'button'
    }, ['×']);

    const titleEl = title
      ? createEl('div', { class: 'sv-toast-title', text: title })
      : null;
    const msgEl = createEl('div', { class: 'sv-toast-msg', text: String(message) });

    const bodyEl = createEl('div', { class: 'sv-toast-body' }, [titleEl, msgEl]);

    const toastEl = createEl('div', {
      id,
      class: `sv-toast sv-toast--${variant}`,
      role: variant === 'danger' ? 'alert' : 'status',
      'data-variant': variant
    }, [bodyEl, closeBtn]);

    root.appendChild(toastEl);

    /* Trigger show animation en next frame */
    requestAnimationFrame(() => toastEl.classList.add('sv-toast--show'));

    /* A11y: anuncio */
    const a = a11y();
    if (a && a.announce) {
      const announcement = title ? `${title}. ${message}` : message;
      a.announce(announcement, variant === 'danger' ? 'assertive' : 'polite');
    }

    /* Auto-dismiss */
    let timer = null;
    if (duration !== null && duration > 0) {
      timer = setTimeout(() => toastDismiss(id), duration);
    }

    closeBtn.addEventListener('click', () => toastDismiss(id));

    toastRegistry.set(id, { el: toastEl, timer });
    return id;
  }

  function toastDismiss(id) {
    const entry = toastRegistry.get(id);
    if (!entry) return false;
    if (entry.timer) clearTimeout(entry.timer);

    entry.el.classList.remove('sv-toast--show');
    entry.el.classList.add('sv-toast--leaving');
    const cleanup = () => {
      if (entry.el.parentNode) entry.el.parentNode.removeChild(entry.el);
      toastRegistry.delete(id);
    };
    /* Cleanup on transition end o fallback a 400ms */
    entry.el.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 400);
    return true;
  }

  function toastDismissAll() {
    for (const id of Array.from(toastRegistry.keys())) toastDismiss(id);
  }

  /* ══════════════════════════════════════════════════════════════════
     MODAL (primitive reusable)
     ──────────────────────────────────────────────────────────────────
     Abre un overlay + panel con focus trap. Esc y click-outside cierran.
     Stack-capable (modals anidados posibles pero desalentados).
     ══════════════════════════════════════════════════════════════════ */

  const MODAL_ROOT_ID = 'sv-modal-root';
  const modalStack = [];   /* [{ id, overlay, panel, onClose, siblingsMarkedInert }] */

  function ensureModalRoot() {
    let root = document.getElementById(MODAL_ROOT_ID);
    if (!root) {
      root = createEl('div', { id: MODAL_ROOT_ID });
      document.body.appendChild(root);
    }
    return root;
  }

  function modalOpen(config) {
    if (!requireSovereign('modal.open')) return null;
    config = config || {};

    const id       = config.id || uid('sv-modal');
    const variant  = config.variant || 'default';
    const title    = config.title || '';
    const bodyHtml = config.bodyHtml || '';
    const onClose  = typeof config.onClose === 'function' ? config.onClose : null;

    const root = ensureModalRoot();

    const labelledBy = uid('sv-modal-title');

    const closeBtn = createEl('button', {
      class: 'sv-modal-close',
      'aria-label': 'Cerrar',
      type: 'button'
    }, ['×']);

    const header = title
      ? createEl('header', { class: 'sv-modal-header' }, [
          createEl('h2', { class: 'sv-modal-title', id: labelledBy, text: title }),
          closeBtn
        ])
      : createEl('header', { class: 'sv-modal-header sv-modal-header--nude' }, [closeBtn]);

    const body = createEl('div', {
      class: 'sv-modal-body',
      html: bodyHtml
    });

    const panel = createEl('div', {
      class: `sv-modal sv-modal--${variant}`,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': title ? labelledBy : null,
      tabindex: '-1'
    }, [header, body]);
    /* Remover aria-labelledby si no hubo título */
    if (!title) panel.removeAttribute('aria-labelledby');

    const overlay = createEl('div', {
      id,
      class: 'sv-modal-overlay',
      'data-open': 'false'
    }, [panel]);

    root.appendChild(overlay);

    /* Marcar siblings del <body> como inert (excepto el modal root y el toast root) */
    const siblingsMarkedInert = [];
    const a = a11y();
    if (a && a.setInert) {
      for (const child of Array.from(document.body.children)) {
        if (child === root || child.id === TOAST_ROOT_ID) continue;
        if (child.hasAttribute('inert')) continue;   /* ya inert por otra causa */
        siblingsMarkedInert.push(child);
      }
      a.setInert(siblingsMarkedInert, true);
    }

    /* Trigger open animation */
    requestAnimationFrame(() => overlay.setAttribute('data-open', 'true'));

    /* Focus trap en el panel */
    if (a && a.trapFocus) a.trapFocus(panel);

    /* Handlers de cierre */
    function handleKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        modalClose(id);
      }
    }
    function handleOverlayClick(e) {
      if (e.target === overlay) modalClose(id);
    }
    overlay.addEventListener('click', handleOverlayClick);
    document.addEventListener('keydown', handleKey);
    closeBtn.addEventListener('click', () => modalClose(id));

    modalStack.push({
      id, overlay, panel, onClose, siblingsMarkedInert,
      handleKey, handleOverlayClick
    });

    return {
      id,
      close: () => modalClose(id)
    };
  }

  function modalClose(idOrUndefined) {
    if (modalStack.length === 0) return false;

    /* Encontrar el modal target (id específico o top del stack) */
    let idx;
    if (idOrUndefined) {
      idx = modalStack.findIndex(m => m.id === idOrUndefined);
      if (idx < 0) return false;
    } else {
      idx = modalStack.length - 1;
    }

    const m = modalStack[idx];
    modalStack.splice(idx, 1);

    m.overlay.setAttribute('data-open', 'false');
    document.removeEventListener('keydown', m.handleKey);

    const a = a11y();
    if (a && a.releaseTrap) a.releaseTrap();
    if (a && a.setInert && m.siblingsMarkedInert.length) {
      a.setInert(m.siblingsMarkedInert, false);
    }

    const cleanup = () => {
      if (m.overlay.parentNode) m.overlay.parentNode.removeChild(m.overlay);
      if (m.onClose) {
        try { m.onClose(); } catch (err) { console.warn('[NexusComponents] onClose threw:', err); }
      }
    };
    m.overlay.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 400);  /* fallback si no hay transition */
    return true;
  }

  /* ══════════════════════════════════════════════════════════════════
     MANIFESTO NEXUS_OS
     ──────────────────────────────────────────────────────────────────
     Caso particular del modal — contenido fijo, variant "manifesto".
     Texto canónico del preview-sovereign.html (item #10 del audit).
     ══════════════════════════════════════════════════════════════════ */

  const MANIFESTO_BODY_HTML = `
    <div class="sv-man-eyebrow">
      <span class="sv-man-tdot" aria-hidden="true"></span>NEXUS_OS · MANIFIESTO
    </div>
    <h3 class="sv-man-headline">
      Esto no es una app. Es un <em>sistema operativo</em> de aprendizaje.
    </h3>
    <p class="sv-man-lead">
      NEXUS está construido como un sistema modular. Cada cátedra es un módulo
      independiente; el core los orquesta bajo un mismo comando. Podés sumar,
      quitar o reemplazar módulos sin tocar el resto. El sistema se adapta al
      entorno, no al revés.
    </p>
    <div class="sv-man-modules" role="list">
      <div class="sv-man-mod sv-man-mod--cont" role="listitem">
        <span class="sv-man-dot" aria-hidden="true"></span>
        <span class="sv-man-mname">Contabilidad</span>
        <span class="sv-man-msub">MÓDULO_01</span>
      </div>
      <div class="sv-man-mod sv-man-mod--adm" role="listitem">
        <span class="sv-man-dot" aria-hidden="true"></span>
        <span class="sv-man-mname">Administración</span>
        <span class="sv-man-msub">MÓDULO_02</span>
      </div>
      <div class="sv-man-mod sv-man-mod--soc" role="listitem">
        <span class="sv-man-dot" aria-hidden="true"></span>
        <span class="sv-man-mname">Sociales</span>
        <span class="sv-man-msub">MÓDULO_03</span>
      </div>
      <div class="sv-man-mod sv-man-mod--prop" role="listitem">
        <span class="sv-man-dot" aria-hidden="true"></span>
        <span class="sv-man-mname">Propedéutica</span>
        <span class="sv-man-msub">MÓDULO_04</span>
      </div>
    </div>
    <blockquote class="sv-man-quote">
      Lo pensé como los <strong>sistemas de armas modulares</strong> de un avión
      de combate: un mismo fuselaje puede llevar cargas distintas según la
      misión. Cambia el payload, no la plataforma. Eso nos da velocidad de
      adaptación que ningún monolito puede alcanzar.
    </blockquote>
    <div class="sv-man-meta">
      <span class="sv-man-mm">ARQUITECTURA · <span class="sv-man-v">MODULAR</span></span>
      <span class="sv-man-mm">ADAPTABILIDAD · <span class="sv-man-v">MULTI-ENTORNO</span></span>
    </div>
  `;

  let manifestoHandle = null;
  function manifestoShow() {
    if (!requireSovereign('manifesto.show')) return null;
    if (manifestoHandle) return manifestoHandle;  /* ya abierto */

    manifestoHandle = modalOpen({
      id: 'sv-modal-manifesto',
      title: null,                  /* el eyebrow interno hace de título */
      variant: 'manifesto',
      bodyHtml: MANIFESTO_BODY_HTML,
      onClose: () => { manifestoHandle = null; }
    });
    return manifestoHandle;
  }

  function manifestoClose() {
    if (!manifestoHandle) return false;
    modalClose(manifestoHandle.id);
    manifestoHandle = null;
    return true;
  }

  /* ══════════════════════════════════════════════════════════════════
     PANIC MODE
     ──────────────────────────────────────────────────────────────────
     Flag en <html data-panic="on"> + persistencia en localStorage.
     El CSS (§9 de nexus-sovereign.css) reacciona atenuando el chrome
     para dejar solo el contenido focal ("modo enfoque extremo").

     Opt-in por decisión D4 (memoria project_fase_4_decisiones):
     no exponer en nav principal hasta tener telemetría.

     Activación:
       · Query param ?panic=on en la URL
       · localStorage['nexus.panic.active'] === 'true' (persistente)
       · NexusComponents.panic.activate()/.toggle() programático
     ══════════════════════════════════════════════════════════════════ */

  const PANIC_STORAGE_KEY = 'nexus.panic.active';
  const PANIC_ATTR = 'data-panic';

  function panicIsActive() {
    return document.documentElement.getAttribute(PANIC_ATTR) === 'on';
  }

  function panicActivate() {
    if (!requireSovereign('panic.activate')) return false;
    if (panicIsActive()) return true;
    document.documentElement.setAttribute(PANIC_ATTR, 'on');
    try { localStorage.setItem(PANIC_STORAGE_KEY, 'true'); } catch (_) {}
    const a = a11y();
    if (a && a.announce) a.announce('Modo pánico activado', 'assertive');
    document.dispatchEvent(new CustomEvent('nexus:panic-changed', {
      detail: { active: true }
    }));
    return true;
  }

  function panicDeactivate() {
    if (!panicIsActive()) return true;
    document.documentElement.removeAttribute(PANIC_ATTR);
    try { localStorage.removeItem(PANIC_STORAGE_KEY); } catch (_) {}
    const a = a11y();
    if (a && a.announce) a.announce('Modo pánico desactivado', 'polite');
    document.dispatchEvent(new CustomEvent('nexus:panic-changed', {
      detail: { active: false }
    }));
    return true;
  }

  function panicToggle() {
    return panicIsActive() ? panicDeactivate() : panicActivate();
  }

  /* Boot: ?panic=on en la URL O localStorage persistente.
     Solo se auto-activa si el modo es sovereign (sino queda noop). */
  function bootPanic() {
    let shouldActivate = false;
    try {
      const params = new URLSearchParams(location.search);
      if (params.get('panic') === 'on') shouldActivate = true;
      else if (localStorage.getItem(PANIC_STORAGE_KEY) === 'true') shouldActivate = true;
    } catch (_) {}
    if (shouldActivate && isSovereignMode()) {
      /* setter directo — evita el warn de requireSovereign durante boot */
      document.documentElement.setAttribute(PANIC_ATTR, 'on');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPanic, { once: true });
  } else {
    bootPanic();
  }

  /* ══════════════════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════════════════ */

  window.NexusComponents = {
    version: VERSION,

    toast: {
      show:        toastShow,
      dismiss:     toastDismiss,
      dismissAll:  toastDismissAll
    },

    modal: {
      open:  modalOpen,
      close: modalClose
    },

    manifesto: {
      show:  manifestoShow,
      close: manifestoClose
    },

    panic: {
      isActive:    panicIsActive,
      activate:    panicActivate,
      deactivate:  panicDeactivate,
      toggle:      panicToggle
    },

    _internal: {
      get toastRegistry() { return toastRegistry; },
      get modalStack()    { return modalStack.slice(); },
      get manifestoHandle() { return manifestoHandle; },
      TOAST_ROOT_ID,
      MODAL_ROOT_ID,
      PANIC_STORAGE_KEY,
      PANIC_ATTR,
      MANIFESTO_BODY_HTML
    }
  };

  console.log(`[NexusComponents v${VERSION}] toast + modal + manifesto + panic ready`);
})();
