const crypto                = require('crypto');
const User                  = require('../models/User');
const Patient               = require('../models/Patient');
const asyncHandler          = require('../utils/asyncHandler');
const { sendTokenResponse } = require('../utils/jwt');
const sendEmail             = require('../utils/sendEmail');

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, phone, dob, gender, bloodGroup } = req.body;

  // Check duplicate email
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email is already registered.' });
  }

  // Create user
  const user = await User.create({
    name: name.trim(),
    email,
    password,
    phone:      phone      || '',
    dob:        dob        || '',
    gender:     gender     || '',
    bloodGroup: bloodGroup || '',
  });

  // Auto-create the Patient profile so dashboard works immediately after signup
  await Patient.create({ user: user._id, bloodGroup: bloodGroup || '' });

  sendTokenResponse(user, 201, res);
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
  }

  sendTokenResponse(user, 200, res);
});

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Always respond with success to prevent user enumeration
  const genericMsg = `If an account with ${email} exists, a reset link has been sent.`;

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(200).json({ success: true, message: genericMsg });
  }

  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  try {
    await sendEmail({
      to:      user.email,
      subject: 'HMS — Password Reset Link (expires in 15 min)',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px;">
          <h2 style="color:#1565C0;">Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your HMS account password. Click the button below — this link expires in <strong>15 minutes</strong>.</p>
          <p style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}"
               style="display:inline-block;padding:14px 28px;background:#1565C0;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
              Reset Password
            </a>
          </p>
          <p style="color:#777;font-size:13px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
          <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;">
          <p style="color:#aaa;font-size:12px;">HMS Medical Centre — Automated Security Email</p>
        </div>
      `,
    });
  } catch (emailErr) {
    // Roll back token so the user can try again
    user.passwordResetToken  = undefined;
    user.passwordResetExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('[forgotPassword] Email failed:', emailErr.message);
    // Still return success (SMTP may not be configured on Render yet)
  }

  res.status(200).json({ success: true, message: genericMsg });
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required.' });
  }

  const hashed = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken:  hashed,
    passwordResetExpiry: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpiry');

  if (!user) {
    return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
  }

  user.password            = newPassword;
  user.passwordResetToken  = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Password has been reset successfully. Please log in.' });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  // req.user is already populated by protect middleware (no password)
  res.status(200).json({ success: true, user: req.user });
});

// ── PUT /api/auth/profile ────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'dob', 'gender', 'bloodGroup', 'avatar'];
  const updates = {};
  allowedFields.forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // Also sync bloodGroup to Patient profile if provided
  if (updates.bloodGroup !== undefined) {
    await Patient.findOneAndUpdate(
      { user: req.user._id },
      { bloodGroup: updates.bloodGroup },
      { new: true }
    );
  }

  res.status(200).json({ success: true, user });
});

// ── PUT /api/auth/change-password ────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully.' });
});

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};
