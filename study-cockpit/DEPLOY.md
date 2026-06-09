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

## Subir a producción — Render (recomendado, ~5 min)

El cockpit es un **server Node con API** (`server.js`, sin dependencias), así que conviene un host que
corra el proceso directo. **Render** lo hace gratis sin tocar código.

1. Subí la rama: `git push` (ya está en `feat/study-cockpit` del repo `portal-fceV2`).
2. En **dashboard.render.com** → **New** → **Web Service** → conectá el repo `portal-fceV2`.
3. Configurá:
   - **Branch**: `feat/study-cockpit` (o `main` si lo mergeás antes)
   - **Root Directory**: `study-cockpit`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free
4. **Environment** → agregá las variables:
   - `HOST` = `0.0.0.0`  *(obligatorio: en cloud hay que bindear a todas las interfaces)*
   - `GEMINI_MODEL` = `gemini-2.5-flash`
   - `GEMINI_API_KEY` = *(tu key — se setea acá, NUNCA en el repo)*
   - `PORT` lo inyecta Render solo; `server.js` ya lo lee.
5. **Create Web Service**. Render buildea y te da una URL `https://nexus-study-cockpit.onrender.com`.

El repo trae `render.yaml` con esta misma config (para Blueprint, moviéndolo a la raíz del repo).

> **Notas**
> - El **filesystem de Render free es efímero** (se resetea en cada deploy): la telemetría
>   (`data/runtime/events.jsonl`) y la KB adaptativa se regeneran. Si querés persistirlas, agregá un
>   **Persistent Disk** montado en `data/`. Para uso interno de estudio, lo efímero alcanza.
> - Free duerme tras ~15 min de inactividad (primer request tarda ~30s en despertar).

## Otros hosts
- **Railway / Fly.io / VPS**: igual que Render — `node server.js`, setear `PORT`/`HOST`/`GEMINI_API_KEY`.
- **Vercel**: NO corre `server.js` persistente (usa funciones serverless y FS read-only). Requiere
  portar los handlers de `server.js` a `api/[...path].js` (el portal ya tiene ese patrón en
  `api/cockpit/`). Más trabajo; pedilo si querés ir por Vercel.

## PWA / iconos
- Iconos en `public/icons/*.svg` (incluye uno `maskable`). Chrome moderno instala con SVG.
- Para máxima compatibilidad (Lighthouse/Safari), generar PNG 192/512 al deployar
  (p. ej. con `sharp`/ImageMagick) y agregarlos al `manifest.json`.

## (Opcional) Reactivar login + persistencia Firestore
1. Descomentar el bloque Firebase en `public/index.html`.
2. **Firebase Console → Authentication → Authorized domains**: agregar el dominio de Render.
3. **Firebase Console → Firestore → Rules**: subir `firestore.rules` (cubre `usuarios/{uid}/**`).

## PWA / iconos
- Iconos en `public/icons/*.svg` (incluye uno `maskable`). Chrome moderno instala con SVG.
- Para máxima compatibilidad (Lighthouse/Safari), generar PNG 192/512 al deployar
  (p. ej. con `sharp`/ImageMagick) y agregarlos al `manifest.json`.

## Persistencia (Firestore, por usuario)
- `usuarios/{uid}/studySessions/{sessionId}` — sesión post-corrección
- `usuarios/{uid}/attempts/{attemptId}` — intento (inmutable)
- `usuarios/{uid}/realGrades/*` — nota real para calibración (estimado vs real, ±1)
- `usuarios/{uid}/cockpit_events/*` — telemetría
