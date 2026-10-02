const User = require('../models/User');
const generateTokens = require('../utils/generateTokens');
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/sendEmail');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: password,
    phone
  });

  if (user) {
    const accessToken = generateTokens(res, user._id);
    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses
        }
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    const accessToken = generateTokens(res, user._id);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses
        }
      }
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (reads httpOnly refresh cookie)
const refreshToken = asyncHandler(async (req, res) => {
  const cookieToken = req.cookies?.refreshToken;

  if (!cookieToken) {
    res.status(401);
    throw new Error('Refresh token missing');
  }

  try {
    const decoded = jwt.verify(
      cookieToken,
      process.env.JWT_REFRESH_SECRET || 'muqaddas_refresh_secret_key_2026_super_secure'
    );

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_ACCESS_SECRET || 'muqaddas_access_secret_key_2026_super_secure',
      { expiresIn: '15m' }
    );

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses
        }
      }
    });
  } catch (err) {
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }
});

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(0)
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Protected
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Request Password Reset 6-Digit OTP (Checks if email exists in DB first)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    res.status(400);
    throw new Error('Please enter your registered email address');
  }

  const cleanEmail = email.trim().toLowerCase();

  // Step 1: Check if user exists in database
  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    res.status(404);
    throw new Error('This email address is not registered in our database.');
  }

  // Step 2: Generate 6-digit OTP code & 2-minute expiration
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpires = expires;
  await user.save();

  // Step 3: Send OTP Email
  try {
    await sendOtpEmail(cleanEmail, otp, user.name);
  } catch (err) {
    console.error('Failed to send OTP email:', err);
  }

  res.status(200).json({
    success: true,
    message: 'A 6-digit OTP code has been sent to your email. It will expire in 2 minutes.'
  });
});

// @desc    Verify OTP and Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error('Email, OTP code, and new password are required');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters long');
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
    res.status(400);
    throw new Error('Invalid OTP code. Please double check the 6 digits in your email.');
  }

  if (!user.resetPasswordOtpExpires || new Date() > new Date(user.resetPasswordOtpExpires)) {
    res.status(400);
    throw new Error('OTP code has expired (2 minute limit). Please click Resend OTP.');
  }

  // Update password and clear OTP fields
  user.passwordHash = newPassword;
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully! You can now sign in with your new password.'
  });
});

// @desc    Verify 6-Digit OTP Code
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and 6-digit OTP code are required');
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
    res.status(400);
    throw new Error('Invalid OTP code. Please double check the 6 digits sent to your email.');
  }

  if (!user.resetPasswordOtpExpires || new Date() > new Date(user.resetPasswordOtpExpires)) {
    res.status(400);
    throw new Error('OTP code has expired (2 minute limit). Please click Resend OTP.');
  }

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully! You can now set your new password.'
  });
});

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  forgotPassword,
  verifyOtp,
  resetPassword
};
