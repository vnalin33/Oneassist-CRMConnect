/**
 * Auth Routes - Authentication endpoints
 */
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { loginValidation, registerValidation } = require('../middleware/validation');

// POST /api/auth/login
router.post('/login', loginValidation, AuthController.login);

// POST /api/auth/register
router.post('/register', registerValidation, AuthController.register);

// GET /api/auth/validate (protected)
router.get('/validate', authMiddleware, AuthController.validate);

// POST /api/auth/forgot-password
router.post('/forgot-password', AuthController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', AuthController.resetPassword);

// POST /api/auth/logout (protected)
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;
