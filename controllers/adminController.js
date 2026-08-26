const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalCustomers = await User.countDocuments({ role: 'customer' });

  // Calculate total revenue from confirmed, shipped, or delivered orders
  const revenueResult = await Order.aggregate([
    { $match: { status: { $in: ['confirmed', 'shipped', 'delivered'] } } },
    { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  // Find products with any variant stock < 5
  const lowStockProducts = await Product.find({
    'variants.stock': { $lt: 5 }
  }).select('name slug category variants status images');

  // Recent 5 orders
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email');

  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      totalProducts,
      totalCustomers,
      totalRevenue,
      lowStockProducts,
      recentOrders
    }
  });
});

module.exports = { getAdminStats };
