# NEXUS Study Cockpit — server Node puro (sin dependencias externas).
FROM node:20-alpine
WORKDIR /app
COPY . .
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    GEMINI_MODEL=gemini-2.5-flash
EXPOSE 8080
CMD ["node", "server.js"]
