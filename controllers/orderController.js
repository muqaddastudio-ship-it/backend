const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { sendCustomerOrderEmail, sendAdminOrderEmail } = require('../utils/sendEmail');

// Helper to generate unique Tracking ID
const generateTrackingId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MS-PK-${code}`;
};

// @desc    Create new order with atomic stock decrement & tracking ID & email alerts
// @route   POST /api/orders
// @access  Public (supports Guest & Logged-in)
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, guestEmail, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  if (!shippingAddress || !shippingAddress.name || !shippingAddress.street || !shippingAddress.city || !shippingAddress.phone) {
    res.status(400);
    throw new Error('Complete shipping address (name, street, city, phone) is required');
  }

  // If user is guest, guestEmail is required
  let orderUser = req.user ? req.user._id : null;
  if (!orderUser && !guestEmail) {
    res.status(400);
    throw new Error('Email is required for guest checkout');
  }

  // Step 1: Pre-check stock for all items
  const decrementedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      // Rollback any previously decremented items
      for (const dec of decrementedItems) {
        await Product.updateOne(
          { _id: dec.productId, 'variants.size': dec.size },
          { $inc: { 'variants.$.stock': dec.qty } }
        );
      }
      res.status(404);
      throw new Error(`Product ${item.name} not found`);
    }

    const variant = product.variants.find(v => v.size === item.size);
    if (!variant || variant.stock < item.qty) {
      // Rollback
      for (const dec of decrementedItems) {
        await Product.updateOne(
          { _id: dec.productId, 'variants.size': dec.size },
          { $inc: { 'variants.$.stock': dec.qty } }
        );
      }
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name} (Size: ${item.size}). Only ${variant ? variant.stock : 0} left.`);
    }

    // Step 2: Perform atomic decrement
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: item.product,
        'variants.size': item.size,
        'variants.stock': { $gte: item.qty }
      },
      {
        $inc: { 'variants.$.stock': -item.qty }
      },
      { new: true }
    );

    if (!updatedProduct) {
      // Race condition occurred, rollback
      for (const dec of decrementedItems) {
        await Product.updateOne(
          { _id: dec.productId, 'variants.size': dec.size },
          { $inc: { 'variants.$.stock': dec.qty } }
        );
      }
      res.status(400);
      throw new Error(`Item ${item.name} (Size: ${item.size}) was just bought by another customer.`);
    }

    decrementedItems.push({ productId: item.product, size: item.size, qty: item.qty });
  }

  // Step 3: Calculate totals
  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shippingFee = subtotal > 5000 ? 0 : 250; // Free shipping over PKR 5,000, else 250 PKR
  const total = subtotal + shippingFee;

  // Step 4: Create Tracking ID
  let trackingId = generateTrackingId();
  let attempts = 0;
  while (await Order.findOne({ trackingId }) && attempts < 5) {
    trackingId = generateTrackingId();
    attempts++;
  }

  // Step 5: Create Order record
  const order = await Order.create({
    user: orderUser,
    guestEmail: orderUser ? undefined : guestEmail,
    items,
    shippingAddress,
    paymentMethod: paymentMethod || 'COD',
    trackingId,
    courier: 'TCS Express',
    estimatedDelivery: '3-4 Business Days',
    status: 'pending',
    subtotal,
    shippingFee,
    total
  });

  // Step 6: Trigger Email Notifications (Customer + Admin)
  const targetCustomerEmail = (req.user && req.user.email) || guestEmail || req.body.email || (shippingAddress && shippingAddress.email);
  
  (async () => {
    try {
      if (targetCustomerEmail) {
        await sendCustomerOrderEmail(order, targetCustomerEmail);
        await new Promise(r => setTimeout(r, 600)); // Rate limit buffer
      }
      await sendAdminOrderEmail(order);
    } catch (err) {
      console.error(`[Order Email Error] ${err.message}`);
    }
  })();

  res.status(201).json({
    success: true,
    data: order
  });
});

// @desc    Get user's logged-in orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: orders
  });
});

// @desc    Track order by Tracking ID or Order ID (Public)
// @route   GET /api/orders/track/:trackingId
// @access  Public
const trackOrder = asyncHandler(async (req, res) => {
  const { trackingId } = req.params;
  const cleanId = trackingId.trim().toUpperCase();

  // Search by trackingId or _id
  let order;
  if (cleanId.startsWith('MS-PK-')) {
    order = await Order.findOne({ trackingId: cleanId }).populate('items.product', 'name slug images');
  } else {
    // Try both trackingId or MongoDB ObjectId
    order = await Order.findOne({
      $or: [
        { trackingId: cleanId },
        { _id: cleanId.match(/^[0-9a-fA-F]{24}$/) ? cleanId : null }
      ]
    }).populate('items.product', 'name slug images');
  }

  if (!order) {
    res.status(404);
    throw new Error(`No order found matching tracking number "${trackingId}". Please check your receipt.`);
  }

  // Construct status timeline
  const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(order.status);

  const timeline = [
    {
      step: 'Order Placed',
      desc: 'Order received & queued for handcrafting',
      completed: currentIndex >= 0,
      current: order.status === 'pending',
      date: order.createdAt
    },
    {
      step: 'Quality Confirmed',
      desc: 'Embroidery & fabric quality inspected',
      completed: currentIndex >= 1,
      current: order.status === 'confirmed',
    },
    {
      step: 'Handed to Courier',
      desc: `Dispatched via ${order.courier || 'TCS Express'}`,
      completed: currentIndex >= 2,
      current: order.status === 'shipped',
    },
    {
      step: 'Delivered',
      desc: 'Successfully delivered & COD collected',
      completed: currentIndex >= 3,
      current: order.status === 'delivered',
    }
  ];

  res.status(200).json({
    success: true,
    data: {
      order,
      timeline
    }
  });
});

// @desc    Get order by ID (Owner or Admin)
// @route   GET /api/orders/:id
// @access  Private/Public
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // If user is logged in, check if owner or admin
  if (req.user) {
    if (order.user && order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const orders = await Order.find(filter)
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: orders
  });
});

// @desc    Update order status, courier, tracking ID (Admin)
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, courier, trackingId, estimatedDelivery } = req.body;
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (status) {
    if (!validStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid status provided');
    }

    // If cancelled, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product, 'variants.size': item.size },
          { $inc: { 'variants.$.stock': item.qty } }
        );
      }
    }
    order.status = status;
  }

  if (courier) order.courier = courier;
  if (trackingId) order.trackingId = trackingId;
  if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;

  const updatedOrder = await order.save();

  res.status(200).json({
    success: true,
    data: updatedOrder
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  trackOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};
