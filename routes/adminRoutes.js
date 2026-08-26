const express = require('express');
const { getAdminStats } = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, isAdmin);

router.get('/stats', getAdminStats);

module.exports = router;
