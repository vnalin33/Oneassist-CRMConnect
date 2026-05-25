const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

router.get('/', invoiceController.getAllRequests);
router.get('/stats', invoiceController.getStats);

// Mobile app route: get invoice PDF by track_id (must be before /:id)
router.get('/by-track/:trackId/invoice-pdf', invoiceController.getInvoicePdfByTrackId);

router.get('/:id', invoiceController.getRequestById);

// Status update routes (using PUT as per frontend expectations)
router.put('/:id/approve', invoiceController.approveRequest);
router.put('/:id/reject', invoiceController.rejectRequest);
router.put('/:id/paid', invoiceController.markAsPaid);

// Billing info and PDF invoice routes
router.put('/:id/billing', invoiceController.updateBillingInfo);
router.get('/:id/invoice-pdf', invoiceController.getInvoicePdf);
router.get('/:id/invoice-html', invoiceController.getInvoicePdf); // backward compat — now returns PDF

module.exports = router;
