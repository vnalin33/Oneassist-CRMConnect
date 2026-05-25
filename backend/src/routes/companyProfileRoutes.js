/**
 * Company Profile Routes
 * GET  /api/company-profile       — Get the saved company profile
 * PUT  /api/company-profile       — Update the company profile (Bill From template + logo)
 */
const express = require('express');
const router = express.Router();
const CompanyProfileModel = require('../models/CompanyProfileModel');

// Get company profile
router.get('/', async (req, res, next) => {
  try {
    const profile = await CompanyProfileModel.get();
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

// Update company profile
router.put('/', async (req, res, next) => {
  try {
    const data = req.body;
    const updated = await CompanyProfileModel.update(data);
    res.json({ success: true, message: 'Company profile saved', data: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
