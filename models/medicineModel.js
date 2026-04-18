const db = require('../config/db');

async function searchMedicines(name) {
  return db.query(
    `SELECT m.id, m.medicine_name, m.brand, m.category, m.price, m.stock_quantity, m.unit,
            m.requires_prescription, m.delivery_available, m.description, m.pharmacy_id,
            p.pharmacy_name, p.address AS pharmacy_address, p.phone AS pharmacy_phone,
            p.latitude AS plat, p.longitude AS plng
     FROM medicines m
     JOIN pharmacies p ON m.pharmacy_id = p.id
     WHERE LOWER(m.medicine_name) LIKE ? AND m.stock_quantity > 0 AND p.is_active = 1
     ORDER BY m.medicine_name`,
    ['%' + name.toLowerCase() + '%'],
  );
}

async function getMedicinesByPharmacy(pharmacyId) {
  return db.query('SELECT * FROM medicines WHERE pharmacy_id = ? ORDER BY medicine_name', [pharmacyId]);
}

async function getMedicineById(id) {
  const rows = await db.query('SELECT * FROM medicines WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createMedicine(data) {
  const result = await db.query(
    'INSERT INTO medicines (pharmacy_id, medicine_name, brand, category, price, stock_quantity, unit, requires_prescription, delivery_available, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      data.pharmacy_id,
      data.medicine_name,
      data.brand,
      data.category,
      data.price,
      data.stock_quantity,
      data.unit,
      data.requires_prescription ? 1 : 0,
      data.delivery_available !== false ? 1 : 0,
      data.description,
    ],
  );
  return result.insertId;
}

async function updateMedicine(data) {
  await db.query(
    'UPDATE medicines SET medicine_name = ?, brand = ?, category = ?, price = ?, stock_quantity = ?, unit = ?, requires_prescription = ?, delivery_available = ?, description = ? WHERE id = ? AND pharmacy_id = ?',
    [
      data.medicine_name,
      data.brand,
      data.category,
      data.price,
      data.stock_quantity,
      data.unit,
      data.requires_prescription ? 1 : 0,
      data.delivery_available !== false ? 1 : 0,
      data.description,
      data.id,
      data.pharmacy_id,
    ],
  );
}

async function deleteMedicine(id, pharmacyId) {
  await db.query('DELETE FROM medicines WHERE id = ? AND pharmacy_id = ?', [id, pharmacyId]);
}

async function updateStock(medicineId, quantity) {
  await db.query('UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?', [quantity, medicineId, quantity]);
}

async function getAllMedicinesWithPharmacy() {
  return db.query(
    'SELECT m.*, p.pharmacy_name FROM medicines m JOIN pharmacies p ON m.pharmacy_id = p.id ORDER BY p.pharmacy_name, m.medicine_name',
  );
}

module.exports = {
  searchMedicines,
  getMedicinesByPharmacy,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock,
  getAllMedicinesWithPharmacy,
};
