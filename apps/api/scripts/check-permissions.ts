import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPermissions() {
  console.log('🔍 VERIFICANDO PERMISOS DEL ROL ADMIN\n');

  try {
    const adminRole = await prisma.role.findUnique({
      where: { key: 'ADMIN' },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!adminRole) {
      console.log('❌ Rol ADMIN no encontrado');
      return;
    }

    console.log(`📋 ROL: ${adminRole.name} (${adminRole.key})\n`);
    console.log('✅ PERMISOS ASIGNADOS:');
    
    const permissions = adminRole.rolePermissions
      .map(rp => rp.permission.key)
      .sort();

    permissions.forEach(p => {
      console.log(`   - ${p}`);
    });

    console.log(`\n📊 Total: ${permissions.length} permisos\n`);

    // Verificar permisos específicos que necesitamos
    const requiredPermissions = [
      'cases.manage',
      'customers.read',
      'customers.create',
      'customers.update',
      'customers.manage',
    ];

    console.log('🔎 VERIFICANDO PERMISOS REQUERIDOS:');
    requiredPermissions.forEach(req => {
      const exists = permissions.includes(req);
      console.log(`   ${exists ? '✅' : '❌'} ${req}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();
