/**
 * ═══════════════════════════════════════════════════════════════════
 * NEXUS UI ADDONS  ·  Portal FCE 2026  ·  v1.0
 * ───────────────────────────────────────────────────────────────────
 *
 * MÓDULOS:
 *   1. initBackToTop()  — botón flotante "volver arriba"
 *   2. initTOCSpy()     — scroll spy para el TOC sticky
 *
 * ARQUITECTURA:
 *   - IIFE completo, sin dependencias de portal.js / nexus-core.js.
 *   - MutationObserver para reinicializar TOC spy cuando el TOC
 *     es inyectado dinámicamente por Nexus6.StickyTOC.inject().
 *   - Safe: todos los init son idempotentes (no duplican elementos).
 * ═══════════════════════════════════════════════════════════════════
 */

(function NexusUIAddons() {
  'use strict';

  /* ── 1. BACK-TO-TOP ─────────────────────────────────────────────── */

  function initBackToTop() {
    // Idempotente
    if (document.getElementById('nexus-back-to-top')) return;

    var btn = document.createElement('button');
    btn.id = 'nexus-back-to-top';
    btn.setAttribute('aria-label', 'Volver al inicio');
    btn.setAttribute('title', 'Volver al inicio');
    btn.innerHTML = '&#8679;'; /* ↑ flecha arriba */
    document.body.appendChild(btn);

    /* Mostrar/ocultar según scroll */
    var scrollTarget = document.getElementById('main-scroll') ||
                       document.querySelector('.nexus-scroll-host') ||
                       window;

    function onScroll() {
      var scrollY = (scrollTarget === window)
        ? window.scrollY
        : scrollTarget.scrollTop;
      if (scrollY > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }

    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); /* estado inicial */

    /* Acción al hacer click */
    btn.addEventListener('click', function () {
      if (scrollTarget === window) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  /* ── 2. TOC SCROLL SPY ──────────────────────────────────────────── */

  var _tocObserver = null;  /* IntersectionObserver activo */

  function initTOCSpy() {
    /* Buscar el TOC */
    var toc = document.querySelector('.nexus-sticky-toc');
    if (!toc) return;

    var links = toc.querySelectorAll('a[href^="#"]');
    if (!links.length) return;

    /* Limpiar observer anterior si existía */
    if (_tocObserver) {
      _tocObserver.disconnect();
      _tocObserver = null;
    }

    /* Recopilar los headings apuntados por los links del TOC */
    var targets = [];
    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) targets.push({ el: el, link: link });
    });

    if (!targets.length) return;

    /* Determinar el área de scroll */
    var scrollRoot = document.getElementById('main-scroll') ||
                     document.querySelector('.nexus-scroll-host') ||
                     null; /* null = viewport */

    /* IntersectionObserver: heading visible en la mitad superior */
    _tocObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        /* Activar el link correspondiente, desactivar el resto */
        targets.forEach(function (t) {
          t.link.classList.remove('nexus-toc-link-active');
        });
        var active = targets.find(function (t) { return t.el === entry.target; });
        if (active) active.link.classList.add('nexus-toc-link-active');
      });
    }, {
      root: scrollRoot,
      rootMargin: '-10% 0px -70% 0px', /* activa en el tercio superior del viewport */
      threshold: 0
    });

    targets.forEach(function (t) {
      t.link.classList.add('nexus-toc-link');
      _tocObserver.observe(t.el);
    });
  }

  /* ── 3. MUTATION OBSERVER — reacción a inyección dinámica del TOC ── */
  /*  Nexus6.StickyTOC.inject() inserta .nexus-sticky-toc en el DOM     */
  /*  después de que el usuario abre un ítem. Detectamos eso aquí.      */

  function watchForTOC() {
    if (!window.MutationObserver) return; /* IE fallback */

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (!node.classList) return;
          if (node.classList.contains('nexus-sticky-toc') ||
              node.querySelector && node.querySelector('.nexus-sticky-toc')) {
            /* TOC inyectado — pequeño delay para que los links se rendericen */
            setTimeout(initTOCSpy, 120);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ── 4. SIDEBAR UNIT SPY — highlight unidad activa en sidebar ────────
     Cuando el usuario scrollea, detectamos qué .mc-unit es visible y
     marcamos el .sb-item correspondiente en el sidebar.
     Matching: sb-item onclick contiene el agrupador → comparar con data-ag.
     Idempotente: se reinicializa al cambiar de página.                   */

  var _unitObserver = null;

  function initUnitSpy() {
    /* Buscar la página activa */
    var activePage = document.querySelector('.page.active [data-mat-dynamic]');
    if (!activePage) return;

    var units = activePage.querySelectorAll('.mc-unit[data-ag]');
    if (!units.length) return;

    if (_unitObserver) { _unitObserver.disconnect(); _unitObserver = null; }

    _unitObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var ag = entry.target.getAttribute('data-ag');
        if (!ag) return;

        /* Desactivar todos los sb-item */
        document.querySelectorAll('.sb-item').forEach(function(it) {
          it.classList.remove('active');
        });

        /* Activar el sb-item cuyo onclick contiene este agrupador */
        var escaped = ag.replace(/'/g, "\\'");
        var match = document.querySelector(
          '.sb-item[onclick*="' + escaped + '"]'
        );
        if (match) {
          match.classList.add('active');
          /* Asegurar que el grupo padre esté expandido */
          var children = match.closest('.sb-children');
          if (children) children.style.display = 'block';
        }
      });
    }, { rootMargin: '-5% 0px -70% 0px', threshold: 0 });

    units.forEach(function(u) { _unitObserver.observe(u); });
  }

  /* Reinicializar unit spy cuando se construye una nueva página */
  function watchForPageChange() {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (!node.querySelector) return;
          if (node.querySelector('.mc-unit')) {
            setTimeout(initUnitSpy, 200);
          }
        });
      });
    });
    /* Observar el contenedor de páginas */
    var container = document.querySelector('.pages') ||
                    document.getElementById('content') ||
                    document.body;
    observer.observe(container, { childList: true, subtree: true });
  }

  /* ── 5. COLOR SYSTEM VALIDATOR (dev helper) ─────────────────────── */

  /**
   * nexusValidateColorUsage(el)
   * ─────────────────────────────────────────────────────────────────
   * Valida que un elemento (o su subárbol) no mezcle tokens de los
   * dos sistemas de color de NEXUS:
   *
   *   SISTEMA CONTEXTUAL → --fce-base, --fce-strong, --fce-soft-*
   *   SISTEMA SEMÁNTICO  → --color-ok, --color-err, --color-warn
   *
   * Uso en console de dev:
   *   nexusValidateColorUsage(document.querySelector('.mat-card'))
   *   nexusValidateColorUsage(document.body)  // audita todo
   *
   * @param {Element} el — elemento raíz a inspeccionar
   * @returns {Object} { ok: boolean, violations: Array }
   * ─────────────────────────────────────────────────────────────────
   */
  function nexusValidateColorUsage(el) {
    if (!el || !(el instanceof Element)) {
      console.warn('[NEXUS] nexusValidateColorUsage: pasá un Element válido.');
      return { ok: false, violations: [] };
    }

    /* Patrones de los dos sistemas */
    var CONTEXTUAL_RE = /var\(--fce-(base|strong|soft-bg|soft-border|rgb)/;
    var SEMANTIC_RE   = /var\(--color-(ok|err|warn)/;

    /* Componentes donde la mezcla es INTENCIONADA y válida.
       Ej: .nxi-area usa fce para el border focus (contextual) y
       .nxi-saved usa color-ok para el estado guardado (semántico),
       pero son elementos hermanos independientes, no el mismo comp. */
    var ALLOWED_MIXED = [
      'NXI-AREA', /* nota de input: fce en borde, color-ok en label adjunto */
    ];

    var violations = [];
    var nodes = el.querySelectorAll('*');

    nodes.forEach(function(node) {
      var style  = node.getAttribute('style') || '';
      var cls    = (node.getAttribute('class') || '').toUpperCase();

      /* ¿Está en lista de excepciones? */
      if (ALLOWED_MIXED.some(function(c) { return cls.includes(c); })) return;

      /* Obtener también estilos computados de custom properties inline */
      var hasContextual = CONTEXTUAL_RE.test(style);
      var hasSemantic   = SEMANTIC_RE.test(style);

      if (hasContextual && hasSemantic) {
        violations.push({
          element:  node,
          tag:      node.tagName.toLowerCase() + (node.className ? '.' + node.className.split(' ').join('.') : ''),
          style:    style,
          issue:    'Mezcla de tokens contextual (--fce-*) + semántico (--color-*) en style inline',
        });
      }
    });

    /* Resultado */
    if (violations.length === 0) {
      console.log(
        '%c[NEXUS Color] ✅ PASS — Sin mezclas de sistemas en ' + el.tagName.toLowerCase(),
        'color:#3fb950;font-weight:bold'
      );
    } else {
      console.warn(
        '%c[NEXUS Color] ⚠ ' + violations.length + ' mezcla(s) detectada(s)',
        'color:#e3b341;font-weight:bold'
      );
      violations.forEach(function(v, i) {
        console.group('Violación ' + (i + 1) + ': ' + v.tag);
        console.log('Elemento:', v.element);
        console.log('Issue:   ', v.issue);
        console.log('Style:   ', v.style);
        console.log('Fix:     ', 'Determinar si es UI estructural → usar --fce-*, o estado → usar --color-*');
        console.groupEnd();
      });
    }

    return { ok: violations.length === 0, violations: violations };
  }

  /* Exponer en window para uso desde la console de dev */
  window.nexusValidateColorUsage = nexusValidateColorUsage;

  /**
   * nexusColorReport()
   * Muestra los tokens activos del sistema en el momento de llamada.
   */
  window.nexusColorReport = function nexusColorReport() {
    var root = getComputedStyle(document.documentElement);
    var get  = function(t) { return root.getPropertyValue(t).trim() || '(no definido)'; };

    console.group('%c[NEXUS Color System] Estado actual', 'color:#58a6ff;font-weight:bold');

    console.group('🎨 SISTEMA CONTEXTUAL (materia activa)');
    console.log('--fce-base        :', get('--fce-base'));
    console.log('--fce-strong      :', get('--fce-strong'));
    console.log('--fce-soft-bg     :', get('--fce-soft-bg'));
    console.log('--fce-soft-border :', get('--fce-soft-border'));
    console.groupEnd();

    console.group('🚦 SISTEMA SEMÁNTICO (estado / feedback)');
    console.log('--color-ok        :', get('--color-ok'));
    console.log('--color-err       :', get('--color-err'));
    console.log('--color-warn      :', get('--color-warn'));
    console.groupEnd();

    console.group('📐 REGLA DE ORO');
    console.log('UI estructural / identidad  → var(--fce-*)');
    console.log('Feedback / estado / quiz    → var(--color-*)');
    console.log('Mezcla en el mismo elem.    → ❌ PROHIBIDO');
    console.log('Auditoría completa          → node nexus-color-audit.js');
    console.groupEnd();

    console.groupEnd();
  };


  /* ── 6. BOOTSTRAP ──────────────────────────────────────────────── */

  function boot() {
    initBackToTop();
    initTOCSpy();         /* por si el TOC ya existe al cargar */
    watchForTOC();        /* observer para TOC inyectado dinámicamente */
    watchForPageChange(); /* observer para sidebar spy en cambio de página */
  }

  /* Esperar a que el DOM esté listo */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
