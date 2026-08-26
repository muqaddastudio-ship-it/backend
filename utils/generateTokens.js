const jwt = require('jsonwebtoken');

const generateTokens = (res, userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET || 'muqaddas_access_secret_key_2026_super_secure',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'muqaddas_refresh_secret_key_2026_super_secure',
    { expiresIn: '7d' }
  );

  // Set httpOnly cookie for refresh token
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return accessToken;
};

module.exports = generateTokens;
