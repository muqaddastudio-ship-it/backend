const express = require('express');
const {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  canUserReviewProduct,
  addProductReview,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { verifyToken, optionalAuth, isAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);

router.get('/id/:id', verifyToken, isAdmin, getProductById);  // Admin edit by ID
router.get('/:slug', getProductBySlug);

// Customer Review Routes (Verified Buyer Only)
router.get('/:id/can-review', optionalAuth, canUserReviewProduct);
router.post('/:id/reviews', verifyToken, addProductReview);

// Admin Routes
router.post('/', verifyToken, isAdmin, upload.any(), createProduct);
router.put('/:id', verifyToken, isAdmin, upload.any(), updateProduct);
router.delete('/:id', verifyToken, isAdmin, deleteProduct);

module.exports = router;
