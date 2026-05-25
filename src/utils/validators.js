/**
 * Form validation utility functions
 * Reusable validators for email, password, phone, etc.
 */

export const validators = {
  /**
   * Validate email format
   * @param {string} email
   * @returns {string|null} Error message or null
   */
  email(email) {
    if (!email?.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  },

  /**
   * Validate password strength
   * @param {string} password
   * @param {number} minLength
   * @returns {string|null}
   */
  password(password, minLength = 6) {
    if (!password) return 'Password is required';
    if (password.length < minLength) return `Password must be at least ${minLength} characters`;
    return null;
  },

  /**
   * Validate required field
   * @param {string} value
   * @param {string} fieldName
   * @returns {string|null}
   */
  required(value, fieldName = 'This field') {
    if (!value?.toString().trim()) return `${fieldName} is required`;
    return null;
  },

  /**
   * Validate phone number (Indian format)
   * @param {string} phone
   * @returns {string|null}
   */
  phone(phone) {
    if (!phone?.trim()) return 'Phone number is required';
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) return 'Please enter a valid 10-digit phone number';
    return null;
  },

  /**
   * Validate PAN number
   * @param {string} pan
   * @returns {string|null}
   */
  pan(pan) {
    if (!pan?.trim()) return 'PAN number is required';
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.toUpperCase())) return 'Please enter a valid PAN number';
    return null;
  },
};

export default validators;
