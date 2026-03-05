# Multi-stage build para optimizar tamaño
FROM node:18-slim AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Instalar todas las dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build del paquete shared primero (genera types en dist/)
RUN npm run build --workspace=@nexohub/shared

# Verificar que se generaron los archivos .d.ts (falla temprano si no existen)
RUN test -f /app/packages/shared/dist/index.d.ts || (echo "ERROR: index.d.ts not generated" && exit 1)
RUN ls -la /app/packages/shared/dist/

# Generar Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build de la aplicación API
WORKDIR /app
RUN npm run build --workspace=@nexohub/api

# Podar dependencias de desarrollo
RUN npm prune --omit=dev

# Imagen de producción
FROM node:18-slim

WORKDIR /app

# Instalar OpenSSL y CA certificates para Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copiar package files para metadata
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Copiar node_modules ya podado desde builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar Prisma Client generado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copiar builds y archivos necesarios
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Crear usuario no-root
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs nestjs
USER nestjs

WORKDIR /app/apps/api

# Exponer puerto
EXPOSE 3000

# Health check - endpoint sin autenticación
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "dist/main.js"]
