/* ═══════════════════════════════════════════════════════════════════════
   NEXUS FETCH  ·  Portal FCE 2026  ·  v10.8.0
   ───────────────────────────────────────────────────────────────────────
   RESPONSABILIDAD ÚNICA:
   Cargar materiales.json, normalizar items, publicar en NexusCore.

   FASE 8 — _fceData eliminado completamente:
   - NO escribe window._fceData
   - NexusCore es la única fuente de datos
   - Fallo de fetch → NexusCore.set('materiales', []) → módulos ven array vacío

   CONTRATO PÚBLICO (window.NexusFetch):
   - NexusFetch.cargarMateriales()  → Promise<Array>
     Resuelve con el array normalizado o [] si falla.
     Nunca rechaza.

   OFFLINE:
   - Service Worker (sw.js) cachea index.html, nexus-*.js, JSONs auxiliares.
   - materiales.json es network-first: sin red, SW no lo sirve.
   - En ese caso NexusCore queda con [] hasta que haya conectividad.
   - La app muestra estado vacío limpio — sin errores fatales.

   ORDEN DE CARGA:
   nexus-core.js → portal.js → nexus-quiz.js → nexus-fetch.js → nexus-exam.js → nexus-modules.js
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

window.NexusFetch = (function() {

  /* ── normalizarMaterial ─────────────────────────────────────────────── */
  function _extraerTitulo(html) {
    try {
      var tmp = document.createElement('div');
      tmp.innerHTML = html || '';
      return (tmp.textContent || tmp.innerText || '').trim().slice(0, 80);
    } catch(e) { return ''; }
  }

  /* Versión estructural ligera — sin stringify, sin hashing costoso.
     Detecta cambios reales en campos clave sin comparar objetos enteros. */
  function _computeVersion(raw) {
    return [raw.updatedAt, raw.titulo, raw.tipo, raw.agrupador, raw.orden].join('|');
  }

  function normalizarMaterial(raw) {
    if (!raw) return null;
    // Preservar TODOS los campos originales y agregar los nuevos encima.
    // Contrato Fase 11.1: todo material normalizado tiene .version
    // → NexusItemCache puede detectar cambios sin hashing.
    return Object.assign({}, raw, {
      id:            raw.id         || ('mat_' + Math.random().toString(36).slice(2, 9)),
      titulo:        raw.titulo     || _extraerTitulo(raw.cuerpo || raw.html || ''),
      definicion:    raw.definicion || raw.descripcion || raw.cuerpo || raw.html || '',
      relaciones:    Array.isArray(raw.relacionado)
                       ? raw.relacionado
                       : (raw.relacionado ? [raw.relacionado] : []),
      version:       raw.version || _computeVersion(raw),  /* contrato NexusItemCache */
      originalIndex: raw.originalIndex !== undefined ? raw.originalIndex : 9999,
      /* FASE 12.3B — Content Fidelity: preservar HTML original sin transformar */
      bodyOriginal:  raw.bodyOriginal || null,
      /* FASE 12.3D — Document Render Mode */
      renderMode:    raw.renderMode || 'modular',
      _raw: raw
    });
  }

  /* ── _buildCandidates ──────────────────────────────────────────────── */
  function _buildCandidates() {
    var ts   = Date.now();
    var path = window.location.pathname;
    var base = path.substring(0, path.lastIndexOf('/') + 1);
    var candidates = [
      base  + 'materiales.json?v=' + ts,
      './materiales.json?v='       + ts,
      'materiales.json?v='         + ts,
      window.location.origin + base + 'materiales.json?v=' + ts
    ];
    var seen = {};
    return candidates.filter(function(u) {
      if (seen[u]) return false;
      seen[u] = true;
      return true;
    });
  }

  /* ── _fetchOne ──────────────────────────────────────────────────────── */
  function _fetchOne(url) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId  = controller ? setTimeout(function() { controller.abort(); }, 8000) : null;

    return fetch(url, {
      cache:  'no-store',
      signal: controller ? controller.signal : undefined
    })
    .then(function(r) {
      if (timeoutId) clearTimeout(timeoutId);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) {
      if (!Array.isArray(data) || !data.length) throw new Error('JSON vacío o mal formado');
      return data;
    })
    .catch(function(err) {
      if (timeoutId) clearTimeout(timeoutId);
      throw err;
    });
  }

  /* ── _publishData ───────────────────────────────────────────────────── */
  /* Normaliza y publica en NexusCore. Sin side effects de _fceData. */
  function _publishData(data) {
    var normalizados = [];
    try {
      normalizados = data.map(normalizarMaterial).filter(Boolean);
    } catch(e) {
      console.warn('[NexusFetch] Error normalizando:', e);
      normalizados = data;   /* usar raw si falla la normalización */
    }

    if (window.NexusCore) {
      NexusCore.set('materiales', normalizados);
      console.info('[NexusFetch] NexusCore.set("materiales"):', normalizados.length, 'items');
    }

    return normalizados;
  }

  /* ── cargarMateriales ───────────────────────────────────────────────── */
  function cargarMateriales() {
    var candidates = _buildCandidates();
    var idx = 0;

    function _tryNext() {
      if (idx >= candidates.length) {
        console.error('[NexusFetch] Sin datos — todas las rutas fallaron.');
        /* NexusCore queda con su estado anterior ([] si es primera carga) */
        return Promise.resolve(NexusCore ? NexusCore.getMateriales() : []);
      }

      var url = candidates[idx++];
      return _fetchOne(url)
        .then(function(data) {
          console.info('[NexusFetch] ✓', url.split('?')[0]);
          return _publishData(data);
        })
        .catch(function(err) {
          console.warn('[NexusFetch] ✗ URL #' + idx + ':', err.message);
          return _tryNext();
        });
    }

    return _tryNext();
  }

  return {
    cargarMateriales:   cargarMateriales,
    normalizarMaterial: normalizarMaterial
  };

})();


console.info('[NEXUS FETCH v11.1.1] Sin _fceData. version estructural via _computeVersion.');
