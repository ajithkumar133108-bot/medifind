const medicineModel = require('../models/medicineModel');

async function getMedicines(req, res) {
  if (!req.user || req.user.role !== 'PHARMACY') {
    return res.status(401).json({ error: 'Login required.' });
  }
  try {
    const rows = await medicineModel.getMedicinesByPharmacy(req.user.id);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function addMedicine(req, res) {
  if (!req.user || req.user.role !== 'PHARMACY') {
    return res.status(401).json({ error: 'Login required.' });
  }
  const data = req.body;
  if (!data.medicineName || data.price === undefined || data.stockQuantity === undefined) {
    return res.status(400).json({ error: 'Name, price and stock required.' });
  }
  try {
    const id = await medicineModel.createMedicine({
      pharmacy_id: req.user.id,
      medicine_name: data.medicineName.trim(),
      brand: data.brand || '',
      category: data.category || 'General',
      price: parseFloat(data.price),
      stock_quantity: parseInt(data.stockQuantity, 10),
      unit: data.unit || 'Tablet',
      requires_prescription: data.requiresPrescription,
      delivery_available: data.deliveryAvailable,
      description: data.description || '',
    });
    return res.json({ success: true, id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updateMedicine(req, res) {
  if (!req.user || req.user.role !== 'PHARMACY') {
    return res.status(401).json({ error: 'Login required.' });
  }
  const data = req.body;
  if (!data.id) return res.status(400).json({ error: 'ID required.' });
  try {
    await medicineModel.updateMedicine({
      ...data,
      pharmacy_id: req.user.id,
      medicine_name: data.medicineName.trim(),
      stock_quantity: parseInt(data.stockQuantity, 10),
      price: parseFloat(data.price),
      requires_prescription: data.requiresPrescription,
      delivery_available: data.deliveryAvailable,
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function deleteMedicine(req, res) {
  if (!req.user || req.user.role !== 'PHARMACY') {
    return res.status(401).json({ error: 'Login required.' });
  }
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required.' });
  try {
    await medicineModel.deleteMedicine(parseInt(id, 10), req.user.id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { getMedicines, addMedicine, updateMedicine, deleteMedicine };
