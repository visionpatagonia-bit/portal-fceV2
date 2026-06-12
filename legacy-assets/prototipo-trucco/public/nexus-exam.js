/* ═══════════════════════════════════════════════════════════════════════
   NEXUS EXAM  ·  Portal FCE 2026  ·  v10.6.0
   ───────────────────────────────────────────────────────────────────────
   RESPONSABILIDAD:
   Simulador de examen final (25 min / 20 preguntas de todas las materias).

   CONTRATO PÚBLICO (window.NexusExamen):
   - NexusExamen.open()             → navega a nexus-examen y lanza _init()
   - NexusExamen._init()            → selecciona preguntas y renderiza
   - NexusExamen._finalizar(bool)   → muestra resultado

   DATOS:
   Usa bancos globales (propQuestions, sqData, sq2Data, quizU3, bancoDePreguntas)
   y q55Norm (nexus-quiz.js) para normalizar preguntas.
   No necesita materiales.json — usa bancos globales de preguntas.

   DEPENDENCIAS:
   - q55Norm          (nexus-quiz.js — debe cargarse antes)
   - N79QuizWorker    (portal.js)
   - Bancos globales: propQuestions, sqData, sq2Data, quizU3, bancoDePreguntas

   ORDEN DE CARGA:
   nexus-core.js → portal.js → nexus-quiz.js → nexus-fetch.js → nexus-exam.js → nexus-modules.js
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

var NexusExamen = {
  _state: null,
  TOTAL_QS: 20,
  TIEMPO_SEG: 25 * 60,  /* 25 minutos */

  /* Recolectar todas las preguntas disponibles de todos los bancos */
  _allQuestions: function() {
    var all = [];

    /* Propedéutica */
    if (typeof propQuestions !== 'undefined') {
      propQuestions.forEach(function(q) {
        all.push(Object.assign({}, q55Norm(q), { _mat: 'Propedéutica' }));
      });
    }
    /* Sociales U1, U2, U3 */
    [
      { bank: typeof sqData   !== 'undefined' ? sqData   : [], mat: 'Sociales U1' },
      { bank: typeof sq2Data  !== 'undefined' ? sq2Data  : [], mat: 'Sociales U2' },
      { bank: typeof quizU3   !== 'undefined' ? quizU3   : [], mat: 'Sociales U3' },
    ].forEach(function(s) {
      s.bank.forEach(function(q) {
        all.push(Object.assign({}, q55Norm(q), { _mat: s.mat }));
      });
    });
    /* Administración */
    if (typeof bancoDePreguntas !== 'undefined' && bancoDePreguntas.adm) {
      bancoDePreguntas.adm.forEach(function(q) {
        all.push(Object.assign({}, q55Norm(q), { _mat: 'Administración' }));
      });
    }

    return all;
  },

  _selectQuestions: function() {
    /* Compatibilidad síncrona para llamadas directas (fallback) */
    var all    = NexusExamen._allQuestions();
    var byMat  = {};
    all.forEach(function(q) {
      if (!byMat[q._mat]) byMat[q._mat] = [];
      byMat[q._mat].push(q);
    });
    var banks = Object.keys(byMat).map(function(m) { return byMat[m]; });
    return N79QuizWorker._syncShuffle(banks, NexusExamen.TOTAL_QS);
  },

  _selectQuestionsAsync: function() {
    var all   = NexusExamen._allQuestions();
    var byMat = {};
    all.forEach(function(q) {
      if (!byMat[q._mat]) byMat[q._mat] = [];
      byMat[q._mat].push(q);
    });
    var banks = Object.keys(byMat).map(function(m) { return byMat[m]; });
    return N79QuizWorker.shuffle(banks, NexusExamen.TOTAL_QS);
  },

  /* Abrir simulador de examen */
  open: function() {
    goto('nexus-examen', null);
    setTimeout(NexusExamen._init, 200);
  },

  _init: function() {
    var container = document.getElementById('examen-content');
    if (!container) return;
    NexusExamen._selectQuestionsAsync().then(function(preguntas) {
      if (!preguntas.length) {
        container.innerHTML = '<p style="color:rgba(255,255,255,.5);text-align:center;padding:40px">No hay preguntas disponibles. Completá al menos un Quiz primero.</p>';
        return;
      }

    NexusExamen._state = {
      preguntas: preguntas,
      actual: 0,
      respuestas: [],
      startedAt: Date.now(),
      timerInterval: null
    };

    NexusExamen._startTimer();
    NexusExamen._state._lastQuestionTs = Date.now();
    NexusExamen._renderPregunta(container);
    }); /* fin .then Worker */
  },

  _startTimer: function() {
    var el = document.getElementById('examen-timer');
    if (!el) return;

    NexusExamen._state.timerInterval = setInterval(function() {
      var elapsed = Math.floor((Date.now() - NexusExamen._state.startedAt) / 1000);
      var remaining = NexusExamen.TIEMPO_SEG - elapsed;

      if (remaining <= 0) {
        clearInterval(NexusExamen._state.timerInterval);
        NexusExamen._finalizar(true);
        return;
      }

      var min = Math.floor(remaining / 60);
      var sec = remaining % 60;
      el.textContent = min + ':' + (sec < 10 ? '0' : '') + sec;
      /* Color de urgencia */
      el.style.color = remaining < 300 ? '#ef4444' : remaining < 600 ? '#f59e0b' : 'rgba(255,255,255,.7)';
    }, 1000);
  },

  _renderPregunta: function(container) {
    if (!container) container = document.getElementById('examen-content');
    if (!container) return;

    var state = NexusExamen._state;
    var q     = state.preguntas[state.actual];
    var num   = state.actual + 1;
    var total = state.preguntas.length;
    var pct   = Math.round((num / total) * 100);

    /* Update header */
    var progFill = document.getElementById('examen-prog-fill');
    if (progFill) progFill.style.width = pct + '%';
    var progNum = document.getElementById('examen-num');
    if (progNum) progNum.textContent = num + ' / ' + total;
    var matBadge = document.getElementById('examen-mat');
    if (matBadge) matBadge.textContent = q._mat || '';

    var html =
      '<div class="nex-q-wrap">' +
        '<p class="nex-pregunta">' + (q.pregunta || 'Pregunta') + '</p>' +
        '<div class="nex-opciones">';

    (q.opciones || []).forEach(function(opt, i) {
      var letra = ['A','B','C','D'][i] || (i+1);
      html +=
        '<button class="nex-opt" data-idx="' + i + '" onclick="NexusExamen._responder(' + i + ')">' +
          '<span class="nex-opt-letra">' + letra + '</span>' +
          '<span class="nex-opt-texto">' + opt + '</span>' +
        '</button>';
    });

    html += '</div></div>';
    container.innerHTML = html;
  },

  _responder: function(idx) {
    var state = NexusExamen._state;
    if (!state || state.evaluado_actual) return;
    state.evaluado_actual = true;

    var q     = state.preguntas[state.actual];
    var ok    = (idx === q.correcta);
    var _respTs = state._lastQuestionTs || Date.now();
    state.respuestas.push({ idx: idx, correcta: q.correcta, ok: ok, mat: q._mat });

    /* v12: emitir evento para NexusIntelligence */
    if (window.NexusCore) {
      NexusCore.set('lastAnswer', {
        topic:   q.agrupador || q._mat || '',
        materia: q._mat || '',
        correct: ok,
        time:    Date.now() - _respTs
      });
    }

    /* Feedback visual instantáneo */
    var opts = document.querySelectorAll('.nex-opt');
    opts.forEach(function(btn, i) {
      btn.disabled = true;
      if (i === q.correcta)    btn.classList.add('nex-opt-correct');
      if (i === idx && !ok)    btn.classList.add('nex-opt-wrong');
    });

    /* Mostrar explicación si existe */
    if (q.explicacion) {
      var exp = document.createElement('div');
      exp.className = 'nex-exp ' + (ok ? 'nex-exp-ok' : 'nex-exp-no');
      exp.textContent = q.explicacion;
      var wrap = document.querySelector('.nex-q-wrap');
      if (wrap) wrap.appendChild(exp);
    }

    /* Avanzar tras 1.5s */
    setTimeout(function() {
      state.evaluado_actual = false;
      state.actual++;
      if (state.actual >= state.preguntas.length) {
        NexusExamen._finalizar(false);
      } else {
        NexusExamen._renderPregunta(null);
      }
    }, 1500);
  },

  _finalizar: function(porTiempo) {
    clearInterval(NexusExamen._state.timerInterval);

    var state    = NexusExamen._state;
    var correctas = state.respuestas.filter(function(r) { return r.ok; }).length;
    var total    = state.preguntas.length;
    var pct      = Math.round((correctas / total) * 100);
    var elapsed  = Math.round((Date.now() - state.startedAt) / 1000);
    var min      = Math.floor(elapsed / 60), sec = elapsed % 60;

    /* Por materia */
    var byMat = {};
    state.respuestas.forEach(function(r) {
      if (!byMat[r.mat]) byMat[r.mat] = { ok: 0, total: 0 };
      byMat[r.mat].total++;
      if (r.ok) byMat[r.mat].ok++;
    });

    var container = document.getElementById('examen-content');
    if (!container) return;

    var timerEl = document.getElementById('examen-timer');
    if (timerEl) timerEl.style.color = '';

    var breakdown = Object.keys(byMat).map(function(m) {
      var d = byMat[m];
      var mpct = Math.round(d.ok/d.total*100);
      return '<div class="nex-mat-row">' +
        '<span class="nex-mat-name">' + m + '</span>' +
        '<div class="nex-mat-bar"><div class="nex-mat-fill" style="width:' + mpct + '%"></div></div>' +
        '<span class="nex-mat-pct">' + mpct + '%</span>' +
      '</div>';
    }).join('');

    var icon = pct >= 60 ? '🎯' : pct >= 40 ? '📚' : '⚠️';
    var msg  = pct >= 80 ? '¡Excelente! Estás listo para el parcial.'
             : pct >= 60 ? 'Bien. Repasá las materias con menos porcentaje.'
             : pct >= 40 ? 'Necesitás reforzar. Usá el Training Ground.'
             : 'Hay que repasar. Empezá por las notas del Mentor.';

    container.innerHTML =
      '<div class="nex-resultado">' +
        (porTiempo ? '<div class="nex-timeout">⏰ Se acabó el tiempo</div>' : '') +
        '<div class="nex-score-icon">' + icon + '</div>' +
        '<div class="nex-score-num">' + correctas + '<span>/' + total + '</span></div>' +
        '<div class="nex-score-pct">' + pct + '% de aciertos · ' + min + 'm ' + sec + 's</div>' +
        '<div class="nex-score-msg">' + msg + '</div>' +
        '<div class="nex-breakdown">' + breakdown + '</div>' +
        '<div class="nex-final-btns">' +
          '<button class="nex-retry-btn" onclick="NexusExamen._init()">🔁 Nuevo examen</button>' +
          '<button class="nex-exit-btn" onclick="goto(\'home\',null)">← Volver al inicio</button>' +
        '</div>' +
      '</div>';

    /* Guardar score */
    if (typeof saveScore === 'function') saveScore('examen_final', correctas, total);
    if (typeof NexusMemoryAPI !== 'undefined') {
      NexusMemoryAPI.emit('examen:done', { pct: pct, correctas: correctas, total: total, elapsed: elapsed });
    }
    /* v8.7: Nota de Emergencia VIRCH — si ≥3 fallos en alguna materia */
    if (typeof N87EmergencyNote !== 'undefined') {
      setTimeout(function() {
        N87EmergencyNote.evalAndInject(container, state.respuestas);
      }, 600);
    }
    /* v8.7: Refrescar Analytics en el dashboard */
    if (typeof N87Analytics !== 'undefined') N87Analytics.refresh();
  }
};


console.info('[NEXUS EXAM v10.6.0] NexusExamen listo. 25 min / 20 preguntas multimaterial.');
