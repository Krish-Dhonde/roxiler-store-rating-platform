export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 16;
export const UPPERCASE_REGEX = /[A-Z]/;
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

// Name rules: 20 to 60 characters
export const NAME_MIN_LENGTH = 20;
export const NAME_MAX_LENGTH = 60;

// Address rules: Maximum 400 characters
export const ADDRESS_MAX_LENGTH = 400;

// Allowed system roles
export const ALLOWED_ROLES = ['admin', 'user', 'owner'];

export function validateName(name, fieldName = 'Name') {
  if (typeof name !== 'string' || !name.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN_LENGTH) {
    return { isValid: false, error: `${fieldName} must be at least ${NAME_MIN_LENGTH} characters long` };
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return { isValid: false, error: `${fieldName} must not exceed ${NAME_MAX_LENGTH} characters` };
  }
  return { isValid: true };
}

export function validateEmail(email, fieldName = 'Email') {
  if (typeof email !== 'string' || !email.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: `Invalid ${fieldName.toLowerCase()} address format` };
  }
  if (trimmed.length > 255) {
    return { isValid: false, error: `${fieldName} must not exceed 255 characters` };
  }
  return { isValid: true };
}

export function validatePassword(password) {
  if (typeof password !== 'string' || !password) {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { isValid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { isValid: false, error: `Password must not exceed ${PASSWORD_MAX_LENGTH} characters` };
  }
  if (!UPPERCASE_REGEX.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character (!@#$%^&*...)' };
  }
  return { isValid: true };
}

export function validateAddress(address, fieldName = 'Address') {
  if (typeof address !== 'string' || !address.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  const trimmed = address.trim();
  if (trimmed.length > ADDRESS_MAX_LENGTH) {
    return { isValid: false, error: `${fieldName} must not exceed ${ADDRESS_MAX_LENGTH} characters` };
  }
  return { isValid: true };
}

export function validateRole(role) {
  if (!role || typeof role !== 'string') {
    return { isValid: false, error: 'Role is required' };
  }
  const trimmed = role.trim().toLowerCase();
  if (!ALLOWED_ROLES.includes(trimmed)) {
    return { isValid: false, error: `Role must be one of: [${ALLOWED_ROLES.join(', ')}]` };
  }
  return { isValid: true };
}

export function validateRating(rating) {
  if (rating === undefined || rating === null || rating === '') {
    return { isValid: false, error: 'Rating is required' };
  }
  const num = Number(rating);
  if (!Number.isInteger(num) || num < 1 || num > 5) {
    return { isValid: false, error: 'Rating must be an integer between 1 and 5' };
  }
  return { isValid: true };
}

export function validateId(id, fieldName = 'ID') {
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) {
    return { isValid: false, error: `Invalid ${fieldName}. Must be a positive integer.` };
  }
  return { isValid: true };
}
