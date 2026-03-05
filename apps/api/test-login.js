const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Buscando usuario admin@nexohub.com...');
    const user = await prisma.user.findUnique({
      where: { email: 'admin@nexohub.com' }
    });
    
    console.log('📦 Usuario encontrado:', JSON.stringify(user, null, 2));
    console.log('🔑 user.id:', user?.id);
    console.log('📧 user.email:', user?.email);
    console.log('🔐 user.passwordHash:', user?.passwordHash?.substring(0, 20) + '...');
    
    if (user) {
      const isValid = await bcrypt.compare('Admin123!', user.passwordHash);
      console.log('✅ Password válido:', isValid);
      
      const { passwordHash, ...result } = user;
      console.log('📤 Objeto después de destructuring:', JSON.stringify(result, null, 2));
      console.log('🆔 result.id:', result.id);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
