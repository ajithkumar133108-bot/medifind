const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const userModel = require('../models/userModel');
const pharmacyModel = require('../models/pharmacyModel');

function createToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

async function comparePasswords(storedPassword, password) {
  if (!storedPassword) return false;
  if (storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$')) {
    return bcrypt.compare(password, storedPassword);
  }
  return storedPassword === password;
}

function sendTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

async function me(req, res) {
  if (!req.user) {
    return res.json({ role: null });
  }
  const { id, role, name, email } = req.user;
  return res.json({ id, role, name, email });
}

async function logout(req, res) {
  res.clearCookie('token', { path: '/' });
  return res.redirect('/');
}

async function login(req, res) {
  const { role = 'USER', email = '', password = '' } = req.body;
  const normalizedRole = role.toUpperCase();
  const trimmedEmail = email.trim();

  if (!trimmedEmail || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }

  try {
    if (normalizedRole === 'ADMIN') {
      if (trimmedEmail !== config.admin.email || password !== config.admin.password) {
        return res.status(401).json({ error: 'Wrong admin credentials.' });
      }
      const token = createToken({ id: 0, role: 'ADMIN', name: 'Administrator', email: trimmedEmail });
      sendTokenCookie(res, token);
      return res.json({ success: true, role: 'ADMIN', name: 'Administrator' });
    }

    if (normalizedRole === 'PHARMACY') {
      const pharmacy = await pharmacyModel.findPharmacyByEmail(trimmedEmail);
      if (!pharmacy) return res.status(401).json({ error: 'Wrong email or password.' });
      const validPassword = await comparePasswords(pharmacy.password, password);
      if (!validPassword) return res.status(401).json({ error: 'Wrong email or password.' });
      if (!pharmacy.is_active) return res.status(401).json({ error: 'Account deactivated by admin.' });
      const token = createToken({ id: pharmacy.id, role: 'PHARMACY', name: pharmacy.pharmacy_name, email: pharmacy.email });
      sendTokenCookie(res, token);
      return res.json({ success: true, role: 'PHARMACY', name: pharmacy.pharmacy_name, id: pharmacy.id });
    }

    const user = await userModel.findUserByEmail(trimmedEmail);
    if (!user) return res.status(401).json({ error: 'Wrong email or password.' });
    const validPassword = await comparePasswords(user.password, password);
    if (!validPassword) return res.status(401).json({ error: 'Wrong email or password.' });
    const token = createToken({ id: user.id, role: 'USER', name: user.full_name, email: user.email });
    sendTokenCookie(res, token);
    return res.json({ success: true, role: 'USER', name: user.full_name, id: user.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function registerUser(req, res) {
  const { fullName, email, password, phone, address, latitude, longitude } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password required.' });
  }
  try {
    const existing = await userModel.findUserByEmail(email.trim());
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await userModel.createUser({
      full_name: fullName.trim(),
      email: email.trim(),
      password: hashedPassword,
      phone: phone || '',
      address: address || '',
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
    });
    return res.json({ success: true, id: userId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function registerPharmacy(req, res) {
  const { ownerName, pharmacyName, email, password, phone, address, city, latitude, longitude } = req.body;
  if (!ownerName || !pharmacyName || !email || !password) {
    return res.status(400).json({ error: 'All fields required.' });
  }
  try {
    const existing = await pharmacyModel.findPharmacyByEmail(email.trim());
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const pharmacyId = await pharmacyModel.createPharmacy({
      owner_name: ownerName.trim(),
      pharmacy_name: pharmacyName.trim(),
      email: email.trim(),
      password: hashedPassword,
      phone: phone || '',
      address: address || '',
      city: city || '',
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
    });
    return res.json({ success: true, id: pharmacyId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { me, logout, login, registerUser, registerPharmacy };
