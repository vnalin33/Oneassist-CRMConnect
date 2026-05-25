/**
 * Auth Service - Authentication API calls
 * Handles login, registration, password reset, and token validation
 */
import api from './api';

const authService = {
  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user: object, token: string}>}
   */
  async login(email, password) {
    return api.post('/auth/login', { email, password });
  },

  /**
   * Register a new account
   * @param {object} userData - { name, email, password, confirmPassword }
   * @returns {Promise<{user: object, token: string}>}
   */
  async register(userData) {
    return api.post('/auth/register', userData);
  },

  /**
   * Request password reset email
   * @param {string} email
   * @returns {Promise<{message: string}>}
   */
  async forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<{message: string}>}
   */
  async resetPassword(token, newPassword) {
    return api.post('/auth/reset-password', { token, newPassword });
  },

  /**
   * Validate an existing token
   * @param {string} token
   * @returns {Promise<{user: object}>}
   */
  async validateToken(token) {
    return api.get('/auth/validate');
  },

  /**
   * Logout - invalidate token on server
   * @returns {Promise<{message: string}>}
   */
  async logout() {
    return api.post('/auth/logout', {});
  },
};

export default authService;
