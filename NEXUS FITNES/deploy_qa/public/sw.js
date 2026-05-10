// =====================================================================
// sw.js · Service Worker NEXUS Fitness · Sprint 1.5 Día 3.C
// =====================================================================
// Cache scoped a imágenes del catálogo extendido yuhonas.
//
// Strategy: stale-while-revalidate
//   1. Browser pide imagen
//   2. SW intenta servir desde cache (instant si ya cacheada)
//   3. SW dispara fetch en paralelo
//   4. Si fetch OK → actualiza cache para próxima petición
//   5. Si fetch falla → usuario sigue viendo versión cacheada
//
// Scope: SOLO raw.githubusercontent.com/yuhonas/free-exercise-db/*
//        Cualquier otra request pasa transparente sin tocar.
//
// Budget: 50 MB (LRU eviction · borra entries más antiguas si supera)
// =====================================================================

const CACHE_NAME = 'nx-yuhonas-images-v1';
const YUHONAS_PREFIX = 'https://raw.githubusercontent.com/yuhonas/';
const MAX_CACHE_BYTES = 50 * 1024 * 1024;  // 50 MB

self.addEventListener('install', (event) => {
  // Skip waiting · activate inmediatamente al instalar nueva versión
  self.skipWaiting();
  console.log('[SW] install · ' + CACHE_NAME);
});

self.addEventListener('activate', (event) => {
  // Tomar control de todas las pestañas inmediatamente
  // y limpiar caches viejas (versiones anteriores de v1)
  event.waitUntil((async function(){
    const keys = await caches.keys();
    const stale = keys.filter(k => k.startsWith('nx-yuhonas-images-') && k !== CACHE_NAME);
    await Promise.all(stale.map(k => caches.delete(k)));
    if(stale.length) console.log('[SW] activate · purgadas ' + stale.length + ' caches viejas');
    await self.clients.claim();
    console.log('[SW] activate · clients claimed');
  })());
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Filtro estricto · solo interceptamos GET a yuhonas
  // Cualquier otra request pasa al network sin tocar (transparente).
  if(event.request.method !== 'GET') return;
  if(!url.startsWith(YUHONAS_PREFIX)) return;

  event.respondWith(staleWhileRevalidate(event.request));
});

async function staleWhileRevalidate(request){
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Disparamos el fetch en paralelo (no esperamos)
  const fetchPromise = fetch(request).then(async (response) => {
    // Solo cacheamos respuestas válidas (200 + content-type imagen)
    if(response && response.ok && response.status === 200){
      const ct = response.headers.get('content-type') || '';
      if(ct.startsWith('image/')){
        try {
          await cache.put(request, response.clone());
          // Best-effort budget enforcement (LRU eviction)
          enforceBudget(cache).catch(() => {});
        } catch(e){
          // SW cache.put puede fallar por opacidad CORS · degradar gracefully
        }
      }
    }
    return response;
  }).catch(() => {
    // Network failure · si tenemos cache, lo retornamos abajo
    return null;
  });

  // Si tenemos cache · servir cache + revalidar en background (stale-while-revalidate)
  if(cached){
    fetchPromise.catch(() => {});  // detach del flujo principal
    return cached;
  }

  // Sin cache · esperar al fetch
  const networkResponse = await fetchPromise;
  if(networkResponse) return networkResponse;

  // Network fall y sin cache · 504
  return new Response('SW: imagen no disponible offline', {
    status: 504,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// LRU eviction · best-effort budget
// Estimación: cada response ~30 KB promedio · 50 MB = ~1700 imágenes
// Si excede, borra ~10% más antigues (por orden de keys del cache).
async function enforceBudget(cache){
  const reqs = await cache.keys();
  if(reqs.length < 1700) return;  // bajo budget estimado

  const overflow = Math.ceil(reqs.length * 0.1);  // borra 10%
  const toDelete = reqs.slice(0, overflow);
  await Promise.all(toDelete.map(r => cache.delete(r)));
  console.log('[SW] enforceBudget · purgadas ' + toDelete.length + ' entries (' + reqs.length + ' totales)');
}

// API de mensajes para diagnóstico desde la página
self.addEventListener('message', async (event) => {
  if(!event.data || !event.data.type) return;

  if(event.data.type === 'NX_SW_PING'){
    event.source.postMessage({ type: 'NX_SW_PONG', cacheName: CACHE_NAME, version: 1 });
    return;
  }

  if(event.data.type === 'NX_SW_STATS'){
    try {
      const cache = await caches.open(CACHE_NAME);
      const reqs = await cache.keys();
      event.source.postMessage({
        type: 'NX_SW_STATS_RESULT',
        cacheName: CACHE_NAME,
        entries: reqs.length,
        urls_sample: reqs.slice(0, 5).map(r => r.url),
      });
    } catch(e){
      event.source.postMessage({ type: 'NX_SW_STATS_RESULT', error: e.message });
    }
    return;
  }

  if(event.data.type === 'NX_SW_PURGE'){
    try {
      const ok = await caches.delete(CACHE_NAME);
      event.source.postMessage({ type: 'NX_SW_PURGE_RESULT', deleted: ok });
    } catch(e){
      event.source.postMessage({ type: 'NX_SW_PURGE_RESULT', error: e.message });
    }
    return;
  }
});
