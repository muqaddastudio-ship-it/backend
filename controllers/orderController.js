const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create new order with atomic stock decrement
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

  // Step 4: Create Order record
  const order = await Order.create({
    user: orderUser,
    guestEmail: orderUser ? undefined : guestEmail,
    items,
    shippingAddress,
    paymentMethod: paymentMethod || 'COD',
    status: 'pending',
    subtotal,
    shippingFee,
    total
  });

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

// @desc    Get order by ID (Owner or Admin)
// @route   GET /api/orders/:id
// @access  Private/Public (by ID or owner)
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

// @desc    Update order status (Admin)
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status provided');
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
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
  const updatedOrder = await order.save();

  res.status(200).json({
    success: true,
    data: updatedOrder
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};
