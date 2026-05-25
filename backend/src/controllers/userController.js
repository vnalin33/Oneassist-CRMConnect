/**
 * User Controller - Handles user profile operations
 */
const UserModel = require('../models/UserModel');

const UserController = {
  /**
   * GET /api/users/profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({ success: true, user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/users/profile
   */
  async updateProfile(req, res, next) {
    try {
      const { name, phone } = req.body;
      const updated = await UserModel.update(req.user.id, { name, phone });

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'No changes made',
        });
      }

      const user = await UserModel.findById(req.user.id);
      res.json({ success: true, message: 'Profile updated', user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/users/password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await UserModel.findByEmail(req.user.email);
      const isValid = await UserModel.verifyPassword(currentPassword, user.password);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      await UserModel.updatePassword(req.user.id, newPassword);
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  },
  /**
   * GET /api/users/connectors
   * Admin only - get all connectors and their stats
   */
  async getConnectors(req, res, next) {
    try {
      const connectors = await UserModel.findConnectors();
      console.log(`[DEBUG] Found ${connectors.length} connectors`);
      res.json({ success: true, connectors });
    } catch (error) {
      console.error('[ERROR] getConnectors failed:', error.message);
      next(error);
    }
  },

  /**
   * GET /api/users/notifications
   */
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const notifications = await UserModel.getNotifications(userId, userRole);
      const unreadCount = await UserModel.getUnreadNotificationCount(userId, userRole);
      
      res.json({
        success: true,
        notifications,
        unreadCount
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/users/notifications/read
   */
  async markNotificationsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      await UserModel.markNotificationsRead(userId, userRole);
      
      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/users/notifications/:id
   */
  async deleteNotification(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const notifId = req.params.id;

      const deleted = await UserModel.deleteNotification(notifId, userId, userRole);
      
      if (deleted === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/users/notifications
   */
  async clearAllNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      await UserModel.clearAllNotifications(userId, userRole);

      res.json({
        success: true,
        message: 'All notifications cleared'
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = UserController;
