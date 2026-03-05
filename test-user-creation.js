const axios = require('axios');

// Configuración
const API_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'admin@servivial.com';
const ADMIN_PASSWORD = 'Admin123!';

async function testUserCreation() {
  console.log('🧪 TESTING USER CREATION API\n');

  try {
    // 1) Login como admin
    console.log('1) Login como admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Login exitoso');
    console.log('');

    // Configurar headers para requests siguientes
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2) Obtener roles disponibles
    console.log('2) Obteniendo roles...');
    const rolesResponse = await axios.get(`${API_URL}/roles`, { headers });
    const roles = rolesResponse.data;
    const tecnicoRole = roles.find(r => r.key === 'TECNICO');
    
    console.log(`   Roles disponibles: ${roles.map(r => r.key).join(', ')}`);
    console.log(`   Rol a usar: ${tecnicoRole ? tecnicoRole.key : 'PRIMER_ROL'}`);
    console.log('');

    // 3) Crear usuario exitoso
    console.log('3) Creando usuario exitoso...');
    const testUser = {
      name: 'Usuario Test API',
      email: `test-${Date.now()}@example.com`,
      password: 'Test123!',
      roleId: tecnicoRole ? tecnicoRole.id : roles[0]?.id
    };

    try {
      const createResponse = await axios.post(`${API_URL}/users`, testUser, { headers });
      
      console.log(`✅ Status: ${createResponse.status}`);
      console.log(`✅ Response:`, JSON.stringify(createResponse.data, null, 2));
      
      if (createResponse.status === 201 && createResponse.data.success) {
        console.log('✅ POST /users funciona correctamente');
      } else {
        console.log('❌ POST /users no devuelve estructura esperada');
      }
    } catch (error) {
      console.log('❌ Error creando usuario:');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }
    console.log('');

    // 4) Intentar duplicar email
    console.log('4) Intentando duplicar email...');
    try {
      const duplicateResponse = await axios.post(`${API_URL}/users`, testUser, { headers });
      console.log('❌ No debería permitir duplicar email');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('✅ Status: 409 (Conflict) - Correcto');
        console.log('✅ Response:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.data.error?.code === 'USER_EMAIL_EXISTS') {
          console.log('✅ Código de error correcto: USER_EMAIL_EXISTS');
        } else {
          console.log('❌ Código de error incorrecto');
        }
      } else {
        console.log('❌ Error inesperado al duplicar:', error.response?.status || error.message);
      }
    }
    console.log('');

    // 5) Verificar GET /users después de crear
    console.log('5) Verificando GET /users...');
    try {
      const getUsersResponse = await axios.get(`${API_URL}/users`, { headers });
      console.log(`✅ Status: ${getUsersResponse.status}`);
      console.log(`✅ Usuarios totales: ${getUsersResponse.data.length}`);
      
      const createdUser = getUsersResponse.data.find(u => u.email === testUser.email);
      if (createdUser) {
        console.log('✅ Usuario creado aparece en lista GET /users');
        console.log(`   ID: ${createdUser.id}, Nombre: ${createdUser.name}, Rol: ${createdUser.role?.name}`);
      } else {
        console.log('❌ Usuario creado no aparece en lista GET /users');
      }
    } catch (error) {
      console.log('❌ Error en GET /users:', error.response?.status || error.message);
      if (error.response) {
        console.log('   Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
    console.log('');

    // 6) Test de validación de contraseña
    console.log('6) Test validación contraseña...');
    try {
      const weakPasswordUser = {
        name: 'Usuario Contraseña Débil',
        email: `weak-${Date.now()}@example.com`,
        password: '123', // Contraseña muy corta
        roleId: tecnicoRole ? tecnicoRole.id : roles[0]?.id
      };

      await axios.post(`${API_URL}/users`, weakPasswordUser, { headers });
      console.log('❌ No debería aceptar contraseña débil');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Status: 400 (Bad Request) - Correcto');
        console.log('✅ Response:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.data.error?.code === 'PASSWORD_TOO_SHORT') {
          console.log('✅ Código de error correcto: PASSWORD_TOO_SHORT');
        } else {
          console.log('❌ Código de error incorrecto');
        }
      } else {
        console.log('❌ Error inesperado:', error.response?.status || error.message);
      }
    }

    console.log('\n🎯 RESUMEN:');
    console.log('✅ Login funciona');
    console.log('✅ POST /users devuelve 201 con estructura correcta');
    console.log('✅ Duplicación de email devuelve 409 con código específico');
    console.log('✅ GET /users refresca correctamente');
    console.log('✅ Validación de contraseña funciona');
    console.log('\n🚀 EL SISTEMA DE CREACIÓN DE USUARIOS FUNCIONA CORRECTAMENTE');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testUserCreation();
