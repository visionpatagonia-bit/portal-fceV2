/* ═══════════════════════════════════════════════════════════════════════
   NEXUS SOVEREIGN  ·  Chrome  ·  v19.35.0 · 2026-04-19
   ───────────────────────────────────────────────────────────────────────
   Fase 4.3.3 · Topbar + Sidebar + Skip link (montaje condicional).

   Monta chrome dedicado SOLO cuando data-ui="sovereign":
     1. Skip link (.sv-skip-link) como primer child del body, href="#main"
        — apunta al <main id="main"> legacy existente (WCAG SC 2.4.1)
     2. Topbar fixed (.sv-topbar) — 56px alto, grid [logo | title | actions]
        — role="banner" para landmark
     3. Sidebar fixed (.sv-sidebar) — 260px ancho, scroll interno
        — role="navigation" aria-label="Navegación principal"
        — 3 secciones: Asignaturas (4), Herramientas (3), Sistema (2)

   En modo legacy (data-ui≠sovereign), el IIFE no hace nada visible.
   CSS §10 oculta el chrome legacy (#sb, #topbar) bajo [data-ui="sovereign"],
   por lo que el chrome sovereign se hace cargo completo del layout.

   Consume:
     · window.NexusComponents.manifesto.show / panic.toggle / toast.show
       (Fase 4.3.2) — para las acciones del topbar y feedback de sidebar.

   API pública (window.NexusChrome):
     .mount()        → monta chrome si no está montado (no-op si ya está)
     .unmount()      → desmonta chrome y limpia listeners
     .isMounted()    → bool
     .version        → '19.35.0'

   Eventos (document):
     · nexus:chrome-mounted    — detail: { version }
     · nexus:chrome-unmounted  — detail: { version }

   Observa cambios de data-ui vía MutationObserver: si Juan cambia el modo
   en runtime, el chrome se monta/desmonta en consecuencia.

   Idempotente: si window.NexusChrome.version ya existe, IIFE retorna.
   ═══════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  if (window.NexusChrome && window.NexusChrome.version) return;

  const VERSION = '19.36.1';

  /* IDs estables para el chrome montado (permite query + cleanup) */
  const SKIP_LINK_ID = 'sv-skip-link';
  const TOPBAR_ID    = 'sv-topbar';
  const SIDEBAR_ID   = 'sv-sidebar';

  /* Selectores del chrome legacy que escondemos en sovereign (via CSS §10).
     Los mantenemos acá documentados por si hay que auditar qué se oculta. */
  const LEGACY_CHROME_SELECTORS = ['#topbar', '#sb'];

  /* ── Helpers ─────────────────────────────────────────────────────── */

  function isSovereignMode() {
    return document.documentElement.getAttribute('data-ui') === 'sovereign';
  }

  function components() {
    return window.NexusComponents || null;
  }

  /* v19.36.1: navegación a home — usa window.goto() del legacy si existe
     (portal.js define goto(pageId, el) para cambiar la .page.active).
     Fallback: location.hash + scroll. */
  function goHome() {
    try {
      if (typeof window.goto === 'function') {
        window.goto('home', null);
        return;
      }
    } catch (_) { /* fallthrough */ }
    /* Fallback 1: disparar click en el sidebar legacy de home */
    try {
      const legacyHome = document.querySelector('.sb-item[onclick*="goto(\'home\'"]');
      if (legacyHome && typeof legacyHome.click === 'function') {
        legacyHome.click();
        return;
      }
    } catch (_) {}
    /* Fallback 2: hash + scroll */
    try {
      location.hash = '#home';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (_) {}
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
        } else if (attrs[k] != null) {
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
     SKIP LINK
     ══════════════════════════════════════════════════════════════════ */

  function buildSkipLink() {
    /* Apunta al <main id="main"> legacy. Si no existe por alguna razón,
       apunta a body (fallback WCAG). */
    const target = document.getElementById('main') ? '#main' : '#' + (document.body.id || '');
    return createEl('a', {
      id: SKIP_LINK_ID,
      class: 'sv-skip-link',
      href: target
    }, ['Saltar al contenido principal']);
  }

  /* ══════════════════════════════════════════════════════════════════
     TOPBAR
     ══════════════════════════════════════════════════════════════════ */

  function buildTopbar() {
    /* v19.36.1: logo es botón de "Volver al inicio".
       Mantiene el carácter decorativo pero ahora es navegable. */
    const logo = createEl('button', {
      class: 'sv-topbar-logo',
      type: 'button',
      title: 'Volver al inicio',
      'aria-label': 'Volver al inicio',
      'data-action': 'home',
      onClick: handleHomeClick
    }, ['◆']);
    const title = createEl('button', {
      class: 'sv-topbar-title',
      type: 'button',
      title: 'Volver al inicio',
      'aria-label': 'NEXUS · OS Educativo — volver al inicio',
      onClick: handleHomeClick
    }, [
      createEl('span', { class: 'sv-topbar-brand', text: 'NEXUS' }),
      createEl('span', { class: 'sv-topbar-sep', 'aria-hidden': 'true', text: '·' }),
      createEl('span', { class: 'sv-topbar-subtitle', text: 'OS Educativo' })
    ]);

    /* Badge de versión — discreto, demo-friendly */
    const badge = createEl('div', {
      class: 'sv-topbar-badge',
      title: 'Interfaz Sovereign activa'
    }, [
      createEl('span', { class: 'sv-topbar-badge-dot', 'aria-hidden': 'true' }),
      'SOVEREIGN v' + VERSION
    ]);

    /* Botón manifesto */
    const btnManifesto = createEl('button', {
      class: 'sv-topbar-btn sv-topbar-btn--primary',
      type: 'button',
      'data-action': 'manifesto',
      onClick: handleManifestoClick
    }, ['Manifiesto']);

    /* Botón pánico (toggle visual) */
    const btnPanic = createEl('button', {
      class: 'sv-topbar-btn sv-topbar-btn--ghost',
      type: 'button',
      'data-action': 'panic',
      'aria-pressed': 'false',
      title: 'Alternar Modo Pánico (enfoque extremo)',
      onClick: handlePanicClick
    }, [
      createEl('span', { class: 'sv-topbar-btn-dot', 'aria-hidden': 'true' }),
      'Pánico'
    ]);

    const actions = createEl('div', { class: 'sv-topbar-actions' }, [
      badge, btnManifesto, btnPanic
    ]);

    const spacer = createEl('div', { class: 'sv-topbar-spacer' });

    return createEl('header', {
      id: TOPBAR_ID,
      class: 'sv-topbar',
      role: 'banner'
    }, [logo, title, spacer, actions]);
  }

  function handleHomeClick(e) {
    e.preventDefault();
    goHome();
  }

  function handleManifestoClick(e) {
    e.preventDefault();
    const c = components();
    if (c && c.manifesto && c.manifesto.show) {
      c.manifesto.show();
    } else {
      console.warn('[NexusChrome] NexusComponents.manifesto no disponible');
    }
  }

  function handlePanicClick(e) {
    e.preventDefault();
    const c = components();
    if (c && c.panic && c.panic.toggle) {
      c.panic.toggle();
      /* Sync aria-pressed con el nuevo estado */
      const btn = e.currentTarget;
      btn.setAttribute('aria-pressed', String(c.panic.isActive()));
    } else {
      console.warn('[NexusChrome] NexusComponents.panic no disponible');
    }
  }

  /* Listener global para mantener sync aria-pressed si panic cambia
     desde afuera (ej: keyboard shortcut, query param). */
  function handlePanicChanged(e) {
    const btn = document.querySelector(`#${TOPBAR_ID} [data-action="panic"]`);
    if (btn) btn.setAttribute('aria-pressed', String(!!(e.detail && e.detail.active)));
  }

  /* ══════════════════════════════════════════════════════════════════
     SIDEBAR
     ══════════════════════════════════════════════════════════════════ */

  const SIDEBAR_SECTIONS = [
    {
      /* v19.36.1: sección Navegación con "Inicio" — Juan reportó que no
         había forma de volver a la página principal desde Sovereign. */
      heading: 'Navegación',
      items: [
        { label: 'Inicio', icon: '⌂', action: 'home' }
      ]
    },
    {
      heading: 'Asignaturas',
      items: [
        { label: 'Contabilidad',   subject: 'cont', href: '#home' },
        { label: 'Administración', subject: 'adm',  href: '#home' },
        { label: 'Sociales',       subject: 'soc',  href: '#home' },
        { label: 'Propedéutica',   subject: 'prop', href: '#home' }
      ]
    },
    {
      heading: 'Herramientas',
      items: [
        { label: 'Quiz',       icon: 'Q', href: '#nexus-quiz' },
        { label: 'Flashcards', icon: 'F', href: '#home' },
        { label: 'Exámenes',   icon: 'E', href: '#nexus-examen' }
      ]
    },
    {
      heading: 'Sistema',
      items: [
        { label: 'Manifiesto', icon: '✦', action: 'manifesto' },
        { label: 'Modo Pánico', icon: '!', action: 'panic' }
      ]
    }
  ];

  function buildSidebar() {
    const nav = createEl('nav', {
      id: SIDEBAR_ID,
      class: 'sv-sidebar',
      role: 'navigation',
      'aria-label': 'Navegación principal'
    });

    for (const section of SIDEBAR_SECTIONS) {
      const heading = createEl('div', {
        class: 'sv-sidebar-section',
        text: section.heading
      });
      nav.appendChild(heading);

      const list = createEl('ul', { class: 'sv-sidebar-list', role: 'list' });
      for (const item of section.items) {
        list.appendChild(buildSidebarItem(item));
      }
      nav.appendChild(list);
    }

    return nav;
  }

  function buildSidebarItem(item) {
    const li = createEl('li', { class: 'sv-sidebar-li' });

    const children = [];
    if (item.subject) {
      children.push(createEl('span', {
        class: `sv-sidebar-bullet sv-sidebar-bullet--${item.subject}`,
        'aria-hidden': 'true'
      }));
    } else if (item.icon) {
      children.push(createEl('span', {
        class: 'sv-sidebar-icon',
        'aria-hidden': 'true',
        text: item.icon
      }));
    }
    children.push(createEl('span', { class: 'sv-sidebar-label', text: item.label }));

    const attrs = {
      class: 'sv-sidebar-link',
      type: item.action ? 'button' : null,
      href: item.href || null,
      'data-action': item.action || null,
      onClick: handleSidebarClick
    };

    const link = createEl(item.action ? 'button' : 'a', attrs, children);
    li.appendChild(link);
    return li;
  }

  function handleSidebarClick(e) {
    const el = e.currentTarget;
    const action = el.getAttribute('data-action');
    if (action === 'home') {
      e.preventDefault();
      goHome();
      return;
    }
    if (action === 'manifesto') {
      e.preventDefault();
      handleManifestoClick(e);
      return;
    }
    if (action === 'panic') {
      e.preventDefault();
      const c = components();
      if (c && c.panic) c.panic.toggle();
      return;
    }
    /* Caso link a sección legacy (#home, #nexus-quiz, etc):
       dejamos al navegador hacer el scroll nativo. */
  }

  /* ══════════════════════════════════════════════════════════════════
     MOUNT / UNMOUNT
     ══════════════════════════════════════════════════════════════════ */

  let _mounted = false;

  function isMounted() { return _mounted; }

  function mount() {
    if (_mounted) return false;
    if (!isSovereignMode()) {
      console.warn('[NexusChrome] mount: no-op en legacy mode (data-ui≠sovereign)');
      return false;
    }
    if (!document.body) {
      console.warn('[NexusChrome] mount: body no existe todavía');
      return false;
    }

    /* Skip link — primer child del body por WCAG */
    const skip = buildSkipLink();
    if (document.body.firstChild) {
      document.body.insertBefore(skip, document.body.firstChild);
    } else {
      document.body.appendChild(skip);
    }

    /* Topbar */
    const topbar = buildTopbar();
    document.body.appendChild(topbar);

    /* Sidebar */
    const sidebar = buildSidebar();
    document.body.appendChild(sidebar);

    /* Sync inicial de aria-pressed del panic button si ya está activo */
    const c = components();
    if (c && c.panic && c.panic.isActive()) {
      const btn = topbar.querySelector('[data-action="panic"]');
      if (btn) btn.setAttribute('aria-pressed', 'true');
    }

    /* Listener para mantener sync de panic */
    document.addEventListener('nexus:panic-changed', handlePanicChanged);

    _mounted = true;
    document.dispatchEvent(new CustomEvent('nexus:chrome-mounted', {
      detail: { version: VERSION }
    }));
    return true;
  }

  function unmount() {
    if (!_mounted) return false;

    [SKIP_LINK_ID, TOPBAR_ID, SIDEBAR_ID].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });

    document.removeEventListener('nexus:panic-changed', handlePanicChanged);

    _mounted = false;
    document.dispatchEvent(new CustomEvent('nexus:chrome-unmounted', {
      detail: { version: VERSION }
    }));
    return true;
  }

  /* ══════════════════════════════════════════════════════════════════
     OBSERVE data-ui CHANGES
     ──────────────────────────────────────────────────────────────────
     Si en runtime alguien cambia data-ui (ej: NexusUIMode.switch en
     Fase 4.1), re-sincronizamos el montaje.
     ══════════════════════════════════════════════════════════════════ */

  function handleUIChange() {
    const shouldBeMounted = isSovereignMode();
    if (shouldBeMounted && !_mounted) mount();
    else if (!shouldBeMounted && _mounted) unmount();
  }

  let _observer = null;
  function startObserver() {
    if (_observer || typeof MutationObserver === 'undefined') return;
    _observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-ui') {
          handleUIChange();
          return;
        }
      }
    });
    _observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-ui']
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     BOOT
     ══════════════════════════════════════════════════════════════════ */

  function boot() {
    startObserver();
    if (isSovereignMode()) mount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ══════════════════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════════════════ */

  window.NexusChrome = {
    version: VERSION,
    mount,
    unmount,
    isMounted,
    _internal: {
      SKIP_LINK_ID,
      TOPBAR_ID,
      SIDEBAR_ID,
      LEGACY_CHROME_SELECTORS,
      SIDEBAR_SECTIONS,
      buildSkipLink,
      buildTopbar,
      buildSidebar
    }
  };

  console.log(`[NexusChrome v${VERSION}] topbar + sidebar + skip link ready`);
})();
