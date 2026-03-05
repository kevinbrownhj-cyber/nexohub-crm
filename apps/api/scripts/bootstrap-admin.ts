import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Configuración del admin inicial
const ADMIN_EMAIL = 'admin@servivial.com';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_NAME = 'Administrador del Sistema';

// Permisos del sistema
const PERMISSIONS = [
  { key: 'cases.read_all', description: 'Read all cases' },
  { key: 'cases.read_assigned', description: 'Read assigned cases only' },
  { key: 'cases.create', description: 'Create new cases' },
  { key: 'cases.edit', description: 'Edit cases' },
  { key: 'cases.manage', description: 'Manage cases (full access)' },
  { key: 'cases.soft_delete', description: 'Soft delete cases' },
  { key: 'customers.read', description: 'Read customers' },
  { key: 'customers.create', description: 'Create customers' },
  { key: 'customers.update', description: 'Update customers' },
  { key: 'customers.manage', description: 'Manage customers (full access)' },
  { key: 'assignments.manage', description: 'Manage case assignments' },
  { key: 'surcharges.create', description: 'Create surcharges' },
  { key: 'surcharges.approve', description: 'Approve surcharges' },
  { key: 'surcharges.reject', description: 'Reject surcharges' },
  { key: 'billing.prepare', description: 'Prepare invoices' },
  { key: 'billing.issue', description: 'Issue invoices' },
  { key: 'billing.export', description: 'Export invoices' },
  { key: 'imports.run', description: 'Run imports' },
  { key: 'imports.preview', description: 'Preview imports' },
  { key: 'imports.rollback', description: 'Rollback imports' },
  { key: 'users.manage', description: 'Manage users' },
  { key: 'roles.manage', description: 'Manage roles' },
  { key: 'audit.read', description: 'Read audit logs' },
];

// Roles del sistema
const ROLES = [
  {
    key: 'ADMIN',
    name: 'Administrador',
    description: 'Acceso completo al sistema',
    permissions: PERMISSIONS.map(p => p.key),
  },
  {
    key: 'TECNICO',
    name: 'Técnico',
    description: 'Acceso limitado a casos asignados',
    permissions: [
      'cases.read_assigned',
      'cases.edit',
      'surcharges.create',
    ],
  },
];

async function bootstrapAdmin() {
  console.log('🚀 INICIANDO BOOTSTRAP DEL SISTEMA\n');

  try {
    // 1. Crear permisos (idempotente)
    console.log('1️⃣ Creando permisos...');
    for (const perm of PERMISSIONS) {
      await prisma.permission.upsert({
        where: { key: perm.key },
        update: { description: perm.description },
        create: perm,
      });
    }
    console.log(`   ✅ ${PERMISSIONS.length} permisos creados/actualizados\n`);

    // 2. Crear roles (idempotente)
    console.log('2️⃣ Creando roles...');
    for (const role of ROLES) {
      const createdRole = await prisma.role.upsert({
        where: { key: role.key },
        update: {
          name: role.name,
          description: role.description,
        },
        create: {
          key: role.key,
          name: role.name,
          description: role.description,
        },
      });

      // Asignar permisos al rol
      await prisma.rolePermission.deleteMany({
        where: { roleId: createdRole.id },
      });

      for (const permKey of role.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { key: permKey },
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: createdRole.id,
              permissionId: permission.id,
            },
          });
        }
      }

      console.log(`   ✅ Rol ${role.key} creado con ${role.permissions.length} permisos`);
    }
    console.log('');

    // 3. Crear usuario admin (idempotente)
    console.log('3️⃣ Creando usuario administrador...');
    
    // Hash de la contraseña usando bcrypt (mismo que auth.service.ts)
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const adminUser = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        passwordHash,
        name: ADMIN_NAME,
        isActive: true,
        deletedAt: null,
        deletedBy: null,
        scheduledDeleteAt: null,
      },
      create: {
        email: ADMIN_EMAIL,
        passwordHash,
        name: ADMIN_NAME,
        isActive: true,
      },
    });

    console.log(`   ✅ Usuario admin creado: ${adminUser.email}`);
    console.log(`   📧 Email: ${ADMIN_EMAIL}`);
    console.log(`   🔑 Password: ${ADMIN_PASSWORD}`);
    console.log('');

    // 4. Asignar rol ADMIN al usuario
    console.log('4️⃣ Asignando rol ADMIN...');
    const adminRole = await prisma.role.findUnique({
      where: { key: 'ADMIN' },
    });

    if (adminRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: adminRole.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });

      console.log(`   ✅ Rol ADMIN asignado al usuario\n`);
    }

    // 5. Verificar resultado
    console.log('5️⃣ Verificando configuración...');
    const userWithRoles = await prisma.user.findUnique({
      where: { id: adminUser.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (userWithRoles) {
      const roles = userWithRoles.userRoles.map(ur => ur.role.key);
      const permissions = userWithRoles.userRoles.flatMap(ur =>
        ur.role.rolePermissions.map(rp => rp.permission.key)
      );

      console.log(`   ✅ Usuario: ${userWithRoles.email}`);
      console.log(`   ✅ Activo: ${userWithRoles.isActive}`);
      console.log(`   ✅ Roles: ${roles.join(', ')}`);
      console.log(`   ✅ Permisos: ${permissions.length} permisos asignados\n`);
    }

    console.log('🎉 BOOTSTRAP COMPLETADO EXITOSAMENTE\n');
    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error durante bootstrap:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

bootstrapAdmin();
