import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin() {
  console.log('🔍 Probando login para: admin@servivial.com\n');

  try {
    // 1) Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: 'admin@servivial.com' },
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Activo: ${user.isActive}`);
    console.log(`   Eliminado: ${user.deletedAt ? 'SÍ' : 'NO'}`);
    console.log('');

    // 2) Verificar contraseña
    const testPassword = 'Admin123!';
    const isPasswordValid = await bcrypt.compare(testPassword, user.passwordHash);

    console.log('🔐 Verificación de contraseña:');
    console.log(`   Contraseña probada: ${testPassword}`);
    console.log(`   ¿Es válida?: ${isPasswordValid ? '✅ SÍ' : '❌ NO'}`);
    console.log('');

    if (!isPasswordValid) {
      console.log('❌ La contraseña NO coincide');
      console.log('💡 Regenerando contraseña...');
      
      const newHash = await bcrypt.hash(testPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
      
      console.log('✅ Contraseña actualizada correctamente');
      console.log('');
    }

    // 3) Verificar rol
    const userRole = await prisma.userRole.findFirst({
      where: { userId: user.id },
      include: { role: true },
    });
    
    console.log('👤 Rol asignado:');
    if (userRole) {
      console.log(`   Rol: ${userRole.role.name} (${userRole.role.key})`);
    } else {
      console.log('   ❌ Sin rol asignado');
    }
    console.log('');

    // 4) Verificar condiciones de login
    console.log('🔍 Verificación de condiciones:');
    console.log(`   ✅ Usuario existe: ${!!user}`);
    console.log(`   ${user.isActive ? '✅' : '❌'} Usuario activo: ${user.isActive}`);
    console.log(`   ${!user.deletedAt ? '✅' : '❌'} Usuario NO eliminado: ${!user.deletedAt}`);
    console.log(`   ${isPasswordValid ? '✅' : '❌'} Contraseña válida: ${isPasswordValid}`);
    console.log('');

    if (user.isActive && !user.deletedAt && isPasswordValid) {
      console.log('🎉 ¡TODO CORRECTO! El login debería funcionar');
      console.log('');
      console.log('📋 CREDENCIALES CONFIRMADAS:');
      console.log('=====================================');
      console.log('📧 Email: admin@servivial.com');
      console.log('🔑 Contraseña: Admin123!');
      console.log('=====================================');
    } else {
      console.log('❌ Hay problemas que impiden el login');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
