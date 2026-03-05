# ⚡ DEPLOY RÁPIDO EN EASYPANEL

## 🎯 Resumen en 5 Pasos

### 1️⃣ Generar Secretos (2 min)

```bash
node scripts/generate-secrets.js
```

Guarda la salida - la necesitarás en EasyPanel.

---

### 2️⃣ Subir a GitHub (5 min)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/nexohub-crm.git
git push -u origin main
```

---

### 3️⃣ Crear Servicios en EasyPanel (10 min)

**Accede a:** `http://TU_VPS_IP:3000`

#### A. PostgreSQL
- Crear proyecto: `nexohub-crm`
- Agregar servicio → PostgreSQL 15-alpine
- Usuario: `nexohub`
- Password: (del script)
- Database: `nexohub_crm`

#### B. Redis
- Agregar servicio → Redis 7-alpine
- Sin password

#### C. Backend
- Agregar servicio → GitHub
- Repo: `nexohub-crm`
- Dockerfile: `apps/api/Dockerfile`
- Puerto: `3000`
- Variables de entorno: (copiar del script)

#### D. Frontend
- Agregar servicio → GitHub
- Repo: `nexohub-crm`
- Dockerfile: `apps/web/Dockerfile`
- Puerto: `80`
- Variable: `VITE_API_URL=http://TU_VPS_IP:3000/api`

---

### 4️⃣ Ejecutar Migraciones (2 min)

En EasyPanel → Backend → Terminal:

```bash
cd /app/apps/api
npx prisma migrate deploy
```

---

### 5️⃣ Acceder a la App (1 min)

**Frontend:** `http://TU_VPS_IP` (puerto del servicio frontend)  
**Backend:** `http://TU_VPS_IP:3000/api`

**Login por defecto:**
- Email: `admin@servivial.com`
- Password: `Admin123!`

---

## 🌐 Configurar Dominio (Opcional)

### En tu DNS:
```
A    api.tudominio.com    →  TU_VPS_IP
A    app.tudominio.com    →  TU_VPS_IP
```

### En EasyPanel:
1. Backend → Domains → `api.tudominio.com` → SSL ✓
2. Frontend → Domains → `app.tudominio.com` → SSL ✓
3. Actualizar `VITE_API_URL=https://api.tudominio.com/api`

---

## 🔄 Auto-Deploy

En cada servicio → Settings → **Auto Deploy on Push** ✓

Ahora cada `git push` desplegará automáticamente.

---

## 📚 Documentación Completa

Ver `DEPLOY.md` para guía detallada con troubleshooting.

---

## ⚠️ Checklist Pre-Deploy

- ✅ Secretos generados y guardados
- ✅ Código en GitHub
- ✅ PostgreSQL creado en EasyPanel
- ✅ Redis creado en EasyPanel
- ✅ Variables de entorno configuradas
- ✅ Migraciones ejecutadas
- ✅ Login funciona

---

## 🆘 Problemas Comunes

**Backend no inicia:**
- Verificar `DATABASE_URL` en variables
- Ver logs en EasyPanel

**Frontend no conecta:**
- Verificar `VITE_API_URL`
- Verificar `CORS_ORIGIN` en backend

**Migraciones fallan:**
```bash
npx prisma migrate reset --force
npx prisma migrate deploy
```

---

**¿Listo para deploy?** Sigue los 5 pasos arriba. ⬆️
