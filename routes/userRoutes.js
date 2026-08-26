const express = require('express');
const {
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.put('/me', updateProfile);
router.post('/me/addresses', addAddress);
router.put('/me/addresses/:addressId', updateAddress);
router.delete('/me/addresses/:addressId', deleteAddress);

module.exports = router;
