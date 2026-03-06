-- Bootstrap default roles, permissions and users for first deploy.
-- This migration is idempotent via ON CONFLICT / DO NOTHING.

-- Permissions
INSERT INTO "permissions" ("key", "description", "created_at") VALUES
  ('cases.read_all', 'Read all cases', now()),
  ('cases.read_assigned', 'Read assigned cases only', now()),
  ('cases.create', 'Create new cases', now()),
  ('cases.edit', 'Edit cases', now()),
  ('cases.manage', 'Manage cases (full access)', now()),
  ('cases.soft_delete', 'Soft delete cases', now()),
  ('customers.read', 'Read customers', now()),
  ('customers.create', 'Create customers', now()),
  ('customers.update', 'Update customers', now()),
  ('customers.manage', 'Manage customers (full access)', now()),
  ('assignments.manage', 'Manage case assignments', now()),
  ('surcharges.create', 'Create surcharges', now()),
  ('surcharges.approve', 'Approve surcharges', now()),
  ('surcharges.reject', 'Reject surcharges', now()),
  ('billing.prepare', 'Prepare invoices', now()),
  ('billing.issue', 'Issue invoices', now()),
  ('billing.export', 'Export invoices', now()),
  ('imports.run', 'Run imports', now()),
  ('imports.preview', 'Preview imports', now()),
  ('imports.rollback', 'Rollback imports', now()),
  ('users.manage', 'Manage users', now()),
  ('roles.manage', 'Manage roles', now()),
  ('audit.read', 'Read audit logs', now())
ON CONFLICT ("key") DO NOTHING;

-- Roles
INSERT INTO "roles" ("key", "name", "description", "created_at", "updated_at") VALUES
  ('ADMIN', 'Administrador', 'Acceso completo al sistema', now(), now()),
  ('SUPERVISOR_OPERACIONES', 'Supervisor de Operaciones', 'Gestiona casos, asignaciones y validaciones', now(), now()),
  ('TECNICO', 'Técnico', 'Trabaja en casos asignados', now(), now()),
  ('FACTURACION', 'Facturación', 'Prepara y emite facturas', now(), now()),
  ('AUDITOR', 'Auditor', 'Solo lectura y auditoría', now(), now())
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
INSERT INTO "users" ("email", "password_hash", "name", "is_active", "created_at", "updated_at") VALUES
  ('admin@nexohub.com', '$2b$10$Hol.moWalezS40MPcOsfme4poP6qpNz7J35VYHJrU/ltoKUxKokWa', 'Administrador', true, now(), now()),
  ('admin@servivial.com', '$2b$10$Hol.moWalezS40MPcOsfme4poP6qpNz7J35VYHJrU/ltoKUxKokWa', 'Administrador Servivial', true, now(), now()),
  ('supervisor@nexohub.com', '$2b$10$X7TU3KEG7L/qPYjYp4joVOmk31R0wDwkhKvZXocbaMkjjVNyg6OM2', 'Supervisor Principal', true, now(), now()),
  ('tecnico@nexohub.com', '$2b$10$x5tebGQfeqSuACpWyucRUe5IJvucOPL1k8CqPeaaN8rbP9rK3CsdS', 'Técnico de Campo', true, now(), now()),
  ('facturacion@nexohub.com', '$2b$10$tbjDujQSJex43I/z65fb0uOG5WAuESIlz.pEMbVF2hfh/PqNfEAwa', 'Departamento de Facturación', true, now(), now())
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
