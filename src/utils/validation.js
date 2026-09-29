/**
 * Utility functions for frontend input validation
 * Enforces phone number (11 digits starting with 01) and password rules.
 */

/**
 * Validates Bangladeshi phone numbers.
 * Must be 11 digits long and start with '01' (e.g. 01700000000).
 * Handles inputs with or without '+88' prefix.
 *
 * @param {string} phone - Raw phone input
 * @returns {{ isValid: boolean, cleanPhone: string, error: string|null }}
 */
export const validatePhone = (phone = '') => {
  const str = String(phone).trim();
  if (!str) {
    return { isValid: false, cleanPhone: '', error: 'Phone number is required.' };
  }

  // Remove spaces, hyphens, parentheses, and leading '+88' or '88'
  let clean = str.replace(/[\s\-\(\)]/g, '');
  if (clean.startsWith('+88')) {
    clean = clean.substring(3);
  } else if (clean.startsWith('8801') && clean.length === 13) {
    clean = clean.substring(2);
  }

  // Check if exactly 11 digits starting with 01
  const isValid = /^01[3-9]\d{8}$/.test(clean) || /^01\d{9}$/.test(clean);

  if (!isValid) {
    return {
      isValid: false,
      cleanPhone: clean,
      error: 'Phone number must be exactly 11 digits starting with 01 (e.g. 01700000000).'
    };
  }

  return { isValid: true, cleanPhone: clean, error: null };
};

/**
 * Validates password rules for registration or password updates.
 * Rules:
 * - Minimum 6 characters long
 * - Must contain at least one letter and one number
 *
 * @param {string} password - Raw password input
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validatePassword = (password = '') => {
  const str = String(password);
  if (!str) {
    return { isValid: false, error: 'Password is required.' };
  }
  if (str.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long.' };
  }
  const hasLetter = /[a-zA-Z]/.test(str);
  const hasNumber = /[0-9]/.test(str);

  if (!hasLetter || !hasNumber) {
    return { isValid: false, error: 'Password must contain at least one letter and one number.' };
  }

  return { isValid: true, error: null };
};

/**
 * Validates email format.
 *
 * @param {string} email - Raw email input
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validateEmail = (email = '') => {
  const str = String(email).trim().toLowerCase();
  if (!str) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(str)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. user@example.com).' };
  }
  return { isValid: true, error: null };
};

/**
 * Validates full name.
 *
 * @param {string} name
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validateName = (name = '') => {
  const str = String(name).trim();
  if (!str || str.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters long.' };
  }
  return { isValid: true, error: null };
};
