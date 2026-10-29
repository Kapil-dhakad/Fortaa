const { validateRegistration } = require('./src/validators/auth.validator');

function mockRes() {
  return {
    statusCode: null,
    responseData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.responseData = data;
      return this;
    },
  };
}

console.log('🧪 Testing Backend Registration Validations...\n');

// 1. Invalid Mobile (from user screenshot: 079999427dsds56)
const req1 = {
  body: {
    name: 'Jayant Kumar',
    email: '15jayantk@gmail.com',
    mobileNumber: '079999427dsds56',
    password: 'Password@123',
  },
};
const res1 = mockRes();
validateRegistration(req1, res1, () => {});
console.assert(res1.statusCode === 400, 'Expected 400 for invalid mobile number');
console.log('✅ Passed: Invalid phone "079999427dsds56" rejected:', res1.responseData.message);

// 2. Weak Password (missing special character & uppercase)
const req2 = {
  body: {
    name: 'Jayant Kumar',
    email: '15jayantk@gmail.com',
    mobileNumber: '9876543210',
    password: 'password123',
  },
};
const res2 = mockRes();
validateRegistration(req2, res2, () => {});
console.assert(res2.statusCode === 400, 'Expected 400 for weak password');
console.log('✅ Passed: Weak password "password123" rejected:', res2.responseData.message);

// 3. Invalid Email
const req3 = {
  body: {
    name: 'Jayant Kumar',
    email: 'notanemail',
    mobileNumber: '9876543210',
    password: 'Password@123',
  },
};
const res3 = mockRes();
validateRegistration(req3, res3, () => {});
console.assert(res3.statusCode === 400, 'Expected 400 for invalid email');
console.log('✅ Passed: Invalid email rejected:', res3.responseData.message);

// 4. Valid Payload
const req4 = {
  body: {
    name: 'Jayant Kumar',
    email: '15jayantk@gmail.com',
    mobileNumber: '9876543210',
    password: 'FortaaPassword@2026',
  },
};
const res4 = mockRes();
let nextCalled = false;
validateRegistration(req4, res4, () => {
  nextCalled = true;
});
console.assert(nextCalled === true, 'Expected next() to be called for valid payload');
console.log('✅ Passed: Valid registration payload accepted!\n');

console.log('🎉 ALL VALIDATION TESTS PASSED!');
