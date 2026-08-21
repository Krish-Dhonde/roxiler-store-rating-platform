import pool from '../config/db.js';

/**
 * POST /api/ratings
 * Submit or update a rating (1 to 5) for a store.
 * 
 * Uses MySQL `INSERT ... ON DUPLICATE KEY UPDATE` based on UNIQUE(user_id, store_id).
 */
export async function submitOrUpdateRating(req, res, next) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { storeId, rating } = req.body;

    // Strict role check: only customers (user role) can submit ratings
    if (userRole !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Rating submission is restricted to customers only.'
      });
    }

    const [stores] = await pool.query(
      'SELECT id, owner_id FROM stores WHERE id = ?',
      [storeId]
    );

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.'
      });
    }

    // Anti-fraud: prevent owner from rating their own store
    if (stores[0].owner_id === userId) {
      return res.status(403).json({
        success: false,
        message: 'Conflict of Interest: Store owners are not permitted to rate their own stores.'
      });
    }

    // If user has not rated, INSERT is performed (affectedRows = 1).
    // If user has already rated, UPDATE is performed (affectedRows = 2 or 1).
    const [result] = await pool.query(
      `INSERT INTO ratings (user_id, store_id, rating)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, storeId, rating]
    );

    // Fetch the persisted rating record
    const [persisted] = await pool.query(
      `SELECT id, user_id AS userId, store_id AS storeId, rating, created_at AS createdAt, updated_at AS updatedAt
       FROM ratings
       WHERE user_id = ? AND store_id = ?`,
      [userId, storeId]
    );

    const isNew = result.affectedRows === 1;

    return res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? 'Rating submitted successfully.' : 'Rating updated successfully.',
      data: {
        rating: persisted[0]
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/ratings/:storeId
 * Modify an existing rating for a specific store.
 * Enforces ownership: only modifies the rating belonging to req.user.id.
 */
export async function modifyRating(req, res, next) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const storeId = Number(req.params.storeId);
    const { rating } = req.body;

    // Strict role check: only customers (user role) can modify ratings
    if (userRole !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Rating modification is restricted to customers only.'
      });
    }

    const [stores] = await pool.query(
      'SELECT id, owner_id FROM stores WHERE id = ?',
      [storeId]
    );

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.'
      });
    }

    // Anti-fraud: prevent owner from rating their own store
    if (stores[0].owner_id === userId) {
      return res.status(403).json({
        success: false,
        message: 'Conflict of Interest: Store owners are not permitted to rate their own stores.'
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
      [userId, storeId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No existing rating found to modify. Please submit a rating first.'
      });
    }

    await pool.query(
      `UPDATE ratings 
       SET rating = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND store_id = ?`,
      [rating, userId, storeId]
    );

    const [updated] = await pool.query(
      `SELECT id, user_id AS userId, store_id AS storeId, rating, created_at AS createdAt, updated_at AS updatedAt
       FROM ratings
       WHERE user_id = ? AND store_id = ?`,
      [userId, storeId]
    );

    return res.status(200).json({
      success: true,
      message: 'Rating updated successfully.',
      data: {
        rating: updated[0]
      }
    });
  } catch (error) {
    next(error);
  }
}
