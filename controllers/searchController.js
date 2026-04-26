const medicineModel = require("../models/medicineModel");
const db = require("../config/db");
const { haversine } = require("../utils/haversine");
const { suggestMedicines } = require("../utils/ai");

async function searchMedicines(req, res) {
  const {
    medicine = "",
    lat,
    lng,
    radius = 50,
    category = "",
    minPrice = "",
    maxPrice = "",
  } = req.query;
  const name = (medicine || "").trim();
  if (!name) return res.status(400).json({ error: "Medicine name required." });

  const parsedLat = Number.parseFloat(lat);
  const parsedLng = Number.parseFloat(lng);
  const hasLocation = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);
  if (req.query.radius !== undefined && !hasLocation) {
    return res
      .status(400)
      .json({
        error: "Location latitude and longitude required for radius filtering.",
      });
  }

  try {
    const rows = await medicineModel.searchMedicines(name);
    let results = rows.map((r) => ({
      ...r,
      distanceKm: hasLocation
        ? haversine(parsedLat, parsedLng, +r.plat, +r.plng)
        : 0,
    }));
    if (hasLocation) {
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
  const { symptoms = "", lat, lng, radius = 50 } = req.body;
  if (!symptoms)
    return res.status(400).json({ error: "Provide symptom text." });

  const parsedLat = Number.parseFloat(lat);
  const parsedLng = Number.parseFloat(lng);
  const hasLocation = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  try {
    const recommendation = suggestMedicines(symptoms);
    const medicineName = recommendation.medicines[0] || "";
    let pharmacies = [];
    if (medicineName) {
      const rows = await medicineModel.searchMedicines(medicineName);
      pharmacies = rows.map((row) => ({
        id: row.pharmacy_id,
        pharmacy_name: row.pharmacy_name,
        pharmacy_address: row.pharmacy_address,
        phone: row.pharmacy_phone,
        distanceKm: hasLocation
          ? haversine(parsedLat, parsedLng, +row.plat, +row.plng)
          : 0,
      }));
      if (hasLocation) {
        pharmacies = pharmacies
          .filter(
            (p) =>
              Number.isFinite(p.distanceKm) &&
              p.distanceKm <= parseFloat(radius),
          )
          .sort((a, b) => a.distanceKm - b.distanceKm);
      }
    }
    return res.json({ ...recommendation, pharmacies });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getNearbyPharmacies(req, res) {
  const { lat, lng, radius = 50 } = req.query;
  const parsedLat = Number.parseFloat(lat);
  const parsedLng = Number.parseFloat(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return res.status(400).json({ error: "Latitude and longitude required." });
  }

  try {
    const rows = await db.query(
      "SELECT id, pharmacy_name, address, phone, latitude, longitude FROM pharmacies WHERE is_active = 1",
    );
    const results = rows
      .map((row) => ({
        ...row,
        distanceKm: haversine(
          parsedLat,
          parsedLng,
          +row.latitude,
          +row.longitude,
        ),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.distanceKm) &&
          item.distanceKm <= parseFloat(radius),
      )
      .sort((a, b) => a.distanceKm - b.distanceKm);
    return res.json({ count: results.length, results });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { searchMedicines, aiSuggest, getNearbyPharmacies };
