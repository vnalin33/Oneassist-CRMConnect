/**
 * User Model - Database operations for users, connectors, and employees
 * Fixed PostgreSQL SUM error by casting loanamount to NUMERIC
 */
const db = require('../config/database');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

function getConnectorRole(connector) {
  return 'admin';
}

const UserModel = {
  /**
   * Find administrative user by email (from 'users' table)
   */
  async findByEmail(email) {
    // 1. Try users table
    const userRes = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    if (userRes.rows.length > 0) return { ...userRes.rows[0], role: 'admin', _table: 'users' };

    // 2. Try capital "Connector" table
    const capRes = await db.query('SELECT id, username, password, employeename as name, email FROM "Connector" WHERE email = $1 LIMIT 1', [email]);
    if (capRes.rows.length > 0) {
      const conn = capRes.rows[0];
      return { ...conn, role: 'admin', _table: 'Connector' };
    }

    return null;
  },

  /**
   * Find administrative user by ID (from 'users' table)
   */
  async findById(id) {
    // 1. Try users table
    const userRes = await db.query('SELECT id, name, email, role, mobile as phone FROM users WHERE id = $1 LIMIT 1', [id]);
    if (userRes.rows.length > 0) return { ...userRes.rows[0], role: 'admin', _table: 'users' };

    // 2. Try capital "Connector" table
    const capRes = await db.query('SELECT id, employeename as name, email, username FROM "Connector" WHERE id = $1 LIMIT 1', [id]);
    if (capRes.rows.length > 0) {
      const conn = capRes.rows[0];
      return { ...conn, role: 'admin', _table: 'Connector' };
    }

    return null;
  },

  /**
   * Get all connectors with their lead counts from the 'connector' table
   * Joins with 'leadpersonaldetails' to count connects
   */
  async findConnectors() {
    // Querying lowercase connector table for mobile app users
    const result = await db.query(
      `SELECT 
        c.id, c.name as name, c.emailid as email, c.mobilenumber as phone, 
        c.isactive, c."createdDate" as created_at,
        COUNT(l.id) as total_connects,
        COALESCE(SUM(NULLIF(l.loanamount, '')::NUMERIC), 0) as total_business
       FROM connector c
       LEFT JOIN leadpersonaldetails l ON c.id = l.connectorid
       GROUP BY c.id, c.name, c.emailid, c.mobilenumber, c.isactive, c."createdDate"
       ORDER BY total_connects DESC`
     );
     return result.rows;
  },

  /**
   * Create a new administrative user
   */
  async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const result = await db.query(
      'INSERT INTO users (name, email, password, role, mobile) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userData.name, userData.email, hashedPassword, userData.role || 'connector', userData.phone || null]
    );
    return { id: result.rows[0].id, ...userData, password: undefined };
  },

  /**
   * Update administrative user profile
   */
  async update(id, updates) {
    const user = await this.findById(id);
    if (!user) return false;

    const table = user._table;
    const fields = [];
    const values = [];
    let counter = 1;

    // Mapping for different tables
    const mapping = {
      users: { name: 'name', phone: 'mobile', email: 'email' },
      Connector: { name: 'employeename', email: 'email', phone: 'phone' }
    };

    const currentMapping = mapping[table];

    Object.entries(updates).forEach(([key, value]) => {
      const dbField = currentMapping[key];
      if (dbField && key !== 'id' && key !== 'password') {
        fields.push(`${dbField} = $${counter}`);
        values.push(value);
        counter++;
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    
    // Use double quotes for capital table name and specific update columns
    const tableName = table === 'Connector' ? '"Connector"' : table;
    
    // Determine which timestamp column to update
    let updateTimeClause = '';
    if (table === 'users') {
      // 'users' table has no updated_at column
      updateTimeClause = '';
    } else {
      // 'Connector' uses 'updatedDate'
      updateTimeClause = ', "updatedDate" = NOW()';
    }

    const query = `UPDATE ${tableName} SET ${fields.join(', ')}${updateTimeClause} WHERE id = $${counter}`;
    
    const result = await db.query(query, values);

    return result.rowCount > 0;
  },

  /**
   * Update user password
   */
  async updatePassword(id, newPassword) {
    const user = await this.findById(id);
    if (!user) return false;

    const table = user._table;
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    const tableName = table === 'Connector' ? '"Connector"' : table;
    
    let updateTimeClause = '';
    if (table !== 'users') {
      updateTimeClause = ', "updatedDate" = NOW()';
    }

    const result = await db.query(
      `UPDATE ${tableName} SET password = $1${updateTimeClause} WHERE id = $2`,
      [hashedPassword, id]
    );

    return result.rowCount > 0;
  },

  /**
   * Verify user password
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * Fetch recent notifications
   */
  async getNotifications(userId, userRole) {
    let query;
    let params;
    if (userRole === 'admin' || userRole === 'employee' || userRole === 'finance agent') {
      query = 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50';
      params = [];
    } else {
      query = 'SELECT * FROM notifications WHERE connectorid = $1 ORDER BY created_at DESC LIMIT 50';
      params = [userId];
    }
    const result = await db.query(query, params);
    return result.rows;
  },

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(userId, userRole) {
    let query;
    let params;
    if (userRole === 'admin' || userRole === 'employee' || userRole === 'finance agent') {
      query = 'SELECT COUNT(*)::integer as count FROM notifications WHERE read_status = false';
      params = [];
    } else {
      query = 'SELECT COUNT(*)::integer as count FROM notifications WHERE connectorid = $1 AND read_status = false';
      params = [userId];
    }
    const result = await db.query(query, params);
    return result.rows[0].count;
  },

  /**
   * Mark all notifications as read
   */
  async markNotificationsRead(userId, userRole) {
    let query;
    let params;
    if (userRole === 'admin' || userRole === 'employee' || userRole === 'finance agent') {
      query = 'UPDATE notifications SET read_status = true WHERE read_status = false';
      params = [];
    } else {
      query = 'UPDATE notifications SET read_status = true WHERE connectorid = $1 AND read_status = false';
      params = [userId];
    }
    const result = await db.query(query, params);
    return result.rowCount;
  },

  /**
   * Delete a single notification by ID
   */
  async deleteNotification(notifId, userId, userRole) {
    let query;
    let params;
    if (userRole === 'admin' || userRole === 'employee' || userRole === 'finance agent') {
      query = 'DELETE FROM notifications WHERE id = $1';
      params = [notifId];
    } else {
      query = 'DELETE FROM notifications WHERE id = $1 AND connectorid = $2';
      params = [notifId, userId];
    }
    const result = await db.query(query, params);
    return result.rowCount;
  },

  /**
   * Clear all notifications
   */
  async clearAllNotifications(userId, userRole) {
    let query;
    let params;
    if (userRole === 'admin' || userRole === 'employee' || userRole === 'finance agent') {
      query = 'DELETE FROM notifications';
      params = [];
    } else {
      query = 'DELETE FROM notifications WHERE connectorid = $1';
      params = [userId];
    }
    const result = await db.query(query, params);
    return result.rowCount;
  },
};

module.exports = UserModel;
