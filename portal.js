
/* ══════════════════════════════════════════════════════════════════════
   NEXUS UI v2 — DESIGN TOKEN SYSTEM  ·  Portal FCE 2026  ·  v19.3.0
   ══════════════════════════════════════════════════════════════════════
   FUENTE ÚNICA DE VERDAD para todos los colores del sistema.

   CÓMO CAMBIAR UN COLOR — solo tocá este objeto:
     · base       → color principal (accent) en hex
     · rgb        → canales R,G,B sin rgba() — para componer con alpha en JS/CSS
     · softBg     → fondo suave 8% alpha  — guided cards, chips, tooltips
     · softBorder → borde suave 25% alpha — guided cards, separadores
     · strong     → variante más brillante — hover, highlights, iconos activos
     · contrast   → texto sobre base opaco — siempre #ffffff en dark mode
     · legacyH    → hex anterior (para sanitizar bodyOriginal authoreado en light-mode)
     · legacyRgb  → canales anteriores (misma función)

   PROPAGACIÓN AUTOMÁTICA (sin tocar nada más):
     · CSS custom properties estáticas: --soc-h, --soc-rgb, --soc-soft-bg …
     · CSS custom properties activas:   --fce-base, --fce-rgb, --fce-soft-bg …
     · Todos los color maps JS vía colors = derive(NEXUS_COLORS)
     · Contenido bodyOriginal vía nexusSanitizeContent() en el render pipeline

   WCAG 2.1 AA — ratios sobre #161b22 (--paper dark):
     prop #f59e0b → 8.05:1 ✅ AAA   cont #58a6ff → 6.85:1 ✅ AAA
     adm  #3b82f6 → 4.70:1 ✅ AA    soc  #a78bfa → 6.36:1 ✅ AAA
   ══════════════════════════════════════════════════════════════════════ */
var NEXUS_COLORS = {
  materias: {
    prop: {
      base: '#f59e0b', h: '#f59e0b',          /* alias h para backward compat */
      rgb:         '245,158,11',
      softBg:      'rgba(245,158,11,0.08)',
      softBorder:  'rgba(245,158,11,0.25)',
      strong:      '#fbbf24',
      contrast:    '#ffffff',
      legacyH:     '#c0392b', legacyRgb: '192,57,43',
      names: ['Propedéutica'],
    },
    cont: {
      base: '#58a6ff', h: '#58a6ff',
      rgb:         '88,166,255',
      softBg:      'rgba(88,166,255,0.08)',
      softBorder:  'rgba(88,166,255,0.25)',
      strong:      '#79c0ff',
      contrast:    '#ffffff',
      legacyH:     '#1a6e4a', legacyRgb: '26,110,74',
      names: ['Contabilidad', 'Contabilidad I'],
    },
    adm: {
      base: '#3b82f6', h: '#3b82f6',
      rgb:         '59,130,246',
      softBg:      'rgba(59,130,246,0.08)',
      softBorder:  'rgba(59,130,246,0.25)',
      strong:      '#60a5fa',
      contrast:    '#ffffff',
      legacyH:     '#1a4a8a', legacyRgb: '26,74,138',
      names: ['Administración'],
    },
    soc: {
      base: '#a78bfa', h: '#a78bfa',
      rgb:         '167,139,250',
      softBg:      'rgba(167,139,250,0.08)',
      softBorder:  'rgba(167,139,250,0.25)',
      strong:      '#c4b5fd',
      contrast:    '#ffffff',
      legacyH:     '#6d3a9c', legacyRgb: '109,58,156',
      names: ['Sociales', 'Cs. Sociales'],
    },
    home: {
      base: '#f59e0b', h: '#f59e0b',
      rgb:         '245,158,11',
      softBg:      'rgba(245,158,11,0.08)',
      softBorder:  'rgba(245,158,11,0.25)',
      strong:      '#fbbf24',
      contrast:    '#ffffff',
      legacyH:     '#c0392b', legacyRgb: '192,57,43',
      names: [],
    },
  },
  /* Texto dark-mode — reemplazan colores de texto de light-mode en bodyOriginal */
  dark: {
    '#1a1510': '#c9d1d9',  /* negro light → ink dark     — 11.21:1 ✅ */
    '#5a5048': '#8b949e',  /* gris oscuro → muted dark    —  7.10:1 ✅ */
    '#4a3f34': '#8b949e',  /* gris medio  → muted dark    —  7.10:1 ✅ */
    '#7a6f62': '#6e7681',  /* gris muted  → muted2 dark   —  5.00:1 ✅ */
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   ██████  NEXUS DESIGN SYSTEM RULES  ·  v19.3.1  ██████
   ═══════════════════════════════════════════════════════════════════════

   FUENTE ÚNICA DE VERDAD: NEXUS_COLORS (arriba).
   Cambiar un color en NEXUS_COLORS → cambia TODO el sistema.

   ──────────────────────────────────────────────────────────────────────
   ❌ PROHIBIDO — nunca escribir esto en JS ni CSS
   ──────────────────────────────────────────────────────────────────────
   color: #58a6ff               → color de materia Contabilidad hardcodeado
   background: rgba(88,166,255) → ídem
   border-color: #a78bfa        → color de materia Sociales hardcodeado
   color: #3b82f6               → color de materia Administración hardcodeado
   color: #f59e0b               → color de materia Propedéutica hardcodeado
   colorMap = { Contabilidad: '#58a6ff' }   → mapa inline de colores

   ──────────────────────────────────────────────────────────────────────
   ✅ OBLIGATORIO — usar siempre estas alternativas
   ──────────────────────────────────────────────────────────────────────

   EN CSS (componentes que se adaptan a la materia activa):
     color:            var(--fce-base)         (color principal de materia)
     color:            var(--fce-strong)        (versión fuerte / luminosa)
     background:       var(--fce-soft-bg)       (fondo muy suave de materia)
     border-color:     var(--fce-soft-border)   (borde suave de materia)
     color:            var(--fce-contrast)      (texto encima del accent bg)
     opacity/shadow:   rgba(var(--fce-rgb), .1) (con canal alpha custom)

   EN CSS (tokens semánticos — quiz, feedback, estado):
     color:            var(--color-ok)          (#3fb950 — correcto / éxito)
     color:            var(--color-err)         (#f85149 — error / incorrecto)
     color:            var(--color-warn)        (#e3b341 — advertencia)
     background:       var(--color-ok-bg)       (rgba verde muy suave)
     background:       var(--color-err-bg)      (rgba rojo muy suave)

   EN JS (color de una materia específica por nombre):
     nexusColorForMateria(materia)              (→ hex del color de esa mat.)
     NEXUS_COLORS.materias.cont.base            (→ hex directo por prefix)
     NEXUS_NAME_COLORS                          (→ mapa nombre→hex completo)

   EN JS (render de componentes que siguen la materia activa):
     var G_TEXT = 'var(--fce-strong,    #79c0ff)'  (siempre con fallback)
     var G_BG   = 'var(--fce-soft-bg,   rgba(...))' (fallback = token default)

   ──────────────────────────────────────────────────────────────────────
   COLORES NEUTROS — aceptables como literal (no requieren tokenización)
   ──────────────────────────────────────────────────────────────────────
   Superficies:  #0d1117 #161b22 #21262d #30363d #010409
   Texto:        #e6edf3 #c9d1d9 #8b949e #6e7681 #484f58
   Nota: para texto y borde semántico, preferir --nx-text-* y --nx-border-*

   ──────────────────────────────────────────────────────────────────────
   EXCLUIDOS DEL AUDIT (intencionales)
   ──────────────────────────────────────────────────────────────────────
   - Bloque NEXUS_COLORS (líneas 1–95)          → fuente de verdad
   - Contextos de impresión / PDF               → tema independiente
   - nexusSanitizeContent()                     → mapeo de colores legacy
   - Data-viz / gradientes de rendimiento       → contexto analítico, no materia

   ──────────────────────────────────────────────────────────────────────
   AUDIT: node nexus-color-audit.js [--strict] [--fix-report]
   GUARD: localStorage.nexusDebug = 'true';  location.reload();
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Helpers de color ──────────────────────────────────────────────── */

/** Devuelve el hex de color por prefix (prop/cont/adm/soc) */
function nexusGetColor(prefix) {
  return (NEXUS_COLORS.materias[prefix] || NEXUS_COLORS.materias.home).h;
}

/** Devuelve el hex de color por nombre completo de materia */
function nexusGetColorByName(name) {
  for (var p in NEXUS_COLORS.materias) {
    var m = NEXUS_COLORS.materias[p];
    if (m.names && m.names.indexOf(name) !== -1) return m.h;
  }
  return NEXUS_COLORS.materias.home.h;
}

/** Devuelve el prefix (soc/cont/adm/prop) dado un nombre de materia */
function nexusGetPrefix(name) {
  for (var p in NEXUS_COLORS.materias) {
    var m = NEXUS_COLORS.materias[p];
    if (m.names && m.names.indexOf(name) !== -1) return p;
  }
  return 'home';
}

/** Sanitiza HTML de bodyOriginal: reemplaza colores light-mode con dark-mode.
 *  Corre UNA vez por render — O(n) sobre el string del contenido.
 *  @param {string} html   — HTML crudo del item
 *  @param {string} prefix — prefix de materia (soc/cont/adm/prop)
 *  @returns {string}      — HTML con colores dark-mode */
function nexusSanitizeContent(html, prefix) {
  if (!html) return html;
  var mat    = NEXUS_COLORS.materias[prefix] || NEXUS_COLORS.materias.home;
  var accent = mat.h;
  var rgb    = mat.rgb;

  /* 1 · Texto negro/oscuro de light-mode → equivalentes dark-mode */
  var darkMap = NEXUS_COLORS.dark;
  for (var old in darkMap) {
    /* Usar split/join es más rápido que regex global en strings grandes */
    html = html.split('color:' + old).join('color:' + darkMap[old]);
    html = html.split('color: ' + old).join('color:' + darkMap[old]);
  }

  /* 2 · Accent hex de ESTA materia: color, border */
  if (mat.legacyH && mat.legacyH !== accent) {
    html = html.split('color:' + mat.legacyH).join('color:' + accent);
    html = html.split('color: ' + mat.legacyH).join('color:' + accent);
    html = html.split('solid ' + mat.legacyH).join('solid ' + accent);
  }

  /* 3 · rgba de ESTA materia: preserva alpha, actualiza canales */
  if (mat.legacyRgb && mat.legacyRgb !== rgb) {
    var legacyPattern = new RegExp(
      'rgba\\(\\s*' + mat.legacyRgb.replace(/,/g,'\\s*,\\s*') + '\\s*,([^)]+)\\)',
      'g'
    );
    html = html.replace(legacyPattern, function(_, alpha) {
      return 'rgba(' + rgb + ',' + alpha + ')';
    });
  }

  return html;
}

/* ── Auto-inyección de CSS tokens desde NEXUS_COLORS ──────────────── */
/* ESTÁTICOS: inyecta tokens de todas las materias en :root al cargar.  */
/* DINÁMICOS: goto() inyecta --fce-* para la materia activa.            */
(function nexusInjectColorTokens() {
  var root = document.documentElement;
  var m    = NEXUS_COLORS.materias;
  /* Tokens estáticos por materia (accesibles siempre, independiente de nav) */
  ['prop','cont','adm','soc'].forEach(function(p) {
    var t = m[p];
    root.style.setProperty('--' + p + '-h',           t.base);
    root.style.setProperty('--' + p + '-rgb',          t.rgb);
    root.style.setProperty('--' + p + '-soft-bg',      t.softBg);
    root.style.setProperty('--' + p + '-soft-border',  t.softBorder);
    root.style.setProperty('--' + p + '-strong',       t.strong);
  });
  /* Tokens activos: inicializar con home (prop) hasta que goto() los actualice */
  nexusSetActiveTokens(m.home);
})();

/** Inyecta tokens --fce-* para la materia activa.
 *  Llamado por goto() en cada navegación. */
function nexusSetActiveTokens(mat) {
  var root = document.documentElement;
  root.style.setProperty('--fce-base',        mat.base);
  root.style.setProperty('--fce-rgb',          mat.rgb);
  root.style.setProperty('--fce-soft-bg',      mat.softBg);
  root.style.setProperty('--fce-soft-border',  mat.softBorder);
  root.style.setProperty('--fce-strong',       mat.strong);
  root.style.setProperty('--fce-contrast',     mat.contrast);
  /* Mantener --fce-color existente en sync (backward compat) */
  root.style.setProperty('--fce-color',        mat.base);
}

/* ═══════════════════════════════════════════════════════════════════════
   NEXUS DEV GUARD  ·  v19.3.1
   Runtime DOM checker — solo activo en modo debug.
   Activa con: localStorage.nexusDebug = 'true'  o  ?debug=1 en la URL.

   Escanea el DOM cada 3 segundos y detecta estilos inline que contengan
   colores hardcodeados (#hex, rgb(), rgba()) que deberían ser tokens.
   Emite warnings en consola con el elemento y el estilo infractor.

   USO EN DESARROLLO:
     localStorage.nexusDebug = 'true';  location.reload();
     → abre la consola, navega entre materias y observá los avisos.

   ¿Qué detecta?
     - color: #xxxxxx        → usar var(--fce-*) o var(--color-*)
     - background: #xxxxxx   → idem
     - border-*: #xxxxxx     → idem
     - rgb() / rgba() inline → idem (excepto rgba(0,0,0,...) transparencias)

   ¿Qué NO detecta (falsos positivos excluidos)?
     - rgba(0,0,0,...)       → negro puro / semi-transparencias neutras OK
     - rgba(240,246,252,...) → superficie neutra del sistema OK
     - color: #e6edf3 / #c9d1d9 / #8b949e → neutros de texto OK
   ═══════════════════════════════════════════════════════════════════════ */
(function nexusDevGuard() {
  /* Solo en modo debug explícito */
  var isDebug = (localStorage.getItem('nexusDebug') === 'true') ||
                (/[?&]debug=1/.test(location.search));
  if (!isDebug) return;

  /* Paleta de neutros permitidos como inline (no requieren tokenización) */
  var NEUTRAL_ALLOWED = new Set([
    '#e6edf3','#c9d1d9','#8b949e','#6e7681','#484f58',
    '#ffffff','#000000','#e2e8f0','#dde1ea',
    '#0d1117','#161b22','#21262d','#30363d',
    '#1a1d2e', /* dark paper flashcards */
  ]);

  /* rgba origins que son ruido neutro */
  var NEUTRAL_RGBA_RE = /rgba?\(\s*(0|240|255)\s*,\s*(0|246|255)\s*,\s*(0|252|255)/;

  /* Props de estilo a inspeccionar */
  var PROPS = ['color','backgroundColor','borderColor','borderTopColor',
               'borderBottomColor','borderLeftColor','borderRightColor','outlineColor'];

  var HEX_RE = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;

  function _scanEl(el) {
    var st = el.getAttribute('style');
    if (!st) return;

    /* Detección rápida via style string */
    var hexMatch = st.match(HEX_RE);
    var rgbMatch = st.match(/rgb(a?)\(/);
    if (!hexMatch && !rgbMatch) return;

    var cs = window.getComputedStyle(el);
    PROPS.forEach(function(prop) {
      var val = (el.style[prop] || '').trim();
      if (!val) return;

      /* Permitir si es neutro */
      var hexInVal = val.match(HEX_RE);
      if (hexInVal) {
        var hex = hexInVal[0].toLowerCase();
        if (hex.length === 4) hex = '#'+hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
        if (NEUTRAL_ALLOWED.has(hex)) return;
      }

      /* Permitir rgba neutras */
      if (NEUTRAL_RGBA_RE.test(val)) return;

      /* Permitir si ya usa var() */
      if (val.indexOf('var(') !== -1) return;

      /* Permitir si no hay color hardcodeado */
      if (!HEX_RE.test(val) && !/rgb(a?)\(/.test(val)) return;

      /* ⚠️ HARDCODE DETECTADO */
      console.warn(
        '[NexusDevGuard] Hardcode de color detectado\n',
        '  Elemento:', el,
        '\n  Propiedad:', prop,
        '\n  Valor:', val,
        '\n  Fix: usar var(--fce-*) o var(--color-*) en su lugar'
      );
    });
  }

  function _scan() {
    /* Solo inspeccionar elementos con style inline */
    var els = document.querySelectorAll('[style]');
    Array.prototype.forEach.call(els, _scanEl);
  }

  /* Escaneo inicial + periódico */
  setTimeout(_scan, 1500);
  setInterval(_scan, 4000);

  console.info('[NexusDevGuard] Modo debug activo — escaneando colores hardcodeados cada 4s');
})();

/* Función pública para validar un objeto de estilos inline antes de aplicarlo.
   Uso: nexusAssertNoHardcodes({ color: '#58a6ff' })  // → warning en consola
        nexusAssertNoHardcodes({ color: 'var(--fce-base,#58a6ff)' })  // → OK  */
function nexusAssertNoHardcodes(styles, context) {
  if (typeof styles !== 'object') return;
  var HEX = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;
  var RGB = /^rgb(a?)\(/;
  Object.keys(styles).forEach(function(prop) {
    var val = String(styles[prop] || '');
    if (val.indexOf('var(') !== -1) return; /* tokenizado → OK */
    if (!HEX.test(val) && !RGB.test(val)) return; /* sin color → OK */
    console.warn(
      '[nexusAssertNoHardcodes] Hardcode en ' + (context || 'unknown') + '\n',
      '  ' + prop + ': ' + val + '\n',
      '  Fix: usar var(--fce-*) o var(--color-*)'
    );
  });
}

// ═══════════════════════════════════════════════════════════════
//  FIREBASE AUTH + FIRESTORE  ·  Portal FCE 2026
// ═══════════════════════════════════════════════════════════════

// NEXUS_STATE definido en nexus-core.js (debe cargarse antes que portal.js)
// var NEXUS_STATE = window.NEXUS_STATE;

/* ── getMaterialesFuente() ELIMINADA fase 8 — usar NexusCore.getMateriales() ── */

// ── Lista de emails autorizados (lista blanca) ───────────────────
// Agregá los emails de tus alumnos acá. Si está vacía, cualquier
// cuenta Google puede entrar (útil para pruebas).
/* v8.9: Auth controlada por Firestore Security Rules (ver firestore.rules).
   Todos los usuarios con cuenta Google pueden entrar.
   El acceso a analítica avanzada lo controla el backend. */
function emailAutorizado() { return true; }

// ── Login con Google ─────────────────────────────────────────────
window.fceLoginGoogle = function() {
  var errEl = document.getElementById('pw-err');
  errEl.textContent = '';
  errEl.classList.remove('show');
  var provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  auth.signInWithPopup(provider)
    .then(function(result) {
          })
    .catch(function(err) {
      if (err.code === 'auth/cancelled-popup-request' ||
          err.code === 'auth/popup-closed-by-user') {
                return;
      }
      errEl.textContent = 'Error: ' + (err.message || err.code);
      errEl.classList.add('show');
      console.error('[FCE Auth]', err);
    });
};

// ── Logout ───────────────────────────────────────────────────────
window.fceLogout = function() {
  if (!confirm('¿Cerrar sesión?')) return;
  _clearPersistedSession();   /* ← borrar sesión persistida — logout real */
  NEXUS_STATE.fceIngresado = false;
  NEXUS_STATE.fceUsuario   = null;
  if (window.NexusCore) NexusCore.set('user', null);
  auth.signOut();
};

// ── Persistencia offline de sesión en localStorage ───────────────
// Problema: NEXUS_STATE vive solo en memoria. Un micro-corte de red
// en Trelew que fuerce un reload destruye fceIngresado → paywall vuelve.
// Solución: mismo patrón que nexus_leidos_v1.
// ─────────────────────────────────────────────────────────────────
var LS_SESSION_KEY = 'nexus_session_v1';

/* Al arrancar: restaurar sesión desde localStorage si Firebase tarda */
(function _restoreSession() {
  try {
    var stored = JSON.parse(localStorage.getItem(LS_SESSION_KEY) || 'null');
    if (stored && stored.uid && stored.ingresado) {
      // Firebase todavía no respondió — restaurar estado mínimo
      // para que el alumno no vea el paywall durante la carga inicial
      NEXUS_STATE.fceIngresado = true;
      NEXUS_STATE.fceUsuario   = stored;   // objeto serializado del usuario
      if (window.NexusCore) NexusCore.set('user', stored);
      // Ocultar paywall mientras Firebase confirma la sesión real
      var overlay = document.getElementById('pw-overlay');
      if (overlay) overlay.classList.add('pw-hidden');
      console.info('[FCE Auth] Sesión restaurada desde localStorage. Esperando Firebase...');
    }
  } catch(e) { /* fail silencioso — no bloquear arranque */ }
})();

/* Persistir sesión cuando Firebase confirma el usuario */
function _persistSession(user) {
  if (!user) { return; }
  try {
    var payload = {
      uid:         user.uid         || '',
      displayName: user.displayName || '',
      email:       user.email       || '',
      photoURL:    user.photoURL    || '',
      ingresado:   true,
      ts:          Date.now()
    };
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify(payload));
  } catch(e) { /* fail silencioso */ }
}

/* Limpiar sesión persistida al cerrar sesión explícitamente */
function _clearPersistedSession() {
  try { localStorage.removeItem(LS_SESSION_KEY); } catch(e) {}
}

// ── Observer de estado de autenticación ─────────────────────────

auth.onAuthStateChanged(function(user) {
  // ── Puente NexusCore — fase 1: migrar 'user' ──────────────────
  // NexusCore.set notifica a todos los suscriptores de 'user'.
  // NEXUS_STATE sigue actualizándose abajo para compatibilidad total.
  if (window.NexusCore) NexusCore.set('user', user || null);
  // ─────────────────────────────────────────────────────────────
  if (user) {
    if (!emailAutorizado(user.email)) {
      auth.signOut();
      var errEl = document.getElementById('pw-err');
      errEl.textContent = 'Tu cuenta no tiene acceso. Contactá a Visión Patagonia.';
      errEl.classList.add('show');
      return;
    }
    NEXUS_STATE.fceIngresado = true;
    NEXUS_STATE.fceUsuario = user;
    _persistSession(user);   /* ← persistir en localStorage para sobrevivir micro-cortes */
    fceAlIngreso(user);
  } else {
    NEXUS_STATE.fceUsuario = null;
    /* BETA MODE: bypass auth — auto-login sin Firebase */
    if (!NEXUS_STATE.fceIngresado) {
      window.ingresarAlPortal && window.ingresarAlPortal('Beta Tester');
    }
  }
});

// ── Acciones al ingresar ─────────────────────────────────────────
function fceAlIngreso(user) {
  // 1. Cerrar el paywall con animación
  var overlay = document.getElementById('pw-overlay');
  document.getElementById('pw-form-state').style.display = 'none';
  document.getElementById('pw-success').style.display = 'flex';
  document.getElementById('pw-success').querySelector('p').innerHTML =
    'Bienvenido/a, <strong>' + esc(user.displayName || user.email) + '</strong>.<br>Tu progreso queda guardado en la nube.';
  setTimeout(function() {
    overlay.classList.add('pw-hidden');
  }, 1600);

  // 2. Actualizar saludo en dashboard
  var nombre = (user.displayName || user.email).split(' ')[0];
  var el = document.getElementById('dash-nombre');
  if (el) el.textContent = nombre + ', ¡a estudiar!';

  // 3. Mostrar avatar en topbar
  var wrap = document.getElementById('user-avatar-wrap');
  var img  = document.getElementById('user-avatar-img');
  var name = document.getElementById('user-avatar-name');
  if (wrap) {
    wrap.style.display = 'flex';
    img.src = user.photoURL || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="16" fill="%231a4a8a"/%3E%3Ctext x="16" y="21" text-anchor="middle" font-size="14" fill="white" font-family="Georgia"%3E' + encodeURIComponent((user.displayName||'U')[0].toUpperCase()) + '%3C/text%3E%3C/svg%3E';
    name.textContent = nombre;
  }

  // 4. Cargar materiales leídos desde Firestore
  fceCargarLeidos(user.uid);

  // 5. Disparar router para renderizar contenido en hash actual
  setTimeout(function() {
    var h = window.location.hash;
    if (!h || h === '#') {
      window.location.hash = 'dashboard';
    } else {
      // Re-fire hashchange to trigger router
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }, 200);
}

// ── Acceso temporal: Invitado (bypass Firebase) ───────────────────
window.ingresarAlPortal = function(nombre) {
  var guestName = (nombre || 'Invitado').trim() || 'Invitado';
  var guest = {
    displayName: guestName,
    email: '',
    uid: 'guest_' + guestName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18)
  };

  NEXUS_STATE.fceIngresado = true;
  NEXUS_STATE.fceUsuario = guest;
  _persistSession(guest);   /* ← persistir invitado también — sobrevive reloads */

  // ── Puente NexusCore — modo invitado ─────────────────────────
  if (window.NexusCore) NexusCore.set('user', guest);
  // ─────────────────────────────────────────────────────────────

  if (typeof fceAlIngreso === 'function') {
    try { fceAlIngreso(guest); } catch (e) { /* no bloquear */ }
  } else {
    // Fallback mínimo si cambia el orden de carga
    var overlay = document.getElementById('pw-overlay');
    if (overlay) overlay.classList.add('pw-hidden');
  }
};

// ── Acciones al cerrar sesión ────────────────────────────────────
function fceAlCerrarSesion() {
  // Mostrar paywall de nuevo
  var overlay = document.getElementById('pw-overlay');
  overlay.classList.remove('pw-hidden');
  document.getElementById('pw-form-state').style.display = 'block';
  document.getElementById('pw-success').style.display = 'none';

  // Ocultar avatar
  var wrap = document.getElementById('user-avatar-wrap');
  if (wrap) wrap.style.display = 'none';

  // Reset nombre
  var el = document.getElementById('dash-nombre');
  if (el) el.textContent = '¡a estudiar!';

  NEXUS_STATE.fceLeidos = {};
}

// ── Firestore: cargar materiales leídos ─────────────────────────
function fceCargarLeidos(uid) {
  db.collection('usuarios').doc(uid).collection('leidos').get()
    .then(function(snapshot) {
      NEXUS_STATE.fceLeidos = {};
      snapshot.forEach(function(doc) {
        NEXUS_STATE.fceLeidos[doc.id] = true;
      });
          fceActualizarBadgesLeidos();
    })
    .catch(function(err) {
      console.warn('[FCE Firestore] No se pudo cargar leídos:', err.message);
      // Aunque falle Firestore, actualizar UI con progreso vacío (no dejar "Cargando...")
      NEXUS_STATE.fceLeidos = {};
      fceActualizarBadgesLeidos();
    });
}

// ── Firestore: marcar material como leído ───────────────────────
window.fceMarcarLeido = function(slug, titulo, materia) {
  if (!NEXUS_STATE.fceUsuario) return;
  NEXUS_STATE.fceLeidos[slug] = true;
  db.collection('usuarios').doc(NEXUS_STATE.fceUsuario.uid)
    .collection('leidos').doc(slug)
    .set({
      titulo:  titulo,
      materia: materia,
      fecha:   firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function() {
      fceActualizarBadgesLeidos();
    })
    .catch(function(err) {
    });
};

// ── Actualizar badges "Leído" en los links de materiales ─────────
function fceActualizarBadgesLeidos() {
  var _repaso = {};
  try { _repaso = JSON.parse(localStorage.getItem('nexus71_repaso_v1') || '{}'); } catch(e) {}

  Object.keys(NEXUS_STATE.fceLeidos).forEach(function(slug) {
    var badge = document.getElementById('leido-' + slug);
    if (badge) badge.style.display = 'inline-flex';
    var card = document.getElementById('mcard-' + slug);
    if (card) {
      card.classList.add('fce-leido');
      /* v7.1: estado visual según score del quiz relacionado */
      var item = _data ? _data.find(function(i){ return i && i.id === slug; }) : null;
      if (item && item.agrupador) {
        var rKey = (item.materia || '') + '|' + item.agrupador;
        if (_repaso[rKey]) {
          card.classList.add('fce-repaso-sugerido');
          card.classList.remove('fce-leido');
        }
      }
    }
  });
  fceActualizarDashboardProgreso();
  if (typeof N80Rangos !== 'undefined') setTimeout(function(){ N80Rangos.apply(); }, 100);
}

/* v4.0 ── Dashboard progress bars per materia ─────────────────── */
function fceActualizarDashboardProgreso() {
  if (!NexusCore.getMateriales().length) return;
  var MATERIAS = [
    /* v19.3.1 — colores derivados de NEXUS_COLORS (single source of truth) */
    { key:'prop', color: NEXUS_COLORS.materias.prop.base, barId:'v4-prog-prop', pctId:'v4-pct-prop',
      name:'Propedéutica' },
    { key:'cont', color: NEXUS_COLORS.materias.cont.base, barId:'v4-prog-cont', pctId:'v4-pct-cont',
      name:'Contabilidad' },
    { key:'adm',  color: NEXUS_COLORS.materias.adm.base,  barId:'v4-prog-adm',  pctId:'v4-pct-adm',
      name:'Administración' },
    { key:'soc',  color: NEXUS_COLORS.materias.soc.base,  barId:'v4-prog-soc',  pctId:'v4-pct-soc',
      name:'Sociales' },
  ];
  MATERIAS.forEach(function(m) {
    var items = NexusCore.getMateriales().filter(function(i) {
      return i && norm(i.materia) === norm(m.name) && i.cuerpoTipo === 'html';
    });
    var total = items.length || 1;
    var leidos = items.filter(function(i){ return NEXUS_STATE.fceLeidos[i.id]; }).length;
    var pct = Math.round((leidos / total) * 100);
    var bar = document.getElementById(m.barId);
    var pctEl = document.getElementById(m.pctId);
    if (bar) setTimeout(function(){ bar.style.width = pct + '%'; }, 300);
    if (pctEl) pctEl.textContent = pct + '%';
    // update card XP display
    var xpEl = document.getElementById('v4-xp-' + m.key);
    if (xpEl) xpEl.textContent = (leidos * 10) + ' XP';
  });
  // update total XP
  var totalXP = Object.keys(NEXUS_STATE.fceLeidos).length * 10;
  var xpTotalEl = document.getElementById('v4-xp-total');
  if (xpTotalEl) xpTotalEl.textContent = totalXP + ' XP';
}

// ── Helper: slug de título ───────────────────────────────────────
window.fceSlug = function(str) {
  return String(str).toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e')
    .replace(/[íìï]/g,'i').replace(/[óòö]/g,'o')
    .replace(/[úùü]/g,'u').replace(/ñ/g,'n')
    .replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
};

// ── Helper: escapar HTML ─────────────────────────────────────────
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


window.v4EnterFocus = function(cardId, titulo) {
  var card = cardId ? document.getElementById(cardId) : null;
  var well = card ? card.querySelector('.mc-well') : null;
  if (!well) return;

  var overlay = document.getElementById('v4-focus-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'v4-focus-overlay';
    overlay.innerHTML =
      '<div class="v4-focus-bar">' +
        '<span class="v4-focus-title" id="v4-focus-title"></span>' +
        '<button class="v4-focus-close" onclick="v4ExitFocus()">✕ Salir del enfoque</button>' +
      '</div>' +
      '<div class="v4-focus-content" id="v4-focus-content"></div>';
    document.body.appendChild(overlay);
  }

  document.getElementById('v4-focus-title').textContent = titulo || 'Lectura';
  var contentEl = document.getElementById('v4-focus-content');
  contentEl.innerHTML = '';
  var clone = well.cloneNode(true);
  // Remove the read/focus buttons from clone
  clone.querySelectorAll('.v4-read-btn,.v4-focus-btn').forEach(function(b){ b.remove(); });
  contentEl.appendChild(clone);

  overlay.classList.add('v4-focus-active');
  document.getElementById('sb').style.transform = 'translateX(-100%)';
  document.body.style.overflow = 'hidden';
};

window.v4ExitFocus = function() {
  var overlay = document.getElementById('v4-focus-overlay');
  if (overlay) overlay.classList.remove('v4-focus-active');
  var sb = document.getElementById('sb');
  if (sb) sb.style.transform = '';
  document.body.style.overflow = '';
};


function planTab(tab) {
  ['resumen','crono','eval','notas'].forEach(t => {
    const panel = document.getElementById('plan-panel-' + t);
    const btn = document.getElementById('plan-tab-' + t);
    if (!panel || !btn) return;
    const active = t === tab;
    panel.style.display = active ? 'block' : 'none';
    /* v19.3.1 — planTab usa NEXUS_COLORS.materias.prop.base */
    var _pc = NEXUS_COLORS.materias.prop;
    btn.style.cssText = active
      ? 'background:rgba(' + _pc.rgb + ',.12);border:none;border-bottom:2px solid ' + _pc.base + ';color:' + _pc.base + ';font-family:"DM Mono",monospace;font-size:.72rem;font-weight:700;padding:10px 16px;cursor:pointer;margin-bottom:-2px;letter-spacing:.05em'
      : 'background:transparent;border:none;border-bottom:2px solid transparent;color:#7a6f62;font-family:"DM Mono",monospace;font-size:.72rem;font-weight:700;padding:10px 16px;cursor:pointer;margin-bottom:-2px;letter-spacing:.05em';
  });
}


function planTab(n) {
  var _pc2 = NEXUS_COLORS.materias.prop; /* v19.3.1 */
  for (let i=1;i<=5;i++) {
    const panel = document.getElementById('plan-panel-'+i);
    const tab = document.getElementById('plan-t'+i);
    if (panel) panel.style.display = i===n ? 'block' : 'none';
    if (tab) {
      if (i===n) {
        tab.style.background='rgba(' + _pc2.rgb + ',.1)';
        tab.style.borderBottom='2px solid ' + _pc2.base;
        tab.style.color=_pc2.base;
      } else {
        tab.style.background='transparent';
        tab.style.borderBottom='2px solid transparent';
        tab.style.color='var(--muted)';
      }
    }
  }
}


const propQuestions = [
  { q:"¿Por qué ley fue creada la UNPSJB y en qué fecha?", opts:["Ley 23.569 · 15/03/1985","Ley 22.173 · 25/02/1980","Ley 24.521 · 07/08/1995","Decreto 1382 · 01/04/1978"], ans:1,
    exp:"La UNPSJB fue creada por Ley Nacional Nº 22.173 el 25 de febrero de 1980. El texto ordenado del Estatuto vigente es la Ord. C.S. Nº 120 del 24/04/2009." },
  { q:"¿Qué organismo es el órgano supremo de gobierno de la UNPSJB?", opts:["El Consejo Superior","El Rector","La Asamblea Universitaria","El Consejo Directivo de la FCE"], ans:2,
    exp:"La Asamblea Universitaria es el órgano supremo de gobierno (Art. 62). Integrada por los consejeros de todos los Consejos Directivos más el Rector." },
  { q:"¿Cuántos votos se requieren para reformar el Estatuto de la UNPSJB?", opts:["Mayoría simple (mitad + 1)","Mayoría absoluta (2/3 de presentes)","2/3 de los miembros de la Asamblea Universitaria","3/4 de los miembros del Consejo Superior"], ans:2,
    exp:"Para reformar el Estatuto se requieren 2/3 de los votos de la Asamblea Universitaria (Art. 68a). No alcanza con mayoría simple." },
  { q:"¿Quién elige al Rector de la UNPSJB?", opts:["El voto directo de todos los docentes y estudiantes","El Consejo Superior por voto secreto","La Asamblea Universitaria","El Ministerio de Educación de la Nación"], ans:2,
    exp:"El Rector es elegido por la Asamblea Universitaria (Art. 125). NO es por voto directo de los claustros —eso sería un error frecuente en parciales." },
  { q:"¿Cuáles son los requisitos para ser Rector de la UNPSJB?", opts:["Argentino, mayor de 25 años y título universitario cualquiera","Argentino, mayor de 30 años y profesor regular de la universidad","Doctor, mayor de 40 años y 10 años de antigüedad docente","Argentino, mayor de 35 años y título de posgrado"], ans:1,
    exp:"Art. 77: el Rector debe ser argentino, mayor de 30 años y profesor regular de la UNPSJB. Mismo requisito para el Decano." },
  { q:"¿Cuánto dura el mandato del Rector y cuándo puede ser reelecto?", opts:["3 años · puede reelegirse indefinidamente","4 años · reelegible en forma inmediata","4 años · reelegible con 1 período de por medio","5 años · no puede ser reelecto"], ans:2,
    exp:"El Rector dura 4 años en el cargo y puede ser reelecto, pero debe dejar pasar al menos 1 período intermedio entre mandatos. Mismo régimen para el Decano." },
  { q:"¿Cuántos docentes, estudiantes, graduados y no docentes integran el Consejo Superior?", opts:["2 doc + 2 est por Facultad, 1 graduado, 1 no docente","3 doc + 3 est por Facultad, 2 graduados, 2 no docentes","5 doc + 3 est por Facultad, 1 graduado, 1 no docente","4 doc + 4 est por Facultad, 3 graduados, 2 no docentes"], ans:1,
    exp:"Art. 70: el Consejo Superior está integrado por el Rector, los Decanos, 3 docentes + 3 estudiantes por Facultad, 2 graduados y 2 no docentes." },
  { q:"¿Cuántos miembros tiene el Consejo Directivo de cada Facultad?", opts:["5 doc + 3 est + 1 grad + 1 no doc","7 doc + 5 est + 1 grad + 1 no doc","4 doc + 4 est + 2 grad + 1 no doc","6 doc + 4 est + 1 grad + 2 no doc"], ans:1,
    exp:"El Consejo Directivo de cada Facultad tiene 7 docentes, 5 estudiantes, 1 graduado y 1 no docente. En total 14 miembros más el Decano que lo preside." },
  { q:"¿Con qué frecuencia mínima sesiona ordinariamente el Consejo Superior?", opts:["Semanalmente","Quincenalmente","Mínimo 1 vez por mes (Art. 72)","Cada 2 meses"], ans:2,
    exp:"Art. 72: el Consejo Superior sesiona ordinariamente como mínimo una vez por mes. La falta a 3 sesiones consecutivas implica el cese del cargo (Art. 74)." },
  { q:"¿Cuánto dura el mandato de los consejeros estudiantiles?", opts:["2 años","4 años","1 año","3 años"], ans:2,
    exp:"Los consejeros estudiantes tienen mandato de 1 año (Art. 113). Los docentes duran 4 años, graduados y no docentes 2 años. El sistema electoral es D'Hondt irrestricto (Art. 112)." },
  { q:"¿Cómo se ingresa a la carrera docente universitaria en la UNPSJB?", opts:["Por designación directa del Decano","Por concurso público de oposición (Art. 24)","Por sorteo entre los postulantes inscriptos","Por antecedentes y entrevista ante el Consejo Directivo"], ans:1,
    exp:"Art. 24: el ingreso a la docencia universitaria es exclusivamente por concurso público de oposición. No existe otro mecanismo válido para ser profesor regular." },
  { q:"¿Cada cuántos años tienen derecho al año sabático los profesores titulares?", opts:["Cada 5 años","Cada 6 años (Art. 32)","Cada 8 años","Cada 10 años"], ans:1,
    exp:"Art. 32: los profesores titulares tienen derecho al año sabático cada 6 años para dedicarse a investigación o perfeccionamiento. Solo aplicable a titulares, no a asociados ni adjuntos." },
  { q:"¿Cuántas horas semanales mínimas requiere la dedicación semi-exclusiva?", opts:["8 horas","12 horas","16 horas (Art. 45)","20 horas"], ans:2,
    exp:"Art. 45: la dedicación semi-exclusiva requiere al menos 16 horas semanales. La dedicación simple requiere al menos 6 horas semanales." },
  { q:"¿Cuándo comenzó el 1er cuatrimestre 2026 en la UNPSJB?", opts:["2 de marzo de 2026","10 de marzo de 2026","16 de marzo de 2026","23 de marzo de 2026"], ans:2,
    exp:"Según el Calendario Académico 2026 (RCDFI 193/2025), el 1er cuatrimestre comenzó el 16 de marzo de 2026 y finaliza el 26 de junio de 2026." },
  { q:"¿Cuándo finaliza el 1er cuatrimestre 2026?", opts:["15 de junio","26 de junio de 2026","30 de junio","10 de julio"], ans:1,
    exp:"El 1er cuatrimestre 2026 finaliza el 26 de junio de 2026. El 2do cuatrimestre inicia el 3 de agosto y finaliza el 20 de noviembre." },
  { q:"¿Cuáles son las fechas del turno de exámenes de julio 2026?", opts:["7–11 julio","14–18 julio","27–31 julio","21–25 julio"], ans:2,
    exp:"Según el Calendario 2026 (RCDFI 193/2025), el turno de exámenes de julio es del 27 al 31 de julio. Es un turno corto de solo una semana." },
  { q:"La autonomía universitaria establecida en el Estatuto (Art. 3) implica que la universidad puede:", opts:["Recaudar impuestos propios y autofinanciarse totalmente","Darse su propio Estatuto, elegir autoridades, designar personal y crear carreras sin interferencia del poder político","Negarse a rendir cuentas ante el Estado Nacional","Decidir quiénes pueden acceder a sus cargos sin ningún tipo de concurso"], ans:1,
    exp:"Art. 3: la autonomía implica darse su propio Estatuto, elegir autoridades libremente, designar personal, regular la admisión y permanencia estudiantil, y crear carreras. NO implica independencia económica total ni evasión de responsabilidad." },
  { q:"¿Cuál afirmación sobre la gratuidad universitaria es CORRECTA?", opts:["Toda la educación universitaria es gratuita, incluyendo el posgrado","El grado es gratuito y el posgrado puede ser arancelado","La gratuidad solo aplica a las carreras de grado de más de 5 años","La gratuidad fue establecida por la Reforma del 18"], ans:1,
    exp:"El grado universitario es gratuito (garantizado por Art. 71-24°). Solo el posgrado puede ser arancelado. La gratuidad del grado fue establecida en 1949, no en la Reforma del 18 (que estableció autonomía y cogobierno)." },
  { q:"¿Qué es el cogobierno universitario?", opts:["El gobierno exclusivo de los docentes sobre la institución","La participación de docentes, graduados, estudiantes y no docentes en la toma de decisiones institucionales","El sistema por el cual dos rectores co-gobiernan la universidad","La forma en que el Estado Nacional controla a la universidad"], ans:1,
    exp:"El cogobierno es la participación de los 4 claustros —docentes, graduados, estudiantes y no docentes— en los órganos de gobierno. Es uno de los principios de la Reforma del '18." },
  { q:"¿Qué establece el Art. 18 del Estatuto sobre la investigación?", opts:["La investigación es optativa para los docentes universitarios","La investigación es una actividad inherente al docente universitario","Solo los profesores titulares con dedicación exclusiva deben investigar","La investigación está a cargo de institutos especializados independientes"], ans:1,
    exp:"Art. 18: la investigación es una actividad INHERENTE al docente universitario, no optativa. El Art. 19 establece que se fomenta la investigación básica y aplicada." },
  { q:"¿Cuál es el feriado del 2 de abril según el Calendario 2026?", opts:["Día Nacional de la Memoria","Día del Veterano y los Caídos en Malvinas","Día del Docente Universitario","Aniversario de la UNPSJB"], ans:1,
    exp:"El 2 de abril es el Día del Veterano y los Caídos en la Guerra de Malvinas. El 24 de marzo es el Día Nacional de la Memoria por la Verdad y la Justicia." },
  { q:"¿En qué artículo del Estatuto se garantiza la no discriminación en el acceso a la universidad?", opts:["Art. 1","Art. 2","Art. 4","Art. 71"], ans:2,
    exp:"Art. 4: la UNPSJB no admite discriminaciones de ningún tipo y asegura la libertad de enseñanza e investigación. El Art. 2 establece el otorgamiento de títulos." },
  { q:"¿Qué sistema electoral se usa para elegir consejeros en la UNPSJB?", opts:["Sistema proporcional con umbral del 5%","D'Hondt irrestricto (Art. 112)","Voto uninominal por mayoría simple","Sistema mixto con lista única por claustro"], ans:1,
    exp:"Art. 112: se usa el sistema D'Hondt irrestricto, que permite la representación proporcional de las distintas listas. El sufragio es obligatorio y secreto (Art. 121)." },
  { q:"¿Qué ocurre si un consejero falta a 3 sesiones consecutivas del Consejo Superior?", opts:["Recibe una advertencia formal por escrito","Pierde su cargo (Art. 74)","Debe solicitar licencia por 30 días","Es reemplazado temporariamente por su suplente"], ans:1,
    exp:"Art. 74: la falta a 3 sesiones consecutivas implica el cese automático del cargo en el Consejo Superior. No hay advertencia previa, el cese es directo." },
  { q:"¿Cuáles son las sedes de la UNPSJB?", opts:["Comodoro Rivadavia, Trelew, Esquel y Bariloche","Comodoro Rivadavia, Trelew, Puerto Madryn y Esquel","Rawson, Trelew, Comodoro Rivadavia y Puerto Madryn","Comodoro Rivadavia, Trelew, Puerto Madryn, Esquel y Río Gallegos"], ans:1,
    exp:"Las sedes de la UNPSJB son Comodoro Rivadavia (sede central), Trelew, Puerto Madryn y Esquel. En cada sede funciona un Consejo Zonal (Arts. 99–109)." },
];

const propFlashcards = [
  {f:"¿Por qué ley y cuándo se creó la UNPSJB?", b:"Ley Nacional Nº 22.173 · 25 de febrero de 1980. Estatuto vigente: Ord. C.S. Nº 120 (24/04/2009)."},
  {f:"Órgano supremo de gobierno de la UNPSJB", b:"La Asamblea Universitaria (Art. 62). Elige al Rector, puede separarlo y reforma el Estatuto con 2/3 de votos."},
  {f:"¿Quién elige al Rector?", b:"La Asamblea Universitaria (Art. 125). NO es voto directo de los claustros."},
  {f:"Requisitos para ser Rector (o Decano)", b:"Argentino · mayor de 30 años · profesor regular de la UNPSJB (Art. 77)."},
  {f:"Mandato del Rector", b:"4 años · reelegible con 1 período de por medio."},
  {f:"Composición del Consejo Superior", b:"Rector + Decanos + 3 doc. + 3 est. por Facultad + 2 graduados + 2 no docentes (Art. 70)."},
  {f:"Composición del Consejo Directivo de cada Facultad", b:"7 docentes + 5 estudiantes + 1 graduado + 1 no docente."},
  {f:"Mandatos por claustro", b:"Docentes: 4 años. Estudiantes: 1 año. Graduados y no docentes: 2 años (Art. 113)."},
  {f:"Sistema electoral en la UNPSJB", b:"D'Hondt irrestricto (Art. 112). Sufragio obligatorio y secreto (Art. 121)."},
  {f:"¿Cuándo sesiona el Consejo Superior?", b:"Ordinariamente mínimo 1 vez por mes (Art. 72). Falta a 3 sesiones consecutivas = cese del cargo (Art. 74)."},
  {f:"Votos para reformar el Estatuto", b:"2/3 de los miembros de la Asamblea Universitaria (Art. 68a)."},
  {f:"¿Cómo se ingresa a la docencia universitaria?", b:"Por concurso público de oposición (Art. 24). Único mecanismo válido para cargo regular."},
  {f:"Categorías de profesores regulares", b:"Titular · Asociado · Adjunto (Art. 27). + Honorario, Emérito y Consulto (especiales)."},
  {f:"Año sabático — ¿quiénes y cuándo?", b:"Solo profesores TITULARES · cada 6 años (Art. 32). Para investigación o perfeccionamiento."},
  {f:"Dedicaciones docentes (Art. 45)", b:"Exclusiva (total) · Semi-exclusiva (≥16 hs/sem) · Simple (≥6 hs/sem) · Compartida."},
  {f:"3 principios de la Reforma del '18", b:"Autonomía universitaria · Cogobierno · Libre acceso (ingreso irrestricto al grado)."},
  {f:"Cogobierno — ¿quiénes participan?", b:"Los 4 claustros: docentes, graduados, estudiantes y no docentes."},
  {f:"Autonomía (Art. 3) — ¿qué implica?", b:"Darse su propio Estatuto, elegir autoridades, designar personal, crear carreras. NO implica independencia económica total."},
  {f:"Gratuidad universitaria", b:"El GRADO es gratuito (Art. 71-24°). El posgrado puede ser arancelado. La gratuidad del grado es de 1949, no de la Reforma del '18."},
  {f:"Investigación según el Estatuto (Art. 18)", b:"Actividad INHERENTE al docente universitario, no optativa. Art. 19: se fomenta investigación básica y aplicada."},
  {f:"3 funciones de la universidad y la sociedad", b:"Docencia (formación) · Investigación (producción de conocimiento) · Extensión (transferencia a la comunidad)."},
  {f:"1er cuatrimestre 2026 — fechas", b:"Inicio: 16 de marzo · Fin: 26 de junio · Inscripción: 3–20 de marzo."},
  {f:"2do cuatrimestre 2026 — fechas", b:"Inicio: 3 de agosto · Fin: 20 de noviembre · Inscripción: 20 jul.–7 ago."},
  {f:"Turno de exámenes de julio 2026", b:"27–31 de julio. (Agosto: 10–14. Septiembre: 28 sep.–2 oct.)"},
  {f:"Sedes de la UNPSJB", b:"Comodoro Rivadavia (sede central) · Trelew · Puerto Madryn · Esquel. Cada sede tiene un Consejo Zonal (Arts. 99–109)."},
];

let propFcIndex = 0, propFcFlipped = false;

function propShowTab(tab) {
  const isQuiz = tab === 'quiz';
  document.getElementById('prop-quiz-panel').style.display = isQuiz ? 'block' : 'none';
  document.getElementById('prop-flash-panel').style.display = isQuiz ? 'none' : 'block';
  const activeStyle = 'background:rgba(192,57,43,.12);border:none;border-bottom:2px solid #c0392b;color:#c0392b;font-family:"DM Mono",monospace;font-size:.75rem;font-weight:700;padding:10px 20px;cursor:pointer;margin-bottom:-2px;letter-spacing:.05em';
  const inactiveStyle = 'background:transparent;border:none;border-bottom:2px solid transparent;color:#7a6f62;font-family:"DM Mono",monospace;font-size:.75rem;font-weight:700;padding:10px 20px;cursor:pointer;margin-bottom:-2px;letter-spacing:.05em';
  document.getElementById('prop-tab-quiz').style.cssText = isQuiz ? activeStyle : inactiveStyle;
  document.getElementById('prop-tab-flash').style.cssText = isQuiz ? inactiveStyle : activeStyle;
  if (!isQuiz) propRenderFlash();
}

function propRenderQuiz() {
  const c = document.getElementById('prop-q-container');
  if (!c) return;
  c.innerHTML = propQuestions.map((q, qi) => `
    <div style="border:1px solid rgba(192,57,43,.18);border-radius:8px;padding:16px;margin-bottom:14px" id="prop-q${qi}">
      <div style="font-size:.83rem;color:#1a1510;margin-bottom:12px;line-height:1.5"><strong style="color:#c0392b;font-family:'DM Mono',monospace">${qi+1}.</strong> ${q.q}</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${q.opts.map((o,oi) => `
          <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;padding:8px 10px;border-radius:4px;border:1px solid rgba(192,57,43,.15);font-size:.82rem;color:#1a1510;transition:border-color .15s" id="prop-lbl${qi}-${oi}" onmouseover="this.style.borderColor='rgba(192,57,43,.4)'" onmouseout="if(!this.dataset.marked)this.style.borderColor='rgba(192,57,43,.15)'">
            <input type="radio" name="propq${qi}" value="${oi}" style="margin-top:2px;accent-color:#c0392b"> ${o}
          </label>`).join('')}
      </div>
      <div id="prop-exp${qi}" style="display:none;margin-top:10px;background:rgba(192,57,43,.06);border-left:3px solid #c0392b;padding:8px 12px;border-radius:0 4px 4px 0;font-size:.8rem;color:#1a1510;line-height:1.5"></div>
    </div>`).join('');
}

function propCheckAll() {
  let score = 0;
  propQuestions.forEach((q, qi) => {
    const sel = document.querySelector(`input[name="propq${qi}"]:checked`);
    q.opts.forEach((_,oi) => { const l=document.getElementById(`prop-lbl${qi}-${oi}`); l.style.background='transparent'; l.style.borderColor='rgba(192,57,43,.15)'; });
    if (sel) {
      const chosen = parseInt(sel.value);
      document.getElementById(`prop-lbl${qi}-${q.ans}`).style.background='rgba(26,110,74,.1)';
      document.getElementById(`prop-lbl${qi}-${q.ans}`).style.borderColor='#1a6e4a';
      if (chosen === q.ans) score++;
      else { document.getElementById(`prop-lbl${qi}-${chosen}`).style.background='rgba(192,57,43,.12)'; document.getElementById(`prop-lbl${qi}-${chosen}`).style.borderColor='#c0392b'; }
      document.getElementById(`prop-exp${qi}`).innerHTML = q.exp;
      document.getElementById(`prop-exp${qi}`).style.display = 'block';
    }
  });
  const sc = document.getElementById('prop-score');
  const pct = Math.round(score/propQuestions.length*100);
  sc.textContent = `Resultado: ${score}/${propQuestions.length} (${pct}%) — ${pct>=60?'✓ APROBADO':'✗ Seguí repasando'}`;
  sc.style.color = pct>=60 ? '#1a6e4a' : '#c0392b';
  sc.style.display = 'block';
  saveScore('prop', score, propQuestions.length);
}

function propResetQuiz() {
  propQuestions.forEach((_,qi) => {
    document.querySelectorAll(`input[name="propq${qi}"]`).forEach(r => r.checked=false);
    document.getElementById(`prop-exp${qi}`).style.display='none';
    _.opts.forEach((_2,oi) => { const l=document.getElementById(`prop-lbl${qi}-${oi}`); l.style.background='transparent'; l.style.borderColor='rgba(192,57,43,.15)'; });
  });
  document.getElementById('prop-score').style.display='none';
}

function propRenderFlash() {
  propFcFlipped = false;
  const card = propFlashcards[propFcIndex];
  document.getElementById('prop-fc-text').innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:.6rem;color:#c0392b;margin-bottom:10px;letter-spacing:.1em">PREGUNTA</div>${card.f}`;
  document.getElementById('prop-fc-card').style.background = 'rgba(192,57,43,.06)';
  document.getElementById('prop-fc-counter').textContent = `${propFcIndex+1} / ${propFlashcards.length}`;
}

function propFlipCard() {
  propFcFlipped = !propFcFlipped;
  const card = propFlashcards[propFcIndex];
  if (propFcFlipped) {
    document.getElementById('prop-fc-text').innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:.6rem;color:#c8851a;margin-bottom:10px;letter-spacing:.1em">RESPUESTA</div>${card.b}`;
    document.getElementById('prop-fc-card').style.background = 'rgba(192,57,43,.12)';
  } else propRenderFlash();
}

function propNextCard() { propFcIndex = (propFcIndex+1)%propFlashcards.length; propRenderFlash(); }
function propPrevCard() { propFcIndex = (propFcIndex-1+propFlashcards.length)%propFlashcards.length; propRenderFlash(); }

(function() {
  function tryInitProp() {
    const c = document.getElementById('prop-q-container');
    if (c) propRenderQuiz();
    else setTimeout(tryInitProp, 300);
  }
  tryInitProp();
})();


// ── UNIDAD I CONTABILIDAD — QUIZ & FLASHCARDS ──────────────────────────────
const cu1Questions = [
  // ── IT. I — MARCO CONCEPTUAL ──────────────────────────────────────────────
  { sec:"IT. I", q:"¿Cuál es el objetivo básico de la contabilidad según Fowler Newton?", opts:["Cumplir con las normas legales vigentes","Suministrar información útil para la toma de decisiones y el control","Registrar mecánicamente las transacciones del ente","Determinar el resultado del ejercicio económico"], ans:1,
    exp:"El objetivo básico es proporcionar información útil para la toma de decisiones. 'Cumplir con normas legales' es también un objetivo, pero NO el principal." },
  { sec:"IT. I", q:"¿Qué carácter tiene la disciplina contable según la doctrina contemporánea mayoritaria?", opts:["Científico","Artístico","Técnico","Filosófico"], ans:2,
    exp:"La contabilidad es una disciplina TÉCNICA: es un instrumento para obtener cierto tipo de información. No es ciencia (que busca causas) ni arte (que es creativo)." },
  { sec:"IT. I", q:"Los informes contables preparados para suministro a terceros se denominan:", opts:["Informes de gestión","Presupuestos","Estados contables","Balances internos"], ans:2,
    exp:"Los informes contables para terceros se denominan ESTADOS CONTABLES. 'Estados financieros' es la traducción del inglés 'financial statements', menos adecuada en Argentina donde 'financiero' refiere a movimientos de fondos." },
  { sec:"IT. I", q:"Las Normas Contables Profesionales (NCP) en Argentina son sancionadas por:", opts:["El Poder Ejecutivo Nacional","El CPCE de cada provincia y Capital Federal","La AFIP","El Banco Central"], ans:1,
    exp:"Las NCP son sancionadas por el CPCE de cada provincia y Capital Federal, a través de las Resoluciones Técnicas de la FACPCE. Las NCL, en cambio, emanan del Estado y obligan al ente emisor." },
  { sec:"IT. I", q:"El principio de Ente establece que:", opts:["El ente debe ser siempre una persona jurídica","El patrimonio del ente es independiente del patrimonio de sus propietarios","Solo las empresas con fines de lucro son entes contables","El ente debe tener más de un propietario"], ans:1,
    exp:"El principio de Ente establece la clara diferenciación entre el patrimonio del sujeto contable y el de sus propietarios. Los gastos personales del dueño no son gastos de la empresa." },
  { sec:"IT. I", q:"El principio de Empresa en Marcha determina que los activos se valúan:", opts:["A precio de liquidación urgente","A su valor de reposición de mercado","A costo histórico considerando su utilización económica futura","Al valor fiscal según AFIP"], ans:2,
    exp:"Se asume que la empresa continuará operando. Por eso los activos se valúan a costo histórico (valor de uso), no a precio de venta urgente. Si la empresa fuera a liquidarse, el criterio sería el valor realizable neto." },
  { sec:"IT. I", q:"La expresión 'caveat emptor' describe:", opts:["El principio de prudencia contable","La situación previa a 1929 donde el inversor asumía riesgos por falta de información real de las empresas","El sistema de partida doble de Luca Pacioli","El postulado básico de equidad de los PCGA argentinos"], ans:1,
    exp:"'Caveat emptor' = 'Que se cuide el comprador'. Los dueños-administradores no tenían obligación de revelar la situación real. Esta desinformación sistémica fue la causa principal del crack bursátil de 1929." },
  { sec:"IT. I", q:"¿Cuál afirmación sobre los informes contables es INCORRECTA?", opts:["Los estados contables son informes preparados para terceros","Los informes internos pueden incluir datos presupuestados y sus desvíos","Los informes para terceros deben tener el mismo contenido que los de uso interno","Los informes contables pueden incluir también datos no contables"], ans:2,
    exp:"INCORRECTO. Las necesidades de información interna y externa son DISTINTAS, por lo que sus contenidos también lo son. Los informes internos incluyen datos presupuestados, desvíos y explicaciones que no tienen por qué estar en los estados contables." },
  { sec:"IT. I", q:"En la clasificación de PCGA argentina (Biondi), ¿cuántos prerrequisitos existen?", opts:["3","5","7","13"], ans:2,
    exp:"Existen 7 prerrequisitos: Ente, Ejercicio, Moneda de cuenta, Objetividad, Empresa en marcha, Bienes económicos y Exposición. Más 1 postulado (Equidad), 3 principios propiamente dichos y 3 restricciones." },
  { sec:"IT. I", q:"El postulado básico de Equidad establece que:", opts:["Los activos deben estar en equilibrio con los pasivos","La información contable no debe favorecer intereses de algunos usuarios en detrimento de otros","El ente debe distribuir utilidades en partes iguales entre sus socios","Los auditores deben cobrar honorarios equitativos"], ans:1,
    exp:"El postulado de Equidad es la base de todos los PCGA. Establece que la información contable debe confeccionarse de modo que no favorezca intereses de propietarios, acreedores, fisco u otros usuarios en perjuicio de los demás." },

  // ── IT. II — PATRIMONIO: ESTRUCTURA ────────────────────────────────────────
  { sec:"IT. II", q:"La ecuación contable fundamental en su forma estática es:", opts:["Activo = Pasivo","Activo = Pasivo + Patrimonio Neto","Patrimonio Neto = Activo + Pasivo","Activo - Patrimonio Neto = Pasivo + Resultados"], ans:1,
    exp:"A = P + PN es la ecuación contable fundamental estática. Describe la situación patrimonial en un momento dado: los recursos (activo) se financian con obligaciones con terceros (pasivo) y con el aporte de los dueños más resultados acumulados (patrimonio neto)." },
  { sec:"IT. II", q:"¿Cuál es la condición necesaria para que un bien sea considerado ACTIVO del ente?", opts:["Haber sido adquirido mediante un desembolso de dinero","Estar registrado en un documento respaldatorio","Que el ente controle los beneficios que produce, debido a un hecho ya ocurrido","Que el bien sea de propiedad legal del ente"], ans:2,
    exp:"El carácter de activo no depende del costo ni de la propiedad legal. Lo define el CONTROL de beneficios. Ejemplo: un computador recibido en donación es activo aunque no tuvo costo; la fórmula de la Coca-Cola es activo aunque no esté registrada legalmente." },
  { sec:"IT. II", q:"Los pasivos son:", opts:["Todos los bienes que posee el ente","Las obligaciones del ente con terceros que implican entregar recursos en el futuro","El capital aportado por los socios","Los resultados negativos acumulados del ente"], ans:1,
    exp:"Los pasivos son las obligaciones del ente hacia terceros. Para ser reconocido como pasivo debe existir: a) una obligación cierta o contingente, b) que implique entregar recursos en el futuro, c) originada en un hecho ya ocurrido." },
  { sec:"IT. II", q:"¿Cuál de los siguientes es un ejemplo de variación patrimonial PERMUTATIVA?", opts:["Pago de sueldo a un empleado","Compra de mercadería al contado","Cobro de una deuda de un cliente","Donación recibida de un tercero"], ans:2,
    exp:"Una variación permutativa NO modifica el PN: un elemento sube y otro baja por el mismo importe (o cambia de composición). Cobrar una deuda = caja sube, crédito baja. Ambos son activos → el PN no cambia. En cambio pagar sueldos o recibir una donación SÍ modifican el PN (modificativas)." },
  { sec:"IT. II", q:"El resultado del período se determina como:", opts:["Activo final menos Activo inicial","Ingresos menos Costos y Gastos del período","Patrimonio Neto final menos aportes de capital","Ventas menos Costo de Mercadería Vendida únicamente"], ans:1,
    exp:"Resultado = Ingresos – Costos – Gastos del período. Si es positivo = ganancia (aumenta el PN). Si es negativo = pérdida (disminuye el PN). La fórmula más amplia: Resultado = PN final – PN inicial ± aportes/retiros de los propietarios." },
  { sec:"IT. II", q:"Una empresa recibe una donación en efectivo. ¿Cómo afecta al patrimonio?", opts:["Solo aumenta el activo; el PN no varía","Aumenta el activo y simultáneamente aumenta el PN (ganancia)","Aumenta el activo y simultáneamente aumenta el pasivo","Disminuye el pasivo y aumenta el PN"], ans:1,
    exp:"Una donación recibida es una variación MODIFICATIVA: aumenta el activo (caja) Y aumenta el PN (se registra como ganancia). No hay contrapartida en pasivo porque no genera obligación de devolver." },

  // ── IT. III — PARTIDA DOBLE & VARIACIONES ──────────────────────────────────
  { sec:"IT. III", q:"El principio de la partida doble establece que:", opts:["Todos los asientos deben tener dos líneas de texto","Todo hecho económico produce simultáneamente un débito y un crédito de igual importe","Cada cuenta debe tener un debe y un haber con el mismo saldo","Los libros contables deben llevarse en duplicado"], ans:1,
    exp:"La partida doble: todo hecho económico afecta simultáneamente a dos o más cuentas por el mismo importe total. La suma de los débitos (debe) siempre iguala la suma de los créditos (haber) en cada asiento." },
  { sec:"IT. III", q:"En el método de la partida doble, ¿cuándo se DEBITA una cuenta de activo?", opts:["Cuando el activo disminuye","Cuando el activo aumenta","Siempre que haya una venta","Cuando se paga una deuda"], ans:1,
    exp:"Cuentas de ACTIVO: se debitan cuando AUMENTAN y se acreditan cuando DISMINUYEN. Cuentas de PASIVO y PN: es al revés, se acreditan cuando aumentan y se debitan cuando disminuyen. Cuentas de RESULTADO: gastos/pérdidas al debe; ingresos/ganancias al haber." },
  { sec:"IT. III", q:"La ecuación contable dinámica incorpora:", opts:["Solo los movimientos de caja del período","Los resultados del período (ingresos y gastos) que explican la variación del PN","El detalle de todos los activos corrientes","Las amortizaciones de los bienes de uso"], ans:1,
    exp:"La ecuación dinámica: A = P + PN + (Ingresos – Gastos). Incorpora los resultados del período para explicar cómo varía el PN entre dos momentos. La estática (A = P + PN) solo muestra la foto en un momento." },
  { sec:"IT. III", q:"¿Cuál de las siguientes variaciones patrimoniales es MODIFICATIVA con efecto POSITIVO (ganancia)?", opts:["Compra de mercadería a crédito","Pago de una deuda con un proveedor","Venta de mercadería por mayor valor que su costo","Cobro de un cheque en cartera"], ans:2,
    exp:"Una venta genera: aumento de activo (caja o crédito) Y aumento de PN (ingreso por venta menos costo = ganancia). Es modificativa positiva. Comprar a crédito o pagar deudas son permutativas. Cobrar un cheque es permutativa (caja sube, cheques baja)." },

  // ── IT. IV — DOCUMENTOS COMERCIALES ───────────────────────────────────────
  { sec:"IT. IV", q:"¿Cuál es la función principal de los documentos comerciales en contabilidad?", opts:["Servir de decoración en los archivos de la empresa","Ser la fuente de captación de datos del sistema contable y respaldo legal de las operaciones","Reemplazar los libros contables obligatorios","Determinar el resultado del ejercicio en forma directa"], ans:1,
    exp:"Los documentos comerciales son la fuente de captación de datos del sistema contable. Tienen doble función: a) respaldar legalmente las operaciones; b) ser el insumo inicial del proceso de registración contable." },
  { sec:"IT. IV", q:"Una factura tipo A se emite cuando:", opts:["El comprador es consumidor final","El comprador es responsable inscripto en IVA","El comprador es exento de IVA","El comprador es una persona física monotributista"], ans:1,
    exp:"Factura A: emisor responsable inscripto → comprador responsable inscripto (discrimina IVA). Factura B: emisor responsable inscripto → consumidor final o exento. Factura C: emisor monotributista o exento → cualquier comprador." },
  { sec:"IT. IV", q:"¿Qué es una nota de crédito?", opts:["Un documento que aumenta la deuda del comprador","Un documento que el vendedor emite para disminuir el importe de una factura anterior (por devoluciones, descuentos o errores)","Un comprobante bancario de depósito","Un resumen de cuenta mensual"], ans:1,
    exp:"La nota de crédito la emite el vendedor para reducir el importe de una factura anterior. Causas: devolución de mercadería, descuentos posteriores a la factura, errores de facturación. Su efecto es opuesto al de la factura." },
  { sec:"IT. IV", q:"El proceso contable sigue el siguiente orden:", opts:["Registración → Captación → Clasificación → Exposición","Captación de datos → Clasificación → Registración → Exposición en informes","Exposición → Registración → Captación → Clasificación","Clasificación → Captación → Exposición → Registración"], ans:1,
    exp:"El proceso contable tiene etapas secuenciales: 1) Captación de datos (documentos fuente); 2) Clasificación por tipo de hecho económico; 3) Registración en libros contables; 4) Exposición en informes (estados contables). Este orden no puede alterarse." },

  // ── IT. V — CUENTAS & PLAN DE CUENTAS ──────────────────────────────────────
  { sec:"IT. V", q:"¿Qué es una cuenta contable?", opts:["Un registro numérico de movimientos de caja","El elemento básico de registración que agrupa hechos de similar naturaleza económica bajo una denominación convencional","Un estado financiero de cierre de ejercicio","El libro donde se anotan todas las operaciones cronológicamente"], ans:1,
    exp:"Una cuenta es el elemento básico del sistema de registración contable. Agrupa bajo una denominación convencional todos los hechos económicos de similar naturaleza. Tiene una estructura de T con Debe (izquierda) y Haber (derecha)." },
  { sec:"IT. V", q:"Por su naturaleza, las cuentas se clasifican en:", opts:["Abiertas y cerradas","Patrimoniales (activo, pasivo, PN) y de resultado (ingresos y gastos)","Simples y compuestas","Corrientes y no corrientes"], ans:1,
    exp:"Clasificación por naturaleza: Patrimoniales = activo, pasivo, patrimonio neto (integran el balance); De resultado = ingresos/ganancias y gastos/pérdidas (integran el estado de resultados). Al cierre del ejercicio las cuentas de resultado se cancelan contra el PN." },
  { sec:"IT. V", q:"El Libro Diario es:", opts:["El registro donde se anotan los saldos de cada cuenta al cierre del ejercicio","El registro cronológico de todos los asientos contables con sus débitos y créditos","El archivo de documentos comerciales respaldatorios","El registro de inventario de los bienes del ente"], ans:1,
    exp:"El Libro Diario registra en forma CRONOLÓGICA todos los asientos contables (fecha, cuentas debitadas y acreditadas, importes y descripción). Es obligatorio legalmente. Del Diario se pasan los movimientos al Mayor." },
  { sec:"IT. V", q:"El Plan de Cuentas es:", opts:["El resumen anual de todos los movimientos contables","La lista ordenada y codificada de todas las cuentas que utiliza el ente en su sistema contable","El detalle de los documentos comerciales archivados","El cronograma de pagos a proveedores del ente"], ans:1,
    exp:"El Plan de Cuentas es la lista ordenada, codificada y estructurada de todas las cuentas que el ente utiliza para registrar sus operaciones. Su complemento es el Manual de Cuentas, que define el contenido y criterio de uso de cada cuenta." },
  { sec:"IT. V", q:"¿Cuál es la diferencia entre el Libro Diario y el Libro Mayor?", opts:["No hay diferencia, son el mismo registro con distinto nombre","El Diario registra en orden cronológico; el Mayor agrupa por cuenta todos los movimientos de esa cuenta","El Diario es obligatorio; el Mayor es optativo","El Mayor registra cronológicamente; el Diario agrupa por cuenta"], ans:1,
    exp:"Diario = registro CRONOLÓGICO de asientos. Mayor = registro ANALÍTICO POR CUENTA: cada hoja del Mayor corresponde a una cuenta y muestra todos sus débitos y créditos. Del Mayor se obtienen los saldos que se vuelcan al balance de saldos." },
];

const cu1Flashcards = [
  // IT. I
  {sec:"IT. I", f:"Objetivo básico de la contabilidad", b:"Suministrar información ÚTIL para la toma de decisiones y el control. NO es 'cumplir normas legales' (ese es un objetivo secundario)."},
  {sec:"IT. I", f:"Sistema contable — definición", b:"Parte del sistema de información del ente que capta y procesa datos sobre el patrimonio, bienes de terceros en su poder y contingencias."},
  {sec:"IT. I", f:"Estados contables vs. informes contables", b:"Informes contables = género (internos + externos). Estados contables = especie: solo los informes para terceros. 'Estados financieros' es la denominación anglosajona, menos adecuada en Argentina."},
  {sec:"IT. I", f:"Carácter de la contabilidad", b:"TÉCNICA. No es ciencia (la ciencia busca causas; la cont. registra efectos). No es arte (el arte es creativo). Es un instrumento para obtener información."},
  {sec:"IT. I", f:"Contabilidad ≠ Teneduría de libros", b:"Teneduría = parte mecánica del procesamiento (transformar datos en información). Contabilidad es más amplia: incluye criterios de valuación, medición y forma de los informes."},
  {sec:"IT. I", f:"NCP vs. NCL", b:"NCP (Normas Contables Profesionales) = sancionadas por el CPCE/FACPCE, son el sensor del auditor. NCL (Normas Contables Legales) = emanan del Estado, obligan al ente emisor."},
  {sec:"IT. I", f:"Las 3 etapas históricas (Telese)", b:"1ª: Prehistoria → Rev. Industrial (dueño + Estado). 2ª: Rev. Industrial → 1929 (secreto financiero, caveat emptor). 3ª: 1929 → actualidad (PCGA, auditoría independiente, SEC)."},
  {sec:"IT. I", f:"Principio de ENTE", b:"El patrimonio del ente es INDEPENDIENTE del de sus propietarios. Gastos personales del dueño ≠ gastos de la empresa."},
  {sec:"IT. I", f:"Principio de EMPRESA EN MARCHA", b:"Se asume que la empresa continuará operando → activos valuados a costo histórico (valor de uso), NO a precio de liquidación urgente."},
  {sec:"IT. I", f:"Principio de BIENES ECONÓMICOS", b:"Solo se registran bienes con valor económico OBJETIVO, valuables en términos monetarios. Excluye subjetividades (satisfacción, bienestar, afectos)."},
  {sec:"IT. I", f:"Principio de EJERCICIO ECONÓMICO", b:"La vida del ente se divide en períodos iguales (ejercicios) para posibilitar la comparación. Base del devengado y la consistencia."},
  {sec:"IT. I", f:"Clasificación PCGA argentinos (Biondi)", b:"1 postulado (Equidad) + 7 prerrequisitos (Ente, Ejercicio, Moneda, Objetividad, Emp. Marcha, Bienes Econ., Exposición) + 3 principios (Devengado, Realizado, Val. Costo) + 3 restricciones (Prudencia, Materialidad, Consistencia)."},
  {sec:"IT. I", f:"Contenido mínimo de los estados contables", b:"a) Situación patrimonial; b) Evolución del patrimonio; c) Evolución situación financiera; d) Hechos para evaluar pagos futuros a inversores/acreedores; e) Explicaciones de la gerencia."},

  // IT. II
  {sec:"IT. II", f:"Ecuación contable fundamental ESTÁTICA", b:"A = P + PN. Foto del patrimonio en un momento. Activo = recursos controlados. Pasivo = obligaciones con terceros. PN = diferencia = lo que pertenece a los dueños."},
  {sec:"IT. II", f:"Ecuación contable fundamental DINÁMICA", b:"A = P + PN + (Ingresos – Gastos). Incorpora los resultados del período para explicar la variación del PN. Base de la partida doble."},
  {sec:"IT. II", f:"Condición para que algo sea ACTIVO", b:"El ente debe CONTROLAR los beneficios que produce el bien, debido a un hecho ya ocurrido. No requiere costo previo ni propiedad legal."},
  {sec:"IT. II", f:"Variación patrimonial PERMUTATIVA", b:"No modifica el PN: sube un elemento y baja otro por el mismo importe. Ej: cobro de deuda (caja ↑, crédito ↓). Ej: compra a crédito (mercadería ↑, deuda ↑ → ambos lados de la ecuación suben igual)."},
  {sec:"IT. II", f:"Variación patrimonial MODIFICATIVA", b:"Modifica el PN. Positiva (ganancia): ingreso > costo → PN sube. Negativa (pérdida): gasto sin contrapartida → PN baja. Ej: pago de sueldos, venta con ganancia, donación recibida."},
  {sec:"IT. II", f:"Resultado del período", b:"Ingresos – Costos – Gastos. Si > 0 = ganancia (aumenta PN). Si < 0 = pérdida (disminuye PN). También: PN final – PN inicial ± aportes/retiros propietarios."},

  // IT. III
  {sec:"IT. III", f:"Principio de la PARTIDA DOBLE", b:"Todo hecho económico produce simultáneamente un débito y un crédito de igual importe. Suma debe = suma haber en cada asiento. Base de todo sistema contable moderno (Luca Pacioli, 1494)."},
  {sec:"IT. III", f:"Regla del debe y el haber", b:"ACTIVO: debe = aumentos, haber = disminuciones. PASIVO/PN: haber = aumentos, debe = disminuciones. GASTOS/PÉRDIDAS: debe. INGRESOS/GANANCIAS: haber."},
  {sec:"IT. III", f:"Variación permutativa vs. modificativa — diferencia clave", b:"Permutativa: PN no varía (intercambio entre elementos del mismo lado o ambos lados por igual). Modificativa: PN varía (hay resultado: ganancia o pérdida)."},

  // IT. IV
  {sec:"IT. IV", f:"Función de los documentos comerciales", b:"Doble función: 1) Fuente de captación de datos del sistema contable. 2) Respaldo legal de las operaciones. Sin documento → no hay registración válida."},
  {sec:"IT. IV", f:"Factura A / B / C", b:"A: RI → RI (discrimina IVA). B: RI → consumidor final o exento. C: monotributista o exento → cualquier comprador."},
  {sec:"IT. IV", f:"Nota de crédito vs. nota de débito", b:"Nota de crédito: el vendedor reduce la deuda del comprador (devoluciones, descuentos, errores). Nota de débito: el vendedor aumenta la deuda del comprador (intereses, diferencias)."},
  {sec:"IT. IV", f:"Proceso contable — orden secuencial", b:"1) Captación de datos (documentos) → 2) Clasificación → 3) Registración en libros → 4) Exposición en informes. No puede alterarse el orden."},

  // IT. V
  {sec:"IT. V", f:"¿Qué es una cuenta contable?", b:"Elemento básico de registración. Agrupa bajo una denominación convencional todos los hechos económicos de similar naturaleza. Estructura en T: Debe (izquierda) | Haber (derecha)."},
  {sec:"IT. V", f:"Clasificación de cuentas por naturaleza", b:"Patrimoniales (activo, pasivo, PN) → integran el balance. De resultado (ingresos/ganancias y gastos/pérdidas) → integran el estado de resultados. Al cierre se cancelan contra PN."},
  {sec:"IT. V", f:"Libro Diario vs. Libro Mayor", b:"Diario = registro CRONOLÓGICO de asientos (qué se hizo y cuándo). Mayor = registro ANALÍTICO POR CUENTA (todos los movimientos de una cuenta). Del Mayor se extraen los saldos."},
  {sec:"IT. V", f:"Plan de Cuentas y Manual de Cuentas", b:"Plan = lista ordenada y codificada de todas las cuentas del ente. Manual = complemento que define el contenido, función y criterio de uso de cada cuenta."},
  {sec:"IT. V", f:"Libros obligatorios legalmente", b:"Libro Diario, Libro Mayor, Libro de Inventarios y Balances. Deben estar encuadernados, foliados y rubricados por el juez de comercio o registro público según la jurisdicción."},
];

let cu1FcIndex = 0;
let cu1FcFlipped = false;

function cu1ShowTab(tab) {
  const isQuiz = tab === 'quiz';
  document.getElementById('cu1-quiz-panel').style.display = isQuiz ? 'block' : 'none';
  document.getElementById('cu1-flash-panel').style.display = isQuiz ? 'none' : 'block';
  document.getElementById('cu1-tab-quiz').style.cssText = isQuiz
    ? 'background:rgba(26,110,74,.15);border:none;border-bottom:2px solid #1a6e4a;color:#1a6e4a;font-family:"DM Mono",monospace;font-size:.75rem;font-weight:700;padding:10px 20px;cursor:pointer;margin-bottom:-2px;letter-spacing:.05em'
    : 'background:transparent;border:none;border-bottom:2px solid transparent;color:#1a1510;font-family:"DM Mono",monospace;font-size:.75rem;font-weight:700;padding:10px 20px;cursor:pointer;margin-bottom:-2px;letter-spacing:.05em';
  document.getElementById('cu1-tab-flash').style.cssText = isQuiz
    ? 'background:transparent;border:none;border-bottom:2px solid transparent;color:#1a1510;font-family:"DM Mono",monospace;font-size:.75rem;font-weight:700;padding:10px 20px;cursor:pointer;margin-bottom:-2px;letter-spacing:.05em'
    : 'background:rgba(26,110,74,.15);border:none;border-bottom:2px solid #1a6e4a;color:#1a6e4a;font-family:"DM Mono",monospace;font-size:.75rem;font-weight:700;padding:10px 20px;cursor:pointer;margin-bottom:-2px;letter-spacing:.05em';
  if (!isQuiz) cu1RenderFlash();
}

function cu1RenderQuiz() {
  const c = document.getElementById('cu1-q-container');
  if (!c) return;
  const secNames = {'IT. I':'Marco Conceptual','IT. II':'Patrimonio: Estructura y Variaciones','IT. III':'Partida Doble & Variaciones','IT. IV':'Documentos Comerciales','IT. V':'Cuentas & Plan de Cuentas'};
  let html = '', lastSec = '';
  cu1Questions.forEach((q, qi) => {
    if (q.sec !== lastSec) {
      html += `<div style="font-family:'DM Mono',monospace;font-size:.65rem;font-weight:700;letter-spacing:.12em;color:#1a6e4a;text-transform:uppercase;padding:${qi===0?'0':'22px'} 0 8px;border-bottom:2px solid rgba(26,110,74,.2);margin-bottom:14px">${q.sec} — ${secNames[q.sec]||q.sec}</div>`;
      lastSec = q.sec;
    }
    html += `<div style="border:1px solid rgba(26,110,74,.18);border-radius:8px;padding:16px;margin-bottom:14px" id="cu1-q${qi}">
      <div style="font-size:.83rem;color:#1a1510;margin-bottom:12px;line-height:1.5"><strong style="color:#1a6e4a;font-family:'DM Mono',monospace">${qi+1}.</strong> ${q.q}</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${q.opts.map((o,oi) => `
          <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;padding:8px 10px;border-radius:4px;border:1px solid rgba(26,110,74,.15);font-size:.82rem;color:#1a1510;transition:border-color .15s" id="cu1-lbl${qi}-${oi}" onmouseover="this.style.borderColor='rgba(26,110,74,.4)'" onmouseout="if(!this.dataset.marked)this.style.borderColor='rgba(26,110,74,.15)'">
            <input type="radio" name="cu1q${qi}" value="${oi}" style="margin-top:2px;accent-color:#1a6e4a"> ${o}
          </label>`).join('')}
      </div>
      <div id="cu1-exp${qi}" style="display:none;margin-top:10px;background:rgba(26,110,74,.08);border-left:3px solid #1a6e4a;padding:8px 12px;border-radius:0 4px 4px 0;font-size:.8rem;color:#1a1510;line-height:1.5"></div>
    </div>`;
  });
  c.innerHTML = html;
}

function cu1CheckAll() {
  let score = 0;
  cu1Questions.forEach((q, qi) => {
    const sel = document.querySelector(`input[name="cu1q${qi}"]:checked`);
    const expEl = document.getElementById(`cu1-exp${qi}`);
    const box = document.getElementById(`cu1-q${qi}`);
    q.opts.forEach((_,oi) => {
      const lbl = document.getElementById(`cu1-lbl${qi}-${oi}`);
      lbl.style.background = 'transparent';
      lbl.style.borderColor = 'rgba(255,255,255,.07)';
    });
    if (sel) {
      const chosen = parseInt(sel.value);
      document.getElementById(`cu1-lbl${qi}-${q.ans}`).style.background = 'rgba(26,110,74,.18)';
      document.getElementById(`cu1-lbl${qi}-${q.ans}`).style.borderColor = '#1a6e4a';
      if (chosen === q.ans) { score++; }
      else { document.getElementById(`cu1-lbl${qi}-${chosen}`).style.background='rgba(180,50,50,.15)'; document.getElementById(`cu1-lbl${qi}-${chosen}`).style.borderColor='#e05c5c'; }
      expEl.innerHTML = q.exp; expEl.style.display = 'block';
    }
  });
  const sc = document.getElementById('cu1-score');
  const pct = Math.round(score/cu1Questions.length*100);
  sc.textContent = `Resultado: ${score}/${cu1Questions.length} (${pct}%) — ${pct>=60?'✓ APROBADO':'✗ Seguí repasando'}`;
  sc.style.color = pct>=60 ? '#1a6e4a' : '#e05c5c';
  sc.style.display = 'block';
  saveScore('cu1', score, cu1Questions.length);
}

function cu1ResetQuiz() {
  // Nuevo sorteo del banco en cada reset
  cu1Questions.splice(0, cu1Questions.length, ...sortearPreguntas(bancoDePreguntas.cont, 10));
  cu1Questions.forEach((_,qi) => {
    document.querySelectorAll(`input[name="cu1q${qi}"]`).forEach(r => r.checked=false);
    const expEl = document.getElementById(`cu1-exp${qi}`);
    if (expEl) expEl.style.display='none';
    const qb = document.getElementById(`cu1-q${qi}`);
    _.opts.forEach((_2,oi) => { const l=document.getElementById(`cu1-lbl${qi}-${oi}`); if(l){ l.style.background='transparent'; l.style.borderColor='rgba(255,255,255,.07)'; }});
  });
  document.getElementById('cu1-score').style.display='none';
  cu1RenderQuiz();
}

function cu1RenderFlash() {
  cu1FcFlipped = false;
  const card = cu1Flashcards[cu1FcIndex];
  document.getElementById('cu1-fc-text').innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:.6rem;color:#1a6e4a;margin-bottom:6px;letter-spacing:.1em">${card.sec}</div><div style="font-family:'DM Mono',monospace;font-size:.6rem;color:#1a6e4a;margin-bottom:10px;letter-spacing:.1em">PREGUNTA</div>${card.f}`;
  document.getElementById('cu1-fc-card').style.background = 'rgba(26,110,74,.06)';
  document.getElementById('cu1-fc-counter').textContent = `${cu1FcIndex+1} / ${cu1Flashcards.length}`;
}

function cu1FlipCard() {
  cu1FcFlipped = !cu1FcFlipped;
  const card = cu1Flashcards[cu1FcIndex];
  if (cu1FcFlipped) {
    document.getElementById('cu1-fc-text').innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:.6rem;color:#c8a84b;margin-bottom:6px;letter-spacing:.1em">${card.sec}</div><div style="font-family:'DM Mono',monospace;font-size:.6rem;color:#c8a84b;margin-bottom:10px;letter-spacing:.1em">RESPUESTA</div>${card.b}`;
    document.getElementById('cu1-fc-card').style.background = 'rgba(26,110,74,.12)';
  } else { cu1RenderFlash(); }
}

function cu1NextCard() { cu1FcIndex = (cu1FcIndex+1)%cu1Flashcards.length; cu1RenderFlash(); }
function cu1PrevCard() { cu1FcIndex = (cu1FcIndex-1+cu1Flashcards.length)%cu1Flashcards.length; cu1RenderFlash(); }

// Auto-init quiz on load — sortea 10 preguntas del banco
(function() {
  function tryInit() {
    const c = document.getElementById('cu1-q-container');
    if (c) {
      // Reemplazar el array estático con 10 preguntas del banco dinámico
      if (typeof bancoDePreguntas !== 'undefined') {
        cu1Questions.splice(0, cu1Questions.length, ...sortearPreguntas(bancoDePreguntas.cont, 10));
      }
      cu1RenderQuiz();
    } else { setTimeout(tryInit, 300); }
  }
  tryInit();
})();


(function() {
  // ── Dataset de cuentas ─────────────────────────────────────────
  const clfCuentas = [
    { nombre:'Caja',                   tipo:'ACTIVO',    exp:'Caja representa dinero en efectivo disponible. Es un Activo corriente (disponibilidad inmediata).' },
    { nombre:'Banco Cuenta Corriente', tipo:'ACTIVO',    exp:'Depósitos bancarios son Activos corrientes. El banco le debe el saldo a la empresa.' },
    { nombre:'Mercaderías',            tipo:'ACTIVO',    exp:'Las mercaderías son bienes destinados a la venta. Activo corriente (bienes de cambio).' },
    { nombre:'Deudores por Ventas',    tipo:'ACTIVO',    exp:'Crédito a favor de la empresa por ventas aún no cobradas. Activo corriente (crédito).' },
    { nombre:'Documentos a Cobrar',    tipo:'ACTIVO',    exp:'Pagarés o letras a favor de la empresa. Activo corriente o no corriente según vencimiento.' },
    { nombre:'Rodados',                tipo:'ACTIVO',    exp:'Vehículos de la empresa: Activo no corriente (bien de uso), sujeto a depreciación.' },
    { nombre:'Muebles y Útiles',       tipo:'ACTIVO',    exp:'Mobiliario y equipos de oficina: Activo no corriente (bienes de uso).' },
    { nombre:'Inmuebles',              tipo:'ACTIVO',    exp:'Terrenos y edificios propios: Activo no corriente (bienes de uso o inversión).' },
    { nombre:'Instalaciones',          tipo:'ACTIVO',    exp:'Mejoras fijas al inmueble: Activo no corriente (bienes de uso).' },
    { nombre:'Marcas y Patentes',      tipo:'ACTIVO',    exp:'Activo intangible no corriente. Representa un derecho exclusivo de explotación.' },
    { nombre:'Gastos Pagados por Adelantado', tipo:'ACTIVO', exp:'Pago anticipado de servicios futuros (ej: seguro prepago). Activo corriente.' },
    { nombre:'Proveedores',            tipo:'PASIVO',    exp:'Deuda con proveedores de bienes o servicios. Pasivo corriente.' },
    { nombre:'Documentos a Pagar',     tipo:'PASIVO',    exp:'Pagarés o letras emitidos a favor de terceros. Pasivo corriente o no corriente.' },
    { nombre:'Préstamos Bancarios',    tipo:'PASIVO',    exp:'Deuda financiera con entidades bancarias. Pasivo corriente o no corriente según plazo.' },
    { nombre:'Sueldos a Pagar',        tipo:'PASIVO',    exp:'Remuneraciones devengadas y aún no abonadas al personal. Pasivo corriente.' },
    { nombre:'Impuestos a Pagar',      tipo:'PASIVO',    exp:'Obligaciones tributarias (IVA, Ganancias, etc.) aún no canceladas. Pasivo corriente.' },
    { nombre:'Alquileres Cobrados por Adelantado', tipo:'PASIVO', exp:'Cobro anticipado de alquiler: genera una obligación de ceder el uso. Pasivo corriente.' },
    { nombre:'Hipotecas a Pagar',      tipo:'PASIVO',    exp:'Préstamo garantizado con un bien inmueble. Pasivo no corriente.' },
    { nombre:'Capital',                tipo:'PN',        exp:'Aporte original de los propietarios. Componente permanente del Patrimonio Neto.' },
    { nombre:'Reserva Legal',          tipo:'PN',        exp:'Porción de resultados retenidos por ley. Patrimonio Neto, restricción al dividendo.' },
    { nombre:'Resultados No Asignados',tipo:'PN',        exp:'Ganancias acumuladas pendientes de distribución o asignación. Patrimonio Neto.' },
    { nombre:'Ventas',                 tipo:'RESULTADO', exp:'Ingresos por la actividad principal. Resultado positivo (ingreso).' },
    { nombre:'Costo de Mercaderías Vendidas', tipo:'RESULTADO', exp:'Costo directo de los bienes vendidos. Resultado negativo (egreso).' },
    { nombre:'Gastos de Administración', tipo:'RESULTADO', exp:'Sueldos, servicios y gastos generales de la gestión. Resultado negativo.' },
    { nombre:'Alquileres Cedidos',     tipo:'RESULTADO', exp:'Ingresos por ceder el uso de un bien. Resultado positivo (ingreso).' },
    { nombre:'Intereses Ganados',      tipo:'RESULTADO', exp:'Renta financiera obtenida. Resultado positivo (ingreso financiero).' },
    { nombre:'Intereses Perdidos',     tipo:'RESULTADO', exp:'Costo financiero de deudas. Resultado negativo (egreso financiero).' },
    { nombre:'Gastos de Comercialización', tipo:'RESULTADO', exp:'Publicidad, comisiones, fletes de venta. Resultado negativo.' },
    { nombre:'Donaciones Recibidas',   tipo:'RESULTADO', exp:'Según RT N°16 se registran como Ingreso (Resultado positivo) y simultáneamente incrementan el Activo.' },
    { nombre:'Depreciaciones',         tipo:'RESULTADO', exp:'Desgaste de bienes de uso. Resultado negativo (egreso no desembolsable).' },
  ];

  let clfQueue    = [];
  let clfActual   = null;
  let clfRacha    = 0;
  let clfBest     = 0;
  let clfTotal    = 0;
  let clfAciertos = 0;
  let clfWaiting  = false; // bloquea clicks mientras se muestra feedback

  const LS_CLF = 'fce_clf_best_v1';

  function clfLoadBest() {
    const v = localStorage.getItem(LS_CLF);
    if (v) clfBest = parseInt(v) || 0;
    document.getElementById('clf-best').textContent = clfBest;
  }

  function clfSaveBest() {
    if (clfRacha > clfBest) {
      clfBest = clfRacha;
      localStorage.setItem(LS_CLF, clfBest);
      document.getElementById('clf-best').textContent = clfBest;
      if (typeof kpiRefreshRiesgo === 'function') kpiRefreshRiesgo();
    }
  }

  function clfRefillQueue() {
    // Fisher-Yates sobre todas las cuentas
    clfQueue = [...clfCuentas];
    for (let i = clfQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [clfQueue[i], clfQueue[j]] = [clfQueue[j], clfQueue[i]];
    }
  }

  function clfNext() {
    if (clfQueue.length === 0) clfRefillQueue();
    clfActual  = clfQueue.pop();
    clfWaiting = false;

    const card    = document.getElementById('clf-card');
    const cuentaEl= document.getElementById('clf-cuenta');
    const fbEl    = document.getElementById('clf-feedback');
    const nextBtn = document.getElementById('clf-next-btn');

    // Reset visual
    card.style.borderColor    = 'rgba(26,110,74,.2)';
    card.style.background     = 'var(--surface)';
    card.style.boxShadow      = 'none';
    fbEl.style.display        = 'none';
    fbEl.textContent          = '';
    nextBtn.style.display     = 'none';
    cuentaEl.style.opacity    = '0';

    // Habilitar botones
    document.querySelectorAll('.clf-btn').forEach(b => { b.disabled = false; b.style.opacity = '1'; });

    setTimeout(() => {
      cuentaEl.textContent    = clfActual.nombre;
      cuentaEl.style.opacity  = '1';
    }, 80);
  }

  window.clfAnswer = function(tipo) {
    if (clfWaiting || !clfActual) return;
    clfWaiting = true;
    clfTotal++;

    const card    = document.getElementById('clf-card');
    const fbEl    = document.getElementById('clf-feedback');
    const nextBtn = document.getElementById('clf-next-btn');

    // Deshabilitar todos los botones
    document.querySelectorAll('.clf-btn').forEach(b => { b.disabled = true; b.style.opacity = '.45'; });

    if (tipo === clfActual.tipo) {
      // ✓ Correcto
      clfAciertos++;
      clfRacha++;
      if (clfRacha > clfBest) clfSaveBest();
      card.style.borderColor = 'var(--color-ok,#3fb950)';
      card.style.background  = 'var(--color-ok-bg,rgba(63,185,80,.07))';
      card.style.boxShadow   = '0 0 0 4px rgba(var(--color-ok-rgb,63,185,80),.15)';
      fbEl.style.color       = 'var(--color-ok,#3fb950)';
      fbEl.textContent       = '✓ Correcto';
      fbEl.style.display     = 'block';
      // Avanza automáticamente tras 700ms en acierto
      setTimeout(clfNext, 700);
    } else {
      // ✗ Incorrecto
      clfRacha = 0;
      card.style.borderColor = 'var(--color-err,#f85149)';
      card.style.background  = 'var(--color-err-bg,rgba(248,81,73,.06))';
      card.style.boxShadow   = '0 0 0 4px rgba(var(--color-err-rgb,248,81,73),.12)';
      fbEl.style.color       = 'var(--color-err,#f85149)';
      fbEl.innerHTML         = `✗ Es <strong>${clfActual.tipo}</strong>. ${clfActual.exp}`;
      fbEl.style.display     = 'block';
      nextBtn.style.display  = 'inline-block';
    }

    // Actualizar contadores
    document.getElementById('clf-racha').textContent    = clfRacha;
    document.getElementById('clf-best').textContent     = clfBest;
    document.getElementById('clf-intentos').textContent = clfTotal;
    const pct = clfTotal > 0 ? Math.round((clfAciertos / clfTotal) * 100) + '%' : '—';
    document.getElementById('clf-pct').textContent = pct;

    // Animar racha con pulso si > 4
    const rachaBox = document.getElementById('clf-racha-box');
    if (clfRacha > 0 && clfRacha % 5 === 0) {
      rachaBox.style.animation = 'none';
      rachaBox.offsetHeight; // reflow
      rachaBox.style.animation = 'clfPulse .5s ease';
    }
  };

  window.clfNext = clfNext;

  // Init cuando el DOM esté listo
  function tryInitClf() {
    if (document.getElementById('clf-card')) {
      clfLoadBest();
      clfRefillQueue();
      clfNext();
    } else {
      setTimeout(tryInitClf, 80);
    }
  }
  tryInitClf();
})();


  // ===== QUIZ U3 =====
  const quizU3 = [
    { q:"¿Por qué Bourdieu dice que el Estado es un 'asunto impensable'?", opts:["Porque no existe empíricamente","Porque pensamos el Estado con categorías que el propio Estado produce","Porque los marxistas lo negaron","Porque Weber ya lo analizó todo"], ans:1, exp:"Nuestras categorías de percepción tienen muchas posibilidades de ser producto del propio Estado. Pensar sobre él implica usar herramientas que él mismo fabricó." },
    { q:"¿Cómo amplía Bourdieu la definición de Estado de Max Weber?", opts:["Añade el monopolio de la burocracia","Añade el monopolio de la violencia simbólica legítima","Elimina la noción de violencia física","Incorpora la noción de campo económico"], ans:1, exp:"Weber definió al Estado por el monopolio de la violencia física legítima. Bourdieu añade que también posee el monopolio de la violencia simbólica legítima, que es condición de posibilidad de la primera." },
    { q:"¿Qué es el 'nomos' en Bourdieu?", opts:["Un tipo de derecho romano","Un principio de división universalmente reconocido sobre el que no hay discusión","El nombre del campo económico","Una forma de capital cultural"], ans:1, exp:"El nomos es un principio de clasificación social legítimo e incuestionable en los límites de una sociedad: categorías profesionales, títulos, carnet de identidad." },
    { q:"En la investigación sobre vivienda, ¿qué descubre Bourdieu al retroceder en el análisis?", opts:["Que los bancos son monopólicos","Que al final del retroceso estaba el Estado","Que los compradores siempre pagan más","Que el mercado es perfectamente libre"], ans:1, exp:"Lo que empezó como estudio de transacciones individuales se desplazó hasta las condiciones institucionales de producción de oferta y demanda — y al final estaba el Estado." },
    { q:"¿Qué significa que el Estado es un 'campo' y no un 'bloque'?", opts:["Que el Estado es un espacio de cultivo","Que el Estado es un espacio estructurado por oposiciones entre agentes con intereses distintos","Que el Estado no existe","Que el Estado siempre sirve a los dominantes"], ans:1, exp:"El campo administrativo es un espacio de fuerzas y luchas: hay oposiciones entre ministerios, entre estatistas y liberales, entre ingenieros técnicos e inspectores de Hacienda." },
    { q:"¿Qué es el 'giro afectivo' según Arfuch?", opts:["Una danza popular de los '70","Una tendencia que jerarquiza emociones y afecto en ciencias sociales","Un método de análisis lingüístico","Una corriente del psicoanálisis lacaniano"], ans:1, exp:"El affective turn es una tendencia en las ciencias sociales que pone el foco en las emociones y el afecto como objetos centrales, en sintonía con cambios culturales contemporáneos." },
    { q:"¿Cuál es la diferencia principal entre Arfuch y Massumi respecto al afecto?", opts:["Arfuch rechaza a Spinoza; Massumi lo acepta","Para Arfuch, discurso y afecto son co-constitutivos; para Massumi, el afecto es pre-discursivo e independiente del lenguaje","Arfuch estudia emociones básicas; Massumi estudia emociones complejas","No hay diferencia"], ans:1, exp:"Massumi sostiene que el afecto precede al lenguaje y la conciencia. Arfuch rechaza esta separación: el lenguaje es también lugar del afecto; no hay oposición sino co-constitución." },
    { q:"¿Qué es el 'optimismo cruel' de Lauren Berlant?", opts:["Un método terapéutico","Una estructura de apego a objetos de deseo que amenazan el florecimiento personal","Un libro de autoayuda","La actitud optimista ante la crisis neoliberal"], ans:1, exp:"El optimismo cruel nombra la relación con objetos de deseo que sostienen fantasías de buena vida aunque esas ataduras sean en verdad un obstáculo para realizarlas." },
    { q:"¿Por qué Borges dice que toda clasificación del universo es arbitraria?", opts:["Porque los idiomas son imperfectos","Porque no sabemos qué es el universo","Porque las palabras son sonidos arbitrarios","Porque Wilkins era inglés"], ans:1, exp:"Si no sabemos qué es el universo, cualquier clasificación será conjetural. Las taxonomías son humanas y provisorias — útiles, pero no verdades sobre la realidad." },
    { q:"¿Por qué el texto de Borges aparece en el programa de Cs. Sociales junto a Foucault?", opts:["Porque Borges era sociólogo","Porque Foucault escribió Las palabras y las cosas a partir de la risa que le produjo la enciclopedia china de Borges","Porque ambos usaban el método etnográfico","Porque la cátedra añade textos literarios al azar"], ans:1, exp:"Foucault confiesa en el prefacio de Las palabras y las cosas que ese libro nació de la risa ante la enciclopedia china de Borges — que destruye el 'lugar común' donde se apoyan las taxonomías." }
  ];
  let quizU3Idx=0, quizU3Score=0, quizU3Ans=false;
  function renderQuizU3(){
    if(quizU3Idx>=quizU3.length){ endQuizU3(); return; }
    const q=quizU3[quizU3Idx];
    document.getElementById('quiz-u3-q').textContent=(quizU3Idx+1)+'. '+q.q;
    document.getElementById('quiz-u3-prog').textContent=(quizU3Idx+1)+' / '+quizU3.length;
    const c=document.getElementById('quiz-u3-opts'); c.innerHTML='';
    q.opts.forEach((o,i)=>{
      const b=document.createElement('button');
      b.textContent=o; b.dataset.i=i;
      b.style.cssText='background:rgba(167,139,250,.05);border:1px solid rgba(167,139,250,.2);border-radius:5px;padding:8px 12px;font-size:.82rem;cursor:pointer;text-align:left;color:var(--ink);transition:background .15s';
      b.onmouseover=()=>{ if(!quizU3Ans) b.style.background='rgba(167,139,250,.12)'; }
      b.onmouseout=()=>{ if(!quizU3Ans && !b.dataset.sel) b.style.background='rgba(167,139,250,.05)'; }
      b.onclick=()=>answerQuizU3(i,b,q);
      c.appendChild(b);
    });
    document.getElementById('quiz-u3-fb').style.display='none';
    document.getElementById('quiz-u3-next').style.display='none';
    quizU3Ans=false;
  }
  function answerQuizU3(i,btn,q){
    if(quizU3Ans) return; quizU3Ans=true;
    const btns=document.querySelectorAll('#quiz-u3-opts button');
    if(i===q.ans){ btn.style.background='var(--color-ok-bg,rgba(63,185,80,.15))'; btn.style.borderColor='var(--color-ok,#3fb950)'; quizU3Score++; }
    else{ btn.style.background='var(--color-err-bg,rgba(248,81,73,.10))'; btn.style.borderColor='var(--color-err,#f85149)'; btns[q.ans].style.background='var(--color-ok-bg,rgba(63,185,80,.12))'; btns[q.ans].style.borderColor='var(--color-ok,#3fb950)'; }
    const fb=document.getElementById('quiz-u3-fb');
    fb.style.display='block'; fb.style.background=i===q.ans?'var(--color-ok-bg,rgba(63,185,80,.08))':'var(--color-err-bg,rgba(248,81,73,.06))';
    fb.style.borderLeft='3px solid '+(i===q.ans?'var(--color-ok,#3fb950)':'var(--color-err,#f85149)');
    fb.innerHTML=(i===q.ans?'<strong>✓ Correcto</strong> — ':'<strong>✗ Incorrecto</strong> — ')+q.exp;
    document.getElementById('quiz-u3-next').style.display='inline-block';
  }
  function nextQuizU3(){ quizU3Idx++; renderQuizU3(); }
  function endQuizU3(){
    document.getElementById('quiz-u3-q').textContent='';
    document.getElementById('quiz-u3-opts').innerHTML='';
    document.getElementById('quiz-u3-fb').style.display='none';
    document.getElementById('quiz-u3-next').style.display='none';
    document.getElementById('quiz-u3-result').style.display='block';
    const pct=Math.round(quizU3Score/quizU3.length*100);
    document.getElementById('quiz-u3-score').textContent=quizU3Score+'/'+quizU3.length+' — '+pct+'%';
    document.getElementById('quiz-u3-msg').textContent=pct>=70?'¡Buen manejo de los contenidos de U3!':'Repasar Bourdieu, Arfuch y Borges antes del parcial.';
    saveScore('soc-u3', quizU3Score, quizU3.length);
  }
  function restartQuizU3(){ quizU3Idx=0; quizU3Score=0; quizU3Ans=false; document.getElementById('quiz-u3-result').style.display='none'; renderQuizU3(); }
  renderQuizU3();

  // ===== FLASHCARDS U3 =====
  const flashU3=[
    {f:"¿Por qué el Estado es 'impensable' para Bourdieu?",b:"Porque pensamos el Estado con categorías que el propio Estado produce. Nuestras estructuras mentales son en parte producto de él."},
    {f:"Definición de Estado en Bourdieu",b:"Sector del campo del poder que posee el monopolio de la violencia física Y simbólica legítima. También: principio oculto del orden social."},
    {f:"¿Qué es el nomos?",b:"Principio de división social universalmente reconocido e incuestionable en los límites de una sociedad (categorías profesionales, títulos, documentos de identidad)."},
    {f:"Diferencia entre integración lógica y moral (Durkheim/Bourdieu)",b:"Lógica: acuerdo sobre las categorías de percepción de la realidad. Moral: acuerdo sobre valores. El Estado funda ambas."},
    {f:"El Estado como 'campo' vs. 'bloque'",b:"Campo = espacio de oposiciones y luchas entre agentes con intereses distintos (ministerios, cuerpos técnicos). No es un bloque monolítico al servicio de la clase dominante."},
    {f:"Conclusión de la investigación sobre vivienda",b:"Al retroceder en el análisis de transacciones individuales, Bourdieu descubre que al final del retroceso está el Estado estructurando toda la oferta y demanda."},
    {f:"¿Qué es el giro afectivo para Arfuch?",b:"Tendencia en ciencias sociales que jerarquiza emociones y afecto como objetos, vinculada a cambios culturales: talk shows, esfera pública emocional, carisma político."},
    {f:"¿Qué es el 'espacio biográfico'?",b:"Trama simbólica epocal de proliferación narrativa autobiográfica/testimonial: síntoma de reconfiguración de la subjetividad contemporánea (Arfuch 2002)."},
    {f:"Posición de Massumi sobre el afecto",b:"El afecto es pre-personal, pre-consciente, anterior al lenguaje e intención. Fuerza e intensidad spinoziana-deleuziana que no puede realizarse plenamente en el lenguaje."},
    {f:"Posición de Arfuch sobre afecto y discurso",b:"Son co-constitutivos, no opuestos. El lenguaje es también lugar del afecto. Nombrar emociones tiene efectos performativos (Riley: 'language as affect')."},
    {f:"¿Qué hace Sarah Ahmed con las emociones?",b:"Las trata como prácticas sociales y culturales que moldean cuerpos individuales y colectivos. Pregunta no '¿qué son?' sino '¿qué hacen?'"},
    {f:"'Optimismo cruel' de Berlant",b:"Estructura de apego a objetos de deseo que sostienen fantasías de buena vida aunque sean una amenaza real para el florecimiento personal."},
    {f:"¿Por qué toda clasificación es arbitraria según Borges?",b:"Porque no sabemos qué es el universo. Cualquier taxonomía es conjetural y provisional — útil, pero no una verdad sobre la realidad."},
    {f:"¿Qué muestra la 'enciclopedia china' de Borges?",b:"Que la incoherencia de la clasificación no es tanto el absurdo de cada categoría sino la ausencia de un 'lugar común' donde puedan convivir."},
    {f:"Conexión Borges–Foucault",b:"Foucault escribió Las palabras y las cosas a partir de la risa que le produjo leer la enciclopedia china de Borges. Borges plantea literariamente lo que Foucault tematizará filosóficamente: el problema del orden del discurso."},
  ];
  let flashU3Idx=0, flashU3Flipped=false;
  function renderFlashU3(){
    const card=flashU3[flashU3Idx];
    document.getElementById('flash-u3-counter').textContent=(flashU3Idx+1)+' / '+flashU3.length;
    document.getElementById('flash-u3-side').textContent=flashU3Flipped?'Respuesta':'Pregunta';
    document.getElementById('flash-u3-text').textContent=flashU3Flipped?card.b:card.f;
    document.getElementById('flash-u3-card').style.background=flashU3Flipped?'rgba(167,139,250,.1)':'rgba(167,139,250,.03)';
  }
  function flipFlashU3(){ flashU3Flipped=!flashU3Flipped; renderFlashU3(); }
  function nextFlashU3(){ flashU3Idx=(flashU3Idx+1)%flashU3.length; flashU3Flipped=false; renderFlashU3(); }
  function prevFlashU3(){ flashU3Idx=(flashU3Idx-1+flashU3.length)%flashU3.length; flashU3Flipped=false; renderFlashU3(); }
  if (document.readyState !== 'loading' && typeof renderFlashU3 === 'function') renderFlashU3();
  


// ---- NAVIGATION ----
var crumbs = {
  'prop-prog':'Propedéutica › Materiales',
  'prop-plan':'Propedéutica › Materiales',
  'prop-moodle':'Propedéutica › Materiales',
  'prop-resumenes':'Propedéutica › Materiales',
  'prop-conceptos':'Propedéutica › Materiales',
  'cont-prog':'Contabilidad I › Materiales',
  'cont-textos':'Contabilidad I › Materiales',
  'cont-resumenes':'Contabilidad I › Materiales',
  'cont-u2-elementos':'Contabilidad I › Materiales',
  'cont-u2-resumenes':'Contabilidad I › Materiales',
  'cont-u3-it4':'Contabilidad I › Materiales',
  'cont-u3-it5':'Contabilidad I › Materiales',
  'cont-u3-partida':'Contabilidad I › Materiales',
  'cont-conceptos':'Contabilidad I › Materiales',
  'adm-prog':'Administración I › Materiales',
  'adm-textos':'Administración I › Materiales',
  'adm-tp1':'Administración I › Materiales',
  'adm-tp2':'Administración I › Materiales',
  'adm-u1-autores':'Administración I › Materiales',
  'adm-u1-conceptos':'Administración I › Materiales',
  'adm-u1-escuelas':'Administración I › Materiales',
  'adm-u1-trampas':'Administración I › Materiales',
  'soc-prog':'Cs. Sociales › Materiales',
  'soc-textos':'Cs. Sociales › Materiales',
  'soc-resumenes':'Cs. Sociales › Materiales',
  'soc-resumenes-u2':'Cs. Sociales › Materiales',
  'soc-resumenes-u3':'Cs. Sociales › U3 · Saber, Poder y Estado',
  'soc-actividades':'Cs. Sociales › Materiales',
  'soc-conceptos':'Cs. Sociales › Materiales',
  'soc-conceptos-u2':'Cs. Sociales › Materiales',
  'soc-ov':'Cs. Sociales › Materiales',
  'prop-materiales':'Propedéutica › Materiales',
  'cont-materiales':'Contabilidad I › Materiales',
  'soc-materiales':'Cs. Sociales › Materiales',

  home:'Dashboard', 'prop-prog':'Propedéutica › Programa', 'prop-plan':'Propedéutica › Plan de Estudio Completo', 'prop-moodle':'Propedéutica › Aula Virtual · Moodle', 'prop-resumenes':'Propedéutica › Resúmenes', 'prop-conceptos':'Propedéutica › Conceptos', 'prop-quiz':'Propedéutica › Quiz',
  'cont-prog':'Contabilidad › Programa', 'cont-textos':'Contabilidad › Textos Obligatorios', 'cont-resumenes':'Contabilidad › It. I · Marco Conceptual', 'cont-u2-elementos':'Contabilidad › It. II · Elementos del Patrimonio', 'cont-u2-resumenes':'Contabilidad › It. II · Patrimonio & Registración', 'cont-u3-partida':'Contabilidad › It. III · Partida Doble & Variaciones', 'cont-u3-it4':'Contabilidad › It. IV · Documentos Comerciales', 'cont-u3-it5':'Contabilidad › It. V · Cuentas & Plan de Cuentas', 'cont-conceptos':'Contabilidad › Conceptos clave', 'cont-quiz':'Contabilidad › Quiz',
  'adm-materiales':'Administración › Materiales de Estudio', 'adm-prog':'Administración › Programa', 'adm-u1-conceptos':'Administración › U1 · Concepto & Evolución', 'adm-u1-escuelas':'Administración › U1 · Enfoques & Escuelas', 'adm-u1-autores':'Administración › U1 · Autores clave', 'adm-u1-mapa':'Administración › U1 · Mapa conceptual', 'adm-u1-quiz':'Administración › U1 · Quiz & Flashcards', 'adm-u1-trampas':'Administración › U1 · Trampas de parcial', 'adm-textos':'Administración › Textos obligatorios', 'adm-tp1':'Administración › TP1 · La Administración', 'adm-tp2':'Administración › TP2 · Evolución del Pensamiento', 'adm-resumenes':'Administración › Resúmenes', 'adm-conceptos':'Administración › Conceptos', 'adm-quiz':'Administración › Quiz',
  'soc-prog':'Cs. Sociales › Programa', 'soc-textos':'Cs. Sociales › Textos U1 &amp; U2', 'soc-resumenes':'Cs. Sociales › Resúmenes U1', 'soc-conceptos':'Cs. Sociales › Conceptos', 'soc-quiz':'Cs. Sociales › Quiz', 'soc-ov':'Propedéutica › Ed. Superior (Cap.3)', 'soc-actividades':'Cs. Sociales › Actividades Prácticas',
  'cont-materiales':'Contabilidad › Materiales de Estudio',
  'prop-materiales':'Propedéutica › Materiales de Estudio',
  'soc-materiales':'Cs. Sociales › Materiales de Estudio'
};

/* v19.3.0: colors deriva de NEXUS_COLORS — cambiá colores SOLO en NEXUS_COLORS arriba */
var colors = (function() {
  var c = {}; var m = NEXUS_COLORS.materias;
  for (var p in m) c[p] = m[p].h;
  return c;
})();

/* v19.3.1: mapa nombre-de-materia → hex — reemplaza todos los inline colorMaps dispersos
   Uso: NEXUS_NAME_COLORS['Contabilidad']  →  '#58a6ff'
        NEXUS_NAME_COLORS['Cs. Sociales']  →  '#a78bfa'  */
var NEXUS_NAME_COLORS = (function() {
  var map = {}; var m = NEXUS_COLORS.materias;
  for (var p in m) {
    (m[p].names || []).forEach(function(n) { map[n] = m[p].base; });
  }
  return map;
})();

/* v19.3.1: función helper — reemplaza inline maps con fallback limpio */
function nexusColorForMateria(name) {
  return NEXUS_NAME_COLORS[name] || NEXUS_COLORS.materias.home.base;
}

var visited = new Set(['home']);

function goto(id, el, tab) {
  // update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  var _gp = document.getElementById(id);
  if (!_gp) { console.warn('[FCE] goto: page not found:', id); return; }
  _gp.classList.add('active');
  if (typeof N75Hydration !== 'undefined') {
    setTimeout(function() { N75Hydration.onActivate(id); }, 0);
  }
  if (typeof N81SesgoEngine !== 'undefined' && NexusCore.getMateriales()) {
    setTimeout(function() {
      var pg = document.getElementById(id);
      if(pg) N81SesgoEngine.injectNivelacionBanner(pg, N81SesgoEngine.compute());
    }, 700);
  }
  if (typeof N76Urgency !== 'undefined') {
    N76Urgency.reset();
  }
  // update nav items
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  // update topbar
  document.getElementById('crumb').textContent = crumbs[id] || id;
  // update color — NEXUS UI v2: propaga tokens semánticos + vars legacy
  const prefix = id.split('-')[0];
  const color = colors[prefix] || NEXUS_COLORS.materias.prop.base /* v19.3.2 */;
  document.documentElement.style.setProperty('--cur', color);
  document.documentElement.style.setProperty('--cur-s', hexToRgba(color, .1));
  /* v19.3.0: inyectar tokens semánticos de la materia activa */
  nexusSetActiveTokens(NEXUS_COLORS.materias[prefix] || NEXUS_COLORS.materias.home);
  // update topbar crumb color
  var crumbSpan = document.querySelector('.tb-crumb span');
  if (crumbSpan) crumbSpan.style.color = color;
  // v14: topbar border accent class
  var topbar = document.getElementById('topbar');
  if (topbar) {
    topbar.classList.remove('tb-prop','tb-cont','tb-adm','tb-soc','tb-home');
    var tbClass = {prop:'tb-prop',cont:'tb-cont',adm:'tb-adm',soc:'tb-soc',home:'tb-home'}[prefix];
    if (tbClass) topbar.classList.add(tbClass);
  }
  // v14: enhanced breadcrumb — show materia name in color
  var crumbEl = document.getElementById('crumb');
  if (crumbEl) {
    var crumbText = crumbs[id] || id;
    var parts = crumbText.split(' › ');
    if (parts.length >= 2) {
      crumbEl.innerHTML = '<span style="color:'+color+';font-weight:700">'+parts[0]+'</span>'
        + '<span style="color:var(--muted2);margin:0 .3rem">›</span>'
        + '<span style="color:var(--muted)">'+parts.slice(1).join(' › ')+'</span>';
    } else {
      crumbEl.textContent = crumbText;
      crumbEl.style.color = color;
    }
  }
  // track
  visited.add(id);
  updateProgress();
  // close mobile sidebar
  if (window.innerWidth <= 768) document.getElementById('sb').classList.remove('open');
  window.scrollTo(0, 0);
  // pulso del FAB Tutor IA
  const _fab = document.getElementById('ia-fab');
  if (_fab) { _fab.style.transform='scale(.93)'; setTimeout(()=>{ _fab.style.transform=''; },180); }

  // Engine v3: redirect legacy pages → *-materiales, then render
  var _redir = {
    'prop-prog':'prop-materiales','prop-plan':'prop-materiales',
    'prop-moodle':'prop-materiales','prop-resumenes':'prop-materiales',
    'prop-conceptos':'prop-materiales',
    'cont-prog':'cont-materiales','cont-textos':'cont-materiales',
    'cont-resumenes':'cont-materiales','cont-u2-elementos':'cont-materiales',
    'cont-u2-resumenes':'cont-materiales','cont-u3-it4':'cont-materiales',
    'cont-u3-it5':'cont-materiales','cont-u3-partida':'cont-materiales',
    'cont-conceptos':'cont-materiales',
    'adm-prog':'adm-materiales','adm-textos':'adm-materiales',
    'adm-tp1':'adm-materiales','adm-tp2':'adm-materiales',
    'adm-u1-autores':'adm-materiales','adm-u1-conceptos':'adm-materiales',
    'adm-u1-escuelas':'adm-materiales','adm-u1-trampas':'adm-materiales',
    'soc-prog':'soc-materiales','soc-textos':'soc-materiales',
    'soc-resumenes':'soc-materiales','soc-resumenes-u2':'soc-materiales',
    'soc-resumenes-u3':'soc-materiales','soc-actividades':'soc-materiales',
    'soc-conceptos':'soc-materiales','soc-conceptos-u2':'soc-materiales',
    'soc-ov':'soc-materiales'
  };
  var _target = _redir[id] || id;
  if (_target !== id) {
    document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
    var _tp = document.getElementById(_target);
    if (_tp) _tp.classList.add('active');
  }
  if (window.fceRender) window.fceRender(_target);
}

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function updateProgress() {
  const total = Object.keys(crumbs).length;
  const pct = Math.round(visited.size / total * 100);
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-label').textContent = `Material cargado: aprox. ${pct}% explorado`;
}

var _toggleSbLast = 0;
function toggleSb() {
  /* v19.3.2 — debounce 250ms: evita doble-fire por swipe + click simultáneos */
  var now = Date.now();
  if (now - _toggleSbLast < 250) return;
  _toggleSbLast = now;

  var sb = document.getElementById('sb');
  if (!sb) return;
  if (sb.classList.contains('collapsed') || !sb.classList.contains('open')) {
    /* Abrir: quitar collapsed, agregar open */
    sb.classList.remove('collapsed');
    sb.classList.add('open');
    if (typeof _sidebarCollapsed !== 'undefined') { _sidebarCollapsed = false; }
    var toggle = document.getElementById('nexus-menu-toggle');
    if (toggle) toggle.style.display = 'none';
    /* Actualizar main/topbar */
    var main = document.getElementById('main');
    var tb   = document.getElementById('topbar');
    if (main)   main.classList.remove('sb-collapsed');
    if (tb)     tb.classList.remove('sb-collapsed');
  } else {
    /* Cerrar */
    sb.classList.remove('open');
    sb.classList.add('collapsed');
    if (typeof _sidebarCollapsed !== 'undefined') { _sidebarCollapsed = true; }
    var toggleBtn = document.getElementById('nexus-menu-toggle');
    if (toggleBtn) toggleBtn.style.display = 'flex';
    var main2 = document.getElementById('main');
    var tb2   = document.getElementById('topbar');
    if (main2) main2.classList.add('sb-collapsed');
    if (tb2)   tb2.classList.add('sb-collapsed');
  }
}

// ---- SIDEBAR SUBJECT TOGGLE ----
function toggleSubj(el) {
  el.classList.toggle('open');
  const ch = el.nextElementSibling;
  ch.classList.toggle('open');
}

// ---- ACCORDION ----
function toggleAcc(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.classList.contains('acc')) {
    el.classList.toggle('open');
    const arr = el.querySelector('.acc-arr');
    if (arr) arr.style.transform = el.classList.contains('open') ? 'rotate(90deg)' : '';
    return;
  }
  if (el.style.display === 'none' || el.style.display === '') {
    el.style.display = 'block';
    const ico = document.getElementById(id + '-ico');
    if (ico) ico.textContent = '▲';
  } else {
    el.style.display = 'none';
    const ico = document.getElementById(id + '-ico');
    if (ico) ico.textContent = '▼';
  }
}

// ---- QUIZ — Cs. Sociales ----
const sqData = [
  { q:"Según Bachelard, ¿cuál es el PRIMER obstáculo para el conocimiento científico?", opts:["La falta de instrumentos de laboratorio","La experiencia inmediata y básica que parece obvia","La dificultad del lenguaje matemático","La burocracia de las instituciones científicas"], ans:1, exp:"Bachelard señala que la 'observación básica' —lo que percibimos directamente y que 'parece comprenderse'— es el primer obstáculo. La ciencia avanza yendo en contra de esa experiencia inmediata, no a partir de ella." },
  { q:"¿Qué afirma Bachelard sobre la relación entre ciencia y opinión?", opts:["La ciencia debe basarse en la opinión popular para ser válida","La ciencia se opone en absoluto a la opinión porque esta 'traduce necesidades en conocimientos'","La opinión es el punto de partida indispensable del método científico","La ciencia y la opinión son dos modos igualmente válidos de conocimiento"], ans:1, exp:"Para Bachelard, la opinión 'piensa mal; no piensa; traduce necesidades en conocimientos'. El primer obstáculo a superar siempre es la opinión establecida. La ciencia conoce siempre 'en contra' del conocimiento anterior." },
  { q:"Para Angenot, ¿qué es la 'hegemonía discursiva'?", opts:["La ideología de la clase dominante que se impone por la fuerza","Un conjunto de mecanismos unificadores que regulan lo decible y aseguran la división del trabajo discursivo","La norma lingüística fijada por la Real Academia","El control estatal sobre los medios de comunicación"], ans:1, exp:"Angenot define la hegemonía discursiva como el 'conjunto complejo de mecanismos unificadores y reguladores' que aseguran la división del trabajo discursivo y un grado de homogeneización de retóricas y doxas. No es la ideología de una clase, sino aquello que produce lo social como discurso." },
  { q:"¿Qué entiende Angenot por 'tópica' en el discurso social?", opts:["El tema o asunto del que habla un texto","El conjunto de 'lugares comunes' (topos) que funcionan como presupuestos compartidos previos a todo debate","La forma retórica de los discursos políticos","Los géneros literarios que circulan en una época"], ans:1, exp:"La tópica, recuperando a Aristóteles, es el conjunto de 'lugares' (topos) o presupuestos irreductibles del verosímil social. Son los acuerdos tácitos previos que hacen posible cualquier discusión: lo que nadie cuestiona porque 'es evidente'." },
  { q:"¿Cuál es el 'estado abstracto' del espíritu científico según Bachelard?", opts:["El momento en que el científico abandona la ciencia y se vuelve filósofo","El estado en que el espíritu opera con informaciones separadas de la intuición sensible, polemizando con la experiencia inmediata","El período histórico de la Antigüedad clásica donde nació la ciencia","La etapa en que el científico formula hipótesis sin verificarlas"], ans:1, exp:"El 'estado abstracto' es el tercer y más avanzado estadio: el espíritu emprende informaciones voluntariamente separadas de la intuición del espacio real, desligadas de la experiencia inmediata. Bachelard lo sitúa a partir de 1905 con la Relatividad de Einstein." },
  { q:"Según Angenot, ¿qué significa que 'todo lenguaje es ideológico' (retomando a Bajtín/Volóshinov)?", opts:["Que todos los textos sirven a los intereses de los partidos políticos","Que el ámbito de la ideología coincide con el de los signos: todo lo que se analiza como lenguaje lleva la marca de posiciones sociales","Que la ideología es un fenómeno solo lingüístico, sin base material","Que el lenguaje científico es el único que puede ser objetivo"], ans:1, exp:"Retomando a Bajtín/Volóshinov, Angenot sostiene que 'todo lo que se analiza como signo, lenguaje y discurso es ideológico'. Los tipos de enunciados, los modos de verbalizarlos, las gnoseologías subyacentes: todo lleva la marca de posiciones y apuestas sociales." },
  { q:"¿Qué son los 'fetiches y tabúes' en el esquema de Angenot?", opts:["Objetos de culto en sociedades primitivas que el discurso social excluye","Objetos temáticos 'intocables': unos glorificados (Patria, Ciencia) y otros proscritos (locura, perversión), que organizan lo decible","Las palabras prohibidas por la censura oficial en cada régimen","Los géneros literarios de mayor y menor prestigio cultural"], ans:1, exp:"Fetiches y tabúes son las dos formas del 'sacer', lo intocable: la Patria, el Ejército, la Ciencia son fetiches; el sexo, la locura, la perversión son tabúes. Son producidos por el discurso social mismo y organizan profundamente lo que puede o no puede decirse." },
  { q:"¿Por qué Bourdieu critica tanto a Saussure como a Chomsky en 'La lengua legítima'?", opts:["Porque ambos son franceses y Bourdieu quería diferenciarse nacionalmente","Porque ambos ignoran las condiciones sociales de producción del lenguaje: Saussure abstrae la lengua del habla y Chomsky postula un hablante ideal en una comunidad homogénea","Porque ambos defienden que el lenguaje es un sistema neutro sin poder simbólico","Porque sus teorías son demasiado matemáticas y poco sociológicas"], ans:1, exp:"Para Bourdieu, Saussure separa artificialmente la 'lengua' (sistema abstracto) del 'habla' (uso concreto), borrando las relaciones de poder. Chomsky postula un hablante-oyente ideal en una comunidad homogénea: otra abstracción que ignora la distribución desigual del capital lingüístico." },
  { q:"¿Qué es el 'mercado lingüístico' para Bourdieu?", opts:["El mercado editorial donde se compran y venden libros","El espacio social donde los intercambios lingüísticos son relaciones de fuerza simbólica: los enunciados tienen un 'precio' según quién los emite y en qué contexto","La oferta y demanda de traductores e intérpretes en el mercado laboral","El conjunto de diccionarios y gramáticas que regulan el uso correcto del idioma"], ans:1, exp:"En el mercado lingüístico, los enunciados no tienen solo valor comunicativo: tienen un precio simbólico según el capital lingüístico del hablante, el campo en que se emiten y la audiencia. No todos los hablantes producen enunciados con igual valor: la lengua legítima es la variedad que impone los criterios de evaluación." },
  { q:"¿Qué es el 'efecto de legitimidad' que describe Bourdieu en el texto sobre la lectura?", opts:["El efecto que tiene leer libros legítimos sobre la movilidad social del lector","El fenómeno por el cual al responder qué leen, las personas declaran lo que les parece legítimo mencionar, no lo que verdaderamente leen","La tendencia de los editores a publicar solo libros académicamente reconocidos","El efecto de las bibliotecas públicas en la democratización de la lectura"], ans:1, exp:"Cuando se pregunta a alguien qué lee, entiende: '¿qué de lo que leo es literatura legítima y merece ser mencionado?'. Las respuestas no reflejan las prácticas reales sino la distancia entre lo que realmente se consume y lo que se considera declarable. Esto hace que toda estadística sobre lectura deba tomarse con cautela." },
  { q:"Según Bourdieu y Chartier, ¿cuál es la 'paradoja del sistema escolar' respecto de la lectura?", opts:["Que la escuela enseña a leer pero no provee libros gratuitos","Que al convertirse en la vía principal de acceso a la lectura, destruye una forma de necesidad lectora popular para crear otra más abstracta, dejando a muchos 'entre dos culturas'","Que los mejores lectores suelen ser los que menos fueron a la escuela","Que la escuela promueve la lectura de ficción en detrimento de los textos científicos"], ans:1, exp:"La escuela erradica la necesidad popular de lectura (el libro como guía de vida, depositario de secretos mágicos) para crear otra forma más escolar y abstracta. El resultado paradójico: muchos quedan entre dos culturas —la originaria fue destruida y la erudita no fue completamente apropiada." },
  { q:"¿Qué significa la 'minoría de edad' según Kant en '¿Qué es la Ilustración?'?", opts:["Ser menor de 18 años según la ley civil","La incapacidad de servirse del propio entendimiento sin la guía de otro, sostenida por pereza y cobardía","No tener acceso a la educación formal","Pertenecer a un grupo social subordinado políticamente"], ans:1, exp:"Para Kant la minoría de edad no es biológica sino intelectual y moral: es la incapacidad de pensar por uno mismo sin depender de una autoridad externa. La clave es que es 'autoculpable': no la impone nadie, la sostiene el propio sujeto por comodidad." },
  { q:"¿Cómo redefine Foucault la Ilustración en su texto de 1984?", opts:["Como un período histórico ya superado que no tiene relevancia actual","Como una actitud filosófica permanente de interrogación crítica del presente: ¿por qué las cosas son como son? ¿Podrían ser de otro modo?","Como el triunfo definitivo de la razón sobre la religión en el siglo XVIII","Como un proyecto político de emancipación que debe completarse"], ans:1, exp:"Foucault toma el texto de Kant y lo convierte en un método filosófico permanente: la actitud crítica de la modernidad no es un período histórico sino una disposición a interrogar los límites históricos y contingentes que se presentan como naturales o necesarios." },
  { q:"¿Qué es la 'episteme' para Foucault?", opts:["El conjunto de conocimientos verificados de una época","El sistema inconsciente de relaciones que en una época determina qué puede considerarse conocimiento válido y qué relaciones son posibles entre los saberes","La ideología dominante de una clase social","El método científico oficial de una disciplina"], ans:1, exp:"La episteme no es una visión del mundo ni una ideología: es la estructura inconsciente del saber de una época, el suelo sobre el cual se construyen todas las teorías. Foucault identifica tres epistemes en la historia occidental: renacentista (semejanzas), clásica (representación y orden) y moderna (condiciones de posibilidad)." },
  { q:"¿Qué caracteriza al 'poder disciplinario' según Foucault?", opts:["Opera exclusivamente a través de leyes y castigos físicos espectaculares","Actúa de manera continua y minuciosa sobre los cuerpos individuales: organiza espacios, controla tiempos, vigila y normaliza","Es un poder ejercido solo por el Estado central sobre la sociedad civil","Funciona únicamente en prisiones y hospitales psiquiátricos"], ans:1, exp:"El poder disciplinario surgido en los siglos XVIII-XIX actúa sobre cuerpos individuales organizando espacios (cada individuo en su lugar), controlando tiempos (horarios precisos), ejerciendo vigilancia jerárquica y sancionando las desviaciones respecto a una norma. Su eficacia está en ser continuo e invisible." },
  { q:"¿Qué entiende Marcuse por 'racionalidad tecnológica'?", opts:["La capacidad de los ingenieros para diseñar máquinas eficientes","Una forma de pensar el mundo donde la eficiencia y el rendimiento son los valores supremos, que funciona como forma de dominación política","El conjunto de técnicas científicas utilizadas en la producción industrial","La ideología tecnocrática de los gobiernos modernos"], ans:1, exp:"Para Marcuse, la racionalidad tecnológica no es una herramienta neutral sino una forma de organizar el pensamiento y la sociedad. Al convertir la eficiencia y el rendimiento en criterios universales, elimina el pensamiento crítico y produce sujetos integrados al sistema: el 'hombre unidimensional'." },
  { q:"¿Qué significa para Marcuse que el capitalismo produce 'necesidades falsas'?", opts:["Que las personas compran productos defectuosos por publicidad engañosa","Que el sistema crea necesidades de consumo que encadenan al individuo al orden existente, impidiendo el desarrollo de necesidades genuinas de libertad y pensamiento crítico","Que la pobreza impide a las personas satisfacer sus necesidades reales","Que el marketing manipula a los consumidores con información falsa"], ans:1, exp:"Las necesidades falsas son aquellas que el sistema implanta en los individuos para perpetuarse: el consumo compulsivo, el entretenimiento alienante, la identificación con los valores dominantes. Se oponen a las necesidades verdaderas de autonomía, pensamiento crítico e imaginación de alternativas." },
  { q:"¿Cuál es la tesis central de 'Los Herederos' de Bourdieu y Passeron?", opts:["Que la universidad es el único lugar de movilidad social real en las sociedades modernas","Que el sistema educativo no suprime las desigualdades sociales sino que las reproduce y legitima, convirtiendo el privilegio de clase en aparente mérito individual","Que los estudiantes universitarios heredan biológicamente las capacidades intelectuales de sus padres","Que la reforma del sistema educativo puede eliminar las desigualdades de origen"], ans:1, exp:"La tesis central es que la educación no democratiza sino que reproduce: convierte diferencias de clase en diferencias de 'talento' o 'aptitud'. La igualdad formal de acceso puede ser el mejor instrumento de legitimación del privilegio porque hace aparecer como mérito individual lo que es herencia cultural." },
  { q:"¿Qué es la 'construcción social de la realidad' según Berger y Luckmann?", opts:["Una teoría que afirma que la realidad física no existe independientemente de la mente humana","La tesis de que la realidad humana —las instituciones, los roles, el sentido común— es producida colectivamente a través de prácticas sociales históricas","Una posición filosófica idealista que niega la existencia del mundo material","La afirmación de que la ciencia construye modelos que no corresponden a la realidad"], ans:1, exp:"Para Berger y Luckmann, la realidad social no es un dato natural: es construida históricamente por los seres humanos a través de sus prácticas, su lenguaje y sus instituciones. Esta realidad construida se presenta luego como objetiva, externa y coercitiva: lo que Durkheim llamaba 'hecho social'." },
  { q:"¿Qué es la 'privatización del estrés' según Mark Fisher?", opts:["La venta de servicios de salud mental por empresas privadas","El mecanismo por el cual el capitalismo convierte problemas sociales estructurales (precariedad, desempleo) en problemas individuales (ansiedad, depresión), desviando la crítica al sistema","La privatización de los hospitales psiquiátricos en el neoliberalismo","La tendencia de las personas a ocultar su estrés en el ámbito laboral"], ans:1, exp:"Fisher muestra que el capitalismo neoliberal 'privatiza el estrés' al presentar el malestar estructuralmente producido como un problema personal: la solución se busca en la farmacología o la terapia individual, nunca en el cambio sistémico. Esto despolitiza el sufrimiento y sostiene el realismo capitalista." },
  { q:"¿Cuál es el 'giro afectivo' en las ciencias sociales según Arfuch?", opts:["El abandono del análisis estructural en favor de los relatos biográficos individuales","El desplazamiento teórico hacia el estudio de las emociones y afectos como dimensiones constitutivas de lo social y lo político, no meros acompañantes subjetivos de procesos 'reales'","La influencia del psicoanálisis en la sociología contemporánea","La tendencia de los medios a privilegiar historias emotivas sobre análisis racionales"], ans:1, exp:"El giro afectivo propone que las emociones —miedo, indignación, esperanza, vergüenza— son fuerzas que mueven a los actores sociales, organizan las relaciones políticas y producen el orden social. No son epifenómenos de procesos económicos o racionales: son constitutivas de lo social mismo." }
];

let sqAnswered = Array(sqData.length).fill(false);
let sqCorrect = 0;

function buildSQ() {
  const c = document.getElementById('sq-container');
  sqData.forEach((q,i) => {
    const card = document.createElement('div'); card.className = 'qcard';
    const qq = document.createElement('div'); qq.className = 'q-q'; qq.textContent = `${i+1}. ${q.q}`; card.appendChild(qq);
    const opts = document.createElement('div'); opts.className = 'q-opts';
    q.opts.forEach((o,j) => {
      const btn = document.createElement('button'); btn.className = 'qopt'; btn.textContent = o;
      btn.onclick = () => sqAnswer(i,j,btn,opts);
      opts.appendChild(btn);
    });
    card.appendChild(opts);
    const fb = document.createElement('div'); fb.className = 'q-fb'; fb.id = 'sqfb'+i; card.appendChild(fb);
    c.appendChild(card);
  });
}

function sqAnswer(qi, chosen, btn, opts) {
  if (sqAnswered[qi]) return;
  sqAnswered[qi] = true;
  opts.querySelectorAll('.qopt').forEach(b => b.disabled = true);
  const fb = document.getElementById('sqfb'+qi);
  if (chosen === sqData[qi].ans) { btn.classList.add('correct'); fb.className='q-fb show ok'; fb.textContent='✓ Correcto. '+sqData[qi].exp; sqCorrect++; }
  else { btn.classList.add('wrong'); opts.querySelectorAll('.qopt')[sqData[qi].ans].classList.add('correct'); fb.className='q-fb show no'; fb.textContent='✗ Incorrecto. '+sqData[qi].exp; }
  const done = sqAnswered.filter(Boolean).length;
  document.getElementById('sq-prog').style.width = (done/sqData.length*100)+'%';
  document.getElementById('sq-label').textContent = `${sqCorrect} correctas de ${done} respondidas`;
}

// ---- FLASHCARDS ----
const fcData = [
  { q:"Bachelard dice: 'Lo real no es jamás lo que podría creerse, sino siempre lo que debiera haberse pensado.' ¿Qué implica esto para la ciencia?", a:"Implica que la ciencia no parte de la observación ingenua sino de la crítica al conocimiento previo. El conocimiento científico siempre es un 'arrepentimiento intelectual': se conoce en contra de un conocimiento anterior. Lo real aparece solo después de destruir los prejuicios que lo oscurecían." },
  { q:"Explicá con tus palabras los tres 'estados de alma' del científico según Bachelard.", a:"(1) Alma pueril o mundana: curiosidad ingenua, se asombra, colecciona datos, es pasiva ante lo que piensa. (2) Alma profesoral: dogmática, fija en sus primeras abstracciones, repite su saber y lo impone sin cuestionarlo. (3) Alma en trance de abstraer: pone en duda permanente sus propias conclusiones, sabe que la abstracción es un 'deber'. Solo este tercer estado es el genuinamente científico." },
  { q:"¿Por qué Angenot dice que la hegemonía discursiva es 'una denegación de sí misma'?", a:"Porque los discursos modernos sostienen un axioma metadiscursivo: 'todo puede decirse', 'hay libertad de expresión'. Esta creencia oculta la presión hegemónica real. La hegemonía funciona mejor cuando nadie la percibe como tal: los sujetos la viven como 'el modo natural de hablar', no como una imposición. Por eso Angenot la compara con la magia negra: sus efectos funcionan porque nadie los ve." },
  { q:"¿Cómo se relacionan los conceptos de 'tópica' y 'doxa' en Angenot?", a:"La tópica es el repertorio de 'lugares comunes' (topos) que funcionan como presupuestos compartidos en todo debate: lo que nadie cuestiona porque 'es evidente'. La doxa es lo que 'cae de maduro', lo que se predica a los conversos que ya lo creen. Ambos apuntan al mismo fenómeno: los presupuestos implícitos que hacen posible el discurso social pero que él mismo oculta como construcción." },
  { q:"¿Qué diferencia Angenot entre 'intertextualidad' e 'interdiscursividad'?", a:"La intertextualidad es la circulación y transformación de ideologemas (pequeñas unidades significantes) entre textos. La interdiscursividad es la interacción y mutua influencia entre campos discursivos enteros. La interdiscursividad opera a un nivel más estructural: no es que un texto cite a otro, sino que los modos de razonar y las premisas de un campo penetran y reorganizan otros campos." },
  { q:"¿Por qué Bachelard dice que el espíritu científico 'nunca es joven' cuando se presenta ante la cultura científica?", a:"Porque llega cargado de prejuicios, opiniones e imágenes ya constituidas: 'tiene la edad de sus prejuicios'. La cultura cotidiana nos llena de respuestas antes de que hayamos formulado las preguntas. Por eso acceder a la ciencia implica 'rejuvenecer espiritualmente': aceptar una ruptura brusca que contradice ese pasado acumulado." },
  { q:"Explicá cómo funciona la 'lengua legítima' como mecanismo de reproducción de la desigualdad social según Bourdieu.", a:"La lengua legítima es la variedad lingüística impuesta por los grupos dominantes y reproducida por el sistema educativo. Al sancionar los 'errores', la escuela produce una distinción entre quienes conocen la norma legítima y quienes solo la reconocen sin dominarla. Esto crea vergüenza lingüística, autocensura e hipercorrección en los grupos dominados. La desigualdad lingüística se naturaliza como diferencia de 'talento' o 'cultura', ocultando su origen de clase." },
  { q:"¿Qué implica para Bourdieu que el lenguaje sea 'performativo'? Relacionalo con el concepto de lengua legítima.", a:"La performatividad del lenguaje significa que las palabras no solo describen la realidad: la producen. Los enunciados producidos en la variedad legítima tienen poder institucional para hacer cosas: nombrar, clasificar, autorizar, excluir. No es solo que se 'comuniquen mejor': es que producen efectos de reconocimiento y autoridad que los enunciados en variedades ilegítimas no producen." },
  { q:"¿Qué es una 'episteme' para Foucault y por qué cambia históricamente?", a:"La episteme es la estructura inconsciente del saber de una época: el conjunto de relaciones que determina qué puede considerarse conocimiento válido y qué formas de racionalidad son posibles. Cambia históricamente porque no depende de la voluntad de ningún pensador individual: es el suelo sobre el que todos piensan, incluidos los más revolucionarios. Cuando ese suelo se transforma —por razones históricas múltiples— la episteme cambia en bloque, produciendo una ruptura discontinua." },
  { q:"¿Qué diferencia al 'poder disciplinario' del poder soberano tradicional según Foucault?", a:"El poder soberano operaba mediante la espectacularidad del castigo físico ('hacer morir o dejar vivir'): tortura pública, ejecución, confiscación. El poder disciplinario opera de manera continua, invisible y productiva sobre los cuerpos individuales: no espera la transgresión para castigar sino que actúa permanentemente organizando espacios, tiempos y gestos para producir cuerpos dóciles y útiles. Su paradigma es el panóptico: la vigilancia constante que no necesita ejecutarse porque el vigilado sabe que puede ser observado." },
  { q:"¿Qué es el 'hombre unidimensional' en Marcuse? ¿Por qué es 'unidimensional'?", a:"El hombre unidimensional es el producto del capitalismo avanzado: un individuo completamente integrado al sistema que ha perdido la capacidad de imaginar alternativas y de negar el orden existente. Es 'unidimensional' porque ha perdido la segunda dimensión: la negación, la crítica, la tensión entre lo que es y lo que podría ser. Todo se reduce a la dimensión de lo real existente, percibido como natural y necesario." },
  { q:"¿Por qué para Los Herederos la elección de carrera universitaria no es verdaderamente libre?", a:"Porque lo que llamamos 'vocación' es en realidad el resultado de posibilidades objetivas interiorizadas a lo largo de la vida: elegimos dentro de lo que sentimos como posible y adecuado para alguien de nuestro origen. Los hijos de familias cultivadas 'quieren' estudiar carreras de prestigio porque crecieron en un ambiente donde esas carreras eran una presencia cotidiana positiva. La libertad de elección existe formalmente pero opera dentro de límites que la estructura social impone y que se experimentan como disposiciones naturales." },
  { q:"¿Cómo define Berger y Luckmann la vida cotidiana como 'suprema realidad'?", a:"La vida cotidiana es 'suprema realidad' porque es la realidad que experimentamos como la más consistente, la más obvia, la más segura: el mundo que damos por sentado sin someterlo a duda. Sus características son: presentarse de manera ordenada y coherente, ser intersubjetiva (compartida con otros), tener una estructura espacial y temporal estable, y organizarse alrededor de tipificaciones que permiten relacionarse con otros sin negociar cada vez desde cero." },
  { q:"¿Cómo se materializa la crisis del 2001 sobre los cuerpos según Scribano?", a:"La crisis no fue solo económica sino corporal: produjo hambre real, agotamiento, miedo físico, privación sensorial. Los 'cuerpos que aguantan' aprendieron a funcionar con menos: una adaptación que al mismo tiempo reproduce la dominación. La crisis también produjo experiencias corporales colectivas nuevas: cacerolazos, piquetes, asambleas, como expresiones de sensaciones compartidas —indignación, humillación, rabia— que se volvieron políticas." },
  { q:"¿Qué tiene en común la crítica de Marcuse a la racionalidad tecnológica con la crítica de Foucault al poder disciplinario?", a:"Ambos analizan formas de poder que no operan principalmente por represión sino por producción de sujetos. Marcuse muestra cómo la racionalidad tecnológica produce individuos que se integran voluntariamente al sistema porque han perdido la capacidad crítica. Foucault muestra cómo el poder disciplinario produce cuerpos dóciles que se auto-vigilan y se auto-corrigen. En ambos casos, el poder más eficaz es el que no necesita ejercerse desde afuera porque ya está incorporado como segunda naturaleza." }
];

let fcIdx = -1;

function buildFC() {
  const c = document.getElementById('fc-container');
  fcData.forEach((f,i) => {
    const card = document.createElement('div'); card.className = 'fc-card'; card.id = 'fc'+i;
    const q = document.createElement('div'); q.className = 'fc-q'; q.textContent = `"${f.q}"`; card.appendChild(q);
    const showBtn = document.createElement('button'); showBtn.className = 'show-a'; showBtn.textContent = 'VER RESPUESTA';
    showBtn.onclick = () => { document.getElementById('fca'+i).classList.add('vis'); };
    card.appendChild(showBtn);
    const a = document.createElement('div'); a.className = 'fc-a'; a.id = 'fca'+i; a.textContent = f.a; card.appendChild(a);
    c.appendChild(card);
  });
}

function nextFC() {
  if (fcIdx >= 0) document.getElementById('fc'+fcIdx).classList.remove('vis');
  fcIdx = (fcIdx+1) % fcData.length;
  const card = document.getElementById('fc'+fcIdx);
  card.classList.add('vis');
  document.getElementById('fca'+fcIdx).classList.remove('vis');
}

// =================== QUIZ U2 ===================
const sq2Data = [
  { q:"¿Cuál es el proceso dialéctico central de Berger y Luckmann?", opts:["Objetivación → Legitimación → Institucionalización","Externalización → Objetivación → Internalización","Socialización → Internacionalización → Normalización","Construcción → Deconstrucción → Reconstrucción"], ans:1, exp:"La dialéctica fundamental es externalización (el ser humano se proyecta hacia el mundo), objetivación (ese mundo se consolida como realidad exterior), internalización (el individuo lo reincorpora como su mundo subjetivo). La paradoja: la sociedad es producto humano, pero el ser humano es producto de la sociedad." },
  { q:"Para Berger y Luckmann, ¿qué es la 'legitimación'?", opts:["El reconocimiento legal de una institución por parte del Estado","El conjunto de mecanismos que justifican el orden institucional, haciéndolo aparecer como natural, necesario o sagrado","El proceso por el que las normas sociales se convierten en leyes","La aprobación popular de una forma de gobierno"], ans:1, exp:"La legitimación responde a la pregunta '¿por qué las cosas son así y no de otra manera?'. Va desde los refranes del sentido común ('así se hacen las cosas') hasta los universos simbólicos (religión, filosofía, ciencia) que integran toda la realidad en un marco de sentido totalizante." },
  { q:"¿Qué es un 'universo simbólico' para Berger y Luckmann?", opts:["El conjunto de símbolos culturales de una sociedad (banderas, monumentos, etc.)","El sistema de significado totalizante (religión, filosofía, ciencia) que integra toda la realidad social en un orden coherente y le otorga sentido último","El lenguaje simbólico utilizado en rituales religiosos","El mundo del arte y la cultura de élite"], ans:1, exp:"Los universos simbólicos son el nivel más alto de legitimación: grandes sistemas teóricos (religión, filosofía, ciencia) que ordenan toda la realidad en un cosmos coherente. Hacen que el orden institucional parezca inevitable porque lo sitúan en un marco cósmico, histórico o natural que lo trasciende y justifica." },
  { q:"¿En qué consiste la tesis central de Bourdieu sobre el campo científico?", opts:["Que la ciencia es una actividad completamente neutral y objetiva, separada de la sociedad","Que la producción científica ocurre dentro de un campo social con relaciones de fuerza, capitales específicos y estrategias, igual que cualquier otro campo social","Que los científicos actúan siempre movidos por intereses económicos personales","Que el conocimiento científico es imposible porque está siempre determinado por la ideología"], ans:1, exp:"Bourdieu propone que el campo científico es un microcosmos social con sus propias leyes, jerarquías y disputas por el capital científico. No está separado de la sociedad pero tampoco está mecánicamente determinado por ella: tiene autonomía relativa. Comprenderlo exige aplicarle el mismo análisis sociológico que a cualquier campo." },
  { q:"¿Cuál es la diferencia entre capital científico 'puro' e 'institucional' según Bourdieu?", opts:["El capital puro es teórico; el institucional, aplicado","El capital puro es reconocimiento de pares por contribuciones al conocimiento (publicaciones, citaciones, descubrimientos); el institucional es poder sobre las instancias científicas (cargos, jurados, recursos)","El capital puro es privado; el institucional, público","El capital puro es el de los científicos de elite; el institucional, el de los medios"], ans:1, exp:"El capital científico puro es el de la reputación intelectual entre pares. El capital institucional o temporal es el poder burocrático sobre las instituciones del campo. Estas dos formas no necesariamente coinciden: puede haber gran reputación intelectual sin poder institucional, y viceversa." },
  { q:"¿Qué son los 'doxósofos' en Bourdieu?", opts:["Científicos que trabajan en el campo de la doxa (estudios de opinión pública)","Intelectuales que producen 'sabiduría de la opinión dominante': aparentan rigor científico pero legitiman la ideología de las clases dominantes","Periodistas especializados en ciencia","Filósofos que estudian las opiniones de los ciudadanos"], ans:1, exp:"El término viene de doxa (opinión común) + sophos (sabio). Los doxósofos son posibles cuando el campo científico pierde autonomía: en lugar de ser evaluados por criterios científicos internos, deben su posición al apoyo político o mediático. Prestan a la opinión dominante la apariencia de rigor académico." },
  { q:"¿Qué significa 'autonomía relativa' del campo científico?", opts:["Que los científicos trabajan de manera completamente independiente del financiamiento estatal","Que el campo científico opera parcialmente según sus propias leyes internas (verificación, coherencia, reconocimiento entre pares) y no solo según criterios externos (políticos o económicos)","Que solo algunos científicos son autónomos: los de las ciencias naturales","Que la ciencia es autónoma en su metodología pero no en sus conclusiones"], ans:1, exp:"La autonomía relativa implica que el campo científico tiene sus propias leyes de funcionamiento que le dan independencia parcial respecto de los campos económico y político. Cuanto mayor es esa autonomía, más probable es que el conocimiento producido responda a criterios científicos. Cuanto menor, más probable que sirva a intereses externos." },
  { q:"¿Qué significa para Gutiérrez que 'lo social existe de doble manera'?", opts:["Que la sociedad puede estudiarse desde la sociología y desde la economía","Que lo social existe en las cosas (estructuras objetivas, instituciones, campos) y en los cuerpos (habitus, disposiciones incorporadas, historia hecha naturaleza segunda)","Que la realidad social tiene una dimensión material y una dimensión ideal","Que cada institución social existe como norma formal y como práctica informal"], ans:1, exp:"Esta tesis ontológica es el núcleo de Bourdieu según Gutiérrez: lo social existe como historia hecha cosa (objetivada en instituciones, campos, estructuras) y como historia hecha cuerpo (incorporada como habitus). La práctica social resulta de la relación —complicidad ontológica— entre estas dos existencias." },
  { q:"¿Qué es el habitus según la presentación de Gutiérrez?", opts:["Un conjunto de hábitos conscientes que el individuo adquiere por entrenamiento deliberado","Un sistema de disposiciones duraderas adquiridas en la trayectoria social, que genera prácticas, percepciones y evaluaciones de manera prerreflexiva y corporal","La costumbre colectiva de un grupo social, equivalente a 'cultura'","Las reglas no escritas que regulan la conducta en un campo determinado"], ans:1, exp:"El habitus es la historia social incorporada como segunda naturaleza: no es un conjunto de reglas conscientes sino un 'sentido del juego' que opera en la práctica sin necesidad de cálculo explícito. Está ligado a la clase, la trayectoria, el campo: genera prácticas 'razonables' —no racionales en sentido calculador— ajustadas a las condiciones objetivas." },
  { q:"¿Cuáles son los tres sesgos del investigador que identifica Bourdieu (según Gutiérrez)?", opts:["Ideológico, metodológico y conceptual","Originados en: (1) características personales (clase, sexo, etnia); (2) posición en el campo académico; (3) sesgo intelectualista (concebir el mundo como espectáculo teórico, no como campo de problemas prácticos)","Voluntario, involuntario y estructural","De clase, de género y de etnia únicamente"], ans:1, exp:"El sesgo intelectualista —el tercero— es para Bourdieu el más profundo y peligroso porque es el más difícil de reconocer: es el error de introducir en el objeto la relación teórica que el investigador tiene con él, en lugar de captar la relación práctica que los agentes tienen con su propia práctica." },
  { q:"¿Qué es la 'reflexividad epistémica' para Bourdieu-Gutiérrez?", opts:["La capacidad del investigador de revisar sus notas de campo antes de publicar","La práctica de objetivar las condiciones sociales de producción del propio conocimiento: someter la práctica científica al mismo análisis sociológico que se aplica al objeto de estudio","La reflexión teórica sobre los métodos utilizados en la investigación","El proceso de devolución de resultados a los sujetos investigados"], ans:1, exp:"La reflexividad epistémica no es modestia ni confesionalismo personal: es una condición metodológica. Conocer la posición de clase, la trayectoria, los intereses en juego del propio investigador permite controlar los sesgos que esos factores introducen en la producción de conocimiento." },
  { q:"¿Cuál es la 'fórmula' con que Gutiérrez resume la propuesta de Bourdieu al final del prólogo?", opts:["Observación + hipótesis + verificación = conocimiento científico válido","Conocimiento de los mecanismos y de los sentidos + autosocioanálisis asistido + autosocioanálisis propio = posibilidad de actuar y obligación de hacerlo","Comprensión + explicación + transformación = práctica emancipatoria","Teoría + empiria + reflexividad = sociología total"], ans:1, exp:"Esta fórmula integra los tres planos del argumento: epistemológico (conocer los mecanismos), metodológico (autosocioanálisis) y ético-político (obligación de actuar). La sociología no es solo conocimiento: produce responsabilidad con los sujetos cuyos mundos estudia." }
];

let sq2Answered = Array(sq2Data.length).fill(false);
let sq2Correct = 0;

function buildSQ2() {
  const c = document.getElementById('sq2-container');
  if (!c) return;
  sq2Data.forEach((q,i) => {
    const box = document.createElement('div'); box.className = 'q-box'; box.id = 'sq2-'+i;
    const qt = document.createElement('div'); qt.className = 'q-text'; qt.textContent = (i+1)+'. '+q.q; box.appendChild(qt);
    const opts = document.createElement('div'); opts.className = 'q-opts';
    q.opts.forEach((o,j) => {
      const btn = document.createElement('button'); btn.className = 'qopt'; btn.textContent = o;
      btn.onclick = () => answerSQ2(i, j, btn, opts, fb);
      opts.appendChild(btn);
    });
    box.appendChild(opts);
    const fb = document.createElement('div'); fb.className = 'q-fb'; box.appendChild(fb);
    c.appendChild(box);
  });
}

function answerSQ2(qi, chosen, btn, opts, fb) {
  if (sq2Answered[qi]) return;
  sq2Answered[qi] = true;
  const done = sq2Answered.filter(Boolean).length;
  if (chosen === sq2Data[qi].ans) { btn.classList.add('correct'); fb.className='q-fb show ok'; fb.textContent='✓ Correcto. '+sq2Data[qi].exp; sq2Correct++; }
  else { btn.classList.add('wrong'); opts.querySelectorAll('.qopt')[sq2Data[qi].ans].classList.add('correct'); fb.className='q-fb show no'; fb.textContent='✗ Incorrecto. '+sq2Data[qi].exp; }
  document.getElementById('sq2-prog').style.width = (done/sq2Data.length*100)+'%';
  document.getElementById('sq2-label').textContent = `${sq2Correct} correctas de ${done} respondidas`;
}

const fc2Data = [
  { q:"¿Qué paradoja fundamental plantea la tesis de Berger y Luckmann sobre la sociedad?", a:"La paradoja es que la sociedad es producto de la actividad humana, pero los seres humanos son productos de la sociedad. No hay causalidad unidireccional sino una dialéctica permanente: los humanos crean las instituciones (externalización), esas instituciones adquieren vida propia y los condicionan (objetivación) y los individuos las incorporan como su realidad subjetiva (internalización)." },
  { q:"Explicá el concepto de 'intersubjetividad' en Berger y Luckmann y su importancia para la vida cotidiana.", a:"La intersubjetividad es el carácter compartido de la realidad cotidiana: no vivo en un mundo privado sino en un mundo común con otros. Este mundo preexiste a cada individuo y seguirá después de él. Las tipificaciones —formas estandarizadas de relacionarse con los demás— permiten interactuar sin negociar cada vez desde cero. La intersubjetividad es la base de la objetividad de la realidad social: es real porque es compartida." },
  { q:"¿Cómo explica Bourdieu que la ciencia puede ser a la vez una actividad rigurosa y un campo de poder?", a:"La clave está en el concepto de autonomía relativa. El campo científico tiene sus propias leyes de funcionamiento (verificación, coherencia, reconocimiento entre pares) que le dan una lógica específica. Pero estas leyes no anulan las relaciones de fuerza: determinan la forma que toman. La competencia científica no es solo intelectual sino también política: quién define los problemas legítimos, quién controla los recursos, quién ocupa los cargos son cuestiones de poder que afectan qué conocimiento se produce." },
  { q:"¿Por qué la reflexividad del investigador social no es optional sino una condición metodológica necesaria?", a:"Porque si el investigador no objetiva su propia posición social y académica, esa posición actúa como sesgo no controlado en su producción de conocimiento. Los tres sesgos (clase-género-etnia, posición en el campo, sesgo intelectualista) no desaparecen por ignorarlos: se vuelven más peligrosos. La reflexividad los hace visibles y controlables, permitiendo un conocimiento más riguroso. Sin ella, el investigador proyecta su relación teórica con el objeto en lugar de captar la relación práctica de los agentes con su mundo." },
  { q:"¿En qué sentido la violencia simbólica es más eficaz que la violencia física según Bourdieu?", a:"La violencia simbólica es más eficaz porque opera con el consentimiento —inconsciente— de quienes la padecen. La violencia física requiere ser aplicada continuamente y genera resistencia. La violencia simbólica, en cambio, está incorporada en los esquemas de percepción de los dominados como algo natural y legítimo: los propios dominados perciben su posición como justa o inevitable. Por eso no hay que reprimirlos: se auto-reprimen. Este es el principio de la dominación más estable: la que no necesita ejercerse porque ya está interiorizada." },
  { q:"Relacioná la noción de 'campo' de Bourdieu con la tesis de Berger y Luckmann sobre la construcción social.", a:"En ambos casos la realidad social no es un dato natural sino una construcción histórica que adquiere objetividad y coercitividad. Berger y Luckmann muestran el proceso general: las prácticas se institucionalizan, se legitiman y se presentan como naturales. Bourdieu aplica esto a espacios sociales específicos: el campo es un espacio institucionalizado con sus propias reglas objetivadas. El capital de un campo es la forma específica que toma el poder en ese ámbito. Las disposiciones del habitus son la forma internalizada de las estructuras del campo." }
];

let fc2Idx = -1;

function buildFC2() {
  const c = document.getElementById('fc2-container');
  if (!c) return;
  fc2Data.forEach((f,i) => {
    const card = document.createElement('div'); card.className = 'fc-card'; card.id = 'fc2-'+i;
    const q = document.createElement('div'); q.className = 'fc-q'; q.textContent = `"${f.q}"`; card.appendChild(q);
    const showBtn = document.createElement('button'); showBtn.className = 'show-a'; showBtn.textContent = 'VER RESPUESTA';
    showBtn.onclick = () => { document.getElementById('fc2a'+i).classList.add('vis'); };
    card.appendChild(showBtn);
    const a = document.createElement('div'); a.className = 'fc-a'; a.id = 'fc2a'+i; a.textContent = f.a; card.appendChild(a);
    c.appendChild(card);
  });
}

function nextFC2() {
  if (fc2Idx >= 0) document.getElementById('fc2-'+fc2Idx).classList.remove('vis');
  fc2Idx = (fc2Idx+1) % fc2Data.length;
  const card = document.getElementById('fc2-'+fc2Idx);
  card.classList.add('vis');
  document.getElementById('fc2a'+fc2Idx).classList.remove('vis');
}

function showTV(id, btn) {
  // legacy fallback (not used with new nav)
  document.querySelectorAll('.tv-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// New grouped nav functions
function selectTxt(id, groupId, btn) {
  // Hide all tv-panels
  document.querySelectorAll('.tv-panel').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  // Remove active from all txt-items
  document.querySelectorAll('.txt-item').forEach(b => b.classList.remove('active'));
  // Show selected panel
  var panel = document.getElementById(id);
  if (panel) { panel.classList.add('active'); panel.style.display = 'block'; }
  // Mark button active
  btn.classList.add('active');
  // Ensure the group is open
  var group = document.getElementById(groupId);
  if (group) {
    var body = group.querySelector('.txt-group-body');
    var arr = group.querySelector('.txt-group-arr');
    if (body) body.style.display = '';
    if (arr) arr.textContent = '\u25be';
    var gbtn = group.querySelector('.txt-group-btn');
    if (gbtn) gbtn.classList.add('open');
  }
}

function toggleTG(groupId) {
  var group = document.getElementById(groupId);
  if (!group) return;
  var body = group.querySelector('.txt-group-body');
  var arr = group.querySelector('.txt-group-arr');
  var gbtn = group.querySelector('.txt-group-btn');
  var isOpen = body.style.display !== 'none' && body.style.display !== '';
  body.style.display = isOpen ? 'none' : '';
  arr.textContent = isOpen ? '\u25b8' : '\u25be';
  gbtn.classList.toggle('open', !isOpen);
}

buildSQ(); buildFC(); buildSQ2(); buildFC2();

// ═══════════════════════════════════════════════════
// ADM 111 — Quiz U1
// ═══════════════════════════════════════════════════
function admShowTab(showId, hideId, btn) {
  document.getElementById(showId).style.display = 'block';
  document.getElementById(hideId).style.display = 'none';
  document.querySelectorAll('#adm-u1-quiz .text-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

// ═══════════════════════════════════════════════════════════════
//  BANCO DE PREGUNTAS  ·  V0.9.1IA
//  50 preguntas por materia — cada quiz sortea 10 al azar
// ═══════════════════════════════════════════════════════════════

var bancoDePreguntas = {

  // ────────────────────────────────────────────────────────────
  //  ADMINISTRACIÓN I  ·  50 preguntas
  // ────────────────────────────────────────────────────────────
  adm: [
    { q:"¿Cuál es la principal conclusión de los experimentos de Hawthorne de Elton Mayo?", opts:["La iluminación adecuada es el factor más importante de productividad.","Las condiciones socio-psicológicas pueden tener más importancia que las físicas.","Los trabajadores responden mejor al pago por pieza excedente.","La división del trabajo científico es la base de la eficiencia."], correct:1, fb:"Mayo y sus colaboradores descubrieron que la productividad aumentaba tanto cuando mejoraban como cuando empeoraban las condiciones físicas. El factor humano y la atención positiva superan a las condiciones físicas." },
    { q:"¿A qué escuela del pensamiento administrativo pertenece Max Weber?", opts:["Escuela Clásica","Escuela de Relaciones Humanas","Escuela Estructuralista","Escuela Cuantitativa"], correct:2, fb:"⚠ Error frecuente: Weber pertenece a la Escuela ESTRUCTURALISTA, no a la Clásica. La Escuela Clásica incluye a Taylor (Adm. Científica) y Fayol (Proceso Administrativo)." },
    { q:"Según Fayol, ¿cuáles son las cinco funciones de la administración?", opts:["Planificar, Organizar, Dirigir, Coordinar, Evaluar","Planificar, Organizar, Mandar, Coordinar, Controlar","Planificar, Implementar, Dirigir, Supervisar, Controlar","Planificar, Organizar, Liderar, Motivar, Controlar"], correct:1, fb:"Las 5 funciones de Fayol son: Planificación · Organización · Mando (dirección) · Coordinación · Control. Publicadas en 'Administración Industrial y General' (1916)." },
    { q:"¿Cuál es el aporte principal de Herbert Simon a la teoría administrativa?", opts:["La Teoría General de Sistemas","Los 14 principios de administración","La teoría de la racionalidad limitada","El análisis FODA"], correct:2, fb:"Simon (Premio Nobel 1978) planteó que la racionalidad absoluta no puede alcanzarse porque nunca se consideran todas las alternativas ni todas las consecuencias. El decisor elige la 'mejor de las disponibles'." },
    { q:"Según Taylor, ¿cuál era el principal objetivo de la Administración?", opts:["Eliminar la burocracia y reducir jerarquías","Asegurar el máximo de prosperidad tanto para el trabajador como para el empleador","Implementar el trabajo en equipo horizontal","Desarrollar las relaciones humanas dentro de la organización"], correct:1, fb:"Taylor afirmaba que el principal objetivo de la Administración debía ser 'asegurar el máximo de prosperidad, tanto para el trabajador como para el empleador'. La herramienta: la productividad basada en el entrenamiento científico." },
    { q:"¿Qué plantea el Enfoque de Contingencias?", opts:["Existe una única mejor forma de administrar todas las organizaciones","La burocracia es el modelo ideal para todas las organizaciones","No existe una única mejor forma de administrar; depende de los factores situacionales","Las técnicas cuantitativas resuelven todos los problemas de decisión"], correct:2, fb:"El Enfoque de Contingencias refuta los principios universales. Jay Galbraith: (1) No existe una única mejor forma de administrar. (2) Ninguna forma es igualmente efectiva en todas las organizaciones." },
    { q:"¿Qué instrumento creó Igor Ansoff para diseñar estrategias de crecimiento?", opts:["El Análisis FODA","El Modelo de las Cinco Fuerzas","La Matriz de Crecimiento Producto/Mercado (Matriz Ansoff)","La Cadena de Valor"], correct:2, fb:"Ansoff creó la Matriz de Crecimiento Producto/Mercado. Los 4 cuadrantes: penetración en el mercado, desarrollo del mercado, desarrollo del producto y diversificación." },
    { q:"¿Cuál es la definición etimológica de 'administrar'?", opts:["Proviene del griego 'demos' y 'kratos'","Del latín 'ad' (hacia) y 'minister' (subordinación u obediencia), es decir: servir","Del inglés 'manage' que significa manejar caballos","Del latín 'administer' que significa el que tiene autoridad"], correct:1, fb:"Administrar proviene del latín 'ad' (hacia, dirección, tendencia) y 'minister' (subordinación u obediencia). En latín 'ministrare' significa servir, dar, conferir." },
    { q:"¿Qué diferencia existe entre eficiencia y eficacia?", opts:["Eficiencia es lograr objetivos; eficacia es usar bien los recursos","Eficiencia es la relación entre recursos usados y productos obtenidos; eficacia es el cumplimiento de objetivos","Son sinónimos perfectos","Eficiencia aplica a producción; eficacia aplica a servicios"], correct:1, fb:"Eficiencia = relación entre recursos utilizados y productos obtenidos ('hacer las cosas correctamente'). Eficacia = indicadores que miden el cumplimiento de objetivos ('hacer las cosas correctas')." },
    { q:"¿A qué se denomina 'Efecto Hawthorne'?", opts:["La tendencia de los trabajadores a resistir los cambios tecnológicos","El aumento de productividad cuando las personas saben que están siendo observadas","La reducción de costos por economías de escala","La burocracia que se genera en organizaciones grandes"], correct:1, fb:"El 'Efecto Hawthorne' refiere al hallazgo de Mayo: los trabajadores cambiaban su comportamiento simplemente al saber que eran observados. La atención recibida influía en su productividad." },
    { q:"En la Teoría de Sistemas, ¿qué significa que las organizaciones son 'sistemas abiertos'?", opts:["Que cualquier persona puede ingresar a trabajar en ellas","Que sus datos financieros son de acceso público","Que están en constante intercambio con su entorno a través de entradas, procesos y salidas","Que no tienen jerarquías rígidas"], correct:2, fb:"Un sistema abierto está en constante intercambio con otros sistemas circundantes. La organización recibe insumos del entorno, los transforma y produce salidas (Bertalanffy)." },
    { q:"Según Mintzberg, ¿cuál de los siguientes grupos de roles desempeña el directivo?", opts:["Planificador, Organizador, Motivador","Interpersonales, Informativos y Decisorios","Técnicos, Políticos y Económicos","Estratégicos, Tácticos y Operativos"], correct:1, fb:"Mintzberg identificó 10 roles directivos en tres categorías: (1) Interpersonales: cabeza visible, líder, enlace. (2) Informativos: monitor, difusor, portavoz. (3) Decisorios: empresario, componedor, asignador, negociador." },
    { q:"¿Por qué la Administración Científica de Taylor fue criticada por los trabajadores y sindicatos?", opts:["Porque era demasiado costosa de implementar","Porque la alta dirección podía fijar normas y piezas excedentes para explotar a los trabajadores","Porque no mejoraba la producción","Porque ignoraba las tecnologías disponibles"], correct:1, fb:"Los sindicatos se oponían porque consideraban que la alta dirección podía abusar de su poder para establecer normas y piezas excedentes explotando a los trabajadores. Además, las tareas se reducían a procedimientos mecánicos y rutinarios." },
    { q:"¿Cuál es la diferencia clave entre la Administración Sistemática y la Administración Científica?", opts:["La Sistemática es posterior a la Científica","La Sistemática coordinaba operaciones internas a nivel gerencial; la Científica optimizaba el trabajo operario individual","La Sistemática fue creada por Taylor; la Científica por Adam Smith","Son enfoques idénticos con distintos nombres"], correct:1, fb:"La Adm. Sistemática (~1870) incorporó procedimientos para coordinar operaciones internas a nivel gerencial (énfasis en inventarios y costos). La Adm. Científica (~1878) surgió porque la Sistemática no logró extender la eficiencia al taller." },
    { q:"¿Cuáles son las tres causas por las que Simon plantea que la racionalidad absoluta es imposible?", opts:["Falta de información, tiempo limitado y presupuesto insuficiente","No se pueden considerar todas las alternativas; ni todas las consecuencias; y el futuro es incierto (interviene la imaginación)","Conflictos de interés, corrupción y falta de liderazgo","La complejidad tecnológica, la globalización y la competencia"], correct:1, fb:"Simon identificó tres causas: (1) nunca pueden considerarse todas las alternativas; (2) aunque se consideren la mayoría, no se pueden prever todas las consecuencias; (3) las consecuencias futuras son inciertas y por eso interviene la imaginación." },
    { q:"Según el principio de 'Unidad de mando' de Fayol, ¿qué establece?", opts:["Toda la empresa debe tener un único dueño","Cada empleado debe asignarse solamente a un supervisor","Los objetivos de todos los departamentos deben ser los mismos","Las decisiones estratégicas se toman de forma centralizada"], correct:1, fb:"El principio Nº4 de Fayol: Unidad de mando = cada empleado debe asignarse solamente a UN supervisor. No confundir con Unidad de dirección (Nº5) que refiere a que los esfuerzos de todos se centren en los objetivos de la organización." },
    { q:"¿A qué se denomina 'Administración como ciencia, técnica y arte'?", opts:["Tres etapas históricas sucesivas del pensamiento administrativo","Tres dimensiones simultáneas de la administración referidas a distintos aspectos de la misma realidad","Tres escuelas que compiten entre sí","Tres niveles jerárquicos de la organización"], correct:1, fb:"Según Larocca-Barcos y Álvarez: son tres dimensiones de la misma realidad. Ciencia: elabora teorías/modelos con método científico. Técnica: transforma la realidad con herramientas específicas. Arte: depende de la personalidad del administrador y su liderazgo." },
    { q:"¿Qué distingue la Burocracia de Weber del Proceso Administrativo de Fayol?", opts:["Weber se enfoca en el operario; Fayol en los directivos","Weber plantea que la autoridad reside en los puestos (no en las personas) y busca eliminar la variabilidad; Fayol define funciones y principios universales para los gerentes","Son el mismo enfoque con distintos nombres","Weber es más moderno que Fayol"], correct:1, fb:"Fayol define las 5 funciones y 14 principios para los directivos. Weber plantea que la burocracia elimina la variabilidad al estandarizar reglas y hacer que la autoridad resida en los puestos, no en las personas. Ambos son clásicos pero con énfasis distintos." },
    { q:"¿Cuál de los siguientes NO es un exponente del Enfoque Estratégico?", opts:["Igor Ansoff","Michael Porter","Henry Mintzberg","Kenneth Boulding"], correct:3, fb:"Kenneth Boulding pertenece a la Teoría de Sistemas. Ansoff, Porter y Mintzberg son los tres grandes exponentes del Enfoque Estratégico." },
    { q:"Según Álvarez Gelves, ¿cuáles son los '3 puntos cardinales' del origen de la administración?", opts:["Taylor, Fayol y Weber","La Revolución Industrial, la burocracia y la globalización","División del trabajo (Adam Smith), optimización del trabajo físico (Taylor) y optimización del trabajo directivo (Fayol)","La racionalidad, la eficiencia y el control"], correct:2, fb:"Larocca-Barcos y Álvarez identifican tres 'puntos cardinales': (1) División del trabajo → Adam Smith; (2) Optimización del trabajo físico → Frederick Taylor; (3) Optimización del trabajo directivo → Henri Fayol." },
    { q:"¿Qué propone la Administración de la Responsabilidad Social según la ISO 26000?", opts:["Maximizar las utilidades para los accionistas a cualquier costo","Siete materias fundamentales: gobernanza, derechos humanos, prácticas laborales, medio ambiente, prácticas justas, consumidores y participación comunitaria","Implementar burocracia en todas las organizaciones públicas","Aplicar las técnicas de Taylor al sector público"], correct:1, fb:"La ISO 26000 establece 7 materias fundamentales: (1) Gobernanza, (2) Derechos humanos, (3) Prácticas laborales, (4) Medio ambiente, (5) Prácticas justas de operación, (6) Asuntos de consumidores, (7) Participación y desarrollo de la comunidad." },
    { q:"¿Cuál es la herramienta distintiva de la Escuela Neoclásica?", opts:["El estudio de tiempos y movimientos","La Administración Por Objetivos (APO)","El diagrama de Ishikawa","El modelo de las Cinco Fuerzas"], correct:1, fb:"La APO (Administración Por Objetivos) es la herramienta clave de la Escuela Neoclásica. Los objetivos se fijan en conjunto entre gerentes y subordinados, y el desempeño se mide por los resultados obtenidos. Fue creada y desarrollada por Peter Drucker." },
    { q:"¿Cuáles son los tres referentes principales de la Cultura de la Calidad?", opts:["Taylor, Fayol y Weber","Ansoff, Porter y Mintzberg","Deming, Juran e Ishikawa","Simon, Bertalanffy y Lawrence"], correct:2, fb:"Los tres referentes de la Calidad son: (1) William Deming: ciclo PDCA y mejora continua; (2) Joseph Juran: trilogía de la calidad (planificación, control, mejora); (3) Kaoru Ishikawa: diagrama causa-efecto (espina de pescado)." },
    { q:"¿Por qué surge la Escuela Humanista como reacción a los enfoques Clásicos?", opts:["Porque los Clásicos eran demasiado costosos de implementar","Porque los Clásicos ignoraban al trabajador como ser humano, generando apatía y conflicto laboral","Porque Taylor y Fayol tenían ideas contradictorias entre sí","Porque los Clásicos no estudiaban la estructura organizacional"], correct:1, fb:"Los enfoques Clásicos trataban al trabajador como una máquina (homo economicus). La racionalización extrema del trabajo generó apatía, alta rotación y conflicto. Los experimentos de Hawthorne (Mayo, 1927) demostraron que las condiciones socio-psicológicas superan a las físicas en productividad." },
    { q:"Según Chiavenato, ¿qué variable predomina en el Enfoque de Contingencias?", opts:["Tareas","Personas","Ambiente","Competitividad"], correct:2, fb:"El Enfoque de Contingencias tiene como variable predominante el AMBIENTE. Las contingencias del entorno determinan la estructura y los procesos de cada organización. No hay una única mejor forma: todo depende del contexto." },
    { q:"¿Qué aporta la Escuela Neoclásica que no tenían los enfoques anteriores?", opts:["Incorpora el entorno externo a la organización","Orienta el ciclo administrativo clásico hacia resultados concretos y la práctica gerencial","Rechaza los principios de Fayol por considerarlos obsoletos","Incorpora la motivación como único factor de productividad"], correct:1, fb:"La Neoclásica (Drucker, Koontz) retoma el ciclo administrativo de los Clásicos pero lo orienta a resultados concretos y aspectos prácticos. No abandona los principios — los actualiza. Su aporte principal: la APO y el foco en la función gerencial." },
    { q:"¿Qué es una organización según la definición de Parsons y Etzioni?", opts:["Un grupo de personas que comparten intereses comunes","Una unidad social deliberadamente construida para alcanzar fines específicos","Una red de relaciones informales entre trabajadores","Un sistema de producción de bienes y servicios"], correct:1, fb:"Parsons y Etzioni definen la organización como una unidad social deliberadamente construida y reconstruida para alcanzar fines específicos. A diferencia de los grupos, las organizaciones se caracterizan por su racionalidad y formalidad." },
    { q:"¿Cuáles son los cuatro principios científicos que estableció Taylor?", opts:["Planear, Organizar, Dirigir, Controlar","Selección, Capacitación, Estudio científico del trabajo y Cooperación entre gerentes y operarios","División, Especialización, Estandarización y Control","Motivación, Liderazgo, Comunicación y Decisión"], correct:1, fb:"Los 4 principios de Taylor: (1) Estudiar científicamente el trabajo para reemplazar los métodos empíricos; (2) Seleccionar al trabajador más apto; (3) Capacitarlo y entrenarlo según los métodos estudiados; (4) Cooperación entre gerentes y operarios para asegurar el cumplimiento." },
    { q:"¿Qué es el ciclo PDCA de Deming?", opts:["Producir, Distribuir, Controlar, Auditar","Planificar, Hacer, Verificar, Actuar (Plan-Do-Check-Act)","Prever, Decidir, Comunicar, Ajustar","Planear, Delegar, Corregir, Analizar"], correct:1, fb:"El ciclo PDCA (Deming) es la herramienta central de la mejora continua: Plan (planificar la mejora), Do (ejecutar), Check (verificar resultados vs. plan), Act (actuar para estandarizar o corregir). Es la base del TQM." },
    { q:"¿Cuál es la diferencia entre los niveles estratégico, táctico y operativo?", opts:["Son tres nombres para el mismo nivel jerárquico","Estratégico = alta dirección, largo plazo; Táctico = gerencias medias, mediano plazo; Operativo = supervisores y empleados, corto plazo","Estratégico = producción; Táctico = ventas; Operativo = administración","No existe diferencia real en organizaciones modernas"], correct:1, fb:"Nivel estratégico: alta dirección, decisiones de largo plazo (misión, visión, objetivos). Nivel táctico: gerencias medias, traducen la estrategia en planes departamentales. Nivel operativo: supervisores y empleados, ejecución diaria y corto plazo." },
    { q:"¿Qué distingue a las organizaciones con fines de lucro de las sin fines de lucro?", opts:["Que las sin fines de lucro no pueden tener empleados","Que el fin principal de las con fines de lucro es generar utilidades para sus propietarios o accionistas","Que las sin fines de lucro no necesitan administrarse","Que solo las sin fines de lucro tienen objetivos explícitos"], correct:1, fb:"La diferencia clave: en las organizaciones con fines de lucro, la generación de utilidades es el objetivo principal. Las sin fines de lucro persiguen objetivos sociales, culturales, religiosos u otros; el superávit se reinvierte en el cumplimiento de la misión." },
    { q:"¿Qué es el 'proceso administrativo' y quién lo formuló?", opts:["La secuencia de producción industrial; lo formuló Taylor","El ciclo de planificación, organización, dirección y control aplicado por los gerentes; lo formuló Fayol","El flujo de información financiera; lo formuló Simon","La cadena de valor empresarial; lo formuló Porter"], correct:1, fb:"El proceso administrativo (Fayol) describe el trabajo del gerente como un ciclo de cuatro funciones: Planificación (fijar objetivos y medios), Organización (estructurar recursos), Dirección (liderar y motivar), Control (medir y corregir desvíos)." },
    { q:"¿Por qué Adam Smith es considerado un precursor de la administración?", opts:["Porque creó el primer sistema de gestión de calidad","Porque demostró que la división del trabajo aumenta exponencialmente la productividad","Porque formuló los 14 principios administrativos","Porque realizó los primeros estudios de tiempos y movimientos"], correct:1, fb:"En 'La Riqueza de las Naciones' (1776), Smith mostró con su ejemplo de la fábrica de alfileres que la división del trabajo puede multiplicar la productividad. Este principio es la base conceptual de toda la administración científica posterior." },
    { q:"¿Qué caracteriza al 'homo economicus' en la visión clásica?", opts:["Un trabajador motivado por el reconocimiento social","Un individuo racional motivado exclusivamente por incentivos económicos (salario)","Un gerente preocupado por el bienestar de su equipo","Un consumidor que toma decisiones impulsivas"], correct:1, fb:"El 'homo economicus' es el supuesto antropológico de los clásicos: el trabajador es racional y se motiva exclusivamente por el dinero. Por eso la respuesta clásica a la productividad fue el pago por pieza y los incentivos salariales. La Escuela Humanista refutó este supuesto." },
    { q:"¿Qué es la 'organización informal' según la Escuela de Relaciones Humanas?", opts:["La estructura sin organigrama de las PyMES","La red de relaciones sociales y afectivas que emerge espontáneamente entre los trabajadores, paralela a la organización formal","El organigrama reducido de las empresas pequeñas","Los canales de comunicación externos de la empresa"], correct:1, fb:"La organización informal (Mayo, Roethlisberger) es la red de relaciones espontáneas basadas en amistad, afinidad y valores compartidos. Coexiste con la organización formal y puede potenciar o sabotear los objetivos organizacionales." },
    { q:"¿Qué entiende Fayol por 'principio de orden'?", opts:["Que todas las decisiones deben seguir una cadena jerárquica","Un lugar para cada cosa y cada cosa en su lugar (aplica tanto a materiales como a personas)","Que los empleados deben obedecer órdenes sin cuestionarlas","Que la organización debe tener un único plan de acción"], correct:1, fb:"El principio de Orden (Nº10 de Fayol): 'Un lugar para cada cosa y cada cosa en su lugar'. En lo material: eliminar pérdidas de tiempo buscando herramientas. En lo social: asignar a cada persona al puesto donde más rinde." },
    { q:"¿Qué es el 'Modelo de las Cinco Fuerzas' de Porter?", opts:["Un modelo para organizar equipos de trabajo","Un framework para analizar la intensidad competitiva de una industria: rivales, nuevos entrantes, sustitutos, proveedores y clientes","Un sistema de cinco indicadores financieros","El ciclo de vida de los productos según la demanda"], correct:1, fb:"Las 5 Fuerzas de Porter (1979) determinan la rentabilidad de una industria: (1) Rivalidad entre competidores, (2) Amenaza de nuevos entrantes, (3) Amenaza de productos sustitutos, (4) Poder de negociación de proveedores, (5) Poder de negociación de clientes." },
    { q:"¿Qué propuso Douglas McGregor con su Teoría X e Y?", opts:["Dos tipos de estructuras organizacionales","Dos sistemas de control financiero","Dos conjuntos opuestos de supuestos sobre la naturaleza humana en el trabajo","Dos estilos de liderazgo situacional"], correct:2, fb:"McGregor (1960): Teoría X = supone que el trabajador es perezoso, evita responsabilidades y necesita control estricto. Teoría Y = supone que el trabajo es natural, el trabajador busca responsabilidades y puede autodirigirse. Los supuestos del gerente moldean su estilo de liderazgo." },
    { q:"¿Cuál es la diferencia entre organización 'mecanicista' y 'orgánica' según Burns y Stalker?", opts:["Mecanicista usa máquinas; orgánica usa trabajo manual","Mecanicista es rígida, jerárquica y formal; orgánica es flexible, descentralizada y adaptable a entornos cambiantes","Son sinónimos en el Enfoque Contingente","Mecanicista es para el sector público; orgánica para el privado"], correct:1, fb:"Burns y Stalker (1961): Mecanicista = alta formalización, jerarquía rígida, adecuada para entornos estables. Orgánica = roles flexibles, comunicación lateral, adecuada para entornos inciertos y cambiantes. Es una de las bases del Enfoque Contingente." },
    { q:"¿A qué se refiere el concepto de 'entropía' en la Teoría de Sistemas aplicada a organizaciones?", opts:["Al crecimiento acelerado de una organización","A la tendencia natural de todo sistema cerrado a desorganizarse y deteriorarse si no recibe energía del entorno","Al proceso de reducción de personal en épocas de crisis","A la concentración de poder en pocas personas"], correct:1, fb:"La entropía (Bertalanffy) describe la tendencia natural de los sistemas cerrados a la desorganización y desintegración. Las organizaciones como sistemas abiertos pueden generar 'entropía negativa' (negentropía) al importar recursos y energía del entorno." },
    { q:"¿Cuál de las siguientes afirmaciones sobre la 'cadena de valor' de Porter es correcta?", opts:["Es un modelo para calcular el costo de producción","Describe las actividades primarias (producción, ventas, servicio) y de apoyo (RRHH, tecnología, infraestructura) que crean valor y ventaja competitiva","Es un indicador financiero de rentabilidad","Fue creado por Igor Ansoff para analizar la diversificación"], correct:1, fb:"La cadena de valor (Porter, 1985) identifica las actividades que generan valor al cliente. Actividades primarias: logística interna, operaciones, logística externa, marketing/ventas, servicio. Actividades de apoyo: infraestructura, RRHH, tecnología, abastecimiento." },
    { q:"¿Qué plantea la Teoría de la Agencia respecto a los gerentes?", opts:["Que los gerentes siempre actúan en beneficio de los accionistas","Que puede existir conflicto de intereses entre los dueños (principales) y los gerentes (agentes) que administran la empresa","Que los gerentes son los únicos responsables de los resultados","Que los gerentes deben ser siempre accionistas de la empresa"], correct:1, fb:"La Teoría de la Agencia (Jensen y Meckling, 1976) plantea que los gerentes-agentes pueden perseguir intereses propios en detrimento de los dueños-principales. La solución: incentivos alineados (bonos por resultados), auditorías y consejos de administración independientes." },
    { q:"¿Qué es el 'benchmarking' como herramienta administrativa?", opts:["Un tipo de presupuesto anual","El proceso de comparar las prácticas y desempeño propios con los de las mejores organizaciones del sector o de otras industrias","Un método de selección de personal","Un indicador de satisfacción del cliente"], correct:1, fb:"El benchmarking es el proceso continuo de medición y comparación de los procesos empresariales propios con los de las organizaciones líderes en el mundo. Objetivo: identificar brechas de desempeño e implementar las mejores prácticas. Fue popularizado por Xerox en los 80." },
    { q:"¿Cuál es la diferencia entre 'misión' y 'visión' en la planificación estratégica?", opts:["Son sinónimos en la práctica empresarial","La misión define el propósito actual (qué hace y para quién), la visión define el estado futuro deseado (hacia dónde va)","La visión es de corto plazo; la misión de largo plazo","Solo las grandes empresas necesitan misión y visión"], correct:1, fb:"Misión = propósito fundamental actual: qué hace la organización, para quién lo hace y cómo lo hace. Visión = estado futuro deseado: imagen aspiracional de lo que la organización quiere ser. La misión guía el presente; la visión inspira el futuro." },
    { q:"¿Qué es el 'outsourcing' y cuál es su fundamento administrativo?", opts:["Una forma de integración vertical","La contratación externa de actividades que no son el núcleo del negocio para reducir costos y enfocarse en las competencias centrales","Un método de reducción de la burocracia interna","Una técnica de gestión de inventarios"], correct:1, fb:"El outsourcing (tercerización) consiste en contratar a proveedores externos para realizar actividades que no son el 'core business' (núcleo del negocio). Fundamento: la empresa se enfoca en lo que hace mejor (ventaja competitiva) y delega el resto a especialistas más eficientes." },
    { q:"Según la Escuela Estructuralista, ¿cuál es el aporte de Etzioni?", opts:["La teoría de motivación de dos factores","La clasificación de las organizaciones según el tipo de poder utilizado: coercitivas, normativas y utilitarias","La burocracia ideal como modelo organizacional","El modelo de los 10 roles directivos"], correct:1, fb:"Amitai Etzioni (estructuralista) clasificó las organizaciones según el tipo de poder que usan para obtener cumplimiento: Coercitivas (prisons, ejércitos — poder físico), Utilitarias (empresas — remuneración), Normativas (iglesias, universidades — compromisos morales)." },
    { q:"¿Qué es la 'gestión del conocimiento' (knowledge management)?", opts:["El área de capacitación y formación de RRHH","El proceso de identificar, capturar, organizar y transferir el conocimiento organizacional para mejorar el desempeño","El sistema de archivo de documentos legales","La gestión de patentes y marcas comerciales"], correct:1, fb:"La gestión del conocimiento (Nonaka y Takeuchi) busca transformar el conocimiento tácito (experiencia individual no codificada) en conocimiento explícito (codificado y transferible). Clave en la economía del conocimiento donde el capital intelectual es la principal ventaja competitiva." },
    { q:"¿Cuál es la propuesta central del 'empowerment' como herramienta de gestión?", opts:["Centralizar todas las decisiones en la alta gerencia","Delegar autoridad y responsabilidad a los empleados de niveles inferiores para que tomen decisiones en su área","Aumentar el control y supervisión directa","Reducir la cantidad de niveles jerárquicos manteniendo el control central"], correct:1, fb:"El empowerment es la delegación efectiva de poder y autonomía a empleados y equipos para que tomen decisiones en su área sin requerir aprobación superior en cada caso. Beneficios: mayor velocidad de respuesta, motivación intrínseca y aprovechamiento del conocimiento local." },
    { q:"¿Qué entiende Porter por 'ventaja competitiva sostenible'?", opts:["Una ventaja de costos que dura al menos un año","Un conjunto de capacidades y posicionamiento que la organización mantiene en el tiempo y que los competidores no pueden imitar fácilmente","La posición de liderazgo en participación de mercado","El acceso privilegiado a materias primas"], correct:1, fb:"Porter plantea que la ventaja competitiva sostenible surge de una posición estratégica única difícil de imitar: costos más bajos estructurales, diferenciación valorada por el cliente, o enfoque en un nicho específico. No se trata solo de eficiencia operativa, que los competidores pueden copiar." },
    { q:"¿Qué es el 'análisis FODA' y para qué se usa?", opts:["Un estado financiero trimestral","Una herramienta de diagnóstico estratégico que analiza Fortalezas y Debilidades (internas) y Oportunidades y Amenazas (externas)","Un método de selección de proveedores","Un sistema de evaluación del desempeño individual"], correct:1, fb:"El FODA (SWOT en inglés) es una herramienta de diagnóstico estratégico: Fortalezas y Debilidades = análisis interno (recursos y capacidades). Oportunidades y Amenazas = análisis externo (entorno competitivo, mercado, macroeconómico). El cruce F-O-D-A genera opciones estratégicas." },
    { q:"¿Qué caracteriza al liderazgo transformacional según Burns y Bass?", opts:["El líder motiva exclusivamente a través de recompensas materiales","El líder inspira a los seguidores a superar sus propios intereses en función de un propósito colectivo, generando cambio y crecimiento","El liderazgo transformacional evita el conflicto a cualquier costo","Solo es aplicable en organizaciones sin fines de lucro"], correct:1, fb:"Burns (1978) y Bass (1985) distinguen: Liderazgo transaccional = intercambio de recompensas por desempeño. Liderazgo transformacional = el líder genera visión inspiradora, estimula intelectualmente a los seguidores y los motiva a superar sus propios límites. Es más efectivo en entornos de cambio." },
  ],

  // ────────────────────────────────────────────────────────────
  //  CONTABILIDAD I  ·  50 preguntas
  // ────────────────────────────────────────────────────────────
  cont: [
    { sec:"IT. I", q:"¿Cuál es el objetivo básico de la contabilidad según Fowler Newton?", opts:["Cumplir con las normas legales vigentes","Suministrar información útil para la toma de decisiones y el control","Registrar mecánicamente las transacciones del ente","Determinar el resultado del ejercicio económico"], ans:1, exp:"El objetivo básico es proporcionar información útil para la toma de decisiones. 'Cumplir con normas legales' es también un objetivo, pero NO el principal." },
    { sec:"IT. I", q:"¿Qué carácter tiene la disciplina contable según la doctrina contemporánea mayoritaria?", opts:["Científico","Artístico","Técnico","Filosófico"], ans:2, exp:"La contabilidad es una disciplina TÉCNICA: es un instrumento para obtener cierto tipo de información. No es ciencia (que busca causas) ni arte (que es creativo)." },
    { sec:"IT. I", q:"Los informes contables preparados para suministro a terceros se denominan:", opts:["Informes de gestión","Presupuestos","Estados contables","Balances internos"], ans:2, exp:"Los informes contables para terceros se denominan ESTADOS CONTABLES. 'Estados financieros' es la traducción del inglés, menos adecuada en Argentina donde 'financiero' refiere a movimientos de fondos." },
    { sec:"IT. I", q:"Las Normas Contables Profesionales (NCP) en Argentina son sancionadas por:", opts:["El Poder Ejecutivo Nacional","El CPCE de cada provincia y Capital Federal","La AFIP","El Banco Central"], ans:1, exp:"Las NCP son sancionadas por el CPCE de cada provincia y Capital Federal, a través de las Resoluciones Técnicas de la FACPCE. Las NCL, en cambio, emanan del Estado y obligan al ente emisor." },
    { sec:"IT. I", q:"El principio de Ente establece que:", opts:["El ente debe ser siempre una persona jurídica","El patrimonio del ente es independiente del patrimonio de sus propietarios","Solo las empresas con fines de lucro son entes contables","El ente debe tener más de un propietario"], ans:1, exp:"El principio de Ente establece la clara diferenciación entre el patrimonio del sujeto contable y el de sus propietarios. Los gastos personales del dueño no son gastos de la empresa." },
    { sec:"IT. I", q:"El principio de Empresa en Marcha determina que los activos se valúan:", opts:["A precio de liquidación urgente","A su valor de reposición de mercado","A costo histórico considerando su utilización económica futura","Al valor fiscal según AFIP"], ans:2, exp:"Se asume que la empresa continuará operando. Por eso los activos se valúan a costo histórico (valor de uso), no a precio de venta urgente. Si la empresa fuera a liquidarse, el criterio sería el valor realizable neto." },
    { sec:"IT. I", q:"La expresión 'caveat emptor' describe:", opts:["El principio de prudencia contable","La situación previa a 1929 donde el inversor asumía riesgos por falta de información real de las empresas","El sistema de partida doble de Luca Pacioli","El postulado básico de equidad de los PCGA argentinos"], ans:1, exp:"'Caveat emptor' = 'Que se cuide el comprador'. Los dueños-administradores no tenían obligación de revelar la situación real. Esta desinformación fue la causa principal del crack bursátil de 1929." },
    { sec:"IT. I", q:"¿Cuál afirmación sobre los informes contables es INCORRECTA?", opts:["Los estados contables son informes preparados para terceros","Los informes internos pueden incluir datos presupuestados y sus desvíos","Los informes para terceros deben tener el mismo contenido que los de uso interno","Los informes contables pueden incluir también datos no contables"], ans:2, exp:"INCORRECTO. Las necesidades de información interna y externa son DISTINTAS. Los informes internos incluyen datos presupuestados, desvíos y explicaciones que no tienen por qué estar en los estados contables." },
    { sec:"IT. I", q:"En la clasificación de PCGA argentina (Biondi), ¿cuántos prerrequisitos existen?", opts:["3","5","7","13"], ans:2, exp:"Existen 7 prerrequisitos: Ente, Ejercicio, Moneda de cuenta, Objetividad, Empresa en marcha, Bienes económicos y Exposición. Más 1 postulado (Equidad), 3 principios propiamente dichos y 3 restricciones." },
    { sec:"IT. I", q:"El postulado básico de Equidad establece que:", opts:["Los activos deben estar en equilibrio con los pasivos","La información contable no debe favorecer intereses de algunos usuarios en detrimento de otros","El ente debe distribuir utilidades en partes iguales entre sus socios","Los auditores deben cobrar honorarios equitativos"], ans:1, exp:"El postulado de Equidad es la base de todos los PCGA. Establece que la información contable debe confeccionarse de modo que no favorezca intereses de propietarios, acreedores, fisco u otros usuarios en perjuicio de los demás." },
    { sec:"IT. I", q:"¿Cuál es la diferencia entre Contabilidad y Teneduría de Libros?", opts:["Son sinónimos","La Teneduría es la parte mecánica del procesamiento contable; la Contabilidad es más amplia e incluye criterios de valuación, medición y forma de informes","La Contabilidad es más sencilla que la Teneduría","La Teneduría incluye el análisis financiero; la Contabilidad solo registra"], ans:1, exp:"Teneduría = parte mecánica del procesamiento (transformar datos en información). Contabilidad es más amplia: incluye criterios de valuación, medición y forma de los informes. Un tenedor de libros puede no saber contabilidad." },
    { sec:"IT. I", q:"El principio de Prudencia establece que:", opts:["Los activos deben valuarse siempre al precio más alto posible","Ante incertidumbre, se deben reconocer las pérdidas probables pero no las ganancias contingentes","Los gastos siempre deben pagarse antes de registrarse","Los ingresos se registran solo cuando hay certeza absoluta de cobro"], ans:1, exp:"Prudencia (conservadurismo): ante dos alternativas de valuación razonables, se elige la que presenta menor activo y menor resultado. Se reconocen pérdidas probables, pero NO ganancias contingentes. Evita sobrevaluar el patrimonio." },
    { sec:"IT. I", q:"¿Qué establecen las RT (Resoluciones Técnicas) de la FACPCE?", opts:["Las tasas impositivas para empresas argentinas","Las normas contables profesionales que regulan la medición, exposición y auditoría de los estados contables en Argentina","Los aranceles de honorarios profesionales de los contadores","Los plazos para presentar declaraciones juradas ante AFIP"], ans:1, exp:"Las RT son las Normas Contables Profesionales argentinas. La RT Nº16 establece el Marco Conceptual. La RT Nº17 regula la medición contable. Cada RT cubre un aspecto específico. Son sancionadas por los CPCE provinciales basándose en pronunciamientos de la FACPCE." },
    { sec:"IT. I", q:"¿Qué es el principio de Devengado?", opts:["Los ingresos y gastos se reconocen cuando se cobra o se paga el efectivo","Los ingresos y gastos se reconocen en el período en que se generan, independientemente de cuándo se cobre o pague","Solo se registran las operaciones documentadas con factura","Los activos se registran cuando se entregan físicamente"], ans:1, exp:"Base devengado: los resultados se reconocen en el período en que se generan (se gana el ingreso o se incurre en el gasto), sin importar cuándo se cobra o paga el efectivo. Es la base de la contabilidad patrimonial, a diferencia de la base caja." },
    { sec:"IT. II", q:"La ecuación contable fundamental en su forma estática es:", opts:["Activo = Pasivo","Activo = Pasivo + Patrimonio Neto","Patrimonio Neto = Activo + Pasivo","Activo - Patrimonio Neto = Pasivo + Resultados"], ans:1, exp:"A = P + PN es la ecuación contable fundamental estática. Describe la situación patrimonial en un momento dado: los recursos (activo) se financian con obligaciones con terceros (pasivo) y con el aporte de los dueños más resultados acumulados (patrimonio neto)." },
    { sec:"IT. II", q:"¿Cuál es la condición necesaria para que un bien sea considerado ACTIVO del ente?", opts:["Haber sido adquirido mediante un desembolso de dinero","Estar registrado en un documento respaldatorio","Que el ente controle los beneficios que produce, debido a un hecho ya ocurrido","Que el bien sea de propiedad legal del ente"], ans:2, exp:"El carácter de activo no depende del costo ni de la propiedad legal. Lo define el CONTROL de beneficios. Ejemplo: un computador recibido en donación es activo aunque no tuvo costo." },
    { sec:"IT. II", q:"Los pasivos son:", opts:["Todos los bienes que posee el ente","Las obligaciones del ente con terceros que implican entregar recursos en el futuro","El capital aportado por los socios","Los resultados negativos acumulados del ente"], ans:1, exp:"Los pasivos son las obligaciones del ente hacia terceros. Para ser reconocido como pasivo debe existir: a) una obligación cierta o contingente, b) que implique entregar recursos en el futuro, c) originada en un hecho ya ocurrido." },
    { sec:"IT. II", q:"¿Cuál de los siguientes es un ejemplo de variación patrimonial PERMUTATIVA?", opts:["Pago de sueldo a un empleado","Compra de mercadería al contado","Cobro de una deuda de un cliente","Donación recibida de un tercero"], ans:2, exp:"Una variación permutativa NO modifica el PN: un elemento sube y otro baja por el mismo importe. Cobrar una deuda = caja sube, crédito baja. Ambos son activos → el PN no cambia. Pagar sueldos o recibir una donación SÍ modifican el PN (modificativas)." },
    { sec:"IT. II", q:"El resultado del período se determina como:", opts:["Activo final menos Activo inicial","Ingresos menos Costos y Gastos del período","Patrimonio Neto final menos aportes de capital","Ventas menos Costo de Mercadería Vendida únicamente"], ans:1, exp:"Resultado = Ingresos – Costos – Gastos del período. Si es positivo = ganancia (aumenta el PN). Si es negativo = pérdida (disminuye el PN)." },
    { sec:"IT. II", q:"Una empresa recibe una donación en efectivo. ¿Cómo afecta al patrimonio?", opts:["Solo aumenta el activo; el PN no varía","Aumenta el activo y simultáneamente aumenta el PN (ganancia)","Aumenta el activo y simultáneamente aumenta el pasivo","Disminuye el pasivo y aumenta el PN"], ans:1, exp:"Una donación recibida es una variación MODIFICATIVA: aumenta el activo (caja) Y aumenta el PN (se registra como ganancia según RT N°16). No hay contrapartida en pasivo porque no genera obligación de devolver." },
    { sec:"IT. II", q:"¿Cuáles son los componentes del Patrimonio Neto?", opts:["Solo el capital aportado por los socios","Capital social más reservas más resultados acumulados (RNA) más ajuste de capital","Solo las ganancias del ejercicio actual","Activo total menos deudas con proveedores"], ans:1, exp:"PN = Capital social (aporte de propietarios) + Aportes irrevocables + Ajuste de capital + Reservas (legal, estatutaria, facultativa) + Resultados No Asignados (RNA). El RNA incluye ganancias retenidas de ejercicios anteriores más el resultado del ejercicio actual." },
    { sec:"IT. II", q:"¿Qué es el 'activo corriente'?", opts:["Todos los bienes físicos de la empresa","Los activos que se convertirán en efectivo o consumirán en el ciclo operativo normal o en el plazo de un año","Solo el dinero en efectivo y en bancos","Los activos adquiridos en el ejercicio actual"], ans:1, exp:"Activo corriente = activos que se espera convertir en efectivo, vender o consumir dentro del ciclo operativo normal o en el plazo máximo de 12 meses desde el cierre del ejercicio. Incluye: disponibilidades, créditos y bienes de cambio corrientes." },
    { sec:"IT. II", q:"¿Qué se entiende por 'valuación al costo histórico'?", opts:["Registrar los activos al precio actual de mercado","Registrar los activos al precio original de adquisición o producción","Actualizar los activos por inflación mensualmente","Registrar los activos al valor de reposición"], ans:1, exp:"El costo histórico (o costo de adquisición) es el valor al que se incorpora inicialmente un bien: precio pagado más los costos necesarios para ponerlo en condiciones de uso. Es el criterio básico de los PCGA argentinos para el reconocimiento inicial." },
    { sec:"IT. III", q:"El principio de la partida doble establece que:", opts:["Todos los asientos deben tener dos líneas de texto","Todo hecho económico produce simultáneamente un débito y un crédito de igual importe","Cada cuenta debe tener un debe y un haber con el mismo saldo","Los libros contables deben llevarse en duplicado"], ans:1, exp:"La partida doble: todo hecho económico afecta simultáneamente a dos o más cuentas por el mismo importe total. La suma de los débitos (debe) siempre iguala la suma de los créditos (haber) en cada asiento." },
    { sec:"IT. III", q:"En el método de la partida doble, ¿cuándo se DEBITA una cuenta de activo?", opts:["Cuando el activo disminuye","Cuando el activo aumenta","Siempre que haya una venta","Cuando se paga una deuda"], ans:1, exp:"Cuentas de ACTIVO: se debitan cuando AUMENTAN y se acreditan cuando DISMINUYEN. Cuentas de PASIVO y PN: es al revés, se acreditan cuando aumentan y se debitan cuando disminuyen. Gastos/pérdidas al debe; ingresos/ganancias al haber." },
    { sec:"IT. III", q:"La ecuación contable dinámica incorpora:", opts:["Solo los movimientos de caja del período","Los resultados del período (ingresos y gastos) que explican la variación del PN","El detalle de todos los activos corrientes","Las amortizaciones de los bienes de uso"], ans:1, exp:"La ecuación dinámica: A = P + PN + (Ingresos – Gastos). Incorpora los resultados del período para explicar cómo varía el PN entre dos momentos. La estática (A = P + PN) solo muestra la foto en un momento." },
    { sec:"IT. III", q:"¿Cuál de las siguientes variaciones patrimoniales es MODIFICATIVA con efecto POSITIVO (ganancia)?", opts:["Compra de mercadería a crédito","Pago de una deuda con un proveedor","Venta de mercadería por mayor valor que su costo","Cobro de un cheque en cartera"], ans:2, exp:"Una venta genera: aumento de activo (caja o crédito) Y aumento de PN (ingreso por venta menos costo = ganancia). Es modificativa positiva. Comprar a crédito o pagar deudas son permutativas. Cobrar un cheque es permutativa." },
    { sec:"IT. III", q:"¿Qué es el 'saldo de una cuenta'?", opts:["El total de todos los débitos de la cuenta","La diferencia entre el total del debe y el total del haber","El promedio de todos los movimientos registrados","El último importe registrado en la cuenta"], ans:1, exp:"El saldo de una cuenta = suma del debe – suma del haber. Si el debe > haber: saldo deudor. Si el haber > debe: saldo acreedor. Las cuentas de activo y gasto normalmente tienen saldo deudor; las de pasivo, PN e ingresos tienen saldo acreedor." },
    { sec:"IT. III", q:"¿Qué es un asiento de ajuste?", opts:["Un asiento para corregir errores de suma","Un asiento realizado al cierre del ejercicio para actualizar cuentas por hechos devengados no registrados o por correcciones de valuación","Un asiento para registrar compras de activos fijos","Un asiento para registrar el pago de impuestos"], ans:1, exp:"Los asientos de ajuste al cierre del ejercicio actualizan las cuentas por: (1) devengamientos no registrados (sueldos a pagar, intereses ganados no cobrados); (2) consumo de activos prepagados (seguros, alquileres); (3) amortizaciones de bienes de uso; (4) previsiones para deudas incobrables." },
    { sec:"IT. IV", q:"¿Cuál es la función principal de los documentos comerciales en contabilidad?", opts:["Servir de decoración en los archivos de la empresa","Ser la fuente de captación de datos del sistema contable y respaldo legal de las operaciones","Reemplazar los libros contables obligatorios","Determinar el resultado del ejercicio en forma directa"], ans:1, exp:"Los documentos comerciales son la fuente de captación de datos del sistema contable. Tienen doble función: a) respaldar legalmente las operaciones; b) ser el insumo inicial del proceso de registración contable." },
    { sec:"IT. IV", q:"Una factura tipo A se emite cuando:", opts:["El comprador es consumidor final","El comprador es responsable inscripto en IVA","El comprador es exento de IVA","El comprador es una persona física monotributista"], ans:1, exp:"Factura A: emisor responsable inscripto → comprador responsable inscripto (discrimina IVA). Factura B: emisor responsable inscripto → consumidor final o exento. Factura C: emisor monotributista o exento → cualquier comprador." },
    { sec:"IT. IV", q:"¿Qué es una nota de crédito?", opts:["Un documento que aumenta la deuda del comprador","Un documento que el vendedor emite para disminuir el importe de una factura anterior (por devoluciones, descuentos o errores)","Un comprobante bancario de depósito","Un resumen de cuenta mensual"], ans:1, exp:"La nota de crédito la emite el vendedor para reducir el importe de una factura anterior. Causas: devolución de mercadería, descuentos posteriores a la factura, errores de facturación. Su efecto es opuesto al de la factura." },
    { sec:"IT. IV", q:"El proceso contable sigue el siguiente orden:", opts:["Registración → Captación → Clasificación → Exposición","Captación de datos → Clasificación → Registración → Exposición en informes","Exposición → Registración → Captación → Clasificación","Clasificación → Captación → Exposición → Registración"], ans:1, exp:"El proceso contable tiene etapas secuenciales: 1) Captación de datos (documentos fuente); 2) Clasificación por tipo de hecho económico; 3) Registración en libros contables; 4) Exposición en informes (estados contables). Este orden no puede alterarse." },
    { sec:"IT. IV", q:"¿Qué es un remito?", opts:["Una factura simplificada para ventas menores a $1.000","Un documento que acompaña la entrega física de mercadería y acredita que el comprador la recibió","Un recibo de pago entre empresas","Una nota bancaria de débito"], ans:1, exp:"El remito es el documento de entrega de mercadería. Lo emite el vendedor y el comprador lo firma como constancia de recepción. Es distinto de la factura (que documenta el precio) aunque suelen emitirse juntos. El remito no tiene valor fiscal pero sí probatorio de la entrega." },
    { sec:"IT. IV", q:"¿Cuándo se emite una nota de débito?", opts:["Cuando el vendedor quiere reducir la deuda del comprador","Cuando el vendedor quiere aumentar el importe que le debe el comprador (por intereses, gastos adicionales o diferencias)","Cuando el comprador realiza una devolución","Cuando se anula una factura anterior"], ans:1, exp:"La nota de débito la emite el vendedor para AUMENTAR el importe a cobrar al comprador. Causas: intereses por pago tardío, gastos de envío no incluidos en la factura original, diferencias de precio. Es opuesta a la nota de crédito." },
    { sec:"IT. V", q:"¿Qué es una cuenta contable?", opts:["Un registro numérico de movimientos de caja","El elemento básico de registración que agrupa hechos de similar naturaleza económica bajo una denominación convencional","Un estado financiero de cierre de ejercicio","El libro donde se anotan todas las operaciones cronológicamente"], ans:1, exp:"Una cuenta es el elemento básico del sistema de registración contable. Agrupa bajo una denominación convencional todos los hechos económicos de similar naturaleza. Tiene una estructura de T con Debe (izquierda) y Haber (derecha)." },
    { sec:"IT. V", q:"Por su naturaleza, las cuentas se clasifican en:", opts:["Abiertas y cerradas","Patrimoniales (activo, pasivo, PN) y de resultado (ingresos y gastos)","Simples y compuestas","Corrientes y no corrientes"], ans:1, exp:"Clasificación por naturaleza: Patrimoniales = activo, pasivo, patrimonio neto (integran el balance); De resultado = ingresos/ganancias y gastos/pérdidas (integran el estado de resultados). Al cierre del ejercicio las cuentas de resultado se cancelan contra el PN." },
    { sec:"IT. V", q:"El Libro Diario es:", opts:["El registro donde se anotan los saldos de cada cuenta al cierre del ejercicio","El registro cronológico de todos los asientos contables con sus débitos y créditos","El archivo de documentos comerciales respaldatorios","El registro de inventario de los bienes del ente"], ans:1, exp:"El Libro Diario registra en forma CRONOLÓGICA todos los asientos contables (fecha, cuentas debitadas y acreditadas, importes y descripción). Es obligatorio legalmente. Del Diario se pasan los movimientos al Mayor." },
    { sec:"IT. V", q:"El Plan de Cuentas es:", opts:["El resumen anual de todos los movimientos contables","La lista ordenada y codificada de todas las cuentas que utiliza el ente en su sistema contable","El detalle de los documentos comerciales archivados","El cronograma de pagos a proveedores del ente"], ans:1, exp:"El Plan de Cuentas es la lista ordenada, codificada y estructurada de todas las cuentas que el ente utiliza para registrar sus operaciones. Su complemento es el Manual de Cuentas, que define el contenido y criterio de uso de cada cuenta." },
    { sec:"IT. V", q:"¿Cuál es la diferencia entre el Libro Diario y el Libro Mayor?", opts:["No hay diferencia, son el mismo registro con distinto nombre","El Diario registra en orden cronológico; el Mayor agrupa por cuenta todos los movimientos de esa cuenta","El Diario es obligatorio; el Mayor es optativo","El Mayor registra cronológicamente; el Diario agrupa por cuenta"], ans:1, exp:"Diario = registro CRONOLÓGICO de asientos. Mayor = registro ANALÍTICO POR CUENTA: cada hoja del Mayor corresponde a una cuenta y muestra todos sus débitos y créditos. Del Mayor se obtienen los saldos que se vuelcan al balance de saldos." },
    { sec:"IT. V", q:"¿Qué es el 'Balance de Comprobación de Sumas y Saldos'?", opts:["El estado contable final que muestra la situación patrimonial","Un cuadro de doble entrada que lista todas las cuentas con sus totales de debe, haber y saldo para verificar que la partida doble se mantuvo en todos los asientos","El registro de todos los cheques emitidos por el ente","Un resumen de los documentos comerciales del período"], ans:1, exp:"El Balance de Comprobación (o Balancete) verifica la mecánica de la partida doble: lista todas las cuentas con sus sumas de debe, sumas de haber y saldos. La suma de todos los saldos deudores debe igualar la suma de todos los saldos acreedores." },
    { sec:"IT. V", q:"¿Qué significa que una cuenta tiene 'saldo deudor'?", opts:["Que la empresa tiene una deuda con terceros","Que la suma del debe de esa cuenta es mayor que la suma del haber","Que la cuenta está en rojo (con pérdida)","Que la cuenta pertenece al pasivo del ente"], ans:1, exp:"Saldo deudor = suma del debe > suma del haber para esa cuenta específica. Las cuentas de ACTIVO y de GASTOS normalmente tienen saldo deudor. Que una cuenta tenga saldo deudor no significa que la empresa esté en deuda; simplemente describe la mecánica contable." },
    { sec:"IT. V", q:"¿Cuál es la función del 'Manual de Cuentas'?", opts:["Reemplazar al Plan de Cuentas","Definir el contenido de cada cuenta: qué se debita, qué se acredita y cuál es su saldo normal","Registrar cronológicamente todos los asientos del período","Listar los documentos comerciales por tipo"], ans:1, exp:"El Manual de Cuentas es el complemento del Plan de Cuentas. Para cada cuenta define: denominación, código, qué hechos la debitan, qué hechos la acreditan, saldo normal esperado y ejemplos. Es indispensable para que distintos contadores registren de manera uniforme." },
    { sec:"IT. II", q:"¿Cuál es la diferencia entre activos 'corrientes' y 'no corrientes'?", opts:["Los corrientes son más valiosos","Corrientes: se convertirán en efectivo dentro de un año o ciclo operativo; No corrientes: de largo plazo o permanentes (bienes de uso, intangibles)","Los no corrientes son los únicos que se deprecian","No corrientes son los activos que el ente no usa regularmente"], ans:1, exp:"Activo corriente: se espera convertir en efectivo o consumir dentro de 12 meses o un ciclo operativo. Activo no corriente: permanece en el ente por más de un año (bienes de uso, inversiones de largo plazo, intangibles). Esta distinción es clave para el análisis de liquidez." },
    { sec:"IT. II", q:"¿Qué son los 'bienes de cambio'?", opts:["Dinero en efectivo y en bancos","Los bienes destinados a la venta en el curso ordinario de las actividades del ente o los que se usan para producir los bienes destinados a la venta","Equipos de producción propios del ente","Acciones de otras empresas en cartera"], ans:1, exp:"Bienes de cambio = activos destinados a la venta (mercaderías, productos terminados, materias primas, producción en proceso). Se clasifican como activo corriente porque se venden dentro del ciclo operativo normal. La valuación básica es al costo de adquisición o producción." },
    { sec:"IT. III", q:"Al registrar el pago de sueldos, ¿cómo afecta al patrimonio?", opts:["Es permutativa: el activo caja baja y sube la cuenta sueldos","Es modificativa negativa: baja el activo (caja) y baja el PN (gasto de sueldos)","Es permutativa: baja caja y sube el pasivo sueldos a pagar","Es modificativa positiva: sube la producción y sube el PN"], ans:1, exp:"El pago de sueldos es una variación MODIFICATIVA NEGATIVA (pérdida/gasto): disminuye el activo (caja) y disminuye el PN (se registra el gasto de remuneraciones). No hay compensación → el patrimonio neto cae." },
    { sec:"IT. IV", q:"¿Qué es el 'recibo' como documento comercial?", opts:["Un comprobante de entrega de mercadería","Un documento que el cobrador emite al pagador como constancia de haber recibido una suma de dinero","Una nota bancaria de crédito","Una factura simplificada para consumidores finales"], ans:1, exp:"El recibo es emitido por quien RECIBE el pago y se entrega a quien realiza el pago. Documenta el cobro de una factura u otra obligación. Debe contener: fecha, importe, concepto del pago, firma del cobrador. Es la contrapartida de la factura en el ciclo de cobro." },
    { sec:"IT. I", q:"¿Por qué se dice que la contabilidad tiene un 'doble rol' según Viegas?", opts:["Porque atiende tanto a la AFIP como a los bancos","Porque mide el resultado del ejercicio pero también registra el patrimonio","Porque cumple una función técnica-instrumental (información interna) y una función social-comunicacional (información externa a terceros)","Porque usa tanto el debe como el haber"], ans:2, exp:"Viegas describe el doble rol de la contabilidad: (1) Función técnica-instrumental: provee información para la gestión interna y toma de decisiones. (2) Función social-comunicacional: informa a terceros (inversores, acreedores, Estado) sobre la situación del ente, con impacto en la asignación de recursos en la sociedad." },
    { sec:"IT. III", q:"¿Cuáles son los libros contables obligatorios según el Código de Comercio argentino?", opts:["Solo el Libro Caja","El Libro Diario y el Libro de Inventarios y Balances","El Libro Mayor y el Libro de Actas","El Libro de IVA Ventas y el Libro de IVA Compras"], ans:1, exp:"El Código de Comercio exige como mínimo: (1) Libro Diario: asientos cronológicos. (2) Libro de Inventarios y Balances: detalle patrimonial al inicio y al cierre de cada ejercicio. El Libro Mayor, aunque imprescindible en la práctica, no es obligatorio por ley." },
  ],

};

// ── Función de sorteo: toma N preguntas al azar del banco ─────────
function sortearPreguntas(banco, n) {
  const shuffled = [...banco];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

// ── admQuizData ahora es dinámico: se reemplaza en cada inicio ───
let admQuizData = sortearPreguntas(bancoDePreguntas.adm, 10);

let admQState = { current:0, score:0, answered:0 };

function admRenderQuiz() {
  const qc = document.getElementById('adm-quiz-container');
  const qr = document.getElementById('adm-quiz-result');
  if (!qc) return;
  if (admQState.current >= admQuizData.length) {
    qc.style.display='none'; qr.style.display='block';
    const sc = admQState.score;
    document.getElementById('adm-result-score-num').textContent = sc;
    const pct = Math.round((sc/admQuizData.length)*100);
    let msg = pct>=85?'¡Excelente! Estás muy bien preparado 🎯':pct>=65?'Bien, pero repasá los temas donde fallaste.':pct>=45?'Necesitás repasar bastante antes del parcial.':'Volvé a estudiar el material y reintentá.';
    document.getElementById('adm-result-msg').textContent = msg;
    saveScore('adm', sc, admQuizData.length);
    return;
  }
  const q = admQuizData[admQState.current];
  const pct = (admQState.current / admQuizData.length) * 100;
  document.getElementById('adm-quiz-progress-fill').style.width = pct + '%';
  document.getElementById('adm-quiz-score').textContent = `Correctas: ${admQState.score} / ${admQState.answered}`;
  document.getElementById('adm-quiz-card').innerHTML = `
    <div class="quiz-num">Pregunta ${admQState.current+1} de ${admQuizData.length}</div>
    <div class="quiz-question">${q.q}</div>
    <div class="quiz-options">${q.opts.map((o,i)=>`<button class="quiz-opt" onclick="admAnswer(${i})">${o}</button>`).join('')}</div>
    <div class="quiz-feedback" id="adm-quiz-fb"></div>
  `;
  document.getElementById('adm-quiz-next-btn').style.display='none';
}

function admAnswer(idx) {
  const q = admQuizData[admQState.current];
  admQState.answered++;
  document.querySelectorAll('#adm-quiz-card .quiz-opt').forEach((btn,i)=>{
    btn.classList.add('disabled');
    if(i===q.correct) btn.classList.add('correct');
    else if(i===idx && idx!==q.correct) btn.classList.add('wrong');
  });
  const fb = document.getElementById('adm-quiz-fb');
  fb.classList.add('show');
  if(idx===q.correct){ admQState.score++; fb.classList.add('ok'); fb.innerHTML='<strong>✓ Correcto.</strong> '+q.fb; }
  else { fb.classList.add('bad'); fb.innerHTML=`<strong>✗ Incorrecto.</strong> La respuesta correcta era la opción ${q.correct+1}. ${q.fb}`; }
  document.getElementById('adm-quiz-score').textContent=`Correctas: ${admQState.score} / ${admQState.answered}`;
  document.getElementById('adm-quiz-next-btn').style.display='inline-flex';
}

function admSelectTxt(panelId, btn) {
  document.querySelectorAll('.adm-tv-panel').forEach(p => { p.style.display='none'; p.classList.remove('active'); });
  document.querySelectorAll('#adm-txt-nav .txt-item').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) { panel.style.display='block'; panel.classList.add('active'); }
  if (btn) btn.classList.add('active');
}

function contSelectTxt(panelId, btn) {
  document.querySelectorAll('.cont-tv-panel').forEach(p => { p.style.display='none'; p.classList.remove('active'); });
  document.querySelectorAll('#cont-txt-nav .txt-item').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) { panel.style.display='block'; panel.classList.add('active'); }
  if (btn) btn.classList.add('active');
}

function admQuizNext() { admQState.current++; admRenderQuiz(); }
function admQuizReset() {
  admQuizData = sortearPreguntas(bancoDePreguntas.adm, 10);
  admQState={current:0,score:0,answered:0};
  document.getElementById('adm-quiz-container').style.display='block';
  document.getElementById('adm-quiz-result').style.display='none';
  admRenderQuiz();
}

// Flashcards ADM
const admFlashcards = [
  {term:"Administración",def:"Proceso de planificar, organizar, dirigir y controlar los recursos de una organización para alcanzar objetivos con eficiencia y eficacia."},
  {term:"Eficiencia",def:"Relación entre los recursos utilizados y los productos obtenidos. 'Hacer las cosas correctamente'. Optimización del uso de recursos."},
  {term:"Eficacia",def:"Indicadores que miden el cumplimiento de objetivos propuestos. 'Hacer las cosas correctas'. Logro de metas."},
  {term:"Organización",def:"Unidad social deliberadamente construida para alcanzar fines específicos. Tiene estructura formal, recursos y objetivos expresos (Parsons/Etzioni)."},
  {term:"⚠ Burocracia (Weber)",def:"ESTRUCTURALISTA, NO Clásica. Autoridad reside en los puestos, no en las personas. Reglas estandarizan el comportamiento. Elimina variabilidad por diferencias entre gerentes."},
  {term:"Racionalidad limitada (Simon)",def:"La racionalidad absoluta es imposible: (1) no se consideran todas las alternativas; (2) ni todas las consecuencias; (3) el futuro es incierto (interviene la imaginación). El decisor elige 'la mejor disponible'."},
  {term:"Adm. Científica (Taylor)",def:"Aplica métodos científicos al trabajo operario para determinar la 'única mejor manera'. Estudio de tiempos y movimientos. Sistema de pago por pieza excedente. 4 principios."},
  {term:"Proceso administrativo (Fayol)",def:"5 funciones: Planificar, Organizar, MANDAR, COORDINAR y Controlar (OJO: no es 'Dirigir'). 14 principios de administración. Publicado en 1916. Visión macro (de arriba hacia abajo)."},
  {term:"⚠ Unidad de mando vs. Unidad de dirección",def:"Mando (#4): cada empleado → solo UN supervisor. Dirección (#5): esfuerzos de TODOS centrados en los objetivos de la organización. Son principios distintos — examen los confunde."},
  {term:"Efecto Hawthorne",def:"Productividad aumenta tanto al MEJORAR como al EMPEORAR condiciones físicas. Incluso el grupo de control mejoró. Causa real: la ATENCIÓN POSITIVA recibida, no las condiciones."},
  {term:"Sistema abierto (Bertalanffy)",def:"En constante intercambio con su entorno. Contrario al sistema cerrado (sin relación con el ambiente). Las organizaciones son sistemas abiertos: reciben insumos, los transforman y generan salidas."},
  {term:"Enfoque de Contingencias",def:"Refuta principios universales. Lawrence y Lorsch (1967). Jay Galbraith: (1) no hay única mejor forma de administrar; (2) ninguna forma es igualmente efectiva en todas las organizaciones."},
  {term:"Teorías X e Y (Mc'Gregor)",def:"X: empleados perezosos, necesitan ser dirigidos. Y: creativos y pueden asumir responsabilidades. Son complementarias, no opuestas. Denunció el autoritarismo taylorista."},
  {term:"3 puntos cardinales (Larocca-Barcos)",def:"(1) División del trabajo → Adam Smith. (2) Optimización del trabajo físico → Taylor. (3) Optimización del trabajo directivo → Fayol. Precursor involuntario: Adam Smith."},
  {term:"Adm. Sistemática vs. Científica",def:"Sistemática (~1870): coordina operaciones internas a nivel gerencial. Científica (~1878): optimiza el trabajo OPERARIO individual. Temporal: Sistemática primero, Científica es respuesta a sus limitaciones."},
  {term:"Unidad de mando (Fayol)",def:"Principio Nº4: cada empleado debía asignarse solamente a un supervisor. Evita confusión y conflictos de autoridad."},
  {term:"Sinergia",def:"En Teoría de Sistemas: el todo es mayor que la suma de las partes. Las organizaciones obtienen resultados que sus componentes no lograrían individualmente."},
  {term:"Roles del directivo (Mintzberg)",def:"10 roles en 3 categorías: Interpersonales (cabeza visible, líder, enlace), Informativos (monitor, difusor, portavoz) y Decisorios (empresario, componedor, asignador, negociador)."},
  {term:"Matriz Ansoff",def:"4 estrategias de crecimiento: (1) penetración en el mercado, (2) desarrollo del mercado, (3) desarrollo del producto, (4) diversificación. El orden tiene una prioridad sugerida por Ansoff."},
  {term:"ISO 26000 — 7 materias RSE",def:"(1) Gobernanza, (2) Derechos humanos, (3) Prácticas laborales, (4) Medio ambiente, (5) Prácticas justas de operación, (6) Asuntos de consumidores, (7) Participación y desarrollo comunitario."},
  {term:"Adm. como Ciencia / Técnica / Arte",def:"Son 3 dimensiones simultáneas. Ciencia: objeto propio + método científico. Técnica: transforma la realidad con herramientas. Arte: depende de la personalidad y liderazgo del administrador."},
  {term:"Ventaja competitiva (Porter)",def:"3 estrategias genéricas: (a) costos más bajos, (b) diferenciación, (c) enfoque en nicho. Modelo de las 5 Fuerzas. 'Diamante de Porter' para competitividad de naciones."},
];

function admInitFlashcards() {
  const grid = document.getElementById('adm-fc-grid');
  if(!grid || grid.innerHTML.trim()) return;
  admFlashcards.forEach((fc,i) => {
    grid.innerHTML += `<div class="fc-card" onclick="this.classList.toggle('flipped')"><div class="fc-inner"><div class="fc-front"><div class="fc-label">Concepto ${i+1}</div><div class="fc-term">${fc.term}</div><div class="fc-hint">Click para ver definición →</div></div><div class="fc-back"><div class="fc-label">Definición</div><div class="fc-def">${fc.def}</div></div></div></div>`;
  });
}

// ═══════════════════════════════════════════════════
// CONT 113 — Toggle acordeones U2
// ═══════════════════════════════════════════════════
function toggleContAcc(id) {
  const el = document.getElementById(id);
  if(!el) return;
  const body = el.querySelector('.cont-acc-body');
  const isOpen = el.classList.contains('open');
  el.classList.toggle('open');
  if(body) body.style.display = isOpen ? 'none' : 'block';
}

// Init al cargar
// ═══════════════════════════════════════════════════════════════
//  SHUFFLE + LOCALSTORAGE  ·  portal_fce_v22
// ═══════════════════════════════════════════════════════════════

// ── Fisher-Yates shuffle (no muta el original) ──────────────────
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function applyShuffles() {
  if (typeof propQuestions  !== 'undefined') propQuestions.splice(0,  propQuestions.length,  ...shuffleArray(propQuestions));
  if (typeof propFlashcards !== 'undefined') propFlashcards.splice(0, propFlashcards.length, ...shuffleArray(propFlashcards));
  if (typeof cu1Questions   !== 'undefined') cu1Questions.splice(0,   cu1Questions.length,   ...shuffleArray(cu1Questions));
  if (typeof cu1Flashcards  !== 'undefined') cu1Flashcards.splice(0,  cu1Flashcards.length,  ...shuffleArray(cu1Flashcards));
  if (typeof admQuizData    !== 'undefined') admQuizData.splice(0,    admQuizData.length,    ...shuffleArray(admQuizData));
  if (typeof admFlashcards  !== 'undefined') admFlashcards.splice(0,  admFlashcards.length,  ...shuffleArray(admFlashcards));
}

// ── LocalStorage: checkboxes ────────────────────────────────────
const LS_CB_KEY = 'fce_portal_checkboxes_v1';

function saveCheckboxes() {
  const state = {};
  document.querySelectorAll('input[type="checkbox"][id]').forEach(cb => { state[cb.id] = cb.checked; });
  localStorage.setItem(LS_CB_KEY, JSON.stringify(state));
}

function restoreCheckboxes() {
  const raw = localStorage.getItem(LS_CB_KEY);
  if (!raw) return;
  let state; try { state = JSON.parse(raw); } catch(e) { return; }
  Object.entries(state).forEach(([id, checked]) => {
    const cb = document.getElementById(id);
    if (cb && cb.type === 'checkbox') cb.checked = checked;
  });
}

function bindCheckboxPersistence() {
  document.querySelectorAll('input[type="checkbox"][id]').forEach(cb => {
    cb.addEventListener('change', saveCheckboxes);
  });
}

// ── LocalStorage: puntajes de quizzes ───────────────────────────
const LS_SCORES_KEY = 'fce_portal_scores_v1';

function saveScore(quizId, score, total) {
  const raw = localStorage.getItem(LS_SCORES_KEY);
  let scores = {}; try { scores = raw ? JSON.parse(raw) : {}; } catch(e) {}
  const pct  = Math.round((score / total) * 100);
  const prev = scores[quizId];
  scores[quizId] = {
    last: { score, total, pct },
    best: (!prev || pct > prev.best.pct) ? { score, total, pct } : prev.best
  };
  localStorage.setItem(LS_SCORES_KEY, JSON.stringify(scores));
  setTimeout(function(){ if(typeof N82Integrity!=='undefined') N82Integrity.save(); }, 100);
  kpiRefreshDominio();
}

function getBestScore(quizId) {
  const raw = localStorage.getItem(LS_SCORES_KEY);
  if (!raw) return null;
  try { const s = JSON.parse(raw); return s[quizId] ? s[quizId].best : null; } catch(e) { return null; }
}

// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  applyShuffles();
  restoreCheckboxes();
  bindCheckboxPersistence();
  admRenderQuiz();
  admInitFlashcards();

  // ── DASHBOARD DINÁMICO ──────────────────────────────────────────
  const hoy = new Date();

  // Cuenta regresiva al 1er parcial
  const parcialDate = new Date('2026-04-08T00:00:00');
  const diff = Math.ceil((parcialDate - hoy) / (1000*60*60*24));
  const pill = document.getElementById('dash-parcial-text');
  if (pill) {
    if (diff > 0) pill.textContent = '1ER PARCIAL · ' + diff + ' día' + (diff===1?'':'s');
    else if (diff === 0) pill.textContent = '1ER PARCIAL · HOY';
    else pill.textContent = '1ER PARCIAL · COMPLETADO';
  }

  // Progreso del cuatrimestre
  const inicio = new Date('2026-03-10');
  const fin    = new Date('2026-07-18');
  const pct = Math.min(100, Math.max(0, Math.round((hoy - inicio) / (fin - inicio) * 100)));
  const bar = document.getElementById('dash-cuatri-bar');
  const pctEl = document.getElementById('dash-cuatri-pct');
  if (pctEl) pctEl.textContent = pct + '%';
  if (bar) setTimeout(() => { bar.style.width = pct + '%'; }, 300);

  // Fecha de hoy
  const fechaEl = document.getElementById('dash-fecha');
  if (fechaEl) {
    const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    fechaEl.textContent = dias[hoy.getDay()] + ' ' + hoy.getDate() + ' ' + meses[hoy.getMonth()];
  }

  // ── KPI 1: DOMINIO DE CÁTEDRA ──────────────────────────────────
  (function() {
    const quizzes = [
      { id:'prop',   total:25, barId:'kpib-prop',   color:'rgba(192,57,43,.85)' },
      { id:'cu1',    total:30, barId:'kpib-cu1',    color:'rgba(26,110,74,.85)' },
      { id:'adm',    total:25, barId:'kpib-adm',    color:'rgba(26,74,138,.85)' },
      { id:'soc-u3', total:10, barId:'kpib-soc-u3', color:'rgba(167,139,250,.85)' },
    ];
    const valEl = document.getElementById('kpi-dominio-val');
    const lblEl = document.getElementById('kpi-dominio-label');
    if (!valEl) return;

    const raw = localStorage.getItem('fce_portal_scores_v1');
    let scores = {}; try { scores = raw ? JSON.parse(raw) : {}; } catch(e) {}

    let sumPct = 0, count = 0;
    quizzes.forEach(q => {
      const pct = scores[q.id] ? scores[q.id].best.pct : 0;
      if (pct > 0) { sumPct += pct; count++; }
      // Sparkline: height 4–28px proportional
      const bar = document.getElementById(q.barId);
      if (bar) {
        const h = Math.max(4, Math.round((pct/100)*28));
        bar.style.background = pct > 0 ? q.color : 'rgba(100,100,100,.15)';
        setTimeout(() => { bar.style.height = h + 'px'; }, 400);
      }
    });

    const avg = count > 0 ? Math.round(sumPct / count) : 0;
    valEl.textContent = avg + '%';
    if (count === 0) {
      lblEl.textContent = 'Completá un quiz para empezar';
    } else {
      const parts = quizzes.filter(q => scores[q.id]).map(q =>
        q.id.toUpperCase().replace('-U3','') + '\u00a0' + scores[q.id].best.pct + '%'
      );
      lblEl.textContent = parts.join(' \u00b7 ');
    }
    // Animate big number color
    if (avg >= 70) valEl.style.color = 'var(--color-ok,#3fb950)';
    else if (avg >= 50) valEl.style.color = 'var(--color-warn,#e3b341)';
    else if (avg > 0)  valEl.style.color = 'var(--color-err,#f85149)';
  })();

  // ── KPI 2: LECTURA CRÍTICA ─────────────────────────────────────
  (function() {
    const valEl = document.getElementById('kpi-lectura-val');
    const lblEl = document.getElementById('kpi-lectura-label');
    if (!valEl) return;

    // Checkboxes por materia — prefijos de IDs  (v19.3.1: colors from NEXUS_COLORS)
    const materias = [
      { prefix:'prop', label:'PROP', barId:'klbar-prop', txtId:'kltxt-prop', total:4, color: NEXUS_COLORS.materias.prop.base },
      { prefix:'cont', label:'CONT', barId:'klbar-cont', txtId:'kltxt-cont', total:7, color: NEXUS_COLORS.materias.cont.base },
      { prefix:'adm',  label:'ADM',  barId:'klbar-adm',  txtId:'kltxt-adm',  total:5, color: NEXUS_COLORS.materias.adm.base  },
      { prefix:'soc',  label:'SOC',  barId:'klbar-soc',  txtId:'kltxt-soc',  total:5, color: NEXUS_COLORS.materias.soc.base  },
    ];
    const TOTAL = materias.reduce((s,m)=>s+m.total,0); // 21

    // Leer LS
    const raw = localStorage.getItem('fce_portal_checkboxes_v1');
    let state = {}; try { state = raw ? JSON.parse(raw) : {}; } catch(e) {}

    // También leer DOM en vivo
    document.querySelectorAll('input[type="checkbox"][id]').forEach(cb => {
      if (cb.checked) state[cb.id] = true;
    });

    let totalMarcadas = 0;
    materias.forEach(m => {
      const marcadas = Object.entries(state).filter(([k,v]) => v && k.startsWith(m.prefix+'-')).length;
      const capped   = Math.min(marcadas, m.total);
      totalMarcadas += capped;
      const pct      = Math.round((capped / m.total) * 100);
      const barEl    = document.getElementById(m.barId);
      const txtEl    = document.getElementById(m.txtId);
      if (barEl) { barEl.style.background = m.color; setTimeout(()=>{ barEl.style.width = pct + '%'; }, 450); }
      if (txtEl) txtEl.textContent = capped + '/' + m.total;
    });

    const totalCapped = Math.min(totalMarcadas, TOTAL);
    const pctTotal    = Math.round((totalCapped / TOTAL) * 100);
    valEl.textContent = totalCapped + '/' + TOTAL;
    lblEl.textContent = totalCapped === 0
      ? 'Marcá secciones como leídas para trackear'
      : pctTotal + '% del material revisado';
    if (pctTotal >= 70) valEl.style.color = 'var(--color-ok,#3fb950)';
  })();

  // ── KPI 3: RIESGO DE EXAMEN ────────────────────────────────────
  (function() {
    const valEl    = document.getElementById('kpi-riesgo-val');
    const lblEl    = document.getElementById('kpi-riesgo-label');
    const badgeEl  = document.getElementById('kpi-riesgo-badge');
    const cardEl   = document.getElementById('kpi-riesgo-card');
    const cursorEl = document.getElementById('kpi-gauge-cursor');
    if (!valEl) return;

    const bestRaw = localStorage.getItem('fce_clf_best_v1');
    const best    = bestRaw ? (parseInt(bestRaw) || 0) : 0;

    // Gauge: racha 0–20 → posición 0–100%
    // Cursor va de izquierda (ALTO) a derecha (BAJO) — invertido con la racha
    const MAX_RACHA = 20;
    const gaugePos  = Math.min(100, Math.round((best / MAX_RACHA) * 100));

    let nivel, badgeClass, accentColor, labelTxt;
    if (best === 0) {
      nivel       = 'SIN DATOS'; badgeClass = 'neutro';    accentColor = '#999';
      labelTxt    = 'Hacé una sesión en el Entrenador para activar';
    } else if (best >= 10) {
      nivel       = 'BAJO';      badgeClass = 'verde';     accentColor = 'var(--color-ok,#3fb950)';
      labelTxt    = `Racha de ${best}. Dominio sólido de clasificación \u2713`;
    } else if (best >= 5) {
      nivel       = 'MODERADO';  badgeClass = 'amarillo';  accentColor = 'var(--color-warn,#e3b341)';
      labelTxt    = `Racha de ${best}. Repasá Pasivo y cuentas de Resultado`;
    } else {
      nivel       = 'ALTO';      badgeClass = 'rojo';      accentColor = 'var(--color-err,#f85149)';
      labelTxt    = `Racha de ${best}. Trabajar clasificación antes del parcial`;
    }

    valEl.textContent      = best > 0 ? best : 'N/D';
    badgeEl.textContent    = nivel;
    badgeEl.className      = 'kpi-badge ' + badgeClass;
    lblEl.textContent      = labelTxt;
    cardEl.style.setProperty('--kpi-accent', accentColor);
    if (best > 0) valEl.style.color = accentColor;

    setTimeout(() => {
      if (cursorEl) cursorEl.style.left = gaugePos + '%';
    }, 500);
  })();

});


// ── Mapa de contexto por página ──────────────────────────────────
const iaContexto = {
  'home': {
    tema: 'el Portal FCE 2026 - Ciclo Inicial UNPSJB',
    resumen: 'Portal de estudio para las cuatro materias del Ciclo Inicial 2026 de la FCE UNPSJB (Trelew): Área Propedéutica (114), Introducción a la Contabilidad (113), Introducción a la Administración (111) e Introducción a las Ciencias Sociales (112).'
  },
  // PROPEDÉUTICA
  'prop-prog': { tema: 'Propedéutica - Programa y estructura de la materia', resumen: 'Área Propedéutica (COD.114) abarca el Estatuto UNPSJB, normativa FCE (RGAA, Ord. CS N°120), Calendario Académico 2026 y contenidos introductorios a la vida universitaria.' },
  'prop-resumenes': { tema: 'Propedéutica - Estatuto UNPSJB y Universidad', resumen: 'El Estatuto UNPSJB regula la organización universitaria: autoridades (Rector, Decanos, Consejo Superior, Consejos Directivos), derechos y deberes de alumnos, régimen académico general y normativa FCE Trelew (RGAA).' },
  'prop-quiz': { tema: 'Propedéutica - Quiz y Flashcards', resumen: 'Evaluación sobre Estatuto UNPSJB, Calendario Académico 2026, estructura de gobierno universitario y normativa FCE.' },
  'prop-conceptos': { tema: 'Propedéutica - Mapa de conceptos', resumen: 'Mapa conceptual sobre la estructura universitaria argentina, el Estatuto UNPSJB y la organización de la FCE Trelew.' },
  // CONTABILIDAD
  'cont-resumenes': { tema: 'Contabilidad I - Itinerario I · Marco Conceptual', resumen: 'La contabilidad es un sistema de información patrimonial. El Estado Patrimonial (EP) muestra: ACTIVO (bienes y derechos), PASIVO (obligaciones) y PATRIMONIO NETO (PN = A - P). Las normas contables argentinas se denominan Resoluciones Técnicas (RT). La RT N°16 es el marco conceptual. La ecuación básica: A = P + PN.' },
  'cont-u2-elementos': { tema: 'Contabilidad I - Itinerario II · Elementos del Patrimonio', resumen: 'Elementos del patrimonio: Activo (bienes de uso, de cambio, disponibilidades, créditos, intangibles), Pasivo (deudas ciertas, contingentes), PN (capital, reservas, resultados). Criterios de reconocimiento y medición. RT N°16 y RT N°17 como marcos normativos.' },
  'cont-u2-resumenes': { tema: 'Contabilidad I - Itinerario II · Patrimonio y Registración', resumen: 'Ecuación dinámica del patrimonio. Partida doble: toda variación tiene un debe y un haber. Variaciones patrimoniales: modificativas (afectan PN) y permutativas (no afectan PN). Teoría de los valores. Asientos contables y el Libro Diario.' },
  'cont-u3-partida': { tema: 'Contabilidad I - Itinerario III · Partida Doble y Variaciones', resumen: 'Principio de partida doble: no hay deudor sin acreedor. Debe = Haber en todo asiento. Las cuentas tienen saldo deudor (activos, gastos) o acreedor (pasivos, PN, ingresos). Variaciones modificativas positivas aumentan PN; negativas lo disminuyen.' },
  'cont-u3-it4': { tema: 'Contabilidad I - Itinerario IV · Documentos Comerciales', resumen: 'Documentos respaldatorios de operaciones: facturas (tipos A, B, C), remitos, recibos, notas de débito y crédito, pagarés, cheques. Función probatoria y contable de cada documento. Base para el registro en el Libro Diario.' },
  'cont-u3-it5': { tema: 'Contabilidad I - Itinerario V · Cuentas y Plan de Cuentas', resumen: 'Una cuenta es el registro de variaciones de un elemento patrimonial. El Plan de Cuentas organiza las cuentas en clases (Activo, Pasivo, PN, Resultado). Codificación decimal. Cuentas T: lado izquierdo (Debe) y lado derecho (Haber). Saldo = diferencia entre débitos y créditos.' },
  'cont-u3-it6': { tema: 'Contabilidad I - Itinerario VI · Registros Contables y Libros', resumen: 'Registros contables: Libro Diario (heterogéneo, 1ª entrada), Libro Mayor (homogéneo, 2ª entrada, NO obligatorio), Libro Inventarios y Balances (obligatorio, NUNCA reemplazable por PC). Sistemas de registración: Directo, Directo con Auxiliares, Indirecto (Subdiarios). Marco legal: CCC Arts. 320-330 y LGS Art. 61.' },
  'cont-conceptos': { tema: 'Contabilidad I - Conceptos clave', resumen: 'Glosario contable: Activo, Pasivo, PN, Resultado, Variación patrimonial, Partida doble, Plan de cuentas, Asiento, Debe, Haber, Saldo deudor/acreedor, RT N°16, Estado Patrimonial, Estado de Resultados.' },
  'cont-quiz': { tema: 'Contabilidad I - Quiz y Flashcards completo', resumen: 'Evaluación integral de Contabilidad I (Itinerarios I a V): marco conceptual, elementos del patrimonio, partida doble, documentos comerciales y plan de cuentas.' },
  'cont-clasificador': { tema: 'Contabilidad I - Clasificación de cuentas (Activo, Pasivo, PN, Resultado)', resumen: 'Entrenamiento en clasificación de cuentas contables. Activo: bienes y derechos (Caja, Banco, Mercaderías, Rodados, Inmuebles). Pasivo: obligaciones (Proveedores, Préstamos, Sueldos a Pagar). PN: Capital, Reservas, RNA. Resultado: Ventas, CMV, Gastos (positivos y negativos).' },
  // ADMINISTRACIÓN
  'adm-u1-conceptos': { tema: 'Administración I - U1 · Concepto y Evolución de la Administración', resumen: 'La Administración es el proceso de planear, organizar, dirigir y controlar el uso de recursos para alcanzar objetivos. Surge con la Revolución Industrial. Evolución: desde el enfoque clásico (Taylor, Fayol) hasta enfoques contemporáneos (sistémico, contingencial, de calidad total).' },
  'adm-u1-escuelas': { tema: 'Administración I - U1 · Enfoques y Escuelas del Pensamiento Administrativo', resumen: '7 escuelas: 1) Clásica (Taylor/Fayol - eficiencia y estructura), 2) Relaciones Humanas (Mayo - factor humano), 3) Neoclásica (Drucker - resultados), 4) Burocrática (Weber - normas y jerarquía), 5) Estructuralista (organizaciones complejas), 6) Sistémica (sistema abierto), 7) Contingencial (no hay solución universal).' },
  'adm-u1-autores': { tema: 'Administración I - U1 · Autores clave', resumen: 'Taylor (Administración Científica, 4 principios), Fayol (14 principios, 5 funciones POD-CC), Weber (burocracia ideal), Mayo (Hawthorne, motivación), Maslow (pirámide de necesidades), Herzberg (higiene vs motivación), Drucker (administración por objetivos).' },
  'adm-u1-quiz': { tema: 'Administración I - U1 · Quiz y Flashcards', resumen: 'Evaluación sobre escuelas de administración, autores clave, conceptos de eficiencia/eficacia, principios de Fayol y Taylor, y aportes de cada corriente al pensamiento administrativo.' },
  'adm-u1-trampas': { tema: 'Administración I - U1 · Trampas de parcial', resumen: 'Errores comunes: confundir eficiencia (hacer bien las cosas) con eficacia (hacer las cosas correctas). Taylor ≠ Fayol (Taylor=operaciones, Fayol=funciones directivas). Mayo no refuta a Taylor sino que agrega la dimensión humana. La burocracia de Weber es un tipo ideal, no un sistema real.' },
  // CIENCIAS SOCIALES
  'soc-resumenes': { tema: 'Cs. Sociales - U1 · Bachelard, Kant, Foucault, Marcuse', resumen: 'Bachelard: obstáculos epistemológicos y ruptura. El conocimiento científico avanza rompiendo con el conocimiento vulgar. Foucault: episteme y arqueología del saber. Marcuse: pensamiento unidimensional y crítica a la sociedad industrial. La ciencia no es neutral: está atravesada por el poder y la ideología.' },
  'soc-resumenes-u2': { tema: 'Cs. Sociales - U2 · Angenot, Bourdieu, Berger y Luckmann, Gutiérrez', resumen: 'Angenot: discurso social y hegemonía discursiva. Bourdieu: campo, habitus y capital (económico, cultural, social, simbólico). La violencia simbólica reproduce la dominación. Berger y Luckmann: construcción social de la realidad (externalización, objetivación, internalización). Gutiérrez: aplicación del marco bourdieusiano en Argentina.' },
  'soc-resumenes-u3': { tema: 'Cs. Sociales - U3 · Cultura, identidad y diversidad', resumen: 'U3 aborda cultura, identidad colectiva, diversidad cultural y producción simbólica en el contexto latinoamericano. Tensiones entre identidades locales y globalización. Dimensión política de la cultura y la construcción de sentido social.' },
  'soc-quiz': { tema: 'Cs. Sociales - U1 · Quiz', resumen: 'Quiz sobre Bachelard (obstáculos epistemológicos, ruptura epistemológica, perfil epistemológico), Foucault (episteme, arqueología), Kant (a priori, crítica de la razón) y Marcuse (unidimensionalidad).' },
  'soc-quiz-u2': { tema: 'Cs. Sociales - U2 · Quiz', resumen: 'Quiz sobre Angenot (discurso social, hegemonía), Bourdieu (campo, habitus, capitales, violencia simbólica), Berger & Luckmann (construcción social de la realidad) y Gutiérrez (relectura de Bourdieu en Argentina).' },
  'soc-quiz-u3': { tema: 'Cs. Sociales - U3 · Quiz', resumen: 'Quiz sobre cultura, identidad, diversidad y producción simbólica. Autores: Bourdieu, Arfuch, Borges. Conceptos: giro afectivo, identidad narrativa, imaginario social.' },
  'soc-ov': { tema: 'Propedéutica - Educación Superior (Capítulo 3)', resumen: 'Cap. 3 de Educación Superior aborda la universidad argentina: su historia, autonomía, cogobierno, extensión y vinculación con la sociedad. La función social del conocimiento y el rol de los estudiantes como actores universitarios.' },
  'soc-actividades': { tema: 'Cs. Sociales - Actividades Prácticas', resumen: 'Actividades prácticas: mapas conceptuales, análisis de textos, aplicación de marcos teóricos (Bachelard, Bourdieu, Angenot) a casos concretos. Preguntas integradoras para examen parcial.' },
};

// Fallback para páginas sin contexto definido
function iaGetContexto(pageId) {
  if (iaContexto[pageId]) return iaContexto[pageId];
  // Inferencia por prefijo
  const prefix = pageId.split('-')[0];
  const materia = { prop: 'Área Propedéutica (COD.114)', cont: 'Introducción a la Contabilidad (COD.113)', adm: 'Introducción a la Administración (COD.111)', soc: 'Introducción a las Ciencias Sociales (COD.112)' };
  return {
    tema: materia[prefix] || 'FCE UNPSJB - Ciclo Inicial 2026',
    resumen: 'Material de estudio de la FCE UNPSJB, Ciclo Inicial 2026.'
  };
}

// ── Función principal del FAB ────────────────────────────────────
function iaCopiarContexto() {
  // Detectar página activa
  const activaEl = document.querySelector('.page.active');
  const pageId   = activaEl ? activaEl.id : 'home';
  const ctx      = iaGetContexto(pageId);
  const tema     = ctx.tema;
  const resumen  = ctx.resumen;

  const texto = `Hola Claude. Soy estudiante de la FCE UNPSJB (Trelew), cursando el Ciclo Inicial 2026. Estoy estudiando ${tema}. En base a este resumen: "${resumen}" — explicame de forma sencilla el siguiente concepto: `;

  // Copiar al portapapeles
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto)
      .then(() => iaShowToast('✓ Contexto copiado. ¡Pegalo en tu chat de IA!', true))
      .catch(() => iaFallbackCopy(texto));
  } else {
    iaFallbackCopy(texto);
  }
}

function iaFallbackCopy(texto) {
  const ta = document.createElement('textarea');
  ta.value = texto;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    iaShowToast('✓ Contexto copiado. ¡Pegalo en tu chat de IA!', true);
  } catch(e) {
    iaShowToast('No se pudo copiar automáticamente.', false);
  }
  document.body.removeChild(ta);
}

// ── Toast ────────────────────────────────────────────────────────
let iaToastTimer = null;

/* v4.0 ── Motivational message ────────────────────────────────── */
(function initMotivational() {
  var MSGS = [
    { icon:'🔥', text:'El parcial se gana repasando hoy. Un material a la vez.' },
    { icon:'🧠', text:'Cada concepto leído es una trampa de parcial desactivada.' },
    { icon:'📚', text:'Bachelard tenía razón: el conocimiento avanza rompiendo con lo anterior.' },
    { icon:'⚡', text:'10 minutos de foco valen más que 2 horas de scroll.' },
    { icon:'🎯', text:'Marcá materiales como leídos y observá cómo sube tu progreso.' },
    { icon:'🏆', text:'La diferencia entre un 6 y un 10 es qué tanto repasaste antes del parcial.' },
    { icon:'💡', text:'Los errores frecuentes están cargados en "Trampas de parcial". Revisalos.' },
    { icon:'🌱', text:'Consistencia sobre intensidad. Un poco cada día funciona.' },
  ];
  var msg = MSGS[Math.floor(Math.random() * MSGS.length)];
  var iconEl = document.querySelector('#v4-motivational .v4-motivational-icon');
  var textEl = document.getElementById('v4-motivational-text');
  if (iconEl) iconEl.textContent = msg.icon;
  if (textEl) textEl.textContent = msg.text;
})();

function iaShowToast(msg, ok) {
  const toast = document.getElementById('ia-toast');
  const msgEl = document.getElementById('ia-toast-msg');
  msgEl.textContent = msg;
  toast.style.background = ok ? '#1a1510' : '#8b1a1a';
  toast.style.opacity    = '1';
  toast.style.transform  = 'translateY(0) scale(1)';
  toast.style.pointerEvents = 'auto';
  if (iaToastTimer) clearTimeout(iaToastTimer);
  iaToastTimer = setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateY(12px) scale(.96)';
    toast.style.pointerEvents = 'none';
  }, 3200);
}

// ── Pulso sutil del FAB al cambiar de página (hook no-recursivo) ──
// El pulso se inyecta directamente en el goto original más abajo.

// ── KPI refresh functions (llamadas desde saveScore y clfSaveBest) ─
function kpiRefreshDominio() {
  const valEl = document.getElementById('kpi-dominio-val');
  const lblEl = document.getElementById('kpi-dominio-label');
  const barEl = document.getElementById('kpi-dominio-bar');
  if (!valEl) return;
  const raw = localStorage.getItem('fce_portal_scores_v1');
  if (!raw) return;
  let scores; try { scores = JSON.parse(raw); } catch(e) { return; }
  const quizzes = [{id:'prop',total:25},{id:'cu1',total:30},{id:'adm',total:25},{id:'soc-u3',total:10}];
  let sumPct = 0, count = 0;
  quizzes.forEach(q => { if (scores[q.id]?.best) { sumPct += scores[q.id].best.pct; count++; } });
  if (!count) return;
  const avg = Math.round(sumPct / count);
  valEl.style.animation = 'none'; valEl.offsetHeight; valEl.style.animation = 'kpiCountUp .4s ease';
  valEl.textContent = avg + '%';
  lblEl.textContent = `Promedio sobre ${count} quiz${count>1?'zes':''}. Mejor: ${quizzes.filter(q=>scores[q.id]).map(q=>q.id.toUpperCase()+' '+scores[q.id].best.pct+'%').join(' · ')}`;
  barEl.style.width = avg + '%';
}

function kpiRefreshRiesgo() {
  const valEl    = document.getElementById('kpi-riesgo-val');
  const lblEl    = document.getElementById('kpi-riesgo-label');
  const badgeEl  = document.getElementById('kpi-riesgo-badge');
  const cardEl   = document.getElementById('kpi-riesgo-card');
  const cursorEl = document.getElementById('kpi-gauge-cursor');
  if (!valEl || !lblEl || !badgeEl || !cardEl) return;

  const best     = parseInt(localStorage.getItem('fce_clf_best_v1') || '0') || 0;
  const gaugePos = Math.min(100, Math.round((best / 20) * 100));

  valEl.style.animation = 'none';
  void valEl.offsetHeight;
  valEl.style.animation = 'kpiCountUp .4s ease';
  valEl.textContent = best > 0 ? best : 'N/D';

  let nivel, badgeClass, accentColor, labelTxt;
  if (best === 0) {
    nivel = 'SIN DATOS'; badgeClass = 'neutro';   accentColor = '#999';
    labelTxt = 'Hace una sesion en el Entrenador para activar';
  } else if (best >= 10) {
    nivel = 'BAJO';      badgeClass = 'verde';     accentColor = 'var(--color-ok,#3fb950)';
    labelTxt = 'Racha de ' + best + '. Dominio solido de clasificacion';
  } else if (best >= 5) {
    nivel = 'MODERADO';  badgeClass = 'amarillo';  accentColor = 'var(--color-warn,#e3b341)';
    labelTxt = 'Racha de ' + best + '. Repasa Pasivo y cuentas de Resultado';
  } else {
    nivel = 'ALTO';      badgeClass = 'rojo';      accentColor = 'var(--color-err,#f85149)';
    labelTxt = 'Racha de ' + best + '. Trabajar clasificacion antes del parcial';
  }

  badgeEl.textContent = nivel;
  badgeEl.className   = 'kpi-badge ' + badgeClass;
  lblEl.textContent   = labelTxt;
  cardEl.style.setProperty('--kpi-accent', accentColor);
  if (best > 0) valEl.style.color = accentColor;
  if (cursorEl) cursorEl.style.left = gaugePos + '%';

}

/* v4.5 ── gotoAg: navigate to materiales page + scroll to agrupador section ── */
window.gotoAg = function(pageId, el, agrupador) {
  goto(pageId, el);
  function tryScroll(n) {
    if (n <= 0) return;
    var page = document.getElementById(pageId);
    if (!page) return;
    var target = page.querySelector('.fce-unit-panel[data-unit="' + agrupador + '"]');
    if (!target) target = page.querySelector('.mc-unit[data-ag="' + agrupador + '"]');
    if (target) {
      if (target.classList.contains('fce-unit-panel') && typeof fceTab === 'function') {
        fceTab(pageId, agrupador);
      }
      setTimeout(function() { target.scrollIntoView({behavior:'smooth',block:'start'}); }, 100);
    } else if (agrupador === 'TP') {
      /* Filtrar prácticos: activar tab TEST o buscar cards con tipo Práctico */
      if (typeof fceTab === 'function') fceTab(pageId, 'TEST');
      setTimeout(function() {
        var cards = page ? page.querySelectorAll('.mat-card') : [];
        var first = null;
        cards.forEach(function(c) {
          if (!first && (c.dataset.tipo === 'Práctico' || c.classList.contains('mc-tipo-practico'))) first = c;
        });
        if (first) first.scrollIntoView({behavior:'smooth',block:'start'});
      }, 200);
    } else {
      setTimeout(function() { tryScroll(n-1); }, 150);
    }
  }
  tryScroll(6);
};

/* v19.3.1 — _v52ColorMap derivado de NEXUS_COLORS */
var _v52ColorMap = (function() {
  var m = NEXUS_COLORS.materias;
  return {
    'Propedéutica':   m.prop.base, 'Contabilidad':     m.cont.base,
    'Contabilidad I': m.cont.base, 'Administración':   m.adm.base,
    'Administración I': m.adm.base,'Sociales':         m.soc.base,
    'Cs. Sociales':   m.soc.base
  };
})();

function _v52Color(materia) { return _v52ColorMap[materia] || NEXUS_COLORS.materias.home.base /* v19.3.2 */; }

function _v52GetQuestions(materia, agrupador) {
  var bank = [];
  if (materia === 'Sociales' || materia === 'Cs. Sociales') {
    if      (agrupador === 'U1') bank = typeof sqData  !== 'undefined' ? sqData  : [];
    else if (agrupador === 'U2') bank = typeof sq2Data !== 'undefined' ? sq2Data : [];
    else if (agrupador === 'U3') bank = typeof quizU3  !== 'undefined' ? quizU3  : [];
    else bank = typeof sqData !== 'undefined' ? sqData : [];
  } else if (materia === 'Propedéutica') {
    bank = typeof propQuestions !== 'undefined' ? propQuestions : [];
  } else if (typeof bancoDePreguntas !== 'undefined') {
    var key = (materia === 'Administración' || materia === 'Administración I') ? 'adm' : 'cont';
    bank = bancoDePreguntas[key] || [];
  }
  if (!bank.length) return [];
  var s = bank.slice(); /* shuffle */
  for (var i = s.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = s[i]; s[i] = s[j]; s[j] = tmp;
  }
  return s.slice(0, Math.min(s.length, 10));
}

function _v52GetFlashcards(materia, agrupador) {
  if (materia === 'Sociales' || materia === 'Cs. Sociales') {
    if      (agrupador === 'U1') return typeof fcData  !== 'undefined' ? fcData  : [];
    else if (agrupador === 'U2') return typeof fc2Data !== 'undefined' ? fc2Data : [];
    else if (agrupador === 'U3') return typeof flashU3 !== 'undefined' ? flashU3 : [];
  }
  if (materia === 'Propedéutica' && typeof fcData !== 'undefined') return fcData;
  return [];
}

/* ── Quiz ── */
window.v52QuizStart = function(cid, materia, agrupador) {
  var el = document.getElementById(cid);
  if (!el) return;
  var q = _v52GetQuestions(materia, agrupador);
  var color = _v52Color(materia);
  if (!q.length) {
    el.innerHTML = '<p style="font-family:\'DM Mono\',monospace;font-size:.7rem;color:rgba(255,255,255,.35);padding:16px 0">Quiz próximamente para este módulo.</p>';
    return;
  }
  el._v52 = { q:q, idx:0, score:0, ans:false, mat:materia, ag:agrupador, color:color };
  _v52RenderQ(el);
};

function _v52RenderQ(el) {
  var s = el._v52;
  var color = s.color;
  if (s.idx >= s.q.length) {
    var pct = Math.round(s.score / s.q.length * 100);
    el.innerHTML =
      '<div style="text-align:center;padding:28px 16px">' +
      '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:3.5rem;line-height:1;color:' + color + '">' + s.score + '</div>' +
      '<div style="font-family:\'DM Mono\',monospace;font-size:.62rem;color:rgba(255,255,255,.45);margin:4px 0 8px">de ' + s.q.length + ' · ' + pct + '%</div>' +
      '<div style="font-family:\'Fraunces\',serif;font-size:.85rem;color:rgba(255,255,255,.7);margin-bottom:20px">' +
        (pct>=80?'Excelente 🎯 Listo para el parcial':pct>=60?'Bien 📚 Repasá los errores':'Necesitás repasar esta unidad ⚠️') +
      '</div>' +
      '<button class="v5-quiz-btn" style="background:' + color + '" onclick="v52QuizStart(\'' + el.id + '\',\'' + s.mat + '\',\'' + s.ag + '\')">Reintentar</button>' +
      '</div>';
    return;
  }
  var qObj = s.q[s.idx];
  var opts = qObj.opts || qObj.options || [];
  var correct = qObj.ans !== undefined ? qObj.ans : qObj.correct;
  var pct = Math.round((s.idx / s.q.length) * 100);

  var html =
    '<span class="v5-quiz-num">Pregunta ' + (s.idx+1) + ' / ' + s.q.length + '</span>' +
    '<div class="v5-quiz-bar-wrap"><div class="v5-quiz-bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>' +
    '<p class="v5-quiz-q">' + (qObj.q || qObj.question || '') + '</p>';

  opts.forEach(function(opt, i) {
    html += '<button class="v5-quiz-opt" data-i="' + i + '" onclick="_v52OptClick(\'' + el.id + '\',' + i + ',' + correct + ',this)">' +
      '<span class="v5-opt-letter">' + String.fromCharCode(65+i) + '</span>' +
      '<span>' + opt + '</span></button>';
  });

  html += '<div id="' + el.id + '-fb" class="v5-quiz-fb" style="display:none"></div>' +
    '<button id="' + el.id + '-nxt" class="v5-quiz-btn" style="display:none;background:' + color + '" onclick="_v52Next(\'' + el.id + '\')">Siguiente →</button>';

  el.innerHTML = html;
}

window._v52OptClick = function(cid, chosen, correct, btn) {
  var el = document.getElementById(cid);
  if (!el || !el._v52 || el._v52.ans) return;
  el._v52.ans = true;
  var isOk = chosen === correct;
  if (isOk) el._v52.score++;
  el.querySelectorAll('.v5-quiz-opt').forEach(function(b, i) {
    b.disabled = true;
    if (i === correct) b.classList.add('v5-opt-correct');
    else if (i === chosen && !isOk) b.classList.add('v5-opt-wrong');
  });
  var qObj = el._v52.q[el._v52.idx];
  var fb = document.getElementById(cid + '-fb');
  if (fb) {
    fb.style.display = 'block';
    fb.className = 'v5-quiz-fb ' + (isOk ? 'v5-fb-ok' : 'v5-fb-no');
    fb.textContent = (isOk ? '✓ Correcto. ' : '✗ Incorrecto. ') + (qObj.exp || qObj.explanation || '');
  }
  var nxt = document.getElementById(cid + '-nxt');
  if (nxt) nxt.style.display = 'inline-block';
};

window._v52Next = function(cid) {
  var el = document.getElementById(cid);
  if (!el || !el._v52) return;
  el._v52.idx++;
  el._v52.ans = false;
  _v52RenderQ(el);
};

/* ── Flashcards con flip (FASE 3) ── */
window.v52FlashStart = function(cid, materia, agrupador) {
  var el = document.getElementById(cid);
  if (!el) return;
  var cards = _v52GetFlashcards(materia, agrupador);
  var color = _v52Color(materia);
  if (!cards.length) {
    el.innerHTML = '<p style="font-family:\'DM Mono\',monospace;font-size:.7rem;color:rgba(255,255,255,.35);padding:16px 0">Flashcards próximamente.</p>';
    return;
  }
  /* Array temporal según especificación FASE 3 */
  el._v52fc = { cards: cards, currentIndex: 0, mat: materia, ag: agrupador, color: color };
  _v52RenderFC(el);
};

function _v52RenderFC(el) {
  var s = el._v52fc;
  var c = s.cards[s.currentIndex];
  var color = s.color;
  var front = c.f || c.q || c.front || '';
  var back  = c.b || c.a || c.back  || '';

  el.innerHTML =
    '<span class="v5-fc-counter">Flashcard ' + (s.currentIndex+1) + ' / ' + s.cards.length + ' · tocá la tarjeta para ver la definición</span>' +
    '<div class="v5-fc-card" id="' + el.id + '-fc" style="--fc-color:' + color + '" onclick="_v52FCFlip(\'' + el.id + '\')">' +
      '<div class="v5-fc-inner">' +
        '<div class="v5-fc-front">' +
          '<span class="v5-fc-label" style="color:' + color + '">CONCEPTO</span>' +
          '<div class="v5-fc-front-text">' + front + '</div>' +
          '<div class="v5-fc-hint">Tocá para ver la definición →</div>' +
        '</div>' +
        '<div class="v5-fc-back">' +
          '<span class="v5-fc-label" style="color:var(--fce-base,#58a6ff)">DEFINICIÓN</span>' +
          '<div class="v5-fc-back-text">' + back + '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="v5-fc-nav">' +
      (s.currentIndex > 0
        ? '<button class="v5-fc-btn" onclick="_v52FCNav(\'' + el.id + '\',-1)">← Anterior</button>'
        : '<span></span>') +
      (s.currentIndex < s.cards.length - 1
        ? '<button class="v5-fc-btn v5-fc-btn-primary" style="background:' + color + '" onclick="_v52FCNav(\'' + el.id + '\',1)">Siguiente →</button>'
        : '<button class="v5-fc-btn v5-fc-btn-primary" style="background:' + color + '" onclick="v52FlashStart(\'' + el.id + '\',\'' + s.mat + '\',\'' + s.ag + '\')">✓ Repetir</button>') +
    '</div>';
}

/* Conmutar clase .is-flipped según FASE 3 */
window._v52FCFlip = function(cid) {
  var fc = document.getElementById(cid + '-fc');
  if (fc) fc.classList.toggle('is-flipped');
};

/* Incrementar/decrementar currentIndex, resetear .is-flipped */
window._v52FCNav = function(cid, dir) {
  var el = document.getElementById(cid);
  if (!el || !el._v52fc) return;
  el._v52fc.currentIndex += dir;
  /* Reset estado flip según FASE 3 */
  var fc = document.getElementById(cid + '-fc');
  if (fc) fc.classList.remove('is-flipped');
  _v52RenderFC(el);
};

/* ── Helpers ── */
/* ── q55 ENGINE MIGRADO A nexus-quiz.js (fase 5) ────────────────────
   Las funciones q55Shuffle, q55Color, q55Norm, q55GetBank,
   q55Start, q55Render, q55Responder, q55Siguiente, q55RenderResult
   y _q55States viven en nexus-quiz.js desde v10.5.0.
   Orden de carga: nexus-core.js → portal.js → nexus-quiz.js → nexus-modules.js
   ─────────────────────────────────────────────────────────────────── */


/* ── 1. NexusMap: construye mapa de relaciones del JSON ── */
var _nexusMap = {};  /* mat|ag → { quizId, quizTitle, itemCount } */

function nexusBuildMap(data) {
  _nexusMap = {};
  if (!data) return;
  data.forEach(function(item) {
    if (item.tipo === 'Quiz') {
      var key = (item.materia || '') + '|' + (item.agrupador || '');
      _nexusMap[key] = {
        quizId:    item.id,
        quizTitle: item.titulo || 'Quiz',
        materia:   item.materia,
        agrupador: item.agrupador
      };
    }
  });
}

function nexusGetQuiz(materia, agrupador) {
  return _nexusMap[(materia || '') + '|' + (agrupador || '')] || null;
}

/* ── 2. Sidebar programático 2.0 ── */
/* ── Fase 9.1: Modo Parcial — scope global para acceso desde nexusBuildSidebar ── */
var NEXUS_MODO_PARCIAL = localStorage.getItem('nexus_modo_parcial') === 'true';

function nexusBuildSidebar(data) {
  if (!data || !data.length) return;
  var sbEl = document.getElementById('sb');
  if (!sbEl) return;

  /* Inventario: quiz por materia+agrupador */
  var quizByKey = {};   /* "materia|agrupador" → item */
  var hasTipo   = {};   /* "materia|tipo" → count */
  data.forEach(function(item) {
    var m  = item.materia  || '';
    var ag = item.agrupador || '';
    var t  = item.tipo     || '';
    hasTipo[m + '|' + t] = (hasTipo[m + '|' + t] || 0) + 1;
    if (t === 'Quiz') quizByKey[m + '|' + ag] = item;
  });

  function hasT(mat, tipo) { return (hasTipo[mat+'|'+tipo] || 0) > 0; }
  function quizFor(mat, ag) { return quizByKey[mat + '|' + ag] || null; }

  /* Definición de materias con agrupadores reales del JSON
     REGLA: campo 'ag' debe coincidir EXACTAMENTE con el campo 'agrupador' del JSON.
     nexusGoto pasa ag al scroll → .mc-unit[data-ag*=ag] → debe contener el valor. */
  var MATERIAS = [
    { id:'prop-materiales', mat:'Propedéutica',  color:NEXUS_COLORS.materias.prop.base,
      label:'Área Propedéutica',
      unidades:[
        {u:'RESUMEN', label:'📋 Programa',                    chip:'info', ag:'Unidad 0'},
        {u:'U1',      label:'Unidad I · Ed. Superior',        chip:'✓',    ag:'Unidad I'},
        {u:'U2',      label:'Unidad II · Aprender a Aprender',chip:'🔜',   ag:'Unidad II'},
        {u:'U3',      label:'Unidad III · Rol Profesional',   chip:'🔜',   ag:'Unidad III'},
      ]},
    { id:'cont-materiales', mat:'Contabilidad',  color:NEXUS_COLORS.materias.cont.base,
      label:'Intro Contabilidad',
      unidades:[
        {u:'RESUMEN', label:'📋 Programa',                            chip:'info', ag:'Itinerario 0'},
        {u:'U1',      label:'It. I · Marco Conceptual',              chip:'✓',    ag:'Itinerario I'},
        {u:'U2',      label:'It. II · Patrimonio',                   chip:'✓',    ag:'Itinerario II'},
        {u:'U3',      label:'It. III · Partida Doble',               chip:'✓',    ag:'Itinerario III'},
        {u:'U4',      label:'It. IV · Documentos Comerciales',       chip:'✓',    ag:'Itinerario IV'},
        {u:'U5',      label:'It. V · Cuentas y Plan',                chip:'✓',    ag:'Itinerario V'},
        {u:'U6',      label:'It. VI · Registros y Libros',           chip:'✓',    ag:'Itinerario VI'},
        {u:'U7',      label:'It. VII · Diario y Mayor',                chip:'✓',    ag:'Itinerario VII'},
      ]},
    { id:'adm-materiales',  mat:'Administración', color:NEXUS_COLORS.materias.adm.base,
      label:'Intro Administración',
      unidades:[
        {u:'RESUMEN', label:'📋 Programa',                          chip:'info', ag:'Unidad 0'},
        {u:'U1',      label:'Unidad I · Fundamentos y Escuelas',    chip:'✓',    ag:'Unidad I'},
        {u:'U2',      label:'Unidad II · Organizaciones y RSE',     chip:'✓',    ag:'Unidad II'},
        {u:'U3',      label:'Unidad III · Dirección y Control',     chip:'✓',    ag:'Unidad III'},
      ]},
    { id:'soc-materiales',  mat:'Sociales',       color:NEXUS_COLORS.materias.soc.base,
      label:'Intro Cs. Sociales',
      unidades:[
        {u:'RESUMEN', label:'📋 Programa',                          chip:'info', ag:'Unidad 0'},
        {u:'U1',      label:'Unidad I · Dimensión Social',          chip:'✓',    ag:'Unidad I'},
        {u:'U2',      label:'Unidad II · Construcción Social',      chip:'✓',    ag:'Unidad II'},
        {u:'U3',      label:'Unidad III · Saber, Poder y Estado',   chip:'✓',    ag:'Unidad III'},
      ]},
  ];

  /* Preservar brand + home + footer */
  var brand   = sbEl.querySelector('.sb-brand');
  var homeSection = sbEl.querySelector('.sb-section');
  var footer  = sbEl.querySelector('.sb-footer');
  var brandHTML  = brand ? brand.outerHTML : '';
  var homeHTML   = homeSection ? homeSection.outerHTML : '';
  /* ── Fase 9.1: inyectar botón Modo Parcial en el footer */
  var _mpBtnHTML = [
    '<button id="nexus-modo-parcial-btn"',
    ' onclick="toggleModoParcial()"',
    ' style="',
      'width:100%;',
      'padding:.55rem 1rem;',
      'margin-top:.75rem;',
      'background:' + (NEXUS_MODO_PARCIAL ? 'var(--color-err,#f85149)' : 'rgba(255,255,255,.06)') + ';',
      'color:' + (NEXUS_MODO_PARCIAL ? '#fff' : 'rgba(200,191,176,.7)') + ';',
      'border:1px solid rgba(255,255,255,.12);',
      'border-radius:4px;',
      'font-family:\'DM Mono\',monospace;',
      'font-size:.62rem;',
      'letter-spacing:.06em;',
      'cursor:pointer;',
      'transition:background .2s,color .2s;',
    '">',
    NEXUS_MODO_PARCIAL ? '🎯 MODO PARCIAL ON' : '🎯 Modo Parcial',
    '</button>'
  ].join('');

  if (footer) {
    /* Inyectar dentro del footer existente */
    var _tmpDiv = document.createElement('div');
    _tmpDiv.innerHTML = footer.outerHTML;
    _tmpDiv.firstChild.insertAdjacentHTML('beforeend', _mpBtnHTML);
    footerHTML = _tmpDiv.innerHTML;
  } else {
    footerHTML = '<div class="sb-footer">' + _mpBtnHTML + '</div>';
  }

  var html = '';

  MATERIAS.forEach(function(m) {
    html += '<div class="sb-section sb-materia-section">';
    html += '<div class="sb-subject" onclick="toggleSubj(this)" style="--subj-color:' + m.color + '">';
    html += '<div class="subj-dot" style="background:' + m.color + '"></div>';
    html += '<span>' + m.label + '</span><span class="arrow">▶</span>';
    html += '</div><div class="sb-children">';

    m.unidades.forEach(function(u) {
      if (u.pid) {
        /* Link directo a página específica */
        html += _sb57Item(m.color, 'goto(\'' + u.pid + '\',null)', u.label, u.chip);
      } else {
        /* FIX v13.6.0: pasar u.ag (agrupador exacto) al scroll.
           Antes se pasaba u.u (código interno) que no matchea data-ag. */
        var scrollTarget = u.ag || u.u;
        html += _sb57Item(m.color, 'nexusGoto(\'' + m.id + '\',\'' + scrollTarget + '\')', u.label, u.chip);
      }

      /* Sub-ítem Quiz vinculado a esta unidad — Tarea 1: Deep Link */
      if (u.ag) {
        var qItem = quizFor(m.mat, u.ag);
        if (qItem) {
          html += '<div class="sb-item sb-quiz-subitem" data-cur="' + m.color + '" '
            + 'style="--cur-active:' + m.color + '" '
            + 'onclick="nexusTrainingMode(\'' + qItem.id + '\',\'' + m.id + '\',\'' + m.mat + '\',\'' + u.ag + '\')">'
            + '<div class="dot sb-quiz-dot" style="background:' + m.color + '"></div>'
            + '<span class="label sb-quiz-label">⚡ Quiz · ' + u.ag + '</span>'
            + '<span class="chip" style="background:rgba(167,139,250,.3);color:#b07ef8;border:1px solid rgba(167,139,250,.4)">start</span>'
            + '</div>';
        }
      }
    });

    html += '</div></div>';
  });

  /* Inject materias into zone placeholder — preserve brand/home/tools/footer */
  var zoneEl = sbEl.querySelector('.sb-zone-label');
  if (zoneEl) {
    /* Remove any previously injected sb-sections for materias */
    var existing = sbEl.querySelectorAll('.sb-section.sb-materia-section');
    existing.forEach(function(el){ el.parentNode.removeChild(el); });
    /* Insert materia sections after the MATERIAS zone label */
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var sibling = zoneEl.nextSibling;
    while (tmp.firstChild) {
      sbEl.insertBefore(tmp.firstChild, sibling);
    }
  } else {
    /* fallback: full replace */
    sbEl.innerHTML = brandHTML + homeHTML + html + footerHTML;
  }
  if (typeof cneRenderMasteryBadges === 'function') cneRenderMasteryBadges();
  if (typeof Nexus6 !== 'undefined') Nexus6.Streak.render();
  if (typeof n70RenderRepasoAlerts === 'function') {
    setTimeout(n70RenderRepasoAlerts, 400);
  }
  setTimeout(function() {
    if (typeof n72InitDashboard === 'function') n72InitDashboard();
  }, 600);
}

function _sb57Item(color, onclick, label, chip) {
  return '<div class="sb-item" data-cur="' + color + '" '
    + 'style="--cur-active:' + color + '" onclick="' + onclick + '">'
    + '<div class="dot"></div>'
    + '<span class="label">' + label + '</span>'
    + '<span class="chip">' + chip + '</span>'
    + '</div>';
}

function _nexusSbItem(color, pageId, unit, label, chip, active) {
  var onclick = unit
    ? 'nexusGoto(\'' + pageId + '\',\'' + unit + '\')'
    : 'goto(\'' + pageId + '\',null)';
  return '<div class="sb-item' + (active?' active':'') + '" data-cur="' + color + '" ' +
    'style="--cur-active:' + color + '" onclick="' + onclick + '">' +
    '<div class="dot"></div><span class="label">' + label + '</span>' +
    '<span class="chip">' + chip + '</span></div>';
}

/* ── 3. nexusGoto: navega a página + agrupador + activa sidebar-group ── */
window.nexusGoto = function(pageId, unit) {
  /* Activar grupo sidebar */
  document.querySelectorAll('.sb-section').forEach(function(sec) {
    sec.classList.remove('sidebar-active-group');
  });
  /* Llamar goto con unidad */
  goto(pageId, null, unit);
  /* Highlight grupo activo */
  setTimeout(function() {
    var page = document.getElementById(pageId);
    var sbItem = document.querySelector('[onclick*="' + pageId + '"]');
    if (sbItem) {
      var section = sbItem.closest('.sb-section');
      if (section) section.classList.add('sidebar-active-group');
    }
  }, 100);
};

/* ── 4. nexusOpenQuiz: abre la página, scrollea al quiz card ── */
window.nexusOpenQuiz = function(quizId, pageId, agrupador) {
  goto(pageId, null);
  function tryFocus(n) {
    if (n <= 0) return;
    var card = document.getElementById('mcard-' + quizId);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('nexus-highlight');
      setTimeout(function() { card.classList.remove('nexus-highlight'); }, 2000);
      /* Auto-expandir si está cerrado */
      var header = card.querySelector('.mc-header');
      var well   = card.querySelector('.mc-well');
      if (header && well && well.style.display === 'none') {
        header.click();
      }
    } else {
      setTimeout(function() { tryFocus(n - 1); }, 200);
    }
  }
  tryFocus(8);
};

/* ── 5. Fix silencioso: fceSearch actualizado para v42-ag-section ── */
window.fceSearch = function(pageId) {
  var page = document.getElementById(pageId);
  if (!page) return;
  var inp = page.querySelector('.fce-search-input');
  var q   = norm(inp ? inp.value : '');
  var visible = 0;
  page.querySelectorAll('.mat-card').forEach(function(card) {
    var t  = norm(card.dataset.titulo || '');
    var d  = norm(card.dataset.desc   || '');
    var match = !q || t.indexOf(q) !== -1 || d.indexOf(q) !== -1;
    card.style.display = match ? '' : 'none';
    if (match) visible++;
  });
  /* Ocultar secciones vacías */
  page.querySelectorAll('.mc-unit').forEach(function(sec) {
    var any = Array.from(sec.querySelectorAll('.mat-card'))
      .some(function(c) { return c.style.display !== 'none'; });
    /* mc-unit con solo mc-unit-body (document) siempre visible en búsqueda */
    var hasDocOnly = !sec.querySelector('.mat-card') && sec.querySelector('.mc-unit-body');
    sec.style.display = (any || hasDocOnly) ? '' : 'none';
  });
  var empty = page.querySelector('.fce-empty');
  if (empty) empty.style.display = visible ? 'none' : 'block';
};

/* ── 6. gotoAg: fix para v42-ag-section ── */


class FlashcardEngine {
  constructor(containerId, cards, color) {
    this.containerId = containerId;
    this.cards       = cards || [];
    this.color       = color || NEXUS_COLORS.materias.home.base /* v19.3.2 */;
    this.currentCard = 0;
    this.flipped     = false;
    this.render();
  }

  getContainer() { return document.getElementById(this.containerId); }

  flip() {
    this.flipped = !this.flipped;
    var inner = document.getElementById(this.containerId + '-inner');
    if (!inner) return;
    inner.style.transform = this.flipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
  }

  go(dir) {
    var el = this.getContainer();
    if (!el) return;
    /* slide-out animation */
    var slideOut = dir > 0 ? 'translateX(-60px)' : 'translateX(60px)';
    el.style.transition = 'opacity .18s, transform .18s';
    el.style.opacity    = '0';
    el.style.transform  = slideOut;
    var self = this;
    setTimeout(function() {
      self.currentCard = Math.max(0, Math.min(self.cards.length - 1, self.currentCard + dir));
      self.flipped     = false;
      self.render();
      el.style.transform = dir > 0 ? 'translateX(40px)' : 'translateX(-40px)';
      el.style.opacity   = '0';
      setTimeout(function() {
        el.style.transition = 'opacity .22s, transform .22s';
        el.style.opacity    = '1';
        el.style.transform  = 'translateX(0)';
      }, 20);
    }, 180);
  }

  render() {
    var el = this.getContainer();
    if (!el || !this.cards.length) return;
    var c     = this.cards[this.currentCard];
    var front = c.f || c.q || c.front || '';
    var back  = c.b || c.a || c.back  || '';
    var color = this.color;
    var cid   = this.containerId;
    var self  = this;
    var isFirst = this.currentCard === 0;
    var isLast  = this.currentCard === this.cards.length - 1;

    el.innerHTML =
      '<div class="fc-counter" style="color:rgba(255,255,255,.35)">' +
        'Tarjeta ' + (this.currentCard + 1) + ' / ' + this.cards.length +
        ' &nbsp;·&nbsp; <span style="color:rgba(255,255,255,.2)">tocá para girar</span>' +
      '</div>' +

      '<div class="fc-flipper" id="' + cid + '-flipper" onclick="_fcEngineFlip(\'' + cid + '\')">' +
        '<div class="fc-inner" id="' + cid + '-inner">' +
          '<div class="fc-face fc-face-front" style="border-color:' + color + '">' +
            '<span class="fc-face-label" style="color:' + color + '">CONCEPTO</span>' +
            '<div class="fc-face-text">' + front + '</div>' +
          '</div>' +
          '<div class="fc-face fc-face-back" style="border-color:' + color + ';background:#1a1d2e">' +
            '<span class="fc-face-label" style="color:var(--color-ok,#4ade80)">DEFINICIÓN</span>' +
            '<div class="fc-face-text" style="color:rgba(255,255,255,.82)">' + back + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="fc-nav">' +
        '<button class="fc-btn" ' + (isFirst ? 'disabled style="opacity:.3"' : 'onclick="_fcEngineNav(\'' + cid + '\',-1)"') + '>← Anterior</button>' +
        '<span class="fc-dots">' + this.cards.map(function(_, i) {
          return '<span class="fc-dot' + (i === self.currentCard ? ' fc-dot-active" style="background:' + color : '"') + '"></span>';
        }).join('') + '</span>' +
        '<button class="fc-btn fc-btn-primary" style="background:' + color + '" ' +
          (isLast
            ? 'onclick="_fcEngineRestart(\'' + cid + '\')">✓ Repetir'
            : 'onclick="_fcEngineNav(\'' + cid + '\',1)">Siguiente →') +
        '</button>' +
      '</div>';
  }

  restart() {
    this.currentCard = 0;
    this.flipped     = false;
    this.render();
  }
}

/* Registry global de instancias */
window._fcEngines = window._fcEngines || {};

window._fcEngineFlip = function(cid) {
  if (window._fcEngines[cid]) window._fcEngines[cid].flip();
};
window._fcEngineNav = function(cid, dir) {
  if (window._fcEngines[cid]) window._fcEngines[cid].go(dir);
};
window._fcEngineRestart = function(cid) {
  if (window._fcEngines[cid]) window._fcEngines[cid].restart();
};
window.v53FlashStart = function(cid, mat, ag) {
  var el = document.getElementById(cid);
  if (!el) return;
  /* v19.3.1 — usa NEXUS_COLORS como fuente única */
  var color = nexusGetColorByName(mat) || NEXUS_COLORS.materias.home.base;
  var cards = ag.indexOf("III")!==-1 ? (typeof flashU3!=="undefined"?flashU3:[]) : ag.indexOf("II")!==-1&&ag.indexOf("III")===-1 ? (typeof fc2Data!=="undefined"?fc2Data:[]) : (typeof fcData!=="undefined"?fcData:[]);
  if (!cards.length) { el.innerHTML="<p class=\"empty-msg\">Flashcards próximamente. 🔥</p>"; return; }
  window._fcEngines = window._fcEngines || {};
  window._fcEngines[cid] = new FlashcardEngine(cid, cards, color);
};

/* ── Estado global del modo entrenamiento ── */
var _trainingActive = false;
var _trainingPrevState = null;

/* ── nexusTrainingMode: activa training mode y carga quiz ── */
window.nexusTrainingMode = function(quizItemId, pageId, materia, agrupador) {
  /* Activar Training Mode antes de navegar */
  _activateTrainingMode(materia);

  /* Navegar a la página de materiales */
  goto(pageId, null);

  /* Scroll y expand del card del quiz */
  function tryFocus(n) {
    if (n <= 0) return;
    var card = document.getElementById('mcard-' + quizItemId);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      /* Auto-expandir */
      var well = card.querySelector('.mc-well');
      var hdr  = card.querySelector('.mc-header');
      if (hdr && well && (well.style.display === 'none' || !well.style.display)) {
        hdr.click();
      }
      /* Iniciar quiz inline */
      setTimeout(function() {
        var qcId = 'q55-' + quizItemId.replace(/[^a-z0-9]/gi, '-');
        var trainingBody = card.querySelector('.training-body');
        if (trainingBody) {
          trainingBody.id = trainingBody.id || qcId;
          if (typeof q55Start === 'function') q55Start(trainingBody.id, materia, agrupador);
        }
      }, 400);
    } else {
      setTimeout(function() { tryFocus(n - 1); }, 200);
    }
  }
  tryFocus(8);
};

/* ── _activateTrainingMode: foco total en el quiz ── */
function _activateTrainingMode(materia) {
  if (_trainingActive) return;
  _trainingActive = true;

  var sb  = document.getElementById('sb');
  var tb  = document.getElementById('topbar');
  var main = document.querySelector('.main-content') || document.querySelector('main') || document.getElementById('content');

  /* Guardar estado */
  _trainingPrevState = {
    sbClass:  sb  ? sb.className  : '',
    tbClass:  tb  ? tb.className  : '',
  };

  /* Aplicar clases */
  document.body.classList.add('training-mode');
  if (typeof hideSidebar === 'function') hideSidebar();
  if (tb)   tb.classList.add('training-dimmed');
  if (main) main.classList.add('training-expanded');

  /* Banner de modo entrenamiento */
  var colorMap = NEXUS_NAME_COLORS;
  var color = colorMap[materia] || NEXUS_COLORS.materias.home.base /* v19.3.2 */;

  var banner = document.createElement('div');
  banner.id = 'training-banner';
  banner.className = 'training-banner';
  banner.style.borderColor = color;
  banner.innerHTML =
    '<span class="training-banner-icon">🎯</span>' +
    '<span class="training-banner-label">MODO ENTRENAMIENTO</span>' +
    '<button class="training-exit-btn" onclick="nexusExitTraining()">✕ Salir del modo entrenamiento</button>';
  document.body.appendChild(banner);
}

/* ── nexusExitTraining: restaurar vista normal ── */
window.nexusExitTraining = function() {
  if (!_trainingActive) return;
  _trainingActive = false;

  document.body.classList.remove('training-mode');

  var sb   = document.getElementById('sb');
  var tb   = document.getElementById('topbar');
  var main = document.querySelector('.main-content') || document.querySelector('main') || document.getElementById('content');

  if (typeof showSidebar === 'function') showSidebar();

  var banner = document.getElementById('training-banner');
  if (banner) banner.remove();

  _trainingPrevState = null;
};

/* ── nexusGoto v5.7: navegación con sidebar-active-group ── */
window.nexusGoto = function(pageId, unit) {
  goto(pageId, null, unit);
  setTimeout(function() {
    /* Activar grupo */
    document.querySelectorAll('.sb-section').forEach(function(sec) {
      sec.classList.remove('sidebar-active-group');
    });
    var items = document.querySelectorAll('.sb-item[onclick*="' + pageId + '"]');
    if (items.length) {
      var sec = items[0].closest('.sb-section');
      if (sec) sec.classList.add('sidebar-active-group');
    }
    /* Scroll a la unidad correcta */
    if (unit) {
      var page = document.getElementById(pageId);
      if (!page) return;
      var target = page.querySelector('.fce-unit-panel[data-unit="' + unit + '"]')
                || page.querySelector('.mc-unit[data-ag*="' + unit + '"]');
      if (target) target.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  }, 300);
};

/* ── Estado inmersivo ── */
var _focusActive    = false;
var _sidebarCollapsed = false;

/* ── 1. Sidebar Colapsable ── */
window.collapseSidebar = function() {
  var sb = document.getElementById('sb');
  var main = document.getElementById('main');
  var topbar = document.getElementById('topbar');
  if (!sb) return;
  sb.classList.add('collapsed');
  if (main)   main.classList.add('sb-collapsed');
  if (topbar) topbar.classList.add('sb-collapsed');
  _sidebarCollapsed = true;
  /* Mostrar toggle flotante */
  var toggle = document.getElementById('nexus-menu-toggle');
  if (toggle) toggle.style.display = 'flex';
};

window.expandSidebar = function() {
  var sb = document.getElementById('sb');
  var main = document.getElementById('main');
  var topbar = document.getElementById('topbar');
  if (!sb) return;
  sb.classList.remove('collapsed');
  if (main)   main.classList.remove('sb-collapsed');
  if (topbar) topbar.classList.remove('sb-collapsed');
  _sidebarCollapsed = false;
  var toggle = document.getElementById('nexus-menu-toggle');
  if (toggle) toggle.style.display = 'none';
};

/* ── 2. Focus Mode (Pantalla Completa) ── */
window.toggleFocusMode = function(elementId) {
  if (_focusActive) {
    _exitFocusMode();
  } else {
    _enterFocusMode(elementId);
  }
};

/* v5.9 hotfix: setFocusMode alias requerido por parche */
window.setFocusMode = function(active) {
  if (active) {
    if (typeof _enterFocusMode === 'function') _enterFocusMode(null);
    /* Garantizar botón de salida en top:20px */
    var existing = document.getElementById('focus-exit-btn');
    if (!existing) {
      var btn = document.createElement('button');
      btn.id = 'focus-exit-btn';
      btn.className = 'focus-exit-btn focus-exit-top';
      btn.innerHTML = '← Volver al Portal';
      btn.addEventListener('click', _exitFocusMode);
      document.body.appendChild(btn);
    }
  } else {
    if (typeof _exitFocusMode === 'function') _exitFocusMode();
  }
};

function _enterFocusMode(elementId) {
  _focusActive = true;
  var main = document.getElementById('main');
  var sb   = document.getElementById('sb');
  var tb   = document.getElementById('topbar');
  if (main) main.classList.add('focus-active');
  if (sb)   sb.classList.add('focus-hidden');
  if (tb)   tb.classList.add('focus-hidden');
  document.body.classList.add('focus-mode');

  /* Botón "Volver al Portal" */
  var exitBtn = document.createElement('button');
  exitBtn.id = 'focus-exit-btn';
  exitBtn.className = 'focus-exit-btn';
  exitBtn.innerHTML = '← Volver al Portal';
  exitBtn.addEventListener('click', _exitFocusMode);
  document.body.appendChild(exitBtn);

  /* Si hay elementId, scroll suave a él */
  if (elementId) {
    var el = document.getElementById(elementId);
    if (el) setTimeout(function() { el.scrollIntoView({ behavior:'smooth', block:'start' }); }, 200);
  }
}

function _exitFocusMode() {
  _focusActive = false;
  var main = document.getElementById('main');
  var sb   = document.getElementById('sb');
  var tb   = document.getElementById('topbar');
  if (typeof showSidebar === 'function') showSidebar();
  document.body.classList.remove('focus-mode');
  var exitBtn = document.getElementById('focus-exit-btn');
  if (exitBtn) exitBtn.remove();
}

/* ── 3. Auto-collapse al abrir material ── */
/* Wrappear goto para auto-colapsar en mobile */
(function() {
  var _originalGoto = window.goto;
  window.goto = function(id, el, tab) {
    /* En mobile (<768px), auto-colapsar sidebar al navegar */
    if (window.innerWidth < 768 && !_sidebarCollapsed) {
      collapseSidebar();
    }
    if (_originalGoto) _originalGoto.call(this, id, el, tab);
  };
})();

/* ── 4. Toggle del botón flotante ── */
window.nexusMenuToggle = function() {
  if (_sidebarCollapsed) {
    expandSidebar();
  } else {
    collapseSidebar();
  }
};

/* ── 5. Inyectar botón flotante en el DOM ── */
window.addEventListener('DOMContentLoaded', function() {
  /* Botón flotante #nexus-menu-toggle */
  if (!document.getElementById('nexus-menu-toggle')) {
    var btn = document.createElement('button');
    btn.id = 'nexus-menu-toggle';
    btn.className = 'nexus-menu-toggle';
    btn.setAttribute('aria-label', 'Abrir menú de navegación');
    btn.innerHTML = '<span class="nmt-icon">☰</span><span class="nmt-label">Menú</span>';
    btn.addEventListener('click', nexusMenuToggle);
    btn.style.display = 'none'; /* Oculto hasta que sidebar colapsa */
    document.body.appendChild(btn);
  }
  /* En mobile: colapsar sidebar desde el inicio */
  if (window.innerWidth < 768) {
    collapseSidebar();
  }
});

/* ── Estado de modo inmersivo ── */
var _immersiveActive = false;

/* ── Tarea 1: colapsar sidebar al abrir cualquier material ── */
function _v58CollapseSidebar() {
  var sb = document.getElementById('sb');
  if (!sb) return;
  sb.classList.add('collapsed');
  document.body.classList.add('sb-is-collapsed');
  /* Mostrar botón flotante de reapertura */
  var toggle = document.getElementById('nexus-menu-toggle');
  if (toggle) toggle.style.display = 'flex';
}

function _v58OpenSidebar() {
  var sb = document.getElementById('sb');
  if (!sb) return;
  sb.classList.remove('collapsed');
  document.body.classList.remove('sb-is-collapsed');
  var toggle = document.getElementById('nexus-menu-toggle');
  if (toggle) toggle.style.display = 'none';
}

window.nexusToggleSidebar = function() {
  var sb = document.getElementById('sb');
  if (!sb) return;
  if (sb.classList.contains('collapsed')) {
    _v58OpenSidebar();
  } else {
    _v58CollapseSidebar();
  }
};

/* ── Tarea 2: Focus Mode (pantalla completa inmersiva) ── */
window.toggleFocusMode = function(elementId) {
  var el = elementId ? document.getElementById(elementId) : null;
  var main = document.getElementById('main');

  if (_immersiveActive) {
    /* Salir del modo inmersivo */
    _immersiveActive = false;
    document.body.classList.remove('focus-active');
    _v58OpenSidebar();
    if (el) el.classList.remove('focus-content');
    /* Restaurar scroll */
    document.documentElement.style.overflow = '';
    /* Remover botón de salida */
    var exitBtn = document.getElementById('focus-exit-btn');
    if (exitBtn) exitBtn.remove();
  } else {
    /* Entrar al modo inmersivo */
    _immersiveActive = true;
    document.body.classList.add('focus-active');
    _v58CollapseSidebar();
    if (el) el.classList.add('focus-content');
    document.documentElement.style.overflow = 'hidden';

    /* Tarea 4: Botón "Volver al Portal" — visible solo en modo inmersivo */
    if (!document.getElementById('focus-exit-btn')) {
      var exitBtn = document.createElement('button');
      exitBtn.id = 'focus-exit-btn';
      exitBtn.className = 'focus-exit-btn';
      exitBtn.innerHTML = '← Volver al Portal';
      exitBtn.addEventListener('click', function() {
        toggleFocusMode(elementId);
      });
      document.body.appendChild(exitBtn);
    }
  }
};

/* ── Hook: colapsar sidebar al abrir cualquier material ── */
/* Se sobrescribe fceRender para añadir comportamiento de presentación */
(function() {
  var _origRender = window.fceRender;
  window.fceRender = function(pageId) {
    if (typeof _origRender === 'function') _origRender(pageId);
    /* Solo colapsar en móvil (<768px) para no molestar en desktop */
    if (window.innerWidth < 768) {
      _v58CollapseSidebar();
    }
  };
})();

/* ── Tarea 1: Inyectar botón flotante #nexus-menu-toggle en el DOM ── */
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('nexus-menu-toggle')) return;

  var toggleBtn = document.createElement('button');
  toggleBtn.id = 'nexus-menu-toggle';
  toggleBtn.className = 'nexus-menu-toggle';
  toggleBtn.setAttribute('aria-label', 'Abrir menú');
  toggleBtn.innerHTML = '☰';
  toggleBtn.style.display = 'none'; /* oculto hasta que el sidebar colapse */
  toggleBtn.addEventListener('click', function() {
    _v58OpenSidebar();
    /* En focus mode también cerrar focus */
    if (_immersiveActive) toggleFocusMode();
  });
  document.body.appendChild(toggleBtn);
});

/* ── Estado cognitivo global ── */
var _cne = {
  prevPage:          null,    /* página antes de entrar al quiz */
  prevScrollY:       0,
  masteredUnits:     {},      /* "materia|agrupador" → true si pct >= 80 */
  cognitiveMode:     false,   /* true cuando quiz está activo */
};

/* ══ 1. COGNITIVE FLOW — Inmersión automática al abrir Quiz ══ */

window.cneEnterQuiz = function(materia, agrupador) {
  if (_cne.cognitiveMode) return;
  _cne.cognitiveMode  = true;
  _cne.prevScrollY    = window.scrollY;

  /* hideSidebar + hideHeader (unificado) */
  if (typeof hideSidebar === 'function') hideSidebar();
  var sb = document.getElementById('sb');
  var tb = document.getElementById('topbar');
  var mn = document.getElementById('main');
  if (tb) tb.classList.add('cne-hidden');
  if (mn) {
    mn.classList.add('cne-immersive');
    /* max-width 850px centrado para 4K/50" */
    mn.classList.add('cne-reading-column');
  }
  document.body.classList.add('training-mode', 'cne-active');

  /* Banner de salida */
  if (!document.getElementById('cne-exit-bar')) {
    var bar = document.createElement('div');
    bar.id = 'cne-exit-bar';
    bar.className = 'cne-exit-bar';
    bar.innerHTML =
      '<span class="cne-exit-label">🎯 MODO ENTRENAMIENTO ACTIVO</span>' +
      '<span class="cne-exit-info">' + (materia || '') + (agrupador ? ' · ' + agrupador : '') + '</span>' +
      '<button class="cne-exit-btn" onclick="cneExitQuiz()">✕ Salir</button>';
    document.body.appendChild(bar);
  }
};

/* ── Restauración inteligente con transición suave ── */
window.cneExitQuiz = function() {
  if (!_cne.cognitiveMode) return;
  _cne.cognitiveMode = false;

  var sb = document.getElementById('sb');
  var tb = document.getElementById('topbar');
  var mn = document.getElementById('main');
  if (typeof showSidebar === 'function') showSidebar();
  document.body.classList.remove('training-mode', 'cne-active');

  var bar = document.getElementById('cne-exit-bar');
  if (bar) bar.remove();

  /* Restaurar scroll previo */
  if (_cne.prevScrollY > 0) {
    setTimeout(function() {
      window.scrollTo({ top: _cne.prevScrollY, behavior: 'smooth' });
    }, 300);
  }
};

/* ══ 2. HITOS DE DOMINIO — Sidebar badge ≥80% ══ */

window.cneMarkMastery = function(materia, agrupador, pct) {
  if (pct < 80) return;
  var key = (materia || '') + '|' + (agrupador || '');
  _cne.masteredUnits[key] = true;
  /* Persistir en localStorage */
  try {
    var stored = JSON.parse(localStorage.getItem('cne_mastery') || '{}');
    stored[key] = { pct: pct, ts: Date.now() };
    localStorage.setItem('cne_mastery', JSON.stringify(stored));
  } catch(e) {}
  /* Actualizar badge en sidebar */
  cneRenderMasteryBadges();
};

window.cneRenderMasteryBadges = function() {
  /* Cargar desde localStorage */
  try {
    var stored = JSON.parse(localStorage.getItem('cne_mastery') || '{}');
    Object.keys(stored).forEach(function(key) {
      _cne.masteredUnits[key] = true;
    });
  } catch(e) {}

  /* Encontrar sb-items y marcar unidades dominadas */
  document.querySelectorAll('.sb-item').forEach(function(item) {
    var onclick = item.getAttribute('onclick') || '';
    /* Extraer materia y agrupador del onclick si posible */
    Object.keys(_cne.masteredUnits).forEach(function(key) {
      var parts = key.split('|');
      var mat   = parts[0];
      var ag    = parts[1];
      /* Buscar coincidencia por texto del label */
      var label = item.querySelector('.label');
      if (label && ag && label.textContent.indexOf(ag) !== -1) {
        item.classList.add('unit-mastered');
        /* Badge visual si no existe */
        if (!item.querySelector('.mastery-badge')) {
          var badge = document.createElement('span');
          badge.className = 'mastery-badge';
          badge.title = 'Unidad dominada (≥80%)';
          badge.textContent = '★';
          item.appendChild(badge);
        }
      }
    });
  });
};

/* Cargar mastery al iniciar */
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(cneRenderMasteryBadges, 1500);
});

/* ══ 3. HILO DE ARIADNA — Conexiones transversales ══ */

window.cneInjectAriadna = function(ph, item, allData) {
  if (!item || !allData) return;

  /* Relación por campo 'relacionado' */
  if (item.relacionado) {
    var relItem = allData.filter(function(d) { return d.id === item.relacionado; })[0];
    if (relItem && relItem.tipo !== 'Quiz') {
      _cneInjectRelLink(ph, relItem, 'Se conecta con');
    }
  }

  /* Relación transversal por nexus_group — mismo agrupador, diferente materia */
  if (item.nexus_group) {
    var sameAg = allData.filter(function(d) {
      return d.id !== item.id
        && d.materia !== item.materia
        && d.agrupador === item.agrupador
        && d.nexus_group === true
        && d.tipo === 'Resumen';
    });
    sameAg.slice(0, 2).forEach(function(cross) {
      _cneInjectRelLink(ph, cross, '🔗 Vínculo transversal');
    });
  }
};

function _cneInjectRelLink(ph, relItem, label) {
  var colorMap = NEXUS_NAME_COLORS;
  var color = colorMap[relItem.materia] || NEXUS_COLORS.materias.home.base /* v19.3.2 */;

  var ariadna = document.createElement('div');
  ariadna.className = 'cne-ariadna';
  ariadna.style.borderColor = color;

  var inner = document.createElement('div');
  inner.className = 'cne-ariadna-inner';
  inner.innerHTML =
    '<span class="cne-ariadna-label">' + label + '</span>' +
    '<div class="cne-ariadna-link">' +
      '<span class="cne-ariadna-mat" style="color:' + color + '">' + (relItem.materia || '') + '</span>' +
      '<span class="cne-ariadna-title">' + (relItem.titulo || '') + '</span>' +
    '</div>';

  var btn = document.createElement('button');
  btn.className = 'cne-ariadna-btn';
  btn.style.cssText = 'border-color:' + color + ';color:' + color;
  btn.textContent = '¿Profundizar? →';
  btn.setAttribute('data-id', relItem.id);
  btn.addEventListener('click', function() {
    var targetCard = document.getElementById('mcard-' + this.getAttribute('data-id'));
    if (targetCard) {
      targetCard.scrollIntoView({ behavior:'smooth', block:'center' });
      var hdr = targetCard.querySelector('.mc-header');
      if (hdr) hdr.click();
      targetCard.classList.add('nexus-highlight');
      setTimeout(function() { targetCard.classList.remove('nexus-highlight'); }, 2500);
    }
  });

  ariadna.appendChild(inner);
  ariadna.appendChild(btn);
  ph.appendChild(ariadna);
}


var _HIDING_CLASSES = ['cne-hidden','collapsed','focus-hidden','training-hidden'];

window.showSidebar = function() {
  var sb  = document.getElementById('sb');
  var mn  = document.getElementById('main');
  var tb  = document.getElementById('topbar');
  if (!sb) return;

  /* Quitar todas las clases de ocultamiento */
  _HIDING_CLASSES.forEach(function(cls) { sb.classList.remove(cls); });

  /* Restaurar main y topbar */
  if (mn) mn.classList.remove(
    'sb-collapsed','cne-immersive','cne-reading-column',
    'training-expanded','focus-active'
  );
  if (tb) {
    tb.classList.remove('training-dimmed','cne-hidden','focus-hidden');
    tb.style.left   = '';
    tb.style.opacity = '';
  }

  /* Marcar sidebar como visible */
  _sidebarCollapsed = false;

  /* Ocultar toggle flotante */
  var toggle = document.getElementById('nexus-menu-toggle');
  if (toggle) toggle.style.display = 'none';
};

/* hideSidebar — oculta con una sola clase y muestra el toggle */
window.hideSidebar = function() {
  var sb = document.getElementById('sb');
  if (!sb) return;
  sb.classList.add('cne-hidden');
  _sidebarCollapsed = true;
  var toggle = document.getElementById('nexus-menu-toggle');
  if (toggle) toggle.style.display = 'flex';
};

var Nexus6 = (function() {
  'use strict';

  /* ── Inyección de contraste máximo — v19.14 ── */
  (function() {
    var s = document.createElement('style');
    s.id = 'nx-max-contrast';
    s.textContent = [
      '.mc-well .nx-acc-btn span:nth-child(2){color:#fff!important;font-weight:700!important}',
      '.mc-well .nx-acc-body p,.mc-well .nx-acc-body li,.mc-well .nx-acc-body td{color:#fff!important;font-size:.9rem!important;line-height:1.85!important}',
      '.mc-well .nx-acc-body strong{color:#fff!important;font-weight:700!important}',
      '.mc-well .nx-acc-body em{color:#e2e8f0!important}',
      '.mc-well .nx-acc-body th{background:rgba(255,255,255,.15)!important;color:#fff!important;font-weight:700!important}',
      '.mc-well .nx-acc-body td{border-color:rgba(255,255,255,.15)!important}',
      '.mc-well .nx-acc-body blockquote{color:#fff!important}',
      '.mc-well .nx-acc-body span{color:#fff!important}',
      '.mc-well .nx-acc{background:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.2)!important}',
      '.mc-well .nx-acc[data-open="1"]{background:rgba(255,255,255,.09)!important;border-color:var(--fce-color,#a78bfa)!important}',
      '.mc-well .nx-acc-body{border-top:1px solid rgba(255,255,255,.15)!important}',
      '.mc-well .nx-acc-arrow{color:rgba(255,255,255,.7)!important;font-size:1.1rem!important}',
    ].join('');
    document.head.appendChild(s);
  })();

  /* ── Estado interno ── */
  var _streakKey  = 'nexus6_streak';
  var _streakData = null;

  

  var Parser = {

    /* Marcadores que activan el componente profe-tip */
    MARKERS: [
      { re: /Importante:/gi,         label: '¡Ojo con esto, che! Recordá que', cls: 'profe-importante' },
      { re: /Recordar:/gi,           label: 'No te olvidés:',                   cls: 'profe-recordar'  },
      { re: /Pregunta de examen:/gi, label: '🎯 Esto CAE en el parcial:',       cls: 'profe-examen'    },
    ],

    /* Procesa el wellEl (div.mc-well) después de insertar innerHTML */
    process: function(wellEl, item) {
      if (!wellEl) return;
      try {
        Parser._wrapMarkers(wellEl);
        Parser._styleListsAsMatrix(wellEl);
        Parser._highlightStrongs(wellEl);
        /* No generar machete ni anclajes en TPs respondibles */
        if (item.subtipo !== 'tp' && item.subtipo !== 'actividad') {
          Parser._injectMacheteBtn(wellEl, item);
          if (typeof N87Anclajes !== 'undefined') N87Anclajes.injectBtn(wellEl, item);
        }
        /* v8.6: Editor de ejemplos locales — no en TPs respondibles */
        if (typeof N86MacheteEditor !== 'undefined' && item.subtipo !== 'tp' && item.subtipo !== 'actividad') N86MacheteEditor.injectEditor(wellEl, item);
      } catch(e) {
        /* Fallback seguro: si el parser falla, el texto ya está renderizado — no hacer nada */
        console.warn('[Nexus6.Parser] fallback seguro:', e.message);
      }
    },

    /* ── Voz del Profesor: envolver marcadores ── */
    _wrapMarkers: function(el) {
      Parser.MARKERS.forEach(function(m) {
        el.querySelectorAll('p, li, td, div').forEach(function(node) {
          var txt = node.innerHTML || '';
          if (m.re.test(txt)) {
            m.re.lastIndex = 0; /* reset stateful regex */
            var wrapped = txt.replace(m.re, function(match) {
              return '<span class="profe-tip-marker ' + m.cls + '">' +
                '<span class="profe-tip-voice">' + m.label + '</span> ';
            });
            /* Cerrar el span abierto */
            if (wrapped !== txt) {
              node.innerHTML = wrapped;
              /* Envolver párrafo entero en .profe-tip */
              var tipDiv = document.createElement('div');
              tipDiv.className = 'profe-tip ' + m.cls;
              node.parentNode.insertBefore(tipDiv, node);
              tipDiv.appendChild(node);
            }
          }
          m.re.lastIndex = 0;
        });
      });
    },

    /* ── Matriz de Conceptos para listas ── */
    /* v9.2.3b: solo aplica a listas fuera de .sub-item para no romper layout */
    _styleListsAsMatrix: function(el) {
      el.querySelectorAll('ul, ol').forEach(function(list) {
        if (list.closest('.sub-item') || list.closest('.sub-grid')) return;
        if (!list.classList.contains('concept-matrix')) {
          list.classList.add('concept-matrix');
        }
      });
    },

    /* ── Auto-resaltado animado de <strong> ── */
    _highlightStrongs: function(el) {
      el.querySelectorAll('strong').forEach(function(s) {
        s.classList.add('nexus-highlight-strong');
      });
      /* Observer para animar al entrar en viewport */
      if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('highlight-in');
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.3 });
        el.querySelectorAll('.nexus-highlight-strong').forEach(function(s) {
          obs.observe(s);
        });
      } else {
        /* Fallback sin IntersectionObserver */
        el.querySelectorAll('.nexus-highlight-strong').forEach(function(s) {
          s.classList.add('highlight-in');
        });
      }
    },

    /* ── Botón Generar Machete ── */
    _injectMacheteBtn: function(wellEl, item) {
      if (!item || !item.id) return;
      var btn = document.createElement('button');
      btn.className = 'nexus6-machete-btn';
      btn.innerHTML = '🖨️ Generar Machete';
      btn.setAttribute('data-item-id', item.id);
      btn.setAttribute('data-quiz-id', item.relacionado || '');
      btn.addEventListener('click', function() {
        Nexus6.Print.generateMachete(item);
      });
      wellEl.appendChild(btn);
    }
  };

  

  var Print = {

    /* Generar QR simple como data URI via API externa confiable */
    _qrUrl: function(quizId) {
      if (!quizId) return null;
      var portalUrl = window.location.origin + window.location.pathname + '#quiz-' + quizId;
      return 'https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=' + encodeURIComponent(portalUrl);
    },

    generateMachete: function(item) {
      var titulo  = item.titulo  || 'Material de Estudio';
      var materia = item.materia || '';
      var ag      = item.agrupador || '';
      var quizId  = item.relacionado || '';
      var qrUrl   = Print._qrUrl(quizId);
      var cuerpo  = item.cuerpo || '';

      /* v7.7: Aplicar blancos inteligentes basados en fallos previos */
      var _smartResult = { html: cuerpo, count: 0, failedTerms: [] };
      if (typeof N77SmartBlanks !== 'undefined' && cuerpo) {
        var _rate77 = (typeof _n70MacheteLevel !== 'undefined' && _n70MacheteLevel === 'experto') ? 0.30 : 0.10;
        _smartResult = N77SmartBlanks.applySmartBlanks(cuerpo, materia, _rate77);
        cuerpo = _smartResult.html;
      }

      /* Abrir ventana de impresión con CSS de machete */
      var safeMateria = (materia || 'FCE').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_');
      var safeTitulo  = (titulo  || 'Material').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_').substring(0, 40);
      var pdfName     = 'Machete_' + safeMateria + '_' + safeTitulo;

      var win = window.open('', '_blank', 'width=900,height=700');
      if (!win) return;

      win.document.write(
        '<!DOCTYPE html><html lang="es"><head>' +
        '<meta charset="UTF-8">' +
        '<title>' + pdfName.replace(/_/g, ' ') + '</title>' +
        '<style>' +
        /* v7.7: Machete Doble Entrada — reset + tipografía institucional */
        '* { box-sizing:border-box; margin:0; padding:0; }' +
        'body { font-family:Georgia,"Times New Roman",serif; font-size:10.5pt; color:#111; background:#fff; padding:16mm 14mm; line-height:1.6; }' +

        /* Encabezado institucional */
        '.m-header { border-top:3pt solid #1e3a8a; padding-top:8pt; margin-bottom:14pt; }' +
        '.m-inst { font-family:Arial,sans-serif; font-size:7pt; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#1e3a8a; margin-bottom:3pt; }' +
        '.m-titulo { font-family:"Arial Black",Arial,sans-serif; font-size:14pt; font-weight:900; color:#111; margin-bottom:2pt; }' +
        '.m-meta { font-family:Arial,sans-serif; font-size:8pt; color:#888; }' +
        '.m-smart-info { font-family:Arial,sans-serif; font-size:7.5pt; color:#1e3a8a; margin-top:4pt; font-style:italic; }' +

        /* DOBLE ENTRADA: tabla con 2 columnas */
        '.m-doble { width:100%; border-collapse:collapse; margin-top:12pt; }' +
        '.m-doble colgroup col:first-child { width:55%; }' +
        '.m-doble colgroup col:last-child  { width:45%; }' +
        '.m-col-head { font-family:Arial,sans-serif; font-size:8pt; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:5pt 8pt; border-bottom:2pt solid; }' +
        '.m-col-head-teoria  { color:#1e3a8a; border-color:#1e3a8a; background:#f0f4ff; }' +
        '.m-col-head-practica{ color:#1a6e4a; border-color:#1a6e4a; background:#f0fff4; }' +
        '.m-col-teoria  { vertical-align:top; padding:8pt 10pt 8pt 0; border-bottom:0.5pt solid #e0e0e0; border-right:1pt solid #ccc; }' +
        '.m-col-practica{ vertical-align:top; padding:8pt 0 8pt 10pt; border-bottom:0.5pt solid #e0e0e0; }' +

        /* Teoría — cuerpo del material */
        '.m-col-teoria p { margin-bottom:7pt; line-height:1.5; }' +
        '.m-col-teoria ul, .m-col-teoria ol { margin-left:14pt; margin-bottom:7pt; }' +
        '.m-col-teoria li { margin-bottom:3pt; line-height:1.4; }' +

        /* Andamiaje: strongs normales */
        '.m-col-teoria strong { font-weight:700; }' +
        '.m-col-teoria strong::after { content:""; }' +

        /* BLANCOS INTELIGENTES — términos fallados */
        '.m-col-teoria .smart-blank { font-weight:normal; border-bottom:1.5pt dashed #1e3a8a; padding-bottom:2pt; display:inline-block; min-width:60pt; }' +
        '.m-col-teoria .smart-blank::after { content:" _______________"; color:#9aa; font-size:8.5pt; letter-spacing:1.5pt; }' +

        /* Profe tips en teoría */
        '.m-col-teoria .profe-tip { background:#fffbe6; border-left:3pt solid #f59e0b; padding:4pt 7pt; margin:6pt 0; font-size:9pt; page-break-inside:avoid; }' +

        /* Columna práctica — espacio de trabajo */
        '.m-practica-section { margin-bottom:12pt; }' +
        '.m-prac-label { font-family:Arial,sans-serif; font-size:7.5pt; font-weight:700; color:#1a6e4a; text-transform:uppercase; letter-spacing:.06em; margin-bottom:4pt; }' +
        '.m-prac-lines { }' +
        '.m-prac-line { border-bottom:0.5pt solid #ccc; margin-bottom:9pt; height:9pt; }' +
        '.m-prac-box { border:0.5pt solid #ccc; border-radius:2pt; padding:5pt 7pt; min-height:28pt; font-size:8pt; color:#bbb; font-style:italic; }' +

        /* Footer */
        '.machete-footer { margin-top:16pt; padding-top:8pt; border-top:1pt solid #ccc; display:flex; align-items:center; gap:14pt; font-size:7.5pt; color:#888; page-break-inside:avoid; }' +
        '.machete-footer img { width:55pt; height:55pt; }' +

        /* Print */
        '@media print {' +
        '  body { padding:12mm 10mm; }' +
        '  .no-print { display:none !important; }' +
        '  .m-header { page-break-after:avoid; }' +
        '  .m-doble { page-break-inside:auto; }' +
        '  tr { page-break-inside:avoid; }' +
        '}' +
        '</style></head><body>' +
        '<div class="no-print" style="margin-bottom:12px">' +
        '  <button onclick="window.print()" style="padding:8px 20px;background:#111;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11pt">🖨️ Imprimir / Guardar PDF</button>' +
        '  <button onclick="window.close()" style="padding:8px 14px;background:#eee;border:none;border-radius:4px;cursor:pointer;margin-left:8px">✕ Cerrar</button>' +
        '</div>' +
        /* v7.7: El encabezado institucional está dentro de m-doble — ya no se necesita h1 standalone */
        /* v7.7: ESTRUCTURA DOBLE ENTRADA */
        '<div class="m-header">' +
          '<div class="m-inst">FACULTAD DE CIENCIAS ECONÓMICAS | UNPSJB — CÁTEDRA ABIERTA</div>' +
          '<div class="m-titulo">' + titulo + '</div>' +
          '<div class="m-meta">' + materia + (ag ? ' · ' + ag : '') + '</div>' +
          (_smartResult.count > 0
            ? '<div class="m-smart-info">🎯 ' + _smartResult.count + ' concepto' + (_smartResult.count!==1?'s':'') + ' priorizados según tus fallos previos.</div>'
            : '') +
        '</div>' +

        '<table class="m-doble"><colgroup><col><col></colgroup>' +
          '<thead><tr>' +
            '<th class="m-col-head m-col-head-teoria">📖 Teoría</th>' +
            '<th class="m-col-head m-col-head-practica">✏ Mi Práctica — FCE</th>' +
          '</tr></thead>' +
          '<tbody><tr>' +
            '<td class="m-col-teoria">' + cuerpo + '</td>' +
            '<td class="m-col-practica">' +
              '<div class="m-practica-section">' +
                '<div class="m-prac-label">Conectar con la realidad</div>' +
                '<div class="m-prac-lines">' +
                  '<div class="m-prac-line"></div><div class="m-prac-line"></div>' +
                  '<div class="m-prac-line"></div><div class="m-prac-line"></div>' +
                '</div>' +
              '</div>' +
              '<div class="m-practica-section">' +
                '<div class="m-prac-label">Ejemplo propio</div>' +
                '<div class="m-prac-box">Escribí acá un caso real o imaginario donde aplica este concepto…</div>' +
              '</div>' +
              '<div class="m-practica-section">' +
                '<div class="m-prac-label">Pregunta de parcial posible</div>' +
                '<div class="m-prac-lines">' +
                  '<div class="m-prac-line"></div><div class="m-prac-line"></div>' +
                  '<div class="m-prac-line"></div>' +
                '</div>' +
              '</div>' +
              '<div class="m-practica-section">' +
                '<div class="m-prac-label">Dudas pendientes</div>' +
                '<div class="m-prac-lines">' +
                  '<div class="m-prac-line"></div><div class="m-prac-line"></div>' +
                '</div>' +
              '</div>' +
            '</td>' +
          '</tr></tbody>' +
        '</table>' +
        (qrUrl ? '<div class="machete-footer"><img src="' + qrUrl + '" alt="QR Quiz"><div><strong>Quiz de la unidad:</strong><br>Escaneá para acceder al Quiz<br><small>' + (ag || 'Material') + '</small></div></div>' : '') +
        '</body></html>'
      );
      /* v7.4: Inyectar sección Errores Comunes del Parcial */
      try {
        var _erroresHtml = '';
        /* Buscar tips de errores de la materia en TIPS_BY_MATERIA */
        var _matKey74 = (materia || '').replace(' I','').replace('Cs. ','').trim();
        var _tips74   = typeof TIPS_BY_MATERIA !== 'undefined' ? (TIPS_BY_MATERIA[_matKey74] || {}) : {};
        var _tipKeys  = Object.keys(_tips74).slice(0, 4);

        if (_tipKeys.length > 0) {
          _erroresHtml =
            '<div style="margin-top:24pt;border-top:2pt solid #c0392b;padding-top:12pt;column-span:all">' +
              '<div style="font-family:Arial Black,sans-serif;font-size:11pt;color:#c0392b;margin-bottom:10pt;letter-spacing:.05em">' +
                'ERRORES FRECUENTES EN EL PARCIAL' +
              '</div>';
          _tipKeys.forEach(function(term) {
            var tip = _tips74[term];
            _erroresHtml +=
              '<div style="margin-bottom:9pt;border-left:3pt solid #c0392b;padding-left:8pt;page-break-inside:avoid">' +
                '<div style="font-family:Arial,sans-serif;font-size:8pt;font-weight:700;color:#c0392b;margin-bottom:3pt">' +
                  '⚠ ' + (tip.titulo || term) +
                '</div>' +
                '<div style="font-family:Georgia,serif;font-size:9pt;line-height:1.45;color:#222">' +
                  (tip.nota || '') +
                '</div>' +
              '</div>';
          });
          _erroresHtml += '</div>';

          if (win.document.body) {
            var _errDiv = win.document.createElement('div');
            _errDiv.innerHTML = _erroresHtml;
            win.document.body.appendChild(_errDiv);
          }
        }
      } catch(e) {}

      /* v7.1: Inyectar sección Mis Notas de Autoevaluación antes de cerrar */
      try {
        var _answers71 = JSON.parse(localStorage.getItem('nexus71_answers_v1') || '{}');
        /* Filtrar respuestas del item actual */
        var _itemAnswers = Object.keys(_answers71)
          .filter(function(k) { return k.indexOf((item.id || '') + '|') === 0; })
          .map(function(k) { return _answers71[k]; })
          .filter(function(a) { return a.pct >= 70; });

        if (_itemAnswers.length > 0 && win.document.body) {
          var notasHTML =
            '<div style="margin-top:28pt;border-top:2pt solid #1e3a8a;padding-top:14pt;column-span:all">' +
              '<div style="font-family:Arial Black,sans-serif;font-size:11pt;color:#1e3a8a;margin-bottom:10pt;letter-spacing:.05em">' +
                'MIS NOTAS DE AUTOEVALUACIÓN' +
              '</div>';
          _itemAnswers.forEach(function(ans) {
            notasHTML +=
              '<div style="margin-bottom:12pt;border-left:3pt solid #1e3a8a;padding-left:10pt;page-break-inside:avoid">' +
                '<div style="font-family:Arial,sans-serif;font-size:8pt;font-weight:700;color:#1e3a8a;margin-bottom:4pt">' +
                  ans.termino +
                '</div>' +
                '<div style="font-family:Georgia,serif;font-size:9.5pt;line-height:1.5;color:#222">' +
                  ans.respuesta +
                '</div>' +
                '<div style="font-family:Arial,sans-serif;font-size:7pt;color:#aaa;margin-top:3pt">' +
                  'Precisión: ' + ans.pct + '% · ' + new Date(ans.ts).toLocaleDateString('es-AR') +
                '</div>' +
              '</div>';
          });
          notasHTML += '</div>';

          var notasDiv = win.document.createElement('div');
          notasDiv.innerHTML = notasHTML;
          win.document.body.appendChild(notasDiv);
        }
      } catch(e) {}

      /* v8.6: Inyectar ejemplos locales de Trelew del N86MacheteEditor */
      try {
        if (typeof N86MacheteEditor !== 'undefined' && win.document.body) {
          var _ejemplosHtml = N86MacheteEditor.buildPrintSection(item.id || '');
          if (_ejemplosHtml) {
            var _ejemplosDiv = win.document.createElement('div');
            _ejemplosDiv.innerHTML = _ejemplosHtml;
            win.document.body.appendChild(_ejemplosDiv);
          }
        }
      } catch(e) {}

      win.document.close();
      try { win.document.title = pdfName.replace(/_/g, ' '); } catch(e) {}
    }
  };

  

  var Streak = {

    load: function() {
      try {
        _streakData = JSON.parse(localStorage.getItem(_streakKey) || 'null');
      } catch(e) { _streakData = null; }
      if (!_streakData) _streakData = { days: 0, lastDate: null, best: 0 };
      return _streakData;
    },

    save: function() {
      try { localStorage.setItem(_streakKey, JSON.stringify(_streakData)); } catch(e) {}
    },

    /* Llamar al cargar la app — registra el día de estudio */
    tick: function() {
      Streak.load();
      var today = new Date().toDateString();
      if (_streakData.lastDate === today) {
        /* Ya registrado hoy */
      } else {
        var yesterday = new Date(Date.now() - 86400000).toDateString();
        if (_streakData.lastDate === yesterday) {
          _streakData.days++;
        } else if (_streakData.lastDate !== today) {
          _streakData.days = 1; /* Racha rota */
        }
        _streakData.lastDate = today;
        if (_streakData.days > (_streakData.best || 0)) _streakData.best = _streakData.days;
        Streak.save();
      }
      Streak.render();
    },

    render: function() {
      Streak.load();
      var days   = _streakData.days || 0;
      var onFire = days >= 3;

      /* Actualizar badge en header/sidebar */
      var badge = document.getElementById('nexus6-streak-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'nexus6-streak-badge';
        badge.className = 'streak-badge';
        var sbBrand = document.querySelector('.sb-brand');
        if (sbBrand) sbBrand.appendChild(badge);
      }
      badge.className = 'streak-badge' + (onFire ? ' streak-on-fire' : '');
      badge.innerHTML  = (onFire ? '🔥' : '📅') + ' <span>' + days + ' día' + (days !== 1 ? 's' : '') + '</span>';
      badge.title = 'Racha de estudio: ' + days + ' día(s) consecutivo(s). Mejor racha: ' + (_streakData.best || 0);

      /* Logo en llamas si ≥3 días */
      var sbTitle = document.querySelector('.sb-title');
      if (sbTitle) {
        sbTitle.classList.toggle('nexus-on-fire', onFire);
      }
    }
  };

  

  var Feedback = {
    ok: [
      'Excelente 🎯 Estás listo para el parcial.',
      '¡Muy bien, lince! Eso no te lo saca nadie.',
      'Perfecto. La teoría está clara. Seguí así.',
    ],
    medio: [
      '📚 Bien, pero repasá los temas donde fallaste. ¡Ya casi está!',
      'Buen intento, che. Revisá los conceptos marcados en rojo y la rompés.',
      'Vas bien encaminado. Un repaso más y ya estás.',
    ],
    bajo: [
      '¡No pasa nada, lince! Es un tema complejo. ¿Querés que repasemos la teoría juntos?',
      'Tranquilo/a, todos arrancan así. Volvé al resumen, anotá los conceptos clave y volvé a intentarlo.',
      'Este tema tiene sus trucos. ¿Empezamos de cero con la teoría? El botón está justo arriba.',
    ],
    get: function(pct) {
      var pool = pct >= 80 ? Feedback.ok : pct >= 60 ? Feedback.medio : Feedback.bajo;
      return pool[Math.floor(Math.random() * pool.length)];
    }
  };

  
  return {
    Parser:   Parser,
    Print:    Print,
    Streak:   Streak,
    Feedback: Feedback,
    init: function() {
      Streak.tick();
    }
  };

})();

/* ── Inicializar al cargar ── */
window.addEventListener('DOMContentLoaded', function() {
  if (typeof Nexus6 !== 'undefined') Nexus6.init();
});

(function() {
  if (typeof Nexus6 === 'undefined') return;

  /* Frases de cercanía — rotación aleatoria */
  var FRASES = [
    'Ojo con esto:',
    'Fijate bien:',
    'Esto va al parcial:',
    'El profe insiste acá:',
    'No te lo saltes:',
    'Clave para el examen:',
    '¡Che, esto importa!',
    'Marcalo en el apunte:',
  ];

  function frase() {
    return FRASES[Math.floor(Math.random() * FRASES.length)];
  }

  /* Detectar si un párrafo es "definición técnica":
     - Contiene ": " (estructura definición)
     - Contiene <strong> (concepto destacado)
     - Tiene más de 60 chars
     - No es ya un profe-tip o nota-profe */
  function esDefinicion(node) {
    if (!node) return false;
    var cls = node.className || '';
    if (cls.indexOf('profe-tip') !== -1) return false;
    if (cls.indexOf('nota-profe') !== -1) return false;
    if (cls.indexOf('voz-profe') !== -1) return false;
    if (cls.indexOf('nexus-reading-toolbar') !== -1) return false;
    var text = node.textContent || '';
    if (text.length < 60) return false;
    var html = node.innerHTML || '';
    /* Tiene estructura de definición */
    return (html.indexOf('<strong>') !== -1 && text.indexOf(':') !== -1) ||
           (text.indexOf(' es ') !== -1 && text.indexOf(':') !== -1) ||
           (text.indexOf(' se define') !== -1) ||
           (text.indexOf(' consiste en') !== -1);
  }

  /* Función principal — inyecta voz en TODOS los wells */
  Nexus6.inyectarVozDelProfe = function(wellEl, item) {
    if (!wellEl || !item) return;
    try {
      var tipo    = item.tipo     || '';
      var materia = item.materia  || '';

      /* Solo Resúmenes y Programas — no Prácticos, Quiz, TEST */
      if (tipo === 'Quiz' || tipo === 'TEST' || tipo === 'Práctico') return;

      /* v6.3: Solo inyectar si TIPS_BY_MATERIA tiene tips para esta materia */
      var matKey  = materia.replace(' I','').replace(' II','').replace('Cs. ','').replace('Intro ','').trim();
      var tipSet  = TIPS_BY_MATERIA[matKey] || TIPS_BY_MATERIA[materia] || null;
      /* Tarea 4: Si no hay tips específicos → no inyectar nada (calidad sobre cantidad) */
      if (!tipSet) return;

      var FRASES  = ['Ojo con esto:','Fijate bien:','Esto va al parcial:',
                     'El profe insiste acá:','No te lo saltes:','Clave para el examen:',
                     '¡Che, esto importa!','Marcalo en el apunte:'];
      function frase() { return FRASES[Math.floor(Math.random() * FRASES.length)]; }

      function esDefinicion(node) {
        if (!node) return false;
        var cls = node.className || '';
        if (/profe-tip|nota-profe|voz-profe|nexus-reading-toolbar|sub-tag/.test(cls)) return false;
        var text = node.textContent || '';
        if (text.length < 80) return false; /* Mínimo 80 chars para ser útil */
        var html = node.innerHTML || '';
        /* Estructura de definición */
        return (html.indexOf('<strong>') !== -1 && text.indexOf(':') !== -1)
            || text.indexOf(' es ') !== -1
            || text.indexOf(' se define') !== -1
            || text.indexOf(' consiste en') !== -1
            || text.indexOf(' implica ') !== -1;
      }

      var parrafos = wellEl.querySelectorAll('p, li');
      var count = 0;
      var MAX   = 2; /* v6.3: máx 2 — menos intrusivo */

      parrafos.forEach(function(p) {
        if (count >= MAX) return;
        if (!esDefinicion(p)) return;
        if (p.querySelector('.voz-profe')) return;

        var span = document.createElement('span');
        span.className = 'voz-profe';
        span.textContent = frase() + ' ';
        p.insertBefore(span, p.firstChild);
        count++;
      });
    } catch(e) { /* fail silencioso */ }
  };

  /* ── Sticky TOC — aparece para textos >500 palabras ── */
  Nexus6.StickyTOC = {
    WORD_THRESHOLD: 500,

    inject: function(wellEl, item, cardEl) {
      if (!wellEl || !cardEl) return;
      try {
        var text = wellEl.textContent || '';
        var words = text.trim().split(/\s+/).length;
        if (words < Nexus6.StickyTOC.WORD_THRESHOLD) return;

        /* Buscar encabezados (sub-tag divs y strong al inicio de párrafo) */
        var headings = [];
        wellEl.querySelectorAll('.sub-tag, h2, h3, h4').forEach(function(el, i) {
          var txt = (el.textContent || '').trim().substring(0, 50);
          if (!txt) return;
          var id = 'toc-' + (item.id || 'item') + '-' + i;
          el.id = id;
          headings.push({ id: id, text: txt });
        });

        if (headings.length < 2) return;

        /* Construir TOC */
        var toc = document.createElement('div');
        toc.className = 'nexus-sticky-toc';
        toc.innerHTML = '<div class="toc-title">📋 En este texto</div>';
        var ul = document.createElement('ul');
        headings.forEach(function(h) {
          var li = document.createElement('li');
          var a  = document.createElement('a');
          a.href = '#' + h.id;
          a.textContent = h.text;
          a.addEventListener('click', function(e) {
            e.preventDefault();
            var target = document.getElementById(h.id);
            if (target) target.scrollIntoView({ behavior:'smooth', block:'start' });
          });
          li.appendChild(a);
          ul.appendChild(li);
        });
        toc.appendChild(ul);

        /* Insertar dentro del card, before the well */
        var mcWell = cardEl.querySelector('.mc-well');
        if (mcWell && mcWell.parentNode) {
          mcWell.parentNode.insertBefore(toc, mcWell);
        }
      } catch(e) { /* fail silencioso */ }
    }
  };

})();

var TIPS_BY_MATERIA = { /* ── CONTABILIDAD ── */ Contabilidad: { 'iva': { titulo: 'IVA — Crédito Fiscal y Débito Fiscal', nota: 'Fijate bien: IVA CF (lo que pagás al comprar) es Activo. IVA DF (lo que cobrás al vender) es Pasivo. La diferencia la pagás a AFIP. Si CF > DF → saldo a favor del contribuyente.', ejemplo: 'Comprás $100 + 21%: A+ Mercaderías $100, A+ IVA CF $21 / A+ Proveedores $121.', cls: 'nota-contabilidad' }, 'patrimonio': { titulo: 'Patrimonio Neto (PN)', nota: 'Esto va al parcial: PN = Activo − Pasivo. Es la riqueza de los dueños. Sube con ganancias y aportes de capital, baja con pérdidas y retiros. La ecuación A = P + PN es siempre verdadera.', ejemplo: 'A = $500k · P = $200k → PN = $300k. Ganancia $50k → nuevo PN = $350k.', cls: 'nota-contabilidad' }, 'partida doble': { titulo: 'Ley de la Partida Doble', nota: '¡Che, esto importa! Todo asiento: Debe = Haber siempre. Si anotás en el Debe de una cuenta, anotás el mismo importe en el Haber de otra/s. Es matemáticamente imposible desequilibrar.', ejemplo: 'Cobrás $500 en efectivo: Debe Caja $500 / Haber Clientes $500.', cls: 'nota-contabilidad' }, 'variaci': { titulo: 'Variaciones Patrimoniales', nota: 'Ojo con esto: Permutativa = cambia composición sin modificar PN (compra al contado). Modificativa = cambia el valor del PN (ganancia, pérdida, sueldo pagado).', ejemplo: 'Compra útiles al contado → Permutativa: ↑ Útiles, ↓ Caja. PN sin cambio.', cls: 'nota-contabilidad' }, 'documento': { titulo: 'Documentos Comerciales', nota: 'El profe insiste acá: el documento es la PRUEBA del hecho económico, no el hecho en sí. Sin comprobante → sin asiento. OC y Remito: NO asientan. Factura, Recibo, NC, ND: SÍ asientan.', ejemplo: 'Remito recibido → no asentás. Factura recibida → asentás la compra.', cls: 'nota-contabilidad' }, 'estado de situaci': { titulo: 'Estado de Situación Patrimonial', nota: 'Clave para el examen: el Balance es la "foto" del patrimonio en un momento dado. Lado izq: Activo (lo que tenés). Lado der: Pasivo + PN (cómo lo financiaste).', ejemplo: null, cls: 'nota-contabilidad' }, 'libro diario': { titulo: 'Libro Diario', nota: 'Marcalo en el apunte: el Diario es cronológico (fecha por fecha). Cada asiento tiene fecha, descripción, cuentas y montos. Del Diario se pasa al Mayor por cuentas.', ejemplo: null, cls: 'nota-contabilidad' }, 'plan de cuentas': { titulo: 'Plan de Cuentas', nota: 'Fijate bien: el Plan de Cuentas es el índice de la contabilidad. Códigos por rubro: 1=Activo, 2=Pasivo, 3=PN, 4=Resultados negativos, 5=Resultados positivos.', ejemplo: null, cls: 'nota-contabilidad' }, }, /* ── ADMINISTRACIÓN ── */ Administración: { 'taylor': { titulo: 'Frederick Taylor — Administración Científica', nota: 'No te lo saltes: Taylor ≠ Fayol. Taylor = operario y tarea (eficiencia en el taller). Fayol = estructura y dirección (gestión general). Los confunden siempre en el parcial.', ejemplo: 'Taylor: tiempos y movimientos, selección científica, pago por pieza.', cls: 'nota-administracion' }, 'fayol': { titulo: 'Henri Fayol — Teoría Clásica', nota: '¡Che, esto importa! 5 funciones de Fayol: Prever, Organizar, Dirigir, Coordinar, Controlar. Y 14 principios. Pregunta frecuente: ¿diferencia Taylor/Fayol?', ejemplo: null, cls: 'nota-administracion' }, 'rse': { titulo: 'Responsabilidad Social Empresaria (RSE)', nota: 'Ojo con esto: RSE ≠ filantropía. RSE es integración voluntaria de preocupaciones sociales en la estrategia. 4 ámbitos CEMEFI: calidad laboral, comunidad, medioambiente, ética.', ejemplo: null, cls: 'nota-administracion' }, 'stakeholder': { titulo: 'Stakeholders — Grupos de Interés', nota: 'Fijate bien: stakeholders son todos los que afectan o son afectados por la organización (Freeman). No solo accionistas: empleados, clientes, comunidad, proveedores, Estado.', ejemplo: null, cls: 'nota-administracion' }, 'mintzberg': { titulo: 'Henry Mintzberg — Roles del Administrador', nota: 'Esto va al parcial: Mintzberg identificó 10 roles en 3 categorías. Interpersonales (representante, líder, enlace), Informativos (monitor, difusor, portavoz) y Decisorios (empresario, manejador de problemas, asignador de recursos, negociador).', ejemplo: null, cls: 'nota-administracion' }, 'sistema': { titulo: 'Organización como Sistema', nota: 'El profe insiste acá: las organizaciones son sistemas ABIERTOS. Interactúan con el entorno: importan recursos (entradas), los transforman (proceso) y devuelven productos/servicios (salidas). Un sistema cerrado tiende a la entropía.', ejemplo: null, cls: 'nota-administracion' }, }, /* ── SOCIALES ── */ Sociales: { 'habitus': { titulo: 'Habitus — Pierre Bourdieu', nota: '¡Che, esto importa! El habitus NO es hábito consciente. Es un sistema de disposiciones duraderas e incorporadas que genera prácticas sin cálculo deliberado. Es historia social hecha cuerpo.', ejemplo: 'El estudiante que "sabe cómo moverse" en la universidad sin que nadie le explique el código.', cls: 'nota-sociales' }, 'campo': { titulo: 'Campo — Pierre Bourdieu', nota: 'Marcalo en el apunte: el campo es un espacio social de posiciones en lucha. Cada campo tiene capital específico y sus reglas (doxa). El capital científico no vale igual en el campo económico.', ejemplo: null, cls: 'nota-sociales' }, 'obstáculo': { titulo: 'Obstáculo Epistemológico — Bachelard', nota: 'Esto va al parcial: Bachelard dice que el conocimiento científico no avanza acumulando verdades sino rompiendo obstáculos. El principal obstáculo es la experiencia primera (sentido común).', ejemplo: 'Creer que el sol "sale" porque lo vemos moverse. La ciencia rompe esa percepción.', cls: 'nota-sociales' }, 'capital': { titulo: 'Tipos de Capital — Bourdieu', nota: 'Fijate bien: Bourdieu distingue capital económico (dinero), cultural (saberes, títulos), social (redes de relación) y simbólico (reconocimiento, prestigio). Cada campo valoriza uno más que otro.', ejemplo: null, cls: 'nota-sociales' }, 'discurso': { titulo: 'Hegemonía Discursiva — Angenot', nota: 'No te lo saltes: Angenot define "hegemonía discursiva" como el conjunto de normas implícitas que regulan qué se puede decir y cómo. Determina lo pensable y lo impensable en una época.', ejemplo: null, cls: 'nota-sociales' }, 'genealog': { titulo: 'Genealogía — Foucault', nota: 'El profe insiste acá: la genealogía foucaultiana no busca el origen puro — busca la procedencia (herkunft) y la emergencia (entstehung). Muestra que lo que parece natural es producto de luchas históricas.', ejemplo: null, cls: 'nota-sociales' }, }, /* ── PROPEDÉUTICA ── */ Propedéutica: { 'autonomía': { titulo: 'Autonomía Universitaria', nota: 'Clave para el examen: la autonomía universitaria argentina tiene rango constitucional desde 1994 (Art. 75 inc. 19 CN). Implica autogobierno, libertad académica, autarquía financiera y autodeterminación curricular.', ejemplo: null, cls: 'nota-propedeutica' }, 'cogobierno': { titulo: 'Cogobierno Universitario', nota: 'Ojo con esto: el cogobierno significa que docentes, graduados y estudiantes participan en el gobierno de la universidad. En la UNPSJB: Asamblea Universitaria → Consejo Superior → Rectorado.', ejemplo: null, cls: 'nota-propedeutica' }, 'estatuto': { titulo: 'Estatuto UNPSJB', nota: 'Fijate bien: el Estatuto es la norma máxima de la UNPSJB. Regula su organización, órganos de gobierno, derechos y deberes de los miembros de la comunidad universitaria.', ejemplo: null, cls: 'nota-propedeutica' }, },
};

/* Alias para compatibilidad con Legacy.inject — usa TIPS_BY_MATERIA */
var NEXUS_LEGACY_MAP = null; /* deprecated en v6.3 — usar TIPS_BY_MATERIA */


(function() {
  if (typeof Nexus6 === 'undefined') return;

  /* ── Legacy Injector: escanea texto y enriquece con LEGACY_MAP ── */
  Nexus6.Legacy = {

    inject: function(wellEl, item) {
      if (!wellEl || !item) return;
      try {
        /* v6.3: Filtro contextual estricto — solo tips de la materia del item */
        var materia = item.materia || '';
        /* Normalizar alias de materia */
        var matKey = materia
          .replace(' I', '').replace(' II', '')
          .replace('Cs. ', '').replace('Intro ', '').trim();

        var tipSet = TIPS_BY_MATERIA[matKey] || TIPS_BY_MATERIA[materia] || null;
        if (!tipSet) return; /* Sin tips para esta materia → no inyectar nada */

        var text = (wellEl.textContent || wellEl.innerText || '').toLowerCase();

        Object.keys(tipSet).forEach(function(termLower) {
          /* El término en el mapa ya es lowercase — buscar en el texto */
          if (text.indexOf(termLower) === -1) return;
          /* Evitar doble inyección */
          if (wellEl.querySelector('[data-legacy-term="' + termLower + '"]')) return;

          var entry = tipSet[termLower];
          var colorMap = { /* v19.3.1: derivado de NEXUS_COLORS */
            'nota-contabilidad': NEXUS_COLORS.materias.cont.base,
            'nota-administracion':NEXUS_COLORS.materias.adm.base,
            'nota-sociales':     NEXUS_COLORS.materias.soc.base,
            'nota-propedeutica': NEXUS_COLORS.materias.prop.base
          };
          var color = colorMap[entry.cls] || NEXUS_COLORS.materias.home.base /* v19.3.2 */;

          var nota = document.createElement('div');
          nota.className = 'nota-profe ' + (entry.cls || '');
          nota.setAttribute('data-legacy-term', termLower);
          nota.style.borderColor = color;

          var header = document.createElement('div');
          header.className = 'nota-profe-header';
          header.innerHTML =
            '<span class="nota-profe-icon">📝</span>' +
            '<strong class="nota-profe-titulo" style="color:' + color + '">' + entry.titulo + '</strong>';

          var body = document.createElement('div');
          body.className = 'nota-profe-body';
          body.textContent = entry.nota;
          body.style.display = 'none'; /* Colapsado por defecto */

          nota.appendChild(header);
          nota.appendChild(body);

          if (entry.ejemplo) {
            var ej = document.createElement('div');
            ej.className = 'nota-profe-ejemplo';
            ej.innerHTML = '<span class="nota-ej-label">Ejemplo: </span>' + entry.ejemplo;
            ej.style.display = 'none';
            nota.appendChild(ej);
          }

          /* Toggle al click */
          header.style.cursor = 'pointer';
          header.addEventListener('click', function() {
            var isOpen = body.style.display !== 'none';
            body.style.display = isOpen ? 'none' : 'block';
            if (nota.querySelector('.nota-profe-ejemplo')) {
              nota.querySelector('.nota-profe-ejemplo').style.display = isOpen ? 'none' : 'block';
            }
            nota.querySelector('.nota-profe-icon').textContent = isOpen ? '📝' : '📖';
          });

          wellEl.appendChild(nota);
        });
      } catch(e) {
        /* Fallback silencioso */
        console.warn('[Nexus6.Legacy] v6.3 fallback:', e.message);
      }
    },
    restore: function(wellEl) {
      wellEl.querySelectorAll('.print-blank').forEach(function(s) {
        s.classList.remove('print-blank');
      });
    }
  };

  /* ── Hookear en window.beforeprint / afterprint ── */
  window.addEventListener('beforeprint', function() {
    document.querySelectorAll('.mc-well').forEach(function(well) {
      if (typeof Nexus6 !== 'undefined' && Nexus6.PrintBlank) {
        Nexus6.PrintBlank.prepare(well);
      }
    });
  });
  window.addEventListener('afterprint', function() {
    document.querySelectorAll('.mc-well').forEach(function(well) {
      if (typeof Nexus6 !== 'undefined' && Nexus6.PrintBlank) {
        Nexus6.PrintBlank.restore(well);
      }
    });
  });

})();

  Nexus6.Lazy = {
    THRESHOLD: 2500,  /* chars — textos > 2500c van a lazy */

    wrap: function(wellEl, item, renderFn) {
      var cuerpo = item.cuerpo || '';
      if (cuerpo.length <= Nexus6.Lazy.THRESHOLD) {
        renderFn();
        return;
      }
      /* Mostrar skeleton inmediatamente */
      wellEl.innerHTML =
        '<div class="nexus-lazy-skeleton">' +
          '<div class="skeleton-line w80"></div>' +
          '<div class="skeleton-line w60"></div>' +
          '<div class="skeleton-line w90"></div>' +
          '<div class="skeleton-line w50"></div>' +
          '<div class="skeleton-line w70"></div>' +
        '</div>';

      /* Render en el próximo frame idle — no bloquea el sidebar */
      var schedule = window.requestIdleCallback
        || function(fn, opts) { setTimeout(fn, opts && opts.timeout ? Math.min(opts.timeout, 80) : 60); };

      schedule(function() {
        renderFn();
        /* Post-render: aplicar parser y legacy */
        if (typeof Nexus6 !== 'undefined') {
          if (Nexus6.Parser) Nexus6.Parser.process(wellEl, item);
          if (Nexus6.Legacy) Nexus6.Legacy.inject(wellEl, item);
          if (Nexus6.ReadingMode) Nexus6.ReadingMode.inject(wellEl, item);
          if (Nexus6.inyectarVozDelProfe) Nexus6.inyectarVozDelProfe(wellEl, item);
          /* v19.3.6: accordion transform para content lazy — usa wrapper global (scope fix) */
          var _color = wellEl.style.getPropertyValue('--fce-color') || 'var(--fce-color,#58a6ff)';
          if (typeof window._nexusTransformSubGrids === 'function') {
            window._nexusTransformSubGrids(wellEl, _color);
          } else if (typeof _transformSubGridToAccordions === 'function') {
            _transformSubGridToAccordions(wellEl, _color);
          }
        }
      }, { timeout: 300 });
    }
  };


var LS_LEIDOS_KEY = 'nexus_leidos_v1';

/* Cargar leídos locales al iniciar — se fusionan con Firebase */
(function() {
  try {
    var stored = JSON.parse(localStorage.getItem(LS_LEIDOS_KEY) || '{}');
    Object.keys(stored).forEach(function(slug) {
      NEXUS_STATE.fceLeidos[slug] = true;
    });
  } catch(e) { /* fail silencioso */ }
})();

/* Override de fceMarcarLeido — agrega capa localStorage */
var _fceMarcarLeidoOrig = window.fceMarcarLeido;
window.fceMarcarLeido = function(slug, titulo, materia) {
  /* Persistir localmente primero (sin necesitar Firebase activo) */
  try {
    var stored = JSON.parse(localStorage.getItem(LS_LEIDOS_KEY) || '{}');
    stored[slug] = { titulo: titulo || '', materia: materia || '', ts: Date.now() };
    localStorage.setItem(LS_LEIDOS_KEY, JSON.stringify(stored));
    NEXUS_STATE.fceLeidos[slug] = true;
  } catch(e) { /* fail silencioso */ }
  /* Luego sincronizar con Firebase si hay sesión */
  if (_fceMarcarLeidoOrig && NEXUS_STATE.fceUsuario) {
    _fceMarcarLeidoOrig(slug, titulo, materia);
  }
  /* Actualizar UI inmediatamente */
  fceActualizarBadgesLeidos();
  nexus66UpdateSidebarProgress();
};

/* Resetear leídos locales (para debug/testing) */
window.nexus66ResetLeidos = function() {
  try { localStorage.removeItem(LS_LEIDOS_KEY); } catch(e) {}
  NEXUS_STATE.fceLeidos = {};
  fceActualizarBadgesLeidos();
  nexus66UpdateSidebarProgress();
};


function nexus66UpdateSidebarProgress(materiaOverride) {
  if (!NexusCore.getMateriales()) return;

  /* Detectar materia activa desde la página visible */
  var activePage = document.querySelector('.page.active');
  var materia = materiaOverride || '';
  if (!materia && activePage) {
    var host = activePage.querySelector('[data-mat-dynamic]');
    if (host) materia = (host.dataset.materia || '').trim();
  }

  var label = document.getElementById('prog-label');
  var fill  = document.getElementById('prog-fill');
  if (!label || !fill) return;

  if (!materia) {
    /* Sin materia activa → mostrar progreso global */
    var total   = NexusCore.getMateriales().filter(function(i) { return i && i.tipo === 'Resumen'; }).length;
    var leidos  = Object.keys(NEXUS_STATE.fceLeidos).length;
    var pct     = total > 0 ? Math.min(100, Math.round((leidos / total) * 100)) : 0;
    label.textContent = 'Progreso global: ' + pct + '%';
    fill.style.width  = pct + '%';
    /* Gradiente global prop→soc — usa bases desde NEXUS_COLORS v19.3.1 */
    fill.style.background = 'linear-gradient(90deg, ' + NEXUS_COLORS.materias.prop.base + ', ' + NEXUS_COLORS.materias.soc.base + ')';
    return;
  }

  /* Por materia */
  var items  = NexusCore.getMateriales().filter(function(i) {
    return i && i.tipo === 'Resumen' && (i.materia || '').indexOf(materia.split(' ')[0]) !== -1;
  });
  var leidosLocal = Object.keys(NEXUS_STATE.fceLeidos).filter(function(slug) {
    var item = NexusCore.getMateriales().find(function(i) { return i && i.id === slug; });
    return item && item.tipo === 'Resumen' && (item.materia || '').indexOf(materia.split(' ')[0]) !== -1;
  });
  var total  = items.length;
  var leidos = leidosLocal.length;
  var pct    = total > 0 ? Math.min(100, Math.round((leidos / total) * 100)) : 0;

  var color = nexusColorForMateria(materia) || NEXUS_COLORS.materias.home.base; /* v19.3.1 */

  /* Nombre corto */
  var shortName = materia.replace('Intro ', '').replace('Cs. ', '');

  label.textContent = shortName + ': ' + leidos + '/' + total + ' (' + pct + '%)';
  fill.style.width  = pct + '%';
  fill.style.background = color;

  /* Efecto: si 100%, celebrar brevemente */
  if (pct === 100 && !fill.dataset.celebrated) {
    fill.dataset.celebrated = '1';
    fill.style.background = NEXUS_COLORS.materias.prop.strong; /* celebración dorada — v19.3.1 */
    setTimeout(function() { fill.style.background = color; fill.dataset.celebrated = ''; }, 1500);
  }
}

/* Hook: actualizar barra cuando se navega a una página */
(function() {
  var _origGoto = window.goto;
  window.goto = function(id, el, tab) {
    if (_origGoto) _origGoto.apply(this, arguments);
    setTimeout(function() { nexus66UpdateSidebarProgress(); }, 350);
    setTimeout(function() {
      var pg   = document.getElementById(id);
      var host = pg ? pg.querySelector('[data-mat-dynamic]') : null;
      var mat  = host ? (host.dataset.materia || '') : '';
      if (mat && typeof n68StartTimer === 'function') n68StartTimer(mat, '');
    }, 400);
  };
})();

/* Inicializar al cargar datos */
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(nexus66UpdateSidebarProgress, 1800);
});


(function() {
  var _focused = null;

  function attachFocusHandlers(wellEl) {
    var paras = wellEl.querySelectorAll('p, li, .sub-item, tr');
    paras.forEach(function(p) {
      if (p.dataset.focusAttached) return;
      p.dataset.focusAttached = '1';
      p.style.transition = 'opacity .2s ease';
      p.style.cursor = 'text';

      /* Hover: brillo en strong hijos del párrafo */
      p.addEventListener('mouseenter', function() {
        var strongs = p.querySelectorAll('strong');
        strongs.forEach(function(s) {
          s.classList.add('para-hover-glow');
        });
      });
      p.addEventListener('mouseleave', function() {
        var strongs = p.querySelectorAll('strong');
        strongs.forEach(function(s) {
          s.classList.remove('para-hover-glow');
        });
      });
      /* Touch (móvil): misma lógica con touchstart */
      p.addEventListener('touchstart', function() {
        var strongs = p.querySelectorAll('strong');
        strongs.forEach(function(s) { s.classList.add('para-hover-glow'); });
        setTimeout(function() {
          strongs.forEach(function(s) { s.classList.remove('para-hover-glow'); });
        }, 1200);
      }, { passive: true });

      p.addEventListener('click', function(e) {
        /* Si ya estaba enfocado este → limpiar */
        if (_focused === p) {
          _clearFocus(wellEl);
          return;
        }
        _clearFocus(wellEl);
        _focused = p;
        p.classList.add('reading-focus-active');
        /* Opacitar los demás */
        paras.forEach(function(other) {
          if (other !== p) other.classList.add('reading-focus-dim');
        });
        e.stopPropagation();
      });
    });

    /* Click fuera del well → limpiar foco */
    document.addEventListener('click', function(e) {
      if (_focused && !wellEl.contains(e.target)) {
        _clearFocus(wellEl);
      }
    });
  }

  function _clearFocus(wellEl) {
    _focused = null;
    wellEl.querySelectorAll('.reading-focus-active').forEach(function(el) {
      el.classList.remove('reading-focus-active');
    });
    wellEl.querySelectorAll('.reading-focus-dim').forEach(function(el) {
      el.classList.remove('reading-focus-dim');
    });
  }

  /* Exponer para que _injectBody lo llame */
  window.nexus66AttachFocusHandlers = attachFocusHandlers;
})();

var N68_DIFF_KEY   = 'nexus68_dificultad_v1';
var n68Dificultad  = {};   /* { cardId_parrafoIdx: { texto: ..., ts: ... } } */

(function() {
  try { n68Dificultad = JSON.parse(localStorage.getItem(N68_DIFF_KEY) || '{}'); }
  catch(e) { n68Dificultad = {}; }
})();

function n68SaveDiff() {
  try { localStorage.setItem(N68_DIFF_KEY, JSON.stringify(n68Dificultad)); }
  catch(e) {}
}

/* Inyectar botones "No entiendo" al final de cada párrafo del well */
window.n68AttachDiffButtons = function(wellEl, itemId) {
  if (!wellEl || !itemId) return;
  try {
    var paras = wellEl.querySelectorAll('p');
    paras.forEach(function(p, idx) {
      if (p.querySelector('.n68-diff-btn')) return;   /* evitar doble inyección */
      var key   = itemId + '_p' + idx;
      var isMarked = !!n68Dificultad[key];

      var btn = document.createElement('button');
      btn.className = 'n68-diff-btn' + (isMarked ? ' n68-diff-marked' : '');
      btn.title = isMarked ? 'Marcado como difícil — clic para quitar' : 'Marcar como difícil';
      btn.textContent = isMarked ? '🔴' : '❓';
      btn.setAttribute('data-key', key);
      btn.setAttribute('data-idx', idx);

      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var k = this.getAttribute('data-key');
        if (n68Dificultad[k]) {
          /* Desmarcar */
          delete n68Dificultad[k];
          this.textContent = '❓';
          this.classList.remove('n68-diff-marked');
          this.title = 'Marcar como difícil';
        } else {
          /* Marcar */
          var txt = (p.textContent || '').trim().substring(0, 120);
          n68Dificultad[k] = { texto: txt, itemId: itemId, ts: Date.now() };
          this.textContent = '🔴';
          this.classList.add('n68-diff-marked');
          this.title = 'Marcado como difícil — clic para quitar';
          /* Feedback inmediato */
          n68ShowDiffFeedback(p);
        }
        n68SaveDiff();
      });

      p.style.position = 'relative';
      p.appendChild(btn);
    });

    /* Mostrar banner de sugerencia si hay dificultades en este item */
    n68ShowReturnBanner(wellEl, itemId);
  } catch(e) { /* fail silencioso */ }
};

function n68ShowDiffFeedback(p) {
  var toast = document.createElement('div');
  toast.className = 'n68-toast';
  toast.textContent = '📌 Guardado. La próxima vez te lo recordamos.';
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; }, 1800);
  setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 2200);
}

/* Banner al re-entrar a un material con dificultades previas */
function n68ShowReturnBanner(wellEl, itemId) {
  /* Buscar dificultades de este item */
  var diffs = Object.keys(n68Dificultad).filter(function(k) {
    return k.indexOf(itemId + '_p') === 0;
  });
  if (!diffs.length) return;
  /* Calcular antigüedad — solo mostrar si fue dentro de los últimos 7 días */
  var recent = diffs.filter(function(k) {
    return Date.now() - (n68Dificultad[k].ts || 0) < 7 * 24 * 3600 * 1000;
  });
  if (!recent.length) return;

  /* No duplicar */
  if (wellEl.querySelector('.n68-return-banner')) return;

  var firstDiff = n68Dificultad[recent[0]];
  var banner = document.createElement('div');
  banner.className = 'n68-return-banner';
  banner.innerHTML =
    '<span class="n68-rb-icon">🔔</span>' +
    '<div class="n68-rb-text">' +
      '<strong>Che, acá te trabaste.</strong> ' +
      '<span>Tenés ' + recent.length + ' párrafo' + (recent.length > 1 ? 's' : '') +
      ' marcado' + (recent.length > 1 ? 's' : '') + ' como difícil en esta sección.</span>' +
    '</div>' +
    '<button class="n68-rb-btn">Repasar ahora</button>' +
    '<button class="n68-rb-close">✕</button>';

  banner.querySelector('.n68-rb-btn').addEventListener('click', function() {
    /* Scroll al primer párrafo difícil */
    var firstKey = recent[0];
    var idx = parseInt(firstKey.split('_p').pop(), 10);
    var paras = wellEl.querySelectorAll('p');
    if (paras[idx]) {
      paras[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
      paras[idx].classList.add('n68-diff-highlight');
      setTimeout(function() { paras[idx].classList.remove('n68-diff-highlight'); }, 3000);
    }
    banner.style.display = 'none';
  });
  banner.querySelector('.n68-rb-close').addEventListener('click', function() {
    banner.style.display = 'none';
  });

  /* Insertar al inicio del well */
  wellEl.insertBefore(banner, wellEl.firstChild);
}

var N68_SESSION_KEY = 'nexus68_session_v1';
var n68Session = {};

(function() {
  try { n68Session = JSON.parse(localStorage.getItem(N68_SESSION_KEY) || '{}'); }
  catch(e) { n68Session = {}; }
})();

function n68SaveSession() {
  try { localStorage.setItem(N68_SESSION_KEY, JSON.stringify(n68Session)); }
  catch(e) {}
}

/* Guardar posición de scroll para un card */
window.n68TrackScroll = function(cardId) {
  var card = document.getElementById(cardId);
  if (!card) return;
  var well = card.querySelector('.mc-well');
  if (!well) return;
  /* Guardar scroll del well o del documento */
  var scrollY = well.scrollTop || window.scrollY;
  n68Session.lastCardId  = cardId;
  n68Session.lastScrollY = scrollY;
  n68Session.lastPage    = (document.querySelector('.page.active') || {}).id || '';
  n68Session.ts          = Date.now();
  n68SaveSession();
};

/* Restaurar sesión al cargar */
window.n68RestoreSession = function() {
  if (!n68Session.lastPage || !n68Session.lastCardId) return;
  /* Solo restaurar si fue hace menos de 24h */
  if (Date.now() - (n68Session.ts || 0) > 24 * 3600 * 1000) return;

  var pageId = n68Session.lastPage;
  var cardId = n68Session.lastCardId;
  var scrollY = n68Session.lastScrollY || 0;

  /* Navegar a la página */
  if (typeof goto === 'function') goto(pageId, null);

  /* Abrir el card y restaurar scroll */
  setTimeout(function() {
    var card = document.getElementById(cardId);
    if (card) {
      if (!card.classList.contains('open') && typeof fceCard === 'function') {
        fceCard(cardId);
      }
      setTimeout(function() {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (scrollY > 0) window.scrollTo({ top: scrollY, behavior: 'smooth' });
      }, 400);
    }
  }, 600);
};

var N68_TIME_KEY  = 'nexus68_tiempo_v1';
var n68Tiempo     = {};    /* { "Contabilidad/Itinerario II": segundos } */
var n68TimerState = { active: false, key: '', startedAt: 0, intervalId: null };

(function() {
  try { n68Tiempo = JSON.parse(localStorage.getItem(N68_TIME_KEY) || '{}'); }
  catch(e) { n68Tiempo = {}; }
})();

function n68SaveTiempo() {
  try { localStorage.setItem(N68_TIME_KEY, JSON.stringify(n68Tiempo)); }
  catch(e) {}
}

function n68FormatTime(secs) {
  if (secs < 60)   return secs + 's';
  if (secs < 3600) return Math.floor(secs / 60) + 'm ' + (secs % 60) + 's';
  return Math.floor(secs / 3600) + 'h ' + Math.floor((secs % 3600) / 60) + 'm';
}

/* Iniciar cronómetro para una materia/agrupador */
window.n68StartTimer = function(materia, agrupador) {
  if (n68TimerState.active) n68StopTimer();   /* detener anterior */
  var key = (materia || 'Portal') + '/' + (agrupador || 'General');
  n68TimerState = { active: true, key: key, startedAt: Date.now(), intervalId: null };
  /* Actualizar badge cada 10s */
  n68TimerState.intervalId = setInterval(function() {
    var elapsed = Math.floor((Date.now() - n68TimerState.startedAt) / 1000);
    n68Tiempo[key] = (n68Tiempo[key] || 0) + 10;
    n68SaveTiempo();
    n68UpdateTimerBadge(key, elapsed);
  }, 10000);
  n68UpdateTimerBadge(key, 0);
};

function n68StopTimer() {
  if (!n68TimerState.active) return;
  clearInterval(n68TimerState.intervalId);
  var elapsed = Math.floor((Date.now() - n68TimerState.startedAt) / 1000);
  n68Tiempo[n68TimerState.key] = (n68Tiempo[n68TimerState.key] || 0) + elapsed;
  n68SaveTiempo();
  n68TimerState.active = false;
}

function n68UpdateTimerBadge(key, sessionSecs) {
  var badge = document.getElementById('n68-timer-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'n68-timer-badge';
    badge.className = 'n68-timer-badge';
    var footer = document.querySelector('.sb-footer');
    if (footer) footer.insertBefore(badge, footer.firstChild);
    else document.body.appendChild(badge);
  }
  var total = n68Tiempo[key] || 0;
  var parts = key.split('/');
  var label = parts[parts.length - 1] || key;
  badge.innerHTML =
    '<span class="n68-tb-icon">⏱</span>' +
    '<span class="n68-tb-label">' + label + '</span>' +
    '<span class="n68-tb-time">' + n68FormatTime(total) + '</span>';
  badge.title = 'Tiempo total en ' + key + ': ' + n68FormatTime(total);
}

/* Detener cronómetro al cerrar/cambiar pestaña */
window.addEventListener('beforeunload', function() { n68StopTimer(); });
window.addEventListener('visibilitychange', function() {
  if (document.hidden) n68StopTimer();
  else if (n68TimerState.key) n68StartTimer.apply(null, n68TimerState.key.split('/'));
});


var NexusMemoryAPI = {

  explainConcept: function(term, materia, context) {
    /* SOCKET: recibe término + materia + párrafo contexto
       Retorna Promise<string> con la explicación IA
       Por defecto: devuelve null (sin IA) */
    return Promise.resolve(null);
  },

  semanticSearch: function(query, data) {
    /* SOCKET: recibe query libre + array de items
       Retorna Promise<Array> con items relevantes
       Por defecto: búsqueda literal */
    var q = (query || '').toLowerCase();
    return Promise.resolve(
      (data || []).filter(function(item) {
        return (item.titulo || '').toLowerCase().indexOf(q) !== -1 ||
               (item.descripcion || '').toLowerCase().indexOf(q) !== -1;
      })
    );
  },

  /* v7.0 puede inyectar explicaciones generadas en tiempo real
     En el cuerpo de un well, buscar elementos [data-ai-socket]
     y rellenarlos con la respuesta de explainConcept */
  injectAIExplanation: function(wellEl, itemId, materia) {
    /* SOCKET: busca spans con data-ai-socket y los popula */
    var sockets = wellEl ? wellEl.querySelectorAll('[data-ai-socket]') : [];
    if (!sockets.length) return;
    sockets.forEach(function(socket) {
      var term = socket.getAttribute('data-ai-socket');
      NexusMemoryAPI.explainConcept(term, materia, socket.textContent)
        .then(function(explanation) {
          if (!explanation) return;
          /* Cuando v7.0 provea una explicación, mostrarla */
          var bubble = document.createElement('div');
          bubble.className = 'nexus-ai-bubble';
          bubble.setAttribute('data-ai-term', term);
          bubble.textContent = explanation;
          socket.parentNode.insertBefore(bubble, socket.nextSibling);
        })
        .catch(function() { /* fail silencioso */ });
    });
  },

  /* Registro de callbacks externos — v7.0 puede registrarse aquí */
  _hooks: {},
  on: function(event, fn) {
    if (!NexusMemoryAPI._hooks[event]) NexusMemoryAPI._hooks[event] = [];
    NexusMemoryAPI._hooks[event].push(fn);
  },
  emit: function(event, data) {
    (NexusMemoryAPI._hooks[event] || []).forEach(function(fn) {
      try { fn(data); } catch(e) {}
    });
  }
};

/* Exponer globalmente — v7.0 accede como window.NexusMemoryAPI */
window.NexusMemoryAPI = NexusMemoryAPI;

/* Emitir eventos que v7.0 puede escuchar */
/* NexusMemoryAPI.on('card:open', fn)    → disparado al abrir un card     */
/* NexusMemoryAPI.on('quiz:end', fn)     → disparado al terminar un quiz  */
/* NexusMemoryAPI.on('diff:marked', fn)  → disparado al marcar dificultad */

var NexusEvaluator = {

  /* Extraer términos de <strong> desde el DOM del well */
  extractTerms: function(wellEl) {
    var terms = [];
    wellEl.querySelectorAll('strong').forEach(function(s) {
      var txt = (s.textContent || '').trim();
      if (txt.length > 3 && txt.length < 80 &&
          !txt.match(/^[0-9\s·,.-]+$/) &&
          terms.indexOf(txt) === -1) {
        terms.push(txt);
      }
    });
    return terms;
  },

  /* Generar 3 preguntas: 2 de definición, 1 de relación */
  generateQuestions: function(terms) {
    if (!terms || terms.length < 2) return [];
    var shuffled = terms.slice().sort(function() { return Math.random() - .5; });
    var questions = [];

    /* Tipo A: Definición */
    for (var i = 0; i < Math.min(2, shuffled.length); i++) {
      questions.push({
        tipo:    'definicion',
        termino: shuffled[i],
        texto:   '¿Cómo definirías <strong>' + shuffled[i] + '</strong> según lo que acabás de leer?',
        keywords: shuffled[i].toLowerCase().split(/\s+/)
      });
    }

    /* Tipo B: Relación (si hay 2+ términos) */
    if (shuffled.length >= 2) {
      var a = shuffled[0], b = shuffled[1];
      questions.push({
        tipo:    'relacion',
        termino: a + ' — ' + b,
        texto:   '¿Qué relación encontrás entre <strong>' + a + '</strong> y <strong>' + b + '</strong>?',
        keywords: (a + ' ' + b).toLowerCase().split(/\s+/).filter(function(w){ return w.length > 3; })
      });
    }

    return questions;
  },

  /* Evaluar respuesta: comparar keywords */
  evalResponse: function(respuesta, keywords) {
    if (!respuesta || !respuesta.trim()) return 0;
    var resp   = respuesta.toLowerCase();
    var hits   = keywords.filter(function(kw) { return resp.indexOf(kw) !== -1; }).length;
    var pct    = keywords.length > 0 ? Math.round((hits / keywords.length) * 100) : 0;
    return pct;
  },

  /* Feedback semántico — usa el término específico y da pistas, nunca la respuesta */
  feedback: function(pct, termino) {
    var t = termino || 'este concepto';
    if (pct >= 70) {
      var msgs = [
        '¡Excelente! Metiste el concepto de "' + t + '" justo donde iba. Estás para el 10. 🎯',
        '¡Perfecto! Le pegaste de lleno a "' + t + '". El profe te pondría un 10. 🏆',
        'Muy bien, lince. "' + t + '" quedó claro y en contexto. Así se estudia. ✅',
      ];
      return { msg: msgs[Math.floor(Math.random() * msgs.length)], cls: 'ev-ok' };
    }
    if (pct >= 40) {
      var hints = [
        'Casi, che. Fijate que en "' + t + '" hay un matiz clave que todavía no aparece. Dale otra vuelta al párrafo.',
        'Vas bien con "' + t + '", pero te faltó conectarlo. Mirá las líneas anteriores, que ahí está la clave.',
        'Casi. El concepto de "' + t + '" lo describís bien, pero le falta relacionarlo. Un pasito más.',
        'Por ahí vas, pero afinar un poco más "' + t + '". En el parcial de la FCE eso marca la diferencia.',
      ];
      return { msg: hints[Math.floor(Math.random() * hints.length)], cls: 'ev-med' };
    }
    /* Pista pedagógica — nunca la respuesta */
    var pistas = [
      'No te rindas con "' + t + '". Buscá en el texto dónde aparece en negrita y leé las dos líneas que siguen. La definición está ahí.',
      'Hmm, "' + t + '" es un concepto que tiene su propia lógica interna. Volvé al párrafo, subrayá la frase principal y reintentá.',
      'Te trabaste en "' + t + '". No pasa nada. El secreto es: ¿qué problema viene a resolver este concepto según el autor? Arrancá por ahí.',
    ];
    return { msg: pistas[Math.floor(Math.random() * pistas.length)], cls: 'ev-low' };
  },

  /* Inyectar bloque section.nexus-evaluator al final del well */
  inject: function(wellEl, item) {
    if (!wellEl || !item) return;
    try {
      var terms = NexusEvaluator.extractTerms(wellEl);
      if (terms.length < 2) return;   /* sin suficientes términos → no inyectar */
      var questions = NexusEvaluator.generateQuestions(terms);
      if (!questions.length) return;

      /* No duplicar */
      if (wellEl.querySelector('.nexus-evaluator')) return;

      var section = document.createElement('section');
      section.className = 'nexus-evaluator';
      section.setAttribute('data-item-id', item.id || '');

      /* Header del evaluador */
      var header = document.createElement('div');
      header.className = 'nev-header';
      header.innerHTML =
        '<span class="nev-icon">🧠</span>' +
        '<div class="nev-title">Autoevaluación rápida</div>' +
        '<span class="nev-badge">' + questions.length + ' preguntas · 2 min</span>';

      /* Toggle para mostrar/ocultar */
      var body = document.createElement('div');
      body.className = 'nev-body';
      body.style.display = 'none';

      header.style.cursor = 'pointer';
      header.addEventListener('click', function() {
        var isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'block';
        header.querySelector('.nev-icon').textContent = isOpen ? '🧠' : '📝';
      });

      /* Construir preguntas */
      questions.forEach(function(q, qi) {
        var qDiv = document.createElement('div');
        qDiv.className = 'nev-question';
        qDiv.setAttribute('data-qi', qi);

        var qLabel = document.createElement('p');
        qLabel.className = 'nev-q-text';
        qLabel.innerHTML = (qi + 1) + '. ' + q.texto;

        var textarea = document.createElement('textarea');
        textarea.className = 'nev-textarea';
        textarea.placeholder = 'Escribí tu respuesta acá…';
        textarea.rows = 3;

        var btn = document.createElement('button');
        btn.className = 'nev-submit-btn';
        btn.textContent = 'Evaluar respuesta';

        var fbDiv = document.createElement('div');
        fbDiv.className = 'nev-feedback';
        fbDiv.style.display = 'none';

        btn.addEventListener('click', (function(question, ta, fb) {
          return function() {
            var pct  = NexusEvaluator.evalResponse(ta.value, question.keywords);
            var fb70 = NexusEvaluator.feedback(pct, question.termino);
            fb.className = 'nev-feedback ' + fb70.cls;
            fb.innerHTML =
              '<span class="nev-fb-msg">' + fb70.msg + '</span>' +
              '<span class="nev-fb-pct">' + pct + '% de palabras clave encontradas</span>';
            fb.style.display = 'block';
            ta.disabled = true;
            btn.style.display = 'none';
            /* Emitir evento para NexusMemoryAPI */
            if (typeof NexusMemoryAPI !== 'undefined') {
              NexusMemoryAPI.emit('evaluator:answered', {
                itemId: item.id, question: question.termino, pct: pct
              });
            }
          };
        })(q, textarea, fbDiv));

        qDiv.appendChild(qLabel);
        qDiv.appendChild(textarea);
        qDiv.appendChild(btn);
        qDiv.appendChild(fbDiv);
        body.appendChild(qDiv);
      });

      section.appendChild(header);
      section.appendChild(body);
      wellEl.appendChild(section);
    } catch(e) { /* fail silencioso */ }
  }
};


var N70_REPASO_KEY = 'nexus70_repaso_v1';

/* Parchar fceMarcarLeido para guardar timestamp (bug en 6.6: solo guardaba true) */
(function() {
  var _origMarcar = window.fceMarcarLeido;
  window.fceMarcarLeido = function(slug, titulo, materia) {
    /* Guardar con timestamp */
    try {
      var stored = JSON.parse(localStorage.getItem('nexus_leidos_v1') || '{}');
      stored[slug] = { titulo: titulo || '', materia: materia || '', ts: Date.now() };
      localStorage.setItem('nexus_leidos_v1', JSON.stringify(stored));
      NEXUS_STATE.fceLeidos[slug] = true;
    } catch(e) {}
    if (_origMarcar) _origMarcar.apply(this, arguments);
  };
})();

/* Calcular y renderizar alertas de repaso en el sidebar */
window.n70RenderRepasoAlerts = function() {
  if (!NexusCore.getMateriales()) return;
  var TRES_DIAS = 3 * 24 * 3600 * 1000;
  var now = Date.now();

  /* Leer leídos con ts */
  var leidos = {};
  try { leidos = JSON.parse(localStorage.getItem('nexus_leidos_v1') || '{}'); } catch(e) {}

  /* Leer scores de quiz */
  var scores = {};
  try { scores = JSON.parse(localStorage.getItem('fce_portal_scores_v1') || '{}'); } catch(e) {}

  /* Determinar alertas: leído hace >3 días SIN quiz completado */
  var alertas = [];
  Object.keys(leidos).forEach(function(slug) {
    var entry = leidos[slug];
    var ts = (typeof entry === 'object') ? entry.ts : 0;
    if (!ts || (now - ts) < TRES_DIAS) return;
    /* ¿Hizo el quiz relacionado? */
    var item = NexusCore.getMateriales().find(function(i) { return i && i.id === slug; });
    if (!item) return;
    var relQuizId = item.relacionado;
    var hizoquiz  = relQuizId && scores[relQuizId] && scores[relQuizId].best;
    if (!hizoquiz) {
      alertas.push({ slug: slug, titulo: item.titulo || slug, materia: item.materia || '', ts: ts });
    }
  });

  /* Inyectar badges ⏳ en sidebar */
  document.querySelectorAll('.sb-item').forEach(function(sbItem) {
    var onclick = sbItem.getAttribute('onclick') || '';
    alertas.forEach(function(alerta) {
      /* Buscar sb-item que navegue a la página de esa materia */
      var mat = alerta.materia.split(' ')[0].toLowerCase();
      if (onclick.toLowerCase().indexOf(mat) !== -1 &&
          !sbItem.querySelector('.n70-repaso-badge')) {
        var badge = document.createElement('span');
        badge.className = 'n70-repaso-badge';
        badge.textContent = '⏳';
        badge.title = 'Che, no te olvides de repasar esto antes de que se te borre de la cabeza';
        sbItem.appendChild(badge);
      }
    });
  });

  /* Guardar alertas para Training Ground */
  try { localStorage.setItem(N70_REPASO_KEY, JSON.stringify(alertas)); } catch(e) {}
  return alertas;
};


var _n70MacheteLevel = 'novato';   /* 'novato' (10%) | 'experto' (30%) */

window.n70SetMacheteLevel = function(level) {
  _n70MacheteLevel = level;
  /* Actualizar UI del toggle */
  ['novato','experto'].forEach(function(l) {
    var btn = document.getElementById('n70-ml-' + l);
    if (btn) btn.classList.toggle('n70-ml-active', l === level);
  });
};

/* Override Nexus6.PrintBlank.RATE con nivel seleccionado */
(function() {
  var _origBeforePrint = null;
  window.addEventListener('beforeprint', function() {
    if (typeof Nexus6 !== 'undefined' && Nexus6.PrintBlank) {
      Nexus6.PrintBlank.RATE = _n70MacheteLevel === 'experto' ? 0.30 : 0.10;
    }
  }, true);  /* captura antes que el listener de 6.5 */
})();

/* Inyectar toggle de nivel en la ventana del machete */
(function() {
  var _origGenerateMachete = null;

  /* Se hookea cuando Nexus6.Print.generateMachete se llama */
  window.n70WrapGenerateMachete = function() {
    if (!window.Nexus6 || !Nexus6.Print) return;
    var _orig = Nexus6.Print.generateMachete;
    Nexus6.Print.generateMachete = function(item) {
      /* Mostrar selector de nivel antes de abrir la ventana */
      n70ShowMacheteSelector(item, _orig);
    };
  };
})();

function n70ShowMacheteSelector(item, originalFn) {
  /* Modal de selección de nivel */
  var existing = document.getElementById('n70-machete-modal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'n70-machete-modal';
  modal.className = 'n70-machete-modal';
  modal.innerHTML =
    '<div class="n70-mm-inner">' +
      '<div class="n70-mm-title">⚙ Configurar Machete</div>' +
      '<div class="n70-mm-subtitle">Elegí el nivel de andamiaje para tu guía de estudio</div>' +
      '<div class="n70-mm-levels">' +
        '<button id="n70-ml-novato" class="n70-ml-btn n70-ml-active" onclick="n70SetMacheteLevel(\'novato\')">' +
          '<span class="n70-ml-icon">📗</span>' +
          '<span class="n70-ml-name">Nivel Novato</span>' +
          '<span class="n70-ml-desc">10% de palabras clave en blanco</span>' +
        '</button>' +
        '<button id="n70-ml-experto" class="n70-ml-btn" onclick="n70SetMacheteLevel(\'experto\')">' +
          '<span class="n70-ml-icon">📕</span>' +
          '<span class="n70-ml-name">Nivel Experto</span>' +
          '<span class="n70-ml-desc">30% de frases para reconstruir</span>' +
        '</button>' +
      '</div>' +
      '<div class="n70-mm-actions">' +
        '<button class="n70-mm-cancel" onclick="document.getElementById(\'n70-machete-modal\').remove()">Cancelar</button>' +
        '<button class="n70-mm-confirm" onclick="n70ConfirmMachete()">Generar Machete →</button>' +
      '</div>' +
    '</div>';

  modal.setAttribute('data-item', JSON.stringify({ id: item.id, titulo: item.titulo, materia: item.materia, agrupador: item.agrupador, cuerpo: item.cuerpo, relacionado: item.relacionado || '' }));
  document.body.appendChild(modal);
}

window.n70ConfirmMachete = function() {
  var modal = document.getElementById('n70-machete-modal');
  if (!modal) return;
  try {
    var item = JSON.parse(modal.getAttribute('data-item') || '{}');
    modal.remove();
    /* Aplicar RATE antes de imprimir */
    if (typeof Nexus6 !== 'undefined' && Nexus6.PrintBlank) {
      Nexus6.PrintBlank.RATE = _n70MacheteLevel === 'experto' ? 0.30 : 0.10;
    }
    if (typeof Nexus6 !== 'undefined' && Nexus6.Print) {
      Nexus6.Print.generateMachete(item);
    }
  } catch(e) { console.warn('n70ConfirmMachete error:', e); }
};


window.n70OpenTrainingGround = function() {
  /* Navegar a la página */
  goto('training-ground', null);
  setTimeout(n70RenderTrainingGround, 200);
};

function n70RenderTrainingGround() {
  var content = document.getElementById('tg-content');
  var subtitle = document.getElementById('tg-subtitle');
  if (!content) return;

  /* Leer dificultades */
  var diffs = {};
  try { diffs = JSON.parse(localStorage.getItem('nexus68_dificultad_v1') || '{}'); } catch(e) {}

  var keys = Object.keys(diffs).filter(function(k) {
    return diffs[k] && diffs[k].ts && (Date.now() - diffs[k].ts) < 30 * 24 * 3600 * 1000;
  });

  /* Actualizar chip del sidebar */
  var chip = document.getElementById('tg-chip');
  if (chip) chip.textContent = keys.length;

  if (!keys.length) {
    content.innerHTML =
      '<div class="tg-empty">' +
        '<div class="tg-empty-icon">🎯</div>' +
        '<div class="tg-empty-title">¡Todo bajo control!</div>' +
        '<div class="tg-empty-msg">No tenés conceptos marcados como difíciles. ' +
          'Cuando leas un material y encontrés algo que no entendés, ' +
          'hacé click en el botón ❓ al lado del párrafo.</div>' +
      '</div>';
    if (subtitle) subtitle.textContent = 'Sin conceptos pendientes';
    return;
  }

  if (subtitle) subtitle.textContent = keys.length + ' concepto' + (keys.length !== 1 ? 's' : '') + ' para reforzar';

  /* Agrupar por itemId */
  var byItem = {};
  keys.forEach(function(k) {
    var d = diffs[k];
    var itemId = d.itemId || k.split('_p')[0];
    if (!byItem[itemId]) byItem[itemId] = [];
    byItem[itemId].push({ key: k, texto: d.texto || '', ts: d.ts });
  });

  /* Construir fichas de refuerzo */
  var html = '<div class="tg-grid">';
  Object.keys(byItem).forEach(function(itemId) {
    var concepts = byItem[itemId];
    /* Buscar datos del item */
    var item = NexusCore.getMateriales() ? NexusCore.getMateriales().find(function(i){ return i && i.id === itemId; }) : null;
    var titulo  = item ? (item.titulo || itemId) : itemId;
    var materia = item ? (item.materia || '') : '';
    var color = nexusColorForMateria(materia.split(' ')[0]) || NEXUS_COLORS.materias.home.base; /* v19.3.1 */
    var diasAtras = Math.floor((Date.now() - concepts[0].ts) / (24*3600*1000));

    html +=
      '<div class="tg-card" style="border-left-color:' + color + '">' +
        '<div class="tg-card-header">' +
          '<div class="tg-card-mat" style="color:' + color + '">' + materia + '</div>' +
          '<div class="tg-card-title">' + titulo + '</div>' +
          '<div class="tg-card-age">⏱ hace ' + diasAtras + ' día' + (diasAtras !== 1 ? 's' : '') + '</div>' +
        '</div>' +
        '<div class="tg-card-concepts">';

    concepts.forEach(function(c) {
      html +=
        '<div class="tg-concept">' +
          '<span class="tg-concept-icon">🔴</span>' +
          '<span class="tg-concept-text">' + (c.texto || 'Párrafo marcado') + '</span>' +
        '</div>';
    });

    html +=
        '</div>' +
        '<div class="tg-card-actions">' +
          '<button class="tg-goto-btn" style="border-color:' + color + ';color:' + color + '" ' +
            'data-item="' + itemId + '" onclick="n70GoToMaterial(this.dataset.item)">' +
            'Ir al material →' +
          '</button>' +
          '<button class="tg-clear-btn" data-item="' + itemId + '" onclick="n70ClearItemDiffs(this.dataset.item)">' +
            '✓ Ya lo entendí' +
          '</button>' +
        '</div>' +
      '</div>';
  });

  html += '</div>';
  content.innerHTML = html;
}

window.n70GoToMaterial = function(itemId) {
  if (!NexusCore.getMateriales()) return;
  var item = NexusCore.getMateriales().find(function(i){ return i && i.id === itemId; });
  if (!item) return;
  /* Determinar página de la materia */
  var matPageMap = {
    'Contabilidad':'cont-materiales','Contabilidad I':'cont-materiales',
    'Administración':'adm-materiales','Administración I':'adm-materiales',
    'Sociales':'soc-materiales','Cs. Sociales':'soc-materiales',
    'Propedéutica':'prop-materiales'
  };
  var pageId = matPageMap[item.materia] || 'home';
  goto(pageId, null);
  setTimeout(function() {
    var card = document.getElementById('mcard-' + itemId);
    if (card) {
      card.scrollIntoView({ behavior:'smooth', block:'center' });
      if (!card.classList.contains('open') && typeof fceCard === 'function') fceCard('mcard-' + itemId);
    }
  }, 500);
};

window.n70ClearItemDiffs = function(itemId) {
  try {
    var diffs = JSON.parse(localStorage.getItem('nexus68_dificultad_v1') || '{}');
    Object.keys(diffs).forEach(function(k) {
      if (k.indexOf(itemId + '_p') === 0) delete diffs[k];
    });
    localStorage.setItem('nexus68_dificultad_v1', JSON.stringify(diffs));
  } catch(e) {}
  n70RenderTrainingGround();
};

var NexusRadar = {

  /* Mapeo de score keys → materia */
  KEY_MAP: {
    /* Keys de q55RenderResult (v7.1) */
    'unidad_i':       'Administración', 'unidad_ii':      'Administración',
    'unidad_iii':     'Administración',
    'itinerario_i':   'Contabilidad',   'itinerario_ii':  'Contabilidad',
    'itinerario_iii': 'Contabilidad',   'itinerario_iv':  'Contabilidad',
    'itinerario_v':   'Contabilidad',
    /* Keys directos */
    'prop':           'Propedéutica',   'adm':            'Administración',
    'cont':           'Contabilidad',   'soc':            'Sociales',
    /* Keys parciales por prefijo */
    'soc-u1':         'Sociales',       'soc-u2':         'Sociales',
    'soc-u3':         'Sociales',
    'adm-u1':         'Administración', 'adm-u2':         'Administración',
  },

  /* Inferir materia desde el key de score */
  inferMateria: function(key) {
    var k = (key || '').toLowerCase();
    /* Exact match */
    if (NexusRadar.KEY_MAP[k]) return NexusRadar.KEY_MAP[k];
    /* Prefix match */
    for (var prefix in NexusRadar.KEY_MAP) {
      if (k.indexOf(prefix) === 0) return NexusRadar.KEY_MAP[prefix];
    }
    /* Fallback por palabra clave */
    if (k.indexOf('cont') !== -1 || k.indexOf('itinerar') !== -1) return 'Contabilidad';
    if (k.indexOf('adm')  !== -1 || k.indexOf('admin')    !== -1) return 'Administración';
    if (k.indexOf('soc')  !== -1 || k.indexOf('social')   !== -1) return 'Sociales';
    if (k.indexOf('prop') !== -1 || k.indexOf('propedeu') !== -1) return 'Propedéutica';
    return null;
  },

  /* Calcular promedios por materia desde localStorage */
  computeScores: function() {
    var scores = {};
    try { scores = JSON.parse(localStorage.getItem('fce_portal_scores_v1') || '{}'); }
    catch(e) { return {}; }

    var byMat = {
      'Propedéutica':   { total: 0, count: 0 },
      'Contabilidad':   { total: 0, count: 0 },
      'Administración': { total: 0, count: 0 },
      'Sociales':       { total: 0, count: 0 },
    };

    Object.keys(scores).forEach(function(key) {
      var mat = NexusRadar.inferMateria(key);
      if (!mat || !byMat[mat]) return;
      var pct = (scores[key].best && scores[key].best.pct) || (scores[key].last && scores[key].last.pct) || 0;
      byMat[mat].total += pct;
      byMat[mat].count++;
    });

    var result = {};
    Object.keys(byMat).forEach(function(mat) {
      result[mat] = byMat[mat].count > 0
        ? Math.round(byMat[mat].total / byMat[mat].count)
        : 0;
    });
    return result;
  },

  /* Renderizar gráfico SVG en el contenedor */
  render: function(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var scores = NexusRadar.computeScores();
    var materias = ['Propedéutica','Contabilidad','Administración','Sociales'];
    var colors   = { /* v19.3.1: derivado de NEXUS_COLORS */ ...NEXUS_NAME_COLORS };
    var values   = materias.map(function(m) { return (scores[m] || 0) / 100; }); /* normalizar a 0-1 */
    var hasData  = values.some(function(v) { return v > 0; });

    var SIZE   = 200;
    var CX     = SIZE / 2;
    var CY     = SIZE / 2;
    var R      = 80;   /* radio máximo */
    var N      = materias.length;

    /* Coordenadas de cada eje (rotadas 45° para que queden como diamante) */
    function axis(i, r) {
      var angle = (Math.PI * 2 * i / N) - Math.PI / 2;
      return {
        x: CX + r * Math.cos(angle),
        y: CY + r * Math.sin(angle)
      };
    }

    /* Construir SVG como string */
    var svg = '<svg viewBox="0 0 ' + SIZE + ' ' + SIZE + '" xmlns="http://www.w3.org/2000/svg" ' +
      'class="radar-svg" role="img" aria-label="Radar de competencias">';

    /* Anillos de referencia: 25%, 50%, 75%, 100% */
    [0.25, 0.5, 0.75, 1].forEach(function(pct) {
      var pts = materias.map(function(_, i) {
        var p = axis(i, R * pct);
        return p.x + ',' + p.y;
      }).join(' ');
      svg += '<polygon points="' + pts + '" class="radar-ring" />';
    });

    /* Ejes desde el centro */
    materias.forEach(function(_, i) {
      var p = axis(i, R);
      svg += '<line x1="' + CX + '" y1="' + CY + '" x2="' + p.x + '" y2="' + p.y + '" class="radar-axis" />';
    });

    /* Área de datos */
    if (hasData) {
      var dataPts = materias.map(function(m, i) {
        var p = axis(i, R * Math.max(0.05, values[i]));
        return p.x + ',' + p.y;
      }).join(' ');
      svg += '<polygon points="' + dataPts + '" class="radar-area" />';

      /* Puntos en cada vértice de datos */
      materias.forEach(function(m, i) {
        var p = axis(i, R * Math.max(0.05, values[i]));
        svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="' + (colors[m] || NEXUS_COLORS.materias.home.base /* v19.3.2 */) + '" class="radar-dot" />';
      });
    } else {
      /* Sin datos — placeholder */
      svg += '<text x="' + CX + '" y="' + (CY + 5) + '" class="radar-empty">Completá un Quiz</text>';
    }

    /* Etiquetas de materia */
    materias.forEach(function(m, i) {
      var p = axis(i, R + 18);
      var short = { 'Propedéutica':'Prop.','Contabilidad':'Cont.','Administración':'Adm.','Sociales':'Soc.' };
      var pct = scores[m] || 0;
      svg += '<text x="' + p.x + '" y="' + p.y + '" class="radar-label">' + short[m] + '</text>';
      if (pct > 0) {
        svg += '<text x="' + p.x + '" y="' + (p.y + 11) + '" class="radar-pct" fill="' + (colors[m]) + '">' + pct + '%</text>';
      }
    });

    svg += '</svg>';

    /* Resumen textual debajo */
    var best = materias.reduce(function(a, b) { return (scores[a]||0) > (scores[b]||0) ? a : b; });
    var worst = materias.reduce(function(a, b) { return (scores[a]||0) < (scores[b]||0) ? a : b; });
    var insight = !hasData
      ? 'Completá tus primeros quizzes para ver tu perfil.'
      : 'Tu punto fuerte es <strong style="color:' + colors[best] + '">' + best + '</strong>' +
        (scores[worst] < scores[best] - 20 ? '. Enfocate más en <strong style="color:' + colors[worst] + '">' + worst + '</strong>.' : '. Rendimiento parejo.');

    container.innerHTML =
      '<div class="radar-wrap">' +
        '<div class="radar-title">🧭 Radar de Competencias</div>' +
        svg +
        '<div class="radar-insight">' + insight + '</div>' +
      '</div>';
  }
};


window.n72SuggestRepaso = function() {
  if (!NexusCore.getMateriales().length) return [];
  var SIETE_DIAS = 7 * 24 * 3600 * 1000;
  var now = Date.now();

  /* Leer leídos con timestamp */
  var leidos = {};
  try { leidos = JSON.parse(localStorage.getItem('nexus_leidos_v1') || '{}'); } catch(e) {}

  /* Items de tipo Resumen con timestamp antiguo */
  var sugeridos = NexusCore.getMateriales().filter(function(item) {
    if (!item || item.tipo !== 'Resumen') return false;
    var entry = leidos[item.id];
    if (!entry) return false;   /* nunca leído */
    var ts = typeof entry === 'object' ? entry.ts : 0;
    if (!ts) return false;
    return (now - ts) > SIETE_DIAS;
  }).sort(function(a, b) {
    /* Priorizar los más antiguos */
    var tsA = (leidos[a.id] || {}).ts || 0;
    var tsB = (leidos[b.id] || {}).ts || 0;
    return tsA - tsB;
  }).slice(0, 3);  /* máx 3 sugerencias */

  return sugeridos;
};

/* Renderizar panel de repaso espaciado */
window.n72RenderRepasoPanel = function(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var sugeridos = n72SuggestRepaso();
  if (!sugeridos.length) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  var html =
    '<div class="n72-repaso-panel">' +
      '<div class="n72-rp-header">' +
        '<span class="n72-rp-icon">🔁</span>' +
        '<div class="n72-rp-title">Repaso Espaciado</div>' +
        '<div class="n72-rp-sub">Hace más de 7 días que no repasás estos temas</div>' +
      '</div>' +
      '<div class="n72-rp-list">';

  sugeridos.forEach(function(item) {
    var colorMap = NEXUS_NAME_COLORS;
    var color = colorMap[item.materia] || NEXUS_COLORS.materias.home.base /* v19.3.2 */;
    var matPageMap = {
      'Contabilidad':'cont-materiales','Contabilidad I':'cont-materiales',
      'Administración':'adm-materiales','Sociales':'soc-materiales','Propedéutica':'prop-materiales'
    };
    var pageId = matPageMap[item.materia] || 'home';
    var entry  = {};
    try { entry = JSON.parse(localStorage.getItem('nexus_leidos_v1') || '{}')[item.id] || {}; } catch(e) {}
    var diasAtras = entry.ts ? Math.floor((Date.now() - entry.ts) / (24*3600*1000)) : '?';

    html +=
      '<div class="n72-rp-item" style="border-left-color:' + color + '">' +
        '<div class="n72-rp-mat" style="color:' + color + '">' + item.materia + '</div>' +
        '<div class="n72-rp-titulo">' + (item.titulo || item.id) + '</div>' +
        '<div class="n72-rp-age">Lo leíste hace ' + diasAtras + ' días</div>' +
        '<button class="n72-rp-btn" style="border-color:' + color + ';color:' + color + '"' +
          ' data-page="' + pageId + '" data-card="mcard-' + item.id + '"' +
          ' onclick="n72GoRepaso(this)">Repasar ahora →</button>' +
      '</div>';
  });

  html += '</div></div>';
  container.innerHTML = html;
};

window.n72GoRepaso = function(btn) {
  var pageId = btn.getAttribute('data-page');
  var cardId = btn.getAttribute('data-card');
  if (typeof goto === 'function') goto(pageId, null);
  setTimeout(function() {
    var card = document.getElementById(cardId);
    if (card) {
      card.scrollIntoView({ behavior:'smooth', block:'center' });
      if (!card.classList.contains('open') && typeof fceCard === 'function') fceCard(cardId);
    }
  }, 500);
};


window.n72RenderEspejos = function(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  /* Datos disponibles */
  var leidos = {};
  try { leidos = JSON.parse(localStorage.getItem('nexus_leidos_v1') || '{}'); } catch(e) {}
  var scores = {};
  try { scores = JSON.parse(localStorage.getItem('fce_portal_scores_v1') || '{}'); } catch(e) {}
  var streak = { days: 0 };
  try { streak = JSON.parse(localStorage.getItem('nexus6_streak') || '{}'); } catch(e) {}

  var SIETE_DIAS = 7 * 24 * 3600 * 1000;
  var now = Date.now();

  /* Calcular métricas */
  var leidosEsta = Object.keys(leidos).filter(function(k) {
    var e = leidos[k]; var ts = typeof e === 'object' ? e.ts : 0;
    return ts && (now - ts) < SIETE_DIAS;
  }).length;

  var quizCount  = Object.keys(scores).length;
  var quizGe80   = Object.keys(scores).filter(function(k) {
    return scores[k].best && scores[k].best.pct >= 80;
  }).length;

  var streakDays = streak.days || 0;

  /* Promedios de referencia (hardcoded motivacionales) */
  var PROM_SEMANA = 3;
  var PROM_QUIZZES = 2;

  /* Construir mensajes motivadores */
  var espejos = [];

  if (leidosEsta > 0) {
    var comp = leidosEsta > PROM_SEMANA
      ? '🔥 Estás por encima del promedio esta semana.'
      : '💪 Seguí así, cada material cuenta.';
    espejos.push({
      icon: '📚',
      valor: leidosEsta,
      label: 'material' + (leidosEsta !== 1 ? 'es' : '') + ' esta semana',
      msg:   comp,
      color: NEXUS_COLORS.materias.cont.base  /* lectura → cont (azul) */
    });
  }

  if (quizGe80 > 0) {
    espejos.push({
      icon: '🎯',
      valor: quizGe80,
      label: 'quiz' + (quizGe80 !== 1 ? 'zes' : '') + ' dominado' + (quizGe80 !== 1 ? 's' : ''),
      msg:   quizGe80 >= 3 ? '¡Excelente dominio conceptual!' : 'Seguí aprobando quizzes para reforzar.',
      color: NEXUS_COLORS.materias.soc.base
    });
  }

  if (streakDays >= 2) {
    espejos.push({
      icon: '🗓',
      valor: streakDays,
      label: 'día' + (streakDays !== 1 ? 's' : '') + ' de racha',
      msg:   streakDays >= 5 ? '¡Impresionante constancia! El parcial te espera.' : 'La constancia es la clave. No te detengas.',
      color: '#c8851a'
    });
  }

  if (!espejos.length) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  var html = '<div class="n72-espejos">';
  espejos.forEach(function(e) {
    html +=
      '<div class="n72-espejo" style="border-top-color:' + e.color + '">' +
        '<div class="n72-esp-icon">' + e.icon + '</div>' +
        '<div class="n72-esp-valor" style="color:' + e.color + '">' + e.valor + '</div>' +
        '<div class="n72-esp-label">' + e.label + '</div>' +
        '<div class="n72-esp-msg">' + e.msg + '</div>' +
      '</div>';
  });
  html += '</div>';
  container.innerHTML = html;
};

/* ── Inicializar todo al cargar el dashboard ── */
window.n72InitDashboard = function() {
  if (typeof NexusRadarV2 !== 'undefined') NexusRadarV2.render('n72-radar-container');
  else NexusRadar.render('n72-radar-container');   /* fallback */
  n72RenderRepasoPanel('n72-repaso-container');
  n72RenderEspejos('n72-espejos-container');
  if (typeof n73RenderPibes === 'function') n73RenderPibes('n73-pibes-container');
  if (typeof NexusSearch !== 'undefined') NexusSearch.renderPanel('n80-search-container');
  if (typeof N80Rangos !== 'undefined') N80Rangos.renderCard('n80-rango-container');
  if (typeof N81FeedbackMatrix !== 'undefined') N81FeedbackMatrix.render('n81-espejo-container');
  if (typeof N81SesgoEngine !== 'undefined') setTimeout(N81SesgoEngine.run, 800);
  /* v8.9: Neural Mapping — Prioridad de Repaso */
  if (typeof N89Predictor !== 'undefined') setTimeout(function(){ N89Predictor.analyze(); }, 600);
  /* v8.5: Calendario Crítico */
  if (typeof N85Calendario !== 'undefined') N85Calendario.render('n85-cal-container');
  /* v8.6: Laboratorio de Hipótesis */
  if (typeof N86HypoLab !== 'undefined') N86HypoLab.render('n86-hypo-container');
  /* v8.6: Glass toggle en sidebar */
  if (typeof N86Glass !== 'undefined') N86Glass.renderToggleBtn(null);
  /* v8.7: Mapa de Dominio Académico */
  if (typeof N87Analytics !== 'undefined') N87Analytics.render('n87-analytics-container');
  /* v8.7: Machete Maestro widget */
  if (typeof N87Anclajes !== 'undefined') N87Anclajes.renderDashWidget('n87-anclajes-container');
  /* v8.7: Onyx toggle en sidebar */
  if (typeof N87Onyx !== 'undefined') N87Onyx.renderToggleBtn(null);
};
window.n82OpenMercado = function(){
  goto('mercado-real', null);
  setTimeout(function(){ if(typeof N82Mercado!=='undefined') N82Mercado.render('mercado-content'); }, 200);
};

var CATEDRA_NOTAS = [
  {
    id: 'cn001',
    ts: 1748000000000,   /* timestamp fijo — actualizar al añadir */
    materia: 'Contabilidad',
    texto: 'Para el parcial: recordá siempre justificar el tipo de variación (permutativa vs modificativa). No alcanza con el asiento.',
    autor: 'Cátedra FCE'
  },
  {
    id: 'cn002',
    ts: 1748100000000,
    materia: 'Administración',
    texto: 'En la Unidad II, Robbins (2014) es el autor más citado en exámenes. Priorizá su definición de organización.',
    autor: 'Cátedra FCE'
  },
  {
    id: 'cn003',
    ts: 1748200000000,
    materia: 'Sociales',
    texto: 'Bachelard: no confundir obstáculo epistemológico con error científico. Son conceptualmente distintos. Pregunta frecuente.',
    autor: 'Cátedra FCE'
  },
];


var N73_SEEN_KEY = 'nexus73_seen_notas_v1';

window.n73CheckCatedraNotas = function() {
  var seen = {};
  try { seen = JSON.parse(localStorage.getItem(N73_SEEN_KEY) || '{}'); } catch(e) {}

  var nuevas = CATEDRA_NOTAS.filter(function(n) { return !seen[n.id]; });
  if (!nuevas.length) return;

  /* Mostrar en secuencia con delay */
  nuevas.forEach(function(nota, i) {
    setTimeout(function() { n73ShowNotaToast(nota); }, i * 3500);
  });
};

function n73ShowNotaToast(nota) {
  var colorMap = {
    /* v19.3.1 */ ...NEXUS_NAME_COLORS
  };
  var color = colorMap[nota.materia] || NEXUS_COLORS.materias.home.base /* v19.3.2 */;

  var toast = document.createElement('div');
  toast.className = 'n73-nota-toast';
  toast.style.borderLeftColor = color;
  toast.innerHTML =
    '<div class="n73-nt-header">' +
      '<span class="n73-nt-icon">📢</span>' +
      '<span class="n73-nt-mat" style="color:' + color + '">' + nota.materia + '</span>' +
      '<span class="n73-nt-autor">' + nota.autor + '</span>' +
      '<button class="n73-nt-close" onclick="this.closest(\'.n73-nota-toast\').remove()">✕</button>' +
    '</div>' +
    '<div class="n73-nt-texto">' + nota.texto + '</div>';

  document.body.appendChild(toast);

  /* Marcar como visto */
  try {
    var seen = JSON.parse(localStorage.getItem(N73_SEEN_KEY) || '{}');
    seen[nota.id] = Date.now();
    localStorage.setItem(N73_SEEN_KEY, JSON.stringify(seen));
  } catch(e) {}

  /* Auto-dismiss después de 8s */
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
  }, 8000);
}


var n73TablonUnsubscribe = null;

window.n73OpenTablon = function(materialId, materialTitulo, materia) {
  goto('nexus-tablon', null);
  setTimeout(function() {
    n73RenderTablon(materialId, materialTitulo, materia);
  }, 200);
};

window.n73RenderTablon = function(materialId, titulo, materia) {
  var container = document.getElementById('tablon-content');
  if (!container) return;

  /* Header */
  container.innerHTML =
    '<div class="n73-tablon-header">' +
      '<div class="n73-tb-mat">' + (materia || 'General') + ' · ' + (titulo || 'Material') + '</div>' +
      '<div class="n73-tb-desc">Espacio para dudas anónimas. Tu nombre no aparece. Solo tu pregunta.</div>' +
    '</div>' +
    '<div id="n73-duda-form" class="n73-duda-form">' +
      '<textarea id="n73-duda-input" class="n73-duda-textarea" ' +
        'placeholder="¿Qué no te quedó claro? Escribí tu duda acá…" rows="3"></textarea>' +
      '<button class="n73-duda-btn" onclick="n73PostDuda(\'' + (materialId||'general') + '\',\'' + (titulo||'').replace(/'/g,'') + '\',\'' + (materia||'') + '\')">Publicar duda ↗</button>' +
    '</div>' +
    '<div id="n73-dudas-list" class="n73-dudas-list">' +
      '<div class="n73-loading">Cargando dudas…</div>' +
    '</div>';

  /* Cargar dudas del material desde Firestore */
  if (n73TablonUnsubscribe) { n73TablonUnsubscribe(); n73TablonUnsubscribe = null; }
  if (typeof db === 'undefined') {
    document.getElementById('n73-dudas-list').innerHTML = '<p class="n73-offline">Modo offline — las dudas requieren conexión.</p>';
    return;
  }

  n73TablonUnsubscribe = db.collection('tablon_dudas')
    .where('materialId', '==', materialId || 'general')
    .orderBy('ts', 'desc')
    .limit(20)
    .onSnapshot(function(snap) {
      n73RenderDudasList(snap.docs);
    }, function(err) {
      /* Firestore puede fallar si no hay índice — mostrar estado vacío */
      document.getElementById('n73-dudas-list').innerHTML =
        '<p class="n73-offline">Las dudas estarán disponibles en breve. Publicá la tuya primero.</p>';
    });
};

window.n73PostDuda = function(materialId, titulo, materia) {
  var input = document.getElementById('n73-duda-input');
  if (!input) return;
  var texto = (input.value || '').trim();
  if (!texto) { input.focus(); return; }
  if (texto.length < 10) { input.style.borderColor = 'var(--color-err,#f85149)'; return; }

  if (typeof db === 'undefined') {
    alert('Sin conexión — no se puede publicar.');
    return;
  }

  var btn = document.querySelector('.n73-duda-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Publicando…'; }

  /* Generar respuesta automática del Mentor */
  var autoResp = n73AutoRespuesta(texto, materia);

  db.collection('tablon_dudas').add({
    materialId: materialId || 'general',
    titulo:     titulo || '',
    materia:    materia || '',
    texto:      texto,
    ts:         firebase.firestore.FieldValue.serverTimestamp(),
    /* uid encriptado — anónimo pero trazable para moderación */
    uid_hash:   NEXUS_STATE.fceUsuario ? btoa(NEXUS_STATE.fceUsuario.uid).substring(0, 8) : 'anon',
    respondida: !!autoResp,
    respuesta:  autoResp || null
  }).then(function() {
    input.value = '';
    if (btn) { btn.disabled = false; btn.textContent = 'Publicar duda ↗'; }
  }).catch(function(err) {
    if (btn) { btn.disabled = false; btn.textContent = 'Publicar duda ↗'; }
  });
};

/* Auto-respuesta del Mentor buscando keywords en TIPS_BY_MATERIA */
function n73AutoRespuesta(pregunta, materia) {
  if (!pregunta || typeof TIPS_BY_MATERIA === 'undefined') return null;
  var q = pregunta.toLowerCase();

  var matKey = (materia || '').replace(' I','').replace('Cs. ','').replace('Intro ','').trim();
  var tipSet  = TIPS_BY_MATERIA[matKey] || {};

  var bestMatch = null;
  var bestScore = 0;

  Object.keys(tipSet).forEach(function(term) {
    /* Contar palabras del término que aparecen en la pregunta */
    var words   = term.toLowerCase().split(/\s+/);
    var matches = words.filter(function(w) { return q.indexOf(w) !== -1; }).length;
    var score   = matches / Math.max(1, words.length);
    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestMatch = tipSet[term];
    }
  });

  if (!bestMatch) return null;
  return '🤖 Mentor dice: ' + bestMatch.nota + (bestMatch.ejemplo ? ' Ejemplo: ' + bestMatch.ejemplo : '');
}

function n73RenderDudasList(docs) {
  var list = document.getElementById('n73-dudas-list');
  if (!list) return;

  if (!docs || !docs.length) {
    list.innerHTML = '<p class="n73-empty-dudas">Ninguna duda publicada para este material. ¡Sé el primero!</p>';
    return;
  }

  var html = '';
  docs.forEach(function(doc) {
    var d = doc.data();
    var ts = d.ts ? new Date(d.ts.toMillis()).toLocaleDateString('es-AR', { day:'2-digit', month:'short' }) : '';
    html +=
      '<div class="n73-duda-item' + (d.respondida ? ' n73-duda-respondida' : '') + '">' +
        '<div class="n73-duda-meta">' +
          '<span class="n73-duda-anon">Estudiante #' + (d.uid_hash || 'anon') + '</span>' +
          '<span class="n73-duda-ts">' + ts + '</span>' +
        '</div>' +
        '<p class="n73-duda-texto">' + (d.texto || '') + '</p>' +
        (d.respondida && d.respuesta
          ? '<div class="n73-mentor-resp">' + d.respuesta + '</div>'
          : '') +
      '</div>';
  });

  list.innerHTML = html;
}


var N73_GRUPO_ID = 'FCE2026';

window.n73SyncProgreso = function() {
  if (!NEXUS_STATE.fceUsuario || typeof db === 'undefined') return;

  /* Calcular progreso actual */
  var scores = {};
  try { scores = JSON.parse(localStorage.getItem('fce_portal_scores_v1') || '{}'); } catch(e) {}

  var totalPct = Object.keys(scores).reduce(function(acc, k) {
    return acc + ((scores[k].best && scores[k].best.pct) || 0);
  }, 0);
  var avgPct = Object.keys(scores).length > 0
    ? Math.round(totalPct / Object.keys(scores).length) : 0;

  var leidosCount = Object.keys(NEXUS_STATE.fceLeidos).length;
  var streak = 0;
  try { streak = JSON.parse(localStorage.getItem('nexus6_streak') || '{}').days || 0; } catch(e) {}

  /* Nombre visible: parte del email antes del @ */
  var nombre = NEXUS_STATE.fceUsuario.email ? NEXUS_STATE.fceUsuario.email.split('@')[0] : 'Estudiante';

  db.collection('grupos').doc(N73_GRUPO_ID)
    .collection('miembros').doc(NEXUS_STATE.fceUsuario.uid)
    .set({
      nombre:      nombre,
      leidosCount: leidosCount,
      avgPct:      avgPct,
      streak:      streak,
      updatedAt:   firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .catch(function(err) { /* fail silencioso */ });
};

window.n73RenderPibes = function(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  if (!NEXUS_STATE.fceUsuario || typeof db === 'undefined') {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.innerHTML = '<div class="n73-pibes-loading">Cargando grupo…</div>';

  db.collection('grupos').doc(N73_GRUPO_ID)
    .collection('miembros')
    .orderBy('leidosCount', 'desc')
    .limit(10)
    .get()
    .then(function(snap) {
      if (snap.empty) {
        container.innerHTML = '<div class="n73-pibes-empty">Invitá a tus compañeros al grupo FCE2026.</div>';
        return;
      }

      var myUid = NEXUS_STATE.fceUsuario.uid;
      var html  = '<div class="n73-pibes-title">🏆 Los Pibes — FCE2026</div><div class="n73-pibes-list">';
      var rank  = 1;

      snap.forEach(function(doc) {
        var d    = doc.data();
        var isMe = doc.id === myUid;
        var medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank + '.';
        html +=
          '<div class="n73-pibe-row' + (isMe ? ' n73-pibe-me' : '') + '">' +
            '<span class="n73-pibe-medal">' + medal + '</span>' +
            '<span class="n73-pibe-nombre">' + (d.nombre || 'Estudiante') + (isMe ? ' (vos)' : '') + '</span>' +
            '<span class="n73-pibe-leidos">' + (d.leidosCount || 0) + ' leídos</span>' +
            '<div class="n73-pibe-bar-wrap">' +
              '<div class="n73-pibe-bar" style="width:' + Math.min(100, d.avgPct || 0) + '%"></div>' +
            '</div>' +
            '<span class="n73-pibe-pct">' + (d.avgPct || 0) + '%</span>' +
          '</div>';
        rank++;
      });

      html += '</div>';
      container.innerHTML = html;
    })
    .catch(function() {
      container.innerHTML = '<div class="n73-pibes-empty">El ranking estará disponible cuando más compañeros se unan.</div>';
    });
};


var CASOS_PRACTICOS = [ { id: 'cp-cont-001', materia: 'Contabilidad', titulo: 'Recepción de Factura de Compra', icono: '🧾', escenario: '<strong>Supermercado Ceferino (Trelew)</strong> recibe una <strong>factura B de su proveedor</strong> de papelería por $50.000 + IVA 21% = $60.500 total. Pagará a 30 días. ¿Cuál es la secuencia correcta de registración?', pasos: [ { id: 'p1', texto: 'Verificar que la factura sea válida (CUIT, CAE, fecha)', correcto: true, orden: 1 }, { id: 'p2', texto: 'Registrar en el Libro Diario: Debe Mercaderías + IVA CF / Haber Proveedores', correcto: true, orden: 2 }, { id: 'p3', texto: 'Pasar al Libro Mayor por cuenta afectada', correcto: true, orden: 3 }, { id: 'p4', texto: 'Esperar 30 días y recién ahí registrar el asiento', correcto: false, orden: 0 }, { id: 'p5', texto: 'Registrar el pago cuando vence: Debe Proveedores / Haber Banco', correcto: true, orden: 4 }, ], trampa: 'El error clásico: registrar el IVA CF como gasto. No es gasto — es un Activo (crédito fiscal contra AFIP).', tipo: 'secuencia' }, { id: 'cp-cont-002', materia: 'Contabilidad', titulo: 'Variación Patrimonial: ¿Permutativa o Modificativa?', icono: '⚖', escenario: 'Clasificá cada una de estas operaciones. El parcial SIEMPRE incluye al menos 2 de estas.', pasos: [ { id: 'p1', texto: 'Compra de útiles al contado $5.000', correcto: true, orden: 1, detalle: 'Permutativa — ↑ Útiles ↓ Caja. PN sin cambio.' }, { id: 'p2', texto: 'Cobro de honorarios $20.000', correcto: true, orden: 2, detalle: 'Modificativa positiva — ↑ Caja ↑ PN (ganancia).' }, { id: 'p3', texto: 'Pago de sueldo $30.000', correcto: true, orden: 3, detalle: 'Modificativa negativa — ↓ Caja ↓ PN (pérdida).' }, { id: 'p4', texto: 'Donación recibida en efectivo $10.000', correcto: true, orden: 4, detalle: 'Modificativa positiva — ↑ Caja ↑ PN (ganancia).' }, { id: 'p5', texto: 'Pago de deuda con cheque propio', correcto: true, orden: 5, detalle: 'Permutativa — cambia composición del Pasivo.' }, ], trampa: 'Cuidado: una donación recibida en efectivo es Modificativa (aumenta PN), NO permutativa.', tipo: 'clasificacion' }, { id: 'cp-cont-003', materia: 'Contabilidad', titulo: 'Documentos Comerciales: ¿Cuál genera asiento?', icono: '📋', escenario: '<strong>Frigorífico del Valle</strong> (VIRCH) recibió hoy estos documentos de sus proveedores y clientes. ¿Cuáles generan un asiento en el Libro Diario?', pasos: [ { id: 'p1', texto: 'Orden de Compra recibida del cliente', correcto: false, orden: 0, detalle: 'NO genera asiento. Solo es una intención de compra.' }, { id: 'p2', texto: 'Remito del proveedor', correcto: false, orden: 0, detalle: 'NO genera asiento. Solo acredita la entrega física.' }, { id: 'p3', texto: 'Factura de venta emitida', correcto: true, orden: 1, detalle: 'SÍ. Debe Clientes / Haber Ventas + IVA DF.' }, { id: 'p4', texto: 'Recibo de cobro emitido', correcto: true, orden: 2, detalle: 'SÍ. Debe Caja / Haber Clientes.' }, { id: 'p5', texto: 'Nota de Crédito recibida del proveedor', correcto: true, orden: 3, detalle: 'SÍ. Debe Proveedores / Haber Compras o Mercaderías.' }, ], trampa: 'Orden de Compra y Remito NO generan asiento. Son comprobantes de gestión, no de hecho económico.', tipo: 'seleccion' }, { id: 'cp-adm-001', materia: 'Administración', titulo: 'Funciones Administrativas en Acción', icono: '🏢', escenario: 'El gerente de <strong>TextilAlgoTex S.R.L.</strong> (Parque Industrial de Trelew) detecta que las ventas cayeron 20% en el último trimestre. Ordená las acciones según las 4 funciones de Fayol.', pasos: [ { id: 'p1', texto: 'Analizar informes de ventas y detectar el problema raíz (CONTROL)', correcto: true, orden: 1 }, { id: 'p2', texto: 'Definir objetivos de recuperación y estrategias para el próximo trimestre (PLANIFICACIÓN)', correcto: true, orden: 2 }, { id: 'p3', texto: 'Asignar responsabilidades al equipo comercial (ORGANIZACIÓN)', correcto: true, orden: 3 }, { id: 'p4', texto: 'Motivar al equipo y hacer seguimiento diario (DIRECCIÓN)', correcto: true, orden: 4 }, { id: 'p5', texto: 'Esperar al próximo trimestre para ver si mejoró (PLANIFICACIÓN)', correcto: false, orden: 0 }, ], trampa: 'El control NO es el último paso — es continuo. Y la acción 5 es pasividad disfrazada de planificación.', tipo: 'secuencia' }, { id: 'cp-adm-002', materia: 'Administración', titulo: 'RSE: ¿Carroll o Filantropía?', icono: '🌱', escenario: 'Una empresa del VIRCH dona $500.000 al Hospital de Trelew. El gerente afirma que "eso es RSE". ¿Tiene razón? ¿Cuál de estas afirmaciones es correcta?', pasos: [ { id: 'p1', texto: 'Tiene razón: cualquier donación es RSE por definición', correcto: false, orden: 0, detalle: 'INCORRECTO. La donación aislada es filantropía, no RSE.' }, { id: 'p2', texto: 'Es filantropía si es puntual y no está integrada a la estrategia', correcto: true, orden: 1, detalle: 'CORRECTO. RSE = integración VOLUNTARIA y CONTINUA en la gestión.' }, { id: 'p3', texto: 'Para ser RSE debe abarcar las 4 dimensiones CEMEFI', correcto: true, orden: 2, detalle: 'CORRECTO. Calidad laboral, comunidad, medioambiente, ética.' }, { id: 'p4', texto: 'Freeman diría que la empresa solo debe responder a los accionistas', correcto: false, orden: 0, detalle: 'INCORRECTO. Freeman defiende los stakeholders (todos los grupos de interés).' }, { id: 'p5', texto: 'Carroll diría que primero debe ser económicamente sostenible', correcto: true, orden: 3, detalle: 'CORRECTO. La base de la pirámide de Carroll es la responsabilidad económica.' }, ], trampa: 'Frecuente en el parcial: confundir RSE con filantropía. Son conceptos relacionados pero NO sinónimos.', tipo: 'seleccion' }, { id: 'cp-prop-001', materia: 'Propedéutica', titulo: 'Autonomía Universitaria: ¿Qué implica?', icono: '🏛', escenario: 'El Consejo Superior de la UNPSJB aprueba un nuevo plan de estudios sin consultar al Ministerio de Educación. ¿Cuál de estas afirmaciones justifica correctamente esa decisión?', pasos: [ { id: 'p1', texto: 'Las universidades pueden hacer lo que quieran porque son autónomas', correcto: false, orden: 0, detalle: 'INCORRECTO. La autonomía tiene límites constitucionales y legales.' }, { id: 'p2', texto: 'La autonomía académica permite definir planes de estudio sin intervención estatal directa', correcto: true, orden: 1, detalle: 'CORRECTO. Art. 75 inc. 19 CN garantiza autonomía académica.' }, { id: 'p3', texto: 'El Estatuto UNPSJB es la norma que regula el ejercicio de esa autonomía', correcto: true, orden: 2, detalle: 'CORRECTO. El Estatuto es la norma máxima interna de la universidad.' }, { id: 'p4', texto: 'El cogobierno significa que solo los docentes toman esas decisiones', correcto: false, orden: 0, detalle: 'INCORRECTO. El cogobierno incluye docentes, graduados Y estudiantes.' }, ], trampa: 'Autonomía NO es soberanía total. El Estado financia y acredita — pero no interviene en el gobierno interno.', tipo: 'seleccion' },
];

/* ── Engine de casos prácticos ── */
var NexusCasos = {

  /* Estado de la sesión actual */
  _state: null,

  /* Abrir un caso práctico en un contenedor */
  launch: function(containerId, casoId, materia) {
    var container = document.getElementById(containerId);
    if (!container) return;

    /* Seleccionar caso: por ID o aleatorio por materia */
    var caso = null;
    if (casoId) {
      caso = CASOS_PRACTICOS.find(function(c) { return c.id === casoId; });
    } else {
      var pool = materia
        ? CASOS_PRACTICOS.filter(function(c) { return c.materia === materia || !materia; })
        : CASOS_PRACTICOS;
      caso = pool[Math.floor(Math.random() * pool.length)];
    }
    if (!caso) return;

    NexusCasos._state = { caso: caso, seleccionados: {}, evaluado: false };
    NexusCasos._render(container, caso);
  },

  _render: function(container, caso) {
    var isSeleccion = caso.tipo === 'seleccion' || caso.tipo === 'clasificacion';
    var instruccion = caso.tipo === 'secuencia'
      ? 'Marcá los pasos que son <strong>correctos</strong> y descartá los que no.'
      : 'Seleccioná todas las afirmaciones <strong>correctas</strong>:';

    var html =
      '<div class="nc-caso">' +
        '<div class="nc-caso-header">' +
          '<span class="nc-caso-icon">' + caso.icono + '</span>' +
          '<div>' +
            '<div class="nc-caso-mat">' + caso.materia + '</div>' +
            '<div class="nc-caso-titulo">' + caso.titulo + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="nc-escenario">' + caso.escenario + '</div>' +
        '<div class="nc-instruccion">' + instruccion + '</div>' +
        '<div class="nc-pasos" id="nc-pasos-' + caso.id + '">';

    caso.pasos.forEach(function(paso) {
      html +=
        '<div class="nc-paso" id="nc-p-' + paso.id + '" onclick="NexusCasos._togglePaso(\'' + paso.id + '\')">' +
          '<div class="nc-paso-check"></div>' +
          '<div class="nc-paso-texto">' + paso.texto + '</div>' +
        '</div>';
    });

    html +=
        '</div>' +
        '<button class="nc-eval-btn" onclick="NexusCasos._evaluar(\'' + caso.id + '\',\'' + container.id + '\')">Evaluar respuesta</button>' +
        '<div class="nc-resultado" id="nc-res-' + caso.id + '" style="display:none"></div>' +
      '</div>';

    container.innerHTML = html;
  },

  _togglePaso: function(pasoId) {
    if (!NexusCasos._state || NexusCasos._state.evaluado) return;
    var el = document.getElementById('nc-p-' + pasoId);
    if (!el) return;
    if (NexusCasos._state.seleccionados[pasoId]) {
      delete NexusCasos._state.seleccionados[pasoId];
      el.classList.remove('nc-paso-selected');
    } else {
      NexusCasos._state.seleccionados[pasoId] = true;
      el.classList.add('nc-paso-selected');
    }
  },

  _evaluar: function(casoId, containerId) {
    if (!NexusCasos._state || NexusCasos._state.evaluado) return;
    NexusCasos._state.evaluado = true;

    var caso       = NexusCasos._state.caso;
    var sel        = NexusCasos._state.seleccionados;
    var correctos  = caso.pasos.filter(function(p) { return p.correcto; });
    var incorrectos= caso.pasos.filter(function(p) { return !p.correcto; });

    var aciertos  = 0;
    var errores   = 0;

    /* Marcar pasos */
    caso.pasos.forEach(function(paso) {
      var el = document.getElementById('nc-p-' + paso.id);
      if (!el) return;
      el.style.pointerEvents = 'none';
      var seleccionado = !!sel[paso.id];

      if (paso.correcto && seleccionado)  { el.classList.add('nc-paso-ok');  aciertos++; }
      if (!paso.correcto && seleccionado) { el.classList.add('nc-paso-mal'); errores++; }
      if (paso.correcto && !seleccionado) { el.classList.add('nc-paso-perdido'); }
      /* Mostrar detalle si existe */
      if (paso.detalle) {
        var det = document.createElement('div');
        det.className = 'nc-paso-detalle';
        det.textContent = paso.detalle;
        el.appendChild(det);
      }
    });

    /* Calcular score */
    var total  = correctos.length;
    var pct    = total > 0 ? Math.round(((aciertos - errores) / total) * 100) : 0;
    pct = Math.max(0, pct);

    var resEl = document.getElementById('nc-res-' + casoId);
    if (!resEl) return;

    var msgOk  = pct >= 70;
    resEl.className = 'nc-resultado nc-res-' + (msgOk ? 'ok' : 'low');
    resEl.innerHTML =
      '<div class="nc-res-score">' + pct + '<span>%</span></div>' +
      '<div class="nc-res-msg">' +
        (msgOk ? '¡Muy bien! Dominás el caso. 🎯' : 'Repasá la teoría detrás de cada paso. 📚') +
      '</div>' +
      '<div class="nc-res-trampa"><strong>⚠ Error frecuente en el parcial:</strong> ' + caso.trampa + '</div>';
    resEl.style.display = 'block';

    /* Emitir evento */
    if (typeof NexusMemoryAPI !== 'undefined') {
      NexusMemoryAPI.emit('caso:evaluated', { casoId: casoId, pct: pct, materia: caso.materia });
    }
  },

  /* Inyectar botón de caso práctico en el well después de una sección de teoría */
  injectLauncher: function(wellEl, item) {
    if (!wellEl || !item) return;
    var materia = item.materia || '';
    /* Solo para Resúmenes de Contabilidad y Administración */
    if (item.tipo !== 'Resumen') return;
    if (materia.indexOf('Contabilidad') === -1 && materia.indexOf('Administración') === -1 && materia.indexOf('Propedéutica') === -1) return;

    /* Buscar casos disponibles para esta materia */
    var pool = CASOS_PRACTICOS.filter(function(c) { return c.materia === materia || c.materia === materia.replace(' I',''); });
    if (!pool.length) return;
    if (wellEl.querySelector('.nc-launcher')) return;

    var cid = 'nc-inline-' + item.id;

    var launcher = document.createElement('div');
    launcher.className = 'nc-launcher';
    launcher.innerHTML =
      '<div class="nc-launcher-header" onclick="NexusCasos.launch(\'' + cid + '\',null,\'' + materia + '\')">' +
        '<span class="nc-launcher-icon">⚡</span>' +
        '<div>' +
          '<div class="nc-launcher-title">Caso Práctico — ' + materia + '</div>' +
          '<div class="nc-launcher-sub">Probá si podés aplicar lo que leíste</div>' +
        '</div>' +
        '<button class="nc-launcher-btn">Empezar →</button>' +
      '</div>' +
      '<div id="' + cid + '"></div>';

    wellEl.appendChild(launcher);
  }
};


/* ── NexusExamen MIGRADO A nexus-exam.js (fase 6) ──────────────────────
   El simulador de examen final (25 min / 20 preguntas) vive en nexus-exam.js.
   Orden de carga: nexus-quiz.js → nexus-fetch.js → nexus-exam.js → nexus-modules.js
   ─────────────────────────────────────────────────────────────────────── */

var N75Hydration = {

  /* Páginas buildeadas — evitar re-build innecesario */
  _built: {},
  /* Páginas de materiales (con data-mat-dynamic) */
  MAT_IDS: ['prop-materiales','cont-materiales','adm-materiales','soc-materiales'],
  /* Cuántas páginas mantener en memoria simultáneamente */
  KEEP_ALIVE: 2,
  /* Historial de navegación para dehydrate LRU */
  _history: [],

  /* Llamado desde goto() al activar una página */
  onActivate: function(pageId) {
    if (!NexusCore.getMateriales()) return;   /* datos no listos aún */

    /* Registrar en historial */
    N75Hydration._history = N75Hydration._history.filter(function(p) { return p !== pageId; });
    N75Hydration._history.push(pageId);

    /* Buildear si es una página de materiales y no estaba buildeada */
    if (N75Hydration.MAT_IDS.indexOf(pageId) !== -1) {
      if (!N75Hydration._built[pageId]) {
        if (typeof _buildPage === 'function') {
          _buildPage(pageId);
          N75Hydration._built[pageId] = true;
        }
      }
    }

    /* Dehydrate páginas más antiguas si superamos KEEP_ALIVE */
    var matHistory = N75Hydration._history.filter(function(p) {
      return N75Hydration.MAT_IDS.indexOf(p) !== -1;
    });

    while (matHistory.length > N75Hydration.KEEP_ALIVE) {
      var oldest = matHistory.shift();
      N75Hydration._dehydrate(oldest);
    }
  },

  /* Liberar el DOM de una página inactiva */
  _dehydrate: function(pageId) {
    if (!pageId) return;
    var page = document.getElementById(pageId);
    if (!page) return;
    var host = page.querySelector('[data-mat-dynamic]');
    if (!host) return;

    /* Solo dehydratar si no está activa */
    if (page.classList.contains('active')) return;

    /* Guardar un placeholder — el usuario ve un skeleton si vuelve */
    host.innerHTML =
      '<div class="n75-dehydrated">' +
        '<div class="skeleton-line w80"></div>' +
        '<div class="skeleton-line w60"></div>' +
        '<div class="skeleton-line w90"></div>' +
      '</div>';

    /* Marcar como no buildeada para que se re-buildee al volver */
    delete N75Hydration._built[pageId];
  },

  /* Forzar dehydration total (para liberar memoria en emergencia) */
  flush: function() {
    N75Hydration.MAT_IDS.forEach(function(pid) {
      N75Hydration._dehydrate(pid);
    });
    N75Hydration._built = {};
    N75Hydration._history = [];
  },

  /* Reportar uso de memoria estimado */
  report: function() {
    var built = Object.keys(N75Hydration._built).length;
    var totalCards = N75Hydration.MAT_IDS.reduce(function(acc, pid) {
      var host = document.getElementById(pid);
      if (!host) return acc;
      return acc + host.querySelectorAll('.mat-card').length;
    }, 0);
    return {
      builtPages: built,
      totalCards: totalCards,
      history: N75Hydration._history.slice()
    };
  }
};

window.N75Hydration = N75Hydration;


var N75Legajo = {

  /* Recolectar todos los datos del alumno */
  collect: function() {
    var keys = [
      'nexus_leidos_v1',
      'fce_portal_scores_v1',
      'nexus68_dificultad_v1',
      'nexus71_answers_v1',
      'nexus71_repaso_v1',
      'nexus6_streak',
      'cne_mastery',
      'fce_clf_best_v1',
      'fce_portal_checkboxes_v1',
      'nexus73_seen_notas_v1',
      'nexus70_repaso_v1',
      'nexus68_session_v1',
      'nexus68_tiempo_v1',
    ];

    var legajo = {
      version: '7.5',
      exportedAt: new Date().toISOString(),
      portal: 'NEXUS FCE UNPSJB — Ciclo 2026',
      data: {}
    };

    keys.forEach(function(key) {
      try {
        var raw = localStorage.getItem(key);
        legajo.data[key] = raw ? JSON.parse(raw) : null;
      } catch(e) {
        legajo.data[key] = null;
      }
    });

    /* Agregar resumen estadístico */
    legajo.resumen = N75Legajo._buildResumen(legajo.data);
    return legajo;
  },

  _buildResumen: function(d) {
    var leidos   = Object.keys(d['nexus_leidos_v1'] || {}).length;
    var scores   = d['fce_portal_scores_v1'] || {};
    var quizCount= Object.keys(scores).length;
    var quizAvg  = quizCount > 0
      ? Math.round(Object.keys(scores).reduce(function(a,k) {
          return a + (scores[k].best && scores[k].best.pct || 0);
        }, 0) / quizCount)
      : 0;
    var difCount = Object.keys(d['nexus68_dificultad_v1'] || {}).length;
    var answers  = Object.keys(d['nexus71_answers_v1'] || {}).length;
    var streak   = (d['nexus6_streak'] || {}).days || 0;
    var tiempos  = d['nexus68_tiempo_v1'] || {};
    var totalMin = Math.round(Object.values(tiempos).reduce(function(a,b){return a+b;},0) / 60);

    return {
      materialesLeidos: leidos,
      quizzesCompletados: quizCount,
      promedioQuizzes: quizAvg + '%',
      conceptosFlojos: difCount,
      respuestasGuardadas: answers,
      rachaActual: streak + ' días',
      tiempoTotalEstudio: totalMin + ' minutos'
    };
  },

  /* Descargar como JSON */
  downloadJSON: function() {
    try {
      var legajo = N75Legajo.collect();
      var json   = JSON.stringify(legajo, null, 2);
      var blob   = new Blob([json], { type: 'application/json' });
      var url    = URL.createObjectURL(blob);
      var a      = document.createElement('a');
      a.href     = url;
      a.download = 'Legajo_FCE_NEXUS_' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
      return true;
    } catch(e) {
      return false;
    }
  },

  /* Descargar como HTML de resumen visual */
  downloadHTML: function() {
    try {
      var legajo = N75Legajo.collect();
      var r      = legajo.resumen;
      var scores = legajo.data['fce_portal_scores_v1'] || {};
      var answers= legajo.data['nexus71_answers_v1']  || {};

      /* Score breakdown por quiz */
      var scoresHTML = Object.keys(scores).map(function(k) {
        var s = scores[k];
        var pct = s.best ? s.best.pct : (s.last ? s.last.pct : 0);
        return '<tr><td>' + k.replace(/_/g,' ') + '</td>' +
               '<td><div style="height:8px;background:#eee;border-radius:4px;overflow:hidden">' +
               '<div style="height:100%;width:' + pct + '%;background:' + (pct>=80?'var(--color-ok,#3fb950)':pct>=60?'var(--color-warn,#e3b341)':'var(--color-err,#f85149)') + '"></div></div></td>' +
               '<td style="text-align:right;font-weight:700">' + pct + '%</td></tr>';
      }).join('');

      /* Respuestas guardadas */
      var answersHTML = Object.keys(answers).slice(0, 10).map(function(k) {
        var a = answers[k];
        return '<div style="margin-bottom:12pt;border-left:3pt solid #1e3a8a;padding-left:8pt">' +
               '<div style="font-size:9pt;font-weight:700;color:#1e3a8a;margin-bottom:3pt">' + (a.termino || k) + '</div>' +
               '<div style="font-size:9.5pt;font-family:Georgia,serif;color:#222;line-height:1.5">' + (a.respuesta || '') + '</div>' +
               '<div style="font-size:7.5pt;color:#888;margin-top:2pt">Precisión: ' + (a.pct||0) + '% — ' + (a.materia||'') + '</div>' +
               '</div>';
      }).join('');

      var html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
        '<title>Legajo de Estudio — FCE NEXUS</title>' +
        '<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#111;font-size:10.5pt;line-height:1.5}' +
        'h1{font-size:22pt;color:#1e3a8a;border-bottom:2pt solid #1e3a8a;padding-bottom:8pt}' +
        'h2{font-size:14pt;color:#1e3a8a;margin-top:24pt}' +
        '.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14pt;margin:16pt 0}' +
        '.stat-card{border:1pt solid #ddd;border-radius:6pt;padding:12pt;text-align:center}' +
        '.stat-val{font-size:24pt;font-weight:700;color:#1e3a8a;display:block}' +
        '.stat-lbl{font-size:8pt;text-transform:uppercase;letter-spacing:.06em;color:#888}' +
        'table{width:100%;border-collapse:collapse;font-size:9.5pt}' +
        'th{background:#f0f0f0;padding:6pt 8pt;text-align:left;font-size:8.5pt}' +
        'td{padding:5pt 8pt;border-bottom:0.5pt solid #eee}' +
        '@media print{body{margin:20px}}</style></head><body>' +
        '<h1>📘 Legajo de Estudio — FCE NEXUS</h1>' +
        '<p style="color:#888;font-size:9pt">Exportado el ' + new Date().toLocaleDateString('es-AR', {day:'2-digit',month:'long',year:'numeric'}) +
        ' · Portal: ' + legajo.portal + '</p>' +

        '<h2>Resumen de Actividad</h2>' +
        '<div class="stat-grid">' +
          N75Legajo._statCard(r.materialesLeidos, 'Materiales Leídos') +
          N75Legajo._statCard(r.quizzesCompletados, 'Quizzes Hechos') +
          N75Legajo._statCard(r.promedioQuizzes, 'Promedio Quiz') +
          N75Legajo._statCard(r.conceptosFlojos, 'Conceptos Flojos') +
          N75Legajo._statCard(r.rachaActual, 'Racha Actual') +
          N75Legajo._statCard(r.tiempoTotalEstudio, 'Tiempo Estudiado') +
        '</div>' +

        (scoresHTML ? '<h2>Desempeño por Quiz</h2><table><thead><tr><th>Quiz</th><th>Progreso</th><th>%</th></tr></thead><tbody>' + scoresHTML + '</tbody></table>' : '') +

        (answersHTML ? '<h2>Mis Mejores Respuestas (Autoevaluación)</h2>' + answersHTML : '') +

        '<p style="margin-top:32pt;font-size:8pt;color:#aaa;border-top:0.5pt solid #ddd;padding-top:8pt">' +
        'NEXUS v7.5 "The Neural Bridge" · FCE UNPSJB · Ciclo Inicial 2026 · Visión Patagonia</p>' +
        '</body></html>';

      var blob = new Blob([html], { type: 'text/html' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href   = url;
      a.download = 'Legajo_FCE_NEXUS_' + new Date().toISOString().split('T')[0] + '.html';
      a.click();
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
      return true;
    } catch(e) {
      return false;
    }
  },

  _statCard: function(val, lbl) {
    return '<div class="stat-card"><span class="stat-val">' + val + '</span><span class="stat-lbl">' + lbl + '</span></div>';
  },

  /* Importar legajo previamente exportado */
  importJSON: function(jsonStr) {
    try {
      var legajo = JSON.parse(jsonStr);
      if (!legajo.data || !legajo.version) throw new Error('Formato inválido');
      var imported = 0;
      Object.keys(legajo.data).forEach(function(key) {
        if (legajo.data[key] !== null) {
          localStorage.setItem(key, JSON.stringify(legajo.data[key]));
          imported++;
        }
      });
      return { ok: true, imported: imported };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  }
};

window.N75Legajo = N75Legajo;


(function() {
  if (typeof NexusMemoryAPI === 'undefined') return;

  /* ── Socket 1: naturalLanguageQuery ──────────────────────────
     v8.0 conectará aquí una IA de lenguaje natural (Claude API)
     para responder dudas sobre Economía, Contabilidad, etc.
     Uso: NexusMemoryAPI.naturalLanguageQuery("¿Qué es la inflación?", context)
  ── */
  NexusMemoryAPI.naturalLanguageQuery = function(query, context) {
    /* SOCKET v8.0: reemplazar con llamada a API de IA */
    /* context: { materia, pageId, recentItems[] } */
    return Promise.resolve({
      answered: false,
      response: null,
      socketReady: false,
      hint: 'Socket v8.0 pendiente. Integrá la API en NexusMemoryAPI.naturalLanguageQuery.'
    });
  };

  /* ── Socket 2: predictiveReinforcement ───────────────────────
     v8.0 analizará el patrón de errores del alumno y sugerirá
     qué estudiar antes de cada sesión.
     Uso: NexusMemoryAPI.predictiveReinforcement(alumnoData)
  ── */
  NexusMemoryAPI.predictiveReinforcement = function(alumnoData) {
    /* SOCKET v8.0: modelo predictivo de espaciado óptimo */
    /* alumnoData: { scores, leidos, dificultades, tiempos } */
    /* Por defecto: usar n72SuggestRepaso (heurística) */
    var sugeridos = typeof n72SuggestRepaso === 'function' ? n72SuggestRepaso() : [];
    return Promise.resolve({
      recommended: sugeridos.map(function(i) { return i.id; }),
      algorithm: 'heuristic_7d',
      socketReady: false,
      hint: 'Socket v8.0 pendiente. Reemplazar con modelo de espaciado adaptativo.'
    });
  };

  /* ── Socket 3: contextualExplain ─────────────────────────────
     v8.0 generará explicaciones dinámicas de cualquier concepto
     en el contexto específico de la cátedra (RT, Normas AFIP, etc.)
     Uso: NexusMemoryAPI.contextualExplain(term, materia, cuerpoTexto)
  ── */
  NexusMemoryAPI.contextualExplain = function(term, materia, cuerpoTexto) {
    /* SOCKET v8.0: Claude API con contexto del materiales.json */
    /* Fallback mientras tanto: buscar en TIPS_BY_MATERIA */
    var matKey  = (materia || '').replace(' I','').replace('Cs. ','').trim();
    var tipSet  = typeof TIPS_BY_MATERIA !== 'undefined' ? (TIPS_BY_MATERIA[matKey] || {}) : {};
    var termLow = (term || '').toLowerCase();
    var found   = null;

    Object.keys(tipSet).forEach(function(k) {
      if (termLow.indexOf(k) !== -1 || k.indexOf(termLow) !== -1) {
        found = tipSet[k];
      }
    });

    return Promise.resolve({
      term:     term,
      materia:  materia,
      response: found ? found.nota : null,
      source:   found ? 'TIPS_BY_MATERIA' : null,
      socketReady: false,
      hint: 'Socket v8.0 pendiente. Reemplazar con NLP contextual sobre materiales.json.'
    });
  };

  /* ── Nuevo evento v7.5 ── */
  NexusMemoryAPI.on('hydration:dehydrated', function(data) {
    /* v8.0 puede usar esto para trackear qué páginas están en memoria */
  });

  /* ── Documentación inline para v8.0 ── */
  NexusMemoryAPI._v8_guide = {
    version: '7.5',
    ready_sockets: ['naturalLanguageQuery', 'predictiveReinforcement', 'contextualExplain'],
    events: ['card:open', 'quiz:end', 'evaluator:answered', 'caso:evaluated', 'examen:done'],
    data_keys: [
      'nexus_leidos_v1',      /* materiales leídos con timestamp */
      'fce_portal_scores_v1', /* scores de todos los quizzes */
      'nexus68_dificultad_v1',/* conceptos marcados como difíciles */
      'nexus71_answers_v1',   /* respuestas de autoevaluación ≥70% */
      'nexus68_tiempo_v1',    /* tiempo real por unidad (segundos) */
    ],
    integration_note: 'Para v8.0: reemplazar los 3 sockets con llamadas a api.anthropic.com/v1/messages. El contexto necesario está en NexusCore.getMateriales() + localStorage.'
  };

  console.log('[NexusMemoryAPI] v7.5 — 3 sockets v8.0 listos. Ver NexusMemoryAPI._v8_guide.');
})();


window.n75OpenLegajo = function() {
  var modal = document.getElementById('n75-legajo-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  /* Renderizar stats */
  /* v9.0 */ if(typeof NexusRadarV2!=='undefined') setTimeout(function(){NexusRadarV2.render('n89-curva-container');},200);
  var statsEl = document.getElementById('n75-legajo-stats');
  if (!statsEl) return;
  try {
    var legajo = N75Legajo.collect();
    var r = legajo.resumen;
    statsEl.innerHTML =
      '<div class="n75-stats-grid">' +
        n75StatItem('📚', r.materialesLeidos, 'Materiales leídos') +
        n75StatItem('🎯', r.promedioQuizzes, 'Promedio quiz') +
        n75StatItem('⏱', r.tiempoTotalEstudio, 'Tiempo total') +
        n75StatItem('🔴', r.conceptosFlojos, 'Conceptos flojos') +
        n75StatItem('🗓', r.rachaActual, 'Racha') +
        n75StatItem('✍', r.respuestasGuardadas, 'Respuestas guardadas') +
      '</div>';
  } catch(e) {
    if (statsEl) statsEl.innerHTML = '<p style="color:rgba(255,255,255,.4);font-size:.8rem">No hay datos suficientes aún.</p>';
  }
};

function n75StatItem(icon, val, lbl) {
  return '<div class="n75-stat-item">' +
    '<span class="n75-stat-icon">' + icon + '</span>' +
    '<span class="n75-stat-val">' + val + '</span>' +
    '<span class="n75-stat-lbl">' + lbl + '</span>' +
  '</div>';
}

window.n75ImportLegajo = function(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var result = N75Legajo.importJSON(e.target.result);
    if (result.ok) {
      alert('✅ Legajo importado: ' + result.imported + ' entradas restauradas. Recargá la página.');
    } else {
      alert('❌ Error al importar: ' + result.error);
    }
  };
  reader.readAsText(file);
};

var N76Urgency = {

  THRESHOLD_MS: 30000,   /* 30 segundos */
  _watchers: [],         /* lista de { el, timerId, wellEl, item } */

  /* Inyectar watchers en cada párrafo del well */
  watch: function(wellEl, item) {
    if (!wellEl || !item || item.tipo !== 'Resumen') return;

    var paras = wellEl.querySelectorAll('p');
    paras.forEach(function(p, idx) {
      if (p.dataset.urgencyWatched) return;
      p.dataset.urgencyWatched = '1';

      /* Solo párrafos con suficiente contenido */
      if ((p.textContent || '').trim().length < 100) return;

      var timerId = null;

      /* IntersectionObserver para saber si está visible */
      if (!('IntersectionObserver' in window)) return;

      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            /* Visible — iniciar contador de 30s */
            timerId = setTimeout(function() {
              N76Urgency._triggerPulse(p, item, idx);
            }, N76Urgency.THRESHOLD_MS);
          } else {
            /* Salió del viewport — cancelar */
            if (timerId) { clearTimeout(timerId); timerId = null; }
            /* Limpiar pulso si existía */
            N76Urgency._clearPulse(p);
          }
        });
      }, { threshold: 0.6 });   /* 60% visible */

      obs.observe(p);

      /* Interacción cancela el contador */
      ['click','keydown','touchstart','mousemove'].forEach(function(ev) {
        p.addEventListener(ev, function() {
          if (timerId) { clearTimeout(timerId); timerId = null; }
          N76Urgency._clearPulse(p);
        }, { passive: true, once: false });
      });

      N76Urgency._watchers.push({ el: p, obs: obs });
    });
  },

  /* Disparar el pulso visual + oferta de síntesis */
  _triggerPulse: function(p, item, idx) {
    if (p.querySelector('.n76-pulse-wrap')) return;  /* ya activo */

    /* Agregar clase de pulso al párrafo */
    p.classList.add('n76-urgency-pulse');

    /* Buscar síntesis en TIPS_BY_MATERIA */
    var matKey  = (item.materia || '').replace(' I','').replace('Cs. ','').trim();
    var tipSet  = typeof TIPS_BY_MATERIA !== 'undefined' ? (TIPS_BY_MATERIA[matKey] || {}) : {};
    var text    = (p.textContent || '').toLowerCase();
    var sintesis = null;

    Object.keys(tipSet).forEach(function(term) {
      if (!sintesis && text.indexOf(term) !== -1) {
        sintesis = tipSet[term].nota || null;
      }
    });

    /* Si no hay síntesis, generar una desde las primeras palabras del párrafo */
    if (!sintesis) {
      var words = (p.textContent || '').trim().split(/\s+/).slice(0, 20).join(' ');
      sintesis  = '📌 Concepto clave: ' + words + (words.length < p.textContent.trim().length ? '…' : '');
    }

    /* Inyectar el widget de síntesis */
    var wrap = document.createElement('div');
    wrap.className = 'n76-pulse-wrap';
    wrap.innerHTML =
      '<div class="n76-pulse-header">' +
        '<span class="n76-pulse-icon">🧠</span>' +
        '<span class="n76-pulse-label">Mentor: ¿Necesitás una síntesis?</span>' +
        '<button class="n76-pulse-dismiss" onclick="N76Urgency._clearPulse(this.closest(\'p\'))">✕</button>' +
      '</div>' +
      '<div class="n76-pulse-sintesis">' + sintesis + '</div>' +
      '<div class="n76-pulse-actions">' +
        '<button class="n76-pulse-ok" onclick="N76Urgency._clearPulse(this.closest(\'p\'))">Entendido ✓</button>' +
      '</div>';

    p.appendChild(wrap);

    /* Auto-dismiss a los 12s si no hay interacción */
    setTimeout(function() { N76Urgency._clearPulse(p); }, 12000);
  },

  _clearPulse: function(p) {
    if (!p) return;
    p.classList.remove('n76-urgency-pulse');
    var wrap = p.querySelector('.n76-pulse-wrap');
    if (wrap) wrap.remove();
  },

  /* Limpiar todos los watchers al cambiar de página */
  reset: function() {
    N76Urgency._watchers.forEach(function(w) {
      try { w.obs.disconnect(); } catch(e) {}
    });
    N76Urgency._watchers = [];
    document.querySelectorAll('.n76-urgency-pulse').forEach(function(p) {
      N76Urgency._clearPulse(p);
    });
  }
};

window.N76Urgency = N76Urgency;

var N77SmartBlanks = {

  /* Extraer términos fallados de los bancos de preguntas.
     Usa fce_portal_scores_v1 para identificar quizzes con score <70%
     y fce_portal_checkboxes_v1 para respuestas incorrectas específicas. */
  getFailedTerms: function(materia) {
    var failedTerms = [];

    /* 1. Leer scores de quizzes */
    var scores = {};
    try { scores = JSON.parse(localStorage.getItem('fce_portal_scores_v1') || '{}'); }
    catch(e) {}

    /* 2. Identificar quizzes fallados para esta materia */
    var failedQuizKeys = Object.keys(scores).filter(function(key) {
      var s   = scores[key];
      var pct = s.best ? s.best.pct : (s.last ? s.last.pct : 100);
      return pct < 70;
    });

    /* 3. Extraer términos de las preguntas de esos quizzes */
    failedQuizKeys.forEach(function(key) {
      var bank = N77SmartBlanks._getBankForKey(key, materia);
      if (!bank || !bank.length) return;

      bank.forEach(function(q) {
        /* Extraer palabras clave del texto de la pregunta */
        var qText = (q.q || q.pregunta || '').toLowerCase();
        /* Extraer los nombres propios y términos técnicos (mayúscula o después de ":") */
        var terms = N77SmartBlanks._extractTermsFromQuestion(q.q || q.pregunta || '');
        failedTerms = failedTerms.concat(terms);
      });
    });

    /* 4. También agregar conceptos marcados como difíciles (n68) */
    var diffs = {};
    try { diffs = JSON.parse(localStorage.getItem('nexus68_dificultad_v1') || '{}'); }
    catch(e) {}
    Object.keys(diffs).forEach(function(k) {
      var d = diffs[k];
      if (!d || !d.texto) return;
      /* Solo si es de la misma materia */
      var matchMat = !materia ||
        (d.materia && d.materia.indexOf(materia.split(' ')[0]) !== -1);
      if (matchMat) {
        var terms = N77SmartBlanks._extractTermsFromQuestion(d.texto);
        failedTerms = failedTerms.concat(terms);
      }
    });

    /* Deduplicar y filtrar ruido */
    var unique = [];
    failedTerms.forEach(function(t) {
      var tl = t.toLowerCase().trim();
      if (tl.length > 3 && unique.indexOf(tl) === -1) unique.push(tl);
    });

    return unique;
  },

  /* Extraer términos técnicos de un texto de pregunta */
  _extractTermsFromQuestion: function(text) {
    if (!text) return [];
    var terms = [];

    /* Palabras después de comillas */
    var quoted = text.match(/"([^"]+)"|"([^"]+)"/g) || [];
    quoted.forEach(function(q) { terms.push(q.replace(/["""]/g, '').trim()); });

    /* Palabras con mayúscula inicial que no son inicio de oración */
    var words = text.split(/\s+/);
    words.forEach(function(w, i) {
      if (i > 0 && w.length > 4 && /^[A-ZÁÉÍÓÚÑ]/.test(w)) {
        terms.push(w.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim());
      }
    });

    /* Términos después de "la", "el", "los", "las" + palabra técnica */
    var matches = text.match(/(?:la|el|los|las)\s+([A-Za-záéíóúÁÉÍÓÚñÑ]{5,})/gi) || [];
    matches.forEach(function(m) {
      var t = m.replace(/^(?:la|el|los|las)\s+/i, '').trim();
      if (t.length > 4) terms.push(t);
    });

    return terms.filter(function(t) { return t.length > 3; });
  },

  /* Obtener banco de preguntas por key de score */
  _getBankForKey: function(key, materia) {
    var k = key.toLowerCase();
    if (k.indexOf('adm') !== -1 || (materia && materia.indexOf('Adm') !== -1)) {
      return typeof bancoDePreguntas !== 'undefined' ? (bancoDePreguntas.adm || []) : [];
    }
    if (k.indexOf('soc') !== -1 || (materia && materia.indexOf('Soc') !== -1)) {
      var bank = [];
      if (typeof sqData !== 'undefined')  bank = bank.concat(sqData);
      if (typeof sq2Data !== 'undefined') bank = bank.concat(sq2Data);
      if (typeof quizU3  !== 'undefined') bank = bank.concat(quizU3);
      return bank;
    }
    if (k.indexOf('prop') !== -1 || (materia && materia.indexOf('Prop') !== -1)) {
      return typeof propQuestions !== 'undefined' ? propQuestions : [];
    }
    /* Contabilidad u otros */
    return typeof bancoDePreguntas !== 'undefined' ? (bancoDePreguntas.cont || []) : [];
  },

  /* Marcar strongs como .smart-blank si coinciden con términos fallados.
     Retorna el número de blancos marcados. */
  applySmartBlanks: function(htmlString, materia, rateOverride) {
    if (!htmlString) return { html: htmlString, count: 0, failedTerms: [] };

    var failedTerms = N77SmartBlanks.getFailedTerms(materia);
    var rate = rateOverride || 0.15;   /* fallback al RATE del nivel */
    var count = 0;

    /* Si hay términos fallados, marcar los strongs que los contienen PRIMERO */
    var prioritized = [];
    var others      = [];

    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    var strongs = tempDiv.querySelectorAll('strong:not(.print-blank)');
    strongs.forEach(function(s) {
      var txt = (s.textContent || '').toLowerCase().trim();
      var isFailed = failedTerms.some(function(term) {
        return txt.indexOf(term) !== -1 || term.indexOf(txt) !== -1;
      });
      if (isFailed) prioritized.push(s);
      else          others.push(s);
    });

    /* Calcular cuántos blancos poner en total */
    var total      = strongs.length;
    var totalBlanks= Math.max(
      prioritized.length,           /* mínimo: todos los fallados */
      Math.ceil(total * rate)        /* o el porcentaje del nivel */
    );
    totalBlanks = Math.min(totalBlanks, total);

    /* Aplicar: primero los prioritarios, luego aleatorios del resto */
    var toBlank = prioritized.slice();
    var shuffledOthers = others.sort(function() { return Math.random() - .5; });
    var remaining = totalBlanks - toBlank.length;
    if (remaining > 0) {
      toBlank = toBlank.concat(shuffledOthers.slice(0, remaining));
    }

    toBlank.forEach(function(s) {
      s.classList.add('smart-blank');
      count++;
    });

    return {
      html:        tempDiv.innerHTML,
      count:       count,
      total:       total,
      failedTerms: failedTerms.slice(0, 10)
    };
  }
};

window.N77SmartBlanks = N77SmartBlanks;

var VIRCH_CONTEXT ={/* ── Empresas y organizaciones reales del VIRCH ── */ empresas:{Contabilidad:[{nombre:'Supermercado Ceferino (Trelew)',rubro:'comercio minorista de alimentos',cuit:'tipo 30-XXXXXXXX-X',operacion:'compra de mercaderías a un distribuidor de Buenos Aires'},{nombre:'Estudio Contable Zavaleta & Asociados',rubro:'servicios profesionales contables',cuit:'tipo 30-XXXXXXXX-X',operacion:'facturación mensual de honorarios a clientes PyME'},{nombre:'Frigorífico del Valle S.A.',rubro:'faena y procesamiento de ganado ovino/bovino',cuit:'tipo 30-XXXXXXXX-X',operacion:'venta de media res a carnicerías del VIRCH'},{nombre:'Panadería Don Ángel (Gaiman)',rubro:'producción y venta de panadería artesanal',cuit:'tipo 23-XXXXXXXX-X',operacion:'compra de harina y materias primas a granel'},{nombre:'Ferretería El Ingeniero (Trelew)',rubro:'venta de materiales de construcción y ferretería',cuit:'tipo 30-XXXXXXXX-X',operacion:'cobro de cuenta corriente a cliente de la construcción'},],Administración:[{nombre:'COOPELECTRIC (Cooperativa Eléctrica de Trelew)',rubro:'distribución eléctrica y servicios',tipo:'cooperativa',contexto:'ejemplo de organización sin fines de lucro con cogobierno'},{nombre:'Municipalidad de Trelew',rubro:'administración pública municipal',tipo:'organismo público',contexto:'caso de administración burocrática con estructura formal'},{nombre:'Inversiones Patagonia (Visión Patagonia)',rubro:'asesoramiento financiero independiente',tipo:'PyME de servicios',contexto:'caso de microempresa con estructura simple y RSE local'},{nombre:'Textil AlgoTex S.R.L. (Parque Industrial Trelew)',rubro:'manufactura textil',tipo:'industria',contexto:'empresa del parque industrial — ejemplo de sistema abierto'},{nombre:'Clínica San José (Trelew)',rubro:'salud privada',tipo:'sociedad anónima',contexto:'organización compleja con múltiples stakeholders'},{nombre:'Agropecuaria El Toro Negro S.A. (Gaiman)',rubro:'producción agrícola y ganadera en el VIRCH',tipo:'empresa agropecuaria',contexto:'empresa familiar con expansión reciente y desafíos de dirección'},],},/* ── Situaciones típicas del VIRCH ── */ situaciones:['un pequeño almacén de barrio en la 25 de Mayo','una distribuidora de combustibles en la Ruta 3','un estudio jurídico-contable del microcentro de Trelew','una empresa de servicios turísticos que trabaja con el Puerto Madryn','una cooperativa agrícola del valle del río Chubut','un comercio textil del Parque Industrial de Trelew','una clínica privada de Rawson','un productor ovino de la meseta chubutense',],/* ── Vocabulario regional validado ── Argentino rioplatense patagónico — sin exageraciones ── */ vocab:{/* Formas de abrir un tip */ aperturas:['Ojo con esto,che:','Fijate bien:','Mirá,te lo digo en criollo:','Dale,prestá atención:','Acá está el tema:','No te la hagas difícil:','Esto es lo que te van a preguntar:','Te tiro una data:','Che,importantísimo:','No te olvides de esto:',],/* Validaciones positivas */ aprobacion:['¡Genial,lo tenés clarísimo!','¡Eso es,lince!','¡Muy bien! Eso no te lo saca nadie.','¡Exacto,copado! El profe te pondría un 10.','¡La rompiste! Dominás el concepto.','¡Ahí está! Lo clavaste.',],/* Correcciones amigables */ correccion:['Casi,pero fijate que...','Vas bien,pero le falta un matiz:','Por ahí vas,pero hay que ajustar:','Dale una vuelta más a esto:','No estás tan lejos,pero...',],/* Referencias geográficas en ejemplos */ geoRef:['en el VIRCH','acá en Trelew','en la zona del valle','en cualquier empresa chubutense','en el Parque Industrial de Trelew','en una PyME de la Patagonia',],},};

window.VIRCH_CONTEXT = VIRCH_CONTEXT;


var N78Regional = {

  /* Reemplazar empresa genérica por empresa VIRCH en un texto */
  injectEmpresa: function(text, materia) {
    if (!text) return text;
    var mat    = (materia || '').split(' ')[0];
    var pool   = VIRCH_CONTEXT.empresas[mat] || VIRCH_CONTEXT.empresas['Contabilidad'];
    var emp    = pool[Math.floor(Math.random() * pool.length)];
    if (!emp) return text;

    /* Reemplazar términos genéricos */
    return text
      .replace(/\btu cliente PyME\b/gi,           emp.nombre)
      .replace(/\buna empresa patagónica\b/gi,     emp.nombre)
      .replace(/\bla empresa\b/gi,                 emp.nombre)
      .replace(/\bun cliente\b/gi,                 emp.nombre)
      .replace(/\bInversiones Patagonia\b/g,       emp.nombre)
      .replace(/\bla organización\b/gi,            emp.nombre);
  },

  /* Enriquecer un ejemplo genérico con contexto regional */
  enrichEjemplo: function(ejemplo, materia) {
    if (!ejemplo || ejemplo.length < 10) return ejemplo;

    /* Si ya tiene referencia regional, no tocar */
    var regTerms = ['Trelew','VIRCH','Patagonia','Chubut','Gaiman','Rawson','Madryn'];
    if (regTerms.some(function(t) { return ejemplo.indexOf(t) !== -1; })) return ejemplo;

    /* Agregar referencia geográfica al final */
    var geo = VIRCH_CONTEXT.vocab.geoRef;
    var ref = geo[Math.floor(Math.random() * geo.length)];
    return ejemplo + ' (aplica ' + ref + '.)';
  },

  /* Reemplazar apertura genérica por apertura regional */
  regionalizeApertura: function(texto) {
    if (!texto) return texto;
    var aperturas = VIRCH_CONTEXT.vocab.aperturas;
    /* Reemplazar solo la primera frase (hasta el primer ":") */
    return texto.replace(
      /^(¡?(?:Ojo con esto|Fijate bien|El profe insiste acá|No te lo saltes|Clave para el examen|Marcalo en el apunte|Esto va al parcial|¡Che, esto importa!|¡Excelente|Mirá)[^:]*:)/,
      aperturas[Math.floor(Math.random() * aperturas.length)]
    );
  },

  /* Inyectar empresa VIRCH en los casos prácticos */
  enrichCasoPractico: function(caso) {
    if (!caso || !caso.escenario) return caso;
    var enriched = Object.assign({}, caso);
    enriched.escenario = N78Regional.injectEmpresa(caso.escenario, caso.materia);
    return enriched;
  },

  /* Enriquecer TIPS_BY_MATERIA con contexto regional */
  enrichTips: function() {
    if (typeof TIPS_BY_MATERIA === 'undefined') return;

    Object.keys(TIPS_BY_MATERIA).forEach(function(matKey) {
      var tipSet = TIPS_BY_MATERIA[matKey];
      Object.keys(tipSet).forEach(function(term) {
        var tip = tipSet[term];
        if (tip.ejemplo) {
          tip.ejemplo = N78Regional.enrichEjemplo(tip.ejemplo, matKey);
        }
      });
    });
  },

  /* Enriquecer los CASOS_PRACTICOS con empresas reales */
  enrichCasos: function() {
    if (typeof CASOS_PRACTICOS === 'undefined') return;
    CASOS_PRACTICOS.forEach(function(caso, i) {
      CASOS_PRACTICOS[i] = N78Regional.enrichCasoPractico(caso);
    });
  },

  /* Actualizar CATEDRA_NOTAS con nuevas notas contextualizadas */
  injectCatedraNotas: function() {
    if (typeof CATEDRA_NOTAS === 'undefined') return;

    /* Notas nuevas con contexto VIRCH */
    var notasVIRCH = [
      {
        id: 'cn-virch-001',
        ts: Date.now(),
        materia: 'Contabilidad',
        texto: 'Contexto local: el 90% de las empresas del VIRCH son PyMEs o micropymes. ' +
               'En el parcial, cuando digan "empresa", pensá en una ferretería del microcentro ' +
               'o una distribuidora de la Ruta 3. Los principios contables son los mismos.',
        autor: 'Cátedra FCE · Trelew'
      },
      {
        id: 'cn-virch-002',
        ts: Date.now() + 1000,
        materia: 'Administración',
        texto: 'Data del valle: COOPELECTRIC es un ejemplo perfecto de organización con cogobierno. ' +
               'Cuando estudies "estructura organizacional", pensá en cómo funcionan las cooperativas ' +
               'del Chubut. Es teoría aplicada al palo.',
        autor: 'Cátedra FCE · Trelew'
      },
      {
        id: 'cn-virch-003',
        ts: Date.now() + 2000,
        materia: 'Sociales',
        texto: 'Referencia patagónica: el habitus de Bourdieu se ve clarito en la estructura social ' +
               'del VIRCH. La diferencia entre un productor ovino de la meseta y un profesional ' +
               'de Trelew capital es campo y capital cultural en acción.',
        autor: 'Cátedra FCE · Trelew'
      },
    ];

    /* Agregar solo las que no estén ya */
    notasVIRCH.forEach(function(nota) {
      var ya = CATEDRA_NOTAS.some(function(n) { return n.id === nota.id; });
      if (!ya) CATEDRA_NOTAS.push(nota);
    });
  },

  /* Función principal — llamar una vez al iniciar */
  init: function() {
    try {
      N78Regional.enrichTips();
      N78Regional.enrichCasos();
      N78Regional.injectCatedraNotas();
    } catch(e) {
      /* fail silencioso — el portal funciona igual sin regionalización */
    }
  }
};

window.N78Regional = N78Regional;


var N79QuizWorker = (function() {

  /* Código del Worker como string — se compila en Blob URL */
  var WORKER_CODE = [
    'self.onmessage = function(e) {',
    '  var payload = e.data;',
    '  if (payload.type !== "shuffle") return;',
    '',
    '  var banks    = payload.banks;    /* Array de arrays de preguntas ya normalizadas */',
    '  var total    = payload.total || 20;',
    '  var results  = [];',
    '',
    '  /* Distribuir equitativamente entre bancos */',
    '  var perBank = Math.floor(total / banks.length);',
    '  var rest    = total - (perBank * banks.length);',
    '',
    '  banks.forEach(function(bank, bi) {',
    '    var n        = perBank + (bi < rest ? 1 : 0);',
    '    var shuffled = bank.slice().sort(function() { return Math.random() - .5; });',
    '    results = results.concat(shuffled.slice(0, n));',
    '  });',
    '',
    '  /* Shuffle final del array combinado */',
    '  results = results.sort(function() { return Math.random() - .5; });',
    '',
    '  self.postMessage({ type: "done", questions: results });',
    '};',
  ].join('\n');

  var _worker     = null;
  var _blobUrl    = null;
  var _pending    = null;   /* Promise resolve mientras espera el Worker */
  var _supported  = typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined';

  function _getWorker() {
    if (_worker) return _worker;
    if (!_supported) return null;
    try {
      var blob    = new Blob([WORKER_CODE], { type: 'application/javascript' });
      _blobUrl    = URL.createObjectURL(blob);
      _worker     = new Worker(_blobUrl);
      _worker.onmessage = function(e) {
        if (e.data.type === 'done' && _pending) {
          var resolve = _pending;
          _pending    = null;
          resolve(e.data.questions);
        }
      };
      _worker.onerror = function(err) {
        /* Worker falló → limpiar y usar fallback síncrono */
        console.warn('[N79] Worker error:', err.message);
        _worker   = null;
        _blobUrl  = null;
        _pending  = null;
      };
      return _worker;
    } catch(e) {
      _supported = false;
      return null;
    }
  }

  return {
    /* Mezclar preguntas de múltiples bancos en hilo secundario.
       Retorna Promise<Array> — resuelve con el array mezclado.
       Fallback síncrono si Workers no disponibles. */
    shuffle: function(banks, total) {
      /* Fallback síncrono inmediato si no hay soporte */
      var worker = _getWorker();
      if (!worker) {
        return Promise.resolve(N79QuizWorker._syncShuffle(banks, total));
      }

      return new Promise(function(resolve) {
        _pending = resolve;
        worker.postMessage({ type: 'shuffle', banks: banks, total: total });
        /* Timeout de seguridad: si el Worker no responde en 2s → fallback */
        setTimeout(function() {
          if (_pending) {
            _pending = null;
            resolve(N79QuizWorker._syncShuffle(banks, total));
          }
        }, 2000);
      });
    },

    /* Shuffle síncrono — fallback o si Worker no disponible */
    _syncShuffle: function(banks, total) {
      var perBank = Math.floor(total / banks.length);
      var rest    = total - (perBank * banks.length);
      var results = [];
      banks.forEach(function(bank, bi) {
        var n = perBank + (bi < rest ? 1 : 0);
        var s = bank.slice().sort(function() { return Math.random() - .5; });
        results = results.concat(s.slice(0, n));
      });
      return results.sort(function() { return Math.random() - .5; });
    },

    /* Reportar estado del Worker */
    status: function() {
      return {
        supported: _supported,
        active:    !!_worker,
        blobUrl:   _blobUrl ? 'active' : null
      };
    },

    /* Liberar el Worker cuando no se necesite */
    terminate: function() {
      if (_worker)   { _worker.terminate(); _worker = null; }
      if (_blobUrl)  { URL.revokeObjectURL(_blobUrl); _blobUrl = null; }
    }
  };
})();

window.N79QuizWorker = N79QuizWorker;

/* ── Pre-cómputo idle de quizzes por materia ──────────────────
   Mientras el alumno lee, pre-calculamos el próximo quiz
   usando requestIdleCallback para no bloquear el hilo UI.
   ─────────────────────────────────────────────────────────── */
var N79PreComputed = {};

window.n79PrecomputeQuiz = function(materia, agrupador) {
  var schedule = window.requestIdleCallback
    || function(fn) { setTimeout(fn, 100); };

  schedule(function() {
    if (typeof q55GetBank !== 'function') return;
    var bank = q55GetBank(materia, agrupador);
    if (!bank || bank.length < 3) return;
    /* Pre-mezclar — el resultado estará listo cuando el alumno haga click */
    var key = materia + '|' + (agrupador || '');
    N79PreComputed[key] = bank.sort(function() { return Math.random() - .5; });
  }, { timeout: 1000 });
};

window.N79PreComputed = N79PreComputed;

var NexusRadarV2 = {

  MATERIAS: ['Propedéutica','Contabilidad','Administración','Sociales'],
  COLORS:   { /* v19.3.1 */ ...NEXUS_NAME_COLORS },
  LABELS:   { 'Propedéutica':'Prop.','Contabilidad':'Cont.','Administración':'Adm.','Sociales':'Soc.' },
  SIZE: 200, R: 78, _activeMateria: null,

  /* Coordenadas de un eje */
  _axis: function(i, r) {
    var angle = (Math.PI * 2 * i / NexusRadarV2.MATERIAS.length) - Math.PI / 2;
    var cx = NexusRadarV2.SIZE / 2, cy = NexusRadarV2.SIZE / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  },

  /* Crear elemento SVG con namespace */
  _svgEl: function(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function(k) { el.setAttribute(k, attrs[k]); });
    return el;
  },

  /* Render principal — DOM-first con event listeners reales */
  render: function(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var scores   = typeof NexusRadar !== 'undefined' ? NexusRadar.computeScores() : {};
    var mats     = NexusRadarV2.MATERIAS;
    var values   = mats.map(function(m) { return (scores[m] || 0) / 100; });
    var hasData  = values.some(function(v) { return v > 0; });
    var SIZE = NexusRadarV2.SIZE, R = NexusRadarV2.R, N = mats.length;

    /* Wrapper */
    var wrap = document.createElement('div');
    wrap.className = 'radar-wrap';

    /* Título */
    var title = document.createElement('div');
    title.className = 'radar-title';
    title.textContent = '🧭 Radar de Competencias';
    wrap.appendChild(title);

    /* SVG — creado con DOM API para poder attachar listeners */
    var svg = NexusRadarV2._svgEl('svg', {
      viewBox: '0 0 ' + SIZE + ' ' + SIZE,
      class: 'radar-svg',
      role: 'img',
      'aria-label': 'Radar de competencias interactivo'
    });

    /* Anillos de referencia */
    [0.25, 0.5, 0.75, 1].forEach(function(pct) {
      var pts = mats.map(function(_, i) {
        var p = NexusRadarV2._axis(i, R * pct);
        return p.x + ',' + p.y;
      }).join(' ');
      svg.appendChild(NexusRadarV2._svgEl('polygon', {
        points: pts, class: 'radar-ring'
      }));
    });

    /* Etiquetas de porcentaje en los anillos */
    [25, 50, 75, 100].forEach(function(pct) {
      var p = NexusRadarV2._axis(0, R * pct / 100);
      var lbl = NexusRadarV2._svgEl('text', {
        x: p.x + 3, y: p.y - 2,
        class: 'radar-ring-label'
      });
      lbl.textContent = pct + '%';
      svg.appendChild(lbl);
    });

    /* Ejes desde el centro */
    mats.forEach(function(_, i) {
      var p = NexusRadarV2._axis(i, R);
      svg.appendChild(NexusRadarV2._svgEl('line', {
        x1: SIZE/2, y1: SIZE/2, x2: p.x, y2: p.y,
        class: 'radar-axis'
      }));
    });

    /* Área de datos — con transición CSS */
    var areaEl = null;
    if (hasData) {
      var pts = mats.map(function(m, i) {
        var p = NexusRadarV2._axis(i, R * Math.max(0.04, values[i]));
        return p.x + ',' + p.y;
      }).join(' ');
      areaEl = NexusRadarV2._svgEl('polygon', {
        points: pts, class: 'radar-area', id: 'radar-area-poly'
      });
      svg.appendChild(areaEl);
    }

    /* Dots interactivos por materia */
    var dotEls = [];
    mats.forEach(function(mat, i) {
      var val   = values[i];
      var p     = NexusRadarV2._axis(i, R * Math.max(0.04, val));
      var color = NexusRadarV2.COLORS[mat];
      var pct   = scores[mat] || 0;

      var dot = NexusRadarV2._svgEl('circle', {
        cx: p.x, cy: p.y, r: val > 0 ? 5 : 3,
        fill: color, class: 'radar-dot',
        'data-mat': mat, 'data-pct': pct
      });

      /* Tooltip nativa */
      var titleEl = NexusRadarV2._svgEl('title');
      titleEl.textContent = mat + ': ' + pct + '%';
      dot.appendChild(titleEl);

      /* Click → seleccionar materia */
      dot.style.cursor = 'pointer';
      dot.addEventListener('click', function() {
        NexusRadarV2._onDotClick(mat, pct, wrap);
      });
      /* Hover → pulso */
      dot.addEventListener('mouseenter', function() {
        this.setAttribute('r', '7');
        this.style.filter = 'drop-shadow(0 0 6px ' + color + ')';
      });
      dot.addEventListener('mouseleave', function() {
        this.setAttribute('r', val > 0 ? '5' : '3');
        this.style.filter = '';
      });

      svg.appendChild(dot);
      dotEls.push(dot);

      /* Etiqueta materia */
      var lp  = NexusRadarV2._axis(i, R + 18);
      var lbl = NexusRadarV2._svgEl('text', {
        x: lp.x, y: lp.y, class: 'radar-label',
        'data-mat': mat
      });
      lbl.textContent = NexusRadarV2.LABELS[mat];
      lbl.style.cursor = 'pointer';
      lbl.addEventListener('click', function() {
        NexusRadarV2._onDotClick(mat, pct, wrap);
      });
      svg.appendChild(lbl);

      /* Porcentaje */
      if (pct > 0) {
        var pEl = NexusRadarV2._svgEl('text', {
          x: lp.x, y: lp.y + 11,
          class: 'radar-pct',
          fill: color
        });
        pEl.textContent = pct + '%';
        svg.appendChild(pEl);
      }
    });

    wrap.appendChild(svg);

    /* Panel de detalle al hacer click */
    var detail = document.createElement('div');
    detail.className = 'radar-detail';
    detail.style.display = 'none';
    wrap.appendChild(detail);

    /* Insight general */
    var best  = mats.reduce(function(a,b){ return (scores[a]||0) > (scores[b]||0) ? a : b; });
    var worst = mats.reduce(function(a,b){ return (scores[a]||0) < (scores[b]||0) ? a : b; });
    var insight = document.createElement('div');
    insight.className = 'radar-insight';
    insight.innerHTML = !hasData
      ? 'Completá tus primeros quizzes para ver tu perfil.'
      : 'Tu punto fuerte es <strong style="color:' + NexusRadarV2.COLORS[best] + '">' + best + '</strong>.' +
        ((scores[worst] || 0) < (scores[best] || 0) - 20
          ? ' Reforzá <strong style="color:' + NexusRadarV2.COLORS[worst] + '">' + worst + '</strong>.'
          : ' Rendimiento parejo.');
    wrap.appendChild(insight);

    container.innerHTML = '';
    container.appendChild(wrap);
  },

  /* Click en un punto del radar → mostrar detalle de esa materia */
  _onDotClick: function(mat, pct, wrap) {
    var detail = wrap.querySelector('.radar-detail');
    if (!detail) return;

    /* Toggle si es la misma materia */
    if (NexusRadarV2._activeMateria === mat) {
      NexusRadarV2._activeMateria = null;
      detail.style.display = 'none';
      return;
    }
    NexusRadarV2._activeMateria = mat;

    var color   = NexusRadarV2.COLORS[mat];
    var matKey  = mat.replace(' I','').replace('Cs. ','').trim();
    var tipSet  = typeof TIPS_BY_MATERIA !== 'undefined' ? (TIPS_BY_MATERIA[matKey] || {}) : {};
    var tipKeys = Object.keys(tipSet).slice(0, 2);
    var tipsHtml = tipKeys.length > 0
      ? tipKeys.map(function(k) {
          return '<div class="radar-d-tip"><strong>' + tipSet[k].titulo + '</strong><br>' +
                 '<span>' + (tipSet[k].nota || '').substring(0,80) + '…</span></div>';
        }).join('')
      : '<div class="radar-d-tip" style="color:rgba(255,255,255,.4)">Completá un quiz de ' + mat + ' para ver tus conceptos débiles.</div>';

    detail.innerHTML =
      '<div class="radar-d-header" style="border-color:' + color + '">' +
        '<span class="radar-d-mat" style="color:' + color + '">' + mat + '</span>' +
        '<span class="radar-d-pct" style="color:' + color + '">' + pct + '%</span>' +
        '<button class="radar-d-close" onclick="this.closest(\'.radar-detail\').style.display=\'none\'">✕</button>' +
      '</div>' +
      '<div class="radar-d-tips">' + tipsHtml + '</div>' +
      '<div class="radar-d-action">' +
        '<a href="#" onclick="event.preventDefault();goto(\'' + mat.split(' ')[0].toLowerCase().replace('é','e').replace('á','a') + '-materiales\',null)" ' +
        'class="radar-d-link" style="color:' + color + '">Ir a ' + mat + ' →</a>' +
      '</div>';

    detail.style.display = 'block';
    detail.style.borderLeftColor = color;
  },

  /* v9.2.1 fix: computeScores delegado a NexusRadar v1 */
  computeScores: function() {
    if (typeof NexusRadar !== 'undefined' && NexusRadar.computeScores) {
      return NexusRadar.computeScores();
    }
    /* fallback: leer fce_portal_scores_v1 directamente */
    var scores = {}; var raw = {};
    try { raw = JSON.parse(localStorage.getItem('fce_portal_scores_v1') || '{}'); } catch(e) {}
    var mats = ['Contabilidad','Administración','Sociales','Propedéutica'];
    mats.forEach(function(mat) {
      var key = mat.toLowerCase().split(' ')[0];
      var vals = Object.keys(raw).filter(function(k){ return k.indexOf(key)!==-1; })
        .map(function(k){ return (raw[k].best||raw[k].last||{}).pct||0; });
      scores[mat] = vals.length ? Math.round(vals.reduce(function(a,b){return a+b;},0)/vals.length) : 0;
    });
    return scores;
  }

};

window.NexusRadarV2 = NexusRadarV2;


var N710MentorSilent = {

  /* Inyectar anotaciones al margen en un well */
  inject: function(wellEl, item) {
    if (!wellEl || !item || item.tipo !== 'Resumen') return;
    if (wellEl.querySelector('.n710-margin-panel')) return;   /* ya inyectado */

    var matKey = (item.materia || '').replace(' I','').replace('Cs. ','').trim();
    var tipSet = typeof TIPS_BY_MATERIA !== 'undefined' ? (TIPS_BY_MATERIA[matKey] || {}) : {};
    if (!Object.keys(tipSet).length) return;

    var text = (wellEl.textContent || '').toLowerCase();
    var annotations = [];

    /* Buscar términos del tipSet que aparecen en el cuerpo */
    Object.keys(tipSet).forEach(function(term) {
      if (text.indexOf(term) === -1) return;
      var tip = tipSet[term];
      if (!tip.nota) return;
      annotations.push({ term: term, tip: tip, id: 'n710-ann-' + annotations.length });
    });

    if (!annotations.length) return;

    /* Crear panel lateral */
    var panel = document.createElement('div');
    panel.className = 'n710-margin-panel';

    var panelHeader = document.createElement('div');
    panelHeader.className = 'n710-mp-header';
    panelHeader.innerHTML = '<span class="n710-mp-icon">📖</span><span>Notas del Mentor</span>';
    panel.appendChild(panelHeader);

    var notesList = document.createElement('div');
    notesList.className = 'n710-mp-notes';

    /* Marcar los términos en el texto con superíndices */
    var noteIndex = 1;
    annotations.forEach(function(ann) {
      var color = NEXUS_NAME_COLORS[matKey] /* v19.3.2 */ || NEXUS_COLORS.materias.home.base /* v19.3.2 */;

      /* Inyectar superíndice al lado del primer párrafo que contenga el término */
      var paras = wellEl.querySelectorAll('p');
      var marked = false;
      paras.forEach(function(p) {
        if (marked) return;
        var pText = (p.textContent || '').toLowerCase();
        if (pText.indexOf(ann.term) !== -1 && !p.querySelector('.n710-sup')) {
          var sup = document.createElement('sup');
          sup.className = 'n710-sup';
          sup.textContent = noteIndex;
          sup.style.color = color;
          sup.setAttribute('data-note', ann.id);
          sup.style.cursor = 'pointer';
          sup.addEventListener('click', function(e) {
            e.stopPropagation();
            var target = document.getElementById(ann.id);
            if (target) {
              target.classList.toggle('n710-note-active');
              target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          });
          p.appendChild(sup);
          marked = true;
        }
      });

      /* Crear nota en el panel */
      var noteEl = document.createElement('div');
      noteEl.className = 'n710-note';
      noteEl.id = ann.id;
      noteEl.style.borderLeftColor = color;
      noteEl.innerHTML =
        '<div class="n710-note-num" style="color:' + color + '">' + noteIndex + '</div>' +
        '<div class="n710-note-body">' +
          '<div class="n710-note-title">' + (ann.tip.titulo || ann.term) + '</div>' +
          '<div class="n710-note-text">' + ann.tip.nota + '</div>' +
          (ann.tip.ejemplo_virch
            ? '<div class="n710-note-ejemplo">🌿 ' + ann.tip.ejemplo_virch + '</div>'
            : (ann.tip.ejemplo
              ? '<div class="n710-note-ejemplo">Ej: ' + ann.tip.ejemplo + '</div>'
              : '')) +
        '</div>';

      notesList.appendChild(noteEl);
      noteIndex++;
    });

    panel.appendChild(notesList);

    /* Insertar panel dentro del card (después del well) */
    var mcBody = wellEl.parentNode;
    if (mcBody) {
      mcBody.appendChild(panel);
    }

    /* Activar panel al detectar pausa en scroll */
    N710MentorSilent._attachScrollPause(wellEl, panel);
  },

  /* Mostrar panel cuando el scroll se detiene por más de 1.5s */
  _attachScrollPause: function(wellEl, panel) {
    var scrollTimer = null;
    var parentScroll = document.getElementById('main') || window;

    var onScroll = function() {
      clearTimeout(scrollTimer);
      panel.classList.remove('n710-panel-visible');
      scrollTimer = setTimeout(function() {
        /* ¿El well está en el viewport? */
        var rect = wellEl.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          panel.classList.add('n710-panel-visible');
        }
      }, 1500);
    };

    (parentScroll === window ? window : parentScroll).addEventListener('scroll', onScroll, { passive: true });
    /* También mostrar cuando se abre el card */
    setTimeout(function() { panel.classList.add('n710-panel-visible'); }, 800);
  }
};

window.N710MentorSilent = N710MentorSilent;

/* ── T1 PATCH: Radar aliases + latido ─────────────────────────────────── */
(function(){
  if(typeof NexusRadarV2==='undefined')return;
  NexusRadarV2.LABELS['Propedéutica']  = 'Norma';
  NexusRadarV2.LABELS['Contabilidad']  = 'Técnica';
  NexusRadarV2.LABELS['Administración']= 'Estrategia';
  NexusRadarV2.LABELS['Sociales']      = 'Crítica';
  /* Latido: re-render con clase si hay eje con <40% */
  var _origRender = NexusRadarV2.render.bind(NexusRadarV2);
  NexusRadarV2.render = function(cid){
    _origRender(cid);
    var c = document.getElementById(cid);
    if(!c) return;
    var scores = NexusRadarV2.computeScores ? NexusRadarV2.computeScores() : {};
    var hasBad = Object.keys(scores).some(function(m){ return scores[m]>0 && scores[m]<40; });
    if(hasBad){ var svg=c.querySelector('svg'); if(svg) svg.classList.add('radar-beat'); }
  };
})();

/* ══ T2: NEURAL SEARCH ENGINE ═════════════════════════════════════════ */
var NexusSearch = {
  _idx: null,

  build: function(){
    if(!NexusCore.getMateriales()) return;
    NexusSearch._idx = {};
    NexusCore.getMateriales().forEach(function(item){
      var cuerpo = item.cuerpo||'';
      var terms  = [];
      /* Indexar <strong> */
      (cuerpo.match(/<strong>([^<]{3,60})<\/strong>/g)||[]).forEach(function(m){
        terms.push(m.replace(/<\/?strong>/g,'').trim().toLowerCase());
      });
      /* Indexar adm-highlight */
      (cuerpo.match(/class="adm-highlight[^"]*">([^<]{3,60})/g)||[]).forEach(function(m){
        terms.push(m.replace(/class="[^"]+">/, '').trim().toLowerCase());
      });
      terms.forEach(function(t){
        if(!NexusSearch._idx[t]) NexusSearch._idx[t] = [];
        if(NexusSearch._idx[t].indexOf(item.id)===-1) NexusSearch._idx[t].push(item.id);
      });
    });
  },

  query: function(q){
    if(!q||q.length<2) return [];
    q = q.toLowerCase().trim();
    if(!NexusSearch._idx) NexusSearch.build();
    var idx = NexusSearch._idx || {};
    var hits = {};
    Object.keys(idx).forEach(function(term){
      if(term.indexOf(q)!==-1){
        idx[term].forEach(function(id){
          if(!hits[id]) hits[id] = {id:id,score:0,terms:[]};
          hits[id].score++;
          hits[id].terms.push(term);
        });
      }
    });
    var items = Object.keys(hits).map(function(id){
      var item = NexusCore.getMateriales().find(function(i){ return i&&i.id===id; });
      return item ? Object.assign({},item,{_score:hits[id].score,_terms:hits[id].terms}) : null;
    }).filter(Boolean).sort(function(a,b){ return b._score-a._score; });
    return items.slice(0,8);
  },

  /* Render del panel de búsqueda neural */
  renderPanel: function(containerId){
    var el = document.getElementById(containerId);
    if(!el) return;
    el.innerHTML =
      '<div class="ns-wrap">'+
        '<div class="ns-header"><span class="ns-icon">🔍</span>'+
          '<input id="ns-input" class="ns-input" placeholder="Buscá cualquier concepto…" '+
            'oninput="N90Singularity.search(this.value)" />'+
          '<button class="ns-clear" onclick="NexusSearch._clear()">✕</button>'+
        '</div>'+
        '<div id="ns-results" class="ns-results" style="display:none"></div>'+
      '</div>';
  },

  _onInput: function(v){
    var r = document.getElementById('ns-results');
    if(!r) return;
    if(!v||v.length<2){ r.style.display='none'; return; }
    var results = NexusSearch.query(v);
    if(!results.length){ r.style.display='block'; r.innerHTML='<p class="ns-empty">Sin resultados para "'+v+'".</p>'; return; }
    /* Agrupar por materia para mostrar comparativo */
    var byMat = {};
    results.forEach(function(item){
      var m=item.materia||'';
      if(!byMat[m]) byMat[m]=[];
      byMat[m].push(item);
    });
    var html = '<div class="ns-query-label">'+results.length+' resultado'+( results.length!==1?'s':'')+' para <strong>"'+v+'"</strong></div>';
    var colors=NEXUS_NAME_COLORS;
    /* Panel comparativo si hay >=2 materias */
    var mats=Object.keys(byMat);
    if(mats.length>=2) html+='<div class="ns-compare-badge">⚡ Concepto transversal — aparece en '+mats.length+' materias</div>';
    Object.keys(byMat).forEach(function(mat){
      var color=colors[mat]||'#4a4a8a';
      html+='<div class="ns-mat-group" style="border-left-color:'+color+'">'+
        '<div class="ns-mat-name" style="color:'+color+'">'+mat+'</div>';
      byMat[mat].forEach(function(item){
        var snippet='';
        if(item.cuerpo){
          var re=new RegExp('.{0,60}('+v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+').{0,60}','i');
          var m2=item.cuerpo.replace(/<[^>]+>/g,'').match(re);
          if(m2) snippet=m2[0].replace(new RegExp('('+v+')','gi'),'<mark>$1</mark>');
        }
        var matPage={'Contabilidad':'cont-materiales','Administración':'adm-materiales','Sociales':'soc-materiales','Propedéutica':'prop-materiales'}[mat]||'home';
        html+='<div class="ns-result" onclick="goto(\''+matPage+'\',null);setTimeout(function(){var c=document.getElementById(\'mcard-'+item.id+'\');if(c){c.scrollIntoView({behavior:\'smooth\'});if(typeof fceCard===\'function\')fceCard(\'mcard-'+item.id+'\')}},600)">'+
          '<div class="ns-r-title">'+item.titulo+'</div>'+
          (snippet?'<div class="ns-r-snippet">…'+snippet+'…</div>':'')+
          '<div class="ns-r-terms">'+item._terms.slice(0,3).join(' · ')+'</div>'+
        '</div>';
      });
      html+='</div>';
    });
    r.innerHTML=html;
    r.style.display='block';
  },

  _clear: function(){
    var inp=document.getElementById('ns-input');
    var res=document.getElementById('ns-results');
    if(inp) inp.value='';
    if(res) res.style.display='none';
  }
};
window.NexusSearch=NexusSearch;

/* ══ T3: RANGOS PATAGÓNICOS ════════════════════════════════════════════ */
var N80Rangos = {
  RANGOS: [
    { id:'ingresante', label:'Ingresante',     min_leidos:0,  min_quizzes:0, min_avg:0,  color:'rgba(255,255,255,.5)', badge:'📗' },
    { id:'analista',   label:'Analista FCE',   min_leidos:5,  min_quizzes:1, min_avg:0,  color:'#7eb3ff',             badge:'📘' },
    { id:'consultor',  label:'Consultor',      min_leidos:20, min_quizzes:3, min_avg:60, color:'#c084fc',             badge:'📙' },
    { id:'magister',   label:'Magister de la FCE', min_leidos:40, min_quizzes:5, min_avg:70, color:NEXUS_COLORS.materias.prop.strong, badge:'🏆' },
  ],
  LS_KEY: 'nexus80_rango_v1',

  compute: function(){
    var leidos={},scores={};
    try{ leidos=JSON.parse(localStorage.getItem('nexus_leidos_v1')||'{}'); }catch(e){}
    try{ scores=JSON.parse(localStorage.getItem('fce_portal_scores_v1')||'{}'); }catch(e){}
    var nLeidos=Object.keys(leidos).length;
    var sArr=Object.keys(scores).map(function(k){ return (scores[k].best||scores[k].last||{}).pct||0; });
    var nQuizzes=sArr.length;
    var avg=nQuizzes>0?Math.round(sArr.reduce(function(a,b){return a+b;},0)/nQuizzes):0;
    var rango=N80Rangos.RANGOS[0];
    N80Rangos.RANGOS.forEach(function(r){
      if(nLeidos>=r.min_leidos&&nQuizzes>=r.min_quizzes&&avg>=r.min_avg) rango=r;
    });
    try{ localStorage.setItem(N80Rangos.LS_KEY,JSON.stringify({id:rango.id,ts:Date.now()})); }catch(e){}
    return { rango:rango, leidos:nLeidos, quizzes:nQuizzes, avg:avg };
  },

  apply: function(){
    var d=N80Rangos.compute();
    var r=d.rango;
    document.documentElement.setAttribute('data-rango',r.id);
    /* Actualizar badge en sidebar */
    var badge=document.getElementById('n80-rango-badge');
    if(badge){
      badge.textContent=r.badge+' '+r.label;
      badge.style.color=r.color;
    }
    return d;
  },

  renderCard: function(containerId){
    var el=document.getElementById(containerId);
    if(!el) return;
    var d=N80Rangos.apply();
    var r=d.rango;
    var next=N80Rangos.RANGOS[N80Rangos.RANGOS.indexOf(r)+1];
    el.innerHTML=
      '<div class="n80-rango-card" data-rango="'+r.id+'" style="border-color:'+r.color+'">'+
        '<div class="n80-rc-badge">'+r.badge+'</div>'+
        '<div class="n80-rc-label" style="color:'+r.color+'">'+r.label+'</div>'+
        '<div class="n80-rc-stats">'+
          d.leidos+' leídos · '+d.quizzes+' quizzes · promedio '+d.avg+'%'+
        '</div>'+
        (next?'<div class="n80-rc-next">Siguiente: <strong>'+next.label+'</strong> — '+
          'faltán '+(next.min_leidos-d.leidos>0?next.min_leidos-d.leidos+' leídos más':
          next.min_quizzes-d.quizzes>0?next.min_quizzes-d.quizzes+' quizzes más':'promedio '+next.min_avg+'%+')+
        '</div>':'<div class="n80-rc-next">🎓 ¡Nivel máximo alcanzado! Sos Magister de la FCE.</div>')+
      '</div>';
  }
};
window.N80Rangos=N80Rangos;

/* ══ T4: VOZ DEL PROFE 2.0 — Flotante inteligente + mnemotécnicas ══════ */
var MNEMOTECNICAS = {
  'partida doble':  { regla:'D-H: "el Debe siempre Dirige hacia la izquierda". Lo que entra: Debe. Lo que sale: Haber.', dato:'Luca Pacioli (1494) inventó esto en Venecia. 500 años después, igual funciona.' },
  'iva':            { regla:'CF compra, DF vende: "CF = Crédito Fiscal cuando Compro, DF = Debo al Fisco cuando vendo".', dato:'El IVA lo pagás vos pero lo recaudás para la AFIP. Sos cobrador gratis del Estado.' },
  'habitus':        { regla:'"Habitus = Hábitos + Status". Las disposiciones incorporadas determinan tu posición.', dato:'Bourdieu lo tomó de Aristóteles (hexis). Lo bajó a la sociología en los 60s.' },
  'taylor':         { regla:'TESPC: Tiempos, Estandarización, Selección, Pago, Control. Las 5 claves de la Adm. Científica.', dato:'Taylor cronometró obreros con un reloj. Los obreros lo odiaban. Los dueños, no.' },
  'fayol':          { regla:'POD+CC: Planificar, Organizar, Dirigir + Coordinar, Controlar. En ese orden.', dato:'Fayol era ingeniero de minas, no obrero. Por eso pensó en la cima, no en la base.' },
  'variaciones patrimoniales': { regla:'"PN cambia = Modificativa. PN no cambia = Permutativa". Simple.', dato:'La donación recibida es MODIFICATIVA porque aumenta el PN. Error clásico del parcial.' },
  'rse':            { regla:'CEMA: Calidad laboral, Ética, Medioambiente, Acción comunitaria. Las 4 de CEMEFI.', dato:'Carroll lo puso en pirámide: economía abajo, ética arriba. Freeman lo democratizó.' },
  'campo':          { regla:'"Campo = Cancha de fútbol con reglas propias". Cada campo tiene su pelota (capital).', dato:'Bourdieu usó el campo como metáfora del espacio físico de tensión y disputa.' },
  'obstáculo epistemológico': { regla:'"OE = Obstáculo al Saber". La experiencia cotidiana nos bloquea la ciencia.', dato:'Bachelard era químico. Su primer obstáculo fue el calor: "el fuego calienta" vs termodinámica.' },
  'patrimonio':     { regla:'"A = P + PN siempre". El activo es el todo, el pasivo es la deuda, el PN es lo tuyo.', dato:'La ecuación contable nunca miente. Si no cuadra, hay un error. Siempre.' },
};

var N80VozFlotante = {
  _el: null, _timer: null, _currentTerm: null,

  init: function(){
    if(document.getElementById('n80-voz-flotante')) return;
    var el=document.createElement('div');
    el.id='n80-voz-flotante';
    el.className='n80-voz-flotante';
    el.innerHTML=
      '<div class="n80-vf-header">'+
        '<span class="n80-vf-icon">🎓</span>'+
        '<span class="n80-vf-label">Voz del Profe</span>'+
        '<button class="n80-vf-close" onclick="N80VozFlotante.hide()">✕</button>'+
      '</div>'+
      '<div class="n80-vf-body">'+
        '<div id="n80-vf-regla" class="n80-vf-regla"></div>'+
        '<div id="n80-vf-dato" class="n80-vf-dato"></div>'+
      '</div>';
    document.body.appendChild(el);
    N80VozFlotante._el=el;
  },

  show: function(term){
    N80VozFlotante.init();
    var mn=MNEMOTECNICAS[term.toLowerCase()];
    if(!mn) return;
    if(N80VozFlotante._currentTerm===term) return;
    N80VozFlotante._currentTerm=term;
    document.getElementById('n80-vf-regla').textContent=mn.regla;
    document.getElementById('n80-vf-dato').innerHTML='<em>📌 Dato de color:</em> '+mn.dato;
    var el=N80VozFlotante._el;
    el.classList.add('n80-vf-visible');
    /* Auto-ocultar a los 10s */
    clearTimeout(N80VozFlotante._timer);
    N80VozFlotante._timer=setTimeout(function(){ N80VozFlotante.hide(); },10000);
  },

  hide: function(){
    if(N80VozFlotante._el) N80VozFlotante._el.classList.remove('n80-vf-visible');
    N80VozFlotante._currentTerm=null;
    clearTimeout(N80VozFlotante._timer);
  },

  /* Hookear en los strong del well — mostrar al hover si hay mnemotécnica */
  attachToWell: function(wellEl){
    if(!wellEl) return;
    wellEl.querySelectorAll('strong').forEach(function(s){
      if(s.dataset.voz) return;
      s.dataset.voz='1';
      var term=(s.textContent||'').toLowerCase().trim();
      if(!MNEMOTECNICAS[term]) return;
      s.classList.add('n80-voz-trigger');
      s.addEventListener('mouseenter',function(){ N80VozFlotante.show(term); });
    });
  }
};
window.N80VozFlotante=N80VozFlotante;
window.MNEMOTECNICAS=MNEMOTECNICAS;

/* ── T1: ANÁLISIS DE SESGO DE ESTUDIO ────────────────────────────────────── */
var N81SesgoEngine = {
  THRESHOLD: 30,     /* % de desbalance que activa nivelación */
  LS_KEY: 'nexus81_nivelacion_v1',

  /* Calcular sesgo entre todas las materias */
  compute: function(){
    var scores = typeof NexusRadarV2 !== 'undefined'
      ? NexusRadarV2.computeScores() : {};
    var mats = Object.keys(scores).filter(function(m){ return scores[m] > 0; });
    if(mats.length < 2) return null;

    var sorted = mats.slice().sort(function(a,b){ return scores[b]-scores[a]; });
    var top    = sorted[0], bot = sorted[sorted.length-1];
    var delta  = scores[top] - scores[bot];

    /* También usar leídos para detectar sesgo de lectura */
    var leidos = {};
    try{ leidos = JSON.parse(localStorage.getItem('nexus_leidos_v1')||'{}'); }catch(e){}
    var lByMat = {};
    if(NexusCore.getMateriales()){
      NexusCore.getMateriales().forEach(function(item){
        if(!item||item.tipo!=='Resumen') return;
        var m=item.materia||''; if(!lByMat[m]) lByMat[m]=0;
        if(leidos[item.id]) lByMat[m]++;
      });
    }
    var lMats = Object.keys(lByMat).filter(function(m){ return lByMat[m]>0; });
    var lTop  = lMats.sort(function(a,b){ return lByMat[b]-lByMat[a]; })[0]||top;
    var lBot  = lMats.sort(function(a,b){ return lByMat[a]-lByMat[b]; })[0]||bot;
    var lDelta= lByMat[lTop]-(lByMat[lBot]||0);

    return { top:top, bot:bot, delta:delta, lTop:lTop, lBot:lBot, lDelta:lDelta,
             scores:scores, lByMat:lByMat, sesgado: delta >= N81SesgoEngine.THRESHOLD };
  },

  /* Chequear si la nivelación fue completada */
  nivelacionCompletada: function(matDebil){
    var scores = {};
    try{ scores = JSON.parse(localStorage.getItem('fce_portal_scores_v1')||'{}'); }catch(e){}
    return Object.keys(scores).some(function(k){
      return k.toLowerCase().indexOf(matDebil.split(' ')[0].toLowerCase())!==-1;
    });
  },

  /* Inyectar banner de nivelación en una página de materia */
  injectNivelacionBanner: function(pageEl, sesgo){
    if(!pageEl||!sesgo||!sesgo.sesgado) return;
    if(pageEl.querySelector('.n81-nivelacion-banner')) return;

    var matFuerte = sesgo.top, matDebil = sesgo.bot;
    var pageMat   = (pageEl.querySelector('[data-mat-dynamic]')||{}).dataset;
    if(!pageMat||!pageMat.materia) return;
    /* Solo mostrar en la materia fuerte */
    if(pageMat.materia !== matFuerte) return;
    /* No mostrar si ya completó nivelación */
    if(N81SesgoEngine.nivelacionCompletada(matDebil)) return;

    var colorDebil = NEXUS_NAME_COLORS[matDebil]||'#a78bfa';
    var matPageMap = {'Contabilidad':'cont-materiales','Administración':'adm-materiales','Sociales':'soc-materiales','Propedéutica':'prop-materiales'};

    var banner = document.createElement('div');
    banner.className = 'n81-nivelacion-banner';
    banner.innerHTML =
      '<div class="n81-nb-icon">⚖</div>'+
      '<div class="n81-nb-body">'+
        '<strong>Sesgo de estudio detectado.</strong> Tu '+matFuerte+' ('+sesgo.scores[matFuerte]+'%) supera '+matDebil+' ('+sesgo.scores[matDebil]+'%) en '+sesgo.delta+' puntos. '+
        'Un economista integral necesita equilibrio. Completá un Quiz de '+matDebil+' para continuar con el Machete.'+
      '</div>'+
      '<div class="n81-nb-actions">'+
        '<button class="n81-nb-ir" onclick="goto(\''+matPageMap[matDebil]+'\',null)" style="background:'+colorDebil+'">Ir a '+matDebil+' →</button>'+
        '<button class="n81-nb-dismiss" onclick="this.closest(\'.n81-nivelacion-banner\').remove()">Entendido</button>'+
      '</div>';

    /* Deshabilitar machete mientras hay sesgo */
    var macheteBtn = pageEl.querySelector('.nexus6-machete-btn');
    if(macheteBtn){
      macheteBtn.disabled = true;
      macheteBtn.title = 'Completá un quiz de '+matDebil+' primero para equilibrar tu formación.';
      macheteBtn.style.opacity = '.4';
      macheteBtn.style.cursor  = 'not-allowed';
    }

    var host = pageEl.querySelector('[data-mat-dynamic]');
    if(host) host.insertBefore(banner, host.firstChild);
  },

  /* Correr análisis en todas las páginas visibles */
  run: function(){
    var sesgo = N81SesgoEngine.compute();
    if(!sesgo||!sesgo.sesgado) return;
    document.querySelectorAll('.page').forEach(function(pg){
      N81SesgoEngine.injectNivelacionBanner(pg, sesgo);
    });
    /* Emitir evento para NexusMemoryAPI */
    if(typeof NexusMemoryAPI!=='undefined'){
      NexusMemoryAPI.emit('sesgo:detected',{top:sesgo.top,bot:sesgo.bot,delta:sesgo.delta});
    }
  }
};
window.N81SesgoEngine = N81SesgoEngine;

/* ── T2: SUB-EJES DEL RADAR ─────────────────────────────────────────────── */
/* Ampliar _onDotClick de NexusRadarV2 para mostrar sub-ejes */
var N81SubEjes = {
  DATA: {
    'Contabilidad':   { icon:'📊', ejes:['Itinerario I','Itinerario II','Itinerario III','Itinerario IV','Itinerario V','Itinerario VI'], alias:['Marco Conceptual','Variaciones','Doc. Comerciales','Ciclo Contable','Plan Cuentas','Registros y Libros'] },
    'Administración': { icon:'🏢', ejes:['Unidad I','Unidad II'], alias:['Escuelas Adm.','Org. y Entorno'] },
    'Sociales':       { icon:'🌐', ejes:['Unidad I','Unidad II','Unidad III'], alias:['Epistemología','Campo/Habitus','Identidad/Poder'] },
    'Propedéutica':   { icon:'📜', ejes:['Unidad I'], alias:['Sistema Univ.'] },
  },

  /* Calcular score por sub-eje usando leídos */
  scoreEje: function(mat, agrupador){
    if(!NexusCore.getMateriales()) return 0;
    var items = NexusCore.getMateriales().filter(function(i){ return i&&i.materia===mat&&i.agrupador===agrupador&&i.tipo==='Resumen'; });
    if(!items.length) return 0;
    var leidos = {};
    try{ leidos=JSON.parse(localStorage.getItem('nexus_leidos_v1')||'{}'); }catch(e){}
    var done = items.filter(function(i){ return leidos[i.id]; }).length;
    return Math.round(done/items.length*100);
  },

  /* Renderizar sub-ejes en el panel de detalle del radar */
  renderSubEjes: function(mat, containerEl){
    var d = N81SubEjes.DATA[mat];
    if(!d) return;
    var colors = NexusRadarV2.COLORS || {};
    var color  = colors[mat] || NEXUS_COLORS.materias.home.base /* v19.3.2 */;

    var html = '<div class="n81-subejes">';
    d.ejes.forEach(function(eje, i){
      var pct = N81SubEjes.scoreEje(mat, eje);
      var alias = d.alias[i]||eje;
      html += '<div class="n81-seje">'+
        '<div class="n81-seje-label">'+alias+'</div>'+
        '<div class="n81-seje-bar-wrap">'+
          '<div class="n81-seje-bar" style="width:'+pct+'%;background:'+color+'"></div>'+
        '</div>'+
        '<div class="n81-seje-pct" style="color:'+color+'">'+pct+'%</div>'+
      '</div>';
    });
    html += '</div>';
    containerEl.innerHTML += html;
  }
};
window.N81SubEjes = N81SubEjes;

/* Patch _onDotClick para agregar sub-ejes */
(function(){
  if(typeof NexusRadarV2==='undefined') return;
  var _orig = NexusRadarV2._onDotClick.bind(NexusRadarV2);
  NexusRadarV2._onDotClick = function(mat, pct, wrap){
    _orig(mat, pct, wrap);
    /* Agregar sub-ejes al panel de detalle */
    var detail = wrap.querySelector('.radar-detail');
    if(!detail||detail.style.display==='none') return;
    if(detail.querySelector('.n81-subejes')) return;
    N81SubEjes.renderSubEjes(mat, detail);
  };
})();

/* ── T3: MATRIZ DE FEEDBACK PSICOLÓGICO (50 respuestas) ────────────────── */
var N81FeedbackMatrix = {

  /* Perfiles motivacionales basados en desbalance */
 _profiles: { tecnico_fuerte: [ 'Tu perfil muestra alta capacidad técnica. Un economista sin contexto social es solo una calculadora. Leé el itinerario de Sociales ahora.', 'Dominás los números, pero los números no dominan la realidad sola. Fraser y Bourdieu te esperan para completar tu visión.', 'Tu Contabilidad es sólida. El siguiente salto no es técnico: es entender POR QUÉ la economía afecta a las personas. Sociales lo explica.', 'La técnica sin teoría crítica es un martillo sin arquitecto. Equilibrá tu formación con Sociales.', 'Sabés cómo registrar. Ahora aprendé a interpretar. Las Ciencias Sociales te dan el marco que la contabilidad no puede dar sola.', ], estratega_fuerte: [ 'Tu visión estratégica está desarrollada, pero la realidad social del VIRCH necesita más que gestión. Completá Sociales.', 'Administrás bien organizaciones en el papel. Ahora estudia cómo esas organizaciones impactan en comunidades reales. Eso es Sociales.', 'Un Consultor del VIRCH necesita entender las estructuras de poder local. Bourdieu es tuyo para leer.', 'Tu perfil de líder está tomando forma. Falta la dimensión crítica: ¿qué impacto social tienen tus decisiones administrativas?', 'Estrategia sin reflexión social produce resultados ciegos. El contexto patagónico exige más. Leé Sociales.', ], social_fuerte: [ 'Tu análisis crítico es agudo. Pero para cambiar la realidad del VIRCH necesitás también los números. Contabilidad te da esa palanca.', 'Ves los problemas sociales claramente. Ahora necesitás las herramientas técnicas para resolverlos. Contabilidad primero.', 'Pensar sin calcular es filosofía. Calcular sin pensar es mecánica. Equilibrá con Contabilidad.', 'Tu perfil crítico es valioso. Ahora dále sustento técnico. Sin Contabilidad, tus análisis quedan en el papel.', 'Fraser y Bourdieu te dieron el diagnóstico. Fowler Newton te da el bisturí. Completá Contabilidad.', ], equilibrado: [ '¡Perfil equilibrado! Estás construyendo el economista integral que el VIRCH necesita. Seguí así.', 'Tu mapa cognitivo empieza a tomar forma. Cada materia se complementa. El siguiente paso es profundidad.', 'Rendimiento parejo en todas las áreas. Ahora enfocate en los itinerarios que tenés más flojos dentro de cada materia.', 'Estás en la senda del Consultor FCE. Tu conocimiento transversal es tu mayor activo.', 'El equilibrio que mostrás es raro y valioso. Traducilo en práctica real: hacé el Simulador de Examen.', ], sin_datos: [ 'Tu mapa cognitivo está en blanco. Eso no es un problema: es una oportunidad. Empezá por el material que más te llame.', 'Todavía no tenemos datos suficientes de tu rendimiento. Completá al menos un quiz por materia para ver tu perfil real.', 'El Radar necesita tus datos para funcionar. Cada quiz que hacés es información que te devuelve claridad.', 'Ingresante, bienvenido al proceso. Tu primera tarea: un quiz de cada materia para calibrar el Radar.', ], },

  /* Seleccionar perfil según sesgo */
  get: function(sesgo){
    var pool;
    if(!sesgo){
      pool = N81FeedbackMatrix._profiles.sin_datos;
    } else if(!sesgo.sesgado){
      pool = N81FeedbackMatrix._profiles.equilibrado;
    } else if(sesgo.top==='Contabilidad'){
      pool = N81FeedbackMatrix._profiles.tecnico_fuerte;
    } else if(sesgo.top==='Administración'){
      pool = N81FeedbackMatrix._profiles.estratega_fuerte;
    } else if(sesgo.top==='Sociales'){
      pool = N81FeedbackMatrix._profiles.social_fuerte;
    } else {
      pool = N81FeedbackMatrix._profiles.equilibrado;
    }
    return pool[Math.floor(Math.random()*pool.length)];
  },

  /* Renderizar el feedback psicológico en un contenedor */
  render: function(containerId){
    var el = document.getElementById(containerId);
    if(!el) return;
    var sesgo = typeof N81SesgoEngine!=='undefined' ? N81SesgoEngine.compute() : null;
    var msg   = N81FeedbackMatrix.get(sesgo);
    el.innerHTML =
      '<div class="n81-feedback-card">'+
        '<div class="n81-fc-header"><span class="n81-fc-icon">🪞</span> Espejo Cognitivo</div>'+
        '<div class="n81-fc-msg">"'+msg+'"</div>'+
        (sesgo&&sesgo.sesgado
          ? '<div class="n81-fc-action">Desbalance actual: <strong style="color:#ef4444">'+sesgo.delta+'%</strong> entre '+sesgo.top+' y '+sesgo.bot+'</div>'
          : '')+
      '</div>';
  }
};
window.N81FeedbackMatrix = N81FeedbackMatrix;

/* ── T1: SIMULADOR DE MERCADO — Noticias del VIRCH ────────────────────── */
var NOTICIAS_VIRCH = [];   /* v8.4: cargado lazy desde noticias.json */
window._n82NoticiasLoaded = false;
(function(){
  fetch('noticias.json').then(function(r){return r.json();}).then(function(d){
    NOTICIAS_VIRCH=d;
    window._n82NoticiasLoaded=true;
  }).catch(function(){});
})();
/* Motor del Simulador de Mercado */
var N82Mercado = {
  _estado: {},   /* { noticiaId: { respondidas: Set, correctas: int } } */

  render: function(containerId){
    var el = document.getElementById(containerId);
    if(!el) return;
    var html =
      '<div class="n82-mkt-header">'+
        '<span class="n82-mkt-icon">📰</span>'+
        '<div>'+
          '<div class="n82-mkt-title">Mercado Real — VIRCH</div>'+
          '<div class="n82-mkt-sub">Contabilidad aplicada a noticias locales</div>'+
        '</div>'+
      '</div>'+
      '<div class="n82-noticias">';

    NOTICIAS_VIRCH.forEach(function(n){
      /* dificultad: OK=básica, WARN=media, ERR=avanzada — tokens semánticos v19.3.1 */
      var difColor = {
        basica:  'var(--color-ok,#3fb950)',
        media:   'var(--color-warn,#e3b341)',
        avanzada:'var(--color-err,#f85149)'
      }[n.dificultad] || NEXUS_COLORS.materias.soc.base;
      html +=
        '<div class="n82-noticia" id="n82-n-'+n.id+'">'+
          '<div class="n82-n-header">'+
            '<span class="n82-n-fecha">'+n.fecha+' · '+n.fuente+'</span>'+
            '<span class="n82-n-dif" style="color:'+difColor+'">'+n.dificultad+'</span>'+
          '</div>'+
          '<div class="n82-n-titulo">'+n.titulo+'</div>'+
          '<div class="n82-n-texto">'+n.texto+'</div>'+
          '<div class="n82-n-ejercicio">'+
            '<div class="n82-ej-label">✏ Ejercicio contable:</div>'+
            '<div class="n82-ej-texto">'+(n.ejercicio||'').replace(/\n/g,'<br>')+'</div>'+
            '<div class="n82-n-pasos">';

      n.solucion.forEach(function(paso, pi){
        html +=
          '<div class="n82-paso" id="n82-p-'+n.id+'-'+pi+'" '+
          'onclick="N82Mercado._evalPaso(\''+n.id+'\','+pi+','+paso.correcto+')">'+
            '<div class="n82-paso-check"></div>'+
            '<div class="n82-paso-txt">'+paso.texto+'</div>'+
          '</div>';
      });

      html +=
            '</div>'+
            '<div class="n82-n-result" id="n82-r-'+n.id+'" style="display:none"></div>'+
            '<button class="n82-n-eval" onclick="N82Mercado._evalNoticia(\''+n.id+'\')">Evaluar respuesta</button>'+
          '</div>'+
        '</div>';
    });

    html += '</div>';
    el.innerHTML = html;
  },

  _sel: {},

  _evalPaso: function(nid, pi, correcto){
    var key = nid+'|'+pi;
    if(N82Mercado._sel[key]) { delete N82Mercado._sel[key]; }
    else { N82Mercado._sel[key] = correcto; }
    var el = document.getElementById('n82-p-'+nid+'-'+pi);
    if(el) el.classList.toggle('n82-paso-sel');
  },

  _evalNoticia: function(nid){
    var noticia = NOTICIAS_VIRCH.find(function(n){ return n.id===nid; });
    if(!noticia) return;
    var correctos = noticia.solucion.filter(function(p){ return p.correcto; }).length;
    var aciertos  = 0, errores = 0;

    noticia.solucion.forEach(function(paso, pi){
      var key = nid+'|'+pi;
      var seleccionado = key in N82Mercado._sel;
      var el = document.getElementById('n82-p-'+nid+'-'+pi);
      if(!el) return;
      el.style.pointerEvents='none';
      if(paso.correcto && seleccionado)  { el.classList.add('n82-paso-ok');  aciertos++; }
      if(!paso.correcto && seleccionado) { el.classList.add('n82-paso-mal'); errores++;  }
      if(paso.correcto && !seleccionado) { el.classList.add('n82-paso-miss'); }
    });

    var pct = Math.round(Math.max(0, (aciertos-errores)/correctos)*100);
    var res = document.getElementById('n82-r-'+nid);
    if(res){
      res.innerHTML =
        '<span class="n82-r-pct" style="color:'+(pct>=70?'var(--color-ok,#4ade80)':'var(--color-err,#f87171)')+'">'+pct+'%</span> '+
        (pct>=70?'¡Correcto! Dominio contable aplicado al VIRCH. 🎯':
                 'Repasá el concepto de variaciones patrimoniales y tipos de asientos.');
      res.style.display='block';
    }
    /* Guardar score */
    if(typeof saveScore==='function') saveScore('mercado_'+nid, aciertos, correctos);
  }
};
window.N82Mercado = N82Mercado;

/* ── T2: GENERADOR DE CV DINÁMICO ─────────────────────────────────────── */
window.n82DownloadCV = function(){
  var rango = {};
  try{ rango = N80Rangos.compute(); }catch(e){ rango = { rango:{label:'Ingresante',badge:'📗'}, leidos:0, quizzes:0, avg:0 }; }

  var scores={}, leidos={}, answers={};
  try{ scores=JSON.parse(localStorage.getItem('fce_portal_scores_v1')||'{}'); }catch(e){}
  try{ leidos=JSON.parse(localStorage.getItem('nexus_leidos_v1')||'{}'); }catch(e){}
  try{ answers=JSON.parse(localStorage.getItem('nexus71_answers_v1')||'{}'); }catch(e){}

  var fecha = new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'});
  var nombre = (NEXUS_STATE.fceUsuario && NEXUS_STATE.fceUsuario.email)
    ? NEXUS_STATE.fceUsuario.email.split('@')[0] : 'Alumno FCE';

  /* Calcular dominios por materia */
  var matColors=NEXUS_NAME_COLORS;
  var dominioRows='';
  ['Contabilidad','Administración','Sociales','Propedéutica'].forEach(function(mat){
    var matKey=mat.replace(' ','').toLowerCase();
    var matScores=Object.keys(scores).filter(function(k){ return k.indexOf(matKey)!==-1||k.indexOf(mat.split(' ')[0].toLowerCase())!==-1; });
    var avg=matScores.length>0?Math.round(matScores.reduce(function(a,k){ return a+((scores[k].best||scores[k].last||{}).pct||0); },0)/matScores.length):0;
    var bar=Math.min(100,avg);
    dominioRows+='<tr><td style="padding:5pt 8pt;font-family:Georgia,serif;font-size:9.5pt">'+mat+'</td>'+
      '<td style="padding:5pt 8pt"><div style="height:8pt;background:#eee;border-radius:3pt"><div style="height:100%;width:'+bar+'%;background:'+matColors[mat]+';border-radius:3pt"></div></div></td>'+
      '<td style="padding:5pt 8pt;text-align:right;font-weight:700;font-family:Arial,sans-serif;font-size:9pt;color:'+matColors[mat]+'">'+avg+'%</td></tr>';
  });

  /* Mejores respuestas de autoevaluación */
  var mejoresHTML='';
  Object.keys(answers).slice(0,4).forEach(function(k){
    var a=answers[k];
    mejoresHTML+='<div style="margin-bottom:8pt;border-left:3pt solid #1e3a8a;padding-left:8pt">'+
      '<div style="font-family:Arial,sans-serif;font-size:8pt;font-weight:700;color:#1e3a8a">'+a.termino+'</div>'+
      '<div style="font-family:Georgia,serif;font-size:9pt;line-height:1.45;color:#333">'+a.respuesta+'</div></div>';
  });

  var html='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>CV — '+nombre+'</title></head><body style="font-family:Arial,sans-serif;max-width:800px;margin:30px auto;color:#111;font-size:10.5pt">'+

    '<div style="border-top:4pt solid #1e3a8a;padding-top:12pt;margin-bottom:20pt">'+
      '<div style="font-size:7.5pt;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#1e3a8a;margin-bottom:4pt">DOCUMENTO DE IDONEIDAD ACADÉMICA</div>'+
      '<div style="font-size:7pt;color:#888">Facultad de Ciencias Económicas · UNPSJB · Trelew, Patagonia</div>'+
    '</div>'+

    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20pt">'+
      '<div>'+
        '<div style="font-family:Georgia,serif;font-size:22pt;font-weight:700;letter-spacing:-.02em">'+nombre+'</div>'+
        '<div style="font-size:9pt;color:#555;margin-top:4pt">Estudiante · Ciclo Inicial FCE UNPSJB 2026</div>'+
        '<div style="margin-top:8pt;display:inline-block;border:1.5pt solid #1e3a8a;border-radius:4pt;padding:4pt 10pt;font-size:9pt;color:#1e3a8a;font-weight:700">'+rango.rango.badge+' '+rango.rango.label+'</div>'+
      '</div>'+
      '<div style="text-align:right;font-size:8pt;color:#aaa">'+
        '<div>Emitido: '+fecha+'</div>'+
        '<div>Portal NEXUS v8.2</div>'+
        '<div style="margin-top:4pt;font-size:7pt">Documento generado automáticamente<br>basado en actividad verificada del alumno</div>'+
      '</div>'+
    '</div>'+

    '<h2 style="font-size:11pt;border-bottom:1pt solid #ddd;padding-bottom:4pt;color:#1e3a8a;letter-spacing:.05em;text-transform:uppercase">Perfil de Desempeño Académico</h2>'+
    '<table style="width:100%;border-collapse:collapse;margin-bottom:16pt">'+
      '<thead><tr style="background:#f0f4ff"><th style="padding:5pt 8pt;text-align:left;font-size:8pt;text-transform:uppercase;letter-spacing:.06em;color:#1e3a8a">Materia</th><th style="padding:5pt 8pt;text-align:left;font-size:8pt;color:#1e3a8a">Dominio</th><th style="padding:5pt 8pt;font-size:8pt;color:#1e3a8a">%</th></tr></thead>'+
      '<tbody>'+dominioRows+'</tbody>'+
    '</table>'+

    '<h2 style="font-size:11pt;border-bottom:1pt solid #ddd;padding-bottom:4pt;color:#1e3a8a;letter-spacing:.05em;text-transform:uppercase">Indicadores de Actividad</h2>'+
    '<table style="width:100%;border-collapse:collapse;margin-bottom:16pt">'+
      '<tr><td style="padding:5pt 8pt;font-size:9.5pt">Materiales leídos</td><td style="padding:5pt 8pt;font-weight:700;text-align:right">'+rango.leidos+'</td></tr>'+
      '<tr style="background:#f9f9f9"><td style="padding:5pt 8pt;font-size:9.5pt">Evaluaciones completadas</td><td style="padding:5pt 8pt;font-weight:700;text-align:right">'+rango.quizzes+'</td></tr>'+
      '<tr><td style="padding:5pt 8pt;font-size:9.5pt">Promedio en evaluaciones</td><td style="padding:5pt 8pt;font-weight:700;text-align:right">'+rango.avg+'%</td></tr>'+
    '</table>'+

    (mejoresHTML?'<h2 style="font-size:11pt;border-bottom:1pt solid #ddd;padding-bottom:4pt;color:#1e3a8a;letter-spacing:.05em;text-transform:uppercase">Producciones Propias Destacadas</h2>'+mejoresHTML:'')+'<p style="margin-top:24pt;font-size:7.5pt;color:#bbb;border-top:0.5pt solid #eee;padding-top:8pt">Este documento certifica la actividad registrada en el Portal NEXUS FCE UNPSJB. No reemplaza documentación académica oficial de la institución.</p></body></html>';

  var blob=new Blob([html],{type:'text/html'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url; a.download='CV_FCE_NEXUS_'+nombre+'_'+new Date().toISOString().split('T')[0]+'.html';
  a.click(); setTimeout(function(){ URL.revokeObjectURL(url); },1000);
};

/* ── T3: INTEGRIDAD DE DATOS — Checksum djb2 ──────────────────────────── */
var N82Integrity = {
  /* Claves protegidas */
  KEYS: ['fce_portal_scores_v1','nexus_leidos_v1','nexus71_answers_v1','cne_mastery'],
  HASH_KEY: 'nexus82_integrity_v1',

  /* Hash djb2 — simple, reproducible, sin dependencias */
  _hash: function(str){
    var hash=5381;
    for(var i=0;i<str.length;i++){
      hash=((hash<<5)+hash)+str.charCodeAt(i);
      hash=hash&hash; /* 32-bit */
    }
    return (hash>>>0).toString(36);
  },

  /* Calcular hash de todos los datos protegidos */
  _computeHash: function(){
    var salt = NEXUS_STATE.fceUsuario ? NEXUS_STATE.fceUsuario.uid.substring(0,8) : 'nexus82';
    var combined = salt;
    N82Integrity.KEYS.forEach(function(k){
      combined += k + (localStorage.getItem(k)||'');
    });
    return N82Integrity._hash(combined);
  },

  /* Guardar checkpoint de integridad */
  save: function(){
    try{ localStorage.setItem(N82Integrity.HASH_KEY, N82Integrity._computeHash()); }catch(e){}
  },

  /* Verificar integridad — llamar al iniciar sesión */
  verify: function(){
    try{
      var stored = localStorage.getItem(N82Integrity.HASH_KEY);
      if(!stored) { N82Integrity.save(); return true; } /* primera vez */
      var current = N82Integrity._computeHash();
      if(stored !== current){
        /* Manipulación detectada */
        N82Integrity._onTamper();
        return false;
      }
      return true;
    }catch(e){ return true; }
  },

  _onTamper: function(){
    /* Reset del rango — no resetear scores/leídos (serían consecuencias excesivas) */
    try{
      localStorage.removeItem('nexus80_rango_v1');
      localStorage.removeItem(N82Integrity.HASH_KEY);
      if(typeof N80Rangos!=='undefined') N80Rangos.apply();
    }catch(e){}
    /* Aviso al alumno */
    setTimeout(function(){
      var msg = document.createElement('div');
      msg.className = 'n82-tamper-alert';
      msg.innerHTML =
        '<span class="n82-ta-icon">⚠</span>'+
        '<div class="n82-ta-body"><strong>Integridad comprometida.</strong> Se detectó una modificación manual de los datos de progreso. '+
        'El rango ha sido reiniciado. La ética profesional comienza con la honestidad en el proceso de aprendizaje.</div>'+
        '<button onclick="this.parentNode.remove()">Entendido</button>';
      document.body.appendChild(msg);
    }, 2000);
  }
};
window.N82Integrity = N82Integrity;

/* ── T1: GLOSARIO MULTILINGÜE — fetch lazy + hover tooltip ───────────── */
var N83Glossary = {
  _data: null,
  _loading: false,
  _tooltip: null,

  /* Fetch lazy al primer hover — se cachea en memoria */
  load: function(){
    if(N83Glossary._data||N83Glossary._loading) return;
    N83Glossary._loading=true;
    fetch('glossary.json').then(function(r){ return r.json(); })
      .then(function(d){
        N83Glossary._data=d;
        N83Glossary._loading=false;
      })
      .catch(function(){ N83Glossary._loading=false; });
  },

  /* Crear tooltip singleton */
  _getTooltip: function(){
    if(!N83Glossary._tooltip){
      var t=document.createElement('div');
      t.id='n83-glossary-tip';
      t.className='n83-tooltip';
      t.style.display='none';
      document.body.appendChild(t);
      /* Cerrar al click fuera */
      document.addEventListener('click',function(e){
        if(!e.target.closest('.n83-gterm')&&!e.target.closest('#n83-glossary-tip')){
          N83Glossary.hide();
        }
      });
      N83Glossary._tooltip=t;
    }
    return N83Glossary._tooltip;
  },

  show: function(term, anchorEl){
    if(!N83Glossary._data){ N83Glossary.load(); return; }
    var key=(term||'').toLowerCase().trim();
    var entry=N83Glossary._data[key];
    if(!entry) return;

    var t=N83Glossary._getTooltip();
    var _pibe = entry.explicacion_pibe || '';
    t.innerHTML=
      '<div class="n83-t-header">'+
        '<span class="n83-t-term">'+term+'</span>'+
        '<span class="n83-t-en-badge">/ '+entry.en+'</span>'+
        '<button class="n83-t-close" onclick="N83Glossary.hide()">✕</button>'+
      '</div>'+
      (_pibe?'<div class="n83-t-pibe">💬 '+_pibe+'</div>':'')+
      '<div class="n83-t-row n83-t-ref"><span class="n83-t-lang">Ref.</span>'+
        '<span class="n83-t-val n83-t-muted">'+entry.niif+'</span></div>'

    /* Posicionar cerca del elemento */
    var rect=anchorEl.getBoundingClientRect();
    t.style.display='block';
    var tw=t.offsetWidth||260;
    var left=Math.min(rect.left+window.scrollX, window.innerWidth-tw-16);
    t.style.left=Math.max(8,left)+'px';
    t.style.top=(rect.bottom+window.scrollY+6)+'px';
  },

  hide: function(){
    var t=N83Glossary._tooltip;
    if(t) t.style.display='none';
  },

  /* Marcar todos los términos del glosario en un well */
  annotate: function(wellEl){
    if(!wellEl) return;
    /* Cargar glosario en background */
    N83Glossary.load();

    /* Después de 1s (cuando el glosario probablemente ya cargó) marcar términos */
    setTimeout(function(){
      if(!N83Glossary._data) return;
      var terms=Object.keys(N83Glossary._data);
      var walker=document.createTreeWalker(wellEl, NodeFilter.SHOW_TEXT);
      var nodes=[];
      var node;
      while((node=walker.nextNode())) nodes.push(node);

      nodes.forEach(function(textNode){
        if(textNode.parentNode&&textNode.parentNode.className&&
           textNode.parentNode.className.indexOf('n83-gterm')!==-1) return;
        var text=textNode.nodeValue||'';
        var hit=terms.find(function(t){ return text.toLowerCase().indexOf(t)!==-1 && t.length>4; });
        if(!hit) return;
        var re=new RegExp('('+hit.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','i');
        var m=re.exec(text);
        if(!m) return;
        var span=document.createElement('span');
        span.className='n83-gterm';
        span.textContent=m[1];
        span.setAttribute('data-term',hit);
        span.addEventListener('mouseenter',function(){ N83Glossary.show(hit,this); });
        span.addEventListener('click',function(e){ e.stopPropagation(); N83Glossary.show(hit,this); });
        var after=textNode.splitText(m.index);
        after.nodeValue=after.nodeValue.substring(m[1].length);
        textNode.parentNode.insertBefore(span,after);
      });
    }, 1000);
  }
};
window.N83Glossary=N83Glossary;

/* ── T2: COMPARATIVA REGIONAL — fetch lazy ────────────────────────────── */
/* ids: argentina bologna chile alemania mexico */
var N83Comparativa = {
  _data: null,

  load: function(cb){
    if(N83Comparativa._data){ if(cb) cb(N83Comparativa._data); return; }
    fetch('comparativa.json').then(function(r){ return r.json(); })
      .then(function(d){ N83Comparativa._data=d; if(cb) cb(d); })
      .catch(function(){ if(cb) cb(null); });
  },

  render: function(containerId){
    var el=document.getElementById(containerId);
    if(!el) return;
    el.innerHTML='<div class="n83-loading-comp">Cargando comparativa…</div>';
    N83Comparativa.load(function(data){
      if(!data){ el.innerHTML='<p style="color:rgba(255,255,255,.4)">Comparativa no disponible.</p>'; return; }
      var sistemas=data.sistemas;
      var html=
        '<div class="n83-comp-header">'+
          '<span class="n83-comp-icon">🌐</span>'+
          '<div>'+
            '<div class="n83-comp-title">Comparativa Global de Sistemas Universitarios</div>'+
            '<div class="n83-comp-mentor">"Usted sabe cómo funciona la UNPSJB. ¿Sabe cómo se gestiona la Universidad de Bolonia? Compárelos."</div>'+
          '</div>'+
        '</div>'+
        '<div class="n83-comp-selector">';
      sistemas.forEach(function(s,i){
        html+='<button class="n83-cs-btn'+(i===0?' n83-cs-active':'')+'" data-id="'+s.id+'" onclick="N83Comparativa._select(\''+s.id+'\')">'+s.flag+' '+s.nombre.split('—')[0].trim()+'</button>';
      });
      html+='</div><div id="n83-comp-detail"></div>';
      el.innerHTML=html;
      N83Comparativa._select('argentina');
    });
  },

  _select: function(id){
    if(!N83Comparativa._data) return;
    var sistema=N83Comparativa._data.sistemas.find(function(s){ return s.id===id; });
    if(!sistema) return;

    /* Actualizar botón activo */
    document.querySelectorAll('.n83-cs-btn').forEach(function(b){ b.classList.toggle('n83-cs-active', b.dataset.id===id); });

    var dims=N83Comparativa._data.dimensiones;
    var detail=document.getElementById('n83-comp-detail');
    if(!detail) return;

    /* Tabla comparativa con Argentina como referencia */
    var arg=N83Comparativa._data.sistemas[0];
    var isArg=id==='argentina';

    var html=
      '<div class="n83-comp-card">'+
        '<div class="n83-cc-title">'+sistema.flag+' '+sistema.nombre+'</div>'+
        (isArg?'':'<div class="n83-cc-ref">vs Argentina → '+arg.flag+'</div>')+
        '<table class="n83-comp-table">';
    dims.forEach(function(dim){
      var val=sistema[dim.id]||'—';
      var ref=isArg?null:(arg[dim.id]||'—');
      html+='<tr class="n83-comp-row"><td class="n83-comp-dim">'+dim.label+'</td>'+
        '<td class="n83-comp-val">'+val+(ref&&!isArg?'<div class="n83-comp-arg-ref">🇦🇷 '+ref+'</div>':'')+'</td></tr>';
    });
    html+='</table>'+
      '<div class="n83-cc-footer">'+
        '<span class="n83-cc-year">Vigente desde '+sistema.año_ley+'</span>'+
        '<span class="n83-cc-model">'+sistema.modelo+'</span>'+
      '</div>'+
      '<div class="n83-cc-ref-legal">📖 '+sistema.referencia_legal+'</div>'+
    '</div>';
    detail.innerHTML=html;
  }
};
window.N83Comparativa=N83Comparativa;

window.n83OpenComparativa=function(){
  goto('comparativa-global',null);
  setTimeout(function(){ N83Comparativa.render('comparativa-content'); },200);
};

/* ── T3: OPTIMIZACIÓN — Defer engines pesados post-load ───────────────── */
var N83Perf = {
  /* Medir tiempo de carga real */
  _t0: Date.now(),

  /* Diferir engines no críticos al idle post-boot */
  deferNonCritical: function(){
    var idle = window.requestIdleCallback || function(fn){ setTimeout(fn,150); };
    /* Los engines de análisis pesado se inicializan en idle */
    idle(function(){
      /* Neural Search index — no es crítico en primer render */
      if(typeof NexusSearch!=='undefined'&&!NexusSearch._idx&&NexusCore.getMateriales()){
        NexusSearch.build();
      }
    },{ timeout:3000 });
    idle(function(){
      /* Glosario — prefetch en background */
      if(typeof N83Glossary!=='undefined') N83Glossary.load();
    },{ timeout:5000 });
  },

  /* Reportar tiempo de carga al console (solo desarrollo) */
  report: function(){
    var ms=Date.now()-N83Perf._t0;
    if(NEXUS_STATE.fceUsuario && window.location.hostname==='localhost'){
      /* Solo en localhost — no contaminar producción */
    }
    return ms;
  }
};
window.N83Perf=N83Perf;

/* ── T1: ALGORITMO DE FATIGA COGNITIVA ──────────────────────────────────── */
var N84Fatigue = {
  THRESHOLD_MS: 5 * 60 * 1000,   /* 5 minutos */
  _timers: {},

  /* Iniciar rastreador cuando se abre un card de Contabilidad/Administración */
  track: function(cardId, materia, item) {
    if(!cardId) return;
    if(materia !== 'Contabilidad' && materia !== 'Administración') return;
    if(N84Fatigue._timers[cardId]) return; /* ya rastreando */

    var lastScroll = Date.now();
    var wellEl = document.getElementById(cardId);
    if(!wellEl) return;

    /* Cancelar si hay scroll — el alumno avanza */
    var onScroll = function() { lastScroll = Date.now(); };
    var scrollHost = document.getElementById('main') || window;
    scrollHost.addEventListener('scroll', onScroll, { passive: true });

    var timer = setInterval(function() {
      var now = Date.now();
      if(now - lastScroll >= N84Fatigue.THRESHOLD_MS) {
        clearInterval(timer);
        scrollHost.removeEventListener('scroll', onScroll);
        delete N84Fatigue._timers[cardId];
        N84Fatigue._triggerBreak(cardId, item);
      }
    }, 15000);   /* checkear cada 15s */

    N84Fatigue._timers[cardId] = { timer: timer, onScroll: onScroll, host: scrollHost };
  },

  cancel: function(cardId) {
    if(!N84Fatigue._timers[cardId]) return;
    var t = N84Fatigue._timers[cardId];
    clearInterval(t.timer);
    if(t.host) t.host.removeEventListener('scroll', t.onScroll);
    delete N84Fatigue._timers[cardId];
  },

  /* Disparar Break Estructural */
  _triggerBreak: function(cardId, item) {
    var card = document.getElementById(cardId);
    if(!card) return;
    var well = card.querySelector('.mc-well');
    if(!well || well.querySelector('.n84-break')) return;

    var tip = N84Fatigue._getTip(item && item.materia);

    /* Ocultar el cuerpo denso */
    well.classList.add('n84-well-faded');

    var breakEl = document.createElement('div');
    breakEl.className = 'n84-break';
    breakEl.innerHTML =
      '<div class="n84-br-icon">☕</div>' +
      '<div class="n84-br-title">Break Estructural — 5 min de estudio intenso</div>' +
      '<p class="n84-br-tip">' + tip + '</p>' +
      '<div class="n84-br-actions">' +
        '<button class="n84-br-continue" onclick="N84Fatigue._dismiss(this)">Continuar leyendo →</button>' +
        '<button class="n84-br-back" onclick="goto(\'home\',null)">Ir al Dashboard</button>' +
      '</div>';
    well.appendChild(breakEl);
  },

  _dismiss: function(btn) {
    var breakEl = btn.closest('.n84-break');
    if(breakEl) breakEl.remove();
    var well = document.querySelector('.n84-well-faded');
    if(well) well.classList.remove('n84-well-faded');
  },

  _TIPS: [ '💡 Regla 52/17: estudia 52 minutos, descansa 17. Los estudios de productividad de Desktime lo confirman. Ya hiciste tu cuota.', '🧠 La memoria consolida durante el descanso. Lo que leíste se está fijando ahora mismo. No te preocupes.', '⚡ La fatiga cognitiva reduce la retención en un 40%. Un vaso de agua y 2 minutos afuera valen más que 10 minutos más de lectura forzada.', '📌 Tomá nota de dónde quedaste con una sola palabra clave. Eso activa la recuperación cuando volvés.', '🌬 Tres respiraciones profundas activan el nervio vago y reducen el cortisol de estudio. En serio.', ],
  _tipIdx: 0,
  _getTip: function(materia) {
    var tip = N84Fatigue._TIPS[N84Fatigue._tipIdx % N84Fatigue._TIPS.length];
    N84Fatigue._tipIdx++;
    return tip;
  }
};
window.N84Fatigue = N84Fatigue;

/* ── T2: TRAMPAS DE EXAMEN — Entrenamiento de Auditoría ─────────────────── */
var TRAMPAS_BANCO = [
  /* Contabilidad */
  { id:'t-c01', materia:'Contabilidad', trampa:'El IVA Crédito Fiscal es un <span class="adm-trap">gasto deducible del resultado del ejercicio</span>.', correcta:'El IVA CF es un Activo (crédito contra AFIP), no un gasto.', nivel:'básica' },
  { id:'t-c02', materia:'Contabilidad', trampa:'La compra de mercaderías al contado es una variación patrimonial <span class="adm-trap">modificativa positiva</span> porque aumenta el stock.', correcta:'Es permutativa: ↑ Mercaderías ↓ Caja. PN sin cambio.', nivel:'media' },
  { id:'t-c03', materia:'Contabilidad', trampa:'En el asiento de una venta a crédito, el Debe corresponde a <span class="adm-trap">Ventas</span> y el Haber a Clientes.', correcta:'Invertido: Debe Clientes / Haber Ventas + IVA DF.', nivel:'básica' },
  { id:'t-c04', materia:'Contabilidad', trampa:'La Nota de Débito emitida por el proveedor <span class="adm-trap">reduce la deuda</span> del cliente con ese proveedor.', correcta:'La Nota de Débito AUMENTA la deuda (cargos adicionales). La Nota de Crédito la reduce.', nivel:'media' },
  /* Administración */
  { id:'t-a01', materia:'Administración', trampa:'Max Weber pertenece a la <span class="adm-trap">Escuela Clásica de la Administración</span>, junto con Taylor y Fayol.', correcta:'Weber es Estructuralista, no Clásico. Taylor+Fayol = Clásica.', nivel:'media' },
  { id:'t-a02', materia:'Administración', trampa:'Según Carroll, la primera responsabilidad de la empresa es la <span class="adm-trap">filantrópica</span>, base de la pirámide de RSE.', correcta:'La base es la responsabilidad económica. Filantrópica está en la cima.', nivel:'media' },
  { id:'t-a03', materia:'Administración', trampa:'En la teoría de stakeholders de Freeman, los accionistas son <span class="adm-trap">los únicos grupos de interés relevantes</span>.', correcta:'Freeman amplía el concepto: todos los afectados/afectantes son stakeholders.', nivel:'básica' },
  /* Sociales */
  { id:'t-s01', materia:'Sociales', trampa:'El habitus de Bourdieu es un <span class="adm-trap">rasgo psicológico individual innato</span>, como la personalidad.', correcta:'El habitus es socialmente construido e incorporado. No es innato ni puramente individual.', nivel:'media' },
  { id:'t-s02', materia:'Sociales', trampa:'Para Bachelard, el conocimiento científico <span class="adm-trap">parte de la observación directa</span> y la acumula progresivamente.', correcta:'Bachelard dice lo contrario: la ciencia va EN CONTRA de la experiencia inmediata.', nivel:'avanzada' },
];
window.TRAMPAS_BANCO = TRAMPAS_BANCO;

var N84Trampas = {
  LS_KEY: 'nexus84_trampas_v1',
  _activas: {},
  inject: function(wellEl, item) {
    if(!wellEl || !item || item.tipo !== 'Resumen') return;
    if(wellEl.querySelector('.n84-trampa-wrap')) return;
    var mat = item.materia || '';
    var pool = TRAMPAS_BANCO.filter(function(t) {
      return t.materia === mat || t.materia === mat.replace(' I','').trim();
    });
    if(!pool.length) return;
    var seen = {};
    try { seen = JSON.parse(localStorage.getItem(N84Trampas.LS_KEY) || '{}'); } catch(e) {}
    var unused = pool.filter(function(t) { return !seen[t.id]; });
    var trampa = (unused.length ? unused : pool)[Math.floor(Math.random() * (unused.length || pool.length))];
    var wrap = document.createElement('div');
    wrap.className = 'n84-trampa-wrap';
    wrap.innerHTML =
      '<div class="n84-tr-header">' +
        '<span class="n84-tr-icon">🕵</span>' +
        '<span class="n84-tr-label">Trampa de Examen — encontrá el error</span>' +
        '<span class="n84-tr-nivel">' + trampa.nivel + '</span>' +
      '</div>' +
      '<div class="n84-tr-texto">' + trampa.trampa + '</div>' +
      '<div class="n84-tr-actions">' +
        '<button class="n84-tr-found" onclick="N84Trampas._evaluar(this,\''+trampa.id+'\',true)">Encontré el error ✓</button>' +
        '<button class="n84-tr-notrap" onclick="N84Trampas._evaluar(this,\''+trampa.id+'\',false)">No hay error aquí</button>' +
      '</div>' +
      '<div class="n84-tr-result" id="n84-tr-r-' + trampa.id + '" style="display:none"></div>';
    wellEl.appendChild(wrap);
    N84Trampas._activas[trampa.id] = trampa;
  },
  _evaluar: function(btn, tid, marcoError) {
    var trampa = N84Trampas._activas[tid];
    if(!trampa) return;
    var wrap = btn.closest('.n84-trampa-wrap');
    if(wrap) wrap.querySelectorAll('button').forEach(function(b){ b.disabled=true; });
    var correcto = marcoError;
    var resEl = document.getElementById('n84-tr-r-'+tid);
    if(resEl) {
      resEl.innerHTML = correcto
        ? '<span style="color:var(--color-ok,#4ade80)">✓ ¡Correcto!</span> <strong>Error identificado:</strong> ' + trampa.correcta
        : '<span style="color:var(--color-err,#f87171)">✗ Hay un error.</span> <strong>Era:</strong> ' + trampa.correcta;
      resEl.style.display = 'block';
    }
    if(correcto) {
      try {
        var seen = JSON.parse(localStorage.getItem(N84Trampas.LS_KEY)||'{}');
        seen[tid] = Date.now();
        localStorage.setItem(N84Trampas.LS_KEY, JSON.stringify(seen));
      } catch(e) {}
      if(typeof N82Integrity !== 'undefined') N82Integrity.save();
    }
  }
};
window.N84Trampas = N84Trampas;

/* ── T3: NAVEGACIÓN HÁPTICA — Gestos swipe ───────────────────────────────── */
var N84Swipe = {
 _tx: 0, _ty: 0, _active: false, _startTarget: null,
 MIN_DELTA: 80, /* px mínimos para contar como swipe */
 init: function() {
 document.addEventListener('touchstart',  N84Swipe._onStart,  { passive: true });
 document.addEventListener('touchend',    N84Swipe._onEnd,    { passive: true });
 document.addEventListener('touchcancel', N84Swipe._onCancel, { passive: true });
 },
 _reset: function() {
   N84Swipe._active = false;
   N84Swipe._startTarget = null;
 },
 _onCancel: function() { N84Swipe._reset(); },
 _onStart: function(e) {
 if(!e.touches.length) return;
 N84Swipe._tx = e.touches[0].clientX;
 N84Swipe._ty = e.touches[0].clientY;
 N84Swipe._active = true;
 N84Swipe._startTarget = e.target;
 },
 _onEnd: function(e) {
 if(!N84Swipe._active) return;
 N84Swipe._active = false;
 if(!e.changedTouches.length) return;
 /* v19.3.2 — no interferir con el botón #ham ni con links/botones del sidebar */
 var st = N84Swipe._startTarget;
 if(st && (st.closest('#ham') || st.closest('.sb-item') || st.closest('.sb-subject'))) return;
 var dx = e.changedTouches[0].clientX - N84Swipe._tx;
 var dy = e.changedTouches[0].clientY - N84Swipe._ty;
 var ax = Math.abs(dx), ay = Math.abs(dy);
 if(Math.max(ax, ay) < N84Swipe.MIN_DELTA) return;
 var target = e.target;
 if(target.closest('input,textarea,.ns-input,.q55-opt,.mc-well,#ham')) return;
 if(ax > ay) {if(dx > 0 && !document.getElementById('sb').classList.contains('open')) {if(typeof toggleSb === 'function') toggleSb();
 } else if(dx < 0 && document.getElementById('sb').classList.contains('open')) {if(typeof toggleSb === 'function') toggleSb();
 }
 }
 /* v19.3.2 — gestos verticales desactivados: interfieren con scroll natural en mobile.
    Reactivar cuando Training Ground y Radar sean features completas. */
 },
 /* Feedback visual del gesto */
 _flash: function(label) {
 var el = document.createElement('div');
 el.className = 'n84-swipe-flash';
 el.textContent = label;
 document.body.appendChild(el);
 setTimeout(function() { if(el.parentNode) el.parentNode.removeChild(el); }, 800);
 }
};
window.N84Swipe = N84Swipe;

/* ── T1: CALENDARIO CRÍTICO FCE ──────────────────────────────────────────── */
var CALENDARIO_FCE = {
  ciclo: 'Ciclo Inicial 2026',
  parciales: [
    { id:'p1-cont', materia:'Contabilidad',  label:'1er Parcial Contabilidad',  fecha:'2026-05-07', tipo:'parcial' },
    { id:'p1-adm',  materia:'Administración',label:'1er Parcial Administración', fecha:'2026-05-12', tipo:'parcial' },
    { id:'p1-soc',  materia:'Sociales',       label:'1er Parcial Sociales',       fecha:'2026-05-14', tipo:'parcial' },
    { id:'p1-prop', materia:'Propedéutica',   label:'Entrega TP Propedéutica',    fecha:'2026-05-20', tipo:'tp'      },
    { id:'p2-cont', materia:'Contabilidad',  label:'2do Parcial Contabilidad',   fecha:'2026-07-02', tipo:'parcial' },
    { id:'p2-adm',  materia:'Administración',label:'2do Parcial Administración',  fecha:'2026-07-07', tipo:'parcial' },
    { id:'p2-soc',  materia:'Sociales',       label:'2do Parcial Sociales',       fecha:'2026-07-09', tipo:'parcial' },
    { id:'fin-cont',materia:'Contabilidad',  label:'Final Contabilidad (1ra fecha)',fecha:'2026-08-06', tipo:'final' },
    { id:'fin-adm', materia:'Administración',label:'Final Administración (1ra fecha)',fecha:'2026-08-11', tipo:'final' },
    { id:'fin-soc', materia:'Sociales',       label:'Final Sociales (1ra fecha)',  'fecha':'2026-08-13', tipo:'final' },
  ]
};

var N85Calendario = {
  /* Obtener días hasta un evento */
  diasHasta: function(fechaStr) {
    var hoy  = new Date(); hoy.setHours(0,0,0,0);
    var ev   = new Date(fechaStr + 'T00:00:00');
    return Math.ceil((ev - hoy) / (1000 * 60 * 60 * 24));
  },

  /* Obtener los próximos eventos (≤60 días) */
  proximos: function(limite) {
    limite = limite || 60;
    return CALENDARIO_FCE.parciales
      .map(function(p) { return Object.assign({}, p, { dias: N85Calendario.diasHasta(p.fecha) }); })
      .filter(function(p) { return p.dias >= 0 && p.dias <= limite; })
      .sort(function(a,b) { return a.dias - b.dias; });
  },

  /* Generar mensaje del Mentor para el evento más urgente */
  mentorMsg: function(evento, sesgo) {
    var mat    = evento.materia;
    var dias   = evento.dias;
    var scores = typeof NexusRadarV2 !== 'undefined' ? NexusRadarV2.computeScores() : {};
    var score  = scores[mat] || 0;
    var urgente= dias <= 10;
    var debil  = score < 50 && score > 0;
    var sinDatos= score === 0;

    if(urgente && debil)
      return '⚡ Director, faltan ' + dias + ' días para ' + evento.label + '. Su radar muestra debilidad en ' + mat + ' (' + score + '%). Iniciando plan de emergencia.';
    if(urgente && sinDatos)
      return '🚨 Faltan ' + dias + ' días para ' + evento.label + '. No hay datos de su rendimiento en ' + mat + '. Completá un quiz urgente.';
    if(urgente)
      return '✅ Faltan ' + dias + ' días para ' + evento.label + '. Su ' + mat + ' está en ' + score + '%. Mantené el ritmo.';
    if(debil)
      return '📅 En ' + dias + ' días: ' + evento.label + '. Su ' + mat + ' necesita refuerzo (' + score + '%). Aún hay tiempo.';
    return '📅 En ' + dias + ' días: ' + evento.label + '. ' + mat + ': ' + (score > 0 ? score + '%' : 'sin datos aún') + '.';
  },

  /* Renderizar widget en un contenedor */
  render: function(containerId) {
    var el = document.getElementById(containerId);
    if(!el) return;
    var proxs = N85Calendario.proximos(60);
    if(!proxs.length) {
      el.innerHTML = '<div class="n85-cal-empty">Sin eventos próximos en los próximos 60 días.</div>';
      return;
    }

    var colors = {
      /* v19.3.1 */ ...NEXUS_NAME_COLORS
    };
    var tipoLabel = { parcial:'Parcial', tp:'TP', final:'Final' };

    var html = '<div class="n85-cal-list">';
    proxs.slice(0, 5).forEach(function(p) {
      var color   = colors[p.materia] || NEXUS_COLORS.materias.home.base /* v19.3.2 */;
      var urgente = p.dias <= 10;
      var msg     = N85Calendario.mentorMsg(p);
      html +=
        '<div class="n85-cal-item' + (urgente ? ' n85-urgente' : '') + '" style="border-left-color:' + color + '">' +
          '<div class="n85-ci-header">' +
            '<span class="n85-ci-tipo n85-tipo-' + p.tipo + '">' + tipoLabel[p.tipo] + '</span>' +
            '<span class="n85-ci-mat" style="color:' + color + '">' + p.materia + '</span>' +
            '<span class="n85-ci-dias' + (urgente ? ' n85-dias-urgente' : '') + '">' + p.dias + 'd</span>' +
          '</div>' +
          '<div class="n85-ci-label">' + p.label + '</div>' +
          '<div class="n85-ci-fecha">' + new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-AR', {weekday:'short',day:'2-digit',month:'short'}) + '</div>' +
          '<div class="n85-ci-msg">' + msg + '</div>' +
        '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }
};
window.N85Calendario = N85Calendario;
window.CALENDARIO_FCE = CALENDARIO_FCE;

/* ── T2: SIMULADOR DE TRÁMITES GUARANÍ ──────────────────────────────────── */
var N85Guarani = {
  _tramites: {
    inscripcion_final: {
      titulo: 'Inscripción a Examen Final',
      icon:   '📝',
      descripcion: 'Simulá el proceso de inscripción a una mesa de finales en el sistema SIU-Guaraní.',
      pasos: [
        {
          id: 'ig1', titulo: 'Verificar regularidad',
          descripcion: '¿Tenés la cursada aprobada con asistencia y parciales?',
          opciones: [
            { label: 'Sí, tengo ambos parciales aprobados (≥4)', correcto: true,
              feedback: '✅ Correcto. Necesitás ambos parciales aprobados y 75% de asistencia.' },
            { label: 'Tengo un parcial aprobado y uno recuperado (≥4)', correcto: true,
              feedback: '✅ Con recuperatorio aprobado también sos regular.' },
            { label: 'Me fue mal en ambos parciales pero quiero igual', correcto: false,
              feedback: '❌ Sin regularidad no podés inscribirte a final. Debés recursarla.' },
          ]
        },
        {
          id: 'ig2', titulo: 'Período de inscripción',
          descripcion: '¿Cuándo abrió el período de inscripción a finales de agosto?',
          opciones: [
            { label: '1 semana antes de la fecha del final', correcto: false,
              feedback: '❌ Los períodos suelen abrirse 20-30 días antes, no una semana.' },
            { label: '3-4 semanas antes, en el período habilitado por la FCE', correcto: true,
              feedback: '✅ Correcto. Chequeá el SIU-Guaraní en el período habilitado.' },
            { label: 'El mismo día del examen antes de las 8am', correcto: false,
              feedback: '❌ Imposible. El sistema cierra inscripciones días antes del examen.' },
          ]
        },
        {
          id: 'ig3', titulo: 'Pasos en SIU-Guaraní',
          descripcion: 'Seleccioná el orden correcto de acciones en el sistema:',
          opciones: [
            { label: 'Login → Estudiante → Exámenes → Inscripción → Elegir materia → Elegir fecha → Confirmar', correcto: true,
              feedback: '✅ Ese es el flujo correcto. No olvidés confirmar — muchos se olvidan ese paso.' },
            { label: 'Login → Buscar materia → Inscribirme → Listo', correcto: false,
              feedback: '❌ El proceso tiene más pasos. La confirmación final es crítica.' },
            { label: 'Ir a la secretaría a pedirlo en papel', correcto: false,
              feedback: '❌ Desde 2019 es obligatorio online por SIU-Guaraní. La secretaría no acepta papel.' },
          ]
        }
      ]
    },
    certificado_alumno: {
      titulo: 'Certificado de Alumno Regular',
      icon:   '🎓',
      descripcion: 'Simulá el proceso para obtener tu certificado de alumno regular de la FCE-UNPSJB.',
      pasos: [
        {
          id: 'ca1', titulo: '¿Cuándo lo necesitás?',
          descripcion: 'Algunos organismos piden certificado "con fecha del día". ¿Cómo lo obtenés?',
          opciones: [
            { label: 'SIU-Guaraní → Trámites → Constancias → Alumno Regular → Descargar PDF', correcto: true,
              feedback: '✅ Los certificados digitales firmados electrónicamente tienen validez legal.' },
            { label: 'Hay que pedirlo en la secretaría y esperar 5 días hábiles', correcto: false,
              feedback: '⚠ En la FCE Trelew el digital es inmediato. El físico tiene demora.' },
            { label: 'No existe en digital, siempre va el sello físico', correcto: false,
              feedback: '❌ La Ley 27.446 de Modernización del Estado valida los documentos digitales firmados.' },
          ]
        },
        {
          id: 'ca2', titulo: 'Requisito de materias',
          descripcion: '¿Cuántas materias aprobadas necesitás para ser "alumno regular"?',
          opciones: [
            { label: 'Solo con la inscripción alcanza', correcto: false,
              feedback: '❌ La inscripción te da estado de ingresante, no de alumno regular.' },
            { label: 'Haber aprobado al menos 1 materia y estar inscripto en otras', correcto: true,
              feedback: '✅ El Estatuto UNPSJB define alumno regular como el que aprobó al menos 1 materia en los últimos 3 años.' },
            { label: 'Necesitás el 50% del plan de estudios aprobado', correcto: false,
              feedback: '❌ Ese umbral es para otras condiciones, no para alumno regular básico.' },
          ]
        }
      ]
    }
  },
  _estado: {},

  render: function(containerId) {
    var el = document.getElementById(containerId);
    if(!el) return;
    var html =
      '<div class="n85-gu-header">' +
        '<span class="n85-gu-icon">🏛</span>' +
        '<div><div class="n85-gu-title">Simulador SIU-Guaraní</div>' +
        '<div class="n85-gu-sub">Entrenamiento logístico para trámites de la FCE-UNPSJB</div></div>' +
      '</div>' +
      '<div class="n85-gu-selector">';
    Object.keys(N85Guarani._tramites).forEach(function(key) {
      var t = N85Guarani._tramites[key];
      html += '<button class="n85-gs-btn" onclick="N85Guarani.start(\'' + key + '\')">' +
        t.icon + ' ' + t.titulo + '</button>';
    });
    html += '</div><div id="n85-gu-wizard"></div>';
    el.innerHTML = html;
  },

  start: function(tramiteKey) {
    var t = N85Guarani._tramites[tramiteKey];
    if(!t) return;
    N85Guarani._estado = { key: tramiteKey, paso: 0, correctas: 0 };
    N85Guarani._renderPaso();
  },

  _renderPaso: function() {
    var wiz = document.getElementById('n85-gu-wizard');
    if(!wiz) return;
    var st = N85Guarani._estado;
    var t  = N85Guarani._tramites[st.key];
    var paso = t.pasos[st.paso];
    if(!paso) { N85Guarani._resultado(t); return; }

    var total = t.pasos.length;
    var pct   = Math.round(st.paso / total * 100);

    wiz.innerHTML =
      '<div class="n85-wiz">' +
        '<div class="n85-wiz-prog">' +
          '<div class="n85-wiz-fill" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<div class="n85-wiz-step">Paso ' + (st.paso+1) + ' de ' + total + '</div>' +
        '<div class="n85-wiz-titulo">' + paso.titulo + '</div>' +
        '<div class="n85-wiz-desc">' + paso.descripcion + '</div>' +
        '<div class="n85-wiz-opts">' +
          paso.opciones.map(function(op, i) {
            return '<button class="n85-wiz-opt" onclick="N85Guarani._responder(' + i + ')">' + op.label + '</button>';
          }).join('') +
        '</div>' +
        '<div id="n85-wiz-fb" class="n85-wiz-fb" style="display:none"></div>' +
      '</div>';
  },

  _responder: function(idx) {
    var st   = N85Guarani._estado;
    var t    = N85Guarani._tramites[st.key];
    var paso = t.pasos[st.paso];
    var op   = paso.opciones[idx];
    if(!op) return;

    document.querySelectorAll('.n85-wiz-opt').forEach(function(b){ b.disabled=true; });
    var fb = document.getElementById('n85-wiz-fb');
    if(fb) { fb.textContent = op.feedback; fb.style.display='block';
      fb.className = 'n85-wiz-fb ' + (op.correcto ? 'n85-fb-ok' : 'n85-fb-no'); }

    if(op.correcto) st.correctas++;
    st.paso++;
    setTimeout(N85Guarani._renderPaso, 1800);
  },

  _resultado: function(t) {
    var wiz = document.getElementById('n85-gu-wizard');
    if(!wiz) return;
    var st  = N85Guarani._estado;
    var pct = Math.round(st.correctas / t.pasos.length * 100);
    wiz.innerHTML =
      '<div class="n85-wiz n85-wiz-result">' +
        '<div class="n85-wr-icon">' + (pct===100?'🏆':pct>=50?'📚':'⚠') + '</div>' +
        '<div class="n85-wr-score">' + pct + '%</div>' +
        '<div class="n85-wr-msg">' + (pct===100?'Dominio total del trámite. Podés guiar a tus compañeros.':
          pct>=50?'Buen conocimiento parcial. Repasá los pasos que fallaste.':
          'Necesitás estudiar el reglamento estudiantil. Los errores en trámites tienen consecuencias reales.') + '</div>' +
        '<button class="n85-wr-retry" onclick="N85Guarani.render(\'guarani-content\')">← Volver</button>' +
      '</div>';
    if(typeof saveScore==='function') saveScore('guarani_'+st.key, st.correctas, t.pasos.length);
  }
};
window.N85Guarani = N85Guarani;

window.n85OpenGuarani = function(){
  goto('guarani-sim', null);
  setTimeout(function(){ N85Guarani.render('guarani-content'); }, 200);
};

/* ── T3: DEEP-LINKS BIBLIOGRÁFICOS ──────────────────────────────────────── */
var N85DeepLinks = {
  MAP: {
    'Contabilidad':   { dialnet:'Fowler+Newton+contabilidad', rid:'Fowler+Newton', icon:'📊' },
    'Administración': { dialnet:'Robbins+administracion+organizaciones', rid:'Robbins+administracion', icon:'🏢' },
    'Sociales':       { dialnet:'Bourdieu+habitus+campo+social', rid:'Bourdieu+sociologia', icon:'🌐' },
    'Propedéutica':   { dialnet:'educacion+superior+argentina+autonomia', rid:'educacion+superior+UNPSJB', icon:'📜' },
  },

  /* Extraer autor de la cita "Fuente:" del cuerpo */
  _extractFuente: function(cuerpo) {
    if(!cuerpo) return null;
    var m = cuerpo.match(/<strong>Fuente:<\/strong>\s*([^<·]{4,60})/);
    return m ? m[1].trim().split('·')[0].trim().split('—')[0].trim() : null;
  },

  /* Construir URLs de búsqueda */
  _urls: function(materia, autor) {
    var base = N85DeepLinks.MAP[materia] || N85DeepLinks.MAP['Contabilidad'];
    var q = autor ? encodeURIComponent(autor) : base.dialnet;
    return {
      dialnet: 'https://dialnet.unirioja.es/buscar/documentos?querysDismax%5BGENERAL%5D=' + q,
      rid:     'http://rid.unp.edu.ar/cgi-bin/koha/opac-search.pl?q=' + (autor ? q : base.rid),
      sedici:  'https://sedici.unlp.edu.ar/discover?filtertype=subject&filter_relational_operator=contains&filter=' + q
    };
  },

  /* Inyectar botón de deep-link en el well */
  inject: function(wellEl, item) {
    if(!wellEl || !item || item.tipo !== 'Resumen') return;
    if(wellEl.querySelector('.n85-deeplink-bar')) return;
    var mat    = item.materia || '';
    var autor  = N85DeepLinks._extractFuente(item.cuerpo || '');
    var urls   = N85DeepLinks._urls(mat, autor);
    var cfg    = N85DeepLinks.MAP[mat] || {};

    var bar = document.createElement('div');
    bar.className = 'n85-deeplink-bar';
    bar.innerHTML =
      '<span class="n85-dl-icon">' + (cfg.icon || '📚') + '</span>' +
      '<span class="n85-dl-label">Bibliografía' + (autor ? ': ' + autor.substring(0,30) : '') + '</span>' +
      '<div class="n85-dl-links">' +
        '<a class="n85-dl-btn" href="' + urls.dialnet + '" target="_blank" rel="noopener">Dialnet</a>' +
        '<a class="n85-dl-btn" href="' + urls.rid     + '" target="_blank" rel="noopener">RID UNPSJB</a>' +
        '<a class="n85-dl-btn" href="' + urls.sedici  + '" target="_blank" rel="noopener">SEDICI</a>' +
      '</div>';
    wellEl.appendChild(bar);
  }
};
window.N85DeepLinks = N85DeepLinks;


var N86HypoLab = (function() {
  'use strict';

  var STORE_KEY = 'nexus86_hypo_v1';

  /* Banco de conceptos con keywords semánticas para evaluación */
  var CONCEPT_BANK = [
    { id:'activo',          label:'Activo',                  keys:['recurso','control','beneficio','futuro','económico'] },
    { id:'pasivo',          label:'Pasivo',                  keys:['obligación','deuda','cancelar','pasivo','creditor'] },
    { id:'patrimonio',      label:'Patrimonio Neto',         keys:['patrimonio','capital','residual','dueño','propietario'] },
    { id:'debe',            label:'Debe / Débito',           keys:['debe','debitar','debit','izquierda','aumenta activo'] },
    { id:'haber',           label:'Haber / Crédito',         keys:['haber','acreditar','credit','derecha','aumenta pasivo'] },
    { id:'devengado',       label:'Devengado',               keys:['devengar','ocurre','reconoc','período','base contable'] },
    { id:'variacion',       label:'Variación Patrimonial',   keys:['variación','modificativa','permutativa','mixta','patrimonio'] },
    { id:'inflacion',       label:'Inflación',               keys:['inflación','precios','ajuste','poder adquisitivo','moneda'] },
    { id:'balance',         label:'Balance / E. Situación',  keys:['balance','situación financiera','activo','pasivo','fecha'] },
    { id:'empresa_marcha',  label:'Empresa en Marcha',       keys:['marcha','continuidad','funcionamiento','going concern','liquida'] },
    { id:'habitus',         label:'Habitus (Bourdieu)',       keys:['habitus','disposición','práctica','social','bourdieu'] },
    { id:'campo',           label:'Campo (Bourdieu)',         keys:['campo','posición','reglas','doxa','capital específico'] },
    { id:'cogobierno',      label:'Cogobierno Universitario', keys:['cogobierno','docentes','estudiantes','graduados','1918'] },
    { id:'autonomia',       label:'Autonomía Universitaria',  keys:['autonomía','independencia','estatal','constitucional','art 75'] },
    { id:'planificacion',   label:'Planificación (Fayol)',    keys:['planificación','fayol','objetivos','estrategia','metas'] },
    { id:'estructura_org',  label:'Estructura Organizacional',keys:['estructura','mintzberg','jerarquía','división','departamento'] },
    { id:'iva',             label:'IVA',                     keys:['iva','crédito fiscal','débito fiscal','alícuota','impuesto'] },
    { id:'capital_cult',    label:'Capital Cultural',         keys:['cultural','bourdieu','simbólico','educación','distinción'] }
  ];

  /* Pares sugeridos de cruzamiento con contexto Patagónico */
  var SUGGESTED_PAIRS = [
    ['inflacion','activo'],
    ['habitus','cogobierno'],
    ['devengado','iva'],
    ['planificacion','estructura_org'],
    ['autonomia','campo'],
    ['patrimonio','variacion'],
    ['empresa_marcha','balance'],
    ['capital_cult','habitus']
  ];

  function _load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch(e) { return []; }
  }
  function _save(arr) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(arr.slice(-20))); } catch(e) {}
  }
  function _getConcept(id) {
    return CONCEPT_BANK.find(function(c){ return c.id === id; }) || null;
  }

  /* Evaluación semántica: busca palabras clave de ambos conceptos en el texto */
  function _evaluar(texto, c1, c2) {
    var t = texto.toLowerCase();
    var score1 = 0, score2 = 0;
    c1.keys.forEach(function(k){ if(t.indexOf(k.toLowerCase()) !== -1) score1++; });
    c2.keys.forEach(function(k){ if(t.indexOf(k.toLowerCase()) !== -1) score2++; });
    var minLen = 40;
    var tooShort = texto.trim().length < minLen;
    var pct1 = Math.min(100, Math.round((score1 / c1.keys.length) * 100));
    var pct2 = Math.min(100, Math.round((score2 / c2.keys.length) * 100));
    var avg  = Math.round((pct1 + pct2) / 2);
    return { pct1:pct1, pct2:pct2, avg:avg, tooShort:tooShort, score1:score1, score2:score2 };
  }

  function _feedbackHTML(ev, c1, c2) {
    var color = ev.avg >= 60 ? 'var(--color-ok,#3fb950)' : ev.avg >= 35 ? 'var(--color-warn,#e3b341)' : 'var(--color-err,#f85149)';
    var icon  = ev.avg >= 60 ? '✅' : ev.avg >= 35 ? '⚠️' : '❌';
    var msg   = ev.tooShort
      ? 'La hipótesis es muy corta. Desarrollá más tu argumento (mín. 40 caracteres).'
      : ev.avg >= 60
        ? '¡Excelente! Tu hipótesis conecta coherentemente ambos conceptos.'
        : ev.avg >= 35
          ? 'Buena base. Incorporá más vocabulario específico de ' + (ev.pct1 < ev.pct2 ? c1.label : c2.label) + '.'
          : 'La conexión entre conceptos no es clara. Intentá mencionar aspectos clave de ambos.';
    return '<div class="n86-hl-feedback" style="border-left:3px solid '+color+';background:'+color+'18;padding:12px 14px;border-radius:0 6px 6px 0;margin-top:12px">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
        '<span style="font-size:1.1rem">'+icon+'</span>' +
        '<span style="font-family:\'Bebas Neue\',sans-serif;font-size:1.1rem;letter-spacing:.05em;color:'+color+'">Coherencia: '+ev.avg+'%</span>' +
      '</div>' +
      '<div style="font-size:.82rem;color:var(--text-primary,#1a1510);line-height:1.6;margin-bottom:8px">'+msg+'</div>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
        '<span style="font-family:\'DM Mono\',monospace;font-size:.66rem;color:'+color+'">'+c1.label+': '+ev.pct1+'%</span>' +
        '<span style="font-family:\'DM Mono\',monospace;font-size:.66rem;color:'+color+'">'+c2.label+': '+ev.pct2+'%</span>' +
      '</div>' +
    '</div>';
  }

  function render(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var opts = CONCEPT_BANK.map(function(c){
      return '<option value="'+c.id+'">'+c.label+'</option>';
    }).join('');

    /* Sugerir un par aleatorio */
    var rp = SUGGESTED_PAIRS[Math.floor(Math.random() * SUGGESTED_PAIRS.length)];

    var hist = _load();
    var histHTML = hist.length === 0
      ? '<div style="font-family:\'Fraunces\',serif;font-size:.8rem;color:var(--n86-muted);font-style:italic;padding:8px 0">Sin hipótesis guardadas aún.</div>'
      : hist.slice().reverse().slice(0,5).map(function(h){
          var col = h.avg >= 60 ? 'var(--color-ok,#3fb950)' : h.avg >= 35 ? 'var(--color-warn,#e3b341)' : 'var(--color-err,#f85149)';
          return '<div class="n86-hl-hist-item">' +
            '<span class="n86-hl-hist-score" style="color:'+col+'">'+h.avg+'%</span>' +
            '<span class="n86-hl-hist-label">'+h.c1+' × '+h.c2+'</span>' +
            '<span class="n86-hl-hist-date">'+h.fecha+'</span>' +
          '</div>';
        }).join('');

    el.innerHTML =
      '<div class="n86-hl-wrap">' +
        '<div class="n86-hl-header">' +
          '<div class="n86-hl-icon">🔬</div>' +
          '<div>' +
            '<div class="n86-hl-title">Laboratorio de Hipótesis</div>' +
            '<div class="n86-hl-sub">Cruzá dos conceptos · Redactá · El Mentor evalúa tu coherencia</div>' +
          '</div>' +
        '</div>' +

        '<div class="n86-hl-selectors">' +
          '<div class="n86-hl-sel-group">' +
            '<label class="n86-hl-sel-label">Concepto A</label>' +
            '<select id="n86-sel-a" class="n86-hl-select">'+opts+'</select>' +
          '</div>' +
          '<div class="n86-hl-cross">×</div>' +
          '<div class="n86-hl-sel-group">' +
            '<label class="n86-hl-sel-label">Concepto B</label>' +
            '<select id="n86-sel-b" class="n86-hl-select">'+opts+'</select>' +
          '</div>' +
        '</div>' +

        '<button class="n86-hl-suggest-btn" onclick="N86HypoLab._randomPair()">🎲 Par sugerido</button>' +

        '<div id="n86-hl-prompt" class="n86-hl-prompt"></div>' +

        '<textarea id="n86-hl-input" class="n86-hl-textarea" rows="4" ' +
          'placeholder="Escribí tu hipótesis aquí. Conectá ambos conceptos con tu propio razonamiento…" ' +
          'oninput="N86HypoLab._onInput(this)"></textarea>' +

        '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
          '<button class="n86-hl-eval-btn" onclick="N86HypoLab._evaluar()">🧠 Evaluar hipótesis</button>' +
          '<button class="n86-hl-clear-btn" onclick="N86HypoLab._limpiar()">↺ Nueva</button>' +
        '</div>' +

        '<div id="n86-hl-result"></div>' +

        '<div class="n86-hl-hist-wrap">' +
          '<div class="n86-hl-hist-title">Historial reciente</div>' +
          '<div id="n86-hl-hist">'+histHTML+'</div>' +
        '</div>' +
      '</div>';

    /* Precargar par sugerido */
    var selA = document.getElementById('n86-sel-a');
    var selB = document.getElementById('n86-sel-b');
    if (selA && selB) {
      selA.value = rp[0];
      selB.value = rp[1];
      N86HypoLab._updatePrompt();
    }

    selA && selA.addEventListener('change', function(){ N86HypoLab._updatePrompt(); });
    selB && selB.addEventListener('change', function(){ N86HypoLab._updatePrompt(); });
  }

  function _updatePrompt() {
    var selA = document.getElementById('n86-sel-a');
    var selB = document.getElementById('n86-sel-b');
    var el   = document.getElementById('n86-hl-prompt');
    if (!selA || !selB || !el) return;
    var c1 = _getConcept(selA.value);
    var c2 = _getConcept(selB.value);
    if (!c1 || !c2 || c1.id === c2.id) {
      el.innerHTML = '<span style="color:var(--color-err,#f85149);font-size:.8rem">Seleccioná dos conceptos distintos.</span>';
      return;
    }
    el.innerHTML =
      '<span class="n86-hl-prompt-icon">💡</span>' +
      '<span>¿Cómo se relacionan <strong>'+c1.label+'</strong> y <strong>'+c2.label+'</strong> en el contexto de una empresa de Trelew?</span>';
  }

  function _randomPair() {
    var rp = SUGGESTED_PAIRS[Math.floor(Math.random() * SUGGESTED_PAIRS.length)];
    var selA = document.getElementById('n86-sel-a');
    var selB = document.getElementById('n86-sel-b');
    if (selA && selB) {
      selA.value = rp[0];
      selB.value = rp[1];
      _updatePrompt();
      document.getElementById('n86-hl-result') && (document.getElementById('n86-hl-result').innerHTML = '');
    }
  }

  function _onInput(ta) {
    /* Feedback de longitud en tiempo real */
    var n = ta.value.trim().length;
    ta.style.borderColor = n >= 40 ? 'var(--n86-accent)' : n > 0 ? '#d97706' : '';
  }

  function _evaluar() {
    var selA  = document.getElementById('n86-sel-a');
    var selB  = document.getElementById('n86-sel-b');
    var input = document.getElementById('n86-hl-input');
    var res   = document.getElementById('n86-hl-result');
    if (!selA || !selB || !input || !res) return;
    var c1 = _getConcept(selA.value);
    var c2 = _getConcept(selB.value);
    if (!c1 || !c2 || c1.id === c2.id) {
      res.innerHTML = '<span style="color:var(--color-err,#f85149);font-size:.82rem">Seleccioná dos conceptos distintos.</span>';
      return;
    }
    var texto = input.value;
    if (!texto.trim()) {
      res.innerHTML = '<span style="color:var(--color-err,#f85149);font-size:.82rem">Escribí tu hipótesis antes de evaluar.</span>';
      return;
    }
    var ev = _evaluar_impl(texto, c1, c2);
    res.innerHTML = _feedbackHTML(ev, c1, c2);

    /* Guardar en historial */
    var hist = _load();
    var d = new Date();
    var fecha = d.getDate()+'/'+(d.getMonth()+1);
    hist.push({ c1:c1.label, c2:c2.label, avg:ev.avg, fecha:fecha, texto:texto.substring(0,120) });
    _save(hist);
    _renderHist();
  }

  /* Renombrar para evitar conflicto con la función pública */
  var _evaluar_impl = _evaluar;
  _evaluar_impl = function(texto, c1, c2){ return _evaluar(texto, c1, c2); };

  function _limpiar() {
    var input = document.getElementById('n86-hl-input');
    var res   = document.getElementById('n86-hl-result');
    if (input) { input.value = ''; input.style.borderColor = ''; }
    if (res) res.innerHTML = '';
    _randomPair();
  }

  function _renderHist() {
    var el = document.getElementById('n86-hl-hist');
    if (!el) return;
    var hist = _load();
    if (!hist.length) {
      el.innerHTML = '<div style="font-family:\'Fraunces\',serif;font-size:.8rem;color:var(--n86-muted);font-style:italic;padding:8px 0">Sin hipótesis guardadas aún.</div>';
      return;
    }
    el.innerHTML = hist.slice().reverse().slice(0,5).map(function(h){
      var col = h.avg >= 60 ? 'var(--color-ok,#3fb950)' : h.avg >= 35 ? 'var(--color-warn,#e3b341)' : 'var(--color-err,#f85149)';
      return '<div class="n86-hl-hist-item">' +
        '<span class="n86-hl-hist-score" style="color:'+col+'">'+h.avg+'%</span>' +
        '<span class="n86-hl-hist-label">'+h.c1+' × '+h.c2+'</span>' +
        '<span class="n86-hl-hist-date">'+h.fecha+'</span>' +
      '</div>';
    }).join('');
  }

  /* Resolver referencia circular: _evaluar necesita _evaluar_impl */
  var _ev = function(texto, c1, c2) {
    var t = texto.toLowerCase();
    var score1 = 0, score2 = 0;
    c1.keys.forEach(function(k){ if(t.indexOf(k.toLowerCase()) !== -1) score1++; });
    c2.keys.forEach(function(k){ if(t.indexOf(k.toLowerCase()) !== -1) score2++; });
    var tooShort = texto.trim().length < 40;
    var pct1 = Math.min(100, Math.round((score1 / c1.keys.length) * 100));
    var pct2 = Math.min(100, Math.round((score2 / c2.keys.length) * 100));
    return { pct1:pct1, pct2:pct2, avg:Math.round((pct1+pct2)/2), tooShort:tooShort };
  };

  return {
    render:        render,
    _updatePrompt: _updatePrompt,
    _randomPair:   _randomPair,
    _onInput:      _onInput,
    _limpiar:      _limpiar,
    _evaluar: function() {
      var selA  = document.getElementById('n86-sel-a');
      var selB  = document.getElementById('n86-sel-b');
      var input = document.getElementById('n86-hl-input');
      var res   = document.getElementById('n86-hl-result');
      if (!selA || !selB || !input || !res) return;
      var c1 = _getConcept(selA.value);
      var c2 = _getConcept(selB.value);
      if (!c1 || !c2 || c1.id === c2.id) {
        res.innerHTML = '<span style="color:var(--color-err,#f85149);font-size:.82rem">Seleccioná dos conceptos distintos.</span>';
        return;
      }
      var texto = input.value;
      if (!texto.trim()) {
        res.innerHTML = '<span style="color:var(--color-err,#f85149);font-size:.82rem">Escribí tu hipótesis antes de evaluar.</span>';
        return;
      }
      var ev = _ev(texto, c1, c2);
      res.innerHTML = _feedbackHTML(ev, c1, c2);
      var hist = _load();
      var d = new Date();
      hist.push({ c1:c1.label, c2:c2.label, avg:ev.avg, fecha:d.getDate()+'/'+(d.getMonth()+1), texto:texto.substring(0,120) });
      _save(hist);
      _renderHist();
    }
  };
})();
window.N86HypoLab = N86HypoLab;


var N86MacheteEditor = (function() {
  'use strict';

  var STORE_KEY = 'nexus86_machete_v1';

  function _load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch(e) { return {}; }
  }
  function _save(obj) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch(e) {}
  }

  /* Obtener ejemplos de un ítem */
  function getEjemplos(itemId) {
    var data = _load();
    return data[itemId] || [];
  }

  /* Guardar un nuevo ejemplo */
  function addEjemplo(itemId, itemTitulo, texto) {
    if (!texto || !texto.trim() || !itemId) return false;
    var data = _load();
    if (!data[itemId]) data[itemId] = [];
    var d = new Date();
    data[itemId].push({
      texto: texto.trim().substring(0, 400),
      titulo: itemTitulo || itemId,
      fecha: d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(),
      ts: Date.now()
    });
    _save(data);
    return true;
  }

  /* Eliminar un ejemplo por índice */
  function removeEjemplo(itemId, idx) {
    var data = _load();
    if (data[itemId]) {
      data[itemId].splice(idx, 1);
      if (data[itemId].length === 0) delete data[itemId];
      _save(data);
    }
  }

  /* Inyectar el editor en el well de un material (llamado desde _injectMacheteBtn) */
  function injectEditor(wellEl, item) {
    if (!wellEl || !item || !item.id) return;
    if (wellEl.querySelector('.n86-me-wrap')) return; /* ya inyectado */

    var ejemplos = getEjemplos(item.id);
    var listHTML = _buildListHTML(item.id, ejemplos);

    var wrap = document.createElement('div');
    wrap.className = 'n86-me-wrap';
    wrap.setAttribute('data-item-id', item.id);
    wrap.innerHTML =
      '<div class="n86-me-header">' +
        '<span class="n86-me-icon">📍</span>' +
        '<span class="n86-me-title">Mis Ejemplos de Trelew</span>' +
        '<span class="n86-me-count">' + ejemplos.length + '</span>' +
      '</div>' +
      '<div id="n86-me-list-'+item.id+'" class="n86-me-list">'+listHTML+'</div>' +
      '<div class="n86-me-add">' +
        '<textarea id="n86-me-ta-'+item.id+'" class="n86-me-ta" rows="2" ' +
          'placeholder="Agregá un ejemplo local: empresa de Trelew, caso del Virch, situación real…"></textarea>' +
        '<button class="n86-me-btn" onclick="N86MacheteEditor._add(\''+item.id+'\',\''+
          (item.titulo||item.id).replace(/'/g,"\\'")+'\')">' +
          '+ Agregar ejemplo' +
        '</button>' +
      '</div>';
    wellEl.appendChild(wrap);
  }

  function _buildListHTML(itemId, ejemplos) {
    if (!ejemplos.length) {
      return '<div class="n86-me-empty">Todavía no hay ejemplos locales. ¡Sé el primero!</div>';
    }
    return ejemplos.map(function(ej, i){
      return '<div class="n86-me-item">' +
        '<div class="n86-me-item-badge">📍 Trelew</div>' +
        '<div class="n86-me-item-text">'+_escHtml(ej.texto)+'</div>' +
        '<div class="n86-me-item-meta">'+ej.fecha+
          ' <button class="n86-me-del" onclick="N86MacheteEditor._del(\''+itemId+'\','+i+',this)">✕</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function _escHtml(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _add(itemId, itemTitulo) {
    var ta = document.getElementById('n86-me-ta-'+itemId);
    if (!ta) return;
    var txt = ta.value.trim();
    if (!txt) { ta.focus(); return; }
    if (addEjemplo(itemId, itemTitulo, txt)) {
      ta.value = '';
      var listEl = document.getElementById('n86-me-list-'+itemId);
      if (listEl) listEl.innerHTML = _buildListHTML(itemId, getEjemplos(itemId));
      /* Actualizar contador */
      var wrap = listEl && listEl.closest('.n86-me-wrap');
      var count = wrap && wrap.querySelector('.n86-me-count');
      if (count) count.textContent = getEjemplos(itemId).length;
    }
  }

  function _del(itemId, idx, btn) {
    removeEjemplo(itemId, idx);
    var wrap = btn && btn.closest('.n86-me-wrap');
    var listEl = wrap && wrap.querySelector('.n86-me-list');
    if (listEl) listEl.innerHTML = _buildListHTML(itemId, getEjemplos(itemId));
    var count = wrap && wrap.querySelector('.n86-me-count');
    if (count) count.textContent = getEjemplos(itemId).length;
  }

  /* Generar HTML de ejemplos para inyectar en ventana de impresión del Machete */
  function buildPrintSection(itemId) {
    var ejemplos = getEjemplos(itemId);
    if (!ejemplos.length) return '';
    var items = ejemplos.map(function(ej){
      return '<div style="margin-bottom:8pt;border-left:3pt solid #2563eb;padding-left:8pt;page-break-inside:avoid">' +
        '<div style="font-family:Arial,sans-serif;font-size:7.5pt;font-weight:700;color:#2563eb;margin-bottom:2pt">📍 Ejemplo local — Trelew · '+ej.fecha+'</div>' +
        '<div style="font-family:Georgia,serif;font-size:9pt;line-height:1.5;color:#1a1510">'+_escHtml(ej.texto)+'</div>' +
      '</div>';
    }).join('');
    return '<div style="margin-top:20pt;border-top:2pt solid #2563eb;padding-top:12pt">' +
      '<div style="font-family:Arial Black,sans-serif;font-size:10pt;color:#2563eb;margin-bottom:10pt;letter-spacing:.04em">MIS EJEMPLOS DE TRELEW</div>' +
      items +
    '</div>';
  }

  return {
    getEjemplos:       getEjemplos,
    addEjemplo:        addEjemplo,
    injectEditor:      injectEditor,
    buildPrintSection: buildPrintSection,
    _add: _add,
    _del: _del
  };
})();
window.N86MacheteEditor = N86MacheteEditor;


var N86Glass = (function() {
  'use strict';

  var STORE_KEY = 'nexus86_glass_v1';
  var STYLE_ID  = 'n86-glass-style';

  var CSS_GLASS =
    ':root {' +
      '--bg: #0d0f17;' +
      '--ink: #e8e6f0;' +
      '--paper: rgba(255,255,255,0.04);' +
      '--rule: rgba(255,255,255,0.08);' +
      '--rule2: rgba(255,255,255,0.04);' +
      '--muted: rgba(255,255,255,0.45);' +
      '--muted2: rgba(255,255,255,0.25);' +
      '--sb-bg: rgba(8,10,20,0.85);' +
      '--sb-text: rgba(232,230,240,0.9);' +
      '--sb-muted: rgba(255,255,255,0.3);' +
      '--sb-rule: rgba(255,255,255,0.06);' +
      '--n86-glass-active:1;' +
    '}' +
    'body {' +
      'background: radial-gradient(ellipse 120% 80% at 20% 10%, rgba(99,102,241,0.18) 0%, transparent 55%),' +
        'radial-gradient(ellipse 80% 60% at 80% 90%, rgba(139,92,246,0.14) 0%, transparent 50%),' +
        'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(16,185,129,0.06) 0%, transparent 60%),' +
        'linear-gradient(135deg, #070810 0%, #0d0f1c 40%, #080e18 100%) !important;' +
      'background-attachment: fixed !important;' +
    '}' +
    '.card,.hcard,.co,.acc,.bib-wrap,.qcard,.fc-card,.tbl-wrap,' +
    '.adm-block,.adm-autor-card,.n85-cal-item,.n83-comp-table,' +
    '.n80-rango-card,.n81-matrix-wrap,.n82-item,.n83-gl-card,' +
    '.n86-hl-wrap,.n86-me-wrap {' +
      'background: rgba(255,255,255,0.04) !important;' +
      'backdrop-filter: blur(18px) saturate(160%) !important;' +
      '-webkit-backdrop-filter: blur(18px) saturate(160%) !important;' +
      'border: 1px solid rgba(255,255,255,0.09) !important;' +
      'box-shadow: 0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06) !important;' +
    '}' +
    '.hcard:hover,.card:hover {' +
      'background: rgba(255,255,255,0.07) !important;' +
      'border-color: rgba(255,255,255,0.18) !important;' +
      'box-shadow: 0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(99,102,241,0.25) !important;' +
      'transform: translateY(-3px) !important;' +
    '}' +
    '#sb {' +
      'background: rgba(8,10,20,0.82) !important;' +
      'backdrop-filter: blur(28px) saturate(140%) !important;' +
      '-webkit-backdrop-filter: blur(28px) saturate(140%) !important;' +
      'border-right: 1px solid rgba(255,255,255,0.06) !important;' +
    '}' +
    '#topbar {' +
      'background: rgba(10,12,22,0.75) !important;' +
      'backdrop-filter: blur(22px) saturate(150%) !important;' +
      '-webkit-backdrop-filter: blur(22px) saturate(150%) !important;' +
      'border-bottom: 1px solid rgba(255,255,255,0.07) !important;' +
    '}' +
    '.ph-title,.hcard-title,.sb-title,.card-title {' +
      'text-shadow: 0 0 40px rgba(139,92,246,0.35), 0 0 80px rgba(99,102,241,0.15) !important;' +
    '}' +
    '.ph::before {' +
      'background: linear-gradient(180deg, var(--cur), rgba(139,92,246,0.4)) !important;' +
      'opacity: 1 !important;' +
      'box-shadow: 0 0 20px var(--cur) !important;' +
    '}' +
    '.qopt,.fc-btn,.nexus6-machete-btn,.n86-hl-eval-btn,.n86-me-btn {' +
      'backdrop-filter: blur(8px) !important;' +
      '-webkit-backdrop-filter: blur(8px) !important;' +
    '}' +
    '.page { animation: n86GlassFadeUp .4s cubic-bezier(.16,1,.3,1) both !important; }' +
    '@keyframes n86GlassFadeUp {' +
      'from { opacity:0; transform:translateY(14px) scale(.99); filter:blur(4px); }' +
      'to   { opacity:1; transform:translateY(0) scale(1);     filter:blur(0);   }' +
    '}' +
    '.sb-title { letter-spacing:.06em; }' +
    '.ph-title { letter-spacing:.02em; }';

  function isActive() {
    try { return localStorage.getItem(STORE_KEY) === '1'; } catch(e) { return false; }
  }

  function enable() {
    var existing = document.getElementById(STYLE_ID);
    if (existing) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS_GLASS;
    document.head.appendChild(s);
    try { localStorage.setItem(STORE_KEY, '1'); } catch(e) {}
    _updateToggleBtn(true);
  }

  function disable() {
    var s = document.getElementById(STYLE_ID);
    if (s) s.remove();
    try { localStorage.setItem(STORE_KEY, '0'); } catch(e) {}
    _updateToggleBtn(false);
  }

  function toggle() {
    isActive() ? disable() : enable();
  }

  function _updateToggleBtn(active) {
    var btn = document.getElementById('n86-glass-toggle');
    if (!btn) return;
    btn.textContent = active ? '🪟 Vidrio: ON' : '🪟 Vidrio: OFF';
    btn.style.background = active ? 'rgba(99,102,241,0.25)' : '';
    btn.style.borderColor = active ? 'rgba(99,102,241,0.5)' : '';
    btn.style.color = active ? '#a5b4fc' : '';
  }

  /* Renderizar botón toggle en el sidebar footer o en un container dado */
  function renderToggleBtn(containerId) {
    var el = containerId ? document.getElementById(containerId) : null;
    if (!el) {
      /* Inyectar en sidebar footer como fallback */
      el = document.querySelector('.sb-footer');
      if (!el) return;
    }
    if (document.getElementById('n86-glass-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'n86-glass-toggle';
    btn.className = 'n86-glass-toggle-btn';
    btn.onclick = function(){ N86Glass.toggle(); };
    btn.textContent = isActive() ? '🪟 Vidrio: ON' : '🪟 Vidrio: OFF';
    if (isActive()) {
      btn.style.background  = 'rgba(99,102,241,0.25)';
      btn.style.borderColor = 'rgba(99,102,241,0.5)';
      btn.style.color       = '#a5b4fc';
    }
    el.appendChild(btn);
  }

  /* Auto-init: restaurar estado al cargar */
  function init() {
    if (isActive()) enable();
    /* Esperar DOM para el botón */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){ renderToggleBtn(null); });
    } else {
      setTimeout(function(){ renderToggleBtn(null); }, 300);
    }
  }

  return { isActive:isActive, enable:enable, disable:disable, toggle:toggle, renderToggleBtn:renderToggleBtn, init:init };
})();
window.N86Glass = N86Glass;
N86Glass.init();


var N87Analytics = (function() {
  'use strict';

  /* Mapa de materias con sus quiz IDs y pesos — v19.3.1: colores desde NEXUS_COLORS */
  var _mc = typeof NEXUS_COLORS !== 'undefined' ? NEXUS_COLORS.materias : null;
  var MATS = [
    { id:'Propedéutica',   quizKey:'prop',   total:25,
      color: _mc ? _mc.prop.base : '#f59e0b', colorAlpha:'rgba('+(_mc ? _mc.prop.rgb : '245,158,11')+','  },
    { id:'Contabilidad',   quizKey:'cu1',    total:30,
      color: _mc ? _mc.cont.base : '#58a6ff', colorAlpha:'rgba('+(_mc ? _mc.cont.rgb : '88,166,255')+',' },
    { id:'Administración', quizKey:'adm',    total:25,
      color: _mc ? _mc.adm.base  : '#3b82f6', colorAlpha:'rgba('+(_mc ? _mc.adm.rgb  : '59,130,246')+',' },
    { id:'Sociales',       quizKey:'soc-u3', total:10,
      color: _mc ? _mc.soc.base  : '#a78bfa', colorAlpha:'rgba('+(_mc ? _mc.soc.rgb  : '167,139,250')+','  }
  ];

  /* Escala térmica: 0%=azul frío → 100%=naranja fuego */
  function _thermalColor(pct) {
    if (pct >= 85) return { from:'#f97316', to:'#ef4444' };  /* fuego */
    if (pct >= 65) return { from:'#f59e0b', to:'#f97316' };  /* naranja */
    if (pct >= 45) return { from:'#eab308', to:'#f59e0b' };  /* amarillo */
    if (pct >= 25) return { from:'#22d3ee', to:'#3b82f6' };  /* cian */
    return { from:'#3b82f6', to:'#6366f1' };                  /* azul frío */
  }

  /* Calcular dominio de una materia (0-100) */
  function _dominio(mat) {
    var score = 0, weight = 0;

    /* 1. Quiz score — peso 60% */
    try {
      var scores = JSON.parse(localStorage.getItem('fce_portal_scores_v1') || '{}');
      var q = scores[mat.quizKey];
      if (q && q.best) { score += q.best.pct * 0.6; weight += 0.6; }
    } catch(e) {}

    /* 2. Conceptos leídos — checkboxes marcados — peso 25% */
    try {
      var cbs = JSON.parse(localStorage.getItem('fce_portal_checkboxes_v1') || '{}');
      var matPrefix = mat.id.substring(0,4).toLowerCase();
      var total = 0, checked = 0;
      Object.keys(cbs).forEach(function(k) {
        if (k.toLowerCase().indexOf(matPrefix) !== -1) {
          total++;
          if (cbs[k]) checked++;
        }
      });
      if (total > 0) { score += (checked / total * 100) * 0.25; weight += 0.25; }
    } catch(e) {}

    /* 3. Conceptos difíciles superados (N68) — peso 15% */
    try {
      var diffs = JSON.parse(localStorage.getItem('nexus68_dificultad_v1') || '{}');
      var matKeys = Object.keys(diffs).filter(function(k) {
        var d = diffs[k];
        return d && d.materia && d.materia.indexOf(mat.id.split(' ')[0]) !== -1;
      });
      /* Si tiene dificultades de esa materia, cada una superada suma */
      if (matKeys.length > 0) {
        score += Math.min(100, (1 - matKeys.length / 10) * 100) * 0.15;
        weight += 0.15;
      }
    } catch(e) {}

    if (weight === 0) return null; /* sin datos */
    return Math.min(100, Math.round(score / weight));
  }

  /* Calcular dominio global (promedio ponderado de las 4 materias) */
  function _dominioGlobal() {
    var sum = 0, count = 0;
    MATS.forEach(function(m) {
      var d = _dominio(m);
      if (d !== null) { sum += d; count++; }
    });
    return count > 0 ? Math.round(sum / count) : null;
  }

  function render(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var globalPct = _dominioGlobal();
    var gColors   = globalPct !== null ? _thermalColor(globalPct) : { from:'#6366f1', to:'#3b82f6' };
    var gLabel    = globalPct === null ? 'Sin datos aún — completá al menos un quiz'
                  : globalPct >= 80 ? '¡Dominio excelente! Estás listo para el parcial.'
                  : globalPct >= 60 ? 'Dominio sólido. Reforzá las materias en rojo.'
                  : globalPct >= 40 ? 'En progreso. Completá más quizzes y flashcards.'
                  : 'Inicial. Empezá los quizzes para activar el análisis.';

    /* Filas por materia */
    var rowsHTML = MATS.map(function(m) {
      var pct     = _dominio(m);
      var col     = pct !== null ? _thermalColor(pct) : { from:'#334155', to:'#475569' };
      var pctVal  = pct !== null ? pct : 0;
      var label   = pct !== null ? pctVal + '%' : 'S/D';
      var statusTxt = pct === null ? 'Sin datos'
                    : pct >= 80   ? 'Dominado'
                    : pct >= 60   ? 'Avanzando'
                    : pct >= 40   ? 'En curso'
                    : 'Inicial';
      return '<div class="n87-an-row">' +
        '<div class="n87-an-mat-info">' +
          '<span class="n87-an-mat-dot" style="background:' + m.color + '"></span>' +
          '<span class="n87-an-mat-name">' + m.id + '</span>' +
          '<span class="n87-an-mat-status" style="color:' + col.from + '">' + statusTxt + '</span>' +
        '</div>' +
        '<div class="n87-an-bar-wrap">' +
          '<div class="n87-an-bar-track">' +
            '<div class="n87-an-bar-fill" style="width:' + pctVal + '%;' +
              'background:linear-gradient(90deg,' + col.from + ',' + col.to + ')"></div>' +
          '</div>' +
          '<span class="n87-an-bar-pct">' + label + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    el.innerHTML =
      '<div class="n87-an-wrap">' +
        '<div class="n87-an-header">' +
          '<div class="n87-an-icon">🔥</div>' +
          '<div>' +
            '<div class="n87-an-title">Mapa de Dominio Académico</div>' +
            '<div class="n87-an-sub">Basado en quizzes · Lecturas · Conceptos trabajados</div>' +
          '</div>' +
          (globalPct !== null
            ? '<div class="n87-an-global" style="background:linear-gradient(135deg,' + gColors.from + ',' + gColors.to + ')">' +
                globalPct + '%' +
              '</div>'
            : '') +
        '</div>' +
        '<div class="n87-an-rows">' + rowsHTML + '</div>' +
        '<div class="n87-an-footer">' + gLabel + '</div>' +
      '</div>';
  }

  /* Actualizar solo las barras (sin re-renderizar todo el widget) */
  function refresh() {
    var el = document.getElementById('n87-analytics-container');
    if (!el || !el.querySelector('.n87-an-wrap')) { render('n87-analytics-container'); return; }
    MATS.forEach(function(m, i) {
      var pct = _dominio(m);
      var fill = el.querySelectorAll('.n87-an-bar-fill')[i];
      var pctEl = el.querySelectorAll('.n87-an-bar-pct')[i];
      if (!fill || !pctEl) return;
      var col = pct !== null ? _thermalColor(pct) : { from:'#334155', to:'#475569' };
      fill.style.width = (pct || 0) + '%';
      fill.style.background = 'linear-gradient(90deg,' + col.from + ',' + col.to + ')';
      pctEl.textContent = pct !== null ? pct + '%' : 'S/D';
    });
  }

  return { render:render, refresh:refresh, _dominio:_dominio, _dominioGlobal:_dominioGlobal };
})();
window.N87Analytics = N87Analytics;


var N87Anclajes = (function() {
  'use strict';

  var LS_KEY  = 'nexus87_anclajes_v1';
  var _cache  = null;   /* caché en memoria para la sesión */

  /* ── Persistencia ─────────────────────────────────────────────── */
  function _loadLS() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch(e) { return {}; }
  }
  function _saveLS(obj) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch(e) {}
  }

  function load(cb) {
    /* Intentar Firestore primero */
    if (typeof db !== 'undefined' && NEXUS_STATE.fceUsuario) {
      db.collection('usuarios').doc(NEXUS_STATE.fceUsuario.uid).collection('anclajes').get()
        .then(function(snap) {
          var obj = {};
          snap.forEach(function(doc) { obj[doc.id] = doc.data(); });
          _cache = obj;
          _saveLS(obj);          /* sincronizar localStorage */
          if (cb) cb(obj);
        })
        .catch(function() {
          _cache = _loadLS();
          if (cb) cb(_cache);
        });
    } else {
      _cache = _loadLS();
      if (cb) cb(_cache);
    }
  }

  function _set(anclajeId, data, cb) {
    var obj = _cache || _loadLS();
    obj[anclajeId] = data;
    _cache = obj;
    _saveLS(obj);
    if (typeof db !== 'undefined' && NEXUS_STATE.fceUsuario) {
      db.collection('usuarios').doc(NEXUS_STATE.fceUsuario.uid)
        .collection('anclajes').doc(anclajeId)
        .set(data)
        .then(function() { if (cb) cb(true); })
        .catch(function() { if (cb) cb(true); }); /* no bloquear si falla Firestore */
    } else {
      if (cb) cb(true);
    }
  }

  function _del(anclajeId, cb) {
    var obj = _cache || _loadLS();
    delete obj[anclajeId];
    _cache = obj;
    _saveLS(obj);
    if (typeof db !== 'undefined' && NEXUS_STATE.fceUsuario) {
      db.collection('usuarios').doc(NEXUS_STATE.fceUsuario.uid)
        .collection('anclajes').doc(anclajeId)
        .delete()
        .catch(function() {});
    }
    if (cb) cb();
  }

  function isAnclado(anclajeId) {
    var obj = _cache || _loadLS();
    return !!obj[anclajeId];
  }

  /* ── Inyección en el well ─────────────────────────────────────── */
  function injectBtn(wellEl, item) {
    if (!wellEl || !item || !item.id) return;
    if (wellEl.querySelector('.n87-anc-btn')) return;

    var ancId = 'anc_' + item.id;
    var anclado = isAnclado(ancId);

    var btn = document.createElement('button');
    btn.className = 'n87-anc-btn' + (anclado ? ' n87-anc-active' : '');
    btn.setAttribute('data-anc-id', ancId);
    btn.innerHTML = anclado
      ? '📌 Anclado al Machete Maestro'
      : '📍 Anclar al Machete Maestro';

    btn.addEventListener('click', function() {
      var id = btn.getAttribute('data-anc-id');
      if (isAnclado(id)) {
        _del(id, function() {
          btn.className = 'n87-anc-btn';
          btn.innerHTML = '📍 Anclar al Machete Maestro';
          if (typeof iaShowToast === 'function') iaShowToast('📍 Anclaje removido', false);
        });
      } else {
        var now = new Date();
        _set(id, {
          itemId:  item.id,
          titulo:  item.titulo  || item.id,
          materia: item.materia || '',
          cuerpo:  (item.cuerpo || '').substring(0, 2000),
          fecha:   now.getDate() + '/' + (now.getMonth()+1) + '/' + now.getFullYear(),
          ts:      Date.now()
        }, function() {
          btn.className = 'n87-anc-btn n87-anc-active';
          btn.innerHTML = '📌 Anclado al Machete Maestro';
          if (typeof iaShowToast === 'function') iaShowToast('📌 Anclado al Machete Maestro', true);
        });
      }
    });

    wellEl.appendChild(btn);
  }

  /* ── Machete Maestro ──────────────────────────────────────────── */
  function openMacheteMaestro() {
    var obj = _cache || _loadLS();
    var items = Object.values(obj).sort(function(a,b){ return (b.ts||0)-(a.ts||0); });

    if (!items.length) {
      if (typeof iaShowToast === 'function') iaShowToast('⚠️ No hay fragmentos anclados aún', false);
      return;
    }

    var win = window.open('', '_blank', 'width=920,height=740');
    if (!win) return;

    var rows = items.map(function(it) {
      return '<div style="margin-bottom:24pt;border-left:4pt solid #1e3a8a;padding-left:12pt;page-break-inside:avoid">' +
        '<div style="font-family:Arial,sans-serif;font-size:7pt;font-weight:700;letter-spacing:.1em;' +
          'text-transform:uppercase;color:#1e3a8a;margin-bottom:3pt">' +
          it.materia + ' · ' + it.fecha +
        '</div>' +
        '<div style="font-family:Arial Black,sans-serif;font-size:11pt;color:#111;margin-bottom:6pt">' +
          _escHtml(it.titulo) +
        '</div>' +
        '<div style="font-family:Georgia,serif;font-size:10pt;line-height:1.65;color:#222">' +
          (it.cuerpo || '') +
        '</div>' +
      '</div>';
    }).join('');

    win.document.write(
      '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
      '<title>Machete Maestro — NEXUS FCE</title>' +
      '<style>*{box-sizing:border-box;margin:0;padding:0}' +
      'body{font-family:Georgia,serif;font-size:10.5pt;color:#111;background:#fff;padding:18mm 15mm;line-height:1.6}' +
      '.mm-header{border-top:4pt solid #1e3a8a;padding-top:10pt;margin-bottom:20pt}' +
      '.mm-inst{font-family:Arial,sans-serif;font-size:7pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#1e3a8a;margin-bottom:4pt}' +
      '.mm-titulo{font-family:Arial Black,sans-serif;font-size:16pt;font-weight:900;color:#111;margin-bottom:3pt}' +
      '.mm-meta{font-family:Arial,sans-serif;font-size:8.5pt;color:#888}' +
      '.no-print{margin-bottom:14px}' +
      '@media print{.no-print{display:none!important}}' +
      '</style></head><body>' +
      '<div class="no-print">' +
        '<button onclick="window.print()" style="padding:8px 20px;background:#1e3a8a;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11pt;margin-right:8px">🖨️ Imprimir</button>' +
        '<button onclick="window.close()" style="padding:8px 14px;background:#eee;border:none;border-radius:4px;cursor:pointer">✕ Cerrar</button>' +
      '</div>' +
      '<div class="mm-header">' +
        '<div class="mm-inst">FACULTAD DE CIENCIAS ECONÓMICAS · UNPSJB — NEXUS FCE</div>' +
        '<div class="mm-titulo">📌 Machete Maestro</div>' +
        '<div class="mm-meta">' + items.length + ' fragmento' + (items.length!==1?'s':'') + ' anclado' + (items.length!==1?'s':'') + ' · Generado ' + new Date().toLocaleDateString('es-AR') + '</div>' +
      '</div>' +
      rows +
      '</body></html>'
    );
    win.document.close();
  }

  function _escHtml(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ── Widget en dashboard ─────────────────────────────────────── */
  function renderDashWidget(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    load(function(obj) {
      var count = Object.keys(obj).length;
      el.innerHTML =
        '<div class="n87-anc-widget">' +
          '<div class="n87-anc-w-header">' +
            '<span class="n87-anc-w-icon">📌</span>' +
            '<div>' +
              '<div class="n87-anc-w-title">Machete Maestro</div>' +
              '<div class="n87-anc-w-sub">' + count + ' fragmento' + (count!==1?'s':'') + ' anclado' + (count!==1?'s':'') + '</div>' +
            '</div>' +
          '</div>' +
          '<button class="n87-anc-open-btn" onclick="N87Anclajes.openMacheteMaestro()">' +
            '🗂 Abrir Machete Maestro' +
          '</button>' +
        '</div>';
    });
  }

  return { load:load, injectBtn:injectBtn, isAnclado:isAnclado, openMacheteMaestro:openMacheteMaestro, renderDashWidget:renderDashWidget };
})();
window.N87Anclajes = N87Anclajes;
/* Cargar anclajes al arrancar (async, sin bloquear) */
N87Anclajes.load(null);


var N87EmergencyNote = (function() {
  'use strict';

  var FAIL_THRESHOLD = 3;

  /* Detectar materias con ≥ FAIL_THRESHOLD fallos en la sesión */
  function detectFailures(respuestas) {
    var byMat = {};
    (respuestas || []).forEach(function(r) {
      if (!r.ok) {
        var m = r.mat || 'Contabilidad';
        byMat[m] = (byMat[m] || 0) + 1;
      }
    });
    return Object.keys(byMat).filter(function(m) {
      return byMat[m] >= FAIL_THRESHOLD;
    });
  }

  /* Buscar noticia VIRCH relevante para la materia */
  function _pickNoticia(materia) {
    var pool = (typeof NOTICIAS_VIRCH !== 'undefined' ? NOTICIAS_VIRCH : [])
      .filter(function(n) { return n.materia === materia; });
    if (!pool.length) pool = (typeof NOTICIAS_VIRCH !== 'undefined' ? NOTICIAS_VIRCH : []);
    if (!pool.length) return null;
    /* Preferir dificultad básica o media para nota de emergencia */
    var easy = pool.filter(function(n){ return n.dificultad === 'básica' || n.dificultad === 'media'; });
    var source = easy.length ? easy : pool;
    return source[Math.floor(Math.random() * source.length)];
  }

  /* Construir HTML de la nota de emergencia */
  function _buildHTML(materia, noticia) {
    if (!noticia) return '';
    var solucionCorrecta = (noticia.solucion || []).filter(function(s){ return s.correcto; });
    var pasosHTML = solucionCorrecta.slice(0,3).map(function(p, i){
      return '<div class="n87-en-paso">' +
        '<span class="n87-en-paso-num">' + (i+1) + '</span>' +
        '<span class="n87-en-paso-txt">' + _escHtml(p.texto) + '</span>' +
      '</div>';
    }).join('');

    return '<div class="n87-en-wrap">' +
      '<div class="n87-en-header">' +
        '<div class="n87-en-icon">🚨</div>' +
        '<div>' +
          '<div class="n87-en-title">Nota de Emergencia — ' + materia + '</div>' +
          '<div class="n87-en-sub">Caso real del VIRCH para reforzar el concepto</div>' +
        '</div>' +
        '<button class="n87-en-close" onclick="this.closest(\'.n87-en-wrap\').remove()">✕</button>' +
      '</div>' +
      '<div class="n87-en-noticia-title">' + _escHtml(noticia.titulo) + '</div>' +
      '<div class="n87-en-noticia-texto">' + _escHtml(noticia.texto) + '</div>' +
      '<div class="n87-en-ejercicio-label">📝 Ejercicio simplificado:</div>' +
      '<div class="n87-en-ejercicio-txt">' + _escHtml(noticia.ejercicio || '') + '</div>' +
      '<div class="n87-en-solucion-label">✅ Solución paso a paso:</div>' +
      pasosHTML +
      '<div class="n87-en-footer">' +
        'Fuente: ' + _escHtml(noticia.fuente || 'VIRCH') + ' · ' + _escHtml(noticia.fecha || '') +
        ' · <button class="n87-en-mercado-btn" onclick="if(typeof n82OpenMercado===\'function\')n82OpenMercado()">Ver Mercado Real →</button>' +
      '</div>' +
    '</div>';
  }

  function _escHtml(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* Punto de entrada: llamar desde NexusExamen._finalizar */
  function evalAndInject(container, respuestas) {
    var failedMats = detectFailures(respuestas);
    if (!failedMats.length) return;

    /* Inyectar una nota por cada materia con ≥3 fallos (máx 2) */
    failedMats.slice(0, 2).forEach(function(materia) {
      var noticia = _pickNoticia(materia);
      if (!noticia) return;
      var html = _buildHTML(materia, noticia);
      if (!html || !container) return;
      var div = document.createElement('div');
      div.innerHTML = html;
      container.appendChild(div);
    });
  }

  return { detectFailures:detectFailures, evalAndInject:evalAndInject };
})();
window.N87EmergencyNote = N87EmergencyNote;


var N87Onyx = (function() {
  'use strict';

  var STORE_KEY = 'nexus87_onyx_v1';
  var STYLE_ID  = 'n87-onyx-style';

  var CSS_ONYX =
    ':root {' +
      '--bg:       #080a0f;' +
      '--ink:      #dde1ea;' +
      '--paper:    #0f1117;' +
      '--rule:     rgba(255,255,255,0.07);' +
      '--rule2:    rgba(255,255,255,0.04);' +
      '--muted:    #7a8399;' +
      '--muted2:   #4a5068;' +
      '--sb-bg:    #060810;' +
      '--sb-text:  #c8cdd8;' +
      '--sb-muted: #4a5068;' +
      '--sb-rule:  rgba(255,255,255,0.05);' +
      '--prop-s:   rgba(192,57,43,0.12);' +
      '--cont-s:   rgba(26,110,74,0.12);' +
      '--adm-s:    rgba(26,74,138,0.12);' +
      '--soc-s:    rgba(167,139,250,0.12);' +
      '--radius:   4px;' +
    '}' +
    'body { background: #080a0f !important; color: #dde1ea !important; }' +
    '#sb { background: #060810 !important; border-right: 1px solid rgba(255,255,255,.05) !important; }' +
    '#topbar { background: rgba(8,10,15,.96) !important; border-bottom: 1px solid rgba(255,255,255,.06) !important; }' +

    /* Cards y superficies */
    '.card,.hcard,.co,.acc,.bib-wrap,.qcard,.fc-card {' +
      'background: #0f1117 !important;' +
      'border-color: rgba(255,255,255,.07) !important;' +
    '}' +
    '.card:hover,.hcard:hover {' +
      'background: #141820 !important;' +
      'border-color: rgba(255,255,255,.14) !important;' +
      'box-shadow: 0 6px 28px rgba(0,0,0,.6) !important;' +
    '}' +

    /* ── CONTRASTE CRÍTICO: adm-highlight — WCAG AA ≥ 4.5:1 ── */
    /* Sobre fondo #0f1117 oscuro, usar texto claro + borde azul brillante */
    '.adm-highlight {' +
      'background: rgba(122,172,255,0.10) !important;' +
      'border-left: 3px solid #7aacff !important;' +
      'color: #c8d8f8 !important;' +           /* ratio ~7:1 sobre #0f1117 */
    '}' +
    '.adm-highlight strong { color: #e8f0fe !important; }' +   /* ratio ~9:1 */

    /* adm-block y adm-quote — ya son oscuros, solo afinar */
    '.adm-block { background: #0d1018 !important; border-color:rgba(255,255,255,.06)!important; }' +
    '.adm-quote { background: rgba(255,255,255,.03) !important; border-left-color:#5b8dee!important; color:#c8cdd8!important; }' +

    /* Texto base */
    '.page, .acc-body, .co, td, .card-body, .hcard-sub { color: #b0b8cc !important; }' +
    'th { color: var(--cur) !important; background: rgba(255,255,255,.03) !important; }' +
    'td:first-child, .card-title, .hcard-title, .acc-label, .tl-head { color: #dde1ea !important; }' +

    /* Inputs y textareas */
    'input, textarea, select {' +
      'background: #0d1018 !important;' +
      'border-color: rgba(255,255,255,.1) !important;' +
      'color: #dde1ea !important;' +
    '}' +

    /* N86 y N87 widgets — heredan el tema */
    '.n86-hl-wrap,.n86-me-wrap,.n87-an-wrap,.n87-anc-widget,.n87-en-wrap {' +
      'background: #0f1117 !important;' +
      'border-color: rgba(255,255,255,.07) !important;' +
    '}' +
    '.n86-hl-select,.n86-hl-textarea,.n86-me-ta {' +
      'background: #0d1018 !important;' +
      'border-color: rgba(255,255,255,.1) !important;' +
      'color: #dde1ea !important;' +
    '}' +

    /* Sidebar items */
    '.sb-item:hover { background: rgba(255,255,255,.03) !important; }' +
    '.sb-item.active { background: rgba(255,255,255,.06) !important; }' +

    /* Scrollbar */
    '::-webkit-scrollbar-track { background: #080a0f !important; }' +
    '::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1) !important; }' +

    /* Animación de entrada más sutil para modo Onyx */
    '.page { animation: n87OnyxFadeIn .3s ease both !important; }' +
    '@keyframes n87OnyxFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }';

  function isActive() {
    try { return localStorage.getItem(STORE_KEY) === '1'; } catch(e) { return false; }
  }

  function enable() {
    /* Desactivar Glass si está activo (mutuamente excluyentes) */
    if (typeof N86Glass !== 'undefined' && N86Glass.isActive()) N86Glass.disable();
    var s = document.getElementById(STYLE_ID);
    if (!s) {
      s = document.createElement('style');
      s.id = STYLE_ID;
      document.head.appendChild(s);
    }
    s.textContent = CSS_ONYX;
    try { localStorage.setItem(STORE_KEY, '1'); } catch(e) {}
    _updateBtn(true);
  }

  function disable() {
    var s = document.getElementById(STYLE_ID);
    if (s) s.remove();
    try { localStorage.setItem(STORE_KEY, '0'); } catch(e) {}
    _updateBtn(false);
  }

  function toggle() { isActive() ? disable() : enable(); }

  function _updateBtn(active) {
    var btn = document.getElementById('n87-onyx-toggle');
    if (!btn) return;
    btn.textContent = active ? '🌑 Onyx: ON' : '🌑 Onyx: OFF';
    btn.style.background   = active ? 'rgba(221,225,234,0.08)' : '';
    btn.style.borderColor  = active ? 'rgba(221,225,234,0.2)'  : '';
    btn.style.color        = active ? '#dde1ea' : '';
  }

  function renderToggleBtn(containerId) {
    var el = containerId ? document.getElementById(containerId) : null;
    if (!el) el = document.querySelector('.sb-footer');
    if (!el) return;
    if (document.getElementById('n87-onyx-toggle')) return;
    var btn = document.createElement('button');
    btn.id        = 'n87-onyx-toggle';
    btn.className = 'n86-glass-toggle-btn';   /* reutilizar estilos */
    btn.onclick   = function() { N87Onyx.toggle(); };
    btn.textContent = isActive() ? '🌑 Onyx: ON' : '🌑 Onyx: OFF';
    if (isActive()) {
      btn.style.background  = 'rgba(221,225,234,0.08)';
      btn.style.borderColor = 'rgba(221,225,234,0.2)';
      btn.style.color       = '#dde1ea';
    }
    el.appendChild(btn);
  }

  function init() {
    if (isActive()) enable();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){ renderToggleBtn(null); });
    } else {
      setTimeout(function(){ renderToggleBtn(null); }, 350);
    }
  }

  return { isActive:isActive, enable:enable, disable:disable, toggle:toggle, renderToggleBtn:renderToggleBtn, init:init };
})();
window.N87Onyx = N87Onyx;
N87Onyx.init();

/* ── T1: N89Predictor — Neural Mapping ──────────────────────────────────── */
var N89Predictor = (function () {
  'use strict';

  /* Leer legajos: Firestore (online) con fallback localStorage (offline) */
  function _loadLegajos(cb) {
    /* Online: Firestore n75_legajos del usuario actual */
    if (typeof db !== 'undefined' && NEXUS_STATE.fceUsuario) {
      db.collection('n75_legajos')
        .where('uid', '==', NEXUS_STATE.fceUsuario.uid)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get()
        .then(function (snap) {
          var docs = [];
          snap.forEach(function (d) { docs.push(d.data()); });
          cb(docs);
        })
        .catch(function () { cb(_localLegajos()); });
    } else {
      cb(_localLegajos());
    }
  }

  /* Fallback: construir legajos desde localStorage n88_history */
  function _localLegajos() {
    var hist = [], score = { ok: 0, fail: 0 };
    try { hist  = JSON.parse(localStorage.getItem('n88_history') || '[]'); } catch(e) {}
    try { score = JSON.parse(localStorage.getItem('n88_score')   || '{}'); } catch(e) {}
    return hist.map(function (h) {
      return {
        noticia_id:         h.noticiaId || '',
        acierto:            h.pct >= 60,
        agrupador_asociado: '',
        tiempo_respuesta_ms: null,
        pct:                h.pct || 0
      };
    });
  }

  /* Calcular zonas de calor por agrupador */
  function _calcHeatmap(legajos) {
    var map = {};
    legajos.forEach(function (leg) {
      var ag = leg.agrupador_asociado || leg.noticia_id || 'general';
      if (!map[ag]) map[ag] = { ok: 0, fail: 0, tiempos: [], materia: leg.agrupador_asociado || '' };
      if (leg.acierto) map[ag].ok++;
      else             map[ag].fail++;
      if (leg.tiempo_respuesta_ms) map[ag].tiempos.push(leg.tiempo_respuesta_ms);
    });

    /* Score de riesgo: fallos altos + tiempo bajo = mayor prioridad */
    return Object.keys(map).map(function (ag) {
      var d    = map[ag];
      var total= d.ok + d.fail;
      var errRate = total > 0 ? d.fail / total : 0;
      var avgMs   = d.tiempos.length
        ? d.tiempos.reduce(function(a,b){return a+b;},0) / d.tiempos.length : 9999;
      var risk = errRate * 100 + (avgMs < 5000 ? 20 : 0); /* respuesta rápida = duda */
      return { ag: ag, errRate: errRate, avgMs: avgMs, risk: risk, total: total };
    }).sort(function (a, b) { return b.risk - a.risk; });
  }

  /* Encontrar materiales asociados a los agrupadores de riesgo */
  function _matchMaterials(heatZones) {
    var fceData = NexusCore.getMateriales();
    var results = [];
    var seen    = {};

    heatZones.slice(0, 3).forEach(function (zone) {
      var ag = (zone.ag || '').toLowerCase();
      fceData.forEach(function (item) {
        if (!item || item.tipo !== 'Resumen') return;
        if (seen[item.id]) return;
        var itemAg = (item.agrupador || '').toLowerCase();
        var match  = ag !== 'general' && (
          itemAg.indexOf(ag.substring(0,6)) !== -1 ||
          ag.indexOf((itemAg||'').substring(0,6)) !== -1
        );
        if (match) {
          seen[item.id] = true;
          results.push({ item: item, risk: zone.risk, errRate: zone.errRate });
        }
      });
    });

    return results.slice(0, 6);
  }

  /* Renderizar panel de Prioridad de Repaso en el Home */
  function _renderPriority(matches) {
    var el = document.getElementById('n89-priority-container');
    if (!el) return;
    if (!matches.length) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';

    var colors = {
      /* v19.3.1 */ ...NEXUS_NAME_COLORS
    };

    var html =
      '<div class="n89-prio-header">' +
        '<span class="n89-prio-icon">🎯</span>' +
        '<div><div class="n89-prio-title">Prioridad de Repaso</div>' +
        '<div class="n89-prio-sub">Basada en tus fallos del simulador</div></div>' +
      '</div><div class="n89-prio-list">';

    matches.forEach(function (m) {
      var item  = m.item;
      var color = colors[item.materia] || NEXUS_COLORS.materias.home.base /* v19.3.2 */;
      var riskPct = Math.round(m.errRate * 100);
      var matPage = {
        'Contabilidad':'cont-materiales','Administración':'adm-materiales',
        'Sociales':'soc-materiales','Propedéutica':'prop-materiales'
      }[item.materia] || 'home';
      html +=
        '<div class="n89-prio-item" style="border-left-color:' + color + '" ' +
          'onclick="goto(\'' + matPage + '\',null);setTimeout(function(){' +
          'var c=document.getElementById(\'mcard-' + item.id + '\');' +
          'if(c){c.scrollIntoView({behavior:\'smooth\'});if(typeof fceCard===\'function\')fceCard(\'mcard-' + item.id + '\')}},700)">' +
          '<div class="n89-pi-mat" style="color:' + color + '">' + item.materia + '</div>' +
          '<div class="n89-pi-titulo">' + item.titulo + '</div>' +
          '<div class="n89-pi-ag">' + (item.agrupador || '') + '</div>' +
          '<div class="n89-pi-risk">' +
            '<div class="n89-pi-bar"><div class="n89-pi-fill" style="width:' + riskPct + '%;background:' + color + '"></div></div>' +
            '<span class="n89-pi-pct">' + riskPct + '% error</span>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  return {
    /* Análisis principal — llamar al init del dashboard */
    analyze: function () {
      _loadLegajos(function (legajos) {
        if (!legajos.length) return;
        var zones   = _calcHeatmap(legajos);
        var matches = _matchMaterials(zones);
        _renderPriority(matches);
      });
    },
    /* Exponer para debug */
    _heatmap: function (cb) { _loadLegajos(function(l){ cb(_calcHeatmap(l)); }); }
  };
}());
window.N89Predictor = N89Predictor;

/* ══ NEXUS v9.0 — SINGULARITY ACHIEVED ══════════════════════════════════ */

/* ── T1: N90Singularity — búsqueda cross-source en un evento ────────────── */
var N90Singularity = (function () {
  'use strict';

  /* Resultado cruzado de las 3 fuentes */
  function _crossSearch(q) {
    if (!q || q.length < 2) return { glossary: [], materiales: [], noticias: [] };
    var ql = q.toLowerCase().trim();

    /* 1. Glossary */
    var gloss = [];
    if (N83Glossary._data) {
      Object.keys(N83Glossary._data).forEach(function (term) {
        if (term.indexOf(ql) !== -1 || ql.indexOf(term.substring(0,5)) !== -1) {
          gloss.push({ term: term, entry: N83Glossary._data[term] });
        }
      });
    }

    /* 2. Materiales */
    var mats = [];
    if (NexusCore.getMateriales()) {
      NexusCore.getMateriales().forEach(function (item) {
        if (!item || item.tipo !== 'Resumen') return;
        var text = ((item.titulo||'') + ' ' + (item.agrupador||'')).toLowerCase();
        if (text.indexOf(ql) !== -1) mats.push(item);
      });
    }

    /* 3. Noticias */
    var news = [];
    if (window.NOTICIAS_VIRCH && window.NOTICIAS_VIRCH.length) {
      window.NOTICIAS_VIRCH.forEach(function (n) {
        var text = ((n.titulo||'') + ' ' + (n.ejercicio||'')).toLowerCase();
        if (text.indexOf(ql) !== -1) news.push(n);
      });
    }

    return { glossary: gloss.slice(0,3), materiales: mats.slice(0,4), noticias: news.slice(0,2) };
  }

  function _renderResults(q, res, el) {
    /* v9.1: Filtro de relevancia — detectar materia activa desde el DOM */
    var _activePage = document.querySelector('.page.active');
    var _activeId   = _activePage ? (_activePage.id || '') : '';
    var _MATMAP = {'cont-materiales':'Contabilidad','adm-materiales':'Administración','soc-materiales':'Sociales','prop-materiales':'Propedéutica'};
    var _activeMat  = _MATMAP[_activeId] || null;

    /* Si hay materia activa, priorizar sus materiales y filtrar glossary */
    if (_activeMat && res.materiales.length > 1) {
      var inMat = res.materiales.filter(function(m){ return m.materia === _activeMat; });
      if (inMat.length) res.materiales = inMat; /* mostrar solo la materia activa */
    }

    var hasAny = res.glossary.length || res.materiales.length || res.noticias.length;
    if (!hasAny) {
      el.innerHTML = '<p class="n90-empty">Sin resultados para "' + q + '" en ninguna fuente.</p>';
      return;
    }

    var srcCount = [res.glossary.length, res.materiales.length, res.noticias.length].filter(Boolean).length;
    var html = '<div class="n90-cross-badge">⚡ Singularity — ' + srcCount + ' fuente' + (srcCount!==1?'s':'') + (_activeMat?' · '+_activeMat:'') + '</div>';

    if (res.glossary.length) {
      html += '<div class="n90-section"><div class="n90-sec-title">📖 Glosario EN/NIIF</div>';
      res.glossary.forEach(function (g) {
        html += '<div class="n90-gloss-item">' +
          '<span class="n90-gi-term">' + g.term + '</span><span class="n90-gi-en"> / ' + g.entry.en + '</span>' +
          '<div class="n90-gi-niif">' + (g.entry.explicacion_pibe || g.entry.niif || '').substring(0,120) + '…</div></div>';
      });
      html += '</div>';
    }

    if (res.materiales.length) {
      html += '<div class="n90-section"><div class="n90-sec-title">📚 Base Teórica</div>';
      var colors = NEXUS_NAME_COLORS;
      res.materiales.forEach(function (item) {
        var color = colors[item.materia] || NEXUS_COLORS.materias.home.base /* v19.3.2 */;
        var matPage = {'Contabilidad':'cont-materiales','Administración':'adm-materiales','Sociales':'soc-materiales','Propedéutica':'prop-materiales'}[item.materia]||'home';
        html += '<div class="n90-mat-item" onclick="goto(\'' + matPage + '\',null)" style="border-left-color:' + color + '">' +
          '<span class="n90-mi-mat" style="color:' + color + '">' + item.materia + '</span>' +
          '<span class="n90-mi-titulo">' + item.titulo + '</span></div>';
      });
      html += '</div>';
    }

    if (res.noticias.length) {
      html += '<div class="n90-section"><div class="n90-sec-title">📰 Caso VIRCH</div>';
      res.noticias.forEach(function (n) {
        html += '<div class="n90-news-item" onclick="n82OpenMercado()">' +
          '<div class="n90-ni-titulo">' + n.titulo + '</div>' +
          '<div class="n90-ni-ej">' + (n.ejercicio||'').substring(0,80) + '…</div></div>';
      });
      html += '</div>';
    }

    el.innerHTML = html;
  }

  return {
    /* Reemplaza/extiende NexusSearch con búsqueda cross-source */
    search: function (q) {
      var el = document.getElementById('ns-results');
      if (!el) return;
      if (!q || q.length < 2) { el.style.display = 'none'; return; }

      /* Correr la búsqueda cross-source + la búsqueda de NexusSearch */
      var cross = _crossSearch(q);
      var nexus = typeof NexusSearch !== 'undefined' ? NexusSearch.query(q) : [];

      /* Si hay resultados de NexusSearch, los mostramos primero */
      if (nexus.length) {
        if (typeof NexusSearch !== 'undefined') NexusSearch._onInput(q);
        /* Agregar sección cross debajo */
        var extra = document.createElement('div');
        extra.id  = 'n90-cross-results';
        extra.className = 'n90-cross-panel';
        _renderResults(q, cross, extra);
        var existing = document.getElementById('n90-cross-results');
        if (existing) existing.remove();
        if (el.parentNode) el.parentNode.appendChild(extra);
      } else {
        _renderResults(q, cross, el);
        el.style.display = 'block';
      }
    }
  };
}());
window.N90Singularity = N90Singularity;



/* ── T3: CURVA DE PREPARACIÓN ───────────────────────────────────────────── */
var N89CurvaPrep = {
  /* Calcular confianza por materia usando scores + n88_history */
  compute: function () {
    var scores = {};
    try { scores = JSON.parse(localStorage.getItem('fce_portal_scores_v1') || '{}'); } catch(e) {}
    var hist = [];
    try { hist = JSON.parse(localStorage.getItem('n88_history') || '[]'); } catch(e) {}

    var mats = ['Contabilidad','Administración','Sociales','Propedéutica'];
    var result = {};

    mats.forEach(function (mat) {
      /* Score de quizzes */
      var matKey = mat.toLowerCase().split(' ')[0];
      var quizScores = Object.keys(scores)
        .filter(function (k) { return k.indexOf(matKey) !== -1; })
        .map(function (k) { return (scores[k].best || scores[k].last || {}).pct || 0; });
      var quizAvg = quizScores.length
        ? quizScores.reduce(function(a,b){return a+b;},0) / quizScores.length : 0;

      /* Score del simulador para esta materia */
      var simScores = hist.filter(function (h) {
        return (h.materia || '').indexOf(matKey) !== -1;
      }).map(function (h) { return h.pct || 0; });
      var simAvg = simScores.length
        ? simScores.reduce(function(a,b){return a+b;},0) / simScores.length : 0;

      /* Confianza ponderada: 60% quizzes + 40% simulador */
      var conf = simScores.length
        ? Math.round(quizAvg * 0.6 + simAvg * 0.4)
        : Math.round(quizAvg);

      result[mat] = { confianza: conf, quizAvg: Math.round(quizAvg), simAvg: Math.round(simAvg) };
    });
    return result;
  },

  /* Renderizar curva en el Legajo */
  render: function (containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var data   = N89CurvaPrep.compute();
    var colors = {
      /* v19.3.1 */ ...NEXUS_NAME_COLORS
    };
    var hasData = Object.values(data).some(function(d){ return d.confianza > 0; });

    if (!hasData) {
      el.innerHTML = '<p class="n89-curve-empty">Completá al menos un Quiz o Simulación para ver tu curva de preparación.</p>';
      return;
    }

    var html = '<div class="n89-curve-wrap">';
    Object.keys(data).forEach(function (mat) {
      var d = data[mat];
      var color = colors[mat] || NEXUS_COLORS.materias.home.base /* v19.3.2 */;
      var conf  = d.confianza;
      var label = conf >= 80 ? 'Listo' : conf >= 60 ? 'En progreso' : conf > 0 ? 'Necesita refuerzo' : 'Sin datos';
      html +=
        '<div class="n89-curve-row">' +
          '<div class="n89-cr-mat" style="color:' + color + '">' + mat + '</div>' +
          '<div class="n89-cr-barwrap">' +
            '<div class="n89-cr-bar" style="width:' + conf + '%;background:' + color + '"></div>' +
          '</div>' +
          '<div class="n89-cr-right">' +
            '<span class="n89-cr-conf">' + conf + '%</span>' +
            '<span class="n89-cr-label">' + label + '</span>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }
};
window.N89CurvaPrep = N89CurvaPrep;

/* ── T4: NOTA DEL PROFE PROACTIVA ───────────────────────────────────────── */
var N89ProfeProactive = {
  /* Antes de abrir un card, sugerir término del glosario relacionado */
  suggest: function (item) {
    if (!item || !item.agrupador) return;
    if (typeof N83Glossary === 'undefined') return;

    /* Mapeo agrupador → términos del glosario */
    var AG_TERMS = {
      'Itinerario I':  ['activo','pasivo','patrimonio neto','balance general'],
      'Itinerario II': ['variación patrimonial','debe','haber','partida doble'],
      'Itinerario III':['libro diario','factura','devengado'],
      'Itinerario IV': ['activo corriente','pasivo corriente','capital'],
      'Itinerario V':  ['resultado del ejercicio','iva','empresa en marcha'],
      'Unidad I':      ['habitus','campo','obstáculo epistemológico','autonomía universitaria'],
      'Unidad II':     ['capital cultural','cogobierno','rse','stakeholder'],
      'Unidad III':    ['estructura organizacional','planificación'],
    };

    var ag    = item.agrupador || '';
    var terms = null;
    Object.keys(AG_TERMS).forEach(function (key) {
      if (ag.indexOf(key) !== -1 && !terms) terms = AG_TERMS[key];
    });
    if (!terms) return;

    /* Si el glosario no está cargado, cargarlo ahora */
    if (!N83Glossary._data) {
      N83Glossary.load();
      return; /* aparecerá en el próximo hover */
    }

    /* Elegir un término del agrupador que el alumno no haya visto en el glosario */
    var seen = {};
    try { seen = JSON.parse(localStorage.getItem('n89_gloss_seen') || '{}'); } catch(e) {}
    var unseen = terms.filter(function (t) { return !seen[t] && N83Glossary._data[t]; });
    if (!unseen.length) unseen = terms.filter(function(t){ return N83Glossary._data[t]; });
    if (!unseen.length) return;

    var term = unseen[Math.floor(Math.random() * unseen.length)];
    N89ProfeProactive._showBadge(term, item);
  },

  _showBadge: function (term, item) {
    var existing = document.getElementById('n89-profe-badge');
    if (existing) existing.remove();

    var entry = N83Glossary._data[term];
    if (!entry) return;

    /* Marcar como visto */
    try {
      var seen = JSON.parse(localStorage.getItem('n89_gloss_seen') || '{}');
      seen[term] = Date.now();
      localStorage.setItem('n89_gloss_seen', JSON.stringify(seen));
    } catch(e) {}

    var badge = document.createElement('div');
    badge.id  = 'n89-profe-badge';
    badge.className = 'n89-profe-badge';
    badge.innerHTML =
      '<div class="n89-pb-header">' +
        '<span class="n89-pb-icon">🎓</span>' +
        '<span class="n89-pb-label">Antes de empezar</span>' +
        '<button onclick="this.closest(\'#n89-profe-badge\').remove()" class="n89-pb-close">✕</button>' +
      '</div>' +
      '<div class="n89-pb-term">' + term + '</div>' +
      '<div class="n89-pb-niif">' + (entry.explicacion_pibe || entry.niif || '') + '</div>' +
      '<div class="n89-pb-en-ref">Ref. técnica: ' + entry.niif.substring(0,80) + '…</div>';

    /* Insertar en el card activo */
    var well = document.querySelector('.mat-card.open .mc-well');
    if (well) well.insertBefore(badge, well.firstChild);
    setTimeout(function () { if (badge.parentNode) badge.remove(); }, 10000);
  }
};
window.N89ProfeProactive = N89ProfeProactive;

(function () {
  'use strict';

  /* ── Design tokens — byte-identical to JSON "materia" field values ── */
  /* v19.3.1: colores derivados de NEXUS_COLORS, no hardcodeados         */
  var _m = typeof NEXUS_COLORS !== 'undefined' ? NEXUS_COLORS.materias : null;
  var CFG = {
    'Propedéutica':  { color: _m ? _m.prop.base : '#f59e0b', alpha: 'rgba('+(_m ? _m.prop.rgb : '245,158,11')+',', prefix:'prop' },
    'Contabilidad':  { color: _m ? _m.cont.base : '#58a6ff', alpha: 'rgba('+(_m ? _m.cont.rgb : '88,166,255')+',',  prefix:'cont' },
    'Administración':{ color: _m ? _m.adm.base  : '#3b82f6', alpha: 'rgba('+(_m ? _m.adm.rgb  : '59,130,246')+',',  prefix:'adm'  },
    'Sociales':      { color: _m ? _m.soc.base  : '#a78bfa', alpha: 'rgba('+(_m ? _m.soc.rgb  : '167,139,250')+',', prefix:'soc'  },
    /* legacy aliases — keep for backward compat */
    'Contabilidad I':   { color: _m ? _m.cont.base : '#58a6ff', alpha: 'rgba('+(_m ? _m.cont.rgb : '88,166,255')+',',  prefix:'cont' },
    'Administración I': { color: _m ? _m.adm.base  : '#3b82f6', alpha: 'rgba('+(_m ? _m.adm.rgb  : '59,130,246')+',',  prefix:'adm'  },
    'Cs. Sociales':     { color: _m ? _m.soc.base  : '#a78bfa', alpha: 'rgba('+(_m ? _m.soc.rgb  : '167,139,250')+',', prefix:'soc'  }
  };

  var U_ORDER = ['U1','U2','U3','U4','RESUMEN','TEST']; /* legacy - kept for non-refactored pages */
  var U_LABEL = {
    U1:'Unidad I', U2:'Unidad II', U3:'Unidad III', U4:'Unidad IV',
    RESUMEN:'Resúmenes y Programa', TEST:'Quiz y Autoevaluación'
  };
  var TIPO_ORDER = {Programa:1, Cronograma:2, Resumen:3, 'Práctico':4, Quiz:5};
  var TIPO_LABELS = {
    Programa:'📋 Programa', Cronograma:'📅 Cronograma',
    Resumen:'📖 Resumen', 'Práctico':'⚡ Práctico', Quiz:'🎯 Quiz'
  };

  function agrupadorSortKey(ag) {
    /* Special groups always last */
    if (ag === 'Trabajos Prácticos') return 90;
    if (ag === 'Sin grupo')          return 98;
    var ROMAN = {'0':0,'I':1,'II':2,'III':3,'IV':4,'V':5,'VI':6,'VII':7,'VIII':8,'IX':9,'X':10};
    /* Primero: número/romano al final del string  →  "Itinerario III", "Unidad II"   */
    var m = ag.match(/(\d+|[IVX]+)$/);
    /* Fallback: número/romano en cualquier lugar  →  "Unidad 1 — Patrimonio"         */
    if (!m) m = ag.match(/\b(\d+|[IVX]+)\b/);
    if (!m) return 95;
    var n = m[1];
    return n in ROMAN ? ROMAN[n] : (parseInt(n,10) || 95);
  }

  /* Quiz item id → existing quiz page id */
  var QUIZ_MAP = {
    'prop-quiz-flashcards'    : 'prop-quiz',
    'cont-quiz-banco-completo': 'cont-quiz',
    'adm-u1-banco-preguntas'  : 'adm-u1-quiz',
    'adm-u2-simulacro'        : 'adm-u2-simulacro',
    'soc-quiz-u1-completo'    : 'soc-quiz',
    'soc-quiz-u2-completo'    : 'soc-quiz-u2',
    'soc-quiz-u3-completo'    : 'soc-quiz-u3'
  };

  /* Page id → materia name (must match JSON exactly) */
  var MAT_PAGES = {
  'training-ground': '',   /* v7.0: Training Ground */
  'nexus-tablon':    '',   /* v7.3: Tablón de Dudas */
  'nexus-examen':    '',   /* v7.4: Simulador de Examen Final */
  'mercado-real':    '',   /* v8.2: Simulador de Mercado */
  'comparativa-global': '', /* v8.3: Comparativa Regional */
  'guarani-sim':        '', /* v8.5: Simulador Guaraní */
    'prop-materiales': 'Propedéutica',
    'cont-materiales': 'Contabilidad',
    'adm-materiales':  'Administración',
    'adm-u2-resumenes':'Administración',
    'adm-u2-simulacro': 'Administración',
    'soc-materiales':  'Sociales'
  };

  /* ── State ─────────────────────────────────────────────────────────── */
  var _data        = [];   /* full JSON array — empty until fetch completes */
  var _activeTab   = {};   /* pageId → current unidadKey */
  var _built       = {};   /* pageId → true once DOM is built */
  var _pending     = [];   /* pageIds queued while data not yet loaded (FIX B) */


  /* ── toggleModoParcial — Fase 9.1 ────────────────────────────────── */
  function toggleModoParcial() {
    NEXUS_MODO_PARCIAL = !NEXUS_MODO_PARCIAL;
    localStorage.setItem('nexus_modo_parcial', NEXUS_MODO_PARCIAL);
    console.log('[NEXUS] modo parcial:', NEXUS_MODO_PARCIAL);

    /* Re-render todas las páginas buildeadas para aplicar el filtro */
    Object.keys(_built).forEach(function(pid) {
      _built[pid] = false;
    });

    /* Buildear la página activa ahora */
    var activePid = Object.keys(MAT_PAGES).find(function(pid) {
      if (!MAT_PAGES[pid]) return false;
      var pg = document.getElementById(pid);
      return pg && pg.classList.contains('active');
    });
    if (activePid) _buildPage(activePid);

    /* Actualizar visual del botón en el sidebar */
    var btn = document.getElementById('nexus-modo-parcial-btn');
    if (btn) {
      btn.textContent = NEXUS_MODO_PARCIAL ? '🎯 Modo Parcial ON' : '🎯 Modo Parcial';
      btn.style.background = NEXUS_MODO_PARCIAL ? 'var(--color-err,#f85149)' : '';
      btn.style.color      = NEXUS_MODO_PARCIAL ? '#fff' : '';
    }
  }
  window.toggleModoParcial = toggleModoParcial;   /* exponer para onclick */

  /* ── Renders granulares — Fase 11.1 ────────────────────────────────────
     ARQUITECTURA: una función por responsabilidad.
     Cada una accede SOLO a su slice de estado.
     NexusCore.on() las suscribe individualmente con prioridad.

     renderSync(data):       sincroniza _data local — DEBE correr primero
     renderSidebar(data):    actualiza sidebar con mapa + links
     renderActivePage(data): buildea la página activa actual
     nexusRenderAll(data):   wrapper compat — llama las 3 en orden
     ─────────────────────────────────────────────────────────────────── */

  /* 1. SYNC — sincroniza _data local con NexusCore */
  function renderSync(data) {
    if (!data || !data.length) return;
    _data = data;
    if (typeof NexusPerf !== 'undefined') NexusPerf.mark('render-start');
    console.log('[NEXUS] materiales sincronizados:', _data.length);
  }

  /* 2. SIDEBAR — renderiza mapa de relaciones + sidebar nav */
  function renderSidebar(data) {
    if (!data || !data.length || !_data.length) return;
    try {
      if (typeof nexusBuildMap     === 'function') nexusBuildMap(_data);
      if (typeof nexusBuildSidebar === 'function') nexusBuildSidebar(_data);
    } catch(e) { console.error('[NEXUS] renderSidebar error:', e); }
  }

  /* 3. PAGE — buildea la página activa y flush de cola pendiente.
     Virtualización: si items > VIRT_THRESHOLD → NexusVirtualList.
     Con 84 items el render < 2ms — VirtualList activo con > 200 items. */
  /* Umbral de virtualización:
     - Dev (window.__NEXUS_DEV__): 50 → detecta problemas antes
     - Prod: basado en altura real del contenedor × 3 (scroll buffer)
     - Fallback fijo: 200 si no hay referencia de altura disponible */
  var VIRT_THRESHOLD = window.__NEXUS_DEV__ ? 50 : 200;

  function _shouldVirtualize(items, host) {
    if (window.__NEXUS_DEV__ && items.length > 50) return true;
    var containerH = (host && host.clientHeight) || 600;
    var ITEM_HEIGHT = 72;
    return items.length * ITEM_HEIGHT > containerH * 3;
  }

  function renderActivePage() {
    if (!_data.length) return;
    try {
      var activePid = Object.keys(MAT_PAGES).find(function(pid) {
        if (!MAT_PAGES[pid]) return false;
        var pg = document.getElementById(pid);
        return pg && pg.classList.contains('active');
      });

      if (activePid && !_built[activePid]) _buildPage(activePid);

      var still_pending = [];
      _pending.forEach(function(pid) {
        var pg = document.getElementById(pid);
        if (pg && pg.classList.contains('active')) _buildPage(pid);
        else still_pending.push(pid);
      });
      _pending = still_pending;

      if (typeof NexusPerf !== 'undefined') {
        var dur = NexusPerf.measure('render[page]', 'render-start');
        if (dur > 16) console.warn('[NexusPerf] Page render lento:', dur.toFixed(1) + 'ms');
      }
    } catch(e) { console.error('[NEXUS] renderActivePage error:', e); }
  }

  /* ── renderRecommendations — Fase 12 ────────────────────────────────
     Pinta las recomendaciones en el dashboard (#nexus-recs).
     Solo se activa si el contenedor existe en el DOM.               */
  function renderRecommendations() {
    try {
      var recs = NexusCore.get('recommendations') || [];
      var el   = document.getElementById('nexus-recs');
      if (!el) return;

      if (!recs.length) {
        el.innerHTML = '';
        return;
      }

      var html = '<div class="nexus-recs-title">📌 Repasá esto</div>';
      html += recs.map(function(m) {
        return '<div class="nexus-rec-item" onclick="goto(\'' +
          (m.materia || 'cont').toLowerCase().replace(/[éáíóú]/g, function(c) {
            return {é:'e',á:'a',í:'i',ó:'o',ú:'u'}[c] || c;
          }).replace(/[^a-z]/g, '-').replace(/-+/g, '-') + '-materiales\', null)">' +
          '<span class="nexus-rec-mat">' + esc(m.materia || '') + '</span>' +
          '<span class="nexus-rec-titulo">' + esc(m.titulo || '') + '</span>' +
        '</div>';
      }).join('');
      el.innerHTML = html;
    } catch(e) { console.error('[NEXUS] renderRecommendations:', e); }
  }

  /* ── renderStats — Fase 12 ───────────────────────────────────────────
     Actualiza los indicadores de accuracy/velocidad en el dashboard.  */
  function renderStats() {
    try {
      var profile  = NexusCore.get('userProfile');
      if (!profile || !profile.stats.total) return;

      var stats    = profile.stats;
      var speed    = profile.speed;
      var accuracy = Math.round(stats.accuracy * 100);
      var avgSec   = speed.avgResponseTime > 0
        ? (speed.avgResponseTime / 1000).toFixed(1) + 's'
        : '—';

      /* Accuracy badge */
      var accEl = document.getElementById('nexus-stat-accuracy');
      if (accEl) accEl.textContent = accuracy + '%';

      /* Velocidad promedio */
      var spdEl = document.getElementById('nexus-stat-speed');
      if (spdEl) spdEl.textContent = avgSec;

      /* Total respondidas */
      var totEl = document.getElementById('nexus-stat-total');
      if (totEl) totEl.textContent = stats.total;

    } catch(e) { console.error('[NEXUS] renderStats:', e); }
  }

  /* nexusRenderAll — wrapper de compatibilidad.
     Solo disponible en __NEXUS_DEV__ o como safety net interno de _boot.
     En producción NO se suscribe a NexusCore — evitar uso externo. */
  function nexusRenderAll(data) {
    renderSync(data);
    renderSidebar(data);
    renderActivePage();
  }
  /* Dev mode: exponer nexusRenderAll para debugging */
  if (window.__NEXUS_DEV__) {
    window.__nexusRenderAll = nexusRenderAll;
    console.info('[NEXUS DEV] __nexusRenderAll disponible en consola.');
  }

  /* ── Suscripciones granulares por dominio — Fase 11.1 ───────────
     Cada suscriptor controla SOLO su slice. Sin render global.
     Orden garantizado por NexusScheduler (high antes que normal):
       1. renderSync     (high)   — sincroniza _data
       2. renderSidebar  (normal) — sidebar + mapa
       3. renderActivePage (normal) — contenido activo
       4. renderUserUI   (high)   — badge de usuario
     ─────────────────────────────────────────────────────────────── */
  if (window.NexusCore) {
    NexusCore.on('materiales', renderSync,       { priority: 'normal' });   /* sync no es crítico — normal */
    NexusCore.on('materiales', renderSidebar,    { priority: 'normal' });
    NexusCore.on('materiales', renderActivePage, { priority: 'normal' });

    /* Suscripción a cambios de sesión — priority high (interacción crítica) */
    NexusCore.on('legacy', function(legacyState) {
      try {
        var nombreEl = document.getElementById('dash-nombre');
        if (nombreEl && legacyState && legacyState.fceUsuario) {
          var u = legacyState.fceUsuario;
          var nombre = (u.displayName || u.email || 'Estudiante').split(' ')[0];
          nombreEl.textContent = nombre + ', ¡a estudiar!';
        }
      } catch(e) {}
    }, { priority: 'high' });

    /* Suscripción a scroll — re-render de lista virtual si está activa */
    NexusCore.on('ui:list', function() {
      /* NexusVirtualList se actualiza solo vía su propio scroll handler */
    }, { priority: 'normal' });

    /* ── Fase 12: Intelligence Layer ────────────────────────────────
       Suscripciones reactivas a métricas y recomendaciones.
       Cada función accede SOLO a su slice de estado.          */
    NexusCore.on('recommendations', renderRecommendations, { priority: 'normal' });
    NexusCore.on('userProfile',     renderStats,           { priority: 'normal' });

    var _initialData = NexusCore.getMateriales();
    if (_initialData && _initialData.length) {
      nexusRenderAll(_initialData);
    }
  }

  /* ── Utility ───────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function norm(s) {
  window.norm = norm; /* v5.9: expose globally */
    return String(s == null ? '' : s).trim().toLowerCase();
  }
  function sortU(a, b) {
    var ia = U_ORDER.indexOf(a), ib = U_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  }

  /* FIX D: guard against undefined items and missing keys */
  function groupBy(arr, key) {
    var map = {}, order = [];
    if (!Array.isArray(arr)) return { map: map, order: order };
    arr.forEach(function (x) {
      if (x == null) return;                   /* skip null/undefined items */
      var k = x[key];
      if (k == null || k === '') k = 'OTROS';  /* skip missing key values  */
      k = String(k);
      if (!map[k]) { map[k] = []; order.push(k); }
      map[k].push(x);
    });
    return { map: map, order: order };
  }

  function getCfg(materia) {
    return CFG[materia] || { color:'#888', alpha:'rgba(136,136,136,', prefix:'?' };
  }

  /* ── Public: toggle accordion card ────────────────────────────────── */
  window.fceCard = function (cardId) {
    var card = document.getElementById(cardId);
    if (!card) return;
    var wasOpen = card.classList.contains('open');
    card.classList.toggle('open');
    /* v8.4: cancelar tracker de fatiga si se cierra */
    if (wasOpen && typeof N84Fatigue !== 'undefined') N84Fatigue.cancel(cardId);
    /* v8.9: Nota del Profe proactiva al abrir */
    if (!wasOpen && typeof N89ProfeProactive !== 'undefined' && NexusCore.getMateriales()) {
      var _item89 = NexusCore.getMateriales().find(function(i){ return i&&i.id===cardId.replace('mcard-',''); });
      if (_item89) setTimeout(function(){ N89ProfeProactive.suggest(_item89); }, 300);
    }
    if (!wasOpen) {
      var ph = card.querySelector('.mc-body-ph');
      if (ph && ph.dataset.ready !== '1') _injectBody(ph);
      if (typeof NexusMemoryAPI !== 'undefined') {
        NexusMemoryAPI.emit('card:open', { cardId: cardId, ts: Date.now() });
      }
      setTimeout(function() { if (typeof n68TrackScroll === 'function') n68TrackScroll(cardId); }, 500);
      setTimeout(function() {
        if (typeof n68StartTimer === 'function') {
          var mat = card.dataset.materia || '';
          var ag  = card.dataset.agrupador || '';
          n68StartTimer(mat, ag);
        }
      }, 200);
      /* v7.9: pre-computar quiz idle mientras el alumno lee */
      if (typeof n79PrecomputeQuiz === 'function') {
        var _mat79 = card.dataset.materia || '';
        var _ag79  = card.dataset.agrupador || '';
        n79PrecomputeQuiz(_mat79, _ag79);
      }
    }
  };

  /* ── Public: switch unit tab ────────────────────────────────────────  */
  /* ── v17: Toggle colapsable de unidad ──────────────────────────────── */
  window.nexusToggleUnit = function(btn) {
    var bodyId = btn.dataset.unit + '-body';
    var bodyEl = document.getElementById(bodyId);
    if (!bodyEl) return;

    var isOpen = btn.classList.contains('mc-unit-open');

    if (isOpen) {
      /* Cerrar */
      bodyEl.style.maxHeight = bodyEl.scrollHeight + 'px';
      requestAnimationFrame(function() {
        bodyEl.style.transition = 'max-height .3s cubic-bezier(.4,0,.2,1), opacity .25s ease';
        bodyEl.style.maxHeight  = '0';
        bodyEl.style.opacity    = '0';
      });
      setTimeout(function() {
        bodyEl.style.display = 'none';
        bodyEl.style.maxHeight = '';
        bodyEl.style.opacity   = '';
        bodyEl.style.transition= '';
      }, 310);
      btn.classList.remove('mc-unit-open');
    } else {
      /* Abrir */
      bodyEl.style.display  = 'block';
      bodyEl.style.maxHeight= '0';
      bodyEl.style.opacity  = '0';
      requestAnimationFrame(function() {
        bodyEl.style.transition = 'max-height .35s cubic-bezier(.4,0,.2,1), opacity .3s ease';
        bodyEl.style.maxHeight  = bodyEl.scrollHeight + 'px';
        bodyEl.style.opacity    = '1';
      });
      setTimeout(function() {
        bodyEl.style.maxHeight = '';
        bodyEl.style.transition= '';
      }, 360);
      btn.classList.add('mc-unit-open');
    }
  };

  window.fceTab = function (pageId, unit) {
    _activeTab[pageId] = unit;
    var page = document.getElementById(pageId);
    if (!page) return;
    page.querySelectorAll('.fce-unit-tab').forEach(function (b) {
      b.classList.toggle('active', b.dataset.unit === unit);
    });
    page.querySelectorAll('.fce-unit-panel').forEach(function (p) {
      p.classList.toggle('active', p.dataset.unit === unit);
    });
    var inp = page.querySelector('.fce-search-input');
    if (inp) inp.value = '';
    _showAllCards(page, unit);
  };

  /* ── Public: search within active unit panel ────────────────────────  */
  window._fceSearch_noop = null;

  /* ── Public: render trigger — called from goto() ────────────────────
     FIX B: if data not yet loaded, queue the pageId for later            */
  window.fceRender = function (pageId) {
    if (!MAT_PAGES[pageId]) return;

    if (!_data || _data.length === 0) {         /* FIX C: explicit guard  */
      if (_pending.indexOf(pageId) === -1) _pending.push(pageId);
      return;
    }

    if (_built[pageId]) {
      window.scrollTo(0, 0);
      return;
    }

    _buildPage(pageId);
  };

  /* ── Build full materiales page inside its dynamic host ─────────────  */
  /* ── v4.2: Embudo de Aprendizaje — groups by agrupador, sorts by tipo ── */

  /* ── FASE 2: Ponderación topológica por tipo ───────────────────────── */
  var TIPO_SORT_WEIGHT = {
    'Programa':1,'PROGRAMA':1,
    'Cronograma':2,'CRONOGRAMA':2,
    'Resumen':3,'Texto':3,'TEXTO':3,
    'Práctico':4,'PRACTICO':4,'PDF':4,'LINK':4,
    'Quiz':5,'TEST':5,'QUIZ':5
  };

  function _agrupadorLabel(materia, unidad) {
    var isContabilidad = materia && (materia === 'Contabilidad I' || materia === 'Contabilidad');
    var labels = {
      'U1': isContabilidad ? 'Itinerario I'   : 'Unidad I',
      'U2': isContabilidad ? 'Itinerario II'  : 'Unidad II',
      'U3': isContabilidad ? 'Itinerario III' : 'Unidad III',
      'U4': isContabilidad ? 'Itinerario IV'  : 'Unidad IV',
      'U5': isContabilidad ? 'Itinerario V'   : 'Unidad V',
      'U6': isContabilidad ? 'Itinerario VI'  : 'Unidad VI',
      'RESUMEN': 'Programa y Cronograma',
      'TEST':    'Quiz y Autoevaluación',
      'TP':      'Trabajos Prácticos'
    };
    return labels[unidad] || unidad;
  }

  function _buildPage(pageId) {
    if (!_data || _data.length === 0) return;
    var page = document.getElementById(pageId);
    if (!page) return;
    var host = page.querySelector('[data-mat-dynamic]');
    if (!host) return;

    var materia = (host.dataset.materia || MAT_PAGES[pageId] || '').trim();
    var cfg     = getCfg(materia);
    var color   = cfg.color;
    var alpha   = cfg.alpha;

    var items = _data.filter(function(i) {
      return i != null && norm(i.materia) === norm(materia);
    });

    /* ── Fase 9.1: Modo Parcial — filtro y orden ──────────────────── */
    if (NEXUS_MODO_PARCIAL) {
      /* Filtrar: Quiz, Práctico, e ítems con 'trampa' o 'parcial' en el id */
      var _tiposParcial = { 'Quiz': true, 'Práctico': true };
      items = items.filter(function(i) {
        if (_tiposParcial[i.tipo]) return true;
        var idLow = (i.id || '').toLowerCase();
        if (idLow.indexOf('trampa') !== -1 || idLow.indexOf('parcial') !== -1) return true;
        return false;
      });

      /* Ordenar: trampas primero, quiz segundo, prácticos último */
      items.sort(function(a, b) {
        function _rank(i) {
          var idLow = (i.id || '').toLowerCase();
          if (idLow.indexOf('trampa') !== -1) return 0;
          if (i.tipo === 'Quiz')              return 1;
          if (i.tipo === 'Práctico')          return 2;
          return 3;
        }
        return _rank(a) - _rank(b);
      });
    }
    /* ────────────────────────────────────────────────────────────── */

    if (!items.length) {
      host.innerHTML = NEXUS_MODO_PARCIAL
        ? '<p style="font-family:\'DM Mono\',monospace;font-size:.75rem;' +
          'color:rgba(255,255,255,.35);padding:24px 0;text-align:center">' +
          '🎯 Modo Parcial: sin Quiz ni Prácticos en esta materia. Desactivalo para ver todo.</p>'
        : '<p style="font-family:\'DM Mono\',monospace;font-size:.75rem;' +
          'color:rgba(255,255,255,.35);padding:24px 0;text-align:center">Sin materiales para esta materia.</p>';
      return;
    }

    /* Content Type System: verificar mezcla en dev antes de renderizar */
    if (window.__NEXUS_DEV__) {
      var _agGroups = {};
      items.forEach(function(i) {
        var ag = i.agrupador || i.unidad || 'Sin grupo';
        if (!_agGroups[ag]) _agGroups[ag] = [];
        _agGroups[ag].push(i);
      });
      Object.keys(_agGroups).forEach(function(ag) {
        _assertNoMix(_agGroups[ag], ag);
      });
    }

    /* STRUCTURE RECONSTRUCTION — Sort por agrupador → originalIndex → tipo
       Orden de precedencia:
         1. agrupador     — unidades pedagógicas (U1 < U2 < U3)
         2. originalIndex — índice JSON (fuente de verdad: orden del HTML original)
                            fallback a 'orden' si originalIndex no está disponible
         3. tipo          — Programa < Cronograma < Resumen < Práctico < Quiz
       Regla: si originalIndex existe → fuente principal de orden dentro del agrupador.
              Si no existe → fallback a 'orden' (campo manual legacy). */
    items.sort(function(a, b) {
      var agA = a.agrupador || a.unidad || 'Z';
      var agB = b.agrupador || b.unidad || 'Z';
      var agDiff = agrupadorSortKey(agA) - agrupadorSortKey(agB);
      if (agDiff !== 0) return agDiff;
      /* Posición dentro del agrupador: originalIndex si existe, orden si no */
      var posA = a.originalIndex !== undefined ? a.originalIndex : (a.orden || 0);
      var posB = b.originalIndex !== undefined ? b.originalIndex : (b.orden || 0);
      var posDiff = posA - posB;
      if (posDiff !== 0) return posDiff;
      return (TIPO_ORDER[a.tipo] || 9) - (TIPO_ORDER[b.tipo] || 9);
    });

    /* Group by agrupador */
    var byAg = {}, agOrder = [];
    /* v14: merge agrupadores with same numeric rank into canonical key
       e.g. 'Unidad I' and 'Unidad 1 — Fundamentos' both become the
       descriptive one (longer label wins) so content shows together. */
    var _agCanon = {};  /* numericKey → canonical agrupador label */
    items.forEach(function(item) {
      var ag = item.agrupador || item.unidad || 'Sin grupo';
      var key = agrupadorSortKey(ag);
      if (key < 90) {
        var existing = _agCanon[key];
        if (!existing || ag.length > existing.length) _agCanon[key] = ag;
      }
    });
    items.forEach(function(item) {
      var ag = item.agrupador || item.unidad || 'Sin grupo';
      var key = agrupadorSortKey(ag);
      /* Use canonical (longest/most descriptive) label for this rank */
      var canonical = (key < 90 && _agCanon[key]) ? _agCanon[key] : ag;
      if (!byAg[canonical]) { byAg[canonical] = []; agOrder.push(canonical); }
      byAg[canonical].push(item);
    });
    agOrder = agOrder.filter(function(a,i,arr){ return arr.indexOf(a)===i; }); /* dedup */
    agOrder.sort(agrupadorSortKey);

    /* ── Search bar ── */
    var _pid = esc(pageId);
    var html = '<div class="fce-search-row">' +
      '<input class="fce-search-input" type="search"' +
      ' placeholder="Buscar materiales…"' +
      ' oninput="fceSearch(\'' + _pid + '\')" />' +
      '</div>';

      /* ── Fase 13.4.0: mc-unit sections — unidades estructuradas ──────────
         Reemplaza v42-ag-section. Estructura:
           <section.mc-unit>
             <header.mc-unit-header> kicker + h2
             <nav.mc-unit-toc>       TOC generado por _buildUnitTOCs()
             <div.mc-unit-body>      contenido document (mc-doc)
             <div.mc-unit-practice>  cards práctica/quiz
           </section>
         INVARIANTE: teoría siempre antes que práctica, nunca mezcladas.  */
    agOrder.forEach(function(ag) {
      var agItems  = byAg[ag];
      var isZero   = ag.match(/(Itinerario|Unidad|Programa)\s*0/i) ||
                     ag === 'Trabajos Prácticos';
      var unitSlug = pageId + '-unit-' + ag.replace(/[^a-z0-9]/gi, '-').toLowerCase();

      /* ── v15 ESTÁNDAR: separar en 3 capas ──────────────────────────────
         CAPA 1 — TEORÍA:   document-mode + resúmenes modulares
         CAPA 2 — PRÁCTICA: Práctico / PDF / LINK (sin quiz)
         CAPA 3 — QUIZ:     solo tipo Quiz/TEST — CTA destacado            */

      var docItems      = agItems.filter(function(i) {
        return i.renderMode === 'document' &&
               (i.bodyOriginal || (i.cuerpoTipo === 'html' && i.cuerpo));
      });
      var resumModular  = agItems.filter(function(i) {
        return i.renderMode !== 'document' &&
               (i.tipo === 'Resumen' || i.tipo === 'Texto' || i.tipo === 'Cronograma');
      });
      var pracItems     = agItems.filter(function(i) {
        var t = i.tipo || '';
        return i.renderMode !== 'document' &&
               (t === 'Práctico' || t === 'PDF' || t === 'LINK');
      });
      var quizItems     = agItems.filter(function(i) {
        var t = i.tipo || '';
        return t === 'Quiz' || t === 'TEST' || t === 'QUIZ';
      });
      var progItems     = agItems.filter(function(i) {
        return i.tipo === 'Programa' || i.tipo === 'PROGRAMA';
      });

      var hasTeoria   = docItems.length > 0 || resumModular.length > 0;
      var hasPractica = pracItems.length > 0;
      var hasQuiz     = quizItems.length > 0;

      /* Kicker label */
      var kicMatch = ag.match(/^([A-Za-z\u00C0-\u024F]+)/);
      var kicWord  = kicMatch ? kicMatch[1].toUpperCase() : 'UNIDAD';

      html += '<section class="mc-unit" id="' + esc(unitSlug) +
              '" data-ag="' + esc(ag) + '">';

      /* ── Header de unidad colapsable ───────────────────────────────── */
      if (!isZero) {
        var pills = '';
        if (hasTeoria)   pills += '<span class="mc-unit-pill mc-unit-pill--teoria">📖 Teoría</span>';
        if (hasPractica) pills += '<span class="mc-unit-pill mc-unit-pill--practica">✏️ Práctica</span>';
        if (hasQuiz)     pills += '<span class="mc-unit-pill mc-unit-pill--quiz">🎯 Quiz</span>';

        html += '<button class="mc-unit-toggle" ' +
          'onclick="nexusToggleUnit(this)" ' +
          'data-unit="' + esc(unitSlug) + '" ' +
          'style="--unit-color:' + color + '">' +
            '<div class="mc-unit-toggle-left">' +
              '<div class="mc-unit-kicker">' + esc(kicWord) + '</div>' +
              '<div class="mc-unit-title">' + esc(ag) + '</div>' +
              (pills ? '<div class="mc-unit-pills">' + pills + '</div>' : '') +
            '</div>' +
            '<span class="mc-unit-toggle-arrow">›</span>' +
          '</button>';

        /* Collapsible body — closed by default */
        html += '<div class="mc-unit-body-wrap" id="' + esc(unitSlug) + '-body" style="display:none">';
      } else {
        /* Unidad 0 (programa) — siempre visible, sin toggle */
        html += '<div class="mc-unit-body-wrap" id="' + esc(unitSlug) + '-body">';
      }

      /* ── Programa — card especial compacta ──────────────────────────── */
      if (progItems.length > 0) {
        html += '<div class="mc-unit-programa">';
        progItems.forEach(function(item) { html += _buildCard(item, color, alpha); });
        html += '</div>';
      }

      /* ── TOC placeholder ────────────────────────────────────────────── */
      html += '<nav class="mc-unit-toc" aria-label="Contenido de esta unidad"></nav>';

      /* ══════════════════════════════════════════════════════════════════
         CAPA 1 — TEORÍA
         Document-mode primero (contenido generado, más completo),
         luego resúmenes modulares (cards individuales expandibles).
         ══════════════════════════════════════════════════════════════════ */
      if (hasTeoria) {
        html += '<div class="mc-unit-body">';

        /* 1a. Document-mode — lectura continua */
        if (docItems.length > 0) {
          var docId = 'mc-doc-' + ag.replace(/[^a-z0-9]/gi, '-').toLowerCase();
          html += '<div class="mc-doc" id="' + esc(docId) + '">';
          docItems.forEach(function(docItem) {
            html += docItem.bodyOriginal ||
                    (docItem.cuerpoTipo === 'html' ? (docItem.cuerpo || '') : '');
          });
          html += '</div>'; /* /mc-doc */
        }

        /* 1b. Resúmenes modulares — cards expandibles */
        if (resumModular.length > 0) {
          if (docItems.length > 0) {
            /* Separador visual entre document y modular */
            html += '<div class="mc-section-divider">' +
                    '<span class="mc-section-divider-label">Materiales adicionales</span>' +
                    '</div>';
          }
          html += '<div class="mc-resumen-grid">';
          resumModular.forEach(function(item) {
            html += _buildCard(item, color, alpha);
          });
          html += '</div>'; /* /mc-resumen-grid */
        }

        html += '</div>'; /* /mc-unit-body */
      }

      /* ══════════════════════════════════════════════════════════════════
         CAPA 2 — PRÁCTICA
         Siempre debajo de teoría. Cards compactas con label "PRÁCTICA".
         ══════════════════════════════════════════════════════════════════ */
      if (hasPractica) {
        html += '<div class="mc-unit-practice">' +
                '<div class="mc-section-header mc-section-header--practica">' +
                  '<span class="mc-section-icon">✏️</span>' +
                  '<span class="mc-section-label">Trabajos Prácticos</span>' +
                  '<span class="mc-section-count">' + pracItems.length + '</span>' +
                '</div>' +
                '<div class="mc-practica-grid">';
        pracItems.forEach(function(item) {
          html += _buildCard(item, color, alpha);
        });
        html += '</div></div>'; /* /mc-practica-grid /mc-unit-practice */
      }

      /* ══════════════════════════════════════════════════════════════════
         CAPA 3 — QUIZ
         CTA destacado al final de la unidad. Un botón grande por quiz.
         ══════════════════════════════════════════════════════════════════ */
      if (hasQuiz) {
        html += '<div class="mc-unit-quiz">';
        quizItems.forEach(function(qitem) {
          var qTitulo = esc(qitem.titulo || 'Quiz de esta unidad');
          var qDesc   = esc(qitem.descripcion || '');
          var qId     = esc(qitem.id || '');
          html +=
            '<div class="mc-quiz-cta" onclick="fceCard(\'mcard-' + qId + '\')"' +
            ' style="--quiz-color:' + color + ';--quiz-alpha:' + alpha + '.15)">' +
              '<div class="mc-quiz-cta-left">' +
                '<span class="mc-quiz-cta-icon">🎯</span>' +
                '<div class="mc-quiz-cta-text">' +
                  '<span class="mc-quiz-cta-title">' + qTitulo + '</span>' +
                  (qDesc ? '<span class="mc-quiz-cta-desc">' + qDesc + '</span>' : '') +
                '</div>' +
              '</div>' +
              '<span class="mc-quiz-cta-arrow" style="color:' + color + '">→</span>' +
            '</div>' +
            /* Keep the original card hidden for fceCard() to expand */
            '<div style="display:none">' + _buildCard(qitem, color, alpha) + '</div>';
        });
        html += '</div>'; /* /mc-unit-quiz */
      }

      /* ── Unidad vacía ───────────────────────────────────────────────── */
      if (!hasTeoria && !hasPractica && !hasQuiz && progItems.length === 0) {
        html += '<div class="mc-unit-empty">' +
                '<span class="mc-unit-empty-icon">🔜</span>' +
                '<span class="mc-unit-empty-text">Contenido próximamente</span>' +
                '</div>';
      }

      html += '</div>'; /* /mc-unit-body-wrap */
      html += '</section>'; /* /mc-unit */
    });

    /* Empty state */
    html += '<div class="fce-empty" style="display:none;font-family:\'DM Mono\',monospace;' +
      'font-size:.72rem;color:rgba(255,255,255,.3);padding:20px 0;text-align:center">' +
      'Sin resultados para esta búsqueda.</div>';

    /* Virtualización: DESHABILITADA hasta implementar contenedor con altura fija.
       NexusVirtualList requiere overflow:auto + altura explícita en el host.
       El portal actual usa páginas de scroll completo — incompatible.
       Se reactiva en Fase 13 cuando se rediseñe el contenedor de materiales.
       Con 84 items el render normal es < 2ms — sin impacto de performance. */

    host.innerHTML = html;
    _injectAllBodies(host, items, color);
    _normalizeDocumentStructure(host); /* Fase 13.5.1: reestructura DOM antes del TOC */
    _transformSubGridToAccordions(host, color); /* v14: sub-grid → acordeones ANTES del TOC */
    _buildUnitTOCs(host);              /* Fase 13.4.0: genera TOC (post-normalize) */
    _sanitizeDocContent(host);         /* Fase 13.5.1: limpia inline styles light-mode */
    /* Modo Parcial: banner va DESPUÉS del innerHTML para no ser sobreescrito */
    if (NEXUS_MODO_PARCIAL) {
      var _b2 = document.createElement('div');
      _b2.style.cssText = [
        'display:flex;align-items:center;gap:.75rem;',
        'background:var(--color-err-bg,rgba(248,81,73,.10));border:1px solid rgba(var(--color-err-rgb,248,81,73),.3);',
        'border-radius:6px;padding:.7rem 1.1rem;margin-bottom:1.25rem;',
        'font-family:\'DM Mono\',monospace;font-size:.68rem;',
        'color:var(--color-err,#f85149);letter-spacing:.04em;'
      ].join('');
      _b2.innerHTML = '🎯 <strong>Modo Parcial activo</strong> — ' +
        'mostrando ' + items.length + ' ítem' + (items.length !== 1 ? 's' : '') +
        ' (Quiz · Prácticos · Trampas). ' +
        '<button onclick="toggleModoParcial()" ' +
        'style="margin-left:auto;background:none;border:1px solid var(--color-err,#f85149);' +
        'color:var(--color-err,#f85149);padding:.2rem .6rem;border-radius:3px;cursor:pointer;' +
        'font-family:inherit;font-size:inherit;">Desactivar ×</button>';
      host.insertBefore(_b2, host.firstChild);
    }
    _built[pageId] = true;
  }

  /* ── Build one card's outer HTML (structure only) ────────────────────  */
  function _buildCard(item, color, alpha) {
    if (!item) return '';
    var iid  = item.id   || '';
    var tipo = item.tipo || 'Texto';
    var isExt = tipo === 'PDF' || tipo === 'LINK';

    /* PDF → alerta roja, LINK/TEST/QUIZ → color de materia activa */
    var tBg = tipo === 'PDF'
      ? 'var(--color-err,#f85149)'
      : (tipo === 'LINK' ? alpha+'.55)' : color);
    var num = item.numero != null ? esc(String(item.numero)) : '';

    var tipoClass = 'mc-tipo-' + (item.tipo||'texto').toLowerCase()
      .replace(/é/g,'e').replace(/á/g,'a').replace(/[^a-z]/g,'-');
    var h = '<div class="mat-card ' + tipoClass + '" id="mcard-' + esc(iid) + '"' +
              ' data-titulo="' + esc(item.titulo || '') + '"' +
              ' data-desc="'   + esc(item.descripcion || '') + '">';

    if (isExt) {
      var hasRealLink = item.pdf_id && item.pdf_id.length > 10;
      var linkHref = hasRealLink ? esc(item.url || '#') : '#';
      var linkStyle = hasRealLink ? '' : 'opacity:.45;cursor:not-allowed;pointer-events:none';
      h +=
        '<a class="mc-link" href="' + linkHref + '"' +
        (hasRealLink ? ' target="_blank" rel="noopener"' : '') +
        ' style="border-color:' + alpha + '.2);' + linkStyle + '">' +
          '<span class="mc-link-icon">' + (hasRealLink ? (tipo === 'PDF' ? '⬇' : '↗') : '🔒') + '</span>' +
          '<div class="mc-link-meta">' +
            '<span class="mc-link-titulo">' + esc(item.titulo || '') + '</span>' +
            (item.descripcion
              ? '<span class="mc-link-desc">' + esc(item.descripcion) + '</span>'
              : '') +
          '</div>' +
          '<span class="mc-tipo-badge" style="background:' + tBg + '">' + esc(tipo) + '</span>' +
        '</a>';
    } else {
      h +=
        '<div class="mc-header"' +
        ' onclick="fceCard(\'mcard-' + esc(iid) + '\')"' +
        ' style="--mc-hover:' + alpha + '.04)">' +
          '<span class="mc-num"' +
          ' style="color:' + color + ';border-color:' + alpha + '.2);background:' + alpha + '.06)">' +
            num +
          '</span>' +
          '<div class="mc-meta">' +
            (item.clase
              ? '<span class="mc-clase">' + esc(item.clase) + '</span>'
              : '') +
            '<span class="mc-titulo">' + esc(item.titulo || '') + '</span>' +
            (item.descripcion
              ? '<span class="mc-desc">' + esc(item.descripcion) + '</span>'
              : '') +
          '</div>' +
          '<span class="mc-tipo-badge" style="background:' + tBg + '">' + esc(tipo) + '</span>' +
          '<span class="mc-arrow" style="font-size:1.1rem;color:rgba(255,255,255,.45);transition:transform .22s,color .15s">›</span>' +
        '</div>' +
        '<div class="mc-body">' +
          '<div class="mc-body-ph" data-item-id="' + esc(iid) + '" data-ready="0"></div>' +
        '</div>';
    }

    h += '</div>';
    return h;
  }

  /* ── Fase 13.4.0: TOC generation + scroll spy per mc-unit ─────────────
     Escanea cada .mc-unit-body en busca de .sub-tag, h3, h4.
     Genera IDs únicos donde falten.
     Construye links de navegación en .mc-unit-toc.
     Activa IntersectionObserver para resaltar el link activo.         */
  function _buildUnitTOCs(host) {
    var units = host.querySelectorAll('.mc-unit');
    if (!units.length) return;

    var _idSeq = 0;  /* contador global para IDs únicos dentro de esta página */

    units.forEach(function(unit) {
      var tocEl  = unit.querySelector('.mc-unit-toc');
      var bodyEl = unit.querySelector('.mc-unit-body');
      if (!tocEl) return;
      /* Si no hay cuerpo de teoría → ocultar TOC */
      if (!bodyEl) { tocEl.style.display = 'none'; return; }

      /* Cabeceras navegables: sub-tag (etiqueta de sección), h3, h4 */
      var headings = bodyEl.querySelectorAll('.sub-tag, h3, h4');
      if (!headings.length) { tocEl.style.display = 'none'; return; }

      var links = [];
      headings.forEach(function(el) {
        var text = (el.textContent || '').trim();
        if (!text) return;

        /* Asignar id si no tiene */
        if (!el.id) {
          var slug = text.toLowerCase()
            .replace(/[\u00e0-\u00e6\u00e0]/g,'a')
            .replace(/[\u00e8-\u00eb]/g,'e')
            .replace(/[\u00ec-\u00ef]/g,'i')
            .replace(/[\u00f2-\u00f6\u00f8]/g,'o')
            .replace(/[\u00f9-\u00fc]/g,'u')
            .replace(/\u00f1/g,'n')
            .replace(/[^a-z0-9]+/g,'-')
            .replace(/^-|-$/g,'');
          el.id = (slug || 'sec') + '-' + (++_idSeq);
        }

        var depthClass = (el.tagName === 'H4') ? ' mc-unit-toc-link--sub' : '';
        links.push(
          '<a href="#' + el.id + '" class="mc-unit-toc-link' + depthClass + '">' +
          text.replace(/&/g,'&amp;').replace(/</g,'&lt;') +
          '</a>'
        );
      });

      if (!links.length) { tocEl.style.display = 'none'; return; }

      /* Cambio 5 (v13.7.1): si hay más de 8 links, ocultar h4 por defecto.
         El TOC solo muestra h3/sub-tag → más escaneable, menos ruido.    */
      var finalLinks = links;
      if (links.length > 8) {
        finalLinks = links.filter(function(l) {
          return l.indexOf('mc-unit-toc-link--sub') === -1;
        });
      }

      tocEl.innerHTML = finalLinks.join('');

      /* Scroll spy — resaltar link del heading visible */
      if (!window.IntersectionObserver) return;
      var tocLinks = tocEl.querySelectorAll('.mc-unit-toc-link');
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          var targetId = entry.target.id;
          tocLinks.forEach(function(a) {
            a.classList.toggle(
              'mc-unit-toc-link-active',
              a.getAttribute('href') === '#' + targetId
            );
          });
        });
      }, { rootMargin: '-10% 0px -72% 0px', threshold: 0 });

      headings.forEach(function(el) { if (el.id) obs.observe(el); });
    });
  }

  /* ── Fase 13.5.1: Normalize document structure ─────────────────────────
     Opera ANTES de _buildUnitTOCs para que el TOC capture h3 correctamente.
     Operaciones:
       1. div.sub-tag → h3.sub-tag  (encabezado real, no label invisible)
       2. .sub-item: margin-bottom  (bloques mentales, no texto continuo)
       3. Párrafos largos: margin-bottom extra (respiración entre ideas)    */
  function _normalizeDocumentStructure(host) {
    host.querySelectorAll('.mc-doc').forEach(function(doc) {
      /* 1. div.sub-tag → h3.sub-tag
         CSS es class-based → el cambio de tag no rompe estilos.
         El TOC de _buildUnitTOCs ya busca '.sub-tag, h3, h4' → captura ambos. */
      doc.querySelectorAll('div.sub-tag').forEach(function(el) {
        var h3 = document.createElement('h3');
        h3.className = el.className;
        h3.innerHTML  = el.innerHTML;
        var inlineStyle = el.getAttribute('style');
        if (inlineStyle) h3.setAttribute('style', inlineStyle);
        el.parentNode.replaceChild(h3, el);
      });

      /* 2. sub-item — espacio explícito entre bloques de contenido */
      doc.querySelectorAll('.sub-item').forEach(function(si) {
        si.style.marginBottom = '1.5rem';
      });

      /* 3. Párrafos largos — margen inferior para romper "pared de texto" */
      doc.querySelectorAll('p').forEach(function(p) {
        if ((p.textContent || '').length > 400) {
          p.style.marginBottom = '1rem';
        }
      });
    });
  }

  /* ── Fase 13.5.1: Sanitize inline styles inside mc-doc ─────────────────
     Versión 2: opera sobre el atributo raw 'style' como string, no sobre
     la API CSSStyleDeclaration. Motivo: los navegadores expanden shorthands
     (background → background-color, border → border-left-color, etc.) lo
     que hace unreliable chequear el.style.background para un shorthand.
     Operando sobre getAttribute('style') vemos el string original.
     CSS nuclear en nexus-ui-system.css (.mc-doc * { color: inherit !important })
     garantiza que los inline colors no ganen aunque el JS falle.           */
  function _sanitizeDocContent(host) {
    host.querySelectorAll('.mc-doc').forEach(function(doc) {
      doc.querySelectorAll('[style]').forEach(function(el) {
        var raw = el.getAttribute('style') || '';
        /* Solo procesar si contiene paleta light-mode (26,21,16) */
        if (!/rgba?\s*\(\s*26/.test(raw)) return;

        var fixed = raw
          /* background/background-color rgba(26...) → dark neutral */
          .replace(/(background(?:-color)?)\s*:\s*rgba?\(\s*26[^)]+\)/gi,
                   '$1:rgba(248,250,252,.06)')
          /* border shorthand con rgba(26...) → borde visible sobre dark */
          .replace(/(border[^:]*:\s*(?:[\d.]+\w+\s+\w+\s+))rgba?\(\s*26[^)]+\)/gi,
                   '$1rgba(248,250,252,.20)');

        if (fixed !== raw) el.setAttribute('style', fixed);

        /* Color: CSS !important lo maneja; eliminar inline color como refuerzo */
        el.style.removeProperty('color');

        /* Opacity < 0.7 → sin restricción visual (CSS hereda 1) */
        var op = parseFloat(el.style.opacity);
        if (!isNaN(op) && op < 0.7) el.style.removeProperty('opacity');
      });
    });
  }

  /* ── Inject all card bodies after innerHTML is set ─────────────────── */
  /* ── v14: Sub-grid → Acordeones ──────────────────────────────────────
     Convierte cada .sub-grid > .sub-item en un cont-accordion desplegable.
     El .sub-tag dentro del sub-item se usa como título del header.
     Se ejecuta post-render sobre mc-doc para no alterar el JSON source.    */
  /* v19.3.6: exponer en window para que Nexus6.Lazy.wrap pueda llamarla (scope fix) */
  window._nexusTransformSubGrids = function(host, color) {
    _transformSubGridToAccordions(host, color);
  };

  function _transformSubGridToAccordions(host, color) {
    var accentColor = color || 'var(--fce-color, #58a6ff)';
    var grids = host.querySelectorAll('.mc-doc .sub-grid, .mc-unit-body .sub-grid, .mc-well .sub-grid');
    /* v19: fallback para cuando host ES el .mc-well (llamada desde lazy callback) */
    if (!grids.length && host.classList && host.classList.contains('mc-well')) {
      grids = host.querySelectorAll('.sub-grid');
    }
    if (!grids.length) return;

    grids.forEach(function(grid) {
      /* v19.3.4: guided block mode — data-block-mode manual tiene prioridad;
         si no está definido, el sistema infiere automáticamente             */
      var blockMode = grid.dataset.blockMode || 'auto';

      var items = grid.querySelectorAll(':scope > .sub-item');
      if (!items.length) return;

      /* Auto-inferencia: si no hay modo explícito, decidir por contenido */
      if (blockMode === 'auto') {
        blockMode = _inferBlockMode(items);
      }

      /* Desviar a renderer guided con fallback a accordion si falla */
      if (blockMode === 'guided') {
        try {
          _renderGuidedGroup(grid, items, accentColor);
          return; /* salir del forEach para este grid */
        } catch (e) {
          console.warn('[NEXUS] guided render fallback to accordion:', e);
          /* cae al código de accordion a continuación */
        }
      }

      var wrapper = document.createElement('div');
      wrapper.className = 'nx-accordion-group';
      wrapper.style.cssText = 'display:flex;flex-direction:column;gap:5px;margin-bottom:1.5rem;';

      items.forEach(function(item, idx) {
        var tagEl = item.querySelector(':scope > .sub-tag, :scope > h3.sub-tag, :scope > div.sub-tag');
        var title  = tagEl ? tagEl.textContent.trim() : ('Sección ' + (idx + 1));
        if (tagEl) tagEl.remove();

        /* Accordion container */
        var acc = document.createElement('div');
        acc.className = 'nx-acc';
        acc.style.cssText = [
          'background:rgba(255,255,255,.05);',
          'border:1px solid rgba(255,255,255,.15);',
          'border-radius:8px;overflow:hidden;',
          'transition:border-color .2s,background .2s;'
        ].join('');

        /* Header button */
        var btn = document.createElement('button');
        btn.className = 'nx-acc-btn';
        btn.style.cssText = [
          'width:100%;display:flex;align-items:center;gap:10px;',
          'padding:11px 16px;background:none;border:none;',
          'cursor:pointer;text-align:left;',
          'transition:background .15s;'
        ].join('');

        /* v19: preview snippet — avance organizador (Ausubel):
           Extraer primeras ~110 chars de texto del body para mostrar bajo el título.
           El cerebro "prima" el tema antes de abrir → mejor retención.
           Se excluyen bloques Bibliografía/Fuente para no contaminar el preview. */
        var _previewText = (function() {
          var skip = /^(📖|fuente|bibliograf|importante|criterio)/i;
          if (skip.test(title)) return '';
          /* Clonar el item para extraer texto sin mutar el DOM */
          var tmp = item.cloneNode(true);
          /* Quitar sub-tags anidados y scripts */
          tmp.querySelectorAll('.sub-tag, script, style').forEach(function(el) { el.remove(); });
          var txt = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
          return txt.length > 115 ? txt.substring(0, 112) + '…' : txt;
        })();

        /* Title always white, accent dot uses materia color */
        btn.innerHTML =
          '<span style="width:8px;height:8px;border-radius:50%;background:' + accentColor + ';flex-shrink:0;opacity:1;margin-top:2px"></span>' +
          '<span style="flex:1;min-width:0">' +
            '<span style="display:block;font-family:\'DM Sans\',\'Inter\',sans-serif;font-size:.84rem;font-weight:700;color:#ffffff;line-height:1.3">' + _esc(title) + '</span>' +
            (_previewText ? '<span style="display:block;font-size:.75rem;color:rgba(255,255,255,.42);line-height:1.4;margin-top:2px;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(_previewText) + '</span>' : '') +
          '</span>' +
          '<span class="nx-acc-arrow" style="font-size:1rem;color:rgba(255,255,255,.5);transition:transform .22s;flex-shrink:0">›</span>';

        /* Body */
        var body = document.createElement('div');
        body.className = 'nx-acc-body';
        body.style.cssText = [
          'display:none;',
          'padding:6px 18px 18px 34px;',
          'border-top:1px solid rgba(255,255,255,.12);',
          'font-size:.9rem;line-height:1.85;color:#ffffff;'
        ].join('');

        /* Apply white color to all children after move */
        while (item.firstChild) {
          body.appendChild(item.firstChild);
        }

        /* v19.3.7: Force white on all text nodes — setProperty('important') vence
           .mc-doc * { color: inherit !important } del CSS cacheado */
        var applyWhite = function(el) {
          if (!el || !el.querySelectorAll) return;
          var nodes = el.querySelectorAll('p,li,span,em,blockquote,h3,h4,h5,h6');
          for (var i=0; i<nodes.length; i++) {
            nodes[i].style.setProperty('color', '#ffffff', 'important');
          }
          var strongs = el.querySelectorAll('strong');
          for (var j=0; j<strongs.length; j++) {
            strongs[j].style.setProperty('color', '#ffffff', 'important');
            strongs[j].style.fontWeight = '700';
          }
          /* Tables */
          var ths = el.querySelectorAll('th');
          for (var k=0; k<ths.length; k++) {
            ths[k].style.background = 'rgba(255,255,255,.12)';
            ths[k].style.setProperty('color', '#ffffff', 'important');
            ths[k].style.fontWeight = '700';
          }
          var tds = el.querySelectorAll('td');
          for (var l=0; l<tds.length; l++) {
            tds[l].style.setProperty('color', '#ffffff', 'important');
            tds[l].style.borderColor = 'rgba(255,255,255,.12)';
          }
        };
        body.style.setProperty('color', '#ffffff', 'important');
        applyWhite(body);

        /* Toggle */
        btn.addEventListener('click', function() {
          var isOpen = acc.dataset.open === '1';
          if (isOpen) {
            body.style.display = 'none';
            acc.dataset.open = '0';
            acc.style.background = 'rgba(255,255,255,.05)';
            acc.style.borderColor = 'rgba(255,255,255,.15)';
            btn.querySelector('.nx-acc-arrow').style.transform = '';
          } else {
            body.style.display = 'block';
            acc.dataset.open = '1';
            acc.style.background = 'rgba(255,255,255,.08)';
            acc.style.borderColor = accentColor;
            btn.querySelector('.nx-acc-arrow').style.transform = 'rotate(90deg)';
          }
        });

        btn.addEventListener('mouseenter', function() { btn.style.background = 'rgba(255,255,255,.06)'; });
        btn.addEventListener('mouseleave', function() { btn.style.background = 'none'; });

        /* First item open */
        if (idx === 0) {
          body.style.display = 'block';
          acc.dataset.open = '1';
          acc.style.background = 'rgba(255,255,255,.08)';
          acc.style.borderColor = accentColor;
          setTimeout(function() {
            var arr = btn.querySelector('.nx-acc-arrow');
            if (arr) arr.style.transform = 'rotate(90deg)';
          }, 0);
        }

        acc.appendChild(btn);
        acc.appendChild(body);
        wrapper.appendChild(acc);
      });

      grid.parentNode.replaceChild(wrapper, grid);
    });
  }

  /* ── v19.3: Guided block renderer ─────────────────────────────────────
     Renderiza un sub-grid con data-block-mode="guided" como tarjetas siempre
     visibles con énfasis visual verde.
     Invariantes:
       - applyWhite NO se llama (paleta propia garantiza legibilidad)
       - .sub-tag original se oculta con display:none, NO se remueve
         → _buildUnitTOCs puede encontrarlo por clase y asignarle anchor
       - Hover vía CSS class, no event listeners JS
       - Colores via variables CSS cuando existen                        */
  function _renderGuidedGroup(grid, items, accentColor) {
    /* ── v19.3.1 — Paleta derivada de NEXUS_COLORS vía CSS custom properties ──
       Inline styles usan var(--fce-*) → responden a nexusSetActiveTokens()
       G_BODY queda como literal (usado en setProperty('color', val, 'important')) */
    var G_TEXT   = 'var(--fce-strong,    #79c0ff)'; /* título uppercase      */
    var G_BG     = 'var(--fce-soft-bg,   rgba(88,166,255,0.08))'; /* superficie  */
    var G_BORDER = 'var(--fce-soft-border,rgba(88,166,255,0.25))'; /* borde       */
    var G_LEFT   = 'var(--fce-strong,    #79c0ff)'; /* acento borde izq      */
    var G_SEP    = 'var(--fce-soft-border,rgba(88,166,255,0.20))'; /* separador   */
    var G_BODY   = '#e6edf3';                        /* texto (literal: setProperty) */

    var wrapper = document.createElement('div');
    wrapper.className = 'nx-guided-group';
    wrapper.style.cssText = [
      'display:flex;flex-direction:column;gap:10px;',
      'margin-bottom:1.5rem;'
    ].join('');

    Array.from(items).forEach(function(item) {
      /* ── 1. Sub-tag: ocultar visualmente, asignar id para TOC ── */
      var tagEl = item.querySelector(':scope > .sub-tag, :scope > h3.sub-tag, :scope > div.sub-tag');
      var title = tagEl ? tagEl.textContent.trim() : '';

      if (tagEl) {
        if (!tagEl.id) {
          /* id único para ancla del TOC */
          tagEl.id = 'gd-' + title.toLowerCase()
            .replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27FF]/gu, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            .substring(0, 38) || ('gd-' + Math.random().toString(36).slice(2, 7));
        }
        tagEl.style.display = 'none'; /* ocultar, no remover */
      }

      /* ── 2. Card container ── */
      var card = document.createElement('div');
      card.className = 'nx-guided-card';
      /* Hover via CSS: la clase nx-guided-card tiene reglas en nexus-ui-system.css
         Si el CSS no está disponible aún, el estilo inline base ya es funcional */
      card.style.cssText = [
        'background:' + G_BG + ';',
        'border:1px solid ' + G_BORDER + ';',
        'border-left:4px solid ' + G_LEFT + ';',
        'border-radius:12px;',
        'padding:14px 18px 16px;',
        'transition:box-shadow .18s ease, border-left-color .18s ease;',
        'position:relative;'
      ].join('');

      /* ── 3. Header: icono + título uppercase ── */
      var icon  = _guidedIcon(title);
      /* Extraer texto limpio del título (sin emoji inicial) */
      var label = title.replace(/^[\u{1F000}-\u{1FFFF}\u2600-\u27FF\s]+/gu, '').trim() || title;

      var header = document.createElement('div');
      header.style.cssText = [
        'display:flex;align-items:center;gap:8px;',
        'margin-bottom:9px;padding-bottom:8px;',
        'border-bottom:1px solid ' + G_SEP + ';'
      ].join('');
      header.innerHTML =
        '<span style="font-size:.95rem;line-height:1;flex-shrink:0">' + icon + '</span>' +
        '<span style="font-family:\'DM Sans\',\'Inter\',sans-serif;' +
              'font-size:.78rem;font-weight:700;letter-spacing:.06em;' +
              'text-transform:uppercase;color:' + G_TEXT + ';line-height:1.2">' +
          _esc(label) +
        '</span>';

      /* ── 4. Body: clonar children del sub-item excepto el sub-tag ──
         Se clona para no mutar el item original (safe para lazy re-renders) */
      var body = document.createElement('div');
      body.style.cssText = [
        'font-size:.875rem;line-height:1.82;',
        'color:' + G_BODY + ';'
      ].join('');

      Array.from(item.childNodes).forEach(function(node) {
        if (node === tagEl) return; /* no duplicar el sub-tag (ya oculto) */
        body.appendChild(node.cloneNode(true));
      });

      /* v19.3.7: setProperty !important para vencer .mc-doc * {inherit!important} del CSS cacheado */
      body.style.setProperty('color', G_BODY, 'important');
      (function applyGuidedColor(el) {
        var ns = el.querySelectorAll('p,li,span,em,blockquote,h3,h4,h5,h6');
        for (var gi=0; gi<ns.length; gi++) ns[gi].style.setProperty('color', G_BODY, 'important');
        var ss = el.querySelectorAll('strong');
        for (var gj=0; gj<ss.length; gj++) {
          ss[gj].style.setProperty('color', G_BODY, 'important');
          ss[gj].style.fontWeight = '700';
        }
      })(body);

      card.appendChild(header);
      card.appendChild(body);
      wrapper.appendChild(card);
    });

    grid.parentNode.replaceChild(wrapper, grid);
  }

  /* ── Icono semántico para guided blocks ───────────────────────────────
     Mapea el texto del sub-tag a un emoji representativo.
     Si el título ya inicia con emoji, lo extrae y lo reutiliza.          */
  function _guidedIcon(title) {
    /* Si el título ya empieza con emoji → usarlo directamente */
    var hasEmoji = title.match(/^([\u{1F000}-\u{1FFFF}]|[\u2600-\u27FF])/u);
    if (hasEmoji) return hasEmoji[0];

    var t = title.toLowerCase();
    if (/idea|concept|definici/i.test(t))              return '💡';
    if (/piensa|reflex|pregunta|por qu[eé]/i.test(t))  return '🧠';
    if (/punto.clave|importante|clave|regla|cr[ií]tic/i.test(t)) return '✅';
    if (/recuerda|nota[^s]|atenci/i.test(t))           return '📌';
    if (/ejemplo|caso|pr[aá]ctic/i.test(t))            return '🔍';
    if (/dato|estad[ií]stic|cifra/i.test(t))           return '📊';
    if (/cierre|conclusi|resumen/i.test(t))            return '🎯';
    if (/conex|relaci|v[ií]nculo/i.test(t))            return '🔗';
    if (/avance|tecnol|innovaci/i.test(t))             return '⚙️';
    if (/consecuencia|impacto|efecto/i.test(t))        return '📉';
    if (/acá.*confund|error|trampa|cuidado/i.test(t))  return '⚠️';
    return '▸';
  }

  /* ═══════════════════════════════════════════════════════════════════
     NEXUS v19.3.4 — AUTO BLOCK MODE INFERENCE
     ═══════════════════════════════════════════════════════════════════
     Función pura: recibe NodeList de .sub-item, devuelve 'guided' o
     'structured'. No tiene side effects. No toca el DOM.

     Heurísticas en orden de precedencia:
       1. Pocos items (≤3)  → contenido simple → guided
       2. Texto total corto (<600 chars) → guided
       3. ≥2 títulos semánticos → guided
       4. Default → structured (accordion)

     El fallback a 'structured' está en el catch — si algo explota,
     el sistema sigue funcionando con accordions normales.
     ═══════════════════════════════════════════════════════════════════ */
  function _inferBlockMode(items) {
    try {
      if (!items || !items.length) return 'structured';

      /* Heurística 1: pocos items → contenido tipo tarjeta → guided */
      if (items.length <= 3) return 'guided';

      /* Heurística 2: texto total corto → no amerita accordion → guided */
      var totalText = 0;
      items.forEach(function(item) {
        totalText += (item.innerText || '').length;
      });
      if (totalText < 600) return 'guided';

      /* Heurística 3: títulos semánticos dominantes → guided */
      var semanticHits = 0;
      items.forEach(function(item) {
        var tag = item.querySelector('.sub-tag, h3.sub-tag');
        var t   = tag ? tag.textContent.toLowerCase() : '';
        if (/idea|clave|importante|recuerda|concepto|definici/i.test(t)) {
          semanticHits++;
        }
      });
      if (semanticHits >= 2) return 'guided';

      /* Default: contenido denso o largo → accordion */
      return 'structured';

    } catch (e) {
      console.warn('[NEXUS] _inferBlockMode fallback a structured:', e);
      return 'structured';
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     NEXUS v18 — SISTEMA DE TRABAJOS PRÁCTICOS
     ═══════════════════════════════════════════════════════════════════
     _injectTPResponses: inyecta área de respuestas debajo del contenido
     del TP. Una textarea por cada sub-item (consigna).
     Guarda en Firestore: tp_respuestas/{userId}/{tpId}/{consignaIndex}
     ═════════════════════════════════════════════════════════════════ */
  function _injectTPResponses(ph, item, color) {
    var tpId    = item.id || '';
    var materia = item.materia || '';
    var accentColor = color || NEXUS_COLORS.materias.home.base;

    /* Obtener consignas del well ya inyectado */
    var well = ph.querySelector('.mc-well');
    if (!well) return;

    /* Solo sub-items que son consignas respondibles
       Excluir: Bibliografía (📚), Criterios (📋), Importante (⚠️) */
    var allItems = well.querySelectorAll('.sub-item, .nx-acc');
    var subItems = Array.prototype.filter.call(allItems, function(si) {
      var tagEl = si.querySelector('.sub-tag, .nx-acc-btn');
      if (!tagEl) return true;
      var title = (tagEl.textContent || '').trim();
      /* Excluir bloques informativos */
      if (/^(📚|📋|⚠️|Bibliograf|Criterios|Importante)/i.test(title)) return false;
      return true;
    });
    if (!subItems.length) return;

    /* Contenedor principal */
    var wrap = document.createElement('div');
    wrap.className = 'nx-tp-wrap';
    wrap.style.cssText = 'margin-top:1.25rem;border-top:1px solid rgba(240,246,252,.08);padding-top:1.25rem;';

    /* Header del área de respuestas */
    var header = document.createElement('div');
    header.className = 'nx-tp-header';
    header.innerHTML =
      '<span class="nx-tp-header-icon">✏️</span>' +
      '<span class="nx-tp-header-label">Tus respuestas</span>' +
      '<span class="nx-tp-header-status" id="nx-tp-status-' + esc(tpId) + '">Cargando...</span>';
    wrap.appendChild(header);

    /* Una consigna por sub-item */
    subItems.forEach(function(si, idx) {
      /* Obtener título de la consigna */
      var tagEl = si.querySelector('.sub-tag, .nx-acc-btn, h3');
      var consignaLabel = tagEl ? (tagEl.textContent || '').trim() : ('Consigna ' + (idx + 1));
      if (consignaLabel.length > 80) consignaLabel = consignaLabel.substring(0, 80) + '…';

      var consignaId = tpId + '_c' + idx;

      var block = document.createElement('div');
      block.className = 'nx-tp-consigna';
      block.dataset.consignaId = consignaId;

      block.innerHTML =
        '<div class="nx-tp-consigna-label">' +
          '<span class="nx-tp-num">' + (idx + 1) + '</span>' +
          '<span class="nx-tp-ctitle">' + esc(consignaLabel) + '</span>' +
        '</div>' +
        '<textarea class="nx-tp-textarea" ' +
          'id="nx-tp-ta-' + esc(consignaId) + '" ' +
          'placeholder="Escribí tu respuesta acá..." ' +
          'rows="4" ' +
          'data-consigna-id="' + esc(consignaId) + '" ' +
          'data-tp-id="' + esc(tpId) + '" ' +
          'data-idx="' + idx + '">' +
        '</textarea>' +
        '<div class="nx-tp-consigna-footer">' +
          '<span class="nx-tp-saved-label" id="nx-tp-saved-' + esc(consignaId) + '"></span>' +
          '<button class="nx-tp-save-btn" ' +
            'onclick="nexusTPSave(\'' + esc(tpId) + '\',' + idx + ',\'' + esc(materia) + '\')" ' +
            'style="--tp-color:' + accentColor + '">' +
            'Guardar' +
          '</button>' +
        '</div>';

      wrap.appendChild(block);
    });

    /* Botón exportar PDF */
    var tpFooter = document.createElement('div');
    tpFooter.className = 'nx-tp-export-bar';
    tpFooter.style.cssText = 'margin-top:1.25rem;padding-top:.9rem;border-top:1px solid rgba(240,246,252,.08);display:flex;justify-content:flex-end;gap:.6rem;align-items:center;';
    tpFooter.innerHTML =
      '<span style="font-size:.78rem;color:#6e7681">Guardá tus respuestas antes de exportar</span>' +
      '<button class="nx-tp-export-btn" ' +
        'onclick="nexusTPExportPDF(\'' + esc(tpId) + '\',\'' + esc(item.agrupador || tpId) + '\',\'' + esc(materia) + '\')" ' +
        'style="--tp-color:' + accentColor + ';background:var(--fce-soft-bg,rgba(88,166,255,.12));color:var(--fce-base,#58a6ff);border:1px solid var(--fce-soft-border,rgba(88,166,255,.35));border-radius:6px;padding:.4rem .9rem;font-size:.82rem;cursor:pointer;display:flex;align-items:center;gap:.35rem;">' +
        '📄 Exportar PDF' +
      '</button>';
    wrap.appendChild(tpFooter);

    ph.appendChild(wrap);

    /* Cargar respuestas guardadas desde Firestore */
    _loadTPResponses(tpId, subItems.length);
  }

  /* ═══════════════════════════════════════════════════════════════════
     NEXUS v19 — SISTEMA TP INLINE (estilo fotocopia)
     Los inputs viven dentro del HTML del ejercicio mismo.
     Cada input tiene data-tp-fld="nombreCampo".
     Guarda en: tp_respuestas/{userId}/tps/{tpId} — campos planos.
     Activado cuando el cuerpo contiene data-tp-inline="1".
     ═════════════════════════════════════════════════════════════════ */

  /* Inyectar CSS de campos inline una sola vez */
  (function _injectInlineTPCSS() {
    if (document.getElementById('nx-inline-tp-css')) return;
    var s = document.createElement('style');
    s.id = 'nx-inline-tp-css';
    s.textContent = [
      /* Inputs de una celda — colores vía design tokens (v19.3.1) */
      '.nxi{border:none;border-bottom:2px solid var(--fce-soft-border,rgba(88,166,255,.45));background:transparent;',
      'color:#e6edf3;padding:2px 5px;font-size:.84rem;outline:none;font-family:inherit;',
      'transition:border-color .18s ease,background .18s ease;}',
      '.nxi:focus{border-bottom-color:var(--fce-base,#58a6ff);background:var(--fce-soft-bg,rgba(88,166,255,.07));border-radius:3px 3px 0 0;}',
      /* Tamaños estándar */
      '.nxi-xs{width:38px;text-align:center;}',
      '.nxi-s{width:56px;text-align:center;}',
      '.nxi-m{width:120px;}',
      '.nxi-l{width:180px;}',
      '.nxi-xl{width:100%;}',
      /* Textareas de respuesta abierta */
      '.nxi-area{width:100%;border:1px solid var(--fce-soft-border,rgba(88,166,255,.25));border-radius:6px;',
      'background:rgba(0,0,0,.18);color:#e6edf3;padding:.55rem .75rem;font-size:.87rem;',
      'font-family:inherit;resize:vertical;min-height:72px;outline:none;box-sizing:border-box;',
      'transition:border-color .18s ease,background .18s ease;}',
      '.nxi-area:focus{border-color:var(--fce-base,#58a6ff);background:var(--fce-soft-bg,rgba(88,166,255,.06));}',
      /* Indicador de guardado */
      '.nxi-saved{font-size:.72rem;color:var(--color-ok,#3fb950);opacity:0;transition:opacity .4s;pointer-events:none;}',
      '.nxi-saved.show{opacity:1;}',
      /* Barra inferior */
      '.nx-tp-ibar{margin-top:1.2rem;padding:.7rem 1rem;border-radius:8px;',
      'background:var(--fce-soft-bg,rgba(88,166,255,.06));border:1px solid var(--fce-soft-border,rgba(88,166,255,.14));',
      'display:flex;justify-content:space-between;align-items:center;gap:.8rem;}',
      '.nx-tp-ibar-status{font-size:.8rem;color:#8b949e;}',
      '.nx-tp-ibar-btn{background:var(--fce-soft-bg,rgba(88,166,255,.12));color:var(--fce-base,#58a6ff);',
      'border:1px solid var(--fce-soft-border,rgba(88,166,255,.35));border-radius:6px;padding:.38rem .85rem;',
      'font-size:.82rem;cursor:pointer;display:flex;align-items:center;gap:.35rem;',
      'transition:background .18s ease,border-color .18s ease;}',
      '.nx-tp-ibar-btn:hover{background:var(--fce-soft-bg,rgba(88,166,255,.22));}'
    ].join('');
    document.head.appendChild(s);
  })();

  function _mountInlineTP(ph, item, color) {
    var tpId = item.id || '';
    var materia = item.materia || '';
    var accentColor = color || NEXUS_COLORS.materias.home.base;
    var well = ph.querySelector('.mc-well');
    if (!well) return;
    if (ph.querySelector('.nx-tp-ibar')) return; /* guard doble-mount */

    var fields = well.querySelectorAll('[data-tp-fld]');
    if (!fields.length) return;

    /* Adjuntar save-on-blur a cada campo */
    var debounceMap = {};
    fields.forEach(function(fld) {
      var fieldId = fld.dataset.tpFld;
      fld.addEventListener('blur', function() {
        _saveInlineField(tpId, fieldId, fld.value, materia, fld);
      });
      if (fld.tagName === 'TEXTAREA') {
        fld.addEventListener('input', function() {
          clearTimeout(debounceMap[fieldId]);
          debounceMap[fieldId] = setTimeout(function() {
            _saveInlineField(tpId, fieldId, fld.value, materia, fld);
          }, 1800);
        });
      }
    });

    /* Barra inferior: estado + exportar */
    var bar = document.createElement('div');
    bar.className = 'nx-tp-ibar';
    bar.innerHTML =
      '<span class="nx-tp-ibar-status" id="nxi-st-' + tpId + '">Cargando respuestas...</span>' +
      '<button class="nx-tp-ibar-btn" ' +
        'onclick="nexusTPExportInline(\'' + esc(tpId) + '\',\'' + esc(item.agrupador || tpId) + '\',\'' + esc(materia) + '\')">' +
        '📄 Exportar PDF' +
      '</button>';
    ph.appendChild(bar);

    /* Cargar valores guardados */
    _loadInlineFields(tpId, fields);
  }

  function _setInlineStatus(tpId, msg, color) {
    var el = document.getElementById('nxi-st-' + tpId);
    if (el) { el.textContent = msg; el.style.color = color || '#8b949e'; }
  }

  function _loadInlineFields(tpId, fields) {
    var user = (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser);
    if (!user) {
      _setInlineStatus(tpId, 'Iniciá sesión para guardar respuestas', '#6e7681');
      return;
    }
    var db = firebase.firestore();
    db.collection('tp_respuestas').doc(user.uid)
      .collection('tps').doc(tpId)
      .get().then(function(doc) {
        if (!doc.exists) { _setInlineStatus(tpId, 'Sin respuestas guardadas — completá el TP y se guardará automáticamente', '#6e7681'); return; }
        var data = doc.data() || {};
        var filled = 0;
        fields.forEach(function(fld) {
          var v = data[fld.dataset.tpFld];
          if (v !== undefined && v !== null) { fld.value = v; filled++; }
        });
        _setInlineStatus(tpId,
          filled + ' / ' + fields.length + ' campos completados',
          filled === fields.length
            ? 'var(--color-ok,#3fb950)'
            : 'var(--color-warn,#e3b341)'
        );
      }).catch(function() {
        _setInlineStatus(tpId, 'Error al cargar — verificá tu conexión', 'var(--color-err,#f85149)');
      });
  }

  function _saveInlineField(tpId, fieldId, value, materia, fldEl) {
    var user = (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser);
    if (!user) return;
    var db = firebase.firestore();
    var now = new Date().toISOString();
    var upd = { _meta: { tpId: tpId, materia: materia, userId: user.uid, updatedAt: now } };
    upd[fieldId] = (value || '').trim();
    db.collection('tp_respuestas').doc(user.uid)
      .collection('tps').doc(tpId)
      .set(upd, { merge: true })
      .then(function() {
        /* micro-feedback en el campo */
        if (fldEl) {
          fldEl.style.borderColor = 'var(--color-ok,#3fb950)';
          setTimeout(function() { fldEl.style.borderColor = ''; }, 900);
        }
      }).catch(function(err) {
        console.warn('NexusTP inline save err:', err);
      });
  }

  /* ── Exportar TP inline como PDF ──────────────────────────────── */
  window.nexusTPExportInline = function(tpId, tpTitle, materia) {
    var user = (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser);
    var userName = user ? (user.displayName || user.email || 'Alumno/a') : 'Alumno/a';
    /* Buscar el bien que contiene este TP */
    var ph = document.querySelector('[data-item-id="' + tpId + '"]') ||
             document.querySelector('.mc-body-ph[data-item-ref]');
    var rows = [];
    if (ph) {
      var fields = ph.querySelectorAll('[data-tp-fld]');
      fields.forEach(function(fld) {
        var label = fld.dataset.tpLabel || fld.dataset.tpFld || '';
        var val   = (fld.value || '').trim();
        if (val) rows.push({ label: label, value: val });
      });
    }
    var dateStr = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
    var bodyHtml = rows.length
      ? rows.map(function(r) {
          return '<tr><td style="padding:.45rem .7rem;border:1px solid #ddd;font-size:.85rem;color:#555;width:35%"><strong>' +
            r.label + '</strong></td>' +
            '<td style="padding:.45rem .7rem;border:1px solid #ddd;font-size:.85rem">' + r.value + '</td></tr>';
        }).join('')
      : '<tr><td colspan="2" style="padding:1rem;text-align:center;color:#888">Sin respuestas completadas</td></tr>';
    var html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
      '<title>TP — ' + tpTitle + '</title>' +
      '<style>body{font-family:Arial,sans-serif;max-width:860px;margin:2rem auto;color:#222;}' +
      'h1{font-size:1.25rem;margin-bottom:.2rem;}' +
      '.meta{font-size:.85rem;color:#555;margin-bottom:1.5rem;}' +
      'table{width:100%;border-collapse:collapse;}</style></head><body>' +
      '<h1>Trabajo Práctico — ' + tpTitle + '</h1>' +
      '<div class="meta">Alumno/a: <strong>' + userName + '</strong> &nbsp;|&nbsp; Materia: ' + materia + ' &nbsp;|&nbsp; Fecha: ' + dateStr + '</div>' +
      '<table>' + bodyHtml + '</table>' +
      '</body></html>';
    var win = window.open('', '_blank', 'width=940,height=720');
    if (!win) { alert('Permitir popups para exportar'); return; }
    win.document.write(html);
    win.document.close();
    win.addEventListener('load', function() { setTimeout(function() { win.print(); }, 300); });
  };

  /* ── Cargar respuestas del alumno desde Firestore ────────────────── */
  function _loadTPResponses(tpId, count) {
    var user = (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser);
    if (!user) {
      _setTPStatus(tpId, 'Iniciá sesión para guardar respuestas', '#6e7681');
      return;
    }

    var db = firebase.firestore();
    var tpRef = db.collection('tp_respuestas').doc(user.uid)
                  .collection('tps').doc(tpId);

    tpRef.get().then(function(doc) {
      if (!doc.exists) {
        _setTPStatus(tpId, 'Sin respuestas guardadas', '#6e7681');
        return;
      }
      var data = doc.data() || {};
      var savedCount = 0;

      for (var i = 0; i < count; i++) {
        var consignaId = tpId + '_c' + i;
        if (data['c' + i]) {
          var ta = document.getElementById('nx-tp-ta-' + consignaId);
          if (ta) ta.value = data['c' + i].texto || '';
          _setConsignaSaved(consignaId, data['c' + i].timestamp);
          savedCount++;
        }
      }

      _setTPStatus(tpId,
        savedCount + '/' + count + ' respuestas guardadas',
        savedCount === count ? '#3fb950' : '#e3b341'
      );
    }).catch(function(err) {
      console.warn('NexusTP load error:', err);
      _setTPStatus(tpId, 'Error al cargar', '#f85149');
    });
  }

  /* ── Guardar una respuesta ───────────────────────────────────────── */
  window.nexusTPSave = function(tpId, idx, materia) {
    var consignaId = tpId + '_c' + idx;
    var ta = document.getElementById('nx-tp-ta-' + consignaId);
    if (!ta) return;

    var texto = (ta.value || '').trim();
    if (!texto) {
      _setConsignaStatus(consignaId, '⚠️ Escribí algo primero', '#e3b341');
      return;
    }

    var user = (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser);
    if (!user) {
      _setConsignaStatus(consignaId, '⚠️ Iniciá sesión', '#e3b341');
      return;
    }

    /* Visual feedback inmediato */
    _setConsignaStatus(consignaId, 'Guardando...', '#8b949e');

    var db  = firebase.firestore();
    var now = new Date().toISOString();
    var updateData = {};
    updateData['c' + idx] = { texto: texto, timestamp: now };
    updateData['_meta'] = { tpId: tpId, materia: materia, userId: user.uid, updatedAt: now };

    db.collection('tp_respuestas').doc(user.uid)
      .collection('tps').doc(tpId)
      .set(updateData, { merge: true })
      .then(function() {
        _setConsignaSaved(consignaId, now);
        /* Recargar estado general */
        var wrap = ta.closest('.nx-tp-wrap');
        if (wrap) {
          var allTA = wrap.querySelectorAll('.nx-tp-textarea');
          var savedCount = 0;
          allTA.forEach(function(t) { if ((t.value||'').trim()) savedCount++; });
          _setTPStatus(tpId, savedCount + '/' + allTA.length + ' respuestas guardadas',
            savedCount === allTA.length ? '#3fb950' : '#e3b341');
        }
      })
      .catch(function(err) {
        console.error('NexusTP save error:', err);
        _setConsignaStatus(consignaId, '✗ Error al guardar', '#f85149');
      });
  };

  /* ── Helpers de estado visual ────────────────────────────────────── */
  function _setTPStatus(tpId, msg, color) {
    var el = document.getElementById('nx-tp-status-' + tpId);
    if (!el) return;
    el.textContent = msg;
    el.style.color = color || '#8b949e';
  }

  function _setConsignaSaved(consignaId, timestamp) {
    var label = document.getElementById('nx-tp-saved-' + consignaId);
    if (!label) return;
    var dt = timestamp ? new Date(timestamp).toLocaleString('es-AR', {
      day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'
    }) : '';
    label.innerHTML = '<span style="color:#3fb950">✓ Guardado ' + (dt ? dt : '') + '</span>';
  }

  function _setConsignaStatus(consignaId, msg, color) {
    var label = document.getElementById('nx-tp-saved-' + consignaId);
    if (!label) return;
    label.innerHTML = '<span style="color:' + (color||'#8b949e') + '">' + esc(msg) + '</span>';
  }

  /* ── Exportar TP completo como PDF ──────────────────────────────── */
  window.nexusTPExportPDF = function(tpId, tpTitle, materia) {
    var user = (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser);
    var userName = user ? (user.displayName || user.email || 'Alumno/a') : 'Alumno/a';

    /* Recolectar respuestas y etiquetas desde el DOM */
    var answers = [];
    var idx = 0;
    while (true) {
      var consignaId = tpId + '_c' + idx;
      var ta  = document.getElementById('nx-tp-ta-' + consignaId);
      var lbl = document.querySelector('[data-consigna-id="' + consignaId + '"] .nx-tp-ctitle');
      if (!ta) break;
      answers.push({
        num:   idx + 1,
        label: lbl ? (lbl.textContent || '') : ('Consigna ' + (idx + 1)),
        texto: (ta.value || '').trim()
      });
      idx++;
    }

    if (!answers.length) {
      alert('No hay consignas para exportar en este TP.');
      return;
    }

    var now     = new Date();
    var dateStr = now.toLocaleDateString('es-AR', { year:'numeric', month:'long', day:'numeric' });
    var esc2    = function(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };

    var rows = answers.map(function(a) {
      return '<div class="consigna">' +
        '<div class="consigna-title">' + esc2(a.num + '. ' + a.label) + '</div>' +
        '<div class="respuesta' + (a.texto ? '' : ' empty') + '">' +
          (a.texto ? esc2(a.texto).replace(/\n/g,'<br>') : 'Sin respuesta') +
        '</div>' +
      '</div>';
    }).join('');

    var html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
      '<title>' + esc2(tpTitle || tpId) + ' — ' + esc2(materia) + '</title>' +
      '<style>' +
        'body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;margin:2.2cm 2cm;color:#1a1a1a;line-height:1.55}' +
        'h1{font-size:17pt;color:#003366;border-bottom:2.5px solid #003366;padding-bottom:.35rem;margin-bottom:.4rem}' +
        '.meta{font-size:9.5pt;color:#555;margin-bottom:1.6rem;padding-bottom:.6rem;border-bottom:1px solid #ddd}' +
        '.consigna{margin-bottom:1.4rem;page-break-inside:avoid}' +
        '.consigna-title{font-weight:bold;color:#003366;font-size:10.5pt;margin-bottom:.35rem}' +
        '.respuesta{border:1px solid #b0b8c4;border-radius:4px;padding:.55rem .75rem;min-height:2.8rem;background:#f7f9fc;font-size:10pt;white-space:pre-wrap;word-break:break-word}' +
        '.empty{color:#aaa;font-style:italic;background:#fafafa}' +
        '.footer{margin-top:2rem;font-size:8.5pt;color:#aaa;border-top:1px solid #e0e0e0;padding-top:.5rem;text-align:center}' +
        '@media print{@page{margin:2cm}body{margin:0}.consigna{page-break-inside:avoid}}' +
      '</style></head><body>' +
      '<h1>📋 ' + esc2(tpTitle || tpId) + '</h1>' +
      '<div class="meta">' +
        '<strong>Materia:</strong> Introducción a la ' + esc2(materia) + ' &nbsp;·&nbsp; ' +
        '<strong>Alumno/a:</strong> ' + esc2(userName) + ' &nbsp;·&nbsp; ' +
        '<strong>Fecha de exportación:</strong> ' + esc2(dateStr) +
      '</div>' +
      rows +
      '<div class="footer">Portal FCE UNPSJB · Ciclo Inicial 2026 · Generado automáticamente desde el portal de estudio</div>' +
      '</body></html>';

    var win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      alert('Habilitá las ventanas emergentes para exportar el PDF.\n\nEn Chrome: hacé clic en el ícono de bloqueo en la barra de dirección → "Ventanas emergentes".');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.addEventListener('load', function() {
      setTimeout(function() { win.print(); }, 300);
    });
  };

  function _injectAllBodies(host, items, color) {
    if (!items || !items.length) return;
    items.forEach(function (item) {
      if (!item || !item.id) return;
      var ph = host.querySelector('[data-item-id="' + item.id + '"]');
      if (!ph) return;
      ph.dataset.itemRef = JSON.stringify(item);
      ph.dataset.color   = color;
      _injectBody(ph);
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     CONTENT TYPE SYSTEM  ·  Nexus v13.0 — Fase 13 Hotfix
     ════════════════════════════════════════════════════════════════════════
     Clasificación previa obligatoria antes de cualquier render.

     TIPOS:
       TEORIA    → Resumen con cuerpoTipo='html' + estructura h3→h4→p
                   render secuencial — preservar orden de secciones
       PRACTICO  → Práctico — bloque indivisible (sub-grid completo)
                   NO fragmentar, NO mezclar con otros tipos
       FLASHCARD → unidad='GLOSARIO' o Quiz — dataset independiente
                   NO mezclar con teoría
       UNIDAD    → contenedor _buildPage — no mezclar entre materias

     REGLAS:
       ❌ TEORIA  + FLASHCARD juntos
       ❌ PRACTICO fragmentado (sub-grid partido)
       ❌ unidades cruzadas (items de otra materia en el render)
       ✅ orden DOM original siempre respetado
       ✅ cada tipo tiene su pipeline propio
     ════════════════════════════════════════════════════════════════════════ */

  var CONTENT_TYPES = {
    TEORIA:    'teoria',    /* .tv-panel equiv — Resumen html, render h3→h4→p */
    PRACTICO:  'practico',  /* .acc equiv — bloque indivisible               */
    FLASHCARD: 'flashcard', /* GLOSARIO / Quiz — dataset independiente        */
    UNIDAD:    'unidad'     /* .page equiv — contenedor _buildPage            */
  };

  /* detectarTipo(item) — clasificar un item de materiales.json
     Retorna una constante de CONTENT_TYPES.
     NO usa sort, NO reconstruye arrays. O(1). */
  function detectarTipo(item) {
    if (!item) return null;
    if (item.tipo === 'Quiz' || item.tipo === 'TEST' || item.unidad === 'TEST') {
      return CONTENT_TYPES.FLASHCARD;
    }
    if (item.unidad === 'GLOSARIO') {
      return CONTENT_TYPES.FLASHCARD;
    }
    if (item.tipo === 'Práctico') {
      return CONTENT_TYPES.PRACTICO;
    }
    if (item.tipo === 'Resumen' || item.tipo === 'Programa' || item.tipo === 'Cronograma') {
      return CONTENT_TYPES.TEORIA;
    }
    return CONTENT_TYPES.TEORIA;  /* fallback seguro */
  }
  /* Exponer al scope global desde dentro del IIFE donde están definidas */
  window.detectarTipo        = detectarTipo;
  window.CONTENT_TYPES_NEXUS = CONTENT_TYPES;

  /* _assertNoMix(items) — guard de mezcla de tipos
     MEZCLA PROHIBIDA: contenido de DISTINTAS materias en el mismo render.
     Teoría + Flashcard en mismo agrupador es el diseño normal del portal
     (son tarjetas distintas, no se mezclan en el mismo well).
     En dev (__NEXUS_DEV__) advierte si items de distintas materias aparecen juntos. */
  function _assertNoMix(items, agrupador) {
    if (!window.__NEXUS_DEV__) return;
    /* La mezcla real problemática es items de DISTINTAS materias en el mismo build */
    var materias = {};
    items.forEach(function(item) {
      var m = item.materia || '?';
      materias[m] = (materias[m] || 0) + 1;
    });
    if (Object.keys(materias).length > 1) {
      console.warn('[NexusCTS] ❌ MEZCLA DE MATERIAS en agrupador "' + agrupador + '":', materias);
    }
  }

  /* ── Inject one card body ───────────────────────────────────────────── */
  function _injectBody(ph) {
    if (!ph || ph.dataset.ready === '1') return;
    ph.dataset.ready = '1';

    var itemRaw = ph.dataset.itemRef;
    if (!itemRaw) return;

    var item, color;
    try {
      item  = JSON.parse(itemRaw);
      color = ph.dataset.color || '#888';
    } catch (e) {
      ph.innerHTML = '<p class="mc-fallback">Error al cargar contenido.</p>';
      return;
    }

    var tipo = item.tipo || 'Texto';

    /* Content Type System: clasificar ANTES del render */
    var _contentType = detectarTipo(item);
    /* Guardar en el placeholder para acceso posterior */
    if (ph) ph.dataset.contentType = _contentType;

    if (tipo === 'TEST' || tipo === 'QUIZ' || item.tipo === 'Quiz') {
      var qcId = 'q55-' + (item.id || '').replace(/[^a-z0-9]/gi, '-');
      var _mat = item.materia || '';
      var _ag  = item.agrupador || item.unidad || '';
      ph.innerHTML = '<div class="training-section"><div class="training-tabs" id="' + qcId + '-tabs"></div><div id="' + qcId + '" class="training-body"></div></div>';
      setTimeout(function() {
        if (typeof cneEnterQuiz === 'function') cneEnterQuiz(_mat, _ag);
      }, 200);
      /* Build tabs via DOM */
      var tabsEl = document.getElementById(qcId + '-tabs');
      if (tabsEl) {
        [['📝 Quiz', function(){ q55Start(qcId,_mat,_ag); }],
         ['🃏 Flashcards', function(){ if(typeof v53FlashStart==="function") v53FlashStart(qcId,_mat,_ag); }]
        ].forEach(function(pair, ti) {
          var b = document.createElement('button');
          b.className = 't-tab' + (ti===0?' t-tab-active':'');
          b.style.setProperty('--t-color', color);
          b.textContent = pair[0];
          b.addEventListener('click', (function(fn){ return function(){ tabsEl.querySelectorAll('.t-tab').forEach(function(x){x.classList.remove('t-tab-active');}); this.classList.add('t-tab-active'); fn(); }; })(pair[1]));
          tabsEl.appendChild(b);
        });
      }
      setTimeout(function() { q55Start(qcId, _mat, _ag); }, 80);
      return;
    }

    /* GLOSARIO → Flip flashcard (v4.0 Pilar 2) */
    if (item.unidad === 'GLOSARIO') {
      var concepto = item.titulo || 'Concepto';
      var definicion = item.cuerpo || item.descripcion || '';
      var fcId = 'fc-' + item.id;
      var flipDiv = document.createElement('div');
      flipDiv.className = 'v4-flip-card';
      flipDiv.innerHTML =
        '<div class="v4-flip-inner" id="' + fcId + '">' +
          '<div class="v4-flip-front" style="border-color:' + color + '">' +
            '<div class="v4-flip-eyebrow" style="color:' + color + '">CONCEPTO</div>' +
            '<div class="v4-flip-term">' + esc(concepto) + '</div>' +
            '<div class="v4-flip-hint">Tocá para ver la definición →</div>' +
          '</div>' +
          '<div class="v4-flip-back" style="background:' + color + '">' +
            '<div class="v4-flip-eyebrow" style="color:rgba(255,255,255,.6)">DEFINICIÓN</div>' +
            '<div class="v4-flip-def">' + definicion + '</div>' +
          '</div>' +
        '</div>';
      flipDiv.onclick = function() {
        document.getElementById(fcId).classList.toggle('v4-flipped');
      };
      ph.appendChild(flipDiv);
      return;
    }

    /* ── FASE 12.3B: Content Fidelity — bodyOriginal tiene prioridad absoluta ──
       Si el item tiene bodyOriginal (HTML crudo del documento fuente, sanitizado),
       se renderiza DIRECTO sin ninguna transformación.
       Pipeline: bodyOriginal → well → ph. Sin reformateo, sin resumen.
       El campo 'cuerpo' queda como fallback para items sin bodyOriginal. */
    if (item.bodyOriginal) {
      var well = document.createElement('div');
      well.className = 'mc-well mc-well--' + (_contentType || 'teoria') + ' mc-well--fiel';
      well.dataset.contentType  = _contentType || CONTENT_TYPES.TEORIA;
      well.dataset.bodySource   = 'original';   /* auditable en DevTools */
      if (_contentType === CONTENT_TYPES.PRACTICO) {
        well.dataset.indivisible = '1';
      }
      well.style.setProperty('--fce-color', color);
      /* v19.3.0: nexusSanitizeContent — corrige colores light-mode antes de render */
      var _prefix = nexusGetPrefix(item.materia || '');
      well.innerHTML = nexusSanitizeContent(item.bodyOriginal, _prefix);
      ph.appendChild(well);
      return;
    }

    /* HTML cuerpo → pipeline separado por tipo de contenido
       TEORIA   (Resumen) → render secuencial, h3→h4→p preservados
       PRACTICO (Práctico) → bloque indivisible, sub-grid completo, NO fragmentar */
    if (item.cuerpoTipo === 'html' && item.cuerpo) {
      var well = document.createElement('div');
      /* Clase específica por tipo para CSS targeting y auditoría */
      well.className = 'mc-well mc-well--' + (_contentType || 'teoria');
      well.dataset.contentType = _contentType || CONTENT_TYPES.TEORIA;
      well.style.setProperty('--fce-color', color);

      /* PRACTICO: marcar como bloque indivisible — NO fragmentar con CSS ni JS */
      if (_contentType === CONTENT_TYPES.PRACTICO) {
        well.dataset.indivisible = '1';
        well.setAttribute('aria-label', 'Actividad práctica — bloque completo');
      }

      /* v4.0 Pilar 3 & 4: inject Focus Mode button + Mark as Read button */
      var cardEl = ph.closest('.mat-card');
      var cardId = cardEl ? cardEl.id : '';
      var slug = item.id || '';
      /* v9.1 pibe-bridge */
      var _pb='';
      if(item.cuerpo&&item.cuerpo.length>500&&item.tipo==='Resumen'){
        var _bm={"Contabilidad": "Antes de leer, imaginá que llevás la cuenta del almacén de tu barrio: qué tenés, qué debés y qué ganaste.", "Administración": "Pensá en cómo organizás un asado: quién compra, quién cocina, quién cobra — eso es administrar.", "Sociales": "Este texto habla de cómo la sociedad moldea lo que pensamos. Preguntate: ¿por qué creés lo que creés?", "Propedéutica": "Esto es el manual de cómo funciona la facu. Léelo como si fuera el reglamento de un juego que te conviene conocer.", "Itinerario I": "Primero: la empresa tiene cosas (activo) y debe cosas (pasivo). Lo que sobra es tuyo (patrimonio).", "Itinerario II": "Cada operación cambia la ecuación A = P + PN. Tu trabajo es registrar exactamente cómo cambia.", "Itinerario III": "El gasto existe aunque no hayas pagado todavía. Eso es el devengado.", "Unidad I": "Bachelard: hay que romper con lo que \"obviamente\" sabés para aprender ciencia de verdad.", "Unidad II": "Bourdieu: el mundo social es una cancha con jugadores, reglas y capital en juego.", "Unidad III": "Foucault pregunta: ¿quién decide qué es normal y qué no?","Scribano": "📍 Trelew — Locales cerrados, nadie se queja. Scribano: el cuerpo aprendió a aguantar (soportabilidad social). No es resignación — el sistema lo necesita.","Fisher": "📍 Trelew — ¿Sentís que sin app gigante vas a fracasar? Fisher: Realismo Capitalista. Nos convencieron de que no hay alternativa al sistema.","Fraser": "📍 Chubut — Sube la luz y no votaste por eso. Fraser: el mercado faenó la democracia — votamos pero no decidimos el precio de la factura."};
        var _bk=item.agrupador||item.materia||''; var _bt=null;
        if(item.puente_local){_bt=item.puente_local;}else{var _t=(item.titulo||'').split('—')[0].trim();Object.keys(_bm).forEach(function(k){if(_t.indexOf(k)!==-1&&!_bt)_bt=_bm[k];});if(!_bt)Object.keys(_bm).forEach(function(k){if(_bk.indexOf(k)!==-1&&!_bt)_bt=_bm[k];});if(!_bt)_bt=_bm[item.materia]||null;}
        if(_bt)_pb='<div class="pibe-bridge"><span class="pb-icon">🌉</span><span class="pb-text">'+_bt+'</span></div>';
      }
      if (typeof Nexus6 !== 'undefined' && Nexus6.Lazy && item.cuerpo && item.cuerpo.length > Nexus6.Lazy.THRESHOLD) {
        Nexus6.Lazy.wrap(well, item, function() {
          var _cf=(item.cuerpo||'').replace(/(<div[^>]*class=["'][^"']*adm-highlight)/g,'<br>$1');
          well.innerHTML = _pb + _cf;
          /* v18 Lazy-TP fix: inject TP responses AFTER lazy content is in DOM */
          if (item.subtipo === 'tp' && !ph.querySelector('.nx-tp-wrap') && !ph.querySelector('.nx-tp-ibar')) {
            setTimeout(function() {
              if ((item.cuerpo||'').indexOf('data-tp-fld') !== -1) {
                _mountInlineTP(ph, item, color);
              } else {
                _injectTPResponses(ph, item, color);
              }
            }, 50);
          }
        });
      } else {
        var _cuerpoFmt = (item.cuerpo||'')
          .replace(/(<div[^>]*class=["'][^"']*adm-highlight[^"']*["'][^>]*>)/g,'<br>$1')
          .replace(/(<\/div>\s*<div[^>]*class=["'][^"']*adm-highlight)/g,'</div><br><div class="adm-highlight');
        well.innerHTML = _pb + _cuerpoFmt;   /* intentionally raw */
      }
      if (typeof Nexus6 !== 'undefined' && Nexus6.Parser) {
        Nexus6.Parser.process(well, item);
      }
      if (typeof Nexus6 !== 'undefined' && Nexus6.Legacy) {
        Nexus6.Legacy.inject(well, item);
      }
      /* v6.2: Voz del profe — inyectar en CADA renderizado */
      if (typeof Nexus6 !== 'undefined' && Nexus6.inyectarVozDelProfe) {
        Nexus6.inyectarVozDelProfe(well, item);
      }
      if (typeof Nexus6 !== 'undefined' && Nexus6.StickyTOC) {
        var _cardEl = ph ? ph.closest('.mat-card') : null;
        Nexus6.StickyTOC.inject(well, item, _cardEl);
      }
      if (typeof Nexus6 !== 'undefined' && Nexus6.ReadingMode) {
        Nexus6.ReadingMode.inject(well, item);
      }
      /* v6.6: Modo Lectura Profunda — foco activo al click */
      if (typeof nexus66AttachFocusHandlers === 'function') {
        nexus66AttachFocusHandlers(well);
      }
      /* v7.6: Micro-animaciones de urgencia — pulso a los 30s */
      /* v9.0 Ghost Mode: N76Urgency activo (30s → Tip Profe en cualquier Resumen) */
      if (typeof N76Urgency !== 'undefined') {
        setTimeout(function() { N76Urgency.watch(well, item); }, 200);
      }
      if (typeof n68AttachDiffButtons === 'function' && item.tipo === 'Resumen') {
        n68AttachDiffButtons(well, item.id || '');
      }
      /* v7.0: Quiz-In-Situ — autoevaluación al final del material */
      if (typeof NexusEvaluator !== 'undefined' && item.tipo === 'Resumen') {
        setTimeout(function() { NexusEvaluator.inject(well, item); }, 100);
      }
      if (typeof NexusCasos !== 'undefined') {
        setTimeout(function() { NexusCasos.injectLauncher(well, item); }, 150);
      }
      if (typeof N710MentorSilent !== 'undefined') {
        setTimeout(function() { N710MentorSilent.inject(well, item); }, 300);
      }
      if (typeof N83Glossary !== 'undefined') {
        setTimeout(function() { N83Glossary.annotate(well); }, 800);
      }
      /* v8.5 */ if(typeof N85DeepLinks!=='undefined'&&item.tipo==='Resumen') setTimeout(function(){N85DeepLinks.inject(well,item);},700);
      if (typeof N80VozFlotante !== 'undefined') {
        setTimeout(function() { N80VozFlotante.attachToWell(well); }, 400);
      }
      /* v8.4: Fatiga Cognitiva */
      if (typeof N84Fatigue !== 'undefined' && item.tipo === 'Resumen') {
        setTimeout(function() { N84Fatigue.track(cardId, item.materia, item); }, 500);
      }
      /* v8.4: Trampa de Examen */
      if (typeof N84Trampas !== 'undefined' && item.tipo === 'Resumen') {
        setTimeout(function() { N84Trampas.inject(well, item); }, 600);
      }

      /* ── v7.3: Botón Tablón de Dudas ── */
      if (item.tipo === 'Resumen' || item.tipo === 'Práctico') {
        var tablonBtn = document.createElement('button');
        tablonBtn.className = 'n73-tablon-card-btn';
        tablonBtn.textContent = '💬 Dudas';
        tablonBtn.setAttribute('data-mid', slug);
        tablonBtn.setAttribute('data-titulo', (item.titulo || '').substring(0,40));
        tablonBtn.setAttribute('data-mat', item.materia || '');
        tablonBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          n73OpenTablon(
            this.getAttribute('data-mid'),
            this.getAttribute('data-titulo'),
            this.getAttribute('data-mat')
          );
        });
        well.appendChild(tablonBtn);
      }

      /* ── Pilar 4: Marcar como Leído button ── */
      var alreadyRead = NEXUS_STATE.fceLeidos[slug];
      var readBtn = document.createElement('div');
      readBtn.className = 'v4-read-btn' + (alreadyRead ? ' v4-read-done' : '');
      readBtn.id = 'readbtn-' + slug;
      readBtn.innerHTML = alreadyRead
        ? '<span class="v4-read-icon">✓</span> <span class="v4-read-label">Concepto dominado</span>'
        : '<span class="v4-read-icon">○</span> <span class="v4-read-label">Marcar como leído</span>';
      readBtn.setAttribute('data-slug', slug);
      readBtn.setAttribute('data-titulo', item.titulo || '');
      readBtn.setAttribute('data-materia', item.materia || '');
      readBtn.onclick = function(e) {
        e.stopPropagation();
        var s = this.getAttribute('data-slug');
        var t = this.getAttribute('data-titulo');
        var m = this.getAttribute('data-materia');
        if (!NEXUS_STATE.fceLeidos[s]) {
          fceMarcarLeido(s, t, m);
          this.classList.add('v4-read-done');
          this.classList.add('v4-read-anim');
          this.innerHTML = '<span class="v4-read-icon">✓</span> <span class="v4-read-label">¡Concepto dominado!</span>';
          if (cardEl) cardEl.classList.add('fce-leido');
          if (typeof iaShowToast === 'function') iaShowToast('🎯 ¡Concepto dominado! +10 XP', true);
          setTimeout(function(){ readBtn.classList.remove('v4-read-anim'); }, 600);
        }
      };
      well.appendChild(readBtn);

      /* ── Pilar 3: Focus Mode button ── */
      var focusBtn = document.createElement('button');
      focusBtn.className = 'v4-focus-btn';
      focusBtn.title = 'Modo Enfoque';
      focusBtn.innerHTML = '🎯';
      focusBtn.onclick = function(e) {
        e.stopPropagation();
        v4EnterFocus(cardId, item.titulo || '');
      };
      if (cardEl) {
        var header = cardEl.querySelector('.mc-header');
        if (header) header.appendChild(focusBtn);
      }

      ph.appendChild(well);

      /* ── v18: Sistema de TPs — respuestas por consigna ─────────────────
         Si el item tiene subtipo:'tp', inyectar área de respuestas debajo
         del contenido. Una textarea por cada sub-item (consigna).         */
      if (item.subtipo === 'tp') {
        if ((item.cuerpo||'').indexOf('data-tp-fld') !== -1) {
          _mountInlineTP(ph, item, color);
        } else {
          _injectTPResponses(ph, item, color);
        }
      }

      return;
    }

    /* Fallback */
    ph.innerHTML =
      '<p class="mc-fallback">' +
        esc(item.descripcion || 'Sin contenido disponible.') +
      '</p>';
    /* v5.7: Nexus Bridge — pedagogía del recuerdo activo */
    if (item.relacionado && item.tipo !== 'Quiz') {
      var _relId   = item.relacionado;
      var _mat     = item.materia   || '';
      var _ag      = item.agrupador || 'esta unidad';
      var _relItem = (_data||[]).filter(function(d){ return d.id === _relId; })[0];
      var _qTitle  = _relItem ? (_relItem.titulo || 'Quiz') : 'Quiz';

      var bridge = document.createElement('div');
      bridge.className = 'nexus-bridge v57-bridge';

      /* Icono + mensaje */
      var msgEl = document.createElement('div');
      msgEl.className = 'v57-bridge-msg';
      msgEl.innerHTML =
        '<span class="v57-bridge-book">📖</span>' +
        '<div class="v57-bridge-text">' +
          '<strong>Terminaste la teoría.</strong>' +
          '<span>¿Estás listo para el desafío de <em>' + _ag + '</em>?</span>' +
        '</div>';
      bridge.appendChild(msgEl);

      /* Botón Iniciar Quiz */
      var btn = document.createElement('button');
      btn.className = 'v57-bridge-btn';
      btn.textContent = '⚡ Iniciar Quiz';
      btn.setAttribute('data-rel', _relId);
      btn.setAttribute('data-mat', _mat);
      btn.setAttribute('data-ag',  _ag);
      btn.addEventListener('click', function() {
        var relId = this.getAttribute('data-rel');
        var mat   = this.getAttribute('data-mat');
        var ag    = this.getAttribute('data-ag');
        var cid   = 'q55-bridge-' + relId.replace(/[^a-z0-9]/gi,'-');
        /* Activar training mode */
        if (typeof _activateTrainingMode === 'function') _activateTrainingMode(mat);
        /* Crear contenedor inline si no existe */
        var container = document.getElementById(cid);
        if (!container) {
          container = document.createElement('div');
          container.id = cid;
          container.className = 'nexus-inline-quiz v57-inline-quiz';
          bridge.parentNode.insertBefore(container, bridge.nextSibling);
        }
        bridge.style.display = 'none';
        if (typeof q55Start === 'function') q55Start(cid, mat, ag);
        /* Scroll al quiz */
        setTimeout(function() {
          container.scrollIntoView({ behavior:'smooth', block:'start' });
        }, 150);
      });
      bridge.appendChild(btn);

      ph.appendChild(bridge);
    }
    if (item && (item.tipo === 'Resumen' || item.tipo === 'Práctico')
        && typeof cneInjectAriadna === 'function' && _data) {
      cneInjectAriadna(ph, item, _data);
    }

  }

  /* ── Clear search filter for active unit ─────────────────────────────  */
  function _showAllCards(page, unit) {
    var panel = unit
      ? page.querySelector('.fce-unit-panel[data-unit="' + unit + '"]')
      : null;
    if (!panel) return;
    panel.querySelectorAll('.mat-card').forEach(function (c) {
      c.style.display = '';
    });
    var empty = panel.querySelector('.fce-empty');
    if (empty) empty.style.display = 'none';
  }

  function _getFirstUnit(materia) {
    if (!_data || !_data.length) return 'U1';
    var items = _data.filter(function (i) {
      return i != null && norm(i.materia) === norm(materia);
    });
    var g = groupBy(items, 'unidad');
    var units = g.order.slice().sort(sortU);
    return units[0] || 'U1';
  }

  /* ── Load JSON — FIX B: flush pending queue after load ──────────────── */
  function _boot() {
    /* ── Bloque 6B: fetch delegado a NexusFetch (nexus-fetch.js) ── */
    NexusFetch.cargarMateriales().then(function(data) {
      if (!data || !data.length) return;  // fallback offline — no romper UI

      /* ── Post-carga: mismos callbacks que antes, sin tocar lógica ── */
      _data = NexusCore.getMateriales();   /* fase 8: fuente canónica */

      console.log('● SISTEMA OPERATIVO | NEXUS v13.2.5 — Document/Modular Separation (Fase 12.3G)');

      /* CSS crítico inyectado via JS para bypass de cache SW */
      (function(){
        var s = document.createElement('style');
        s.id  = 'nexus-critical-override';
        s.textContent = '/* v9.2.1 — inyectado via JS, no depende de cache SW */' +
          '.sub-grid{display:flex!important;flex-direction:column!important;gap:1.2rem!important;width:100%!important}' +
          '.mc-well .sub-item{width:100%!important;max-width:none!important;box-sizing:border-box!important;float:none!important}' +
          '.mc-well .adm-highlight{display:block!important;width:100%!important;float:none!important;clear:both!important}';
        document.head.appendChild(s);
      })();

      var _pl = document.getElementById('prog-label');
      if (_pl) { _pl.style.opacity = ''; }

      if (typeof n70WrapGenerateMachete === 'function') n70WrapGenerateMachete();
      if (typeof N78Regional !== 'undefined') N78Regional.init();

      /* v10.8.3: seguro absoluto — llamar nexusRenderAll directamente si el
         suscriptor no alcanzó a disparar (ej: error silencioso en NexusCore.on) */
      if (typeof nexusRenderAll === 'function') {
        nexusRenderAll(_data);
      }
      if (typeof N83Perf  !== 'undefined') N83Perf.deferNonCritical();
      if (typeof N84Swipe !== 'undefined') N84Swipe.init();

      setTimeout(function() {
        if (typeof n68RestoreSession === 'function') n68RestoreSession();
      }, 800);
      setTimeout(function() {
        if (typeof n73CheckCatedraNotas === 'function') n73CheckCatedraNotas();
      }, 2000);
      setTimeout(function() {
        if (typeof N82Integrity !== 'undefined') N82Integrity.verify();
      }, 1500);

      /* v10.8: hydration y flush pendientes → manejados por NexusCore.on */
    }); setTimeout(function(){ if(typeof N82Integrity!=='undefined') N82Integrity.verify(); },1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot);
  } else {
    _boot();
  }

})();

// ═══════════════════════════════════════════════════════════════════════
//  N88CognitiveEngine — THE COGNITIVE ENGINE · v8.8
//  Célula de Simulación: de leer a resolver.
//  Submódulos:
//    N88ScenarioBuilder  — construye escenario VIRCH contextualizado
//    N88ExamEngine       — motor de selección inteligente (teoría × noticia)
//    N88AuditFeedback    — validador con cita glosario NIC/NIIF
//  Prefijo CSS: .n88-*
//  pageId: 'cognitive-engine'
// ═══════════════════════════════════════════════════════════════════════

var N88CognitiveEngine = (function () {
  'use strict';

  // ── Paleta propia ────────────────────────────────────────────────────
  var COLOR    = '#b07ef8';          // violeta NEXUS
  var COLOR_OK = 'var(--color-ok,#3fb950)';  /* v19.3.1: token semántico */
  var COLOR_NO = 'var(--color-err,#f85149)'; /* v19.3.1: token semántico */
  var COLOR_BG = 'rgba(167,139,250,.08)';

  // ── Estado de sesión ─────────────────────────────────────────────────
  var _state = {
    noticias:   [],    // cargadas de noticias.json
    materiales: [],    // poblado por NexusCore.getMateriales() en _loadData
    glossary:   {},    // cargado de glossary.json
    session: {
      noticia:   null, // noticia activa
      materiaCtx: null,// materia del contexto
      steps:     [],   // pasos de la solución
      stepIdx:   0,
      score:     { ok: 0, fail: 0 },
      history:   []    // { noticiaId, pct }[]
    },
    loaded: false
  };

  // ────────────────────────────────────────────────────────────────────
  //  UTILS internos
  // ────────────────────────────────────────────────────────────────────
  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _dif(d) {
    var MAP = { 'básica':'🟢 Básica', 'media':'🟡 Media', 'avanzada':'🔴 Avanzada' };
    return MAP[d] || '⚪ ' + _esc(d);
  }

  function _pct(ok, total) {
    if (!total) return 0;
    return Math.round(ok / total * 100);
  }

  // ── Buscar términos de glossary relevantes al error cometido ─────────
  function _glossTermsFor(texto) {
    if (!texto || !_state.glossary) return [];
    var t = texto.toLowerCase();
    var hits = [];
    Object.keys(_state.glossary).forEach(function (k) {
      if (t.indexOf(k.toLowerCase()) !== -1) {
        hits.push({ term: k, data: _state.glossary[k] });
      }
    });
    return hits.slice(0, 2);
  }

  // ── Buscar material teórico relacionado ──────────────────────────────
  function _relatedMaterial(materia) {
    var src = _state.materiales.length ? _state.materiales : NexusCore.getMateriales();
    var items = src.filter(function (i) {
      return i && i.materia === materia && i.tipo === 'Resumen';
    });
    return items[Math.floor(Math.random() * items.length)] || null;
  }

  // ────────────────────────────────────────────────────────────────────
  //  N88ScenarioBuilder — Construye el HTML del escenario
  // ────────────────────────────────────────────────────────────────────
  var N88ScenarioBuilder = {

    build: function (noticia) {
      var relMat = _relatedMaterial(noticia.materia || 'Contabilidad');
      var relLink = '';
      if (relMat) {
        relLink = '<div class="n88-rel-mat" onclick="N88CognitiveEngine._openRelated(\'' +
          _esc(relMat.id) + '\',\'' + _esc(relMat.materia || '') + '\')">' +
          '<span class="n88-rel-icon">📖</span>' +
          '<span class="n88-rel-label">Teoría relacionada: ' + _esc(relMat.titulo) + '</span>' +
          '<span class="n88-rel-chip">abrir</span>' +
          '</div>';
      }

      return '<div class="n88-scenario">' +
        '<div class="n88-noticia-header">' +
          '<span class="n88-noticia-fuente">' + _esc(noticia.fuente) + '</span>' +
          '<span class="n88-noticia-fecha">' + _esc(noticia.fecha) + '</span>' +
          '<span class="n88-dif-badge">' + _dif(noticia.dificultad) + '</span>' +
        '</div>' +
        '<div class="n88-noticia-titulo">' + _esc(noticia.titulo) + '</div>' +
        '<div class="n88-noticia-texto">' + _esc(noticia.texto) + '</div>' +
        relLink +
        '<div class="n88-ejercicio-label">🎯 EJERCICIO</div>' +
        '<div class="n88-ejercicio-texto">' + _esc(noticia.ejercicio) + '</div>' +
        '</div>';
    }
  };

  // ────────────────────────────────────────────────────────────────────
  //  N88ExamEngine — Selección inteligente + progresión
  // ────────────────────────────────────────────────────────────────────
  var N88ExamEngine = {

    // Selecciona la próxima noticia priorizando las no vistas y mayor dificultad
    pick: function () {
      var noticias = _state.noticias;
      if (!noticias.length) return null;
      var hist = _state.session.history.map(function (h) { return h.noticiaId; });
      // No vistas primero
      var noVistas = noticias.filter(function (n) { return hist.indexOf(n.id) === -1; });
      var pool = noVistas.length ? noVistas : noticias;
      // Ordenar por dificultad según score actual
      var pct = _pct(_state.session.score.ok, _state.session.score.ok + _state.session.score.fail);
      var DIFF_ORDER;
      if (pct >= 80) {
        DIFF_ORDER = ['avanzada', 'media', 'básica'];
      } else if (pct >= 50) {
        DIFF_ORDER = ['media', 'avanzada', 'básica'];
      } else {
        DIFF_ORDER = ['básica', 'media', 'avanzada'];
      }
      pool.sort(function (a, b) {
        return DIFF_ORDER.indexOf(a.dificultad) - DIFF_ORDER.indexOf(b.dificultad);
      });
      return pool[0];
    },

    // Inicia un nuevo escenario
    start: function (noticia) {
      var ss = _state.session;
      ss.noticia   = noticia;
      ss.steps     = (noticia.solucion || []).slice();
      ss.stepIdx   = 0;
      ss.materiaCtx = noticia.materia || 'Contabilidad';
      N88CognitiveEngine._renderScenario();
    }
  };

  // ────────────────────────────────────────────────────────────────────
  //  N88AuditFeedback — Evaluador con cita NIC/NIIF
  // ────────────────────────────────────────────────────────────────────
  var N88AuditFeedback = {

    evaluate: function (stepIdx, userChose) {
      var ss      = _state.session;
      var step    = ss.steps[stepIdx];
      if (!step) return;

      var isCorrect = (userChose === true || userChose === step.correcto);
      var fbEl = document.getElementById('n88-feedback');
      if (!fbEl) return;

      /* v8.8: registrar tiempo de respuesta en sesión */
      var _elapsed = (_state.session._stepStartMs
        ? Date.now() - _state.session._stepStartMs : 0);

      if (isCorrect && step.correcto) {
        // Respuesta CORRECTA
        ss.score.ok++;
        fbEl.className = 'n88-feedback n88-feedback-ok show';
        fbEl.innerHTML = '<span class="n88-fb-icon">✓</span>' +
          '<div class="n88-fb-body">' +
          '<div class="n88-fb-title">Correcto</div>' +
          '<div class="n88-fb-text">' + _esc(step.texto) + '</div>' +
          '</div>';
      } else {
        // Respuesta INCORRECTA — explicación + glosario
        ss.score.fail++;
        /* v9.2: mostrar explicacion del paso si existe */
        var _explicacionHTML = '';
        if (step.explicacion) {
          _explicacionHTML = '<div class="n88-fb-explicacion">💡 ' + step.explicacion + '</div>';
        }
        var glosTerms = _glossTermsFor(step.texto);
        var glosHTML = '';
        if (glosTerms.length) {
          glosHTML = '<div class="n88-glos-cite">' +
            '<div class="n88-glos-header">📚 Normativa NIC/NIIF aplicable:</div>';
          glosTerms.forEach(function (gt) {
            glosHTML += '<div class="n88-glos-term">' +
              '<span class="n88-glos-key">' + _esc(gt.term) + '</span> ' +
              '<span class="n88-glos-en">(' + _esc(gt.data.en || '') + ')</span><br>' +
              '<span class="n88-glos-niif">' + _esc(gt.data.niif || gt.data.definicion || '') + '</span>' +
              '</div>';
          });
          glosHTML += '</div>';
        }
        // Trampa detectada?
        var trampaMsg = '';
        if (step.correcto === false) {
          trampaMsg = '<div class="n88-trampa-alert">⚠ Trampa detectada — esta opción es incorrecta. ' +
            'Revisá los conceptos antes de continuar.</div>';
        }
        fbEl.className = 'n88-feedback n88-feedback-no show';
        fbEl.innerHTML = '<span class="n88-fb-icon">✗</span>' +
          '<div class="n88-fb-body">' +
          '<div class="n88-fb-title">Incorrecto</div>' +
          '<div class="n88-fb-text">' + _esc(step.texto) + '</div>' +
          _explicacionHTML +
          trampaMsg + glosHTML +
          '</div>';
      }

      // Avanzar al siguiente paso o finalizar
      setTimeout(function () {
        ss.stepIdx++;
        if (ss.stepIdx < ss.steps.length) {
          N88CognitiveEngine._renderStep();
        } else {
          N88CognitiveEngine._renderResult();
        }
      }, isCorrect ? 1200 : 2800);
    }
  };

  // ────────────────────────────────────────────────────────────────────
  //  RENDERIZADO
  // ────────────────────────────────────────────────────────────────────

  // Render principal de la página cognitive-engine
  function _renderPage(hostId) {
    var host = document.getElementById(hostId || 'n88-host');
    if (!host) return;

    if (!_state.loaded) {
      host.innerHTML = '<div class="n88-loading">⏳ Cargando datos…</div>';
      _loadData(function () { _renderPage(hostId); });
      return;
    }

    // Scoreboard superior
    var ss = _state.session;
    var total = ss.score.ok + ss.score.fail;
    var pct   = _pct(ss.score.ok, total);

    var html = '<div class="n88-wrap">';

    // Header del motor
    html += '<div class="n88-header">' +
      '<div class="n88-header-left">' +
        '<div class="n88-eyebrow">Motor Cognitivo · v8.8</div>' +
        '<div class="n88-title">CÉLULA DE SIMULACIÓN</div>' +
        '<div class="n88-subtitle">Entrenamiento activo: noticia real → asiento contable → validación NIC/NIIF</div>' +
      '</div>' +
      '<div class="n88-scoreboard">' +
        '<div class="n88-score-item n88-score-ok"><span class="n88-score-num">' + ss.score.ok + '</span><span class="n88-score-lbl">✓ Ok</span></div>' +
        '<div class="n88-score-sep">|</div>' +
        '<div class="n88-score-item n88-score-fail"><span class="n88-score-num">' + ss.score.fail + '</span><span class="n88-score-lbl">✗ Error</span></div>' +
        (total ? '<div class="n88-score-sep">|</div><div class="n88-score-item"><span class="n88-score-num">' + pct + '%</span><span class="n88-score-lbl">Dominio</span></div>' : '') +
      '</div>' +
    '</div>';

    // Historial compacto
    if (ss.history.length) {
      html += '<div class="n88-history">';
      ss.history.slice(-5).forEach(function (h) {
        var cls = h.pct >= 75 ? 'n88-hist-ok' : (h.pct >= 50 ? 'n88-hist-med' : 'n88-hist-no');
        html += '<span class="n88-hist-dot ' + cls + '" title="' + _esc(h.noticiaId) + ' · ' + h.pct + '%">' + h.pct + '%</span>';
      });
      html += '</div>';
    }

    html += '<div id="n88-scenario-area"></div>';
    html += '<div id="n88-step-area"></div>';
    html += '<div id="n88-feedback" class="n88-feedback"></div>';
    html += '<div id="n88-result-area"></div>';
    html += '</div>'; // .n88-wrap

    host.innerHTML = html;

    // Arrancar primer escenario
    var noticia = N88ExamEngine.pick();
    if (noticia) {
      N88ExamEngine.start(noticia);
    } else {
      document.getElementById('n88-scenario-area').innerHTML =
        '<div class="n88-empty">No hay noticias disponibles en noticias.json.</div>';
    }
  }

  // Renderiza el escenario (noticia + ejercicio)
  function _renderScenario() {
    var saEl = document.getElementById('n88-scenario-area');
    var stEl = document.getElementById('n88-step-area');
    var fbEl = document.getElementById('n88-feedback');
    var rrEl = document.getElementById('n88-result-area');
    if (!saEl) return;

    var ss = _state.session;
    saEl.innerHTML = N88ScenarioBuilder.build(ss.noticia) +
      '<div class="n88-instruction">🛠️ DESAFÍO: Seleccioná los pasos correctos para resolver este caso.</div>';
    if (stEl) stEl.innerHTML = '';
    if (fbEl) { fbEl.className = 'n88-feedback'; fbEl.innerHTML = ''; }
    if (rrEl) rrEl.innerHTML = '';

    // Pequeño delay para que el alumno lea la noticia
    setTimeout(function () { _renderStep(); }, 400);
  }

  // Renderiza el paso actual de la solución
  function _renderStep() {
    /* v8.8 telemetry: timestamp de inicio de pregunta */
    _state.session._stepStartMs = Date.now();
    var stEl = document.getElementById('n88-step-area');
    var fbEl = document.getElementById('n88-feedback');
    if (!stEl) return;

    if (fbEl) { fbEl.className = 'n88-feedback'; fbEl.innerHTML = ''; }

    var ss   = _state.session;
    var step = ss.steps[ss.stepIdx];
    if (!step) { _renderResult(); return; }

    var total = ss.steps.length;
    var prog  = Math.round(ss.stepIdx / total * 100);

    // Generar 2 opciones adicionales falsas mezcladas con la correcta
    var opciones = _buildOpciones(ss.steps, ss.stepIdx);

    var html = '<div class="n88-step-card">' +
      '<div class="n88-step-prog">' +
        '<div class="n88-step-prog-fill" style="width:' + prog + '%"></div>' +
      '</div>' +
      '<div class="n88-step-label">Paso ' + (ss.stepIdx + 1) + ' de ' + total + '</div>' +
      '<div class="n88-step-question">¿Cuál de las siguientes afirmaciones es <strong>correcta</strong> para este paso?</div>' +
      '<div class="n88-opciones">';

    opciones.forEach(function (op, i) {
      html += '<button class="n88-opcion" onclick="N88CognitiveEngine._answer(' + ss.stepIdx + ',' + op.correcto + ')">' +
        '<span class="n88-op-idx">' + String.fromCharCode(65 + i) + '</span>' +
        '<span class="n88-op-text">' + _esc(op.texto) + '</span>' +
        '</button>';
    });

    html += '</div></div>';
    stEl.innerHTML = html;

    // Scroll suave al área de pasos
    stEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Mezcla pasos para construir las opciones de respuesta del paso actual
  function _buildOpciones(steps, idx) {
    var correct = steps[idx];
    // Usar otros pasos como distractores
    var others = steps.filter(function (s, i) { return i !== idx; });
    // Si hay pocos, agregar un distractor genérico
    while (others.length < 2) {
      others.push({ texto: 'Ninguna de las opciones anteriores es correcta.', correcto: false });
    }
    // Tomar hasta 2 distractores
    var distractors = others.slice(0, 2);
    var pool = [correct].concat(distractors);
    // Fisher-Yates shuffle
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool;
  }

  // Renderiza el resultado final del escenario
  function _renderResult() {
    var rrEl = document.getElementById('n88-result-area');
    var stEl = document.getElementById('n88-step-area');
    var fbEl = document.getElementById('n88-feedback');
    if (!rrEl) return;

    if (stEl) stEl.innerHTML = '';
    if (fbEl) { fbEl.className = 'n88-feedback'; fbEl.innerHTML = ''; }

    var ss    = _state.session;
    var total = ss.steps.length;
    var pct   = _pct(ss.score.ok, ss.score.ok + ss.score.fail);

    // Guardar en historial
    ss.history.push({ noticiaId: ss.noticia.id, pct: _pct(ss.score.ok, total) });

    // Persitir en localStorage con prefijo seguro
    try {
      localStorage.setItem('n88_score', JSON.stringify(ss.score));
      localStorage.setItem('n88_history', JSON.stringify(ss.history));
    } catch (e) { /* sin localStorage */ }

    // Emitir evento a NexusMemoryAPI si existe
    if (typeof NexusMemoryAPI !== 'undefined') {
      NexusMemoryAPI.emit('cognitive:done', {
        noticiaId: ss.noticia.id,
        pct: pct,
        ok: ss.score.ok,
        fail: ss.score.fail
      });
    }

    /* v8.8: Telemetría Firestore → colección n75_legajos */
    (function() {
      try {
        if (typeof db === 'undefined' || !NEXUS_STATE.fceUsuario) return;
        var payload = {
          timestamp:           new Date().toISOString(),
          uid:                 NEXUS_STATE.fceUsuario.uid,
          noticia_id:          ss.noticia ? ss.noticia.id : 'unknown',
          acierto:             (ss.score.fail === 0 && ss.score.ok > 0),
          score_ok:            ss.score.ok,
          score_fail:          ss.score.fail,
          pct:                 pct,
          tiempo_respuesta_ms: (_state.session._stepStartMs
                                ? Date.now() - _state.session._stepStartMs
                                : null),
          agrupador_asociado:  ss.materiaCtx || '',
          portal_version:      '8.8'
        };
        db.collection('n75_legajos').add(payload)
          .catch(function() { /* fail silencioso — no interrumpir UX */ });
      } catch(e) {}
    })();

    var nivel = pct >= 80 ? '🏆 Excelente dominio' :
                pct >= 60 ? '📈 Buen avance' :
                pct >= 40 ? '⚠ Necesitás repasar' : '🔁 Repasá la teoría';

    var colorRes = pct >= 60 ? COLOR_OK : COLOR_NO;

    rrEl.innerHTML = '<div class="n88-result">' +
      '<div class="n88-result-circle" style="border-color:' + colorRes + '">' +
        '<span class="n88-result-pct" style="color:' + colorRes + '">' + pct + '%</span>' +
        '<span class="n88-result-lbl">dominio</span>' +
      '</div>' +
      '<div class="n88-result-nivel">' + nivel + '</div>' +
      '<div class="n88-result-stats">' +
        '<span class="n88-rs-ok">✓ ' + ss.score.ok + ' correctos</span>' +
        '<span class="n88-rs-fail">✗ ' + ss.score.fail + ' errores</span>' +
      '</div>' +
      '<div class="n88-result-actions">' +
        '<button class="n88-btn-next" onclick="N88CognitiveEngine._nextScenario()">▶ Siguiente escenario</button>' +
        '<button class="n88-btn-reset" onclick="N88CognitiveEngine._reset()">↺ Reiniciar sesión</button>' +
      '</div>' +
    '</div>';

    // N87Analytics: registrar si está disponible
    if (typeof N87Analytics !== 'undefined' && typeof N87Analytics.record === 'function') {
      N87Analytics.record(ss.materiaCtx, pct);
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  CARGA DE DATOS
  // ────────────────────────────────────────────────────────────────────
  function _loadData(cb) {
    var loaded = { noticias: false, glossary: false };
    function _check() {
      if (loaded.noticias && loaded.glossary) {
        _state.loaded = true;
        _state.materiales = NexusCore.getMateriales();
        if (typeof cb === 'function') cb();
      }
    }

    // noticias.json
    fetch('noticias.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var arr = Array.isArray(data) ? data : (data.noticias || data.items || []);
        _state.noticias = arr.filter(function (n) { return n && n.id && n.ejercicio && n.solucion; });
        loaded.noticias = true;
        _check();
      })
      .catch(function () { loaded.noticias = true; _check(); });

    // glossary.json
    fetch('glossary.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _state.glossary = data || {};
        loaded.glossary = true;
        _check();
      })
      .catch(function () { loaded.glossary = true; _check(); });
  }

  // ────────────────────────────────────────────────────────────────────
  //  API PÚBLICA
  // ────────────────────────────────────────────────────────────────────

  // Llamado desde sidebar: goto('cognitive-engine', null)
  function _open() {
    if (typeof goto === 'function') {
      goto('cognitive-engine', null);
    }
  }

  // Respuesta del alumno
  function _answer(stepIdx, correcto) {
    // Deshabilitar todos los botones de opción
    var btns = document.querySelectorAll('.n88-opcion');
    btns.forEach(function (b) { b.disabled = true; });
    N88AuditFeedback.evaluate(stepIdx, correcto);
  }

  // Siguiente escenario
  function _nextScenario() {
    var noticia = N88ExamEngine.pick();
    if (noticia) {
      N88ExamEngine.start(noticia);
    } else {
      var rrEl = document.getElementById('n88-result-area');
      if (rrEl) rrEl.innerHTML = '<div class="n88-empty">¡Completaste todos los escenarios! Reiniciá la sesión para volver a practicar.</div>';
    }
  }

  // Reiniciar sesión completa
  function _reset() {
    _state.session = { noticia: null, materiaCtx: null, steps: [], stepIdx: 0, score: { ok: 0, fail: 0 }, history: [] };
    try { localStorage.removeItem('n88_score'); localStorage.removeItem('n88_history'); } catch (e) {}
    _renderPage('n88-host');
  }

  // Abrir material relacionado
  function _openRelated(itemId, materia) {
    var pageMap = { 'Contabilidad': 'cont-materiales', 'Administración': 'adm-materiales', 'Sociales': 'soc-materiales', 'Propedéutica': 'prop-materiales' };
    var pid = pageMap[materia] || 'cont-materiales';
    if (typeof goto === 'function') goto(pid, null);
    setTimeout(function () {
      var card = document.getElementById('mcard-' + itemId);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('nexus-highlight');
        setTimeout(function () { card.classList.remove('nexus-highlight'); }, 2000);
      }
    }, 600);
  }

  // Render: punto de entrada llamado desde goto() o index.html
  function _render(hostId) {
    _renderPage(hostId || 'n88-host');
  }

  // ────────────────────────────────────────────────────────────────────
  //  CSS INLINE — inyectado una sola vez
  // ────────────────────────────────────────────────────────────────────
  (function _injectCSS() {
    if (document.getElementById('n88-styles')) return;
    var s = document.createElement('style');
    s.id = 'n88-styles';
    s.textContent = [
      /* Force dark background on host — immune to light theme */
      '#n88-host,#cognitive-engine{background:#0d0f1a !important;color:rgba(255,255,255,.92) !important}',
      '#cognitive-engine.page{background:#0d0f1a !important}',
      '.n88-wrap *{color:inherit}',
      /* Wrap */
      '.n88-wrap{max-width:720px;margin:0 auto;padding:0 0 60px}',
      /* Header */
      '.n88-header{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.07)}',
      '.n88-eyebrow{font-family:"DM Mono",monospace;font-size:.56rem;letter-spacing:.18em;text-transform:uppercase;color:rgba(176,126,248,.6);margin-bottom:4px}',
      '.n88-title{font-family:"Bebas Neue",sans-serif;font-size:2rem;letter-spacing:.06em;color:#fff;line-height:1}',
      '.n88-subtitle{font-family:"Fraunces",serif;font-size:.8rem;color:rgba(255,255,255,.45);margin-top:4px;font-style:italic}',
      /* Scoreboard */
      '.n88-scoreboard{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:10px 16px}',
      '.n88-score-item{display:flex;flex-direction:column;align-items:center;gap:1px}',
      '.n88-score-num{font-family:"Bebas Neue",sans-serif;font-size:1.4rem;line-height:1;color:#fff}',
      '.n88-score-lbl{font-family:"DM Mono",monospace;font-size:.52rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em}',
      '.n88-score-ok .n88-score-num{color:var(--color-ok,#3fb950)}',
      '.n88-score-fail .n88-score-num{color:var(--color-err,#f85149)}',
      '.n88-score-sep{color:rgba(255,255,255,.15);font-size:1rem}',
      /* History dots — usan tokens semánticos v19.3.1 */
      '.n88-history{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}',
      '.n88-hist-dot{font-family:"DM Mono",monospace;font-size:.58rem;padding:3px 8px;border-radius:4px;letter-spacing:.04em}',
      '.n88-hist-ok{background:var(--color-ok-bg,rgba(63,185,80,.10));color:var(--color-ok,#3fb950);border:1px solid rgba(63,185,80,.2)}',
      '.n88-hist-med{background:var(--color-warn-bg,rgba(227,179,65,.10));color:var(--color-warn,#e3b341);border:1px solid rgba(227,179,65,.2)}',
      '.n88-hist-no{background:var(--color-err-bg,rgba(248,81,73,.10));color:var(--color-err,#f85149);border:1px solid rgba(248,81,73,.2)}',
      /* Loading */
      '.n88-loading,.n88-empty{font-family:"DM Mono",monospace;font-size:.75rem;color:rgba(255,255,255,.35);text-align:center;padding:48px 0}',
      /* Scenario */
      '.n88-scenario{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:20px;margin-bottom:18px}',
      '.n88-noticia-header{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}',
      '.n88-noticia-fuente{font-family:"DM Mono",monospace;font-size:.58rem;color:rgba(176,126,248,1);letter-spacing:.06em;text-transform:uppercase;font-weight:700;background:rgba(176,126,248,.15);padding:2px 8px;border-radius:4px}',
      '.n88-noticia-fecha{font-family:"DM Mono",monospace;font-size:.56rem;color:rgba(255,255,255,.65);margin-left:auto}',
      '.n88-dif-badge{font-family:"DM Mono",monospace;font-size:.55rem;padding:2px 8px;border-radius:4px;border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.85)}',
      '.n88-noticia-titulo{font-family:"Fraunces",serif;font-size:1rem;font-weight:600;color:#fff;margin-bottom:8px;line-height:1.4}',
      '.n88-noticia-texto{font-size:.82rem;color:rgba(255,255,255,.82);line-height:1.75;margin-bottom:12px}',
      /* Material relacionado */
      '.n88-rel-mat{display:flex;align-items:center;gap:8px;background:rgba(26,110,74,.1);border:1px solid rgba(26,110,74,.25);border-radius:6px;padding:8px 12px;cursor:pointer;transition:background .15s;margin-bottom:12px}',
      '.n88-rel-mat:hover{background:rgba(26,110,74,.2)}',
      '.n88-rel-icon{font-size:.85rem}',
      '.n88-rel-label{font-family:"Fraunces",serif;font-size:.78rem;color:rgba(255,255,255,.75);flex:1}',
      '.n88-rel-chip{font-family:"DM Mono",monospace;font-size:.52rem;padding:2px 7px;background:rgba(26,110,74,.3);color:#4ade80;border-radius:3px;text-transform:uppercase;letter-spacing:.06em}',
      /* Ejercicio */
      '.n88-ejercicio-label{font-family:"DM Mono",monospace;font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;color:rgba(176,126,248,.7);margin-bottom:6px}',
      '.n88-ejercicio-texto{font-family:"Fraunces",serif;font-size:.9rem;font-style:italic;color:#fff;line-height:1.65;background:rgba(176,126,248,.06);border-left:3px solid rgba(176,126,248,.4);padding:10px 14px;border-radius:0 6px 6px 0}',
      /* Step card */
      '.n88-step-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:20px;margin-bottom:16px}',
      '.n88-step-prog{height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;margin-bottom:10px}',
      '.n88-step-prog-fill{height:100%;background:linear-gradient(90deg,rgba(176,126,248,.7),rgba(176,126,248,1));transition:width .4s ease}',
      '.n88-step-label{font-family:"DM Mono",monospace;font-size:.55rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:10px}',
      '.n88-step-question{font-family:"Fraunces",serif;font-size:.88rem;color:rgba(255,255,255,.8);margin-bottom:14px;line-height:1.6}',
      '.n88-step-question strong{color:#fff}',
      /* Opciones */
      '.n88-opciones{display:flex;flex-direction:column;gap:8px}',
      '.n88-opcion{display:flex;align-items:flex-start;gap:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:12px 14px;cursor:pointer;text-align:left;transition:all .15s;font-family:"Fraunces",serif;font-size:.84rem;color:rgba(255,255,255,.75);line-height:1.55}',
      '.n88-opcion:hover:not(:disabled){background:rgba(176,126,248,.1);border-color:rgba(176,126,248,.4);color:#fff}',
      '.n88-opcion:disabled{cursor:default;opacity:.6}',
      '.n88-op-idx{font-family:"DM Mono",monospace;font-size:.6rem;background:rgba(176,126,248,.2);color:#b07ef8;padding:2px 6px;border-radius:3px;flex-shrink:0;margin-top:2px;font-weight:700}',
      '.n88-op-text{flex:1}',
      /* Feedback */
      '.n88-feedback{display:none;border-radius:8px;padding:14px 16px;margin-bottom:16px;flex:1;gap:12px}',
      '.n88-feedback.show{display:flex;animation:n88FadeIn .25s ease}',
      '.n88-feedback-ok{background:rgba(26,110,74,.12);border:1px solid rgba(26,110,74,.3)}',
      '.n88-feedback-no{background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.3)}',
      '.n88-fb-icon{font-size:1.2rem;flex-shrink:0;margin-top:1px}',
      '.n88-feedback-ok .n88-fb-icon{color:#4ade80}',
      '.n88-feedback-no .n88-fb-icon{color:#f87171}',
      '.n88-fb-title{font-family:"DM Mono",monospace;font-size:.65rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}',
      '.n88-feedback-ok .n88-fb-title{color:#4ade80}',
      '.n88-feedback-no .n88-fb-title{color:#f87171}',
      '.n88-fb-text{font-family:"Fraunces",serif;font-size:.82rem;color:rgba(255,255,255,.7);line-height:1.65}',
      /* Trampa alert */
      '.n88-trampa-alert{font-family:"DM Mono",monospace;font-size:.65rem;background:rgba(192,57,43,.15);border:1px solid rgba(192,57,43,.3);border-radius:4px;padding:6px 10px;color:#f87171;margin-top:8px}',
      /* Glosario cite */
      '.n88-glos-cite{background:rgba(26,74,138,.12);border:1px solid rgba(26,74,138,.25);border-radius:6px;padding:10px 12px;margin-top:10px}',
      '.n88-glos-header{font-family:"DM Mono",monospace;font-size:.58rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(122,172,255,.8);margin-bottom:8px}',
      '.n88-glos-term{margin-bottom:6px;font-size:.78rem;line-height:1.6}',
      '.n88-glos-key{font-family:"DM Mono",monospace;font-size:.7rem;font-weight:700;color:#7aacff;text-transform:capitalize}',
      '.n88-glos-en{font-family:"DM Mono",monospace;font-size:.63rem;color:rgba(255,255,255,.35)}',
      '.n88-glos-niif{font-size:.76rem;color:rgba(255,255,255,.55);font-style:italic;display:block;margin-top:2px}',
      /* Resultado */
      '.n88-result{display:flex;flex-direction:column;align-items:center;gap:14px;padding:32px 20px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;text-align:center;animation:n88FadeIn .4s ease}',
      '.n88-result-circle{width:88px;height:88px;border-radius:50%;border:3px solid #4ade80;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0}',
      '.n88-result-pct{font-family:"Bebas Neue",sans-serif;font-size:1.8rem;line-height:1;color:#4ade80}',
      '.n88-result-lbl{font-family:"DM Mono",monospace;font-size:.52rem;color:rgba(255,255,255,.4);letter-spacing:.08em;text-transform:uppercase}',
      '.n88-result-nivel{font-family:"Fraunces",serif;font-size:1rem;font-weight:600;color:#fff}',
      '.n88-result-stats{display:flex;gap:16px;font-family:"DM Mono",monospace;font-size:.65rem}',
      '.n88-rs-ok{color:#4ade80}',
      '.n88-rs-fail{color:#f87171}',
      '.n88-result-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:4px}',
      '.n88-btn-next{background:rgba(176,126,248,.15);border:1px solid rgba(176,126,248,.4);color:#b07ef8;font-family:"DM Mono",monospace;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;padding:9px 20px;border-radius:6px;cursor:pointer;transition:all .15s}',
      '.n88-btn-next:hover{background:rgba(176,126,248,.3);color:#fff}',
      '.n88-btn-reset{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);font-family:"DM Mono",monospace;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;padding:9px 20px;border-radius:6px;cursor:pointer;transition:all .15s}',
      '.n88-btn-reset:hover{background:rgba(255,255,255,.08);color:#fff}',
      '@keyframes n88FadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}'
    ].join('');
    document.head.appendChild(s);
  }());

  // ── Retorno público ───────────────────────────────────────────────────
  return {
    open:          _open,
    render:        _render,
    _answer:       _answer,
    _nextScenario: _nextScenario,
    _reset:        _reset,
    _openRelated:  _openRelated,
    _renderScenario: _renderScenario,
    _renderStep:   _renderStep
  };

}());

window.N88CognitiveEngine = N88CognitiveEngine;

// Auto-render cuando goto() activa la página
(function () {
  var _origGoto = window.goto;
  if (typeof _origGoto === 'function') {
    window.goto = function (pageId, el, unit) {
      _origGoto(pageId, el, unit);
      if (pageId === 'cognitive-engine') {
        setTimeout(function () {
          N88CognitiveEngine.render('n88-host');
        }, 80);
      }
    };
  }
}());


/* ═══════════════════════════════════════════════════════════════════
   NEXUS CONTRAST AUDIT — Fase 10 · v10.10.0
   Funciones de diagnóstico disponibles en consola.
   ═══════════════════════════════════════════════════════════════════ */

/* Guard: detectar <style> inline de contraste en runtime */
(function _nexusGuardInlineCSS() {
  var dangerous = document.querySelector(
    'style[id*="contrast"], style[id*="killswitch"], style[id*="surface-well"]'
  );
  if (dangerous) {
    console.warn('[NEXUS][WARN] CSS inline de contraste detectado — id:', dangerous.id,
      '— Ver REGLA ARQUITECTÓNICA en index.html');
  }
})();

/* nexusAuditContrast() — inspecciona colores computados de los componentes clave */
window.nexusAuditContrast = function() {
  var nodes = document.querySelectorAll('.mc-well, .mat-card, .kpi-card, .mc-header');
  console.group('[NEXUS][CONTRAST AUDIT] ' + nodes.length + ' elementos');
  nodes.forEach(function(el) {
    var st = window.getComputedStyle(el);
    var bg = st.backgroundColor;
    var fg = st.color;
    // Extraer valores RGB para calcular luminancia aproximada
    var bgMatch = bg.match(/[\d.]+/g) || [];
    var fgMatch = fg.match(/[\d.]+/g) || [];
    var isDarkBg = bgMatch.length >= 3 &&
      (parseInt(bgMatch[0]) + parseInt(bgMatch[1]) + parseInt(bgMatch[2])) < 200;
    var isDarkFg = fgMatch.length >= 3 &&
      (parseInt(fgMatch[0]) + parseInt(fgMatch[1]) + parseInt(fgMatch[2])) < 200;
    var sameTheme = isDarkBg === isDarkFg;   // ambos oscuros o ambos claros = problema
    var status = sameTheme ? '❌ POSIBLE PROBLEMA' : '✅ OK';
    console.log(status, el.className.split(' ')[0] || el.id || el.tagName,
      { bg: bg, color: fg, el: el });
  });
  console.groupEnd();
};

/* ── nexusCheckVisibility — WCAG 2.1 real contrast ratio ── */
/* (window.detectarTipo y CONTENT_TYPES_NEXUS se exponen desde dentro del IIFE) */

window.nexusCheckVisibility = function() {

  function _luminance(r, g, b) {
    return [r, g, b].reduce(function(sum, v, i) {
      v /= 255;
      var lin = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      return sum + lin * [0.2126, 0.7152, 0.0722][i];
    }, 0);
  }

  function _contrast(rgb1, rgb2) {
    var L1 = _luminance(rgb1[0], rgb1[1], rgb1[2]);
    var L2 = _luminance(rgb2[0], rgb2[1], rgb2[2]);
    var lighter = Math.max(L1, L2), darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function _parseRGB(cssColor) {
    var m = (cssColor || '').match(/[\d.]+/g);
    if (!m || m.length < 3) return null;
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  }

  var targets = document.querySelectorAll('.mc-well, .mat-card, .kpi-card');
  var problems = 0;

  targets.forEach(function(el) {
    var st  = window.getComputedStyle(el);
    var bg  = _parseRGB(st.backgroundColor);
    var fg  = _parseRGB(st.color);
    if (!bg || !fg) return;

    var ratio = _contrast(bg, fg);
    var tag   = (el.id || el.className.split(' ')[0] || el.tagName);

    if (ratio < 4.5) {
      console.error('[NEXUS][WCAG FAIL] ' + tag +
        ' — ratio ' + ratio.toFixed(2) + ':1 (mínimo 4.5:1)',
        { bg: st.backgroundColor, color: st.color, el: el });
      problems++;
    } else {
      console.info('[NEXUS][WCAG OK] ' + tag +
        ' — ratio ' + ratio.toFixed(2) + ':1');
    }
  });

  if (problems === 0) {
    console.info('[NEXUS][OK] Todos los elementos pasan WCAG AA (' + targets.length + ' verificados)');
  } else {
    console.warn('[NEXUS][WARN] ' + problems + ' elemento(s) con contraste insuficiente');
  }
  return problems;
};

window.addEventListener('load', function() {
  setTimeout(window.nexusCheckVisibility, 1500);
});

console.info('[NEXUS AUDIT] nexusAuditContrast() y nexusCheckVisibility() disponibles en consola.');

/* ══════════════════════════════════════════════════════════════════════
   FEATURES DESACTIVADAS — LANZAMIENTO v19.3.2
   Para reactivar: eliminar el bloque correspondiente y hacer deploy.
   ══════════════════════════════════════════════════════════════════════ */

/* Training Mode + Training Ground — desactivados hasta validación completa */
window.nexusTrainingMode    = function() { return; };
window.n70OpenTrainingGround = function() { return; };
window._activateTrainingMode = function() { return; };

/* N82Integrity — desactivado: genera falsos positivos en mobile (cache SW)
   El cambio de cache del SW altera localStorage y dispara el alerta incorrectamente */
if (typeof N82Integrity !== 'undefined') {
  N82Integrity.verify  = function() { return true; };
  N82Integrity._onTamper = function() { return; };
}

/* N84Swipe — desactivado completamente en mobile: interfiere con sidebar y scroll
   Reactivar cuando se resuelva el conflicto con toggleSb */
if (typeof N84Swipe !== 'undefined') {
  N84Swipe.init = function() { return; };
  /* Si ya estaba inicializado, remover listeners */
  try {
    document.removeEventListener('touchstart', N84Swipe._onStart);
    document.removeEventListener('touchend',   N84Swipe._onEnd);
    document.removeEventListener('touchcancel',N84Swipe._onCancel);
  } catch(e) {}
}

/* SIDEBAR MOBILE — garantizar que #ham siempre funcione */
(function() {
  var ham = document.getElementById('ham');
  if (!ham) return;
  /* Eliminar onclick heredado y reemplazar con listener directo sin debounce conflict */
  ham.removeAttribute('onclick');
  ham.addEventListener('touchend', function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof toggleSb === 'function') toggleSb();
  }, { passive: false });
  ham.addEventListener('click', function(e) {
    e.stopPropagation();
    if (typeof toggleSb === 'function') toggleSb();
  });
})();
