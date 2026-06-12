/* ═══════════════════════════════════════════════════════════════════════
   NEXUS PREFETCH  ·  Portal FCE 2026  ·  v13.0.0
   ═══════════════════════════════════════════════════════════════════════
   FASE 13 — Perceptual Performance Layer.

   RESPONSABILIDAD: anticipar la decisión del Adaptive Engine para que
   la siguiente pregunta esté lista ANTES de que el usuario la pida.

   ARQUITECTURA:
     NexusAdaptiveEngine.getNextIdx() → decisión real (no cambia)
     NexusPrefetch.prefetchNext()     → corre en background post-respuesta
     NexusPrefetch.consume()          → entrega el resultado precalculado

   GARANTÍAS:
     ✅ El engine es la única fuente de decisión — prefetch no decide
     ✅ El candidato se valida antes de usarse (coherencia)
     ✅ Si el cache es inválido → fallback transparente a getNextIdx
     ✅ Todo síncrono O(1) — sin timers, sin async

   INTEGRACIÓN:
     quiz: en processAnswer() → prefetchNext()
           en q55Siguiente()  → consume() antes de getNextIdx()
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

window.NexusPrefetch = (function() {

  /* ── _isValid ─────────────────────────────────────────────────────────
     Valida que el candidato precalculado siga siendo usable.
     Falla si:
       - fue agregado a recent (ya se vio)
       - un nuevo error llenó la queue y cambia la prioridad
     O(1) — solo lecturas de set. */
  function _isValid(candidate, materia, agrupador, pool) {
    if (candidate === null || candidate === undefined) return false;
    if (!pool || candidate >= pool.length || candidate < 0)  return false;

    var state = NexusCore.get('adaptiveState') || {};

    /* Invalidar si fue agregado a recent tras el prefetch */
    var recent  = state.recent || [];
    var itemId  = NexusAdaptiveEngine.makeItemId(materia, agrupador, candidate);
    for (var i = 0; i < recent.length; i++) {
      if (recent[i] === itemId) return false;
    }

    /* Invalidar si la queue tiene ítems (un error cambió la prioridad P1) */
    var queue = state.queue || [];
    if (queue.length > 0) {
      /* Si la queue contiene ítems de este agrupador, el prefetch ya no es P1 */
      for (var q = 0; q < queue.length; q++) {
        var parts = queue[q].split('|');
        if (parts[0] === materia && parts[1] === agrupador) return false;
      }
    }

    return true;
  }

  /* ── prefetchNext ─────────────────────────────────────────────────────
     Llama al engine para precalcular el próximo ítem y guardarlo en
     adaptiveState.nextCandidate.
     Se llama DESPUÉS de processAnswer — el estado ya está actualizado.
     Síncrono. No muta estado crítico (getNextIdx lee y escribe lastSeen
     via _trackServido — aceptable, es idempotente). */
  function prefetchNext(pool, materia, agrupador) {
    if (!pool || !pool.length) return;
    if (typeof NexusAdaptiveEngine === 'undefined') return;

    var idx = NexusAdaptiveEngine.getNextIdx(pool, materia, agrupador);

    var state = NexusCore.get('adaptiveState') || {};
    state.nextCandidate = {
      idx:       idx,
      materia:   materia,
      agrupador: agrupador,
      poolLen:   pool.length,
      ts:        performance.now()   /* timestamp para debug */
    };
    NexusCore.set('adaptiveState', state);
  }

  /* ── consume ──────────────────────────────────────────────────────────
     Intenta usar el candidato prefetcheado.
     Si es válido → retorna idx y limpia el cache.
     Si no       → retorna null (el caller cae en getNextIdx normal).
     O(1). */
  function consume(pool, materia, agrupador) {
    var state = NexusCore.get('adaptiveState') || {};
    var nc    = state.nextCandidate;

    if (!nc) return null;

    /* Limpiar el cache siempre — aunque no lo usemos, evitar stale */
    state.nextCandidate = null;
    NexusCore.set('adaptiveState', state);

    /* Validar coherencia */
    if (nc.materia !== materia || nc.agrupador !== agrupador) return null;
    if (nc.poolLen !== pool.length) return null;
    if (!_isValid(nc.idx, materia, agrupador, pool)) return null;

    return nc.idx;
  }

  /* ── getNextWithPrefetch ──────────────────────────────────────────────
     API unificada para el quiz:
       1. Intenta consume()
       2. Si falla → getNextIdx() normal
     Reemplaza la llamada directa a getNextIdx en q55Siguiente.
     Síncrono, O(1). */
  function getNextWithPrefetch(pool, materia, agrupador) {
    var cached = consume(pool, materia, agrupador);
    if (cached !== null) {
      console.info('[NexusPrefetch] Cache hit → idx', cached);
      return cached;
    }
    console.info('[NexusPrefetch] Cache miss → getNextIdx fallback');
    return NexusAdaptiveEngine.getNextIdx(pool, materia, agrupador);
  }

  return { prefetchNext: prefetchNext, consume: consume, getNextWithPrefetch: getNextWithPrefetch };

})();

console.info('[NEXUS PREFETCH v13.0.0] Perceptual Performance Layer lista.');

/* ── SW FORCE-UPDATE v19.3.2 ────────────────────────────────────────────
   Detecta SW/cache viejos y fuerza actualización automática.
   Sin intervención del usuario. ────────────────────────────────────── */
(function() {
  var EXPECTED = 'fce-portal-v19.20.0';
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;
  if (window._nexusSwGuardActive) return;
  window._nexusSwGuardActive = true;

  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (!window._nexusSwReloading) {
      window._nexusSwReloading = true;
      window.location.reload();
    }
  });

  caches.keys().then(function(keys) {
    if (keys.indexOf(EXPECTED) !== -1) return; /* todo ok */
    console.log('[NEXUS SW] Cache viejo — forzando update...');
    Promise.all(keys.map(function(k) { return caches.delete(k); }))
      .then(function() {
        return navigator.serviceWorker.getRegistrations();
      }).then(function(regs) {
        return Promise.all(regs.map(function(r) { return r.update(); }));
      }).catch(function(e) { console.warn('[NEXUS SW]', e); });
  });
})();
