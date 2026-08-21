import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import {
  validateAdminCreateUserBody,
  validateStoreBody,
  validateIdParam
} from '../middlewares/validationMiddleware.js';
import {
  getDashboardStats,
  getUsers,
  createUser,
  getUserById,
  createStore,
  getStores,
  getStoreById
} from '../controllers/adminController.js';

const router = express.Router();

// Enforce authentication and 'admin' role on all admin routes
router.use(authenticateToken, requireRole('admin'));

// Platform Analytics Dashboard
router.get('/dashboard', getDashboardStats);

// User Management Routes
router.get('/users', getUsers);
router.post('/users', validateAdminCreateUserBody, createUser);
router.get('/users/:id', validateIdParam('id'), getUserById);

// Store Management Routes
router.post('/stores', validateStoreBody, createStore);
router.get('/stores', getStores);
router.get('/stores/:id', validateIdParam('id'), getStoreById);

export default router;
