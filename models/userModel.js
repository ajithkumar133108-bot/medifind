const db = require('../config/db');

async function findUserByEmail(email) {
  const rows = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function getUserById(id) {
  const rows = await db.query('SELECT id, full_name, email, phone, address, latitude, longitude, created_at FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createUser(user) {
  const { full_name, email, password, phone, address, latitude, longitude } = user;
  const result = await db.query(
    'INSERT INTO users (full_name, email, password, phone, address, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [full_name, email, password, phone, address, latitude, longitude],
  );
  return result.insertId;
}

module.exports = { findUserByEmail, getUserById, createUser };
