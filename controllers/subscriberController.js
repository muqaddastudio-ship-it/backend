const Subscriber = require('../models/Subscriber');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Add subscriber
// @route   POST /api/subscribers
// @access  Public
const addSubscriber = asyncHandler(async (req, res) => {
  const { email, interestedCategory } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const existing = await Subscriber.findOne({ email });
  if (existing) {
    res.status(200).json({
      success: true,
      message: 'You are already subscribed! We will notify you as soon as this collection launches.'
    });
    return;
  }

  await Subscriber.create({
    email,
    interestedCategory: interestedCategory || 'general'
  });

  res.status(201).json({
    success: true,
    message: 'Thank you for subscribing! You will receive exclusive early access when this collection drops.'
  });
});

module.exports = { addSubscriber };
