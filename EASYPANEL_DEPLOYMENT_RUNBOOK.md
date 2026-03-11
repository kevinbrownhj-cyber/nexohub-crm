# EasyPanel Deployment Runbook - NexoHub CRM

## ✅ Status: READY FOR PRODUCTION DEPLOYMENT

Todas las issues críticas han sido resueltas:
- ✅ P3015 (migration file not found) - FIXED
- ✅ P3018 (NULL constraint violation) - FIXED  
- ✅ Container separation strategy - IMPLEMENTED
- ✅ Prisma runtime permissions - FIXED
- ✅ Migration validation in build - ADDED

## 🚀 Deployment Steps for EasyPanel

### 1. Pre-deployment Checklist

**Verificar que estos archivos están actualizados:**
- `apps/api/Dockerfile` - ✅ Separación de migraciones del CMD
- `apps/api/package.json` - ✅ Scripts migrate:deploy y migrate:status
- `apps/api/prisma/migrations/20260305155500_add_audit_fields/migration.sql` - ✅ Recreado sin encoding issues
- `apps/api/prisma/migrations/20260306180000_bootstrap_default_users/migration.sql` - ✅ Fixed con CUIDs explícitos

### 2. EasyPanel Service Configuration

**Backend API Service (api_crm):**
```yaml
Build Context: .
Dockerfile: apps/api/Dockerfile
Environment Variables:
  DATABASE_URL: postgresql://[user]:[password]@[host]:5432/[database]
  NODE_ENV: production
  PORT: 3000
  API_PREFIX: api
  JWT_ACCESS_SECRET: [32+ character secret]
  JWT_REFRESH_SECRET: [32+ character secret]
  REDIS_HOST: [redis_host]
  REDIS_PORT: 6379
  CORS_ORIGINS: [frontend_url]
  AUDIT_ENABLED: "true"
```

### 3. Critical Deployment Sequence

**IMPORTANTE: Las migraciones se ejecutan MANUALMENTE, NO en el container startup**

#### Step 1: Deploy API Service
1. EasyPanel → Services → api_crm → Deploy
2. Esperar que el build complete exitosamente
3. **NO iniciar el servicio todavía**

#### Step 2: Run Migrations (MANUAL)
```bash
# Conectar al container via EasyPanel Terminal/Exec
cd /app/apps/api

# Verificar estado de migraciones
npm run migrate:status

# Aplicar migraciones
npm run migrate:deploy
```

**Expected Output:**
```
8 migrations found in prisma/migrations
Applying migration `20260227174401_init`
Applying migration `20260228014923_`
Applying migration `20260301043413_add_editable_fields_and_objections`
Applying migration `20260301175511_add_soft_delete_all_entities`
Applying migration `20260302182521_add_audit_log_fields`
Applying migration `20260305030634_add_details_to_audit_log`
Applying migration `20260305155500_add_audit_fields`
Applying migration `20260306180000_bootstrap_default_users`

All migrations have been successfully applied.
```

#### Step 3: Seed default users (MANUAL)
```bash
# Conectar al container via EasyPanel Terminal/Exec
cd /app/apps/api

# Crear usuarios y roles por defecto
npm run seed
```

#### Step 4: Start API Service
1. EasyPanel → Services → api_crm → Start
2. Verificar logs: `Nest application successfully started`
3. Verificar health: `curl http://[api_url]/api/health`

### 4. Verification Commands

**Health Check:**
```bash
curl -i http://[api_url]/api/health
# Expected: HTTP/1.1 200 OK
```

**Database Verification:**
```bash
# En el container
npm run migrate:status
# Expected: "Database schema is up to date!"
```

**Test Login:**
```bash
curl -X POST http://[api_url]/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexohub.com","password":"Admin123!"}'
# Expected: {"accessToken":"...", "refreshToken":"..."}
```

### 5. Default Users Created

El bootstrap migration crea estos usuarios por defecto:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| admin@nexohub.com | Admin123! | ADMIN | Administrador completo |
| admin@servivial.com | Admin123! | ADMIN | Administrador Servivial |
| supervisor@nexohub.com | Super123! | SUPERVISOR_OPERACIONES | Supervisor |
| tecnico@nexohub.com | Tecnico123! | TECNICO | Técnico de campo |
| facturacion@nexohub.com | Factura123! | FACTURACION | Facturación |

### 5.1 Permanent Admin (fixed credential)

Cuenta fija asegurada por script (siempre se puede reestablecer):

- **Email:** serviexpressvial@gmail.com
- **Password:** S3rv!XpressVial#2026

Para reestablecerla manualmente (en container o local):
```bash
$env:ADMIN_EMAIL="serviexpressvial@gmail.com"
$env:ADMIN_PASSWORD="S3rv!XpressVial#2026"
npm run admin:fixed
```

### 6. Troubleshooting

**Si el container no arranca:**
1. Verificar variables de entorno (JWT secrets mínimo 32 chars)
2. Verificar DATABASE_URL connectivity
3. Revisar logs: EasyPanel → Services → api_crm → Logs

**Si las migraciones fallan:**
1. Verificar que la DB está accesible
2. Verificar permisos del usuario de DB
3. Si P3015 aparece: verificar que todos los archivos migration.sql existen
4. Si P3018 aparece: verificar que no hay conflictos de IDs en bootstrap

**Si el health endpoint falla:**
1. Verificar que el container está corriendo
2. Verificar que el puerto 3000 está expuesto
3. Verificar que la ruta es `/api/health` (no `/health`)

### 7. Rollback Procedure

**En caso de problemas críticos:**
```bash
# Conectar al container
cd /app/apps/api

# Rollback a migración específica (CUIDADO en producción)
npm run migrate:reset --force

# O rollback manual via SQL si es necesario
```

**⚠️ NOTA:** El rollback en producción debe hacerse con extremo cuidado y backup previo.

## 🎯 Success Criteria

✅ Container builds without errors  
✅ All 8 migrations apply successfully  
✅ API starts with "Nest application successfully started"  
✅ Health endpoint returns 200  
✅ Login with admin@nexohub.com works  
✅ No crash loops or restart issues  

## 📞 Support

Si encuentras issues no cubiertos en este runbook:
1. Verificar logs del container en EasyPanel
2. Verificar conectividad de DB
3. Verificar que todas las variables de entorno están configuradas
4. Comparar con la configuración de preflight local que funciona

---
**Última actualización:** 2026-03-10  
**Versión:** 1.0 - Production Ready
