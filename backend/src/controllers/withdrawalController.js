/**
 * Withdrawal Controller - Handles API logic for withdrawal requests
 */
const db = require('../config/database');
const { notify } = require('../helpers/notificationHelper');

const withdrawalController = {
  /**
   * Submit a new withdrawal request (from mobile app)
   */
  async submitRequest(req, res) {
    try {
      const { connector_id, connector_name, amount, bank_details } = req.body;

      if (!connector_id || !amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid request data' });
      }

      const query = `
        INSERT INTO withdrawals (connector_id, connector_name, amount, status, bank_details)
        VALUES ($1, $2, $3, 'pending', $4)
        RETURNING *
      `;
      const result = await db.query(query, [
        connector_id,
        connector_name || '',
        amount,
        JSON.stringify(bank_details || {})
      ]);

      res.status(201).json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * Get withdrawal requests by connector ID (for mobile app)
   */
  async getByConnector(req, res) {
    try {
      const { connector_id } = req.query;
      if (!connector_id) {
        return res.json({ success: true, data: [] });
      }

      const query = `
        SELECT * FROM withdrawals 
        WHERE connector_id = $1 
        ORDER BY request_date DESC
      `;
      const result = await db.query(query, [connector_id]);

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * Get all withdrawal requests with filters (admin portal)
   */
  async getAllRequests(req, res, next) {
    try {
      const { status, search, page, limit } = req.query;
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const offset = (pageNum - 1) * limitNum;

      let whereClause = '1=1';
      const params = [];
      let counter = 1;

      if (status && status !== 'all') {
        whereClause += ` AND w.status = $${counter}`;
        params.push(status);
        counter++;
      }

      if (search) {
        whereClause += ` AND (w.connector_name ILIKE $${counter})`;
        params.push(`%${search}%`);
        counter++;
      }

      const limitIdx = counter++;
      const offsetIdx = counter++;

      const query = `
        SELECT w.*, 
               c.name as partner_name, c.mobilenumber as partner_phone, 
               c.emailid as partner_email,
               c.bank_name as connector_bank_name, c.account_holder_name as connector_account_holder,
               c.ifsc as connector_ifsc, c.accountnumber as connector_account, c.branch as connector_branch
        FROM withdrawals w
        LEFT JOIN connector c ON w.connector_id = c.id
        WHERE ${whereClause}
        ORDER BY w.request_date DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const result = await db.query(query, [...params, limitNum, offset]);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM withdrawals w
        WHERE ${whereClause}
      `;
      const countResult = await db.query(countQuery, params);

      res.json({
        success: true,
        rows: result.rows,
        total: parseInt(countResult.rows[0].total),
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(parseInt(countResult.rows[0].total) / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      next(error);
    }
  },

  /**
   * Get withdrawal statistics (admin portal)
   */
  async getStats(req, res, next) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
          COUNT(*) FILTER (WHERE status = 'paid') as paid,
          COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as total_paid_amount,
          COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as total_pending_amount
        FROM withdrawals
      `;
      const result = await db.query(query);
      const row = result.rows[0];

      res.json({
        success: true,
        data: {
          total: parseInt(row.total),
          pending: parseInt(row.pending),
          approved: parseInt(row.approved),
          rejected: parseInt(row.rejected),
          paid: parseInt(row.paid),
          totalPaidAmount: parseFloat(row.total_paid_amount),
          totalPendingAmount: parseFloat(row.total_pending_amount),
        }
      });
    } catch (error) {
      console.error('Error fetching withdrawal stats:', error);
      next(error);
    }
  },

  /**
   * Approve withdrawal request
   */
  async approveRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      const query = `
        UPDATE withdrawals 
        SET status = 'approved', remarks = $2, approved_date = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await db.query(query, [id, remarks || '']);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      // Notify the connector
      const row = result.rows[0];
      notify(row.connector_id, 'WITHDRAWAL_APPROVED', { amount: row.amount });

      res.json({ success: true, message: 'Withdrawal approved', data: row });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reject withdrawal request
   */
  async rejectRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      const query = `
        UPDATE withdrawals 
        SET status = 'rejected', remarks = $2
        WHERE id = $1
        RETURNING *
      `;
      const result = await db.query(query, [id, remarks || '']);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      // Notify the connector
      const row = result.rows[0];
      notify(row.connector_id, 'WITHDRAWAL_REJECTED', { amount: row.amount, remarks });

      res.json({ success: true, message: 'Withdrawal rejected', data: row });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark withdrawal as paid
   */
  async markPaid(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      const query = `
        UPDATE withdrawals 
        SET status = 'paid', remarks = $2, paid_date = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await db.query(query, [id, remarks || '']);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      // Notify the connector
      const row = result.rows[0];
      notify(row.connector_id, 'WITHDRAWAL_PAID', { amount: row.amount });

      res.json({ success: true, message: 'Withdrawal marked as paid', data: row });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = withdrawalController;
