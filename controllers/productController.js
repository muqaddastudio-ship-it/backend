const Product = require('../models/Product');
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

  // Default to active products unless admin specifically queries another status
  if (status) {
    query.status = status;
  } else {
    query.status = 'active';
  }

  // Category filter
  if (category) {
    query.category = category.toLowerCase();
  }

  // SubCategory filter
  if (subCategory) {
    query.subCategory = new RegExp(`^${subCategory}$`, 'i');
  }

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { subCategory: { $regex: search, $options: 'i' } }
    ];
  }

  // Size filter inside variants array
  if (size) {
    const sizeList = Array.isArray(size) ? size : size.split(',');
    query['variants.size'] = { $in: sizeList };
  }

  // Color filter inside variants array
  if (color) {
    const colorList = Array.isArray(color) ? color : color.split(',');
    query['variants.color'] = { $in: colorList };
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Sorting
  let sortOptions = { createdAt: -1 }; // default newest
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

// @desc    Get product by slug
// @route   GET /api/products/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Also fetch related products (same category or subCategory)
  const relatedProducts = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    status: 'active'
  }).limit(4);

  res.status(200).json({
    success: true,
    data: {
      product,
      relatedProducts
    }
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

  // Handle uploaded files via Multer
  if (req.files && req.files.length > 0) {
    imageUrls = await processUploads(req.files);
  } else if (bodyImages) {
    // If sent as JSON array or single string
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
  // Ensure unique slug
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

  // Append any newly uploaded images
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
  createProduct,
  updateProduct,
  deleteProduct
};
