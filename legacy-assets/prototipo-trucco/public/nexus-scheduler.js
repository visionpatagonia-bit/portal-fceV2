/* ═══════════════════════════════════════════════════════════════════
   NEXUS SCHEDULER  ·  Portal FCE 2026  ·  v11.0.0
   ───────────────────────────────────────────────────────────────────
   Archivo independiente para uso futuro como módulo separado.
   En v11.0.0 el scheduler vive en nexus-core.js (carga antes).
   Este archivo extiende NexusScheduler con:
     - Métricas de performance (nexusAuditPerformance)
     - Instrumentación de render
     - nexusAuditContrast actualizado
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

// ── 1. MÉTRICAS DE PERFORMANCE ────────────────────────────────────

window.NexusPerf = (function() {
  var _marks = {};

  function mark(name) {
    _marks[name] = performance.now();
    if (performance.mark) {
      try { performance.mark(name); } catch(e) {}
    }
  }

  function measure(label, startMark, endMark) {
    var start = _marks[startMark] || 0;
    var end   = endMark ? (_marks[endMark] || performance.now()) : performance.now();
    var dur   = end - start;
    if (performance.measure) {
      try { performance.measure(label, startMark, endMark || undefined); } catch(e) {}
    }
    return dur;
  }

  function report() {
    var entries = [];
    // Intentar via Performance API primero
    if (performance.getEntriesByType) {
      try {
        entries = performance.getEntriesByType('measure');
      } catch(e) {}
    }
    if (entries.length) {
      console.table(entries.map(function(e) {
        return { name: e.name, 'duration (ms)': e.duration.toFixed(2) };
      }));
    } else {
      console.info('[NexusPerf] Sin medidas registradas. Usar NexusPerf.mark() y NexusPerf.measure().');
    }
  }

  return { mark: mark, measure: measure, report: report };
})();

window.nexusAuditPerformance = function() {
  NexusPerf.report();
};

// ── 2. INSTRUMENTACIÓN DE RENDER ─────────────────────────────────
// Wrappear nexusRenderAll para medir tiempo de render

(function _instrumentRender() {
  if (typeof window.nexusRenderAll !== 'function') return;
  var _orig = window.nexusRenderAll;
  window.nexusRenderAll = function(data, source) {
    NexusPerf.mark('render-start');
    _orig(data, source);
    var dur = NexusPerf.measure('render[' + (source || 'unknown') + ']', 'render-start');
    if (dur > 16) {
      console.warn('[NexusPerf] Render lento: ' + dur.toFixed(1) + 'ms (>16ms threshold)');
    }
  };
})();

// ── 3. CACHE DE RENDER POR ÍTEM ──────────────────────────────────
// Usado por módulos para evitar re-render de items sin cambios

window.NexusItemCache = (function() {
  'use strict';

  var _cache = new Map();

  /**
   * hasChanged(item)
   * CONTRATO: items DEBEN tener item.id + (item.version || item.updatedAt).
   * Si no tienen version, se asume siempre cambiado (safe default).
   *
   * ❌ PROHIBIDO: JSON.stringify, hashing, comparación profunda.
   * ✅ REQUERIDO: contrato de datos — normalizarMaterial garantiza item.version.
   */
  function hasChanged(item) {
    if (!item || !item.id) return true;
    var version = item.version || item.updatedAt;
    if (version === undefined) return true;   /* sin version = siempre render */
    var prev = _cache.get(item.id);
    if (prev === version) return false;
    _cache.set(item.id, version);
    return true;
  }

  function invalidate(id) {
    if (id) _cache.delete(id);
    else     _cache.clear();
  }

  function size() { return _cache.size; }

  return { hasChanged: hasChanged, invalidate: invalidate, size: size };
})();

console.info('[NEXUS SCHEDULER v11.1.0] NexusPerf + NexusItemCache (sin hash) listos.');
