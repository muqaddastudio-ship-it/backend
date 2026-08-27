const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  size: { type: String, required: true },
  color: { type: String, default: 'Default' },
  qty: { type: Number, required: true, min: 1 }
});

const shippingAddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, default: '' },
  phone: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestEmail: { type: String, lowercase: true, trim: true },
  items: [orderItemSchema],
  shippingAddress: { type: shippingAddressSchema, required: true },
  paymentMethod: { type: String, enum: ['COD'], default: 'COD' },
  trackingId: { type: String, unique: true, sparse: true, index: true },
  courier: { type: String, default: 'TCS Express' },
  estimatedDelivery: { type: String, default: '3-4 Business Days' },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
