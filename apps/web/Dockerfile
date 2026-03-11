# Multi-stage build para frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY tsconfig.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Verificaciones de shared y tsconfig
RUN test -f /app/tsconfig.json
RUN test -f /app/packages/shared/tsconfig.json
RUN test -d /app/packages/shared/src

# Build de producción
WORKDIR /app/apps/web
RUN npm run build

# Imagen de producción con Nginx
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copiar configuración de Nginx
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
