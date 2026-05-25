/**
 * CompanyProfile Model
 * Stores the "Bill From" template data + company logo so admin only configures it once.
 * Uses a singleton row (id=1) pattern — there's only one company profile.
 */
const db = require('../config/database');

const CompanyProfileModel = {
  /**
   * Ensure the company_profile table exists at startup.
   */
  async ensureTable() {
    await db.query(`
      CREATE TABLE IF NOT EXISTS company_profile (
        id INTEGER PRIMARY KEY DEFAULT 1,
        company_name VARCHAR(255) DEFAULT '',
        address TEXT DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        email VARCHAR(255) DEFAULT '',
        pan VARCHAR(20) DEFAULT '',
        gstin VARCHAR(20) DEFAULT '',
        place_of_supply VARCHAR(100) DEFAULT '',
        logo_base64 TEXT DEFAULT '',
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT single_row CHECK (id = 1)
      )
    `);

    // Ensure singleton row exists
    const existing = await db.query('SELECT id FROM company_profile WHERE id = 1');
    if (existing.rows.length === 0) {
      await db.query('INSERT INTO company_profile (id) VALUES (1)');
    }
  },

  /**
   * Get the company profile (singleton).
   */
  async get() {
    const result = await db.query('SELECT * FROM company_profile WHERE id = 1');
    return result.rows[0] || null;
  },

  /**
   * Update the company profile.
   */
  async update(data) {
    const result = await db.query(
      `UPDATE company_profile SET
        company_name = $1,
        address = $2,
        phone = $3,
        email = $4,
        pan = $5,
        gstin = $6,
        place_of_supply = $7,
        logo_base64 = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
      RETURNING *`,
      [
        data.company_name || '',
        data.address || '',
        data.phone || '',
        data.email || '',
        data.pan || '',
        data.gstin || '',
        data.place_of_supply || '',
        data.logo_base64 || '',
      ]
    );
    return result.rows[0];
  },
};

module.exports = CompanyProfileModel;
