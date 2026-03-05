import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE LA BASE DE DATOS\n');

  try {
    // 1. Verificar usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log(`📊 USUARIOS EN BD: ${users.length}`);
    if (users.length > 0) {
      users.forEach(u => {
        console.log(`   - ${u.email} (${u.name}) - Activo: ${u.isActive}`);
      });
    } else {
      console.log('   ❌ NO HAY USUARIOS EN LA BASE DE DATOS');
    }
    console.log('');

    // 2. Verificar roles
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        key: true,
        name: true,
      },
    });

    console.log(`📊 ROLES EN BD: ${roles.length}`);
    if (roles.length > 0) {
      roles.forEach(r => {
        console.log(`   - ${r.key} (${r.name})`);
      });
    } else {
      console.log('   ❌ NO HAY ROLES EN LA BASE DE DATOS');
    }
    console.log('');

    // 3. Verificar permisos
    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        key: true,
        description: true,
      },
    });

    console.log(`📊 PERMISOS EN BD: ${permissions.length}`);
    if (permissions.length > 0) {
      console.log(`   Total: ${permissions.length} permisos`);
    } else {
      console.log('   ❌ NO HAY PERMISOS EN LA BASE DE DATOS');
    }
    console.log('');

    // 4. Verificar relaciones usuario-rol
    const userRoles = await prisma.userRole.findMany({
      include: {
        user: { select: { email: true } },
        role: { select: { key: true } },
      },
    });

    console.log(`📊 ASIGNACIONES USUARIO-ROL: ${userRoles.length}`);
    if (userRoles.length > 0) {
      userRoles.forEach(ur => {
        console.log(`   - ${ur.user.email} → ${ur.role.key}`);
      });
    } else {
      console.log('   ❌ NO HAY ASIGNACIONES USUARIO-ROL');
    }
    console.log('');

    // Resumen
    console.log('📋 RESUMEN:');
    if (users.length === 0) {
      console.log('   ⚠️  LA BASE DE DATOS FUE RESETEADA - NECESITA SEED');
    } else {
      console.log('   ✅ Hay datos en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error al verificar BD:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus();
