/* ═══════════════════════════════════════════════════════════════════════
   NEXUS MODULES  ·  Portal FCE 2026  ·  v9.3.4
   ───────────────────────────────────────────────────────────────────────
   ARQUITECTURA:
   Separamos la UI en dos capas con contratos explícitos:

   ┌─────────────────────────────────────────────────────────────┐
   │  NexusViewer  (DETERMINISTA)                                │
   │  Renderiza cuerpo HTML de materiales.json.                  │
   │  Sin IA, sin red, sin efectos colaterales.                  │
   │  El Director puede estudiar aunque Firebase esté caído.     │
   └─────────────────────────────────────────────────────────────┘
         ↕  interface NexusModule (enchufar/desenchufar)
   ┌─────────────────────────────────────────────────────────────┐
   │  NexusTraining  (PLUGGABLE)                                 │
   │  Módulos inteligentes: quiz, flashcards, IA, predictor.     │
   │  Cada módulo declara { id, matchers, mount, unmount }.      │
   │  Se registran con NexusModules.register(modDef).            │
   │  Fallar uno NO rompe el visor.                              │
   └─────────────────────────────────────────────────────────────┘

   CONTRATO NexusModule:
   {
     id:        string            — identificador único
     label:     string            — nombre visible en la pestaña
     icon:      string            — emoji / texto corto
     matches:   (item) => bool    — ¿este módulo aplica a este item?
     mount:     (container, item, context) => void
     unmount:   (container) => void   — limpiar timers/listeners
   }
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── Adaptador v9 → v10 ─────────────────────────────────────────────── */
// Permite que los módulos consuman cualquier item (legacy v9 o nuevo v10)
// con una interfaz uniforme. No modifica el item original.
function adaptToV10(item) {
  if (item && item.v10) return item.v10;
  return {
    id:         item.id          || '',
    titulo:     item.titulo      || '',
    definicion: item.descripcion || '',
    ejemplo:    '',
    relaciones: Array.isArray(item.relacionado)
                  ? item.relacionado
                  : (item.relacionado ? [item.relacionado] : []),
    nivel:      'basico'
  };
}
window.adaptToV10 = adaptToV10;

/* ── Utilidades internas ────────────────────────────────────────────── */
function _esc(s) {
  if (!s && s !== 0) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── NexusViewer — renderizador determinista ────────────────────────── */
var NexusViewer = (function() {

  /**
   * render(container, item)
   * Inyecta el cuerpo del item en container.
   * Solo lee item.cuerpo / item.cuerpoTipo. Sin side effects.
   */
  function render(container, item) {
    if (!container || !item) return;
    container.innerHTML = '';

    if (!item.cuerpo || !item.cuerpoTipo) {
      container.innerHTML = '<p class="mc-fallback">Contenido no disponible.</p>';
      return;
    }

    if (item.cuerpoTipo === 'html') {
      // Contenido HTML pre-armado en materiales.json
      var well = document.createElement('div');
      well.className = 'mc-well';
      well.innerHTML = item.cuerpo;
      container.appendChild(well);
      return;
    }

    if (item.cuerpoTipo === 'text') {
      var well2 = document.createElement('div');
      well2.className = 'mc-well text-viewer';
      var p = document.createElement('p');
      p.textContent = item.cuerpo;
      well2.appendChild(p);
      container.appendChild(well2);
      return;
    }

    // Tipo desconocido — fallback seguro
    container.innerHTML = '<p class="mc-fallback">Tipo de cuerpo no reconocido: ' + _esc(item.cuerpoTipo) + '</p>';
  }

  /**
   * clear(container)
   * Limpia el visor sin efectos colaterales.
   */
  function clear(container) {
    if (container) container.innerHTML = '';
  }

  return { render: render, clear: clear };
})();

window.NexusViewer = NexusViewer;


/* ── NexusModules — registro y ciclo de vida de módulos ─────────────── */
var NexusModules = (function() {

  var _registry = {};       // id → modDef
  var _mounted  = {};       // containerId → { modId, container }
  var _activeItem = null;

  /**
   * register(modDef)
   * Registra un módulo entrenador.
   * No falla si el módulo ya existe (idempotente).
   */
  function register(modDef) {
    if (!modDef || !modDef.id) {
      console.warn('[NexusModules] register() sin id:', modDef);
      return;
    }
    if (_registry[modDef.id]) {
      console.info('[NexusModules] módulo ya registrado, sobreescribiendo:', modDef.id);
    }
    _registry[modDef.id] = modDef;
    console.info('[NexusModules] ✓ registrado:', modDef.id);
  }

  /**
   * getApplicable(item)
   * Devuelve los módulos que matches(item) === true.
   */
  function getApplicable(item) {
    return Object.values(_registry).filter(function(m) {
      try { return m.matches && m.matches(item); }
      catch(e) { return false; }
    });
  }

  /**
   * mountAll(item, tabsContainer, bodyContainer)
   * Genera las pestañas de entrenamiento para el item activo.
   * Pestaña 0 = Contenido (NexusViewer) — siempre presente.
   */
  function mountAll(item, tabsContainer, bodyContainer) {
    // Desmontar todo lo anterior
    unmountAll(bodyContainer);
    _activeItem = item;

    if (!tabsContainer || !bodyContainer) return;
    tabsContainer.innerHTML = '';
    bodyContainer.innerHTML = '';

    var modules = getApplicable(item);
    var allTabs = [{ id: '_viewer', label: 'Contenido', icon: '📖' }].concat(modules);

    allTabs.forEach(function(m, idx) {
      var btn = document.createElement('button');
      btn.className = 'nexus-mod-tab t-tab' + (idx === 0 ? ' t-tab-active' : '');
      btn.textContent = (m.icon ? m.icon + ' ' : '') + m.label;
      btn.dataset.modId = m.id;
      btn.addEventListener('click', function() {
        _activateTab(m.id, item, tabsContainer, bodyContainer);
      });
      tabsContainer.appendChild(btn);
    });

    // Mostrar visor por defecto
    _activateTab('_viewer', item, tabsContainer, bodyContainer);
  }

  function _activateTab(modId, item, tabsContainer, bodyContainer) {
    // Marcar tab activa
    Array.from(tabsContainer.querySelectorAll('.nexus-mod-tab')).forEach(function(b) {
      b.classList.toggle('t-tab-active', b.dataset.modId === modId);
    });

    // Desmontar módulo anterior si había uno
    var prev = _mounted['body'];
    if (prev && prev.modId !== '_viewer' && prev.modId !== modId) {
      var prevDef = _registry[prev.modId];
      if (prevDef && prevDef.unmount) {
        try { prevDef.unmount(bodyContainer); } catch(e) {}
      }
    }

    bodyContainer.innerHTML = '';

    if (modId === '_viewer') {
      NexusViewer.render(bodyContainer, item);
      _mounted['body'] = { modId: '_viewer' };
      return;
    }

    var modDef = _registry[modId];
    if (!modDef) return;

    _mounted['body'] = { modId: modId };

    try {
      modDef.mount(bodyContainer, item, {
        item: item,
        esc: _esc,
        // contexto seguro que el módulo puede usar
        getState: function() { return window.NEXUS_STATE || {}; }
      });
    } catch(e) {
      console.error('[NexusModules] Error en mount de', modId, e);
      bodyContainer.innerHTML =
        '<p class="mc-fallback">Error al cargar módulo: ' + _esc(modId) + '</p>';
    }
  }

  function unmountAll(bodyContainer) {
    var prev = _mounted['body'];
    if (prev && prev.modId && prev.modId !== '_viewer') {
      var modDef = _registry[prev.modId];
      if (modDef && modDef.unmount && bodyContainer) {
        try { modDef.unmount(bodyContainer); } catch(e) {}
      }
    }
    _mounted = {};
    _activeItem = null;
  }

  function list() {
    return Object.keys(_registry);
  }

  return {
    register:      register,
    getApplicable: getApplicable,
    mountAll:      mountAll,
    unmountAll:    unmountAll,
    list:          list
  };
})();

window.NexusModules = NexusModules;


/* ════════════════════════════════════════════════════════════════════════
   MÓDULOS BUILT-IN — se auto-registran al cargar este archivo
   ════════════════════════════════════════════════════════════════════════ */

/* ── Módulo: Quiz adaptativo (wraps N88CognitiveEngine / N79QuizWorker) ── */
NexusModules.register({
  id:    'quiz',
  label: 'Quiz',
  icon:  '🎯',

  matches: function(item) {
    // Aplica a cualquier item que tenga nexus_group definido
    return !!(item && item.nexus_group);
  },

  mount: function(container, item, ctx) {
    // Intentar usar el motor de quiz existente si está disponible
    var materia   = item.materia   || '';
    var agrupador = item.agrupador || '';

    // Si N88CognitiveEngine está disponible, delegamos
    if (window.N88CognitiveEngine && N88CognitiveEngine.renderQuiz) {
      try {
        N88CognitiveEngine.renderQuiz(container, materia, agrupador, item);
        return;
      } catch(e) {
        console.warn('[quiz module] N88CognitiveEngine falló, fallback a N79', e);
      }
    }

    // Fallback: N79QuizWorker
    if (window.N79QuizWorker && N79QuizWorker.buildQuiz) {
      try {
        N79QuizWorker.buildQuiz(container, materia, agrupador);
        return;
      } catch(e) {
        console.warn('[quiz module] N79QuizWorker falló', e);
      }
    }

    // Fallback final
    container.innerHTML =
      '<p class="mc-fallback" style="padding:16px 0">' +
      'Quiz disponible próximamente para este módulo.</p>';
  },

  unmount: function(container) {
    // Limpiar cualquier timer activo que los motores hayan dejado
    if (window.N79QuizWorker && N79QuizWorker.cleanup) {
      try { N79QuizWorker.cleanup(); } catch(e) {}
    }
    container.innerHTML = '';
  }
});


/* ── Módulo: Flashcards (wraps N88CognitiveEngine) ─────────────────── */
NexusModules.register({
  id:    'flashcards',
  label: 'Flashcards',
  icon:  '🃏',

  matches: function(item) {
    return !!(item && item.nexus_group);
  },

  mount: function(container, item, ctx) {
    var materia   = item.materia   || '';
    var agrupador = item.agrupador || '';

    if (window.N88CognitiveEngine && N88CognitiveEngine.renderFlash) {
      try {
        N88CognitiveEngine.renderFlash(container, materia, agrupador, item);
        return;
      } catch(e) {
        console.warn('[flashcards module] N88CognitiveEngine falló', e);
      }
    }

    container.innerHTML =
      '<p class="mc-fallback" style="padding:16px 0">' +
      'Flashcards próximamente para este módulo.</p>';
  },

  unmount: function(container) {
    container.innerHTML = '';
  }
});


/* ── Módulo: Trampas de Parcial ─────────────────────────────────────── */
NexusModules.register({
  id:    'trampas',
  label: 'Trampas',
  icon:  '⚠️',

  matches: function(item) {
    // Solo para materias con banco de trampas
    return !!(item && (item.materia === 'Contabilidad' ||
                       item.materia === 'Administración' ||
                       item.materia === 'Propedéutica'));
  },

  mount: function(container, item, ctx) {
    if (window.N84Trampas && N84Trampas.render) {
      try {
        N84Trampas.render(container, item.materia, item.agrupador);
        return;
      } catch(e) {
        console.warn('[trampas module] N84Trampas falló', e);
      }
    }

    // Fallback: mostrar banco estático si está disponible
    var banco = window.TRAMPAS_BANCO || [];
    var items = banco.filter(function(t) {
      return !item.materia || t.materia === item.materia;
    }).slice(0, 5);

    if (!items.length) {
      container.innerHTML =
        '<p class="mc-fallback" style="padding:16px 0">Sin trampas registradas para este módulo.</p>';
      return;
    }

    var html = '<div class="training-section">';
    items.forEach(function(t) {
      html += '<div class="sub-item" style="margin-bottom:10px">' +
        '<div class="sub-tag">⚠️ TRAMPA</div>' +
        '<p style="margin:0;font-size:.84rem">' + _esc(t.trampa || t.texto) + '</p>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  },

  unmount: function(container) {
    container.innerHTML = '';
  }
});


/* ── Módulo: Preguntar a la IA (N88 / Anthropic API) ───────────────── */
NexusModules.register({
  id:    'ia',
  label: 'Preguntar a la IA',
  icon:  '🤖',

  matches: function(item) {
    // Siempre disponible cuando hay conexión (lo evalúa mount)
    return !!(item && item.nexus_group);
  },

  mount: function(container, item, ctx) {
    // Verificar si N86HypoLab o N88CognitiveEngine tienen modo chat
    if (window.N86HypoLab && N86HypoLab.mountChat) {
      try {
        N86HypoLab.mountChat(container, item);
        return;
      } catch(e) {
        console.warn('[ia module] N86HypoLab.mountChat falló', e);
      }
    }

    // Fallback mínimo: input + fetch a Anthropic API
    container.innerHTML = _buildIAFallback(item);
    var btn = container.querySelector('.nexus-ia-btn');
    var inp = container.querySelector('.nexus-ia-input');
    var out = container.querySelector('.nexus-ia-out');
    if (!btn || !inp || !out) return;

    btn.addEventListener('click', function() {
      var pregunta = inp.value.trim();
      if (!pregunta) return;
      _callIA(pregunta, item, out);
    });
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); btn.click(); }
    });
  },

  unmount: function(container) {
    container.innerHTML = '';
  }
});

function _buildIAFallback(item) {
  var ctx = item ? (item.titulo || item.materia || '') : '';
  return '<div class="training-section" style="padding:8px 0">' +
    '<p style="font-family:\'DM Mono\',monospace;font-size:.65rem;color:var(--on-surface-muted);margin-bottom:10px">' +
    'Preguntá sobre: <strong>' + _esc(ctx) + '</strong></p>' +
    '<textarea class="nexus-ia-input fce-search-input" rows="3" ' +
    'placeholder="¿Qué diferencia hay entre variación permutativa y modificativa?" ' +
    'style="width:100%;resize:vertical;margin-bottom:8px;border-radius:6px;padding:8px 12px;font-family:\'Fraunces\',serif;font-size:.85rem"></textarea>' +
    '<button class="nexus-ia-btn" style="background:var(--accent-cont);color:#fff;border:none;border-radius:5px;padding:8px 18px;' +
    'font-family:\'DM Mono\',monospace;font-size:.68rem;font-weight:700;cursor:pointer;letter-spacing:.04em">PREGUNTAR</button>' +
    '<div class="nexus-ia-out mc-well" style="margin-top:12px;min-height:0;display:none"></div>' +
    '</div>';
}

function _callIA(pregunta, item, outEl) {
  outEl.style.display = 'block';
  outEl.innerHTML = '<span style="color:var(--on-surface-muted);font-size:.8rem">Consultando…</span>';

  var systemPrompt = 'Sos un tutor de la Facultad de Ciencias Económicas de la UNPSJB Trelew. ' +
    'Respondé en español rioplatense, de forma clara y concisa. ' +
    'Contexto del tema: ' + (item ? (item.titulo || item.materia) : '') + '.';

  // Timeout de 10s — evita que el módulo quede colgado en aula sin red
  var controller = new AbortController();
  var timeoutId  = setTimeout(function() { controller.abort(); }, 10000);

  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: controller.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: pregunta }]
    })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    clearTimeout(timeoutId);
    var text = (data.content && data.content[0] && data.content[0].text) || '';
    if (!text && data.error) text = 'Error: ' + (data.error.message || JSON.stringify(data.error));
    outEl.innerHTML = '<div style="white-space:pre-wrap;font-size:.84rem;color:var(--on-surface-medium)">' +
      _esc(text) + '</div>';
  })
  .catch(function(e) {
    clearTimeout(timeoutId);
    var msg = (e && e.name === 'AbortError')
      ? 'Sin respuesta en 10 segundos. Revisá la red e intentá de nuevo.'
      : 'Sin conexión. Revisá la red e intentá de nuevo.';
    outEl.innerHTML = '<span style="color:var(--accent-prop);font-size:.8rem">' + msg + '</span>';
  });
}


/* ════════════════════════════════════════════════════════════════════════
   API PÚBLICA DE CONVENIENCIA
   Permite a portal.js abrir un item con la nueva arquitectura:

     NexusViewer.render(container, item)   → solo visor
     NexusModules.mountAll(item, tabs, body) → visor + pestañas
   ════════════════════════════════════════════════════════════════════════ */


/* ════════════════════════════════════════════════════════════════════════
   NEXUS VIRTUAL LIST  ·  Fase 11  ·  v11.0.0
   ════════════════════════════════════════════════════════════════════════
   Virtualización de listas para escalar a 1000+ materiales.
   Solo renderiza los items visibles en el viewport + BUFFER.
   DOM constante (~30 nodos) independientemente del total.

   CONTRATO:
     NexusVirtualList.init(container, items, renderItemFn)
     NexusVirtualList.update(items)
     NexusVirtualList.destroy()
   ════════════════════════════════════════════════════════════════════════ */

window.NexusVirtualList = (function() {
  'use strict';

  var ITEM_HEIGHT    = 72;    // altura estimada por item (px)
  var VISIBLE_COUNT  = 20;    // items visibles simultáneamente
  var BUFFER         = 5;     // items extra arriba y abajo (pre-render)

  var _container   = null;
  var _inner       = null;
  var _items       = [];
  var _renderFn    = null;
  var _scrollRAF   = null;

  function init(container, items, renderItemFn) {
    if (!container || typeof renderItemFn !== 'function') return;
    _container = container;
    _items     = items || [];
    _renderFn  = renderItemFn;

    // Setup DOM: contenedor con altura total virtual
    _container.style.overflow    = 'auto';
    _container.style.position    = 'relative';
    _container.style.willChange  = 'transform';   // hint GPU

    _inner = document.createElement('div');
    _inner.style.position = 'relative';
    _inner.style.width    = '100%';
    _container.appendChild(_inner);

    _container.addEventListener('scroll', _onScroll);
    _render();
  }

  function update(items) {
    _items = items || [];
    _render();
  }

  function destroy() {
    if (_container) _container.removeEventListener('scroll', _onScroll);
    _container = null;
    _inner     = null;
    _items     = [];
    _renderFn  = null;
  }

  function _onScroll() {
    if (_scrollRAF) return;
    _scrollRAF = requestAnimationFrame(function() {
      _scrollRAF = null;
      _render();
      /* Notificar NexusCore para suscriptores de scroll */
      if (window.NexusCore) {
        NexusCore.set('ui:list', { scrollTop: _container.scrollTop });
      }
    });
  }

  function _render() {
    if (!_container || !_inner || !_renderFn) return;

    var scrollTop   = _container.scrollTop;
    var totalHeight = _items.length * ITEM_HEIGHT;

    // Altura total virtual — permite scroll nativo
    _inner.style.height = totalHeight + 'px';

    var startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
    var endIdx   = Math.min(_items.length, startIdx + VISIBLE_COUNT + BUFFER * 2);
    var visible  = _items.slice(startIdx, endIdx);

    /* Offset: los items visibles están desplazados al position correcto */
    var offsetY  = startIdx * ITEM_HEIGHT;

    /* Limpiar y re-renderizar solo los visibles */
    var frag = document.createDocumentFragment();
    visible.forEach(function(item, i) {
      /* Usar NexusItemCache si está disponible */
      var wrapper = document.createElement('div');
      wrapper.style.cssText = [
        'position:absolute',
        'top:' + (offsetY + i * ITEM_HEIGHT) + 'px',
        'left:0',
        'width:100%',
        'height:' + ITEM_HEIGHT + 'px'
      ].join(';');

      var useCache = window.NexusItemCache && !NexusItemCache.hasChanged(item);
      if (!useCache) {
        wrapper.innerHTML = _renderFn(item);
      }
      frag.appendChild(wrapper);
    });

    /* Reemplazar contenido visible con un solo reflow */
    while (_inner.firstChild) _inner.removeChild(_inner.firstChild);
    _inner.appendChild(frag);
  }

  return { init: init, update: update, destroy: destroy };
})();

console.info('[NEXUS v11.0.0] nexus-modules.js cargado. Módulos:', NexusModules.list(), '| NexusVirtualList listo.');
