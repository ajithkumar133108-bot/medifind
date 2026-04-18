const express = require('express');
const { checkoutCart, getUserOrders, getPharmacyOrders, updateOrderStatus } = require('../controllers/orderController');

const router = express.Router();
router.post('/cart/checkout', checkoutCart);
router.get('/orders/user', getUserOrders);
router.get('/orders/pharmacy', getPharmacyOrders);
router.post('/order/status', updateOrderStatus);
module.exports = router;
