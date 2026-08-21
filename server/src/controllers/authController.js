import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { generateToken } from '../utils/jwt.js';

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Register a Normal User.
 * POST /api/auth/signup
 */
export async function signup(req, res, next) {
  try {
    const { name, email, password, address } = req.body;

    // Security Rule: Public signup requests are ALWAYS forced to role 'user'.
    // Client cannot escalate privileges to 'admin' or 'owner'.
    const role = 'user';

    // 1. Check for existing user with this email
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

    // 2. Hash the plaintext password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // 3. Insert user into database with parameterized query
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, passwordHash, address, role]
    );

    const newUserId = result.insertId;

    // 4. Generate JWT token
    const token = generateToken({
      id: newUserId,
      role,
      email
    });

    // 5. Return sanitized response (NEVER return password_hash)
    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user: {
          id: newUserId,
          name,
          email,
          address,
          role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Unified Login for all roles (admin, user, owner).
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const [users] = await pool.query(
      `SELECT id, name, email, password_hash, address, role 
       FROM users 
       WHERE email = ?`,
      [email]
    );

    // Security: Return generic invalid credentials message to prevent account enumeration
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          address: user.address,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetch Current Authenticated User Profile.
 * GET /api/auth/me
 */
export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      `SELECT id, name, email, address, role, created_at, updated_at 
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found or has been deactivated.'
      });
    }

    const user = users[0];

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully.',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change Authenticated User's Password.
 * PATCH /api/auth/change-password
 */
export async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const [users] = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const user = users[0];

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. Please use your new password on next login.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register a Store Owner and create their initial Store in an atomic transaction.
 * POST /api/auth/register-store
 */
export async function registerStoreAndOwner(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { 
      ownerName, 
      ownerEmail, 
      password, 
      ownerAddress,
      storeName,
      storeEmail,
      storeAddress 
    } = req.body;

    if (!ownerName || !ownerEmail || !password || !ownerAddress || !storeName || !storeEmail || !storeAddress) {
      return res.status(400).json({
        success: false,
        message: 'All store and owner information fields are required.'
      });
    }

    if (ownerName.trim().length < 20 || ownerName.trim().length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Owner name must be between 20 and 60 characters.'
      });
    }

    if (storeName.trim().length < 20 || storeName.trim().length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Store name must be between 20 and 60 characters.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail.trim()) || !emailRegex.test(storeEmail.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid email addresses for both owner and store.'
      });
    }

    if (ownerAddress.trim().length > 400 || storeAddress.trim().length > 400) {
      return res.status(400).json({
        success: false,
        message: 'Addresses cannot exceed 400 characters.'
      });
    }

    if (password.length < 8 || password.length > 16) {
      return res.status(400).json({
        success: false,
        message: 'Password must be between 8 and 16 characters.'
      });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter.'
      });
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one special character.'
      });
    }

    await connection.beginTransaction();

    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [ownerEmail.trim().toLowerCase()]
    );
    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'An account with this owner email address already exists.'
      });
    }

    const [existingStore] = await connection.query(
      'SELECT id FROM stores WHERE email = ?',
      [storeEmail.trim().toLowerCase()]
    );
    if (existingStore.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'A store with this business email address already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES (?, ?, ?, ?, 'owner')`,
      [ownerName.trim(), ownerEmail.trim().toLowerCase(), passwordHash, ownerAddress.trim()]
    );
    const newOwnerId = userResult.insertId;

    const [storeResult] = await connection.query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES (?, ?, ?, ?)`,
      [storeName.trim(), storeEmail.trim().toLowerCase(), storeAddress.trim(), newOwnerId]
    );
    const newStoreId = storeResult.insertId;

    await connection.commit();

    const token = generateToken({
      id: newOwnerId,
      role: 'owner',
      email: ownerEmail.trim().toLowerCase()
    });

    return res.status(201).json({
      success: true,
      message: 'Store and Owner account registered successfully.',
      data: {
        user: {
          id: newOwnerId,
          name: ownerName.trim(),
          email: ownerEmail.trim().toLowerCase(),
          address: ownerAddress.trim(),
          role: 'owner'
        },
        store: {
          id: newStoreId,
          name: storeName.trim(),
          email: storeEmail.trim().toLowerCase(),
          address: storeAddress.trim(),
          ownerId: newOwnerId
        },
        token
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}
