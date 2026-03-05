# 🚀 Guía de Despliegue en EasyPanel

## 📋 Requisitos Previos

- VPS con EasyPanel instalado
- Cuenta de GitHub con el repositorio
- Dominio configurado (opcional pero recomendado)

---

## 🔧 PASO 1: Preparar Repositorio en GitHub

### 1.1 Subir código a GitHub

```bash
# Si aún no has inicializado git
cd C:\Users\deyah\CascadeProjects\nexohub-crm
git init
git add .
git commit -m "Initial commit - NexoHub CRM"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/TU_USUARIO/nexohub-crm.git
git branch -M main
git push -u origin main
```

### 1.2 Verificar archivos necesarios

Asegúrate de que estos archivos estén en el repositorio:
- ✅ `apps/api/Dockerfile`
- ✅ `apps/web/Dockerfile`
- ✅ `apps/web/nginx.conf`
- ✅ `.dockerignore`
- ✅ `apps/api/.env.production.example`

---

## 🐘 PASO 2: Configurar PostgreSQL en EasyPanel

### 2.1 Crear servicio de base de datos

1. Accede a EasyPanel: `http://TU_VPS_IP:3000`
2. Crea un nuevo proyecto: **"nexohub-crm"**
3. Agrega servicio → **PostgreSQL**
   - Nombre: `postgres`
   - Versión: `15-alpine`
   - Usuario: `nexohub`
   - Contraseña: `[GENERAR_SEGURA]` (guárdala)
   - Base de datos: `nexohub_crm`
   - Volumen persistente: `/var/lib/postgresql/data`

4. **Guardar la URL de conexión:**
   ```
   postgresql://nexohub:TU_PASSWORD@postgres:5432/nexohub_crm
   ```

---

## 🔴 PASO 3: Configurar Redis en EasyPanel

### 3.1 Crear servicio Redis

1. En el mismo proyecto, agrega servicio → **Redis**
   - Nombre: `redis`
   - Versión: `7-alpine`
   - Volumen: `/data`
   - Sin contraseña (red interna)

---

## 🔙 PASO 4: Desplegar Backend (API)

### 4.1 Crear servicio desde GitHub

1. En EasyPanel → Agregar servicio → **GitHub**
2. Conectar tu cuenta de GitHub (autorizar)
3. Seleccionar repositorio: `nexohub-crm`
4. Configuración:
   - **Nombre:** `backend`
   - **Branch:** `main`
   - **Dockerfile path:** `apps/api/Dockerfile`
   - **Build context:** `.` (raíz del repo)
   - **Puerto:** `3000`

### 4.2 Configurar variables de entorno

En la sección "Environment Variables":

```env
DATABASE_URL=postgresql://nexohub:TU_PASSWORD@postgres:5432/nexohub_crm
REDIS_HOST=redis
REDIS_PORT=6379
JWT_ACCESS_SECRET=GENERAR_SECRETO_SEGURO_64_CHARS
JWT_REFRESH_SECRET=GENERAR_OTRO_SECRETO_SEGURO_64_CHARS
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
NODE_ENV=production
PORT=3000
API_PREFIX=api
CORS_ORIGIN=https://app.tudominio.com
AUDIT_ENABLED=true
```

**⚠️ IMPORTANTE:** Genera secretos seguros:
```bash
# En tu terminal local, genera secretos:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4.3 Configurar dominio (opcional)

1. En EasyPanel → Servicio backend → Domains
2. Agregar dominio: `api.tudominio.com`
3. Habilitar SSL automático (Let's Encrypt)

### 4.4 Ejecutar migraciones

Después del primer deploy:

1. EasyPanel → Servicio backend → Terminal
2. Ejecutar:
   ```bash
   cd /app/apps/api
   npx prisma migrate deploy
   npx prisma db seed  # Si tienes seed
   ```

---

## 🎨 PASO 5: Desplegar Frontend (Web)

### 5.1 Crear servicio desde GitHub

1. Agregar servicio → **GitHub**
2. Seleccionar mismo repositorio: `nexohub-crm`
3. Configuración:
   - **Nombre:** `frontend`
   - **Branch:** `main`
   - **Dockerfile path:** `apps/web/Dockerfile`
   - **Build context:** `.`
   - **Puerto:** `80`

### 5.2 Configurar variables de entorno

```env
VITE_API_URL=https://api.tudominio.com/api
```

**O si usas IP:**
```env
VITE_API_URL=http://TU_VPS_IP:3000/api
```

### 5.3 Configurar dominio

1. Servicio frontend → Domains
2. Agregar: `app.tudominio.com` (o `tudominio.com`)
3. Habilitar SSL

---

## 🌐 PASO 6: Configurar DNS

En tu proveedor de DNS (Cloudflare, etc.):

```
Tipo  Nombre  Valor           TTL
A     api     TU_VPS_IP       Auto
A     app     TU_VPS_IP       Auto
```

Espera 5-10 minutos para propagación DNS.

---

## ✅ PASO 7: Verificar Despliegue

### 7.1 Verificar backend

```bash
curl https://api.tudominio.com/api/health
# Debe responder: {"status":"ok"}
```

### 7.2 Verificar frontend

Abre en navegador: `https://app.tudominio.com`

### 7.3 Probar login

1. Accede a la app
2. Login con usuario admin (del seed)
3. Verifica que funcione correctamente

---

## 🔄 PASO 8: Configurar Auto-Deploy (CI/CD)

### 8.1 Habilitar auto-deploy en EasyPanel

1. Cada servicio → Settings → Auto Deploy
2. Activar: **"Deploy on push to main"**

Ahora cada push a `main` desplegará automáticamente.

### 8.2 Workflow de desarrollo

```bash
# Desarrollo local
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# Crear PR en GitHub → Revisar → Merge a main
# EasyPanel desplegará automáticamente
```

---

## 📊 MONITOREO Y LOGS

### Ver logs en tiempo real

1. EasyPanel → Servicio → Logs
2. Ver últimas 100 líneas o stream en vivo

### Métricas

1. EasyPanel → Servicio → Metrics
2. Ver CPU, RAM, Network

---

## 🔒 SEGURIDAD POST-DEPLOY

### Checklist de seguridad:

- ✅ Cambiar contraseñas por defecto de PostgreSQL
- ✅ Usar secretos JWT únicos y seguros (64+ caracteres)
- ✅ Habilitar SSL en todos los dominios
- ✅ Configurar firewall en VPS (solo puertos 80, 443, 22)
- ✅ Configurar backups automáticos de PostgreSQL
- ✅ Revisar logs de auditoría regularmente

### Configurar backups

1. EasyPanel → PostgreSQL → Backups
2. Habilitar backups automáticos diarios
3. Retención: 7 días

---

## 🐛 TROUBLESHOOTING

### Backend no inicia

```bash
# Ver logs
EasyPanel → backend → Logs

# Verificar variables de entorno
EasyPanel → backend → Environment

# Reiniciar servicio
EasyPanel → backend → Restart
```

### Migraciones fallan

```bash
# Conectar a terminal del backend
cd /app/apps/api
npx prisma migrate status
npx prisma migrate resolve --applied MIGRATION_NAME
```

### Frontend no conecta con backend

1. Verificar `VITE_API_URL` en variables de entorno
2. Verificar CORS en backend (`CORS_ORIGIN`)
3. Verificar que backend esté corriendo

---

## 📞 COMANDOS ÚTILES

### Ejecutar comandos en contenedor

```bash
# EasyPanel → Servicio → Terminal

# Backend
cd /app/apps/api
npx prisma studio  # Abrir Prisma Studio
npx prisma migrate deploy  # Aplicar migraciones
npm run seed  # Ejecutar seed

# Ver logs de aplicación
tail -f /var/log/app.log
```

### Escalar servicios

1. EasyPanel → Servicio → Scale
2. Ajustar CPU/RAM según necesidad

---

## 🎯 RESUMEN DE URLs

Después del deploy tendrás:

- **Frontend:** https://app.tudominio.com
- **Backend API:** https://api.tudominio.com/api
- **API Docs:** https://api.tudominio.com/docs
- **EasyPanel:** http://TU_VPS_IP:3000

---

## 📝 NOTAS IMPORTANTES

1. **Primera vez:** Ejecuta migraciones manualmente después del deploy
2. **Secretos:** NUNCA commitees `.env` al repositorio
3. **Backups:** Configura backups automáticos de PostgreSQL
4. **Monitoreo:** Revisa logs regularmente
5. **Updates:** Mantén dependencias actualizadas

---

## 🚀 PRÓXIMOS PASOS

Después del deploy exitoso:

1. Configurar monitoreo (Sentry, LogRocket)
2. Configurar alertas (Uptime Robot)
3. Optimizar performance (CDN para assets)
4. Configurar email transaccional (SendGrid, Mailgun)
5. Implementar backups offsite

---

**¿Necesitas ayuda?** Revisa los logs en EasyPanel o contacta soporte.
