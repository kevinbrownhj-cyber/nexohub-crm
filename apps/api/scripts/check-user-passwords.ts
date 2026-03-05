import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserPasswords() {
  console.log('🔍 VERIFICANDO PASSWORDHASH DE USUARIOS\n');

  try {
    const users = await prisma.$queryRaw<any[]>`
      SELECT 
        email, 
        is_active,
        CASE 
          WHEN password_hash IS NULL THEN 'NULL'
          ELSE LEFT(password_hash, 7)
        END AS hash_prefix,
        LENGTH(password_hash) AS hash_len,
        created_at
      FROM users
      ORDER BY created_at DESC
    `;

    console.log('📊 USUARIOS EN BASE DE DATOS:\n');

    users.forEach((u, idx) => {
      console.log(`${idx + 1}. ${u.email}`);
      console.log(`   Activo: ${u.is_active}`);
      console.log(`   Hash prefix: ${u.hash_prefix}`);
      console.log(`   Hash length: ${u.hash_len}`);
      console.log(`   Creado: ${u.created_at}`);
      
      // Diagnóstico
      if (u.hash_prefix === 'NULL') {
        console.log(`   ❌ PROBLEMA: passwordHash es NULL`);
      } else if (!u.hash_prefix.startsWith('$2')) {
        console.log(`   ⚠️  ADVERTENCIA: No parece bcrypt (debería empezar con $2a$, $2b$, o $2y$)`);
      } else if (u.hash_len !== 60) {
        console.log(`   ⚠️  ADVERTENCIA: Longitud incorrecta (bcrypt debe ser 60 chars)`);
      } else {
        console.log(`   ✅ Hash válido (bcrypt)`);
      }
      console.log('');
    });

    // Resumen
    const nullHashes = users.filter(u => u.hash_prefix === 'NULL');
    const invalidHashes = users.filter(u => u.hash_prefix !== 'NULL' && !u.hash_prefix.startsWith('$2'));
    const validHashes = users.filter(u => u.hash_prefix !== 'NULL' && u.hash_prefix.startsWith('$2') && u.hash_len === 60);

    console.log('📋 RESUMEN:');
    console.log(`   ✅ Hashes válidos: ${validHashes.length}`);
    console.log(`   ❌ Hashes NULL: ${nullHashes.length}`);
    console.log(`   ⚠️  Hashes inválidos: ${invalidHashes.length}\n`);

    if (nullHashes.length > 0 || invalidHashes.length > 0) {
      console.log('🔧 ACCIÓN REQUERIDA:');
      console.log('   Ejecutar: npm run fix:passwords\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPasswords();
