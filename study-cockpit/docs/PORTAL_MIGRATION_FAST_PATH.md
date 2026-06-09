# NEXUS Study Cockpit - migracion rapida al portal

Fecha: 2026-06-07

## Objetivo

Permitir que el Portal FCE consuma el Study Cockpit sin volver al error anterior: frontend monolitico reimplementando scoring, display o logica adaptativa.

## Regla tecnica

El portal solo debe ser cliente. El backend del cockpit decide:

- contratos de examen
- scoring
- secuencia adaptativa
- contenido generado/reutilizado desde KB
- telemetria y calibracion
- llamadas Gemini

El portal no debe guardar ni ejecutar la API key de Gemini en el navegador.

## Estado actual listo para prueba

Backend local:

```txt
SOVERINGBACKEND/
```

URL de prueba:

```txt
http://127.0.0.1:8788/
```

Flujos incluidos:

- Contabilidad 2P
- Administracion 2P
- estudio guiado
- evaluacion
- devolucion
- Gemini backend-only
- KB adaptativa reutilizable

## Fast path para el portal

### Fase 1 - prueba operativa local

Usar `SOVERINGBACKEND` como app independiente. Es la opcion de menor riesgo para estudiar este fin de semana.

Comando:

```powershell
cd SOVERINGBACKEND
npm install
npm start
```

Abrir:

```txt
http://127.0.0.1:8788/
```

Para celular/tablet en la misma red:

```powershell
.\start-mobile.ps1
```

### Fase 2 - portal como launcher

Agregar en el Portal FCE un acceso visible:

```txt
Study Cockpit
```

Ese acceso abre el backend del cockpit. No copia la logica al portal.

En local:

```txt
http://127.0.0.1:8788/
```

En red local:

```txt
http://IP-DE-TU-PC:8788/
```

En produccion:

```txt
https://api-cockpit.tu-dominio.com/
```

### Fase 3 - backend publicado

Opciones validas:

1. Vercel Functions para endpoints pequenos.
2. Render/Railway/Fly.io para conservar Express completo.
3. VPS simple con Node si se quiere control total.

Para este MVP, la opcion mas rapida y limpia es publicar `SOVERINGBACKEND` como servicio Node separado y dejar Vercel/GitHub solo para el portal frontend.

## Lo que no conviene hacer

- No incrustar la API key en `index.html`.
- No copiar `server.js` dentro del HTML del portal.
- No duplicar scoring en `portal.js`.
- No usar Gemini como juez final sin contrato determinista.
- No convertir la KB en contenido canonico sin auditoria.

## Integracion futura

Contrato de integracion recomendado:

```txt
GET  /api/health
GET  /api/subjects
POST /api/study/adaptive-sequence
POST /api/study/adaptive-content
GET  /api/kb/adaptive-content
POST /api/attempts/correct
POST /api/telemetry/events
```

El portal consume esos endpoints y muestra estado. El backend conserva la autoridad.

## Criterio de cierre de esta etapa

La etapa queda cerrada si:

- Contabilidad y Administracion pueden estudiarse y evaluarse.
- Gemini responde desde backend.
- La KB guarda/reutiliza contenido generado.
- El ZIP portable no incluye secretos.
- El portal tiene una ruta clara para consumir el cockpit sin monolitizar.
