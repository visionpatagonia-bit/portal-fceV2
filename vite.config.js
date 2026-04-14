// vite.config.js — NEXUS Portal FCE 2026
// Rol: servidor de desarrollo estático con headers correctos para PWA/SW.
// Este proyecto es vanilla JS sin módulos ES — Vite NO bundlea nada,
// solo sirve archivos estáticos con live-reload.
// El build real se hace con: node scripts/build.js

export default {
  // Raíz del proyecto = directorio actual
  root: '.',

  server: {
    port: 3000,
    strictPort: true,
    open: true,
    cors: true,
    // Headers requeridos para que el Service Worker pueda registrarse
    // con scope '/' (equivalente al header que envía serve.py)
    headers: {
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache'
    }
  },

  preview: {
    port: 4173,
    strictPort: true,
    headers: {
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache'
    }
  },

  // Optimización: no transformar assets — son JS vanilla,
  // cualquier transformación rompería referencias del SW y rutas internas
  optimizeDeps: {
    disabled: true
  },

  // En build mode: no procesar el HTML (lo hace scripts/build.js)
  // Este bloque existe solo como documentación — build real: node scripts/build.js
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}
