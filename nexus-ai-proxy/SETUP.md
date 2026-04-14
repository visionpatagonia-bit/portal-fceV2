# NEXUS AI Co-Worker — Guía de Setup

## Arquitectura

```
  Alumno (celular/PC)
       │
       │  HTTPS
       ▼
  ┌──────────────┐
  │   ngrok /    │  ← tunnel público gratuito
  │  cloudflare  │
  └──────┬───────┘
         │  localhost:3100
         ▼
  ┌──────────────┐
  │  nexus-ai-   │  ← Express proxy (auth + rate limit + streaming)
  │  proxy       │
  └──────┬───────┘
         │  localhost:11434
         ▼
  ┌──────────────┐
  │   Ollama     │  ← llama3.2 en RTX 3080
  │   (GPU)      │
  └──────────────┘
```

---

## Paso 1: Verificar Ollama

```bash
# Verificar que Ollama responde
curl http://localhost:11434/api/tags

# Si no está corriendo:
ollama serve
```

---

## Paso 2: Configurar el proxy

```bash
cd nexus-ai-proxy

# Instalar dependencias
npm install

# Crear archivo de configuración
cp .env.example .env
```

Editar `.env`:
```env
PORT=3100
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
API_KEY=GENERAR-UNA-KEY-SEGURA
RATE_LIMIT_PER_MIN=20
MAX_TOKENS=1024
TEMPERATURE=0.4
```

Generar una API key segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Arrancar el proxy:
```bash
npm start
```

Verificar:
```bash
curl http://localhost:3100/api/health
```

---

## Paso 3: Exponer al mundo con ngrok

### Opción A: ngrok (más simple)

1. Instalar ngrok: https://ngrok.com/download
2. Crear cuenta gratuita en https://ngrok.com
3. Autenticar:
   ```bash
   ngrok config add-authtoken TU_TOKEN
   ```
4. Exponer el proxy:
   ```bash
   ngrok http 3100
   ```
5. Copiar la URL tipo `https://xxxx-xxxx.ngrok-free.app`

### Opción B: Cloudflare Tunnel (más estable, gratis)

1. Instalar cloudflared:
   - Windows: `winget install cloudflare.cloudflared`
   - O descargar de: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
2. Crear tunnel rápido:
   ```bash
   cloudflared tunnel --url http://localhost:3100
   ```
3. Copiar la URL tipo `https://xxxx.trycloudflare.com`

> **Nota**: Para una URL fija (sin cambiar cada vez), crear un tunnel persistente:
> ```bash
> cloudflared tunnel create nexus-ai
> cloudflared tunnel route dns nexus-ai AI.TU-DOMINIO.com
> cloudflared tunnel run nexus-ai
> ```

---

## Paso 4: Configurar el Portal

Editar `index.html`, buscar `NEXUS_AI_CONFIG`:

```html
<script>
window.NEXUS_AI_CONFIG = {
  proxyUrl: 'https://TU-URL-DE-NGROK.ngrok-free.app',
  apiKey:   'LA-MISMA-KEY-DEL-.ENV'
};
</script>
```

Hacer commit y push → Vercel deploya → los alumnos ya lo ven.

---

## Paso 5: Verificar todo

```bash
# 1. Health check del proxy
curl https://TU-TUNNEL-URL/api/health

# 2. Test de chat
curl -X POST https://TU-TUNNEL-URL/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU-API-KEY" \
  -d '{"messages":[{"role":"user","content":"Hola, ¿qué es el Libro Diario?"}],"context":{"materia":"contabilidad"}}'
```

---

## Uso diario

Cada vez que prendas la PC para dar clases:

```bash
# Terminal 1: Ollama (si no arranca solo)
ollama serve

# Terminal 2: Proxy
cd nexus-ai-proxy && npm start

# Terminal 3: Tunnel
ngrok http 3100
```

> **Tip**: Crear un archivo `start-nexus-ai.bat` (Windows):
> ```batch
> @echo off
> start "Ollama" ollama serve
> timeout /t 3
> start "NEXUS Proxy" cmd /c "cd nexus-ai-proxy && npm start"
> timeout /t 2
> start "Tunnel" ngrok http 3100
> ```

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| "Sin conexión al servidor" | Verificar que el proxy y tunnel estén corriendo |
| Respuestas muy lentas | Verificar con `nvidia-smi` que la GPU no esté saturada |
| Error 401 | La API key del portal no coincide con la del .env |
| Error 429 | Rate limit alcanzado. Subir RATE_LIMIT_PER_MIN en .env |
| Ollama desconectado | Correr `ollama serve` en una terminal |
| URL de ngrok cambió | Actualizar NEXUS_AI_CONFIG en index.html y re-deployar |

---

## Monitoreo

```bash
# Ver uso de GPU en tiempo real
nvidia-smi -l 1

# Ver logs del proxy
# Los logs se muestran en la terminal donde corre npm start
```

---

## Seguridad

- La API key evita que alguien random abuse tu GPU
- El rate limit (20 req/min por IP) protege de floods
- El sanitizador de input previene prompt injection básico
- **Nunca** compartir la API key públicamente
- ngrok free expone una URL temporal — cambia cada vez que reiniciás
