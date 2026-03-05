import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateAlexis() {
  console.log('🔧 Activando usuario alexisserrano@gmail.com...\n');

  try {
    const updated = await prisma.user.update({
      where: { email: 'alexisserrano@gmail.com' },
      data: { isActive: true },
    });

    console.log('✅ Usuario activado exitosamente:');
    console.log(`   Email: ${updated.email}`);
    console.log(`   Nombre: ${updated.name}`);
    console.log(`   Activo: ${updated.isActive}`);
    console.log('\n🎯 Ahora puedes hacer login con este usuario');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateAlexis();
