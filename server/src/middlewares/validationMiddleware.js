import {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
  validateRole,
  validateRating,
  validateId
} from '../utils/validation.js';

export function validateSignupBody(req, res, next) {
  const { name, email, password, address } = req.body || {};
  const errors = [];

  const nameValidation = validateName(name, 'Name');
  if (!nameValidation.isValid) errors.push(nameValidation.error);

  const emailValidation = validateEmail(email, 'Email');
  if (!emailValidation.isValid) errors.push(emailValidation.error);

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) errors.push(passwordValidation.error);

  const addressValidation = validateAddress(address, 'Address');
  if (!addressValidation.isValid) errors.push(addressValidation.error);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Normalize trimmed values into request
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.address = address.trim();

  next();
}

export function validateLoginBody(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

export function validateChangePasswordBody(req, res, next) {
  const { currentPassword, newPassword } = req.body || {};
  const errors = [];

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.push('Current password is required');
  }

  const newPasswordValidation = validatePassword(newPassword);
  if (!newPasswordValidation.isValid) {
    errors.push(newPasswordValidation.error);
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('New password must be different from current password');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

export function validateAdminCreateUserBody(req, res, next) {
  const { name, email, password, address, role } = req.body || {};
  const errors = [];

  const nameValidation = validateName(name, 'Name');
  if (!nameValidation.isValid) errors.push(nameValidation.error);

  const emailValidation = validateEmail(email, 'Email');
  if (!emailValidation.isValid) errors.push(emailValidation.error);

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) errors.push(passwordValidation.error);

  const addressValidation = validateAddress(address, 'Address');
  if (!addressValidation.isValid) errors.push(addressValidation.error);

  const roleValidation = validateRole(role);
  if (!roleValidation.isValid) errors.push(roleValidation.error);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.address = address.trim();
  req.body.role = role.trim().toLowerCase();

  next();
}

export function validateStoreBody(req, res, next) {
  const { name, email, address, ownerId } = req.body || {};
  const errors = [];

  const nameValidation = validateName(name, 'Store name');
  if (!nameValidation.isValid) errors.push(nameValidation.error);

  const emailValidation = validateEmail(email, 'Store email');
  if (!emailValidation.isValid) errors.push(emailValidation.error);

  const addressValidation = validateAddress(address, 'Store address');
  if (!addressValidation.isValid) errors.push(addressValidation.error);

  if (ownerId !== undefined && ownerId !== null && ownerId !== '') {
    const ownerIdValidation = validateId(ownerId, 'Owner ID');
    if (!ownerIdValidation.isValid) {
      errors.push(ownerIdValidation.error);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.address = address.trim();
  if (ownerId !== undefined && ownerId !== null && ownerId !== '') {
    req.body.ownerId = Number(ownerId);
  } else {
    req.body.ownerId = null;
  }

  next();
}

export function validateRatingBody(req, res, next) {
  const { storeId, rating } = req.body || {};
  const errors = [];

  const storeIdValidation = validateId(storeId, 'Store ID');
  if (!storeIdValidation.isValid) errors.push(storeIdValidation.error);

  const ratingValidation = validateRating(rating);
  if (!ratingValidation.isValid) errors.push(ratingValidation.error);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.storeId = Number(storeId);
  req.body.rating = Number(rating);

  next();
}

export function validatePatchRatingBody(req, res, next) {
  const { rating } = req.body || {};
  const errors = [];

  const ratingValidation = validateRating(rating);
  if (!ratingValidation.isValid) errors.push(ratingValidation.error);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.rating = Number(rating);
  next();
}

export function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    const idVal = req.params[paramName];
    const validation = validateId(idVal, paramName);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }
    req.params[paramName] = Number(idVal);
    next();
  };
}
