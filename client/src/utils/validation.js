/**
 * Frontend Validation Rules (Conforming to Backend Rules)
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const UPPERCASE_REGEX = /[A-Z]/;
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export const NAME_MIN = 20;
export const NAME_MAX = 60;
export const ADDRESS_MAX = 400;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 16;

export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim().toLowerCase())) return 'Please enter a valid email address';
  return null;
}

export function validateName(name, fieldName = 'Full Name') {
  if (!name || !name.trim()) return `${fieldName} is required`;
  const len = name.trim().length;
  if (len < NAME_MIN) return `${fieldName} must be at least ${NAME_MIN} characters (${len}/${NAME_MIN})`;
  if (len > NAME_MAX) return `${fieldName} must not exceed ${NAME_MAX} characters`;
  return null;
}

export function validateAddress(address) {
  if (!address || !address.trim()) return 'Address is required';
  if (address.trim().length > ADDRESS_MAX) return `Address must not exceed ${ADDRESS_MAX} characters`;
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
  if (password.length > PASSWORD_MAX) return `Password must not exceed ${PASSWORD_MAX} characters`;
  if (!UPPERCASE_REGEX.test(password)) return 'Password must contain at least one uppercase letter';
  if (!SPECIAL_CHAR_REGEX.test(password)) return 'Password must contain at least one special character';
  return null;
}

export function checkPasswordRequirements(password = '') {
  return {
    length: password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX,
    uppercase: UPPERCASE_REGEX.test(password),
    specialChar: SPECIAL_CHAR_REGEX.test(password)
  };
}
