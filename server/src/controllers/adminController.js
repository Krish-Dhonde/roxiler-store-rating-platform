import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const BCRYPT_SALT_ROUNDS = 10;

// Allowed columns for sorting Admin Users table
const ALLOWED_USER_SORT_FIELDS = {
  id: 'u.id',
  name: 'u.name',
  email: 'u.email',
  address: 'u.address',
  role: 'u.role',
  createdat: 'u.created_at',
  createdAt: 'u.created_at'
};

// Allowed columns for sorting Admin Stores table
const ALLOWED_STORE_SORT_FIELDS = {
  id: 's.id',
  name: 's.name',
  email: 's.email',
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
 * GET /api/admin/dashboard
 * Admin platform statistics: total users, total stores, total ratings.
 */
export async function getDashboardStats(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) AS totalUsers,
        (SELECT COUNT(*) FROM stores) AS totalStores,
        (SELECT COUNT(*) FROM ratings) AS totalRatings
    `);

    const stats = rows[0] || { totalUsers: 0, totalStores: 0, totalRatings: 0 };

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: Number(stats.totalUsers),
        totalStores: Number(stats.totalStores),
        totalRatings: Number(stats.totalRatings)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users
 * Admin User Listing with search, multi-column filters, sorting, and pagination.
 */
export async function getUsers(req, res, next) {
  try {
    const { name, email, address, role, sortBy, order, page, limit } = req.query;

    const conditions = [];
    const params = [];

    if (name && typeof name === 'string' && name.trim()) {
      conditions.push('u.name LIKE ?');
      params.push(`%${name.trim()}%`);
    }

    if (email && typeof email === 'string' && email.trim()) {
      conditions.push('u.email LIKE ?');
      params.push(`%${email.trim().toLowerCase()}%`);
    }

    if (address && typeof address === 'string' && address.trim()) {
      conditions.push('u.address LIKE ?');
      params.push(`%${address.trim()}%`);
    }

    if (role && typeof role === 'string' && role.trim()) {
      conditions.push('u.role = ?');
      params.push(role.trim().toLowerCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Total count for pagination metadata
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
      params
    );
    const total = Number(countResult[0]?.total || 0);

    // 2. Sorting whitelist validation
    const sortFieldKey = (sortBy || 'id').toLowerCase();
    const sortColumn = ALLOWED_USER_SORT_FIELDS[sortFieldKey] || 'u.id';
    const sortDirection = (order && order.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

    // 3. Pagination calculation
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const pageNum = Math.max(1, Number(page) || 1);
    const offsetNum = (pageNum - 1) * limitNum;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // 4. Query paginated user records
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at AS createdAt, u.updated_at AS updatedAt
       FROM users u
       ${whereClause}
       ORDER BY ${sortColumn} ${sortDirection}
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offsetNum]
    );

    return res.status(200).json({
      success: true,
      data: {
        users,
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
 * POST /api/admin/users
 * Admin creates user account with any assigned role (admin, user, owner).
 */
export async function createUser(req, res, next) {
  try {
    const { name, email, password, address, role } = req.body;

    // 1. Check for duplicate email
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // 3. Insert user record
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, passwordHash, address, role]
    );

    const newUserId = result.insertId;

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: {
        user: {
          id: newUserId,
          name,
          email,
          address,
          role
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users/:id
 * Admin fetches single user by ID.
 */
export async function getUserById(req, res, next) {
  try {
    const userId = Number(req.params.id);

    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at AS createdAt, u.updated_at AS updatedAt
       FROM users u
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: users[0]
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/stores
 * Admin registers a new store and optionally assigns an owner.
 */
export async function createStore(req, res, next) {
  try {
    const { name, email, address, ownerId } = req.body;

    // 1. Verify owner if provided
    if (ownerId !== null) {
      const [owners] = await pool.query(
        'SELECT id, role FROM users WHERE id = ?',
        [ownerId]
      );

      if (owners.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Owner with ID ${ownerId} does not exist.`
        });
      }

      if (owners[0].role !== 'owner') {
        return res.status(400).json({
          success: false,
          message: `User with ID ${ownerId} is not a store owner (current role: '${owners[0].role}').`
        });
      }
    }

    // 2. Check for duplicate store email
    const [existing] = await pool.query(
      'SELECT id FROM stores WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A store with this email address already exists.'
      });
    }

    // 3. Insert store
    const [result] = await pool.query(
      `INSERT INTO stores (name, email, address, owner_id) 
       VALUES (?, ?, ?, ?)`,
      [name, email, address, ownerId]
    );

    const newStoreId = result.insertId;

    return res.status(201).json({
      success: true,
      message: 'Store created successfully.',
      data: {
        store: {
          id: newStoreId,
          name,
          email,
          address,
          ownerId
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/stores
 * Admin store listing with search, filtering, sorting, pagination, and average ratings.
 */
export async function getStores(req, res, next) {
  try {
    const { name, email, address, sortBy, order, page, limit } = req.query;

    const conditions = [];
    const params = [];

    if (name && typeof name === 'string' && name.trim()) {
      conditions.push('s.name LIKE ?');
      params.push(`%${name.trim()}%`);
    }

    if (email && typeof email === 'string' && email.trim()) {
      conditions.push('s.email LIKE ?');
      params.push(`%${email.trim().toLowerCase()}%`);
    }

    if (address && typeof address === 'string' && address.trim()) {
      conditions.push('s.address LIKE ?');
      params.push(`%${address.trim()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM stores s ${whereClause}`,
      params
    );
    const total = Number(countResult[0]?.total || 0);

    // 2. Sorting whitelist
    const sortFieldKey = (sortBy || 'id').toLowerCase();
    const sortColumn = ALLOWED_STORE_SORT_FIELDS[sortFieldKey] || 's.id';
    const sortDirection = (order && order.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

    // 3. Pagination
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const pageNum = Math.max(1, Number(page) || 1);
    const offsetNum = (pageNum - 1) * limitNum;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // 4. Query stores with derived aggregate ratings
    const [stores] = await pool.query(
      `SELECT 
         s.id,
         s.name,
         s.email,
         s.address,
         s.owner_id AS ownerId,
         u.name AS ownerName,
         u.email AS ownerEmail,
         s.created_at AS createdAt,
         s.updated_at AS updatedAt,
         COALESCE(stats.overallRating, 0) AS overallRating,
         COALESCE(stats.totalRatings, 0) AS totalRatings
       FROM stores s
       LEFT JOIN users u ON s.owner_id = u.id
       LEFT JOIN (
         SELECT 
           store_id,
           ROUND(AVG(rating), 2) AS overallRating,
           COUNT(id) AS totalRatings
         FROM ratings
         GROUP BY store_id
       ) stats ON s.id = stats.store_id
       ${whereClause}
       ORDER BY ${sortColumn} ${sortDirection}
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offsetNum]
    );

    const formattedStores = stores.map((s) => ({
      ...s,
      overallRating: Number(s.overallRating) || 0,
      totalRatings: Number(s.totalRatings) || 0
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
 * GET /api/admin/stores/:id
 * Admin fetches single store by ID with owner details and rating stats.
 */
export async function getStoreById(req, res, next) {
  try {
    const storeId = Number(req.params.id);

    const [stores] = await pool.query(
      `SELECT 
         s.id,
         s.name,
         s.email,
         s.address,
         s.owner_id AS ownerId,
         u.name AS ownerName,
         u.email AS ownerEmail,
         s.created_at AS createdAt,
         s.updated_at AS updatedAt,
         COALESCE(stats.overallRating, 0) AS overallRating,
         COALESCE(stats.totalRatings, 0) AS totalRatings
       FROM stores s
       LEFT JOIN users u ON s.owner_id = u.id
       LEFT JOIN (
         SELECT 
           store_id,
           ROUND(AVG(rating), 2) AS overallRating,
           COUNT(id) AS totalRatings
         FROM ratings
         WHERE store_id = ?
         GROUP BY store_id
       ) stats ON s.id = stats.store_id
       WHERE s.id = ?`,
      [storeId, storeId]
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
      totalRatings: Number(stores[0].totalRatings) || 0
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
