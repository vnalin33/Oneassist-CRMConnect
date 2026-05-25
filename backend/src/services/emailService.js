/**
 * Email Service - Sends emails via Gmail SMTP using Nodemailer
 */
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Send a password reset email with a styled HTML template
 */
async function sendPasswordResetEmail(toEmail, resetToken, userName) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"OneAssist CRMConnect" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: 'Reset Your Password — OneAssist CRMConnect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f5f6fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(108,92,231,0.08);">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#6C5CE7 0%,#4895ef 100%);padding:32px 24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;letter-spacing:1px;">OneAssist CRMConnect</h1>
            <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Password Reset</p>
          </div>
          <!-- Body -->
          <div style="padding:32px 24px;">
            <p style="color:#1a1a2e;font-size:15px;margin:0 0 8px;">Hi ${userName || 'there'},</p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
              We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#6C5CE7,#4895ef);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:0.3px;">
                Reset Password
              </a>
            </div>
            <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:24px 0 0;text-align:center;">
              If you didn't request this, you can safely ignore this email.<br>
              Your password will remain unchanged.
            </p>
          </div>
          <!-- Footer -->
          <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #f0f0f5;">
            <p style="color:#b0b0be;font-size:11px;margin:0;">© ${new Date().getFullYear()} OneAssist Technologies. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };
