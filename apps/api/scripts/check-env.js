#!/usr/bin/env node

/**
 * Script de protección para migraciones destructivas
 * Bloquea migrate dev y migrate reset fuera de development
 */

const env = process.env.NODE_ENV || 'development';

if (env !== 'development') {
  console.error('\n❌ ERROR: Operación bloqueada por seguridad\n');
  console.error('   migrate dev y migrate reset solo pueden ejecutarse en NODE_ENV=development');
  console.error(`   NODE_ENV actual: ${env}\n`);
  console.error('   Para ambientes staging/production, usa:');
  console.error('   - npm run db:migrate (prisma migrate deploy)\n');
  process.exit(1);
}

console.log('✅ Verificación de entorno: development - Permitido\n');
