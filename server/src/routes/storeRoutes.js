import express from 'express';
import { optionalAuthenticateToken } from '../middlewares/authMiddleware.js';
import { validateIdParam } from '../middlewares/validationMiddleware.js';
import { getStores, getStoreById } from '../controllers/storeController.js';

const router = express.Router();

// Store discovery endpoints support optional authentication to retrieve user's personal rating
router.get('/', optionalAuthenticateToken, getStores);
router.get('/:id', optionalAuthenticateToken, validateIdParam('id'), getStoreById);

export default router;
