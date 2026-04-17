// ═══════════════════════════════════════════════════════════════
//  SERVICE WORKER  ·  Portal FCE 2026
//  Estrategia: Network-first para materiales.json (siempre fresco)
//              Cache-first para el resto (offline)
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'fce-portal-v19.27.4'; /* bump — PATCH 10.4: next class pre-computed (cierre capa temporal) */
const FONT_CACHE = 'fce-fonts-v13.2.5';

const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './nexus-contrast-tokens.css',   /* v13.2.5: token system centralizado */
  './nexus-ui-system.css',         /* v13.3.0: UI System — jerarquía + componentes */
  './nexus-ui-addons.js',          /* v13.3.0: back-to-top + TOC scroll spy */
  './nexus-fetch.js',              /* v13.2.5: NexusFetch — fetch de materiales */
  './nexus-core.js',               /* v13.2.5: estado global NEXUS_STATE + getMateriales */
  './nexus-quiz.js',               /* v13.2.5: motor q55 extraído de portal.js */
  './nexus-modules.js',            /* v13.2.5: NexusViewer + NexusModules + módulos */
  /* v9.0: JSONs externos cacheados para modo offline en la Patagonia */
  './glossary.json',
  './comparativa.json',
  './noticias.json'
];
/* NOTA: materiales.json sigue siendo network-first por diseño —
   permite actualizar el contenido sin reinstalar la PWA. */

// ── INSTALL ─────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('NEXUS v13.2.5 — cacheando shell');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_FILES))
      .then(() => {
        console.log('NEXUS v9.3.4 READY — contrast tokens + módulos cargados');
        return self.skipWaiting();
      })
      .catch(err => console.error('[FCE SW] Error en install:', err))
  );
});

// ── ACTIVATE ────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[FCE SW] Activate v19.20.0 — limpiando caches y recargando clientes');
  self.skipWaiting();
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== FONT_CACHE)
          .map(k => {
            console.log('[FCE SW] Eliminando cache viejo:', k);
            return caches.delete(k);
          })
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        /* Forzar recarga en TODOS los tabs abiertos del portal */
        clients.forEach(client => {
          console.log('[FCE SW] Recargando cliente:', client.url);
          client.navigate(client.url);
        });
      })
  );
});

// ── FETCH ────────────────────────────────────────────────────────
// Estrategia v19.3.2:
//   NETWORK-FIRST → archivos críticos que cambian con cada deploy
//   CACHE-FIRST   → fuentes + JSONs estáticos (rendimiento)
//   NO-STORE      → materiales.json (siempre fresco)

const NETWORK_FIRST = [
  'index.html', 'portal.js',
  'nexus-ui-system.css', 'nexus-contrast-tokens.css',
  'nexus-adaptive-ui.js', 'nexus-core.js', 'nexus-modules.js',
  'nexus-quiz.js', 'nexus-ui-addons.js', 'nexus-fetch.js',
  'nexus-adaptive-engine.js', 'nexus-intelligence.js',
  'nexus-exam.js', 'nexus-scheduler.js', 'nexus-prefetch.js',
  'nexus-legibility.css', 'sw.js',
  'nexus-ai.js', 'nexus-ai-config.json'
];

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // Fuentes Google → cache-first (no cambian)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(res => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // materiales.json → SIEMPRE red, sin caché
  if (url.pathname.endsWith('materiales.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // horarios.json → SIEMPRE red, sin caché (PATCH 10 — schedule updates sin redeploy)
  if (url.pathname.endsWith('horarios.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Archivos críticos del portal → NETWORK-FIRST
  // Si la red falla (offline) usa caché como fallback
  const filename = url.pathname.split('/').pop();
  if (NETWORK_FIRST.some(f => url.pathname.endsWith(f))) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then(res => {
          if (res.ok) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request)
          .then(cached => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // JSONs estáticos + resto → cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
