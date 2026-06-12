/* ═══════════════════════════════════════════════════════════════════════
   NEXUS ADAPTIVE ENGINE  ·  Portal FCE 2026  ·  v12.1.0
   ───────────────────────────────────────────────────────────────────────
   Motor determinista de selección adaptativa de contenido.

   RESPONSABILIDADES:
     - Tracking por ítem (historial de respuestas)
     - Spaced repetition simplificada
     - Cola de prioridad para errores recientes
     - getNextItem() — selección inteligente del próximo ítem
     - processAnswer() — actualizar estado post-respuesta

   ARQUITECTURA:
     NexusCore.adaptiveState = { queue, history, recent, lastServed }
     ↑ única fuente de verdad — este módulo solo lee y escribe ahí

   REGLAS:
     ❌ Sin timers globales
     ❌ Sin loops sobre todo el dataset
     ❌ Sin lógica en UI
     ✅ O(1) u O(n) simple
     ✅ < 1ms por ejecución
     ✅ Desacoplado de quiz/exam

   INTEGRACIÓN:
     Quiz: q55Start llama getNextIdx() para ordenar preguntas
     Exam: sin cambios (usa pool propio)
     Después de respuesta: processAnswer() ya corre en nexus-intelligence.js
       → el engine lo complementa con tracking por ítem específico
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

window.NexusAdaptiveEngine = (function() {

  /* ── Constantes ────────────────────────────────────────────────────── */
  var RECENT_MAX    = 5;      /* máx items en cola anti-repetición */
  var SR_FACTOR     = 1000;   /* factor de spaced repetition (ms) */
  var QUEUE_MAX     = 20;     /* máx items en cola de errores */

  /* ── Difficulty Layer — constantes ─────────────────────────────────── */
  var MODE_EASY  = 'EASY_MODE';
  var MODE_FLOW  = 'FLOW_MODE';
  var MODE_HARD  = 'HARD_MODE';
  var FATIGUE_THRESHOLD = 3;   /* streakIncorrect >= N → forzar EASY */
  var BOOST_THRESHOLD   = 5;   /* streakCorrect   >= N → inyectar difícil */

  /* ── queueSet — índice O(1) de la queue ─────────────────────────────
     Permite has/add/delete sin recorrer el array.
     Se reconstruye desde state.queue en cada _getState()
     para mantenerse en sync con NexusCore (fuente de verdad). */
  var _queueSet = {};   /* { [id]: true } — mirror de state.queue */

  /* Rebuild desde el array — llamar después de _getState() */
  function _rebuildQueueSet(queue) {
    _queueSet = {};
    for (var i = 0; i < queue.length; i++) _queueSet[queue[i]] = true;
  }

  /* ── _getState / _saveState ─────────────────────────────────────────
     Acceso centralizado a NexusCore.adaptiveState.
     Nunca mutamos el objeto directo — siempre clonamos y escribimos. */
  function _getState() {
    return NexusCore.get('adaptiveState') || {
      queue:       [],
      history:     {},
      recent:      [],
      lastServed:  null
    };
  }

  function _saveState(state) {
    NexusCore.set('adaptiveState', state);
  }

  /* ── _makeItemId ─────────────────────────────────────────────────────
     ID determinista para una pregunta sin id propio.
     Usa materia + agrupador + índice en el array — estable entre sesiones
     siempre que el banco de preguntas no cambie de orden. */
  function _makeItemId(materia, agrupador, idx) {
    return (materia || 'x') + '|' + (agrupador || 'x') + '|' + idx;
  }

  /* ── _initHistory ────────────────────────────────────────────────────
     Inicializa el historial de un ítem si no existe. O(1). */
  function _initHistory(state, itemId) {
    if (!state.history[itemId]) {
      state.history[itemId] = {
        correct:   0,
        incorrect: 0,
        lastSeen:  0,
        interval:  1    /* intervalo inicial en unidades SR_FACTOR */
      };
    }
    return state.history[itemId];
  }

  /* ── isDue ───────────────────────────────────────────────────────────
     ¿Debe reaparecer este ítem según spaced repetition?
     Regla: (now - lastSeen) >= interval * SR_FACTOR */
  function isDue(histEntry) {
    if (!histEntry || !histEntry.lastSeen) return false;
    var now     = performance.now();
    var elapsed = now - histEntry.lastSeen;
    return elapsed >= histEntry.interval * SR_FACTOR;
  }

  /* ── processAnswer ───────────────────────────────────────────────────
     Actualiza history del ítem y gestiona la queue de errores.
     Llamar después de cada respuesta en el quiz.
     @param materia    string
     @param agrupador  string
     @param idx        number — índice en el banco de preguntas
     @param isCorrect  boolean */
  function processAnswer(materia, agrupador, idx, isCorrect) {
    var t0    = performance.now();
    var state = _getState();
    _rebuildQueueSet(state.queue);
    var id    = _makeItemId(materia, agrupador, idx);
    var hist  = _initHistory(state, id);

    hist.lastSeen = performance.now();

    if (isCorrect) {
      hist.correct++;
      hist.interval = Math.min(hist.interval * 2, 128);
      /* Remover del array inmediatamente — evitar que _rebuildQueueSet lo restaure */
      if (_queueSet[id]) {
        var qIdx = state.queue.indexOf(id);
        if (qIdx !== -1) state.queue.splice(qIdx, 1);
        _queueSet[id] = false;
      }
    } else {
      hist.incorrect++;
      hist.interval = 1;
      /* FIFO: push al fondo — orden de ocurrencia */
      if (!_queueSet[id]) {
        state.queue.push(id);          /* FIFO: enqueue al final */
        _queueSet[id] = true;
        if (state.queue.length > QUEUE_MAX) {
          var removed = state.queue.shift();   /* descartar el más antiguo */
          _queueSet[removed] = false;
        }
      }
    }

    /* FIX 3: score normalizado — evita sesgo por volumen histórico */
    hist.score = hist.incorrect / (hist.correct + 1);

    /* ── Difficulty Layer: tracking de streaks ───────────────────────── */
    var streaks = state.streaks || { correct: 0, incorrect: 0 };
    if (isCorrect) {
      streaks.correct++;
      streaks.incorrect = 0;
    } else {
      streaks.incorrect++;
      streaks.correct = 0;
    }
    state.streaks = streaks;

    /* recent: FIFO estricto sin duplicados */
    var recentFiltered = [];
    for (var ri = 0; ri < state.recent.length; ri++) {
      if (state.recent[ri] !== id) recentFiltered.push(state.recent[ri]);
    }
    recentFiltered.unshift(id);
    if (recentFiltered.length > RECENT_MAX) recentFiltered.pop();
    state.recent = recentFiltered;

    state.lastServed = id;
    _saveState(state);

    var elapsed = performance.now() - t0;
    if (elapsed > 1) console.warn('[NexusAdaptiveEngine] processAnswer lento:', elapsed.toFixed(2) + 'ms');
  }

  /* ── DIFFICULTY LAYER ───────────────────────────────────────────────
   *
   * Req 1: getItemDifficulty(hist) — O(1)
   *   0 = fácil, 1+ = difícil
   *   Idéntico al score normalizado (reutiliza el campo ya calculado).
   */
  function getItemDifficulty(hist) {
    if (!hist) return 0;
    return hist.score || (hist.incorrect / (hist.correct + 1));
  }

  /* Req 2: getUserState(core) — lee userProfile + streaks de adaptiveState
   *   Sin loops globales — O(1). */
  function getUserState() {
    var profile = NexusCore.get('userProfile') || {};
    var stats   = profile.stats  || {};
    var speed   = profile.speed  || {};
    var state   = _getState();
    var streaks = state.streaks  || { correct: 0, incorrect: 0 };
    return {
      accuracy:        stats.accuracy        || 0,
      avgTime:         speed.avgResponseTime || 0,
      streakCorrect:   streaks.correct,
      streakIncorrect: streaks.incorrect
    };
  }

  /* Req 3: detectMode(userState) — clasifica el estado cognitivo */
  function detectMode(us) {
    if (us.accuracy < 0.5 || us.streakIncorrect >= FATIGUE_THRESHOLD) return MODE_EASY;
    if (us.accuracy > 0.8 && us.streakCorrect   >= 4)                  return MODE_HARD;
    return MODE_FLOW;
  }

  /* Req 4: _applyDifficultyFilter(candidates, state, materia, agrupador, mode)
   *   Selección lineal O(n) — elige el mejor candidato según el modo.
   *   No reemplaza prioridades — se llama en Prioridades 2/3/4 para elegir
   *   el MEJOR dentro del conjunto ya filtrado.
   *   Devuelve el índice ganador.
   */
  function _applyDifficultyFilter(candidates, state, materia, agrupador, mode, boostIdx) {
    if (!candidates.length) return null;
    if (candidates.length === 1) return candidates[0];

    var best      = candidates[0];
    var bestScore = -Infinity;

    for (var i = 0; i < candidates.length; i++) {
      var idx  = candidates[i];
      var hist = state.history[_makeItemId(materia, agrupador, idx)];
      var diff = Math.min(1.5, getItemDifficulty(hist));   /* FIX 4: clamp */
      var seen = hist ? (hist.correct + hist.incorrect) : 0;

      var combined;
      if (mode === MODE_EASY) {
        var prevCorrect = hist ? hist.correct : 0;
        combined = prevCorrect - diff * 2;
      } else if (mode === MODE_HARD) {
        combined = diff + (hist ? hist.score : 0);
      } else {
      /* FLOW: -|diff-0.5| + historial (prioriza débiles sobre dominados) */
        combined = -Math.abs(diff - 0.5) + ((hist && hist.score) ? hist.score * 0.5 : 0) + (seen === 0 ? 0.2 : 0);
      }

      /* Boost dinámico: peso crece con dificultad del item — más natural */
      if (boostIdx !== null && boostIdx !== undefined && idx === boostIdx) {
        var boostWeight = 0.3 + (diff * 0.4);
        combined += boostWeight;
      }

      if (combined > bestScore) { bestScore = combined; best = idx; }
    }
    return best;
  }

  /* ── getNextIdx ──────────────────────────────────────────────────────
     Selecciona el índice del próximo ítem del pool usando prioridades:
       1. Queue de errores (incorrectos recientes) — excluir recent
       2. Items "due" por spaced repetition
       3. Recomendaciones de NexusIntelligence (por agrupador)
       4. Fallback: primer ítem del pool no en recent

     @param pool      Array de preguntas del banco
     @param materia   string
     @param agrupador string
     @returns number  índice en pool, o 0 como fallback seguro */
  function getNextIdx(pool, materia, agrupador) {
    if (!pool || !pool.length) return 0;

    var t0    = performance.now();
    var state = _getState();
    _rebuildQueueSet(state.queue);

    var recentSet = {};
    (state.recent || []).forEach(function(id) { recentSet[id] = true; });

    /* Candidatos: índices no en recent */
    var candidates = [];
    for (var i = 0; i < pool.length; i++) {
      if (!recentSet[_makeItemId(materia, agrupador, i)]) candidates.push(i);
    }

    /* FIX 1: recorte parcial — evitar reset agresivo que causa repeticiones bruscas */
    if (!candidates.length) {
      state.recent = state.recent.slice(0, Math.max(0, pool.length - 1));
      _saveState(state);
      recentSet = {};
      state.recent.forEach(function(id) { recentSet[id] = true; });
      candidates = [];
      for (var ii = 0; ii < pool.length; ii++) {
        if (!recentSet[_makeItemId(materia, agrupador, ii)]) candidates.push(ii);
      }
      if (!candidates.length) return 0;
    }

    /* ── Difficulty Layer: detectar estado del usuario ── */
    var us   = getUserState();
    var mode = detectMode(us);

    /* Req 5 — Fatiga: override a EASY si streakIncorrect >= umbral */
    if (us.streakIncorrect >= FATIGUE_THRESHOLD) mode = MODE_EASY;

    /* Req 6 — Boost: streak alto → marcar candidato difícil para scoring preferencial
       No hace return — el item pasa por el mismo filtro que todos los candidatos. */
    var boostIdx = null;
    if (us.streakCorrect >= BOOST_THRESHOLD) {
      var hardestDiff = -1;
      for (var b = 0; b < candidates.length; b++) {
        var bh  = state.history[_makeItemId(materia, agrupador, candidates[b])];
        var bdif = Math.min(1.5, getItemDifficulty(bh));   /* FIX 4: clamp */
        if (bdif > hardestDiff) { hardestDiff = bdif; boostIdx = candidates[b]; }
      }
      /* Solo activar boost si hay algo genuinamente difícil */
      if (hardestDiff <= 0.3) boostIdx = null;
    }

    /* ── Prioridad 1: Queue FIFO — prioridad absoluta, sin filtro de dificultad ── */
    var qid = null;
    while (state.queue.length) {
      var candidate = state.queue.shift();
      if (_queueSet[candidate]) {
        qid = candidate;
        _queueSet[candidate] = false;
        break;
      }
    }
    if (qid !== null) {
      var parts = qid.split('|');
      if (parts[0] === materia && parts[1] === agrupador) {
        var qidx = parseInt(parts[2], 10);
        if (!isNaN(qidx) && qidx < pool.length && !recentSet[qid]) {
          _trackServido(state, qid);
          _logPerf('getNextIdx[queue]', t0);
          return qidx;
        }
      }
    }

    /* ── Prioridad 2: Spaced repetition (due) — filtro adaptativo ── */
    var dueItems = [];
    for (var c = 0; c < candidates.length; c++) {
      var cid   = _makeItemId(materia, agrupador, candidates[c]);
      var chist = state.history[cid];
      if (chist && isDue(chist)) dueItems.push(candidates[c]);
    }
    if (dueItems.length) {
      var dueChosen = _applyDifficultyFilter(dueItems, state, materia, agrupador, mode, boostIdx);
      var dueId = _makeItemId(materia, agrupador, dueChosen);
      _trackServido(state, dueId);
      _logPerf('getNextIdx[due]', t0);
      return dueChosen;
    }

    /* ── Prioridad 3: Recomendaciones — filtro adaptativo ── */
    var recs = NexusCore.get('recommendations') || [];
    var recAgrupadores = {};
    recs.forEach(function(r) { recAgrupadores[r.agrupador] = true; });
    if (recAgrupadores[agrupador]) {
      var recChosen = _applyDifficultyFilter(candidates, state, materia, agrupador, mode, boostIdx);
      var recId = _makeItemId(materia, agrupador, recChosen);
      _trackServido(state, recId);
      _logPerf('getNextIdx[recs]', t0);
      return recChosen;
    }

    /* ── Prioridad 4: Fallback — filtro adaptativo ── */
    var chosen   = _applyDifficultyFilter(candidates, state, materia, agrupador, mode, boostIdx);
    var chosenId = _makeItemId(materia, agrupador, chosen);
    _trackServido(state, chosenId);
    _logPerf('getNextIdx[fallback]', t0);
    return chosen !== undefined ? chosen : 0;
  }

  /* ── _logPerf ────────────────────────────────────────────────────────
     Helper de performance — centraliza el warn. */
  function _logPerf(label, t0) {
    var e = performance.now() - t0;
    if (e > 1) console.warn('[NexusAdaptiveEngine] ' + label + ' lento: ' + e.toFixed(2) + 'ms');
  }

  /* ── _trackServido ───────────────────────────────────────────────────
     Registra el item servido sin marcar como respondido. O(1). */
  function _trackServido(state, id) {
    state.lastServed = id;
    _initHistory(state, id);
    state.history[id].lastSeen = performance.now();
    _saveState(state);
  }

  /* ── reorderPool ─────────────────────────────────────────────────────
     Reordena el pool al inicio de una sesión. O(n).
     Orden: queue (FIFO) → due (por score) → rest (por lastSeen asc). */
  function reorderPool(pool, materia, agrupador) {
    if (!pool || !pool.length) return pool;

    var state = _getState();
    _rebuildQueueSet(state.queue);
    var recentSet = {};
    (state.recent || []).forEach(function(id) { recentSet[id] = true; });

    var inQueue = [], isDueArr = [], rest = [];

    for (var i = 0; i < pool.length; i++) {
      var id   = _makeItemId(materia, agrupador, i);
      var hist = state.history[id];
      if (_queueSet[id] && !recentSet[id]) {
        inQueue.push(i);
      } else if (hist && isDue(hist) && !recentSet[id]) {
        isDueArr.push(i);
      } else {
        rest.push(i);
      }
    }

    /* due: ordenar por score desc (C5) */
    isDueArr.sort(function(a, b) {
      var ha = state.history[_makeItemId(materia, agrupador, a)];
      var hb = state.history[_makeItemId(materia, agrupador, b)];
      return ((hb && hb.score) || 0) - ((ha && ha.score) || 0);
    });

    /* rest: ordenar por lastSeen asc — C3: más tiempo sin ver → primero */
    rest.sort(function(a, b) {
      var ha = state.history[_makeItemId(materia, agrupador, a)];
      var hb = state.history[_makeItemId(materia, agrupador, b)];
      return ((ha && ha.lastSeen) || 0) - ((hb && hb.lastSeen) || 0);
    });

    var ordered = inQueue.concat(isDueArr).concat(rest);
    return ordered.map(function(idx) { return pool[idx]; });
  }

  /* ── API pública ─────────────────────────────────────────────────────*/
  return {
    processAnswer:       processAnswer,
    getNextIdx:          getNextIdx,
    reorderPool:         reorderPool,
    isDue:               isDue,
    makeItemId:          _makeItemId,
    /* Difficulty Layer */
    getItemDifficulty:   getItemDifficulty,
    getUserState:        getUserState,
    detectMode:          detectMode
  };

})();

console.info('[NEXUS ADAPTIVE ENGINE v12.2.2] boost-dinamico + flow-memoria. Producción.');

