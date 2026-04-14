// ═══════════════════════════════════════════════════════════════════
//  NEXUS CORE  ·  Portal FCE 2026  ·  v11.0.0
//  ───────────────────────────────────────────────────────────────────
//  FASE 11: Unificación de estado + Scheduler integrado
//
//  Cambios vs v10.8.0:
//    1. NEXUS_STATE → proxy de NexusCore (una sola fuente de verdad)
//    2. NexusScheduler integrado (requestAnimationFrame batching)
//    3. NexusCore.on() despacha a través del scheduler automáticamente
//    4. getMateriales() sin cambios — contrato estable
//
//  Compatibilidad total:
//    - NEXUS_STATE.fceUsuario, fceLeidos, fceIngresado siguen funcionando
//    - Código legacy no requiere modificación
//    - NexusCore.get/set/on API sin cambios
// ═══════════════════════════════════════════════════════════════════

'use strict';

// ── 1. NexusScheduler — batching de renders por rAF ──────────────
// Evita múltiples renders por frame cuando set() se llama en ráfaga.
// Todo callback de NexusCore.on() pasa por aquí automáticamente.
window.NexusScheduler = (function() {
  'use strict';

  /* Dos colas: high se vacía ANTES que normal en cada frame */
  var _high    = [];   /* [{fn}] — interacción crítica (login, user) */
  var _normal  = [];   /* [{fn}] — render de UI (listas, sidebar) */
  var _ticking = false;

  /**
   * schedule(fn, options)
   * @param {Function} fn        — callback a ejecutar
   * @param {Object}   options
   *   priority: 'high' | 'normal' (default: 'normal')
   */
  function schedule(fn, options) {
    var priority = (options && options.priority === 'high') ? 'high' : 'normal';
    if (priority === 'high') _high.push(fn);
    else                     _normal.push(fn);

    if (!_ticking) {
      _ticking = true;
      requestAnimationFrame(_flush);
    }
  }

  function _flush() {
    /* High primero, luego normal — snapshot para evitar loops infinitos */
    var highBatch   = _high.splice(0);
    var normalBatch = _normal.splice(0);

    highBatch.forEach(function(fn) {
      try { fn(); } catch(e) { console.error('[NexusScheduler][high]', e); }
    });
    normalBatch.forEach(function(fn) {
      try { fn(); } catch(e) { console.error('[NexusScheduler][normal]', e); }
    });

    _ticking = (_high.length + _normal.length) > 0;
    if (_ticking) requestAnimationFrame(_flush);
  }

  /* scheduleImmediate: sin rAF — solo para errores críticos o tests */
  function scheduleImmediate(fn) {
    try { fn(); } catch(e) { console.error('[NexusScheduler][immediate]', e); }
  }

  return { schedule: schedule, scheduleImmediate: scheduleImmediate };
})();


// ── 2. NexusCore — sistema reactivo de estado ────────────────────
window.NexusCore = (function() {
  'use strict';

  var _state     = {};
  var _listeners = {};

  // Claves que usan scheduleImmediate (no batching) — render crítico
  var _immediateKeys = { 'user': true, 'auth': true };

  function get(key) {
    return _state[key];
  }

  function set(key, value) {
    _state[key] = value;
    _emit(key, value);
  }

  /**
   * on(key, callback, options)
   * @param {string}   key       — clave de estado
   * @param {Function} callback  — suscriptor
   * @param {Object}   options
   *   priority: 'high' | 'normal' (default: 'normal')
   *   Pasa la priority al NexusScheduler automáticamente.
   */
  function on(key, callback, options) {
    if (typeof callback !== 'function') return function() {};
    if (!_listeners[key]) _listeners[key] = [];

    var opts = options || {};
    /* Claves críticas siempre high — override opcional */
    var priority = opts.priority || (_immediateKeys[key] ? 'high' : 'normal');

    var scheduled = priority === 'high'
      ? function(data) { NexusScheduler.scheduleImmediate(function() { callback(data); }); }
      : function(data) { NexusScheduler.schedule(function() { callback(data); }, { priority: priority }); };

    _listeners[key].push(scheduled);

    return function() {
      _listeners[key] = (_listeners[key] || []).filter(function(fn) {
        return fn !== scheduled;
      });
    };
  }

  function _emit(key, value) {
    (_listeners[key] || []).forEach(function(fn) {
      try { fn(value); } catch(e) {
        console.error('[NexusCore] Error en suscriptor de "' + key + '":', e);
      }
    });
  }

  function getMateriales() {
    try {
      var data = _state['materiales'];
      if (data && data.length) return data;
    } catch(e) {}
    return [];
  }

  return { get: get, set: set, on: on, getMateriales: getMateriales };
})();


// ── 3. NEXUS_STATE — proxy de NexusCore (legacy compat) ──────────
// Inicializar el slice 'legacy' en NexusCore
NexusCore.set('legacy', {
  fceUsuario:   null,
  fceLeidos:    {},
  fceIngresado: false
});

// Proxy: todo acceso a NEXUS_STATE lee/escribe en NexusCore
// Compatible con ES5+ (Object.defineProperty, sin Proxy nativo)
// Estrategia: objeto con getters/setters por propiedad conocida
var _NEXUS_STATE_HANDLER = (function() {
  function _get()    { return NexusCore.get('legacy') || {}; }
  function _set(val) { NexusCore.set('legacy', val); }

  var proxy = {};

  // fceUsuario
  Object.defineProperty(proxy, 'fceUsuario', {
    get: function() { return _get().fceUsuario; },
    set: function(v) { var s = _get(); s.fceUsuario = v; _set(s); },
    enumerable: true, configurable: true
  });

  // fceLeidos
  Object.defineProperty(proxy, 'fceLeidos', {
    get: function() { return _get().fceLeidos; },
    set: function(v) { var s = _get(); s.fceLeidos = v; _set(s); },
    enumerable: true, configurable: true
  });

  // fceIngresado
  Object.defineProperty(proxy, 'fceIngresado', {
    get: function() { return _get().fceIngresado; },
    set: function(v) { var s = _get(); s.fceIngresado = v; _set(s); },
    enumerable: true, configurable: true
  });

  return proxy;
})();

// Exponer como window.NEXUS_STATE — mismo objeto, getters/setters activos
window.NEXUS_STATE = _NEXUS_STATE_HANDLER;
// Alias directo para compatibilidad con var NEXUS_STATE en portal.js
var NEXUS_STATE = window.NEXUS_STATE;


console.info('[NEXUS CORE v11.1.0] Scheduler prioridades + on(options) + NEXUS_STATE proxy.');
