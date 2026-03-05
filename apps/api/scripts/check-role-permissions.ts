import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRolePermissions() {
  console.log('🔍 VERIFICANDO PERMISOS POR ROL\n');

  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    roles.forEach(role => {
      console.log(`📋 ROL: ${role.name} (${role.key})`);
      console.log(`   Permisos: ${role.rolePermissions.length}\n`);

      const permissionsByCategory: Record<string, string[]> = {};

      role.rolePermissions.forEach(rp => {
        const key = rp.permission.key;
        const category = key.split('.')[0];
        
        if (!permissionsByCategory[category]) {
          permissionsByCategory[category] = [];
        }
        permissionsByCategory[category].push(key);
      });

      Object.keys(permissionsByCategory).sort().forEach(category => {
        console.log(`   ${category}:`);
        permissionsByCategory[category].forEach(perm => {
          console.log(`      - ${perm}`);
        });
        console.log('');
      });

      console.log('─'.repeat(60));
      console.log('');
    });

    // Análisis específico para TECNICO
    const tecnicoRole = roles.find(r => r.key === 'TECNICO');
    if (tecnicoRole) {
      console.log('🔎 ANÁLISIS TÉCNICO:\n');

      const hasCasesReadAll = tecnicoRole.rolePermissions.some(rp => rp.permission.key === 'cases.read_all');
      const hasCasesReadAssigned = tecnicoRole.rolePermissions.some(rp => rp.permission.key === 'cases.read_assigned');

      console.log(`   cases.read_all: ${hasCasesReadAll ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   cases.read_assigned: ${hasCasesReadAssigned ? '✅ SÍ' : '❌ NO'}`);
      console.log('');

      if (hasCasesReadAll) {
        console.log('   ⚠️  TÉCNICO VE TODOS LOS CASOS (cualquier estado, cualquier técnico)');
      } else if (hasCasesReadAssigned) {
        console.log('   ✅ TÉCNICO SOLO VE SUS CASOS ASIGNADOS');
      } else {
        console.log('   ❌ TÉCNICO NO PUEDE VER CASOS');
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRolePermissions();
