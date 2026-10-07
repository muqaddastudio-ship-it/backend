const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { processUploads } = require('../middleware/upload');

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
  let products = await Product.find({ featured: true, status: 'active' }).sort({ createdAt: -1 }).limit(8);

  // If no products are explicitly marked featured, fetch latest active products
  if (!products || products.length === 0) {
    products = await Product.find({ status: 'active' }).sort({ createdAt: -1 }).limit(8);
  }

  res.status(200).json({
    success: true,
    data: products
  });
});

// @desc    Get product by slug or MongoDB ID
// @route   GET /api/products/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.slug);
  const query = isObjectId
    ? { $or: [{ slug: req.params.slug }, { _id: req.params.slug }] }
    : { slug: req.params.slug };

  const product = await Product.findOne(query);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Fetch related products
  const relatedProducts = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    status: 'active'
  }).limit(4);

  // Only real verified reviews from the database
  const realReviews = product.reviews || [];

  // Calculate rating stats from real reviews only
  const calculatedAvg = realReviews.length > 0
    ? Number((realReviews.reduce((sum, r) => sum + r.rating, 0) / realReviews.length).toFixed(1))
    : 0;

  const productData = product.toObject();
  productData.reviews = realReviews;
  productData.reviewCount = realReviews.length;
  productData.ratingAvg = calculatedAvg;

  res.status(200).json({
    success: true,
    data: {
      product: productData,
      relatedProducts
    }
  });
});

// @desc    Get product by MongoDB ID (for admin edit form)
// @route   GET /api/products/id/:id
// @access  Private/Admin
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.status(200).json({
    success: true,
    data: { product }
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
  const sizeChartFile = req.files ? req.files.find(f => f.fieldname === 'sizeChartImage') : null;
  const imageFiles = req.files ? req.files.filter(f => f.fieldname === 'images' || f.fieldname === 'image') : [];

  if (imageFiles.length > 0) {
    imageUrls = await processUploads(imageFiles);
  } else if (req.files && req.files.length > 0) {
    const galleryFiles = req.files.filter(f => f.fieldname !== 'sizeChartImage');
    imageUrls = await processUploads(galleryFiles);
  } else if (bodyImages) {
    imageUrls = Array.isArray(bodyImages) ? bodyImages : [bodyImages];
  }

  let sizeChartUrl = req.body.sizeChart || '';
  if (sizeChartFile) {
    const uploadedChart = await processUploads([sizeChartFile]);
    if (uploadedChart.length > 0) {
      sizeChartUrl = uploadedChart[0];
    }
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

  const cleanVariants = parsedVariants.map(v => {
    let variantImg = v.image || '';
    if (variantImg.startsWith('NEW_INDEX_')) {
      const idx = parseInt(variantImg.replace('NEW_INDEX_', ''), 10);
      variantImg = imageUrls[idx] || imageUrls[0] || '';
    }
    return {
      size: v.size || 'M',
      color: v.color || 'Default',
      colorHex: v.colorHex || '#000000',
      image: variantImg,
      stock: isNaN(Number(v.stock)) ? 0 : Math.max(0, Number(v.stock))
    };
  });

  const normCategory = (category || 'clothes').toLowerCase().trim();
  const validCategories = ['clothes', 'clothing', 'perfume', 'accessories', 'shoes', 'bags'];
  const finalCategory = validCategories.includes(normCategory) ? normCategory : 'clothes';

  let slug = createSlug(name);
  let slugCount = await Product.countDocuments({ slug });
  if (slugCount > 0) {
    slug = `${slug}-${Date.now()}`;
  }

  try {
    const product = await Product.create({
      name,
      slug,
      category: finalCategory,
      subCategory,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      images: imageUrls,
      variants: cleanVariants,
      sizeChart: sizeChartUrl,
      featured: featured === 'true' || featured === true,
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('[createProduct Error]:', err);
    res.status(400);
    throw new Error(err.message || 'Failed to create product');
  }
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

  const sizeChartFile = req.files ? req.files.find(f => f.fieldname === 'sizeChartImage') : null;
  const imageFiles = req.files ? req.files.filter(f => f.fieldname === 'images' || f.fieldname === 'image') : [];

  if (imageFiles.length > 0) {
    const newUrls = await processUploads(imageFiles);
    imageUrls = [...imageUrls, ...newUrls];
  } else if (req.files && req.files.length > 0) {
    const galleryFiles = req.files.filter(f => f.fieldname !== 'sizeChartImage');
    if (galleryFiles.length > 0) {
      const newUrls = await processUploads(galleryFiles);
      imageUrls = [...imageUrls, ...newUrls];
    }
  }

  if (req.body.sizeChart !== undefined) {
    product.sizeChart = req.body.sizeChart;
  }
  if (sizeChartFile) {
    const uploadedChart = await processUploads([sizeChartFile]);
    if (uploadedChart.length > 0) {
      product.sizeChart = uploadedChart[0];
    }
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

  if (category) {
    const normCategory = category.toLowerCase().trim();
    const validCategories = ['clothes', 'clothing', 'perfume', 'accessories', 'shoes', 'bags'];
    product.category = validCategories.includes(normCategory) ? normCategory : product.category;
  }

  if (subCategory !== undefined) product.subCategory = subCategory;
  if (description) product.description = description;
  if (price !== undefined && !isNaN(Number(price))) product.price = Number(price);
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
        parsedVariants = [];
      }
    } else if (Array.isArray(variants)) {
      parsedVariants = variants;
    }

    const existingCount = Array.isArray(existingImages) ? (typeof existingImages === 'string' ? 1 : existingImages.length) : 0;
    product.variants = parsedVariants.map(v => {
      let variantImg = v.image || '';
      if (variantImg.startsWith('NEW_INDEX_')) {
        const idx = parseInt(variantImg.replace('NEW_INDEX_', ''), 10);
        variantImg = imageUrls[existingCount + idx] || imageUrls[idx] || imageUrls[0] || '';
      }
      return {
        size: v.size || 'M',
        color: v.color || 'Default',
        colorHex: v.colorHex || '#000000',
        image: variantImg,
        stock: isNaN(Number(v.stock)) ? 0 : Math.max(0, Number(v.stock))
      };
    });
  }

  try {
    const updatedProduct = await product.save();
    res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (saveErr) {
    console.error('[updateProduct Save Error]:', saveErr);
    res.status(400);
    throw new Error(saveErr.message || 'Validation error while updating product');
  }
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
  getProductById,
  canUserReviewProduct,
  addProductReview,
  createProduct,
  updateProduct,
  deleteProduct
};
