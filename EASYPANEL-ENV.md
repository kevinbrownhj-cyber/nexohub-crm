# Variables de Entorno para EasyPanel

## ⚠️ IMPORTANTE: Nombres de Servicios en EasyPanel

Los servicios en tu proyecto EasyPanel se llaman:
- **PostgreSQL:** `nexohub_crm`
- **Redis:** `redis_crm`

Por lo tanto, las variables de entorno deben usar estos nombres como hostnames.

---

## 🔙 Backend (api_crm)

⚠️ **IMPORTANTE:** Verifica los valores reales en tu configuración de EasyPanel:
- **Usuario de PostgreSQL:** Revisa en el servicio `nexohub_crm` → Credenciales
- **Nombre de la base de datos:** Revisa en el servicio `nexohub_crm` → Nombre de la base de datos
- **Contraseña:** Usa la que configuraste al crear el servicio PostgreSQL

```env
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@nexohub_crm:5432/NOMBRE_DB
REDIS_HOST=redis_crm
REDIS_PORT=6379
JWT_ACCESS_SECRET=d6e13a5df192c1642542e0eb6cad5b7f180af0a4255829895b1913bd7fd1bda2
JWT_REFRESH_SECRET=4ad62985cb0bc609c1a808b69d6b712b4a66677a6edff7de73c9c419
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
NODE_ENV=production
PORT=3000
API_PREFIX=api
CORS_ORIGIN=https://crm.serviexpressvial.com
AUDIT_ENABLED=true
```

**Ejemplo con valores del screenshot anterior:**
```env
DATABASE_URL=postgresql://nexohub:68bece416d6a797364la@nexohub_crm:5432/crm
```

---

## 🎨 Frontend (web)

```env
VITE_API_URL=https://crm.serviexpressvial.com/api
```

---

## 📋 Configuración en EasyPanel

### Backend:
1. **Fuente:**
   - Propietario: `kevinbrownhj-cyber`
   - Repositorio: `nexohub-crm`
   - Rama: `main`

2. **Compilación:**
   - Tipo: `Dockerfile`
   - Archivo: `apps/api/Dockerfile`
   - Build context: `.`

3. **Entorno:**
   - Agregar todas las variables de arriba (una por una)

4. **Puerto:** `3000`

### Frontend:
1. **Fuente:**
   - Propietario: `kevinbrownhj-cyber`
   - Repositorio: `nexohub-crm`
   - Rama: `main`

2. **Compilación:**
   - Tipo: `Dockerfile`
   - Archivo: `apps/web/Dockerfile`
   - Build context: `.`

3. **Entorno:**
   - `VITE_API_URL=https://crm.serviexpressvial.com/api`

4. **Puerto:** `80`

---

## 🔄 Después del Deploy

### Ejecutar migraciones:

1. **EasyPanel → api_crm → Terminal**
2. **Ejecutar:**
   ```bash
   cd /app/apps/api
   npx prisma migrate deploy
   ```

---

## 🌐 Dominios

### Backend:
- Dominio: `crm.serviexpressvial.com`
- Path: `/api/*` → Proxy a puerto 3000
- SSL: Habilitado

### Frontend:
- Dominio: `crm.serviexpressvial.com`
- Path: `/*` → Puerto 80
- SSL: Habilitado
