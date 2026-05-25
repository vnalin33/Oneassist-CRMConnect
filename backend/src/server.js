/**
 * Server Entry Point
 * Initializes Express application with middleware and routes
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 3000;

// Ensure invoice_requests table exists
const ensureInvoiceRequestsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS invoice_requests (
        id                  SERIAL PRIMARY KEY,
        connector_id        INTEGER,
        connector_name      VARCHAR(255),
        invoice_number      VARCHAR(50),
        contact_name        VARCHAR(255),
        loan_type           VARCHAR(100),
        loan_amount         NUMERIC(15,2) DEFAULT 0,
        disbursed_amount    NUMERIC(15,2) DEFAULT 0,
        payout_amount       NUMERIC(15,2) DEFAULT 0,
        sgst                NUMERIC(15,2) DEFAULT 0,
        cgst                NUMERIC(15,2) DEFAULT 0,
        tds                 NUMERIC(15,2) DEFAULT 0,
        total_amount        NUMERIC(15,2) DEFAULT 0,
        invoice_type        VARCHAR(20) DEFAULT 'instant',
        bank_name           VARCHAR(100),
        track_number        VARCHAR(50),
        track_id            INTEGER,
        service_type        VARCHAR(100),
        processing_type     VARCHAR(50),
        is_gst_registered   BOOLEAN DEFAULT false,
        status              VARCHAR(20) DEFAULT 'pending',
        expected_payout_date DATE,
        remarks             TEXT,
        admin_remarks       TEXT,
        mobile_number       VARCHAR(20),
        created_at          TIMESTAMP DEFAULT NOW(),
        updated_at          TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ invoice_requests table ready');
  } catch (err) {
    console.error('❌ invoice_requests table error:', err.message);
  }
};

// Ensure "Connector" table columns exist
const ensureConnectorColumns = async () => {
  try {
    const queries = [
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS isactive BOOLEAN DEFAULT true',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS location TEXT',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS ifsc TEXT',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS accountnumber TEXT',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS branch TEXT',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS reset_token CHARACTER VARYING',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITHOUT TIME ZONE',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS profile_picture CHARACTER VARYING',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS dob DATE',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS pan_number CHARACTER VARYING',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS is_gst_registered BOOLEAN DEFAULT false',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS gst_number CHARACTER VARYING',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS address TEXT',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS profession TEXT',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS bank_name CHARACTER VARYING',
      'ALTER TABLE "Connector" ADD COLUMN IF NOT EXISTS account_holder_name CHARACTER VARYING'
    ];
    for (const q of queries) {
      await db.query(q);
    }
    console.log('✅ "Connector" table columns ready');
  } catch (err) {
    console.error('❌ "Connector" table migration error:', err.message);
  }
};

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  await ensureInvoiceRequestsTable();
  await ensureConnectorColumns();

  // Ensure company_profile table exists
  try {
    const CompanyProfileModel = require('./models/CompanyProfileModel');
    await CompanyProfileModel.ensureTable();
    console.log('✅ company_profile table ready');
  } catch (err) {
    console.error('❌ company_profile table error:', err.message);
  }

  // Ensure password_reset_tokens table exists
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ password_reset_tokens table ready');
  } catch (err) {
    console.error('❌ password_reset_tokens table error:', err.message);
  }
});

// Handle port-in-use errors gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
    console.error(`   Another process is occupying port ${PORT}.`);
    console.error(`   To fix: stop the other process or change PORT in .env\n`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});
