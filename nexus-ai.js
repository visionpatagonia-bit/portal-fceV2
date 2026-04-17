/**
 * ═══════════════════════════════════════════════════════════════════
 *  NEXUS AI Co-Worker — v1.1.0
 * ═══════════════════════════════════════════════════════════════════
 *  Widget de chat integrado al Portal FCE.
 *  Conecta con Ollama (llama3.2) via nexus-ai-proxy + Cloudflare Tunnel.
 *
 *  Features:
 *    - Chat flotante con animación suave
 *    - Streaming token-by-token desde SSE
 *    - Contexto adaptativo (sabe qué material ve el alumno)
 *    - Personalidad por materia (socrático / directo / pedagógico)
 *    - Mobile-first, responsive
 *    - Markdown básico en respuestas
 *    - Historial de conversación en sesión
 *    - Indicadores de estado (pensando, error, offline)
 *    - Config dinámica: lee nexus-ai-config.json en runtime (sin redeploy)
 *
 *  Dependencias: NEXUS_STATE (de nexus-core.js / portal.js)
 * ═══════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  /* ── CONFIG (defaults — se sobreescriben desde nexus-ai-config.json) ── */
  var NX_AI = {
    proxyUrl:      'http://localhost:3100',
    apiKey:        'nexus-fce-2026-changeme',
    maxHistory:    20,
    maxInputChars: 500,
    _configLoaded: false
  };

  /* Override inline si existe (legacy / emergencia) */
  if (window.NEXUS_AI_CONFIG) {
    if (window.NEXUS_AI_CONFIG.proxyUrl) NX_AI.proxyUrl = window.NEXUS_AI_CONFIG.proxyUrl;
    if (window.NEXUS_AI_CONFIG.apiKey)   NX_AI.apiKey   = window.NEXUS_AI_CONFIG.apiKey;
    NX_AI._configLoaded = true;
  }

  /**
   * Carga nexus-ai-config.json en runtime.
   * Ventaja: actualizar la URL del tunnel solo requiere editar ese JSON
   * y hacer push — sin tocar index.html ni el widget.
   */
  function loadRemoteConfig(callback) {
    if (NX_AI._configLoaded) { callback(); return; }
    fetch('/nexus-ai-config.json?_=' + Date.now(), { cache: 'no-store' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(cfg) {
        if (cfg) {
          if (cfg.proxyUrl && cfg.proxyUrl.indexOf('TU-TUNNEL') === -1) {
            NX_AI.proxyUrl = cfg.proxyUrl;
          }
          if (cfg.apiKey && cfg.apiKey !== 'nexus-fce-2026-changeme') {
            NX_AI.apiKey = cfg.apiKey;
          }
        }
        NX_AI._configLoaded = true;
        callback();
      })
      .catch(function() {
        /* Si falla el fetch del config, usar defaults — no bloquear */
        NX_AI._configLoaded = true;
        callback();
      });
  }

  /* ── DOMAIN DETECTOR (multi-strategy) ─────────────────────────── */
  var _KNOWN_SUBJECTS = ['Sociales', 'Contabilidad', 'Administración', 'Propedéutica'];

  function _detectDomain() {
    /* Helper: extract materia from CNE banner with whitelist validation.
       Banner renders "<materia> · <agrupador>". We split by "·" and validate
       each token against the known-subjects list so a format change cannot
       inject garbage into the context. */
    function _fromCneBanner() {
      var cneInfo = document.querySelector('#cne-exit-bar .cne-exit-info');
      if (!cneInfo || !cneInfo.textContent) return null;
      var parts = cneInfo.textContent.split('·');
      for (var i = 0; i < parts.length; i++) {
        var token = parts[i].trim();
        if (_KNOWN_SUBJECTS.indexOf(token) !== -1) return token;
      }
      return null;
    }

    /* PRIORITY OVERRIDE: in training mode, the CNE banner is the
       authoritative source of truth. Sidebar markers and active pages may
       be stale after navigating between subjects inside training mode. */
    if (document.body.classList.contains('training-mode')) {
      var fromBanner = _fromCneBanner();
      if (fromBanner) return fromBanner;
    }

    /* Strategy 1: explicit marker on sidebar / active element */
    var el = document.querySelector('[data-materia].active, .active[data-materia]');
    if (el) {
      var m = el.getAttribute('data-materia');
      if (m) return m;
    }
    /* Strategy 2: prefix of active page id (works inside sub-subject views) */
    var page = document.querySelector('.page.active');
    if (page && page.id) {
      var id = page.id;
      if (id.indexOf('prop') === 0) return 'Propedéutica';
      if (id.indexOf('cont') === 0) return 'Contabilidad';
      if (id.indexOf('adm')  === 0) return 'Administración';
      if (id.indexOf('soc')  === 0) return 'Sociales';
    }
    /* Strategy 3: CNE banner fallback (even outside training mode) */
    var fromBannerFallback = _fromCneBanner();
    if (fromBannerFallback) return fromBannerFallback;
    /* Strategy 4: global state fallback */
    if (typeof NEXUS_STATE !== 'undefined' && NEXUS_STATE.materiaActiva) {
      return NEXUS_STATE.materiaActiva;
    }
    return null;
  }

  /* ── SCHEDULE LOADER (lazy, one-shot) ─────────────────────────── */
  var _SCHEDULE_CACHE = null;
  var _SCHEDULE_LOADING = null;

  function _loadSchedule() {
    if (_SCHEDULE_CACHE) return Promise.resolve(_SCHEDULE_CACHE);
    if (_SCHEDULE_LOADING) return _SCHEDULE_LOADING;
    _SCHEDULE_LOADING = fetch('./horarios.json', { cache: 'no-store' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        _SCHEDULE_CACHE = data || { horarios: [] };
        return _SCHEDULE_CACHE;
      })
      .catch(function() {
        _SCHEDULE_CACHE = { horarios: [] };
        return _SCHEDULE_CACHE;
      });
    return _SCHEDULE_LOADING;
  }

  /* Returns classes for a given day offset from today (0=today, 1=tomorrow),
     chronological by start time. Empty array if schedule unavailable.
     Safe to call synchronously: reads from cache. */
  function _getClassesForDayOffset(offset) {
    if (!_SCHEDULE_CACHE || !_SCHEDULE_CACHE.horarios) return [];
    var dayNames = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    var target = new Date();
    target.setHours(0, 0, 0, 0);                 /* normalize — avoids DST edge cases */
    target.setDate(target.getDate() + (offset || 0));
    var targetDay = dayNames[target.getDay()];
    var out = [];
    var horarios = _SCHEDULE_CACHE.horarios;
    for (var i = 0; i < horarios.length; i++) {
      var subj = horarios[i];
      var clases = subj.clases || [];
      for (var j = 0; j < clases.length; j++) {
        if ((clases[j].dia || '').toLowerCase().trim() === targetDay) {
          out.push({
            materia: subj.materia,
            desde:   clases[j].desde,
            hasta:   clases[j].hasta,
            aula:    clases[j].aula
          });
        }
      }
    }
    out.sort(function(a, b) {
      return (a.desde || '').localeCompare(b.desde || '');
    });
    return out;
  }

  /* Convenience wrappers — keep backward compatibility + intent-first naming. */
  function _getTodayClasses()    { return _getClassesForDayOffset(0); }
  function _getTomorrowClasses() { return _getClassesForDayOffset(1); }

  /* ── NEXT CLASS (PATCH 10.4) ──────────────────────────────────────
     Pre-computes the next upcoming class (today if any class is still
     upcoming, else tomorrow's first class). JS does the time arithmetic
     so the LLM never has to compare HH:MM values. */
  function _getNextClass() {
    var today    = _getTodayClasses();
    var tomorrow = _getTomorrowClasses();
    var now      = new Date();

    function toMinutes(hhmm) {
      var parts = (hhmm || '00:00').split(':');
      return (+parts[0] * 60) + (+parts[1]);
    }

    var nowMin = now.getHours() * 60 + now.getMinutes();

    /* Next class today (already chronologically sorted) */
    for (var i = 0; i < today.length; i++) {
      if (toMinutes(today[i].desde) >= nowMin) {
        return { when: 'hoy', class: today[i] };
      }
    }

    /* Fallback: tomorrow's first class */
    if (tomorrow.length) {
      return { when: 'mañana', class: tomorrow[0] };
    }

    return null;
  }

  /* ── SCHEDULE BLOCK (PATCH 10.3) ──────────────────────────────────
     Pre-formatted natural-language schedule. Small LLMs parse this more
     reliably than JSON arrays with semantically similar keys.
     Authoritative source for "today / tomorrow" questions. */
  function _buildScheduleBlock() {
    var today    = _getTodayClasses();
    var tomorrow = _getTomorrowClasses();
    var next     = _getNextClass();
    var dayNames = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    var now          = new Date();
    var todayName    = dayNames[now.getDay()];
    var tomorrowName = dayNames[(now.getDay() + 1) % 7];

    function fmt(list) {
      if (!list || !list.length) return '  (sin clases programadas)';
      return list.map(function(c) {
        return '  • ' + c.materia + ': ' + c.desde + '-' + c.hasta +
               ' (' + (c.aula || 's/aula') + ')';
      }).join('\n');
    }

    function fmtNext(n) {
      if (!n) return '  (sin clases próximas)';
      return '  • ' + n.class.materia + ' ' + n.when + ' a las ' + n.class.desde +
             ' (' + (n.class.aula || 's/aula') + ')';
    }

    return '\n=== USER SCHEDULE (AUTHORITATIVE) ===\n'
         + 'HOY (' + todayName + '):\n' + fmt(today) + '\n\n'
         + 'MAÑANA (' + tomorrowName + '):\n' + fmt(tomorrow) + '\n\n'
         + 'PRÓXIMA CLASE:\n' + fmtNext(next) + '\n'
         + '=== END SCHEDULE ===\n';
  }

  /* ── AVAILABLE MATERIALS FOR CONTEXT ──────────────────────────── */
  function getRelevantMaterials() {
    try {
      if (typeof NexusCore === 'undefined') return [];
      if (typeof NexusCore.getMateriales !== 'function') return [];

      var mats = NexusCore.getMateriales() || [];
      var domain = _detectDomain();

      var filtered = mats;
      if (domain) {
        filtered = mats.filter(function(m) {
          return m.materia === domain;
        });
      }

      /* sort by pedagogical order so materials[0] is the "next" item */
      filtered = filtered.slice().sort(function(a, b) {
        var oa = (typeof a.orden === 'number') ? a.orden : 9999;
        var ob = (typeof b.orden === 'number') ? b.orden : 9999;
        return oa - ob;
      });

      /* return only minimal safe data */
      return filtered.slice(0, 5).map(function(m) {
        return {
          id:     m.id,
          titulo: m.titulo,
          tema:   m.agrupador,
          clase:  m.clase || null,
          orden:  m.orden
        };
      });
    } catch (e) {
      return [];
    }
  }

  /* ── NEXUSCORE CONTEXT BUILDER ───────────────────────────────── */
  function buildAIContext() {
    if (typeof NexusCore === 'undefined') return {};
    try {
      var profile = NexusCore.get('userProfile') || {};
      var topics  = profile.topics || {};

      /* weakTopics: temas con ≥2 intentos y accuracy < 0.6, peor primero */
      var weak = Object.keys(topics)
        .filter(function(n) {
          var t = topics[n];
          return (t.correct + t.incorrect) >= 2 && t.accuracy < 0.6;
        })
        .sort(function(a, b) { return topics[a].accuracy - topics[b].accuracy; })
        .slice(0, 5)
        .map(function(n) {
          return { topic: n, accuracy: +topics[n].accuracy.toFixed(2) };
        });

      /* domain: detectado via multi-strategy helper */
      var domain = _detectDomain();

      /* lastAnswer: serializar como JSON si es objeto, cap 200 */
      var la = NexusCore.get('lastAnswer');
      var lastAnswer = la ? JSON.stringify(la).slice(0, 200) : '';

      /* fecha actual para que la IA pueda razonar "hoy" */
      var now = new Date();
      var dayNames = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

      return {
        currentDate:     now.toISOString().slice(0, 10),
        dayOfWeek:       dayNames[now.getDay()],
        todayClasses:    _getTodayClasses(),
        tomorrowClasses: _getTomorrowClasses(),
        domain:          domain,
        weakTopics:      weak,
        performance:     profile.stats || null,
        lastAnswer:      lastAnswer,
        recommendations: (NexusCore.get('recommendations') || []).slice(0, 3),
        materials:       getRelevantMaterials()
      };
    } catch (e) {
      return {};
    }
  }

  /* ── STATE ───────────────────────────────────────────────────── */
  var state = {
    isOpen:      false,
    isThinking:  false,
    messages:    [],     // { role: 'user'|'assistant', content: string }
    abortCtrl:   null,
    isOnline:    true
  };

  /* ── INJECT CSS ──────────────────────────────────────────────── */
  var CSS = /* css */ `
  /* ═══ NEXUS AI Widget ═══ */

  #nxai-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 10000;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background: linear-gradient(135deg, #58a6ff 0%, #a78bfa 100%);
    box-shadow: 0 4px 20px rgba(88,166,255,0.35), 0 0 0 0 rgba(88,166,255,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease;
    -webkit-tap-highlight-color: transparent;
  }
  #nxai-fab:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 28px rgba(88,166,255,0.45), 0 0 0 0 rgba(88,166,255,0.4);
  }
  #nxai-fab:active { transform: scale(0.95); }
  #nxai-fab.pulse {
    animation: nxai-pulse 2s infinite;
  }
  @keyframes nxai-pulse {
    0%   { box-shadow: 0 4px 20px rgba(88,166,255,0.35), 0 0 0 0 rgba(88,166,255,0.4); }
    70%  { box-shadow: 0 4px 20px rgba(88,166,255,0.35), 0 0 0 12px rgba(88,166,255,0); }
    100% { box-shadow: 0 4px 20px rgba(88,166,255,0.35), 0 0 0 0 rgba(88,166,255,0); }
  }

  #nxai-fab svg {
    width: 26px; height: 26px;
    fill: none; stroke: #fff; stroke-width: 2;
    stroke-linecap: round; stroke-linejoin: round;
  }

  /* ─── Panel ─── */
  #nxai-panel {
    position: fixed;
    bottom: 92px;
    right: 24px;
    z-index: 10001;
    width: 380px;
    max-height: 520px;
    background: #1c1c1e;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0;
    transform: translateY(16px) scale(0.95);
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s cubic-bezier(.34,1.56,.64,1);
  }
  #nxai-panel.open {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  /* ─── Header ─── */
  .nxai-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }
  .nxai-header-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    background: #34d399;
    flex-shrink: 0;
    position: relative;
  }
  .nxai-header-dot.offline { background: #ef4444; }
  .nxai-header-dot.thinking {
    background: #f59e0b;
    animation: nxai-blink 1s infinite;
  }
  @keyframes nxai-blink {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.3; }
  }
  .nxai-header-info {
    flex: 1;
    min-width: 0;
  }
  .nxai-header-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 15px;
    letter-spacing: 1.2px;
    color: #e5e5e5;
  }
  .nxai-header-sub {
    font-size: 11px;
    color: rgba(255,255,255,0.35);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .nxai-header-close {
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: background 0.15s, color 0.15s;
    display: flex;
  }
  .nxai-header-close:hover {
    background: rgba(255,255,255,0.08);
    color: #fff;
  }

  /* ─── Messages ─── */
  .nxai-messages {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scroll-behavior: smooth;
    min-height: 0;
  }
  .nxai-messages::-webkit-scrollbar { width: 4px; }
  .nxai-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  .nxai-msg {
    max-width: 88%;
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 13.5px;
    line-height: 1.55;
    color: #e5e5e5;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .nxai-msg.user {
    align-self: flex-end;
    background: linear-gradient(135deg, #58a6ff 0%, #4f8fde 100%);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .nxai-msg.assistant {
    align-self: flex-start;
    background: rgba(255,255,255,0.06);
    border-bottom-left-radius: 4px;
  }
  .nxai-msg.assistant strong { color: #58a6ff; }
  .nxai-msg.assistant code {
    background: rgba(0,0,0,0.3);
    padding: 1px 5px;
    border-radius: 4px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
  }
  .nxai-msg.assistant pre {
    background: rgba(0,0,0,0.3);
    padding: 8px 10px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 6px 0;
    font-size: 12px;
  }
  .nxai-msg.assistant pre code {
    background: none;
    padding: 0;
  }
  .nxai-msg.error {
    align-self: center;
    background: rgba(239,68,68,0.12);
    color: #f87171;
    font-size: 12px;
    text-align: center;
    max-width: 95%;
  }

  /* Thinking dots */
  .nxai-thinking {
    align-self: flex-start;
    display: flex;
    gap: 4px;
    padding: 12px 18px;
    background: rgba(255,255,255,0.06);
    border-radius: 14px;
    border-bottom-left-radius: 4px;
  }
  .nxai-thinking span {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    animation: nxai-dot-bounce 1.4s infinite ease-in-out;
  }
  .nxai-thinking span:nth-child(2) { animation-delay: 0.16s; }
  .nxai-thinking span:nth-child(3) { animation-delay: 0.32s; }
  @keyframes nxai-dot-bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40%           { transform: scale(1);   opacity: 1; }
  }

  /* ─── Input area ─── */
  .nxai-input-area {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 10px 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.02);
    flex-shrink: 0;
  }
  .nxai-input-area textarea {
    flex: 1;
    resize: none;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #e5e5e5;
    border-radius: 10px;
    padding: 9px 12px;
    font-size: 13.5px;
    font-family: inherit;
    line-height: 1.4;
    max-height: 100px;
    min-height: 38px;
    outline: none;
    transition: border-color 0.2s;
  }
  .nxai-input-area textarea:focus {
    border-color: rgba(88,166,255,0.4);
  }
  .nxai-input-area textarea::placeholder {
    color: rgba(255,255,255,0.25);
  }
  .nxai-send-btn {
    width: 38px; height: 38px;
    border-radius: 10px;
    border: none;
    background: #58a6ff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, transform 0.1s;
    flex-shrink: 0;
  }
  .nxai-send-btn:hover { background: #4f8fde; }
  .nxai-send-btn:active { transform: scale(0.92); }
  .nxai-send-btn:disabled { opacity: 0.4; cursor: default; }
  .nxai-send-btn svg {
    width: 18px; height: 18px;
    fill: none; stroke: #fff; stroke-width: 2.2;
    stroke-linecap: round; stroke-linejoin: round;
  }

  /* ─── Context chip ─── */
  .nxai-ctx-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    margin: 0 14px;
    background: rgba(88,166,255,0.08);
    border: 1px solid rgba(88,166,255,0.15);
    border-radius: 8px;
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    flex-shrink: 0;
  }
  .nxai-ctx-chip .nxai-ctx-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .nxai-ctx-chip .nxai-ctx-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  /* ─── Welcome ─── */
  .nxai-welcome {
    text-align: center;
    padding: 28px 20px;
    color: rgba(255,255,255,0.35);
    font-size: 13px;
    line-height: 1.6;
  }
  .nxai-welcome-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }
  .nxai-welcome strong {
    color: #58a6ff;
    font-weight: 600;
  }
  .nxai-quick-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-top: 12px;
  }
  .nxai-quick-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.6);
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .nxai-quick-btn:hover {
    background: rgba(88,166,255,0.1);
    border-color: rgba(88,166,255,0.25);
    color: #58a6ff;
  }

  /* ─── Stats bar ─── */
  .nxai-stats {
    font-size: 10px;
    color: rgba(255,255,255,0.2);
    text-align: right;
    padding: 2px 14px 6px;
    flex-shrink: 0;
  }

  /* ─── Mobile ─── */
  @media (max-width: 500px) {
    #nxai-panel {
      bottom: 0;
      right: 0;
      left: 0;
      width: 100%;
      max-height: 85vh;
      border-radius: 16px 16px 0 0;
      transform: translateY(100%);
    }
    #nxai-panel.open {
      transform: translateY(0);
    }
    #nxai-fab {
      bottom: 16px;
      right: 16px;
      width: 50px;
      height: 50px;
    }
  }
  `;

  /* ── INJECT STYLES ─────────────────────────────────────────────── */
  function injectStyles() {
    var style = document.createElement('style');
    style.id = 'nxai-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* ── BUILD DOM ─────────────────────────────────────────────────── */
  function buildUI() {
    /* FAB Button */
    var fab = document.createElement('button');
    fab.id = 'nxai-fab';
    fab.className = 'pulse';
    fab.setAttribute('aria-label', 'Abrir NEXUS Co-Worker');
    fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 3.5 2.5 6.4 6 6.9V22l3-3 3 3v-6.1c3.5-.5 6-3.4 6-6.9a7 7 0 0 0-7-7z"/><circle cx="9.5" cy="9.5" r="1"/><circle cx="14.5" cy="9.5" r="1"/></svg>';
    fab.onclick = togglePanel;
    document.body.appendChild(fab);

    /* Panel */
    var panel = document.createElement('div');
    panel.id = 'nxai-panel';
    panel.innerHTML = [
      '<div class="nxai-header">',
      '  <div class="nxai-header-dot" id="nxai-status-dot"></div>',
      '  <div class="nxai-header-info">',
      '    <div class="nxai-header-title">NEXUS CO-WORKER</div>',
      '    <div class="nxai-header-sub" id="nxai-header-sub">llama3.2 · GPU local</div>',
      '  </div>',
      '  <button class="nxai-header-close" onclick="window._nxaiToggle()" aria-label="Cerrar">',
      '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
      '  </button>',
      '</div>',
      '<div class="nxai-ctx-chip" id="nxai-ctx-chip" style="display:none;">',
      '  <span class="nxai-ctx-dot" id="nxai-ctx-dot"></span>',
      '  <span class="nxai-ctx-label" id="nxai-ctx-label"></span>',
      '</div>',
      '<div class="nxai-messages" id="nxai-messages"></div>',
      '<div class="nxai-stats" id="nxai-stats"></div>',
      '<div class="nxai-input-area">',
      '  <textarea id="nxai-input" rows="1" placeholder="Preguntale a NEXUS..." maxlength="' + NX_AI.maxInputChars + '"></textarea>',
      '  <button class="nxai-send-btn" id="nxai-send" aria-label="Enviar">',
      '    <svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>',
      '  </button>',
      '</div>'
    ].join('\n');
    document.body.appendChild(panel);

    /* Event listeners */
    var input = document.getElementById('nxai-input');
    var sendBtn = document.getElementById('nxai-send');

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    /* Auto-grow textarea */
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });

    sendBtn.addEventListener('click', sendMessage);

    /* Render welcome screen */
    renderWelcome();
  }

  /* ── TOGGLE PANEL ──────────────────────────────────────────────── */
  function togglePanel() {
    state.isOpen = !state.isOpen;
    var panel = document.getElementById('nxai-panel');
    var fab   = document.getElementById('nxai-fab');

    if (state.isOpen) {
      panel.classList.add('open');
      fab.classList.remove('pulse');
      updateContextChip();
      /* Focus input after animation */
      setTimeout(function() {
        var input = document.getElementById('nxai-input');
        if (input && window.innerWidth > 500) input.focus();
      }, 300);
    } else {
      panel.classList.remove('open');
    }
  }
  window._nxaiToggle = togglePanel;

  /* ── CONTEXT EXTRACTION ──────────────────────────────────────── */
  function getContext() {
    var ctx = {
      materia:         null,
      materialTitle:   null,
      materialExcerpt: null,
      isTP:            false,
      isExercise:      false,
      mode:            null
    };

    try {
      /* Obtener materia activa del sidebar */
      var activeItem = document.querySelector('#sb .active, .mat-card.active, [data-materia].active');
      if (activeItem) {
        var mat = activeItem.getAttribute('data-materia');
        if (mat) ctx.materia = mat;
      }

      /* Fallback: buscar en NEXUS_STATE */
      if (!ctx.materia && typeof NEXUS_STATE !== 'undefined') {
        if (NEXUS_STATE.materiaActiva) ctx.materia = NEXUS_STATE.materiaActiva;
      }

      /* Título del material actual */
      var titleEl = document.querySelector('#content-area h2, #content-area h3, .mat-card.active .mc-header');
      if (titleEl) {
        ctx.materialTitle = titleEl.textContent.trim().substring(0, 200);
      }

      /* Detectar si es TP/ejercicio */
      var contentArea = document.getElementById('content-area');
      if (contentArea) {
        var html = contentArea.innerHTML || '';
        ctx.isTP = /tp-wrap|actividad|ejercicio/i.test(html.substring(0, 5000));
        ctx.isExercise = /quiz-container|respuesta|opci[oó]n/i.test(html.substring(0, 5000));
      }

      /* Extracto del contenido visible (para contexto semántico) */
      if (contentArea) {
        var textContent = contentArea.innerText || '';
        ctx.materialExcerpt = textContent.substring(0, 1500);
      }

      /* Determinar modo automáticamente */
      if (ctx.isTP || ctx.isExercise) {
        ctx.mode = 'socratico';
      }
      /* Los modos directo/pedagogico se determinan por materia en el proxy */

    } catch (err) {
      console.warn('[NXAI] Error extrayendo contexto:', err);
    }

    return ctx;
  }

  /* ── UPDATE CONTEXT CHIP ───────────────────────────────────────── */
  var MATERIA_COLORS = {
    contabilidad: '#58a6ff', administracion: '#3b82f6',
    sociales: '#a78bfa', propedeutica: '#f59e0b'
  };
  var MATERIA_NAMES = {
    contabilidad: 'Contabilidad', administracion: 'Administración',
    sociales: 'Cs. Sociales', propedeutica: 'Propedéutica'
  };

  function updateContextChip() {
    var ctx  = getContext();
    var chip = document.getElementById('nxai-ctx-chip');
    var dot  = document.getElementById('nxai-ctx-dot');
    var lbl  = document.getElementById('nxai-ctx-label');

    if (ctx.materia || ctx.materialTitle) {
      chip.style.display = 'flex';
      var color = MATERIA_COLORS[ctx.materia] || '#888';
      dot.style.background = color;

      var label = '';
      if (ctx.materia) label = MATERIA_NAMES[ctx.materia] || ctx.materia;
      if (ctx.materialTitle) label += (label ? ' · ' : '') + ctx.materialTitle;
      if (ctx.isTP) label += ' (TP)';
      lbl.textContent = label;
    } else {
      chip.style.display = 'none';
    }
  }

  /* ── RENDER FUNCTIONS ──────────────────────────────────────────── */

  function renderWelcome() {
    var msgs = document.getElementById('nxai-messages');
    msgs.innerHTML = [
      '<div class="nxai-welcome">',
      '  <div class="nxai-welcome-icon">🧠</div>',
      '  <strong>NEXUS Co-Worker</strong><br>',
      '  Tu asistente de estudio con IA.<br>',
      '  Preguntame sobre cualquier tema<br>de la materia que estés viendo.',
      '  <div class="nxai-quick-btns">',
      '    <button class="nxai-quick-btn" data-q="Explicame este tema de forma simple">Explicar tema</button>',
      '    <button class="nxai-quick-btn" data-q="Dame un ejemplo práctico de esto">Ejemplo práctico</button>',
      '    <button class="nxai-quick-btn" data-q="¿Cuáles son los puntos clave?">Puntos clave</button>',
      '    <button class="nxai-quick-btn" data-q="No entiendo, ¿podés explicar más fácil?">Más fácil</button>',
      '  </div>',
      '</div>'
    ].join('\n');

    /* Quick button handlers */
    var btns = msgs.querySelectorAll('.nxai-quick-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        var q = this.getAttribute('data-q');
        document.getElementById('nxai-input').value = q;
        sendMessage();
      });
    }
  }

  function addMessageBubble(role, content) {
    var msgs = document.getElementById('nxai-messages');

    /* Remove welcome if present */
    var welcome = msgs.querySelector('.nxai-welcome');
    if (welcome) welcome.remove();

    var bubble = document.createElement('div');
    bubble.className = 'nxai-msg ' + role;
    bubble.innerHTML = role === 'assistant' ? renderMarkdown(content) : escHtml(content);
    msgs.appendChild(bubble);
    msgs.scrollTop = msgs.scrollHeight;
    return bubble;
  }

  function showThinking() {
    var msgs = document.getElementById('nxai-messages');
    var el = document.createElement('div');
    el.className = 'nxai-thinking';
    el.id = 'nxai-thinking';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideThinking() {
    var el = document.getElementById('nxai-thinking');
    if (el) el.remove();
  }

  function updateStatus(status) {
    var dot = document.getElementById('nxai-status-dot');
    var sub = document.getElementById('nxai-header-sub');
    dot.className = 'nxai-header-dot';

    if (status === 'thinking') {
      dot.classList.add('thinking');
      sub.textContent = 'Pensando...';
    } else if (status === 'offline') {
      dot.classList.add('offline');
      sub.textContent = 'Sin conexión al servidor';
    } else {
      sub.textContent = 'llama3.2 · GPU local';
    }
  }

  /* ── MARKDOWN MINI-RENDERER ────────────────────────────────────── */
  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderMarkdown(text) {
    var html = escHtml(text);

    /* Code blocks (```...```) */
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, function(_, lang, code) {
      return '<pre><code>' + code.trim() + '</code></pre>';
    });

    /* Inline code (`...`) */
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    /* Bold (**...**) */
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    /* Italic (*...*) */
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    /* Lists (- item) */
    html = html.replace(/^- (.+)$/gm, '• $1');

    /* Line breaks */
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  KB RUNTIME MATCHER · v19.28.0 (Hybrid Architecture — Fase 1)
   *  Principio: cache-first. Si hay match en schedule_kb.json → render
   *  determinista (sin LLM). Si MISS → fallback a Llama como antes.
   *  Zero hallucination para horarios. Bug PATCH 10.4 resuelto.
   * ═══════════════════════════════════════════════════════════════════ */

  var KB_STATE = {
    loaded: false,
    loading: null,
    schedule: null,
    enabled: true   /* feature flag para rollback rápido */
  };

  function _loadKB() {
    if (KB_STATE.loaded) return Promise.resolve(KB_STATE.schedule);
    if (KB_STATE.loading) return KB_STATE.loading;

    KB_STATE.loading = fetch('./kb/schedule_kb.json', { cache: 'no-cache' })
      .then(function(r) { return r && r.ok ? r.json() : null; })
      .then(function(kb) {
        KB_STATE.schedule = kb;
        KB_STATE.loaded = true;
        if (kb && kb.entries) {
          console.info('[NexusAI KB] schedule loaded:', kb.entries.length, 'entries · version', kb.version);
        } else {
          console.warn('[NexusAI KB] schedule not found — runtime will fall back to LLM');
        }
        return kb;
      })
      .catch(function(err) {
        console.warn('[NexusAI KB] load failed:', err);
        KB_STATE.loaded = true;
        return null;
      });
    return KB_STATE.loading;
  }

  function _normalizeQuery(q) {
    return (q || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿?¡!.,;:]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* Levenshtein edit distance (iterativo, memoria O(b)) */
  function _levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var prev = new Array(b.length + 1);
    for (var k = 0; k <= b.length; k++) prev[k] = k;
    for (var i = 1; i <= a.length; i++) {
      var curr = [i];
      for (var j = 1; j <= b.length; j++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      prev = curr;
    }
    return prev[b.length];
  }

  /* Score 0-1: combinación de contención + Levenshtein normalizado */
  function _similarity(q, pattern) {
    var nq = _normalizeQuery(q);
    var np = _normalizeQuery(pattern);
    if (!nq || !np) return 0;
    if (nq === np) return 1.0;
    /* Query contiene el pattern como substring (ej: "sí clases hoy por favor" ⊇ "clases hoy") */
    if (np.length >= 4 && nq.indexOf(np) >= 0) return 0.95;
    /* Pattern contiene la query */
    if (nq.length >= 4 && np.indexOf(nq) >= 0) return 0.88;
    /* Levenshtein normalizado */
    var maxLen = Math.max(nq.length, np.length);
    var dist = _levenshtein(nq, np);
    return 1 - (dist / maxLen);
  }

  function _matchKBEntry(userQuery, kb) {
    if (!kb || !kb.entries) return null;
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < kb.entries.length; i++) {
      var entry = kb.entries[i];
      var threshold = entry.confidence_threshold || 0.75;
      var patterns = entry.patterns || [];
      for (var j = 0; j < patterns.length; j++) {
        var score = _similarity(userQuery, patterns[j]);
        if (score > bestScore && score >= threshold) {
          bestScore = score;
          best = { entry: entry, score: score, matchedPattern: patterns[j] };
        }
      }
    }
    return best;
  }

  /* Formatea lista de clases en Markdown limpio */
  function _formatClassList(classes) {
    if (!classes || !classes.length) return '';
    var out = [];
    for (var i = 0; i < classes.length; i++) {
      var c = classes[i];
      out.push('  • **' + c.materia + '** ' + c.desde + '–' + c.hasta +
               ' (' + (c.aula || 's/aula') + ')');
    }
    return out.join('\n');
  }

  var DAY_NAMES_ES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

  function _renderScheduleAnswer(match) {
    var entry = match.entry;
    var t = entry.type;
    var now = new Date();

    if (t === 'schedule_today') {
      var classes = _getTodayClasses();
      var dayName = DAY_NAMES_ES[now.getDay()];
      if (!classes.length) {
        return (entry.empty_fallback || 'Hoy ({{dayName}}) no tenés clases.')
                 .replace('{{dayName}}', dayName);
      }
      var sPlural = classes.length === 1 ? '' : 's';
      return 'Hoy (' + dayName + ') tenés ' + classes.length + ' clase' + sPlural + ':\n' +
             _formatClassList(classes);
    }

    if (t === 'schedule_tomorrow') {
      var tClasses = _getTomorrowClasses();
      var tDayName = DAY_NAMES_ES[(now.getDay() + 1) % 7];
      if (!tClasses.length) {
        return (entry.empty_fallback || 'Mañana ({{dayName}}) no tenés clases.')
                 .replace('{{dayName}}', tDayName);
      }
      var tPlural = tClasses.length === 1 ? '' : 's';
      return 'Mañana (' + tDayName + ') tenés ' + tClasses.length + ' clase' + tPlural + ':\n' +
             _formatClassList(tClasses);
    }

    if (t === 'schedule_next') {
      var next = _getNextClass();
      if (!next) return entry.empty_fallback || 'No encontré clases próximas en tu agenda.';
      return 'Tu próxima clase es **' + next['class'].materia + '** ' + next.when +
             ' a las ' + next['class'].desde + ' hs en ' +
             (next['class'].aula || 's/aula') + '.';
    }

    if (t === 'schedule_materia' || t === 'schedule_week') {
      return entry.answer_full || null;
    }

    return null;
  }

  /* Entry point: ¿hay match en KB? Si sí, devuelve la respuesta. */
  function _tryKBMatch(userQuery) {
    if (!KB_STATE.enabled)     return null;
    if (!KB_STATE.loaded)      return null;  /* aún cargando, cae a LLM */
    if (!KB_STATE.schedule)    return null;

    var match = _matchKBEntry(userQuery, KB_STATE.schedule);
    if (!match) return null;

    var answer = _renderScheduleAnswer(match);
    if (!answer) return null;

    console.info('[NexusAI KB] HIT', {
      entry_id: match.entry.id,
      score: match.score.toFixed(3),
      pattern: match.matchedPattern
    });

    return { hit: true, answer: answer, match: match };
  }

  /* ── SEND MESSAGE ──────────────────────────────────────────────── */
  function sendMessage() {
    var input = document.getElementById('nxai-input');
    var text = (input.value || '').trim();
    if (!text || state.isThinking) return;

    /* Clear input */
    input.value = '';
    input.style.height = 'auto';

    /* Add user message */
    state.messages.push({ role: 'user', content: text });
    addMessageBubble('user', text);

    /* Trim history to limit */
    while (state.messages.length > NX_AI.maxHistory) {
      state.messages.shift();
    }

    /* ═══ KB MATCH FIRST (cache-first architecture v19.28.0) ═══
     * Si la pregunta matchea alguna entry del schedule KB →
     * respondemos con datos determinísticos (sin LLM).
     * Esto elimina alucinación en horarios y reduce latencia a <10ms.
     */
    var kbResult = _tryKBMatch(text);
    if (kbResult) {
      state.messages.push({ role: 'assistant', content: kbResult.answer });
      addMessageBubble('assistant', kbResult.answer);
      /* Stats chip opcional (indica match determinista) */
      var statsEl = document.getElementById('nxai-stats');
      if (statsEl) {
        statsEl.textContent = 'KB · ' + kbResult.match.entry.id +
                              ' · score ' + kbResult.match.score.toFixed(2);
      }
      updateStatus('idle');
      return;  /* NO llamamos al LLM */
    }
    /* ════════════════════════════════════════════════════════════ */

    /* Update UI state */
    state.isThinking = true;
    updateStatus('thinking');
    showThinking();
    document.getElementById('nxai-send').disabled = true;

    /* Get context */
    var ctx = getContext();
    updateContextChip();

    /* Stream from proxy */
    streamChat(state.messages, ctx);
  }

  /* ── STREAM CHAT (SSE via fetch) ────────────────────────────────── */
  function streamChat(messages, context) {
    /* Abort previous if running */
    if (state.abortCtrl) {
      try { state.abortCtrl.abort(); } catch(e) {}
    }
    state.abortCtrl = new AbortController();

    var url = NX_AI.proxyUrl + '/api/chat';
    var nexusCtx = buildAIContext();
    var scheduleBlock = _buildScheduleBlock();
    var systemMsg = {
      role: 'system',
      content: 'You are NEXUS Co-Worker inside a live educational platform.\n'
             + 'You have access to:\n'
             + '- user performance\n'
             + '- weak topics\n'
             + '- recommendations\n'
             + '- available study materials (with id, titulo, tema, clase, orden)\n'
             + '- current date (context.currentDate) and day of week (context.dayOfWeek)\n'
             + '- today\'s class schedule (context.todayClasses: [{materia, desde, hasta, aula}])\n'
             + '- tomorrow\'s class schedule (context.tomorrowClasses: same shape as todayClasses)\n'
             + 'RULES:\n'
             + '- ALWAYS use real data if available\n'
             + '- NEVER answer generically if context exists\n'
             + '- NEVER invent schedules\n'
             + '- Prefer explicit data over assumptions\n'
             + '- If user asks what to study, use materials + performance\n'
             + '- If materials exist, suggest the most relevant or next item\n'
             + '- Use context.currentDate / context.dayOfWeek when the user says "today", "this class", etc.\n'
             + '- Each material has a "clase" field (e.g. "Clase 1 · Semana 1"); use it to orient temporally\n'
             + '- If the user asks about "today", prioritize the first or lowest-order material available.\n'
             + '- NEVER invent dates or map "clase" to specific calendar dates without explicit information\n'
             + '- Format times as HH:MM and always include the aula when available.\n'
             + '- Schedules may not reflect cancellations or changes. If uncertain, suggest confirming with the institution.\n\n'
             + 'SCHEDULE BLOCK (AUTHORITATIVE):\n'
             + 'The block below is the SINGLE SOURCE OF TRUTH for the user schedule.\n'
             + 'Use it for questions about "today", "tomorrow", or "next class".\n'
             + 'Do NOT infer schedule from JSON arrays if this block is present.\n'
             + 'For "next class" or "próxima clase", ALWAYS use the "PRÓXIMA CLASE" section.\n'
             + scheduleBlock + '\n'
             + 'Context JSON:\n' + JSON.stringify(nexusCtx)
    };
    var body = JSON.stringify({
      messages: [systemMsg].concat(messages),
      context: context
    });

    var assistantBubble = null;
    var fullResponse = '';
    var lastStats = null;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + NX_AI.apiKey
      },
      body: body,
      signal: state.abortCtrl.signal
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';

      function processStream() {
        return reader.read().then(function(result) {
          if (result.done) {
            finishResponse(fullResponse, lastStats);
            return;
          }

          buffer += decoder.decode(result.value, { stream: true });
          var lines = buffer.split('\n');
          buffer = lines.pop();

          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line.startsWith('data: ')) continue;
            var data = line.substring(6);

            if (data === '[DONE]') {
              finishResponse(fullResponse, lastStats);
              return;
            }

            try {
              var parsed = JSON.parse(data);

              if (parsed.error) {
                hideThinking();
                addMessageBubble('error', parsed.error);
                resetAfterResponse();
                return;
              }

              if (parsed.token) {
                /* First token → create bubble, remove thinking */
                if (!assistantBubble) {
                  hideThinking();
                  assistantBubble = addMessageBubble('assistant', '');
                }
                fullResponse += parsed.token;
                assistantBubble.innerHTML = renderMarkdown(fullResponse);
                /* Auto-scroll */
                var msgs = document.getElementById('nxai-messages');
                msgs.scrollTop = msgs.scrollHeight;
              }

              if (parsed.done && parsed.stats) {
                lastStats = parsed.stats;
              }
            } catch (e) {
              /* Ignore parse errors on partial data */
            }
          }

          return processStream();
        });
      }

      return processStream();
    })
    .catch(function(err) {
      hideThinking();
      if (err.name !== 'AbortError') {
        console.warn('AI fallback activated');
        var perf = null;
        if (typeof NexusCore !== 'undefined') {
          try { perf = NexusCore.get('performance'); } catch(e) {}
        }
        var lowPerf = perf && typeof perf.accuracy === 'number' && perf.accuracy < 0.6;
        var fallbackText = lowPerf
          ? 'Vamos a reforzar los temas donde estás teniendo más dificultad.'
          : 'Seguimos avanzando, buen progreso.';
        addMessageBubble('assistant', fallbackText);
        updateStatus('offline');
      }
      resetAfterResponse();
    });
  }

  function finishResponse(fullResponse, stats) {
    if (fullResponse) {
      state.messages.push({ role: 'assistant', content: fullResponse });
    }

    /* Show stats */
    if (stats) {
      var statsEl = document.getElementById('nxai-stats');
      var tps = stats.tokens_per_sec || 0;
      var elapsed = stats.elapsed_ms ? (stats.elapsed_ms / 1000).toFixed(1) : '?';
      statsEl.textContent = stats.tokens + ' tokens · ' + elapsed + 's · ' + tps + ' tok/s';
    }

    resetAfterResponse();
  }

  function resetAfterResponse() {
    state.isThinking = false;
    hideThinking();
    updateStatus('online');
    document.getElementById('nxai-send').disabled = false;
    state.abortCtrl = null;
  }

  /* ── HEALTH CHECK ──────────────────────────────────────────────── */
  function checkHealth() {
    fetch(NX_AI.proxyUrl + '/api/health')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        state.isOnline = data.status === 'ok';
        if (!state.isOnline) updateStatus('offline');
      })
      .catch(function() {
        state.isOnline = false;
        /* Don't show offline until user opens panel */
      });
  }

  /* ── INIT ──────────────────────────────────────────────────────── */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
      bootstrap();
    }
  }

  function bootstrap() {
    /* Cargar config remota antes de renderizar el widget */
    loadRemoteConfig(function() {
      injectStyles();
      buildUI();

      /* Initial health check (silent, 3s después de arrancar) */
      setTimeout(checkHealth, 3000);

      /* Periodic health check every 60s */
      setInterval(checkHealth, 60000);

      /* Preload schedule (async, non-blocking — cached for later queries) */
      _loadSchedule();

      /* Preload KB (schedule_kb.json) — habilita runtime matcher determinista */
      _loadKB();

      console.info('[NEXUS AI] Co-Worker v1.2.0 · Hybrid KB — proxy:', NX_AI.proxyUrl);
    });
  }

  /* ── SAFE LLM CALL (non-streaming wrapper) ──────────────────── */
  async function safeCallLLM(messages) {
    try {
      var nexusCtx = buildAIContext();
      var sys = {
        role: 'system',
        content: 'NEXUS context: ' + JSON.stringify(nexusCtx)
      };
      var resp = await fetch(NX_AI.proxyUrl + '/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + NX_AI.apiKey
        },
        body: JSON.stringify({ messages: [sys].concat(messages), stream: false })
      });
      if (!resp.ok) return null;
      var data = await resp.json().catch(function(){ return null; });
      return data;
    } catch (e) {
      console.warn('AI fallback activated');
      return null;
    }
  }

  /* ── PUBLIC API ────────────────────────────────────────────────── */
  window.NexusAI = {
    toggle: togglePanel,
    getContext: getContext,
    buildAIContext: buildAIContext,
    safeCallLLM: safeCallLLM,
    config: NX_AI,
    clearHistory: function() {
      state.messages = [];
      renderWelcome();
      document.getElementById('nxai-stats').textContent = '';
    },
    /* KB debugging (v19.28.0) */
    kb: {
      state: KB_STATE,
      tryMatch: _tryKBMatch,
      reload: function() {
        KB_STATE.loaded = false;
        KB_STATE.loading = null;
        KB_STATE.schedule = null;
        return _loadKB();
      },
      setEnabled: function(flag) { KB_STATE.enabled = !!flag; }
    }
  };

  init();

})();
