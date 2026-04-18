const medicineModel = require('../models/medicineModel');
const db = require('../config/db');
const { haversine } = require('../utils/haversine');
const { suggestMedicines } = require('../utils/ai');

async function searchMedicines(req, res) {
  const { medicine = '', lat = 0, lng = 0, radius = 50, category = '', minPrice = '', maxPrice = '' } = req.query;
  const name = (medicine || '').trim();
  if (!name) return res.status(400).json({ error: 'Medicine name required.' });

  try {
    const rows = await medicineModel.searchMedicines(name);
    let results = rows.map((r) => ({
      ...r,
      distanceKm: lat && lng ? haversine(parseFloat(lat), parseFloat(lng), +r.plat, +r.plng) : 0,
    }));
    if (lat && lng) {
      results = results.filter((r) => r.distanceKm <= parseFloat(radius));
    }
    if (category) {
      results = results.filter((r) => r.category === category);
    }
    if (minPrice) {
      results = results.filter((r) => r.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      results = results.filter((r) => r.price <= parseFloat(maxPrice));
    }
    results.sort((a, b) => a.distanceKm - b.distanceKm);
    return res.json({ count: results.length, results });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function aiSuggest(req, res) {
  const { symptoms = '', lat, lng, radius = 50 } = req.body;
  if (!symptoms) return res.status(400).json({ error: 'Provide symptom text.' });

  try {
    const recommendation = suggestMedicines(symptoms);
    const medicineName = recommendation.medicines[0] || ''; 
    let pharmacies = [];
    if (medicineName) {
      const rows = await medicineModel.searchMedicines(medicineName);
      pharmacies = rows.map((row) => ({
        id: row.pharmacy_id,
        pharmacy_name: row.pharmacy_name,
        pharmacy_address: row.pharmacy_address,
        phone: row.pharmacy_phone,
        distanceKm: lat && lng ? haversine(parseFloat(lat), parseFloat(lng), +row.plat, +row.plng) : 0,
      }));
      if (lat && lng) {
        pharmacies = pharmacies.filter((p) => p.distanceKm <= parseFloat(radius));
        pharmacies.sort((a, b) => a.distanceKm - b.distanceKm);
      }
    }
    return res.json({ ...recommendation, pharmacies });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getNearbyPharmacies(req, res) {
  const { lat, lng, radius = 50 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'Latitude and longitude required.' });

  try {
    const rows = await db.query('SELECT id, pharmacy_name, address, phone, latitude, longitude FROM pharmacies WHERE is_active = 1');
    const results = rows
      .map((row) => ({
        ...row,
        distanceKm: haversine(parseFloat(lat), parseFloat(lng), +row.latitude, +row.longitude),
      }))
      .filter((item) => item.distanceKm <= parseFloat(radius))
      .sort((a, b) => a.distanceKm - b.distanceKm);
    return res.json({ count: results.length, results });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { searchMedicines, aiSuggest, getNearbyPharmacies };
