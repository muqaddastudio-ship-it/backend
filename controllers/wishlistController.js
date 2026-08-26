const Wishlist = require('../models/Wishlist');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  res.status(200).json({
    success: true,
    data: wishlist
  });
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [productId] });
  } else {
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }
  }

  const updatedWishlist = await Wishlist.findById(wishlist._id).populate('products');
  res.status(200).json({
    success: true,
    data: updatedWishlist
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
    await wishlist.save();
  }

  const updatedWishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
  res.status(200).json({
    success: true,
    data: updatedWishlist || { user: req.user._id, products: [] }
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
