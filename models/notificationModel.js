const db = require('../config/db');

async function createNotification(userId, pharmacyId, message, type = 'INFO') {
  await db.query(
    'INSERT INTO notifications (user_id, pharmacy_id, message, type) VALUES (?, ?, ?, ?)',
    [userId || null, pharmacyId || null, message, type],
  );
}

async function getNotificationsForUser(userId) {
  return db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);
}

async function getNotificationsForPharmacy(pharmacyId) {
  return db.query('SELECT * FROM notifications WHERE pharmacy_id = ? ORDER BY created_at DESC LIMIT 20', [pharmacyId]);
}

async function getAllNotifications() {
  return db.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 30');
}

async function markNotificationRead(id) {
  await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
}

async function markAllReadForUser(userId) {
  await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
}

async function markAllReadForPharmacy(pharmacyId) {
  await db.query('UPDATE notifications SET is_read = 1 WHERE pharmacy_id = ?', [pharmacyId]);
}

module.exports = {
  createNotification,
  getNotificationsForUser,
  getNotificationsForPharmacy,
  getAllNotifications,
  markNotificationRead,
  markAllReadForUser,
  markAllReadForPharmacy,
};
