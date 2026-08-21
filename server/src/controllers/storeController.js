import pool from '../config/db.js';

// Allowed columns for sorting stores
const ALLOWED_STORE_SORT_FIELDS = {
  id: 's.id',
  name: 's.name',
  address: 's.address',
  rating: 'overallRating',
  overallrating: 'overallRating',
  overallRating: 'overallRating',
  totalratings: 'totalRatings',
  totalRatings: 'totalRatings',
  createdat: 's.created_at',
  createdAt: 's.created_at'
};

/**
 * GET /api/stores
 * Normal User Store Listing with search by name/address, sorting, pagination,
 * overall store rating, and current user's rating (myRating).
 * 
 * Supports optional `ratedOnly=true` filter to retrieve exclusively stores reviewed by current user.
 * Uses Derived Table aggregation to prevent row-multiplication distortion.
 */
export async function getStores(req, res, next) {
  try {
    const { name, address, search, sortBy, order, page, limit, ratedOnly } = req.query;
    // Only customers (role: 'user') can have personal ratings
    const isCustomer = req.user && req.user.role === 'user';
    const currentUserId = isCustomer ? req.user.id : null;

    const conditions = [];
    const params = [];
    const countParams = [];

    // Filter to only stores rated by current user if requested
    const isRatedOnly = (ratedOnly === 'true' || ratedOnly === true) && Boolean(currentUserId);

    const countJoinClause = isRatedOnly
      ? 'INNER JOIN ratings r_cnt ON s.id = r_cnt.store_id AND r_cnt.user_id = ?'
      : '';

    if (isRatedOnly) {
      countParams.push(currentUserId);
    }

    // Search filter across both name and address if 'search' query is provided
    if (search && typeof search === 'string' && search.trim()) {
      conditions.push('(s.name LIKE ? OR s.address LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    if (name && typeof name === 'string' && name.trim()) {
      conditions.push('s.name LIKE ?');
      const namePattern = `%${name.trim()}%`;
      params.push(namePattern);
      countParams.push(namePattern);
    }

    if (address && typeof address === 'string' && address.trim()) {
      conditions.push('s.address LIKE ?');
      const addressPattern = `%${address.trim()}%`;
      params.push(addressPattern);
      countParams.push(addressPattern);
    }

    if (isRatedOnly) {
      conditions.push('r_user.rating IS NOT NULL');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Get total matching count for pagination
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM stores s ${countJoinClause} ${whereClause.replace(/r_user\.rating/g, 'r_cnt.rating')}`,
      countParams
    );
    const total = Number(countResult[0]?.total || 0);

    // 2. Safe sorting whitelist
    const sortFieldKey = (sortBy || 'id').toLowerCase();
    const sortColumn = ALLOWED_STORE_SORT_FIELDS[sortFieldKey] || 's.id';
    const sortDirection = (order && order.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

    // 3. Pagination calculations
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const pageNum = Math.max(1, Number(page) || 1);
    const offsetNum = (pageNum - 1) * limitNum;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // 4. Query stores with derived aggregate ratings and personal user rating
    const queryParams = [];
    if (currentUserId) {
      queryParams.push(currentUserId);
    }
    queryParams.push(...params, limitNum, offsetNum);

    const userJoinClause = currentUserId 
      ? 'LEFT JOIN ratings r_user ON s.id = r_user.store_id AND r_user.user_id = ?'
      : '';

    const selectUserRating = currentUserId 
      ? 'r_user.rating AS myRating'
      : 'NULL AS myRating';

    const [stores] = await pool.query(
      `SELECT 
         s.id,
         s.name,
         s.address,
         s.email,
         s.owner_id AS ownerId,
         s.created_at AS createdAt,
         COALESCE(stats.overallRating, 0) AS overallRating,
         COALESCE(stats.totalRatings, 0) AS totalRatings,
         ${selectUserRating}
       FROM stores s
       -- 1. Pre-aggregated derived table: exactly 1 row per store_id
       LEFT JOIN (
         SELECT 
           store_id,
           ROUND(AVG(rating), 2) AS overallRating,
           COUNT(id) AS totalRatings
         FROM ratings
         GROUP BY store_id
       ) stats ON s.id = stats.store_id
       -- 2. Authenticated user's specific rating: at most 1 row per store
       ${userJoinClause}
       ${whereClause}
       ORDER BY ${sortColumn} ${sortDirection}
       LIMIT ? OFFSET ?`,
      queryParams
    );

    const formattedStores = stores.map((s) => ({
      ...s,
      overallRating: Number(s.overallRating) || 0,
      totalRatings: Number(s.totalRatings) || 0,
      myRating: s.myRating !== null ? Number(s.myRating) : null
    }));

    return res.status(200).json({
      success: true,
      data: {
        stores: formattedStores,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/stores/:id
 * Retrieve a single store with overall average rating and user's personal rating.
 */
export async function getStoreById(req, res, next) {
  try {
    const storeId = Number(req.params.id);
    const isCustomer = req.user && req.user.role === 'user';
    const currentUserId = isCustomer ? req.user.id : null;

    const userJoinClause = currentUserId 
      ? 'LEFT JOIN ratings r_user ON s.id = r_user.store_id AND r_user.user_id = ?'
      : '';

    const selectUserRating = currentUserId 
      ? 'r_user.rating AS myRating'
      : 'NULL AS myRating';

    const queryParams = [storeId];
    if (currentUserId) {
      queryParams.push(currentUserId);
    }
    queryParams.push(storeId);

    const [stores] = await pool.query(
      `SELECT 
         s.id,
         s.name,
         s.address,
         s.email,
         s.owner_id AS ownerId,
         s.created_at AS createdAt,
         COALESCE(stats.overallRating, 0) AS overallRating,
         COALESCE(stats.totalRatings, 0) AS totalRatings,
         ${selectUserRating}
       FROM stores s
       LEFT JOIN (
         SELECT 
           store_id,
           ROUND(AVG(rating), 2) AS overallRating,
           COUNT(id) AS totalRatings
         FROM ratings
         WHERE store_id = ?
         GROUP BY store_id
       ) stats ON s.id = stats.store_id
       ${userJoinClause}
       WHERE s.id = ?`,
      queryParams
    );

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.'
      });
    }

    const store = {
      ...stores[0],
      overallRating: Number(stores[0].overallRating) || 0,
      totalRatings: Number(stores[0].totalRatings) || 0,
      myRating: stores[0].myRating !== null ? Number(stores[0].myRating) : null
    };

    return res.status(200).json({
      success: true,
      data: {
        store
      }
    });
  } catch (error) {
    next(error);
  }
}
