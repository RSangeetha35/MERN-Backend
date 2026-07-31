const jwt = require('jsonwebtoken');

// ── signToken ─────────────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── sendTokenResponse ─────────────────────────────────────────────────────────
// Normalises the user shape returned to the frontend on auth success.
// The frontend stores this object in localStorage as STORAGE_KEYS.USER.
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:         user._id,
      name:       user.name,
      email:      user.email,
      phone:      user.phone      || '',
      dob:        user.dob        || '',
      gender:     user.gender     || '',
      bloodGroup: user.bloodGroup || '',
      avatar:     user.avatar     || null,
      role:       user.role,
      patientId:  user.patientId  || null,
    },
  });
};

module.exports = { signToken, sendTokenResponse };
