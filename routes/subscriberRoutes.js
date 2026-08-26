const express = require('express');
const { body } = require('express-validator');
const { addSubscriber } = require('../controllers/subscriberController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/',
  [body('email').isEmail().withMessage('Please provide a valid email')],
  validateRequest,
  addSubscriber
);

module.exports = router;
