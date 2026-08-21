import http from 'http';
import pool from '../src/config/db.js';
import app from '../src/app.js';
import { initializeDatabase } from '../src/config/initDb.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, extraDetails = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName} ${extraDetails ? `(${extraDetails})` : ''}`);
  }
}

async function apiRequest(port, method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`http://localhost:${port}${path}`, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runPhase2Tests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 2 AUTH & RBAC VERIFICATION TESTS');
  console.log('======================================================\n');

  const TEST_PORT = 5088;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));

  try {
    // 0. Ensure clean DB with seeds
    console.log('📦 Step 0: Initializing Database...');
    await initializeDatabase();

    // ----------------------------------------------------
    // 1. SIGNUP VALIDATION & EXECUTION TESTS
    // ----------------------------------------------------
    console.log('\n📝 Step 1: Testing User Signup API (POST /api/auth/signup)...');

    // 1.1 Valid Signup
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const validSignupRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Christopher Nolan Director',
      email: uniqueEmail,
      password: 'StrongPass@123',
      address: '42 Hollywood Boulevard, Los Angeles, CA 90028'
    });

    assert(validSignupRes.status === 201, 'Valid signup returns HTTP 201 Created');
    assert(validSignupRes.data.success === true, 'Valid signup has success: true');
    assert(!!validSignupRes.data.data?.token, 'Valid signup returns JWT token');
    assert(validSignupRes.data.data?.user?.role === 'user', 'Valid signup assigns role "user"');
    assert(validSignupRes.data.data?.user?.password_hash === undefined, 'Signup response does NOT expose password_hash');

    // 1.2 Name Validation: too short (< 20 chars)
    const shortNameRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Short Name',
      email: `short_${Date.now()}@example.com`,
      password: 'StrongPass@123',
      address: '123 Valid Street Address'
    });
    assert(shortNameRes.status === 400, 'Signup rejects name < 20 characters (400 Bad Request)');
    assert(shortNameRes.data.errors?.some(e => e.includes('at least 20')), 'Error mentions 20 character minimum');

    // 1.3 Name Validation: too long (> 60 chars)
    const longNameRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'A'.repeat(65),
      email: `long_${Date.now()}@example.com`,
      password: 'StrongPass@123',
      address: '123 Valid Street Address'
    });
    assert(longNameRes.status === 400, 'Signup rejects name > 60 characters (400 Bad Request)');

    // 1.4 Address Validation: too long (> 400 chars)
    const longAddrRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Valid Name Longer Than Twenty',
      email: `longaddr_${Date.now()}@example.com`,
      password: 'StrongPass@123',
      address: 'A'.repeat(405)
    });
    assert(longAddrRes.status === 400, 'Signup rejects address > 400 characters (400 Bad Request)');

    // 1.5 Invalid Email
    const invalidEmailRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Valid Name Longer Than Twenty',
      email: 'not-a-valid-email',
      password: 'StrongPass@123',
      address: '123 Valid Street Address'
    });
    assert(invalidEmailRes.status === 400, 'Signup rejects invalid email format (400 Bad Request)');

    // 1.6 Password Complexity Tests
    const noUpperRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Valid Name Longer Than Twenty',
      email: `pwd1_${Date.now()}@example.com`,
      password: 'password@123', // missing uppercase
      address: '123 Valid Street Address'
    });
    assert(noUpperRes.status === 400, 'Signup rejects password without uppercase letter');

    const noSpecialRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Valid Name Longer Than Twenty',
      email: `pwd2_${Date.now()}@example.com`,
      password: 'Password1234', // missing special char
      address: '123 Valid Street Address'
    });
    assert(noSpecialRes.status === 400, 'Signup rejects password without special character');

    const shortPwdRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Valid Name Longer Than Twenty',
      email: `pwd3_${Date.now()}@example.com`,
      password: 'Pass@1', // < 8 chars
      address: '123 Valid Street Address'
    });
    assert(shortPwdRes.status === 400, 'Signup rejects password < 8 characters');

    const longPwdRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Valid Name Longer Than Twenty',
      email: `pwd4_${Date.now()}@example.com`,
      password: 'VeryLongPassword@123456789', // > 16 chars
      address: '123 Valid Street Address'
    });
    assert(longPwdRes.status === 400, 'Signup rejects password > 16 characters');

    // 1.7 Duplicate Email Prevention
    const duplicateEmailRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Duplicate Email Tester Account',
      email: uniqueEmail, // same as 1.1
      password: 'StrongPass@123',
      address: '123 Valid Street Address'
    });
    assert(duplicateEmailRes.status === 409, 'Signup returns HTTP 409 Conflict on duplicate email');

    // 1.8 Privilege Escalation Prevention (Role Tampering)
    const adminEscalationRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Hacker Attempting Privilege Escalation',
      email: `hacker_${Date.now()}@example.com`,
      password: 'StrongPass@123',
      address: '123 Valid Street Address',
      role: 'admin' // Attempting to force admin
    });
    assert(adminEscalationRes.status === 201, 'Signup succeeds but ignores client-supplied role');
    assert(adminEscalationRes.data.data?.user?.role === 'user', 'Client-supplied role "admin" is overridden to "user"');

    // ----------------------------------------------------
    // 2. UNIFIED LOGIN TESTS
    // ----------------------------------------------------
    console.log('\n🔑 Step 2: Testing Unified Login API (POST /api/auth/login)...');

    // 2.1 Admin Login
    const adminLoginRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'admin@roxiler.com',
      password: 'Admin@1234'
    });
    assert(adminLoginRes.status === 200, 'Admin login returns HTTP 200 OK');
    assert(adminLoginRes.data.data?.user?.role === 'admin', 'Admin login returns role "admin"');
    assert(!!adminLoginRes.data.data?.token, 'Admin login returns JWT token');
    assert(adminLoginRes.data.data?.user?.password_hash === undefined, 'Admin login does NOT expose password_hash');
    const adminToken = adminLoginRes.data.data?.token;

    // 2.2 Store Owner Login
    const ownerLoginRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'owner@store.com',
      password: 'Owner@1234'
    });
    assert(ownerLoginRes.status === 200, 'Store Owner login returns HTTP 200 OK');
    assert(ownerLoginRes.data.data?.user?.role === 'owner', 'Store Owner login returns role "owner"');
    const ownerToken = ownerLoginRes.data.data?.token;

    // 2.3 Normal User Login
    const userLoginRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'user@example.com',
      password: 'User@1234'
    });
    assert(userLoginRes.status === 200, 'Normal User login returns HTTP 200 OK');
    assert(userLoginRes.data.data?.user?.role === 'user', 'Normal User login returns role "user"');
    const userToken = userLoginRes.data.data?.token;

    // 2.4 Wrong Password
    const wrongPwdRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'admin@roxiler.com',
      password: 'WrongPassword@123'
    });
    assert(wrongPwdRes.status === 401, 'Login with wrong password returns HTTP 401 Unauthorized');
    assert(wrongPwdRes.data.message === 'Invalid email or password.', 'Generic error message on wrong password');

    // 2.5 Nonexistent Email
    const nonExistentRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'nonexistent_ghost_user@example.com',
      password: 'SomePassword@123'
    });
    assert(nonExistentRes.status === 401, 'Login with non-existent email returns HTTP 401 Unauthorized');

    // 2.6 Missing Body / Credentials
    const missingCredsRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {});
    assert(missingCredsRes.status === 400, 'Login with missing fields returns HTTP 400 Bad Request');

    // ----------------------------------------------------
    // 3. JWT AUTHENTICATION MIDDLEWARE TESTS
    // ----------------------------------------------------
    console.log('\n🛡️ Step 3: Testing JWT Authentication Middleware...');

    // 3.1 No Authorization Header
    const noHeaderRes = await apiRequest(TEST_PORT, 'GET', '/api/auth/me', null, null);
    assert(noHeaderRes.status === 401, 'Protected route without token returns HTTP 401 Unauthorized');

    // 3.2 Malformed Authorization Header
    const malformedRes = await fetch(`http://localhost:${TEST_PORT}/api/auth/me`, {
      headers: { 'Authorization': 'Basic 12345' }
    });
    assert(malformedRes.status === 401, 'Malformed auth header (Basic) returns HTTP 401 Unauthorized');

    // 3.3 Invalid Signature Token
    const invalidTokenRes = await apiRequest(TEST_PORT, 'GET', '/api/auth/me', null, 'invalid.token.signature');
    assert(invalidTokenRes.status === 401, 'Invalid token returns HTTP 401 Unauthorized');

    // ----------------------------------------------------
    // 4. ROLE-BASED ACCESS CONTROL (RBAC) TESTS
    // ----------------------------------------------------
    console.log('\n🔒 Step 4: Testing Role-Based Access Control (RBAC)...');

    // 4.1 Admin accessing Admin-only endpoint
    const adminAccessRes = await apiRequest(TEST_PORT, 'GET', '/api/test/admin-only', null, adminToken);
    assert(adminAccessRes.status === 200, 'Admin can access admin-only endpoint (200 OK)');

    // 4.2 Normal User accessing Admin-only endpoint
    const userAccessAdminRes = await apiRequest(TEST_PORT, 'GET', '/api/test/admin-only', null, userToken);
    assert(userAccessAdminRes.status === 403, 'Normal user accessing admin-only endpoint gets HTTP 403 Forbidden');

    // 4.3 Store Owner accessing Admin-only endpoint
    const ownerAccessAdminRes = await apiRequest(TEST_PORT, 'GET', '/api/test/admin-only', null, ownerToken);
    assert(ownerAccessAdminRes.status === 403, 'Store owner accessing admin-only endpoint gets HTTP 403 Forbidden');

    // 4.4 Unauthenticated accessing Admin-only endpoint
    const unauthAccessRes = await apiRequest(TEST_PORT, 'GET', '/api/test/admin-only', null, null);
    assert(unauthAccessRes.status === 401, 'Unauthenticated access to protected endpoint gets HTTP 401 Unauthorized');

    // 4.5 Multi-role endpoint (Owner or Admin)
    const ownerMultiRes = await apiRequest(TEST_PORT, 'GET', '/api/test/owner-or-admin', null, ownerToken);
    assert(ownerMultiRes.status === 200, 'Owner can access owner-or-admin endpoint (200 OK)');

    const adminMultiRes = await apiRequest(TEST_PORT, 'GET', '/api/test/owner-or-admin', null, adminToken);
    assert(adminMultiRes.status === 200, 'Admin can access owner-or-admin endpoint (200 OK)');

    const userMultiRes = await apiRequest(TEST_PORT, 'GET', '/api/test/owner-or-admin', null, userToken);
    assert(userMultiRes.status === 403, 'Normal user gets 403 Forbidden on owner-or-admin endpoint');

    // ----------------------------------------------------
    // 5. CURRENT USER PROFILE (GET /api/auth/me) TESTS
    // ----------------------------------------------------
    console.log('\n👤 Step 5: Testing Current User Profile (GET /api/auth/me)...');

    const meRes = await apiRequest(TEST_PORT, 'GET', '/api/auth/me', null, userToken);
    assert(meRes.status === 200, 'GET /api/auth/me returns HTTP 200 OK');
    assert(meRes.data.data?.user?.email === 'user@example.com', 'Profile contains correct email');
    assert(meRes.data.data?.user?.role === 'user', 'Profile contains correct role');
    assert(meRes.data.data?.user?.password_hash === undefined, 'Profile response does NOT expose password_hash');

    // ----------------------------------------------------
    // 6. CHANGE PASSWORD (PATCH /api/auth/change-password) TESTS
    // ----------------------------------------------------
    console.log('\n🔄 Step 6: Testing Change Password API (PATCH /api/auth/change-password)...');

    // Create a dedicated user for password change test
    const changeUserEmail = `change_pwd_${Date.now()}@example.com`;
    const signupForChange = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Password Changer Test Account',
      email: changeUserEmail,
      password: 'OldPassword@123',
      address: '777 Test Avenue, Floor 3'
    });
    const changeToken = signupForChange.data.data.token;

    // 6.1 Incorrect Current Password
    const wrongCurrentRes = await apiRequest(TEST_PORT, 'PATCH', '/api/auth/change-password', {
      currentPassword: 'WrongOldPassword@123',
      newPassword: 'NewPassword@123'
    }, changeToken);
    assert(wrongCurrentRes.status === 400, 'Change password rejects incorrect current password (400 Bad Request)');

    // 6.2 Invalid New Password (e.g. no special char)
    const invalidNewRes = await apiRequest(TEST_PORT, 'PATCH', '/api/auth/change-password', {
      currentPassword: 'OldPassword@123',
      newPassword: 'NewPassword123' // no special char
    }, changeToken);
    assert(invalidNewRes.status === 400, 'Change password rejects invalid new password complexity (400 Bad Request)');

    // 6.3 Successful Password Change
    const successfulChangeRes = await apiRequest(TEST_PORT, 'PATCH', '/api/auth/change-password', {
      currentPassword: 'OldPassword@123',
      newPassword: 'NewPassword@999'
    }, changeToken);
    assert(successfulChangeRes.status === 200, 'Change password succeeds with valid credentials (HTTP 200 OK)');

    // 6.4 Login with Old Password Must Fail
    const oldLoginAttempt = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: changeUserEmail,
      password: 'OldPassword@123'
    });
    assert(oldLoginAttempt.status === 401, 'Login with old password fails (HTTP 401 Unauthorized)');

    // 6.5 Login with New Password Must Succeed
    const newLoginAttempt = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: changeUserEmail,
      password: 'NewPassword@999'
    });
    assert(newLoginAttempt.status === 200, 'Login with newly set password succeeds (HTTP 200 OK)');

    // ----------------------------------------------------
    // 7. REGRESSION TEST (Phase 1 Health Check)
    // ----------------------------------------------------
    console.log('\n🩺 Step 7: Regression Check on Phase 1 Health Endpoint...');
    const healthRes = await apiRequest(TEST_PORT, 'GET', '/api/health');
    assert(healthRes.status === 200, 'GET /api/health still returns HTTP 200 OK');
    assert(healthRes.data.database?.status === 'connected', 'Database connection status is still "connected"');

    // ----------------------------------------------------
    // FINAL SUMMARY
    // ----------------------------------------------------
    console.log('\n======================================================');
    console.log(`📊 PHASE 2 TEST SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
    console.log('======================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Unexpected error during Phase 2 tests:', error);
    process.exit(1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

runPhase2Tests();
