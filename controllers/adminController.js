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

  // Real status breakdown from DB
  const pendingCount = await Order.countDocuments({ status: 'pending' });
  const confirmedCount = await Order.countDocuments({ status: 'confirmed' });
  const shippedCount = await Order.countDocuments({ status: 'shipped' });
  const deliveredCount = await Order.countDocuments({ status: 'delivered' });
  const cancelledCount = await Order.countDocuments({ status: 'cancelled' });

  const statusCounts = [
    { name: 'Delivered', value: deliveredCount, color: '#10b981' },
    { name: 'Shipped',   value: shippedCount,   color: '#8b5cf6' },
    { name: 'Confirmed', value: confirmedCount, color: '#3b82f6' },
    { name: 'Pending',   value: pendingCount,   color: '#f59e0b' },
    { name: 'Cancelled', value: cancelledCount, color: '#ef4444' },
  ];

  // 7-day revenue trend calculated from actual DB orders
  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIndex = new Date().getDay();
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push({
      dateStr: d.toISOString().split('T')[0],
      dayName: daysMap[d.getDay()],
      revenue: 0,
      orders: 0
    });
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  const dbOrders7Days = await Order.find({
    createdAt: { $gte: startDate }
  });

  dbOrders7Days.forEach(ord => {
    const ordDateStr = new Date(ord.createdAt).toISOString().split('T')[0];
    const match = last7Days.find(item => item.dateStr === ordDateStr);
    if (match) {
      match.orders += 1;
      if (['confirmed', 'shipped', 'delivered'].includes(ord.status)) {
        match.revenue += (ord.total || 0);
      }
    }
  });

  const revenueTrend = last7Days.map(item => ({
    day: item.dayName,
    revenue: item.revenue,
    orders: item.orders
  }));

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
      statusCounts,
      revenueTrend,
      lowStockProducts,
      recentOrders
    }
  });
});

// @desc    Clear all orders from database (Admin)
// @route   DELETE /api/admin/orders/clear-all
// @access  Private/Admin
const clearAllOrders = asyncHandler(async (req, res) => {
  await Order.deleteMany({});
  res.status(200).json({
    success: true,
    message: 'All orders deleted successfully'
  });
});

module.exports = { getAdminStats, clearAllOrders };
