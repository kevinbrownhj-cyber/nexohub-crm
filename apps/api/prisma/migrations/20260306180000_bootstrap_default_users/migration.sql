-- Bootstrap default roles, permissions and users for first deploy.
-- This migration is idempotent via ON CONFLICT / DO NOTHING.

-- Permissions (generate CUIDs manually for compatibility)
INSERT INTO "permissions" ("id", "key", "description", "created_at") VALUES
  ('clx1a2b3c4d5e6f7g8h9i0j1k', 'cases.read_all', 'Read all cases', now()),
  ('clx2b3c4d5e6f7g8h9i0j1k2l', 'cases.read_assigned', 'Read assigned cases only', now()),
  ('clx3c4d5e6f7g8h9i0j1k2l3m', 'cases.create', 'Create new cases', now()),
  ('clx4d5e6f7g8h9i0j1k2l3m4n', 'cases.edit', 'Edit cases', now()),
  ('clx5e6f7g8h9i0j1k2l3m4n5o', 'cases.manage', 'Manage cases (full access)', now()),
  ('clx6f7g8h9i0j1k2l3m4n5o6p', 'cases.soft_delete', 'Soft delete cases', now()),
  ('clx7g8h9i0j1k2l3m4n5o6p7q', 'customers.read', 'Read customers', now()),
  ('clx8h9i0j1k2l3m4n5o6p7q8r', 'customers.create', 'Create customers', now()),
  ('clx9i0j1k2l3m4n5o6p7q8r9s', 'customers.update', 'Update customers', now()),
  ('clxa0j1k2l3m4n5o6p7q8r9s0t', 'customers.manage', 'Manage customers (full access)', now()),
  ('clxb1k2l3m4n5o6p7q8r9s0t1u', 'assignments.manage', 'Manage case assignments', now()),
  ('clxc2l3m4n5o6p7q8r9s0t1u2v', 'surcharges.create', 'Create surcharges', now()),
  ('clxd3m4n5o6p7q8r9s0t1u2v3w', 'surcharges.approve', 'Approve surcharges', now()),
  ('clxe4n5o6p7q8r9s0t1u2v3w4x', 'surcharges.reject', 'Reject surcharges', now()),
  ('clxf5o6p7q8r9s0t1u2v3w4x5y', 'billing.prepare', 'Prepare invoices', now()),
  ('clxg6p7q8r9s0t1u2v3w4x5y6z', 'billing.issue', 'Issue invoices', now()),
  ('clxh7q8r9s0t1u2v3w4x5y6z7a', 'billing.export', 'Export invoices', now()),
  ('clxi8r9s0t1u2v3w4x5y6z7a8b', 'imports.run', 'Run imports', now()),
  ('clxj9s0t1u2v3w4x5y6z7a8b9c', 'imports.preview', 'Preview imports', now()),
  ('clxk0t1u2v3w4x5y6z7a8b9c0d', 'imports.rollback', 'Rollback imports', now()),
  ('clxl1u2v3w4x5y6z7a8b9c0d1e', 'users.manage', 'Manage users', now()),
  ('clxm2v3w4x5y6z7a8b9c0d1e2f', 'roles.manage', 'Manage roles', now()),
  ('clxn3w4x5y6z7a8b9c0d1e2f3g', 'audit.read', 'Read audit logs', now())
ON CONFLICT ("key") DO NOTHING;

-- Roles (generate CUIDs manually for compatibility)
INSERT INTO "roles" ("id", "key", "name", "description", "created_at", "updated_at") VALUES
  ('clxr1a2b3c4d5e6f7g8h9i0j1k', 'ADMIN', 'Administrador', 'Acceso completo al sistema', now(), now()),
  ('clxr2b3c4d5e6f7g8h9i0j1k2l', 'SUPERVISOR_OPERACIONES', 'Supervisor de Operaciones', 'Gestiona casos, asignaciones y validaciones', now(), now()),
  ('clxr3c4d5e6f7g8h9i0j1k2l3m', 'TECNICO', 'Técnico', 'Trabaja en casos asignados', now(), now()),
  ('clxr4d5e6f7g8h9i0j1k2l3m4n', 'FACTURACION', 'Facturación', 'Prepara y emite facturas', now(), now()),
  ('clxr5e6f7g8h9i0j1k2l3m4n5o', 'AUDITOR', 'Auditor', 'Solo lectura y auditoría', now(), now())
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
  ('clxu1a2b3c4d5e6f7g8h9i0j1k', 'admin@nexohub.com', '$2b$10$Hol.moWalezS40MPcOsfme4poP6qpNz7J35VYHJrU/ltoKUxKokWa', 'Administrador', true, now(), now()),
  ('clxu2b3c4d5e6f7g8h9i0j1k2l', 'admin@servivial.com', '$2b$10$Hol.moWalezS40MPcOsfme4poP6qpNz7J35VYHJrU/ltoKUxKokWa', 'Administrador Servivial', true, now(), now()),
  ('clxu3c4d5e6f7g8h9i0j1k2l3m', 'supervisor@nexohub.com', '$2b$10$X7TU3KEG7L/qPYjYp4joVOmk31R0wDwkhKvZXocbaMkjjVNyg6OM2', 'Supervisor Principal', true, now(), now()),
  ('clxu4d5e6f7g8h9i0j1k2l3m4n', 'tecnico@nexohub.com', '$2b$10$x5tebGQfeqSuACpWyucRUe5IJvucOPL1k8CqPeaaN8rbP9rK3CsdS', 'Técnico de Campo', true, now(), now()),
  ('clxu5e6f7g8h9i0j1k2l3m4n5o', 'facturacion@nexohub.com', '$2b$10$tbjDujQSJex43I/z65fb0uOG5WAuESIlz.pEMbVF2hfh/PqNfEAwa', 'Departamento de Facturación', true, now(), now())
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
