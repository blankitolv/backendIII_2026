# Multi-stage: solo el stage final viaja como imagen.

# Stage deps: dependencias de runtime nada mas. package*.json antes que el codigo
# para que Docker reutilice la capa mientras el resto del contexto cambie.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage builder: devDependencies para validar en el build (lint). El resultado
# queda fuera del stage production: ni mocha, ni chai, ni eslint viajan.
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run lint

# Stage production: solo runtime, usuario node (no root), sin npm wrapper para
# que las senales (SIGTERM) lleguen directo al proceso de server.js.
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src/ ./src/
COPY --chown=node:node docs/openapi.yaml ./docs/openapi.yaml
COPY --chown=node:node uploads/ ./uploads/
# La imagen no trae logs/ (esta excluida) y el contenedor corre como node:
# el directorio se crea y se lo entrega al usuario no root para que el logger
# y el multer puedan escribir encima.
RUN mkdir -p logs && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=5 \
  CMD wget -qO- "http://localhost:${PORT:-3000}/api/v1/health/ready" || exit 1
CMD ["node", "src/server.js"]