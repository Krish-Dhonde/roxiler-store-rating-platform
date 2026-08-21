import { verifyToken } from '../utils/jwt.js';

/**
 * Authentication Middleware: authenticateToken
 * 
 * Verifies the incoming JWT from the Authorization header (`Bearer <token>`).
 * If valid, attaches the decoded user payload to `req.user`.
 * If missing, invalid, or expired, halts the request pipeline with HTTP 401 Unauthorized.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization header provided.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Malformed authorization header. Format must be: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
}

/**
 * Optional Authentication Middleware: optionalAuthenticateToken
 * 
 * Inspects Authorization header if present.
 * If valid token is supplied, attaches req.user.
 * If no token or header is supplied, sets req.user = null and continues.
 */
export function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(parts[1]);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };
  } catch {
    req.user = null;
  }

  next();
}
