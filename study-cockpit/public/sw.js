// NEXUS Study Cockpit — Service Worker
// Estrategia:
//   /api/*          → SOLO red (backend autoritativo + Gemini; nunca se cachea la nota)
//   Google Fonts    → cache-first (no cambian)
//   Firebase SDK    → cross-origin, no se intercepta (offline = sesion local)
//   resto same-origin → network-first con fallback a cache (offline del shell)

const CACHE = 'nexus-cockpit-v2';
// API de SOLO LECTURA de estudio: se cachea para poder ESTUDIAR offline lo ya visto. El resto de
// /api (score, ask, analytics, health, attempts) NUNCA se cachea (backend autoritativo).
const STUDY_READ = ['/api/subjects', '/api/study/plan', '/api/study/block'];
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
  '/styles/tokens.css',
  '/styles/base.css',
  '/styles/app.css',
  '/src/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // API: por defecto NO se cachea (el backend manda y la nota no se congela). Excepcion: la lectura
  // de estudio (materias/plan/bloque/contrato) se cachea network-first -> offline sirve lo ya visto.
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    const cacheable = STUDY_READ.indexOf(url.pathname) >= 0 || /^\/api\/subjects\/[^/]+\/contract$/.test(url.pathname);
    if (!cacheable) return;
    event.respondWith(
      fetch(req)
        .then((res) => { if (res && res.ok) { const clone = res.clone(); caches.open(CACHE).then((c) => c.put(req, clone)); } return res; })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Google Fonts: cache-first.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req).then((hit) =>
          hit || fetch(req).then((res) => { if (res && res.ok) c.put(req, res.clone()); return res; })
        )
      )
    );
    return;
  }

  // Cross-origin (Firebase SDK de gstatic, etc.): dejar pasar sin interceptar.
  if (url.origin !== self.location.origin) return;

  // Same-origin (shell): network-first con fallback a cache.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) =>
          hit || (req.mode === 'navigate' ? caches.match('/index.html') : undefined)
        )
      )
  );
});
