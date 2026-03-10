const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'serviexpressvial@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'S3rv!XpressVial#2026';

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email,
      passwordHash,
      name: 'Administrador',
      isActive: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { key: 'ADMIN' },
    update: {},
    create: {
      key: 'ADMIN',
      name: 'Administrador',
      description: 'Acceso completo al sistema',
    },
  });

  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: adminRole.id,
    },
  });

  console.log(`✅ Admin user ensured: ${email}`);
  console.log(`🔐 Password set to: ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ Failed to set admin password:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
