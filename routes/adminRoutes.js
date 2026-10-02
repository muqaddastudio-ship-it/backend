const express = require('express');
const { getAdminStats, clearAllOrders } = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, isAdmin);

router.get('/stats', getAdminStats);
router.delete('/orders/clear-all', clearAllOrders);

module.exports = router;
