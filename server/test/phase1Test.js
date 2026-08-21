import http from 'http';
import pool from '../src/config/db.js';
import app from '../src/app.js';
import { initializeDatabase } from '../src/config/initDb.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

async function runPhase1Tests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 1 VERIFICATION TESTS');
  console.log('======================================================\n');

  try {
    // Step 1: Run Database Initialization & Migration
    console.log('📦 Step 1: Initializing Database & Migrations...');
    await initializeDatabase();

    // Step 2: Test Database Connection Pool
    console.log('\n🔌 Step 2: Verifying MySQL Connection Pool...');
    const [pingResult] = await pool.query('SELECT 1 + 1 AS result');
    assert(pingResult[0].result === 2, 'Connection pool can execute parameterized queries');

    // Step 3: Verify Tables in Database
    console.log('\n📋 Step 3: Verifying Database Tables...');
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map((t) => Object.values(t)[0]);
    
    assert(tableNames.includes('users'), 'Table `users` exists');
    assert(tableNames.includes('stores'), 'Table `stores` exists');
    assert(tableNames.includes('ratings'), 'Table `ratings` exists');

    // Step 4: Verify Table Constraints & Schema
    console.log('\n🔍 Step 4: Verifying Constraints & Unique Indexes...');
    const [ratingIndexes] = await pool.query('SHOW INDEX FROM ratings');
    const uniqueIndex = ratingIndexes.find((idx) => idx.Key_name === 'unique_user_store');
    assert(!!uniqueIndex, 'Composite unique index `unique_user_store` exists on ratings table');

    // Step 5: Verify Seeded Data
    console.log('\n🌱 Step 5: Verifying Seeded Accounts & Records...');
    const [users] = await pool.query('SELECT role, email FROM users ORDER BY id');
    const admin = users.find((u) => u.role === 'admin');
    const owner = users.find((u) => u.role === 'owner');
    const normalUser = users.find((u) => u.role === 'user');

    assert(!!admin && admin.email === 'admin@roxiler.com', 'Admin user seeded (admin@roxiler.com)');
    assert(!!owner && owner.email === 'owner@store.com', 'Store Owner user seeded (owner@store.com)');
    assert(!!normalUser && normalUser.email === 'user@example.com', 'Normal User seeded (user@example.com)');

    const [stores] = await pool.query('SELECT * FROM stores');
    assert(stores.length >= 2, `Stores seeded (${stores.length} stores present)`);

    const [ratings] = await pool.query('SELECT * FROM ratings');
    assert(ratings.length >= 2, `Ratings seeded (${ratings.length} ratings present)`);

    // Step 6: Verify HTTP Health Check Endpoint
    console.log('\n🩺 Step 6: Verifying Express Health Check Endpoint...');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(5099, resolve));

    try {
      const response = await fetch('http://localhost:5099/api/health');
      const data = await response.json();

      assert(response.status === 200, 'GET /api/health returned HTTP 200 OK');
      assert(data.success === true, 'Health check reports success: true');
      assert(data.status === 'healthy', 'Health check reports status: "healthy"');
      assert(data.database?.status === 'connected', 'Database status reports "connected" in health response');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }

    // Print Final Summary
    console.log('\n======================================================');
    console.log(`📊 TEST SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
    console.log('======================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Unexpected error during Phase 1 verification:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runPhase1Tests();
