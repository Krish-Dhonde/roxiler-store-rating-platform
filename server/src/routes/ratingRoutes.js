import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import {
  validateRatingBody,
  validatePatchRatingBody,
  validateIdParam
} from '../middlewares/validationMiddleware.js';
import {
  submitOrUpdateRating,
  modifyRating
} from '../controllers/ratingController.js';

const router = express.Router();

// Only authenticated 'user' role can submit or modify ratings
router.use(authenticateToken, requireRole('user'));

// Submit or upsert rating
router.post('/', validateRatingBody, submitOrUpdateRating);

// Modify existing rating for a store
router.patch('/:storeId', validateIdParam('storeId'), validatePatchRatingBody, modifyRating);

export default router;
