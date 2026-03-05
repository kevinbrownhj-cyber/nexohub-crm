-- ============================================
-- DIAGNÓSTICO COMPLETO - CASOS DE JUAN
-- Ejecutar cada query y reportar resultados
-- ============================================

-- 1) ID Y PERMISOS DE JUAN
SELECT 
    u.id AS juan_id, 
    u.email,
    u."isActive",
    r.name AS role_name,
    r.key AS role_key
FROM users u
LEFT JOIN "UserRole" ur ON ur."userId" = u.id
LEFT JOIN roles r ON r.id = ur."roleId"
WHERE u.email = 'juan@mail.com';

-- 2) PERMISOS DEL ROL DE JUAN
SELECT p.key AS permiso
FROM users u
JOIN "UserRole" ur ON ur."userId" = u.id
JOIN roles r ON r.id = ur."roleId"
JOIN "RolePermission" rp ON rp."roleId" = r.id
JOIN permissions p ON p.id = rp."permissionId"
WHERE u.email = 'juan@mail.com';

-- 3) TODOS LOS CASOS ASIGNADOS A JUAN (cualquier status)
SELECT 
    c.id,
    c."externalId",
    c.status,
    c."assignedToUserId",
    c."deletedAt",
    c."updatedAt"
FROM cases c
WHERE c."assignedToUserId" = (SELECT id FROM users WHERE email='juan@mail.com')
ORDER BY c."updatedAt" DESC;

-- 4) CASOS CON status=ASSIGNED para Juan (lo que debería ver)
SELECT COUNT(*) AS casos_assigned_juan
FROM cases c
WHERE c.status = 'ASSIGNED'
  AND c."assignedToUserId" = (SELECT id FROM users WHERE email='juan@mail.com')
  AND c."deletedAt" IS NULL;

-- 5) CASOS CON status=IMPORTED para Juan (si se usa flujo alternativo)
SELECT COUNT(*) AS casos_imported_juan
FROM cases c
WHERE c.status = 'IMPORTED'
  AND c."assignedToUserId" = (SELECT id FROM users WHERE email='juan@mail.com')
  AND c."deletedAt" IS NULL;

-- 6) ÚLTIMOS 5 CASOS EN EL SISTEMA (para ver qué status tienen)
SELECT 
    c.id,
    c."externalId",
    c.status,
    u.email AS asignado_a,
    c."updatedAt"
FROM cases c
LEFT JOIN users u ON c."assignedToUserId" = u.id
WHERE c."deletedAt" IS NULL
ORDER BY c."updatedAt" DESC
LIMIT 5;
