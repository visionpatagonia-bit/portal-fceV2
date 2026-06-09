# NEXUS Study Cockpit — Deploy

App principal: **cockpit standalone** (motor determinista + estudio + calibración),
**PWA instalable** y **Gemini activo por default** (secreto server-side).
El Portal FCE viejo (`portal-fceV2`) queda como **fuente**, no se toca.

## Modo actual: USO INTERNO (auth desactivada)
- **Autenticación OFF**: el bloque Firebase en `public/index.html` está comentado. La app corre en
  "sesión local" sin login — full operativa para estudiar. (El código de auth/persistencia sigue
  presente; para reactivar login Google + Firestore, descomentar ese bloque y configurar dominios
  autorizados en Firebase Console. El frontend detecta solo si Firebase está disponible.)
- **Gemini activo por default**: la key vive en `data/runtime/gemini.secrets.json` (**gitignored**,
  NO se commitea). El backend la lee al arrancar. Para setearla en otra máquina/deploy:
  `data/runtime/gemini.secrets.json` con `{ "apiKey": "...", "model": "gemini-2.5-flash" }`
  (UTF-8 **sin BOM**, o el JSON.parse del server tira 500), o la env var `GEMINI_API_KEY`.

## Arquitectura (regla de oro)
- El **backend determinista** decide secuencia, scoring y contrato. El frontend NUNCA recalcula la nota.
- **Gemini** solo adapta explicaciones/ejercicios y vive **server-side** (env var). Nunca en el cliente.
- **Login OPCIONAL**: la app funciona en "sesión local" anónima; si el alumno entra con Google,
  se guarda su progreso por UID en Firestore. Sin fricción para el uso gratuito.

## Variables / config
- `GEMINI_API_KEY` (server-side, **secreto**): habilita la capa adaptativa. Sin ella, el cockpit
  funciona igual (genera práctica del contrato, sin IA).
- Firebase web config (en `public/index.html`): **NO es secreto** — es un identificador público de
  cliente. La seguridad la dan las **reglas de Firestore** + los **dominios autorizados**.

## Checklist de deploy
1. **Firebase Console → Authentication → Settings → Authorized domains**: agregar el dominio de
   producción (y `localhost` para dev). Sin esto, el login Google con popup falla.
2. **Firebase Console → Firestore → Rules**: subir `firestore.rules` (cubre `usuarios/{uid}/**` y
   `cockpit_kb/**`). El alumno solo lee/escribe lo suyo.
3. **Gemini**: setear `GEMINI_API_KEY` como env var del entorno (Vercel/host). Nunca commitearla.
4. **Servir**: el server local es `node server.js` (HTTP simple, sin deps). Para Vercel se portan los
   handlers de `server.js` a funciones serverless `api/*` (pendiente del roadmap de deploy).
5. **PWA**: `manifest.json` + `sw.js` se sirven desde la raíz (`/`). El SW cachea el shell
   (offline) y nunca cachea `/api/*` (backend autoritativo).

## PWA / iconos
- Iconos en `public/icons/*.svg` (incluye uno `maskable`). Chrome moderno instala con SVG.
- Para máxima compatibilidad (Lighthouse/Safari), generar PNG 192/512 al deployar
  (p. ej. con `sharp`/ImageMagick) y agregarlos al `manifest.json`.

## Persistencia (Firestore, por usuario)
- `usuarios/{uid}/studySessions/{sessionId}` — sesión post-corrección
- `usuarios/{uid}/attempts/{attemptId}` — intento (inmutable)
- `usuarios/{uid}/realGrades/*` — nota real para calibración (estimado vs real, ±1)
- `usuarios/{uid}/cockpit_events/*` — telemetría
