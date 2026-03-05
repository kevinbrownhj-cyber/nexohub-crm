const axios = require('axios');

async function testLoginAPI() {
  console.log('🔍 Probando login contra el API...\n');

  try {
    const response = await axios.post('http://localhost:3000/auth/login', {
      email: 'admin@servivial.com',
      password: 'Admin123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ LOGIN EXITOSO!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR EN LOGIN');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
    console.log('Full error:', JSON.stringify(error.response?.data, null, 2));
  }
}

testLoginAPI();
