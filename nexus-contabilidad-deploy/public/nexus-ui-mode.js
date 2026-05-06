/* ═══════════════════════════════════════════════════════════════════
 *  nexus-ui-mode.js  ·  Fase 4.1 — Dual UI routing (legacy + sovereign)
 *  v19.31.0 · 2026-04-19
 *  ─────────────────────────────────────────────────────────────────
 *  Capa de flag que persiste la preferencia de UI y la expone a CSS + JS.
 *
 *  Default: 'legacy'. 'sovereign' es opt-in vía ?ui=sovereign (persistente)
 *  hasta que se flipee el default en Fase 4.4 (post-telemetría).
 *
 *  El atributo `data-ui` en <html> ya fue seteado por el bootloader inline
 *  en <head>. Este módulo expone la API completa para cambiar el modo,
 *  suscribirse a cambios y ejecutar operaciones post-cambio (reload opcional).
 *
 *  Contratos:
 *   - document.documentElement.dataset.ui === 'legacy' | 'sovereign'
 *   - window.NexusUIMode.getMode()             → string
 *   - window.NexusUIMode.isSovereign()         → boolean
 *   - window.NexusUIMode.setMode(mode, opts?)  → boolean
 *   - window.NexusUIMode.toggle()              → string (nuevo modo)
 *   - window.NexusUIMode.clear()               → void
 *   - window.NexusUIMode.on(fn)                → unsubscribe()
 *
 *  Eventos:
 *   - CustomEvent('nexus:ui-mode-changed', { detail: { from, to, source } })
 *   - Telemetría enganchada en Fase 4.4 (Plausible event `ui_mode_set`)
 *
 *  Query params soportados:
 *   - ?ui=sovereign  activa sovereign (persistente)
 *   - ?ui=legacy     fuerza legacy (override, persistente)
 *   - ?ui=clear      borra preferencia, vuelve a default
 *   - ?ui=toggle     invierte el modo actual
 *   - sin param      usa localStorage, o default 'legacy'
 *
 *  Diseño:
 *   - Single source of truth: localStorage key `nexus.ui.mode`
 *   - El bootloader inline ya aplicó `data-ui` antes del primer paint
 *     para que CSS bajo `[data-ui="sovereign"]` aplique sin FOUC.
 *   - Este módulo es idempotente: llamarlo 2 veces no duplica listeners.
 * ═══════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  // ── Constants ───────────────────────────────────────────────────────
  var STORAGE_KEY   = 'nexus.ui.mode';
  var DEFAULT_MODE  = 'legacy';
  var VALID_MODES   = ['legacy', 'sovereign'];
  var ATTR_NAME     = 'ui'; // applies as data-ui on <html>
  var EVENT_NAME    = 'nexus:ui-mode-changed';
  var MODULE_FLAG   = '__nexusUIModeLoaded';

  // Idempotency guard: evita doble-wire si el script se carga dos veces
  if (global[MODULE_FLAG]) {
    return;
  }
  global[MODULE_FLAG] = true;

  // ── Low-level helpers ──────────────────────────────────────────────
  function normalizeMode(raw) {
    if (typeof raw !== 'string') return null;
    var m = raw.toLowerCase().trim();
    return VALID_MODES.indexOf(m) !== -1 ? m : null;
  }

  function readStorage() {
    try {
      return normalizeMode(global.localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      // localStorage puede estar deshabilitado (modo incógnito estricto)
      return null;
    }
  }

  function writeStorage(mode) {
    try {
      if (mode == null) {
        global.localStorage.removeItem(STORAGE_KEY);
      } else {
        global.localStorage.setItem(STORAGE_KEY, mode);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function applyAttribute(mode) {
    var root = global.document && global.document.documentElement;
    if (!root) return;
    if (root.dataset) {
      root.dataset[ATTR_NAME] = mode;
    } else {
      root.setAttribute('data-' + ATTR_NAME, mode);
    }
  }

  function getCurrentAttribute() {
    var root = global.document && global.document.documentElement;
    if (!root) return null;
    var v = root.dataset ? root.dataset[ATTR_NAME] : root.getAttribute('data-' + ATTR_NAME);
    return normalizeMode(v);
  }

  function dispatch(from, to, source) {
    if (!global.document || typeof global.CustomEvent !== 'function') return;
    try {
      var evt = new global.CustomEvent(EVENT_NAME, {
        detail:  { from: from, to: to, source: source || 'api' },
        bubbles: true
      });
      global.document.dispatchEvent(evt);
    } catch (e) {
      // noop: navegadores sin CustomEvent quedan sin notificación pero el estado se aplica
    }
  }

  // ── Core API ────────────────────────────────────────────────────────

  function getMode() {
    // Prioridad: data-attribute (lo que está renderizado) > storage > default.
    // El bootloader inline ya sincronizó los tres en el boot; si algo quedó
    // desfasado, trust el atributo (refleja el estado visible).
    return getCurrentAttribute() || readStorage() || DEFAULT_MODE;
  }

  function isSovereign() {
    return getMode() === 'sovereign';
  }

  /**
   * Cambia el modo activo.
   *
   * @param {string} mode            - 'legacy' o 'sovereign'
   * @param {object} [opts]
   * @param {boolean} [opts.persist=true]  - escribir a localStorage
   * @param {boolean} [opts.reload=false]  - recargar la página tras aplicar
   * @param {string}  [opts.source='api']  - para telemetría (api/url/toggle/button)
   * @returns {boolean} true si cambió, false si era no-op o inválido
   */
  function setMode(mode, opts) {
    var normalized = normalizeMode(mode);
    if (!normalized) return false;

    opts = opts || {};
    var persist = opts.persist !== false;
    var reload  = opts.reload  === true;
    var source  = opts.source  || 'api';

    var prev = getMode();
    applyAttribute(normalized);
    if (persist) writeStorage(normalized);

    if (prev !== normalized) {
      dispatch(prev, normalized, source);
    }

    if (reload && global.location && typeof global.location.reload === 'function') {
      global.location.reload();
    }
    return prev !== normalized;
  }

  function toggle(opts) {
    var next = getMode() === 'sovereign' ? 'legacy' : 'sovereign';
    setMode(next, Object.assign({ source: 'toggle' }, opts || {}));
    return next;
  }

  function clear(opts) {
    writeStorage(null);
    var prev = getMode();
    applyAttribute(DEFAULT_MODE);
    if (prev !== DEFAULT_MODE) {
      dispatch(prev, DEFAULT_MODE, (opts && opts.source) || 'clear');
    }
  }

  /**
   * Suscripción a cambios de modo. Devuelve función de unsubscribe.
   * @param {Function} fn - recibe detail {from, to, source}
   */
  function on(fn) {
    if (typeof fn !== 'function' || !global.document) {
      return function noop() {};
    }
    var handler = function (e) { fn(e.detail); };
    global.document.addEventListener(EVENT_NAME, handler);
    return function () {
      global.document.removeEventListener(EVENT_NAME, handler);
    };
  }

  // ── URL param handling ─────────────────────────────────────────────
  // El bootloader inline ya parseó el param inicial. Esta función re-parsea
  // por si el módulo se carga con la URL ya estable, para cubrir casos donde
  // el bootloader no estuviera presente (testing, embebido, etc.).
  function syncFromURL() {
    if (!global.location) return null;
    try {
      var params = new global.URLSearchParams(global.location.search);
      var raw = params.get('ui');
      if (!raw) return null;
      raw = raw.toLowerCase();
      if (raw === 'clear') {
        clear({ source: 'url' });
        cleanupURL(params);
        return DEFAULT_MODE;
      }
      if (raw === 'toggle') {
        var next = toggle({ source: 'url' });
        cleanupURL(params);
        return next;
      }
      var m = normalizeMode(raw);
      if (m) {
        setMode(m, { persist: true, source: 'url' });
        cleanupURL(params);
        return m;
      }
    } catch (e) {
      // Navegadores sin URLSearchParams: ignorar, se usa default
    }
    return null;
  }

  // Remueve `ui` del query string sin recargar, para que el usuario pueda
  // bookmarkear / compartir la URL limpia una vez aplicada la preferencia.
  function cleanupURL(params) {
    if (!global.history || typeof global.history.replaceState !== 'function') return;
    try {
      params.delete('ui');
      var qs = params.toString();
      var newUrl = global.location.pathname + (qs ? '?' + qs : '') + global.location.hash;
      global.history.replaceState(global.history.state, global.document.title, newUrl);
    } catch (e) { /* noop */ }
  }

  // ── Boot ────────────────────────────────────────────────────────────
  // Si el bootloader inline no existió, sincronizamos ahora. Si existió,
  // este syncFromURL es un no-op (el param ya fue removido).
  syncFromURL();

  // Garantiza que el data-attribute refleje el modo final (por si el
  // bootloader inline quedó desfasado con storage)
  applyAttribute(getMode());

  // ── Public API ──────────────────────────────────────────────────────
  global.NexusUIMode = {
    version:     '19.31.0',
    getMode:     getMode,
    isSovereign: isSovereign,
    setMode:     setMode,
    toggle:      toggle,
    clear:       clear,
    on:          on,
    // Para tests o casos avanzados
    _internal: {
      STORAGE_KEY:  STORAGE_KEY,
      DEFAULT_MODE: DEFAULT_MODE,
      VALID_MODES:  VALID_MODES.slice(),
      syncFromURL: syncFromURL
    }
  };
})(typeof window !== 'undefined' ? window : this);
