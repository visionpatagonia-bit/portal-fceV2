# NEXUS Study Cockpit — server Node.
FROM node:20-alpine
WORKDIR /app

# Deps primero (cache de capa). firebase-admin = KB persistente en Firestore (opcional).
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Codigo
COPY . .

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    GEMINI_MODEL=gemini-2.5-flash
EXPOSE 8080
CMD ["node", "server.js"]
