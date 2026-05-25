/**
 * User Routes - Profile management endpoints
 */
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/users/connectors - Public read access for CRM dashboard
router.get('/connectors', UserController.getConnectors);

// All remaining user routes require authentication
router.use(authMiddleware);

// GET /api/users/profile
router.get('/profile', UserController.getProfile);

// PUT /api/users/profile
router.put('/profile', UserController.updateProfile);

// PATCH /api/users/password
router.patch('/password', UserController.changePassword);

// GET /api/users/notifications
router.get('/notifications', UserController.getNotifications);

// POST /api/users/notifications/read
router.post('/notifications/read', UserController.markNotificationsRead);

// DELETE /api/users/notifications (clear all — must be before /:id)
router.delete('/notifications', UserController.clearAllNotifications);

// DELETE /api/users/notifications/:id (delete single)
router.delete('/notifications/:id', UserController.deleteNotification);

module.exports = router;
