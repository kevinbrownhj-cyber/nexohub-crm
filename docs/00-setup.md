# Setup Guide - NexoHub CRM

## Prerequisites

- **Node.js** 20+ (with npm)
- **Docker** and **Docker Compose**
- **Git**
- **Windows** (PowerShell) or Linux/macOS

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd nexohub-crm
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (root, api, web, shared).

### 3. Build Shared Package

```bash
cd packages/shared
npm run build
cd ../..
```

### 4. Configure Environment Variables

#### API Environment

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://nexohub:nexohub123@localhost:5432/nexohub_crm?schema=public

JWT_ACCESS_SECRET=your-super-secret-access-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

REDIS_HOST=localhost
REDIS_PORT=6379

STORAGE_PATH=../../data/uploads

APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Important**: Change the JWT secrets to random strings in production!

#### Web Environment (if needed)

```bash
cp apps/web/.env.example apps/web/.env
```

### 5. Start Docker Services

```bash
cd infra
docker-compose up -d
cd ..
```

Verify services are running:

```bash
docker ps
```

You should see `nexohub-postgres` and `nexohub-redis` containers running.

### 6. Generate Prisma Client

```bash
cd apps/api
npx prisma generate
cd ../..
```

### 7. Run Database Migrations

```bash
npm run migrate
```

This creates all database tables based on the Prisma schema.

### 8. Seed Database

```bash
npm run seed
```

This creates:
- 3 Insurers (ASSA, FEDPA, REGIONAL)
- 5 Roles with permissions
- 4 Default users

**Default Credentials:**
- Admin: `admin@nexohub.com` / `Admin123!`
- Supervisor: `supervisor@nexohub.com` / `Super123!`
- Técnico: `tecnico@nexohub.com` / `Tecnico123!`
- Facturación: `facturacion@nexohub.com` / `Factura123!`

### 9. Start Development Servers

```bash
npm run dev
```

This starts both API and Web servers concurrently.

**Access Points:**
- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- API Docs (Swagger): http://localhost:3000/api/docs

## Verification

### Test API Health

```bash
curl http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexohub.com","password":"Admin123!"}'
```

You should receive a JSON response with `accessToken` and `refreshToken`.

### Test Database Connection

```bash
cd apps/api
npx prisma studio
```

This opens Prisma Studio at http://localhost:5555 where you can browse the database.

## Troubleshooting

### Port Already in Use

If ports 3000, 5173, 5432, or 6379 are in use:

**Option 1**: Stop conflicting services
**Option 2**: Change ports in `.env` and `docker-compose.yml`

### Database Connection Failed

1. Verify Docker containers are running: `docker ps`
2. Check logs: `docker logs nexohub-postgres`
3. Verify DATABASE_URL in `.env` matches Docker credentials

### Prisma Client Not Generated

```bash
cd apps/api
npx prisma generate
cd ../..
```

### Migration Errors

Reset database (⚠️ destroys all data):

```bash
cd apps/api
npx prisma migrate reset
cd ../..
npm run seed
```

## Development Workflow

### Making Database Changes

1. Edit `apps/api/prisma/schema.prisma`
2. Create migration:
   ```bash
   cd apps/api
   npx prisma migrate dev --name description_of_change
   cd ../..
   ```
3. Prisma client auto-regenerates

### Adding New Dependencies

```bash
# For API
npm install <package> --workspace=apps/api

# For Web
npm install <package> --workspace=apps/web

# For Shared
npm install <package> --workspace=packages/shared
```

### Running Tests

```bash
npm run test
```

### Linting and Formatting

```bash
npm run lint
npm run format
```

## Production Deployment (EasyPanel)

See deployment guide in this documentation folder.

### Build for Production

```bash
npm run build
```

### Environment Variables for Production

Ensure these are set securely:
- `JWT_ACCESS_SECRET` - Strong random string
- `JWT_REFRESH_SECRET` - Strong random string
- `DATABASE_URL` - Production database
- `REDIS_URL` - Production Redis (if applicable)
- `NODE_ENV=production`

## Next Steps

- Read [01-architecture.md](./01-architecture.md) for system overview
- Read [02-rbac.md](./02-rbac.md) for roles and permissions
- Read [03-import-profiles.md](./03-import-profiles.md) for import configuration
- Read [04-api.md](./04-api.md) for API reference
- Read [05-workflows.md](./05-workflows.md) for business processes
