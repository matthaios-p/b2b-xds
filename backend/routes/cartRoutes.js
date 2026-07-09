const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');

// All routes are protected
router.use(authMiddleware);

// GET /api/cart - fetch current user's cart
router.get('/', cartController.getCart);

// POST /api/cart - add item to cart
router.post('/', cartController.addToCart);

// PATCH /api/cart/:id - update quantity
router.patch('/:id', cartController.updateCartItem);

// DELETE /api/cart/:id - remove item
router.delete('/:id', cartController.removeFromCart);

module.exports = router;
