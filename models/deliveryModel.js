const db = require('../config/db');

async function findDeliveryPersonByEmail(email) {
  const rows = await db.query('SELECT * FROM delivery_persons WHERE email = ?', [email]);
  return rows[0] || null;
}

async function getDeliveryPersonById(id) {
  const rows = await db.query(
    'SELECT id, full_name, email, phone, is_active, created_at FROM delivery_persons WHERE id = ?',
    [id],
  );
  return rows[0] || null;
}

async function createDeliveryPerson(data) {
  const result = await db.query(
    'INSERT INTO delivery_persons (full_name, email, password, phone, is_active) VALUES (?, ?, ?, ?, ?)',
    [data.full_name, data.email, data.password, data.phone || '', data.is_active == null ? 1 : data.is_active],
  );
  return result.insertId;
}

async function assignDelivery(orderId, deliveryPersonId) {
  await db.query(
    `INSERT INTO deliveries (order_id, delivery_person_id, status)
     VALUES (?, ?, 'ASSIGNED')
     ON DUPLICATE KEY UPDATE delivery_person_id = VALUES(delivery_person_id), status='ASSIGNED'`,
    [orderId, deliveryPersonId],
  );
}

async function getDeliveryByOrderId(orderId) {
  const rows = await db.query(
    `SELECT d.*, dp.full_name AS delivery_name, dp.email AS delivery_email, dp.phone AS delivery_phone
     FROM deliveries d
     JOIN delivery_persons dp ON dp.id = d.delivery_person_id
     WHERE d.order_id = ?
     LIMIT 1`,
    [orderId],
  );
  return rows[0] || null;
}

async function listAssignedDeliveries(deliveryPersonId) {
  return db.query(
    `SELECT d.order_id, d.status, d.current_latitude, d.current_longitude, d.updated_at,
            o.user_id, o.pharmacy_id, o.delivery_type, o.delivery_address, o.status AS order_status, o.total_price, o.order_date,
            u.full_name AS user_name, u.phone AS user_phone, u.latitude AS user_latitude, u.longitude AS user_longitude,
            p.pharmacy_name, p.address AS pharmacy_address, p.latitude AS pharmacy_latitude, p.longitude AS pharmacy_longitude
     FROM deliveries d
     JOIN orders o ON o.id = d.order_id
     JOIN users u ON u.id = o.user_id
     JOIN pharmacies p ON p.id = o.pharmacy_id
     WHERE d.delivery_person_id = ?
     ORDER BY d.updated_at DESC`,
    [deliveryPersonId],
  );
}

async function claimUnassignedDispatchedOrders(deliveryPersonId, limit = 5) {
  const rows = await db.query(
    `SELECT o.id
     FROM orders o
     LEFT JOIN deliveries d ON d.order_id = o.id
     WHERE o.status = 'DISPATCHED'
       AND o.delivery_type = 'HOME_DELIVERY'
       AND d.id IS NULL
     ORDER BY o.order_date ASC
     LIMIT ?`,
    [Math.max(1, Number(limit) || 5)],
  );

  for (const row of rows) {
    await assignDelivery(row.id, deliveryPersonId);
  }

  return rows.length;
}

async function updateDelivery(orderId, fields) {
  const { status, lat, lng } = fields;
  await db.query(
    `UPDATE deliveries
     SET status = COALESCE(?, status),
         current_latitude = COALESCE(?, current_latitude),
         current_longitude = COALESCE(?, current_longitude)
     WHERE order_id = ?`,
    [status || null, lat ?? null, lng ?? null, orderId],
  );
}

module.exports = {
  findDeliveryPersonByEmail,
  getDeliveryPersonById,
  createDeliveryPerson,
  assignDelivery,
  getDeliveryByOrderId,
  listAssignedDeliveries,
  claimUnassignedDispatchedOrders,
  updateDelivery,
};

