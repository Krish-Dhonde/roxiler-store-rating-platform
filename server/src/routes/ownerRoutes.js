import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { getOwnerStores, createOwnerStore } from '../controllers/ownerController.js';

const router = express.Router();

// Only authenticated 'owner' role can access owner endpoints
router.use(authenticateToken, requireRole('owner'));

// Get owner's stores with aggregated metrics and customer rating breakdown
router.get('/stores', getOwnerStores);

// Register a new store for current owner
router.post('/stores', createOwnerStore);

export default router;
