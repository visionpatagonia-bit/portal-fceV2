/* ═══════════════════════════════════════════════════════════════════════
   NEXUS ADAPTIVE UI  ·  Portal FCE 2026  ·  v1.0.0
   ───────────────────────────────────────────────────────────────────────

   RESPONSABILIDAD:
     Capa de UI adaptativa basada en el rendimiento del usuario.
     Traduce el estado cognitivo (accuracy, streaks, velocidad) en
     ajustes visuales aplicados al body via `data-ui-level`.

   NIVELES:
     'low'  → bajo rendimiento    → más ayuda visual, acordeones abiertos
     'mid'  → comportamiento base → UI estándar, sin cambios
     'high' → alto rendimiento    → UI compacta, sin andamios visuales

   ARQUITECTURA:
     NexusAdaptiveEngine.getUserState() → nexusGetUILevel() → applyLevel()
       → body.dataset.uiLevel → CSS body[data-ui-level="X"] { ... }
       → onPageRender() → accordion behavior vía MutationObserver

   REGLAS:
     ❌ Sin modificar pipeline de contenido
     ❌ Sin tocar nexus-adaptive-engine.js / nexus-intelligence.js
     ❌ Sin timers globales — todo vía NexusCore.on() + rAF
     ✅ Non-invasivo: wrap de fceRender, no fork
     ✅ Threshold mínimo: 5 respuestas antes de adaptar
     ✅ Fallback a 'mid' si engine no disponible
     ✅ Transición suave entre niveles (CSS transition en body)

   INTEGRACIÓN:
     index.html → cargar DESPUÉS de nexus-adaptive-engine.js
     Se auto-inicializa al cargar (espera DOMContentLoaded)
     Expone: nexusGetUILevel() y NexusAdaptiveUI en window

   DEPENDENCIAS:
     NexusCore (nexus-core.js)
     NexusAdaptiveEngine (nexus-adaptive-engine.js)
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── 0. nexusGetUILevel — función pura, sin efectos secundarios ────────
   Clasifica el estado cognitivo del usuario en un nivel de UI.

   Algoritmo en dos capas:
     1. Base: accuracy + streakIncorrect/Correct (señales más fuertes)
     2. Ajuste: velocidad de respuesta (señal secundaria, desempate)

   Threshold mínimo de 5 respuestas → evitar cambios prematuros para
   usuarios nuevos sin datos suficientes (siempre retorna 'mid' si total < 5).

   @param {Object} userStats
     {
       accuracy:        number,  0..1
       avgTime:         number,  ms (0 = sin datos)
       streakCorrect:   number,
       streakIncorrect: number,
       total:           number   (opcional — total de respuestas)
     }
   @returns {'low'|'mid'|'high'}
*/
window.nexusGetUILevel = function nexusGetUILevel(userStats) {
  if (!userStats) return 'mid';

  var accuracy        = userStats.accuracy        || 0;
  var avgTime         = userStats.avgTime         || 0;
  var streakCorrect   = userStats.streakCorrect   || 0;
  var streakIncorrect = userStats.streakIncorrect || 0;
  var total           = userStats.total           || 0;

  /* Umbral mínimo: sin datos suficientes → baseline */
  var MIN_ANSWERS = 5;
  if (total < MIN_ANSWERS) return 'mid';

  /* ── Capa 1: señales primarias ─────────────────────────────────────── */

  /* Fatiga o bajo dominio → LOW */
  if (streakIncorrect >= 3)  return 'low';
  if (accuracy < 0.40)       return 'low';

  /* Dominio alto y racha positiva → HIGH
     Más restrictivo que LOW: requiere ambas condiciones simultáneas */
  var HIGH_ACCURACY   = 0.78;
  var HIGH_STREAK     = 4;
  var HIGH_MIN_TOTAL  = 10;    /* base más sólida para confirmar nivel alto */
  if (accuracy >= HIGH_ACCURACY && streakCorrect >= HIGH_STREAK && total >= HIGH_MIN_TOTAL) {
    /* ── Capa 2: velocidad — desempate hacia HIGH más conservador ─────── */
    /* Si responde lento (≥ 18 s promedio) pese a accuracy alta:
       puede ser reflexivo (ok) o aún dudoso → no forzar HIGH todavía.
       Si avgTime es 0 (sin datos de velocidad) → ignorar factor. */
    if (avgTime > 0 && avgTime >= 18000) return 'mid';
    return 'high';
  }

  /* ── Capa 2: ajuste por velocidad (accuracy en zona media) ────────── */
  /* Muy lento + accuracy moderada → empujar a LOW */
  if (avgTime > 0 && avgTime >= 22000 && accuracy < 0.60) return 'low';

  return 'mid';
};


/* ── 1. NexusAdaptiveUI — módulo principal ─────────────────────────── */

window.NexusAdaptiveUI = (function() {

  /* Estado interno */
  var _currentLevel    = 'mid';
  var _initialized     = false;
  var _accObserver     = null;    /* MutationObserver para acordeones */
  var _pendingApply    = false;   /* debounce de accordion behavior */

  /* ── _getStats — leer estado desde el engine ─────────────────────── */
  function _getStats() {
    /* Guard: el engine puede no estar cargado si el usuario no abrió quiz */
    if (typeof NexusAdaptiveEngine === 'undefined') return null;
    if (typeof NexusCore === 'undefined')           return null;

    try {
      var us = NexusAdaptiveEngine.getUserState();

      /* Enriquecer con total de respuestas del perfil global */
      var profile = NexusCore.get('userProfile');
      var total   = (profile && profile.stats) ? (profile.stats.total || 0) : 0;

      return {
        accuracy:        us.accuracy,
        avgTime:         us.avgTime,
        streakCorrect:   us.streakCorrect,
        streakIncorrect: us.streakIncorrect,
        total:           total
      };
    } catch(e) {
      console.warn('[NexusAdaptiveUI] _getStats error:', e);
      return null;
    }
  }

  /* ── applyLevel — aplica el nivel al DOM ─────────────────────────── */
  function applyLevel(level) {
    if (!level || (level !== 'low' && level !== 'mid' && level !== 'high')) {
      console.warn('[NexusAdaptiveUI] Nivel inválido:', level);
      return;
    }

    var prev = _currentLevel;
    _currentLevel = level;

    /* Aplicar al body — CSS se encarga del resto */
    document.body.dataset.uiLevel = level;

    /* Siempre aplicar accordion behavior — garantiza estado consistente
       incluso si el nivel no cambió (ej: nueva página cargada en mismo nivel) */
    _scheduleAccordionBehavior();

    /* Log solo si hubo cambio real */
    if (prev !== level) {
      var stats = _getStats() || {};
      console.info(
        '[NexusAdaptiveUI] Nivel UI: ' + prev + ' → ' + level,
        '| accuracy:', ((stats.accuracy || 0) * 100).toFixed(0) + '%',
        '| streakOk:', stats.streakCorrect || 0,
        '| streakErr:', stats.streakIncorrect || 0
      );
    }
  }

  /* ── _recalculate — recalcular y aplicar nivel ───────────────────── */
  function _recalculate() {
    var stats = _getStats();
    if (!stats) return;                    /* engine no disponible */
    var level = nexusGetUILevel(stats);
    applyLevel(level);
  }

  /* ── _scheduleAccordionBehavior — debounce para acordeones ──────── */
  function _scheduleAccordionBehavior() {
    if (_pendingApply) return;
    _pendingApply = true;
    /* Esperar a que el DOM de la página esté pintado */
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        _applyAccordionBehavior(_currentLevel);
        _pendingApply = false;
      });
    });
  }

  /* ── _applyAccordionBehavior — declarativa, stateless ──────────── */
  /*
     Función pura de estado deseado: recibe el nivel y determina
     exactamente qué acordeones deben estar abiertos en la página activa.

     Siempre sincroniza AMBAS fuentes de verdad del portal:
       - acc.dataset.open    → leído por el click-handler
       - body.style.display  → controlado por el click-handler (block/none)
       - acc.style.*         → fondo y borde del contenedor

     Regla por nivel:
       LOW:  primeros DOS acordeones de cada grupo abiertos.
       MID:  solo el PRIMERO de cada grupo (estado default del portal).
       HIGH: TODOS cerrados — UI densa, el alumno abre lo que necesita.

     Se llama en:
       a) Cada cambio de nivel (applyLevel)
       b) Cada render de página (onPageRender via fceRender wrap)
       c) Detección de nuevos acordeones por MutationObserver

     El portal.js abre el primer acordeón por defecto en cada grupo
     (idx === 0 → body.style.display = 'block', dataset.open = '1').
     Este comportamiento es la referencia de MID.
  */
  function _applyAccordionBehavior(level) {
    var activePage = document.querySelector('.page.active');
    if (!activePage) return;

    /* Buscar solo grupos de acordeones reales (no guided-group: sin nx-acc) */
    var groups = activePage.querySelectorAll('.nx-accordion-group');
    if (!groups.length) return;

    groups.forEach(function(group) {
      var accs = group.querySelectorAll(':scope > .nx-acc, .nx-acc');
      if (!accs.length) return;

      accs.forEach(function(acc, idx) {
        var body  = acc.querySelector('.nx-acc-body');
        if (!body) return;

        /* ── Calcular estado deseado basado en nivel e índice ── */
        var shouldBeOpen;
        if      (level === 'low')  shouldBeOpen = idx < 2;    /* primeros dos */
        else if (level === 'high') shouldBeOpen = false;       /* todos cerrados */
        else                       shouldBeOpen = idx === 0;   /* solo el primero (MID/default) */

        var isCurrentlyOpen = acc.dataset.open === '1';

        /* ── Solo actuar si hay discrepancia → evitar redraw innecesario ── */
        if (shouldBeOpen === isCurrentlyOpen) return;

        if (shouldBeOpen) {
          /* ABRIR ─────────────────────────────────────────────────── */
          body.style.display = 'block';              /* visible */
          acc.dataset.open   = '1';                  /* sync click-handler */

          /* Visual: fondo y borde de apertura (replica click-handler) */
          acc.style.background   = 'rgba(255,255,255,.08)';
          /* Usar accentColor del dataset si existe, fallback a fce */
          var accent = acc.dataset.accentColor ||
                       getComputedStyle(document.documentElement)
                         .getPropertyValue('--fce-base').trim() ||
                       'rgba(255,255,255,.3)';
          acc.style.borderColor  = accent;

          /* Flecha rotada */
          var arrow = acc.querySelector('.nx-acc-arrow');
          if (arrow) arrow.style.transform = 'rotate(90deg)';

          /* Marcar como adaptativo para logging/debug (no para lógica) */
          acc.dataset.adaptiveLevel = level;

        } else {
          /* CERRAR ─────────────────────────────────────────────────── */
          body.style.display = 'none';               /* oculto */
          acc.dataset.open   = '0';                  /* sync click-handler */

          /* Visual: fondo y borde de cierre */
          acc.style.background  = 'rgba(255,255,255,.05)';
          acc.style.borderColor = 'rgba(255,255,255,.15)';

          /* Flecha horizontal */
          var arrow2 = acc.querySelector('.nx-acc-arrow');
          if (arrow2) arrow2.style.transform = '';

          /* Limpiar marcador adaptativo */
          delete acc.dataset.adaptiveLevel;
        }
      });
    });
  }

  /* ── onPageRender — hook de navegación ──────────────────────────── */
  /*
     Llamar desde el wrapper de fceRender (hook no invasivo)
     o desde el MutationObserver al detectar nueva página activa.
     Aplica accordion behavior al nivel actual.
  */
  function onPageRender(pageId) {
    _scheduleAccordionBehavior();
  }

  /* ── _hookFceRender — wrap no-invasivo de window.fceRender ──────── */
  /*
     fceRender es la función llamada por goto() al final.
     La wrapeamos para interceptar el evento de render de página
     sin modificar portal.js.
     Estrategia: espera a que fceRender exista (puede cargarse después).
  */
  function _hookFceRender() {
    /* Si ya existe → wrap inmediato */
    if (typeof window.fceRender === 'function') {
      _wrapFceRender();
      return;
    }
    /* Si no existe aún → MutationObserver de último recurso en window */
    /* Fallback más seguro: poll liviano (máximo 3 segundos, 10 intentos) */
    var attempts = 0;
    var interval = setInterval(function() {
      attempts++;
      if (typeof window.fceRender === 'function') {
        clearInterval(interval);
        _wrapFceRender();
      } else if (attempts >= 30) {
        /* fceRender no encontrado — usar solo MutationObserver */
        clearInterval(interval);
        console.warn('[NexusAdaptiveUI] fceRender no encontrado; usando solo MutationObserver.');
      }
    }, 100);
  }

  function _wrapFceRender() {
    /* Guard: no wrappear dos veces */
    if (window.fceRender && window.fceRender._nexusAdaptiveWrapped) return;

    var _orig = window.fceRender;
    window.fceRender = function(pageId) {
      /* Ejecutar render original primero */
      if (typeof _orig === 'function') _orig(pageId);
      /* Luego aplicar comportamiento adaptativo */
      onPageRender(pageId);
    };
    window.fceRender._nexusAdaptiveWrapped = true;
  }

  /* ── _initObserver — MutationObserver para página activa ────────── */
  /*
     Observa cambios en .page.active para detectar cuando una nueva
     página recibe la clase 'active' (via goto → classList.add('active')).
     Complementa el hook de fceRender — cubre casos donde fceRender
     no se invoca (carga inicial, redirect).
  */
  function _initObserver() {
    if (_accObserver) return;

    var _debounce = null;

    _accObserver = new MutationObserver(function(mutations) {
      var shouldApply = false;

      mutations.forEach(function(mut) {
        if (mut.type === 'attributes' && mut.attributeName === 'class') {
          var target = mut.target;
          /* Solo interesados en .page que recibió 'active' */
          if (target.classList && target.classList.contains('page') &&
              target.classList.contains('active')) {
            shouldApply = true;
          }
        }
        /* También detectar cuando se agregan nx-acc al DOM */
        if (mut.type === 'childList') {
          mut.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              if (node.classList && (node.classList.contains('nx-acc') ||
                  node.classList.contains('nx-accordion-group') ||
                  node.classList.contains('nx-guided-group'))) {
                shouldApply = true;
              }
              /* Buscar descendientes nx-acc */
              if (node.querySelector && node.querySelector('.nx-acc')) {
                shouldApply = true;
              }
            }
          });
        }
      });

      if (shouldApply) {
        /* Debounce: no disparar múltiples veces por el mismo render */
        clearTimeout(_debounce);
        _debounce = setTimeout(function() {
          _applyAccordionBehavior(_currentLevel);
        }, 80);
      }
    });

    /* Observar el contenedor principal + document.body para clase active */
    var main = document.getElementById('main') || document.body;
    _accObserver.observe(main, {
      childList:     true,
      subtree:       true,
      attributes:    true,
      attributeFilter: ['class']
    });
  }

  /* ── _initCoreSubscriptions — suscripciones reactivas ───────────── */
  /*
     Conectar con NexusCore para recibir actualizaciones de perfil.
     'userProfile' se emite cada vez que NexusIntelligence.processAnswer()
     actualiza el perfil → automáticamente post-quiz.
  */
  function _initCoreSubscriptions() {
    if (typeof NexusCore === 'undefined') return;

    /* Suscribirse a actualizaciones de perfil */
    NexusCore.on('userProfile', function() {
      /* Recalcular nivel con las nuevas stats */
      _recalculate();
    }, { priority: 'normal' });

    /* También suscribirse a lastAnswer para respuesta inmediata a streaks */
    NexusCore.on('lastAnswer', function() {
      _recalculate();
    }, { priority: 'normal' });
  }

  /* ── init — bootstrap del módulo ─────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    /* Nivel inicial — sin datos aún = 'mid' */
    applyLevel('mid');

    /* Inicializar suscripciones reactivas */
    _initCoreSubscriptions();

    /* Inicializar MutationObserver */
    _initObserver();

    /* Hook en fceRender */
    _hookFceRender();

    /* Calcular nivel inmediato si hay datos previos (sesión recuperada) */
    _recalculate();

    console.info('[NexusAdaptiveUI v1.0.0] Inicializado. Nivel:', _currentLevel);
  }

  /* ── API pública ─────────────────────────────────────────────────── */
  return {
    init:          init,
    applyLevel:    applyLevel,
    onPageRender:  onPageRender,

    /* Debug helpers */
    getLevel:   function() { return _currentLevel; },
    recalc:     function() { _recalculate(); return _currentLevel; },
    getStats:   function() { return _getStats(); },

    /**
     * nexusAdaptiveDebug()
     * Muestra el estado completo del sistema adaptativo en consola.
     */
    debug: function() {
      var stats = _getStats();
      var level = _currentLevel;
      console.group('%c[NexusAdaptiveUI] Estado del sistema adaptativo', 'color:#58a6ff;font-weight:bold');
      console.log('Nivel actual:      ', level);
      console.log('body[data-ui-level]:', document.body.dataset.uiLevel);
      if (stats) {
        console.group('Señales del usuario');
        console.log('accuracy:         ', (stats.accuracy * 100).toFixed(1) + '%');
        console.log('avgResponseTime:  ', stats.avgTime ? (stats.avgTime / 1000).toFixed(1) + 's' : 'sin datos');
        console.log('streakCorrect:    ', stats.streakCorrect);
        console.log('streakIncorrect:  ', stats.streakIncorrect);
        console.log('total respuestas: ', stats.total);
        console.groupEnd();
      } else {
        console.log('Stats: motor no disponible / sin datos');
      }
      console.group('Lógica de clasificación (nexusGetUILevel)');
      console.log('LOW:  accuracy < 0.40 || streakIncorrect >= 3 (min 5 resp.)');
      console.log('HIGH: accuracy >= 0.78 && streakCorrect >= 4 (min 10 resp.)');
      console.log('MID:  caso base / sin datos suficientes');
      console.groupEnd();
      console.log('Para forzar un nivel: NexusAdaptiveUI.applyLevel("low"|"mid"|"high")');
      console.groupEnd();
    }
  };

})();

/* ── Exponer nexusAdaptiveDebug en window para conveniencia ─────────── */
window.nexusAdaptiveDebug = function() { NexusAdaptiveUI.debug(); };

/* ── Auto-init: esperar a que el DOM esté listo ─────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    NexusAdaptiveUI.init();
  });
} else {
  NexusAdaptiveUI.init();
}

console.info('[NEXUS ADAPTIVE UI v1.0.0] Loaded. nexusAdaptiveDebug() disponible en consola.');
