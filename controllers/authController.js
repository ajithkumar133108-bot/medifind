const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const config = require('../config/config');
const userModel = require('../models/userModel');
const pharmacyModel = require('../models/pharmacyModel');
const deliveryModel = require('../models/deliveryModel');

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
  const trimmedEmail = validator.escape(email.trim());

  if (!trimmedEmail || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }

  if (normalizedRole !== 'ADMIN' && !validator.isEmail(trimmedEmail)) {
    return res.status(400).json({ error: 'Invalid email format.' });
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

    if (normalizedRole === 'DELIVERY') {
      const agent = await deliveryModel.findDeliveryPersonByEmail(trimmedEmail);
      if (!agent) return res.status(401).json({ error: 'Wrong email or password.' });
      const validPassword = await comparePasswords(agent.password, password);
      if (!validPassword) return res.status(401).json({ error: 'Wrong email or password.' });
      if (!agent.is_active) return res.status(401).json({ error: 'Account deactivated.' });
      const token = createToken({ id: agent.id, role: 'DELIVERY', name: agent.full_name, email: agent.email });
      sendTokenCookie(res, token);
      return res.json({ success: true, role: 'DELIVERY', name: agent.full_name, id: agent.id });
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
  const sanitizedFullName = validator.escape(fullName.trim());
  const sanitizedEmail = validator.escape(email.trim());
  const sanitizedPhone = phone ? validator.escape(phone.trim()) : '';
  const sanitizedAddress = address ? validator.escape(address.trim()) : '';

  if (!sanitizedFullName || !sanitizedEmail || !password) {
    return res.status(400).json({ error: 'Name, email and password required.' });
  }

  if (!validator.isEmail(sanitizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const existing = await userModel.findUserByEmail(sanitizedEmail);
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await userModel.createUser({
      full_name: sanitizedFullName,
      email: sanitizedEmail,
      password: hashedPassword,
      phone: sanitizedPhone,
      address: sanitizedAddress,
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
  const sanitizedOwnerName = validator.escape(ownerName.trim());
  const sanitizedPharmacyName = validator.escape(pharmacyName.trim());
  const sanitizedEmail = validator.escape(email.trim());
  const sanitizedPhone = phone ? validator.escape(phone.trim()) : '';
  const sanitizedAddress = address ? validator.escape(address.trim()) : '';
  const sanitizedCity = city ? validator.escape(city.trim()) : '';

  if (!sanitizedOwnerName || !sanitizedPharmacyName || !sanitizedEmail || !password) {
    return res.status(400).json({ error: 'All fields required.' });
  }

  if (!validator.isEmail(sanitizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const existing = await pharmacyModel.findPharmacyByEmail(sanitizedEmail);
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const pharmacyId = await pharmacyModel.createPharmacy({
      owner_name: sanitizedOwnerName,
      pharmacy_name: sanitizedPharmacyName,
      email: sanitizedEmail,
      password: hashedPassword,
      phone: sanitizedPhone,
      address: sanitizedAddress,
      city: sanitizedCity,
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
    });
    return res.json({ success: true, id: pharmacyId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function registerDelivery(req, res) {
  const { fullName, email, password, phone } = req.body;
  const sanitizedFullName = validator.escape((fullName || '').trim());
  const sanitizedEmail = validator.escape((email || '').trim());
  const sanitizedPhone = phone ? validator.escape(phone.trim()) : '';

  if (!sanitizedFullName || !sanitizedEmail || !password) {
    return res.status(400).json({ error: 'Name, email and password required.' });
  }

  if (!validator.isEmail(sanitizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const existing = await deliveryModel.findDeliveryPersonByEmail(sanitizedEmail);
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const deliveryId = await deliveryModel.createDeliveryPerson({
      full_name: sanitizedFullName,
      email: sanitizedEmail,
      password: hashedPassword,
      phone: sanitizedPhone,
      is_active: 1,
    });
    return res.json({ success: true, id: deliveryId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { me, logout, login, registerUser, registerPharmacy, registerDelivery };
