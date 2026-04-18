const db = require('../config/db');
const medicineModel = require('../models/medicineModel');
const orderModel = require('../models/orderModel');

async function getStats(req, res) {
  try {
    const stats = await orderModel.getAdminStats();
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getUsers(req, res) {
  try {
    const rows = await db.query('SELECT id, full_name, email, phone, address, created_at FROM users ORDER BY created_at DESC');
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getPharmacies(req, res) {
  try {
    const rows = await db.query('SELECT id, pharmacy_name, owner_name, email, city, phone, is_active FROM pharmacies ORDER BY pharmacy_name');
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getMedicines(req, res) {
  try {
    const rows = await medicineModel.getAllMedicinesWithPharmacy();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getOrders(req, res) {
  try {
    const rows = await db.query(
      `SELECT o.id, oi.quantity, oi.price * oi.quantity AS total_price, o.delivery_type, o.status, o.order_date, m.medicine_name, m.brand, p.pharmacy_name, u.full_name AS user_name
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN medicines m ON oi.medicine_id = m.id
       JOIN pharmacies p ON o.pharmacy_id = p.id
       JOIN users u ON o.user_id = u.id
       ORDER BY o.order_date DESC`,
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function togglePharmacy(req, res) {
  const { id, active } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required.' });
  try {
    await db.query('UPDATE pharmacies SET is_active = ? WHERE id = ?', [active ? 1 : 0, parseInt(id, 10)]);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { getStats, getUsers, getPharmacies, getMedicines, getOrders, togglePharmacy };
