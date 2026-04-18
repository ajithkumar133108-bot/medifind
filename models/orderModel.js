const db = require('../config/db');

async function createOrderHeader(order) {
  const result = await db.query(
    'INSERT INTO orders (user_id, pharmacy_id, total_price, delivery_type, delivery_address, status) VALUES (?, ?, ?, ?, ?, ?)',
    [order.user_id, order.pharmacy_id, order.total_price, order.delivery_type, order.delivery_address, order.status],
  );
  return result.insertId;
}

async function createOrderItem(item) {
  await db.query(
    'INSERT INTO order_items (order_id, medicine_id, quantity, price) VALUES (?, ?, ?, ?)',
    [item.order_id, item.medicine_id, item.quantity, item.price],
  );
}

async function getUserOrders(userId) {
  return db.query(
    `SELECT o.id, oi.quantity, oi.price * oi.quantity AS total_price, o.delivery_type, o.delivery_address, o.status, o.order_date,
            m.medicine_name, m.brand, m.unit, p.pharmacy_name, p.phone AS pharmacy_phone
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN medicines m ON oi.medicine_id = m.id
     JOIN pharmacies p ON o.pharmacy_id = p.id
     WHERE o.user_id = ?
     ORDER BY o.order_date DESC`,
    [userId],
  );
}

async function getPharmacyOrders(pharmacyId) {
  return db.query(
    `SELECT o.id, oi.quantity, oi.price * oi.quantity AS total_price, o.delivery_type, o.delivery_address, o.status, o.order_date,
            m.medicine_name, m.brand, m.unit, u.full_name AS user_name, u.email AS user_email, u.phone AS user_phone
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN medicines m ON oi.medicine_id = m.id
     JOIN users u ON o.user_id = u.id
     WHERE o.pharmacy_id = ?
     ORDER BY o.order_date DESC`,
    [pharmacyId],
  );
}

async function updateOrderStatus(orderId, status) {
  await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
}

async function getOrderDetails(orderId) {
  const rows = await db.query(
    `SELECT o.*, oi.quantity, oi.price, m.medicine_name, m.brand, m.unit, p.pharmacy_name, p.email AS pharmacy_email, u.full_name AS user_name, u.email AS user_email, u.phone AS user_phone
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN medicines m ON oi.medicine_id = m.id
     JOIN pharmacies p ON o.pharmacy_id = p.id
     JOIN users u ON o.user_id = u.id
     WHERE o.id = ?
     LIMIT 1`,
    [orderId],
  );
  return rows[0] || null;
}

async function getAdminStats() {
  const [u] = await db.query('SELECT COUNT(*) AS c FROM users');
  const [p] = await db.query('SELECT COUNT(*) AS c FROM pharmacies');
  const [m] = await db.query('SELECT COUNT(*) AS c FROM medicines');
  const [o] = await db.query('SELECT COUNT(*) AS c FROM orders');
  return {
    users: u.c,
    pharmacies: p.c,
    medicines: m.c,
    orders: o.c,
  };
}

module.exports = {
  createOrderHeader,
  createOrderItem,
  getUserOrders,
  getPharmacyOrders,
  updateOrderStatus,
  getOrderDetails,
  getAdminStats,
};
