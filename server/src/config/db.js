import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MySQL Connection Pool Configuration.
 * 
 * WHY USE A CONNECTION POOL:
 * Instead of opening a new TCP connection on every incoming HTTP request (which introduces 
 * significant handshake latency and exhausts server sockets), a pool maintains a set of 
 * persistent, reusable database connections. Requests checkout a connection, execute their 
 * parameterized queries, and return the connection to the pool automatically.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'roxiler_rating_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,        
  maxIdle: 10,               
  idleTimeout: 60000,        
  queueLimit: 0,             
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});


export const checkDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

export default pool;
