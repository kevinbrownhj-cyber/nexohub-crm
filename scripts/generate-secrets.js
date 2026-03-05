#!/usr/bin/env node

/**
 * Script para generar secretos seguros para producción
 * Uso: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 GENERADOR DE SECRETOS PARA PRODUCCIÓN\n');
console.log('Copia estos valores a las variables de entorno en EasyPanel:\n');
console.log('─'.repeat(70));

const jwtAccessSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
const dbPassword = crypto.randomBytes(16).toString('hex');

console.log('\n# JWT Secrets');
console.log(`JWT_ACCESS_SECRET=${jwtAccessSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);

console.log('\n# Database Password (usar al crear PostgreSQL)');
console.log(`POSTGRES_PASSWORD=${dbPassword}`);

console.log('\n# Database URL (reemplazar PASSWORD con el valor de arriba)');
console.log(`DATABASE_URL=postgresql://nexohub:${dbPassword}@postgres:5432/nexohub_crm`);

console.log('\n' + '─'.repeat(70));
console.log('\n⚠️  IMPORTANTE: Guarda estos valores en un lugar seguro');
console.log('   NO los commitees al repositorio\n');
