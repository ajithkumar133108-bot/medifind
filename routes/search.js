const express = require('express');
const { searchMedicines, aiSuggest, getNearbyPharmacies } = require('../controllers/searchController');

const router = express.Router();
router.get('/search', searchMedicines);
router.post('/ai/suggest', aiSuggest);
router.get('/pharmacies/nearby', getNearbyPharmacies);
module.exports = router;
