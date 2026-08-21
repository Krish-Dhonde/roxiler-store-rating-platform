import pool from '../config/db.js';

/**
 * GET /api/owner/stores
 * Store Owner Dashboard: Retrieves all stores owned by the authenticated user,
 * along with overall rating statistics and a breakdown of user rating submissions.
 * 
 * Strict Ownership Enforcement: The query filters exclusively by `s.owner_id = req.user.id`.
 */
export async function getOwnerStores(req, res, next) {
  try {
    const ownerId = req.user.id;

    const [stores] = await pool.query(
      `SELECT 
         s.id,
         s.name,
         s.email,
         s.address,
         s.created_at AS createdAt,
         s.updated_at AS updatedAt,
         COALESCE(stats.averageRating, 0) AS averageRating,
         COALESCE(stats.totalRatings, 0) AS totalRatings
       FROM stores s
       LEFT JOIN (
         SELECT 
           store_id,
           ROUND(AVG(rating), 2) AS averageRating,
           COUNT(id) AS totalRatings
         FROM ratings
         GROUP BY store_id
       ) stats ON s.id = stats.store_id
       WHERE s.owner_id = ?
       ORDER BY s.id ASC`,
      [ownerId]
    );

    if (stores.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No stores currently registered for this owner account.',
        data: {
          stores: []
        }
      });
    }

    const storeIds = stores.map((s) => s.id);
    
    // Create parameterized placeholders for IN clause
    const placeholders = storeIds.map(() => '?').join(',');
    const [ratingRows] = await pool.query(
      `SELECT 
         r.id AS ratingId,
         r.store_id AS storeId,
         r.rating,
         r.created_at AS createdAt,
         r.updated_at AS updatedAt,
         u.id AS userId,
         u.name AS userName,
         u.email AS userEmail,
         u.address AS userAddress
       FROM ratings r
       INNER JOIN users u ON r.user_id = u.id
       WHERE r.store_id IN (${placeholders})
       ORDER BY r.created_at DESC`,
      storeIds
    );

    const ratingsByStoreId = {};
    for (const r of ratingRows) {
      if (!ratingsByStoreId[r.storeId]) {
        ratingsByStoreId[r.storeId] = [];
      }
      ratingsByStoreId[r.storeId].push({
        id: r.ratingId,
        rating: r.rating,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: {
          id: r.userId,
          name: r.userName,
          email: r.userEmail,
          address: r.userAddress
        }
      });
    }

    const storesWithRatings = stores.map((store) => ({
      ...store,
      averageRating: Number(store.averageRating) || 0,
      totalRatings: Number(store.totalRatings) || 0,
      ratings: (ratingsByStoreId[store.id] || []).map((r) => ({
        ...r,
        rating: Number(r.rating)
      }))
    }));

    return res.status(200).json({
      success: true,
      data: {
        stores: storesWithRatings
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/owner/stores
 * Create a new store location directly for the authenticated Store Owner (Entry Point B).
 */
export async function createOwnerStore(req, res, next) {
  try {
    const ownerId = req.user.id;
    const { name, email, address } = req.body;

    if (!name || !email || !address) {
      return res.status(400).json({
        success: false,
        message: 'Store name, email, and address are all required.'
      });
    }

    if (name.trim().length < 20 || name.trim().length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Store name must be between 20 and 60 characters.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid store email address.'
      });
    }

    if (address.trim().length > 400) {
      return res.status(400).json({
        success: false,
        message: 'Store address cannot exceed 400 characters.'
      });
    }

    // Check for duplicate store email
    const [existing] = await pool.query(
      'SELECT id FROM stores WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A store with this business email address already exists.'
      });
    }

    // Insert store with current authenticated owner_id
    const [result] = await pool.query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES (?, ?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), address.trim(), ownerId]
    );

    const newStoreId = result.insertId;

    return res.status(201).json({
      success: true,
      message: 'Store registered successfully.',
      data: {
        store: {
          id: newStoreId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          address: address.trim(),
          ownerId,
          averageRating: 0,
          totalRatings: 0,
          ratings: []
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

