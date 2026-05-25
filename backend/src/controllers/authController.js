/**
 * Auth Controller - Handles authentication logic
 * Login, Register, Token validation, Password reset
 * Registration stores data in the 'connector' table
 * JWT token expires in 30 minutes for auto sign-out
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');
const UserModel = require('../models/UserModel');
const { sendPasswordResetEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const JWT_EXPIRES_IN = '30m'; // 30 minutes auto sign-out
const SALT_ROUNDS = 12;

/**
 * Generate JWT token with 30 minute expiry
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email || user.emailid, role: user.role || 'connector', name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Strip sensitive fields from user object
 */
function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * Dynamically check if a connector user is actually an administrator
 */
function getConnectorRole(connector) {
  return 'admin';
}

const AuthController = {
  /**
   * POST /api/auth/login
   * Authenticates against both 'connector' and 'users' tables
   */
  async login(req, res, next) {
    try {
      let { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      email = (email || '').trim();
      if (email.includes('@')) {
        email = email.toLowerCase();
      }

      // 1. Try capital "Connector" table first (user's preferred table)
      const connectorResult = await db.query(
        'SELECT * FROM "Connector" WHERE email = $1 OR phone = $1 LIMIT 1',
        [email]
      );

      if (connectorResult.rows.length > 0) {
        const connector = connectorResult.rows[0];
        const isValid = await bcrypt.compare(password, connector.password);
        if (isValid) {
          const userRole = getConnectorRole(connector);
          const token = generateToken({
            id: connector.id,
            email: connector.email,
            role: userRole,
            name: connector.employeename,
          });
          return res.json({
            success: true,
            message: 'Login successful',
            user: {
              id: connector.id,
              name: connector.employeename,
              email: connector.email,
              role: userRole,
            },
            token,
          });
        }
      }

      // 2. Try users table (admin/system users)
      const user = await UserModel.findByEmail(email);
      if (user) {
        const isValid = await UserModel.verifyPassword(password, user.password);
        if (isValid) {
          const token = generateToken(user);
          return res.json({
            success: true,
            message: 'Login successful',
            user: sanitizeUser(user),
            token,
          });
        }
      }

      // 3. Try employeedetails table
      const empResult = await db.query(
        'SELECT * FROM employeedetails WHERE emailid = $1 LIMIT 1',
        [email]
      );

      if (empResult.rows.length > 0) {
        const emp = empResult.rows[0];
        const isValid = await bcrypt.compare(password, emp.password);
        if (isValid) {
          const token = generateToken({
            id: emp.id,
            email: emp.emailid,
            role: 'employee',
            name: emp.name,
          });
          return res.json({
            success: true,
            message: 'Login successful',
            user: {
              id: emp.id,
              name: emp.name,
              email: emp.emailid,
              role: 'employee',
            },
            token,
          });
        }
      }

      // No match found
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/register
   * Creates a new connector in the 'connector' table
   */
  async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;

      // Validation
      if (!name || !email || !password || !phone) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: name, email, password, phone',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
      }

      // Check if email already exists in either table
      const existingCapital = await db.query(
        'SELECT id FROM "Connector" WHERE email = $1 LIMIT 1',
        [email]
      );

      if (existingCapital.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      // Check if phone already exists in the active "Connector" table
      const existingPhoneCapital = await db.query(
        'SELECT id FROM "Connector" WHERE phone = $1 LIMIT 1',
        [phone]
      );

      if (existingPhoneCapital.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'An account with this phone number already exists',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // 1. Insert into capital "Connector" table (user's preferred table)
      const result = await db.query(
        `INSERT INTO "Connector" (username, employeename, email, password, proj, phone, "createdDate", "updatedDate")
         VALUES ($1, $2, $3, $4, 'CRM', $5, NOW(), NOW()) RETURNING id`,
        [email, name, email, hashedPassword, phone]
      );

      const newConnector = {
        id: result.rows[0].id,
        name,
        email,
        phone, // phone isn't saved in Connector, but kept in state
        role: 'admin',
      };

      const token = generateToken({
        id: newConnector.id,
        email,
        role: 'admin',
        name,
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: newConnector,
        token,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/validate
   */
  async validate(req, res, next) {
    try {
      // req.user is set by authMiddleware
      const user = await UserModel.findById(req.user.id);
      if (user) {
        return res.json({ success: true, user: sanitizeUser(user) });
      }

      // Try capital "Connector" table
      const capResult = await db.query(
        'SELECT id, employeename as name, email FROM "Connector" WHERE id = $1 LIMIT 1',
        [req.user.id]
      );

      if (capResult.rows.length > 0) {
        const conn = capResult.rows[0];
        return res.json({
          success: true,
          user: { ...conn, role: getConnectorRole(conn) },
        });
      }

      return res.status(401).json({ success: false, message: 'User not found' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/forgot-password
   * Looks up user, generates a reset token, sends email
   */
  async forgotPassword(req, res, next) {
    try {
      const email = (req.body.email || '').trim().toLowerCase();

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      // Always return success to prevent email enumeration
      const successMsg = 'If an account exists with this email, a password reset link has been sent.';

      // Look up user across all tables
      let userName = 'User';

      // Check capital Connector
      const capRes = await db.query('SELECT id, employeename as name, email FROM "Connector" WHERE email = $1 LIMIT 1', [email]);
      if (capRes.rows.length > 0) {
        userName = capRes.rows[0].name || 'User';
      } else {
        // Check users table
        const userRes = await db.query('SELECT id, name, email FROM users WHERE email = $1 LIMIT 1', [email]);
        if (userRes.rows.length > 0) {
          userName = userRes.rows[0].name || 'User';
        } else {
          // No user found — still return success to prevent enumeration
          return res.json({ success: true, message: successMsg });
        }
      }

      // Generate a random reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Invalidate any existing tokens for this email
      await db.query('UPDATE password_reset_tokens SET used = true WHERE email = $1 AND used = false', [email]);

      // Store token
      await db.query(
        'INSERT INTO password_reset_tokens (email, token_hash, expires_at) VALUES ($1, $2, $3)',
        [email, tokenHash, expiresAt]
      );

      // Send the email
      try {
        await sendPasswordResetEmail(email, resetToken, userName);
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to send reset email. Please try again later.',
        });
      }

      res.json({ success: true, message: successMsg });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/reset-password
   * Validates token and resets the password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
      }

      // Hash the provided token to compare with stored hash
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find the token in DB
      const tokenRes = await db.query(
        'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used = false AND expires_at > NOW() LIMIT 1',
        [tokenHash]
      );

      if (tokenRes.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token. Please request a new password reset.',
        });
      }

      const tokenRecord = tokenRes.rows[0];
      const email = tokenRecord.email;

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Update password in all tables where this email exists
      let updated = false;

      const capUpdate = await db.query(
        'UPDATE "Connector" SET password = $1, "updatedDate" = NOW() WHERE email = $2',
        [hashedPassword, email]
      );
      if (capUpdate.rowCount > 0) updated = true;

      const userUpdate = await db.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, email]
      );
      if (userUpdate.rowCount > 0) updated = true;

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'No account found with this email.',
        });
      }

      // Mark token as used
      await db.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [tokenRecord.id]);

      res.json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res) {
    res.json({ success: true, message: 'Logged out successfully' });
  },
};

module.exports = AuthController;
