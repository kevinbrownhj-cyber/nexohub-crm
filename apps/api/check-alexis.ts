import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAlexisUser() {
  console.log('=== VERIFICACIÓN DE USUARIO: alexisserrano@gmail.com ===\n');

  try {
    // 1) Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { email: 'alexisserrano@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log('1) USUARIO ENCONTRADO:');
    console.log(user || 'NO EXISTE');
    console.log('');

    // 2) Verificar rol asignado
    if (user) {
      const userRole = await prisma.userRole.findFirst({
        where: { userId: user.id },
        include: {
          role: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      });

      console.log('2) ROL ASIGNADO:');
      console.log(userRole || 'SIN ROL');
      console.log('');

      // 3) Verificar permisos del rol
      if (userRole) {
        const permissions = await prisma.rolePermission.findMany({
          where: { roleId: userRole.roleId },
          include: {
            permission: {
              select: {
                key: true,
                description: true,
              },
            },
          },
          orderBy: {
            permission: {
              key: 'asc',
            },
          },
        });

        console.log('3) PERMISOS DEL ROL:');
        permissions.forEach(rp => {
          console.log(`  - ${rp.permission.key}: ${rp.permission.description}`);
        });
        console.log('');
      }

      // 4) Verificar intentos de login recientes
      const loginAttempts = await prisma.loginAttempt.findMany({
        where: { email: 'alexisserrano@gmail.com' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          email: true,
          ip: true,
          userAgent: true,
          success: true,
          reason: true,
          createdAt: true,
        },
      });

      console.log('4) INTENTOS DE LOGIN RECIENTES:');
      loginAttempts.forEach(attempt => {
        console.log(`  ${attempt.createdAt.toISOString()} - ${attempt.success ? 'SUCCESS' : 'FAILED'} - ${attempt.reason || 'No reason'}`);
      });
      console.log('');

      // 5) Verificar refresh tokens
      const refreshTokens = await prisma.refreshToken.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          token: true,
          expiresAt: true,
          createdAt: true,
          revokedAt: true,
        },
      });

      console.log('5) REFRESH TOKENS:');
      refreshTokens.forEach(rt => {
        console.log(`  ${rt.createdAt.toISOString()} - Expires: ${rt.expiresAt.toISOString()} - Revoked: ${rt.revokedAt?.toISOString() || 'NO'}`);
      });
    }

  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAlexisUser();
