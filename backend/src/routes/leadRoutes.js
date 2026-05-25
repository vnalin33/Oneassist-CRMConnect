/**
 * Lead Routes - CRM lead management endpoints
 */
const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/leadController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { leadValidation } = require('../middleware/validation');

// GET /api/leads - Public read access for CRM dashboard
router.get('/', LeadController.getAll);

// GET /api/leads/:id - Public read access for CRM dashboard
router.get('/:id', LeadController.getById);

// Protected routes (require authentication)
router.use(authMiddleware);

// POST /api/leads
router.post('/', leadValidation, LeadController.create);

// PUT /api/leads/:id
router.put('/:id', LeadController.update);

// DELETE /api/leads/:id (admin only)
router.delete('/:id', roleMiddleware('admin'), LeadController.delete);

module.exports = router;
