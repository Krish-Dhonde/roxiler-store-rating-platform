import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/db.js';
import app from '../src/app.js';
import { initializeDatabase } from '../src/config/initDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function runPhase4Tests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 4 FRONTEND FOUNDATION & AUTH INTEGRATION TESTS');
  console.log('======================================================\n');

  const TEST_PORT = 5095;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));

  try {
    // 0. Ensure fresh database state
    console.log('📦 Step 0: Initializing Database & Seed Data...');
    await pool.query('DELETE FROM ratings');
    await pool.query('DELETE FROM stores');
    await pool.query('DELETE FROM users');
    await pool.query('ALTER TABLE ratings AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE stores AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE users AUTO_INCREMENT = 1');
    await initializeDatabase();

    // ----------------------------------------------------
    // 1. FRONTEND BUILD & BUNDLE VERIFICATION
    // ----------------------------------------------------
    console.log('\n🏗️ Step 1: Verifying Vite Client Build & Static Assets...');

    const distPath = path.resolve(__dirname, '../../client/dist');
    const indexHtmlPath = path.join(distPath, 'index.html');
    const assetsPath = path.join(distPath, 'assets');

    assert(fs.existsSync(distPath), 'Vite production build directory (dist/) exists');
    assert(fs.existsSync(indexHtmlPath), 'Production index.html exists in dist/');
    assert(fs.existsSync(assetsPath), 'Compiled assets directory exists in dist/assets/');

    const assetFiles = fs.readdirSync(assetsPath);
    const hasJsBundle = assetFiles.some((f) => f.endsWith('.js'));
    const hasCssBundle = assetFiles.some((f) => f.endsWith('.css'));

    assert(hasJsBundle, 'Vite production JS bundle generated successfully');
    assert(hasCssBundle, 'Vite production CSS bundle generated successfully');

    // ----------------------------------------------------
    // 2. AUTHENTICATION & LOGIN FLOW VERIFICATION
    // ----------------------------------------------------
    console.log('\n🔑 Step 2: Testing Authentication & Login API Flows...');

    // 2.1 Admin Login
    const adminLogin = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'admin@roxiler.com',
      password: 'Admin@1234'
    });
    assert(adminLogin.status === 200, 'Admin login returns 200 OK');
    assert(adminLogin.data.data?.user?.role === 'admin', 'Admin user has role "admin"');
    assert(!!adminLogin.data.data?.token, 'Admin login returns JWT token for localStorage');
    const adminToken = adminLogin.data.data.token;

    // 2.2 Store Owner Login
    const ownerLogin = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'owner@store.com',
      password: 'Owner@1234'
    });
    assert(ownerLogin.status === 200, 'Store Owner login returns 200 OK');
    assert(ownerLogin.data.data?.user?.role === 'owner', 'Store Owner user has role "owner"');
    const ownerToken = ownerLogin.data.data.token;

    // 2.3 Normal User Login
    const userLogin = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'user@example.com',
      password: 'User@1234'
    });
    assert(userLogin.status === 200, 'Normal User login returns 200 OK');
    assert(userLogin.data.data?.user?.role === 'user', 'Normal User has role "user"');
    const userToken = userLogin.data.data.token;

    // 2.4 Invalid Password
    const badLogin = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'user@example.com',
      password: 'WrongPassword@123'
    });
    assert(badLogin.status === 401, 'Invalid password returns 401 Unauthorized');
    assert(badLogin.data.message === 'Invalid email or password.', 'Error message prevents email enumeration');

    // ----------------------------------------------------
    // 3. SIGNUP VALIDATION & ACCOUNT REGISTRATION
    // ----------------------------------------------------
    console.log('\n📝 Step 3: Testing User Signup & Client Validation Matching...');

    const uniqueEmail = `newuser_${Date.now()}@example.com`;
    const signupRes = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Eleanor Vance Customer Account',
      email: uniqueEmail,
      address: '742 Evergreen Terrace, Sector 4, Springfield',
      password: 'StrongPass@123'
    });

    assert(signupRes.status === 201, 'Valid signup returns 201 Created');
    assert(signupRes.data.data?.user?.role === 'user', 'Signup assigns role "user"');
    assert(!!signupRes.data.data?.token, 'Signup returns token for automatic session login');
    const newUserToken = signupRes.data.data.token;

    // 3.1 Reject duplicate email
    const duplicateSignup = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Duplicate Attempt User Person',
      email: uniqueEmail,
      address: '123 Another Street',
      password: 'StrongPass@123'
    });
    assert(duplicateSignup.status === 409, 'Duplicate signup returns 409 Conflict');

    // 3.2 Reject short name (< 20 chars)
    const shortNameSignup = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Short Name',
      email: `short_${Date.now()}@example.com`,
      address: '123 Valid Street Address',
      password: 'StrongPass@123'
    });
    assert(shortNameSignup.status === 400, 'Signup rejects name < 20 characters (400 Bad Request)');

    // 3.3 Reject password without special char
    const weakPwdSignup = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Valid Name Longer Than Twenty',
      email: `weak_${Date.now()}@example.com`,
      address: '123 Valid Street Address',
      password: 'Password1234'
    });
    assert(weakPwdSignup.status === 400, 'Signup rejects password without special character (400 Bad Request)');

    // ----------------------------------------------------
    // 4. SESSION RESTORATION (GET /api/auth/me)
    // ----------------------------------------------------
    console.log('\n🔄 Step 4: Testing Session Hydration (GET /api/auth/me)...');

    // 4.1 Valid Token
    const meRes = await apiRequest(TEST_PORT, 'GET', '/api/auth/me', null, newUserToken);
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 OK with valid token');
    assert(meRes.data.data?.user?.email === uniqueEmail, 'Profile email matches authenticated user');
    assert(meRes.data.data?.user?.role === 'user', 'Profile role is accurate');
    assert(meRes.data.data?.user?.password_hash === undefined, 'Profile does NOT expose password_hash');

    // 4.2 Missing Token
    const noTokenRes = await apiRequest(TEST_PORT, 'GET', '/api/auth/me');
    assert(noTokenRes.status === 401, 'GET /api/auth/me returns 401 without token');

    // 4.3 Tampered / Invalid Token
    const invalidTokenRes = await apiRequest(TEST_PORT, 'GET', '/api/auth/me', null, 'invalid.tampered.token');
    assert(invalidTokenRes.status === 401, 'GET /api/auth/me returns 401 on tampered token');

    // ----------------------------------------------------
    // 5. CHANGE PASSWORD FLOW
    // ----------------------------------------------------
    console.log('\n🔒 Step 5: Testing Change Password Flow (PATCH /api/auth/change-password)...');

    // 5.1 Wrong Current Password
    const wrongCurrentPwd = await apiRequest(TEST_PORT, 'PATCH', '/api/auth/change-password', {
      currentPassword: 'IncorrectPassword@123',
      newPassword: 'BrandNewPass@99'
    }, newUserToken);
    assert(wrongCurrentPwd.status === 400, 'Change password rejects incorrect current password (400 Bad Request)');

    // 5.2 Successful Password Change
    const successfulPwdChange = await apiRequest(TEST_PORT, 'PATCH', '/api/auth/change-password', {
      currentPassword: 'StrongPass@123',
      newPassword: 'BrandNewPass@99'
    }, newUserToken);
    assert(successfulPwdChange.status === 200, 'Change password succeeds with valid current password (200 OK)');

    // 5.3 Login with Old Password Fails
    const oldLoginFail = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: uniqueEmail,
      password: 'StrongPass@123'
    });
    assert(oldLoginFail.status === 401, 'Login with previous password fails (401 Unauthorized)');

    // 5.4 Login with New Password Succeeds
    const newLoginSuccess = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: uniqueEmail,
      password: 'BrandNewPass@99'
    });
    assert(newLoginSuccess.status === 200, 'Login with updated password succeeds (200 OK)');

    // ----------------------------------------------------
    // 6. ROLE-BASED ACCESS CONTROL & ROUTE PROTECTION
    // ----------------------------------------------------
    console.log('\n🛡️ Step 6: Testing Role-Based API Boundaries & Access Control...');

    // 6.1 Admin accessing Admin Dashboard -> 200 OK
    const adminDashRes = await apiRequest(TEST_PORT, 'GET', '/api/admin/dashboard', null, adminToken);
    assert(adminDashRes.status === 200, 'Admin can access Admin Dashboard API (200 OK)');
    assert(adminDashRes.data.data?.totalUsers >= 4, 'Admin dashboard returns totalUsers metric');

    // 6.2 Normal User accessing Admin Dashboard -> 403 Forbidden
    const userAccessAdmin = await apiRequest(TEST_PORT, 'GET', '/api/admin/dashboard', null, userToken);
    assert(userAccessAdmin.status === 403, 'Normal user accessing admin endpoint receives 403 Forbidden');

    // 6.3 Store Owner accessing Admin Dashboard -> 403 Forbidden
    const ownerAccessAdmin = await apiRequest(TEST_PORT, 'GET', '/api/admin/dashboard', null, ownerToken);
    assert(ownerAccessAdmin.status === 403, 'Store owner accessing admin endpoint receives 403 Forbidden');

    // 6.4 Store Owner accessing Owner Stores -> 200 OK
    const ownerStoresRes = await apiRequest(TEST_PORT, 'GET', '/api/owner/stores', null, ownerToken);
    assert(ownerStoresRes.status === 200, 'Store owner can access Owner Stores API (200 OK)');

    // 6.5 Normal User accessing Owner Stores -> 403 Forbidden
    const userAccessOwner = await apiRequest(TEST_PORT, 'GET', '/api/owner/stores', null, userToken);
    assert(userAccessOwner.status === 403, 'Normal user accessing owner endpoint receives 403 Forbidden');

    // ----------------------------------------------------
    // 7. PUBLIC STORE EXPLORER API FOUNDATION
    // ----------------------------------------------------
    console.log('\n🛒 Step 7: Testing Public / User Store Explorer API Foundation...');

    // 7.1 Guest Browsing
    const guestStores = await apiRequest(TEST_PORT, 'GET', '/api/stores');
    assert(guestStores.status === 200, 'Guest can query public stores list (200 OK)');
    assert(guestStores.data.data?.stores.length >= 2, 'Store list returns seeded stores');
    assert(guestStores.data.data?.stores.every((s) => s.myRating === null), 'Guest browsing has myRating: null');

    // 7.2 Authenticated Browsing with Personal Rating
    const userStores = await apiRequest(TEST_PORT, 'GET', '/api/stores', null, userToken);
    assert(userStores.status === 200, 'Authenticated user can query stores (200 OK)');
    const userRatedStore = userStores.data.data?.stores.find((s) => s.id === 1);
    assert(userRatedStore && userRatedStore.myRating === 5, 'User sees their personal rating (myRating: 5)');

    // 7.3 Store Search by Keyword
    const searchStoreRes = await apiRequest(TEST_PORT, 'GET', '/api/stores?search=Electronics');
    assert(searchStoreRes.status === 200, 'Store search returns 200 OK');
    assert(searchStoreRes.data.data?.stores.some((s) => s.name.includes('Electronics')), 'Search query filters stores by keyword');

    // ----------------------------------------------------
    // 8. REGRESSION CHECK (Phase 1 Health Endpoint)
    // ----------------------------------------------------
    console.log('\n🩺 Step 8: Regression Check on Phase 1 Health Endpoint...');
    const healthRes = await apiRequest(TEST_PORT, 'GET', '/api/health');
    assert(healthRes.status === 200, 'Phase 1 /api/health returns 200 OK');
    assert(healthRes.data.database?.status === 'connected', 'Database connection status is healthy');

    // ----------------------------------------------------
    // FINAL SUMMARY
    // ----------------------------------------------------
    console.log('\n======================================================');
    console.log(`📊 PHASE 4 TEST SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
    console.log('======================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Unexpected error during Phase 4 tests:', error);
    process.exit(1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

runPhase4Tests();
