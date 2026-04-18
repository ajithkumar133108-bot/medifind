const db = require('../config/db');

async function findPharmacyByEmail(email) {
  const rows = await db.query('SELECT * FROM pharmacies WHERE email = ?', [email]);
  return rows[0] || null;
}

async function getPharmacyById(id) {
  const rows = await db.query('SELECT id, owner_name, pharmacy_name, email, phone, address, city, latitude, longitude, is_active, created_at FROM pharmacies WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createPharmacy(pharmacy) {
  const {
    owner_name,
    pharmacy_name,
    email,
    password,
    phone,
    address,
    city,
    latitude,
    longitude,
  } = pharmacy;
  const result = await db.query(
    'INSERT INTO pharmacies (owner_name, pharmacy_name, email, password, phone, address, city, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [owner_name, pharmacy_name, email, password, phone, address, city, latitude, longitude],
  );
  return result.insertId;
}

async function getPharmacies() {
  return db.query('SELECT * FROM pharmacies ORDER BY pharmacy_name');
}

async function togglePharmacy(id, active) {
  await db.query('UPDATE pharmacies SET is_active = ? WHERE id = ?', [active ? 1 : 0, id]);
}

module.exports = { findPharmacyByEmail, getPharmacyById, createPharmacy, getPharmacies, togglePharmacy };
