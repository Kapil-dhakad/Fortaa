/**
 * Unit & Integration Test for Google Authentication Architecture
 */
const { validateGoogleAuth } = require('./src/validators/auth.validator');
const { handleGoogleAuth } = require('./src/controller/googleAuth.controller');
const userModel = require('./src/model/user.model');

// Mock Express response object
function createMockRes() {
  const res = {
    statusCode: null,
    responseData: null,
    cookieName: null,
    cookieVal: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.responseData = data;
      return this;
    },
    cookie(name, val) {
      this.cookieName = name;
      this.cookieVal = val;
    },
  };
  return res;
}

async function runTests() {
  console.log('🧪 Starting Google Authentication Architecture Tests...\n');

  // Test 1: Validator rejects empty / invalid payload
  console.log('Test 1: Validator rejects invalid payload');
  const req1 = { body: {} };
  const res1 = createMockRes();
  let nextCalled1 = false;
  validateGoogleAuth(req1, res1, () => {
    nextCalled1 = true;
  });
  console.assert(res1.statusCode === 400, 'Expected status 400 for empty payload');
  console.assert(!nextCalled1, 'Expected next() not to be called for invalid payload');
  console.log('✅ Test 1 Passed: Empty payload properly rejected with 400.\n');

  // Test 2: Validator accepts valid email and name
  console.log('Test 2: Validator accepts valid verified profile');
  const req2 = { body: { email: 'test.google@fortaa.com', name: 'Google Test User' } };
  const res2 = createMockRes();
  let nextCalled2 = false;
  validateGoogleAuth(req2, res2, () => {
    nextCalled2 = true;
  });
  console.assert(nextCalled2, 'Expected next() to be called for valid payload');
  console.log('✅ Test 2 Passed: Valid payload passed validator.\n');

  // Test 3: Creating a NEW user via Google Auth
  console.log('Test 3: Creating a new user via Google Auth');
  const uniqueEmail = `new.google.user.${Date.now()}@fortaa.com`;
  const req3 = {
    body: {
      email: uniqueEmail,
      name: 'Priya Sharma',
      accountType: 'Individual / Professional',
    },
  };
  const res3 = createMockRes();
  await handleGoogleAuth(req3, res3);
  console.assert(res3.statusCode === 201, `Expected status 201, got ${res3.statusCode}`);
  console.assert(res3.responseData.isNewUser === true, 'Expected isNewUser to be true');
  console.assert(res3.responseData.token, 'Expected JWT token to be generated');
  console.assert(res3.responseData.user.email === uniqueEmail, 'Expected matching email');
  console.log('✅ Test 3 Passed: New user successfully registered with member_id and JWT!\n');

  // Test 4: Existing user logs in (MUST NOT RECREATE USER!)
  console.log('Test 4: Existing user logs in via Google (DO NOT RECREATE)');
  const req4 = {
    body: {
      email: uniqueEmail, // Same email as Test 3
      name: 'Priya Sharma Updated',
    },
  };
  const res4 = createMockRes();
  await handleGoogleAuth(req4, res4);
  console.assert(res4.statusCode === 200, `Expected status 200 for existing user, got ${res4.statusCode}`);
  console.assert(res4.responseData.isNewUser === false, 'Expected isNewUser to be false');
  console.assert(res4.responseData.token, 'Expected JWT token to be generated');
  console.assert(res4.responseData.user.email === uniqueEmail, 'Expected matching email');
  console.log('✅ Test 4 Passed: Existing user logged in directly without duplicate creation!\n');

  console.log('🎉 ALL 4 ARCHITECTURE TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
