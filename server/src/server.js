import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { checkDbConnection } from './config/db.js';
import { initializeDatabase } from './config/initDb.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('Initializing Roxiler Rating Backend...');

    // Initialize Database and Tables
    await initializeDatabase();

    // Verify Database Connection
    const isDbConnected = await checkDbConnection();
    if (!isDbConnected) {
      console.error('Could not establish database connection on startup.');
      process.exit(1);
    }
    console.log('Database connection verified successfully.');

    // Start HTTP Listener
    app.listen(PORT, () => {
      console.log(`\nServer listening on http://localhost:${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error.message);
    process.exit(1);
  }
}

startServer();
