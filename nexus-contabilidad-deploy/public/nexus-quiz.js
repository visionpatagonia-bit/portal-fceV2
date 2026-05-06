/* ═══════════════════════════════════════════════════════════════════════
   NEXUS QUIZ  ·  Portal FCE 2026  ·  v10.5.0
   ───────────────────────────────────────────────────────────────────────
   FASE 5 COMPLETA — Motor q55 extraído de portal.js.
   portal.js ya NO contiene q55* — este archivo es la fuente única.

   RESPONSABILIDADES:
   - q55GetBank / q55Start / q55Render / q55Responder / q55Siguiente / q55RenderResult
   - _q55States (mapa de estado por contenedor DOM)
   - NexusQuiz (API pública estable)

   CONTRATO PÚBLICO (window.NexusQuiz):
   - NexusQuiz.start(cid, materia, agrupador)   → inicia quiz
   - NexusQuiz.getBank(materia, agrupador)       → banco filtrado
   - NexusQuiz.reset(cid)                        → limpia contenedor
   - NexusQuiz.isReady()                         → bool — motor disponible

   DATOS:
   Consume NexusCore.getMateriales() — fuente canónica.
   Bancos de preguntas: bancoDePreguntas, sqData, sq2Data, quizU3, propQuestions
   (definidos en portal.js — dependencia de inicialización, no de lectura).

   ORDEN DE CARGA REQUERIDO:
   nexus-core.js → portal.js → nexus-quiz.js → nexus-modules.js

   DEPENDENCIAS OPCIONALES (no bloquean si fallan):
   NexusMemoryAPI, cneMarkMastery, saveScore, n73SyncProgreso,
   N81SesgoEngine, N81FeedbackMatrix, v53FlashStart
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── Estado interno del motor de quiz ──────────────────────────────── */
var _q55States = {};   /* { [cid]: estadoDelQuiz } */

/* ── Utilidades ─────────────────────────────────────────────────────── */
function q55Shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function q55Color(materia) {
  var m = {
    'Propedéutica':'#c0392b','Contabilidad':'#1a6e4a','Contabilidad I':'#1a6e4a',
    'Administración':'#1a4a8a','Administración I':'#1a4a8a',
    'Sociales':'#6d3a9c','Cs. Sociales':'#6d3a9c'
  };
  return m[materia] || '#1a4a8a';
}

/* Normalizar pregunta al formato interno */
function q55Norm(q) {
  return {
    pregunta:  q.q    || q.pregunta  || '',
    opciones:  q.opts || q.opciones  || [],
    correcta:  typeof q.ans !== 'undefined' ? q.ans : (q.correcta || 0),
    explicacion: q.exp || q.explicacion || '',
    sec:       q.sec  || ''
  };
}

/* ── q55GetBank — banco filtrado por materia y agrupador ────────────── */
function q55GetBank(materia, agrupador) {
  var ag  = agrupador || '';
  var raw = [];

  if (materia === 'Sociales' || materia === 'Cs. Sociales') {
    var isIII = ag.indexOf('III') !== -1;
    var isII  = ag.indexOf('II')  !== -1 && !isIII;
    if      (isIII) raw = typeof quizU3  !== 'undefined' ? quizU3  : [];
    else if (isII)  raw = typeof sq2Data !== 'undefined' ? sq2Data : [];
    else            raw = typeof sqData  !== 'undefined' ? sqData  : [];

  } else if (materia === 'Propedéutica') {
    raw = typeof propQuestions !== 'undefined' ? propQuestions : [];

  } else if (typeof bancoDePreguntas !== 'undefined') {
    var isAdm    = (materia === 'Administración' || materia === 'Administración I');
    var fullBank = isAdm ? (bancoDePreguntas.adm || []) : (bancoDePreguntas.cont || []);

    if (isAdm && ag) {
      raw = fullBank;
    } else if (!isAdm && ag) {
      var secMap = {
        'Itinerario I':'IT. I','Itinerario II':'IT. II','Itinerario III':'IT. III',
        'Itinerario IV':'IT. IV','Itinerario V':'IT. V','Itinerario VI':'IT. VI',
        'U1':'IT. I','U2':'IT. II','U3':'IT. III','U4':'IT. IV','U5':'IT. V','U6':'IT. VI'
      };
      var targetSec = secMap[ag];
      raw = targetSec
        ? fullBank.filter(function(q) { return q.sec === targetSec; })
        : fullBank;
    } else {
      raw = fullBank;
    }
  }

  if (!raw.length) return [];

  /* Máx 10 al azar */
  var shuffled = q55Shuffle(raw);
  return shuffled.slice(0, Math.min(shuffled.length, 10)).map(q55Norm);
}

/* ── q55Start — iniciar quiz en un contenedor DOM ───────────────────── */
window.q55Start = function(cid, materia, agrupador) {
  var el = document.getElementById(cid);
  if (!el) return;

  var preguntas = q55GetBank(materia, agrupador);
  if (!preguntas.length) {
    el.innerHTML = '<p class="mc-fallback" style="padding:16px 0">Sin preguntas disponibles para este módulo.</p>';
    return;
  }

  /* v12.1: reordenar pool según historial adaptativo */
  var preguntasOrdenadas = (typeof NexusAdaptiveEngine !== 'undefined')
    ? NexusAdaptiveEngine.reorderPool(preguntas, materia, agrupador)
    : preguntas;

  _q55States[cid] = {
    preguntas:          preguntasOrdenadas,
    actual:             0,
    respuestasCorrectas:0,
    totalPreguntas:     preguntasOrdenadas.length,
    respondida:         false,
    materia:            materia,
    agrupador:          agrupador,
    color:              q55Color(materia)
  };

  window.q55Render(cid);
};

/* ── q55Render — renderizar pregunta actual ─────────────────────────── */
window.q55Render = function(cid) {
  var el = document.getElementById(cid);
  var s  = _q55States[cid];
  if (!el || !s) return;

  var q    = s.preguntas[s.actual];
  var num  = s.actual + 1;
  var tot  = s.totalPreguntas;
  var pct  = Math.round((num / tot) * 100);

  var header = '<div class="q55-header">' +
    '<div class="q55-prog-info">' +
      '<span class="q55-num">' + num + ' / ' + tot + '</span>' +
      '<span class="q55-score-live">✓ ' + s.respuestasCorrectas + '</span>' +
    '</div>' +
    '<div class="q55-progbar"><div class="q55-progfill" style="width:' + pct + '%;background:' + s.color + '"></div></div>' +
  '</div>';

  var opts = (q.opciones || []).map(function(opt, i) {
    var letra = ['A','B','C','D'][i] || (i+1);
    return '<button class="q55-opt" data-idx="' + i + '" ' +
      'onclick="q55Responder(\'' + cid + '\',' + i + ')">' +
      '<span class="q55-opt-letra">' + letra + '</span>' +
      '<span class="q55-opt-texto">' + opt + '</span>' +
    '</button>';
  }).join('');

  el.innerHTML = header +
    '<p class="q55-pregunta">' + (q.pregunta || '') + '</p>' +
    '<div class="q55-opciones">' + opts + '</div>';

  s.respondida  = false;
  s._questionTs = Date.now();   /* v12: timestamp para tracking de velocidad */
};

/* ── q55Responder — evaluar respuesta ──────────────────────────────── */
window.q55Responder = function(cid, elegida) {
  var el = document.getElementById(cid);
  var s  = _q55States[cid];
  if (!el || !s || s.respondida) return;
  s.respondida = true;

  var q  = s.preguntas[s.actual];
  var ok = (elegida === q.correcta);
  if (ok) s.respuestasCorrectas++;

  /* v12: emitir evento para NexusIntelligence */
  if (window.NexusCore) {
    NexusCore.set('lastAnswer', {
      topic:    s.agrupador || s.materia || '',
      materia:  s.materia   || '',
      correct:  ok,
      time:     s._questionTs ? (Date.now() - s._questionTs) : 0
    });
  }
  /* v12.1: registrar en Adaptive Engine (tracking por ítem específico) */
  if (typeof NexusAdaptiveEngine !== 'undefined') {
    NexusAdaptiveEngine.processAnswer(s.materia, s.agrupador, s.actual, ok);
  }
  /* v13: prefetch del próximo ítem inmediatamente post-respuesta */
  if (typeof NexusPrefetch !== 'undefined' && s.preguntas && s.preguntas.length) {
    NexusPrefetch.prefetchNext(s.preguntas, s.materia, s.agrupador);
  }

  /* Feedback visual */
  var btns = el.querySelectorAll('.q55-opt');
  btns.forEach(function(btn, i) {
    btn.disabled = true;
    if (i === q.correcta)             btn.classList.add('q55-opt-correct');
    if (i === elegida && !ok)         btn.classList.add('q55-opt-wrong');
  });

  /* Explicación */
  if (q.explicacion) {
    var expEl = document.createElement('div');
    expEl.className = 'q55-exp ' + (ok ? 'q55-exp-ok' : 'q55-exp-no') + ' q55-exp-main';
    expEl.innerHTML = '<span class="q55-exp-main">' + (ok ? '✓ Correcto' : '✗ Incorrecto') + '</span> ' + q.explicacion;
    el.appendChild(expEl);
  }

  /* Botón siguiente */
  var sigBtn = document.createElement('button');
  sigBtn.className = 'q55-sig-btn';
  sigBtn.style.background = s.color;
  sigBtn.textContent = (s.actual + 1 < s.totalPreguntas) ? 'Siguiente →' : 'Ver resultado';
  sigBtn.onclick = function() { window.q55Siguiente(cid); };
  el.appendChild(sigBtn);
};

/* ── q55Siguiente — avanzar a la siguiente pregunta ─────────────────── */
window.q55Siguiente = function(cid) {
  var s = _q55States[cid];
  if (!s) return;

  /* v13: consumir prefetch para selección instantánea del próximo ítem.
     Si el cache es válido → s.actual salta directamente al índice precalculado.
     Si no → flujo normal con s.actual++ */
  if (typeof NexusPrefetch !== 'undefined' &&
      typeof NexusAdaptiveEngine !== 'undefined' &&
      s.actual + 1 < s.totalPreguntas) {
    var prefetchedIdx = NexusPrefetch.consume(s.preguntas, s.materia, s.agrupador);
    if (prefetchedIdx !== null) {
      s.actual = prefetchedIdx;
      window.q55Render(cid);
      return;
    }
  }

  s.actual++;
  if (s.actual >= s.totalPreguntas) {
    window.q55RenderResult(cid);
  } else {
    window.q55Render(cid);
  }
};

/* ── q55RenderResult — pantalla final con score ─────────────────────── */
window.q55RenderResult = function(cid) {
  var el = document.getElementById(cid);
  var s  = _q55States[cid];
  if (!el || !s) return;

  var pct  = Math.round((s.respuestasCorrectas / s.totalPreguntas) * 100);
  var msg  = (typeof Nexus6 !== 'undefined') ? Nexus6.Feedback.get(pct)
           : (pct>=80?'¡Excelente! Estás listo/a.':pct>=60?'Bien, repasá los errores.':'Necesitás repasar más.');
  var icon = pct >= 80 ? '🎯' : pct >= 60 ? '📚' : '⚠️';

  /* Notificar a los módulos de analytics — sin bloquear si fallan */
  try { if (typeof NexusMemoryAPI !== 'undefined') NexusMemoryAPI.emit('quiz:end', { cid:cid, pct:pct, materia:s.materia, agrupador:s.agrupador }); } catch(e) {}
  try { if (typeof cneMarkMastery === 'function')  cneMarkMastery(s.materia, s.agrupador, pct); } catch(e) {}
  try { if (typeof saveScore === 'function') { var k = (s.agrupador||s.materia||cid).replace(/[^a-z0-9]/gi,'_').toLowerCase(); saveScore(k, s.respuestasCorrectas, s.totalPreguntas); } } catch(e) {}
  try { setTimeout(function() { if (typeof n73SyncProgreso === 'function') n73SyncProgreso(); }, 500); } catch(e) {}
  try { setTimeout(function() { if (typeof N81SesgoEngine !== 'undefined') N81SesgoEngine.run(); if (typeof N81FeedbackMatrix !== 'undefined') N81FeedbackMatrix.render('n81-espejo-container'); }, 1000); } catch(e) {}
  try { if (pct < 60 && s.agrupador) { var _rep = JSON.parse(localStorage.getItem('nexus71_repaso_v1') || '{}'); _rep[(s.materia||'')+'|'+s.agrupador] = { pct:pct, ts:Date.now() }; localStorage.setItem('nexus71_repaso_v1', JSON.stringify(_rep)); } } catch(e) {}
  try { setTimeout(function() { if (typeof cneExitQuiz === 'function') cneExitQuiz(); }, 600); } catch(e) {}

  var wrap = document.createElement('div');
  wrap.className = 'q55-scorecard';
  wrap.innerHTML =
    '<div class="q55-score-icon">' + icon + '</div>' +
    '<div class="q55-score-num" style="color:' + s.color + '">' + s.respuestasCorrectas +
      '<span class="q55-score-total"> / ' + s.totalPreguntas + '</span></div>' +
    '<div class="q55-score-pct">' + pct + '% de acierto</div>' +
    '<div class="q55-score-msg">' + msg + '</div>';

  var actions = document.createElement('div');
  actions.className = 'q55-score-actions';

  var retryBtn = document.createElement('button');
  retryBtn.className = 'q55-retry-btn';
  retryBtn.style.background = s.color;
  retryBtn.textContent = 'Reiniciar Entrenamiento';
  retryBtn.addEventListener('click', function() { q55Start(cid, s.materia, s.agrupador); });
  actions.appendChild(retryBtn);

  var flashBtn = document.createElement('button');
  flashBtn.className = 'q55-flash-btn';
  flashBtn.style.cssText = 'border-color:' + s.color + ';color:' + s.color;
  flashBtn.textContent = '🃏 Flashcards';
  flashBtn.addEventListener('click', function() {
    try { if (typeof v53FlashStart === 'function') v53FlashStart(cid, s.materia, s.agrupador); } catch(e) {}
  });
  actions.appendChild(flashBtn);

  wrap.appendChild(actions);
  el.innerHTML = '';
  el.appendChild(wrap);
};

/* ── Aliases de compatibilidad ──────────────────────────────────────── */
window.v53QuizStart = function(cid, mat, ag) { window.q55Start(cid, mat, ag); };
window.v52QuizStart = function(cid, mat, ag) { window.q55Start(cid, mat, ag); };

/* ═══════════════════════════════════════════════════════════════════════
   API PÚBLICA — NexusQuiz
   ═══════════════════════════════════════════════════════════════════════ */
window.NexusQuiz = (function() {

  function start(cid, materia, agrupador) {
    window.q55Start(cid, materia, agrupador);
  }

  function getBank(materia, agrupador) {
    try { return q55GetBank(materia, agrupador); } catch(e) { return []; }
  }

  function reset(cid) {
    delete _q55States[cid];
    var el = document.getElementById(cid);
    if (el) el.innerHTML = '';
  }

  function isReady() {
    return typeof bancoDePreguntas !== 'undefined'
      || typeof sqData !== 'undefined'
      || typeof propQuestions !== 'undefined';
  }

  return { start:start, getBank:getBank, reset:reset, isReady:isReady };
})();


console.info('[NEXUS QUIZ v10.5.0] Fase 5 completa — motor q55 extraído de portal.js. NexusQuiz listo.');
