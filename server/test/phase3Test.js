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

async function runPhase3Tests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 3 STORE, RATING & ANALYTICS TEST SUITE');
  console.log('======================================================\n');

  const TEST_PORT = 5092;
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

    // Log in seeded accounts
    const adminLogin = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'admin@roxiler.com',
      password: 'Admin@1234'
    });
    const adminToken = adminLogin.data.data.token;

    const ownerLogin = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'owner@store.com',
      password: 'Owner@1234'
    });
    const ownerToken = ownerLogin.data.data.token;

    const userLogin = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: 'user@example.com',
      password: 'User@1234'
    });
    const userToken = userLogin.data.data.token;

    // ----------------------------------------------------
    // 1. ADMIN DASHBOARD ANALYTICS TESTS
    // ----------------------------------------------------
    console.log('\n📊 Step 1: Testing Admin Dashboard Analytics (GET /api/admin/dashboard)...');
    
    const dashboardRes = await apiRequest(TEST_PORT, 'GET', '/api/admin/dashboard', null, adminToken);
    assert(dashboardRes.status === 200, 'Admin can fetch dashboard analytics (200 OK)');
    assert(dashboardRes.data.success === true, 'Dashboard response has success: true');
    assert(dashboardRes.data.data?.totalUsers >= 3, 'Dashboard reports accurate totalUsers');
    assert(dashboardRes.data.data?.totalStores >= 2, 'Dashboard reports accurate totalStores');
    assert(dashboardRes.data.data?.totalRatings >= 2, 'Dashboard reports accurate totalRatings');

    // ----------------------------------------------------
    // 2. ADMIN USER MANAGEMENT TESTS
    // ----------------------------------------------------
    console.log('\n👥 Step 2: Testing Admin User Management APIs...');

    // 2.1 Admin creates a second Store Owner
    const uniqueOwnerEmail = `owner2_${Date.now()}@store.com`;
    const createOwnerRes = await apiRequest(TEST_PORT, 'POST', '/api/admin/users', {
      name: 'Second Store Owner Account',
      email: uniqueOwnerEmail,
      password: 'OwnerPass@123',
      address: '999 Business Boulevard, Suite 500, City Center',
      role: 'owner'
    }, adminToken);

    assert(createOwnerRes.status === 201, 'Admin can create a new owner user (201 Created)');
    assert(createOwnerRes.data.data?.user?.role === 'owner', 'Created user has role "owner"');
    const owner2Id = createOwnerRes.data.data?.user?.id;

    // 2.2 Admin creates a second Admin
    const uniqueAdminEmail = `admin2_${Date.now()}@roxiler.com`;
    const createAdminRes = await apiRequest(TEST_PORT, 'POST', '/api/admin/users', {
      name: 'Secondary Admin Account Officer',
      email: uniqueAdminEmail,
      password: 'AdminPass@123',
      address: '100 Security Command Center, North Tower',
      role: 'admin'
    }, adminToken);
    assert(createAdminRes.status === 201, 'Admin can create another admin user (201 Created)');
    assert(createAdminRes.data.data?.user?.role === 'admin', 'Created user has role "admin"');

    // 2.3 Admin creates a Normal User
    const uniqueUserEmail = `user2_${Date.now()}@example.com`;
    const createUserRes = await apiRequest(TEST_PORT, 'POST', '/api/admin/users', {
      name: 'Benjamin Harrison Citizen',
      email: uniqueUserEmail,
      password: 'UserPass@123',
      address: '555 Maple Street, Apartment 4B',
      role: 'user'
    }, adminToken);
    assert(createUserRes.status === 201, 'Admin can create a normal user (201 Created)');
    const user2Id = createUserRes.data.data?.user?.id;

    // 2.4 Rejection on duplicate email
    const duplicateUserRes = await apiRequest(TEST_PORT, 'POST', '/api/admin/users', {
      name: 'Duplicate Email Attempt User',
      email: uniqueOwnerEmail,
      password: 'UserPass@123',
      address: '123 Any Street Address',
      role: 'user'
    }, adminToken);
    assert(duplicateUserRes.status === 409, 'Admin user creation rejects duplicate email (409 Conflict)');

    // 2.5 Rejection on invalid role
    const invalidRoleRes = await apiRequest(TEST_PORT, 'POST', '/api/admin/users', {
      name: 'Invalid Role Attempt User',
      email: `invalidrole_${Date.now()}@example.com`,
      password: 'UserPass@123',
      address: '123 Any Street Address',
      role: 'super_admin_god'
    }, adminToken);
    assert(invalidRoleRes.status === 400, 'Admin user creation rejects invalid role (400 Bad Request)');

    // 2.6 Admin Users List with Filter & Pagination
    const listUsersRes = await apiRequest(TEST_PORT, 'GET', '/api/admin/users?role=owner&limit=10&page=1', null, adminToken);
    assert(listUsersRes.status === 200, 'Admin can list users with role filter (200 OK)');
    assert(listUsersRes.data.data?.users.every(u => u.role === 'owner'), 'All returned users match role "owner"');
    assert(!!listUsersRes.data.data?.pagination, 'User list includes pagination metadata');

    // 2.7 Admin Users List with Name Filter & Sorting
    const searchUserRes = await apiRequest(TEST_PORT, 'GET', '/api/admin/users?name=Harrison&sortBy=name&order=ASC', null, adminToken);
    assert(searchUserRes.status === 200, 'Admin can filter users by name with sorting (200 OK)');
    assert(searchUserRes.data.data?.users.some(u => u.name.includes('Harrison')), 'Name filter returned matching user');

    // 2.8 Admin Get User By ID
    const getUserRes = await apiRequest(TEST_PORT, 'GET', `/api/admin/users/${user2Id}`, null, adminToken);
    assert(getUserRes.status === 200, 'Admin can fetch specific user by ID (200 OK)');
    assert(getUserRes.data.data?.user?.id === user2Id, 'Fetched user has correct ID');

    // 2.9 Admin Get Non-existent User By ID
    const getFakeUserRes = await apiRequest(TEST_PORT, 'GET', '/api/admin/users/999999', null, adminToken);
    assert(getFakeUserRes.status === 404, 'Admin get non-existent user returns 404 Not Found');

    // ----------------------------------------------------
    // 3. ADMIN STORE MANAGEMENT TESTS
    // ----------------------------------------------------
    console.log('\n🏬 Step 3: Testing Admin Store Management APIs...');

    // 3.1 Admin Creates Store assigned to owner2
    const uniqueStoreEmail = `store_${Date.now()}@grandbazaar.com`;
    const createStoreRes = await apiRequest(TEST_PORT, 'POST', '/api/admin/stores', {
      name: 'Grand Central Fresh Market',
      email: uniqueStoreEmail,
      address: '888 Grand Avenue, Retail District, Suite 10',
      ownerId: owner2Id
    }, adminToken);
    assert(createStoreRes.status === 201, 'Admin can create a store with assigned owner (201 Created)');
    assert(createStoreRes.data.data?.store?.name === 'Grand Central Fresh Market', 'Store has correct name');
    const store3Id = createStoreRes.data.data?.store?.id;

    // 3.2 Admin Creates Store with NO owner (ownerId = null)
    const uniqueStore2Email = `unowned_${Date.now()}@generalstore.com`;
    const createUnownedStoreRes = await apiRequest(TEST_PORT, 'POST', '/api/admin/stores', {
      name: 'Unowned Heritage Emporium',
      email: uniqueStore2Email,
      address: '77 Heritage Lane, Old Town'
    }, adminToken);
    assert(createUnownedStoreRes.status === 201, 'Admin can create an unowned store (201 Created)');
    const store4Id = createUnownedStoreRes.data.data?.store?.id;

    // 3.3 Reject store creation with non-owner role user as ownerId
    const rejectNonOwnerRes = await apiRequest(TEST_PORT, 'POST', '/api/admin/stores', {
      name: 'Invalid Owner Assignment Store',
      email: `fail_${Date.now()}@store.com`,
      address: '123 Any Address On Map',
      ownerId: user2Id // user2 is role 'user', not 'owner'
    }, adminToken);
    assert(rejectNonOwnerRes.status === 400, 'Rejects assigning non-owner user as store owner (400 Bad Request)');

    // 3.4 Reject store creation with duplicate email
    const duplicateStoreEmailRes = await apiRequest(TEST_PORT, 'POST', '/api/admin/stores', {
      name: 'Another Store Same Email',
      email: uniqueStoreEmail,
      address: '456 Another Street Address'
    }, adminToken);
    assert(duplicateStoreEmailRes.status === 409, 'Rejects duplicate store email (409 Conflict)');

    // 3.5 Admin List Stores with Ratings & Sorting
    const listStoresRes = await apiRequest(TEST_PORT, 'GET', '/api/admin/stores?sortBy=rating&order=DESC', null, adminToken);
    assert(listStoresRes.status === 200, 'Admin can list stores with sorting by rating (200 OK)');
    assert(listStoresRes.data.data?.stores.length >= 4, 'Admin store list includes all stores');
    assert(listStoresRes.data.data?.stores.some(s => s.id === store4Id && s.overallRating === 0), 'Store with 0 ratings has overallRating: 0');

    // 3.6 Admin Get Store By ID
    const getAdminStoreRes = await apiRequest(TEST_PORT, 'GET', `/api/admin/stores/${store3Id}`, null, adminToken);
    assert(getAdminStoreRes.status === 200, 'Admin can fetch store by ID (200 OK)');
    assert(getAdminStoreRes.data.data?.store?.name === 'Grand Central Fresh Market', 'Store details are accurate');

    // ----------------------------------------------------
    // 4. NORMAL USER STORE DISCOVERY & PERSONAL RATINGS
    // ----------------------------------------------------
    console.log('\n🛒 Step 4: Testing Normal User Store Discovery APIs (GET /api/stores)...');

    // 4.1 Unauthenticated Store Browsing (Guest)
    const guestStoresRes = await apiRequest(TEST_PORT, 'GET', '/api/stores');
    assert(guestStoresRes.status === 200, 'Guest can browse stores without token (200 OK)');
    assert(guestStoresRes.data.data?.stores.every(s => s.myRating === null), 'Guest browsing returns myRating: null for all stores');

    // 4.2 Authenticated Store Browsing (User 1)
    const userStoresRes = await apiRequest(TEST_PORT, 'GET', '/api/stores', null, userToken);
    assert(userStoresRes.status === 200, 'Authenticated user can browse stores (200 OK)');
    // User 1 rated store 1 (rating: 5) and store 2 (rating: 4) in seed data
    const store1Entry = userStoresRes.data.data?.stores.find(s => s.id === 1);
    assert(store1Entry && store1Entry.myRating === 5, 'User 1 sees their personal myRating = 5 for Store 1');
    assert(store1Entry && Number(store1Entry.overallRating) === 5, 'Store 1 overallRating is calculated accurately');

    // 4.3 Search Filter by Name
    const searchStoreRes = await apiRequest(TEST_PORT, 'GET', '/api/stores?search=Central', null, userToken);
    assert(searchStoreRes.status === 200, 'Store search by keyword returns 200 OK');
    assert(searchStoreRes.data.data?.stores.some(s => s.name.includes('Grand Central')), 'Store search returned matching store');

    // 4.4 Get Single Store By ID with Personal Rating
    const singleStoreRes = await apiRequest(TEST_PORT, 'GET', '/api/stores/1', null, userToken);
    assert(singleStoreRes.status === 200, 'User can fetch single store details (200 OK)');
    assert(singleStoreRes.data.data?.store?.myRating === 5, 'Single store response includes user myRating');

    // ----------------------------------------------------
    // 5. RATING SUBMISSION & MODIFICATION (ATOMIC UPSERT)
    // ----------------------------------------------------
    console.log('\n⭐ Step 5: Testing Rating Submission & Modification APIs...');

    // Log in user2 to submit new ratings
    const user2Login = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: uniqueUserEmail,
      password: 'UserPass@123'
    });
    const user2Token = user2Login.data.data.token;

    // 5.1 User 2 submits a rating of 3 for Store 1
    const submitRatingRes = await apiRequest(TEST_PORT, 'POST', '/api/ratings', {
      storeId: 1,
      rating: 3
    }, user2Token);
    assert(submitRatingRes.status === 201, 'User 2 can submit a rating of 3 for Store 1 (201 Created)');
    assert(submitRatingRes.data.data?.rating?.rating === 3, 'Submitted rating record has rating = 3');

    // 5.2 Verify Store 1 overallRating is updated: (5 + 3) / 2 = 4.00, totalRatings = 2
    const updatedStore1 = await apiRequest(TEST_PORT, 'GET', '/api/stores/1', null, user2Token);
    assert(Number(updatedStore1.data.data?.store?.overallRating) === 4, 'Store 1 overallRating accurately updated to 4.00');
    assert(Number(updatedStore1.data.data?.store?.totalRatings) === 2, 'Store 1 totalRatings accurately updated to 2');
    assert(updatedStore1.data.data?.store?.myRating === 3, 'User 2 sees their personal rating = 3');

    // 5.3 Modifying rating via POST (UPSERT idempotency)
    const upsertRatingRes = await apiRequest(TEST_PORT, 'POST', '/api/ratings', {
      storeId: 1,
      rating: 1
    }, user2Token);
    assert(upsertRatingRes.status === 200, 'Submitting rating again updates existing rating (200 OK)');
    assert(upsertRatingRes.data.data?.rating?.rating === 1, 'Updated rating is now 1');

    // Verify rating count did NOT increase (no duplicate row)
    const [ratingsCount] = await pool.query('SELECT COUNT(*) AS count FROM ratings WHERE user_id = ? AND store_id = 1', [user2Id]);
    assert(ratingsCount[0].count === 1, 'UNIQUE constraint & UPSERT prevent duplicate rating rows');

    // Verify Store 1 overallRating is updated: (5 + 1) / 2 = 3.00
    const store1AfterUpsert = await apiRequest(TEST_PORT, 'GET', '/api/stores/1', null, user2Token);
    assert(Number(store1AfterUpsert.data.data?.store?.overallRating) === 3, 'Store 1 overallRating accurately recalculated to 3.00');

    // 5.4 Modify rating via PATCH /api/ratings/:storeId
    const patchRatingRes = await apiRequest(TEST_PORT, 'PATCH', '/api/ratings/1', {
      rating: 5
    }, user2Token);
    assert(patchRatingRes.status === 200, 'PATCH /api/ratings/1 modifies rating to 5 (200 OK)');
    assert(patchRatingRes.data.data?.rating?.rating === 5, 'Patched rating is now 5');

    // 5.5 Reject invalid rating value (< 1)
    const rejectZeroRating = await apiRequest(TEST_PORT, 'POST', '/api/ratings', {
      storeId: 1,
      rating: 0
    }, user2Token);
    assert(rejectZeroRating.status === 400, 'Rejects rating < 1 (400 Bad Request)');

    // 5.6 Reject invalid rating value (> 5)
    const rejectSixRating = await apiRequest(TEST_PORT, 'POST', '/api/ratings', {
      storeId: 1,
      rating: 6
    }, user2Token);
    assert(rejectSixRating.status === 400, 'Rejects rating > 5 (400 Bad Request)');

    // 5.7 Reject non-integer rating
    const rejectFloatRating = await apiRequest(TEST_PORT, 'POST', '/api/ratings', {
      storeId: 1,
      rating: 4.5
    }, user2Token);
    assert(rejectFloatRating.status === 400, 'Rejects non-integer rating (400 Bad Request)');

    // 5.8 Reject rating on non-existent store
    const rejectFakeStoreRating = await apiRequest(TEST_PORT, 'POST', '/api/ratings', {
      storeId: 999999,
      rating: 5
    }, user2Token);
    assert(rejectFakeStoreRating.status === 404, 'Rejects rating on non-existent store (404 Not Found)');

    // ----------------------------------------------------
    // 6. STORE OWNER DASHBOARD & DATA ISOLATION
    // ----------------------------------------------------
    console.log('\n💼 Step 6: Testing Store Owner Dashboard & Analytics Isolation...');

    // 6.1 Owner 1 views their stores (Stores 1 and 2)
    const owner1StoresRes = await apiRequest(TEST_PORT, 'GET', '/api/owner/stores', null, ownerToken);
    assert(owner1StoresRes.status === 200, 'Store Owner 1 can fetch their stores (200 OK)');
    assert(owner1StoresRes.data.data?.stores.length === 2, 'Owner 1 sees exactly their 2 stores');
    const ownerStore1 = owner1StoresRes.data.data?.stores.find(s => s.id === 1);
    assert(ownerStore1 && ownerStore1.ratings.length >= 1, 'Owner 1 sees customer rating reviews for Store 1');
    assert(ownerStore1 && !!ownerStore1.ratings[0].user?.name, 'Rating review contains reviewer user name');

    // 6.2 Owner 2 views their stores (Store 3 - Grand Central Fresh Market)
    const owner2Login = await apiRequest(TEST_PORT, 'POST', '/api/auth/login', {
      email: uniqueOwnerEmail,
      password: 'OwnerPass@123'
    });
    const owner2Token = owner2Login.data.data.token;

    const owner2StoresRes = await apiRequest(TEST_PORT, 'GET', '/api/owner/stores', null, owner2Token);
    assert(owner2StoresRes.status === 200, 'Store Owner 2 can fetch their stores (200 OK)');
    assert(owner2StoresRes.data.data?.stores.length === 1, 'Owner 2 sees exactly their 1 store');
    assert(owner2StoresRes.data.data?.stores[0].id === store3Id, 'Owner 2 sees Store 3');
    assert(!owner2StoresRes.data.data?.stores.some(s => s.id === 1 || s.id === 2), 'Owner 2 CANNOT see Owner 1 stores (Strict Isolation)');

    // ----------------------------------------------------
    // 7. SECURITY & RBAC PERMISSION ENFORCEMENT
    // ----------------------------------------------------
    console.log('\n🔒 Step 7: Testing Security & Role-Based Access Control Boundaries...');

    // 7.1 Normal user attempting Admin Dashboard -> 403
    const userAccessAdmin = await apiRequest(TEST_PORT, 'GET', '/api/admin/dashboard', null, userToken);
    assert(userAccessAdmin.status === 403, 'Normal user accessing admin dashboard receives 403 Forbidden');

    // 7.2 Store Owner attempting Admin Dashboard -> 403
    const ownerAccessAdmin = await apiRequest(TEST_PORT, 'GET', '/api/admin/dashboard', null, ownerToken);
    assert(ownerAccessAdmin.status === 403, 'Store owner accessing admin dashboard receives 403 Forbidden');

    // 7.3 Normal user attempting Store Owner dashboard -> 403
    const userAccessOwner = await apiRequest(TEST_PORT, 'GET', '/api/owner/stores', null, userToken);
    assert(userAccessOwner.status === 403, 'Normal user accessing owner dashboard receives 403 Forbidden');

    // 7.4 Store Owner attempting to submit a rating -> 403
    const ownerSubmitRating = await apiRequest(TEST_PORT, 'POST', '/api/ratings', { storeId: 1, rating: 5 }, ownerToken);
    assert(ownerSubmitRating.status === 403, 'Store owner attempting to rate a store receives 403 Forbidden');

    // 7.5 Admin attempting to submit a rating -> 403
    const adminSubmitRating = await apiRequest(TEST_PORT, 'POST', '/api/ratings', { storeId: 1, rating: 5 }, adminToken);
    assert(adminSubmitRating.status === 403, 'Admin attempting to rate a store receives 403 Forbidden');

    // 7.6 Unauthenticated access to protected routes -> 401
    const unauthAdmin = await apiRequest(TEST_PORT, 'GET', '/api/admin/dashboard');
    assert(unauthAdmin.status === 401, 'Unauthenticated access to admin routes receives 401 Unauthorized');

    const unauthOwner = await apiRequest(TEST_PORT, 'GET', '/api/owner/stores');
    assert(unauthOwner.status === 401, 'Unauthenticated access to owner routes receives 401 Unauthorized');

    const unauthRating = await apiRequest(TEST_PORT, 'POST', '/api/ratings', { storeId: 1, rating: 5 });
    assert(unauthRating.status === 401, 'Unauthenticated access to rating routes receives 401 Unauthorized');

    // ----------------------------------------------------
    // 8. REGRESSION VERIFICATION (Phase 1 & Phase 2)
    // ----------------------------------------------------
    console.log('\n🩺 Step 8: Verifying Phase 1 Health & Phase 2 Auth Regressions...');

    // 8.1 Health check
    const healthRes = await apiRequest(TEST_PORT, 'GET', '/api/health');
    assert(healthRes.status === 200, 'Phase 1 /api/health still returns 200 OK');
    assert(healthRes.data.database?.status === 'connected', 'Database connection status is healthy');

    // 8.2 Phase 2 Public Signup
    const publicSignup = await apiRequest(TEST_PORT, 'POST', '/api/auth/signup', {
      name: 'Regression Tester Account',
      email: `regression_${Date.now()}@example.com`,
      password: 'PassWord@123',
      address: '101 Regression Road, Testing Lab'
    });
    assert(publicSignup.status === 201, 'Phase 2 signup continues to work (201 Created)');
    assert(publicSignup.data.data?.user?.role === 'user', 'Public signup role is strictly "user"');

    // 8.3 Phase 2 Profile (GET /api/auth/me)
    const profileRes = await apiRequest(TEST_PORT, 'GET', '/api/auth/me', null, userToken);
    assert(profileRes.status === 200, 'Phase 2 /api/auth/me returns 200 OK');
    assert(profileRes.data.data?.user?.email === 'user@example.com', 'Profile email matches');

    // ----------------------------------------------------
    // FINAL SUMMARY
    // ----------------------------------------------------
    console.log('\n======================================================');
    console.log(`📊 PHASE 3 TEST SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
    console.log('======================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Unexpected error during Phase 3 tests:', error);
    process.exit(1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

runPhase3Tests();
