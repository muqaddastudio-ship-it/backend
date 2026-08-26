const express = require('express');
const { body } = require('express-validator');
const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validateRequest,
  registerUser
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validateRequest,
  loginUser
);

router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);
router.get('/me', verifyToken, getMe);

module.exports = router;
