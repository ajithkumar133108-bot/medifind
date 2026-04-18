const express = require('express');
const { getMedicines, addMedicine, updateMedicine, deleteMedicine } = require('../controllers/medicineController');

const router = express.Router();
router.get('/medicines', getMedicines);
router.post('/medicines/add', addMedicine);
router.post('/medicines/update', updateMedicine);
router.post('/medicines/delete', deleteMedicine);
module.exports = router;
