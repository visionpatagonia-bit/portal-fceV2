/* ═══════════════════════════════════════════════════════════════════════
   NEXUS INTELLIGENCE  ·  Portal FCE 2026  ·  v12.0.0
   ───────────────────────────────────────────────────────────────────────
   RESPONSABILIDAD: capa de inteligencia sobre NexusCore.
   Procesa eventos de quiz/exam → métricas → recomendaciones → UI.

   ARQUITECTURA:
     Quiz/Exam → NexusCore.set('lastAnswer') → processAnswer()
       → updateGlobalStats()  → profile.stats
       → updateTopicStats()   → profile.topics[topic]
       → updateSpeed()        → profile.speed
       → computeRecommendations() → NexusCore.set('recommendations')

   REGLAS:
     ❌ Sin lógica de inteligencia en UI
     ❌ Sin cálculos dentro de render
     ❌ Sin modificar materiales originales
     ✅ Todo pasa por NexusCore
     ✅ Procesamiento desacoplado
     ✅ < 1ms por evento
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

window.NexusIntelligence = (function() {

  /* ── Estado inicial del perfil ─────────────────────────────────────── */
  var _defaultProfile = {
    stats: {
      total:     0,
      correct:   0,
      incorrect: 0,
      accuracy:  0
    },
    topics: {},      /* topicId → { correct, incorrect, accuracy, lastSeen } */
    speed: {
      count:           0,
      totalTime:       0,
      avgResponseTime: 0
    }
  };

  /* Inicializar en NexusCore si no existe */
  if (!NexusCore.get('userProfile')) {
    NexusCore.set('userProfile', JSON.parse(JSON.stringify(_defaultProfile)));
  }
  if (!NexusCore.get('recommendations')) {
    NexusCore.set('recommendations', []);
  }
  /* Fase 12.1 prep — estructura para Adaptive Engine (sin lógica aún) */
  if (!NexusCore.get('adaptiveState')) {
    NexusCore.set('adaptiveState', { queue: [], history: {}, recent: [], lastServed: null });
  }

  /* ── updateGlobalStats ──────────────────────────────────────────────── */
  function updateGlobalStats(profile, answer) {
    var s = profile.stats;
    s.total++;
    if (answer.correct) s.correct++;
    else                s.incorrect++;
    s.accuracy = s.total > 0 ? s.correct / s.total : 0;
  }

  /* ── updateTopicStats ───────────────────────────────────────────────── */
  function updateTopicStats(profile, answer) {
    var topic = answer.topic || 'General';
    if (!profile.topics[topic]) {
      profile.topics[topic] = {
        correct:   0,
        incorrect: 0,
        accuracy:  0,
        lastSeen:  null
      };
    }
    var t = profile.topics[topic];
    if (answer.correct) t.correct++;
    else                t.incorrect++;
    var total = t.correct + t.incorrect;
    t.accuracy  = total > 0 ? t.correct / total : 0;
    t.lastSeen  = Date.now();
  }

  /* ── updateSpeed ────────────────────────────────────────────────────── */
  function updateSpeed(profile, answer) {
    if (!answer.time || answer.time <= 0) return;
    var sp = profile.speed;
    sp.count++;
    sp.totalTime += answer.time;
    sp.avgResponseTime = sp.count > 0 ? sp.totalTime / sp.count : 0;
  }

  /* ── computeRecommendations ─────────────────────────────────────────── */
  /* Selecciona materiales cuyos agrupadores tienen accuracy < 0.6.
     Ordenados por accuracy ascendente (más débil primero). */
  function _getRecommendationScore(item, profile) {
    var topicStats = profile.topics && profile.topics[item.agrupador];
    var accuracy   = topicStats ? topicStats.accuracy : 0.5;  /* sin datos → neutro, no al fondo */
    return (1 - accuracy) + Math.random() * 0.1;
  }

  function _trackRecent(itemIds) {
    var state  = NexusCore.get('adaptiveState') || {};
    var recent = state.recent || [];
    itemIds.forEach(function(id) { recent.unshift(id); });
    state.recent = recent.slice(0, 5);
    NexusCore.set('adaptiveState', state);
  }

  function computeRecommendations(profile) {
    var materiales = NexusCore.getMateriales();
    if (!materiales.length) return [];

    var adaptiveState = NexusCore.get('adaptiveState') || {};
    var recentSet = {};
    (adaptiveState.recent || []).forEach(function(id) { recentSet[id] = true; });

    var candidates = materiales.filter(function(m) {
      return (m.tipo === 'Resumen' || m.tipo === 'Práctico') && !recentSet[m.id];
    });

    var weakTopics = {};
    Object.keys(profile.topics).forEach(function(topic) {
      var t = profile.topics[topic];
      if ((t.correct + t.incorrect) >= 2 && t.accuracy < 0.6) weakTopics[topic] = true;
    });

    var weak  = candidates.filter(function(m) { return  weakTopics[m.agrupador]; });
    var other = candidates.filter(function(m) { return !weakTopics[m.agrupador]; });

    weak.sort(function(a,b) {
      return _getRecommendationScore(b,profile) - _getRecommendationScore(a,profile);
    });
    other.sort(function(a,b) {
      return _getRecommendationScore(b,profile) - _getRecommendationScore(a,profile);
    });

    var recs = weak.concat(other).slice(0, 10);
    if (recs.length < 5) recs = weak.concat(other).slice(0, Math.max(5, recs.length));

    _trackRecent(recs.map(function(m) { return m.id; }));
    return recs.slice(0, 10);
  }

  /* ── processAnswer — core del motor ────────────────────────────────── */
  function processAnswer(answer) {
    if (!answer) return;
    var t0 = performance.now();

    var profile = NexusCore.get('userProfile') ||
                  JSON.parse(JSON.stringify(_defaultProfile));

    updateGlobalStats(profile, answer);
    updateTopicStats(profile, answer);
    updateSpeed(profile, answer);

    NexusCore.set('userProfile', profile);

    var recs = computeRecommendations(profile);
    NexusCore.set('recommendations', recs);

    var elapsed = performance.now() - t0;
    if (elapsed > 1) {
      console.warn('[NexusIntelligence] processAnswer lento:', elapsed.toFixed(2) + 'ms');
    }
  }

  /* ── Suscripción a eventos de quiz/exam ─────────────────────────────── */
  NexusCore.on('lastAnswer', processAnswer, { priority: 'normal' });

  /* ── API pública ─────────────────────────────────────────────────────── */

  /* getWeakTopics(): array de {topic, accuracy} ordenados ascendente */
  function getWeakTopics(threshold) {
    threshold = threshold || 0.6;
    var profile = NexusCore.get('userProfile') || _defaultProfile;
    return Object.keys(profile.topics)
      .map(function(topic) {
        return { topic: topic, accuracy: profile.topics[topic].accuracy,
                 total: profile.topics[topic].correct + profile.topics[topic].incorrect };
      })
      .filter(function(t) { return t.total >= 2 && t.accuracy < threshold; })
      .sort(function(a, b) { return a.accuracy - b.accuracy; });
  }

  /* reset(): limpiar perfil (para tests o nuevo alumno) */
  function reset() {
    NexusCore.set('userProfile', JSON.parse(JSON.stringify(_defaultProfile)));
    NexusCore.set('recommendations', []);
    console.info('[NexusIntelligence] Perfil reseteado.');
  }

  /* Debug */
  window.nexusDebugProfile = function() {
    var profile = NexusCore.get('userProfile');
    var recs    = NexusCore.get('recommendations');
    console.group('[NexusIntelligence] Estado actual');
    console.log('Perfil:',        profile);
    console.log('Weak topics:',   getWeakTopics());
    console.log('Recomend.:',     recs.length, recs.map(function(r) { return r.titulo; }));
    console.groupEnd();
    return { profile: profile, weakTopics: getWeakTopics(), recommendations: recs };
  };

  return { processAnswer: processAnswer, getWeakTopics: getWeakTopics, reset: reset };

})();

console.info('[NEXUS INTELLIGENCE v12.0.0] Tracking activo. nexusDebugProfile() disponible.');
