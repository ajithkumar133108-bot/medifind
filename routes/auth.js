const express = require('express');
const { me, logout, login, registerUser, registerPharmacy } = require('../controllers/authController');

const router = express.Router();
router.get('/me', me);
router.post('/login', login);
router.get('/logout', logout);
router.post('/register/user', registerUser);
router.post('/register/pharmacy', registerPharmacy);
module.exports = router;
