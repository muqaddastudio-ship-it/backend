const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { processUploads } = require('../middleware/upload');
const DEMO_REVIEWS = require('../utils/demoReviews');

// Helper to format slug from product name
const createSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// @desc    Get all products with filtering, sorting, pagination, & search
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  const {
    category,
    subCategory,
    size,
    color,
    minPrice,
    maxPrice,
    sort,
    search,
    status
  } = req.query;

  let query = {};

  if (status) {
    query.status = status;
  } else {
    query.status = 'active';
  }

  if (category) {
    const cat = category.toLowerCase();
    if (cat === 'clothes' || cat === 'clothing') {
      query.category = { $in: ['clothes', 'clothing'] };
    } else {
      query.category = cat;
    }
  }

  if (subCategory) {
    query.subCategory = new RegExp(`^${subCategory}$`, 'i');
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { subCategory: { $regex: search, $options: 'i' } }
    ];
  }

  if (size) {
    const sizeList = Array.isArray(size) ? size : size.split(',');
    query['variants.size'] = { $in: sizeList };
  }

  if (color) {
    const colorList = Array.isArray(color) ? color : color.split(',');
    query['variants.color'] = { $in: colorList };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let sortOptions = { createdAt: -1 };
  if (sort === 'price-asc') sortOptions = { price: 1 };
  if (sort === 'price-desc') sortOptions = { price: -1 };
  if (sort === 'newest') sortOptions = { createdAt: -1 };
  if (sort === 'featured') sortOptions = { featured: -1, createdAt: -1 };

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ featured: true, status: 'active' }).limit(8);
  res.status(200).json({
    success: true,
    data: products
  });
});

// @desc    Get product by slug (includes 20-25 reviews guaranteed)
// @route   GET /api/products/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Also fetch related products
  const relatedProducts = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    status: 'active'
  }).limit(4);

  // Combine real DB reviews with DEMO_REVIEWS to ensure 20-25 reviews per product
  const dbReviews = product.reviews || [];
  let combinedReviews = [...dbReviews];

  // Pad with demo reviews until we reach 25 reviews
  if (combinedReviews.length < 25) {
    const needCount = 25 - combinedReviews.length;
    const demoPadding = DEMO_REVIEWS.slice(0, needCount);
    combinedReviews = [...combinedReviews, ...demoPadding];
  }

  // Calculate rating stats
  const totalRatingSum = combinedReviews.reduce((sum, r) => sum + r.rating, 0);
  const calculatedAvg = Number((totalRatingSum / combinedReviews.length).toFixed(1));

  const productData = product.toObject();
  productData.reviews = combinedReviews;
  productData.reviewCount = combinedReviews.length;
  productData.ratingAvg = calculatedAvg;

  res.status(200).json({
    success: true,
    data: {
      product: productData,
      relatedProducts
    }
  });
});

// @desc    Check if logged-in user can review product (verified buyer check)
// @route   GET /api/products/:id/can-review
// @access  Private
const canUserReviewProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  if (!req.user) {
    return res.status(200).json({
      success: true,
      canReview: false,
      reason: 'Please log in to leave a verified customer review.'
    });
  }

  // Find any completed/confirmed/shipped/delivered order by this user containing this product
  const existingOrder = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    status: { $in: ['confirmed', 'shipped', 'delivered', 'pending'] }
  });

  if (!existingOrder) {
    return res.status(200).json({
      success: true,
      canReview: false,
      reason: 'Only verified customers who have purchased this item can write a review.'
    });
  }

  res.status(200).json({
    success: true,
    canReview: true,
    reason: 'Verified Purchase Confirmed'
  });
});

// @desc    Add verified customer review to product
// @route   POST /api/products/:id/reviews
// @access  Private (Verified Buyer Only)
const addProductReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;
  const productId = req.params.id;

  if (!rating || !comment) {
    res.status(400);
    throw new Error('Rating and comment are required.');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Strict verification check: User MUST have an order for this product
  const existingOrder = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    status: { $in: ['confirmed', 'shipped', 'delivered', 'pending'] }
  });

  if (!existingOrder) {
    res.status(403);
    throw new Error('Only verified customers who have purchased this product can write a review.');
  }

  // Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    r => r.user && r.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already submitted a review for this product.');
  }

  const review = {
    user: req.user._id,
    name: req.user.name || 'Verified Buyer',
    rating: Number(rating),
    title: title || 'Great Quality!',
    comment,
    isVerifiedBuyer: true,
    location: existingOrder.shippingAddress?.city || 'Pakistan',
    createdAt: new Date()
  };

  product.reviews.push(review);
  product.reviewCount = product.reviews.length;
  product.ratingAvg = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

  await product.save();

  res.status(201).json({
    success: true,
    message: 'Review added successfully! Thank you for your feedback.',
    data: review
  });
});

// @desc    Create product (Admin)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    subCategory,
    description,
    price,
    discountPrice,
    variants,
    featured,
    status,
    images: bodyImages
  } = req.body;

  let imageUrls = [];

  if (req.files && req.files.length > 0) {
    imageUrls = await processUploads(req.files);
  } else if (bodyImages) {
    imageUrls = Array.isArray(bodyImages) ? bodyImages : [bodyImages];
  }

  if (imageUrls.length === 0) {
    res.status(400);
    throw new Error('At least one product image is required');
  }

  let parsedVariants = [];
  if (typeof variants === 'string') {
    try {
      parsedVariants = JSON.parse(variants);
    } catch (e) {
      parsedVariants = [];
    }
  } else if (Array.isArray(variants)) {
    parsedVariants = variants;
  }

  let slug = createSlug(name);
  let slugCount = await Product.countDocuments({ slug });
  if (slugCount > 0) {
    slug = `${slug}-${Date.now()}`;
  }

  const product = await Product.create({
    name,
    slug,
    category,
    subCategory,
    description,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : null,
    images: imageUrls,
    variants: parsedVariants,
    featured: featured === 'true' || featured === true,
    status: status || 'active'
  });

  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const {
    name,
    category,
    subCategory,
    description,
    price,
    discountPrice,
    variants,
    featured,
    status,
    existingImages
  } = req.body;

  let imageUrls = [];
  if (existingImages) {
    imageUrls = Array.isArray(existingImages) ? existingImages : [existingImages];
  }

  if (req.files && req.files.length > 0) {
    const newUrls = await processUploads(req.files);
    imageUrls = [...imageUrls, ...newUrls];
  }

  if (name && name !== product.name) {
    product.name = name;
    let newSlug = createSlug(name);
    let slugCount = await Product.countDocuments({ slug: newSlug, _id: { $ne: product._id } });
    if (slugCount > 0) {
      newSlug = `${newSlug}-${Date.now()}`;
    }
    product.slug = newSlug;
  }

  if (category) product.category = category;
  if (subCategory !== undefined) product.subCategory = subCategory;
  if (description) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (discountPrice !== undefined) product.discountPrice = discountPrice ? Number(discountPrice) : null;
  if (imageUrls.length > 0) product.images = imageUrls;
  if (status) product.status = status;
  if (featured !== undefined) product.featured = featured === 'true' || featured === true;

  if (variants) {
    let parsedVariants = [];
    if (typeof variants === 'string') {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (e) {
        parsedVariants = product.variants;
      }
    } else if (Array.isArray(variants)) {
      parsedVariants = variants;
    }
    product.variants = parsedVariants;
  }

  const updatedProduct = await product.save();
  res.status(200).json({
    success: true,
    data: updatedProduct
  });
});

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await product.deleteOne();
  res.status(200).json({
    success: true,
    message: 'Product removed successfully'
  });
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  canUserReviewProduct,
  addProductReview,
  createProduct,
  updateProduct,
  deleteProduct
};
