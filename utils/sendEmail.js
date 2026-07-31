const nodemailer = require('nodemailer');

/**
 * sendEmail({ to, subject, html })
 * Sends an HTML email via the SMTP credentials in .env.
 * Silently skips sending when SMTP credentials are not configured so the rest
 * of the app continues to work without a real mail server.
 */
const sendEmail = async ({ to, subject, html }) => {
  // If SMTP is not configured, log and return without throwing
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[sendEmail] SMTP not configured — skipping email to:', to);
    return;
  }

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // allow self-signed certs in dev
    },
  });

  const info = await transporter.sendMail({
    from:    `"HMS Medical Centre" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  console.log('[sendEmail] Message sent:', info.messageId);
  return info;
};

module.exports = sendEmail;
