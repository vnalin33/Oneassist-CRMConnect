/**
 * Dashboard Routes - CRM administrative dashboard metrics
 */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Protected dashboard routes (require authentication and admin/employee/finance agent role)
router.use(authMiddleware);
router.use(roleMiddleware('admin', 'employee', 'finance agent'));

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getStats);

module.exports = router;
