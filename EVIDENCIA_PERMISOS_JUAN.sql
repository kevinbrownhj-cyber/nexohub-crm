-- ============================================
-- EVIDENCIA 1: PERMISOS DEL ROL TECNICO
-- ============================================

-- A) Verificar que el rol TECNICO existe
SELECT id, key, name FROM roles WHERE key = 'TECNICO';

-- B) Todos los permisos asignados al rol TECNICO
SELECT 
    r.key AS role_key,
    p.key AS permission_key,
    p.description AS permission_description
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.key = 'TECNICO'
ORDER BY p.key;

-- C) Verificar específicamente si TECNICO tiene cases.read_assigned
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM roles r
            JOIN role_permissions rp ON rp.role_id = r.id
            JOIN permissions p ON p.id = rp.permission_id
            WHERE r.key = 'TECNICO' AND p.key = 'cases.read_assigned'
        ) THEN 'SÍ TIENE cases.read_assigned'
        ELSE 'NO TIENE cases.read_assigned'
    END AS resultado;

-- ============================================
-- EVIDENCIA 2: PERMISOS HEREDADOS POR JUAN
-- ============================================

-- D) Verificar rol asignado a Juan
SELECT 
    u.id AS user_id,
    u.email,
    u.is_active,
    r.key AS role_key,
    r.name AS role_name
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE u.email = 'juan@mail.com';

-- E) Todos los permisos que Juan hereda de su rol
SELECT 
    u.email,
    r.key AS role_key,
    p.key AS permission_key
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE u.email = 'juan@mail.com'
ORDER BY p.key;

-- F) Verificar específicamente si Juan hereda cases.read_assigned
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            JOIN role_permissions rp ON rp.role_id = r.id
            JOIN permissions p ON p.id = rp.permission_id
            WHERE u.email = 'juan@mail.com' AND p.key = 'cases.read_assigned'
        ) THEN 'SÍ HEREDA cases.read_assigned'
        ELSE 'NO HEREDA cases.read_assigned'
    END AS resultado;

-- ============================================
-- EVIDENCIA 3: VERIFICAR PERMISO EXISTE
-- ============================================

-- G) Verificar que el permiso cases.read_assigned existe en la tabla permissions
SELECT id, key, name FROM permissions WHERE key = 'cases.read_assigned';

-- H) Todos los permisos relacionados con cases
SELECT id, key, name FROM permissions WHERE key LIKE 'cases%' ORDER BY key;
