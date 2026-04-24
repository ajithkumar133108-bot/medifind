const express = require('express');
const { assignDelivery, myDeliveries, updateMyDelivery } = require('../controllers/deliveryController');

const router = express.Router();

router.post('/delivery/assign', assignDelivery);
router.get('/delivery/my', myDeliveries);
router.post('/delivery/update', updateMyDelivery);

module.exports = router;

