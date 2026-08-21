import express from 'express';
import {
  signup,
  login,
  getProfile,
  changePassword,
  registerStoreAndOwner
} from '../controllers/authController.js';
import {
  validateSignupBody,
  validateLoginBody,
  validateChangePasswordBody
} from '../middlewares/validationMiddleware.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Authentication Routes

router.post('/signup', validateSignupBody, signup);

router.post('/register-store', registerStoreAndOwner);

router.post('/login', validateLoginBody, login);

// Protected Authentication Routes (Require Valid JWT)

router.get('/me', authenticateToken, getProfile);
router.patch('/change-password', authenticateToken, validateChangePasswordBody, changePassword);

export default router;
