const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  color: { type: String, default: 'Default' },
  colorHex: { type: String, default: '#000000' },
  stock: { type: Number, required: true, default: 0, min: 0 }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  category: { 
    type: String, 
    enum: ['clothes', 'perfume', 'accessories', 'shoes', 'bags'], 
    required: true 
  },
  subCategory: { type: String, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: null, min: 0 },
  images: [{ type: String, required: true }],
  variants: [variantSchema],
  status: { 
    type: String, 
    enum: ['active', 'coming-soon', 'archived'], 
    default: 'active' 
  },
  featured: { type: Boolean, default: false },
  ratingAvg: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
