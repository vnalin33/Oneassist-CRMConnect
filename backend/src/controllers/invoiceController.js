/**
 * Invoice Controller - Handles API logic for invoice requests
 */
const InvoiceModel = require('../models/InvoiceModel');
const { notify } = require('../helpers/notificationHelper');

const invoiceController = {
  /**
   * Get all invoice requests with filters
   */
  async getAllRequests(req, res, next) {
    try {
      const { status, search, page, limit, invoice_type } = req.query;
      const filters = { status, search, invoice_type };
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;

      const result = await InvoiceModel.findAll(filters, pageNum, limitNum);

      // Return format matching frontend expectations
      res.json({
        success: true,
        rows: result.requests,
        total: result.total,
        pagination: {
          total: result.total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(result.total / limitNum)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get invoice statistics
   */
  async getStats(req, res, next) {
    try {
      const stats = await InvoiceModel.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Approve invoice request
   */
  async approveRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { expected_payout_date } = req.body;

      if (!expected_payout_date) {
        return res.status(400).json({
          success: false,
          message: 'Expected payout date is required'
        });
      }

      const updatedRequest = await InvoiceModel.approve(id, expected_payout_date);

      if (!updatedRequest) {
        return res.status(404).json({
          success: false,
          message: 'Invoice request not found'
        });
      }

      // Notify the connector
      notify(updatedRequest.connectorid, 'INVOICE_APPROVED', {
        amount: updatedRequest.total_amount,
        contact_name: updatedRequest.contact_name,
      });

      res.json({
        success: true,
        message: 'Invoice approved successfully',
        data: updatedRequest
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reject invoice request
   */
  async rejectRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      if (!remarks) {
        return res.status(400).json({
          success: false,
          message: 'Rejection remarks are required'
        });
      }

      const updatedRequest = await InvoiceModel.reject(id, remarks);

      if (!updatedRequest) {
        return res.status(404).json({
          success: false,
          message: 'Invoice request not found'
        });
      }

      // Notify the connector
      notify(updatedRequest.connectorid, 'INVOICE_REJECTED', {
        amount: updatedRequest.total_amount,
        contact_name: updatedRequest.contact_name,
        remarks,
      });

      res.json({
        success: true,
        message: 'Invoice rejected successfully',
        data: updatedRequest
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark invoice as paid
   */
  async markAsPaid(req, res, next) {
    try {
      const { id } = req.params;
      const updatedRequest = await InvoiceModel.markAsPaid(id);

      if (!updatedRequest) {
        return res.status(404).json({
          success: false,
          message: 'Invoice request not found'
        });
      }

      // Notify the connector
      notify(updatedRequest.connectorid, 'INVOICE_PAID', {
        amount: updatedRequest.total_amount,
        contact_name: updatedRequest.contact_name,
      });

      res.json({
        success: true,
        message: 'Invoice marked as paid successfully',
        data: updatedRequest
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get request by ID
   */
  async getRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const request = await InvoiceModel.findById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Invoice request not found'
        });
      }

      res.json({
        success: true,
        data: request
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit invoice request (called from mobile app)
   * POST /submitInvoiceRequest
   */
  async submitRequest(req, res, next) {
    try {
      const data = req.body;

      if (!data.connector_id && !data.connectorid) {
        return res.status(400).json({ success: false, message: 'connector_id is required' });
      }

      // Normalize field names (mobile sends connectorid, we store connector_id)
      const normalized = {
        connector_id: data.connector_id || data.connectorid,
        connector_name: data.connector_name || '',
        invoice_number: data.invoice_number || null,
        contact_name: data.contact_name || '',
        loan_type: data.loan_type || '',
        loan_amount: data.loan_amount || 0,
        disbursed_amount: data.disbursed_amount || 0,
        payout_amount: data.payout_amount || 0,
        sgst: data.sgst || 0,
        cgst: data.cgst || 0,
        tds: data.tds || 0,
        total_amount: data.total_amount || 0,
        invoice_type: data.invoice_type || 'instant',
        bank_name: data.bank_name || '',
        track_number: data.track_number || '',
        track_id: data.track_id || null,
        service_type: data.service_type || '',
        processing_type: data.processing_type || '',
        is_gst_registered: data.is_gst_registered || false,
      };

      // Check if already submitted for this track
      if (normalized.track_id) {
        const existing = await InvoiceModel.findByTrackId(normalized.track_id);
        if (existing) {
          return res.status(200).json({
            success: true,
            message: 'Invoice request already exists',
            data: existing,
          });
        }
      }

      const result = await InvoiceModel.create(normalized);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get invoice requests by connector ID (called from mobile app)
   * GET /getInvoiceRequestsByConnector?connectorid=123
   */
  async getByConnector(req, res, next) {
    try {
      const connectorid = req.query.connectorid;
      if (!connectorid) {
        return res.status(400).json({ success: false, message: 'connectorid is required' });
      }
      const rows = await InvoiceModel.findByConnectorId(connectorid);
      res.status(200).json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update billing information (Bill From and Bill To)
   * PUT /invoice-requests/:id/billing
   */
  async updateBillingInfo(req, res, next) {
    try {
      const { id } = req.params;
      const { billingFrom, billingTo } = req.body;

      if (billingFrom) {
        await InvoiceModel.updateBillingFrom(id, billingFrom);
      }
      if (billingTo) {
        await InvoiceModel.updateBillingTo(id, billingTo);
      }

      res.json({ success: true, message: 'Billing info updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Generate TAX INVOICE as PDF
   * GET /invoice-requests/:id/invoice-pdf
   */
  async getInvoicePdf(req, res, next) {
    try {
      const { id } = req.params;
      const request = await InvoiceModel.findById(id);

      if (!request) {
        return res.status(404).json({ success: false, message: 'Invoice request not found' });
      }

      // ── Auto-load Bill From from company_profile table ──
      const CompanyProfileModel = require('../models/CompanyProfileModel');
      let companyProfile;
      try {
        companyProfile = await CompanyProfileModel.get();
      } catch (e) {
        companyProfile = null;
      }

      const billFromData = {
        name: request.billing_from_name || (companyProfile?.company_name) || 'N/A',
        address: request.billing_from_address || (companyProfile?.address) || 'N/A',
        phone: request.billing_from_phone || (companyProfile?.phone) || 'N/A',
        email: request.billing_from_email || (companyProfile?.email) || 'N/A',
        pan: request.billing_from_pan || (companyProfile?.pan) || 'N/A',
        gstin: request.billing_from_gstin || (companyProfile?.gstin) || 'N/A',
        place_of_supply: request.place_of_supply || (companyProfile?.place_of_supply) || 'N/A',
      };
      const logoBase64 = companyProfile?.logo_base64 || '';

      // ── Bill To from connector profile ──
      let billToData = {
        name: request.billing_to_name || 'N/A',
        address: request.billing_to_address || 'N/A',
        phone: request.billing_to_phone || 'N/A',
        email: request.billing_to_email || 'N/A',
        pan: request.billing_to_pan || 'N/A',
        gst: request.billing_to_gst || 'N/A',
      };

      if (billToData.name === 'N/A' && request.connectorid) {
        const profile = await InvoiceModel.getConnectorProfile(request.connectorid);
        if (profile) {
          billToData = {
            name: profile.name || 'N/A',
            address: profile.address || profile.location || 'N/A',
            phone: profile.mobilenumber || 'N/A',
            email: profile.emailid || 'N/A',
            pan: profile.pan_number || 'N/A',
            gst: profile.gst_number || 'N/A',
          };
          await InvoiceModel.updateBillingTo(id, billToData);
        }
      }

      // ── Number to Words (Indian) ──
      const numberToWords = (num) => {
        if (!num || isNaN(num) || Number(num) === 0) return 'Zero Rupees Only';
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const numStr = Math.floor(Math.abs(num)).toString();
        if (numStr.length > 9) return 'Amount too large';
        const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
        const paise = Math.round((Math.abs(num) - Math.floor(Math.abs(num))) * 100);
        let paiseStr = '';
        if (paise > 0) {
          const p = ('00' + paise).substr(-2).match(/^(\d{2})$/);
          paiseStr = ' and ' + (a[Number(p[1])] || b[p[1][0]] + ' ' + a[p[1][1]]) + 'Paise';
        }
        return str.trim() + ' Rupees' + paiseStr + ' Only';
      };

      const fmtINR = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const invoiceDate = new Date(request.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      // ── Logo HTML ──
      const logoHtml = logoBase64
        ? `<img src="${logoBase64}" style="max-height:60px; max-width:180px; object-fit:contain;" />`
        : '';

      // ── Build HTML ──
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Tax Invoice</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a2e; padding: 30px 40px; line-height: 1.5; }
          .invoice-container { max-width: 780px; margin: 0 auto; }
          .title-bar { text-align: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; padding: 14px; font-size: 18px; font-weight: 700; letter-spacing: 2px; border-radius: 6px 6px 0 0; }
          .header-section { display: flex; justify-content: space-between; align-items: flex-start; padding: 18px; border: 1px solid #e0e0e0; border-top: none; background: #fafbff; }
          .company-info { flex: 1; }
          .company-info .name { font-size: 15px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
          .company-info .detail { color: #555; font-size: 10.5px; }
          .logo-box { text-align: right; }
          .bill-section { display: flex; border: 1px solid #e0e0e0; border-top: none; }
          .bill-col { flex: 1; padding: 14px 18px; }
          .bill-col:first-child { border-right: 1px solid #e0e0e0; }
          .bill-col h4 { font-size: 11px; text-transform: uppercase; color: #6C5CE7; margin-bottom: 8px; letter-spacing: 1px; font-weight: 700; }
          .bill-col .name { font-weight: 700; font-size: 12px; margin-bottom: 3px; }
          .bill-col .info { color: #555; font-size: 10.5px; line-height: 1.6; }
          .meta-section { display: flex; border: 1px solid #e0e0e0; border-top: none; background: #fafbff; }
          .meta-col { flex: 1; padding: 10px 18px; }
          .meta-col:first-child { border-right: 1px solid #e0e0e0; }
          .meta-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10.5px; }
          .meta-row .lbl { color: #888; }
          .meta-row .val { font-weight: 600; }
          .items-table { width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; border-top: none; }
          .items-table th { background: #1a1a2e; color: #fff; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .items-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 11px; }
          .items-table tr:last-child td { border-bottom: none; }
          .total-row td { background: #f0f4ff; font-weight: 700; font-size: 12px; }
          .footer-section { border: 1px solid #e0e0e0; border-top: none; padding: 14px 18px; }
          .amount-words { background: #f8f9ff; padding: 10px 14px; border-radius: 4px; font-size: 11px; color: #333; }
          .amount-words strong { color: #6C5CE7; }
          .signature-section { display: flex; justify-content: space-between; padding: 30px 18px 10px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 6px 6px; }
          .sig-box { text-align: center; }
          .sig-line { border-top: 1px solid #999; width: 150px; margin-top: 40px; padding-top: 4px; font-size: 10px; color: #777; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="title-bar">TAX INVOICE</div>

          <div class="header-section">
            <div class="company-info">
              <div class="name">${billFromData.name}</div>
              <div class="detail">${billFromData.address}</div>
              <div class="detail">Phone: ${billFromData.phone} | Email: ${billFromData.email}</div>
              <div class="detail">PAN: ${billFromData.pan} | GSTIN: ${billFromData.gstin}</div>
            </div>
            <div class="logo-box">${logoHtml}</div>
          </div>

          <div class="bill-section">
            <div class="bill-col">
              <h4>Bill To</h4>
              <div class="name">${billToData.name}</div>
              <div class="info">
                ${billToData.address}<br/>
                Phone: ${billToData.phone}<br/>
                Email: ${billToData.email}<br/>
                PAN: ${billToData.pan}<br/>
                GSTIN: ${billToData.gst}
              </div>
            </div>
            <div class="bill-col">
              <h4>Invoice Details</h4>
              <div class="meta-row"><span class="lbl">Invoice No:</span><span class="val">${request.invoice_number || 'N/A'}</span></div>
              <div class="meta-row"><span class="lbl">Ref No:</span><span class="val">${request.track_number || 'N/A'}</span></div>
              <div class="meta-row"><span class="lbl">Invoice Date:</span><span class="val">${invoiceDate}</span></div>
              <div class="meta-row"><span class="lbl">Place of Supply:</span><span class="val">${billFromData.place_of_supply}</span></div>
              <div class="meta-row"><span class="lbl">Reverse Charge:</span><span class="val">No</span></div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width:50px;">S.No</th>
                <th>Service Description</th>
                <th style="width:120px;text-align:right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>${request.service_type || 'Commission & Brokerage'}${request.loan_type ? ' — ' + request.loan_type : ''}</td>
                <td style="text-align:right;">${fmtINR(request.payout_amount)}</td>
              </tr>
              ${!request.is_gst_registered ? `
              <tr>
                <td></td>
                <td style="color:#888;">Less: SGST (9%)</td>
                <td style="text-align:right;color:#c0392b;">- ${fmtINR(request.sgst)}</td>
              </tr>
              <tr>
                <td></td>
                <td style="color:#888;">Less: CGST (9%)</td>
                <td style="text-align:right;color:#c0392b;">- ${fmtINR(request.cgst)}</td>
              </tr>` : `
              <tr>
                <td></td>
                <td style="color:#888;">Add: SGST (9%)</td>
                <td style="text-align:right;color:#27ae60;">+ ${fmtINR(request.sgst)}</td>
              </tr>
              <tr>
                <td></td>
                <td style="color:#888;">Add: CGST (9%)</td>
                <td style="text-align:right;color:#27ae60;">+ ${fmtINR(request.cgst)}</td>
              </tr>`}
              <tr>
                <td></td>
                <td style="color:#888;">Less: TDS (2%)</td>
                <td style="text-align:right;color:#c0392b;">- ${fmtINR(request.tds)}</td>
              </tr>
              <tr class="total-row">
                <td></td>
                <td>Grand Total</td>
                <td style="text-align:right;color:#6C5CE7;font-size:14px;">₹ ${fmtINR(request.total_amount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-section">
            <div class="amount-words">
              <strong>Amount in Words:</strong> ${numberToWords(request.total_amount)}
            </div>
          </div>

          <div class="signature-section">
            <div class="sig-box">
              <div class="sig-line">Receiver's Signature</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </body>
      </html>
      `;

      // ── Return print-ready HTML (frontend handles Save as PDF via browser print) ──
      res.set({ 'Content-Type': 'text/html' });
      res.send(html);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get invoice PDF by track_id (for mobile app download)
   * GET /invoice-requests/by-track/:trackId/invoice-pdf
   */
  async getInvoicePdfByTrackId(req, res, next) {
    try {
      const trackId = parseInt(req.params.trackId, 10);
      if (!trackId) {
        return res.status(400).json({ success: false, message: 'Invalid track ID' });
      }

      const invoiceReq = await InvoiceModel.findByTrackId(trackId);
      if (!invoiceReq) {
        return res.status(404).json({ success: false, message: 'No invoice request found for this track ID' });
      }

      // Reuse the existing getInvoicePdf by setting req.params.id
      req.params.id = invoiceReq.id;
      return invoiceController.getInvoicePdf(req, res, next);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = invoiceController;

