-- Bootstrap default roles, permissions and users for first deploy.
-- This migration is idempotent via ON CONFLICT / DO NOTHING.

-- Permissions
INSERT INTO "permissions" ("id", "key", "description", "created_at") VALUES
  (gen_random_uuid()::text, 'cases.read_all', 'Read all cases', now()),
  (gen_random_uuid()::text, 'cases.read_assigned', 'Read assigned cases only', now()),
  (gen_random_uuid()::text, 'cases.create', 'Create new cases', now()),
  (gen_random_uuid()::text, 'cases.edit', 'Edit cases', now()),
  (gen_random_uuid()::text, 'cases.manage', 'Manage cases (full access)', now()),
  (gen_random_uuid()::text, 'cases.soft_delete', 'Soft delete cases', now()),
  (gen_random_uuid()::text, 'customers.read', 'Read customers', now()),
  (gen_random_uuid()::text, 'customers.create', 'Create customers', now()),
  (gen_random_uuid()::text, 'customers.update', 'Update customers', now()),
  (gen_random_uuid()::text, 'customers.manage', 'Manage customers (full access)', now()),
  (gen_random_uuid()::text, 'assignments.manage', 'Manage case assignments', now()),
  (gen_random_uuid()::text, 'surcharges.create', 'Create surcharges', now()),
  (gen_random_uuid()::text, 'surcharges.approve', 'Approve surcharges', now()),
  (gen_random_uuid()::text, 'surcharges.reject', 'Reject surcharges', now()),
  (gen_random_uuid()::text, 'billing.prepare', 'Prepare invoices', now()),
  (gen_random_uuid()::text, 'billing.issue', 'Issue invoices', now()),
  (gen_random_uuid()::text, 'billing.export', 'Export invoices', now()),
  (gen_random_uuid()::text, 'imports.run', 'Run imports', now()),
  (gen_random_uuid()::text, 'imports.preview', 'Preview imports', now()),
  (gen_random_uuid()::text, 'imports.rollback', 'Rollback imports', now()),
  (gen_random_uuid()::text, 'users.manage', 'Manage users', now()),
  (gen_random_uuid()::text, 'roles.manage', 'Manage roles', now()),
  (gen_random_uuid()::text, 'audit.read', 'Read audit logs', now())
ON CONFLICT ("key") DO NOTHING;

-- Roles
INSERT INTO "roles" ("id", "key", "name", "description", "created_at", "updated_at") VALUES
  (gen_random_uuid()::text, 'ADMIN', 'Administrador', 'Acceso completo al sistema', now(), now()),
  (gen_random_uuid()::text, 'SUPERVISOR_OPERACIONES', 'Supervisor de Operaciones', 'Gestiona casos, asignaciones y validaciones', now(), now()),
  (gen_random_uuid()::text, 'TECNICO', 'Técnico', 'Trabaja en casos asignados', now(), now()),
  (gen_random_uuid()::text, 'FACTURACION', 'Facturación', 'Prepara y emite facturas', now(), now()),
  (gen_random_uuid()::text, 'AUDITOR', 'Auditor', 'Solo lectura y auditoría', now(), now())
ON CONFLICT ("key") DO NOTHING;

-- Role permissions mapping (idempotent)
WITH
  p AS (
    SELECT id, key FROM "permissions"
  ),
  r AS (
    SELECT id, key FROM "roles"
  ),
  admin_perm AS (
    SELECT r.id AS role_id, p.id AS permission_id
    FROM r
    JOIN p ON TRUE
    WHERE r.key = 'ADMIN'
  ),
  supervisor_perm AS (
    SELECT r.id AS role_id, p.id AS permission_id
    FROM r
    JOIN p ON p.key IN (
      'cases.read_all',
      'cases.create',
      'cases.edit',
      'assignments.manage',
      'surcharges.create',
      'surcharges.approve',
      'surcharges.reject',
      'imports.run',
      'imports.preview'
    )
    WHERE r.key = 'SUPERVISOR_OPERACIONES'
  ),
  tecnico_perm AS (
    SELECT r.id AS role_id, p.id AS permission_id
    FROM r
    JOIN p ON p.key IN ('cases.read_assigned', 'cases.edit', 'surcharges.create')
    WHERE r.key = 'TECNICO'
  ),
  facturacion_perm AS (
    SELECT r.id AS role_id, p.id AS permission_id
    FROM r
    JOIN p ON p.key IN (
      'cases.read_all',
      'surcharges.approve',
      'surcharges.reject',
      'billing.prepare',
      'billing.issue',
      'billing.export'
    )
    WHERE r.key = 'FACTURACION'
  ),
  auditor_perm AS (
    SELECT r.id AS role_id, p.id AS permission_id
    FROM r
    JOIN p ON p.key IN ('cases.read_all', 'audit.read')
    WHERE r.key = 'AUDITOR'
  )
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT role_id, permission_id FROM admin_perm
UNION ALL SELECT role_id, permission_id FROM supervisor_perm
UNION ALL SELECT role_id, permission_id FROM tecnico_perm
UNION ALL SELECT role_id, permission_id FROM facturacion_perm
UNION ALL SELECT role_id, permission_id FROM auditor_perm
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- Users (idempotent by email)
-- bcrypt hashes generated with bcrypt.hash(password, 10)
INSERT INTO "users" ("id", "email", "password_hash", "name", "is_active", "created_at", "updated_at") VALUES
  (gen_random_uuid()::text, 'admin@nexohub.com', '$2b$10$Hol.moWalezS40MPcOsfme4poP6qpNz7J35VYHJrU/ltoKUxKokWa', 'Administrador', true, now(), now()),
  (gen_random_uuid()::text, 'admin@servivial.com', '$2b$10$Hol.moWalezS40MPcOsfme4poP6qpNz7J35VYHJrU/ltoKUxKokWa', 'Administrador Servivial', true, now(), now()),
  (gen_random_uuid()::text, 'supervisor@nexohub.com', '$2b$10$X7TU3KEG7L/qPYjYp4joVOmk31R0wDwkhKvZXocbaMkjjVNyg6OM2', 'Supervisor Principal', true, now(), now()),
  (gen_random_uuid()::text, 'tecnico@nexohub.com', '$2b$10$x5tebGQfeqSuACpWyucRUe5IJvucOPL1k8CqPeaaN8rbP9rK3CsdS', 'Técnico de Campo', true, now(), now()),
  (gen_random_uuid()::text, 'facturacion@nexohub.com', '$2b$10$tbjDujQSJex43I/z65fb0uOG5WAuESIlz.pEMbVF2hfh/PqNfEAwa', 'Departamento de Facturación', true, now(), now())
ON CONFLICT ("email") DO UPDATE SET
  "password_hash" = EXCLUDED."password_hash",
  "is_active" = true,
  "deleted_at" = NULL,
  "updated_at" = now();

-- User roles mapping (idempotent)
WITH
  u AS (SELECT id, email FROM "users"),
  r AS (SELECT id, key FROM "roles"),
  m AS (
    SELECT u.id AS user_id, r.id AS role_id
    FROM u
    JOIN r ON (
      (u.email IN ('admin@nexohub.com', 'admin@servivial.com') AND r.key = 'ADMIN') OR
      (u.email = 'supervisor@nexohub.com' AND r.key = 'SUPERVISOR_OPERACIONES') OR
      (u.email = 'tecnico@nexohub.com' AND r.key = 'TECNICO') OR
      (u.email = 'facturacion@nexohub.com' AND r.key = 'FACTURACION')
    )
  )
INSERT INTO "user_roles" ("user_id", "role_id")
SELECT user_id, role_id FROM m
ON CONFLICT ("user_id", "role_id") DO NOTHING;
