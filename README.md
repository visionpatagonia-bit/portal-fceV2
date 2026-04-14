# NEXUS — Portal FCE 2026

**Portal de aprendizaje adaptativo** · FCE UNPSJB · Ciclo Inicial 2026

Sistema inteligente que adapta el contenido y la UI según el rendimiento del alumno en tiempo real. Desarrollado para la Facultad de Ciencias Económicas de la Universidad Nacional de la Patagonia San Juan Bosco, sede Trelew.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Vanilla JS (ES5/ES6), HTML5, CSS3 |
| Auth | Firebase Authentication |
| Base de datos | Firebase Firestore |
| Contenido | `materiales.json` (estático, ~760 KB) |
| PWA | Service Worker (offline-first) |
| Dev server | Vite 5 (servidor estático, sin bundling) |
| Deploy | Vercel (sitio estático) |

---

## Arquitectura del sistema

```
NEXUS v19.3.2
├── Motor adaptativo      nexus-adaptive-engine.js   spaced repetition, streaks
├── Capa de inteligencia  nexus-intelligence.js       tracking de respuestas
├── UI adaptativa         nexus-adaptive-ui.js        niveles low/mid/high
├── Design System         nexus-ui-system.css         tokens de color, componentes
├── Estado global         nexus-core.js               store reactivo + scheduler
├── Contenido             nexus-fetch.js              carga materiales.json
├── Quiz                  nexus-quiz.js               motor q55
├── Prefetch              nexus-prefetch.js           carga predictiva
└── Portal principal      portal.js                   SPA, render pipeline
```

### Sistema de colores

Dos sistemas separados, no intercambiables:

- **Contextual** (`--fce-*`): identidad visual por materia (Contabilidad, Admin, etc.)
- **Semántico** (`--color-ok/err/warn`): feedback de quiz y estados de UI

### Niveles adaptativos de UI

| Nivel | Trigger | Efecto |
|-------|---------|--------|
| `low` | accuracy < 40% ó 3 incorrectas seguidas | Más andamios visuales, acordeones abiertos |
| `mid` | comportamiento base | Sin cambios |
| `high` | accuracy ≥ 78% + streak ≥ 4 + total ≥ 10 | UI compacta, sin ayudas visuales |

---

## Correr localmente

### Requisitos
- Node.js ≥ 18
- npm ≥ 9

### Instalación

```bash
git clone https://github.com/TU-ORG/nexus-portal-fce.git
cd nexus-portal-fce
npm install
```

### Desarrollo

```bash
npm run dev
# → http://localhost:3000
```

El servidor Vite sirve los archivos con live-reload. El Service Worker se registra correctamente gracias al header `Service-Worker-Allowed: /` configurado en `vite.config.js`.

### Build para producción

```bash
npm run build
# → genera dist/ con los archivos de la app (sin backups ni scripts de dev)
```

### Preview del build

```bash
npm run preview
# → http://localhost:4173
```

---

## Deploy en Vercel

### Un click (recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Importar el repositorio en Vercel
2. Vercel detecta `vercel.json` automáticamente
3. Build command: `node scripts/build.js`
4. Output directory: `dist`
5. Deploy ✓

### CLI

```bash
npm i -g vercel
vercel --prod
```

### Variables de entorno

No se requieren variables de entorno. La configuración de Firebase está en `index.html` (es pública por diseño — las claves de Firebase no son secretas, la seguridad se maneja en `firestore.rules`).

---

## Estructura del repo

```
nexus-portal-fce/
├── index.html                  # SPA principal
├── portal.js                   # Motor de la app (~760 KB, monolítico por diseño)
├── nexus-*.js                  # Módulos del sistema NEXUS
├── nexus-ui-system.css         # Design System completo
├── nexus-contrast-tokens.css   # Tokens de accesibilidad (WCAG AA)
├── nexus-legibility.css        # Estilos de legibilidad
├── materiales.json             # Contenido académico (~760 KB)
├── glossary.json               # Glosario de términos
├── comparativa.json            # Datos de comparativa global
├── noticias.json               # Feed de novedades
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker (offline-first)
├── scripts/
│   └── build.js                # Script de build (copia a dist/)
├── vite.config.js              # Configuración del servidor de desarrollo
├── vercel.json                 # Configuración de deploy
└── package.json
```

---

## Notas técnicas

**¿Por qué no Vite build?**
`portal.js` carga otros scripts mediante `<script src="...">` (no ESM imports). Vite build procesaría el HTML y hashearía los filenames, rompiendo las referencias estáticas del Service Worker (`SHELL_FILES` en `sw.js`). El script `scripts/build.js` copia archivos 1:1 sin transformar.

**¿Por qué vanilla JS y no React/Vue?**
El proyecto evolucionó desde un sistema legacy. La arquitectura modular actual (`nexus-*.js`) cumple el rol de un sistema de componentes sin el overhead de un framework. Una migración a React es posible en el futuro.

**PWA offline-first**
El Service Worker cachea el shell (HTML, JS, CSS) y sirve `materiales.json` con estrategia network-first para que el contenido siempre esté actualizado.

---

## Comandos útiles de debug (browser console)

```js
nexusAdaptiveDebug()                // Estado del sistema adaptativo
NexusAdaptiveUI.applyLevel('low')   // Forzar nivel UI bajo
NexusAdaptiveUI.applyLevel('high')  // Forzar nivel UI alto
NexusAdaptiveUI.applyLevel('mid')   // Restaurar nivel base
nexusGetUILevel({ accuracy: 0.85, streakCorrect: 5, streakIncorrect: 0, total: 15, avgTime: 4000 })
nexusColorReport()                  // Tokens de color activos
```

---

## Licencia

Uso interno · FCE UNPSJB · 2026
