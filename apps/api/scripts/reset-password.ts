import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log('❌ Uso: npx ts-node scripts/reset-password.ts <email> <password>');
    process.exit(1);
  }

  console.log('🔄 Reseteando contraseña para:', email);
  console.log('🔑 Nueva contraseña:', newPassword);
  console.log('');

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        isActive: true,
        deletedAt: null,
      },
    });

    console.log('✅ Contraseña actualizada exitosamente');
    console.log('✅ Usuario activado');
    console.log('');
    console.log('📋 Credenciales:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('');
    console.log('🔐 Puedes hacer login ahora');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
