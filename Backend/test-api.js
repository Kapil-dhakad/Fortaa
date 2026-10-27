const http = require('http');

const API_BASE = 'http://localhost:3000';

function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log('   FORTAA API TEST - REGISTER & LOGIN  ');
  console.log('========================================\n');

  // Unique test user to avoid conflicts
  const timestamp = Date.now();
  const testUser = {
    accountType: 'Team Leader',
    name: 'Priya Sharma',
    email: `priya${timestamp}@fortaa.com`,
    password: 'Password@123',
    mobileNumber: '9' + timestamp.toString().slice(-9),
    dob: '15/03/1992',
    gender: 'Female',
    referralId: '',
    businessName: 'Priya Network Solutions',
    companyBrand: 'Forever Living',
    businessCategory: 'Health & Wellness',
    designation: 'Senior Team Leader',
    experience: '3-5 Years',
    mobileVerified: true,
    emailVerified: true,
  };

  // --- TEST 1: REGISTER ---
  console.log('TEST 1: POST /api/users/register');
  console.log('  Sending:', { name: testUser.name, email: testUser.email });
  try {
    const regRes = await apiCall('POST', '/api/users/register', testUser);
    if (regRes.status === 201 && regRes.body.success) {
      console.log('  ✅ REGISTER SUCCESS!');
      console.log('  Member ID  :', regRes.body.user.memberId);
      console.log('  User Name  :', regRes.body.user.name);
      console.log('  User Email :', regRes.body.user.email);
      console.log('  Account Type:', regRes.body.user.accountType);
      console.log('  Company     :', regRes.body.user.companyBrand);
      console.log('  Token       :', regRes.body.token.substring(0, 30) + '...\n');
    } else {
      console.log('  ❌ REGISTER FAILED:', regRes.status, regRes.body.message, '\n');
    }
  } catch (e) {
    console.log('  ❌ Server not reachable. Is `npm run dev` running in Backend?\n');
    process.exit(1);
  }

  // --- TEST 2: LOGIN ---
  console.log('TEST 2: POST /api/users/login');
  console.log('  Sending:', { email: testUser.email });
  try {
    const loginRes = await apiCall('POST', '/api/users/login', {
      email: testUser.email,
      password: testUser.password,
    });
    if (loginRes.status === 200 && loginRes.body.success) {
      console.log('  ✅ LOGIN SUCCESS!');
      console.log('  User Name  :', loginRes.body.user.name);
      console.log('  Member ID  :', loginRes.body.user.memberId);
      console.log('  Token      :', loginRes.body.token.substring(0, 30) + '...\n');
    } else {
      console.log('  ❌ LOGIN FAILED:', loginRes.status, loginRes.body.message, '\n');
    }
  } catch (e) {
    console.log('  ❌ Login test error:', e.message, '\n');
  }

  // --- TEST 3: DUPLICATE EMAIL ---
  console.log('TEST 3: POST /api/users/register (Duplicate Email - should fail)');
  try {
    const dupRes = await apiCall('POST', '/api/users/register', testUser);
    if (dupRes.status === 409) {
      console.log('  ✅ DUPLICATE DETECTION WORKS! Status:', dupRes.status);
      console.log('  Message:', dupRes.body.message, '\n');
    } else {
      console.log('  ⚠️ Unexpected response:', dupRes.status, dupRes.body.message, '\n');
    }
  } catch (e) {
    console.log('  ❌ Error:', e.message, '\n');
  }

  // --- TEST 4: WRONG PASSWORD ---
  console.log('TEST 4: POST /api/users/login (Wrong Password - should fail)');
  try {
    const wrongPassRes = await apiCall('POST', '/api/users/login', {
      email: testUser.email,
      password: 'WrongPassword999',
    });
    if (wrongPassRes.status === 401) {
      console.log('  ✅ WRONG PASSWORD REJECTED! Status:', wrongPassRes.status);
      console.log('  Message:', wrongPassRes.body.message, '\n');
    } else {
      console.log('  ⚠️ Unexpected:', wrongPassRes.status, wrongPassRes.body.message, '\n');
    }
  } catch (e) {
    console.log('  ❌ Error:', e.message, '\n');
  }

  console.log('========================================');
  console.log('   ALL TESTS COMPLETE!                  ');
  console.log('   Check pgAdmin > fortaa > users table ');
  console.log('   to see the new row in your database. ');
  console.log('========================================\n');
}

runTests();
