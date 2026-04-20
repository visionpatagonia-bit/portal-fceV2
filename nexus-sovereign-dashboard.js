/**
 * nexus-sovereign-dashboard.js  ·  v19.36.0
 * ─────────────────────────────────────────────────────────────
 * Fase 4.4 — Dashboard Sovereign (Scope 1 + 2)
 *
 * Enhancer NO destructivo que reviste el hero y el CTA Pánico
 * del dashboard legacy con tratamiento cyberpunk cuando
 * <html data-ui="sovereign">.
 *
 * Principio de diseño:
 *   - No rompe DOM legacy — lo envuelve/oculta selectivamente.
 *   - Mantiene todos los onclick legacy (NexusExamen.open,
 *     n75OpenLegajo, etc).
 *   - unmount() restaura estado 1:1.
 *   - Gate por requireSovereign() — nada hace en legacy.
 *   - MutationObserver en #dash-nombre para sincronizar el
 *     nombre del usuario cuando el login lo actualiza.
 *
 * API expuesta:
 *   window.NexusDashboard = {
 *     version, mount(), unmount(), isMounted(), _internal
 *   }
 *
 * Depende de: NexusUIMode (para leer data-ui), horarios.json
 * (para próxima clase). Si horarios.json falla, degrada a un
 * subtítulo genérico.
 * ─────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  /* Idempotencia — si el módulo ya corrió, no redefinir. */
  if (global.NexusDashboard && global.NexusDashboard.version) return;

  var VERSION = '19.36.0';

  /* ── Constantes internas ────────────────────────────────── */
  var HERO_ID         = 'sv-hero';
  var PANIC_WRAP_ATTR = 'data-sv-panic-original';
  var HOME_PAGE_ID    = 'home';
  var DASH_NOMBRE_ID  = 'dash-nombre';

  /* Días de la semana en orden canónico (horarios.json) */
  var DIAS_ORDER = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

  /* ── Estado ─────────────────────────────────────────────── */
  var state = {
    mounted: false,
    heroNode: null,
    panicButton: null,
    panicOriginalHtml: null,
    panicOriginalClass: null,
    legacyHeroH1: null,
    legacyHeroBreadcrumb: null,
    dashNombreObserver: null,
    horarios: null
  };

  /* ── Utilities ──────────────────────────────────────────── */
  function requireSovereign() {
    var mode = document.documentElement.getAttribute('data-ui');
    if (mode !== 'sovereign') {
      if (global.console && console.info) {
        console.info('[NexusDashboard] modo legacy — no monta');
      }
      return false;
    }
    return true;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!attrs.hasOwnProperty(k)) continue;
        if (k === 'class')       node.className = attrs[k];
        else if (k === 'html')   node.innerHTML = attrs[k];
        else if (k === 'text')   node.appendChild(document.createTextNode(attrs[k]));
        else                     node.setAttribute(k, attrs[k]);
      }
    }
    if (children && children.length) {
      for (var i = 0; i < children.length; i++) {
        if (children[i]) node.appendChild(children[i]);
      }
    }
    return node;
  }

  /* Extrae nombre del usuario desde el DOM legacy (#dash-nombre).
     Formato legacy: "{Nombre}, ¡a estudiar!" o "¡a estudiar!" sin login. */
  function getUserName() {
    var n = document.getElementById(DASH_NOMBRE_ID);
    if (!n || !n.textContent) return null;
    var txt = n.textContent.trim();
    /* Formato "{nombre}, ¡a estudiar!" */
    var m = txt.match(/^(.+?),\s*¡a estudiar!$/);
    if (m) return m[1].trim();
    return null;
  }

  /* ── Horarios: próxima clase ────────────────────────────── */
  function loadHorarios() {
    return fetch('./horarios.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function todayDiaIndex() {
    /* Date.getDay(): 0 domingo, 1 lunes, ..., 6 sábado */
    var d = new Date().getDay();
    /* Mapear a DIAS_ORDER (lunes=0) */
    return d === 0 ? 6 : d - 1;
  }

  function nowHM() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  function parseHM(str) {
    var parts = (str || '').split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }

  /* Devuelve la próxima clase en los próximos 7 días.
     Retorna {materia, dia, desde, hasta, aula, offsetDays} o null. */
  function computeNextClass(horarios) {
    if (!horarios || !horarios.horarios) return null;

    var todayIdx = todayDiaIndex();
    var now      = nowHM();
    var best     = null;
    var bestDist = Infinity;

    for (var i = 0; i < horarios.horarios.length; i++) {
      var materia = horarios.horarios[i].materia;
      var clases  = horarios.horarios[i].clases || [];
      for (var j = 0; j < clases.length; j++) {
        var c = clases[j];
        var diaIdx = DIAS_ORDER.indexOf((c.dia || '').toLowerCase());
        if (diaIdx < 0) continue;

        var offsetDays = diaIdx - todayIdx;
        if (offsetDays < 0) offsetDays += 7;
        if (offsetDays === 0 && parseHM(c.desde) < now) offsetDays = 7;

        var dist = offsetDays * 1440 + parseHM(c.desde);
        if (dist < bestDist) {
          bestDist = dist;
          best = {
            materia:    materia,
            dia:        c.dia,
            desde:      c.desde,
            hasta:      c.hasta,
            aula:       c.aula,
            offsetDays: offsetDays
          };
        }
      }
    }
    return best;
  }

  function formatNextClassLine(nc) {
    if (!nc) return 'CICLO INICIAL · 1C-2026';
    var when;
    if      (nc.offsetDays === 0) when = 'hoy';
    else if (nc.offsetDays === 1) when = 'mañana';
    else                          when = nc.dia;
    return '> PRÓXIMA CLASE · ' + nc.materia.toUpperCase()
         + ' · ' + when.toUpperCase()
         + ' · ' + nc.desde
         + ' · ' + (nc.aula || '').toUpperCase();
  }

  /* ── Hero — build & mount ───────────────────────────────── */
  function buildHero(userName, nextClassLine) {
    var greeting = userName ? 'Hola, ' + userName + '.' : 'Bienvenido.';

    /* Breadcrumb cyberpunk — dot es decorativo, aria-hidden para screen readers */
    var eyebrow = el('div', { class: 'sv-hero__eyebrow' }, [
      el('span', { class: 'sv-hero__eyebrow-dot', 'aria-hidden': 'true' }),
      el('span', { class: 'sv-hero__eyebrow-txt', text: 'FCE UNPSJB · TRELEW · CICLO INICIAL 2026' })
    ]);

    /* Título — greeting + acento "a estudiar" glow */
    var title = el('h1', { class: 'sv-hero__title' });
    title.appendChild(document.createTextNode(greeting));
    title.appendChild(el('br'));
    title.appendChild(el('span', {
      class: 'sv-hero__title-accent',
      text:  '¿Qué vas a romper hoy?'
    }));

    /* Subtítulo — próxima clase desde horarios.json */
    var sub = el('div', {
      class: 'sv-hero__sub',
      text:  nextClassLine
    });

    /* CTA primario — scroll a primera materia */
    var cta = el('button', {
      class: 'sv-hero__cta',
      type:  'button'
    });
    cta.appendChild(el('span', { class: 'sv-hero__cta-bracket', text: '⟶' }));
    cta.appendChild(el('span', { class: 'sv-hero__cta-label',   text: 'EMPEZAR SESIÓN' }));
    cta.addEventListener('click', scrollToFirstSubject);

    var hero = el('section', {
      id:    HERO_ID,
      class: 'sv-hero',
      role:  'region',
      'aria-label': 'Saludo y próxima sesión'
    }, [eyebrow, title, sub, cta]);

    return hero;
  }

  function scrollToFirstSubject() {
    /* Intento 1: card del grid de materias (primer .subject-card o similar) */
    var target =
      document.querySelector('#home .subject-card') ||
      document.querySelector('#home [data-materia]') ||
      document.querySelector('#home .kpi-grid') ||
      document.querySelector('#home');

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      /* Focus management para a11y */
      try { target.focus({ preventScroll: true }); } catch (_) {}
    }
  }

  function mountHero(horarios) {
    var home = document.getElementById(HOME_PAGE_ID);
    if (!home) return false;

    /* Idempotencia — si ya hay hero, no duplicar */
    if (document.getElementById(HERO_ID)) return true;

    var userName      = getUserName();
    var nextClass     = computeNextClass(horarios);
    var nextClassLine = formatNextClassLine(nextClass);

    var hero = buildHero(userName, nextClassLine);

    /* Insertar hero al principio de #home */
    home.insertBefore(hero, home.firstChild);
    state.heroNode = hero;

    /* Ocultar hero legacy: el <h1> "Hola, ¡a estudiar!" + breadcrumb DM Mono */
    hideLegacyHero();

    /* Observer sobre #dash-nombre para sincronizar */
    setupDashNombreObserver();

    return true;
  }

  function hideLegacyHero() {
    /* H1 "Hola, ¡a estudiar!" — ancestro del #dash-nombre */
    var dashNombre = document.getElementById(DASH_NOMBRE_ID);
    if (dashNombre) {
      var h1 = dashNombre.closest('h1');
      if (h1) {
        h1.setAttribute('data-sv-hidden-by', 'dashboard');
        h1.style.display = 'none';
        state.legacyHeroH1 = h1;
      }
    }
    /* Breadcrumb DM Mono "FCE UNPSJB · Trelew · Ciclo Inicial 2026"
       Está como primer div dentro del HERO ROW — lo identifico por texto
       para no depender de selectores frágiles. */
    var home = document.getElementById(HOME_PAGE_ID);
    if (home) {
      var heroRow = home.querySelector('div[style*="justify-content:space-between"]');
      if (heroRow) {
        var firstCol = heroRow.children[0];
        if (firstCol) {
          var bc = firstCol.children[0];
          if (bc && /FCE UNPSJB/i.test(bc.textContent || '')) {
            bc.setAttribute('data-sv-hidden-by', 'dashboard');
            bc.style.display = 'none';
            state.legacyHeroBreadcrumb = bc;
          }
        }
      }
    }
  }

  function showLegacyHero() {
    if (state.legacyHeroH1) {
      state.legacyHeroH1.style.display = '';
      state.legacyHeroH1.removeAttribute('data-sv-hidden-by');
      state.legacyHeroH1 = null;
    }
    if (state.legacyHeroBreadcrumb) {
      state.legacyHeroBreadcrumb.style.display = '';
      state.legacyHeroBreadcrumb.removeAttribute('data-sv-hidden-by');
      state.legacyHeroBreadcrumb = null;
    }
  }

  function setupDashNombreObserver() {
    var n = document.getElementById(DASH_NOMBRE_ID);
    if (!n) return;
    var mo = new MutationObserver(function () { syncHeroName(); });
    mo.observe(n, { childList: true, characterData: true, subtree: true });
    state.dashNombreObserver = mo;
  }

  function syncHeroName() {
    var userName = getUserName();
    var hero     = document.getElementById(HERO_ID);
    if (!hero) return;
    var title = hero.querySelector('.sv-hero__title');
    if (!title) return;
    /* Reconstruir título respetando el span accent */
    var accent = title.querySelector('.sv-hero__title-accent');
    var accentText = accent ? accent.textContent : '¿Qué vas a romper hoy?';
    /* Limpiar */
    while (title.firstChild) title.removeChild(title.firstChild);
    title.appendChild(document.createTextNode(userName ? 'Hola, ' + userName + '.' : 'Bienvenido.'));
    title.appendChild(el('br'));
    title.appendChild(el('span', { class: 'sv-hero__title-accent', text: accentText }));
  }

  /* ── Panic CTA — reviste el .n74-panico-btn ─────────────── */
  function mountPanicCta() {
    var btn = document.querySelector('.n74-panico-btn');
    if (!btn) return false;
    if (btn.classList.contains('sv-panic-cta')) return true; /* idempotente */

    /* Guardar estado original para restore */
    state.panicButton        = btn;
    state.panicOriginalHtml  = btn.innerHTML;
    state.panicOriginalClass = btn.className;

    /* Reemplazar innerHTML por estructura cyberpunk (mantiene onclick) */
    btn.className = state.panicOriginalClass + ' sv-panic-cta';
    btn.setAttribute(PANIC_WRAP_ATTR, '1');
    btn.setAttribute('aria-label', 'Activar modo pánico: simulacro de examen');

    btn.innerHTML =
      '<div class="sv-panic-cta__glow" aria-hidden="true"></div>' +
      '<div class="sv-panic-cta__rail" aria-hidden="true"></div>' +
      '<div class="sv-panic-cta__icon" aria-hidden="true">' +
        '<span class="sv-panic-cta__icon-core">!</span>' +
      '</div>' +
      '<div class="sv-panic-cta__body">' +
        '<div class="sv-panic-cta__eyebrow">SIMULACRO · ALTA PRESIÓN</div>' +
        '<div class="sv-panic-cta__title">MODO PÁNICO</div>' +
        '<div class="sv-panic-cta__sub">20 preguntas · 4 materias · 25 minutos · sin vuelta atrás</div>' +
      '</div>' +
      '<div class="sv-panic-cta__cta">' +
        '<span class="sv-panic-cta__cta-label">ACTIVAR</span>' +
        '<span class="sv-panic-cta__cta-arrow" aria-hidden="true">›</span>' +
      '</div>';

    return true;
  }

  function unmountPanicCta() {
    var btn = state.panicButton;
    if (!btn) return;
    btn.innerHTML = state.panicOriginalHtml;
    btn.className = state.panicOriginalClass;
    btn.removeAttribute(PANIC_WRAP_ATTR);
    btn.removeAttribute('aria-label');
    state.panicButton        = null;
    state.panicOriginalHtml  = null;
    state.panicOriginalClass = null;
  }

  /* ── Public API — mount / unmount ───────────────────────── */
  function mount() {
    if (state.mounted) return true;
    if (!requireSovereign()) return false;

    /* 1. Panic se puede montar sincrónico (no depende de horarios) */
    mountPanicCta();

    /* 2. Hero necesita horarios.json — fire & forget, cuando llega monta */
    loadHorarios().then(function (h) {
      state.horarios = h;
      mountHero(h);
      dispatchMounted();
    });

    state.mounted = true;

    /* Aun si horarios falla, el hero se monta con subtítulo genérico */
    setTimeout(function () {
      if (!document.getElementById(HERO_ID)) {
        mountHero(state.horarios);
        dispatchMounted();
      }
    }, 1500);

    return true;
  }

  function unmount() {
    if (!state.mounted) return;

    /* Hero */
    if (state.heroNode && state.heroNode.parentNode) {
      state.heroNode.parentNode.removeChild(state.heroNode);
    }
    state.heroNode = null;
    showLegacyHero();

    /* Observer */
    if (state.dashNombreObserver) {
      state.dashNombreObserver.disconnect();
      state.dashNombreObserver = null;
    }

    /* Panic */
    unmountPanicCta();

    state.mounted = false;
    dispatchUnmounted();
  }

  function isMounted() { return state.mounted; }

  function dispatchMounted() {
    try {
      document.dispatchEvent(new CustomEvent('nexus:dashboard-mounted', {
        detail: { version: VERSION }
      }));
    } catch (_) {}
  }

  function dispatchUnmounted() {
    try {
      document.dispatchEvent(new CustomEvent('nexus:dashboard-unmounted', {
        detail: { version: VERSION }
      }));
    } catch (_) {}
  }

  /* ── Observer sobre data-ui — auto mount/unmount ────────── */
  function setupUIModeObserver() {
    var html = document.documentElement;
    var mo = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'attributes' && m.attributeName === 'data-ui') {
          var mode = html.getAttribute('data-ui');
          if (mode === 'sovereign' && !state.mounted) {
            mount();
          } else if (mode !== 'sovereign' && state.mounted) {
            unmount();
          }
        }
      }
    });
    mo.observe(html, { attributes: true, attributeFilter: ['data-ui'] });
  }

  /* ── Bootstrap ──────────────────────────────────────────── */
  function bootstrap() {
    setupUIModeObserver();
    /* Si ya estamos en sovereign al cargar, montar. */
    if (document.documentElement.getAttribute('data-ui') === 'sovereign') {
      mount();
    }
  }

  /* Esperar DOMContentLoaded si hace falta */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  /* ── Export ─────────────────────────────────────────────── */
  global.NexusDashboard = {
    version:    VERSION,
    mount:      mount,
    unmount:    unmount,
    isMounted:  isMounted,
    _internal: {
      state:             state,
      buildHero:         buildHero,
      computeNextClass:  computeNextClass,
      formatNextClassLine: formatNextClassLine,
      getUserName:       getUserName,
      requireSovereign:  requireSovereign
    }
  };

})(typeof window !== 'undefined' ? window : this);
