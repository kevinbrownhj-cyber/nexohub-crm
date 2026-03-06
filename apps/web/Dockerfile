# Multi-stage build para frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build del paquete shared primero
RUN npm run build --workspace=@nexohub/shared

# Build de producción del frontend
WORKDIR /app/apps/web
RUN npm run build

# Imagen de producción con Nginx + curl para health check
FROM nginx:alpine

# Instalar curl para health check
RUN apk add --no-cache curl

# Copiar build
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copiar configuración de Nginx
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Health check robusto
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
