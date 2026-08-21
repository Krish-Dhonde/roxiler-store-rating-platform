import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import { authenticateToken } from './middlewares/authMiddleware.js';
import { requireRole } from './middlewares/roleMiddleware.js';
import { notFoundHandler, errorHandler } from './middlewares/errorMiddleware.js';

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

/**
 * Health Check Endpoint
 * GET /api/health
 */
app.get('/api/health', async (req, res) => {
  try {
    const startTime = Date.now();
    const [dbResult] = await pool.query('SELECT 1 AS status');
    const latencyMs = Date.now() - startTime;

    res.status(200).json({
      success: true,
      service: 'Roxiler Rating System API',
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbResult && dbResult[0]?.status === 1 ? 'connected' : 'unreachable',
        latency: `${latencyMs}ms`
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'Roxiler Rating System API',
      status: 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error.message
      }
    });
  }
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Roxiler Store Rating Platform API',
    healthCheck: '/api/health',
    authEndpoints: '/api/auth',
    adminEndpoints: '/api/admin',
    storeEndpoints: '/api/stores',
    ratingEndpoints: '/api/ratings',
    ownerEndpoints: '/api/owner'
  });
});

// Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/owner', ownerRoutes);

// Test Protected Routes (For RBAC Verification)
app.get('/api/test/admin-only', authenticateToken, requireRole('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to admin-only resource.',
    user: req.user
  });
});

app.get('/api/test/owner-or-admin', authenticateToken, requireRole('admin', 'owner'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to owner-or-admin resource.',
    user: req.user
  });
});

// 404 and Error Middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
