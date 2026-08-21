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

async function runPhase5Tests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 5 DASHBOARDS & PRODUCTION UI INTEGRATION TESTS');
  console.log('======================================================\n');

  const TEST_PORT = 5096;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));

  try {
    // 0. Database Fresh Initialization
    console.log('📦 Step 0: Initializing Database & Seed Data...');
    await pool.query('DELETE FROM ratings');
    await pool.query('DELETE FROM stores');
    await pool.query('DELETE FROM users');
    await pool.query('ALTER TABLE ratings AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE stores AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE users AUTO_INCREMENT = 1');
    await initializeDatabase();

    // ----------------------------------------------------
    // 1. FRONTEND PRODUCTION BUILD & ASSETS VERIFICATION
    // ----------------------------------------------------
    console.log('\n🏗️ Step 1: Verifying Production Vite Build & Component Bundles...');
    const distPath = path.resolve(__dirname, '../../client/dist');
    const indexHtmlPath = path.join(distPath, 'index.html');
    const assetsPath = path.join(distPath, 'assets');

    assert(fs.existsSync(distPath), 'Vite production build directory (dist/) exists');
    assert(fs.existsSync(indexHtmlPath), 'Production index.html exists in dist/');
    assert(fs.existsSync(assetsPath), 'Compiled static assets directory exists in dist/assets/');

    const assetFiles = fs.readdirSync(assetsPath);
    assert(assetFiles.some((f) => f.endsWith('.js')), 'Production JS bundle generated');
    assert(assetFiles.some((f) => f.endsWith('.css')), 'Production CSS bundle generated');

    // ----------------------------------------------------
    // 2. ADMIN PERSONA FULL WORKFLOW
    // ----------------------------------------------------
    console.log('\n👑 Step 2: Testing Administrator Persona Full Workflow...');

    // 2.1 Admin Login
    const adminLogin = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'admin@roxiler.com',
      password: 'Admin@1234'
    });
    assert(adminLogin.status === 200, 'Admin login succeeds (200 OK)');
    const adminToken = adminLogin.data.data.token;

    // 2.2 Dashboard Stats
    const dashStats = await apiRequest(TEST_PORT, 'GET', '/api/admin/dashboard', null, adminToken);
    assert(dashStats.status === 200, 'Admin dashboard stats returns 200 OK');
    assert(dashStats.data.data.totalUsers >= 3, 'Dashboard reports totalUsers count');
    assert(dashStats.data.data.totalStores >= 2, 'Dashboard reports totalStores count');
    assert(dashStats.data.data.totalRatings >= 1, 'Dashboard reports totalRatings count');

    // 2.3 Admin Creates a New Store Owner Account
    const newOwnerRes = await apiRequest(TEST_PORT, 'POST', '/api/admin/users', {
      name: 'Oliver Queen Emerald Owner',
      email: 'oliver.queen@starling.com',
      password: 'OwnerPass@123',
      address: 'Queen Consolidated Tower, Starling City',
      role: 'owner'
    }, adminToken);
    assert(newOwnerRes.status === 201, 'Admin can create a new Store Owner account (201 Created)');
    assert(newOwnerRes.data.data.user.role === 'owner', 'Created user has role "owner"');
    const newOwnerId = newOwnerRes.data.data.user.id;

    // 2.4 Admin Creates a New Normal User Account
    const newUserRes = await apiRequest(TEST_PORT, 'POST', '/api/admin/users', {
      name: 'Barry Allen Central Customer',
      email: 'barry.allen@starlabs.com',
      password: 'UserPass@123',
      address: 'Central City Police Department, Sector 2',
      role: 'user'
    }, adminToken);
    assert(newUserRes.status === 201, 'Admin can create a new Customer user (201 Created)');
    assert(newUserRes.data.data.user.role === 'user', 'Created user has role "user"');

    // 2.5 Admin Queries Users with Role Filter & Sorting
    const userListRes = await apiRequest(TEST_PORT, 'GET', '/api/admin/users?role=owner&sortBy=name&order=ASC', null, adminToken);
    assert(userListRes.status === 200, 'Admin can list users with role filter and sorting (200 OK)');
    assert(userListRes.data.data.users.every((u) => u.role === 'owner'), 'All returned users match role "owner"');
    assert(userListRes.data.data.users.some((u) => u.email === 'oliver.queen@starling.com'), 'Newly created owner is present in query');

    // 2.6 Admin Registers a New Store and Assigns to Owner
    const createStoreRes = await apiRequest(TEST_PORT, 'POST', '/api/admin/stores', {
      name: 'Starling Archery & Sporting Goods',
      email: 'contact@starlingarchery.com',
      address: '452 Glades Boulevard, Starling City',
      ownerId: newOwnerId
    }, adminToken);
    assert(createStoreRes.status === 201, 'Admin registers a new store with assigned owner (201 Created)');
    assert(createStoreRes.data.data.store.name === 'Starling Archery & Sporting Goods', 'Store has correct name');
    const newStoreId = createStoreRes.data.data.store.id;

    // 2.7 Admin Lists Stores with Sorting & Search
    const storeListRes = await apiRequest(TEST_PORT, 'GET', '/api/admin/stores?name=Starling&sortBy=name&order=ASC', null, adminToken);
    assert(storeListRes.status === 200, 'Admin can search and list stores (200 OK)');
    assert(storeListRes.data.data.stores.some((s) => s.id === newStoreId), 'Newly created store is found via search');
    const matchedStore = storeListRes.data.data.stores.find((s) => s.id === newStoreId);
    assert(matchedStore.ownerName === 'Oliver Queen Emerald Owner', 'Store shows assigned owner name');

    // ----------------------------------------------------
    // 3. NORMAL USER STORE EXPLORER & RATING WORKFLOW
    // ----------------------------------------------------
    console.log('\n⭐ Step 3: Testing Normal User Store Explorer & Rating Interactions...');

    // 3.1 Customer Login
    const custLogin = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'barry.allen@starlabs.com',
      password: 'UserPass@123'
    });
    assert(custLogin.status === 200, 'Customer login succeeds (200 OK)');
    const custToken = custLogin.data.data.token;

    // 3.2 Customer Searches Stores Directory
    const custStoreSearch = await apiRequest(TEST_PORT, 'GET', '/api/stores?search=Starling', null, custToken);
    assert(custStoreSearch.status === 200, 'Customer can search stores by keyword (200 OK)');
    const targetStore = custStoreSearch.data.data.stores.find((s) => s.id === newStoreId);
    assert(targetStore !== undefined, 'Target store found in store directory');
    assert(targetStore.myRating === null, 'Customer has not rated target store yet (myRating: null)');
    assert(targetStore.overallRating === 0, 'New store has overallRating: 0');
    assert(targetStore.totalRatings === 0, 'New store has totalRatings: 0');

    // 3.3 Customer Submits 4-Star Rating via POST /api/ratings
    const submitRatingRes = await apiRequest(TEST_PORT, 'POST', '/api/ratings', {
      storeId: newStoreId,
      rating: 4
    }, custToken);
    assert(submitRatingRes.status === 201, 'Customer submits rating of 4 stars (201 Created)');
    assert(submitRatingRes.data.data.rating.rating === 4, 'Submitted rating record has rating = 4');

    // 3.4 Verify Server-Side Rating Aggregate Recalculation (Source of Truth)
    const refreshedStore = await apiRequest(TEST_PORT, 'GET', `/api/stores/${newStoreId}`, null, custToken);
    assert(refreshedStore.status === 200, 'GET /api/stores/:id returns 200 OK');
    assert(refreshedStore.data.data.store.overallRating === 4, 'overallRating accurately recalculated to 4.00 by backend');
    assert(refreshedStore.data.data.store.totalRatings === 1, 'totalRatings accurately updated to 1 by backend');
    assert(refreshedStore.data.data.store.myRating === 4, 'myRating reflects user submitted 4 stars');

    // 3.5 Customer Modifies Rating to 5 Stars via PATCH /api/ratings/:storeId
    const modifyRatingRes = await apiRequest(TEST_PORT, 'PATCH', `/api/ratings/${newStoreId}`, {
      rating: 5
    }, custToken);
    assert(modifyRatingRes.status === 200, 'Customer modifies rating to 5 stars (200 OK)');
    assert(modifyRatingRes.data.data.rating.rating === 5, 'Updated rating record has rating = 5');

    // 3.6 Verify No Duplicate Rating Row Created (UPSERT Guarantee)
    const modifiedStore = await apiRequest(TEST_PORT, 'GET', `/api/stores/${newStoreId}`, null, custToken);
    assert(modifiedStore.data.data.store.overallRating === 5, 'overallRating updated to 5.00');
    assert(modifiedStore.data.data.store.totalRatings === 1, 'totalRatings remains 1 (no row duplication)');
    assert(modifiedStore.data.data.store.myRating === 5, 'myRating updated to 5');

    // ----------------------------------------------------
    // 4. MY RATINGS SCALABLE SERVER QUERY
    // ----------------------------------------------------
    console.log('\n📋 Step 4: Testing Scalable My Ratings Server-Side Query...');

    // 4.1 Query Stores with ratedOnly=true
    const myRatingsRes = await apiRequest(TEST_PORT, 'GET', '/api/stores?ratedOnly=true', null, custToken);
    assert(myRatingsRes.status === 200, 'GET /api/stores?ratedOnly=true returns 200 OK');
    assert(myRatingsRes.data.data.stores.length === 1, 'Returns exactly the 1 store rated by Barry Allen');
    assert(myRatingsRes.data.data.stores[0].id === newStoreId, 'Returned store matches rated store');
    assert(myRatingsRes.data.data.stores[0].myRating === 5, 'Returned store includes myRating: 5');
    assert(myRatingsRes.data.data.pagination.total === 1, 'Pagination total reflects only rated stores');

    // ----------------------------------------------------
    // 5. STORE OWNER DASHBOARD & CUSTOMER FEEDBACK ISOLATION
    // ----------------------------------------------------
    console.log('\n💼 Step 5: Testing Store Owner Analytics & Customer Reviews Isolation...');

    // 5.1 Store Owner Login
    const ownerLogin = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'oliver.queen@starling.com',
      password: 'OwnerPass@123'
    });
    assert(ownerLogin.status === 200, 'Store Owner login succeeds (200 OK)');
    const ownerToken = ownerLogin.data.data.token;

    // 5.2 Owner Fetches Store Analytics & Customer Reviews
    const ownerStoresRes = await apiRequest(TEST_PORT, 'GET', '/api/owner/stores', null, ownerToken);
    assert(ownerStoresRes.status === 200, 'Owner can fetch their store dashboard (200 OK)');
    assert(ownerStoresRes.data.data.stores.length === 1, 'Owner sees their 1 assigned store');

    const ownerStore = ownerStoresRes.data.data.stores[0];
    assert(ownerStore.id === newStoreId, 'Owner sees correct store ID');
    assert(ownerStore.averageRating === 5, 'Store average rating is 5.00');
    assert(ownerStore.totalRatings === 1, 'Store total ratings is 1');
    assert(ownerStore.ratings.length === 1, 'Customer feedback array contains 1 review');

    const customerReview = ownerStore.ratings[0];
    assert(customerReview.rating === 5, 'Reviewer rating is 5');
    assert(customerReview.user.name === 'Barry Allen Central Customer', 'Reviewer name is visible to store owner');
    assert(customerReview.user.email === 'barry.allen@starlabs.com', 'Reviewer email is visible to store owner');

    // 5.3 Multi-Tenant Isolation Check: Other Owner Cannot See Oliver's Store
    const demoOwnerLogin = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'owner@store.com',
      password: 'Owner@1234'
    });
    const demoOwnerRes = await apiRequest(TEST_PORT, 'GET', '/api/owner/stores', null, demoOwnerLogin.data.data.token);
    assert(demoOwnerRes.status === 200, 'Demo owner fetches their stores (200 OK)');
    assert(!demoOwnerRes.data.data.stores.some((s) => s.id === newStoreId), 'Demo owner CANNOT see Oliver Queen store (Strict Multi-Tenant Isolation)');

    // ----------------------------------------------------
    // 6. ROLE SECURITY BOUNDARIES
    // ----------------------------------------------------
    console.log('\n🔒 Step 6: Testing Role-Based Security Boundaries...');
    const custToAdmin = await apiRequest(TEST_PORT, 'GET', '/api/admin/dashboard', null, custToken);
    assert(custToAdmin.status === 403, 'Normal user cannot access admin dashboard (403 Forbidden)');

    const ownerToAdmin = await apiRequest(TEST_PORT, 'GET', '/api/admin/dashboard', null, ownerToken);
    assert(ownerToAdmin.status === 403, 'Store owner cannot access admin dashboard (403 Forbidden)');

    const custToOwner = await apiRequest(TEST_PORT, 'GET', '/api/owner/stores', null, custToken);
    assert(custToOwner.status === 403, 'Normal user cannot access owner dashboard (403 Forbidden)');

    const ownerRateStore = await apiRequest(TEST_PORT, 'POST', '/api/ratings', { storeId: newStoreId, rating: 5 }, ownerToken);
    assert(ownerRateStore.status === 403, 'Store owner cannot rate stores (403 Forbidden)');

    const adminRateStore = await apiRequest(TEST_PORT, 'POST', '/api/ratings', { storeId: newStoreId, rating: 5 }, adminToken);
    assert(adminRateStore.status === 403, 'Admin cannot rate stores (403 Forbidden)');

    // ----------------------------------------------------
    // 7. REGRESSION VERIFICATION (Phases 1–4)
    // ----------------------------------------------------
    console.log('\n🩺 Step 7: Regression Verification across Phases 1–4...');
    const healthRes = await apiRequest(TEST_PORT, 'GET', '/api/health');
    assert(healthRes.status === 200, 'Phase 1 /api/health returns 200 OK');

    const meRes = await apiRequest(TEST_PORT, 'GET', '/api/auth/me', null, custToken);
    assert(meRes.status === 200, 'Phase 2 /api/auth/me returns 200 OK with authenticated customer');
    assert(meRes.data.data.user.email === 'barry.allen@starlabs.com', 'Profile email matches');

    // ----------------------------------------------------
    // FINAL SUMMARY
    // ----------------------------------------------------
    console.log('\n======================================================');
    console.log(`📊 PHASE 5 TEST SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
    console.log('======================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Unexpected error during Phase 5 tests:', error);
    process.exit(1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

runPhase5Tests();
