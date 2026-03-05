import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkUser() {
  const email = 'serviexpressvial@gmail.com';
  const password = 'ro%5a8pfcRuNwjl';

  console.log('🔍 VERIFICANDO USUARIO:', email);
  console.log('🔑 Contraseña ingresada:', password);
  console.log('');

  try {
    const user = await prisma.user.findUnique({
      where: { email },
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

    if (!user) {
      console.log('❌ USUARIO NO EXISTE EN BD');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log('   Email:', user.email);
    console.log('   Nombre:', user.name);
    console.log('   isActive:', user.isActive);
    console.log('   deletedAt:', user.deletedAt);
    console.log('   passwordHash existe:', !!user.passwordHash);
    console.log('   passwordHash length:', user.passwordHash?.length);
    console.log('   passwordHash prefix:', user.passwordHash?.substring(0, 7));
    console.log('');

    // Verificar roles
    console.log('📋 Roles asignados:', user.userRoles.length);
    user.userRoles.forEach(ur => {
      console.log('   -', ur.role.name, `(${ur.role.key})`);
    });
    console.log('');

    // Verificar contraseña
    if (!user.passwordHash) {
      console.log('❌ PROBLEMA: passwordHash es NULL');
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('🔐 Verificación de contraseña:', isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
    console.log('');

    // Verificar condiciones de login
    console.log('📊 Condiciones de login:');
    console.log('   Usuario existe:', !!user);
    console.log('   isActive:', user.isActive);
    console.log('   NO eliminado:', !user.deletedAt);
    console.log('   Contraseña válida:', isValid);
    console.log('');

    if (user && user.isActive && !user.deletedAt && isValid) {
      console.log('✅ DEBERÍA PODER HACER LOGIN');
    } else {
      console.log('❌ NO PUEDE HACER LOGIN:');
      if (!user.isActive) console.log('   - Usuario inactivo');
      if (user.deletedAt) console.log('   - Usuario eliminado');
      if (!isValid) console.log('   - Contraseña incorrecta');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
