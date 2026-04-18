const express = require('express');
const { requireRole } = require('../middleware/auth');
const { getStats, getUsers, getPharmacies, getMedicines, getOrders, togglePharmacy } = require('../controllers/adminController');

const router = express.Router();
router.use(requireRole('ADMIN'));
router.get('/admin/stats', getStats);
router.get('/admin/users', getUsers);
router.get('/admin/pharmacies', getPharmacies);
router.get('/admin/medicines', getMedicines);
router.get('/admin/orders', getOrders);
router.post('/admin/pharmacy/toggle', togglePharmacy);
module.exports = router;
