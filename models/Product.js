const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  color: { type: String, default: 'Default' },
  colorHex: { type: String, default: '#000000' },
  stock: { type: Number, required: true, default: 0, min: 0 }
});

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String },
  comment: { type: String, required: true },
  isVerifiedBuyer: { type: Boolean, default: true },
  location: { type: String, default: 'Pakistan' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  category: { 
    type: String, 
    enum: ['clothes', 'clothing', 'perfume', 'accessories', 'shoes', 'bags'], 
    required: true 
  },
  subCategory: { type: String, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: null, min: 0 },
  images: [{ type: String, required: true }],
  variants: [variantSchema],
  reviews: [reviewSchema],
  status: { 
    type: String, 
    enum: ['active', 'coming-soon', 'archived'], 
    default: 'active' 
  },
  featured: { type: Boolean, default: false },
  ratingAvg: { type: Number, default: 4.8 },
  reviewCount: { type: Number, default: 24 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
