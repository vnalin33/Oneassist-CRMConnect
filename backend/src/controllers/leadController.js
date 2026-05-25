/**
 * Lead Controller - Handles lead/contact CRUD operations
 */
const LeadModel = require('../models/LeadModel');

const LeadController = {
  /**
   * POST /api/leads
   */
  async create(req, res, next) {
    try {
      const leadData = {
        ...req.body,
        created_by: req.user.id,
      };

      const lead = await LeadModel.create(leadData);
      res.status(201).json({ success: true, message: 'Lead created', lead });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/leads
   */
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, status, search, loantype } = req.query;
      const filters = {};

      if (status) filters.status = status;
      if (search) filters.search = search;
      if (loantype) filters.loantype = loantype;

      /* 
      // Non-admin users only see their own leads
      if (req.user.role?.toLowerCase() !== 'admin') {
        filters.assigned_to = req.user.id;
      }
      */

      const result = await LeadModel.findAll(filters, parseInt(page), parseInt(limit));
      res.json({
        success: true,
        ...result,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / parseInt(limit)),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/leads/:id
   */
  async getById(req, res, next) {
    try {
      const lead = await LeadModel.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      res.json({ success: true, lead });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/leads/:id
   */
  async update(req, res, next) {
    try {
      const updated = await LeadModel.update(req.params.id, req.body);
      if (!updated) {
        return res.status(400).json({ success: false, message: 'No changes made' });
      }

      const lead = await LeadModel.findById(req.params.id);
      res.json({ success: true, message: 'Lead updated', lead });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/leads/:id
   */
  async delete(req, res, next) {
    try {
      const deleted = await LeadModel.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      res.json({ success: true, message: 'Lead deleted' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = LeadController;
