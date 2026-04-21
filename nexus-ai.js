/**
 * ═══════════════════════════════════════════════════════════════════
 *  NEXUS AI Co-Worker — v1.5.0
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
 *    - v1.4.0 → KB híbrido runtime (schedule + academic) como Plan A
 *    - v1.5.0 → Plan B UX: first-byte timeout, status-aware errors,
 *               botón reintentar, banner offline, countdown rate-limit
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

  /* ── NEXT CLASS (PATCH 10.4 · v19.28.1) ───────────────────────────
     Pre-computes the next upcoming class. JS does the time arithmetic
     so the LLM never has to compare HH:MM values.
     v19.28.1: extiende búsqueda hasta 7 días para evitar "null" cuando
     hoy ya pasó y mañana no tiene clases (caso viernes-tarde→sábado). */
  function _getNextClass() {
    var now = new Date();

    function toMinutes(hhmm) {
      var parts = (hhmm || '00:00').split(':');
      return (+parts[0] * 60) + (+parts[1]);
    }

    var nowMin = now.getHours() * 60 + now.getMinutes();
    var dayNames = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

    /* HOY: clases que todavía no arrancaron */
    var todayList = _getClassesForDayOffset(0);
    for (var i = 0; i < todayList.length; i++) {
      if (toMinutes(todayList[i].desde) >= nowMin) {
        return { when: 'hoy', class: todayList[i] };
      }
    }

    /* Buscar hacia adelante hasta 7 días (semana completa) */
    for (var offset = 1; offset <= 7; offset++) {
      var classes = _getClassesForDayOffset(offset);
      if (classes.length) {
        var dayIdx = (now.getDay() + offset) % 7;
        var whenDescr;
        if (offset === 1)      whenDescr = 'mañana';
        else if (offset === 7) whenDescr = 'el próximo ' + dayNames[dayIdx];
        else                   whenDescr = 'el ' + dayNames[dayIdx];
        return { when: whenDescr, class: classes[0] };
      }
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

  /* ── PLAN B CONSTANTS (v1.5.0) ───────────────────────────────── */
  /* Tiempo máximo que esperamos al PRIMER byte/frame del stream.
     Si Ollama no contestó en N segundos, lo consideramos colgado y
     abortamos con mensaje específico. El stream en sí no tiene
     timeout — una vez que empieza a generar tokens, puede durar. */
  var FIRST_BYTE_TIMEOUT_MS = 30000;
  /* Reason string que usamos al abortar por timeout propio (no por el
     usuario). Así distinguimos AbortError-user de AbortError-timeout. */
  var ABORT_REASON_TIMEOUT = 'nxai-first-byte-timeout';

  /* ── STATE ───────────────────────────────────────────────────── */
  var state = {
    isOpen:          false,
    isThinking:      false,
    messages:        [],     // { role: 'user'|'assistant', content: string }
    abortCtrl:       null,
    isOnline:        true,
    /* Plan B (v1.5.0) — resiliencia UX */
    firstByteTimer:  null,   // setTimeout id para el timeout de first-byte
    lastQuery:       null,   // texto última query (para retry)
    lastContext:     null,   // contexto de última query (para retry)
    rateLimitUntil:  0,      // timestamp hasta cuando el send está bloqueado
    rateLimitTimer:  null,   // setInterval para countdown visible
    bannerEl:        null,   // ref al banner offline (si existe)
    /* Health check debounce — evita falsos positivos del banner ante
       blips transitorios (primera carga de Ollama en GPU, latencia de red).
       Requerimos 2 fails consecutivos antes de marcar offline. */
    healthFailCount: 0
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
  /* ─── Structured error bubble (v1.5.0 Plan B) ─── */
  .nxai-msg.nxai-error-rich {
    align-self: stretch;
    max-width: 100%;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 10px;
    padding: 10px 12px;
    color: #fca5a5;
    font-size: 13px;
    text-align: left;
    line-height: 1.45;
  }
  .nxai-msg.nxai-error-rich.nxai-sev-warn {
    background: rgba(245,158,11,0.08);
    border-color: rgba(245,158,11,0.25);
    color: #fbbf24;
  }
  .nxai-msg.nxai-error-rich.nxai-sev-info {
    background: rgba(96,165,250,0.08);
    border-color: rgba(96,165,250,0.25);
    color: #93c5fd;
  }
  .nxai-msg.nxai-error-rich .nxai-error-title {
    font-weight: 600;
    display: block;
    margin-bottom: 4px;
    font-size: 12.5px;
  }
  .nxai-msg.nxai-error-rich .nxai-error-detail {
    display: block;
    opacity: 0.85;
    font-size: 12px;
  }
  .nxai-msg.nxai-error-rich .nxai-retry-btn {
    margin-top: 10px;
    padding: 6px 12px;
    font-size: 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    color: inherit;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease;
  }
  .nxai-msg.nxai-error-rich .nxai-retry-btn:hover {
    background: rgba(255,255,255,0.14);
  }
  .nxai-msg.nxai-error-rich .nxai-retry-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  /* ─── Offline banner (v1.5.0) ─── */
  .nxai-banner {
    padding: 8px 12px;
    margin: 8px 12px 0;
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.4;
    background: rgba(245,158,11,0.12);
    border: 1px solid rgba(245,158,11,0.25);
    color: #fbbf24;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .nxai-banner .nxai-banner-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #f59e0b;
    flex-shrink: 0;
    animation: nxai-banner-pulse 2s ease-in-out infinite;
  }
  @keyframes nxai-banner-pulse {
    0%, 100% { opacity: 0.5; }
    50%      { opacity: 1; }
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

  /* ── PLAN B: structured error bubble ─────────────────────────────
   * Reemplaza el `addMessageBubble('error', text)` genérico por un
   * bubble con título + detalle + (opcional) botón "Reintentar".
   * Diseñado para darle al alumno una explicación accionable en lugar
   * de un string opaco que lo desmotive.
   * ─────────────────────────────────────────────────────────────── */
  function addErrorBubble(title, detail, opts) {
    opts = opts || {};
    var msgs = document.getElementById('nxai-messages');
    if (!msgs) return null;

    /* Remove welcome if present */
    var welcome = msgs.querySelector('.nxai-welcome');
    if (welcome) welcome.remove();

    var bubble = document.createElement('div');
    bubble.className = 'nxai-msg nxai-error-rich';
    if (opts.severity === 'warn' || opts.severity === 'info') {
      bubble.classList.add('nxai-sev-' + opts.severity);
    }

    var titleEl = document.createElement('span');
    titleEl.className = 'nxai-error-title';
    titleEl.textContent = title;
    bubble.appendChild(titleEl);

    if (detail) {
      var detailEl = document.createElement('span');
      detailEl.className = 'nxai-error-detail';
      detailEl.textContent = detail;
      bubble.appendChild(detailEl);
    }

    if (opts.retry && typeof opts.retry === 'function') {
      var btn = document.createElement('button');
      btn.className = 'nxai-retry-btn';
      btn.type = 'button';
      btn.textContent = opts.retryLabel || 'Reintentar';
      btn.addEventListener('click', function() {
        btn.disabled = true;
        try { opts.retry(); } catch (e) { btn.disabled = false; }
      });
      bubble.appendChild(document.createElement('br'));
      bubble.appendChild(btn);
    }

    msgs.appendChild(bubble);
    msgs.scrollTop = msgs.scrollHeight;
    return bubble;
  }

  /* ── PLAN B: offline banner ───────────────────────────────────── */
  function showOfflineBanner() {
    if (state.bannerEl && document.body.contains(state.bannerEl)) return;
    var panel = document.getElementById('nxai-panel');
    if (!panel) return;
    var banner = document.createElement('div');
    banner.className = 'nxai-banner';
    banner.innerHTML = '<span class="nxai-banner-dot"></span>' +
      '<span>Asistente IA fuera de línea · podés consultar el temario y horarios igual</span>';
    /* Insertar banner arriba del contenedor de mensajes */
    var messagesEl = document.getElementById('nxai-messages');
    if (messagesEl && messagesEl.parentNode) {
      messagesEl.parentNode.insertBefore(banner, messagesEl);
    } else {
      panel.appendChild(banner);
    }
    state.bannerEl = banner;
  }

  function hideOfflineBanner() {
    if (state.bannerEl && state.bannerEl.parentNode) {
      state.bannerEl.parentNode.removeChild(state.bannerEl);
    }
    state.bannerEl = null;
  }

  /* ── PLAN B: error classification ────────────────────────────────
   * Dado un error de fetch/stream, devuelve objeto con:
   *   { title, detail, severity, retryable, retryAfterSec }
   * Usado para mostrar mensaje específico al usuario en vez de genérico.
   * ─────────────────────────────────────────────────────────────── */
  function classifyStreamError(err, httpStatus, retryAfterHeader) {
    var retryAfterSec = 0;
    if (retryAfterHeader) {
      var raw = String(retryAfterHeader).trim();
      var n = parseInt(raw, 10);
      if (!isNaN(n) && n > 0 && n < 600) retryAfterSec = n;
    }

    /* 1. Timeout propio de first-byte */
    if (err && (err.name === 'AbortError' || err.name === 'TimeoutError') &&
        (err.message === ABORT_REASON_TIMEOUT || state._abortReason === ABORT_REASON_TIMEOUT)) {
      return {
        title:    'El asistente tardó demasiado',
        detail:   'Puede estar arrancando (primera query del día suele demorar). Probá de nuevo en unos segundos.',
        severity: 'warn',
        retryable: true
      };
    }

    /* 2. Status HTTP específicos */
    if (httpStatus === 429) {
      return {
        title:    'Muchas consultas seguidas',
        detail:   retryAfterSec
                    ? ('Esperá ' + retryAfterSec + 's antes de volver a preguntar.')
                    : 'Esperá unos segundos antes de volver a preguntar.',
        severity: 'warn',
        retryable: false,
        retryAfterSec: retryAfterSec || 10
      };
    }
    if (httpStatus === 401 || httpStatus === 403) {
      return {
        title:    'Asistente no autorizado',
        detail:   'Hay un problema de configuración del servidor. Avisale al docente.',
        severity: 'warn',
        retryable: false
      };
    }
    if (httpStatus === 502 || httpStatus === 503 || httpStatus === 504) {
      return {
        title:    'Asistente arrancando o saturado',
        detail:   'El modelo local está iniciando o con alta carga. Probá en unos segundos.',
        severity: 'warn',
        retryable: true
      };
    }
    if (httpStatus && httpStatus >= 500) {
      return {
        title:    'Error en el servidor del asistente',
        detail:   'Algo falló del lado del proxy (HTTP ' + httpStatus + '). Probá de nuevo.',
        severity: 'warn',
        retryable: true
      };
    }
    if (httpStatus && httpStatus >= 400) {
      return {
        title:    'La consulta no pudo procesarse',
        detail:   'HTTP ' + httpStatus + '. Reformulá la pregunta y probá de nuevo.',
        severity: 'warn',
        retryable: true
      };
    }

    /* 3. Error de red (fetch rechaza antes de respuesta) */
    if (err && (err.name === 'TypeError' || /Failed to fetch|NetworkError|network/i.test(String(err.message)))) {
      return {
        title:    'Sin conexión al asistente',
        detail:   'Verificá tu internet. El temario y el horario siguen funcionando offline.',
        severity: 'warn',
        retryable: true
      };
    }

    /* 4. Fallback genérico */
    return {
      title:    'Algo salió mal con el asistente',
      detail:   (err && err.message) ? err.message : 'Error desconocido. Probá de nuevo.',
      severity: 'warn',
      retryable: true
    };
  }

  /* ── PLAN B: rate limit helper ──────────────────────────────────
   * Bloquea el botón send por N segundos y muestra countdown visible.
   * El alumno aprende que el sistema está protegiéndose, no roto.
   * ─────────────────────────────────────────────────────────────── */
  function startRateLimit(seconds) {
    if (!seconds || seconds <= 0) return;
    state.rateLimitUntil = Date.now() + seconds * 1000;
    var sendBtn = document.getElementById('nxai-send');
    var sub = document.getElementById('nxai-header-sub');
    if (sendBtn) sendBtn.disabled = true;

    if (state.rateLimitTimer) clearInterval(state.rateLimitTimer);
    state.rateLimitTimer = setInterval(function() {
      var remaining = Math.ceil((state.rateLimitUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(state.rateLimitTimer);
        state.rateLimitTimer = null;
        state.rateLimitUntil = 0;
        if (sendBtn) sendBtn.disabled = false;
        if (sub) sub.textContent = 'llama3.2 · GPU local';
      } else if (sub) {
        sub.textContent = 'Esperando ' + remaining + 's...';
      }
    }, 500);
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
   *  RUNTIME LOGGER · v19.29.0 (Fase 2 Bloque A)
   *  Telemetría anónima de uso: KB hits, LLM fallbacks, errores.
   *  Buffer en memoria + flush batched a /api/log-batch.
   *  Principios:
   *    · Fire-and-forget (nunca bloquea la UX).
   *    · Kill-switch vía NexusAI.logger.setEnabled(false).
   *    · Session ID anónimo (no correlaciona con usuario).
   *    · sendBeacon en unload para no perder últimos eventos.
   * ═══════════════════════════════════════════════════════════════════ */

  var APP_VERSION = 'v19.30.1';

  var LOGGER = (function() {
    var buffer     = [];
    var sessionId  = _genSessionId();
    var enabled    = true;
    var flushEvery = 30 * 1000;     /* ms */
    var flushSize  = 20;             /* eventos → flush inmediato */
    var flushing   = false;
    var timerId    = null;
    var errCount   = 0;              /* self-throttle si el endpoint falla repetido */

    function _genSessionId() {
      if (window.crypto && crypto.getRandomValues) {
        var arr = new Uint8Array(12);
        crypto.getRandomValues(arr);
        return Array.from(arr).map(function(b) {
          return b.toString(16).padStart(2, '0');
        }).join('');
      }
      return 'sid-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
    }

    function log(event) {
      if (!enabled) return;
      if (errCount > 5) return;  /* stop trying if endpoint keeps failing */
      event.ts          = event.ts || Date.now();
      event.session_id  = sessionId;
      event.app_version = APP_VERSION;
      buffer.push(event);
      if (buffer.length >= flushSize) flush();
    }

    function flush() {
      if (flushing || buffer.length === 0) return;
      if (!NX_AI.proxyUrl || !NX_AI.apiKey) return;
      flushing = true;
      var batch = buffer.splice(0, buffer.length);
      /* v19.29.1: sin keepalive + credentials: omit para evitar CORS preflight conflict
         con wildcard origin. El flush near-unload se maneja por sendBeacon (flushSync). */
      fetch(NX_AI.proxyUrl + '/api/log-batch', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + NX_AI.apiKey
        },
        body: JSON.stringify({ events: batch })
      })
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        errCount = 0;
      })
      .catch(function(err) {
        errCount++;
        /* Devolver eventos al buffer (head) para no perderlos — hasta 3 reintentos */
        if (errCount <= 3) {
          buffer = batch.concat(buffer);
        }
        console.debug('[NexusAI Logger] flush failed:', err.message);
      })
      .finally(function() { flushing = false; });
    }

    function flushSync() {
      /* Usa sendBeacon (no-blocking en unload) */
      if (!enabled || buffer.length === 0) return;
      if (!navigator.sendBeacon || !NX_AI.proxyUrl) return;
      try {
        /* v19.29.1: text/plain = simple request → NO preflight, NO credentials.
           El server parsea el body como JSON (express.json no aplica; lo hacemos raw). */
        var payload = JSON.stringify({ events: buffer });
        var blob    = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
        /* sendBeacon no soporta headers custom → API key como query param (mismo auth check) */
        navigator.sendBeacon(NX_AI.proxyUrl + '/api/log-batch?key=' + encodeURIComponent(NX_AI.apiKey), blob);
        buffer = [];
      } catch (e) {
        console.debug('[NexusAI Logger] sendBeacon failed:', e.message);
      }
    }

    function start() {
      if (timerId) return;
      timerId = setInterval(flush, flushEvery);
      /* Flush on visibility change (mobile background) */
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') flushSync();
      });
      window.addEventListener('beforeunload', flushSync);
    }

    function stop() {
      if (timerId) { clearInterval(timerId); timerId = null; }
    }

    return {
      log:         log,
      flush:       flush,
      flushSync:   flushSync,
      start:       start,
      stop:        stop,
      setEnabled:  function(v) { enabled = !!v; if (!v) stop(); else start(); },
      getEnabled:  function()  { return enabled; },
      getBuffer:   function()  { return buffer.slice(); },
      getSession:  function()  { return sessionId; }
    };
  })();

  /* ═══════════════════════════════════════════════════════════════════
   *  KB RUNTIME MATCHER · v19.29.0 (Fase 2 — envelope unificado)
   *  Principio: cache-first. Si hay match en schedule_kb.json → render
   *  determinista (sin LLM). Si MISS → fallback a Llama como antes.
   *  Devuelve envelope {hit, answer, source, entry_id, raw_score,
   *  confidence, matched_pattern} — unificado para logging y futuras
   *  fuentes (kb_academic, llm_llama, llm_mistral, api).
   * ═══════════════════════════════════════════════════════════════════ */

  var KB_STATE = {
    loaded: false,
    loading: null,
    schedule: null,
    knowledge: null,   /* v19.30.0 — KB académico (Mistral 7B offline) */
    enabled: true      /* feature flag para rollback rápido */
  };

  /* Fetch robusto: devuelve null silenciosamente si el archivo no existe.
     Así podemos paralelizar cargas sin hacer fallar a la otra si una falta. */
  function _fetchKBFile(url, label) {
    return fetch(url, { cache: 'no-cache' })
      .then(function(r) { return r && r.ok ? r.json() : null; })
      .then(function(kb) {
        if (kb && kb.entries) {
          var ver = kb.version || kb.schema_version || 'n/a';
          console.info('[NexusAI KB]', label, 'loaded:', kb.entries.length, 'entries · version', ver);
        } else {
          console.warn('[NexusAI KB]', label, 'not found — runtime will fall back');
        }
        return kb;
      })
      .catch(function(err) {
        console.warn('[NexusAI KB]', label, 'load failed:', err);
        return null;
      });
  }

  function _loadKB() {
    if (KB_STATE.loaded) return Promise.resolve({ schedule: KB_STATE.schedule, knowledge: KB_STATE.knowledge });
    if (KB_STATE.loading) return KB_STATE.loading;

    /* v19.30.0 — carga paralela: schedule (action-based) + knowledge (answer_full).
       Si knowledge_base.json todavía no existe, schedule sigue funcionando sin interferencia. */
    KB_STATE.loading = Promise.all([
      _fetchKBFile('./kb/schedule_kb.json',  'schedule'),
      _fetchKBFile('./kb/knowledge_base.json', 'knowledge')
    ]).then(function(results) {
      KB_STATE.schedule  = results[0];
      KB_STATE.knowledge = results[1];
      KB_STATE.loaded    = true;

      /* v19.30.6 — QA cache hashing (Fase 3, infra pasiva).
         Gate por ENABLE_QA_CACHE. Con flag OFF no se ejecuta nada:
         ni cálculo de hash, ni fetch del seed, ni invalidación.
         El comportamiento runtime es byte-for-byte idéntico al pre-v19.30.6. */
      if (ENABLE_QA_CACHE && KB_STATE.knowledge && KB_STATE.knowledge.entries) {
        var idsStr = KB_STATE.knowledge.entries
          .map(function(e) { return (e && e.id) || ''; })
          .sort()
          .join('|');
        _sha256(idsStr).then(function(hash) {
          QA_CACHE.currentKbHash = hash;
          return _qaCacheLoad();
        }).then(function() {
          _qaCacheInvalidateIfKBChanged();
        }).catch(function(err) {
          console.warn('[NexusAI QA] hash/cache init failed:', err);
        });
      }

      return { schedule: KB_STATE.schedule, knowledge: KB_STATE.knowledge };
    });
    return KB_STATE.loading;
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  QA CACHE — Fase 3 (infraestructura pasiva, v19.30.6)
   * ═══════════════════════════════════════════════════════════════════
   *  Capa opcional de cache sobre el matcher KB + LLM. Persiste los
   *  pares (query_norm → answer) validados por confidence alto o por
   *  thumbs-up del usuario, para servirlos en micro-ms en siguientes
   *  sesiones. localStorage es el backing store; qa_cache.json es seed
   *  opcional versionado en git.
   *
   *  ⚠️ INACTIVA POR DEFAULT. Activación controlada por ENABLE_QA_CACHE.
   *  Las funciones _qaCacheLoad / _qaCachePersist / _qaCacheInvalidate
   *  existen pero NO se invocan desde el flujo principal mientras el
   *  flag esté en false. Esto permite:
   *    1. Push seguro pre-demo (superficie de riesgo = 0 en runtime)
   *    2. Activación post-demo con un solo cambio (flip del flag)
   *    3. Validación del scaffold sin tocar _matchQuery ni Plan B UX v1.5.0
   * ═══════════════════════════════════════════════════════════════════ */

  var ENABLE_QA_CACHE = false;   /* flip a true post-demo para activar Fase 3 */

  var QA_CACHE = {
    loaded:         false,
    kbHashSeed:     null,   /* hash de los IDs del KB al momento del snapshot (desde qa_cache.json) */
    currentKbHash:  null,   /* hash de los IDs del KB actual (recomputado al cargar) */
    entries:        {}      /* query_norm → { answer, source, confidence, ts, entry_id } */
  };

  var _qaLog = [];               /* buffer FIFO en memoria (no se persiste aún) */
  var _QA_LOG_CAP = 1000;

  function _qaLogPush(evt) {
    if (!ENABLE_QA_CACHE) return;
    if (!evt) return;
    _qaLog.push(evt);
    if (_qaLog.length > _QA_LOG_CAP) {
      _qaLog.splice(0, _qaLog.length - _QA_LOG_CAP);
    }
  }

  /* SHA-256 hexadecimal vía SubtleCrypto (Promise-based).
     Retorna null si crypto.subtle no está disponible (browsers legacy / http sin subtle). */
  function _sha256(str) {
    try {
      if (!window.crypto || !window.crypto.subtle) return Promise.resolve(null);
      var encoder = new TextEncoder();
      var data = encoder.encode(String(str || ''));
      return window.crypto.subtle.digest('SHA-256', data).then(function(buf) {
        var bytes = new Uint8Array(buf);
        var hex = '';
        for (var i = 0; i < bytes.length; i++) {
          hex += ('00' + bytes[i].toString(16)).slice(-2);
        }
        return hex;
      }).catch(function() { return null; });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  /* Carga seed desde qa_cache.json + overrides desde localStorage.
     No se invoca mientras ENABLE_QA_CACHE esté en false. */
  function _qaCacheLoad() {
    if (!ENABLE_QA_CACHE) return Promise.resolve(null);
    if (QA_CACHE.loaded) return Promise.resolve(QA_CACHE);

    return fetch('./kb/qa_cache.json?_=' + Date.now(), { cache: 'no-cache' })
      .then(function(r) { return r && r.ok ? r.json() : null; })
      .then(function(seed) {
        if (seed && seed.schema === 'qa_cache-v1') {
          QA_CACHE.kbHashSeed = seed.kb_hash_seed || null;
          if (Array.isArray(seed.entries)) {
            for (var i = 0; i < seed.entries.length; i++) {
              var e = seed.entries[i];
              if (e && e.query_norm) QA_CACHE.entries[e.query_norm] = e;
            }
          }
        }
        /* Override con lo que haya persistido en localStorage (gana lo más reciente) */
        try {
          var raw = window.localStorage && window.localStorage.getItem('nexus_qa_cache_v1');
          if (raw) {
            var local = JSON.parse(raw);
            if (local && local.entries) {
              for (var k in local.entries) {
                if (Object.prototype.hasOwnProperty.call(local.entries, k)) {
                  QA_CACHE.entries[k] = local.entries[k];
                }
              }
            }
          }
        } catch (e) { /* localStorage unavailable o JSON corrupto — seguir sin override */ }
        QA_CACHE.loaded = true;
        return QA_CACHE;
      })
      .catch(function() {
        QA_CACHE.loaded = true;
        return QA_CACHE;
      });
  }

  /* Persiste un hit validado al cache (memoria + localStorage).
     No se invoca mientras ENABLE_QA_CACHE esté en false. */
  function _qaCachePersist(queryNorm, payload) {
    if (!ENABLE_QA_CACHE) return;
    if (!queryNorm || !payload) return;
    QA_CACHE.entries[queryNorm] = {
      query_norm: queryNorm,
      answer:     payload.answer,
      source:     payload.source,
      confidence: payload.confidence,
      entry_id:   payload.entry_id || null,
      ts:         Date.now()
    };
    try {
      if (window.localStorage) {
        window.localStorage.setItem(
          'nexus_qa_cache_v1',
          JSON.stringify({ entries: QA_CACHE.entries })
        );
      }
    } catch (e) { /* quota exceeded o disabled — no-op */ }
  }

  /* Invalida el cache si el hash del KB actual != kbHashSeed del snapshot.
     Garantiza que los usuarios no reciban respuestas staleadas si el KB cambió
     entre deploys. No se invoca mientras ENABLE_QA_CACHE esté en false. */
  function _qaCacheInvalidateIfKBChanged() {
    if (!ENABLE_QA_CACHE) return;
    if (!QA_CACHE.currentKbHash || !QA_CACHE.kbHashSeed) return;
    if (QA_CACHE.currentKbHash !== QA_CACHE.kbHashSeed) {
      QA_CACHE.entries = {};
      try {
        if (window.localStorage) window.localStorage.removeItem('nexus_qa_cache_v1');
      } catch (e) {}
      console.info('[NexusAI QA] cache invalidated — KB hash changed from snapshot');
    }
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

  /* v19.30.0 — Render de entries académicas (kb_academic).
     Las entries de knowledge_base.json ya traen `answer_full` pre-renderizado
     por Mistral; no hay templating dinámico ni dependencias del contexto.
     Agregamos una cita discreta al source_ref para trazabilidad (FCE exige
     poder verificar qué material originó la respuesta). */
  function _renderKnowledgeAnswer(match) {
    var entry = match.entry;
    var answer = entry.answer_full;
    if (!answer || typeof answer !== 'string') return null;

    /* Cita al material fuente (solo la primera ref; si hay más, "y más") */
    var refs = entry.source_refs || [];
    if (refs.length) {
      var firstRef = refs[0];
      /* Quitamos el prefijo Materiales/ y #pN para mostrar solo el nombre */
      var m = firstRef.match(/([^/]+\.pdf)(#p(\d+))?$/i);
      if (m) {
        var fileName = m[1];
        var page = m[3] ? ' · pág. ' + m[3] : '';
        var more = refs.length > 1 ? ' (+' + (refs.length - 1) + ' más)' : '';
        answer += '\n\n*Fuente: ' + fileName + page + more + '*';
      }
    }
    return answer;
  }

  /* Confidence buckets a partir del raw_score.
     Thresholds alineados con la lógica de confianza de cache-first:
       ≥0.85 → alta (se muestra sin caveat)
       0.60–0.85 → media (podría agregar "verificá con el docente" en Fase 3)
       <0.60 → low (filtrada por el threshold del matcher, aquí por completitud) */
  function _scoreToConfidence(score) {
    if (score >= 0.85) return 'high';
    if (score >= 0.60) return 'medium';
    return 'low';
  }

  /* Entry point: ¿hay match en KB? Devuelve envelope unificado o null.
     v19.30.0 — Orden de prioridad:
       1. schedule_kb   (determinista, templates dinámicos, acciones)
       2. knowledge_kb  (answer_full pre-renderizado por Mistral)
     La primera en hacer match con confianza suficiente gana.
     Si una fuente está ausente, se saltea sin interrumpir la otra. */
  function _tryKBMatch(userQuery) {
    if (!KB_STATE.enabled) return null;
    if (!KB_STATE.loaded)  return null;  /* aún cargando, cae a LLM */

    /* 1) Schedule KB — acciones determinísticas (clases hoy/mañana/próxima) */
    if (KB_STATE.schedule) {
      var sMatch = _matchKBEntry(userQuery, KB_STATE.schedule);
      if (sMatch) {
        var sAnswer = _renderScheduleAnswer(sMatch);
        if (sAnswer) {
          return {
            hit:             true,
            answer:          sAnswer,
            source:          'kb_schedule',
            entry_id:        sMatch.entry.id,
            raw_score:       sMatch.score,
            confidence:      _scoreToConfidence(sMatch.score),
            matched_pattern: sMatch.matchedPattern
          };
        }
      }
    }

    /* 2) Knowledge KB — conceptos académicos (Mistral 7B offline). */
    if (KB_STATE.knowledge) {
      var kMatch = _matchKBEntry(userQuery, KB_STATE.knowledge);
      if (kMatch) {
        var kAnswer = _renderKnowledgeAnswer(kMatch);
        if (kAnswer) {
          return {
            hit:             true,
            answer:          kAnswer,
            source:          'kb_academic',
            entry_id:        kMatch.entry.id,
            raw_score:       kMatch.score,
            confidence:      _scoreToConfidence(kMatch.score),
            matched_pattern: kMatch.matchedPattern,
            materia:         kMatch.entry.materia || null
          };
        }
      }
    }

    return null;
  }

  /* ── SEND MESSAGE ──────────────────────────────────────────────── */
  function sendMessage() {
    var input = document.getElementById('nxai-input');
    var text = (input.value || '').trim();
    if (!text || state.isThinking) return;

    /* ═══ PLAN B: rate-limit guard ══════════════════════════════════
     * Si hay un countdown activo por 429 previo, no dejamos mandar.
     * En vez de fallar silenciosamente, avisamos visible. */
    if (state.rateLimitUntil && Date.now() < state.rateLimitUntil) {
      var waitSec = Math.ceil((state.rateLimitUntil - Date.now()) / 1000);
      addErrorBubble(
        'Esperá un momento',
        'Podés volver a preguntar en ' + waitSec + 's.',
        { severity: 'info' }
      );
      return;
    }

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

    /* ═══ KB MATCH FIRST (cache-first architecture v19.28.0+) ═══
     * Si la pregunta matchea alguna entry del schedule KB →
     * respondemos con datos determinísticos (sin LLM).
     * Elimina alucinación en horarios y reduce latencia a <10ms.
     * v19.29.0: registra envelope completo en logger + UI muestra confianza.
     */
    var tStart = (performance && performance.now) ? performance.now() : Date.now();
    var queryNorm = _normalizeQuery(text);

    var kbResult = _tryKBMatch(text);
    if (kbResult) {
      state.messages.push({ role: 'assistant', content: kbResult.answer });
      addMessageBubble('assistant', kbResult.answer);

      var rttKB = Math.round(((performance && performance.now) ? performance.now() : Date.now()) - tStart);

      /* Stats chip: source + entry + confianza */
      var statsEl = document.getElementById('nxai-stats');
      if (statsEl) {
        var confBadge = kbResult.confidence === 'high' ? '🟢'
                      : kbResult.confidence === 'medium' ? '🟡'
                      : '⚪';
        statsEl.textContent = confBadge + ' KB · ' + kbResult.entry_id +
                              ' · ' + kbResult.raw_score.toFixed(2) + ' · ' + rttKB + 'ms';
      }

      /* Telemetría: registrá el hit */
      LOGGER.log({
        type:             'kb_hit',
        source:           kbResult.source,
        query_norm:       queryNorm,
        query_len:        text.length,
        entry_id:         kbResult.entry_id,
        raw_score:        kbResult.raw_score,
        confidence:       kbResult.confidence,
        matched_pattern:  kbResult.matched_pattern,
        response_time_ms: rttKB
      });

      updateStatus('idle');
      return;  /* NO llamamos al LLM */
    }

    /* MISS → cae a LLM. Registramos la query para poder detectar huecos de KB.
       v19.30.0: ya chequeamos schedule + knowledge, reportamos como 'kb_combined'. */
    LOGGER.log({
      type:       'kb_miss',
      source:     'kb_combined',
      query_norm: queryNorm,
      query_len:  text.length,
      had_schedule: !!KB_STATE.schedule,
      had_knowledge: !!KB_STATE.knowledge
    });
    /* Guardamos metadata para loggear el fallback completo en finishResponse */
    state._pendingLLMLog = {
      queryNorm: queryNorm,
      queryLen:  text.length,
      tStart:    tStart
    };
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
    var httpStatus = 0;
    var retryAfterHeader = null;

    /* Guardamos la query para retry (evita que el alumno re-tipee) */
    var retryPayload = {
      messages: state.messages.slice(),
      context: context
    };

    /* ═══ FIRST-BYTE TIMEOUT (Plan B) ═════════════════════════════
     * Si el proxy/Ollama no manda ni el primer header/chunk en 30s,
     * asumimos que está colgado. Abortamos con reason específico
     * para poder distinguirlo de un abort por usuario. */
    state._abortReason = null;
    if (state.firstByteTimer) clearTimeout(state.firstByteTimer);
    state.firstByteTimer = setTimeout(function() {
      if (state.abortCtrl) {
        state._abortReason = ABORT_REASON_TIMEOUT;
        try { state.abortCtrl.abort(ABORT_REASON_TIMEOUT); } catch (e) {}
      }
    }, FIRST_BYTE_TIMEOUT_MS);

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
      httpStatus = response.status;
      /* Retry-After header es crítico para 429 */
      try {
        retryAfterHeader = response.headers.get('Retry-After');
      } catch (e) { /* no-op */ }

      if (!response.ok) {
        /* Limpiamos el timer antes de tirar el error — llegó algo. */
        if (state.firstByteTimer) { clearTimeout(state.firstByteTimer); state.firstByteTimer = null; }
        var httpErr = new Error('HTTP ' + response.status);
        httpErr.httpStatus = response.status;
        throw httpErr;
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

          /* First-byte del stream llegó → cancelar timer */
          if (state.firstByteTimer) {
            clearTimeout(state.firstByteTimer);
            state.firstByteTimer = null;
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
                addErrorBubble(
                  'El asistente reportó un problema',
                  String(parsed.error).slice(0, 200),
                  {
                    severity: 'warn',
                    retry: function() {
                      state.messages = retryPayload.messages.slice();
                      streamChat(state.messages, retryPayload.context);
                    }
                  }
                );
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
      /* Siempre limpiamos el timer — si no, puede disparar tarde */
      if (state.firstByteTimer) { clearTimeout(state.firstByteTimer); state.firstByteTimer = null; }

      hideThinking();

      /* AbortError sin razón de timeout = el usuario canceló (abrió otra query).
         No mostramos nada en ese caso — la nueva query ya está en proceso. */
      var userAborted = err && err.name === 'AbortError' && state._abortReason !== ABORT_REASON_TIMEOUT;
      if (userAborted) {
        resetAfterResponse();
        return;
      }

      var info = classifyStreamError(err, httpStatus, retryAfterHeader);

      /* Rate limit: no mostramos retry manual, activamos countdown. */
      if (httpStatus === 429) {
        addErrorBubble(info.title, info.detail, { severity: 'warn' });
        if (info.retryAfterSec) startRateLimit(info.retryAfterSec);
        updateStatus('offline');
        resetAfterResponse();
        return;
      }

      /* Error retryable: ofrecemos botón explícito.
         Error no retryable: bubble informativo sin botón. */
      var bubbleOpts = { severity: info.severity };
      if (info.retryable) {
        bubbleOpts.retry = function() {
          state.messages = retryPayload.messages.slice();
          streamChat(state.messages, retryPayload.context);
        };
      }
      addErrorBubble(info.title, info.detail, bubbleOpts);

      /* Marcamos offline en el status dot para señal visual consistente */
      state.isOnline = false;
      updateStatus('offline');

      /* Plan B: si hay KB cargado pero no matcheó, sugerimos alternativas
         usando el propio sistema (sin depender del LLM). */
      if (KB_STATE && KB_STATE.loaded && (KB_STATE.schedule || KB_STATE.knowledge)) {
        addErrorBubble(
          '💡 Mientras tanto',
          'Podés preguntar sobre horarios (ej: "¿qué clase hay el lunes?"), o consultar el temario desde el sidebar.',
          { severity: 'info' }
        );
      }

      resetAfterResponse();
    });
  }

  function finishResponse(fullResponse, stats) {
    if (fullResponse) {
      state.messages.push({ role: 'assistant', content: fullResponse });
    }

    /* Show stats */
    var elapsedMs = stats && stats.elapsed_ms ? stats.elapsed_ms : null;
    if (stats) {
      var statsEl = document.getElementById('nxai-stats');
      var tps = stats.tokens_per_sec || 0;
      var elapsed = elapsedMs ? (elapsedMs / 1000).toFixed(1) : '?';
      statsEl.textContent = '⚪ LLM · ' + stats.tokens + ' tokens · ' + elapsed + 's · ' + tps + ' tok/s';
    }

    /* Telemetría: registrar fallback LLM si había una query pendiente */
    if (state._pendingLLMLog) {
      var meta = state._pendingLLMLog;
      var rtt  = elapsedMs || Math.round(
        ((performance && performance.now) ? performance.now() : Date.now()) - meta.tStart
      );
      LOGGER.log({
        type:             'llm_fallback',
        source:           'llm_llama',
        query_norm:       meta.queryNorm,
        query_len:        meta.queryLen,
        confidence:       'unknown',
        response_time_ms: rtt,
        tokens:           stats ? stats.tokens : null,
        tokens_per_sec:   stats ? stats.tokens_per_sec : null
      });
      state._pendingLLMLog = null;
    }

    resetAfterResponse();
  }

  function resetAfterResponse() {
    state.isThinking = false;
    hideThinking();
    updateStatus('online');
    document.getElementById('nxai-send').disabled = false;
    state.abortCtrl = null;

    /* Si había log pendiente y no se logueó en finishResponse (ej. error/abort),
       loggearlo acá como error para no perder visibilidad del miss. */
    if (state._pendingLLMLog) {
      var meta = state._pendingLLMLog;
      var rtt  = Math.round(
        ((performance && performance.now) ? performance.now() : Date.now()) - meta.tStart
      );
      LOGGER.log({
        type:             'llm_error',
        source:           'llm_llama',
        query_norm:       meta.queryNorm,
        query_len:        meta.queryLen,
        confidence:       'unknown',
        response_time_ms: rtt,
        error_msg:        'response_aborted_or_failed'
      });
      state._pendingLLMLog = null;
    }
  }

  /* ── HEALTH CHECK ──────────────────────────────────────────────── */
  function checkHealth() {
    var prevOnline = state.isOnline;

    /* Health endpoint puede demorar en el primer check tras arrancar Ollama
       (loading model en GPU). 10s es conservador; si tarda más, hay algo raro.
       Timeout manual con AbortController para no colgar el intervalo. */
    var ctrl = new AbortController();
    var healthTimer = setTimeout(function() {
      try { ctrl.abort(); } catch (e) {}
    }, 10000);

    /* Helper: marcar offline SOLO tras 2 fails consecutivos (debounce).
       Evita banner pegajoso ante blips transitorios. */
    function markHealthFail() {
      state.healthFailCount++;
      if (state.healthFailCount >= 2) {
        state.isOnline = false;
        if (state.isOpen) showOfflineBanner();
        if (prevOnline) updateStatus('offline');
      }
    }

    fetch(NX_AI.proxyUrl + '/api/health', { signal: ctrl.signal })
      .then(function(r) {
        clearTimeout(healthTimer);
        return r.ok ? r.json() : null;
      })
      .then(function(data) {
        var ok = !!(data && data.status === 'ok');
        if (ok) {
          /* Recuperación: reset contador, limpiamos banner y normalizamos header */
          state.healthFailCount = 0;
          state.isOnline = true;
          hideOfflineBanner();
          if (state.abortCtrl === null && !state.isThinking) updateStatus('online');
        } else {
          markHealthFail();
        }
      })
      .catch(function() {
        clearTimeout(healthTimer);
        markHealthFail();
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

      /* Start runtime logger (fire-and-forget telemetry) */
      LOGGER.start();

      console.info('[NEXUS AI] Co-Worker v1.5.0 · Hybrid KB + Plan B UX — proxy:', NX_AI.proxyUrl,
                   '· session:', LOGGER.getSession());
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
        KB_STATE.knowledge = null;
        return _loadKB();
      },
      setEnabled: function(flag) { KB_STATE.enabled = !!flag; }
    },
    /* Runtime logger (v19.29.0 — Fase 2 Bloque A) */
    logger: LOGGER,
    /* Utilidades devops para demo/monitoring del lunes */
    stats: function() {
      return fetch(NX_AI.proxyUrl + '/api/log-stats', {
        headers: { 'Authorization': 'Bearer ' + NX_AI.apiKey }
      }).then(function(r) { return r.json(); });
    }
  };

  init();

})();
