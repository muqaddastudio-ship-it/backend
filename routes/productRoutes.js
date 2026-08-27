const express = require('express');
const {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
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
router.get('/:slug', getProductBySlug);

// Customer Review Routes (Verified Buyer Only)
router.get('/:id/can-review', verifyToken, canUserReviewProduct);
router.post('/:id/reviews', verifyToken, addProductReview);

// Admin Routes
router.post('/', verifyToken, isAdmin, upload.array('images', 5), createProduct);
router.put('/:id', verifyToken, isAdmin, upload.array('images', 5), updateProduct);
router.delete('/:id', verifyToken, isAdmin, deleteProduct);

module.exports = router;
