-- ============================================
-- VERIFICACIÓN DE USUARIO: alexisserrano@gmail.com
-- ============================================

-- 1) Verificar si el usuario existe
SELECT 
    id,
    email,
    name,
    isActive,
    emailVerified,
    createdAt,
    lastLoginAt
FROM users 
WHERE email = 'alexisserrano@gmail.com';

-- 2) Verificar rol asignado
SELECT 
    u.email,
    u.name,
    r.key AS role_key,
    r.name AS role_name,
    ur.createdAt AS role_assigned_at
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE u.email = 'alexisserrano@gmail.com';

-- 3) Verificar permisos del rol
SELECT 
    u.email,
    r.name AS role_name,
    p.key AS permission_key,
    p.description AS permission_description
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE u.email = 'alexisserrano@gmail.com'
ORDER BY p.key;

-- 4) Verificar intentos de login recientes
SELECT 
    email,
    ip,
    userAgent,
    success,
    reason,
    createdAt
FROM login_attempts
WHERE email = 'alexisserrano@gmail.com'
ORDER BY createdAt DESC
LIMIT 10;

-- 5) Verificar si hay refresh tokens activos
SELECT 
    u.email,
    rt.token,
    rt.expiresAt,
    rt.createdAt,
    rt.revokedAt
FROM users u
LEFT JOIN refresh_tokens rt ON rt.user_id = u.id
WHERE u.email = 'alexisserrano@gmail.com'
ORDER BY rt.createdAt DESC
LIMIT 5;
