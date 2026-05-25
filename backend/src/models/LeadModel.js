/**
 * Lead Model - Database operations for leads/contacts
 * Updated to fetch from leadpersonaldetails table and join with connector table
 */
const db = require('../config/database');

const LeadModel = {
  /**
   * Get leads with filters and pagination from leadpersonaldetails
   * Joins with connector table to get connector name
   */
  async findAll(filters = {}, page = 1, limit = 20) {
    let whereClause = '1=1';
    const params = [];
    let counter = 1;

    // Map filters to table columns
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'Converted') {
        whereClause += ` AND l.status IN (17, 18, 20)`;
      } else if (filters.status === 'Rejected') {
        whereClause += ` AND l.status IN (5, 7, 9, 14, 16, 21, 23)`;
      } else if (filters.status === 'Pending') {
        whereClause += ` AND l.status IN (6, 8, 12, 13, 15, 19)`;
      } else if (filters.status === 'Active') {
        whereClause += ` AND l.status NOT IN (5, 7, 9, 14, 16, 17, 18, 20, 21, 23)`;
      } else {
        whereClause += ` AND l.status = $${counter}`;
        params.push(filters.status);
        counter++;
      }
    }

    if (filters.loantype && filters.loantype !== 'all') {
      whereClause += ` AND l.loantype = $${counter}`;
      params.push(filters.loantype);
      counter++;
    }

    if (filters.assigned_to) {
      whereClause += ` AND l.connectorid = $${counter}`;
      params.push(filters.assigned_to);
      counter++;
    }

    if (filters.search) {
      // Use ILIKE for case-insensitive search across name and contact info
      whereClause += ` AND (l.firstname ILIKE $${counter} OR l.lastname ILIKE $${counter} OR l.email ILIKE $${counter} OR l.mobilenumber ILIKE $${counter})`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm);
      counter++;
    }

    const offset = (page - 1) * limit;
    const limitIdx = counter++;
    const offsetIdx = counter++;
    
    // Query fetching from leadpersonaldetails joined with connector table
    const result = await db.query(
      `SELECT l.*, 
              (COALESCE(l.firstname, '') || ' ' || COALESCE(l.lastname, '')) as full_name, 
              c.name as connector_name 
       FROM leadpersonaldetails l
       LEFT JOIN connector c ON l.connectorid = c.id
       WHERE ${whereClause} 
       ORDER BY l.createdon DESC NULLS LAST
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...params, limit, offset]
    );

    const totalResult = await db.query(
      `SELECT COUNT(*) as total FROM leadpersonaldetails l WHERE ${whereClause}`,
      params
    );

    return { 
      leads: result.rows, 
      total: parseInt(totalResult.rows[0]?.total || 0) 
    };
  },

  /**
   * Find lead by ID from leadpersonaldetails
   */
  async findById(id) {
    const result = await db.query(
      `SELECT l.*, 
              (COALESCE(l.firstname, '') || ' ' || COALESCE(l.lastname, '')) as full_name, 
              c.name as connector_name 
       FROM leadpersonaldetails l
       LEFT JOIN connector c ON l.connectorid = c.id
       WHERE l.id = $1 LIMIT 1`, 
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Create a new lead in leadpersonaldetails
   */
  async create(leadData) {
    const result = await db.query(
      `INSERT INTO leadpersonaldetails (
        firstname, lastname, email, mobilenumber, loantype, loanamount, connectorid, status, createdon
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id`,
      [
        leadData.firstname,
        leadData.lastname,
        leadData.email || null,
        leadData.mobilenumber,
        leadData.loantype || null,
        leadData.loanamount || 0,
        leadData.connectorid,
        leadData.status || 'pending'
      ]
    );
    return { id: result.rows[0].id, ...leadData };
  },
};

module.exports = LeadModel;
