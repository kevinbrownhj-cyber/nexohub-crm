import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createEmergencyAdmin() {
  console.log('🚀 Creando usuario admin de emergencia...\n');

  try {
    // 1) Buscar rol ADMIN
    const adminRole = await prisma.role.findUnique({
      where: { key: 'ADMIN' },
    });

    if (!adminRole) {
      console.error('❌ No se encontró el rol ADMIN');
      return;
    }

    console.log('✅ Rol ADMIN encontrado:', adminRole.name);

    // 2) Crear usuario admin
    const email = 'admin@servivial.com';
    const password = 'Admin123!'; // Contraseña simple para emergencia
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  El usuario ya existe, actualizando contraseña...');
      
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash: hashedPassword,
          isActive: true,
        },
      });

      // Verificar si tiene rol asignado
      const existingRole = await prisma.userRole.findFirst({
        where: { userId: existingUser.id },
      });

      if (!existingRole) {
        await prisma.userRole.create({
          data: {
            userId: existingUser.id,
            roleId: adminRole.id,
          },
        });
        console.log('✅ Rol ADMIN asignado al usuario existente');
      } else {
        console.log('✅ Usuario ya tiene rol asignado');
      }
    } else {
      // Crear nuevo usuario
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name: 'Admin Emergencia',
          isActive: true,
        },
      });

      // Asignar rol ADMIN
      await prisma.userRole.create({
        data: {
          userId: newUser.id,
          roleId: adminRole.id,
        },
      });

      console.log('✅ Nuevo usuario admin creado:', newUser.name);
    }

    console.log('\n🎉 USUARIO ADMIN CREADO EXITOSAMENTE');
    console.log('=====================================');
    console.log('📧 Email: admin@servivial.com');
    console.log('🔑 Contraseña: Admin123!');
    console.log('=====================================');
    console.log('\n⚠️  No olvides cambiar la contraseña después de usarla');

  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createEmergencyAdmin();
