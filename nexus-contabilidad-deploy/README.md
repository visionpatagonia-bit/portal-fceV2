# NEXUS Contabilidad · Deploy a Vercel para Trucco

**Origen:** Sprint Sovereign V1 · P3 (build solo-contabilidad)
**Build hecho:** 2026-05-05 desde sandbox del programador
**Aprobado:** CTO externo (auditoría 2026-05-05)
**KB:** 173 entries (Contabilidad solamente, filtradas de las 271 originales)
**HTML:** banner naranja Anubis "Versión Contabilidad · Actualizado tras feedback de auditor académico" inyectado

## Cómo deployar

Desde PowerShell en este directorio (`nexus-contabilidad-deploy/`):

```powershell
vercel deploy --prod
```

La primera vez Vercel te va a preguntar:
- `Set up and deploy?` → `Y`
- `Which scope?` → `visionpatagonia-bit's projects`
- `Link to existing project?` → `N` (es proyecto nuevo)
- `Project name?` → `nexus-contabilidad`
- `Directory?` → `./` (Enter)

Output esperado: URL fija tipo `https://nexus-contabilidad.vercel.app` o variante.

## Cómo regenerar (si se cambia el contenido)

Desde la raíz del repo:

```powershell
node scripts/build.js                     # genera dist/ con Portal académico full
python scripts/build_trucco.py            # filtra dist/ a Contabilidad + banner
Copy-Item -Recurse -Force dist/* nexus-contabilidad-deploy/public/   # sincroniza
node scripts/build.js                     # restaura dist/ a Portal académico full
```

Después `vercel deploy --prod` desde este directorio para subir la versión nueva.

## Por qué un proyecto Vercel separado

Si se deployara desde el root del repo, Vercel correría `node scripts/build.js` (según `vercel.json` del root) y regeneraría `dist/` SIN el patch Trucco · resultado: deploy del Portal académico FULL, no de la versión filtrada.

Esta carpeta tiene su propio `vercel.json` que NO tiene `buildCommand`: Vercel sirve `public/` directamente sin re-build. Así el contenido filtrado por `build_trucco.py` queda intacto.
