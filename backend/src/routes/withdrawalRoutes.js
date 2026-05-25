/**
 * Withdrawal Routes - Admin portal API routes
 */
const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');

// GET /api/withdrawals - list all requests (with filters)
router.get('/', withdrawalController.getAllRequests);

// GET /api/withdrawals/stats - aggregate statistics
router.get('/stats', withdrawalController.getStats);

// PUT /api/withdrawals/:id/approve
router.put('/:id/approve', withdrawalController.approveRequest);

// PUT /api/withdrawals/:id/reject
router.put('/:id/reject', withdrawalController.rejectRequest);

// PUT /api/withdrawals/:id/paid
router.put('/:id/paid', withdrawalController.markPaid);

module.exports = router;
