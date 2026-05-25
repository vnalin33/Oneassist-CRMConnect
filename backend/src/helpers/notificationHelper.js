/**
 * Notification Helper — creates notification records in the shared DB
 * AND sends Firebase Cloud Messaging push notifications to the connector's device.
 */
const db = require('../config/database');

// Lazy-load pushService from CRMConnect backend (shared DB means shared fcm_tokens)
let pushService = null;
const getPushService = () => {
  if (!pushService) {
    try {
      // Try to use the push service — will only work if firebase-admin is installed
      // in this backend too, or we send push via direct FCM HTTP API
      pushService = {
        sendToConnector: async (connectorId, title, body, data) => {
          try {
            // Query FCM tokens directly from the shared database
            const { rows } = await db.query(
              'SELECT token FROM fcm_tokens WHERE connector_id = $1',
              [connectorId]
            );

            if (!rows.length) return;

            // Use Firebase Admin if available
            const admin = require('firebase-admin');
            if (!admin.apps.length) {
              const path = require('path');
              const fs = require('fs');
              
              const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
              const serviceAccountPathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
              
              if (serviceAccountEnv) {
                try {
                  const serviceAccount = JSON.parse(serviceAccountEnv);
                  admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                  });
                } catch (err) {
                  console.error('[PUSH] Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', err.message);
                  return;
                }
              } else {
                const defaultPath = path.resolve(__dirname, '../../firebase-service-account.json');
                const serviceAccountPath = serviceAccountPathEnv || defaultPath;
                if (fs.existsSync(serviceAccountPath)) {
                  admin.initializeApp({
                    credential: admin.credential.cert(require(serviceAccountPath)),
                  });
                } else {
                  console.debug('[PUSH] No firebase credentials configured — skipping FCM');
                  return;
                }
              }
            }

            const messaging = admin.messaging();
            const tokens = rows.map(r => r.token);

            // Ensure all data values are strings
            // Move title and body inside the data object for data-only messages
            const stringData = {};
            for (const [key, value] of Object.entries(data || {})) {
              stringData[key] = String(value ?? '');
            }
            stringData.title = String(title || '');
            stringData.body = String(body || '');

            const message = {
              data: stringData,
              android: {
                priority: 'high',
              },
              tokens,
            };

            const response = await messaging.sendEachForMulticast(message);
            console.log(`[PUSH] Sent to ${response.successCount}/${tokens.length} devices for connector ${connectorId}`);

            // Clean up invalid tokens
            if (response.failureCount > 0) {
              response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                  const code = resp.error?.code;
                  if (code === 'messaging/invalid-registration-token' ||
                      code === 'messaging/registration-token-not-registered') {
                    db.query('DELETE FROM fcm_tokens WHERE token = $1', [tokens[idx]]);
                  }
                }
              });
            }
          } catch (err) {
            console.debug('[PUSH] FCM send error (non-fatal):', err.message);
          }
        }
      };
    } catch (err) {
      console.debug('[PUSH] Push service not available:', err.message);
      pushService = { sendToConnector: async () => {} };
    }
  }
  return pushService;
};

const NOTIFICATION_TEMPLATES = {
  // ── Invoice Notifications ──
  INVOICE_APPROVED: (data) => ({
    title: '✅ Invoice Approved',
    body: `Your invoice for ₹${formatAmount(data.amount)} (${data.contact_name || 'Lead'}) has been approved.`,
    type: 'INVOICE',
  }),
  INVOICE_REJECTED: (data) => ({
    title: '❌ Invoice Rejected',
    body: `Your invoice for ₹${formatAmount(data.amount)} was rejected. Reason: ${data.remarks || 'Not specified'}`,
    type: 'INVOICE',
  }),
  INVOICE_PAID: (data) => ({
    title: '💰 Invoice Paid — Wallet Credited',
    body: `₹${formatAmount(data.amount)} has been credited to your wallet for ${data.contact_name || 'Lead'}.`,
    type: 'PAYOUT',
  }),

  // ── Withdrawal Notifications ──
  WITHDRAWAL_APPROVED: (data) => ({
    title: '✅ Withdrawal Approved',
    body: `Your withdrawal request of ₹${formatAmount(data.amount)} has been approved and is being processed.`,
    type: 'PAYOUT',
  }),
  WITHDRAWAL_REJECTED: (data) => ({
    title: '❌ Withdrawal Rejected',
    body: `Your withdrawal of ₹${formatAmount(data.amount)} was rejected. ${data.remarks ? 'Reason: ' + data.remarks : ''}`,
    type: 'PAYOUT',
  }),
  WITHDRAWAL_PAID: (data) => ({
    title: '🏦 Withdrawal Processed',
    body: `₹${formatAmount(data.amount)} has been transferred to your bank account.`,
    type: 'PAYOUT',
  }),

  // ── Lead Notifications ──
  LEAD_STATUS_UPDATE: (data) => ({
    title: '📋 Lead Status Updated',
    body: `${data.contact_name || 'Your lead'} has been moved to "${data.status || 'next stage'}".`,
    type: 'LEAD',
  }),

  // ── System Notifications ──
  WELCOME: (data) => ({
    title: '👋 Welcome to CRMConnect!',
    body: 'Your partner account is active. Complete your profile to start managing leads.',
    type: 'SYSTEM',
  }),
  PROFILE_INCOMPLETE: (data) => ({
    title: '⚠️ Complete Your Profile',
    body: 'Please add your Bank & Tax details to receive payouts.',
    type: 'SYSTEM',
  }),
};

function formatAmount(amt) {
  return parseFloat(amt || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Create a notification for a connector + send FCM push.
 * @param {number} connectorId
 * @param {string} templateKey - e.g. 'INVOICE_APPROVED'
 * @param {object} data - template data (amount, contact_name, remarks, etc.)
 */
async function notify(connectorId, templateKey, data = {}) {
  try {
    if (!connectorId) {
      console.warn('[NOTIFY] No connectorId provided, skipping notification');
      return;
    }

    const template = NOTIFICATION_TEMPLATES[templateKey];
    if (!template) {
      console.warn(`[NOTIFY] Unknown template: ${templateKey}`);
      return;
    }

    const { title, body, type } = template(data);
    const metadata = JSON.stringify({ templateKey, ...data });

    // 1) Save to database (for in-app notification list)
    const result = await db.query(
      `INSERT INTO notifications (connectorid, title, body, type, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [connectorId, title, body, type, metadata]
    );

    console.log(`[NOTIFY] Created notification #${result.rows[0].id} for connector ${connectorId}: ${templateKey}`);

    // 2) Send FCM push notification (async, non-blocking)
    const push = getPushService();
    push.sendToConnector(connectorId, title, body, {
      type,
      templateKey,
      notificationId: String(result.rows[0].id),
    }).catch(err => {
      console.debug('[NOTIFY] FCM push failed (non-fatal):', err.message);
    });

    return result.rows[0];
  } catch (err) {
    // Don't let notification failures break the main flow
    console.error(`[NOTIFY] Failed to create notification:`, err.message);
  }
}

module.exports = { notify, NOTIFICATION_TEMPLATES };
