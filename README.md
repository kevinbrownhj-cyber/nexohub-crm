# NexoHub CRM/ERP

Sistema operativo de gestión de casos/expedientes con asignación, recargos con aprobación y facturación para aseguradoras (ASSA, FEDPA, REGIONAL).

## Características Principales

- **Gestión de Casos/Expedientes**: Importación, creación manual, asignación a técnicos
- **Recargos con Aprobación**: Workflow de solicitud/aprobación/rechazo con auditoría completa
- **Facturación**: Generación de facturas por aseguradora con exportación a Excel
- **RBAC Completo**: Roles y permisos granulares (Admin, Supervisor, Técnico, Facturación, Auditor)
- **Importaciones Idempotentes**: Pipeline robusto para Excel/CSV con preview y validación
- **Auditoría Total**: Trazabilidad completa de todas las operaciones

## Stack Tecnológico

- **Backend**: NestJS + TypeScript + Prisma ORM + PostgreSQL
- **Frontend**: React + Vite + TypeScript
- **Auth**: JWT (access + refresh tokens) con rotación
- **Jobs**: BullMQ + Redis
- **Validación**: Zod schemas compartidos
- **Containerización**: Docker + Docker Compose

## Estructura del Proyecto

```
nexohub-crm/
├── apps/
│   ├── api/              # Backend NestJS
│   └── web/              # Frontend React
├── packages/
│   └── shared/           # Tipos y schemas compartidos
├── prisma/               # Schema y migraciones
├── resources/            # Archivos de ejemplo (CSV/Excel)
├── infra/                # Docker Compose
├── docs/                 # Documentación completa
├── scripts/              # Scripts de seed e importación
└── data/                 # Almacenamiento local
```

## Inicio Rápido

### Requisitos Previos

- Node.js 20+
- Docker y Docker Compose
- npm o pnpm

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd nexohub-crm

# Instalar dependencias
npm install

# Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Levantar servicios (PostgreSQL, Redis)
cd infra
docker-compose up -d

# Ejecutar migraciones
npm run migrate

# Seed inicial (usuarios, roles, permisos)
npm run seed

# Iniciar desarrollo
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api

### Credenciales por Defecto

- **Admin**: admin@nexohub.com / Admin123!
- **Supervisor**: supervisor@nexohub.com / Super123!
- **Técnico**: tecnico@nexohub.com / Tecnico123!
- **Facturación**: facturacion@nexohub.com / Factura123!

## Documentación

Ver carpeta `/docs` para documentación completa:

- [00-setup.md](docs/00-setup.md) - Configuración e instalación
- [01-architecture.md](docs/01-architecture.md) - Arquitectura del sistema
- [02-rbac.md](docs/02-rbac.md) - Roles y permisos
- [03-import-profiles.md](docs/03-import-profiles.md) - Perfiles de importación
- [04-api.md](docs/04-api.md) - Documentación de API
- [05-workflows.md](docs/05-workflows.md) - Flujos de trabajo

## Comandos Útiles

```bash
# Desarrollo
npm run dev              # Inicia API + Web
npm run dev:api          # Solo API
npm run dev:web          # Solo Web

# Base de datos
npm run migrate          # Ejecuta migraciones
npm run migrate:dev      # Crea nueva migración
npm run seed             # Seed de datos iniciales

# Build
npm run build            # Build de todos los workspaces

# Tests
npm run test             # Ejecuta tests

# Linting
npm run lint             # Lint de código
npm run format           # Formatea código
```

## Despliegue en EasyPanel

Ver [docs/00-setup.md](docs/00-setup.md) para instrucciones detalladas de despliegue.

## Licencia

Propietario - Todos los derechos reservados
