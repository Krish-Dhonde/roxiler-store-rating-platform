import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

/**
 * Initializes the database, tables, constraints, and demo seed data.
 */
export async function initializeDatabase(forceReseed = false) {
  const dbName = process.env.DB_NAME || "roxiler_rating_db";
  console.log(`Starting Database Initialization...`);
  console.log(`Target Database: ${dbName}`);

  // Connect without database selected to create database if needed
  const rootConnection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: Number(process.env.DB_PORT) || 3306,
  });

  try {
    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
       CHARACTER SET utf8mb4 
       COLLATE utf8mb4_unicode_ci;`,
    );
    console.log(`Database \`${dbName}\` verified/created.`);
  } finally {
    await rootConnection.end();
  }

  // Connect to the specific database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: dbName,
    port: Number(process.env.DB_PORT) || 3306,
  });

  try {
    // If force re-seed is requested, drop tables in foreign-key order
    if (
      forceReseed ||
      process.argv.includes("--force") ||
      process.argv.includes("--reseed")
    ) {
      console.log("🔄 Force re-seed detected. Dropping existing tables...");
      await connection.query("DROP TABLE IF EXISTS ratings;");
      await connection.query("DROP TABLE IF EXISTS stores;");
      await connection.query("DROP TABLE IF EXISTS users;");
    }

    // Create Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(60) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        address VARCHAR(400) NOT NULL,
        role ENUM('admin', 'user', 'owner') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    console.log("Table `users` created or verified.");

    // Create Stores Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(60) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        address VARCHAR(400) NOT NULL,
        owner_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) 
          REFERENCES users(id) 
          ON DELETE SET NULL 
          ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log("Table `stores` created or verified.");

    // Create Ratings Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        store_id INT NOT NULL,
        rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) 
          REFERENCES users(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE,
        CONSTRAINT fk_ratings_store FOREIGN KEY (store_id) 
          REFERENCES stores(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE,
        CONSTRAINT unique_user_store UNIQUE (user_id, store_id)
      ) ENGINE=InnoDB;
    `);
    console.log("Table `ratings` created or verified.");

    // Demo Accounts
    await seedDemoData(connection);

    console.log(
      `\nDatabase Initialization and Seeding Completed Successfully!\n`,
    );
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function seedDemoData(connection) {
  const [existingUsers] = await connection.query(
    "SELECT COUNT(*) AS count FROM users",
  );
  if (existingUsers[0].count > 0) {
    console.log("Users already exist. Skipping seed data insertion.");
    return;
  }

  console.log(
    "Seeding initial demo data with Indian merchant & customer records...",
  );

  const saltRounds = 10;
  const hashAdmin1 = await bcrypt.hash("Admin@1234", saltRounds);
  const hashAdmin2 = await bcrypt.hash("Admin@5678", saltRounds);
  const hashOwner1 = await bcrypt.hash("Owner@1234", saltRounds);
  const hashOwner2 = await bcrypt.hash("Owner@5678", saltRounds);
  const hashOwner3 = await bcrypt.hash("Owner@9012", saltRounds);
  const hashUser1 = await bcrypt.hash("User@1234", saltRounds);
  const hashUser2 = await bcrypt.hash("User@5678", saltRounds);
  const hashUser3 = await bcrypt.hash("User@9012", saltRounds);

  // System Administrators 
  const [admin1] = await connection.query(
    `INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, 'admin')`,
    [
      "Aarav Sharma - System Admin",
      "admin@roxiler.com",
      hashAdmin1,
      "Tower 4, Cyber City, DLF Phase 2, Gurugram, Haryana",
    ],
  );

  const [admin2] = await connection.query(
    `INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, 'admin')`,
    [
      "Priya Patel - Operations Lead",
      "priya.admin@roxiler.com",
      hashAdmin2,
      "Mindspace IT Park, Hitec City, Madhapur, Hyderabad, Telangana",
    ],
  );
  console.log(
    `  -> System Admins created (IDs: ${admin1.insertId}, ${admin2.insertId})`,
  );

  const [owner1] = await connection.query(
    `INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, 'owner')`,
    [
      "Rajesh Kumar - Merchant Owner",
      "owner@store.com",
      hashOwner1,
      "100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka",
    ],
  );

  const [owner2] = await connection.query(
    `INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, 'owner')`,
    [
      "Ananya Deshmukh - Merchant Owner",
      "ananya.owner@store.com",
      hashOwner2,
      "Fergusson College Road, Shivajinagar, Pune, Maharashtra",
    ],
  );

  const [owner3] = await connection.query(
    `INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, 'owner')`,
    [
      "Vikram Malhotra - Merchant Owner",
      "vikram.owner@store.com",
      hashOwner3,
      "Barakhamba Road, Connaught Place, New Delhi, Delhi",
    ],
  );
  console.log(
    `  -> Store Owners created (IDs: ${owner1.insertId}, ${owner2.insertId}, ${owner3.insertId})`,
  );

  const [cust1] = await connection.query(
    `INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, 'user')`,
    [
      "Amitabh Sen - Verified Customer",
      "user@example.com",
      hashUser1,
      "Park Street, Middleton Row, Central Kolkata, West Bengal",
    ],
  );

  const [cust2] = await connection.query(
    `INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, 'user')`,
    [
      "Rohit Verma - Verified Customer",
      "rohit.customer@example.com",
      hashUser1,
      "Sector 62, Electronic City Phase 1, Noida, Uttar Pradesh",
    ],
  );

  const [cust3] = await connection.query(
    `INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, 'user')`,
    [
      "Sneha Reddy - Verified Customer",
      "sneha.customer@example.com",
      hashUser2,
      "Road Number 36, Jubilee Hills, Hyderabad, Telangana",
    ],
  );

  const [cust4] = await connection.query(
    `INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, 'user')`,
    [
      "Pooja Sharma - Verified Customer",
      "pooja.customer@example.com",
      hashUser3,
      "Pali Hill, Nargis Dutt Road, Bandra West, Mumbai, Maharashtra",
    ],
  );
  console.log(
    `  -> Customers created (IDs: ${cust1.insertId}, ${cust2.insertId}, ${cust3.insertId}, ${cust4.insertId})`,
  );

  // HardCoded Data
  const storesData = [
    {
      name: "FabIndia Heritage Crafts & Apparel",
      email: "contact@fabindiaheritage.com",
      address: "Plot 45, 100 Feet Road, Indiranagar, Bengaluru, Karnataka",
      ownerId: owner1.insertId,
    },
    {
      name: "Nature's Basket Organic Supermarket",
      email: "support@naturesbasketgroceries.com",
      address: "Shop 12, Hill Road, Bandra West, Mumbai, Maharashtra",
      ownerId: owner2.insertId,
    },
    {
      name: "Chai Point Express Café & Bakery",
      email: "orders@chaipointexpress.com",
      address: "Brigade Road, Ashok Nagar, Bengaluru, Karnataka",
      ownerId: owner1.insertId,
    },
    {
      name: "Crossword Bookstore & Café Lounge",
      email: "service@crosswordbooks.com",
      address: "ICC Tech Park, Senapati Bapat Road, Pune, Maharashtra",
      ownerId: owner2.insertId,
    },
    {
      name: "Haldiram's Sweets & Pure Veg Restaurant",
      email: "delhi@haldiramsdelhi.com",
      address: "P-12, Outer Circle, Connaught Place, New Delhi, Delhi",
      ownerId: owner3.insertId,
    },
    {
      name: "Croma Electronics & Home Appliances",
      email: "support@cromadigital.com",
      address: "Sarath City Capital Mall, Gachibowli, Hyderabad, Telangana",
      ownerId: owner3.insertId,
    },
    {
      name: "Titan World Watches & Eyewear Studio",
      email: "care@titanworldstores.com",
      address: "MG Road, Jos Junction, Kochi, Kerala",
      ownerId: owner1.insertId,
    },
  ];

  const storeIds = [];
  for (const store of storesData) {
    const [res] = await connection.query(
      `INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)`,
      [store.name, store.email, store.address, store.ownerId],
    );
    storeIds.push(res.insertId);
  }
  console.log(
    `  -> ${storeIds.length} Stores seeded across Indian metro locations.`,
  );

  const ratingsData = [
    // FabIndia
    { userId: cust1.insertId, storeId: storeIds[0], rating: 5 },
    { userId: cust2.insertId, storeId: storeIds[0], rating: 5 },
    { userId: cust3.insertId, storeId: storeIds[0], rating: 4 },
    // Nature's Basket
    { userId: cust1.insertId, storeId: storeIds[1], rating: 4 },
    { userId: cust4.insertId, storeId: storeIds[1], rating: 5 },
    // Chai Point
    { userId: cust2.insertId, storeId: storeIds[2], rating: 5 },
    { userId: cust3.insertId, storeId: storeIds[2], rating: 4 },
    // Crossword
    { userId: cust1.insertId, storeId: storeIds[3], rating: 5 },
    { userId: cust4.insertId, storeId: storeIds[3], rating: 4 },
    // Haldiram's
    { userId: cust2.insertId, storeId: storeIds[4], rating: 5 },
    { userId: cust3.insertId, storeId: storeIds[4], rating: 5 },
    { userId: cust4.insertId, storeId: storeIds[4], rating: 4 },
    // Croma
    { userId: cust3.insertId, storeId: storeIds[5], rating: 4 },
    { userId: cust2.insertId, storeId: storeIds[5], rating: 4 },
    // Titan
    { userId: cust1.insertId, storeId: storeIds[6], rating: 5 },
    { userId: cust4.insertId, storeId: storeIds[6], rating: 4 },
  ];

  for (const r of ratingsData) {
    await connection.query(
      `INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)`,
      [r.userId, r.storeId, r.rating],
    );
  }
  console.log(`  -> ${ratingsData.length} Verified customer ratings seeded.`);
}

// Execute directly if run via CLI `node src/config/initDb.js`
if (process.argv[1] && process.argv[1].endsWith("initDb.js")) {
  initializeDatabase(
    process.argv.includes("--force") || process.argv.includes("--reseed"),
  )
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
