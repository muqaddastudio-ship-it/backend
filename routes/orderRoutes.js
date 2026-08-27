const express = require('express');
const {
  createOrder,
  getMyOrders,
  trackOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { verifyToken, optionalAuth, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', optionalAuth, createOrder);
router.get('/my', verifyToken, getMyOrders);
router.get('/track/:trackingId', trackOrder);
router.get('/:id', optionalAuth, getOrderById);

// Admin Routes
router.get('/', verifyToken, isAdmin, getAllOrders);
router.patch('/:id/status', verifyToken, isAdmin, updateOrderStatus);

module.exports = router;
